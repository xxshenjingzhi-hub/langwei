const STORAGE_KEY = "langwei-project-management-v3";
const DATA_VERSION = 2026070401;
const API_BASE = location.protocol.startsWith("http") ? "/api" : "";

const defaultSettings = {
  projectTypes: ["研发（RD）", "销售（SP）"],
  taskTypes: ["设计", "采购", "组装", "交付"],
  projectStatuses: ["未立项", "已立项", "进行中", "暂停", "已结束", "取消"],
  purchaseStatuses: ["待询价", "待下单", "已下单", "部分到货", "已到货", "异常", "取消"],
  receiptStatuses: ["部分入库", "已入库"],
  outboundStatuses: ["部分出库", "已出库"],
  suppliers: ["海康", "尼康", "诺焰", "慕藤光", "米思米", "汇川"]
};

const seedData = {
  settings: structuredClone(defaultSettings),
  projects: [
    { id: "p1", name: "半导体载盘缺陷检测仪", code: "LW-2026-XS-QXJC-02", type: "销售（SP）", status: "进行中", owner: "艾靖峰", internalDue: "2026-07-15", externalDue: "2026-07-15", summary: "采购与软件算法并行推进" },
    { id: "p2", name: "纤芯距测量仪", code: "LW-2026-RD-XXJ-07", type: "研发（RD）", status: "进行中", owner: "倪磊", internalDue: "2026-07-31", externalDue: "2026-10-31", summary: "结构设计进行中" },
    { id: "p3", name: "大矢高球形晶圆缺陷检测", code: "LW-2026-XS-QXJC-03", type: "销售（SP）", status: "已结束", owner: "艾靖峰", internalDue: "2026-05-29", externalDue: "2026-07-31", summary: "首批采购已完成" }
  ],
  tasks: [
    { id: "t1", projectId: "p1", name: "需求说明书", type: "设计", priority: "P0", status: "进行中", owner: "莫亮", startDate: "2026-05-01", due: "2026-05-09", actualStart: "2026-05-01", actualEnd: "", remark: "需求边界持续补充" },
    { id: "t2", projectId: "p1", name: "机械结构 BOM", type: "设计", priority: "P0", status: "已完成", owner: "任志雄", startDate: "2026-05-10", due: "2026-05-28", actualStart: "2026-05-10", actualEnd: "2026-05-28", remark: "已形成采购清单" },
    { id: "t3", projectId: "p1", name: "软件研发：功能、算法", type: "设计", priority: "P1", status: "进行中", owner: "倪磊", startDate: "2026-05-20", due: "2026-06-26", actualStart: "2026-05-22", actualEnd: "", remark: "" },
    { id: "t4", projectId: "p2", name: "结构设计", type: "设计", priority: "P0", status: "进行中", owner: "黄辉", startDate: "2026-06-01", due: "2026-06-20", actualStart: "2026-06-03", actualEnd: "", remark: "" },
    { id: "t5", projectId: "p2", name: "里程碑：完成物料采购", type: "采购", priority: "P0", status: "进行中", owner: "莫亮", startDate: "2026-06-15", due: "2026-07-31", actualStart: "", actualEnd: "", remark: "长交期物料需重点跟进" },
    { id: "t6", projectId: "p3", name: "第一、二台硬件组装", type: "组装", priority: "P0", status: "已完成", owner: "黄辉", startDate: "2026-06-10", due: "2026-06-22", actualStart: "2026-06-11", actualEnd: "2026-06-22", remark: "" }
  ],
  materials: [
    { id: "m1", projectId: "p1", name: "海康工业相机", spec: "2500W 相机", material: "", partType: "外购件", quantityPerSet: 2, totalQuantity: 12, unit: "台", unitPrice: "19500", surfaceTreatment: "", brandOrSupplier: "海康", purchaseLink: "", remark: "部分相机已发货，需跟进 CXP 线" },
    { id: "m2", projectId: "p2", name: "尼康物镜", spec: "5x / 20x / 10x / 50x", material: "", partType: "外购件", quantityPerSet: 4, totalQuantity: 4, unit: "个", unitPrice: "11500", surfaceTreatment: "", brandOrSupplier: "尼康", purchaseLink: "", remark: "10x、50x 交期两个月左右" },
    { id: "m3", projectId: "p3", name: "大理石机台与支架", spec: "诺焰定制", material: "黑色大理石", partType: "机加件", quantityPerSet: 1, totalQuantity: 6, unit: "套", unitPrice: "17400", surfaceTreatment: "", brandOrSupplier: "诺焰", purchaseLink: "", remark: "20 号两台，24 号四台" }
  ],
  purchases: [
    { id: "po1", projectId: "p1", type: "采购合同", code: "LWYF2606006", name: "工业相机等设备", supplier: "海康", totalAmount: "212800", applyDate: "2026-06-04", contractDate: "2026-06-04", expectedDelivery: "2026-06-20", status: "部分到货", bomOutside: "否", progressRemark: "部分货物已发出，剩余交期待确认", riskRemark: "" },
    { id: "po2", projectId: "p2", type: "采购合同", code: "LWYF2606011", name: "尼康物镜", supplier: "尼康", totalAmount: "46000", applyDate: "2026-06-05", contractDate: "2026-06-05", expectedDelivery: "2026-07-31", status: "已下单", bomOutside: "否", progressRemark: "部分倍率交期较长", riskRemark: "长交期需持续跟踪" },
    { id: "po3", projectId: "p3", type: "采购合同", code: "LWYF2606008", name: "大理石平台和支架", supplier: "诺焰", totalAmount: "104400", applyDate: "2026-06-04", contractDate: "2026-06-04", expectedDelivery: "2026-06-20", status: "已到货", bomOutside: "否", progressRemark: "首批已入库", riskRemark: "" }
  ],
  purchaseItems: [
    { id: "pi1", purchaseId: "po1", materialId: "m1", itemName: "海康工业相机", spec: "2500W 相机", unit: "台", quantity: 12, unitPrice: 19500, totalPrice: 234000, supplier: "海康", remark: "来源 BOM 项" },
    { id: "pi2", purchaseId: "po1", materialId: "", itemName: "CXP 线", spec: "待确认型号", unit: "根", quantity: 12, unitPrice: "", totalPrice: "", supplier: "海康", remark: "BOM 外补充采购" },
    { id: "pi3", purchaseId: "po2", materialId: "m2", itemName: "尼康物镜", spec: "5x / 20x / 10x / 50x", unit: "个", quantity: 4, unitPrice: 11500, totalPrice: 46000, supplier: "尼康", remark: "来源 BOM 项" },
    { id: "pi4", purchaseId: "po3", materialId: "m3", itemName: "大理石机台与支架", spec: "诺焰定制", unit: "套", quantity: 6, unitPrice: 17400, totalPrice: 104400, supplier: "诺焰", remark: "来源 BOM 项" }
  ],
  receipts: [
    { id: "r1", purchaseItemId: "pi4", arrivalDate: "2026-06-20", arrivalQty: 2, storedQty: 2, status: "已入库", qcDescription: "外观正常，尺寸待复核", exception: "" }
  ],
  outbounds: [
    { id: "o1", purchaseItemId: "pi4", outboundDate: "2026-06-22", issuedQty: 1, receiver: "组装", purpose: "第一台设备组装", status: "部分出库", remark: "已领用 1 套" }
  ]
};

let state = loadState();
let currentView = "dashboard";
let searchTerm = "";
let projectFilter = "all";
let selectedProjectId = state.projects[0]?.id || "";
let selectedDetailTab = "overview";
let purchaseProjectFilter = "all";
let receiptProjectFilter = "all";
let outboundProjectFilter = "all";
let inventoryTab = "receipts";
let selectedPurchaseId = state.purchases[0]?.id || "";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const settingSections = [
  { key: "projectTypes", title: "项目类型", desc: "用于新增和编辑项目时选择" },
  { key: "taskTypes", title: "任务类型", desc: "项目任务分类，当前按设计、采购、组装、交付管理" },
  { key: "projectStatuses", title: "项目状态", desc: "用于项目列表筛选和项目当前状态维护" },
  { key: "purchaseStatuses", title: "采购状态", desc: "用于采购任务从询价、下单到到货的状态维护" },
  { key: "receiptStatuses", title: "入库状态", desc: "用于记录部分入库和已入库情况" },
  { key: "outboundStatuses", title: "出库状态", desc: "用于记录部分出库和已出库情况" },
  { key: "suppliers", title: "供应商名称", desc: "用于采购任务和采购明细中的供应商选择" }
];

const icons = {
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>`,
  view: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/></svg>`
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fresh = normalizeState(structuredClone(seedData));
    fresh.__dataVersion = DATA_VERSION;
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeState(parsed);
    if (parsed.__dataVersion !== DATA_VERSION) {
      migrateLegacyLocalData(normalized, parsed);
      normalized.__dataVersion = DATA_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    const fresh = normalizeState(structuredClone(seedData));
    fresh.__dataVersion = DATA_VERSION;
    return fresh;
  }
}

function normalizeState(parsed) {
  const normalized = {
    __dataVersion: parsed.__dataVersion || 0,
    settings: normalizeSettings({ ...structuredClone(defaultSettings), ...(parsed.settings || {}) }),
    projects: parsed.projects || [],
    tasks: normalizeTasks(parsed.tasks || []),
    materials: normalizeMaterials(parsed.materials || []),
    purchases: [],
    purchaseItems: [],
    receipts: [],
    outbounds: []
  };

  const normalizedPurchases = normalizePurchases(parsed.purchases || []);
  normalizedPurchases.forEach((purchase) => {
    if (!purchase.projectId) {
      const legacyPurchase = (parsed.purchases || []).find((item) => item.id === purchase.id);
      const legacyMaterial = normalized.materials.find((item) => item.id === legacyPurchase?.materialId);
      purchase.projectId = legacyMaterial?.projectId || "";
    }
  });
  const normalizedPurchaseItems = normalizePurchaseItems(parsed.purchaseItems || [], normalizedPurchases, parsed.purchases || [], normalized.materials);
  const normalizedReceipts = normalizeReceipts(parsed.receipts || [], normalizedPurchaseItems);
  const normalizedOutbounds = normalizeOutbounds(parsed.outbounds || [], normalizedPurchaseItems);

  normalized.purchases = normalizedPurchases;
  normalized.purchaseItems = normalizedPurchaseItems;
  normalized.receipts = normalizedReceipts;
  normalized.outbounds = normalizedOutbounds;

  return normalized;
}

function migrateLegacyLocalData(normalized, parsed) {
  normalized.receipts = normalized.receipts.map((item) => ({
    ...item,
    status: normalizeReceiptStatusValue(item.status, item.storedQty)
  }));

  const hasOldDemoPurchase = (parsed.purchases || []).some((item) => item.poNumber === "PO-20260604-01" || item.item === "CXP 线");
  const hasOldDemoMaterial = normalized.materials.some((item) => item.id === "m1" && item.name === "海康工业相机" && Number(item.totalQuantity || 0) === 2);
  if (hasOldDemoPurchase || hasOldDemoMaterial) {
    restoreSeedProjectProcurement(normalized, "p1");
  }
}

function restoreSeedProjectProcurement(normalized, projectId) {
  const seedProjectPurchases = seedData.purchases.filter((item) => item.projectId === projectId);
  const seedPurchaseIds = seedProjectPurchases.map((item) => item.id);
  const projectPurchaseIds = normalized.purchases.filter((item) => item.projectId === projectId).map((item) => item.id);
  const projectPurchaseItemIds = normalized.purchaseItems.filter((item) => projectPurchaseIds.includes(item.purchaseId)).map((item) => item.id);

  normalized.purchases = normalized.purchases.filter((item) => item.projectId !== projectId).concat(structuredClone(seedProjectPurchases));
  normalized.purchaseItems = normalized.purchaseItems
    .filter((item) => !projectPurchaseIds.includes(item.purchaseId))
    .concat(structuredClone(seedData.purchaseItems.filter((item) => seedPurchaseIds.includes(item.purchaseId))));
  normalized.receipts = normalized.receipts.filter((item) => !projectPurchaseItemIds.includes(item.purchaseItemId));
  normalized.outbounds = normalized.outbounds.filter((item) => !projectPurchaseItemIds.includes(item.purchaseItemId));

  seedData.materials
    .filter((item) => item.projectId === projectId)
    .forEach((seedMaterial) => {
      const index = normalized.materials.findIndex((item) => item.id === seedMaterial.id);
      if (index >= 0) normalized.materials[index] = { ...normalized.materials[index], ...structuredClone(seedMaterial) };
    });
}

