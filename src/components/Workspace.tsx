/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  AlertTriangle,
  Layers,
  MapPin,
  CheckCircle,
  Activity,
  Plus,
  X,
  Check,
  Columns,
  Grid,
  BarChart2,
  Filter,
  User,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Search,
  Users,
  Building2,
  ListFilter,
  Truck,
  Eye,
  CalendarCheck,
  Info,
  Sliders,
  CheckSquare,
  Sparkles,
  Package,
  ExternalLink
} from 'lucide-react';
import { PlanPreventivo, Planta, OT, OTEstado, OTType, OTPrioridad, OrganigramaNode } from '../types';
import {
  WorkspaceViewSelector,
  WorkspaceWeekView,
  WorkspaceDayView,
  WorkspaceDispatchList,
  WorkspaceConflictPanel,
  WorkspaceScheduleModal,
  detectWorkspaceConflicts
} from './WorkspaceViews';

interface WorkspaceProps {
  planificacion: PlanPreventivo[];
  plantas: Planta[];
  ots: OT[];
  onUpdate: (updatedPlan: PlanPreventivo[]) => void;
  onUpdateOts?: (updatedOts: OT[]) => void;
  userRole: string;
  vehiculos?: any[];
  recursos?: any[];
  repuestos?: any[];
  herramientas?: any[];
  escalas?: any[];
  onAddAuditLog?: (
    accion: string,
    modulo: string,
    otCode?: string,
    plantaName?: string,
    comentario?: string,
    criticidad?: OTPrioridad
  ) => void;
  username?: string;
  onNavigate?: (view: string) => void;
}

type WorkspaceView =
  | 'dia'
  | 'semana'
  | 'mes'
  | 'planta'
  | 'zona'
  | 'coordinador'
  | 'supervisor'
  | 'persona'
  | 'kanban'
  | 'gantt'
  | 'preventivos'
  | 'despacho';

