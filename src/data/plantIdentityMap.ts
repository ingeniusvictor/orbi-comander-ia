/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MASTER_PLANTS_DATA } from './masterPlantsData';
import { Planta } from '../types';

/**
 * MÓDULO 16B.1E — PLANT IDENTITY CONTRACT HARDENING & ANALYTICS NAMESPACE SEPARATION
 * 
 * Contrato estricto de clasificación de equivalencias entre identidades legacy (P01 - P14)
 * y el catastro maestro de 59 plantas canónicas (ORBI-PV-001 a ORBI-PV-059).
 */

export type ResolutionStatus =
  | 'RESOLVED_EXACT'
  | 'RESOLVED_ALIAS'
  | 'RESOLVED_BY_UNIQUE_COMMUNE'
  | 'PROVISIONAL'
  | 'UNRESOLVED'
  | 'HISTORICAL_EXTERNAL';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type PlantRecordScope =
  | 'MASTER_PORTFOLIO'
  | 'LEGACY_DEMO'
  | 'BENCHMARK_EXTERNAL';

export interface EvidenceSource {
  type: 'REPOSITORY' | 'USER_CONFIRMED' | 'DOCUMENT' | 'EXTERNAL_REFERENCE';
  reference: string;
}

export interface PlantMappingEntry {
  legacyPlantId: string;
  legacyPlantName: string;
  canonicalPlantId?: string;
  canonicalPlantName?: string;
  candidateCanonicalPlantIds?: string[];
  resolutionStatus: ResolutionStatus;
  confidence: ConfidenceLevel;
  evidence: string[];
  evidenceSources?: EvidenceSource[];
  manualConfirmationRequired?: boolean;
  contradictions?: string[];
  pendingInformation?: string;
  reviewedAt: string;
  reviewedBy: string;
}

export interface PlantBadgeInfo {
  label: string;
  tooltip: string;
  severity: 'info' | 'warning' | 'danger' | 'success' | 'neutral';
  styleToken: string;
}

/**
 * Registro maestro de equivalencias basado en evidencia estricta y auditoría Módulo 16B.1E.
 */
