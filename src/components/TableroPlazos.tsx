/**
 * MÓDULO 17B — Tablero de plazos.
 *
 * Cumplimiento a tiempo, OTs vencidas y por vencer, por planta o por cliente. En los preventivos
 * el plazo es la fecha objetivo del contrato más su margen; en el resto, la fecha límite de la OT.
 */
import React, { useMemo, useState } from 'react';
import { AlertTriangle, Clock, CheckCircle2, Target } from 'lucide-react';
import type { OT, Planta } from '../types';
import { plazosDe, resumir, agrupar, ETIQUETA_PLAZO, type FilaPlazo } from '../domain/plazos';
import { localIsoDate } from '../domain/cmms';

interface Props {
  ots: OT[];
  plantas: Planta[];
}

const campo = 'min-h-11 bg-slate-950 border border-slate-700 rounded-lg px-3 text-sm text-white outline-none focus:border-emerald-500';

function Tarjeta({ titulo, valor, detalle, tono, icono }: { titulo: string; valor: string; detalle: string; tono: string; icono: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[var(--radius-card)] p-4 space-y-1">
      <div className={`flex items-center gap-2 text-sm font-semibold ${tono}`}><span aria-hidden="true" className="[&>svg]:h-4 [&>svg]:w-4">{icono}</span>{titulo}</div>
      <div className="text-3xl font-semibold text-white font-display">{valor}</div>
      <div className="text-xs text-slate-400">{detalle}</div>
    </div>
  );
}

export default function TableroPlazos({ ots, plantas }: Props) {
  const hoy = localIsoDate();
  const [tipo, setTipo] = useState<'todas' | 'Preventiva' | 'otras'>('todas');
  const [por, setPor] = useState<'planta' | 'cliente'>('planta');

  const filas = useMemo(() => plazosDe(ots, plantas, hoy).filter(f =>
    tipo === 'todas' || (tipo === 'Preventiva' ? f.ot.tipo === 'Preventiva' : f.ot.tipo !== 'Preventiva')), [ots, plantas, hoy, tipo]);
  const resumen = resumir(filas);
  const grupos = agrupar(filas, por);
  const vencidas: FilaPlazo[] = filas.filter(f => f.plazo.estado === 'vencida').sort((a, b) => b.plazo.atraso - a.plazo.atraso);
  const porVencer: FilaPlazo[] = filas.filter(f => f.plazo.estado === 'por_vencer').sort((a, b) => a.plazo.faltan - b.plazo.faltan);

  return (
    <section aria-label="Plazos de las OTs" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Plazos</h2>
          <p className="text-sm text-slate-400">Preventivos: fecha objetivo del contrato más su margen. Otras OTs: su fecha límite.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label><span className="sr-only">Tipo de OT</span>
            <select className={campo} value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)}>
              <option value="todas">Todas las OTs</option>
              <option value="Preventiva">Solo preventivas</option>
              <option value="otras">Correctivas y otras</option>
            </select>
          </label>
          <label><span className="sr-only">Agrupar por</span>
            <select className={campo} value={por} onChange={e => setPor(e.target.value as typeof por)}>
              <option value="planta">Por planta</option>
              <option value="cliente">Por cliente</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Tarjeta titulo="Vencidas" valor={String(resumen.vencidas)} detalle="Activas con el plazo pasado" tono="text-danger" icono={<AlertTriangle />} />
        <Tarjeta titulo="Por vencer" valor={String(resumen.porVencer)} detalle="Vencen en 3 días o menos" tono="text-warn" icono={<Clock />} />
        <Tarjeta titulo="Cumplimiento a tiempo" valor={resumen.cumplimiento == null ? '—' : `${resumen.cumplimiento} %`}
          detalle={`${resumen.cumplidas} de ${resumen.cumplidas + resumen.cumplidasConAtraso} ejecutadas dentro del plazo`} tono="text-ok" icono={<CheckCircle2 />} />
        <Tarjeta titulo="A tiempo" valor={String(resumen.aTiempo)} detalle="Activas con margen" tono="text-info" icono={<Target />} />
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-slate-800">
        <table className="w-full text-sm">
          <caption className="sr-only">Plazos agrupados por {por}</caption>
          <thead className="bg-slate-900 text-slate-300 text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">{por === 'planta' ? 'Planta' : 'Cliente'}</th>
              <th scope="col" className="px-3 py-2 font-semibold text-right">Vencidas</th>
              <th scope="col" className="px-3 py-2 font-semibold text-right">Por vencer</th>
              <th scope="col" className="px-3 py-2 font-semibold text-right">A tiempo</th>
              <th scope="col" className="px-3 py-2 font-semibold text-right">Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map(g => (
              <tr key={g.nombre} className="border-t border-slate-800">
                <th scope="row" className="px-3 py-2 font-medium text-white text-left">{g.nombre}</th>
                <td className={`px-3 py-2 text-right ${g.resumen.vencidas ? 'text-danger font-semibold' : 'text-slate-400'}`}>{g.resumen.vencidas}</td>
                <td className={`px-3 py-2 text-right ${g.resumen.porVencer ? 'text-warn font-semibold' : 'text-slate-400'}`}>{g.resumen.porVencer}</td>
                <td className="px-3 py-2 text-right text-slate-300">{g.resumen.aTiempo}</td>
                <td className="px-3 py-2 text-right text-slate-300">{g.resumen.cumplimiento == null ? '—' : `${g.resumen.cumplimiento} %`}</td>
              </tr>
            ))}
            {grupos.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">No hay OTs con plazo para este filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {[{ titulo: 'Vencidas', filas: vencidas, vacio: 'No hay OTs vencidas.' }, { titulo: 'Por vencer', filas: porVencer, vacio: 'No hay OTs por vencer.' }].map(b => (
        <div key={b.titulo} className="space-y-2">
          <h3 className="text-base font-semibold text-white">{b.titulo} ({b.filas.length})</h3>
          {b.filas.length === 0 ? <p className="text-sm text-slate-400">{b.vacio}</p> : (
            <ul className="divide-y divide-slate-800 rounded-[var(--radius-card)] border border-slate-800">
              {b.filas.map(({ ot, plazo, cliente }) => (
                <li key={ot.codigo} className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <span className="font-mono text-slate-300">{ot.codigo}</span>
                    <span className="text-white"> · {ot.plantaNombre}</span>
                    <span className="text-slate-400"> · {ot.tipo} · {cliente} · {ot.estado}{ot.responsable ? ` · ${ot.responsable}` : ' · sin técnico'}</span>
                    {ot.fechaObjetivo && <span className="text-slate-400"> · objetivo {ot.fechaObjetivo}</span>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plazo.estado === 'vencida' ? 'bg-danger/15 text-danger' : 'bg-warn/15 text-warn'}`}>
                    {plazo.estado === 'vencida' ? `${plazo.atraso} día${plazo.atraso === 1 ? '' : 's'} de atraso` : plazo.faltan === 0 ? 'Vence hoy' : `Vence en ${plazo.faltan} día${plazo.faltan === 1 ? '' : 's'}`}
                    <span className="sr-only"> ({ETIQUETA_PLAZO[plazo.estado]}, límite {plazo.limite})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
