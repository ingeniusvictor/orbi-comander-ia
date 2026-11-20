/** MÓDULO 17B — reglas del correctivo de seguimiento (funciones puras). */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { OT } from '../src/types';
import { buildFollowUpOT, canCreateFollowUpFrom, followUpsOf, newFollowUpCode, validateFollowUpInput } from '../src/domain/seguimiento';

const origen = {
  codigo: '26-29221', plantaId: 'ORBI-PV-010', plantaNombre: 'Cantillana', activo: 'Inversores INV-01 a INV-39', activoId: 'A-1',
  tipo: 'Preventiva', prioridad: 'Media', estado: 'En ejecución', coordinador: 'Rodolfo Garcés', supervisor: 'Mauricio Valdés',
} as unknown as OT;

test('el correctivo copia planta y activo, queda esperando aprobación y sin técnico', () => {
  const ot = buildFollowUpOT(origen, { descripcion: 'Conector quemado', prioridad: 'Alta', item: 'Conectores' }, 'SEG-1', 'Víctor León', '2026-11-20');
  assert.equal(ot.tipo, 'Correctiva');
  assert.equal(ot.estado, 'Nueva');
  assert.equal(ot.plantaId, 'ORBI-PV-010');
  assert.equal(ot.activoId, 'A-1');
  assert.equal(ot.responsable, '');
  assert.equal(ot.otOrigen, '26-29221');
  assert.equal(ot.fechaLimite, '2026-11-23'); // prioridad Alta: 3 días
  assert.match(ot.observaciones, /26-29221: Conectores/);
});

test('no se crea desde OTs cerradas o canceladas', () => {
  assert.equal(canCreateFollowUpFrom({ ...origen, estado: 'Cerrada' }), false);
  assert.equal(canCreateFollowUpFrom({ ...origen, estado: 'Cancelada' } as OT), false);
  assert.equal(canCreateFollowUpFrom({ ...origen, estado: 'Finalizada' }), true);
});

test('validación de datos del hallazgo', () => {
  assert.match(validateFollowUpInput({ descripcion: 'ok', prioridad: 'Media' })!, /5 caracteres/);
  assert.match(validateFollowUpInput({ descripcion: 'Falla real', prioridad: 'Urgente' as never })!, /prioridad/);
  assert.equal(validateFollowUpInput({ descripcion: 'Falla real', prioridad: 'Baja' }), null);
});

test('códigos únicos con formato válido para el servidor', () => {
  const a = newFollowUpCode(1_700_000_000_000, 0.1);
  const b = newFollowUpCode(1_700_000_000_000, 0.9);
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9._-]{3,40}$/);
});

test('seguimientos: los registrados por el servidor y los creados en el equipo, sin repetir', () => {
  const local = { codigo: 'SEG-B', otOrigen: '26-29221' } as OT;
  assert.deepEqual(followUpsOf({ ...origen, otsSeguimiento: ['SEG-A', 'SEG-B'] }, [local]), ['SEG-A', 'SEG-B']);
});

// ---------------- 17B punto 2: aprobación y cobro ----------------
import { transitionOT } from '../src/domain/otStateMachine';
import { diasEsperando, pendientesDeAprobacion } from '../src/domain/aprobacion';

const porAprobar = {
  ...origen, codigo: 'SEG-X', tipo: 'Correctiva', estado: 'Nueva', responsable: '',
  lifecycleHistory: [{ estadoNuevo: 'Nueva', fecha: '2026-10-01T12:00:00.000Z', usuario: 'Víctor León' }],
} as unknown as OT;

