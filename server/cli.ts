/**
 * MÓDULO 17A — Administración de usuarios del piloto (línea de comandos).
 *
 *   npm run user -- list
 *   npm run user -- create <usuario> <ROL> "<Nombre como aparece en las OTs>"
 *   npm run user -- reset-password <usuario>
 *   npm run user -- deactivate <usuario>
 *   npm run user -- activate <usuario>
 *
 * La contraseña inicial se genera al azar, se muestra UNA vez y el usuario debe cambiarla al entrar.
 */
import { openDb } from './db';
import { createUser, generatePassword, setPassword } from './auth';
import { ROLES_CONFIG } from '../src/data/rolesConfig';

const [command, ...args] = process.argv.slice(2);
const db = openDb();

function usage(): never {
  console.log(`Uso:
  npm run user -- list
  npm run user -- create <usuario> <ROL> "<Nombre como aparece en las OTs>"
  npm run user -- reset-password <usuario>
  npm run user -- deactivate <usuario>
  npm run user -- activate <usuario>

Roles: ${Object.keys(ROLES_CONFIG).join(', ')}`);
  process.exit(1);
}

try {
  switch (command) {
    case 'list': {
      const rows = db.prepare('SELECT username, display_name, role, active, must_change_password FROM users ORDER BY username').all();
      console.table(rows);
      break;
    }
    case 'create': {
      const [username, role, displayName] = args;
      if (!username || !role) usage();
      const password = generatePassword();
      createUser(db, { username, role, displayName: displayName || username, password });
      console.log(`Usuario "${username}" creado con rol ${role}.`);
      console.log(`Contraseña inicial (entrégala en persona; se pide cambiarla al entrar): ${password}`);
      break;
    }
    case 'reset-password': {
      const [username] = args;
      if (!username) usage();
      const password = generatePassword();
      if (!setPassword(db, username, password)) throw new Error(`No existe el usuario "${username}".`);
      db.prepare('UPDATE users SET must_change_password = 1 WHERE username = ?').run(username);
      console.log(`Nueva contraseña temporal para "${username}": ${password}`);
      break;
    }
    case 'deactivate':
    case 'activate': {
      const [username] = args;
      if (!username) usage();
      const r = db.prepare('UPDATE users SET active = ? WHERE username = ?').run(command === 'activate' ? 1 : 0, username);
      if (Number(r.changes) === 0) throw new Error(`No existe el usuario "${username}".`);
      if (command === 'deactivate') {
        db.prepare('DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE username = ?)').run(username);
      }
      console.log(`Usuario "${username}" ${command === 'activate' ? 'activado' : 'desactivado'}.`);
      break;
    }
    default:
      usage();
  }
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
} finally {
  db.close();
}
