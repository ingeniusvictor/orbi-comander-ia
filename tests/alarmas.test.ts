/** MÓDULO 17D — alarmas de VCOM → correctivos. Alarmas INVENTADAS y portal simulado (sin red). */
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { normalizarAlarma, planificarAlarmas, correctivoDesdeAlarma, codigoAlarma, type AlarmaVcom } from '../src/domain/alarmas';
import { leerPlantasVcom, leerConfigPortal, alarmasAbiertas } from '../server/portalOm';
import type { OT } from '../src/types';

process.env.ORBI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'orbi-alarmas-'));
test.after(() => fs.rmSync(process.env.ORBI_DATA_DIR!, { recursive: true, force: true }));

const ahora = new Date('2026-11-20T15:00:00Z');
const raw = (id: number, o: Record<string, unknown> = {}) => ({
  id, severity: 'critical', status: 'open', title: 'Inversor sin producción', startedAt: '2026-11-20T13:00:00Z', components: [{ name: 'GI-106' }], ...o,
});
const norm = (r: unknown) => normalizarAlarma(r, 'PVX01')!;

test('normaliza alarmas de VCOM y descarta las que no reconoce', () => {
  const a = norm(raw(1));
  assert.deepEqual([a.id, a.severidad, a.abierta, a.equipo, a.titulo], ['1', 'critical', true, 'GI-106', 'Inversor sin producción']);
  assert.equal(norm({ alarmId: 'x', severity: 'HIGH', startTime: '2026-11-20T10:00:00Z', endTime: '2026-11-20T11:00:00Z' }).abierta, false);
  assert.equal(normalizarAlarma({ severity: 'high' }, 'PVX01'), null, 'sin id');
  assert.equal(normalizarAlarma({ id: 3 }, 'PVX01'), null, 'sin fecha de inicio');
});

test('regla: severidad, 30 minutos, cerradas, ya conocidas y agrupación por equipo', () => {
  const alarmas = [
    norm(raw(1)),
    norm(raw(2, { severity: 'normal' })),
    norm(raw(3, { startedAt: '2026-11-20T14:50:00Z', components: [{ name: 'GI-201' }] })),
    norm(raw(4, { status: 'closed' })),
    norm(raw(5, { severity: 'high', title: 'Temperatura alta' })), // mismo equipo que la 1
    norm(raw(6, { components: [{ name: 'GI-115' }] })),
  ];
  const yaConocida = { codigo: 'AL-PVX01-6', estado: 'Nueva', alarmasOrigen: [{ id: '6', systemKey: 'PVX01', severidad: 'critical', titulo: 't', inicio: 'x', equipo: 'GI-115' }] } as unknown as OT;
  const plan = planificarAlarmas(alarmas, [yaConocida], undefined, ahora);
  assert.deepEqual(plan.crear.map(g => g.map(a => a.id)), [['1', '5']]);
  assert.deepEqual(plan.ignorar.map(i => [i.alarma.id, i.motivo.split(' ')[0]]), [['2', 'severidad'], ['3', 'abierta'], ['4', 'cerrada'], ['6', 'ya']]);
});

test('alarma nueva de un equipo con correctivo abierto: se agrega a esa OT; si la OT está cerrada, se crea otra', () => {
  const abierta = { codigo: 'AL-PVX01-1', estado: 'Asignada', alarmasOrigen: [{ id: '1', systemKey: 'PVX01', severidad: 'critical', titulo: 't', inicio: 'x', equipo: 'GI-106' }] } as unknown as OT;
  const nueva = norm(raw(9));
  assert.equal(planificarAlarmas([nueva], [abierta], undefined, ahora).agregar[0].ot.codigo, 'AL-PVX01-1');
  assert.equal(planificarAlarmas([nueva], [{ ...abierta, estado: 'Cerrada' }], undefined, ahora).crear.length, 1);
});

