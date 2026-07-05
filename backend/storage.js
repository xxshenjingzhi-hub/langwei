const sqliteStorage = require("./sqlite-storage");

function selectedDriverName() {
  return process.env.DATABASE_URL ? "postgres" : "sqlite";
}

function loadStorage() {
  if (selectedDriverName() === "postgres") {
    return require("./postgres-storage");
  }
  return sqliteStorage;
}

module.exports = {
  get driverName() {
    return selectedDriverName();
  },
  get SQLITE_PATH() {
    return sqliteStorage.SQLITE_PATH;
  },
  ensureDb(...args) {
    return loadStorage().ensureDb(...args);
  },
  readDb(...args) {
    return loadStorage().readDb(...args);
  },
  writeDb(...args) {
    return loadStorage().writeDb(...args);
  },
  backupDb(...args) {
    return loadStorage().backupDb(...args);
  },
  createSchema(...args) {
    return loadStorage().createSchema(...args);
  },
  replaceState(...args) {
    return loadStorage().replaceState(...args);
  },
  resourceList: sqliteStorage.resourceList
};
