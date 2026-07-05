const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, "data");
const SQLITE_PATH = process.env.SQLITE_PATH ? path.resolve(process.env.SQLITE_PATH) : path.join(DATA_DIR, "db.sqlite");
const LEGACY_JSON_PATH = path.join(DATA_DIR, "db.json");
const SEED_PATH = process.env.SEED_PATH ? path.resolve(process.env.SEED_PATH) : path.join(__dirname, "data", "seed.json");
const BACKUP_DIR = process.env.BACKUP_DIR ? path.resolve(process.env.BACKUP_DIR) : path.join(DATA_DIR, "backups");

const resourceList = ["projects", "tasks", "materials", "purchases", "purchaseItems", "receipts", "outbounds"];

const tableSchemas = [
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    owner TEXT,
    internal_due TEXT,
    external_due TEXT,
    summary TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS project_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT,
    status TEXT NOT NULL,
    owner TEXT,
    start_date TEXT,
    due_date TEXT,
    actual_start TEXT,
    actual_end TEXT,
    remark TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS bom_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    spec TEXT,
    material TEXT,
    part_type TEXT,
    quantity_per_set REAL,
    total_quantity REAL,
    unit TEXT,
    unit_price REAL,
    surface_treatment TEXT,
    brand_or_supplier TEXT,
    purchase_link TEXT,
    remark TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT,
    code TEXT,
    name TEXT NOT NULL,
    supplier TEXT,
    total_amount REAL,
    apply_date TEXT,
    contract_date TEXT,
    expected_delivery TEXT,
    status TEXT,
    bom_outside TEXT,
    progress_remark TEXT,
    risk_remark TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS purchase_items (
    id TEXT PRIMARY KEY,
    purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    bom_item_id TEXT REFERENCES bom_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    spec TEXT,
    unit TEXT,
    quantity REAL,
    unit_price REAL,
    total_price REAL,
    supplier TEXT,
    remark TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS receipt_records (
    id TEXT PRIMARY KEY,
    purchase_item_id TEXT NOT NULL REFERENCES purchase_items(id) ON DELETE CASCADE,
    arrival_date TEXT,
    arrival_qty REAL,
    stored_qty REAL,
    status TEXT,
    qc_description TEXT,
    exception TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS outbound_records (
    id TEXT PRIMARY KEY,
    purchase_item_id TEXT NOT NULL REFERENCES purchase_items(id) ON DELETE CASCADE,
    outbound_date TEXT,
    issued_qty REAL,
    receiver TEXT,
    purpose TEXT,
    status TEXT,
    remark TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS dictionary_options (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    UNIQUE(type, value)
  )`
];

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

function openDatabase(options = {}) {
  const db = new DatabaseSync(SQLITE_PATH, options);
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

function createSchema(db) {
  tableSchemas.forEach((statement) => db.exec(statement));
}

function hasBusinessData(db) {
  return resourceList.some((resource) => {
    const { table } = mappings[resource];
    return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count > 0;
  });
}

async function initialState() {
  const sourcePath = fsSync.existsSync(LEGACY_JSON_PATH) ? LEGACY_JSON_PATH : SEED_PATH;
  return JSON.parse(await fs.readFile(sourcePath, "utf8"));
}

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const db = openDatabase();
  try {
    createSchema(db);
    if (!hasBusinessData(db)) {
      const state = await initialState();
      replaceState(db, ensureCollections(state));
    }
  } finally {
    db.close();
  }
}

function ensureCollections(db) {
  db.settings = db.settings || {};
  resourceList.forEach((resource) => {
    db[resource] = Array.isArray(db[resource]) ? db[resource] : [];
  });
  return db;
}

function rowToObject(row, columns) {
  return columns.reduce((result, [key, column]) => {
    result[key] = row[column] ?? "";
    return result;
  }, {});
}

function objectValues(item, columns) {
  return columns.map(([key]) => item[key] ?? "");
}

function readResource(db, resource) {
  const { table, columns } = mappings[resource];
  const rows = db.prepare(`SELECT ${columns.map(([, column]) => column).join(", ")} FROM ${table}`).all();
  return rows.map((row) => rowToObject(row, columns));
}

function readSettings(db) {
  const rows = db.prepare("SELECT type, value FROM dictionary_options WHERE enabled = 1 ORDER BY type, sort_order, value").all();
  return rows.reduce((settings, row) => {
    if (!settings[row.type]) settings[row.type] = [];
    settings[row.type].push(row.value);
    return settings;
  }, {});
}

async function readDb() {
  await ensureDb();
  const db = openDatabase({ readOnly: true });
  try {
    return ensureCollections({
      settings: readSettings(db),
      projects: readResource(db, "projects"),
      tasks: readResource(db, "tasks"),
      materials: readResource(db, "materials"),
      purchases: readResource(db, "purchases"),
      purchaseItems: readResource(db, "purchaseItems"),
      receipts: readResource(db, "receipts"),
      outbounds: readResource(db, "outbounds")
    });
  } finally {
    db.close();
  }
}

function insertResource(db, resource, rows) {
  const { table, columns } = mappings[resource];
  const columnNames = columns.map(([, column]) => column);
  const placeholders = columnNames.map(() => "?").join(", ");
  const statement = db.prepare(`INSERT INTO ${table} (${columnNames.join(", ")}) VALUES (${placeholders})`);
  rows.forEach((item) => statement.run(...objectValues(item, columns)));
}

function insertSettings(db, settings) {
  const statement = db.prepare("INSERT INTO dictionary_options (id, type, value, sort_order, enabled) VALUES (?, ?, ?, ?, 1)");
  Object.entries(settings || {}).forEach(([type, values]) => {
    (Array.isArray(values) ? values : []).forEach((value, index) => {
      statement.run(`${type}:${index}:${value}`, type, value, index);
    });
  });
}

function replaceState(db, state) {
  const next = ensureCollections(state);
  db.exec("BEGIN IMMEDIATE");
  try {
    ["outbound_records", "receipt_records", "purchase_items", "purchases", "bom_items", "project_tasks", "projects", "dictionary_options"].forEach((table) => {
      db.prepare(`DELETE FROM ${table}`).run();
    });
    insertResource(db, "projects", next.projects);
    insertResource(db, "tasks", next.tasks);
    insertResource(db, "materials", next.materials);
    insertResource(db, "purchases", next.purchases);
    insertResource(db, "purchaseItems", next.purchaseItems);
    insertResource(db, "receipts", next.receipts);
    insertResource(db, "outbounds", next.outbounds);
    insertSettings(db, next.settings);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
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
  const db = openDatabase();
  try {
    replaceState(db, state);
  } finally {
    db.close();
  }
}

module.exports = {
  SQLITE_PATH,
  ensureDb,
  readDb,
  writeDb,
  backupDb,
  createSchema,
  replaceState,
  resourceList
};
