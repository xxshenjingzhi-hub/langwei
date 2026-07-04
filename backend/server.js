const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const SEED_PATH = path.join(DATA_DIR, "seed.json");
const PORT = Number(process.env.PORT || 5173);

const resources = new Set([
  "projects",
  "tasks",
  "materials",
  "purchases",
  "purchaseItems",
  "receipts",
  "outbounds"
]);

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

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    const seed = await fs.readFile(SEED_PATH, "utf8");
    await fs.writeFile(DB_PATH, seed);
  }
}

async function readDb() {
  await ensureDb();
  return JSON.parse(await fs.readFile(DB_PATH, "utf8"));
}

async function writeDb(db) {
  await fs.writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`);
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function splitApiPath(url) {
  return new URL(url, "http://localhost").pathname.split("/").filter(Boolean);
}

function ensureCollections(db) {
  db.settings = db.settings || {};
  resources.forEach((resource) => {
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

  if (resource === "outbounds") {
    const inventory = inventoryForPurchaseItem(db, item.purchaseItemId, editingId);
    if (safeNumber(item.issuedQty) > inventory.stock) {
      return `当前可出库库存为 ${inventory.stock}`;
    }
  }

  return "";
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
    if (req.method === "GET") return sendJson(res, 200, { status: "ok", resources: [...resources, "settings", "state", "inventory"] });
    return sendError(res, 405, "Method not allowed");
  }

  if (resource === "inventory") {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    const projectId = new URL(req.url, "http://localhost").searchParams.get("projectId") || "";
    return sendJson(res, 200, inventoryRows(db, projectId));
  }

  if (resource === "projects" && id && subResource === "dashboard") {
    if (req.method !== "GET") return sendError(res, 405, "Method not allowed");
    const dashboard = projectDashboard(db, id);
    return dashboard ? sendJson(res, 200, dashboard) : sendError(res, 404, "Project not found");
  }

  if (resource === "state") {
    if (req.method === "GET") return sendJson(res, 200, db);
    if (req.method === "PUT") {
      const next = await readBody(req);
      await writeDb(next);
      return sendJson(res, 200, next);
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
    if (!id) return sendJson(res, 200, db[resource]);
    const item = db[resource].find((entry) => entry.id === id);
    return item ? sendJson(res, 200, item) : sendError(res, 404, "Not found");
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const item = { ...body, id: body.id || randomUUID() };
    const validationError = validateItem(db, resource, item);
    if (validationError) return sendError(res, 400, validationError);
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
    if (validationError) return sendError(res, 400, validationError);
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

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api")) {
      await handleApi(req, res);
    } else {
      await serveStatic(req, res);
    }
  } catch (error) {
    sendError(res, 500, error.message || "Server error");
  }
});

server.listen(PORT, () => {
  console.log(`Langwei project management server: http://localhost:${PORT}`);
});
