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