function normalizeTasks(tasks) {
  return tasks.map((item) => ({
    ...item,
    startDate: item.startDate ?? "",
    due: item.due ?? "",
    actualStart: item.actualStart ?? "",
    actualEnd: item.actualEnd ?? "",
    remark: item.remark ?? ""
  }));
}

function normalizeMaterials(materials) {
  return materials.map((item) => ({
    ...item,
    quantityPerSet: item.quantityPerSet ?? item.quantity ?? "",
    totalQuantity: item.totalQuantity ?? item.quantity ?? "",
    unitPrice: item.unitPrice ?? "",
    material: item.material ?? "",
    partType: item.partType ?? "",
    surfaceTreatment: item.surfaceTreatment ?? "",
    brandOrSupplier: item.brandOrSupplier ?? item.requester ?? "",
    purchaseLink: item.purchaseLink ?? "",
    remark: item.remark ?? item.detail ?? ""
  }));
}

function normalizePurchases(purchases) {
  return purchases.map((item) => ({
    id: item.id,
    projectId: item.projectId || "",
    type: item.type || (item.poNumber ? "采购合同" : "其他"),
    code: item.code || item.poNumber || "",
    name: item.name || item.item || "",
    supplier: item.supplier || "",
    totalAmount: item.totalAmount ?? "",
    applyDate: item.applyDate || "",
    contractDate: item.contractDate || "",
    expectedDelivery: item.expectedDelivery || "",
    status: mapPurchaseStatus(item.status),
    bomOutside: item.bomOutside || "否",
    progressRemark: item.progressRemark || item.remark || "",
    riskRemark: item.riskRemark || (item.risk && item.risk !== "正常" ? item.risk : "")
  }));
}

function normalizePurchaseItems(purchaseItems, purchases, legacyPurchases, materials) {
  if (purchaseItems.length) {
    return purchaseItems.map((item) => ({
      id: item.id,
      purchaseId: item.purchaseId,
      materialId: item.materialId || "",
      itemName: item.itemName || materialByIdFromList(item.materialId, materials)?.name || "",
      spec: item.spec || materialByIdFromList(item.materialId, materials)?.spec || "",
      unit: item.unit || materialByIdFromList(item.materialId, materials)?.unit || "",
      quantity: item.quantity ?? "",
      unitPrice: item.unitPrice ?? "",
      totalPrice: item.totalPrice ?? calcTotal(item.quantity, item.unitPrice),
      supplier: item.supplier || purchaseTaskByIdFromList(item.purchaseId, purchases)?.supplier || "",
      remark: item.remark || ""
    }));
  }

  return legacyPurchases.map((item) => {
    const material = materialByIdFromList(item.materialId, materials);
    return {
      id: `pi-${item.id}`,
      purchaseId: item.id,
      materialId: item.materialId || "",
      itemName: item.item || material?.name || "",
      spec: material?.spec || "",
      unit: material?.unit || "",
      quantity: material?.totalQuantity ?? "",
      unitPrice: material?.unitPrice ?? "",
      totalPrice: calcTotal(material?.totalQuantity, material?.unitPrice),
      supplier: item.supplier || material?.brandOrSupplier || "",
      remark: item.remark || ""
    };
  });
}

function normalizeReceipts(receipts, purchaseItems) {
  return receipts.map((item) => ({
    id: item.id,
    purchaseItemId: item.purchaseItemId || purchaseItems.find((purchaseItem) => purchaseItem.purchaseId === item.purchaseId)?.id || "",
    arrivalDate: item.arrivalDate || "",
    arrivalQty: item.arrivalQty ?? "",
    storedQty: item.storedQty ?? "",
    status: normalizeReceiptStatusValue(item.status, item.storedQty),
    qcDescription: item.qcDescription || "",
    exception: item.exception || ""
  })).filter((item) => item.purchaseItemId);
}

function normalizeOutbounds(outbounds, purchaseItems) {
  return outbounds.map((item) => ({
    id: item.id,
    purchaseItemId: item.purchaseItemId || purchaseItems.find((purchaseItem) => purchaseItem.purchaseId === item.purchaseId)?.id || "",
    outboundDate: item.outboundDate || "",
    issuedQty: item.issuedQty ?? "",
    receiver: item.receiver || "",
    purpose: item.purpose || "",
    status: normalizeOutboundStatusValue(item.status, item.issuedQty),
    remark: item.remark || ""
  })).filter((item) => item.purchaseItemId);
}

function normalizeSettings(settings) {
  const normalized = { ...settings };
  const invalidProjectStatuses = ["待交付", "已交付"];
  const invalidReceiptStatuses = ["待到货", "已到货", "待入库", "未入库", "入库异常"];
  const invalidPurchaseStatuses = ["已入库"];
  normalized.projectTypes = normalized.projectTypes || [];
  normalized.taskTypes = normalized.taskTypes || [];
  normalized.projectStatuses = (normalized.projectStatuses || []).filter((item) => !invalidProjectStatuses.includes(item));
  normalized.purchaseStatuses = (normalized.purchaseStatuses || []).map(mapPurchaseStatus).filter((item) => !invalidPurchaseStatuses.includes(item));
  normalized.receiptStatuses = (normalized.receiptStatuses || []).filter((item) => !invalidReceiptStatuses.includes(item));
  normalized.outboundStatuses = normalized.outboundStatuses || [];
  normalized.suppliers = normalized.suppliers || [];
  Object.keys(defaultSettings).forEach((key) => {
    defaultSettings[key].forEach((item) => {
      if (!normalized[key].includes(item)) normalized[key].push(item);
    });
  });
  return normalized;
}

function normalizeReceiptStatusValue(status, storedQty = 0) {
  if (status === "已入库") return "已入库";
  if (status === "部分入库") return "部分入库";
  return Number(storedQty || 0) > 0 ? "部分入库" : "";
}

function normalizeOutboundStatusValue(status, issuedQty = 0) {
  if (status === "已出库") return "已出库";
  if (status === "部分出库") return "部分出库";
  return Number(issuedQty || 0) > 0 ? "部分出库" : "";
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (API_BASE) {
    syncStateToServer();
  }
}

