import fleetMasterData from '../../../data/ORBI_FLEET_MASTER_DATABASE_v1.0.json';

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
  real_gps_enabled: false;
  provider: string | null;
}

export interface VehicleIncidentsMaster {
  open_count: number;
  notes: string[];
}

export interface Vehiculo {
  id?: string;
  fleet_id: string;
  portfolio: string;
  plate: string | null;
  plate_display: string | null;
  brand: string;
  model: string;
  vehicle_type: string;
  drive: string;
  fuel: string;
  assignment: VehicleAssignmentMaster;
  leasing: VehicleLeasingMaster;
  delivery: VehicleDeliveryMaster;
  replacement: VehicleReplacementMaster;
  odometer_km_last_known: number | null;
  odometer_date: string | null;
  operational_status?: string;
  maintenance?: VehicleMaintenanceMaster;
  documents?: VehicleDocumentsMaster;
  checklist?: VehicleChecklistMaster;
  gps?: VehicleGpsMaster;
  incidents?: VehicleIncidentsMaster;
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

  // Legacy compatibility fields
  patente: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  color?: string;
  kilometraje?: number;
  vencimientoPermiso?: string;
  vencimientoRevision?: string;
  vencimientoSeguro?: string;
  zona?: 'Norte' | 'Centro' | 'Sur' | 'Centro (Lavado)' | string;
  asignadoA?: string;
  conductor?: string;
  personalAsociado?: string[];
  plantaDestinoId?: string;
  plantaDestinoNombre?: string;
  estado?: string;
  bloqueoLogistico?: string;
  otVinculada?: string;
  rutaSimulada?: string;
  horaSalida?: string;
  horaLlegadaEstimada?: string;
  herramientasRequeridas?: string[];
  repuestosRequeridos?: string[];
  notas?: string;
  gpsConnected?: boolean;
  gpsProvider?: string;
  latitude?: number;
  longitude?: number;
  lastLocationName?: string;
  speedKmh?: number;
  heading?: string;
}

export interface MantenimientoVehiculo {
  id: string;
  patente: string;
  fecha: string;
  tipo: 'Correctivo' | 'Preventivo' | 'Cambio de Aceite' | 'Revisión Técnica' | 'Frenos/Alineación';
  km: number;
  responsable: string;
  descripcion: string;
}

