# MÓDULO 16B.1E — PLANT IDENTITY CONTRACT HARDENING & ANALYTICS NAMESPACE SEPARATION

**Plataforma:** ORBI O&M Command Center IA  
**Fecha:** Agosto 2026  
**Estado:** `VALIDATED / SCOPE SEPARATED / HARDENED CONTRACT`  
**Migración Idempotente:** `orbi_data_migration_16b1e_plant_identity_hardening_v1`  
**Validador:** `npm run validate:data` (`src/data/validateData.ts`)

---

## 1. RESUMEN EJECUTIVO

El Módulo 16B.1E consolida el contrato de identidades y la separación estricta de namespaces entre los datos operacionales de la cohorte legacy P01..P14 (38 registros), los registros de la cartera maestra canónica (ORBI-PV-001 a ORBI-PV-059) y los datos externos de benchmark analítico en ORBI Insight Center.

---

## 2. PUNTOS CLAVE IMPLEMENTADOS

### 2.1 Depuración de Candidatos Incompatibles (`PLANT_MAPPING_REGISTRY`)
Se eliminaron todas las referencias de candidato que no correspondían a la región o comuna declarada en la evidencia documental:
- **P01 (Atacama Solar):** Candidatos removidos. Se mantiene en `PROVISIONAL` con `manualConfirmationRequired: true`.
- **P04 (Pelícano Solar):** Candidatos removidos (IV Región).
- **P05 (Santiago Solar):** Candidatos acotados a Tiltil (`ORBI-PV-006` y `ORBI-PV-007`).
- **P06 (El Totihue Solar):** Candidatos removidos (VI Región).
- **P07 (Maule Solar):** Candidatos removidos (VII Región).
- **P08 (Ñuble Solar):** Candidatos removidos (Región del Ñuble).
- **P09 (Biobío del Sol):** Candidatos removidos (Región del Biobío).

### 2.2 Separación Estricta de Namespaces en Analítica (`biDataBridge.ts`)
- Se agregaron las clasificaciones de `PlantRecordScope`: `'MASTER_PORTFOLIO'`, `'LEGACY_DEMO'` y `'BENCHMARK_EXTERNAL'`.
- Ningún registro de benchmark externo utiliza IDs de formato `Pxx`. Se reidentificaron con claves aisladas `BENCH-PLANT-*` y `BENCH-WO-*`.

### 2.3 Limpieza de Campos Obsoletos en Migración (`db.ts`)
- La migración `runPlantIdentityHardeningMigration16B1E` aplica un saneamiento determinista sobre todos los registros persistidos en `localStorage`.
- Si un registro se encuentra en estado `PROVISIONAL`, `UNRESOLVED` o `HISTORICAL_EXTERNAL`, la migración elimina cualquier campo residual u obsoleto de `canonicalPlantId` y `canonicalPlantName`.

### 2.4 Reporte de Integridad Dinámico y Desacoplado
- `generatePlantIdentityIntegrityReport` no fuerza el total general a 38 de forma permanente, permitiendo que existan OTs o registros canónicos nuevos.
- Mantiene la auditoría exacta de 38/38 registros para la cohorte histórica P01..P14 en la sección `legacyReconciliationCohort`.

### 2.5 Badges Semánticos Visuales (`getPlantBadgeInfo`)
- `InsightCenter.tsx` integra la helper `getPlantBadgeInfo` para diferenciar visualmente los parques master confirmados (`PLANTA MASTER CONFIRMADA`), las referencias históricas (`REFERENCIA HISTÓRICA / EXTERNA`), los mapeos provisionales (`MAPEO PENDIENTE DE VALIDACIÓN`) y el sandbox analítico (`BENCHMARK SANDBOX`).

---

## 3. INFORME DE VALIDACIÓN (`npm run validate:data`)

