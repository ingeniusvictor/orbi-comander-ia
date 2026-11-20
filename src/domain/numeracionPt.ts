/**
 * MÓDULO 17E — Numeración oficial de permisos de trabajo (PT/AST).
 *
 * El número de un PT se obtiene del portal O&M (`/softwrench-pt-ast/correlativos/{acronimo}/{año}/siguiente`),
 * el mismo contador que usa la operación con SoftWrench, y se registra en su bitácora (`/log-pt`).
 * Si el portal no está conectado, el servidor de ORBI lleva un contador propio por planta y año
 * (numeración "local", que no se repite pero no es la oficial). Antes ORBI inventaba el número al azar.
 */
import type { OT } from '../types';

export type FuenteNumeroPt = 'portal' | 'local';
export type TipoWo = 'PM' | 'CM' | 'OTHER' | 'EC';

/** Formato del código; {correlativo} va con 3 dígitos. Se puede cambiar con ORBI_PT_FORMATO. */
export const FORMATO_PT_POR_DEFECTO = 'PT-{acronimo}-{anio}-{correlativo}';

export function formatearCodigoPt(formato: string, d: { acronimo: string; anio: number; correlativo: number }): string {
  return formato
    .replace('{acronimo}', d.acronimo)
    .replace('{anio}', String(d.anio))
    .replace('{correlativo}', String(d.correlativo).padStart(3, '0'));
}

/** "ORBI-PV-058=CANT, ORBI-PV-012=PARR" → plantaId → acrónimo (ignora entradas mal escritas). */
export function leerMapaAcronimos(texto: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const par of texto.split(',')) {
    const [plantaId, acronimo] = par.split('=').map(x => x?.trim());
    if (plantaId && acronimo && /^[A-Za-z0-9]{2,12}$/.test(acronimo)) mapa.set(plantaId, acronimo.toUpperCase());
  }
  return mapa;
}

/** Acrónimo local (solo sin portal): primeras 4 letras del nombre, sin tildes ni espacios. */
export function acronimoLocal(plantaNombre: string): string {
  const base = plantaNombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return (base.slice(0, 4) || 'PLAN');
}

/** Tipo de OT para la bitácora del portal: CM si alguna es correctiva/emergencia; PM si todas son preventivas. */
export function tipoWoDeOts(ots: Pick<OT, 'tipo'>[]): TipoWo {
  if (ots.some(o => o.tipo === 'Correctiva' || o.tipo === 'Emergencia')) return 'CM';
  if (ots.length && ots.every(o => o.tipo === 'Preventiva')) return 'PM';
  if (ots.some(o => o.tipo === 'HSE')) return 'EC';
  return 'OTHER';
}

/** Mayor correlativo ya usado en códigos con el mismo prefijo (para no repetir números locales). */
export function mayorCorrelativoUsado(codigos: string[], formato: string, acronimo: string, anio: number): number {
  const patron = formato
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace('\\{acronimo\\}', acronimo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .replace('\\{anio\\}', String(anio))
    .replace('\\{correlativo\\}', '(\\d{1,3})');
  const re = new RegExp(`^${patron}$`);
  let max = 0;
  for (const c of codigos) {
    const m = re.exec(c);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

export interface SolicitudNumeroPt {
  plantaId: string;
  otCodigos: string[];
  tecnicos?: string[];
  fechaInicio?: string;
  fechaFin?: string;
}

export function validarSolicitudPt(s: Partial<SolicitudNumeroPt> | undefined): string | null {
  if (!s || typeof s.plantaId !== 'string' || !s.plantaId) return 'Falta la planta del permiso.';
  if (!Array.isArray(s.otCodigos) || !s.otCodigos.length || s.otCodigos.length > 50 || s.otCodigos.some(c => typeof c !== 'string')) {
    return 'El permiso necesita al menos una OT vinculada.';
  }
  if (s.tecnicos != null && (!Array.isArray(s.tecnicos) || s.tecnicos.some(t => typeof t !== 'string' || t.length > 100))) return 'Lista de técnicos inválida.';
  return null;
}
