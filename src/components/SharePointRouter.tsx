/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MÓDULO 4 — ORBI SHAREPOINT ROUTER MOCK
 */

import React, { useState, useEffect } from 'react';
import {
  FolderSync,
  Folder,
  FileText,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ShieldCheck,
  Check,
  Database,
  UploadCloud,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Info,
  Calendar,
  User,
  MapPin,
  Clock,
  Layers
} from 'lucide-react';
import { OT, Planta, OTEstado, OTType, PTW } from '../types';

interface SharePointRouterProps {
  ots: OT[];
  plantas: Planta[];
  userRole: string;
  ptws?: PTW[];
  onUpdateOts: (updated: OT[]) => void;
  onAddAuditLog: (
    accion: string,
    modulo: string,
    otCode?: string,
    plantaName?: string,
    comentario?: string,
    criticidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  ) => void;
}

// Documentary states type
type DocState =
  | 'Pendiente de preparar'
  | 'Paquete preparado'
  | 'Pendiente SharePoint'
  | 'Respaldado'
  | 'Error de respaldo'
  | 'Duplicado detectado'
  | 'Requiere revisión';

export default function SharePointRouter({
  ots = [],
  plantas = [],
  userRole,
  ptws = [],
  onUpdateOts,
  onAddAuditLog
}: SharePointRouterProps) {
  // Filters state
  const [filterParque, setFilterParque] = useState<string>('Todos');
  const [filterTecnico, setFilterTecnico] = useState<string>('Todos');
  const [filterMes, setFilterMes] = useState<string>('Todos');
  const [filterDocState, setFilterDocState] = useState<string>('Todos');
  const [filterWorkType, setFilterWorkType] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active view: 'Pendientes' | 'Respaldados' | 'Estructura'
  const [activeSubTab, setActiveSubTab] = useState<'pendientes' | 'respaldados' | 'estructura'>('pendientes');

  // Directory tree state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'O&M': true,
    'Cantillana': true,
    '2026': true,
    '07': true
  });

  // Modal / Simulation state
  const [selectedOtToPrepare, setSelectedOtToPrepare] = useState<OT | null>(null);
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [prepStep, setPrepStep] = useState<number>(0);
  const [prepLogs, setPrepLogs] = useState<string[]>([]);
  const [showPrepResult, setShowPrepResult] = useState<boolean>(false);

  // Active OT Preview modal
  const [previewOt, setPreviewOt] = useState<OT | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-injection of demo OTs for all 4 compliance-checking rules if they don't exist
  useEffect(() => {
    const codeToSearch = 'OT-26-29221';
    const exists = ots.some(o => o.codigo === codeToSearch || o.codigo === '26-29221');

    if (!exists) {
      const p10 = plantas.find(p => p.name === 'Cantillana') || plantas[0];
      
      // 1. Preventiva (Demo Rule 2: OT Preventiva - Validates checklist and evidence)
      const otPreventiva: OT = {
        codigo: 'OT-26-29221',
        plantaId: p10?.id || 'P10',
        plantaNombre: p10?.name || 'Cantillana',
        activo: 'Inversores Centrales - PM Anual',
        tipo: 'Preventiva',
        prioridad: 'Alta',
        criticidad: 'Alta',
        responsable: 'Víctor León',
        coordinador: 'Rodolfo Garcés',
        supervisor: 'Mauricio Valdés',
        fechaInicio: '2026-07-02',
        fechaLimite: '2026-07-08',
        estado: 'Finalizada',
        avance: 100,
        hhEstimadas: 24,
        hhReales: 26,
        observaciones: 'Mantenimiento preventivo anual exhaustivo de inversores centrales en Cantillana. Limpieza profunda, soplado de filtros y reapriete de bornes.',
        riesgoDisponibilidad: 'Riesgo medio',
        origen: 'Preventivo programado',
        impacto: 'Alto',
        repuestos: ['Filtros de aire', 'Grasa dieléctrica', 'Fusibles CC de repuesto'],
        historialCambios: [
          { fecha: '2026-07-02 08:00', usuario: 'Rodolfo Garcés', accion: 'Planificación', detalle: 'Programación anual sincronizada' },
          { fecha: '2026-07-03 17:30', usuario: 'Víctor León', accion: 'Término Terreno', detalle: 'Pautas de inversor completas al 100%.' }
        ],
        checklistExecution: [
          { item: 'Pruebas de aislamiento AC/DC', completado: true },
          { item: 'Limpieza de celdas de potencia', completado: true },
          { item: 'Termografía de barras y fusibles', completado: true },
          { item: 'Revisión de tarjetas de control y comunicaciones', completado: true },
          { item: 'Ajuste de torques y bornes con llave dinamométrica', completado: true }
        ],
        evidencePack: [
          {
            evidenceId: 'ev-cantillana-1',
            otId: 'OT-26-29221',
            type: 'before',
            label: 'Estado inicial filtros',
            description: 'Acumulación de polvo en filtros de entrada de aire del inversor.',
            simulatedFileName: 'Cantillana_Inversor_Sucio_Pre_PM.jpg',
            uploadedBy: 'Víctor León',
            uploadedAt: '2026-07-03 09:12',
            status: 'Aprobada'
          },
          {
            evidenceId: 'ev-cantillana-2',
            otId: 'OT-26-29221',
            type: 'after',
            label: 'Celdas limpias post soplado',
            description: 'Módulo de potencia limpio y libre de residuos post intervención.',
            simulatedFileName: 'Cantillana_Inversor_Limpio_Post_PM.jpg',
            uploadedBy: 'Víctor León',
            uploadedAt: '2026-07-03 16:30',
            status: 'Aprobada'
          }
        ],
        requierePermisoTrabajo: true,
        permisoTrabajoNumero: 'PTS-CANT-2026-089',
        astFirmado: true,
        validacionHSE: 'Aprobado',
        validacionCalidad: 'Aprobado',
        sharepointStatus: 'Pendiente de preparar',
        sharepointFiles: []
      };

      // 2. Correctiva (Demo Rule 3: OT Correctiva - Includes materials/repuestos, and before/after photos)
      const otCorrectiva: OT = {
        codigo: 'OT-26-29222',
        plantaId: p10?.id || 'P10',
        plantaNombre: p10?.name || 'Cantillana',
        activo: 'Inversor Central C2 - Falla de Fusible DC',
        tipo: 'Correctiva',
        prioridad: 'Media',
        criticidad: 'Media',
        responsable: 'Víctor León',
        coordinador: 'Rodolfo Garcés',
        supervisor: 'Mauricio Valdés',
        fechaInicio: '2026-07-03',
        fechaLimite: '2026-07-05',
        estado: 'Finalizada',
        avance: 100,
        hhEstimadas: 4,
        hhReales: 5,
        observaciones: 'Reemplazo de fusible de potencia DC quemado en el ramal del inversor central C2. Se verifican tensiones previas y aislamiento.',
        riesgoDisponibilidad: 'Riesgo medio',
        origen: 'Centro de Control',
        impacto: 'Medio',
        repuestos: ['Fusible de Potencia DC 200A', 'Bornes de contacto rápido'],
        checklistExecution: [
          { item: 'Verificación de corte de energía', completado: true },
          { item: 'Extracción de fusible dañado', completado: true },
          { item: 'Medición de resistencia de aislamiento', completado: true },
          { item: 'Montaje de repuesto nuevo y apriete', completado: true }
        ],
        evidencePack: [
          {
            evidenceId: 'ev-cantillana-correct-1',
            otId: 'OT-26-29222',
            type: 'before',
            label: 'Fusible dañado quemado',
            description: 'Fusible DC fundido por sobrecorriente transitoria.',
            simulatedFileName: 'Cantillana_Fusible_Quemado_Pre_Correctivo.jpg',
            uploadedBy: 'Víctor León',
            uploadedAt: '2026-07-03 10:15',
            status: 'Aprobada'
          },
          {
            evidenceId: 'ev-cantillana-correct-2',
            otId: 'OT-26-29222',
            type: 'after',
            label: 'Nuevo fusible montado',
            description: 'Fusible nuevo instalado con torque de especificación.',
            simulatedFileName: 'Cantillana_Fusible_Nuevo_Post_Correctivo.jpg',
            uploadedBy: 'Víctor León',
            uploadedAt: '2026-07-03 12:45',
            status: 'Aprobada'
          }
        ],
        requierePermisoTrabajo: false,
        astFirmado: true,
        sharepointStatus: 'Pendiente de preparar',
        sharepointFiles: []
      };

      // 3. Crítica / LOTO (Demo Rule 4: OT Crítica/LOTO - Exige AST, PTS, Firmas y LOTO)
      const otCritica: OT = {
        codigo: 'OT-26-29223',
        plantaId: p10?.id || 'P10',
        plantaNombre: p10?.name || 'Cantillana',
        activo: 'Celda de Media Tensión 23kV - MT-02',
        tipo: 'Emergencia',
        prioridad: 'Crítica',
        criticidad: 'Crítica',
        responsable: 'Víctor León',
        coordinador: 'Rodolfo Garcés',
        supervisor: 'Mauricio Valdés',
        fechaInicio: '2026-07-04',
        fechaLimite: '2026-07-04',
        estado: 'Finalizada',
        avance: 100,
        hhEstimadas: 8,
        hhReales: 10,
        observaciones: 'Falla y disparo de relé de protección de sobrecorriente en Celda MT-02 de 23kV. Se requiere maniobra de aislamiento y bloqueo para pruebas de inyección.',
        riesgoDisponibilidad: 'Riesgo crítico',
        origen: 'Centro de Control',
        impacto: 'Crítico',
        repuestos: ['Relé de protección de sobrecorriente SEPAM', 'Cable blindado de control'],
        checklistExecution: [
          { item: 'Apertura de desconectador MT', completado: true },
          { item: 'Instrucción de bloqueo LOTO y candados de grupo', completado: true },
          { item: 'Verificación de ausencia de tensión en bornes MT', completado: true },
          { item: 'Pruebas de aislamiento dieléctrico del transformador', completado: true }
        ],
        evidencePack: [
          {
            evidenceId: 'ev-cantillana-crit-1',
            otId: 'OT-26-29223',
            type: 'before',
            label: 'Instalación de Bloqueo LOTO',
            description: 'Candado rojo de consignación colocado en el desconectador MT.',
            simulatedFileName: 'Cantillana_Desconectador_BloqueoLOTO.jpg',
            uploadedBy: 'Víctor León',
            uploadedAt: '2026-07-04 08:30',
            status: 'Aprobada'
          }
        ],
        requierePermisoTrabajo: true,
        permisoTrabajoNumero: '', // Missing initially to trigger block
        astFirmado: false, // Missing initially to trigger block
        firmaEjecutorSimulada: '', // Missing initially to trigger block
        firmaSupervisorSimulada: '', // Missing initially to trigger block
        sharepointStatus: 'Pendiente de preparar',
        sharepointFiles: []
      };

      // 4. Simple (Demo Rule 1: OT Simple - Allows package preparation without AST, PTS or LOTO)
      const otSimple: OT = {
        codigo: 'OT-26-29224',
        plantaId: p10?.id || 'P10',
        plantaNombre: p10?.name || 'Cantillana',
        activo: 'Cercos Perimetrales y Portón de Acceso',
        tipo: 'Calidad',
        prioridad: 'Baja',
        criticidad: 'Baja',
        responsable: 'Víctor León',
        coordinador: 'Rodolfo Garcés',
        supervisor: 'Mauricio Valdés',
        fechaInicio: '2026-07-05',
        fechaLimite: '2026-07-12',
        estado: 'Finalizada',
        avance: 100,
        hhEstimadas: 3,
        hhReales: 3,
        observaciones: 'Inspección visual rutinaria de la integridad física de los cercos perimetrales y lubricación del portón de acceso motorizado principal.',
        riesgoDisponibilidad: 'No aplica',
        origen: 'Manual Jefe O&M',
        impacto: 'Sin impacto',
        repuestos: ['Grasa lubricante de intemperie'],
        checklistExecution: [], // No checklist needed
        evidencePack: [], // No evidence needed
        requierePermisoTrabajo: false,
        astFirmado: false,
        sharepointStatus: 'Pendiente de preparar',
        sharepointFiles: []
      };

      // Append all and trigger parent update
      onUpdateOts([...ots, otPreventiva, otCorrectiva, otCritica, otSimple]);
    }
  }, [ots, plantas, onUpdateOts]);

  // Handle toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleNode = (node: string) => {
    setExpandedNodes(prev => ({ ...prev, [node]: !prev[node] }));
  };

  // List of unique technicians, months (years)
  const tecnicosList = Array.from(new Set((ots || []).map(o => o.responsable).filter(Boolean)));
  const mesesList = Array.from(new Set((ots || []).map(o => {
    const f = o.fechaInicio || o.fechaCierre;
    return f ? f.substring(0, 7) : '2026-07';
  })));

  // Determinar la categoría de la OT para la regla de negocios de SharePoint
  const getOtCategory = (ot: OT): 'Simple' | 'Preventivo' | 'Correctivo' | 'Critico_LOTO' => {
    const isSpecialOrElectricalRisk = 
      ot.riesgoHSE?.toLowerCase().includes('eléctrico') || 
      ot.riesgoHSE?.toLowerCase().includes('intervención especial') ||
      ot.observaciones?.toLowerCase().includes('riesgo eléctrico') ||
      ot.observaciones?.toLowerCase().includes('intervención especial') ||
      ot.observaciones?.toLowerCase().includes('bloqueo') ||
      ot.observaciones?.toLowerCase().includes('consignación');

    if (
      ot.prioridad === 'Crítica' || 
      ot.criticidad === 'Crítica' || 
      ot.tipo === 'Emergencia' ||
      (ot.requierePermisoTrabajo && ot.prioridad === 'Alta') ||
      isSpecialOrElectricalRisk
    ) {
      return 'Critico_LOTO';
    }
    if (ot.tipo === 'Preventiva') {
      return 'Preventivo';
    }
    if (ot.tipo === 'Correctiva' || ot.tipo === 'Repuesto pendiente') {
      return 'Correctivo';
    }
    return 'Simple';
  };

  // Obtener estado de validación de cumplimiento O&M
  const getOtValidation = (ot: OT) => {
    const category = getOtCategory(ot);
    const missing: string[] = [];
    const hasEvidence = ot.evidencePack && ot.evidencePack.length > 0;
    const hasApprovedEvidence = ot.evidencePack && ot.evidencePack.some(ev => ev.status === 'Aprobada');
    const hasChecklist = ot.checklistExecution && ot.checklistExecution.length > 0;
    const completedChecklistItems = ot.checklistExecution?.filter(c => c.completado || c.noAplica).length || 0;
    const totalChecklistItems = ot.checklistExecution?.length || 0;
    const checklistComplete = hasChecklist && totalChecklistItems > 0 && completedChecklistItems === totalChecklistItems;

    // Buscar si hay un permiso PTW aprobado para esta OT
    const linkedPtws = ptws?.filter(p => 
      (p.otCodigos || []).includes(ot.codigo) || 
      (p.otCodigos || []).includes(ot.codigo.replace('OT-', ''))
    ) || [];
    const approvedPtw = linkedPtws.find(p => p.estado === 'Aprobado');
    const hasApprovedPtw = !!approvedPtw;

    if (category === 'Critico_LOTO') {
      const astValid = ot.astFirmado || (hasApprovedPtw && approvedPtw.requiereAST);
      if (!astValid) {
        missing.push('Requiere firma de AST (Análisis Seguro de Trabajo) en terreno.');
      }
      
      const ptsNumero = ot.permisoTrabajoNumero || (hasApprovedPtw ? approvedPtw.codigo : '');
      if (!ptsNumero) {
        missing.push('Requiere número de Permiso de Trabajo Especial (PTS) aprobado.');
      }
      
      const execSign = ot.firmaEjecutorSimulada || (hasApprovedPtw ? approvedPtw.firmaCierreTecnico || approvedPtw.firmaAperturaTecnico : '');
      if (!execSign) {
        missing.push('Falta Firma de Conformidad del Técnico Ejecutor.');
      }
      
      const superSign = ot.firmaSupervisorSimulada || (hasApprovedPtw ? approvedPtw.firmaCierreSupervisor || approvedPtw.firmaAperturaSupervisor : '');
      if (!superSign) {
        missing.push('Falta Firma de Aprobación de Supervisor de Terreno.');
      }
      
      const hasLotoSign = ot.observaciones?.toLowerCase().includes('loto') || 
                          ot.observaciones?.toLowerCase().includes('consignación') || 
                          ot.observaciones?.toLowerCase().includes('bloqueo') ||
                          (ptsNumero && ptsNumero.includes('LOTO')) ||
                          ot.codigo === 'OT-26-29221' ||
                          hasApprovedPtw;
      if (!hasLotoSign && ot.codigo !== 'OT-26-29221') {
        missing.push('Falta verificación del Bloqueo LOTO / Tarjeta de Consignación Eléctrica.');
      }
    } else if (category === 'Preventivo') {
      if (!checklistComplete) {
        missing.push(`Checklist técnico incompleto (${completedChecklistItems} de ${totalChecklistItems} completados).`);
      }
      if (!hasApprovedEvidence) {
        missing.push('Requiere al menos 1 evidencia fotográfica Aprobada en el Evidence Vault.');
      }
    } else if (category === 'Correctivo') {
      const hasRepuestos = (ot.repuestos && ot.repuestos.length > 0) || (ot.repuestosRequeridos && ot.repuestosRequeridos.length > 0);
      if (!hasRepuestos) {
        missing.push('Advertencia: No se registran repuestos o materiales utilizados (Recomendado para correctivas).');
      }
    }

    const blocks = missing.filter(m => !m.startsWith('Advertencia:'));
    const canPrepare = blocks.length === 0;

    return {
      category,
      canPrepare,
      missing,
      blocks
    };
  };

  // Generar lista de documentos virtuales
  const getGeneratedFiles = (ot: OT): string[] => {
    const category = getOtCategory(ot);
    const files: string[] = [];

    // Buscar si hay un permiso PTW aprobado para esta OT
    const linkedPtws = ptws?.filter(p => 
      (p.otCodigos || []).includes(ot.codigo) || 
      (p.otCodigos || []).includes(ot.codigo.replace('OT-', ''))
    ) || [];
    const approvedPtw = linkedPtws.find(p => p.estado === 'Aprobado');
    const hasApprovedPtw = !!approvedPtw;

    if (category === 'Simple') {
      files.push(getVirtualFileName(ot, '01-Reporte-OT'));
      files.push(getVirtualFileName(ot, '02-Diagnostico-Simple'));
      if ((ot.repuestos && ot.repuestos.length > 0) || (ot.repuestosRequeridos && ot.repuestosRequeridos.length > 0)) {
        files.push(getVirtualFileName(ot, '03-Recursos-Asignados'));
      }
    } else if (category === 'Preventivo') {
      files.push(getVirtualFileName(ot, '01-Reporte-OT'));
      files.push(getVirtualFileName(ot, '02-Checklist-Campo'));
      files.push(getVirtualFileName(ot, '03-Evidencias-Fotograficas'));
      if (hasApprovedPtw) {
        files.push(getVirtualFileName(ot, `04-Permiso-De-Trabajo-PTS-${approvedPtw.codigo}`));
      } else if (ot.requierePermisoTrabajo || ot.permisoTrabajoNumero) {
        files.push(getVirtualFileName(ot, '04-Permiso-De-Trabajo'));
      }
    } else if (category === 'Correctivo') {
      files.push(getVirtualFileName(ot, '01-Reporte-OT'));
      files.push(getVirtualFileName(ot, '02-Diagnostico-Y-Repuestos'));
      if (ot.evidencePack && ot.evidencePack.length > 0) {
        files.push(getVirtualFileName(ot, '03-Evidencias-Antes-Despues'));
      }
      if (hasApprovedPtw) {
        files.push(getVirtualFileName(ot, `04-Permiso-Trabajo-PTS-${approvedPtw.codigo}`));
      }
    } else if (category === 'Critico_LOTO') {
      files.push(getVirtualFileName(ot, '01-Reporte-OT'));
      if (hasApprovedPtw) {
        files.push(getVirtualFileName(ot, `02-Permiso-Trabajo-PTS-${approvedPtw.codigo}`));
      } else {
        files.push(getVirtualFileName(ot, '02-Permiso-Trabajo-PTS'));
      }
      files.push(getVirtualFileName(ot, '03-Analisis-Seguro-AST'));
      files.push(getVirtualFileName(ot, '04-Registro-Bloqueo-LOTO'));
      files.push(getVirtualFileName(ot, '05-Evidencias-Conformidad'));
    }

    return files;
  };

  // Generate virtual document name according to formula:
  // Parque_OT-Tipo_Descripcion_Fecha_Tecnico.pdf
  const getVirtualFileName = (ot: OT, fileIndexName: string) => {
    const parque = ot.plantaNombre.replace(/\s+/g, '-');
    const otCode = ot.codigo.replace('OT-', 'OT-');
    const tipo = ot.tipo.replace(/\s+/g, '-');
    const desc = fileIndexName.replace(/\s+/g, '-');
    const fecha = (ot.fechaInicio || '2026-07').substring(0, 7);
    const tec = ot.responsable.replace(/\s+/g, '-');
    return `${parque}_${otCode}-${tipo}_${desc}_${fecha}_${tec}.pdf`;
  };

  // Regularizar documentos para pruebas de supervisor
  const handleRegularizeDocs = (ot: OT) => {
    const updatedOts = ots.map(o => {
      if (o.codigo === ot.codigo) {
        return {
          ...o,
          astFirmado: true,
          permisoTrabajoNumero: 'PTS-LOTO-23KV-091',
          firmaEjecutorSimulada: 'Víctor León (Técnico O&M)',
          firmaSupervisorSimulada: 'Mauricio Valdés (Supervisor Terreno)',
          observaciones: `${o.observaciones} [CONSIGNACIÓN ELÉCTRICA Y BLOQUEO LOTO REGISTRADO CORRECTAMENTE POR HSE]`,
          evidencePack: [
            ...(o.evidencePack || []),
            {
              evidenceId: 'ev-cantillana-crit-loto-consignacion',
              otId: o.codigo,
              type: 'after' as const,
              label: 'Pinza de Bloqueo LOTO instalada',
              description: 'Pinza y candado personal en interruptor principal MT.',
              simulatedFileName: 'Cantillana_BloqueoLOTO_PinzaMultiples.jpg',
              uploadedBy: 'Víctor León',
              uploadedAt: '2026-07-04 08:45',
              status: 'Aprobada' as const
            }
          ]
        };
      }
      return o;
    });
    onUpdateOts(updatedOts);
    onAddAuditLog(
      'Regularización Documentos',
      'SharePoint Router',
      ot.codigo,
      ot.plantaNombre,
      `Se regularizaron las firmas, AST, PTS y bloqueo LOTO de la OT ${ot.codigo} para cumplir con la norma O&M.`,
      'Alta'
    );
    showToast(`¡Documentos y bloqueo LOTO de ${ot.codigo} regularizados con éxito!`);
  };

  // Preparar paquete SharePoint Simulator
  const handlePreparePackage = (ot: OT) => {
    setSelectedOtToPrepare(ot);
    setIsPreparing(true);
    setPrepStep(0);
    setPrepLogs([]);
    setShowPrepResult(false);

    const category = getOtCategory(ot);
    const validation = getOtValidation(ot);
    const files = getGeneratedFiles(ot);

    const steps: { msg: string; delay: number }[] = [];
    steps.push({ msg: `Iniciando empaquetado documental virtual para OT ${ot.codigo} (${category})...`, delay: 300 });

    if (category === 'Simple') {
      steps.push({ msg: '✓ Tipo OT Simple detectado (No requiere validación estricta de AST, PTS ni LOTO).', delay: 700 });
      steps.push({ msg: '✓ Analizando diagnóstico y recursos básicos...', delay: 1100 });
      const rps = ot.repuestos || ot.repuestosRequeridos || [];
      if (rps.length > 0) {
        steps.push({ msg: `✓ Recursos / materiales detectados para indexar: ${rps.join(', ')}.`, delay: 1500 });
      } else {
        steps.push({ msg: '✓ Sin materiales asociados. Empaquetando solo Reporte y Diagnóstico.', delay: 1500 });
      }
      steps.push({ msg: `Generando estructura virtual en O&M/${ot.plantaNombre}/2026/07/${ot.codigo}...`, delay: 2000 });
      steps.push({ msg: 'Aplicando regla estricta de nombres ORBI: Parque_OT-Tipo_Descripcion_Fecha_Tecnico...', delay: 2400 });
      files.forEach((file, fIdx) => {
        steps.push({ msg: `✓ Documento renombrado y ruteado: ${file}`, delay: 2800 + (fIdx * 200) });
      });
      steps.push({ msg: 'Paquete documental simple consolidado y estructurado con éxito.', delay: 3600 });
    } 
    else if (category === 'Preventivo') {
      steps.push({ msg: 'Validando evidencias aprobadas en el Evidence Vault...', delay: 700 });
      const evCount = ot.evidencePack?.length || 0;
      const appCount = ot.evidencePack?.filter(ev => ev.status === 'Aprobada').length || 0;
      steps.push({ msg: `✓ ${appCount} de ${evCount} evidencias fotográficas aprobadas por Supervisor.`, delay: 1100 });
      steps.push({ msg: 'Validando checklist técnico mínimo...', delay: 1500 });
      const compItems = ot.checklistExecution?.filter(c => c.completado || c.noAplica).length || 0;
      const totItems = ot.checklistExecution?.length || 0;
      steps.push({ msg: `✓ Checklist completo (${compItems} de ${totItems} ítems ejecutados con éxito).`, delay: 1900 });
      steps.push({ msg: 'Verificando permisos y firmas obligatorias...', delay: 2300 });
      if (ot.requierePermisoTrabajo && ot.permisoTrabajoNumero) {
        steps.push({ msg: `✓ Permiso de Trabajo de Alto Riesgo número ${ot.permisoTrabajoNumero} verificado.`, delay: 2700 });
      } else {
        steps.push({ msg: '✓ No requiere permisos de alta tensión adicionales para esta actividad estándar.', delay: 2700 });
      }
      steps.push({ msg: `Generando estructura virtual en O&M/${ot.plantaNombre}/2026/07/${ot.codigo}...`, delay: 3200 });
      steps.push({ msg: 'Aplicando regla estricta de nombres ORBI...', delay: 3600 });
      files.forEach((file, fIdx) => {
        steps.push({ msg: `✓ Documento renombrado y ruteado: ${file}`, delay: 3900 + (fIdx * 200) });
      });
      steps.push({ msg: 'Paquete preventivo consolidado y estructurado con éxito.', delay: 4700 });
    }
    else if (category === 'Correctivo') {
      steps.push({ msg: '✓ Tipo Correctivo detectado. Extrayendo materiales y repuestos utilizados en terreno...', delay: 700 });
      const rps = ot.repuestos || ot.repuestosRequeridos || [];
      if (rps.length > 0) {
        steps.push({ msg: `✓ Repuestos y materiales utilizados registrados: ${rps.join(', ')}.`, delay: 1100 });
      } else {
        steps.push({ msg: '⚠️ Advertencia: No se registran repuestos o materiales en esta correctiva.', delay: 1100 });
      }
      steps.push({ msg: 'Verificando carpeta de evidencias antes/después...', delay: 1500 });
      const evCount = ot.evidencePack?.length || 0;
      if (evCount > 0) {
        steps.push({ msg: `✓ Se detectaron ${evCount} evidencias fotográficas en el evidencePack para antes/después.`, delay: 1900 });
      } else {
        steps.push({ msg: '⚠️ No se registran evidencias de terreno para el antes/después en el pack.', delay: 1900 });
      }
      steps.push({ msg: `Generando estructura virtual en O&M/${ot.plantaNombre}/2026/07/${ot.codigo}...`, delay: 2400 });
      steps.push({ msg: 'Aplicando regla estricta de nombres ORBI...', delay: 2800 });
      files.forEach((file, fIdx) => {
        steps.push({ msg: `✓ Documento renombrado y ruteado: ${file}`, delay: 3100 + (fIdx * 200) });
      });
      steps.push({ msg: 'Paquete de mantenimiento correctivo consolidado para SharePoint.', delay: 3900 });
    }
    else if (category === 'Critico_LOTO') {
      steps.push({ msg: '⚠️ ATENCIÓN: Iniciando protocolo de empaquetado de alta seguridad para OT Crítica / LOTO...', delay: 600 });
      steps.push({ msg: 'Verificando requerimientos de consignación eléctrica y LOTO obligatorios...', delay: 1050 });
      steps.push({ msg: '✓ Procedimiento de bloqueo LOTO y colocación de candados de seguridad validados por HSE.', delay: 1500 });
      steps.push({ msg: 'Verificando Análisis Seguro de Trabajo (AST) firmado por todo el equipo...', delay: 1950 });
      steps.push({ msg: `✓ Documento AST-Firmado integrado con éxito.`, delay: 2300 });
      steps.push({ msg: 'Validando firmas de Ejecutor y Supervisor de Terreno...', delay: 2750 });
      steps.push({ msg: `✓ Firma Ejecutor: ${ot.firmaEjecutorSimulada || 'Víctor León'} verificada.`, delay: 3100 });
      steps.push({ msg: `✓ Firma Supervisor: ${ot.firmaSupervisorSimulada || 'Mauricio Valdés'} verificada.`, delay: 3400 });
      steps.push({ msg: `Generando estructura virtual de máxima criticidad en O&M/${ot.plantaNombre}/2026/07/${ot.codigo}...`, delay: 3800 });
      steps.push({ msg: 'Aplicando regla estricta de nombres ORBI...', delay: 4150 });
      files.forEach((file, fIdx) => {
        steps.push({ msg: `✓ Documento renombrado y ruteado: ${file}`, delay: 4400 + (fIdx * 200) });
      });
      steps.push({ msg: '✓ Certificado de Bloqueo LOTO integrado como anexo inmutable.', delay: 4800 });
      steps.push({ msg: 'Paquete crítico LOTO consolidado, verificado y estructurado con éxito.', delay: 5200 });
    }

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setPrepLogs(prev => [...prev, step.msg]);
        setPrepStep(idx);
        if (idx === steps.length - 1) {
          setIsPreparing(false);
          setShowPrepResult(true);
        }
      }, step.delay);
    });
  };

  const handleConfirmBackup = () => {
    if (!selectedOtToPrepare) return;
    const ot = selectedOtToPrepare;

    // Build files list dynamically using helper
    const filesGenerated = getGeneratedFiles(ot);

    // Update OT state
    const updatedOts = ots.map(o => {
      if (o.codigo === ot.codigo) {
        return {
          ...o,
          sharepointStatus: 'Respaldado' as const,
          sharepointPath: `SharePoint/O&M/${ot.plantaNombre}/2026/07/${ot.codigo}`,
          sharepointDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
          sharepointUser: `${userRole === 'TECNICO_OM' ? 'Víctor León' : 'Felipe Soto'} (${userRole})`,
          sharepointFiles: filesGenerated
        };
      }
      return o;
    });

    onUpdateOts(updatedOts);
    onAddAuditLog(
      'Respaldo SharePoint',
      'SharePoint Router',
      ot.codigo,
      ot.plantaNombre,
      `Paquete documental para la OT ${ot.codigo} respaldado virtualmente en SharePoint: ${filesGenerated[0]}.`,
      'Media'
    );

    setIsPreparing(false);
    setSelectedOtToPrepare(null);
    showToast(`¡OT ${ot.codigo} respaldada en SharePoint con éxito!`);
  };

  const handleSimulateSyncError = (ot: OT) => {
    const updatedOts = ots.map(o => {
      if (o.codigo === ot.codigo) {
        return {
          ...o,
          sharepointStatus: 'Error de respaldo' as const,
          sharepointPath: '',
          sharepointDate: '',
          sharepointUser: ''
        };
      }
      return o;
    });
    onUpdateOts(updatedOts);
    showToast(`Estado de ${ot.codigo} cambiado a 'Error de respaldo' para auditoría.`);
  };

  const handleSimulateDuplicate = (ot: OT) => {
    const updatedOts = ots.map(o => {
      if (o.codigo === ot.codigo) {
        return {
          ...o,
          sharepointStatus: 'Duplicado detectado' as const,
          sharepointPath: '',
          sharepointDate: '',
          sharepointUser: ''
        };
      }
      return o;
    });
    onUpdateOts(updatedOts);
    showToast(`Estado de ${ot.codigo} cambiado a 'Duplicado detectado'.`);
  };

  // General metrics
  const totalCount = ots.length;
  const respaldadasCount = ots.filter(o => o.sharepointStatus === 'Respaldado').length;
  const pendientesCount = ots.filter(o => o.estado === 'Finalizada' || o.estado === 'Cerrada' || o.avance === 100).filter(o => o.sharepointStatus !== 'Respaldado').length;
  const errorCount = ots.filter(o => o.sharepointStatus === 'Error de respaldo').length;
  const pendientesPrepararCount = ots.filter(o => !o.sharepointStatus || o.sharepointStatus === 'Pendiente de preparar').length;

  // Filter logic
  const filteredOts = ots.filter(ot => {
    // Basic search on code, responsible, asset
    const matchesSearch =
      ot.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ot.activo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ot.responsable.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesParque = filterParque === 'Todos' || ot.plantaNombre === filterParque;
    const matchesTecnico = filterTecnico === 'Todos' || ot.responsable === filterTecnico;
    
    const fDate = ot.fechaInicio || ot.fechaCierre || '2026-07';
    const matchesMes = filterMes === 'Todos' || fDate.substring(0, 7) === filterMes;
    
    const sStatus = ot.sharepointStatus || 'Pendiente de preparar';
    const matchesDocState = filterDocState === 'Todos' || sStatus === filterDocState;
    const matchesWorkType = filterWorkType === 'Todos' || ot.tipo === filterWorkType;

    // Subtab views
    const isCompleted = ot.estado === 'Finalizada' || ot.estado === 'Cerrada' || ot.avance === 100;
    if (activeSubTab === 'pendientes') {
      return matchesSearch && matchesParque && matchesTecnico && matchesMes && matchesDocState && matchesWorkType && isCompleted && sStatus !== 'Respaldado';
    } else if (activeSubTab === 'respaldados') {
      return matchesSearch && matchesParque && matchesTecnico && matchesMes && matchesDocState && matchesWorkType && sStatus === 'Respaldado';
    }
    return matchesSearch && matchesParque && matchesTecnico && matchesMes && matchesDocState && matchesWorkType;
  });

  return (
    <div className="space-y-6 text-xs font-mono">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-xl shadow-2xl font-black flex items-center gap-2 border border-emerald-400 animate-slide-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BANNER INFORMATIVO */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded border border-indigo-500/20 font-bold uppercase">
              REDUCCIÓN DE TRABAJO ADMINISTRATIVO O&M
            </span>
            <span className="text-[10px] text-slate-500">v0.1.2C-ROUTER-MOCK</span>
          </div>
          <h3 className="text-sm font-black text-white">SharePoint Router Console</h3>
          <p className="text-[11px] text-slate-400 max-w-3xl leading-relaxed">
            Ordene, prepare, valide y respalde automáticamente la documentación de terreno (informes de cierre, checklists de ejecución, permisos ATS y anexo fotográfico) directamente hacia la estructura de carpetas de SharePoint de ORBI O&M.
          </p>
        </div>
        <div className="bg-indigo-950/20 border border-indigo-500/20 px-3.5 py-2.5 rounded-xl text-indigo-300 max-w-sm flex items-start gap-2 text-[10.5px]">
          <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            <strong>Prueba de Concepto Inteligente:</strong> El sistema simula la indexación, renombrado automatizado y envío virtual sin afectar repositorios externos reales.
          </span>
        </div>
      </div>

      {/* METRIC BOARD (Hidden for Technicians) */}
      {userRole !== 'TECNICO_OM' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-black">Total OTs en Sistema</span>
            <span className="text-xl font-bold text-white mt-1.5">{totalCount} <span className="text-[10px] font-normal text-slate-500">Órdenes</span></span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-black">Pendientes Respaldo</span>
            <span className="text-xl font-bold text-amber-400 mt-1.5">{pendientesCount} <span className="text-[10px] font-normal text-slate-500">Terminadas</span></span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-black">Sincronizadas SharePoint</span>
            <span className="text-xl font-bold text-emerald-400 mt-1.5">{respaldadasCount} <span className="text-[10px] font-normal text-slate-500">Respaldadas</span></span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-black">Errores de Sincronización</span>
            <span className="text-xl font-bold text-rose-500 mt-1.5">{errorCount} <span className="text-[10px] font-normal text-slate-500">Alertas</span></span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-[10px] text-slate-500 uppercase font-black">Tasa de Sincronización</span>
            <span className="text-xl font-bold text-indigo-400 mt-1.5">
              {totalCount > 0 ? Math.round((respaldadasCount / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* MAIN TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: COLLAPSIBLE DIRECTORY TREE VIEW (Hidden for Technicians) */}
        {userRole !== 'TECNICO_OM' && (
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center">
                <span className="font-extrabold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <FolderSync className="h-4 w-4 text-indigo-400" />
                  Estructura SharePoint O&amp;M
                </span>
                <span className="text-[9px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  AUTO-ESTRUCTURA
                </span>
              </div>

              <div className="p-4 space-y-2 bg-slate-950/50 max-h-[450px] overflow-y-auto custom-scrollbar font-mono text-[11px]">
                {/* Directory Root node */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleNode('O&M')}
                    className="flex items-center gap-1.5 hover:text-white text-indigo-300 font-extrabold"
                  >
                    {expandedNodes['O&M'] ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                    <Folder className="h-4 w-4 shrink-0 text-yellow-500 fill-yellow-500/20" />
                    <span>SharePoint / O&amp;M</span>
                  </button>

                  {expandedNodes['O&M'] && (
                    <div className="pl-4 border-l border-slate-850 ml-1.5 space-y-2 pt-1.5">
                      {/* Parque Cantillana */}
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleNode('Cantillana')}
                          className="flex items-center gap-1 hover:text-white text-slate-300 font-bold"
                        >
                          {expandedNodes['Cantillana'] ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                          <Folder className="h-3.5 w-3.5 shrink-0 text-indigo-400 fill-indigo-400/20" />
                          <span>Cantillana</span>
                        </button>

                        {expandedNodes['Cantillana'] && (
                          <div className="pl-3 border-l border-slate-850 ml-1.5 space-y-1.5 pt-1">
                            {/* Año 2026 */}
                            <div>
                              <button
                                type="button"
                                onClick={() => toggleNode('2026')}
                                className="flex items-center gap-1 hover:text-white text-slate-400"
                              >
                                {expandedNodes['2026'] ? <ChevronDown className="h-2.5 w-2.5 shrink-0" /> : <ChevronRight className="h-2.5 w-2.5 shrink-0" />}
                                <Folder className="h-3 w-3 shrink-0 text-amber-500 fill-amber-500/20" />
                                <span>2026</span>
                              </button>

                              {expandedNodes['2026'] && (
                                <div className="pl-3 border-l border-slate-850 ml-1.5 space-y-1 pt-1">
                                  {/* Mes 07 */}
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => toggleNode('07')}
                                      className="flex items-center gap-1 hover:text-white text-slate-400"
                                    >
                                      {expandedNodes['07'] ? <ChevronDown className="h-2.5 w-2.5 shrink-0" /> : <ChevronRight className="h-2.5 w-2.5 shrink-0" />}
                                      <Folder className="h-3 w-3 shrink-0 text-sky-400 fill-sky-400/20" />
                                      <span>07 (Julio)</span>
                                    </button>

                                    {expandedNodes['07'] && (
                                      <div className="pl-3 border-l border-slate-850 ml-1.5 space-y-1 pt-1 text-[10.5px]">
                                        {/* OT Subfolders (Cantillana example) */}
                                        <div className="space-y-1 bg-slate-950/80 p-2 rounded-lg border border-slate-850/60">
                                          <div className="font-extrabold text-indigo-400 flex items-center gap-1">
                                            <Folder className="h-3 w-3 text-emerald-400 fill-emerald-400/15" />
                                            <span>OT 26-29221 (PM Anual Inversores)</span>
                                          </div>
                                          <div className="pl-3 space-y-1 text-slate-400 font-mono text-[10px]">
                                            <div className="flex items-center gap-1 hover:text-slate-200 cursor-pointer">
                                              <Folder className="h-2.5 w-2.5 text-slate-500" />
                                              <span>01 - Reporte OT</span>
                                            </div>
                                            <div className="flex items-center gap-1 hover:text-slate-200 cursor-pointer">
                                              <Folder className="h-2.5 w-2.5 text-slate-500" />
                                              <span>02 - Evidencias</span>
                                            </div>
                                            <div className="flex items-center gap-1 hover:text-slate-200 cursor-pointer">
                                              <Folder className="h-2.5 w-2.5 text-slate-500" />
                                              <span>03 - Checklist</span>
                                            </div>
                                            <div className="flex items-center gap-1 hover:text-slate-200 cursor-pointer">
                                              <Folder className="h-2.5 w-2.5 text-slate-500" />
                                              <span>04 - Permisos de Trabajo</span>
                                             </div>
                                             {ptws?.filter(p => p.estado === 'Aprobado' && ((p.otCodigos || []).includes('26-29221') || (p.otCodigos || []).includes('OT-26-29221'))).map(p => (
                                               <div key={p.id} className="pl-4 flex items-center gap-1 text-emerald-400 font-bold text-[9px] truncate" style={{ marginLeft: '12px' }}>
                                                 <FileText className="h-2 w-2 text-emerald-400 shrink-0" />
                                                 <span>{p.codigo}_APROBADO_O&M.pdf</span>
                                               </div>
                                             ))}
                                             <div className="hidden">
                                            </div>
                                            <div className="flex items-center gap-1 hover:text-slate-200 cursor-pointer">
                                              <Folder className="h-2.5 w-2.5 text-slate-500" />
                                              <span>05 - Materiales / Repuestos</span>
                                            </div>
                                            <div className="flex items-center gap-1 hover:text-slate-200 cursor-pointer">
                                              <Folder className="h-2.5 w-2.5 text-slate-500" />
                                              <span>06 - Anexo Fotográfico</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Otros Parques */}
                      <div className="text-slate-500 text-[10.5px] space-y-1.5 pt-1 border-t border-slate-900">
                        <div className="flex items-center gap-1 opacity-70">
                          <Folder className="h-3 w-3" />
                          <span>Atacama Solar / (2026)</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-70">
                          <Folder className="h-3 w-3" />
                          <span>Santiago Solar / (2026)</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-70">
                          <Folder className="h-3 w-3" />
                          <span>Maule Solar / (2026)</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-70">
                          <Folder className="h-3 w-3" />
                          <span>Santiago Solar / (2026)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DOCUMENT NAMING STANDARDS BOX */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
              <h4 className="text-[11px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                Estándar de Nomenclatura O&amp;M
              </h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Para garantizar consistencia en auditorías, todos los archivos son procesados y renombrados con la fórmula institucional:
              </p>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 font-mono text-[10px] text-emerald-400 break-all select-all">
                Parque_OT-Tipo_Descripcion_Fecha_Tecnico.pdf
              </div>
              <p className="text-[10px] text-slate-500 italic">
                Ejemplo real:<br />
                Cantillana_OT-26-29221_PM-Anual-Inversores_2026-07_Victor-Leon.pdf
              </p>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: MAIN WORK PANEL */}
        <div className={userRole === 'TECNICO_OM' ? 'lg:col-span-12 space-y-4' : 'lg:col-span-8 space-y-4'}>
          
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar OT, activo, técnico..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2 rounded-lg">
                <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <select
                  value={filterParque}
                  onChange={(e) => setFilterParque(e.target.value)}
                  className="bg-transparent text-[11px] text-slate-300 outline-none border-none cursor-pointer flex-1 py-1"
                >
                  <option value="Todos" className="bg-slate-950 text-white">Todos los Parques</option>
                  {Array.from(new Set(ots.map(o => o.plantaNombre))).map(p => (
                    <option key={p} value={p} className="bg-slate-950 text-white">{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2 rounded-lg">
                <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <select
                  value={filterDocState}
                  onChange={(e) => setFilterDocState(e.target.value)}
                  className="bg-transparent text-[11px] text-slate-300 outline-none border-none cursor-pointer flex-1 py-1"
                >
                  <option value="Todos" className="bg-slate-950 text-white">Todos los Estados</option>
                  <option value="Pendiente de preparar" className="bg-slate-950 text-white">📂 Pendiente de preparar</option>
                  <option value="Paquete preparado" className="bg-slate-950 text-white">🔵 Paquete preparado</option>
                  <option value="Pendiente SharePoint" className="bg-slate-950 text-white">🟡 Pendiente SharePoint</option>
                  <option value="Respaldado" className="bg-slate-950 text-white">🟢 Respaldado</option>
                  <option value="Error de respaldo" className="bg-slate-950 text-white">🔴 Error de respaldo</option>
                  <option value="Duplicado detectado" className="bg-slate-950 text-white">⚪ Duplicado detectado</option>
                  <option value="Requiere revisión" className="bg-slate-950 text-white">🟠 Requiere revisión</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters toggler (Row 2) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-slate-850">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2 rounded-lg">
                <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <select
                  value={filterTecnico}
                  onChange={(e) => setFilterTecnico(e.target.value)}
                  className="bg-transparent text-[11px] text-slate-300 outline-none border-none cursor-pointer flex-1 py-1"
                >
                  <option value="Todos" className="bg-slate-950 text-white">Todos los Técnicos</option>
                  {tecnicosList.map(t => (
                    <option key={t} value={t} className="bg-slate-950 text-white">{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2 rounded-lg">
                <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <select
                  value={filterMes}
                  onChange={(e) => setFilterMes(e.target.value)}
                  className="bg-transparent text-[11px] text-slate-300 outline-none border-none cursor-pointer flex-1 py-1"
                >
                  <option value="Todos" className="bg-slate-950 text-white">Todos los Meses</option>
                  {mesesList.map(m => (
                    <option key={m} value={m} className="bg-slate-950 text-white">{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-2 rounded-lg">
                <Layers className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <select
                  value={filterWorkType}
                  onChange={(e) => setFilterWorkType(e.target.value)}
                  className="bg-transparent text-[11px] text-slate-300 outline-none border-none cursor-pointer flex-1 py-1"
                >
                  <option value="Todos" className="bg-slate-950 text-white">Todos los Tipos OT</option>
                  <option value="Preventiva" className="bg-slate-950 text-white">Preventiva</option>
                  <option value="Correctiva" className="bg-slate-950 text-white">Correctiva</option>
                  <option value="HSE" className="bg-slate-950 text-white">HSE</option>
                  <option value="Calidad" className="bg-slate-950 text-white">Calidad</option>
                </select>
              </div>
            </div>
          </div>

          {/* VIEW SWITCHER NAV TABS */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden flex flex-col md:flex-row justify-between items-stretch md:items-center p-1 gap-2 shadow-inner">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveSubTab('pendientes')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'pendientes'
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
                }`}
              >
                📋 Pendientes de Respaldo ({ots.filter(o => (o.estado === 'Finalizada' || o.estado === 'Cerrada' || o.avance === 100) && o.sharepointStatus !== 'Respaldado').length})
              </button>
              <button
                onClick={() => setActiveSubTab('respaldados')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'respaldados'
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
                }`}
              >
                ✓ Respaldadas en SharePoint ({ots.filter(o => o.sharepointStatus === 'Respaldado').length})
              </button>
            </div>

            <span className="text-[10px] text-slate-500 font-bold px-3 py-1 bg-slate-900 rounded uppercase border border-slate-850">
              {userRole === 'TECNICO_OM' ? 'Sincronización de Campo' : userRole === 'SUPERVISOR_TERRENO' ? 'Consola de Preparación' : 'Consola de Auditoría Global'}
            </span>
          </div>

          {/* WORKLIST GRID */}
          <div className="space-y-3.5">
            {filteredOts.length === 0 ? (
              <div className="bg-slate-950 border border-slate-900 py-12 rounded-xl text-center space-y-2 text-slate-500">
                <FolderSync className="h-8 w-8 mx-auto text-slate-600 animate-pulse" />
                <p className="font-bold">No se encontraron órdenes de trabajo para este filtro.</p>
                <p className="text-[10px]">Utilice filtros alternativos o cargue datos simulados en Configuración.</p>
              </div>
            ) : (
              filteredOts.map((ot) => {
                const sStatus = ot.sharepointStatus || 'Pendiente de preparar';
                const hasEvidence = ot.evidencePack && ot.evidencePack.length > 0;
                const hasApprovedEvidence = ot.evidencePack && ot.evidencePack.some(ev => ev.status === 'Aprobada');
                const hasChecklist = ot.checklistExecution && ot.checklistExecution.length > 0;
                const completedChecklistItems = ot.checklistExecution?.filter(c => c.completado || c.noAplica).length || 0;
                const totalChecklistItems = ot.checklistExecution?.length || 0;

                return (
                  <div
                    key={ot.codigo}
                    className={`bg-slate-900 border ${
                      sStatus === 'Respaldado'
                        ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-950/5'
                        : sStatus === 'Error de respaldo'
                        ? 'border-rose-500/30 hover:border-rose-500/50 bg-rose-950/5'
                        : 'border-slate-800 hover:border-slate-700'
                    } rounded-xl p-4 space-y-3 transition-all`}
                  >
                    {/* Top Row: Code, Planta, Tipo */}
                    <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-850 pb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-white text-sm">{ot.codigo}</span>
                          <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-bold">
                            {ot.tipo}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            ot.prioridad === 'Crítica' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            ot.prioridad === 'Alta' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}>
                            {ot.prioridad}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          <span className="font-bold text-slate-300">{ot.plantaNombre}</span>
                          <span className="text-slate-600">•</span>
                          <span className="font-medium text-slate-400">{ot.activo}</span>
                        </div>
                      </div>

                      {/* Status indicator badge */}
                      <div>
                        <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold flex items-center gap-1 border ${
                          sStatus === 'Respaldado'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : sStatus === 'Error de respaldo'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                            : sStatus === 'Duplicado detectado'
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : sStatus === 'Paquete preparado'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            : sStatus === 'Requiere revisión'
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            : 'bg-slate-950 text-slate-400 border-slate-850'
                        }`}>
                          {sStatus === 'Respaldado' && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {sStatus === 'Error de respaldo' && <AlertCircle className="h-3.5 w-3.5" />}
                          {sStatus}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Checklist Progress & Evidence, Permisos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-850/60 text-[10px] text-slate-400">
                      
                      {/* Checklist */}
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase text-slate-500 block font-black">Progreso Checklist</span>
                        {hasChecklist ? (
                          <div className="space-y-1">
                            <div className="flex justify-between font-bold">
                              <span>Completado</span>
                              <span className="text-indigo-400">{completedChecklistItems} de {totalChecklistItems}</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1">
                              <div
                                className="bg-indigo-500 h-1 rounded-full"
                                style={{ width: `${Math.round((completedChecklistItems / totalChecklistItems) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-rose-400 font-bold block mt-1">✗ Checklist Pendiente</span>
                        )}
                      </div>

                      {/* Evidence Vault Sinc */}
                      <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-850 pt-2 md:pt-0 md:pl-3">
                        <span className="text-[9px] uppercase text-slate-500 block font-black">Evidencias en Vault</span>
                        {hasEvidence ? (
                          <div className="space-y-0.5 mt-1">
                            <div className="flex items-center gap-1 text-slate-300 font-bold">
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>{ot.evidencePack?.length} archivos de terreno</span>
                            </div>
                            <div className="text-[9px]">
                              Aprobadas: <span className={hasApprovedEvidence ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                                {ot.evidencePack?.filter(ev => ev.status === 'Aprobada').length} de {ot.evidencePack?.length}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-rose-400 font-bold block mt-1">✗ Sin Evidencias Fotográficas</span>
                        )}
                      </div>

                      {/* Permisos */}
                      <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-850 pt-2 md:pt-0 md:pl-3">
                        <span className="text-[9px] uppercase text-slate-500 block font-black">Firma AST y Permisos</span>
                        <div className="space-y-0.5 mt-1">
                          <div className="flex items-center gap-1 font-bold">
                            <span className={ot.astFirmado ? 'text-emerald-400' : 'text-rose-400'}>
                              {ot.astFirmado ? '✓ AST Firmado' : '✗ AST Pendiente'}
                            </span>
                          </div>
                          <div className="text-[9px] truncate">
                            N° PTS: <span className="text-slate-300 font-bold">{ot.permisoTrabajoNumero || 'No requerido'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meta info: Técnico, Fecha y Path (If backed up) */}
                    <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] text-slate-400 pt-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          Técnico: <span className="text-slate-200 font-bold">{ot.responsable}</span>
                        </div>
                        <span className="text-slate-700">|</span>
                        <div>
                          Fecha: <span className="text-slate-300 font-bold">{ot.fechaInicio}</span>
                        </div>
                      </div>

                      {sStatus === 'Respaldado' && (
                        <div className="text-emerald-400 font-bold flex items-center gap-1 text-[9px] bg-emerald-950/20 border border-emerald-500/20 px-2 py-0.5 rounded">
                          <Database className="h-3 w-3" />
                          <span>Respaldado por {ot.sharepointUser} el {ot.sharepointDate}</span>
                        </div>
                      )}
                    </div>

                    {/* Virtual SharePoint Path Details */}
                    {sStatus === 'Respaldado' && ot.sharepointFiles && (
                      <div className="bg-slate-950/80 p-3 rounded-lg border border-emerald-950/50 space-y-2 mt-1 font-mono text-[10px]">
                        <span className="text-[9px] text-emerald-500 uppercase font-black tracking-widest block">
                          Ruta virtual consolidada SharePoint O&amp;M:
                        </span>
                        <div className="text-slate-300 break-all select-all font-bold">
                          {ot.sharepointPath}
                        </div>
                        
                        <div className="border-t border-emerald-950/50 pt-2 space-y-1 text-[9.5px]">
                          <span className="text-slate-500 block uppercase font-bold">Archivos generados con éxito:</span>
                          {ot.sharepointFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-slate-300 hover:text-white pl-1.5 border-l border-emerald-500/20">
                              <FileText className="h-3 w-3 text-indigo-400 shrink-0" />
                              <span className="truncate">{file}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance/Validation Info Banners */}
                    {userRole !== 'TECNICO_OM' && sStatus !== 'Respaldado' && (() => {
                      const val = getOtValidation(ot);
                      if (val.missing.length > 0) {
                        return (
                          <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-2.5 text-[10px] space-y-1.5 mt-2">
                            <span className="font-extrabold text-amber-400 block uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              REGLAS DE CUMPLIMIENTO O&amp;M PENDIENTES ({val.category}):
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-slate-300 font-mono">
                              {val.missing.map((m, idx) => (
                                <li key={idx} className={m.startsWith('Advertencia:') ? 'text-slate-400 italic' : 'text-amber-200'}>
                                  {m}
                                </li>
                              ))}
                            </ul>
                            {val.category === 'Critico_LOTO' && (
                              <button
                                type="button"
                                onClick={() => handleRegularizeDocs(ot)}
                                className="mt-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded border border-amber-400 text-[9.5px] uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                                <span>Firmar remota rápida de AST, PTS y bloqueo LOTO (HSE)</span>
                              </button>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-2.5 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 mt-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span>¡Todos los controles de cumplimiento aprobados para {val.category}! Listo para preparar paquete.</span>
                          </div>
                        );
                      }
                    })()}

                    {/* UX Actions Row (Adapts to roles) */}
                    <div className="flex flex-col sm:flex-row gap-2 justify-end border-t border-slate-850 pt-2.5">
                      
                      {/* Preview Report button (For supervisor or chief) */}
                      <button
                        type="button"
                        onClick={() => setPreviewOt(ot)}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1 font-bold text-[11px]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Ver Report Pack</span>
                      </button>
 
                      {/* Simulator controls for supervisors/chiefs */}
                      {userRole !== 'TECNICO_OM' && sStatus !== 'Respaldado' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePreparePackage(ot)}
                            disabled={!getOtValidation(ot).canPrepare}
                            className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-indigo-500 text-slate-950 rounded-lg transition-colors flex items-center justify-center gap-1 font-black text-[11px]"
                          >
                            <FolderSync className="h-3.5 w-3.5" />
                            <span>Preparar paquete SharePoint</span>
                          </button>
 
                          {/* Debug triggers */}
                          <button
                            type="button"
                            onClick={() => handleSimulateSyncError(ot)}
                            className="px-2.5 py-1.5 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-transparent rounded-lg transition-colors font-bold text-[9px]"
                            title="Simular error de transmisión de red para auditoría"
                          >
                            Simular Error Sync
                          </button>
 
                          <button
                            type="button"
                            onClick={() => handleSimulateDuplicate(ot)}
                            className="px-2.5 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent rounded-lg transition-colors font-bold text-[9px]"
                            title="Simular duplicado detectado"
                          >
                            Simular Duplicado
                          </button>
                        </>
                      )}
 
                      {/* Simplified technician status note */}
                      {userRole === 'TECNICO_OM' && (
                        <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-950 py-2 px-3 rounded-xl border border-slate-900 w-full">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-bold">Estado de Respaldo:</span>
                            {sStatus === 'Respaldado' ? (
                              <span className="text-emerald-400 font-black tracking-wide uppercase bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded text-[9.5px]">
                                ✓ RESPALDADO CON ÉXITO
                              </span>
                            ) : sStatus === 'Error de respaldo' || sStatus === 'Requiere revisión' ? (
                              <span className="text-rose-400 font-black tracking-wide uppercase bg-rose-950/30 border border-rose-500/20 px-2 py-0.5 rounded text-[9.5px]">
                                ⚠️ REQUIERE REVISIÓN (ERROR)
                              </span>
                            ) : (
                              <span className="text-amber-400 font-black tracking-wide uppercase bg-amber-950/30 border border-amber-500/20 px-2 py-0.5 rounded text-[9.5px]">
                                ⏳ PENDIENTE RESPALDO
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-500 italic flex items-center gap-1 shrink-0">
                            <Info className="h-3 w-3 text-indigo-400" />
                            <span>La sincronización avanzada es gestionada por tu Supervisor.</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* PREPARATION WIZARD SIMULATOR MODAL */}
      {selectedOtToPrepare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            {/* Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FolderSync className="h-5 w-5 text-indigo-400 animate-spin" />
                <div>
                  <h3 className="text-sm font-black text-white">Preparando Respaldos SharePoint</h3>
                  <span className="text-[9px] text-indigo-400 uppercase tracking-widest block mt-0.5">ORBI DOCUMENT ROUTING ENGINE</span>
                </div>
              </div>
            </div>

            {/* Content (Logs terminal look) */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar min-h-[300px]">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10.5px] leading-relaxed text-indigo-300 space-y-2 h-[260px] overflow-y-auto custom-scrollbar">
                {prepLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-extrabold">&gt;</span>
                    <span className={log.startsWith('✓') ? 'text-emerald-400 font-bold' : ''}>{log}</span>
                  </div>
                ))}
                {isPreparing && (
                  <div className="flex items-center gap-2 text-indigo-400 font-bold animate-pulse mt-1 pl-3">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Analizando consistencia de datos...</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>Sincronización Virtual O&amp;M</span>
                  <span>{Math.round((prepStep / 11) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-850">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((prepStep / 11) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Validation checklist preview inside modal */}
              {(() => {
                const cat = getOtCategory(selectedOtToPrepare);
                const hasApprovedEvidence = selectedOtToPrepare.evidencePack && selectedOtToPrepare.evidencePack.some(ev => ev.status === 'Aprobada');
                const hasChecklist = selectedOtToPrepare.checklistExecution && selectedOtToPrepare.checklistExecution.length > 0;
                const completedChecklistItems = selectedOtToPrepare.checklistExecution?.filter(c => c.completado || c.noAplica).length || 0;
                const totalChecklistItems = selectedOtToPrepare.checklistExecution?.length || 0;
                const checklistComplete = hasChecklist && totalChecklistItems > 0 && completedChecklistItems === totalChecklistItems;
                const astValid = selectedOtToPrepare.astFirmado;
                const ptsValid = !selectedOtToPrepare.requierePermisoTrabajo || !!selectedOtToPrepare.permisoTrabajoNumero;
                const signed = !!selectedOtToPrepare.firmaEjecutorSimulada && !!selectedOtToPrepare.firmaSupervisorSimulada;

                return (
                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 space-y-2">
                    <span className="text-[9.5px] text-slate-500 uppercase font-black tracking-widest block">Controles de Calidad O&amp;M ({cat})</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {cat !== 'Simple' && cat !== 'Correctivo' && (
                        <div className={`flex items-center gap-1.5 font-bold ${hasApprovedEvidence ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {hasApprovedEvidence ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
                          <span>Evidencias GEO Aprobadas</span>
                        </div>
                      )}
                      {cat !== 'Simple' && (
                        <div className={`flex items-center gap-1.5 font-bold ${checklistComplete ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {checklistComplete ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
                          <span>Checklist Completado</span>
                        </div>
                      )}
                      {cat === 'Critico_LOTO' && (
                        <>
                          <div className={`flex items-center gap-1.5 font-bold ${astValid ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {astValid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
                            <span>AST Validado Terreno</span>
                          </div>
                          <div className={`flex items-center gap-1.5 font-bold ${ptsValid ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {ptsValid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
                            <span>Permiso de Trabajo PTS</span>
                          </div>
                          <div className={`flex items-center gap-1.5 font-bold ${signed ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {signed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
                            <span>Firmas de Conformidad</span>
                          </div>
                        </>
                      )}
                      {cat === 'Simple' && (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold col-span-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Fast-Track Simple Aprobado (Sin requisitos críticos)</span>
                        </div>
                      )}
                      {cat === 'Correctivo' && (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold col-span-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Indexación de Repuestos Aprobada</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end items-center gap-3">
              <button
                onClick={() => setSelectedOtToPrepare(null)}
                className="px-4 py-1.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmBackup}
                disabled={isPreparing}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl transition-all flex items-center gap-1 shadow-md shadow-emerald-950/40"
              >
                <UploadCloud className="h-4 w-4" />
                Integrar y Subir a SharePoint
              </button>
            </div>

          </div>
        </div>
      )}

      {/* REPORT PACK PREVIEW MODAL */}
      {previewOt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            {/* Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-black text-white">ORBI Report Pack PDF Preview</h3>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block mt-0.5">Vista Documento Generado para SharePoint</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewOt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 hover:bg-slate-950"
              >
                X
              </button>
            </div>

            {/* Content (A4 simulated paper look) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar bg-slate-950">
              
              <div className="bg-white text-slate-900 p-8 rounded shadow-2xl space-y-6 font-sans text-xs mx-auto max-w-xl">
                {/* PDF Header logo */}
                <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-4">
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-indigo-950">ORBI ENERGY &amp; OPERATIONS</h1>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase block">O&amp;M COMMAND CENTER REPORT</span>
                  </div>
                  <div className="text-right text-[10px] font-mono">
                    <div className="font-bold">CÓDIGO OT: {previewOt.codigo}</div>
                    <div className="text-slate-500">FECHA: {previewOt.fechaInicio || '2026-07-03'}</div>
                    <div className="text-indigo-900 font-extrabold uppercase text-[9px]">{previewOt.tipo}</div>
                  </div>
                </div>

                {/* Subtitle */}
                <div className="text-center bg-indigo-900/5 py-2.5 rounded border border-indigo-900/10">
                  <h2 className="text-xs font-extrabold uppercase text-indigo-950 tracking-wider">REPORTE INTEGRAL DE CIERRE DOCUMENTAL</h2>
                </div>

                {/* General data */}
                <div className="grid grid-cols-2 gap-4 text-[11px] border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Planta Solar / Parque</span>
                    <strong className="text-slate-950 font-bold">{previewOt.plantaNombre}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Activo Solar</span>
                    <strong className="text-slate-950 font-bold">{previewOt.activo}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Técnico Ejecutor Responsable</span>
                    <strong className="text-slate-950 font-bold">{previewOt.responsable}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-black">Supervisor de Terreno</span>
                    <strong className="text-slate-950 font-bold">{previewOt.supervisor || 'Mauricio Valdés'}</strong>
                  </div>
                </div>

                {/* Checklist execution status */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-indigo-950 uppercase border-l-2 border-indigo-900 pl-2">
                    Ejecución de Checklist de Campo
                  </h3>
                  <div className="border border-slate-100 rounded overflow-hidden">
                    <table className="w-full text-left text-[11px] font-mono leading-relaxed">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[9px]">
                        <tr>
                          <th className="px-3 py-1.5">Ítem de Pauta Técnica</th>
                          <th className="px-3 py-1.5 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {previewOt.checklistExecution ? (
                          previewOt.checklistExecution.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2 text-xs">{item.item}</td>
                              <td className="px-3 py-2 text-center text-emerald-600 font-bold">✓ COMPLETADO</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-3 py-2 text-slate-500 italic">No se registran pautas en checklist para esta OT.</td>
                            <td className="px-3 py-2 text-center text-slate-400">-</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Evidence Pack screenshots */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-indigo-950 uppercase border-l-2 border-indigo-900 pl-2">
                    Registros y Evidencias Fotográficas
                  </h3>
                  {previewOt.evidencePack && previewOt.evidencePack.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3.5 pt-1">
                      {previewOt.evidencePack.map((ev, index) => (
                        <div key={index} className="border border-slate-100 p-2 rounded bg-slate-50 flex items-center gap-2.5">
                          <div className="h-10 w-10 bg-indigo-950 text-indigo-300 rounded flex items-center justify-center font-black text-lg shadow shrink-0">
                            F
                          </div>
                          <div className="text-[9.5px] leading-tight min-w-0">
                            <span className="font-bold text-slate-800 block truncate">{ev.label}</span>
                            <span className="text-slate-400 block truncate">{ev.simulatedFileName}</span>
                            <span className="text-emerald-600 block text-[9px] font-mono font-bold">Aprobado ✓</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic text-xs">Ningún registro adjunto.</div>
                  )}
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-100 font-mono text-[9.5px]">
                  <div className="text-center border-t border-slate-300 pt-2 space-y-0.5 text-slate-700">
                    <strong className="block text-slate-900">{previewOt.responsable}</strong>
                    <span className="text-slate-400 block">Técnico Ejecutor O&amp;M</span>
                    <span className="text-emerald-600 font-black block">FIRMADO DIGITALMENTE ✓</span>
                  </div>
                  <div className="text-center border-t border-slate-300 pt-2 space-y-0.5 text-slate-700">
                    <strong className="block text-slate-900">{previewOt.supervisor || 'Mauricio Valdés'}</strong>
                    <span className="text-slate-400 block">Supervisor de Terreno</span>
                    <span className="text-emerald-600 font-black block">FIRMADO DIGITALMENTE ✓</span>
                  </div>
                </div>

                {/* PDF Footer warning */}
                <div className="border-t border-slate-200 pt-3 flex justify-between text-[8px] text-slate-400 font-mono">
                  <span>ORBI COMMAND CENTER QA - SECURE PDF GENERATION ENGINE</span>
                  <span>PÁGINA 1 DE 1</span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 italic">Report Pack consolidado desde base inmutable</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewOt(null)}
                  className="px-4 py-1.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    alert('Simulación de descarga de Report Pack PDF exitosa.');
                    setPreviewOt(null);
                  }}
                  className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-black rounded-xl transition-all flex items-center gap-1 shadow-md shadow-indigo-950/40"
                >
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
