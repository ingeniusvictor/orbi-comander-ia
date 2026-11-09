/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Play,
  FileText,
  Database,
  Layers,
  ShieldAlert,
  Share2,
  Check,
  Eye,
  Info,
  Lock,
  BookOpen,
  EyeOff,
  Terminal,
  Award,
  ExternalLink,
  Clock,
  User,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { OT, Planta } from '../types';
import { resetAllDatabases } from '../data/db';

interface DemoReadinessProps {
  ots: OT[];
  plantas: Planta[];
  userRole: string;
  activeUserName: string;
  onUpdateOts?: (updatedOts: OT[]) => void;
  onAddAuditLog?: (
    accion: string,
    modulo: string,
    otCode?: string,
    plantaName?: string,
    comentario?: string,
    criticidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  ) => void;
  onNavigate?: (view: string) => void;
}

interface DemoChecklistItem {
  id: string;
  label: string;
  status: 'Listo' | 'Revisar' | 'No mostrar';
  notes: string;
}

interface WalkthroughStep {
  id: number;
  title: string;
  duration: string;
  roles: string[];
  show: string;
  keyMessage: string;
  tips: string[];
  inTimeline: {
    short: boolean; // 7m
    standard: boolean; // 12m
    full: boolean; // 18m
  };
}

