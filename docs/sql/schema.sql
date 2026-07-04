CREATE TABLE projects (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(128) NOT NULL,
  type VARCHAR(64) NOT NULL,
  status VARCHAR(64) NOT NULL,
  owner VARCHAR(128),
  internal_due DATE,
  external_due DATE,
  summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_tasks (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,
  priority VARCHAR(16),
  status VARCHAR(64) NOT NULL,
  owner VARCHAR(128),
  start_date DATE,
  due_date DATE,
  actual_start DATE,
  actual_end DATE,
  remark TEXT
);

CREATE TABLE bom_items (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  spec VARCHAR(255),
  material VARCHAR(255),
  part_type VARCHAR(64),
  quantity_per_set NUMERIC(12, 2),
  total_quantity NUMERIC(12, 2),
  unit VARCHAR(32),
  unit_price NUMERIC(14, 2),
  surface_treatment VARCHAR(255),
  brand_or_supplier VARCHAR(255),
  purchase_link TEXT,
  remark TEXT
);

CREATE TABLE purchases (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id),
  type VARCHAR(64),
  code VARCHAR(128),
  name VARCHAR(255) NOT NULL,
  supplier VARCHAR(255),
  total_amount NUMERIC(14, 2),
  apply_date DATE,
  contract_date DATE,
  expected_delivery DATE,
  status VARCHAR(64),
  bom_outside VARCHAR(16),
  progress_remark TEXT,
  risk_remark TEXT
);

CREATE TABLE purchase_items (
  id VARCHAR(64) PRIMARY KEY,
  purchase_id VARCHAR(64) NOT NULL REFERENCES purchases(id),
  bom_item_id VARCHAR(64) REFERENCES bom_items(id),
  item_name VARCHAR(255) NOT NULL,
  spec VARCHAR(255),
  unit VARCHAR(32),
  quantity NUMERIC(12, 2),
  unit_price NUMERIC(14, 2),
  total_price NUMERIC(14, 2),
  supplier VARCHAR(255),
  remark TEXT
);

CREATE TABLE receipt_records (
  id VARCHAR(64) PRIMARY KEY,
  purchase_item_id VARCHAR(64) NOT NULL REFERENCES purchase_items(id),
  arrival_date DATE,
  arrival_qty NUMERIC(12, 2),
  stored_qty NUMERIC(12, 2),
  status VARCHAR(64),
  qc_description TEXT,
  exception TEXT
);

CREATE TABLE outbound_records (
  id VARCHAR(64) PRIMARY KEY,
  purchase_item_id VARCHAR(64) NOT NULL REFERENCES purchase_items(id),
  outbound_date DATE,
  issued_qty NUMERIC(12, 2),
  receiver VARCHAR(255),
  purpose VARCHAR(255),
  status VARCHAR(64),
  remark TEXT
);

CREATE TABLE dictionary_options (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(64) NOT NULL,
  value VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(type, value)
);
