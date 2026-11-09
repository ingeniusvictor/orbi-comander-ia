/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle,
  FileText,
  Camera,
  Layers,
  MapPin,
  Clock,
  UserCheck,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Check,
  RefreshCw,
  Award,
  Upload,
  User,
  Shield,
  Trash2,
  Plus,
  Search,
  Package,
  Wrench,
  AlertOctagon,
  FileSignature,
  X,
  Zap,
  Activity,
  ThumbsUp,
  Eye,
  CornerDownRight,
  UserX,
  CheckSquare,
  CheckCircle2
} from 'lucide-react';
import { OT, Planta, OTEstado, OTEvidencia, OTEvidencePackItem, Escalation, Repuesto, Herramienta, OMInventoryItem, OMInventoryMovement } from '../types';
import { loadInventory, saveInventory, loadInventoryMovements, saveInventoryMovements } from '../data/db';

interface VistaTerrenoProps {
  ots: OT[];
  plantas: Planta[];
  onUpdateOts: (updatedOts: OT[]) => void;
  activeUserName: string;
  userRole: string;
  onAddAuditLog: (
    accion: string,
    modulo: string,
    otCode?: string,
    plantaName?: string,
    comentario?: string,
    criticidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  ) => void;
  escalaciones: Escalation[];
  onUpdateEscalaciones: (updated: Escalation[]) => void;
  repuestos: Repuesto[];
  onUpdateRepuestos: (updated: Repuesto[]) => void;
  herramientas: Herramienta[];
  onUpdateHerramientas: (updated: Herramienta[]) => void;
}