/** Utility to normalize plates without hyphens for comparison */
export function normalizePlate(plateStr?: string | null): string {
  if (!plateStr) return '';
  return plateStr.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/** Canonical Master Dataset (28 assignments) from ORBI_FLEET_MASTER_DATABASE_v1.0.json */
const OLD_HARDCODED_FLEET_ARRAY: any[] = [
  {
    fleet_id: "ORBI-FLT-001",
    id: "ORBI-FLT-001",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VTYY85",
    plate_display: "VTYY-85",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Nicolas Fuente", zone: "Sur", base_city: "Chillan", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003259652", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-10", status: "Entregado" },
    replacement: { previous_provider: "Econorent", previous_plate: "TWTS37", return_required: true },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VTYY-85", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 45000,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Sur", asignadoA: "Nicolas Fuente"
  },
  {
    fleet_id: "ORBI-FLT-002",
    id: "ORBI-FLT-002",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VTYY90",
    plate_display: "VTYY-90",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Ivan Candia", zone: "Sur", base_city: "Chillan", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003259655", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-12", status: "Entregado" },
    replacement: { previous_provider: "Econorent", previous_plate: "TSWL61", return_required: true },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VTYY-90", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 42000,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Sur", asignadoA: "Ivan Candia"
  },
  {
    fleet_id: "ORBI-FLT-003",
    id: "ORBI-FLT-003",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VTYZ74",
    plate_display: "VTYZ-74",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Pablo Pinilla", zone: "Sur", base_city: "Chillan", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003259658", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-11", status: "Entregado" },
    replacement: { previous_provider: "Salfa", previous_plate: null, return_required: false },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VTYZ-74", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 38000,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Sur", asignadoA: "Pablo Pinilla"
  },
  {
    fleet_id: "ORBI-FLT-004",
    id: "ORBI-FLT-004",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VTYZ64",
    plate_display: "VTYZ-64",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Hermes Sanchez", zone: "Sur", base_city: "Chillan", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003259659", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-10", status: "Entregado" },
    replacement: { previous_provider: "Econorent", previous_plate: "TGBX35", return_required: true },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VTYZ-64", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 41000,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Sur", asignadoA: "Hermes Sanchez"
  },
  {
    fleet_id: "ORBI-FLT-005",
    id: "ORBI-FLT-005",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VTYZ41",
    plate_display: "VTYZ-41",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Patricio Castro", zone: "Sur", base_city: "Talca", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003259661", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-10", status: "Entregado" },
    replacement: { previous_provider: "Econorent", previous_plate: "TLWJ68", return_required: true },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VTYZ-41", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 39000,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Sur", asignadoA: "Patricio Castro"
  },
  {
    fleet_id: "ORBI-FLT-006",
    id: "ORBI-FLT-006",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VTYY75",
    plate_display: "VTYY-75",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Cristian Sanchez", zone: "Sur", base_city: "Los Angeles", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003259662", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-12", status: "Entregado" },
    replacement: { previous_provider: "Gama", previous_plate: null, return_required: false },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VTYY-75", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 37000,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Sur", asignadoA: "Cristian Sanchez"
  },
  {
    fleet_id: "ORBI-FLT-007",
    id: "ORBI-FLT-007",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VTYZ51",
    plate_display: "VTYZ-51",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Camilo Maldonado", zone: "Centro", base_city: "Lolol", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003259664", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-11", status: "Entregado" },
    replacement: { previous_provider: "Salfa", previous_plate: null, return_required: false },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VTYZ-51", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 43000,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Centro", asignadoA: "Camilo Maldonado"
  },
  {
    fleet_id: "ORBI-FLT-008",
    id: "ORBI-FLT-008",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VTYY65",
    plate_display: "VTYY-65",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Esteban Carrasco", zone: "Centro", base_city: "Rancagua", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003259667", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-11", status: "Entregado" },
    replacement: { previous_provider: "Econorent", previous_plate: "TWJK89", return_required: true },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VTYY-65", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Gris", kilometraje: 65000,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Centro", asignadoA: "Esteban Carrasco"
  },
  {
    fleet_id: "ORBI-FLT-009",
    id: "ORBI-FLT-009",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VTTF33",
    plate_display: "VTTF-33",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Jhon Delgado", zone: "Centro", base_city: "Curico", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003259668", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-13", status: "Entregado" },
    replacement: { previous_provider: "Econorent", previous_plate: "TSXT54", return_required: true },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VTTF-33", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 36000,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Centro", asignadoA: "Jhon Delgado"
  },
  {
    fleet_id: "ORBI-FLT-010",
    id: "ORBI-FLT-010",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VTYY47",
    plate_display: "VTYY-47",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Rodrigo Cisterna", zone: "Centro", base_city: "Buin", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003259669", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-11", status: "Entregado" },
    replacement: { previous_provider: "Gama", previous_plate: null, return_required: false },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VTYY-47", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 40000,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Centro", asignadoA: "Rodrigo Cisterna"
  },
  {
    fleet_id: "ORBI-FLT-011",
    id: "ORBI-FLT-011",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VVBP62",
    plate_display: "VVBP-62",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Cristian Carmona", zone: "Norte", base_city: "Villa Alemana", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003258003", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-09", status: "Entregado" },
    replacement: { previous_provider: null, previous_plate: null, return_required: false },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VVBP-62", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 42100,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-10-15", vencimientoSeguro: "2027-03-31", zona: "Norte", asignadoA: "Cristian Carmona"
  },
  {
    fleet_id: "ORBI-FLT-012",
    id: "ORBI-FLT-012",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VVBP51",
    plate_display: "VVBP-51",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Cristian Quezada", zone: "Centro (Lavado)", base_city: "Santiago", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: null, start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-09", status: "Entregado" },
    replacement: { previous_provider: "Econorent", previous_plate: "TVCL52", return_required: true },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VVBP-51", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 44000,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Centro (Lavado)", asignadoA: "Cristian Quezada"
  },
  {
    fleet_id: "ORBI-FLT-013",
    id: "ORBI-FLT-013",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VVBP79",
    plate_display: "VVBP-79",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Ricardo Rivas", zone: "Norte", base_city: "Alto Hospicio", status: "Pendiente entrega" },
    leasing: { company: "Econorent", contract_reference: "1003258009", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: null, status: "Pendiente" },
    replacement: { previous_provider: "Gama", previous_plate: null, return_required: false },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Pendiente",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VVBP-79", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Gris", kilometraje: 39500,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-20", vencimientoSeguro: "2027-03-31", zona: "Norte", asignadoA: "Ricardo Rivas"
  },
  {
    fleet_id: "ORBI-FLT-014",
    id: "ORBI-FLT-014",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VVBP61",
    plate_display: "VVBP-61",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Jaime Leiva / Especialista Iquique pendiente", zone: "Norte", base_city: "Alto Hospicio", status: "Pendiente entrega" },
    leasing: { company: "Econorent", contract_reference: "1003258014", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: null, status: "Pendiente" },
    replacement: { previous_provider: "Gama", previous_plate: null, return_required: false },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Pendiente",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VVBP-61", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 43100,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-05-15", vencimientoSeguro: "2027-03-31", zona: "Norte", asignadoA: "Jaime Leiva / Especialista Iquique pendiente"
  },
  {
    fleet_id: "ORBI-FLT-015",
    id: "ORBI-FLT-015",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VVBP77",
    plate_display: "VVBP-77",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Jose Zuñiga", zone: "Norte", base_city: "Quillota", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003258020", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-10", status: "Entregado" },
    replacement: { previous_provider: "Econorent", previous_plate: "SPCP99", return_required: true },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VVBP-77", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Azul", kilometraje: 36800,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Norte", asignadoA: "Jose Zuñiga"
  },
  {
    fleet_id: "ORBI-FLT-016",
    id: "ORBI-FLT-016",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VVBP47",
    plate_display: "VVBP-47",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Daniel Carrero", zone: "Norte", base_city: "La Serena", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003258022", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-10", status: "Entregado" },
    replacement: { previous_provider: "saveiro oficina", previous_plate: null, return_required: false },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VVBP-47", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 41200,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Norte", asignadoA: "Daniel Carrero"
  },
  {
    fleet_id: "ORBI-FLT-017",
    id: "ORBI-FLT-017",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VVBP40",
    plate_display: "VVBP-40",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Jose Leon", zone: "Sur", base_city: "San Clemente", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003258024", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-11", status: "Entregado" },
    replacement: { previous_provider: "Econorent", previous_plate: "VKLR20", return_required: true },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VVBP-40", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Gris", kilometraje: 44500,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Sur", asignadoA: "Jose Leon"
  },
  {
    fleet_id: "ORBI-FLT-018",
    id: "ORBI-FLT-018",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VVBP37",
    plate_display: "VVBP-37",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Camilo Vergara", zone: "Centro", base_city: "San Fernando", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003258026", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-12", status: "Entregado" },
    replacement: { previous_provider: "Maipo Rent", previous_plate: null, return_required: false },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VVBP-37", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 38900,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Centro", asignadoA: "Camilo Vergara"
  },
  {
    fleet_id: "ORBI-FLT-019",
    id: "ORBI-FLT-019",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VVBP39",
    plate_display: "VVBP-39",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Rodrigo Jabre", zone: "Norte", base_city: "San Antonio", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003262923", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-03-23", status: "Entregado" },
    replacement: { previous_provider: null, previous_plate: null, return_required: false },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VVBP-39", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 40500,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Norte", asignadoA: "Rodrigo Jabre"
  },
  {
    fleet_id: "ORBI-FLT-020",
    id: "ORBI-FLT-020",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VVBP76",
    plate_display: "VVBP-76",
    brand: "GREAT WALL",
    model: "POER 4X4 ELITE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Elvis Pernalete", zone: "Centro", base_city: "Melipilla", status: "Asignado" },
    leasing: { company: "Econorent", contract_reference: "1003262920", start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-04-03", status: "Entregado" },
    replacement: { previous_provider: null, previous_plate: null, return_required: false },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VVBP-76", marca: "GREAT WALL", modelo: "POER 4X4 ELITE", ano: 2024, color: "Blanco", kilometraje: 42800,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Centro", asignadoA: "Elvis Pernalete"
  },
  {
    fleet_id: "ORBI-FLT-021",
    id: "ORBI-FLT-021",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: null,
    plate_display: null,
    brand: "FORD",
    model: "RANGER 4X4",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Victor Leon", zone: "Centro", base_city: "Rancagua", status: "Pendiente patente" },
    leasing: { company: "Econorent", contract_reference: null, start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Asignación nueva" },
    delivery: { date: "2026-05-20", status: "Entregado" },
    replacement: { previous_provider: null, previous_plate: "VRFD26", return_required: true },
    odometer_km_last_known: null,
    odometer_date: null,
    operational_status: "Pendiente",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Base inicial",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "PENDIENTE", marca: "FORD", modelo: "RANGER 4X4", ano: 2026, color: "Blanco", kilometraje: 0,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Centro", asignadoA: "Victor Leon"
  },
  {
    fleet_id: "ORBI-FLT-022",
    id: "ORBI-FLT-022",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VBTV94",
    plate_display: "VBTV94",
    brand: "GREAT WALL",
    model: "POER 2.0 TD 4X4 DELUXE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "Diésel",
    assignment: { assignee: "Cesar Cruz", zone: "Norte", base_city: "Calama", status: "Asignado" },
    leasing: { company: "Gama Leasing", contract_reference: null, start_date: "2025-05-20", end_date: "2028-05-20", term_months: 36, monthly_uf: 15.4, contract_status: "Contrato Vigente" },
    delivery: { date: "2026-02-12", status: "Entregado" },
    replacement: { previous_provider: null, previous_plate: null, return_required: false },
    odometer_km_last_known: 28748,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Enriquecida",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VBTV94", marca: "GREAT WALL", modelo: "POER 2.0 TD 4X4 DELUXE", ano: 2025, color: "Gris", kilometraje: 28748,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Norte", asignadoA: "Cesar Cruz"
  },
  {
    fleet_id: "ORBI-FLT-023",
    id: "ORBI-FLT-023",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VBTZ98",
    plate_display: "VBTZ98",
    brand: "GREAT WALL",
    model: "POER MT 4X4 DELUXE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "unknown",
    assignment: { assignee: "Yerko Santos", zone: "Norte", base_city: "Arica", status: "Asignado" },
    leasing: { company: "Gama Leasing", contract_reference: null, start_date: "2025-05-20", end_date: "2028-05-20", term_months: 36, monthly_uf: 15.4, contract_status: "Contrato Vigente" },
    delivery: { date: "2026-02-12", status: "Entregado" },
    replacement: { previous_provider: null, previous_plate: null, return_required: false },
    odometer_km_last_known: 17362,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Enriquecida",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VBTZ98", marca: "GREAT WALL", modelo: "POER MT 4X4 DELUXE", ano: 2025, color: "Blanco", kilometraje: 17362,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Norte", asignadoA: "Yerko Santos"
  },
  {
    fleet_id: "ORBI-FLT-024",
    id: "ORBI-FLT-024",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VBVB29",
    plate_display: "VBVB-29",
    brand: "GREAT WALL",
    model: "POER 2.0 TD DELUXE EURO 6 MT",
    vehicle_type: "Camioneta",
    drive: "unknown",
    fuel: "Diésel",
    assignment: { assignee: "Alejandro Mena", zone: "Sur", base_city: "Cauquenes", status: "Asignado" },
    leasing: { company: "Gama Leasing", contract_reference: null, start_date: "2025-05-22", end_date: "2028-05-22", term_months: 36, monthly_uf: 15.4, contract_status: "Contrato Vigente" },
    delivery: { date: "2026-02-12", status: "Entregado" },
    replacement: { previous_provider: null, previous_plate: null, return_required: false },
    odometer_km_last_known: 20466,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Enriquecida",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VBVB-29", marca: "GREAT WALL", modelo: "POER 2.0 TD DELUXE EURO 6 MT", ano: 2025, color: "Gris", kilometraje: 20466,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Sur", asignadoA: "Alejandro Mena"
  },
  {
    fleet_id: "ORBI-FLT-025",
    id: "ORBI-FLT-025",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "TRGZ77",
    plate_display: "TRGZ77",
    brand: "MAXUS",
    model: "T60 DX DC 2.0D 4X2 MT E6C",
    vehicle_type: "Camioneta",
    drive: "4x2",
    fuel: "Diésel",
    assignment: { assignee: "Victor Maturana", zone: "Norte", base_city: "Salamanca", status: "Asignado" },
    leasing: { company: "Gama Leasing", contract_reference: null, start_date: "2024-12-17", end_date: "2026-12-16", term_months: 24, monthly_uf: 16.25, contract_status: "Contrato Vigente" },
    delivery: { date: "2026-02-12", status: "Entregado" },
    replacement: { previous_provider: null, previous_plate: null, return_required: false },
    odometer_km_last_known: 35953,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Enriquecida",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "TRGZ77", marca: "MAXUS", modelo: "T60 DX DC 2.0D 4X2 MT E6C", ano: 2024, color: "Blanco", kilometraje: 35953,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Norte", asignadoA: "Victor Maturana"
  },
  {
    fleet_id: "ORBI-FLT-026",
    id: "ORBI-FLT-026",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "TYBJ87",
    plate_display: "TYBJ-87",
    brand: "MAXUS",
    model: "T60 DX DC 2.0D 4X2 MT E6C",
    vehicle_type: "Camioneta",
    drive: "4x2",
    fuel: "Diésel",
    assignment: { assignee: "Patricio Melendez", zone: "Centro", base_city: "Marchigue", status: "Asignado" },
    leasing: { company: "Gama Leasing", contract_reference: null, start_date: "2025-08-07", end_date: "2027-08-06", term_months: 24, monthly_uf: 16.25, contract_status: "Contrato Vigente" },
    delivery: { date: "2026-02-12", status: "Entregado" },
    replacement: { previous_provider: null, previous_plate: null, return_required: false },
    odometer_km_last_known: 18260,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Enriquecida",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "TYBJ-87", marca: "MAXUS", modelo: "T60 DX DC 2.0D 4X2 MT E6C", ano: 2025, color: "Blanco", kilometraje: 18260,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Centro", asignadoA: "Patricio Melendez"
  },
  {
    fleet_id: "ORBI-FLT-027",
    id: "ORBI-FLT-027",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "VBTV28",
    plate_display: "VBTV28",
    brand: "GREAT WALL",
    model: "POER 2.0 TD 4X4 DELUXE",
    vehicle_type: "Camioneta",
    drive: "4x4",
    fuel: "Diésel",
    assignment: { assignee: "Yunel Ignacio Alquinta Aguilar", zone: "Norte", base_city: "Copiapo", status: "Asignado" },
    leasing: { company: "Gama Leasing", contract_reference: null, start_date: "2025-04-14", end_date: "2028-04-14", term_months: 36, monthly_uf: 15.85, contract_status: "Contrato Vigente" },
    delivery: { date: "2026-02-12", status: "Entregado" },
    replacement: { previous_provider: null, previous_plate: null, return_required: false },
    odometer_km_last_known: 30915,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Enriquecida",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "VBTV28", marca: "GREAT WALL", modelo: "POER 2.0 TD 4X4 DELUXE", ano: 2025, color: "Gris", kilometraje: 30915,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Norte", asignadoA: "Yunel Ignacio Alquinta Aguilar"
  },
  {
    fleet_id: "ORBI-FLT-028",
    id: "ORBI-FLT-028",
    portfolio: "TRITEC-INTERVENTO O&M",
    plate: "TRDF68",
    plate_display: "TRDF68",
    brand: "VOLKSWAGEN",
    model: "SAVEIRO NUEVA DC 1.6B MT 4X2 E6B",
    vehicle_type: "Vehículo de apoyo",
    drive: "4x2",
    fuel: "unknown",
    assignment: { assignee: "Equipo Oficina", zone: "Centro", base_city: "Santiago", status: "Asignado" },
    leasing: { company: "Gama Leasing", contract_reference: null, start_date: "2025-02-14", end_date: "2028-02-13", term_months: 36, monthly_uf: 11.3, contract_status: "Contrato Vigente" },
    delivery: { date: "2025-02-14", status: "Entregado" },
    replacement: { previous_provider: null, previous_plate: null, return_required: false },
    odometer_km_last_known: 20875,
    odometer_date: null,
    operational_status: "Operativo / por confirmar",
    maintenance: { last_service_date: null, next_service_date: null, next_service_km: null, status: "unknown" },
    documents: { soap_expiry: null, technical_inspection_expiry: null, circulation_permit_expiry: null, status: "unknown" },
    checklist: { last_date: null, status: "unknown", compliance_pct: null },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: null },
    incidents: { open_count: 0, notes: [] },
    data_quality: "Enriquecida",
    review_status: "REQUIERE VALIDACIÓN OPERACIONAL",
    personal_data_included: false,
    source: "Asignación de vehiculos Tritec O&M(1).xlsx",
    last_master_update: "2026-08-02",
    patente: "TRDF68", marca: "VOLKSWAGEN", modelo: "SAVEIRO NUEVA DC 1.6B MT 4X2 E6B", ano: 2025, color: "Blanco", kilometraje: 20875,
    vencimientoPermiso: "2027-03-31", vencimientoRevision: "2026-11-15", vencimientoSeguro: "2027-03-31", zona: "Centro", asignadoA: "Equipo Oficina"
  }
];

