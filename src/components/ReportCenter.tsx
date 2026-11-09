/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  User,
  AlertTriangle,
  Camera,
  FolderSync,
  X,
  Check,
  Search,
  Filter,
  ArrowLeftRight,
  Send,
  FileCheck,
  RefreshCw,
  Eye,
  Shield,
  Briefcase,
  Layers,
  ArrowDownToLine,
  ExternalLink
} from 'lucide-react';
import { OT, Planta, OTEstado, OTEvidencia, OTEvidencePackItem } from '../types';

interface ReportCenterProps {
  ots: OT[];
  plantas: Planta[];
  userRole: string;
  activeUserName: string;
  onUpdateOts: (updatedOts: OT[]) => void;
  onAddAuditLog: (
    accion: string,
    modulo: string,
    otCode?: string,
    plantaName?: string,
    comentario?: string,
    criticidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  ) => void;
}

type TrayType =
  | 'field-complete'
  | 'in-review'
  | 'returned'
  | 'ready-close'
  | 'closed'
  | 'pending-sharepoint'
  | 'observations';

export default function ReportCenter({
  ots = [],
  plantas = [],
  userRole,
  activeUserName,
  onUpdateOts,
  onAddAuditLog
}: ReportCenterProps) {
  // Active Tray (Bandeja)
  const [activeTray, setActiveTray] = useState<TrayType>('field-complete');
  
  // Searching and Filtering
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPlanta, setSelectedPlanta] = useState<string>('Todas');
  
  // Selected OT for Preview
  const [selectedOtCode, setSelectedOtCode] = useState<string | null>(null);
  
  // Devolution Modal State
  const [devolvingOt, setDevolvingOt] = useState<OT | null>(null);
  const [motivoDevolucion, setMotivoDevolucion] = useState<string>('Evidencia insuficiente');
  const [comentarioDevolucion, setComentarioDevolucion] = useState<string>('');
  const [detallesFaltantes, setDetallesFaltantes] = useState<string>('');

  // Local notification banner state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Ensure that reference cases exist in local storage for testing purposes
  useEffect(() => {
    const hasCantillanaPM = ots.some(o => o.codigo === '26-29221' || o.codigo === 'OT-26-29221');
    const hasCantillanaCorr = ots.some(o => o.codigo === 'OT-26-29222' || o.codigo === '26-29222');
    
    let updatedList = [...ots];
    let mutated = false;

    // 1. If 26-29221 is not fully set, let's make sure it's in a good testable state for Módulo 8
    if (hasCantillanaPM) {
      const idx = updatedList.findIndex(o => o.codigo === '26-29221' || o.codigo === 'OT-26-29221');
      if (idx !== -1 && updatedList[idx].estado === 'En ejecución') {
        // Promote it to a state that is testable for closure (e.g. finalizada / in review)
        // so that the supervisor can demonstrate closing it
        // and fill essential fields
        updatedList[idx] = {
          ...updatedList[idx],
          estado: 'Finalizada', // Promoted to Field Work Complete tray
          propuestaCierreTerreno: true,
          diagnosticoFinalTerreno: 'Inspección anual de inversores INV-01 a INV-39 completada satisfactoriamente. Se realizó limpieza física integral de gabinetes y soplado.',
          accionRealizadaTerreno: 'Ajuste de bornes con torquímetro, reemplazo de 12 filtros de aire en el parque Sungrow, y pruebas térmicas finales.',
          resultadoTerreno: 'Exitoso',
          hhReales: 38,
          astFirmado: true,
          sharepointStatus: updatedList[idx].sharepointStatus || 'Pendiente de preparar'
        };
        mutated = true;
      }
    }

    // 2. Ensure Corrective Case OT-26-29222 exists
    if (!hasCantillanaCorr) {
      const newCorrOt: OT = {
        codigo: 'OT-26-29222',
        plantaId: 'P10',
        plantaNombre: 'Cantillana',
        activo: 'Inversor Central C2 (Sungrow)',
        tipo: 'Correctiva',
        prioridad: 'Alta',
        criticidad: 'Alta',
        responsable: 'Víctor León',
        coordinador: 'Rodolfo Garcés',
        supervisor: 'Mauricio Valdés',
        fechaInicio: '2026-07-07',
        fechaLimite: '2026-07-17',
        estado: 'Finalizada', // Promoted to Field Work Complete tray
        avance: 100,
        hhEstimadas: 12,
        hhReales: 10,
        observaciones: 'Reemplazo de tarjeta de control averiada por falla en el inversor central C2 de la Planta Cantillana.',
        diagnosticoInicial: 'Alarma de fallo crítico de comunicación interna. Inversor offline. Código Sungrow E-12.',
        diagnosticoFinalTerreno: 'Tarjeta de control quemada por sobretemperatura severa. No admite reparación.',
        accionRealizadaTerreno: 'Reemplazo físico de tarjeta de control Sungrow, cableado de bus RS-485 y calibración con firmware v2.4.',
        resultadoTerreno: 'Exitoso',
        repuestosRequeridos: ['Tarjeta de control C2'],
        repuestos: ['Tarjeta de control C2'],
        requiereChecklist: true,
        checklistExecution: [
          { item: 'Confirmar desenergización segura y bloqueo LOTO', completado: true },
          { item: 'Desmontar tarjeta de control quemada', completado: true },
          { item: 'Montar repuesto de tarjeta de control nueva', completado: true },
          { item: 'Prueba funcional de arranque y comunicación', completado: true }
        ],
        requiereEvidencia: true,
        evidencePack: [
          {
            evidenceId: 'EV-COR-01',
            otId: 'OT-26-29222',
            type: 'before',
            label: 'Antes - Tarjeta Inoperativa',
            description: 'Componente quemado visible cerca de bornes de alimentación.',
            simulatedFileName: 'sungrow_burnt_c2.jpg',
            uploadedBy: 'Víctor León',
            uploadedAt: '2026-07-07 10:15',
            status: 'Aprobada'
          },
          {
            evidenceId: 'EV-COR-02',
            otId: 'OT-26-29222',
            type: 'after',
            label: 'Después - Reemplazo Exitoso',
            description: 'Nueva tarjeta Sungrow C2 montada y comunicando.',
            simulatedFileName: 'sungrow_new_c2.jpg',
            uploadedBy: 'Víctor León',
            uploadedAt: '2026-07-07 11:30',
            status: 'Aprobada'
          }
        ],
        astFirmado: true,
        requiereAST: true,
        origen: 'Centro de Control',
        impacto: 'Alto',
        riesgoDisponibilidad: 'Riesgo alto',
        sharepointStatus: 'Pendiente de preparar'
      };
      updatedList.push(newCorrOt);
      mutated = true;
    }

    if (mutated) {
      onUpdateOts(updatedList);
    }
  }, []);

  // Filter OTs into their respective Trays (Bandejas)
  const getOtsInTray = (tray: TrayType): OT[] => {
    return ots.filter(ot => {
      // Apply Search filter
      const matchesSearch =
        ot.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ot.activo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ot.plantaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ot.responsable && ot.responsable.toLowerCase().includes(searchTerm.toLowerCase()));

      // Apply Planta filter
      const matchesPlanta = selectedPlanta === 'Todas' || ot.plantaNombre === selectedPlanta;

      if (!matchesSearch || !matchesPlanta) return false;

      // Classify by Tray rules
      switch (tray) {
        case 'field-complete':
          // Field work complete: OT has completed status from terrain but not closed/archived yet.
          return (
            (ot.estado === 'Finalizada' || ot.estado === 'Lista para revisión' || ot.propuestaCierreTerreno) &&
            ot.estado !== 'Cerrada' &&
            ot.estado !== 'Devuelta a ejecución' &&
            !ot.estado.startsWith('En revisión')
          );
        case 'in-review':
          // Currently in administrative/supervisor review
          return (
            ot.estado.startsWith('En revisión') ||
            ot.estado === 'Pendiente aprobación Jefe O&M'
          );
        case 'returned':
          // Returned to technicians for corrections
          return ot.estado === 'Devuelta a ejecución';
        case 'ready-close':
          // All documentary requirements are approved and complete, ready for formal closing approval
          const hasEvidence = !ot.requiereEvidencia || (ot.evidencePack && ot.evidencePack.every(e => e.status === 'Aprobada' || e.status === 'Completado')) || ot.evidencia;
          const hasChecklist = !ot.requiereChecklist || (ot.checklistExecution && ot.checklistExecution.every(c => c.completado || c.noAplica));
          const hasDiagnostic = !!(ot.diagnosticoFinalTerreno || ot.accionRealizadaTerreno);
          const isApprovedHse = !ot.requiereValidacionHSE || ot.validacionHSE === 'Aprobado';
          const isApprovedCalidad = !ot.requiereValidacionCalidad || ot.validacionCalidad === 'Aprobado';
          
          return (
            (ot.estado === 'Finalizada' || ot.estado === 'Lista para revisión' || ot.estado.startsWith('En revisión') || ot.estado === 'Pendiente aprobación Jefe O&M') &&
            hasEvidence &&
            hasChecklist &&
            hasDiagnostic &&
            isApprovedHse &&
            isApprovedCalidad &&
            ot.estado !== 'Cerrada'
          );
        case 'closed':
          // Formally closed OTs
          return ot.estado === 'Cerrada';
        case 'pending-sharepoint':
          // Closed or finished OTs whose SharePoint folder backup is pending
          return (
            (ot.estado === 'Cerrada' || ot.estado === 'Finalizada') &&
            ot.sharepointStatus !== 'Respaldado'
          );
        case 'observations':
          // Blocked or has active rejection comments
          return ot.estado === 'Bloqueada' || !!ot.motivoDevolucion || !!ot.comentarioDevolucion;
        default:
          return false;
      }
    });
  };

  // Helper to compute Documentary Semaphores for each OT
  const getDocumentaryStatus = (ot: OT) => {
    // 1. Checklist
    let checklist = { status: 'gray' as 'green' | 'amber' | 'gray', label: 'N/A' };
    if (ot.requiereChecklist) {
      const total = ot.checklistExecution?.length || 0;
      const completed = ot.checklistExecution?.filter(c => c.completado || c.noAplica).length || 0;
      if (total > 0 && completed === total) {
        checklist = { status: 'green', label: 'Completo' };
      } else {
        checklist = { status: 'amber', label: `${completed}/${total}` };
      }
    }

    // 2. Evidences
    let evidences = { status: 'gray' as 'green' | 'amber' | 'red' | 'gray', label: 'N/A' };
    if (ot.requiereEvidencia) {
      const pack = ot.evidencePack || [];
      if (pack.length > 0) {
        const approved = pack.every(e => e.status === 'Aprobada' || e.status === 'Completado');
        const rejected = pack.some(e => e.status === 'Rechazada');
        if (approved) {
          evidences = { status: 'green', label: 'Aprobadas' };
        } else if (rejected) {
          evidences = { status: 'red', label: 'Rechazadas' };
        } else {
          evidences = { status: 'amber', label: 'En Revisión' };
        }
      } else if (ot.evidencia) {
        evidences = { status: 'green', label: 'Registrada' };
      } else {
        evidences = { status: 'amber', label: 'Pendiente' };
      }
    }

    // 3. PTW / Permisos
    let ptwStatus = { status: 'gray' as 'green' | 'amber' | 'gray', label: 'N/A' };
    if (ot.requierePermisoTrabajo) {
      if (ot.permisoTrabajoNumero || ot.astFirmado) {
        ptwStatus = { status: 'green', label: 'Aprobado' };
      } else {
        ptwStatus = { status: 'amber', label: 'Pendiente' };
      }
    }

    // 4. Inventario / Repuestos
    let inventory = { status: 'gray' as 'green' | 'amber' | 'gray', label: 'N/A' };
    if (ot.repuestosRequeridos && ot.repuestosRequeridos.length > 0) {
      if (ot.repuestos && ot.repuestos.length > 0) {
        inventory = { status: 'green', label: 'Descontado' };
      } else {
        inventory = { status: 'amber', label: 'Pendiente' };
      }
    }

    // 5. SharePoint Archiving
    let sharepoint = { status: 'amber' as 'green' | 'amber' | 'gray', label: 'Pendiente' };
    if (ot.sharepointStatus === 'Respaldado') {
      sharepoint = { status: 'green', label: 'Archivado' };
    } else if (ot.sharepointStatus === 'Paquete preparado') {
      sharepoint = { status: 'green', label: 'Preparado' };
    }

    // 6. Technical Diagnosis
    let diagnosis = { status: 'amber' as 'green' | 'amber' | 'gray', label: 'Pendiente' };
    if (ot.diagnosticoFinalTerreno || ot.accionRealizadaTerreno) {
      diagnosis = { status: 'green', label: 'Completo' };
    }

    return { checklist, evidences, ptwStatus, inventory, sharepoint, diagnosis };
  };

  // Generate Report Pack Simulation
  const handleGenerateReportPack = (ot: OT) => {
    const updated = ots.map(o => {
      if (o.codigo === ot.codigo) {
        return {
          ...o,
          sharepointStatus: 'Paquete preparado' as const,
          sharepointPath: `01 - Reportes OT/Planta_${o.plantaNombre}_${o.codigo}_${new Date().toISOString().substring(0, 7)}.pdf`,
          sharepointDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
          sharepointUser: activeUserName,
          sharepointFiles: [
            `${o.codigo}_INFORME_TECNICO.pdf`,
            `${o.codigo}_CHECKLIST_FIRMANTE.pdf`,
            `${o.codigo}_REPORT_FOTOGRAFICO.pdf`
          ]
        };
      }
      return o;
    });

    onUpdateOts(updated);
    onAddAuditLog(
      'Generar Report Pack',
      'Report Center',
      ot.codigo,
      ot.plantaNombre,
      `Se consolidó el dossier documental y se generó el Report Pack para la OT ${ot.codigo}.`,
      'Media'
    );

    setNotification({
      type: 'success',
      message: `Report Pack generado con éxito para ${ot.codigo}. Archivos estructurados para SharePoint.`
    });
  };

  // Enviar a Cierre Workflow
  const handleSendToClose = (ot: OT) => {
    // Document validation checks
    const docs = getDocumentaryStatus(ot);
    
    // Check if mandatory parts are pending
    if (ot.requiereChecklist && docs.checklist.status === 'amber') {
      setNotification({
        type: 'error',
        message: 'No se puede enviar a cierre: El checklist técnico de campo no está completado.'
      });
      return;
    }

    if (ot.requiereEvidencia && docs.evidences.status === 'amber') {
      setNotification({
        type: 'error',
        message: 'No se puede enviar a cierre: Las evidencias fotográficas no han sido aprobadas.'
      });
      return;
    }

    if (docs.diagnosis.status === 'amber') {
      setNotification({
        type: 'error',
        message: 'No se puede enviar a cierre: Falta registrar el diagnóstico y actividades finales.'
      });
      return;
    }

    const updated = ots.map(o => {
      if (o.codigo === ot.codigo) {
        return {
          ...o,
          estado: 'Cerrada' as OTEstado, // Transition to Closed state directly
          fechaCierre: new Date().toISOString().split('T')[0],
          jefeOM: activeUserName,
          estadoCierre: 'Cerrado Total',
          sharepointStatus: o.sharepointStatus === 'Paquete preparado' ? 'Respaldado' as const : o.sharepointStatus
        };
      }
      return o;
    });

    onUpdateOts(updated);
    onAddAuditLog(
      'Aprobación Cierre Documental',
      'Report Center',
      ot.codigo,
      ot.plantaNombre,
      `Aprobación formal del Report Pack y cierre definitivo de la OT ${ot.codigo} por ${activeUserName}.`,
      'Alta'
    );

    setNotification({
      type: 'success',
      message: `¡OT ${ot.codigo} cerrada oficialmente! Estado actualizado a Cerrada.`
    });
  };

  // Devolver a Terreno workflow
  const openDevolutionModal = (ot: OT) => {
    setDevolvingOt(ot);
    setMotivoDevolucion('Evidencia insuficiente');
    setComentarioDevolucion('');
    setDetallesFaltantes('');
  };

  const handleDevolveConfirm = () => {
    if (!devolvingOt) return;

    const updated = ots.map(o => {
      if (o.codigo === devolvingOt.codigo) {
        return {
          ...o,
          estado: 'Devuelta a ejecución' as OTEstado, // Re-opens for technician in terrain
          avance: 70, // roll-back progress
          motivoDevolucion: motivoDevolucion,
          comentarioDevolucion: comentarioDevolucion || 'Requiere correcciones en terreno.',
          detallesFaltantes: detallesFaltantes || 'Por favor revisar el reporte adjunto para subsanar observaciones.',
          // Also flag evidence pack elements that were rejected as review requested
          evidencePack: o.evidencePack?.map(ev => 
            ev.status === 'Requiere revisión' || ev.status === 'Rechazada' ? { ...ev, status: 'Requiere revisión' as const } : ev
          )
        };
      }
      return o;
    });

    onUpdateOts(updated);
    onAddAuditLog(
      'Devolución a Terreno',
      'Report Center',
      devolvingOt.codigo,
      devolvingOt.plantaNombre,
      `OT ${devolvingOt.codigo} devuelta a terreno por el supervisor. Motivo: ${motivoDevolucion}.`,
      'Alta'
    );

    setNotification({
      type: 'success',
      message: `Orden de trabajo ${devolvingOt.codigo} devuelta a terreno para correcciones.`
    });

    setDevolvingOt(null);
  };

  // Get selected OT object
  const activeOt = ots.find(o => o.codigo === selectedOtCode);

  // Simple list of plants for the dropdown
  const uniquePlantNames = Array.from(new Set((plantas || []).map(p => p.name)));

  // Count helper for trays
  const getTrayCount = (tray: TrayType): number => {
    return getOtsInTray(tray).length;
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. SECTION BANNER HEADER */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest font-black">
              MÓDULO 8
            </span>
            <span className="text-xs font-mono text-slate-500">Cierre Operativo y Report Packs</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-emerald-400" /> Report Center &amp; Cierre Documental
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Valida los checklists de campo, evidencias y PTW cargados por los técnicos. Genera el dossier final (Report Pack) y archívalo directamente en SharePoint de manera automatizada.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-900">
          <Shield className="h-4 w-4 text-emerald-400" />
          <div>
            <div className="font-bold text-slate-200">ROL DE CONTROL: SUPERVISOR</div>
            <div className="text-[10px] text-slate-500">Aprobación, Auditoría e Integridad O&amp;M</div>
          </div>
        </div>
      </div>

      {/* Local floating notification */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-xs font-mono">{notification.message}</p>
        </div>
      )}

      {/* 2. TRAY NAVIGATOR (BANDEJAS OPERATIVAS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { id: 'field-complete', label: 'Field Complete', color: 'border-sky-500/20 text-sky-400 bg-sky-500/5' },
          { id: 'in-review', label: 'En Revisión', color: 'border-purple-500/20 text-purple-400 bg-purple-500/5' },
          { id: 'ready-close', label: 'Listas p/Cerrar', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' },
          { id: 'closed', label: 'Cerradas', color: 'border-slate-800 text-slate-400 bg-slate-900/40' },
          { id: 'returned', label: 'Devueltas', color: 'border-rose-500/20 text-rose-400 bg-rose-500/5' },
          { id: 'pending-sharepoint', label: 'Pend. SharePoint', color: 'border-amber-500/20 text-amber-400 bg-amber-500/5' },
          { id: 'observations', label: 'Observadas / Bloq.', color: 'border-amber-500/20 text-amber-500 bg-amber-500/5' }
        ].map((tray) => {
          const count = getTrayCount(tray.id as TrayType);
          const isActive = activeTray === tray.id;
          return (
            <button
              key={tray.id}
              onClick={() => {
                setActiveTray(tray.id as TrayType);
                setSelectedOtCode(null);
              }}
              className={`flex flex-col justify-between items-start p-3 rounded-xl border text-left transition-all relative ${
                isActive
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5 scale-102 font-bold'
                  : 'bg-slate-900/40 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[10px] font-mono tracking-wider block mb-2">{tray.label}</span>
              <div className="flex justify-between items-center w-full">
                <span className="text-xl font-black font-mono">{count}</span>
                {count > 0 && !isActive && (
                  <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded-full border ${tray.color}`}>
                    Pnd
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. SEARCH & MAIN WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: TRAYS AND OTS TABLE (7 columns) */}
        <div className="xl:col-span-7 space-y-4">
          
          {/* SEARCH BAR & FILTERS */}
          <div className="bg-slate-900/40 border border-slate-850 p-3.5 rounded-xl flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por código, parque, técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-emerald-500/50 outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg min-w-[160px]">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={selectedPlanta}
                onChange={(e) => setSelectedPlanta(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
              >
                <option value="Todas" className="bg-slate-950 text-white">Todos los Parques</option>
                {uniquePlantNames.map(p => (
                  <option key={p} value={p} className="bg-slate-950 text-white">{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLE / LIST OF OTS */}
          <div className="bg-slate-900/20 border border-slate-850 rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-950/40 border-b border-slate-850 flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide">
                Órdenes de Trabajo en bandeja — {activeTray.toUpperCase()}
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Mostrando {getOtsInTray(activeTray).length} ítems
              </span>
            </div>

            <div className="divide-y divide-slate-850/60 max-h-[580px] overflow-y-auto">
              {getOtsInTray(activeTray).map((ot) => {
                const isSelected = selectedOtCode === ot.codigo;
                const statusInfo = getDocumentaryStatus(ot);
                
                return (
                  <div
                    key={ot.codigo}
                    className={`p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-slate-900/60 cursor-pointer ${
                      isSelected ? 'bg-emerald-500/5 border-l-2 border-emerald-500' : ''
                    }`}
                    onClick={() => setSelectedOtCode(ot.codigo)}
                  >
                    {/* OT Core Info */}
                    <div className="space-y-1 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                          {ot.codigo}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">
                          {ot.tipo}
                        </span>
                        <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded ${
                          ot.prioridad === 'Crítica' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'bg-slate-950 text-slate-400'
                        }`}>
                          {ot.prioridad}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200">{ot.activo}</h4>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{ot.plantaNombre} &bull; {ot.responsable}</p>
                    </div>

                    {/* Documentary Semaphore Grid */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Semáforo Documental:</span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[8px] font-mono">
                        
                        {/* Checklist Indicator */}
                        <div className="flex flex-col items-center p-1 rounded bg-slate-950/60 border border-slate-900 min-w-[54px]">
                          <span className="text-[7px] text-slate-500 uppercase">Checklist</span>
                          <span className={`mt-0.5 font-bold ${
                            statusInfo.checklist.status === 'green' ? 'text-emerald-400' : statusInfo.checklist.status === 'amber' ? 'text-amber-400' : 'text-slate-600'
                          }`}>
                            {statusInfo.checklist.label}
                          </span>
                        </div>

                        {/* Evidence Indicator */}
                        <div className="flex flex-col items-center p-1 rounded bg-slate-950/60 border border-slate-900 min-w-[54px]">
                          <span className="text-[7px] text-slate-500 uppercase">Evidencia</span>
                          <span className={`mt-0.5 font-bold ${
                            statusInfo.evidences.status === 'green' ? 'text-emerald-400' : statusInfo.evidences.status === 'red' ? 'text-rose-400 animate-pulse' : statusInfo.evidences.status === 'amber' ? 'text-amber-400' : 'text-slate-600'
                          }`}>
                            {statusInfo.evidences.label}
                          </span>
                        </div>

                        {/* PTW Indicator */}
                        <div className="flex flex-col items-center p-1 rounded bg-slate-950/60 border border-slate-900 min-w-[54px]">
                          <span className="text-[7px] text-slate-500 uppercase">PTW</span>
                          <span className={`mt-0.5 font-bold ${
                            statusInfo.ptwStatus.status === 'green' ? 'text-emerald-400' : statusInfo.ptwStatus.status === 'amber' ? 'text-amber-400' : 'text-slate-600'
                          }`}>
                            {statusInfo.ptwStatus.label}
                          </span>
                        </div>

                        {/* Inventory Indicator */}
                        <div className="flex flex-col items-center p-1 rounded bg-slate-950/60 border border-slate-900 min-w-[54px]">
                          <span className="text-[7px] text-slate-500 uppercase">Repuesto</span>
                          <span className={`mt-0.5 font-bold ${
                            statusInfo.inventory.status === 'green' ? 'text-emerald-400' : statusInfo.inventory.status === 'amber' ? 'text-amber-400' : 'text-slate-600'
                          }`}>
                            {statusInfo.inventory.label}
                          </span>
                        </div>

                        {/* Technical Diagnosis Indicator */}
                        <div className="flex flex-col items-center p-1 rounded bg-slate-950/60 border border-slate-900 min-w-[54px]">
                          <span className="text-[7px] text-slate-500 uppercase">Diagnóst.</span>
                          <span className={`mt-0.5 font-bold ${
                            statusInfo.diagnosis.status === 'green' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {statusInfo.diagnosis.label}
                          </span>
                        </div>

                        {/* SharePoint Sync Indicator */}
                        <div className="flex flex-col items-center p-1 rounded bg-slate-950/60 border border-slate-900 min-w-[54px]">
                          <span className="text-[7px] text-slate-500 uppercase">SPoint</span>
                          <span className={`mt-0.5 font-bold ${
                            statusInfo.sharepoint.status === 'green' ? 'text-teal-400' : 'text-amber-400'
                          }`}>
                            {statusInfo.sharepoint.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Button Actions */}
                    <div className="flex items-center gap-1.5 self-end md:self-auto">
                      <button
                        title="Ver Preview del Reporte"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOtCode(ot.codigo);
                        }}
                        className="p-1.5 bg-slate-950 hover:bg-slate-900 rounded-lg border border-slate-850 text-slate-400 hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {getOtsInTray(activeTray).length === 0 && (
                <div className="p-12 text-center text-slate-500 font-mono text-xs italic">
                  No hay órdenes de trabajo registradas en esta bandeja.
                </div>
              )}
            </div>
          </div>

          {/* DOCUMENTATION INFO CARD */}
          <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-mono font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FolderSync className="h-4 w-4 text-emerald-400" /> Cierre Documental Automatizado
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              El Report Center unifica el dossier técnico exigido por auditoría. Al oprimir <strong>"Generar Report Pack"</strong>, ORBI indexa los PDF técnicos, checklists y fotos, renombrando los archivos según la nomenclatura reglamentaria e insertándolos en la carpeta correcta del SharePoint virtual.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW PANEL (A4 Style Report) (5 columns) */}
        <div className="xl:col-span-5 space-y-4">
          {activeOt ? (
            <div className="space-y-4">
              
              {/* BUTTONS BAR ABOVE THE REPORT CARD */}
              <div className="bg-slate-900/40 border border-slate-850 p-3.5 rounded-xl space-y-3.5">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block uppercase tracking-wider">
                  Acciones del Supervisor sobre {activeOt.codigo}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleGenerateReportPack(activeOt)}
                    className="py-2.5 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-slate-950 font-black text-xs font-mono border border-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FolderSync className="h-3.5 w-3.5" /> Generar Report Pack
                  </button>

                  <button
                    onClick={() => handleSendToClose(activeOt)}
                    disabled={activeOt.estado === 'Cerrada'}
                    className="py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Enviar a Cierre
                  </button>
                </div>

                <div className="border-t border-slate-850/60 pt-3 flex justify-between items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 leading-tight">
                    ¿La documentación técnica tiene errores o faltan fotos?
                  </span>
                  
                  <button
                    onClick={() => openDevolutionModal(activeOt)}
                    disabled={activeOt.estado === 'Cerrada' || activeOt.estado === 'Devuelta a ejecución'}
                    className="py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 font-black text-[10px] font-mono border border-rose-500/20 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Devolver a Terreno
                  </button>
                </div>
              </div>

              {/* DRAFT PREVIEW HEADER */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-emerald-400" /> Preview del Reporte O&amp;M (A4)
                </span>
                <span className="bg-slate-950 text-slate-500 text-[9px] font-mono px-2 py-0.5 rounded border border-slate-900">
                  Estado Doc: <span className="text-emerald-400 font-bold">{activeOt.sharepointStatus || 'Pendiente'}</span>
                </span>
              </div>

              {/* A4 REPORT CONTAINER */}
              <div className="bg-white text-slate-900 p-6 rounded-xl border-2 border-slate-800 font-sans shadow-2xl relative overflow-hidden text-[11px] leading-relaxed max-h-[750px] overflow-y-auto">
                
                {/* A4 Page Decorative Background Watermark */}
                <div className="absolute top-10 right-10 text-[70px] font-black text-slate-100 font-mono tracking-tighter select-none pointer-events-none uppercase">
                  ORBI O&amp;M
                </div>

                {/* Report Header */}
                <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-600 block">ORBI ENERGY COMMAND</span>
                    <h1 className="text-sm font-black text-slate-950 tracking-tight uppercase">Informe de Entrega y Cierre Técnico</h1>
                    <span className="text-[10px] font-mono text-slate-500">Mantenimiento de Parques Fotovoltaicos</span>
                  </div>
                  <div className="text-right font-mono text-[9px]">
                    <p className="font-bold text-slate-900">DOC-ID: {activeOt.codigo}</p>
                    <p className="text-slate-500">Fecha Emisión: {new Date().toISOString().split('T')[0]}</p>
                    <p className="text-slate-500">Sincronización: LocalState</p>
                  </div>
                </div>

                {/* Section 1: OT Metadata */}
                <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 border-b border-slate-200 pb-3 relative z-10 bg-slate-50 p-2.5 rounded-lg">
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">Orden de Trabajo</span>
                    <strong className="text-slate-900 text-xs font-mono">{activeOt.codigo}</strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">Parque Solar (PMGD)</span>
                    <strong className="text-slate-900 text-xs">{activeOt.plantaNombre}</strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">Activo Afectado</span>
                    <strong className="text-emerald-700 text-xs font-mono">{activeOt.activo}</strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">Tipo de Servicio</span>
                    <strong className="text-slate-900 text-xs">{activeOt.tipo}</strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">Técnico Ejecutor</span>
                    <strong className="text-slate-900">{activeOt.responsable}</strong>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">Supervisor Terreno</span>
                    <strong className="text-slate-900">{activeOt.supervisor || 'Mauricio Valdés'}</strong>
                  </div>
                </div>

                {/* Section 2: Technical Summary and Diagnosis */}
                <div className="mt-4 space-y-3 border-b border-slate-200 pb-4">
                  <h3 className="text-[10px] font-mono font-bold text-slate-950 uppercase border-b border-slate-800 pb-1 flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-emerald-600" /> Diagnóstico y Actividades Realizadas
                  </h3>
                  
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">Diagnóstico Inicial de Entrada:</span>
                    <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 italic">
                      "{activeOt.diagnosticoInicial || activeOt.observaciones || 'No se cargó diagnóstico inicial.'}"
                    </p>
                  </div>

                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">Diagnóstico Final de Terreno:</span>
                    <p className="text-slate-900 bg-slate-50 p-2 rounded border border-slate-100 font-semibold font-mono">
                      {activeOt.diagnosticoFinalTerreno || 'No se ha cargado diagnóstico final en terreno.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">Trabajos y Acciones Correctivas de Campo:</span>
                    <p className="text-slate-800 leading-relaxed">
                      {activeOt.accionRealizadaTerreno || 'No se han registrado trabajos de campo aún.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">Resultado de Operaciones:</span>
                      <strong className="text-slate-950 font-mono text-xs block uppercase">
                        {activeOt.resultadoTerreno || 'Exitoso'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase block font-bold">Horas Hombre Totales:</span>
                      <strong className="text-slate-950 font-mono block">
                        {activeOt.hhReales} de {activeOt.hhEstimadas} HH Estimadas
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Section 3: Technical Checklist */}
                {activeOt.checklistExecution && activeOt.checklistExecution.length > 0 && (
                  <div className="mt-4 space-y-1.5 border-b border-slate-200 pb-4">
                    <h3 className="text-[10px] font-mono font-bold text-slate-950 uppercase border-b border-slate-800 pb-1 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-emerald-600" /> Checklist Técnico de Campo
                    </h3>
                    <div className="grid grid-cols-1 gap-1">
                      {(activeOt.checklistExecution || []).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 px-1.5 hover:bg-slate-50 rounded">
                          <span className="text-slate-800 font-mono text-[10px]">{idx+1}. {item.item}</span>
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.2 rounded-full ${
                            item.completado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.completado ? 'COMPLETO' : 'PENDIENTE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 4: Spares / Materials Consumed */}
                <div className="mt-4 space-y-1.5 border-b border-slate-200 pb-4">
                  <h3 className="text-[10px] font-mono font-bold text-slate-950 uppercase border-b border-slate-800 pb-1 flex items-center gap-1">
                    <Layers className="h-3 w-3 text-emerald-600" /> Repuestos y Materiales Consumidos
                  </h3>
                  {activeOt.repuestos && activeOt.repuestos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-1">
                      {activeOt.repuestos.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-1.5 rounded font-mono text-[10px] text-slate-800">
                          <span>{item}</span>
                          <span className="text-emerald-700 font-bold font-sans">1 Unidad &bull; Stock Sincronizado</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No se registraron consumos de repuestos para esta orden de trabajo.</p>
                  )}
                </div>

                {/* Section 5: Evidence Pack Images */}
                <div className="mt-4 space-y-2 border-b border-slate-200 pb-4">
                  <h3 className="text-[10px] font-mono font-bold text-slate-950 uppercase border-b border-slate-800 pb-1 flex items-center gap-1">
                    <Camera className="h-3 w-3 text-emerald-600" /> Dossier Fotográfico (Evidencia Registrada)
                  </h3>

                  {activeOt.evidencePack && activeOt.evidencePack.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {activeOt.evidencePack.map((ev) => (
                        <div key={ev.evidenceId} className="bg-slate-50 border border-slate-200 p-2 rounded-lg font-mono text-[9px] flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-slate-950 block truncate max-w-[130px]">{ev.label}</span>
                            <span className="bg-slate-200 text-slate-800 px-1 py-0.2 rounded-full font-bold uppercase text-[7px]">
                              {ev.type}
                            </span>
                          </div>
                          
                          {/* Visual mock image placeholder */}
                          <div className="bg-slate-200 h-20 w-full rounded my-1.5 flex items-center justify-center border border-slate-300 text-slate-500 font-sans italic text-[10px] tracking-wide relative overflow-hidden">
                            <div className="absolute top-1 left-1 bg-slate-950/60 text-white font-mono text-[7px] px-1 py-0.2 rounded">
                              Referencia
                            </div>
                            <span>[Imagen de {ev.type}]</span>
                          </div>

                          <p className="text-slate-600 line-clamp-1 italic">"{ev.description}"</p>
                          <span className="text-[8px] text-slate-400 block mt-1">Cargado: {ev.uploadedBy} &bull; {ev.uploadedAt}</span>
                        </div>
                      ))}
                    </div>
                  ) : activeOt.evidencia ? (
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg font-mono text-[9px] flex flex-col justify-between max-w-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-950 block">{activeOt.evidencia.nombreArchivo}</span>
                        <span className="bg-emerald-100 text-emerald-800 px-1 rounded">Evidencia</span>
                      </div>
                      <div className="bg-slate-200 h-24 w-full rounded my-1.5 flex items-center justify-center border border-slate-300 text-slate-500 font-sans italic text-[10px]">
                        <span>[Imagen de Evidencia]</span>
                      </div>
                      <p className="text-slate-600 italic">"{activeOt.evidencia.descripcion}"</p>
                      <span className="text-[8px] text-slate-400 block mt-1">Fecha Carga: {activeOt.evidencia.fecha}</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No hay evidencias cargadas para esta orden de trabajo.</p>
                  )}
                </div>

                {/* Section 6: Signatures and Approvals */}
                <div className="mt-4 pt-2">
                  <div className="grid grid-cols-2 gap-4 text-center text-[9px] font-mono">
                    <div className="border-t border-slate-300 pt-3">
                      <strong className="text-slate-950 block text-xs italic">Firma Digital Registrada</strong>
                      <span className="text-slate-500 block uppercase font-bold text-[8px] mt-0.5">Operador Técnico de Terreno</span>
                      <span className="text-slate-900 block font-bold font-sans">{activeOt.responsable}</span>
                      <span className="text-slate-400 block text-[7px]">ID: OP-{(activeOt.responsable || 'LEON').substring(0,3).toUpperCase()}-942</span>
                    </div>

                    <div className="border-t border-slate-300 pt-3">
                      {activeOt.estado === 'Cerrada' ? (
                        <>
                          <strong className="text-slate-950 block text-xs italic">Firma de Cierre Digital</strong>
                          <span className="text-emerald-700 block uppercase font-bold text-[8px] mt-0.5">Supervisor Autorizado</span>
                          <span className="text-slate-900 block font-bold font-sans">{activeOt.jefeOM || activeUserName}</span>
                          <span className="text-slate-400 block text-[7px]">Sello de Seguridad ORBI SECURE</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <span className="border border-dashed border-slate-300 px-3 py-1.5 rounded bg-slate-50 text-[8px] uppercase font-bold tracking-wider">
                            Firma Pendiente
                          </span>
                          <span className="text-[8px] text-slate-400 mt-1 block">Requiere "Enviar a Cierre"</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer and Security Stamp */}
                <div className="mt-6 border-t border-slate-300 pt-3 text-[8px] font-mono text-slate-400 flex justify-between items-center">
                  <span>ORBI OT Center v0.X - Todos los derechos reservados.</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    Certificado SHA-256 Sincronizado
                  </span>
                </div>

              </div>

              {/* Extra Document Details (SharePoint Folder Path) */}
              <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block">
                  📁 Ruta SharePoint Sincronizada (Virtual):
                </span>
                <p className="text-xs text-slate-300 font-mono bg-slate-950 p-2.5 rounded border border-slate-900 break-all leading-normal">
                  {activeOt.sharepointPath || `01 - Reportes OT/Planta_${activeOt.plantaNombre}_${activeOt.codigo}_PENDIENTE.pdf`}
                </p>
                {activeOt.sharepointFiles && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Archivos indexados en el Report Pack:</span>
                    <ul className="text-[10px] font-mono text-emerald-400 list-disc list-inside pl-1 space-y-0.5">
                      {activeOt.sharepointFiles.map((file, i) => (
                        <li key={i}>{file}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500 font-mono text-xs italic">
              Seleccione una orden de trabajo de la bandeja de la izquierda para ver su previsualización en formato A4 y realizar acciones de cierre documental.
            </div>
          )}
        </div>

      </div>

      {/* 4. DEVOLUTION TO TERRAIN MODAL/OVERLAY */}
      {devolvingOt && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up font-mono text-xs text-slate-300">
            
            {/* Modal Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-850 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-wider font-bold">
                  Devolver a Ejecución
                </span>
                <h3 className="text-sm font-black text-white mt-1">
                  Rechazo de Reporte Documental de {devolvingOt.codigo}
                </h3>
              </div>
              <button
                onClick={() => setDevolvingOt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 hover:bg-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-bold">1. Motivo Principal del Rechazo:</label>
                <select
                  value={motivoDevolucion}
                  onChange={(e) => setMotivoDevolucion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                >
                  <option value="Evidencia insuficiente">Evidencia fotográfica insuficiente o borrosa</option>
                  <option value="Checklist incompleto">Checklist técnico de campo incompleto</option>
                  <option value="Falta de torque / pruebas">Falta registrar valores de torque o mediciones I-V</option>
                  <option value="Observación HSE abierta">Existe una observación de seguridad HSE pendiente</option>
                  <option value="Error de repuestos">Error en la declaración de repuestos consumidos</option>
                  <option value="Falta firma AST">Falta firma digital de Análisis de Seguridad en el Trabajo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-bold">2. Comentarios y Justificación del Supervisor:</label>
                <textarea
                  rows={3}
                  placeholder="Escriba comentarios claros para el técnico en terreno sobre qué debe corregir..."
                  value={comentarioDevolucion}
                  onChange={(e) => setComentarioDevolucion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-bold">3. Elementos Faltantes Específicos:</label>
                <input
                  type="text"
                  placeholder="Ej: Foto 'Después' de filtros limpios en Inversor INV-02"
                  value={detallesFaltantes}
                  onChange={(e) => setDetallesFaltantes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Informative warning */}
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-start gap-2 text-[11px] text-rose-400">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 animate-pulse" />
                <p>
                  <strong>ATENCIÓN:</strong> Al confirmar, la OT cambiará de estado a <strong>"Devuelta a ejecución"</strong>. El técnico Víctor León verá instantáneamente las correcciones indicadas en su sección de Pendientes en "Mi Agenda Técnica".
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-850 flex gap-3">
              <button
                onClick={() => setDevolvingOt(null)}
                className="flex-1 py-2 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 text-xs font-mono transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleDevolveConfirm}
                className="flex-1 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-slate-950 font-black text-xs font-mono transition-all flex items-center justify-center gap-1 shadow-lg shadow-rose-500/10"
              >
                <Send className="h-4 w-4" /> Devolver a Terreno
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
