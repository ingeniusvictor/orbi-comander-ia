/**
 * MÓDULO 17D — Proceso de alarmas de VCOM → correctivos en ORBI.
 *
 *   npm run alarmas -- <alarmas.json>              simula con un archivo de alarmas (no escribe)
 *   npm run alarmas -- <alarmas.json> --aplicar    crea/actualiza los correctivos
 *   npm run alarmas -- --portal [--aplicar]        consulta el portal O&M una vez (requiere configuración)
 *
 * Archivo de alarmas: [{ "systemKey": "PV61D", "plantaId": "ORBI-PV-058", "alarmas": [ ...tal como las entrega VCOM... ] }]
 * El servidor lo ejecuta solo cada ORBI_ALARMAS_MINUTOS si el portal está configurado (ver server/portalOm.ts).
 */
import fs from 'node:fs';
import type { Db } from './db';
import { inTransaction, openDb } from './db';
import * as repo from './repo';
import { CMMS_KEYS } from './collections';
import { STORAGE_KEYS } from '../src/data/storage';
import type { OT, Planta } from '../src/types';
import type { Asset } from '../src/domain/cmms';
import {
  normalizarAlarma, planificarAlarmas, correctivoDesdeAlarma, agregarAlarma, codigoAlarma, REGLA_POR_DEFECTO, type ReglaAlarmas,
} from '../src/domain/alarmas';
import { leerConfigPortal, alarmasAbiertas, type ConfigPortal } from './portalOm';

export interface EntradaAlarmas {
  systemKey: string;
  plantaId: string;
  alarmas: unknown[];
}

export interface ResultadoAlarmas {
  revisadas: number;
  creadas: string[];
  agregadas: string[];
  ignoradas: { alarma: string; motivo: string }[];
  noReconocidas: number;
}

export function procesarAlarmas(db: Db, entradas: EntradaAlarmas[], opciones: { aplicar: boolean; regla?: ReglaAlarmas; ahora?: Date }): ResultadoAlarmas {
  const ahora = opciones.ahora ?? new Date();
  const regla = opciones.regla ?? REGLA_POR_DEFECTO;
  const plantas = (repo.getCollection(db, STORAGE_KEYS.PLANTAS)?.data as Planta[] | undefined) ?? [];
  const assets = (repo.getCollection(db, CMMS_KEYS.ASSETS)?.data as Asset[] | undefined) ?? [];
  const r: ResultadoAlarmas = { revisadas: 0, creadas: [], agregadas: [], ignoradas: [], noReconocidas: 0 };

  const trabajo = () => {
    const guardadas = repo.listOTs(db);
    for (const e of entradas) {
      const alarmas = e.alarmas.map(a => normalizarAlarma(a, e.systemKey)).filter((a): a is NonNullable<typeof a> => Boolean(a));
      r.noReconocidas += e.alarmas.length - alarmas.length;
      r.revisadas += alarmas.length;
      const otsPlanta = guardadas.filter(s => s.ot.plantaId === e.plantaId).map(s => s.ot);
      const plan = planificarAlarmas(alarmas, otsPlanta, regla, ahora);
      for (const i of plan.ignorar) r.ignoradas.push({ alarma: `${i.alarma.systemKey}:${i.alarma.id}`, motivo: i.motivo });

      const planta = plantas.find(p => p.id === e.plantaId);
      const datosPlanta = { plantaId: e.plantaId, plantaNombre: planta?.name ?? e.plantaId, supervisor: planta?.supervisor };
      for (const grupo of plan.crear) {
        const codigo = codigoAlarma(grupo[0]);
        if (repo.getOT(db, codigo)) continue;
        const ot = correctivoDesdeAlarma(grupo, datosPlanta, assets, codigo, regla, ahora);
        if (opciones.aplicar) repo.insertOT(db, ot, 'Alarmas VCOM');
        r.creadas.push(codigo);
      }
      // Alarmas nuevas de un equipo con correctivo abierto: se agregan a esa OT (nueva versión)
      const porOT = new Map<string, OT>();
      for (const { ot, alarma } of plan.agregar) porOT.set(ot.codigo, agregarAlarma(porOT.get(ot.codigo) ?? ot, alarma, ahora));
      for (const [codigo, ot] of porOT) {
        if (opciones.aplicar) {
          const actual = repo.getOT(db, codigo)!;
          const version = actual.version + 1;
          const fieldVersions = { ...actual.fieldVersions, alarmasOrigen: version, historialCambios: version };
          if (!repo.saveOT(db, { ot, version, fieldVersions }, actual.version, 'Alarmas VCOM')) throw new Error(`La OT ${codigo} cambió durante el proceso; se reintentará.`);
        }
        r.agregadas.push(codigo);
      }
    }
  };
  if (opciones.aplicar) inTransaction(db, trabajo); else trabajo();
  return r;
}

