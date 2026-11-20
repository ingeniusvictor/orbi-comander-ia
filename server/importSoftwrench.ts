/**
 * MÓDULO 17C — Importación desde SoftWrench a la base del piloto.
 *
 *   npm run import:softwrench -- <extraccion.json>            (simula: muestra qué se importaría)
 *   npm run import:softwrench -- <extraccion.json> --aplicar  (escribe en la base)
 *
 * La extracción contiene datos reales de la operación: guardarla en data/importaciones/
 * (carpeta fuera de git), nunca en el repositorio.
 */
import fs from 'node:fs';
import type { Db } from './db';
import { inTransaction } from './db';
import * as repo from './repo';
import { CMMS_KEYS } from './collections';
import { construirImportacion, type SwSnapshot, type ResultadoImportacion } from '../src/domain/softwrenchImport';
import type { Asset, ChecklistTemplate, PmPlan } from '../src/domain/cmms';
import { validateAssets, validatePlan, validateTemplate } from '../src/domain/cmms';

export function validarSnapshot(s: unknown): string | null {
  const x = s as Partial<SwSnapshot>;
  if (!x || x.fuente !== 'SoftWrench') return 'El archivo no es una extracción de SoftWrench (falta "fuente": "SoftWrench").';
  if (!x.planta?.plantaId || !x.planta?.nombre) return 'Falta la planta (nombre y plantaId de la Matriz de Plantas).';
  for (const k of ['equipos', 'plantillas', 'planes', 'ots'] as const) {
    if (!Array.isArray(x[k])) return `Falta la lista "${k}".`;
  }
  return null;
}

export function importarSnapshot(db: Db, snap: SwSnapshot, opciones: { aplicar: boolean; por?: string; ahora?: Date }): ResultadoImportacion {
  const por = opciones.por ?? 'importación SoftWrench';
  const leer = <T,>(k: string) => (repo.getCollection(db, k) ?? { data: [] as T[], version: 0 }) as { data: T[]; version: number };
  const assets = leer<Asset>(CMMS_KEYS.ASSETS);
  const templates = leer<ChecklistTemplate>(CMMS_KEYS.TEMPLATES);
  const plans = leer<PmPlan>(CMMS_KEYS.PLANS);
  const guardadas = repo.listOTs(db);
  const otCodigos = new Set(guardadas.map(s => s.ot.codigo));
  const porCodigo = new Map(guardadas.map(s => [s.ot.codigo, s]));

  const r = construirImportacion(snap, {
    assetIds: new Set(assets.data.map(a => a.id)),
    templateIds: new Set(templates.data.map(t => t.id)),
    planIds: new Set(plans.data.map(p => p.id)),
    otCodigos,
    planIdPorCodigo: new Map(plans.data.map(p => [p.codigo.trim(), p.id])),
    templates: new Map(templates.data.map(t => [t.id, t])),
    ots: new Map(guardadas.map(s => [s.ot.codigo, s.ot])),
  }, opciones.ahora);

  // Las mismas validaciones que aplica la pantalla "Activos y Preventivos"
  const todosAssets = [...assets.data, ...r.assets];
  const errAssets = validateAssets(todosAssets);
  if (errAssets.length) throw new Error(`Equipos inválidos: ${errAssets.join(' ')}`);
  for (const t of r.templates) {
    const e = validateTemplate(t);
    if (e.length) throw new Error(`Plantilla ${t.codigo}: ${e.join(' ')}`);
  }
  const actualizadasPorId = new Map(r.templatesActualizadas.map(t => [t.id, t]));
  const todasPlantillas = [...templates.data.map(t => actualizadasPorId.get(t.id) ?? t), ...r.templates];
  for (const t of r.templatesActualizadas) {
    const e = validateTemplate(t);
    if (e.length) throw new Error(`Plantilla ${t.codigo}: ${e.join(' ')}`);
  }
  for (const p of r.plans) {
    const e = validatePlan(p, todasPlantillas, [...plans.data, ...r.plans]);
    if (e.length) throw new Error(`Plan ${p.codigo}: ${e.join(' ')}`);
  }

  if (opciones.aplicar) {
    inTransaction(db, () => {
      if (r.assets.length && repo.saveCollection(db, CMMS_KEYS.ASSETS, todosAssets, assets.version, por) === null) throw new Error('Los equipos cambiaron durante la importación; vuelve a intentarlo.');
      if ((r.templates.length || r.templatesActualizadas.length) && repo.saveCollection(db, CMMS_KEYS.TEMPLATES, todasPlantillas, templates.version, por) === null) throw new Error('Las plantillas cambiaron durante la importación; vuelve a intentarlo.');
      if (r.plans.length && repo.saveCollection(db, CMMS_KEYS.PLANS, [...plans.data, ...r.plans], plans.version, por) === null) throw new Error('Los planes cambiaron durante la importación; vuelve a intentarlo.');
      for (const ot of r.ots) repo.insertOT(db, ot, por);
      // OTs ya importadas: nueva versión con los campos que cambiaron (los teléfonos la reciben al sincronizar)
      for (const ot of r.otsActualizadas) {
        const actual = porCodigo.get(ot.codigo)!;
        const version = actual.version + 1;
        const fieldVersions = { ...actual.fieldVersions };
        for (const k of Object.keys(ot) as (keyof typeof ot)[]) {
          if (JSON.stringify(ot[k]) !== JSON.stringify(actual.ot[k])) fieldVersions[k as string] = version;
        }
        if (!repo.saveOT(db, { ot, version, fieldVersions }, actual.version, por)) {
          throw new Error(`La OT ${ot.codigo} cambió durante la importación; vuelve a intentarlo.`);
        }
      }
    });
  }
  return r;
}

// ---------------- Línea de comandos ----------------
if (process.argv[1] && /importSoftwrench/.test(process.argv[1])) {
  const [archivo, ...flags] = process.argv.slice(2);
  if (!archivo) {
    console.log('Uso: npm run import:softwrench -- <extraccion.json> [--aplicar]');
    process.exit(1);
  }
  const { openDb } = await import('./db');
  const snap = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const error = validarSnapshot(snap);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  const aplicar = flags.includes('--aplicar');
  const db = openDb();
  try {
    const r = importarSnapshot(db, snap, { aplicar });
    console.log(aplicar ? 'Importación aplicada.' : 'SIMULACIÓN (no se escribió nada). Agrega --aplicar para importar.');
    console.log(JSON.stringify(r.resumen, null, 2));
  } catch (e) {
    console.error(`No se importó nada: ${(e as Error).message}`);
    process.exit(1);
  }
}
