# ORBI OT Center — Agent Guidelines & Version Registry

This file contains custom instructions, architecture guidelines, and the version registry for **ORBI OT Center**. The platform automatically loads these instructions to maintain operational stability and prevent functional regressions in subsequent development sessions.

---

## 1. VERSION REGISTRY
**Current Version:** `ORBI OT Center v0.X / Workspace v11B / Insight Center 12A / MÓDULO 16B.1F — PLANT SCOPE TAXONOMY & ANALYTICS ISOLATION COMPLETE / RELEASE LOCK CANDIDATE`  
**Status:** **FROZEN / FINAL RELEASE LOCK**  
**Runtime:** React 18+ (Vite) | TypeScript | Tailwind CSS | Recharts & Lucide Icons  
**State Engine:** Client-side LocalStorage Persistence with fully synchronized mock systems.

---

## 2. TECHNICAL SUMMARY & ARCHITECTURE

### Core Modules & Components
1. **OT Center Core (`src/components/OTManager.tsx`)**
   - **Responsibility:** Main operational hub managing the lifecycle of Work Orders (OTs). Supports dynamic workflows for 5 types of OTs: *Simple*, *Preventivo*, *Correctivo*, *Crítica*, and *LOTO/HSE*.
   - **Key Features:** Conditional validation per type, closure wizard, cancellation/re-opening controls, and supervisor feedback loops.

2. **Vista Terreno / Field Ops (`src/components/VistaTerreno.tsx`)**
   - **Responsibility:** Clean, low-clutter interface tailored exclusively for field technicians.
   - **Key Features:** Displays ONLY OTs assigned to the active technician. Filters out supervisor control panels, global catalog views, Excel utilities, and unassigned SharePoint trees. Provides a simple form to log execution diagnostics, hours, and plant-specific corrective spare parts consumption.

3. **ORBI Scheduler IA (`src/components/SchedulerIA.tsx`)**
   - **Responsibility:** Operative calendar planning interface inspired functionally by Softwrench calendar models with high-contrast ORBI-premium visuals.
   - **Key Features:** Supports Role-Based dual views: Supervisor (Team global planner, KPIs, drag-free assignment inbox, Resource Planner workload checker) and Technician (clean single-pane task agenda with direct OT action links, zero administrative clutter).

4. **Evidence Vault (`src/components/EvidenceVault.tsx`)**
   - **Responsibility:** Central repository for uploading and classifying visual evidence.
   - **Key Features:** Structured evidence packages by OT, specific assets (e.g., Inverters), and technician. Includes a specialized "Modo Limpieza Inversores" supporting sequential photos (Before/During/After), an unclassified backup inbox, and supervisor approval/rejection workflows with dynamic feedback.

5. **SharePoint Router Mock (`src/components/SharePointRouter.tsx`)**
   - **Responsibility:** Simulates automated enterprise cloud archiving and folder organization.
   - **Key Features:** Interactive virtual folder tree with subfolders (`01 - Evidencias`, `02 - Reportes`, `03 - Firmas`, `04 - Permisos de Trabajo`). Automated renaming engine (e.g., `Planta_Tipo_OT_Fecha_ID.pdf`) based on strict OT types, with support for PTS validation where required.

6. **PTW Center (`src/components/PTWCenter.tsx`)**
   - **Responsibility:** Manages high-risk operational authorization forms.
   - **Key Features:** Creation of Work Permits (PTW) mapped to single or grouped OTs. Generates conditional documentation (AST, PTS, LOTO checklist) based on high-risk triggers, with digital signature captures (Opening/Closing) and automatic PDF export to the virtual SharePoint tree.

7. **Inventario O&M (`src/components/OMInventory.tsx`)**
   - **Responsibility:** Technical spare parts management for solar maintenance operations.
   - **Key Features:** Split into Technician view (only assigned OT materials) and Supervisor view (full ledger, movements log, active alerts, and Excel reconciliation tools). Plant-specific stock tracking prevents negative values while allowing supervisor-justified overrides.

8. **Report Center (`src/components/ReportCenter.tsx`)**
   - **Responsibility:** Consolidates technical documentation checklist validation, photographic evidence approval, and digital signatures.
   - **Key Features:** Supports Role-Based visibility (Supervisor/Coordinador/Jefe O&M/Admin only), 7 specialized tray queues (Field Work Complete, En revisión, Devueltas, Listas para cerrar, Cerradas, Pendientes SharePoint, Con observaciones), real-time documentary semaphores (Checklist, Evidencias, PTW, Repuestos, Diagnóstico, SharePoint), A4 report layout preview, mock PDF report generation and SharePoint automatic directory router.

9. **Release & Demo Center (`src/components/DemoReadiness.tsx`)**
   - **Responsibility:** Lightweight internal version control, live presentation sandbox manager, executive walkthrough, and quick presentation summary.
   - **Key Features:** Role-gated panel (Supervisor, Jefe O&M, Coordinador, Super Admin) displaying the frozen status of all preceding modules. Interactive checklist of demonstration readiness stages, real-time tracking of master case alignments, a double-confirmed database reset, dynamic JSON snapshot export, "No-connect" sandbox variables highlighting non-production boundaries, an 11-step executive walkthrough timeline script (Módulo 9B), and an executive summary card (Módulo 9C) featuring a 30-second condensed elevator pitch and full bento grid overview.

10. **Executive Demo Hub (`src/components/ExecutiveDemoHub.tsx`)**
    - **Responsibility:** Interactive high-fidelity executive presentation, bento ecosystem map, duration-selective routes, script triggers, and sandbox guardrails.
    - **Key Features:** Supports 3 pre-programmed timeline paths (7, 12, and 20 minutes) with step-by-step speaker advice, dynamic script clipboard triggers, double-confirmed sandbox database reset, dynamic executive summary generation, visual module status matrix, and role security gating.

---

## 3. MASTER DATA CONTEXT

### The Cantillana Reference Case
- **OT Code:** `26-29221` (also referred to as `OT-26-29221`)
- **Location:** Planta Solar Cantillana (PMGD 9.5 MW)
- **Type:** PM Anual Inversores (Preventivo)
- **Assets:** 39 inversores Sungrow SG250
- **Technicians:** Víctor León, Rodrigo Cisterna, Carrasco
- **Main activities:** Mantenimiento anual, checklist técnico, limpieza de inversores, evidencias antes/después (Modo Limpieza Inversores), fotos LED/estado frontal, entorno/vegetación y revisión operacional.
- **Rules:** This case MUST remain highly consistent across all views. Any change to this OT's status in `OTManager` must cleanly reflect in `VistaTerreno`, `EvidenceVault`, `PTWCenter`, and `SharePointRouter`. It must not be described as corrective or linked to a control card failure.

### The Inverter Corrective Case
- **OT Code:** `OT-26-29222` (or `26-29222`)
- **Location:** Planta Solar Cantillana (PMGD 9.5 MW)
- **Type:** Correctiva
- **Asset:** Inversor Central C2
- **Repuesto:** Tarjeta de control de inversor o fusible de potencia
- **Main activities:** Reemplazo de componente averiado por falla de tarjeta de control o fusible de potencia. Demuestra consumo de repuesto, control de stock de la planta e historial de movimientos.

