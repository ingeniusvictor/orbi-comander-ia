/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MASTER_PLANTS_DATA } from './masterPlantsData';
import { getCanonicalPlantId, getCanonicalPlantName, getPlantMappingEntry, getPlantRecordScope, validateOperationalPlantReferences, generatePlantIdentityIntegrityReport } from './plantIdentityMap';
import {
  INITIAL_ORGANIGRAMA as INITIAL_ORGANIGRAMA_76,
  loadOrganigramaFromStorage,
  saveOrganigramaToStorage
} from './organigramaData';

import {
  RoleConfig,
  OrganigramaNode,
  Planta,
  OT,
  OTEvidencia,
  OTEvidencePackItem,
  HSEFinding,
  PlanPreventivo,
  Vehiculo,
  RecursoPersona,
  RoleType,
  Repuesto,
  Herramienta,
  AuditLogEvent,
  Escalation,
  PTW,
  PTWEstado,
  OMInventoryItem,
  OMInventoryMovement
} from '../types';

// Configuración de Roles y Permisos del ecosistema ORBI O&M Command Center IA
export const ROLES_CONFIG: Record<string, RoleConfig> = {
  SUPER_ADMIN_ORBI: {
    id: 'SUPER_ADMIN_ORBI',
    title: 'Super Admin ORBI',
    scope: 'Acceso total y configuración global del sistema',
    badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    suggestedView: 'Home',
    permissions: ['*'],
  },
  GERENCIA: {
    id: 'GERENCIA',
    title: 'Gerencia General / Operaciones',
    scope: 'Visión estratégica, KPIs consolidados y reportes ejecutivos para directorio',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    suggestedView: 'Home',
    permissions: ['view_all_kpis', 'export_reports', 'view_organigrama', 'view_bi'],
  },
  JEFE_OM: {
    id: 'JEFE_OM',
    title: 'Jefe O&M',
    scope: 'Controla el flujo completo de O&M, prioriza actividades críticas, destraba recursos, aprueba cierres y responde a gerencia',
    badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    suggestedView: 'Home',
    permissions: ['manage_ot', 'create_ot', 'reopen_ot', 'approve_closures', 'escalate_ot', 'view_all_kpis', 'edit_organigrama'],
  },
  COORDINADOR_OM: {
    id: 'COORDINADOR_OM',
    title: 'Coordinador O&M',
    scope: 'Crea OTs, asigna coordinadores/supervisores, programa actividades, coordina recursos, controla fechas y valida avance',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    suggestedView: 'OTs',
    permissions: ['create_ot', 'edit_ot', 'assign_supervisor', 'schedule_ot', 'validate_closure', 'view_planification'],
  },
  SUPERVISOR_TERRENO: {
    id: 'SUPERVISOR_TERRENO',
    title: 'Supervisor Terreno',
    scope: 'Asigna ejecución, confirma disponibilidad, reporta avances, valida evidencias en planta, reporta bloqueos y solicita repuestos',
    badgeColor: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    suggestedView: 'OTs',
    permissions: ['assign_technician', 'update_ot_progress', 'add_evidence', 'request_spares', 'report_blockade', 'propose_closure'],
  },
  INGENIERO_OM: {
    id: 'INGENIERO_OM',
    title: 'Ingeniero de O&M',
    scope: 'Análisis técnico, soporte en terreno, diagnóstico de fallas, medición de curvas I-V y checklist técnico',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    suggestedView: 'Terreno',
    permissions: ['view_assigned_ot', 'update_ot_status', 'add_evidence', 'create_finding', 'checklist'],
  },
  TECNICO_OM: {
    id: 'TECNICO_OM',
    title: 'Técnico de Terreno',
    scope: 'Ejecución de actividades, llenado de checklist, reporte de horas hombre y observaciones',
    badgeColor: 'bg-teal-500/20 text-teal-400 border border-teal-500/30',
    suggestedView: 'Terreno',
    permissions: ['view_assigned_ot', 'update_ot_status', 'add_evidence', 'checklist'],
  },
  HSE: {
    id: 'HSE',
    title: 'Especialista HSE (Bridge)',
    scope: 'Gestión de seguridad, revisión de incidentes, AST, permisos de trabajo y bloqueo de actividades',
    badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    suggestedView: 'HSE',
    permissions: ['manage_hse', 'approve_ast', 'view_hse_findings', 'stop_work'],
  },
  CALIDAD: {
    id: 'CALIDAD',
    title: 'Inspector de Calidad (Bridge)',
    scope: 'Control de calidad, hallazgos de calidad, pruebas de comisionamiento y aceptación de cierres',
    badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    suggestedView: 'HSE',
    permissions: ['manage_quality', 'approve_ot_quality', 'view_quality_findings'],
  },
  PLANIFICACION: {
    id: 'PLANIFICACION',
    title: 'Planificador de O&M',
    scope: 'Creación de planes preventivos, asignación de calendarios en Workspace y control de desviaciones',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30',
    suggestedView: 'Planificación',
    permissions: ['manage_planification', 'create_plan', 'view_hh_reports'],
  },
  COMISIONAMIENTO: {
    id: 'COMISIONAMIENTO',
    title: 'Ingeniero Comisionamiento',
    scope: 'Pruebas de puesta en marcha, energizaciones y traspasos técnicos a O&M',
    badgeColor: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    suggestedView: 'OTs',
    permissions: ['view_comisionamiento', 'create_comisionamiento_ot'],
  },
  LECTURA_CLIENTE: {
    id: 'LECTURA_CLIENTE',
    title: 'Cliente (Solo Lectura)',
    scope: 'Acceso a reportes de disponibilidad, avance de OT y evidencias de su planta',
    badgeColor: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    suggestedView: 'Home',
    permissions: ['read_only_plants', 'view_client_reports'],
  },
};

// 1. Organigrama Base (DB_ORGANIGRAMA) - Estructura Jerárquica O&M
export const INITIAL_ORGANIGRAMA: OrganigramaNode[] = INITIAL_ORGANIGRAMA_76 as OrganigramaNode[];

// 2. Base de Plantas (DB_PLANTAS)
export const INITIAL_PLANTAS: Planta[] = MASTER_PLANTS_DATA;