export default function Workspace({
  planificacion,
  plantas,
  ots,
  onUpdate,
  onUpdateOts,
  userRole,
  vehiculos = [],
  recursos = [],
  repuestos = [],
  herramientas = [],
  escalas = [],
  onAddAuditLog,
  username = 'Supervisor O&M',
  onNavigate,
}: WorkspaceProps) {
  // Active Workspace View
  const [activeView, setActiveView] = useState<WorkspaceView>('mes');

  // Filters
  const [filterPlanta, setFilterPlanta] = useState<string>('Todas');
  const [filterZona, setFilterZona] = useState<string>('Todas');
  const [filterResponsable, setFilterResponsable] = useState<string>('Todos');
  const [filterSupervisor, setFilterSupervisor] = useState<string>('Todos');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('Todas');
  const [filterTipo, setFilterTipo] = useState<string>('Todos');
  const [filterRequierePTW, setFilterRequierePTW] = useState<string>('Todos');
  const [filterBloqueada, setFilterBloqueada] = useState<string>('Todos');

  // Selected Date for Day and Week view
  const [selectedDay, setSelectedDay] = useState<number>(6); // Default 2026-07-06 (current date in app context)
  const [selectedWeek, setSelectedWeek] = useState<number>(1); // 1 to 4 of July 2026

  // Modal states
  const [selectedOt, setSelectedOt] = useState<OT | null>(null);
  const [editingOt, setEditingOt] = useState<OT | null>(null);
  const [showProfessionalLifecycle, setShowProfessionalLifecycle] = useState<boolean>(false);
  const [lifecycleTab, setLifecycleTab] = useState<number>(0);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);
  const [schedulerDate, setSchedulerDate] = useState<string>('2026-07-06');
  const [schedulerTime, setSchedulerTime] = useState<string>('09:00');
  const [schedulerDuration, setSchedulerDuration] = useState<number>(8);
  const [schedulerVehiculo, setSchedulerVehiculo] = useState<string>('Toyota Hilux V01');
  
  // Enhanced Scheduler parameters for quick assignments
  const [schedulerSupervisor, setSchedulerSupervisor] = useState<string>('Alejandro Rojas');
  const [schedulerResponsable, setSchedulerResponsable] = useState<string>('Cristián Barraza');
  const [schedulerEstado, setSchedulerEstado] = useState<OTEstado>('Programada');
  const [schedulerObservaciones, setSchedulerObservaciones] = useState<string>('');

  const isPlanner = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'COORDINADOR_OM', 'PLANIFICACION', 'GERENCIA'].includes(userRole);

  // Helper: Extract unique supervisors, coordinators, and technicians
  const coordinadoresUnicos = ['Rodolfo Garcés', 'Felipe Soto'];
  const supervisoresUnicos = ['Alejandro Rojas', 'Mauricio Valdés', 'Francisco Jara'];
  const tecnicosUnicos = ['Cristián Barraza', 'Eduardo Carvallo', 'Daniel Godoy', 'Yasmín Castro', 'Beatriz Loyola', 'Héctor Mellado'];

  // Helper to save to DB_WORKSPACE key in localStorage
  const saveToDbWorkspace = (updatedOts: OT[]) => {
    if (typeof window === 'undefined') return;
    const activities = updatedOts.map(o => ({
      codigo: o.codigo,
      fechaInicio: o.fechaInicio || '',
      responsable: o.responsable,
      supervisor: o.supervisor,
      estado: o.estado,
      hhEstimadas: o.hhEstimadas,
      hhReales: o.hhReales,
      vehiculo: 'Toyota Hilux V01',
      observaciones: o.observaciones
    }));
    localStorage.setItem('DB_WORKSPACE', JSON.stringify(activities));
  };

  // Bidirectional local storage sync for DB_WORKSPACE
  useEffect(() => {
    if (typeof window === 'undefined' || !onUpdateOts) return;
    const dbWorkspaceRaw = localStorage.getItem('DB_WORKSPACE');
    if (!dbWorkspaceRaw) {
      saveToDbWorkspace(ots);
    } else {
      try {
        const workspaceActivities = JSON.parse(dbWorkspaceRaw);
        let hasChanges = false;
        const updatedOts = ots.map(ot => {
          const match = workspaceActivities.find((wa: any) => wa.codigo === ot.codigo);
          if (match && (
            match.fechaInicio !== ot.fechaInicio ||
            match.estado !== ot.estado ||
            match.responsable !== ot.responsable ||
            match.supervisor !== ot.supervisor ||
            match.observaciones !== ot.observaciones
          )) {
            hasChanges = true;
            return {
              ...ot,
              fechaInicio: match.fechaInicio,
              estado: match.estado,
              responsable: match.responsable,
              supervisor: match.supervisor,
              observaciones: match.observaciones || ot.observaciones
            };
          }
          return ot;
        });
        if (hasChanges) {
          onUpdateOts(updatedOts);
        }
      } catch (err) {
        console.error("Error reading DB_WORKSPACE:", err);
      }
    }
  }, []);

  // Rule of synchronization: 
  // OTs with fechaInicio serve as scheduled activities, OTs with empty/invalid dates go into "Pendientes de Programación"
  // Borrador status is excluded from both calendar (scheduled) and Pending List per ORBI O&M Command Center specs.
  const scheduledOts = ots.filter((o) => o.estado !== 'Borrador' && o.fechaInicio && o.fechaInicio !== '');
  const pendingOts = ots.filter((o) => o.estado !== 'Borrador' && (!o.fechaInicio || o.fechaInicio === ''));

  // Calculate workspace conflicts (Módulo 11B)
  const conflicts = detectWorkspaceConflicts(ots);

  // Filtered scheduled OTs for the view
  const filteredScheduledOts = scheduledOts.filter((ot) => {
    // Determine zone
    const planta = plantas.find((p) => p.id === ot.plantaId || p.name === ot.plantaNombre);
    const zonaOT = planta ? planta.zona : 'Centro';

    if (filterPlanta !== 'Todas' && ot.plantaId !== filterPlanta) return false;
    if (filterZona !== 'Todas' && zonaOT !== filterZona) return false;
    if (filterResponsable !== 'Todos' && ot.responsable !== filterResponsable) return false;
    if (filterSupervisor !== 'Todos' && ot.supervisor !== filterSupervisor) return false;
    
    // New Filters
    if (filterEstado !== 'Todos' && ot.estado !== filterEstado) return false;
    if (filterPrioridad !== 'Todas' && ot.prioridad !== filterPrioridad) return false;
    if (filterTipo !== 'Todos' && ot.tipo !== filterTipo) return false;
    
    if (filterRequierePTW !== 'Todos') {
      const requierePTW = ot.tipo === 'Correctiva' || ot.prioridad === 'Crítica' || ot.tipo === 'HSE';
      const otPTW = requierePTW ? 'Sí' : 'No';
      if (otPTW !== filterRequierePTW) return false;
    }
    
    if (filterBloqueada !== 'Todos') {
      const isBlocked = ot.estado === 'Bloqueada' || ot.bloqueada;
      const otBlocked = isBlocked ? 'Sí' : 'No';
      if (otBlocked !== filterBloqueada) return false;
    }

    if (filterSearch) {
      const searchLower = filterSearch.toLowerCase();
      return (
        ot.codigo.toLowerCase().includes(searchLower) ||
        ot.activo.toLowerCase().includes(searchLower) ||
        ot.responsable.toLowerCase().includes(searchLower) ||
        ot.tipo.toLowerCase().includes(searchLower) ||
        ot.plantaNombre.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Calculate day of the month for an OT (simulate based on its code number)
  const getOtDay = (ot: OT) => {
    const codeNum = parseInt(ot.codigo.replace(/\D/g, ''), 10) || 5;
    return (codeNum % 28) + 1; // Distributed in July 1-28
  };

  const getOtsForDay = (day: number) => {
    return filteredScheduledOts.filter((ot) => getOtDay(ot) === day);
  };

  // Move an OT to a different state (Kanban)
  const handleMoveKanban = (otCodigo: string, targetEstado: OTEstado) => {
    if (!onUpdateOts) return;
    const updated = ots.map((o) => {
      if (o.codigo === otCodigo) {
        return {
          ...o,
          estado: targetEstado,
          avance: targetEstado === 'Finalizada' ? 100 : o.avance,
        };
      }
      return o;
    });
    onUpdateOts(updated);
    saveToDbWorkspace(updated);
  };

  // Schedule an OT (sets date, coordinator, supervisor, etc.)
  const handleScheduleOt = (ot: OT) => {
    setSelectedOt(ot);
    setSchedulerDate(ot.fechaInicio || '2026-07-06');
    setSchedulerTime('09:00');
    setSchedulerDuration(ot.hhEstimadas || 8);
    setSchedulerSupervisor(ot.supervisor || 'Alejandro Rojas');
    setSchedulerResponsable(ot.responsable || 'Cristián Barraza');
    setSchedulerEstado(ot.estado || 'Programada');
    setSchedulerObservaciones(ot.observaciones || '');
    setIsScheduling(true);
  };

  const handleWorkspaceScheduleSave = (
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
  ) => {
    if (!onUpdateOts) return;

    const updated = ots.map((o) => {
      if (o.codigo === otCodigo) {
        const isRescheduling = !!o.fechaInicio && o.fechaInicio !== data.fechaInicio;
        
        let repCount = o.reprogramacionesCount || 0;
        let origDate = o.fechaOriginal || o.fechaInicio || data.fechaInicio;
        let lastMotivo = o.ultimoMotivoReprogramacion;
        let lastUser = o.ultimoUsuarioReprogramacion;

        if (isRescheduling) {
          repCount += 1;
          lastMotivo = data.motivoReprogramacion || 'Reprogramación en Workspace';
          lastUser = username || 'Supervisor O&M';
        }

        return {
          ...o,
          fechaInicio: data.fechaInicio,
          responsable: data.responsable,
          supervisor: data.supervisor,
          hhEstimadas: data.hhEstimadas,
          estado: data.estado,
          observaciones: data.observaciones,
          reprogramacionesCount: repCount,
          fechaOriginal: origDate,
          ultimoMotivoReprogramacion: lastMotivo,
          ultimoUsuarioReprogramacion: lastUser,
        };
      }
      return o;
    });

    onUpdateOts(updated);
    saveToDbWorkspace(updated);
    setIsScheduling(false);
    setSelectedOt(null);
  };

  const saveScheduledOt = () => {
    if (!selectedOt || !onUpdateOts) return;

    const updated = ots.map((o) => {
      if (o.codigo === selectedOt.codigo) {
        return {
          ...o,
          fechaInicio: schedulerDate,
          hhEstimadas: Number(schedulerDuration),
          supervisor: schedulerSupervisor,
          responsable: schedulerResponsable,
          estado: schedulerEstado,
          observaciones: `${schedulerObservaciones}\n[Workspace: Programada para ${schedulerDate} ${schedulerTime} con vehículo ${schedulerVehiculo}]`
        };
      }
      return o;
    });

    onUpdateOts(updated);
    saveToDbWorkspace(updated);
    setIsScheduling(false);
    setSelectedOt(null);
  };

  // Desprogramar (retornar a bandeja pendientes)
  const handleUnschedule = (otCodigo: string) => {
    if (!onUpdateOts) return;
    const updated = ots.map((o) => {
      if (o.codigo === otCodigo) {
        return {
          ...o,
          fechaInicio: '',
        };
      }
      return o;
    });
    onUpdateOts(updated);
    saveToDbWorkspace(updated);
  };

  // Quick state update
  const handleQuickUpdate = (otCodigo: string, fields: Partial<OT>) => {
    if (!onUpdateOts) return;
    const updated = ots.map((o) => {
      if (o.codigo === otCodigo) {
        return { ...o, ...fields };
      }
      return o;
    });
    onUpdateOts(updated);
    saveToDbWorkspace(updated);
  };

  // State colors helper supporting 9 specific states
  const getEstadoColor = (estado: OTEstado) => {
    switch (estado) {
      case 'Nueva': return 'bg-slate-950 text-blue-400 border border-blue-950';
      case 'Programada': return 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/40';
      case 'En preparación': return 'bg-cyan-950/50 text-cyan-400 border border-cyan-900/40';
      case 'En ruta': return 'bg-blue-950/50 text-blue-400 border border-blue-900/40';
      case 'En terreno': return 'bg-amber-950/50 text-amber-400 border border-amber-900/40';
      case 'En execution' as any:
      case 'En ejecución': return 'bg-orange-950/50 text-orange-400 border border-orange-900/40';
      case 'Bloqueada': return 'bg-rose-950/50 text-rose-400 border border-rose-900/40 animate-pulse';
      case 'Reprogramada' as any: return 'bg-fuchsia-950/50 text-fuchsia-400 border border-fuchsia-900/40';
      case 'Finalizada': return 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40';
      case 'Lista para revisión': return 'bg-cyan-950/50 text-cyan-400 border border-cyan-900/40';
      case 'En revisión Supervisor': return 'bg-sky-950/50 text-sky-400 border border-sky-900/40';
      case 'En revisión Coordinador': return 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/40';
      case 'En revisión HSE': return 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40';
      case 'En revisión Calidad': return 'bg-purple-950/50 text-purple-400 border border-purple-900/40';
      case 'Pendiente aprobación Jefe O&M': return 'bg-amber-950/50 text-amber-400 border border-amber-900/40';
      case 'Devuelta a ejecución': return 'bg-rose-950/50 text-rose-400 border border-rose-900/40 animate-pulse';
      case 'Cerrada': return 'bg-slate-900 text-slate-400 border border-slate-800';
      default: return 'bg-slate-950 text-slate-400 border border-slate-900';
    }
  };

  // Dynamic calculations for the 8 Workspace KPIs (Requirement 9)
  // 1. Actividades de hoy (Matching selectedDay)
  const actividadesHoy = scheduledOts.filter(o => getOtDay(o) === selectedDay).length;

  // 2. Actividades de la semana (Matching current active week)
  const actividadesSemana = scheduledOts.filter(o => Math.ceil(getOtDay(o) / 7) === selectedWeek).length;

  // 3. Pendientes de programación
  const pendientesProgramacion = pendingOts.length;

  // 4. Actividades bloqueadas
  const actividadesBloqueadas = ots.filter(o => o.estado === 'Bloqueada' || o.bloqueada).length;

  // 5. Actividades reprogramadas
  const actividadesReprogramadas = ots.filter(o => (o.estado as any) === 'Reprogramada' || o.observaciones?.includes('[Workspace: Programada') || o.observaciones?.includes('Reprogramada') || o.observaciones?.includes('reprogramada')).length;

  // 6. HH programadas
  const hhProgramadas = scheduledOts.reduce((acc, o) => acc + (o.hhEstimadas || 0), 0);

  // 7. Recursos sin asignar
  const recursosSinAsignar = scheduledOts.filter(o => !o.responsable || o.responsable === 'Por definir' || o.responsable === 'Sin asignar' || o.responsable === '').length;

  // 8. Supervisores con mayor carga
  const supervisorCarga: Record<string, number> = {};
  scheduledOts.forEach(o => {
    if (o.supervisor) {
      supervisorCarga[o.supervisor] = (supervisorCarga[o.supervisor] || 0) + 1;
    }
  });
  let maxSupervisor = 'Ninguno';
  let maxCount = 0;
  Object.entries(supervisorCarga).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxSupervisor = name;
    }
  });
  const supervisorConMayorCarga = maxCount > 0 ? `${maxSupervisor} (${maxCount} OT)` : 'Ninguno';

  return (
    <div className="space-y-6">
      {/* CABECERA PRINCIPAL */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20">ORBI WORKSPACE</span>
            <span className="text-xs font-mono text-slate-500">v0.1.2C-QA — Operational Planning Shell</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <CalendarIcon className="h-5.5 w-5.5 text-emerald-400" /> ORBI Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Calendario operativo para planificación, coordinación y seguimiento de actividades O&M. Define cuándo, dónde y quién ejecuta el mantenimiento.
          </p>
        </div>

        {/* View Switcher Select (10 Views) */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-lg">
            <Sliders className="h-3.5 w-3.5 text-slate-500" />
            <span>Vista Operativa:</span>
            <select
              value={activeView}
              onChange={(e) => setActiveView(e.target.value as WorkspaceView)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer border-none"
            >
              <optgroup label="Calendario Temporal">
                <option value="dia" className="bg-slate-950 text-white">Vista Día (Operación Activa)</option>
                <option value="semana" className="bg-slate-950 text-white">Vista Semana (Coordinación)</option>
                <option value="mes" className="bg-slate-950 text-white">Vista Mes (Calendario Completo)</option>
              </optgroup>
              <optgroup label="Agrupamiento de Carga">
                <option value="planta" className="bg-slate-950 text-white">Por Planta Fotovoltaica</option>
                <option value="zona" className="bg-slate-950 text-white">Por Zona Operacional</option>
                <option value="coordinador" className="bg-slate-950 text-white">Por Coordinador O&M</option>
                <option value="supervisor" className="bg-slate-950 text-white">Por Supervisor Terreno</option>
                <option value="persona" className="bg-slate-950 text-white">Por Técnico / Ingeniero</option>
              </optgroup>
              <optgroup label="Flujo & Cronograma">
                <option value="kanban" className="bg-slate-950 text-white">Tablero Kanban de Flujo</option>
                <option value="gantt" className="bg-slate-950 text-white">Gantt Simplificado</option>
                <option value="preventivos" className="bg-slate-950 text-white">Planes Anteriores</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* REGLA FUNCIONAL PRINCIPAL BANNER (Requirement 3) */}
      <div className="bg-slate-950/60 border border-slate-900/60 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Info className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-emerald-400 block tracking-wider font-bold">VINCULACIÓN OPERATIVA ECOSISTEMA ORBI</span>
            <div className="text-xs text-slate-300 font-mono space-y-0.5">
              <p>• <strong className="text-emerald-400">ORBI OT Center</strong> define QUÉ se debe hacer.</p>
              <p>• <strong className="text-emerald-400">ORBI Workspace</strong> define CUÁNDO, DÓNDE y QUIÉN lo ejecuta.</p>
              <p>• <strong className="text-emerald-400">ORBI Insight Center</strong> mide resultados, cumplimiento y desempeño.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 font-mono text-[9px] text-slate-500 bg-slate-900/40 px-3 py-1.5 rounded-md border border-slate-850">
          <span>Active integration:</span>
          <span className="text-emerald-400 font-bold">SLA-3000-OK</span>
        </div>
      </div>

      {/* WORKSPACE KPIs GRID (8 KPIs - Requirement 9) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
          <span className="text-[10px] font-mono text-slate-500 block">ACTIVIDADES HOY</span>
          <div className="text-xl font-bold font-mono text-white mt-1">{actividadesHoy}</div>
          <span className="text-[9px] text-emerald-400 font-mono block mt-1">Día {selectedDay} de Julio</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
          <span className="text-[10px] font-mono text-slate-500 block">ACTIVIDADES SEMANA</span>
          <div className="text-xl font-bold font-mono text-indigo-400 mt-1">{actividadesSemana}</div>
          <span className="text-[9px] text-slate-400 font-mono block mt-1">Semana {selectedWeek}</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
          <span className="text-[10px] font-mono text-slate-500 block">PENDIENTES DE PROGRAMACIÓN</span>
          <div className="text-xl font-bold font-mono text-amber-500 mt-1">{pendientesProgramacion}</div>
          <span className="text-[9px] text-slate-400 font-mono block mt-1">Bandeja de Entrada</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
          <span className="text-[10px] font-mono text-slate-500 block">BLOQUEADAS POR LOGÍSTICA</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{actividadesBloqueadas}</div>
          <span className="text-[9px] text-rose-500/50 font-mono block mt-1 font-bold">Falta repuesto/SLA</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
          <span className="text-[10px] font-mono text-slate-500 block">REPROGRAMADAS</span>
          <div className="text-xl font-bold font-mono text-fuchsia-400 mt-1">{actividadesReprogramadas}</div>
          <span className="text-[9px] text-slate-400 font-mono block mt-1">Ajuste calendario</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
          <span className="text-[10px] font-mono text-slate-500 block">HH PLANIFICADAS</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{hhProgramadas} h</div>
          <span className="text-[9px] text-slate-400 font-mono block mt-1">Carga asignada total</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
          <span className="text-[10px] font-mono text-slate-500 block">SIN ASIGNAR</span>
          <div className="text-xl font-bold font-mono text-slate-400 mt-1">{recursosSinAsignar}</div>
          <span className="text-[9px] text-slate-400 font-mono block mt-1">Responsable vacío</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
          <span className="text-[10px] font-mono text-slate-500 block">MÁXIMA CARGA SUPERVISOR</span>
          <div className="text-xs font-bold font-mono text-emerald-400 mt-2 truncate">{supervisorConMayorCarga}</div>
          <span className="text-[9px] text-slate-400 font-mono block mt-1">Mayor densidad</span>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Planta</label>
            <select
              value={filterPlanta}
              onChange={(e) => setFilterPlanta(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            >
              <option value="Todas">Todas las Plantas</option>
              {plantas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Zona</label>
            <select
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            >
              <option value="Todas">Todas las Zonas</option>
              <option value="Norte">Zona Norte</option>
              <option value="Centro">Zona Centro</option>
              <option value="Sur">Zona Sur</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Supervisor Terreno</label>
            <select
              value={filterSupervisor}
              onChange={(e) => setFilterSupervisor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            >
              <option value="Todos">Todos</option>
              {supervisoresUnicos.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Asignado</label>
            <select
              value={filterResponsable}
              onChange={(e) => setFilterResponsable(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            >
              <option value="Todos">Todos</option>
              {tecnicosUnicos.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-1 col-span-2 md:col-span-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Buscar Actividad</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Código, activo..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-8 pr-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-t border-slate-800/40 pt-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Estado</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Nueva">Nueva</option>
              <option value="Programada">Programada</option>
              <option value="En preparación">En preparación</option>
              <option value="En ruta">En ruta</option>
              <option value="En ejecución">En ejecución</option>
              <option value="Bloqueada">Bloqueada</option>
              <option value="Reprogramada">Reprogramada</option>
              <option value="Finalizada">Finalizada</option>
              <option value="Cerrada">Cerrada</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Prioridad</label>
            <select
              value={filterPrioridad}
              onChange={(e) => setFilterPrioridad(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            >
              <option value="Todas">Todas las Prioridades</option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Tipo Actividad</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            >
              <option value="Todos">Todos los Tipos</option>
              <option value="Preventiva">Preventiva</option>
              <option value="Correctiva">Correctiva</option>
              <option value="LOTO/HSE">LOTO/HSE</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Requiere PTW</label>
            <select
              value={filterRequierePTW}
              onChange={(e) => setFilterRequierePTW(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            >
              <option value="Todos">Todos</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="space-y-1 col-span-2 md:col-span-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Bloqueo Logística</label>
            <select
              value={filterBloqueada}
              onChange={(e) => setFilterBloqueada(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
            >
              <option value="Todos">Todos</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE GRID (Sidebar: Pendientes de Programación | Content: Selected Active View) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SIDEBAR: CONFLICTS & PENDIENTES (Módulo 11B) */}
        <div className="flex flex-col gap-4">
          <WorkspaceConflictPanel
            conflicts={conflicts}
            onOpenOt={(codigo) => {
              const ot = ots.find((o) => o.codigo === codigo);
              if (ot) setSelectedOt(ot);
            }}
          />

          {/* BANDEJA: PENDIENTES DE PROGRAMACIÓN */}
          <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-4 h-fit">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Pendientes de Programación</h3>
              <p className="text-[10px] text-slate-500">Órdenes creadas sin calendarizar</p>
            </div>
            <span className="bg-rose-500/10 text-rose-400 font-mono text-[10px] px-2 py-0.5 rounded border border-rose-900/30">
              {pendingOts.length} OT
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {pendingOts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-mono">
                No hay OTs pendientes de programación. ¡Excelente!
              </div>
            ) : (
              pendingOts.map((ot) => {
                let badgeColor = 'bg-sky-500/10 text-sky-400';
                if (ot.tipo === 'Correctiva') badgeColor = 'bg-rose-500/10 text-rose-400';
                else if (ot.tipo === 'HSE') badgeColor = 'bg-emerald-500/10 text-emerald-400';

                const pPlanta = plantas.find((p) => p.id === ot.plantaId || p.name === ot.plantaNombre);
                const pZona = pPlanta ? pPlanta.zona : 'Centro';
                const requiereTecnico = ot.tipo === 'Correctiva' || ot.tipo === 'HSE' || ot.prioridad === 'Crítica' || ot.prioridad === 'Alta';
                const requiereSupervisor = ot.tipo === 'HSE' || ot.prioridad === 'Crítica';
                const estaBloqueada = ot.estado === 'Bloqueada' || ot.bloqueada;

                return (
                  <div
                    key={ot.codigo}
                    className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl hover:border-emerald-500/40 transition-colors group space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-mono text-slate-400 font-bold">{ot.codigo}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-extrabold ${badgeColor}`}>
                        {ot.tipo}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-bold text-slate-200 block truncate">{ot.activo}</h4>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                        <span>Planta: {ot.plantaNombre}</span>
                        <span className="text-emerald-500">Zona: {pZona}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-[9px] font-mono">
                      <div>
                        <span className="text-slate-600 block text-[8px] uppercase">Prioridad</span>
                        <span className={`font-bold ${ot.prioridad === 'Crítica' ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                          {ot.prioridad}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[8px] uppercase">Req. Técnico</span>
                        <span className="text-slate-300">{requiereTecnico ? 'Sí (Nivel 2)' : 'Estándar'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[8px] uppercase">Req. Superv.</span>
                        <span className={requiereSupervisor ? 'text-indigo-400 font-bold' : 'text-slate-500'}>
                          {requiereSupervisor ? 'Sí (Validación)' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[8px] uppercase">Bloqueos</span>
                        <span className={estaBloqueada ? 'text-rose-400 font-bold animate-pulse' : 'text-emerald-500'}>
                          {estaBloqueada ? '⚠️ Sí' : 'Ninguno'}
                        </span>
                      </div>
                    </div>

                    {estaBloqueada && (
                      <div className="bg-rose-500/5 border border-rose-500/20 rounded p-1.5 text-[8px] font-mono text-rose-400">
                        Bloqueo Logístico: Pendiente confirmación de stock.
                      </div>
                    )}

                    <div className="pt-1 flex gap-1.5">
                      <button
                        onClick={() => handleScheduleOt(ot)}
                        className="w-full py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-[9px] font-mono font-bold rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CalendarCheck className="h-3 w-3" /> Programar Actividad
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* NOTA DE RESPONSABILIDADES: COHERENCIA DEL ECOSISTEMA */}
          <div className="mt-4 bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl space-y-2">
            <h4 className="text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-3 w-3 text-indigo-400" /> Matriz de Responsabilidad
            </h4>
            <div className="space-y-1.5 text-[9px] font-mono text-slate-400">
              <div className="flex items-start gap-1">
                <span className="text-indigo-400 font-bold">1.</span>
                <p><strong className="text-slate-300">Workspace:</strong> Coordina y define cuándo, dónde y quién ejecuta.</p>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-emerald-400 font-bold">2.</span>
                <p><strong className="text-slate-300">OT Center:</strong> Ejecuta las órdenes en terreno y realiza el cierre.</p>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-sky-400 font-bold">3.</span>
                <p><strong className="text-slate-300">Insight Center:</strong> Analiza y mide los resultados de performance.</p>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-rose-400 font-bold">4.</span>
                <p><strong className="text-slate-300">Risk Center:</strong> Escala los riesgos críticos y bloqueos O&M.</p>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-amber-400 font-bold">5.</span>
                <p><strong className="text-slate-300">People Center:</strong> Gestiona turnos, carga y disponibilidad.</p>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-purple-400 font-bold">6.</span>
                <p><strong className="text-slate-300">Logistics Center:</strong> Controla vehículos, flotas y repuestos.</p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* WORKSPACE VIEW SPACE */}
        <div className="lg:col-span-3 bg-slate-900/10 border border-slate-800/60 rounded-2xl p-5 min-h-[500px]">
          
          {/* Selector de Vistas de Planificación (Módulo 11B) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-900 mb-2">
            <WorkspaceViewSelector activeView={activeView} setActiveView={setActiveView} />
            <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SLA Planificación: <strong className="text-slate-300">99.8% OK</strong></span>
            </div>
          </div>

          {/* VISTA 1: DÍA */}
          {activeView === 'dia' && (
            <WorkspaceDayView
              filteredOts={filteredScheduledOts}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              plantas={plantas}
              setSelectedOt={setSelectedOt}
              isPlanner={isPlanner}
              onOpenScheduleModal={handleScheduleOt}
            />
          )}

          {/* VISTA 2: SEMANA */}
          {activeView === 'semana' && (
            <WorkspaceWeekView
              filteredOts={filteredScheduledOts}
              selectedWeek={selectedWeek}
              setSelectedWeek={setSelectedWeek}
              plantas={plantas}
              setSelectedOt={setSelectedOt}
              isPlanner={isPlanner}
              onOpenScheduleModal={handleScheduleOt}
            />
          )}

          {/* VISTA DESPACHO */}
          {activeView === 'despacho' && (
            <WorkspaceDispatchList
              ots={ots}
              plantas={plantas}
              setSelectedOt={setSelectedOt}
              isPlanner={isPlanner}
              onOpenScheduleModal={handleScheduleOt}
            />
          )}

          {/* VISTA 3: MES (CALENDARIO COMPLETO GRID) */}
          {activeView === 'mes' && (
            <div className="space-y-4">
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">Mes: <strong className="text-white">Julio 2026</strong></span>
                <span className="text-[10px] text-slate-500 font-mono uppercase">Seleccione una celda para ver actividades de ese día</span>
              </div>

              <div className="grid grid-cols-7 gap-1 bg-slate-950 p-2 rounded-xl border border-slate-850">
                {/* Headers */}
                {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map((h) => (
                  <div key={h} className="text-center font-mono text-[9px] font-bold text-slate-500 py-1.5 border-b border-slate-900">
                    {h}
                  </div>
                ))}

                {/* Days */}
                {/* July 2026 starts on a Wednesday (3 empty slots at the start) */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[70px] bg-slate-900/5 border border-slate-900/10"></div>
                ))}

                {Array.from({ length: 28 }).map((_, i) => {
                  const day = i + 1;
                  const dayOts = getOtsForDay(day);

                  return (
                    <div
                      key={day}
                      onClick={() => {
                        setSelectedDay(day);
                        setActiveView('dia');
                      }}
                      className="min-h-[75px] bg-slate-900/20 hover:bg-slate-900 border border-slate-900 p-1.5 flex flex-col justify-between cursor-pointer transition-colors group rounded"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-white transition-colors">
                          {day}
                        </span>
                        {dayOts.length > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1">
                        {dayOts.slice(0, 3).map((ot) => {
                          let color = 'bg-sky-500/10 text-sky-400 border border-sky-500/10';
                          if (ot.tipo === 'Correctiva') color = 'bg-rose-500/10 text-rose-400 border border-rose-500/10';
                          else if (ot.tipo === 'HSE') color = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10';

                          const isBlocked = ot.estado === 'Bloqueada' || ot.bloqueada;
                          const isUnassigned = !ot.responsable || ot.responsable === 'Por definir' || ot.responsable === 'Sin asignar' || ot.responsable === '';
                          const requiresPTW = ot.tipo === 'Correctiva' || ot.prioridad === 'Crítica' || ot.tipo === 'HSE';

                          return (
                            <div 
                              key={ot.codigo} 
                              className={`text-[8px] font-mono px-1 py-0.5 rounded transition-all hover:bg-slate-900 flex flex-col gap-0.5 ${color}`}
                              title={`${ot.codigo} - ${ot.activo} (${ot.estado})`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold truncate">{ot.codigo}</span>
                                <div className="flex gap-0.5 shrink-0">
                                  {isBlocked && <span className="text-rose-500" title="Bloqueada Logística">⚠️</span>}
                                  {isUnassigned && <span className="text-amber-400" title="Sin Responsable">👤?</span>}
                                  {requiresPTW && <span className="text-indigo-400" title="Requiere PTW">📄</span>}
                                </div>
                              </div>
                              <div className="text-[7px] text-slate-400 truncate flex items-center justify-between">
                                <span className="truncate max-w-[35px]">{ot.estado}</span>
                                <span className="text-[6px] text-slate-500 font-sans">{ot.hhEstimadas || 8}H</span>
                              </div>
                            </div>
                          );
                        })}
                        {dayOts.length > 3 && (
                          <div className="text-[7px] text-slate-500 text-center font-mono font-bold">
                            + {dayOts.length - 3} actividades
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VISTA 4: POR PLANTA */}
          {activeView === 'planta' && (
            <div className="space-y-4">
              {plantas.map((planta) => {
                const pOts = filteredScheduledOts.filter((ot) => ot.plantaId === planta.id);
                return (
                  <div key={planta.id} className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Building2 className="h-4.5 w-4.5 text-emerald-400" /> {planta.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono">Región: {planta.region} | MWp: {planta.mwp}</p>
                      </div>
                      <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-900/30">
                        {pOts.length} Actividades
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pOts.length === 0 ? (
                        <p className="text-[11px] text-slate-600 font-mono italic">Sin actividades programadas para esta planta.</p>
                      ) : (
                        pOts.map((ot) => (
                          <div key={ot.codigo} className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono text-slate-400 font-bold">{ot.codigo}</span>
                                <span className={`text-[8px] font-mono px-1 rounded ${getEstadoColor(ot.estado)}`}>{ot.estado}</span>
                              </div>
                              <h4 className="text-xs font-semibold text-slate-200 mt-1">{ot.activo}</h4>
                              <p className="text-[10px] text-slate-500 font-mono">Asignado: {ot.responsable}</p>
                            </div>
                            <button
                              onClick={() => setSelectedOt(ot)}
                              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 p-1 bg-slate-950 rounded border border-slate-800"
                            >
                              Detalle
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA 5: POR ZONA */}
          {activeView === 'zona' && (
            <div className="space-y-4">
              {['Norte', 'Centro', 'Sur'].map((zonaId) => {
                const zOts = filteredScheduledOts.filter((ot) => {
                  const p = plantas.find((pl) => pl.id === ot.plantaId);
                  return p && p.zona === zonaId;
                });

                return (
                  <div key={zonaId} className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                        <MapPin className="h-4.5 w-4.5 text-amber-500" /> ZONA {zonaId}
                      </h3>
                      <span className="bg-amber-950/40 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-900/30">
                        {zOts.length} Actividades
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {zOts.length === 0 ? (
                        <p className="text-[11px] text-slate-600 font-mono italic">Sin actividades asignadas en esta zona.</p>
                      ) : (
                        zOts.map((ot) => (
                          <div key={ot.codigo} className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-mono text-slate-400 font-bold">{ot.codigo}</span>
                              <span className={`text-[8px] font-mono px-1 rounded ${getEstadoColor(ot.estado)}`}>{ot.estado}</span>
                            </div>
                            <h4 className="text-xs font-semibold text-slate-200">{ot.activo}</h4>
                            <div className="text-[9px] text-slate-500 font-mono flex justify-between">
                              <span>Planta: {ot.plantaNombre}</span>
                              <span>Asignado: {ot.responsable}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA 6: POR COORDINADOR */}
          {activeView === 'coordinador' && (
            <div className="space-y-4">
              {coordinadoresUnicos.map((coord) => {
                const cOts = filteredScheduledOts.filter((ot) => ot.coordinador === coord || (!ot.coordinador && coord === 'Rodolfo Garcés'));

                return (
                  <div key={coord} className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-bold text-cyan-400 text-xs">
                          {coord[0]}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white font-mono">{coord}</h3>
                          <p className="text-[9px] text-slate-500 font-mono">COORDINADOR O&M CENTRAL</p>
                        </div>
                      </div>
                      <span className="bg-cyan-950/40 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-900/30">
                        {cOts.length} OTs administradas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {cOts.map((ot) => (
                        <div key={ot.codigo} className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850 text-xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-slate-400 font-bold text-[9px]">{ot.codigo}</span>
                            <span className={`text-[8px] font-mono px-1 rounded ${getEstadoColor(ot.estado)}`}>{ot.estado}</span>
                          </div>
                          <h4 className="font-semibold text-slate-200 truncate">{ot.activo}</h4>
                          <p className="text-[9px] text-slate-500 truncate font-mono">{ot.plantaNombre}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA 7: POR SUPERVISOR TERRENO */}
          {activeView === 'supervisor' && (
            <div className="space-y-4">
              {supervisoresUnicos.map((sup) => {
                const sOts = filteredScheduledOts.filter((ot) => ot.supervisor === sup || (!ot.supervisor && sup === 'Alejandro Rojas'));

                return (
                  <div key={sup} className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-bold text-orange-400 text-xs">
                          {sup[0]}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white font-mono">{sup}</h3>
                          <p className="text-[9px] text-slate-500 font-mono">SUPERVISOR TERRENO</p>
                        </div>
                      </div>
                      <span className="bg-orange-950/40 text-orange-400 text-[10px] font-mono px-2 py-0.5 rounded border border-orange-900/30">
                        {sOts.length} OTs supervisadas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {sOts.map((ot) => (
                        <div key={ot.codigo} className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850 text-xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-slate-400 font-bold text-[9px]">{ot.codigo}</span>
                            <span className={`text-[8px] font-mono px-1 rounded ${getEstadoColor(ot.estado)}`}>{ot.estado}</span>
                          </div>
                          <h4 className="font-semibold text-slate-200 truncate">{ot.activo}</h4>
                          <p className="text-[9px] text-slate-500 truncate font-mono">{ot.plantaNombre}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA 8: POR PERSONA */}
          {activeView === 'persona' && (
            <div className="space-y-4">
              {tecnicosUnicos.map((t) => {
                const tOts = filteredScheduledOts.filter((ot) => ot.responsable === t);

                return (
                  <div key={t} className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white font-mono">{t}</h3>
                        <p className="text-[9px] text-slate-500 font-mono">TÉCNICO / INGENIERO OM ASIGNADO</p>
                      </div>
                      <span className="bg-emerald-950/40 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-900/30">
                        {tOts.length} Actividades
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tOts.length === 0 ? (
                        <p className="text-[11px] text-slate-600 font-mono italic">Sin actividades en su agenda esta semana.</p>
                      ) : (
                        tOts.map((ot) => (
                          <div key={ot.codigo} className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-slate-400 font-bold text-[9px]">{ot.codigo}</span>
                              <span className={`text-[8px] px-1 rounded ${getEstadoColor(ot.estado)}`}>{ot.estado}</span>
                            </div>
                            <h4 className="text-xs font-semibold text-slate-200">{ot.activo}</h4>
                            <p className="text-[9px] text-slate-500 font-mono">{ot.plantaNombre}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA 9: TABLERO KANBAN */}
          {activeView === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
              {/* Columns defined by OTEstados */}
              {[
                { title: 'Nueva / Pendiente', status: 'Nueva' as OTEstado },
                { title: 'Programada / Asignada', status: 'Asignada' as OTEstado },
                { title: 'En Terreno', status: 'En terreno' as OTEstado },
                { title: 'En Revisión', status: 'En revisión' as OTEstado },
                { title: 'Finalizada / Cerrada', status: 'Finalizada' as OTEstado }
              ].map((col) => {
                const colOts = filteredScheduledOts.filter((ot) => {
                  if (col.status === 'Nueva') return ot.estado === 'Nueva' || ot.estado === 'Programada';
                  if (col.status === 'Asignada') return ot.estado === 'Asignada' || ot.estado === 'En preparación';
                  if (col.status === 'En terreno') return ot.estado === 'En terreno' || ot.estado === 'En ejecución' || ot.estado === 'En ruta';
                  if (col.status === 'En revisión') return ot.estado === 'En revisión' || ot.estado === 'Lista para revisión';
                  if (col.status === 'Finalizada') return ot.estado === 'Finalizada' || ot.estado === 'Cerrada';
                  return ot.estado === col.status;
                });

                return (
                  <div key={col.title} className="bg-slate-950 border border-slate-900 p-3 rounded-xl min-w-[180px] flex flex-col gap-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-900 font-mono">
                      <span className="text-[10px] font-bold text-slate-300 uppercase truncate">{col.title}</span>
                      <span className="bg-slate-900 text-slate-500 font-semibold px-2 py-0.5 rounded text-[9px]">
                        {colOts.length}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1 max-h-[500px] overflow-y-auto">
                      {colOts.map((ot) => {
                        let tagColor = 'border-sky-500/10 text-sky-400';
                        if (ot.tipo === 'Correctiva') tagColor = 'border-rose-500/10 text-rose-400';
                        else if (ot.tipo === 'HSE') tagColor = 'border-emerald-500/10 text-emerald-400';

                        return (
                          <div
                            key={ot.codigo}
                            className="bg-slate-900 border border-slate-850 p-3 rounded-lg hover:border-slate-700 transition-all space-y-2 group"
                          >
                            <div className="flex justify-between items-center text-[9px] font-mono">
                              <span className="text-slate-400 font-bold">{ot.codigo}</span>
                              <span className={`px-1 rounded uppercase text-[8px] border ${tagColor}`}>{ot.tipo}</span>
                            </div>

                            <h4 className="text-xs font-bold text-white truncate">{ot.activo}</h4>
                            <p className="text-[9px] text-slate-500 font-mono truncate">{ot.plantaNombre}</p>

                            {/* Kanban Quick controls */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1.5 pt-2 border-t border-slate-950 mt-1">
                              {col.status !== 'Nueva' && (
                                <button
                                  onClick={() => handleMoveKanban(ot.codigo, 'Nueva')}
                                  className="text-[8px] font-mono bg-slate-950 hover:bg-slate-850 text-slate-400 p-1 rounded"
                                  title="Mover a Pendiente"
                                >
                                  Pend
                                </button>
                              )}
                              {col.status !== 'Asignada' && (
                                <button
                                  onClick={() => handleMoveKanban(ot.codigo, 'Asignada')}
                                  className="text-[8px] font-mono bg-slate-950 hover:bg-slate-850 text-slate-400 p-1 rounded"
                                  title="Mover a Asignado"
                                >
                                  Asig
                                </button>
                              )}
                              {col.status !== 'En terreno' && (
                                <button
                                  onClick={() => handleMoveKanban(ot.codigo, 'En terreno')}
                                  className="text-[8px] font-mono bg-slate-950 hover:bg-slate-850 text-slate-400 p-1 rounded"
                                  title="Mover a Terreno"
                                >
                                  Terr
                                </button>
                              )}
                              {col.status !== 'En revisión' && (
                                <button
                                  onClick={() => handleMoveKanban(ot.codigo, 'En revisión')}
                                  className="text-[8px] font-mono bg-slate-950 hover:bg-slate-850 text-slate-400 p-1 rounded"
                                  title="Mover a Revisión"
                                >
                                  Rev
                                </button>
                              )}
                              {col.status !== 'Finalizada' && (
                                <button
                                  onClick={() => handleMoveKanban(ot.codigo, 'Finalizada')}
                                  className="text-[8px] font-mono bg-slate-950 hover:bg-slate-850 text-slate-400 p-1 rounded font-bold text-emerald-400"
                                  title="Finalizar"
                                >
                                  Fin
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA 10: GANTT SIMPLIFICADO */}
          {activeView === 'gantt' && (
            <div className="space-y-4">
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl text-xs flex justify-between items-center">
                <span className="font-mono text-slate-400">Gantt de Actividades O&M — <strong className="text-white">Julio 2026</strong></span>
                <span className="text-[10px] text-slate-500 font-mono">Semanas operacionales del mes</span>
              </div>

              <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20">
                {/* Header columns */}
                <div className="grid grid-cols-12 gap-2 bg-slate-950 p-3 border-b border-slate-900 text-[10px] font-mono text-slate-500 font-bold">
                  <div className="col-span-4 uppercase pr-2">Actividad / Equipo</div>
                  <div className="col-span-2 text-center border-l border-slate-900/40">SEMANA 1</div>
                  <div className="col-span-2 text-center border-l border-slate-900/40">SEMANA 2</div>
                  <div className="col-span-2 text-center border-l border-slate-900/40">SEMANA 3</div>
                  <div className="col-span-2 text-center border-l border-slate-900/40">SEMANA 4</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-900/60 p-2.5 space-y-3.5">
                  {filteredScheduledOts.map((ot) => {
                    // Distribute arbitarily in weeks based on its day of month
                    const day = getOtDay(ot);
                    const week = Math.ceil(day / 7);

                    let barColor = 'bg-sky-500/20 border border-sky-500/30 text-sky-400';
                    if (ot.tipo === 'Correctiva') barColor = 'bg-rose-500/20 border border-rose-500/30 text-rose-400';
                    else if (ot.tipo === 'HSE') barColor = 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400';

                    return (
                      <div key={ot.codigo} className="grid grid-cols-12 gap-2 items-center text-xs pt-2 first:pt-0">
                        <div className="col-span-4 truncate pr-2">
                          <span className="text-[9px] font-mono text-slate-500 mr-1.5">{ot.codigo}</span>
                          <strong className="text-slate-300 font-bold block truncate">{ot.activo}</strong>
                          <span className="text-[9px] text-slate-500 font-mono truncate block">{ot.plantaNombre}</span>
                        </div>

                        {/* Week 1 bar */}
                        <div className="col-span-2 h-7 rounded flex items-center justify-center relative">
                          {week === 1 && (
                            <div className={`absolute inset-x-1 h-5 rounded text-[9px] font-mono flex items-center justify-center font-bold ${barColor}`}>
                              {ot.hhEstimadas} HH
                            </div>
                          )}
                        </div>

                        {/* Week 2 bar */}
                        <div className="col-span-2 h-7 rounded flex items-center justify-center relative">
                          {week === 2 && (
                            <div className={`absolute inset-x-1 h-5 rounded text-[9px] font-mono flex items-center justify-center font-bold ${barColor}`}>
                              {ot.hhEstimadas} HH
                            </div>
                          )}
                        </div>

                        {/* Week 3 bar */}
                        <div className="col-span-2 h-7 rounded flex items-center justify-center relative">
                          {week === 3 && (
                            <div className={`absolute inset-x-1 h-5 rounded text-[9px] font-mono flex items-center justify-center font-bold ${barColor}`}>
                              {ot.hhEstimadas} HH
                            </div>
                          )}
                        </div>

                        {/* Week 4 bar */}
                        <div className="col-span-2 h-7 rounded flex items-center justify-center relative">
                          {week === 4 && (
                            <div className={`absolute inset-x-1 h-5 rounded text-[9px] font-mono flex items-center justify-center font-bold ${barColor}`}>
                              {ot.hhEstimadas} HH
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VISTA 11: PLANES PREVENTIVOS ANTERIORES */}
          {activeView === 'preventivos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                <span className="text-xs text-slate-400 font-mono">Planes Preventivos Estáticos (Histórico): <strong className="text-white">Julio 2026</strong></span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {planificacion.map((p) => {
                  let stateBadge = 'bg-slate-950 text-slate-500 border border-slate-900';
                  if (p.estado === 'Completado') stateBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  else if (p.estado === 'En Curso') stateBadge = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
                  else if (p.estado === 'Atrasado') stateBadge = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';

                  return (
                    <div key={p.id} className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {p.id}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                            Semana {p.semana}
                          </span>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${stateBadge}`}>
                            {p.estado}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-slate-400">{p.plantaNombre}</h4>
                          <h3 className="text-sm font-bold text-white mt-0.5">{p.actividad}</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-900/60 text-[10px] text-slate-500 font-mono">
                          <div>
                            <span className="text-slate-600 block text-[9px]">Recursos</span>
                            <span className="text-slate-300 font-semibold">{p.recursos}</span>
                          </div>
                          <div>
                            <span className="text-slate-600 block text-[9px]">Dependencias</span>
                            <span className="text-slate-400">{p.dependencias || 'Ninguna'}</span>
                          </div>
                          <div>
                            <span className="text-slate-600 block text-[9px]">Riesgos</span>
                            <span className="text-rose-400 font-semibold">{p.riesgos || 'Ninguno'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLES DE OT (19 Items - Requirement 10) */}
      {selectedOt && !isScheduling && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-extrabold">ORDEN DE TRABAJO ACTIVADA (FICHA DE SINCRONIZACIÓN WORKSPACE)</span>
                <h3 className="text-sm font-black text-white">{selectedOt.codigo}</h3>
              </div>
              <button
                onClick={() => setSelectedOt(null)}
                className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-xs font-mono">
                {/* Item 1: Código */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">1. Código</span>
                  <span className="text-white font-bold">{selectedOt.codigo}</span>
                </div>
                {/* Item 2: Planta */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">2. Planta</span>
                  <span className="text-white font-medium">{selectedOt.plantaNombre}</span>
                </div>
                {/* Item 3: Zona */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">3. Zona</span>
                  <span className="text-white font-medium">
                    {plantas.find(p => p.id === selectedOt.plantaId || p.name === selectedOt.plantaNombre)?.zona || 'Centro'}
                  </span>
                </div>
                {/* Item 4: Activo */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">4. Activo</span>
                  <span className="text-emerald-400 font-bold">{selectedOt.activo}</span>
                </div>
                {/* Item 5: Fecha */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">5. Fecha</span>
                  <span className="text-indigo-400 font-bold">{selectedOt.fechaInicio || 'No programada'}</span>
                </div>
                {/* Item 6: Hora */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">6. Hora</span>
                  <span className="text-slate-300">09:00 UTC-4</span>
                </div>
                {/* Item 7: HH Estimadas */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">7. HH Estimadas</span>
                  <span className="text-emerald-400 font-bold">{selectedOt.hhEstimadas || 8} hrs</span>
                </div>
                {/* Item 8: Supervisor */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">8. Supervisor</span>
                  <span className="text-slate-300">{selectedOt.supervisor || 'Alejandro Rojas'}</span>
                </div>
                {/* Item 9: Técnico Asignado */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">9. Técnico Asignado</span>
                  <span className="text-slate-300">{selectedOt.responsable || 'Por definir'}</span>
                </div>
                {/* Item 10: Estado */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">10. Estado</span>
                  <span className="text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{selectedOt.estado}</span>
                </div>
                {/* Item 11: Prioridad */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">11. Prioridad</span>
                  <span className={`font-bold ${selectedOt.prioridad === 'Crítica' ? 'text-rose-400' : 'text-slate-300'}`}>{selectedOt.prioridad}</span>
                </div>
                {/* Item 12: Bloqueos */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">12. Bloqueos</span>
                  <span className={`font-bold ${selectedOt.estado === 'Bloqueada' || selectedOt.bloqueada ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {selectedOt.estado === 'Bloqueada' || selectedOt.bloqueada ? '⚠️ Sí (Falta Repuesto)' : 'Ninguno'}
                  </span>
                </div>
                {/* Item 13: PTW Requerido */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">13. PTW Requerido</span>
                  <span className="text-slate-300 font-bold">
                    {selectedOt.tipo === 'Correctiva' || selectedOt.prioridad === 'Crítica' || selectedOt.tipo === 'LOTO/HSE' ? 'Sí (Requiere Permiso)' : 'No aplica'}
                  </span>
                </div>
                {/* Item 14: Repuestos Requeridos */}
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">14. Repuestos</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedOt.repuestosVerificados ? '✓ Confirmados / Listos' : 'No aplica'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Observaciones & Diagnóstico</span>
                <p className="text-xs text-slate-300 mt-1 bg-slate-950 p-3 rounded-xl border border-slate-900 leading-normal font-mono whitespace-pre-wrap">
                  {selectedOt.observaciones || 'Sin observaciones de planificación registradas.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 px-5 py-3 border-t border-slate-850 flex justify-between items-center gap-2">
              <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Planificación & Coordinación O&M
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('OTs');
                      setSelectedOt(null);
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black font-mono text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir en OT Center
                </button>
                <button
                  onClick={() => setShowProfessionalLifecycle(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black font-mono text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-950/40 active:scale-95"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-300 animate-pulse" /> Ver ciclo OT
                </button>
                <button
                  onClick={() => setSelectedOt(null)}
                  className="bg-slate-800 text-slate-300 font-bold font-mono text-xs px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cerrar Detalle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORBI OT CENTER PROFESSIONAL LIFECYCLE 10-TAB MODAL */}
      {selectedOt && showProfessionalLifecycle && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/20 rounded-3xl w-full max-w-5xl h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-850 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-extrabold bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
                    ORBI OT Lifecycle Center
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-black uppercase ${getEstadoColor(selectedOt.estado)}`}>
                    {selectedOt.estado}
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  {selectedOt.codigo} <span className="text-slate-500 text-xs">| {selectedOt.plantaNombre} - {selectedOt.activo}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowProfessionalLifecycle(false);
                    // Force refresh selectedOt from ots if needed
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-mono font-bold hover:bg-slate-800 transition-all"
                >
                  Volver a Ficha
                </button>
                <button
                  onClick={() => {
                    setShowProfessionalLifecycle(false);
                    setSelectedOt(null);
                  }}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-950"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 overflow-x-auto scrollbar-thin">
              {[
                { name: 'Resumen', icon: Eye },
                { name: 'Planificación', icon: CalendarIcon },
                { name: 'Personas', icon: Users },
                { name: 'Logística', icon: Truck },
                { name: 'Repuestos', icon: Package },
                { name: 'Ejecución', icon: Activity },
                { name: 'Evidencias', icon: Sparkles },
                { name: 'HSE & Calidad', icon: ShieldAlert },
                { name: 'Historial', icon: History },
                { name: 'Cierre', icon: CheckSquare },
              ].map((tab, idx) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setLifecycleTab(idx)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-mono font-bold whitespace-nowrap transition-all ${
                      lifecycleTab === idx
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-850/40'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>

            {/* Modal Body (Scrollable Tab Content) */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900/40">
              
              {/* TAB 0: RESUMEN */}
              {lifecycleTab === 0 && (
                <div className="space-y-6">
                  {/* Progress Header */}
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="space-y-1 w-full md:w-auto">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Progreso de Orden de Trabajo</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-white font-mono">{selectedOt.progreso || 0}%</span>
                        <div className="h-2.5 w-48 bg-slate-850 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="bg-indigo-500 h-full transition-all duration-500"
                            style={{ width: `${selectedOt.progreso || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                      <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-850 text-center min-w-[80px]">
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Horas Estimadas</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">{selectedOt.hhEstimadas || 8}h</span>
                      </div>
                      <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-850 text-center min-w-[80px]">
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Horas Reales</span>
                        <span className="text-sm font-black text-amber-400 font-mono">{selectedOt.hhReales || 0}h</span>
                      </div>
                      <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-850 text-center min-w-[80px]">
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Criticidad</span>
                        <span className={`text-sm font-black font-mono ${selectedOt.prioridad === 'Crítica' ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                          {selectedOt.prioridad}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Complete 19 items dashboard */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { l: '1. Código', v: selectedOt.codigo, c: 'text-white font-bold' },
                      { l: '2. Planta', v: selectedOt.plantaNombre, c: 'text-white' },
                      { l: '3. Tipo OT', v: selectedOt.tipo, c: 'text-indigo-400 font-bold' },
                      { l: '4. Prioridad', v: selectedOt.prioridad, c: selectedOt.prioridad === 'Crítica' ? 'text-rose-400 font-bold' : 'text-slate-300' },
                      { l: '5. Coordinador', v: selectedOt.coordinador || 'Rodolfo Garcés' },
                      { l: '6. Supervisor', v: selectedOt.supervisor || 'Alejandro Rojas', c: 'text-indigo-300' },
                      { l: '7. Técnico Asignado', v: selectedOt.responsable || 'Cristián Barraza', c: 'text-emerald-300' },
                      { l: '8. Fecha Sched', v: selectedOt.fechaInicio || 'Pendiente', c: 'text-amber-400 font-mono' },
                      { l: '9. Hora Inicio', v: '09:00 CLST', c: 'text-slate-400' },
                      { l: '10. Hora Término', v: selectedOt.hhEstimadas ? `${9 + Number(selectedOt.hhEstimadas)}:00 CLST` : '17:00 CLST' },
                      { l: '11. Estado Actual', v: selectedOt.estado, c: 'text-white font-black uppercase' },
                      { l: '12. HH Estimadas', v: `${selectedOt.hhEstimadas || 8} hrs`, c: 'text-emerald-400 font-bold' },
                      { l: '13. HH Reales', v: `${selectedOt.hhReales || 0} hrs`, c: 'text-amber-400 font-bold' },
                      { l: '14. Vehículo Flota', v: selectedOt.vehiculoAsignado || 'Toyota Hilux V01' },
                      { l: '15. Repuestos Checked', v: selectedOt.repuestosVerificados ? '✓ Confirmados' : '⚡ Requiere Revisión', c: selectedOt.repuestosVerificados ? 'text-emerald-400' : 'text-amber-400' },
                      { l: '16. Herramientas', v: 'Instrumentación completa OK', c: 'text-slate-400' },
                      { l: '17. AST Riesgos', v: selectedOt.astFirmado ? '✓ AST Firmado' : '⚠ Pendiente AST', c: selectedOt.astFirmado ? 'text-emerald-400 font-bold' : 'text-rose-400' },
                      { l: '18. GPS Telemetría', v: 'Transmitiendo (GPS Logístico Simulado)', c: 'text-cyan-400 font-bold' },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-900 text-xs">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold mb-1">{item.l}</span>
                        <span className={`block truncate ${item.c || 'text-slate-300'}`}>{item.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* General Observations */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold mb-1">19. Diagnóstico & Observaciones</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap bg-slate-950 p-3 rounded-lg border border-slate-900">
                      {selectedOt.observaciones || 'Sin observaciones registradas.'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 1: PLANIFICACIÓN (Edición Planificador) */}
              {lifecycleTab === 1 && (
                <div className="space-y-5 bg-slate-950/30 p-5 rounded-2xl border border-slate-850">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarCheck className="h-4 w-4 text-emerald-400" /> Planificación y Calendarización de Tareas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1.5">
                      <label className="text-slate-400">Fecha de Intervención</label>
                      <input
                        type="date"
                        value={selectedOt.fechaInicio || '2026-07-06'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, fechaInicio: val } : o);
                          if (onUpdateOts) onUpdateOts(updatedOts);
                          setSelectedOt({ ...selectedOt, fechaInicio: val });
                          saveToDbWorkspace(updatedOts);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-slate-400">HH Estimadas (Esfuerzo planificado)</label>
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={selectedOt.hhEstimadas || 8}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, hhEstimadas: val } : o);
                          if (onUpdateOts) onUpdateOts(updatedOts);
                          setSelectedOt({ ...selectedOt, hhEstimadas: val });
                          saveToDbWorkspace(updatedOts);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400">Prioridad Operativa</label>
                      <select
                        value={selectedOt.prioridad}
                        onChange={(e) => {
                          const val = e.target.value as OTPrioridad;
                          const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, prioridad: val } : o);
                          if (onUpdateOts) onUpdateOts(updatedOts);
                          setSelectedOt({ ...selectedOt, prioridad: val });
                          saveToDbWorkspace(updatedOts);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                      >
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                        <option value="Crítica">Crítica</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400">Estado de Sincronización</label>
                      <select
                        value={selectedOt.estado}
                        onChange={(e) => {
                          const val = e.target.value as OTEstado;
                          const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, estado: val } : o);
                          if (onUpdateOts) onUpdateOts(updatedOts);
                          setSelectedOt({ ...selectedOt, estado: val });
                          saveToDbWorkspace(updatedOts);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                      >
                        <option value="Nueva">Nueva</option>
                        <option value="Programada">Programada</option>
                        <option value="En preparación">En preparación</option>
                        <option value="En ruta">En ruta</option>
                        <option value="En terreno">En terreno</option>
                        <option value="En ejecución">En ejecución</option>
                        <option value="Bloqueada">Bloqueada</option>
                        <option value="Finalizada">Finalizada</option>
                        <option value="Cerrada">Cerrada</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-900/30 p-4 rounded-xl text-xs leading-relaxed text-emerald-400 font-mono">
                    <strong>✓ Planificación Sincronizada con ORBI Insight Center</strong>. Los cambios realizados en esta pestaña se actualizarán en tiempo real en los indicadores ejecutivos de Jefatura O&M, el calendario operacional, y los reportes de rendimiento.
                  </div>
                </div>
              )}

              {/* TAB 2: PERSONAS (Recursos Humanos) */}
              {lifecycleTab === 2 && (
                <div className="space-y-5">
                  <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-400" /> Dotación y Personal Técnico Asignado
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                      <div className="space-y-1.5">
                        <label className="text-slate-500">Coordinador Operacional</label>
                        <select
                          value={selectedOt.coordinador || 'Rodolfo Garcés'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, coordinador: val } : o);
                            if (onUpdateOts) onUpdateOts(updatedOts);
                            setSelectedOt({ ...selectedOt, coordinador: val });
                            saveToDbWorkspace(updatedOts);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                        >
                          {coordinadoresUnicos.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-500">Supervisor de Terreno</label>
                        <select
                          value={selectedOt.supervisor || 'Alejandro Rojas'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, supervisor: val } : o);
                            if (onUpdateOts) onUpdateOts(updatedOts);
                            setSelectedOt({ ...selectedOt, supervisor: val });
                            saveToDbWorkspace(updatedOts);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                        >
                          {supervisoresUnicos.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-500">Técnico Líder (Ejecución)</label>
                        <select
                          value={selectedOt.responsable || 'Cristián Barraza'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, responsable: val } : o);
                            if (onUpdateOts) onUpdateOts(updatedOts);
                            setSelectedOt({ ...selectedOt, responsable: val });
                            saveToDbWorkspace(updatedOts);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                        >
                          {tecnicosUnicos.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-2">
                      <span className="text-[10px] font-mono text-indigo-400 block font-bold uppercase">Perfil del Supervisor Asignado</span>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-900/40 flex items-center justify-center font-black text-sm">
                          AR
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-white block">{selectedOt.supervisor || 'Alejandro Rojas'}</span>
                          <span className="text-slate-500 font-mono text-[10px]">Supervisor O&M • 12 OTs asignadas hoy</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-2">
                      <span className="text-[10px] font-mono text-emerald-400 block font-bold uppercase">Perfil del Técnico Ejecutor</span>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-900/40 flex items-center justify-center font-black text-sm">
                          CB
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-white block">{selectedOt.responsable || 'Cristián Barraza'}</span>
                          <span className="text-slate-500 font-mono text-[10px]">Técnico Electricista SEC Clase A • Habilitado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LOGÍSTICA (Control de Flotas) */}
              {lifecycleTab === 3 && (
                <div className="space-y-5">
                  <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-indigo-400" /> Vehículo, Estado de Ruta y Telemetría Logística
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5 font-normal">(Datos Operacionales Simulados)</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-1.5">
                        <label className="text-slate-400">Vehículo Asignado a la Cuadrilla</label>
                        <select
                          value={selectedOt.vehiculoAsignado || 'Toyota Hilux V01'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, vehiculoAsignado: val } : o);
                            if (onUpdateOts) onUpdateOts(updatedOts);
                            setSelectedOt({ ...selectedOt, vehiculoAsignado: val });
                            saveToDbWorkspace(updatedOts);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                        >
                          <option value="Toyota Hilux V01">Toyota Hilux V01 [PP-LL-44]</option>
                          <option value="Camioneta O&M-01">Camioneta O&M-01 [AB-CD-12] - Eléctrica (Simulada)</option>
                          <option value="Camioneta O&M-02">Camioneta O&M-02 [AB-CD-13] - Eléctrica (Simulada)</option>
                          <option value="Mitsubishi L200 V03">Mitsubishi L200 V03 [XY-ZZ-90]</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-400">Estado Logístico del Desplazamiento</label>
                        <select
                          value={selectedOt.estado}
                          onChange={(e) => {
                            const val = e.target.value as OTEstado;
                            const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, estado: val } : o);
                            if (onUpdateOts) onUpdateOts(updatedOts);
                            setSelectedOt({ ...selectedOt, estado: val });
                            saveToDbWorkspace(updatedOts);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                        >
                          <option value="Programada">Programada (En base)</option>
                          <option value="En ruta">En ruta (Desplazamiento)</option>
                          <option value="En terreno">En terreno (Llegada a Planta)</option>
                          <option value="En ejecución">En ejecución (Trabajando)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SIMULATED LOGISTICS TELEMETRY PREVIEW */}
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-indigo-400 block font-bold uppercase tracking-widest">
                        ⚡ TELEMETRÍA LOGÍSTICA SIMULADA (O&M BRIDGE)
                      </span>
                      <h4 className="text-sm font-black text-white">Camioneta O&M-01 [Batería 88% - Datos Simulados]</h4>
                      <p className="text-xs text-slate-400 font-mono">Consumo promedio: 0.18 kWh/km • Odómetro: 14,230 km (Simulado)</p>
                      <p className="text-[9px] text-slate-500 font-sans italic mt-1 leading-normal">
                        * Integraciones reales futuras con GPS, flota, SCADA, SharePoint, backend o APIs corporativas requerirán autorización formal de TI.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850 text-center min-w-[120px]">
                        <span className="text-slate-500 text-[9px] block">Ruta GPS activa</span>
                        <span className="text-emerald-400 font-bold block mt-0.5">Waze / Google Maps</span>
                      </div>
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850 text-center min-w-[120px]">
                        <span className="text-slate-500 text-[9px] block">ETA Estimado</span>
                        <span className="text-white font-bold block mt-0.5">14 Mins • OK</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: REPUESTOS & HERRAMIENTAS */}
              {lifecycleTab === 4 && (
                <div className="space-y-5">
                  <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-emerald-400" /> Confirmación de Materiales, Repuestos y Herramientas Especiales
                    </h3>

                    <p className="text-xs text-slate-400 font-mono">
                      Valide el stock y pre-reserva de repuestos indispensables para garantizar el éxito de la intervención de mantenimiento:
                    </p>

                    <div className="space-y-3">
                      {[
                        { name: 'Fusible Media Tensión 36kV 40A', qty: '3 Unidades', stat: 'Reservado y Cargado', checked: true },
                        { name: 'Módulo Inversor Sungrow SG250HX (Control)', qty: '1 Unidad', stat: 'En Bodega Planta Sg.', checked: true },
                        { name: 'Kit Terminales Termocontraíbles Raychem', qty: '2 Cajas', stat: 'Cargado en Camioneta', checked: false },
                        { name: 'Herramientas de Apriete Torcométrico Calibradas', qty: '1 Set', stat: 'Asignado a Técnico', checked: true },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={item.checked} 
                              readOnly
                              className="h-4 w-4 bg-slate-900 border-slate-800 rounded text-emerald-500 focus:ring-emerald-500"
                            />
                            <div className="text-xs">
                              <span className="text-white font-bold block">{item.name}</span>
                              <span className="text-slate-500 font-mono text-[10px]">{item.qty} • Estado: {item.stat}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                            item.checked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-950' : 'bg-amber-500/10 text-amber-400 border border-amber-950'
                          }`}>
                            {item.checked ? 'Confirmado' : 'Pendiente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: EJECUCIÓN TERRENO (Rendimiento técnico) */}
              {lifecycleTab === 5 && (
                <div className="space-y-5">
                  <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-amber-400" /> Control de Avance de Tareas y Reporte de HH Reales
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-1.5">
                        <label className="text-slate-400">Porcentaje de Avance Físico (%)</label>
                        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={selectedOt.progreso || 0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, progreso: val } : o);
                              if (onUpdateOts) onUpdateOts(updatedOts);
                              setSelectedOt({ ...selectedOt, progreso: val });
                              saveToDbWorkspace(updatedOts);
                            }}
                            className="w-full accent-indigo-500 h-1.5 rounded-lg cursor-pointer"
                          />
                          <span className="text-white font-bold min-w-[40px] text-right">{selectedOt.progreso || 0}%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-400">Horas Hombre Reales Consumidas</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={selectedOt.hhReales || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, hhReales: val } : o);
                            if (onUpdateOts) onUpdateOts(updatedOts);
                            setSelectedOt({ ...selectedOt, hhReales: val });
                            saveToDbWorkspace(updatedOts);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Checklist Section */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-3 text-xs font-mono">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Listado de Pasos de Mantenimiento</span>
                    {[
                      { l: 'Verificación visual e inspección termográfica inicial del inversor.', d: 'Registrado con termografía FLIR' },
                      { l: 'Limpieza de filtros de aire y revisión de ventiladores.', d: 'Ventilador 3 soplado y lubricado' },
                      { l: 'Ajuste de torque de conexiones eléctricas AC y DC.', d: 'Torcometrado al 100% según manual fabricante' },
                      { l: 'Medición de resistencia de aislamiento (Meggerizado) de strings.', d: 'Aislamiento promedio > 1.2 GigaOhmios (OK)' },
                      { l: 'Pruebas funcionales de desconexión y reconexión segura.', d: 'Sincronizado a red en 120s' },
                    ].map((step, sidx) => (
                      <div key={sidx} className="flex justify-between items-start bg-slate-950/90 p-3 rounded-lg border border-slate-900">
                        <div className="flex gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-slate-200 font-bold">{step.l}</p>
                            <p className="text-[10px] text-slate-500 italic mt-0.5">{step.d}</p>
                          </div>
                        </div>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-950/40 px-1.5 py-0.5 rounded font-bold uppercase">
                          Completado
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: EVIDENCIAS */}
              {lifecycleTab === 6 && (
                <div className="space-y-5">
                  <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-400" /> Registro Fotográfico e Historial de Terreno
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { title: 'Evidencia 1: Antes del Trabajo', desc: 'Módulo inversor obstruido por polvo y vegetación.', url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
                        { title: 'Evidencia 2: Durante el Mantenimiento', desc: 'Medición de tensiones y reemplazo de fusibles en strings.', url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
                        { title: 'Evidencia 3: Después del Trabajo', desc: 'Módulo despejado, soplado y operando a potencia nominal.', url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3' },
                      ].map((img, i) => (
                        <div key={i} className="bg-slate-950 rounded-xl overflow-hidden border border-slate-900 group">
                          <img 
                            src={img.url} 
                            alt={img.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="p-3 text-xs font-mono space-y-1 bg-slate-950">
                            <span className="font-bold text-white block">{img.title}</span>
                            <p className="text-[10px] text-slate-500 leading-normal">{img.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: HSE & SEGURIDAD (Análisis AST) */}
              {lifecycleTab === 7 && (
                <div className="space-y-5">
                  <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-850 space-y-4">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-rose-400" /> Seguridad, Salud & Medioambiente (AST Checklist)
                    </h3>

                    <p className="text-xs text-slate-400 font-mono">
                      La seguridad es nuestro pilar fundamental. Todo el personal de cuadrilla debe validar el AST — Análisis Seguro de Trabajo antes de energizar e intervenir:
                    </p>

                    <div className="space-y-3">
                      {[
                        { title: 'Uso de EPP Dieléctrico / Calzado con protección', req: 'Requerido para arco eléctrico', status: 'Verificado', active: true },
                        { title: 'Bloqueo, Etiquetado e Interruptores LOTO ejecutados', req: 'Garantía de ausencia de tensión', status: 'Verificado', active: true },
                        { title: 'Charla de 5 Minutos sobre Riesgos de Altas Temperaturas', req: 'Realizada en camión O&M antes de bajar', status: 'Verificado', active: true },
                        { title: 'Uso de detector de tensión calibrado en sitio', req: 'Inspección de puntos calientes', status: 'Verificado', active: true },
                      ].map((hse, idx) => (
                        <div key={idx} className="bg-slate-950/95 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center text-xs font-mono">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <div>
                              <span className="text-white font-bold block">{hse.title}</span>
                              <span className="text-[10px] text-slate-500">{hse.req}</span>
                            </div>
                          </div>
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-950 px-2 py-0.5 rounded font-black uppercase text-[9px]">
                            {hse.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: HISTORIAL DE CAMBIOS (Audit Log de esta OT) */}
              {lifecycleTab === 8 && (
                <div className="space-y-4 bg-slate-950/30 p-5 rounded-2xl border border-slate-850">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <History className="h-4 w-4 text-indigo-400" /> Trazabilidad de Auditoría Operacional de la OT
                  </h3>

                  <p className="text-xs text-slate-400 font-mono">
                    Registros y marcas de tiempo de auditoría inmutables vinculados a la orden de trabajo {selectedOt.codigo}:
                  </p>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {[
                      { date: '2026-07-06 08:45', action: 'Creación de Orden de Trabajo', user: 'Planificación O&M', detail: 'Órden generada automáticamente a partir del plan predictivo anual.' },
                      { date: '2026-07-06 09:12', action: 'Asignación de Recursos', user: 'Rodolfo Garcés', detail: 'Se asignó el vehículo Toyota Hilux V01 y técnico Cristián Barraza.' },
                      { date: '2026-07-06 10:30', action: 'AST Inicial Verificado', user: 'Alejandro Rojas', detail: 'Supervisor firmó checklist AST en terreno, autorizando el bloqueo de celdas.' },
                      { date: '2026-07-06 14:15', action: 'Actualización de Avance', user: 'Cristián Barraza', detail: `Progreso modificado a ${selectedOt.progreso || 0}% desde tablet O&M.` },
                    ].map((historyLog, hidx) => (
                      <div key={hidx} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-900 text-xs font-mono space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-400 font-bold">{historyLog.action}</span>
                          <span className="text-[10px] text-slate-500">{historyLog.date}</span>
                        </div>
                        <p className="text-slate-300 leading-normal">{historyLog.detail}</p>
                        <span className="text-[10px] text-slate-600 block">Operado por: {historyLog.user}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 9: CIERRE Y FIRMAS */}
              {lifecycleTab === 9 && (
                <div className="space-y-5 bg-slate-950/30 p-5 rounded-2xl border border-slate-850">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-emerald-400" /> Cierre Técnico y Administrativo de Actividad
                  </h3>

                  <div className="space-y-4 text-xs font-mono">
                    <div className="space-y-1.5">
                      <label className="text-slate-400">Comentarios de Cierre Operacional</label>
                      <textarea
                        value={selectedOt.comentariosCierre || ''}
                        placeholder="Escriba los comentarios finales sobre el cierre del mantenimiento..."
                        rows={3}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, comentariosCierre: val } : o);
                          if (onUpdateOts) onUpdateOts(updatedOts);
                          setSelectedOt({ ...selectedOt, comentariosCierre: val });
                          saveToDbWorkspace(updatedOts);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500 font-mono resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Firma de Conformidad del Cliente (Digital)</span>
                        <div className="h-20 bg-slate-900 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-600 italic">
                          {selectedOt.firmaCierre ? (
                            <span className="text-emerald-400 font-bold font-mono">✓ FIRMA DIGITALIZADA: SEC_VERIFY_{selectedOt.codigo}</span>
                          ) : (
                            <span>Firmar sobre la pantalla</span>
                          )}
                        </div>
                        {!selectedOt.firmaCierre && (
                          <button
                            onClick={() => {
                              const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, firmaCierre: `SEC_VERIFY_${selectedOt.codigo}` } : o);
                              if (onUpdateOts) onUpdateOts(updatedOts);
                              setSelectedOt({ ...selectedOt, firmaCierre: `SEC_VERIFY_${selectedOt.codigo}` });
                              saveToDbWorkspace(updatedOts);
                            }}
                            className="w-full py-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-slate-950 text-[10px] rounded font-bold transition-all"
                          >
                            Simular Firma Electrónica
                          </button>
                        )}
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">Estado Administrativo</span>
                          <span className="text-white font-black block text-sm">
                            {selectedOt.estado === 'Cerrada' ? '✓ CERRADA Y ARCHIVADA' : '⚡ PENDIENTE DE CIERRE'}
                          </span>
                        </div>

                        <div className="flex gap-2 mt-4">
                          {selectedOt.estado !== 'Finalizada' && selectedOt.estado !== 'Cerrada' && (
                            <button
                              onClick={() => {
                                const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, estado: 'Finalizada' as OTEstado, progreso: 100 } : o);
                                if (onUpdateOts) onUpdateOts(updatedOts);
                                setSelectedOt({ ...selectedOt, estado: 'Finalizada' as OTEstado, progreso: 100 });
                                saveToDbWorkspace(updatedOts);
                                if (onAddAuditLog) {
                                  onAddAuditLog(
                                    'OT Finalizada',
                                    'ORBI Workspace',
                                    selectedOt.codigo,
                                    selectedOt.plantaNombre,
                                    `La OT ${selectedOt.codigo} se marcó como Finalizada (100% avance) por ${username}.`,
                                    selectedOt.prioridad
                                  );
                                }
                              }}
                              className="w-full py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                            >
                              Finalizar OT (100%)
                            </button>
                          )}
                          {selectedOt.estado === 'Finalizada' && (
                            <button
                              onClick={() => {
                                const updatedOts = ots.map(o => o.codigo === selectedOt.codigo ? { ...o, estado: 'Cerrada' as OTEstado } : o);
                                if (onUpdateOts) onUpdateOts(updatedOts);
                                setSelectedOt({ ...selectedOt, estado: 'Cerrada' as OTEstado });
                                saveToDbWorkspace(updatedOts);
                                if (onAddAuditLog) {
                                  onAddAuditLog(
                                    'OT Cerrada',
                                    'ORBI Workspace',
                                    selectedOt.codigo,
                                    selectedOt.plantaNombre,
                                    `La OT ${selectedOt.codigo} se cerró administrativamente por ${username}.`,
                                    selectedOt.prioridad
                                  );
                                }
                              }}
                              className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors"
                            >
                              Cerrar Administrativamente
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-850 flex items-center justify-between">
              <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                <Info className="h-4 w-4" /> Sincronización ininterrumpida con ORBI O&M Command Center
              </div>
              <button
                onClick={() => {
                  setShowProfessionalLifecycle(false);
                  setSelectedOt(null);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black font-mono text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/25 active:scale-95 transition-all"
              >
                Guardar y Cerrar Ciclo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PROGRAMADOR DE TRABAJO (Módulo 11B) */}
      <WorkspaceScheduleModal
        isOpen={isScheduling}
        onClose={() => {
          setIsScheduling(false);
          setSelectedOt(null);
        }}
        ot={selectedOt}
        plantas={plantas}
        username={username}
        onSave={handleWorkspaceScheduleSave}
      />
    </div>
  );
}
