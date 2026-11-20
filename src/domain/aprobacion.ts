/**
 * MÓDULO 17B — Aprobación de correctivos y OTs cobrables.
 *
 * En SoftWrench los correctivos nuevos quedan en "Espera aprobación" (WAPPR) y muchos pasan meses
 * ahí sin que nadie lo note (en 90 días había 483 pendientes; el más antiguo, 302 días).
 * Aquí la espera se mide y se muestra, y la aprobación tiene responsable y fecha.
 * "Cobrable" la marca coordinación o jefatura cuando el cliente aprueba pagar el trabajo.
 */
import type { OT, RoleType } from '../types';
import { softwrenchCodeOf, ROLES_APROBACION } from './otStateMachine';

export { ROLES_APROBACION };

/** Quién puede marcar una OT como cobrable al cliente. */
export const ROLES_COBRO: RoleType[] = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'COORDINADOR_OM', 'GERENCIA'];
/** Días de espera desde los que una OT por aprobar se muestra en alerta. */
export const ALERTA_DIAS_APROBACION = 15;

export function esperaAprobacion(ot: OT): boolean {
  return softwrenchCodeOf(ot.estado) === 'WAPPR';
}

/** Fecha desde la que la OT espera aprobación (la última vez que entró a ese estado). */
export function inicioEspera(ot: OT): string | undefined {
  const historial = ot.lifecycleHistory ?? [];
  for (let i = historial.length - 1; i >= 0; i--) {
    const h = historial[i];
    if (softwrenchCodeOf(h.estadoNuevo) === 'WAPPR' && (!h.estadoAnterior || softwrenchCodeOf(h.estadoAnterior) !== 'WAPPR')) return h.fecha;
  }
  return historial[0]?.fecha ?? ot.fechaInicio;
}

export function diasEsperando(ot: OT, ahora = new Date()): number {
  const desde = inicioEspera(ot);
  if (!desde) return 0;
  const t = new Date(desde.length <= 10 ? `${desde}T12:00:00` : desde).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((ahora.getTime() - t) / 86_400_000));
}

/** OTs que esperan aprobación, las más antiguas primero. */
export function pendientesDeAprobacion(ots: OT[], ahora = new Date()): { ot: OT; dias: number }[] {
  return ots
    .filter(esperaAprobacion)
    .map(ot => ({ ot, dias: diasEsperando(ot, ahora) }))
    .sort((a, b) => b.dias - a.dias);
}