```
================================================================================
  ORBI OT CENTER — MÓDULO 16B.1E DATA INTEGRITY & SCOPE VALIDATOR
================================================================================

--- 1. MATRIZ DE EQUIVALENCIAS Y REGISTROS AUDITADOS (P01–P14) ---
┌─────────┬───────────┬────────────────────┬───────────────┬───────────────────────────────┬──────────────────────────────┬───────────┬────────────────────────────────────────────────────────────────────────┬───────────┐
│ (index) │ Legacy ID │ Nombre Legacy      │ Canónico ID   │ Nombre Canónico               │ Estado Resolución            │ Confianza │ Fuentes Evidencia                                                      │ Registros │
├─────────┼───────────┼────────────────────┼───────────────┼───────────────────────────────┼──────────────────────────────┼───────────┼────────────────────────────────────────────────────────────────────────┼───────────┤
│ 0       │ 'P01'     │ 'Atacama Solar'    │ 'N/A'         │ 'N/A'                         │ 'PROVISIONAL'                │ 'LOW'     │ 'Initial demo dataset legacyPlantId P01'                               │ 4         │
│ 1       │ 'P02'     │ 'Luz del Norte'    │ 'N/A'         │ 'N/A'                         │ 'HISTORICAL_EXTERNAL'        │ 'MEDIUM'  │ 'Initial demo dataset legacyPlantId P02 (Utility 100 MW Copiapó)'      │ 3         │
│ 2       │ 'P03'     │ 'Quillagua Solar'  │ 'N/A'         │ 'N/A'                         │ 'HISTORICAL_EXTERNAL'        │ 'MEDIUM'  │ 'Initial demo dataset legacyPlantId P03 (Utility 103 MW María Elena)'  │ 1         │
│ 3       │ 'P04'     │ 'Pelícano Solar'   │ 'N/A'         │ 'N/A'                         │ 'PROVISIONAL'                │ 'LOW'     │ 'Initial demo dataset legacyPlantId P04'                               │ 3         │
│ 4       │ 'P05'     │ 'Santiago Solar'   │ 'N/A'         │ 'N/A'                         │ 'PROVISIONAL'                │ 'LOW'     │ 'Initial demo dataset legacyPlantId P05 Tiltil reference'              │ 4         │
│ 5       │ 'P06'     │ 'El Totihue Solar' │ 'N/A'         │ 'N/A'                         │ 'PROVISIONAL'                │ 'LOW'     │ 'Initial demo dataset legacyPlantId P06'                               │ 1         │
│ 6       │ 'P07'     │ 'Maule Solar'      │ 'N/A'         │ 'N/A'                         │ 'PROVISIONAL'                │ 'LOW'     │ 'Initial demo dataset legacyPlantId P07'                               │ 4         │
│ 7       │ 'P08'     │ 'Ñuble Solar'      │ 'N/A'         │ 'N/A'                         │ 'PROVISIONAL'                │ 'LOW'     │ 'Initial demo dataset legacyPlantId P08'                               │ 0         │
│ 8       │ 'P09'     │ 'Biobío del Sol'   │ 'N/A'         │ 'N/A'                         │ 'PROVISIONAL'                │ 'LOW'     │ 'Initial demo dataset legacyPlantId P09'                               │ 1         │
│ 9       │ 'P10'     │ 'Cantillana'       │ 'ORBI-PV-058' │ 'Cantillana'                  │ 'RESOLVED_EXACT'             │ 'HIGH'    │ 'Exact name and commune match Cantillana Paine ORBI-PV-058'            │ 9         │
│ 10      │ 'P11'     │ 'Parral'           │ 'ORBI-PV-026' │ 'Esmeralda (Bicentenario II)' │ 'RESOLVED_BY_UNIQUE_COMMUNE' │ 'HIGH'    │ 'Unique commune match Parral in MASTER_PLANTS_DATA ORBI-PV-026'       │ 2         │
│ 11      │ 'P12'     │ 'Alhué'            │ 'ORBI-PV-038' │ 'Alhué'                       │ 'RESOLVED_EXACT'             │ 'HIGH'    │ 'Exact name match in MASTER_PLANTS_DATA ORBI-PV-038'                  │ 2         │
│ 12      │ 'P13'     │ 'Venezia'          │ 'ORBI-PV-024' │ 'PMG Venezia'                 │ 'RESOLVED_ALIAS'             │ 'MEDIUM'  │ 'Alias match Venezia / PMG Venezia ORBI-PV-024'                        │ 1         │
│ 13      │ 'P14'     │ 'Tricague'         │ 'ORBI-PV-011' │ 'Tricahue'                    │ 'RESOLVED_ALIAS'             │ 'MEDIUM'  │ 'Phonetic alias match Tricague / Tricahue ORBI-PV-011'                 │ 3         │
└─────────┴───────────┴────────────────────┴───────────────┴───────────────────────────────┴──────────────────────────────┴───────────┴────────────────────────────────────────────────────────────────────────┴───────────┘

✅ [PASS] INTEGRIDAD DE DATOS Y CONTRATOS VERIFICADA EXITOSAMENTE (16B.1E)
   Cohorte P01..P14 (38/38), scopes separados y reglas de mapa canónico 100% consistentes.
```

---

**ESTADO FINAL:** MÓDULO 16B.1E COMPLETADO CON ÉXITO.
