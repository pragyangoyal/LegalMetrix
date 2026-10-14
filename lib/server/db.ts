import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file path
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'legalmetrix.db');

// Global singleton to prevent multiple connections in dev hot-reload
declare global {
  // eslint-disable-next-line no-var
  var __legalmetrixDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!global.__legalmetrixDb) {
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initSchema(db);
    global.__legalmetrixDb = db;
  }
  return global.__legalmetrixDb;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inspections (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'UPLOADED',
      scan_mode TEXT NOT NULL DEFAULT 'upload',
      product_name TEXT,
      compliance_score INTEGER,
      overall_status TEXT,
      raw_ocr_text TEXT,
      ai_summary TEXT,
      processing_time_ms INTEGER DEFAULT 0,
      images_count INTEGER DEFAULT 0,
      images_analyzed INTEGER DEFAULT 0,
      demo_product_id TEXT
    );

    CREATE TABLE IF NOT EXISTS inspection_images (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      image_order INTEGER NOT NULL DEFAULT 0,
      label TEXT,
      file_path TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      ocr_text TEXT,
      ocr_confidence REAL,
      processing_time_ms INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS extracted_fields (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      value TEXT NOT NULL,
      confidence REAL DEFAULT 0.0,
      source_image_id TEXT,
      status TEXT NOT NULL DEFAULT 'DETECTED',
      FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS compliance_checks (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      rule_id TEXT NOT NULL,
      rule_name TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      evidence TEXT,
      explanation TEXT,
      confidence REAL DEFAULT 0.0,
      score_earned INTEGER DEFAULT 0,
      max_score INTEGER DEFAULT 0,
      FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_inspection_images_inspection_id ON inspection_images(inspection_id);
    CREATE INDEX IF NOT EXISTS idx_extracted_fields_inspection_id ON extracted_fields(inspection_id);
    CREATE INDEX IF NOT EXISTS idx_compliance_checks_inspection_id ON compliance_checks(inspection_id);
  `);
}
