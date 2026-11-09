/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoleType =
  | 'SUPER_ADMIN_ORBI'
  | 'GERENCIA'
  | 'JEFE_OM'
  | 'COORDINADOR_OM'
  | 'SUPERVISOR_TERRENO'
  | 'INGENIERO_OM'
  | 'TECNICO_OM'
  | 'HSE'
  | 'CALIDAD'
  | 'PLANIFICACION'
  | 'COMISIONAMIENTO'
  | 'LECTURA_CLIENTE';

export interface RoleConfig {
  id: RoleType;
  title: string;
  scope: string;
  badgeColor: string;
  suggestedView: string;
  permissions: string[];
}

export interface HseCert {
  id: string;
  name: string;
  expirationDate: string;
  notes?: string;
}

export type AreaOM = 
  | 'Gerencia'
  | 'Planificación & Control'
  | 'Control Gestión, Calidad & HSE'
  | 'Zona Norte'
  | 'Zona Centro'
  | 'Zona Sur'
  | 'Centro de Control'
  | 'Comisionamiento & MT'
  | 'Limpieza';

export type NivelJerarquico = 1 | 2 | 3 | 4;

export interface Persona {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  area: AreaOM;
  level: NivelJerarquico;
  vehiculo?: string;
  plantas?: string[];
  hseCerts?: HseCert[];
  reportsTo?: string;
  jefaturaDirecta?: string;
  activo?: boolean;
  zona?: 'Norte' | 'Centro' | 'Sur' | 'Todas';
  otActivasCount?: number;
  hhAsignadas?: number;
}

export interface OrganigramaNode {
  id: string;
  role: RoleType | string;
  name: string;
  email?: string;
  phone?: string;
  reportsTo?: string;
  zona?: 'Norte' | 'Centro' | 'Sur' | 'Todas';
  activo?: boolean;
  otActivasCount?: number;
  hhAsignadas?: number;
  jefaturaDirecta?: string;
  nivelJerarquico?: number;
  area?: AreaOM;
  level?: NivelJerarquico;
  vehiculo?: string;
  plantas?: string[];
  hseCerts?: HseCert[];
}

export interface Planta {
  id: string; // orbi_id (e.g., 'ORBI-PV-001')
  orbi_id: string;
  name: string; // plant_name
  plant_name?: string;
  portfolio?: string;
  cliente: string;
  client?: string;
  aliases?: string[];
  commune?: string;
  region: string;
  country?: string;
  asset_type?: string;
  zona: 'Norte' | 'Centro' | 'Sur';
  mwp: number;
  supervisor: string;
  ingeniero: string;
  estado: 'Operacional' | 'Limitada' | 'Fuera de Servicio' | 'En Mantenimiento' | 'Pendiente' | string;
  ultimoMantenimiento: string;
  proximoMantenimiento: string;
  criticidad: 'Alta' | 'Media' | 'Baja' | 'Sin validar';
  linkDocumental: string;

  // Rich Master Database Attributes
  data_level: 'Enriquecida' | 'Base inicial';
  review_status?: string;
  tracker?: string;
  inverter_model?: string;
  inverter_quantity?: string;
  internal_power_mw?: number | null;
  public_name_cen?: string;
  public_ac_mw?: number | null;
  construction_dc_mwp?: number | null;
  meter?: string;
  recloser?: string;
  recloser_mount?: string;
  internal_distributor?: string;
  public_distributor?: string;
  public_owner?: string;
  substation?: string;
  feeder?: string;
  transformer?: string;
  public_status?: string;
  maps_url?: string;
  confidence: 'Alta' | 'Media' | 'Baja' | 'Sin validar';
  validation_note?: string;
  source_urls?: string[];
  scada?: {
    status: string;
    platform?: string;
    notes?: string;
  };
  meteorology?: {
    status: string;
    station_count?: number | null;
    logger?: string;
    wind_telemetry?: any;
    notes?: string;
  };
  cctv?: {
    status: string;
    camera_count?: number | null;
    ptz_count?: number | null;
    notes?: string;
  };
  communications?: {
    status: string;
    primary_link?: string;
    backup_link?: string;
    notes?: string;
  };
  operational_risk?: {
    level: string;
    main_risks?: string[];
  };
  credentials_included: boolean;
  last_master_update?: string;
}