export default function DemoReadiness({
  ots,
  plantas,
  userRole,
  activeUserName,
  onUpdateOts,
  onAddAuditLog,
  onNavigate
}: DemoReadinessProps) {
  // Navigation tabs for Demo Readiness
  const [activeTab, setActiveTab] = useState<'control' | 'walkthrough' | 'summary'>('control');
  const [isShortVersion, setIsShortVersion] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Demo Timeline Mode: short (7m), standard (12m), full (18m)
  const [demoTimeline, setDemoTimeline] = useState<'short' | 'standard' | 'full'>('standard');

  // Selected Walkthrough step (1 - 11)
  const [activeStep, setActiveStep] = useState<number>(1);

  // States for walkthrough steps saved in localStorage
  const [stepStates, setStepStates] = useState<Record<number, 'Listo' | 'Revisar' | 'Omitir'>>({
    1: 'Listo', 2: 'Listo', 3: 'Listo', 4: 'Listo', 5: 'Listo',
    6: 'Listo', 7: 'Listo', 8: 'Listo', 9: 'Listo', 10: 'Listo', 11: 'Listo'
  });

  // Demo Checklist state - saved in localStorage
  const [checklist, setChecklist] = useState<DemoChecklistItem[]>([
    { id: 'flujo-tecnico', label: 'Flujo de Ejecución Técnico (Terreno)', status: 'Listo', notes: 'Pantalla ultra-limpia y responsive, sin paneles de administración ni carga de catálogos.' },
    { id: 'flujo-supervisor', label: 'Flujo de Revisión Supervisor (Filtros)', status: 'Listo', notes: 'Acceso total a bandejas, semáforos, cierres documentales de reportes y de PTWs.' },
    { id: 'scheduler', label: 'ORBI Scheduler IA (7A)', status: 'Listo', notes: 'Calendario global interactivo (Mes/Semana/Día) con bandeja de triage y sidebar de integraciones.' },
    { id: 'resource-planner', label: 'Resource Planner (7B)', status: 'Listo', notes: 'Cálculo de sobrecarga horaria (>12h/día, >45h/semana), mapa de rutas cronológicas de técnicos y alertas IA.' },
    { id: 'evidence-vault', label: 'ORBI Evidence Vault', status: 'Listo', notes: 'Modo de Limpieza de Inversores con secuencias Antes/Durante/Después y bandeja de triage.' },
    { id: 'ptw', label: 'PTW Center (Permisos de Trabajo)', status: 'Listo', notes: 'Generador automático de AST, bloqueo LOTO, firmas multifactor de apertura y cierre.' },
    { id: 'inventario', label: 'Inventario O&M (Módulo 6)', status: 'Listo', notes: 'Restricción de stock por planta para evitar valores negativos y módulo de conciliación mensual Excel.' },
    { id: 'report-center', label: 'ORBI Report Center (Módulo 8)', status: 'Listo', notes: 'Estructura de 7 bandejas documentales, semáforos de cumplimiento y compilador de Report Pack A4.' },
    { id: 'sharepoint-router', label: 'SharePoint Virtual Router', status: 'Listo', notes: 'Estructura de carpetas virtualizada con renombrado automático estandarizado de reportes aprobados.' },
    { id: 'casos-cantillana', label: 'Consistencia de Casos Cantillana', status: 'Listo', notes: 'Coherencia estricta de OT-26-29221 (PM Anual) y OT-26-29222 (Correctivo separado con repuestos).' }
  ]);

  // Load state from local storage on mount
  useEffect(() => {
    const savedChecklist = localStorage.getItem('orbi_demo_readiness_checklist');
    if (savedChecklist) {
      try {
        setChecklist(JSON.parse(savedChecklist));
      } catch (e) {
        console.error("Error al cargar checklist de demo", e);
      }
    }

    const savedStepStates = localStorage.getItem('orbi_walkthrough_step_states');
    if (savedStepStates) {
      try {
        setStepStates(JSON.parse(savedStepStates));
      } catch (e) {
        console.error("Error al cargar estados de pasos de walkthrough", e);
      }
    }
  }, []);

  const handleUpdateStatus = (id: string, newStatus: 'Listo' | 'Revisar' | 'No mostrar') => {
    const updated = checklist.map(item => item.id === id ? { ...item, status: newStatus } : item);
    setChecklist(updated);
    localStorage.setItem('orbi_demo_readiness_checklist', JSON.stringify(updated));
    if (onAddAuditLog) {
      onAddAuditLog(
        `Actualizó estado de demo para item: ${id} a ${newStatus}`,
        'Release Center',
        undefined,
        undefined,
        `Se configuró estado de preparación en: ${newStatus}`,
        'Baja'
      );
    }
  };

  const handleUpdateStepState = (stepId: number, newState: 'Listo' | 'Revisar' | 'Omitir') => {
    const updated = { ...stepStates, [stepId]: newState };
    setStepStates(updated);
    localStorage.setItem('orbi_walkthrough_step_states', JSON.stringify(updated));
    if (onAddAuditLog) {
      onAddAuditLog(
        `Actualizó estado de paso de walkthrough #${stepId} a ${newState}`,
        'Release Center',
        undefined,
        undefined,
        `Paso #${stepId} marcado como ${newState}`,
        'Baja'
      );
    }
  };

  // State for raw JSON preview
  const [showJsonSnapshot, setShowJsonSnapshot] = useState<boolean>(false);
  const [copyConfirmed, setCopyConfirmed] = useState<boolean>(false);
  const [mockNavAlert, setMockNavAlert] = useState<string | null>(null);

  // Find demo OTs state
  const getOtStatus = (codigo: string) => {
    const normalized = codigo.replace(/^OT-/i, '');
    const ot = ots.find(o => {
      const candidate = (o.codigo || '').replace(/^OT-/i, '');
      return o.codigo === codigo || candidate === normalized;
    });
    return ot ? ot.estado : 'Pendiente de inicialización';
  };

  // Generate dynamic snapshot payload
  const getSnapshotPayload = () => {
    return {
      version: 'ORBI OT Center v0.X — Stable Field-Ops, Planning & Document Delivery Candidate',
      status: 'FROZEN',
      build: 'OK',
      typescript: 'OK',
      lastValidation: 'Julio 2026',
      releaseManager: activeUserName,
      roleActive: userRole,
      timestamp: new Date().toISOString(),
      congelados: [
        'OT Core',
        'Vista Técnico',
        'Evidence Vault',
        'SharePoint Router',
        'PTW Center',
        'Inventario O&M',
        'Scheduler IA 7A',
        'Resource Planner 7B',
        'Report Center 8'
      ],
      checklistDemo: checklist.reduce((acc, curr) => {
        acc[curr.id] = curr.status;
        return acc;
      }, {} as Record<string, string>),
      walkthroughStepsStates: stepStates,
      casosDemo: [
        { codigo: 'OT-26-29221', tipo: 'Preventiva', estadoActual: getOtStatus('26-29221') },
        { codigo: 'OT-26-29222', tipo: 'Correctiva', estadoActual: getOtStatus('OT-26-29222') }
      ],
      mockIntegrations: {
        softwrench: 'No conectado (Sandboxed)',
        sharepoint: 'No conectado (Virtual LocalStorage Router)',
        googleCalendar: 'No conectado (Simulado)',
        googleMaps: 'No conectado (Simulado sin API real)',
        pdfGenerator: 'No generado (Simulador Visual A4)'
      }
    };
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(getSnapshotPayload(), null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopyConfirmed(true);
    setTimeout(() => setCopyConfirmed(false), 2000);
  };

  const handleCopySummary = () => {
    const text = isShortVersion ? `ORBI OT Center v0.X — Stable Field-Ops, Planning, Document Delivery & Executive Demo Candidate (FROZEN)

Mensaje Central: "El técnico ejecuta, el sistema organiza y el supervisor controla."

Objetivo: ORBI OT Center unifica el ciclo O&M conectando Scheduler IA, Vista Terreno, Inventario Segmentado por planta y Cierre Documental en un solo click.
Dolor que resuelve: Elimina el 100% de la carga administrativa manual del técnico y la dispersión de datos O&M.
Casos Clave: OT-26-29221 (PM Anual Inversores Cantillana) y OT-26-29222 (Correctiva Inversor Central C2 Cantillana con consumo de repuestos).
Límites Sandbox: Operación 100% segura en Sandbox local, sin llamadas externas ni API keys reales.` : `ORBI OT Center v0.X — Stable Field-Ops, Planning, Document Delivery & Executive Demo Candidate (FROZEN)

Mensaje Central: "El técnico ejecuta, el sistema organiza y el supervisor controla."

Objetivo General:
ORBI OT Center ordena el ciclo completo de órdenes de trabajo O&M, conectando planificación, ejecución en terreno, evidencias, permisos, inventario, reportes y cierre documental.

Problemas que Resuelve:
- Órdenes de trabajo (OT) dispersas
- Evidencias fotográficas desordenadas o perdidas
- Permisos de trabajo (PTW) firmados fuera del flujo principal
- Inventario en planillas Excel vulnerables
- Reportes finales armados de forma manual
- SharePoint ordenado manualmente a destiempo
- Técnicos sobrecargados con administración

Módulos Incluidos en la v0.X:
1. Vista Técnico / Mi Agenda (Para operarios)
2. OT Core (Gestión del ciclo de vida)
3. Evidence Vault (Modo Limpieza Inversores antes/durante/después)
4. PTW Center (Generación de AST, LOTO y firmas digitales)
5. Inventario O&M (Control de stock segmentado por planta y conciliación mensual)
6. SharePoint Router Virtual (Estructura de archivos ordenada de forma automática)
7. Scheduler IA 7A (Calendario interactivo y inbox de triage)
8. Resource Planner 7B (Control de carga, cuadrillas y detector de colisiones)
9. Report Center 8 (Bandejas de revisión, semáforos documentales y dossier A4)
10. Release Control 9A (Monitoreo de compilación y base de datos)
11. Executive Walkthrough 9B (Guía de presentación de 11 pasos cronológicos)

Casos de Demostración de Referencia:
- Caso Preventivo (OT-26-29221): PM Anual Inversores, Planta Solar Cantillana (PMGD 9.5 MW), 39 inversores Sungrow SG250, mantenimiento e inspección visual sin repuestos.
- Caso Correctivo (OT-26-29222): Correctiva Inversor Central C2 Cantillana, cambio de tarjeta de control o fusible de potencia, descuento automático de inventario, evidencias antes/después y reporte correctivo separado (sin relación con trackers).

Beneficios Clave:
- Para el Técnico: Interfaz simple y móvil, solo visualiza sus tareas, cero carga administrativa y alertas de corrección claras.
- Para el Supervisor: Planificación global, control de carga de personal, validación estricta de evidencias, PTW e inventario unificado, semáforos documentales y cierre en un click.
- Para la Jefatura: Trazabilidad absoluta de activos, cero pérdidas de evidencias, eliminación de reprocesos de informes y base de datos sandbox segura y aislada.

Límites de la Demo Sandbox:
- Softwrench real no conectado (operación simulada local).
- SharePoint real no conectado (rutas en router virtual simulado).
- Google Calendar y Google Maps simulados sin APIs reales.
- Generador de PDF del servidor simulado con vista en pantalla A4.
- Sin datos productivos, credenciales ni rutas reales expuestas.`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('¿Está seguro de que desea resetear la base de datos de demostración? Esto restaurará todos los datos base simulados y recargará la aplicación.')) {
      if (onAddAuditLog) {
        onAddAuditLog('Restablecimiento completo de base de datos mock desde Release Center', 'Release Center', undefined, undefined, 'Acción ejecutada por Jefatura', 'Media');
      }
      setTimeout(() => {
        resetAllDatabases();
      }, 500);
    }
  };

  // 11 steps for executive walkthrough
  const walkthroughSteps: WalkthroughStep[] = [
    {
      id: 1,
      title: 'Problema Operacional Actual',
      duration: '1.5 min',
      roles: ['SUPERVISOR_TERRENO', 'JEFE_OM'],
      show: 'Comience la presentación explicando el dolor tradicional de las operaciones de O&M: planillas Excel de planificación desincronizadas, fotografías de terreno perdidas en chats de WhatsApp, permisos de trabajo (PTW) firmados en papel, repuestos ingresados manualmente a destiempo y reportes PDF confeccionados artesanalmente. Enfatice que el técnico gasta un tercio de su jornada redactando reportes en vez de realizar labores preventivas.',
      keyMessage: '«ORBI no busca ser otro Softwrench ni rellenar dashboards de telemetría abstracta; busca simplificar y conectar la planificación de agenda, la ejecución técnica de terreno y el cierre documental de un solo click.»',
      tips: [
        'Explique el porqué del diseño suizo de alta densidad: legibilidad inmediata para el supervisor.',
        'Mencione que esta es la versión v0.X congelada y lista para validación de procesos.',
        'No ingrese en configuraciones profundas de servidor, muestre la visión de negocio.'
      ],
      inTimeline: { short: true, standard: true, full: true }
    },
    {
      id: 2,
      title: 'Vista Técnico Simple (Terreno)',
      duration: '2.0 min',
      roles: ['TECNICO_OM'],
      show: 'Cambie el rol en la barra superior a "Técnico O&M". Muestre la interfaz móvil responsive ultra-limpia "Mi Agenda". Seleccione la orden PM Anual (OT-26-29221). Muestre la simplicidad del checklist técnico anual de inversores, la subida de fotos antes/durante/después (Modo Limpieza) y el registro del diagnóstico de ejecución.',
      keyMessage: '«El técnico en terreno solo ve lo que necesita para trabajar hoy. Se remueve toda complejidad administrativa o de catálogos globales para evitar errores.»',
      tips: [
        'Enfatice que la pantalla del técnico carece de menús corporativos complejos, barras laterales o importadores Excel.',
        'Muestre la carga de evidencias y cómo se validan en tiempo real los campos mínimos.'
      ],
      inTimeline: { short: true, standard: true, full: true }
    },
    {
      id: 3,
      title: 'Scheduler Supervisor',
      duration: '1.5 min',
      roles: ['SUPERVISOR_TERRENO', 'COORDINADOR_OM'],
      show: 'Regrese al rol "Supervisor" y navegue a la pestaña "ORBI Scheduler IA". Muestre la vista del calendario en modo Mes, Semana y Día. Expanda la barra lateral de OTs sin programar (Triage Inbox) y asigne una OT pendiente a un técnico, fijando fecha, hora estimada y horas hombre. Muestre cómo los badges indican estado de Evidencias, PTW, SharePoint e Inventario en tiempo real.',
      keyMessage: '«El supervisor puede asignar y programar la carga del día con control completo de la trazabilidad documental de cada orden desde una misma pantalla.»',
      tips: [
        'Muestre la barra lateral de detalles de la OT en el calendario para ver cómo calcula el estado de evidencias y repuestos de manera reactiva.',
        'Explique que la asignación actualiza inmediatamente la agenda del técnico respectivo.'
      ],
      inTimeline: { short: true, standard: true, full: true }
    },
    {
      id: 4,
      title: 'Resource Planner',
      duration: '2.0 min',
      roles: ['SUPERVISOR_TERRENO', 'JEFE_OM'],
      show: 'Dentro de Scheduler, haga click en el botón "Ver Resource Planner" (Módulo 7B). Muestre las tarjetas de carga horaria de cada técnico, las cuadrillas configuradas por zona y planta, y el Detector de Conflictos Inteligente que reporta sobrecarga horaria (>12h/día, >45h/semana), colisiones horarias o permisos de trabajo sin responsable asignado.',
      keyMessage: '«El Resource Planner previene el cansancio y la fatiga laboral en terreno detectando colisiones geográficas o exceso de horas semanales antes de enviar al equipo a planta.»',
      tips: [
        'Muestre la sección de Sugerencias O&M IA que propone reasignaciones geográficas.',
        'Haga click en "Ruta del Día" para mostrar la secuencia cronológica de tareas del técnico.'
      ],
      inTimeline: { short: false, standard: true, full: true }
    },
    {
      id: 5,
      title: 'Evidence Vault',
      duration: '1.5 min',
      roles: ['SUPERVISOR_TERRENO', 'COORDINADOR_OM'],
      show: 'Navegue a la pestaña "Evidence Vault". Muestre el listado de paquetes de evidencias ordenados por planta, OT y activos (ej. Inversores Sungrow SG250). Muestre el Modo Limpieza de Inversores de la OT-26-29221, visualizando las secuencias cronológicas del mantenimiento preventivo. Demuestre la bandeja de clasificación para fotos cargadas externamente.',
      keyMessage: '«Las fotografías de terreno dejan de ser archivos sueltos en WhatsApp y pasan a ser un expediente estructurado auditable por el cliente final.»',
      tips: [
        'Enfatice el flujo de aprobación/rechazo: si el supervisor rechaza, el técnico recibe una alerta de corrección inmediata.'
      ],
      inTimeline: { short: true, standard: true, full: true }
    },
    {
      id: 6,
      title: 'PTW Center (Permisos de Trabajo)',
      duration: '1.5 min',
      roles: ['SUPERVISOR_TERRENO', 'TECNICO_OM'],
      show: 'Navegue a la pestaña "PTW Center". Muestre los permisos de trabajo de alto riesgo activos e históricos. Revise el flujo de creación de un permiso AST y check LOTO (bloqueo de energía). Muestre las firmas digitales requeridas para la apertura del permiso y el cierre de faena.',
      keyMessage: '«Ninguna orden crítica en media o alta tensión puede transicionar a estado de cierre si no cuenta con un permiso de trabajo (PTW) debidamente firmado y registrado.»',
      tips: [
        'Explique cómo el sistema asocia de forma rígida el permiso de trabajo a la orden de mantenimiento correspondiente.'
      ],
      inTimeline: { short: false, standard: true, full: true }
    },
    {
      id: 7,
      title: 'Inventario O&M (Módulo 6)',
      duration: '1.5 min',
      roles: ['TECNICO_OM', 'SUPERVISOR_TERRENO'],
      show: 'Navegue al módulo "Inventario O&M". Explique que cada planta solar mantiene un stock físico estanco. Muestre el caso correctivo de Cantillana (OT-26-29222) donde se consume una tarjeta de control de inversor Sungrow SG250, restándose instantáneamente del inventario. Pruebe que el sistema bloquea valores negativos e impone una justificación escrita para ajustes.',
      keyMessage: '«El inventario de repuestos está geocercado por parque solar. Los técnicos consumen directamente de su OT y el sistema previene saldos negativos protegiendo la veracidad física.»',
      tips: [
        'Muestre la sección de "Reconciliación Mensual Excel" que analiza diferencias teóricas versus auditorías físicas sin borrar datos históricos.'
      ],
      inTimeline: { short: false, standard: true, full: true }
    },
    {
      id: 8,
      title: 'Report Center (Módulo 8)',
      duration: '2.0 min',
      roles: ['JEFE_OM', 'COORDINADOR_OM'],
      show: 'Navegue a "Report Center". Esta es la joya documental. Muestre las 7 bandejas de seguimiento operativo. Revise los Semáforos Documentales en tiempo real (Checklist, Evidencias, PTW, Repuestos, SharePoint). Abra la OT-26-29221 ya finalizada en terreno, muestre el Preview A4 de entrega al cliente, y simule "Generar Report Pack" para compilar el dossier.',
      keyMessage: '«El Report Center elimina las horas de confección manual de informes. El sistema audita todos los entregables mínimos y genera el entregable en un click.»',
      tips: [
        'Haga especial énfasis en el botón "Devolver a Terreno". Al usarlo con un comentario de corrección, la OT vuelve instantáneamente a la agenda del técnico como pendiente.'
      ],
      inTimeline: { short: true, standard: true, full: true }
    },
    {
      id: 9,
      title: 'SharePoint Router Virtual',
      duration: '1.5 min',
      roles: ['SUPER_ADMIN_ORBI', 'JEFE_OM'],
      show: 'Navegue a la pestaña "SharePoint Router". Muestre el explorador de archivos virtualizado con carpetas estructuradas por parque solar, año, mes y tipo de OT. Revise la carpeta "01 - Reportes OT" y muestre el dossier PDF generado de Cantillana, renombrado con la nomenclatura corporativa estandarizada.',
      keyMessage: '«Antes de conectar las APIs de SharePoint y lidiar con colisiones de red, ORBI estructura, valida y renombra los archivos en un router virtual con lógica empresarial.»',
      tips: [
        'Muestre cómo el router virtual evita duplicados y mantiene tres estados claros: Pendiente, Preparado y Respaldado.'
      ],
      inTimeline: { short: false, standard: true, full: true }
    },
    {
      id: 10,
      title: 'Sandbox y Seguridad',
      duration: '1.0 min',
      roles: ['SUPER_ADMIN_ORBI'],
      show: 'Regrese a la pestaña "Release & Demo Center" (esta misma vista). Explique detalladamente el panel de "No conectar todavía" y "Límites de Sandbox". Expanda el JSON preview para mostrar que la demo es autónoma, segura y no transmite datos confidenciales.',
      keyMessage: '«Toda la demostración corre en un sandbox seguro de LocalStorage, libre de llamadas HTTP caídas o filtraciones de tokens reales. Seguridad y robustez garantizada.»',
      tips: [
        'Muestre el botón "Reset Demo Data" y explique que con un solo click se puede restaurar el estado inicial para la siguiente reunión.'
      ],
      inTimeline: { short: false, standard: false, full: true }
    },
    {
      id: 11,
      title: 'Cierre Ejecutivo',
      duration: '1.0 min',
      roles: ['SUPERVISOR_TERRENO', 'JEFE_OM'],
      show: 'Concluya la presentación resumiendo el flujo de extremo a extremo: Asignación simplificada con Scheduler, ejecución móvil sin burocracia para el técnico, auditoría inteligente de evidencias con el Vault, control de repuestos, y generación documental instantánea directa a SharePoint.',
      keyMessage: '«ORBI OT Center no es una base de datos estática; es un motor vivo que conecta terreno con jefatura para garantizar entregas documentales perfectas y libres de fricciones.»',
      tips: [
        'Pregunte a los asistentes por su feedback respecto a la densidad y simplicidad de la app.',
        'Mencione las Frases Clave de O&M si es oportuno.'
      ],
      inTimeline: { short: true, standard: true, full: true }
    }
  ];

  const isAuthorized = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'SUPERVISOR_TERRENO', 'COORDINADOR_OM'].includes(userRole);

  if (!isAuthorized) {
    return (
      <div className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl text-center max-w-xl mx-auto space-y-4 my-12 backdrop-blur-sm">
        <Lock className="h-10 w-10 text-rose-400 mx-auto" />
        <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Acceso Restringido</h3>
        <p className="text-xs text-slate-400 leading-normal">
          Este módulo está reservado únicamente para Super Admin, Jefe O&amp;M, Supervisor y Coordinador. Su rol actual ({userRole}) no tiene permisos para ver esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-md shadow-xl" id="demo-banner">
        <div>
          <span className="text-[9px] font-mono font-bold tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full uppercase">
            MÓDULO 9A &amp; 9B: RELEASE &amp; DEMO CONTROL
          </span>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2 tracking-tight mt-1">
            <Cpu className="h-5 w-5 text-teal-400" /> Release &amp; Demo Readiness Center
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Valide la preparación técnica de la versión v0.X congelada y utilice la Guía de Demo Ejecutiva integrada para exposiciones a gerencia de 10 a 15 minutos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('DemoHub')}
              className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 font-bold text-xs font-mono px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              id="btn-open-demohub"
            >
              <Award className="h-3.5 w-3.5" /> Executive Demo Hub (12C)
            </button>
          )}
          <button
            onClick={handleResetData}
            className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 font-bold text-xs font-mono px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            id="btn-reset-demo"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset Demo Data
          </button>
          <button
            onClick={() => setShowJsonSnapshot(true)}
            className="bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 font-bold text-xs font-mono px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            id="btn-export-snapshot"
          >
            <Share2 className="h-3.5 w-3.5 text-teal-400" /> Export Snapshot
          </button>
        </div>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="flex border-b border-slate-850">
        <button
          onClick={() => setActiveTab('control')}
          className={`px-5 py-3 text-xs font-bold font-mono tracking-wider flex items-center gap-2 transition-all border-b-2 uppercase ${
            activeTab === 'control'
              ? 'border-teal-400 text-teal-400 bg-teal-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          id="tab-demo-control"
        >
          <Layers className="h-4 w-4" /> Panel de Control de Versión (9A)
        </button>
        <button
          onClick={() => setActiveTab('walkthrough')}
          className={`px-5 py-3 text-xs font-bold font-mono tracking-wider flex items-center gap-2 transition-all border-b-2 uppercase ${
            activeTab === 'walkthrough'
              ? 'border-teal-400 text-teal-400 bg-teal-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          id="tab-demo-walkthrough"
        >
          <Play className="h-4 w-4" /> Guía de Demo Ejecutiva (9B)
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-5 py-3 text-xs font-bold font-mono tracking-wider flex items-center gap-2 transition-all border-b-2 uppercase ${
            activeTab === 'summary'
              ? 'border-teal-400 text-teal-400 bg-teal-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
          id="tab-demo-summary"
        >
          <FileText className="h-4 w-4" /> Resumen Ejecutivo (9C)
        </button>
      </div>

      {/* TAB CONTENT 1: CONTROL DE VERSION (9A) */}
      {activeTab === 'control' && (
        <div className="space-y-6">
          {/* VERSION INFORMATION CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-sm lg:col-span-2">
              <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-teal-400" /> Estado General de Versión
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 block font-mono">NOMBRE DE LA VERSION</span>
                  <span className="text-xs font-bold text-slate-200 block mt-0.5 leading-normal">
                    ORBI OT Center v0.X — Stable Field-Ops, Planning &amp; Document Delivery Candidate
                  </span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-mono">ESTADO DE REGISTRO</span>
                    <span className="text-xs font-black text-rose-400 block mt-0.5 font-mono">FROZEN / STABILIZED</span>
                  </div>
                  <span className="h-3.5 w-3.5 bg-rose-500/25 border border-rose-500/40 rounded-full flex items-center justify-center">
                    <span className="h-1.5 w-1.5 bg-rose-400 rounded-full animate-pulse"></span>
                  </span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-mono">ESTADO DE COMPILACIÓN (BUILD)</span>
                    <span className="text-xs font-bold text-emerald-400 block mt-0.5 font-mono">NPM BUILD: EXCELENTE</span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-mono">VERIFICACIÓN ESTÁTICA (TS)</span>
                    <span className="text-xs font-bold text-emerald-400 block mt-0.5 font-mono">TSC NO-EMIT: LIMPIO</span>
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 block font-mono">ÚLTIMA VALIDACIÓN CONTROLADA</span>
                  <span className="text-xs font-bold text-slate-200 block mt-0.5 font-mono">Julio 2026 — Certificado</span>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 block font-mono">ESTRATEGIA DE PERSISTENCIA</span>
                  <span className="text-xs font-bold text-teal-400 block mt-0.5 font-mono">Reactive LocalStorage (Sincronizado)</span>
                </div>
              </div>

              <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider mb-2">
                  MÓDULOS DEL PROYECTO CONGELADOS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'OT Core',
                    'Vista Técnico',
                    'Evidence Vault',
                    'SharePoint Router',
                    'PTW Center',
                    'Inventario O&M',
                    'Scheduler IA 7A',
                    'Resource Planner 7B',
                    'Report Center 8'
                  ].map((mod) => (
                    <span
                      key={mod}
                      className="bg-slate-900/80 border border-slate-800 text-slate-400 px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1"
                    >
                      <Lock className="h-3 w-3 text-slate-500" /> {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CONTROLES DE SEGURIDAD DE INTENTO */}
            <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl flex flex-col justify-between backdrop-blur-sm">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-500" /> Límites de Sandbox
                </h3>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">[MOCK]</span>
                    <p className="text-slate-400 leading-normal">
                      <strong>Softwrench real:</strong> No conectado. El sistema opera de manera autónoma con triggers locales.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">[MOCK]</span>
                    <p className="text-slate-400 leading-normal">
                      <strong>SharePoint real:</strong> No conectado. El virtual router archiva PDFs simulados en localStorage local.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">[MOCK]</span>
                    <p className="text-slate-400 leading-normal">
                      <strong>Google Calendar / Maps:</strong> No conectado. Agenda y rutas funcionan localmente sin tokens de terceros.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">[MOCK]</span>
                    <p className="text-slate-400 leading-normal">
                      <strong>PDF Real:</strong> No generado. Se utiliza una vista de previsualización A4 simulada idéntica.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-slate-950/50 p-3 rounded-xl border border-slate-850 text-slate-500 text-[10px] leading-normal flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Este centro está diseñado para mitigar riesgos en demos asegurando que no se ejecuten llamadas HTTP fallidas.
                </span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE DEMO CHECKLIST */}
          <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-teal-400" /> Lista de Preparación Interactiva (Demo Checklist)
            </h3>
            <p className="text-xs text-slate-400 leading-normal max-w-3xl">
              Marque el estado de cada módulo principal de cara a la simulación. El estado se almacena localmente y sirve para control de preparación de la demo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklist.map((item) => (
                <div key={item.id} className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/80 flex flex-col justify-between gap-3 hover:border-slate-800 transition-colors">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-slate-200">{item.label}</span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'Listo')}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${
                            item.status === 'Listo'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35 shadow-sm shadow-emerald-500/5'
                              : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
                          }`}
                        >
                          Listo
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'Revisar')}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${
                            item.status === 'Revisar'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/35'
                              : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
                          }`}
                        >
                          Revisar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'No mostrar')}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${
                            item.status === 'No mostrar'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
                          }`}
                        >
                          Omitir
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                      {item.notes}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-900/60 text-[10px] font-mono">
                    <span className="text-slate-500">ESTADO DEMO:</span>
                    {item.status === 'Listo' && (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        ● LISTO PARA MOSTRAR
                      </span>
                    )}
                    {item.status === 'Revisar' && (
                      <span className="text-amber-400 font-bold flex items-center gap-0.5 animate-pulse">
                        ⚠️ REQUIERE REVISAR NOTAS
                      </span>
                    )}
                    {item.status === 'No mostrar' && (
                      <span className="text-slate-500 font-medium">
                        ❌ EXCLUIDO DE LA DEMO
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DEMO CASES ROADMAP */}
          <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-teal-400" /> Mapa de Casos de Demostración (Live Sync)
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Para asegurar la coherencia de la demo, se monitorean los casos base. Cualquier cambio de estado en la gestión de OTs se refleja en tiempo real en los estados que se detallan a continuación.
            </p>

            <div className="space-y-4">
              {/* CASO PM ANUAL CANTILLANA */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 hover:border-slate-800 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-100 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      OT-26-29221
                    </span>
                    <span className="text-xs font-bold text-white">Planta Solar Cantillana (PM Anual Inversores)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">ESTADO ACTUAL EN LA COLA:</span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                      {getOtStatus('26-29221')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-normal">
                  <strong>Qué demuestra:</strong> Mantenimiento anual integral de 39 inversores Sungrow SG250. Demuestra el flujo preventivo base con soplado de gabinetes, checklist anual, fotos antes/después (Modo Limpieza), soplados y archivo virtual en SharePoint sin interferencias correctivas de trackers ni tarjetas de control.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] font-mono border-t border-slate-900/60">
                  <div>
                    <span className="text-slate-500">ROL RECOMENDADO:</span>{' '}
                    <span className="text-teal-400 font-bold">TECNICO_OM</span> (ejecución) y luego{' '}
                    <span className="text-amber-400 font-bold">JEFE_OM</span> (cierre)
                  </div>
                  <div>
                    <span className="text-slate-500">NOTAS DE SEGURIDAD:</span>{' '}
                    <span className="text-emerald-400">Totalmente consistente. Mantenido separado de consumos correctivos.</span>
                  </div>
                </div>
              </div>

              {/* CASO CORRECTIVO TARJETA CONTROL */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 hover:border-slate-800 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-100 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      OT-26-29222
                    </span>
                    <span className="text-xs font-bold text-white">Planta Solar Cantillana (Correctiva Inversor Central C2)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">ESTADO ACTUAL EN LA COLA:</span>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                      {getOtStatus('OT-26-29222')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-normal">
                  <strong>Qué demuestra:</strong> Cambio de tarjeta de control en el Inversor Central C2 por avería. Demuestra el flujo de descuento e inventario O&M (Módulo 6), impidiendo stock negativo en Cantillana y dejando el registro histórico trazable de movimientos. No involucra trackers ni afecta el PM anual.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] font-mono border-t border-slate-900/60">
                  <div>
                    <span className="text-slate-500">ROL RECOMENDADO:</span>{' '}
                    <span className="text-teal-400 font-bold">TECNICO_OM</span> (consumir) y luego{' '}
                    <span className="text-orange-400 font-bold">SUPERVISOR_TERRENO</span> (auditar)
                  </div>
                  <div>
                    <span className="text-slate-500">NOTAS DE SEGURIDAD:</span>{' '}
                    <span className="text-amber-400">Demuestra consumo de tarjeta Sungrow con traza de stock de Cantillana.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: EXECUTIVE WALKTHROUGH (9B) */}
      {activeTab === 'walkthrough' && (
        <div className="space-y-6">
          {/* TIMELINE MODE SELECTOR */}
          <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-teal-400" /> Selección de Duración de Demo (Timeline Mode)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ajuste los pasos recomendados según el tiempo de su reunión ejecutiva. Los pasos se adaptarán visualmente.
                </p>
              </div>

              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 font-mono">
                <button
                  onClick={() => setDemoTimeline('short')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    demoTimeline === 'short'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  7 Min (Corta)
                </button>
                <button
                  onClick={() => setDemoTimeline('standard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    demoTimeline === 'standard'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  12 Min (Estándar)
                </button>
                <button
                  onClick={() => setDemoTimeline('full')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    demoTimeline === 'full'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  18 Min (Completa)
                </button>
              </div>
            </div>

            {/* TIMELINE DYNAMIC INSIGHT */}
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 text-xs text-slate-400 flex items-start gap-2.5 leading-relaxed">
              <Lightbulb className="h-4.5 w-4.5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                {demoTimeline === 'short' && (
                  <span>
                    <strong>Modo Demo Corta (7 Minutos):</strong> Enfocada en la toma de decisión ejecutiva. Se omiten flujos detallados de PTW y arqueos de inventario. Se prioriza: <strong>Paso 1 (Contexto)</strong>, <strong>Paso 2 (Técnico simple)</strong>, <strong>Paso 3 (Scheduler)</strong>, <strong>Paso 5 (Vault)</strong>, <strong>Paso 8 (Report Center)</strong> y <strong>Paso 11 (Cierre)</strong>.
                  </span>
                )}
                {demoTimeline === 'standard' && (
                  <span>
                    <strong>Modo Demo Estándar (12 Minutos):</strong> Recomendado para jefes de área y coordinadores. Muestra todo el ciclo operativo de mantenimiento predictivo, incluyendo el Resource Planner, gestión de stock e integración documental. Solo se resume la parte de Sandbox Técnico.
                  </span>
                )}
                {demoTimeline === 'full' && (
                  <span>
                    <strong>Modo Demo Completa (18 Minutos):</strong> Ideal para equipos de desarrollo, QA y auditoría O&M. Se revisan los 11 pasos de forma secuencial con validación estricta de mitigación de riesgos, router virtual de SharePoint y reset manual de base de datos.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* STEP BY STEP SPLIT-SCREEN WORKFLOW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN: LIST OF STEPS */}
            <div className="bg-slate-900/30 border border-slate-800/60 p-4 rounded-2xl space-y-2 backdrop-blur-sm lg:col-span-1 max-h-[620px] overflow-y-auto custom-scrollbar">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block px-1 pb-2 border-b border-slate-850">
                PULSE UN PASO PARA VER GUÍA DETALLADA
              </span>
              <div className="space-y-1.5 pt-2">
                {walkthroughSteps.map((step) => {
                  const isHighlighted =
                    demoTimeline === 'full' ||
                    (demoTimeline === 'short' && step.inTimeline.short) ||
                    (demoTimeline === 'standard' && step.inTimeline.standard);

                  const stepState = stepStates[step.id] || 'Listo';

                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveStep(step.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-3 ${
                        activeStep === step.id
                          ? 'bg-teal-500/10 border-teal-500/40 text-white'
                          : isHighlighted
                          ? 'bg-slate-950/40 border-slate-850/80 hover:bg-slate-900/60 text-slate-300'
                          : 'bg-slate-950/20 border-slate-900/60 text-slate-500'
                      }`}
                    >
                      <span className={`text-[11px] font-mono font-bold h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                        activeStep === step.id
                          ? 'bg-teal-400 text-slate-950 font-black'
                          : isHighlighted
                          ? 'bg-slate-850 text-slate-300'
                          : 'bg-slate-900 text-slate-600'
                      }`}>
                        {step.id}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-1">
                          <span className="text-xs font-bold truncate block">{step.title}</span>
                          <span className="text-[9px] font-mono text-slate-500 shrink-0">{step.duration}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                          <span className={activeStep === step.id ? 'text-teal-400' : isHighlighted ? 'text-slate-400' : 'text-slate-600'}>
                            {step.roles[0].replace('_OM', '')}
                          </span>
                          <span className={
                            stepState === 'Listo' ? 'text-emerald-500' :
                            stepState === 'Revisar' ? 'text-amber-500' : 'text-slate-500'
                          }>
                            {stepState === 'Listo' ? '● Listo' : stepState === 'Revisar' ? '⚠️ Check' : '❌ Omitido'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: DETAILED VIEW OF ACTIVE STEP */}
            {(() => {
              const step = walkthroughSteps.find(s => s.id === activeStep);
              if (!step) return null;

              const stepState = stepStates[step.id] || 'Listo';
              const isRecommended =
                (demoTimeline === 'short' && step.inTimeline.short) ||
                (demoTimeline === 'standard' && step.inTimeline.standard) ||
                demoTimeline === 'full';

              return (
                <div className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl flex flex-col justify-between backdrop-blur-sm lg:col-span-2 space-y-6">
                  {/* STEP TITLE HEADER */}
                  <div className="space-y-2 border-b border-slate-850 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-teal-500 text-slate-950 font-black text-xs font-mono h-6 w-6 rounded-full flex items-center justify-center">
                          {step.id}
                        </span>
                        <h4 className="text-base font-black text-white leading-tight">
                          {step.title}
                        </h4>
                      </div>

                      {/* STEP STATE TOGGLE */}
                      <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
                        <button
                          onClick={() => handleUpdateStepState(step.id, 'Listo')}
                          className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                            stepState === 'Listo' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          Listo
                        </button>
                        <button
                          onClick={() => handleUpdateStepState(step.id, 'Revisar')}
                          className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                            stepState === 'Revisar' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          Revisar
                        </button>
                        <button
                          onClick={() => handleUpdateStepState(step.id, 'Omitir')}
                          className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                            stepState === 'Omitir' ? 'bg-slate-800 text-slate-400' : 'text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          Omitir
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-teal-400" />
                        <span>DURACIÓN SUGERIDA: <strong>{step.duration}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-teal-400" />
                        <span>ROLES RECOMENDADOS: <strong className="text-teal-400">{step.roles.join(', ')}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">TIMELINE:</span>
                        {isRecommended ? (
                          <span className="text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                            RECOMENDADO EN ESTA DEMO
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                            SE PUEDE OMITIR / RESUMIR
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* WALKTHROUGH ACTION AND DEMO STEPS */}
                  <div className="space-y-4 flex-1">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider font-bold">
                        QUÉ MOSTRAR EN PANTALLA:
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {step.show}
                      </p>
                    </div>

                    {/* KEY PUNCHLINE */}
                    <div className="bg-slate-900 border-l-4 border-teal-500 p-4 rounded-r-xl">
                      <span className="text-[9px] font-mono text-teal-400 block uppercase tracking-widest font-black mb-1">
                        FRase clave del presentador
                      </span>
                      <p className="text-xs font-medium text-teal-300 italic leading-relaxed">
                        {step.keyMessage}
                      </p>
                    </div>

                    {/* TIPS SPECIFIC */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider font-bold">
                        TIPS DE NAVEGACIÓN PARA ESTE PASO:
                      </span>
                      <ul className="space-y-1.5">
                        {step.tips.map((tip, idx) => (
                          <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                            <span className="text-teal-400 shrink-0">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* NAVIGATION HELPERS */}
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/60 space-y-3">
                    {mockNavAlert && (
                      <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3 text-xs text-teal-300 flex justify-between items-start animate-fade-in">
                        <div>
                          <span className="font-bold font-mono block text-[9px] text-teal-400 uppercase mb-0.5">Simulación de Navegación</span>
                          <p className="font-mono">{mockNavAlert}</p>
                        </div>
                        <button onClick={() => setMockNavAlert(null)} className="text-teal-500 hover:text-white font-bold ml-2 text-base leading-none">×</button>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                      <span className="text-slate-400">
                        Use la barra lateral del menú principal para navegar al módulo respectivo.
                      </span>
                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => {
                            const viewsMap: Record<number, string> = {
                              1: "Home Jefatura O&M",
                              2: "Vista Terreno",
                              3: "ORBI Workspace (Scheduler IA)",
                              4: "ORBI Workspace (Resource Planner)",
                              5: "ORBI OT Center (Evidence Vault)",
                              6: "ORBI OT Center (PTW Center)",
                              7: "Repuestos & Herramientas",
                              8: "ORBI OT Center (Report Center)",
                              9: "ORBI OT Center (SharePoint Router)",
                              10: "Release & Demo Center",
                              11: "Release & Demo Center"
                            };
                            const vName = viewsMap[step.id] || "Home Jefatura O&M";
                            setMockNavAlert(`Redirección en demo real para el rol [${step.roles.join(" / ")}]: Seleccione el botón "[${vName}]" en el menú lateral izquierdo para ver este paso en acción.`);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-teal-400 font-bold border border-teal-500/20 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Ir al módulo
                        </button>
                        <button
                          disabled={step.id === 1}
                          onClick={() => { setMockNavAlert(null); setActiveStep(prev => prev - 1); }}
                          className="px-3 py-1.5 bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg disabled:opacity-30"
                        >
                          Anterior
                        </button>
                        <button
                          disabled={step.id === 11}
                          onClick={() => { setMockNavAlert(null); setActiveStep(prev => prev + 1); }}
                          className="px-3 py-1.5 bg-teal-500 text-slate-950 font-bold rounded-lg disabled:opacity-30"
                        >
                          Siguiente Paso
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ADDED SECTIONS: PRESENTER TIPS, KEY PHRASES & FAQ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* COLUMN 1: TIPS GENERALES DEL PRESENTADOR */}
            <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-sm">
              <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-teal-400" /> Tips del Presentador (O&M Best Practices)
              </h3>
              <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>No aburra con la configuración técnica:</strong> Los directores de O&M quieren ver flujos documentales rápidos y cero burocracia para el técnico.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Roles separados:</strong> No muestre pantallas administrativas mientras explica el flujo de terreno. Enfatice la desconexión total del técnico de la burocracia global.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Garantice el Sandbox:</strong> Explique desde el primer minuto que no hay SharePoint real conectado para que no se preocupen por la red en la demo.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Muestre el problema primero:</strong> Parta mencionando el desorden de planillas Excel dispersas para que la solución de ORBI tenga el doble de impacto.
                  </p>
                </div>
              </div>
            </div>

            {/* COLUMN 2: FRASES CLAVE (PUNCHLINES) */}
            <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-sm">
              <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-teal-400" /> Frases Clave de O&M (Punchlines)
              </h3>
              <div className="space-y-3.5">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 italic text-xs text-slate-300">
                  "ORBI no reemplaza la operación; la ordena antes de que los reportes toquen el cliente final."
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 italic text-xs text-slate-300">
                  "El técnico ejecuta, el sistema organiza. Removemos toda burocracia visual del celular del operario."
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 italic text-xs text-slate-300">
                  "Cada evidencia fotográfica queda rigidizada a una OT, un activo específico y una firma aprobada."
                </div>
              </div>
            </div>

            {/* COLUMN 3: FAQ PREGUNTAS ESPERADAS */}
            <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-sm">
              <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-teal-400" /> Preguntas Esperadas (Demo FAQ)
              </h3>
              <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-slate-200 leading-snug">¿Se conecta a Softwrench real?</h5>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Todavía no. Esta versión v0.X utiliza un motor de datos de demostración local reactivo para agilizar la navegación.
                  </p>
                </div>
                <div className="space-y-1 pt-1.5 border-t border-slate-850">
                  <h5 className="text-xs font-bold text-slate-200 leading-snug">¿Se conecta a SharePoint corporativo?</h5>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    No. Usamos el SharePoint Router Virtual local para preparar, validar y estructurar la nomenclatura de carpetas antes de habilitar APIs.
                  </p>
                </div>
                <div className="space-y-1 pt-1.5 border-t border-slate-850">
                  <h5 className="text-xs font-bold text-slate-200 leading-snug">¿El técnico ve todo este panel?</h5>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    No. El técnico de terreno tiene el rol estrictamente limitado a la agenda simplificada. Este panel es exclusivo de la plana supervisora.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: EXECUTIVE SUMMARY CARD (9C) */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* TOP CONTROLS */}
          <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 backdrop-blur-sm">
            <div>
              <span className="text-[9px] font-mono font-bold tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full uppercase">
                Módulo 9C — ORBI Executive Summary Card
              </span>
              <h3 className="text-sm font-extrabold text-white tracking-tight mt-1.5 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-teal-400" /> Tarjeta Ejecutiva Resumida
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Utilice esta sección para presentaciones ultrarrápidas de menos de 2 minutos a la plana gerencial y directiva.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsShortVersion(!isShortVersion)}
                className={`px-4 py-2 font-mono text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 flex-1 sm:flex-initial justify-center ${
                  isShortVersion
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/10'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-800'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                {isShortVersion ? 'Ver versión completa' : 'Ver versión de 30 segundos'}
              </button>

              <button
                onClick={handleCopySummary}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-teal-400 font-mono text-xs font-bold rounded-xl border border-teal-500/20 transition-all flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
              >
                {copiedSummary ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> ¡Copiado!
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" /> Copiar Resumen
                  </>
                )}
              </button>
            </div>
          </div>

          {isShortVersion ? (
            /* 30 SECONDS ELEVATOR PITCH VERSION */
            <div className="bg-gradient-to-br from-slate-900/40 to-slate-950/40 border border-teal-500/20 p-8 rounded-2xl space-y-6 backdrop-blur-sm shadow-xl shadow-teal-950/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/25 px-2 py-0.5 rounded uppercase">
                    Elevator Pitch v0.X — 30 Segundos
                  </span>
                  <h4 className="text-xl font-bold text-white tracking-tight font-sans">
                    ORBI OT Center: Unificación O&amp;M Extremo a Extremo
                  </h4>
                </div>
                <span className="text-xs font-black font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded">
                  FROZEN
                </span>
              </div>

              {/* CORE QUOTE */}
              <div className="bg-slate-950/50 border-l-4 border-teal-400 p-4 rounded-r-xl">
                <p className="text-sm font-medium italic text-slate-200">
                  “El técnico ejecuta sin burocracia, el sistema organiza los respaldos en SharePoint y el supervisor controla todo el flujo documental desde semáforos en tiempo real.”
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/60">
                  <span className="text-[10px] font-mono text-teal-400 block uppercase tracking-wider mb-1">El Dolor</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Planillas Excel desincronizadas, fotos perdidas en chats de WhatsApp, permisos de trabajo en papel físico y horas hombre redactando reportes manuales.
                  </p>
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/60">
                  <span className="text-[10px] font-mono text-teal-400 block uppercase tracking-wider mb-1">La Solución</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Un solo clic para compilar el Report Pack completo (Checklist + Firmas + AST + Spares) y archivarlo de manera estructurada en un router virtual de SharePoint.
                  </p>
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/60">
                  <span className="text-[10px] font-mono text-teal-400 block uppercase tracking-wider mb-1">Casos de Éxito</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-slate-200 font-mono">OT-26-29221</strong> (PM Anual Inversores Sungrow) y <strong className="text-slate-200 font-mono">OT-26-29222</strong> (Correctiva Inversor Central C2 Cantillana con consumo de repuestos).
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>VERSIÓN: STABLE EXECUTIVE DEMO CANDIDATE</span>
                <span>SANDBOX COMPILADO Y VALIDADO</span>
              </div>
            </div>
          ) : (
            /* COMPREHENSIVE BENTO GRID VERSION */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              
              {/* CARD 1: GENERAL OBJECTIVE & CORE MESSAGE */}
              <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-teal-400" /> Objetivo General &amp; Filosofía
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>ORBI OT Center</strong> ordena el ciclo completo de órdenes de trabajo O&amp;M, conectando de forma estricta la planificación, ejecución en terreno, evidencias, permisos, inventario, reportes y el cierre documental.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/80 mt-4 space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">MENSAJE PRINCIPAL DE LA DEMO</span>
                  <p className="text-xs font-extrabold text-teal-300 italic leading-snug">
                    “El técnico ejecuta, el sistema organiza y el supervisor controla.”
                  </p>
                </div>
              </div>

              {/* CARD 2: PAIN VS ORBI SOLUTION */}
              <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-3 backdrop-blur-sm">
                <h4 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Dolores que Resuelve
                </h4>
                
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-mono text-[10px] shrink-0 mt-0.5">✕</span>
                    <span>Órdenes de trabajo (OT) desincronizadas en múltiples sistemas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-mono text-[10px] shrink-0 mt-0.5">✕</span>
                    <span>Evidencias fotográficas desordenadas o perdidas en WhatsApp.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-mono text-[10px] shrink-0 mt-0.5">✕</span>
                    <span>Permisos de trabajo (PTW) firmados fuera del flujo de la OT.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-mono text-[10px] shrink-0 mt-0.5">✕</span>
                    <span>Inventario de planta en planillas Excel vulnerables y desactualizadas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-mono text-[10px] shrink-0 mt-0.5">✕</span>
                    <span>Confección manual de reportes de terreno que quita tiempo técnico.</span>
                  </li>
                </ul>
              </div>

              {/* CARD 3: INTEGRATED MODULES */}
              <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-3 backdrop-blur-sm">
                <h4 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-teal-400" /> Módulos Integrados v0.X
                </h4>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> Vista Técnico</div>
                  <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> OT Core</div>
                  <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> Evidence Vault</div>
                  <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> PTW Center</div>
                  <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> Inventario O&amp;M</div>
                  <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> SharePoint Router</div>
                  <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> Scheduler IA</div>
                  <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> Resource Planner</div>
                  <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> Report Center</div>
                  <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> Release 9A &amp; 9B</div>
                </div>
              </div>

              {/* CARD 4: MASTER DEMO CASES */}
              <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-sm lg:col-span-2">
                <h4 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-teal-400" /> Casos Maestros de la Demo
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
                      CASO PREVENTIVO (OT-26-29221)
                    </span>
                    <h5 className="text-xs font-bold text-slate-200">PM Anual de Inversores — Cantillana</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Mantenimiento de 39 inversores Sungrow SG250. Demuestra el checklist de inspección, carga cronológica en el modo limpieza de fotos antes/durante/después, y almacenamiento automático sin repuestos correctivos.
                    </p>
                  </div>

                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                      CASO CORRECTIVO (OT-26-29222)
                    </span>
                    <h5 className="text-xs font-bold text-slate-200">Correctiva Inversor Central C2</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Reemplazo de tarjeta de control o fusible de potencia. Demuestra el consumo de materiales de inventario segmentado por planta, el bloqueo de saldos negativos y el historial de trazabilidad sin interferencias de trackers.
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 5: ROLES-BASED BENEFITS */}
              <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-3 backdrop-blur-sm">
                <h4 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-teal-400" /> Beneficios por Rol
                </h4>

                <div className="space-y-3 text-[11px]">
                  <div>
                    <span className="font-mono text-teal-400 block font-bold">PARA EL TÉCNICO EN TERRENO:</span>
                    <p className="text-slate-400 leading-normal">
                      Vista extremadamente simple sin administración, acceso exclusivo a su agenda diaria, flujo de carga rápida de evidencias y comentarios claros si es devuelta para corrección.
                    </p>
                  </div>
                  <div className="border-t border-slate-850/60 pt-2">
                    <span className="font-mono text-teal-400 block font-bold">PARA EL SUPERVISOR:</span>
                    <p className="text-slate-400 leading-normal">
                      Asignación desde el Scheduler IA con inbox de triage, visualización de Resource Planner y cuadrillas, control estricto de PTW, inventario y aprobación de evidencias.
                    </p>
                  </div>
                  <div className="border-t border-slate-850/60 pt-2">
                    <span className="font-mono text-teal-400 block font-bold">PARA LA JEFATURA DE O&amp;M:</span>
                    <p className="text-slate-400 leading-normal">
                      Cierre de reportes auditados en un solo clic directo a SharePoint virtual, eliminando el 100% de la carga de redacción manual de reportes para el cliente final.
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 6: SANDBOX LIMITS */}
              <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-sm lg:col-span-3">
                <h4 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-500" /> Límites de Sandbox &amp; Cumplimiento
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Para asegurar una presentación impecable sin colisiones de red, errores de APIs de terceros o fugas de claves, la versión <strong>ORBI OT Center v0.X</strong> opera bajo las siguientes restricciones de simulación segura:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">SOFTWRENCH REAL</span>
                    <span className="text-[11px] text-slate-400 block mt-1 leading-normal">No conectado. Se simula mediante triggers y transiciones del motor local reactivo de OTs.</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">SHAREPOINT DE LA JEFATURA</span>
                    <span className="text-[11px] text-slate-400 block mt-1 leading-normal">No conectado. Se simula a través del SharePoint Router Virtual local en localStorage.</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">GOOGLE CALENDAR / MAPS</span>
                    <span className="text-[11px] text-slate-400 block mt-1 leading-normal">Simulado de forma local. No requiere de APIs externas ni transmisión de ubicaciones GPS.</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">PDF PACK Y EXPORT EXCEL</span>
                    <span className="text-[11px] text-slate-400 block mt-1 leading-normal">Los PDFs se previsualizan de forma interactiva en A4 de alta fidelidad. Exportador JSON sanitizado.</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* RIESGOS CONTROLADOS COMPLIANCE LIST */}
      <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-sm">
        <h3 className="text-xs font-bold text-white font-mono tracking-wider uppercase border-b border-slate-850 pb-2 flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-teal-400" /> Checklist de Mitigación de Riesgos O&M
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-200 block">LocalStorage aislado</span>
              <span className="text-[11px] text-slate-400 mt-1 block leading-normal">
                No altera las configuraciones de API keys del usuario en AI Studio. Todo se ejecuta en el navegador del cliente de forma aislada.
              </span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-200 block">Sin credenciales reales</span>
              <span className="text-[11px] text-slate-400 mt-1 block leading-normal">
                No hay tokens OAuth, llaves JWT, ni secretos corporativos embebidos en el código ni expuestos a la consola.
              </span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-200 block">Dossiers estructurados</span>
              <span className="text-[11px] text-slate-400 mt-1 block leading-normal">
                El compilador virtual genera estructuras de PDF consistentes respetando los formatos exigidos sin error de I/O de disco.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL / BOTTOM SLIDEOUT FOR EXPORT PREVIEW */}
      {showJsonSnapshot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white font-mono">ORBI Demo Snapshot — Exported JSON</h3>
              </div>
              <button
                onClick={() => setShowJsonSnapshot(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-850 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 bg-slate-950 rounded-xl p-4 border border-slate-850 custom-scrollbar">
              <pre className="text-[11px] font-mono text-teal-400 leading-normal whitespace-pre-wrap">
                {JSON.stringify(getSnapshotPayload(), null, 2)}
              </pre>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowJsonSnapshot(false)}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-mono text-xs font-bold rounded-xl border border-slate-750 transition-all"
              >
                Cerrar Preview
              </button>
              <button
                onClick={handleCopyJson}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
              >
                {copyConfirmed ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> ¡Copiado!
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" /> Copiar al Portapapeles
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
