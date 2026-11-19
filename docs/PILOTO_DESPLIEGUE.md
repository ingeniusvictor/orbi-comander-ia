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

- **Fotos sin señal:** los cambios de texto esperan en la cola, pero una foto necesita conexión al momento de subirla. El modo sin conexión completo (incluidas fotos) es la Fase 3.
- **Colecciones compartidas** (inventario, PTW, escalamientos) se guardan como un bloque: si dos personas modifican el mismo bloque a la vez, gana la primera y la segunda ve un aviso para reaplicar su cambio.
- **Organigrama** sigue guardándose solo en cada navegador (dato maestro de baja edición).
- **Módulos de presentación** (Executive Demo Hub, Release Center, SharePoint Router, Insight Center) siguen siendo simulaciones; no forman parte del alcance operativo del piloto.
- **Integración con Maximo/SoftWrench:** no incluida en el piloto.