export type OTType =
  | 'Preventiva'
  | 'Correctiva'
  | 'Emergencia'
  | 'HSE'
  | 'Calidad'
  | 'Comisionamiento'
  | 'Inspección'
  | 'Cliente'
  | 'Evento desde Centro de Control'
  | 'Repuesto pendiente';

export type OTPrioridad = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export type OTEstado =
  | 'Borrador'
  | 'Nueva'
  | 'En revisión'
  | 'Asignada'
  | 'Programada'
  | 'En preparación'
  | 'En ruta'
  | 'En terreno'
  | 'En ejecución'
  | 'En espera de repuesto'
  | 'En espera de cliente'
  | 'Bloqueada'
  | 'Lista para revisión'
  | 'En revisión Supervisor'
  | 'En revisión Coordinador'
  | 'En revisión HSE'
  | 'En revisión Calidad'
  | 'Pendiente aprobación Jefe O&M'
  | 'Devuelta a ejecución'
  | 'Finalizada'
  | 'Cerrada'
  | 'Reabierta'
  | 'Cancelada';

export interface OTEvidencia {
  url: string;
  descripcion: string;
  fecha: string;
  nombreArchivo: string;
}

export interface OTHistorial {
  fecha: string;
  usuario: string;
  accion: string;
  detalle: string;
}

export interface OT {
  codigo: string;
  plantaId: string;
  plantaNombre: string;
  legacyPlantId?: string;
  activo: string;
  tipo: OTType;
  prioridad: OTPrioridad;
  criticidad: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  responsable: string; // Técnico u Ingeniero
  coordinador: string; // Coordinador O&M
  supervisor: string; // Supervisor Terreno
  fechaInicio: string;
  fechaLimite: string;
  estado: OTEstado;
  avance: number; // 0 - 100
  hhEstimadas: number;
  hhReales: number;
  evidencias?: OTEvidencia[] | null;
  evidencia?: OTEvidencia | null; // For backward compatibility
  observaciones: string;
  repuestos?: string[];
  bloqueada?: boolean;
  motivoBloqueo?: string;
  escalada?: boolean;
  motivoEscalamiento?: string;
  origen:
    | 'Manual Jefe O&M'
    | 'Coordinador O&M'
    | 'Supervisor Terreno'
    | 'Centro de Control'
    | 'HSE'
    | 'Calidad'
    | 'Cliente'
    | 'Preventivo programado';
  impacto: 'Sin impacto' | 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  riesgoDisponibilidad: 'No aplica' | 'En observación' | 'Riesgo medio' | 'Riesgo alto' | 'Riesgo crítico';
  historialCambios?: OTHistorial[];
  estadoCierre?: string; // For backward compatibility

  // Extended fields for v0.1.2A
  templateId?: string;
  origenOT?: string;
  diagnosticoInicial?: string;
  impactoOperacional?: string;
  riesgoHSE?: string;
  riesgoCalidad?: string;
  afectaProduccion?: boolean;
  afectaSLA?: boolean;
  jefeOM?: string;
  coordinadorOM?: string;
  supervisorTerreno?: string;
  tecnicoAsignado?: string;
  areaTransversal?: string;
  fechaProgramada?: string;
  horaInicioEstimada?: string;
  horaTerminoEstimada?: string;
  ventanaTrabajo?: string;
  dependencias?: string;
  requiereProgramacionWorkspace?: boolean;
  vehiculoRequerido?: boolean;
  vehiculoSugerido?: string;
  herramientasRequeridas?: string[];
  repuestosRequeridos?: string[];
  instrumentosRequeridas?: string[]; // can map to repuestos/herramientas
  bloqueoPorRecurso?: boolean;
  observacionLogistica?: string;
  requiereAST?: boolean;
  astFirmado?: boolean;
  requierePermisoTrabajo?: boolean;
  requiereValidacionHSE?: boolean;
  validacionHSE?: 'Pendiente' | 'Aprobado' | 'Rechazado';
  requiereValidacionCalidad?: boolean;
  validacionCalidad?: 'Pendiente' | 'Aprobado' | 'Rechazado';
  requiereEvidencia?: boolean;
  requiereChecklist?: boolean;
  checklist?: { item: string; completado: boolean }[];
  approvals?: { rol: string; nombre: string; fecha: string; comentario?: string }[];
  lifecycleHistory?: { estadoAnterior?: OTEstado; estadoNuevo: OTEstado; fecha: string; usuario: string; comentario?: string }[];
  closeSummary?: string;
  reopenedCount?: number;
  exportText?: string;

