/**
 * MÓDULO 17A — Fase 1: API del piloto.
 *
 *   POST /api/auth/login | /api/auth/logout | /api/auth/change-password   GET /api/auth/me
 *   GET  /api/ots            POST /api/ots           PATCH /api/ots/:codigo
 *   GET  /api/collections    PUT  /api/collections/:name
 *   GET  /api/audit          POST /api/audit
 *   POST /api/ots/:codigo/files (imagen)            GET /api/files/:id
 */
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Db } from './db';
import { uploadsDir } from './db';
import {
  authenticate, createSession, destroySession, readCookie, sessionCookie, SESSION_COOKIE, SESSION_MAX_AGE_MS,
  requireAuth, requireCsrfHeader, createLoginLimiter, verifyPasswordAsync, hashPassword, hashToken,
} from './auth';
import { applyOTPatch, prepareNewOT, canReadOT, type OTPatchRequest } from './otSync';
import { isSharedCollection, canWriteCollection, canReadCollection, violatesAppendOnly, MAX_COLLECTION_BYTES } from './collections';
import * as repo from './repo';
import { runPmGeneration } from './pm';
import { STORAGE_KEYS } from '../src/data/storage';
import type { OT, Escalation } from '../src/types';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  'image/jpeg': { ext: 'jpg', magic: b => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', magic: b => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { ext: 'webp', magic: b => b.length > 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
};

function withVersion(s: { ot: OT; version: number }): OT {
  return { ...s.ot, _version: s.version };
}

function mustChangePassword(db: Db, userId: number): boolean {
  const r = db.prepare('SELECT must_change_password AS m FROM users WHERE id = ?').get(userId) as { m: number } | undefined;
  return Boolean(r?.m);
}

