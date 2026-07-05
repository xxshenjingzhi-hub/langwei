const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { readDb, writeDb } = require("./storage");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 5173);

const resourceList = [
  "projects",
  "tasks",
  "materials",
  "purchases",
  "purchaseItems",
  "receipts",
  "outbounds"
];

const resources = new Set(resourceList);

const staticTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function errorCodeForStatus(status) {
  if (status === 400) return "BAD_REQUEST";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 405) return "METHOD_NOT_ALLOWED";
  return "SERVER_ERROR";
}

function sendError(res, status, message, code = errorCodeForStatus(status), details = null) {
  sendJson(res, status, { error: { code, message, ...(details ? { details } : {}) } });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("请求体不是合法 JSON");
    error.statusCode = 400;
    throw error;
  }
}

function splitApiPath(url) {
  return new URL(url, "http://localhost").pathname.split("/").filter(Boolean);
}

function ensureCollections(db) {
  db.settings = db.settings || {};
  resourceList.forEach((resource) => {
    db[resource] = Array.isArray(db[resource]) ? db[resource] : [];
  });
  return db;
}

function safeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function findById(db, resource, id) {
  return db[resource]?.find((item) => item.id === id);
}

function requireFields(item, fields) {
  return fields.filter((field) => item[field] === undefined || item[field] === null || item[field] === "");
}