  // v0.1.2B Field Execution & Evidence Pack
  horaLlegadaSimulada?: string;
  llegadaConfirmada?: boolean;
  observacionLlegada?: string;
  riesgosDetectadosTerreno?: string;
  condicionInseguraTerreno?: string;
  permisoTrabajoNumero?: string;
  firmaEjecutorSimulada?: string;
  firmaSupervisorSimulada?: string;
  diagnosticoFinalTerreno?: string;
  accionRealizadaTerreno?: string;
  resultadoTerreno?: 'Exitoso' | 'Parcial' | 'No resuelto' | 'Requiere repuesto' | 'Requiere nueva visita' | 'Requiere escalamiento';
  propuestaCierreTerreno?: boolean;
  comentarioPropuestaCierre?: string;
  checklistExecution?: { item: string; completado: boolean; noAplica?: boolean; observacion?: string; hallazgo?: boolean; evidenciaRequerida?: boolean }[];
  evidencePack?: OTEvidencePackItem[];

  // v0.1.2C Closure, Approvals & Report Pack fields
  comentarioSupervisor?: string;
  comentarioCoordinador?: string;
  comentarioJefeOM?: string;
  comentarioHSE?: string;
  comentarioCalidad?: string;
  motivoDevolucion?: string;
  comentarioDevolucion?: string;
  detallesFaltantes?: string;
  firmaHSESimulada?: string;
  firmaCalidadSimulada?: string;
  fechaCierre?: string;

  // SharePoint Router Mock Fields
  sharepointStatus?: 'Pendiente de preparar' | 'Paquete preparado' | 'Pendiente SharePoint' | 'Respaldado' | 'Error de respaldo' | 'Duplicado detectado' | 'Requiere revisión';
  sharepointPath?: string;
  sharepointDate?: string;
  sharepointUser?: string;
  sharepointFiles?: string[];

  // Workspace scheduling & dispatch UX fields (Módulo 11B)
  reprogramacionesCount?: number;
  fechaOriginal?: string;
  ultimoMotivoReprogramacion?: string;
  ultimoUsuarioReprogramacion?: string;
}

export interface OTEvidencePackItem {
  evidenceId: string;
  otId: string;
  type: 'before' | 'during' | 'after' | 'hse' | 'quality' | 'close' | 'spare' | 'tool';
  label: string;
  description: string;
  simulatedFileName: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'Pendiente' | 'Cargada' | 'Incompleta' | 'Requiere revisión' | 'Aprobada' | 'Rechazada' | 'Completado';
  linkedChecklistItem?: string;
}

export interface HSEFindingType {
  id: string;
  tipo: 'HSE' | 'Calidad';
  plantaId: string;
  plantaNombre: string;
  categoria:
    | 'Condición Insegura'
    | 'Incidente'
    | 'AST'
    | 'Permiso de Trabajo'
    | 'Hallazgo de Calidad'
    | 'Acción Correctiva';
  descripcion: string;
  responsableCierre: string;
  fechaCompromiso: string;
  estado: 'Abierto' | 'En Revisión' | 'Cerrado';
  evidencia?: string;
  gravedad: 'Alta' | 'Media' | 'Baja';
}

export interface HSEFinding {
  id: string;
  tipo: 'HSE' | 'Calidad';
  plantaId: string;
  plantaNombre: string;
  legacyPlantId?: string;
  categoria: string;
  descripcion: string;
  responsableCierre: string;
  fechaCompromiso: string;
  estado: 'Abierto' | 'En Revisión' | 'Cerrado';
  evidencia?: string;
  gravedad: 'Alta' | 'Media' | 'Baja';
}

export interface PlanPreventivo {
  id: string;
  plantaId: string;
  plantaNombre: string;
  legacyPlantId?: string;
  actividad: string;
  mes: string;
  semana: number;
  estado: 'Programado' | 'En Curso' | 'Completado' | 'Atrasado';
  hhAsignadas: number;
  recursos: string;
  dependencias?: string;
  riesgos?: string;
}

export interface VehicleAssignmentMaster {
  assignee: string;
  zone: 'Sur' | 'Centro' | 'Norte' | 'Centro (Lavado)' | string;
  base_city: string;
  status: 'Asignado' | 'Pendiente entrega' | 'Pendiente patente' | string;
}

