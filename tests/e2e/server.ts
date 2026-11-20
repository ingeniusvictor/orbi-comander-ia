/**
 * MÓDULO 17A — Fase 4: servidor para la prueba de pantallas (Playwright).
 * Base de datos temporal con datos demo y dos usuarios de prueba; luego arranca la versión de producción.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

process.env.NODE_ENV = 'production';
process.env.PORT = process.env.E2E_PORT || '3101';
process.env.ORBI_SEED_DEMO = 'true';
process.env.ORBI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'orbi-ui-e2e-'));

const { openDb } = await import('../../server/db');
const { createUser } = await import('../../server/auth');
const { E2E_USERS } = await import('./users');

const db = openDb();
for (const u of Object.values(E2E_USERS)) createUser(db, u);
db.exec('UPDATE users SET must_change_password = 0');
db.close();

// Al terminar la prueba se borra la base temporal
const tmp = process.env.ORBI_DATA_DIR!;
for (const signal of ['exit', 'SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* archivos en uso: el sistema los limpia luego */ }
    if (signal !== 'exit') process.exit(0);
  });
}

createRequire(import.meta.url)('../../dist/server.cjs');
