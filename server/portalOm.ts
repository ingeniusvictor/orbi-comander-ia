/**
 * MÓDULO 17D — Cliente del portal O&M de TriTec (API con inicio de sesión de Microsoft Entra ID).
 *
 * Se activa solo si están todas las variables de entorno:
 *   ORBI_PORTAL_OM_URL            p. ej. https://<portal>.azurecontainerapps.io
 *   ORBI_PORTAL_OM_TENANT         id del directorio (tenant) de Entra ID
 *   ORBI_PORTAL_OM_CLIENT_ID      aplicación registrada para ORBI (la entrega TI)
 *   ORBI_PORTAL_OM_CLIENT_SECRET  secreto de esa aplicación (nunca en el repositorio)
 *   ORBI_PORTAL_OM_SCOPE          p. ej. api://<id de la API del portal>/.default
 *   ORBI_VCOM_PLANTAS             plantas a revisar: "<systemKey>=<plantaId ORBI>,..."  (p. ej. PV61D=ORBI-PV-058)
 * Opcional: ORBI_ALARMAS_MINUTOS (cada cuánto revisar; por defecto 15).
 *
 * Usa el flujo de "credenciales de aplicación" (servidor a servidor): TI debe dar a la aplicación de
 * ORBI permiso de lectura de alarmas en la API del portal.
 */
export interface ConfigPortal {
  url: string;
  tenant: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  plantas: { systemKey: string; plantaId: string }[];
  minutos: number;
}

export function leerConfigPortal(env: NodeJS.ProcessEnv = process.env): ConfigPortal | null {
  const url = env.ORBI_PORTAL_OM_URL?.replace(/\/+$/, '');
  const { ORBI_PORTAL_OM_TENANT: tenant, ORBI_PORTAL_OM_CLIENT_ID: clientId, ORBI_PORTAL_OM_CLIENT_SECRET: clientSecret, ORBI_PORTAL_OM_SCOPE: scope } = env;
  if (!url || !tenant || !clientId || !clientSecret || !scope) return null;
  if (!/^https:\/\//.test(url)) throw new Error('ORBI_PORTAL_OM_URL debe empezar con https://');
  const plantas = leerPlantasVcom(env.ORBI_VCOM_PLANTAS ?? '');
  const minutos = Math.max(5, Number(env.ORBI_ALARMAS_MINUTOS) || 15);
  return { url, tenant, clientId, clientSecret, scope, plantas, minutos };
}

/** "PV61D=ORBI-PV-058, PV70A=ORBI-PV-012" → [{systemKey, plantaId}] (ignora entradas mal escritas). */
export function leerPlantasVcom(texto: string): { systemKey: string; plantaId: string }[] {
  return texto.split(',').map(s => s.trim()).filter(Boolean).map(par => {
    const [systemKey, plantaId] = par.split('=').map(x => x?.trim());
    return { systemKey, plantaId };
  }).filter(p => /^[A-Za-z0-9]{3,16}$/.test(p.systemKey ?? '') && Boolean(p.plantaId));
}

let token: { valor: string; vence: number } | null = null;

async function obtenerToken(c: ConfigPortal): Promise<string> {
  if (token && token.vence > Date.now() + 60_000) return token.valor;
  const res = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(c.tenant)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: c.clientId, client_secret: c.clientSecret, scope: c.scope }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Entra ID rechazó la autenticación de ORBI (${res.status}). Revisa el registro de la aplicación con TI.`);
  const j = await res.json() as { access_token: string; expires_in: number };
  token = { valor: j.access_token, vence: Date.now() + j.expires_in * 1000 };
  return token.valor;
}

/** Alarmas abiertas de una planta (todas las severidades: la regla de ORBI decide). */
export async function alarmasAbiertas(c: ConfigPortal, systemKey: string): Promise<unknown[]> {
  const q = new URLSearchParams({ systemKey, status: 'open', timezone: 'America/Santiago' });
  const res = await fetch(`${c.url}/api/v1/vcom/alarms?${q}`, {
    headers: { Authorization: `Bearer ${await obtenerToken(c)}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`El portal respondió ${res.status} al pedir las alarmas de ${systemKey}.`);
  const j = await res.json() as unknown;
  // VCOM entrega { data: [...] }; se acepta también una lista directa
  if (Array.isArray(j)) return j;
  const data = (j as { data?: unknown }).data;
  if (Array.isArray(data)) return data;
  throw new Error(`Formato de alarmas no reconocido para ${systemKey}.`);
}
