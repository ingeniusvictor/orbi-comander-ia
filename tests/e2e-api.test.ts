/**
 * MÓDULO 17A — Fase 4: prueba de punta a punta del piloto contra el servidor real (API + SQLite).
 *
 * Recorre los dos casos de referencia de Cantillana con cuatro usuarios reales:
 *   1. Preventivo: el plan anual de inversores genera la OT → el técnico la ejecuta (llegada, AST,
 *      checklist con valores y fotos por pregunta, HH, evidencia) → Supervisor → Coordinador → Jefe O&M cierra.
 *   2. Correctivo: el supervisor crea la OT sobre el inversor C2 → el técnico la deja en espera de repuesto,
 *      consume el fusible de potencia desde el inventario de la planta y repara → el cierre exige la
 *      codificación de falla → se cierra.
 * Además comprueba que las reglas no se puedan saltar (un técnico no cierra, no toca OTs ajenas, etc.).
 *
 * Ejecutar: npx tsx --test tests/e2e-api.test.ts  (incluido en `npm test`)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import express from 'express';
import type { OT, OMInventoryItem, OMInventoryMovement } from '../src/types';

process.env.ORBI_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'orbi-e2e-'));
test.after(() => fs.rmSync(process.env.ORBI_DATA_DIR!, { recursive: true, force: true }));

const { openDb } = await import('../server/db');
const { createUser, sessionMiddleware } = await import('../server/auth');
const { createApiRouter } = await import('../server/routes');
const repo = await import('../server/repo');
const { runPmGeneration } = await import('../server/pm');

// ---------------- Entorno ----------------

const db = openDb(':memory:');
repo.seedIfEmpty(db, true);
const USERS = {
  tecnico: { username: 'vleon', role: 'TECNICO_OM', displayName: 'Víctor León', password: 'e2e-tecnico-1' },
  supervisor: { username: 'mvaldes', role: 'SUPERVISOR_TERRENO', displayName: 'Mauricio Valdés', password: 'e2e-supervisor-1' },
  coordinador: { username: 'rgarces', role: 'COORDINADOR_OM', displayName: 'Rodolfo Garcés', password: 'e2e-coordinador-1' },
  jefe: { username: 'fsoto', role: 'JEFE_OM', displayName: 'Felipe Soto', password: 'e2e-jefe-12345' },
} as const;
for (const u of Object.values(USERS)) createUser(db, u);
db.exec('UPDATE users SET must_change_password = 0');

const app = express();
app.use(express.json());
app.use(sessionMiddleware(db));
app.use('/api', createApiRouter(db));
const server = app.listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
test.after(() => server.close());

type Client = {
  name: string;
  get: <T = any>(p: string) => Promise<T>;
  send: (p: string, method: string, body?: unknown) => Promise<{ status: number; body: any }>;
  ot: (codigo: string) => Promise<OT>;
  patch: (ot: OT, changes: Partial<OT>, transition?: { to: OT['estado']; comentario?: string }) => Promise<{ status: number; body: any }>;
  photo: (codigo: string) => Promise<{ id: string; url: string }>;
};

async function login(u: { username: string; password: string; displayName: string }): Promise<Client> {
  const r = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-ORBI-Request': '1' },
    body: JSON.stringify({ username: u.username, password: u.password }),
  });
  assert.equal(r.status, 200, `inicio de sesión de ${u.username}`);
  const cookie = r.headers.get('set-cookie')!.split(';')[0];
  const headers = { 'Content-Type': 'application/json', 'X-ORBI-Request': '1', Cookie: cookie };
  const send = async (p: string, method: string, body?: unknown) => {
    const res = await fetch(`${base}${p}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  const get = async (p: string) => (await send(p, 'GET')).body;
  const ot = async (codigo: string) => ((await get('/ots')).ots as OT[]).find(o => o.codigo === codigo)!;
  return {
    name: u.displayName,
    get, send, ot,
    patch: (o, changes, transition) => send(`/ots/${encodeURIComponent(o.codigo)}`, 'PATCH', { baseVersion: o._version, changes, transition }),
    photo: async (codigo) => {
      // JPEG mínimo válido (cabecera FFD8FF)
      const res = await fetch(`${base}/ots/${encodeURIComponent(codigo)}/files`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'image/jpeg' }, body: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]),
      });
      assert.equal(res.status, 201, 'subida de foto');
      return res.json();
    },
  };
}

const tecnico = await login(USERS.tecnico);
const supervisor = await login(USERS.supervisor);
const coordinador = await login(USERS.coordinador);
const jefe = await login(USERS.jefe);

function ok(r: { status: number; body: any }, paso: string) {
  assert.equal(r.status, 200, `${paso}: ${r.body?.error ?? ''}`);
  return r.body.ot as OT;
}

// ---------------- 1. Preventivo: MP anual de inversores ----------------

test('Preventivo Cantillana: del plan anual a la OT cerrada', async (t) => {
  let codigo = '';

  await t.test('el plan anual genera la OT 30 días antes de su fecha (una sola vez)', () => {
    const r1 = runPmGeneration(db, '2027-08-31');
    // También vence el plan mensual de inspección; el anual genera la OT del 30-09-2027
    assert.ok(r1.creadas.includes('PM-4736-20270930'), r1.creadas.join(', '));
    assert.deepEqual(runPmGeneration(db, '2027-08-31').creadas, [], 'no duplica');
    codigo = 'PM-4736-20270930';
  });

  await t.test('el técnico ve la OT asignada, con su checklist de plantilla', async () => {
    const ot = await tecnico.ot(codigo);
    assert.equal(ot.estado, 'Programada');
    assert.equal(ot.tipo, 'Preventiva');
    assert.equal(ot.responsable, 'Víctor León');
    assert.equal(ot.checklistExecution?.length, 8);
    assert.ok(ot.checklistExecution?.every(c => c.templateId === 'TPL-INV-A1'));
  });

  await t.test('un técnico no puede cerrar ni saltarse la ejecución', async () => {
    const ot = await tecnico.ot(codigo);
    const r = await tecnico.patch(ot, {}, { to: 'Cerrada' });
    assert.notEqual(r.status, 200);
  });

  await t.test('llegada a planta, AST y comienzo de ejecución', async () => {
    let ot = ok(await tecnico.patch(await tecnico.ot(codigo), { llegadaConfirmada: true, horaLlegadaSimulada: '08:10' }, { to: 'En terreno', comentario: 'Llegada a Cantillana' }), 'llegada');
    ot = ok(await tecnico.patch(ot, { astFirmado: true, firmaEjecutorSimulada: 'Víctor León' }, { to: 'En ejecución', comentario: 'AST firmada' }), 'AST');
    assert.equal(ot.estado, 'En ejecución');
  });

  await t.test('no puede marcarse ejecutada con el checklist incompleto', async () => {
    const r = await tecnico.patch(await tecnico.ot(codigo), { hhReales: 2 }, { to: 'Finalizada' });
    assert.equal(r.status, 422);
    assert.match(r.body.error, /checklist/i);
  });

  await t.test('checklist completo con valores, foto por pregunta, HH de dos tramos y evidencia', async () => {
    const ot = await tecnico.ot(codigo);
    const checklist = [];
    for (const item of ot.checklistExecution!) {
      const it: any = { ...item, completado: true };
      if (it.tipo === 'numero') it.valor = it.unidad === '°C' ? '41' : '850';
      if (it.tipo === 'texto') it.valor = 'Sin observaciones';
      if (it.evidenciaRequerida) {
        const f = await tecnico.photo(codigo);
        it.fotos = [{ fileId: f.id, url: f.url }];
      }
      checklist.push(it);
    }
    const ev = await tecnico.photo(codigo);
    const updated = ok(await tecnico.patch(ot, {
      checklistExecution: checklist,
      laborLines: [
        { id: 'hh-1', tecnico: 'Víctor León', fecha: '2027-09-30', horaInicio: '08:30', horaFin: '13:00', horas: 4.5, actividad: 'Estaciones 1 y 2' },
        { id: 'hh-2', tecnico: 'Víctor León', fecha: '2027-09-30', horaInicio: '14:00', horaFin: '17:30', horas: 3.5, actividad: 'Estación 3' },
      ],
      evidencePack: [{ evidenceId: 'ev-1', otId: codigo, type: 'after', label: 'Después — limpieza INV-01', description: '', simulatedFileName: 'inv01.jpg', uploadedBy: 'Víctor León', uploadedAt: '2027-09-30 17:00', status: 'Cargada', fileId: ev.id, fileUrl: ev.url }],
      diagnosticoFinalTerreno: '39 inversores revisados, filtros limpiados, sin alarmas.',
    }), 'checklist');
    assert.equal(updated.hhReales, 8, 'el servidor suma las HH');
  });

  await t.test('ejecutada en terreno (FDCOMP) y revisión en cadena hasta el cierre', async () => {
    let ot = ok(await tecnico.patch(await tecnico.ot(codigo), { propuestaCierreTerreno: true }, { to: 'Finalizada', comentario: 'Trabajo terminado' }), 'ejecutada');
    assert.equal(ot.avance, 100);

    // El técnico no puede firmar como supervisor
    const falsa = await tecnico.patch(ot, { approvals: [{ rol: 'Supervisor', nombre: 'x', fecha: 'x' }] });
    assert.equal(falsa.status, 403);

    ot = await supervisor.ot(codigo);
    ot = ok(await supervisor.patch(ot, { approvals: [{ rol: 'Supervisor', nombre: '', fecha: '' }] }, { to: 'En revisión Coordinador', comentario: 'Revisado en terreno' }), 'supervisor');
    ot = ok(await coordinador.patch(ot, { approvals: [...ot.approvals!, { rol: 'Coordinador', nombre: '', fecha: '' }] }, { to: 'Pendiente aprobación Jefe O&M', comentario: 'Documentación conforme' }), 'coordinador');
    ot = ok(await jefe.patch(ot, { approvals: [...ot.approvals!, { rol: 'JefeOM', nombre: '', fecha: '' }] }, { to: 'Cerrada', comentario: 'Cierre final' }), 'jefe');

    assert.equal(ot.estado, 'Cerrada');
    assert.deepEqual(ot.approvals!.map(a => a.nombre), ['Mauricio Valdés', 'Rodolfo Garcés', 'Felipe Soto'], 'firmas con el usuario real');
    const pasos = ot.lifecycleHistory!.map(h => `${h.estadoNuevo} · ${h.usuario}`);
    assert.deepEqual(pasos.slice(-6), [
      'En terreno · Víctor León',
      'En ejecución · Víctor León',
      'Finalizada · Víctor León',
      'En revisión Coordinador · Mauricio Valdés',
      'Pendiente aprobación Jefe O&M · Rodolfo Garcés',
      'Cerrada · Felipe Soto',
    ]);
  });

  await t.test('una OT cerrada solo la reabre el Jefe O&M', async () => {
    const ot = await supervisor.ot(codigo);
    assert.notEqual((await supervisor.patch(ot, {}, { to: 'Reabierta' })).status, 200);
  });
});

// ---------------- 2. Correctivo: tarjeta de control del inversor central C2 ----------------

test('Correctivo Cantillana: falla del inversor C2, repuesto y cierre codificado', async (t) => {
  const codigo = 'OT-E2E-C2-001';

  await t.test('el técnico no puede crear OTs; el supervisor sí', async () => {
    const nueva = {
      codigo, plantaId: 'ORBI-PV-058', plantaNombre: 'Cantillana', activo: 'Inversor Central C2', activoId: 'CANT-C2',
      tipo: 'Correctiva', prioridad: 'Alta', criticidad: 'Alta', responsable: 'Víctor León', supervisor: 'Mauricio Valdés',
      fechaInicio: '2027-10-04', fechaLimite: '2027-10-06', estado: 'Programada', avance: 0, hhEstimadas: 6, hhReales: 0,
      observaciones: 'Inversor C2 fuera de servicio. Alarma de tarjeta de control.', origen: 'Centro de Control',
      impacto: 'Alto', riesgoDisponibilidad: 'Riesgo alto', requiereEvidencia: true, requiereAST: false,
    } as unknown as OT;
    assert.equal((await tecnico.send('/ots', 'POST', { ot: nueva })).status, 403);
    const r = await supervisor.send('/ots', 'POST', { ot: nueva });
    assert.equal(r.status, 201);
    assert.equal(r.body.ot.lifecycleHistory[0].usuario, 'Mauricio Valdés');
  });

  await t.test('en terreno se detecta que falta el repuesto: espera con motivo codificado', async () => {
    let ot = ok(await tecnico.patch(await tecnico.ot(codigo), { llegadaConfirmada: true }, { to: 'En terreno' }), 'llegada');
    assert.notEqual((await tecnico.patch(ot, {}, { to: 'Bloqueada' })).status, 200, 'sin motivo no entra en espera');
    ot = ok(await tecnico.patch(ot, {}, { to: 'En espera de repuesto', comentario: 'Tarjeta no está en el vehículo' }), 'espera');
    assert.equal(ot.motivoEsperaCodigo, 'REPUESTO');
  });

  await t.test('consumo del fusible de potencia del inversor central desde el inventario de Cantillana (doble registro)', async () => {
    const cols = (await tecnico.get('/collections')).collections;
    const inv = cols['orbi_om_db_inventory_v1'] as { data: OMInventoryItem[]; version: number };
    const movs = cols['orbi_om_db_inventory_movements_v1'] as { data: OMInventoryMovement[]; version: number };
    // El caso de referencia admite tarjeta de control o fusible de potencia; la bodega demo de Cantillana tiene el fusible
    const tarjeta = inv.data.find(i => /cantillana/i.test(i.plantaNombre) && /tarjeta|fusible de inversor central/i.test(i.descripcion));
    assert.ok(tarjeta, 'hay repuesto de potencia del inversor central en la bodega de Cantillana');
    const antes = tarjeta!.stockActual;
    assert.ok(antes > 0);
    const nuevoInv = inv.data.map(i => (i.id === tarjeta!.id ? { ...i, stockActual: antes - 1 } : i));
    assert.equal((await tecnico.send('/collections/orbi_om_db_inventory_v1', 'PUT', { baseVersion: inv.version, data: nuevoInv })).status, 200);
    const mov: OMInventoryMovement = {
      id: 'MOV-E2E-1', itemCodigo: tarjeta!.codigo, itemDescripcion: tarjeta!.descripcion, plantaId: tarjeta!.plantaId, plantaNombre: tarjeta!.plantaNombre,
      tipoMovimiento: 'Consumo por OT', otAsociada: codigo, tecnico: 'Víctor León', cantidad: 1, stockAnterior: antes, stockFinal: antes - 1,
      fecha: '2027-10-05 09:00', observacion: 'Reemplazo de fusible de potencia del inversor C2',
    };
    assert.equal((await tecnico.send('/collections/orbi_om_db_inventory_movements_v1', 'PUT', { baseVersion: movs.version, data: [mov, ...movs.data] })).status, 200);
    // Un técnico no puede borrar movimientos existentes
    const movs2 = (await tecnico.get('/collections')).collections['orbi_om_db_inventory_movements_v1'];
    assert.equal((await tecnico.send('/collections/orbi_om_db_inventory_movements_v1', 'PUT', { baseVersion: movs2.version, data: [] })).status, 403);
    // El supervisor ve el stock descontado
    const visto = ((await supervisor.get('/collections')).collections['orbi_om_db_inventory_v1'].data as OMInventoryItem[]).find(i => i.id === tarjeta!.id)!;
    assert.equal(visto.stockActual, antes - 1);
  });

  await t.test('reparación, evidencia y HH; el cierre exige la codificación de falla', async () => {
    let ot = ok(await tecnico.patch(await tecnico.ot(codigo), { repuestos: ['Fusible de Inversor Central 250A 1000V'] }, { to: 'En ejecución', comentario: 'Llegó el repuesto' }), 'reanudar');
    const antes = await tecnico.photo(codigo);
    const despues = await tecnico.photo(codigo);
    ot = ok(await tecnico.patch(ot, {
      evidencePack: [
        { evidenceId: 'c-1', otId: codigo, type: 'before', label: 'Fusible quemado', description: '', simulatedFileName: 'a.jpg', uploadedBy: 'Víctor León', uploadedAt: '2027-10-05 09:10', status: 'Cargada', fileId: antes.id, fileUrl: antes.url },
        { evidenceId: 'c-2', otId: codigo, type: 'after', label: 'Fusible nuevo, inversor operando', description: '', simulatedFileName: 'b.jpg', uploadedBy: 'Víctor León', uploadedAt: '2027-10-05 11:40', status: 'Cargada', fileId: despues.id, fileUrl: despues.url },
      ],
      laborLines: [{ id: 'c-hh', tecnico: 'Víctor León', fecha: '2027-10-05', horaInicio: '09:00', horaFin: '12:00', horas: 3 }],
      diagnosticoFinalTerreno: 'Fusible de potencia 250A quemado. Reemplazado; inversor operando.',
    }, { to: 'Finalizada', comentario: 'Inversor C2 en servicio' }), 'ejecutada');

    const sinCodigo = await supervisor.patch(await supervisor.ot(codigo), {}, { to: 'Cerrada' });
    assert.equal(sinCodigo.status, 422);
    assert.match(sinCodigo.body.error, /codificación de falla/);

    ot = ok(await tecnico.patch(await tecnico.ot(codigo), { codigoFalla: { problema: 'INV-OFF', causa: 'FUSIBLE', accion: 'REEMPLAZO' } }), 'codificación');
    ot = ok(await supervisor.patch(await supervisor.ot(codigo), {}, { to: 'Cerrada', comentario: 'Correctivo cerrado' }), 'cierre');
    assert.equal(ot.estado, 'Cerrada');
    assert.equal(ot.hhReales, 3);
    assert.deepEqual(ot.codigoFalla, { problema: 'INV-OFF', causa: 'FUSIBLE', accion: 'REEMPLAZO' });
  });

  await t.test('la auditoría registra cada acción con el usuario real', async () => {
    db.prepare(`INSERT INTO audit_log (at, user_id, usuario, rol, accion, modulo, ot_codigo, comentario, criticidad)
                VALUES (?, 0, 'x', 'x', 'marca', 'e2e', ?, '', 'Baja')`).run(new Date().toISOString(), codigo);
    const eventos = (await jefe.get('/audit')).events as { usuarioRol: string; accion: string }[];
    assert.ok(eventos.some(e => e.accion === 'Inicio de sesión' && e.usuarioRol.startsWith('Víctor León')));
    assert.deepEqual((await tecnico.get('/audit')).events, [], 'un técnico no ve la auditoría');
  });
});

test('Aislamiento: el técnico no ve ni modifica OTs de otros', async () => {
  const ajena = (await jefe.get('/ots')).ots.find((o: OT) => !/v[ií]ctor le[oó]n/i.test(`${o.responsable} ${o.tecnicoAsignado ?? ''}`));
  assert.ok(ajena, 'hay OTs de otros técnicos');
  assert.equal(await tecnico.ot(ajena.codigo), undefined);
  assert.equal((await tecnico.patch(ajena, { observaciones: 'x' })).status, 404);
});
