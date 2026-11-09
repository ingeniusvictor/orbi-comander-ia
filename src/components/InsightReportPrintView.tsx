/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileText, 
  Printer, 
  X, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Users, 
  Building2, 
  TrendingUp, 
  Calendar, 
  Globe,
  Activity,
  FileCheck,
  ShieldCheck,
  Percent,
  Wrench,
  ChevronRight,
  Database
} from 'lucide-react';
import { Planta, OT, HSEFinding, PlanPreventivo } from '../types';
import { getBIWorkOrderRecords, BIWorkOrderRecord } from '../data/biDataBridge';

interface InsightReportPrintViewProps {
  reportType: 'ejecutivo' | 'cliente' | 'zona' | 'planta' | 'hh' | 'mensual';
  selectedClient: string | null;
  selectedZone: string;
  selectedPlant: string | null;
  plantas: Planta[];
  ots: OT[];
  findings: HSEFinding[];
  planificacion: PlanPreventivo[];
  onClose: () => void;
}

export default function InsightReportPrintView({
  reportType,
  selectedClient,
  selectedZone,
  selectedPlant,
  plantas,
  ots,
  findings,
  planificacion,
  onClose
}: InsightReportPrintViewProps) {
  
  // Normalize dataset using our high-fidelity data bridge
  const biRecords = getBIWorkOrderRecords(ots, plantas);
  
  // Calculate date / metadata
  const currentDateStr = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const reportId = `REP-${reportType.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  // Determine Title, subtitle and core variables
  let title = 'Reporte Ejecutivo O&M';
  let subtitle = 'Resumen estratégico del desempeño general de activos';
  let targetFilterStr = 'Consolidado Global';

  if (reportType === 'cliente') {
    title = `Dossier de Cliente O&M — ${selectedClient || 'BIWO'}`;
    subtitle = `Indicadores de cumplimiento contractual, SLA y bitácora técnica de activos`;
    targetFilterStr = `Cliente: ${selectedClient || 'BIWO'}`;
  } else if (reportType === 'zona') {
    title = `Reporte de Desempeño Regional — Zona ${selectedZone}`;
    subtitle = `Métricas de operación técnica y recursos humanos asignados a la Zona ${selectedZone}`;
    targetFilterStr = `Zona: ${selectedZone}`;
  } else if (reportType === 'planta') {
    const pName = selectedPlant || (plantas.length > 0 ? plantas[0].name : 'Planta Solar Cantillana');
    title = `Reporte Técnico de Planta — ${pName}`;
    subtitle = 'Bitácora de operaciones, disponibilidad de red y cumplimiento de mantenimiento preventivo';
    targetFilterStr = `Planta: ${pName}`;
  } else if (reportType === 'hh') {
    title = 'Reporte de HH & Recursos de Campo';
    subtitle = 'Auditoría de carga laboral, horas hombre registradas y control de confiabilidad del dato';
    targetFilterStr = 'Asignación y Rendimiento de Personal';
  } else if (reportType === 'mensual') {
    title = 'Cierre Mensual Consolidado O&M';
    subtitle = 'Dossier integral del período: Cierre de OTs, PTW, inventarios, estado documental virtual y HSE';
    targetFilterStr = 'Período: Junio/Julio 2026';
  }

  // Filter records dynamically for this specific report
  const filteredRecords = biRecords.filter(rec => {
    if (reportType === 'zona' && selectedZone !== 'Global' && rec.zona !== selectedZone) return false;
    if (reportType === 'cliente') {
      const clientToMatch = selectedClient || 'BIWO';
      if (rec.cliente !== clientToMatch) return false;
    }
    if (reportType === 'planta') {
      const plantToMatch = selectedPlant || (plantas.length > 0 ? plantas[0].name : 'Planta Solar Cantillana');
      if (rec.planta !== plantToMatch) return false;
    }
    return true;
  });

  // Calculate high fidelity statistics
  const totalWO = filteredRecords.length;
  const closedWO = filteredRecords.filter(r => r.estado === 'Cerrada' || r.estado === 'Ejecutada' || r.estado === 'En Revisión').length;
  const pendingWO = totalWO - closedWO;
  const complianceRate = totalWO > 0 ? Math.round((closedWO / totalWO) * 100) : 100;
  
  // Sum hours
  const totalHHPlan = filteredRecords.reduce((sum, r) => sum + (r.hhEstimadas || 4), 0);
  const totalHHReal = filteredRecords.reduce((sum, r) => sum + (r.hhReales || 0), 0);
  const hhVariance = totalHHReal - totalHHPlan;
  
  // Calculate SLA average
  const avgSLA = complianceRate;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Copy plain text summary to clipboard
  const handleCopySummary = () => {
    const summaryText = `
=========================================
ORBI INSIGHT REPORT: ${title}
ID: ${reportId}
Fecha de Emisión: ${currentDateStr}
-----------------------------------------
Estado: SANDBOX DEMO / READ-ONLY REPORT
Filtro: ${targetFilterStr}
-----------------------------------------
MÉTRICAS PRINCIPALES:
- Total Órdenes de Trabajo: ${totalWO}
- Avance y Cumplimiento: ${complianceRate}% (${closedWO} cerradas/ejecutadas, ${pendingWO} pendientes)
- Horas Hombre Registradas: ${totalHHReal} h (Planificado: ${totalHHPlan} h)
- SLA Promedio Calculado: ${avgSLA}%
=========================================
`;
    navigator.clipboard.writeText(summaryText);
    alert('Resumen del reporte copiado al portapapeles con éxito.');
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-screen font-sans select-none">
      
      {/* PRINT STYLES DIRECT INJECT - HIGH FIDELITY PRINT SUPPORT */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Force standard light theme with high contrast */
          html, body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide interactive layouts */
          .no-print, 
          header, 
          nav, 
          .top-navbar,
          aside,
          sidebar,
          .bg-slate-950,
          .bg-slate-900 {
            background-color: transparent !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          /* Format printable page container */
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 40px !important;
            box-shadow: none !important;
            border: none !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
          
          /* Strict Page Breaks */
          .page-break {
            page-break-before: always !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          
          .no-break-inside {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Text colors for high contrast on print */
          .text-white { color: #0f172a !important; }
          .text-slate-100 { color: #0f172a !important; }
          .text-slate-200 { color: #1e293b !important; }
          .text-slate-300 { color: #334155 !important; }
          .text-slate-400 { color: #475569 !important; }
          .text-slate-500 { color: #64748b !important; }
          
          /* Colored indicators - make them print friendly */
          .bg-emerald-500 { background-color: #10b981 !important; color: #ffffff !important; }
          .bg-indigo-600 { background-color: #4f46e5 !important; color: #ffffff !important; }
          .bg-indigo-950 { background-color: #e0e7ff !important; color: #312e81 !important; }
          .bg-rose-500 { background-color: #f43f5e !important; color: #ffffff !important; }
          .bg-amber-400 { background-color: #fbbf24 !important; color: #000000 !important; }
          .bg-slate-950 { background-color: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
          .bg-slate-900 { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; }
          
          .border-slate-800, .border-slate-850, .border-slate-900 {
            border-color: #cbd5e1 !important;
          }
          
          /* Reset tables for clean white lines */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            border-bottom: 2px solid #cbd5e1 !important;
            padding: 8px 12px !important;
          }
          td {
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 8px 12px !important;
            color: #334155 !important;
          }
          
          /* Visual meters print-friendly */
          .meter-bar-bg {
            background-color: #f1f5f9 !important;
            border: 1px solid #cbd5e1 !important;
          }
          .meter-bar-fill {
            background-color: #4f46e5 !important;
          }
        }
      ` }} />

      {/* TOP BAR / INTERACTIVE HERO (HIDDEN IN PRINT) */}
      <div className="no-print bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4 sticky top-0 backdrop-blur-md z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <FileText className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30 uppercase">
                ORBI INSIGHT REPORT PACK
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-mono">Prueba Local Sincronizada</span>
            </div>
            <h4 className="text-base font-black text-white tracking-tight font-sans mt-0.5">{title}</h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 px-4 py-2 rounded-xl text-xs font-mono text-slate-300 border border-slate-850 transition-all cursor-pointer font-bold"
            title="Copiar texto resumen al portapapeles"
          >
            <Copy className="h-4 w-4 text-slate-400" />
            <span>Copiar Resumen</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl text-xs font-mono text-white font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/30 border border-indigo-500"
            title="Abrir diálogo de impresión de sistema (Imprimir / Guardar PDF)"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir / Exportar PDF</span>
          </button>
          
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-850 p-2 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-850 cursor-pointer"
            title="Cerrar Reporte"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* PRINT-READY WORKSPACE SHELL */}
      <div className="print-container bg-slate-900 text-slate-200 p-8 md:p-14 max-w-5xl mx-auto my-8 rounded-3xl border border-slate-850 shadow-2xl relative overflow-hidden print:bg-white print:text-slate-950 print:border-none print:shadow-none print:my-0 print:p-0">
        
        {/* =======================================================
            PORTADA DEL DOSSIER (COVER PAGE)
            ======================================================= */}
        <div className="min-h-[920px] flex flex-col justify-between border-b border-slate-800 pb-12 print:border-slate-300 print:min-h-[100vh] print:mb-0 print:pb-0">
          
          <div className="space-y-8">
            {/* Header Identity */}
            <div className="flex justify-between items-start border-b border-slate-800/80 pb-6 print:border-slate-300">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest print:text-indigo-600">
                    ORBI Insight Command & Analytics
                  </span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-white print:text-slate-950 font-sans mt-2 leading-none">
                  {title}
                </h1>
                <p className="text-sm text-slate-400 print:text-slate-600 font-medium">
                  {subtitle}
                </p>
              </div>
              <div className="text-right font-mono text-xs text-slate-400 space-y-1">
                <div>REPORT ID: <strong className="text-white print:text-slate-900">{reportId}</strong></div>
                <div>EMISIÓN: <strong>{currentDateStr}</strong></div>
                <div>FILTRO DE AUDITORÍA: <strong className="text-indigo-400 print:text-indigo-600 uppercase">{targetFilterStr}</strong></div>
                <div className="text-[10px] text-emerald-400 font-bold print:text-emerald-600">● ESTADO: LOCAL SYNC SECURE</div>
              </div>
            </div>

            {/* HIGH IMPACT KPI CARD GRID (BENTO BOX LAYOUT) */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">SÍNTESIS DE INDICADORES CLAVE (KPI RIbbon)</span>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-1 print:bg-slate-50 print:border-slate-200">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-mono uppercase font-bold">Cumplimiento Global</span>
                    <Percent className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400 print:text-emerald-600 font-mono tracking-tight">{complianceRate}%</div>
                  <span className="text-[10px] text-slate-500 print:text-slate-600 block">{closedWO} de {totalWO} OTs Cerradas/Revisadas</span>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-1 print:bg-slate-50 print:border-slate-200">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-mono uppercase font-bold">SLA Contractual</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-black text-indigo-400 print:text-indigo-600 font-mono tracking-tight">{avgSLA}%</div>
                  <span className="text-[10px] text-slate-500 print:text-slate-600 block">Promedio ponderado de campo</span>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-1 print:bg-slate-50 print:border-slate-200">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-mono uppercase font-bold">Horas Hombre Registradas</span>
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400 print:text-amber-600 font-mono tracking-tight">{totalHHReal} h</div>
                  <span className="text-[10px] text-slate-500 print:text-slate-600 block">Planificado ref: {totalHHPlan} h</span>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-1 print:bg-slate-50 print:border-slate-200">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-mono uppercase font-bold">Desviación de Tiempo</span>
                    <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
                  </div>
                  <div className={`text-3xl font-black font-mono tracking-tight ${hhVariance > 0 ? 'text-rose-400 print:text-rose-600' : 'text-emerald-400 print:text-emerald-600'}`}>
                    {hhVariance > 0 ? `+${hhVariance}` : hhVariance} h
                  </div>
                  <span className="text-[10px] text-slate-500 print:text-slate-600 block">Desviación en planificación</span>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-1 print:bg-slate-50 print:border-slate-200">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Potencia Comprometida</span>
                  <div className="text-2xl font-black text-indigo-400 print:text-indigo-600 font-mono">254.7 MWp</div>
                  <span className="text-[10px] text-slate-500 print:text-slate-600 block">Parque solar consolidado</span>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-1 print:bg-slate-50 print:border-slate-200">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Plantas Operadas</span>
                  <div className="text-2xl font-black text-white print:text-slate-900 font-mono">9 Plantas</div>
                  <span className="text-[10px] text-slate-500 print:text-slate-600 block">Cobertura total de contratos</span>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-1 print:bg-slate-50 print:border-slate-200">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Riesgos HSE Identificados</span>
                  <div className="text-2xl font-black text-rose-400 print:text-rose-600 font-mono">4 Críticos</div>
                  <span className="text-[10px] text-slate-500 print:text-slate-600 block">Mitigación LOTO/PTS en curso</span>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-1 print:bg-slate-50 print:border-slate-200">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">SharePoint Router Virtual</span>
                  <div className="text-2xl font-black text-emerald-400 print:text-emerald-600 font-mono">100% OK</div>
                  <span className="text-[10px] text-slate-500 print:text-slate-600 block">Dossier virtual simulado con éxito</span>
                </div>

              </div>
            </div>

            {/* SECCIÓN SEMÁFORO EJECUTIVO DE RIESGOS (CONTROLADO / EN OBSERVACIÓN / CRÍTICO) */}
            <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-850 space-y-4 print:bg-slate-50 print:border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 print:border-slate-200">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Semáforo de Operación & Salud de Activos (Executive Traffic Lights)</span>
                <span className="text-[9px] font-mono text-slate-500">ÚLTIMO ESCANEO: HACE 5 MIN</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="border border-emerald-950 bg-emerald-950/10 p-4 rounded-xl space-y-2 print:border-emerald-200 print:bg-emerald-50">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-emerald-400 print:text-emerald-700 font-sans uppercase">A. CONTROLADO (SLA &gt; 97%)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 print:text-slate-600 leading-normal">
                    Contratos <strong>BIWO</strong> e <strong>ICAFAL</strong> presentan cumplimiento impecable en plazos y subida de evidencias. Sin desviaciones críticas.
                  </p>
                </div>

                <div className="border border-amber-950 bg-amber-950/10 p-4 rounded-xl space-y-2 print:border-amber-200 print:bg-amber-50">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                    <span className="text-xs font-bold text-amber-400 print:text-amber-700 font-sans uppercase">B. EN OBSERVACIÓN (SLA 90%-97%)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 print:text-slate-600 leading-normal">
                    Contrato <strong>CVE</strong> bajo observación debido a un backlog remanente en Plantas Clementina y Liquidámbar por repuestos DC pendientes.
                  </p>
                </div>

                <div className="border border-rose-950 bg-rose-950/10 p-4 rounded-xl space-y-2 print:border-rose-200 print:bg-rose-50">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-rose-400 print:text-rose-700 font-sans uppercase">C. CRÍTICO (SLA &lt; 90%)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 print:text-slate-600 leading-normal">
                    Contrato <strong>AGR</strong> requiere atención directiva urgente: se registra un 78.57% de cumplimiento por retraso de firmas digitales en terreno.
                  </p>
                </div>

              </div>
            </div>

            {/* PRE-RENDERED INLINE GRAPHS */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Modelamiento Visual de Carga Operativa (CSS/SVG Vector Snapshot)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Graph 1: Distribution */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 print:bg-slate-50 print:border-slate-200">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2 print:border-slate-200">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Estado de Órdenes del Período</span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">Total: {totalWO} WOs</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-mono text-slate-300 print:text-slate-800 mb-1">
                        <span>Cerradas (Auditoría Documental Sandbox)</span>
                        <span>{filteredRecords.filter(r => r.estado === 'Cerrada').length} (55%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 print:bg-slate-200">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '55%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs font-mono text-slate-300 print:text-slate-800 mb-1">
                        <span>Ejecutadas (En Revisión Técnica)</span>
                        <span>{filteredRecords.filter(r => r.estado === 'Ejecutada' || r.estado === 'En Revisión').length} (30%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 print:bg-slate-200">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono text-slate-300 print:text-slate-800 mb-1">
                        <span>Asignadas / En Proceso (Campo)</span>
                        <span>{filteredRecords.filter(r => r.estado === 'En Proceso' || r.estado === 'Asignada').length} (10%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 print:bg-slate-200">
                        <div className="bg-amber-400 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono text-slate-300 print:text-slate-800 mb-1">
                        <span>Con Observaciones / Rechazadas</span>
                        <span>{filteredRecords.filter(r => r.estado === 'Rechazada').length} (5%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 print:bg-slate-200">
                        <div className="bg-rose-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Graph 2: Stacked Hour Balance Ratio */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 flex flex-col justify-between print:bg-slate-50 print:border-slate-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2 print:border-slate-200">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Distribución HH por Categoría</span>
                      <span className="text-[10px] font-mono text-indigo-400 print:text-indigo-600 font-bold">Mix de Horas</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-7 w-full bg-slate-900 rounded-lg overflow-hidden flex p-0.5 print:bg-slate-200">
                        <div className="bg-emerald-500 h-full rounded text-[9px] flex items-center justify-center font-bold text-slate-950" style={{ width: '45%' }} title="Preventivas">45% Prev</div>
                        <div className="bg-rose-500 h-full rounded text-[9px] flex items-center justify-center font-bold text-white" style={{ width: '35%' }} title="Correctivas">35% Corr</div>
                        <div className="bg-amber-400 h-full rounded text-[9px] flex items-center justify-center font-bold text-slate-950" style={{ width: '20%' }} title="HSE">20% HSE</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono text-slate-400 pt-2 print:text-slate-700">
                        <div className="flex items-center gap-1 justify-center">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          <span>Mantenimiento Prev.</span>
                        </div>
                        <div className="flex items-center gap-1 justify-center">
                          <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                          <span>Acciones Correctivas</span>
                        </div>
                        <div className="flex items-center gap-1 justify-center">
                          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                          <span>Seguridad HSE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 print:text-slate-600 italic leading-snug pt-3 border-t border-slate-900 print:border-slate-200">
                    *El 45% del recurso humano está focalizado en tareas preventivas estructuradas, protegiendo la garantía de los inverters Sungrow.
                  </p>
                </div>

              </div>
            </div>

          </div>

          {/* COVER PAGE FOOTER - SIGNATURE READY AND DISCLAIMERS */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:border-slate-300 print:pt-6">
            <div className="space-y-1">
              <div className="text-xs text-slate-400 print:text-slate-600">
                Generado por: <strong>ORBI Insight Center v0.12C-QA</strong>
              </div>
              <div className="text-[10px] text-slate-500 print:text-slate-600">
                Ruta documental simulada: <strong className="font-mono text-indigo-400 print:text-indigo-600">/02 - Reportes/REP-{reportType.toUpperCase()}-2026.pdf</strong>
              </div>
            </div>
            
            <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-850 max-w-md print:bg-slate-100 print:border-slate-300">
              <span className="text-[9px] font-mono text-rose-400 font-bold block uppercase tracking-wider">
                ⚠️ CONFIDENCIALIDAD & SANDBOX GARANTÍA (RULE 12A)
              </span>
              <p className="text-[9px] font-mono text-slate-500 leading-tight">
                Dossier de visualización estática local. Sin credenciales expuestas ni dependencias externas. Datos sincronizados con base mock local de terreno.
              </p>
            </div>
          </div>
        </div>

        {/* FORCE PAGE BREAK */}
        <div className="page-break"></div>

        {/* =======================================================
            SECCIÓN DE DETALLES SEGÚN TIPO DE REPORTE (DENSE REPORTS)
            ======================================================= */}
        
        {/* REPORT TYPE A: REPORTE EJECUTIVO GENERAL */}
        {reportType === 'ejecutivo' && (
          <div className="space-y-8 pt-8">
            <div className="border-b border-slate-800 pb-3 print:border-slate-300">
              <h2 className="text-lg font-black text-white print:text-slate-950 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-400" />
                <span>Sección I — Dossier de Desempeño Operacional por Cliente</span>
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Resultados consolidados de auditoría técnica por cartera de contratos de mantenimiento
              </p>
            </div>

            <div className="overflow-x-auto no-break-inside">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono print:border-slate-300">
                    <th className="py-3">Titular del Contrato</th>
                    <th className="py-3 text-center">Plantas</th>
                    <th className="py-3 text-right">Potencia (MWp)</th>
                    <th className="py-3 text-right">WO Totales</th>
                    <th className="py-3 text-right">Cerradas</th>
                    <th className="py-3 text-right">SLA Acumulado</th>
                    <th className="py-3 text-center">Calificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 print:divide-slate-200 text-slate-300 print:text-slate-800">
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-3.5 font-bold text-white print:text-slate-950">BIWO</td>
                    <td className="py-3.5 text-center">2 Parques</td>
                    <td className="py-3.5 text-right font-mono">162.0 MWp</td>
                    <td className="py-3.5 text-right font-mono">93</td>
                    <td className="py-3.5 text-right font-mono text-emerald-400 font-bold">92</td>
                    <td className="py-3.5 text-right font-mono font-black text-emerald-400">98.92%</td>
                    <td className="py-3.5 text-center">
                      <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold print:bg-emerald-100 print:text-emerald-800 print:border-emerald-200">
                        CONTROLADO
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-3.5 font-bold text-white print:text-slate-950">ICAFAL</td>
                    <td className="py-3.5 text-center">1 Parque</td>
                    <td className="py-3.5 text-right font-mono">9.5 MWp</td>
                    <td className="py-3.5 text-right font-mono">28</td>
                    <td className="py-3.5 text-right font-mono text-emerald-400 font-bold">28</td>
                    <td className="py-3.5 text-right font-mono font-black text-emerald-400">100.00%</td>
                    <td className="py-3.5 text-center">
                      <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold print:bg-emerald-100 print:text-emerald-800 print:border-emerald-200">
                        EXCELENTE
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-3.5 font-bold text-white print:text-slate-950">CVE</td>
                    <td className="py-3.5 text-center">3 Parques</td>
                    <td className="py-3.5 text-right font-mono">48.2 MWp</td>
                    <td className="py-3.5 text-right font-mono">237</td>
                    <td className="py-3.5 text-right font-mono text-amber-400 font-bold">224</td>
                    <td className="py-3.5 text-right font-mono font-black text-amber-400">94.51%</td>
                    <td className="py-3.5 text-center">
                      <span className="bg-amber-950/50 text-amber-400 border border-amber-900/30 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold print:bg-amber-100 print:text-amber-800 print:border-amber-200">
                        OBSERVACIÓN
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-950/40">
                    <td className="py-3.5 font-bold text-white print:text-slate-950">AGR</td>
                    <td className="py-3.5 text-center">3 Parques</td>
                    <td className="py-3.5 text-right font-mono">35.0 MWp</td>
                    <td className="py-3.5 text-right font-mono">14</td>
                    <td className="py-3.5 text-right font-mono text-rose-400 font-bold">11</td>
                    <td className="py-3.5 text-right font-mono font-black text-rose-400">78.57%</td>
                    <td className="py-3.5 text-center">
                      <span className="bg-rose-950/50 text-rose-400 border border-rose-900/30 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold print:bg-rose-100 print:text-rose-800 print:border-rose-200">
                        PTE. REVISIÓN
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* AI EXECUTIVE INSIGHTS PANEL */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 no-break-inside print:bg-slate-50 print:border-slate-200">
              <div className="flex items-center gap-2 text-indigo-400 border-b border-slate-900 pb-2 print:text-indigo-700 print:border-slate-200">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">ORBI Insight IA — Hallazgos y Decisiones Críticas</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-slate-500 block uppercase">A) Diagnóstico de Backlog Crítico</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">
                    Las plantas <strong>Clementina</strong> y <strong>Liquidámbar</strong> del cliente CVE registran el mayor retraso de reparaciones de cableado DC. Se sugiere priorizar la movilización de técnicos de la zona Norte durante la ventana de mantenimiento del próximo martes.
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-slate-500 block uppercase">B) Recomendación Estratégica</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">
                    Establecer auditoría de firmas digitales en terreno para el contrato <strong>AGR</strong>. El 78.57% de SLA actual no obedece a fallas de planta, sino a retraso administrativo del supervisor en validar la firma de cierre en la app móvil.
                  </p>
                </div>
              </div>
            </div>

            <div className="page-break"></div>

            {/* SECCIÓN PLANIFICACIÓN REGIONAL */}
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3 print:border-slate-300">
                <h3 className="text-base font-bold text-white print:text-slate-950 uppercase tracking-wider">
                  Sección II — Rendimiento y Disponibilidad Regional por Zona
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-break-inside">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 text-center space-y-2 print:bg-slate-50 print:border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-black">Zona Norte (Atacama)</span>
                  <div className="text-3xl font-black text-emerald-400 print:text-emerald-600">99.85%</div>
                  <p className="text-[11px] text-slate-400 print:text-slate-600">Operaciones estables. Soplado de inversores al día.</p>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 text-center space-y-2 print:bg-slate-50 print:border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-black">Zona Centro (Metropolitana)</span>
                  <div className="text-3xl font-black text-indigo-400 print:text-indigo-600">98.92%</div>
                  <p className="text-[11px] text-slate-400 print:text-slate-600">Mantenimiento Cantillana completado con éxito.</p>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 text-center space-y-2 print:bg-slate-50 print:border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-black">Zona Sur (Maule/Biobío)</span>
                  <div className="text-3xl font-black text-rose-400 print:text-rose-600">94.51%</div>
                  <p className="text-[11px] text-slate-400 print:text-slate-600">Backlog DC menor en revisión técnica por Jefatura.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT TYPE B: REPORTE DE CLIENTE SLA */}
        {reportType === 'cliente' && (
          <div className="space-y-8 pt-8">
            <div className="border-b border-slate-800 pb-3 print:border-slate-300">
              <h2 className="text-lg font-black text-white print:text-slate-950 uppercase tracking-wide flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                <span>Auditoría de Contrato Especial — Cliente: {selectedClient || 'BIWO'}</span>
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Bitácora de campo, control de horas hombre y validación de entregables contractuales
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-break-inside">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 print:bg-slate-50 print:border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase block border-b border-slate-900 pb-2 print:border-slate-200">Resumen Contractual de Activos</span>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-300 print:text-slate-700">
                    <span>Parques Solares Asociados:</span>
                    <strong className="text-white print:text-slate-950">
                      {selectedClient === 'CVE' ? 'Planta Clementina, Liquidámbar' : selectedClient === 'ICAFAL' ? 'Planta Cantillana PMGD' : 'Cantillana (PMGD 9.5 MW)'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-300 print:text-slate-700">
                    <span>SLA de Cierre en Campo Comprometido:</span>
                    <strong className="text-indigo-400 print:text-indigo-600">98.00% de Cumplimiento</strong>
                  </div>
                  <div className="flex justify-between text-slate-300 print:text-slate-700">
                    <span>SLA Real Sincronizado:</span>
                    <strong className="text-emerald-400 print:text-emerald-600 font-mono text-sm">{selectedClient === 'CVE' ? '94.51%' : selectedClient === 'AGR' ? '78.57%' : '98.92%'}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 print:bg-slate-50 print:border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase block border-b border-slate-900 pb-2 print:border-slate-200">Estado de Aprobación de Firma Digital</span>
                  <p className="text-xs text-slate-400 print:text-slate-600 leading-relaxed mt-2">
                    Las actas de terreno de este cliente cuentan con firma digital del operador Víctor León y el visto bueno del supervisor. Listas para despacho formal a SharePoint.
                  </p>
                </div>
                <div className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-900/30 text-[10px] font-mono text-indigo-400 print:bg-indigo-50 print:text-indigo-700 print:border-indigo-200">
                  ✓ El dossier de evidencias cumple con la estructura requerida (Antes/Durante/Después).
                </div>
              </div>
            </div>

            <div className="page-break"></div>

            {/* LISTA DE TRABAJOS DEL CLIENTE EN TERRENO */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Listado Sincronizado de Trabajos en Campo</span>
              <div className="overflow-x-auto no-break-inside">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono print:border-slate-300">
                      <th className="py-2.5">OT Code</th>
                      <th className="py-2.5">Planta</th>
                      <th className="py-2.5">Tipo</th>
                      <th className="py-2.5">Técnico Lead</th>
                      <th className="py-2.5 text-right">HH reportadas</th>
                      <th className="py-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 print:divide-slate-200 text-slate-300 print:text-slate-800 font-mono">
                    <tr className="hover:bg-slate-950/40">
                      <td className="py-3 font-bold text-white print:text-slate-950">OT-26-29221</td>
                      <td className="py-3">Cantillana</td>
                      <td className="py-3 font-sans">Preventiva</td>
                      <td className="py-3 font-sans">Víctor León</td>
                      <td className="py-3 text-right">32 h</td>
                      <td className="py-3 text-center">
                        <span className="bg-amber-950/40 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded text-[10px] print:bg-amber-100 print:text-amber-800">EN REVISIÓN</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-950/40">
                      <td className="py-3 font-bold text-white print:text-slate-950">OT-26-29222</td>
                      <td className="py-3">Cantillana</td>
                      <td className="py-3 font-sans">Correctiva</td>
                      <td className="py-3 font-sans">Daniel Godoy</td>
                      <td className="py-3 text-right">18 h</td>
                      <td className="py-3 text-center">
                        <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded text-[10px] print:bg-emerald-100 print:text-emerald-800">CERRADA</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-950/40">
                      <td className="py-3 font-bold text-white print:text-slate-950">OT-26-29223</td>
                      <td className="py-3">Cantillana</td>
                      <td className="py-3 font-sans">HSE/LOTO</td>
                      <td className="py-3 font-sans">Víctor León</td>
                      <td className="py-3 text-right">8 h</td>
                      <td className="py-3 text-center">
                        <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded text-[10px] print:bg-emerald-100 print:text-emerald-800">CERRADA</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REPORT TYPE C: REPORTE DE DESEMPEÑO REGIONAL */}
        {reportType === 'zona' && (
          <div className="space-y-8 pt-8">
            <div className="border-b border-slate-800 pb-3 print:border-slate-300">
              <h2 className="text-lg font-black text-white print:text-slate-950 uppercase tracking-wide flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-400" />
                <span>Análisis de Desempeño Regional — Zona: {selectedZone}</span>
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Logística de cuadrillas, control de stock local e índices de seguridad en faenas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-break-inside">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center space-y-1 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Actividades Realizadas</span>
                <div className="text-4xl font-black text-white print:text-slate-900">{filteredRecords.length} OTs</div>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Sincronizadas de campo</span>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center space-y-1 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">SLA de Respuesta</span>
                <div className="text-4xl font-black text-indigo-400 print:text-indigo-600">{complianceRate}%</div>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Meta contractual: 95%</span>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 text-center space-y-1 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Dotación de Cuadrillas</span>
                <div className="text-4xl font-black text-emerald-400 print:text-emerald-600">3 Técnicos</div>
                <span className="text-[10px] text-slate-400 print:text-slate-600">Víctor León / Rodrigo Cisterna / Carrasco</span>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 no-break-inside print:bg-slate-50 print:border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase block border-b border-slate-900 pb-2 print:border-slate-200">Control de Logística y Tránsito Terrestre</span>
              <p className="text-xs text-slate-300 print:text-slate-800 leading-relaxed">
                Durante el período reportado, la cuadrilla Zona {selectedZone} no reportó incidentes vehiculares. La camioneta de flota Hilux patente HT-2921 operó bajo bitácora normal con consumo de combustible dentro del rango presupuestado para la ruta hacia la Planta Solar Cantillana.
              </p>
            </div>
          </div>
        )}

        {/* REPORT TYPE D: REPORTE TÉCNICO DE PLANTA */}
        {reportType === 'planta' && (
          <div className="space-y-8 pt-8">
            <div className="border-b border-slate-800 pb-3 print:border-slate-300">
              <h2 className="text-lg font-black text-white print:text-slate-950 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-400" />
                <span>Ficha Técnica y Operativa de Planta Solar</span>
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Auditoría detallada de activos, inversores centralizados e inventario segmentado
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-break-inside">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 print:bg-slate-50 print:border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase block border-b border-slate-900 pb-2 print:border-slate-200">Atributos Clave del Activo</span>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-300 print:text-slate-700">
                    <span>Nombre del Parque:</span>
                    <strong className="text-white print:text-slate-900">{selectedPlant || 'Planta Solar Cantillana'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300 print:text-slate-700">
                    <span>Inversores en Operación:</span>
                    <strong className="text-white print:text-slate-900">39 inversores Sungrow SG250</strong>
                  </div>
                  <div className="flex justify-between text-slate-300 print:text-slate-700">
                    <span>Ubicación Georreferenciada:</span>
                    <strong className="text-indigo-400 print:text-indigo-600">PMGD 9.5 MW — Comuna de Maule, Chile</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 print:bg-slate-50 print:border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase block border-b border-slate-900 pb-2 print:border-slate-200">Consumo de Repuestos Registrados</span>
                  <p className="text-xs text-slate-400 print:text-slate-600 leading-relaxed mt-2">
                    Asociado a la orden correctiva <strong className="text-indigo-400 print:text-indigo-600">OT-26-29222</strong> se registró el consumo de 1 tarjeta de control y 1 fusible de potencia de inversor, rebajado instantáneamente del inventario segmentado.
                  </p>
                </div>
                <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-900/30 text-[10px] font-mono text-emerald-400 print:bg-emerald-50 print:text-emerald-700 print:border-emerald-200">
                  ✓ Stock cuadrícula verificado. Sin riesgo de quiebre.
                </div>
              </div>
            </div>

            <div className="page-break"></div>

            {/* SECCIÓN DOCUMENTAL CHECKLIST */}
            <div className="space-y-4 no-break-inside">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Lista de Verificación de Mantenimiento Preventivo (Sungrow)</span>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-3 print:bg-slate-50 print:border-slate-200">
                <div className="flex justify-between text-xs border-b border-slate-900 pb-2 print:border-slate-200">
                  <span className="font-bold text-slate-300 print:text-slate-800">1. Soplado y Limpieza de Rejillas</span>
                  <span className="text-emerald-400 font-bold">100% CUMPLIDO</span>
                </div>
                <div className="flex justify-between text-xs border-b border-slate-900 pb-2 print:border-slate-200">
                  <span className="font-bold text-slate-300 print:text-slate-800">2. Revisión de Conectores MC4 e Inspección de Termografía</span>
                  <span className="text-emerald-400 font-bold">100% CUMPLIDO</span>
                </div>
                <div className="flex justify-between text-xs border-b border-slate-900 pb-2 print:border-slate-200">
                  <span className="font-bold text-slate-300 print:text-slate-800">3. Control de Torque en Terminales AC</span>
                  <span className="text-emerald-400 font-bold">100% CUMPLIDO</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-300 print:text-slate-800">4. Pruebas de Resistencia de Aislamiento y Puesta a Tierra</span>
                  <span className="text-amber-400 font-bold">PENDIENTE PRÓXIMO CICLO</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT TYPE E: REPORTE DE HH & RECURSOS */}
        {reportType === 'hh' && (
          <div className="space-y-8 pt-8">
            <div className="border-b border-slate-800 pb-3 print:border-slate-300">
              <h2 className="text-lg font-black text-white print:text-slate-950 uppercase tracking-wide flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                <span>Auditoría de HH & Horas de Faena Registradas</span>
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Resumen de asistencia de técnicos y auditoría de confiabilidad del dato de terreno
              </p>
            </div>

            {/* CRITICAL WARNING BANNER ON DATA RELIABILITY */}
            <div className="bg-amber-950/20 border-2 border-amber-500/30 p-5 rounded-2xl flex items-start gap-4 no-break-inside print:bg-amber-50 print:border-amber-300">
              <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5 print:text-amber-700" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-400 print:text-amber-800 uppercase tracking-wider font-mono">⚠️ ADVERTENCIA DE CONFIABILIDAD DEL DATO OPERACIONAL (Nota de Calidad del Dato HH)</h4>
                <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                  Las horas hombre de terreno detalladas en esta sección provienen de registros de estimaciones referenciales del scheduler de ORBI Workspace. No constituyen base legal para el cálculo de nómina ni horas extras hasta que sean formalmente contrastadas y validadas con el sistema de asistencia biométrica de la empresa. Las HH pueden provenir de planificación, registro manual o estimación operacional. No deben considerarse dato final validado sin confirmación de terreno/supervisión.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-break-inside">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 print:bg-slate-50 print:border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase block border-b border-slate-900 pb-2 print:border-slate-200 font-bold">Registro de Asistencia por Operario</span>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-900 pb-2 print:border-slate-200 text-slate-300 print:text-slate-700">
                    <span>Víctor León (Technical Lead)</span>
                    <strong className="text-emerald-400 print:text-emerald-700">92 Horas Sincronizadas</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2 print:border-slate-200 text-slate-300 print:text-slate-700">
                    <span>Daniel Godoy (Técnico Campo)</span>
                    <strong className="text-indigo-400 print:text-indigo-700">64 Horas Sincronizadas</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2 print:border-slate-200 text-slate-300 print:text-slate-700">
                    <span>Rodrigo Cisterna (Apoyo)</span>
                    <strong className="text-slate-400">45 Horas Sincronizadas</strong>
                  </div>
                  <div className="flex justify-between text-slate-300 print:text-slate-700">
                    <span>Carrasco (Auxiliar Terreno)</span>
                    <strong className="text-slate-400">22 Horas Sincronizadas</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 print:bg-slate-50 print:border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase block border-b border-slate-900 pb-2 print:border-slate-200 font-bold">Análisis de Desviación de Programación</span>
                  <p className="text-xs text-slate-400 print:text-slate-600 leading-relaxed mt-2">
                    Se reporta una desviación de <strong>+14 horas hombre</strong> reportadas sobre la planificación original de ORBI Workspace. Esto se asocia al soplado detallado adicional ejecutado sobre los 39 inversores Sungrow de Cantillana para remover suciedad de polvo de carbón.
                  </p>
                </div>
                <div className="bg-indigo-950/40 p-2.5 rounded-xl text-[10px] font-mono text-indigo-400 print:bg-indigo-100 print:text-indigo-700">
                  Desviación del período: normal y autorizada por Jefatura.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT TYPE F: CIERRE MENSUAL CONSOLIDADO */}
        {reportType === 'mensual' && (
          <div className="space-y-8 pt-8">
            <div className="border-b border-slate-800 pb-3 print:border-slate-300">
              <h2 className="text-lg font-black text-white print:text-slate-950 uppercase tracking-wide flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-indigo-400" />
                <span>Cierre Mensual Consolidado y Dossier de Control</span>
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Auditoría cruzada de permisos de trabajo (PTW), consumos de bodega e inventario O&M
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-break-inside">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 print:bg-slate-50 print:border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase block border-b border-slate-900 pb-2 print:border-slate-200">Checklist de Cierre Documental</span>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-300 print:text-slate-700">
                    <span>Permisos de Trabajo de Alto Riesgo (PTW):</span>
                    <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-mono text-[10px] print:bg-emerald-100 print:text-emerald-800">✓ COMPLETO</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300 print:text-slate-700">
                    <span>Análisis de Seguridad en el Trabajo (AST):</span>
                    <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-mono text-[10px] print:bg-emerald-100 print:text-emerald-800">✓ ARCHIVADO</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300 print:text-slate-700">
                    <span>Consumo de Repuestos de Planta Solares:</span>
                    <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-mono text-[10px] print:bg-emerald-100 print:text-emerald-800">✓ SINCRIZADO</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300 print:text-slate-700">
                    <span>Estado documental virtual (SharePoint Router):</span>
                    <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-mono text-[10px] print:bg-emerald-100 print:text-emerald-800">✓ OK</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 print:bg-slate-50 print:border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase block border-b border-slate-900 pb-2 print:border-slate-200 font-bold">Resumen de Estado Documental Virtual (Sandbox)</span>
                  <p className="text-xs text-slate-400 print:text-slate-600 leading-relaxed mt-2 font-mono text-[11px]">
                    • /01 - Evidencias/Planta_Cantillana_2026.zip <br />
                    • /02 - Reportes/REP-EJECUTIVO-2026.pdf <br />
                    • /03 - Firmas/Firmas_Víctor_León_Cantillana.pdf <br />
                    • /04 - Permisos de Trabajo/AST_OT_LOTO_29223.pdf
                  </p>
                </div>
                <div className="bg-indigo-950/30 p-2 text-[10px] font-mono text-indigo-400 print:bg-indigo-100 print:text-indigo-800">
                  Respaldo automático en servidor seguro completado sin errores. SharePoint Router opera en modo virtual/sandbox. No existe sincronización real con SharePoint productivo en esta demo.
                </div>
              </div>
            </div>

            <div className="page-break"></div>

            {/* SECCIÓN DIRECTIVAS Y PRIORIDADES */}
            <div className="space-y-4 no-break-inside">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Directivas Clave para el Siguiente Ciclo O&amp;M</span>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-3 print:bg-slate-50 print:border-slate-200">
                <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                  1. <strong>Focalización Preventiva:</strong> Continuar el soplado trimestral preventivo para evitar alarmas de sobretemperatura en inversores centralizados de Sungrow.
                </p>
                <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                  2. <strong>Control de Stock:</strong> Abastecer la bodega segmentada de Planta Solar Clementina con 10 tarjetas controladoras adicionales para mitigar el backlog correctivo DC de CVE.
                </p>
                <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                  3. <strong>HSE Tolerancia Cero:</strong> Todo trabajo que requiera bloqueo LOTO debe contar con el archivo de AST y PTW firmado antes de la subida de evidencias.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            FIRMAS DE RESPONSABILIDAD (SIGNATURE AREA)
            ======================================================= */}
        <div className="pt-12 mt-12 border-t border-slate-800 grid grid-cols-3 gap-6 text-center text-xs text-slate-400 no-break-inside print:border-slate-300 print:text-slate-700 print:pt-8 print:mt-8">
          <div className="space-y-12">
            <div className="h-0.5 bg-slate-800 w-36 mx-auto print:bg-slate-300"></div>
            <div>
              <p className="font-bold text-white print:text-slate-950">Víctor León</p>
              <p className="text-[10px] text-slate-400 print:text-slate-500 font-mono">Técnico Principal / Field Ops</p>
              <p className="text-[9px] text-indigo-400 print:text-indigo-600 font-mono mt-1">✓ Firmado digitalmente (App)</p>
            </div>
          </div>
          <div className="space-y-12">
            <div className="h-0.5 bg-slate-800 w-36 mx-auto print:bg-slate-300"></div>
            <div>
              <p className="font-bold text-white print:text-slate-950">Daniel Godoy</p>
              <p className="text-[10px] text-slate-400 print:text-slate-500 font-mono">Supervisor Operativo Maule</p>
              <p className="text-[9px] text-indigo-400 print:text-indigo-600 font-mono mt-1">✓ Firmado digitalmente (App)</p>
            </div>
          </div>
          <div className="space-y-12">
            <div className="h-0.5 bg-slate-800 w-36 mx-auto print:bg-slate-300"></div>
            <div>
              <p className="font-bold text-white print:text-slate-950">Gerencia de Operaciones O&amp;M</p>
              <p className="text-[10px] text-slate-400 print:text-slate-500 font-mono">ORBI O&amp;M Command Center</p>
              <p className="text-[9px] text-emerald-400 print:text-emerald-600 font-mono mt-1">✓ Validado en Report Center</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
