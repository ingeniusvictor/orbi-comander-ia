/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Users,
  Sun,
  FileText,
  Smartphone,
  ShieldAlert,
  Calendar,
  Settings,
  Menu,
  X,
  UserCheck,
  Zap,
  RefreshCw,
  Cpu,
  Power,
  Clock,
  LogOut,
  ChevronDown,
  Award,
  BarChart2,
  Truck,
  Wrench,
  AlertTriangle,
  ClipboardList,
  Brain,
  Briefcase
} from 'lucide-react';

import {
  OrganigramaNode,
  Planta,
  OT,
  HSEFinding,
  PlanPreventivo,
  RoleType,
  Vehiculo,
  RecursoPersona,
  Repuesto,
  Herramienta,
  AuditLogEvent,
  Escalation,
  PTW
} from './types';

import {
  loadOrganigrama,
  saveOrganigrama,
  loadPlantas,
  savePlantas,
  loadOTs,
  saveOTs,
  loadHSECalidad,
  saveHSECalidad,
  loadPlanificacion,
  savePlanificacion,
  getActiveRole,
  saveActiveRole,
  getActiveUserName,
  ROLES_CONFIG,
  resetAllDatabases,
  loadVehiculos,
  saveVehiculos,
  loadRecursosPersonas,
  saveRecursosPersonas,
  loadRepuestos,
  saveRepuestos,
  loadHerramientas,
  saveHerramientas,
  loadAuditLog,
  saveAuditLog,
  loadEscalaciones,
  saveEscalaciones,
  loadPtws,
  savePtws
} from './data/db';

// Importar Vistas Operacionales
import HomeEjecutivo from './components/HomeEjecutivo';
import Organigrama from './components/Organigrama';
import Zonas from './components/Zonas';
import MatrizPlantas from './components/MatrizPlantas';
import OTManager from './components/OTManager';
import VistaTerreno from './components/VistaTerreno';
import HSECalidad from './components/HSECalidad';
import Workspace from './components/Workspace';
import InsightCenter from './components/InsightCenter';

// Nuevas Vistas del Parche v0.1.1C
import FlotaLogistica from './components/FlotaLogistica';
import OrbiFleetStandaloneShell from './features/fleet/app/OrbiFleetStandaloneShell';
import PeopleResource from './components/PeopleResource';
import RepuestosHerramientas from './components/RepuestosHerramientas';
import EscalationCenter from './components/EscalationCenter';
import AuditLog from './components/AuditLog';
import FotonPrime from './components/FotonPrime';
import PTWCenter from './components/PTWCenter';
import DemoReadiness from './components/DemoReadiness';
import ExecutiveDemoHub from './components/ExecutiveDemoHub';