// 3. Base de Órdenes de Trabajo (DB_OTS)
export const INITIAL_OTS: OT[] = [
  {
    codigo: 'OT-2026-001',
    plantaId: 'P01',
    plantaNombre: 'Atacama Solar',
    legacyPlantId: 'P01',
    activo: 'Inversor Central INV-04',
    tipo: 'Correctiva',
    prioridad: 'Crítica',
    criticidad: 'Crítica',
    responsable: 'Cristián Barraza',
    coordinador: 'Rodolfo Garcés',
    supervisor: 'Alejandro Rojas',
    fechaInicio: '2026-07-04',
    fechaLimite: '2026-07-07',
    estado: 'En terreno',
    avance: 65,
    hhEstimadas: 16,
    hhReales: 14,
    evidencia: {
      url: 'image_thermal_scan.jpg',
      descripcion: 'Medición termográfica y revisión de fusibles quemados en barra DC.',
      fecha: '2026-07-05',
      nombreArchivo: 'termografia_inv_04.jpg',
    },
    evidencias: [
      {
        url: 'image_thermal_scan.jpg',
        descripcion: 'Medición termográfica y revisión de fusibles quemados en barra DC.',
        fecha: '2026-07-05',
        nombreArchivo: 'termografia_inv_04.jpg',
      }
    ],
    observaciones: 'Se detecta punto caliente en barra principal DC. Se programa reemplazo de fusibles y reapriete de conexiones con torquímetro.',
    riesgoDisponibilidad: 'Riesgo crítico',
    origen: 'Centro de Control',
    impacto: 'Crítico',
    repuestos: ['Fusibles 200A', 'Soporte barra de cobre'],
    historialCambios: [
      { fecha: '2026-07-04 08:30', usuario: 'Rodolfo Garcés', accion: 'Creación', detalle: 'OT creada de emergencia por evento en Centro de Control.' },
      { fecha: '2026-07-04 09:15', usuario: 'Alejandro Rojas', accion: 'Asignación', detalle: 'Asignado a Cristián Barraza para atención prioritaria.' }
    ],
    estadoCierre: 'Pendiente',
  },
  {
    codigo: 'OT-2026-002',
    plantaId: 'P02',
    plantaNombre: 'Luz del Norte',
    legacyPlantId: 'P02',
    activo: 'Estación de Medición Met Mast A',
    tipo: 'Preventiva',
    prioridad: 'Alta',
    criticidad: 'Alta',
    responsable: 'Cristián Barraza',
    coordinador: 'Rodolfo Garcés',
    supervisor: 'Alejandro Rojas',
    fechaInicio: '2026-07-02',
    fechaLimite: '2026-07-10',
    estado: 'Asignada',
    avance: 0,
    hhEstimadas: 8,
    hhReales: 0,
    evidencia: null,
    observaciones: 'Calibración de piranómetros y anemómetros semestral. Requiere camión pluma chico para sensores superiores.',
    riesgoDisponibilidad: 'No aplica',
    origen: 'Preventivo programado',
    impacto: 'Bajo',
    repuestos: [],
    historialCambios: [
      { fecha: '2026-07-01 10:00', usuario: 'Rodolfo Garcés', accion: 'Planificación', detalle: 'Programado como parte del plan preventivo de Julio.' }
    ],
    estadoCierre: 'Pendiente',
  },
  {
    codigo: 'OT-2026-003',
    plantaId: 'P05',
    plantaNombre: 'Santiago Solar',
    legacyPlantId: 'P05',
    activo: 'Transformador Principal TRAFO-01',
    tipo: 'Correctiva',
    prioridad: 'Crítica',
    criticidad: 'Crítica',
    responsable: 'Eduardo Carvallo',
    coordinador: 'Rodolfo Garcés',
    supervisor: 'Mauricio Valdés',
    fechaInicio: '2026-06-29',
    fechaLimite: '2026-07-05',
    estado: 'En espera de repuesto',
    avance: 40,
    hhEstimadas: 48,
    hhReales: 36,
    evidencia: {
      url: 'gasket_leak_leakage.jpg',
      descripcion: 'Fuga de aceite en empaquetadura de la cuba del Trafo.',
      fecha: '2026-06-30',
      nombreArchivo: 'fuga_trafo_01.jpg',
    },
    observaciones: 'Trafo desconectado. Esperando arribo de kit de empaquetaduras de repuesto importado. Pérdida estimada de 115 MW de inyección.',
    riesgoDisponibilidad: 'Riesgo crítico',
    origen: 'Supervisor Terreno',
    impacto: 'Crítico',
    repuestos: ['Kit empaquetaduras Trafo 115MW'],
    historialCambios: [
      { fecha: '2026-06-29 14:20', usuario: 'Mauricio Valdés', accion: 'Reporte Terreno', detalle: 'Fuga severa detectada en inspección visual.' },
      { fecha: '2026-06-30 11:00', usuario: 'Rodolfo Garcés', accion: 'Bloqueo Logístico', detalle: 'Cambio de estado a espera de repuesto importado.' }
    ],
    estadoCierre: 'Pendiente',
  },
  {
    codigo: 'OT-2026-004',
    plantaId: 'P04',
    plantaNombre: 'Pelícano Solar',
    legacyPlantId: 'P04',
    activo: 'Subestación de Poder / Celdas Media Tensión',
    tipo: 'HSE',
    prioridad: 'Alta',
    criticidad: 'Alta',
    responsable: 'Eduardo Carvallo',
    coordinador: 'Rodolfo Garcés',
    supervisor: 'Mauricio Valdés',
    fechaInicio: '2026-07-01',
    fechaLimite: '2026-07-08',
    estado: 'En revisión',
    avance: 90,
    hhEstimadas: 6,
    hhReales: 5,
    evidencia: {
      url: 'extintores_co2.jpg',
      descripcion: 'Instalación de señaléticas de alta tensión y extintores CO2 recargados.',
      fecha: '2026-07-05',
      nombreArchivo: 'senaletica_subestacion.jpg',
    },
    observaciones: 'Señaléticas normalizadas según DS 594. Revisión por prevencionista de riesgos en curso.',
    riesgoDisponibilidad: 'No aplica',
    origen: 'HSE',
    impacto: 'Bajo',
    repuestos: [],
    historialCambios: [
      { fecha: '2026-07-01 09:00', usuario: 'Sofía Mondaca', accion: 'Inspección HSE', detalle: 'Levantamiento de hallazgo F-002. OT emitida para resolver falta de señalética.' }
    ],
    estadoCierre: 'Pendiente',
  },
  {
    codigo: 'OT-2026-005',
    plantaId: 'P03',
    plantaNombre: 'Quillagua Solar',
    legacyPlantId: 'P03',
    activo: 'Seguidores Solar Tracker S-42',
    tipo: 'Preventiva',
    prioridad: 'Media',
    criticidad: 'Media',
    responsable: 'Cristián Barraza',
    coordinador: 'Rodolfo Garcés',
    supervisor: 'Alejandro Rojas',
    fechaInicio: '2026-07-03',
    fechaLimite: '2026-07-09',
    estado: 'En preparación',
    avance: 15,
    hhEstimadas: 12,
    hhReales: 2,
    evidencia: null,
    observaciones: 'Lubricación periódica de rodamientos y torque de abrazaderas de torsión.',
    riesgoDisponibilidad: 'En observación',
    origen: 'Preventivo programado',
    impacto: 'Medio',
    repuestos: ['Grasa de alta temperatura', 'Pernos de repuesto tracker'],
    historialCambios: [],
    estadoCierre: 'Pendiente',
  },
  {
    codigo: 'OT-2026-006',
    plantaId: 'P07',
    plantaNombre: 'Maule Solar',
    legacyPlantId: 'P07',
    activo: 'Inversores de String INV-12 a INV-15',
    tipo: 'Calidad',
    prioridad: 'Media',
    criticidad: 'Media',
    responsable: 'Daniel Godoy',
    coordinador: 'Rodolfo Garcés',
    supervisor: 'Francisco Jara',
    fechaInicio: '2026-07-02',
    fechaLimite: '2026-07-06',
    estado: 'Finalizada',
    avance: 100,
    hhEstimadas: 16,
    hhReales: 18,
    evidencia: {
      url: 'curva_iv_reporte.jpg',
      descripcion: 'Medición de Curvas I-V y pruebas de aislamiento de strings.',
      fecha: '2026-07-04',
      nombreArchivo: 'curvas_iv_inversores_maule.pdf',
    },
    observaciones: 'Todas las curvas dentro del 98% de tolerancia de diseño. Traspasado a Calidad para aprobación de cierre definitivo.',
    riesgoDisponibilidad: 'No aplica',
    origen: 'Calidad',
    impacto: 'Medio',
    repuestos: [],
    historialCambios: [
      { fecha: '2026-07-02 08:30', usuario: 'Patricia Cáceres', accion: 'Calidad QA', detalle: 'Asignado para verificar PR por bajo rendimiento sospechoso.' }
    ],
    estadoCierre: 'Pendiente',
  },
  {
    codigo: 'OT-2026-007',
    plantaId: 'P06',
    plantaNombre: 'El Totihue Solar',
    legacyPlantId: 'P06',
    activo: 'Reconectador / Celda de Protección 13.2 kV',
    tipo: 'Correctiva',
    prioridad: 'Alta',
    criticidad: 'Alta',
    responsable: 'Eduardo Carvallo',
    coordinador: 'Rodolfo Garcés',
    supervisor: 'Mauricio Valdés',
    fechaInicio: '2026-06-25',
    fechaLimite: '2026-07-03',
    estado: 'Nueva',
    avance: 0,
    hhEstimadas: 10,
    hhReales: 0,
    evidencia: null,
    observaciones: 'Falla en relé de protección por sobrecorriente. La planta se encuentra desconectada de la red por bloqueo de CGE.',
    riesgoDisponibilidad: 'Riesgo alto',
    origen: 'Centro de Control',
    impacto: 'Alto',
    repuestos: ['Relé de protección SEL-751'],
    historialCambios: [],
    estadoCierre: 'Pendiente',
  },
  {
    codigo: 'OT-2026-008',
    plantaId: 'P09',
    plantaNombre: 'Biobío del Sol',
    legacyPlantId: 'P09',
    activo: 'Inversor INV-01 y Transformador TRAFO-01',
    tipo: 'Comisionamiento',
    prioridad: 'Media',
    criticidad: 'Media',
    responsable: 'Daniel Godoy',
    coordinador: 'Rodolfo Garcés',
    supervisor: 'Francisco Jara',
    fechaInicio: '2026-06-20',
    fechaLimite: '2026-06-30',
    estado: 'Cerrada',
    avance: 100,
    hhEstimadas: 24,
    hhReales: 22,
    evidencia: {
      url: 'puesta_marcha_biobio.jpg',
      descripcion: 'Protocolo de energización y primer sincronismo firmado con el Coordinador Eléctrico Nacional.',
      fecha: '2026-06-28',
      nombreArchivo: 'acta_sincronismo_firmada.pdf',
    },
    observaciones: 'Pruebas concluidas de manera exitosa. Planta operando comercialmente sin desvíos.',
    riesgoDisponibilidad: 'No aplica',
    origen: 'Preventivo programado',
    impacto: 'Medio',
    repuestos: [],
    historialCambios: [],
    estadoCierre: 'Cerrado Total',
  },
  {
    codigo: '26-29221',
    plantaId: 'ORBI-PV-058',
    plantaNombre: 'Cantillana',
    legacyPlantId: 'P10',
    activo: 'Inversores INV-01 a INV-39',
    tipo: 'Preventiva',
    prioridad: 'Media',
    criticidad: 'Media',
    responsable: 'Víctor León',
    coordinador: 'Rodolfo Garcés',
    supervisor: 'Mauricio Valdés',
    fechaInicio: '2026-07-05',
    fechaLimite: '2026-07-15',
    estado: 'En ejecución',
    avance: 60,
    hhEstimadas: 40,
    hhReales: 24,
    observaciones: 'Mantenimiento anual de inversores INV-01 a INV-39 en Cantillana. Limpieza de polvo, reapriete, torque e inspección de filtros.',
    riesgoDisponibilidad: 'No aplica',
    origen: 'Preventivo programado',
    impacto: 'Medio',
    repuestos: ['Filtros de aire INV SMA', 'Fusibles gPV 15A'],
    historialCambios: [
      { fecha: '2026-07-05 08:00', usuario: 'Rodolfo Garcés', accion: 'Planificación', detalle: 'Programado según calendario anual de PM.' }
    ],
    estadoCierre: 'Pendiente',
    requiereChecklist: true,
    requiereEvidencia: true,
    checklistExecution: [
      { item: 'Limpieza e inspección de gabinetes', completado: true },
      { item: 'Revisión y reemplazo de filtros de aire', completado: true },
      { item: 'Termografía de borneras AC/DC', completado: true },
      { item: 'Torque de conexiones eléctricas', completado: false },
      { item: 'Prueba de parada de emergencia', completado: false }
    ],
    evidencePack: [
      {
        evidenceId: 'EV-CAN-01',
        otId: '26-29221',
        type: 'before',
        label: 'Antes - Limpieza INV-01',
        description: 'Filtros con acumulación severa de polvo y suciedad en rejilla de ventilación.',
        simulatedFileName: 'inv01_before_dirty.jpg',
        uploadedBy: 'Víctor León',
        uploadedAt: '2026-07-06 09:15',
        status: 'Aprobada',
        linkedChecklistItem: 'Revisión y reemplazo de filtros de aire'
      },
      {
        evidenceId: 'EV-CAN-02',
        otId: '26-29221',
        type: 'after',
        label: 'Después - Limpieza INV-01',
        description: 'Filtros limpios y rejilla despejada de partículas.',
        simulatedFileName: 'inv01_after_clean.jpg',
        uploadedBy: 'Víctor León',
        uploadedAt: '2026-07-06 09:45',
        status: 'Aprobada',
        linkedChecklistItem: 'Revisión y reemplazo de filtros de aire'
      },
      {
        evidenceId: 'EV-CAN-03',
        otId: '26-29221',
        type: 'before',
        label: 'Antes - Limpieza INV-02',
        description: 'Gabinete interior con acumulación de polvo en disipadores.',
        simulatedFileName: 'inv02_before_dusty.jpg',
        uploadedBy: 'Rodrigo Cisterna',
        uploadedAt: '2026-07-06 10:20',
        status: 'Cargada',
        linkedChecklistItem: 'Limpieza e inspección de gabinetes'
      },
      {
        evidenceId: 'EV-CAN-04',
        otId: '26-29221',
        type: 'after',
        label: 'Después - Limpieza INV-02',
        description: 'Gabinete interior soplado y libre de polvo.',
        simulatedFileName: 'inv02_after_blown.jpg',
        uploadedBy: 'Rodrigo Cisterna',
        uploadedAt: '2026-07-06 10:40',
        status: 'Requiere revisión',
        linkedChecklistItem: 'Limpieza e inspección de gabinetes'
      },
      {
        evidenceId: 'EV-CAN-05',
        otId: '26-29221',
        type: 'during',
        label: 'Termografía Bornes INV-03',
        description: 'Punto caliente leve detectado en bornera fusible número 3.',
        simulatedFileName: 'inv03_thermal_hotspot.jpg',
        uploadedBy: 'Carrasco',
        uploadedAt: '2026-07-06 11:30',
        status: 'Rechazada',
        linkedChecklistItem: 'Termografía de borneras AC/DC'
      },
      {
        evidenceId: 'EV-CAN-06',
        otId: '26-29221',
        type: 'quality',
        label: 'Captura App Fabricante INV-04',
        description: 'Sincronización de parámetros de comunicación RS485 exitosa.',
        simulatedFileName: 'inv04_app_comm_sync.png',
        uploadedBy: 'Víctor León',
        uploadedAt: '2026-07-06 14:15',
        status: 'Aprobada',
        linkedChecklistItem: 'Limpieza e inspección de gabinetes'
      },
      {
        evidenceId: 'EV-CAN-07',
        otId: '26-29221',
        type: 'before',
        label: 'Antes - Limpieza INV-03',
        description: 'Gabinete con polvo en filtros frontales.',
        simulatedFileName: 'inv03_before_dust.jpg',
        uploadedBy: 'Carrasco',
        uploadedAt: '2026-07-06 15:30',
        status: 'Incompleta',
        linkedChecklistItem: 'Limpieza e inspección de gabinetes'
      }
    ]
  },
];

// 4. Base HSE & Calidad Findings (DB_HSE_CALIDAD)
export const INITIAL_HSE_CALIDAD: HSEFinding[] = [
  {
    id: 'F-001',
    tipo: 'HSE',
    plantaId: 'P01',
    plantaNombre: 'Atacama Solar',
    legacyPlantId: 'P01',
    categoria: 'Condición Insegura',
    descripcion: 'Bloqueo de salidas de emergencia en la sala eléctrica N°3 con cajas de repuestos de inversores.',
    responsableCierre: 'Yasmín Castro',
    fechaCompromiso: '2026-07-08',
    estado: 'Abierto',
    gravedad: 'Alta',
  },
  {
    id: 'F-002',
    tipo: 'HSE',
    plantaId: 'P05',
    plantaNombre: 'Santiago Solar',
    legacyPlantId: 'P05',
    categoria: 'AST',
    descripcion: 'Análisis de Trabajo Seguro (AST) incompleto para maniobras de izamiento con camión pluma de Trafo.',
    responsableCierre: 'Eduardo Carvallo',
    fechaCompromiso: '2026-07-04',
    estado: 'En Revisión',
    gravedad: 'Alta',
  },
  {
    id: 'F-003',
    tipo: 'Calidad',
    plantaId: 'P02',
    plantaNombre: 'Luz del Norte',
    legacyPlantId: 'P02',
    categoria: 'Hallazgo de Calidad',
    descripcion: 'Falta de torque en el 15% de los pernos de las estructuras de montaje en el cuadrante B.',
    responsableCierre: 'Yasmín Castro',
    fechaCompromiso: '2026-07-15',
    estado: 'Abierto',
    gravedad: 'Media',
  },
  {
    id: 'F-004',
    tipo: 'HSE',
    plantaId: 'P04',
    plantaNombre: 'Pelícano Solar',
    legacyPlantId: 'P04',
    categoria: 'Permiso de Trabajo',
    descripcion: 'Trabajo en altura realizado sin certificación vigente del arnés de seguridad del subcontratista.',
    responsableCierre: 'Eduardo Carvallo',
    fechaCompromiso: '2026-07-06',
    estado: 'Cerrado',
    evidencia: 'certificado_arnes_actualizado.pdf',
    gravedad: 'Alta',
  },
  {
    id: 'F-005',
    tipo: 'Calidad',
    plantaId: 'P07',
    plantaNombre: 'Maule Solar',
    legacyPlantId: 'P07',
    categoria: 'Acción Correctiva',
    descripcion: 'Cableado de comunicación RS-485 sin canalización adecuada, expuesto directamente a radiación UV.',
    responsableCierre: 'Héctor Mellado',
    fechaCompromiso: '2026-07-12',
    estado: 'Abierto',
    gravedad: 'Media',
  },
];

// 5. Base Planificación Preventiva (DB_PLANIFICACION)
export const INITIAL_PLANIFICACION: PlanPreventivo[] = [
  {
    id: 'PLAN-01',
    plantaId: 'P01',
    plantaNombre: 'Atacama Solar',
    legacyPlantId: 'P01',
    actividad: 'Limpieza mecánica de paneles solares (Fila 01 a 200)',
    mes: 'Julio 2026',
    semana: 1,
    estado: 'Completado',
    hhAsignadas: 40,
    recursos: '2 Cuadrillas de limpieza + Máquina tractora solar',
    dependencias: 'Disponibilidad de camión aljibe',
    riesgos: 'Tormentas de polvo en el desierto',
  },
  {
    id: 'PLAN-02',
    plantaId: 'P02',
    plantaNombre: 'Luz del Norte',
    legacyPlantId: 'P02',
    actividad: 'Termografía en Cajas de Conexión (String Boxes) - Bloque 4',
    mes: 'Julio 2026',
    semana: 2,
    estado: 'En Curso',
    hhAsignadas: 16,
    recursos: '1 Ingeniero con Drone Termográfico + 1 Técnico de apoyo',
    dependencias: 'Radiación solar mayor a 600 W/m2',
    riesgos: 'Vientos fuertes sobre 25 km/h impiden vuelo de Drone',
  },
  {
    id: 'PLAN-03',
    plantaId: 'P04',
    plantaNombre: 'Pelícano Solar',
    legacyPlantId: 'P04',
    actividad: 'Pruebas dieléctricas y de resistencia a mallas de tierra',
    mes: 'Julio 2026',
    semana: 2,
    estado: 'Programado',
    hhAsignadas: 24,
    recursos: 'Ingeniero O&M + Telurómetro calibrado',
    dependencias: 'Corte programado de barras auxiliares de BT',
    riesgos: 'Contacto eléctrico indirecto',
  },
  {
    id: 'PLAN-04',
    plantaId: 'P05',
    plantaNombre: 'Santiago Solar',
    legacyPlantId: 'P05',
    actividad: 'Reapriete general de conexiones eléctricas en inversores',
    mes: 'Julio 2026',
    semana: 1,
    estado: 'Atrasado',
    hhAsignadas: 32,
    recursos: '2 Técnicos O&M + Torquímetros calibrados',
    dependencias: 'Finalizar OT-2026-003 del TRAFO-01',
    riesgos: 'Falta de personal por licencias médicas',
  },
  {
    id: 'PLAN-05',
    plantaId: 'P07',
    plantaNombre: 'Maule Solar',
    legacyPlantId: 'P07',
    actividad: 'Inspección de zanjas, ductos y canalizaciones subterráneas',
    mes: 'Julio 2026',
    semana: 3,
    estado: 'Programado',
    hhAsignadas: 12,
    recursos: '1 Técnico O&M',
    dependencias: 'Plan de control de roedores al día',
    riesgos: 'Presencia de avispas o reptiles en cámaras',
  },
];

