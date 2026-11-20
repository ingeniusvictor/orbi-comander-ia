/** MÓDULO 17B — plazos: fecha objetivo del contrato, vencidas y cumplimiento (funciones puras). */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { OT, Planta } from '../src/types';
import { plazoDe, plazosDe, resumir, agrupar, fechaEjecucion } from '../src/domain/plazos';
import { generateDuePmOTs, toleranciaDe, validatePlan, type PmPlan } from '../src/domain/cmms';

const base = { codigo: 'X', plantaId: 'P1', plantaNombre: 'Cantillana', tipo: 'Preventiva', estado: 'Programada' } as unknown as OT;
const ot = (o: Partial<OT>) => ({ ...base, ...o }) as OT;

test('activa: a tiempo, por vencer (3 días o menos) y vencida con días de atraso', () => {
  assert.equal(plazoDe(ot({ fechaObjetivoLimite: '2026-11-30' }), '2026-11-20').estado, 'a_tiempo');
  assert.equal(plazoDe(ot({ fechaObjetivoLimite: '2026-11-23' }), '2026-11-20').estado, 'por_vencer');
  const v = plazoDe(ot({ fechaObjetivoLimite: '2026-11-10' }), '2026-11-20');
  assert.equal(v.estado, 'vencida');
  assert.equal(v.atraso, 10);
});

test('la fecha objetivo del contrato manda sobre la fecha límite; sin ninguna, no hay plazo', () => {
  assert.equal(plazoDe(ot({ fechaObjetivoLimite: '2026-11-30', fechaLimite: '2026-11-01' }), '2026-11-20').estado, 'a_tiempo');
  assert.equal(plazoDe(ot({ fechaLimite: '2026-11-01' }), '2026-11-20').estado, 'vencida');
  assert.equal(plazoDe(ot({}), '2026-11-20').estado, 'sin_plazo');
  assert.equal(plazoDe(ot({ estado: 'Cancelada', fechaLimite: '2026-11-01' } as Partial<OT>), '2026-11-20').estado, 'cancelada');
});

test('ejecutada: se mide con el primer día en que quedó ejecutada, no con el cierre administrativo', () => {
  const hist = [
    { estadoNuevo: 'En ejecución', fecha: '2026-11-05T10:00:00Z', usuario: 't' },
    { estadoNuevo: 'Finalizada', fecha: '2026-11-08T18:00:00Z', usuario: 't' },
    { estadoNuevo: 'Cerrada', fecha: '2026-11-19T10:00:00Z', usuario: 'j' },
  ] as OT['lifecycleHistory'];
  const cerrada = ot({ estado: 'Cerrada', fechaObjetivoLimite: '2026-11-10', lifecycleHistory: hist });
  assert.equal(fechaEjecucion(cerrada), '2026-11-08');
  assert.equal(plazoDe(cerrada, '2026-11-20').estado, 'cumplida');
  const tarde = ot({ estado: 'Cerrada', fechaObjetivoLimite: '2026-11-06', lifecycleHistory: hist });
  assert.deepEqual([plazoDe(tarde, '2026-11-20').estado, plazoDe(tarde, '2026-11-20').atraso], ['cumplida_con_atraso', 2]);
});

test('resumen, cumplimiento y agrupación por cliente', () => {
  const plantas = [{ id: 'P1', cliente: 'Blue Tree' }, { id: 'P2', cliente: 'Eurus' }] as Planta[];
  const ots = [
    ot({ codigo: 'A', fechaObjetivoLimite: '2026-11-10' }),
    ot({ codigo: 'B', plantaId: 'P2', plantaNombre: 'Pellin', fechaObjetivoLimite: '2026-11-30' }),
    ot({ codigo: 'C', estado: 'Cerrada', fechaObjetivoLimite: '2026-11-10', lifecycleHistory: [{ estadoNuevo: 'Cerrada', fecha: '2026-11-09T00:00:00Z', usuario: 'x' }] } as Partial<OT>),
  ];
  const filas = plazosDe(ots, plantas, '2026-11-20');
  const r = resumir(filas);
  assert.deepEqual([r.vencidas, r.aTiempo, r.cumplidas, r.cumplimiento], [1, 1, 1, 100]);
  const g = agrupar(filas, 'cliente');
  assert.deepEqual(g.map(x => [x.nombre, x.resumen.vencidas]), [['Blue Tree', 1], ['Eurus', 0]]);
});

test('el plan preventivo genera la OT con fecha objetivo y margen del contrato', () => {
  const plan: PmPlan = {
    id: 'pl', codigo: '4736', descripcion: 'MP anual', plantaId: 'P1', plantaNombre: 'Cantillana', periodicidad: 'anual',
    proximaFecha: '2026-12-01', anticipacionDias: 30, plantillaIds: [], hhEstimadas: 8, requiereAST: false, activo: true,
  };
  assert.equal(toleranciaDe(plan), 30);
  assert.equal(toleranciaDe({ ...plan, toleranciaDias: 5 }), 5);
  const { generated } = generateDuePmOTs({ plans: [{ ...plan, toleranciaDias: 10 }], templates: [], assets: [], today: '2026-11-20', alreadyGenerated: () => false, newCode: () => 'PM-1' });
  assert.equal(generated[0].ot.fechaObjetivo, '2026-12-01');
  assert.equal(generated[0].ot.fechaObjetivoLimite, '2026-12-11');
  assert.ok(validatePlan({ ...plan, toleranciaDias: -1 }, []).some(e => /margen/.test(e)));
});

// ---------------- 17B punto 5: correctivos pendientes al programar una visita ----------------
import { correctivosPendientes } from '../src/domain/visitas';

test('correctivos pendientes de la planta: aprobados primero y sumables, los demás con su motivo', () => {
  const ahora = new Date('2026-11-20T12:00:00Z');
  const hist = (f: string) => [{ estadoNuevo: 'Nueva', fecha: f, usuario: 'x' }] as OT['lifecycleHistory'];
  const ots = [
    ot({ codigo: 'VISITA', tipo: 'Preventiva' }),
    ot({ codigo: 'C-APROB', tipo: 'Correctiva', estado: 'Asignada', lifecycleHistory: hist('2026-11-01T12:00:00Z') }),
    ot({ codigo: 'C-WAPPR', tipo: 'Correctiva', estado: 'Nueva', lifecycleHistory: hist('2026-10-01T12:00:00Z') }),
    ot({ codigo: 'C-HOLD', tipo: 'Emergencia', estado: 'En espera de repuesto', motivoEsperaCodigo: 'REPUESTO' }),
    ot({ codigo: 'C-MISMO-DIA', tipo: 'Correctiva', estado: 'Programada', fechaInicio: '2026-11-25' }),
    ot({ codigo: 'C-OTRA', tipo: 'Correctiva', estado: 'Asignada', plantaId: 'P2' }),
    ot({ codigo: 'C-CERRADA', tipo: 'Correctiva', estado: 'Cerrada' }),
  ];
  const r = correctivosPendientes(ots, 'P1', 'VISITA', '2026-11-25', ahora);
  assert.deepEqual(r.map(p => [p.ot.codigo, p.sumable]), [['C-APROB', true], ['C-WAPPR', false], ['C-HOLD', false]]);
  assert.equal(r[0].antiguedad, 19);
  assert.match(r[1].motivo!, /aprobarlo/);
  assert.match(r[2].motivo!, /REPUESTO/);
});
