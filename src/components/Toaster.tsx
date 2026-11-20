/**
 * MÓDULO 17A — UX P1: avisos propios en lugar de alert() nativo.
 *
 * alert() bloquea la pantalla, tapa el aviso de "Sin señal" y no es accesible.
 * `notify(mensaje)` muestra un aviso en la parte inferior, legible en el teléfono,
 * anunciado por lectores de pantalla (role="alert" en errores, role="status" en el resto).
 */
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type NotifyKind = 'success' | 'error' | 'info';

const EVENT = 'orbi:notify';

/** Deduce el tipo cuando no se indica: los mensajes de éxito suelen empezar con "¡" o decir "correctamente". */
function inferKind(message: string): NotifyKind {
  if (/^(falta|no se|no puede|no hay|debe|error|stock insuficiente|indique|indica|complete|seleccione|transición no permitida|tu rol|solo |un técnico|código de espera|la orden de trabajo se encuentra)/i.test(message.trim())) return 'error';
  if (/^¡|correctamente|con éxito|guardad[oa]|registrad[oa]|subida/i.test(message)) return 'success';
  return 'info';
}

export function notify(message: unknown, kind?: NotifyKind): void {
  const text = String(message ?? '');
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, kind: kind ?? inferKind(text) } }));
}

interface Toast { id: number; text: string; kind: NotifyKind }

const STYLES: Record<NotifyKind, string> = {
  success: 'bg-emerald-950 border-emerald-500/50 text-emerald-50',
  error: 'bg-rose-950 border-rose-500/60 text-rose-50',
  info: 'bg-slate-900 border-slate-600 text-slate-50',
};

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let next = 1;
    const onNotify = (e: Event) => {
      const { text, kind } = (e as CustomEvent<{ text: string; kind: NotifyKind }>).detail;
      const id = next++;
      setToasts(prev => [...prev.slice(-2), { id, text, kind }]);
      // Los errores quedan más tiempo para alcanzar a leerlos
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), kind === 'error' ? 9000 : 5000);
    };
    window.addEventListener(EVENT, onNotify);
    return () => window.removeEventListener(EVENT, onNotify);
  }, []);

  if (!toasts.length) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-3 pointer-events-none">
      {toasts.map(t => {
        const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertTriangle : Info;
        return (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto w-full max-w-md flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl shadow-black/40 ${STYLES[t.kind]}`}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="flex-1 leading-snug">{t.text}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              aria-label="Cerrar aviso"
              className="shrink-0 -m-1 p-2 rounded-lg opacity-80 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
