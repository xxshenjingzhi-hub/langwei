const assert = require("node:assert/strict");
const test = require("node:test");

function freshStorage() {
  delete require.cache[require.resolve("../backend/storage")];
  return require("../backend/storage");
}

test("storage defaults to sqlite when DATABASE_URL is not set", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const storage = freshStorage();
    assert.equal(storage.driverName, "sqlite");
    assert.equal(typeof storage.readDb, "function");
    assert.equal(typeof storage.writeDb, "function");
  } finally {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

test("storage selects postgres when DATABASE_URL is set", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgres://user:pass@example.com:5432/langwei";
  try {
    const storage = freshStorage();
    assert.equal(storage.driverName, "postgres");
    assert.equal(typeof storage.readDb, "function");
    assert.equal(typeof storage.writeDb, "function");
  } finally {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

test("postgres schema uses indexed relational tables and decimal money columns", () => {
  const postgresStorage = require("../backend/postgres-storage");
  const schemaSql = postgresStorage.tableSchemas.join("\n");
  const indexSql = postgresStorage.indexSchemas.join("\n");

  assert.match(schemaSql, /total_amount numeric\(14,2\)/);
  assert.match(schemaSql, /REFERENCES projects\(id\) ON DELETE CASCADE/);
  assert.match(indexSql, /purchase_items_purchase_id_idx ON purchase_items\(purchase_id\)/);
  assert.match(indexSql, /receipt_records_purchase_item_id_idx ON receipt_records\(purchase_item_id\)/);
});
