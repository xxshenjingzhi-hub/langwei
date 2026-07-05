const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { Readable } = require("node:stream");
const test = require("node:test");

const dataDir = path.join(os.tmpdir(), `langwei-backend-test-${Date.now()}`);
process.env.DATA_DIR = dataDir;
process.env.BACKUP_DIR = path.join(dataDir, "backups");
process.env.MAX_BACKUPS = "20";

const { handleApi } = require("../backend/server");

async function request(pathname, options = {}) {
  const bodyText = options.body || "";
  const req = Readable.from(bodyText ? [Buffer.from(bodyText)] : []);
  req.method = options.method || "GET";
  req.url = pathname;
  req.headers = {
    "content-type": "application/json",
    ...(options.headers || {})
  };

  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      headers: {},
      writeHead(status, headers) {
        this.statusCode = status;
        this.headers = headers;
      },
      end(raw = "") {
        resolve({
          response: { status: this.statusCode, headers: this.headers },
          body: raw ? JSON.parse(raw) : null
        });
      }
    };
    handleApi(req, res).catch((error) => {
      resolve({
        response: { status: error.statusCode || 500, headers: {} },
        body: { error: { code: "TEST_HANDLER_ERROR", message: error.message } }
      });
    });
  });
}

test.before(async () => {
  await fs.rm(dataDir, { recursive: true, force: true });
});

test.after(async () => {
  await fs.rm(dataDir, { recursive: true, force: true });
});

test("dashboard returns project, risk, inventory and chart summaries", async () => {
  const { response, body } = await request("/api/dashboard?asOf=2026-07-05");
  assert.equal(response.status, 200);
  assert.equal(body.asOf, "2026-07-05");
  assert.equal(body.counts.projects, 3);
  assert.equal(body.quantities.stock, 1);
  assert.ok(Array.isArray(body.charts.projectStatuses));
  assert.ok(body.riskItems.some((item) => item.type === "任务逾期"));
});

test("sqlite database is initialized from seed with relational schema", async () => {
  await request("/api/state");
  const sqlitePath = path.join(dataDir, "db.sqlite");
  const stat = await fs.stat(sqlitePath);
  assert.ok(stat.size > 0);

  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name);
    for (const table of ["projects", "project_tasks", "bom_items", "purchases", "purchase_items", "receipt_records", "outbound_records", "dictionary_options"]) {
      assert.ok(tables.includes(table), `${table} table should exist`);
    }
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM projects").get().count, 3);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM dictionary_options WHERE type = 'suppliers'").get().count, 6);
  } finally {
    db.close();
  }
});

test("sqlite persists CRUD changes across API reads", async () => {
  const project = {
    id: "p-sqlite-persist",
    name: "SQLite 持久化项目",
    code: "LW-SQLITE-PERSIST",
    type: "研发（RD）",
    status: "进行中"
  };
  const created = await request("/api/projects", {
    method: "POST",
    body: JSON.stringify(project)
  });
  assert.equal(created.response.status, 201);

  const sqlitePath = path.join(dataDir, "db.sqlite");
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    assert.equal(db.prepare("SELECT name FROM projects WHERE id = ?").get(project.id).name, project.name);
  } finally {
    db.close();
  }

  const fetched = await request(`/api/projects/${project.id}`);
  assert.equal(fetched.response.status, 200);
  assert.equal(fetched.body.name, project.name);
});

test("resource CRUD works and writes backups", async () => {
  const project = {
    id: "p-test-crud",
    name: "后端测试项目",
    code: "LW-TEST-CRUD",
    type: "研发（RD）",
    status: "进行中",
    owner: "测试"
  };
  let result = await request("/api/projects", {
    method: "POST",
    body: JSON.stringify(project)
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.name, project.name);

  result = await request("/api/projects/p-test-crud", {
    method: "PUT",
    body: JSON.stringify({ status: "已结束" })
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, "已结束");

  result = await request("/api/projects/p-test-crud");
  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, "已结束");

  result = await request("/api/projects/p-test-crud", { method: "DELETE" });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.ok, true);

  const backups = await fs.readdir(path.join(dataDir, "backups"));
  assert.ok(backups.some((file) => file.endsWith(".json")));
});

