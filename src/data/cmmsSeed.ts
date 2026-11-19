/**
 * MÓDULO 17A — Fase 2: datos de demostración CMMS (solo con ORBI_SEED_DEMO=true).
 *
 * Planta Cantillana (ORBI-PV-058): estructura de activos con 39 inversores Sungrow SG250 en
 * 3 estaciones + inversor central C2, plantillas de checklist con el estilo de código de SoftWrench
 * y dos planes preventivos (anual de inversores y mensual de inspección).
 */
import type { Asset, ChecklistTemplate, PmPlan } from '../domain/cmms';

const PLANTA = 'ORBI-PV-058';

export const DEMO_ASSETS: Asset[] = (() => {
  const assets: Asset[] = [
    { id: 'CANT', plantaId: PLANTA, codigo: 'CANT', nombre: 'Cantillana', tipo: 'Planta', activo: true },
    { id: 'CANT-MT', parentId: 'CANT', plantaId: PLANTA, codigo: 'CANT-MT', nombre: 'Subestación MT', tipo: 'Celda MT', activo: true },
    { id: 'CANT-C2', parentId: 'CANT', plantaId: PLANTA, codigo: 'CANT-C2', nombre: 'Inversor Central C2', tipo: 'Inversor', fabricante: 'Sungrow', activo: true },
    { id: 'CANT-SCADA', parentId: 'CANT', plantaId: PLANTA, codigo: 'CANT-SCADA', nombre: 'Sala SCADA / Meteo', tipo: 'SCADA', activo: true },
  ];
  for (let e = 1; e <= 3; e++) {
    const est = `CANT-E${e}`;
    assets.push({ id: est, parentId: 'CANT', plantaId: PLANTA, codigo: est, nombre: `Estación de inversores ${e}`, tipo: 'Area', activo: true });
    for (let i = (e - 1) * 13 + 1; i <= e * 13; i++) {
      const n = String(i).padStart(2, '0');
      assets.push({
        id: `CANT-INV-${n}`, parentId: est, plantaId: PLANTA, codigo: `INV-${n}`, nombre: `INV-${n}`,
        tipo: 'Inversor', fabricante: 'Sungrow', modelo: 'SG250HX', activo: true,
      });
    }
  }
  return assets;
})();

export const DEMO_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'TPL-INV-A1', codigo: 'ORBI_MP_INV_A1', nombre: 'Mantenimiento anual inversor string', version: 1, activo: true,
    items: [
      { id: '1', texto: 'Inspección visual exterior del gabinete y señalética', tipo: 'ok_nok', requiereFoto: true },
      { id: '2', texto: 'Estado de LEDs / pantalla frontal sin alarmas', tipo: 'ok_nok', requiereFoto: true },
      { id: '3', texto: 'Limpieza de filtros y ventiladores', tipo: 'ok_nok', requiereFoto: true },
      { id: '4', texto: 'Reapriete de bornes AC/DC con torquímetro', tipo: 'ok_nok' },
      { id: '5', texto: 'Temperatura de gabinete', tipo: 'numero', unidad: '°C', min: 0, max: 55 },
      { id: '6', texto: 'Resistencia de aislamiento', tipo: 'numero', unidad: 'MΩ', min: 1 },
      { id: '7', texto: 'Entorno y vegetación despejados', tipo: 'ok_nok', requiereFoto: true },
      { id: '8', texto: 'Observaciones del técnico', tipo: 'texto' },
    ],
  },
  {
    id: 'TPL-INSP-M1', codigo: 'ORBI_INSP_PLANTA_M1', nombre: 'Inspección visual mensual de planta', version: 1, activo: true,
    items: [
      { id: '1', texto: 'Cerco perimetral y accesos sin daños', tipo: 'ok_nok' },
      { id: '2', texto: 'Inversores sin alarmas activas en SCADA', tipo: 'ok_nok' },
      { id: '3', texto: 'Módulos sin roturas ni suciedad excesiva', tipo: 'ok_nok', requiereFoto: true },
      { id: '4', texto: 'Irradiancia al momento de la inspección', tipo: 'numero', unidad: 'W/m²', min: 0, max: 1400 },
    ],
  },
];

export const DEMO_PLANS: PmPlan[] = [
  {
    id: 'PLAN-CANT-INV-A', codigo: '4736', descripcion: 'MP Anual de Inversores Cantillana', plantaId: PLANTA, plantaNombre: 'Cantillana',
    activoId: 'CANT', periodicidad: 'anual', proximaFecha: '2027-09-30', anticipacionDias: 30, plantillaIds: ['TPL-INV-A1'],
    responsable: 'Víctor León', supervisor: 'Mauricio Valdés', hhEstimadas: 40, requiereAST: true, activo: true,
  },
  {
    id: 'PLAN-CANT-INSP-M', codigo: '4790', descripcion: 'Inspección visual mensual Cantillana', plantaId: PLANTA, plantaNombre: 'Cantillana',
    activoId: 'CANT', periodicidad: 'mensual', proximaFecha: '2026-11-28', anticipacionDias: 14, plantillaIds: ['TPL-INSP-M1'],
    responsable: 'Víctor León', supervisor: 'Mauricio Valdés', hhEstimadas: 4, requiereAST: false, activo: true,
  },
];
