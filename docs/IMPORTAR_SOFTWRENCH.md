# Importar datos de SoftWrench a ORBI O&M Work Center

Sirve para cargar en el piloto los datos reales de una planta: equipos, formularios de checklist, planes preventivos y OTs abiertas o ejecutadas sin cerrar.

## 1. Extracción

La extracción es un archivo JSON con `"fuente": "SoftWrench"`, la planta (nombre y `plantaId` de la Matriz de Plantas) y cuatro listas: `equipos`, `plantillas`, `planes` y `ots`. El formato está definido en `src/domain/softwrenchImport.ts` (`SwSnapshot`).

Se arma con el conector O&M (planes de mantenimiento, detalle de OTs, checklists y equipos SCADA de la planta).

**Contiene datos reales de la operación:** guárdala en `data/importaciones/`, que está fuera de git. Nunca la subas al repositorio.

## 2. Simular

```powershell
npm run import:softwrench -- data/importaciones/softwrench-cantillana-2026-11-20.json
```

Muestra cuántos equipos, plantillas, planes y OTs se importarían sin escribir nada.

## 3. Aplicar

Primero saca un respaldo (el servidor hace uno diario en `data/backups/`) y luego:

```powershell
npm run import:softwrench -- data/importaciones/softwrench-cantillana-2026-11-20.json --aplicar
```

Importar dos veces no duplica nada: lo que ya existe se informa como "ya existía".

## Reglas

| Dato | Cómo queda en ORBI |
|---|---|
| Equipos | Jerarquía planta → grupo → equipo, con el tag de SoftWrench/SCADA |
| Formularios | Una plantilla por formulario; con sus preguntas reales cuando la extracción las trae (si no, una pregunta que pide completar ese formulario) |
| Planes | **Inactivos**: mientras SoftWrench siga generando las OTs, ORBI no crea las mismas. Se activan en "Activos y Preventivos" el día que ORBI pase a ser el sistema principal |
| OTs | Solo abiertas o ejecutadas sin cerrar (las cerradas siguen en SoftWrench). Mismo número de OT, enlace "Ver en SoftWrench", fecha objetivo del contrato, cobrable y equipo detectado en la descripción (p. ej. GI-106) |
| Estados | WAPPR → Nueva · RTBSCH → Asignada · DAPPR → Programada · INPROG → En ejecución · HOLD → Bloqueada · RQARVW → En revisión Calidad · FDCOMP → Finalizada · RSALOR → En revisión Coordinador · COMPL/CLOSED/CAN → no se importan |
| Ejecutadas sin cerrar | Entran a la "Cola de cierre" con el día de ejecución en terreno; su checklist, fotos y PDF quedan en SoftWrench |
| Personas | El técnico es quien registró horas; el coordinador, el dueño de la OT. Las OTs abiertas sin técnico se asignan en ORBI |
