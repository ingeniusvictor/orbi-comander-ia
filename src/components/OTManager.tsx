/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  User,
  Activity,
  AlertTriangle,
  Award,
  Upload,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  CheckSquare,
  HelpCircle,
  X,
  PlusCircle,
  Check,
  Calendar,
  Layers,
  MapPin,
  ClipboardList,
  Camera,
  History,
  FileSpreadsheet,
  Settings,
  Truck,
  Wrench,
  Package,
  AlertOctagon,
  Copy,
  FolderSync
} from 'lucide-react';
import { OT, Planta, OrganigramaNode, OTEstado, OTType, OTPrioridad, PlanPreventivo, PTW } from '../types';
import { getPlantBadgeInfo } from '../data/plantIdentityMap';
import EvidenceVault from './EvidenceVault';
import SharePointRouter from './SharePointRouter';
import PTWCenter from './PTWCenter';
import OMInventory from './OMInventory';
import SchedulerIA from './SchedulerIA';
import ReportCenter from './ReportCenter';

interface OTManagerProps {
  ots: OT[];
  plantas: Planta[];
  organigrama: OrganigramaNode[];
  onUpdate: (updatedOts: OT[]) => void;
  userRole: string;
  initialFilters?: any;
  onAddAuditLog: (
    accion: string,
    modulo: string,
    otCode?: string,
    plantaName?: string,
    comentario?: string,
    criticidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  ) => void;
  escalaciones?: any[];
  onUpdateEscalaciones?: (updated: any[]) => void;
  vehiculos?: any[];
  onUpdateVehiculos?: (updated: any[]) => void;
  recursosPersonas?: any[];
  onUpdateRecursosPersonas?: (updated: any[]) => void;
  repuestos?: any[];
  onUpdateRepuestos?: (updated: any[]) => void;
  herramientas?: any[];
  onUpdateHerramientas?: (updated: any[]) => void;
  planificacion?: any[];
  onUpdatePlanificacion?: (updated: any[]) => void;
  activeUserName?: string;
  ptws: PTW[];
  onUpdatePtws: (updatedPtws: PTW[]) => void;
}

// 10 OT Templates defined compactly
const OT_TEMPLATES = [
  {
    id: 'temp_prev_inv',
    name: 'Preventivo Inversor',
    tipo: 'Preventiva' as OTType,
    prioridad: 'Media' as OTPrioridad,
    criticidad: 'Media' as const,
    hhEstimadas: 6,
    requiereAST: true,
    requierePermisoTrabajo: false,
    requiereValidacionHSE: false,
    requiereValidacionCalidad: true,
    requiereEvidencia: true,
    requiereChecklist: true,
    checklist: [
      { item: 'Verificación visual general', completado: false },
      { item: 'Limpieza externa', completado: false },
      { item: 'Revisión ventilación', completado: false },
      { item: 'Revisión alarmas', completado: false },
      { item: 'Revisión comunicación', completado: false }
    ],
    repuestos: ['Filtros de aire', 'Fusibles CC'],
    herramientas: ['Multímetro calibrado', 'Soplador eléctrico']
  },
  {
    id: 'temp_corr_inv',
    name: 'Correctivo Inversor',
    tipo: 'Correctiva' as OTType,
    prioridad: 'Alta' as OTPrioridad,
    criticidad: 'Alta' as const,
    hhEstimadas: 8,
    requiereAST: true,
    requierePermisoTrabajo: true,
    requiereValidacionHSE: true,
    requiereValidacionCalidad: true,
    requiereEvidencia: true,
    requiereChecklist: true,
    checklist: [
      { item: 'Confirmar alarma y código de falla', completado: false },
      { item: 'Revisar estado DC/AC y aislamiento', completado: false },
      { item: 'Revisar comunicación y placas de control', completado: false },
      { item: 'Registrar diagnóstico final', completado: false }
    ],
    repuestos: ['Módulo de potencia IGBT', 'Tarjeta de control'],
    herramientas: ['Kit herramientas aisladas', 'Analizador de redes']
  },
  {
    id: 'temp_limp_mod',
    name: 'Limpieza de Módulos',
    tipo: 'Preventiva' as OTType,
    prioridad: 'Baja' as OTPrioridad,
    criticidad: 'Baja' as const,
    hhEstimadas: 16,
    requiereAST: true,
    requierePermisoTrabajo: false,
    requiereValidacionHSE: false,
    requiereValidacionCalidad: false,
    requiereEvidencia: true,
    requiereChecklist: true,
    checklist: [
      { item: 'Revisar suciedad (soiling index)', completado: false },
      { item: 'Limpieza de módulos strings', completado: false },
      { item: 'Inspección post-lavado por microfisuras', completado: false }
    ],
    repuestos: [] as string[],
    herramientas: ['Cepillo rotativo', 'Medidor conductividad']
  },
  {
    id: 'temp_cctv_com',
    name: 'Revisión CCTV / Comunicaciones',
    tipo: 'Preventiva' as OTType,
    prioridad: 'Media' as OTPrioridad,
    criticidad: 'Media' as const,
    hhEstimadas: 4,
    requiereAST: true,
    requierePermisoTrabajo: false,
    requiereValidacionHSE: false,
    requiereValidacionCalidad: false,
    requiereEvidencia: true,
    requiereChecklist: true,
    checklist: [
      { item: 'Verificar switches PoE', completado: false },
      { item: 'Verificar enlace radioenlace', completado: false },
      { item: 'Comprobar grabador NVR', completado: false }
    ],
    repuestos: ['Inyector PoE', 'Patch cord exterior'],
    herramientas: ['Tester de red RJ45', 'Escalera de fibra']
  },
  {
    id: 'temp_meteo_pira',
    name: 'Revisión Meteorológica / Piranómetro',
    tipo: 'Preventiva' as OTType,
    prioridad: 'Media' as OTPrioridad,
    criticidad: 'Media' as const,
    hhEstimadas: 3,
    requiereAST: true,
    requierePermisoTrabajo: false,
    requiereValidacionHSE: false,
    requiereValidacionCalidad: true,
    requiereEvidencia: true,
    requiereChecklist: true,
    checklist: [
      { item: 'Limpieza de cúpula de piranómetro', completado: false },
      { item: 'Verificación de nivel de burbuja', completado: false },
      { item: 'Prueba de lectura Modbus', completado: false }
    ],
    repuestos: ['Piranómetro de repuesto'],
    herramientas: ['Nivel de burbuja', 'Limpia-cristales']
  },
  {
    id: 'temp_tracker',
    name: 'Revisión Tracker',
    tipo: 'Preventiva' as OTType,
    prioridad: 'Media' as OTPrioridad,
    criticidad: 'Media' as const,
    hhEstimadas: 5,
    requiereAST: true,
    requierePermisoTrabajo: false,
    requiereValidacionHSE: false,
    requiereValidacionCalidad: false,
    requiereEvidencia: true,
    requiereChecklist: true,
    checklist: [
      { item: 'Verificar estado mecánico de uniones', completado: false },
      { item: 'Revisar calibración inclinómetro', completado: false },
      { item: 'Validar movimiento automático', completado: false }
    ],
    repuestos: ['Motor de tracker', 'Cojinete de teflón'],
    herramientas: ['Llave dinamométrica', 'Grasa de litio']
  },
  {
    id: 'temp_hse_finding',
    name: 'Hallazgo HSE',
    tipo: 'HSE' as OTType,
    prioridad: 'Alta' as OTPrioridad,
    criticidad: 'Alta' as const,
    hhEstimadas: 3,
    requiereAST: true,
    requierePermisoTrabajo: false,
    requiereValidacionHSE: true,
    requiereValidacionCalidad: false,
    requiereEvidencia: true,
    requiereChecklist: true,
    checklist: [
      { item: 'Identificar condición insegura', completado: false },
      { item: 'Clasificar riesgo y gravedad', completado: false },
      { item: 'Definir acción preventiva o correctiva', completado: false }
    ],
    repuestos: ['Cinta de peligro', 'Letreros de seguridad'],
    herramientas: ['Elementos de bloqueo LOTO']
  },
  {
    id: 'temp_qa_finding',
    name: 'Hallazgo Calidad',
    tipo: 'Calidad' as OTType,
    prioridad: 'Media' as OTPrioridad,
    criticidad: 'Media' as const,
    hhEstimadas: 4,
    requiereAST: true,
    requierePermisoTrabajo: false,
    requiereValidacionHSE: false,
    requiereValidacionCalidad: true,
    requiereEvidencia: true,
    requiereChecklist: true,
    checklist: [
      { item: 'Identificar desviación técnica', completado: false },
      { item: 'Definir acción de mitigación de calidad', completado: false },
      { item: 'Validar torque o conexión en terreno', completado: false }
    ],
    repuestos: ['Prensaestopas IP68', 'Terminales MC4'],
    herramientas: ['Prensa terminales crimpeadora', 'Torquímetro']
  },
  {
    id: 'temp_commissioning',
    name: 'Comisionamiento / Puesta en Servicio',
    tipo: 'Comisionamiento' as OTType,
    prioridad: 'Alta' as OTPrioridad,
    criticidad: 'Alta' as const,
    hhEstimadas: 12,
    requiereAST: true,
    requierePermisoTrabajo: true,
    requiereValidacionHSE: true,
    requiereValidacionCalidad: true,
    requiereEvidencia: true,
    requiereChecklist: true,
    checklist: [
      { item: 'Verificar aislamiento de cables', completado: false },
      { item: 'Prueba de disparo de protecciones', completado: false },
      { item: 'Verificar secuencia de fases AC', completado: false },
      { item: 'Firma de acta de comisionamiento', completado: false }
    ],
    repuestos: [] as string[],
    herramientas: ['Megger de aislamiento', 'Cámara termográfica']
  },
  {
    id: 'temp_general_inspect',
    name: 'Inspección General Planta',
    tipo: 'Inspección' as any,
    prioridad: 'Baja' as OTPrioridad,
    criticidad: 'Baja' as const,
    hhEstimadas: 8,
    requiereAST: true,
    requierePermisoTrabajo: false,
    requiereValidacionHSE: true,
    requiereValidacionCalidad: true,
    requiereEvidencia: true,
    requiereChecklist: true,
    checklist: [
      { item: 'Inspección visual cercos y portones', completado: false },
      { item: 'Inspección visual caminos interiores', completado: false },
      { item: 'Comprobación extintores de incendio', completado: false }
    ],
    repuestos: [] as string[],
    herramientas: ['Kit de primeros auxilios', 'Linterna de alta potencia']
  }
];

