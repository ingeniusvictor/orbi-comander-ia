import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  User, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Wrench,
  Activity,
  AlertOctagon,
  ChevronRight,
  HelpCircle,
  FileText
} from 'lucide-react';
import { OT, Planta, OrganigramaNode } from '../types';

interface ResourcePlannerProps {
  ots: OT[];
  plantas: Planta[];
  organigrama: OrganigramaNode[];
  onUpdateOts: (updated: OT[]) => void;
  onOpenOt?: (ot: OT) => void;
}

// Squad structure
interface Squad {
  id: string;
  name: string;
  members: string[];
  assignedPark: string;
}

export default function ResourcePlanner({
  ots = [],
  plantas = [],
  organigrama = [],
  onUpdateOts,
  onOpenOt
}: ResourcePlannerProps) {
  // Master date is July 8, 2026
  const targetDate = '2026-07-08';

  // State for selected technician for "Ruta del día"
  const technicians = organigrama.filter(
    n => n.role === 'TECNICO_OM' || n.role === 'INGENIERO_OM'
  );
  const [selectedTechForRoute, setSelectedTechForRoute] = useState<string>(
    technicians[0]?.name || 'Víctor León'
  );

  // Squads definition (mock but synced with actual data)
  const [squads] = useState<Squad[]>([
    {
      id: 'sq-cantillana',
      name: 'Cuadrilla Cantillana',
      members: ['Víctor León', 'Carrasco'],
      assignedPark: 'Planta Solar Cantillana'
    },
    {
      id: 'sq-parral',
      name: 'Cuadrilla Parral',
      members: ['Rodrigo Cisterna'],
      assignedPark: 'Planta Solar Parral'
    },
    {
      id: 'sq-centro',
      name: 'Cuadrilla Zona Centro',
      members: ['Víctor León', 'Rodrigo Cisterna'],
      assignedPark: 'Planta Solar Lontué'
    },
    {
      id: 'sq-external',
      name: 'Apoyo externo / Vendor',
      members: ['Contratista Eléctrico IM-01'],
      assignedPark: 'Planta Solar Cantillana'
    }
  ]);

  // Calculations for individual technician load
  const getTechLoadDetail = (techName: string) => {
    const techOts = ots.filter(o => 
      (o.tecnicoAsignado || o.responsable || '').toLowerCase() === techName.toLowerCase()
    );

    // Today (2026-07-08)
    const todayOts = techOts.filter(o => (o.fechaProgramada || o.fechaInicio) === targetDate);
    const todayHours = todayOts.reduce((sum, o) => sum + (o.hhEstimadas || 8), 0);

    // Week (July 5 - July 11, 2026)
    const weekOts = techOts.filter(o => {
      const date = o.fechaProgramada || o.fechaInicio || '';
      return date >= '2026-07-05' && date <= '2026-07-11';
    });
    const weekHours = weekOts.reduce((sum, o) => sum + (o.hhEstimadas || 8), 0);

    // Determine workload status
    let status: 'Disponible' | 'Normal' | 'Alta carga' | 'Sobrecargado' = 'Disponible';
    if (todayHours > 12 || weekHours > 45) {
      status = 'Sobrecargado';
    } else if (todayHours > 8 || weekHours > 35) {
      status = 'Alta carga';
    } else if (todayHours > 0 || weekHours > 0) {
      status = 'Normal';
    }

    // Next activity today (first scheduled chronological OT)
    const sortedTodayOts = [...todayOts].sort((a, b) => {
      const timeA = a.horaInicioEstimada || '08:00';
      const timeB = b.horaInicioEstimada || '08:00';
      return timeA.localeCompare(timeB);
    });

    const nextActivity = sortedTodayOts.find(o => 
      !['Cerrada', 'Finalizada', 'Lista para revisión', 'Ejecutada'].includes(o.estado)
    );

    // Last completed activity (historically complete/executed)
    const lastCompleted = techOts.find(o => 
      ['Cerrada', 'Finalizada', 'Lista para revisión', 'Ejecutada'].includes(o.estado)
    );

    // Main park based on their active assignments
    const mainPark = todayOts[0]?.plantaNombre || 'Planta Solar Cantillana';

    return {
      todayCount: todayOts.length,
      weekCount: weekOts.length,
      todayHours,
      weekHours,
      status,
      nextActivity: nextActivity ? `${nextActivity.horaInicioEstimada || '08:30'} - ${nextActivity.codigo} (${nextActivity.plantaNombre})` : 'Sin tareas pendientes',
      lastCompleted: lastCompleted ? `${lastCompleted.codigo} - ${lastCompleted.plantaNombre}` : 'Ninguna recientemente',
      mainPark
    };
  };

  // Calculations for Squads
  const getSquadLoadDetail = (squad: Squad) => {
    // Get all unique OTs assigned to squad members
    const membersLower = (squad?.members || []).map(m => m.toLowerCase());
    const squadOts = ots.filter(o => {
      const assigned = (o.tecnicoAsignado || o.responsable || '').toLowerCase();
      return membersLower.includes(assigned);
    });

    const todayOts = squadOts.filter(o => (o.fechaProgramada || o.fechaInicio) === targetDate);
    const todayHours = todayOts.reduce((sum, o) => sum + (o.hhEstimadas || 8), 0);

    let status: 'Disponible' | 'Normal' | 'Alta carga' | 'Sobrecargado' = 'Disponible';
    if (todayHours > 20) {
      status = 'Sobrecargado';
    } else if (todayHours > 12) {
      status = 'Alta carga';
    } else if (todayHours > 0) {
      status = 'Normal';
    }

    const overloadRisk = todayHours > 16 ? 'Riesgo Alto' : todayHours > 10 ? 'Riesgo Medio' : 'Riesgo Bajo';

    return {
      todayCount: todayOts.length,
      todayHours,
      status,
      overloadRisk
    };
  };

  // Conflict Detector
  const detectConflicts = () => {
    const list: {
      id: string;
      type: 'overlap' | 'overload_day' | 'overload_week' | 'unassigned_critical' | 'overdue_unscheduled' | 'ptw_no_leader';
      severity: 'high' | 'medium';
      message: string;
      tech?: string;
      otCode?: string;
    }[] = [];

    // 1. Check Technician Overload & Overlapping schedules
    technicians.forEach(t => {
      const techOts = ots.filter(o => 
        (o.tecnicoAsignado || o.responsable || '').toLowerCase() === t.name.toLowerCase()
      );

      // Check daily hours per day
      const dailyHours: { [date: string]: number } = {};
      const dailyOts: { [date: string]: OT[] } = {};

      techOts.forEach(o => {
        const date = o.fechaProgramada || o.fechaInicio || '';
        if (date) {
          dailyHours[date] = (dailyHours[date] || 0) + (o.hhEstimadas || 8);
          dailyOts[date] = dailyOts[date] || [];
          dailyOts[date].push(o);
        }
      });

      // Daily hours > 12h
      Object.keys(dailyHours).forEach(date => {
        if (dailyHours[date] > 12) {
          list.push({
            id: `overload-day-${t.name}-${date}`,
            type: 'overload_day',
            severity: 'high',
            message: `El técnico ${t.name} supera las 12 horas estimadas (${dailyHours[date]}h) programadas para el ${date}.`,
            tech: t.name
          });
        }

        // Check overlapping schedules on the same day (same start hour)
        const dayOtsList = dailyOts[date];
        const timesSeen = new Set<string>();
        dayOtsList.forEach(o => {
          const time = o.horaInicioEstimada || '08:30';
          if (timesSeen.has(time) && !['Cerrada', 'Finalizada'].includes(o.estado)) {
            list.push({
              id: `overlap-${t.name}-${date}-${time}`,
              type: 'overlap',
              severity: 'high',
              message: `Conflicto horario: ${t.name} tiene múltiples OTs asignadas a las ${time} el día ${date}.`,
              tech: t.name,
              otCode: o.codigo
            });
          }
          timesSeen.add(time);
        });
      });

      // Weekly hours > 45h (July 5 - July 11, 2026)
      const weekOts = techOts.filter(o => {
        const date = o.fechaProgramada || o.fechaInicio || '';
        return date >= '2026-07-05' && date <= '2026-07-11';
      });
      const weekHours = weekOts.reduce((sum, o) => sum + (o.hhEstimadas || 8), 0);
      if (weekHours > 45) {
        list.push({
          id: `overload-week-${t.name}`,
          type: 'overload_week',
          severity: 'high',
          message: `El técnico ${t.name} supera el límite legal semanal de 45 horas estimadas (${weekHours}h acumuladas).`,
          tech: t.name
        });
      }
    });

    // 2. Critical OT with no technician assigned
    ots.forEach(o => {
      const isCritical = o.prioridad === 'Crítica' || o.criticidad === 'Crítica';
      const isAssigned = o.tecnicoAsignado || o.responsable;
      const isClosed = ['Cerrada', 'Finalizada', 'Cancelada'].includes(o.estado);

      if (isCritical && !isAssigned && !isClosed) {
        list.push({
          id: `unassigned-critical-${o.codigo}`,
          type: 'unassigned_critical',
          severity: 'high',
          message: `Alerta Crítica: La OT ${o.codigo} (${o.plantaNombre}) tiene prioridad Crítica pero no tiene técnico asignado.`,
          otCode: o.codigo
        });
      }

      // Overdue OT still unscheduled
      const isOverdue = o.fechaLimite && o.fechaLimite < targetDate;
      const isScheduled = o.fechaProgramada || o.fechaInicio;
      if (isOverdue && !isScheduled && !isClosed) {
        list.push({
          id: `overdue-unscheduled-${o.codigo}`,
          type: 'overdue_unscheduled',
          severity: 'medium',
          message: `OT Vencida sin programación: ${o.codigo} tenía fecha límite ${o.fechaLimite} y sigue sin fecha de programación.`,
          otCode: o.codigo
        });
      }

      // PTW without supervisor/responsible
      const requiresPtw = o.requierePermisoTrabajo === true;
      const hasLeader = o.tecnicoAsignado || o.responsable || o.supervisor;
      if (requiresPtw && !hasLeader && !isClosed) {
        list.push({
          id: `ptw-no-leader-${o.codigo}`,
          type: 'ptw_no_leader',
          severity: 'medium',
          message: `Falta Responsable PTW: La OT ${o.codigo} requiere Permiso de Trabajo pero no se ha definido el ejecutor responsable.`,
          otCode: o.codigo
        });
      }
    });

    return list;
  };

  const conflicts = detectConflicts();

  // Mocksuggestions panel
  const getAIOptions = () => {
    const options: {
      id: string;
      title: string;
      description: string;
      actionText: string;
      badge: string;
      impact: string;
    }[] = [];

    // Let's generate suggestions based on active conflicts or loads
    const overloadedTechs = technicians.filter(t => getTechLoadDetail(t.name).status === 'Sobrecargado');
    const availableTechs = technicians.filter(t => getTechLoadDetail(t.name).status === 'Disponible' || getTechLoadDetail(t.name).status === 'Normal');

    if (overloadedTechs.length > 0 && availableTechs.length > 0) {
      options.push({
        id: 'sug-reassign',
        title: `Balancear Carga Terreno`,
        description: `El técnico ${overloadedTechs[0].name} se encuentra sobrecargado. Se recomienda reasignar 1 OT no crítica a ${availableTechs[0].name}, quien tiene disponibilidad el día de hoy.`,
        actionText: 'Equilibrar Carga O&M',
        badge: 'IA SUGERIDA',
        impact: 'Reduce riesgo de fatiga y atraso'
      });
    } else {
      options.push({
        id: 'sug-reassign-default',
        title: `Optimización Horaria de Asignaciones`,
        description: `Reasignar actividades preventivas de baja prioridad a técnicos en estado Disponible para evitar sobrecargas inesperadas en incidentes correctivos.`,
        actionText: 'Verificar Disponibles',
        badge: 'OPTIMIZACIÓN',
        impact: 'Resguarda capacidad para emergencias'
      });
    }

    // If there is any overdue unscheduled
    const overdueUnscheduled = conflicts.find(c => c.type === 'overdue_unscheduled');
    if (overdueUnscheduled) {
      options.push({
        id: 'sug-overdue',
        title: `Planificación de OT Vencida`,
        description: `Programar de inmediato la OT ${overdueUnscheduled.otCode} en el primer bloque horario de mañana para evitar multas comerciales del cliente (SLA).`,
        actionText: 'Agendar Prioridad',
        badge: 'SLA ALERTA',
        impact: 'Protección contractual del parque'
      });
    }

    // General geographical clustering
    options.push({
      id: 'sug-cluster',
      title: `Optimización Logística por Parque`,
      description: `Agrupar las mantenciones de inversores de la Planta Cantillana en la misma jornada para la Cuadrilla Cantillana. Esto ahorra 2.5 horas de traslados y optimiza el uso del vehículo Foton Prime.`,
      actionText: 'Agrupar OTs',
      badge: 'Ruta Verde',
      impact: 'Ahorro de combustible y HH en ruta'
    });

    return options;
  };

  const aiSuggestions = getAIOptions();

  // Route of the day for selected technician
  const getRouteOfTheDay = (techName: string) => {
    const techOts = ots.filter(o => 
      (o.tecnicoAsignado || o.responsable || '').toLowerCase() === techName.toLowerCase() &&
      (o.fechaProgramada || o.fechaInicio) === targetDate
    );

    // Sort chronologically by start hour
    return [...techOts].sort((a, b) => {
      const timeA = a.horaInicioEstimada || '08:30';
      const timeB = b.horaInicioEstimada || '08:30';
      return timeA.localeCompare(timeB);
    });
  };

  const routeOts = getRouteOfTheDay(selectedTechForRoute);

  // Styling helper for load badge
  const getLoadBadgeColor = (status: 'Disponible' | 'Normal' | 'Alta carga' | 'Sobrecargado') => {
    switch (status) {
      case 'Disponible':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      case 'Normal':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Alta carga':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Sobrecargado':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION CARD PANEL */}
      <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="h-4 w-4 text-sky-400" />
          <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
            ORBI Scheduler IA 7A — Stable Planning Candidate
          </span>
        </div>
        <h3 className="text-base font-black text-white">Planificador de Recursos Operativos O&M</h3>
        <p className="text-xs text-slate-400 mt-1">
          Supervise la carga laboral del personal técnico de terreno, gestione cuadrillas de mantenimiento, 
          detecte conflictos de planificación temporal y reciba sugerencias logísticas inteligentes.
        </p>
      </div>

      {/* TABS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT TWO COLUMNS: TECH OVERVIEW & SQUADS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STAFF INDIVIDUAL OVERVIEW */}
          <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="text-xs font-mono text-slate-200 uppercase font-black tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-sky-400" />
                <span>Estado y Carga de Trabajo de Técnicos</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">Total: {technicians.length} técnicos</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {technicians.map(t => {
                const wl = getTechLoadDetail(t.name);
                return (
                  <div 
                    key={t.id} 
                    className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-slate-800 transition-colors flex flex-col justify-between space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-xs font-bold text-white flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {t.name}
                        </h5>
                        <span className="text-[9px] font-mono text-slate-500">{t.role} • {t.zona || 'Centro'}</span>
                      </div>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-black ${getLoadBadgeColor(wl.status)}`}>
                        {wl.status}
                      </span>
                    </div>

                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-900/60 space-y-1.5 text-[10px] font-mono text-slate-400">
                      <div className="flex justify-between">
                        <span>Parque del Día:</span>
                        <span className="text-slate-200 font-bold">{wl.mainPark}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-900/40 pt-1">
                        <span>Horas Hoy:</span>
                        <span className="text-white font-bold">{wl.todayHours} hrs ({wl.todayCount} OT)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Horas Semana:</span>
                        <span className="text-white font-bold">{wl.weekHours} hrs ({wl.weekCount} OT)</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900/40">
                      <div>
                        <span className="text-slate-500 block uppercase text-[8px]">Próxima actividad:</span>
                        <span className="text-sky-400 truncate block font-bold">{wl.nextActivity}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-slate-500 block uppercase text-[8px]">Último hito completado:</span>
                        <span className="text-emerald-400 truncate block font-bold">{wl.lastCompleted}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SQUADS / CREW VIEW */}
          <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h4 className="text-xs font-mono text-slate-200 uppercase font-black tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>Vista de Cuadrillas de Mantenimiento</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {squads.map(s => {
                const det = getSquadLoadDetail(s);
                return (
                  <div key={s.id} className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-xs font-bold text-white font-mono">{s.name}</h5>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          <span>{s.assignedPark}</span>
                        </div>
                      </div>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-black ${getLoadBadgeColor(det.status)}`}>
                        {det.status}
                      </span>
                    </div>

                    {/* Members List */}
                    <div className="text-[10px] font-mono space-y-1 text-slate-300">
                      <span className="text-[8px] uppercase text-slate-500">Integrantes de Cuadrilla:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(s?.members || []).map(m => (
                          <span key={m} className="bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded text-[9px]">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-slate-900/60 pt-2 text-slate-400">
                      <div>
                        <span>OTs del Día:</span>
                        <span className="text-white block font-bold">{det.todayCount} OT</span>
                      </div>
                      <div>
                        <span>HH Estimadas:</span>
                        <span className="text-white block font-bold">{det.todayHours} hrs</span>
                      </div>
                      <div className="col-span-2 mt-1 flex justify-between border-t border-slate-950 pt-1.5">
                        <span>Riesgo Sobrecarga:</span>
                        <span className={`font-bold ${
                          det.overloadRisk === 'Riesgo Alto' 
                            ? 'text-rose-400 animate-pulse' 
                            : det.overloadRisk === 'Riesgo Medio' 
                              ? 'text-amber-400' 
                              : 'text-emerald-400'
                        }`}>
                          {det.overloadRisk}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CONFLICT DETECTOR & SUGGESTIONS */}
        <div className="space-y-6">
          
          {/* CONFLICT DETECTOR ALERTS */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="text-xs font-mono text-slate-200 uppercase font-black tracking-wider flex items-center gap-1.5">
                <AlertOctagon className="h-4 w-4 text-rose-500" />
                <span>Detector de Conflictos</span>
              </h4>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                conflicts.length > 0 ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'bg-slate-950 text-slate-500'
              }`}>
                {conflicts.length} alertas
              </span>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
              {conflicts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 space-y-2">
                  <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-[11px] font-mono text-emerald-400">Cero conflictos operacionales en la agenda.</p>
                </div>
              ) : (
                conflicts.map(c => (
                  <div 
                    key={c.id} 
                    className={`p-3 rounded-lg border text-xs leading-normal flex items-start gap-2 ${
                      c.severity === 'high' 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
                        {c.type.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="font-sans text-[11px] font-medium leading-normal">{c.message}</p>
                      {c.otCode && onOpenOt && (
                        <button 
                          onClick={() => {
                            const found = ots.find(o => o.codigo === c.otCode);
                            if (found) onOpenOt(found);
                          }}
                          className="text-[9px] font-mono hover:underline text-sky-400 font-bold block mt-1 uppercase"
                        >
                          → Resolver en OT Center
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI SUGGESTIONS PANEL */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h4 className="text-xs font-mono text-slate-200 uppercase font-black tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-sky-400" />
                <span>Sugerencias ORBI AI (O&M Planner)</span>
              </h4>
            </div>

            <div className="space-y-3">
              {aiSuggestions.map(s => (
                <div key={s.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-mono font-bold bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/30 uppercase">
                      {s.badge}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">Impacto Positivo</span>
                  </div>
                  <h5 className="text-[11px] font-black text-white font-mono">{s.title}</h5>
                  <p className="text-[10px] text-slate-400 leading-normal font-sans">{s.description}</p>
                  
                  <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                    <span className="text-[9px] font-mono text-emerald-400 italic font-bold">{s.impact}</span>
                    <button 
                      onClick={() => alert(`Simulación ORBI AI: Recomendación '${s.title}' ha sido enviada como propuesta al coordinador.`)}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black font-mono text-[8px] px-2 py-1 rounded transition-colors uppercase tracking-wider"
                    >
                      {s.actionText}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* TIMELINE VIEW: ROUTE OF THE DAY */}
      <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-400" />
            <h4 className="text-xs font-mono text-slate-200 uppercase font-black tracking-wider">
              Ruta Operativa del Día ({targetDate})
            </h4>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Seleccionar Técnico:</span>
            <select
              value={selectedTechForRoute}
              onChange={(e) => setSelectedTechForRoute(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 rounded px-2.5 py-1 outline-none"
            >
              {technicians.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline body */}
        <div className="space-y-4 relative before:absolute before:left-3 md:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {routeOts.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-mono pl-6 md:pl-8 text-left">
              El técnico {selectedTechForRoute} no tiene OTs agendadas para el {targetDate}.
            </div>
          ) : (
            routeOts.map((o, index) => (
              <div key={o.codigo} className="flex gap-4 items-start relative pl-8 md:pl-10">
                
                {/* Timeline circle dot */}
                <div className="absolute left-1 md:left-2.5 top-1.5 w-4 h-4 rounded-full border-2 border-slate-950 bg-sky-500 flex items-center justify-center z-10">
                  <span className="text-[8px] font-bold text-slate-950">{index + 1}</span>
                </div>

                {/* Card Container */}
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-850 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-400">{o.codigo}</span>
                      <span className="text-[9px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded">
                        {o.horaInicioEstimada || '08:30'} ({o.hhEstimadas || 8} hrs)
                      </span>
                      <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase">
                        {o.tipo}
                      </span>
                    </div>

                    <h5 className="text-sm font-black text-white flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span>{o.plantaNombre} — {o.activo}</span>
                    </h5>

                    <p className="text-xs text-slate-400 leading-normal">{o.observaciones}</p>

                    {/* Badge integration with Vault/PTW */}
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {o.requierePermisoTrabajo && (
                        <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          ⚠️ Requiere PTW
                        </span>
                      )}
                      {(!o.evidencePack || o.evidencePack.length === 0) ? (
                        <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          📷 Evidencia pendiente
                        </span>
                      ) : (
                        <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          📷 Evidencias cargadas
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-900 gap-3">
                    <div className="text-right">
                      <span className="text-[8px] font-mono text-slate-500 block uppercase">Estado OT:</span>
                      <span className="text-xs text-slate-300 font-mono font-bold mt-0.5 block">{o.estado}</span>
                    </div>
                    {onOpenOt && (
                      <button
                        onClick={() => onOpenOt(o)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-mono text-[9px] px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors flex items-center gap-1"
                      >
                        <span>Ver Ficha</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