test("deleting a project cascades related business objects", async () => {
  const projectId = "p-test-cascade";
  await request("/api/projects", {
    method: "POST",
    body: JSON.stringify({ id: projectId, name: "级联项目", code: "LW-TEST-CASCADE", type: "研发（RD）", status: "进行中" })
  });
  await request("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ id: "t-cascade", projectId, name: "级联任务", type: "设计", status: "进行中" })
  });
  await request("/api/materials", {
    method: "POST",
    body: JSON.stringify({ id: "m-cascade", projectId, name: "级联 BOM", totalQuantity: 2 })
  });
  await request("/api/purchases", {
    method: "POST",
    body: JSON.stringify({ id: "po-cascade", projectId, name: "级联采购", status: "已下单" })
  });
  await request("/api/purchaseItems", {
    method: "POST",
    body: JSON.stringify({ id: "pi-cascade", purchaseId: "po-cascade", materialId: "m-cascade", itemName: "级联 BOM", quantity: 2 })
  });
  await request("/api/receipts", {
    method: "POST",
    body: JSON.stringify({ id: "r-cascade", purchaseItemId: "pi-cascade", storedQty: 1, status: "部分入库" })
  });
  await request("/api/outbounds", {
    method: "POST",
    body: JSON.stringify({ id: "o-cascade", purchaseItemId: "pi-cascade", issuedQty: 1, status: "已出库" })
  });

  const deleted = await request(`/api/projects/${projectId}`, { method: "DELETE" });
  assert.equal(deleted.response.status, 200);

  const state = await request("/api/state");
  assert.equal(state.body.tasks.some((item) => item.id === "t-cascade"), false);
  assert.equal(state.body.materials.some((item) => item.id === "m-cascade"), false);
  assert.equal(state.body.purchases.some((item) => item.id === "po-cascade"), false);
  assert.equal(state.body.purchaseItems.some((item) => item.id === "pi-cascade"), false);
  assert.equal(state.body.receipts.some((item) => item.id === "r-cascade"), false);
  assert.equal(state.body.outbounds.some((item) => item.id === "o-cascade"), false);
});

test("receipt and outbound quantity validations prevent invalid stock data", async () => {
  let result = await request("/api/receipts", {
    method: "POST",
    body: JSON.stringify({ purchaseItemId: "pi1", storedQty: 999, status: "已入库" })
  });
  assert.equal(result.response.status, 400);
  assert.equal(result.body.error.code, "VALIDATION_ERROR");
  assert.match(result.body.error.message, /入库数量不能超过采购数量/);

  result = await request("/api/outbounds", {
    method: "POST",
    body: JSON.stringify({ purchaseItemId: "pi1", issuedQty: 999, status: "已出库" })
  });
  assert.equal(result.response.status, 400);
  assert.equal(result.body.error.code, "VALIDATION_ERROR");
  assert.match(result.body.error.message, /当前可出库库存/);
});

test("query parameters are validated", async () => {
  let result = await request("/api/projects?limit=abc");
  assert.equal(result.response.status, 400);
  assert.equal(result.body.error.code, "INVALID_QUERY");

  result = await request("/api/projects?sort=unknown");
  assert.equal(result.response.status, 400);
  assert.equal(result.body.error.code, "INVALID_QUERY");

  result = await request("/api/dashboard?asOf=not-a-date");
  assert.equal(result.response.status, 400);
  assert.equal(result.body.error.code, "INVALID_QUERY");
});

test("full state write can be disabled with ALLOW_STATE_WRITE=false", async () => {
  const state = await request("/api/state");
  process.env.ALLOW_STATE_WRITE = "false";
  const blocked = await request("/api/state", {
    method: "PUT",
    body: JSON.stringify(state.body)
  });
  process.env.ALLOW_STATE_WRITE = "true";
  assert.equal(blocked.response.status, 403);
  assert.equal(blocked.body.error.code, "STATE_WRITE_DISABLED");
});
