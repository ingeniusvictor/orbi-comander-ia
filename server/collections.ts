/**
 * MÓDULO 17A — Fase 1: colecciones compartidas.
 *
 * Datos que antes vivían solo en el navegador de cada persona (inventario, movimientos, PTW,
 * escalamientos, hallazgos HSE, planificación...). El servidor guarda una copia por colección
 * con número de versión; el cliente la refleja en localStorage para que los módulos existentes
 * sigan funcionando sin cambios.
 *
 * Política por colección: quién puede escribirla y para qué roles solo se permite AGREGAR
 * (no modificar ni borrar lo existente; por ejemplo, un técnico crea escalamientos pero no los cierra).
 */
import type { RoleType } from '../src/types';
import { STORAGE_KEYS } from '../src/data/storage';

const MGMT: RoleType[] = ['SUPER_ADMIN_ORBI', 'GERENCIA', 'JEFE_OM', 'COORDINADOR_OM'];
const SUPERVISION: RoleType[] = [...MGMT, 'SUPERVISOR_TERRENO', 'PLANIFICACION', 'INGENIERO_OM'];
const OPERATIVOS: RoleType[] = [...SUPERVISION, 'TECNICO_OM', 'HSE', 'CALIDAD', 'COMISIONAMIENTO'];
const TECH: RoleType[] = ['TECNICO_OM'];
const PLANNERS: RoleType[] = [...MGMT, 'PLANIFICACION'];

/** Fase 2: maestros CMMS. */
export const CMMS_KEYS = {
  ASSETS: 'orbi_cmms_assets_v1',
  TEMPLATES: 'orbi_cmms_checklist_templates_v1',
  PLANS: 'orbi_cmms_pm_plans_v1',
  CODES: 'orbi_cmms_codes_v1',
} as const;

interface CollectionPolicy {
  write: RoleType[];
  /** Para estos roles solo se aceptan elementos nuevos; lo existente debe quedar intacto. */
  appendOnlyFor?: RoleType[];
}

export const SHARED_COLLECTIONS: Record<string, CollectionPolicy> = {
  [STORAGE_KEYS.PLANTAS]: { write: MGMT },
  [STORAGE_KEYS.HSE_CALIDAD]: { write: [...SUPERVISION, 'HSE', 'CALIDAD'] },
  [STORAGE_KEYS.PLANIFICACION]: { write: SUPERVISION },
  [STORAGE_KEYS.VEHICULOS]: { write: SUPERVISION },
  [STORAGE_KEYS.RECURSOS_PERSONAS]: { write: SUPERVISION },
  [STORAGE_KEYS.DB_REPUESTOS]: { write: SUPERVISION },
  [STORAGE_KEYS.DB_HERRAMIENTAS]: { write: SUPERVISION },
  [STORAGE_KEYS.DB_ESCALAMIENTOS]: { write: OPERATIVOS, appendOnlyFor: TECH },
  [STORAGE_KEYS.DB_PTW]: { write: OPERATIVOS },
  [STORAGE_KEYS.DB_INVENTORY]: { write: OPERATIVOS },
  [STORAGE_KEYS.DB_INVENTORY_MOVEMENTS]: { write: OPERATIVOS, appendOnlyFor: TECH },
  // Las bitácoras locales de Vista Terreno (evidencias, ejecución, checklist, bloqueos, solicitudes de cierre)
  // no se comparten: duplican datos que ya viajan en la OT y crecerían sin límite.
  [CMMS_KEYS.ASSETS]: { write: PLANNERS },
  [CMMS_KEYS.TEMPLATES]: { write: PLANNERS },
  [CMMS_KEYS.PLANS]: { write: PLANNERS },
  [CMMS_KEYS.CODES]: { write: MGMT },
};

export const MAX_COLLECTION_BYTES = 2 * 1024 * 1024;

export function isSharedCollection(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(SHARED_COLLECTIONS, name);
}

export function canWriteCollection(name: string, role: RoleType): boolean {
  return isSharedCollection(name) && SHARED_COLLECTIONS[name].write.includes(role);
}

/** El cliente de solo lectura ve únicamente el catastro de plantas. */
export function canReadCollection(name: string, role: RoleType): boolean {
  if (role === 'LECTURA_CLIENTE') return name === STORAGE_KEYS.PLANTAS;
  return isSharedCollection(name);
}

/** Verifica la regla "solo agregar": cada elemento existente debe seguir presente y sin cambios. */
export function violatesAppendOnly(name: string, role: RoleType, previous: unknown, next: unknown[]): boolean {
  if (!SHARED_COLLECTIONS[name]?.appendOnlyFor?.includes(role)) return false;
  if (!Array.isArray(previous)) return false;
  const remaining = new Map<string, number>();
  for (const item of next) {
    const k = JSON.stringify(item);
    remaining.set(k, (remaining.get(k) ?? 0) + 1);
  }
  for (const item of previous) {
    const k = JSON.stringify(item);
    const n = remaining.get(k) ?? 0;
    if (n === 0) return true;
    remaining.set(k, n - 1);
  }
  return false;
}
