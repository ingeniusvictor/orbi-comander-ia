/**
 * MÓDULO 17B — Aprovechar la visita.
 *
 * Al programar una visita a una planta se muestran los correctivos pendientes de esa planta para
 * resolverlos en el mismo viaje (en SoftWrench esto se revisa a mano con el backlog y la
 * "próxima visita" de cada parque). Solo se pueden sumar los que ya están aprobados.
 */
import type { OT } from '../types';
import { softwrenchCodeOf } from './otStateMachine';
import { diasEsperando } from './aprobacion';

const TIPOS_CORRECTIVOS = new Set(['Correctiva', 'Emergencia']);

export interface CorrectivoPendiente {
  ot: OT;
  /** Ya aprobado (por agendar o agendado en otra fecha): se puede sumar a la visita. */
  sumable: boolean;
  /** Por qué no se puede sumar, si aplica. */
  motivo?: string;
  /** Días desde que se creó o desde que espera aprobación. */
  antiguedad: number;
}

function antiguedadDe(ot: OT, ahora: Date): number {
  const creada = ot.lifecycleHistory?.[0]?.fecha ?? ot.fechaInicio;
  if (!creada) return 0;
  const t = Date.parse(creada.length <= 10 ? `${creada}T12:00:00` : creada);
  return Number.isNaN(t) ? 0 : Math.max(0, Math.floor((ahora.getTime() - t) / 86_400_000));
}

/**
 * Correctivos abiertos de la planta (sin contar la OT que se está programando), los más antiguos primero.
 * `fechaVisita` excluye los que ya están agendados para ese mismo día.
 */
export function correctivosPendientes(ots: OT[], plantaId: string, excluir: string, fechaVisita?: string, ahora = new Date()): CorrectivoPendiente[] {
  return ots
    .filter(o => o.plantaId === plantaId && o.codigo !== excluir && TIPOS_CORRECTIVOS.has(o.tipo))
    .filter(o => ['WAPPR', 'RTBSCH', 'DAPPR', 'HOLD'].includes(softwrenchCodeOf(o.estado) ?? ''))
    .filter(o => !(fechaVisita && softwrenchCodeOf(o.estado) === 'DAPPR' && o.fechaInicio === fechaVisita))
    .map(o => {
      const code = softwrenchCodeOf(o.estado);
      if (code === 'WAPPR') return { ot: o, sumable: false, motivo: 'Falta aprobarlo (pestaña Por aprobar).', antiguedad: diasEsperando(o, ahora) };
      if (code === 'HOLD') return { ot: o, sumable: false, motivo: `En espera${o.motivoEsperaCodigo ? ` (${o.motivoEsperaCodigo})` : ''}.`, antiguedad: antiguedadDe(o, ahora) };
      return { ot: o, sumable: true, antiguedad: antiguedadDe(o, ahora) };
    })
    .sort((a, b) => Number(b.sumable) - Number(a.sumable) || b.antiguedad - a.antiguedad);
}
