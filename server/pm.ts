/**
 * MÓDULO 17A — Fase 2: generación automática de OTs preventivas desde los planes.
 *
 * Se ejecuta al iniciar el servidor, una vez al día y a pedido (planificación).
 * Idempotente: la tabla pm_generated impide crear dos OTs para el mismo plan y fecha.
 */
import type { Db } from './db';
import { inTransaction } from './db';
import * as repo from './repo';
import { CMMS_KEYS } from './collections';
import { generateDuePmOTs, type PmPlan, type ChecklistTemplate, type Asset } from '../src/domain/cmms';

/** La tabla pm_generated está en el esquema (server/db.ts); se mantiene por compatibilidad. */
export function ensurePmTable(_db: Db) {}

/** Fecha de hoy en la zona horaria de la operación (por defecto Chile), no en UTC. */
export function todayInOperationZone(now = new Date()): string {
  const tz = process.env.ORBI_TZ || 'America/Santiago';
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function runPmGeneration(db: Db, today = todayInOperationZone(), by = 'sistema'): { creadas: string[] } {
  ensurePmTable(db);
  return inTransaction(db, () => {
    const plansRec = repo.getCollection(db, CMMS_KEYS.PLANS);
    if (!plansRec || !Array.isArray(plansRec.data) || plansRec.data.length === 0) return { creadas: [] };
    const templates = (repo.getCollection(db, CMMS_KEYS.TEMPLATES)?.data as ChecklistTemplate[] | undefined) ?? [];
    const assets = (repo.getCollection(db, CMMS_KEYS.ASSETS)?.data as Asset[] | undefined) ?? [];
    const exists = db.prepare('SELECT 1 FROM pm_generated WHERE plan_id = ? AND fecha = ?');
    const { generated, plans } = generateDuePmOTs({
      plans: plansRec.data as PmPlan[],
      templates,
      assets,
      today,
      alreadyGenerated: (planId, fecha) => Boolean(exists.get(planId, fecha)),
      newCode: (plan, fecha) => `PM-${plan.codigo}-${fecha.replace(/-/g, '')}`,
    });
    const creadas: string[] = [];
    const mark = db.prepare('INSERT INTO pm_generated (plan_id, fecha, ot_codigo, created_at) VALUES (?, ?, ?, ?)');
    for (const g of generated) {
      // Si el código ya lo usa otra OT (p. ej. creada a mano), se busca uno libre en vez de omitir la generación
      let codigo = g.ot.codigo;
      for (let n = 2; repo.getOT(db, codigo); n++) codigo = `${g.ot.codigo}-${n}`;
      const ot = {
        ...g.ot,
        codigo,
        lifecycleHistory: [{ estadoNuevo: g.ot.estado, fecha: new Date().toISOString(), usuario: by, comentario: `Generada por el plan preventivo ${g.planId}` }],
        historialCambios: [{ fecha: new Date().toISOString(), usuario: by, accion: 'Generación preventiva', detalle: `Plan ${g.planId}, fecha ${g.fecha}` }],
        approvals: [],
        evidencePack: [],
      };
      repo.insertOT(db, ot, by);
      mark.run(g.planId, g.fecha, ot.codigo, new Date().toISOString());
      creadas.push(ot.codigo);
    }
    if (JSON.stringify(plans) !== JSON.stringify(plansRec.data)) {
      repo.saveCollection(db, CMMS_KEYS.PLANS, plans, plansRec.version, by);
    }
    return { creadas };
  });
}
