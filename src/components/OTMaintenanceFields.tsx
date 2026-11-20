/**
 * MÓDULO 17A — Fase 2: campos de mantenimiento de una OT.
 *
 * Activo del catastro, motivo de espera codificado, codificación de falla (correctivas)
 * y líneas de horas hombre por técnico. Se usa en la ficha de OT Center y en Vista Terreno.
 */
import React, { useMemo, useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import type { OT } from '../types';
import { localIsoDate, assetPath, hoursBetween, totalLaborHours, validateLaborLine, requiresFailureCode, type LaborLine } from '../domain/cmms';
import { softwrenchCodeOf } from '../domain/otStateMachine';
import { loadAssets, loadCodes } from '../data/cmmsStore';
import { followUpsOf } from '../domain/seguimiento';
import { plazoDe, ETIQUETA_PLAZO } from '../domain/plazos';

import Button from './ui/Button';
interface Props {
  ot: OT;
  /** 17B: todas las OTs visibles, para mostrar el estado de los correctivos de seguimiento. */
  ots?: OT[];
  /** 17B: coordinación o jefatura: puede marcar la OT como cobrable al cliente. */
  puedeCobrar?: boolean;
  /** Aplica cambios a la OT (sin cambiar su estado). */
  onChange: (patch: Partial<OT>) => void;
  userName: string;
  /** Planificación/supervisión: puede cambiar el activo y corregir líneas de HH. */
  canEditPlanning: boolean;
  compact?: boolean;
}

const input = 'w-full min-h-11 bg-slate-950 border border-slate-700 rounded-lg px-3 text-sm text-white outline-none focus:border-emerald-500';

export default function OTMaintenanceFields({ ot, ots = [], onChange, userName, canEditPlanning, compact, puedeCobrar }: Props) {
  const assets = useMemo(() => loadAssets(), []);
  const codes = useMemo(() => loadCodes(), []);
  const plantAssets = assets.filter(a => a.activo && (a.plantaId === ot.plantaId || a.plantaId === ot.plantaId?.trim()));
  const today = localIsoDate();
  const [line, setLine] = useState({ fecha: today, horaInicio: '08:00', horaFin: '12:00', actividad: '' });
  const [lineError, setLineError] = useState<string | null>(null);
  const lines = ot.laborLines || [];
  const enEspera = softwrenchCodeOf(ot.estado) === 'HOLD';

  const addLine = () => {
    const nueva: LaborLine = {
      id: `HH-${Date.now()}`,
      tecnico: userName,
      fecha: line.fecha,
      horaInicio: line.horaInicio,
      horaFin: line.horaFin,
      horas: hoursBetween(line.horaInicio, line.horaFin),
      actividad: line.actividad || undefined,
    };
    const err = validateLaborLine(nueva);
    if (err) return setLineError(err);
    setLineError(null);
    const next = [...lines, nueva];
    onChange({ laborLines: next, hhReales: totalLaborHours(next) });
    setLine({ ...line, actividad: '' });
  };

  const setFalla = (key: 'problema' | 'causa' | 'accion', value: string) =>
    onChange({ codigoFalla: { problema: '', causa: '', accion: '', ...(ot.codigoFalla || {}), [key]: value } });

  return (
    <div className={`bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-3 text-xs ${compact ? '' : 'mt-2'}`}>
      <div className="text-sm font-semibold text-accent">Datos de mantenimiento</div>

      {/* 17C: OT importada desde SoftWrench */}
      {ot.softwrench && (
        <div className="text-sm text-slate-300">
          Importada desde SoftWrench (OT <span className="font-mono">{ot.softwrench.wonum}</span>, estado {ot.softwrench.estado})
          {ot.softwrench.enlace && /^https:\/\//.test(ot.softwrench.enlace) && (
            <> · <a href={ot.softwrench.enlace} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">Ver en SoftWrench</a></>
          )}
        </div>
      )}

      {/* 17B: vínculo con la OT donde se encontró la falla y correctivos que nacieron de esta OT */}
      {ot.otOrigen && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-sm text-slate-200">
          Correctivo por un hallazgo en la OT <span className="font-mono">{ot.otOrigen}</span>
          {ot.hallazgoOrigen?.item ? <> · {ot.hallazgoOrigen.item}</> : null}
          {ot.reportadoPor ? <span className="text-slate-400"> · reportado por {ot.reportadoPor}</span> : null}
        </div>
      )}
      {followUpsOf(ot, ots).length > 0 && (
        <div className="space-y-1">
          <span className="text-slate-400">Correctivos creados desde esta OT</span>
          {followUpsOf(ot, ots).map(codigo => {
            const seg = ots.find(o => o.codigo === codigo);
            return (
              <div key={codigo} className="flex justify-between text-sm text-slate-200 border-b border-slate-900 py-1">
                <span className="font-mono">{codigo}</span>
                <span>{seg ? `${seg.prioridad} · ${seg.estado}` : 'Registrado'}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 17B: plazo (fecha objetivo del contrato o fecha límite) */}
      {(() => {
        const p = plazoDe(ot, today);
        if (p.estado === 'sin_plazo' || p.estado === 'cancelada') return null;
        const tono = p.estado === 'vencida' || p.estado === 'cumplida_con_atraso' ? 'text-danger' : p.estado === 'por_vencer' ? 'text-warn' : 'text-ok';
        return (
          <div className="text-sm text-slate-300">
            {ot.fechaObjetivo ? <>Fecha objetivo del contrato <span className="font-mono">{ot.fechaObjetivo}</span>, plazo hasta <span className="font-mono">{p.limite}</span></> : <>Plazo hasta <span className="font-mono">{p.limite}</span></>}
            {' · '}<span className={`font-semibold ${tono}`}>{ETIQUETA_PLAZO[p.estado]}{p.atraso ? ` (${p.atraso} días de atraso)` : ''}</span>
          </div>
        );
      })()}

      {/* 17B: cobro al cliente */}
      {puedeCobrar ? (
        <div className="grid gap-2 sm:grid-cols-[auto_1fr] items-center">
          <label className="inline-flex items-center gap-2 min-h-11 text-sm text-slate-200">
            <input type="checkbox" className="h-5 w-5 accent-emerald-500" checked={Boolean(ot.cobrable)} onChange={e => onChange({ cobrable: e.target.checked })} />
            Cobrable al cliente
          </label>
          <input aria-label="Respaldo del cobro" className={input} placeholder="N.º de OC o correo de aprobación (opcional)" value={ot.cobrableReferencia || ''} onChange={e => onChange({ cobrableReferencia: e.target.value || undefined })} />
        </div>
      ) : ot.cobrable ? (
        <div className="text-sm text-ok">Cobrable al cliente{ot.cobrableReferencia ? ` · ${ot.cobrableReferencia}` : ''}</div>
      ) : null}
      {ot.cobrableDetalle && <div className="text-xs text-slate-400">Cobro marcado por {ot.cobrableDetalle.por} el {ot.cobrableDetalle.fecha.slice(0, 10)}</div>}

      {/* Activo */}
      <label className="block space-y-1">
        <span className="text-slate-400">Activo</span>
        {canEditPlanning && plantAssets.length > 0 ? (
          <select className={input} value={ot.activoId || ''} onChange={e => onChange({ activoId: e.target.value || undefined })}>
            <option value="">— {ot.activo || 'Sin activo del catastro'} —</option>
            {plantAssets.map(a => <option key={a.id} value={a.id}>{assetPath(assets, a.id)}</option>)}
          </select>
        ) : (
          <div className="text-slate-200">{ot.activoId ? assetPath(assets, ot.activoId) : ot.activo || '—'}</div>
        )}
      </label>

      {/* Motivo de espera */}
      <label className="block space-y-1">
        <span className="text-slate-400">Motivo de espera {enEspera ? '(OT en espera)' : '(se exige al pasar a espera)'}</span>
        <select className={input} value={ot.motivoEsperaCodigo || ''} onChange={e => onChange({ motivoEsperaCodigo: e.target.value || undefined })}>
          <option value="">Sin motivo</option>
          {codes.espera.map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.descripcion}</option>)}
        </select>
      </label>

      {/* Codificación de falla */}
      {requiresFailureCode(ot.tipo) && (
        <div className="space-y-1">
          <span className="text-slate-400">Codificación de falla (obligatoria para cerrar)</span>
          <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {([['problema', codes.fallaProblema], ['causa', codes.fallaCausa], ['accion', codes.fallaAccion]] as const).map(([key, list]) => (
              <select key={key} aria-label={key === 'problema' ? 'Problema de la falla' : key === 'causa' ? 'Causa de la falla' : 'Acción realizada'} className={input} value={ot.codigoFalla?.[key] || ''} onChange={e => setFalla(key, e.target.value)}>
                <option value="">{key === 'problema' ? 'Problema…' : key === 'causa' ? 'Causa…' : 'Acción…'}</option>
                {list.map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.descripcion}</option>)}
              </select>
            ))}
          </div>
        </div>
      )}

      {/* Horas hombre */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Horas hombre registradas</span>
          <span className="font-mono text-white">{totalLaborHours(lines)} HH</span>
        </div>
        {lines.map(l => (
          <div key={l.id} className="flex justify-between text-xs text-slate-300 border-b border-slate-900 py-0.5">
            <span>{l.tecnico} · {l.fecha} {l.horaInicio}–{l.horaFin}{l.actividad ? ` · ${l.actividad}` : ''}</span>
            <span className="font-mono">{l.horas} h</span>
          </div>
        ))}
        <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
          <input type="date" aria-label="Fecha de las horas" className={input} value={line.fecha} onChange={e => setLine({ ...line, fecha: e.target.value })} />
          <input type="time" aria-label="Hora de inicio" className={input} value={line.horaInicio} onChange={e => setLine({ ...line, horaInicio: e.target.value })} />
          <input type="time" aria-label="Hora de término" className={input} value={line.horaFin} onChange={e => setLine({ ...line, horaFin: e.target.value })} />
          <input aria-label="Actividad (opcional)" className={input} placeholder="Actividad (opcional)" value={line.actividad} onChange={e => setLine({ ...line, actividad: e.target.value })} />
        </div>
        {lineError && <div role="alert" className="text-danger text-xs">{lineError}</div>}
        <Button variant="primary" onClick={addLine} icon={<Plus />}>
          Registrar mis horas ({hoursBetween(line.horaInicio, line.horaFin)} h)
        </Button>
        <p className="text-xs text-slate-500">HH referenciales para gestión de la OT; no constituyen registro de asistencia ni remuneración.</p>
      </div>
    </div>
  );
}
