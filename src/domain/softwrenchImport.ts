/**
 * MÓDULO 17C — Importación desde SoftWrench / Maximo.
 *
 * Convierte una extracción de SoftWrench (planes, plantillas de checklist, equipos y OTs de una
 * planta) en los maestros y OTs de ORBI. Funciones puras: el servidor las usa para escribir en la
 * base y las pruebas para verificarlas sin datos reales.
 *
 * Reglas:
 *  - Identificadores fijos (sw-…, número de OT de SoftWrench): importar dos veces no duplica nada.
 *  - Lo que ya existe en ORBI no se pisa (se informa como "ya existía").
 *  - Los planes llegan INACTIVOS: mientras SoftWrench siga generando OTs, ORBI no debe crear las mismas.
 *  - Solo se importan OTs abiertas o ejecutadas sin cerrar; las cerradas siguen en SoftWrench.
 */
import type { OT, OTEstado, OTType } from '../types';
import {
  buildChecklistFromTemplates, TOLERANCIA_POR_DEFECTO, addDaysIso, PERIODICIDADES,
  type Asset, type ChecklistTemplate, type PmPlan, type Periodicidad,
} from './cmms';

// ---------------- Formato de la extracción ----------------

export interface SwSnapshot {
  fuente: 'SoftWrench';
  /** Fecha de la extracción (AAAA-MM-DD). */
  extraidoEl: string;
  planta: { nombre: string; plantaId: string };
  equipos: { tag: string; tipo: 'Inversor' | 'Transformador' | 'Celda MT' | 'Estacion Meteo' | 'Otro'; grupo?: string; scadaId?: string }[];
  plantillas: { codigo: string; proposito?: string; preguntas?: { texto: string; tipo?: 'ok_nok' | 'texto' | 'numero'; unidad?: string; min?: number; max?: number }[] }[];
  planes: { pmnum: string; descripcion: string; periodicidad: string; proximaFecha: string | null; plantillas: string[]; tipo?: string }[];
  ots: SwOT[];
}

export interface SwOT {
  wonum: string;
  workorderid?: number;
  description: string;
  status: string;
  worktype: string;
  reportdate?: string | null;
  statusdate?: string | null;
  schedstart?: string | null;
  schedfinish?: string | null;
  targcompdate?: string | null;
  pmnum?: string | null;
  owner?: string | null;
  tecnicosConHoras?: string[];
  horasTotales?: number;
  fechaTerreno?: string | null;
  fechaObjetivoContrato?: string | null;
  cobrable?: boolean;
  link?: string;
}

// ---------------- Mapeos ----------------

/** Estado de SoftWrench → estado de ORBI (null: no se importa). */
export const ESTADO_DESDE_SW: Record<string, OTEstado | null> = {
  WAPPR: 'Nueva',
  APPR: 'Asignada',
  RTBSCH: 'Asignada',
  WSCH: 'Asignada',
  DAPPR: 'Programada',
  INPROG: 'En ejecución',
  INPRG: 'En ejecución',
  HOLD: 'Bloqueada',
  RQARVW: 'En revisión Calidad',
  FDCOMP: 'Finalizada',
  RSALOR: 'En revisión Coordinador',
  COMPL: null,
  COMP: null,
  CLOSE: null,
  CLOSED: null,
  CAN: null,
};

export const TIPO_DESDE_SW: Record<string, OTType> = {
  PM: 'Preventiva',
  CM: 'Correctiva',
  EM: 'Emergencia',
  EC: 'HSE',
  IN: 'Inspección',
};

