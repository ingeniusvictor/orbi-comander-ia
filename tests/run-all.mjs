/**
 * Suite de Pruebas Automatizadas — ORBI O&M Command Center IA
 * Ejecutable directamente con `npm test` (node tests/run-all.mjs) sin dependencias externas.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function readProjectFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

test('1. Configuración de paquete y variables de entorno están alineadas', () => {
  const pkg = JSON.parse(readProjectFile('package.json'));
  assert.equal(pkg.name, 'orbi-comander-ia', 'El nombre del paquete debe ser orbi-comander-ia');
  assert.equal(pkg.version, '1.0.0');
  assert.ok(pkg.scripts.dev, 'Debe existir script dev');
  assert.ok(pkg.scripts.build, 'Debe existir script build');
  assert.ok(pkg.scripts.lint, 'Debe existir script lint');
  assert.ok(pkg.scripts['validate:data'], 'Debe existir script validate:data');
  assert.ok(pkg.scripts.test, 'Debe existir script test');
  assert.ok(pkg.scripts.verify, 'Debe existir script verify');

  const envExample = readProjectFile('.env.example');
  assert.match(envExample, /GEMINI_API_KEY=/);
  assert.match(envExample, /PORT=/);
});

test('2. Backend server.ts usa modelo Gemini válido, validación, rate-limit y healthcheck', () => {
  const serverCode = readProjectFile('server.ts');
  assert.ok(!serverCode.includes('gemini-3.5-flash'), 'No debe referenciar el modelo inexistente gemini-3.5-flash');
  assert.ok(serverCode.includes('gemini-2.5-flash'), 'Debe usar gemini-2.5-flash');
  assert.ok(serverCode.includes("app.get('/api/health'"), 'Debe exponer endpoint GET /api/health');
  assert.ok(serverCode.includes("app.post('/api/bi/reporte-ia'"), 'Debe exponer endpoint POST /api/bi/reporte-ia');
  assert.ok(serverCode.includes('isRateLimited'), 'Debe incluir protección de rate limiting');
  assert.ok(serverCode.includes('MAX_PROMPT_LENGTH'), 'Debe validar longitud máxima del prompt');
  assert.ok(serverCode.includes('buildExecutiveFallbackReport'), 'Debe contar con fallback ejecutivo local');
});

test('3. Arquitectura modular de datos (db.ts, storage.ts, rolesConfig.ts) mantiene compatibilidad', () => {
  const dbCode = readProjectFile('src/data/db.ts');
  const storageCode = readProjectFile('src/data/storage.ts');
  const rolesCode = readProjectFile('src/data/rolesConfig.ts');

  assert.ok(storageCode.includes('export const STORAGE_KEYS'), 'storage.ts debe exportar STORAGE_KEYS');
  assert.ok(storageCode.includes('export function exportDatabaseSnapshot'), 'storage.ts debe exportar exportDatabaseSnapshot');
  assert.ok(storageCode.includes('export function importDatabaseSnapshot'), 'storage.ts debe exportar importDatabaseSnapshot');
  assert.ok(storageCode.includes('export const resetAllDatabases'), 'storage.ts debe exportar resetAllDatabases');

  assert.ok(rolesCode.includes('export const ROLES_CONFIG'), 'rolesConfig.ts debe exportar ROLES_CONFIG');
  for (const requiredRole of ['SUPER_ADMIN_ORBI', 'GERENCIA', 'JEFE_OM', 'COORDINADOR_OM', 'SUPERVISOR_TERRENO', 'TECNICO_OM']) {
    assert.ok(rolesCode.includes(`${requiredRole}:`), `rolesConfig.ts debe definir el rol ${requiredRole}`);
  }

  for (const reExport of [
    'ROLES_CONFIG',
    'STORAGE_KEYS',
    'resetAllDatabases',
    'exportDatabaseSnapshot',
    'importDatabaseSnapshot',
    'loadOTs',
    'loadPlantas',
    'loadPtws',
    'loadInventory'
  ]) {
    assert.ok(dbCode.includes(reExport), `db.ts debe mantener exportado ${reExport}`);
  }
});

test('4. Bases de datos JSON maestras tienen estructura válida y sin duplicados', () => {
  const fleetRaw = JSON.parse(readProjectFile('src/data/ORBI_FLEET_MASTER_DATABASE_v1.0.json'));
  assert.ok(Array.isArray(fleetRaw) || typeof fleetRaw === 'object', 'ORBI_FLEET_MASTER_DATABASE debe ser JSON válido');

  const plantMetaRaw = JSON.parse(readProjectFile('src/data/ORBI_PLANT_MASTER_DATABASE_v1.0.json'));
  assert.ok(typeof plantMetaRaw === 'object', 'ORBI_PLANT_MASTER_DATABASE debe ser JSON válido');

  const masterPlantsTs = readProjectFile('src/data/masterPlantsData.ts');
  const orbiIds = [...masterPlantsTs.matchAll(/"orbi_id":\s*"(ORBI-PV-\d+)"/g)].map((m) => m[1]);
  assert.ok(orbiIds.length > 0, 'masterPlantsData.ts debe contener plantas ORBI-PV-*');
  const uniqueOrbiIds = new Set(orbiIds);
  assert.equal(uniqueOrbiIds.size, orbiIds.length, 'No debe haber orbi_id duplicados en masterPlantsData.ts');
});

test('5. Documentación ejecutiva, CI/CD y Docker están presentes y sin archivos sueltos en raíz', () => {
  assert.ok(fs.existsSync(path.join(ROOT, 'README.md')), 'Debe existir README.md en la raíz');
  assert.ok(fs.existsSync(path.join(ROOT, 'docs/GUIA_DEMO_GERENCIA.md')), 'Debe existir docs/GUIA_DEMO_GERENCIA.md');
  assert.ok(fs.existsSync(path.join(ROOT, '.github/workflows/ci.yml')), 'Debe existir .github/workflows/ci.yml');
  assert.ok(fs.existsSync(path.join(ROOT, 'Dockerfile')), 'Debe existir Dockerfile');
  assert.ok(fs.existsSync(path.join(ROOT, '.dockerignore')), 'Debe existir .dockerignore');

  const rootOrbiMd = fs.readdirSync(ROOT).filter((f) => f.startsWith('ORBI_') && f.endsWith('.md'));
  assert.equal(rootOrbiMd.length, 0, 'Los informes de auditoría ORBI_*.md deben estar organizados en docs/audits/');
  assert.ok(!fs.existsSync(path.join(ROOT, 'src/_migration')), 'src/_migration debe estar archivado fuera de src/');
});

test('6. Componentes críticos de demo (InsightCenter y DemoReadiness) tienen manejo seguro', () => {
  const insightCode = readProjectFile('src/components/InsightCenter.tsx');
  assert.ok(insightCode.includes('if (!response.ok)'), 'InsightCenter debe verificar response.ok antes de parsear respuestas');

  const demoReadinessCode = readProjectFile('src/components/DemoReadiness.tsx');
  assert.ok(demoReadinessCode.includes("codigo.replace(/^OT-/i, '')"), 'DemoReadiness debe normalizar prefijos OT-');
});
