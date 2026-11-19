/**
 * MÓDULO 17A — Máquina de estados única de OTs.
 *
 * Toda transición de estado de una OT debe pasar por `transitionOT`.
 * Valida que la transición esté permitida, aplica las reglas de cierre,
 * y registra la entrada en `lifecycleHistory` y `historialCambios`.
 *
 * Los estados ORBI se mapean a los códigos de estado de SoftWrench/Maximo
 * para mantener el mismo lenguaje operativo que usan hoy los equipos.
 */
import type { OT, OTEstado, RoleType } from '../types';

/** Códigos de estado de SoftWrench / Maximo. */
export type SoftwrenchCode =
  | 'WAPPR'   // Espera aprobación
  | 'RTBSCH'  // Por agendar
  | 'DAPPR'   // Agendada
  | 'INPROG'  // En proceso
  | 'HOLD'    // En espera
  | 'FDCOMP'  // Ejecutada en terreno, documentación pendiente
  | 'RSALOR'  // En revisión del coordinador / aprobaciones
  | 'CLOSED'  // Cerrada
  | 'CAN';    // Cancelada

export const SOFTWRENCH_LABELS: Record<SoftwrenchCode, string> = {
  WAPPR: 'Espera aprobación',
  RTBSCH: 'Por agendar',
  DAPPR: 'Agendada',
  INPROG: 'En proceso',
  HOLD: 'En espera',
  FDCOMP: 'Ejecutada (documentación pendiente)',
  RSALOR: 'En revisión',
  CLOSED: 'Cerrada',
  CAN: 'Cancelada',
};

export const ESTADO_TO_SOFTWRENCH: Record<OTEstado, SoftwrenchCode> = {
  'Borrador': 'WAPPR',
  'Nueva': 'WAPPR',
  'En revisión': 'RSALOR', // en la app significa "en revisión tras la ejecución"
  'Asignada': 'RTBSCH',
  'Programada': 'DAPPR',
  'En preparación': 'INPROG',
  'En ruta': 'INPROG',
  'En terreno': 'INPROG',
  'En ejecución': 'INPROG',
  'Devuelta a ejecución': 'INPROG',
  'Reabierta': 'INPROG',
  'En espera de repuesto': 'HOLD',
  'En espera de cliente': 'HOLD',
  'Bloqueada': 'HOLD',
  'Lista para revisión': 'FDCOMP',
  'Finalizada': 'FDCOMP',
  'En revisión Supervisor': 'RSALOR',
  'En revisión Coordinador': 'RSALOR',
  'En revisión HSE': 'RSALOR',
  'En revisión Calidad': 'RSALOR',
  'Pendiente aprobación Jefe O&M': 'RSALOR',
  'Cerrada': 'CLOSED',
  'Cancelada': 'CAN',
};

export const ALL_ESTADOS = Object.keys(ESTADO_TO_SOFTWRENCH) as OTEstado[];

/** Transiciones permitidas entre grupos SoftWrench (dentro del mismo grupo siempre se permite). */
const ALLOWED_GROUP_TRANSITIONS: Record<SoftwrenchCode, SoftwrenchCode[]> = {
  WAPPR: ['RTBSCH', 'DAPPR', 'CAN'],
  RTBSCH: ['WAPPR', 'DAPPR', 'INPROG', 'HOLD', 'CAN'],
  DAPPR: ['WAPPR', 'RTBSCH', 'INPROG', 'HOLD', 'CAN'],
  INPROG: ['RTBSCH', 'DAPPR', 'HOLD', 'FDCOMP', 'RSALOR', 'CAN'],
  HOLD: ['RTBSCH', 'DAPPR', 'INPROG', 'CAN'],
  FDCOMP: ['INPROG', 'RSALOR', 'CLOSED'],
  RSALOR: ['INPROG', 'CLOSED'],
  CLOSED: ['INPROG'], // solo vía 'Reabierta'
  CAN: [],
};

const ROLES_CIERRE: RoleType[] = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'COORDINADOR_OM', 'SUPERVISOR_TERRENO'];
const ROLES_REAPERTURA: RoleType[] = ['SUPER_ADMIN_ORBI', 'JEFE_OM'];
const ROLES_CANCELACION: RoleType[] = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'COORDINADOR_OM'];
const JEFE_OM_APPROVAL_ROLES = ['JefeOM', 'JEFE_OM', 'Jefe O&M', 'Jefe de O&M'];

export interface TransitionContext {
  usuario: string;
  rol: RoleType;
  comentario?: string;
  /** Escalamientos abiertos ligados a la OT (bloquean el cierre si son Alta/Crítica). */
  escalaciones?: { otVinculada?: string; criticidad: string; estado: string }[];
  /** Fecha de la transición; por defecto ahora. Útil para pruebas. */
  ahora?: Date;
}

export type TransitionResult =
  | { ok: true; ot: OT }
  | { ok: false; error: string };

export function softwrenchCodeOf(estado: OTEstado | string): SoftwrenchCode | undefined {
  return ESTADO_TO_SOFTWRENCH[estado as OTEstado];
}

export function isTransitionAllowed(from: OTEstado, to: OTEstado): boolean {
  if (from === to) return false;
  const fromCode = softwrenchCodeOf(from);
  const toCode = softwrenchCodeOf(to);
  if (!fromCode || !toCode) return false;
  if (fromCode === 'CLOSED') return to === 'Reabierta';
  // 'Reabierta' solo desde una OT cerrada; 'Devuelta a ejecución' solo desde ejecutada o en revisión
  if (to === 'Reabierta') return false;
  if (to === 'Devuelta a ejecución') return fromCode === 'FDCOMP' || fromCode === 'RSALOR';
  if (fromCode === toCode) return true;
  return ALLOWED_GROUP_TRANSITIONS[fromCode].includes(toCode);
}

