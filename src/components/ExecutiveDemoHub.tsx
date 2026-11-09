/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Award,
  Play,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Share2,
  ExternalLink,
  Clock,
  User,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Calendar,
  Sun,
  Users,
  Truck,
  Wrench,
  ShieldAlert,
  ChevronRight,
  BookOpen,
  Compass,
  Map,
  ClipboardList,
  Check,
  Brain
} from 'lucide-react';
import { resetAllDatabases } from '../data/db';

interface ExecutiveDemoHubProps {
  onNavigate: (view: string, filters?: any) => void;
  userRole: string;
  activeUserName: string;
  onAddAuditLog?: (
    accion: string,
    modulo: string,
    otCode?: string,
    plantaName?: string,
    comentario?: string,
    criticidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  ) => void;
}

interface EcosystemModule {
  id: string;
  name: string;
  status: 'STABLE_SHELL' | 'FROZEN' | 'PENDING' | 'INTEGRATED';
  statusLabel: string;
  badge: 'Sandbox' | 'Frozen' | 'Pending' | 'Platform' | 'Integrated';
  responsibility: string;
  icon: React.ElementType;
  viewId?: string;
  details?: string;
}

interface DemoRoute {
  id: '7m' | '12m' | '20m';
  name: string;
  duration: string;
  focus: string;
  sequence: string[];
  steps: {
    stepNum: number;
    title: string;
    duration: string;
    moduleName: string;
    viewId?: string;
    objective: string;
    phrase: string;
  }[];
}

