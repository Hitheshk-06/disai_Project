const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const DB_PATH = path.join(dataDir, 'sbom_shield.db')
const db = new DatabaseSync(DB_PATH)

db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'analyst',
    organization TEXT DEFAULT '',
    nvd_api_key TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT DEFAULT '',
    components INTEGER DEFAULT 0,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    risk_score REAL DEFAULT 0,
    last_scan TEXT DEFAULT 'Never',
    created TEXT DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS cve_records (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    cvss_score REAL NOT NULL,
    severity TEXT NOT NULL,
    vendor TEXT NOT NULL,
    product TEXT NOT NULL,
    version TEXT NOT NULL,
    published TEXT NOT NULL,
    vector TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sbom_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name TEXT NOT NULL,
    component_name TEXT NOT NULL,
    component_version TEXT NOT NULL,
    vendor TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trend_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL,
    app_name TEXT NOT NULL,
    score REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_preview TEXT NOT NULL,
    scope TEXT DEFAULT 'Read Only',
    created_at TEXT DEFAULT (datetime('now')),
    last_used TEXT DEFAULT 'Never',
    active INTEGER DEFAULT 1
  );
`)

module.exports = db
