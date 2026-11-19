/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const STORAGE_KEYS = {
  SCHEMA_VERSION: 'orbi_om_schema_version_v2',
  ORGANIGRAMA: 'orbi_om_db_organigrama',
  PLANTAS: 'orbi_om_db_plantas',
  OTS: 'orbi_om_db_ots',
  HSE_CALIDAD: 'orbi_om_db_hse_calidad',
  PLANIFICACION: 'orbi_om_db_planificacion',
  VEHICULOS: 'orbi_om_db_vehiculos',
  RECURSOS_PERSONAS: 'orbi_om_db_recursos_personas',
  ACTIVE_ROLE: 'orbi_om_active_role',
  ACTIVE_USER_NAME: 'orbi_om_active_user_name',
  DB_WORKSPACE: 'orbi_om_db_workspace',
  DB_BI_KPI: 'orbi_om_db_bi_kpi',
  DB_ACTIVITY_LOG: 'orbi_om_db_activity_log',
  DB_RESOURCE_LOAD: 'orbi_om_db_resource_load',
  DB_GERENCIA_REPORTS: 'orbi_om_db_gerencia_reports',

  // Claves del parche v0.1.1C
  DB_FLOTA: 'orbi_om_db_flota_v1',
  DB_LOGISTICA: 'orbi_om_db_logistica_v1',
  DB_REPUESTOS: 'orbi_om_db_repuestos_v1',
  DB_HERRAMIENTAS: 'orbi_om_db_herramientas_v1',
  DB_RESOURCE_CENTER: 'orbi_om_db_resource_center_v1',
  DB_AUDIT_LOG: 'orbi_om_db_audit_log_v1',
  DB_ESCALAMIENTOS: 'orbi_om_db_escalamientos_v1',
  DB_BLOCKERS: 'orbi_om_db_blockers_v1',

  // Claves del parche v0.1.2B
  DB_EVIDENCE_PACK: 'orbi_om_db_evidence_pack_v1',
  DB_FIELD_EXECUTION: 'orbi_om_db_field_execution_v1',
  DB_CHECKLIST_EXECUTION: 'orbi_om_db_checklist_execution_v1',
  DB_FIELD_BLOCKERS: 'orbi_om_db_field_blockers_v1',
  DB_FIELD_CLOSURE_REQUESTS: 'orbi_om_db_field_closure_requests_v1',

  // Claves del parche v0.1.2C
  DB_CLOSURE_WORKFLOW: 'orbi_om_db_closure_workflow_v1',
  DB_APPROVALS: 'orbi_om_db_approvals_v1',
  DB_CLOSE_REPORTS: 'orbi_om_db_close_reports_v1',
  DB_RETURN_TO_FIELD: 'orbi_om_db_return_to_field_v1',
  DB_CLOSURE_QUALITY: 'orbi_om_db_closure_quality_v1',

  // Claves del módulo PTW Center e Inventario O&M
  DB_PTW: 'orbi_om_db_ptw_v1',
  DB_INVENTORY: 'orbi_om_db_inventory_v1',
  DB_INVENTORY_MOVEMENTS: 'orbi_om_db_inventory_movements_v1'
} as const;

export const SCHEMA_VERSION_VALUE = '0.1.2C-closure-approvals-report-pack';

/** 17A Fase 1: la capa de sincronización se registra aquí para subir al servidor cada escritura local. */
let collectionWriteListener: ((key: string) => void) | null = null;
export function setCollectionWriteListener(fn: ((key: string) => void) | null): void {
  collectionWriteListener = fn;
}

/** Evento que la app escucha para mostrar fallas de almacenamiento al usuario (17A). */
export const STORAGE_ERROR_EVENT = 'orbi:storage-error';

export function notifyStorageError(message: string): void {
  console.error(`[ORBI Storage] ${message}`);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: message }));
  }
}

/**
 * Lee una colección tipada desde localStorage.
 * Si el JSON está corrupto, guarda una copia de respaldo antes de restaurar el valor base
 * y avisa al usuario (no se pierde el dato original en silencio).
 */
export function readStorageCollection<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch (error) {
    notifyStorageError(`No se pudo leer "${key}": ${String(error)}`);
    return fallback;
  }
  if (raw) {
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      const backupKey = `${key}__corrupto_${Date.now()}`;
      try {
        localStorage.setItem(backupKey, raw);
      } catch {
        /* sin espacio para respaldo: se informa abajo */
      }
      notifyStorageError(`Datos dañados en "${key}". Se guardó un respaldo en "${backupKey}" y se restauró el valor base.`);
    }
  }
  writeStorageCollection(key, fallback);
  return fallback;
}

/**
 * Guarda una colección tipada en localStorage. Si falla (p. ej. almacenamiento lleno),
 * avisa al usuario en vez de fallar en silencio.
 */
export function writeStorageCollection<T>(key: string, data: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
    collectionWriteListener?.(key);
    return true;
  } catch (error) {
    notifyStorageError(`No se pudieron guardar los cambios en "${key}" (¿almacenamiento lleno?). Los cambios recientes no quedaron guardados.`);
    return false;
  }
}

export interface OrbiDatabaseSnapshot {
  app: 'orbi-comander-ia';
  schemaVersion: string;
  exportedAt: string;
  collections: Record<string, unknown>;
}

/**
 * Exporta todas las colecciones actuales de localStorage como un snapshot JSON portátil
 * ideal para respaldar escenarios de demostración ejecutiva.
 */
export function exportDatabaseSnapshot(): OrbiDatabaseSnapshot {
  const collections: Record<string, unknown> = {};
  if (typeof window !== 'undefined') {
    Object.entries(STORAGE_KEYS).forEach(([alias, storageKey]) => {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        try {
          collections[alias] = JSON.parse(raw);
        } catch {
          collections[alias] = raw;
        }
      }
    });
  }
  return {
    app: 'orbi-comander-ia',
    schemaVersion: SCHEMA_VERSION_VALUE,
    exportedAt: new Date().toISOString(),
    collections
  };
}

/**
 * Restaura un snapshot previamente exportado con exportDatabaseSnapshot().
 */
export function importDatabaseSnapshot(snapshot: OrbiDatabaseSnapshot, reload = true): boolean {
  if (typeof window === 'undefined') return false;
  if (!snapshot || snapshot.app !== 'orbi-comander-ia' || typeof snapshot.collections !== 'object') {
    throw new Error('Formato de snapshot ORBI inválido.');
  }

  const previous: Record<string, string | null> = {};
  try {
    Object.entries(snapshot.collections).forEach(([alias, value]) => {
      const storageKey = (STORAGE_KEYS as Record<string, string>)[alias];
      if (storageKey) {
        previous[storageKey] = localStorage.getItem(storageKey);
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(storageKey, serialized);
      }
    });
  } catch (error) {
    // Revertir lo escrito para no dejar la base a medio importar
    Object.entries(previous).forEach(([k, v]) => {
      try {
        if (v === null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
      } catch { /* mejor esfuerzo */ }
    });
    notifyStorageError(`La importación del snapshot falló y se revirtió: ${String(error)}`);
    return false;
  }

  if (reload) {
    window.location.reload();
  }
  return true;
}

/**
 * Restablece todas las bases de datos locales al estado inicial de fábrica.
 */
export const resetAllDatabases = (reload = true) => {
  if (typeof window !== 'undefined') {
    Object.values(STORAGE_KEYS).forEach((storageKey) => {
      localStorage.removeItem(storageKey);
    });
    if (reload) {
      window.location.reload();
    }
  }
};