export const PLANT_MAPPING_REGISTRY: Record<string, PlantMappingEntry> = {
  'P01': {
    legacyPlantId: 'P01',
    legacyPlantName: 'Atacama Solar',
    resolutionStatus: 'PROVISIONAL',
    confidence: 'LOW',
    candidateCanonicalPlantIds: [],
    manualConfirmationRequired: true,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Initial demo dataset legacyPlantId P01' }
    ],
    evidence: [
      'Referencia "Atacama Solar" en dataset original.',
      'Sin evidencia ratificada en terreno para selección de candidato canónico unívoco.'
    ],
    pendingInformation: 'Confirmación de comuna y georreferenciación en terreno.',
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P02': {
    legacyPlantId: 'P02',
    legacyPlantName: 'Luz del Norte',
    resolutionStatus: 'HISTORICAL_EXTERNAL',
    confidence: 'MEDIUM',
    manualConfirmationRequired: true,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Initial demo dataset legacyPlantId P02 (Utility 100 MW Copiapó)' }
    ],
    evidence: [
      'Planta utility solar de 100 MW ("Luz del Norte" en Copiapó / III Región).',
      'No forma parte del catastro activo de 59 plantas PMGD/Utility de la cartera Master DATA.'
    ],
    pendingInformation: 'Registro histórico/externo fuera del portafolio activo de 59 plantas.',
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P03': {
    legacyPlantId: 'P03',
    legacyPlantName: 'Quillagua Solar',
    resolutionStatus: 'HISTORICAL_EXTERNAL',
    confidence: 'MEDIUM',
    manualConfirmationRequired: true,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Initial demo dataset legacyPlantId P03 (Utility 103 MW María Elena)' }
    ],
    evidence: [
      'Planta utility solar de 103 MW ("Quillagua Solar" en María Elena / Antofagasta).',
      'Fuera del catastro activo de 59 plantas del portafolio PMGD de Master DATA.'
    ],
    pendingInformation: 'Registro histórico/externo fuera del portafolio activo de 59 plantas.',
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P04': {
    legacyPlantId: 'P04',
    legacyPlantName: 'Pelícano Solar',
    resolutionStatus: 'PROVISIONAL',
    confidence: 'LOW',
    candidateCanonicalPlantIds: [],
    manualConfirmationRequired: true,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Initial demo dataset legacyPlantId P04' }
    ],
    evidence: [
      'Planta en IV Región de Coquimbo (La Higuera).',
      'Sin candidatos ratificados con evidencia documental o técnica unívoca.'
    ],
    pendingInformation: 'Confirmación de coordenada UTM y titular en terreno.',
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P05': {
    legacyPlantId: 'P05',
    legacyPlantName: 'Santiago Solar',
    resolutionStatus: 'PROVISIONAL',
    confidence: 'LOW',
    candidateCanonicalPlantIds: ['ORBI-PV-006', 'ORBI-PV-007'],
    manualConfirmationRequired: true,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Initial demo dataset legacyPlantId P05 Tiltil reference' }
    ],
    evidence: [
      'Ruta logística V02 especifica "Santiago - Tiltil".'
    ],
    contradictions: [
      'En Tiltil existen dos plantas PMGD en Master DATA: ORBI-PV-006 (Clementina) y ORBI-PV-007 (TIL-TIL), impidiendo la resolución unívoca sin inspección.'
    ],
    pendingInformation: 'Verificación de empalme y nombre técnico en terreno.',
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P06': {
    legacyPlantId: 'P06',
    legacyPlantName: 'El Totihue Solar',
    resolutionStatus: 'PROVISIONAL',
    confidence: 'LOW',
    candidateCanonicalPlantIds: [],
    manualConfirmationRequired: true,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Initial demo dataset legacyPlantId P06' }
    ],
    evidence: [
      'Planta en VI Región del O\'Higgins.',
      'Sin candidato confirmado por falta de fuente documental original verificable en repositorio.'
    ],
    pendingInformation: 'Confirmación de número de cliente CGE y coordenadas.',
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P07': {
    legacyPlantId: 'P07',
    legacyPlantName: 'Maule Solar',
    resolutionStatus: 'PROVISIONAL',
    confidence: 'LOW',
    candidateCanonicalPlantIds: [],
    manualConfirmationRequired: true,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Initial demo dataset legacyPlantId P07' }
    ],
    evidence: [
      'Denominación regional "Maule Solar" para zona VII Región.',
      'Sin asignación de candidato canónico por falta de ratificación unívoca.'
    ],
    pendingInformation: 'Definición de planta específica en orden de servicio.',
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P08': {
    legacyPlantId: 'P08',
    legacyPlantName: 'Ñuble Solar',
    resolutionStatus: 'PROVISIONAL',
    confidence: 'LOW',
    candidateCanonicalPlantIds: [],
    manualConfirmationRequired: true,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Initial demo dataset legacyPlantId P08' }
    ],
    evidence: [
      'Denominación regional "Ñuble Solar" en dataset original (0 registros activos).',
      'Mapeo preventivo sin registros activos en datasets.'
    ],
    pendingInformation: 'Mapeo preventivo sin registros activos en datasets.',
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P09': {
    legacyPlantId: 'P09',
    legacyPlantName: 'Biobío del Sol',
    resolutionStatus: 'PROVISIONAL',
    confidence: 'LOW',
    candidateCanonicalPlantIds: [],
    manualConfirmationRequired: true,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Initial demo dataset legacyPlantId P09' }
    ],
    evidence: [
      'Denominación regional "Biobío del Sol" en VIII Región.',
      'Sin candidatos confirmados por falta de acta de sincronismo CEN.'
    ],
    pendingInformation: 'Verificación de acta de sincronismo CEN en terreno.',
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P10': {
    legacyPlantId: 'P10',
    legacyPlantName: 'Cantillana',
    canonicalPlantId: 'ORBI-PV-058',
    canonicalPlantName: 'Cantillana',
    resolutionStatus: 'RESOLVED_EXACT',
    confidence: 'HIGH',
    manualConfirmationRequired: false,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Exact name match in MASTER_PLANTS_DATA ORBI-PV-058 & Cantillana master case' }
    ],
    evidence: [
      'Coincidencia de nombre exacto "Cantillana" en Master DATA (ORBI-PV-058).',
      'Ubicación Paine / RM y caso maestro O&M Cantillana.'
    ],
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P11': {
    legacyPlantId: 'P11',
    legacyPlantName: 'Parral',
    canonicalPlantId: 'ORBI-PV-026',
    canonicalPlantName: 'Esmeralda (Bicentenario II)',
    resolutionStatus: 'RESOLVED_BY_UNIQUE_COMMUNE',
    confidence: 'HIGH',
    manualConfirmationRequired: false,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Unique commune match Parral in MASTER_PLANTS_DATA ORBI-PV-026' }
    ],
    evidence: [
      'Comuna única "Parral" en la VII Región del Maule que coincide con la única planta registrada en Parral en Master DATA (ORBI-PV-026 Esmeralda).'
    ],
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P12': {
    legacyPlantId: 'P12',
    legacyPlantName: 'Alhué',
    canonicalPlantId: 'ORBI-PV-038',
    canonicalPlantName: 'Alhué',
    resolutionStatus: 'RESOLVED_EXACT',
    confidence: 'HIGH',
    manualConfirmationRequired: false,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Exact name match in MASTER_PLANTS_DATA ORBI-PV-038' }
    ],
    evidence: [
      'Coincidencia de nombre exacto "Alhué" en Master DATA (ORBI-PV-038).'
    ],
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P13': {
    legacyPlantId: 'P13',
    legacyPlantName: 'Venezia',
    canonicalPlantId: 'ORBI-PV-024',
    canonicalPlantName: 'PMG Venezia',
    resolutionStatus: 'RESOLVED_ALIAS',
    confidence: 'MEDIUM',
    manualConfirmationRequired: true,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Alias match Venezia / PMG Venezia ORBI-PV-024' }
    ],
    evidence: [
      'Coincidencia de alias exacto "Venezia" / "PMG Venezia" en Master DATA (ORBI-PV-024).'
    ],
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
  'P14': {
    legacyPlantId: 'P14',
    legacyPlantName: 'Tricague',
    canonicalPlantId: 'ORBI-PV-011',
    canonicalPlantName: 'Tricahue',
    resolutionStatus: 'RESOLVED_ALIAS',
    confidence: 'MEDIUM',
    manualConfirmationRequired: true,
    evidenceSources: [
      { type: 'REPOSITORY', reference: 'Phonetic alias match Tricague / Tricahue ORBI-PV-011' }
    ],
    evidence: [
      'Coincidencia de alias/variante fonética "Tricague" / "Tricahue" en Master DATA (ORBI-PV-011).'
    ],
    reviewedAt: '2026-08-05',
    reviewedBy: 'ORBI Quality Audit Team 16B.1E'
  },
};

