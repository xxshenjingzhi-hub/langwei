const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, "data");
const LEGACY_JSON_PATH = path.join(DATA_DIR, "db.json");
const SEED_PATH = process.env.SEED_PATH ? path.resolve(process.env.SEED_PATH) : path.join(__dirname, "data", "seed.json");
const BACKUP_DIR = process.env.BACKUP_DIR ? path.resolve(process.env.BACKUP_DIR) : path.join(DATA_DIR, "backups");
const DATABASE_URL = process.env.DATABASE_URL || "";

const resourceList = ["projects", "tasks", "materials", "purchases", "purchaseItems", "receipts", "outbounds"];

const tableSchemas = [
  `CREATE TABLE IF NOT EXISTS projects (
    id text PRIMARY KEY,
    name text NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    status text NOT NULL,
    owner text,
    internal_due date,
    external_due date,
    summary text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS project_tasks (
    id text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL,
    priority text,
    status text NOT NULL,
    owner text,
    start_date date,
    due_date date,
    actual_start date,
    actual_end date,
    remark text
  )`,
  `CREATE TABLE IF NOT EXISTS bom_items (
    id text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    spec text,
    material text,
    part_type text,
    quantity_per_set numeric(12,2),
    total_quantity numeric(12,2),
    unit text,
    unit_price numeric(14,2),
    surface_treatment text,
    brand_or_supplier text,
    purchase_link text,
    remark text
  )`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id text PRIMARY KEY,
    project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type text,
    code text,
    name text NOT NULL,
    supplier text,
    total_amount numeric(14,2),
    apply_date date,
    contract_date date,
    expected_delivery date,
    status text,
    bom_outside text,
    progress_remark text,
    risk_remark text
  )`,
  `CREATE TABLE IF NOT EXISTS purchase_items (
    id text PRIMARY KEY,
    purchase_id text NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    bom_item_id text REFERENCES bom_items(id) ON DELETE SET NULL,
    item_name text NOT NULL,
    spec text,
    unit text,
    quantity numeric(12,2),
    unit_price numeric(14,2),
    total_price numeric(14,2),
    supplier text,
    remark text
  )`,
  `CREATE TABLE IF NOT EXISTS receipt_records (
    id text PRIMARY KEY,
    purchase_item_id text NOT NULL REFERENCES purchase_items(id) ON DELETE CASCADE,
    arrival_date date,
    arrival_qty numeric(12,2),
    stored_qty numeric(12,2),
    status text,
    qc_description text,
    exception text
  )`,
  `CREATE TABLE IF NOT EXISTS outbound_records (
    id text PRIMARY KEY,
    purchase_item_id text NOT NULL REFERENCES purchase_items(id) ON DELETE CASCADE,
    outbound_date date,
    issued_qty numeric(12,2),
    receiver text,
    purpose text,
    status text,
    remark text
  )`,
  `CREATE TABLE IF NOT EXISTS dictionary_options (
    id text PRIMARY KEY,
    type text NOT NULL,
    value text NOT NULL,
    sort_order integer DEFAULT 0,
    enabled boolean DEFAULT true,
    UNIQUE(type, value)
  )`
];

const indexSchemas = [
  "CREATE INDEX IF NOT EXISTS project_tasks_project_id_idx ON project_tasks(project_id)",
  "CREATE INDEX IF NOT EXISTS bom_items_project_id_idx ON bom_items(project_id)",
  "CREATE INDEX IF NOT EXISTS purchases_project_id_idx ON purchases(project_id)",
  "CREATE INDEX IF NOT EXISTS purchase_items_purchase_id_idx ON purchase_items(purchase_id)",
  "CREATE INDEX IF NOT EXISTS purchase_items_bom_item_id_idx ON purchase_items(bom_item_id)",
  "CREATE INDEX IF NOT EXISTS receipt_records_purchase_item_id_idx ON receipt_records(purchase_item_id)",
  "CREATE INDEX IF NOT EXISTS outbound_records_purchase_item_id_idx ON outbound_records(purchase_item_id)",
  "CREATE INDEX IF NOT EXISTS dictionary_options_type_sort_order_idx ON dictionary_options(type, sort_order)"
];

const numericColumns = new Set([
  "quantity_per_set",
  "total_quantity",
  "unit_price",
  "total_amount",
  "quantity",
  "total_price",
  "arrival_qty",
  "stored_qty",
  "issued_qty"
]);

const mappings = {
  projects: {
    table: "projects",
    columns: [
      ["id", "id"], ["name", "name"], ["code", "code"], ["type", "type"], ["status", "status"],
      ["owner", "owner"], ["internalDue", "internal_due"], ["externalDue", "external_due"], ["summary", "summary"]
    ]
  },
  tasks: {
    table: "project_tasks",
    columns: [
      ["id", "id"], ["projectId", "project_id"], ["name", "name"], ["type", "type"], ["priority", "priority"],
      ["status", "status"], ["owner", "owner"], ["startDate", "start_date"], ["due", "due_date"],
      ["actualStart", "actual_start"], ["actualEnd", "actual_end"], ["remark", "remark"]
    ]
  },
  materials: {
    table: "bom_items",
    columns: [
      ["id", "id"], ["projectId", "project_id"], ["name", "name"], ["spec", "spec"], ["material", "material"],
      ["partType", "part_type"], ["quantityPerSet", "quantity_per_set"], ["totalQuantity", "total_quantity"],
      ["unit", "unit"], ["unitPrice", "unit_price"], ["surfaceTreatment", "surface_treatment"],
      ["brandOrSupplier", "brand_or_supplier"], ["purchaseLink", "purchase_link"], ["remark", "remark"]
    ]
  },
  purchases: {
    table: "purchases",
    columns: [
      ["id", "id"], ["projectId", "project_id"], ["type", "type"], ["code", "code"], ["name", "name"],
      ["supplier", "supplier"], ["totalAmount", "total_amount"], ["applyDate", "apply_date"],
      ["contractDate", "contract_date"], ["expectedDelivery", "expected_delivery"], ["status", "status"],
      ["bomOutside", "bom_outside"], ["progressRemark", "progress_remark"], ["riskRemark", "risk_remark"]
    ]
  },
  purchaseItems: {
    table: "purchase_items",
    columns: [
      ["id", "id"], ["purchaseId", "purchase_id"], ["materialId", "bom_item_id"], ["itemName", "item_name"],
      ["spec", "spec"], ["unit", "unit"], ["quantity", "quantity"], ["unitPrice", "unit_price"],
      ["totalPrice", "total_price"], ["supplier", "supplier"], ["remark", "remark"]
    ]
  },
  receipts: {
    table: "receipt_records",
    columns: [
      ["id", "id"], ["purchaseItemId", "purchase_item_id"], ["arrivalDate", "arrival_date"],
      ["arrivalQty", "arrival_qty"], ["storedQty", "stored_qty"], ["status", "status"],
      ["qcDescription", "qc_description"], ["exception", "exception"]
    ]
  },
  outbounds: {
    table: "outbound_records",
    columns: [
      ["id", "id"], ["purchaseItemId", "purchase_item_id"], ["outboundDate", "outbound_date"],
      ["issuedQty", "issued_qty"], ["receiver", "receiver"], ["purpose", "purpose"],
      ["status", "status"], ["remark", "remark"]
    ]
  }
};

let pool = null;

function getPool() {
  if (!DATABASE_URL) throw new Error("DATABASE_URL is required for PostgreSQL storage");
  if (!pool) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX || 10),
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 10000)
    });
  }
  return pool;
}

function ensureCollections(db) {
  db.settings = db.settings || {};
  resourceList.forEach((resource) => {
    db[resource] = Array.isArray(db[resource]) ? db[resource] : [];
  });
  return db;
}

function coerceValue(value, column) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (numericColumns.has(column) && value !== null && value !== undefined) return Number(value);
  return value ?? "";
}

function rowToObject(row, columns) {
  return columns.reduce((result, [key, column]) => {
    result[key] = coerceValue(row[column], column);
    return result;
  }, {});
}

function objectValues(item, columns) {
  return columns.map(([key]) => item[key] === "" ? null : item[key] ?? null);
}

async function createSchema(client) {
  for (const statement of tableSchemas) await client.query(statement);
  for (const statement of indexSchemas) await client.query(statement);
}

async function hasBusinessData(client) {
  for (const resource of resourceList) {
    const { table } = mappings[resource];
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
    if (result.rows[0].count > 0) return true;
  }
  return false;
}

async function initialState() {
  const sourcePath = fsSync.existsSync(LEGACY_JSON_PATH) ? LEGACY_JSON_PATH : SEED_PATH;
  return JSON.parse(await fs.readFile(sourcePath, "utf8"));
}

async function insertResource(client, resource, rows) {
  const { table, columns } = mappings[resource];
  const columnNames = columns.map(([, column]) => column);
  const placeholders = columnNames.map((_, index) => `$${index + 1}`).join(", ");
  const sql = `INSERT INTO ${table} (${columnNames.join(", ")}) VALUES (${placeholders})`;
  for (const item of rows) await client.query(sql, objectValues(item, columns));
}

async function insertSettings(client, settings) {
  const sql = "INSERT INTO dictionary_options (id, type, value, sort_order, enabled) VALUES ($1, $2, $3, $4, true)";
  for (const [type, values] of Object.entries(settings || {})) {
    for (const [index, value] of (Array.isArray(values) ? values : []).entries()) {
      await client.query(sql, [`${type}:${index}:${value}`, type, value, index]);
    }
  }
}

async function replaceState(client, state) {
  const next = ensureCollections(state);
  await client.query("DELETE FROM outbound_records");
  await client.query("DELETE FROM receipt_records");
  await client.query("DELETE FROM purchase_items");
  await client.query("DELETE FROM purchases");
  await client.query("DELETE FROM bom_items");
  await client.query("DELETE FROM project_tasks");
  await client.query("DELETE FROM projects");
  await client.query("DELETE FROM dictionary_options");
  await insertResource(client, "projects", next.projects);
  await insertResource(client, "tasks", next.tasks);
  await insertResource(client, "materials", next.materials);
  await insertResource(client, "purchases", next.purchases);
  await insertResource(client, "purchaseItems", next.purchaseItems);
  await insertResource(client, "receipts", next.receipts);
  await insertResource(client, "outbounds", next.outbounds);
  await insertSettings(client, next.settings);
}

async function ensureDb() {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await createSchema(client);
    if (!(await hasBusinessData(client))) {
      await replaceState(client, await initialState());
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function readResource(client, resource) {
  const { table, columns } = mappings[resource];
  const result = await client.query(`SELECT ${columns.map(([, column]) => column).join(", ")} FROM ${table}`);
  return result.rows.map((row) => rowToObject(row, columns));
}

async function readSettings(client) {
  const result = await client.query("SELECT type, value FROM dictionary_options WHERE enabled = true ORDER BY type, sort_order, value");
  return result.rows.reduce((settings, row) => {
    if (!settings[row.type]) settings[row.type] = [];
    settings[row.type].push(row.value);
    return settings;
  }, {});
}

async function readDb() {
  await ensureDb();
  const client = await getPool().connect();
  try {
    return ensureCollections({
      settings: await readSettings(client),
      projects: await readResource(client, "projects"),
      tasks: await readResource(client, "tasks"),
      materials: await readResource(client, "materials"),
      purchases: await readResource(client, "purchases"),
      purchaseItems: await readResource(client, "purchaseItems"),
      receipts: await readResource(client, "receipts"),
      outbounds: await readResource(client, "outbounds")
    });
  } finally {
    client.release();
  }
}

async function backupDb() {
  if (process.env.BACKUP_ON_WRITE === "false") return;
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const current = await readDb();
  await fs.writeFile(path.join(BACKUP_DIR, `db-${stamp}.json`), `${JSON.stringify(current, null, 2)}\n`);
  await pruneBackups();
}

async function pruneBackups(maxBackups = Number(process.env.MAX_BACKUPS || 30)) {
  if (!Number.isFinite(maxBackups) || maxBackups <= 0) return;
  const files = (await fs.readdir(BACKUP_DIR)).filter((file) => file.endsWith(".json")).sort().reverse();
  await Promise.all(files.slice(maxBackups).map((file) => fs.unlink(path.join(BACKUP_DIR, file))));
}

async function writeDb(state) {
  await ensureDb();
  await backupDb();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await replaceState(client, state);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  driverName: "postgres",
  tableSchemas,
  indexSchemas,
  ensureDb,
  readDb,
  writeDb,
  backupDb,
  createSchema,
  replaceState,
  resourceList
};
