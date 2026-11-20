/**
 * MÓDULO 17D — Alarmas del SCADA (VCOM / Meteocontrol) → correctivos.
 *
 * El portal O&M de TriTec entrega las alarmas de VCOM por planta (`GET /api/v1/vcom/alarms`).
 * Esta regla decide qué alarmas generan un correctivo en ORBI:
 *  - Solo severidad high o critical (configurable) y abiertas al menos 30 minutos (evita fallas pasajeras).
 *  - Una alarma genera una sola OT (se guarda su id en la OT).
 *  - Si el mismo equipo ya tiene un correctivo abierto creado por alarma, la alarma se agrega a esa OT.
 *  - El correctivo nace "Nueva" (Espera aprobación): coordinación lo revisa en "Por aprobar".
 * Funciones puras: el servidor las usa con las alarmas reales y las pruebas con alarmas inventadas.
 */
import type { OT, OTPrioridad } from '../types';
import { softwrenchCodeOf } from './otStateMachine';
import type { Asset } from './cmms';

export type SeveridadAlarma = 'normal' | 'high' | 'critical';

export interface AlarmaVcom {
  id: string;
  systemKey: string;
  severidad: SeveridadAlarma;
  abierta: boolean;
  inicio: string;
  fin?: string;
  titulo: string;
  /** Nombre o tag del equipo (p. ej. GI-106), si VCOM lo informa. */
  equipo?: string;
}

export interface ReglaAlarmas {
  severidades: SeveridadAlarma[];
  minutosMinimos: number;
  prioridad: Record<SeveridadAlarma, OTPrioridad>;
}

export const REGLA_POR_DEFECTO: ReglaAlarmas = {
  severidades: ['high', 'critical'],
  minutosMinimos: 30,
  prioridad: { normal: 'Baja', high: 'Media', critical: 'Alta' },
};

/** Datos de alarma guardados en la OT que generó o agrupó. */
export interface AlarmaEnOT {
  id: string;
  systemKey: string;
  severidad: SeveridadAlarma;
  titulo: string;
  inicio: string;
  equipo?: string;
}

const texto = (...vals: unknown[]) => {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return undefined;
};

/**
 * Normaliza una alarma tal como la entrega VCOM a través del portal. Acepta los nombres de campo
 * habituales de la API de VCOM; si llega en otro formato, devuelve null y el servidor lo informa.
 */
export function normalizarAlarma(raw: unknown, systemKey: string): AlarmaVcom | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = r.id ?? r.alarmId ?? r.alarm_id;
  if (id === undefined || id === null || id === '') return null;
  const sev = String(texto(r.severity, r.severidad) ?? '').toLowerCase();
  const severidad: SeveridadAlarma = sev === 'critical' ? 'critical' : sev === 'high' ? 'high' : 'normal';
  const inicio = texto(r.startedAt, r.startTime, r.start, r.timestamp, r.createdAt, r.created_at);
  if (!inicio) return null;
  const fin = texto(r.endedAt, r.endTime, r.end, r.closedAt);
  const estado = String(texto(r.status, r.estado) ?? (fin ? 'closed' : 'open')).toLowerCase();
  const comp = Array.isArray(r.components) ? (r.components[0] as Record<string, unknown> | undefined) : (r.component as Record<string, unknown> | undefined);
  const equipo = texto(comp?.name, comp?.abbreviation, r.deviceName, r.device, r.componentName);
  return {
    id: String(id),
    systemKey: texto(r.systemKey) ?? systemKey,
    severidad,
    abierta: estado === 'open',
    inicio,
    fin,
    titulo: texto(r.title, r.description, r.message, r.type, r.alarmType) ?? 'Alarma de VCOM',
    equipo,
  };
}

const abiertaOT = (ot: OT) => !['CLOSED', 'CAN'].includes(softwrenchCodeOf(ot.estado) ?? '');
const mismoEquipo = (a?: string, b?: string) => Boolean(a && b && a.replace(/\s+/g, '').toUpperCase() === b.replace(/\s+/g, '').toUpperCase());

export interface PlanAlarmas {
  /** Cada grupo genera un correctivo: alarmas del mismo equipo que llegaron juntas. */
  crear: AlarmaVcom[][];
  agregar: { ot: OT; alarma: AlarmaVcom }[];
  ignorar: { alarma: AlarmaVcom; motivo: string }[];
}