export default function OTManager({
  ots,
  plantas,
  organigrama,
  onUpdate,
  userRole,
  initialFilters,
  onAddAuditLog,
  escalaciones = [],
  onUpdateEscalaciones,
  vehiculos = [],
  onUpdateVehiculos,
  recursosPersonas = [],
  onUpdateRecursosPersonas,
  repuestos = [],
  onUpdateRepuestos,
  herramientas = [],
  onUpdateHerramientas,
  planificacion = [],
  onUpdatePlanificacion,
  activeUserName = 'Felipe Soto',
  ptws,
  onUpdatePtws
}: OTManagerProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [filterZona, setFilterZona] = useState<string>(initialFilters?.zona || 'Todas');
  
  const isTechnician = ['TECNICO_OM', 'INGENIERO_OM'].includes(userRole);
  
  const [editingOt, setEditingOt] = useState<OT | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeSubView, setActiveSubView] = useState<'ots' | 'vault' | 'sharepoint' | 'ptw' | 'inventory' | 'scheduler'>('ots');
  
  // States for Wizard
  const [isCreatingWizard, setIsCreatingWizard] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Validation Error state for transitions
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Local states for OT devolution / closure revision
  const [showDevolutionForm, setShowDevolutionForm] = useState<boolean>(false);
  const [tempMotivoDevolucion, setTempMotivoDevolucion] = useState<string>('Evidencia insuficiente');
  const [tempComentarioDevolucion, setTempComentarioDevolucion] = useState<string>('');
  const [tempDetallesFaltantes, setTempDetallesFaltantes] = useState<string>('');
  const [tempComentarioRevisor, setTempComentarioRevisor] = useState<string>('');

  // Simulated evidence uploads in edit fiche
  const [simulatedFileName, setSimulatedFileName] = useState<string>('');
  const [simulatedFileDesc, setSimulatedFileDesc] = useState<string>('');

  // Draft OT state for Wizard
  const [wizardOt, setWizardOt] = useState<Partial<OT>>({
    codigo: '',
    plantaId: plantas[0]?.id || '',
    plantaNombre: plantas[0]?.name || '',
    activo: '',
    tipo: 'Preventiva',
    prioridad: 'Media',
    criticidad: 'Media',
    responsable: '',
    supervisor: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaLimite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estado: 'Nueva',
    avance: 0,
    hhEstimadas: 8,
    hhReales: 0,
    observaciones: '',
    riesgoDisponibilidad: 'No aplica',
    impacto: 'Medio' as any,
    origen: 'Manual Jefe O&M',
    diagnosticoInicial: '',
    impactoOperacional: 'Medio',
    riesgoHSE: 'Medio',
    riesgoCalidad: 'Medio',
    afectaProduccion: false,
    afectaSLA: false,
    coordinadorOM: 'Rodolfo Garcés',
    supervisorTerreno: '',
    tecnicoAsignado: '',
    areaTransversal: 'Ninguna',
    fechaProgramada: new Date().toISOString().split('T')[0],
    horaInicioEstimada: '08:30',
    horaTerminoEstimada: '17:30',
    ventanaTrabajo: 'Diurna (08:00 - 18:00)',
    dependencias: 'Ninguna',
    requiereProgramacionWorkspace: true,
    vehiculoRequerido: false,
    vehiculoSugerido: '',
    herramientasRequeridas: [],
    repuestosRequeridos: [],
    instrumentosRequeridas: [],
    bloqueoPorRecurso: false,
    observacionLogistica: '',
    requiereAST: true,
    astFirmado: false,
    requierePermisoTrabajo: false,
    requiereValidacionHSE: false,
    validacionHSE: 'Pendiente',
    requiereValidacionCalidad: false,
    validacionCalidad: 'Pendiente',
    requiereEvidencia: true,
    requiereChecklist: true,
    checklist: []
  });

  const canCreate = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'PLANIFICACION', 'GERENCIA'].includes(userRole);
  const technicians = organigrama.filter((n) => n.role === 'TECNICO_OM' || n.role === 'INGENIERO_OM');
  const supervisors = organigrama.filter((n) => n.role === 'SUPERVISOR_TERRENO');
  const coordinators = organigrama.filter((n) => n.role === 'COORDINADOR_OM' || n.role === 'JEFE_OM');

  const ESTADOS_PERMITIDOS: OTEstado[] = [
    'Borrador',
    'Nueva',
    'En revisión',
    'Asignada',
    'Programada',
    'En preparación',
    'En ruta',
    'En terreno',
    'En ejecución',
    'En espera de repuesto',
    'En espera de cliente',
    'Bloqueada',
    'Lista para revisión',
    'En revisión Supervisor',
    'En revisión Coordinador',
    'En revisión HSE',
    'En revisión Calidad',
    'Pendiente aprobación Jefe O&M',
    'Devuelta a ejecución',
    'Finalizada',
    'Cerrada',
    'Reabierta',
    'Cancelada'
  ];

  const TIPOS_PERMITIDOS: OTType[] = [
    'Preventiva',
    'Correctiva',
    'Emergencia',
    'HSE',
    'Calidad',
    'Comisionamiento',
    'Inspección',
    'Cliente',
    'Evento desde Centro de Control',
    'Repuesto pendiente'
  ];

  const PRIORIDADES_PERMITIDAS: OTPrioridad[] = ['Baja', 'Media', 'Alta', 'Crítica'];

  // Handle template selection in step 1
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = OT_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setWizardOt(prev => ({
        ...prev,
        tipo: tmpl.tipo,
        prioridad: tmpl.prioridad,
        criticidad: tmpl.criticidad,
        hhEstimadas: tmpl.hhEstimadas,
        requiereAST: tmpl.requiereAST,
        requierePermisoTrabajo: tmpl.requierePermisoTrabajo,
        requiereValidacionHSE: tmpl.requiereValidacionHSE,
        requiereValidacionCalidad: tmpl.requiereValidacionCalidad,
        requiereEvidencia: tmpl.requiereEvidencia,
        requiereChecklist: tmpl.requiereChecklist,
        checklist: tmpl.checklist.map(c => ({ ...c })),
        repuestosRequeridos: tmpl.repuestos,
        herramientasRequeridas: tmpl.herramientas
      }));
    }
  };

  const handleOpenWizard = () => {
    setWizardStep(1);
    setSelectedTemplateId('');
    const num = ots.length + 1;
    const padding = num.toString().padStart(3, '0');
    const defaultPlanta = plantas[0];

    setWizardOt({
      codigo: `OT-2026-${padding}`,
      plantaId: defaultPlanta?.id || '',
      plantaNombre: defaultPlanta?.name || '',
      activo: '',
      tipo: 'Preventiva',
      prioridad: 'Media',
      criticidad: 'Media',
      responsable: technicians[0]?.name || '',
      supervisor: defaultPlanta?.supervisor || supervisors[0]?.name || '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaLimite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estado: 'Nueva',
      avance: 0,
      hhEstimadas: 8,
      hhReales: 0,
      observaciones: '',
      riesgoDisponibilidad: 'No aplica',
      impacto: 'Medio' as any,
      origen: 'Manual Jefe O&M',
      diagnosticoInicial: '',
      impactoOperacional: 'Medio',
      riesgoHSE: 'Medio',
      riesgoCalidad: 'Medio',
      afectaProduccion: false,
      afectaSLA: false,
      coordinadorOM: coordinators[0]?.name || 'Rodolfo Garcés',
      supervisorTerreno: defaultPlanta?.supervisor || supervisors[0]?.name || '',
      tecnicoAsignado: technicians[0]?.name || '',
      areaTransversal: 'Ninguna',
      fechaProgramada: new Date().toISOString().split('T')[0],
      horaInicioEstimada: '08:30',
      horaTerminoEstimada: '17:30',
      ventanaTrabajo: 'Diurna (08:00 - 18:00)',
      dependencias: 'Ninguna',
      requiereProgramacionWorkspace: true,
      vehiculoRequerido: false,
      vehiculoSugerido: '',
      herramientasRequeridas: [],
      repuestosRequeridos: [],
      instrumentosRequeridas: [],
      bloqueoPorRecurso: false,
      observacionLogistica: '',
      requiereAST: true,
      astFirmado: false,
      requierePermisoTrabajo: false,
      requiereValidacionHSE: false,
      validacionHSE: 'Pendiente',
      requiereValidacionCalidad: false,
      validacionCalidad: 'Pendiente',
      requiereEvidencia: true,
      requiereChecklist: true,
      checklist: [
        { item: 'Verificación general preliminar', completado: false },
        { item: 'Inspección de conexiones eléctricas', completado: false },
        { item: 'Prueba funcional de operación', completado: false }
      ]
    });
    setIsCreatingWizard(true);
  };

  // Perform multi-module integrations on Wizard save
  const handleSaveWizard = (targetState: OTEstado) => {
    if (!wizardOt.activo || !wizardOt.observaciones) {
      alert('Por favor complete el Activo y las Observaciones antes de guardar.');
      return;
    }

    const plantaSelected = plantas.find(p => p.id === wizardOt.plantaId);
    
    const finalOt: OT = {
      ...(wizardOt as OT),
      estado: targetState,
      plantaNombre: plantaSelected ? plantaSelected.name : wizardOt.plantaNombre || '',
      responsable: wizardOt.tecnicoAsignado || wizardOt.responsable || '',
      supervisor: wizardOt.supervisorTerreno || wizardOt.supervisor || '',
      coordinador: wizardOt.coordinadorOM || 'Rodolfo Garcés',
      evidencias: [],
      lifecycleHistory: [
        {
          estadoNuevo: targetState,
          fecha: new Date().toISOString(),
          usuario: activeUserName,
          comentario: 'Orden de Trabajo creada desde el ORBI OT Center Wizard.'
        }
      ],
      historialCambios: [
        {
          fecha: new Date().toISOString().split('T')[0],
          usuario: activeUserName,
          accion: 'Creación',
          detalle: `OT despachada con estado: ${targetState}`
        }
      ]
    };

    // 1. Audit Log integration
    onAddAuditLog(
      `Despacho OT (${targetState})`,
      'ORBI OT Center',
      finalOt.codigo,
      finalOt.plantaNombre,
      `Nueva OT creada para ${finalOt.activo}. Prioridad: ${finalOt.prioridad}.`,
      finalOt.prioridad === 'Crítica' ? 'Crítica' : finalOt.prioridad === 'Alta' ? 'Alta' : 'Media'
    );

    // 2. Fleet integration
    if (finalOt.vehiculoRequerido && finalOt.vehiculoSugerido && onUpdateVehiculos) {
      const updatedVehiculos = vehiculos.map(v => {
        if (v.nombre === finalOt.vehiculoSugerido || v.patente === finalOt.vehiculoSugerido) {
          return {
            ...v,
            estado: 'Asignado',
            otVinculada: finalOt.codigo,
            plantaDestinoId: finalOt.plantaId,
            plantaDestinoNombre: finalOt.plantaNombre
          };
        }
        return v;
      });
      onUpdateVehiculos(updatedVehiculos);
    }

    // 3. Spares integration
    if (finalOt.repuestosRequeridos && finalOt.repuestosRequeridos.length > 0 && onUpdateRepuestos) {
      const updatedRepuestos = repuestos.map(r => {
        if (finalOt.repuestosRequeridos?.includes(r.nombre || r.codigo)) {
          return {
            ...r,
            estado: 'Asignado',
            otVinculada: finalOt.codigo,
            plantaDestinoNombre: finalOt.plantaNombre,
            responsable: finalOt.responsable
          };
        }
        return r;
      });
      onUpdateRepuestos(updatedRepuestos);
    }

    // 4. Tools integration
    if (finalOt.herramientasRequeridas && finalOt.herramientasRequeridas.length > 0 && onUpdateHerramientas) {
      const updatedHerramientas = herramientas.map(h => {
        if (finalOt.herramientasRequeridas?.includes(h.nombre || h.codigo)) {
          return {
            ...h,
            estado: 'Asignado',
            otVinculada: finalOt.codigo,
            plantaDestinoNombre: finalOt.plantaNombre,
            responsable: finalOt.responsable
          };
        }
        return h;
      });
      onUpdateHerramientas(updatedHerramientas);
    }

    // 5. Workspace Calendar integration
    if (finalOt.requiereProgramacionWorkspace && targetState !== 'Borrador' && onUpdatePlanificacion) {
      const newPlan: PlanPreventivo = {
        id: `PLAN-${Date.now().toString().substring(6)}`,
        plantaId: finalOt.plantaId,
        plantaNombre: finalOt.plantaNombre,
        actividad: `[OT ${finalOt.codigo}] ${finalOt.activo} - ${finalOt.observaciones.substring(0, 45)}...`,
        mes: new Date(finalOt.fechaProgramada || finalOt.fechaInicio).toLocaleString('es-ES', { month: 'long' }),
        semana: 1,
        estado: 'Programado',
        hhAsignadas: finalOt.hhEstimadas,
        recursos: finalOt.responsable,
        dependencias: finalOt.dependencias || 'Ninguna',
        riesgos: `Riesgo Disp: ${finalOt.riesgoDisponibilidad}`
      };
      onUpdatePlanificacion([newPlan, ...planificacion]);
    }

    onUpdate([finalOt, ...ots]);
    setIsCreatingWizard(false);
  };

  const handleEditClick = (ot: OT) => {
    setEditingOt({ ...ot });
    setActiveTab(0);
    setTransitionError(null);
    setSimulatedFileName('');
    setSimulatedFileDesc('');
  };

  // State transitions rules checking
  const handleStateChange = (targetState: OTEstado) => {
    if (!editingOt) return;
    setTransitionError(null);

    // Business rules checks for closure
    if (['Cerrada', 'Finalizada'].includes(targetState)) {
      if (editingOt.checklistExecution && editingOt.checklistExecution.length > 0) {
        const incomplete = editingOt.checklistExecution.some(c => !c.completado && !c.noAplica);
        if (incomplete) {
          setTransitionError('No se permite finalizar/cerrar la OT: El checklist de ejecución de campo está incompleto.');
          return;
        }
      }
      
      const hasEvidence = editingOt.evidencia || 
                           (editingOt.evidencias && editingOt.evidencias.length > 0) || 
                           (editingOt.evidencePack && editingOt.evidencePack.length > 0);
      if (editingOt.requiereEvidencia && !hasEvidence) {
        setTransitionError('No se permite finalizar/cerrar la OT: Requiere subir evidencia documental o fotográfica primero.');
        return;
      }
      if (!editingOt.hhReales || editingOt.hhReales <= 0) {
        setTransitionError('No se permite finalizar/cerrar la OT: Las Horas Hombre Reales (HH Ejecutadas) deben ser mayores a 0.');
        return;
      }
      if (editingOt.requiereAST && !editingOt.astFirmado) {
        setTransitionError('No se permite finalizar/cerrar la OT: Firma AST de terreno pendiente.');
        return;
      }
      if (editingOt.requiereValidacionHSE && editingOt.validacionHSE !== 'Aprobado') {
        setTransitionError('No se permite finalizar/cerrar la OT: Validación de seguridad HSE pendiente o rechazada.');
        return;
      }
      if (editingOt.requiereValidacionCalidad && editingOt.validacionCalidad !== 'Aprobado') {
        setTransitionError('No se permite finalizar/cerrar la OT: Validación de Aseguramiento de Calidad pendiente o rechazada.');
        return;
      }
      if (editingOt.bloqueada) {
        setTransitionError('No se permite finalizar la OT mientras se encuentre en estado de bloqueo operativo activo.');
        return;
      }
      const hasCriticalEscalation = escalaciones?.some(esc => esc.otVinculada === editingOt.codigo && (esc.criticidad === 'Crítica' || esc.criticidad === 'Alta') && esc.estado !== 'Resuelto' && esc.estado !== 'Cerrado');
      if (hasCriticalEscalation) {
        setTransitionError('No se permite finalizar/cerrar la OT: Existe un escalamiento de riesgo de criticidad Alta o Crítica abierto y sin resolver para este activo.');
        return;
      }
      if ((editingOt.criticidad === 'Crítica' || editingOt.prioridad === 'Crítica') && !editingOt.approvals?.some(a => ['JefeOM', 'JEFE_OM', 'Jefe O&M', 'Jefe de O&M'].includes(a.rol))) {
        setTransitionError('No se permite cerrar una OT de criticidad CRÍTICA sin la aprobación digital formal del Jefe de O&M.');
        return;
      }
    }

    // Role restriction for reopening
    if (targetState === 'Reabierta' && editingOt.estado === 'Cerrada') {
      if (userRole !== 'JEFE_OM' && userRole !== 'SUPER_ADMIN_ORBI') {
        setTransitionError('Sólo el Jefe de O&M o el Administrador de ORBI pueden reabrir una OT cerrada.');
        return;
      }
    }

    // Capture lifecycle transition history
    const historyEntry = {
      estadoAnterior: editingOt.estado,
      estadoNuevo: targetState,
      fecha: new Date().toISOString(),
      usuario: activeUserName,
      comentario: `Cambio de estado manual a ${targetState}`
    };

    const changesEntry = {
      fecha: new Date().toISOString().split('T')[0],
      usuario: activeUserName,
      accion: 'Transición Estado',
      detalle: `Estado cambió de ${editingOt.estado} a ${targetState}`
    };

    const updatedOt = {
      ...editingOt,
      estado: targetState,
      lifecycleHistory: [...(editingOt.lifecycleHistory || []), historyEntry],
      historialCambios: [...(editingOt.historialCambios || []), changesEntry],
      avance: targetState === 'Cerrada' || targetState === 'Finalizada' ? 100 : editingOt.avance
    };

    setEditingOt(updatedOt);
    
    // Auto audit log
    if (targetState === 'Reabierta') {
      onAddAuditLog(
        'Reapertura',
        'ORBI OT Center',
        editingOt.codigo,
        editingOt.plantaNombre,
        `La OT ${editingOt.codigo} ha sido reabierta manualmente por ${activeUserName} (${userRole}).`,
        'Alta'
      );
    } else {
      onAddAuditLog(
        `Estado OT → ${targetState}`,
        'ORBI OT Center',
        editingOt.codigo,
        editingOt.plantaNombre,
        `OT ${editingOt.codigo} cambió de estado a ${targetState}.`,
        ['Cerrada', 'Finalizada', 'Bloqueada'].includes(targetState) ? 'Alta' : 'Media'
      );
    }
  };

  const handleSaveEdit = () => {
    if (!editingOt) return;

    let updated = { ...editingOt };
    if (simulatedFileName && simulatedFileDesc) {
      const newEv = {
        url: 'attached_evidence.png',
        nombreArchivo: simulatedFileName,
        descripcion: simulatedFileDesc,
        fecha: new Date().toISOString().split('T')[0]
      };
      updated.evidencia = newEv;
      updated.evidencias = [...(updated.evidencias || []), newEv];
    }

    const idx = ots.findIndex(o => o.codigo === updated.codigo);
    if (idx !== -1) {
      const list = [...ots];
      list[idx] = updated;
      onUpdate(list);
      setEditingOt(null);
      onAddAuditLog(
        'Modificación OT',
        'ORBI OT Center',
        updated.codigo,
        updated.plantaNombre,
        `Se actualizaron parámetros de ejecución en la ficha de la OT ${updated.codigo}.`
      );
    }
  };

  // Sign off simulation
  const handleAddSignature = (roleLabel: string) => {
    if (!editingOt) return;
    const newApproval = {
      rol: roleLabel,
      nombre: activeUserName,
      fecha: new Date().toISOString(),
      comentario: `Firma digital acreditada por rol ${roleLabel}.`
    };

    const updatedHistory = {
      fecha: new Date().toISOString().split('T')[0],
      usuario: activeUserName,
      accion: 'Firma Digital',
      detalle: `Se firmó el protocolo como ${roleLabel}`
    };

    const updated = {
      ...editingOt,
      approvals: [...(editingOt.approvals || []), newApproval],
      historialCambios: [...(editingOt.historialCambios || []), updatedHistory]
    };

    if (roleLabel === 'HSE') updated.validacionHSE = 'Aprobado';
    if (roleLabel === 'CALIDAD') updated.validacionCalidad = 'Aprobado';

    setEditingOt(updated);
  };

  const getClosureValidationError = (ot: OT): string | null => {
    if (ot.checklistExecution && ot.checklistExecution.length > 0) {
      const incomplete = ot.checklistExecution.some(c => !c.completado && !c.noAplica);
      if (incomplete) {
        return 'No se permite finalizar/cerrar la OT: El checklist de ejecución de campo está incompleto.';
      }
    }
    const hasEvidence = ot.evidencia || 
                         (ot.evidencias && ot.evidencias.length > 0) || 
                         (ot.evidencePack && ot.evidencePack.length > 0);
    if (ot.requiereEvidencia && !hasEvidence) {
      return 'No se permite finalizar/cerrar la OT: Requiere subir evidencia documental o fotográfica primero.';
    }
    if (!ot.hhReales || ot.hhReales <= 0) {
      return 'No se permite finalizar/cerrar la OT: Las Horas Hombre Reales (HH Ejecutadas) deben ser mayores a 0.';
    }
    if (ot.requiereAST && !ot.astFirmado) {
      return 'No se permite finalizar/cerrar la OT: Firma AST de terreno pendiente.';
    }
    if (ot.requiereValidacionHSE && ot.validacionHSE !== 'Aprobado') {
      return 'No se permite finalizar/cerrar la OT: Validación de seguridad HSE pendiente o rechazada.';
    }
    if (ot.requiereValidacionCalidad && ot.validacionCalidad !== 'Aprobado') {
      return 'No se permite finalizar/cerrar la OT: Validación de Aseguramiento de Calidad pendiente o rechazada.';
    }
    if (ot.bloqueada) {
      return 'No se permite finalizar la OT mientras se encuentre en estado de bloqueo operativo activo.';
    }
    const hasCriticalEscalation = escalaciones?.some(esc => esc.otVinculada === ot.codigo && (esc.criticidad === 'Crítica' || esc.criticidad === 'Alta') && esc.estado !== 'Resuelto' && esc.estado !== 'Cerrado');
    if (hasCriticalEscalation) {
      return 'No se permite finalizar/cerrar la OT: Existe un escalamiento de riesgo de criticidad Alta o Crítica abierto y sin resolver para este activo.';
    }
    return null;
  };

  const handleApproveStage = (stage: 'Supervisor' | 'Coordinador' | 'HSE' | 'Calidad' | 'JefeOM') => {
    if (!editingOt) return;
    
    // Check validation error if closing
    if (stage === 'JefeOM') {
      const errorMsg = getClosureValidationError(editingOt);
      if (errorMsg) {
        alert(errorMsg);
        return;
      }
    }

    const now = new Date().toISOString();
    
    const newApproval = {
      rol: stage,
      nombre: activeUserName,
      fecha: now,
      comentario: tempComentarioRevisor || `Aprobación y firma digital de etapa por ${activeUserName} como ${stage}.`
    };

    const newLifecycle = {
      fecha: now,
      usuario: activeUserName,
      accion: `Validación ${stage}`,
      detalle: `Aprobado y firmado por ${activeUserName}`,
      estadoNuevo: editingOt.estado,
      comentario: tempComentarioRevisor
    };

    const updated = {
      ...editingOt,
      approvals: [...(editingOt.approvals || []), newApproval],
      lifecycleHistory: [...(editingOt.lifecycleHistory || []), newLifecycle],
      historialCambios: [...(editingOt.historialCambios || []), {
        fecha: now.split('T')[0],
        usuario: activeUserName,
        accion: `Validación ${stage}`,
        detalle: `Firma digital otorgada`
      }]
    };

    let logAction = '';
    let logComment = '';

    if (stage === 'Supervisor') {
      updated.estado = 'En revisión Coordinador';
      updated.comentarioSupervisor = tempComentarioRevisor;
      newLifecycle.estadoNuevo = 'En revisión Coordinador';
      logAction = 'Validación Supervisor';
      logComment = `Supervisor ${activeUserName} aprobó y firmó digitalmente la OT para revisión.`;
    } else if (stage === 'Coordinador') {
      updated.estado = 'Pendiente aprobación Jefe O&M';
      updated.comentarioCoordinador = tempComentarioRevisor;
      newLifecycle.estadoNuevo = 'Pendiente aprobación Jefe O&M';
      logAction = 'Validación Coordinador';
      logComment = `Coordinador ${activeUserName} aprobó y validó la OT. Pendiente de aprobación final del Jefe O&M.`;
    } else if (stage === 'HSE') {
      updated.validacionHSE = 'Aprobado';
      updated.firmaHSESimulada = activeUserName;
      updated.comentarioHSE = tempComentarioRevisor;
      logAction = 'Firma HSE';
      logComment = `Acreditación de Seguridad firmada digitalmente por HSE ${activeUserName}.`;
    } else if (stage === 'Calidad') {
      updated.validacionCalidad = 'Aprobado';
      updated.firmaCalidadSimulada = activeUserName;
      updated.comentarioCalidad = tempComentarioRevisor;
      logAction = 'Firma Calidad';
      logComment = `Acreditación de Calidad firmada digitalmente por el Responsable de Calidad ${activeUserName}.`;
    } else if (stage === 'JefeOM') {
      updated.estado = 'Cerrada';
      updated.comentarioJefeOM = tempComentarioRevisor;
      updated.fechaCierre = now.split('T')[0];
      newLifecycle.estadoNuevo = 'Cerrada';
      logAction = 'Aprobación Jefe O&M';
      logComment = `Aprobación final de cierre otorgada por el Jefe de O&M ${activeUserName}.`;
    }

    // Save and persist immediately to parent
    const idx = ots.findIndex(o => o.codigo === updated.codigo);
    if (idx !== -1) {
      const list = [...ots];
      list[idx] = updated;
      onUpdate(list);
    }

    setEditingOt(updated);
    setTempComentarioRevisor('');
    
    // Add Audit Logs
    onAddAuditLog(
      logAction,
      'ORBI OT Center',
      updated.codigo,
      updated.plantaNombre,
      logComment,
      stage === 'JefeOM' ? 'Alta' : 'Media'
    );

    if (stage === 'JefeOM') {
      onAddAuditLog(
        'Cierre final',
        'ORBI OT Center',
        updated.codigo,
        updated.plantaNombre,
        `La OT ${updated.codigo} ha sido CERRADA y archivada oficialmente en el sistema tras la aprobación de la Jefatura.`,
        'Alta'
      );
    }

    alert(`¡Etapa ${stage} aprobada y firmada con éxito!`);
  };

  const handleDevolveToField = () => {
    if (!editingOt) return;
    if (!tempComentarioDevolucion.trim() || !tempDetallesFaltantes.trim()) {
      alert('Debe especificar un comentario de devolución y los detalles faltantes/pendientes.');
      return;
    }

    const now = new Date().toISOString();
    const newLifecycle = {
      fecha: now,
      usuario: activeUserName,
      accion: 'Devolución a Terreno',
      detalle: `Devuelta por ${activeUserName} debido a: ${tempMotivoDevolucion}`,
      estadoNuevo: 'Devuelta a ejecución' as OTEstado,
      comentario: tempComentarioDevolucion
    };

    const updated: OT = {
      ...editingOt,
      estado: 'Devuelta a ejecución',
      motivoDevolucion: tempMotivoDevolucion,
      comentarioDevolucion: tempComentarioDevolucion,
      detallesFaltantes: tempDetallesFaltantes,
      lifecycleHistory: [...(editingOt.lifecycleHistory || []), newLifecycle],
      historialCambios: [...(editingOt.historialCambios || []), {
        fecha: now.split('T')[0],
        usuario: activeUserName,
        accion: 'Devolución a Terreno',
        detalle: `OT devuelta a ejecución debido a observaciones de revisión.`
      }]
    };

    // Save and persist immediately to parent
    const idx = ots.findIndex(o => o.codigo === updated.codigo);
    if (idx !== -1) {
      const list = [...ots];
      list[idx] = updated;
      onUpdate(list);
    }

    setEditingOt(updated);
    setShowDevolutionForm(false);
    setTempComentarioDevolucion('');
    setTempDetallesFaltantes('');

    // Add Audit Log
    onAddAuditLog(
      'Devolución a ejecución',
      'ORBI OT Center',
      updated.codigo,
      updated.plantaNombre,
      `OT devuelta a ejecución por ${activeUserName}. Motivo: ${tempMotivoDevolucion}. Comentario: ${tempComentarioDevolucion}`,
      'Alta'
    );

    alert('La orden de trabajo ha sido devuelta a terreno con éxito.');
  };

  // Markdown summary generation
  const getExportMarkdown = (ot: OT) => {
    const hhDesviacion = (ot.hhReales || 0) - (ot.hhEstimadas || 0);
    const checklistCompletados = ot.checklistExecution?.filter(c => c.completado || c.noAplica).length || 0;
    const checklistTotal = ot.checklistExecution?.length || ot.checklist?.length || 0;
    
    const planta = plantas.find(p => p.id === ot.plantaId);
    const otZona = planta?.zona || 'Centro';
    const otDiagnostico = ot.diagnosticoInicial || ot.observaciones || 'Diagnóstico inicial estándar de pauta preventiva/correctiva.';

    // Dynamic AI Recommendation based on OT type
    let aiRec = "Monitorear telemetría de corriente y temperatura en el activo durante las próximas 48 horas de operación solar.";
    if (ot.tipo === 'Preventiva') {
      aiRec = "Frecuencia preventiva recomendada adecuada. Se sugiere calibrar termografía semestralmente para mitigar riesgos en barrares de MT.";
    } else if (ot.tipo === 'Correctiva' || ot.tipo === 'Emergencia') {
      aiRec = "Análisis de falla indica fatiga prematura por estrés térmico. Frecuencia preventiva recomendada: Incrementar inspección de torques de anual a trimestral. Monitorear degradación con FOTON PRIME O&M IA.";
    } else if (ot.tipo === 'HSE') {
      aiRec = "Mantener protocolos LOTO activos. Se sugiere reforzar capacitación trimestral sobre bloqueos mecánicos en inversores centrales.";
    }

    return `# REPORTE FORMAL DE CIERRE - ORBI O&M COMMAND CENTER
============================================================
Fecha de Reporte: ${new Date().toISOString().split('T')[0]}
ID de Control: REP-${ot.codigo}-${Math.floor(1000 + Math.random() * 9000)}
Versión de Esquema: v0.1.2C-closure-approvals-report-pack

## 1. ANTECEDENTES GENERALES
------------------------------------------------------------
* **Código OT:** ${ot.codigo}
* **Planta:** ${ot.plantaNombre}
* **Zona:** ${otZona}
* **Activo Afectado:** ${ot.activo}
* **Tipo de Mantención:** ${ot.tipo}
* **Prioridad:** ${ot.prioridad}
* **Criticidad:** ${ot.criticidad}
* **Estado Final:** ${ot.estado}
* **Diagnóstico Inicial:** ${otDiagnostico}

## 2. PERSONAL ASIGNADO Y CONTROL DE TIEMPOS
------------------------------------------------------------
* **Coordinador O&M:** ${ot.coordinadorOM || ot.coordinador || 'No asignado'}
* **Supervisor de Terreno:** ${ot.supervisorTerreno || ot.supervisor || 'No asignado'}
* **Ingeniero/Técnico Ejecutor:** ${ot.responsable || 'No asignado'}
* **Horas Hombre Planificadas:** ${ot.hhEstimadas} HH
* **Horas Hombre Reales:** ${ot.hhReales || 0} HH
* **Desviación Registrada:** ${hhDesviacion > 0 ? '+' : ''}${hhDesviacion} HH (${hhDesviacion === 0 ? 'Sin desviación' : hhDesviacion > 0 ? 'Sobrecosto de tiempo' : 'Ahorro de tiempo'})

## 3. PROTOCOLOS DE SEGURIDAD Y EJECUCIÓN EN TERRENO
------------------------------------------------------------
* **Check-in Terreno:** Confirmación de llegada simulada registrada con éxito.
* **AST (Análisis Seguro de Trabajo):** ${ot.astFirmado ? '✓ VALIDADO Y FIRMADO EN TERRENO' : '✗ PENDIENTE / NO REGISTRADO'}
* **Avance Físico Declarado:** ${ot.avance || 0}%
* **Tareas del Checklist:** ${checklistCompletados} de ${checklistTotal} completadas con éxito.
* **Diagnóstico Final Terreno:** ${ot.diagnosticoFinalTerreno || 'Ningún hallazgo adicional reportado.'}
* **Acciones Realizadas (Técnico):** ${ot.accionRealizadaTerreno || 'Ninguna acción registrada.'}
* **Resultado Técnico de Campo:** ${ot.resultadoTerreno || 'Exitoso / Solucionado'}
* **Acciones Adicionales / Comentarios:** ${ot.comentarioPropuestaCierre || 'Checklist finalizado sin novedades según pauta técnica estándar.'}

## 4. MATERIALES Y RECURSOS UTILIZADOS
------------------------------------------------------------
* **Herramientas Utilizadas:** ${ot.herramientasRequeridas?.join(', ') || 'Herramientas estándar'}
* **Repuestos Utilizados:** ${ot.repuestosRequeridos?.join(', ') || 'Ninguno'}
* **Vehículo de Apoyo:** ${ot.vehiculoSugerido || 'No requerido'}

## 5. REGISTROS DE EVIDENCIA Y BLOQUEOS
------------------------------------------------------------
* **Evidencias Registradas:** ${ot.evidencePack?.length || 0} archivos fotográficos adjuntos.
${ot.evidencePack?.map((e, idx) => `  - [Evidencia ${idx + 1}] Desc: ${e.description || 'Sin descripción'} | Hora: ${e.uploadedAt}`).join('\n') || '  (Ninguna evidencia fotográfica registrada)'}
* **Bloqueos de Campo:** ${ot.bloqueada ? '⚠️ SÍ - OT BLOQUEADA ACTUALMENTE' : '✓ No se reportan bloqueos activos.'}

## 6. VALIDACIONES, APROBACIONES Y COMENTARIOS
------------------------------------------------------------
* **Aprobación HSE Specialist:** ${ot.validacionHSE || 'Pendiente'} ${ot.firmaHSESimulada ? `(Firmado: ${ot.firmaHSESimulada})` : ''}
* **Aprobación Quality Specialist:** ${ot.validacionCalidad || 'Pendiente'} ${ot.firmaCalidadSimulada ? `(Firmado: ${ot.firmaCalidadSimulada})` : ''}
* **Comentario Supervisor:** "${ot.comentarioSupervisor || 'Sin comentarios registrados.'}"
* **Comentario Coordinador O&M:** "${ot.comentarioCoordinador || 'Sin comentarios registrados.'}"
* **Comentario Jefe O&M (Aprobador Final):** "${ot.comentarioJefeOM || 'Sin comentarios registrados.'}"
${ot.estado === 'Devuelta a ejecución' ? `\n⚠️ DETALLE DE DEVOLUCIÓN A EJECUCIÓN:\n* **Motivo:** ${ot.motivoDevolucion || 'No especificado'}\n* **Comentario:** ${ot.comentarioDevolucion || 'Sin comentarios'}\n* **Detalles Faltantes:** ${ot.detallesFaltantes || 'No especificados'}` : ''}

## 7. RECOMENDACIÓN DIGITAL FOTON PRIME O&M IA
------------------------------------------------------------
> 💡 **FOTON PRIME O&M IA indica:** ${aiRec}
> *La recomendación se basa en la criticidad del activo y la correlación con la tasa de fallas históricas.*

============================================================
Exportación documental avanzada podrá integrarse en una fase futura con ORBI DOCS IA.
============================================================`;
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('¡Resumen Markdown copiado al portapapeles con éxito!');
  };

  // Filter lists
  const filteredOts = ots.filter((ot) => {
    const matchesSearch =
      ot.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ot.activo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ot.plantaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ot.responsable.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'Todos' || ot.tipo === filterType;
    const matchesEstado = filterEstado === 'Todos' || ot.estado === filterEstado;
    
    const plantaAsociada = plantas.find((p) => p.id === ot.plantaId);
    const matchesZona = filterZona === 'Todas' || (plantaAsociada && plantaAsociada.zona === filterZona);

    return matchesSearch && matchesType && matchesEstado && matchesZona;
  });

  return (
    <div className="space-y-6">
      {/* MODULE HEADER */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-md shadow-xl">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2 tracking-tight">
            <FileText className="h-5 w-5 text-emerald-400" /> ORBI OT Center
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            ORBI OT Center controla el ciclo completo de la orden de trabajo: creación, planificación, ejecución, validación, cierre y trazabilidad.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800/60 text-slate-400">
            TOTAL EN COLA: <span className="text-emerald-400 font-bold">{ots.length} OTs</span>
          </div>

          {canCreate && (
            <button
              onClick={handleOpenWizard}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all hover:scale-102"
              id="btn-create-ot"
            >
              <PlusCircle className="h-4 w-4" /> Nuevo Despacho Wizard
            </button>
          )}
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-850 pb-2">
        <button
          onClick={() => {
            setActiveSubView('ots');
            setEditingOt(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeSubView === 'ots' && !editingOt
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          📋 Gestión de Órdenes de Trabajo (OT)
        </button>
        <button
          onClick={() => {
            setActiveSubView('scheduler');
            setEditingOt(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeSubView === 'scheduler'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          📅 {isTechnician ? 'Mi Agenda Técnica' : 'ORBI Scheduler IA'}
        </button>
        <button
          onClick={() => {
            setActiveSubView('vault');
            setEditingOt(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeSubView === 'vault'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          🔒 ORBI Evidence Vault &amp; Control GEO
        </button>
        {!isTechnician && (
          <button
            onClick={() => {
              setActiveSubView('sharepoint');
              setEditingOt(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeSubView === 'sharepoint'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            📁 ORBI SharePoint Router Mock
          </button>
        )}
        <button
          onClick={() => {
            setActiveSubView('ptw');
            setEditingOt(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeSubView === 'ptw'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          🛡️ ORBI PTW Center (Permisos)
        </button>
        {!isTechnician && (
          <button
            onClick={() => {
              setActiveSubView('inventory');
              setEditingOt(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeSubView === 'inventory'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            📦 Inventario O&M
          </button>
        )}
        {!isTechnician && (
          <button
            onClick={() => {
              setActiveSubView('reports');
              setEditingOt(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
              activeSubView === 'reports'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            📊 Report Center
          </button>
        )}
      </div>

      {activeSubView === 'scheduler' ? (
        <SchedulerIA
          ots={ots}
          plantas={plantas}
          organigrama={organigrama}
          onUpdateOts={onUpdate}
          userRole={userRole}
          activeUserName={activeUserName}
          onOpenOt={(ot) => {
            setEditingOt(ot);
            setActiveSubView('ots');
          }}
        />
      ) : activeSubView === 'vault' ? (
        <EvidenceVault
          ots={ots}
          plantas={plantas}
          userRole={userRole}
          onUpdateOts={onUpdate}
          onAddAuditLog={onAddAuditLog}
        />
      ) : activeSubView === 'sharepoint' ? (
        <SharePointRouter
          ots={ots}
          plantas={plantas}
          userRole={userRole}
          onUpdateOts={onUpdate}
          onAddAuditLog={onAddAuditLog}
        />
      ) : activeSubView === 'ptw' ? (
        <PTWCenter
          ptws={ptws}
          ots={ots}
          plantas={plantas}
          organigrama={organigrama}
          onUpdatePtws={onUpdatePtws}
          onUpdateOts={onUpdate}
          userRole={userRole}
          activeUserName={activeUserName}
          onAddAuditLog={onAddAuditLog}
        />
      ) : activeSubView === 'inventory' ? (
        <OMInventory
          ots={ots}
          plantas={plantas}
          userRole={userRole}
          activeUserName={activeUserName}
          onAddAuditLog={onAddAuditLog}
        />
      ) : activeSubView === 'reports' ? (
        <ReportCenter
          ots={ots}
          plantas={plantas}
          userRole={userRole}
          activeUserName={activeUserName}
          onUpdateOts={onUpdate}
          onAddAuditLog={onAddAuditLog}
        />
      ) : (
        <>
          {/* FILTER BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por código, activo, técnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-emerald-500/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todos" className="bg-slate-950 text-white">Todos los Tipos</option>
            {TIPOS_PERMITIDOS.map(t => (
              <option key={t} value={t} className="bg-slate-950 text-white">{t}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Activity className="h-4 w-4 text-slate-500" />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todos" className="bg-slate-950 text-white">Todos los Estados</option>
            {ESTADOS_PERMITIDOS.map(st => (
              <option key={st} value={st} className="bg-slate-950 text-white">{st}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <MapPin className="h-4 w-4 text-slate-500" />
          <select
            value={filterZona}
            onChange={(e) => setFilterZona(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todas" className="bg-slate-950 text-white">Todas las Zonas</option>
            <option value="Norte" className="bg-slate-950 text-white">Zona Norte</option>
            <option value="Centro" className="bg-slate-950 text-white">Zona Centro</option>
            <option value="Sur" className="bg-slate-950 text-white">Zona Sur</option>
          </select>
        </div>
      </div>

      {/* MULTI-STEP CREATION WIZARD MODAL */}
      {isCreatingWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-850 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest font-bold">NUEVO WIZARD DE DESPACHO</span>
                <h3 className="text-base font-black text-white mt-1">Crea e Integra una Orden de Trabajo</h3>
              </div>
              <button onClick={() => setIsCreatingWizard(false)} className="text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 hover:bg-slate-950">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper Steps Bar */}
            <div className="bg-slate-950/40 p-4 border-b border-slate-850 grid grid-cols-7 text-center font-mono text-[9px] text-slate-500 gap-1">
              {[
                'Identificación',
                'Criticidad',
                'Responsables',
                'Planificación',
                'Recursos',
                'Seguridad',
                'Confirmación'
              ].map((name, idx) => (
                <div key={idx} className={`flex flex-col items-center gap-1 ${wizardStep === idx + 1 ? 'text-emerald-400' : idx + 1 < wizardStep ? 'text-slate-300' : ''}`}>
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${wizardStep === idx + 1 ? 'bg-emerald-500 text-slate-950' : idx + 1 < wizardStep ? 'bg-slate-850 text-slate-300' : 'bg-slate-900 text-slate-600'}`}>
                    {idx + 1}
                  </span>
                  <span className="hidden sm:inline truncate w-full">{name}</span>
                </div>
              ))}
            </div>

            {/* Steps Content Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* PASO 1 — Identificación */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <FolderSync className="h-4 w-4 text-emerald-400" /> ¿Desea utilizar una Plantilla de OT O&M?
                    </h4>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="">-- Sin plantilla (Creación personalizada) --</option>
                      {OT_TEMPLATES.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.tipo})</option>
                      ))}
                    </select>
                    {selectedTemplateId && (
                      <p className="text-[10px] text-emerald-400 font-mono">
                        ✓ Campos preconfigurados, lista de tareas y recursos auto-asociados de forma segura.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Código de Tarea (Autogenerado)</label>
                      <input type="text" disabled value={wizardOt.codigo} className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-400 font-mono outline-none cursor-not-allowed" />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Origen de Solicitud</label>
                      <select
                        value={wizardOt.origen}
                        onChange={(e) => setWizardOt({ ...wizardOt, origen: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="Manual Jefe O&M">Manual Jefe O&M</option>
                        <option value="Coordinador O&M">Coordinador O&M</option>
                        <option value="Supervisor Terreno">Supervisor Terreno</option>
                        <option value="Centro de Control">Centro de Control</option>
                        <option value="HSE">HSE / Prevención de Riesgos</option>
                        <option value="Calidad">Calidad & Calibración</option>
                        <option value="Cliente">Cliente Comercial</option>
                        <option value="Preventivo programado">Preventivo programado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Tipo de Orden de Trabajo</label>
                      <select
                        value={wizardOt.tipo}
                        onChange={(e) => setWizardOt({ ...wizardOt, tipo: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        {TIPOS_PERMITIDOS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Selección de Planta Destino</label>
                      <select
                        value={wizardOt.plantaId}
                        onChange={(e) => {
                          const pl = plantas.find(p => p.id === e.target.value);
                          setWizardOt({
                            ...wizardOt,
                            plantaId: e.target.value,
                            plantaNombre: pl?.name || '',
                            supervisorTerreno: pl?.supervisor || supervisors[0]?.name || ''
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        {plantas.map(p => <option key={p.id} value={p.id}>{p.name} ({p.zona})</option>)}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Componente o Activo Afectado</label>
                      <input
                        type="text"
                        placeholder="Ej. Inversor de Corriente CC/AC 03, String de Paneles 14B..."
                        value={wizardOt.activo}
                        onChange={(e) => setWizardOt({ ...wizardOt, activo: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Diagnóstico Inicial de Entrada</label>
                      <textarea
                        rows={2}
                        placeholder="Describa la falla identificada, alarmas activadas o alcances del servicio preventivo..."
                        value={wizardOt.observaciones}
                        onChange={(e) => setWizardOt({ ...wizardOt, observaciones: e.target.value, diagnosticoInicial: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2 — Prioridad y Criticidad */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Prioridad Operacional</label>
                      <select
                        value={wizardOt.prioridad}
                        onChange={(e) => setWizardOt({ ...wizardOt, prioridad: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        {PRIORIDADES_PERMITIDAS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Criticidad del Activo</label>
                      <select
                        value={wizardOt.criticidad}
                        onChange={(e) => setWizardOt({ ...wizardOt, criticidad: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                        <option value="Crítica">Crítica</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Impacto Operacional</label>
                      <select
                        value={wizardOt.impactoOperacional}
                        onChange={(e) => setWizardOt({ ...wizardOt, impactoOperacional: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="Sin impacto">Sin impacto</option>
                        <option value="Bajo">Bajo</option>
                        <option value="Medio">Medio</option>
                        <option value="Alto">Alto</option>
                        <option value="Crítico">Crítico</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Riesgo de Disponibilidad</label>
                      <select
                        value={wizardOt.riesgoDisponibilidad}
                        onChange={(e) => setWizardOt({ ...wizardOt, riesgoDisponibilidad: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="No aplica">No aplica</option>
                        <option value="En observación">En observación</option>
                        <option value="Riesgo medio">Riesgo medio</option>
                        <option value="Riesgo alto">Riesgo alto</option>
                        <option value="Riesgo crítico">Riesgo crítico (Desconecta Activo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Riesgo HSE Prevención</label>
                      <select
                        value={wizardOt.riesgoHSE}
                        onChange={(e) => setWizardOt({ ...wizardOt, riesgoHSE: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="Bajo">Bajo</option>
                        <option value="Medio">Medio</option>
                        <option value="Alto">Alto</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Riesgo Calidad / Técnico</label>
                      <select
                        value={wizardOt.riesgoCalidad}
                        onChange={(e) => setWizardOt({ ...wizardOt, riesgoCalidad: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="Bajo">Bajo</option>
                        <option value="Medio">Medio</option>
                        <option value="Alto">Alto</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-6 md:col-span-2 py-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                        <input
                          type="checkbox"
                          checked={wizardOt.afectaProduccion}
                          onChange={(e) => setWizardOt({ ...wizardOt, afectaProduccion: e.target.checked })}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950 h-4 w-4"
                        />
                        <span>¿Afecta la producción de la planta solar?</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                        <input
                          type="checkbox"
                          checked={wizardOt.afectaSLA}
                          onChange={(e) => setWizardOt({ ...wizardOt, afectaSLA: e.target.checked })}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950 h-4 w-4"
                        />
                        <span>¿Compromete plazos de SLA?</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3 — Responsables */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Jefe de O&M Responsable</label>
                      <input type="text" disabled value="Felipe Soto" className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-400 font-mono outline-none cursor-not-allowed" />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Coordinador de O&M Asignado</label>
                      <select
                        value={wizardOt.coordinadorOM}
                        onChange={(e) => setWizardOt({ ...wizardOt, coordinadorOM: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        {coordinators.map(c => <option key={c.id} value={c.name}>{c.name} ({c.role})</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Supervisor Terreno Planta</label>
                      <select
                        value={wizardOt.supervisorTerreno}
                        onChange={(e) => setWizardOt({ ...wizardOt, supervisorTerreno: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        {supervisors.map(s => <option key={s.id} value={s.name}>{s.name} ({s.zona})</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Técnico / Ingeniero Asignado</label>
                      <select
                        value={wizardOt.tecnicoAsignado}
                        onChange={(e) => setWizardOt({ ...wizardOt, tecnicoAsignado: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        {technicians.map(t => {
                          const pers = recursosPersonas.find(rp => rp.nombre === t.name || rp.name === t.name);
                          const load = pers ? (pers.cargaSemanal || '60%') : '60%';
                          return (
                            <option key={t.id} value={t.name}>
                              {t.name} (Tasa Carga: {load})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Área Transversal Solicitante o de Apoyo</label>
                      <select
                        value={wizardOt.areaTransversal}
                        onChange={(e) => setWizardOt({ ...wizardOt, areaTransversal: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="Ninguna">Ninguna</option>
                        <option value="Prevención de Riesgos HSE">Prevención de Riesgos HSE</option>
                        <option value="Calidad & QA">Calidad & QA</option>
                        <option value="Bodega y Logística">Bodega y Logística</option>
                        <option value="Ingeniería & Comisionamiento">Ingeniería & Comisionamiento</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 4 — Planificación */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Fecha Límite Contractual</label>
                      <input type="date" value={wizardOt.fechaLimite} onChange={(e) => setWizardOt({ ...wizardOt, fechaLimite: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none" />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Fecha Programada Sugerida</label>
                      <input type="date" value={wizardOt.fechaProgramada} onChange={(e) => setWizardOt({ ...wizardOt, fechaProgramada: e.target.value, fechaInicio: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none" />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Hora Estimada Inicio</label>
                      <input type="time" value={wizardOt.horaInicioEstimada} onChange={(e) => setWizardOt({ ...wizardOt, horaInicioEstimada: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none" />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Hora Estimada Término</label>
                      <input type="time" value={wizardOt.horaTerminoEstimada} onChange={(e) => setWizardOt({ ...wizardOt, horaTerminoEstimada: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none" />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">HH Estimadas de Trabajo</label>
                      <input type="number" value={wizardOt.hhEstimadas} onChange={(e) => setWizardOt({ ...wizardOt, hhEstimadas: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none" />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Ventana de Trabajo</label>
                      <select
                        value={wizardOt.ventanaTrabajo}
                        onChange={(e) => setWizardOt({ ...wizardOt, ventanaTrabajo: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                      >
                        <option value="Diurna (08:00 - 18:00)">Diurna (08:00 - 18:00)</option>
                        <option value="Nocturna (18:00 - 08:00)">Nocturna (18:00 - 08:00)</option>
                        <option value="Ventana corta al mediodía (12:00 - 14:00)">Ventana corta (12:00 - 14:00)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">OT Antecesoras (Dependencias)</label>
                      <input type="text" placeholder="Ej. OT-2026-004 o Ninguna" value={wizardOt.dependencias} onChange={(e) => setWizardOt({ ...wizardOt, dependencias: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none" />
                    </div>

                    <div className="flex items-center py-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                        <input
                          type="checkbox"
                          checked={wizardOt.requiereProgramacionWorkspace}
                          onChange={(e) => setWizardOt({ ...wizardOt, requiereProgramacionWorkspace: e.target.checked })}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950 h-4 w-4"
                        />
                        <span>Crear y Sincronizar en ORBI Workspace</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 5 — Recursos */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center py-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                        <input
                          type="checkbox"
                          checked={wizardOt.vehiculoRequerido}
                          onChange={(e) => setWizardOt({ ...wizardOt, vehiculoRequerido: e.target.checked })}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950 h-4 w-4"
                        />
                        <span>¿Requiere vehículo de flota asignado?</span>
                      </label>
                    </div>

                    {wizardOt.vehiculoRequerido && (
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Vehículo de Flota Disponible</label>
                        <select
                          value={wizardOt.vehiculoSugerido}
                          onChange={(e) => setWizardOt({ ...wizardOt, vehiculoSugerido: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        >
                          <option value="">-- Seleccione vehículo --</option>
                          {vehiculos.map(v => (
                            <option key={v.id || v.patente} value={v.nombre || v.patente}>
                              {v.nombre} ({v.patente}) - {v.estado}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Herramientas Especiales Solicitadas</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {herramientas.slice(0, 6).map((h) => {
                          const isChecked = wizardOt.herramientasRequeridas?.includes(h.nombre || h.codigo) || false;
                          return (
                            <label key={h.codigo || h.id} className="flex items-center gap-1.5 text-slate-300 text-xs cursor-pointer p-2 bg-slate-950 rounded border border-slate-900">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const current = wizardOt.herramientasRequeridas || [];
                                  const updated = e.target.checked
                                    ? [...current, h.nombre || h.codigo]
                                    : current.filter(item => item !== (h.nombre || h.codigo));
                                  setWizardOt({ ...wizardOt, herramientasRequeridas: updated });
                                }}
                                className="rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 h-3.5 w-3.5"
                              />
                              <span className="truncate">{h.nombre || h.codigo}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Repuestos / Materiales Solicitados</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {repuestos.slice(0, 6).map((r) => {
                          const isChecked = wizardOt.repuestosRequeridos?.includes(r.nombre || r.codigo) || false;
                          return (
                            <label key={r.codigo || r.id} className="flex items-center gap-1.5 text-slate-300 text-xs cursor-pointer p-2 bg-slate-950 rounded border border-slate-900">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const current = wizardOt.repuestosRequeridos || [];
                                  const updated = e.target.checked
                                    ? [...current, r.nombre || r.codigo]
                                    : current.filter(item => item !== (r.nombre || r.codigo));
                                  setWizardOt({ ...wizardOt, repuestosRequeridos: updated });
                                }}
                                className="rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 h-3.5 w-3.5"
                              />
                              <span className="truncate">{r.nombre || r.codigo}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center py-2 md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                        <input
                          type="checkbox"
                          checked={wizardOt.bloqueoPorRecurso}
                          onChange={(e) => setWizardOt({ ...wizardOt, bloqueoPorRecurso: e.target.checked })}
                          className="rounded border-slate-800 text-rose-500 focus:ring-rose-500 bg-slate-950 h-4 w-4"
                        />
                        <span className="text-rose-400 font-bold">Bloquear OT inmediatamente por indisponibilidad de recursos en bodega</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 6 — Seguridad y Calidad */}
              {wizardStep === 6 && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" /> Protocolos de Seguridad y Calidad Requeridos
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 p-2 bg-slate-900 rounded border border-slate-800">
                        <input type="checkbox" checked={wizardOt.requiereAST} onChange={(e) => setWizardOt({ ...wizardOt, requiereAST: e.target.checked })} className="rounded text-emerald-500 h-4 w-4 bg-slate-950 border-slate-800" />
                        <span>Requiere Firma de AST en Terreno</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 p-2 bg-slate-900 rounded border border-slate-800">
                        <input type="checkbox" checked={wizardOt.requierePermisoTrabajo} onChange={(e) => setWizardOt({ ...wizardOt, requierePermisoTrabajo: e.target.checked })} className="rounded text-emerald-500 h-4 w-4 bg-slate-950 border-slate-800" />
                        <span>Requiere Permiso Especial de Trabajo</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 p-2 bg-slate-900 rounded border border-slate-800">
                        <input type="checkbox" checked={wizardOt.requiereValidacionHSE} onChange={(e) => setWizardOt({ ...wizardOt, requiereValidacionHSE: e.target.checked })} className="rounded text-emerald-500 h-4 w-4 bg-slate-950 border-slate-800" />
                        <span>Requiere Validación / Firma HSE</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 p-2 bg-slate-900 rounded border border-slate-800">
                        <input type="checkbox" checked={wizardOt.requiereValidacionCalidad} onChange={(e) => setWizardOt({ ...wizardOt, requiereValidacionCalidad: e.target.checked })} className="rounded text-emerald-500 h-4 w-4 bg-slate-950 border-slate-800" />
                        <span>Requiere Validación / Firma Calidad</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 p-2 bg-slate-900 rounded border border-slate-800">
                        <input type="checkbox" checked={wizardOt.requiereEvidencia} onChange={(e) => setWizardOt({ ...wizardOt, requiereEvidencia: e.target.checked })} className="rounded text-emerald-500 h-4 w-4 bg-slate-950 border-slate-800" />
                        <span>Exige Evidencia Fotográfica de Cierre</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 p-2 bg-slate-900 rounded border border-slate-800">
                        <input type="checkbox" checked={wizardOt.requiereChecklist} onChange={(e) => setWizardOt({ ...wizardOt, requiereChecklist: e.target.checked })} className="rounded text-emerald-500 h-4 w-4 bg-slate-950 border-slate-800" />
                        <span>Requiere Checklist Técnico Detallado</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 7 — Confirmación y Resumen */}
              {wizardStep === 7 && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Diagnóstico del Wizard - Listo para Despachar
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block uppercase text-[9px]">Código OT</span>
                        <strong className="text-white">{wizardOt.codigo}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[9px]">Tipo / Planta</span>
                        <strong className="text-white">{wizardOt.tipo} - {plantas.find(p => p.id === wizardOt.plantaId)?.name || wizardOt.plantaNombre}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[9px]">Activo</span>
                        <strong className="text-emerald-400">{wizardOt.activo || 'No especificado'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[9px]">Técnico Asignado</span>
                        <strong className="text-white">{wizardOt.tecnicoAsignado || 'Sin asignar'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[9px]">HH Estimadas</span>
                        <strong className="text-white">{wizardOt.hhEstimadas} hrs</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase text-[9px]">Riesgos</span>
                        <strong className="text-rose-400">Disp: {wizardOt.riesgoDisponibilidad}</strong>
                      </div>
                    </div>

                    <div className="border-t border-slate-900 pt-3 space-y-2">
                      <h5 className="text-[10px] font-mono text-slate-400 uppercase font-bold">Validación de Riesgos Detectados:</h5>
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded text-xs space-y-1">
                        {wizardOt.prioridad === 'Crítica' && (
                          <div className="text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> ALTA PRIORIDAD: Exigirá firma formal de Jefe de O&M para cerrar.
                          </div>
                        )}
                        {wizardOt.vehiculoRequerido && !wizardOt.vehiculoSugerido && (
                          <div className="text-amber-400 flex items-center gap-1">
                            <AlertOctagon className="h-3.5 w-3.5" /> LOGÍSTICA: No se seleccionó vehículo específico, se asignará uno por defecto de planta.
                          </div>
                        )}
                        {wizardOt.bloqueoPorRecurso && (
                          <div className="text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> BLOQUEO ACTIVO: Se creará con estado inicial 'Bloqueada'.
                          </div>
                        )}
                        <div className="text-emerald-400 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Sincronización automática de firmas HSE/Calidad configurada correctamente.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Actions Footer */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-850 flex justify-between items-center">
              <div>
                {wizardStep > 1 && (
                  <button
                    onClick={() => setWizardStep(prev => prev - 1)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 hover:bg-slate-900 flex items-center gap-1 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                {wizardStep < 7 ? (
                  <button
                    onClick={() => setWizardStep(prev => prev + 1)}
                    className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white hover:bg-slate-850 flex items-center gap-1 transition-colors"
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleSaveWizard('Borrador')}
                      className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 hover:bg-slate-900 transition-colors"
                    >
                      Guardar como Borrador
                    </button>
                    
                    <button
                      onClick={() => handleSaveWizard(wizardOt.bloqueoPorRecurso ? 'Bloqueada' : 'Nueva')}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs font-mono flex items-center gap-1 transition-colors"
                    >
                      <Check className="h-4 w-4" /> Despachar & Finalizar Wizard
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10-TAB DETAILED OT FICHE SIDE PANEL OR MODAL */}
      {editingOt && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-3xl h-full shadow-2xl flex flex-col justify-between" id="panel-editor-ot">
            {/* Panel Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-850 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest font-bold">
                    {editingOt.codigo}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Ficha de OT Profesional
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">
                  Control Integral y Protocolos de Cierre
                </h3>
              </div>
              <button
                onClick={() => setEditingOt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 hover:bg-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 10 Tabs Scrolling Bar */}
            <div className="bg-slate-950 border-b border-slate-850 flex items-center gap-1 px-4 py-2 overflow-x-auto no-scrollbar scroll-smooth">
              {[
                { label: 'Resumen', icon: FileText },
                { label: 'Planificación', icon: Calendar },
                { label: 'Personas', icon: User },
                { label: 'Logística', icon: Truck },
                { label: 'Repuestos & Herramientas', icon: Wrench },
                { label: 'Ejecución Terreno', icon: ClipboardList },
                { label: 'Evidencias', icon: Camera },
                { label: 'HSE & Calidad', icon: ShieldCheck },
                { label: 'Historial', icon: History },
                { label: 'Cierre', icon: CheckCircle }
              ].map((t, idx) => {
                const IconComp = t.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`flex items-center gap-1 text-[10px] font-mono px-3 py-1.5 rounded-lg border shrink-0 transition-all ${
                      activeTab === idx
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    <IconComp className="h-3.5 w-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* Error message banner */}
            {transitionError && (
              <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 flex items-start gap-2 text-rose-400 text-xs font-mono">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 animate-pulse mt-0.5" />
                <span>{transitionError}</span>
              </div>
            )}

            {/* Tabs Content Display Container */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-900/60">
              
              {/* TAB 0: Resumen */}
              {activeTab === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Código de Tarea</span>
                      <strong className="text-white">{editingOt.codigo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Planta</span>
                      <strong className="text-white">{editingOt.plantaNombre}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Activo solar afectado</span>
                      <strong className="text-emerald-400">{editingOt.activo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Tipo de Mantención</span>
                      <strong className="text-white">{editingOt.tipo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Prioridad</span>
                      <strong className={`font-bold ${editingOt.prioridad === 'Crítica' ? 'text-rose-400 animate-pulse' : 'text-white'}`}>{editingOt.prioridad}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Criticidad del Servicio</span>
                      <strong className="text-white">{editingOt.criticidad || 'Alta'}</strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Diagnóstico de Entrada</label>
                    <p className="text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-900 leading-relaxed font-mono italic">
                      "{editingOt.diagnosticoInicial || editingOt.observaciones || 'Sin diagnóstico registrado.'}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-950/30 p-4 rounded-xl border border-slate-900">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Origen de Creación</span>
                      <span className="text-slate-300">{editingOt.origen || 'Manual'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Riesgo Disponibilidad</span>
                      <span className="text-rose-400">{editingOt.riesgoDisponibilidad}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: Planificación */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                    <div>
                      <span className="text-slate-500 block text-[9px]">FECHA LÍMITE CONTRACTUAL</span>
                      <strong className="text-white">{editingOt.fechaLimite}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">FECHA PROGRAMADA</span>
                      <strong className="text-emerald-400">{editingOt.fechaProgramada || editingOt.fechaInicio || 'Pendiente'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">HORA ESTIMADA INICIO</span>
                      <span className="text-slate-300">{editingOt.horaInicioEstimada || '08:30'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">HORA ESTIMADA TÉRMINO</span>
                      <span className="text-slate-300">{editingOt.horaTerminoEstimada || '17:30'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                    <div>
                      <span className="text-slate-500 block text-[9px]">HH PLANIFICADAS (ESTIMADAS)</span>
                      <strong className="text-slate-200">{editingOt.hhEstimadas || 8} hrs</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">HH EJECUTADAS (REALES)</span>
                      <input
                        type="number"
                        min="0"
                        value={editingOt.hhReales}
                        onChange={(e) => setEditingOt({ ...editingOt, hhReales: Number(e.target.value) })}
                        className="bg-slate-900 text-emerald-400 border border-slate-800 rounded px-2 py-1 mt-1 font-bold w-24 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/30 border border-slate-900 rounded-xl text-xs font-mono space-y-2">
                    <div className="text-slate-500">DEPENDENCIAS DE ACTIVIDAD:</div>
                    <div className="text-slate-300">{editingOt.dependencias || 'Ninguna antecesora configurada.'}</div>
                  </div>
                </div>
              )}

              {/* TAB 2: Personas */}
              {activeTab === 2 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-mono text-slate-500 uppercase font-bold">Matriz de Responsables de la Orden</h4>
                    
                    <div className="space-y-2.5">
                      <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Jefe de O&M (Aprobador Superior)</span>
                          <span className="text-slate-200 font-bold">Felipe Soto</span>
                        </div>
                        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Activo</span>
                      </div>

                      <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Coordinador de O&M</span>
                          <span className="text-slate-200">{editingOt.coordinador || 'Rodolfo Garcés'}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">Planificación</span>
                      </div>

                      <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Supervisor en Terreno</span>
                          <span className="text-slate-200">{editingOt.supervisor || 'Alejandro Rojas'}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">Despacho</span>
                      </div>

                      <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Técnico Principal Asignado</span>
                          <span className="text-white font-bold">{editingOt.responsable || 'Sin asignar'}</span>
                        </div>
                        {editingOt.responsable && (
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 block">Tasa de Carga:</span>
                            <span className="text-emerald-400 font-bold font-mono">
                              {recursosPersonas.find(rp => rp.nombre === editingOt.responsable || rp.name === editingOt.responsable)?.cargaSemanal || '65%'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Logística */}
              {activeTab === 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                      <Truck className="h-4.5 w-4.5" /> Estado de Despacho de Flota
                    </div>

                    <div className="grid grid-cols-2 gap-4 font-mono">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Vehículo Requerido</span>
                        <strong className="text-white">{editingOt.vehiculoRequerido ? 'SÍ' : 'NO'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Vehículo Sugerido/Asignado</span>
                        <strong className="text-white">{editingOt.vehiculoSugerido || 'No se requirió vehículo'}</strong>
                      </div>
                    </div>
                  </div>

                  {editingOt.vehiculoRequerido && (
                    <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3 text-xs">
                      <div className="text-slate-400 font-mono font-bold uppercase text-[9px] tracking-wider">Ruta Estimada Simulada:</div>
                      
                      <div className="flex flex-col gap-2 font-mono text-[11px] text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          <span><strong>Salida:</strong> Copiapó Bodega Central (08:15 AM)</span>
                        </div>
                        <div className="h-4 w-0.5 bg-slate-800 ml-1"></div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                          <span><strong>Ruta:</strong> Ruta 5 Norte km 650 (En camino)</span>
                        </div>
                        <div className="h-4 w-0.5 bg-slate-800 ml-1"></div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                          <span><strong>Llegada:</strong> Planta Solar {editingOt.plantaNombre} (09:00 AM)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Repuestos & Herramientas */}
              {activeTab === 4 && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-4">
                    <h4 className="text-xs font-mono text-slate-300 uppercase font-bold flex items-center gap-1.5 border-b border-slate-900 pb-2">
                      <Package className="h-4 w-4 text-emerald-400" /> Repuestos & Materiales Vinculados
                    </h4>

                    {editingOt.repuestosRequeridos && editingOt.repuestosRequeridos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        {editingOt.repuestosRequeridos.map((rep, idx) => {
                          const repMatch = repuestos.find(r => r.nombre === rep || r.codigo === rep);
                          const stock = repMatch ? `${repMatch.cantidadDisponible || 15} unid.` : 'Disponible';
                          return (
                            <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded flex justify-between items-center">
                              <span className="text-white">{rep}</span>
                              <span className="text-emerald-400 text-[10px] bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">Stock: {stock}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No se asociaron repuestos específicos a esta Orden de Trabajo.</p>
                    )}
                  </div>

                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-4">
                    <h4 className="text-xs font-mono text-slate-300 uppercase font-bold flex items-center gap-1.5 border-b border-slate-900 pb-2">
                      <Wrench className="h-4 w-4 text-emerald-400" /> Herramientas Especiales & Instrumentos
                    </h4>

                    {editingOt.herramientasRequeridas && editingOt.herramientasRequeridas.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        {editingOt.herramientasRequeridas.map((herr, idx) => (
                          <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded flex justify-between items-center">
                            <span className="text-white">{herr}</span>
                            <span className="text-slate-400 text-[10px]">Asignado</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No se registraron herramientas especiales adicionales.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: Ejecución Terreno */}
              {activeTab === 5 && (
                <div className="space-y-4">
                  {editingOt.requiereChecklist && (
                    <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3">
                      <h4 className="text-xs font-mono text-slate-300 uppercase font-bold border-b border-slate-900 pb-2">Checklist Técnico Obligatorio</h4>
                      
                      <div className="space-y-2">
                        {editingOt.checklist && editingOt.checklist.length > 0 ? (
                          editingOt.checklist.map((item, idx) => (
                            <label key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer p-2 hover:bg-slate-900/50 rounded transition-colors">
                              <input
                                type="checkbox"
                                checked={item.completado}
                                onChange={(e) => {
                                  const updatedChecklist = [...(editingOt.checklist || [])];
                                  updatedChecklist[idx] = { ...item, completado: e.target.checked };
                                  setEditingOt({ ...editingOt, checklist: updatedChecklist });
                                }}
                                className="rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-800 h-4 w-4 mt-0.5"
                              />
                              <span>{item.item}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">Sin items de checklist en esta OT.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-bold">Porcentaje de Avance (%)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingOt.avance}
                          onChange={(e) => setEditingOt({ ...editingOt, avance: Number(e.target.value) })}
                          className="accent-emerald-500 flex-1 h-1.5 bg-slate-800 rounded-lg"
                        />
                        <span className="text-xs text-white font-bold">{editingOt.avance}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-bold">Bloqueo Operacional Activo</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingOt.bloqueada}
                          onChange={(e) => setEditingOt({ ...editingOt, bloqueada: e.target.checked })}
                          className="rounded text-rose-500 focus:ring-rose-500 bg-slate-950 border-slate-800 h-4 w-4"
                        />
                        <span className={editingOt.bloqueada ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {editingOt.bloqueada ? 'SÍ (Bloqueada)' : 'NO'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Diagnóstico Final Técnico</label>
                    <textarea
                      rows={2}
                      value={editingOt.closeSummary}
                      onChange={(e) => setEditingOt({ ...editingOt, closeSummary: e.target.value })}
                      placeholder="Indique los hallazgos finales, fallas confirmadas y soluciones implementadas en terreno..."
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none resize-none font-mono"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* TAB 6: Evidencias */}
              {activeTab === 6 && (
                <div className="space-y-4">
                  <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                      <Upload className="h-4 w-4 text-emerald-500" /> Registro de Evidencia Fotográfica / Documental
                    </span>

                    {editingOt.evidencia ? (
                      <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-900 flex justify-between items-start">
                        <div className="space-y-1 text-xs">
                          <div className="font-bold text-white flex items-center gap-1 font-mono">
                            <CheckSquare className="h-3.5 w-3.5 text-emerald-400" /> {editingOt.evidencia.nombreArchivo}
                          </div>
                          <p className="text-[11px] text-slate-400">{editingOt.evidencia.descripcion}</p>
                          <span className="text-[9px] text-slate-600 block">{editingOt.evidencia.fecha}</span>
                        </div>
                        <button
                          onClick={() => setEditingOt({ ...editingOt, evidencia: null })}
                          className="text-xs text-rose-500 font-mono hover:underline"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 font-mono">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Nombre archivo (ej. termografia_inv_3.jpg)"
                            value={simulatedFileName}
                            onChange={(e) => setSimulatedFileName(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Descripción de la evidencia..."
                            value={simulatedFileDesc}
                            onChange={(e) => setSimulatedFileDesc(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <p className="text-[9px] text-slate-500">
                          *Complete ambos campos para simular el envío de un archivo desde terreno.
                        </p>
                      </div>
                    )}
                  </div>

                  {editingOt.evidencePack && editingOt.evidencePack.length > 0 && (
                    <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl space-y-3">
                      <span className="text-[10px] font-mono text-amber-500 uppercase flex items-center gap-1 font-bold">
                        📁 Evidence Pack — Recibido desde Dispositivo Móvil en Terreno
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {editingOt.evidencePack.map((ev) => (
                          <div key={ev.evidenceId} className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850/60 space-y-1.5 font-mono text-[11px]">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-200">{ev.label}</span>
                              <span className={`px-1.5 py-0.2 rounded-full font-bold uppercase text-[8px] ${
                                ev.status === 'Completado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {ev.status}
                              </span>
                            </div>
                            {ev.simulatedFileName ? (
                              <p className="text-emerald-400 font-bold break-all">✓ Archivo: {ev.simulatedFileName}</p>
                            ) : (
                              <p className="text-slate-500 italic">Pendiente de captura por técnico</p>
                            )}
                            {ev.description && (
                              <p className="text-slate-400 text-[10px] bg-slate-950/60 p-1.5 rounded">{ev.description}</p>
                            )}
                            {ev.uploadedAt && (
                              <span className="text-[9px] text-slate-600 block">Fecha Carga: {ev.uploadedAt}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: HSE & Calidad */}
              {activeTab === 7 && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3 font-mono text-xs text-slate-300">
                    <h4 className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5 border-b border-slate-900 pb-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" /> Protocolo de Firmas de Seguridad Industrial
                    </h4>

                    <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded">
                      <div>
                        <span>Firma del AST en Terreno:</span>
                        <p className="text-[10px] text-slate-500">Obligatorio antes de iniciar maniobras.</p>
                      </div>
                      <button
                        onClick={() => setEditingOt({ ...editingOt, astFirmado: !editingOt.astFirmado })}
                        className={`px-3 py-1 rounded text-[10px] font-bold ${
                          editingOt.astFirmado ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-500 border border-slate-850'
                        }`}
                      >
                        {editingOt.astFirmado ? 'AST FIRMADO' : 'FIRMAR AST'}
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded">
                      <div>
                        <span>Validación HSE Specialist:</span>
                        <p className="text-[10px] text-slate-500">Validación de riesgos específicos en terreno.</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-[10px] font-bold ${
                        editingOt.validacionHSE === 'Aprobado' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-500 border border-slate-850'
                      }`}>
                        {editingOt.validacionHSE === 'Aprobado' ? 'APROBADO HSE' : 'PENDIENTE'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded">
                      <div>
                        <span>Validación Quality Analyst:</span>
                        <p className="text-[10px] text-slate-500">Validación de cumplimiento de estándares técnicos.</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-[10px] font-bold ${
                        editingOt.validacionCalidad === 'Aprobado' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-500 border border-slate-850'
                      }`}>
                        {editingOt.validacionCalidad === 'Aprobado' ? 'APROBADO CALIDAD' : 'PENDIENTE'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: Historial / Audit Log */}
              {activeTab === 8 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-mono text-slate-500 uppercase font-bold">Línea de Tiempo del Ciclo de Vida</h4>
                  
                  <div className="relative border-l-2 border-slate-800 ml-3.5 pl-5 space-y-4 font-mono text-xs">
                    {editingOt.lifecycleHistory && editingOt.lifecycleHistory.length > 0 ? (
                      editingOt.lifecycleHistory.map((h, i) => (
                        <div key={i} className="relative">
                          <span className="absolute -left-7.5 top-1 bg-slate-950 border border-slate-800 h-3.5 w-3.5 rounded-full flex items-center justify-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          </span>
                          <div className="text-[10px] text-slate-500">{new Date(h.fecha).toLocaleString()}</div>
                          <div className="text-slate-300 font-bold">Cambio a: {h.estadoNuevo}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Usuario: {h.usuario}</div>
                          {h.comentario && <p className="text-[11px] text-slate-500 italic mt-0.5">"{h.comentario}"</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic">Sin historial registrado aún.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 9: Cierre */}
              {activeTab === 9 && (
                <div className="space-y-4 font-mono text-xs text-slate-300">
                  {/* ESTADO DE CIERRE CABECERA */}
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400">ESTADO OPERACIONAL DE CIERRE</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Control de flujo formal de validaciones, firmas y entregables.</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      editingOt.estado === 'Cerrada' ? 'bg-slate-900 text-slate-500 border border-slate-800' :
                      editingOt.estado === 'Devuelta a ejecución' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25 animate-pulse' :
                      editingOt.estado === 'Pendiente aprobación Jefe O&M' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                      'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25'
                    }`}>
                      {editingOt.estado}
                    </span>
                  </div>

                  {/* CRITERIOS DE ACEPTACIÓN CHECKLIST */}
                  <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-900 pb-2">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-400" /> Criterios de Aceptación & Auditoría
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Checkboxes de seguridad y tiempos */}
                      <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between items-center p-2 bg-slate-900/60 rounded">
                          <span>Horas Hombre Registradas:</span>
                          <strong className={editingOt.hhReales && editingOt.hhReales > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {editingOt.hhReales || 0} HH ({editingOt.hhReales && editingOt.hhReales > 0 ? '✓ Registrado' : '✗ Faltante'})
                          </strong>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-900/60 rounded">
                          <span>Análisis AST en Terreno:</span>
                          <strong className={editingOt.astFirmado ? 'text-emerald-400' : 'text-rose-400'}>
                            {editingOt.astFirmado ? '✓ Firmado' : '✗ Pendiente'}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-900/60 rounded">
                          <span>Aprobación HSE Specialist:</span>
                          <strong className={editingOt.validacionHSE === 'Aprobado' ? 'text-emerald-400' : 'text-amber-400'}>
                            {editingOt.validacionHSE === 'Aprobado' ? `✓ Aprobado` : '✗ Pendiente'}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-900/60 rounded">
                          <span>Aprobación Quality Specialist:</span>
                          <strong className={editingOt.validacionCalidad === 'Aprobado' ? 'text-emerald-400' : 'text-amber-400'}>
                            {editingOt.validacionCalidad === 'Aprobado' ? `✓ Aprobado` : '✗ Pendiente'}
                          </strong>
                        </div>
                      </div>

                      {/* Estado de bloqueos y alertas */}
                      <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between items-center p-2 bg-slate-900/60 rounded">
                          <span>Bloqueos de Campo Activos:</span>
                          <strong className={editingOt.bloqueada ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}>
                            {editingOt.bloqueada ? '⚠️ Sí - OT Bloqueada' : '✓ No se registran'}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-900/60 rounded">
                          <span>Checklist Técnico Completado:</span>
                          <strong className="text-slate-300">
                            {editingOt.checklistExecution?.filter(c => c.completado || c.noAplica).length || 0} de {editingOt.checklistExecution?.length || 0} ítems
                          </strong>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-900/60 rounded">
                          <span>Resultado de Ejecución:</span>
                          <strong className="text-slate-300">{editingOt.resultadoTerreno || 'No definido'}</strong>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-900/60 rounded">
                          <span>Avance Declarado:</span>
                          <strong className="text-emerald-400">{editingOt.avance || 0}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* EVIDENCIA COMPLETA: EVIDENCE PACK VIEWER */}
                    <div className="mt-3 pt-3 border-t border-slate-900/60">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">📸 Paquete de Evidencias de Campo (Evidence Pack)</span>
                      {editingOt.evidencePack && editingOt.evidencePack.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {editingOt.evidencePack.map((evi, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-850 rounded p-2 space-y-1">
                              <div className="h-20 w-full bg-slate-950 rounded flex items-center justify-center text-slate-600 text-[10px] font-mono relative overflow-hidden group">
                                <img
                                  src={evi.simulatedFileName && evi.simulatedFileName.startsWith('http') ? evi.simulatedFileName : 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=200&auto=format&fit=crop&q=60'}
                                  alt={`Evidencia ${idx}`}
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <p className="text-[8px] text-slate-300 truncate" title={evi.description}>{evi.description || 'Sin descripción'}</p>
                              <div className="flex justify-between text-[7px] text-slate-500 font-mono">
                                <span>{evi.uploadedAt}</span>
                                <span className="text-slate-400 truncate max-w-[50px]">{evi.uploadedBy || 'Téc.'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-950 text-center rounded border border-dashed border-slate-900 text-slate-500 text-[10px]">
                          No se han adjuntado evidencias fotográficas desde terreno aún.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COMENTARIO DE DEVOLUCIÓN ANTERIOR (SI EXISTE) */}
                  {editingOt.estado === 'Devuelta a ejecución' && (
                    <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-1.5 text-[11px] text-rose-300">
                      <span className="font-bold flex items-center gap-1 text-rose-400">↩️ DETALLES DE LA ÚLTIMA DEVOLUCIÓN</span>
                      <p><span className="text-slate-400">Motivo de Devolución:</span> <strong>{editingOt.motivoDevolucion || 'Falta información'}</strong></p>
                      <p className="text-[10px] text-slate-300"><span className="text-slate-500">Observación:</span> "{editingOt.comentarioDevolucion}"</p>
                      <p className="text-[10px] text-amber-300"><span className="text-amber-500">Detalles Faltantes:</span> {editingOt.detallesFaltantes}</p>
                    </div>
                  )}

                  {/* ACCIONES DE REVISIÓN Y APROBACIÓN POR ROL */}
                  <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-900 pb-2">
                      🛡️ Acciones de Control de Calidad y Cierre
                    </h4>

                    {/* Formulario de comentarios generales del revisor activo */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Comentario u Observación del Revisor:</label>
                      <textarea
                        rows={2}
                        value={tempComentarioRevisor}
                        onChange={(e) => setTempComentarioRevisor(e.target.value)}
                        placeholder="Escriba comentarios, salvedades técnicas o anotaciones de aprobación..."
                        className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white outline-none font-mono focus:border-emerald-500/50 resize-none"
                      ></textarea>
                    </div>

                    {/* Botones de acción contextuales según el rol activo */}
                    <div className="flex flex-wrap gap-2.5">
                      {/* Supervisor Terreno */}
                      {userRole === 'SUPERVISOR_TERRENO' && (
                        <button
                          onClick={() => handleApproveStage('Supervisor')}
                          className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-lg flex items-center gap-1"
                        >
                          ✓ Validar como Supervisor Terreno
                        </button>
                      )}

                      {/* Coordinador O&M */}
                      {userRole === 'COORDINADOR_OM' && (
                        <button
                          onClick={() => handleApproveStage('Coordinador')}
                          className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-slate-950 font-bold rounded-lg flex items-center gap-1"
                        >
                          ✓ Validar como Coordinador O&M
                        </button>
                      )}

                      {/* HSE Specialist */}
                      {userRole === 'HSE' && (
                        <button
                          onClick={() => handleApproveStage('HSE')}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg flex items-center gap-1"
                        >
                          ✓ Validar HSE Specialist
                        </button>
                      )}

                      {/* Quality Analyst */}
                      {userRole === 'CALIDAD' && (
                        <button
                          onClick={() => handleApproveStage('Calidad')}
                          className="px-3.5 py-1.5 bg-purple-500 hover:bg-purple-600 text-slate-950 font-bold rounded-lg flex items-center gap-1"
                        >
                          ✓ Validar Quality Analyst
                        </button>
                      )}

                      {/* Jefe O&M (Aprobador final) */}
                      {userRole === 'JEFE_OM' && (
                        <button
                          onClick={() => handleApproveStage('JefeOM')}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg flex items-center gap-1"
                        >
                          👑 Aprobar Cierre Final (Jefe O&M)
                        </button>
                      )}

                      {/* Botón Devolver a Ejecución Terreno */}
                      {['SUPERVISOR_TERRENO', 'COORDINADOR_OM', 'HSE', 'CALIDAD', 'JEFE_OM'].includes(userRole) && (
                        <button
                          onClick={() => setShowDevolutionForm(!showDevolutionForm)}
                          className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold rounded-lg flex items-center gap-1"
                        >
                          ↩ Devolver a Ejecución Terreno
                        </button>
                      )}
                    </div>

                    {/* FORMULARIO DESPLEGABLE DE DEVOLUCIÓN */}
                    {showDevolutionForm && (
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-2.5 mt-2 animate-fade-in text-[11px]">
                        <h5 className="font-bold text-rose-400">FORMULARIO DE DEVOLUCIÓN A EJECUCIÓN</h5>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] text-slate-500 block uppercase">Motivo Principal:</label>
                            <select
                              value={tempMotivoDevolucion}
                              onChange={(e) => setTempMotivoDevolucion(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-200 outline-none"
                            >
                              <option value="Evidencia insuficiente">Evidencia fotográfica insuficiente o difusa</option>
                              <option value="Checklist incompleto">Checklist técnico incompleto / sin rellenar</option>
                              <option value="Falta firma AST">Falta firma AST en terreno</option>
                              <option value="Bloqueo no resuelto">Bloqueo reportado activo no solucionado</option>
                              <option value="Falta registrar HH">Horas Hombre referenciales no registradas</option>
                              <option value="Otro motivo">Otro motivo operacional</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block uppercase">Qué debe completar el técnico:</label>
                            <input
                              type="text"
                              value={tempDetallesFaltantes}
                              onChange={(e) => setTempDetallesFaltantes(e.target.value)}
                              placeholder="Ej: Adjuntar foto de placa de inversor y registrar HH."
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block uppercase">Instrucciones detalladas de corrección:</label>
                          <textarea
                            rows={2}
                            value={tempComentarioDevolucion}
                            onChange={(e) => setTempComentarioDevolucion(e.target.value)}
                            placeholder="Detalle los hallazgos técnicos y las correcciones que debe realizar el equipo de terreno antes de volver a solicitar cierre..."
                            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white outline-none resize-none"
                          ></textarea>
                        </div>

                        <button
                          onClick={handleDevolveToField}
                          className="w-full py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded font-mono uppercase text-[10px]"
                        >
                          Enviar Orden de Devolución a Campo ↩
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LÍNEA DE TIEMPO / TIMELINE DE CIERRE */}
                  <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-900 pb-2">
                      ⏳ Historial y Línea de Tiempo de Cierre
                    </h4>
                    <div className="relative border-l-2 border-slate-800 ml-3.5 pl-5 space-y-3.5 text-[11px]">
                      {/* Técnico / Proponente */}
                      <div className="relative">
                        <span className="absolute -left-7 top-1 bg-emerald-500 h-3.5 w-3.5 rounded-full flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-950"></span>
                        </span>
                        <div className="font-bold text-slate-200">1. PROPUESTA TÉCNICA DE CIERRE</div>
                        <p className="text-[10px] text-slate-400">Usuario ejecutor: <span className="text-slate-300">{editingOt.responsable}</span></p>
                        <p className="text-[10px] text-slate-500 italic mt-0.5">"{editingOt.comentarioPropuestaCierre || 'Checklist finalizado sin novedades en terreno.'}"</p>
                      </div>

                      {/* Supervisor */}
                      <div className="relative">
                        <span className={`absolute -left-7 top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                          editingOt.comentarioSupervisor ? 'bg-cyan-400' : 'bg-slate-800'
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-950"></span>
                        </span>
                        <div className={`font-bold ${editingOt.comentarioSupervisor ? 'text-slate-200' : 'text-slate-500'}`}>2. VALIDACIÓN SUPERVISOR TERRENO</div>
                        {editingOt.comentarioSupervisor ? (
                          <div className="mt-0.5 space-y-0.5">
                            <p className="text-[10px] text-slate-400">Usuario: <span className="text-slate-300">{editingOt.supervisorTerreno || editingOt.supervisor}</span></p>
                            <p className="text-[10px] text-slate-500 italic">"{editingOt.comentarioSupervisor}"</p>
                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-600 italic">Pendiente de validación de supervisor.</p>
                        )}
                      </div>

                      {/* Coordinador */}
                      <div className="relative">
                        <span className={`absolute -left-7 top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                          editingOt.comentarioCoordinador ? 'bg-blue-400' : 'bg-slate-800'
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-950"></span>
                        </span>
                        <div className={`font-bold ${editingOt.comentarioCoordinador ? 'text-slate-200' : 'text-slate-500'}`}>3. VALIDACIÓN COORDINADOR O&M</div>
                        {editingOt.comentarioCoordinador ? (
                          <div className="mt-0.5 space-y-0.5">
                            <p className="text-[10px] text-slate-400">Usuario: <span className="text-slate-300">{editingOt.coordinadorOM || editingOt.coordinador}</span></p>
                            <p className="text-[10px] text-slate-500 italic">"{editingOt.comentarioCoordinador}"</p>
                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-600 italic">Pendiente de validación de coordinador.</p>
                        )}
                      </div>

                      {/* Jefe O&M */}
                      <div className="relative">
                        <span className={`absolute -left-7 top-1 h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                          editingOt.estado === 'Cerrada' ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-950"></span>
                        </span>
                        <div className={`font-bold ${editingOt.estado === 'Cerrada' ? 'text-slate-200' : 'text-slate-500'}`}>4. APROBACIÓN FINAL Y CIERRE</div>
                        {editingOt.estado === 'Cerrada' ? (
                          <div className="mt-0.5 space-y-0.5">
                            <p className="text-[10px] text-slate-400">Aprobador: <span className="text-slate-300">{editingOt.jefaturaO_M || 'Jefe de O&M'}</span></p>
                            <p className="text-[10px] text-slate-500 italic">"{editingOt.comentarioJefeOM || 'Cierre formal de orden de trabajo acreditado.'}"</p>
                            {editingOt.fechaCierre && <p className="text-[10px] text-emerald-400">Fecha Cierre: {editingOt.fechaCierre}</p>}
                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-600 italic">Pendiente de aprobación de Jefatura O&M.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* REPORT PACK: COPIABLE TEXT SUMMARY */}
                  <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3">
                    <h4 className="text-xs font-mono text-slate-300 uppercase font-bold flex justify-between items-center">
                      <span>Reporte de Cierre de OT (Copiable)</span>
                      <button
                        onClick={() => handleCopyToClipboard(getExportMarkdown(editingOt))}
                        className="bg-slate-900 hover:bg-slate-850 text-emerald-400 text-[10px] font-mono px-2 py-1 rounded border border-slate-800 flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Copiar Reporte
                      </button>
                    </h4>
                    <p className="text-[9px] text-slate-500 font-mono italic">
                      *La exportación documental avanzada se integrará en una fase futura con ORBI DOCS IA.
                    </p>
                    <textarea
                      readOnly
                      rows={12}
                      value={getExportMarkdown(editingOt)}
                      className="w-full bg-slate-950 border border-slate-900 rounded p-3 text-[10px] text-slate-400 font-mono focus:outline-none resize-none leading-relaxed"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Actions / Signatures Footer */}
            <div className="bg-slate-950 p-5 border-t border-slate-850 space-y-3">
              {/* Quick Actions Actions Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block w-full mb-1">Firmas Digitales Transversales Rápidas:</span>
                
                {userRole === 'HSE' && (
                  <button
                    onClick={() => handleAddSignature('HSE')}
                    disabled={editingOt.validacionHSE === 'Aprobado'}
                    className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 font-bold text-[10px] font-mono px-3 py-1.5 rounded-lg border border-emerald-500/20 disabled:opacity-50"
                  >
                    Firmar como HSE Specialist
                  </button>
                )}

                {userRole === 'CALIDAD' && (
                  <button
                    onClick={() => handleAddSignature('CALIDAD')}
                    disabled={editingOt.validacionCalidad === 'Aprobado'}
                    className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 font-bold text-[10px] font-mono px-3 py-1.5 rounded-lg border border-emerald-500/20 disabled:opacity-50"
                  >
                    Firmar como Quality Specialist
                  </button>
                )}

                {userRole === 'JEFE_OM' && (
                  <button
                    onClick={() => handleAddSignature('JEFE_OM')}
                    className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 font-bold text-[10px] font-mono px-3 py-1.5 rounded-lg border border-emerald-500/20"
                  >
                    Firma Aprobador Jefe O&M
                  </button>
                )}

                {userRole === 'COORDINADOR_OM' && (
                  <button
                    onClick={() => handleAddSignature('COORDINADOR_OM')}
                    className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 font-bold text-[10px] font-mono px-3 py-1.5 rounded-lg border border-emerald-500/20"
                  >
                    Validación Coordinador O&M
                  </button>
                )}

                {editingOt.estado === 'Cerrada' && ['JEFE_OM', 'SUPER_ADMIN_ORBI'].includes(userRole) && (
                  <button
                    onClick={() => handleStateChange('Reabierta')}
                    className="bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-400 font-bold text-[10px] font-mono px-3 py-1.5 rounded-lg border border-fuchsia-500/20 animate-pulse"
                  >
                    🔓 Reabrir Orden de Trabajo (Cerrada)
                  </button>
                )}
              </div>

              {/* State transition control block */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                <span className="text-[10px] font-mono text-slate-400 font-bold">Cambiar Estado:</span>
                <select
                  value={editingOt.estado}
                  onChange={(e) => handleStateChange(e.target.value as OTEstado)}
                  className="bg-slate-900 border border-slate-800 text-xs text-white rounded p-1.5 font-mono outline-none cursor-pointer focus:border-emerald-500"
                >
                  {ESTADOS_PERMITIDOS.map(st => {
                    if (st === 'Reabierta' && editingOt.estado !== 'Cerrada' && editingOt.estado !== 'Reabierta') {
                      return null;
                    }
                    return <option key={st} value={st}>{st}</option>;
                  })}
                </select>
              </div>

              {/* General Save & Close Row */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingOt(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-950 text-xs font-mono text-slate-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-1 transition-all"
                >
                  <Check className="h-4 w-4" /> Guardar Ficha Completa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER OT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOts.map((ot) => {
          let typeColor = 'text-sky-400 bg-sky-500/5 border-sky-500/10';
          if (ot.tipo === 'Correctiva') typeColor = 'text-rose-400 bg-rose-500/5 border-rose-500/10';
          else if (ot.tipo === 'HSE') typeColor = 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10';
          else if (ot.tipo === 'Calidad') typeColor = 'text-purple-400 bg-purple-500/5 border-purple-500/10';
          else if (ot.tipo === 'Comisionamiento') typeColor = 'text-amber-400 bg-amber-500/5 border-amber-500/10';

          let stateColor = 'bg-slate-850 text-slate-400 border border-slate-800';
          if (ot.estado === 'En terreno' || ot.estado === 'En ejecución') stateColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          else if (ot.estado === 'Cerrada') stateColor = 'bg-slate-950 text-slate-600 border border-slate-900 line-through';
          else if (ot.estado === 'Finalizada') stateColor = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
          else if (ot.estado === 'Bloqueada') stateColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse';
          else if (ot.estado === 'Borrador') stateColor = 'bg-slate-900 text-slate-500 border border-slate-850 border-dashed';
          else if (ot.estado === 'Lista para revisión') stateColor = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
          else if (ot.estado === 'En revisión Supervisor') stateColor = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
          else if (ot.estado === 'En revisión Coordinador') stateColor = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
          else if (ot.estado === 'En revisión HSE') stateColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          else if (ot.estado === 'En revisión Calidad') stateColor = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
          else if (ot.estado === 'Pendiente aprobación Jefe O&M') stateColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
          else if (ot.estado === 'Devuelta a ejecución') stateColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse';
          else if (ot.estado === 'Reabierta') stateColor = 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20';

          return (
            <div
              key={ot.codigo}
              onClick={() => handleEditClick(ot)}
              className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-sm"
            >
              <div>
                {/* Card Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                      {ot.codigo}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${typeColor}`}>
                      {ot.tipo}
                    </span>
                  </div>

                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${stateColor}`}>
                    {ot.estado}
                  </span>
                </div>

                {/* Planta solar and Asset */}
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-semibold text-slate-400">{ot.plantaNombre}</h4>
                    {(() => {
                      const badge = getPlantBadgeInfo(ot.legacyPlantId || ot.plantaId || ot.plantaNombre, ot.plantaId);
                      if (badge.label === 'PLANTA MASTER CONFIRMADA') return null;
                      return (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${badge.styleToken}`} title={badge.tooltip}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors mt-0.5">{ot.activo}</h3>
                </div>

                {/* short observations */}
                <p className="text-xs text-slate-400 line-clamp-2 italic mb-4">
                  "{ot.observaciones}"
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-950 flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Resp: <strong className="text-slate-300 font-semibold">{ot.responsable}</strong>
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {ot.hhReales} de {ot.hhEstimadas} HH
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {/* Disponibility Risk indicators */}
                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                    <span>Riesgo Disp:</span>
                    <span className={`font-bold uppercase ${['Riesgo crítico', 'Riesgo alto'].includes(ot.riesgoDisponibilidad) ? 'text-rose-400 animate-pulse' : ['Riesgo medio', 'En observación'].includes(ot.riesgoDisponibilidad) ? 'text-amber-400' : 'text-slate-500'}`}>
                      {ot.riesgoDisponibilidad}
                    </span>
                  </div>

                  {/* Progress slide indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-950 border border-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${ot.avance}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-emerald-400">{ot.avance}%</span>
                  </div>
                </div>

                {/* Evidences indicator */}
                {ot.evidencia && (
                  <div className="bg-slate-950/60 text-[9px] font-mono px-2 py-1 rounded text-emerald-400 border border-emerald-500/10 flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3 w-3" /> Evidencia: {ot.evidencia.nombreArchivo}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredOts.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
            No se encontraron órdenes de trabajo registradas con estos filtros.
          </div>
        )}
      </div>
    </>
  )}
</div>
  );
}
