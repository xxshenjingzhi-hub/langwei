const STORAGE_KEY = "langwei-project-management-v3";

const defaultSettings = {
  projectTypes: ["研发（RD）", "销售（SP）"],
  taskTypes: ["设计", "采购", "组装", "交付"],
  projectStatuses: ["未立项", "已立项", "进行中", "暂停", "待交付", "已交付", "已结束", "取消"],
  purchaseStatuses: ["待询价", "待下单", "已下单", "已入库", "异常", "取消"],
  receiptStatuses: ["待到货", "已到货", "部分入库", "已入库", "入库异常"],
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
    { id: "t1", projectId: "p1", name: "需求说明书", type: "设计", priority: "P0", status: "进行中", owner: "莫亮", due: "2026-05-09" },
    { id: "t2", projectId: "p1", name: "机械结构 BOM", type: "设计", priority: "P0", status: "已完成", owner: "任志雄", due: "2026-05-28" },
    { id: "t3", projectId: "p1", name: "软件研发：功能、算法", type: "设计", priority: "P1", status: "进行中", owner: "倪磊", due: "2026-06-26" },
    { id: "t4", projectId: "p2", name: "结构设计", type: "设计", priority: "P0", status: "进行中", owner: "黄辉", due: "2026-06-20" },
    { id: "t5", projectId: "p2", name: "里程碑：完成物料采购", type: "采购", priority: "P0", status: "进行中", owner: "莫亮", due: "2026-07-31" },
    { id: "t6", projectId: "p3", name: "第一、二台硬件组装", type: "组装", priority: "P0", status: "已完成", owner: "黄辉", due: "2026-06-22" }
  ],
  materials: [
    { id: "m1", projectId: "p1", name: "海康工业相机", spec: "2500W 相机", detail: "部分相机已发货，需跟进 CXP 线", quantity: 2, unit: "台", requiredDate: "2026-06-20", requester: "倪磊" },
    { id: "m2", projectId: "p2", name: "尼康物镜", spec: "5x / 20x / 10x / 50x", detail: "10x、50x 交期两个月左右", quantity: 4, unit: "个", requiredDate: "2026-07-31", requester: "黄辉" },
    { id: "m3", projectId: "p3", name: "大理石机台与支架", spec: "诺焰定制", detail: "20 号两台，24 号四台", quantity: 6, unit: "套", requiredDate: "2026-06-22", requester: "艾靖峰" }
  ],
  purchases: [
    { id: "po1", projectId: "p1", materialId: "m1", item: "海康工业相机", supplier: "海康", status: "已下单", poNumber: "PO-20260604-01", expectedDelivery: "2026-06-20", risk: "正常", remark: "部分相机 9 号已发货" },
    { id: "po2", projectId: "p1", materialId: "m1", item: "CXP 线", supplier: "海康", status: "待下单", poNumber: "", expectedDelivery: "2026-06-22", risk: "临近延期", remark: "待确认型号" },
    { id: "po3", projectId: "p2", materialId: "m2", item: "尼康物镜", supplier: "尼康", status: "已下单", poNumber: "PO-20260511-03", expectedDelivery: "2026-07-31", risk: "已延期", remark: "部分倍率交期较长" },
    { id: "po4", projectId: "p3", materialId: "m3", item: "大理石机台与支架", supplier: "诺焰", status: "已入库", poNumber: "PO-20260604-08", expectedDelivery: "2026-06-20", risk: "正常", remark: "首批已入库" }
  ],
  receipts: [
    { id: "r1", purchaseId: "po4", arrivalDate: "2026-06-20", arrivalQty: 2, storedQty: 2, status: "已入库", qcDescription: "外观正常，尺寸待复核", exception: "" }
  ]
};

