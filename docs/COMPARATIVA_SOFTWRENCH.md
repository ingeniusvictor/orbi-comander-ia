# ORBI O&M Work Center frente a SoftWrench: qué conviene incorporar

Fecha: 2026-11-20. Fuente: datos reales de SoftWrench/Maximo de la operación (conector O&M), últimos 90 días, y revisión del código de ORBI en la rama `feat/piloto-17a`.

## Lo que muestran los datos de SoftWrench

| Medida (últimos 90 días) | Valor | Qué significa |
|---|---|---|
| OTs preventivas | 3.013 | Volumen que ORBI debe soportar sin problemas |
| Completadas | 1.446 (48 %) | |
| Ejecutadas sin cerrar (FDCOMP) | 500 (17 %) | El cierre administrativo es el cuello de botella (8 a 10 días entre ejecutada y cerrada) |
| Vencidas (activas con fecha pasada) | 824 (27 %) | Falta control de fechas comprometidas |
| Correctivos pendientes | 483 | Varios llevan más de 100 días "En espera de aprobación"; el más antiguo, 302 días |
| OTs de camionetas | 365 | La flota también se mantiene con OTs en el mismo sistema |
| OTs con vínculo a otra OT | 27 | Casi siempre un correctivo creado a partir de un hallazgo en un preventivo; se registra a mano y por eso es escaso |

## Comparación por función

| # | Función en SoftWrench | ORBI hoy | Recomendación | Prioridad |
|---|---|---|---|---|
| 1 | **Correctivo de seguimiento** vinculado al preventivo donde se encontró la falla (relación origen/seguimiento, OT padre/hija) | No existe | En el checklist, el botón "Hallazgo" ofrece "Crear correctivo" con planta, activo, foto y pregunta ya cargados, y deja el vínculo en ambas OTs | Alta |
| 2 | **Aprobación de correctivos** (estado "Espera aprobación") | El estado existe, pero no hay bandeja ni alertas | Bandeja "Por aprobar" para coordinador y jefatura, con días de espera y aviso sobre 15 días | Alta |
| 3 | **OT cobrable**: el coordinador la marca cuando el cliente aprueba el cobro | No existe | Campo "Cobrable" con quién y cuándo lo aprobó; reporte mensual por cliente | Alta |
| 4 | **Fecha objetivo por contrato** (Target Start) distinta de la fecha programada | El generador de preventivos usa una sola fecha | Guardar la fecha objetivo y el margen del contrato; tablero de vencidas por planta y cliente | Alta |
| 5 | **Cola de cierre** (ejecutada → revisión del coordinador → cerrada) | Report Center tiene bandejas, pero sin plazos | Contador de días en cada bandeja, meta de cierre (p. ej. 3 días) y aprobación de varias OTs a la vez | Alta |
| 6 | **Próxima visita al parque** para aprovechar el viaje con correctivos pendientes | No existe | En Workspace, al programar una visita, mostrar los correctivos pendientes de esa planta para sumarlos | Media |
| 7 | **Estado "Desviaciones encontradas"** (RQARVW) en la revisión de calidad | No existe (sí existe "en revisión") | Agregar el estado y su código SoftWrench a la máquina de estados | Media |
| 8 | **Tareas dentro de la OT** y varios checklists por OT (abierto, intermedio, finalizado) | Un checklist por OT | Permitir varias plantillas por OT (p. ej. inversores y celdas en la misma visita) | Media |
| 9 | **Bitácora del técnico** (worklog con fecha y autor) | Historial de cambios y diagnóstico, sin notas libres | Notas con fecha y autor, también sin señal | Media |
| 10 | **Mantenimiento de camionetas con OTs** | Módulo de Flota separado, sin OTs | Planes preventivos para vehículos usando el mismo catastro de activos (tipo "vehículo") | Media |
| 11 | **Portafolio / cliente y zona** como filtros de todo | Parcial (Insight Center) | Filtro de cliente y zona en OT Center, Workspace y reportes | Baja |
| 12 | Compras, cotizaciones y contratos | Fuera del alcance actual | Dejar para una fase posterior; por ahora, solo el número de OC en la OT | Baja |

## Donde ORBI ya es mejor que SoftWrench (no perder)

- **Activo real en cada OT.** En Maximo el activo suele ser el parque completo y el historial de un equipo depende de que el técnico lo nombre en la descripción. ORBI usa el catastro jerárquico; falta solo una "ficha del equipo" con su historial.
- **Trabajo sin señal**, con fotos en cola y sincronización automática.
- **Foto obligatoria por pregunta** y valores fuera de rango detectados al momento.
- **PT y firmas digitales** dentro de la app, en vez de PDF adjuntos o fotografiados que luego hay que revisar uno por uno (y que a veces se repiten entre OTs).
- **Reglas que no se pueden saltar**: el motivo de espera y la codificación de falla se exigen al cambiar de estado, y el servidor valida cada cambio.
- **HH por técnico**, con el total calculado por el servidor.

## Lo que no conviene copiar

- OTs hijas vacías (registros sin descripción ni planta) que SoftWrench lista como hijas.
- Vínculos entre OTs hechos a mano: en ORBI deben nacer solos desde el hallazgo.
- Cierres administrativos sin plazo visible.

## Propuesta de siguiente fase (Módulo 17B)

1. Correctivo de seguimiento desde el hallazgo del checklist (punto 1).
2. Bandeja de aprobación con días de espera y marca de "cobrable" (puntos 2 y 3).
3. Fecha objetivo del contrato y tablero de vencidas (punto 4).
4. Plazos en la cola de cierre y aprobación múltiple (punto 5).
5. Correctivos pendientes al programar una visita (punto 6).

Los puntos 1 a 5 atacan directamente los tres números que más pesan hoy: 483 correctivos pendientes, 500 OTs ejecutadas sin cerrar y 824 preventivos vencidos.
