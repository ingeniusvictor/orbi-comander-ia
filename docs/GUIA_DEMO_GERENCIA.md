# Guía Ejecutiva de Demostración para Gerencia — ORBI O&M Command Center IA

Esta guía está diseñada para conducir una demostración fluida, segura y de alto impacto de **12 minutos** frente a Gerencia General, Operaciones y Jefatura O&M.

---

## 1. Preparación Previa (2 minutos antes de la reunión)

1. **Verificar estado del servidor:**
   - Ejecuta `npm run dev` (o `npm start` tras `npm run build`).
   - Comprueba en tu navegador o terminal que `http://localhost:3000/api/health` responde `"status": "ok"`.
   - **Nota de contingencia:** No necesitas conexión externa obligatoria. Si `GEMINI_API_KEY` no está activa o falla la red de sala, **Foton Prime IA** conmuta automáticamente a su motor ejecutivo local con métricas reales de la cartera.

2. **Restaurar datos limpios de demostración:**
   - Ingresa a `http://localhost:3000` con rol **Jefe O&M** (`Felipe Soto`).
   - Ve al módulo **Demo Readiness Center** (o **Executive Demo Hub**) y pulsa **Reset Demo Data** para asegurar que los casos de Cantillana (`26-29221` y `OT-26-29222`) estén en su estado inicial.

---

## 2. Guion Cronológico de Presentación (12 Minutos)

### Hito 1 — Visión Estratégica y Control Ejecutivo (`2.0 min`)
- **Vista:** `Home Ejecutivo` (Rol: **Jefe O&M** o **Gerencia**).
- **Qué mostrar:**
  - Consola unificada con disponibilidad de cartera fotovoltaica, cumplimiento de SLA, estado de flota y alertas críticas en tiempo real.
  - Cambio instantáneo de identidad en el selector superior de roles para demostrar gobernanza por perfil (12 roles RBAC).
- **Mensaje clave:**
  > *«ORBI elimina las planillas Excel desconectadas y los reportes por WhatsApp: unifica planificación, ejecución en terreno, seguridad HSE e informes ejecutivos en una sola plataforma.»*

### Hito 2 — Experiencia Móvil Cero Burocracia para Terreno (`2.5 min`)
- **Vista:** Cambiar rol a **Técnico de Terreno (`TECNICO_OM`)** → `Vista Terreno (Mi Agenda)`.
- **Caso demo:** **OT `26-29221` — PM Anual Inversores Sungrow SG250 (Planta Solar Cantillana)**.
- **Qué mostrar:**
  - Interfaz móvil limpia: el técnico ve únicamente sus tareas asignadas del día, checklist técnico guiado y captura fotográfica estructurada (*Antes / Durante / Después* en Modo Limpieza).
- **Mensaje clave:**
  > *«El técnico en planta no pierde tiempo armando informes: ejecuta su checklist, registra evidencias y descuenta repuestos desde el terreno.»*

### Hito 3 — Planificación Inteligente y Prevención de Sobrecarga (`2.5 min`)
- **Vista:** Volver a **Jefe O&M** o **Supervisor Terreno** → `ORBI Workspace` (`Scheduler IA` y `Resource Planner`).
- **Qué mostrar:**
  - Bandeja de OTs sin programar (*Triage Inbox*), asignación visual en calendario y **Detector de Conflictos** (alerta automática por sobrecarga `>12h/día` o `>45h/semana` y colisiones geográficas).
- **Mensaje clave:**
  > *«Antes de despachar una camioneta a planta, el sistema valida disponibilidad, fatiga laboral y cumplimiento de permisos.»*

### Hito 4 — Seguridad Operacional (PTW / LOTO) e Inventario Geocercado (`2.5 min`)
- **Vista:** `PTW Center` e `Inventario O&M`.
- **Caso demo:** **OT `OT-26-29222` — Correctiva Inversor Central C2 Cantillana**.
- **Qué mostrar:**
  - Bloqueo preventivo: ninguna maniobra crítica avanza sin AST y firmas digitales cruzadas en `PTW Center`.
  - Stock estanco por planta en `Inventario O&M`: bloqueo automático de saldos negativos y trazabilidad de movimientos por OT.

### Hito 5 — Analítica Directiva IA y Dossier PDF en Un Click (`2.5 min`)
- **Vista:** `ORBI Insight Center` y `Report Center`.
- **Qué mostrar:**
  - Ejecutar una consulta directiva en **Foton Prime IA** (*«Diagnóstico de plantas críticas y saturación de cuadrillas»*).
  - Mostrar los semáforos documentales en `Report Center` y previsualizar el **Report Pack A4** listo para cliente y archivo estandarizado en **SharePoint Router**.

---

## 3. Respuestas Rápidas a Preguntas de Gerencia

| Pregunta frecuente | Respuesta recomendada |
| :--- | :--- |
| **¿Está conectado hoy a Softwrench o SharePoint productivo?** | No en esta versión candidata (`Sandbox Mode`): opera con datos maestros reales aislados para garantizar velocidad y cero riesgo de modificar registros productivos durante la evaluación. La capa de persistencia ya está modularizada (`src/data/storage.ts`) para conectar APIs REST/PostgreSQL en la fase de despliegue. |
| **¿Qué pasa si se cae internet en una planta remota?** | La arquitectura opera con persistencia local resiliente (`localStorage` + exportación/importación de snapshots JSON) y motor analítico local de contingencia. |
| **¿Cómo se asegura la calidad de los datos de plantas?** | El proyecto incluye un validador automatizado (`npm run validate:data`) que reconcilia los códigos históricos (`P01..P14`) con el catastro maestro `ORBI-PV-xxx` y aísla los datos de benchmark externo. |