export default function App() {
  // Bases de datos reactivas
  const [organigrama, setOrganigrama] = useState<OrganigramaNode[]>([]);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [ots, setOts] = useState<OT[]>([]);
  const [findings, setFindings] = useState<HSEFinding[]>([]);
  const [planificacion, setPlanificacion] = useState<PlanPreventivo[]>([]);

  // Nuevas bases de datos reactivas del parche v0.1.1C
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [recursosPersonas, setRecursosPersonas] = useState<RecursoPersona[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>([]);
  const [escalaciones, setEscalaciones] = useState<Escalation[]>([]);
  const [ptws, setPtws] = useState<PTW[]>([]);

  // Estado de sesión y simulación de roles
  const [userRole, setUserRole] = useState<string>('JEFE_OM');
  const [userName, setUserName] = useState<string>('Felipe Soto');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState<boolean>(false);

  // Navegación y filtros profundos entre componentes
  const [activeView, setActiveView] = useState<string>('Home');
  const [passedFilters, setPassedFilters] = useState<any>(null);

  // Menú lateral móvil
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Hora del sistema (Estática de la telemetría O&M o dinámica)
  const [systemTime, setSystemTime] = useState<string>('');

  // 1. Inicialización y carga de bases de datos persistentes
  useEffect(() => {
    setOrganigrama(loadOrganigrama());
    setPlantas(loadPlantas());
    setOts(loadOTs());
    setFindings(loadHSECalidad());
    setPlanificacion(loadPlanificacion());

    // Carga de nuevas tablas v0.1.1C
    setVehiculos(loadVehiculos());
    setRecursosPersonas(loadRecursosPersonas());
    setRepuestos(loadRepuestos());
    setHerramientas(loadHerramientas());
    setAuditLogs(loadAuditLog());
    setEscalaciones(loadEscalaciones());
    setPtws(loadPtws());

    const savedRole = getActiveRole();
    setUserRole(savedRole);
    setUserName(getActiveUserName());

    // Hora de sistema formateada
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleString('es-CL', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper para registro inmutable en ORBI Audit Log
  const addAuditLogEvent = (
    accion: string,
    modulo: string,
    otCode?: string,
    plantaName?: string,
    comentario?: string,
    criticidad: 'Baja' | 'Media' | 'Alta' | 'Crítica' = 'Baja'
  ) => {
    const newEvent: AuditLogEvent = {
      id: `EV-${Date.now().toString().substring(6)}`,
      fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 16),
      usuarioRol: `${userName} (${ROLES_CONFIG[userRole]?.title || userRole})`,
      accion,
      moduloOrigen: modulo,
      otVinculada: otCode,
      plantaVinculada: plantaName,
      comentario: comentario || '',
      criticidad
    };
    const updated = [newEvent, ...auditLogs];
    setAuditLogs(updated);
    saveAuditLog(updated);
  };

  // 2. Sincronización automática de bases de datos reactivas con localStorage
  const handleUpdateOrganigrama = (updated: OrganigramaNode[]) => {
    setOrganigrama(updated);
    saveOrganigrama(updated);
  };

  const handleUpdatePlantas = (updated: Planta[]) => {
    setPlantas(updated);
    savePlantas(updated);
  };

  const handleUpdateOts = (updated: OT[]) => {
    setOts(updated);
    saveOTs(updated);
  };

  const handleUpdateFindings = (updated: HSEFinding[]) => {
    setFindings(updated);
    saveHSECalidad(updated);
  };

  const handleUpdatePlanificacion = (updated: PlanPreventivo[]) => {
    setPlanificacion(updated);
    savePlanificacion(updated);
  };

  const handleUpdateVehiculos = (updated: Vehiculo[]) => {
    setVehiculos(updated);
    saveVehiculos(updated);
  };

  const handleUpdateRecursosPersonas = (updated: RecursoPersona[]) => {
    setRecursosPersonas(updated);
    saveRecursosPersonas(updated);
  };

  const handleUpdateRepuestos = (updated: Repuesto[]) => {
    setRepuestos(updated);
    saveRepuestos(updated);
  };

  const handleUpdateHerramientas = (updated: Herramienta[]) => {
    setHerramientas(updated);
    saveHerramientas(updated);
  };

  const handleUpdateEscalaciones = (updated: Escalation[]) => {
    setEscalaciones(updated);
    saveEscalaciones(updated);
  };

  const handleUpdatePtws = (updated: PTW[]) => {
    setPtws(updated);
    savePtws(updated);
  };

  // Cambio de identidad (Role Switcher)
  const handleRoleChange = (roleId: RoleType) => {
    saveActiveRole(roleId);
    setUserRole(roleId);
    
    // Buscar nombre del rol en organigrama
    const org = loadOrganigrama();
    const match = org.find(u => u.role === roleId);
    if (match) {
      setUserName(match.name);
    } else {
      setUserName('Usuario Demostración');
    }

    // Redireccionar a vista sugerida por el rol
    const rConfig = ROLES_CONFIG[roleId];
    if (rConfig && rConfig.suggestedView) {
      setActiveView(rConfig.suggestedView);
    }

    setIsRoleDropdownOpen(false);
  };

  // Rutas profundas (Deep Linking) con filtros
  const handleNavigateWithFilters = (view: string, filters?: any) => {
    setActiveView(view);
    setPassedFilters(filters || null);
    setIsSidebarOpen(false);
  };

  // Secciones agrupadas para el menú lateral
  const menuSections = [
    {
      title: 'Mando O&M',
      items: [
        { id: 'Home', label: 'Home Jefatura O&M', icon: Cpu },
        { id: 'OTs', label: 'ORBI OT Center', icon: FileText },
        { id: 'Workspace', label: 'ORBI Workspace', icon: Calendar },
        { id: 'BI', label: 'ORBI Insight Center', icon: BarChart2 },
      ]
    },
    {
      title: 'Ejecución & Terreno',
      items: [
        { id: 'Terreno', label: 'Vista Terreno', icon: Smartphone },
        { id: 'Organigrama', label: 'Organigrama O&M', icon: Users },
        { id: 'Zonas', label: 'Zonas Operacionales', icon: Layers },
        { id: 'Plantas', label: 'Matriz de Plantas', icon: Sun },
      ]
    },
    {
      title: 'Logística & Bodega',
      items: [
        { id: 'Flota', label: 'Control de Flota & Logística', icon: Truck },
        { id: 'Repuestos', label: 'Repuestos & Herramientas', icon: Wrench },
        { id: 'People', label: 'People & Resource Center', icon: Briefcase },
      ]
    },
    {
      title: 'Gobernanza & Seguridad',
      items: [
        { id: 'Escalaciones', label: 'Risk & Escalation Center', icon: AlertTriangle },
        { id: 'HSE', label: 'HSE & Quality Bridge', icon: ShieldAlert },
        { id: 'AuditLog', label: 'ORBI Audit Log', icon: ClipboardList },
        { id: 'Gobernanza', label: 'Gobernanza ORBI', icon: Award },
      ]
    },
    {
      title: 'Análisis O&M',
      items: [
        { id: 'FotonPrime', label: 'FOTON PRIME O&M IA', icon: Brain },
        { id: 'DemoHub', label: 'ORBI Executive Demo Hub', icon: Award },
        { id: 'DemoReadiness', label: 'Release & Demo Center', icon: Cpu },
        { id: 'Configuracion', label: 'Configuración', icon: Settings },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* HEADER SUPERIOR */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white lg:hidden transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Zap className="h-5 w-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 block leading-none">ORBI ECOSISTEMA</span>
              <h1 className="text-sm font-black text-white tracking-tight leading-normal">O&M Command Center</h1>
            </div>
          </div>
        </div>

        {/* CONTROLES EJECUTIVOS DE SESIÓN */}
        <div className="flex items-center gap-3">
          {/* Hora del Sistema */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-950/40 border border-slate-900 px-3 py-1.5 rounded-lg">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{systemTime || 'Telemetría Sincronizada'}</span>
          </div>

          {/* Selector de Roles Integrado */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 flex items-center gap-2 text-xs font-semibold text-slate-300 transition-colors shadow-inner"
              id="role-selector-button"
            >
              <UserCheck className="h-4 w-4 text-emerald-400" />
              <div className="text-left hidden sm:block">
                <div className="text-[9px] text-slate-500 leading-none">IDENTIDAD ACTIVA</div>
                <div className="text-xs font-bold text-white truncate max-w-[120px]">{userName}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 max-h-[80vh] overflow-y-auto">
                <div className="px-4 py-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white">Simulador de Roles O&M</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Permite validar vistas sugeridas y permisos visuales.</p>
                </div>

                {Object.keys(ROLES_CONFIG).map((rk) => {
                  const roleConfig = ROLES_CONFIG[rk];
                  const isCurrent = userRole === rk;
                  return (
                    <button
                      key={rk}
                      onClick={() => handleRoleChange(rk as RoleType)}
                      className={`w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-950 transition-colors ${
                        isCurrent ? 'bg-slate-950/60' : ''
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-200">{roleConfig.title}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[190px]">{roleConfig.scope}</div>
                      </div>
                      {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>}
                    </button>
                  );
                })}

                <div className="p-2 border-t border-slate-800 mt-2">
                  <button
                    onClick={resetAllDatabases}
                    className="w-full py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 text-xs font-bold font-mono rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Resetear Base Simulada
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL DEL PANEL */}
      <div className="flex-1 flex relative">
        
        {/* SIDEBAR NAVEGACIÓN DESKTOP & MOBILE */}
        <aside
          className={`bg-slate-900/40 border-r border-slate-800/80 w-64 flex flex-col justify-between p-4 z-30 transition-all duration-300 ${
            isSidebarOpen
              ? 'fixed inset-y-0 left-0 bg-slate-900 w-64'
              : 'hidden lg:flex'
          }`}
        >
          {/* Botón de cierre para celular */}
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 p-1 rounded-lg border border-slate-850 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="space-y-5 overflow-y-auto pr-1 flex-1 max-h-[calc(100vh-140px)] custom-scrollbar">
            {menuSections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <div className="text-[9px] font-mono tracking-widest text-slate-500 uppercase px-2 font-black border-b border-slate-900 pb-1">{section.title}</div>
                <nav className="space-y-0.5">
                  {section.items.filter((item) => {
                    if (item.id === 'DemoReadiness' || item.id === 'DemoHub') {
                      return ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'SUPERVISOR_TERRENO', 'COORDINADOR_OM'].includes(userRole);
                    }
                    return true;
                  }).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        title={item.label}
                        onClick={() => {
                          setActiveView(item.id);
                          setPassedFilters(null);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium font-mono tracking-wide transition-all ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Información de la Configuración y Seguridad */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900">
            <span className="text-[9px] font-mono text-emerald-400 block mb-1 uppercase tracking-wider">Mapeo de Integración</span>
            <p className="text-[10px] text-slate-500 leading-normal mb-2">
              Bases de datos estructuradas e independientes preparadas para conexión persistente remota.
            </p>
            <div className="flex flex-wrap gap-1 text-[8px] font-mono">
              <span className="bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-850">LocalState</span>
              <span className="bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-850">Firebase Ready</span>
            </div>
          </div>
        </aside>

        {/* AREA DE CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {activeView === 'Home' && (
            <HomeEjecutivo
              plantas={plantas}
              ots={ots}
              findings={findings}
              onNavigate={handleNavigateWithFilters}
              vehiculos={vehiculos}
              recursosPersonas={recursosPersonas}
              repuestos={repuestos}
              herramientas={herramientas}
              escalaciones={escalaciones}
              userRole={userRole}
            />
          )}

          {activeView === 'Organigrama' && (
            <Organigrama
              organigrama={organigrama}
              onUpdate={handleUpdateOrganigrama}
              userRole={userRole}
            />
          )}

          {activeView === 'Zonas' && (
            <Zonas
              plantas={plantas}
              ots={ots}
              organigrama={organigrama}
              onNavigate={handleNavigateWithFilters}
            />
          )}

          {activeView === 'Plantas' && (
            <MatrizPlantas
              plantas={plantas}
              organigrama={organigrama}
              onUpdate={handleUpdatePlantas}
              userRole={userRole}
              initialFilters={passedFilters}
            />
          )}

          {activeView === 'OTs' && (
            <OTManager
              ots={ots}
              plantas={plantas}
              organigrama={organigrama}
              onUpdate={handleUpdateOts}
              userRole={userRole}
              initialFilters={passedFilters}
              onAddAuditLog={addAuditLogEvent}
              escalaciones={escalaciones}
              onUpdateEscalaciones={handleUpdateEscalaciones}
              vehiculos={vehiculos}
              onUpdateVehiculos={handleUpdateVehiculos}
              recursosPersonas={recursosPersonas}
              onUpdateRecursosPersonas={handleUpdateRecursosPersonas}
              repuestos={repuestos}
              onUpdateRepuestos={handleUpdateRepuestos}
              herramientas={herramientas}
              onUpdateHerramientas={handleUpdateHerramientas}
              planificacion={planificacion}
              onUpdatePlanificacion={handleUpdatePlanificacion}
              activeUserName={userName}
              ptws={ptws}
              onUpdatePtws={handleUpdatePtws}
            />
          )}

          {activeView === 'Terreno' && (
            <VistaTerreno
              ots={ots}
              plantas={plantas}
              onUpdateOts={handleUpdateOts}
              activeUserName={userName}
              userRole={userRole}
              onAddAuditLog={addAuditLogEvent}
              escalaciones={escalaciones}
              onUpdateEscalaciones={handleUpdateEscalaciones}
              repuestos={repuestos}
              onUpdateRepuestos={handleUpdateRepuestos}
              herramientas={herramientas}
              onUpdateHerramientas={handleUpdateHerramientas}
            />
          )}

          {activeView === 'HSE' && (
            <HSECalidad
              findings={findings}
              plantas={plantas}
              organigrama={organigrama}
              onUpdate={handleUpdateFindings}
              userRole={userRole}
            />
          )}

          {activeView === 'Workspace' && (
            <Workspace
              planificacion={planificacion}
              plantas={plantas}
              ots={ots}
              onUpdate={handleUpdatePlanificacion}
              onUpdateOts={handleUpdateOts}
              userRole={userRole}
              vehiculos={vehiculos}
              recursos={recursosPersonas}
              repuestos={repuestos}
              herramientas={herramientas}
              escalas={escalaciones}
              onAddAuditLog={addAuditLogEvent}
              username={userName}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'BI' && (
            <InsightCenter
              plantas={plantas}
              ots={ots}
              findings={findings}
              planificacion={planificacion}
              vehiculos={vehiculos}
              recursosPersonas={recursosPersonas}
              repuestos={repuestos}
              herramientas={herramientas}
              escalaciones={escalaciones}
              onNavigate={handleNavigateWithFilters}
              initialFilters={passedFilters}
            />
          )}

          {activeView === 'Gobernanza' && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20">ORBI GOBERNANZA</span>
                  <span className="text-xs font-mono text-slate-500">Mapeo del Ecosistema ORBI</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                  <Award className="h-5.5 w-5.5 text-emerald-400" /> Gobernanza & Mapa del Ecosistema ORBI
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Estructura de gobernanza operacional y vinculación de sistemas inteligentes del ecosistema ORBI Energy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-3">
                  <span className="text-xs font-mono text-emerald-400 font-bold block uppercase border-b border-slate-900 pb-1.5">1. ORBI O&M COMMAND CENTER IA</span>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    Este software (v0.1.2C-QA — Closure Workflow Consistency Check). Actúa como la consola ejecutiva, agenda de Workspace e inteligencia analítica e insights para Jefatura, Coordinación y Supervisores O&M. Gestiona el flujo operacional, asignaciones de turnos, preventivos y correctivos de terreno.
                  </p>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20 inline-block">SISTEMA ACTIVO</span>
                </div>

                <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-900/60 space-y-3">
                  <span className="text-xs font-mono text-slate-500 font-bold block uppercase border-b border-slate-900/60 pb-1.5">2. ORBI LIVE CONTROL CENTER IA</span>
                  <p className="text-xs text-slate-500 leading-relaxed font-mono">
                    Próximo sistema en desarrollo. Destinado para operaciones en tiempo real 24/7, monitoreo activo de subestaciones, alarmas SCADA inmediatas, curvas de potencia en vivo e incidentes graves de interconexión con el Coordinador Eléctrico Nacional.
                  </p>
                  <span className="bg-slate-900 text-slate-500 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-850 inline-block">EN DISEÑO DE ARQUITECTURA</span>
                </div>

                <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-900/60 space-y-3">
                  <span className="text-xs font-mono text-slate-500 font-bold block uppercase border-b border-slate-900/60 pb-1.5">3. ORBI CORPORATE ASSISTANT</span>
                  <p className="text-xs text-slate-500 leading-relaxed font-mono">
                    Plataforma independiente del ecosistema de ORBI Energy para gestiones administrativas corporativas, recursos humanos, finanzas, contabilidad general y comunicaciones internas del personal de oficinas centrales.
                  </p>
                  <span className="bg-slate-900 text-slate-500 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-850 inline-block">VINCULADO VIA API</span>
                </div>
              </div>
            </div>
          )}

          {activeView === 'Flota' && (
            <OrbiFleetStandaloneShell userRole={userRole} />
          )}

          {activeView === 'Repuestos' && (
            <RepuestosHerramientas
              repuestos={repuestos}
              herramientas={herramientas}
              ots={ots}
              plantas={plantas}
              onUpdateRepuestos={handleUpdateRepuestos}
              onUpdateHerramientas={handleUpdateHerramientas}
              userRole={userRole}
              activeUserName={userName}
              onAddAuditLog={addAuditLogEvent}
              onUpdateOts={handleUpdateOts}
              escalaciones={escalaciones}
              onUpdateEscalaciones={handleUpdateEscalaciones}
            />
          )}

          {activeView === 'People' && (
            <PeopleResource
              personas={recursosPersonas}
              onUpdate={handleUpdateRecursosPersonas}
              userRole={userRole}
              ots={ots}
              onUpdateOts={handleUpdateOts}
              onAddAuditLog={addAuditLogEvent}
              escalaciones={escalaciones}
              onUpdateEscalaciones={handleUpdateEscalaciones}
            />
          )}

          {activeView === 'Escalaciones' && (
            <EscalationCenter
              escalaciones={escalaciones}
              ots={ots}
              plantas={plantas}
              onUpdate={handleUpdateEscalaciones}
              userRole={userRole}
              activeUserName={userName}
              onAddAuditLog={addAuditLogEvent}
              onUpdateOts={handleUpdateOts}
            />
          )}

          {activeView === 'AuditLog' && (
            <AuditLog
              logs={auditLogs}
            />
          )}

          {activeView === 'FotonPrime' && (
            <FotonPrime
              ots={ots}
              plantas={plantas}
              personas={recursosPersonas}
              vehiculos={vehiculos}
              repuestos={repuestos}
              herramientas={herramientas}
            />
          )}

          {activeView === 'DemoHub' && (
            <ExecutiveDemoHub
              onNavigate={handleNavigateWithFilters}
              userRole={userRole}
              activeUserName={userName}
              onAddAuditLog={addAuditLogEvent}
            />
          )}

          {activeView === 'DemoReadiness' && (
            <DemoReadiness
              ots={ots}
              plantas={plantas}
              userRole={userRole}
              activeUserName={userName}
              onUpdateOts={handleUpdateOts}
              onAddAuditLog={addAuditLogEvent}
              onNavigate={handleNavigateWithFilters}
            />
          )}

          {activeView === 'Configuracion' && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                <div>
                  <span className="bg-slate-500/10 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-500/20">CONFIGURACIÓN</span>
                  <span className="text-xs font-mono text-slate-500">Ajustes del Sistema</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                  <Settings className="h-5.5 w-5.5 text-slate-400" /> Ajustes y Gobernanza de Datos
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Control global de la base de datos simulada y variables de sesión del usuario.
                </p>
              </div>

              <div className="bg-slate-950 p-6 rounded-xl border border-slate-900 max-w-md space-y-4">
                <h3 className="text-sm font-bold text-white">Mantenimiento de Datos</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  Si experimenta problemas de consistencia con los datos o desea restablecer los valores simulados a sus valores originales, puede inicializar de nuevo la base de datos de localStorage.
                </p>
                <button
                  onClick={resetAllDatabases}
                  className="px-4 py-2 bg-rose-500 text-slate-950 text-xs font-bold font-mono rounded-lg hover:bg-rose-400 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" /> Resetear Base Simulada de Datos
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