async function syncStateFromServer() {
  if (!API_BASE) return;
  try {
    const response = await fetch(`${API_BASE}/state`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remoteState = await response.json();
    state = normalizeState(remoteState);
    state.__dataVersion = DATA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    selectedProjectId = state.projects.some((project) => project.id === selectedProjectId) ? selectedProjectId : state.projects[0]?.id || "";
    selectedPurchaseId = state.purchases.some((purchase) => purchase.id === selectedPurchaseId) ? selectedPurchaseId : state.purchases[0]?.id || "";
    render();
  } catch (error) {
    console.warn("后端数据读取失败，继续使用浏览器本地数据。", error);
  }
}

async function syncStateToServer() {
  try {
    await fetch(`${API_BASE}/state`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
  } catch (error) {
    console.warn("后端数据保存失败，已保留在浏览器本地。", error);
  }
}

function mapPurchaseStatus(status) {
  if (status === "已入库") return "已到货";
  return status || "待询价";
}

function materialByIdFromList(materialId, materials) {
  return materials.find((material) => material.id === materialId);
}

function purchaseTaskByIdFromList(purchaseId, purchases) {
  return purchases.find((purchase) => purchase.id === purchaseId);
}

function projectName(projectId) {
  return state.projects.find((project) => project.id === projectId)?.name || "未关联项目";
}

function purchaseTaskById(purchaseId) {
  return state.purchases.find((purchase) => purchase.id === purchaseId);
}

function purchaseTaskName(purchaseId) {
  return purchaseTaskById(purchaseId)?.name || "未关联采购记录";
}

function materialById(materialId) {
  return state.materials.find((material) => material.id === materialId);
}

function materialName(materialId) {
  const material = materialById(materialId);
  return material ? `${material.name}${material.spec ? `（${material.spec}）` : ""}` : "未关联 BOM 项";
}

function purchaseItemById(purchaseItemId) {
  return state.purchaseItems.find((item) => item.id === purchaseItemId);
}

function purchaseItemName(purchaseItemId) {
  const item = purchaseItemById(purchaseItemId);
  if (!item) return "未关联采购明细";
  return item.materialId ? materialName(item.materialId) : `${item.itemName}${item.spec ? `（${item.spec}）` : ""}`;
}

function purchaseItemSubjectCell(item, showProject = true) {
  const purchase = purchaseTaskById(item.purchaseId);
  const subject = item.materialId ? materialName(item.materialId) : (item.itemName || "-");
  const descriptions = [];
  if (showProject) descriptions.push(`所属项目：${projectName(purchase?.projectId)}`);
  return `<strong>${subject}</strong>${descriptions.length ? `<div class="muted-cell">${descriptions.join(" · ")}</div>` : ""}`;
}

function purchaseRecordCell(purchase) {
  return `<strong>${purchase?.code || "未编号"}</strong><div class="muted-cell">${purchase?.name || "-"}</div>`;
}

function purchaseItemsForTask(purchaseId) {
  return state.purchaseItems.filter((item) => item.purchaseId === purchaseId);
}

function receiptsForPurchaseItem(purchaseItemId) {
  return state.receipts.filter((item) => item.purchaseItemId === purchaseItemId);
}

function outboundsForPurchaseItem(purchaseItemId) {
  return state.outbounds.filter((item) => item.purchaseItemId === purchaseItemId);
}

function purchaseTaskAmount(purchase) {
  if (!purchase) return "";
  if (purchase.totalAmount !== "" && purchase.totalAmount !== null && purchase.totalAmount !== undefined) return purchase.totalAmount;
  const total = purchaseItemsForTask(purchase.id).reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  return total || "";
}

function calcTotal(quantity, unitPrice) {
  const qty = Number(quantity);
  const price = Number(unitPrice);
  if (!Number.isFinite(qty) || !Number.isFinite(price)) return "";
  return qty * price;
}

function fmtMoney(value) {
  if (value === "" || value === null || value === undefined) return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString("zh-CN");
}

function safeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

function fmtPercent(value) {
  return `${Number.isInteger(value) ? value : value.toFixed(2)}%`;
}

function durationDays(start, end) {
  if (!start || !end) return "-";
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return "-";
  return `${Math.floor((endDate - startDate) / 86400000) + 1}天`;
}

function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateDiffDays(date, anchor = todayString()) {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  const base = new Date(`${anchor}T00:00:00`);
  if (Number.isNaN(target.getTime()) || Number.isNaN(base.getTime())) return null;
  return Math.floor((target - base) / 86400000);
}

function isWithinNextDays(date, days, anchor = todayString()) {
  const diff = dateDiffDays(date, anchor);
  return diff !== null && diff >= 0 && diff <= days;
}

function isSameMonth(date, anchor = todayString()) {
  return Boolean(date && date.slice(0, 7) === anchor.slice(0, 7));
}

function isEndedProject(project) {
  return ["已结束", "已交付", "已关闭", "取消"].includes(project.status);
}

function isActiveProject(project) {
  return !isEndedProject(project);
}

function statusClass(status) {
  if (["已完成", "已入库", "已出库", "已交付", "已结束", "已关闭", "已到货"].includes(status)) return "done";
  if (["进行中", "推进中", "已下单", "部分到货"].includes(status)) return "progress";
  if (["待询价", "待下单", "未开始", "未立项", "部分入库", "部分出库"].includes(status)) return "warn";
  return "risk";
}

function badge(status) {
  return `<span class="status ${statusClass(status)}">${status || "未填写"}</span>`;
}

function filtered(items, fields) {
  if (!searchTerm) return items;
  const keyword = searchTerm.trim().toLowerCase();
  return items.filter((item) => fields.some((field) => String(field(item) || "").toLowerCase().includes(keyword)));
}

function projectCompletion(projectId) {
  const tasks = state.tasks.filter((task) => task.projectId === projectId && task.status !== "取消");
  return pct(tasks.filter((task) => task.status === "已完成").length, tasks.length);
}

function projectDetailData(projectId) {
  const project = state.projects.find((item) => item.id === projectId);
  const tasks = state.tasks.filter((item) => item.projectId === projectId && item.status !== "取消");
  const bom = state.materials.filter((item) => item.projectId === projectId);
  const purchases = state.purchases.filter((item) => item.projectId === projectId);
  const purchaseIds = purchases.map((item) => item.id);
  const purchaseItems = state.purchaseItems.filter((item) => purchaseIds.includes(item.purchaseId));
  const purchaseItemIds = purchaseItems.map((item) => item.id);
  const receipts = state.receipts.filter((item) => purchaseItemIds.includes(item.purchaseItemId));
  const outbounds = state.outbounds.filter((item) => purchaseItemIds.includes(item.purchaseItemId));
  const doneTasks = tasks.filter((item) => item.status === "已完成").length;
  const nearestDelivery = purchases.filter((item) => item.status !== "已到货" && item.expectedDelivery).map((item) => item.expectedDelivery).sort()[0];
  return { project, tasks, bom, purchases, purchaseItems, receipts, outbounds, doneTasks, taskCompletion: pct(doneTasks, tasks.length), nearestDelivery };
}

function projectDashboardStats(data) {
  const today = new Date().toISOString().slice(0, 10);
  const purchasedMaterialIds = new Set(data.purchaseItems.map((item) => item.materialId).filter(Boolean));
  const taskDone = data.tasks.filter((item) => item.status === "已完成").length;
  const taskActive = data.tasks.filter((item) => ["进行中", "阻塞", "待验收"].includes(item.status)).length;
  const overdueTasks = data.tasks.filter((item) => item.due && item.due < today && !["已完成", "取消"].includes(item.status));
  const purchaseDone = data.purchases.filter((item) => item.status === "已到货").length;
  const purchaseActive = data.purchases.filter((item) => ["已下单", "部分到货"].includes(item.status)).length;
  const purchasePending = data.purchases.filter((item) => ["待询价", "待下单"].includes(item.status)).length;
  const purchaseAmount = data.purchases.reduce((sum, item) => sum + safeNumber(purchaseTaskAmount(item)), 0);
  const purchaseQuantity = data.purchaseItems.reduce((sum, item) => sum + safeNumber(item.quantity), 0);
  const storedQuantity = data.receipts.reduce((sum, item) => sum + safeNumber(item.storedQty), 0);
  const issuedQuantity = data.outbounds.reduce((sum, item) => sum + safeNumber(item.issuedQty), 0);
  const storagePending = Math.max(purchaseQuantity - storedQuantity, 0);
  const stockQuantity = Math.max(storedQuantity - issuedQuantity, 0);
  const linkedBomCount = purchasedMaterialIds.size;
  const taskTypeRows = rowsFromCounts(countBy(data.tasks, (item) => item.type || "未分类"), state.settings.taskTypes);
  const purchaseStatusRows = rowsFromCounts(countBy(data.purchases, (item) => item.status || "未填写"), state.settings.purchaseStatuses);
  const bomCoverageRows = [
    { label: "已关联采购", value: linkedBomCount },
    { label: "未关联采购", value: Math.max(data.bom.length - linkedBomCount, 0) }
  ];
  const storageRows = [
    { label: "已入库", value: storedQuantity },
    { label: "待继续入库", value: storagePending }
  ];
  const outboundRows = [
    { label: "已出库", value: issuedQuantity },
    { label: "当前库存", value: stockQuantity }
  ];
  const upcomingTasks = data.tasks
    .filter((item) => item.due && !["已完成", "取消"].includes(item.status))
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 4);
  const upcomingPurchases = data.purchases
    .filter((item) => item.expectedDelivery && !["已到货", "取消"].includes(item.status))
    .sort((a, b) => a.expectedDelivery.localeCompare(b.expectedDelivery))
    .slice(0, 4);

  return {
    taskDone,
    taskActive,
    overdueTasks,
    purchaseDone,
    purchaseActive,
    purchasePending,
    purchaseAmount,
    purchaseQuantity,
    storedQuantity,
    issuedQuantity,
    storagePending,
    stockQuantity,
    taskTypeRows,
    purchaseStatusRows,
    bomCoverageRows,
    storageRows,
    outboundRows,
    bomCoverage: pct(linkedBomCount, data.bom.length),
    purchaseCompletion: pct(purchaseDone, data.purchases.length),
    storageCompletion: pct(storedQuantity, purchaseQuantity),
    upcomingTasks,
    upcomingPurchases
  };
}

function systemDashboardStats() {
  const today = todayString();
  const activeProjects = state.projects.filter(isActiveProject);
  const endedProjects = state.projects.filter(isEndedProject);
  const overdueTasks = state.tasks.filter((item) => item.due && item.due < today && !["已完成", "取消"].includes(item.status));
  const upcomingTasks = state.tasks
    .filter((item) => item.due && isWithinNextDays(item.due, 14, today) && !["已完成", "取消"].includes(item.status))
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 6);
  const purchaseDone = state.purchases.filter((item) => item.status === "已到货").length;
  const activePurchases = state.purchases.filter((item) => !["已到货", "取消"].includes(item.status));
  const overduePurchases = activePurchases.filter((item) => item.expectedDelivery && item.expectedDelivery < today);
  const abnormalPurchases = state.purchases.filter((item) => item.status === "异常" || item.riskRemark);
  const upcomingPurchases = activePurchases
    .filter((item) => item.expectedDelivery && isWithinNextDays(item.expectedDelivery, 14, today))
    .sort((a, b) => a.expectedDelivery.localeCompare(b.expectedDelivery))
    .slice(0, 6);
  const monthlyDeliveryProjects = state.projects.filter((item) => isSameMonth(item.externalDue, today));
  const projectRows = state.projects
    .map((project) => ({ label: project.name, value: projectCompletion(project.id), project }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const purchaseStatusRows = rowsFromCounts(countBy(state.purchases, (item) => item.status || "未填写"), state.settings.purchaseStatuses);
  const projectStatusRows = rowsFromCounts(countBy(state.projects, (item) => item.status || "未填写"), state.settings.projectStatuses);
  const storedQty = state.receipts.reduce((sum, item) => sum + safeNumber(item.storedQty), 0);
  const issuedQty = state.outbounds.reduce((sum, item) => sum + safeNumber(item.issuedQty), 0);
  const stockQty = Math.max(storedQty - issuedQty, 0);
  const purchaseAmount = state.purchases.reduce((sum, item) => sum + safeNumber(purchaseTaskAmount(item)), 0);
  const riskItems = [];

  overdueTasks.forEach((task) => {
    riskItems.push({
      level: "高",
      type: "任务逾期",
      projectId: task.projectId,
      object: task.name,
      owner: task.owner || "-",
      date: task.due,
      desc: `计划截止已超过 ${Math.abs(dateDiffDays(task.due, today) || 0)} 天`
    });
  });
  overduePurchases.forEach((purchase) => {
    riskItems.push({
      level: "高",
      type: "采购逾期",
      projectId: purchase.projectId,
      object: purchase.name || purchase.code || "-",
      owner: purchase.supplier || "-",
      date: purchase.expectedDelivery,
      desc: "预计到货已逾期，需确认交付时间"
    });
  });
  abnormalPurchases.forEach((purchase) => {
    riskItems.push({
      level: purchase.status === "异常" ? "高" : "中",
      type: "采购风险",
      projectId: purchase.projectId,
      object: purchase.name || purchase.code || "-",
      owner: purchase.supplier || "-",
      date: purchase.expectedDelivery || "-",
      desc: purchase.riskRemark || "采购状态异常"
    });
  });
  activeProjects.forEach((project) => {
    const completion = projectCompletion(project.id);
    if (project.externalDue && isWithinNextDays(project.externalDue, 14, today) && completion < 70) {
      riskItems.push({
        level: "中",
        type: "交付风险",
        projectId: project.id,
        object: project.name,
        owner: project.owner || "-",
        date: project.externalDue,
        desc: `外部截止临近，当前任务完成度 ${fmtPercent(completion)}`
      });
    }
  });

  const riskProjectIds = new Set(riskItems.map((item) => item.projectId).filter(Boolean));

  return {
    activeProjects,
    endedProjects,
    overdueTasks,
    upcomingTasks,
    purchaseDone,
    activePurchases,
    overduePurchases,
    abnormalPurchases,
    upcomingPurchases,
    monthlyDeliveryProjects,
    projectRows,
    projectStatusRows,
    purchaseStatusRows,
    storedQty,
    issuedQty,
    stockQty,
    purchaseAmount,
    riskItems: riskItems.slice(0, 10),
    riskProjectCount: riskProjectIds.size
  };
}

function countBy(items, getter) {
  return items.reduce((result, item) => {
    const key = getter(item);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function rowsFromCounts(counts, preferredOrder = []) {
  const keys = [...preferredOrder, ...Object.keys(counts).filter((key) => !preferredOrder.includes(key))];
  return keys
    .map((key) => ({ label: key, value: counts[key] || 0 }))
    .filter((row) => row.value > 0);
}

function metricCard(label, value, hint = "") {
  return `<div class="metric-card"><span>${label}</span><strong>${value}</strong>${hint ? `<small>${hint}</small>` : ""}</div>`;
}

function progressBlock(title, value, meta) {
  return `<div class="dashboard-block">
    <div class="dashboard-block-head"><strong>${title}</strong><span>${fmtPercent(value)}</span></div>
    <div class="wide-track"><span style="width:${Math.min(value, 100)}%"></span></div>
    <p>${meta}</p>
  </div>`;
}

function dashboardList(title, rows, emptyText) {
  return `<section class="dashboard-list">
    <h3>${title}</h3>
    <div class="dashboard-list-body">
      ${rows.length ? rows.join("") : `<div class="empty-state compact-empty">${emptyText}</div>`}
    </div>
  </section>`;
}

function renderHomeDashboard() {
  const dashboard = systemDashboardStats();
  const totalProjects = state.projects.length;
  const inventoryTotal = dashboard.issuedQty + dashboard.stockQty;
  const riskRows = dashboard.riskItems.map((item) => [
    badge(item.level === "高" ? "异常" : "进行中"),
    item.type,
    projectName(item.projectId),
    item.object,
    item.owner,
    item.date,
    item.desc
  ]);

  $("#homeDashboard").innerHTML = `
    <div class="metric-grid leadership-metrics">
      ${metricCard("项目总数", totalProjects, `进行中 ${dashboard.activeProjects.length} · 已结束 ${dashboard.endedProjects.length}`)}
      ${metricCard("风险项目", dashboard.riskProjectCount, `逾期任务 ${dashboard.overdueTasks.length} · 异常采购 ${dashboard.abnormalPurchases.length}`)}
      ${metricCard("本月交付", dashboard.monthlyDeliveryProjects.length, "按项目外部截止日期统计")}
      ${metricCard("采购总额", fmtMoney(dashboard.purchaseAmount), `采购记录 ${state.purchases.length} 条`)}
      ${metricCard("采购进度", `${dashboard.purchaseDone}/${state.purchases.length || 0}`, `待跟进 ${dashboard.activePurchases.length} · 逾期 ${dashboard.overduePurchases.length}`)}
      ${metricCard("当前库存", dashboard.stockQty, `已入库 ${dashboard.storedQty} · 已出库 ${dashboard.issuedQty}`)}
    </div>

    <div class="dashboard-chart-grid leadership-chart-grid">
      ${donutChart("项目状态分布", dashboard.projectStatusRows, totalProjects, `${dashboard.activeProjects.length}/${totalProjects || 0}`, "进行中 / 全部项目")}
      ${donutChart("采购状态分布", dashboard.purchaseStatusRows, state.purchases.length, `${dashboard.purchaseDone}/${state.purchases.length || 0}`, "已到货 / 全部采购")}
      ${barChart("项目完成度排行", dashboard.projectRows, 100, "暂无项目数据")}
      ${stackedChart("库存使用结构", [
        { label: "已出库", value: dashboard.issuedQty },
        { label: "当前库存", value: dashboard.stockQty }
      ], inventoryTotal, `已入库 ${dashboard.storedQty || 0}`)}
    </div>

    <div class="dashboard-two-col">
      ${dashboardList(
        "近期任务",
        dashboard.upcomingTasks.map((task) => `<div class="dashboard-list-row"><strong>${task.name}</strong><span>${projectName(task.projectId)} · ${task.owner || "-"} · ${task.due}</span>${badge(task.status)}</div>`),
        "未来 14 天暂无到期任务"
      )}
      ${dashboardList(
        "近期采购到货",
        dashboard.upcomingPurchases.map((purchase) => `<div class="dashboard-list-row"><strong>${purchase.name || purchase.code || "-"}</strong><span>${projectName(purchase.projectId)} · ${purchase.supplier || "-"} · ${purchase.expectedDelivery}</span>${badge(purchase.status)}</div>`),
        "未来 14 天暂无预计到货"
      )}
    </div>

    <section class="dashboard-list dashboard-risk-panel">
      <h3>风险预警</h3>
      ${riskRows.length ? detailTable(["等级", "类型", "所属项目", "关联对象", "责任/供应商", "计划时间", "风险说明"], riskRows) : `<div class="empty-state compact-empty">暂无风险预警</div>`}
    </section>
  `;
}

function barChart(title, rows, total, emptyText) {
  return `<section class="chart-card">
    <div class="chart-title"><h3>${title}</h3><span>合计 ${total || 0}</span></div>
    <div class="bar-chart">
      ${rows.length ? rows.map((row) => {
        const width = total ? Math.max(pct(row.value, total), 4) : 0;
        return `<div class="bar-row">
          <div class="bar-row-meta"><span>${escapeHtml(row.label)}</span><strong>${row.value}</strong></div>
          <div class="bar-track"><span style="width:${width}%"></span></div>
        </div>`;
      }).join("") : `<div class="empty-state compact-empty">${emptyText}</div>`}
    </div>
  </section>`;
}

function donutChart(title, rows, total, centerText, caption) {
  const colors = ["#164a9f", "#0f766e", "#a77a22", "#7c3aed", "#b73630", "#64748b"];
  let cursor = 0;
  const slices = rows.map((row, index) => {
    const value = total ? pct(row.value, total) : 0;
    const start = cursor;
    cursor += value;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });
  const background = slices.length ? `conic-gradient(${slices.join(", ")})` : "#e4ebf3";
  return `<section class="chart-card">
    <div class="chart-title"><h3>${title}</h3><span>合计 ${total || 0}</span></div>
    <div class="donut-wrap">
      <div class="donut-chart" style="background:${background}">
        <div><strong>${centerText}</strong><span>${caption}</span></div>
      </div>
      <div class="chart-legend">
        ${rows.length ? rows.map((row, index) => `<div><i style="background:${colors[index % colors.length]}"></i><span>${escapeHtml(row.label)}</span><strong>${row.value}</strong></div>`).join("") : `<div class="muted-cell">暂无采购数据</div>`}
      </div>
    </div>
  </section>`;
}

function stackedChart(title, rows, total, caption) {
  const colors = ["#164a9f", "#d8e3f1"];
  return `<section class="chart-card">
    <div class="chart-title"><h3>${title}</h3><span>${caption}</span></div>
    <div class="stack-chart">
      <div class="stack-track">
        ${rows.map((row, index) => `<span style="width:${total ? pct(row.value, total) : 0}%; background:${colors[index % colors.length]}"></span>`).join("")}
      </div>
      <div class="chart-legend horizontal">
        ${rows.map((row, index) => `<div><i style="background:${colors[index % colors.length]}"></i><span>${escapeHtml(row.label)}</span><strong>${row.value}</strong></div>`).join("")}
      </div>
    </div>
  </section>`;
}

function renderProjectCards() {
  let projects = filtered(state.projects, [(item) => item.name, (item) => item.code, (item) => item.owner, (item) => item.status]);
  if (projectFilter === "active") projects = projects.filter(isActiveProject);
  if (projectFilter === "ended") projects = projects.filter(isEndedProject);

  $("#projectCards").innerHTML =
    projects
      .map((project) => {
        const detail = projectDetailData(project.id);
        const completion = projectCompletion(project.id);
        return `<article class="project-card ${project.id === selectedProjectId ? "selected-card" : ""}" data-action="select-project" data-id="${project.id}">
          <div class="project-card-head">
            <div>
              <h3>${project.name}</h3>
              <span>${project.code}</span>
            </div>
            ${badge(project.status)}
          </div>
          <p>${project.summary || "暂无项目概述"}</p>
          <div class="project-card-meta">
            <span>${project.type}</span>
            <span>负责人：${project.owner || "-"}</span>
            <span>截止：${project.internalDue || "-"}</span>
          </div>
          <div class="completion project-card-progress"><div class="mini-track"><span style="width:${completion}%"></span></div>${fmtPercent(completion)}</div>
          <div class="project-card-foot">
            <span>任务 ${detail.tasks.length}</span>
            <span>BOM ${detail.bom.length}</span>
            <span>采购明细 ${detail.purchaseItems.length}</span>
          </div>
          <div class="action-bar">
            <button class="icon-button" data-action="edit-project" data-id="${project.id}" title="编辑项目" aria-label="编辑项目">${icons.edit}</button>
            <button class="icon-button danger" data-action="delete-project" data-id="${project.id}" title="删除项目" aria-label="删除项目">${icons.delete}</button>
          </div>
        </article>`;
      })
      .join("") || `<div class="empty-state">暂无项目</div>`;
}

function renderProjectDetail() {
  if (!state.projects.length) {
    selectedProjectId = "";
    $("#detailOverview").innerHTML = "";
    $("#detailTasks").innerHTML = "";
    $("#detailBom").innerHTML = "";
    $("#detailPurchases").innerHTML = "";
    $("#detailReceipts").innerHTML = "";
    $("#detailOutbounds").innerHTML = "";
    return;
  }

  if (!state.projects.some((project) => project.id === selectedProjectId)) selectedProjectId = state.projects[0].id;
  const data = projectDetailData(selectedProjectId);
  const { project } = data;
  if (currentView === "projectDetailPage") {
    $("#pageTitle").textContent = project.name;
    $("#pageSubtitle").textContent = `${project.code} · ${project.type} · ${project.status}`;
  }

  const dashboard = projectDashboardStats(data);
  $("#detailOverview").innerHTML = `
    <div class="overview-dashboard">
      <div class="metric-grid">
        ${metricCard("项目状态", badge(project.status), `负责人：${project.owner || "-"}`)}
        ${metricCard("任务进度", `${dashboard.taskDone}/${data.tasks.length}`, `进行中 ${dashboard.taskActive} · 逾期 ${dashboard.overdueTasks.length}`)}
        ${metricCard("BOM 覆盖", `${data.purchaseItems.length} 项采购明细`, `BOM 转采购覆盖 ${fmtPercent(dashboard.bomCoverage)}`)}
        ${metricCard("采购金额", fmtMoney(dashboard.purchaseAmount), `采购记录 ${data.purchases.length} 条`)}
        ${metricCard("入库进度", `${dashboard.storedQuantity}/${dashboard.purchaseQuantity || 0}`, `未入库数量 ${dashboard.storagePending}`)}
        ${metricCard("出库库存", `${dashboard.issuedQuantity}/${dashboard.storedQuantity || 0}`, `当前库存 ${dashboard.stockQuantity}`)}
        ${metricCard("最近采购到货", data.nearestDelivery || "-", `外部截止：${project.externalDue || "-"}`)}
      </div>

      <div class="dashboard-progress-grid">
        ${progressBlock("项目任务完成度", data.taskCompletion, `已完成 ${dashboard.taskDone} 项，共 ${data.tasks.length} 项`)}
        ${progressBlock("采购记录完成度", dashboard.purchaseCompletion, `已到货 ${dashboard.purchaseDone} 条，进行中 ${dashboard.purchaseActive} 条，待处理 ${dashboard.purchasePending} 条`)}
        ${progressBlock("BOM 转采购覆盖率", dashboard.bomCoverage, `BOM ${data.bom.length} 项，已关联采购 ${data.purchaseItems.filter((item) => item.materialId).length} 项`)}
        ${progressBlock("入库完成度", dashboard.storageCompletion, `已入库 ${dashboard.storedQuantity}，采购数量 ${dashboard.purchaseQuantity || 0}`)}
        ${progressBlock("出库使用率", pct(dashboard.issuedQuantity, dashboard.storedQuantity), `已出库 ${dashboard.issuedQuantity}，当前库存 ${dashboard.stockQuantity}`)}
      </div>

      <div class="dashboard-chart-grid">
        ${barChart("任务类型分布", dashboard.taskTypeRows, data.tasks.length, "暂无任务数据")}
        ${donutChart("采购状态分布", dashboard.purchaseStatusRows, data.purchases.length, `${dashboard.purchaseDone}/${data.purchases.length || 0}`, "已到货 / 全部采购")}
        ${stackedChart("BOM 采购覆盖", dashboard.bomCoverageRows, data.bom.length, `BOM ${data.bom.length} 项`)}
        ${stackedChart("入库数量结构", dashboard.storageRows, dashboard.purchaseQuantity, `采购数量 ${dashboard.purchaseQuantity || 0}`)}
        ${stackedChart("出库库存结构", dashboard.outboundRows, dashboard.storedQuantity, `已入库 ${dashboard.storedQuantity || 0}`)}
      </div>

      <div class="dashboard-two-col">
        ${dashboardList(
          "临近任务",
          dashboard.upcomingTasks.map((task) => `<div class="dashboard-list-row"><strong>${task.name}</strong><span>${task.owner || "-"} · ${task.due}</span>${badge(task.status)}</div>`),
          "暂无临近任务"
        )}
        ${dashboardList(
          "采购跟进",
          dashboard.upcomingPurchases.map((purchase) => `<div class="dashboard-list-row"><strong>${purchase.name || purchase.code || "-"}</strong><span>${purchase.supplier || "-"} · ${purchase.expectedDelivery}</span>${badge(purchase.status)}</div>`),
          "暂无待跟进采购"
        )}
      </div>

      <div class="project-brief">
        <span>项目概述</span>
        <p>${project.summary || "暂无项目情况概述"}</p>
      </div>
    </div>
  `;

  $("#detailTasks").innerHTML = detailTable(
    ["任务", "类型", "优先级", "状态", "负责人", "计划开始", "计划截止", "计划工期", "实际开始", "实际结束", "实际工期", "备注", "操作"],
    data.tasks.map((task) => [
      task.name,
      task.type,
      task.priority,
      badge(task.status),
      task.owner || "-",
      task.startDate || "-",
      task.due || "-",
      durationDays(task.startDate, task.due),
      task.actualStart || "-",
      task.actualEnd || "-",
      durationDays(task.actualStart, task.actualEnd),
      task.remark || "-",
      rowActions("task", task.id)
    ])
  );

  $("#detailBom").innerHTML = detailTable(
    ["物料/零件名称", "图号/规格型号", "材质", "零件类型", "单套数量", "总数量", "单位", "单价", "表面处理", "品牌/建议供应商", "采购链接", "备注", "操作"],
    data.bom.map((item) => [
      item.name,
      item.spec || "-",
      item.material || "-",
      item.partType || "-",
      item.quantityPerSet || "-",
      item.totalQuantity || "-",
      item.unit || "-",
      item.unitPrice || "-",
      item.surfaceTreatment || "-",
      item.brandOrSupplier || "-",
      item.purchaseLink ? `<a href="${escapeHtml(item.purchaseLink)}" target="_blank" rel="noreferrer">打开链接</a>` : "-",
      item.remark || "-",
      `<div class="row-actions"><button class="ghost-button small-button" data-action="create-purchase" data-id="${item.id}">生成采购</button>${rowActionButtons("material", item.id)}</div>`
    ])
  );

  $("#detailPurchases").innerHTML = detailTable(
      ["采购编号", "采购名称", "供应商", "状态", "预计到货", "采购明细", "金额", "操作"],
      data.purchases.map((purchase) => [
        purchase.code || "-",
        purchase.name || "-",
        purchase.supplier || "-",
        badge(purchase.status),
        purchase.expectedDelivery || "-",
        `${purchaseItemsForTask(purchase.id).length} 项`,
        fmtMoney(purchaseTaskAmount(purchase)),
        rowActions("purchase", purchase.id, true)
      ])
    );

  $("#detailReceipts").innerHTML = detailTable(
      ["BOM项", "采购记录", "供应商", "采购数量", "已入库", "未入库数量", "入库状态", "操作"],
      data.purchaseItems.map((item) => {
        const purchase = purchaseTaskById(item.purchaseId);
        const stats = receiptStats(item.id);
        return [
          purchaseItemSubjectCell(item, false),
          purchaseRecordCell(purchase),
          item.supplier || purchase?.supplier || "-",
          item.quantity || "-",
          stats.stored || "-",
          stats.unstored === "" ? "-" : stats.unstored,
          stats.status ? badge(stats.status) : "-",
          `<div class="row-actions"><button class="icon-button subtle" data-action="view-receipt-item" data-id="${item.id}" title="查看入库详情" aria-label="查看入库详情">${icons.view}</button><button class="ghost-button small-button" data-action="create-receipt" data-id="${item.id}">新增入库</button></div>`
        ];
      })
    );

  $("#detailOutbounds").innerHTML = detailTable(
      ["BOM项", "采购记录", "已入库", "已出库", "当前库存", "最近出库", "出库状态", "操作"],
      data.purchaseItems.map((item) => {
        const purchase = purchaseTaskById(item.purchaseId);
        const stats = stockStats(item.id);
        return [
          purchaseItemSubjectCell(item, false),
          purchaseRecordCell(purchase),
          stats.stored || "-",
          stats.issued || "-",
          stats.stock === "" ? "-" : stats.stock,
          stats.latestOutbound?.outboundDate || "-",
          stats.outboundStatus ? badge(stats.outboundStatus) : "-",
          `<div class="row-actions"><button class="ghost-button small-button" data-action="create-outbound" data-id="${item.id}">新增出库</button>${stats.latestOutbound ? rowActionButtons("outbound", stats.latestOutbound.id) : ""}</div>`
        ];
      })
    );

  $$(".detail-tab").forEach((button) => button.classList.toggle("active", button.dataset.detailTab === selectedDetailTab));
  $$(".detail-pane").forEach((pane) => pane.classList.remove("active-detail-pane"));
  $(`#detail${selectedDetailTab[0].toUpperCase()}${selectedDetailTab.slice(1)}`).classList.add("active-detail-pane");
  renderPageActions();
}

function renderPurchaseFilter() {
  $("#purchaseProjectFilter").innerHTML = `<option value="all">全部项目</option>${state.projects.map((project) => `<option value="${project.id}" ${purchaseProjectFilter === project.id ? "selected" : ""}>${project.name}</option>`).join("")}`;
}

function renderPurchases() {
  let purchases = filtered(state.purchases, [
    (item) => item.code,
    (item) => item.name,
    (item) => item.supplier,
    (item) => projectName(item.projectId),
    (item) => item.status,
    (item) => item.progressRemark
  ]);
  if (purchaseProjectFilter !== "all") purchases = purchases.filter((item) => item.projectId === purchaseProjectFilter);
  if (!purchases.some((item) => item.id === selectedPurchaseId)) selectedPurchaseId = purchases[0]?.id || "";

  $("#purchaseRows").innerHTML =
    purchases
      .map((item) => `<tr class="${item.id === selectedPurchaseId ? "selected-row" : ""}">
        <td><button class="project-link" data-action="select-purchase" data-id="${item.id}">${item.code || item.name}</button></td>
        <td>${item.name || "-"}</td>
        <td>${projectName(item.projectId)}</td>
        <td>${item.supplier || "-"}</td>
        <td>${badge(item.status)}</td>
        <td>${item.expectedDelivery || "-"}</td>
        <td>${purchaseItemsForTask(item.id).length} 项</td>
        <td>${rowActions("purchase", item.id, true)}</td>
      </tr>`)
      .join("") || emptyRow(8);
}

function openPurchaseDetail(purchaseId) {
  const purchase = purchaseTaskById(purchaseId);
  if (!purchase) return;
  const purchaseItems = purchaseItemsForTask(purchase.id);
  const dialog = $("#purchaseDetailDialog");
  dialog.innerHTML = `<div class="dialog-body detail-dialog-body purchase-detail-dialog">
    <div class="dialog-title-row">
      <div>
        <h3>${purchase.name}</h3>
        <p>${projectName(purchase.projectId)} · ${purchase.code || "未填写编号"} · ${purchase.type}</p>
      </div>
      <div class="page-actions">
        <button type="button" class="ghost-button small-button" data-action="add-purchase-item" data-id="${purchase.id}">新增采购明细</button>
        <button type="button" class="ghost-button small-button" data-action="edit-purchase" data-id="${purchase.id}">编辑采购任务</button>
        <button type="button" class="ghost-button small-button danger-button" data-action="delete-purchase" data-id="${purchase.id}">删除采购任务</button>
        <button type="button" class="ghost-button small-button" data-close>关闭</button>
      </div>
    </div>
    <dl class="detail-list">
      <dt>所属项目</dt><dd>${projectName(purchase.projectId)}</dd>
      <dt>供应商</dt><dd>${purchase.supplier || "-"}</dd>
      <dt>采购状态</dt><dd>${badge(purchase.status)}</dd>
      <dt>合同总金额</dt><dd>${fmtMoney(purchaseTaskAmount(purchase))}</dd>
      <dt>申请时间</dt><dd>${purchase.applyDate || "-"}</dd>
      <dt>签订时间</dt><dd>${purchase.contractDate || "-"}</dd>
      <dt>预计到货</dt><dd>${purchase.expectedDelivery || "-"}</dd>
      <dt>BOM外新增</dt><dd>${purchase.bomOutside || "否"}</dd>
      <dt>采购进展</dt><dd>${purchase.progressRemark || "-"}</dd>
      <dt>风险说明</dt><dd>${purchase.riskRemark || "-"}</dd>
    </dl>
    <div class="detail-section">
      <div class="section-label">采购明细</div>
      ${purchaseItems.length ? detailTable(
        ["关联 BOM 项", "物料名称", "规格型号", "单位", "数量", "单价", "总价", "供应商", "备注", "入库", "出库/库存", "操作"],
        purchaseItems.map((item) => [
          item.materialId ? materialName(item.materialId) : "BOM 外新增",
          item.itemName || "-",
          item.spec || "-",
          item.unit || "-",
          item.quantity || "-",
          item.unitPrice || "-",
          fmtMoney(item.totalPrice),
          item.supplier || "-",
          item.remark || "-",
          receiptSummaryText(item.id),
          outboundSummaryText(item.id),
          `<div class="row-actions"><button class="ghost-button small-button" data-action="create-receipt" data-id="${item.id}">新增入库</button><button class="ghost-button small-button" data-action="create-outbound" data-id="${item.id}">新增出库</button>${rowActionButtons("purchase-item", item.id)}</div>`
        ])
      ) : `<div class="empty-state compact-empty">暂无采购明细</div>`}
    </div>
  </div>`;
  dialog.showModal();
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
}

function receiptSummaryText(purchaseItemId) {
  const receipts = receiptsForPurchaseItem(purchaseItemId);
  if (!receipts.length) return "暂无入库";
  const stored = receipts.reduce((sum, item) => sum + Number(item.storedQty || 0), 0);
  const latest = receipts[receipts.length - 1];
  return `${latest.status} / 已入库 ${stored || 0}`;
}

function outboundSummaryText(purchaseItemId) {
  const stats = stockStats(purchaseItemId);
  if (!stats.issued) return `库存 ${stats.stock === "" ? 0 : stats.stock}`;
  return `${stats.outboundStatus} / 已出库 ${stats.issued} / 库存 ${stats.stock}`;
}

function renderReceiptFilter() {
  $("#receiptProjectFilter").innerHTML = `<option value="all">全部项目</option>${state.projects.map((project) => `<option value="${project.id}" ${receiptProjectFilter === project.id ? "selected" : ""}>${project.name}</option>`).join("")}`;
}

function renderOutboundFilter() {
  $("#outboundProjectFilter").innerHTML = `<option value="all">全部项目</option>${state.projects.map((project) => `<option value="${project.id}" ${outboundProjectFilter === project.id ? "selected" : ""}>${project.name}</option>`).join("")}`;
}

function receiptStats(purchaseItemId) {
  const purchaseItem = purchaseItemById(purchaseItemId);
  const receipts = receiptsForPurchaseItem(purchaseItemId);
  const purchased = Number(purchaseItem?.quantity || 0);
  const arrived = receipts.reduce((sum, item) => sum + Number(item.arrivalQty || 0), 0);
  const stored = receipts.reduce((sum, item) => sum + Number(item.storedQty || 0), 0);
  const unstored = purchased ? Math.max(purchased - stored, 0) : "";
  const latest = receipts.slice().sort((a, b) => String(a.arrivalDate || "").localeCompare(String(b.arrivalDate || ""))).at(-1);
  const status = receiptStatusForItem(purchaseItemId);
  return { purchased, arrived, stored, unstored, latest, status };
}

function receiptStatusForItem(purchaseItemId) {
  const purchaseItem = purchaseItemById(purchaseItemId);
  const receipts = receiptsForPurchaseItem(purchaseItemId);
  const purchased = Number(purchaseItem?.quantity || 0);
  const stored = receipts.reduce((sum, item) => sum + Number(item.storedQty || 0), 0);
  if (purchased && stored >= purchased) return "已入库";
  if (stored > 0) return "部分入库";
  return "";
}

function outboundStatusForItem(purchaseItemId) {
  const stats = stockStats(purchaseItemId);
  if (stats.stored && stats.issued >= stats.stored) return "已出库";
  if (stats.issued > 0) return "部分出库";
  return "";
}

function stockStats(purchaseItemId) {
  const receipt = receiptStats(purchaseItemId);
  const outbounds = outboundsForPurchaseItem(purchaseItemId);
  const issued = outbounds.reduce((sum, item) => sum + Number(item.issuedQty || 0), 0);
  const stock = receipt.stored === "" ? "" : Math.max(Number(receipt.stored || 0) - issued, 0);
  const latestOutbound = outbounds.slice().sort((a, b) => String(a.outboundDate || "").localeCompare(String(b.outboundDate || ""))).at(-1);
  const outboundStatus = outboundStatusForItemRaw(receipt.stored, issued);
  return { ...receipt, issued, stock, latestOutbound, outboundStatus };
}

function outboundStatusForItemRaw(stored, issued) {
  const storedNumber = Number(stored || 0);
  if (storedNumber && issued >= storedNumber) return "已出库";
  if (issued > 0) return "部分出库";
  return "";
}

function renderReceipts() {
  let purchaseItems = filtered(state.purchaseItems, [
    (item) => purchaseTaskName(item.purchaseId),
    (item) => purchaseTaskById(item.purchaseId)?.code,
    (item) => projectName(purchaseTaskById(item.purchaseId)?.projectId),
    (item) => item.materialId ? materialName(item.materialId) : item.itemName,
    (item) => item.supplier,
    (item) => receiptStatusForItem(item.id)
  ]);
  if (receiptProjectFilter !== "all") {
    purchaseItems = purchaseItems.filter((item) => purchaseTaskById(item.purchaseId)?.projectId === receiptProjectFilter);
  }

  const rows = purchaseItems.map((item) => {
    const purchase = purchaseTaskById(item.purchaseId);
    const stats = receiptStats(item.id);
    return `<tr>
      <td>${purchaseItemSubjectCell(item, false)}</td>
      <td>${projectName(purchase?.projectId)}</td>
      <td>${purchaseRecordCell(purchase)}</td>
      <td>${item.supplier || purchase?.supplier || "-"}</td>
      <td>${item.quantity || "-"}</td>
      <td>${stats.stored || "-"}</td>
      <td>${stats.unstored === "" ? "-" : stats.unstored}</td>
      <td>${stats.status ? badge(stats.status) : "-"}</td>
      <td><div class="row-actions"><button class="icon-button subtle" data-action="view-receipt-item" data-id="${item.id}" title="查看入库详情" aria-label="查看入库详情">${icons.view}</button><button class="ghost-button small-button" data-action="create-receipt" data-id="${item.id}">新增入库</button></div></td>
    </tr>`;
  });
  $("#receiptRows").innerHTML = rows.join("") || emptyRow(9);
}

function renderOutbounds() {
  let purchaseItems = filtered(state.purchaseItems, [
    (item) => purchaseTaskName(item.purchaseId),
    (item) => purchaseTaskById(item.purchaseId)?.code,
    (item) => projectName(purchaseTaskById(item.purchaseId)?.projectId),
    (item) => item.materialId ? materialName(item.materialId) : item.itemName,
    (item) => outboundStatusForItem(item.id)
  ]);
  if (outboundProjectFilter !== "all") {
    purchaseItems = purchaseItems.filter((item) => purchaseTaskById(item.purchaseId)?.projectId === outboundProjectFilter);
  }

  const rows = purchaseItems.map((item) => {
    const purchase = purchaseTaskById(item.purchaseId);
    const stats = stockStats(item.id);
    return `<tr>
      <td>${purchaseItemSubjectCell(item, false)}</td>
      <td>${projectName(purchase?.projectId)}</td>
      <td>${purchaseRecordCell(purchase)}</td>
      <td>${stats.stored || "-"}</td>
      <td>${stats.issued || "-"}</td>
      <td>${stats.stock === "" ? "-" : stats.stock}</td>
      <td>${stats.latestOutbound?.outboundDate || "-"}</td>
      <td>${stats.outboundStatus ? badge(stats.outboundStatus) : "-"}</td>
      <td><div class="row-actions"><button class="ghost-button small-button" data-action="create-outbound" data-id="${item.id}">新增出库</button>${stats.latestOutbound ? rowActionButtons("outbound", stats.latestOutbound.id) : ""}</div></td>
    </tr>`;
  });
  $("#outboundRows").innerHTML = rows.join("") || emptyRow(9);
}

function renderInventoryTabs() {
  $$("[data-inventory-tab]").forEach((button) => button.classList.toggle("active", button.dataset.inventoryTab === inventoryTab));
  $("#inventoryReceipts").classList.toggle("active-inventory-pane", inventoryTab === "receipts");
  $("#inventoryOutbounds").classList.toggle("active-inventory-pane", inventoryTab === "outbounds");
  $("#inventoryPageTabs").classList.toggle("hidden", currentView !== "inventory");
  $("#pageTitle").classList.toggle("hidden", currentView === "inventory");
  $("#pageSubtitle").classList.toggle("hidden", currentView === "inventory");
}

function openReceiptItemDetail(purchaseItemId) {
  const purchaseItem = purchaseItemById(purchaseItemId);
  if (!purchaseItem) return;
  const purchase = purchaseTaskById(purchaseItem.purchaseId);
  const stats = receiptStats(purchaseItemId);
  const receipts = receiptsForPurchaseItem(purchaseItemId);
  const dialog = $("#receiptDetailDialog");
  dialog.innerHTML = `<div class="dialog-body detail-dialog-body receipt-detail-dialog">
    <div class="dialog-title-row">
      <div>
        <h3>${purchaseItem.itemName || materialName(purchaseItem.materialId)}</h3>
        <p>所属项目：${projectName(purchase?.projectId)} · 采购记录：${purchase?.code || "未填写编号"} / ${purchase?.name || "未关联采购记录"}</p>
      </div>
      <div class="page-actions">
        <button type="button" class="ghost-button small-button" data-action="create-receipt" data-id="${purchaseItem.id}">新增入库</button>
        <button type="button" class="ghost-button small-button" data-close>关闭</button>
      </div>
    </div>
    <dl class="detail-list">
      <dt>BOM项</dt><dd>${purchaseItem.materialId ? materialName(purchaseItem.materialId) : "BOM 外新增"}</dd>
      <dt>所属项目</dt><dd>${projectName(purchase?.projectId)}</dd>
      <dt>采购记录</dt><dd>${purchase?.code || "未编号"} / ${purchase?.name || "-"}</dd>
      <dt>供应商</dt><dd>${purchaseItem.supplier || purchase?.supplier || "-"}</dd>
      <dt>采购数量</dt><dd>${purchaseItem.quantity || "-"}</dd>
      <dt>已入库</dt><dd>${stats.stored || "-"}</dd>
      <dt>未入库数量</dt><dd>${stats.unstored === "" ? "-" : stats.unstored}</dd>
      <dt>入库状态</dt><dd>${stats.status ? badge(stats.status) : "-"}</dd>
      <dt>质检描述</dt><dd>${stats.latest?.qcDescription || "-"}</dd>
    </dl>
    <div class="detail-section">
      <div class="section-label">入库记录</div>
      ${receipts.length ? detailTable(
        ["入库日期", "入库数量", "入库状态", "质检描述", "异常说明", "操作"],
        receipts.map((item) => [
          item.arrivalDate || "-",
          item.storedQty || "-",
          badge(item.status),
          item.qcDescription || "-",
          item.exception || "-",
          rowActions("receipt", item.id)
        ])
      ) : `<div class="empty-state compact-empty">暂无入库记录</div>`}
    </div>
  </div>`;
  dialog.showModal();
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
}

function renderSettings() {
  $("#settingsGrid").innerHTML = settingSections
    .map((section) => {
      const options = state.settings[section.key] || [];
      return `<section class="setting-card">
        <div class="setting-card-head">
          <div>
            <strong>${section.title}</strong>
            <small>${section.desc}</small>
          </div>
          <button class="ghost-button small-button" data-action="add-setting-option" data-key="${section.key}">新增选项</button>
        </div>
        <div class="setting-option-list">
          ${options.map((option, index) => `<div class="setting-option">
            <span>${escapeHtml(option)}</span>
            <div class="setting-option-actions">
              <button class="text-button" data-action="edit-setting-option" data-key="${section.key}" data-index="${index}">编辑</button>
              <button class="text-button danger" data-action="delete-setting-option" data-key="${section.key}" data-index="${index}">删除</button>
            </div>
          </div>`).join("") || `<div class="empty-state compact-empty">暂无选项</div>`}
        </div>
      </section>`;
    })
    .join("");
}

function detailTable(headers, rows) {
  if (!rows.length) return `<div class="empty-state">暂无数据</div>`;
  return `<div class="table-wrap detail-table"><table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function rowActions(type, id, withView = false) {
  const view = withView ? `<button class="icon-button subtle" data-action="view-${type}" data-id="${id}" title="查看详情" aria-label="查看详情">${icons.view}</button>` : "";
  return `<div class="row-actions">${view}${rowActionButtons(type, id)}</div>`;
}

function rowActionButtons(type, id) {
  return `
    <button class="icon-button subtle" data-action="edit-${type}" data-id="${id}" title="编辑" aria-label="编辑">${icons.edit}</button>
    <button class="icon-button subtle danger" data-action="delete-${type}" data-id="${id}" title="删除" aria-label="删除">${icons.delete}</button>
  `;
}

function emptyRow(cols) {
  return `<tr><td colspan="${cols}">暂无数据</td></tr>`;
}

function render() {
  renderPageBackAction();
  renderPageActions();
  renderHomeDashboard();
  renderProjectCards();
  renderProjectDetail();
  renderPurchaseFilter();
  renderPurchases();
  renderReceiptFilter();
  renderReceipts();
  renderOutboundFilter();
  renderOutbounds();
  renderInventoryTabs();
  renderSettings();
}

function optionsFrom(key, selected = "") {
  return state.settings[key].map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${option}</option>`).join("");
}

function projectOptions(selected = "") {
  return state.projects.map((project) => `<option value="${project.id}" ${project.id === selected ? "selected" : ""}>${project.name}</option>`).join("");
}

function purchaseTaskOptions(selected = "") {
  return state.purchases.map((purchase) => `<option value="${purchase.id}" ${purchase.id === selected ? "selected" : ""}>${purchase.code || "未编号"} / ${purchase.name}</option>`).join("");
}

function purchaseItemOptions(selected = "", projectId = "") {
  const purchaseItems = projectId
    ? state.purchaseItems.filter((item) => purchaseTaskById(item.purchaseId)?.projectId === projectId)
    : state.purchaseItems;
  return purchaseItems.map((item) => {
    const purchase = purchaseTaskById(item.purchaseId);
    const label = item.materialId ? materialName(item.materialId) : `${item.itemName}${item.spec ? `（${item.spec}）` : ""}`;
    return `<option value="${item.id}" ${item.id === selected ? "selected" : ""}>${projectName(purchase?.projectId)} / ${purchase?.code || "未编号"} / ${label}</option>`;
  }).join("") || `<option value="">暂无可入库采购明细</option>`;
}

function materialOptions(selected = "", projectId = "") {
  const materials = projectId ? state.materials.filter((material) => material.projectId === projectId) : state.materials;
  return materials.map((material) => `<option value="${material.id}" ${material.id === selected ? "selected" : ""}>${projectName(material.projectId)} / ${material.name}${material.spec ? `（${material.spec}）` : ""}</option>`).join("");
}

function openDialog(id, defaults = {}) {
  const dialog = $(`#${id}`);
  dialog.innerHTML = dialogTemplate(id, defaults);
  dialog.showModal();
  dialog.querySelector("form").addEventListener("submit", handleSubmit);
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
}

function dialogTemplate(id, defaults = {}) {
  const map = {
    projectDialog: {
      title: defaults.id ? "编辑项目" : "新增项目",
      target: "projects",
      fields: [
        ["name", "项目名称", "text"],
        ["code", "项目编号（手动输入）", "text"],
        ["type", "项目类型", "setting", "projectTypes"],
        ["status", "项目状态", "setting", "projectStatuses"],
        ["owner", "负责人", "text"],
        ["internalDue", "内部截止时间", "date"],
        ["externalDue", "外部截止时间", "date"],
        ["summary", "项目情况概述", "textarea"]
      ]
    },
    taskDialog: {
      title: defaults.id ? "编辑任务" : "新增任务",
      target: "tasks",
      fields: [
        ["projectId", "所属项目", defaults.lockProject ? "hidden" : "project"],
        ["name", "任务名称", "text"],
        ["type", "任务类型", "setting", "taskTypes"],
        ["priority", "优先级", "select", ["P0", "P1", "P2"]],
        ["status", "任务状态", "select", ["未开始", "进行中", "阻塞", "待验收", "已完成", "取消"]],
        ["owner", "负责人", "text"],
        ["startDate", "计划开始时间", "date"],
        ["due", "计划截止时间", "date"],
        ["actualStart", "实际开始时间", "date"],
        ["actualEnd", "实际结束时间", "date"],
        ["remark", "任务备注", "textarea"]
      ]
    },
    materialDialog: {
      title: defaults.id ? "编辑BOM项" : "新增BOM项",
      target: "materials",
      fields: [
        ["projectId", "所属项目", defaults.lockProject ? "hidden" : "project"],
        ["name", "物料/零件名称", "text"],
        ["spec", "图号/规格型号", "text"],
        ["material", "材质", "text"],
        ["partType", "零件类型", "select", ["外购件", "机加件", "钣金件", "焊接件"]],
        ["quantityPerSet", "单套数量", "number"],
        ["totalQuantity", "总数量", "number"],
        ["unit", "单位", "text"],
        ["unitPrice", "单价", "number"],
        ["surfaceTreatment", "表面处理", "text"],
        ["brandOrSupplier", "品牌/建议供应商", "text"],
        ["purchaseLink", "采购链接", "url"],
        ["remark", "备注", "textarea"]
      ]
    },
    purchaseDialog: {
      title: defaults.id ? "编辑采购任务" : "新增采购任务",
      target: "purchases",
      fields: [
        ["sourceMaterialId", "", defaults.sourceMaterialId ? "hidden" : "none"],
        ["projectId", "所属项目", defaults.lockProject ? "hidden" : "project"],
        ["type", "采购类型", "select", ["采购合同", "对公付款", "其他"]],
        ["code", "采购编号", "text"],
        ["name", "采购名称", "text"],
        ["supplier", "供应商", "setting", "suppliers"],
        ["totalAmount", "合同总金额", "number"],
        ["applyDate", "采购申请时间", "date"],
        ["contractDate", "合同签订时间", "date"],
        ["expectedDelivery", "预计到货时间", "date"],
        ["status", "采购状态", "setting", "purchaseStatuses"],
        ["bomOutside", "是否BOM外新增", "select", ["否", "是"]],
        ["progressRemark", "采购进展备注", "textarea"],
        ["riskRemark", "异常/风险说明", "textarea"]
      ]
    },
    purchaseItemDialog: {
      title: defaults.id ? "编辑采购明细" : "新增采购明细",
      target: "purchaseItems",
      fields: [
        ["purchaseId", "所属采购任务", defaults.lockPurchase ? "hidden" : "purchaseTask"],
        ["materialId", "关联 BOM 项", defaults.lockMaterial ? "hidden" : "material"],
        ["itemName", "物料名称", "text"],
        ["spec", "规格型号", "text"],
        ["unit", "单位", "text"],
        ["quantity", "数量", "number"],
        ["unitPrice", "单价", "number"],
        ["supplier", "供应商", "setting", "suppliers"],
        ["remark", "备注", "textarea"]
      ]
    },
    receiptDialog: {
      title: defaults.id ? "编辑入库记录" : "新增入库记录",
      target: "receipts",
      fields: [
        ["purchaseItemId", "关联采购明细", defaults.lockPurchaseItem ? "hidden" : "purchaseItem"],
        ["arrivalDate", "入库日期", "date"],
        ["storedQty", "入库数量", "number"],
        ["status", "入库状态", "setting", "receiptStatuses"],
        ["qcDescription", "质检描述", "textarea"],
        ["exception", "异常说明", "textarea"]
      ]
    },
    outboundDialog: {
      title: defaults.id ? "编辑出库记录" : "新增出库记录",
      target: "outbounds",
      fields: [
        ["purchaseItemId", "关联采购明细", defaults.lockPurchaseItem ? "hidden" : "purchaseItem"],
        ["outboundDate", "出库日期", "date"],
        ["issuedQty", "出库数量", "number"],
        ["receiver", "领用人/部门", "text"],
        ["purpose", "用途", "text"],
        ["status", "出库状态", "setting", "outboundStatuses"],
        ["remark", "备注", "textarea"]
      ]
    }
  };
  const config = map[id];
  return `<div class="dialog-body">
    <h3>${config.title}</h3>
    <form data-target="${config.target}" data-id="${defaults.id || ""}">
      <div class="form-grid">${config.fields.map((field) => fieldTemplate(field, defaults)).join("")}</div>
      <div class="dialog-actions">
        <button type="button" class="ghost-button" data-close>取消</button>
        <button type="submit" class="primary-button">保存</button>
      </div>
    </form>
  </div>`;
}

function fieldTemplate([name, label, type, options], defaults = {}) {
  const full = type === "textarea" ? " full" : "";
  const value = defaults[name] ?? "";
  if (type === "none") return "";
  if (type === "hidden") return `<input name="${name}" type="hidden" value="${escapeHtml(value)}" />`;
  if (type === "select") return `<label class="${full}">${label}<select name="${name}">${options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${option}</option>`).join("")}</select></label>`;
  if (type === "setting") return `<label>${label}<select name="${name}">${optionsFrom(options, value)}</select></label>`;
  if (type === "project") return `<label>${label}<select name="${name}">${projectOptions(value)}</select></label>`;
  if (type === "purchaseTask") return `<label class="full">${label}<select name="${name}">${purchaseTaskOptions(value)}</select></label>`;
  if (type === "purchaseItem") return `<label class="full">${label}<select name="${name}">${purchaseItemOptions(value, defaults.projectId || "")}</select></label>`;
  if (type === "material") {
    const projectId = defaults.projectId || purchaseTaskById(defaults.purchaseId)?.projectId || "";
    return `<label class="full">${label}<select name="${name}"><option value="">不关联 BOM 项</option>${materialOptions(value, projectId)}</select></label>`;
  }
  if (type === "textarea") return `<label class="${full}">${label}<textarea name="${name}" rows="3">${escapeHtml(value)}</textarea></label>`;
  return `<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(value)}" /></label>`;
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const target = form.dataset.target;
  const data = Object.fromEntries(new FormData(form).entries());
  const editingId = form.dataset.id;

  if (target === "purchases") {
    data.status = mapPurchaseStatus(data.status);
    if (!data.projectId && selectedProjectId) data.projectId = selectedProjectId;
  }

  if (target === "purchaseItems") {
    const purchase = purchaseTaskById(data.purchaseId);
    const material = materialById(data.materialId);
    if (material) {
      data.itemName = data.itemName || material.name;
      data.spec = data.spec || material.spec || "";
      data.unit = data.unit || material.unit || "";
      data.supplier = data.supplier || material.brandOrSupplier || purchase?.supplier || "";
      data.remark = data.remark || "来源 BOM 项";
    } else if (purchase) {
      data.supplier = data.supplier || purchase.supplier || "";
    }
    data.totalPrice = calcTotal(data.quantity, data.unitPrice);
  }

  if (editingId) {
    const index = state[target].findIndex((item) => item.id === editingId);
    if (index >= 0) state[target][index] = { ...state[target][index], ...data, id: editingId };
  } else {
    const prefixes = { projects: "pr", tasks: "ta", materials: "ma", purchases: "po", purchaseItems: "pi", receipts: "re", outbounds: "ou" };
    data.id = `${prefixes[target] || "id"}${Date.now()}`;
    state[target].push(data);
  }

  if (target === "purchases" && !editingId && data.sourceMaterialId) {
    const material = materialById(data.sourceMaterialId);
    state.purchaseItems.push({
      id: `pu${Date.now()}1`,
      purchaseId: data.id,
      materialId: data.sourceMaterialId,
      itemName: material?.name || data.name,
      spec: material?.spec || "",
      unit: material?.unit || "",
      quantity: material?.totalQuantity || "",
      unitPrice: material?.unitPrice || "",
      totalPrice: calcTotal(material?.totalQuantity, material?.unitPrice),
      supplier: data.supplier || material?.brandOrSupplier || "",
      remark: material ? "来源 BOM 项" : ""
    });
  }

  if (target === "receipts") {
    if (!data.purchaseItemId) {
      window.alert("请先选择可入库的采购明细。");
      return;
    }
    syncPurchaseStatusByReceiptItem(data.purchaseItemId);
  }

  if (target === "outbounds" && !data.purchaseItemId) {
    window.alert("请先选择可出库的采购明细。");
    return;
  }

  if (target === "outbounds") {
    const currentRecord = editingId ? state.outbounds.find((item) => item.id === editingId) : null;
    const stats = stockStats(data.purchaseItemId);
    const available = safeNumber(stats.stock) + safeNumber(currentRecord?.issuedQty);
    if (safeNumber(data.issuedQty) > available) {
      window.alert(`当前可出库库存为 ${available}，请检查出库数量。`);
      return;
    }
    data.status = normalizeOutboundStatusValue(data.status, data.issuedQty);
  }

  if (target === "purchaseItems") {
    syncPurchaseStatusByReceiptItem(editingId || data.id);
  }

  if (target === "purchases") selectedPurchaseId = editingId || data.id;
  saveState();
  form.closest("dialog").close();
  render();
}

function syncPurchaseStatusByReceiptItem(purchaseItemId) {
  const purchaseItem = purchaseItemById(purchaseItemId);
  if (!purchaseItem) return;
  const purchase = purchaseTaskById(purchaseItem.purchaseId);
  if (!purchase) return;
  const items = purchaseItemsForTask(purchase.id);
  const itemStates = items.map((item) => receiptStatusForItem(item.id));
  if (!itemStates.some(Boolean)) return;
  if (itemStates.every((status) => status === "已入库")) {
    purchase.status = "已到货";
    return;
  }
  if (itemStates.some((status) => ["已入库", "部分入库"].includes(status))) {
    purchase.status = "部分到货";
  }
}

function latestReceiptStatus(purchaseItemId) {
  const receipts = receiptsForPurchaseItem(purchaseItemId);
  return receipts[receipts.length - 1]?.status || "";
}

function deleteProject(projectId) {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return false;
  const ok = window.confirm(`确认删除项目「${project.name}」？关联任务、BOM、采购任务、采购明细、入库记录和出库记录也会一起删除。`);
  if (!ok) return false;
  const materialIds = state.materials.filter((item) => item.projectId === projectId).map((item) => item.id);
  const purchaseIds = state.purchases.filter((item) => item.projectId === projectId).map((item) => item.id);
  const purchaseItemIds = state.purchaseItems.filter((item) => purchaseIds.includes(item.purchaseId) || materialIds.includes(item.materialId)).map((item) => item.id);
  state.projects = state.projects.filter((item) => item.id !== projectId);
  state.tasks = state.tasks.filter((item) => item.projectId !== projectId);
  state.materials = state.materials.filter((item) => item.projectId !== projectId);
  state.purchases = state.purchases.filter((item) => !purchaseIds.includes(item.id));
  state.purchaseItems = state.purchaseItems.filter((item) => !purchaseItemIds.includes(item.id));
  state.receipts = state.receipts.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
  state.outbounds = state.outbounds.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
  if (selectedProjectId === projectId) selectedProjectId = state.projects[0]?.id || "";
  saveState();
  render();
  return true;
}

function deleteTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  const ok = window.confirm(`确认删除任务「${task.name}」？`);
  if (!ok) return;
  state.tasks = state.tasks.filter((item) => item.id !== taskId);
  saveState();
  render();
}

