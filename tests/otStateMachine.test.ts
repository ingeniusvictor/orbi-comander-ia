/**
 * MÓDULO 17A — Pruebas de la máquina de estados única de OTs.
 * Ejecutar: npx tsx --test tests/otStateMachine.test.ts  (incluido en `npm test`)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { OT } from '../src/types';
import {
  transitionOT,
  isTransitionAllowed,
  nextEstados,
  softwrenchCodeOf,
  ALL_ESTADOS,
} from '../src/domain/otStateMachine';

const AHORA = new Date('2026-11-19T12:00:00Z');
const supervisor = { usuario: 'Supervisor Prueba', rol: 'SUPERVISOR_TERRENO' as const, ahora: AHORA };
const tecnico = { usuario: 'Técnico Prueba', rol: 'TECNICO_OM' as const, ahora: AHORA };

function baseOT(overrides: Partial<OT> = {}): OT {
  return {
    codigo: 'OT-TEST-1',
    plantaId: 'ORBI-PV-001',
    plantaNombre: 'Planta Prueba',
    activo: 'Inversor 1',
    tipo: 'Correctiva',
    prioridad: 'Media',
    criticidad: 'Media',
    responsable: 'Técnico Prueba',
    fechaInicio: '2026-11-19',
    fechaLimite: '2026-11-30',
    estado: 'En ejecución',
    avance: 50,
    hhEstimadas: 4,
    hhReales: 3,
    observaciones: '',
    origen: 'Supervisor',
    impacto: 'Medio',
    riesgoDisponibilidad: 'No aplica',
    requiereEvidencia: true,
    evidencePack: [{ evidenceId: 'e1' } as any],
    requiereAST: true,
    astFirmado: true,
    checklistExecution: [{ item: 'A', completado: true, noAplica: false } as any],
    ...overrides,
  } as OT;
}

test('todos los estados ORBI tienen código SoftWrench', () => {
  for (const estado of ALL_ESTADOS) {
    assert.ok(softwrenchCodeOf(estado), `sin código: ${estado}`);
  }
});

test('flujo feliz: programada → en ejecución → finalizada → cerrada, con historial', () => {
  let ot = baseOT({ estado: 'Programada' });
  for (const [to, ctx] of [
    ['En ejecución', tecnico],
    ['Finalizada', tecnico],
    ['Cerrada', supervisor],
  ] as const) {
    const r = transitionOT(ot, to, ctx);
    assert.equal(r.ok, true, r.ok === false ? r.error : '');
    if (r.ok) ot = r.ot;
  }
  assert.equal(ot.estado, 'Cerrada');
  assert.equal(ot.avance, 100);
  assert.equal(ot.lifecycleHistory?.length, 3);
  assert.deepEqual(ot.lifecycleHistory?.map(h => h.estadoNuevo), ['En ejecución', 'Finalizada', 'Cerrada']);
  assert.equal(ot.lifecycleHistory?.[2].usuario, 'Supervisor Prueba');
  assert.equal(ot.lifecycleHistory?.[2].fecha, AHORA.toISOString());
});

test('no se puede saltar de Nueva a Cerrada', () => {
  const r = transitionOT(baseOT({ estado: 'Nueva' }), 'Cerrada', supervisor);
  assert.equal(r.ok, false);
});

test('no se puede marcar ejecutada sin HH, evidencia, checklist o AST', () => {
  const casos: Partial<OT>[] = [
    { hhReales: 0 },
    { evidencePack: [], evidencias: [], evidencia: null },
    { checklistExecution: [{ item: 'A', completado: false, noAplica: false } as any] },
    { astFirmado: false },
    { bloqueada: true },
  ];
  for (const c of casos) {
    const r = transitionOT(baseOT(c), 'Finalizada', tecnico);
    assert.equal(r.ok, false, `debió bloquear: ${JSON.stringify(c)}`);
  }
});

test('el patch se valida antes de la transición (HH cargadas en el mismo paso)', () => {
  const r = transitionOT(baseOT({ hhReales: 0 }), 'Finalizada', tecnico, { hhReales: 2 });
  assert.equal(r.ok, true);
});

test('un técnico no puede cerrar una OT', () => {
  const r = transitionOT(baseOT({ estado: 'Finalizada' }), 'Cerrada', tecnico);
  assert.equal(r.ok, false);
});

test('OT crítica requiere aprobación del Jefe O&M para cerrar', () => {
  const critica = baseOT({ estado: 'Finalizada', criticidad: 'Crítica' });
  assert.equal(transitionOT(critica, 'Cerrada', supervisor).ok, false);
  const aprobada = { ...critica, approvals: [{ rol: 'JefeOM', nombre: 'Jefe', fecha: '2026-11-19' }] };
  assert.equal(transitionOT(aprobada, 'Cerrada', supervisor).ok, true);
});

test('escalamiento crítico abierto bloquea el cierre', () => {
  const r = transitionOT(baseOT({ estado: 'Finalizada' }), 'Cerrada', {
    ...supervisor,
    escalaciones: [{ otVinculada: 'OT-TEST-1', criticidad: 'Crítica', estado: 'En revisión' }],
  });
  assert.equal(r.ok, false);
});

test('una OT cerrada solo puede reabrirse, y solo por Jefe O&M o Admin', () => {
  const cerrada = baseOT({ estado: 'Cerrada' });
  assert.deepEqual(nextEstados('Cerrada'), ['Reabierta']);
  assert.equal(transitionOT(cerrada, 'Reabierta', supervisor).ok, false);
  assert.equal(transitionOT(cerrada, 'Reabierta', { ...supervisor, rol: 'JEFE_OM' }).ok, true);
});

test('Reabierta y Devuelta no se ofrecen desde una OT en ejecución', () => {
  const opciones = nextEstados('En ejecución');
  assert.ok(!opciones.includes('Reabierta'));
  assert.ok(!opciones.includes('Devuelta a ejecución'));
  assert.ok(!opciones.includes('Cerrada'));
});

test('una OT cancelada no admite transiciones', () => {
  assert.deepEqual(nextEstados('Cancelada'), []);
});

test('devolución desde revisión a ejecución está permitida', () => {
  assert.equal(isTransitionAllowed('En revisión Coordinador', 'Devuelta a ejecución'), true);
  assert.equal(isTransitionAllowed('Finalizada', 'Devuelta a ejecución'), true);
});

test('estado desconocido es rechazado', () => {
  const r = transitionOT(baseOT(), 'Ejecutada' as any, supervisor);
  assert.equal(r.ok, false);
});

test('"En revisión" (post-ejecución) permite validar, devolver y cerrar', () => {
  assert.equal(softwrenchCodeOf('En revisión'), 'RSALOR');
  assert.equal(isTransitionAllowed('En revisión', 'En revisión Coordinador'), true);
  assert.equal(isTransitionAllowed('En revisión', 'Devuelta a ejecución'), true);
  assert.equal(transitionOT(baseOT({ estado: 'En revisión' }), 'Cerrada', supervisor).ok, true);
});

test('pasar de ejecución a revisión exige las mismas reglas que marcar ejecutada', () => {
  assert.equal(transitionOT(baseOT({ hhReales: 0 }), 'En revisión', tecnico).ok, false);
  assert.equal(transitionOT(baseOT(), 'En revisión', tecnico).ok, true);
});

test('checklist no requerido no bloquea la ejecución', () => {
  const ot = baseOT({ requiereChecklist: false, checklistExecution: [{ item: 'A', completado: false, noAplica: false } as any] });
  assert.equal(transitionOT(ot, 'Finalizada', tecnico).ok, true);
});