/** "ESTEBAN.CARRASCO@empresa.cl" → "Esteban Carrasco"; "R.CISTERNA@…" → "R. Cisterna". */
export function nombreDesdeCorreo(correo?: string | null): string {
  if (!correo) return '';
  const local = correo.split('@')[0];
  return local.split(/[._]/).filter(Boolean)
    .map(p => (p.length === 1 ? `${p.toUpperCase()}.` : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
    .join(' ');
}

const fecha = (s?: string | null) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : undefined);
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();

export const ids = {
  activo: (plantaId: string, tag: string) => `sw-${plantaId}-${slug(tag)}`,
  grupo: (plantaId: string, grupo: string) => `sw-${plantaId}-G-${slug(grupo)}`,
  raiz: (plantaId: string) => `sw-${plantaId}-PLANTA`,
  plantilla: (codigo: string) => `sw-tpl-${slug(codigo)}`,
  plan: (pmnum: string) => `sw-pm-${pmnum}`,
};

// ---------------- Construcción ----------------

export interface ResultadoImportacion {
  assets: Asset[];
  templates: ChecklistTemplate[];
  plans: PmPlan[];
  ots: OT[];
  resumen: {
    equipos: { nuevos: number; existentes: number };
    plantillas: { nuevas: number; existentes: number; sinPreguntas: number };
    planes: { nuevos: number; existentes: number; omitidos: string[] };
    ots: { nuevas: number; existentes: number; omitidasCerradas: number; porEstado: Record<string, number> };
    avisos: string[];
  };
}

export interface Existentes {
  assetIds: Set<string>;
  templateIds: Set<string>;
  planIds: Set<string>;
  otCodigos: Set<string>;
  /** Planes que ya existen en ORBI por número (pmnum) → su id; no se duplican. */
  planIdPorCodigo?: Map<string, string>;
}

export function construirImportacion(snap: SwSnapshot, existentes: Existentes, ahora = new Date()): ResultadoImportacion {
  const { plantaId, nombre: plantaNombre } = snap.planta;
  const avisos: string[] = [];
  const importado = ahora.toISOString();

  // Equipos: planta → grupo (si viene) → equipo
  const assets: Asset[] = [];
  const nuevosAssets = (a: Asset) => { if (!existentes.assetIds.has(a.id) && !assets.some(x => x.id === a.id)) assets.push(a); };
  nuevosAssets({ id: ids.raiz(plantaId), plantaId, codigo: plantaNombre.toUpperCase(), nombre: `Planta ${plantaNombre}`, tipo: 'Planta', activo: true });
  for (const e of snap.equipos) {
    const parentId = e.grupo ? ids.grupo(plantaId, e.grupo) : ids.raiz(plantaId);
    if (e.grupo) nuevosAssets({ id: parentId, parentId: ids.raiz(plantaId), plantaId, codigo: slug(e.grupo), nombre: e.grupo, tipo: 'Area', activo: true });
    nuevosAssets({ id: ids.activo(plantaId, e.tag), parentId, plantaId, codigo: e.tag, nombre: `${e.tipo} ${e.tag}`, tipo: e.tipo, activo: true });
  }
  const equiposExistentes = snap.equipos.filter(e => existentes.assetIds.has(ids.activo(plantaId, e.tag))).length;

  // Plantillas: con las preguntas reales cuando la extracción las trae
  const templates: ChecklistTemplate[] = [];
  let sinPreguntas = 0;
  const todasPlantillas = new Map<string, ChecklistTemplate>();
  for (const p of snap.plantillas) {
    const preguntas = p.preguntas ?? [];
    if (!preguntas.length) sinPreguntas++;
    const t: ChecklistTemplate = {
      id: ids.plantilla(p.codigo),
      codigo: p.codigo,
      nombre: p.proposito || p.codigo,
      version: 1,
      activo: true,
      items: preguntas.length
        ? preguntas.map((q, i) => ({ id: `${ids.plantilla(p.codigo)}-${i + 1}`, texto: q.texto, tipo: q.tipo ?? 'ok_nok', unidad: q.unidad, min: q.min, max: q.max }))
        : [{ id: `${ids.plantilla(p.codigo)}-1`, texto: `Completar el formulario ${p.codigo}${p.proposito ? ` (${p.proposito})` : ''}. Sus preguntas aún no se han cargado desde SoftWrench.`, tipo: 'ok_nok' }],
    };
    todasPlantillas.set(t.id, t);
    if (!existentes.templateIds.has(t.id)) templates.push(t);
  }

  // Planes: inactivos (SoftWrench sigue generando las OTs durante el piloto)
  const plans: PmPlan[] = [];
  const omitidos: string[] = [];
  const periodicidadPorPlan = new Map<string, Periodicidad>();
  const planIdDe = new Map<string, string>();
  const hoy = importado.slice(0, 10);
  for (const p of snap.planes) {
    if (!(p.periodicidad in PERIODICIDADES)) {
      omitidos.push(`${p.pmnum} (periodicidad "${p.periodicidad}" no soportada)`);
      continue;
    }
    const periodicidad = p.periodicidad as Periodicidad;
    periodicidadPorPlan.set(p.pmnum, periodicidad);
    const plantillaIds = [...new Set(p.plantillas.map(ids.plantilla))].filter(id => todasPlantillas.has(id));
    if (plantillaIds.length < new Set(p.plantillas).size) avisos.push(`Plan ${p.pmnum}: hay plantillas que no vinieron en la extracción.`);
    const existente = existentes.planIdPorCodigo?.get(p.pmnum);
    if (existente) {
      planIdDe.set(p.pmnum, existente);
      continue;
    }
    planIdDe.set(p.pmnum, ids.plan(p.pmnum));
    const plan: PmPlan = {
      id: ids.plan(p.pmnum),
      codigo: p.pmnum,
      descripcion: p.descripcion.replace(/\s*-\s*$/, ''),
      plantaId,
      plantaNombre,
      periodicidad,
      proximaFecha: fecha(p.proximaFecha) ?? hoy,
      anticipacionDias: 14,
      plantillaIds,
      hhEstimadas: 4,
      requiereAST: false,
      activo: false,
    };
    if (!existentes.planIds.has(plan.id)) plans.push(plan);
  }

  // OTs abiertas y ejecutadas sin cerrar
  const ots: OT[] = [];
  let otExistentes = 0;
  let cerradas = 0;
  const porEstado: Record<string, number> = {};
  for (const w of snap.ots) {
    const estado = ESTADO_DESDE_SW[w.status];
    if (estado === undefined) {
      avisos.push(`OT ${w.wonum}: estado ${w.status} desconocido, no se importó.`);
      continue;
    }
    if (estado === null) { cerradas++; continue; }
    if (existentes.otCodigos.has(w.wonum)) { otExistentes++; continue; }
    porEstado[estado] = (porEstado[estado] ?? 0) + 1;

    const tipo = TIPO_DESDE_SW[w.worktype] ?? 'Correctiva';
    const tecnico = nombreDesdeCorreo(w.tecnicosConHoras?.[0]);
    const coordinador = nombreDesdeCorreo(w.owner);
    const tag = snap.equipos.find(e => new RegExp(`\\b${e.tag.replace(/[-]/g, '[- ]?')}\\b`, 'i').test(w.description));
    const plan = w.pmnum ? snap.planes.find(p => p.pmnum === w.pmnum) : undefined;
    const periodicidad = w.pmnum ? periodicidadPorPlan.get(w.pmnum) : undefined;
    const ejecutada = estado === 'Finalizada' || estado === 'En revisión Coordinador' || estado === 'En revisión Calidad';
    const objetivo = fecha(w.fechaObjetivoContrato);
    const inicio = fecha(w.schedstart) ?? fecha(w.reportdate) ?? hoy;
    const plantillasPlan = plan ? plan.plantillas.map(c => todasPlantillas.get(ids.plantilla(c))).filter((t): t is ChecklistTemplate => Boolean(t)) : [];
    const unicas = [...new Map(plantillasPlan.map(t => [t.id, t])).values()];

    const historial: NonNullable<OT['lifecycleHistory']> = [
      { estadoNuevo: ejecutada ? 'Programada' : estado, fecha: w.reportdate || importado, usuario: 'SoftWrench', comentario: `Importada desde SoftWrench (estado ${w.status})` },
    ];
    if (ejecutada && fecha(w.fechaTerreno)) {
      historial.push({ estadoAnterior: 'Programada', estadoNuevo: 'Finalizada', fecha: w.fechaTerreno!, usuario: tecnico || 'SoftWrench', comentario: 'Ejecutada en terreno (dato de SoftWrench)' });
    }
    if (ejecutada && estado !== 'Finalizada') {
      historial.push({ estadoAnterior: 'Finalizada', estadoNuevo: estado, fecha: w.statusdate || importado, usuario: 'SoftWrench', comentario: `Estado ${w.status} en SoftWrench` });
    }

    const ot = {
      codigo: w.wonum,
      plantaId,
      plantaNombre,
      activo: w.description,
      activoId: tag ? ids.activo(plantaId, tag.tag) : undefined,
      tipo,
      prioridad: 'Media',
      criticidad: 'Media',
      responsable: tecnico,
      tecnicoAsignado: tecnico || undefined,
      coordinador,
      supervisor: '',
      fechaInicio: inicio,
      fechaProgramada: fecha(w.schedstart),
      fechaLimite: fecha(w.targcompdate) ?? fecha(w.schedfinish) ?? inicio,
      fechaObjetivo: objetivo,
      fechaObjetivoLimite: objetivo && periodicidad ? addDaysIso(objetivo, TOLERANCIA_POR_DEFECTO[periodicidad]) : undefined,
      estado,
      avance: ejecutada ? 100 : 0,
      hhEstimadas: 0,
      hhReales: w.horasTotales ?? 0,
      observaciones: `${w.description} (importada desde SoftWrench ${w.wonum}).`,
      diagnosticoInicial: tipo === 'Preventiva' ? undefined : w.description,
      origen: plan ? 'Preventivo programado' : 'Coordinador O&M',
      impacto: 'Bajo',
      riesgoDisponibilidad: 'No aplica',
      cobrable: w.cobrable || undefined,
      pmPlanId: w.pmnum ? planIdDe.get(w.pmnum) : undefined,
      pmFecha: objetivo,
      // Ejecutadas: el checklist, las fotos y los PDF quedaron en SoftWrench
      requiereChecklist: !ejecutada && unicas.length > 0,
      requiereEvidencia: !ejecutada,
      checklistExecution: ejecutada ? [] : buildChecklistFromTemplates(unicas),
      motivoEsperaCodigo: estado === 'Bloqueada' ? 'OTRO' : undefined,
      softwrench: { wonum: w.wonum, workorderid: w.workorderid, estado: w.status, enlace: w.link, importadoEl: importado },
      lifecycleHistory: historial,
      historialCambios: [{ fecha: importado, usuario: 'Importación', accion: 'Importación', detalle: `OT ${w.wonum} importada desde SoftWrench (estado ${w.status}).` }],
      approvals: [],
      evidencePack: [],
    } as unknown as OT;
    ots.push(ot);
  }

  return {
    assets,
    templates,
    plans,
    ots,
    resumen: {
      equipos: { nuevos: assets.filter(a => a.tipo !== 'Planta' && a.tipo !== 'Area').length, existentes: equiposExistentes },
      plantillas: { nuevas: templates.length, existentes: snap.plantillas.length - templates.length, sinPreguntas },
      planes: { nuevos: plans.length, existentes: snap.planes.length - plans.length - omitidos.length, omitidos },
      ots: { nuevas: ots.length, existentes: otExistentes, omitidasCerradas: cerradas, porEstado },
      avisos,
    },
  };
}
