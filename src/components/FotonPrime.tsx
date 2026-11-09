/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Cpu,
  Brain,
  Sparkles,
  BarChart2,
  AlertTriangle,
  Play,
  RotateCcw,
  Truck,
  Wrench,
  Users,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  Code
} from 'lucide-react';
import { OT, Planta, RecursoPersona, Vehiculo, Repuesto, Herramienta } from '../types';

interface FotonPrimeProps {
  ots: OT[];
  plantas: Planta[];
  personas: RecursoPersona[];
  vehiculos: Vehiculo[];
  repuestos: Repuesto[];
  herramientas: Herramienta[];
}

export default function FotonPrime({
  ots,
  plantas,
  personas,
  vehiculos,
  repuestos,
  herramientas
}: FotonPrimeProps) {
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<string>('logistica'); // 'logistica' | 'recursos' | 'riesgos' | 'disponibilidad'
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResult(null);

    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          generateAnalysisReport();
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const generateAnalysisReport = () => {
    setIsAnalyzing(false);

    if (activeAnalysisMode === 'logistica') {
      // Análisis Logística
      const vehiculosEnRuta = vehiculos.filter(v => v.estado === 'En ruta' || v.estado === 'En planta').length;
      const vehiculosBloqueados = vehiculos.filter(v => v.estado === 'Bloqueado' || v.estado === 'Mantención vehículo').length;
      const totalRutasActivas = vehiculos.filter(v => v.rutaSimulada).length;

      setAnalysisResult({
        title: 'Reporte de Eficiencia de Flota & Logística de Terreno',
        summary: 'La flota operada muestra una tasa de disponibilidad media con focos de ineficiencia por falta de coordinación horaria. Se detectan traslados duplicados hacia zonas norte y centro.',
        insights: [
          `Se identifican ${vehiculosEnRuta} vehículos activos en terreno y ${vehiculosBloqueados} inactivos por mantenimiento preventivo del móvil.`,
          `Zona Centro presenta la mayor concentración de rutas activas (${totalRutasActivas}), requiriendo optimización de despacho agrupado.`,
          'Recomendación: Implementar ruteo consolidado para OTs preventivas adyacentes para reducir el consumo de combustible en un 18%.',
          'Alerta: El móvil patente KOPX-42 reporta viaje hacia Atacama Solar sin el kit de herramientas termográficas completo. Riesgo de inspección trunca.'
        ],
        kpis: [
          { label: 'Eficiencia Despacho', value: '82%', status: 'nominal' },
          { label: 'HH en Ruta / HH Operativas', value: '2.4 hrs', status: 'alerta' },
          { label: 'Huella de Carbono Diaria', value: '240 kg CO2', status: 'nominal' }
        ]
      });
    } else if (activeAnalysisMode === 'recursos') {
      // Análisis de Recursos Humanos
      const personasCargaAlta = personas.filter(p => p.cargaSemanal > 80).length;
      const totalHhPlanificadas = personas.reduce((acc, p) => acc + p.hhPlanificadas, 0);

      setAnalysisResult({
        title: 'Optimización de Carga Laboral y HH O&M',
        summary: 'Se visualiza una asimetría marcada en la asignación de actividades semanales. Un porcentaje acotado del equipo de supervisión concentra el grueso de las HH complejas.',
        insights: [
          `Existen ${personasCargaAlta} técnicos de terreno con sobrecarga laboral crítica (>80% de su carga útil semanal).`,
          `Total horas hombre planificadas para este período: ${totalHhPlanificadas} HH.`,
          'El rol de "Supervisor de Terreno" es el cuello de botella actual de la operación, bloqueando el cierre oportuno de OTs preventivas en Santiago Solar.',
          'Recomendación: Redistribuir 15 HH preventivas de Alejandro Rojas hacia ingenieros de apoyo locales en Zona Centro.',
          'Brecha Técnica: Se detecta falta de acreditación en Altura Física vigente para 2 técnicos asignados a la inspección de trackers en Pelícano Solar.'
        ],
        kpis: [
          { label: 'Saturación Promedio', value: '74%', status: 'nominal' },
          { label: 'HH Balanceadas', value: '45 HH', status: 'excelente' },
          { label: 'Brechas de Competencia', value: '2 alertas', status: 'critico' }
        ]
      });
    } else if (activeAnalysisMode === 'riesgos') {
      // Análisis de Riesgos, Bloqueos e Integridad de Terreno v0.1.2B
      const otsBloqueadas = ots.filter(o => o.bloqueada || o.estado === 'Bloqueada').length;
      const repuestosSinStock = repuestos.filter(r => r.stockSimulado === 0).length;
      const totalEvidencias = ots.reduce((acc, curr) => acc + (curr.evidencePack?.length || 0), 0);
      const propuestasCierre = ots.filter(o => o.propuestaCierreTerreno || o.estado === 'Lista para revisión').length;
      const totalOts = ots.length;
      const progressSum = ots.reduce((acc, curr) => acc + (curr.avance || 0), 0);
      const avgChecklistProgress = totalOts > 0 ? Math.round(progressSum / totalOts) : 0;

      setAnalysisResult({
        title: 'Trazabilidad, Bloqueos de Campo e Integridad de Evidencia Pack',
        summary: `La operación en terreno reporta actualmente ${otsBloqueadas} bloqueos activos que comprometen el MTTR del portafolio. No obstante, se registra una alta adherencia a la captura del Evidence Pack, registrando ${totalEvidencias} evidencias fotográficas completadas para soporte documental contractual.`,
        insights: [
          `Se registran ${otsBloqueadas} bloqueos activos reportados desde terreno que requieren acción de descarte inmediato por repuestos o herramientas.`,
          `El equipo de campo ha recopilado e integrado un total de ${totalEvidencias} registros de evidencia fotográfica (antes/durante/después) asegurando el compliance del Evidence Pack en el O&M Command Center.`,
          `Existen ${propuestasCierre} propuestas de cierre técnico pendientes de validación final por los Supervisores de Terreno en el panel móvil.`,
          `El avance de checklist consolidado a nivel nacional de las OTs activas alcanza el ${avgChecklistProgress}%, demostrando un avance riguroso en el cumplimiento de tareas.`
        ],
        kpis: [
          { label: 'Bloqueos de Sitio', value: `${otsBloqueadas} Activos`, status: otsBloqueadas > 0 ? 'critico' : 'excelente' },
          { label: 'Evidencias Recibidas', value: `${totalEvidencias} Archivos`, status: totalEvidencias > 0 ? 'excelente' : 'alerta' },
          { label: 'Cierres Pendientes', value: `${propuestasCierre} Solicitudes`, status: propuestasCierre > 0 ? 'alerta' : 'excelente' }
        ]
      });
    } else if (activeAnalysisMode === 'disponibilidad') {
      // Análisis de Disponibilidad e Inversores
      const plantasBajoRendimiento = plantas.filter(p => p.estado === 'Limitada' || p.estado === 'Fuera de Servicio').length;

      setAnalysisResult({
        title: 'Análisis de Generación y Disponibilidad Energética',
        summary: 'Las plantas del portafolio se comportan estables dentro de la curva de radiación de la estación invernal, con variaciones leves en Zona Centro debido a nubosidad parcial.',
        insights: [
          `Se detectan ${plantasBajoRendimiento} plantas solares operando bajo la curva de rendimiento simulado esperado para el día.`,
          'La planta Maule Solar muestra un delta de degradación del 4.2% por ensuciamiento acumulado (soiling) en bloques 3 y 4.',
          'Recomendación: Adelantar la campaña de lavado de módulos en Maule Solar utilizando el camión aljibe de Zona Sur.',
          'Diagnóstico Predictivo: El transformador principal de Santiago Solar reporta aumento progresivo de temperatura de aceite (+2.8°C sobre media). Se sugiere inspección termográfica aérea inmediata.'
        ],
        kpis: [
          { label: 'PR Promedio Portafolio', value: '81.4%', status: 'nominal' },
          { label: 'Disponibilidad Técnica', value: '98.2%', status: 'excelente' },
          { label: 'Pérdida por Soiling', value: '2.1%', status: 'alerta' }
        ]
      });
    } else {
      // Análisis de Aseguramiento de Calidad y Cierre (v0.1.2C)
      const otsCerradas = ots.filter(o => o.estado === 'Cerrada').length;
      const otsDevueltas = ots.filter(o => o.estado === 'Devuelta a ejecución').length;
      const otsPendientes = ots.filter(o => ['Lista para revisión', 'En revisión Supervisor', 'En revisión Coordinador', 'En revisión HSE', 'En revisión Calidad', 'Pendiente aprobación Jefe O&M'].includes(o.estado)).length;
      const totalHhEstimadas = ots.reduce((acc, o) => acc + (o.hhEstimadas || 0), 0);
      const totalHhReales = ots.reduce((acc, o) => acc + (o.hhReales || 0), 0);
      const deltaHh = totalHhReales - totalHhEstimadas;

      setAnalysisResult({
        title: 'Auditoría Inteligente de Aseguramiento de Calidad y Cierres v0.1.2C',
        summary: `El O&M Command Center IA procesó la cola de cierres detectando ${otsCerradas} OTs con acreditación formal finalizada. Se observa un volumen de ${otsPendientes} solicitudes en revisión por el staff de supervisión, y un índice de devolución a campo de ${otsDevueltas} órdenes por brechas de evidencia o firma AST.`,
        insights: [
          `Auditoría Documental: Un total de ${otsCerradas} órdenes de trabajo han completado el circuito de 4 validaciones (HSE, Calidad, Supervisor, Coordinador, Jefe O&M).`,
          `Bandeja de Devoluciones: ${otsDevueltas} órdenes se encuentran en estado "Devuelta a ejecución" en terreno. Principal causa detectada: Evidencia fotográfica insuficiente en inversores o firma AST.`,
          `Desviación Operativa de HH: Se registra un total de ${totalHhReales} HH reportadas ejecutadas frente a ${totalHhEstimadas} HH estimadas (Delta Neto de ${deltaHh >= 0 ? '+' : ''}${deltaHh} HH).`,
          'Recomendación Predictiva de Calidad: Configurar un umbral de pre-auditoría automática mediante ORBI FieldOps para pre-validar que la firma AST y un mínimo de 2 fotos existan antes de permitir al técnico proponer el cierre.'
        ],
        kpis: [
          { label: 'Tasa Aprobación Cierre', value: `${otsCerradas + otsPendientes > 0 ? Math.round((otsCerradas / (otsCerradas + otsDevueltas + otsPendientes)) * 100) : 100}%`, status: otsDevueltas > 0 ? 'alerta' : 'excelente' },
          { label: 'Órdenes en Staff', value: `${otsPendientes} OTs`, status: otsPendientes > 3 ? 'alerta' : 'nominal' },
          { label: 'Desviación HH Neta', value: `${deltaHh >= 0 ? '+' : ''}${deltaHh} HH`, status: Math.abs(deltaHh) > 20 ? 'critico' : 'nominal' }
        ]
      });
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'critico':
        return 'bg-red-500 shadow-red-500/50';
      case 'alerta':
        return 'bg-orange-500 shadow-orange-500/50';
      case 'excelente':
        return 'bg-emerald-400 shadow-emerald-400/50';
      default:
        return 'bg-sky-400 shadow-sky-400/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-500/20">FOTON PRIME O&M IA v0.1.2C-QA — Closure Workflow Consistency Check</span>
            <span className="text-xs font-mono text-slate-500">Módulo de IA Analítica Avanzada</span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
            <Brain className="h-5.5 w-5.5 text-indigo-400" /> FOTON PRIME O&M IA
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Asistente analítico inteligente de ORBI. Procesa de forma holística variables operacionales de campo, logística, HH e inventario para guiar la toma de decisiones.
          </p>
        </div>
      </div>

      {/* SELECTOR DE MODOS DE ANÁLISIS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => {
            setActiveAnalysisMode('logistica');
            setAnalysisResult(null);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeAnalysisMode === 'logistica'
              ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/5'
              : 'bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="h-5 w-5 text-indigo-400 mb-2" />
          <div className="text-xs font-bold font-mono">Planificación Logística</div>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">Flota, rutas operativas, combustible y tiempos de traslado.</p>
        </button>

        <button
          onClick={() => {
            setActiveAnalysisMode('recursos');
            setAnalysisResult(null);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeAnalysisMode === 'recursos'
              ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-lg shadow-cyan-500/5'
              : 'bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Users className="h-5 w-5 text-cyan-400 mb-2" />
          <div className="text-xs font-bold font-mono">Optimización de HH</div>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">Carga de trabajo, roles, competencias y balance de personal.</p>
        </button>

        <button
          onClick={() => {
            setActiveAnalysisMode('riesgos');
            setAnalysisResult(null);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeAnalysisMode === 'riesgos'
              ? 'bg-rose-500/10 border-rose-500 text-white shadow-lg shadow-rose-500/5'
              : 'bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="h-5 w-5 text-rose-400 mb-2" />
          <div className="text-xs font-bold font-mono">Riesgos & Bloqueos</div>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">OTs suspendidas, quiebres de stock y escalamientos críticos.</p>
        </button>

        <button
          onClick={() => {
            setActiveAnalysisMode('disponibilidad');
            setAnalysisResult(null);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeAnalysisMode === 'disponibilidad'
              ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/5'
              : 'bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="h-5 w-5 text-emerald-400 mb-2" />
          <div className="text-xs font-bold font-mono">Degradación & Curvas</div>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">Pérdidas de generación, curvas PR e inversores defectuosos.</p>
        </button>

        <button
          onClick={() => {
            setActiveAnalysisMode('cierre');
            setAnalysisResult(null);
          }}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeAnalysisMode === 'cierre'
              ? 'bg-purple-500/10 border-purple-500 text-white shadow-lg shadow-purple-500/5'
              : 'bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle className="h-5 w-5 text-purple-400 mb-2" />
          <div className="text-xs font-bold font-mono">Aseguramiento de Cierre</div>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">Compliance de firmas, evidencia de campo y desviación de HH.</p>
        </button>
      </div>

      {/* DISPARADOR DE ANÁLISIS */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center space-y-6 relative overflow-hidden">
        {/* Gráfico de fondo decorativo */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none opacity-40"></div>
        
        {!isAnalyzing && !analysisResult && (
          <div className="max-w-md space-y-4">
            <div className="h-12 w-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
              <Cpu className="h-6 w-6 text-indigo-400 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white">Iniciar Diagnóstico Inteligente</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              FOTON PRIME procesará instantáneamente el estado actual de las OTs de terreno, la disponibilidad de vehículos de flota, el stock en bodega de repuestos críticos y el historial de escalamientos para emitir alertas y recomendaciones optimizadas.
            </p>
            <button
              onClick={startAnalysis}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold text-xs font-mono rounded-lg transition-transform hover:scale-102 flex items-center gap-1.5 mx-auto"
            >
              <Play className="h-3.5 w-3.5 fill-slate-950" /> Ejecutar Diagnóstico O&M
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="max-w-xs space-y-4 font-mono">
            <div className="relative h-20 w-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10 animate-ping"></div>
              <div className="absolute inset-2 rounded-full border-2 border-indigo-500/30"></div>
              <Brain className="h-6 w-6 text-indigo-400" />
            </div>
            <div className="text-xs text-white">Analizando Ecosistema de Datos...</div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
              <div
                className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-500">{analysisProgress}% Completado</div>
          </div>
        )}

        {/* RESULTADO DE ANÁLISIS */}
        {analysisResult && (
          <div className="w-full text-left space-y-5 animate-fade-in font-mono">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-3 gap-3">
              <div>
                <span className="text-[9px] text-indigo-400 uppercase tracking-wider font-bold">Diagnóstico Emitido de Forma Exitosa</span>
                <h3 className="text-sm font-black text-white mt-1 uppercase tracking-tight">{analysisResult.title}</h3>
              </div>
              <button
                onClick={() => setAnalysisResult(null)}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 rounded text-[10px] transition-colors flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Re-evaluar
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 leading-relaxed text-xs text-slate-300">
              <div className="text-white font-bold mb-1">Resumen de Análisis:</div>
              {analysisResult.summary}
            </div>

            {/* KPIS RECOMENDADOS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {analysisResult.kpis.map((kpi: any, idx: number) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">{kpi.label}</span>
                    <span className="text-sm font-bold text-white block mt-0.5">{kpi.value}</span>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full shadow-lg ${getStatusDot(kpi.status)}`}></div>
                </div>
              ))}
            </div>

            {/* INSIGHTS */}
            <div className="space-y-2.5">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Insights Clave & Recomendaciones Operacionales</span>
              <div className="space-y-2">
                {analysisResult.insights.map((insight: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-950">
                    <div className="h-5 w-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] shrink-0 font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* COMPOSICIÓN DE CONTRATO */}
            <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row justify-between text-[10px] text-slate-500 gap-2">
              <span>FOTON PRIME O&M AI Analizer - Model: Gemini Flash Hybrid</span>
              <span>ORBI Intelligence Suite</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
