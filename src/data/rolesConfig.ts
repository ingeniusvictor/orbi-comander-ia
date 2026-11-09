/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoleConfig } from '../types';

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