function deleteMaterial(materialId) {
  const material = state.materials.find((item) => item.id === materialId);
  if (!material) return;
  const ok = window.confirm(`确认删除BOM项「${material.name}」？关联采购明细、入库记录和出库记录会一起删除。`);
  if (!ok) return;
  const purchaseItemIds = state.purchaseItems.filter((item) => item.materialId === materialId).map((item) => item.id);
  state.materials = state.materials.filter((item) => item.id !== materialId);
  state.purchaseItems = state.purchaseItems.filter((item) => item.materialId !== materialId);
  state.receipts = state.receipts.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
  state.outbounds = state.outbounds.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
  saveState();
  render();
}

function deletePurchase(purchaseId) {
  const purchase = purchaseTaskById(purchaseId);
  if (!purchase) return;
  const ok = window.confirm(`确认删除采购任务「${purchase.name}」？关联采购明细、入库记录和出库记录也会一起删除。`);
  if (!ok) return;
  const purchaseItemIds = purchaseItemsForTask(purchaseId).map((item) => item.id);
  state.purchases = state.purchases.filter((item) => item.id !== purchaseId);
  state.purchaseItems = state.purchaseItems.filter((item) => item.purchaseId !== purchaseId);
  state.receipts = state.receipts.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
  state.outbounds = state.outbounds.filter((item) => !purchaseItemIds.includes(item.purchaseItemId));
  if (selectedPurchaseId === purchaseId) selectedPurchaseId = state.purchases[0]?.id || "";
  closePurchaseDetailDialog();
  saveState();
  render();
}

