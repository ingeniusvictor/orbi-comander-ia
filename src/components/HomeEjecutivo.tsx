/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Layers,
  CheckSquare,
  Calendar,
  BarChart2,
  Award,
  Truck,
  ShieldAlert,
  ArrowRight,
  BookmarkCheck,
  UserCheck,
  Sun,
  Wrench,
  Users,
  Smartphone,
  Folder,
  Shield
} from 'lucide-react';
import { Planta, OT, HSEFinding, Vehiculo, RecursoPersona, Repuesto, Herramienta, Escalation } from '../types';

interface HomeEjecutivoProps {
  plantas: Planta[];
  ots: OT[];
  findings: HSEFinding[];
  onNavigate: (view: string) => void;
  vehiculos?: Vehiculo[];
  recursosPersonas?: RecursoPersona[];
  repuestos?: Repuesto[];
  herramientas?: Herramienta[];
  escalaciones?: Escalation[];
  userRole?: string;
}

export default function HomeEjecutivo({
  plantas,
  ots,
  findings,
  onNavigate,
  vehiculos = [],
  recursosPersonas = [],
  repuestos = [],
  herramientas = [],
  escalaciones = [],
  userRole = 'JEFE_OM',
}: HomeEjecutivoProps) {
  const [aiReportType, setAiReportType] = useState<'jefe' | 'gerencia' | 'logistica' | 'hse_kpis'>('jefe');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Simulated Decisions State
  const [decisions, setDecisions] = useState([
    {
      id: 'DEC-01',
      titulo: 'Equilibrar Carga Operativa: Transferir recursos de Zona Sur a Zona Centro',
      contexto: 'Francisco Jara (Zona Sur) registra 45% de carga, mientras que Alejandro Rojas (Centro) está al 82% con correctivos de transformadores.',
      accion: 'Movilizar 1 vehículo y 2 técnicos especialistas',
      estado: 'Pendiente',
      badge: 'Carga Laboral'
    },
    {
      id: 'DEC-02',
      titulo: 'Liberación de Stock Crítico: Aprobar flete aéreo express para repuestos Atacama Solar',
      contexto: 'Mantenimiento correctivo bloqueado en inversor de potencia INV-04 por falta de tarjeta controladora en bodega local.',
      accion: 'Liberar compra internacional directa express ($2,850 USD)',
      estado: 'Pendiente',
      badge: 'Logística'
    },
    {
      id: 'DEC-03',
      titulo: 'Escalamiento Técnico: Iniciar reclamo de garantía con fabricante de inversores',
      contexto: 'Pérdida de inyección diurna intermitente en Luz del Norte. Cumple 5 días sin solución de soporte del fabricante.',
      accion: 'Escalar a área legal y comercial de ORBI Energy',
      estado: 'Pendiente',
      badge: 'Calidad QA/QC'
    },
    {
      id: 'DEC-04',
      titulo: 'Liberar Bloqueo de Seguridad: Validar AST para normalizar líneas de vida',
      contexto: 'Hallazgo HSE abierto por falta de certificación anual en techos de inversores. Bloquea preventivos rutinarios.',
      accion: 'Aprobar plan de seguridad y certificar proveedor externo',
      estado: 'Pendiente',
      badge: 'HSE Bridge'
    }
  ]);

  const handleApproveDecision = (id: string) => {
    setDecisions(prev =>
      prev.map(d => (d.id === id ? { ...d, estado: 'Aprobado y Ejecutado' } : d))
    );
  };

  // O&M metrics calculations
  const totalPlantas = plantas.length;
  const plantasActivas = plantas.filter((p) => p.estado === 'Operacional').length;
  const mwpTotales = plantas.reduce((acc, p) => acc + p.mwp, 0).toFixed(1);
  
  const otsAbiertas = ots.filter(
    (ot) => ot.estado !== 'Cerrada' && ot.estado !== 'Finalizada' && ot.estado !== 'Cancelada'
  ).length;

  const correctivosCriticos = ots.filter(
    (ot) => ot.tipo === 'Correctiva' && ot.prioridad === 'Crítica' && ot.estado !== 'Cerrada' && ot.estado !== 'Finalizada'
  ).length;

  const otsVencidas = ots.filter(
    (ot) => {
      const isAbierta = ot.estado !== 'Cerrada' && ot.estado !== 'Finalizada' && ot.estado !== 'Cancelada';
      return isAbierta && ot.fechaLimite && new Date(ot.fechaLimite) < new Date('2026-07-06');
    }
  ).length;

  const otsBloqueadas = ots.filter(o => o.estado === 'Bloqueada' || o.bloqueada).length;

  // New modules calculations
  const totalVehiculos = vehiculos.length;
  const vehiculosEnRuta = vehiculos.filter(v => v.estado === 'En ruta').length;
  const vehiculosBloqueados = vehiculos.filter(v => v.estado === 'Bloqueado').length;
  const totalPersonas = recursosPersonas.length;
  const personasSobrecargadas = recursosPersonas.filter(p => p.cargaSemanal > 80 && p.activo).length;
  const recursosBloqueantes = repuestos.filter(r => r.estado === 'Bloqueando OT').length + herramientas.filter(h => h.estado === 'Bloqueando OT').length;
  const escalacionesActivas = escalaciones.filter(e => e.estado !== 'Resuelto' && e.estado !== 'Cerrado').length;

  const findingsHSEAbiertos = findings.filter((f) => f.tipo === 'HSE' && f.estado !== 'Cerrado').length;
  const findingsCalidadAbiertos = findings.filter((f) => f.tipo === 'Calidad' && f.estado !== 'Cerrado').length;
  const totalHallazgos = findingsHSEAbiertos + findingsCalidadAbiertos;

  // HH deviation
  const totalHHEstimadas = ots.reduce((acc, o) => acc + (o.hhEstimadas || 0), 0);
  const totalHHReales = ots.reduce((acc, o) => acc + (o.hhReales || 0), 0);
  const desviacionHH = totalHHReales - totalHHEstimadas;

  // SLA Cumplimiento
  const otsTerminadas = ots.filter((ot) => ot.estado === 'Cerrada' || ot.estado === 'Finalizada').length;
  const cumplimientoMensual = ots.length > 0 ? Math.round((otsTerminadas / ots.length) * 100) : 100;

  // Availability risks
  const plantasLimitadas = plantas.filter(p => p.estado === 'Limitada' || p.estado === 'Fuera de Servicio');
  const mwComprometidos = plantasLimitadas.reduce((acc, p) => acc + (p.estado === 'Fuera de Servicio' ? p.mwp : p.mwp * 0.4), 0).toFixed(1);

  // Dynamic AI report generator
  const generateAIReport = (type: 'jefe' | 'gerencia' | 'logistica' | 'hse_kpis') => {
    setIsGenerating(true);
    setTimeout(() => {
      let report = '';
      const limitadas = plantas.filter((p) => p.estado === 'Limitada').map((p) => p.name);
      const offline = plantas.filter((p) => p.estado === 'Fuera de Servicio').map((p) => p.name);

      switch (type) {
        case 'jefe':
          report = `### 👥 ANÁLISIS DE CARGA OPERATIVA - JEFE O&M IA

1. **Evaluación de Flujos de Trabajo:**
   * **Rodolfo Garcés (Coordinador Central):** Registra una ocupación operativa del **94% (Carga Crítica)** debido a la simultaneidad de planificaciones de preventivos mensuales y el seguimiento de correctivos.
   * **Supervisores en Planta:** Alejandro Rojas (Zona Centro) se encuentra al **82% de carga** atendiendo la restricción en Santiago Solar, mientras que Francisco Jara (Zona Sur) registra **45% de carga activa**.

2. **Diagnóstico de Cuellos de Botella:**
   La acumulación de OTs sin programar se debe al bloqueo logístico de repuestos críticos. El MTTR para fallas de inversores en Atacama Solar se ha extendido de un estándar de 4 horas a **12 horas acumuladas** por falta de componentes en bodega local.

3. **Recomendación Directiva:**
   Traspasar de forma temporal recursos del sur al centro (ver panel de decisiones en el Home) para agilizar las revisiones del transformador de Santiago Solar y balancear el cumplimiento operativo.`;
          break;

        case 'gerencia':
          report = `### 📊 REPORTE DE RIESGOS E IMPACTO COMERCIAL - DIRECCIÓN & GERENCIA

1. **Estado de Disponibilidad y SLA:**
   * El cumplimiento mensual de SLA de cierre de OTs se sitúa en **${cumplimientoMensual}%** (Meta contractual: 92.5%).
   * Capacidad de red fotovoltaica comprometida: **${mwComprometidos} MWp** debido a limitaciones en Santiago Solar y Luz del Norte.

2. **Evaluación Financiera de Desvíos:**
   La desconexión parcial del transformador en Santiago Solar genera pérdidas de generación de energía estimadas en **$12,400 USD diarios** según tarifas de contrato PPA indexadas. 

3. **Gobernanza de Calidad:**
   * Desviación acumulada de HH: **${desviacionHH > 0 ? '+' : ''}${desviacionHH} horas**. Se aprecia un sobreesfuerzo de mantenimiento correctivo que impacta el presupuesto de HH del trimestre en un 12%.
   * Sugerencia: Aprobar de inmediato la liberación de stock aduanero para el transformador.`;
          break;

        case 'logistica':
          report = `### 📦 CHECKLIST DE DESVÍOS OPERACIONALES Y LOGÍSTICA

1. **Estatus de Repuestos Bloqueantes:**
   * **Atacama Solar (OT-2026-01):** Tarjeta de control de inversor INV-04 sin existencias en Santiago. Tiempo estimado de aduana tradicional: 14 días.
   * **Santiago Solar (OT-2026-03):** Bobinas de cobre secundarias listas en puerto de Valparaíso. Pendiente de liberación de internación técnica de importación.

2. **Acciones Mitigatorias Logísticas:**
   * Iniciar compras locales de contingencia para instrumentación de menor escala.
   * Implementar la decisión de flete aéreo express para componentes menores, reduciendo el tránsito internacional de 14 a **3 días hábiles**.`;
          break;

        case 'hse_kpis':
          report = `### 🛡️ PUENTE DE SEGURIDAD HSE & KPIs DE CONTROL

1. **Mapeo de Riesgos HSE:**
   * Hallazgos de seguridad abiertos: **${findingsHSEAbiertos}**. 
   * Hallazgos de calidad abiertos: **${findingsCalidadAbiertos}**.
   * Principales riesgos de altura y arco eléctrico identificados en Atacama Solar.

2. **Cumplimiento de Protocolos:**
   * Tasa de aprobación previa de AST (Análisis de Seguridad en el Trabajo) en terreno: **96.8%**.
   * Observación pendiente: Se detectaron técnicos operando sin la certificación anual al día de arneses para techos inversores. Se aplicó detención temporal de trabajos hasta regularización de proveedor externo.`;
          break;
      }
      setAiResponse(report);
      setIsGenerating(false);
    }, 1000);
  };

  useEffect(() => {
    generateAIReport(aiReportType);
  }, [aiReportType, plantas, ots, findings]);

  return (
    <div className="space-y-6">
      
      {/* BANNER PRINCIPAL DE BIENVENIDA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-10 h-32 w-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">PLATAFORMA INDEPENDIENTE ORBI</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-1">
              ORBI O&M Command Center IA <span className="text-slate-400 font-normal">|</span> <span className="text-indigo-400 font-mono text-base font-medium">v0.12C-QA — Global Operations Shell</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Centro de mando para jefatura, coordinación y supervisión O&M. Integra planificación, terreno, órdenes de trabajo, recursos, logística, riesgos, BI y cierre documental.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
            <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
            <div className="font-mono text-right">
              <div className="text-[9px] text-slate-500 uppercase font-bold">Capacidad Red</div>
              <div className="text-sm font-bold text-white">{mwpTotales} MWp <span className="text-slate-400">Total</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ESTADO DEL ECOSISTEMA ORBI */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
              Estado del Ecosistema ORBI
            </span>
            <h3 className="text-sm font-extrabold text-white tracking-tight mt-1">
              Ecosistema Integrado de Control
            </h3>
            <p className="text-xs text-slate-400">
              Visualización y monitoreo de la arquitectura unificada de operaciones.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
            <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl text-center">
              <span className="text-[8px] font-mono text-slate-500 uppercase block">Plataforma Madre</span>
              <span className="text-xs font-bold text-white block mt-0.5 font-mono">ORBI O&amp;M Command Center IA</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl text-center">
              <span className="text-[8px] font-mono text-slate-500 uppercase block">Estado General</span>
              <span className="text-xs font-bold text-indigo-400 block mt-0.5 font-mono">Sandbox Ejecutivo / Demo Interna</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl text-center">
              <span className="text-[8px] font-mono text-slate-500 uppercase block">Módulo Operativo</span>
              <span className="text-xs font-bold text-emerald-400 block mt-0.5 font-mono">OT Center v0.X</span>
            </div>
            <div className="bg-slate-950/60 border border-teal-500/20 p-2.5 rounded-xl text-center">
              <span className="text-[8px] font-mono text-slate-500 uppercase block">Estado OT Center</span>
              <span className="text-xs font-bold text-teal-400 block mt-0.5 font-mono">FROZEN / FINAL RELEASE LOCK</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-900/60 flex flex-wrap gap-2 items-center text-[10px] font-mono text-slate-500">
          <span className="text-slate-400 font-bold">Módulos Conectados en Sandbox:</span>
          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-900 text-slate-300">Workspace</span>
          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-900 text-slate-300">Insight Center</span>
          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-900 text-slate-300">Vista Terreno</span>
          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-900 text-slate-300">Flota</span>
          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-900 text-slate-300">Repuestos</span>
          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-900 text-slate-300">People &amp; Resource</span>
          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-900 text-slate-300">Risk &amp; Escalation</span>
        </div>
      </div>

      {/* SPOTLIGHT DE MÓDULO CONGELADO — ORBI OT CENTER */}
      <div className="bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-900 border border-teal-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-mono font-bold tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/25 px-2 py-0.5 rounded uppercase">
              Módulo Congelado — OT Center v0.X
            </span>
            <span className="text-[9px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              FROZEN / FINAL RELEASE LOCK
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
            <BookmarkCheck className="h-4.5 w-4.5 text-teal-400" /> ORBI OT Center v0.X
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Órdenes de trabajo, agenda técnica, evidencias, PTW, inventario O&amp;M segmentado por planta, SharePoint Router y Report Center.
          </p>
        </div>
        <button
          onClick={() => onNavigate('OTs')}
          className="w-full sm:w-auto px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-mono text-xs font-black rounded-xl border border-teal-450 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-teal-500/10 group cursor-pointer"
        >
          <CheckSquare className="h-4 w-4 text-slate-950 group-hover:scale-110 transition-transform" />
          Abrir OT Center
        </button>
      </div>

      {/* QUICK ACCES TO WORKSPACE & INSIGHT CENTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigate('Workspace')}
          className="bg-gradient-to-br from-slate-900/60 to-slate-950 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-indigo-500/40 hover:from-slate-900 transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Ir a ORBI Workspace</h3>
            </div>
            <p className="text-xs text-slate-400 leading-normal max-w-sm">
              Calendario operativo y cuadrículas de programación. Define **CUÁNDO, DÓNDE y QUIÉN** ejecuta el mantenimiento.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </div>

        <div 
          onClick={() => onNavigate('BI')}
          className="bg-gradient-to-br from-slate-900/60 to-slate-950 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-emerald-500/40 hover:from-slate-900 transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Ir a ORBI Insight Center</h3>
            </div>
            <p className="text-xs text-slate-400 leading-normal max-w-sm">
              Inteligencia operativa y análisis de resultados. Mide **QUÉ RESULTADOS** se obtuvieron y reporta a Gerencia.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* COMPREHENSIVE O&M KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div 
          onClick={() => onNavigate('Plantas')}
          className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-slate-850 cursor-pointer transition-all"
        >
          <span className="text-[10px] font-mono text-slate-500 block uppercase">PLANTAS EN ALERTA</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {plantasLimitadas.length} <span className="text-xs text-slate-500">de {totalPlantas}</span>
          </div>
          <span className="text-[9px] text-amber-500 font-mono block mt-2">Potencia: {mwComprometidos} MWp Riesgo</span>
        </div>

        <div 
          onClick={() => onNavigate('OTs')}
          className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-slate-850 cursor-pointer transition-all"
        >
          <span className="text-[10px] font-mono text-slate-500 block uppercase">OTs ACTIVAS</span>
          <div className="text-xl font-bold font-mono text-white mt-1">{otsAbiertas}</div>
          <span className="text-[9px] text-rose-400 font-mono block mt-2">{correctivosCriticos} Correctivos Críticos</span>
        </div>

        <div 
          onClick={() => onNavigate('Workspace')}
          className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-slate-850 cursor-pointer transition-all"
        >
          <span className="text-[10px] font-mono text-slate-500 block uppercase">BLOQUEADAS LOGÍSTICA</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{otsBloqueadas}</div>
          <span className="text-[9px] text-slate-500 font-mono block mt-2">Vencidas sin Cerrar: {otsVencidas}</span>
        </div>

        <div 
          onClick={() => onNavigate('BI')}
          className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-slate-850 cursor-pointer transition-all"
        >
          <span className="text-[10px] font-mono text-slate-500 block uppercase">DESVIACIÓN DE HH</span>
          <div className={`text-xl font-bold font-mono mt-1 ${desviacionHH > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {desviacionHH > 0 ? `+${desviacionHH}` : desviacionHH}
          </div>
          <span className="text-[9px] text-slate-500 font-mono block mt-2">Estimado: {totalHHEstimadas} hrs</span>
        </div>

        <div 
          onClick={() => onNavigate('HSE')}
          className="bg-slate-950 p-4 rounded-xl border border-slate-900 hover:border-slate-850 cursor-pointer transition-all col-span-2 lg:col-span-1"
        >
          <span className="text-[10px] font-mono text-slate-500 block uppercase">RIESGOS HSE & CALIDAD</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{totalHallazgos}</div>
          <span className="text-[9px] text-slate-400 font-mono block mt-2">{findingsHSEAbiertos} HSE | {findingsCalidadAbiertos} Calidad</span>
        </div>
      </div>

      {/* SECCIÓN: MAPA DEL ECOSISTEMA */}
      <div className="space-y-4">
        <div>
          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-mono px-2.5 py-1 rounded-full border border-indigo-500/20 font-bold uppercase">
            Arquitectura del Sistema
          </span>
          <h2 className="text-base font-bold text-white mt-2 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" /> Mapa del Ecosistema ORBI O&amp;M IA
          </h2>
          <p className="text-xs text-slate-400">
            Navegación unificada y distribución de módulos por dominios operacionales en el Command Center. Haga clic en cualquier módulo para abrirlo directamente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* DOMINIO A: DIRECCIÓN & DECISIÓN */}
          <div className="bg-slate-900/30 border border-amber-500/10 p-5 rounded-2xl flex flex-col justify-between space-y-4 backdrop-blur-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">A) Dirección &amp; Decisión</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                KPIs ejecutivos, análisis financiero de desvíos, escalamiento de incidentes complejos y toma de decisiones a nivel de gerencia.
              </p>
            </div>
            
            <div className="space-y-2">
              <div 
                onClick={() => onNavigate('Home')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-amber-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-amber-300 font-sans">Home Jefatura O&amp;M</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">Activo</span>
              </div>

              <div 
                onClick={() => onNavigate('BI')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-amber-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-amber-300 font-sans">ORBI Insight Center</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">Dashboard</span>
              </div>

              <div 
                onClick={() => onNavigate('Escalaciones')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-amber-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-amber-300 font-sans">Risk &amp; Escalation Center</span>
                </div>
                <span className="text-[9px] font-mono text-rose-400 bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10">Control</span>
              </div>
            </div>
          </div>

          {/* DOMINIO B: PLANIFICACIÓN & COORDINACIÓN */}
          <div className="bg-slate-900/30 border border-indigo-500/10 p-5 rounded-2xl flex flex-col justify-between space-y-4 backdrop-blur-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">B) Planificación &amp; Coordinación</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Programación inteligente de técnicos, asignación de turnos, optimización de cuadrillas de terreno y calendarios en tiempo real.
              </p>
            </div>
            
            <div className="space-y-2">
              <div 
                onClick={() => onNavigate('Workspace')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-indigo-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 font-sans">ORBI Workspace</span>
                </div>
                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10 font-bold">Planer</span>
              </div>

              <div 
                onClick={() => onNavigate('Workspace')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-indigo-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 font-sans">Scheduler IA &amp; Resource Planner</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 font-bold">7A / 7B</span>
              </div>

              <div 
                onClick={() => onNavigate('People')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-indigo-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 font-sans">People &amp; Resource Center</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">RRHH</span>
              </div>
            </div>
          </div>

          {/* DOMINIO C: EJECUCIÓN & TERRENO */}
          <div className="bg-slate-900/30 border border-emerald-500/10 p-5 rounded-2xl flex flex-col justify-between space-y-4 backdrop-blur-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">C) Ejecución &amp; Terreno</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Flujos de trabajo simplificados para técnicos de campo, checklists técnicos, carga cronológica de evidencias y permisos de alto riesgo.
              </p>
            </div>
            
            <div className="space-y-2">
              <div 
                onClick={() => onNavigate('Terreno')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-emerald-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-emerald-300 font-sans">Vista Terreno</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">Móvil</span>
              </div>

              <div 
                onClick={() => onNavigate('OTs')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-emerald-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-emerald-300 font-sans">ORBI OT Center v0.X</span>
                </div>
                <span className="text-[9px] font-mono text-teal-400 bg-teal-500/5 px-1.5 py-0.5 rounded border border-teal-500/10 font-bold">FROZEN</span>
              </div>

              <div 
                onClick={() => onNavigate('OTs')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-emerald-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-emerald-300 font-sans">Evidence Vault &amp; PTW Center</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">Seguridad</span>
              </div>
            </div>
          </div>

          {/* DOMINIO D: ACTIVOS & PLANTAS */}
          <div className="bg-slate-900/30 border border-amber-500/10 p-5 rounded-2xl flex flex-col justify-between space-y-4 backdrop-blur-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">D) Activos &amp; Plantas</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Estatus del parque solar fotovoltaico, zonificación regional, capacidad instalada en MWp y control de existencias de repuestos por parque.
              </p>
            </div>
            
            <div className="space-y-2">
              <div 
                onClick={() => onNavigate('Plantas')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-amber-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-amber-300 font-sans">Matriz de Plantas</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">Solar</span>
              </div>

              <div 
                onClick={() => onNavigate('Zonas')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-amber-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-amber-300 font-sans">Zonas Operacionales</span>
                  </div>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">Zonificación</span>
              </div>

              <div 
                onClick={() => onNavigate('OTs')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-amber-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-amber-300 font-sans">Inventario O&amp;M Integrado</span>
                </div>
                <span className="text-[9px] font-mono text-amber-400 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 font-bold">Segmentado</span>
              </div>
            </div>
          </div>

          {/* DOMINIO E: LOGÍSTICA & RECURSOS */}
          <div className="bg-slate-900/30 border border-cyan-500/10 p-5 rounded-2xl flex flex-col justify-between space-y-4 backdrop-blur-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">E) Logística &amp; Recursos</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Ubicación simulada en tiempo real de vehículos, estado de mantenimiento de flota, requisición de materiales y herramientas de alta tensión.
              </p>
            </div>
            
            <div className="space-y-2">
              <div 
                onClick={() => onNavigate('Flota')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-cyan-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 font-sans">Control de Flota &amp; Logística</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">Vehículos</span>
              </div>

              <div 
                onClick={() => onNavigate('Repuestos')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-cyan-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 font-sans">Repuestos &amp; Herramientas</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">Bodega</span>
              </div>

              <div 
                onClick={() => onNavigate('Organigrama')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-cyan-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 font-sans">Organigrama de Personal</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">Roles</span>
              </div>
            </div>
          </div>

          {/* DOMINIO F: DOCUMENTACIÓN & CIERRE */}
          <div className="bg-slate-900/30 border border-teal-500/10 p-5 rounded-2xl flex flex-col justify-between space-y-4 backdrop-blur-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                <h4 className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">F) Documentación &amp; Cierre</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Verificación de semáforos documentales O&amp;M, dossier de fotos A4 interactivo para clientes y almacenamiento ordenado de forma automática.
              </p>
            </div>
            
            <div className="space-y-2">
              <div 
                onClick={() => onNavigate('OTs')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-teal-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-teal-300 font-sans">Report Center O&amp;M</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">Cierre</span>
              </div>

              <div 
                onClick={() => onNavigate('OTs')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-teal-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-teal-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-teal-300 font-sans">SharePoint Router Virtual</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">Archivos</span>
              </div>

              <div 
                onClick={() => onNavigate('DemoHub')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-emerald-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-emerald-300 font-sans">ORBI Executive Demo Hub</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 font-bold">12C</span>
              </div>

              <div 
                onClick={() => onNavigate('DemoReadiness')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-900 hover:border-teal-500/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-teal-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-teal-300 font-sans">Release &amp; Demo Center</span>
                </div>
                <span className="text-[9px] font-mono text-teal-400 bg-teal-500/5 px-1.5 py-0.5 rounded border border-teal-500/10 font-bold">9A/9B/9C</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECURSOS, LOGÍSTICA & TRAZABILIDAD SUB-GRID */}
      <div className="bg-slate-900/10 border border-slate-800/60 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider uppercase block mb-3 flex items-center gap-1.5">
          <Truck className="h-4 w-4" /> FIELD LOGISTICS, RESOURCES & TRACEABILITY (v0.1.1C)
        </span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div 
            onClick={() => onNavigate('Flota')}
            className="bg-slate-950/80 hover:bg-slate-950 p-3.5 rounded-lg border border-slate-900 hover:border-slate-850 cursor-pointer transition-all"
          >
            <span className="text-[9px] font-mono text-slate-500 block uppercase">FLOTA VEHICULAR</span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {totalVehiculos} <span className="text-[10px] text-slate-500 font-normal">Móviles</span>
            </div>
            <span className="text-[9px] text-cyan-400 font-mono block mt-1">En Ruta: {vehiculosEnRuta} | Bloqueados: {vehiculosBloqueados}</span>
          </div>

          <div 
            onClick={() => onNavigate('People')}
            className="bg-slate-950/80 hover:bg-slate-950 p-3.5 rounded-lg border border-slate-900 hover:border-slate-850 cursor-pointer transition-all"
          >
            <span className="text-[9px] font-mono text-slate-500 block uppercase">CONTROL DE PERSONAL</span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {totalPersonas} <span className="text-[10px] text-slate-500 font-normal">Especialistas</span>
            </div>
            <span className="text-[9px] text-rose-400 font-mono block mt-1">{personasSobrecargadas} Con Sobrecarga (&gt;80%)</span>
          </div>

          <div 
            onClick={() => onNavigate('Repuestos')}
            className="bg-slate-950/80 hover:bg-slate-950 p-3.5 rounded-lg border border-slate-900 hover:border-slate-850 cursor-pointer transition-all"
          >
            <span className="text-[9px] font-mono text-slate-500 block uppercase">REPUESTOS BLOQUEANTES</span>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              {recursosBloqueantes} <span className="text-[10px] text-slate-500 font-normal">Afectando OTs</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono block mt-1">Revisar stock en tránsito y bodega</span>
          </div>

          <div 
            onClick={() => onNavigate('Escalaciones')}
            className="bg-slate-950/80 hover:bg-slate-950 p-3.5 rounded-lg border border-slate-900 hover:border-slate-850 cursor-pointer transition-all"
          >
            <span className="text-[9px] font-mono text-slate-500 block uppercase">RIESGOS ESCALADOS</span>
            <div className="text-lg font-bold font-mono text-rose-500 mt-1">
              {escalacionesActivas} <span className="text-[10px] text-slate-500 font-normal">Activos</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono block mt-1">Ver tickets en Risk Center</span>
          </div>
        </div>
      </div>

      {/* GRID CENTRAL: DECISIONES CRÍTICAS Y FOTON PRIME IA */}
      {!['TECNICO_OM', 'INGENIERO_OM'].includes(userRole) ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PANEL DE DECISIONES REQUERIDAS POR JEFATURA O&M */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-rose-500/10 text-rose-400 text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/20">ACCIONES INMEDIATAS</span>
                  <span className="text-xs font-mono text-slate-500">Resolución de Cuellos de Botella</span>
                </div>
                <h2 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-400 animate-pulse" /> Decisiones Requeridas por Jefatura O&M
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  La Jefatura O&M destraba recursos, aprueba compras críticas, y autoriza cambios operacionales directos para reactivar actividades bloqueadas.
                </p>
              </div>

              <div className="space-y-3">
                {decisions.map((dec) => {
                  const isApproved = dec.estado === 'Aprobado y Ejecutado';

                  return (
                    <div 
                      key={dec.id} 
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isApproved 
                          ? 'bg-slate-950/40 border-slate-900 text-slate-500' 
                          : 'bg-slate-950 border-slate-850 text-slate-100 hover:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            isApproved 
                              ? 'bg-slate-900 border-slate-850 text-slate-500' 
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            {dec.badge}
                          </span>
                          <span className="text-[10px] font-mono font-bold">{dec.id}</span>
                        </div>
                        <h4 className={`text-xs font-bold ${isApproved ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                          {dec.titulo}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                          {dec.contexto}
                        </p>
                        <div className="text-[10px] font-bold text-indigo-400 font-mono">
                          Acción: {dec.accion}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        {isApproved ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> EJECUTADO
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApproveDecision(dec.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <BookmarkCheck className="h-3.5 w-3.5" /> AUTORIZAR
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FOTON PRIME IA - REPORTES OPERATIVOS AVANZADOS */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/20 rounded-2xl shadow-xl flex flex-col overflow-hidden">
            
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                  <Cpu className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    FOTON PRIME O&M IA <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1 rounded border border-indigo-500/20 font-sans">v0.1.2C-QA</span>
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono">Asistente Ejecutivo del Command Center</p>
                </div>
              </div>
            </div>

            {/* O&M Report selector */}
            <div className="bg-slate-950 px-3 py-2 border-b border-slate-900 flex gap-1.5 overflow-x-auto">
              {[
                { id: 'jefe', label: 'Carga Jefe O&M' },
                { id: 'gerencia', label: 'Impacto Gerencia' },
                { id: 'logistica', label: 'Desvíos Logística' },
                { id: 'hse_kpis', label: 'HSE & Control' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAiReportType(tab.id as any)}
                  className={`text-[9px] font-mono px-2 py-1 rounded-md transition-all whitespace-nowrap ${
                    aiReportType === tab.id
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Response area */}
            <div className="flex-1 p-4.5 font-mono text-[11px] text-slate-300 leading-relaxed min-h-[260px] select-text bg-slate-950/40">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 py-16">
                  <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                  <span className="text-[10px]">Analizando variables operativas de la semana...</span>
                </div>
              ) : (
                <div className="space-y-3 whitespace-pre-wrap">
                  {aiResponse.split('\n').map((line, idx) => {
                    if (line.startsWith('###')) {
                      return <h3 key={idx} className="text-xs font-bold text-white border-b border-slate-900 pb-1 mt-2 mb-2">{line.replace('###', '')}</h3>;
                    }
                    if (line.startsWith('*') || line.startsWith('-')) {
                      return <div key={idx} className="pl-3 border-l border-indigo-500/30 text-slate-300 py-0.5">{line}</div>;
                    }
                    if (line.startsWith('**')) {
                      const parts = line.split('**');
                      return (
                        <p key={idx} className="text-slate-200">
                          {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-indigo-400 font-bold">{p}</strong> : p)}
                        </p>
                      );
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-950/80 border-t border-slate-900 px-4 py-2 flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>Sincronizado con bases de datos</span>
              <span>Refresco: Al cambio de OT</span>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 text-center max-w-2xl mx-auto space-y-3 shadow-inner">
          <Shield className="h-10 w-10 text-teal-450 mx-auto animate-pulse" />
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Panel Ejecutivo Restringido</h3>
          <p className="text-xs text-slate-400 leading-normal max-w-md mx-auto">
            Las decisiones de Jefatura O&amp;M, análisis de desvíos logísticos, KPIs de impacto gerencial y reportes avanzados de FOTON Prime IA están reservados para roles administrativos y de supervisión.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('Terreno')}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 font-mono text-[11px] rounded-lg border border-slate-800 transition-all cursor-pointer"
            >
              Ir a Vista Terreno
            </button>
            <button
              onClick={() => onNavigate('OTs')}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-mono text-[11px] font-black rounded-lg transition-all cursor-pointer"
            >
              Abrir OT Center
            </button>
          </div>
        </div>
      )}

      {/* DETALLES DE DISPONIBILIDAD DE PLANTAS */}
      <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" /> Estado de Disponibilidad y Plantas Solar
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Estatus del parque fotovoltaico consolidado por región y nivel de criticidad.</p>
          </div>
          <button 
            onClick={() => onNavigate('Plantas')}
            className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 px-2.5 py-1 rounded border border-indigo-500/10 hover:border-indigo-500/20 transition-all"
          >
            Matriz de Plantas &rarr;
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantas.map((planta) => {
            let statusColor = 'bg-emerald-500';
            let statusBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            
            if (planta.estado === 'Limitada') {
              statusColor = 'bg-amber-500';
              statusBg = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            } else if (planta.estado === 'Fuera de Servicio') {
              statusColor = 'bg-rose-500';
              statusBg = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
            } else if (planta.estado === 'En Mantenimiento') {
              statusColor = 'bg-orange-500';
              statusBg = 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
            }

            return (
              <div key={planta.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 hover:border-slate-850 transition-all flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-white">{planta.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {planta.region} | {planta.mwp} MWp
                  </div>
                </div>
                
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${statusBg} flex items-center gap-1.5`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`}></span>
                  {planta.estado}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROADMAP: PRÓXIMOS MÓDULOS DEL COMMAND CENTER */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <span className="bg-slate-950 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-850 font-bold uppercase">
            Plan de Evolución Tecnológica
          </span>
          <h3 className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-indigo-400" /> Próximos Módulos del Command Center
          </h3>
          <p className="text-xs text-slate-400">
            Roadmap del ecosistema de automatización O&amp;M para fases posteriores de implementación real.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-1">
          <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl space-y-1">
            <span className="text-[8px] font-mono text-slate-500 block uppercase">MONITORING</span>
            <span className="text-xs font-bold text-slate-200 block">Monitoring / SCADA Center</span>
            <span className="text-[9px] text-slate-500 block leading-tight font-mono">Lecturas y alarmas de telemetría viva de inversores.</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl space-y-1">
            <span className="text-[8px] font-mono text-slate-500 block uppercase">MASTER DATA</span>
            <span className="text-xs font-bold text-slate-200 block">Plantas FV Master Data</span>
            <span className="text-[9px] text-slate-500 block leading-tight font-mono">Ficha técnica estructurada y planos del parque.</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl space-y-1">
            <span className="text-[8px] font-mono text-indigo-400 block uppercase">INSIGHTS</span>
            <span className="text-xs font-bold text-indigo-300 block">Analítica ejecutiva O&amp;M</span>
            <span className="text-[9px] text-slate-500 block leading-tight font-mono">Métricas avanzadas contractuales para directores.</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl space-y-1">
            <span className="text-[8px] font-mono text-slate-500 block uppercase">LOGÍSTICA</span>
            <span className="text-xs font-bold text-slate-200 block">Fleet &amp; Logistics avanzado</span>
            <span className="text-[9px] text-slate-500 block leading-tight font-mono">Asignación automática de rutas optimizadas por IA.</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl space-y-1">
            <span className="text-[8px] font-mono text-indigo-400 block uppercase">INTEGRACIONES</span>
            <span className="text-xs font-bold text-indigo-300 block">Integraciones de simulación SharePoint / Softwrench</span>
            <span className="text-[9px] text-slate-500 block leading-tight font-mono">Mapeo estructurado mediante simuladores de Graph API y triggers Softwrench.</span>
          </div>

          <div className="bg-slate-950/60 border border-teal-500/10 p-3.5 rounded-xl space-y-1 bg-gradient-to-b from-slate-950/60 to-teal-950/5">
            <span className="text-[8px] font-mono text-teal-400 block uppercase">TRANSVERSAL IA</span>
            <span className="text-xs font-bold text-teal-300 block">FOTON Prime IA transversal</span>
            <span className="text-[9px] text-slate-500 block leading-tight font-mono">Motor cognitivo para sugerencias complejas de parque.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