export interface VehicleLeasingMaster {
  company: 'Econorent' | 'Gama Leasing' | string;
  contract_reference: string | null;
  start_date: string | null;
  end_date: string | null;
  term_months: number | null;
  monthly_uf: number | null;
  contract_status: string;
}

export interface VehicleDeliveryMaster {
  date: string | null;
  status: 'Entregado' | 'Pendiente' | string;
}

export interface VehicleReplacementMaster {
  previous_provider: string | null;
  previous_plate: string | null;
  return_required: boolean;
}

export interface VehicleMaintenanceMaster {
  last_service_date: string | null;
  next_service_date: string | null;
  next_service_km: number | null;
  status: string;
}

export interface VehicleDocumentsMaster {
  soap_expiry: string | null;
  technical_inspection_expiry: string | null;
  circulation_permit_expiry: string | null;
  status: string;
}

export interface VehicleChecklistMaster {
  last_date: string | null;
  status: string;
  compliance_pct: number | null;
}

export interface VehicleGpsMaster {
  mode: 'sandbox' | string;
  real_gps_enabled: false | boolean;
  provider: string | null;
}

export interface VehicleIncidentsMaster {
  open_count: number;
  notes: string[];
}

export interface Vehiculo {
  id?: string;
  fleet_id?: string;
  portfolio?: string;
  patente: string;
  plate?: string | null;
  plate_display?: string | null;
  brand?: string;
  model?: string;
  modelo: string;
  vehicle_type?: string;
  drive?: string;
  fuel?: string;
  conductor?: string;
  personalAsociado?: string[];
  plantaDestinoId?: string;
  plantaDestinoNombre?: string;
  legacyPlantId?: string;
  zona: 'Norte' | 'Centro' | 'Sur' | 'Centro (Lavado)' | string;
  rutaSimulada?: string;
  horaSalida?: string;
  horaLlegadaEstimada?: string;
  herramientasRequeridas?: string[];
  repuestosRequeridos?: string[];
  estado:
    | 'Disponible'
    | 'Asignado'
    | 'En ruta'
    | 'En planta'
    | 'Retornando'
    | 'Bloqueado'
    | 'Mantención vehículo'
    | 'Sin recurso disponible'
    | 'Pendiente entrega'
    | 'Pendiente patente'
    | string;
  bloqueoLogistico?: string;
  otVinculada?: string;
  
  // Master Database fields
  assignment?: VehicleAssignmentMaster;
  leasing?: VehicleLeasingMaster;
  delivery?: VehicleDeliveryMaster;
  replacement?: VehicleReplacementMaster;
  odometer_km_last_known?: number | null;
  odometer_date?: string | null;
  operational_status?: string;
  maintenanceMaster?: VehicleMaintenanceMaster;
  documentsMaster?: VehicleDocumentsMaster;
  checklistMaster?: VehicleChecklistMaster;
  gpsMaster?: VehicleGpsMaster;
  incidentsMaster?: VehicleIncidentsMaster;
  data_quality?: 'Base inicial' | 'Enriquecida' | string;
  review_status?: string;
  personal_data_included?: boolean;
  source?: string;
  last_master_update?: string;
}

export interface RecursoPersona {
  id: string;
  nombre: string;
  rol: RoleType;
  zona: 'Norte' | 'Centro' | 'Sur' | 'Todas';
  plantasAsignadas: string[];
  otActivasCount: number;
  hhPlanificadas: number;
  hhReales: number;
  estadoDisponibilidad:
    | 'Disponible'
    | 'En terreno'
    | 'En ruta'
    | 'En oficina'
    | 'En descanso'
    | 'En capacitación'
    | 'No disponible';
  cargaSemanal: number;
  competencias: string[];
  jefaturaDirecta?: string;
  activo: boolean;
}

export interface Repuesto {
  id: string;
  nombre: string;
  categoria: string;
  stockSimulado: number;
  ubicacion: string;
  estado:
    | 'Disponible'
    | 'Reservado'
    | 'Asignado'
    | 'En terreno'
    | 'En mantención'
    | 'Pendiente compra'
    | 'Pendiente retiro'
    | 'Bloqueando OT';
  otVinculada?: string;
  plantaDestinoNombre?: string;
  responsable?: string;
  fechaRequerida?: string;
  criticidad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
}

