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
import { loadAssets, loadCodes } from './CmmsMaestros';

interface Props {
  ot: OT;
  /** Aplica cambios a la OT (sin cambiar su estado). */
  onChange: (patch: Partial<OT>) => void;
  userName: string;
  /** Planificación/supervisión: puede cambiar el activo y corregir líneas de HH. */
  canEditPlanning: boolean;
  compact?: boolean;
}

const input = 'w-full min-h-11 bg-slate-950 border border-slate-700 rounded-lg px-3 text-sm text-white outline-none focus:border-emerald-500';

export default function OTMaintenanceFields({ ot, onChange, userName, canEditPlanning, compact }: Props) {
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
      <div className="text-xs font-mono font-bold text-emerald-400 uppercase">Datos de mantenimiento</div>

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
        {lineError && <div className="text-rose-300 text-xs">{lineError}</div>}
        <button onClick={addLine} className="min-h-11 px-3 text-sm rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1 hover:bg-emerald-500 hover:text-slate-950">
          <Plus className="h-3 w-3" /> Registrar mis horas ({hoursBetween(line.horaInicio, line.horaFin)} h)
        </button>
        <p className="text-xs text-slate-500">HH referenciales para gestión de la OT; no constituyen registro de asistencia ni remuneración.</p>
      </div>
    </div>
  );
}