/** Estados destino válidos desde el estado actual (para poblar selectores). */
export function nextEstados(from: OTEstado): OTEstado[] {
  return ALL_ESTADOS.filter(to => isTransitionAllowed(from, to));
}

function hasEvidence(ot: OT): boolean {
  return Boolean(
    ot.evidencia ||
    (ot.evidencias && ot.evidencias.length > 0) ||
    (ot.evidencePack && ot.evidencePack.length > 0)
  );
}

/** Reglas para declarar la OT ejecutada en terreno (FDCOMP). */
export function executionBlockers(ot: OT): string[] {
  const errors: string[] = [];
  if (ot.requiereChecklist !== false && ot.checklistExecution && ot.checklistExecution.some(c => !c.completado && !c.noAplica)) {
    errors.push('El checklist de ejecución está incompleto.');
  }
  if (ot.requiereEvidencia && !hasEvidence(ot)) {
    errors.push('Falta subir evidencia fotográfica o documental.');
  }
  if (!ot.hhReales || ot.hhReales <= 0) {
    errors.push('Las horas hombre registradas deben ser mayores a 0.');
  }
  if (ot.requiereAST && !ot.astFirmado) {
    errors.push('Falta la firma de la AST.');
  }
  if (ot.bloqueada) {
    errors.push('La OT tiene un bloqueo operativo activo.');
  }
  return errors;
}

/** Reglas adicionales para cerrar la OT (CLOSED). */
export function closureBlockers(ot: OT, ctx: Pick<TransitionContext, 'escalaciones'> = {}): string[] {
  const errors = executionBlockers(ot);
  if (ot.requiereValidacionHSE && ot.validacionHSE !== 'Aprobado') {
    errors.push('Validación HSE pendiente o rechazada.');
  }
  if (ot.requiereValidacionCalidad && ot.validacionCalidad !== 'Aprobado') {
    errors.push('Validación de Calidad pendiente o rechazada.');
  }
  const escalamientoCritico = ctx.escalaciones?.some(
    esc => esc.otVinculada === ot.codigo &&
      (esc.criticidad === 'Crítica' || esc.criticidad === 'Alta') &&
      esc.estado !== 'Resuelto' && esc.estado !== 'Cerrado'
  );
  if (escalamientoCritico) {
    errors.push('Existe un escalamiento Alta/Crítica abierto para esta OT.');
  }
  const esCritica = ot.criticidad === 'Crítica' || ot.prioridad === 'Crítica';
  if (esCritica && !ot.approvals?.some(a => JEFE_OM_APPROVAL_ROLES.includes(a.rol))) {
    errors.push('Una OT crítica requiere la aprobación del Jefe de O&M.');
  }
  return errors;
}

/**
 * Única puerta de entrada para cambiar el estado de una OT.
 * `patch` permite aplicar en la misma operación los campos que acompañan la transición
 * (diagnóstico, HH, motivo de devolución…); las reglas se evalúan sobre la OT ya parchada.
 */
export function transitionOT(
  ot: OT,
  to: OTEstado,
  ctx: TransitionContext,
  patch: Partial<OT> = {}
): TransitionResult {
  const from = ot.estado;
  if (!softwrenchCodeOf(to)) {
    return { ok: false, error: `Estado desconocido: "${to}".` };
  }
  if (!isTransitionAllowed(from, to)) {
    return { ok: false, error: `Transición no permitida: "${from}" → "${to}".` };
  }

  const candidate: OT = { ...ot, ...patch };
  const toCode = softwrenchCodeOf(to)!;

  if (to === 'Reabierta' && !ROLES_REAPERTURA.includes(ctx.rol)) {
    return { ok: false, error: 'Solo el Jefe de O&M o el Administrador pueden reabrir una OT cerrada.' };
  }
  if (toCode === 'CAN' && !ROLES_CANCELACION.includes(ctx.rol)) {
    return { ok: false, error: 'Tu rol no puede cancelar OTs.' };
  }
  const fromCode = softwrenchCodeOf(from)!;
  const entraARevision = toCode === 'FDCOMP' || (toCode === 'RSALOR' && fromCode !== 'FDCOMP' && fromCode !== 'RSALOR');
  if (entraARevision) {
    const errors = executionBlockers(candidate);
    if (errors.length) return { ok: false, error: `No se puede marcar como ejecutada: ${errors.join(' ')}` };
  }
  if (toCode === 'CLOSED') {
    if (!ROLES_CIERRE.includes(ctx.rol)) {
      return { ok: false, error: 'Tu rol no puede cerrar OTs.' };
    }
    const errors = closureBlockers(candidate, ctx);
    if (errors.length) return { ok: false, error: `No se puede cerrar: ${errors.join(' ')}` };
  }

  const now = (ctx.ahora ?? new Date()).toISOString();
  const comentario = ctx.comentario || `Cambio de estado a ${to}`;

  const updated: OT = {
    ...candidate,
    estado: to,
    avance: toCode === 'FDCOMP' || toCode === 'RSALOR' || toCode === 'CLOSED' ? 100 : candidate.avance,
    lifecycleHistory: [
      ...(ot.lifecycleHistory || []),
      { estadoAnterior: from, estadoNuevo: to, fecha: now, usuario: ctx.usuario, comentario },
    ],
    historialCambios: [
      ...(candidate.historialCambios || []),
      { fecha: now, usuario: ctx.usuario, accion: 'Transición Estado', detalle: `${from} → ${to}. ${comentario}` },
    ],
  };
  return { ok: true, ot: updated };
}
