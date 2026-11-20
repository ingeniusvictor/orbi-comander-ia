/**
 * MÓDULO 17A — Fase 2: entidades CMMS (compartidas por servidor y navegador).
 *
 * - Activos con jerarquía (planta → área/estación → equipo → componente).
 * - Plantillas de checklist con tipo de respuesta por pregunta.
 * - Planes preventivos con periodicidad que generan OTs (como los PM de Maximo/SoftWrench).
 * - Líneas de horas hombre por técnico.
 * - Códigos de espera (HOLD) y de falla (problema / causa / acción).
 *
 * Funciones puras y sin dependencias de navegador para poder probarlas y usarlas en el servidor.
 */
import type { OT, OTEstado } from '../types';

// ---------------- Activos ----------------

export type AssetType = 'Planta' | 'Area' | 'Inversor' | 'Transformador' | 'Celda MT' | 'Tracker' | 'String' | 'Estacion Meteo' | 'SCADA' | 'Otro';

export interface Asset {
  id: string;
  /** Activo padre; vacío para el nodo raíz de la planta. */
  parentId?: string;
  plantaId: string;
  codigo: string;
  nombre: string;
  tipo: AssetType;
  fabricante?: string;
  modelo?: string;
  serie?: string;
  activo: boolean;
}

export const ASSET_TYPES: AssetType[] = ['Planta', 'Area', 'Inversor', 'Transformador', 'Celda MT', 'Tracker', 'String', 'Estacion Meteo', 'SCADA', 'Otro'];