export interface Herramienta {
  id: string;
  nombre: string;
  categoria: string;
  stockSimulado: number;
  ubicacion: string;
  estado:
    | 'Disponible'
    | 'Reservado'
    | 'Asignado'
    | 'En terreno'
    | 'En mantención'
    | 'Pendiente compra'
    | 'Pendiente retiro'
    | 'Bloqueando OT';
  otVinculada?: string;
  plantaDestinoNombre?: string;
  responsable?: string;
  fechaRequerida?: string;
  criticidad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
}

export interface AuditLogEvent {
  id: string;
  fechaHora: string;
  usuarioRol: string;
  accion: string;
  moduloOrigen: string;
  otVinculada?: string;
  plantaVinculada?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
  comentario: string;
  criticidad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
}

export interface Escalation {
  id: string;
  tipo: string;
  estado: 'Detectado' | 'En revisión' | 'Escalado' | 'En gestión' | 'Resuelto' | 'Cerrado';
  responsable: string;
  comentario: string;
  otVinculada?: string;
  plantaVinculada?: string;
  fechaHora: string;
  criticidad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  escaladoA: 'Jefe O&M' | 'Gerencia' | 'HSE' | 'Calidad' | 'Planificación' | 'Comisionamiento' | 'Logística / Bodega' | 'Cliente';
}

export type PTWEstado =
  | 'No requerido'
  | 'Borrador'
  | 'Pendiente apertura'
  | 'Apertura firmada'
  | 'En ejecución'
  | 'Pendiente cierre'
  | 'Cierre firmado'
  | 'En revisión supervisor'
  | 'Aprobado'
  | 'Rechazado / corregir'
  | 'Archivado';

export interface PTW {
  id: string; // e.g. PTS-CANT-2026-089
  codigo: string; // Same as id
  otCodigos: string[]; // Linked OTs
  tecnicos: string[]; // "Víctor León", "Rodrigo Cisterna", "Carrasco"
  plantaId: string;
  plantaNombre: string;
  legacyPlantId?: string;
  tipoTrabajo: string; // e.g. "PM Anual Inversores"
  fechaInicio: string; // e.g. "2026-07-05 08:30"
  fechaFin: string; // e.g. "2026-07-15 17:30"
  lugar: string;
  equipoIntervenir: string;
  alcance: string;
  observaciones: string;
  requiereAST: boolean;
  astAsociadoId?: string;
  astAsociadoComentario?: string;
  
  // Confirmations
  tecnicoConfirmaEPP?: boolean;
  tecnicoConfirmaRecomendaciones?: boolean;
  tecnicoConfirmaHerramientas?: boolean;

  // Signatures
  firmaAperturaTecnico?: string;
  firmaAperturaTecnicoFecha?: string;
  firmaAperturaSupervisor?: string;
  firmaAperturaSupervisorFecha?: string;
  
  firmaCierreTecnico?: string;
  firmaCierreTecnicoFecha?: string;
  firmaCierreSupervisor?: string;
  firmaCierreSupervisorFecha?: string;

  comentariosFinales?: string;
  estado: PTWEstado;
  
  // Admin/Audit
  creadoPor: string;
  creadoFecha: string;
  listoSharePoint?: boolean;
}

export interface OMInventoryItem {
  id: string; // Same as codigo
  codigo: string; // e.g., "INV-CANT-01"
  descripcion: string;
  plantaId: string;
  plantaNombre: string;
  legacyPlantId?: string;
  bodegaUbicacion: string;
  categoria: 'Inversores' | 'CCTV / comunicaciones' | 'Protecciones' | 'Fusibles' | 'Conectores' | 'Sensores' | 'Tracker' | 'Consumibles eléctricos' | 'Herramientas menores';
  unidad: string; // e.g., "Unidad", "Caja", "Metros"
  stockActual: number;
  stockMinimo: number;
  criticidad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  proveedor: string;
  ultimaActualizacion: string; // e.g., "2026-07-01 12:00"
  estado: 'Disponible' | 'Bajo Mínimo' | 'Sin Stock' | 'Requiere Revisión';
}

export interface OMInventoryMovement {
  id: string; // e.g., "MOV-001"
  itemCodigo: string;
  itemDescripcion: string;
  plantaId: string;
  plantaNombre: string;
  legacyPlantId?: string;
  tipoMovimiento: 'Consumo por OT' | 'Ingreso de repuesto' | 'Ajuste mensual Excel' | 'Baja por daño' | 'Traslado entre plantas';
  otAsociada?: string;
  tecnico?: string;
  cantidad: number;
  stockAnterior: number;
  stockFinal: number;
  fecha: string;
  observacion: string;
}