export const INITIAL_FLEET_MASTER: Vehiculo[] = ((fleetMasterData as any).vehicles || []).map((v: any) => {
  const dispPlate = v.plate_display || (v.plate ? (v.plate.length === 6 ? `${v.plate.slice(0, 4)}-${v.plate.slice(4)}` : v.plate) : "PENDIENTE PATENTE");
  const normPlate = v.plate || normalizePlate(dispPlate) || null;
  const isGama = v.leasing?.company === "Gama Leasing";

  return {
    ...v,
    id: v.fleet_id,
    fleet_id: v.fleet_id,
    portfolio: v.portfolio || "TRITEC-INTERVENTO O&M",
    plate: normPlate,
    plate_display: dispPlate,
    brand: v.brand || "GREAT WALL",
    model: v.model || "POER 4X4 ELITE",
    vehicle_type: v.vehicle_type || "Camioneta",
    drive: v.drive || "4x4",
    fuel: v.fuel || "Diésel",
    assignment: v.assignment || { assignee: "Sin Asignar", zone: "Centro", base_city: "Desconocida", status: "Asignado" },
    leasing: v.leasing || { company: "Econorent", contract_reference: null, start_date: null, end_date: null, term_months: null, monthly_uf: null, contract_status: "Vigente" },
    delivery: v.delivery || { date: null, status: "Pendiente" },
    replacement: v.replacement || { previous_provider: null, previous_plate: null, return_required: false },
    odometer_km_last_known: v.odometer_km_last_known ?? (isGama ? 25000 : 40000),
    odometer_date: v.odometer_date || "2026-08-01",
    operational_status: v.operational_status || "Operativo",
    maintenance: v.maintenance || { last_service_date: null, next_service_date: null, next_service_km: null, status: "Al día" },
    documents: v.documents || { soap_expiry: "2027-03-31", technical_inspection_expiry: "2026-11-15", circulation_permit_expiry: "2027-03-31", status: "OK" },
    checklist: v.checklist || { last_date: null, status: "OK", compliance_pct: 100 },
    gps: { mode: "sandbox", real_gps_enabled: false, provider: v.gps?.provider || null },
    incidents: v.incidents || { open_count: 0, notes: [] },
    data_quality: v.data_quality || "Enriquecida",
    review_status: v.review_status || "OK",
    personal_data_included: false,
    patente: dispPlate,
    marca: v.brand || "GREAT WALL",
    modelo: v.model || "POER 4X4 ELITE",
    ano: isGama ? 2025 : 2024,
    color: isGama ? "Gris" : "Blanco",
    kilometraje: v.odometer_km_last_known ?? (isGama ? 25000 : 40000),
    vencimientoPermiso: v.documents?.circulation_permit_expiry || "2027-03-31",
    vencimientoRevision: v.documents?.technical_inspection_expiry || "2026-11-15",
    vencimientoSeguro: v.documents?.soap_expiry || "2027-03-31",
    zona: v.assignment?.zone || "Centro",
    asignadoA: v.assignment?.assignee || "Sin Asignar",
    conductor: v.assignment?.assignee || "Sin Asignar",
    personalAsociado: [v.assignment?.assignee || "Técnico O&M"],
    maintenanceMaster: v.maintenance,
    documentsMaster: v.documents,
    checklistMaster: v.checklist,
    gpsMaster: { mode: "sandbox", real_gps_enabled: false, provider: v.gps?.provider || null },
    incidentsMaster: v.incidents
  };
});

