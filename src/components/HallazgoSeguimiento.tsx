/**
 * MÓDULO 17B — Crear un correctivo de seguimiento desde un hallazgo del checklist.
 *
 * Aparece bajo la pregunta marcada como "Hallazgo". Funciona sin señal: el correctivo se guarda
 * en el teléfono y se envía al volver la conexión (el servidor lo valida y lo vincula a esta OT).
 */
import React, { useState } from 'react';
import { Wrench, Check } from 'lucide-react';
import type { OT, OTPrioridad } from '../types';
import { buildFollowUpOT, newFollowUpCode, validateFollowUpInput, canCreateFollowUpFrom, FOLLOW_UP_PRIORITIES } from '../domain/seguimiento';
import { localIsoDate } from '../domain/cmms';
import Button from './ui/Button';
import { notify } from './Toaster';

interface Props {
  origin: OT;
  /** Texto de la pregunta del checklist. */
  pregunta: string;
  observacion?: string;
  fotos?: { fileId: string; url: string }[];
  ots: OT[];
  userName: string;
  onCreate: (ot: OT) => void;
}

const campo = 'w-full min-h-11 bg-slate-950 border border-slate-700 rounded-lg px-3 text-sm text-white outline-none focus:border-emerald-500';

export default function HallazgoSeguimiento({ origin, pregunta, observacion, fotos = [], ots, userName, onCreate }: Props) {
  const existentes = ots.filter(o => o.otOrigen === origin.codigo && o.hallazgoOrigen?.item === pregunta);
  const [abierto, setAbierto] = useState(false);
  const [descripcion, setDescripcion] = useState(observacion || '');
  const [prioridad, setPrioridad] = useState<OTPrioridad>('Media');
  const [error, setError] = useState<string | null>(null);

  if (!canCreateFollowUpFrom(origin)) return null;

  const crear = () => {
    const input = { descripcion, prioridad, item: pregunta, fotos };
    const invalido = validateFollowUpInput(input);
    if (invalido) return setError(invalido);
    const ot = buildFollowUpOT(origin, input, newFollowUpCode(), userName, localIsoDate());
    onCreate(ot);
    setError(null);
    setAbierto(false);
    notify(`Correctivo ${ot.codigo} creado. Queda esperando aprobación de coordinación.`);
  };

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
      {existentes.map(o => (
        <div key={o.codigo} className="flex items-center gap-2 text-sm text-slate-200">
          <Check className="h-4 w-4 text-ok shrink-0" aria-hidden="true" />
          <span>Correctivo <span className="font-mono">{o.codigo}</span> · {o.estado}</span>
        </div>
      ))}
      {!abierto ? (
        <Button variant="secondary" fullWidth icon={<Wrench />} onClick={() => setAbierto(true)}>
          {existentes.length ? 'Crear otro correctivo' : 'Crear correctivo por este hallazgo'}
        </Button>
      ) : (
        <div className="space-y-2">
          <label className="block space-y-1">
            <span className="text-sm text-slate-300">¿Qué falla encontraste y qué hay que hacer?</span>
            <textarea
              className={`${campo} py-2 min-h-20`}
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej.: conector MC4 quemado en string 4, reemplazar"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-slate-300">Prioridad</span>
            <select className={campo} value={prioridad} onChange={e => setPrioridad(e.target.value as OTPrioridad)}>
              {FOLLOW_UP_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          {fotos.length > 0 && <p className="text-xs text-slate-400">Se adjuntan {fotos.length} foto(s) de esta pregunta.</p>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => { setAbierto(false); setError(null); }}>Cancelar</Button>
            <Button variant="primary" onClick={crear}>Crear correctivo</Button>
          </div>
          <p className="text-xs text-slate-400">Se crea en la misma planta y activo, esperando aprobación. Lo asigna coordinación.</p>
        </div>
      )}
    </div>
  );
}