const masterPlantsMap = new Map<string, Planta>(
  MASTER_PLANTS_DATA.map((p) => [p.orbi_id, p])
);

/**
 * Validador automático de candidatos canónicos contra evidencia y master DATA.
 */
export function validateCandidateCanonicalPlantIds(entry: PlantMappingEntry): string[] {
  const errors: string[] = [];
  if (!entry.candidateCanonicalPlantIds || entry.candidateCanonicalPlantIds.length === 0) {
    return errors;
  }
  const seen = new Set<string>();
  entry.candidateCanonicalPlantIds.forEach((cid) => {
    if (seen.has(cid)) {
      errors.push(`[Candidato Duplicado] ${entry.legacyPlantId}: Candidato ${cid} está duplicado.`);
    }
    seen.add(cid);

    const masterPlant = MASTER_PLANTS_DATA.find((p) => p.orbi_id === cid);
    if (!masterPlant) {
      errors.push(`[Candidato Inexistente] ${entry.legacyPlantId}: Candidato ${cid} no existe en MASTER_PLANTS_DATA.`);
      return;
    }

    if (entry.legacyPlantId === 'P01') {
      const reg = (masterPlant.region || '').toLowerCase();
      if (!reg.includes('atacama') && !reg.includes('iii')) {
        errors.push(`[Candidato Inválido] P01 Atacama Solar: Candidato ${cid} (${masterPlant.name}, ${masterPlant.commune}, ${masterPlant.region}) no pertenece a III Región de Atacama.`);
      }
    } else if (entry.legacyPlantId === 'P04') {
      const reg = (masterPlant.region || '').toLowerCase();
      if (!reg.includes('coquimbo') && !reg.includes('iv')) {
        errors.push(`[Candidato Inválido] P04 Pelícano Solar: Candidato ${cid} (${masterPlant.name}, ${masterPlant.commune}, ${masterPlant.region}) no pertenece a IV Región de Coquimbo.`);
      }
    } else if (entry.legacyPlantId === 'P05') {
      const com = (masterPlant.commune || '').toLowerCase();
      if (!com.includes('til til') && !com.includes('tiltil')) {
        errors.push(`[Candidato Inválido] P05 Santiago Solar: Candidato ${cid} (${masterPlant.name}, ${masterPlant.commune}) no pertenece a comuna Til Til.`);
      }
    } else if (entry.legacyPlantId === 'P06') {
      const reg = (masterPlant.region || '').toLowerCase();
      if (!reg.includes('o\'higgins') && !reg.includes('vi')) {
        errors.push(`[Candidato Inválido] P06 El Totihue: Candidato ${cid} (${masterPlant.name}, ${masterPlant.commune}, ${masterPlant.region}) no pertenece a VI Región del O'Higgins.`);
      }
    } else if (entry.legacyPlantId === 'P07') {
      const reg = (masterPlant.region || '').toLowerCase();
      if (!reg.includes('maule') && !reg.includes('vii')) {
        errors.push(`[Candidato Inválido] P07 Maule Solar: Candidato ${cid} (${masterPlant.name}, ${masterPlant.commune}, ${masterPlant.region}) no pertenece a VII Región del Maule.`);
      }
    } else if (entry.legacyPlantId === 'P08') {
      const reg = (masterPlant.region || '').toLowerCase();
      if (!reg.includes('ñuble') && !reg.includes('xvi')) {
        errors.push(`[Candidato Inválido] P08 Ñuble Solar: Candidato ${cid} (${masterPlant.name}, ${masterPlant.commune}, ${masterPlant.region}) no pertenece a Región del Ñuble.`);
      }
    } else if (entry.legacyPlantId === 'P09') {
      const reg = (masterPlant.region || '').toLowerCase();
      if (!reg.includes('biobío') && !reg.includes('biobio') && !reg.includes('viii')) {
        errors.push(`[Candidato Inválido] P09 Biobío del Sol: Candidato ${cid} (${masterPlant.name}, ${masterPlant.commune}, ${masterPlant.region}) no pertenece a Región del Biobío.`);
      }
    }
  });
  return errors;
}

/**
 * Resuelve el scope técnico del registro (MASTER_PORTFOLIO, LEGACY_DEMO, BENCHMARK_EXTERNAL).
 */
