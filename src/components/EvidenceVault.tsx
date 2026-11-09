import React, { useState } from 'react';
import {
  Camera,
  Folder,
  User,
  Check,
  X,
  Eye,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Layers,
  FileText,
  ChevronRight,
  HelpCircle,
  HardDrive,
  Download,
  CheckCircle2,
  ShieldCheck,
  Share2,
  Info,
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Lock,
  Search,
  Filter,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Upload
} from 'lucide-react';
import { OT, Planta, OTEvidencePackItem } from '../types';

interface ExternalEvidenceItem {
  id: string;
  fileName: string;
  originalPath: string;
  importDate: string;
  importedBy: string;
  sourceType: 'Fotos sueltas' | 'Carpeta' | 'ZIP' | 'App Externa';
  status: 'Importada' | 'Sin clasificar' | 'Clasificada' | 'Vinculada a OT' | 'Requiere revisión' | 'Aprobada' | 'Rechazada';
  gpsCoords?: string;
  otId?: string;
  plantaNombre?: string;
  activoId?: string;
  evidenceType?: 'before' | 'during' | 'after' | 'hse' | 'spare';
  checklistAsociado?: string;
  sugerencias?: {
    otId?: string;
    activoId?: string;
    evidenceType?: 'before' | 'during' | 'after' | 'hse' | 'spare';
    motivo: string;
  };
}

