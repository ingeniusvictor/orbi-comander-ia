/**
 * MÓDULO 17A — Fase 1: sincronización del navegador con el servidor.
 *
 * - OTs: se envían solo los campos que cambiaron respecto de la versión del servidor en que se basaba
 *   la copia editada; los cambios de estado viajan como transición explícita con su comentario.
 *   Los envíos se guardan en una cola persistente (sobrevive a recargas y a cortes de señal)
 *   y se procesan en orden.
 * - Colecciones compartidas (inventario, PTW, escalamientos...): el servidor es la fuente; se reflejan
 *   en localStorage para que los módulos existentes funcionen igual, y cada escritura local se sube.
 * - Fotos: se reducen a 1600 px en JPEG antes de subir (esto también elimina los metadatos GPS/EXIF).
 */
import type { OT, OTEstado } from '../types';
import { setCollectionWriteListener, notifyStorageError } from './storage';
import { queuePhoto, listQueuedPhotos, removeQueuedPhoto, replacePlaceholders, LOCAL_ID_PREFIX, rememberResolvedPhotos, resolvePlaceholders, stripDeadPhotoRefs, clearPhotoQueue } from './photoQueue';

export const SYNC_EVENTS = {
  AUTH_REQUIRED: 'orbi:auth-required',
  COLLECTIONS_UPDATED: 'orbi:collections-updated',
  PENDING_CHANGED: 'orbi:pending-changed',
} as const;

export interface SessionInfo {
  user: { id: number; username: string; displayName: string; role: string };
  mustChangePassword: boolean;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
  }
}

function emit(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-ORBI-Request': '1', ...(init.headers as Record<string, string> || {}) };
  if (init.body && typeof init.body === 'string' && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(`/api${path}`, { credentials: 'same-origin', ...init, headers });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* respuesta sin JSON */
  }
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) emit(SYNC_EVENTS.AUTH_REQUIRED);
    throw new ApiError(res.status, body?.error || `Error ${res.status}`, body);
  }
  return body as T;
}

/** true si el error es de conectividad (sin señal o servidor caído), no un rechazo del servidor. */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) return error.status >= 500 || error.status === 408 || error.status === 0;
  return true; // fetch lanza TypeError cuando no hay red
}

// ---------------- Copia local para trabajar sin señal (Fase 3) ----------------

const SESSION_CACHE_KEY = 'orbi_sync_session';
const OTS_CACHE_KEY = 'orbi_sync_ots_cache';

export function cacheSession(info: SessionInfo | null): void {
  try {
    if (info) localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(info));
    else localStorage.removeItem(SESSION_CACHE_KEY);
  } catch { /* sin espacio: se intentará en el próximo guardado */ }
}

export function cachedSession(): SessionInfo | null {
  return readJson<SessionInfo | null>(SESSION_CACHE_KEY, null);
}

export function cacheOTs(ots: OT[]): void {
  try {
    localStorage.setItem(OTS_CACHE_KEY, JSON.stringify(ots));
  } catch {
    notifyStorageError('No hay espacio en el teléfono para guardar la copia de trabajo sin señal.');
  }
}

/**
 * Si en este equipo trabajaba otro usuario, se borra su copia local (OTs, cola de cambios, fotos
 * pendientes y espejo de datos) para no enviar su trabajo con otra identidad ni mostrarle sus OTs.
 * Devuelve cuántos cambios pendientes del usuario anterior se descartaron.
 */
const OWNER_KEY = 'orbi_sync_owner';

export async function resetLocalDataIfUserChanged(userId: number): Promise<number> {
  // El dueño de la copia local se recuerda aunque se cierre sesión
  const owner = readJson<number | null>(OWNER_KEY, cachedSession()?.user.id ?? null);
  if (owner === null || owner === userId) {
    writeJson(OWNER_KEY, userId);
    return 0;
  }
  const descartados = readJson<unknown[]>(OUTBOX_KEY, []).length + readJson<string[]>(COLLECTION_PENDING_KEY, []).length
    + (await listQueuedPhotos()).length;
  outbox = [];
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('orbi')) localStorage.removeItem(key);
  }
  await clearPhotoQueue();
  writeJson(OWNER_KEY, userId);
  return descartados;
}

export function clearOTCache(): void {
  try { localStorage.removeItem(OTS_CACHE_KEY); } catch { /* ignorar */ }
}

