/**
 * MÓDULO 17A — Fase 3: cola de fotos sin conexión.
 *
 * Si no hay señal al tomar una foto, la imagen (ya reducida) se guarda en IndexedDB del teléfono
 * y la OT queda apuntando a un identificador provisorio "local-…". Al volver la señal, la cola de
 * sincronización sube primero las fotos y reemplaza esos identificadores por los definitivos antes
 * de enviar los cambios de la OT.
 */

const DB_NAME = 'orbi-offline';
const STORE = 'photos';

export interface QueuedPhoto {
  localId: string;
  codigo: string;
  blob: Blob;
  createdAt: string;
}

export const LOCAL_ID_PREFIX = 'local-';
export const PENDING_URL_PREFIX = 'pending:';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'localId' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}

/** Vistas previas de fotos aún no subidas (válidas mientras la app está abierta). */
const previews = new Map<string, string>();

// Fotos ya subidas: identificador provisorio → definitivo. Se guarda en el equipo para que cualquier
// copia vieja de la OT (pantallas abiertas, recargas) se pueda corregir antes de enviarse.
const RESOLVED_KEY = 'orbi_sync_resolved_photos';
const MAX_RESOLVED = 500;

export function getResolvedPhotos(): Map<string, { id: string; url: string }> {
  try {
    return new Map(JSON.parse(localStorage.getItem(RESOLVED_KEY) || '[]'));
  } catch {
    return new Map();
  }
}

export function rememberResolvedPhotos(resolved: Map<string, { id: string; url: string }>): void {
  const all = [...getResolvedPhotos(), ...resolved].slice(-MAX_RESOLVED);
  try {
    localStorage.setItem(RESOLVED_KEY, JSON.stringify(all));
  } catch { /* sin espacio: las copias viejas se corrigen igual en esta sesión */ }
}

/** Corrige en cualquier objeto los identificadores provisorios de fotos ya subidas. */
export function resolvePlaceholders<T>(value: T): T {
  const json = JSON.stringify(value);
  if (!json || !json.includes(LOCAL_ID_PREFIX)) return value;
  const resolved = getResolvedPhotos();
  return resolved.size ? JSON.parse(replacePlaceholders(json, resolved)) : value;
}

/**
 * Quita de un cambio las fotos provisorias que ya no existen en el teléfono (p. ej. rechazadas),
 * para enviar el resto del cambio en vez de perderlo completo.
 */
export function stripDeadPhotoRefs<T>(value: T, alive: Set<string>): T {
  const isDead = (id?: string) => Boolean(id && id.startsWith(LOCAL_ID_PREFIX) && !alive.has(id));
  const walk = (v: any): any => {
    if (Array.isArray(v)) {
      return v
        .filter(x => !(x && typeof x === 'object' && isDead(x.fileId)))
        .map(walk);
    }
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    }
    return v;
  };
  return walk(value);
}

/** Borra todo lo que el equipo guardaba para trabajar sin señal (al cambiar de usuario). */
export async function clearPhotoQueue(): Promise<void> {
  try {
    for (const p of await listQueuedPhotos()) await removeQueuedPhoto(p.localId);
  } catch { /* sin IndexedDB: nada que borrar */ }
  try { localStorage.removeItem(RESOLVED_KEY); } catch { /* ignorar */ }
}

export async function queuePhoto(codigo: string, blob: Blob): Promise<{ localId: string; url: string }> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('Sin señal y este navegador no permite guardar fotos en el teléfono (¿modo privado?). Toma la foto cuando vuelva la señal.');
  }
  const localId = `${LOCAL_ID_PREFIX}${crypto.randomUUID()}`;
  await tx('readwrite', s => s.put({ localId, codigo, blob, createdAt: new Date().toISOString() } satisfies QueuedPhoto));
  previews.set(localId, URL.createObjectURL(blob));
  return { localId, url: `${PENDING_URL_PREFIX}${localId}` };
}

export async function listQueuedPhotos(): Promise<QueuedPhoto[]> {
  try {
    const all = await tx<QueuedPhoto[]>('readonly', s => s.getAll() as IDBRequest<QueuedPhoto[]>);
    return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function removeQueuedPhoto(localId: string): Promise<void> {
  await tx('readwrite', s => s.delete(localId));
  const url = previews.get(localId);
  if (url) URL.revokeObjectURL(url);
  previews.delete(localId);
}

/** Carga vistas previas de las fotos pendientes (por ejemplo después de reabrir la app sin señal). */
export async function warmPreviews(): Promise<void> {
  for (const p of await listQueuedPhotos()) {
    if (!previews.has(p.localId)) previews.set(p.localId, URL.createObjectURL(p.blob));
  }
}

/**
 * Dirección que se puede usar en un <img>: la del servidor, o la vista previa local si la foto
 * todavía espera señal. Devuelve '' si no hay nada que mostrar.
 */
export function photoSrc(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith(PENDING_URL_PREFIX)) {
    const localId = url.slice(PENDING_URL_PREFIX.length);
    return previews.get(localId) ?? getResolvedPhotos().get(localId)?.url ?? '';
  }
  return url;
}

export function isPendingPhoto(url: string | undefined): boolean {
  return Boolean(url && url.startsWith(PENDING_URL_PREFIX));
}

/** Reemplaza en un texto (JSON) los identificadores provisorios por los definitivos. */
export function replacePlaceholders(text: string, resolved: Map<string, { id: string; url: string }>): string {
  let out = text;
  for (const [localId, real] of resolved) {
    out = out.split(`${PENDING_URL_PREFIX}${localId}`).join(real.url).split(localId).join(real.id);
  }
  return out;
}