### O&M Inventory Baseline
The O&M inventory uses strict site-specific counts across physical plants:
- **Planta Cantillana:** Local spare boards, MC4 connectors, fuses.
- **Planta Parral:** RS-485 modules, inverter air filters, transformer oil.
- **Planta Lontué:** Tracker mechanical spares, high-temp grease.

---

## 4. DETAILED CHANGELOG (v0.X STABILIZED)

### OT Center Core
- Implemented state-machine transitions: `Asignada` → `En Proceso` → `Ejecutada` → `En Revisión` → `Cerrada` / `Rechazada`.
- Added dynamic, type-specific closure workflows (e.g., requiring safety clearance for LOTO/HSE OTs, and specific evidence uploads for Inverter Cleanings).
- Restructured action menus to avoid duplicate triggers, adhering to **ORBI Premium** high-contrast UI guidelines.

### Vista Técnico
- Tailored as a streamlined single-pane layout for field execution.
- Restricted access to global analytics, administrative settings, Excel importers, and unassigned folder structures.
- Added direct integration with the plant-specific `OMInventory` database: technicians consume spares directly from their active OT screen, subtracting stock instantly from the correct site.

### Evidence Vault & SharePoint Router
- Linked the visual Vault to the SharePoint Router tree: once a supervisor approves an evidence package or a PTW closes, files are automatically renamed and filed in their target directory (e.g., `/01 - Evidencias/` or `/04 - Permisos/`).
- Implemented "Modo Limpieza Inversores" with automatic aspect ratio guarantees and unclassified triage pipelines.

### PTW Center
- Created AST (Análisis de Seguridad en el Trabajo) and LOTO (Lockout/Tagout) generation wizard.
- Added multi-party signature inputs for both operators and site supervisors.

### Inventario O&M (Módulo 6 QA Fixes)
- **Site Isolation:** Restored stock is returned only to the originating plant; consumption is restricted to the specific site where the OT is assigned.
- **Negative Stock Block:** Technicians are strictly prohibited from consuming more stock than available. The system displays a high-visibility warning: `"Stock insuficiente en esta planta."`
- **Excel Monthly Reconciliation:** Designed the import utility to behave as a non-destructive audit/reconciliation rather than an overwriting wipe. The system displays physical-vs-theoretical discrepancies before applying any change, tagging items as *Sin Movimiento*, *Consumo*, *Ingreso*, *Bajo Stock*, *Ítem Nuevo*, or *Requiere Revisión*.
- **Active Monitoring Alertas:** Added real-time operational alerts for *Stock Cero*, *Bajo Mínimo*, *Críticos sin stock*, *Planta sin actualizar (>30 días)*, and *Diferencias Pendientes*.

### ORBI Scheduler IA & Resource Planner (Módulo 7A/7B Stable Planning)
- **Vista Técnico / Mi Agenda:** Programmed simple list for field workers. Restricts access to global calendars, admin metrics, workload distributions, or other technicians' agendas. Shows personalized subsections: Today's tasks, Weekly overview, and Corrections pending. Includes direct buttons to open/execute the selected OT.
- **Vista Supervisor / Calendario Global:** Created full high-contrast interactive views (Month, Week, Day, Global List) with robust multi-criteria filters (by plant, technician, status, type, priority).
- **Unscheduled Inbox Triage:** Created drag-free mock planning panel for unassigned OTs. Supports quick-assignment of technician, scheduling date, shift hour, and estimated HH. On save, the item instantly moves to the scheduled lists/calendars.
- **Integrations Sidebar:** Shows complete status indicators for Evidence Vault, PTW required, SharePoint backup sync, and material spare usage with deep-linking buttons.
- **Lightweight Resource Planner (Módulo 7B):** Designed a dedicated full-screen "Resource Planner" view for supervisors and administrators.
  - **Staff Individual Load Overview:** Shows active cards for each field technician tracking Name, Role, Zone, Today's & Week's hours/OT counts, next activity, last completed hito, and current load state (*Disponible*, *Normal*, *Alta carga*, *Sobrecargado*).
  - **Crew/Squad Groupings (Cuadrillas):** Custom squad grouping panels (*Cuadrilla Cantillana*, *Cuadrilla Parral*, *Cuadrilla Zona Centro*, and *Apoyo externo / Vendor*) tracking crew members, combined OTs, total workload, and active fatigue/overload risk.
  - **Conflict Detector:** Automatic analyzer detecting critical errors (overlapping times on same technician and day, exceeding 12h/day, exceeding 45h/week, unassigned critical OTs, overdue OTs without scheduling, and high-risk OTs requiring PTW with no assigned lead).
  - **O&M AI Suggestions:** Interactive panel providing recommendations on load-balancing, priority routing, SLA protection, and geographical grouping.
  - **Ruta del Día Operativa:** Vertical chronological day-timeline showcasing exact schedule, plants, assets, and integration links for each selected technician.

### Report Center (Módulo 8 Cierre Documental y Entrega)
- Created full-screen **Report Center** module restricted strictly to management and supervisor roles.
- Designed 7 administrative trays with automatic count indicators for tracking real-time queue states.
- Implemented real-time dynamic **Documentary Semaphores** analyzing checklists, evidence approval, PTW signoffs, spare consumption, technical diagnostic entries, and SharePoint directory state.
- Modeled standard A4 template preview for direct O&M client deliverables, featuring headers, diagnostics, checklist results, spares ledger, visual dossier packages, and digital signature stamps.
- Integrated **Generar Report Pack** action which simulates final validation, compiles the dossier, and writes standardized PDFs directly into the virtual SharePoint `/01 - Reportes OT` folder.
- Integrated **Devolver a Terreno** action with specific reason inputs, triggering a roll-back state that immediately updates the technician's "Mi Agenda" view with corrections pending.

### Release & Demo Center (Módulo 9A/9B Control de Versión y Demos)
- Developed a protected control panel displaying the frozen state and validation parameters of all 9 preceding system modules.
- Embedded an interactive checklist allowing supervisors to flag and persist module readiness statuses (`Listo`, `Revisar`, `Omitir`).
- Added real-time tracking of master case alignments (`OT-26-29221` and `OT-26-29222`) displaying operational execution states and role recommendations.
- Programmed a double-confirmed, local-safe database resetting utility to restore base mock content cleanly.
- Configured JSON snapshot exports compiling current system status, version attributes, active cases, and mock sandbox constraints for safe diagnostic reads.
- Documented clear boundary gates mapping non-production states for Softwrench, SharePoint, Maps, Calendars, and production APIs.
- **Módulo 9B (Guía de Demo Ejecutiva):** Integrated a structured presentation script mapping the end-to-end O&M workflow across 11 key milestones (Problem statement, Tech agenda, Scheduler, Resource Planner, Evidence Vault, PTW safety, geocenced Inventory, Report Center, SharePoint backup, Sandbox metrics, and Executive summary). Supports 3 dynamic timeline durations (7m, 12m, 18m) with selective step recommendation badges, speaker notes, critical O&M quotes, and an interactive FAQ. All walkthrough states persist inside `localStorage`.
- **Módulo 9C (ORBI Executive Summary Card):** Added a dedicated "Resumen Ejecutivo" tab within the Release & Demo Center for rapid, high-impact pitches (under 2 minutes) tailored for directors and O&M executives. Implements a responsive toggle between a "30-second Elevator Pitch" view and a "Comprehensive Bento Grid" overview, plus a functional button to copy the preformatted plain-text executive summary to the clipboard.

