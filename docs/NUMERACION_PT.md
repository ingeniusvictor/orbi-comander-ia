# Numeración de permisos de trabajo (PT/AST)

Antes, ORBI inventaba el número del permiso al azar (del 100 al 999), con riesgo de repetir números y de chocar con la numeración que usa la operación. Ahora el número lo entrega el servidor **al guardar** el permiso.

## Con el portal O&M conectado (numeración oficial)

1. El servidor reserva el siguiente número de la planta y el año en el portal (`/softwrench-pt-ast/correlativos/{acrónimo}/{año}/siguiente`), el mismo contador que usa la operación.
2. Registra el PT en la bitácora oficial del portal (`/log-pt`) con el código, la planta, el cliente, el técnico, las fechas y el tipo de OT (PM, CM, EC u OTHER).
3. Si el registro falla, devuelve el número reservado (`/liberar`) para no dejar huecos, y el permiso no se crea.

Configuración en el servidor (además de las variables `ORBI_PORTAL_OM_*` de `docs/ALARMAS_VCOM.md`):

```
ORBI_PT_ACRONIMOS=ORBI-PV-058=<acrónimo de Cantillana>
ORBI_PT_FORMATO=PT-{acronimo}-{anio}-{correlativo}
```

- El **acrónimo** de cada planta lo define la operación: es el mismo que usa hoy el portal. Si una planta no lo tiene configurado, ORBI no inventa uno y avisa (así no choca con la numeración oficial).
- El **formato** del código debe ser igual al que usa hoy la operación; `{correlativo}` va con 3 dígitos. Confirmarlo con un PT real antes de activar.

## Sin el portal (como funciona hoy el piloto)

El servidor lleva su propio contador por planta y año (tabla `pt_correlativos`), que continúa después del número más alto ya usado y nunca repite. El acrónimo se toma de `ORBI_PT_ACRONIMOS` o, si no está, de las 4 primeras letras de la planta. Estos permisos quedan marcados como **numeración local** en el registro de auditoría y en el permiso (`numeracion: 'local'`).

## En terreno

Obtener el número requiere conexión con el servidor. Sin señal, ORBI lo indica y no crea el permiso: así se evita que dos teléfonos sin señal usen el mismo número.

El número del AST asociado es el del PT con el sufijo `-AST`.
