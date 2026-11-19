/**
 * MÓDULO 17A — Fase 2: pruebas del dominio CMMS (activos, plantillas, planes, HH).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addPeriod, generateDuePmOTs, buildChecklistFromTemplates, isOutOfRange, assetPath, validateAssets,
  parseAssetsCsv, hoursBetween, totalLaborHours, validateLaborLine, validatePlan, type PmPlan,
} from '../src/domain/cmms';
import { DEMO_ASSETS, DEMO_TEMPLATES, DEMO_PLANS } from '../src/data/cmmsSeed';

test('periodicidades: fin de mes y saltos de año', () => {
  assert.equal(addPeriod('2026-01-31', 'mensual'), '2026-02-28');
  assert.equal(addPeriod('2026-11-30', 'trimestral'), '2027-02-28');
  assert.equal(addPeriod('2026-09-30', 'anual'), '2027-09-30');
  assert.equal(addPeriod('2026-12-28', 'semanal'), '2027-01-04');
});

test('datos demo: jerarquía válida, 39 inversores en Cantillana, planes válidos', () => {
  assert.deepEqual(validateAssets(DEMO_ASSETS), []);
  assert.equal(DEMO_ASSETS.filter(a => a.tipo === 'Inversor' && a.modelo === 'SG250HX').length, 39);
  assert.equal(assetPath(DEMO_ASSETS, 'CANT-INV-03'), 'Cantillana › Estación de inversores 1 › INV-03');
  for (const p of DEMO_PLANS) assert.deepEqual(validatePlan(p, DEMO_TEMPLATES), []);
});

test('jerarquía: detecta padres inexistentes y ciclos', () => {
  const errs = validateAssets([
    { id: 'A', parentId: 'B', plantaId: 'P', codigo: 'A', nombre: 'A', tipo: 'Area', activo: true },
    { id: 'B', parentId: 'A', plantaId: 'P', codigo: 'B', nombre: 'B', tipo: 'Area', activo: true },
    { id: 'C', parentId: 'X', plantaId: 'P', codigo: 'C', nombre: 'C', tipo: 'Area', activo: true },
  ]);
  assert.ok(errs.some(e => e.includes('Ciclo')));
  assert.ok(errs.some(e => e.includes('inexistente')));
});

test('importación CSV de activos', () => {
  const { assets, errors } = parseAssetsCsv('id;padre;planta;codigo;nombre;tipo\nP1;;ORBI-PV-001;P1;Planta 1;Planta\nI1;P1;ORBI-PV-001;INV-1;INV-1;Inversor\nX;P1;ORBI-PV-001;X;X;Nave');
  assert.equal(assets.length, 2);
  assert.equal(errors.length, 1);
});

test('generador de preventivos: genera en la ventana de anticipación, avanza la fecha y no duplica', () => {
  const plan: PmPlan = { ...DEMO_PLANS[1], proximaFecha: '2026-11-28', anticipacionDias: 14 };
  const done = new Set<string>();
  const run = (today: string, plans: PmPlan[]) => generateDuePmOTs({
    plans, templates: DEMO_TEMPLATES, assets: DEMO_ASSETS, today,
    alreadyGenerated: (id, f) => done.has(`${id}|${f}`),
    newCode: (p, f) => `PM-${p.codigo}-${f}`,
  });
  const first = run('2026-11-19', [plan]);
  assert.equal(first.generated.length, 1);
  const ot = first.generated[0].ot;
  assert.equal(ot.estado, 'Programada');
  assert.equal(ot.tipo, 'Preventiva');
  assert.equal(ot.pmPlanId, plan.id);
  assert.equal(ot.checklistExecution?.length, DEMO_TEMPLATES[1].items.length);
  assert.equal(first.plans[0].proximaFecha, '2026-12-28');
  first.generated.forEach(g => done.add(`${g.planId}|${g.fecha}`));
  // Mismo día otra vez: nada nuevo
  assert.equal(run('2026-11-19', first.plans).generated.length, 0);
  // El plan anual no genera hasta 30 días antes
  assert.equal(run('2026-11-19', [DEMO_PLANS[0]]).generated.length, 0);
  assert.equal(run('2027-09-01', [DEMO_PLANS[0]]).generated.length, 1);
});

test('plantillas: checklist enlazado y rango numérico', () => {
  const items = buildChecklistFromTemplates([DEMO_TEMPLATES[0]]);
  const temp = items.find(i => i.unidad === '°C')!;
  assert.equal(temp.templateId, 'TPL-INV-A1');
  assert.equal(isOutOfRange({ ...temp, valor: '62' }), true);
  assert.equal(isOutOfRange({ ...temp, valor: '41,5' }), false);
});

test('horas hombre: cálculo y validación', () => {
  assert.equal(hoursBetween('08:30', '13:00'), 4.5);
  assert.equal(hoursBetween('22:00', '02:00'), 4);
  assert.equal(totalLaborHours([{ horas: 4.5 }, { horas: 3 }] as any), 7.5);
  assert.ok(validateLaborLine({ id: '1', tecnico: 'X', fecha: '2026-11-19', horaInicio: '08:00', horaFin: '08:00', horas: 0 }));
});

test('plan atrasado: no genera una ráfaga de OTs vencidas', () => {
  const plan: PmPlan = { ...DEMO_PLANS[1], periodicidad: 'semanal', proximaFecha: '2025-01-06', anticipacionDias: 0 };
  const r = generateDuePmOTs({
    plans: [plan], templates: DEMO_TEMPLATES, assets: DEMO_ASSETS, today: '2026-11-19',
    alreadyGenerated: () => false, newCode: (p, f) => `PM-${p.codigo}-${f}`,
  });
  assert.equal(r.generated.length, 1);
  assert.ok(r.generated[0].fecha <= '2026-11-19' && r.generated[0].fecha > '2026-11-12');
  assert.ok(r.plans[0].proximaFecha > '2026-11-19');
});

test('número de plan único', () => {
  const otro = { ...DEMO_PLANS[0], id: 'OTRO' };
  assert.ok(validatePlan(otro, DEMO_TEMPLATES, DEMO_PLANS).some(e => e.includes('Ya existe')));
});
