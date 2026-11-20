/**
 * MÓDULO 17B — Bandeja "Por aprobar".
 *
 * Correctivos y OTs en "Espera aprobación", las más antiguas primero, con los días que llevan
 * esperando (alerta desde 15 días). Coordinación aprueba asignando técnico, rechaza con motivo
 * o marca el trabajo como cobrable cuando el cliente aprobó pagarlo. El servidor vuelve a validar todo.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Check, X, Clock, Wrench, Receipt, Radio } from 'lucide-react';
import type { OT, OrganigramaNode, RoleType } from '../types';
import { transitionOT } from '../domain/otStateMachine';
import { pendientesDeAprobacion, ALERTA_DIAS_APROBACION, ROLES_APROBACION, ROLES_COBRO } from '../domain/aprobacion';
import Button from './ui/Button';
import { notify } from './Toaster';

interface Props {
  ots: OT[];
  organigrama: OrganigramaNode[];
  userRole: string;
  activeUserName: string;
  onUpdate: (ots: OT[]) => void;
}

const campo = 'w-full min-h-11 bg-slate-950 border border-slate-700 rounded-lg px-3 text-sm text-white outline-none focus:border-emerald-500';

function DiasBadge({ dias }: { dias: number }) {
  const tono = dias >= ALERTA_DIAS_APROBACION * 2 ? 'bg-danger/15 text-danger border-danger/40'
    : dias >= ALERTA_DIAS_APROBACION ? 'bg-warn/15 text-warn border-warn/40'
    : 'bg-slate-800 text-slate-300 border-slate-700';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${tono}`}>
      <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {dias === 0 ? 'Hoy' : `${dias} día${dias === 1 ? '' : 's'}`}
    </span>
  );
}

export default function BandejaAprobacion({ ots, organigrama, userRole, activeUserName, onUpdate }: Props) {
  const rol = userRole as RoleType;
  const puedeAprobar = ROLES_APROBACION.includes(rol);
  const puedeCobrar = ROLES_COBRO.includes(rol);
  const pendientes = useMemo(() => pendientesDeAprobacion(ots), [ots]);
  // Técnicos e ingenieros del organigrama (su cargo es texto libre) más quienes ya tienen OTs asignadas
  const tecnicos = useMemo(() => {
    const nombres = new Set<string>();
    for (const n of organigrama) {
      if (n.activo !== false && (n.role === 'TECNICO_OM' || n.role === 'INGENIERO_OM' || /t[eé]cnico|ingeniero/i.test(String(n.role)))) nombres.add(n.name);
    }
    for (const o of ots) if (o.responsable?.trim()) nombres.add(o.responsable.trim());
    return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
  }, [organigrama, ots]);
  const [planta, setPlanta] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [tecnico, setTecnico] = useState('');
  const [motivo, setMotivo] = useState('');
  const [referencia, setReferencia] = useState('');
  // 17D: estado de la conexión con las alarmas del SCADA
  const [alarmas, setAlarmas] = useState<{ configurada: boolean; ultimaRevision?: string; error?: string } | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch('/api/integraciones/alarmas', { headers: { 'X-ORBI-Request': '1' }, credentials: 'same-origin' })
      .then(r => (r.ok ? r.json() : null)).then(j => { if (vivo) setAlarmas(j); }).catch(() => { /* sin señal: no se muestra */ });
    return () => { vivo = false; };
  }, []);

  const plantas = [...new Set(pendientes.map(p => p.ot.plantaNombre))].sort();
  const visibles = pendientes.filter(p => !planta || p.ot.plantaNombre === planta);
  const enAlerta = pendientes.filter(p => p.dias >= ALERTA_DIAS_APROBACION).length;

  const reemplazar = (ot: OT) => onUpdate(ots.map(o => (o.codigo === ot.codigo ? ot : o)));

  const abrir = (ot: OT) => {
    setAbierta(abierta === ot.codigo ? null : ot.codigo);
    setTecnico(ot.responsable || '');
    setMotivo('');
    setReferencia(ot.cobrableReferencia || '');
  };

  const aprobar = (ot: OT) => {
    const r = transitionOT(ot, 'Asignada', { usuario: activeUserName, rol, comentario: `Aprobada por ${activeUserName} y asignada a ${tecnico}` },
      { responsable: tecnico, tecnicoAsignado: tecnico });
    if (r.ok === false) return notify(r.error);
    reemplazar(r.ot);
    setAbierta(null);
    notify(`OT ${ot.codigo} aprobada y asignada a ${tecnico}.`);
  };

  const rechazar = (ot: OT) => {
    if (motivo.trim().length < 5) return notify('Escribe el motivo del rechazo (al menos 5 caracteres).');
    const r = transitionOT(ot, 'Cancelada', { usuario: activeUserName, rol, comentario: `Rechazada: ${motivo.trim()}` });
    if (r.ok === false) return notify(r.error);
    reemplazar(r.ot);
    setAbierta(null);
    notify(`OT ${ot.codigo} rechazada.`);
  };

  const marcarCobrable = (ot: OT, cobrable: boolean) => {
    reemplazar({ ...ot, cobrable, cobrableReferencia: referencia.trim() || undefined });
    notify(cobrable ? `OT ${ot.codigo} marcada como cobrable.` : `OT ${ot.codigo} ya no es cobrable.`);
  };

  return (
    <section aria-label="OTs por aprobar" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Por aprobar</h2>
          <p className="text-sm text-slate-400">
            {pendientes.length} OT{pendientes.length === 1 ? '' : 's'} esperando aprobación
            {enAlerta > 0 && <> · <span className="text-warn font-semibold">{enAlerta} con {ALERTA_DIAS_APROBACION} días o más</span></>}
          </p>
        </div>
        <label className="min-w-56">
          <span className="sr-only">Filtrar por planta</span>
          <select className={campo} value={planta} onChange={e => setPlanta(e.target.value)}>
            <option value="">Todas las plantas</option>
            {plantas.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>

      {alarmas && (
        <p className="text-xs text-slate-400 inline-flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5" aria-hidden="true" />
          {!alarmas.configurada ? 'Alarmas del SCADA (VCOM): aún no conectadas. Los correctivos por alarma aparecerán aquí al conectarlas.'
            : alarmas.error ? `Alarmas del SCADA (VCOM): no se pudieron revisar (${alarmas.error}).`
            : `Alarmas del SCADA (VCOM): conectadas${alarmas.ultimaRevision ? `, última revisión ${new Date(alarmas.ultimaRevision).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : ''}.`}
        </p>
      )}

      {!puedeAprobar && (
        <p className="text-sm text-slate-400">Puedes ver la bandeja, pero aprobar corresponde a coordinación, planificación o jefatura.</p>
      )}

      {visibles.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-400 border border-dashed border-slate-800 rounded-xl">
          No hay OTs esperando aprobación.
        </div>
      )}

      <ul className="space-y-3">
        {visibles.map(({ ot, dias }) => (
          <li key={ot.codigo} className="bg-slate-900 border border-slate-800 rounded-[var(--radius-card)] p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-slate-300">{ot.codigo}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{ot.tipo}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">Prioridad {ot.prioridad}</span>
                  {ot.cobrable && <span className="text-xs px-2 py-0.5 rounded bg-ok/15 text-ok inline-flex items-center gap-1"><Receipt className="h-3.5 w-3.5" aria-hidden="true" />Cobrable</span>}
                </div>
                <p className="text-sm font-semibold text-white">{ot.plantaNombre} · {ot.activo}</p>
                <p className="text-sm text-slate-300">{ot.diagnosticoInicial || ot.observaciones}</p>
                {ot.alarmasOrigen && ot.alarmasOrigen.length > 0 && (
                  <p className="text-xs text-danger inline-flex items-center gap-1">
                    <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                    Alarma del SCADA: {ot.alarmasOrigen[0].titulo}{ot.alarmasOrigen.length > 1 ? ` (+${ot.alarmasOrigen.length - 1})` : ''}
                  </p>
                )}
                {ot.otOrigen && (
                  <p className="text-xs text-slate-400 inline-flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                    Hallazgo en la OT <span className="font-mono">{ot.otOrigen}</span>{ot.reportadoPor ? ` · reportado por ${ot.reportadoPor}` : ''}
                  </p>
                )}
              </div>
              <DiasBadge dias={dias} />
            </div>

            {(puedeAprobar || puedeCobrar) && (
              <Button variant={abierta === ot.codigo ? 'ghost' : 'secondary'} size="sm" onClick={() => abrir(ot)} aria-expanded={abierta === ot.codigo}>
                {abierta === ot.codigo ? 'Cerrar' : 'Revisar'}
              </Button>
            )}

            {abierta === ot.codigo && (
              <div className="grid gap-4 md:grid-cols-3 border-t border-slate-800 pt-3">
                {puedeAprobar && (
                  <div className="space-y-2">
                    <label className="block space-y-1">
                      <span className="text-sm text-slate-300">Técnico responsable</span>
                      <select className={campo} value={tecnico} onChange={e => setTecnico(e.target.value)}>
                        <option value="">Elegir técnico…</option>
                        {tecnicos.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                    <Button variant="primary" fullWidth icon={<Check />} disabled={!tecnico} onClick={() => aprobar(ot)}>
                      Aprobar y asignar
                    </Button>
                  </div>
                )}
                {puedeAprobar && (
                  <div className="space-y-2">
                    <label className="block space-y-1">
                      <span className="text-sm text-slate-300">Motivo del rechazo</span>
                      <input className={campo} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej.: duplicada con otra OT" />
                    </label>
                    <Button variant="danger" fullWidth icon={<X />} onClick={() => rechazar(ot)}>Rechazar</Button>
                  </div>
                )}
                {puedeCobrar && (
                  <div className="space-y-2">
                    <label className="block space-y-1">
                      <span className="text-sm text-slate-300">Respaldo del cliente (opcional)</span>
                      <input className={campo} value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="N.º de OC o correo de aprobación" />
                    </label>
                    <Button variant="secondary" fullWidth icon={<Receipt />} onClick={() => marcarCobrable(ot, !ot.cobrable)}>
                      {ot.cobrable ? 'Quitar cobrable' : 'Marcar como cobrable'}
                    </Button>
                    {ot.cobrableDetalle && (
                      <p className="text-xs text-slate-400">Marcado por {ot.cobrableDetalle.por} el {ot.cobrableDetalle.fecha.slice(0, 10)}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