### PATCH 10A: Global Command Center Alignment (FROZEN RELEASE)
- **Unified Identity:** Standardized header branding to `ORBI O&M Command Center IA | v0.12C-QA — Global Operations Shell` as the main platform shell.
- **Ecosystem Gating:** Added role-based visualization constraints for technical personnel. Technician and Operator roles are restricted from viewing strategic executive decisions or advanced AI FOTON Prime reports, instead seeing an elegant placeholder directing them to operative field tasks.
- **OT Center Integration:** Affirmed `ORBI OT Center v0.X` as a frozen module inside the command environment, preserving exact state-machine workflows and mock-persistent stores.
- **Terminology Correction:** Corrected any legacy jargon or typos like "inventario fiteado" to "inventario O&M segmentado por planta" throughout all dashboard interfaces.
- **Roadmap Consolidation:** Refined the future technological expansion pipeline showing: SCADA Monitoring, Master Data, BI, Logistics, real SharePoint Graph triggers, and FOTON Prime IA transversal.

### MÓDULO 11A: ORBI Workspace Core Alignment & Planning Shell
- **Independent Operational Module:** Refactored Workspace to represent the separate business concept of operational scheduling, calendarization, and workload balance, adhering to the standard guideline: *ORBI Workspace defines WHEN, WHERE, and WHO executes; ORBI OT Center defines WHAT is done; ORBI Insight Center measures results.*
- **Header & Branding Integration:** Promoted to `v0.1.2C-QA — Operational Planning Shell` paired with high-contrast "Vinculación Operativa" linkage banners.
- **Enhanced Planning Indicators:** Reconstructed calendar month cells and day cards to display detailed attributes such as activity code, status color badge, logistical blockages (e.g. stock issues), unassigned indicators, and PTW required flags.
- **Dossier & Integration Links:** Configured direct deep-linking on detail sheets allowing supervisors to instantly switch active workspaces and open selected OTs directly in the core execution module (`ORBI OT Center`).
- **Core Separation Boundaries:** Strictly isolated planning workflows to prevent duplicating or overwriting the frozen field-operative closure rules.

### MÓDULO 11B: ORBI WORKSPACE SCHEDULING & DISPATCH UX (FROZEN & SCOPE LOCKED)
- **Advanced View Selector:** Integrated seamless toggle selectors between **Month View** (calendaring grid), **Week View** (7-column schedule), **Day View** (chronological vertical timeline), and **Dispatch List** (compact dispatch ledger with instant status filters and search).
- **Active Conflict Detector:** Programmed real-time conflict analyzer parsing active work orders to flag: overlap warnings, overloads (>12h daily cap), unassigned criticals, PTW gaps, and active logistic blockages.
- **Rescheduling & Reason Log modal:** Replaced standard form with an advanced planning wizard displaying current assignments, fleet vehicle logs, estimated hours, and a mandatory change reason log whenever date changes are executed.
- **Local History Synchronization:** Enabled automated increment tracking for `reprogramacionesCount`, logging original date, change reasons, and supervisor signature metadata directly into `localStorage`.
- **Workspace Scope Lock Registered:** Restricts functional expansion to avoid over-engineering. Workspace is locked strictly as a lightweight planning, scheduling, and coordination module. It does not absorb responsibilities belonging to other centers (no deep execution, no inventory consumption, no safety permit authorization, no A4 report compilations, and no heavy Gantt/drag-and-drop tools).

### MÓDULO 11C: PLANIFICACIÓN AVANZADA & LOGÍSTICA (PAUSADO / NO IMPLEMENTAR POR AHORA)
- **Status:** **PAUSED / NO IMPLEMENTAR POR AHORA**
- **Decision:** Postponed indefinitely to safeguard application performance and maintain lightweight operation. The current capabilities of Workspace 11A + 11B are fully sufficient to satisfy all operational scheduling, dispatch, and conflict-detection scenarios requested for the active executive demo.

### MÓDULO 12A: ORBI INSIGHT CENTER 12A — STABLE EXECUTIVE ANALYTICS SHELL CANDIDATE (FROZEN & REGISTERED)
- **Status:** **FROZEN / READ-ONLY / SANDBOX / EXECUTIVE DEMO READY**
- **Core Identity:** ORBI Insight Center replaces the visible name ORBI BI Center as the official, standalone, local-sync executive analytics and O&M intelligence module within the ORBI O&M Command Center IA.
- **Freeze Rules (Release Lock):**
  1. **Strict Read-Only Architecture:** No deep editing, status modification, or closure actions are permitted within the Insight Center.
  2. **No Field Execution Operations:** Technical or field tasks (e.g., closing OTs, approving PTWs, consuming inventory, uploading evidence) are strictly forbidden within the Insight Center; these are routed back to their respective core modules via structured deep-links.
  3. **Standalone Sandbox Mode:** Zero real external analytical API connections, no cloud credential dependencies, and no active production platform routing.
  4. **Security Banner Preservation:** Maintain the distinct security disclaimer highlighting the sandbox/local simulation context.
  5. **Technical Compatibility Names:** Internal technical names like `biDataBridge.ts`, `BIWorkOrderRecord`, and other legacy technical identifiers are preserved for code integrity but are strictly mapped to visible "ORBI Insight Center" or "Insight Center" terminology.
- **Frozen Tabs/Views:**
  - *Executive Landing:* Compact overview highlighting the Unified O&M Health Score, plant availability, SLA metric, HH deviation, HSE hazards, and active personnel saturation count.
  - *Resumen Ejecutivo (Resumen General):* Regional performance charts and complete plant operational tables.
  - *Cumplimiento OT:* Progress gauges and SVG bar charts detailing closed vs pending work orders.
  - *HH & Recursos:* Overload risk status, actual vs planned hour metrics, and team-distribution diagnostics.
  - *Ranking de Plantas:* Performance rankings of solar parks with inline navigation linking back to main schedulers.
  - *Clientes O&M:* SLA tables segmented by asset owners and utilities (AES Andes, Colbún Solar, Grenergy, EDF Renewables).
  - *HH Mix por Tipo WO:* Color-segmented stacked bar ratios detailing preventative vs reactive labor hour balances.
  - *Reporte Gerencial IA:* Generative local AI assistant simulation powered securely in backup mode by `/api/bi/reporte-ia`.
- **Registered Benchmarks:**
  - Dashboard Control Operacional, O&M General Operational Summary, Zona Norte, Zona Centro / Bluetree, Zona Sur, ICAFAL, BIWO, CVE, AGR, ECOM Empty State, Reporte HH, HH Distribution by Work Type.
- **Unified Adapter (`biDataBridge.ts`):** Implemented a normalized data bridge that acts as a read-only adapter mapping operational databases (`db.ts` OTs and plants) to unified `BIWorkOrderRecord` structs.

