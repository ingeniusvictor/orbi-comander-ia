# ORBI — Piloto 17A: puesta en marcha

Guía para instalar el piloto en un servidor y entregar acceso a técnicos y supervisores.

## Qué incluye la Fase 1

- **Servidor con base de datos** (SQLite integrada en Node 24+). Un técnico en su teléfono y un supervisor en su PC ven las mismas OTs.
- **Inicio de sesión real.** El rol sale del usuario, no de un selector. Primer ingreso obliga a cambiar la contraseña.
- **Reglas en el servidor.** Las transiciones de estado, firmas y validaciones se revalidan en el servidor con el usuario de la sesión. Un técnico solo ve y modifica sus OTs asignadas.
- **Fotos reales** desde la cámara del teléfono, reducidas a 1600 px (eso también elimina metadatos GPS/EXIF), guardadas en el servidor.
- **Datos compartidos:** inventario, movimientos, PTW, escalamientos, hallazgos HSE, planificación y plantas se guardan en el servidor.
- **Cola de cambios pendientes:** si se corta la señal, los cambios de OTs y colecciones esperan en el teléfono y se envían al volver la conexión (indicador "sin sincronizar" en la cabecera).
- **Respaldos automáticos** al iniciar y cada 24 h (se conservan 14).

## Qué incluye la Fase 2

- **Activos y Preventivos** (menú "Mando O&M", para planificación y jefatura): árbol de activos por planta con importación desde CSV, planes preventivos con periodicidad, plantillas de checklist y catálogos de códigos.
- **OTs preventivas automáticas:** el servidor genera las OTs de cada plan cuando entran en su ventana de anticipación (al iniciar, cada día y con el botón "Generar OTs ahora"). Nunca duplica una OT del mismo plan y fecha.
- **Motivo de espera obligatorio** al pasar una OT a espera, y **codificación de falla** (problema, causa, acción) obligatoria para cerrar correctivas.
- **Horas hombre por técnico** (fecha, hora de inicio y fin); el total de la OT es la suma.
- **Checklist con respuestas numéricas:** un valor fuera de rango queda marcado como hallazgo.

### Cargar activos reales

En "Activos y Preventivos" → "Activos" → "Importar desde CSV", pegar el contenido de un CSV con encabezado:

```
id;padre;planta;codigo;nombre;tipo;fabricante;modelo;serie
```

`planta` es el id del catastro (por ejemplo `ORBI-PV-058`); `tipo` uno de: Planta, Area, Inversor, Transformador, Celda MT, Tracker, String, Estacion Meteo, SCADA, Otro.

## Qué incluye la Fase 3

- **App instalable en el teléfono:** desde el navegador, "Agregar a pantalla de inicio". Se abre como una app.
- **Trabajo sin señal:** si el técnico ya entró una vez con señal, la app abre aunque no haya conexión, con sus OTs guardadas en el teléfono. Una franja amarilla avisa "Sin señal" y la cabecera muestra cuántos cambios esperan.
- **Fotos sin señal:** la foto queda guardada en el teléfono y se sube sola al volver la conexión, antes que los cambios que la mencionan.
- **Foto por pregunta del checklist:** las preguntas de plantilla marcadas "requiere foto" no se pueden dar por hechas sin su foto.

Recomendación para el piloto: que cada técnico abra la app con señal al inicio de la jornada (en la oficina o el vehículo) para tener su copia de trabajo al día.

## Instalación con Docker

```bash
docker build -t orbi-piloto .
docker run -d --name orbi -p 3000:3000 \
  -v orbi-datos:/data \
  -e COOKIE_SECURE=true -e TRUST_PROXY=1 \
  orbi-piloto
```

- `-v orbi-datos:/data` es **obligatorio**: ahí viven la base, las fotos y los respaldos. Sin volumen, un redespliegue borra todo.
- Publicar **siempre detrás de HTTPS** (nginx, Caddy o el balanceador corporativo). Con HTTPS usar `COOKIE_SECURE=true` y `TRUST_PROXY=1`.
- Para cargar las OTs y datos de demostración en un ambiente de prueba: `-e ORBI_SEED_DEMO=true`. En el piloto real, **no** usarlo.

## Usuarios

El nombre del usuario debe escribirse **igual que en las OTs** (por ejemplo "Víctor León"), porque así se filtran las OTs del técnico.

```bash
# Desarrollo
npm run user -- create vleon TECNICO_OM "Víctor León"
npm run user -- list
npm run user -- reset-password vleon
npm run user -- deactivate vleon

# Dentro del contenedor
docker exec -it orbi npm run user:prod -- create mvaldes SUPERVISOR_TERRENO "Mauricio Valdés"
```

La contraseña inicial se muestra una sola vez: entregarla en persona. Al entrar, el sistema pide cambiarla.

Roles: `SUPER_ADMIN_ORBI`, `GERENCIA`, `JEFE_OM`, `COORDINADOR_OM`, `SUPERVISOR_TERRENO`, `INGENIERO_OM`, `TECNICO_OM`, `HSE`, `CALIDAD`, `PLANIFICACION`, `COMISIONAMIENTO`, `LECTURA_CLIENTE`.

## Respaldos

- Automáticos en `/data/backups` (archivo `.sqlite` completo, seguro aunque el servidor esté en uso).
- **Copiar también fuera del servidor** `/data/backups` y `/data/uploads` (fotos) al menos una vez al día.
- Restaurar: detener el contenedor, reemplazar `/data/orbi.sqlite` por el respaldo elegido y volver a iniciar. Ensayarlo una vez antes del piloto.

## Desarrollo local

```bash
npm install
echo ORBI_SEED_DEMO=true > .env     # datos de demostración
npm run user -- create jefe JEFE_OM "Jefe Prueba"
npm run dev                          # http://localhost:3000
npm run verify                       # lint + validación de datos + pruebas
```

## Limitaciones conocidas del piloto (para declarar ante gerencia)

- **Colecciones compartidas** (inventario, PTW, escalamientos) se guardan como un bloque: si dos personas modifican el mismo bloque a la vez, gana la primera y la segunda ve un aviso para reaplicar su cambio.
- **Organigrama** sigue guardándose solo en cada navegador (dato maestro de baja edición).
- **Módulos de presentación** (Executive Demo Hub, Release Center, SharePoint Router, Insight Center) siguen siendo simulaciones; no forman parte del alcance operativo del piloto.
- **Integración con Maximo/SoftWrench:** no incluida en el piloto.
