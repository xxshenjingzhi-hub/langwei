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
    location: { protocol: "file:" },
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
    FormData: overrides.FormData || global.FormData,
    __alerts: []
  };
  context.globalThis = context;
  context.window.document = context.document;

  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  vm.runInNewContext(
    `${source}\nglobalThis.__frontend = { state, renderProjectCards, handleSubmit, stockStats };`,
    context,
    { filename: "app.js" }
  );
  return { context, elements, frontend: context.__frontend };
}

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