export default function ExecutiveDemoHub({
  onNavigate,
  userRole,
  activeUserName,
  onAddAuditLog
}: ExecutiveDemoHubProps) {
  const isAuthorized = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'SUPERVISOR_TERRENO', 'COORDINADOR_OM'].includes(userRole);

  if (!isAuthorized) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12 font-sans">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto animate-bounce" />
        <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">⚠️ Acceso Restringido</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          El módulo **ORBI Executive Demo Hub** está reservado para roles de jefatura, supervisión, coordinación y administración O&M.
        </p>
        <button
          onClick={() => onNavigate('Home')}
          className="px-4.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-xs font-mono text-emerald-400 font-bold transition-colors"
        >
          Volver al Home Global
        </button>
      </div>
    );
  }

  const [selectedRoute, setSelectedRoute] = useState<'7m' | '12m' | '20m'>('12m');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [activeTimelineStep, setActiveTimelineStep] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load selected route from localStorage if available
  useEffect(() => {
    const savedRoute = localStorage.getItem('orbi_selected_demo_route');
    if (savedRoute && ['7m', '12m', '20m'].includes(savedRoute)) {
      setSelectedRoute(savedRoute as '7m' | '12m' | '20m');
    }
  }, []);

  const handleSelectRoute = (routeId: '7m' | '12m' | '20m') => {
    setSelectedRoute(routeId);
    setActiveTimelineStep(0);
    localStorage.setItem('orbi_selected_demo_route', routeId);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleCopySummary = () => {
    const text = `ORBI O&M Command Center IA es una suite unificada para la gestión integral de operaciones O&M solares:
- ORBI Workspace: Organiza la planificación, asignación de cuadrillas y control de colisiones horarias (el cuándo, dónde y quién).
- ORBI OT Center: Ejecuta órdenes de trabajo con control estricto de evidencias (Modo Limpieza Inversores), PTW y repuestos de planta (el qué, cómo y cierre).
- ORBI Insight Center: Consolida los datos en una consola ejecutiva para medir SLAs, rankings de plantas y matriz de horas.
- ORBI Insight Report Pack: Convierte los registros en dossiers de formato físico A4 en PDF listos para entrega corporativa.
La actual demo opera en modo sandbox/read-only con persistencia local simulada en localStorage.`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    showFeedback("¡Resumen ejecutivo copiado al portapapeles!");
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('¿Está seguro de que desea resetear la base de datos de demostración?\n\nEsta acción solo restaura datos demo/localStorage del entorno sandbox. No debe usarse sobre datos productivos.')) {
      if (onAddAuditLog) {
        onAddAuditLog(
          'Restablecimiento completo de base de datos mock desde Demo Hub',
          'Demo Hub',
          undefined,
          undefined,
          'Acción ejecutada por Jefatura',
          'Media'
        );
      }
      setTimeout(() => {
        resetAllDatabases();
      }, 500);
    }
  };

  // Ecosistema Modules Data
  const modulesList: EcosystemModule[] = [
    {
      id: 'home',
      name: 'Home Global',
      status: 'STABLE_SHELL',
      statusLabel: 'Stable Platform Shell',
      badge: 'Platform',
      responsibility: 'Entrada principal del ecosistema ORBI O&M Command Center IA. Consolidación rápida de KPIs de flota, recursos, repuestos y alertas.',
      icon: Cpu,
      viewId: 'Home'
    },
    {
      id: 'otcenter',
      name: 'ORBI OT Center',
      status: 'FROZEN',
      statusLabel: 'FROZEN / FINAL RELEASE LOCK',
      badge: 'Frozen',
      responsibility: 'Gestión de ciclo de OTs, validación técnica, Evidence Vault (con secuencias de limpieza de inversores), PTW Center y Report Center.',
      icon: FileText,
      viewId: 'OTs'
    },
    {
      id: 'workspace',
      name: 'ORBI Workspace',
      status: 'FROZEN',
      statusLabel: 'FROZEN / Operational Planning & Dispatch',
      badge: 'Frozen',
      responsibility: 'Calendarios globales interactivos, inbox de triage sin programar, Resource Planner, asignaciones y control de colisiones horarias.',
      icon: Calendar,
      viewId: 'Workspace'
    },
    {
      id: 'insight',
      name: 'ORBI Insight Center',
      status: 'FROZEN',
      statusLabel: 'FROZEN / Executive Analytics',
      badge: 'Frozen',
      responsibility: 'Analítica ejecutiva pura, matriz de horas, ranking de plantas, rentabilidad de clientes O&M e insights predictivos locales.',
      icon: Compass,
      viewId: 'BI'
    },
    {
      id: 'reportpack',
      name: 'ORBI Insight Report Pack',
      status: 'FROZEN',
      statusLabel: 'FROZEN / PDF Executive Dossier',
      badge: 'Frozen',
      responsibility: 'Generador de reportes PDF de alta fidelidad, con vistas de impresión optimizadas A4, nota de calidad de dato y simulador de SharePoint.',
      icon: FileText,
      viewId: 'BI' // Sourced as a tab inside Insight Center
    },
    {
      id: 'matrizplantas',
      name: 'Matriz de Plantas / Plantas FV',
      status: 'FROZEN',
      statusLabel: 'FROZEN / SANDBOX / NON-OPERATIONAL / ASSET REGISTRY READY',
      badge: 'Frozen',
      responsibility: 'Catastro tradicional de activos fotovoltaicos, criticidad, potencia MWp, asignación de responsables y enlace documental.',
      icon: Sun,
      viewId: 'Plantas'
    },
    {
      id: 'organigrama',
      name: 'Organigrama O&M',
      status: 'FROZEN',
      statusLabel: 'FROZEN / SANDBOX / NON-OPERATIONAL / ORGANIZATIONAL DATA READY',
      badge: 'Frozen',
      responsibility: 'Estructura jerárquica de recursos (76 colaboradores, 9 áreas, 4 niveles), zonificación de cuadrillas, roles de terreno y asignaciones de plantas/flota.',
      icon: Users,
      viewId: 'Organigrama'
    },
    {
      id: 'flota',
      name: 'Control de Flota & Logística',
      status: 'FROZEN',
      statusLabel: 'FROZEN / SANDBOX / NON-OPERATIONAL / FLEET DEMO READY',
      badge: 'Frozen',
      responsibility: 'Supervisión satelital O&M de camionetas, auditoría de documentos SOAP / Rev. Técnica y bitácora de mantenimiento en taller.',
      icon: Truck,
      viewId: 'Flota'
    }
  ];

  // Demo Routes Sequences and steps details
  const demoRoutes: Record<'7m' | '12m' | '20m', DemoRoute> = {
    '7m': {
      id: '7m',
      name: 'Demo Rápida',
      duration: '7 minutos',
      focus: 'Visión general de alto impacto',
      sequence: ['Home Global', 'OT Center', 'Workspace', 'Insight Center', 'Report Pack'],
      steps: [
        {
          stepNum: 1,
          title: 'Introducción al Ecosistema',
          duration: '1.0 min',
          moduleName: 'Home Global',
          viewId: 'Home',
          objective: 'Presentar la consola unificada y el flujo lógico transversal del ecosistema ORBI.',
          phrase: '«ORBI centraliza la planificación, ejecución, análisis y reportería ejecutiva O&M en una sola plataforma integrada, resolviendo la desconexión de planillas Excel tradicionales.»'
        },
        {
          stepNum: 2,
          title: 'Gestión y Cierre de Órdenes',
          duration: '1.5 min',
          moduleName: 'ORBI OT Center',
          viewId: 'OTs',
          objective: 'Demostrar la consistencia del workflow técnico de cierre y el control documental.',
          phrase: '«El técnico ejecuta en terreno sin burocracia, mientras que el supervisor controla evidencias fotográficas estructuradas, repuestos de planta y firmas PTW en un click.»'
        },
        {
          stepNum: 3,
          title: 'Planificación Horaria y Despacho',
          duration: '1.5 min',
          moduleName: 'ORBI Workspace',
          viewId: 'Workspace',
          objective: 'Mostrar el calendario interactivo y la asignación del personal de campo.',
          phrase: '«Workspace define el CUÁNDO, DÓNDE y QUIÉN ejecuta. El triage inbox permite programar órdenes unificadas de forma rápida, evitando cruce de horarios.»'
        },
        {
          stepNum: 4,
          title: 'Analítica Gerencial e Insights',
          duration: '1.5 min',
          moduleName: 'ORBI Insight Center',
          viewId: 'BI',
          objective: 'Explicar los indicadores agregados del negocio y los reportes de calidad.',
          phrase: '«Insight Center no interfiere con la operación diaria; recopila, procesa y transforma los datos en indicadores ejecutivos para toma de decisiones y control de SLA.»'
        },
        {
          stepNum: 5,
          title: 'Generación de Dossier PDF',
          duration: '1.5 min',
          moduleName: 'ORBI Insight Report Pack',
          viewId: 'BI',
          objective: 'Imprimir el reporte ejecutivo unificado optimizado para A4.',
          phrase: '«El Report Pack exporta un dossier PDF ejecutivo para el cliente final, con una nota de transparencia de datos y simulación de guardado automático en SharePoint Router.»'
        }
      ]
    },
    '12m': {
      id: '12m',
      name: 'Demo Ejecutiva',
      duration: '12 minutos',
      focus: 'Enfoque directivo y valor del negocio',
      sequence: ['Home Global', 'Ecosistema', 'OT Center', 'Workspace', 'Insight Center', 'Dossier PDF', 'Roadmap'],
      steps: [
        {
          stepNum: 1,
          title: 'Home Global & Identidades',
          duration: '1.5 min',
          moduleName: 'Home Global',
          viewId: 'Home',
          objective: 'Explicar el Command Center O&M y simular el switch de identidades para supervisor y técnico.',
          phrase: '«La plataforma se adapta al rol de la persona. El técnico de terreno tiene una vista de celular de carga cero, mientras que la jefatura ve la matriz operacional global.»'
        },
        {
          stepNum: 2,
          title: 'Estado de Madurez del Software',
          duration: '1.5 min',
          moduleName: 'Ecosystem Center',
          viewId: 'DemoReadiness',
          objective: 'Dar visibilidad de los módulos congelados, reglas estrictas de sandbox y consistencia técnica.',
          phrase: '«Nuestra v0.X está congelada y testeada estáticamente. Opera de modo sandbox autónomo, lo que mitiga cualquier riesgo de caída de red o API externa durante la demostración.»'
        },
        {
          stepNum: 3,
          title: 'Trazabilidad y Validación en Terreno',
          duration: '2.0 min',
          moduleName: 'ORBI OT Center',
          viewId: 'OTs',
          objective: 'Demostrar los casos clave (PM Anual Cantillana y Correctiva) y el control de repuestos.',
          phrase: '«Garantizamos la inmutabilidad de la información técnica. El sistema geocerca repuestos y rechaza cierres que no cuenten con firmas o evidencias correspondientes.»'
        },
        {
          stepNum: 4,
          title: 'Planificación Avanzada y Resource Planner',
          duration: '2.5 min',
          moduleName: 'ORBI Workspace',
          viewId: 'Workspace',
          objective: 'Navegar por el Resource Planner, cuadrillas por zona y el detector inteligente de colisiones horarias.',
          phrase: '«Workspace previene la fatiga laboral y los bloqueos logísticos al analizar la sobrecarga de HH del equipo antes de que salgan a terreno.»'
        },
        {
          stepNum: 5,
          title: 'Insight Center y KPIs de Clientes',
          duration: '2.0 min',
          moduleName: 'ORBI Insight Center',
          viewId: 'BI',
          objective: 'Ver ranking de plantas solares, cumplimiento de contratos SLA y matriz técnica de horas.',
          phrase: '«Medimos la desviación de horas registradas frente a las estimaciones de planificación, otorgando visibilidad completa de la productividad por parque.»'
        },
        {
          stepNum: 6,
          title: 'Dossier PDF e Impresión A4',
          duration: '1.5 min',
          moduleName: 'ORBI Insight Report Pack',
          viewId: 'BI',
          objective: 'Previsualizar el diseño de impresión limpio y activar el sistema de exportación premium.',
          phrase: '«Generamos un dossier físico-ready con marcas de seguridad. La nota de calidad del dato de HH resguarda legalmente la información frente a interpretaciones sindicales.»'
        },
        {
          stepNum: 7,
          title: 'Roadmap y Módulos Corporativos',
          duration: '1.0 min',
          moduleName: 'Ecosistema',
          viewId: 'DemoReadiness',
          objective: 'Establecer la ruta de extracción de módulos futuros (Matriz de Plantas, Organigrama, Flota).',
          phrase: '«ORBI se expandirá integrando de forma nativa la base de datos de flota, organigramas y plantas actualmente administrados por Corporate Assistant.»'
        }
      ]
    },
    '20m': {
      id: '20m',
      name: 'Demo Completa',
      duration: '20 minutos',
      focus: 'Revisión técnica de procesos extremo a extremo',
      sequence: ['Home Global', 'OT Center', 'Evidence Vault', 'PTW Center', 'Inventario O&M', 'Workspace', 'Insight Center', 'Report Pack', 'Roadmap', 'FAQ'],
      steps: [
        {
          stepNum: 1,
          title: 'Visión Holística y Command Center',
          duration: '2.0 min',
          moduleName: 'Home Global',
          viewId: 'Home',
          objective: 'Explicar el modelo operativo general de ORBI y los dolores del negocio solar.',
          phrase: '«ORBI interconecta los pilares de planificación, terreno, seguridad, repuestos y analítica ejecutiva, eliminando hilos de información.»'
        },
        {
          stepNum: 2,
          title: 'Workflow y Cierre de OT',
          duration: '2.5 min',
          moduleName: 'ORBI OT Center',
          viewId: 'OTs',
          objective: 'Revisar estados de bandeja operativa y transiciones rígidas de las órdenes de trabajo.',
          phrase: '«Cada estado operativo se valida mediante un check de requisitos mínimos, evitando que pasen reportes incompletos a bandeja del supervisor.»'
        },
        {
          stepNum: 3,
          title: 'Evidence Vault: Dossier de Fotos',
          duration: '2.0 min',
          moduleName: 'Evidence Vault',
          viewId: 'OTs', // Vault lives inside OTs view
          objective: 'Mostrar el modo de limpieza inversores (Antes/Durante/Después) y clasificación de archivos.',
          phrase: '«Estructuramos las evidencias visuales. Si hay fotos borrosas, el supervisor las devuelve con un comentario que el técnico visualiza de inmediato en su celular.»'
        },
        {
          stepNum: 4,
          title: 'PTW Center y Seguridad Operacional',
          duration: '2.0 min',
          moduleName: 'PTW Center',
          viewId: 'OTs', // PTW lives inside OTs
          objective: 'Demostrar el análisis de seguridad en el trabajo (AST), checklist LOTO y firmas digitales.',
          phrase: '«Aseguramos la vida del personal. Una orden en alta tensión requiere obligatoriamente un PTW abierto con firmas cruzadas para poder iniciarse.»'
        },
        {
          stepNum: 5,
          title: 'Inventario O&M y Reconciliación Excel',
          duration: '2.0 min',
          moduleName: 'Inventario O&M',
          viewId: 'OTs', // Inventory lives inside OTs
          objective: 'Mostrar restricción de stock, movimientos históricos y conciliador de diferencias físicas vs teóricas.',
          phrase: '«Geocercamos los repuestos por parque para resguardar el inventario crítico, proveyendo un módulo de conciliación para auditorías físicas mensuales.»'
        },
        {
          stepNum: 6,
          title: 'Workspace, Calendarios y Planificador',
          duration: '3.0 min',
          moduleName: 'ORBI Workspace',
          viewId: 'Workspace',
          objective: 'Revisar la agenda de los técnicos, control de sobrecarga y resolución de conflictos de planificación.',
          phrase: '«Workspace calcula el uso eficiente del capital humano y previene traslados ineficientes, organizando los turnos y la fatiga laboral.»'
        },
        {
          stepNum: 7,
          title: 'Insight Center y Desviaciones',
          duration: '2.5 min',
          moduleName: 'ORBI Insight Center',
          viewId: 'BI',
          objective: 'Analizar las horas registradas por técnico, ranking de rentabilidad y disponibilidad de plantas.',
          phrase: '«Esta consola otorga a gerencia una visión de pájaro sobre los desvíos operacionales y el cumplimiento del plan anual de mantenimiento.»'
        },
        {
          stepNum: 8,
          title: 'Insight Report Pack A4',
          duration: '1.5 min',
          moduleName: 'ORBI Insight Report Pack',
          viewId: 'BI',
          objective: 'Generar el reporte de la demo e imprimir a formato físico/PDF.',
          phrase: '«Exportamos el expediente listo para entrega al cliente final con advertencias de confidencialidad y notas sobre el dato de HH.»'
        },
        {
          stepNum: 9,
          title: 'Roadmap de Módulos Pendientes',
          duration: '1.5 min',
          moduleName: 'Ecosystem Center',
          viewId: 'DemoReadiness',
          objective: 'Detallar los bloques en desarrollo de plantas, personas y flota.',
          phrase: '«Nuestra visión a mediano plazo integra las bases maestros de Corporate Assistant de manera unificada para eliminar integraciones secundarias.»'
        },
        {
          stepNum: 10,
          title: 'Consultas y Preguntas Frecuentes',
          duration: '1.0 min',
          moduleName: 'Release Center FAQ',
          viewId: 'DemoReadiness',
          objective: 'Abordar las consultas típicas de gerencia (Softwrench, SharePoint real, integraciones, etc).',
          phrase: '«Nuestra arquitectura modular está diseñada para acoplar APIs de SharePoint o Softwrench con facilidad gracias al adaptador de datos unificado.»'
        }
      ]
    }
  };

  const activeRouteData = demoRoutes[selectedRoute];

  return (
    <div className="space-y-6">
      {/* BANNER PRINCIPAL */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-md shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
              MÓDULO 12C — DEMO EXECUTIVE HUB
            </span>
            <span className="text-[9px] font-mono text-slate-500">v0.12C-QA Release Lock</span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
            <Award className="h-6 w-6 text-emerald-400" /> ORBI Executive Demo Hub
          </h2>
          <p className="text-xs text-slate-400 max-w-4xl leading-normal">
            Centro de presentación, release y recorrido ejecutivo del ecosistema **ORBI O&M Command Center IA**. Use esta consola integrada para planificar y conducir demostraciones fluidas de alto impacto para gerentes, directores y clientes de O&M.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleResetData}
            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold text-xs font-mono px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reiniciar Demo Sandbox
          </button>
          <button
            onClick={handleCopySummary}
            className="bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-emerald-500/20 font-bold text-xs font-mono px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Share2 className="h-3.5 w-3.5" /> Copiar Resumen Ejecutivo
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-mono text-center animate-fade-in shadow-inner">
          ✓ {feedbackMessage}
        </div>
      )}

      {/* DISCLAIMER SEGURIDAD */}
      <div className="bg-amber-950/20 border-2 border-amber-500/20 p-4.5 rounded-2xl flex items-start gap-4">
        <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
            🛡️ Demo Sandbox / Read-Only / No Productive Integrations
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed font-mono space-y-1">
            • <strong>Datos Demo / LocalStorage:</strong> Toda la persistencia opera de forma simulada y aislada en localStorage para máxima seguridad. <br />
            • <strong>Sin APIs reales ni credenciales expuestas:</strong> El sistema no realiza llamadas a servidores productivos ni expone URLs internas, garantizando una presentación ejecutiva 100% segura. <br />
            • <strong>SharePoint Router Virtual:</strong> Los dossiers de entrega se organizan y archivan en un árbol de directorios simulado a nivel cliente. <br />
            • <strong>Calidad del dato de Horas-Hombre (HH):</strong> Toda métrica es puramente referencial, estimada o reportada con fines de planificación, descartando cualquier validez salarial o biométrica.
          </p>
        </div>
      </div>

      {/* SECCIÓN 1: ESTADO DEL ECOSISTEMA BENTO GRID */}
      <div className="space-y-3">
        <div className="border-b border-slate-850 pb-2">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            1. Estado General de Madurez del Ecosistema
          </h3>
          <p className="text-[11px] text-slate-500">
            Nivel de finalización, responsabilidades y alcances de cada componente en la suite ORBI O&M Command Center IA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modulesList.map((mod) => {
            const Icon = mod.icon;
            const isFrozen = mod.status === 'FROZEN';
            const isPending = mod.status === 'PENDING';
            const isShell = mod.status === 'STABLE_SHELL';
            const isIntegrated = mod.status === 'INTEGRATED';

            let statusColor = 'text-slate-500 bg-slate-900 border-slate-800';
            let badgeText = mod.badge;

            if (isFrozen) {
              statusColor = 'text-rose-400 bg-rose-500/5 border-rose-500/20';
            } else if (isShell) {
              statusColor = 'text-teal-400 bg-teal-500/5 border-teal-500/20';
            } else if (isIntegrated) {
              statusColor = 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20';
            } else if (isPending) {
              statusColor = 'text-amber-500/10 text-amber-400 border-amber-500/10';
            }

            return (
              <div
                key={mod.id}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-900 flex flex-col justify-between space-y-4 hover:border-slate-800 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                      <Icon className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border ${statusColor}`}>
                      {badgeText}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{mod.name}</h4>
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{mod.statusLabel}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {mod.responsibility}
                  </p>
                </div>

                {mod.viewId ? (
                  <button
                    onClick={() => onNavigate(mod.viewId!)}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-emerald-400 hover:text-white text-[10px] font-bold font-mono rounded-xl border border-slate-850 transition-colors flex items-center justify-center gap-1.5"
                  >
                    Abrir módulo <ChevronRight className="h-3 w-3" />
                  </button>
                ) : (
                  <div className="text-[9px] text-slate-500 font-mono bg-slate-900/30 py-1.5 text-center rounded-xl border border-slate-900">
                    Extracción desde Corporate Asst.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 2: MAPA VISUAL DEL ECOSISTEMA */}
      <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-2xl space-y-4">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Map className="h-4 w-4 text-emerald-400" /> 2. Mapa Visual del Ecosistema Integrado
          </h3>
          <p className="text-[11px] text-slate-500">
            Comprenda cómo se encadenan los sistemas operativos de ORBI para asegurar un ciclo sin fugas de datos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono text-slate-300">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
            <span className="text-[9px] font-mono text-emerald-400 uppercase font-black tracking-widest block">
              1. PLANIFICACIÓN (EL "CUÁNDO")
            </span>
            <div className="space-y-1.5 leading-relaxed">
              <p className="text-slate-200 font-bold">ORBI Workspace</p>
              <p className="text-[11px] text-slate-400">
                Define cuándo, dónde y quién ejecuta. Valida colisiones horarias, cuadrillas y sobrecarga de horas de campo antes del despacho.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
            <span className="text-[9px] font-mono text-emerald-400 uppercase font-black tracking-widest block">
              2. EJECUCIÓN (EL "QUÉ")
            </span>
            <div className="space-y-1.5 leading-relaxed">
              <p className="text-slate-200 font-bold">ORBI OT Center</p>
              <p className="text-[11px] text-slate-400">
                Define qué se ejecuta y cómo se cierra. Captura listas técnicas, firmas cruzadas PTW, secuencias de limpieza en Vault y control de stock de repuestos.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
            <span className="text-[9px] font-mono text-emerald-400 uppercase font-black tracking-widest block">
              3. CIERRE DOCUMENTAL & ENTREGA
            </span>
            <div className="space-y-1.5 leading-relaxed">
              <p className="text-slate-200 font-bold">Report Center & SharePoint Router</p>
              <p className="text-[11px] text-slate-400">
                Valida semáforos mínimos de entrega, asila y archiva automáticamente los dossiers unificados en carpetas corporativas virtuales.
              </p>
            </div>
          </div>
        </div>

        {/* ANALYTICS BAR INTEGRATION */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
          <div className="space-y-1 font-mono">
            <span className="text-[9px] font-mono text-indigo-400 uppercase font-black block">4. CAPA DE INTELIGENCIA Y REPORTE EJECUTIVO</span>
            <p className="text-slate-200 font-bold">ORBI Insight Center + Insight Report Pack</p>
            <p className="text-[11px] text-slate-400 leading-normal">
              Mide, interpreta, califica y recomienda. Transforma la lectura agregada de las OTs y recursos en un dossier de PDF ejecutivo premium imprimible A4.
            </p>
          </div>
          <div className="bg-emerald-500/5 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-[10px] font-mono font-bold shrink-0">
            SINCRO LOCAL ACTIVADA ✓
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: RUTAS DE DEMO / WALKTHROUGH TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl space-y-4 backdrop-blur-sm lg:col-span-2">
          <div className="border-b border-slate-850 pb-2 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Play className="h-4 w-4 text-emerald-400" /> 3. Rutas de Demostración Planificadas
              </h3>
              <p className="text-[11px] text-slate-500">
                Seleccione la ruta según el perfil del espectador y el tiempo disponible.
              </p>
            </div>
          </div>

          {/* ROUTE SELECTORS */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(demoRoutes) as Array<'7m' | '12m' | '20m'>).map((rk) => {
              const route = demoRoutes[rk];
              const isSelected = selectedRoute === rk;
              return (
                <button
                  key={rk}
                  onClick={() => handleSelectRoute(rk)}
                  className={`p-3 rounded-xl border font-mono text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-md'
                      : 'bg-slate-950/40 text-slate-400 border-slate-900 hover:border-slate-850 hover:bg-slate-900/20'
                  }`}
                >
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Ruta {route.duration}</span>
                  <span className="text-xs font-bold block text-slate-200 mt-1">{route.name}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{route.focus}</span>
                </button>
              );
            })}
          </div>

          {/* TIMELINE STEPS RENDER */}
          <div className="bg-slate-950 rounded-xl border border-slate-900 p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">
                Pasos del Recorrido ({activeRouteData?.steps?.length || 0} hitos)
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                Sugerencia: Siga el orden cronológico
              </span>
            </div>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {(activeRouteData?.steps || []).map((step, idx) => {
                const isCurrent = activeTimelineStep === idx;
                return (
                  <div
                    key={step.stepNum}
                    onClick={() => setActiveTimelineStep(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-emerald-500/5 border-emerald-500/35 shadow-inner'
                        : 'bg-slate-900/40 border-slate-900/80 hover:border-slate-850'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                          isCurrent ? 'bg-emerald-400 text-slate-950 font-black' : 'bg-slate-950 text-slate-500 border border-slate-850'
                        }`}>
                          {step.stepNum}
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-slate-200 leading-tight">{step.title}</h5>
                          <span className="text-[9px] text-slate-500 font-mono uppercase mt-0.5 block">
                            Módulo: {step.moduleName} | Duración: {step.duration}
                          </span>
                        </div>
                      </div>

                      {step.viewId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(step.viewId!);
                          }}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 text-[9px] font-mono font-bold border border-slate-800 hover:border-emerald-500/30 text-emerald-400 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="h-2.5 w-2.5" /> Ir a {step.viewId}
                        </button>
                      )}
                    </div>

                    {isCurrent && (
                      <div className="mt-3 pt-2.5 border-t border-slate-900 space-y-2 text-xs">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                          <strong className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Objetivo del Paso:</strong>
                          <p className="text-slate-300 leading-normal">{step.objective}</p>
                        </div>
                        <div className="bg-emerald-950/20 border-l-2 border-emerald-500 p-2.5 rounded-r-lg italic">
                          <strong className="text-emerald-400 text-[10px] font-mono uppercase not-italic block mb-1">Frase sugerida para presentar:</strong>
                          <p className="text-emerald-300 leading-relaxed font-sans font-medium">{step.phrase}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TIMELINE RIGHT SIDE: CHECKLIST & GUIDELINES */}
        <div className="space-y-6">
          {/* PRE-DEMO CHECKLIST */}
          <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl space-y-4 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
              <ClipboardList className="h-4.5 w-4.5 text-teal-400" /> Checklist Técnico Pre-Demo
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal font-mono">
              Verificaciones estructurales mínimas para el correcto funcionamiento del ecosistema O&M.
            </p>

            <div className="space-y-2.5 text-xs font-mono text-slate-400">
              {[
                { label: 'Sandbox activo', status: true },
                { label: 'Módulos congelados visibles', status: true },
                { label: 'Sin credenciales visibles', status: true },
                { label: 'Sin URLs internas', status: true },
                { label: 'OT Center disponible', status: true },
                { label: 'Workspace disponible', status: true },
                { label: 'ORBI Insight Center disponible', status: true },
                { label: 'Report Pack PDF disponible', status: true },
                { label: 'SharePoint Router Virtual', status: true },
                { label: 'HH con advertencia de calidad del dato', status: true },
                { label: 'Demo data cargada', status: true },
                { label: 'Build validado', status: true }
              ].map((chk, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                  <span>{chk.label}</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px]">
                    ✓ CONFIRMADO
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PRESENTER ACCIONES RAPIDAS */}
          <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl space-y-4 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
              <Compass className="h-4.5 w-4.5 text-teal-400" /> Acciones Rápidas del Presentador
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={() => onNavigate('Home')}
                className="py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-colors text-center"
              >
                1. Home Global
              </button>
              <button
                onClick={() => onNavigate('OTs')}
                className="py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-colors text-center"
              >
                2. OT Center
              </button>
              <button
                onClick={() => onNavigate('Workspace')}
                className="py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-colors text-center"
              >
                3. Workspace
              </button>
              <button
                onClick={() => onNavigate('BI')}
                className="py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-colors text-center"
              >
                4. Insight Center
              </button>
              <button
                onClick={() => {
                  onNavigate('BI', { showReportWizard: true });
                  showFeedback("Redireccionando a Report Pack (Dossier PDF)");
                }}
                className="py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-colors text-center"
              >
                5. Report Pack
              </button>
              <button
                onClick={() => onNavigate('DemoReadiness')}
                className="py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-colors text-center"
              >
                6. Demo Center
              </button>
            </div>
            <button
              onClick={() => {
                onNavigate('BI', { showReportWizard: true });
                showFeedback("Redireccionando al Insight Center con el asistente de reporte activado.");
              }}
              className="w-full py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="h-4 w-4" /> Generar Dossier PDF Ejecutivo
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: SUGESTED SCRIPT COMPONENT */}
      <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl space-y-4 backdrop-blur-sm">
        <div className="flex justify-between items-center border-b border-slate-850 pb-2">
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-4.5 w-4.5 text-teal-400" /> 4. Guion de Presentación Sugerido
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              Argumentos ejecutivos y conceptuales clave para justificar el diseño del ecosistema ORBI Energy.
            </p>
          </div>
          <button
            onClick={() => {
              const scriptText = `Inicio: "ORBI O&M Command Center IA centraliza planificación, ejecución, cierre documental, análisis y reportería ejecutiva en una sola plataforma."
OT Center: "Este módulo permite gestionar la trazabilidad de la orden de trabajo, evidencias, permisos, repuestos y cierre documental."
Workspace: "Workspace organiza cuándo se ejecuta cada actividad, quién la realiza y qué bloqueos pueden afectar el despacho."
ORBI Insight Center: "Insight Center convierte la operación en indicadores ejecutivos, estado por cliente, HH, ranking de plantas e insights accionables."
Report Pack: "Insight Report Pack transforma la lectura ejecutiva en un dossier PDF preparado para gerencia o cliente."
Roadmap: "Los próximos módulos extraídos desde Corporate Assistant completarán la base maestra de plantas, personas y logística."`;
              navigator.clipboard.writeText(scriptText);
              setCopiedScript(true);
              showFeedback("¡Guion de presentación copiado!");
              setTimeout(() => setCopiedScript(false), 2000);
            }}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-emerald-400 font-mono text-[10px] font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {copiedScript ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
            {copiedScript ? 'Copiado' : 'Copiar Guion'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 text-xs">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-1.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">01. BIENVENIDA & PROPÓSITO</span>
            <p className="text-slate-300 leading-relaxed italic">
              «ORBI O&amp;M Command Center IA centraliza la planificación, ejecución, cierre documental, análisis y reportería ejecutiva en una sola plataforma unificada.»
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-1.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">02. VALOR DE OT CENTER</span>
            <p className="text-slate-300 leading-relaxed italic">
              «Este módulo permite gestionar la trazabilidad de la orden de trabajo, evidencias fotográficas estructuradas, permisos de trabajo de seguridad AST y consumo de repuestos.»
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-1.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">03. VALOR DE WORKSPACE</span>
            <p className="text-slate-300 leading-relaxed italic">
              «Workspace organiza de manera predictiva cuándo se ejecuta cada actividad, quién la realiza y qué bloqueos de materiales o fatiga horaria pueden afectar la jornada.»
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-1.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">04. VALOR DE INSIGHT CENTER</span>
            <p className="text-slate-300 leading-relaxed italic">
              «Insight Center convierte la operación cruda de terreno en indicadores consolidados de SLA, matriz de horas registradas por técnico y rankings de disponibilidad de plantas.»
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-1.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">05. VALOR DE REPORT PACK</span>
            <p className="text-slate-300 leading-relaxed italic">
              «Insight Report Pack transforma las lecturas operacionales en expedientes PDF de formato físico A4 preparados de manera inmediata para la gerencia y auditoría de clientes.»
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-1.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">06. ROADMAP DE EXTRACCIÓN</span>
            <p className="text-slate-300 leading-relaxed italic">
              «Los próximos módulos extraídos de Corporate Assistant unificarán el maestro físico de activos, el organigrama de jerarquías y la asignación geolocalizada de camionetas.»
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
