# ORBI O&M Command Center IA

Plataforma integral de comando operacional para **Operación y Mantenimiento (O&M) de Plantas Fotovoltaicas**. Conecta planificación de cuadrillas, ejecución móvil en terreno, control de permisos de trabajo seguro (PTW / AST / LOTO), inventario segmentado por planta, trazabilidad documental y analítica ejecutiva asistida por IA.

## Arquitectura del Sistema

```text
orbi-comander-ia/
├── src/
│   ├── components/          # 26 vistas operacionales (Home Ejecutivo, OT Center, Workspace, PTW, Vault, BI)
│   ├── features/fleet/      # Módulo especializado de control satelital y logística de flota
│   ├── data/
│   │   ├── db.ts            # Fachada unificada de estado, seeds e inicialización
│   │   ├── storage.ts       # Capa de persistencia localStorage + export/import de snapshots
│   │   ├── rolesConfig.ts   # Matriz RBAC de 12 roles operacionales y ejecutivos
│   │   ├── masterPlantsData.ts # Catastro maestro de plantas fotovoltaicas ORBI
│   │   ├── plantIdentityMap.ts # Reconciliación canónica P01..P14 -> ORBI-PV-xxx
│   │   ├── biDataBridge.ts  # Aislamiento analítico entre datos operacionales y benchmark
│   │   └── validateData.ts  # Validador automático de integridad taxonómica y scopes
│   └── types.ts             # Contratos TypeScript de dominio O&M
├── server.ts                # Servidor Express híbrido (Vite dev / dist prod) + API Foton Prime IA
├── tests/                   # Suite de verificación automatizada (integridad, API, arquitectura)
├── docs/
│   ├── GUIA_DEMO_GERENCIA.md # Guion paso a paso de 12 minutos para presentación ejecutiva
│   ├── audits/              # Informes históricos de auditoría y cierre de alcance
│   └── archive/             # Artefactos históricos de migración archivados
└── .github/workflows/ci.yml # Pipeline de integración continua (lint, validación, tests, build)
```

## Requisitos Previos

- **Node.js** `>= 18.18` (recomendado `20 LTS`)
- **npm** `>= 9`

## Instalación y Ejecución Rápida

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno (opcional):**
   ```bash
   cp .env.example .env
   ```
   > **Modo Sandbox Resiliente:** Si `GEMINI_API_KEY` no está configurada o no hay acceso a internet durante una demostración, el servidor activa automáticamente el motor analítico local (*Foton Prime O&M IA*) sin interrumpir la experiencia.

3. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   Abrir `http://localhost:3000` en el navegador.

4. **Compilar y ejecutar en modo producción:**
   ```bash
   npm run build
   npm start
   ```

## Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor Express + Vite en `http://localhost:3000` |
| `npm run build` | Compila el frontend (`dist/`) y empaqueta `dist/server.cjs` |
| `npm start` | Ejecuta el servidor compilado en modo producción |
| `npm run lint` | Ejecuta verificación estática estricta con TypeScript (`tsc --noEmit`) |
| `npm run validate:data` | Audita la integridad de plantas, cohortes P01..P14 y scopes BI |
| `npm test` | Ejecuta la suite de pruebas automatizadas en `tests/run-all.mjs` |
| `npm run verify` | Ejecuta `lint` + `validate:data` + `test` en cadena |

## Endpoints Backend (`server.ts`)

- `GET /api/health`: Estado del servidor, versión y modo activo de IA (`gemini-live` o `sandbox-resilient`).
- `POST /api/bi/reporte-ia`: Genera análisis narrativo ejecutivo mediante `gemini-2.5-flash` con validación de entrada, límite de tasa (*20 req/min*) y fallback local automático ante fallos externos.

## Presentación a Gerencia

Consulta la guía completa en [`docs/GUIA_DEMO_GERENCIA.md`](docs/GUIA_DEMO_GERENCIA.md) o abre el módulo integrado **Executive Demo Hub (12C)** y **Demo Readiness Center (9A/9B)** directamente desde la barra lateral de la aplicación.
