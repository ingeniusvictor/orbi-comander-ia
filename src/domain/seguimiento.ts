/**
 * MÓDULO 17B — Correctivo de seguimiento.
 *
 * Cuando el técnico encuentra una falla durante una OT (p. ej. una pregunta del checklist marcada
 * como "Hallazgo"), crea desde ahí un correctivo que queda vinculado a la OT de origen.
 * En SoftWrench este vínculo se hace a mano y casi nunca se registra; aquí nace solo.
 *
 * La misma función arma la OT en el teléfono (también sin señal) y en el servidor, que no confía
 * en lo que envía el cliente: copia planta, activo y responsables desde la OT de origen.
 */
import type { OT, OTPrioridad } from '../types';
import { softwrenchCodeOf } from './otStateMachine';

export interface FollowUpInput {
  /** Qué se encontró y qué hay que hacer. */
  descripcion: string;
  prioridad: OTPrioridad;
  /** Pregunta del checklist donde apareció el hallazgo (si vino del checklist). */
  item?: string;
  /** Fotos de la OT de origen que muestran la falla. */
  fotos?: { fileId: string; url: string }[];
}

export const FOLLOW_UP_PRIORITIES: OTPrioridad[] = ['Baja', 'Media', 'Alta', 'Crítica'];

/** Días para resolver según prioridad (fecha límite sugerida; la ajusta quien aprueba). */
const DIAS_POR_PRIORIDAD: Record<OTPrioridad, number> = { 'Crítica': 1, 'Alta': 3, 'Media': 14, 'Baja': 30 };

/** Un correctivo de seguimiento no se crea desde OTs cerradas ni canceladas. */
export function canCreateFollowUpFrom(origin: OT): boolean {
  const code = softwrenchCodeOf(origin.estado);
  return code !== 'CLOSED' && code !== 'CAN';
}

/** Código único aunque dos teléfonos lo creen sin señal al mismo tiempo. */
export function newFollowUpCode(now = Date.now(), rand = Math.random()): string {
  return `SEG-${now.toString(36).toUpperCase()}${Math.floor(rand * 36 * 36).toString(36).toUpperCase().padStart(2, '0')}`;
}

export function validateFollowUpInput(input: Partial<FollowUpInput> | undefined): string | null {
  const descripcion = (input?.descripcion ?? '').trim();
  if (descripcion.length < 5) return 'Describe la falla en al menos 5 caracteres.';
  if (descripcion.length > 1000) return 'La descripción no puede superar 1.000 caracteres.';
  if (!input?.prioridad || !FOLLOW_UP_PRIORITIES.includes(input.prioridad)) return 'Elige una prioridad válida.';
  if (input.item != null && (typeof input.item !== 'string' || input.item.length > 300)) return 'La pregunta del checklist no es válida.';
  if (input.fotos != null && (!Array.isArray(input.fotos) || input.fotos.length > 10
    || input.fotos.some(f => !f || typeof f.fileId !== 'string' || typeof f.url !== 'string'))) return 'Las fotos del hallazgo no son válidas.';
  return null;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Arma el correctivo de seguimiento. Queda "Nueva" (Espera aprobación en SoftWrench) y sin técnico:
 * lo aprueba y asigna coordinación o jefatura.
 */
export function buildFollowUpOT(origin: OT, input: FollowUpInput, codigo: string, reportadoPor: string, hoy: string): OT {
  const prioridad = input.prioridad;
  const item = input.item?.trim();
  const descripcion = input.descripcion.trim();
  return {
    codigo,
    plantaId: origin.plantaId,
    plantaNombre: origin.plantaNombre,
    legacyPlantId: origin.legacyPlantId,
    activo: origin.activo,
    activoId: origin.activoId,
    tipo: 'Correctiva',
    prioridad,
    criticidad: prioridad,
    responsable: '',
    coordinador: origin.coordinador,
    supervisor: origin.supervisor,
    coordinadorOM: origin.coordinadorOM,
    supervisorTerreno: origin.supervisorTerreno,
    fechaInicio: hoy,
    fechaLimite: addDays(hoy, DIAS_POR_PRIORIDAD[prioridad]),
    estado: 'Nueva',
    avance: 0,
    hhEstimadas: 0,
    hhReales: 0,
    observaciones: item ? `Hallazgo en la OT ${origin.codigo}: ${item}` : `Hallazgo en la OT ${origin.codigo}`,
    diagnosticoInicial: descripcion,
    origen: 'Hallazgo en terreno',
    impacto: prioridad === 'Crítica' ? 'Alto' : prioridad === 'Alta' ? 'Medio' : 'Bajo',
    riesgoDisponibilidad: prioridad === 'Crítica' ? 'Riesgo alto' : 'En observación',
    requiereEvidencia: true,
    otOrigen: origin.codigo,
    hallazgoOrigen: { item, fotos: input.fotos ?? [] },
    reportadoPor,
  };
}

/** Correctivos que nacieron de esta OT: los que el servidor registró y los creados en este equipo. */
export function followUpsOf(origin: OT, all: OT[]): string[] {
  const codes = new Set(origin.otsSeguimiento ?? []);
  for (const o of all) if (o.otOrigen === origin.codigo) codes.add(o.codigo);
  return [...codes];
}
