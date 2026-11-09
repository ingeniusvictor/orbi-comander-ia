/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldAlert,
  BarChart2,
  CheckCircle,
  Users,
  Building2,
  Cpu,
  Layers,
  Activity,
  Calendar,
  Send,
  RefreshCw,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Eye,
  Layout,
  HelpCircle,
  FileText,
  Printer,
  X
} from 'lucide-react';
import { Planta, OT, HSEFinding, PlanPreventivo, Vehiculo, RecursoPersona, Repuesto, Herramienta, Escalation } from '../types';
import { getBIWorkOrderRecords, BIWorkOrderRecord } from '../data/biDataBridge';
import { getPlantBadgeInfo } from '../data/plantIdentityMap';
import InsightReportPrintView from './InsightReportPrintView';

interface InsightCenterProps {
  plantas: Planta[];
  ots: OT[];
  findings: HSEFinding[];
  planificacion: PlanPreventivo[];
  vehiculos?: Vehiculo[];
  recursosPersonas?: RecursoPersona[];
  repuestos?: Repuesto[];
  herramientas?: Herramienta[];
  escalaciones?: Escalation[];
  onNavigate?: (view: string, filters?: any) => void;
  initialFilters?: any;
}

type InsightTab = 
  | 'landing' 
  | 'resumen' 
  | 'cumplimiento' 
  | 'hh' 
  | 'ranking' 
  | 'clientes' 
  | 'hhmix' 
  | 'gerencia';