export function getPlantRecordScope(item: {
  plantaId?: string;
  legacyPlantId?: string;
  plantaNombre?: string;
  recordScope?: PlantRecordScope;
}): PlantRecordScope {
  if (item.recordScope) return item.recordScope;

  const pid = (item.plantaId || item.legacyPlantId || '').trim();
  const pName = (item.plantaNombre || '').trim();

  // 1. Synthetic Benchmark detection (MUST start with BENCH-)
  if (
    pid.startsWith('BENCH-PLANT-') || 
    pid.startsWith('BENCH-WO-') || 
    pid.startsWith('BENCH-') ||
    pName.startsWith('BENCH-')
  ) {
    return 'BENCHMARK_EXTERNAL';
  }

  // 2. Master Portfolio detection
  const canonicalId = getCanonicalPlantId(pid) || getCanonicalPlantId(pName);
  if (canonicalId) {
    return 'MASTER_PORTFOLIO';
  }

  // 3. Operational Legacy / Historical Demo records (P01-P14, or any operational Pxx / ORBI-PV-xxx)
  // Operational entries (including P02, P03, HISTORICAL_EXTERNAL, PROVISIONAL) are LEGACY_DEMO
  return 'LEGACY_DEMO';
}

/**
 * Obtiene la información estructurada para badges visuales reutilizables.
 */
export function getPlantBadgeInfo(
  legacyIdOrName?: string,
  plantaId?: string,
  scope?: PlantRecordScope
): PlantBadgeInfo {
  const pid = (plantaId || legacyIdOrName || '').trim();
  const currentScope = scope || getPlantRecordScope({ plantaId, legacyPlantId: legacyIdOrName });

  if (currentScope === 'BENCHMARK_EXTERNAL' || pid.startsWith('BENCH-')) {
    return {
      label: 'BENCHMARK SANDBOX',
      tooltip: 'Registro estático de demostración analítica Power BI / Parque externo',
      severity: 'info',
      styleToken: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
    };
  }

  const canonicalId = getCanonicalPlantId(plantaId) || getCanonicalPlantId(legacyIdOrName);
  if (canonicalId && currentScope === 'MASTER_PORTFOLIO') {
    return {
      label: 'PLANTA MASTER CONFIRMADA',
      tooltip: `Vinculada unívocamente a planta canónica master ${canonicalId}`,
      severity: 'success',
      styleToken: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
    };
  }

  const entry = getPlantMappingEntry(legacyIdOrName || plantaId);
  if (entry) {
    if (entry.resolutionStatus === 'HISTORICAL_EXTERNAL') {
      return {
        label: 'REFERENCIA HISTÓRICA / EXTERNA',
        tooltip: 'Planta históricamente documentada fuera de las 38 plantas activas master',
        severity: 'neutral',
        styleToken: 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
      };
    }
    if (entry.resolutionStatus === 'PROVISIONAL') {
      return {
        label: 'MAPEO PENDIENTE DE VALIDACIÓN',
        tooltip: 'Referencia provisional pendiente de ratificación de comuna/georeferencia en terreno',
        severity: 'warning',
        styleToken: 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
      };
    }
  }

  return {
    label: 'REFERENCIA LEGACY NO VINCULADA',
    tooltip: 'Identidad legacy sin mapeo directo en el registro maestro',
    severity: 'warning',
    styleToken: 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
  };
}

/**
 * Obtiene la entrada de mapeo del registro de identidades.
 */
export function getPlantMappingEntry(legacyIdOrName?: string): PlantMappingEntry | undefined {
  if (!legacyIdOrName) return undefined;
  const key = legacyIdOrName.trim();
  if (PLANT_MAPPING_REGISTRY[key]) return PLANT_MAPPING_REGISTRY[key];

  const lower = key.toLowerCase();
  for (const entry of Object.values(PLANT_MAPPING_REGISTRY)) {
    if (
      entry.legacyPlantId.toLowerCase() === lower ||
      entry.legacyPlantName.toLowerCase() === lower ||
      (entry.canonicalPlantName && entry.canonicalPlantName.toLowerCase() === lower) ||
      (entry.canonicalPlantId && entry.canonicalPlantId.toLowerCase() === lower)
    ) {
      return entry;
    }
  }
  return undefined;
}

/**
 * Resuelve el ID canónico (ORBI-PV-xxx) ÚNICAMENTE cuando existe evidencia resolutiva.
 * Si es un registro PROVISIONAL, UNRESOLVED o HISTORICAL_EXTERNAL, retorna undefined.
 */
export function getCanonicalPlantId(legacyIdOrName?: string): string | undefined {
  if (!legacyIdOrName) return undefined;
  const cleanKey = legacyIdOrName.trim();

  // 1. Si ya es una clave canónica directa ORBI-PV-xxx válida
  if (/^ORBI-PV-\d{3}$/i.test(cleanKey)) {
    const formatted = cleanKey.toUpperCase();
    if (masterPlantsMap.has(formatted)) return formatted;
  }

  // 2. Coincidencia directa en Master DATA por id, name, plant_name, public_name_cen, aliases
  const lowerKey = cleanKey.toLowerCase();
  for (const plant of MASTER_PLANTS_DATA) {
    if (
      plant.orbi_id.toLowerCase() === lowerKey ||
      (plant.id && plant.id.toLowerCase() === lowerKey) ||
      (plant.name && plant.name.toLowerCase() === lowerKey) ||
      (plant.plant_name && plant.plant_name.toLowerCase() === lowerKey) ||
      (plant.public_name_cen && plant.public_name_cen.toLowerCase() === lowerKey) ||
      (plant.aliases && plant.aliases.some(a => a.toLowerCase() === lowerKey))
    ) {
      return plant.orbi_id;
    }
  }

  // 3. Revisar registro explícito de equivalencias (PLANT_MAPPING_REGISTRY)
  const entry = getPlantMappingEntry(cleanKey);
  if (
    entry &&
    entry.canonicalPlantId &&
    ['RESOLVED_EXACT', 'RESOLVED_ALIAS', 'RESOLVED_BY_UNIQUE_COMMUNE'].includes(entry.resolutionStatus)
  ) {
    return entry.canonicalPlantId;
  }

  return undefined;
}

