/**
 * MÓDULO 17C — importación desde SoftWrench. Usa una extracción INVENTADA (sin datos reales).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { construirImportacion, nombreDesdeCorreo, ids, type SwSnapshot } from '../src/domain/softwrenchImport';
import { colaDeCierre } from '../src/domain/cierre';

process.env.ORBI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'orbi-import-'));
test.after(() => fs.rmSync(process.env.ORBI_DATA_DIR!, { recursive: true, force: true }));

const snap: SwSnapshot = {
  fuente: 'SoftWrench',
  extraidoEl: '2026-11-20',
  planta: { nombre: 'Planta Demo', plantaId: 'ORBI-PV-999' },
  equipos: [
    { tag: 'GI-101', tipo: 'Inversor', grupo: 'Inversores GI-1xx' },
    { tag: 'GI-201', tipo: 'Inversor', grupo: 'Inversores GI-2xx' },
  ],
  plantillas: [
    { codigo: 'DEMO_INV_M1', proposito: 'Revisión externa', preguntas: [{ texto: '¿Envolvente sin daños?' }, { texto: '¿Qué etiqueta falta?', tipo: 'texto' }] },
    { codigo: 'DEMO_GEN_M1' },
  ],
  planes: [
    { pmnum: '9001', descripcion: 'MP Mensual de Inversores -', periodicidad: 'mensual', proximaFecha: '2026-12-30T00:00:00', plantillas: ['DEMO_INV_M1', 'DEMO_INV_M1'] },
    { pmnum: '9002', descripcion: 'MP Quinquenal -', periodicidad: 'quinquenal', proximaFecha: null, plantillas: ['DEMO_GEN_M1'] },
  ],
  ots: [
    { wonum: '26-900001', description: 'MP Mensual de Inversores - Noviembre', status: 'DAPPR', worktype: 'PM', schedstart: '2026-11-25T08:00:00', schedfinish: '2026-11-25T17:45:00', pmnum: '9001', owner: 'ANA.PEREZ@ejemplo.cl', fechaObjetivoContrato: '2026-11-30' },
    { wonum: '26-900002', description: 'Inversor - ventilador ruidoso - GI-201', status: 'WAPPR', worktype: 'CM', reportdate: '2026-11-10T10:00:00', cobrable: true },
    { wonum: '26-900003', description: 'MP Mensual de Inversores - Octubre', status: 'RSALOR', worktype: 'PM', pmnum: '9001', schedstart: '2026-10-05T08:00:00', fechaTerreno: '2026-10-07T08:00:00', statusdate: '2026-10-30T11:00:00', tecnicosConHoras: ['R.SOTO@ejemplo.cl'], horasTotales: 9.5, fechaObjetivoContrato: '2026-10-30' },
    { wonum: '26-900004', description: 'Cerrada hace tiempo', status: 'COMPL', worktype: 'PM' },
  ],
};
const vacio = { assetIds: new Set<string>(), templateIds: new Set<string>(), planIds: new Set<string>(), otCodigos: new Set<string>() };

test('nombres desde el correo de SoftWrench', () => {
  assert.equal(nombreDesdeCorreo('ESTEBAN.CARRASCO@empresa.cl'), 'Esteban Carrasco');
  assert.equal(nombreDesdeCorreo('R.CISTERNA@empresa.cl'), 'R. Cisterna');
  assert.equal(nombreDesdeCorreo(null), '');
});

test('maestros: equipos en jerarquía, plantillas con preguntas reales y planes inactivos', () => {
  const r = construirImportacion(snap, vacio, new Date('2026-11-20T12:00:00Z'));
  assert.equal(r.assets.find(a => a.codigo === 'GI-101')?.parentId, ids.grupo('ORBI-PV-999', 'Inversores GI-1xx'));
  const inv = r.templates.find(t => t.codigo === 'DEMO_INV_M1')!;
  assert.deepEqual(inv.items.map(i => i.tipo), ['ok_nok', 'texto']);
  assert.match(r.templates.find(t => t.codigo === 'DEMO_GEN_M1')!.items[0].texto, /aún no se han cargado/);
  assert.equal(r.plans.length, 1);
  assert.equal(r.plans[0].activo, false, 'SoftWrench sigue generando las OTs');
  assert.deepEqual(r.plans[0].plantillaIds, [ids.plantilla('DEMO_INV_M1')]);
  assert.match(r.resumen.planes.omitidos[0], /quinquenal/);
});

test('OTs: estados, cerradas fuera, equipo detectado en la descripción y cobrable', () => {
  const r = construirImportacion(snap, vacio, new Date('2026-11-20T12:00:00Z'));
  assert.deepEqual(r.ots.map(o => [o.codigo, o.estado]), [['26-900001', 'Programada'], ['26-900002', 'Nueva'], ['26-900003', 'En revisión Coordinador']]);
  assert.equal(r.resumen.ots.omitidasCerradas, 1);
  const prog = r.ots[0];
  assert.equal(prog.tipo, 'Preventiva');
  assert.equal(prog.coordinador, 'Ana Perez');
  assert.equal(prog.fechaObjetivo, '2026-11-30');
  assert.equal(prog.fechaObjetivoLimite, '2026-12-07', 'mensual: 7 días de margen');
  assert.equal(prog.checklistExecution?.length, 2, 'checklist del plan con sus preguntas');
  const cm = r.ots[1];
  assert.equal(cm.activoId, ids.activo('ORBI-PV-999', 'GI-201'));
  assert.equal(cm.cobrable, true);
  assert.equal(cm.softwrench?.wonum, '26-900002');
});

test('ejecutada sin cerrar: entra a la cola de cierre con los días desde la ejecución en terreno', () => {
  const r = construirImportacion(snap, vacio, new Date('2026-11-20T12:00:00Z'));
  const fila = colaDeCierre(r.ots, '2026-11-20').find(f => f.ot.codigo === '26-900003')!;
  assert.equal(fila.ejecutada, '2026-10-07');
  assert.equal(fila.dias, 44);
  assert.equal(fila.etapa, 'Coordinador');
  assert.equal(fila.ot.responsable, 'R. Soto');
  assert.equal(fila.ot.hhReales, 9.5);
});

test('importar dos veces no duplica nada y lo existente no se pisa', async () => {
  const { openDb } = await import('../server/db');
  const { importarSnapshot } = await import('../server/importSoftwrench');
  const repo = await import('../server/repo');
  const db = openDb(':memory:');
  const sim = importarSnapshot(db, snap, { aplicar: false });
  assert.equal(sim.ots.length, 3);
  assert.equal(repo.listOTs(db).length, 0, 'la simulación no escribe');
  importarSnapshot(db, snap, { aplicar: true });
  assert.equal(repo.listOTs(db).length, 3);
  const otra = importarSnapshot(db, snap, { aplicar: true });
  assert.deepEqual([otra.ots.length, otra.assets.length, otra.templates.length, otra.plans.length], [0, 0, 0, 0]);
  assert.equal(otra.resumen.ots.existentes, 3);
  assert.equal(repo.listOTs(db).length, 3);
});