// 6. Base de Vehículos de Flota (DB_FLOTA / DB_LOGISTICA)
export const INITIAL_VEHICULOS: Vehiculo[] = [
  {
    id: 'V01',
    patente: 'KOPX-42',
    modelo: 'Toyota Hilux 4x4',
    conductor: 'Alejandro Rojas',
    personalAsociado: ['Cristián Barraza', 'Yasmín Castro'],
    plantaDestinoId: 'P01',
    plantaDestinoNombre: 'Atacama Solar',
    legacyPlantId: 'P01',
    zona: 'Norte',
    rutaSimulada: 'Calama - Diego de Almagro',
    horaSalida: '07:30',
    horaLlegadaEstimada: '10:15',
    herramientasRequeridas: ['Torquímetro de precisión', 'Kit de aislamiento dieléctrico', 'Drone termográfico'],
    repuestosRequeridos: ['Fusibles 200A DC', 'Conectores MC4', 'Fusibles AC de repuesto'],
    estado: 'En ruta',
  },
  {
    id: 'V02',
    patente: 'PLWY-88',
    modelo: 'Mitsubishi L200',
    conductor: 'Mauricio Valdés',
    personalAsociado: ['Eduardo Carvallo'],
    plantaDestinoId: 'P05',
    plantaDestinoNombre: 'Santiago Solar',
    legacyPlantId: 'P05',
    zona: 'Centro',
    rutaSimulada: 'Santiago - Tiltil',
    horaSalida: '08:00',
    horaLlegadaEstimada: '09:15',
    herramientasRequeridas: ['Megger', 'Cámara térmica', 'Analizador de redes de potencia'],
    repuestosRequeridos: ['Módulo RS-485', 'Aceite dieléctrico para Trafo'],
    estado: 'En planta',
  },
  {
    id: 'V03',
    patente: 'SDFG-12',
    modelo: 'Nissan Navara 4x4',
    conductor: 'Francisco Jara',
    personalAsociado: ['Daniel Godoy'],
    plantaDestinoId: 'P07',
    plantaDestinoNombre: 'Maule Solar',
    legacyPlantId: 'P07',
    zona: 'Sur',
    rutaSimulada: 'Talca - San Clemente',
    horaSalida: '09:00',
    horaLlegadaEstimada: '09:45',
    estado: 'Disponible',
    herramientasRequeridas: ['Herramientas manuales', 'Multímetro Fluke'],
    repuestosRequeridos: [],
  },
  {
    id: 'V04',
    patente: 'HGTR-99',
    modelo: 'Chevrolet D-Max',
    conductor: 'No Asignado',
    personalAsociado: [],
    zona: 'Centro',
    estado: 'Mantención vehículo',
    bloqueoLogistico: 'Revisión técnica y cambio de pastillas de freno en taller de Colina.',
  }
];

// 7. Base de Personas (DB_PERSONAS)
export const INITIAL_RECURSOS_PERSONAS: RecursoPersona[] = [
  {
    id: 'RP01',
    nombre: 'Felipe Soto',
    rol: 'JEFE_OM',
    zona: 'Todas',
    plantasAsignadas: ['Todas'],
    otActivasCount: 4,
    hhPlanificadas: 160,
    hhReales: 140,
    estadoDisponibilidad: 'En oficina',
    cargaSemanal: 70,
    competencias: ['Dirección O&M', 'Análisis Predictivo', 'ISO 55001 Asset Management'],
    activo: true
  },
  {
    id: 'RP02',
    nombre: 'Rodolfo Garcés',
    rol: 'COORDINADOR_OM',
    zona: 'Todas',
    plantasAsignadas: ['Todas'],
    otActivasCount: 8,
    hhPlanificadas: 180,
    hhReales: 172,
    estadoDisponibilidad: 'En oficina',
    cargaSemanal: 95,
    competencias: ['Planificación Primavera P6', 'Control de Costos O&M', 'Gobernanza SAP'],
    activo: true
  },
  {
    id: 'RP03',
    nombre: 'Alejandro Rojas',
    rol: 'SUPERVISOR_TERRENO',
    zona: 'Norte',
    plantasAsignadas: ['Atacama Solar', 'Luz del Norte', 'Quillagua Solar'],
    otActivasCount: 3,
    hhPlanificadas: 40,
    hhReales: 38,
    estadoDisponibilidad: 'En terreno',
    cargaSemanal: 80,
    competencias: ['Supervisión Eléctrica Alta Tensión', 'AST & Permisos de Trabajo', 'Primeros Auxilios'],
    activo: true
  },
  {
    id: 'RP04',
    nombre: 'Mauricio Valdés',
    rol: 'SUPERVISOR_TERRENO',
    zona: 'Centro',
    plantasAsignadas: ['Pelícano Solar', 'Santiago Solar', 'El Totihue Solar'],
    otActivasCount: 4,
    hhPlanificadas: 45,
    hhReales: 42,
    estadoDisponibilidad: 'En terreno',
    cargaSemanal: 85,
    competencias: ['Mantenimiento Subestaciones', 'Coordinación Logística', 'HSE Avanzado'],
    activo: true
  },
  {
    id: 'RP05',
    nombre: 'Francisco Jara',
    rol: 'SUPERVISOR_TERRENO',
    zona: 'Sur',
    plantasAsignadas: ['Maule Solar', 'Ñuble Solar', 'Biobío del Sol'],
    otActivasCount: 2,
    hhPlanificadas: 30,
    hhReales: 28,
    estadoDisponibilidad: 'En terreno',
    cargaSemanal: 50,
    competencias: ['Mantenimiento PMGD', 'Calidad QA/QC', 'Resolución de Conflictos'],
    activo: true
  },
  {
    id: 'RP06',
    nombre: 'Yasmín Castro',
    rol: 'INGENIERO_OM',
    zona: 'Norte',
    plantasAsignadas: ['Atacama Solar', 'Quillagua Solar'],
    otActivasCount: 2,
    hhPlanificadas: 32,
    hhReales: 28,
    estadoDisponibilidad: 'En terreno',
    cargaSemanal: 60,
    competencias: ['Curvas I-V', 'Drone Termografía Nivel 2', 'Programación Inversores SMA'],
    activo: true
  },
  {
    id: 'RP07',
    nombre: 'Beatriz Loyola',
    rol: 'INGENIERO_OM',
    zona: 'Centro',
    plantasAsignadas: ['Santiago Solar', 'Pelícano Solar'],
    otActivasCount: 3,
    hhPlanificadas: 36,
    hhReales: 34,
    estadoDisponibilidad: 'En terreno',
    cargaSemanal: 70,
    competencias: ['Analizadores de Potencia Fluke', 'Scada SCADA Igniton', 'Configurador Trackers'],
    activo: true
  },
  {
    id: 'RP08',
    nombre: 'Cristián Barraza',
    rol: 'TECNICO_OM',
    zona: 'Norte',
    plantasAsignadas: ['Atacama Solar'],
    otActivasCount: 2,
    hhPlanificadas: 40,
    hhReales: 44,
    estadoDisponibilidad: 'En terreno',
    cargaSemanal: 110,
    competencias: ['Mantenimiento Preventivo Inversores', 'Torque de Estructuras', 'Fibra Óptica'],
    activo: true
  },
  {
    id: 'RP09',
    nombre: 'Eduardo Carvallo',
    rol: 'TECNICO_OM',
    zona: 'Centro',
    plantasAsignadas: ['Santiago Solar', 'El Totihue Solar'],
    otActivasCount: 3,
    hhPlanificadas: 40,
    hhReales: 36,
    estadoDisponibilidad: 'En terreno',
    cargaSemanal: 90,
    competencias: ['Reemplazo de Fusibles DC', 'Instalador Eléctrico Clase A', 'Seguridad en Altura'],
    activo: true
  },
  {
    id: 'RP10',
    nombre: 'Sofía Mondaca',
    rol: 'HSE',
    zona: 'Todas',
    plantasAsignadas: ['Todas'],
    otActivasCount: 3,
    hhPlanificadas: 40,
    hhReales: 35,
    estadoDisponibilidad: 'En terreno',
    cargaSemanal: 75,
    competencias: ['Auditoría HSE', 'Rescate en Altura', 'Normativa Eléctrica DS 594'],
    activo: true
  }
];

export const INITIAL_REPUESTOS: Repuesto[] = [
  { id: 'REP01', nombre: 'Fusible 200A DC', categoria: 'Inversores', stockSimulado: 12, ubicacion: 'Bodega Central', estado: 'Disponible', criticidad: 'Alta' },
  { id: 'REP02', nombre: 'Módulo de comunicación RS-485', categoria: 'Comunicaciones', stockSimulado: 5, ubicacion: 'Bodega Norte', estado: 'Reservado', otVinculada: 'OT-2026-002', plantaDestinoNombre: 'Luz del Norte', responsable: 'Yasmín Castro', fechaRequerida: '2026-07-12', criticidad: 'Media' },
  { id: 'REP03', nombre: 'Tarjeta de control inversor SMA', categoria: 'Inversores', stockSimulado: 0, ubicacion: 'Bodega Central', estado: 'Pendiente compra', otVinculada: 'OT-2026-004', plantaDestinoNombre: 'Pelícano Solar', responsable: 'Beatriz Loyola', fechaRequerida: '2026-07-08', criticidad: 'Crítica' },
  { id: 'REP04', nombre: 'Conector MC4 Macho/Hembra', categoria: 'Materiales AC/DC', stockSimulado: 150, ubicacion: 'Bodega Norte', estado: 'Disponible', criticidad: 'Baja' },
  { id: 'REP05', nombre: 'Aceite dieléctrico para Transformador', categoria: 'Subestaciones', stockSimulado: 200, ubicacion: 'Bodega Sur', estado: 'En terreno', otVinculada: 'OT-2026-003', plantaDestinoNombre: 'Santiago Solar', responsable: 'Mauricio Valdés', fechaRequerida: '2026-07-06', criticidad: 'Crítica' },
  { id: 'REP06', nombre: 'Sensor de irradiación Kipp&Zonen', categoria: 'Estación Meteorológica', stockSimulado: 1, ubicacion: 'Bodega Centro', estado: 'Bloqueando OT', otVinculada: 'OT-2026-007', plantaDestinoNombre: 'Maule Solar', responsable: 'Daniel Godoy', fechaRequerida: '2026-07-15', criticidad: 'Alta' }
];

export const INITIAL_HERRAMIENTAS: Herramienta[] = [
  { id: 'HER01', nombre: 'Drone Termográfico DJI Enterprise', categoria: 'Medición', stockSimulado: 2, ubicacion: 'Bodega Central', estado: 'En terreno', otVinculada: 'OT-2026-001', plantaDestinoNombre: 'Atacama Solar', responsable: 'Yasmín Castro', fechaRequerida: '2026-07-06', criticidad: 'Crítica' },
  { id: 'HER02', nombre: 'Megger de aislamiento 10kV', categoria: 'Medición Eléctrica', stockSimulado: 3, ubicacion: 'Bodega Centro', estado: 'Disponible', criticidad: 'Alta' },
  { id: 'HER03', nombre: 'Torquímetro calibrado Snap-on', categoria: 'Herramientas Mecánicas', stockSimulado: 6, ubicacion: 'Bodega Centro', estado: 'Asignado', otVinculada: 'OT-2026-003', plantaDestinoNombre: 'Santiago Solar', responsable: 'Eduardo Carvallo', fechaRequerida: '2026-07-06', criticidad: 'Media' },
  { id: 'HER04', nombre: 'Analizador de redes Fluke 435', categoria: 'Medición Eléctrica', stockSimulado: 1, ubicacion: 'Bodega Norte', estado: 'Disponible', criticidad: 'Alta' },
  { id: 'HER05', nombre: 'Cámara termográfica portátil FLIR', categoria: 'Medición', stockSimulado: 4, ubicacion: 'Bodega Sur', estado: 'En mantención', criticidad: 'Media' }
];