export function createApiRouter(db: Db): express.Router {
  const router = express.Router();
  const loginLimiter = createLoginLimiter();
  const ipLimiter = createLoginLimiter(30);

  router.use(requireCsrfHeader);

  // ---------- Sesión ----------
  router.post('/auth/login', async (req, res) => {
    const username = String(req.body?.username ?? '').trim().toLowerCase().slice(0, 60);
    const password = String(req.body?.password ?? '').slice(0, 200);
    const key = `${req.ip}|${username}`;
    const ipKey = `ip|${req.ip}`;
    if (loginLimiter.isBlocked(key) || ipLimiter.isBlocked(ipKey)) {
      res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' });
      return;
    }
    const user = await authenticate(db, username, password);
    if (!user) {
      loginLimiter.fail(key);
      ipLimiter.fail(ipKey);
      repo.addAudit(db, { userId: 0, usuario: username || '(vacío)', rol: '-', accion: 'Inicio de sesión fallido', modulo: 'Autenticación', comentario: `IP ${req.ip}`, criticidad: 'Media' });
      res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
      return;
    }
    loginLimiter.reset(key);
    const token = createSession(db, user.id);
    res.setHeader('Set-Cookie', sessionCookie(token, SESSION_MAX_AGE_MS));
    repo.addAudit(db, { userId: user.id, usuario: user.displayName, rol: user.role, accion: 'Inicio de sesión', modulo: 'Autenticación', criticidad: 'Baja' });
    res.json({ user, mustChangePassword: mustChangePassword(db, user.id) });
  });

  router.post('/auth/logout', (req, res) => {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) destroySession(db, token);
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    res.json({ ok: true });
  });

  router.get('/auth/me', requireAuth, (req, res) => {
    res.json({ user: req.user, mustChangePassword: mustChangePassword(db, req.user!.id) });
  });

  router.post('/auth/change-password', requireAuth, async (req, res) => {
    const current = String(req.body?.currentPassword ?? '');
    const next = String(req.body?.newPassword ?? '').slice(0, 200);
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as { password_hash: string };
    if (!(await verifyPasswordAsync(current, row.password_hash))) {
      res.status(400).json({ error: 'La contraseña actual no es correcta.' });
      return;
    }
    if (next.length < 10 || next === current) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 10 caracteres y ser distinta de la actual.' });
      return;
    }
    db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hashPassword(next), req.user!.id);
    // Cerrar las demás sesiones del usuario (una sesión robada no sobrevive al cambio de contraseña)
    const token = readCookie(req, SESSION_COOKIE);
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(req.user!.id, token ? hashToken(token) : '');
    repo.addAudit(db, { userId: req.user!.id, usuario: req.user!.displayName, rol: req.user!.role, accion: 'Cambio de contraseña', modulo: 'Autenticación', criticidad: 'Media' });
    res.json({ ok: true });
  });

  // Todo lo que sigue exige sesión y contraseña definitiva
  router.use(requireAuth, (req, res, next) => {
    if (mustChangePassword(db, req.user!.id)) {
      res.status(403).json({ error: 'Debes cambiar tu contraseña antes de continuar.', code: 'MUST_CHANGE_PASSWORD' });
      return;
    }
    next();
  });

  // ---------- OTs ----------
  router.get('/ots', (req, res) => {
    const list = repo.listOTs(db).filter(s => canReadOT(s.ot, req.user!)).map(withVersion);
    res.json({ ots: list });
  });

  router.post('/ots', (req, res) => {
    const prepared = prepareNewOT(req.body?.ot as OT, req.user!);
    if (prepared.ok === false) {
      res.status(prepared.status).json({ error: prepared.error });
      return;
    }
    if (repo.getOT(db, prepared.ot.codigo)) {
      res.status(409).json({ error: `Ya existe una OT con código ${prepared.ot.codigo}.` });
      return;
    }
    const stored = repo.insertOT(db, prepared.ot, req.user!.displayName);
    res.status(201).json({ ot: withVersion(stored) });
  });

  router.patch('/ots/:codigo', (req, res) => {
    const body = req.body as OTPatchRequest;
    if (!body || typeof body !== 'object' || typeof body.changes !== 'object') {
      res.status(400).json({ error: 'Formato de cambio inválido.' });
      return;
    }
    // Reintento ante escrituras simultáneas sobre la misma OT
    for (let attempt = 0; attempt < 3; attempt++) {
      const stored = repo.getOT(db, req.params.codigo);
      if (!stored || !canReadOT(stored.ot, req.user!)) {
        res.status(404).json({ error: 'OT no encontrada.' });
        return;
      }
      const escalaciones = (repo.getCollection(db, STORAGE_KEYS.DB_ESCALAMIENTOS)?.data as Escalation[] | undefined) ?? [];
      const result = applyOTPatch(stored, body, req.user!, fileId => {
        const f = repo.getFile(db, fileId);
        return Boolean(f && f.ot_codigo === stored.ot.codigo);
      }, { escalaciones });
      if (result.ok === false) {
        res.status(result.status).json({ error: result.error, ot: withVersion(stored) });
        return;
      }
      if (result.stored.version === stored.version || repo.saveOT(db, result.stored, stored.version, req.user!.displayName)) {
        res.json({ ot: withVersion(result.stored), conflicts: result.conflicts });
        return;
      }
    }
    res.status(409).json({ error: 'La OT se está modificando en otro equipo. Intenta de nuevo.' });
  });

  // ---------- Colecciones compartidas ----------
  router.get('/collections', (req, res) => {
    const all = repo.getCollections(db);
    const visible = Object.fromEntries(Object.entries(all).filter(([name]) => canReadCollection(name, req.user!.role)));
    res.json({ collections: visible });
  });

  router.put('/collections/:name', express.json({ limit: '2mb' }), (req, res) => {
    const name = req.params.name;
    if (!isSharedCollection(name)) {
      res.status(404).json({ error: 'Colección desconocida.' });
      return;
    }
    if (!canWriteCollection(name, req.user!.role)) {
      res.status(403).json({ error: 'Tu rol no puede modificar estos datos.' });
      return;
    }
    const { baseVersion, data } = req.body ?? {};
    if (!Array.isArray(data) || !Number.isInteger(baseVersion)) {
      res.status(400).json({ error: 'Formato inválido.' });
      return;
    }
    if (JSON.stringify(data).length > MAX_COLLECTION_BYTES) {
      res.status(413).json({ error: 'Colección demasiado grande.' });
      return;
    }
    const existing = repo.getCollection(db, name);
    if (existing && existing.version === baseVersion && violatesAppendOnly(name, req.user!.role, existing.data, data)) {
      res.status(403).json({ error: 'Tu rol solo puede agregar registros aquí, no modificar ni borrar los existentes.', current: existing });
      return;
    }
    const version = repo.saveCollection(db, name, data, baseVersion, req.user!.displayName);
    if (version === null) {
      res.status(409).json({ error: 'Otro usuario modificó estos datos. Se cargó la versión más reciente.', current: repo.getCollection(db, name) });
      return;
    }
    res.json({ version });
  });

  // ---------- Planes preventivos ----------
  router.post('/pm/generate', (req, res) => {
    if (!['SUPER_ADMIN_ORBI', 'GERENCIA', 'JEFE_OM', 'COORDINADOR_OM', 'PLANIFICACION'].includes(req.user!.role)) {
      res.status(403).json({ error: 'Solo planificación puede generar OTs preventivas.' });
      return;
    }
    const result = runPmGeneration(db, undefined, req.user!.displayName);
    repo.addAudit(db, { userId: req.user!.id, usuario: req.user!.displayName, rol: req.user!.role, accion: 'Generación de preventivos', modulo: 'Planes preventivos', comentario: `${result.creadas.length} OT(s): ${result.creadas.join(', ')}`, criticidad: 'Media' });
    res.json(result);
  });

  // ---------- Auditoría ----------
  router.get('/audit', (req, res) => {
    if (['TECNICO_OM', 'LECTURA_CLIENTE', 'COMISIONAMIENTO'].includes(req.user!.role)) {
      res.json({ events: [] });
      return;
    }
    res.json({ events: repo.listAudit(db) });
  });

  router.post('/audit', (req, res) => {
    const b = req.body ?? {};
    const criticidad = ['Baja', 'Media', 'Alta', 'Crítica'].includes(b.criticidad) ? b.criticidad : 'Baja';
    repo.addAudit(db, {
      userId: req.user!.id,
      usuario: req.user!.displayName,
      rol: req.user!.role,
      accion: String(b.accion ?? '').slice(0, 200),
      modulo: String(b.modulo ?? '').slice(0, 100),
      otCodigo: b.otCodigo ? String(b.otCodigo).slice(0, 40) : undefined,
      planta: b.planta ? String(b.planta).slice(0, 120) : undefined,
      comentario: String(b.comentario ?? '').slice(0, 2000),
      criticidad,
    });
    res.status(201).json({ ok: true });
  });

  // ---------- Fotos ----------
  router.post('/ots/:codigo/files', express.raw({ type: Object.keys(IMAGE_TYPES), limit: MAX_IMAGE_BYTES }), (req, res) => {
    const stored = repo.getOT(db, req.params.codigo);
    if (!stored || !canReadOT(stored.ot, req.user!) || req.user!.role === 'LECTURA_CLIENTE') {
      res.status(404).json({ error: 'OT no encontrada.' });
      return;
    }
    const mime = String(req.headers['content-type'] || '').split(';')[0].trim();
    const type = IMAGE_TYPES[mime];
    const body = req.body as Buffer;
    if (!type || !Buffer.isBuffer(body) || body.length === 0 || !type.magic(body)) {
      res.status(400).json({ error: 'Solo se aceptan imágenes JPEG, PNG o WebP de hasta 10 MB.' });
      return;
    }
    const id = crypto.randomUUID();
    const relPath = `${id}.${type.ext}`;
    fs.mkdirSync(uploadsDir(), { recursive: true });
    fs.writeFileSync(path.join(uploadsDir(), relPath), body);
    repo.addFile(db, {
      id, ot_codigo: stored.ot.codigo, mime, size: body.length, path: relPath,
      uploaded_by: req.user!.displayName, uploaded_at: new Date().toISOString(),
    });
    res.status(201).json({ id, url: `/api/files/${id}` });
  });

  router.get('/files/:id', (req, res) => {
    const f = /^[0-9a-f-]{36}$/.test(req.params.id) ? repo.getFile(db, req.params.id) : null;
    const ot = f ? repo.getOT(db, f.ot_codigo) : null;
    if (!f || !ot || !canReadOT(ot.ot, req.user!)) {
      res.status(404).json({ error: 'Archivo no encontrado.' });
      return;
    }
    res.setHeader('Content-Type', f.mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.sendFile(path.join(uploadsDir(), f.path));
  });

  // Errores de cuerpo (JSON inválido, archivo demasiado grande) sin exponer trazas
  router.use((err: { type?: string; status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status && err.status >= 400 && err.status < 500 ? err.status : 500;
    const message = err.type === 'entity.too.large' ? 'El archivo o los datos superan el tamaño permitido.'
      : status === 500 ? 'Error interno del servidor.' : 'Solicitud inválida.';
    if (status === 500) console.error('[ORBI API]', err);
    res.status(status).json({ error: message });
  });

  return router;
}
