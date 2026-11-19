/**
 * MÓDULO 17A — Fase 1: reglas del servidor para guardar cambios de OTs.
 *
 * Funciones puras (sin Express ni SQLite) para poder probarlas:
 * - Guardado por campo: el cliente envía solo los campos que cambió y la versión en que se basó.
 *   Hay conflicto solo si otro usuario cambió ESE campo después de esa versión a un valor distinto.
 * - Las transiciones de estado se aplican con la misma máquina de estados del cliente,
 *   con el usuario y rol de la sesión (el historial no lo escribe el cliente).
 * - Permisos: campos que solo el servidor escribe, campos que un técnico no puede tocar,
 *   firmas y validaciones según rol, y evidencias que deben apuntar a un archivo real.
 */
import type { OT, OTEstado, RoleType } from '../src/types';
import { transitionOT, softwrenchCodeOf } from '../src/domain/otStateMachine';

export interface StoredOT {
  ot: OT;
  version: number;
  /** Versión en la que cambió por última vez cada campo de primer nivel. */
  fieldVersions: Record<string, number>;
}

export interface Actor {
  displayName: string;
  role: RoleType;
}

export interface OTPatchRequest {
  baseVersion: number;
  changes: Partial<OT>;
  transition?: { to: OTEstado; comentario?: string };
}

export type PatchResult =
  | { ok: true; stored: StoredOT; conflicts: string[] }
  | { ok: false; status: number; error: string };

/** Campos que nunca escribe el cliente directamente. */
const SERVER_OWNED = new Set(['codigo', 'estado', 'lifecycleHistory', '_version']);

/** Campos que un técnico SÍ puede modificar (lista blanca: todo lo demás se rechaza). */
const TECH_EDITABLE = new Set([
  'llegadaConfirmada', 'horaLlegadaSimulada', 'observacionLlegada',
  'astFirmado', 'firmaEjecutorSimulada', 'firmaSupervisorSimulada', 'riesgosDetectadosTerreno', 'condicionInseguraTerreno', 'permisoTrabajoNumero',
  'checklist', 'checklistExecution', 'avance', 'hhReales',
  'diagnosticoFinalTerreno', 'accionRealizadaTerreno', 'resultadoTerreno',
  'propuestaCierreTerreno', 'comentarioPropuestaCierre', 'closeSummary',
  'bloqueada', 'motivoBloqueo', 'escalada', 'motivoEscalamiento',
  'evidencePack', 'evidencias', 'evidencia', 'observaciones', 'historialCambios',
  'repuestos', 'repuestosRequeridas', 'herramientasRequeridas',
]);

/** Roles que revisan evidencias (pueden aprobar/rechazar o borrar evidencias aprobadas). */
const EVIDENCE_REVIEWERS: RoleType[] = ['SUPERVISOR_TERRENO', 'COORDINADOR_OM', 'JEFE_OM', 'SUPER_ADMIN_ORBI', 'HSE', 'CALIDAD'];

/** Listas que deben ser arreglos si vienen en el cambio. */
const ARRAY_FIELDS = ['approvals', 'historialCambios', 'evidencePack', 'checklist', 'checklistExecution', 'evidencias'];

export const READ_ONLY_ROLES: RoleType[] = ['LECTURA_CLIENTE'];
export const CREATE_ROLES: RoleType[] = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'COORDINADOR_OM', 'PLANIFICACION', 'GERENCIA', 'SUPERVISOR_TERRENO'];

/** Quién puede firmar cada tipo de aprobación. */
const APPROVAL_SIGNERS: Record<string, RoleType[]> = {
  jefeom: ['JEFE_OM', 'SUPER_ADMIN_ORBI'],
  coordinador: ['COORDINADOR_OM', 'JEFE_OM', 'SUPER_ADMIN_ORBI'],
  supervisor: ['SUPERVISOR_TERRENO', 'COORDINADOR_OM', 'JEFE_OM', 'SUPER_ADMIN_ORBI'],
  hse: ['HSE', 'JEFE_OM', 'SUPER_ADMIN_ORBI'],
  calidad: ['CALIDAD', 'JEFE_OM', 'SUPER_ADMIN_ORBI'],
};

function approvalKind(rol: string): string | null {
  const r = rol.toLowerCase().replace(/[^a-z]/g, '');
  if (r.includes('jefe')) return 'jefeom';
  if (r.includes('coordinador')) return 'coordinador';
  if (r.includes('supervisor')) return 'supervisor';
  if (r.includes('hse')) return 'hse';
  if (r.includes('calidad') || r.includes('quality')) return 'calidad';
  return null;
}

export function canSignApproval(approvalRol: string, actorRole: RoleType): boolean {
  const kind = approvalKind(approvalRol);
  if (!kind) return approvalRol === actorRole;
  return APPROVAL_SIGNERS[kind].includes(actorRole);
}