let state = loadState();
let currentView = "projects";
let searchTerm = "";
let projectFilter = "all";
let selectedProjectId = state.projects[0]?.id || "";
let selectedDetailTab = "overview";
let purchaseProjectFilter = "all";
let selectedPurchaseId = state.purchases[0]?.id || "";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(seedData);
  try {
    const parsed = JSON.parse(raw);
    parsed.settings = { ...structuredClone(defaultSettings), ...(parsed.settings || {}) };
    return parsed;
  } catch {
    return structuredClone(seedData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function projectName(projectId) {
  return state.projects.find((project) => project.id === projectId)?.name || "未关联项目";
}

function purchaseName(purchaseId) {
  return state.purchases.find((purchase) => purchase.id === purchaseId)?.item || "未关联采购任务";
}

function materialById(materialId) {
  return state.materials.find((material) => material.id === materialId);
}

function materialName(materialId) {
  const material = materialById(materialId);
  return material ? `${material.name}${material.spec ? `（${material.spec}）` : ""}` : "未关联BOM";
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

function fmtPercent(value) {
  return `${Number.isInteger(value) ? value : value.toFixed(2)}%`;
}

function isEndedProject(project) {
  return ["已结束", "已交付", "已关闭", "取消"].includes(project.status);
}

function isActiveProject(project) {
  return !isEndedProject(project);
}

function statusClass(status) {
  if (["已完成", "已入库", "已交付", "已结束", "已关闭"].includes(status)) return "done";
  if (["进行中", "推进中", "已下单"].includes(status)) return "progress";
  if (["待询价", "待下单", "未开始", "未立项", "待到货", "部分入库"].includes(status)) return "warn";
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

function metrics() {
  const effectiveTasks = state.tasks.filter((task) => task.status !== "取消");
  const doneTasks = effectiveTasks.filter((task) => task.status === "已完成").length;
  const effectivePurchases = state.purchases.filter((purchase) => purchase.status !== "取消");
  const total = effectivePurchases.length;
  const pendingOrder = effectivePurchases.filter((purchase) => ["待询价", "待下单"].includes(purchase.status)).length;
  const stored = effectivePurchases.filter((purchase) => purchase.status === "已入库").length;
  return {
    total,
    pendingOrder,
    stored,
    orderCompletion: pct(total - pendingOrder, total),
    stockCompletion: pct(stored, total),
    doneTasks,
    totalTasks: effectiveTasks.length,
    taskCompletion: pct(doneTasks, effectiveTasks.length)
  };
}

function projectDetailData(projectId) {
  const project = state.projects.find((item) => item.id === projectId);
  const tasks = state.tasks.filter((item) => item.projectId === projectId && item.status !== "取消");
  const bom = state.materials.filter((item) => item.projectId === projectId);
  const bomIds = bom.map((item) => item.id);
  const purchases = state.purchases.filter((item) => item.projectId === projectId || bomIds.includes(item.materialId));
  const receipts = state.receipts.filter((item) => purchases.some((purchase) => purchase.id === item.purchaseId));
  const doneTasks = tasks.filter((item) => item.status === "已完成").length;
  const stored = purchases.filter((item) => item.status === "已入库").length;
  const pendingOrder = purchases.filter((item) => ["待询价", "待下单"].includes(item.status)).length;
  const deliveryPending = purchases.filter((item) => item.status === "已下单").length;
  const nearestDelivery = purchases.filter((item) => item.status !== "已入库" && item.expectedDelivery).map((item) => item.expectedDelivery).sort()[0];
  return { project, tasks, bom, purchases, receipts, doneTasks, taskCompletion: pct(doneTasks, tasks.length), stored, pendingOrder, deliveryPending, nearestDelivery };
}

function renderKpis() {
  const data = metrics();
  $("#projectCount").textContent = state.projects.length;
  $("#activeProjectCount").textContent = `进行中 ${state.projects.filter(isActiveProject).length}`;
  $("#taskCompletion").textContent = fmtPercent(data.taskCompletion);
  $("#taskSummary").textContent = `${data.doneTasks} / ${data.totalTasks} 已完成`;
  $("#orderCompletion").textContent = fmtPercent(data.orderCompletion);
  $("#orderSummary").textContent = `待下单 ${data.pendingOrder} 项`;
  $("#stockCompletion").textContent = fmtPercent(data.stockCompletion);
  $("#stockSummary").textContent = `已入库 ${data.stored} 项`;
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
            <span>采购 ${detail.purchases.length}</span>
          </div>
          <div class="action-bar">
            <button class="text-button" data-action="edit-project" data-id="${project.id}">编辑</button>
            <button class="text-button danger" data-action="delete-project" data-id="${project.id}">删除</button>
          </div>
        </article>`;
      })
      .join("") || `<div class="empty-state">暂无项目</div>`;
}

function renderProjectDetail() {
  if (!state.projects.length) {
    selectedProjectId = "";
    $("#detailProjectName").textContent = "项目详情";
    $("#detailProjectMeta").textContent = "暂无项目，请先新增项目";
    $("#detailOverview").innerHTML = "";
    $("#detailTasks").innerHTML = "";
    $("#detailBom").innerHTML = "";
    $("#detailPurchases").innerHTML = "";
    return;
  }

  if (!state.projects.some((project) => project.id === selectedProjectId)) selectedProjectId = state.projects[0].id;
  const data = projectDetailData(selectedProjectId);
  const { project } = data;
  $("#detailProjectName").textContent = project.name;
  $("#detailProjectMeta").textContent = `${project.code} · ${project.type} · ${project.status} · 负责人：${project.owner || "未填写"}`;
  $("#detailTaskCompletion").textContent = fmtPercent(data.taskCompletion);
  $("#detailTaskCount").textContent = `${data.doneTasks} / ${data.tasks.length} 已完成`;
  $("#detailBomCount").textContent = data.bom.length;
  $("#detailPurchaseCount").textContent = data.purchases.length;
  $("#detailPurchaseStatus").textContent = `待下单 ${data.pendingOrder}`;
  $("#detailStoredCount").textContent = data.stored;
  $("#detailDeliveryPending").textContent = `待交付 ${data.deliveryPending}`;

  $("#detailOverview").innerHTML = `
    <div class="detail-summary">
      <div><span>项目状态</span>${badge(project.status)}</div>
      <div><span>内部截止</span><strong>${project.internalDue || "-"}</strong></div>
      <div><span>外部截止</span><strong>${project.externalDue || "-"}</strong></div>
      <div><span>最近采购交期</span><strong>${data.nearestDelivery || "-"}</strong></div>
    </div>
    <p class="detail-text">${project.summary || "暂无项目情况概述"}</p>
  `;
  $("#detailTasks").innerHTML = detailTable(["任务", "类型", "优先级", "状态", "负责人", "截止时间"], data.tasks.map((task) => [task.name, task.type, task.priority, badge(task.status), task.owner || "-", task.due || "-"]));
  $("#detailBom").innerHTML = detailTable(
    ["物料名称", "规格型号", "明细描述", "数量", "需求日期", "操作"],
    data.bom.map((item) => [item.name, item.spec || "-", item.detail || "-", `${item.quantity || "-"} ${item.unit || ""}`, item.requiredDate || "-", `<button class="text-button" data-action="create-purchase" data-id="${item.id}">生成采购任务</button>`])
  );
  $("#detailPurchases").innerHTML = detailTable(["采购任务", "来源BOM", "供应商", "状态", "订单号", "预计交期", "风险"], data.purchases.map((purchase) => [purchase.item, materialName(purchase.materialId), purchase.supplier || "-", badge(purchase.status), purchase.poNumber || "-", purchase.expectedDelivery || "-", badge(purchase.risk || "正常")]));

  $$(".detail-tab").forEach((button) => button.classList.toggle("active", button.dataset.detailTab === selectedDetailTab));
  $$(".detail-pane").forEach((pane) => pane.classList.remove("active-detail-pane"));
  $(`#detail${selectedDetailTab[0].toUpperCase()}${selectedDetailTab.slice(1)}`).classList.add("active-detail-pane");
}

function renderPurchaseFilter() {
  $("#purchaseProjectFilter").innerHTML = `<option value="all">全部项目</option>${state.projects.map((project) => `<option value="${project.id}" ${purchaseProjectFilter === project.id ? "selected" : ""}>${project.name}</option>`).join("")}`;
}

function renderPurchases() {
  let purchases = filtered(state.purchases, [(item) => item.item, (item) => item.supplier, (item) => projectName(item.projectId), (item) => item.status, (item) => materialName(item.materialId)]);
  if (purchaseProjectFilter !== "all") purchases = purchases.filter((item) => item.projectId === purchaseProjectFilter);
  if (!purchases.some((item) => item.id === selectedPurchaseId)) selectedPurchaseId = purchases[0]?.id || "";

  $("#purchaseRows").innerHTML =
    purchases
      .map((item) => `<tr class="${item.id === selectedPurchaseId ? "selected-row" : ""}">
        <td><button class="project-link" data-action="select-purchase" data-id="${item.id}">${item.item}</button></td>
        <td>${projectName(item.projectId)}</td>
        <td>${materialName(item.materialId)}</td>
        <td>${item.supplier || "-"}</td>
        <td>${badge(item.status)}</td>
        <td>${item.expectedDelivery || "-"}</td>
        <td><button class="text-button" data-action="select-purchase" data-id="${item.id}">详情</button></td>
      </tr>`)
      .join("") || emptyRow(7);
  renderPurchaseDetail();
}

function renderPurchaseDetail() {
  const purchase = state.purchases.find((item) => item.id === selectedPurchaseId);
  if (!purchase) {
    $("#purchaseDetailTitle").textContent = "采购任务详情";
    $("#purchaseDetailBody").innerHTML = "点击采购任务查看详情";
    return;
  }
  const receiptRows = state.receipts.filter((item) => item.purchaseId === purchase.id);
  $("#purchaseDetailTitle").textContent = purchase.item;
  $("#purchaseDetailBody").innerHTML = `
    <dl class="detail-list">
      <dt>所属项目</dt><dd>${projectName(purchase.projectId)}</dd>
      <dt>来源BOM</dt><dd>${materialName(purchase.materialId)}</dd>
      <dt>供应商</dt><dd>${purchase.supplier || "-"}</dd>
      <dt>采购状态</dt><dd>${badge(purchase.status)}</dd>
      <dt>订单号</dt><dd>${purchase.poNumber || "-"}</dd>
      <dt>预计交期</dt><dd>${purchase.expectedDelivery || "-"}</dd>
      <dt>风险</dt><dd>${badge(purchase.risk || "正常")}</dd>
      <dt>备注</dt><dd>${purchase.remark || "-"}</dd>
      <dt>入库记录</dt><dd>${receiptRows.length ? receiptRows.map((item) => `${item.arrivalDate || "-"} / ${item.status} / 入库 ${item.storedQty || "-"}`).join("<br>") : "暂无入库记录"}</dd>
    </dl>
  `;
}

function renderReceipts() {
  const rows = filtered(state.receipts, [(item) => purchaseName(item.purchaseId), (item) => item.qcDescription, (item) => item.exception]).map((item) => `<tr>
    <td><strong>${purchaseName(item.purchaseId)}</strong></td>
    <td>${item.arrivalDate || "-"}</td>
    <td>${item.arrivalQty || "-"}</td>
    <td>${item.storedQty || "-"}</td>
    <td>${badge(item.status)}</td>
    <td>${item.qcDescription || "-"}</td>
    <td>${item.exception || "-"}</td>
  </tr>`);
  $("#receiptRows").innerHTML = rows.join("") || emptyRow(7);
}

function renderSettings() {
  const map = {
    settingProjectTypes: "projectTypes",
    settingTaskTypes: "taskTypes",
    settingProjectStatuses: "projectStatuses",
    settingPurchaseStatuses: "purchaseStatuses",
    settingReceiptStatuses: "receiptStatuses",
    settingSuppliers: "suppliers"
  };
  Object.entries(map).forEach(([id, key]) => {
    const el = $(`#${id}`);
    if (el && document.activeElement !== el) el.value = state.settings[key].join("\n");
  });
}

function detailTable(headers, rows) {
  if (!rows.length) return `<div class="empty-state">暂无数据</div>`;
  return `<div class="table-wrap detail-table"><table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function emptyRow(cols) {
  return `<tr><td colspan="${cols}">暂无数据</td></tr>`;
}

function render() {
  renderKpis();
  renderProjectCards();
  renderProjectDetail();
  renderPurchaseFilter();
  renderPurchases();
  renderReceipts();
  renderSettings();
}

function optionsFrom(key, selected = "") {
  return state.settings[key].map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${option}</option>`).join("");
}

function projectOptions(selected = "") {
  return state.projects.map((project) => `<option value="${project.id}" ${project.id === selected ? "selected" : ""}>${project.name}</option>`).join("");
}

function purchaseOptions(selected = "") {
  return state.purchases.map((purchase) => `<option value="${purchase.id}" ${purchase.id === selected ? "selected" : ""}>${purchase.item}</option>`).join("");
}

function materialOptions(selected = "") {
  return state.materials.map((material) => `<option value="${material.id}" ${material.id === selected ? "selected" : ""}>${projectName(material.projectId)} / ${material.name} ${material.spec ? `（${material.spec}）` : ""}</option>`).join("");
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
      title: "新增任务",
      target: "tasks",
      fields: [
        ["projectId", "所属项目", "project"],
        ["name", "任务名称", "text"],
        ["type", "任务类型", "setting", "taskTypes"],
        ["priority", "优先级", "select", ["P0", "P1", "P2"]],
        ["status", "状态", "select", ["未开始", "进行中", "阻塞", "待验收", "已完成", "取消"]],
        ["owner", "负责人", "text"],
        ["due", "截止时间", "date"]
      ]
    },
    materialDialog: {
      title: "新增BOM物料",
      target: "materials",
      fields: [
        ["projectId", "所属项目", "project"],
        ["name", "物料名称", "text"],
        ["spec", "规格型号", "text"],
        ["detail", "物料明细描述", "textarea"],
        ["quantity", "数量", "number"],
        ["unit", "单位", "text"],
        ["requiredDate", "需求日期", "date"],
        ["requester", "需求人", "text"]
      ]
    },
    purchaseDialog: {
      title: "新增采购任务",
      target: "purchases",
      fields: [
        ["materialId", "来源BOM物料", "material"],
        ["item", "采购任务", "text"],
        ["supplier", "供应商", "setting", "suppliers"],
        ["status", "采购状态", "setting", "purchaseStatuses"],
        ["poNumber", "订单号", "text"],
        ["expectedDelivery", "预计交期", "date"],
        ["risk", "风险", "select", ["正常", "临近延期", "已延期"]],
        ["remark", "采购备注", "textarea"]
      ]
    },
    receiptDialog: {
      title: "新增入库记录",
      target: "receipts",
      fields: [
        ["purchaseId", "关联采购任务", "purchase"],
        ["arrivalDate", "到货日期", "date"],
        ["arrivalQty", "到货数量", "number"],
        ["storedQty", "入库数量", "number"],
        ["status", "入库状态", "setting", "receiptStatuses"],
        ["qcDescription", "质检描述", "textarea"],
        ["exception", "异常说明", "textarea"]
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
  if (type === "select") return `<label class="${full}">${label}<select name="${name}">${options.map((option) => `<option ${option === value ? "selected" : ""}>${option}</option>`).join("")}</select></label>`;
  if (type === "setting") return `<label>${label}<select name="${name}">${optionsFrom(options, value)}</select></label>`;
  if (type === "project") return `<label>${label}<select name="${name}">${projectOptions(value)}</select></label>`;
  if (type === "material") return `<label class="full">${label}<select name="${name}">${materialOptions(value)}</select></label>`;
  if (type === "purchase") return `<label>${label}<select name="${name}">${purchaseOptions(value)}</select></label>`;
  if (type === "textarea") return `<label class="${full}">${label}<textarea name="${name}" rows="3">${value}</textarea></label>`;
  return `<label>${label}<input name="${name}" type="${type}" value="${value}" /></label>`;
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const target = form.dataset.target;
  const data = Object.fromEntries(new FormData(form).entries());
  const editingId = form.dataset.id;

  if (target === "purchases") {
    const material = materialById(data.materialId);
    if (material) {
      data.projectId = material.projectId;
      data.item = data.item || material.name;
      data.remark = data.remark || `来源BOM：${material.name}${material.spec ? ` / ${material.spec}` : ""}`;
    }
  }

  if (editingId) {
    const index = state[target].findIndex((item) => item.id === editingId);
    if (index >= 0) state[target][index] = { ...state[target][index], ...data, id: editingId };
  } else {
    data.id = `${target.slice(0, 2)}${Date.now()}`;
    state[target].push(data);
  }

  if (target === "receipts") {
    const purchase = state.purchases.find((item) => item.id === data.purchaseId);
    if (purchase && data.status === "已入库") purchase.status = "已入库";
  }
  if (target === "purchases") selectedPurchaseId = editingId || data.id;
  saveState();
  form.closest("dialog").close();
  render();
}

function deleteProject(projectId) {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return;
  const ok = window.confirm(`确认删除项目「${project.name}」？关联任务、BOM、采购任务和入库记录也会一起删除。`);
  if (!ok) return;
  const materialIds = state.materials.filter((item) => item.projectId === projectId).map((item) => item.id);
  const purchaseIds = state.purchases.filter((item) => item.projectId === projectId || materialIds.includes(item.materialId)).map((item) => item.id);
  state.projects = state.projects.filter((item) => item.id !== projectId);
  state.tasks = state.tasks.filter((item) => item.projectId !== projectId);
  state.materials = state.materials.filter((item) => item.projectId !== projectId);
  state.purchases = state.purchases.filter((item) => !purchaseIds.includes(item.id));
  state.receipts = state.receipts.filter((item) => !purchaseIds.includes(item.purchaseId));
  if (selectedProjectId === projectId) selectedProjectId = state.projects[0]?.id || "";
  saveState();
  render();
}

function createPurchaseFromMaterial(materialId) {
  const material = materialById(materialId);
  if (!material) return;
  openDialog("purchaseDialog", { materialId, item: material.name, expectedDelivery: material.requiredDate, remark: `来源BOM：${material.name}${material.spec ? ` / ${material.spec}` : ""}` });
}

function saveSettings() {
  const map = {
    settingProjectTypes: "projectTypes",
    settingTaskTypes: "taskTypes",
    settingProjectStatuses: "projectStatuses",
    settingPurchaseStatuses: "purchaseStatuses",
    settingReceiptStatuses: "receiptStatuses",
    settingSuppliers: "suppliers"
  };
  Object.entries(map).forEach(([id, key]) => {
    const values = $(`#${id}`).value.split("\n").map((item) => item.trim()).filter(Boolean);
    if (values.length) state.settings[key] = values;
  });
  saveState();
  render();
}

function setView(view) {
  currentView = view;
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  $$(".view").forEach((pane) => pane.classList.toggle("active-view", pane.id === view));
  const titles = {
    projects: ["项目管理", "查看项目列表、项目状态，并维护项目详情"],
    procurement: ["采购管理", "按项目筛选采购任务，查看采购任务详情和入库记录"],
    settings: ["系统设置", "维护项目类型、任务类型、状态、供应商等下拉选项"]
  };
  $("#pageTitle").textContent = titles[view][0];
  $("#pageSubtitle").textContent = titles[view][1];
}

function bindEvents() {
  $$(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  $$("[data-dialog]").forEach((button) => button.addEventListener("click", () => openDialog(button.dataset.dialog)));

  document.addEventListener("click", (event) => {
    const detailTab = event.target.closest("[data-detail-tab]");
    if (detailTab) {
      selectedDetailTab = detailTab.dataset.detailTab;
      renderProjectDetail();
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
      if (event.target.id === "detailAddTask" && selectedProjectId) openDialog("taskDialog", { projectId: selectedProjectId });
      if (event.target.id === "detailAddMaterial" && selectedProjectId) openDialog("materialDialog", { projectId: selectedProjectId });
      if (event.target.id === "detailEditProject" && selectedProjectId) openDialog("projectDialog", state.projects.find((item) => item.id === selectedProjectId));
      if (event.target.id === "detailDeleteProject" && selectedProjectId) deleteProject(selectedProjectId);
      return;
    }

    const { action, id } = actionButton.dataset;
    if (action === "select-project") {
      selectedProjectId = id;
      selectedDetailTab = "overview";
      render();
    }
    if (action === "edit-project") openDialog("projectDialog", state.projects.find((item) => item.id === id));
    if (action === "delete-project") deleteProject(id);
    if (action === "create-purchase") createPurchaseFromMaterial(id);
    if (action === "select-purchase") {
      selectedPurchaseId = id;
      renderPurchases();
    }
  });

  $("#globalSearch").addEventListener("input", (event) => {
    searchTerm = event.target.value;
    render();
  });
  $("#purchaseProjectFilter").addEventListener("change", (event) => {
    purchaseProjectFilter = event.target.value;
    renderPurchases();
  });
  $("#saveSettings").addEventListener("click", saveSettings);
  $("#resetData").addEventListener("click", () => {
    state = structuredClone(seedData);
    selectedProjectId = state.projects[0]?.id || "";
    selectedPurchaseId = state.purchases[0]?.id || "";
    purchaseProjectFilter = "all";
    saveState();
    render();
  });
}

bindEvents();
render();
