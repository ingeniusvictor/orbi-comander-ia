import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  User, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Layers, 
  Settings, 
  PlusCircle, 
  Wrench, 
  ShieldAlert, 
  FileText, 
  Database, 
  Inbox, 
  Briefcase, 
  TrendingUp, 
  Check, 
  X,
  Plus
} from 'lucide-react';
import { OT, Planta, OrganigramaNode } from '../types';
import ResourcePlanner from './ResourcePlanner';

interface SchedulerIAProps {
  ots: OT[];
  plantas: Planta[];
  organigrama: OrganigramaNode[];
  onUpdateOts: (updated: OT[]) => void;
  userRole: string;
  activeUserName: string;
  onOpenOt?: (ot: OT) => void;
}

export default function SchedulerIA({
  ots,
  plantas,
  organigrama,
  onUpdateOts,
  userRole,
  activeUserName,
  onOpenOt
}: SchedulerIAProps) {
  // Check if technician role
  const isTechnician = ['TECNICO_OM', 'INGENIERO_OM'].includes(userRole);

  // States
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-08'); // Selected active day (Wednesday, July 8, 2026)
  const [activeViewMode, setActiveViewMode] = useState<'month' | 'week' | 'day' | 'list' | 'planner'>('month');
  
  // Filters (for Supervisor)
  const [filterPlanta, setFilterPlanta] = useState<string>('Todos');
  const [filterTecnico, setFilterTecnico] = useState<string>('Todos');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [filterTipo, setFilterTipo] = useState<string>('Todos');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('Todos');

  // Selected OT for detail sidebar
  const [selectedOtCode, setSelectedOtCode] = useState<string | null>(null);

  // Unscheduled scheduling modal/popup states
  const [schedulingOt, setSchedulingOt] = useState<OT | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('2026-07-08');
  const [scheduleTech, setScheduleTech] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('08:30');
  const [scheduleDuration, setScheduleDuration] = useState<number>(8);

  // Active OT selected in details
  const selectedOt = ots.find(o => o.codigo === selectedOtCode) || null;

  // Active technician OTs filter
  const getTechnicianOts = () => {
    return ots.filter(o => {
      const techName = o.tecnicoAsignado || o.responsable || '';
      return techName.toLowerCase() === activeUserName.toLowerCase();
    });
  };

  // Filtered OTs for Supervisor view
  const getFilteredOts = () => {
    return ots.filter(o => {
      // Exclude OTs with no date if in calendar mode (month/week/day) unless in list view
      const date = o.fechaProgramada || o.fechaInicio || '';
      if (!date && activeViewMode !== 'list') return false;

      const matchesPlanta = filterPlanta === 'Todos' || o.plantaNombre === filterPlanta;
      const matchesTecnico = filterTecnico === 'Todos' || 
        (o.tecnicoAsignado || o.responsable || '').toLowerCase() === filterTecnico.toLowerCase();
      const matchesEstado = filterEstado === 'Todos' || o.estado === filterEstado;
      const matchesTipo = filterTipo === 'Todos' || o.tipo === filterTipo;
      const matchesPrioridad = filterPrioridad === 'Todos' || o.prioridad === filterPrioridad;

      return matchesPlanta && matchesTecnico && matchesEstado && matchesTipo && matchesPrioridad;
    });
  };

  // Group of technicians from organigrama
  const technicianList = organigrama.filter(
    n => n.role === 'TECNICO_OM' || n.role === 'INGENIERO_OM'
  );

  // Resource planners calculations
  const getTechWorkload = (techName: string) => {
    const techOts = ots.filter(o => 
      (o.tecnicoAsignado || o.responsable || '').toLowerCase() === techName.toLowerCase()
    );
    
    // Scheduled today (2026-07-08)
    const todayOts = techOts.filter(o => (o.fechaProgramada || o.fechaInicio) === '2026-07-08');
    
    // Scheduled this week (July 5 - July 11, 2026)
    const weekOts = techOts.filter(o => {
      const date = o.fechaProgramada || o.fechaInicio || '';
      return date >= '2026-07-05' && date <= '2026-07-11';
    });

    const todayHours = todayOts.reduce((sum, o) => sum + (o.hhEstimadas || 8), 0);
    const weekHours = weekOts.reduce((sum, o) => sum + (o.hhEstimadas || 8), 0);

    let loadStatus: 'Disponible' | 'Normal' | 'Alta carga' | 'Sobrecargado' = 'Disponible';
    if (todayHours > 12 || weekHours > 45) {
      loadStatus = 'Sobrecargado';
    } else if (todayHours > 8 || weekHours > 35) {
      loadStatus = 'Alta carga';
    } else if (todayHours > 0 || weekHours > 0) {
      loadStatus = 'Normal';
    }

    return {
      name: techName,
      todayCount: todayOts.length,
      weekCount: weekOts.length,
      todayHours,
      weekHours,
      loadStatus
    };
  };

  // KPIs calculations (global or for supervisor)
  const totalScheduledToday = ots.filter(o => (o.fechaProgramada || o.fechaInicio) === '2026-07-08').length;
  const totalScheduledWeek = ots.filter(o => {
    const date = o.fechaProgramada || o.fechaInicio || '';
    return date >= '2026-07-05' && date <= '2026-07-11';
  }).length;
  const totalUnscheduled = ots.filter(o => !o.fechaProgramada && !o.fechaInicio).length;
  const totalOverdue = ots.filter(o => {
    const date = o.fechaLimite || '';
    const isClosed = ['Cerrada', 'Finalizada'].includes(o.estado);
    return date < '2026-07-08' && !isClosed;
  }).length;
  const totalInProgress = ots.filter(o => ['En proceso', 'En ejecución', 'En terreno'].includes(o.estado)).length;
  const totalFieldWorkComplete = ots.filter(o => ['Lista para revisión', 'Ejecutada'].includes(o.estado)).length;

  const techsWithHighLoad = technicianList.filter(t => {
    const load = getTechWorkload(t.name);
    return load.loadStatus === 'Sobrecargado' || load.loadStatus === 'Alta carga';
  }).length;

  // Unscheduled OTs list
  const unscheduledOts = ots.filter(o => !o.fechaProgramada && o.estado === 'Nueva');

  // Perform schedule save
  const handleSaveSchedule = () => {
    if (!schedulingOt) return;

    const updatedOts = ots.map(o => {
      if (o.codigo === schedulingOt.codigo) {
        return {
          ...o,
          fechaProgramada: scheduleDate,
          fechaInicio: scheduleDate,
          tecnicoAsignado: scheduleTech || o.tecnicoAsignado || o.responsable,
          responsable: scheduleTech || o.tecnicoAsignado || o.responsable,
          horaInicioEstimada: scheduleTime,
          ventanaTrabajo: 'Diurna (08:00 - 18:00)',
          hhEstimadas: scheduleDuration,
          estado: 'Programada' as const
        };
      }
      return o;
    });

    onUpdateOts(updatedOts);
    setSchedulingOt(null);
  };

  // Technician Agenda subsets
  const techOts = getTechnicianOts();
  const techOtsToday = techOts.filter(o => (o.fechaProgramada || o.fechaInicio) === '2026-07-08');
  const techOtsWeek = techOts.filter(o => {
    const d = o.fechaProgramada || o.fechaInicio || '';
    return d >= '2026-07-05' && d <= '2026-07-11' && d !== '2026-07-08';
  });
  const techOtsPendingCorrection = techOts.filter(o => 
    ['Devuelta a ejecución', 'Reabierta', 'Rechazada'].includes(o.estado)
  );

  // Helper colors for statuses
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Programada':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'En proceso':
      case 'En ejecución':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Lista para revisión':
      case 'Ejecutada':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Cerrada':
      case 'Completada':
      case 'Finalizada':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Devuelta a ejecución':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Nueva':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  // Helper priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Crítica':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case 'Alta':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'Media':
        return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
  };

  // Month Calendar Day generation (July 2026)
  const renderMonthGrid = () => {
    // July 2026 starts on Wednesday (day 3 of the week, if 0 is Sunday, or 3 if Wednesday)
    // Month has 31 days. We can fill leading empty cells
    const leadingEmptyDays = 3; // Sun, Mon, Tue are empty in the first row
    const daysInMonth = 31;
    const cells = [];

    // Pre-calculated filtered OTs for speed
    const filteredOts = getFilteredOts();

    // Fill empty cells
    for (let i = 0; i < leadingEmptyDays; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[100px] bg-slate-950/20 border border-slate-900/60 text-slate-700 p-2"></div>);
    }

    // Fill days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const fullDateStr = `2026-07-${dayStr}`;
      const isToday = fullDateStr === '2026-07-08';

      // Find OTs on this day
      const dayOts = filteredOts.filter(o => (o.fechaProgramada || o.fechaInicio) === fullDateStr);

      cells.push(
        <div 
          key={fullDateStr} 
          onClick={() => setSelectedDate(fullDateStr)}
          className={`min-h-[110px] bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer p-2 flex flex-col justify-between group ${
            isToday ? 'ring-1 ring-emerald-500 bg-emerald-500/5' : ''
          } ${selectedDate === fullDateStr ? 'bg-slate-900 border-slate-600' : ''}`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
              isToday ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 group-hover:text-white'
            }`}>
              {day}
            </span>
            {dayOts.length > 0 && (
              <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-300 px-1 rounded">
                {dayOts.length} OT
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 max-h-[70px] custom-scrollbar">
            {dayOts.map(o => (
              <div 
                key={o.codigo}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOtCode(o.codigo);
                }}
                className={`text-[9px] truncate px-1 py-0.5 rounded border leading-none font-mono flex items-center justify-between ${
                  o.prioridad === 'Crítica' 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                    : o.estado === 'Cerrada' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="truncate flex-1 font-bold">{o.codigo} - {o.plantaNombre}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  // Week View Days renderer (July 5, 2026 to July 11, 2026)
  const renderWeekColumns = () => {
    const days = [
      { name: 'Domingo', date: '2026-07-05' },
      { name: 'Lunes', date: '2026-07-06' },
      { name: 'Martes', date: '2026-07-07' },
      { name: 'Miércoles', date: '2026-07-08' },
      { name: 'Jueves', date: '2026-07-09' },
      { name: 'Viernes', date: '2026-07-10' },
      { name: 'Sábado', date: '2026-07-11' },
    ];

    const filteredOts = getFilteredOts();

    return days.map(d => {
      const dayOts = filteredOts.filter(o => (o.fechaProgramada || o.fechaInicio) === d.date);
      const isToday = d.date === '2026-07-08';

      return (
        <div 
          key={d.date} 
          className={`flex-1 min-h-[350px] bg-slate-900/20 border border-slate-850 rounded-xl p-3 flex flex-col ${
            isToday ? 'bg-emerald-950/5 border-emerald-500/20' : ''
          }`}
        >
          <div className="border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-mono tracking-widest text-slate-400 uppercase leading-none">{d.name}</h4>
              <span className={`text-xs font-mono font-bold block mt-1 ${isToday ? 'text-emerald-400 font-black' : 'text-slate-300'}`}>
                {d.date.split('-')[2]} Jul
              </span>
            </div>
            {dayOts.length > 0 && (
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full">
                {dayOts.length}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
            {dayOts.length === 0 ? (
              <div className="h-24 flex items-center justify-center border border-dashed border-slate-850/60 rounded-xl text-[10px] text-slate-500">
                Sin OTs
              </div>
            ) : (
              dayOts.map(o => (
                <div
                  key={o.codigo}
                  onClick={() => setSelectedOtCode(o.codigo)}
                  className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-2.5 rounded-lg cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-slate-200">{o.codigo}</span>
                    <span className={`text-[8px] font-mono px-1 py-0.5 rounded leading-none ${getPriorityBadge(o.prioridad)}`}>
                      {o.prioridad}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white truncate leading-normal">{o.plantaNombre}</p>
                    <p className="text-[9px] text-slate-400 font-mono truncate">{o.activo}</p>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/40 text-[9px] font-mono text-slate-500">
                    <span className="truncate max-w-[80px]">{o.tecnicoAsignado || o.responsable || 'Sin asign.'}</span>
                    <span className={`px-1 rounded-full text-[8px] ${getStatusBadge(o.estado)}`}>
                      {o.estado}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/10 text-sky-400 text-[10px] font-mono px-2 py-0.5 rounded border border-sky-500/20 font-bold uppercase tracking-wider">
              Módulo 7A — O&M Scheduler IA
            </span>
            <span className="text-xs text-slate-500 font-mono">v0.X</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-1">
            {isTechnician ? 'Mi Agenda de Trabajo Técnica' : 'Calendario y Programación O&M'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isTechnician 
              ? 'Organizador personalizado con tus OTs asignadas, horas estimadas y pautas de mantenimiento.' 
              : 'Asignación inteligente, carga de personal técnico y conciliación temporal de actividades.'}
          </p>
        </div>

        {/* Navigation tabs for View Modes */}
        {!isTechnician && (
          <div className="flex flex-wrap items-center bg-slate-900 border border-slate-800 p-1 rounded-xl font-mono text-[10px] font-bold gap-1">
            <button
              onClick={() => setActiveViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeViewMode === 'month' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mes (Julio 2026)
            </button>
            <button
              onClick={() => setActiveViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeViewMode === 'week' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setActiveViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeViewMode === 'day' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hoy (8 Jul)
            </button>
            <button
              onClick={() => setActiveViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeViewMode === 'list' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lista Global
            </button>
            <button
              onClick={() => setActiveViewMode('planner')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                activeViewMode === 'planner' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>💼 Resource Planner</span>
              <span className="bg-slate-950 text-emerald-400 text-[8px] px-1 rounded-full border border-emerald-500/10">LIVIANO</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SUPERVISOR VIEW */}
      {/* ========================================================= */}
      {!isTechnician && (
        <div className="space-y-6">
          
          {/* SUPERVISOR KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">Hoy (8 Jul)</span>
              <span className="text-xl font-black text-white font-mono mt-1">{totalScheduledToday} <span className="text-xs font-normal text-slate-400">OTs</span></span>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">Semana Actual</span>
              <span className="text-xl font-black text-sky-400 font-mono mt-1">{totalScheduledWeek} <span className="text-xs font-normal text-slate-400">OTs</span></span>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">Sin Programar</span>
              <span className="text-xl font-black text-amber-400 font-mono mt-1">{totalUnscheduled} <span className="text-xs font-normal text-slate-400">OTs</span></span>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">En Ejecución</span>
              <span className="text-xl font-black text-amber-500 font-mono mt-1">{totalInProgress} <span className="text-xs font-normal text-slate-400">OTs</span></span>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">Work Complete</span>
              <span className="text-xl font-black text-purple-400 font-mono mt-1">{totalFieldWorkComplete} <span className="text-xs font-normal text-slate-400">OTs</span></span>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">Vencidas</span>
              <span className={`text-xl font-black font-mono mt-1 ${totalOverdue > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>{totalOverdue}</span>
            </div>
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">Alta Carga Tech</span>
              <span className="text-xl font-black text-slate-100 font-mono mt-1">{techsWithHighLoad} <span className="text-xs font-normal text-slate-400">pers</span></span>
            </div>
          </div>

          {/* GLOBAL FILTERS BAR */}
          <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
                <Filter className="h-3.5 w-3.5 text-sky-400" />
                <span>Panel de Filtros Avanzado</span>
              </div>
              {(filterPlanta !== 'Todos' || filterTecnico !== 'Todos' || filterEstado !== 'Todos' || filterTipo !== 'Todos' || filterPrioridad !== 'Todos') && (
                <button 
                  onClick={() => {
                    setFilterPlanta('Todos');
                    setFilterTecnico('Todos');
                    setFilterEstado('Todos');
                    setFilterTipo('Todos');
                    setFilterPrioridad('Todos');
                  }}
                  className="text-[10px] font-mono text-sky-400 hover:underline"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-500 block uppercase">Parque / Planta</label>
                <select
                  value={filterPlanta}
                  onChange={(e) => setFilterPlanta(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs outline-none"
                >
                  <option value="Todos">-- Todos --</option>
                  {plantas.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-500 block uppercase">Técnico de Campo</label>
                <select
                  value={filterTecnico}
                  onChange={(e) => setFilterTecnico(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs outline-none"
                >
                  <option value="Todos">-- Todos --</option>
                  {technicianList.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-500 block uppercase">Estado OT</label>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs outline-none"
                >
                  <option value="Todos">-- Todos --</option>
                  <option value="Nueva">Nueva</option>
                  <option value="Programada">Programada</option>
                  <option value="En proceso">En proceso</option>
                  <option value="En ejecución">En ejecución</option>
                  <option value="Lista para revisión">Lista para revisión</option>
                  <option value="Cerrada">Cerrada</option>
                  <option value="Devuelta a ejecución">Devuelta a ejecución</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-500 block uppercase">Tipo Mantenimiento</label>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs outline-none"
                >
                  <option value="Todos">-- Todos --</option>
                  <option value="Preventiva">Preventiva</option>
                  <option value="Correctiva">Correctiva</option>
                  <option value="Emergencia">Emergencia</option>
                  <option value="HSE">HSE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-500 block uppercase">Prioridad</label>
                <select
                  value={filterPrioridad}
                  onChange={(e) => setFilterPrioridad(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs outline-none"
                >
                  <option value="Todos">-- Todos --</option>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>
              </div>
            </div>
          </div>

          {/* MAIN CALENDAR AND WORKLOAD PLANNER CONTAINER */}
          {activeViewMode === 'planner' ? (
            <ResourcePlanner
              ots={ots}
              plantas={plantas}
              organigrama={organigrama}
              onUpdateOts={onUpdateOts}
              onOpenOt={onOpenOt}
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              
              {/* LEFT / CENTER COLUMN: CALENDAR OR LIST VIEW */}
              <div className="xl:col-span-3 space-y-6">
              
              {/* MONTH GRID */}
              {activeViewMode === 'month' && (
                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black text-white font-mono uppercase tracking-tight flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4 text-sky-400" />
                      <span>Calendario Mensual — Julio 2026</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Seleccionado: <strong className="text-sky-400 font-mono">{selectedDate}</strong></span>
                    </div>
                  </div>

                  {/* Day of the Week Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1 bg-slate-950/60 py-2 rounded-lg">
                    <div>Domingo</div>
                    <div>Lunes</div>
                    <div>Martes</div>
                    <div>Miércoles</div>
                    <div>Jueves</div>
                    <div>Viernes</div>
                    <div>Sábado</div>
                  </div>

                  {/* Grid cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {renderMonthGrid()}
                  </div>
                </div>
              )}

              {/* WEEK COLUMN VIEW */}
              {activeViewMode === 'week' && (
                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-white font-mono uppercase tracking-tight flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4 text-sky-400" />
                      <span>Calendario Semanal (Semana 28)</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">Rango: 05 Jul — 11 Jul 2026</span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2">
                    {renderWeekColumns()}
                  </div>
                </div>
              )}

              {/* DAY TIMELINE VIEW */}
              {activeViewMode === 'day' && (
                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-black text-white font-mono uppercase tracking-tight flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-sky-400" />
                      <span>Planificación Diaria: {selectedDate}</span>
                    </h3>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          const parts = selectedDate.split('-');
                          const d = parseInt(parts[2]) - 1;
                          if (d >= 1) {
                            setSelectedDate(`2026-07-${d < 10 ? '0' + d : d}`);
                          }
                        }}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          const parts = selectedDate.split('-');
                          const d = parseInt(parts[2]) + 1;
                          if (d <= 31) {
                            setSelectedDate(`2026-07-${d < 10 ? '0' + d : d}`);
                          }
                        }}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Day specific schedule list */}
                  <div className="space-y-3">
                    {getFilteredOts().filter(o => (o.fechaProgramada || o.fechaInicio) === selectedDate).length === 0 ? (
                      <div className="h-36 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 space-y-2">
                        <Inbox className="h-8 w-8 text-slate-600" />
                        <span className="text-xs font-mono">No hay Órdenes de Trabajo programadas para este día</span>
                      </div>
                    ) : (
                      getFilteredOts()
                        .filter(o => (o.fechaProgramada || o.fechaInicio) === selectedDate)
                        .map(o => (
                          <div 
                            key={o.codigo}
                            onClick={() => setSelectedOtCode(o.codigo)}
                            className="bg-slate-950/80 border border-slate-900 hover:border-slate-850 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-sky-400">{o.codigo}</span>
                                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-black ${getPriorityBadge(o.prioridad)}`}>
                                  {o.prioridad}
                                </span>
                                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full ${getStatusBadge(o.estado)}`}>
                                  {o.estado}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-white">{o.plantaNombre} — {o.activo}</h4>
                              <p className="text-xs text-slate-400 leading-normal">{o.observaciones}</p>
                            </div>

                            <div className="flex flex-row md:flex-col items-start md:items-end gap-2 text-xs font-mono border-t md:border-t-0 border-slate-900 w-full md:w-auto pt-2 md:pt-0">
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <User className="h-3.5 w-3.5 text-slate-500" />
                                <span>{o.tecnicoAsignado || o.responsable || 'Sin asignar'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Clock className="h-3.5 w-3.5 text-slate-500" />
                                <span>{o.horaInicioEstimada || '08:30'} ({o.hhEstimadas || 8}h estimadas)</span>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* LIST VIEW */}
              {activeViewMode === 'list' && (
                <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-black text-white font-mono uppercase tracking-tight flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-sky-400" />
                      <span>Catálogo Completo de Actividades en el Calendario</span>
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 font-mono text-[10px] text-slate-400 font-bold uppercase">
                          <th className="py-2.5 px-3">Código</th>
                          <th className="py-2.5 px-3">Parque / Planta</th>
                          <th className="py-2.5 px-3">Activo</th>
                          <th className="py-2.5 px-3">Fecha Prog.</th>
                          <th className="py-2.5 px-3">Responsable</th>
                          <th className="py-2.5 px-3 text-center">Prioridad</th>
                          <th className="py-2.5 px-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {getFilteredOts().map(o => (
                          <tr 
                            key={o.codigo}
                            onClick={() => setSelectedOtCode(o.codigo)}
                            className="hover:bg-slate-900/40 cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-sky-400">{o.codigo}</td>
                            <td className="py-2.5 px-3 text-white font-bold">{o.plantaNombre}</td>
                            <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{o.activo}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">{o.fechaProgramada || o.fechaInicio || 'No prog.'}</td>
                            <td className="py-2.5 px-3 text-slate-300">{o.tecnicoAsignado || o.responsable || 'Sin asignar'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full ${getPriorityBadge(o.prioridad)}`}>
                                {o.prioridad}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full ${getStatusBadge(o.estado)}`}>
                                {o.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* RESOURCE PLANNER SUMMARY */}
              <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-black text-white font-mono uppercase tracking-tight">
                    Planificador de Carga de Recursos (Personal Técnico de Terreno)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {technicianList.map(t => {
                    const wl = getTechWorkload(t.name);
                    const colorMap = {
                      'Disponible': 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
                      'Normal': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                      'Alta carga': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                      'Sobrecargado': 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse',
                    };

                    return (
                      <div key={t.id} className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col justify-between space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-white leading-normal">{t.name}</h4>
                            <span className="text-[9px] font-mono text-slate-500 leading-none">{t.email}</span>
                          </div>
                          <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-black ${colorMap[wl.loadStatus]}`}>
                            {wl.loadStatus}
                          </span>
                        </div>

                        <div className="space-y-1 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-900/60">
                          <div className="flex justify-between">
                            <span>Asignaciones Hoy:</span>
                            <span className="text-white font-bold">{wl.todayCount} OT ({wl.todayHours} hrs)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Asignaciones Semana:</span>
                            <span className="text-white font-bold">{wl.weekCount} OT ({wl.weekHours} hrs)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: DETAIL PANEL / UNSCHEDULED WORK ORDERS */}
            <div className="space-y-6">
              
              {/* SELECTED OT SIDEBAR DETAIL PANEL */}
              {selectedOt ? (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[9px] font-mono text-sky-400 block font-bold uppercase tracking-wider">Ficha de Calendario</span>
                      <h3 className="text-sm font-black text-white font-mono mt-0.5">{selectedOt.codigo}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedOtCode(null)}
                      className="text-slate-400 hover:text-white p-1 rounded bg-slate-950/60 border border-slate-900"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Detail Body */}
                  <div className="space-y-3.5 text-xs">
                    <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-900">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Ubicación y Activo</div>
                      <div className="font-bold text-white">{selectedOt.plantaNombre}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{selectedOt.activo}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-900">
                        <span className="text-[9px] text-slate-500 block">TIPO</span>
                        <span className="text-slate-300 font-bold">{selectedOt.tipo}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-900">
                        <span className="text-[9px] text-slate-500 block">ESTADO</span>
                        <span className="text-slate-300 font-bold truncate block">{selectedOt.estado}</span>
                      </div>
                    </div>

                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-500">Programada:</span>
                        <span className="text-white font-bold">{selectedOt.fechaProgramada || selectedOt.fechaInicio || 'No asignado'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-500">Técnico:</span>
                        <span className="text-white font-bold">{selectedOt.tecnicoAsignado || selectedOt.responsable || 'Sin asign.'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-500">HH Estimadas:</span>
                        <span className="text-white font-bold">{selectedOt.hhEstimadas || 8} hrs</span>
                      </div>
                    </div>

                    {/* Integrated Indicators with existing systems */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Estado de Respaldos e Integridad</div>
                      
                      {/* Evidence check */}
                      <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded border border-slate-900">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className={`h-3.5 w-3.5 ${selectedOt.evidencePack && selectedOt.evidencePack.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`} />
                          <span className="text-[10px] font-mono text-slate-300">Evidencias</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded ${
                          selectedOt.evidencePack && selectedOt.evidencePack.length > 0 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {selectedOt.evidencePack && selectedOt.evidencePack.length > 0 ? 'Cargadas' : 'Pendiente'}
                        </span>
                      </div>

                      {/* Permit PTW check */}
                      <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded border border-slate-900">
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className={`h-3.5 w-3.5 ${selectedOt.requierePermisoTrabajo ? 'text-amber-400' : 'text-slate-600'}`} />
                          <span className="text-[10px] font-mono text-slate-300">Permiso PTW</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded ${
                          selectedOt.requierePermisoTrabajo ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {selectedOt.requierePermisoTrabajo ? 'Requerido' : 'No aplica'}
                        </span>
                      </div>

                      {/* SharePoint Router check */}
                      <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded border border-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Database className={`h-3.5 w-3.5 ${selectedOt.sharepointStatus === 'Respaldado' ? 'text-indigo-400' : 'text-slate-600'}`} />
                          <span className="text-[10px] font-mono text-slate-300">SharePoint Cloud</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded ${
                          selectedOt.sharepointStatus === 'Respaldado' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {selectedOt.sharepointStatus || 'Pendiente'}
                        </span>
                      </div>
                    </div>

                    {/* Open in Main view button */}
                    {onOpenOt && (
                      <button
                        onClick={() => onOpenOt(selectedOt)}
                        className="w-full mt-3 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black font-mono text-[10px] tracking-widest uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/15"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Abrir en OT Center</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/20 border border-slate-850 p-5 rounded-xl text-center text-slate-500 text-xs">
                  <CalendarIcon className="h-7 w-7 text-slate-700 mx-auto mb-2" />
                  <p>Selecciona una OT de la agenda para ver su ficha integrada de operaciones.</p>
                </div>
              )}

              {/* UNSCHEDULED WORK ORDERS INBOX (Supervisor) */}
              <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-4">
                <div className="flex items-center gap-1.5 text-slate-200">
                  <Inbox className="h-4 w-4 text-sky-400" />
                  <h3 className="text-xs font-black font-mono uppercase tracking-tight">
                    Bandeja: OT Sin Programar ({unscheduledOts.length})
                  </h3>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {unscheduledOts.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-4">
                      Todas las OTs en cola han sido planificadas.
                    </p>
                  ) : (
                    unscheduledOts.map(o => (
                      <div 
                        key={o.codigo}
                        className="bg-slate-950 p-3 rounded-lg border border-slate-900 space-y-2 text-xs hover:border-slate-800 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-mono text-amber-500 block leading-none font-bold">SIN PROGRAMAR</span>
                            <span className="font-mono text-[11px] font-bold text-white mt-1 block">{o.codigo}</span>
                          </div>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${getPriorityBadge(o.prioridad)}`}>
                            {o.prioridad}
                          </span>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold text-slate-200">{o.plantaNombre}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{o.activo}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                          <span className="text-[9px] font-mono text-slate-500">HH Sugeridas: {o.hhEstimadas || 8}h</span>
                          <button
                            onClick={() => {
                              setSchedulingOt(o);
                              setScheduleTech(o.tecnicoAsignado || o.responsable || technicianList[0]?.name || '');
                            }}
                            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold font-mono text-[9px] px-2 py-1 rounded transition-colors flex items-center gap-0.5"
                          >
                            <Plus className="h-3 w-3" /> Programar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SCHEDULING IA ASSIGN POPUP MODAL (Supervisor View) */}
      {/* ========================================================= */}
      {schedulingOt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white font-mono uppercase tracking-tight flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 text-sky-400" />
                  <span>Programación de OT: {schedulingOt.codigo}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{schedulingOt.plantaNombre} — {schedulingOt.activo}</p>
              </div>
              <button 
                onClick={() => setSchedulingOt(null)}
                className="text-slate-400 hover:text-white p-1 rounded bg-slate-950/60 border border-slate-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase">Técnico Asignado</label>
                <select
                  value={scheduleTech}
                  onChange={(e) => setScheduleTech(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white outline-none"
                >
                  {technicianList.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase">Fecha Programación</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase">Hora Estimada</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase">Horas Estimadas de Ejecución (Duración)</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={scheduleDuration}
                  onChange={(e) => setScheduleDuration(parseInt(e.target.value) || 8)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white outline-none"
                />
              </div>

              <div className="bg-sky-950/10 border border-sky-500/10 p-3 rounded-lg text-[10px] text-sky-400 font-sans leading-normal">
                💡 Al confirmar, el estado de la OT cambiará automáticamente a <strong>"Programada"</strong> y se actualizarán las agendas y el planificador de carga del técnico.
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setSchedulingOt(null)}
                className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-mono font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-mono font-black uppercase tracking-wider"
              >
                Confirmar Programación
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================= */}
      {/* FIELD TECHNICIAN VIEW / "MI AGENDA TÉCNICA" */}
      {/* ========================================================= */}
      {isTechnician && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TODAY AGENDA (8 JUL) */}
          <div className="bg-slate-900/30 border border-emerald-500/10 p-4 rounded-xl flex flex-col space-y-4">
            <div className="border-b border-slate-800 pb-2.5 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-black font-mono text-white uppercase tracking-wider">Mis OT de Hoy (8 Jul)</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                {techOtsToday.length} activas
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
              {techOtsToday.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-xl text-slate-500 text-center space-y-1">
                  <Check className="h-5 w-5 text-slate-600" />
                  <span className="text-[10px] font-mono">¡No tienes OTs programadas para hoy!</span>
                </div>
              ) : (
                techOtsToday.map(o => (
                  <div 
                    key={o.codigo}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3 relative hover:border-slate-800 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 block font-bold">HOY — {o.horaInicioEstimada || '08:30'}</span>
                        <span className="font-mono text-[11px] text-white font-bold block mt-0.5">{o.codigo}</span>
                      </div>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-black ${getPriorityBadge(o.prioridad)}`}>
                        {o.prioridad}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {o.plantaNombre}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{o.activo}</p>
                      <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{o.observaciones}</p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-900 flex justify-between items-center text-[10px] font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] ${getStatusBadge(o.estado)}`}>
                        {o.estado}
                      </span>
                      {onOpenOt && (
                        <button
                          onClick={() => onOpenOt(o)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-2.5 py-1 rounded transition-colors flex items-center gap-0.5 uppercase tracking-wide text-[9px]"
                        >
                          Abrir OT <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* WEEKLY AGENDA */}
          <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl flex flex-col space-y-4">
            <div className="border-b border-slate-800 pb-2.5 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-sky-400" />
                <h3 className="text-xs font-black font-mono text-white uppercase tracking-wider">Mis OT de la Semana</h3>
              </div>
              <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-bold">
                {techOtsWeek.length} programadas
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
              {techOtsWeek.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-xl text-slate-500 text-center space-y-1">
                  <Check className="h-5 w-5 text-slate-600" />
                  <span className="text-[10px] font-mono">Sin otras OTs esta semana</span>
                </div>
              ) : (
                techOtsWeek.map(o => (
                  <div 
                    key={o.codigo}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3 hover:border-slate-800 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">{o.fechaProgramada || o.fechaInicio || 'Esta semana'}</span>
                        <span className="font-mono text-[11px] text-white font-bold block mt-0.5">{o.codigo}</span>
                      </div>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-black ${getPriorityBadge(o.prioridad)}`}>
                        {o.prioridad}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {o.plantaNombre}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{o.activo}</p>
                      <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{o.observaciones}</p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-900 flex justify-between items-center text-[10px] font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] ${getStatusBadge(o.estado)}`}>
                        {o.estado}
                      </span>
                      {onOpenOt && (
                        <button
                          onClick={() => onOpenOt(o)}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-2.5 py-1 rounded transition-colors text-[9px]"
                        >
                          Ver Detalles
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* REJECTED / NEEDS CORRECTION OTs */}
          <div className="bg-slate-900/30 border border-rose-500/10 p-4 rounded-xl flex flex-col space-y-4">
            <div className="border-b border-slate-800 pb-2.5 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />
                <h3 className="text-xs font-black font-mono text-white uppercase tracking-wider">Pendientes de Corrección</h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                techOtsPendingCorrection.length > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-500'
              }`}>
                {techOtsPendingCorrection.length} urgentes
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
              {techOtsPendingCorrection.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-850 rounded-xl text-slate-500 text-center space-y-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-[10px] font-mono text-emerald-400">¡Excelente! Cero devoluciones activas</span>
                </div>
              ) : (
                techOtsPendingCorrection.map(o => (
                  <div 
                    key={o.codigo}
                    className="bg-slate-950 p-4 rounded-xl border border-rose-500/20 space-y-3 hover:border-rose-500/30 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-rose-400 block font-bold">RECHAZADA / DEVUELTA</span>
                        <span className="font-mono text-[11px] text-white font-bold block mt-0.5">{o.codigo}</span>
                      </div>
                      <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-black animate-pulse">
                        Devolución
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {o.plantaNombre}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{o.activo}</p>
                      
                      {/* Reason of devolution if available */}
                      {o.motivoDevolucion && (
                        <div className="bg-rose-950/20 border border-rose-950 text-[10px] p-2 rounded text-rose-300 font-sans leading-normal mt-1">
                          <strong>Motivo:</strong> {o.motivoDevolucion} <br/>
                          <strong>Comentario:</strong> {o.comentarioDevolucion}
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-900 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-rose-400 font-bold">Corregir pauta</span>
                      {onOpenOt && (
                        <button
                          onClick={() => onOpenOt(o)}
                          className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-black px-2.5 py-1 rounded transition-colors uppercase text-[9px] tracking-wide"
                        >
                          Ir a Pauta <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
