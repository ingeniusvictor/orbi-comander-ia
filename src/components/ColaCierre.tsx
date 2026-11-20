/**
 * MÓDULO 17B — Cola de cierre.
 *
 * OTs ejecutadas sin cerrar, con días de espera (meta: 3 días), la firma que falta y lo que las
 * bloquea. Quien puede firmar una etapa selecciona varias OTs y las firma de una vez; cada OT
 * pasa por la máquina de estados y el servidor revalida la firma.
 */
import React, { useMemo, useState } from 'react';
import { PenLine, Clock, AlertTriangle, Timer } from 'lucide-react';
import type { OT, RoleType } from '../types';
import { colaDeCierre, resumirCola, firmarEtapa, puedeFirmar, ETAPAS, META_CIERRE_DIAS, type EtapaFirma } from '../domain/cierre';
import { localIsoDate } from '../domain/cmms';
import Button from './ui/Button';
import { notify } from './Toaster';

interface Props {
  ots: OT[];
  userRole: string;
  activeUserName: string;
  escalaciones?: { otVinculada?: string; criticidad: string; estado: string }[];
  onUpdate: (ots: OT[]) => void;
}

const campo = 'min-h-11 bg-slate-950 border border-slate-700 rounded-lg px-3 text-sm text-white outline-none focus:border-emerald-500';

