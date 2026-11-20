/**
 * MÓDULO 17B — Plazos: fecha objetivo del contrato y OTs vencidas.
 *
 * En SoftWrench, en 90 días hubo 824 preventivos vencidos (activos con la fecha pasada) y la fecha
 * objetivo del contrato (Target Start) no se ve junto a la programada. Aquí cada OT tiene un plazo:
 *  - Preventivos generados por un plan: fecha objetivo + margen del contrato.
 *  - El resto: su fecha límite.
 * Una OT cuenta como ejecutada el primer día en que pasó a ejecutada, en revisión o cerrada.
 */
import type { OT, Planta } from '../types';
import { softwrenchCodeOf } from './otStateMachine';

export type EstadoPlazo = 'a_tiempo' | 'por_vencer' | 'vencida' | 'cumplida' | 'cumplida_con_atraso' | 'sin_plazo' | 'cancelada';

export const ETIQUETA_PLAZO: Record<EstadoPlazo, string> = {
  a_tiempo: 'A tiempo',
  por_vencer: 'Por vencer',
  vencida: 'Vencida',
  cumplida: 'Ejecutada a tiempo',
  cumplida_con_atraso: 'Ejecutada con atraso',
  sin_plazo: 'Sin plazo',
  cancelada: 'Cancelada',
};

/** Días antes del límite en que una OT se marca "por vencer". */
export const DIAS_POR_VENCER = 3;

const EJECUTADA = new Set(['FDCOMP', 'RSALOR', 'CLOSED']);
const esFecha = (s?: string) => Boolean(s && /^\d{4}-\d{2}-\d{2}/.test(s));

/** Último día en que la OT aún se cumple. */
export function limiteDe(ot: OT): string | undefined {
  const l = ot.fechaObjetivoLimite || ot.fechaLimite;
  return esFecha(l) ? l!.slice(0, 10) : undefined;
}

/** Primer día en que la OT quedó ejecutada (o undefined si aún no). */
export function fechaEjecucion(ot: OT): string | undefined {
  const h = (ot.lifecycleHistory ?? []).find(e => EJECUTADA.has(softwrenchCodeOf(e.estadoNuevo) ?? ''));
  if (h && esFecha(h.fecha)) return h.fecha.slice(0, 10);
  // OT ejecutada sin historial (datos antiguos): se usa su fecha de cierre si existe
  if (EJECUTADA.has(softwrenchCodeOf(ot.estado) ?? '') && esFecha(ot.fechaCierre)) return ot.fechaCierre!.slice(0, 10);
  return undefined;
}

function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}

export interface Plazo {
  estado: EstadoPlazo;
  limite?: string;
  /** Días de atraso (vencidas o ejecutadas con atraso). */
  atraso: number;
  /** Días que faltan para el límite (activas a tiempo o por vencer). */
  faltan: number;
}

export function plazoDe(ot: OT, hoy: string): Plazo {
  const code = softwrenchCodeOf(ot.estado);
  const limite = limiteDe(ot);
  if (code === 'CAN') return { estado: 'cancelada', limite, atraso: 0, faltan: 0 };
  if (!limite) return { estado: 'sin_plazo', atraso: 0, faltan: 0 };
  const ejecutada = EJECUTADA.has(code ?? '');
  if (ejecutada) {
    const f = fechaEjecucion(ot) ?? hoy;
    const atraso = Math.max(0, diasEntre(limite, f));
    return { estado: atraso > 0 ? 'cumplida_con_atraso' : 'cumplida', limite, atraso, faltan: 0 };
  }
  const faltan = diasEntre(hoy, limite);
  if (faltan < 0) return { estado: 'vencida', limite, atraso: -faltan, faltan: 0 };
  return { estado: faltan <= DIAS_POR_VENCER ? 'por_vencer' : 'a_tiempo', limite, atraso: 0, faltan };
}

export interface ResumenPlazos {
  total: number;
  vencidas: number;
  porVencer: number;
  aTiempo: number;
  cumplidas: number;
  cumplidasConAtraso: number;
  /** Ejecutadas a tiempo / ejecutadas (porcentaje entero) o null si no hay ejecutadas. */
  cumplimiento: number | null;
}

export function resumir(items: { plazo: Plazo }[]): ResumenPlazos {
  const c = (e: EstadoPlazo) => items.filter(i => i.plazo.estado === e).length;
  const cumplidas = c('cumplida');
  const conAtraso = c('cumplida_con_atraso');
  return {
    total: items.filter(i => i.plazo.estado !== 'cancelada' && i.plazo.estado !== 'sin_plazo').length,
    vencidas: c('vencida'),
    porVencer: c('por_vencer'),
    aTiempo: c('a_tiempo'),
    cumplidas,
    cumplidasConAtraso: conAtraso,
    cumplimiento: cumplidas + conAtraso > 0 ? Math.round((cumplidas * 100) / (cumplidas + conAtraso)) : null,
  };
}

export interface FilaPlazo {
  ot: OT;
  plazo: Plazo;
  cliente: string;
}

/** Plazo de cada OT con su cliente (desde la matriz de plantas). */
export function plazosDe(ots: OT[], plantas: Planta[], hoy: string): FilaPlazo[] {
  const clientePorPlanta = new Map(plantas.map(p => [p.id, p.cliente]));
  return ots.map(ot => ({ ot, plazo: plazoDe(ot, hoy), cliente: clientePorPlanta.get(ot.plantaId) || 'Sin cliente' }));
}

/** Agrupa por planta o por cliente, con las más atrasadas primero. */
export function agrupar(filas: FilaPlazo[], por: 'planta' | 'cliente'): { nombre: string; resumen: ResumenPlazos }[] {
  const grupos = new Map<string, FilaPlazo[]>();
  for (const f of filas) {
    const k = por === 'planta' ? f.ot.plantaNombre || 'Sin planta' : f.cliente;
    grupos.set(k, [...(grupos.get(k) ?? []), f]);
  }
  return [...grupos.entries()]
    .map(([nombre, fs]) => ({ nombre, resumen: resumir(fs) }))
    .filter(g => g.resumen.total > 0)
    .sort((a, b) => b.resumen.vencidas - a.resumen.vencidas || b.resumen.porVencer - a.resumen.porVencer || a.nombre.localeCompare(b.nombre, 'es'));
}
