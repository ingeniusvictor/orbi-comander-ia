import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Shield,
  Activity,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Sliders,
  History,
  UserCheck,
  Briefcase,
  X,
  ExternalLink,
  ChevronRight,
  Truck
} from 'lucide-react';
import { OT, Planta, OTEstado, OTPrioridad, OTType } from '../types';
import { getPlantBadgeInfo } from '../data/plantIdentityMap';

// ==========================================
// 1. CONFLICT DETECTION LOGIC & DATA DEFINITION
// ==========================================

export interface WorkspaceConflict {
  id: string;
  type: 'danger' | 'warning';
  title: string;
  description: string;
  otCodigo?: string;
}

export function detectWorkspaceConflicts(ots: OT[] = [], todayStr: string = '2026-07-10'): WorkspaceConflict[] {
  const conflicts: WorkspaceConflict[] = [];
  const techDayMap: { [key: string]: { ot: OT; hours: number }[] } = {};

  (ots || []).forEach((ot) => {
    if (ot.estado === 'Borrador') return;

    const isBlocked = ot.estado === 'Bloqueada' || ot.bloqueada;
    const isUnassigned = !ot.responsable || ot.responsable === 'Por definir' || ot.responsable === 'Sin asignar' || ot.responsable === '';
    const requiresPTW = ot.tipo === 'Correctiva' || ot.prioridad === 'Crítica' || ot.tipo === 'HSE';
    const isScheduled = !!ot.fechaInicio;

    // 1. Actividad crítica está sin responsable
    if (ot.prioridad === 'Crítica' && isUnassigned) {
      conflicts.push({
        id: `critica-sin-resp-${ot.codigo}`,
        type: 'danger',
        title: 'Actividad Crítica sin Responsable',
        description: `La orden ${ot.codigo} es de prioridad Crítica pero no tiene técnico asignado.`,
        otCodigo: ot.codigo
      });
    }

    // 2. Actividad requiere PTW y no tiene responsable
    if (requiresPTW && isUnassigned) {
      conflicts.push({
        id: `ptw-sin-resp-${ot.codigo}`,
        type: 'warning',
        title: 'Requiere PTW sin Responsable',
        description: `La orden ${ot.codigo} requiere Permiso de Trabajo (PTW) pero no tiene responsable asignado.`,
        otCodigo: ot.codigo
      });
    }

    // 3. Actividad bloqueada por logística fue programada igual
    if (isBlocked && isScheduled) {
      conflicts.push({
        id: `bloqueada-programada-${ot.codigo}`,
        type: 'danger',
        title: 'Actividad Bloqueada Programada',
        description: `La orden ${ot.codigo} tiene bloqueos logísticos activos pero está programada para ejecución.`,
        otCodigo: ot.codigo
      });
    }

    // 4. Actividad vencida sigue sin programación
    if (!isScheduled) {
      if (ot.fechaLimite && ot.fechaLimite < todayStr) {
        conflicts.push({
          id: `vencida-sin-prog-${ot.codigo}`,
          type: 'warning',
          title: 'Actividad Vencida sin Programación',
          description: `La orden ${ot.codigo} superó su fecha límite (${ot.fechaLimite}) y sigue sin programar en Workspace.`,
          otCodigo: ot.codigo
        });
      }
    }

    // Track assignments for overlaps and 12h limits
    if (isScheduled && !isUnassigned) {
      const day = ot.fechaInicio;
      const tech = ot.responsable;
      const key = `${day}_${tech}`;
      if (!techDayMap[key]) {
        techDayMap[key] = [];
      }
      techDayMap[key].push({ ot, hours: ot.hhEstimadas || 8 });
    }
  });

  // Analyze overlaps and daily 12h limit per tech per day
  Object.entries(techDayMap).forEach(([key, assignments]) => {
    const [day, tech] = key.split('_');
    const totalHours = assignments.reduce((sum, a) => sum + a.hours, 0);

    // 5. Técnico supera 12 HH planificadas en un día
    if (totalHours > 12) {
      conflicts.push({
        id: `excede-hh-${day}-${tech}`,
        type: 'danger',
        title: 'Límite de HH Diarias Superado',
        description: `El técnico ${tech} tiene ${totalHours} horas planificadas para el ${day}, superando el límite de 12 horas diarias.`,
      });
    }

    // 6. Técnico tiene dos o más actividades asignadas el mismo día (potential overlap)
    if (assignments.length > 1) {
      const codes = assignments.map(a => a.ot.codigo).join(', ');
      conflicts.push({
        id: `traslape-${day}-${tech}`,
        type: 'warning',
        title: 'Traslape de Actividades',
        description: `El técnico ${tech} tiene ${assignments.length} actividades programadas para el ${day} (${codes}).`,
      });
    }
  });

  return conflicts;
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'Cerrada':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'Ejecutada':
      return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
    case 'En Proceso':
    case 'En terreno':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'Asignada':
      return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    case 'Bloqueada':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse';
    default:
      return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
};