export default function InsightCenter({
  plantas = [],
  ots = [],
  findings = [],
  planificacion = [],
  vehiculos = [],
  recursosPersonas = [],
  repuestos = [],
  herramientas = [],
  escalaciones = [],
  onNavigate,
  initialFilters
}: InsightCenterProps) {
  // State variables for interactive Insight Center experience
  const [activeTab, setActiveTab] = useState<InsightTab>('landing');
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  
  // Report Pack Wizard states
  const [showReportWizard, setShowReportWizard] = useState<boolean>(false);
  const [wizardReportType, setWizardReportType] = useState<'ejecutivo' | 'cliente' | 'zona' | 'planta' | 'hh' | 'mensual'>('ejecutivo');
  const [wizardClient, setWizardClient] = useState<string | null>('BIWO');
  const [wizardZone, setWizardZone] = useState<string>('Centro');
  const [wizardPlant, setWizardPlant] = useState<string | null>(plantas && plantas.length > 0 ? plantas[0].name : null);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);

  // Capture initial filters
  React.useEffect(() => {
    if (initialFilters) {
      if (initialFilters.tab) {
        setActiveTab(initialFilters.tab);
      }
      if (initialFilters.showReportWizard) {
        setShowReportWizard(true);
      }
    }
  }, [initialFilters]);
  
  // Interactive filters
  const [selectedScope, setSelectedScope] = useState<'ALL' | 'MASTER_PORTFOLIO' | 'LEGACY_DEMO' | 'BENCHMARK_EXTERNAL'>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('Global');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);

  // Normalize data using our advanced BI Data Bridge Adapter
  const biRecords = getBIWorkOrderRecords(ots, plantas);

  // Apply filters on the fly to simulate a real dynamic analytical dataset
  const filteredRecords = biRecords.filter(rec => {
    if (selectedScope !== 'ALL' && rec.recordScope !== selectedScope) return false;
    if (selectedZone !== 'Global' && rec.zona !== selectedZone) return false;
    if (selectedClient && rec.cliente !== selectedClient) return false;
    if (selectedTechnician && rec.tecnico !== selectedTechnician) return false;
    if (selectedPlant && rec.planta !== selectedPlant) return false;
    return true;
  });

  // Calculate active filters summary
  const activeFiltersCount = 
    (selectedScope !== 'ALL' ? 1 : 0) +
    (selectedZone !== 'Global' ? 1 : 0) + 
    (selectedClient ? 1 : 0) + 
    (selectedTechnician ? 1 : 0) + 
    (selectedPlant ? 1 : 0);

  // Reset filters
  const resetAllFilters = () => {
    setSelectedScope('ALL');
    setSelectedZone('Global');
    setSelectedClient(null);
    setSelectedTechnician(null);
    setSelectedPlant(null);
  };

  // 1. Core KPIs based on filtered context
  const totalOts = filteredRecords.length;
  const otsAbiertas = filteredRecords.filter(o => o.estado !== 'Cerrada' && o.estado !== 'Finalizada' && o.estado !== 'Cancelada').length;
  const otsCerradas = filteredRecords.filter(o => o.estado === 'Cerrada' || o.estado === 'Finalizada').length;
  const otsVencidas = filteredRecords.filter(o => o.isOverdue).length;
  const otsBloqueadas = filteredRecords.filter(o => o.isBlocked).length;
  const otsCriticas = filteredRecords.filter(o => o.prioridad === 'Crítica' && o.estado !== 'Cerrada' && o.estado !== 'Finalizada').length;

  const SLACompliance = totalOts > 0 ? Math.round((otsCerradas / totalOts) * 100) : 100;
  
  // Plant-level availability metric
  const activePlants = plantas.length;
  const plantsUp = plantas.filter(p => p.estado === 'Operacional').length;
  const plantAvailability = activePlants > 0 ? Math.round((plantsUp / activePlants) * 100) : 100;
  
  const totalCapacityMWp = plantas.reduce((acc, p) => acc + (p.mwp || 0), 0);
  const compromisedMWp = parseFloat(filteredRecords.reduce((acc, o) => acc + o.mwAfectado, 0).toFixed(1));

  // Manpower indicators
  const hhEstimadas = filteredRecords.reduce((acc, o) => acc + o.hhEstimadas, 0);
  const hhReales = filteredRecords.reduce((acc, o) => acc + o.hhReales, 0);
  const desviacionHH = hhReales - hhEstimadas;

  // HSE findings
  const hseAbiertos = findings.filter(f => f.tipo === 'HSE' && f.estado !== 'Cerrado').length;
  const totalRiesgos = findings.filter(f => f.estado !== 'Cerrado').length;

  // Overloaded staff count
  const overloadedStaff = recursosPersonas.filter(p => p.cargaSemanal > 80 && p.activo).length;

  // Unified O&M Health Score (Composite KPI)
  // Weighted: 40% Plant Availability, 40% SLA Compliance, 20% Safety index (hse compliance)
  const safetyFactor = totalRiesgos > 0 ? Math.max(0, 100 - (hseAbiertos * 10)) : 100;
  const healthScore = Math.round((plantAvailability * 0.4) + (SLACompliance * 0.4) + (safetyFactor * 0.2));

  // Regional metrics (based on global biRecords to avoid infinite loops, but filtered for active displays)
  const regions = ['Norte', 'Centro', 'Sur'];
  const regionalMetrics = regions.map(reg => {
    const regPlants = plantas.filter(p => p.zona === reg);
    const regCapacity = regPlants.reduce((acc, p) => acc + p.mwp, 0);
    const regOts = biRecords.filter(o => o.zona === reg);
    const regClosed = regOts.filter(o => o.estado === 'Cerrada' || o.estado === 'Finalizada').length;
    const regSla = regOts.length > 0 ? Math.round((regClosed / regOts.length) * 100) : 100;
    const regCritical = regOts.filter(o => o.prioridad === 'Crítica' && o.estado !== 'Cerrada').length;
    return { 
      name: reg, 
      plants: regPlants.length, 
      capacity: regCapacity, 
      ots: regOts.length, 
      sla: regSla, 
      critical: regCritical 
    };
  });

  // Client metrics mapped from current bridge records
  const clientsMap: Record<string, { plants: number; mwp: number; ots: number; closed: number; sla: number }> = {};
  biRecords.forEach(rec => {
    const cli = rec.cliente || 'Otros Clientes';
    if (!clientsMap[cli]) {
      const cliPlants = plantas.filter(p => p.cliente === cli);
      const cliMwp = cliPlants.reduce((acc, p) => acc + p.mwp, 0);
      clientsMap[cli] = { plants: cliPlants.length, mwp: cliMwp, ots: 0, closed: 0, sla: 100 };
    }
    clientsMap[cli].ots += 1;
    if (rec.estado === 'Cerrada' || rec.estado === 'Finalizada') {
      clientsMap[cli].closed += 1;
    }
  });
  
  // Add base plants that don't have active OTs yet
  plantas.forEach(p => {
    const cli = p.cliente;
    if (!clientsMap[cli]) {
      clientsMap[cli] = { plants: 1, mwp: p.mwp, ots: 0, closed: 0, sla: 100 };
    }
  });
  
  const clientRecords = Object.entries(clientsMap).map(([name, data]) => {
    const sla = data.ots > 0 ? Math.round((data.closed / data.ots) * 100) : 100;
    return { name, ...data, sla };
  }).sort((a, b) => b.mwp - a.mwp);

  // HH Mix ratios (calculated on active filtered set)
  let hhPreventiva = 0;
  let hhCorrectiva = 0;
  let hhHse = 0;
  let hhAdmin = 0;

  filteredRecords.forEach(o => {
    const hh = o.hhRegistradas || o.hhPlanificadas || 4;
    if (o.tipoWO === 'Preventiva') {
      hhPreventiva += hh;
    } else if (o.tipoWO === 'Correctiva') {
      hhCorrectiva += hh;
    } else if (o.tipoWO === 'HSE' || (o.tipoWO as string) === 'LOTO/HSE' || o.prioridad === 'Crítica') {
      hhHse += hh;
    } else {
      hhAdmin += hh;
    }
  });

  const hhTotal = hhPreventiva + hhCorrectiva + hhHse + hhAdmin;
  const pctPreventiva = hhTotal > 0 ? Math.round((hhPreventiva / hhTotal) * 100) : 60;
  const pctCorrectiva = hhTotal > 0 ? Math.round((hhCorrectiva / hhTotal) * 100) : 25;
  const pctHse = hhTotal > 0 ? Math.round((hhHse / hhTotal) * 100) : 10;
  const pctAdmin = hhTotal > 0 ? Math.round((hhAdmin / hhTotal) * 100) : 5;

  // Handle preconfigured AI questions via direct API calls
  const handlePreconfiguredQuestion = async (qType: string) => {
    setIsAiLoading(true);
    setAiAnswer('');
    
    let prompt = '';
    if (qType === 'status_equipo') {
      prompt = 'Dame un informe detallado sobre la carga de trabajo y desempeño del personal técnico de O&M.';
    } else if (qType === 'zonas_carga') {
      prompt = '¿Qué zonas operacionales presentan mayor saturación y cómo equilibrar las camionetas y brigadas?';
    } else if (qType === 'plantas_criticas') {
      prompt = 'Haz un diagnóstico profundo de las plantas críticas en alerta y cuánta energía/potencia nominal tenemos en riesgo.';
    } else if (qType === 'temas_escalar') {
      prompt = '¿Qué desviaciones de HH, bloqueos logísticos de repuestos y riesgos HSE requieren escalamiento a nivel corporativo?';
    }

    try {
      const response = await fetch('/api/bi/reporte-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          contextData: {
            totalOts,
            otsAbiertas,
            otsCerradas,
            otsVencidas,
            otsBloqueadas,
            otsCriticas,
            SLACompliance,
            plantAvailability,
            totalCapacityMWp,
            compromisedMWp,
            desviacionHH,
            hseAbiertos,
            overloadedStaff,
            healthScore,
            regionalMetrics,
            clientRecords: clientRecords.slice(0, 4)
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setAiAnswer(data.text || 'Error al compilar el informe ejecutivo.');
    } catch (err: any) {
      setAiAnswer(`### 🚨 MODO LOCAL SANDBOX — FALLBACK DIRECTIVO IA\n\nEl sistema Foton Prime operó bajo contingencia local debido a la falta de variables productivas (sin API key de producción en sandbox). Aquí su reporte predictivo:\n\n1. **Estatus de Equipo:** Víctor León acumula 92h con 98.9% de SLA en BIWO. Daniel Godoy en la Zona Sur presenta carga media pero alta dispersión geográfica.\n2. **Plantas en Alerta:** Planta Clementina y Liquidámbar de CVE se clasifican como **Críticas** debido a un backlog acumulado de 13 correctivas de cableado DC.\n3. **Carga Operativa:** Zona Centro presenta saturación leve (78% de ocupación). Se sugiere reubicar cuadrillas desde Atacama (Zona Norte, que está al 100% controlada) para mitigar el backlog en Biobío.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit custom questions to server API
  const handleCustomQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    
    setIsAiLoading(true);
    setAiAnswer('');

    try {
      const response = await fetch('/api/bi/reporte-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customQuestion,
          contextData: {
            totalOts,
            otsAbiertas,
            otsCerradas,
            otsVencidas,
            otsBloqueadas,
            otsCriticas,
            SLACompliance,
            plantAvailability,
            totalCapacityMWp,
            compromisedMWp,
            desviacionHH,
            hseAbiertos,
            overloadedStaff,
            healthScore
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setAiAnswer(data.text || 'Error al procesar consulta directiva.');
    } catch (err: any) {
      setAiAnswer(`### 🚨 SANDBOX IA RESPUESTA LOCAL\n\nPara responder su consulta: *"${customQuestion}"*\n\nEl optimizador directivo reporta que las variables de la base local actual están en un estado consistente. El SLA promedio de los contratos auditados es del **${SLACompliance}%**, lo cual satisface los requisitos contractuales promedio de la cartera de O&M.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const triggerNavigation = (view: string, filterObj?: any) => {
    if (onNavigate) {
      onNavigate(view, filterObj);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECURITY & SYNC BADGE BANNER */}
      <div className="bg-indigo-950/20 border border-indigo-900/30 p-4 rounded-xl space-y-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-900/40 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              ORBI Insight Center
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-300">
            <span>Insight Sandbox / Local Sync / Read-Only Analytics</span>
          </div>
        </div>
        <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
          Sin conexión real a plataformas externas de análisis. Sin APIs reales conectadas, sin credenciales, y sin URLs internas. No se realiza exportación de datos productivos (operando exclusivamente con datos mock/localStorage). Las referencias analíticas son usadas únicamente como benchmark funcional autorizado. ORBI Insight Center es una herramienta propia y exclusiva integrada en el ecosistema ORBI.
        </p>
      </div>

      {/* HEADER SECTION - PREMIUM COMMAND CENTER STYLE */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-500/20 font-bold uppercase tracking-wider">
              ORBI Insight Center
            </span>
            <span className="text-xs font-mono text-slate-500">
              Versión: v0.2.x-QA — Executive Analytics Shell
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2 tracking-tight">
            <BarChart2 className="h-6 w-6 text-indigo-400" /> ORBI Insight Center
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Analítica ejecutiva e inteligencia operacional O&M. Convierte datos de terreno, planificación y cierre documental en indicadores, rankings, alertas e insights accionables.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 font-mono text-left md:text-right">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400 font-bold">Datos Sincronizados de Campo</span>
          </div>
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-amber-400 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/30">
                {activeFiltersCount} Filtro(s) Activo(s)
              </span>
              <button 
                onClick={resetAllFilters}
                className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          )}
          <button
            onClick={() => setShowReportWizard(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono px-4 py-2 rounded-lg transition-all shadow-lg shadow-indigo-600/20 border border-indigo-500 mt-1 cursor-pointer w-full md:w-auto justify-center"
          >
            <FileText className="h-4 w-4" />
            <span>Generar Reporte PDF</span>
          </button>
        </div>
      </div>

      {/* STRATEGIC NAVIGATION TABS - 8 PILL SELECTOR GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-900">
        <button
          onClick={() => { setActiveTab('landing'); resetAllFilters(); }}
          className={`py-2 rounded-lg text-[11px] font-bold font-mono transition-all whitespace-nowrap px-1.5 flex flex-col items-center justify-center gap-1 border ${
            activeTab === 'landing' 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Executive Landing</span>
        </button>
        <button
          onClick={() => { setActiveTab('resumen'); }}
          className={`py-2 rounded-lg text-[11px] font-bold font-mono transition-all whitespace-nowrap px-1.5 flex flex-col items-center justify-center gap-1 border ${
            activeTab === 'resumen' 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Resumen Ejecutivo</span>
        </button>
        <button
          onClick={() => { setActiveTab('cumplimiento'); }}
          className={`py-2 rounded-lg text-[11px] font-bold font-mono transition-all whitespace-nowrap px-1.5 flex flex-col items-center justify-center gap-1 border ${
            activeTab === 'cumplimiento' 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Cumplimiento OT</span>
        </button>
        <button
          onClick={() => { setActiveTab('hh'); }}
          className={`py-2 rounded-lg text-[11px] font-bold font-mono transition-all whitespace-nowrap px-1.5 flex flex-col items-center justify-center gap-1 border ${
            activeTab === 'hh' 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>HH & Recursos</span>
        </button>
        <button
          onClick={() => { setActiveTab('ranking'); }}
          className={`py-2 rounded-lg text-[11px] font-bold font-mono transition-all whitespace-nowrap px-1.5 flex flex-col items-center justify-center gap-1 border ${
            activeTab === 'ranking' 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Ranking de Plantas</span>
        </button>
        <button
          onClick={() => { setActiveTab('clientes'); setSelectedClient(null); }}
          className={`py-2 rounded-lg text-[11px] font-bold font-mono transition-all whitespace-nowrap px-1.5 flex flex-col items-center justify-center gap-1 border ${
            activeTab === 'clientes' 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Clientes O&M</span>
        </button>
        <button
          onClick={() => { setActiveTab('hhmix'); }}
          className={`py-2 rounded-lg text-[11px] font-bold font-mono transition-all whitespace-nowrap px-1.5 flex flex-col items-center justify-center gap-1 border ${
            activeTab === 'hhmix' 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>HH Mix por Tipo WO</span>
        </button>
        <button
          onClick={() => { setActiveTab('gerencia'); }}
          className={`py-2 rounded-lg text-[11px] font-bold font-mono transition-all whitespace-nowrap px-1.5 flex flex-col items-center justify-center gap-1 border ${
            activeTab === 'gerencia' 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
              : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>Reporte Gerencial IA</span>
        </button>
      </div>

      {/* ACTIVE METRIC PANEL SPACE */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 min-h-[500px]">
        
        {/* TAB A: EXECUTIVE LANDING (DASHBOARD CONTROL OPERACIONAL) */}
        {activeTab === 'landing' && (
          <div className="space-y-6">
            
            {/* BENCHMARK REFERENCE FOOTNOTE */}
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-2">
              <span className="h-2 w-2 bg-indigo-500 rounded-full"></span>
              <span>Insight Reference 00 — Landing / Dashboard Control Operacional</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* COMPOSITE HEALTH SCORE - DYNAMIC SVG */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-900/80 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                  <Activity className="h-3 w-3 text-indigo-400" />
                  <span>SITUACIÓN GLOBAL OPERACIONAL</span>
                </div>
                
                <div className="relative h-40 w-40 mt-3 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#111827" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="url(#indigoGrad)" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black font-mono text-white tracking-tight">{healthScore}%</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase mt-1">ÓPTIMO</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-4 leading-relaxed max-w-xs">
                  Puntaje ponderado integrado de los parques fotovoltaicos: 40% Disponibilidad, 40% SLA de Cierre en Campo y 20% Mitigación de Hallazgos HSE.
                </p>
              </div>

              {/* 6 CORE PERFORMANCE KPIs GRID */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">DISPONIBILIDAD RED</span>
                  <div className="text-3xl font-bold font-mono text-white mt-1.5">{plantAvailability}%</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2 leading-none flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    <span>{plantsUp}/{activePlants} Parques Activos</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">COMPROMISO NOMINAL</span>
                  <div className="text-3xl font-bold font-mono text-amber-500 mt-1.5">{compromisedMWp} MW</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2 leading-none flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    <span>De un total de {totalCapacityMWp.toFixed(1)} MWp</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">EFICIENCIA SLA (SLA%)</span>
                  <div className="text-3xl font-bold font-mono text-emerald-400 mt-1.5">{SLACompliance}%</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2 leading-none flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    <span>Contractual &gt;90%</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">DESVIACIÓN JORNADAS</span>
                  <div className={`text-3xl font-bold font-mono mt-1.5 ${desviacionHH > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {desviacionHH > 0 ? `+${desviacionHH}` : desviacionHH} Hrs
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2 leading-none">
                    Real: {hhReales} vs Est: {hhEstimadas} Hrs
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">SEGURIDAD (HSE PENDIENTE)</span>
                  <div className="text-3xl font-bold font-mono text-red-400 mt-1.5">{hseAbiertos}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2 leading-none">
                    Hallazgos abiertos o en revisión
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">SATURACIÓN BRIGADAS</span>
                  <div className="text-3xl font-bold font-mono text-indigo-400 mt-1.5">{overloadedStaff}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2 leading-none">
                    Técnicos al límite (&gt;80% carga)
                  </div>
                </div>

              </div>
            </div>

            {/* QUICK ACTIONS & MAP ACCESS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-3">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold block border-b border-slate-900 pb-1.5">Zonas Operativas</span>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <button onClick={() => { setSelectedZone('Norte'); setActiveTab('resumen'); }} className="bg-slate-900 hover:bg-indigo-600/20 p-2 rounded border border-slate-800 text-xs font-mono text-white transition-all">Norte</button>
                  <button onClick={() => { setSelectedZone('Centro'); setActiveTab('resumen'); }} className="bg-slate-900 hover:bg-indigo-600/20 p-2 rounded border border-slate-800 text-xs font-mono text-white transition-all">Centro</button>
                  <button onClick={() => { setSelectedZone('Sur'); setActiveTab('resumen'); }} className="bg-slate-900 hover:bg-indigo-600/20 p-2 rounded border border-slate-800 text-xs font-mono text-white transition-all">Sur</button>
                </div>
                <p className="text-[11px] text-slate-500 font-mono text-center">Haga clic en una zona para abrir su panel analítico dedicado.</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-3">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold block border-b border-slate-900 pb-1.5">Acceso a Clientes</span>
                <div className="grid grid-cols-2 gap-1.5 text-center">
                  <button onClick={() => { setSelectedClient('ICAFAL'); setActiveTab('clientes'); }} className="bg-slate-900 hover:bg-indigo-600/20 p-2 rounded border border-slate-800 text-xs font-mono text-white transition-all">ICAFAL</button>
                  <button onClick={() => { setSelectedClient('BIWO'); setActiveTab('clientes'); }} className="bg-slate-900 hover:bg-indigo-600/20 p-2 rounded border border-slate-800 text-xs font-mono text-white transition-all">BIWO</button>
                  <button onClick={() => { setSelectedClient('CVE'); setActiveTab('clientes'); }} className="bg-slate-900 hover:bg-indigo-600/20 p-2 rounded border border-slate-800 text-xs font-mono text-white transition-all">CVE</button>
                  <button onClick={() => { setSelectedClient('AGR'); setActiveTab('clientes'); }} className="bg-slate-900 hover:bg-indigo-600/20 p-2 rounded border border-slate-800 text-xs font-mono text-white transition-all">AGR</button>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold block border-b border-slate-900 pb-1.5">Workspace Vinculado</span>
                  <p className="text-[11px] text-slate-400 leading-normal mt-2">
                    La base analítica detecta **{biRecords.filter(o => !o.fechaProgramada).length}** órdenes de trabajo sin programar en Inbox.
                  </p>
                </div>
                <button 
                  onClick={() => triggerNavigation('Workspace')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[11px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-all"
                >
                  Abrir Workspace <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB B: RESUMEN EJECUTIVO (O&M GENERAL & ZONAL SUMMARY) */}
        {activeTab === 'resumen' && (
          <div className="space-y-6">
            
            {/* ZONE SELECTOR BUTTONS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-4 gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-400" /> Resumen Ejecutivo de Desempeño
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Mapeo del comportamiento operacional general y filtrado por zona geográfica.</p>
              </div>

              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 font-mono text-xs">
                {['Global', 'Norte', 'Centro', 'Sur'].map(zone => (
                  <button
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={`px-3 py-1.5 rounded transition-all font-bold ${
                      selectedZone === zone 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>

            {/* BENCHMARK REFERENCES BADGES FOR ACTIVE ZONE */}
            <div className="flex flex-wrap gap-2">
              <span className="bg-slate-950 text-slate-400 font-mono text-[9px] px-2.5 py-1 rounded border border-slate-900">
                Insight Reference 02 — O&M General Operational Summary
              </span>
              {selectedZone === 'Norte' && (
                <span className="bg-indigo-950/40 text-indigo-400 font-mono text-[9px] px-2.5 py-1 rounded border border-indigo-900/30">
                  Insight Reference 03 — Zona Norte Operational Summary
                </span>
              )}
              {selectedZone === 'Centro' && (
                <span className="bg-amber-950/40 text-amber-400 font-mono text-[9px] px-2.5 py-1 rounded border border-amber-900/30 animate-pulse">
                  Insight Reference 04 — Zona Centro / Bluetree MP Operational Summary
                </span>
              )}
              {selectedZone === 'Sur' && (
                <span className="bg-rose-950/40 text-rose-400 font-mono text-[9px] px-2.5 py-1 rounded border border-rose-900/30 animate-pulse font-black">
                  Insight Reference 05 — Zona Sur Operational Summary
                </span>
              )}
            </div>

            {/* CLASSIFICATION ALERT AND METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Regional Health Card */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">SITUACIÓN REGIONAL ({selectedZone})</span>
                  <div className="mt-2">
                    {selectedZone === 'Global' && (
                      <span className="text-emerald-400 font-bold font-mono text-sm uppercase">Consolidado Estable</span>
                    )}
                    {selectedZone === 'Norte' && (
                      <div className="space-y-1">
                        <span className="text-emerald-400 font-black font-mono text-lg block tracking-wide">● CONTROLADA</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                          9.5 MW operados con cero retrasos activos. Flujo preventivo en regla.
                        </p>
                      </div>
                    )}
                    {selectedZone === 'Centro' && (
                      <div className="space-y-1">
                        <span className="text-amber-500 font-black font-mono text-lg block tracking-wide">● EN OBSERVACIÓN</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                          13 correctivas atrasadas en Clementina e incidentes de torque pendientes de aprobación.
                        </p>
                      </div>
                    )}
                    {selectedZone === 'Sur' && (
                      <div className="space-y-1">
                        <span className="text-red-400 font-black font-mono text-lg block tracking-wide">🚨 CRÍTICA</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                          Desviaciones en HH y backlog por falta de filtros de aire en el sitio Parral.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono pt-4 border-t border-slate-900 mt-4 leading-normal">
                  * Basado en la clasificación zonal del benchmark analítico real.
                </div>
              </div>

              {/* WO Counts */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col justify-between font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">ORDENES DE TRABAJO (WO)</span>
                  <div className="text-4xl font-black text-white mt-1.5">{totalOts}</div>
                  <span className="text-[10px] text-slate-400 block mt-1">Cerradas: {otsCerradas} | Pendientes: {otsAbiertas}</span>
                </div>
                <div className="text-[9px] text-indigo-400 block pt-2 border-t border-slate-900 mt-2">
                  Origen: {biRecords.filter(o => o.zona === selectedZone || selectedZone === 'Global').filter(o => o.origenDato === 'SharePoint').length} SharePoint sync
                </div>
              </div>

              {/* SLA KPI */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col justify-between font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">SLA CUMPLIMIENTO REGIONAL</span>
                  <div className={`text-4xl font-black mt-1.5 ${SLACompliance >= 90 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {SLACompliance}%
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Límite garantizado: 90%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-3">
                  <div className="bg-indigo-500 h-full" style={{ width: `${SLACompliance}%` }}></div>
                </div>
              </div>

              {/* Capacity MWp */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col justify-between font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">ENERGÍA EN RIESGO (MW)</span>
                  <div className="text-4xl font-black text-amber-500 mt-1.5">{compromisedMWp} MW</div>
                  <span className="text-[10px] text-slate-400 block mt-1">Por OTs críticas/abiertas</span>
                </div>
                <div className="text-[9px] text-slate-500 pt-2 border-t border-slate-900 mt-2">
                  De {selectedZone === 'Global' ? totalCapacityMWp.toFixed(1) : plantas.filter(p => p.zona === selectedZone).reduce((acc, p) => acc + p.mwp, 0).toFixed(1)} MWp instalados
                </div>
              </div>

            </div>

            {/* DETAILED OPERATIONAL LEDGER WITH ACCREDITED COLUMNS */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-900">
              <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-2">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  REGISTRO ANALÍTICO DE ÓRDENES — VINCULACIÓN DIRECTA CON OT CENTER
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">Mostrando {filteredRecords.length} registros</span>
              </div>

              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left font-mono text-[11px] text-slate-300">
                  <thead className="sticky top-0 bg-slate-950 z-10 text-slate-500 border-b border-slate-850">
                    <tr className="font-bold">
                      <th className="py-2 px-1">CODIGO</th>
                      <th className="py-2">CLIENTE</th>
                      <th className="py-2">PLANTA</th>
                      <th className="py-2">TIPO</th>
                      <th className="py-2">ESTADO</th>
                      <th className="py-2">DESCRIPCION</th>
                      <th className="py-2">TECNICO</th>
                      <th className="py-2 text-center">HOLD</th>
                      <th className="py-2 text-right">FECHA PROG.</th>
                      <th className="py-2 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {filteredRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-900/30 transition-all">
                        <td className="py-2.5 px-1 font-bold text-white">{rec.woNum}</td>
                        <td className="py-2.5 text-slate-400">{rec.cliente}</td>
                        <td className="py-2.5 font-medium">{rec.planta}</td>
                        <td className="py-2.5 text-slate-400">{rec.tipoWO}</td>
                        <td className="py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            rec.estado === 'Cerrada' || rec.estado === 'Finalizada'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : rec.estado === 'Bloqueada'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {rec.estado}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400 truncate max-w-[150px]" title={rec.descripcion}>{rec.descripcion}</td>
                        <td className="py-2.5 text-slate-300">{rec.tecnico}</td>
                        <td className="py-2.5 text-center">
                          {rec.hold ? (
                            <span className="text-rose-400 text-[10px] font-bold">SÍ</span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">NO</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right text-slate-500">{rec.fechaProgramada || 'Sin programar'}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => triggerNavigation('OTs', { search: rec.woNum })}
                            className="text-[10px] text-indigo-400 hover:text-white underline cursor-pointer"
                          >
                            Abrir en OT Center
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB C: CUMPLIMIENTO OT (SLA & OTs COMPLIANCE) */}
        {activeTab === 'cumplimiento' && (
          <div className="space-y-6">
            
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-2">
              <span className="h-2 w-2 bg-indigo-500 rounded-full"></span>
              <span>Insight Reference 02 — O&M General Operational Summary (SLA KPIs)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">SLA CONTRACTUAL ACUMULADO</span>
                  <div className="text-5xl font-black font-mono text-emerald-400 mt-2">{SLACompliance}%</div>
                  <span className="text-xs font-mono text-slate-400 block mt-2">Cumplimiento total acumulado de OTs cerradas en plazo.</span>
                </div>

                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 mt-6">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${SLACompliance}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                  <span>Mínimo garantizado: 90%</span>
                  <span>SLA Actual: {SLACompliance}%</span>
                </div>
              </div>

              {/* COMPENSACIÓN DE ESTADOS OPERATIVOS */}
              <div className="md:col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-3">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
                  COMPENSACIÓN DE ESTADOS OPERATIVOS POR TIPO DE ACTIVIDAD
                </h3>
                
                <div className="h-44 flex items-end justify-between px-6 pt-4 relative">
                  <div className="absolute inset-x-0 bottom-4 border-b border-slate-900"></div>
                  <div className="absolute inset-x-0 bottom-14 border-b border-slate-900/60"></div>
                  <div className="absolute inset-x-0 bottom-24 border-b border-slate-900/40"></div>
                  <div className="absolute inset-x-0 bottom-34 border-b border-slate-900/20"></div>

                  {/* SVG Bar 1: Preventiva */}
                  <div className="flex flex-col items-center gap-1.5 z-10 w-1/4">
                    <div className="h-32 w-10 bg-slate-900 rounded-md overflow-hidden flex flex-col justify-end">
                      <div className="bg-emerald-500 w-full" style={{ height: `${(biRecords.filter(o => o.tipoWO === 'Preventiva' && (o.estado === 'Cerrada' || o.estado === 'Finalizada')).length / Math.max(1, biRecords.filter(o => o.tipoWO === 'Preventiva').length)) * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 text-center leading-tight">Preventiva</span>
                  </div>

                  {/* SVG Bar 2: Correctiva */}
                  <div className="flex flex-col items-center gap-1.5 z-10 w-1/4">
                    <div className="h-32 w-10 bg-slate-900 rounded-md overflow-hidden flex flex-col justify-end">
                      <div className="bg-indigo-500 w-full" style={{ height: `${(biRecords.filter(o => o.tipoWO === 'Correctiva' && (o.estado === 'Cerrada' || o.estado === 'Finalizada')).length / Math.max(1, biRecords.filter(o => o.tipoWO === 'Correctiva').length)) * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 text-center leading-tight">Correctiva</span>
                  </div>

                  {/* SVG Bar 3: LOTO/HSE */}
                  <div className="flex flex-col items-center gap-1.5 z-10 w-1/4">
                    <div className="h-32 w-10 bg-slate-900 rounded-md overflow-hidden flex flex-col justify-end">
                      <div className="bg-red-500 w-full" style={{ height: `${(biRecords.filter(o => o.tipoWO === 'HSE' && (o.estado === 'Cerrada' || o.estado === 'Finalizada')).length / Math.max(1, biRecords.filter(o => o.tipoWO === 'HSE').length)) * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 text-center leading-tight">HSE / LOTO</span>
                  </div>

                  {/* SVG Bar 4: Crítica */}
                  <div className="flex flex-col items-center gap-1.5 z-10 w-1/4">
                    <div className="h-32 w-10 bg-slate-900 rounded-md overflow-hidden flex flex-col justify-end">
                      <div className="bg-amber-500 w-full" style={{ height: `${(biRecords.filter(o => o.prioridad === 'Crítica' && (o.estado === 'Cerrada' || o.estado === 'Finalizada')).length / Math.max(1, biRecords.filter(o => o.prioridad === 'Crítica').length)) * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 text-center leading-tight">Crítica</span>
                  </div>
                </div>
              </div>

            </div>

            {/* SLA BY SEGMENT */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-900">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-900 pb-2">
                DESGLOSE DE EFICIENCIA OPERATIVA POR SEGMENTO DE PRIORIDAD
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['Crítica', 'Alta', 'Media', 'Baja'].map(prio => {
                  const prioRecs = biRecords.filter(r => r.prioridad === prio);
                  const prioClosed = prioRecs.filter(r => r.estado === 'Cerrada' || r.estado === 'Finalizada').length;
                  const prioSla = prioRecs.length > 0 ? Math.round((prioClosed / prioRecs.length) * 100) : 100;
                  return (
                    <div key={prio} className="bg-slate-900/50 p-4 rounded-xl border border-slate-850">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-[10px] text-slate-500 uppercase">{prio}</span>
                        <span className={`text-xs font-bold ${
                          prioSla >= 90 ? 'text-emerald-400' : prioSla >= 70 ? 'text-amber-400' : 'text-rose-400'
                        }`}>{prioSla}% SLA</span>
                      </div>
                      <div className="text-2xl font-black font-mono text-white mt-1.5">{prioRecs.length} OTs</div>
                      <span className="text-[9px] text-slate-500 font-mono mt-1 block">Cerradas: {prioClosed} | Pendientes: {prioRecs.length - prioClosed}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB D: HH & RECURSOS (TECHNICIAN VS PLANT MATRIX & ESTIMATION REJECTION) */}
        {activeTab === 'hh' && (
          <div className="space-y-6">
            
            {/* REFERENCE ACCREDITATION */}
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-2">
              <span className="h-2 w-2 bg-indigo-500 rounded-full"></span>
              <span>Insight Reference 16 — Reporte HH / Technician vs Plant Matrix</span>
            </div>

            {/* RELIABILITY WARNING BANNER */}
            <div className="bg-amber-950/15 border border-amber-900/30 p-4 rounded-xl text-xs text-amber-300 font-mono leading-relaxed flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong>⚠️ NOTA DE CALIDAD DEL DATO HH (Advertencia de Confiabilidad HH):</strong> Las HH pueden provenir de planificación, registro manual o estimación operacional. No deben considerarse dato final validado sin confirmación de terreno/supervisión. No deben tratarse como verdad absoluta hasta la aprobación inmutable por parte de Supervisión Terreno y control documental de PTW.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* MEASUREMENT COMPARISON CARD */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
                    CUMPLIMIENTO DE MANO DE OBRA
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-center mt-4">
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] text-slate-500 block uppercase">Planificadas</span>
                      <span className="text-xl font-bold font-mono text-slate-300">{hhEstimadas}</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] text-slate-500 block uppercase">Registradas</span>
                      <span className="text-xl font-bold font-mono text-indigo-400">{hhReales}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded border border-slate-850 mt-4 text-center">
                    <span className="text-[9px] text-slate-500 block uppercase">Desviación Neta</span>
                    <span className={`text-2xl font-black font-mono ${desviacionHH > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {desviacionHH > 0 ? `+${desviacionHH}` : desviacionHH} Hrs
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-slate-900 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Confiabilidad del Dato:</span>
                    <span className="text-emerald-400 font-bold">Alta confianza (88%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Horas Validadas por HSE:</span>
                    <span className="text-white">{biRecords.filter(o => o.ptwEstado === 'Aprobado').reduce((acc, o) => acc + o.hhRegistradas, 0)} Hrs</span>
                  </div>
                </div>
              </div>

              {/* TECHNICIAN VS PLANT MATRIX (GRID) */}
              <div className="lg:col-span-2 bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    MATRIZ DE HORAS (TÉCNICO VS PLANTA) — DESVIACIÓN ESTIMADA/REPORTADA
                  </h3>
                  <span className="text-[9px] text-slate-500 font-mono">Unidad: Horas de Campo</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center font-mono text-[10px] text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 font-bold">
                        <th className="py-2 text-left">TÉCNICO / BRIGADA</th>
                        <th className="py-2">ATACAMA</th>
                        <th className="py-2">SANTIAGO</th>
                        <th className="py-2">CANTILLANA</th>
                        <th className="py-2">MAULE</th>
                        <th className="py-2">PARRAL</th>
                        <th className="py-2 text-right">TOTAL REPORTADO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {[
                        { name: 'Víctor León', h: [120, 0, 80, 40, 0], tot: 240 },
                        { name: 'Eduardo Carvallo', h: [0, 110, 30, 10, 50], tot: 200 },
                        { name: 'Daniel Godoy', h: [40, 0, 0, 0, 120], tot: 160 },
                        { name: 'Cristián Barraza', h: [150, 0, 0, 0, 0], tot: 150 },
                        { name: 'Rodrigo Cisterna', h: [0, 80, 40, 0, 0], tot: 120 }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="py-2.5 text-left font-bold text-white">{row.name}</td>
                          <td className="py-2.5 text-slate-400">{row.h[0] || '-'}</td>
                          <td className="py-2.5 text-slate-400">{row.h[1] || '-'}</td>
                          <td className="py-2.5 text-indigo-400 font-bold">{row.h[2] || '-'}</td>
                          <td className="py-2.5 text-slate-400">{row.h[3] || '-'}</td>
                          <td className="py-2.5 text-slate-400">{row.h[4] || '-'}</td>
                          <td className="py-2.5 text-right font-bold text-emerald-400">{row.tot} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* COMPREHENSIVE STAFF CARGA */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-900">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-900 pb-2">
                NIVELES DE CONFIABILIDAD DE JORNADAS DE CAMPO
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-emerald-900/30">
                  <span className="text-[9px] font-mono text-emerald-400 font-black block">🟢 ALTA CONFIANZA (&gt;80%)</span>
                  <div className="text-2xl font-black font-mono text-white mt-1">280 Hrs</div>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Validadas con firmas digitales en SharePoint.</p>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl border border-amber-900/30">
                  <span className="text-[9px] font-mono text-amber-500 font-black block">🟡 MEDIA CONFIANZA (50% - 80%)</span>
                  <div className="text-2xl font-black font-mono text-white mt-1">140 Hrs</div>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Estimaciones basadas en asignación histórica.</p>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl border border-rose-900/30">
                  <span className="text-[9px] font-mono text-rose-400 font-black block">🔴 BAJA CONFIANZA (&lt;50%)</span>
                  <div className="text-2xl font-black font-mono text-white mt-1">50 Hrs</div>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Sin bitácora técnica de repuestos ingresada.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB E: RANKING DE PLANTAS (PLANT EFFICIENCY & ISSUES) */}
        {activeTab === 'ranking' && (
          <div className="space-y-6">
            
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-900">
              <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-2">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  RANKING DE PARQUES POR INDICE DE COMPORTAMIENTO CONTRACTUAL
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Filtrado en tiempo real</span>
              </div>

              <div className="space-y-3">
                {plantas.map((planta, index) => {
                  const pOts = biRecords.filter(o => o.plantaId === planta.id || o.planta === planta.name);
                  const correctivos = pOts.filter(o => o.tipoWO === 'Correctiva').length;
                  const pClosed = pOts.filter(o => o.estado === 'Cerrada' || o.estado === 'Finalizada').length;
                  const sla = pOts.length > 0 ? Math.round((pClosed / pOts.length) * 100) : 100;

                  return (
                    <div 
                      key={planta.id} 
                      className="bg-slate-900/30 border border-slate-850/60 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded bg-slate-950 border border-slate-800 font-mono font-bold text-slate-400 flex items-center justify-center text-xs shadow-inner">
                          {index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white block">{planta.name}</span>
                            <span className="bg-indigo-500/10 text-indigo-400 text-[8px] px-1.5 rounded font-mono font-bold border border-indigo-500/20">
                              {planta.mwp} MWp
                            </span>
                            {(() => {
                              const badge = getPlantBadgeInfo((planta as any).legacyPlantId || planta.id, (planta as any).orbi_id || planta.id);
                              return (
                                <span 
                                  title={badge.tooltip}
                                  className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold border ${badge.styleToken}`}
                                >
                                  {badge.label}
                                </span>
                              );
                            })()}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">Cliente: {planta.cliente} | Región: {planta.region}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right font-mono text-xs">
                          <span className="text-slate-300 block font-bold">{pOts.length} OTs Registradas</span>
                          <span className="text-rose-400 text-[10px] block">{correctivos} OTs Correctivas</span>
                        </div>

                        <div className="text-right font-mono">
                          <span className={`text-sm font-black block ${sla >= 90 ? 'text-emerald-400' : 'text-rose-400'}`}>{sla}% SLA</span>
                          <span className="text-[9px] text-slate-500 block font-bold">Cierre General</span>
                        </div>

                        <button
                          onClick={() => triggerNavigation('OTs', { plantaNombre: planta.name })}
                          className="bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-slate-950 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all"
                        >
                          Inspeccionar OTs
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB F: CLIENTES O&M (PERFORMANCE FILTERED BY ASSET OWNER / CLIENT) */}
        {activeTab === 'clientes' && (
          <div className="space-y-6">
            
            {/* MASTER CLIENTS LIST (If none selected) */}
            {!selectedClient ? (
              <div className="space-y-6">
                
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-2">
                  <span className="h-2 w-2 bg-indigo-500 rounded-full"></span>
                  <span>Insight Client Summary — Seleccione un cliente para abrir su dashboard analítico</span>
                </div>

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-900">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4">
                    MEDICIÓN DE NIVELES DE SERVICIO (SLA) SEGÚN TITULAR DE CONTRATO
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-500 font-black">
                          <th className="pb-3 px-2">BENCHMARK CLIENTE</th>
                          <th className="pb-3 text-center">PARQUES OPERADOS</th>
                          <th className="pb-3 text-center font-bold">CAPACIDAD</th>
                          <th className="pb-3 text-center">OTs REGISTRADAS</th>
                          <th className="pb-3 text-center">EFICIENCIA</th>
                          <th className="pb-3 text-right">ESTADO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {[
                          { name: 'ICAFAL', plants: 2, mwp: 265.0, ots: 28, closed: 28, sla: 100, status: 'CONTROLADO', color: 'text-emerald-400 bg-emerald-950/20' },
                          { name: 'BIWO', plants: 2, mwp: 162.0, ots: 93, closed: 92, sla: 98.92, status: 'OBS. LEVE', color: 'text-amber-400 bg-amber-950/20' },
                          { name: 'CVE', plants: 3, mwp: 31.2, ots: 237, closed: 224, sla: 94.51, status: 'OBSERVACIÓN', color: 'text-orange-400 bg-orange-950/20' },
                          { name: 'AGR', plants: 3, mwp: 405.0, ots: 60, closed: 48, sla: 80.0, status: 'PLANIFICADO', color: 'text-indigo-400 bg-indigo-950/20' },
                          { name: 'ECOM', plants: 0, mwp: 0.0, ots: 0, closed: 0, sla: 100, status: 'EMPTY STATE', color: 'text-slate-500 bg-slate-900' }
                        ].map(cli => (
                          <tr key={cli.name} className="hover:bg-slate-900/30 transition-all">
                            <td className="py-3.5 px-2 font-bold text-white">
                              <button 
                                onClick={() => setSelectedClient(cli.name)}
                                className="text-indigo-400 hover:text-white underline font-bold"
                              >
                                {cli.name}
                              </button>
                            </td>
                            <td className="py-3.5 text-center text-slate-400">{cli.plants} Sitios</td>
                            <td className="py-3.5 text-center text-indigo-400 font-bold">{cli.mwp.toFixed(1)} MWp</td>
                            <td className="py-3.5 text-center font-bold">{cli.ots}</td>
                            <td className="py-3.5 text-center font-bold text-slate-200">{cli.sla}%</td>
                            <td className="py-3.5 text-right">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-black ${cli.color}`}>
                                {cli.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-center text-xs font-mono text-slate-400">
                  💡 **Consejo de navegación:** Haga clic en cualquiera de las marcas de clientes listados arriba para abrir el panel analítico acreditado correspondiente al benchmark analítico real.
                </div>

              </div>
            ) : (
              // DYNAMIC CLIENT-SPECIFIC SUB-DASHBOARD (THE REAL INSIGHT BENCHMARK VISUALS)
              <div className="space-y-6">
                
                {/* Back Button */}
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setSelectedClient(null)}
                    className="text-indigo-400 hover:text-white font-mono text-xs flex items-center gap-1 cursor-pointer"
                  >
                    ← Volver a Resumen de Clientes
                  </button>
                  <span className="text-[10px] font-mono bg-indigo-950/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/30">
                    Socio Comercial: {selectedClient}
                  </span>
                </div>

                {/* A. CLIENT ICAFAL DETAILED VIEW */}
                {selectedClient === 'ICAFAL' && (
                  <div className="space-y-6">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
                      <span>Insight Reference 06 — ICAFAL Client Activity Dashboard</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 uppercase">Estado Contractual</span>
                        <span className="text-2xl font-black text-emerald-400 mt-2 block">● CONTROLADO</span>
                        <p className="text-[11px] text-slate-400 leading-normal mt-2">
                          100% de cumplimiento en las 28 órdenes del período. Excelente desempeño.
                        </p>
                      </div>

                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 uppercase">Órdenes de Trabajo</span>
                        <span className="text-3xl font-black text-white mt-2 block">28 WOs</span>
                        <p className="text-[11px] text-slate-400 mt-2">22 Preventivas | 6 Correctivas</p>
                      </div>

                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 uppercase">SLA de Cierre</span>
                        <span className="text-3xl font-black text-emerald-400 mt-2 block">100.0%</span>
                        <p className="text-[11px] text-slate-400 mt-2">Cero desviaciones contractuales</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-3">
                      <span className="text-xs font-mono font-bold text-slate-400 block uppercase border-b border-slate-900 pb-2">CRÓNICA DE ACTIVIDAD ICAFAL</span>
                      <p className="text-xs text-slate-400 leading-relaxed font-mono">
                        Las 28 órdenes de trabajo fueron ejecutadas íntegramente por la brigada de Víctor León y Eduardo Carvallo. El mantenimiento preventivo anual en Atacama se cerró en plazo, adjuntando dossier de termografía infrarroja completo. No se reportan bloqueos logísticos ni incidentes HSE de ningún tipo en los activos vinculados.
                      </p>
                    </div>
                  </div>
                )}

                {/* B. CLIENT BIWO DETAILED VIEW */}
                {selectedClient === 'BIWO' && (
                  <div className="space-y-6">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 bg-amber-500 rounded-full"></span>
                      <span>Insight Reference 07 — BIWO Client Activity Dashboard</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 uppercase">Estado de Servicio</span>
                        <span className="text-2xl font-black text-amber-400 mt-2 block">● CONTROL CON OBS. LEVE</span>
                        <p className="text-[11px] text-slate-400 leading-normal mt-2">
                          1 orden de trabajo atrasada de un volumen total muy alto (93 órdenes).
                        </p>
                      </div>

                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 uppercase">Volumen de Trabajo</span>
                        <span className="text-3xl font-black text-white mt-2 block">93 WOs</span>
                        <p className="text-[11px] text-slate-400 mt-2">92 Cerradas exitosamente | 1 En ejecución</p>
                      </div>

                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 uppercase">SLA Acumulado</span>
                        <span className="text-3xl font-black text-amber-400 mt-2 block">98.92%</span>
                        <p className="text-[11px] text-slate-400 mt-2">Muy por encima del 90% contractual</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-2 font-mono text-xs">
                      <span className="text-xs font-bold text-slate-400 block uppercase border-b border-slate-900 pb-2">OT EN DESVIACIÓN (RETENIDO EN SANDBOX)</span>
                      <div className="bg-slate-900/60 p-3.5 rounded border border-slate-850 flex justify-between items-center">
                        <div>
                          <strong className="text-white block">BIW-93: Mantenimiento trimestral inversores</strong>
                          <span className="text-[10px] text-slate-500">Asignada a Daniel Godoy | Zona Centro | Esperando repuesto fusible</span>
                        </div>
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-black text-[10px]">ATRASADA</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* C. CLIENT CVE DETAILED VIEW */}
                {selectedClient === 'CVE' && (
                  <div className="space-y-6">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></span>
                      <span>Insight Reference 13 — CVE Client Activity Dashboard</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 uppercase">Estado Contractual</span>
                        <span className="text-2xl font-black text-orange-400 mt-2 block">⚠️ EN OBSERVACIÓN</span>
                        <p className="text-[11px] text-slate-400 leading-normal mt-2">
                          13 correctivas atrasadas acumuladas de 237 totales. Requiere atención directiva.
                        </p>
                      </div>

                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 uppercase">KPI Backlog</span>
                        <span className="text-3xl font-black text-white mt-2 block">13 Atrasadas</span>
                        <p className="text-[11px] text-slate-400 mt-2">224 ejecutadas y cerradas exitosamente</p>
                      </div>

                      <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 uppercase">SLA Real</span>
                        <span className="text-3xl font-black text-amber-500 mt-2 block">94.51%</span>
                        <p className="text-[11px] text-slate-400 mt-2">En el límite del estándar óptimo</p>
                      </div>
                    </div>

                    {/* CRITICAL SITES ACCORDING TO INSIGHT REFERENCE */}
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-3">
                      <span className="text-xs font-mono font-bold text-red-400 block uppercase border-b border-slate-900 pb-2 flex items-center gap-1">
                        ⚠️ SITIOS Y PLANTAS CRÍTICAS DE CVE DETECTADAS
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                          <strong className="text-white block text-sm">Planta Clementina</strong>
                          <span className="text-[10px] text-amber-500 block mt-1">● Alerta de Backlog de Correctivas</span>
                          <p className="text-slate-400 mt-2 leading-relaxed">
                            Acumula 8 correctivas en estado "En ruta" por reparación de cableado DC e inversores Sungrow SG250.
                          </p>
                        </div>

                        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                          <strong className="text-white block text-sm">Planta Liquidámbar</strong>
                          <span className="text-[10px] text-amber-500 block mt-1">● Bloqueos de Comunicación RS-485</span>
                          <p className="text-slate-400 mt-2 leading-relaxed">
                            Acumula 5 correctivas en ruta debido a desconexión del anillo de fibra óptica interna del parque.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* D. CLIENT AGR DETAILED VIEW */}
                {selectedClient === 'AGR' && (
                  <div className="space-y-6">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 bg-indigo-500 rounded-full"></span>
                      <span>Insight Reference 14 — AGR Client Scheduled / Accumulated Dashboard</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 block">SLA TOTAL ACUMULADO</span>
                        <span className="text-2xl font-black text-amber-500 mt-2 block">80.0%</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 block">COMPLETED</span>
                        <span className="text-2xl font-black text-emerald-400 mt-2 block">48 WOs</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 block">SCHEDULED / PROGRAMADAS</span>
                        <span className="text-2xl font-black text-indigo-400 mt-2 block">8 WOs</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-center font-mono">
                        <span className="text-[10px] text-slate-500 block">ON HOLD / BLOQUEADAS</span>
                        <span className="text-2xl font-black text-rose-400 mt-2 block">4 WOs</span>
                      </div>
                    </div>

                    {/* PLANT ATRASO METER */}
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-900 space-y-4 font-mono text-xs">
                      <span className="text-xs font-bold text-slate-400 block uppercase border-b border-slate-900 pb-2">
                        % ATRASO Y COMPORTAMIENTO POR PLANTA DEL CONTRATO AGR
                      </span>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-white">Pozo de Almonte 2</span>
                            <span className="text-slate-400">0% Atraso (Cumplimiento 100%)</span>
                          </div>
                          <div className="bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                            <div className="bg-emerald-400 h-full" style={{ width: '100%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-white">Pozo de Almonte 3</span>
                            <span className="text-slate-400">15% Atraso (Cumplimiento 85%)</span>
                          </div>
                          <div className="bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                            <div className="bg-indigo-400 h-full" style={{ width: '85%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-white">Calama Solar 3</span>
                            <span className="text-slate-400">40% Atraso (Cumplimiento 60% — Esperando LOTO)</span>
                          </div>
                          <div className="bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                            <div className="bg-rose-500 h-full" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* E. CLIENT ECOM DETAILED VIEW (EMPTY STATE ACCREDITATION) */}
                {selectedClient === 'ECOM' && (
                  <div className="space-y-6">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 bg-slate-700 rounded-full"></span>
                      <span>Insight Reference 15 — ECOM Empty / Inactive Client Dashboard</span>
                    </div>

                    <div className="bg-slate-950 p-12 rounded-2xl border border-slate-900 text-center max-w-xl mx-auto space-y-4">
                      <HelpCircle className="h-12 w-12 text-slate-600 mx-auto" />
                      <h4 className="text-sm font-bold text-white font-mono uppercase">Cliente Sin Registro de Datos Activos</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-mono">
                        El socio de activos **ECOM** se encuentra pre-inscrito en el maestro pero no cuenta con órdenes de trabajo activas, programadas ni históricas para el ciclo contractual de campo en curso. Su disponibilidad nominal no se ve comprometida por variables de terreno.
                      </p>
                      <div className="pt-2">
                        <span className="bg-slate-900 text-slate-500 font-mono text-[9px] px-2.5 py-1 rounded border border-slate-800">
                          Panel Empty State Listo para Onboarding
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* TAB G: HH MIX POR TIPO WO */}
        {activeTab === 'hhmix' && (
          <div className="space-y-6">
            
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex items-center gap-2">
              <span className="h-2 w-2 bg-indigo-500 rounded-full"></span>
              <span>Insight Reference 17 — HH Distribution by Work Order Type</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* COMPACT SUMMARY INSIGHTS */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-400" /> METAS DE JORNADAS REALES
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-3">
                    Mapeo de la distribución del tiempo trabajado por tipo de actividad. La meta óptima de la directiva establece una proporción de **60% Preventivo** y **40% Reactivo / Correctivo**.
                  </p>
                </div>

                <div className="space-y-2 mt-6">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-emerald-400">Preventivo: {pctPreventiva}%</span>
                    <span className="text-slate-500">Meta: 60%</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono border-t border-slate-900 pt-2">
                    <span className="text-indigo-400">Correctivo: {pctCorrectiva}%</span>
                    <span className="text-slate-500">Meta: 25%</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono border-t border-slate-900 pt-2">
                    <span className="text-red-400">HSE / LOTO: {pctHse}%</span>
                    <span className="text-slate-500">Meta: 15%</span>
                  </div>
                </div>
              </div>

              {/* HORIZONTAL STACKED PROGRESS GRAPH */}
              <div className="lg:col-span-2 bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
                  DENSIDAD Y DISTRIBUCIÓN HORARIA TOTAL DE TRABAJO (HH REALES)
                </h3>

                <div className="space-y-6 pt-2">
                  <div className="w-full bg-slate-900 h-8 rounded-lg overflow-hidden border border-slate-800 flex">
                    <div className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-mono text-slate-950 font-black" style={{ width: `${pctPreventiva}%` }} title={`Preventivo: ${pctPreventiva}%`}>
                      {pctPreventiva}%
                    </div>
                    <div className="bg-indigo-500 h-full flex items-center justify-center text-[10px] font-mono text-white font-black" style={{ width: `${pctCorrectiva}%` }} title={`Correctivo: ${pctCorrectiva}%`}>
                      {pctCorrectiva}%
                    </div>
                    <div className="bg-red-500 h-full flex items-center justify-center text-[10px] font-mono text-white font-black" style={{ width: `${pctHse}%` }} title={`HSE/LOTO: ${pctHse}%`}>
                      {pctHse}%
                    </div>
                    <div className="bg-slate-700 h-full flex items-center justify-center text-[10px] font-mono text-slate-300 font-black" style={{ width: `${pctAdmin}%` }} title={`Admin: ${pctAdmin}%`}>
                      {pctAdmin}%
                    </div>
                  </div>

                  {/* Legends */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded bg-emerald-500"></span>
                      <div>
                        <span className="text-white font-bold block">Preventivo ({pctPreventiva}%)</span>
                        <span className="text-[10px] text-slate-500">{hhPreventiva} Hrs Totales</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded bg-indigo-500"></span>
                      <div>
                        <span className="text-white font-bold block">Correctivo ({pctCorrectiva}%)</span>
                        <span className="text-[10px] text-slate-500">{hhCorrectiva} Hrs Totales</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded bg-red-500"></span>
                      <div>
                        <span className="text-white font-bold block">HSE / LOTO ({pctHse}%)</span>
                        <span className="text-[10px] text-slate-500">{hhHse} Hrs Totales</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded bg-slate-700"></span>
                      <div>
                        <span className="text-white font-bold block">Otros / Admin ({pctAdmin}%)</span>
                        <span className="text-[10px] text-slate-500">{hhAdmin} Hrs Totales</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB H: REPORTE GERENCIAL IA (FOTON PRIME ANALYST) */}
        {activeTab === 'gerencia' && (
          <div className="space-y-6">
            
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                    <Cpu className="h-5 w-5 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      FOTON PRIME O&M IA <span className="bg-indigo-500/10 text-indigo-400 text-[8px] px-1.5 rounded">DIRECTIVO v0.12A</span>
                    </h3>
                    <p className="text-[10px] text-slate-500">Asistente de inteligencia generativa y consolidación de reportes ejecutivos</p>
                  </div>
                </div>

                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/50 border border-indigo-900/40 px-2 py-0.5 rounded">
                  MODEL: GEMINI-3.5-FLASH
                </span>
              </div>

              {/* Inquiries Box */}
              <div className="bg-slate-950 p-4 border-b border-slate-900 space-y-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase block font-black">Consultas directivas rápidas:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handlePreconfiguredQuestion('status_equipo')}
                    className="bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 text-indigo-400 hover:text-slate-950 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
                  >
                    “Dame el estatus del equipo O&M”
                  </button>
                  <button
                    onClick={() => handlePreconfiguredQuestion('zonas_carga')}
                    className="bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 text-indigo-400 hover:text-slate-950 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
                  >
                    “¿Qué zonas tienen más carga?”
                  </button>
                  <button
                    onClick={() => handlePreconfiguredQuestion('plantas_criticas')}
                    className="bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 text-indigo-400 hover:text-slate-950 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
                  >
                    “¿Qué plantas están críticas?”
                  </button>
                  <button
                    onClick={() => handlePreconfiguredQuestion('temas_escalar')}
                    className="bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 text-indigo-400 hover:text-slate-950 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
                  >
                    “¿Qué temas deben escalarse?”
                  </button>
                </div>

                {/* Custom Query Entry */}
                <form onSubmit={handleCustomQuestionSubmit} className="flex gap-2 pt-2 border-t border-slate-900/60 mt-2">
                  <input
                    type="text"
                    placeholder="Hacer otra pregunta operacional a Foton Prime IA..."
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center px-4 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Generation Space */}
              <div className="p-6 font-mono text-xs text-slate-300 leading-relaxed min-h-[250px] select-text">
                {isAiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                    <span>FOTON PRIME procesando reportes consolidados y variables críticas...</span>
                  </div>
                ) : aiAnswer ? (
                  <div className="space-y-3 whitespace-pre-wrap">
                    {aiAnswer.split('\n').map((line, idx) => {
                      if (line.startsWith('###')) {
                        return (
                          <h3 key={idx} className="text-xs font-bold text-white border-b border-slate-800 pb-1.5 mb-2 mt-4 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-indigo-400" /> {line.replace('###', '')}
                          </h3>
                        );
                      }
                      if (line.startsWith('*') || line.startsWith('-')) {
                        return <div key={idx} className="pl-4 border-l border-indigo-500/30 text-slate-300 py-0.5">{line}</div>;
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
                ) : (
                  <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                    <span>Seleccione una pregunta o escriba una duda en el recuadro superior para gatillar el análisis generativo de Foton Prime IA.</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ORBI Report Pack Wizard Modal */}
        {showReportWizard && (
          <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">ORBI Report Pack Wizard</h3>
                    <p className="text-[10px] text-slate-500 font-mono">CONFIGURACIÓN DE REPORTE O&M</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReportWizard(false)}
                  className="text-slate-500 hover:text-white cursor-pointer animate-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                
                {/* Type Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Tipo de Reporte</label>
                  <select
                    value={wizardReportType}
                    onChange={(e) => setWizardReportType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="ejecutivo">Reporte Ejecutivo O&M (Interno)</option>
                    <option value="cliente">Reporte Cliente O&M (SLA & Avance)</option>
                    <option value="zona">Reporte de Desempeño Regional (Zona)</option>
                    <option value="planta">Reporte Técnico de Planta Solar</option>
                    <option value="hh">Reporte de HH & Recursos (Asistencia)</option>
                    <option value="mensual">Reporte de Cierre Mensual Consolidado</option>
                  </select>
                </div>

                {/* Conditional sub-options */}
                {wizardReportType === 'cliente' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Seleccionar Cliente</label>
                    <select
                      value={wizardClient || ''}
                      onChange={(e) => setWizardClient(e.target.value || null)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                    >
                      <option value="BIWO">BIWO (98.92% SLA - Obs. Leve)</option>
                      <option value="ICAFAL">ICAFAL (100% SLA - Controlado)</option>
                      <option value="CVE">CVE (94.51% SLA - Obs. Crítica Clementina/Liquidámbar)</option>
                      <option value="AGR">AGR (78.57% SLA - Pte. Cierre)</option>
                      <option value="ECOM">ECOM (Empty State - Sin Actividad)</option>
                    </select>
                  </div>
                )}

                {wizardReportType === 'zona' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Seleccionar Zona Regional</label>
                    <select
                      value={wizardZone}
                      onChange={(e) => setWizardZone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                    >
                      <option value="Norte">Zona Norte (Atacama / Pozo de Almonte)</option>
                      <option value="Centro">Zona Centro (Metropolitana / Maule / O&M Hub)</option>
                      <option value="Sur">Zona Sur (Biobío / Araucanía)</option>
                    </select>
                  </div>
                )}

                {wizardReportType === 'planta' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Seleccionar Planta Solar</label>
                    <select
                      value={wizardPlant || ''}
                      onChange={(e) => setWizardPlant(e.target.value || null)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                    >
                      {plantas.map((p) => (
                        <option key={p.id} value={p.name}>{p.name} ({p.region})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-mono text-slate-400 leading-normal">
                    Este reporte opera de forma <strong>read-only</strong> y 100% segura en Sandbox. No modifica la base de datos de terreno ni los inventarios del centro operativo.
                  </p>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setShowReportWizard(false)}
                  className="bg-slate-900 hover:bg-slate-850 px-4 py-2 rounded-lg text-xs font-mono text-slate-400 cursor-pointer border border-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowReportWizard(false);
                    setShowPrintPreview(true);
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono px-4 py-2 rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Vista Previa PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ORBI Report Print Preview Fullscreen Overlay */}
        {showPrintPreview && (
          <div className="fixed inset-0 z-[9999] bg-slate-950 overflow-y-auto p-4 md:p-8">
            <InsightReportPrintView
              reportType={wizardReportType}
              selectedClient={wizardClient}
              selectedZone={wizardZone}
              selectedPlant={wizardPlant}
              plantas={plantas}
              ots={ots}
              findings={findings}
              planificacion={planificacion}
              onClose={() => setShowPrintPreview(false)}
            />
          </div>
        )}

      </div>
    </div>
  );
}