### MÓDULO 12B: ORBI INSIGHT REPORT PACK 12B — PREMIUM PDF EXPORT & EXECUTIVE DOSSIER CANDIDATE (FROZEN & REGISTERED)
- **Status:** **FROZEN / READ-ONLY / SANDBOX / CLIENT-READY**
- **Core Identity:** ORBI Insight Report Pack functions as a premium PDF export and executive reporting utility embedded within ORBI Insight Center. It supports the high-fidelity generation of physical-ready A4 reports optimized with custom Tailwind `@media print` directives.
- **Freeze Rules (Release Lock):**
  1. **Strict Read-Only Execution:** It operates as a reporting-only tool. It cannot edit OTs, close OTs, approve work permits, consume inventory, or write back to any operational state of the OT Center or Workspace modules.
  2. **Automated Layout Isolation:** During print execution (`window.print()`), it dynamically isolates report pages to guarantee a perfect A4 grid, suppressing sidebars, navigation panels, and interactive controls.
  3. **Data Trust Safeguards (Data Trust Rules):** 
     - **Horas Hombre Terminology:** Avoids the term "horas reales" or "real hours" to prevent regulatory/union confusion. Replaced universally with "HH registradas", "HH referenciales", "HH estimadas", or "HH reportadas". Includes a mandatory visible advisory clarifying that HH data stems from planning/estimations and is not legally binding.
     - **SharePoint Simulation:** Promotes transparency by explicitly stating that SharePoint syncing runs on a virtual sandbox ("SharePoint Router Virtual") without active corporate API calls.
  4. **Strict No-BI branding:** Any reference to third-party tools (like "Power BI", "PBI", or "our Power BI") is completely forbidden in visible titles or content. It is branded exclusively as **ORBI Insight Center** and **ORBI Insight Report Pack**.
  5. **No External Dependencies:** Requires zero analytical API keys, zero cloud database connections, and operates strictly with sandbox-safe mock records mapped via the normalized adapter.

### MÓDULO 12C: ORBI EXECUTIVE DEMO HUB — GLOBAL PRESENTATION LAYER & RELEASE FREEZE (FROZEN & REGISTERED)
- **Status:** **FROZEN / SANDBOX / NON-OPERATIONAL / EXECUTIVE DEMO READY**
- **Core Identity:** ORBI Executive Demo Hub functions as the ultimate global presentation shell, release portal, and interactive walkthrough experience for the entire ORBI O&M Command Center IA ecosystem.
- **Freeze Rules (Release Lock):**
  1. **Strict Non-Operational Architecture:** It operates as a presentation-only and navigation portal. It cannot modify work orders (OTs), authorize work permits (PTW), alter inventory stocks, write back scheduling assignments, or execute production-ready operations.
  2. **Role-Based Gating:** The Executive Demo Hub is strictly restricted to supervisory and executive roles (Super Admin, Jefe O&M, Supervisor, Coordinador). Technicians or basic operators are blocked at both the menu level and component level.
  3. **Data Isolation (Sandbox Safeguards):** Built strictly for isolated presentation. No active production database writebacks, no external APIs, and no real-world corporate cloud connections (e.g. real SharePoint, CRM, or Softwrench instances).
  4. **Controlled Demo Reset:** Re-initializes the mock sandbox database safely with dual-step confirmation warnings, resetting only the client-side `localStorage` state to restore the baseline demo environment.
  5. **Data Trust & Warning Banner:** Features a permanent prominent safety warning declaring the sandbox boundary, virtual SharePoint simulation, and referential planning hours (no payroll/biometric usage).

### MÓDULO 13A-FREEZE: ORBI FLEET & LOGISTICS FINAL SANDBOX RELEASE LOCK (FROZEN & REGISTERED)
- **Status:** **FROZEN / SANDBOX / NON-OPERATIONAL / NO REAL GPS / FLEET DEMO READY**
- **Core Identity:** ORBI Control de Flota & Logística operates as an isolated sandbox telemetry, fleet vehicle maintenance, and document audit module inside the ORBI O&M Command Center IA ecosystem.
- **Canonical Files:**
  - `/src/features/fleet/utils/fleet.ts`
  - `/src/features/fleet/app/OrbiFleetStandaloneShell.tsx`
- **LocalStorage Storage Keys:**
  - `orbi_fleet_standalone_vehicles`
  - `orbi_fleet_standalone_maintenances`
- **Freeze Rules & Safeguards (Release Lock):**
  1. **No External APIs or Network Calls:** Zero real GPS, GNSS, or external server connections. Strictly prohibited from using `fetch`, `axios`, WebSockets, or live HTTP requests. All telemetry latency is simulated cleanly with client-side timers.
  2. **Simulated GPS & Demo Tokens:** All API key inputs and default configurations display non-operational demo credentials (`DEMO-TOKEN-NO-OPERATIVO`). All telemetry data and satellite coordinates remain sandbox-simulated.
  3. **Master GPS Toggle Consistency:** Global GPS toggle controls live badges, telemetry cards, vehicle detail georeferencing, and offline fallback states (`SATELLITE BEACON: STANDBY`).
  4. **Document Audit Accuracy:** Vehicle SOAP, Permiso de Circulación, and Revisión Técnica expiration checks calculate dynamic status against current time (`new Date()`).
  5. **UI & Library Dependencies:** Styled with Tailwind CSS, `lucide-react` icons, and smooth transitions via `motion/react`. Integrated seamlessly via existing `App.tsx` global navigation (`Control de Flota & Logística`).
  6. **Modification Lock:** Any future modifications to this module are strictly forbidden unless a formal subsequent module is opened. The optional `/src/_migration/fleet-13a0/` directory remains unimported outside runtime.

### MÓDULO 15A — ORBI ORGANIGRAMA O&M DATA & HIERARCHY DIRECT INTEGRATION
- **Current Version:** `ORBI OT Center v0.X / Workspace v11B / Insight Center 12A / Report Pack 12B / Demo Hub 12C / Flota 13A / MatrizPlantas 14A / Organigrama 15A — Frozen`
- **Status:** **FROZEN / SANDBOX / NON-OPERATIONAL / ORGANIZATIONAL DATA READY**
- **Data Scope:** 76 colaboradores activos, 9 áreas operativas, 4 niveles jerárquicos.
- **Rutas Canónicas:**
  - `/src/data/organigramaData.ts` (Base canónica de 76 colaboradores, tipos, funciones de validación y almacenamiento local).
  - `/src/components/Organigrama.tsx` (Componente reutilizado y potenciado con 4 vistas: Árbol Jerárquico, Por Áreas, Por Zonas, Directorio).
  - `/src/types.ts` (Interfaces `Persona`, `HseCert`, `AreaOM`, `NivelJerarquico` y `OrganigramaNode` extendidas).
  - `/src/data/db.ts` (`INITIAL_ORGANIGRAMA` conectado con `organigramaData.ts`).
- **Keys LocalStorage:** `orbi-organigrama` (clave canónica primaria) con fallback de lectura única desde `orbi-personnel-state` y `orbi_om_db_organigrama`.
- **Validación Estructural:** Incluye auditoría en tiempo real de 10 puntos de control (IDs únicos, bucles circulares, asignación de plantas en matriz y acreditaciones HSE).
- **Role Gating:** Edición/Creación para roles de gestión/administración (`SUPER_ADMIN_ORBI`, `GERENCIA`, `JEFE_OM`, `COORDINADOR_OM`). Lectura solo para perfiles operativos/terreno (`SUPERVISOR_TERRENO`, `INGENIERO_OM`, `TECNICO_OM`, `HSE`, `CALIDAD`, `PLANIFICACION`, `COMISIONAMIENTO`, `LECTURA_CLIENTE`).

