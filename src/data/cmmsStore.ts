/**
 * MÓDULO 17A — Fase 2: lectura de los maestros CMMS desde la copia local (separado de la pantalla
 * de maestros para que Vista Terreno no tenga que descargar esa pantalla).
 */
import { readStorageCollection } from './storage';
import { DEFAULT_CODES, type Asset, type ChecklistTemplate, type PmPlan, type CmmsCodes } from '../domain/cmms';

export const CMMS_STORAGE = {
  ASSETS: 'orbi_cmms_assets_v1',
  TEMPLATES: 'orbi_cmms_checklist_templates_v1',
  PLANS: 'orbi_cmms_pm_plans_v1',
  CODES: 'orbi_cmms_codes_v1',
} as const;

export const loadAssets = () => readStorageCollection<Asset[]>(CMMS_STORAGE.ASSETS, []);
export const loadTemplates = () => readStorageCollection<ChecklistTemplate[]>(CMMS_STORAGE.TEMPLATES, []);
export const loadPlans = () => readStorageCollection<PmPlan[]>(CMMS_STORAGE.PLANS, []);
export const loadCodes = (): CmmsCodes => readStorageCollection<CmmsCodes[]>(CMMS_STORAGE.CODES, [DEFAULT_CODES])[0] ?? DEFAULT_CODES;