/**
 * Obtiene el objeto Planta canónico si fue resuelto.
 */
export function getCanonicalPlant(legacyIdOrName?: string): Planta | undefined {
  const canonicalId = getCanonicalPlantId(legacyIdOrName);
  return canonicalId ? masterPlantsMap.get(canonicalId) : undefined;
}

/**
 * Obtiene el nombre visible de la planta.
 * Retorna el nombre canónico si fue resuelto, o el nombre legacy original si es provisional.
 */
export function getCanonicalPlantName(legacyIdOrName?: string): string {
  const plant = getCanonicalPlant(legacyIdOrName);
  if (plant) return plant.name || plant.plant_name || legacyIdOrName || 'Planta No Especificada';

  const entry = getPlantMappingEntry(legacyIdOrName);
  if (entry) return entry.canonicalPlantName || entry.legacyPlantName;

  return legacyIdOrName || 'Planta No Especificada';
}

/**
 * Indica si una referencia de planta es provisional o pendiente de validación.
 */
export function isPlantMappingProvisional(legacyIdOrName?: string): boolean {
  if (!legacyIdOrName) return false;

  if (getCanonicalPlantId(legacyIdOrName)) return false;

  const entry = getPlantMappingEntry(legacyIdOrName);
  if (entry) {
    return ['PROVISIONAL', 'UNRESOLVED', 'HISTORICAL_EXTERNAL'].includes(entry.resolutionStatus);
  }
  return false;
}

export function getPlantResolutionStatus(legacyIdOrName?: string): ResolutionStatus {
  if (!legacyIdOrName) return 'UNRESOLVED';
  if (getCanonicalPlantId(legacyIdOrName)) {
    const entry = getPlantMappingEntry(legacyIdOrName);
    return entry?.resolutionStatus || 'RESOLVED_EXACT';
  }
  const entry = getPlantMappingEntry(legacyIdOrName);
  return entry?.resolutionStatus || 'UNRESOLVED';
}

export interface PlantRecordAuditItem {
  recordId: string;
  legacyPlantId?: string;
  plantaIdActual: string;
  plantaNombreActual: string;
  resolutionStatus: ResolutionStatus;
  recordScope: PlantRecordScope;
  canonicalPlantId?: string;
  canonicalPlantName?: string;
  hasObsoleteFields?: boolean;
}

export interface PlantIdentityIntegrityReport {
  timestamp: string;
  version: string;
  totalAuditados: number;
  totalPorDataset: Record<string, number>;
  totalPorScope: Record<PlantRecordScope, number>;
  totalPorResolutionStatus: Record<ResolutionStatus, number>;
  
  // Alias / Top-level helper properties
  summaryP01P14: Array<{
    legacyPlantId: string;
    legacyPlantName: string;
    canonicalPlantId?: string;
    canonicalPlantName?: string;
    resolutionStatus: ResolutionStatus;
    confidence: ConfidenceLevel;
    candidateCanonicalPlantIds?: string[];
    evidenceSources?: EvidenceSource[];
    recordCount: number;
  }>;
  scopeBreakdown: Record<PlantRecordScope, number>;
  ruleErrors: string[];

  legacyReconciliationCohort: {
    totalAuditados: number;
    totalPorLegacyPlantId: Record<string, number>;
    itemsP01P14: PlantRecordAuditItem[];
    summaryP01P14: Array<{
      legacyPlantId: string;
      legacyPlantName: string;
      canonicalPlantId?: string;
      canonicalPlantName?: string;
      resolutionStatus: ResolutionStatus;
      confidence: ConfidenceLevel;
      candidateCanonicalPlantIds?: string[];
      evidenceSources?: EvidenceSource[];
      recordCount: number;
    }>;
  };
  
  canonicalPortfolioRecords: {
    total: number;
    items: PlantRecordAuditItem[];
  };
  
  benchmarkExternalRecords: {
    total: number;
    items: PlantRecordAuditItem[];
  };
  
  unknownRecords: {
    total: number;
    items: PlantRecordAuditItem[];
  };

  registrosPorDataset: Record<string, PlantRecordAuditItem[]>;
  isValid: boolean;
  validationErrors: string[];
}

/**
 * MÓDULO 16B.1E: Función central para auditoría de contrato e integridad de datos.
 */