export const INITIAL_AUDIT_LOG: AuditLogEvent[] = [
  {
    id: 'EV-1001',
    fechaHora: '2026-07-06 08:30',
    usuarioRol: 'Rodolfo Garcés (Coordinador O&M)',
    accion: 'Creación de OT',
    moduloOrigen: 'ORBI OT Center',
    otVinculada: 'OT-2026-001',
    plantaVinculada: 'Atacama Solar',
    estadoNuevo: 'Nueva',
    comentario: 'Orden de trabajo preventiva generada automáticamente por calendario anual.',
    criticidad: 'Baja'
  },
  {
    id: 'EV-1002',
    fechaHora: '2026-07-06 09:15',
    usuarioRol: 'Felipe Soto (Jefe O&M)',
    accion: 'Asignación de supervisor',
    moduloOrigen: 'ORBI OT Center',
    otVinculada: 'OT-2026-001',
    plantaVinculada: 'Atacama Solar',
    estadoAnterior: 'Nueva',
    estadoNuevo: 'Asignada',
    comentario: 'Se asigna a Alejandro Rojas como Supervisor de Terreno para liderar la actividad.',
    criticidad: 'Baja'
  },
  {
    id: 'EV-1003',
    fechaHora: '2026-07-06 10:00',
    usuarioRol: 'Rodolfo Garcés (Coordinador O&M)',
    accion: 'Programación en Workspace',
    moduloOrigen: 'ORBI Workspace',
    otVinculada: 'OT-2026-001',
    plantaVinculada: 'Atacama Solar',
    estadoAnterior: 'Asignada',
    estadoNuevo: 'Programada',
    comentario: 'Planificación confirmada para el 2026-07-06 en el bloque matutino.',
    criticidad: 'Baja'
  },
  {
    id: 'EV-1004',
    fechaHora: '2026-07-06 10:30',
    usuarioRol: 'Alejandro Rojas (Supervisor Terreno)',
    accion: 'Asignación de vehículo',
    moduloOrigen: 'Control de Flota',
    otVinculada: 'OT-2026-001',
    plantaVinculada: 'Atacama Solar',
    comentario: 'Vehículo Toyota Hilux KOPX-42 despachado con herramientas y repuestos cargados.',
    criticidad: 'Media'
  },
  {
    id: 'EV-1005',
    fechaHora: '2026-07-06 11:20',
    usuarioRol: 'Sofía Mondaca (Especialista HSE)',
    accion: 'Firma HSE',
    moduloOrigen: 'HSE & Quality Bridge',
    otVinculada: 'OT-2026-001',
    plantaVinculada: 'Atacama Solar',
    comentario: 'AST de terreno validado y aprobado en sistema. Proceder con el bloqueo del disyuntor.',
    criticidad: 'Alta'
  },
  {
    id: 'EV-1006',
    fechaHora: '2026-07-06 14:00',
    usuarioRol: 'Beatriz Loyola (Ingeniero O&M)',
    accion: 'Bloqueo logístico',
    moduloOrigen: 'Repuestos & Herramientas',
    otVinculada: 'OT-2026-004',
    plantaVinculada: 'Pelícano Solar',
    estadoAnterior: 'En ejecución',
    estadoNuevo: 'Bloqueada',
    comentario: 'Tarjeta de control inversor SMA dañada por sobretensión. Stock en bodega es cero. Requiere compra.',
    criticidad: 'Crítica'
  },
  {
    id: 'EV-1007',
    fechaHora: '2026-07-06 15:30',
    usuarioRol: 'Felipe Soto (Jefe O&M)',
    accion: 'Escalamiento a Jefe O&M',
    moduloOrigen: 'Risk & Escalation Center',
    otVinculada: 'OT-2026-004',
    plantaVinculada: 'Pelícano Solar',
    comentario: 'Falta de tarjeta SMA escalada a Gerencia y Compras con prioridad máxima para evitar caída en la generación.',
    criticidad: 'Crítica'
  }
];

export const INITIAL_ESCALACIONES: Escalation[] = [
  {
    id: 'ESC-001',
    tipo: 'Repuesto bloqueando ejecución',
    estado: 'Escalado',
    responsable: 'Felipe Soto',
    comentario: 'Tarjeta SMA dañada sin stock nacional. Riesgo alto de pérdida de producción en Pelícano Solar.',
    otVinculada: 'OT-2026-004',
    plantaVinculada: 'Pelícano Solar',
    fechaHora: '2026-07-06 15:30',
    criticidad: 'Crítica',
    escaladoA: 'Gerencia'
  },
  {
    id: 'ESC-002',
    tipo: 'Actividad sin recurso',
    estado: 'En revisión',
    responsable: 'Rodolfo Garcés',
    comentario: 'Limpieza preventiva en Santiago Solar sin camión aljibe disponible para la fecha programada.',
    otVinculada: 'OT-2026-003',
    plantaVinculada: 'Santiago Solar',
    fechaHora: '2026-07-06 12:00',
    criticidad: 'Media',
    escaladoA: 'Logística / Bodega'
  },
  {
    id: 'ESC-003',
    tipo: 'Coordinador sobrecargado',
    estado: 'Detectado',
    responsable: 'Esteban Valenzuela',
    comentario: 'Rodolfo Garcés tiene 8 OTs críticas abiertas esta semana (Carga 95%). Requiere apoyo de Planificación.',
    fechaHora: '2026-07-06 17:00',
    criticidad: 'Alta',
    escaladoA: 'Jefe O&M'
  },
  {
    id: 'ESC-004',
    tipo: 'Riesgo HSE pendiente',
    estado: 'En gestión',
    responsable: 'Sofía Mondaca',
    comentario: 'Hallazgo de cables expuestos a radiación UV en Maule Solar. Riesgo de arco eléctrico o falla a tierra.',
    otVinculada: 'OT-2026-007',
    plantaVinculada: 'Maule Solar',
    fechaHora: '2026-07-06 11:00',
    criticidad: 'Alta',
    escaladoA: 'HSE'
  }
];

// Estructura de Claves para LocalStorage con Versionado de Esquema
export function getChecklistByOTType(tipo: string, activo: string = ''): string[] {
  const t = tipo.toLowerCase();
  const act = (activo || '').toLowerCase();
  
  if (t.includes('preventiv') && act.includes('inversor')) {
    return [
      'Inspección visual de módulos de potencia IGBT y limpieza de filtros.',
      'Verificación de torque en conexiones de barras DC y AC.',
      'Medición de resistencia de aislamiento (Megger) y puesta a tierra.',
      'Revisión de ventiladores y sistema de refrigeración forzada.',
      'Calibración de parámetros y prueba de disparo de protecciones.'
    ];
  }
  if (t.includes('correctiv') && act.includes('inversor')) {
    return [
      'Diagnóstico de falla mediante lectura de alarmas del inversor.',
      'Aislamiento seguro del equipo (bloqueo LOTO DC/AC).',
      'Reemplazo de componentes defectuosos (tarjetas, fusibles, capacitores).',
      'Pruebas dinámicas de arranque y sincronización a red.',
      'Registro de parámetros eléctricos finales y termografía de control.'
    ];
  }
  if (t.includes('limpieza') || act.includes('módulo') || act.includes('modulo')) {
    return [
      'Inspección de suciedad y mapeo de grado de soiling.',
      'Lavado de módulos con agua desmineralizada y cepillo suave.',
      'Inspección posterior para detectar hotspot o roturas.',
      'Medición de curvas I-V de strings de control.'
    ];
  }
  if (t.includes('cctv') || t.includes('comunicaci') || act.includes('cctv') || act.includes('comunic')) {
    return [
      'Limpieza de lentes de cámaras domo y fijas en perímetro.',
      'Verificación de fuentes de poder UPS e switches industriales.',
      'Pruebas de ping y latencia en enlaces de fibra óptica.',
      'Revisión de grabadores NVR y almacenamiento local.'
    ];
  }
  if (t.includes('meteorol') || t.includes('piran') || act.includes('met') || act.includes('piran')) {
    return [
      'Limpieza de piranómetros y sensor de temperatura de célula.',
      'Calibración de piranómetros y verificación de nivel burbuja.',
      'Verificación de sensores de velocidad de viento (anemómetros).',
      'Pruebas de comunicación Modbus con registrador SCADA.'
    ];
  }
  if (t.includes('tracker') || act.includes('tracker') || act.includes('seguidor')) {
    return [
      'Inspección mecánica de rodamientos, tubos de torsión y transmisiones.',
      'Verificación de nivel de aceite y grasa en cajas reductoras.',
      'Calibración de sensores de inclinación (inclinómetros) y anemómetro de vela.',
      'Pruebas de posicionamiento manual, automático y modo tormenta (defense).'
    ];
  }
  if (t.includes('hse') || t.includes('seguridad')) {
    return [
      'Inspección del área para identificar condiciones subestándar.',
      'Delimitación y señalización temporal del área de riesgo.',
      'Retiro de materiales inflamables o reordenamiento del espacio.',
      'Registro fotográfico de la acción correctiva realizada.'
    ];
  }
  if (t.includes('calidad') || t.includes('técnico') || t.includes('tecnico')) {
    return [
      'Inspección visual detallada y contraste con estándares constructivos.',
      'Medición instrumental para corroborar desviación técnica.',
      'Aplicación de reparación o reemplazo técnico estandarizado.',
      'Verificación técnica y cierre del hallazgo de calidad.'
    ];
  }
  if (t.includes('comisionamiento') || t.includes('puesta en servicio') || t.includes('comision')) {
    return [
      'Verificación de protocolo de pruebas pre-comisionamiento completo.',
      'Energización progresiva de celdas MT e inversor.',
      'Prueba de rampas de potencia y control de reactivos con SCADA/CEN.',
      'Firma de acta de comisionamiento operacional en planta.'
    ];
  }
  if (t.includes('inspección') || t.includes('inspeccion') || t.includes('general')) {
    return [
      'Recorrido perimetral de cerco, portones y accesos.',
      'Inspección de zanjas de cables y salas eléctricas.',
      'Verificación de extintores, kit de derrames y kit de primeros auxilios.',
      'Reporte de novedades e informe de estado general.'
    ];
  }
  
  // Default fallback
  return [
    'Verificación visual de equipos y conexiones.',
    'Medición de parámetros eléctricos nominales.',
    'Termografía de puntos de conexión críticos.',
    'Prueba funcional y validación de comunicaciones.'
  ];
}

export const STORAGE_KEYS = {
  SCHEMA_VERSION: 'orbi_om_schema_version_v2',
  ORGANIGRAMA: 'orbi_om_db_organigrama',
  PLANTAS: 'orbi_om_db_plantas',
  OTS: 'orbi_om_db_ots', // Will load / save the extended OT structure
  HSE_CALIDAD: 'orbi_om_db_hse_calidad',
  PLANIFICACION: 'orbi_om_db_planificacion',
  VEHICULOS: 'orbi_om_db_vehiculos',
  RECURSOS_PERSONAS: 'orbi_om_db_recursos_personas',
  ACTIVE_ROLE: 'orbi_om_active_role',
  ACTIVE_USER_NAME: 'orbi_om_active_user_name',
  DB_WORKSPACE: 'orbi_om_db_workspace',
  DB_BI_KPI: 'orbi_om_db_bi_kpi',
  DB_ACTIVITY_LOG: 'orbi_om_db_activity_log',
  DB_RESOURCE_LOAD: 'orbi_om_db_resource_load',
  DB_GERENCIA_REPORTS: 'orbi_om_db_gerencia_reports',
  
  // Nuevas claves del parche v0.1.1C
  DB_FLOTA: 'orbi_om_db_flota_v1',
  DB_LOGISTICA: 'orbi_om_db_logistica_v1',
  DB_REPUESTOS: 'orbi_om_db_repuestos_v1',
  DB_HERRAMIENTAS: 'orbi_om_db_herramientas_v1',
  DB_RESOURCE_CENTER: 'orbi_om_db_resource_center_v1',
  DB_AUDIT_LOG: 'orbi_om_db_audit_log_v1',
  DB_ESCALAMIENTOS: 'orbi_om_db_escalamientos_v1',
  DB_BLOCKERS: 'orbi_om_db_blockers_v1',

  // Nuevas claves del parche v0.1.2B
  DB_EVIDENCE_PACK: 'orbi_om_db_evidence_pack_v1',
  DB_FIELD_EXECUTION: 'orbi_om_db_field_execution_v1',
  DB_CHECKLIST_EXECUTION: 'orbi_om_db_checklist_execution_v1',
  DB_FIELD_BLOCKERS: 'orbi_om_db_field_blockers_v1',
  DB_FIELD_CLOSURE_REQUESTS: 'orbi_om_db_field_closure_requests_v1',

  // Nuevas claves del parche v0.1.2C
  DB_CLOSURE_WORKFLOW: 'orbi_om_db_closure_workflow_v1',
  DB_APPROVALS: 'orbi_om_db_approvals_v1',
  DB_CLOSE_REPORTS: 'orbi_om_db_close_reports_v1',
  DB_RETURN_TO_FIELD: 'orbi_om_db_return_to_field_v1',
  DB_CLOSURE_QUALITY: 'orbi_om_db_closure_quality_v1',
  
  // Clave del módulo PTW Center
  DB_PTW: 'orbi_om_db_ptw_v1',
  DB_INVENTORY: 'orbi_om_db_inventory_v1',
  DB_INVENTORY_MOVEMENTS: 'orbi_om_db_inventory_movements_v1'
};

const SCHEMA_VERSION_VALUE = '0.1.2C-closure-approvals-report-pack';

export const INITIAL_PTWS: PTW[] = [
  {
    id: 'PTS-CANT-2026-089',
    codigo: 'PTS-CANT-2026-089',
    otCodigos: ['26-29221'],
    tecnicos: ['Víctor León', 'Rodrigo Cisterna', 'Carrasco'],
    plantaId: 'ORBI-PV-058',
    plantaNombre: 'Cantillana',
    legacyPlantId: 'P10',
    tipoTrabajo: 'PM Anual Inversores',
    fechaInicio: '2026-07-05 08:30',
    fechaFin: '2026-07-15 17:30',
    lugar: 'Inversores INV-01 a INV-39',
    equipoIntervenir: 'Inversores de Potencia',
    alcance: 'Mantenimiento anual de inversores INV-01 a INV-39 en Cantillana. Limpieza de polvo, reapriete, torque e inspección de filtros.',
    observaciones: 'Ejecutar bajo procedimientos de seguridad LOTO. Bloqueo obligatorio de disyuntores de media tensión.',
    requiereAST: true,
    astAsociadoId: 'AST-CANT-2026-089',
    astAsociadoComentario: 'AST de Terreno firmado por Víctor León.',
    tecnicoConfirmaEPP: true,
    tecnicoConfirmaRecomendaciones: true,
    tecnicoConfirmaHerramientas: true,
    firmaAperturaTecnico: 'Víctor León',
    firmaAperturaTecnicoFecha: '2026-07-05 08:45',
    firmaAperturaSupervisor: 'Mauricio Valdés',
    firmaAperturaSupervisorFecha: '2026-07-05 09:00',
    estado: 'En ejecución',
    creadoPor: 'Mauricio Valdés',
    creadoFecha: '2026-07-04 16:30'
  }
];

