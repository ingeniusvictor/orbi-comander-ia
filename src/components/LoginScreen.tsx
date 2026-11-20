/**
 * MÓDULO 17A — Fase 1: inicio de sesión y cambio obligatorio de contraseña.
 */
import React, { useState } from 'react';
import { login, changePassword, ApiError, type SessionInfo } from '../data/serverSync';

import Button from './ui/Button';
interface Props {
  mode: 'login' | 'change-password';
  onDone: (session?: SessionInfo) => void;
}

export default function LoginScreen({ mode, onDone }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'change-password' && newPassword !== confirm) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        onDone(await login(username, password));
      } else {
        await changePassword(password, newPassword);
        onDone();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No hay conexión con el servidor. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase">ORBI O&amp;M Work Center</div>
          <h1 className="text-lg font-bold text-white mt-1">
            {mode === 'login' ? 'Iniciar sesión' : 'Cambia tu contraseña'}
          </h1>
          {mode === 'change-password' && (
            <p className="text-xs text-slate-400 mt-1">Es tu primer ingreso o tu contraseña fue restablecida. Elige una nueva de al menos 10 caracteres.</p>
          )}
        </div>

        {mode === 'login' && (
          <label className="block space-y-1">
            <span className="text-xs text-slate-400">Usuario</span>
            <input className={input} autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
          </label>
        )}
        <label className="block space-y-1">
          <span className="text-xs text-slate-400">{mode === 'login' ? 'Contraseña' : 'Contraseña actual'}</span>
          <input className={input} type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {mode === 'change-password' && (
          <>
            <label className="block space-y-1">
              <span className="text-xs text-slate-400">Nueva contraseña</span>
              <input className={input} type="password" autoComplete="new-password" minLength={10} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-slate-400">Repite la nueva contraseña</span>
              <input className={input} type="password" autoComplete="new-password" minLength={10} value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </label>
          </>
        )}

        {error && <div role="alert" className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2">{error}</div>}

        <Button type="submit" variant="primary" fullWidth disabled={busy}>
          {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Guardar contraseña'}
        </Button>
      </form>
    </div>
  );
}