function deletePurchaseItem(purchaseItemId) {
  const purchaseItem = purchaseItemById(purchaseItemId);
  if (!purchaseItem) return;
  const ok = window.confirm(`确认删除采购明细「${purchaseItem.itemName || materialName(purchaseItem.materialId)}」？关联入库记录和出库记录也会一起删除。`);
  if (!ok) return;
  state.purchaseItems = state.purchaseItems.filter((item) => item.id !== purchaseItemId);
  state.receipts = state.receipts.filter((item) => item.purchaseItemId !== purchaseItemId);
  state.outbounds = state.outbounds.filter((item) => item.purchaseItemId !== purchaseItemId);
  saveState();
  render();
  reopenPurchaseDetailIfNeeded(purchaseItem.purchaseId);
}

function deleteReceipt(receiptId) {
  const receipt = state.receipts.find((item) => item.id === receiptId);
  if (!receipt) return;
  const ok = window.confirm(`确认删除「${purchaseItemName(receipt.purchaseItemId)}」的入库记录？`);
  if (!ok) return;
  const detailOpen = $("#receiptDetailDialog").open;
  const purchaseItemId = receipt.purchaseItemId;
  const purchaseId = purchaseItemById(receipt.purchaseItemId)?.purchaseId;
  state.receipts = state.receipts.filter((item) => item.id !== receiptId);
  if (purchaseId) syncPurchaseStatusAfterReceiptDelete(purchaseId);
  if (detailOpen) closeReceiptDetailDialog();
  saveState();
  render();
  if (detailOpen) openReceiptItemDetail(purchaseItemId);
}