// Función para migrar y validar datos en localStorage
const checkAndMigrateSchema = () => {
  if (typeof window === 'undefined') return;

  const currentVersion = localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
  if (currentVersion !== SCHEMA_VERSION_VALUE) {
    // Si la versión es antigua o no existe, migrar datos suavemente
    const oldOtsRaw = localStorage.getItem(STORAGE_KEYS.OTS);
    if (oldOtsRaw) {
      try {
        const oldOts: any[] = JSON.parse(oldOtsRaw);
        // Migrar cada OT antigua agregando los campos nuevos requeridos
        const migratedOts: OT[] = oldOts.map((ot) => {
          // Determine existing state
          const isDone = ot.estado === 'Finalizada' || ot.estado === 'Cerrada' || ot.estado === 'Lista para revisión';
          const isFieldActive = ot.estado === 'En terreno' || ot.estado === 'En ejecución' || isDone;

          // Determine checklist
          const defaultItems = getChecklistByOTType(ot.tipo || '', ot.activo || '');
          const checklistExecution = ot.checklistExecution || defaultItems.map((item, index) => ({
            item,
            completado: ot.avance ? (ot.avance >= ((index + 1) * (100 / defaultItems.length))) : isDone,
            noAplica: false,
            observacion: '',
            hallazgo: false,
            evidenciaRequerida: index === 0 || index === defaultItems.length - 1
          }));

          // Evidence pack
          const existingEvidences: OTEvidencia[] = ot.evidencias || (ot.evidencia ? [ot.evidencia] : []);
          const evidencePack: OTEvidencePackItem[] = ot.evidencePack || existingEvidences.map((ev, idx) => ({
            evidenceId: `ev-${ot.codigo}-${idx}-${Date.now()}`,
            otId: ot.codigo,
            type: idx === 0 ? 'before' : idx === existingEvidences.length - 1 ? 'after' : 'during',
            label: ev.descripcion || 'Evidencia de terreno',
            description: ev.descripcion || 'Imagen capturada durante trabajos.',
            simulatedFileName: ev.nombreArchivo || 'evidencia.jpg',
            uploadedBy: ot.responsable || 'Técnico de Terreno',
            uploadedAt: ev.fecha || ot.fechaInicio || '2026-07-06',
            status: 'Completado'
          }));

          return {
            ...ot,
            tipo: ot.tipo === 'Preventivo' ? 'Preventiva' : ot.tipo === 'Correctivo' ? 'Correctiva' : ot.tipo,
            coordinador: ot.coordinador || 'Rodolfo Garcés',
            supervisor: ot.supervisor || 'Alejandro Rojas',
            origen: ot.origen || 'Preventivo programado',
            impacto: ot.impacto || 'Medio',
            riesgoDisponibilidad: ot.riesgoDisponibilidad === 'Sí' ? 'Riesgo crítico' : ot.riesgoDisponibilidad === 'Parcial' ? 'Riesgo medio' : 'No aplica',
            repuestos: ot.repuestos || [],
            historialCambios: ot.historialCambios || [
              { fecha: ot.fechaInicio + ' 09:00', usuario: 'Rodolfo Garcés', accion: 'Migración', detalle: 'OT migrada a formato Command Center.' }
            ],
            bloqueada: ot.estado === 'En espera de repuesto' || ot.estado === 'En espera de cliente' || ot.bloqueada,
            motivoBloqueo: ot.motivoBloqueo || (ot.estado === 'En espera de repuesto' ? 'Falta de repuesto crítico.' : ot.estado === 'En espera de cliente' ? 'Falta autorización cliente.' : ''),
            
            // New fields v0.1.2A defaults
            templateId: ot.templateId || '',
            origenOT: ot.origenOT || ot.origen || 'Preventivo programado',
            diagnosticoInicial: ot.diagnosticoInicial || ot.observaciones || 'Diagnóstico preliminar por verificar en terreno.',
            impactoOperacional: ot.impactoOperacional || ot.impacto || 'Medio',
            riesgoHSE: ot.riesgoHSE || 'Bajo',
            riesgoCalidad: ot.riesgoCalidad || 'Bajo',
            afectaProduccion: ot.afectaProduccion !== undefined ? ot.afectaProduccion : (ot.prioridad === 'Crítica' || ot.prioridad === 'Alta'),
            afectaSLA: ot.afectaSLA !== undefined ? ot.afectaSLA : (ot.prioridad === 'Crítica'),
            jefeOM: ot.jefeOM || 'Felipe Soto',
            coordinadorOM: ot.coordinadorOM || ot.coordinador || 'Rodolfo Garcés',
            supervisorTerreno: ot.supervisorTerreno || ot.supervisor || 'Alejandro Rojas',
            tecnicoAsignado: ot.tecnicoAsignado || ot.responsable || 'No asignado',
            areaTransversal: ot.areaTransversal || 'N/A',
            fechaProgramada: ot.fechaProgramada || ot.fechaInicio,
            horaInicioEstimada: ot.horaInicioEstimada || '08:30',
            horaTerminoEstimada: ot.horaTerminoEstimada || '17:30',
            ventanaTrabajo: ot.ventanaTrabajo || 'Diurna (08:00 - 18:00)',
            dependencias: ot.dependencias || 'Ninguna',
            requiereProgramacionWorkspace: ot.requiereProgramacionWorkspace !== undefined ? ot.requiereProgramacionWorkspace : true,
            vehiculoRequerido: ot.vehiculoRequerido !== undefined ? ot.vehiculoRequerido : false,
            vehiculoSugerido: ot.vehiculoSugerido || '',
            herramientasRequeridas: ot.herramientasRequeridas || [],
            repuestosRequeridas: ot.repuestosRequeridos || ot.repuestos || [],
            instrumentosRequeridas: ot.instrumentosRequeridas || [],
            bloqueoPorRecurso: ot.bloqueoPorRecurso !== undefined ? ot.bloqueoPorRecurso : false,
            observacionLogistica: ot.observacionLogistica || '',
            requiereAST: ot.requiereAST !== undefined ? ot.requiereAST : true,
            astFirmado: ot.astFirmado !== undefined ? ot.astFirmado : (ot.estado === 'Finalizada' || ot.estado === 'Cerrada' || ot.estado === 'Lista para revisión' || ot.estado === 'En ejecución'),
            requierePermisoTrabajo: ot.requierePermisoTrabajo !== undefined ? ot.requierePermisoTrabajo : false,
            requiereValidacionHSE: ot.requiereValidacionHSE !== undefined ? ot.requiereValidacionHSE : (ot.tipo === 'HSE'),
            validacionHSE: ot.validacionHSE || ((ot.estado === 'Finalizada' || ot.estado === 'Cerrada') ? 'Aprobado' : 'Pendiente'),
            requiereValidacionCalidad: ot.requiereValidacionCalidad !== undefined ? ot.requiereValidacionCalidad : (ot.tipo === 'Calidad'),
            validacionCalidad: ot.validacionCalidad || ((ot.estado === 'Finalizada' || ot.estado === 'Cerrada') ? 'Aprobado' : 'Pendiente'),
            requiereEvidencia: ot.requiereEvidencia !== undefined ? ot.requiereEvidencia : true,
            requiereChecklist: ot.requiereChecklist !== undefined ? ot.requiereChecklist : true,
            checklist: ot.checklist || defaultItems.map((item) => ({ item, completado: isDone })),
            approvals: ot.approvals || (ot.estado === 'Cerrada' ? [
              { rol: 'SUPERVISOR_TERRENO', nombre: ot.supervisor || 'Alejandro Rojas', fecha: ot.fechaInicio + ' 16:30', comentario: 'Trabajo ejecutado satisfactoriamente según el alcance.' },
              { rol: 'COORDINADOR_OM', nombre: ot.coordinador || 'Rodolfo Garcés', fecha: ot.fechaInicio + ' 17:00', comentario: 'Evidencias y checklist correctos, se aprueba cierre técnico.' }
            ] : []),
            lifecycleHistory: ot.lifecycleHistory || [
              { estadoAnterior: 'Borrador', estadoNuevo: 'Nueva', fecha: ot.fechaInicio + ' 08:30', usuario: 'Rodolfo Garcés', comentario: 'Creación automática de la OT.' },
              { estadoAnterior: 'Nueva', estadoNuevo: ot.estado, fecha: ot.fechaInicio + ' 09:00', usuario: 'Rodolfo Garcés', comentario: 'Estado inicial del módulo.' }
            ],
            closeSummary: ot.closeSummary || '',
            reopenedCount: ot.reopenedCount || 0,
            exportText: ot.exportText || '',

            // v0.1.2B fields
            llegadaConfirmada: ot.llegadaConfirmada !== undefined ? ot.llegadaConfirmada : isFieldActive,
            horaLlegadaSimulada: ot.horaLlegadaSimulada || (isFieldActive ? '09:12' : ''),
            observacionLlegada: ot.observacionLlegada || (isFieldActive ? 'Llegada a planta dentro de ventana de trabajo.' : ''),
            riesgosDetectadosTerreno: ot.riesgosDetectadosTerreno || '',
            condicionInseguraTerreno: ot.condicionInseguraTerreno || '',
            permisoTrabajoNumero: ot.permisoTrabajoNumero || (ot.requierePermisoTrabajo && isFieldActive ? 'PT-2026-9481' : ''),
            firmaEjecutorSimulada: ot.firmaEjecutorSimulada || (isDone ? ot.responsable : ''),
            firmaSupervisorSimulada: ot.firmaSupervisorSimulada || (ot.estado === 'Cerrada' ? ot.supervisor : ''),
            diagnosticoFinalTerreno: ot.diagnosticoFinalTerreno || (isDone ? 'Equipo intervenido y verificado operando bajo parámetros normales.' : ''),
            accionRealizadaTerreno: ot.accionRealizadaTerreno || (isDone ? 'Pruebas dinámicas ejecutadas sin alarmas activas.' : ''),
            resultadoTerreno: ot.resultadoTerreno || (isDone ? 'Exitoso' : undefined),
            propuestaCierreTerreno: ot.propuestaCierreTerreno !== undefined ? ot.propuestaCierreTerreno : (ot.estado === 'Lista para revisión' || isDone),
            comentarioPropuestaCierre: ot.comentarioPropuestaCierre || (ot.estado === 'Lista para revisión' ? 'Checklist completo y evidencias cargadas. Solicito cierre.' : ''),
            checklistExecution,
            evidencePack
          };
        });
        localStorage.setItem(STORAGE_KEYS.OTS, JSON.stringify(migratedOts));
      } catch (err) {
        console.error('Error migrando OTs antiguas:', err);
      }
    }

    // Inicializar nuevas bases de datos si no existen
    if (!localStorage.getItem(STORAGE_KEYS.VEHICULOS)) {
      localStorage.setItem(STORAGE_KEYS.VEHICULOS, JSON.stringify(INITIAL_VEHICULOS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECURSOS_PERSONAS)) {
      localStorage.setItem(STORAGE_KEYS.RECURSOS_PERSONAS, JSON.stringify(INITIAL_RECURSOS_PERSONAS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORGANIGRAMA)) {
      localStorage.setItem(STORAGE_KEYS.ORGANIGRAMA, JSON.stringify(INITIAL_ORGANIGRAMA));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_REPUESTOS)) {
      localStorage.setItem(STORAGE_KEYS.DB_REPUESTOS, JSON.stringify(INITIAL_REPUESTOS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_HERRAMIENTAS)) {
      localStorage.setItem(STORAGE_KEYS.DB_HERRAMIENTAS, JSON.stringify(INITIAL_HERRAMIENTAS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_AUDIT_LOG)) {
      localStorage.setItem(STORAGE_KEYS.DB_AUDIT_LOG, JSON.stringify(INITIAL_AUDIT_LOG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_ESCALAMIENTOS)) {
      localStorage.setItem(STORAGE_KEYS.DB_ESCALAMIENTOS, JSON.stringify(INITIAL_ESCALACIONES));
    }

    // Inicializar nuevas bases de datos del parche v0.1.2B
    if (!localStorage.getItem(STORAGE_KEYS.DB_EVIDENCE_PACK)) {
      localStorage.setItem(STORAGE_KEYS.DB_EVIDENCE_PACK, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_FIELD_EXECUTION)) {
      localStorage.setItem(STORAGE_KEYS.DB_FIELD_EXECUTION, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_CHECKLIST_EXECUTION)) {
      localStorage.setItem(STORAGE_KEYS.DB_CHECKLIST_EXECUTION, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_FIELD_BLOCKERS)) {
      localStorage.setItem(STORAGE_KEYS.DB_FIELD_BLOCKERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_FIELD_CLOSURE_REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.DB_FIELD_CLOSURE_REQUESTS, JSON.stringify([]));
    }

    // Inicializar nuevas bases de datos del parche v0.1.2C
    if (!localStorage.getItem(STORAGE_KEYS.DB_CLOSURE_WORKFLOW)) {
      localStorage.setItem(STORAGE_KEYS.DB_CLOSURE_WORKFLOW, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_APPROVALS)) {
      localStorage.setItem(STORAGE_KEYS.DB_APPROVALS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_CLOSE_REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.DB_CLOSE_REPORTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_RETURN_TO_FIELD)) {
      localStorage.setItem(STORAGE_KEYS.DB_RETURN_TO_FIELD, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_CLOSURE_QUALITY)) {
      localStorage.setItem(STORAGE_KEYS.DB_CLOSURE_QUALITY, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DB_PTW)) {
      localStorage.setItem(STORAGE_KEYS.DB_PTW, JSON.stringify(INITIAL_PTWS));
    }

    // Actualizar versión de esquema
    localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION_VALUE);
  }

  runPlantIdentityMigration16B1();
  runPlantIdentityReconciliation16B1B();
  runPlantIdentityFinalMigration16B1D();
  runPlantIdentityHardeningMigration16B1E();
  runPlantIdentityScopeClosureMigration16B1F();
};

export const PLANT_IDENTITY_MIGRATION_KEY = 'orbi_data_migration_16b1_plant_identity_v1';
export const PLANT_IDENTITY_RECONCILIATION_KEY = 'orbi_data_migration_16b1b_plant_identity_reconciliation_v1';
export const PLANT_IDENTITY_FINAL_MIGRATION_KEY = 'orbi_data_migration_16b1d_plant_identity_final_v1';
export const PLANT_IDENTITY_HARDENING_MIGRATION_KEY = 'orbi_data_migration_16b1e_plant_identity_hardening_v1';
export const PLANT_IDENTITY_SCOPE_CLOSURE_MIGRATION_KEY = 'orbi_data_migration_16b1f_plant_scope_closure_v1';

export function runPlantIdentityMigration16B1() {
  if (typeof window === 'undefined') return;
  const migrated = localStorage.getItem(PLANT_IDENTITY_MIGRATION_KEY);
  if (migrated === 'true') return;

  try {
    // 1. OTs
    const otsRaw = localStorage.getItem(STORAGE_KEYS.OTS);
    if (otsRaw) {
      const ots: any[] = JSON.parse(otsRaw);
      const updated = ots.map((ot) => {
        const canonicalId = getCanonicalPlantId(ot.plantaId || ot.plantaNombre);
        const canonicalName = getCanonicalPlantName(canonicalId);
        return {
          ...ot,
          legacyPlantId: ot.legacyPlantId || ot.plantaId,
          plantaId: canonicalId || ot.plantaId,
          plantaNombre: canonicalName || ot.plantaNombre
        };
      });
      localStorage.setItem(STORAGE_KEYS.OTS, JSON.stringify(updated));
    }

    // 2. HSE Calidad
    const hseRaw = localStorage.getItem(STORAGE_KEYS.HSE_CALIDAD);
    if (hseRaw) {
      const hse: any[] = JSON.parse(hseRaw);
      const updated = hse.map((h) => {
        const canonicalId = getCanonicalPlantId(h.plantaId || h.plantaNombre);
        const canonicalName = getCanonicalPlantName(canonicalId);
        return {
          ...h,
          legacyPlantId: h.legacyPlantId || h.plantaId,
          plantaId: canonicalId || h.plantaId,
          plantaNombre: canonicalName || h.plantaNombre
        };
      });
      localStorage.setItem(STORAGE_KEYS.HSE_CALIDAD, JSON.stringify(updated));
    }

    // 3. Planificación
    const planRaw = localStorage.getItem(STORAGE_KEYS.PLANIFICACION);
    if (planRaw) {
      const plan: any[] = JSON.parse(planRaw);
      const updated = plan.map((p) => {
        const canonicalId = getCanonicalPlantId(p.plantaId || p.plantaNombre);
        const canonicalName = getCanonicalPlantName(canonicalId);
        return {
          ...p,
          legacyPlantId: p.legacyPlantId || p.plantaId,
          plantaId: canonicalId || p.plantaId,
          plantaNombre: canonicalName || p.plantaNombre
        };
      });
      localStorage.setItem(STORAGE_KEYS.PLANIFICACION, JSON.stringify(updated));
    }

    // 4. Inventario O&M
    const invRaw = localStorage.getItem(STORAGE_KEYS.DB_INVENTORY);
    if (invRaw) {
      const inv: any[] = JSON.parse(invRaw);
      const updated = inv.map((i) => {
        const canonicalId = getCanonicalPlantId(i.plantaId || i.plantaNombre);
        const canonicalName = getCanonicalPlantName(canonicalId);
        return {
          ...i,
          legacyPlantId: i.legacyPlantId || i.plantaId,
          plantaId: canonicalId || i.plantaId,
          plantaNombre: canonicalName || i.plantaNombre
        };
      });
      localStorage.setItem(STORAGE_KEYS.DB_INVENTORY, JSON.stringify(updated));
    }

    // 5. Movimientos Inventario
    const movRaw = localStorage.getItem(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS);
    if (movRaw) {
      const mov: any[] = JSON.parse(movRaw);
      const updated = mov.map((m) => {
        const canonicalId = getCanonicalPlantId(m.plantaId || m.plantaNombre);
        const canonicalName = getCanonicalPlantName(canonicalId);
        return {
          ...m,
          legacyPlantId: m.legacyPlantId || m.plantaId,
          plantaId: canonicalId || m.plantaId,
          plantaNombre: canonicalName || m.plantaNombre
        };
      });
      localStorage.setItem(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS, JSON.stringify(updated));
    }

    // 6. PTWs
    const ptwRaw = localStorage.getItem(STORAGE_KEYS.DB_PTW);
    if (ptwRaw) {
      const ptws: any[] = JSON.parse(ptwRaw);
      const updated = ptws.map((p) => {
        const canonicalId = getCanonicalPlantId(p.plantaId || p.plantaNombre);
        const canonicalName = getCanonicalPlantName(canonicalId);
        return {
          ...p,
          legacyPlantId: p.legacyPlantId || p.plantaId,
          plantaId: canonicalId || p.plantaId,
          plantaNombre: canonicalName || p.plantaNombre
        };
      });
      localStorage.setItem(STORAGE_KEYS.DB_PTW, JSON.stringify(updated));
    }

    // 7. Vehículos
    const vehRaw = localStorage.getItem(STORAGE_KEYS.VEHICULOS);
    if (vehRaw) {
      const vehs: any[] = JSON.parse(vehRaw);
      const updated = vehs.map((v) => {
        if (!v.plantaDestinoId && !v.plantaDestinoNombre) return v;
        const canonicalId = getCanonicalPlantId(v.plantaDestinoId || v.plantaDestinoNombre);
        const canonicalName = getCanonicalPlantName(canonicalId);
        return {
          ...v,
          legacyPlantId: v.legacyPlantId || v.plantaDestinoId,
          plantaDestinoId: canonicalId || v.plantaDestinoId,
          plantaDestinoNombre: canonicalName || v.plantaDestinoNombre
        };
      });
      localStorage.setItem(STORAGE_KEYS.VEHICULOS, JSON.stringify(updated));
    }

    localStorage.setItem(PLANT_IDENTITY_MIGRATION_KEY, 'true');
  } catch (err) {
    console.error('Error running plant identity migration 16B1:', err);
  }
}

/**
 * MÓDULO 16B.1B — Migración idónea para la reconciliación basada en evidencia.
 * Reconstriye las referencias según el estatus de la matriz de equivalencias,
 * desvinculando IDs canónicos forzados de plantas provisionales.
 */
export function runPlantIdentityReconciliation16B1B() {
  if (typeof window === 'undefined') return;
  const migrated = localStorage.getItem(PLANT_IDENTITY_RECONCILIATION_KEY);
  if (migrated === 'true') return;

  try {
    const reconcileItem = (item: any, idField = 'plantaId', nameField = 'plantaNombre') => {
      const rawLegacyId = item.legacyPlantId || item[idField];
      const rawName = item[nameField] || '';
      const entry = getPlantMappingEntry(rawLegacyId || rawName);

      if (
        entry &&
        entry.canonicalPlantId &&
        ['RESOLVED_EXACT', 'RESOLVED_ALIAS', 'RESOLVED_BY_UNIQUE_COMMUNE'].includes(entry.resolutionStatus)
      ) {
        return {
          ...item,
          legacyPlantId: entry.legacyPlantId,
          [idField]: entry.canonicalPlantId,
          [nameField]: entry.canonicalPlantName || item[nameField]
        };
      } else if (entry) {
        return {
          ...item,
          legacyPlantId: entry.legacyPlantId,
          [idField]: entry.legacyPlantId,
          [nameField]: entry.legacyPlantName || item[nameField]
        };
      }
      return item;
    };

    const processStorageKey = (key: string, idField = 'plantaId', nameField = 'plantaNombre') => {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: any[] = JSON.parse(raw);
        const updated = parsed.map((item) => reconcileItem(item, idField, nameField));
        localStorage.setItem(key, JSON.stringify(updated));
      }
    };

    processStorageKey(STORAGE_KEYS.OTS);
    processStorageKey(STORAGE_KEYS.HSE_CALIDAD);
    processStorageKey(STORAGE_KEYS.PLANIFICACION);
    processStorageKey(STORAGE_KEYS.DB_INVENTORY);
    processStorageKey(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS);
    processStorageKey(STORAGE_KEYS.DB_PTW);
    processStorageKey(STORAGE_KEYS.VEHICULOS, 'plantaDestinoId', 'plantaDestinoNombre');

    localStorage.setItem(PLANT_IDENTITY_RECONCILIATION_KEY, 'true');
  } catch (err) {
    console.error('Error running plant identity reconciliation 16B1B:', err);
  }
}

/**
 * MÓDULO 16B.1D — Migración final idónea e idempotente.
 * Clave de versión: orbi_data_migration_16b1d_plant_identity_final_v1
 */
export function runPlantIdentityFinalMigration16B1D(force = false) {
  if (typeof window === 'undefined') return null;
  const migrated = localStorage.getItem(PLANT_IDENTITY_FINAL_MIGRATION_KEY);
  if (migrated === 'true' && !force) {
    const savedReport = localStorage.getItem('orbi_data_migration_16b1d_report_v1');
    if (savedReport) {
      try { return JSON.parse(savedReport); } catch (_) {}
    }
  }

  const migrationResults: Record<string, { revisados: number; modificados: number; sinModificacion: number; conError: number }> = {};

  try {
    const reconcileItem = (item: any, idField = 'plantaId', nameField = 'plantaNombre') => {
      const rawLegacyId = item.legacyPlantId || item[idField];
      const rawName = item[nameField] || '';
      const entry = getPlantMappingEntry(rawLegacyId || rawName);

      let isModified = false;
      let newItem = { ...item };

      if (
        entry &&
        entry.canonicalPlantId &&
        ['RESOLVED_EXACT', 'RESOLVED_ALIAS', 'RESOLVED_BY_UNIQUE_COMMUNE'].includes(entry.resolutionStatus)
      ) {
        const targetName = entry.canonicalPlantName || item[nameField];
        if (item.legacyPlantId !== entry.legacyPlantId || item[idField] !== entry.canonicalPlantId || item[nameField] !== targetName) {
          isModified = true;
          newItem = {
            ...item,
            legacyPlantId: entry.legacyPlantId,
            [idField]: entry.canonicalPlantId,
            [nameField]: targetName
          };
        }
      } else if (entry) {
        const targetName = entry.legacyPlantName || item[nameField];
        if (item.legacyPlantId !== entry.legacyPlantId || item[idField] !== entry.legacyPlantId || item[nameField] !== targetName) {
          isModified = true;
          newItem = {
            ...item,
            legacyPlantId: entry.legacyPlantId,
            [idField]: entry.legacyPlantId,
            [nameField]: targetName
          };
        }
      }

      return { newItem, isModified };
    };

    const processStorageKey = (key: string, idField = 'plantaId', nameField = 'plantaNombre') => {
      const raw = localStorage.getItem(key);
      if (!raw) {
        migrationResults[key] = { revisados: 0, modificados: 0, sinModificacion: 0, conError: 0 };
        return;
      }

      try {
        const parsed: any[] = JSON.parse(raw);
        let modCount = 0;
        let sameCount = 0;

        const updated = parsed.map((item) => {
          const { newItem, isModified } = reconcileItem(item, idField, nameField);
          if (isModified) modCount++;
          else sameCount++;
          return newItem;
        });

        localStorage.setItem(key, JSON.stringify(updated));
        migrationResults[key] = {
          revisados: parsed.length,
          modificados: modCount,
          sinModificacion: sameCount,
          conError: 0
        };
      } catch (err) {
        migrationResults[key] = { revisados: 0, modificados: 0, sinModificacion: 0, conError: 1 };
      }
    };

    processStorageKey(STORAGE_KEYS.OTS);
    processStorageKey(STORAGE_KEYS.HSE_CALIDAD);
    processStorageKey(STORAGE_KEYS.PLANIFICACION);
    processStorageKey(STORAGE_KEYS.DB_INVENTORY);
    processStorageKey(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS);
    processStorageKey(STORAGE_KEYS.DB_PTW);
    processStorageKey(STORAGE_KEYS.VEHICULOS, 'plantaDestinoId', 'plantaDestinoNombre');

    localStorage.setItem(PLANT_IDENTITY_FINAL_MIGRATION_KEY, 'true');

    const report = {
      timestamp: new Date().toISOString(),
      versionKey: PLANT_IDENTITY_FINAL_MIGRATION_KEY,
      resultsByStorageKey: migrationResults,
      integrity: generatePlantIdentityIntegrityReport({
        ots: JSON.parse(localStorage.getItem(STORAGE_KEYS.OTS) || '[]'),
        hse: JSON.parse(localStorage.getItem(STORAGE_KEYS.HSE_CALIDAD) || '[]'),
        planificacion: JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANIFICACION) || '[]'),
        inventory: JSON.parse(localStorage.getItem(STORAGE_KEYS.DB_INVENTORY) || '[]'),
        movements: JSON.parse(localStorage.getItem(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS) || '[]'),
        ptws: JSON.parse(localStorage.getItem(STORAGE_KEYS.DB_PTW) || '[]'),
        vehiculos: JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICULOS) || '[]')
      })
    };

    localStorage.setItem('orbi_data_migration_16b1d_report_v1', JSON.stringify(report));
    return report;
  } catch (err) {
    console.error('Error running plant identity final migration 16B1D:', err);
    return null;
  }
}