export const INITIAL_VEHICLES: Vehiculo[] = INITIAL_FLEET_MASTER;

export const INITIAL_VEHICLE_MAINTENANCE: MantenimientoVehiculo[] = [
  {
    id: "maint-1",
    patente: "VVBP-62",
    fecha: "2026-03-15",
    tipo: "Preventivo",
    km: 40000,
    responsable: "Kaufmann Valparaíso",
    descripcion: "Filtros de aceite y aire nuevos, engrase de ejes y rotación de neumáticos."
  },
  {
    id: "maint-2",
    patente: "VTYY-65",
    fecha: "2026-04-12",
    tipo: "Frenos/Alineación",
    km: 64000,
    responsable: "Salazar Israel Rancagua",
    descripcion: "Rectificado de discos delanteros, pastillas de freno cerámicas nuevas y alineamiento general."
  }
];

/** Idempotent UPSERT loader for Fleet Vehicles */
export function loadFleetMasterVehicles(): Vehiculo[] {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem("orbi_fleet_standalone_vehicles");
    if (data) {
      try {
        const parsed: Vehiculo[] = JSON.parse(data);
        const map = new Map<string, Vehiculo>();

        // Base initialization with canonical master vehicles
        INITIAL_FLEET_MASTER.forEach(v => {
          map.set(v.fleet_id, { ...v });
        });

        // Upsert stored vehicles by fleet_id
        parsed.forEach(v => {
          const key = v.fleet_id || v.id;
          if (key && map.has(key)) {
            map.set(key, { ...map.get(key)!, ...v });
          } else if (key) {
            map.set(key, v);
          }
        });

        const merged = Array.from(map.values());
        localStorage.setItem("orbi_fleet_standalone_vehicles", JSON.stringify(merged));
        return merged;
      } catch (e) {
        console.error("Error parsing stored fleet vehicles:", e);
      }
    }
    localStorage.setItem("orbi_fleet_standalone_vehicles", JSON.stringify(INITIAL_FLEET_MASTER));
  }
  return INITIAL_FLEET_MASTER;
}

export function getVehicleDocumentsAlerts(vehicle: Vehiculo) {
  const currentDate = new Date();
  const alerts: string[] = [];

  const checkExpired = (dateStr?: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < currentDate;
  };

  if (checkExpired(vehicle.vencimientoPermiso || vehicle.documents?.circulation_permit_expiry)) {
    alerts.push(`Permiso de Circulación VENCIDO`);
  }
  if (checkExpired(vehicle.vencimientoRevision || vehicle.documents?.technical_inspection_expiry)) {
    alerts.push(`Revisión Técnica VENCIDA`);
  }
  if (checkExpired(vehicle.vencimientoSeguro || vehicle.documents?.soap_expiry)) {
    alerts.push(`Seguro SOAP VENCIDO`);
  }

  const km = vehicle.odometer_km_last_known || vehicle.kilometraje || 0;
  if (km > 0) {
    const nextOilChangeDue = 10000 - (km % 10000);
    if (nextOilChangeDue < 1200) {
      alerts.push(`Cambio de Aceite Programado Requerido (Faltan ${Math.round(nextOilChangeDue)} km)`);
    }
  }

  return {
    isCritical: alerts.length > 0,
    alerts
  };
}
