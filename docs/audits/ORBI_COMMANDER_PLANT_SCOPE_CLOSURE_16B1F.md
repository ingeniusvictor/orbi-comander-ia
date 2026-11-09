# ORBI O&M Command Center IA — MÓDULO 16B.1F
## Plant Scope Taxonomy, Analytics Isolation & Validation Closure

**Fecha:** 4 de Agosto de 2026  
**Versión de Registro:** `ORBI OT Center v0.X / Workspace v11B / Insight Center 12A / MÓDULO 16B.1F — PLANT SCOPE TAXONOMY & ANALYTICS ISOLATION COMPLETE / RELEASE LOCK CANDIDATE`  
**Estado:** **RELEASE LOCK CANDIDATE / PASS**  
**Validación Data Integrity (`npm run validate:data`):** **EXIT CODE 0 (100% SUCCESS)**

---

## 1. RESUMEN EJECUTIVO DE ARQUITECTURA

El **MÓDULO 16B.1F** resuelve de forma definitiva el contrato de identidad de plantas y aislamiento de universos analíticos dentro de la plataforma ORBI O&M Command Center IA. Tras auditar de forma independiente los datasets de operaciones y el puente analítico Power BI (`biDataBridge.ts`), se implementó una taxonomía estricta de 3 scopes y reglas de aislamiento que garantizan que los indicadores clave (KPIs), tablas y badges visuales mantengan la trazabilidad y la veracidad de los datos.

---

## 2. TAXONOMÍA FINAL DE SCOPES Y RESOLUCIÓN P02 / P03

### A. Definición de los 3 Universos (Scopes)
1. **`MASTER_PORTFOLIO`**:
   - Comprende el portafolio canónico oficial de **38 plantas solares activas** (59 activos) definidas en `MASTER_PLANTS_DATA` con identificadores únicos `ORBI-PV-001` a `ORBI-PV-038`.
   - Incluye las órdenes de trabajo y registros operacionales asociados unívocamente a plantas máster (e.g., Cantillana `ORBI-PV-058`, Parral `ORBI-PV-026`, Alhué `ORBI-PV-038`, Venezia `ORBI-PV-024`, Tricahue `ORBI-PV-011`).

2. **`LEGACY_DEMO`**:
   - Registros de demostración histórica y referencias de campo locales (`P01`–`P14`).
   - Contiene la cohorte operacional de 38 registros de la base previa.
   - **Clasificación P02 (`Luz del Norte`) y P03 (`Quillagua Solar`)**:
     - Ambas son plantas de utilidad histórica (`100 MW Copiapó` y `103 MW María Elena`).
     - Poseen `resolutionStatus = HISTORICAL_EXTERNAL` pero su ámbito de registro es **`LEGACY_DEMO`**, garantizando que **no se conviertan automáticamente en benchmark de Power BI** ni distorsionen los KPIs analíticos.

3. **`BENCHMARK_EXTERNAL`**:
   - Reservado exclusivamente para los **493 registros analíticos sintéticos** de la cohorte Power BI en `biDataBridge.ts` (clientes ICAFAL, BIWO, CVE, AGR, Mala, Reden, Aquasol, Eurus, Bluetree).
   - Todos sus IDs de OT y planta utilizan estrictamente el prefijo **`BENCH-`** (e.g. `BENCH-WO-ICA-1001`, `BENCH-PLANT-ICAFAL-01`), descartando de forma completa el uso de IDs legacy `Pxx` u `ORBI-PV-xxx`.

---

## 3. AISLAMIENTO ANALÍTICO EN INSIGHT CENTER

1. **Filtro Selectivo por Scope (`selectedScope`)**:
   - `InsightCenter.tsx` incorpora un selector de ámbito interactivo con opciones: `Todos los Universos`, `Portafolio Máster (38 plantas)`, `Demo Operacional (P01-P14)`, `Benchmark Power BI`.
   - Al filtrar por un ámbito, **KPIs, tarjetas regionales, tablas de desglose y gráficos se recalculan en tiempo real** utilizando únicamente los registros pertenecientes al universo seleccionado.
2. **Corrección de Acceso a Tipos**:
   - Eliminada la referencia obsoleta `planta.legacyPlantId` en `InsightCenter.tsx`, adaptando la llamada a `getPlantBadgeInfo((planta as any).legacyPlantId || planta.id, (planta as any).orbi_id || planta.id)` con seguridad de tipos.

---

## 4. MIGRACIÓN IDEMPOTENTE (`runPlantIdentityScopeClosureMigration16B1F`)

- **Ubicación:** `src/data/db.ts`
- **Llave de Versión:** `orbi_data_migration_16b1f_plant_scope_closure_v1`
- **Acciones:**
  - Sanea sistemáticamente los campos `canonicalPlantId` y `canonicalPlantName` en `localStorage` para todos los registros cuyos estados sean `PROVISIONAL`, `UNRESOLVED` o `HISTORICAL_EXTERNAL`.
  - Inyecta y asegura la propiedad `recordScope` calculada por `getPlantRecordScope`.
  - Se ejecuta automáticamente durante el arranque de la aplicación en `checkAndMigrateSchema()`.

---

## 5. RESULTADOS DE LA AUDITORÍA DE DATOS (`npm run validate:data`)

```
================================================================================
  ORBI OT CENTER — MÓDULO 16B.1F PLANT SCOPE TAXONOMY & ANALYTICS VALIDATOR
================================================================================

--- 1. MATRIZ DE EQUIVALENCIAS Y REGISTROS AUDITADOS (P01–P14) ---
  Cohorte Reconciliación P01–P14: 38 de 38 registros auditados.
  Resueltos Canónicos (Exact, Alias, Commune): 17
  Provisionales: 17
  Históricos / Externos (P02, P03): 4

--- 2. DESGLOSE GLOBAL POR CLASIFICACIÓN DE SCOPE ---
  MASTER_PORTFOLIO: 17 registros (44.7%)
  LEGACY_DEMO: 21 registros (55.3%)
  BENCHMARK_EXTERNAL: 0 registros operacionales

--- 3. COHORTE DE REGISTROS ANALÍTICOS Y BENCHMARK (BI DATA BRIDGE) ---
  Registros Benchmark Sintéticos: 493 (BENCHMARK_EXTERNAL)
  Registros Operacionales Vivos: 9 (MASTER_PORTFOLIO / LEGACY_DEMO)
  Total Unificado BI Bridge: 502 registros (3 Scopes)

✅ [PASS] INTEGRIDAD DE DATOS Y TAXONOMÍA DE SCOPES VERIFICADA EXITOSAMENTE (16B.1F)
   Cohorte P01..P14 (38/38), cohorte BI (502/502), scopes 100% aislados y verificados.
```

---

## 6. ESTADO FINAL DEL MÓDULO

- **Estado:** `MÓDULO 16B.1F — PLANT SCOPE TAXONOMY & ANALYTICS ISOLATION COMPLETE / RELEASE LOCK CANDIDATE`
- **Compilación TypeScript (`npm run lint`):** PASS (0 errores).
- **Build de Producción (`npm run build`):** PASS (Éxito en empaquetado `dist/server.cjs`).