/**
 * MÓDULO 16B.1E — Migración de endurecimiento de contratos e identificación de namespace.
 * Clave de versión: orbi_data_migration_16b1e_plant_identity_hardening_v1
 */
export function runPlantIdentityHardeningMigration16B1E(force = false) {
  if (typeof window === 'undefined') return null;
  const migrated = localStorage.getItem(PLANT_IDENTITY_HARDENING_MIGRATION_KEY);
  if (migrated === 'true' && !force) {
    const savedReport = localStorage.getItem('orbi_data_migration_16b1e_report_v1');
    if (savedReport) {
      try { return JSON.parse(savedReport); } catch (_) {}
    }
  }

  const migrationResults: Record<string, { revisados: number; modificados: number; sinModificacion: number; conError: number }> = {};

  try {
    const reconcileItem = (item: any, idField = 'plantaId', nameField = 'plantaNombre') => {
      const rawLegacyId = item.legacyPlantId || item[idField];
      const rawName = item[nameField] || '';
      const entry = getPlantMappingEntry(rawLegacyId || rawName);

      let isModified = false;
      let newItem = { ...item };

      if (
        entry &&
        entry.canonicalPlantId &&
        ['RESOLVED_EXACT', 'RESOLVED_ALIAS', 'RESOLVED_BY_UNIQUE_COMMUNE'].includes(entry.resolutionStatus)
      ) {
        const targetName = entry.canonicalPlantName || item[nameField];
        if (item.legacyPlantId !== entry.legacyPlantId || item[idField] !== entry.canonicalPlantId || item[nameField] !== targetName) {
          isModified = true;
          newItem = {
            ...item,
            legacyPlantId: entry.legacyPlantId,
            [idField]: entry.canonicalPlantId,
            [nameField]: targetName
          };
        }
      } else if (entry) {
        const targetName = entry.legacyPlantName || item[nameField];
        if (item.legacyPlantId !== entry.legacyPlantId || item[idField] !== entry.legacyPlantId || item[nameField] !== targetName || 'canonicalPlantId' in newItem) {
          isModified = true;
          newItem = {
            ...item,
            legacyPlantId: entry.legacyPlantId,
            [idField]: entry.legacyPlantId,
            [nameField]: targetName
          };
          delete newItem.canonicalPlantId;
        }
      } else if ('canonicalPlantId' in newItem) {
        isModified = true;
        delete newItem.canonicalPlantId;
      }

      return { newItem, isModified };
    };

    const processStorageKey = (key: string, idField = 'plantaId', nameField = 'plantaNombre') => {
      const raw = localStorage.getItem(key);
      if (!raw) {
        migrationResults[key] = { revisados: 0, modificados: 0, sinModificacion: 0, conError: 0 };
        return;
      }

      try {
        const parsed: any[] = JSON.parse(raw);
        let modCount = 0;
        let sameCount = 0;

        const updated = parsed.map((item) => {
          const { newItem, isModified } = reconcileItem(item, idField, nameField);
          if (isModified) modCount++;
          else sameCount++;
          return newItem;
        });

        localStorage.setItem(key, JSON.stringify(updated));
        migrationResults[key] = {
          revisados: parsed.length,
          modificados: modCount,
          sinModificacion: sameCount,
          conError: 0
        };
      } catch (err) {
        migrationResults[key] = { revisados: 0, modificados: 0, sinModificacion: 0, conError: 1 };
      }
    };

    processStorageKey(STORAGE_KEYS.OTS);
    processStorageKey(STORAGE_KEYS.HSE_CALIDAD);
    processStorageKey(STORAGE_KEYS.PLANIFICACION);
    processStorageKey(STORAGE_KEYS.DB_INVENTORY);
    processStorageKey(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS);
    processStorageKey(STORAGE_KEYS.DB_PTW);
    processStorageKey(STORAGE_KEYS.VEHICULOS, 'plantaDestinoId', 'plantaDestinoNombre');

    localStorage.setItem(PLANT_IDENTITY_HARDENING_MIGRATION_KEY, 'true');

    const report = {
      timestamp: new Date().toISOString(),
      versionKey: PLANT_IDENTITY_HARDENING_MIGRATION_KEY,
      resultsByStorageKey: migrationResults,
      integrity: generatePlantIdentityIntegrityReport({
        ots: JSON.parse(localStorage.getItem(STORAGE_KEYS.OTS) || '[]'),
        hse: JSON.parse(localStorage.getItem(STORAGE_KEYS.HSE_CALIDAD) || '[]'),
        planificacion: JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANIFICACION) || '[]'),
        inventory: JSON.parse(localStorage.getItem(STORAGE_KEYS.DB_INVENTORY) || '[]'),
        movements: JSON.parse(localStorage.getItem(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS) || '[]'),
        ptws: JSON.parse(localStorage.getItem(STORAGE_KEYS.DB_PTW) || '[]'),
        vehiculos: JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICULOS) || '[]')
      })
    };

    localStorage.setItem('orbi_data_migration_16b1e_report_v1', JSON.stringify(report));
    return report;
  } catch (err) {
    console.error('Error running plant identity hardening migration 16B1E:', err);
    return null;
  }
}