function dateValue(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isEndedProject(project) {
  return ["已结束", "已交付", "已关闭", "取消"].includes(project.status);
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

function countBy(items, getter) {
  return items.reduce((result, item) => {
    const key = getter(item) || "未填写";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function rowsFromCounts(counts) {
  return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

function projectCompletion(db, projectId) {
  const tasks = db.tasks.filter((task) => task.projectId === projectId && task.status !== "取消");
  return pct(tasks.filter((task) => task.status === "已完成").length, tasks.length);
}

function projectIdForPurchaseItem(db, purchaseItem) {
  const purchase = findById(db, "purchases", purchaseItem?.purchaseId);
  return purchase?.projectId || "";
}

function purchaseItemIdsForProject(db, projectId) {
  return purchaseItemsForProject(db, projectId).map((item) => item.id);
}

function validateItem(db, resource, item, editingId = "") {
  const required = {
    projects: ["name", "code", "type", "status"],
    tasks: ["projectId", "name", "type", "status"],
    materials: ["projectId", "name"],
    purchases: ["projectId", "name"],
    purchaseItems: ["purchaseId", "itemName"],
    receipts: ["purchaseItemId", "storedQty"],
    outbounds: ["purchaseItemId", "issuedQty"]
  };
  const missing = requireFields(item, required[resource] || []);
  if (missing.length) return `${missing.join(", ")} 为必填字段`;

  if (item.projectId && !findById(db, "projects", item.projectId)) return "所属项目不存在";
  if (item.purchaseId && !findById(db, "purchases", item.purchaseId)) return "所属采购记录不存在";
  if (item.materialId && !findById(db, "materials", item.materialId)) return "关联 BOM 项不存在";
  if (item.purchaseItemId && !findById(db, "purchaseItems", item.purchaseItemId)) return "关联采购明细不存在";

  const numericFields = {
    materials: ["quantityPerSet", "totalQuantity", "unitPrice"],
    purchases: ["totalAmount"],
    purchaseItems: ["quantity", "unitPrice", "totalPrice"],
    receipts: ["arrivalQty", "storedQty"],
    outbounds: ["issuedQty"]
  }[resource] || [];
  const invalidNumber = numericFields.find((field) => item[field] !== "" && item[field] !== undefined && item[field] !== null && (!Number.isFinite(Number(item[field])) || Number(item[field]) < 0));
  if (invalidNumber) return `${invalidNumber} 必须是非负数字`;

  if (resource === "tasks") {
    const planStart = dateValue(item.startDate);
    const planEnd = dateValue(item.due);
    const actualStart = dateValue(item.actualStart);
    const actualEnd = dateValue(item.actualEnd);
    if (item.startDate && !planStart) return "计划开始日期格式不正确";
    if (item.due && !planEnd) return "计划截止日期格式不正确";
    if (planStart && planEnd && planEnd < planStart) return "计划截止日期不能早于计划开始日期";
    if (item.actualStart && !actualStart) return "实际开始日期格式不正确";
    if (item.actualEnd && !actualEnd) return "实际结束日期格式不正确";
    if (actualStart && actualEnd && actualEnd < actualStart) return "实际结束日期不能早于实际开始日期";
  }

  if (resource === "receipts") {
    const purchaseItem = findById(db, "purchaseItems", item.purchaseItemId);
    const purchasedQty = safeNumber(purchaseItem?.quantity);
    const existingStored = db.receipts
      .filter((record) => record.purchaseItemId === item.purchaseItemId && record.id !== editingId)
      .reduce((sum, record) => sum + safeNumber(record.storedQty), 0);
    if (purchasedQty && existingStored + safeNumber(item.storedQty) > purchasedQty) {
      return `入库数量不能超过采购数量 ${purchasedQty}`;
    }
    if (item.status && !["部分入库", "已入库"].includes(item.status)) return "入库状态只支持部分入库、已入库";
  }

  if (resource === "outbounds") {
    const inventory = inventoryForPurchaseItem(db, item.purchaseItemId, editingId);
    if (safeNumber(item.issuedQty) > inventory.stock) {
      return `当前可出库库存为 ${inventory.stock}`;
    }
    if (item.status && !["部分出库", "已出库"].includes(item.status)) return "出库状态只支持部分出库、已出库";
  }

  return "";
}

function validateState(next) {
  const db = ensureCollections(structuredClone(next));
  for (const resource of resourceList) {
    for (const item of db[resource]) {
      const validationError = validateItem(db, resource, item, item.id);
      if (validationError) return `${resource}.${item.id || "new"}: ${validationError}`;
    }
  }
  return "";
}

function filterList(db, resource, query) {
  let rows = [...db[resource]];
  const q = String(query.get("q") || "").trim().toLowerCase();
  const filters = ["projectId", "purchaseId", "materialId", "purchaseItemId", "status", "supplier", "type"];

  filters.forEach((field) => {
    const value = query.get(field);
    if (value) rows = rows.filter((item) => String(item[field] || "") === value);
  });

  if (query.get("projectId") && resource === "purchaseItems") {
    rows = rows.filter((item) => projectIdForPurchaseItem(db, item) === query.get("projectId"));
  }
  if (query.get("projectId") && ["receipts", "outbounds"].includes(resource)) {
    const purchaseItemIds = new Set(purchaseItemIdsForProject(db, query.get("projectId")));
    rows = rows.filter((item) => purchaseItemIds.has(item.purchaseItemId));
  }

  if (q) {
    rows = rows.filter((item) => Object.values(item).some((value) => String(value ?? "").toLowerCase().includes(q)));
  }

  const sort = query.get("sort");
  if (sort) {
    const desc = sort.startsWith("-");
    const field = desc ? sort.slice(1) : sort;
    rows.sort((a, b) => String(a[field] ?? "").localeCompare(String(b[field] ?? ""), "zh-CN", { numeric: true }) * (desc ? -1 : 1));
  }

  const limit = Number(query.get("limit") || 0);
  if (Number.isFinite(limit) && limit > 0) rows = rows.slice(0, limit);
  return rows;
}

const sortableFields = {
  projects: ["id", "name", "code", "type", "status", "owner", "internalDue", "externalDue"],
  tasks: ["id", "projectId", "name", "type", "priority", "status", "owner", "startDate", "due", "actualStart", "actualEnd"],
  materials: ["id", "projectId", "name", "spec", "partType", "totalQuantity", "unitPrice", "brandOrSupplier"],
  purchases: ["id", "projectId", "type", "code", "name", "supplier", "totalAmount", "applyDate", "contractDate", "expectedDelivery", "status"],
  purchaseItems: ["id", "purchaseId", "materialId", "itemName", "spec", "quantity", "unitPrice", "totalPrice", "supplier"],
  receipts: ["id", "purchaseItemId", "arrivalDate", "arrivalQty", "storedQty", "status"],
  outbounds: ["id", "purchaseItemId", "outboundDate", "issuedQty", "receiver", "status"]
};

const queryFields = new Set(["projectId", "purchaseId", "materialId", "purchaseItemId", "status", "supplier", "type", "q", "sort", "limit"]);

function statusOptionsForResource(db, resource) {
  const key = {
    projects: "projectStatuses",
    purchases: "purchaseStatuses",
    receipts: "receiptStatuses",
    outbounds: "outboundStatuses"
  }[resource];
  return key ? db.settings?.[key] || [] : [];
}

function validateListQuery(db, resource, query) {
  const unknown = [...query.keys()].filter((key) => !queryFields.has(key));
  if (unknown.length) return `不支持的查询参数：${unknown.join(", ")}`;

  const limit = query.get("limit");
  if (limit && (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 500)) return "limit 必须是 1 到 500 的整数";

  const sort = query.get("sort");
  if (sort) {
    const field = sort.startsWith("-") ? sort.slice(1) : sort;
    if (!sortableFields[resource]?.includes(field)) return `sort 字段不支持：${field}`;
  }

  const status = query.get("status");
  const statusOptions = statusOptionsForResource(db, resource);
  if (status && statusOptions.length && !statusOptions.includes(status)) return `状态不支持：${status}`;

  return "";
}

function validateDashboardQuery(query) {
  const unknown = [...query.keys()].filter((key) => key !== "asOf");
  if (unknown.length) return `不支持的查询参数：${unknown.join(", ")}`;
  const asOf = query.get("asOf");
  if (asOf && !dateValue(asOf)) return "asOf 日期格式不正确";
  return "";
}

function validateInventoryQuery(query) {
  const unknown = [...query.keys()].filter((key) => key !== "projectId");
  if (unknown.length) return `不支持的查询参数：${unknown.join(", ")}`;
  return "";
}

function stateWriteAllowed() {
  return process.env.ALLOW_STATE_WRITE !== "false";
}

function purchaseItemsForProject(db, projectId) {
  const purchaseIds = db.purchases.filter((purchase) => purchase.projectId === projectId).map((purchase) => purchase.id);
  return db.purchaseItems.filter((item) => purchaseIds.includes(item.purchaseId));
}

function inventoryForPurchaseItem(db, purchaseItemId, excludeOutboundId = "") {
  const stored = db.receipts
    .filter((item) => item.purchaseItemId === purchaseItemId)
    .reduce((sum, item) => sum + safeNumber(item.storedQty), 0);
  const issued = db.outbounds
    .filter((item) => item.purchaseItemId === purchaseItemId && item.id !== excludeOutboundId)
    .reduce((sum, item) => sum + safeNumber(item.issuedQty), 0);
  return { stored, issued, stock: Math.max(stored - issued, 0) };
}

function inventoryRows(db, projectId = "") {
  return db.purchaseItems
    .filter((item) => {
      if (!projectId) return true;
      const purchase = findById(db, "purchases", item.purchaseId);
      return purchase?.projectId === projectId;
    })
    .map((item) => {
      const purchase = findById(db, "purchases", item.purchaseId);
      const project = findById(db, "projects", purchase?.projectId);
      const material = findById(db, "materials", item.materialId);
      const inventory = inventoryForPurchaseItem(db, item.id);
      return {
        purchaseItemId: item.id,
        projectId: project?.id || "",
        projectName: project?.name || "",
        purchaseId: purchase?.id || "",
        purchaseCode: purchase?.code || "",
        purchaseName: purchase?.name || "",
        materialId: material?.id || "",
        itemName: material ? material.name : item.itemName,
        spec: material ? material.spec : item.spec,
        unit: item.unit || material?.unit || "",
        purchasedQty: safeNumber(item.quantity),
        storedQty: inventory.stored,
        issuedQty: inventory.issued,
        stockQty: inventory.stock
      };
    });
}

function projectDashboard(db, projectId) {
  const project = findById(db, "projects", projectId);
  if (!project) return null;
  const tasks = db.tasks.filter((item) => item.projectId === projectId);
  const materials = db.materials.filter((item) => item.projectId === projectId);
  const purchases = db.purchases.filter((item) => item.projectId === projectId);
  const purchaseItems = purchaseItemsForProject(db, projectId);
  const purchaseItemIds = purchaseItems.map((item) => item.id);
  const receipts = db.receipts.filter((item) => purchaseItemIds.includes(item.purchaseItemId));
  const outbounds = db.outbounds.filter((item) => purchaseItemIds.includes(item.purchaseItemId));
  const storedQty = receipts.reduce((sum, item) => sum + safeNumber(item.storedQty), 0);
  const issuedQty = outbounds.reduce((sum, item) => sum + safeNumber(item.issuedQty), 0);
  return {
    project,
    counts: {
      tasks: tasks.length,
      bomItems: materials.length,
      purchases: purchases.length,
      purchaseItems: purchaseItems.length,
      receipts: receipts.length,
      outbounds: outbounds.length
    },
    quantities: {
      purchased: purchaseItems.reduce((sum, item) => sum + safeNumber(item.quantity), 0),
      stored: storedQty,
      issued: issuedQty,
      stock: Math.max(storedQty - issuedQty, 0)
    }
  };
}

function projectDetail(db, projectId) {
  const project = findById(db, "projects", projectId);
  if (!project) return null;
  const tasks = db.tasks.filter((item) => item.projectId === projectId);
  const materials = db.materials.filter((item) => item.projectId === projectId);
  const purchases = db.purchases.filter((item) => item.projectId === projectId);
  const purchaseIds = purchases.map((item) => item.id);
  const purchaseItems = db.purchaseItems.filter((item) => purchaseIds.includes(item.purchaseId));
  const purchaseItemIds = purchaseItems.map((item) => item.id);
  const receipts = db.receipts.filter((item) => purchaseItemIds.includes(item.purchaseItemId));
  const outbounds = db.outbounds.filter((item) => purchaseItemIds.includes(item.purchaseItemId));
  return { project, tasks, materials, purchases, purchaseItems, receipts, outbounds };
}

function systemDashboard(db, anchorDate = localDateString()) {
  const activeProjects = db.projects.filter((item) => !isEndedProject(item));
  const endedProjects = db.projects.filter(isEndedProject);
  const overdueTasks = db.tasks.filter((item) => item.due && item.due < anchorDate && !["已完成", "取消"].includes(item.status));
  const activePurchases = db.purchases.filter((item) => !["已到货", "取消"].includes(item.status));
  const overduePurchases = activePurchases.filter((item) => item.expectedDelivery && item.expectedDelivery < anchorDate);
  const abnormalPurchases = db.purchases.filter((item) => item.status === "异常" || item.riskRemark);
  const monthlyDeliveryProjects = db.projects.filter((item) => item.externalDue && item.externalDue.slice(0, 7) === anchorDate.slice(0, 7));
  const storedQty = db.receipts.reduce((sum, item) => sum + safeNumber(item.storedQty), 0);
  const issuedQty = db.outbounds.reduce((sum, item) => sum + safeNumber(item.issuedQty), 0);
  const purchaseAmount = db.purchases.reduce((sum, item) => sum + safeNumber(item.totalAmount), 0);
  const projectCompletionRows = db.projects
    .map((project) => ({
      projectId: project.id,
      projectName: project.name,
      completion: projectCompletion(db, project.id)
    }))
    .sort((a, b) => b.completion - a.completion);
  const riskItems = [
    ...overdueTasks.map((task) => ({
      level: "高",
      type: "任务逾期",
      projectId: task.projectId,
      objectId: task.id,
      objectName: task.name,
      owner: task.owner || "",
      planDate: task.due,
      description: "任务计划截止已逾期"
    })),
    ...overduePurchases.map((purchase) => ({
      level: "高",
      type: "采购逾期",
      projectId: purchase.projectId,
      objectId: purchase.id,
      objectName: purchase.name || purchase.code || "",
      owner: purchase.supplier || "",
      planDate: purchase.expectedDelivery,
      description: "采购预计到货已逾期"
    })),
    ...abnormalPurchases.map((purchase) => ({
      level: purchase.status === "异常" ? "高" : "中",
      type: "采购风险",
      projectId: purchase.projectId,
      objectId: purchase.id,
      objectName: purchase.name || purchase.code || "",
      owner: purchase.supplier || "",
      planDate: purchase.expectedDelivery || "",
      description: purchase.riskRemark || "采购状态异常"
    }))
  ];
  const riskProjectCount = new Set(riskItems.map((item) => item.projectId).filter(Boolean)).size;

  return {
    asOf: anchorDate,
    counts: {
      projects: db.projects.length,
      activeProjects: activeProjects.length,
      endedProjects: endedProjects.length,
      riskProjects: riskProjectCount,
      tasks: db.tasks.length,
      overdueTasks: overdueTasks.length,
      purchases: db.purchases.length,
      activePurchases: activePurchases.length,
      overduePurchases: overduePurchases.length,
      abnormalPurchases: abnormalPurchases.length,
      monthlyDeliveryProjects: monthlyDeliveryProjects.length
    },
    amounts: {
      purchaseAmount
    },
    quantities: {
      stored: storedQty,
      issued: issuedQty,
      stock: Math.max(storedQty - issuedQty, 0)
    },
    charts: {
      projectStatuses: rowsFromCounts(countBy(db.projects, (item) => item.status)),
      purchaseStatuses: rowsFromCounts(countBy(db.purchases, (item) => item.status)),
      projectCompletion: projectCompletionRows
    },
    riskItems: riskItems.slice(0, 20)
  };
}

function cascadeDelete(db, resource, id) {
  if (resource === "projects") {
    const purchaseIds = db.purchases.filter((item) => item.projectId === id).map((item) => item.id);
    const materialIds = db.materials.filter((item) => item.projectId === id).map((item) => item.id);
    const purchaseItemIds = db.purchaseItems
      .filter((item) => purchaseIds.includes(item.purchaseId) || materialIds.includes(item.materialId))
      .map((item) => item.id);
    db.tasks = db.tasks.filter((item) => item.projectId !== id);
    db.materials = db.materials.filter((item) => item.projectId !== id);
    db.purchases = db.purchases.filter((item) => item.projectId !== id);
    db.purchaseItems = db.purchaseItems.filter((item) => !purchaseItemIds.includes(item.id));
    db.receipts = db.receipts.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
    db.outbounds = db.outbounds.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
  }

  if (resource === "materials") {
    const purchaseItemIds = db.purchaseItems.filter((item) => item.materialId === id).map((item) => item.id);
    db.purchaseItems = db.purchaseItems.filter((item) => item.materialId !== id);
    db.receipts = db.receipts.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
    db.outbounds = db.outbounds.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
  }

  if (resource === "purchases") {
    const purchaseItemIds = db.purchaseItems.filter((item) => item.purchaseId === id).map((item) => item.id);
    db.purchaseItems = db.purchaseItems.filter((item) => item.purchaseId !== id);
    db.receipts = db.receipts.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
    db.outbounds = db.outbounds.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
  }

  if (resource === "purchaseItems") {
    db.receipts = db.receipts.filter((item) => item.purchaseItemId !== id);
    db.outbounds = db.outbounds.filter((item) => item.purchaseItemId !== id);
  }
}

async function handleApi(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 200, {});

  const parts = splitApiPath(req.url);
  const [, resource, id, subResource] = parts;
  const db = ensureCollections(await readDb());

  if (!resource) {
    if (req.method === "GET") return sendJson(res, 200, { status: "ok", resources: [...resourceList, "settings", "state", "inventory", "dashboard"] });
    return sendError(res, 405, "Method not allowed");
  }

  if (resource === "dashboard") {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    const query = new URL(req.url, "http://localhost").searchParams;
    const queryError = validateDashboardQuery(query);
    if (queryError) return sendError(res, 400, queryError, "INVALID_QUERY");
    const asOf = query.get("asOf") || undefined;
    return sendJson(res, 200, systemDashboard(db, asOf));
  }

  if (resource === "inventory") {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    const query = new URL(req.url, "http://localhost").searchParams;
    const queryError = validateInventoryQuery(query);
    if (queryError) return sendError(res, 400, queryError, "INVALID_QUERY");
    const projectId = query.get("projectId") || "";
    return sendJson(res, 200, inventoryRows(db, projectId));
  }

  if (resource === "projects" && id && subResource === "dashboard") {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    const dashboard = projectDashboard(db, id);
    return dashboard ? sendJson(res, 200, dashboard) : sendError(res, 404, "Project not found");
  }

  if (resource === "projects" && id && subResource === "detail") {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    const detail = projectDetail(db, id);
    return detail ? sendJson(res, 200, detail) : sendError(res, 404, "Project not found");
  }

  if (resource === "state") {
    if (req.method === "GET") return sendJson(res, 200, db);
    if (req.method === "PUT") {
      if (!stateWriteAllowed()) return sendError(res, 403, "完整状态覆盖保存已关闭", "STATE_WRITE_DISABLED");
      const next = await readBody(req);
      const validationError = validateState(next);
      if (validationError) return sendError(res, 400, validationError, "VALIDATION_ERROR");
      const normalized = ensureCollections(next);
      await writeDb(normalized);
      return sendJson(res, 200, normalized);
    }
    return sendError(res, 405, "Method not allowed");
  }

  if (resource === "settings") {
    if (req.method === "GET") return sendJson(res, 200, db.settings || {});
    if (req.method === "PUT") {
      db.settings = await readBody(req);
      await writeDb(db);
      return sendJson(res, 200, db.settings);
    }
    return sendError(res, 405, "Method not allowed");
  }

  if (!resources.has(resource)) return sendError(res, 404, "Unknown resource");
  db[resource] = db[resource] || [];

  if (req.method === "GET") {
    if (!id) {
      const query = new URL(req.url, "http://localhost").searchParams;
      const queryError = validateListQuery(db, resource, query);
      if (queryError) return sendError(res, 400, queryError, "INVALID_QUERY");
      return sendJson(res, 200, filterList(db, resource, query));
    }
    const item = db[resource].find((entry) => entry.id === id);
    return item ? sendJson(res, 200, item) : sendError(res, 404, "Not found");
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const item = { ...body, id: body.id || randomUUID() };
    const validationError = validateItem(db, resource, item);
    if (validationError) return sendError(res, 400, validationError, "VALIDATION_ERROR");
    db[resource].push(item);
    await writeDb(db);
    return sendJson(res, 201, item);
  }

  if (req.method === "PUT") {
    if (!id) return sendError(res, 400, "Missing id");
    const body = await readBody(req);
    const index = db[resource].findIndex((entry) => entry.id === id);
    if (index < 0) return sendError(res, 404, "Not found");
    const next = { ...db[resource][index], ...body, id };
    const validationError = validateItem(db, resource, next, id);
    if (validationError) return sendError(res, 400, validationError, "VALIDATION_ERROR");
    db[resource][index] = next;
    await writeDb(db);
    return sendJson(res, 200, db[resource][index]);
  }

  if (req.method === "DELETE") {
    if (!id) return sendError(res, 400, "Missing id");
    const before = db[resource].length;
    db[resource] = db[resource].filter((entry) => entry.id !== id);
    if (db[resource].length === before) return sendError(res, 404, "Not found");
    cascadeDelete(db, resource, id);
    await writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  return sendError(res, 405, "Method not allowed");
}

async function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath === "/" ? "index.html" : safePath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": staticTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      if (req.url.startsWith("/api")) {
        await handleApi(req, res);
      } else {
        await serveStatic(req, res);
      }
    } catch (error) {
      sendError(res, error.statusCode || 500, error.message || "Server error");
    }
  });
}

function startServer(port = PORT) {
  const server = createServer();
  server.listen(port, () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    console.log(`Langwei project management server: http://localhost:${actualPort}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createServer,
  startServer,
  handleApi,
  readDb,
  writeDb,
  validateItem,
  validateState,
  systemDashboard,
  inventoryRows,
  projectDashboard,
  projectDetail
};