// ---------------- Ejecución periódica (servidor) ----------------

export interface EstadoAlarmas {
  configurada: boolean;
  plantas: string[];
  ultimaRevision?: string;
  ultimoResultado?: { creadas: number; agregadas: number; revisadas: number };
  error?: string;
}

export const estadoAlarmas: EstadoAlarmas = { configurada: false, plantas: [] };

export async function revisarPortal(db: Db, config: ConfigPortal, aplicar = true): Promise<ResultadoAlarmas> {
  const entradas: EntradaAlarmas[] = [];
  for (const p of config.plantas) entradas.push({ ...p, alarmas: await alarmasAbiertas(config, p.systemKey) });
  return procesarAlarmas(db, entradas, { aplicar });
}

/** Programa la revisión periódica si el portal está configurado. Devuelve false si no lo está. */
export function programarAlarmas(db: Db): boolean {
  let config: ConfigPortal | null;
  try {
    config = leerConfigPortal();
  } catch (error) {
    estadoAlarmas.error = (error as Error).message;
    console.error(`[ORBI] Alarmas VCOM: ${estadoAlarmas.error}`);
    return false;
  }
  if (!config || !config.plantas.length) return false;
  estadoAlarmas.configurada = true;
  estadoAlarmas.plantas = config.plantas.map(p => p.plantaId);
  const ciclo = async () => {
    try {
      const r = await revisarPortal(db, config!);
      estadoAlarmas.ultimaRevision = new Date().toISOString();
      estadoAlarmas.ultimoResultado = { creadas: r.creadas.length, agregadas: r.agregadas.length, revisadas: r.revisadas };
      estadoAlarmas.error = undefined;
      if (r.creadas.length || r.agregadas.length) console.log(`[ORBI] Alarmas VCOM: ${r.creadas.length} correctivo(s) nuevo(s), ${r.agregadas.length} actualizado(s).`);
    } catch (error) {
      estadoAlarmas.error = (error as Error).message;
      console.error(`[ORBI] Alarmas VCOM: ${estadoAlarmas.error}`);
    }
  };
  void ciclo();
  setInterval(ciclo, config.minutos * 60_000).unref();
  return true;
}

// ---------------- Línea de comandos ----------------
// Sin "await" de nivel superior: este archivo también se empaqueta dentro del servidor (formato CommonJS)
if (process.argv[1] && /server[\\/]alarmas/.test(process.argv[1])) void (async () => {
  const args = process.argv.slice(2);
  const aplicar = args.includes('--aplicar');
  const db = openDb();
  try {
    let r: ResultadoAlarmas;
    if (args.includes('--portal')) {
      const config = leerConfigPortal();
      if (!config) throw new Error('El portal O&M no está configurado (faltan variables ORBI_PORTAL_OM_*; ver server/portalOm.ts).');
      r = await revisarPortal(db, config, aplicar);
    } else {
      const archivo = args.find(a => !a.startsWith('--'));
      if (!archivo) throw new Error('Uso: npm run alarmas -- <alarmas.json> [--aplicar]   |   npm run alarmas -- --portal [--aplicar]');
      const entradas = JSON.parse(fs.readFileSync(archivo, 'utf8')) as EntradaAlarmas[];
      if (!Array.isArray(entradas)) throw new Error('El archivo debe ser una lista de { systemKey, plantaId, alarmas }.');
      r = procesarAlarmas(db, entradas, { aplicar });
    }
    console.log(aplicar ? 'Alarmas procesadas.' : 'SIMULACIÓN (no se escribió nada). Agrega --aplicar para crear los correctivos.');
    console.log(JSON.stringify(r, null, 2));
  } catch (error) {
    console.error(`No se procesó nada: ${(error as Error).message}`);
    process.exit(1);
  }
})();