export function cachedOTs(): OT[] {
  const list = readJson<OT[]>(OTS_CACHE_KEY, []);
  list.forEach(remember);
  return list;
}

// ---------------- Sesión ----------------

export const getSession = () => api<SessionInfo>('/auth/me');
export const login = (username: string, password: string) =>
  api<SessionInfo>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
export const logout = () => api('/auth/logout', { method: 'POST' });
export const changePassword = (currentPassword: string, newPassword: string) =>
  api('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });

// ---------------- Utilidades ----------------

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    notifyStorageError('No hay espacio en el navegador para guardar los cambios pendientes de sincronizar.');
  }
}

// ---------------- Colecciones compartidas ----------------

const COLLECTION_VERSIONS_KEY = 'orbi_sync_collection_versions';
const COLLECTION_PENDING_KEY = 'orbi_sync_collection_pending';
let collectionVersions: Record<string, number> = {};
let pendingCollections = new Set<string>();
let collectionTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const inFlight = new Map<string, Promise<void>>();
const dirtyDuringFlight = new Set<string>();
let syncEnabled = false;

function persistCollectionState() {
  writeJson(COLLECTION_VERSIONS_KEY, collectionVersions);
  writeJson(COLLECTION_PENDING_KEY, [...pendingCollections]);
}

/** Descarga las colecciones del servidor y las deja en localStorage (antes de cargar los módulos). */
/**
 * Activa la sincronización de colecciones con lo guardado en el equipo, sin red.
 * Permite trabajar sin señal: las escrituras quedan pendientes y se suben al volver la conexión.
 */
export function initCollectionSync(): void {
  collectionVersions = readJson(COLLECTION_VERSIONS_KEY, {});
  pendingCollections = new Set(readJson<string[]>(COLLECTION_PENDING_KEY, []));
  enableCollectionListener();
  emitPending();
}

export async function bootstrapCollections(): Promise<void> {
  initCollectionSync();
  // Subir primero lo que quedó pendiente de una sesión anterior sin señal
  for (const name of [...pendingCollections]) await pushCollection(name);
  const { collections } = await api<{ collections: Record<string, { data: unknown; version: number }> }>('/collections');
  for (const [name, rec] of Object.entries(collections)) {
    if (pendingCollections.has(name)) continue;
    localStorage.setItem(name, JSON.stringify(rec.data));
    collectionVersions[name] = rec.version;
  }
  persistCollectionState();
}

function enableCollectionListener(): void {
  if (syncEnabled) return;
  syncEnabled = true;
  setCollectionWriteListener((key) => {
    if (!syncEnabled || !(key in collectionVersions)) return;
    pendingCollections.add(key);
    if (inFlight.has(key)) dirtyDuringFlight.add(key);
    persistCollectionState();
    emitPending();
    clearTimeout(collectionTimers[key]);
    collectionTimers[key] = setTimeout(() => void pushCollection(key), 400);
  });
}

/** Un solo envío a la vez por colección; si hubo cambios durante el envío, se vuelve a enviar. */
function pushCollection(name: string): Promise<void> {
  const running = inFlight.get(name);
  if (running) {
    dirtyDuringFlight.add(name);
    return running;
  }
  const p = pushCollectionOnce(name).finally(() => {
    inFlight.delete(name);
    if (dirtyDuringFlight.delete(name)) void pushCollection(name);
  });
  inFlight.set(name, p);
  return p;
}

async function adoptServerCollection(name: string): Promise<void> {
  try {
    const { collections } = await api<{ collections: Record<string, { data: unknown; version: number }> }>('/collections');
    const rec = collections[name];
    if (rec) {
      localStorage.setItem(name, JSON.stringify(rec.data));
      collectionVersions[name] = rec.version;
      emit(SYNC_EVENTS.COLLECTIONS_UPDATED);
    }
  } catch {
    /* se reintenta en el próximo ciclo */
  }
}

