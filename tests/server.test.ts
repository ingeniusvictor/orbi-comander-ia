/**
 * MÓDULO 17A — Fase 1: pruebas del servidor (reglas puras + API real sobre SQLite en memoria).
 * Ejecutar: npx tsx --test tests/server.test.ts  (incluido en `npm test`)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import express from 'express';
import type { OT } from '../src/types';
import { applyOTPatch, prepareNewOT, canSignApproval, type StoredOT } from '../server/otSync';

process.env.ORBI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'orbi-test-'));

const { openDb } = await import('../server/db');
const { createUser, sessionMiddleware, hashPassword, verifyPassword } = await import('../server/auth');
const { createApiRouter } = await import('../server/routes');
const repo = await import('../server/repo');

function makeOT(overrides: Partial<OT> = {}): OT {
  return {
    codigo: 'OT-T1', plantaId: 'ORBI-PV-001', plantaNombre: 'Planta', activo: 'Inversor 1', tipo: 'Correctiva',
    prioridad: 'Media', criticidad: 'Media', responsable: 'Víctor León', fechaInicio: '2026-11-19', fechaLimite: '2026-11-30',
    estado: 'En ejecución', avance: 50, hhEstimadas: 4, hhReales: 0, observaciones: '', origen: 'Supervisor',
    impacto: 'Medio', riesgoDisponibilidad: 'No aplica', requiereEvidencia: false, requiereAST: false,
    ...overrides,
  } as OT;
}

const tecnico = { displayName: 'Victor Leon', role: 'TECNICO_OM' as const };
const supervisor = { displayName: 'Mauricio Valdés', role: 'SUPERVISOR_TERRENO' as const };
const noFiles = () => false;

// ---------------- Reglas puras ----------------

test('contraseñas: hash con sal y verificación', () => {
  const h = hashPassword('una-clave-larga');
  assert.notEqual(h, hashPassword('una-clave-larga'));
  assert.equal(verifyPassword('una-clave-larga', h), true);
  assert.equal(verifyPassword('otra-clave-xx', h), false);
});

test('guardado por campo: cambios de distintos usuarios en distintos campos no chocan', () => {
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  const a = applyOTPatch(s0, { baseVersion: 1, changes: { observaciones: 'nota supervisor' } }, supervisor, noFiles);
  assert.equal(a.ok, true);
  if (!a.ok) return;
  // El técnico sigue en la versión 1 y cambia otro campo
  const b = applyOTPatch(a.stored, { baseVersion: 1, changes: { hhReales: 3 } }, tecnico, noFiles);
  assert.equal(b.ok, true);
  if (!b.ok) return;
  assert.deepEqual(b.conflicts, []);
  assert.equal(b.stored.ot.observaciones, 'nota supervisor');
  assert.equal(b.stored.ot.hhReales, 3);
  assert.equal(b.stored.version, 3);
});

test('guardado por campo: mismo campo cambiado por otro → conflicto y no se pisa', () => {
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  const a = applyOTPatch(s0, { baseVersion: 1, changes: { diagnosticoFinalTerreno: 'A' } }, supervisor, noFiles);
  if (!a.ok) throw new Error('a');
  const b = applyOTPatch(a.stored, { baseVersion: 1, changes: { diagnosticoFinalTerreno: 'B', hhReales: 2 } }, tecnico, noFiles);
  if (!b.ok) throw new Error('b');
  assert.deepEqual(b.conflicts, ['diagnosticoFinalTerreno']);
  assert.equal(b.stored.ot.diagnosticoFinalTerreno, 'A');
  assert.equal(b.stored.ot.hhReales, 2);
});

test('el propio cambio reenviado con versión vieja no es conflicto', () => {
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  const a = applyOTPatch(s0, { baseVersion: 1, changes: { hhReales: 2 } }, tecnico, noFiles);
  if (!a.ok) throw new Error('a');
  const b = applyOTPatch(a.stored, { baseVersion: 1, changes: { hhReales: 2, observaciones: 'x' } }, tecnico, noFiles);
  if (!b.ok) throw new Error('b');
  assert.deepEqual(b.conflicts, []);
});

test('técnico: solo sus OTs y sin tocar campos de planificación', () => {
  const ajena = { ot: makeOT({ responsable: 'Otro Técnico' }), version: 1, fieldVersions: {} };
  assert.equal(applyOTPatch(ajena, { baseVersion: 1, changes: { hhReales: 1 } }, tecnico, noFiles).ok, false);
  const propia = { ot: makeOT(), version: 1, fieldVersions: {} };
  const r = applyOTPatch(propia, { baseVersion: 1, changes: { prioridad: 'Crítica' } }, tecnico, noFiles);
  assert.equal(r.ok, false);
});

test('el cliente no puede escribir estado ni historial directamente', () => {
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  const r = applyOTPatch(s0, { baseVersion: 1, changes: { estado: 'Cerrada', lifecycleHistory: [] } as Partial<OT> }, supervisor, noFiles);
  if (!r.ok) throw new Error('r');
  assert.equal(r.stored.ot.estado, 'En ejecución');
});

test('transición en el servidor usa usuario de la sesión y aplica reglas', () => {
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  const bloqueada = applyOTPatch(s0, { baseVersion: 1, changes: {}, transition: { to: 'Finalizada' } }, tecnico, noFiles);
  assert.equal(bloqueada.ok, false, 'sin HH no puede finalizar');
  const ok = applyOTPatch(s0, { baseVersion: 1, changes: { hhReales: 3 }, transition: { to: 'Finalizada', comentario: 'listo' } }, tecnico, noFiles);
  if (ok.ok === false) throw new Error(ok.error);
  const last = ok.stored.ot.lifecycleHistory?.at(-1);
  assert.equal(last?.usuario, 'Victor Leon');
  assert.equal(last?.comentario, 'listo');
});

test('firmas: un técnico no puede firmar como Jefe O&M; las firmas quedan con el usuario real', () => {
  assert.equal(canSignApproval('JefeOM', 'TECNICO_OM'), false);
  assert.equal(canSignApproval('JefeOM', 'JEFE_OM'), true);
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  const r = applyOTPatch(s0, { baseVersion: 1, changes: { approvals: [{ rol: 'Supervisor', nombre: 'Falso', fecha: 'x' }] } }, supervisor, noFiles);
  if (r.ok === false) throw new Error(r.error);
  assert.equal(r.stored.ot.approvals?.[0].nombre, 'Mauricio Valdés');
});

test('evidencia nueva sin foto real es rechazada', () => {
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  const ev = { evidenceId: 'e1', otId: 'OT-T1', type: 'after', label: 'x', description: '', simulatedFileName: 'x.jpg', uploadedBy: '', uploadedAt: '', status: 'Cargada' } as const;
  assert.equal(applyOTPatch(s0, { baseVersion: 1, changes: { evidencePack: [ev] } }, tecnico, noFiles).ok, false);
  assert.equal(applyOTPatch(s0, { baseVersion: 1, changes: { evidencePack: [{ ...ev, fileId: 'f1' }] } }, tecnico, id => id === 'f1').ok, true);
});

test('crear OT: solo roles de planificación y en estado inicial', () => {
  assert.equal(prepareNewOT(makeOT({ codigo: 'OT-N1', estado: 'Nueva' }), tecnico).ok, false);
  assert.equal(prepareNewOT(makeOT({ codigo: 'OT-N1', estado: 'Cerrada' }), supervisor).ok, false);
  assert.equal(prepareNewOT(makeOT({ codigo: 'OT-N1', estado: 'Nueva' }), supervisor).ok, true);
});

// ---------------- API real ----------------

async function startApi() {
  const db = openDb(':memory:');
  repo.seedIfEmpty(db, true);
  createUser(db, { username: 'vleon', role: 'TECNICO_OM', displayName: 'Víctor León', password: 'clave-tecnico-1' });
  createUser(db, { username: 'jefe', role: 'JEFE_OM', displayName: 'Jefe Prueba', password: 'clave-jefe-1234' });
  db.exec('UPDATE users SET must_change_password = 0');
  const app = express();
  app.use(express.json());
  app.use(sessionMiddleware(db));
  app.use('/api', createApiRouter(db));
  const server = app.listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  return { db, server, base };
}

async function login(base: string, username: string, password: string) {
  const r = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-ORBI-Request': '1' },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(r.status, 200);
  const cookie = r.headers.get('set-cookie')!.split(';')[0];
  return (p: string, init: RequestInit = {}) => fetch(`${base}${p}`, {
    ...init, headers: { 'Content-Type': 'application/json', 'X-ORBI-Request': '1', Cookie: cookie, ...(init.headers || {}) },
  });
}

test('API: sin sesión no hay datos; sin cabecera de seguridad se rechaza', async () => {
  const { server, base } = await startApi();
  try {
    assert.equal((await fetch(`${base}/ots`)).status, 401);
    const r = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(r.status, 403);
    const bad = await fetch(`${base}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-ORBI-Request': '1' },
      body: JSON.stringify({ username: 'vleon', password: 'incorrecta-xx' }),
    });
    assert.equal(bad.status, 401);
  } finally { server.close(); }
});

test('API: el técnico ve solo sus OTs; el jefe ve todas', async () => {
  const { server, base } = await startApi();
  try {
    const tech = await login(base, 'vleon', 'clave-tecnico-1');
    const jefe = await login(base, 'jefe', 'clave-jefe-1234');
    const techOts = (await (await tech('/ots')).json()).ots as OT[];
    const allOts = (await (await jefe('/ots')).json()).ots as OT[];
    assert.ok(techOts.length > 0 && techOts.length < allOts.length);
    assert.ok(techOts.every(o => /v[ií]ctor le[oó]n/i.test(`${o.responsable} ${o.tecnicoAsignado ?? ''}`)));
    assert.ok(allOts.every(o => typeof o._version === 'number'));
  } finally { server.close(); }
});

test('API: un cambio del técnico lo ve el jefe; el historial registra al usuario real', async () => {
  const { server, base } = await startApi();
  try {
    const tech = await login(base, 'vleon', 'clave-tecnico-1');
    const jefe = await login(base, 'jefe', 'clave-jefe-1234');
    const ot = ((await (await tech('/ots')).json()).ots as OT[]).find(o => o.codigo === 'OT-26-29222')!;
    const r = await tech(`/ots/${ot.codigo}`, {
      method: 'PATCH', body: JSON.stringify({ baseVersion: ot._version, changes: { observaciones: 'desde el teléfono' } }),
    });
    assert.equal(r.status, 200);
    const seen = ((await (await jefe('/ots')).json()).ots as OT[]).find(o => o.codigo === ot.codigo)!;
    assert.equal(seen.observaciones, 'desde el teléfono');
    assert.equal(seen._version, (ot._version ?? 0) + 1);
  } finally { server.close(); }
});

test('API: foto real — subir, leer y rechazar lo que no es imagen', async () => {
  const { server, base } = await startApi();
  try {
    const tech = await login(base, 'vleon', 'clave-tecnico-1');
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
    const up = await tech('/ots/OT-26-29222/files', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: jpeg });
    assert.equal(up.status, 201);
    const { url } = await up.json();
    const got = await tech(url.replace('/api', ''));
    assert.equal(got.status, 200);
    assert.equal(got.headers.get('content-type'), 'image/jpeg');
    const fake = await tech('/ots/OT-26-29222/files', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: Buffer.from('<script>') });
    assert.equal(fake.status, 400);
  } finally { server.close(); }
});

test('API: colección compartida con control de versión', async () => {
  const { server, base } = await startApi();
  try {
    const tech = await login(base, 'vleon', 'clave-tecnico-1');
    const cols = (await (await tech('/collections')).json()).collections;
    const inv = cols['orbi_om_db_inventory_v1'];
    assert.ok(Array.isArray(inv.data));
    const ok = await tech('/collections/orbi_om_db_inventory_v1', { method: 'PUT', body: JSON.stringify({ baseVersion: inv.version, data: inv.data }) });
    assert.equal(ok.status, 200);
    const stale = await tech('/collections/orbi_om_db_inventory_v1', { method: 'PUT', body: JSON.stringify({ baseVersion: inv.version, data: [] }) });
    assert.equal(stale.status, 409);
    const forbidden = await tech('/collections/orbi_om_db_plantas', { method: 'PUT', body: JSON.stringify({ baseVersion: 1, data: [] }) });
    assert.equal(forbidden.status, 403);
  } finally { server.close(); }
});

// ---------------- Correcciones de la revisión de seguridad ----------------

test('técnico: lista blanca de campos y sin aprobaciones', () => {
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  assert.equal(applyOTPatch(s0, { baseVersion: 1, changes: { costoTotal: 1 } as Partial<OT> }, tecnico, noFiles).ok, false);
  assert.equal(applyOTPatch(s0, { baseVersion: 1, changes: { hhReales: 2, diagnosticoFinalTerreno: 'ok' } }, tecnico, noFiles).ok, true);
  assert.equal(applyOTPatch(s0, { baseVersion: 1, changes: { approvals: [{ rol: 'TECNICO_OM', nombre: 'x', fecha: 'x' }] } }, tecnico, noFiles).ok, false);
});

test('técnico no puede aprobar evidencias ni borrar una aprobada', () => {
  const base = { evidenceId: 'e1', otId: 'OT-T1', type: 'after', label: 'x', description: '', simulatedFileName: 'x.jpg', uploadedBy: '', uploadedAt: '', fileId: 'f1' } as const;
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  const yes = (id: string) => id === 'f1';
  assert.equal(applyOTPatch(s0, { baseVersion: 1, changes: { evidencePack: [{ ...base, status: 'Aprobada' }] } }, tecnico, yes).ok, false);
  const s1: StoredOT = { ot: makeOT({ evidencePack: [{ ...base, status: 'Aprobada' }] }), version: 1, fieldVersions: {} };
  assert.equal(applyOTPatch(s1, { baseVersion: 1, changes: { evidencePack: [] } }, tecnico, yes).ok, false);
  assert.equal(applyOTPatch(s1, { baseVersion: 1, changes: { evidencePack: [] } }, supervisor, yes).ok, true);
});

test('formato inválido en listas devuelve error y no falla el servidor', () => {
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  const r = applyOTPatch(s0, { baseVersion: 1, changes: { approvals: [null] as any } }, supervisor, noFiles);
  assert.equal(r.ok, false);
});

test('fotos subidas a la vez por dos personas se combinan', () => {
  const ev = (id: string) => ({ evidenceId: id, otId: 'OT-T1', type: 'after', label: id, description: '', simulatedFileName: '', uploadedBy: '', uploadedAt: '', status: 'Cargada', fileId: id }) as const;
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  const a = applyOTPatch(s0, { baseVersion: 1, changes: { evidencePack: [ev('f1')] } }, supervisor, () => true);
  if (!a.ok) throw new Error('a');
  const b = applyOTPatch(a.stored, { baseVersion: 1, changes: { evidencePack: [ev('f2')] } }, tecnico, () => true);
  if (b.ok === false) throw new Error(b.error);
  assert.deepEqual(b.stored.ot.evidencePack?.map(e => e.evidenceId).sort(), ['f1', 'f2']);
});

test('API: técnico solo agrega escalamientos (no puede cerrarlos) y el cliente solo ve plantas', async () => {
  const { db, server, base } = await startApi();
  try {
    createUser(db, { username: 'cliente', role: 'LECTURA_CLIENTE', displayName: 'Cliente', password: 'clave-cliente-1' });
    db.exec('UPDATE users SET must_change_password = 0');
    const tech = await login(base, 'vleon', 'clave-tecnico-1');
    const cols = (await (await tech('/collections')).json()).collections;
    const esc = cols['orbi_om_db_escalamientos_v1'];
    const resolved = esc.data.map((e: any) => ({ ...e, estado: 'Resuelto' }));
    const r1 = await tech('/collections/orbi_om_db_escalamientos_v1', { method: 'PUT', body: JSON.stringify({ baseVersion: esc.version, data: resolved }) });
    assert.equal(r1.status, 403);
    const added = [{ id: 'ESC-NEW', estado: 'En revisión', criticidad: 'Media' }, ...esc.data];
    const r2 = await tech('/collections/orbi_om_db_escalamientos_v1', { method: 'PUT', body: JSON.stringify({ baseVersion: esc.version, data: added }) });
    assert.equal(r2.status, 200);
    const cliente = await login(base, 'cliente', 'clave-cliente-1');
    const visible = Object.keys((await (await cliente('/collections')).json()).collections);
    assert.deepEqual(visible, ['orbi_om_db_plantas']);
    assert.deepEqual((await (await tech('/audit')).json()).events, []);
  } finally { server.close(); }
});

test('API: espacios en el usuario no evitan el límite de intentos', async () => {
  const { server, base } = await startApi();
  try {
    let last = 0;
    for (let i = 0; i < 10; i++) {
      const r = await fetch(`${base}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-ORBI-Request': '1' },
        body: JSON.stringify({ username: 'vleon' + ' '.repeat(i), password: 'mala-clave-123' }),
      });
      last = r.status;
    }
    assert.equal(last, 429);
  } finally { server.close(); }
});

// ---------------- Fase 2 ----------------

test('HH por líneas: el total se calcula en el servidor y el técnico solo agrega sus propias líneas', () => {
  const linea = (id: string, tecnico: string, horas: number) => ({ id, tecnico, fecha: '2026-11-19', horaInicio: '08:00', horaFin: '12:00', horas });
  const s0: StoredOT = { ot: makeOT(), version: 1, fieldVersions: {} };
  const a = applyOTPatch(s0, { baseVersion: 1, changes: { laborLines: [linea('l1', 'Victor Leon', 4)], hhReales: 99 } }, tecnico, noFiles);
  if (a.ok === false) throw new Error(a.error);
  assert.equal(a.stored.ot.hhReales, 4);
  const otro = applyOTPatch(a.stored, { baseVersion: 2, changes: { laborLines: [linea('l1', 'Victor Leon', 4), linea('l2', 'Otro Técnico', 3)] } }, tecnico, noFiles);
  assert.equal(otro.ok, false);
  const editar = applyOTPatch(a.stored, { baseVersion: 2, changes: { laborLines: [linea('l1', 'Victor Leon', 8)] } }, tecnico, noFiles);
  assert.equal(editar.ok, false);
  const sup = applyOTPatch(a.stored, { baseVersion: 2, changes: { laborLines: [linea('l1', 'Victor Leon', 8)] } }, supervisor, noFiles);
  assert.equal(sup.ok && sup.stored.ot.hhReales, 8);
});

test('API: planificación genera OTs preventivas una sola vez; un técnico no puede', async () => {
  const { server, base } = await startApi();
  try {
    const jefe = await login(base, 'jefe', 'clave-jefe-1234');
    const tech = await login(base, 'vleon', 'clave-tecnico-1');
    assert.equal((await tech('/pm/generate', { method: 'POST' })).status, 403);
    const first = await (await jefe('/pm/generate', { method: 'POST' })).json();
    const second = await (await jefe('/pm/generate', { method: 'POST' })).json();
    assert.equal(second.creadas.length, 0);
    const ots = (await (await jefe('/ots')).json()).ots as OT[];
    for (const code of first.creadas) assert.ok(ots.some(o => o.codigo === code && o.pmPlanId));
  } finally { server.close(); }
});

test('historial de cambios: se combina sin conflictos ni duplicados', () => {
  const s0: StoredOT = { ot: makeOT({ historialCambios: [{ fecha: 'a', usuario: 'x', accion: 'Llegada', detalle: 'ok' }] }), version: 1, fieldVersions: {} };
  // Otro usuario agrega una entrada (versión 2)
  const a = applyOTPatch(s0, { baseVersion: 1, changes: { historialCambios: [...s0.ot.historialCambios!, { fecha: 'b', usuario: 'y', accion: 'Nota', detalle: 'n1' }] } }, supervisor, noFiles);
  if (a.ok === false) throw new Error(a.error);
  // El técnico, basado en la versión 1, agrega otra entrada y reenvía la existente
  const b = applyOTPatch(a.stored, { baseVersion: 1, changes: { historialCambios: [...s0.ot.historialCambios!, { fecha: 'c', usuario: 'z', accion: 'Checklist', detalle: 'c1' }] } }, tecnico, noFiles);
  if (b.ok === false) throw new Error(b.error);
  assert.deepEqual(b.conflicts, []);
  assert.deepEqual(b.stored.ot.historialCambios?.map(h => h.accion), ['Llegada', 'Nota', 'Checklist']);
  assert.equal(b.stored.ot.historialCambios?.[2].usuario, 'Victor Leon');
});

test('HH de dos técnicos en la misma OT al mismo tiempo: no se pierden', () => {
  const linea = (id: string, tecnico: string) => ({ id, tecnico, fecha: '2026-11-19', horaInicio: '08:00', horaFin: '12:00', horas: 4 });
  const otro = { displayName: 'Rodrigo Cisterna', role: 'TECNICO_OM' as const };
  const s0: StoredOT = { ot: makeOT({ tecnicoAsignado: 'Rodrigo Cisterna' }), version: 1, fieldVersions: {} };
  const a = applyOTPatch(s0, { baseVersion: 1, changes: { laborLines: [linea('a', 'Victor Leon')] } }, tecnico, noFiles);
  if (a.ok === false) throw new Error(a.error);
  const b = applyOTPatch(a.stored, { baseVersion: 1, changes: { laborLines: [linea('b', 'Rodrigo Cisterna')] } }, otro, noFiles);
  if (b.ok === false) throw new Error(b.error);
  assert.deepEqual(b.stored.ot.laborLines?.map(l => l.id).sort(), ['a', 'b']);
  assert.equal(b.stored.ot.hhReales, 8);
});

// ---------------- Fase 3 ----------------

test('foto de checklist: debe existir en el servidor', () => {
  const s0: StoredOT = { ot: makeOT({ checklistExecution: [{ item: 'A', completado: false }] }), version: 1, fieldVersions: {} };
  const conFoto = [{ item: 'A', completado: true, fotos: [{ fileId: 'f9', url: '/api/files/f9' }] }];
  assert.equal(applyOTPatch(s0, { baseVersion: 1, changes: { checklistExecution: conFoto } }, tecnico, noFiles).ok, false);
  assert.equal(applyOTPatch(s0, { baseVersion: 1, changes: { checklistExecution: conFoto } }, tecnico, id => id === 'f9').ok, true);
});

test('cola sin señal: reemplazo de identificadores provisorios de fotos', async () => {
  const { replacePlaceholders } = await import('../src/data/photoQueue');
  const local = 'local-1234';
  const text = JSON.stringify({ fileId: local, fileUrl: `pending:${local}`, otra: 'local-9999' });
  const out = JSON.parse(replacePlaceholders(text, new Map([[local, { id: 'abc', url: '/api/files/abc' }]])));
  assert.deepEqual(out, { fileId: 'abc', fileUrl: '/api/files/abc', otra: 'local-9999' });
});

test('cola sin señal: una foto perdida se quita del cambio y el resto se envía', async () => {
  const { stripDeadPhotoRefs } = await import('../src/data/photoQueue');
  const op = {
    changes: {
      diagnosticoFinalTerreno: 'ok',
      evidencePack: [{ evidenceId: 'e1', fileId: 'local-muerta' }, { evidenceId: 'e2', fileId: 'local-viva' }, { evidenceId: 'e3', fileId: 'abc' }],
      checklistExecution: [{ item: 'A', fotos: [{ fileId: 'local-muerta', url: 'pending:local-muerta' }] }],
    },
  };
  const out = stripDeadPhotoRefs(op, new Set(['local-viva']));
  assert.deepEqual(out.changes.evidencePack.map((e: any) => e.evidenceId), ['e2', 'e3']);
  assert.deepEqual(out.changes.checklistExecution[0].fotos, []);
  assert.equal(out.changes.diagnosticoFinalTerreno, 'ok');
});