### MÓDULO 15A-FREEZE — ORBI ORGANIGRAMA O&M FINAL ORGANIZATIONAL DATA RELEASE LOCK
- **Status:** **FROZEN / RELEASE LOCK / SANDBOX / NON-OPERATIONAL / ORGANIZATIONAL DATA READY**
- **Parámetros Canónicos Congelados:**
  - **Dataset Operativo:** 76 colaboradores activos (`org-1` a `org-76`), 0 inactivos, 0 duplicados, 0 bucles circulares, 1 nodo raíz (`org-1` Johannes Dietsche).
  - **Estructura Jerárquica:** 9 áreas operativas (Gerencia, Planificación & Control, Control Gestión, Calidad & HSE, Zona Norte, Zona Centro, Zona Sur, Centro de Control, Comisionamiento & MT, Limpieza) y 4 niveles jerárquicos.
  - **Vincularidad con Matriz de Plantas:** 59 plantas master en catastro. 13 referencias de plantas resueltas en el Organigrama; 4 referencias históricas (`Alianza`, `Chinchorro`, `PMG Castilla`, `San Isidro`) mapeadas a `org-40` Jesús Blanco y clasificadas formalmente como `REFERENCIA NO RESUELTA (HISTÓRICA / EXTERNA)`. No se crearon plantas ficticias.
  - **Persistencia Canónica:** Clave primaria oficial `orbi-organigrama`. Lectura transparente de claves legacy `orbi-personnel-state` y `orbi_om_db_organigrama` con proyección inmediata a la clave canónica.
  - **Role Gating Canónico:** Permisos de Edición/Alta/Reset restringidos estrictamente a `SUPER_ADMIN_ORBI`, `GERENCIA`, `JEFE_OM`, `COORDINADOR_OM`. Modo solo lectura automático para el resto de roles. Eliminado `ADMIN` por no pertenecer al catálogo formal `ROLES_CONFIG`.
  - **Privacidad & Sandbox:** Desplegado banner distintivo `SANDBOX ORGANIZACIONAL — DATOS REFERENCIALES — SIN CONEXIÓN A RR. HH., NÓMINA NI BIOMETRÍA`. Cero conexiones con RR. HH., nómina, biometría, Entra, Workspace, Firebase o APIs de producción.
- **Directiva de Congelamiento:** Queda estrictamente prohibido modificar la estructura organizacional, los archivos canónicos (`/src/components/Organigrama.tsx`, `/src/data/organigramaData.ts`, `/src/types.ts`, `/src/data/db.ts`) o los contratos jerárquicos de este módulo sin la apertura formal de una fase posterior autorizada.

---

## 5. REGRESSION TESTING CHECKLIST

Before approving any subsequent build or turn, verify the following 12 test paths:

### 1. Simple OTs
- [ ] Can be created, assigned, and executed without forcing any material consumption, ASTs, or inventory tasks.
- [ ] Can be closed directly via the 1-step quick form.

### 2. Preventative OTs
- [ ] No automatic stock reduction is triggered unless a manual spare consumption is registered by the technician.
- [ ] Does not show inventory checks as a blocking mandatory field for closure.

### 3. Corrective OTs
- [ ] Technicians can log spare usage from `VistaTerreno`.
- [ ] Material consumption records instant, double-entry audit trails (OT, technician, plant, item, quantity, previous/final stock, timestamps, observations).
- [ ] Subtracts stock **only** from the correct plant.

### 4. Critical OTs
- [ ] Force high-priority visual labels and require LOTO protocols before starting execution.
- [ ] Cannot be closed without linking at least one supervisor safety approval.

### 5. LOTO/HSE OTs
- [ ] Mandate AST checklists and lockout verification.
- [ ] Archive execution logs automatically into SharePoint directory `04 - Permisos de Trabajo`.

### 6. Evidence Validation
- [ ] Unclassified visual assets can be triaged and mapped to existing OTs.
- [ ] Inverter Cleaning OTs require Before, During, and After uploads in the designated Vault panel.
- [ ] Rejections by supervisors prompt a "Reopened" or "Requires Correction" status back to the technician.

### 7. PTW Sign-Offs
- [ ] Work permits can be issued for grouped OTs.
- [ ] Both opening and closing signatures block state changes if left empty.

### 8. Inventory Site-Fencing
- [ ] Technicians can only view and select spares belonging to the active OT's plant.
- [ ] Global lists and Excel reconciliations are completely hidden in the Technical view.

### 9. Stock-Cap Validation
- [ ] Attempting to consume 11 Control Boards when only 10 are in stock blocks the transaction and triggers `"Stock insuficiente en esta planta"`.
- [ ] Only supervisors can execute manual overrides (logged with justification).

### 10. SharePoint Automation
- [ ] Files generated or approved appear in the virtual folder tree under their exact standardized name format.

### 11. Role Constraints
- [ ] **Técnico (Field Ops):** Clean, focused, mobile-responsive execution cards, zero admin panels, zero bulk import tools.
- [ ] **Supervisor:** Full dashboards, approval queues, inventory loggers, and folder trees.
- [ ] **Jefe O&M:** Strategic BI analytics, escalation centers, and monthly audits.

### 12. Cross-Module Consistency
- [ ] State changes inside `OTManager` propagate immediately across `VistaTerreno`, `PTWCenter`, and `EvidenceVault` without causing data conflicts or UI crashes.

### 13. ORBI Scheduler IA (Módulo 7A Calendar & Agenda)
- [ ] **Técnico Role:** Check that the technician can only see their assigned work, divided in Today, Week, and Corrections. No global calendars, metrics, or other technicians' lists are shown.
- [ ] **Supervisor Role:** Verify the month, week, day, and list view layouts load correctly. Filter by plant, technician, state, type, and priority, confirming entries match criteria.
- [ ] **OT Triage and Scheduling:** Confirm an unscheduled OT can be assigned to a tech with scheduled dates and times. Upon saving, it disappears from the unscheduled list and appears on the correct calendar day.
- [ ] **Sidebar Indicators:** Open the sidebar of an OT to confirm that evidence status, PTW requirements, SharePoint sync status, and spare parts are fetched and visual badges are displayed correctly.

### 14. ORBI Resource Planner (Módulo 7B Planning & Squads)
- [ ] **Technician Role Guard:** Technicians are strictly blocked from seeing the "Resource Planner" view-mode button or the dashboard.
- [ ] **Individual Load cards:** Each card displays name, role, main park, hours, and dynamic load color badge representing correct work duration calculation.
- [ ] **Squad/Cuadrillas cards:** Cuadrillas correctly calculate member summation and overload risk.
- [ ] **Conflict Detector alerts:** Correctly issues warnings for overlaps (e.g. multiple OTs same hour/day), daily overload (>12h), weekly overload (>45h), unassigned critical OTs, and PTW missing coordinator/technician.
- [ ] **Sugerencias ORBI AI:** Correctly suggests reassignments or SLA scheduling, allowing mock executions.
- [ ] **Ruta del Día:** Selecting a technician from the dropdown successfully filters and displays their sequential chronological route for July 8, 2026, complete with detail-links.