export function generatePlantIdentityIntegrityReport(customDatasets?: {
  ots?: any[];
  hse?: any[];
  planificacion?: any[];
  inventory?: any[];
  movements?: any[];
  ptws?: any[];
  vehiculos?: any[];
}): PlantIdentityIntegrityReport {
  const validationErrors: string[] = [];

  // Validar candidatos del registro
  Object.values(PLANT_MAPPING_REGISTRY).forEach((entry) => {
    const candErrors = validateCandidateCanonicalPlantIds(entry);
    validationErrors.push(...candErrors);
  });

  const resultDatasets = {
    ots: customDatasets?.ots || [],
    hse: customDatasets?.hse || [],
    planificacion: customDatasets?.planificacion || [],
    inventory: customDatasets?.inventory || [],
    movements: customDatasets?.movements || [],
    ptws: customDatasets?.ptws || [],
    vehiculos: (customDatasets?.vehiculos || []).filter((v: any) => v.plantaDestinoId || v.plantaDestinoNombre)
  };

  const totalPorDataset: Record<string, number> = {
    ots: resultDatasets.ots.length,
    hse: resultDatasets.hse.length,
    planificacion: resultDatasets.planificacion.length,
    inventory: resultDatasets.inventory.length,
    movements: resultDatasets.movements.length,
    ptws: resultDatasets.ptws.length,
    vehiculos: resultDatasets.vehiculos.length
  };

  const totalAuditados = Object.values(totalPorDataset).reduce((a, b) => a + b, 0);

  const totalPorLegacyPlantId: Record<string, number> = {
    P01: 0, P02: 0, P03: 0, P04: 0, P05: 0, P06: 0, P07: 0,
    P08: 0, P09: 0, P10: 0, P11: 0, P12: 0, P13: 0, P14: 0
  };

  const totalPorResolutionStatus: Record<ResolutionStatus, number> = {
    RESOLVED_EXACT: 0,
    RESOLVED_ALIAS: 0,
    RESOLVED_BY_UNIQUE_COMMUNE: 0,
    PROVISIONAL: 0,
    UNRESOLVED: 0,
    HISTORICAL_EXTERNAL: 0
  };

  const totalPorScope: Record<PlantRecordScope, number> = {
    MASTER_PORTFOLIO: 0,
    LEGACY_DEMO: 0,
    BENCHMARK_EXTERNAL: 0
  };

  const registrosPorDataset: Record<string, PlantRecordAuditItem[]> = {
    ots: [],
    hse: [],
    planificacion: [],
    inventory: [],
    movements: [],
    ptws: [],
    vehiculos: []
  };

  const itemsP01P14: PlantRecordAuditItem[] = [];
  const canonicalPortfolioItems: PlantRecordAuditItem[] = [];
  const benchmarkExternalItems: PlantRecordAuditItem[] = [];
  const unknownItems: PlantRecordAuditItem[] = [];
  const masterIds = new Set(MASTER_PLANTS_DATA.map((p) => p.orbi_id));

  const seenRecordKeys = new Set<string>();

  const processDataset = (
    key: keyof typeof registrosPorDataset,
    items: any[],
    idExtractor: (i: any) => string,
    plantIdExtractor: (i: any) => string,
    plantNameExtractor: (i: any) => string,
    legacyIdExtractor: (i: any) => string
  ) => {
    items.forEach((item) => {
      const recId = idExtractor(item);
      const datasetRecordKey = `${key}:${recId}`;
      if (seenRecordKeys.has(datasetRecordKey)) {
        validationErrors.push(`[Duplicate Record] Dataset ${key} contains duplicate record ID ${recId}`);
      }
      seenRecordKeys.add(datasetRecordKey);

      const pId = plantIdExtractor(item) || '';
      const pName = plantNameExtractor(item) || '';
      const legId = legacyIdExtractor(item);

      // Verificación de campos obsoletos
      const hasObsoleteCanonicalField = Boolean(
        (item.canonicalPlantId || item.canonicalPlantName) &&
        ['PROVISIONAL', 'UNRESOLVED', 'HISTORICAL_EXTERNAL'].includes(item.resolutionStatus || getPlantResolutionStatus(pId || legId))
      );

      if (hasObsoleteCanonicalField) {
        validationErrors.push(`[Obsolete Canonical Field] Record ${recId} in ${key} has unresolved status but contains canonical fields.`);
      }

      const scope: PlantRecordScope = item.recordScope || getPlantRecordScope({
        plantaId: pId,
        legacyPlantId: legId,
        plantaNombre: pName,
        recordScope: item.recordScope
      });

      if (!['MASTER_PORTFOLIO', 'LEGACY_DEMO', 'BENCHMARK_EXTERNAL'].includes(scope)) {
        validationErrors.push(`[Invalid Scope] Record ${recId} in ${key} has invalid scope: ${scope}`);
      }

      totalPorScope[scope]++;

      const entry = getPlantMappingEntry(legId || pId || pName);
      const status = entry ? entry.resolutionStatus : getPlantResolutionStatus(pId || pName);
      const canonicalId = entry?.canonicalPlantId || getCanonicalPlantId(pId || pName);
      const canonicalName = entry?.canonicalPlantName || (canonicalId ? getCanonicalPlantName(canonicalId) : undefined);

      if (/^ORBI-PV-\d{3}$/i.test(pId)) {
        if (!masterIds.has(pId.toUpperCase())) {
          validationErrors.push(`[Unrecognized Master ID] Record ${recId} in ${key} references non-existent master ID ${pId}`);
        }
      }

      if (scope === 'BENCHMARK_EXTERNAL') {
        if (legId && /^P\d{2}$/i.test(legId)) {
          validationErrors.push(`[Benchmark Legacy ID Violation] Benchmark record ${recId} uses legacy Pxx ID ${legId}`);
        }
      }

      if (entry && totalPorLegacyPlantId[entry.legacyPlantId] !== undefined) {
        totalPorLegacyPlantId[entry.legacyPlantId]++;
      } else if (legId && totalPorLegacyPlantId[legId] !== undefined) {
        totalPorLegacyPlantId[legId]++;
      }

      totalPorResolutionStatus[status]++;

      const auditItem: PlantRecordAuditItem = {
        recordId: recId,
        legacyPlantId: entry?.legacyPlantId || legId,
        plantaIdActual: pId,
        plantaNombreActual: pName,
        resolutionStatus: status,
        recordScope: scope,
        canonicalPlantId: canonicalId,
        canonicalPlantName: canonicalName,
        hasObsoleteFields: hasObsoleteCanonicalField
      };

      registrosPorDataset[key].push(auditItem);

      if (entry || (legId && /^P\d{2}$/i.test(legId))) {
        itemsP01P14.push(auditItem);
      }

      if (scope === 'MASTER_PORTFOLIO') {
        canonicalPortfolioItems.push(auditItem);
      } else if (scope === 'BENCHMARK_EXTERNAL') {
        benchmarkExternalItems.push(auditItem);
      } else {
        unknownItems.push(auditItem);
      }
    });
  };

  processDataset('ots', resultDatasets.ots, i => i.codigo, i => i.plantaId, i => i.plantaNombre, i => i.legacyPlantId);
  processDataset('hse', resultDatasets.hse, i => i.id, i => i.plantaId, i => i.plantaNombre, i => i.legacyPlantId);
  processDataset('planificacion', resultDatasets.planificacion, i => i.id, i => i.plantaId, i => i.plantaNombre, i => i.legacyPlantId);
  processDataset('inventory', resultDatasets.inventory, i => i.id || i.codigo, i => i.plantaId, i => i.plantaNombre, i => i.legacyPlantId);
  processDataset('movements', resultDatasets.movements, i => i.id, i => i.plantaId, i => i.plantaNombre, i => i.legacyPlantId);
  processDataset('ptws', resultDatasets.ptws, i => i.id || i.codigo, i => i.plantaId, i => i.plantaNombre, i => i.legacyPlantId);
  processDataset('vehiculos', resultDatasets.vehiculos, i => i.id || i.patente, i => i.plantaDestinoId, i => i.plantaDestinoNombre, i => i.legacyPlantId);

  const summaryP01P14 = Object.values(PLANT_MAPPING_REGISTRY).map(entry => ({
    legacyPlantId: entry.legacyPlantId,
    legacyPlantName: entry.legacyPlantName,
    canonicalPlantId: entry.canonicalPlantId,
    canonicalPlantName: entry.canonicalPlantName,
    resolutionStatus: entry.resolutionStatus,
    confidence: entry.confidence,
    candidateCanonicalPlantIds: entry.candidateCanonicalPlantIds,
    evidenceSources: entry.evidenceSources,
    recordCount: totalPorLegacyPlantId[entry.legacyPlantId] || 0
  }));

  const statusSum = Object.values(totalPorResolutionStatus).reduce((a, b) => a + b, 0);
  if (statusSum !== totalAuditados) {
    validationErrors.push(`Inconsistencia en suma por estados: ${statusSum} != total auditados ${totalAuditados}`);
  }

  return {
    timestamp: new Date().toISOString(),
    version: 'MÓDULO 16B.1E — PLANT IDENTITY CONTRACT HARDENING & ANALYTICS NAMESPACE SEPARATION',
    totalAuditados,
    totalPorDataset,
    totalPorScope,
    totalPorResolutionStatus,
    summaryP01P14,
    scopeBreakdown: totalPorScope,
    ruleErrors: validationErrors,
    legacyReconciliationCohort: {
      totalAuditados: itemsP01P14.length,
      totalPorLegacyPlantId,
      itemsP01P14,
      summaryP01P14
    },
    canonicalPortfolioRecords: {
      total: canonicalPortfolioItems.length,
      items: canonicalPortfolioItems
    },
    benchmarkExternalRecords: {
      total: benchmarkExternalItems.length,
      items: benchmarkExternalItems
    },
    unknownRecords: {
      total: unknownItems.length,
      items: unknownItems
    },
    registrosPorDataset,
    isValid: validationErrors.length === 0,
    validationErrors
  };
}