test('el correctivo nace "Nueva" (Por aprobar), con prioridad por severidad, equipo del catastro y origen Centro de Control', () => {
  const grupo: AlarmaVcom[] = [norm(raw(5, { severity: 'high' })), norm(raw(1))];
  const assets = [{ id: 'sw-P-GI-106', plantaId: 'ORBI-PV-001', codigo: 'GI-106', nombre: 'Inversor GI-106', tipo: 'Inversor', activo: true }] as never;
  const ot = correctivoDesdeAlarma(grupo, { plantaId: 'ORBI-PV-001', plantaNombre: 'Demo' }, assets, codigoAlarma(grupo[0]), undefined, ahora);
  assert.deepEqual([ot.estado, ot.tipo, ot.prioridad, ot.origen, ot.activoId, ot.codigo], ['Nueva', 'Correctiva', 'Alta', 'Centro de Control', 'sw-P-GI-106', 'AL-PVX01-5']);
  assert.equal(ot.alarmasOrigen!.length, 2);
});

test('proceso completo en la base: simula sin escribir, crea una vez y agrega alarmas nuevas con nueva versión', async () => {
  const { openDb } = await import('../server/db');
  const { procesarAlarmas } = await import('../server/alarmas');
  const repo = await import('../server/repo');
  const db = openDb(':memory:');
  const entrada = (alarmas: unknown[]) => [{ systemKey: 'PVX01', plantaId: 'ORBI-PV-001', alarmas }];

  const sim = procesarAlarmas(db, entrada([raw(1), raw(2, { severity: 'normal' }), { basura: true }]), { aplicar: false, ahora });
  assert.deepEqual([sim.creadas, sim.noReconocidas, repo.listOTs(db).length], [['AL-PVX01-1'], 1, 0]);

  procesarAlarmas(db, entrada([raw(1)]), { aplicar: true, ahora });
  const otra = procesarAlarmas(db, entrada([raw(1)]), { aplicar: true, ahora });
  assert.deepEqual([otra.creadas.length, repo.listOTs(db).length], [0, 1], 'no duplica');

  const v1 = repo.getOT(db, 'AL-PVX01-1')!.version;
  const r = procesarAlarmas(db, entrada([raw(1), raw(7, { title: 'Ventilador detenido' })]), { aplicar: true, ahora });
  assert.deepEqual(r.agregadas, ['AL-PVX01-1']);
  const ot = repo.getOT(db, 'AL-PVX01-1')!;
  assert.equal(ot.version, v1 + 1);
  assert.deepEqual(ot.ot.alarmasOrigen!.map(a => a.id), ['1', '7']);
});

test('configuración del portal: apagado sin variables, plantas mal escritas se ignoran, solo https', () => {
  assert.equal(leerConfigPortal({}), null);
  assert.deepEqual(leerPlantasVcom('PV61D=ORBI-PV-058, malo, X=ORBI-PV-1, PV70A=ORBI-PV-012'), [
    { systemKey: 'PV61D', plantaId: 'ORBI-PV-058' }, { systemKey: 'PV70A', plantaId: 'ORBI-PV-012' }]);
  const base = { ORBI_PORTAL_OM_TENANT: 't', ORBI_PORTAL_OM_CLIENT_ID: 'c', ORBI_PORTAL_OM_CLIENT_SECRET: 's', ORBI_PORTAL_OM_SCOPE: 'api://x/.default' };
  assert.throws(() => leerConfigPortal({ ...base, ORBI_PORTAL_OM_URL: 'http://inseguro' }), /https/);
  assert.equal(leerConfigPortal({ ...base, ORBI_PORTAL_OM_URL: 'https://portal.ejemplo/' })!.url, 'https://portal.ejemplo');
});

test('cliente del portal: pide token a Entra ID y lee { data: [...] } (fetch simulado)', async () => {
  const llamadas: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    llamadas.push(String(url));
    if (String(url).includes('login.microsoftonline.com')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }));
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer tok');
    return new Response(JSON.stringify({ data: [raw(1)] }));
  }) as typeof fetch;
  try {
    const c = { url: 'https://portal.ejemplo', tenant: 't', clientId: 'c', clientSecret: 's', scope: 'x', plantas: [], minutos: 15 };
    const lista = await alarmasAbiertas(c, 'PVX01');
    assert.equal(lista.length, 1);
    assert.ok(llamadas[1].includes('/api/v1/vcom/alarms?systemKey=PVX01&status=open'));
  } finally {
    globalThis.fetch = original;
  }
});