/**
 * MÓDULO 16B.1F — Migración de cierre de taxonomía de scope y saneamiento de campos obsoletos.
 * Clave de versión: orbi_data_migration_16b1f_plant_scope_closure_v1
 */
export function runPlantIdentityScopeClosureMigration16B1F(force = false) {
  if (typeof window === 'undefined') return null;
  const migrated = localStorage.getItem(PLANT_IDENTITY_SCOPE_CLOSURE_MIGRATION_KEY);
  if (migrated === 'true' && !force) {
    const savedReport = localStorage.getItem('orbi_data_migration_16b1f_report_v1');
    if (savedReport) {
      try { return JSON.parse(savedReport); } catch (_) {}
    }
  }

  const migrationResults: Record<string, { revisados: number; modificados: number; sinModificacion: number; conError: number }> = {};

  try {
    const reconcileScopeAndCleanItem = (item: any, idField = 'plantaId', nameField = 'plantaNombre') => {
      const pId = item[idField] || '';
      const legId = item.legacyPlantId || pId;
      const pName = item[nameField] || '';

      let isModified = false;
      let newItem = { ...item };

      const calculatedScope = getPlantRecordScope({
        plantaId: pId,
        legacyPlantId: legId,
        plantaNombre: pName,
        recordScope: item.recordScope
      });

      if (newItem.recordScope !== calculatedScope) {
        newItem.recordScope = calculatedScope;
        isModified = true;
      }

      const entry = getPlantMappingEntry(legId || pId || pName);
      const resStatus = entry ? entry.resolutionStatus : (getCanonicalPlantId(pId || pName) ? 'RESOLVED_EXACT' : 'UNRESOLVED');

      // Limpiar campos obsoletos canonicalPlantId y canonicalPlantName si no están totalmente resueltos
      if (['PROVISIONAL', 'UNRESOLVED', 'HISTORICAL_EXTERNAL'].includes(resStatus) || !entry?.canonicalPlantId) {
        if ('canonicalPlantId' in newItem) {
          delete newItem.canonicalPlantId;
          isModified = true;
        }
        if ('canonicalPlantName' in newItem) {
          delete newItem.canonicalPlantName;
          isModified = true;
        }
      }

      return { newItem, isModified };
    };

    const processStorageKey = (key: string, idField = 'plantaId', nameField = 'plantaNombre') => {
      const raw = localStorage.getItem(key);
      if (!raw) {
        migrationResults[key] = { revisados: 0, modificados: 0, sinModificacion: 0, conError: 0 };
        return;
      }

      try {
        const parsed: any[] = JSON.parse(raw);
        let modCount = 0;
        let sameCount = 0;

        const updated = parsed.map((item) => {
          const { newItem, isModified } = reconcileScopeAndCleanItem(item, idField, nameField);
          if (isModified) modCount++;
          else sameCount++;
          return newItem;
        });

        localStorage.setItem(key, JSON.stringify(updated));
        migrationResults[key] = {
          revisados: parsed.length,
          modificados: modCount,
          sinModificacion: sameCount,
          conError: 0
        };
      } catch (err) {
        migrationResults[key] = { revisados: 0, modificados: 0, sinModificacion: 0, conError: 1 };
      }
    };

    processStorageKey(STORAGE_KEYS.OTS);
    processStorageKey(STORAGE_KEYS.HSE_CALIDAD);
    processStorageKey(STORAGE_KEYS.PLANIFICACION);
    processStorageKey(STORAGE_KEYS.DB_INVENTORY);
    processStorageKey(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS);
    processStorageKey(STORAGE_KEYS.DB_PTW);
    processStorageKey(STORAGE_KEYS.VEHICULOS, 'plantaDestinoId', 'plantaDestinoNombre');

    localStorage.setItem(PLANT_IDENTITY_SCOPE_CLOSURE_MIGRATION_KEY, 'true');

    const report = {
      timestamp: new Date().toISOString(),
      versionKey: PLANT_IDENTITY_SCOPE_CLOSURE_MIGRATION_KEY,
      resultsByStorageKey: migrationResults,
      integrity: generatePlantIdentityIntegrityReport({
        ots: JSON.parse(localStorage.getItem(STORAGE_KEYS.OTS) || '[]'),
        hse: JSON.parse(localStorage.getItem(STORAGE_KEYS.HSE_CALIDAD) || '[]'),
        planificacion: JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANIFICACION) || '[]'),
        inventory: JSON.parse(localStorage.getItem(STORAGE_KEYS.DB_INVENTORY) || '[]'),
        movements: JSON.parse(localStorage.getItem(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS) || '[]'),
        ptws: JSON.parse(localStorage.getItem(STORAGE_KEYS.DB_PTW) || '[]'),
        vehiculos: JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICULOS) || '[]')
      })
    };

    localStorage.setItem('orbi_data_migration_16b1f_report_v1', JSON.stringify(report));
    return report;
  } catch (err) {
    console.error('Error running plant identity scope closure migration 16B1F:', err);
    return null;
  }
}

export { validateOperationalPlantReferences, generatePlantIdentityIntegrityReport };

// Ejecutar migración al cargar
if (typeof window !== 'undefined') {
  checkAndMigrateSchema();
}

// Funciones Auxiliares para Persistencia
export const getActiveRole = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) || 'JEFE_OM';
  }
  return 'JEFE_OM';
};

export const saveActiveRole = (role: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
    // Cambiar también el nombre predeterminado de usuario según el rol
    const organigrama = loadOrganigrama();
    const userForRole = organigrama.find((u) => u.role === role);
    if (userForRole) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_NAME, userForRole.name);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_NAME, 'Usuario Demostración');
    }
  }
};

export const getActiveUserName = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_NAME) || 'Felipe Soto';
  }
  return 'Felipe Soto';
};

export const loadOrganigrama = (): OrganigramaNode[] => {
  return loadOrganigramaFromStorage() as OrganigramaNode[];
};

export const saveOrganigrama = (data: OrganigramaNode[]) => {
  saveOrganigramaToStorage(data as any);
};

export const loadPlantas = (): Planta[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.PLANTAS);
    if (data) {
      try {
        const parsed: Planta[] = JSON.parse(data);
        const map = new Map<string, Planta>();
        // Base initialization with canonical master plants
        INITIAL_PLANTAS.forEach(p => {
          map.set(p.orbi_id || p.id, { ...p });
        });
        // Upsert stored plants
        parsed.forEach(p => {
          const key = p.orbi_id || p.id;
          if (map.has(key)) {
            map.set(key, { ...map.get(key)!, ...p });
          } else {
            map.set(key, p);
          }
        });
        const merged = Array.from(map.values());
        localStorage.setItem(STORAGE_KEYS.PLANTAS, JSON.stringify(merged));
        return merged;
      } catch (e) {
        console.error('Error parsing stored plantas:', e);
      }
    }
    localStorage.setItem(STORAGE_KEYS.PLANTAS, JSON.stringify(INITIAL_PLANTAS));
  }
  return INITIAL_PLANTAS;
};

export const savePlantas = (data: Planta[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PLANTAS, JSON.stringify(data));
  }
};

export const loadOTs = (): OT[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.OTS);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.OTS, JSON.stringify(INITIAL_OTS));
  }
  return INITIAL_OTS;
};

export const saveOTs = (data: OT[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.OTS, JSON.stringify(data));
  }
};

export const loadHSECalidad = (): HSEFinding[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.HSE_CALIDAD);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.HSE_CALIDAD, JSON.stringify(INITIAL_HSE_CALIDAD));
  }
  return INITIAL_HSE_CALIDAD;
};

export const saveHSECalidad = (data: HSEFinding[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.HSE_CALIDAD, JSON.stringify(data));
  }
};

export const loadPlanificacion = (): PlanPreventivo[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.PLANIFICACION);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.PLANIFICACION, JSON.stringify(INITIAL_PLANIFICACION));
  }
  return INITIAL_PLANIFICACION;
};

export const savePlanificacion = (data: PlanPreventivo[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PLANIFICACION, JSON.stringify(data));
  }
};

export const loadVehiculos = (): Vehiculo[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.VEHICULOS);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.VEHICULOS, JSON.stringify(INITIAL_VEHICULOS));
  }
  return INITIAL_VEHICULOS;
};

export const saveVehiculos = (data: Vehiculo[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.VEHICULOS, JSON.stringify(data));
  }
};

export const loadRecursosPersonas = (): RecursoPersona[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.RECURSOS_PERSONAS);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.RECURSOS_PERSONAS, JSON.stringify(INITIAL_RECURSOS_PERSONAS));
  }
  return INITIAL_RECURSOS_PERSONAS;
};