interface EvidenceVaultProps {
  ots: OT[];
  plantas: Planta[];
  userRole: string;
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

// Interfaz para la representación de activos del Evidence Vault
interface AssetEvidenceGroup {
  activoId: string;
  tecnico: string;
  evidenciasCargadas: number;
  evidenciasPendientes: number;
  estado: 'Pendiente' | 'Cargada' | 'Incompleta' | 'Requiere revisión' | 'Aprobada' | 'Rechazada';
  ultimaActualizacion: string;
  checklistCompletado: number;
  checklistTotal: number;
  observaciones: string;
}

export default function EvidenceVault({
  ots = [],
  plantas = [],
  userRole,
  onUpdateOts,
  onAddAuditLog
}: EvidenceVaultProps) {
  // Encontrar OTs que tengan evidencias o pack de evidencias
  const otConEvidencias = (ots || []).filter(ot => ot.evidencePack && ot.evidencePack.length > 0) || [];
  
  // Por defecto, pre-seleccionar la OT de Cantillana 26-29221 si existe, o la primera disponible
  const defaultOtCode = (ots || []).some(o => o.codigo === '26-29221') ? '26-29221' : (otConEvidencias[0]?.codigo || '');
  const [selectedOtCode, setSelectedOtCode] = useState<string>(defaultOtCode);
  const selectedOt = (ots || []).find(o => o.codigo === selectedOtCode);

  // Filtros
  const [filterParque, setFilterParque] = useState<string>('Todos');
  const [filterTecnico, setFilterTecnico] = useState<string>('Todos');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modos de Visualización
  const [modoLimpieza, setModoLimpieza] = useState<boolean>(true); // Activo por defecto como modo principal solicitado
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Módulo 3B - Estados de transición y evidencias externas
  const [activeVaultTab, setActiveVaultTab] = useState<'orbi_geo' | 'external'>('orbi_geo');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [selectedExternalEvidence, setSelectedExternalEvidence] = useState<ExternalEvidenceItem | null>(null);
  const [isClassifyModalOpen, setIsClassifyModalOpen] = useState<boolean>(false);

  // Formulario de importación (técnico / supervisor)
  const [importSourceType, setImportSourceType] = useState<'Fotos sueltas' | 'Carpeta' | 'ZIP' | 'App Externa'>('Carpeta');
  const [importSelectedOt, setImportSelectedOt] = useState<string>('');
  const [importSelectedPlanta, setImportSelectedPlanta] = useState<string>('');
  const [importTecnico, setImportTecnico] = useState<string>('Víctor León');
  const [importActivo, setImportActivo] = useState<string>('');
  const [importEvidenceType, setImportEvidenceType] = useState<'before' | 'during' | 'after' | 'hse' | 'spare'>('during');
  const [importChecklist, setImportChecklist] = useState<string>('');
  const [importFilesCount, setImportFilesCount] = useState<number>(3);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Formulario de clasificación (Supervisor)
  const [classifyOt, setClassifyOt] = useState<string>('');
  const [classifyPlanta, setClassifyPlanta] = useState<string>('');
  const [classifyTecnico, setClassifyTecnico] = useState<string>('');
  const [classifyActivo, setClassifyActivo] = useState<string>('');
  const [classifyType, setClassifyType] = useState<'before' | 'during' | 'after' | 'hse' | 'spare'>('during');
  const [classifyChecklist, setClassifyChecklist] = useState<string>('');
  const [classifyStatus, setClassifyStatus] = useState<string>('Sin clasificar');

  const [externalEvidences, setExternalEvidences] = useState<ExternalEvidenceItem[]>([
    {
      id: 'EXT-001',
      fileName: 'despues_inv02_limpieza.jpg',
      originalPath: 'Cantillana_July6/despues_inv02_limpieza.jpg',
      importDate: '2026-07-07 10:15',
      importedBy: 'Rodrigo Cisterna',
      sourceType: 'Carpeta',
      status: 'Sin clasificar',
      gpsCoords: 'Lat: -33.8423, Lon: -70.7413',
      sugerencias: {
        otId: '26-29221',
        activoId: 'INV-02',
        evidenceType: 'after',
        motivo: 'Nombre contiene "despues" e "inv02". Ubicación GPS coincide con Cantillana.'
      }
    },
    {
      id: 'EXT-002',
      fileName: 'LOTO_seguridad_antes.jpg',
      originalPath: 'Trabajos_Atacama/LOTO_seguridad_antes.jpg',
      importDate: '2026-07-07 11:20',
      importedBy: 'Víctor León',
      sourceType: 'Fotos sueltas',
      status: 'Sin clasificar',
      gpsCoords: 'Lat: -27.3611, Lon: -70.3321',
      sugerencias: {
        otId: 'OT-2026-001',
        activoId: 'General',
        evidenceType: 'before',
        motivo: 'Nombre contiene "antes". Coordenadas GPS coinciden con Atacama Solar.'
      }
    },
    {
      id: 'EXT-003',
      fileName: 'repuesto_fusible_nuevo.png',
      originalPath: 'export_gps_app/repuesto_fusible_nuevo.png',
      importDate: '2026-07-07 14:02',
      importedBy: 'Carrasco',
      sourceType: 'App Externa',
      status: 'Sin clasificar',
      gpsCoords: 'Lat: -33.8422, Lon: -70.7412',
      sugerencias: {
        otId: '26-29221',
        activoId: 'General',
        evidenceType: 'spare',
        motivo: 'Nombre contiene "repuesto". Dispositivo pertenece a Rodrigo Cisterna.'
      }
    }
  ]);

  // Formulario de edición/revisión en el modal
  const [tempAssetStatus, setTempAssetStatus] = useState<string>('Aprobada');
  const [tempAssetComment, setTempAssetComment] = useState<string>('');

  // Obtener todos los técnicos del evidence pack de la OT actual
  const tecnicosDisponibles = selectedOt?.evidencePack 
    ? Array.from(new Set(selectedOt.evidencePack.map(e => e.uploadedBy)))
    : ['Víctor León', 'Rodrigo Cisterna', 'Carrasco'];

  // Obtener todas las plantas de la lista de OTs con evidencias
  const parquesDisponibles = Array.from(new Set((ots || []).map(o => o.plantaNombre)));

  // Mock de activos para el "Modo Limpieza Inversores" de Cantillana
  const mockAssetsLimpieza: AssetEvidenceGroup[] = [
    {
      activoId: 'INV-01',
      tecnico: 'Víctor León',
      evidenciasCargadas: 2,
      evidenciasPendientes: 0,
      estado: 'Aprobada',
      ultimaActualizacion: '2026-07-06 09:45',
      checklistCompletado: 4,
      checklistTotal: 5,
      observaciones: 'Limpieza de filtros e interior completada de forma óptima. Parámetros estables.'
    },
    {
      activoId: 'INV-02',
      tecnico: 'Rodrigo Cisterna',
      evidenciasCargadas: 2,
      evidenciasPendientes: 0,
      estado: 'Requiere revisión',
      ultimaActualizacion: '2026-07-06 10:40',
      checklistCompletado: 3,
      checklistTotal: 5,
      observaciones: 'Se detecta polvo acumulado persistente en ventiladores secundarios. Requiere soplado adicional.'
    },
    {
      activoId: 'INV-03',
      tecnico: 'Carrasco',
      evidenciasCargadas: 2,
      evidenciasPendientes: 1,
      estado: 'Rechazada',
      ultimaActualizacion: '2026-07-06 15:30',
      checklistCompletado: 2,
      checklistTotal: 5,
      observaciones: 'Termografía rechazada por falta de foco y rango térmico incorrecto.'
    },
    {
      activoId: 'INV-04',
      tecnico: 'Víctor León',
      evidenciasCargadas: 1,
      evidenciasPendientes: 2,
      estado: 'Cargada',
      ultimaActualizacion: '2026-07-06 14:15',
      checklistCompletado: 1,
      checklistTotal: 5,
      observaciones: 'Captura de sincronización RS485 enviada. Esperando término de soplado de celdas.'
    },
    {
      activoId: 'INV-05',
      tecnico: 'Rodrigo Cisterna',
      evidenciasCargadas: 0,
      evidenciasPendientes: 3,
      estado: 'Pendiente',
      ultimaActualizacion: 'Sin registros',
      checklistCompletado: 0,
      checklistTotal: 5,
      observaciones: 'Equipo bloqueado por mantenimiento mecánico. Ejecución programada para tarde.'
    },
    {
      activoId: 'INV-06',
      tecnico: 'Carrasco',
      evidenciasCargadas: 1,
      evidenciasPendientes: 2,
      estado: 'Incompleta',
      ultimaActualizacion: '2026-07-06 16:10',
      checklistCompletado: 1,
      checklistTotal: 5,
      observaciones: 'Sólo se cargó foto antes. Falta subir foto después de intervenir.'
    }
  ];

  // Si estamos en la OT de Cantillana, cargamos el mock completo de Inversores. 
  // Si no, generamos un mock de activos dinámico basado en los datos reales del evidencePack de la OT seleccionada.
  const getAssetsList = (): AssetEvidenceGroup[] => {
    if (selectedOtCode === '26-29221' && modoLimpieza) {
      return mockAssetsLimpieza.filter(asset => {
        const matchesSearch = asset.activoId.toLowerCase().includes(searchTerm.toLowerCase()) || asset.tecnico.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTecnico = filterTecnico === 'Todos' || asset.tecnico === filterTecnico;
        const matchesEstado = filterEstado === 'Todos' || asset.estado === filterEstado;
        return matchesSearch && matchesTecnico && matchesEstado;
      });
    }

    // Listado dinámico basado en el evidencePack real de la OT
    if (!selectedOt || !selectedOt.evidencePack) return [];

    const assetMap = new Map<string, AssetEvidenceGroup>();
    
    selectedOt.evidencePack.forEach((ev) => {
      const assetId = ev.label.includes('INV-') 
        ? ev.label.substring(ev.label.indexOf('INV-'), ev.label.indexOf('INV-') + 6).trim()
        : 'General';
      
      const existing = assetMap.get(assetId);
      if (existing) {
        existing.evidenciasCargadas += ev.status === 'Completado' || ev.simulatedFileName ? 1 : 0;
        existing.evidenciasPendientes += ev.status === 'Pendiente' ? 1 : 0;
        if (ev.uploadedAt && ev.uploadedAt > existing.ultimaActualizacion) {
          existing.ultimaActualizacion = ev.uploadedAt;
        }
      } else {
        assetMap.set(assetId, {
          activoId: assetId,
          tecnico: ev.uploadedBy || selectedOt.responsable,
          evidenciasCargadas: ev.simulatedFileName ? 1 : 0,
          evidenciasPendientes: ev.simulatedFileName ? 0 : 1,
          estado: ev.simulatedFileName ? 'Cargada' : 'Pendiente',
          ultimaActualizacion: ev.uploadedAt || 'Sin registros',
          checklistCompletado: selectedOt.checklistExecution?.filter(c => c.completado).length || 0,
          checklistTotal: selectedOt.checklistExecution?.length || 5,
          observaciones: ev.description || 'Evidencia enviada de terreno.'
        });
      }
    });

    return Array.from(assetMap.values()).filter(asset => {
      const matchesSearch = asset.activoId.toLowerCase().includes(searchTerm.toLowerCase()) || asset.tecnico.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTecnico = filterTecnico === 'Todos' || asset.tecnico === filterTecnico;
      const matchesEstado = filterEstado === 'Todos' || asset.estado === filterEstado;
      return matchesSearch && matchesTecnico && matchesEstado;
    });
  };

  const assets = getAssetsList();

  // Contadores del Dashboard
  const totalEvidenciasCargadas = selectedOtCode === '26-29221'
    ? 9 // 7 en evidencePack + 2 adicionales de limpieza
    : (selectedOt?.evidencePack?.filter(e => e.simulatedFileName).length || 0);

  const totalEvidenciasPendientes = selectedOtCode === '26-29221'
    ? 8
    : (selectedOt?.evidencePack?.filter(e => !e.simulatedFileName).length || 0);

  const totalAntesDespuesPares = selectedOtCode === '26-29221' ? 12 : 3;

  // Manejar cambio de estado de evidencia de activo
  const handleOpenAssetModal = (assetId: string) => {
    setSelectedAsset(assetId);
    const asset = assets.find(a => a.activoId === assetId);
    if (asset) {
      setTempAssetStatus(asset.estado);
      setTempAssetComment(asset.observaciones);
    }
    setModalOpen(true);
  };

  const handleSaveAssetStatus = () => {
    if (!selectedAsset) return;

    // Simular guardado
    onAddAuditLog(
      `Auditoría Evidencia ${selectedAsset}`,
      'ORBI Evidence Vault',
      selectedOt?.codigo,
      selectedOt?.plantaNombre,
      `Activo ${selectedAsset} marcado como ${tempAssetStatus}. Comentario: ${tempAssetComment}`,
      tempAssetStatus === 'Rechazada' ? 'Media' : 'Baja'
    );

    setActionMessage(`✓ Estado de ${selectedAsset} actualizado a "${tempAssetStatus}" exitosamente.`);
    setTimeout(() => setActionMessage(null), 4000);

    setModalOpen(false);
  };

  // Acción mock: Preparar paquete documental (Supervisor)
  const handlePrepareReportPack = () => {
    onAddAuditLog(
      'Compilación de Report Pack',
      'ORBI Evidence Vault',
      selectedOt?.codigo,
      selectedOt?.plantaNombre,
      'Generación de Report Pack integrado para despacho a SharePoint.',
      'Baja'
    );
    setActionMessage('⚡ Preparando paquete documental... Compilando fotos, checklist y telemetría de Cantillana... ¡Listo! Exportado a SharePoint con éxito.');
    setTimeout(() => setActionMessage(null), 6000);
  };

  // Módulo 3B: Simular la importación de evidencias externas
  const handleImportExternal = () => {
    setIsImporting(true);
    setTimeout(() => {
      const newItems: ExternalEvidenceItem[] = [];
      const currentTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

      for (let i = 1; i <= importFilesCount; i++) {
        const id = `EXT-${Date.now().toString().slice(-4)}-${i}`;
        const randomActive = importActivo || (i === 1 ? 'INV-02' : i === 2 ? 'INV-03' : 'General');
        const fileName = `${importEvidenceType}_activo_${randomActive.toLowerCase()}_${i}.jpg`;
        const originalPath = importSourceType === 'ZIP' 
          ? `backup_terreno_export.zip/${fileName}` 
          : `DCIM_TRANSICION/${fileName}`;

        // Generar sugerencias automáticas de clasificación
        const suggestedOt = importSelectedOt || '26-29221';
        const suggestedPlanta = importSelectedPlanta || 'Cantillana';
        
        let sugerenciaMotivo = `Analizado de patrón "${fileName}". `;
        if (fileName.includes('before')) sugerenciaMotivo += 'Contiene "before" (Fase Antes). ';
        if (fileName.includes('during')) sugerenciaMotivo += 'Contiene "during" (Fase Durante). ';
        if (fileName.includes('after')) sugerenciaMotivo += 'Contiene "after" (Fase Después). ';
        sugerenciaMotivo += `Ubicación coincide con ${suggestedPlanta}.`;

        newItems.push({
          id,
          fileName,
          originalPath,
          importDate: currentTimestamp,
          importedBy: importTecnico,
          sourceType: importSourceType,
          status: userRole === 'TECNICO_OM' ? 'Requiere revisión' : (importSelectedOt ? 'Clasificada' : 'Sin clasificar'),
          gpsCoords: importSelectedPlanta === 'Atacama Solar' ? 'Lat: -27.3611, Lon: -70.3321' : 'Lat: -33.8422, Lon: -70.7412',
          otId: importSelectedOt || undefined,
          plantaNombre: importSelectedPlanta || undefined,
          activoId: randomActive || undefined,
          evidenceType: importEvidenceType,
          checklistAsociado: importChecklist || undefined,
          sugerencias: {
            otId: suggestedOt,
            activoId: randomActive,
            evidenceType: importEvidenceType,
            motivo: sugerenciaMotivo
          }
        });
      }

      setExternalEvidences((prev) => [...newItems, ...prev]);
      setIsImporting(false);
      setIsImportModalOpen(false);

      // Log the audit
      onAddAuditLog(
        'Importación Evidencias Externas',
        'ORBI Evidence Vault',
        importSelectedOt || undefined,
        importSelectedPlanta || undefined,
        `Importación de ${importFilesCount} fotos externas vía ${importSourceType} por ${importTecnico}.`,
        'Baja'
      );

      setActionMessage(`✓ Se importaron ${importFilesCount} evidencias de terreno exitosamente (${importSourceType}).`);
      setTimeout(() => setActionMessage(null), 5000);

      // Reset form
      setImportActivo('');
      setImportChecklist('');
    }, 1000);
  };

  // Abrir modal de clasificación de evidencia externa (Supervisor)
  const handleOpenClassifyModal = (ev: ExternalEvidenceItem) => {
    setSelectedExternalEvidence(ev);
    setClassifyOt(ev.otId || ev.sugerencias?.otId || '');
    setClassifyPlanta(ev.plantaNombre || (ev.sugerencias?.otId ? ots.find(o => o.codigo === ev.sugerencias?.otId)?.plantaNombre || '' : ''));
    setClassifyTecnico(ev.importedBy);
    setClassifyActivo(ev.activoId || ev.sugerencias?.activoId || '');
    setClassifyType(ev.evidenceType || ev.sugerencias?.evidenceType || 'during');
    setClassifyChecklist(ev.checklistAsociado || '');
    setClassifyStatus(ev.status === 'Sin clasificar' ? 'Clasificada' : ev.status);
    setIsClassifyModalOpen(true);
  };

  // Aplicar sugerencias de IA/sistema (Supervisor)
  const handleApplySuggestions = () => {
    if (!selectedExternalEvidence || !selectedExternalEvidence.sugerencias) return;
    const sug = selectedExternalEvidence.sugerencias;
    if (sug.otId) {
      setClassifyOt(sug.otId);
      const linkedOt = ots.find(o => o.codigo === sug.otId);
      if (linkedOt) setClassifyPlanta(linkedOt.plantaNombre);
    }
    if (sug.activoId) setClassifyActivo(sug.activoId);
    if (sug.evidenceType) setClassifyType(sug.evidenceType);
    setClassifyStatus('Clasificada');
  };

  // Guardar la clasificación de la evidencia (Supervisor)
  const handleSaveClassification = (approveInstantly: boolean = false) => {
    if (!selectedExternalEvidence) return;

    const finalStatus = approveInstantly ? 'Aprobada' : (classifyStatus as any);

    setExternalEvidences(prev => prev.map(ev => {
      if (ev.id === selectedExternalEvidence.id) {
        return {
          ...ev,
          otId: classifyOt || undefined,
          plantaNombre: classifyPlanta || undefined,
          activoId: classifyActivo || undefined,
          evidenceType: classifyType,
          checklistAsociado: classifyChecklist || undefined,
          status: finalStatus
        };
      }
      return ev;
    }));

    // Si se aprueba e integra al pack real de la OT (si existe el código de la OT)
    if (approveInstantly && classifyOt) {
      const updatedOts = ots.map(ot => {
        if (ot.codigo === classifyOt) {
          const currentPack = ot.evidencePack || [];
          const newId = `EV-EXT-${Date.now().toString().slice(-4)}`;
          const newItem: OTEvidencePackItem = {
            evidenceId: newId,
            otId: ot.codigo,
            type: classifyType as any,
            label: `${classifyType === 'before' ? 'Antes' : classifyType === 'after' ? 'Después' : 'Durante'} - Activo ${classifyActivo || 'General'} (Externa)`,
            description: `Foto externa importada y clasificada. Archivo original: ${selectedExternalEvidence.fileName}`,
            simulatedFileName: selectedExternalEvidence.fileName,
            uploadedBy: selectedExternalEvidence.importedBy,
            uploadedAt: selectedExternalEvidence.importDate,
            status: 'Aprobada'
          };
          return {
            ...ot,
            evidencePack: [...currentPack, newItem]
          };
        }
        return ot;
      });
      onUpdateOts(updatedOts);
    }

    onAddAuditLog(
      approveInstantly ? 'Aprobación Evidencia Externa' : 'Clasificación Evidencia Externa',
      'ORBI Evidence Vault',
      classifyOt || undefined,
      classifyPlanta || undefined,
      `Evidencia externa ${selectedExternalEvidence.fileName} clasificada para activo ${classifyActivo}. Estado: ${finalStatus}`,
      'Baja'
    );

    setActionMessage(approveInstantly 
      ? `✓ Evidencia "${selectedExternalEvidence.fileName}" aprobada y vinculada a la OT ${classifyOt} exitosamente.`
      : `✓ Clasificación de "${selectedExternalEvidence.fileName}" actualizada.`
    );
    setTimeout(() => setActionMessage(null), 5000);

    setIsClassifyModalOpen(false);
    setSelectedExternalEvidence(null);
  };

  // Rechazar / devolver evidencia a revisión
  const handleReturnEvidence = () => {
    if (!selectedExternalEvidence) return;

    setExternalEvidences(prev => prev.map(ev => {
      if (ev.id === selectedExternalEvidence.id) {
        return {
          ...ev,
          status: 'Requiere revisión'
        };
      }
      return ev;
    }));

    onAddAuditLog(
      'Rechazo Evidencia Externa',
      'ORBI Evidence Vault',
      classifyOt || undefined,
      classifyPlanta || undefined,
      `Evidencia externa ${selectedExternalEvidence.fileName} rechazada por supervisor. Devuelta a revisión técnico.`,
      'Media'
    );

    setActionMessage(`⚠ Evidencia "${selectedExternalEvidence.fileName}" devuelta a revisión del técnico.`);
    setTimeout(() => setActionMessage(null), 5000);

    setIsClassifyModalOpen(false);
    setSelectedExternalEvidence(null);
  };

  // Helper para renderizar los placeholders de fotos de inversores
  const renderPhotoPlaceholder = (type: 'antes' | 'despues' | 'frontal' | 'vegetacion' | 'app', label: string, status: string) => {
    const isDirty = type === 'antes';
    const isClean = type === 'despues';
    const isApp = type === 'app';

    const getBgColor = () => {
      if (status === 'Aprobada') return 'border-emerald-500/30 bg-emerald-950/20';
      if (status === 'Requiere revisión') return 'border-amber-500/30 bg-amber-950/20';
      if (status === 'Rechazada') return 'border-rose-500/30 bg-rose-950/20';
      return 'border-slate-800 bg-slate-900/60';
    };

    return (
      <div className={`border p-3 rounded-xl space-y-2 flex flex-col justify-between ${getBgColor()}`}>
        <div className="flex justify-between items-center text-[9px] font-mono">
          <span className="text-slate-400 font-bold uppercase">{label}</span>
          <span className={`px-1.5 py-0.2 rounded-md font-extrabold uppercase ${
            status === 'Aprobada' ? 'bg-emerald-500/15 text-emerald-400' :
            status === 'Requiere revisión' ? 'bg-amber-500/15 text-amber-400' :
            status === 'Rechazada' ? 'bg-rose-500/15 text-rose-400' :
            'bg-slate-850 text-slate-500'
          }`}>{status}</span>
        </div>

        {/* Simulador visual de foto de terreno */}
        <div className="h-28 rounded-lg bg-slate-950/80 flex flex-col justify-center items-center relative overflow-hidden border border-slate-900">
          {/* Raster Line lines */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(0,0,0,0.4)_95%)] bg-[length:100%_4px]"></div>
          
          {/* Contenido Visual */}
          {isDirty && (
            <div className="text-center space-y-1 z-10 px-2">
              <Camera className="h-5 w-5 text-amber-500/40 mx-auto" />
              <p className="text-[10px] font-mono text-amber-500/70 font-bold">REJILLA OBSTRUIDA</p>
              <p className="text-[8px] text-slate-500 font-mono">Partículas y polvo &gt; 15%</p>
            </div>
          )}
          {isClean && (
            <div className="text-center space-y-1 z-10 px-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400/50 mx-auto" />
              <p className="text-[10px] font-mono text-emerald-400/80 font-bold font-black">REJILLA LIMPIA</p>
              <p className="text-[8px] text-slate-400 font-mono">Soplado con aire seco</p>
            </div>
          )}
          {isApp && (
            <div className="text-center space-y-1 z-10 px-2">
              <Sparkles className="h-5 w-5 text-indigo-400/50 mx-auto" />
              <p className="text-[10px] font-mono text-indigo-400/80 font-bold">APP SINCRONIZADA</p>
              <p className="text-[8px] text-slate-500 font-mono">Modbus TCP / Parametrización</p>
            </div>
          )}
          {!isDirty && !isClean && !isApp && (
            <div className="text-center space-y-1 z-10 px-2">
              <Camera className="h-5 w-5 text-slate-500 mx-auto" />
              <p className="text-[10px] font-mono text-slate-400 font-bold">EVIDENCIA REGISTRADA</p>
              <p className="text-[8px] text-slate-500 font-mono">Placeholder seguro</p>
            </div>
          )}

          {/* GPS Overlay Watermark */}
          <div className="absolute bottom-1 right-1 left-1 flex justify-between text-[6px] font-mono text-slate-600 bg-slate-950/60 p-1 rounded">
            <span>Lat: -33.8422, Lon: -70.7412</span>
            <span>ALT: 412m</span>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-[9px] font-mono text-slate-500 space-y-0.5">
          <p className="truncate"><span className="text-slate-600">Archivo:</span> inv_{type}.jpg</p>
          <p><span className="text-slate-600">Sincronizado:</span> 2026-07-06 09:45</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL DE EVIDENCE VAULT */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1">
              <HardDrive className="h-3 w-3" /> ORBI EVIDENCE VAULT v0.1.3
            </span>
            <span className="text-slate-500 font-mono text-xs">• Sincronizador de Campo</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            Evidence Vault & Control de Campo
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Repositorio unificado de evidencias fotográficas, checklists de terreno y trazabilidad de activos. Integración automatizada para control de calidad O&M.
          </p>
        </div>

        {/* Botón de acción supervisor / técnico */}
        <div className="flex flex-wrap gap-2.5 z-10">
          <button
            onClick={() => {
              setIsImportModalOpen(true);
              setImportSelectedOt(selectedOtCode);
              const o = ots.find(ot => ot.codigo === selectedOtCode);
              if (o) {
                setImportSelectedPlanta(o.plantaNombre);
                setImportTecnico(o.responsable || 'Víctor León');
              }
            }}
            className="bg-slate-950 hover:bg-slate-900 text-indigo-400 hover:text-indigo-300 font-mono text-xs font-bold px-4 py-2.5 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-950/20"
          >
            <Upload className="h-4 w-4" /> Importar evidencias externas
          </button>

          {userRole !== 'TECNICO_OM' && (
            <button
              onClick={handlePrepareReportPack}
              className="bg-slate-950 hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 font-mono text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
            >
              <Download className="h-4 w-4" /> Preparar paquete documental
            </button>
          )}
        </div>
      </div>

      {/* ALERT BOX */}
      {actionMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-mono animate-fade-in flex items-center gap-2">
          <CheckSquare className="h-4 w-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* NOTA UX DE ADOPCIÓN GRADUAL (REQUISITO 9) */}
      <div className="bg-slate-950/80 border border-indigo-500/20 p-3.5 rounded-xl text-xs font-mono text-indigo-300 flex items-start gap-2.5 shadow-md shadow-indigo-950/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none"></div>
        <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold uppercase text-[10px] text-white tracking-wider block">💡 NOTA DE ADOPCIÓN GRADUAL O&amp;M:</span>
          <span>ORBI GEO ordena automáticamente las evidencias de terreno, pero también puedes importar fotos externas durante la transición para no interrumpir tu flujo de trabajo actual.</span>
        </div>
      </div>

      {/* DETALLES DE CARGA Y CONTADORES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Camera className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block leading-none">Fotos Sincronizadas</span>
            <span className="text-xl font-extrabold text-white font-mono">{totalEvidenciasCargadas}</span>
            <span className="text-[9px] text-emerald-500 block font-mono">Almacenamiento Seguro</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block leading-none">Pares Antes/Después</span>
            <span className="text-xl font-extrabold text-white font-mono">{totalAntesDespuesPares} pares</span>
            <span className="text-[9px] text-amber-400 block font-mono">Modo Limpieza Activo</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Clock className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase block leading-none">Cargas Pendientes</span>
            <span className="text-xl font-extrabold text-white font-mono">{totalEvidenciasPendientes} archivos</span>
            <span className="text-[9px] text-indigo-400 block font-mono">Esperando envío de campo</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950 p-4 rounded-xl border border-indigo-900/30 flex items-center gap-3 relative overflow-hidden">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
            <Layers className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-0.5 z-10">
            <span className="text-[10px] font-mono text-indigo-400 uppercase block leading-none font-bold">Integración Futura</span>
            <span className="text-xs font-bold text-white block">ORBI GEO Connect Portal</span>
            <span className="text-[9px] text-slate-400 block font-mono">Fase 2: Datos Georreferenciados</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: EVIDENCE VAULT MAIN WORKSPACE */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* MAIN SUB-TABS (MÓDULO 3B - REQUISITOS 1 Y 4) */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-900 gap-1">
            <button
              onClick={() => setActiveVaultTab('orbi_geo')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                activeVaultTab === 'orbi_geo'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Camera className="h-4 w-4 text-emerald-400" />
              📸 ORBI GEO Connect (Flujo Móvil)
            </button>
            <button
              onClick={() => setActiveVaultTab('external')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 relative ${
                activeVaultTab === 'external'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <Upload className="h-4 w-4 text-indigo-400" />
              📂 Bandeja de Evidencias Externas
              {externalEvidences.filter(e => e.status === 'Sin clasificar').length > 0 && (
                <span className="absolute right-3 bg-indigo-500 text-slate-950 font-black text-[10px] h-4.5 min-w-4.5 px-1.5 rounded-full flex items-center justify-center animate-pulse border border-slate-950">
                  {externalEvidences.filter(e => e.status === 'Sin clasificar').length}
                </span>
              )}
            </button>
          </div>

          {activeVaultTab === 'orbi_geo' ? (
            <>
              {/* TAB BAR DENTRO DE VAULT */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Filtrar por OT:</span>
                  <select
                    value={selectedOtCode}
                    onChange={(e) => {
                      setSelectedOtCode(e.target.value);
                      setModoLimpieza(e.target.value === '26-29221');
                    }}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-emerald-400 font-bold outline-none cursor-pointer focus:border-emerald-500/50"
                  >
                    <option value="">-- Seleccionar OT --</option>
                    {ots.map((o) => (
                      <option key={o.codigo} value={o.codigo} className="bg-slate-950 text-white font-mono">
                        {o.codigo} - {o.plantaNombre} ({o.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedOtCode === '26-29221' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModoLimpieza(!modoLimpieza)}
                      className={`px-3 py-1 text-[10px] font-bold font-mono rounded-lg border transition-all ${
                        modoLimpieza 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {modoLimpieza ? '★ Modo Limpieza Inversores ACTIVO' : 'Activar Modo Limpieza Inversores'}
                    </button>
                  </div>
                )}
              </div>

              {/* FILTRO SECUNDARIO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-lg">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={filterTecnico}
                    onChange={(e) => setFilterTecnico(e.target.value)}
                    className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
                  >
                    <option value="Todos" className="bg-slate-950 text-white">Todos los Técnicos</option>
                    {tecnicosDisponibles.map(t => (
                      <option key={t} value={t} className="bg-slate-950 text-white">{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-lg">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
                  >
                    <option value="Todos" className="bg-slate-950 text-white">Todos los Estados</option>
                    <option value="Aprobada" className="bg-slate-950 text-emerald-400">🟢 Aprobada</option>
                    <option value="Requiere revisión" className="bg-slate-950 text-amber-400">🟡 Requiere revisión</option>
                    <option value="Cargada" className="bg-slate-950 text-blue-400">🔵 Cargada</option>
                    <option value="Pendiente" className="bg-slate-950 text-slate-500">⚪ Pendiente</option>
                    <option value="Incompleta" className="bg-slate-950 text-rose-400">🔴 Incompleta</option>
                    <option value="Rechazada" className="bg-slate-950 text-rose-500">❌ Rechazada</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar activo (ej: INV-01)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg py-1 pl-8 pr-3 text-xs text-white outline-none focus:border-emerald-500/30 font-mono"
                  />
                </div>
              </div>

              {/* ASSET LIST / CARDS */}
              {assets.length === 0 ? (
                <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-8 text-center space-y-2">
                  <Folder className="h-10 w-10 text-slate-600 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-300">No se encontraron evidencias</h4>
                  <p className="text-[11px] text-slate-500">Intente modificando los filtros de técnico o estado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assets.map((asset) => {
                    const getStatusColor = (st: string) => {
                      switch (st) {
                        case 'Aprobada': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                        case 'Requiere revisión': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                        case 'Cargada': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                        case 'Pendiente': return 'bg-slate-900 text-slate-500 border border-slate-800';
                        case 'Incompleta': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                        case 'Rechazada': return 'bg-rose-950/20 text-rose-500 border border-rose-900/30';
                        default: return 'bg-slate-900 text-slate-500';
                      }
                    };

                    return (
                      <div
                        key={asset.activoId}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3.5 flex flex-col justify-between transition-all hover:border-slate-850 hover:shadow-lg"
                      >
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-mono text-slate-500 uppercase">Activo</span>
                              <h3 className="text-sm font-black text-white font-mono leading-none mt-0.5">{asset.activoId}</h3>
                            </div>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${getStatusColor(asset.estado)}`}>
                              {asset.estado}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-900">
                            <div>
                              <span className="text-slate-600 block text-[8px] uppercase">Técnico</span>
                              <span className="text-slate-200 font-bold">{asset.tecnico}</span>
                            </div>
                            <div>
                              <span className="text-slate-600 block text-[8px] uppercase">Checklist</span>
                              <span className="text-slate-200 font-bold">{asset.checklistCompletado} / {asset.checklistTotal}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-900 p-2 rounded-lg border border-slate-850/60">
                            <Camera className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                            <div className="flex-1 flex justify-between items-center text-[9px]">
                              <span className="text-slate-400 font-bold">Cargadas: <span className="text-indigo-400 font-black">{asset.evidenciasCargadas}</span></span>
                              <span className="text-slate-500">Pendientes: <span className="text-slate-400">{asset.evidenciasPendientes}</span></span>
                            </div>
                          </div>

                          {asset.observaciones && (
                            <p className="text-[10px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-900 italic font-mono truncate">
                              &ldquo;{asset.observaciones}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-900 font-mono text-[9px] text-slate-500">
                          <span>Ref: {asset.ultimaActualizacion}</span>
                          <button
                            onClick={() => handleOpenAssetModal(asset.activoId)}
                            className="bg-indigo-500/10 hover:bg-indigo-500 hover:text-slate-950 text-indigo-400 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-indigo-500/20 transition-all flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Ver paquete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* BANDEJA DE EVIDENCIAS EXTERNAS (MÓDULO 3B - REQUISITOS 4, 5, 6, 7) */
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  Evidencias Sin Clasificar / Importadas
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fotos, carpetas e informes georreferenciados cargados por técnicos que siguen utilizando herramientas de captura externa. El supervisor debe revisar y vincular estas evidencias a las OTs correspondientes.
                </p>
              </div>

              {externalEvidences.length === 0 ? (
                <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-8 text-center space-y-2">
                  <Folder className="h-10 w-10 text-slate-600 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-300">Bandeja de transición vacía</h4>
                  <p className="text-[11px] text-slate-500">Haz clic en "Importar evidencias externas" para cargar datos mock de carpetas o ZIPs.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {externalEvidences.map((ev) => {
                    const getSourceIcon = (src: string) => {
                      switch(src) {
                        case 'ZIP': return <HardDrive className="h-4 w-4 text-amber-400" />;
                        case 'Carpeta': return <Folder className="h-4 w-4 text-indigo-400" />;
                        case 'Fotos sueltas': return <Camera className="h-4 w-4 text-emerald-400" />;
                        default: return <ExternalLink className="h-4 w-4 text-slate-400" />;
                      }
                    };

                    const getStatusColor = (st: string) => {
                      switch (st) {
                        case 'Aprobada': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                        case 'Requiere revisión': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                        case 'Clasificada': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                        case 'Vinculada a OT': return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
                        case 'Rechazada': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                        default: return 'bg-slate-900 text-slate-400 border border-slate-800';
                      }
                    };

                    return (
                      <div
                        key={ev.id}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3 transition-all hover:border-indigo-500/30"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center">
                              {getSourceIcon(ev.sourceType)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-slate-500">[{ev.id}]</span>
                                <h4 className="text-xs font-bold text-white font-mono">{ev.fileName}</h4>
                              </div>
                              <p className="text-[9px] font-mono text-slate-500">Ruta: {ev.originalPath}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
                            <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${getStatusColor(ev.status)}`}>
                              {ev.status}
                            </span>
                          </div>
                        </div>

                        {/* GPS Metadata */}
                        {ev.gpsCoords && (
                          <div className="flex items-center gap-1 text-[9px] font-mono text-indigo-400 bg-indigo-950/20 px-2 py-1 rounded-md border border-indigo-500/10 w-fit">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span>Metadatos GPS: {ev.gpsCoords}</span>
                          </div>
                        )}

                        {/* SUGERENCIAS DE IA / CLASIFICACIÓN SISTEMA (REQUISITO 6) */}
                        {ev.sugerencias && ev.status === 'Sin clasificar' && (
                          <div className="bg-indigo-950/20 border border-indigo-500/20 p-2.5 rounded-lg text-[10px] font-mono text-indigo-300 space-y-1">
                            <div className="flex items-center gap-1 text-indigo-200 font-extrabold uppercase text-[9px] tracking-wider">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Sugerencia de Clasificación:
                            </div>
                            <p className="text-slate-300 leading-normal">{ev.sugerencias.motivo}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-400 text-[9px] pt-1 border-t border-indigo-900/40">
                              <span>OT Sugerida: <strong className="text-indigo-400">{ev.sugerencias.otId}</strong></span>
                              <span>Activo Sugerido: <strong className="text-indigo-400">{ev.sugerencias.activoId}</strong></span>
                              <span>Fase: <strong className="text-indigo-400 uppercase">{ev.sugerencias.evidenceType}</strong></span>
                            </div>
                          </div>
                        )}

                        {/* Detalles de Vinculación */}
                        {ev.otId && (
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-400">
                            <div>
                              <span className="text-slate-500 block text-[8px] uppercase">OT Asociada</span>
                              <span className="text-emerald-400 font-bold">{ev.otId}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[8px] uppercase">Parque/Planta</span>
                              <span className="text-slate-300">{ev.plantaNombre || 'Cantillana'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[8px] uppercase">Activo</span>
                              <span className="text-indigo-400 font-bold">{ev.activoId || 'General'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[8px] uppercase">Fase Evidencia</span>
                              <span className="text-slate-300 uppercase">{ev.evidenceType}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-500" />
                            <span>Cargado por: <strong className="text-slate-400">{ev.importedBy}</strong> ({ev.sourceType})</span>
                            <span className="text-slate-700">•</span>
                            <span>{ev.importDate}</span>
                          </div>

                          {/* ACCIONES DE SUPERVISOR VS TÉCNICO (REQUISITOS 7 Y 8) */}
                          <div className="self-stretch sm:self-auto flex gap-1.5 justify-end">
                            {userRole !== 'TECNICO_OM' ? (
                              <button
                                onClick={() => handleOpenClassifyModal(ev)}
                                className="bg-indigo-500/10 hover:bg-indigo-500 hover:text-slate-950 text-indigo-400 font-extrabold text-[10px] px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all flex items-center gap-1 shadow-sm"
                              >
                                <Sparkles className="h-3.5 w-3.5" /> Revisar y Vincular
                              </button>
                            ) : (
                              <div className="text-[9px] text-indigo-400 font-bold bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10 flex items-center gap-1">
                                <Clock className="h-3 w-3 shrink-0" />
                                {ev.status === 'Sin clasificar' || ev.status === 'Requiere revisión' 
                                  ? 'Esperando aprobación del Supervisor' 
                                  : 'Vinculada e integrada con éxito'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: ORBI GEO CONNECT PORTAL & SUPERVISOR SUMMARY */}
        <div className="lg:col-span-4 space-y-6">
          {/* BLOQUE INFORMATIVO: CONEXIÓN FUTURA ORBI GEO */}
          <div className="bg-gradient-to-b from-indigo-950/40 to-slate-950 p-5 rounded-2xl border border-indigo-900/30 space-y-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-mono font-black uppercase">
                <span className="animate-ping h-2 w-2 rounded-full bg-indigo-400 inline-block mr-1"></span>
                📡 PORTAL DE PREPARACIÓN ORBI GEO
              </div>
              <h3 className="text-sm font-extrabold text-white">Canal de Ingesta Georreferenciada</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                ORBI GEO enviará evidencias georreferenciadas de forma automática a este Evidence Vault en una fase posterior. En esta fase se simula la estructura de datos para asegurar compatibilidad.
              </p>
            </div>

            {/* Mapeo de Campos Técnicos */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-indigo-950/50 space-y-2">
              <span className="text-[9px] font-mono text-indigo-300 font-bold uppercase block border-b border-indigo-950 pb-1">CAMPOS DE TRANSMISIÓN DE DATOS:</span>
              
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[8px]">OT ID</span>
                  <span className="text-slate-300 font-bold">26-29221 (String)</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[8px]">PARQUE / PLANTA</span>
                  <span className="text-slate-300 font-bold">Cantillana (String)</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[8px]">TÉCNICO EJECUTOR</span>
                  <span className="text-slate-300 font-bold">Nombre (String)</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[8px]">ACTIVO COORD</span>
                  <span className="text-slate-300 font-bold">INV-01 (String)</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[8px]">FASE EVIDENCIA</span>
                  <span className="text-indigo-400 font-bold">Antes / Después</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[8px]">MARCA TEMPORAL</span>
                  <span className="text-slate-300 font-bold">ISO 8601 (Date)</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[8px]">COORDENADAS GPS</span>
                  <span className="text-emerald-400 font-bold">±0.0001 WGS84</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[8px]">MULTIMEDIA REF</span>
                  <span className="text-slate-300 font-bold">JPEG / Thumbnail</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-900/20 text-[10px] text-indigo-300 font-mono flex items-start gap-1.5">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Esta pasarela está diseñada para acoplarse con la API móvil nativa de ORBI GEO, garantizando integridad física y hashes inmutables de foto contra el reporte final de revisión.
              </span>
            </div>
          </div>

          {/* PANEL DE MONITOREO SUPERVISOR (REGRESA A LA REGLA 8) */}
          {userRole !== 'TECNICO_OM' && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-4">
              <h3 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider block border-b border-slate-900 pb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Consola de Validación Supervisor
              </h3>

              <div className="space-y-3 font-mono text-[11px]">
                {/* Cuadros Rápidos de Estado */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Evidencias Pendientes de Firma:</span>
                    <span className="text-amber-400 font-bold">{assets.filter(a => a.estado === 'Requiere revisión' || a.estado === 'Cargada').length}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Activos Incompletos:</span>
                    <span className="text-rose-400 font-bold">{assets.filter(a => a.estado === 'Incompleta' || a.estado === 'Pendiente').length}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Técnicos con Carga Pendiente:</span>
                    <span className="text-indigo-400 font-bold">2</span>
                  </div>
                </div>

                {/* Listado de técnicos pendientes */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-900 space-y-2 text-[10px]">
                  <span className="text-slate-500 uppercase font-bold text-[8px] block">Alertas de Carga Operativa</span>
                  <div className="flex justify-between items-center bg-slate-950 px-2 py-1.5 rounded border border-slate-900">
                    <span className="text-slate-300">Víctor León</span>
                    <span className="bg-amber-500/10 text-amber-400 px-1.5 rounded">1 Pendiente</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950 px-2 py-1.5 rounded border border-slate-900">
                    <span className="text-slate-300">Rodrigo Cisterna</span>
                    <span className="bg-rose-500/10 text-rose-400 px-1.5 rounded">1 Incompleta</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-[10px] text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    El Jefe de O&amp;M requiere un Report Pack del 100% aprobado antes de autorizar el cierre definitivo de esta OT de preventivo anual.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLADO DE ACTIVO (VER PAQUETE) */}
      {modalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-fade-in">
            {/* Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest font-bold">PAQUETE DE EVIDENCIA POR ACTIVO</span>
                <h3 className="text-sm font-black text-white mt-1 font-mono">Activo: {selectedAsset} — Planta: Cantillana (OT: {selectedOtCode})</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 hover:bg-slate-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
              
              {/* Fotos Antes / Después pares */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-indigo-400 uppercase font-extrabold flex items-center gap-1">
                  <Camera className="h-4 w-4" /> PARES ANTES / DESPUÉS (MOCK VISUAL DE LIMPIEZA)
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderPhotoPlaceholder('antes', 'Fase 1: Antes de intervenir (Filtros Sucios)', tempAssetStatus)}
                  {renderPhotoPlaceholder('despues', 'Fase 2: Después de limpiar (Soplado y Reemplazo)', tempAssetStatus)}
                </div>
              </div>

              {/* Otras evidencias / Sincronización */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-extrabold">EVIDENCIAS FRONTAL Y LED</span>
                  {renderPhotoPlaceholder('frontal', 'Estado LED / Indicadores Frontales', tempAssetStatus)}
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-extrabold">SINCRONIZACIÓN DE PARÁMETROS</span>
                  {renderPhotoPlaceholder('app', 'Parámetros App Fabricante (RS485 Sinc)', tempAssetStatus)}
                </div>
              </div>

              {/* Checklist Asociado al Activo */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block border-b border-slate-900 pb-1.5">CHECKLIST ASOCIADO DE TERRENO</span>
                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="flex justify-between items-center p-1 hover:bg-slate-900 rounded">
                    <span className="text-slate-300">✓ Limpieza e inspección de gabinetes y celdas</span>
                    <span className="text-emerald-400 font-bold uppercase text-[9px] bg-emerald-500/10 px-1.5 rounded">Completado</span>
                  </div>
                  <div className="flex justify-between items-center p-1 hover:bg-slate-900 rounded">
                    <span className="text-slate-300">✓ Revisión y soplado de rejillas de ventilación</span>
                    <span className="text-emerald-400 font-bold uppercase text-[9px] bg-emerald-500/10 px-1.5 rounded">Completado</span>
                  </div>
                  <div className="flex justify-between items-center p-1 hover:bg-slate-900 rounded">
                    <span className="text-slate-300">✓ Registro de termografía infrarroja en interruptor principal AC</span>
                    <span className="text-emerald-400 font-bold uppercase text-[9px] bg-emerald-500/10 px-1.5 rounded">Completado</span>
                  </div>
                  <div className="flex justify-between items-center p-1 hover:bg-slate-900 rounded">
                    <span className="text-slate-300">⚠ Medición de torque y apriete de bornes de potencia</span>
                    <span className="text-amber-400 font-bold uppercase text-[9px] bg-amber-500/10 px-1.5 rounded">No Aplica</span>
                  </div>
                </div>
              </div>

              {/* Observación y Auditoría */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Observaciones del Técnico de Terreno</label>
                <textarea
                  value={tempAssetComment}
                  onChange={(e) => setTempAssetComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:border-indigo-500 outline-none h-20"
                ></textarea>
              </div>

              {/* Formulario Supervisor (Regla 8) */}
              {userRole !== 'TECNICO_OM' && (
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4" /> PANEL DE AUDITORÍA SUPERVISOR O&amp;M
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 uppercase block">Cambiar Estado de la Evidencia</label>
                      <select
                        value={tempAssetStatus}
                        onChange={(e) => setTempAssetStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-xs text-white outline-none mt-1 focus:border-emerald-500 font-mono"
                      >
                        <option value="Aprobada">🟢 Aprobada (Válida para Report Pack)</option>
                        <option value="Requiere revisión">🟡 Requiere revisión (Corrección en terreno)</option>
                        <option value="Rechazada">❌ Rechazada (Insatisfactoria / Repetir)</option>
                        <option value="Incompleta">🔴 Incompleta (Faltan imágenes)</option>
                        <option value="Cargada">🔵 Cargada (Recibida desde móvil)</option>
                        <option value="Pendiente">⚪ Pendiente</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                        *Al aprobar, estas fotos se inyectarán de forma automática en el SharePoint definitivo asociado al parque.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-600">Último cambio por supervisor: Hace 10 min</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white font-mono text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAssetStatus}
                  className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold font-mono text-xs rounded-xl transition-all"
                >
                  Guardar Estado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MOCK DE IMPORTACIÓN DE EVIDENCIAS (REQUISITO 2, 3) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-black text-white font-mono">Importar Evidencias Externas</h3>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mt-0.5">VÍA DE ADOPCIÓN GRADUAL O&amp;M</span>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 hover:bg-slate-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-xs font-mono">
              <div className="bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-xl text-[11px] text-indigo-300 leading-normal flex items-start gap-2">
                <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Sube tus archivos capturados desde aplicaciones externas de fotos georreferenciadas. El sistema simulará la ingesta, lectura de metadatos GPS y los dejará en la bandeja sin clasificar.
                </span>
              </div>

              {/* Método de importación */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Método de Captura Externa</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Fotos sueltas', desc: 'Fotos Individuales' },
                    { id: 'Carpeta', desc: 'Carpeta Ordenada' },
                    { id: 'ZIP', desc: 'ZIP Completo (.zip)' },
                    { id: 'App Externa', desc: 'Exportación App GPS' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setImportSourceType(m.id as any)}
                      className={`p-2.5 rounded-lg border text-center font-bold font-mono text-[10.5px] transition-all flex flex-col items-center justify-center gap-1 ${
                        importSourceType === m.id
                          ? 'bg-indigo-500/15 border-indigo-400 text-indigo-300'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{m.desc}</span>
                      <span className="text-[8px] font-normal text-slate-500 uppercase">Vía {m.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* OT Asociada */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Vincular a Orden de Trabajo (OT)</label>
                <select
                  value={importSelectedOt}
                  onChange={(e) => {
                    setImportSelectedOt(e.target.value);
                    const o = ots.find(ot => ot.codigo === e.target.value);
                    if (o) setImportSelectedPlanta(o.plantaNombre);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="">-- Dejar Sin Clasificar (No Vincular de Inmediato) --</option>
                  {ots.map((o) => (
                    <option key={o.codigo} value={o.codigo} className="bg-slate-950 text-white font-mono">
                      {o.codigo} - {o.plantaNombre} ({o.tipo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Campos Avanzados si es Supervisor o si quiere clasificar ya */}
              <div className="border-t border-slate-855 pt-3.5 space-y-3.5">
                <div className="flex justify-between items-center pb-1">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Asignaciones Iniciales</span>
                  <span className="text-[8px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded uppercase border border-slate-850">
                    {userRole === 'TECNICO_OM' ? 'Campos Simplificados' : 'Consola Avanzada'}
                  </span>
                </div>

                {/* Campos para Supervisor / Avanzado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block">Técnico Responsable</label>
                    <input
                      type="text"
                      disabled={userRole === 'TECNICO_OM'}
                      value={importTecnico}
                      onChange={(e) => setImportTecnico(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none disabled:opacity-60 disabled:cursor-not-allowed font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block">Identificador Activo</label>
                    <input
                      type="text"
                      placeholder="Ej: INV-02"
                      value={importActivo}
                      onChange={(e) => setImportActivo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block">Tipo de Evidencia</label>
                    <select
                      value={importEvidenceType}
                      onChange={(e) => setImportEvidenceType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="before">Antes de intervención (Sucio)</option>
                      <option value="during">Durante la intervención</option>
                      <option value="after">Después de intervenir (Limpio)</option>
                      <option value="hse">Firma Seguridad / HSE</option>
                      <option value="spare">Repuestos / Materiales Usados</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block">Checklist Asociado (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Limpieza de celdas"
                      value={importChecklist}
                      onChange={(e) => setImportChecklist(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 uppercase block">Simular cantidad de fotos capturadas</label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={importFilesCount}
                    onChange={(e) => setImportFilesCount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold px-1 mt-1">
                    <span>1 Foto</span>
                    <span className="text-indigo-400 font-extrabold">{importFilesCount} Fotos a simular</span>
                    <span>6 Fotos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-600">Simulación mock inofensiva</span>
              <div className="flex gap-2">
                <button
                  disabled={isImporting}
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white font-mono text-xs transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  disabled={isImporting}
                  onClick={handleImportExternal}
                  className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-black font-mono text-xs rounded-xl transition-all flex items-center gap-1 shadow-md shadow-indigo-950/40 disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Analizando archivos...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Sincronizar e Importar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CLASIFICACIÓN / VINCULACIÓN DE EVIDENCIAS (REQUISITOS 5, 6, 7) */}
      {isClassifyModalOpen && selectedExternalEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-black text-white font-mono">Consola de Clasificación y Auditoría</h3>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block mt-0.5">VINCULAR EVIDENCIA EXTERNA A OT</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsClassifyModalOpen(false);
                  setSelectedExternalEvidence(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 hover:bg-slate-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-xs font-mono">
              
              {/* Información de archivo */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1.5">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Archivo Original Recibido</span>
                <div className="text-xs text-slate-300 font-bold font-mono">{selectedExternalEvidence.fileName}</div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                  <div>
                    <span className="text-slate-500 block text-[8px]">ORIGEN</span>
                    <span>{selectedExternalEvidence.sourceType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px]">FECHA IMP</span>
                    <span>{selectedExternalEvidence.importDate}</span>
                  </div>
                </div>
              </div>

              {/* SUGERENCIAS DE IA / CLASIFICACIÓN SISTEMA CON ACCIÓN CLICKEABLE (REQUISITO 6) */}
              {selectedExternalEvidence.sugerencias && (
                <div className="bg-indigo-950/20 border border-indigo-500/30 p-3.5 rounded-xl text-xs font-mono text-indigo-300 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-200 font-extrabold uppercase text-[10px] tracking-wider">
                    <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" /> SUGERENCIA DE CLASIFICACIÓN DETECTADA:
                  </div>
                  <p className="text-slate-300 leading-normal">{selectedExternalEvidence.sugerencias.motivo}</p>
                  
                  <button
                    type="button"
                    onClick={handleApplySuggestions}
                    className="bg-indigo-500/20 hover:bg-indigo-500 hover:text-slate-950 text-indigo-300 font-black px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:border-indigo-400 transition-all text-[10px] flex items-center justify-center gap-1 w-full"
                  >
                    ✓ Aplicar clasificación sugerida por el sistema
                  </button>
                </div>
              )}

              {/* Formulario de Clasificación */}
              <div className="space-y-3.5 border-t border-slate-850 pt-3.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-extrabold block">Campos de Indexación</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block">Asociar a OT de Destino</label>
                    <select
                      value={classifyOt}
                      onChange={(e) => {
                        setClassifyOt(e.target.value);
                        const o = ots.find(ot => ot.codigo === e.target.value);
                        if (o) setClassifyPlanta(o.plantaNombre);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="">-- Dejar sin vincular --</option>
                      {ots.map((o) => (
                        <option key={o.codigo} value={o.codigo} className="bg-slate-950 text-white font-mono">
                          {o.codigo} - {o.plantaNombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block">Planta / Parque</label>
                    <input
                      type="text"
                      disabled
                      value={classifyPlanta}
                      onChange={(e) => setClassifyPlanta(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-500 outline-none font-mono opacity-70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block">Identificador Activo</label>
                    <input
                      type="text"
                      placeholder="Ej: INV-02"
                      value={classifyActivo}
                      onChange={(e) => setClassifyActivo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block">Fase de Evidencia</label>
                    <select
                      value={classifyType}
                      onChange={(e) => setClassifyType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="before">Antes de la intervención (Sucio)</option>
                      <option value="during">Durante el mantenimiento</option>
                      <option value="after">Después de la intervención (Limpio)</option>
                      <option value="hse">Firma Seguridad / HSE / LOTO</option>
                      <option value="spare">Repuestos / Materiales de reemplazo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block">Checklist Relacionado (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Soplado filtros"
                      value={classifyChecklist}
                      onChange={(e) => setClassifyChecklist(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-500 uppercase block">Estado de Clasificación</label>
                    <select
                      value={classifyStatus}
                      onChange={(e) => setClassifyStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white outline-none mt-1 focus:border-indigo-500 font-mono"
                    >
                      <option value="Sin clasificar">📂 Sin clasificar (Permanecer en bandeja)</option>
                      <option value="Clasificada">🔵 Clasificada (Revisada, no aprobada)</option>
                      <option value="Vinculada a OT">🟢 Vinculada a OT (Pendiente aprobación)</option>
                      <option value="Requiere revisión">🟡 Requiere revisión (Enviar alerta a técnico)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleReturnEvidence}
                className="px-3.5 py-1.5 bg-rose-950/30 hover:bg-rose-900 hover:text-white text-rose-400 font-bold font-mono text-xs rounded-xl border border-rose-900/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <ThumbsDown className="h-4 w-4" /> Devolver a Técnico
              </button>
              
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsClassifyModalOpen(false);
                    setSelectedExternalEvidence(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white font-mono text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveClassification(false)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 font-bold font-mono text-xs rounded-xl transition-all"
                >
                  Guardar
                </button>
                <button
                  onClick={() => handleSaveClassification(true)}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black font-mono text-xs rounded-xl transition-all flex items-center gap-1 shadow-md shadow-emerald-950/40"
                >
                  <CheckCircle2 className="h-4 w-4" /> Aprobar e Integrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