export default function ColaCierre({ ots, userRole, activeUserName, escalaciones = [], onUpdate }: Props) {
  const rol = userRole as RoleType;
  const hoy = localIsoDate();
  const [etapaFiltro, setEtapaFiltro] = useState<'' | EtapaFirma | 'otras'>('');
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [comentario, setComentario] = useState('');

  const filas = useMemo(() => colaDeCierre(ots, hoy, escalaciones), [ots, hoy, escalaciones]);
  const resumen = resumirCola(filas);
  const sinFecha = filas.filter(f => !f.ejecutada).length;
  const visibles = filas.filter(f => !etapaFiltro || (etapaFiltro === 'otras' ? !f.etapa : f.etapa === etapaFiltro));
  // Se puede firmar si el rol corresponde a la etapa; la última (cierre) además exige que no haya bloqueos
  const firmable = (f: typeof filas[number]) => Boolean(f.etapa && puedeFirmar(f.etapa, rol) && (f.etapa !== 'JefeOM' || f.bloqueos.length === 0));
  const firmables = visibles.filter(firmable);
  const elegidas = firmables.filter(f => seleccion.has(f.ot.codigo));

  const alternar = (codigo: string) => setSeleccion(prev => {
    const n = new Set(prev);
    if (n.has(codigo)) n.delete(codigo); else n.add(codigo);
    return n;
  });

  const firmar = () => {
    let lista = ots;
    const errores: string[] = [];
    let ok = 0;
    for (const f of elegidas) {
      const r = firmarEtapa(f.ot, { usuario: activeUserName, rol, escalaciones, comentario });
      if (r.ok === false) { errores.push(`${f.ot.codigo}: ${r.error}`); continue; }
      lista = lista.map(o => (o.codigo === r.ot.codigo ? r.ot : o));
      ok++;
    }
    if (ok) onUpdate(lista);
    setSeleccion(new Set());
    setComentario('');
    notify(errores.length ? `Se firmaron ${ok} OT(s). No se pudo: ${errores.join(' · ')}` : `Se firmaron ${ok} OT(s).`);
  };

  return (
    <section aria-label="Cola de cierre" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Cola de cierre</h2>
          <p className="text-sm text-slate-400">OTs ejecutadas en terreno que esperan firmas para cerrarse. Meta: cerrar en {META_CIERRE_DIAS} días o menos.</p>
        </div>
        <label><span className="sr-only">Filtrar por firma pendiente</span>
          <select className={campo} value={etapaFiltro} onChange={e => { setEtapaFiltro(e.target.value as typeof etapaFiltro); setSeleccion(new Set()); }}>
            <option value="">Todas las etapas</option>
            {(Object.keys(ETAPAS) as EtapaFirma[]).map(e => <option key={e} value={e}>Falta firma: {ETAPAS[e].nombre}</option>)}
            <option value="otras">En revisión HSE o Calidad</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {[
          { t: 'Ejecutadas sin cerrar', v: String(resumen.total), d: sinFecha ? `Esperando firmas · ${sinFecha} sin fecha de ejecución registrada` : 'Esperando firmas', c: 'text-info', i: <Timer /> },
          { t: `Más de ${META_CIERRE_DIAS} días`, v: String(resumen.sobreMeta), d: 'Fuera de la meta de cierre', c: resumen.sobreMeta ? 'text-danger' : 'text-ok', i: <AlertTriangle /> },
          { t: 'Espera promedio', v: resumen.promedioDias == null ? '—' : `${resumen.promedioDias} d`, d: 'Desde la ejecución en terreno', c: 'text-warn', i: <Clock /> },
        ].map(k => (
          <div key={k.t} className="bg-slate-900 border border-slate-800 rounded-[var(--radius-card)] p-4 space-y-1">
            <div className={`flex items-center gap-2 text-sm font-semibold ${k.c}`}><span aria-hidden="true" className="[&>svg]:h-4 [&>svg]:w-4">{k.i}</span>{k.t}</div>
            <div className="text-3xl font-semibold text-white font-display">{k.v}</div>
            <div className="text-xs text-slate-400">{k.d}</div>
          </div>
        ))}
      </div>

      {firmables.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 bg-slate-900 border border-slate-800 rounded-[var(--radius-card)] p-3">
          <label className="inline-flex items-center gap-2 min-h-11 text-sm text-slate-200">
            <input type="checkbox" className="h-5 w-5 accent-emerald-500"
              checked={elegidas.length === firmables.length}
              onChange={e => setSeleccion(e.target.checked ? new Set(firmables.map(f => f.ot.codigo)) : new Set())} />
            Seleccionar todas las que puedo firmar ({firmables.length})
          </label>
          <label className="flex-1 min-w-56">
            <span className="sr-only">Comentario de la firma (opcional)</span>
            <input className={`${campo} w-full`} value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Comentario de la firma (opcional)" />
          </label>
          <Button variant="primary" icon={<PenLine />} disabled={elegidas.length === 0} onClick={firmar}>
            Firmar {elegidas.length || ''} seleccionada{elegidas.length === 1 ? '' : 's'}
          </Button>
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-400 border border-dashed border-slate-800 rounded-xl">No hay OTs ejecutadas esperando cierre.</div>
      ) : (
        <ul className="space-y-2">
          {visibles.map(f => {
            const puede = firmable(f);
            const tono = f.dias > META_CIERRE_DIAS * 2 ? 'bg-danger/15 text-danger' : f.dias > META_CIERRE_DIAS ? 'bg-warn/15 text-warn' : 'bg-slate-800 text-slate-300';
            return (
              <li key={f.ot.codigo} className="bg-slate-900 border border-slate-800 rounded-[var(--radius-card)] p-3 flex gap-3">
                <div className="pt-2.5">
                  <input type="checkbox" className="h-5 w-5 accent-emerald-500 disabled:opacity-30" disabled={!puede}
                    aria-label={`Seleccionar OT ${f.ot.codigo}`} checked={seleccion.has(f.ot.codigo) && puede} onChange={() => alternar(f.ot.codigo)} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-slate-300">{f.ot.codigo}</span>
                      <span className="text-sm text-white">{f.ot.plantaNombre} · {f.ot.tipo}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tono}`}>
                      {f.ejecutada ? (f.dias === 0 ? 'Ejecutada hoy' : `${f.dias} día${f.dias === 1 ? '' : 's'} sin cerrar`) : 'Sin fecha de ejecución'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">
                    {f.etapa ? <>Falta firma: <span className="font-semibold">{ETAPAS[f.etapa].nombre}</span></> : <>En {f.ot.estado.toLowerCase()}</>}
                    {f.ot.responsable ? <span className="text-slate-400"> · ejecutó {f.ot.responsable}</span> : null}
                  </p>
                  {f.bloqueos.length > 0 && (
                    <p className="text-xs text-warn">Para cerrar falta: {f.bloqueos.join(' ')}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
