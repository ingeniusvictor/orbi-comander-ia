/** MÓDULO 17E — numeración de PT/AST. Datos inventados; el portal se simula (sin red). */
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import {
  formatearCodigoPt, leerMapaAcronimos, acronimoLocal, tipoWoDeOts, mayorCorrelativoUsado, validarSolicitudPt, FORMATO_PT_POR_DEFECTO,
} from '../src/domain/numeracionPt';
import type { OT } from '../src/types';

process.env.ORBI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'orbi-pt-'));
test.after(() => fs.rmSync(process.env.ORBI_DATA_DIR!, { recursive: true, force: true }));

const F = FORMATO_PT_POR_DEFECTO;
const ahora = new Date('2026-11-20T15:00:00Z');

test('formato, acrónimos y tipo de OT para la bitácora', () => {
  assert.equal(formatearCodigoPt(F, { acronimo: 'CANT', anio: 2026, correlativo: 7 }), 'PT-CANT-2026-007');
  assert.equal(formatearCodigoPt('{acronimo}/{anio}/{correlativo}', { acronimo: 'X', anio: 2027, correlativo: 123 }), 'X/2027/123');
  assert.deepEqual([...leerMapaAcronimos('ORBI-PV-058=cant, malo, ORBI-PV-1=X Y')], [['ORBI-PV-058', 'CANT']]);
  assert.equal(acronimoLocal('Ñuble Solar'), 'NUBL');
  assert.equal(tipoWoDeOts([{ tipo: 'Preventiva' }, { tipo: 'Correctiva' }]), 'CM');
  assert.equal(tipoWoDeOts([{ tipo: 'Preventiva' }]), 'PM');
  assert.equal(tipoWoDeOts([{ tipo: 'Inspección' }]), 'OTHER');
});

test('mayor número ya usado: solo cuenta el mismo acrónimo y año', () => {
  const codigos = ['PT-CANT-2026-007', 'PT-CANT-2026-012', 'PT-CANT-2025-099', 'PT-PARR-2026-050', 'PTS-CANT-2026-089'];
  assert.equal(mayorCorrelativoUsado(codigos, F, 'CANT', 2026), 12);
  assert.equal(mayorCorrelativoUsado([], F, 'CANT', 2026), 0);
});

test('validación de la solicitud', () => {
  assert.match(validarSolicitudPt({ plantaId: 'P', otCodigos: [] })!, /OT/);
  assert.match(validarSolicitudPt({ otCodigos: ['A'] } as never)!, /planta/);
  assert.equal(validarSolicitudPt({ plantaId: 'P', otCodigos: ['A'], tecnicos: ['Ana'] }), null);
});

async function baseConOTs() {
  const { openDb } = await import('../server/db');
  const repo = await import('../server/repo');
  const db = openDb(':memory:');
  const ot = (codigo: string, plantaId: string, tipo = 'Preventiva') => ({ codigo, plantaId, plantaNombre: plantaId === 'ORBI-PV-058' ? 'Cantillana' : 'Otra', tipo, estado: 'Programada' } as unknown as OT);
  repo.insertOT(db, ot('OT-1', 'ORBI-PV-058'), 't');
  repo.insertOT(db, ot('OT-2', 'ORBI-PV-058', 'Correctiva'), 't');
  repo.insertOT(db, ot('OT-9', 'ORBI-PV-001'), 't');
  return { db, repo };
}

test('sin portal: contador del servidor que sigue al mayor número ya usado y nunca repite', async () => {
  const { db, repo } = await baseConOTs();
  const { emitirNumeroPt } = await import('../server/numeracionPt');
  const deps = { portal: null, acronimos: new Map<string, string>(), formato: F, ahora };
  repo.saveCollection(db, 'orbi_om_db_ptw_v1', [{ codigo: 'PT-CANT-2026-007' }], 0, 't');
  const a = await emitirNumeroPt(db, { plantaId: 'ORBI-PV-058', otCodigos: ['OT-1'] }, 'Sup', deps);
  const b = await emitirNumeroPt(db, { plantaId: 'ORBI-PV-058', otCodigos: ['OT-1', 'OT-2'] }, 'Sup', deps);
  assert.deepEqual([a.codigo, a.fuente, b.codigo], ['PT-CANT-2026-008', 'local', 'PT-CANT-2026-009']);
  await assert.rejects(emitirNumeroPt(db, { plantaId: 'ORBI-PV-058', otCodigos: ['OT-1', 'OT-9'] }, 'Sup', deps), /misma planta/);
  await assert.rejects(emitirNumeroPt(db, { plantaId: 'ORBI-PV-058', otCodigos: ['NO-EXISTE'] }, 'Sup', deps), /no existe/);
});

test('con portal: reserva el número oficial, lo registra en la bitácora y lo libera si el registro falla', async () => {
  const { db } = await baseConOTs();
  const { emitirNumeroPt } = await import('../server/numeracionPt');
  const portal = { url: 'https://portal.ejemplo', tenant: 't', clientId: 'c', clientSecret: 's', scope: 'x', plantas: [], minutos: 15 };
  const llamadas: { url: string; body?: unknown }[] = [];
  let fallarRegistro = false;
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    llamadas.push({ url: u, body: init?.body && typeof init.body === 'string' ? JSON.parse(init.body) : undefined });
    if (u.includes('login.microsoftonline.com')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }));
    if (u.endsWith('/siguiente')) return new Response(JSON.stringify({ acronimo: 'CANT', anio: 2026, ultimo: 15 }));
    if (u.endsWith('/log-pt')) return fallarRegistro ? new Response('ya existe', { status: 409 }) : new Response(JSON.stringify({ log_id: 1 }));
    if (u.endsWith('/liberar')) return new Response(JSON.stringify({ acronimo: 'CANT', anio: 2026, ultimo: 14 }));
    return new Response('?', { status: 404 });
  }) as typeof fetch;
  try {
    const deps = { portal, acronimos: new Map([['ORBI-PV-058', 'CANT']]), formato: F, ahora };
    const n = await emitirNumeroPt(db, { plantaId: 'ORBI-PV-058', otCodigos: ['OT-2'], tecnicos: ['Ana Pérez'], fechaInicio: '2026-11-21 08:30' }, 'Sup', deps);
    assert.deepEqual([n.codigo, n.fuente], ['PT-CANT-2026-015', 'portal']);
    const log = llamadas.find(l => l.url.endsWith('/log-pt'))!.body as Record<string, unknown>;
    assert.deepEqual([log.codigo_pt, log.correlativo, log.tipo_wo, log.tecnico, log.fecha_inicio], ['PT-CANT-2026-015', 15, 'CM', 'Ana Pérez', '2026-11-21T08:30:00']);

    fallarRegistro = true;
    llamadas.length = 0;
    await assert.rejects(emitirNumeroPt(db, { plantaId: 'ORBI-PV-058', otCodigos: ['OT-1'] }, 'Sup', deps), /registrar/);
    assert.ok(llamadas.some(l => l.url.endsWith('/liberar') && (l.body as { correlativo: number }).correlativo === 15), 'número devuelto');

    // Planta sin acrónimo configurado: no se inventa uno (chocaría con la numeración oficial)
    await assert.rejects(emitirNumeroPt(db, { plantaId: 'ORBI-PV-001', otCodigos: ['OT-9'] }, 'Sup', deps), /acrónimo/);
  } finally {
    globalThis.fetch = original;
  }
});