/** Ruta legible de un activo: "Cantillana › Estación 1 › INV-03". */
export function assetPath(assets: Asset[], id: string | undefined): string {
  if (!id) return '';
  const byId = new Map(assets.map(a => [a.id, a]));
  const parts: string[] = [];
  const seen = new Set<string>();
  let cur = byId.get(id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    parts.unshift(cur.nombre);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return parts.join(' › ');
}

/** Valida la jerarquía: ids únicos, padres existentes y sin ciclos. */
export function validateAssets(assets: Asset[]): string[] {
  const errors: string[] = [];
  const byId = new Map<string, Asset>();
  for (const a of assets) {
    if (!a.id || !a.nombre || !a.plantaId) errors.push(`Activo incompleto: ${a.id || a.nombre || '(sin id)'}`);
    if (byId.has(a.id)) errors.push(`Id de activo duplicado: ${a.id}`);
    byId.set(a.id, a);
  }
  for (const a of assets) {
    if (a.parentId && !byId.has(a.parentId)) errors.push(`El activo ${a.id} apunta a un padre inexistente (${a.parentId}).`);
    const seen = new Set<string>();
    let cur: Asset | undefined = a;
    while (cur?.parentId) {
      if (seen.has(cur.id)) {
        errors.push(`Ciclo en la jerarquía de activos que incluye ${a.id}.`);
        break;
      }
      seen.add(cur.id);
      cur = byId.get(cur.parentId);
    }
  }
  return errors;
}

/**
 * Importa activos desde texto CSV (separado por coma o punto y coma) con encabezado:
 * id;padre;planta;codigo;nombre;tipo;fabricante;modelo;serie
 */
export function parseAssetsCsv(text: string): { assets: Asset[]; errors: string[] } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { assets: [], errors: ['El archivo no tiene filas de datos.'] };
  const sep = lines[0].includes(';') ? ';' : ',';
  const header = lines[0].split(sep).map(h => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const required = ['id', 'planta', 'codigo', 'nombre', 'tipo'];
  const missing = required.filter(r => col(r) === -1);
  if (missing.length) return { assets: [], errors: [`Faltan columnas: ${missing.join(', ')}`] };
  const assets: Asset[] = [];
  const errors: string[] = [];
  lines.slice(1).forEach((line, i) => {
    const cells = line.split(sep).map(c => c.trim());
    const get = (name: string) => (col(name) >= 0 ? cells[col(name)] ?? '' : '');
    const tipo = get('tipo') as AssetType;
    if (!ASSET_TYPES.includes(tipo)) {
      errors.push(`Fila ${i + 2}: tipo "${tipo}" no válido (${ASSET_TYPES.join(', ')}).`);
      return;
    }
    assets.push({
      id: get('id'), parentId: get('padre') || undefined, plantaId: get('planta'), codigo: get('codigo'),
      nombre: get('nombre'), tipo, fabricante: get('fabricante') || undefined, modelo: get('modelo') || undefined,
      serie: get('serie') || undefined, activo: true,
    });
  });
  return { assets, errors };
}

// ---------------- Plantillas de checklist ----------------

export type ChecklistAnswerType = 'ok_nok' | 'numero' | 'texto';

export interface ChecklistTemplateItem {
  id: string;
  texto: string;
  tipo: ChecklistAnswerType;
  unidad?: string;
  min?: number;
  max?: number;
  requiereFoto?: boolean;
}

export interface ChecklistTemplate {
  id: string;
  /** Código como en SoftWrench, p. ej. BLUETREE_2.08_INV_A1. */
  codigo: string;
  nombre: string;
  version: number;
  items: ChecklistTemplateItem[];
  activo: boolean;
}

/** Ítem de checklist en la OT, enlazado a su plantilla. */
export type OTChecklistItem = NonNullable<OT['checklistExecution']>[number] & {
  templateId?: string;
  templateVersion?: number;
  itemId?: string;
  tipo?: ChecklistAnswerType;
  unidad?: string;
  min?: number;
  max?: number;
  valor?: string;
  fueraDeRango?: boolean;
};

export function buildChecklistFromTemplates(templates: ChecklistTemplate[]): OTChecklistItem[] {
  return templates.flatMap(t => t.items.map(it => ({
    item: `[${t.codigo}] ${it.texto}`,
    completado: false,
    noAplica: false,
    observacion: '',
    hallazgo: false,
    evidenciaRequerida: Boolean(it.requiereFoto),
    templateId: t.id,
    templateVersion: t.version,
    itemId: it.id,
    tipo: it.tipo,
    unidad: it.unidad,
    min: it.min,
    max: it.max,
  })));
}

/** Para preguntas numéricas: marca si el valor está fuera del rango esperado (se trata como hallazgo). */
export function isOutOfRange(item: Pick<OTChecklistItem, 'tipo' | 'min' | 'max' | 'valor'>): boolean {
  if (item.tipo !== 'numero' || item.valor === undefined || item.valor === '') return false;
  const n = Number(String(item.valor).replace(',', '.'));
  if (!Number.isFinite(n)) return true;
  return (item.min !== undefined && n < item.min) || (item.max !== undefined && n > item.max);
}

export function validateTemplate(t: ChecklistTemplate): string[] {
  const errors: string[] = [];
  if (!t.id || !t.codigo || !t.nombre) errors.push('La plantilla necesita id, código y nombre.');
  if (!t.items.length) errors.push('La plantilla necesita al menos una pregunta.');
  const ids = new Set<string>();
  for (const it of t.items) {
    if (!it.texto.trim()) errors.push('Hay una pregunta sin texto.');
    if (ids.has(it.id)) errors.push(`Pregunta duplicada: ${it.id}`);
    ids.add(it.id);
    if (it.tipo === 'numero' && it.min !== undefined && it.max !== undefined && it.min > it.max) {
      errors.push(`Rango inválido en "${it.texto}".`);
    }
  }
  return errors;
}

// ---------------- Planes preventivos ----------------

export type Periodicidad = 'semanal' | 'quincenal' | 'mensual' | 'bimestral' | 'trimestral' | 'cuatrimestral' | 'semestral' | 'anual' | 'bianual';

export const PERIODICIDADES: Record<Periodicidad, { dias?: number; meses?: number }> = {
  semanal: { dias: 7 },
  quincenal: { dias: 14 },
  mensual: { meses: 1 },
  bimestral: { meses: 2 },
  trimestral: { meses: 3 },
  cuatrimestral: { meses: 4 },
  semestral: { meses: 6 },
  anual: { meses: 12 },
  bianual: { meses: 24 },
};

export interface PmPlan {
  id: string;
  /** Número del plan (como pmnum en Maximo). */
  codigo: string;
  descripcion: string;
  plantaId: string;
  plantaNombre: string;
  /** Activo principal (opcional; p. ej. la estación de inversores). */
  activoId?: string;
  periodicidad: Periodicidad;
  /** Próxima fecha programada (AAAA-MM-DD). */
  proximaFecha: string;
  /** Días de anticipación con que se genera la OT antes de la fecha. */
  anticipacionDias: number;
  /** 17B: margen del contrato (días después de la fecha objetivo en que aún se cumple). Por defecto según periodicidad. */
  toleranciaDias?: number;
  plantillaIds: string[];
  responsable?: string;
  supervisor?: string;
  hhEstimadas: number;
  requiereAST: boolean;
  activo: boolean;
  ultimaGeneracion?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const toIsoDate = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
/** Fecha local del equipo (para valores por defecto en pantalla). */
export const localIsoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Suma una periodicidad a una fecha AAAA-MM-DD (si el día no existe en el mes destino, usa el último día). */
export function addPeriod(fecha: string, periodicidad: Periodicidad): string {
  const p = PERIODICIDADES[periodicidad];
  const d = parseIsoDate(fecha);
  if (p.dias) {
    d.setUTCDate(d.getUTCDate() + p.dias);
    return toIsoDate(d);
  }
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + (p.meses ?? 0), 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return toIsoDate(target);
}

/** 17B: margen por defecto del contrato según la periodicidad (días después de la fecha objetivo). */
export const TOLERANCIA_POR_DEFECTO: Record<Periodicidad, number> = {
  semanal: 2, quincenal: 3, mensual: 7, bimestral: 10, trimestral: 15, cuatrimestral: 15, semestral: 30, anual: 30, bianual: 60,
};

export function toleranciaDe(p: Pick<PmPlan, 'periodicidad' | 'toleranciaDias'>): number {
  return Number.isInteger(p.toleranciaDias) && (p.toleranciaDias as number) >= 0 ? (p.toleranciaDias as number) : TOLERANCIA_POR_DEFECTO[p.periodicidad] ?? 7;
}

export function addDaysIso(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return toIsoDate(d);
}

export function validatePlan(p: PmPlan, templates: ChecklistTemplate[], others: PmPlan[] = []): string[] {
  const errors: string[] = [];
  if (others.some(o => o.id !== p.id && o.codigo.trim() === p.codigo.trim())) errors.push(`Ya existe otro plan con el número ${p.codigo}.`);
  if (!p.id || !p.codigo || !p.descripcion) errors.push('El plan necesita id, código y descripción.');
  if (!p.plantaId) errors.push('El plan necesita una planta.');
  if (!PERIODICIDADES[p.periodicidad]) errors.push(`Periodicidad inválida: ${p.periodicidad}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.proximaFecha)) errors.push('La próxima fecha debe tener formato AAAA-MM-DD.');
  if (!(p.hhEstimadas > 0)) errors.push('Las HH estimadas deben ser mayores a 0.');
  if (p.toleranciaDias != null && (!Number.isInteger(p.toleranciaDias) || p.toleranciaDias < 0 || p.toleranciaDias > 365)) {
    errors.push('El margen del contrato debe ser un número entero de días entre 0 y 365.');
  }
  for (const id of p.plantillaIds) {
    if (!templates.some(t => t.id === id)) errors.push(`Plantilla inexistente: ${id}`);
  }
  return errors;
}

export interface GeneratedPm {
  planId: string;
  fecha: string;
  ot: OT;
}

/**
 * Genera las OTs preventivas que vencen dentro del horizonte de anticipación de cada plan.
 * Idempotente: `alreadyGenerated(planId, fecha)` evita duplicar una OT de la misma fecha.
 * Devuelve las OTs nuevas y los planes con su próxima fecha avanzada.
 */
export function generateDuePmOTs(args: {
  plans: PmPlan[];
  templates: ChecklistTemplate[];
  assets: Asset[];
  today: string;
  alreadyGenerated: (planId: string, fecha: string) => boolean;
  newCode: (plan: PmPlan, fecha: string) => string;
  maxPerPlan?: number;
}): { generated: GeneratedPm[]; plans: PmPlan[] } {
  const { templates, assets, today, alreadyGenerated, newCode } = args;
  const maxPerPlan = args.maxPerPlan ?? 12;
  const generated: GeneratedPm[] = [];
  const plans = args.plans.map(plan => {
    if (!plan.activo) return plan;
    let next = { ...plan };
    let count = 0;
    // Plan atrasado (fecha antigua): no se crea una ráfaga de OTs vencidas; se salta a la última fecha
    // ya vencida y solo esa se genera.
    while (addPeriod(next.proximaFecha, next.periodicidad) <= today) {
      next = { ...next, proximaFecha: addPeriod(next.proximaFecha, next.periodicidad) };
    }
    while (count < maxPerPlan) {
      const limit = parseIsoDate(today);
      limit.setUTCDate(limit.getUTCDate() + (next.anticipacionDias || 0));
      if (parseIsoDate(next.proximaFecha) > limit) break;
      const fecha = next.proximaFecha;
      if (!alreadyGenerated(next.id, fecha)) {
        const planTemplates = templates.filter(t => next.plantillaIds.includes(t.id) && t.activo);
        const estado: OTEstado = next.responsable ? 'Programada' : 'Asignada';
        const activo = next.activoId ? assets.find(a => a.id === next.activoId) : undefined;
        const ot = {
          codigo: newCode(next, fecha),
          plantaId: next.plantaId,
          plantaNombre: next.plantaNombre,
          activo: activo ? assetPath(assets, activo.id) : next.descripcion,
          activoId: next.activoId,
          tipo: 'Preventiva',
          prioridad: 'Media',
          criticidad: 'Media',
          responsable: next.responsable || '',
          supervisor: next.supervisor || '',
          fechaInicio: fecha,
          fechaProgramada: fecha,
          // 17B: fecha objetivo del contrato (como Target Start en SoftWrench) y su margen
          fechaObjetivo: fecha,
          fechaObjetivoLimite: addDaysIso(fecha, toleranciaDe(next)),
          fechaLimite: addDaysIso(fecha, toleranciaDe(next)),
          estado,
          avance: 0,
          hhEstimadas: next.hhEstimadas,
          hhReales: 0,
          observaciones: `${next.descripcion} (plan ${next.codigo}, ${next.periodicidad}).`,
          origen: 'Preventivo programado',
          impacto: 'Bajo',
          riesgoDisponibilidad: 'No aplica',
          requiereAST: next.requiereAST,
          requiereChecklist: planTemplates.length > 0,
          requiereEvidencia: true,
          checklistExecution: buildChecklistFromTemplates(planTemplates),
          pmPlanId: next.id,
          pmFecha: fecha,
        } as unknown as OT;
        generated.push({ planId: next.id, fecha, ot });
      }
      next = { ...next, proximaFecha: addPeriod(fecha, next.periodicidad), ultimaGeneracion: today };
      count++;
    }
    return next;
  });
  return { generated, plans };
}

// ---------------- Horas hombre ----------------

export interface LaborLine {
  id: string;
  tecnico: string;
  fecha: string; // AAAA-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  horas: number;
  actividad?: string;
}

/** Horas entre dos horas HH:mm del mismo día (si fin < inicio, se asume que cruza medianoche). */
export function hoursBetween(inicio: string, fin: string): number {
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  if (!/^\d{1,2}:\d{2}$/.test(inicio) || !/^\d{1,2}:\d{2}$/.test(fin)) return 0;
  let diff = toMin(fin) - toMin(inicio);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}

export function validateLaborLine(l: LaborLine): string | null {
  if (!l.tecnico?.trim()) return 'La línea de HH necesita el técnico.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(l.fecha)) return 'La fecha de la línea de HH no es válida.';
  if (!(l.horas > 0) || l.horas > 16) return 'Las horas de una línea deben estar entre 0 y 16.';
  return null;
}

export function totalLaborHours(lines: LaborLine[] | undefined): number {
  return Math.round((lines || []).reduce((s, l) => s + (Number(l.horas) || 0), 0) * 100) / 100;
}

// ---------------- Códigos de espera y de falla ----------------

export interface Code { codigo: string; descripcion: string }

export interface CmmsCodes {
  espera: Code[];
  fallaProblema: Code[];
  fallaCausa: Code[];
  fallaAccion: Code[];
}

export const DEFAULT_CODES: CmmsCodes = {
  espera: [
    { codigo: 'REPUESTO', descripcion: 'Espera de repuesto o material' },
    { codigo: 'CLIENTE', descripcion: 'Espera de autorización o acceso del cliente' },
    { codigo: 'CLIMA', descripcion: 'Condición climática (viento, lluvia, nieve)' },
    { codigo: 'PERMISO', descripcion: 'Permiso de trabajo o desenergización pendiente' },
    { codigo: 'SEGURIDAD', descripcion: 'Condición insegura detectada' },
    { codigo: 'PROVEEDOR', descripcion: 'Espera de proveedor o fabricante (OEM)' },
    { codigo: 'RECURSO', descripcion: 'Falta de personal, vehículo o herramienta' },
    { codigo: 'OTRO', descripcion: 'Otro motivo (detallar en observaciones)' },
  ],
  fallaProblema: [
    { codigo: 'INV-OFF', descripcion: 'Inversor fuera de servicio' },
    { codigo: 'INV-COM', descripcion: 'Inversor sin comunicación' },
    { codigo: 'INV-DER', descripcion: 'Inversor con potencia limitada (derating)' },
    { codigo: 'STR-OFF', descripcion: 'String sin corriente' },
    { codigo: 'TRK-MEC', descripcion: 'Tracker detenido o desalineado' },
    { codigo: 'MT-PROT', descripcion: 'Actuación de protección en media tensión' },
    { codigo: 'SCADA', descripcion: 'Pérdida de datos SCADA o meteo' },
    { codigo: 'OTRO', descripcion: 'Otro problema' },
  ],
  fallaCausa: [
    { codigo: 'TARJETA', descripcion: 'Falla de tarjeta de control' },
    { codigo: 'FUSIBLE', descripcion: 'Fusible de potencia quemado' },
    { codigo: 'TEMP', descripcion: 'Sobretemperatura / filtros obstruidos' },
    { codigo: 'AISLAMIENTO', descripcion: 'Falla de aislamiento' },
    { codigo: 'CONECTOR', descripcion: 'Conector MC4 dañado' },
    { codigo: 'COMUNIC', descripcion: 'Módulo o cableado de comunicación (RS-485)' },
    { codigo: 'MECANICA', descripcion: 'Falla mecánica / desgaste' },
    { codigo: 'EXTERNA', descripcion: 'Causa externa (red, clima, terceros)' },
    { codigo: 'DESCONOCIDA', descripcion: 'Causa no identificada' },
  ],
  fallaAccion: [
    { codigo: 'REEMPLAZO', descripcion: 'Reemplazo de componente' },
    { codigo: 'REPARACION', descripcion: 'Reparación en sitio' },
    { codigo: 'REINICIO', descripcion: 'Reinicio / reposición' },
    { codigo: 'AJUSTE', descripcion: 'Ajuste, apriete o limpieza' },
    { codigo: 'CONFIG', descripcion: 'Cambio de configuración o firmware' },
    { codigo: 'ESCALADO', descripcion: 'Escalado a fabricante / garantía' },
  ],
};

/** Motivo de espera implícito para los estados de espera que ya lo indican. */
export function implicitWaitCode(estado: OTEstado): string | undefined {
  if (estado === 'En espera de repuesto') return 'REPUESTO';
  if (estado === 'En espera de cliente') return 'CLIENTE';
  return undefined;
}

export interface FailureCode { problema: string; causa: string; accion: string }

export function requiresFailureCode(tipo: string | undefined): boolean {
  return tipo === 'Correctiva' || tipo === 'Emergencia';
}
