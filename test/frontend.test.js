const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function createClassList() {
  const values = new Set();
  return {
    add(value) {
      values.add(value);
    },
    remove(value) {
      values.delete(value);
    },
    toggle(value, force) {
      const shouldAdd = force === undefined ? !values.has(value) : Boolean(force);
      if (shouldAdd) values.add(value);
      else values.delete(value);
      return shouldAdd;
    },
    contains(value) {
      return values.has(value);
    }
  };
}

function createElement(id = "") {
  return {
    id,
    innerHTML: "",
    textContent: "",
    open: false,
    classList: createClassList(),
    dataset: {},
    addEventListener() {},
    querySelector() {
      return createElement();
    },
    closest() {
      return null;
    },
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
    }
  };
}

function loadFrontend(overrides = {}) {
  const elements = new Map();
  const elementFor = (selector) => {
    if (!elements.has(selector)) elements.set(selector, createElement(selector));
    return elements.get(selector);
  };
  const localStorageData = new Map();
  const context = {
    console,
    structuredClone,
    location: { protocol: overrides.protocol || "file:" },
    localStorage: {
      getItem(key) {
        return localStorageData.has(key) ? localStorageData.get(key) : null;
      },
      setItem(key, value) {
        localStorageData.set(key, String(value));
      }
    },
    document: {
      querySelector: elementFor,
      querySelectorAll(selector) {
        if (!elements.has(selector)) {
          elements.set(selector, [createElement(selector)]);
        }
        return elements.get(selector);
      },
      addEventListener() {}
    },
    window: {
      alert(message) {
        context.__alerts.push(message);
      },
      confirm() {
        return true;
      }
    },
    fetch: overrides.fetch,
    FormData: overrides.FormData || global.FormData,
    __alerts: []
  };
  context.globalThis = context;
  context.window.document = context.document;

  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  vm.runInNewContext(
    `${source}\nglobalThis.__frontend = { state, renderProjectCards, handleSubmit, deleteProject, stockStats };`,
    context,
    { filename: "app.js" }
  );
  return { context, elements, frontend: context.__frontend };
}

test("HTTP submit creates resources with object CRUD instead of full state PUT", async () => {
  class ProjectFormData {
    entries() {
      return [
        ["name", "对象级保存项目"],
        ["code", "LW-CRUD-01"],
        ["type", "研发（RD）"],
        ["status", "进行中"],
        ["owner", "测试"],
        ["internalDue", "2026-07-10"],
        ["externalDue", "2026-07-20"],
        ["summary", ""]
      ];
    }
  }
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: options.method === "POST" ? 201 : 200,
      async json() {
        if (url === "/api/state") return { settings: {}, projects: [], tasks: [], materials: [], purchases: [], purchaseItems: [], receipts: [], outbounds: [] };
        return JSON.parse(options.body || "{}");
      }
    };
  };
  const { frontend } = loadFrontend({ protocol: "http:", fetch, FormData: ProjectFormData });

  await frontend.handleSubmit({
    preventDefault() {},
    currentTarget: {
      dataset: { target: "projects", id: "" },
      closest() {
        return { close() {} };
      }
    }
  });

  assert.equal(calls.some((call) => call.url === "/api/state" && call.options.method === "PUT"), false);
  assert.equal(calls.some((call) => call.url === "/api/projects" && call.options.method === "POST"), true);
});

test("HTTP project deletion uses object DELETE instead of full state PUT", async () => {
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      async json() {
        if (url === "/api/state") return { settings: {}, projects: [], tasks: [], materials: [], purchases: [], purchaseItems: [], receipts: [], outbounds: [] };
        return { ok: true };
      }
    };
  };
  const { frontend } = loadFrontend({ protocol: "http:", fetch });
  frontend.state.projects = [{ id: "p-delete", name: "待删除项目" }];
  frontend.state.tasks = [];
  frontend.state.materials = [];
  frontend.state.purchases = [];
  frontend.state.purchaseItems = [];
  frontend.state.receipts = [];
  frontend.state.outbounds = [];

  await frontend.deleteProject("p-delete");

  assert.equal(calls.some((call) => call.url === "/api/state" && call.options.method === "PUT"), false);
  assert.equal(calls.some((call) => call.url === "/api/projects/p-delete" && call.options.method === "DELETE"), true);
});

test("project card rendering escapes user-controlled fields", () => {
  const { elements, frontend } = loadFrontend();
  frontend.state.projects = [
    {
      id: "p-xss",
      name: `<img src=x onerror="alert(1)">`,
      code: `LW-<script>alert(2)</script>`,
      type: "研发（RD）",
      status: "进行中",
      owner: `<svg onload="alert(3)">`,
      internalDue: "2026-07-05",
      summary: `<iframe srcdoc="<script>alert(4)</script>"></iframe>`
    }
  ];
  frontend.state.tasks = [];
  frontend.state.materials = [];
  frontend.state.purchases = [];
  frontend.state.purchaseItems = [];

  frontend.renderProjectCards();

  const html = elements.get("#projectCards").innerHTML;
  assert.equal(html.includes("<img"), false);
  assert.equal(html.includes("<script"), false);
  assert.equal(html.includes("<iframe"), false);
  assert.match(html, /&lt;img/);
});

test("invalid outbound submit does not mutate in-memory state", () => {
  class TestFormData {
    entries() {
      return [
        ["purchaseItemId", "pi-test"],
        ["outboundDate", "2026-07-05"],
        ["issuedQty", "2"],
        ["receiver", "组装"],
        ["purpose", "测试"],
        ["status", "已出库"],
        ["remark", ""]
      ];
    }
  }
  const { context, frontend } = loadFrontend({ FormData: TestFormData });
  frontend.state.purchaseItems = [{ id: "pi-test", purchaseId: "po-test", itemName: "测试物料", quantity: 1 }];
  frontend.state.receipts = [{ id: "r-test", purchaseItemId: "pi-test", storedQty: 1, status: "已入库" }];
  frontend.state.outbounds = [];

  frontend.handleSubmit({
    preventDefault() {},
    currentTarget: {
      dataset: { target: "outbounds", id: "" },
      closest() {
        return { close() {} };
      }
    }
  });

  assert.equal(frontend.state.outbounds.length, 0);
  assert.match(context.__alerts.at(-1), /当前可出库库存为 1/);
});