export interface ResolutionStatusSummary {
  exact: number;
  alias: number;
  uniqueCommune: number;
  provisional: number;
  unresolved: number;
  historicalExternal: number;
}

export interface PlantReferenceValidationDetail {
  dataset: string;
  total: number;
  resolvedExact: number;
  resolvedAlias: number;
  resolvedUniqueCommune: number;
  provisional: number;
  unresolved: number;
  historicalExternal: number;
  unresolvedItems: string[];
}

export interface ValidationResult {
  total: number;
  resolvedTotal: number;
  provisionalTotal: number;
  unresolvedTotal: number;
  summaryByStatus: ResolutionStatusSummary;
  resolutionRate: string;
  isFullyResolved: boolean;
  unresolvedDetails: string[];
  details: PlantReferenceValidationDetail[];
}

/**
 * Realiza la auditoría de referencias cruzadas entre conjuntos de datos operacionales
 * y el catastro maestro de 59 plantas canónicas clasificando según evidencia real.
 */
export function validateOperationalPlantReferences(customDatasets?: {
  ots?: any[];
  hse?: any[];
  planificacion?: any[];
  inventory?: any[];
  movements?: any[];
  ptws?: any[];
  vehiculos?: any[];
}): ValidationResult {
  const report = generatePlantIdentityIntegrityReport(customDatasets);
  const masterIds = new Set(MASTER_PLANTS_DATA.map((p) => p.orbi_id));

  const buildDetail = (name: string, items: PlantRecordAuditItem[]): PlantReferenceValidationDetail => {
    let resolvedExact = 0;
    let resolvedAlias = 0;
    let resolvedUniqueCommune = 0;
    let provisional = 0;
    let unresolved = 0;
    let historicalExternal = 0;
    const unresolvedItems: string[] = [];

    items.forEach((item) => {
      if (item.canonicalPlantId && masterIds.has(item.canonicalPlantId)) {
        if (item.resolutionStatus === 'RESOLVED_BY_UNIQUE_COMMUNE') {
          resolvedUniqueCommune++;
        } else if (item.resolutionStatus === 'RESOLVED_ALIAS') {
          resolvedAlias++;
        } else {
          resolvedExact++;
        }
      } else if (item.resolutionStatus === 'PROVISIONAL') {
        provisional++;
        unresolvedItems.push(`${name} item [id=${item.recordId}]: legacy="${item.legacyPlantId} / ${item.plantaNombreActual}" (PROVISIONAL - Pendiente de Validación de Terreno)`);
      } else if (item.resolutionStatus === 'HISTORICAL_EXTERNAL') {
        historicalExternal++;
        unresolvedItems.push(`${name} item [id=${item.recordId}]: legacy="${item.legacyPlantId} / ${item.plantaNombreActual}" (HISTORICAL_EXTERNAL)`);
      } else {
        unresolved++;
        unresolvedItems.push(`${name} item [id=${item.recordId}]: legacy="${item.legacyPlantId} / ${item.plantaNombreActual}" (UNRESOLVED)`);
      }
    });

    return {
      dataset: name,
      total: items.length,
      resolvedExact,
      resolvedAlias,
      resolvedUniqueCommune,
      provisional,
      unresolved,
      historicalExternal,
      unresolvedItems
    };
  };

  const details: PlantReferenceValidationDetail[] = [
    buildDetail('Órdenes de Trabajo (OTs)', report.registrosPorDataset.ots),
    buildDetail('HSE & Calidad', report.registrosPorDataset.hse),
    buildDetail('Planificación Preventiva', report.registrosPorDataset.planificacion),
    buildDetail('Inventario O&M', report.registrosPorDataset.inventory),
    buildDetail('Movimientos Inventario', report.registrosPorDataset.movements),
    buildDetail('Permisos de Trabajo (PTW)', report.registrosPorDataset.ptws),
    buildDetail('Control de Flota (Vehículos)', report.registrosPorDataset.vehiculos)
  ];

  const total = report.totalAuditados;
  const resolvedExact = details.reduce((sum, d) => sum + d.resolvedExact, 0);
  const resolvedAlias = details.reduce((sum, d) => sum + d.resolvedAlias, 0);
  const resolvedUniqueCommune = details.reduce((sum, d) => sum + d.resolvedUniqueCommune, 0);
  const provisionalTotal = details.reduce((sum, d) => sum + d.provisional, 0);
  const unresolvedCount = details.reduce((sum, d) => sum + d.unresolved, 0);
  const historicalExternal = details.reduce((sum, d) => sum + d.historicalExternal, 0);

  const resolvedTotal = resolvedExact + resolvedAlias + resolvedUniqueCommune;
  const unresolvedTotal = unresolvedCount + historicalExternal;
  const isFullyResolved = total > 0 && resolvedTotal === total && provisionalTotal === 0 && unresolvedTotal === 0;

  const resolutionRate = total > 0
    ? `${resolvedTotal}/${total} Resuelto (${((resolvedTotal / total) * 100).toFixed(1)}%) | ${provisionalTotal} Provisional | ${historicalExternal} Histórico/Externo | ${unresolvedCount} Sin Resolver`
    : '100%';

  const unresolvedDetails = details.flatMap((d) => d.unresolvedItems);

  return {
    total,
    resolvedTotal,
    provisionalTotal,
    unresolvedTotal,
    summaryByStatus: {
      exact: resolvedExact,
      alias: resolvedAlias,
      uniqueCommune: resolvedUniqueCommune,
      provisional: provisionalTotal,
      unresolved: unresolvedCount,
      historicalExternal
    },
    resolutionRate,
    isFullyResolved,
    unresolvedDetails,
    details
  };
}

