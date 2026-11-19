/**
 * MÓDULO 17A — Fase 1: acceso a datos (OTs, colecciones, auditoría, archivos) y carga inicial.
 */
import type { Db } from './db';
import { inTransaction } from './db';
import type { OT } from '../src/types';
import type { StoredOT } from './otSync';
import { SHARED_COLLECTIONS } from './collections';
import { STORAGE_KEYS } from '../src/data/storage';
import {
  INITIAL_OTS, INITIAL_PLANTAS, INITIAL_HSE_CALIDAD, INITIAL_PLANIFICACION, INITIAL_VEHICULOS,
  INITIAL_RECURSOS_PERSONAS, INITIAL_REPUESTOS, INITIAL_HERRAMIENTAS, INITIAL_ESCALACIONES,
  INITIAL_PTWS, INITIAL_INVENTORY, INITIAL_INVENTORY_MOVEMENTS,
} from '../src/data/db';

interface OTRow { codigo: string; data: string; version: number; field_versions: string }

function rowToStored(row: OTRow): StoredOT {
  return { ot: JSON.parse(row.data) as OT, version: Number(row.version), fieldVersions: JSON.parse(row.field_versions || '{}') };
}

export function listOTs(db: Db): StoredOT[] {
  const rows = db.prepare('SELECT codigo, data, version, field_versions FROM ots ORDER BY codigo').all() as unknown as OTRow[];
  return rows.map(rowToStored);
}

export function getOT(db: Db, codigo: string): StoredOT | null {
  const row = db.prepare('SELECT codigo, data, version, field_versions FROM ots WHERE codigo = ?').get(codigo) as unknown as OTRow | undefined;
  return row ? rowToStored(row) : null;
}

export function insertOT(db: Db, ot: OT, by: string): StoredOT {
  db.prepare('INSERT INTO ots (codigo, data, version, field_versions, updated_at, updated_by) VALUES (?, ?, 1, ?, ?, ?)')
    .run(ot.codigo, JSON.stringify(ot), '{}', new Date().toISOString(), by);
  return { ot, version: 1, fieldVersions: {} };
}

/** Guarda solo si la versión en la base sigue siendo `expectedVersion` (evita pisar escrituras concurrentes). */
export function saveOT(db: Db, stored: StoredOT, expectedVersion: number, by: string): boolean {
  const r = db.prepare('UPDATE ots SET data = ?, version = ?, field_versions = ?, updated_at = ?, updated_by = ? WHERE codigo = ? AND version = ?')
    .run(JSON.stringify(stored.ot), stored.version, JSON.stringify(stored.fieldVersions), new Date().toISOString(), by, stored.ot.codigo, expectedVersion);
  return Number(r.changes) === 1;
}

export interface CollectionRecord { data: unknown; version: number }

export function getCollections(db: Db): Record<string, CollectionRecord> {
  const rows = db.prepare('SELECT name, data, version FROM collections').all() as unknown as { name: string; data: string; version: number }[];
  const out: Record<string, CollectionRecord> = {};
  for (const r of rows) out[r.name] = { data: JSON.parse(r.data), version: Number(r.version) };
  return out;
}

export function getCollection(db: Db, name: string): CollectionRecord | null {
  const r = db.prepare('SELECT data, version FROM collections WHERE name = ?').get(name) as unknown as { data: string; version: number } | undefined;
  return r ? { data: JSON.parse(r.data), version: Number(r.version) } : null;
}

/** Reemplaza una colección si la versión coincide. Devuelve la nueva versión o null si hubo conflicto. */
export function saveCollection(db: Db, name: string, data: unknown, baseVersion: number, by: string): number | null {
  const now = new Date().toISOString();
  const json = JSON.stringify(data);
  if (baseVersion === 0) {
    const r = db.prepare('INSERT OR IGNORE INTO collections (name, data, version, updated_at, updated_by) VALUES (?, ?, 1, ?, ?)').run(name, json, now, by);
    return Number(r.changes) === 1 ? 1 : null;
  }
  const r = db.prepare('UPDATE collections SET data = ?, version = version + 1, updated_at = ?, updated_by = ? WHERE name = ? AND version = ?')
    .run(json, now, by, name, baseVersion);
  return Number(r.changes) === 1 ? baseVersion + 1 : null;
}

