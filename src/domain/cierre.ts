/**
 * MÓDULO 17B — Cola de cierre.
 *
 * En SoftWrench, en 90 días quedaron 500 OTs ejecutadas sin cerrar (FDCOMP) y el cierre tarda
 * de 8 a 10 días. Aquí cada OT ejecutada muestra cuántos días lleva esperando, qué firma falta
 * (Supervisor → Coordinador → Jefe O&M) y qué la bloquea. Quien puede firmar una etapa puede
 * firmar varias OTs a la vez; cada una pasa igual por la máquina de estados y por el servidor.
 */
import type { OT, OTEstado, RoleType } from '../types';
import { softwrenchCodeOf, transitionOT, closureBlockers, type TransitionContext, type TransitionResult } from './otStateMachine';
import { fechaEjecucion } from './plazos';

export type EtapaFirma = 'Supervisor' | 'Coordinador' | 'JefeOM';

/** Días máximos recomendados entre la ejecución en terreno y el cierre. */
export const META_CIERRE_DIAS = 3;

export const ETAPAS: Record<EtapaFirma, { nombre: string; firmantes: RoleType[]; siguiente: OTEstado }> = {
  Supervisor: { nombre: 'Supervisor', firmantes: ['SUPERVISOR_TERRENO', 'COORDINADOR_OM', 'JEFE_OM', 'SUPER_ADMIN_ORBI'], siguiente: 'En revisión Coordinador' },
  Coordinador: { nombre: 'Coordinador', firmantes: ['COORDINADOR_OM', 'JEFE_OM', 'SUPER_ADMIN_ORBI'], siguiente: 'Pendiente aprobación Jefe O&M' },
  JefeOM: { nombre: 'Jefe O&M (cierre)', firmantes: ['JEFE_OM', 'SUPER_ADMIN_ORBI'], siguiente: 'Cerrada' },
};

/** Firma que le falta a una OT ejecutada, o null si no está en la cola de firmas (p. ej. revisión HSE o Calidad). */
export function etapaPendiente(ot: OT): EtapaFirma | null {
  if (ot.estado === 'En revisión Coordinador') return 'Coordinador';
  if (ot.estado === 'Pendiente aprobación Jefe O&M') return 'JefeOM';
  if (softwrenchCodeOf(ot.estado) === 'FDCOMP' || ot.estado === 'En revisión Supervisor' || ot.estado === 'En revisión') return 'Supervisor';
  return null;
}

export function puedeFirmar(etapa: EtapaFirma, rol: RoleType): boolean {
  return ETAPAS[etapa].firmantes.includes(rol);
}

function diasEntre(desde: string, hasta: string): number {
  return Math.max(0, Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000));
}

export interface FilaCierre {
  ot: OT;
  /** Día en que quedó ejecutada en terreno. */
  ejecutada?: string;
  /** Días esperando cierre desde la ejecución. */
  dias: number;
  etapa: EtapaFirma | null;
  /** Lo que impediría cerrarla hoy (checklist, fotos, HH, validaciones, falla...). */
  bloqueos: string[];
}

/** OTs ejecutadas sin cerrar, las que más esperan primero. */
export function colaDeCierre(ots: OT[], hoy: string, escalaciones: TransitionContext['escalaciones'] = []): FilaCierre[] {
  return ots
    .filter(ot => {
      const c = softwrenchCodeOf(ot.estado);
      return c === 'FDCOMP' || c === 'RSALOR';
    })
    .map(ot => {
      const ejecutada = fechaEjecucion(ot);
      return { ot, ejecutada, dias: ejecutada ? diasEntre(ejecutada, hoy) : 0, etapa: etapaPendiente(ot), bloqueos: closureBlockers(ot, { escalaciones }) };
    })
    .sort((a, b) => b.dias - a.dias);
}

/**
 * Firma la etapa pendiente de la OT y la avanza al siguiente estado (en la última etapa, la cierra).
 * Usa la misma máquina de estados que el resto de la app; el servidor vuelve a validar la firma.
 */
export function firmarEtapa(ot: OT, ctx: TransitionContext & { comentario?: string }): TransitionResult {
  const etapa = etapaPendiente(ot);
  if (!etapa) return { ok: false, error: `La OT ${ot.codigo} no espera una firma de cierre (estado ${ot.estado}).` };
  if (!puedeFirmar(etapa, ctx.rol)) return { ok: false, error: `Tu rol no puede firmar la etapa ${ETAPAS[etapa].nombre}.` };
  const ahora = (ctx.ahora ?? new Date()).toISOString();
  const comentario = ctx.comentario?.trim() || `Firma de ${ETAPAS[etapa].nombre} desde la cola de cierre.`;
  const patch: Partial<OT> = {
    approvals: [...(ot.approvals ?? []), { rol: etapa, nombre: ctx.usuario, fecha: ahora, comentario }],
    historialCambios: [...(ot.historialCambios ?? []), { fecha: ahora, usuario: ctx.usuario, accion: `Validación ${etapa}`, detalle: 'Firma digital otorgada desde la cola de cierre' }],
  };
  if (etapa === 'Supervisor') patch.comentarioSupervisor = comentario;
  if (etapa === 'Coordinador') patch.comentarioCoordinador = comentario;
  if (etapa === 'JefeOM') {
    patch.comentarioJefeOM = comentario;
    patch.fechaCierre = ahora.slice(0, 10);
  }
  return transitionOT(ot, ETAPAS[etapa].siguiente, { ...ctx, comentario: `Firma ${ETAPAS[etapa].nombre} por ${ctx.usuario}` }, patch);
}

export interface ResumenCierre {
  total: number;
  sobreMeta: number;
  promedioDias: number | null;
}

export function resumirCola(filas: FilaCierre[]): ResumenCierre {
  const conFecha = filas.filter(f => f.ejecutada);
  return {
    total: filas.length,
    sobreMeta: filas.filter(f => f.dias > META_CIERRE_DIAS).length,
    promedioDias: conFecha.length ? Math.round((conFecha.reduce((s, f) => s + f.dias, 0) / conFecha.length) * 10) / 10 : null,
  };
}