function deleteOutbound(outboundId) {
  const outbound = state.outbounds.find((item) => item.id === outboundId);
  if (!outbound) return;
  const ok = window.confirm(`确认删除「${purchaseItemName(outbound.purchaseItemId)}」的出库记录？`);
  if (!ok) return;
  state.outbounds = state.outbounds.filter((item) => item.id !== outboundId);
  saveState();
  render();
}

function syncPurchaseStatusAfterReceiptDelete(purchaseId) {
  const purchase = purchaseTaskById(purchaseId);
  if (!purchase) return;
  const items = purchaseItemsForTask(purchaseId);
  const itemStates = items.map((item) => latestReceiptStatus(item.id)).filter(Boolean);
  if (!itemStates.length) {
    purchase.status = "已下单";
    return;
  }
  if (itemStates.every((status) => status === "已入库")) {
    purchase.status = "已到货";
  } else if (itemStates.some((status) => ["已入库", "部分入库"].includes(status))) {
    purchase.status = "部分到货";
  } else {
    purchase.status = "已下单";
  }
}

function createPurchaseFromMaterial(materialId) {
  const material = materialById(materialId);
  if (!material) return;
  openDialog("purchaseDialog", {
    projectId: material.projectId,
    lockProject: true,
    sourceMaterialId: materialId,
    type: "采购合同",
    name: material.name,
    supplier: material.brandOrSupplier || "",
    status: "待询价",
    bomOutside: "否",
    progressRemark: material.remark || ""
  });
}