export interface AuditInput {
  userId: number; usuario: string; rol: string; accion: string; modulo: string;
  otCodigo?: string; planta?: string; comentario?: string; criticidad: string;
}

export function addAudit(db: Db, e: AuditInput): void {
  db.prepare(`INSERT INTO audit_log (at, user_id, usuario, rol, accion, modulo, ot_codigo, planta, comentario, criticidad)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(new Date().toISOString(), e.userId, e.usuario, e.rol, e.accion, e.modulo, e.otCodigo ?? null, e.planta ?? null, e.comentario ?? '', e.criticidad);
}

export function listAudit(db: Db, limit = 500) {
  const rows = db.prepare('SELECT id, at, usuario, rol, accion, modulo, ot_codigo, planta, comentario, criticidad FROM audit_log ORDER BY id DESC LIMIT ?')
    .all(limit) as unknown as { id: number; at: string; usuario: string; rol: string; accion: string; modulo: string; ot_codigo: string | null; planta: string | null; comentario: string; criticidad: string }[];
  // Mismo formato que AuditLogEvent del frontend
  return rows.map(r => ({
    id: `EV-${r.id}`,
    fechaHora: r.at.replace('T', ' ').substring(0, 16),
    usuarioRol: `${r.usuario} (${r.rol})`,
    accion: r.accion,
    moduloOrigen: r.modulo,
    otVinculada: r.ot_codigo ?? undefined,
    plantaVinculada: r.planta ?? undefined,
    comentario: r.comentario,
    criticidad: r.criticidad,
  }));
}

export interface FileRow { id: string; ot_codigo: string; mime: string; size: number; path: string; uploaded_by: string; uploaded_at: string }

export function addFile(db: Db, f: FileRow): void {
  db.prepare('INSERT INTO files (id, ot_codigo, mime, size, path, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(f.id, f.ot_codigo, f.mime, f.size, f.path, f.uploaded_by, f.uploaded_at);
}

export function getFile(db: Db, id: string): FileRow | null {
  return (db.prepare('SELECT * FROM files WHERE id = ?').get(id) as unknown as FileRow | undefined) ?? null;
}

/**
 * Carga inicial. El catastro de plantas (dato maestro real) se carga siempre.
 * Los datos de demostración (OTs, inventario, PTW, escalamientos...) solo con ORBI_SEED_DEMO=true;
 * sin esa opción las colecciones operativas parten vacías, listas para datos reales.
 */
export function seedIfEmpty(db: Db, demo: boolean): { ots: number; collections: string[] } {
  const created: string[] = [];
  let otCount = 0;
  inTransaction(db, () => {
    const demoData: Record<string, unknown> = {
      [STORAGE_KEYS.HSE_CALIDAD]: INITIAL_HSE_CALIDAD,
      [STORAGE_KEYS.PLANIFICACION]: INITIAL_PLANIFICACION,
      [STORAGE_KEYS.VEHICULOS]: INITIAL_VEHICULOS,
      [STORAGE_KEYS.RECURSOS_PERSONAS]: INITIAL_RECURSOS_PERSONAS,
      [STORAGE_KEYS.DB_REPUESTOS]: INITIAL_REPUESTOS,
      [STORAGE_KEYS.DB_HERRAMIENTAS]: INITIAL_HERRAMIENTAS,
      [STORAGE_KEYS.DB_ESCALAMIENTOS]: INITIAL_ESCALACIONES,
      [STORAGE_KEYS.DB_PTW]: INITIAL_PTWS,
      [STORAGE_KEYS.DB_INVENTORY]: INITIAL_INVENTORY,
      [STORAGE_KEYS.DB_INVENTORY_MOVEMENTS]: INITIAL_INVENTORY_MOVEMENTS,
    };
    for (const name of Object.keys(SHARED_COLLECTIONS)) {
      if (getCollection(db, name)) continue;
      const data = name === STORAGE_KEYS.PLANTAS ? INITIAL_PLANTAS : demo ? (demoData[name] ?? []) : [];
      saveCollection(db, name, data, 0, 'sistema');
      created.push(name);
    }
    const hasOts = (db.prepare('SELECT COUNT(*) AS n FROM ots').get() as { n: number }).n > 0;
    if (demo && !hasOts) {
      for (const ot of INITIAL_OTS) {
        insertOT(db, ot, 'sistema');
        otCount++;
      }
    }
  });
  return { ots: otCount, collections: created };
}