### 15. ORBI Report Center (Módulo 8 Cierre Documental)
- [ ] **Role Isolation:** Field technicians and engineers cannot see the "Report Center" tab or access any of its features.
- [ ] **Trays & Queue counts:** Check that all 7 queues load correctly and report the exact number of matching items in their counter bubbles.
- [ ] **Dynamic Documentary Semaphore:** Confirm that checklist, evidence, PTW, spare, diagnosis, and SharePoint statuses are evaluated correctly for each OT and colored matching green/amber/red.
- [ ] **Cantillana Case Alignment:** Confirm that Case `26-29221` remains annual preventative maintenance with 39 Sungrow inverters and no corrective tracker assets.
- [ ] **Corrective Case Alignment:** Confirm Case `OT-26-29222` tracks spare cards, before/after photos, and stock double-entries correctly.
- [ ] **Report Pack compiler:** Confirm that hitting "Generar Report Pack" compiles the dossiers, prepares files, and pushes them to the SharePoint Router under `01 - Reportes OT`.
- [ ] **Devolver a Terreno:** Trigger devolution on an OT. Confirm it transitions status to "Devuelta a ejecución" and reappears under the Technician's pending agenda list with correct comments.
- [ ] **A4 Preview:** Confirm that selecting an OT renders a clean, professional, fully populated and scrollable white A4-style page simulating client delivery.

### 16. ORBI Demo Readiness (Módulo 9A Release & Demo Center)
- [ ] **Role Validation:** Confirm that only Supervisor, Coordinador, Jefe O&M, and Super Admin can view the "Release & Demo Center" tab, while field technicians are strictly blocked.
- [ ] **Checklist Persistence:** Change a checklist item to `Revisar` or `No mostrar`, reload, and confirm it preserves state using local state registers.
- [ ] **Reset Demo Data:** Trigger "Reset Demo Data" and confirm it prompts with dual confirmation dialogs, restoring the base mock database without removing critical user data or non-OT configurations.
- [ ] **Snapshot Export Preview:** Click "Export Snapshot" to open the interactive JSON terminal modal, checking that no real credentials or sensitive client metadata are exported.
- [ ] **Live Sync Monitoring:** Confirm that modifying states in `OTManager` correctly propagates status indicators inside the "Mapa de Casos" view without lagging.
- [ ] **Sandbox Gatekeepers:** Ensure non-production warnings for Softwrench, SharePoint, Maps, Calendars, and PDF builders remain clearly and legibly displayed.

### 17. ORBI Executive Walkthrough (Módulo 9B)
- [ ] **Duration Modes:** Switch between 7, 12, and 18-minute demo modes to verify steps dynamically highlight recommendations or can be skipped.
- [ ] **Guided Steps Detail:** Click each of the 11 steps in the left-hand panel, ensuring correct text mapping, suggested durations, speaker tips, and presenter quotes load instantly.
- [ ] **Walkthrough State Persistence:** Change a step state from "Listo" to "Revisar" or "Omitir" and confirm it persists correctly upon reloading the tab.
- [ ] **Collapsible FAQ & Tips:** Verify the "Presenter Tips", "Key Phrases", and "Expected FAQ" cards render with clean, responsive grid layouts at the footer of the walkthrough tab.

### 18. ORBI Executive Summary Card (Módulo 9C)
- [ ] **Toggle Action:** Verify switching between the 30-second condensed Elevator Pitch view and the comprehensive Bento Grid overview transitions layouts correctly.
- [ ] **Copy to Clipboard:** Click "Copiar Resumen" and check that the correct structured executive plain-text summary matches the selected active version.
- [ ] **Visual Completeness:** Confirm that the bento grid displays general objective, pain points, modules, reference cases (preventive and corrective), role-based benefits, and sandbox limitations clearly.

### 19. ORBI Workspace (Módulo 11A)
- [ ] **Branding Validation:** Verify header loads as `v0.1.2C-QA — Operational Planning Shell` and displays the specialized "Vinculación Operativa" badge.
- [ ] **Ecosystem Division:** Ensure that Workspace does not duplicate execution/closure forms, focusing strictly on scheduling and planning details.
- [ ] **Calendar Indicators:** Validate that day cells in Month view correctly render activity items equipped with badges for blockages, unassigned status, and PTW requirements.
- [ ] **Deep-Linking Redirection:** Click "Abrir en OT Center" on an activity card inside the details panel and verify it successfully transitions the active global view back to the core OT Center.
- [ ] **Matriz de Responsabilidad:** Confirm the responsibilities guidelines card is rendered at the bottom of the "Pendientes de Programación" sidebar tray.

### 20. ORBI Workspace Scheduling & Dispatch UX (Módulo 11B)
- [ ] **Advanced Toggle:** Confirm that toggling between Month, Week, Day, and Dispatch List views switches layouts cleanly with no rendering lag.
- [ ] **Conflict Indicators:** Verify that active warnings for overlapping hours, unassigned critical OTs, and LOTO safety issues load correctly inside the left sidebar.
- [ ] **Reason Tracking:** Confirm that reschedule edits trigger the reason tracking prompt and increment the total `reprogramacionesCount` by 1.
- [ ] **Compact Dispatch List:** Search for "26-29221" inside the Dispatch List, verifying immediate table filtering and layout responsiveness.

### MÓDULO 14A — ORBI MATRIZ DE PLANTAS / ASSET REGISTRY SAFE INTEGRATION
- **Status:** `INTEGRATED / SANDBOX / NON-OPERATIONAL / ASSET REGISTRY READY`
- **Scope & Protection:** Catastro tradicional de activos fotovoltaicos, criticidad, potencia MWp, asignación de responsables y enlace documental. Integración quirúrgica en `MatrizPlantas.tsx`, `src/types.ts` y `src/data/db.ts` manteniendo los módulos congelados (Módulo 13A-FREEZE).
- **Exclusión Absoluta de PVMetrics:** Cero componentes o rutas de PVMetrics IA, forecast, BESS Dispatch Advisor o SCADA Readiness.
- **Persistencia Local:** Persistencia client-side mediante `localStorage` con la clave `orbi_om_db_plantas`.
- **Executive Demo Hub:** Registrado como `INTEGRATED / SANDBOX / NON-OPERATIONAL / ASSET REGISTRY READY`.

### MÓDULO 14A.1 — ORBI MATRIZ DE PLANTAS CRUD & ROLE-GATING HOTFIX
- **Status:** `IMPLEMENTED / SANDBOX / ROLE-GATED / LOCALSTORAGE READY`
- **Controles CRUD Incorporados:**
  1. **Registrar Planta (`+ REGISTRAR PLANTA`):** Modal completo de registro con campos para ID, nombre, cliente, potencia (MWp), zona, región, estado, criticidad, supervisor, ingeniero y enlace documental. Incluye validaciones de ID único, campos requeridos y MWp mayor a cero.
  2. **Editar Planta (`Editar`):** Modal de edición de parámetros de planta con validación de campos obligatorios.
  3. **Retirar del Catastro:** Acción de borrado/retiro con modal de confirmación explícita indicando la modificación sobre la clave local `orbi_om_db_plantas`.
  4. **Restaurar Catastro Demo (`Restaurar Demo`):** Acción administrativa en cabecera con doble confirmación para restaurar las 9 plantas originales desde `INITIAL_PLANTAS`.