function closePurchaseDetailDialog() {
  const dialog = $("#purchaseDetailDialog");
  if (dialog.open) dialog.close();
}

function closeReceiptDetailDialog() {
  const dialog = $("#receiptDetailDialog");
  if (dialog.open) dialog.close();
}

function reopenPurchaseDetailIfNeeded(purchaseId) {
  const dialog = $("#purchaseDetailDialog");
  if (dialog.open) {
    dialog.close();
    openPurchaseDetail(purchaseId);
  }
}

function settingSectionTitle(key) {
  return settingSections.find((section) => section.key === key)?.title || "配置项";
}

function openSettingOptionDialog(key, index = "") {
  const dialog = $("#settingOptionDialog");
  const isEdit = index !== "";
  const value = isEdit ? state.settings[key][Number(index)] : "";
  dialog.innerHTML = `<div class="dialog-body">
    <h3>${isEdit ? "编辑" : "新增"}${settingSectionTitle(key)}</h3>
    <form data-setting-key="${key}" data-setting-index="${index}">
      <div class="form-grid">
        <label class="full">选项名称<input name="value" type="text" value="${escapeHtml(value)}" required /></label>
      </div>
      <div class="dialog-actions">
        <button type="button" class="ghost-button" data-close>取消</button>
        <button type="submit" class="primary-button">保存</button>
      </div>
    </form>
  </div>`;
  dialog.showModal();
  dialog.querySelector("form").addEventListener("submit", handleSettingOptionSubmit);
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
}

function handleSettingOptionSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const key = form.dataset.settingKey;
  const index = form.dataset.settingIndex;
  const value = new FormData(form).get("value").trim();
  if (!value) return;
  if (!state.settings[key]) state.settings[key] = [];
  if (index === "") {
    state.settings[key].push(value);
  } else {
    state.settings[key][Number(index)] = value;
  }
  saveState();
  form.closest("dialog").close();
  render();
}

function deleteSettingOption(key, index) {
  const value = state.settings[key]?.[Number(index)];
  if (!value) return;
  const ok = window.confirm(`确认删除「${value}」？`);
  if (!ok) return;
  state.settings[key].splice(Number(index), 1);
  saveState();
  render();
}

function renderPageActions() {
  const projectDetailActions = {
    overview: "",
    tasks: `<button class="ghost-button" id="detailAddTask" type="button">新增任务</button>`,
    bom: `<button class="ghost-button" id="detailAddMaterial" type="button">添加 BOM 项</button>`,
    purchases: `<button class="ghost-button" id="detailAddPurchase" type="button">新增采购记录</button>
      <button class="ghost-button" id="detailAddReceipt" type="button">新增入库记录</button>`,
    receipts: `<button class="ghost-button" id="detailAddReceipt" type="button">新增入库记录</button>`,
    outbounds: `<button class="ghost-button" id="detailAddOutbound" type="button">新增出库记录</button>`
  };
  const actions = {
    dashboard: "",
    projects: `<button class="primary-button" data-dialog="projectDialog">新增项目</button>`,
    projectDetailPage: projectDetailActions[selectedDetailTab] || "",
    procurement: `<button class="primary-button" data-dialog="purchaseDialog">新增采购任务</button>`,
    inventory: inventoryTab === "outbounds"
      ? `<button class="primary-button" data-dialog="outboundDialog">新增出库</button>`
      : `<button class="primary-button" data-dialog="receiptDialog">新增入库</button>`,
    settings: ""
  };
  $("#pageActions").innerHTML = actions[currentView] || "";
}

function renderPageBackAction() {
  const backActions = {
    projectDetailPage: `<button class="icon-button topbar-back" id="backToProjects" type="button" title="返回项目列表" aria-label="返回项目列表">${icons.back}</button>`
  };
  $("#pageBackAction").innerHTML = backActions[currentView] || "";
}

function setView(view) {
  currentView = view;
  const navView = view === "projectDetailPage" ? "projects" : view;
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === navView));
  $$(".view").forEach((pane) => pane.classList.toggle("active-view", pane.id === view));
  const titles = {
    dashboard: ["首页", "项目经营驾驶舱，关注进度、风险、采购和库存"],
    projects: ["项目管理", "查看项目列表、项目状态，并维护项目详情"],
    projectDetailPage: [projectName(selectedProjectId), "查看项目概览、项目任务、项目 BOM 表、采购、入库和出库记录"],
    procurement: ["采购管理", "按项目筛选采购任务，查看采购任务详情"],
    inventory: ["出入库管理", "统一查看项目物料入库、出库和当前库存"],
    settings: ["系统设置", "维护项目类型、任务类型、状态、供应商等下拉选项"]
  };
  $("#pageTitle").textContent = titles[view][0];
  $("#pageSubtitle").textContent = titles[view][1];
  $("#globalSearch").classList.toggle("hidden", view === "settings");
  renderPageBackAction();
  renderPageActions();
  renderInventoryTabs();
}

function bindEvents() {
  $$(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));

  document.addEventListener("click", (event) => {
    const dialogButton = event.target.closest("[data-dialog]");
    if (dialogButton) {
      openDialog(dialogButton.dataset.dialog);
      return;
    }

    const detailTab = event.target.closest("[data-detail-tab]");
    if (detailTab) {
      selectedDetailTab = detailTab.dataset.detailTab;
      renderProjectDetail();
      return;
    }

    const inventoryTabButton = event.target.closest("[data-inventory-tab]");
    if (inventoryTabButton) {
      inventoryTab = inventoryTabButton.dataset.inventoryTab;
      renderInventoryTabs();
      renderPageActions();
      return;
    }

    const projectFilterButton = event.target.closest("[data-project-filter]");
    if (projectFilterButton) {
      projectFilter = projectFilterButton.dataset.projectFilter;
      $$(".filter-chip").forEach((item) => item.classList.toggle("active", item === projectFilterButton));
      renderProjectCards();
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
      if (event.target.id === "backToProjects") setView("projects");
      if (event.target.id === "detailAddTask" && selectedProjectId) openDialog("taskDialog", { projectId: selectedProjectId, lockProject: true });
      if (event.target.id === "detailAddMaterial" && selectedProjectId) openDialog("materialDialog", { projectId: selectedProjectId, lockProject: true });
      if (event.target.id === "detailAddPurchase" && selectedProjectId) openDialog("purchaseDialog", { projectId: selectedProjectId, lockProject: true });
      if (event.target.id === "detailAddReceipt" && selectedProjectId) openDialog("receiptDialog", { projectId: selectedProjectId });
      if (event.target.id === "detailAddOutbound" && selectedProjectId) openDialog("outboundDialog", { projectId: selectedProjectId });
      return;
    }

    const { action, id } = actionButton.dataset;
    if (action === "select-project") {
      selectedProjectId = id;
      selectedDetailTab = "overview";
      setView("projectDetailPage");
      render();
    }
    if (action === "edit-project") openDialog("projectDialog", state.projects.find((item) => item.id === id));
    if (action === "delete-project") deleteProject(id);
    if (action === "edit-task") openDialog("taskDialog", state.tasks.find((item) => item.id === id));
    if (action === "delete-task") deleteTask(id);
    if (action === "edit-material") openDialog("materialDialog", state.materials.find((item) => item.id === id));
    if (action === "delete-material") deleteMaterial(id);
    if (action === "add-project-purchase") openDialog("purchaseDialog", { projectId: id, lockProject: true });
    if (action === "add-project-receipt") openDialog("receiptDialog", { projectId: id });
    if (action === "create-purchase") createPurchaseFromMaterial(id);
    if (action === "view-purchase") openPurchaseDetail(id);
    if (action === "edit-purchase") {
      closePurchaseDetailDialog();
      openDialog("purchaseDialog", purchaseTaskById(id));
    }
    if (action === "delete-purchase") deletePurchase(id);
    if (action === "add-purchase-item") {
      const purchase = purchaseTaskById(id);
      closePurchaseDetailDialog();
      if (purchase) openDialog("purchaseItemDialog", { purchaseId: id, projectId: purchase.projectId, supplier: purchase.supplier || "", lockPurchase: true });
    }
    if (action === "edit-purchase-item") {
      const item = purchaseItemById(id);
      closePurchaseDetailDialog();
      if (item) openDialog("purchaseItemDialog", { ...item, projectId: purchaseTaskById(item.purchaseId)?.projectId, lockPurchase: true });
    }
    if (action === "delete-purchase-item") deletePurchaseItem(id);
    if (action === "view-receipt-item") openReceiptItemDetail(id);
    if (action === "create-receipt") {
      const item = purchaseItemById(id);
      closePurchaseDetailDialog();
      closeReceiptDetailDialog();
      if (item) openDialog("receiptDialog", { purchaseItemId: id, lockPurchaseItem: true });
    }
    if (action === "edit-receipt") {
      closeReceiptDetailDialog();
      openDialog("receiptDialog", state.receipts.find((item) => item.id === id));
    }
    if (action === "delete-receipt") deleteReceipt(id);
    if (action === "create-outbound") openDialog("outboundDialog", { purchaseItemId: id, lockPurchaseItem: true });
    if (action === "edit-outbound") openDialog("outboundDialog", state.outbounds.find((item) => item.id === id));
    if (action === "delete-outbound") deleteOutbound(id);
    if (action === "select-purchase") {
      selectedPurchaseId = id;
      renderPurchases();
      openPurchaseDetail(id);
    }
    if (action === "add-setting-option") openSettingOptionDialog(actionButton.dataset.key);
    if (action === "edit-setting-option") openSettingOptionDialog(actionButton.dataset.key, actionButton.dataset.index);
    if (action === "delete-setting-option") deleteSettingOption(actionButton.dataset.key, actionButton.dataset.index);
  });

  $("#globalSearch").addEventListener("input", (event) => {
    searchTerm = event.target.value;
    render();
  });
  $("#purchaseProjectFilter").addEventListener("change", (event) => {
    purchaseProjectFilter = event.target.value;
    renderPurchases();
  });
  $("#receiptProjectFilter").addEventListener("change", (event) => {
    receiptProjectFilter = event.target.value;
    renderReceipts();
  });
  $("#outboundProjectFilter").addEventListener("change", (event) => {
    outboundProjectFilter = event.target.value;
    renderOutbounds();
  });
}

bindEvents();
render();
syncStateFromServer();