test('aprobar exige rol de coordinación/planificación/jefatura y un técnico asignado', () => {
  const ahora = new Date('2026-11-20T12:00:00Z');
  assert.equal(transitionOT(porAprobar, 'Asignada', { usuario: 'Sup', rol: 'SUPERVISOR_TERRENO', ahora }, { responsable: 'Víctor León' }).ok, false);
  assert.equal(transitionOT(porAprobar, 'Asignada', { usuario: 'Coord', rol: 'COORDINADOR_OM', ahora }).ok, false);
  const r = transitionOT(porAprobar, 'Asignada', { usuario: 'Coord', rol: 'COORDINADOR_OM', ahora }, { responsable: 'Víctor León' });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.ot.aprobadaPor, 'Coord');
    assert.equal(r.ot.fechaAprobacion, ahora.toISOString());
  }
  // Rechazar (cancelar) sigue las reglas de cancelación, no las de aprobación
  assert.equal(transitionOT(porAprobar, 'Cancelada', { usuario: 'Coord', rol: 'COORDINADOR_OM', ahora }).ok, true);
});

test('días esperando aprobación y orden de la bandeja (más antiguas primero)', () => {
  const ahora = new Date('2026-11-20T12:00:00Z');
  assert.equal(diasEsperando(porAprobar, ahora), 50);
  const reciente = { ...porAprobar, codigo: 'SEG-Y', lifecycleHistory: [{ estadoNuevo: 'Nueva', fecha: '2026-11-18T12:00:00.000Z', usuario: 'x' }] } as unknown as OT;
  const lista = pendientesDeAprobacion([reciente, porAprobar, { ...origen }], ahora);
  assert.deepEqual(lista.map(p => [p.ot.codigo, p.dias]), [['SEG-X', 50], ['SEG-Y', 2]]);
});

// ---------------- 17B punto 4: cola de cierre ----------------
import { colaDeCierre, etapaPendiente, firmarEtapa, resumirCola } from '../src/domain/cierre';

const ejecutada = (o: Partial<OT>) => ({
  ...origen, codigo: 'C1', tipo: 'Inspección', estado: 'Finalizada', hhReales: 2, requiereChecklist: false, requiereEvidencia: false,
  lifecycleHistory: [{ estadoNuevo: 'Finalizada', fecha: '2026-11-10T18:00:00Z', usuario: 't' }], ...o,
}) as unknown as OT;

test('cola de cierre: días desde la ejecución, firma pendiente y meta de 3 días', () => {
  const filas = colaDeCierre([ejecutada({}), ejecutada({ codigo: 'C2', estado: 'En revisión Coordinador', lifecycleHistory: [{ estadoNuevo: 'Finalizada', fecha: '2026-11-19T10:00:00Z', usuario: 't' }] } as Partial<OT>), origen], '2026-11-20');
  assert.deepEqual(filas.map(f => [f.ot.codigo, f.dias, f.etapa]), [['C1', 10, 'Supervisor'], ['C2', 1, 'Coordinador']]);
  assert.deepEqual(resumirCola(filas), { total: 2, sobreMeta: 1, promedioDias: 5.5 });
  assert.equal(etapaPendiente(ejecutada({ estado: 'Pendiente aprobación Jefe O&M' })), 'JefeOM');
  assert.equal(etapaPendiente(ejecutada({ estado: 'En revisión HSE' })), null);
});

test('firmar etapa: avanza con la firma del rol correcto y cierra solo sin bloqueos', () => {
  const r = firmarEtapa(ejecutada({}), { usuario: 'Sup', rol: 'SUPERVISOR_TERRENO' });
  assert.equal(r.ok && r.ot.estado, 'En revisión Coordinador');
  assert.equal(r.ok && r.ot.approvals?.at(-1)?.rol, 'Supervisor');
  assert.equal(firmarEtapa(ejecutada({}), { usuario: 'Tec', rol: 'TECNICO_OM' }).ok, false);
  const paraCerrar = ejecutada({ estado: 'Pendiente aprobación Jefe O&M' });
  const cierre = firmarEtapa(paraCerrar, { usuario: 'Jefe', rol: 'JEFE_OM' });
  assert.equal(cierre.ok && cierre.ot.estado, 'Cerrada');
  // Correctiva sin codificación de falla: no se cierra
  assert.equal(firmarEtapa({ ...paraCerrar, tipo: 'Correctiva' }, { usuario: 'Jefe', rol: 'JEFE_OM' }).ok, false);
});
