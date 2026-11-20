# Alarmas del SCADA (VCOM) → correctivos en ORBI

ORBI revisa las alarmas abiertas de VCOM a través del **portal O&M de TriTec** (`GET /api/v1/vcom/alarms`) y crea los correctivos automáticamente. Cada correctivo nace en estado **"Nueva"** y aparece en **OT Center → Por aprobar**, donde coordinación lo aprueba y lo asigna.

## Regla

| Condición | Qué hace ORBI |
|---|---|
| Severidad **high** o **critical** | Crea un correctivo (critical → prioridad Alta; high → Media) |
| Severidad normal | No crea OT |
| Abierta hace menos de 30 minutos | Espera a la próxima revisión (evita OTs por fallas pasajeras) |
| Cerrada en VCOM | No crea OT |
| Ya generó una OT | No la duplica (el código del correctivo es `AL-<planta>-<id de alarma>`) |
| Varias alarmas del mismo equipo al mismo tiempo | Un solo correctivo con todas |
| Equipo con un correctivo por alarma aún abierto | La alarma nueva se agrega a ese correctivo |

El correctivo queda vinculado al equipo del catastro cuando VCOM informa su nombre (por ejemplo, `GI-106`). La ficha de la OT y la bandeja "Por aprobar" muestran la alarma de origen, su severidad y desde cuándo está activa.

## Qué falta para conectarlo (lo entrega TI)

1. **Registrar ORBI como aplicación en Entra ID** con permiso de lectura de alarmas en la API del portal O&M (flujo de credenciales de aplicación, servidor a servidor).
2. **Confirmar el ambiente:** la API revisada es la de desarrollo; para el piloto se necesita la de producción.
3. **Clave de VCOM de cada planta** (`systemKey`, por ejemplo `PV61D`). La entrega el mismo portal en `GET /api/v1/vcom/systems`.

Con eso, en el servidor del piloto se configuran estas variables (los secretos nunca van al repositorio):

```
ORBI_PORTAL_OM_URL=https://<portal de producción>
ORBI_PORTAL_OM_TENANT=<id del directorio>
ORBI_PORTAL_OM_CLIENT_ID=<aplicación de ORBI>
ORBI_PORTAL_OM_CLIENT_SECRET=<secreto>
ORBI_PORTAL_OM_SCOPE=api://<id de la API del portal>/.default
ORBI_VCOM_PLANTAS=<systemKey de Cantillana>=ORBI-PV-058
ORBI_ALARMAS_MINUTOS=15
```

Al reiniciar, el servidor revisa las alarmas cada 15 minutos. Sin estas variables la integración queda apagada y "Por aprobar" lo indica.

## Probar sin conexión

```powershell
npm run alarmas -- docs/ejemplos/alarmas-ejemplo.json
```

Simula con alarmas de ejemplo y muestra qué correctivos crearía, sin escribir nada. **No usar `--aplicar` con el archivo de ejemplo en la base del piloto**: crearía OTs con datos inventados.

Una vez configurado el portal, `npm run alarmas -- --portal` consulta una vez y muestra el resultado (con `--aplicar`, crea los correctivos).

## Pendiente de confirmar con la primera respuesta real

El portal entrega las alarmas tal como las da VCOM, sin un esquema publicado. ORBI acepta los nombres de campo habituales (`id`, `severity`, `status`, `title`/`description`, `startedAt`/`startTime`, `components[].name`). Si llegaran con otro formato, el resumen las informa como "no reconocidas" y no se crea nada: se ajusta `normalizarAlarma` en `src/domain/alarmas.ts`.