- **Role-Gating Aplicado:**
  - **Permisos de Edición:** Reservado para `SUPER_ADMIN_ORBI`, `GERENTE_OM`, `JEFE_TERRENO`, `SUPERVISOR_ZONA`, `JEFE_OM`, `COORDINADOR_OM`.
  - **Modo Solo Lectura:** Para roles no autorizados (e.g., `TECNICO_OM`, `HSE`, `CALIDAD`, `LECTURA_CLIENTE`), se ocultan los botones de modificación y se exhibe el distintivo `MODO SOLO LECTURA`.
- **Aislamiento & Seguridad:** Opera 100% en `localStorage` (`orbi_om_db_plantas`) sin llamadas a APIs externas ni afectación de otros módulos (OTs, Workspace, Flota, etc.).

### MÓDULO 14A-FREEZE — ORBI MATRIZ DE PLANTAS FINAL ASSET REGISTRY RELEASE LOCK
- **Status:** **FROZEN / RELEASE LOCK / SANDBOX / NON-OPERATIONAL / ASSET REGISTRY READY**
- **Parámetros Canónicos Congelados:**
  - **Master Dataset:** 59 plantas fotovoltaicas (`ORBI-PV-001` a `ORBI-PV-059`), 100% IDs válidos y continuos en `MASTER_PLANTS_DATA` / `INITIAL_PLANTAS`.
  - **Archivos Canónicos:** `/src/components/MatrizPlantas.tsx`, `/src/types.ts`, `/src/data/db.ts`, `/src/data/masterPlantsData.ts`.
  - **Persistencia Canónica:** Clave primaria oficial `orbi_om_db_plantas`. Carga limpia e incansable desde `INITIAL_PLANTAS` con reset con doble confirmación.
  - **CRUD Sandbox:** Alta con ID único, edición técnica modular (5 pestañas), retiro/desactivación con confirmación y restauración master completa.
  - **Role Gating Canónico:** Permisos de Edición/Alta/Reset/Retiro restringidos exclusivamente a `SUPER_ADMIN_ORBI`, `GERENCIA`, `JEFE_OM`, `COORDINADOR_OM`. Modo solo lectura automático con distintivo `MODO LECTURA AUDITORÍA` para el resto de los roles canónicos.
  - **Ausencia de PVMetrics:** Sin rastros, imports ni carpetas runtime standalone de PVMetrics. Catastro puro de activos fotovoltaicos.
  - **Vincularidad con Organigrama O&M:** 13 referencias a plantas resueltas de 17 totales en el Organigrama; las 4 restantes son referencias externas/históricas documentadas.
- **Directiva de Congelamiento:** Queda estrictamente prohibido modificar el catastro master, los componentes de la matriz o su estructura sin autorización explícita.

### MÓDULO 15A — ORBI ORGANIGRAMA O&M DATA & HIERARCHY INTEGRATION
- **Status:** `INTEGRATED / SANDBOX / NON-OPERATIONAL / ORGANIZATIONAL DATA READY`
- **Scope:** Integración de la estructura organizacional completa proveniente de ORBI Corporate Assistant en el componente `Organigrama.tsx`.
- **DataSet:** Base canónica de 76 colaboradores activos, 9 áreas operativas y 4 niveles jerárquicos.

### MÓDULO 15A.1 — ORBI ORGANIGRAMA DATA CONSISTENCY & CANONICAL CONTRACTS HOTFIX
- **Status:** `VALIDATED / SANDBOX / NON-OPERATIONAL / ORGANIZATIONAL DATA CONSISTENT / READY TO FREEZE`
- **Resultados de Auditoría:**
  - **Colaboradores Auditaos:** 76/76 colaboradores activos (0 inactivos, 0 duplicados, 0 bucles circulares, 1 nodo raíz `org-1`).
  - **Áreas Operativas:** 9 áreas unificadas (Gerencia, Planificación & Control, Control Gestión, Calidad & HSE, Zona Norte, Zona Centro, Zona Sur, Centro de Control, Comisionamiento & MT, Limpieza).
  - **Alineación Matriz de Plantas:** 13 referencias de plantas mapeadas contra las 59 plantas activas de `MASTER_PLANTS_DATA`; 4 referencias históricas (`Alianza`, `Chinchorro`, `PMG Castilla`, `San Isidro`) conservadas intactas y catalogadas como `REFERENCIA NO RESUELTA (HISTÓRICA / EXTERNA)`.
  - **Contrato de Roles:** Permisos de edición habilitados para `SUPER_ADMIN_ORBI`, `GERENCIA`, `JEFE_OM`, `COORDINADOR_OM`. MODO SOLO LECTURA habilitado para roles operacionales.
  - **Persistencia Canónica:** Clave primaria `orbi-organigrama` con fallback de lectura única y escritura proyectada a claves legacy.
  - **Banner Sandbox & Privacidad:** Desplegado distintivo de `SANDBOX ORGANIZACIONAL — DATOS REFERENCIALES — SIN CONEXIÓN A RR. HH., NÓMINA NI BIOMETRÍA`.

### MÓDULO 15A.2 — ORGANIGRAMA CANONICAL ROLE GATING FINAL FIX
- **Status:** `VALIDATED / CANONICAL ROLE GATING LOCKED / MÓDULO 15A READY TO FREEZE`
- **Inconsistencia Corregida:** Eliminado el código `ADMIN` de los arreglos de permisos de edición por no existir en `ROLES_CONFIG` ni `RoleType`.
- **Roles Canónicos Finales:**
  - **Con Edición/Creación/Reset:** `SUPER_ADMIN_ORBI`, `GERENCIA`, `JEFE_OM`, `COORDINADOR_OM`
  - **Solo Lectura:** `SUPERVISOR_TERRENO`, `INGENIERO_OM`, `TECNICO_OM`, `HSE`, `CALIDAD`, `PLANIFICACION`, `COMISIONAMIENTO`, `LECTURA_CLIENTE`

### MÓDULO 16A — ORBI COMMANDER GLOBAL CONSOLIDATION & SYSTEM AUDIT
- **Status:** `AUDITED / CONSOLIDATED / SANDBOX BASELINE READY`
- **Informe Oficial:** Generado documento `/ORBI_COMMANDER_GLOBAL_AUDIT_16A.md`.
- **Resultados de Auditoría:**
  - **Módulos Activos e Integrados:** 10 módulos principales mapeados en `App.tsx` y `ExecutiveDemoHub.tsx`.
  - **Módulos Pendientes (`Pending Extraction`):** 0 (Ninguno). Todos los componentes están integrados y operativos.
  - **Matriz de Role Gating:** Unificada sobre la fuente canónica `ROLES_CONFIG` (12 roles reales). Eliminados códigos y aliases informales como `ADMIN`.
  - **Mapa de Persistencia:** Claves de `localStorage` aisladas y validadas sin conflictos entre módulos.
  - **Sandbox & Security:** Cero conexiones productivas a APIs externas. Banners de aviso sandbox activos.
  - **Validación Técnica:** `npm run lint` y `npm run build` 100% exitosos sin errores.