export default function VistaTerreno({
  ots,
  plantas,
  onUpdateOts,
  activeUserName,
  userRole,
  onAddAuditLog,
  escalaciones,
  onUpdateEscalaciones,
  repuestos,
  onUpdateRepuestos,
  herramientas,
  onUpdateHerramientas,
}: VistaTerrenoProps) {
  // Configuración de visualización y estados de simulación
  const [selectedOt, setSelectedOt] = useState<OT | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [gpsLocked, setGpsLocked] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ejecucion' | 'supervisor'>('ejecucion');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<string>('todos');

  // Funciones de acoplamiento e integridad de datos de terreno
  const logFieldExecution = (otId: string, step: string, details: string) => {
    try {
      const raw = localStorage.getItem('orbi_om_db_field_execution_v1') || '[]';
      const list = JSON.parse(raw);
      list.push({
        id: `EXEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        otId,
        step,
        details,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        user: activeUserName
      });
      localStorage.setItem('orbi_om_db_field_execution_v1', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const saveChecklistExecution = (otId: string, items: any[], progress: number) => {
    try {
      const raw = localStorage.getItem('orbi_om_db_checklist_execution_v1') || '[]';
      let list = JSON.parse(raw);
      list = list.filter((item: any) => item.otId !== otId);
      list.push({
        otId,
        progress,
        items,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        updatedBy: activeUserName
      });
      localStorage.setItem('orbi_om_db_checklist_execution_v1', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const saveEvidencePackToDB = (evidence: OTEvidencePackItem) => {
    try {
      const raw = localStorage.getItem('orbi_om_db_evidence_pack_v1') || '[]';
      const list = JSON.parse(raw);
      list.push(evidence);
      localStorage.setItem('orbi_om_db_evidence_pack_v1', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const removeEvidenceFromDB = (evidenceId: string) => {
    try {
      const raw = localStorage.getItem('orbi_om_db_evidence_pack_v1') || '[]';
      let list = JSON.parse(raw);
      list = list.filter((e: any) => e.evidenceId !== evidenceId);
      localStorage.setItem('orbi_om_db_evidence_pack_v1', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const saveFieldBlockerToDB = (otId: string, type: string, comment: string) => {
    try {
      const raw = localStorage.getItem('orbi_om_db_field_blockers_v1') || '[]';
      const list = JSON.parse(raw);
      list.push({
        blockerId: `BLK-${Date.now()}`,
        otId,
        type,
        comment,
        reportedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        reportedBy: activeUserName,
        status: 'Active'
      });
      localStorage.setItem('orbi_om_db_field_blockers_v1', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const saveClosureRequestToDB = (otId: string, comment: string) => {
    try {
      const raw = localStorage.getItem('orbi_om_db_field_closure_requests_v1') || '[]';
      const list = JSON.parse(raw);
      list.push({
        requestId: `REQ-${Date.now()}`,
        otId,
        comment,
        requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        requestedBy: activeUserName,
        status: 'Pending'
      });
      localStorage.setItem('orbi_om_db_field_closure_requests_v1', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };
  
  // Paso activo en el flujo de ejecución (1: Llegada, 2: AST, 3: Checklist, 4: Evidence, 5: HH/Diagnosis, 6: Cierre/Bloqueo)
  const [executionStep, setExecutionStep] = useState<number>(1);

  // Estados temporales de formulario para la OT seleccionada
  const [tempHoraLlegada, setTempHoraLlegada] = useState<string>('');
  const [tempObsLlegada, setTempObsLlegada] = useState<string>('');
  const [tempASTFirmado, setTempASTFirmado] = useState<boolean>(false);
  const [tempRiesgos, setTempRiesgos] = useState<string[]>([]);
  const [tempCondicionInsegura, setTempCondicionInsegura] = useState<string>('');
  const [tempPermisoTrabajoNum, setTempPermisoTrabajoNum] = useState<string>('');
  const [tempFirmaEjecutor, setTempFirmaEjecutor] = useState<string>('');
  const [tempFirmaSupervisor, setTempFirmaSupervisor] = useState<string>('');

  // Checklist de terreno temporal
  const [tempChecklist, setTempChecklist] = useState<any[]>([]);
  
  // Evidencias temporal
  const [tempEvidenceList, setTempEvidenceList] = useState<OTEvidencePackItem[]>([]);
  const [simulatingPhoto, setSimulatingPhoto] = useState<boolean>(false);
  const [newEvidenceLabel, setNewEvidenceLabel] = useState<string>('');
  const [newEvidenceDesc, setNewEvidenceDesc] = useState<string>('');
  const [newEvidenceType, setNewEvidenceType] = useState<any>('during');
  const [activoCompletadoMsg, setActivoCompletadoMsg] = useState<string | null>(null);

  // Horas y Diagnóstico temporal
  const [tempHhReales, setTempHhReales] = useState<number>(0);
  const [tempDiagnosticoFinal, setTempDiagnosticoFinal] = useState<string>('');
  const [tempAccionRealizada, setTempAccionRealizada] = useState<string>('');
  
  // Búsqueda y uso de repuestos / herramientas en el terreno
  const [selectedRepuestoId, setSelectedRepuestoId] = useState<string>('');
  const [repuestoCantidad, setRepuestoCantidad] = useState<number>(1);
  const [selectedHerramientaId, setSelectedHerramientaId] = useState<string>('');
  const [tempSparesUsed, setTempSparesUsed] = useState<{ id: string; codigo: string; nombre: string; cantidad: number }[]>([]);
  const [tempToolsUsed, setTempToolsUsed] = useState<string[]>([]);

  // Bloqueo temporal
  const [showBlockerModal, setShowBlockerModal] = useState<boolean>(false);
  const [blockerReason, setBlockerReason] = useState<string>('');
  const [blockerType, setBlockerType] = useState<string>('Falta de repuesto');
  const [blockerComment, setBlockerComment] = useState<string>('');

  // Proponer cierre temporal
  const [comentarioCierre, setComentarioCierre] = useState<string>('');

  // Mensaje de éxito
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Estado de tipo de OT Mockeada (Regla 8)
  const [mockOtType, setMockOtType] = useState<string>('');

  // Helper para obtener los pasos visibles de una OT (Regla 2, 3)
  const getVisibleSteps = (ot: OT) => {
    const steps = [1];
    if (ot.requiereAST) steps.push(2);
    if (ot.requiereChecklist !== false) steps.push(3);
    if (ot.requiereEvidencia !== false) steps.push(4);
    steps.push(5, 6);
    return steps;
  };

  // Helper para avanzar al siguiente paso visible
  const setNextVisibleStep = (currentStep: number) => {
    if (!selectedOt) return;
    const steps = getVisibleSteps(selectedOt);
    const currIdx = steps.indexOf(currentStep);
    if (currIdx !== -1 && currIdx < steps.length - 1) {
      setExecutionStep(steps[currIdx + 1]);
    }
  };

  // Helper para aplicar el Mock de tipo de OT (Regla 8)
  const handleApplyMockType = (typeKey: string) => {
    if (!selectedOt) return;
    
    let updated: Partial<OT> = {};
    if (typeKey === 'simple') {
      updated = {
        tipo: 'Preventiva',
        prioridad: 'Baja',
        criticidad: 'Baja',
        requiereAST: false,
        astFirmado: false,
        requierePermisoTrabajo: false,
        requiereValidacionHSE: false,
        requiereValidacionCalidad: false,
        requiereChecklist: false,
        requiereEvidencia: false,
        checklistExecution: [],
        evidencePack: [],
      };
    } else if (typeKey === 'preventivo') {
      updated = {
        tipo: 'Preventiva',
        prioridad: 'Media',
        criticidad: 'Media',
        requiereAST: false,
        astFirmado: false,
        requierePermisoTrabajo: false,
        requiereValidacionHSE: false,
        requiereValidacionCalidad: false,
        requiereChecklist: true,
        requiereEvidencia: true,
        checklistExecution: (selectedOt.checklistExecution && selectedOt.checklistExecution.length > 0) ? selectedOt.checklistExecution : [
          { item: 'Inspección de estructura y soportes', completado: false },
          { item: 'Limpieza de polvo y suciedad', completado: false },
        ]
      };
    } else if (typeKey === 'correctivo_repuesto') {
      updated = {
        tipo: 'Correctiva',
        prioridad: 'Alta',
        criticidad: 'Alta',
        requiereAST: false,
        astFirmado: false,
        requierePermisoTrabajo: false,
        requiereValidacionHSE: false,
        requiereValidacionCalidad: false,
        requiereChecklist: true,
        requiereEvidencia: true,
        repuestosRequeridos: ['Fusible gPV 15A 1000V', 'Conector MC4 Hembra'],
        checklistExecution: (selectedOt.checklistExecution && selectedOt.checklistExecution.length > 0) ? selectedOt.checklistExecution : [
          { item: 'Reemplazo de componente averiado', completado: false },
          { item: 'Prueba de aislamiento y torque', completado: false },
        ]
      };
    } else if (typeKey === 'critica_ast') {
      updated = {
        tipo: 'Emergencia',
        prioridad: 'Crítica',
        criticidad: 'Crítica',
        requiereAST: true,
        astFirmado: false,
        requierePermisoTrabajo: false,
        requiereValidacionHSE: false,
        requiereValidacionCalidad: false,
        requiereChecklist: true,
        requiereEvidencia: true,
        checklistExecution: (selectedOt.checklistExecution && selectedOt.checklistExecution.length > 0) ? selectedOt.checklistExecution : [
          { item: 'Aislamiento seguro de línea de media tensión', completado: false },
          { item: 'Verificación de ausencia de tensión', completado: false },
        ]
      };
    } else if (typeKey === 'loto_hse') {
      updated = {
        tipo: 'HSE',
        prioridad: 'Crítica',
        criticidad: 'Crítica',
        requiereAST: true,
        astFirmado: false,
        requierePermisoTrabajo: true,
        requiereValidacionHSE: true,
        requiereValidacionCalidad: true,
        requiereChecklist: true,
        requiereEvidencia: true,
        checklistExecution: (selectedOt.checklistExecution && selectedOt.checklistExecution.length > 0) ? selectedOt.checklistExecution : [
          { item: 'Bloqueo y etiquetado LOTO en celda', completado: false },
          { item: 'Verificación de puesta a tierra', completado: false },
        ]
      };
    }

    const merged = { ...selectedOt, ...updated } as OT;
    setSelectedOt(merged);

    // Actualizar la lista global de OTs
    const idx = ots.findIndex(o => o.codigo === selectedOt.codigo);
    if (idx !== -1) {
      const copy = [...ots];
      copy[idx] = merged;
      onUpdateOts(copy);
    }

    // Recargar checklist temporal
    if (merged.checklistExecution) {
      setTempChecklist(merged.checklistExecution);
    } else {
      setTempChecklist([]);
    }

    // Recargar evidencias temporales
    setTempEvidenceList(merged.evidencePack || []);

    // Reiniciar paso de ejecución a uno válido
    setExecutionStep(1);

    triggerSuccess(`🧪 Modo de Prueba: Se configuró la OT como "${typeKey.toUpperCase().replace('_', ' ')}"`);
  };

  // Determinar si el rol tiene capacidades de supervisor
  const isSupervisorRole = ['SUPERVISOR_TERRENO', 'JEFE_TERRENO', 'JEFE_OM', 'COORDINADOR_OM', 'SUPER_ADMIN_ORBI'].includes(userRole);

  // Al iniciar o al cambiar el rol, ajustar la pestaña activa
  useEffect(() => {
    if (isSupervisorRole) {
      setActiveTab('supervisor');
    } else {
      setActiveTab('ejecucion');
    }
  }, [userRole]);

  // Si se selecciona una OT, cargar sus datos actuales en los estados temporales
  const handleSelectOt = (ot: OT) => {
    setSelectedOt(ot);
    setTempHoraLlegada(ot.horaLlegadaSimulada || new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }));
    setTempObsLlegada(ot.observacionLlegada || 'Llegada segura a instalación.');
    setTempASTFirmado(ot.astFirmado || false);
    setTempRiesgos(ot.riesgosDetectadosTerreno ? ot.riesgosDetectadosTerreno.split(', ').filter(Boolean) : []);
    setTempCondicionInsegura(ot.condicionInseguraTerreno || '');
    setTempPermisoTrabajoNum(ot.permisoTrabajoNumero || '');
    setTempFirmaEjecutor(ot.firmaEjecutorSimulada || '');
    setTempFirmaSupervisor(ot.firmaSupervisorSimulada || '');

    // Cargar checklist
    const loadedChecklist = ot.checklistExecution || (ot.checklist || []).map((c, index) => ({
      item: c.item,
      completado: c.completado,
      noAplica: false,
      observacion: '',
      hallazgo: false,
      evidenciaRequerida: index === 0
    }));
    setTempChecklist(loadedChecklist);

    // Cargar evidence pack
    setTempEvidenceList(ot.evidencePack || []);

    // Cargar horas y diagnóstico
    setTempHhReales(ot.hhReales || ot.hhEstimadas || 2);
    setTempDiagnosticoFinal(ot.diagnosticoFinalTerreno || '');
    setTempAccionRealizada(ot.accionRealizadaTerreno || '');
    setTempSparesUsed([]);
    setTempToolsUsed(ot.herramientasRequeridas || []);

    // Determinar qué paso mostrar de acuerdo al estado actual de la OT
    const steps = getVisibleSteps(ot);
    let initialStep = 1;
    if (!ot.llegadaConfirmada) {
      initialStep = 1;
    } else if (ot.requiereAST && !ot.astFirmado) {
      initialStep = 2;
    } else if (ot.requiereChecklist !== false && loadedChecklist.length > 0 && loadedChecklist.some(c => !c.completado && !c.noAplica)) {
      initialStep = 3;
    } else if (ot.requiereEvidencia !== false && (!ot.evidencePack || ot.evidencePack.length === 0)) {
      initialStep = 4;
    } else if (!ot.diagnosticoFinalTerreno) {
      initialStep = 5;
    } else {
      initialStep = 6;
    }

    // Asegurarse de que el step inicial esté en la lista de permitidos
    if (!steps.includes(initialStep)) {
      if (initialStep === 2) {
        initialStep = steps.includes(3) ? 3 : (steps.includes(4) ? 4 : 5);
      } else if (initialStep === 3) {
        initialStep = steps.includes(4) ? 4 : 5;
      } else if (initialStep === 4) {
        initialStep = 5;
      } else {
        initialStep = 1;
      }
    }
    setExecutionStep(initialStep);
  };

  // Filtrado de OTs asignadas al técnico actual (Técnico / Ingeniero)
  const myOts = ots.filter(
    (ot) =>
      ot.responsable.toLowerCase().includes(activeUserName.toLowerCase()) ||
      ot.tecnicoAsignado?.toLowerCase().includes(activeUserName.toLowerCase()) ||
      activeUserName === 'Usuario Demostración'
  );

  // Lista para mostrar de OTs en modo de simulación técnica
  const filteredMyOts = myOts.filter((ot) => {
    const matchesSearch = ot.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ot.activo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ot.plantaNombre.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (ot.estado === 'Cerrada') return false;

    switch (quickFilter) {
      case 'hoy':
        return ot.fechaProgramada === '2026-07-07' || ot.fechaInicio === '2026-07-07';
      case 'semana':
        return ot.fechaProgramada?.startsWith('2026-07') || ot.fechaInicio?.startsWith('2026-07');
      case 'criticas':
        return ot.prioridad === 'Crítica' || ot.impactoOperacional === 'Alta' || ot.impacto === 'Alto' || ot.impacto === 'Crítico';
      case 'en_terreno':
        return ot.estado === 'En terreno';
      case 'en_ejecucion':
        return ot.estado === 'En ejecución';
      case 'bloqueadas':
        return ot.bloqueada || ot.estado === 'Bloqueada';
      case 'listas_revision':
        return ot.estado === 'Lista para revisión';
      case 'evidencia_pendiente':
        return ot.requiereEvidencia && (!ot.evidencePack || ot.evidencePack.length === 0);
      case 'ast_pendiente':
        return ot.requiereAST && !ot.astFirmado;
      case 'todos':
      default:
        return true;
    }
  });

  // Lista para mostrar de OTs en modo Supervisor
  const supervisorOts = ots.filter((ot) => {
    const matchesSearch = ot.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ot.activo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ot.plantaNombre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // OTs listas para aprobación o propuesta de cierre
  const closureProposalOts = supervisorOts.filter(o => o.propuestaCierreTerreno || o.estado === 'Lista para revisión');
  const blockedOts = supervisorOts.filter(o => o.bloqueada || o.estado === 'Bloqueada');
  const pendingEvidenceOts = supervisorOts.filter(o => o.evidencePack && o.evidencePack.some(ev => ev.status === 'Pendiente'));

  // 1. CONFIRMAR LLEGADA A PLANTA
  const handleConfirmArrival = () => {
    if (!selectedOt) return;
    
    const updatedOT: OT = {
      ...selectedOt,
      llegadaConfirmada: true,
      horaLlegadaSimulada: tempHoraLlegada,
      observacionLlegada: tempObsLlegada,
      estado: 'En terreno'
    };

    const index = ots.findIndex((o) => o.codigo === selectedOt.codigo);
    if (index !== -1) {
      const copy = [...ots];
      copy[index] = updatedOT;
      onUpdateOts(copy);
      setSelectedOt(updatedOT);
    }

    logFieldExecution(selectedOt.codigo, 'Arrival', `Llegada confirmada a las ${tempHoraLlegada}. Obs: ${tempObsLlegada}`);

    onAddAuditLog(
      'Confirmación de Llegada',
      'Field Ops Mobile',
      selectedOt.codigo,
      selectedOt.plantaNombre,
      `Técnico confirma arribo simulado a las ${tempHoraLlegada}. Obs: ${tempObsLlegada}`,
      'Baja'
    );

    triggerSuccess('¡Arribo confirmado! El estado de la OT cambió a "En terreno".');
    setNextVisibleStep(1);
  };

  // 2. REGISTRAR SEGURIDAD (AST / LOTO)
  const handleSaveSecurity = () => {
    if (!selectedOt) return;

    if (!tempASTFirmado) {
      alert('Debe firmar el AST (Análisis Seguro de Trabajo) físicamente/digitalmente para poder continuar.');
      return;
    }
    if (!tempFirmaEjecutor) {
      alert('Debe ingresar el nombre para la firma digital del ejecutor.');
      return;
    }

    const updatedOT: OT = {
      ...selectedOt,
      astFirmado: true,
      firmaEjecutorSimulada: tempFirmaEjecutor,
      firmaSupervisorSimulada: tempFirmaSupervisor,
      riesgosDetectadosTerreno: tempRiesgos.join(', '),
      condicionInseguraTerreno: tempCondicionInsegura,
      permisoTrabajoNumero: tempPermisoTrabajoNum,
      estado: 'En ejecución'
    };

    const index = ots.findIndex((o) => o.codigo === selectedOt.codigo);
    if (index !== -1) {
      const copy = [...ots];
      copy[index] = updatedOT;
      onUpdateOts(copy);
      setSelectedOt(updatedOT);
    }

    logFieldExecution(selectedOt.codigo, 'AST', `AST Visado y firmado por ${tempFirmaEjecutor}. Permiso Nº: ${tempPermisoTrabajoNum}. Riesgos: ${tempRiesgos.join(', ') || 'Ninguno'}`);

    onAddAuditLog(
      'Firma AST & Inicio Ejecución',
      'Field Ops Mobile',
      selectedOt.codigo,
      selectedOt.plantaNombre,
      `AST firmado por ${tempFirmaEjecutor}. Riesgos: ${tempRiesgos.join(', ') || 'Ninguno detectado'}. Estado cambió a "En ejecución".`,
      'Media'
    );

    triggerSuccess('¡Seguridad visada con éxito! La OT ha cambiado a "En ejecución".');
    setNextVisibleStep(2);
  };

  // 3. ACTUALIZAR CHECKLIST TÉCNICO
  const handleToggleChecklistField = (index: number, field: 'completado' | 'noAplica' | 'hallazgo') => {
    const copy = [...tempChecklist];
    if (field === 'completado') {
      copy[index].completado = !copy[index].completado;
      if (copy[index].completado) copy[index].noAplica = false;
    } else if (field === 'noAplica') {
      copy[index].noAplica = !copy[index].noAplica;
      if (copy[index].noAplica) copy[index].completado = false;
    } else if (field === 'hallazgo') {
      copy[index].hallazgo = !copy[index].hallazgo;
    }
    setTempChecklist(copy);
  };

  const handleUpdateChecklistObs = (index: number, text: string) => {
    const copy = [...tempChecklist];
    copy[index].observacion = text;
    setTempChecklist(copy);
  };

  const handleSaveChecklist = () => {
    if (!selectedOt) return;

    // Calcular avance basado en el checklist
    const totalItems = tempChecklist.length;
    const completedItems = tempChecklist.filter(c => c.completado || c.noAplica).length;
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;

    const updatedOT: OT = {
      ...selectedOt,
      checklistExecution: tempChecklist,
      avance: progressPercent,
      checklist: tempChecklist.map(c => ({ item: c.item, completado: c.completado }))
    };

    const index = ots.findIndex((o) => o.codigo === selectedOt.codigo);
    if (index !== -1) {
      const copy = [...ots];
      copy[index] = updatedOT;
      onUpdateOts(copy);
      setSelectedOt(updatedOT);
    }

    saveChecklistExecution(selectedOt.codigo, tempChecklist, progressPercent);
    logFieldExecution(selectedOt.codigo, 'Checklist', `Checklist actualizado. Progreso: ${progressPercent}%.`);

    onAddAuditLog(
      'Checklist Actualizado',
      'Field Ops Mobile',
      selectedOt.codigo,
      selectedOt.plantaNombre,
      `Progreso del checklist: ${completedItems}/${totalItems} completados (${progressPercent}% de avance).`,
      'Baja'
    );

    triggerSuccess(`¡Checklist guardado! Avance de la OT actualizado a ${progressPercent}%.`);
    setNextVisibleStep(3);
  };

  // 4. SUBIR EVIDENCIA SIMULADA
  const handleUploadSimulatedPhoto = () => {
    if (!selectedOt) return;
    if (!newEvidenceLabel.trim()) {
      alert('Indique una etiqueta para la evidencia fotográfica (ej: Inversor cerrado, Termografía, etc.)');
      return;
    }

    setSimulatingPhoto(true);
    
    // Generación de nombre aleatorio y simulación de cámara
    setTimeout(() => {
      const extension = newEvidenceType === 'hse' || newEvidenceType === 'quality' ? 'jpg' : 'png';
      const fileNames = {
        before: [`antes_bloqueo_${selectedOt.codigo}.png`, `antes_limpieza_${selectedOt.codigo}.png`],
        during: [`durante_medicion_${selectedOt.codigo}.png`, `durante_torque_${selectedOt.codigo}.png`],
        after: [`despues_reparado_${selectedOt.codigo}.png`, `despues_operando_${selectedOt.codigo}.png`],
        hse: [`ast_campo_${selectedOt.codigo}.jpg`, `epp_terreno_${selectedOt.codigo}.jpg`],
        quality: [`termino_calidad_${selectedOt.codigo}.jpg`, `torque_celda_${selectedOt.codigo}.jpg`],
        spare: [`repuesto_instalado_${selectedOt.codigo}.png`],
        tool: [`herramientas_utilizadas_${selectedOt.codigo}.png`],
        close: [`acta_conforme_${selectedOt.codigo}.png`]
      };

      const bucket = fileNames[newEvidenceType as keyof typeof fileNames] || fileNames.during;
      const randomFile = bucket[Math.floor(Math.random() * bucket.length)];

      const newEvidence: OTEvidencePackItem = {
        evidenceId: `EV-PK-${Date.now()}`,
        otId: selectedOt.codigo,
        type: newEvidenceType,
        label: newEvidenceLabel,
        description: newEvidenceDesc || 'Cargado mediante visor móvil de terreno.',
        simulatedFileName: randomFile,
        uploadedBy: activeUserName,
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Completado'
      };

      const updatedEvidencePack = [...tempEvidenceList, newEvidence];
      setTempEvidenceList(updatedEvidencePack);

      const updatedOT: OT = {
        ...selectedOt,
        evidencePack: updatedEvidencePack,
        evidencias: updatedEvidencePack.map(e => ({
          url: 'captured_field_snapshot.png',
          nombreArchivo: e.simulatedFileName,
          descripcion: e.label + ': ' + e.description,
          fecha: e.uploadedAt.substring(0, 10)
        }))
      };

      const index = ots.findIndex((o) => o.codigo === selectedOt.codigo);
      if (index !== -1) {
        const copy = [...ots];
        copy[index] = updatedOT;
        onUpdateOts(copy);
        setSelectedOt(updatedOT);
      }

      saveEvidencePackToDB(newEvidence);
      logFieldExecution(selectedOt.codigo, 'Evidence', `Evidencia de tipo ${newEvidenceType} agregada: ${newEvidenceLabel} (${randomFile})`);

      onAddAuditLog(
        'Evidencia Fotográfica Terreno',
        'Field Ops Mobile',
        selectedOt.codigo,
        selectedOt.plantaNombre,
        `Se adjuntó evidencia de tipo "${newEvidenceType}": ${newEvidence.simulatedFileName} (${newEvidence.label})`,
        'Baja'
      );

      setNewEvidenceLabel('');
      setNewEvidenceDesc('');
      setSimulatingPhoto(false);
      triggerSuccess('¡Fotografía de evidencia simulada y sincronizada correctamente!');
    }, 1500);
  };

  const handleDeleteEvidence = (evidenceId: string) => {
    if (!selectedOt) return;
    const filtered = tempEvidenceList.filter(e => e.evidenceId !== evidenceId);
    setTempEvidenceList(filtered);

    const updatedOT: OT = {
      ...selectedOt,
      evidencePack: filtered,
      evidencias: filtered.map(e => ({
        url: 'captured_field_snapshot.png',
        nombreArchivo: e.simulatedFileName,
        descripcion: e.label + ': ' + e.description,
        fecha: e.uploadedAt.substring(0, 10)
      }))
    };

    const index = ots.findIndex((o) => o.codigo === selectedOt.codigo);
    if (index !== -1) {
      const copy = [...ots];
      copy[index] = updatedOT;
      onUpdateOts(copy);
      setSelectedOt(updatedOT);
    }

    removeEvidenceFromDB(evidenceId);
    logFieldExecution(selectedOt.codigo, 'EvidenceDeleted', `Evidencia eliminada: ${evidenceId}`);
  };

  // 5. REGISTRAR HH, DIAGNÓSTICO, REPUESTOS & HERRAMIENTAS
  const handleAddRepuestoTerreno = () => {
    if (!selectedRepuestoId || !selectedOt) return;
    
    // Load current inventory
    const currentInventory = loadInventory();
    
    // Find the item in the active inventory database
    const invItemIndex = currentInventory.findIndex(item => item.codigo === selectedRepuestoId);
    if (invItemIndex === -1) {
      alert("El repuesto no existe en el catálogo.");
      return;
    }
    
    const invItem = currentInventory[invItemIndex];
    
    // Check if the item belongs to the current plant
    if (invItem.plantaNombre !== selectedOt.plantaNombre) {
      alert(`Este repuesto corresponde a la planta ${invItem.plantaNombre}, no a ${selectedOt.plantaNombre}.`);
      return;
    }

    // Validate stock
    if (invItem.stockActual < repuestoCantidad) {
      alert(`Stock insuficiente en esta planta. Stock disponible: ${invItem.stockActual} ${invItem.unidad}.`);
      return;
    }

    const stockAnterior = invItem.stockActual;
    const stockFinal = stockAnterior - repuestoCantidad;

    // Update stock in inventory
    currentInventory[invItemIndex] = {
      ...invItem,
      stockActual: stockFinal,
      estado: stockFinal === 0 
        ? 'Sin Stock' 
        : stockFinal <= invItem.stockMinimo 
          ? 'Bajo Mínimo' 
          : 'Disponible',
      ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    saveInventory(currentInventory);

    // Register movement in the database
    const currentMovements = loadInventoryMovements();
    const movId = `MOV-C-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const newMovementItem: OMInventoryMovement = {
      id: movId,
      itemCodigo: invItem.codigo,
      itemDescripcion: invItem.descripcion,
      plantaId: invItem.plantaId,
      plantaNombre: invItem.plantaNombre,
      tipoMovimiento: 'Consumo por OT',
      otAsociada: selectedOt.codigo,
      tecnico: activeUserName,
      cantidad: repuestoCantidad,
      stockAnterior,
      stockFinal,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      observacion: `Consumo registrado desde Vista Terreno por el técnico ${activeUserName} para la OT Correctiva ${selectedOt.codigo}.`
    };
    currentMovements.unshift(newMovementItem);
    saveInventoryMovements(currentMovements);

    // Update local state tempSparesUsed
    const existIndex = tempSparesUsed.findIndex(s => s.codigo === selectedRepuestoId);
    if (existIndex !== -1) {
      const copy = [...tempSparesUsed];
      copy[existIndex].cantidad += repuestoCantidad;
      setTempSparesUsed(copy);
    } else {
      setTempSparesUsed([...tempSparesUsed, {
        id: invItem.id,
        codigo: invItem.codigo,
        nombre: invItem.descripcion,
        cantidad: repuestoCantidad
      }]);
    }

    // Add Audit Log
    onAddAuditLog(
      'Consumo Repuesto Terreno',
      'Inventario O&M',
      selectedOt.codigo,
      selectedOt.plantaNombre,
      `Técnico consume ${repuestoCantidad} unidades de "${invItem.descripcion}" (${invItem.codigo}) para OT ${selectedOt.codigo}. Stock anterior: ${stockAnterior} → Final: ${stockFinal}.`,
      'Media'
    );

    setSelectedRepuestoId('');
    setRepuestoCantidad(1);
  };

  const handleRemoveRepuestoTerreno = (repId: string, cantidad: number) => {
    if (!selectedOt) return;

    // Load current inventory
    const currentInventory = loadInventory();
    const invItemIndex = currentInventory.findIndex(item => item.codigo === repId);
    
    if (invItemIndex !== -1) {
      const invItem = currentInventory[invItemIndex];
      const stockAnterior = invItem.stockActual;
      const stockFinal = stockAnterior + cantidad;

      // Restore stock
      currentInventory[invItemIndex] = {
        ...invItem,
        stockActual: stockFinal,
        estado: stockFinal === 0 
          ? 'Sin Stock' 
          : stockFinal <= invItem.stockMinimo 
            ? 'Bajo Mínimo' 
            : 'Disponible',
        ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      saveInventory(currentInventory);

      // Register reversal/return movement
      const currentMovements = loadInventoryMovements();
      const movId = `MOV-R-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const newMovementItem: OMInventoryMovement = {
        id: movId,
        itemCodigo: invItem.codigo,
        itemDescripcion: invItem.descripcion,
        plantaId: invItem.plantaId,
        plantaNombre: invItem.plantaNombre,
        tipoMovimiento: 'Ingreso de repuesto',
        otAsociada: selectedOt.codigo,
        tecnico: activeUserName,
        cantidad,
        stockAnterior,
        stockFinal,
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
        observacion: `Reverso de consumo por cancelación de recurso en Vista Terreno para la OT ${selectedOt.codigo}.`
      };
      currentMovements.unshift(newMovementItem);
      saveInventoryMovements(currentMovements);

      // Add Audit Log
      onAddAuditLog(
        'Devolución Repuesto Terreno',
        'Inventario O&M',
        selectedOt.codigo,
        selectedOt.plantaNombre,
        `Técnico devuelve/cancela ${cantidad} unidades de "${invItem.descripcion}" (${invItem.codigo}) para OT ${selectedOt.codigo}. Stock anterior: ${stockAnterior} → Final: ${stockFinal}.`,
        'Baja'
      );
    }

    setTempSparesUsed(tempSparesUsed.filter(s => s.codigo !== repId));
  };

  const handleToggleHerramientaTerreno = (toolId: string) => {
    if (tempToolsUsed.includes(toolId)) {
      setTempToolsUsed(tempToolsUsed.filter(id => id !== toolId));
    } else {
      setTempToolsUsed([...tempToolsUsed, toolId]);
    }
  };

  const handleSaveHHAndDiagnosis = () => {
    if (!selectedOt) return;
    if (tempHhReales <= 0) {
      alert('Debe registrar horas referenciales mayores a 0.');
      return;
    }
    if (!tempDiagnosticoFinal.trim()) {
      alert('Debe ingresar un diagnóstico final técnico de terreno.');
      return;
    }
    if (!tempAccionRealizada.trim()) {
      alert('Debe ingresar la descripción de la acción realizada.');
      return;
    }

    const updatedOT: OT = {
      ...selectedOt,
      hhReales: tempHhReales,
      diagnosticoFinalTerreno: tempDiagnosticoFinal,
      accionRealizadaTerreno: tempAccionRealizada,
      repuestosRequeridas: tempSparesUsed.map(s => `${s.nombre} (x${s.cantidad})`),
      herramientasRequeridas: tempToolsUsed
    };

    const index = ots.findIndex((o) => o.codigo === selectedOt.codigo);
    if (index !== -1) {
      const copy = [...ots];
      copy[index] = updatedOT;
      onUpdateOts(copy);
      setSelectedOt(updatedOT);
    }

    logFieldExecution(selectedOt.codigo, 'HHAndDiagnosis', `HH reportadas: ${tempHhReales}. Diagnóstico: ${tempDiagnosticoFinal}. Acciones: ${tempAccionRealizada}`);

    onAddAuditLog(
      'HH & Diagnóstico Terreno',
      'Field Ops Mobile',
      selectedOt.codigo,
      selectedOt.plantaNombre,
      `HH registradas: ${tempHhReales}. Diagnóstico: ${tempDiagnosticoFinal}.`,
      'Baja'
    );

    triggerSuccess('¡Datos de HH y Diagnóstico salvados!');
    setNextVisibleStep(5);
  };

  // 6. SOLICITAR PROPUESTA DE CIERRE TÉCNICO
  const handleProposeClosure = () => {
    if (!selectedOt) return;

    // Validar HH registradas (Regla 4)
    if (!selectedOt.hhReales || selectedOt.hhReales <= 0) {
      alert('Falta registrar horas trabajadas.');
      return;
    }

    // Validar diagnóstico final (Regla 4)
    if (!selectedOt.diagnosticoFinalTerreno || !selectedOt.diagnosticoFinalTerreno.trim()) {
      alert('Falta registrar diagnóstico y acciones realizadas.');
      return;
    }

    // Validar checklist terminado (Regla 4)
    if (selectedOt.requiereChecklist !== false) {
      const pendingCount = tempChecklist.filter(c => !c.completado && !c.noAplica).length;
      if (pendingCount > 0) {
        alert(`Falta completar ${pendingCount} actividades.`);
        return;
      }
    }

    // Validar evidencias adjuntas (Regla 4)
    if (selectedOt.requiereEvidencia !== false && tempEvidenceList.length === 0) {
      alert('Falta adjuntar evidencia requerida.');
      return;
    }

    // Validar AST / Permiso firmado (Regla 4)
    if (selectedOt.requiereAST && !selectedOt.astFirmado) {
      alert('Falta firmar permiso de trabajo / análisis seguro (AST).');
      return;
    }

    // Validar que no esté bloqueada internamente (Regla 4)
    if (selectedOt.bloqueada) {
      alert('La orden de trabajo se encuentra bloqueada.');
      return;
    }

    const updatedOT: OT = {
      ...selectedOt,
      propuestaCierreTerreno: true,
      comentarioPropuestaCierre: comentarioCierre || 'Checklist finalizado sin novedades. Se solicita cierre de la OT en terreno.',
      estado: 'Lista para revisión',
      resultadoTerreno: 'Exitoso'
    };

    const index = ots.findIndex((o) => o.codigo === selectedOt.codigo);
    if (index !== -1) {
      const copy = [...ots];
      copy[index] = updatedOT;
      onUpdateOts(copy);
      setSelectedOt(null);
    }

    saveClosureRequestToDB(selectedOt.codigo, comentarioCierre || 'Checklist finalizado sin novedades.');
    logFieldExecution(selectedOt.codigo, 'ClosureProposal', `Cierre propuesto por el técnico: ${comentarioCierre || 'Checklist finalizado sin novedades'}`);

    onAddAuditLog(
      'Propuesta de Cierre',
      'Field Ops Mobile',
      selectedOt.codigo,
      selectedOt.plantaNombre,
      `Técnico solicita revisión final y cierre de la OT. Comentario: ${comentarioCierre || 'N/A'}. Estado: Lista para revisión.`,
      'Media'
    );

    triggerSuccess('¡Propuesta enviada con éxito! Queda en espera de la validación del Supervisor de Terreno.');
  };

  // 7. REGISTRAR BLOQUEO EN TERRENO
  const handleRegisterBlocker = () => {
    if (!selectedOt) return;
    if (!blockerComment.trim()) {
      alert('Debe justificar el motivo del bloqueo.');
      return;
    }

    const updatedOT: OT = {
      ...selectedOt,
      bloqueada: true,
      motivoBloqueo: `[${blockerType}] - ${blockerComment}`,
      estado: 'Bloqueada'
    };

    const index = ots.findIndex((o) => o.codigo === selectedOt.codigo);
    if (index !== -1) {
      const copy = [...ots];
      copy[index] = updatedOT;
      onUpdateOts(copy);
    }

    saveFieldBlockerToDB(selectedOt.codigo, blockerType, blockerComment);
    logFieldExecution(selectedOt.codigo, 'Blocker', `Bloqueo registrado: [${blockerType}] - ${blockerComment}`);

    // Generar escalación automática en el panel central de escalaciones
    const newEscalation: Escalation = {
      id: `ESC-FLD-${Date.now().toString().substring(7)}`,
      tipo: 'HSE',
      estado: 'En revisión',
      responsable: 'Alejandro Rojas',
      comentario: `Bloqueo desde Terreno (${blockerType}): ${blockerComment}`,
      otVinculada: selectedOt.codigo,
      plantaVinculada: selectedOt.plantaNombre,
      fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 16),
      criticidad: selectedOt.prioridad === 'Crítica' || selectedOt.prioridad === 'Alta' ? 'Alta' : 'Media',
      escaladoA: 'Jefe O&M'
    };

    onUpdateEscalaciones([newEscalation, ...escalaciones]);

    onAddAuditLog(
      'Bloqueo de Terreno Registrado',
      'Field Ops Mobile',
      selectedOt.codigo,
      selectedOt.plantaNombre,
      `Trabajos detenidos por: ${blockerType}. Justificación: ${blockerComment}. OT marcada como Bloqueada.`,
      'Alta'
    );

    setShowBlockerModal(false);
    setBlockerComment('');
    setSelectedOt(null);
    triggerSuccess('¡Bloqueo operativo registrado y escalado al Risk & Escalation Center!');
  };

  // 8. ACCIONES DE SUPERVISOR DE TERRENO
  const handleSupervisorApproveEvidence = (otCode: string, evidenceId: string) => {
    const ot = ots.find(o => o.codigo === otCode);
    if (!ot || !ot.evidencePack) return;

    const updatedPack = ot.evidencePack.map(ev => {
      if (ev.evidenceId === evidenceId) {
        return { ...ev, status: 'Completado' as const };
      }
      return ev;
    });

    const updatedOT: OT = {
      ...ot,
      evidencePack: updatedPack
    };

    const index = ots.findIndex((o) => o.codigo === otCode);
    if (index !== -1) {
      const copy = [...ots];
      copy[index] = updatedOT;
      onUpdateOts(copy);
    }

    onAddAuditLog(
      'Evidencia Validada',
      'Field Ops Supervisor',
      otCode,
      ot.plantaNombre,
      `Supervisor valida y aprueba ítem fotográfico de evidencia ${evidenceId}.`,
      'Baja'
    );

    triggerSuccess('Evidencia aprobada correctamente por Supervisor.');
  };

  const handleSupervisorRejectToExecution = (otCode: string, comments: string) => {
    const ot = ots.find(o => o.codigo === otCode);
    if (!ot) return;

    const updatedOT: OT = {
      ...ot,
      propuestaCierreTerreno: false,
      estado: 'En ejecución',
      observaciones: `[REBOTADO POR SUPERVISOR]: ${comments || 'Falta complementar datos o corregir checklist.'}`,
      lifecycleHistory: [
        ...(ot.lifecycleHistory || []),
        {
          estadoAnterior: ot.estado,
          estadoNuevo: 'En ejecución',
          fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          usuario: activeUserName,
          comentario: `Devuelto a ejecución por Supervisor. Motivo: ${comments}`
        }
      ]
    };

    const index = ots.findIndex((o) => o.codigo === otCode);
    if (index !== -1) {
      const copy = [...ots];
      copy[index] = updatedOT;
      onUpdateOts(copy);
    }

    onAddAuditLog(
      'OT Devuelta a Ejecución',
      'Field Ops Supervisor',
      otCode,
      ot.plantaNombre,
      `Supervisor devuelve OT a terreno. Comentario: ${comments || 'N/A'}.`,
      'Media'
    );

    triggerSuccess('OT rechazada y devuelta a ejecución en terreno.');
  };

  const handleSupervisorApproveFinalClosure = (otCode: string, comments: string) => {
    const ot = ots.find(o => o.codigo === otCode);
    if (!ot) return;

    const updatedOT: OT = {
      ...ot,
      propuestaCierreTerreno: false,
      estado: 'Cerrada',
      closeSummary: comments || 'Cierre final verificado y aprobado satisfactoriamente.',
      approvals: [
        ...(ot.approvals || []),
        {
          rol: 'SUPERVISOR_TERRENO',
          nombre: activeUserName,
          fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          comentario: comments || 'Todo conforme desde terreno.'
        }
      ],
      lifecycleHistory: [
        ...(ot.lifecycleHistory || []),
        {
          estadoAnterior: ot.estado,
          estadoNuevo: 'Cerrada',
          fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          usuario: activeUserName,
          comentario: 'Cierre definitivo aprobado por Supervisor de Terreno.'
        }
      ]
    };

    const index = ots.findIndex((o) => o.codigo === otCode);
    if (index !== -1) {
      const copy = [...ots];
      copy[index] = updatedOT;
      onUpdateOts(copy);
    }

    onAddAuditLog(
      'Cierre Técnico Aprobado',
      'Field Ops Supervisor',
      otCode,
      ot.plantaNombre,
      `Supervisor aprueba el cierre técnico formal de la OT ${otCode}.`,
      'Alta'
    );

    triggerSuccess('¡OT formalmente CERRADA en el sistema!');
  };

  const handleSupervisorEscalate = (otCode: string, motive: string) => {
    const ot = ots.find(o => o.codigo === otCode);
    if (!ot) return;

    const updatedOT: OT = {
      ...ot,
      escalada: true,
      motivoEscalamiento: motive || 'Supervisor escala control a Coordinador O&M.'
    };

    const index = ots.findIndex((o) => o.codigo === otCode);
    if (index !== -1) {
      const copy = [...ots];
      copy[index] = updatedOT;
      onUpdateOts(copy);
    }

    const newEscalation: Escalation = {
      id: `ESC-SUP-${Date.now().toString().substring(7)}`,
      tipo: 'Técnico',
      estado: 'Escalado',
      responsable: 'Rodolfo Garcés',
      comentario: `Escalamiento de Supervisor: ${motive || 'Se requiere revisión jerárquica.'}`,
      otVinculada: otCode,
      plantaVinculada: ot.plantaNombre,
      fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 16),
      criticidad: 'Alta',
      escaladoA: 'Jefe O&M'
    };

    onUpdateEscalaciones([newEscalation, ...escalaciones]);

    onAddAuditLog(
      'Escalamiento Jerárquico',
      'Field Ops Supervisor',
      otCode,
      ot.plantaNombre,
      `Supervisor escala formalmente el control de la OT al Coordinador O&M. Motivo: ${motive || 'N/A'}`,
      'Alta'
    );

    triggerSuccess('¡OT escalada formalmente al Coordinador O&M!');
  };

  // Helper de éxito
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  return (
    <div id="vista-terreno-container" className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      
      {/* CABECERA EXIGIDA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Smartphone className="h-4 w-4 animate-pulse" /> Mobile-First Field Application
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Vista Terreno — Ejecución Mobile First
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Ejecución de OT, checklist, evidencia, HH, AST y cierre técnico desde terreno.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono">Usuario:</span>
            <span className="text-white font-bold">{activeUserName}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono">Rol:</span>
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono px-2 py-0.5 rounded text-[10px]">
              {userRole}
            </span>
          </div>
        </div>
      </div>

      {/* NOTA REQUERIDA */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl text-xs text-indigo-300 leading-relaxed max-w-full">
        <strong>⚠️ Nota de Arquitectura:</strong> En una fase futura este flujo podrá integrarse con ORBI FieldOps / ORBI GEO NEXT para cámara, georreferencia y evidencia avanzada.
      </div>

      {/* DISEÑO EN DOS COLUMNAS: CELULAR SIMULADO Y PANEL DE CONTROL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA 1: SMARTPHONE SIMULADO (4 COLS) */}
        <div className="lg:col-span-5 xl:col-span-4 flex justify-center">
          <div className="relative w-full max-w-[360px] bg-slate-950 rounded-[48px] border-[12px] border-slate-900 shadow-2xl overflow-hidden flex flex-col min-h-[690px] border-double ring-1 ring-slate-800">
            
            {/* Notch / Cámara frontal */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 flex justify-center items-center z-40">
              <div className="w-24 h-4 bg-black rounded-b-2xl flex items-center justify-around px-4">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <div className="w-10 h-1 bg-slate-800 rounded-full"></div>
              </div>
            </div>

            {/* Pantalla del Celular */}
            <div className="flex-1 bg-slate-950 text-white flex flex-col pt-6 select-none">
              
              {/* Status Bar */}
              <div className="px-4 py-2 flex justify-between items-center text-[10px] font-mono text-slate-500 border-b border-slate-900 bg-slate-900/60 shrink-0">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>{new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="font-bold tracking-widest text-slate-400">ORBI GO</div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setIsOnline(!isOnline)} className="hover:opacity-80">
                    <span className={`h-2.5 w-2.5 rounded-full inline-block ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                  </button>
                  <span>{isOnline ? '4G' : 'OFFLINE'}</span>
                  <span>|</span>
                  <button onClick={() => setGpsLocked(!gpsLocked)} className="hover:opacity-80">
                    <MapPin className={`h-3 w-3 ${gpsLocked ? 'text-cyan-400' : 'text-rose-500'}`} />
                  </button>
                </div>
              </div>

              {/* Botones de Tab Interno para simular con un click */}
              {isSupervisorRole && (
                <div className="grid grid-cols-2 bg-slate-900/40 border-b border-slate-900 shrink-0">
                  <button
                    onClick={() => { setActiveTab('ejecucion'); setSelectedOt(null); }}
                    className={`py-2 text-[10px] font-mono font-bold tracking-wider uppercase border-b-2 transition-colors ${
                      activeTab === 'ejecucion'
                        ? 'border-emerald-500 text-emerald-400 bg-slate-900/20'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    ⚙️ Mi Ejecución
                  </button>
                  <button
                    onClick={() => { setActiveTab('supervisor'); setSelectedOt(null); }}
                    className={`py-2 text-[10px] font-mono font-bold tracking-wider uppercase border-b-2 transition-colors ${
                      activeTab === 'supervisor'
                        ? 'border-cyan-500 text-cyan-400 bg-slate-900/20'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    🛡️ Panel Supervisor
                  </button>
                </div>
              )}

              {/* Contenido Dinámico de la Pantalla */}
              <div className="flex-1 flex flex-col p-4 overflow-y-auto max-h-[510px]">
                
                {/* Alerta de Éxito Flotante */}
                {successMessage && (
                  <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-lg mb-3 text-[11px] font-mono flex items-start gap-1.5 animate-fade-in shrink-0">
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* --- A. MODO EJECUCIÓN (TÉCNICO / INGENIERO) --- */}
                {activeTab === 'ejecucion' && (
                  <>
                    {!selectedOt ? (
                      /* BANDEJA PRINCIPAL "MIS OT ASIGNADAS" */
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xs font-mono text-slate-500 uppercase">Bandeja de Terreno</h3>
                            <h2 className="text-sm font-bold text-white">Mis OT Asignadas</h2>
                          </div>
                          <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-800">
                            {filteredMyOts.length} activas
                          </span>
                        </div>

                        {/* Buscador Móvil */}
                        <div className="relative shrink-0">
                          <input
                            type="text"
                            placeholder="Buscar OT asignada..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                        </div>

                        {/* Filtros Rápidos Horizontal */}
                        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none shrink-0 select-none">
                          {[
                            { id: 'todos', label: 'Todos' },
                            { id: 'hoy', label: 'Hoy' },
                            { id: 'semana', label: 'Semana' },
                            { id: 'criticas', label: 'Críticas' },
                            { id: 'en_terreno', label: 'En terreno' },
                            { id: 'en_ejecucion', label: 'En ejec.' },
                            { id: 'bloqueadas', label: 'Bloqueadas' },
                            { id: 'listas_revision', label: 'Por Revisar' },
                            { id: 'evidencia_pendiente', label: 'Evid. Pend.' },
                            { id: 'ast_pendiente', label: 'AST Pend.' },
                          ].map(f => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setQuickFilter(f.id)}
                              className={`px-2 py-0.5 rounded-full text-[8px] font-mono whitespace-nowrap border transition-colors ${
                                quickFilter === f.id
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        {/* Listado de OTs asignadas */}
                        <div className="space-y-2.5">
                          {filteredMyOts.map((ot) => {
                            const done = ot.checklistExecution?.every(c => c.completado || c.noAplica);
                            const hasBlock = ot.bloqueada;
                            const plantaObj = plantas.find(p => p.id === ot.plantaId || p.name === ot.plantaNombre);
                            const zona = plantaObj ? plantaObj.zona : 'Centro';
                            const astStatus = ot.astFirmado ? 'Firmado' : (ot.requiereAST ? 'Pendiente' : 'N/A');
                            const evidenceStatus = (ot.evidencePack && ot.evidencePack.length > 0) ? 'Completa' : (ot.requiereEvidencia ? 'Pendiente' : 'N/A');
                            const hhStatus = ot.hhReales ? `${ot.hhReales} HH` : 'No reg.';

                            return (
                              <div
                                key={ot.codigo}
                                onClick={() => handleSelectOt(ot)}
                                className={`bg-slate-900 hover:bg-slate-850 border rounded-xl p-3 cursor-pointer transition-all group ${
                                  hasBlock ? 'border-red-500/30 bg-red-950/5' : 'border-slate-800'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <span className="text-[9px] font-mono text-slate-500 font-bold">{ot.codigo}</span>
                                  <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                    ot.prioridad === 'Crítica' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    ot.prioridad === 'Alta' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-slate-800 text-slate-400'
                                  }`}>
                                    {ot.prioridad}
                                  </span>
                                </div>

                                <h4 className="text-xs font-bold text-slate-200 mt-1 truncate">{ot.activo}</h4>
                                <p className="text-[9px] text-slate-400 truncate">{ot.plantaNombre} ({zona})</p>

                                {ot.estado === 'Devuelta a ejecución' && (
                                  <div className="mt-2 bg-rose-500/10 border border-rose-500/25 rounded-lg p-2 text-[9px] text-rose-300 font-mono">
                                    <div className="font-bold flex items-center gap-1 text-rose-400">
                                      <span>↩️ DEVUELTA A EJECUCIÓN</span>
                                    </div>
                                    {ot.motivoDevolucion && (
                                      <p className="mt-1"><span className="text-rose-400 font-semibold">Motivo:</span> {ot.motivoDevolucion}</p>
                                    )}
                                    {ot.comentarioDevolucion && (
                                      <p className="text-[8px] text-slate-400 mt-0.5"><span className="text-slate-500 font-semibold">Comentario:</span> {ot.comentarioDevolucion}</p>
                                    )}
                                    {ot.detallesFaltantes && (
                                      <p className="text-[8px] text-amber-300 mt-0.5"><span className="text-amber-400 font-semibold">Falta completar:</span> {ot.detallesFaltantes}</p>
                                    )}
                                  </div>
                                )}

                                {/* Grid de Atributos */}
                                <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] font-mono text-slate-400 border-t border-slate-950 pt-2">
                                  <div>
                                    <span className="text-slate-500">Tipo:</span> <span className="text-slate-300 font-semibold">{ot.tipo}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Estado:</span> <span className="text-slate-300 font-semibold">{ot.estado}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Fecha:</span> <span className="text-slate-300">{ot.fechaProgramada || ot.fechaInicio}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Inicio:</span> <span className="text-slate-300">{ot.horaInicioEstimada || '08:30'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Sup:</span> <span className="text-slate-300 truncate inline-block max-w-[50px]">{ot.supervisorTerreno || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Coord:</span> <span className="text-slate-300 truncate inline-block max-w-[50px]">{ot.coordinadorOM || 'N/A'}</span>
                                  </div>
                                </div>

                                {/* Status de ejecución */}
                                <div className="mt-2 flex flex-wrap gap-1 items-center pt-2 border-t border-slate-950 text-[8px] font-mono">
                                  <span className={`px-1 rounded ${ot.astFirmado ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    AST: {astStatus}
                                  </span>
                                  <span className={`px-1 rounded ${ot.evidencePack && ot.evidencePack.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    Evi: {evidenceStatus}
                                  </span>
                                  <span className={`px-1 rounded ${ot.hhReales ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                    HH: {hhStatus}
                                  </span>
                                  <span className="ml-auto text-emerald-400 font-bold">
                                    {ot.avance || 0}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {filteredMyOts.length === 0 && (
                            <div className="text-center py-10 text-[11px] text-slate-600 font-mono border border-dashed border-slate-900 rounded-xl">
                              No se encontraron tareas asignadas activas en terreno.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* FLUJO DE EJECUCIÓN PASO A PASO */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <button
                            onClick={() => setSelectedOt(null)}
                            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                          >
                            <ArrowLeft className="h-3 w-3" /> Bandeja
                          </button>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold">PASO {executionStep}/6</span>
                        </div>

                        {/* Ficha de OT abreviada */}
                        <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono text-slate-500">{selectedOt.codigo}</span>
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 rounded">{selectedOt.tipo}</span>
                          </div>
                          <h3 className="text-xs font-bold text-white truncate">{selectedOt.activo}</h3>
                          <p className="text-[9px] text-slate-400">{selectedOt.plantaNombre}</p>
                        </div>

                        {/* SELECTOR MOCK DE TIPO DE OT (MODO PRUEBA - REGLA 8) */}
                        <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-amber-400">
                            <span className="animate-pulse">🧪</span>
                            <span>SELECTOR MOCK DE COMPORTAMIENTO (REGLA 8)</span>
                          </div>
                          <select
                            value={mockOtType}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMockOtType(val);
                              handleApplyMockType(val);
                            }}
                            className="w-full bg-slate-950 border border-amber-500/20 text-[10px] font-mono text-amber-300 rounded px-2 py-1 outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="">-- Cambiar tipo para pruebas --</option>
                            <option value="simple">🟢 OT Simple (Sin AST/Checklist/Evidencia)</option>
                            <option value="preventivo">🔵 OT Preventivo Normal (Checklist + Evidencia)</option>
                            <option value="correctivo_repuesto">🔧 OT Correctivo con Repuestos (Insumos + Diagnóstico)</option>
                            <option value="critica_ast">⚠️ OT Crítica con AST (Firma requerida)</option>
                            <option value="loto_hse">🛡️ OT con LOTO / HSE (Permisos + Firmas + Validaciones)</option>
                          </select>
                        </div>

                        {selectedOt.estado === 'Devuelta a ejecución' && (
                          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-[10px] text-rose-300 font-mono space-y-1.5">
                            <div className="font-bold flex items-center gap-1 text-rose-400 text-xs">
                              <span>↩️ DETALLES DE LA DEVOLUCIÓN</span>
                            </div>
                            {selectedOt.motivoDevolucion && (
                              <p><span className="text-rose-400 font-semibold">Motivo:</span> {selectedOt.motivoDevolucion}</p>
                            )}
                            {selectedOt.comentarioDevolucion && (
                              <p className="text-[9px] text-slate-300"><span className="text-slate-400 font-semibold">Observación del Revisor:</span> "{selectedOt.comentarioDevolucion}"</p>
                            )}
                            {selectedOt.detallesFaltantes && (
                              <p className="text-[9px] text-amber-300"><span className="text-amber-400 font-semibold">Falta Completar:</span> {selectedOt.detallesFaltantes}</p>
                            )}
                            <div className="text-[8px] text-slate-500 italic mt-1 border-t border-rose-500/10 pt-1">
                              Complete los ítems pendientes y vuelva al Paso 6 para reenviar la OT a revisión.
                            </div>
                          </div>
                        )}

                        {/* Indicador de pasos horizontal */}
                        <div className="flex justify-between items-center px-1 text-[9px] font-mono text-slate-500">
                          {getVisibleSteps(selectedOt).map((num) => {
                            const stepLabels: Record<number, string> = {
                              1: 'Entrada',
                              2: 'AST',
                              3: 'Checklist',
                              4: 'Fotos',
                              5: 'Recursos',
                              6: 'Cierre'
                            };
                            return (
                              <button
                                key={num}
                                disabled={
                                  (num > 1 && !selectedOt.llegadaConfirmada) ||
                                  (num > 2 && !selectedOt.astFirmado && selectedOt.requiereAST)
                                }
                                onClick={() => setExecutionStep(num)}
                                className={`h-5 px-1.5 rounded-md flex items-center justify-center font-bold border text-[8px] tracking-tighter transition-colors ${
                                  executionStep === num ? 'bg-emerald-500 text-slate-950 border-emerald-400' :
                                  (num === 1 && selectedOt.llegadaConfirmada) || (num === 2 && selectedOt.astFirmado) ? 'bg-emerald-950 text-emerald-400 border-emerald-900' :
                                  'bg-slate-900 text-slate-600 border-slate-800'
                                }`}
                                title={stepLabels[num]}
                              >
                                {stepLabels[num]}
                              </button>
                            );
                          })}
                        </div>

                        {/* --- PASO 1: CONFIRMAR LLEGADA A PLANTA --- */}
                        {executionStep === 1 && (
                          <div className="space-y-3.5 animate-fade-in">
                            <div className="text-center space-y-1">
                              <MapPin className="h-8 w-8 text-cyan-400 mx-auto animate-bounce" />
                              <h4 className="text-xs font-bold text-slate-200">Paso 1: Check-in en Planta (Simulado)</h4>
                              <p className="text-[10px] text-slate-400">Verifique el estado de su terminal y registre la confirmación de llegada simulada.</p>
                            </div>

                            <div className="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-850">
                              <div>
                                <label className="text-[9px] font-mono text-slate-500 block uppercase">Hora de Entrada Terreno</label>
                                <input
                                  type="text"
                                  value={tempHoraLlegada}
                                  onChange={(e) => setTempHoraLlegada(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-mono text-slate-500 block uppercase">Observación de Arribo</label>
                                <textarea
                                  rows={2}
                                  value={tempObsLlegada}
                                  onChange={(e) => setTempObsLlegada(e.target.value)}
                                  placeholder="Detalle si hubo demoras en portería, clima, etc..."
                                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none resize-none mt-1"
                                ></textarea>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                                <span>Coordenadas de arribo simuladas asociadas con éxito.</span>
                              </div>
                              <p className="text-[8px] text-slate-500 font-mono leading-normal mt-1 border-t border-slate-850/50 pt-1.5">
                                Nota: La integración GPS real podrá conectarse en una fase futura con ORBI FieldOps / ORBI GEO NEXT.
                              </p>
                            </div>

                            <button
                              onClick={handleConfirmArrival}
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono rounded-lg flex items-center justify-center gap-1"
                            >
                              Confirmar Arribo <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {/* --- PASO 2: AST / SEGURIDAD --- */}
                        {executionStep === 2 && (
                          <div className="space-y-3.5 animate-fade-in">
                            <div className="text-center space-y-1">
                              <Shield className="h-8 w-8 text-rose-400 mx-auto" />
                              <h4 className="text-xs font-bold text-slate-200">Paso 2: AST - Análisis Seguro de Trabajo</h4>
                              <p className="text-[10px] text-slate-400">Garantice un entorno seguro antes de iniciar el trabajo técnico.</p>
                            </div>

                            <div className="space-y-3 bg-slate-900 p-3 rounded-xl border border-slate-850 text-xs">
                              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                                <span className="text-slate-400 font-mono text-[10px]">¿Requiere AST?</span>
                                <span className="text-emerald-400 font-bold font-mono">REQUERIDO</span>
                              </div>

                              {/* Firma de AST */}
                              <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tempASTFirmado}
                                  onChange={(e) => setTempASTFirmado(e.target.checked)}
                                  className="accent-emerald-500 h-4.5 w-4.5 bg-slate-950 border-slate-800 rounded mt-0.5"
                                />
                                <div>
                                  <span className="font-bold text-slate-200 block">Declarar AST Firmado</span>
                                  <span className="text-[9px] text-slate-400">Declaro bajo firma electrónica que he analizado los riesgos mecánicos y eléctricos en el sitio.</span>
                                </div>
                              </label>

                              {/* Riesgos Detectados */}
                              <div>
                                <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Riesgos Detectados Terreno</span>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {['Riesgo Eléctrico', 'Trabajo en Altura', 'Hotspots / Calor', 'Caída de Objeto'].map(r => {
                                    const active = tempRiesgos.includes(r);
                                    return (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => {
                                          if (active) setTempRiesgos(tempRiesgos.filter(x => x !== r));
                                          else setTempRiesgos([...tempRiesgos, r]);
                                        }}
                                        className={`p-1 text-[9px] font-mono border rounded text-left truncate transition-colors ${
                                          active ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'
                                        }`}
                                      >
                                        {active ? '● ' : '○ '} {r}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Permiso de trabajo */}
                              <div>
                                <label className="text-[9px] font-mono text-slate-500 block uppercase">Nº Permiso de Trabajo O&M</label>
                                <input
                                  type="text"
                                  placeholder="Ej: PT-9481-OM-CHILE"
                                  value={tempPermisoTrabajoNum}
                                  onChange={(e) => setTempPermisoTrabajoNum(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none font-mono"
                                />
                              </div>

                              {/* Firma Ejecutor */}
                              <div>
                                <label className="text-[9px] font-mono text-slate-500 block uppercase">Firma Digital del Ejecutor (Nombre)</label>
                                <input
                                  type="text"
                                  placeholder="Escriba su nombre completo"
                                  value={tempFirmaEjecutor}
                                  onChange={(e) => setTempFirmaEjecutor(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none"
                                />
                                {tempFirmaEjecutor && (
                                  <div className="mt-1.5 p-1 bg-white/5 border border-white/10 rounded text-center text-xs font-serif italic text-slate-300">
                                    {tempFirmaEjecutor}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={handleSaveSecurity}
                              className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs font-mono rounded-lg flex items-center justify-center gap-1 transition-colors"
                            >
                              Registrar Seguridad <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {/* --- PASO 3: CHECKLIST TÉCNICO --- */}
                        {executionStep === 3 && (
                          <div className="space-y-3.5 animate-fade-in">
                            <div className="text-center space-y-1">
                              <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
                              <h4 className="text-xs font-bold text-slate-200">Paso 3: Checklist Técnico</h4>
                              <p className="text-[10px] text-slate-400">Diligencie cada punto del checklist operacional.</p>
                            </div>

                            <div className="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-850 max-h-[260px] overflow-y-auto">
                              {tempChecklist.map((item, idx) => (
                                <div key={idx} className="bg-slate-950 p-2 rounded-lg border border-slate-850 space-y-1 text-[11px]">
                                  <div className="font-semibold text-slate-200 leading-tight">
                                    {item.item}
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-900 font-mono text-[9px]">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleChecklistField(idx, 'completado')}
                                      className={`py-0.5 rounded text-center ${
                                        item.completado ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold' : 'bg-slate-900 text-slate-500 border border-slate-850'
                                      }`}
                                    >
                                      {item.completado ? '✔ Hecho' : '○ Pendiente'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleChecklistField(idx, 'noAplica')}
                                      className={`py-0.5 rounded text-center ${
                                        item.noAplica ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold' : 'bg-slate-900 text-slate-500 border border-slate-850'
                                      }`}
                                    >
                                      {item.noAplica ? '○ N/A' : '○ Aplica'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleChecklistField(idx, 'hallazgo')}
                                      className={`py-0.5 rounded text-center ${
                                        item.hallazgo ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold' : 'bg-slate-900 text-slate-500 border border-slate-850'
                                      }`}
                                    >
                                      {item.hallazgo ? '⚠ Hallazgo' : '○ Sin Hallazgo'}
                                    </button>
                                  </div>

                                  <input
                                    type="text"
                                    placeholder="Observación del ítem..."
                                    value={item.observacion || ''}
                                    onChange={(e) => handleUpdateChecklistObs(idx, e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-850 rounded px-1.5 py-0.5 text-[10px] text-white outline-none mt-1"
                                  />
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={handleSaveChecklist}
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono rounded-lg flex items-center justify-center gap-1"
                            >
                              Guardar Checklist <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {/* --- PASO 4: EVIDENCE PACK --- */}
                        {executionStep === 4 && (
                          <div className="space-y-4 animate-fade-in">
                            <div className="text-center space-y-1">
                              <Camera className="h-8 w-8 text-indigo-400 mx-auto" />
                              <h4 className="text-xs font-bold text-slate-200">Paso 4: Evidence Pack</h4>
                              <p className="text-[10px] text-slate-400">Registre evidencias de terreno asociadas al activo.</p>
                            </div>

                            {/* FOTOS REQUERIDAS (REGLA 7) */}
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-2">
                              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block border-b border-slate-900 pb-1">FOTOS REQUERIDAS EN TERRENO:</span>
                              <div className="space-y-1.5 text-[10px] font-mono">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-300">📸 1. Foto Antes (LOTO / Seguridad):</span>
                                  {tempEvidenceList.some(e => e.type === 'before' || e.type === 'hse') ? (
                                    <span className="text-emerald-400 font-extrabold uppercase text-[9px] flex items-center gap-0.5">🟢 Cargada</span>
                                  ) : (
                                    <span className="text-slate-500 font-bold uppercase text-[9px]">⚪ Pendiente</span>
                                  )}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-300">📸 2. Foto Durante (Trabajo / Rejilla):</span>
                                  {tempEvidenceList.some(e => e.type === 'during' || e.type === 'spare') ? (
                                    <span className="text-emerald-400 font-extrabold uppercase text-[9px] flex items-center gap-0.5">🟢 Cargada</span>
                                  ) : (
                                    <span className="text-slate-500 font-bold uppercase text-[9px]">⚪ Pendiente</span>
                                  )}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-300">📸 3. Foto Después (Limpieza / Orden):</span>
                                  {tempEvidenceList.some(e => e.type === 'after') ? (
                                    <span className="text-emerald-400 font-extrabold uppercase text-[9px] flex items-center gap-0.5">🟢 Cargada</span>
                                  ) : (
                                    <span className="text-slate-500 font-bold uppercase text-[9px]">⚪ Pendiente</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* FOTOS CARGADAS (REGLA 7) */}
                            {tempEvidenceList.length > 0 && (
                              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850 space-y-1.5 text-[10px] max-h-[120px] overflow-y-auto font-mono">
                                <span className="text-[9px] text-slate-500 uppercase block font-bold">Fotos Cargadas Sincronizadas ({tempEvidenceList.length})</span>
                                {tempEvidenceList.map((ev) => (
                                  <div key={ev.evidenceId} className="flex justify-between items-center bg-slate-950 p-1.5 rounded border border-slate-900">
                                    <div className="truncate pr-2">
                                      <span className="text-[8px] bg-indigo-500/15 text-indigo-400 px-1 rounded uppercase font-bold mr-1">{ev.type}</span>
                                      <span className="text-slate-300 font-bold">{ev.label}</span>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteEvidence(ev.evidenceId)}
                                      className="text-slate-500 hover:text-rose-400 transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* FORMULARIO AGREGAR EVIDENCIA (REGLA 7) */}
                            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850 space-y-2 text-xs">
                              <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold block">Agregar Evidencia de Campo</span>
                              <div>
                                <select
                                  value={newEvidenceType}
                                  onChange={(e) => setNewEvidenceType(e.target.value as any)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-white outline-none font-mono"
                                >
                                  <option value="before">Antes de intervenir (HSE/LOTO)</option>
                                  <option value="during">Durante el trabajo (Limpieza)</option>
                                  <option value="after">Después de la reparación (Orden)</option>
                                  <option value="spare">Repuesto utilizado</option>
                                </select>
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="Etiqueta: Ej: Rejilla sucia INV-01"
                                  value={newEvidenceLabel}
                                  onChange={(e) => setNewEvidenceLabel(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-white outline-none"
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="Breve descripción de hallazgo..."
                                  value={newEvidenceDesc}
                                  onChange={(e) => setNewEvidenceDesc(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-white outline-none"
                                />
                              </div>

                              <button
                                onClick={handleUploadSimulatedPhoto}
                                disabled={simulatingPhoto}
                                className="w-full py-1.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-slate-950 font-mono text-[11px] font-bold rounded border border-indigo-500/20 flex items-center justify-center gap-1.5 transition-colors"
                              >
                                {simulatingPhoto ? (
                                  <>
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    Sincronizando foto...
                                  </>
                                ) : (
                                  <>
                                    <Camera className="h-3.5 w-3.5" />
                                    Agregar Evidencia (Capturar)
                                  </>
                                )}
                              </button>
                            </div>

                            {/* MENSAJE DE COMPLEMENTO DE ACTIVO */}
                            {activoCompletadoMsg && (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 animate-fade-in">
                                <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                                <span>{activoCompletadoMsg}</span>
                              </div>
                            )}

                            {/* BOTÓN MARCAR ACTIVO COMPLETO (REGLA 7) */}
                            <button
                              onClick={() => {
                                // Simular marcado de activo completo
                                const newId = `EV-TECH-${Date.now().toString().slice(-4)}`;
                                const completedEvidence: OTEvidencePackItem = {
                                  evidenceId: newId,
                                  otId: selectedOt.codigo,
                                  type: 'after',
                                  label: `Después - Limpieza ${selectedOt.activo.includes('INV-') ? selectedOt.activo.substring(selectedOt.activo.indexOf('INV-'), selectedOt.activo.indexOf('INV-') + 6) : 'Activo General'}`,
                                  description: 'Soplado, limpieza interna e inspección final de orden y aseo completados de forma conforme.',
                                  simulatedFileName: 'inv_tech_after_complete.jpg',
                                  uploadedBy: 'Víctor León',
                                  uploadedAt: '2026-07-06 17:30',
                                  status: 'Cargada'
                                };
                                setTempEvidenceList(prev => [...prev, completedEvidence]);
                                setActivoCompletadoMsg(`✓ El activo ${selectedOt.activo.includes('INV-') ? selectedOt.activo.substring(selectedOt.activo.indexOf('INV-'), selectedOt.activo.indexOf('INV-') + 6) : 'actual'} ha sido marcado como COMPLETADO en terreno.`);
                                setTimeout(() => setActivoCompletadoMsg(null), 5000);
                              }}
                              className="w-full py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/35 hover:to-teal-500/35 text-emerald-400 hover:text-white font-mono text-xs font-black rounded-xl border border-emerald-500/30 hover:border-emerald-500/50 flex items-center justify-center gap-1.5 transition-all shadow-md"
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Marcar activo completo
                            </button>

                            <button
                              onClick={() => setExecutionStep(5)}
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono rounded-lg flex items-center justify-center gap-1"
                            >
                              Siguiente Paso <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {/* --- PASO 5: HH, DIAGNÓSTICO, REPUESTOS --- */}
                        {executionStep === 5 && (
                          <div className="space-y-3.5 animate-fade-in">
                            <div className="text-center space-y-1">
                              <Package className="h-8 w-8 text-amber-400 mx-auto" />
                              <h4 className="text-xs font-bold text-slate-200">Paso 5: Recursos y Diagnóstico</h4>
                              <p className="text-[10px] text-slate-400">Declare HH estimadas de terreno, insumos utilizados y diagnóstico final.</p>
                            </div>

                            <div className="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-850 max-h-[260px] overflow-y-auto text-xs">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] font-mono text-slate-500 block uppercase">HH Trabajadas hoy</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={tempHhReales}
                                    onChange={(e) => setTempHhReales(Math.max(1, parseInt(e.target.value) || 0))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none font-mono"
                                  />
                                </div>
                                <div className="text-[9px] font-mono text-slate-400 flex items-end pb-1 leading-tight">
                                  *Estimadas originales: {selectedOt.hhEstimadas || 2} HH
                                </div>
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-slate-500 block uppercase">Diagnóstico Final</label>
                                <textarea
                                  rows={2}
                                  value={tempDiagnosticoFinal}
                                  onChange={(e) => setTempDiagnosticoFinal(e.target.value)}
                                  placeholder="Detalle técnico de la falla encontrada en campo..."
                                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white outline-none resize-none mt-0.5"
                                ></textarea>
                              </div>

                              <div>
                                <label className="text-[9px] font-mono text-slate-500 block uppercase">Acción Correctiva Realizada</label>
                                <textarea
                                  rows={2}
                                  value={tempAccionRealizada}
                                  onChange={(e) => setTempAccionRealizada(e.target.value)}
                                  placeholder="Detalle técnico de la intervención..."
                                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white outline-none resize-none mt-0.5"
                                ></textarea>
                              </div>

                              {/* Sección de Repuestos Utilizados */}
                              <div className="border-t border-slate-800 pt-2 space-y-1">
                                <span className="text-[9px] font-mono text-slate-500 uppercase block">Repuestos Consumidos en Turno</span>
                                {tempSparesUsed.length > 0 && (
                                  <div className="space-y-1">
                                    {tempSparesUsed.map(s => (
                                      <div key={s.codigo} className="flex justify-between items-center bg-slate-950 p-1 rounded text-[10px] font-mono border border-slate-900">
                                        <span className="truncate">{s.nombre} ({s.codigo}) x{s.cantidad}</span>
                                        <button
                                          onClick={() => handleRemoveRepuestoTerreno(s.codigo, s.cantidad)}
                                          className="text-slate-500 hover:text-rose-400 font-bold font-mono px-1"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="flex gap-1.5 items-center mt-1">
                                  <select
                                    value={selectedRepuestoId}
                                    onChange={(e) => setSelectedRepuestoId(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-white outline-none"
                                  >
                                    <option value="">-- Seleccionar repuesto --</option>
                                    {loadInventory()
                                      .filter(item => item.plantaNombre === selectedOt.plantaNombre)
                                      .map(item => (
                                        <option key={item.codigo} value={item.codigo}>
                                          {item.codigo} - {item.descripcion} (Disp: {item.stockActual})
                                        </option>
                                      ))
                                    }
                                  </select>
                                  <input
                                    type="number"
                                    min="1"
                                    value={repuestoCantidad}
                                    onChange={(e) => setRepuestoCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-10 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-white text-center font-mono"
                                  />
                                  <button
                                    onClick={handleAddRepuestoTerreno}
                                    className="p-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={handleSaveHHAndDiagnosis}
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono rounded-lg flex items-center justify-center gap-1"
                            >
                              Guardar Recursos <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {/* --- PASO 6: CIERRE DE OT O BLOQUEO DE CAMPO --- */}
                        {executionStep === 6 && (
                          <div className="space-y-4 animate-fade-in text-xs">
                            <div className="text-center space-y-1">
                              <Zap className="h-8 w-8 text-emerald-400 mx-auto animate-pulse" />
                              <h4 className="text-xs font-bold text-slate-200">Paso 6: Finalización y Envío</h4>
                              <p className="text-[10px] text-slate-400">Seleccione si propondrá el cierre técnico o registrará un bloqueo de terreno.</p>
                            </div>

                            {/* Alerta de validaciones de cumplimiento (Regla 2) */}
                            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850 space-y-1.5 text-[10px] font-mono">
                              <span className="text-slate-500 uppercase block text-[9px]">Validaciones de Compliance</span>
                              
                              {selectedOt.requiereChecklist !== false && (
                                <div className="flex items-center gap-1.5">
                                  {tempChecklist.every(c => c.completado || c.noAplica) ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <X className="h-3.5 w-3.5 text-rose-500" />
                                  )}
                                  <span className={tempChecklist.every(c => c.completado || c.noAplica) ? 'text-slate-300' : 'text-rose-400'}>
                                    Checklist 100% visado
                                  </span>
                                </div>
                              )}

                              {selectedOt.requiereEvidencia !== false && (
                                <div className="flex items-center gap-1.5">
                                  {tempEvidenceList.length > 0 ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <X className="h-3.5 w-3.5 text-rose-500" />
                                  )}
                                  <span className={tempEvidenceList.length > 0 ? 'text-slate-300' : 'text-rose-400'}>
                                    Mínimo 1 evidencia fotográfica
                                  </span>
                                </div>
                              )}

                              {selectedOt.requiereAST && (
                                <div className="flex items-center gap-1.5">
                                  {selectedOt.astFirmado ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <X className="h-3.5 w-3.5 text-rose-500" />
                                  )}
                                  <span className={selectedOt.astFirmado ? 'text-slate-300' : 'text-rose-400'}>
                                    AST Visado y firmado en terreno
                                  </span>
                                </div>
                              )}

                              {selectedOt.requierePermisoTrabajo && (
                                <div className="flex items-center gap-1.5">
                                  {tempPermisoTrabajoNum && tempPermisoTrabajoNum.trim() ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <X className="h-3.5 w-3.5 text-rose-500" />
                                  )}
                                  <span className={(tempPermisoTrabajoNum && tempPermisoTrabajoNum.trim()) ? 'text-slate-300' : 'text-rose-400'}>
                                    Permiso de trabajo registrado
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Acciones de entrega */}
                            <div className="space-y-2.5">
                              {/* Opción 1: Proponer Cierre */}
                              <div className="bg-emerald-950/25 border border-emerald-500/20 p-2.5 rounded-xl space-y-2">
                                <h5 className="font-bold text-emerald-400 font-mono text-[10px] uppercase">
                                  {selectedOt.estado === 'Devuelta a ejecución' ? 'Opción A: Reenviar a Revisión de Cierre' : 'Opción A: Proponer Cierre Técnico'}
                                </h5>
                                <input
                                  type="text"
                                  placeholder={selectedOt.estado === 'Devuelta a ejecución' ? 'Comentarios sobre corrección realizada...' : 'Comentario para supervisor...'}
                                  value={comentarioCierre}
                                  onChange={(e) => setComentarioCierre(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-white outline-none"
                                />
                                <button
                                  onClick={handleProposeClosure}
                                  className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold font-mono rounded"
                                >
                                  {selectedOt.estado === 'Devuelta a ejecución' ? '🔄 Reenviar a Revisión de Cierre' : '🚀 Solicitar Cierre de OT'}
                                </button>
                              </div>

                              {/* Opción 2: Registrar Bloqueo */}
                              <div className="bg-rose-950/25 border border-rose-500/20 p-2.5 rounded-xl space-y-1">
                                <h5 className="font-bold text-rose-400 font-mono text-[10px] uppercase">Opción B: Reportar Bloqueo de Campo</h5>
                                <p className="text-[9px] text-slate-400">Detenga la ejecución si se presenta alguna condición o carencia insuperable.</p>
                                <button
                                  type="button"
                                  onClick={() => setShowBlockerModal(true)}
                                  className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold font-mono rounded border border-rose-500/30"
                                >
                                  ⚠️ Registrar Bloqueo Activo
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* --- B. PANEL SUPERVISOR TERRENO --- */}
                {activeTab === 'supervisor' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div>
                        <h3 className="text-xs font-mono text-slate-500 uppercase">Supervisor de Turno</h3>
                        <h2 className="text-sm font-bold text-slate-100">Panel de Control Terreno</h2>
                      </div>
                      <Shield className="h-4 w-4 text-cyan-400 animate-pulse" />
                    </div>

                    {/* Buscador de Supervisor */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar OT o supervisor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                    </div>

                    {/* Resumen rápido para Supervisor */}
                    <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                      <div className="bg-amber-500/10 border border-amber-500/20 p-1.5 rounded-lg">
                        <span className="text-amber-400 font-bold block text-sm">{closureProposalOts.length}</span>
                        <span className="text-slate-500 text-[8px] uppercase">Por revisar</span>
                      </div>
                      <div className="bg-rose-500/10 border border-rose-500/20 p-1.5 rounded-lg">
                        <span className="text-rose-400 font-bold block text-sm">{blockedOts.length}</span>
                        <span className="text-slate-500 text-[8px] uppercase">Bloqueos</span>
                      </div>
                    </div>

                    {/* Lista de propuestas de cierre para el Supervisor */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Propuestas de Cierre</h4>
                      {closureProposalOts.map((ot) => (
                        <div key={ot.codigo} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono text-slate-500">{ot.codigo}</span>
                            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1.5 rounded">Pendiente</span>
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-200 truncate">{ot.activo}</h5>
                            <p className="text-[10px] text-slate-400">{ot.plantaNombre}</p>
                          </div>

                          <div className="bg-slate-950 p-2 rounded text-[10px] font-mono border border-slate-900 text-slate-300">
                            <strong>Obs Técnico:</strong> {ot.comentarioPropuestaCierre || 'N/A'}
                          </div>

                          {/* Acciones del Supervisor en la OT */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-950 font-mono text-[9px]">
                            <button
                              onClick={() => {
                                const comm = prompt('Ingrese observaciones técnicas para devolver a ejecución:');
                                if (comm !== null) handleSupervisorRejectToExecution(ot.codigo, comm);
                              }}
                              className="py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded border border-rose-500/30 font-bold"
                            >
                              ✕ Devolver
                            </button>
                            <button
                              onClick={() => {
                                const comm = prompt('Ingrese comentarios finales de cierre técnico:');
                                if (comm !== null) handleSupervisorApproveFinalClosure(ot.codigo, comm);
                              }}
                              className="py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded border border-emerald-500/30 font-bold"
                            >
                              ✔ Aprobar Cierre
                            </button>
                          </div>
                        </div>
                      ))}

                      {closureProposalOts.length === 0 && (
                        <div className="text-center py-6 text-[10px] text-slate-600 font-mono border border-dashed border-slate-900 rounded-xl">
                          No hay propuestas de cierre técnico pendientes de revisión.
                        </div>
                      )}
                    </div>

                    {/* Lista de bloqueos activos */}
                    <div className="space-y-2.5 pt-2">
                      <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Bloqueos de Sitio</h4>
                      {blockedOts.map((ot) => (
                        <div key={ot.codigo} className="bg-slate-900 border border-red-500/20 rounded-xl p-3 space-y-1.5 text-xs bg-red-950/5">
                          <div className="flex justify-between items-center text-[9px] font-mono">
                            <span className="text-slate-500">{ot.codigo}</span>
                            <span className="text-red-400 font-bold">BLOQUEADA</span>
                          </div>
                          <h5 className="font-bold text-slate-200 truncate">{ot.activo}</h5>
                          <p className="text-[10px] text-red-300 font-mono italic leading-tight">
                            Motivo: {ot.motivoBloqueo}
                          </p>
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                const mot = prompt('Ingrese el detalle del escalamiento formal:');
                                if (mot) handleSupervisorEscalate(ot.codigo, mot);
                              }}
                              className="w-full py-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-mono text-[9px] rounded border border-red-500/30"
                            >
                              🛡️ Escalar a Coordinador O&M
                            </button>
                          </div>
                        </div>
                      ))}
                      {blockedOts.length === 0 && (
                        <div className="text-center py-6 text-[10px] text-slate-600 font-mono border border-dashed border-slate-900 rounded-xl">
                          No hay bloqueos activos reportados desde terreno.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Home / Touch Bar inferior del Celular */}
              <div className="py-2.5 flex justify-center items-center bg-slate-900/20 border-t border-slate-900 shrink-0">
                <button
                  onClick={() => setSelectedOt(null)}
                  className="h-10 w-10 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center hover:border-emerald-500/30 transition-all shadow"
                >
                  <div className="h-3 w-3 bg-slate-800 rounded"></div>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* COLUMNA 2: DETALLES, AUDITORÍA DE CAMPO Y PANEL DE COMPLIANCE (8 COLS) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* Bento-grid de simulación del Dispositivo e Integridad de Datos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Panel de Configuración del Dispositivo */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold">
                <Smartphone className="h-5 w-5 text-indigo-400" />
                <h3>Simulador de Enlace Terrestre</h3>
              </div>
              <p className="text-xs text-slate-400">
                Configure las condiciones simuladas del terminal del operario en terreno para comprobar la resiliencia offline de ORBI.
              </p>

              <div className="space-y-3 font-mono text-xs">
                {/* Conectividad de Red */}
                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-850">
                  <span>Enlace de Datos Movil</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setIsOnline(true)}
                      className={`px-3 py-1 rounded text-[10px] font-bold ${
                        isOnline ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      ONLINE (4G)
                    </button>
                    <button
                      onClick={() => setIsOnline(false)}
                      className={`px-3 py-1 rounded text-[10px] font-bold ${
                        !isOnline ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      OFFLINE
                    </button>
                  </div>
                </div>

                {/* GPS */}
                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-850">
                  <span>Antena GPS Diferencial</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setGpsLocked(true)}
                      className={`px-3 py-1 rounded text-[10px] font-bold ${
                        gpsLocked ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      LOCK COMPLETO
                    </button>
                    <button
                      onClick={() => setGpsLocked(false)}
                      className={`px-3 py-1 rounded text-[10px] font-bold ${
                        !gpsLocked ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      SIN SEÑAL
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de Estadísticas del O&M Field Ops */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold">
                <Activity className="h-5 w-5 text-emerald-400" />
                <h3>Estadísticas de Sitio (O&M Field Ops)</h3>
              </div>
              <p className="text-xs text-slate-400">
                Resumen de actividades operativas recolectadas a nivel nacional en las plantas fotovoltaicas chilenas.
              </p>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Porcentaje Checklist</span>
                  <span className="text-2xl font-bold text-white font-mono">
                    {Math.round(ots.reduce((acc, curr) => acc + (curr.avance || 0), 0) / ots.length)}%
                  </span>
                  <span className="text-[9px] text-emerald-400 block mt-1">Avance consolidado</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Con Evidencias</span>
                  <span className="text-2xl font-bold text-indigo-400 font-mono">
                    {ots.filter(o => o.evidencePack && o.evidencePack.length > 0).length}
                  </span>
                  <span className="text-[9px] text-indigo-300 block mt-1">Órdenes auditadas</span>
                </div>
              </div>
            </div>

          </div>

          {/* Registro en Tiempo Real de Actividades desde Terreno (Live feed) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-white font-bold">
                <FileText className="h-5 w-5 text-indigo-400" />
                <h3>Live Feed: Auditoría de Campo</h3>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <p className="text-xs text-slate-400">
              A continuación se listan las transacciones enviadas por los terminales móviles en terreno a la base central inmutable de ORBI.
            </p>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-[11px] leading-relaxed space-y-3 max-h-[220px] overflow-y-auto">
              {ots.map((ot) => {
                const logs: any[] = [];
                if (ot.llegadaConfirmada) {
                  logs.push({
                    fecha: ot.fechaInicio + ' ' + (ot.horaLlegadaSimulada || '09:12'),
                    tag: 'CHECK-IN',
                    desc: `Arribo del técnico ${ot.responsable} a planta ${ot.plantaNombre}. Obs: ${ot.observacionLlegada || 'Ninguna'}`
                  });
                }
                if (ot.astFirmado) {
                  logs.push({
                    fecha: ot.fechaInicio + ' ' + (ot.horaLlegadaSimulada || '09:15'),
                    tag: 'AST-LOTO',
                    desc: `Análisis Seguro de Trabajo y LOTO visados bajo firma electrónica: ${ot.firmaEjecutorSimulada}`
                  });
                }
                if (ot.propuestaCierreTerreno) {
                  logs.push({
                    fecha: ot.fechaInicio + ' 16:15',
                    tag: 'PROPUESTA-CIERRE',
                    desc: `Técnico solicita revisión técnica formal de la OT ${ot.codigo}. Avance checklist 100%.`
                  });
                }
                if (ot.estado === 'Cerrada' && ot.closeSummary) {
                  logs.push({
                    fecha: ot.fechaInicio + ' 17:00',
                    tag: 'CIERRE-FINAL',
                    desc: `Supervisor aprueba el cierre técnico formal. Resumen: ${ot.closeSummary}`
                  });
                }
                if (ot.bloqueada) {
                  logs.push({
                    fecha: ot.fechaInicio + ' 11:22',
                    tag: 'BLOQUEO',
                    desc: `Trabajos detenidos en OT ${ot.codigo}. Motivo: ${ot.motivoBloqueo}`
                  });
                }

                return logs;
              }).flat().sort((a,b) => b.fecha.localeCompare(a.fecha)).map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start border-b border-slate-900 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-slate-500 shrink-0">{log.fecha}</span>
                  <span className={`px-1.5 py-0.2 rounded shrink-0 font-bold text-[9px] uppercase ${
                    log.tag === 'BLOQUEO' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                    log.tag === 'CHECK-IN' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' :
                    log.tag === 'AST-LOTO' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' :
                    log.tag === 'PROPUESTA-CIERRE' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  }`}>
                    {log.tag}
                  </span>
                  <span className="text-slate-300">{log.desc}</span>
                </div>
              ))}

              {ots.filter(o => o.llegadaConfirmada).length === 0 && (
                <div className="text-slate-600 text-center py-4">
                  No se registran transacciones recientes de terreno.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* --- MODAL DE BLOQUEO DE CAMPO --- */}
      {showBlockerModal && selectedOt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertOctagon className="h-5 w-5" />
                <h3>Registrar Bloqueo de Sitio</h3>
              </div>
              <button
                onClick={() => setShowBlockerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Declare la causa de suspensión del trabajo. Esto cambiará el estado de la OT a <strong>Bloqueada</strong> y generará una alerta en el panel de escalamiento.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Tipo de Bloqueo</label>
                <select
                  value={blockerType}
                  onChange={(e) => setBlockerType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none mt-1"
                >
                  <option value="Falta de repuesto">Falta de repuesto crítico</option>
                  <option value="Falta de herramienta">Falta de herramienta / instrumento</option>
                  <option value="Condición insegura">Condición insegura (HSE)</option>
                  <option value="Clima adverso">Condición climática severa</option>
                  <option value="Sin permiso de trabajo">Falta autorización / permiso</option>
                  <option value="Acceso bloqueado">Acceso denegado a planta</option>
                  <option value="Equipo no disponible">Activo indisponible por producción</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Justificación Técnica</label>
                <textarea
                  rows={3}
                  placeholder="Justifique el motivo detalladamente..."
                  value={blockerComment}
                  onChange={(e) => setBlockerComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none resize-none mt-1"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end font-mono text-xs pt-2">
              <button
                onClick={() => setShowBlockerModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-750"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterBlocker}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg font-bold hover:bg-rose-600"
              >
                Suspender y Escalar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