function normalizeName(s: string | undefined): string {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/** Un técnico solo ve y modifica OTs asignadas a él. */
export function isAssignedTo(ot: OT, displayName: string): boolean {
  const me = normalizeName(displayName);
  if (!me) return false;
  return [ot.responsable, ot.tecnicoAsignado].some(n => normalizeName(n) === me);
}

export function canReadOT(ot: OT, actor: Actor): boolean {
  if (actor.role === 'TECNICO_OM') return isAssignedTo(ot, actor.displayName);
  return true;
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function nowIso(now?: Date): string {
  return (now ?? new Date()).toISOString();
}

/**
 * Valida y normaliza las listas que crecen (aprobaciones, historial de cambios, evidencias):
 * no se pueden borrar entradas existentes y las nuevas quedan firmadas con el usuario de la sesión.
 */
function mergeAppendOnly(
  current: OT,
  changes: Partial<OT>,
  actor: Actor,
  fileExists: (fileId: string) => boolean,
  now: string
): { ok: true; changes: Partial<OT> } | { ok: false; error: string } {
  const out: Partial<OT> = { ...changes };

  if ('approvals' in changes) {
    if (actor.role === 'TECNICO_OM') return { ok: false, error: 'Un técnico no puede registrar aprobaciones.' };
    const prev = current.approvals || [];
    const next = changes.approvals || [];
    if (next.length < prev.length) return { ok: false, error: 'No se pueden eliminar aprobaciones registradas.' };
    const added = next.slice(prev.length);
    for (const a of added) {
      if (!canSignApproval(String(a.rol), actor.role)) {
        return { ok: false, error: `Tu rol no puede firmar la aprobación "${a.rol}".` };
      }
    }
    out.approvals = [...prev, ...added.map(a => ({ ...a, nombre: actor.displayName, fecha: now }))];
  }

  if ('historialCambios' in changes) {
    const prev = current.historialCambios || [];
    const next = changes.historialCambios || [];
    const added = next.length > prev.length ? next.slice(prev.length) : [];
    out.historialCambios = [...prev, ...added.map(h => ({ ...h, usuario: actor.displayName, fecha: now }))];
  }

  if ('evidencePack' in changes) {
    const reviewer = EVIDENCE_REVIEWERS.includes(actor.role);
    const prevById = new Map((current.evidencePack || []).map(e => [e.evidenceId, e]));
    const nextById = new Map((changes.evidencePack || []).map(e => [e.evidenceId, e]));
    for (const ev of changes.evidencePack || []) {
      const prev = prevById.get(ev.evidenceId);
      if (!prev) {
        const fileId = ev.fileId;
        if (!fileId || !fileExists(fileId)) {
          return { ok: false, error: 'Cada evidencia nueva debe tener una foto subida al servidor.' };
        }
        if (!reviewer && ev.status !== 'Cargada' && ev.status !== 'Completado' && ev.status !== 'Pendiente') {
          return { ok: false, error: 'Solo un revisor puede aprobar o rechazar evidencias.' };
        }
      } else if (!reviewer && !sameValue(prev, ev)) {
        return { ok: false, error: 'Solo un revisor puede modificar una evidencia ya cargada.' };
      }
    }
    if (!reviewer) {
      for (const [id, prev] of prevById) {
        if (!nextById.has(id) && prev.status === 'Aprobada') {
          return { ok: false, error: 'Una evidencia aprobada solo la puede retirar un revisor.' };
        }
      }
    }
  }

  for (const [field, role] of [['validacionHSE', 'hse'], ['validacionCalidad', 'calidad']] as const) {
    if (field in changes && changes[field] !== current[field] && !APPROVAL_SIGNERS[role].includes(actor.role)) {
      return { ok: false, error: `Tu rol no puede modificar ${field}.` };
    }
  }

  return { ok: true, changes: out };
}

/**
 * Aplica un cambio de un cliente sobre la OT guardada.
 * `fileExists` indica si un archivo subido existe y pertenece a esta OT.
 */
export function applyOTPatch(
  stored: StoredOT,
  req: OTPatchRequest,
  actor: Actor,
  fileExists: (fileId: string) => boolean,
  opts: { escalaciones?: { otVinculada?: string; criticidad: string; estado: string }[]; now?: Date } = {}
): PatchResult {
  if (READ_ONLY_ROLES.includes(actor.role)) {
    return { ok: false, status: 403, error: 'Tu rol es de solo lectura.' };
  }
  if (actor.role === 'TECNICO_OM' && !isAssignedTo(stored.ot, actor.displayName)) {
    return { ok: false, status: 403, error: 'Solo puedes modificar OTs asignadas a ti.' };
  }
  if (!Number.isInteger(req.baseVersion) || req.baseVersion < 1 || req.baseVersion > stored.version) {
    return { ok: false, status: 400, error: 'Versión base inválida.' };
  }
  const now = nowIso(opts.now);
  const changes: Partial<OT> = { ...(req.changes || {}) };

  for (const key of Object.keys(changes)) {
    const value = (changes as Record<string, unknown>)[key];
    if (SERVER_OWNED.has(key)) delete (changes as Record<string, unknown>)[key];
    else if (ARRAY_FIELDS.includes(key) && value != null && (!Array.isArray(value) || value.some(v => v === null || typeof v !== 'object' && key !== 'evidencias'))) {
      return { ok: false, status: 400, error: `El campo "${key}" tiene un formato inválido.` };
    } else if (actor.role === 'TECNICO_OM' && !TECH_EDITABLE.has(key)
      && !sameValue(value, (stored.ot as unknown as Record<string, unknown>)[key])) {
      return { ok: false, status: 403, error: `Un técnico no puede modificar el campo "${key}".` };
    }
  }

  // Conflictos: el campo cambió en el servidor después de la versión base y el valor enviado es distinto.
  // Las evidencias se combinan por id (dos personas pueden subir fotos a la vez sin perder ninguna).
  const conflicts: string[] = [];
  for (const key of Object.keys(changes)) {
    const changedAt = stored.fieldVersions[key] ?? 0;
    const incoming = (changes as Record<string, unknown>)[key];
    const current = (stored.ot as unknown as Record<string, unknown>)[key];
    if (changedAt > req.baseVersion && !sameValue(incoming, current)) {
      if (key === 'evidencePack' && Array.isArray(incoming)) {
        const merged = new Map((stored.ot.evidencePack || []).map(e => [e.evidenceId, e]));
        for (const ev of incoming as OT['evidencePack'] & object) merged.set(ev.evidenceId, ev);
        changes.evidencePack = [...merged.values()];
        continue;
      }
      conflicts.push(key);
      delete (changes as Record<string, unknown>)[key];
    }
  }

  const merged = mergeAppendOnly(stored.ot, changes, actor, fileExists, now);
  if (merged.ok === false) return { ok: false, status: 403, error: merged.error };
  const accepted = merged.changes;

  let next: OT;
  if (req.transition && req.transition.to !== stored.ot.estado) {
    if (!softwrenchCodeOf(req.transition.to)) {
      return { ok: false, status: 400, error: `Estado desconocido: ${req.transition.to}` };
    }
    const result = transitionOT(stored.ot, req.transition.to, {
      usuario: actor.displayName,
      rol: actor.role,
      comentario: req.transition.comentario,
      escalaciones: opts.escalaciones,
      ahora: opts.now,
    }, accepted);
    if (result.ok === false) return { ok: false, status: 422, error: result.error };
    next = result.ot;
  } else {
    next = { ...stored.ot, ...accepted };
  }

  const version = stored.version + 1;
  const changedKeys = Object.keys(next).filter(
    k => !sameValue((next as unknown as Record<string, unknown>)[k], (stored.ot as unknown as Record<string, unknown>)[k])
  );
  if (changedKeys.length === 0) {
    // Nada cambió: no se sube la versión
    return { ok: true, stored, conflicts };
  }
  const fieldVersions = { ...stored.fieldVersions };
  for (const key of changedKeys) fieldVersions[key] = version;
  return { ok: true, stored: { ot: next, version, fieldVersions }, conflicts };
}

/** Valida una OT nueva creada por un cliente y fija los campos que pertenecen al servidor. */
export function prepareNewOT(input: OT, actor: Actor, now?: Date): { ok: true; ot: OT } | { ok: false; status: number; error: string } {
  if (!CREATE_ROLES.includes(actor.role)) {
    return { ok: false, status: 403, error: 'Tu rol no puede crear OTs.' };
  }
  if (!input || typeof input.codigo !== 'string' || !/^[A-Za-z0-9._-]{3,40}$/.test(input.codigo)) {
    return { ok: false, status: 400, error: 'Código de OT inválido.' };
  }
  const code = softwrenchCodeOf(input.estado);
  if (!code || !['WAPPR', 'RTBSCH', 'DAPPR'].includes(code)) {
    return { ok: false, status: 400, error: 'Una OT nueva debe crearse como Borrador, Nueva, Asignada o Programada.' };
  }
  const fecha = nowIso(now);
  return {
    ok: true,
    ot: {
      ...input,
      approvals: [],
      evidencePack: [],
      lifecycleHistory: [{ estadoNuevo: input.estado, fecha, usuario: actor.displayName, comentario: 'OT creada' }],
      historialCambios: [{ fecha, usuario: actor.displayName, accion: 'Creación', detalle: `OT creada en estado ${input.estado}` }],
    },
  };
}