async function pushCollectionOnce(name: string): Promise<void> {
  const data = readJson<unknown>(name, null);
  if (!Array.isArray(data)) {
    pendingCollections.delete(name);
    return;
  }
  try {
    const { version } = await api<{ version: number }>(`/collections/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify({ baseVersion: collectionVersions[name] ?? 0, data }),
    });
    collectionVersions[name] = version;
    if (!dirtyDuringFlight.has(name)) pendingCollections.delete(name);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409 && error.body?.current) {
      // Otro usuario guardó antes: se adopta la versión del servidor y se avisa
      localStorage.setItem(name, JSON.stringify(error.body.current.data));
      collectionVersions[name] = error.body.current.version;
      pendingCollections.delete(name);
      notifyStorageError(`${error.message} Revisa y vuelve a aplicar tu último cambio si corresponde.`);
      emit(SYNC_EVENTS.COLLECTIONS_UPDATED);
    } else if (error instanceof ApiError && error.status < 500 && error.status !== 401) {
      // Rechazado (permiso o formato): se descarta el cambio local y se vuelve a la copia del servidor
      pendingCollections.delete(name);
      dirtyDuringFlight.delete(name);
      notifyStorageError(`No se guardó en el servidor: ${error.message}`);
      await adoptServerCollection(name);
    }
    // Sin señal / error del servidor / sesión expirada: queda pendiente y se reintenta
  } finally {
    persistCollectionState();
    emitPending();
  }
}

/** Trae cambios de otros usuarios en las colecciones. */
export async function pollCollections(): Promise<void> {
  for (const name of [...pendingCollections]) await pushCollection(name);
  const { collections } = await api<{ collections: Record<string, { data: unknown; version: number }> }>('/collections');
  let changed = false;
  for (const [name, rec] of Object.entries(collections)) {
    if (pendingCollections.has(name) || collectionVersions[name] === rec.version) continue;
    localStorage.setItem(name, JSON.stringify(rec.data));
    collectionVersions[name] = rec.version;
    changed = true;
  }
  persistCollectionState();
  if (changed) emit(SYNC_EVENTS.COLLECTIONS_UPDATED);
}

// ---------------- OTs ----------------

type OTOp =
  | { kind: 'create'; codigo: string; ot: OT }
  | { kind: 'patch'; codigo: string; baseVersion: number; changes: Partial<OT>; transition?: { to: OTEstado; comentario?: string } };

const OUTBOX_KEY = 'orbi_sync_ot_outbox';
/** Copias del servidor por OT y versión, para calcular qué cambió de verdad. */
const snapshots = new Map<string, Map<number, OT>>();
let outbox: OTOp[] = [];
let processing = false;
let onServerOT: (ot: OT) => void = () => {};

function remember(ot: OT) {
  if (typeof ot._version !== 'number') return;
  let byVersion = snapshots.get(ot.codigo);
  if (!byVersion) snapshots.set(ot.codigo, (byVersion = new Map()));
  byVersion.set(ot._version, ot);
  if (byVersion.size > 15) byVersion.delete(Math.min(...byVersion.keys()));
}

function emitPending() {
  emit(SYNC_EVENTS.PENDING_CHANGED, pendingCount());
}

export function pendingCount(): number {
  return outbox.length + pendingCollections.size + queuedPhotoCount;
}

export function hasPendingOT(codigo: string): boolean {
  return outbox.some(op => op.codigo === codigo);
}

export function setServerOTListener(fn: (ot: OT) => void) {
  onServerOT = fn;
}

export async function fetchOTs(): Promise<OT[]> {
  const { ots } = await api<{ ots: OT[] }>('/ots');
  ots.forEach(remember);
  return ots;
}

// ---------------- Fotos en cola (Fase 3) ----------------

let queuedPhotoCount = 0;
let onPhotosResolved: (resolved: Map<string, { id: string; url: string }>) => void = () => {};

export function setPhotosResolvedListener(fn: (resolved: Map<string, { id: string; url: string }>) => void) {
  onPhotosResolved = fn;
}

export async function refreshQueuedPhotoCount(): Promise<void> {
  queuedPhotoCount = (await listQueuedPhotos()).length;
  emitPending();
}

/** Sube las fotos tomadas sin señal y reemplaza sus identificadores provisorios en la cola de cambios. */
async function processPhotoQueue(): Promise<void> {
  const queued = await listQueuedPhotos();
  queuedPhotoCount = queued.length;
  if (!queued.length) return;
  const resolved = new Map<string, { id: string; url: string }>();
  for (const p of queued) {
    try {
      const res = await api<{ id: string; url: string }>(`/ots/${encodeURIComponent(p.codigo)}/files`, {
        method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: p.blob,
      });
      resolved.set(p.localId, res);
      try {
        await removeQueuedPhoto(p.localId);
      } catch {
        /* la foto ya está en el servidor; si no se pudo borrar del teléfono se reintenta luego */
      }
    } catch (error) {
      if (isNetworkError(error) || (error instanceof ApiError && error.status === 401)) break;
      // Rechazada por el servidor (p. ej. la OT ya no existe): se descarta y se avisa
      notifyStorageError(`Una foto de la OT ${p.codigo} no se pudo guardar: ${(error as Error).message}`);
      await removeQueuedPhoto(p.localId);
    }
  }
  if (resolved.size) {
    rememberResolvedPhotos(resolved);
    outbox = JSON.parse(replacePlaceholders(JSON.stringify(outbox), resolved));
    writeJson(OUTBOX_KEY, outbox);
    onPhotosResolved(resolved);
  }
  queuedPhotoCount = (await listQueuedPhotos()).length;
  emitPending();
}

export function initOutbox() {
  outbox = readJson<OTOp[]>(OUTBOX_KEY, []);
  emitPending();
}

/** Compara la lista anterior con la nueva y encola los cambios por campo. */
export function queueOTChanges(prev: OT[], nextRaw: OT[]): void {
  const prevByCode = new Map(prev.map(o => [o.codigo, o]));
  // Una pantalla abierta puede conservar identificadores provisorios de fotos que ya se subieron
  const next = nextRaw.map(o => resolvePlaceholders(o));
  for (const ot of next) {
    const before = prevByCode.get(ot.codigo);
    if (before === ot) continue;
    if (!before || typeof ot._version !== 'number') {
      const pendingCreate = outbox.find(op => op.kind === 'create' && op.codigo === ot.codigo) as Extract<OTOp, { kind: 'create' }> | undefined;
      if (pendingCreate) pendingCreate.ot = ot; // la creación aún no se envía: se incorpora la edición
      else if (!before) outbox.push({ kind: 'create', codigo: ot.codigo, ot });
      continue;
    }
    const base = snapshots.get(ot.codigo)?.get(ot._version) ?? before;
    const changes: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(ot), ...Object.keys(base)])) {
      if (key === '_version' || key === 'lifecycleHistory' || key === 'estado') continue;
      const value = (ot as unknown as Record<string, unknown>)[key];
      if (!sameValue(value, (base as unknown as Record<string, unknown>)[key])) changes[key] = value;
    }
    let transition: { to: OTEstado; comentario?: string } | undefined;
    if (ot.estado !== base.estado) {
      const last = ot.lifecycleHistory?.at(-1);
      transition = { to: ot.estado, comentario: last?.estadoNuevo === ot.estado ? last.comentario : undefined };
    }
    if (Object.keys(changes).length === 0 && !transition) continue;
    outbox.push({ kind: 'patch', codigo: ot.codigo, baseVersion: ot._version, changes: changes as Partial<OT>, transition });
  }
  writeJson(OUTBOX_KEY, outbox);
  emitPending();
  void processOutbox();
}

/** Envía la cola en orden. Se detiene sin perder nada si no hay señal o la sesión expiró. */
export async function processOutbox(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    // Primero las fotos tomadas sin señal: los cambios que las mencionan esperan a que estén en el servidor
    await processPhotoQueue();
    await flushAuditQueue();
    while (outbox.length > 0) {
      const op = outbox[0];
      if (JSON.stringify(op).includes(LOCAL_ID_PREFIX)) {
        const fixed = resolvePlaceholders(op);
        if (JSON.stringify(fixed).includes(LOCAL_ID_PREFIX)) {
          const alive = new Set((await listQueuedPhotos()).map(p => p.localId));
          if ([...alive].some(id => JSON.stringify(fixed).includes(id))) break; // la foto aún espera señal
          outbox[0] = stripDeadPhotoRefs(fixed, alive);
          notifyStorageError(`OT ${op.codigo}: una foto ya no estaba en el teléfono; se envió el resto del cambio.`);
        } else {
          outbox[0] = fixed;
        }
        writeJson(OUTBOX_KEY, outbox);
        continue;
      }
      try {
        const res = op.kind === 'create'
          ? await api<{ ot: OT }>('/ots', { method: 'POST', body: JSON.stringify({ ot: op.ot }) })
          : await api<{ ot: OT; conflicts: string[] }>(`/ots/${encodeURIComponent(op.codigo)}`, {
              method: 'PATCH',
              body: JSON.stringify({ baseVersion: op.baseVersion, changes: op.changes, transition: op.transition }),
            });
        remember(res.ot);
        if (!outbox.slice(1).some(o => o.codigo === op.codigo)) onServerOT(res.ot);
        const conflicts = (res as { conflicts?: string[] }).conflicts;
        if (conflicts && conflicts.length) {
          notifyStorageError(`OT ${op.codigo}: otro usuario cambió antes ${conflicts.join(', ')}; se mantuvo su versión. El resto de tus cambios sí se guardó.`);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 401 && error.status !== 408 && error.status !== 429) {
          // Rechazo de negocio o permiso: se descarta el cambio y se muestra la versión del servidor
          notifyStorageError(`OT ${op.codigo}: ${error.message}`);
          if (error.body?.ot) {
            remember(error.body.ot);
            onServerOT(error.body.ot);
          }
        } else {
          break; // sin señal, error del servidor o sesión expirada: se reintenta después
        }
      }
      outbox.shift();
      writeJson(OUTBOX_KEY, outbox);
      emitPending();
    }
  } finally {
    processing = false;
  }
}

// ---------------- Auditoría ----------------

type AuditInput = { accion: string; modulo: string; otCodigo?: string; planta?: string; comentario?: string; criticidad: string };
const AUDIT_QUEUE_KEY = 'orbi_sync_audit_queue';

/**
 * Registra un evento de auditoría. Sin señal, queda en cola y se envía al volver la conexión
 * (la hora real del evento viaja en el comentario, porque el servidor registra la hora de recepción).
 */
export function postAudit(e: AuditInput) {
  const enviar = (ev: AuditInput) => api('/audit', { method: 'POST', body: JSON.stringify(ev) });
  enviar(e).catch((error) => {
    if (isNetworkError(error) || (error instanceof ApiError && error.status === 401)) {
      const queue = readJson<AuditInput[]>(AUDIT_QUEUE_KEY, []);
      const hora = new Date().toLocaleString('es-CL', { hour12: false });
      queue.push({ ...e, comentario: `${e.comentario || ''} [registrado sin señal: ${hora}]`.trim() });
      writeJson(AUDIT_QUEUE_KEY, queue.slice(-500));
    }
  });
}

async function flushAuditQueue(): Promise<void> {
  // Se relee la cola en cada vuelta: mientras se envía, pueden agregarse eventos nuevos sin señal
  for (;;) {
    const first = readJson<AuditInput[]>(AUDIT_QUEUE_KEY, [])[0];
    if (!first) return;
    try {
      await api('/audit', { method: 'POST', body: JSON.stringify(first) });
    } catch (error) {
      if (isNetworkError(error) || (error instanceof ApiError && error.status === 401)) return;
      // Rechazo permanente (4xx): se descarta para no bloquear la cola
    }
    const current = readJson<AuditInput[]>(AUDIT_QUEUE_KEY, []);
    const idx = current.findIndex(e => JSON.stringify(e) === JSON.stringify(first));
    if (idx >= 0) current.splice(idx, 1);
    writeJson(AUDIT_QUEUE_KEY, current);
  }
}

export async function fetchAudit() {
  const { events } = await api<{ events: any[] }>('/audit');
  return events;
}

// ---------------- Fotos ----------------

async function downscale(file: File, maxSide = 1600, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen.'))), 'image/jpeg', quality)
  );
}

/**
 * Sube una foto (reducida). Sin señal, la guarda en el teléfono y devuelve un identificador
 * provisorio (`pending: true`); se sube sola al volver la conexión.
 */
export async function uploadPhoto(codigo: string, file: File): Promise<{ id: string; url: string; pending?: boolean }> {
  const blob = await downscale(file);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return queueAndReport(codigo, blob);
  try {
    return await api<{ id: string; url: string }>(`/ots/${encodeURIComponent(codigo)}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: blob,
    });
  } catch (error) {
    if (isNetworkError(error)) return queueAndReport(codigo, blob);
    throw error;
  }
}

async function queueAndReport(codigo: string, blob: Blob) {
  const { localId, url } = await queuePhoto(codigo, blob);
  await refreshQueuedPhotoCount();
  return { id: localId, url, pending: true };
}

/** Limpia la copia local (no toca el servidor) y recarga. */
export function clearLocalMirrorAndReload() {
  const keep = new Set([OUTBOX_KEY, COLLECTION_PENDING_KEY, SESSION_CACHE_KEY, OWNER_KEY]);
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('orbi') && !keep.has(key)) localStorage.removeItem(key);
  }
  window.location.reload();
}