export const saveRecursosPersonas = (data: RecursoPersona[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.RECURSOS_PERSONAS, JSON.stringify(data));
  }
};

export const loadRepuestos = (): Repuesto[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.DB_REPUESTOS);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.DB_REPUESTOS, JSON.stringify(INITIAL_REPUESTOS));
  }
  return INITIAL_REPUESTOS;
};

export const saveRepuestos = (data: Repuesto[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.DB_REPUESTOS, JSON.stringify(data));
  }
};

export const loadHerramientas = (): Herramienta[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.DB_HERRAMIENTAS);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.DB_HERRAMIENTAS, JSON.stringify(INITIAL_HERRAMIENTAS));
  }
  return INITIAL_HERRAMIENTAS;
};

export const saveHerramientas = (data: Herramienta[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.DB_HERRAMIENTAS, JSON.stringify(data));
  }
};

export const loadAuditLog = (): AuditLogEvent[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.DB_AUDIT_LOG);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.DB_AUDIT_LOG, JSON.stringify(INITIAL_AUDIT_LOG));
  }
  return INITIAL_AUDIT_LOG;
};

export const saveAuditLog = (data: AuditLogEvent[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.DB_AUDIT_LOG, JSON.stringify(data));
  }
};

export const loadEscalaciones = (): Escalation[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.DB_ESCALAMIENTOS);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.DB_ESCALAMIENTOS, JSON.stringify(INITIAL_ESCALACIONES));
  }
  return INITIAL_ESCALACIONES;
};

export const saveEscalaciones = (data: Escalation[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.DB_ESCALAMIENTOS, JSON.stringify(data));
  }
};

export const loadPtws = (): PTW[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.DB_PTW);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.DB_PTW, JSON.stringify(INITIAL_PTWS));
  }
  return INITIAL_PTWS;
};

export const savePtws = (data: PTW[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.DB_PTW, JSON.stringify(data));
  }
};

// --- MÓDULO 6: INVENTARIO DE BAJO MOVIMIENTO O&M MOCK DATA & LOADER ---

export const INITIAL_INVENTORY: OMInventoryItem[] = [
  {
    id: 'INV-CANT-01',
    codigo: 'INV-CANT-01',
    descripcion: 'Fusible de Inversor Central 250A 1000V',
    plantaId: 'ORBI-PV-058',
    plantaNombre: 'Cantillana',
    legacyPlantId: 'P10',
    bodegaUbicacion: 'Bodega Principal Cantillana - Estante A1',
    categoria: 'Inversores',
    unidad: 'Unidad',
    stockActual: 4,
    stockMinimo: 5,
    criticidad: 'Alta',
    proveedor: 'Sungevity',
    ultimaActualizacion: '2026-07-01 10:30',
    estado: 'Bajo Mínimo'
  },
  {
    id: 'FUS-CANT-02',
    codigo: 'FUS-CANT-02',
    descripcion: 'Fusible DC gPV 15A 1500V',
    plantaId: 'ORBI-PV-058',
    plantaNombre: 'Cantillana',
    legacyPlantId: 'P10',
    bodegaUbicacion: 'Bodega Principal Cantillana - Cajón B3',
    categoria: 'Fusibles',
    unidad: 'Unidad',
    stockActual: 45,
    stockMinimo: 20,
    criticidad: 'Alta',
    proveedor: 'ABB',
    ultimaActualizacion: '2026-07-01 10:30',
    estado: 'Disponible'
  },
  {
    id: 'CON-CANT-03',
    codigo: 'CON-CANT-03',
    descripcion: 'Conectores MC4 Macho/Hembra',
    plantaId: 'ORBI-PV-058',
    plantaNombre: 'Cantillana',
    legacyPlantId: 'P10',
    bodegaUbicacion: 'Bodega Secundaria Cantillana - Caja C2',
    categoria: 'Conectores',
    unidad: 'Caja (50 u)',
    stockActual: 120,
    stockMinimo: 50,
    criticidad: 'Media',
    proveedor: 'Staubli',
    ultimaActualizacion: '2026-07-01 10:30',
    estado: 'Disponible'
  },
  {
    id: 'TRK-CANT-04',
    codigo: 'TRK-CANT-04',
    descripcion: 'Motor Tracker 24V DC',
    plantaId: 'ORBI-PV-058',
    plantaNombre: 'Cantillana',
    legacyPlantId: 'P10',
    bodegaUbicacion: 'Bodega Principal Cantillana - Palet D1',
    categoria: 'Tracker',
    unidad: 'Unidad',
    stockActual: 0,
    stockMinimo: 2,
    criticidad: 'Alta',
    proveedor: 'NextTracker',
    ultimaActualizacion: '2026-07-01 10:30',
    estado: 'Sin Stock'
  },
  {
    id: 'INV-PARR-01',
    codigo: 'INV-PARR-01',
    descripcion: 'Filtro de Aire Inversor Central SG3125',
    plantaId: 'ORBI-PV-026',
    plantaNombre: 'Esmeralda (Bicentenario II)',
    legacyPlantId: 'P11',
    bodegaUbicacion: 'Contenedor O&M Parral - Estante Izquierdo',
    categoria: 'Inversores',
    unidad: 'Unidad',
    stockActual: 12,
    stockMinimo: 10,
    criticidad: 'Media',
    proveedor: 'Sungrow',
    ultimaActualizacion: '2026-05-15 09:00', // Update has been neglected (>30 days)
    estado: 'Disponible'
  },
  {
    id: 'SEN-PARR-02',
    codigo: 'SEN-PARR-02',
    descripcion: 'Piranómetro Smart SMP11',
    plantaId: 'ORBI-PV-026',
    plantaNombre: 'Esmeralda (Bicentenario II)',
    legacyPlantId: 'P11',
    bodegaUbicacion: 'Contenedor O&M Parral - Estante Superior',
    categoria: 'Sensores',
    unidad: 'Unidad',
    stockActual: 1,
    stockMinimo: 1,
    criticidad: 'Alta',
    proveedor: 'Kipp & Zonen',
    ultimaActualizacion: '2026-05-15 09:00', // Update has been neglected (>30 days)
    estado: 'Disponible'
  },
  {
    id: 'COM-ALHU-01',
    codigo: 'COM-ALHU-01',
    descripcion: 'Switch Ethernet Industrial 8 Puertos',
    plantaId: 'ORBI-PV-038',
    plantaNombre: 'Alhué',
    legacyPlantId: 'P12',
    bodegaUbicacion: 'Oficina O&M Alhué - Gaveta Redes',
    categoria: 'CCTV / comunicaciones',
    unidad: 'Unidad',
    stockActual: 2,
    stockMinimo: 3,
    criticidad: 'Alta',
    proveedor: 'Moxa',
    ultimaActualizacion: '2026-07-02 11:15',
    estado: 'Bajo Mínimo'
  },
  {
    id: 'PRO-ALHU-02',
    codigo: 'PRO-ALHU-02',
    descripcion: 'Descargador de Sobretensiones SPD Tipo 2 DC',
    plantaId: 'ORBI-PV-038',
    plantaNombre: 'Alhué',
    legacyPlantId: 'P12',
    bodegaUbicacion: 'Oficina O&M Alhué - Cajonera Eléctrica',
    categoria: 'Protecciones',
    unidad: 'Unidad',
    stockActual: 0,
    stockMinimo: 5,
    criticidad: 'Crítica',
    proveedor: 'Phoenix Contact',
    ultimaActualizacion: '2026-07-02 11:15',
    estado: 'Sin Stock'
  },
  {
    id: 'CON-VENE-01',
    codigo: 'CON-VENE-01',
    descripcion: 'Conectores MC4 Especiales 1500V',
    plantaId: 'ORBI-PV-024',
    plantaNombre: 'PMG Venezia',
    legacyPlantId: 'P13',
    bodegaUbicacion: 'Bodega Móvil Venezia',
    categoria: 'Conectores',
    unidad: 'Caja (50 u)',
    stockActual: 15,
    stockMinimo: 30,
    criticidad: 'Baja',
    proveedor: 'Staubli',
    ultimaActualizacion: '2026-06-28 14:00',
    estado: 'Bajo Mínimo'
  },
  {
    id: 'CNS-TRIC-01',
    codigo: 'CNS-TRIC-01',
    descripcion: 'Cinta Aisladora 3M Super 33+',
    plantaId: 'ORBI-PV-011',
    plantaNombre: 'Tricahue',
    legacyPlantId: 'P14',
    bodegaUbicacion: 'Bodega Tricague - Estante C',
    categoria: 'Consumibles eléctricos',
    unidad: 'Unidad',
    stockActual: 35,
    stockMinimo: 10,
    criticidad: 'Baja',
    proveedor: '3M',
    ultimaActualizacion: '2026-07-04 15:30',
    estado: 'Disponible'
  },
  {
    id: 'HER-TRIC-02',
    codigo: 'HER-TRIC-02',
    descripcion: 'Multímetro Digital Fluke 87V',
    plantaId: 'ORBI-PV-011',
    plantaNombre: 'Tricahue',
    legacyPlantId: 'P14',
    bodegaUbicacion: 'Caja de Herramientas Camioneta Tricague',
    categoria: 'Herramientas menores',
    unidad: 'Unidad',
    stockActual: 2,
    stockMinimo: 2,
    criticidad: 'Alta',
    proveedor: 'Fluke',
    ultimaActualizacion: '2026-07-04 15:30',
    estado: 'Disponible'
  }
];

export const INITIAL_INVENTORY_MOVEMENTS: OMInventoryMovement[] = [
  {
    id: 'MOV-001',
    itemCodigo: 'FUS-CANT-02',
    itemDescripcion: 'Fusible DC gPV 15A 1500V',
    plantaId: 'ORBI-PV-058',
    plantaNombre: 'Cantillana',
    legacyPlantId: 'P10',
    tipoMovimiento: 'Consumo por OT',
    otAsociada: 'OT-26-29221',
    tecnico: 'Víctor León',
    cantidad: 5,
    stockAnterior: 50,
    stockFinal: 45,
    fecha: '2026-07-06 14:30',
    observacion: 'Consumo registrado por reparación de falla de strings en Inversor INV-05.'
  },
  {
    id: 'MOV-002',
    itemCodigo: 'CNS-TRIC-01',
    itemDescripcion: 'Cinta Aisladora 3M Super 33+',
    plantaId: 'ORBI-PV-011',
    plantaNombre: 'Tricahue',
    legacyPlantId: 'P14',
    tipoMovimiento: 'Ingreso de repuesto',
    cantidad: 20,
    stockAnterior: 15,
    stockFinal: 35,
    fecha: '2026-07-01 09:15',
    observacion: 'Abastecimiento de insumos eléctricos desde bodega central.'
  },
  {
    id: 'MOV-003',
    itemCodigo: 'INV-CANT-01',
    itemDescripcion: 'Fusible de Inversor Central 250A 1000V',
    plantaId: 'ORBI-PV-058',
    plantaNombre: 'Cantillana',
    legacyPlantId: 'P10',
    tipoMovimiento: 'Baja por daño',
    cantidad: 1,
    stockAnterior: 5,
    stockFinal: 4,
    fecha: '2026-07-03 16:45',
    observacion: 'Detección de daño físico (ruptura de loza) durante inspección visual de repuestos.'
  },
  {
    id: 'MOV-004',
    itemCodigo: 'CON-CANT-03',
    itemDescripcion: 'Conectores MC4 Macho/Hembra',
    plantaId: 'ORBI-PV-058',
    plantaNombre: 'Cantillana',
    legacyPlantId: 'P10',
    tipoMovimiento: 'Traslado entre plantas',
    cantidad: 10,
    stockAnterior: 130,
    stockFinal: 120,
    fecha: '2026-07-05 11:00',
    observacion: 'Traslado de conectores a planta Alhué para correctivo urgente.'
  }
];

export const loadInventory = (): OMInventoryItem[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.DB_INVENTORY);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.DB_INVENTORY, JSON.stringify(INITIAL_INVENTORY));
  }
  return INITIAL_INVENTORY;
};

export const saveInventory = (data: OMInventoryItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.DB_INVENTORY, JSON.stringify(data));
  }
};

export const loadInventoryMovements = (): OMInventoryMovement[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS, JSON.stringify(INITIAL_INVENTORY_MOVEMENTS));
  }
  return INITIAL_INVENTORY_MOVEMENTS;
};

export const saveInventoryMovements = (data: OMInventoryMovement[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS, JSON.stringify(data));
  }
};

// Resetear bases de datos a estado original
export const resetAllDatabases = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.SCHEMA_VERSION);
    localStorage.removeItem(STORAGE_KEYS.ORGANIGRAMA);
    localStorage.removeItem(STORAGE_KEYS.PLANTAS);
    localStorage.removeItem(STORAGE_KEYS.OTS);
    localStorage.removeItem(STORAGE_KEYS.HSE_CALIDAD);
    localStorage.removeItem(STORAGE_KEYS.PLANIFICACION);
    localStorage.removeItem(STORAGE_KEYS.VEHICULOS);
    localStorage.removeItem(STORAGE_KEYS.RECURSOS_PERSONAS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.DB_REPUESTOS);
    localStorage.removeItem(STORAGE_KEYS.DB_HERRAMIENTAS);
    localStorage.removeItem(STORAGE_KEYS.DB_AUDIT_LOG);
    localStorage.removeItem(STORAGE_KEYS.DB_ESCALAMIENTOS);
    localStorage.removeItem(STORAGE_KEYS.DB_PTW);
    localStorage.removeItem(STORAGE_KEYS.DB_INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.DB_INVENTORY_MOVEMENTS);
    window.location.reload();
  }
};