### MÓDULO 16A-FREEZE — ORBI O&M COMMAND CENTER CONSOLIDATED SANDBOX RELEASE LOCK
- **Current Version:** `ORBI OT Center v0.X / Workspace v11B / Insight Center 12A / Report Pack 12B / Demo Hub 12C / Flota 13A-FREEZE / MatrizPlantas 14A-FREEZE / Organigrama 15A-FREEZE / Commander 16A-FREEZE — Consolidated Release Lock`
- **Status:** **FROZEN / CONSOLIDATED RELEASE LOCK / SANDBOX / NON-PRODUCTION / GLOBAL DEMO READY**
- **Documento Oficial de Cierre:** `/ORBI_COMMANDER_CONSOLIDATED_RELEASE_LOCK_16A.md`
- **Parámetros Globales Congelados:**
  - **Ecosistema Completo:** 10 módulos activos en `App.tsx` y `ExecutiveDemoHub.tsx`. Cero tarjetas o vistas con `Pending Extraction`.
  - **Canonización de Flota:** Componente raíz activo en `/src/features/fleet/app/OrbiFleetStandaloneShell.tsx` renderizado en `App.tsx` para `activeView === 'Flota'`; `/src/components/FlotaLogistica.tsx` conservado como wrapper de compatibilidad para el selector de vehículos de OT Center.
  - **Datasets Canónicos Consolidados:** Matriz de Plantas (59 plantas fotovoltaicas `ORBI-PV-001` a `ORBI-PV-059`), Organigrama (76 colaboradores activos, 9 áreas, 4 niveles, nodo raíz `org-1`), Flota (Catastro y bitácoras con simulación de telemetría y token `DEMO-TOKEN-NO-OPERATIVO`).
  - **Role Gating Canónico Global:** Estrictamente mapeado sobre los 12 roles de `ROLES_CONFIG`. Permisos de Edición/Alta/Reset/Retiro reservados para `SUPER_ADMIN_ORBI`, `GERENCIA`, `JEFE_OM`, `COORDINADOR_OM`. Mantenido Modo Solo Lectura / Auditoría para los 8 roles restantes.
  - **Aislamiento & Seguridad Sandbox:** Cero consumo de APIs externas (`fetch`/`axios`), WebSockets, Firebase, SharePoint Graph API real, Entra o GPS productivo.
  - **Archivos Fuera de Runtime:** `/src/_migration/fleet-13a0/`, `/scripts/` y scripts auxiliares clasificados como `ISOLATED / NON-RUNTIME / NO ACTIVE IMPORTS`.
- **Directiva de Cierre Global:** Queda estrictamente prohibido modificar el código, la arquitectura, los datasets o los contratos de los módulos congelados (13A, 14A, 15A, 16A) salvo mediante la apertura formal de un nuevo módulo autorizado (e.g., MÓDULO 17A).

### MÓDULO 16B.1 — CANONICAL PLANT IDENTITY & OPERATIONAL DATA ALIGNMENT
- **Status:** `VALIDATED / CANONICAL PLANT CONTRACT INTEGRATED / DATA MIGRATION VALIDATED / SANDBOX READY`
- **Documento Oficial de Alineación:** `/ORBI_COMMANDER_PLANT_IDENTITY_ALIGNMENT_16B1.md`
- **Mapeo Canónico:** Integrado en `/src/data/plantIdentityMap.ts` y sincronizado con las 59 plantas de `/src/data/masterPlantsData.ts` (`ORBI-PV-001` a `ORBI-PV-059`).
- **Migración de Datos Operacionales:** 38/38 registros (100.0% de resolución) alineados entre OTs, hallazgos HSE/Calidad, planificación preventiva, inventario O&M, movimientos de bodega, PTWs y vehículos de flota.
- **Trazabilidad Inmutable:** Conservada propiedad `legacyPlantId` en todos los tipos de datos operacionales para auditoría.
- **Migración LocalStorage:** Implementada función `runPlantIdentityMigration16B1()` con clave de control `orbi_data_migration_16b1_plant_identity_v1`.
- **Validación Runtime & UI:** Filtros de planta en OT Center, Workspace, Matriz de Plantas e Insight Center operan sin conflictos ni pantallas blancas.

### MÓDULO 16B.1D — PLANT IDENTITY COUNT RECONCILIATION & MIGRATION VERSION GATE
- **Status:** `VERIFIED COUNTS / VERSIONED MIGRATION / NO FORCED RELATIONSHIPS / READY FOR INDEPENDENT REVIEW`
- **Documento Oficial:** `/ORBI_COMMANDER_PLANT_IDENTITY_ALIGNMENT_16B1.md`
- **Reconciliación de Conteos Auditada:**
  - **Total de Registros Auditados:** 38 registros activos en datasets (9 OTs, 5 HSE, 5 Planificación, 11 Inventario, 4 Movimientos, 1 PTW, 3 Vehículos).
  - **Cantillana (P10) Conteos:** Reconciliado exactamente a 9 registros (1 OT `26-29221`, 1 PTW `PTS-CANT-2026-089`, 4 Ítems de Inventario, 3 Movimientos).
  - **Desglose por Estado Semántico:** 17 Resueltos (11 `RESOLVED_EXACT`, 4 `RESOLVED_ALIAS`, 2 `RESOLVED_BY_UNIQUE_COMMUNE`), 17 `PROVISIONAL`, 4 `HISTORICAL_EXTERNAL`, 0 `UNRESOLVED`.
- **Reglas Semánticas Strict Execution:** Los registros `PROVISIONAL`, `UNRESOLVED` e `HISTORICAL_EXTERNAL` no poseen asignado un ID canónico `ORBI-PV-xxx` (no forzado). Las plantas históricas/externas (`Luz del Norte` P02, `Quillagua` P03) quedan aisladas de las métricas de las 59 plantas del máster.
- **Migración Versional Idempotente:** Creada `runPlantIdentityFinalMigration16B1D()` con clave `orbi_data_migration_16b1d_plant_identity_final_v1` en `src/data/db.ts`.
- **Validador Automatizado:** Implementado `src/data/validateData.ts` ejecutable mediante `npm run validate:data` (retorna `EXIT CODE 0 / PASS`).

---

## 6. DEVELOPMENT RULES (FOR ALL AGENTS)

1. **Keep it Local & Safe:** Continue using robust LocalStorage-backed state synchronization. DO NOT implement real database calls or actual OAuth modules unless explicitly requested.
2. **Typography & Aesthetics:** Adhere strictly to ORBI’s modern Swiss look. Use **Inter** for standard texts, **Space Grotesk** for display headers, and **JetBrains Mono** for serials, item codes, and logs.
3. **Architecture Isolation:** Keep sub-components modular. Never merge multiple full-pane tools back into `App.tsx` or `OTManager.tsx` to avoid token length overflows.
4. **No Tech-Larping Clutter:** Maintain a pristine design. Never add fake shell command logs, system ping stats, or container-level environment readouts in the UI.
5. **No Broken Builds:** Every code modification must build successfully (`npm run build`) and pass TypeScript validation checks (`tsc --noEmit`) before completing a turn.
