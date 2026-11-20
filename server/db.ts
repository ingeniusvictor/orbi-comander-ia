/**
 * MÓDULO 17A — Fase 1: base de datos del servidor (SQLite integrado en Node, `node:sqlite`).
 *
 * Un solo archivo en ORBI_DATA_DIR (por defecto ./data). Las OTs se guardan como documento JSON
 * por fila (el tipo OT tiene ~100 campos opcionales); la normalización queda para la Fase 2.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export type Db = DatabaseSync;

export function dataDir(): string {
  return path.resolve(process.env.ORBI_DATA_DIR || path.join(process.cwd(), 'data'));
}

export function uploadsDir(): string {
  return path.join(dataDir(), 'uploads');
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  active        INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS ots (
  codigo      TEXT PRIMARY KEY,
  data        TEXT NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  field_versions TEXT NOT NULL DEFAULT '{}',
  updated_at  TEXT NOT NULL,
  updated_by  TEXT NOT NULL
);

-- Colecciones compartidas que antes vivían solo en el navegador (inventario, PTW, escalamientos...)
CREATE TABLE IF NOT EXISTS collections (
  name        TEXT PRIMARY KEY,
  data        TEXT NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT NOT NULL,
  updated_by  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  at          TEXT NOT NULL,
  user_id     INTEGER,
  usuario     TEXT NOT NULL,
  rol         TEXT NOT NULL,
  accion      TEXT NOT NULL,
  modulo      TEXT NOT NULL,
  ot_codigo   TEXT,
  planta      TEXT,
  comentario  TEXT,
  criticidad  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log(at);

-- Fase 2: OTs generadas por planes preventivos (idempotencia por plan y fecha)
CREATE TABLE IF NOT EXISTS pm_generated (
  plan_id     TEXT NOT NULL,
  fecha       TEXT NOT NULL,
  ot_codigo   TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (plan_id, fecha)
);

CREATE TABLE IF NOT EXISTS files (
  id           TEXT PRIMARY KEY,
  ot_codigo    TEXT NOT NULL,
  mime         TEXT NOT NULL,
  size         INTEGER NOT NULL,
  path         TEXT NOT NULL,
  uploaded_by  TEXT NOT NULL,
  uploaded_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_files_ot ON files(ot_codigo);
`;

export function openDb(file?: string): Db {
  const target = file ?? path.join(dataDir(), 'orbi.sqlite');
  if (target !== ':memory:') {
    fs.mkdirSync(path.dirname(target), { recursive: true });
  }
  const db = new DatabaseSync(target);
  db.exec('PRAGMA foreign_keys = ON;');
  if (target !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA busy_timeout = 5000;');
  }
  db.exec(SCHEMA);
  return db;
}

/** Ejecuta `fn` dentro de una transacción; revierte si lanza. */
export function inTransaction<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/** Copia de respaldo consistente del archivo SQLite (VACUUM INTO). */
export function backupDb(db: Db, destDir = path.join(dataDir(), 'backups')): string {
  fs.mkdirSync(destDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(destDir, `orbi-${stamp}.sqlite`);
  db.prepare('VACUUM INTO ?').run(dest);
  // Verificar que el respaldo se pueda abrir y esté íntegro
  const check = new DatabaseSync(dest, { readOnly: true });
  try {
    const row = check.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    if (row.integrity_check !== 'ok') throw new Error(`Respaldo dañado: ${row.integrity_check}`);
  } finally {
    check.close();
  }
  db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  return dest;
}
