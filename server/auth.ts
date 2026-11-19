/**
 * MÓDULO 17A — Fase 1: usuarios, contraseñas y sesiones.
 *
 * - Contraseñas con scrypt (node:crypto) y sal aleatoria.
 * - Sesión: token aleatorio de 32 bytes en cookie httpOnly; en la base solo se guarda su SHA-256.
 * - El rol sale SIEMPRE de la sesión, nunca del cliente.
 */
import crypto from 'node:crypto';
import type express from 'express';
import type { Db } from './db';
import type { RoleType } from '../src/types';
import { ROLES_CONFIG } from '../src/data/rolesConfig';

export const SESSION_COOKIE = 'orbi_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 h, se renueva con el uso
const SCRYPT_KEYLEN = 64;

export interface SessionUser {
  id: number;
  username: string;
  displayName: string;
  role: RoleType;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export function isValidRole(role: string): role is RoleType {
  return Object.prototype.hasOwnProperty.call(ROLES_CONFIG, role);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

// Hash ficticio para igualar el tiempo de respuesta cuando el usuario no existe.
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'));

export function generatePassword(): string {
  // 16 caracteres legibles, sin caracteres ambiguos
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(16);
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

export function createUser(db: Db, input: { username: string; displayName: string; role: string; password: string }): number {
  const username = input.username.trim();
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    throw new Error('Usuario inválido: 3 a 40 caracteres (letras, números, punto, guion).');
  }
  if (!isValidRole(input.role)) {
    throw new Error(`Rol inválido: ${input.role}. Roles válidos: ${Object.keys(ROLES_CONFIG).join(', ')}`);
  }
  if (input.password.length < 10) {
    throw new Error('La contraseña debe tener al menos 10 caracteres.');
  }
  const result = db.prepare(
    'INSERT INTO users (username, display_name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(username, input.displayName.trim() || username, input.role, hashPassword(input.password), new Date().toISOString());
  return Number(result.lastInsertRowid);
}

export function setPassword(db: Db, username: string, password: string): boolean {
  if (password.length < 10) throw new Error('La contraseña debe tener al menos 10 caracteres.');
  const r = db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hashPassword(password), username);
  // Cerrar sesiones abiertas del usuario
  db.prepare('DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE username = ?)').run(username);
  return Number(r.changes) > 0;
}

export function countUsers(db: Db): number {
  const row = db.prepare('SELECT COUNT(*) AS n FROM users WHERE active = 1').get() as { n: number };
  return Number(row.n);
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export const hashToken = sha256;

/** Duración máxima de una sesión aunque se use continuamente. */
const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;

/** Versión asíncrona (no bloquea el servidor mientras calcula scrypt). */
export function verifyPasswordAsync(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return Promise.resolve(false);
  const expected = Buffer.from(hashB64, 'base64');
  return new Promise(resolve => {
    crypto.scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, (err, actual) => {
      resolve(!err && crypto.timingSafeEqual(expected, actual));
    });
  });
}

/** Valida credenciales; devuelve el usuario o null. Tiempo de respuesta uniforme. */
export async function authenticate(db: Db, username: string, password: string): Promise<SessionUser | null> {
  const row = db.prepare(
    'SELECT id, username, display_name, role, password_hash FROM users WHERE username = ? AND active = 1'
  ).get(username.trim()) as { id: number; username: string; display_name: string; role: string; password_hash: string } | undefined;
  if (!row) {
    await verifyPasswordAsync(password, DUMMY_HASH);
    return null;
  }
  if (!(await verifyPasswordAsync(password, row.password_hash)) || !isValidRole(row.role)) return null;
  return { id: Number(row.id), username: row.username, displayName: row.display_name, role: row.role };
}

export function createSession(db: Db, userId: number): string {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .run(sha256(token), userId, Date.now() + SESSION_TTL_MS, new Date().toISOString());
  return token;
}

export function destroySession(db: Db, token: string): void {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function getSessionUser(db: Db, token: string): SessionUser | null {
  const row = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.role, s.expires_at, s.created_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND u.active = 1
  `).get(sha256(token)) as { id: number; username: string; display_name: string; role: string; expires_at: number; created_at: string } | undefined;
  const tooOld = row ? Date.now() - Date.parse(row.created_at) > SESSION_ABSOLUTE_MS : false;
  if (!row || Number(row.expires_at) < Date.now() || tooOld || !isValidRole(row.role)) {
    if (row) destroySession(db, token);
    return null;
  }
  // Renovación deslizante
  db.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').run(Date.now() + SESSION_TTL_MS, sha256(token));
  return { id: Number(row.id), username: row.username, displayName: row.display_name, role: row.role };
}

export function purgeExpiredSessions(db: Db): void {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
}

export function readCookie(req: express.Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export function sessionCookie(token: string, maxAgeMs: number): string {
  // En producción la cookie es Secure salvo que se desactive explícitamente (COOKIE_SECURE=false)
  const secureOn = process.env.COOKIE_SECURE === 'true' || (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false');
  const secure = secureOn ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`;
}

export const SESSION_MAX_AGE_MS = SESSION_TTL_MS;

/** Adjunta req.user si hay sesión válida. */
export function sessionMiddleware(db: Db): express.RequestHandler {
  return (req, _res, next) => {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) {
      const user = getSessionUser(db, token);
      if (user) req.user = user;
    }
    next();
  };
}

export const requireAuth: express.RequestHandler = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ error: 'Sesión no iniciada o expirada.' });
    return;
  }
  next();
};

/**
 * Defensa CSRF: además de SameSite=Lax, toda petición que modifica datos debe traer
 * la cabecera X-ORBI-Request (un formulario de otro sitio no puede enviarla).
 */
export const requireCsrfHeader: express.RequestHandler = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.get('X-ORBI-Request') !== '1') {
    res.status(403).json({ error: 'Petición rechazada (falta cabecera de seguridad).' });
    return;
  }
  next();
};

/** Límite de intentos de inicio de sesión por IP + usuario. */
export function createLoginLimiter(maxAttempts = 8, windowMs = 15 * 60 * 1000) {
  const attempts = new Map<string, { count: number; resetAt: number }>();
  return {
    isBlocked(key: string): boolean {
      const entry = attempts.get(key);
      if (!entry) return false;
      if (Date.now() > entry.resetAt) {
        attempts.delete(key);
        return false;
      }
      return entry.count >= maxAttempts;
    },
    fail(key: string): void {
      const now = Date.now();
      const entry = attempts.get(key);
      if (!entry || now > entry.resetAt) attempts.set(key, { count: 1, resetAt: now + windowMs });
      else entry.count += 1;
      if (attempts.size > 5_000) {
        for (const [k, v] of attempts) if (now > v.resetAt) attempts.delete(k);
        // Si aún es demasiado grande, se descartan los más antiguos
        if (attempts.size > 5_000) {
          const drop = attempts.size - 5_000;
          let i = 0;
          for (const k of attempts.keys()) { if (i++ >= drop) break; attempts.delete(k); }
        }
      }
    },
    reset(key: string): void {
      attempts.delete(key);
    },
  };
}
