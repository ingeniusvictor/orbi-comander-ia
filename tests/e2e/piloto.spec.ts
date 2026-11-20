/**
 * MÓDULO 17A — Fase 4: prueba de pantallas del piloto (Playwright + Edge).
 *
 * Técnico en un teléfono:
 *   inicia sesión → ve solo sus OTs → abre la OT preventiva generada por el plan mensual →
 *   confirma llegada → responde el checklist (valor fuera de rango y foto por pregunta) →
 *   registra sus HH → pierde la señal, saca una foto de evidencia → vuelve la señal y todo se sincroniza.
 * Jefe O&M en un PC:
 *   inicia sesión → ve los planes preventivos → comprueba en el servidor el trabajo del técnico.
 *
 * Las capturas de cada paso quedan en test-results/ (útiles para la presentación a gerencia).
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { E2E_USERS } from './users';

const OT_PM = 'PM-4790-20261128';

async function login(page: Page, user: { username: string; password: string }) {
  await page.goto('/');
  await page.getByLabel('Usuario').fill(user.username);
  await page.getByLabel('Contraseña').fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

/** Imagen JPEG real generada en el navegador (la app la reduce antes de subirla). */
async function makeJpeg(page: Page, color: string): Promise<Buffer> {
  const dataUrl = await page.evaluate((c) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const g = canvas.getContext('2d')!;
    g.fillStyle = c;
    g.fillRect(0, 0, 1200, 900);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, color);
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function apiOT(page: Page, codigo: string) {
  const res = await page.request.get('/api/ots', { headers: { 'X-ORBI-Request': '1' } });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()).ots as any[]).find(o => o.codigo === codigo);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/piloto/${name}.png`, fullPage: false });
}

test.describe.configure({ mode: 'serial' });

let tecnicoCtx: BrowserContext;
let tecnico: Page;

test.beforeAll(async ({ browser }, info) => {
  tecnicoCtx = await browser.newContext(info.project.use);
  tecnico = await tecnicoCtx.newPage();
  tecnico.on('dialog', d => d.accept());
});

test.afterAll(async () => {
  await tecnicoCtx?.close();
});

test('1. el técnico inicia sesión y ve solo sus OTs', async () => {
  await login(tecnico, E2E_USERS.tecnico);
  // En el teléfono la bandeja de terreno ocupa la pantalla completa
  await expect(tecnico.getByText('Mis OT Asignadas')).toBeVisible();
  await expect(tecnico.getByText(OT_PM)).toBeVisible();
  const visibles = await tecnico.request.get('/api/ots', { headers: { 'X-ORBI-Request': '1' } }).then(r => r.json());
  expect(visibles.ots.every((o: any) => /v[ií]ctor le[oó]n/i.test(`${o.responsable} ${o.tecnicoAsignado ?? ''}`))).toBeTruthy();
  await shot(tecnico, '01-tecnico-bandeja');
});

test('2. abre la OT preventiva generada por el plan y confirma su llegada', async () => {
  await tecnico.getByText(OT_PM).click();
  await tecnico.getByRole('button', { name: 'Confirmar llegada' }).click();
  await expect.poll(async () => (await apiOT(tecnico, OT_PM))?.estado, { timeout: 10_000 }).toBe('En terreno');
});

test('3. responde el checklist: valor fuera de rango y foto por pregunta', async () => {
  await tecnico.getByRole('button', { name: 'Checklist', exact: true }).click();
  await tecnico.getByPlaceholder('Valor (0 a 1400)').fill('1550');
  await expect(tecnico.getByText('Fuera de rango')).toBeVisible();

  const foto = tecnico.locator('label', { hasText: 'Foto requerida' }).first().locator('input[type=file]');
  await foto.setInputFiles({ name: 'modulos.jpg', mimeType: 'image/jpeg', buffer: await makeJpeg(tecnico, '#2a6') });
  await expect(tecnico.getByText('Foto agregada a la pregunta.')).toBeVisible();

  await tecnico.getByRole('button', { name: 'Guardar checklist' }).click();
  await expect.poll(async () => {
    const ot = await apiOT(tecnico, OT_PM);
    const irr = ot?.checklistExecution?.find((c: any) => c.unidad === 'W/m²');
    const conFoto = ot?.checklistExecution?.filter((c: any) => c.fotos?.length).length;
    return irr?.fueraDeRango === true && irr?.hallazgo === true && conFoto >= 1;
  }, { timeout: 15_000 }).toBe(true);
  await shot(tecnico, '02-checklist');
});

test('4. registra sus horas hombre', async () => {
  await tecnico.getByRole('button', { name: 'Recursos', exact: true }).click();
  await tecnico.getByRole('button', { name: /Registrar mis horas/ }).click();
  await expect.poll(async () => (await apiOT(tecnico, OT_PM))?.hhReales, { timeout: 10_000 }).toBe(4);
});

test('5. sin señal: la foto queda en el teléfono y se sincroniza sola al volver la conexión', async () => {
  await tecnico.getByRole('button', { name: 'Fotos', exact: true }).click();
  await tecnico.getByPlaceholder(/Etiqueta: Ej/).fill('Módulos después de inspección');
  const jpeg = await makeJpeg(tecnico, '#a63');

  await tecnicoCtx.setOffline(true);
  const evidencia = tecnico.locator('label', { hasText: 'Tomar o elegir foto' }).locator('input[type=file]');
  await evidencia.setInputFiles({ name: 'evidencia.jpg', mimeType: 'image/jpeg', buffer: jpeg });
  await expect(tecnico.getByText(/Sin señal/).first()).toBeVisible();
  await expect(tecnico.getByText(/sin sincronizar/)).toBeVisible();
  await shot(tecnico, '03-sin-senal');

  await tecnicoCtx.setOffline(false);
  await expect(tecnico.getByText(/sin sincronizar/)).toBeHidden({ timeout: 30_000 });
  await expect.poll(async () => {
    const ot = await apiOT(tecnico, OT_PM);
    const ev = ot?.evidencePack?.find((e: any) => e.label === 'Módulos después de inspección');
    return Boolean(ev?.fileId && ev.fileUrl?.startsWith('/api/files/'));
  }, { timeout: 15_000 }).toBe(true);
  await shot(tecnico, '04-sincronizado');
});

test('6. el Jefe O&M ve los planes y el trabajo del técnico', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-CL' });
  const jefe = await ctx.newPage();
  await login(jefe, E2E_USERS.jefe);
  await jefe.getByRole('button', { name: 'Activos y Preventivos' }).click();
  await expect(jefe.getByRole('cell', { name: '4790' })).toBeVisible();
  await expect(jefe.getByRole('cell', { name: '4736' })).toBeVisible();
  await shot(jefe, '05-jefe-planes');

  const ot = await apiOT(jefe, OT_PM);
  expect(ot.estado).toBe('En terreno');
  expect(ot.hhReales).toBe(4);
  expect(ot.lifecycleHistory.at(-1).usuario).toBe('Víctor León');
  expect(ot.evidencePack.some((e: any) => e.fileId)).toBeTruthy();
  const audit = await jefe.request.get('/api/audit', { headers: { 'X-ORBI-Request': '1' } }).then(r => r.json());
  expect(audit.events.some((e: any) => e.usuarioRol.startsWith('Víctor León') && /Evidencia/.test(e.accion))).toBeTruthy();
  await ctx.close();
});

test('7. terreno legible: botones de 44 px, sin letra menor a 12 px y modo sol que se recuerda', async () => {
  await tecnico.goto('/');
  await tecnico.getByText(OT_PM).click();
  await tecnico.getByRole('button', { name: 'Checklist', exact: true }).click();
  // Botones de estado del checklist: al menos 44 px de alto (uso con guantes)
  const hecho = tecnico.getByRole('button', { name: /Hecho/ }).first();
  const caja = await hecho.boundingBox();
  expect(caja!.height).toBeGreaterThanOrEqual(44);
  // Ningún texto visible de la vista de terreno bajo 12 px
  const minimo = await tecnico.evaluate(() => {
    const raiz = document.getElementById('vista-terreno-container')!;
    let min = 99;
    raiz.querySelectorAll('*').forEach(el => {
      const e = el as HTMLElement;
      if (!e.offsetParent || !e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent!.trim())) return;
      min = Math.min(min, parseFloat(getComputedStyle(e).fontSize));
    });
    return min;
  });
  expect(minimo).toBeGreaterThanOrEqual(12);
  // Modo sol: tema claro que se mantiene al recargar
  await tecnico.getByRole('button', { name: 'Modo sol' }).first().click();
  await expect(tecnico.locator('#vista-terreno-container')).toHaveClass(/tema-sol/);
  await tecnico.waitForTimeout(500); // esperar el fin de la transición de colores
  await shot(tecnico, '06-modo-sol');
  await tecnico.reload();
  await expect(tecnico.locator('#vista-terreno-container')).toHaveClass(/tema-sol/);
  await tecnico.getByRole('button', { name: 'Modo oscuro' }).first().click();
  await expect(tecnico.locator('#vista-terreno-container')).not.toHaveClass(/tema-sol/);
});

test('8. sin señal desde el inicio: la app y Vista Terreno (cargada aparte) abren desde el teléfono', async () => {
  // El service worker debe controlar la página y haber guardado el módulo de terreno
  await tecnico.evaluate(() => navigator.serviceWorker.ready);
  await tecnico.reload();
  await expect.poll(() => tecnico.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 10_000 }).toBe(true);
  await expect(tecnico.getByText('Mis OT Asignadas')).toBeVisible();
  // Una segunda recarga con señal dispara la limpieza de archivos viejos: no debe borrar el módulo de terreno
  await tecnico.reload();
  await expect(tecnico.getByText('Mis OT Asignadas')).toBeVisible();
  await tecnico.waitForTimeout(1500);

  await tecnicoCtx.setOffline(true);
  await tecnico.reload();
  await expect(tecnico.getByText('Mis OT Asignadas')).toBeVisible({ timeout: 15_000 });
  await expect(tecnico.getByText(OT_PM)).toBeVisible();
  await tecnicoCtx.setOffline(false);
});

test('9. hallazgo del checklist: el técnico crea un correctivo de seguimiento vinculado (17B)', async () => {
  await tecnico.goto('/');
  await tecnico.getByText(OT_PM).click();
  await tecnico.getByRole('button', { name: 'Checklist', exact: true }).click();
  // La irradiancia fuera de rango quedó marcada como hallazgo en el paso 3
  await tecnico.getByRole('button', { name: 'Crear correctivo por este hallazgo' }).first().click();
  await tecnico.getByLabel('¿Qué falla encontraste y qué hay que hacer?').fill('Piranómetro marca 1550 W/m²; revisar calibración');
  await tecnico.getByLabel('Prioridad').selectOption('Alta');
  await tecnico.getByRole('button', { name: 'Crear correctivo', exact: true }).click();
  await expect(tecnico.getByText(/Correctivo SEG-/).first()).toBeVisible();
  await shot(tecnico, '07-correctivo-seguimiento');

  await expect.poll(async () => {
    const res = await tecnico.request.get('/api/ots', { headers: { 'X-ORBI-Request': '1' } });
    const ots = (await res.json()).ots as any[];
    const seg = ots.find(o => o.otOrigen === OT_PM);
    const origen = ots.find(o => o.codigo === OT_PM);
    return Boolean(seg && seg.tipo === 'Correctiva' && seg.prioridad === 'Alta' && origen?.otsSeguimiento?.includes(seg.codigo));
  }, { timeout: 15_000 }).toBe(true);
});

test('10. el Jefe O&M aprueba el correctivo desde "Por aprobar" y lo asigna (17B)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-CL' });
  const jefe = await ctx.newPage();
  await login(jefe, E2E_USERS.jefe);
  await jefe.getByRole('button', { name: 'ORBI OT Center' }).click();
  await jefe.getByRole('tab', { name: /Por aprobar/ }).click();
  const tarjeta = jefe.getByRole('listitem').filter({ hasText: `Hallazgo en la OT ${OT_PM}` }).first();
  await expect(tarjeta).toBeVisible();
  await expect(tarjeta.getByText(/Hoy|día/)).toBeVisible();
  await tarjeta.getByRole('button', { name: 'Revisar' }).click();
  await tarjeta.getByLabel('Técnico responsable').selectOption({ label: 'Víctor León' });
  await shot(jefe, '08-por-aprobar');
  await tarjeta.getByRole('button', { name: 'Aprobar y asignar' }).click();

  await expect.poll(async () => {
    const res = await jefe.request.get('/api/ots', { headers: { 'X-ORBI-Request': '1' } });
    const seg = ((await res.json()).ots as any[]).find(o => o.otOrigen === OT_PM);
    return seg ? `${seg.estado}|${seg.responsable}|${seg.aprobadaPor}` : '';
  }, { timeout: 15_000 }).toMatch(/^Asignada\|Víctor León\|/);
  await ctx.close();
});

test('11. el Jefe O&M revisa el tablero de plazos (17B)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-CL' });
  const jefe = await ctx.newPage();
  await login(jefe, E2E_USERS.jefe);
  await jefe.getByRole('button', { name: 'ORBI OT Center' }).click();
  await jefe.getByRole('tab', { name: 'Plazos' }).click();
  await expect(jefe.getByText('Cumplimiento a tiempo')).toBeVisible();
  // La OT del plan mensual muestra su fecha objetivo del contrato
  await expect(jefe.getByRole('rowheader', { name: 'Cantillana' }).first()).toBeVisible();
  await jefe.getByLabel('Agrupar por').selectOption('cliente');
  await shot(jefe, '09-plazos');
  const res = await jefe.request.get('/api/ots', { headers: { 'X-ORBI-Request': '1' } });
  const pm = ((await res.json()).ots as any[]).find(o => o.codigo === OT_PM);
  expect(pm.fechaObjetivo).toBe('2026-11-28');
  expect(pm.fechaObjetivoLimite).toBeTruthy();
  await ctx.close();
});