const getPrioridadColor = (prioridad: string) => {
  return prioridad === 'Crítica' ? 'text-rose-400 font-bold' : 'text-slate-300';
};

const getDayName = (day: number) => {
  const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const date = new Date(2026, 6, day); // July 2026
  return names[date.getDay()];
};

// ==========================================
// 2. WORKSPACE VIEWS COMPONENTS
// ==========================================

// -- 2.1 VIEW SELECTOR SUB-TAB --
interface ViewSelectorProps {
  activeView: string;
  setActiveView: (view: any) => void;
}

export function WorkspaceViewSelector({ activeView, setActiveView }: ViewSelectorProps) {
  const views = [
    { id: 'mes', label: 'Vista Mes' },
    { id: 'semana', label: 'Vista Semana' },
    { id: 'dia', label: 'Vista Día' },
    { id: 'despacho', label: 'Lista de Despacho' },
  ];

  return (
    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 self-start">
      {views.map((v) => (
        <button
          key={v.id}
          onClick={() => setActiveView(v.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
            activeView === v.id
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

// -- 2.2 WEEK VIEW --
interface WeekViewProps {
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  filteredOts: OT[];
  plantas: Planta[];
  setSelectedOt: (ot: OT) => void;
  onOpenScheduleModal: (ot: OT) => void;
  isPlanner: boolean;
}

export function WorkspaceWeekView({
  selectedWeek,
  setSelectedWeek,
  filteredOts,
  plantas,
  setSelectedOt,
  onOpenScheduleModal,
  isPlanner,
}: WeekViewProps) {
  const getOtDay = (ot: OT) => {
    const codeNum = parseInt(ot.codigo.replace(/\D/g, ''), 10) || 5;
    return (codeNum % 28) + 1;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-850">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-mono text-slate-300">
            Plan de Trabajo Semanal — <strong>Semana {selectedWeek} de Julio 2026</strong>
          </span>
        </div>
        <div className="flex bg-slate-900 p-1 rounded border border-slate-800 text-[10px] font-mono gap-1">
          {[1, 2, 3, 4].map((wk) => (
            <button
              key={wk}
              onClick={() => setSelectedWeek(wk)}
              className={`px-3 py-0.5 rounded transition-all cursor-pointer ${
                selectedWeek === wk ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana {wk}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {Array.from({ length: 7 }, (_, index) => {
          const dayNum = (selectedWeek - 1) * 7 + index + 1;
          const dayOts = filteredOts.filter((ot) => getOtDay(ot) === dayNum);
          const dayName = getDayName(dayNum);

          return (
            <div
              key={dayNum}
              className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 flex flex-col min-h-[350px] hover:border-slate-800/80 transition-colors"
            >
              <div className="text-center pb-2 mb-2 border-b border-slate-900 font-mono flex flex-col">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">{dayName}</span>
                <span className="text-base font-black text-emerald-400">{dayNum}</span>
                <span className="text-[8px] text-slate-600">JUL 2026</span>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[400px] pr-0.5">
                {dayOts.length === 0 ? (
                  <div className="text-[9px] font-mono text-slate-600 text-center py-10">
                    Sin OTs
                  </div>
                ) : (
                  dayOts.map((ot) => {
                    const isBlocked = ot.estado === 'Bloqueada' || ot.bloqueada;
                    const isUnassigned = !ot.responsable || ot.responsable === 'Por definir' || ot.responsable === 'Sin asignar' || ot.responsable === '';
                    const requiresPTW = ot.tipo === 'Correctiva' || ot.prioridad === 'Crítica' || ot.tipo === 'HSE';

                    return (
                      <div
                        key={ot.codigo}
                        className="bg-slate-950 border border-slate-850 hover:border-slate-700 p-2.5 rounded-lg cursor-pointer transition-all space-y-2 group relative"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-mono text-slate-400 font-bold group-hover:text-emerald-400">{ot.codigo}</span>
                          <span className={`text-[7px] px-1 py-0.5 rounded ${getEstadoColor(ot.estado)}`}>
                            {ot.estado}
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="text-[10px] font-bold text-white truncate">{ot.activo}</h4>
                          <div className="flex items-center gap-1 flex-wrap">
                            <p className="text-[8px] text-slate-500 font-mono truncate">{ot.plantaNombre}</p>
                            {(() => {
                              const badge = getPlantBadgeInfo(ot.legacyPlantId || ot.plantaId || ot.plantaNombre, ot.plantaId);
                              if (badge.label === 'PLANTA MASTER CONFIRMADA') return null;
                              return (
                                <span className={`text-[7px] font-mono px-1 rounded border ${badge.styleToken}`} title={badge.tooltip}>
                                  {badge.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {isBlocked && (
                            <span className="text-[7px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/10 px-1 rounded flex items-center gap-0.5">
                              ⚠️ Bloqueo
                            </span>
                          )}
                          {isUnassigned && (
                            <span className="text-[7px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/10 px-1 rounded flex items-center gap-0.5">
                              👤 Sin Asig.
                            </span>
                          )}
                          {requiresPTW && (
                            <span className="text-[7px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/10 px-1 rounded flex items-center gap-0.5">
                              📄 PTW
                            </span>
                          )}
                        </div>

                        <div className="text-[8px] font-mono text-slate-500 pt-1.5 border-t border-slate-900/60 flex flex-col gap-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 truncate max-w-[50px]">{ot.responsable || 'Sin asignar'}</span>
                            <span className="text-emerald-500 font-bold">{ot.hhEstimadas || 8}H</span>
                          </div>
                          <div className="text-[7px] text-slate-600 flex justify-between">
                            <span>08:30 UTC-4</span>
                            <span className={getPrioridadColor(ot.prioridad)}>{ot.prioridad}</span>
                          </div>
                        </div>

                        <div className="pt-1 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOt(ot);
                            }}
                            className="flex-1 py-0.5 bg-slate-900 hover:bg-slate-850 text-[8px] font-mono text-slate-300 rounded text-center cursor-pointer"
                          >
                            Detalle
                          </button>
                          {isPlanner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenScheduleModal(ot);
                              }}
                              className="px-1 py-0.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-[8px] font-mono rounded text-center font-bold cursor-pointer"
                              title="Reprogramar"
                            >
                              Reprog.
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -- 2.3 DAY VIEW (CHRONOLOGICAL TIMELINE) --
interface DayViewProps {
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  filteredOts: OT[];
  plantas: Planta[];
  setSelectedOt: (ot: OT) => void;
  onOpenScheduleModal: (ot: OT) => void;
  isPlanner: boolean;
}

export function WorkspaceDayView({
  selectedDay,
  setSelectedDay,
  filteredOts,
  plantas,
  setSelectedOt,
  onOpenScheduleModal,
  isPlanner,
}: DayViewProps) {
  const getOtDay = (ot: OT) => {
    const codeNum = parseInt(ot.codigo.replace(/\D/g, ''), 10) || 5;
    return (codeNum % 28) + 1;
  };

  const dayOts = filteredOts.filter((ot) => getOtDay(ot) === selectedDay);

  // Simple sort chronologically or by estimated hours / code
  const sortedOts = [...dayOts].sort((a, b) => a.codigo.localeCompare(b.codigo));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-850">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-mono text-slate-300">
            Agenda Operativa Diaria — <strong>Día {selectedDay} de Julio 2026</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800 text-[10px] font-mono">
          {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                selectedDay === day ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {day}
            </button>
          ))}
          <span className="text-slate-600 px-1 font-bold">JUL</span>
        </div>
      </div>

      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 relative">
        <div className="absolute left-9 top-6 bottom-6 w-[1px] bg-slate-800"></div>

        {sortedOts.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-mono text-xs">
            No hay actividades O&M programadas para este día.
          </div>
        ) : (
          <div className="space-y-6 relative">
            {sortedOts.map((ot, idx) => {
              const pPlanta = plantas.find(p => p.id === ot.plantaId || p.name === ot.plantaNombre);
              const pZona = pPlanta ? pPlanta.zona : 'Centro';
              const isBlocked = ot.estado === 'Bloqueada' || ot.bloqueada;
              const isUnassigned = !ot.responsable || ot.responsable === 'Por definir' || ot.responsable === 'Sin asignar' || ot.responsable === '';
              const requiresPTW = ot.tipo === 'Correctiva' || ot.prioridad === 'Crítica' || ot.tipo === 'HSE';

              // Assign a mock chronological start hour based on index
              const hours = ['08:00', '09:30', '11:00', '13:30', '15:00', '16:30'];
              const startHour = hours[idx % hours.length];

              return (
                <div key={ot.codigo} className="flex gap-4 items-start relative group pl-2">
                  {/* Timeline point */}
                  <div className="z-10 h-3 w-3 rounded-full bg-emerald-500 border-4 border-slate-950 ring-1 ring-emerald-500/30 transition-all group-hover:scale-125 shrink-0 mt-1"></div>

                  {/* Time label */}
                  <div className="w-14 shrink-0 font-mono text-[10px] text-slate-400 font-bold mt-0.5">
                    {startHour} hrs
                  </div>

                  {/* Activity Details Card */}
                  <div className="flex-1 bg-slate-950 border border-slate-850 p-4 rounded-xl hover:border-slate-700 transition-colors flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">
                          {ot.codigo}
                        </span>
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold ${getEstadoColor(ot.estado)}`}>
                          {ot.estado}
                        </span>
                        <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                          Tipo: {ot.tipo}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                          Estimación: {ot.hhEstimadas || 8} Hrs
                        </span>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 font-mono">
                          PLANTA: {ot.plantaNombre} <span className="text-emerald-500 font-bold ml-2">({pZona})</span>
                        </h4>
                        <h3 className="text-xs font-black text-white mt-0.5">{ot.activo}</h3>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2.5 border-t border-slate-900/60 text-[9px] font-mono text-slate-400">
                        <div>
                          <span className="text-slate-600 block text-[8px] uppercase">Supervisor Terreno</span>
                          <span className="text-slate-200 font-bold">{ot.supervisor || 'Alejandro Rojas'}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 block text-[8px] uppercase">Técnico Asignado</span>
                          <span className="text-slate-200 font-bold">{ot.responsable || 'Por definir'}</span>
                        </div>
                        <div>
                          <span className="text-slate-600 block text-[8px] uppercase">Logística & Vehículo</span>
                          <span className="text-emerald-400 font-bold">Toyota Hilux V01</span>
                        </div>
                        <div>
                          <span className="text-slate-600 block text-[8px] uppercase">Prioridad</span>
                          <span className={getPrioridadColor(ot.prioridad)}>{ot.prioridad}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {isBlocked && (
                          <div className="text-[8px] font-mono text-rose-400 bg-rose-500/5 border border-rose-500/20 px-2 py-1 rounded">
                            ⚠️ Bloqueo de repuesto activo: Requiere reconciliación O&M
                          </div>
                        )}
                        {requiresPTW && (
                          <div className="text-[8px] font-mono text-indigo-400 bg-indigo-500/5 border border-indigo-500/20 px-2 py-1 rounded">
                            📄 Requiere PTS / AST de Seguridad antes de la apertura
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-end gap-1.5 shrink-0 pl-4 border-l border-slate-900/80">
                      <button
                        onClick={() => setSelectedOt(ot)}
                        className="bg-slate-900 hover:bg-slate-800 text-[9px] font-mono px-3 py-2 rounded text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye className="h-3 w-3" /> Ficha Workspace
                      </button>
                      {isPlanner && (
                        <button
                          onClick={() => onOpenScheduleModal(ot)}
                          className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-[9px] font-mono px-3 py-2 rounded font-bold cursor-pointer"
                        >
                          Reprogramar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// -- 2.4 DISPATCH LIST --
interface DispatchListProps {
  ots: OT[];
  plantas: Planta[];
  setSelectedOt: (ot: OT) => void;
  onOpenScheduleModal: (ot: OT) => void;
  isPlanner: boolean;
}

export function WorkspaceDispatchList({
  ots,
  plantas,
  setSelectedOt,
  onOpenScheduleModal,
  isPlanner,
}: DispatchListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Filter activities for dispatch list (scheduled and unscheduled)
  const dispatchActivities = ots.filter((ot) => {
    if (ot.estado === 'Borrador') return false;

    const matchesSearch =
      ot.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ot.plantaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ot.activo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'Todos' ||
      (statusFilter === 'Programada' && !!ot.fechaInicio) ||
      (statusFilter === 'Pendiente' && !ot.fechaInicio);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">Consola de Despacho y Seguimiento</h3>
          <p className="text-[10px] text-slate-400 font-mono">Seguimiento en tiempo real de actividades planificadas y pendientes de asignación.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Buscar por Código, Planta o Activo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-white font-mono rounded-lg px-3 py-1.5 focus:border-emerald-500/40 outline-none w-52"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono rounded-lg px-3 py-1.5 focus:border-emerald-500/40 outline-none"
          >
            <option value="Todos">Todas las actividades</option>
            <option value="Programada">Programadas</option>
            <option value="Pendiente">Pendientes de Asignar</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-950/20 border border-slate-900 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold">
                <th className="p-3.5">Código</th>
                <th className="p-3.5">Planta / Zona</th>
                <th className="p-3.5">Activo O&M</th>
                <th className="p-3.5">Planificación</th>
                <th className="p-3.5">Técnico / Supervisor</th>
                <th className="p-3.5">Prioridad / PTW</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dispatchActivities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-slate-500">
                    No se encontraron actividades en la consola de despacho.
                  </td>
                </tr>
              ) : (
                dispatchActivities.map((ot) => {
                  const pPlanta = plantas.find(p => p.id === ot.plantaId || p.name === ot.plantaNombre);
                  const pZona = pPlanta ? pPlanta.zona : 'Centro';
                  const isBlocked = ot.estado === 'Bloqueada' || ot.bloqueada;
                  const isUnassigned = !ot.responsable || ot.responsable === 'Por definir' || ot.responsable === 'Sin asignar' || ot.responsable === '';
                  const requiresPTW = ot.tipo === 'Correctiva' || ot.prioridad === 'Crítica' || ot.tipo === 'HSE';

                  return (
                    <tr key={ot.codigo} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">
                        {ot.codigo}
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-200">{ot.plantaNombre}</div>
                        <span className="text-[9px] text-slate-500">Zona: {pZona}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-300 font-bold truncate max-w-[150px]">{ot.activo}</div>
                        <span className="text-[9px] text-slate-500">Tipo: {ot.tipo}</span>
                      </td>
                      <td className="p-3.5">
                        {ot.fechaInicio ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-200">
                              <Calendar className="h-3 w-3 text-emerald-400 shrink-0" />
                              <span>{ot.fechaInicio}</span>
                            </div>
                            <span className="text-[9px] text-slate-500">Hora: 08:30 | HH: {ot.hhEstimadas || 8}</span>
                          </div>
                        ) : (
                          <span className="text-amber-400 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 text-[10px]">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5 text-slate-300">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-500 shrink-0" />
                            <span>T: {ot.responsable || 'Sin asignar'}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 block">S: {ot.supervisor || 'Alejandro Rojas'}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-bold ${ot.prioridad === 'Crítica' ? 'text-rose-400' : 'text-slate-400'}`}>
                            {ot.prioridad}
                          </span>
                          <div className="flex gap-1.5">
                            {isBlocked && (
                              <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 rounded font-bold" title="Bloqueo Logístico">
                                ⚠️ BLOQ
                              </span>
                            )}
                            {requiresPTW && (
                              <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 rounded font-bold" title="Requiere PTW">
                                📄 PTW
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getEstadoColor(ot.estado)}`}>
                          {ot.estado}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOt(ot)}
                            className="bg-slate-900 hover:bg-slate-800 text-[10px] p-1.5 rounded text-slate-300 cursor-pointer"
                            title="Ficha Detalle"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {isPlanner && (
                            <button
                              onClick={() => onOpenScheduleModal(ot)}
                              className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold text-[10px] px-2 py-1.5 rounded cursor-pointer"
                            >
                              {ot.fechaInicio ? 'Reprogramar' : 'Programar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -- 2.5 CONFLICT DETECTOR SIDEBAR COMPONENT --
interface ConflictPanelProps {
  conflicts: WorkspaceConflict[];
  onOpenOt: (codigo: string) => void;
}

export function WorkspaceConflictPanel({ conflicts, onOpenOt }: ConflictPanelProps) {
  if (conflicts.length === 0) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
        <div>
          <h4 className="text-[11px] font-bold font-mono text-emerald-400 uppercase">Sin Conflictos Operativos</h4>
          <p className="text-[9px] text-slate-400 font-mono mt-0.5">Todos los técnicos y OTs están asignados y balanceados perfectamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-3.5">
      <div className="flex justify-between items-center pb-2 border-b border-slate-900">
        <h4 className="text-[11px] font-bold font-mono text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-rose-400" /> Detector de Conflictos ({conflicts.length})
        </h4>
        <span className="text-[8px] font-mono bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold animate-pulse">
          ALERTAS ACTIVAS
        </span>
      </div>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-0.5">
        {conflicts.map((c) => (
          <div
            key={c.id}
            className={`p-3 rounded-lg border text-xs font-mono leading-normal flex items-start gap-2.5 transition-colors ${
              c.type === 'danger'
                ? 'bg-rose-500/5 border-rose-500/15 text-rose-300'
                : 'bg-amber-500/5 border-amber-500/15 text-amber-300'
            }`}
          >
            <AlertTriangle className={`h-4.5 w-4.5 shrink-0 ${c.type === 'danger' ? 'text-rose-400' : 'text-amber-400'}`} />
            <div className="flex-1 space-y-1">
              <h5 className="font-black uppercase text-[10px]">{c.title}</h5>
              <p className="text-[9px] text-slate-400 leading-snug">{c.description}</p>
              {c.otCodigo && (
                <button
                  onClick={() => onOpenOt(c.otCodigo!)}
                  className="mt-1 text-[8px] font-bold underline text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
                >
                  Ver Ficha {c.otCodigo} <ChevronRight className="h-2 w-2" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- 2.6 SCHEDULE & RESCHEDULE FORM MODAL --
interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  ot: OT | null;
  plantas: Planta[];
  username: string;
  onSave: (
    otCodigo: string,
    data: {
      fechaInicio: string;
      responsable: string;
      supervisor: string;
      hhEstimadas: number;
      estado: OTEstado;
      observaciones: string;
      motivoReprogramacion?: string;
    }
  ) => void;
}

export function WorkspaceScheduleModal({
  isOpen,
  onClose,
  ot,
  plantas,
  username,
  onSave,
}: ScheduleModalProps) {
  if (!isOpen || !ot) return null;

  const isRescheduling = !!ot.fechaInicio;

  // Form states
  const [date, setDate] = useState(ot.fechaInicio || '2026-07-06');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(ot.hhEstimadas || 8);
  const [supervisor, setSupervisor] = useState(ot.supervisor || 'Alejandro Rojas');
  const [responsable, setResponsable] = useState(ot.responsable || 'Cristián Barraza');
  const [estado, setEstado] = useState<OTEstado>(ot.estado || 'Programada');
  const [observaciones, setObservaciones] = useState(ot.observaciones || '');
  const [motivo, setMotivo] = useState('Clima');

  const pPlanta = plantas.find(p => p.id === ot.plantaId || p.name === ot.plantaNombre);
  const pZona = pPlanta ? pPlanta.zona : 'Centro';

  // Dropdown list options
  const supervisores = ['Alejandro Rojas', 'Mauricio Valdés', 'Francisco Jara'];
  const tecnicos = ['Cristián Barraza', 'Eduardo Carvallo', 'Daniel Godoy', 'Yasmín Castro', 'Beatriz Loyola', 'Héctor Mellado'];
  const motivos = [
    'Clima / Condiciones Atmosféricas',
    'Repuesto no disponible (Bodega)',
    'Flota no disponible (Vehículos)',
    'Permiso pendiente / Autorización',
    'Prioridad cliente / SCADA',
    'Sobrecarga técnico (SLA)',
    'Otro motivo operativo'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(ot.codigo, {
      fechaInicio: date,
      responsable,
      supervisor,
      hhEstimadas: Number(duration),
      estado,
      observaciones,
      motivoReprogramacion: isRescheduling ? motivo : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-extrabold">
              {isRescheduling ? 'MÓDULO 11B: REPROGRAMAR ACTIVIDAD' : 'MÓDULO 11B: PROGRAMAR Y PLANIFICAR'}
            </span>
            <h3 className="text-sm font-black text-white">Consola de Coordinación — {ot.codigo}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Asset Context */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 text-[10px] font-mono grid grid-cols-2 gap-2 text-slate-400">
            <div>
              <span className="text-slate-600 block text-[8px] uppercase">Planta / Zona</span>
              <span className="text-white font-bold">{ot.plantaNombre} ({pZona})</span>
            </div>
            <div>
              <span className="text-slate-600 block text-[8px] uppercase">Activo</span>
              <span className="text-white font-bold">{ot.activo}</span>
            </div>
            <div>
              <span className="text-slate-600 block text-[8px] uppercase">Tipo de OT</span>
              <span className="text-emerald-400 font-bold">{ot.tipo}</span>
            </div>
            <div>
              <span className="text-slate-600 block text-[8px] uppercase">Prioridad</span>
              <span className={`font-bold ${ot.prioridad === 'Crítica' ? 'text-rose-400' : 'text-slate-300'}`}>
                {ot.prioridad}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Fecha */}
            <div>
              <label className="text-slate-500 text-[9px] block uppercase font-bold font-mono mb-1">Fecha Programada</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Hora */}
            <div>
              <label className="text-slate-500 text-[9px] block uppercase font-bold font-mono mb-1">Hora Inicio</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* HH Estimadas */}
            <div>
              <label className="text-slate-500 text-[9px] block uppercase font-bold font-mono mb-1">HH Estimadas (Esfuerzo)</label>
              <input
                type="number"
                min="1"
                max="24"
                required
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="text-slate-500 text-[9px] block uppercase font-bold font-mono mb-1">Estado Despacho</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as OTEstado)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
              >
                <option value="Programada">Programada</option>
                <option value="Asignada">Asignada / Despachada</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Bloqueada">Bloqueada Logística</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Técnico */}
            <div>
              <label className="text-slate-500 text-[9px] block uppercase font-bold font-mono mb-1">Técnico Líder (Ejecutor)</label>
              <select
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
              >
                <option value="Por definir">Por definir / Sin asignar</option>
                {tecnicos.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Supervisor */}
            <div>
              <label className="text-slate-500 text-[9px] block uppercase font-bold font-mono mb-1">Supervisor Responsable</label>
              <select
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
              >
                {supervisores.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Rescheduling Reason (ONLY if isRescheduling) */}
          {isRescheduling && (
            <div className="bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl space-y-1.5">
              <label className="text-amber-400 text-[9px] block uppercase font-black font-mono flex items-center gap-1">
                <History className="h-3.5 w-3.5" /> Motivo de la Reprogramación (Mandatario)
              </label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
              >
                {motivos.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="text-[8px] text-slate-500 font-mono block">
                Esta acción aumentará el contador de reprogramaciones de la actividad.
              </span>
            </div>
          )}

          {/* Historical Log info if already rescheduled */}
          {ot.reprogramacionesCount && (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[9px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Historial:</span>
                <span className="text-amber-400 font-bold">{ot.reprogramacionesCount} Reprogramaciones</span>
              </div>
              <div>Fecha Original: <span className="text-slate-200">{ot.fechaOriginal || 'No registrada'}</span></div>
              <div>Último Motivo: <span className="text-slate-200">{ot.ultimoMotivoReprogramacion}</span></div>
              <div>Registrado por: <span className="text-slate-200">{ot.ultimoUsuarioReprogramacion}</span></div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="text-slate-500 text-[9px] block uppercase font-bold font-mono mb-1">Notas & Observaciones de Despacho</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Describir requerimientos específicos para el traslado, herramientas, permisos..."
              className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-850 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-850 text-slate-400 font-bold font-mono text-xs px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-500 text-slate-950 font-black font-mono text-xs px-5 py-2 rounded-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              {isRescheduling ? 'Confirmar Reprogramación' : 'Programar Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