/** Decide qué hacer con cada alarma de una planta. */
export function planificarAlarmas(alarmas: AlarmaVcom[], otsPlanta: OT[], regla: ReglaAlarmas = REGLA_POR_DEFECTO, ahora = new Date()): PlanAlarmas {
  const plan: PlanAlarmas = { crear: [], agregar: [], ignorar: [] };
  const conocidas = new Set(otsPlanta.flatMap(o => (o.alarmasOrigen ?? []).map(a => `${a.systemKey}:${a.id}`)));
  const grupoPorEquipo = new Map<string, AlarmaVcom[]>();
  for (const a of alarmas) {
    if (conocidas.has(`${a.systemKey}:${a.id}`)) { plan.ignorar.push({ alarma: a, motivo: 'ya tiene OT' }); continue; }
    if (!a.abierta) { plan.ignorar.push({ alarma: a, motivo: 'cerrada en VCOM' }); continue; }
    if (!regla.severidades.includes(a.severidad)) { plan.ignorar.push({ alarma: a, motivo: `severidad ${a.severidad}` }); continue; }
    const minutos = (ahora.getTime() - Date.parse(a.inicio)) / 60_000;
    if (!(minutos >= regla.minutosMinimos)) { plan.ignorar.push({ alarma: a, motivo: `abierta hace menos de ${regla.minutosMinimos} min` }); continue; }
    // Mismo equipo con un correctivo de alarma aún abierto: se agrega a esa OT
    const ot = a.equipo ? otsPlanta.find(o => abiertaOT(o) && (o.alarmasOrigen ?? []).some(x => mismoEquipo(x.equipo, a.equipo))) : undefined;
    if (ot) { plan.agregar.push({ ot, alarma: a }); continue; }
    const grupo = a.equipo ? grupoPorEquipo.get(a.equipo.replace(/\s+/g, '').toUpperCase()) : undefined;
    if (grupo) { grupo.push(a); continue; }
    const nuevo = [a];
    if (a.equipo) grupoPorEquipo.set(a.equipo.replace(/\s+/g, '').toUpperCase(), nuevo);
    plan.crear.push(nuevo);
  }
  return plan;
}

const enOT = (a: AlarmaVcom): AlarmaEnOT => ({ id: a.id, systemKey: a.systemKey, severidad: a.severidad, titulo: a.titulo, inicio: a.inicio, equipo: a.equipo });

/** Correctivo nuevo desde un grupo de alarmas (la primera y las del mismo equipo que llegaron junto con ella). */
export function correctivoDesdeAlarma(
  todas: AlarmaVcom[], planta: { plantaId: string; plantaNombre: string; coordinador?: string; supervisor?: string },
  assets: Asset[], codigo: string, regla: ReglaAlarmas = REGLA_POR_DEFECTO, ahora = new Date(),
): OT {
  const a = todas.reduce((m, x) => (x.severidad === 'critical' && m.severidad !== 'critical' ? x : m), todas[0]);
  const activo = a.equipo ? assets.find(x => x.plantaId === planta.plantaId && mismoEquipo(x.codigo, a.equipo)) : undefined;
  const hoy = ahora.toISOString().slice(0, 10);
  const prioridad = regla.prioridad[a.severidad];
  const fecha = ahora.toISOString();
  return {
    codigo,
    plantaId: planta.plantaId,
    plantaNombre: planta.plantaNombre,
    activo: a.equipo ? `${a.equipo} — ${a.titulo}` : a.titulo,
    activoId: activo?.id,
    tipo: 'Correctiva',
    prioridad,
    criticidad: prioridad,
    responsable: '',
    coordinador: planta.coordinador ?? '',
    supervisor: planta.supervisor ?? '',
    fechaInicio: hoy,
    fechaLimite: hoy,
    estado: 'Nueva',
    avance: 0,
    hhEstimadas: 0,
    hhReales: 0,
    observaciones: `Creada automáticamente por ${todas.length === 1 ? 'una alarma' : `${todas.length} alarmas`} de VCOM: ${todas.map(x => `${x.titulo} (${x.severidad}, desde ${x.inicio})`).join('; ')}.`,
    diagnosticoInicial: a.titulo,
    origen: 'Centro de Control',
    impacto: a.severidad === 'critical' ? 'Alto' : 'Medio',
    riesgoDisponibilidad: a.severidad === 'critical' ? 'Riesgo alto' : 'En observación',
    requiereEvidencia: true,
    reportadoPor: 'Alarma VCOM',
    alarmasOrigen: todas.map(enOT),
    lifecycleHistory: [{ estadoNuevo: 'Nueva', fecha, usuario: 'Alarmas VCOM', comentario: `Correctivo creado por alarma ${a.id}` }],
    historialCambios: [{ fecha, usuario: 'Alarmas VCOM', accion: 'Creación', detalle: `Correctivo creado por ${todas.length} alarma(s) de VCOM` }],
    approvals: [],
    evidencePack: [],
  } as OT;
}

/** Agrega una alarma nueva del mismo equipo a un correctivo ya abierto. */
export function agregarAlarma(ot: OT, a: AlarmaVcom, ahora = new Date()): OT {
  return {
    ...ot,
    alarmasOrigen: [...(ot.alarmasOrigen ?? []), enOT(a)],
    historialCambios: [...(ot.historialCambios ?? []), { fecha: ahora.toISOString(), usuario: 'Alarmas VCOM', accion: 'Alarma agregada', detalle: `${a.titulo} (${a.severidad}, desde ${a.inicio})` }],
  };
}

/** Código del correctivo: AL-<planta>-<id de alarma>, único y estable. */
export function codigoAlarma(a: AlarmaVcom): string {
  return `AL-${a.systemKey}-${a.id}`.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 40);
}
