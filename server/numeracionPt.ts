/**
 * MÓDULO 17E — Emisión del número de un permiso de trabajo (PT).
 *
 * Con el portal O&M configurado (ver server/portalOm.ts) y el acrónimo de la planta en ORBI_PT_ACRONIMOS
 * ("<plantaId>=<acrónimo>,..."), el número es el oficial: se reserva en el portal y se registra en su
 * bitácora; si el registro falla, el número se libera. Sin portal, el servidor lleva un contador por
 * planta y año (tabla pt_correlativos) que nunca repite números.
 * Formato del código: ORBI_PT_FORMATO (por defecto PT-{acronimo}-{anio}-{correlativo}).
 */
import type { Db } from './db';
import { inTransaction } from './db';
import * as repo from './repo';
import { STORAGE_KEYS } from '../src/data/storage';
import type { OT, Planta, PTW } from '../src/types';
import {
  FORMATO_PT_POR_DEFECTO, formatearCodigoPt, leerMapaAcronimos, acronimoLocal, tipoWoDeOts, mayorCorrelativoUsado,
  type SolicitudNumeroPt, type FuenteNumeroPt,
} from '../src/domain/numeracionPt';
import { leerConfigPortal, reservarCorrelativo, liberarCorrelativo, registrarPt, type ConfigPortal } from './portalOm';

export const SCHEMA_PT = `
CREATE TABLE IF NOT EXISTS pt_correlativos (
  acronimo TEXT NOT NULL,
  anio     INTEGER NOT NULL,
  ultimo   INTEGER NOT NULL,
  PRIMARY KEY (acronimo, anio)
);`;

export interface NumeroPt {
  codigo: string;
  correlativo: number;
  acronimo: string;
  anio: number;
  fuente: FuenteNumeroPt;
}

export interface DependenciasPt {
  portal: ConfigPortal | null;
  acronimos: Map<string, string>;
  formato: string;
  ahora?: Date;
}

export function dependenciasDesdeEntorno(env: NodeJS.ProcessEnv = process.env): DependenciasPt {
  let portal: ConfigPortal | null = null;
  try {
    portal = leerConfigPortal(env);
  } catch {
    portal = null;
  }
  return { portal, acronimos: leerMapaAcronimos(env.ORBI_PT_ACRONIMOS ?? ''), formato: env.ORBI_PT_FORMATO || FORMATO_PT_POR_DEFECTO };
}

const fechaPortal = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? `${s.slice(0, 10)}T${(s.slice(11, 16) || '00:00')}:00` : undefined);

export class ErrorNumeroPt extends Error {
  constructor(message: string, public status = 422) {
    super(message);
  }
}

/** Reserva (y en el portal, registra) el número de un PT nuevo. */
export async function emitirNumeroPt(db: Db, s: SolicitudNumeroPt, usuario: string, deps: DependenciasPt): Promise<NumeroPt> {
  db.exec(SCHEMA_PT);
  const anio = Number(((deps.ahora ?? new Date()).toLocaleString('en-CA', { timeZone: process.env.ORBI_TZ || 'America/Santiago', year: 'numeric' })));
  const ots = s.otCodigos.map(c => repo.getOT(db, c)?.ot).filter((o): o is OT => Boolean(o));
  if (ots.length !== s.otCodigos.length) throw new ErrorNumeroPt('Alguna OT vinculada no existe.', 404);
  if (ots.some(o => o.plantaId !== s.plantaId)) throw new ErrorNumeroPt('Todas las OTs del permiso deben ser de la misma planta.');
  const plantas = (repo.getCollection(db, STORAGE_KEYS.PLANTAS)?.data as Planta[] | undefined) ?? [];
  const planta = plantas.find(p => p.id === s.plantaId);
  const plantaNombre = planta?.name ?? ots[0].plantaNombre;

  if (deps.portal) {
    const acronimo = deps.acronimos.get(s.plantaId);
    if (!acronimo) {
      throw new ErrorNumeroPt(`La planta ${plantaNombre} no tiene acrónimo configurado para la numeración oficial (ORBI_PT_ACRONIMOS). Avisa a administración.`);
    }
    const correlativo = await reservarCorrelativo(deps.portal, acronimo, anio);
    if (correlativo > 999) throw new ErrorNumeroPt(`Se agotaron los números de PT de ${acronimo} para ${anio}.`);
    const codigo = formatearCodigoPt(deps.formato, { acronimo, anio, correlativo });
    try {
      await registrarPt(deps.portal, {
        codigo_pt: codigo, acronimo, anio, correlativo, version: 1, tipo_wo: tipoWoDeOts(ots),
        planta: plantaNombre.slice(0, 100), cliente: planta?.cliente?.slice(0, 100), tecnico: s.tecnicos?.[0]?.slice(0, 100) || usuario.slice(0, 100),
        fecha_inicio: fechaPortal(s.fechaInicio), fecha_fin: fechaPortal(s.fechaFin),
      });
    } catch (error) {
      // No quedó registrado: se devuelve el número para no dejar huecos
      await liberarCorrelativo(deps.portal, acronimo, anio, correlativo).catch(() => undefined);
      throw new ErrorNumeroPt(`No se pudo registrar el PT en el portal: ${(error as Error).message}`, 502);
    }
    return { codigo, correlativo, acronimo, anio, fuente: 'portal' };
  }

  // Sin portal: contador propio del servidor (nunca repite, ni siquiera números ya usados a mano)
  const acronimo = deps.acronimos.get(s.plantaId) ?? acronimoLocal(plantaNombre);
  return inTransaction(db, () => {
    const ptws = (repo.getCollection(db, STORAGE_KEYS.DB_PTW)?.data as PTW[] | undefined) ?? [];
    const usado = mayorCorrelativoUsado(ptws.map(p => p.codigo), deps.formato, acronimo, anio);
    const fila = db.prepare('SELECT ultimo FROM pt_correlativos WHERE acronimo = ? AND anio = ?').get(acronimo, anio) as { ultimo: number } | undefined;
    const correlativo = Math.max(usado, Number(fila?.ultimo ?? 0)) + 1;
    if (correlativo > 999) throw new ErrorNumeroPt(`Se agotaron los números de PT de ${acronimo} para ${anio}.`);
    db.prepare('INSERT INTO pt_correlativos (acronimo, anio, ultimo) VALUES (?, ?, ?) ON CONFLICT(acronimo, anio) DO UPDATE SET ultimo = excluded.ultimo')
      .run(acronimo, anio, correlativo);
    return { codigo: formatearCodigoPt(deps.formato, { acronimo, anio, correlativo }), correlativo, acronimo, anio, fuente: 'local' as const };
  });
}
