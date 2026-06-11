const STORAGE_KEY = "langwei-project-management-v1";

const seedData = {
  projects: [
    {
      id: "p1",
      name: "半导体载盘缺陷检测仪",
      code: "LW-2026-XS-QXJC-02",
      type: "销售（SP）",
      status: "推进中",
      owner: "艾靖峰",
      internalDue: "2026-07-15",
      externalDue: "2026-07-15",
      summary: "采购与软件算法并行推进"
    },
    {
      id: "p2",
      name: "纤芯距测量仪",
      code: "LW-2026-RD-XXJ-07",
      type: "研发（RD）",
      status: "推进中",
      owner: "倪磊",
      internalDue: "2026-07-31",
      externalDue: "2026-10-31",
      summary: "结构设计进行中"
    },
    {
      id: "p3",
      name: "大矢高球形晶圆缺陷检测",
      code: "LW-2026-XS-QXJC-03",
      type: "销售（SP）",
      status: "未启动",
      owner: "艾靖峰",
      internalDue: "2026-05-29",
      externalDue: "2026-07-31",
      summary: "等待项目启动"
    }
  ],
  tasks: [
    { id: "t1", projectId: "p1", name: "需求说明书", type: "整体设计", priority: "P0", status: "进行中", owner: "莫亮", due: "2026-05-09" },
    { id: "t2", projectId: "p1", name: "机械结构 BOM", type: "整体设计", priority: "P0", status: "已完成", owner: "任志雄", due: "2026-05-28" },
    { id: "t3", projectId: "p1", name: "软件研发：功能、算法", type: "软件算法研发", priority: "P1", status: "进行中", owner: "倪磊", due: "2026-06-26" },
    { id: "t4", projectId: "p2", name: "结构设计", type: "整体设计", priority: "P0", status: "进行中", owner: "黄辉", due: "2026-06-20" },
    { id: "t5", projectId: "p2", name: "里程碑：完成物料采购", type: "物料采购", priority: "P0", status: "进行中", owner: "莫亮", due: "2026-07-31" },
    { id: "t6", projectId: "p3", name: "第一、二台硬件组装", type: "组装调试", priority: "P0", status: "未开始", owner: "黄辉", due: "2026-06-22" }
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
let currentView = "overview";
let searchTerm = "";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(seedData);
  try {
    return JSON.parse(raw);
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
  return state.purchases.find((purchase) => purchase.id === purchaseId)?.item || "未关联采购项";
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

function fmtPercent(value) {
  return `${Number.isInteger(value) ? value : value.toFixed(2)}%`;
}

function statusClass(status) {
  if (["已完成", "已入库", "已交付"].includes(status)) return "done";
  if (["推进中", "进行中", "已下单"].includes(status)) return "progress";
  if (["待询价", "待下单", "未开始", "未启动", "待到货", "部分入库"].includes(status)) return "warn";
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

function metrics() {
  const effectiveTasks = state.tasks.filter((task) => task.status !== "取消");
  const doneTasks = effectiveTasks.filter((task) => task.status === "已完成").length;
  const effectivePurchases = state.purchases.filter((purchase) => purchase.status !== "取消");
  const total = effectivePurchases.length;
  const pendingOrder = effectivePurchases.filter((purchase) => ["待询价", "待下单"].includes(purchase.status)).length;
  const stored = effectivePurchases.filter((purchase) => purchase.status === "已入库").length;
  const deliveryPending = effectivePurchases.filter((purchase) => purchase.status === "已下单").length;
  const orderCompletion = pct(total - pendingOrder, total);
  const stockCompletion = pct(stored, total);
  const nearestDelivery = effectivePurchases
    .filter((purchase) => purchase.status !== "已入库" && purchase.expectedDelivery)
    .map((purchase) => purchase.expectedDelivery)
    .sort()[0];

  return {
    total,
    pendingOrder,
    stored,
    deliveryPending,
    orderCompletion,
    stockCompletion,
    nearestDelivery,
    doneTasks,
    totalTasks: effectiveTasks.length,
    taskCompletion: pct(doneTasks, effectiveTasks.length)
  };
}

function projectCompletion(projectId) {
  const tasks = state.tasks.filter((task) => task.projectId === projectId && task.status !== "取消");
  return pct(tasks.filter((task) => task.status === "已完成").length, tasks.length);
}

function renderKpis() {
  const data = metrics();
  $("#projectCount").textContent = state.projects.length;
  $("#activeProjectCount").textContent = `推进中 ${state.projects.filter((project) => project.status === "推进中").length}`;
  $("#taskCompletion").textContent = fmtPercent(data.taskCompletion);
  $("#taskSummary").textContent = `${data.doneTasks} / ${data.totalTasks} 已完成`;
  $("#orderCompletion").textContent = fmtPercent(data.orderCompletion);
  $("#orderSummary").textContent = `待下单 ${data.pendingOrder} 项`;
  $("#stockCompletion").textContent = fmtPercent(data.stockCompletion);
  $("#stockSummary").textContent = `已入库 ${data.stored} 项`;
  $("#purchaseTotal").textContent = data.total;
  $("#pendingOrder").textContent = data.pendingOrder;
  $("#storedItems").textContent = data.stored;
  $("#deliveryPending").textContent = data.deliveryPending;
  $("#orderProgressLabel").textContent = fmtPercent(data.orderCompletion);
  $("#stockProgressLabel").textContent = fmtPercent(data.stockCompletion);
  $("#orderProgressBar").style.width = `${data.orderCompletion}%`;
  $("#stockProgressBar").style.width = `${data.stockCompletion}%`;
}

function renderProjects() {
  const rows = filtered(state.projects, [
    (item) => item.name,
    (item) => item.code,
    (item) => item.owner,
    (item) => item.type,
    (item) => item.status
  ]).map((project) => {
    const completion = projectCompletion(project.id);
    return `<tr>
      <td><strong>${project.name}</strong><br><small>${project.summary || ""}</small></td>
      <td>${project.code}</td>
      <td>${project.type}</td>
      <td>${badge(project.status)}</td>
      <td>${project.owner}</td>
      <td>${project.internalDue || "-"}</td>
      <td><div class="completion"><div class="mini-track"><span style="width:${completion}%"></span></div>${fmtPercent(completion)}</div></td>
    </tr>`;
  });
  $("#projectRows").innerHTML = rows.join("") || emptyRow(7);
}

function renderTasks() {
  const rows = filtered(state.tasks, [(item) => item.name, (item) => projectName(item.projectId), (item) => item.owner, (item) => item.type]).map((task) => `<tr>
    <td><strong>${task.name}</strong></td>
    <td>${projectName(task.projectId)}</td>
    <td>${task.type}</td>
    <td>${task.priority}</td>
    <td>${badge(task.status)}</td>
    <td>${task.owner}</td>
    <td>${task.due || "-"}</td>
  </tr>`);
  $("#taskRows").innerHTML = rows.join("") || emptyRow(7);
}

function renderMaterials() {
  const rows = filtered(state.materials, [(item) => item.name, (item) => item.spec, (item) => item.detail, (item) => projectName(item.projectId)]).map((item) => `<tr>
    <td><strong>${item.name}</strong></td>
    <td>${projectName(item.projectId)}</td>
    <td>${item.spec}</td>
    <td>${item.detail || "-"}</td>
    <td>${item.quantity || "-"} ${item.unit || ""}</td>
    <td>${item.requiredDate || "-"}</td>
    <td>${item.requester || "-"}</td>
  </tr>`);
  $("#materialRows").innerHTML = rows.join("") || emptyRow(7);
}

function renderPurchases() {
  const rows = filtered(state.purchases, [(item) => item.item, (item) => item.supplier, (item) => projectName(item.projectId), (item) => item.status]).map((item) => `<tr>
    <td><strong>${item.item}</strong></td>
    <td>${projectName(item.projectId)}</td>
    <td>${item.supplier || "-"}</td>
    <td>${badge(item.status)}</td>
    <td>${item.poNumber || "-"}</td>
    <td>${item.expectedDelivery || "-"}</td>
    <td>${badge(item.risk || "正常")}</td>
    <td>${item.remark || "-"}</td>
  </tr>`);
  $("#purchaseRows").innerHTML = rows.join("") || emptyRow(8);
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

function renderRisks() {
  const data = metrics();
  const risks = [
    { title: `待下单 ${data.pendingOrder} 项`, text: `偏离项比例 ${fmtPercent(pct(data.pendingOrder, data.total))}` },
    { title: `待交付 ${data.deliveryPending} 项`, text: data.nearestDelivery ? `最近交期 ${data.nearestDelivery}` : "暂无未完成交期" },
    { title: `异常项 ${state.purchases.filter((purchase) => purchase.status === "异常" || purchase.risk === "已延期").length} 项`, text: "采购延期、缺字段或入库异常会在这里汇总" }
  ];
  $("#riskList").innerHTML = risks.map((risk) => `<div class="risk-item"><strong>${risk.title}</strong><span>${risk.text}</span></div>`).join("");
}

function emptyRow(cols) {
  return `<tr><td colspan="${cols}">暂无数据</td></tr>`;
}

function render() {
  renderKpis();
  renderProjects();
  renderTasks();
  renderMaterials();
  renderPurchases();
  renderReceipts();
  renderRisks();
}

function projectOptions(selected = "") {
  return state.projects.map((project) => `<option value="${project.id}" ${project.id === selected ? "selected" : ""}>${project.name}</option>`).join("");
}

function purchaseOptions(selected = "") {
  return state.purchases.map((purchase) => `<option value="${purchase.id}" ${purchase.id === selected ? "selected" : ""}>${purchase.item}</option>`).join("");
}

function openDialog(id) {
  const dialog = $(`#${id}`);
  dialog.innerHTML = dialogTemplate(id);
  dialog.showModal();
  dialog.querySelector("form").addEventListener("submit", handleSubmit);
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
}

function dialogTemplate(id) {
  const map = {
    projectDialog: {
      title: "新增项目",
      target: "projects",
      fields: [
        ["name", "项目名称", "text"],
        ["code", "项目编号（手动输入）", "text"],
        ["type", "项目类型", "select", ["研发（RD）", "销售（SP）"]],
        ["status", "项目状态", "select", ["未立项", "已立项", "推进中", "暂停", "待交付", "已交付", "已关闭", "取消"]],
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
        ["type", "任务类型", "select", ["整体设计", "软件算法研发", "物料采购", "组装调试", "设备交付"]],
        ["priority", "优先级", "select", ["P0", "P1", "P2"]],
        ["status", "状态", "select", ["未开始", "进行中", "阻塞", "待验收", "已完成", "取消"]],
        ["owner", "负责人", "text"],
        ["due", "截止时间", "date"]
      ]
    },
    materialDialog: {
      title: "新增物料需求",
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
      title: "新增采购项",
      target: "purchases",
      fields: [
        ["projectId", "所属项目", "project"],
        ["item", "采购项", "text"],
        ["supplier", "供应商", "text"],
        ["status", "采购状态", "select", ["待询价", "待下单", "已下单", "已入库", "异常", "取消"]],
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
        ["purchaseId", "关联采购项", "purchase"],
        ["arrivalDate", "到货日期", "date"],
        ["arrivalQty", "到货数量", "number"],
        ["storedQty", "入库数量", "number"],
        ["status", "入库状态", "select", ["待到货", "已到货", "部分入库", "已入库", "入库异常"]],
        ["qcDescription", "质检描述", "textarea"],
        ["exception", "异常说明", "textarea"]
      ]
    }
  };
  const config = map[id];
  return `<div class="dialog-body">
    <h3>${config.title}</h3>
    <form data-target="${config.target}">
      <div class="form-grid">${config.fields.map(fieldTemplate).join("")}</div>
      <div class="dialog-actions">
        <button type="button" class="ghost-button" data-close>取消</button>
        <button type="submit" class="primary-button">保存</button>
      </div>
    </form>
  </div>`;
}

function fieldTemplate([name, label, type, options]) {
  const full = type === "textarea" ? " full" : "";
  if (type === "select") {
    return `<label class="${full}">${label}<select name="${name}">${options.map((option) => `<option>${option}</option>`).join("")}</select></label>`;
  }
  if (type === "project") {
    return `<label>${label}<select name="${name}">${projectOptions()}</select></label>`;
  }
  if (type === "purchase") {
    return `<label>${label}<select name="${name}">${purchaseOptions()}</select></label>`;
  }
  if (type === "textarea") {
    return `<label class="${full}">${label}<textarea name="${name}" rows="3"></textarea></label>`;
  }
  return `<label>${label}<input name="${name}" type="${type}" /></label>`;
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const target = form.dataset.target;
  const data = Object.fromEntries(new FormData(form).entries());
  data.id = `${target.slice(0, 2)}${Date.now()}`;

  if (target === "purchases" && data.status === "已入库") {
    data.risk = data.risk || "正常";
  }

  state[target].push(data);
  if (target === "receipts") {
    const purchase = state.purchases.find((item) => item.id === data.purchaseId);
    if (purchase && data.status === "已入库") purchase.status = "已入库";
  }
  saveState();
  form.closest("dialog").close();
  render();
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      currentView = button.dataset.view;
      $$(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
      $$(".view").forEach((view) => view.classList.toggle("active-view", view.id === currentView));
      $(".topbar h1").textContent = button.textContent;
    });
  });

  $$("[data-dialog]").forEach((button) => {
    button.addEventListener("click", () => openDialog(button.dataset.dialog));
  });

  $("#globalSearch").addEventListener("input", (event) => {
    searchTerm = event.target.value;
    render();
  });

  $("#resetData").addEventListener("click", () => {
    state = structuredClone(seedData);
    saveState();
    render();
  });
}

bindEvents();
render();
