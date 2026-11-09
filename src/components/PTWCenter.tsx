/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  User,
  Users,
  Activity,
  AlertTriangle,
  Award,
  Check,
  X,
  PlusCircle,
  Calendar,
  Layers,
  MapPin,
  ClipboardList,
  ShieldAlert,
  ArrowRight,
  FileCheck,
  RotateCcw,
  UserCheck,
  Trash2,
  Lock,
  Download,
  CheckSquare,
  Square,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OT, Planta, OrganigramaNode, PTW, PTWEstado } from '../types';

interface PTWCenterProps {
  ptws: PTW[];
  ots: OT[];
  plantas: Planta[];
  organigrama: OrganigramaNode[];
  onUpdatePtws: (updatedPtws: PTW[]) => void;
  onUpdateOts: (updatedOts: OT[]) => void;
  userRole: string;
  activeUserName: string;
  onAddAuditLog: (
    accion: string,
    modulo: string,
    otCode?: string,
    plantaName?: string,
    comentario?: string,
    criticidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  ) => void;
}

export default function PTWCenter({
  ptws = [],
  ots = [],
  plantas = [],
  organigrama = [],
  onUpdatePtws,
  onUpdateOts,
  userRole,
  activeUserName,
  onAddAuditLog
}: PTWCenterProps) {
  // Filtros y búsquedas
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanta, setSelectedPlanta] = useState('Todas');
  const [selectedEstado, setSelectedEstado] = useState<string>('Todos');

  // Control de modales y vistas
  const [selectedPtw, setSelectedPtw] = useState<PTW | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Formulario de creación
  const [newPtw, setNewPtw] = useState<Partial<PTW>>({
    id: '',
    codigo: '',
    otCodigos: [],
    tecnicos: [],
    plantaId: '',
    plantaNombre: '',
    tipoTrabajo: '',
    fechaInicio: '',
    fechaFin: '',
    lugar: '',
    equipoIntervenir: '',
    alcance: '',
    observaciones: '',
    requiereAST: true,
    astAsociadoId: '',
    astAsociadoComentario: '',
    estado: 'Borrador'
  });

  // Filtros de OTs disponibles para vincular en el form
  const [availableOtsForPlanta, setAvailableOtsForPlanta] = useState<OT[]>([]);
  const [selectedOtsInForm, setSelectedOtsInForm] = useState<string[]>([]);
  const [newTechnicianInput, setNewTechnicianInput] = useState('');

  // Firma electrónica temporales
  const [techSignatureName, setTechSignatureName] = useState('');
  const [supSignatureName, setSupSignatureName] = useState('');
  const [finalComments, setFinalComments] = useState('');

  // Determinar si el usuario es supervisor o de oficina central (Supervisor/Jefe/Coordinador/HSE)
  const isSupervisor = [
    'SUPER_ADMIN_ORBI',
    'JEFE_OM',
    'COORDINADOR_OM',
    'SUPERVISOR_TERRENO',
    'HSE'
  ].includes(userRole);

  const isTechnician = ['TECNICO_OM', 'INGENIERO_OM'].includes(userRole);

  // Actualizar OTs disponibles al cambiar de planta en formulario
  useEffect(() => {
    if (newPtw.plantaId) {
      const selectedPlt = plantas.find(p => p.id === newPtw.plantaId);
      const filtered = ots.filter(ot => ot.plantaId === newPtw.plantaId);
      setAvailableOtsForPlanta(filtered);
      
      setNewPtw(prev => ({
        ...prev,
        plantaNombre: selectedPlt ? selectedPlt.name : ''
      }));
    } else {
      setAvailableOtsForPlanta([]);
    }
  }, [newPtw.plantaId, plantas, ots]);

  // Manejar el autocompletado del formulario al seleccionar una OT primaria
  const handleSelectPrimaryOtInForm = (otCodigo: string) => {
    const selectedOtObj = ots.find(ot => ot.codigo === otCodigo);
    if (selectedOtObj) {
      const suggestedCode = `PTS-${selectedOtObj.plantaNombre.substring(0, 4).toUpperCase().replace(/\s+/g, '')}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      
      // Obtener técnicos sugeridos de la OT
      const techList = selectedOtObj.tecnicoAsignado && selectedOtObj.tecnicoAsignado !== 'No asignado'
        ? [selectedOtObj.tecnicoAsignado]
        : selectedOtObj.responsable 
          ? [selectedOtObj.responsable]
          : [];

      setNewPtw(prev => ({
        ...prev,
        codigo: suggestedCode,
        id: suggestedCode,
        plantaId: selectedOtObj.plantaId,
        plantaNombre: selectedOtObj.plantaNombre,
        tipoTrabajo: selectedOtObj.tipo === 'Preventiva' ? 'Mantenimiento Preventivo' : 'Mantenimiento Correctivo',
        fechaInicio: selectedOtObj.fechaInicio ? `${selectedOtObj.fechaInicio} 08:30` : '2026-07-07 08:30',
        fechaFin: selectedOtObj.fechaLimite ? `${selectedOtObj.fechaLimite} 17:30` : '2026-07-15 17:30',
        lugar: selectedOtObj.activo || 'Área de inversores',
        equipoIntervenir: selectedOtObj.activo || 'Inversores SMA',
        alcance: selectedOtObj.observaciones || '',
        tecnicos: techList,
        requiereAST: selectedOtObj.requiereAST !== undefined ? selectedOtObj.requiereAST : true,
        astAsociadoId: selectedOtObj.requiereAST ? `AST-${selectedOtObj.plantaNombre.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}` : ''
      }));

      setSelectedOtsInForm([otCodigo]);
    }
  };

  // Agregar técnico a lista de cuadrilla
  const handleAddTechnician = () => {
    if (newTechnicianInput.trim() && !newPtw.tecnicos?.includes(newTechnicianInput.trim())) {
      setNewPtw(prev => ({
        ...prev,
        tecnicos: [...(prev.tecnicos || []), newTechnicianInput.trim()]
      }));
      setNewTechnicianInput('');
    }
  };

  const handleRemoveTechnician = (tech: string) => {
    setNewPtw(prev => ({
      ...prev,
      tecnicos: (prev.tecnicos || []).filter(t => t !== tech)
    }));
  };

  // Crear permiso mock
  const handleSavePtw = () => {
    if (!newPtw.codigo || !newPtw.plantaId || selectedOtsInForm.length === 0) {
      alert('Por favor complete los campos obligatorios: Código de Permiso, Planta y al menos 1 OT vinculada.');
      return;
    }

    const ptwRecord: PTW = {
      id: newPtw.codigo,
      codigo: newPtw.codigo,
      otCodigos: selectedOtsInForm,
      tecnicos: newPtw.tecnicos && newPtw.tecnicos.length > 0 ? newPtw.tecnicos : ['Personal de Terreno'],
      plantaId: newPtw.plantaId,
      plantaNombre: newPtw.plantaNombre || 'Planta',
      tipoTrabajo: newPtw.tipoTrabajo || 'Mantenimiento General',
      fechaInicio: newPtw.fechaInicio || '2026-07-07 08:30',
      fechaFin: newPtw.fechaFin || '2026-07-15 17:30',
      lugar: newPtw.lugar || 'Campo Solar',
      equipoIntervenir: newPtw.equipoIntervenir || 'Módulos/Inversores',
      alcance: newPtw.alcance || 'Alcance de trabajos',
      observaciones: newPtw.observaciones || '',
      requiereAST: !!newPtw.requiereAST,
      astAsociadoId: newPtw.astAsociadoId || '',
      astAsociadoComentario: newPtw.astAsociadoComentario || '',
      estado: 'Pendiente apertura', // Por defecto directo a pendiente de firmas de apertura
      creadoPor: activeUserName,
      creadoFecha: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedPtws = [ptwRecord, ...ptws];
    onUpdatePtws(updatedPtws);

    // Actualizar también las OTs asociadas para indicar que tienen permiso vinculado
    const updatedOts = ots.map(ot => {
      if (selectedOtsInForm.includes(ot.codigo)) {
        return {
          ...ot,
          permisoTrabajoNumero: ptwRecord.codigo,
          requierePermisoTrabajo: true
        };
      }
      return ot;
    });
    onUpdateOts(updatedOts);

    onAddAuditLog(
      'Creación Permiso Trabajo',
      'PTW Center',
      selectedOtsInForm[0],
      ptwRecord.plantaNombre,
      `Se creó el permiso de trabajo mock ${ptwRecord.codigo} asociado a las OTs: ${selectedOtsInForm.join(', ')}`,
      'Media'
    );

    setIsCreating(false);
    // Reset form
    setNewPtw({
      id: '',
      codigo: '',
      otCodigos: [],
      tecnicos: [],
      plantaId: '',
      plantaNombre: '',
      tipoTrabajo: '',
      fechaInicio: '',
      fechaFin: '',
      lugar: '',
      equipoIntervenir: '',
      alcance: '',
      observaciones: '',
      requiereAST: true,
      astAsociadoId: '',
      astAsociadoComentario: '',
      estado: 'Borrador'
    });
    setSelectedOtsInForm([]);
  };

  // Eliminar permiso
  const handleDeletePtw = (ptwId: string) => {
    if (confirm(`¿Está seguro de eliminar el permiso ${ptwId}?`)) {
      const updated = ptws.filter(p => p.id !== ptwId);
      onUpdatePtws(updated);
      onAddAuditLog('Eliminación Permiso', 'PTW Center', undefined, undefined, `Se eliminó el permiso ${ptwId}`, 'Alta');
    }
  };

  // Filtrado de la lista de permisos
  const filteredPtws = ptws.filter(ptw => {
    const matchesSearch =
      ptw.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ptw.plantaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ptw.tecnicos.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ptw.tipoTrabajo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ptw.otCodigos.some(ot => ot.includes(searchTerm));

    const matchesPlanta = selectedPlanta === 'Todas' || ptw.plantaId === selectedPlanta;
    const matchesEstado = selectedEstado === 'Todos' || ptw.estado === selectedEstado;

    return matchesSearch && matchesPlanta && matchesEstado;
  });

  // Métricas del dashboard
  const totalPtws = ptws.length;
  const enEjecucionCount = ptws.filter(p => p.estado === 'En ejecución').length;
  const pendientesAprobacionCount = ptws.filter(p => p.estado === 'En revisión supervisor').length;
  const aprobadosCount = ptws.filter(p => p.estado === 'Aprobado').length;

  // Acciones de firmas en el visualizador (Mock)
  const handleSignOpeningTech = (ptw: PTW) => {
    if (!techSignatureName.trim()) {
      alert('Por favor ingrese el nombre para firmar.');
      return;
    }
    const updated = ptws.map(p => {
      if (p.id === ptw.id) {
        const nextEstado: PTWEstado = p.firmaAperturaSupervisor ? 'En ejecución' : 'Apertura firmada';
        return {
          ...p,
          firmaAperturaTecnico: techSignatureName,
          firmaAperturaTecnicoFecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          estado: nextEstado
        };
      }
      return p;
    });
    onUpdatePtws(updated);
    
    // Si pasa a en ejecución, actualizar OTs vinculadas a "En ejecución" si correspondiera
    const isNowExecuting = updated.find(p => p.id === ptw.id)?.estado === 'En ejecución';
    if (isNowExecuting) {
      const updatedOts = ots.map(ot => {
        if (ptw.otCodigos.includes(ot.codigo) && ot.estado === 'Asignada') {
          return { ...ot, estado: 'En ejecución' as const };
        }
        return ot;
      });
      onUpdateOts(updatedOts);
    }

    onAddAuditLog(
      'Firma Apertura Técnico',
      'PTW Center',
      ptw.otCodigos[0],
      ptw.plantaNombre,
      `Técnico ${techSignatureName} firmó apertura de PTS ${ptw.codigo}`,
      'Baja'
    );
    
    setTechSignatureName('');
    // Actualizar detalle
    setSelectedPtw(updated.find(p => p.id === ptw.id) || null);
  };

  const handleSignOpeningSupervisor = (ptw: PTW) => {
    if (!supSignatureName.trim()) {
      alert('Por favor ingrese el nombre para firmar.');
      return;
    }
    const updated = ptws.map(p => {
      if (p.id === ptw.id) {
        const nextEstado: PTWEstado = p.firmaAperturaTecnico ? 'En ejecución' : 'Apertura firmada';
        return {
          ...p,
          firmaAperturaSupervisor: supSignatureName,
          firmaAperturaSupervisorFecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          estado: nextEstado
        };
      }
      return p;
    });
    onUpdatePtws(updated);

    const isNowExecuting = updated.find(p => p.id === ptw.id)?.estado === 'En ejecución';
    if (isNowExecuting) {
      const updatedOts = ots.map(ot => {
        if (ptw.otCodigos.includes(ot.codigo) && ot.estado === 'Asignada') {
          return { ...ot, estado: 'En ejecución' as const };
        }
        return ot;
      });
      onUpdateOts(updatedOts);
    }

    onAddAuditLog(
      'Firma Apertura Supervisor',
      'PTW Center',
      ptw.otCodigos[0],
      ptw.plantaNombre,
      `Supervisor ${supSignatureName} firmó apertura de PTS ${ptw.codigo}`,
      'Baja'
    );

    setSupSignatureName('');
    setSelectedPtw(updated.find(p => p.id === ptw.id) || null);
  };

  const handleSignClosingTech = (ptw: PTW) => {
    if (!techSignatureName.trim()) {
      alert('Por favor ingrese el nombre para firmar.');
      return;
    }
    const updated = ptws.map(p => {
      if (p.id === ptw.id) {
        return {
          ...p,
          firmaCierreTecnico: techSignatureName,
          firmaCierreTecnicoFecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          comentariosFinales: finalComments || p.comentariosFinales,
          estado: 'En revisión supervisor' as const // Al firmar cierre el técnico, va a revisión
        };
      }
      return p;
    });
    onUpdatePtws(updated);

    onAddAuditLog(
      'Firma Cierre Técnico',
      'PTW Center',
      ptw.otCodigos[0],
      ptw.plantaNombre,
      `Técnico ${techSignatureName} firmó cierre de PTS ${ptw.codigo} y envió a revisión supervisor`,
      'Media'
    );

    setTechSignatureName('');
    setFinalComments('');
    setSelectedPtw(updated.find(p => p.id === ptw.id) || null);
  };

  const handleApprovePtw = (ptw: PTW) => {
    const updated = ptws.map(p => {
      if (p.id === ptw.id) {
        return {
          ...p,
          firmaCierreSupervisor: activeUserName,
          firmaCierreSupervisorFecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          estado: 'Aprobado' as const,
          listoSharePoint: true // Marca para SharePoint Router
        };
      }
      return p;
    });
    onUpdatePtws(updated);

    onAddAuditLog(
      'Aprobación Permiso Trabajo',
      'PTW Center',
      ptw.otCodigos[0],
      ptw.plantaNombre,
      `Supervisor ${activeUserName} aprobó y cerró PTS ${ptw.codigo}. Listo para SharePoint Router.`,
      'Alta'
    );

    setSelectedPtw(updated.find(p => p.id === ptw.id) || null);
  };

  const handleRejectPtw = (ptw: PTW) => {
    const reason = prompt('Por favor ingrese el motivo de la devolución o rechazo:');
    if (reason === null) return; // Cancelado

    const updated = ptws.map(p => {
      if (p.id === ptw.id) {
        return {
          ...p,
          estado: 'Rechazado / corregir' as const,
          comentariosFinales: `Rechazado por supervisor: ${reason}`
        };
      }
      return p;
    });
    onUpdatePtws(updated);

    onAddAuditLog(
      'Rechazo Permiso Trabajo',
      'PTW Center',
      ptw.otCodigos[0],
      ptw.plantaNombre,
      `Supervisor devolvió PTS ${ptw.codigo}. Motivo: ${reason}`,
      'Media'
    );

    setSelectedPtw(updated.find(p => p.id === ptw.id) || null);
  };

  return (
    <div className="space-y-6">
      
      {/* TÍTULO PRINCIPAL DE LA VISTA */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20 uppercase">MÓDULO 5 — PTW Center</span>
            <span className="text-xs font-mono text-slate-500">Tritec-Intervento O&amp;M Standard</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <ShieldAlert className="h-5.5 w-5.5 text-emerald-400" /> PTW Center — Permisos de Trabajo Seguro
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión digital integrada de permisos (PTS) y análisis de riesgo AST vinculados directamente a las órdenes de trabajo.
          </p>
        </div>

        {isSupervisor && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg"
          >
            <PlusCircle className="h-4 w-4" /> Crear PTS Mock
          </button>
        )}
      </div>

      {/* DASHBOARD CARD STATS */}
      {!isTechnician && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Total Permisos</span>
              <h3 className="text-xl font-black text-white mt-0.5">{totalPtws}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
              <FileText className="h-5 w-5 text-slate-400" />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase">En Ejecución</span>
              <h3 className="text-xl font-black text-amber-400 mt-0.5">{enEjecucionCount}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Activity className="h-5 w-5 text-amber-400" />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase">Revisión Supervisor</span>
              <h3 className="text-xl font-black text-indigo-400 mt-0.5">{pendientesAprobacionCount}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Clock className="h-5 w-5 text-indigo-400" />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase">Aprobados / Listos SP</span>
              <h3 className="text-xl font-black text-emerald-400 mt-0.5">{aprobadosCount}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <FileCheck className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL: LISTADO & VISUALIZADOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: BUSCADOR Y LISTA DE PERMISOS */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* BARRA DE FILTROS */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por código, técnica, OT, planta..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-emerald-500/50 outline-none placeholder:text-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono text-slate-500 block mb-1">PLANTA / PARQUE</label>
                <select
                  value={selectedPlanta}
                  onChange={e => setSelectedPlanta(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-[11px] text-white rounded-lg p-1.5 focus:border-emerald-500/50 outline-none"
                >
                  <option value="Todas">Todas</option>
                  {plantas.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-mono text-slate-500 block mb-1">ESTADO DEL PTS</label>
                <select
                  value={selectedEstado}
                  onChange={e => setSelectedEstado(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-[11px] text-white rounded-lg p-1.5 focus:border-emerald-500/50 outline-none"
                >
                  <option value="Todos">Todos</option>
                  <option value="Pendiente apertura">Pendiente apertura</option>
                  <option value="Apertura firmada">Apertura firmada</option>
                  <option value="En ejecución">En ejecución</option>
                  <option value="En revisión supervisor">En revisión supervisor</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Rechazado / corregir">Rechazado</option>
                </select>
              </div>
            </div>
          </div>

          {/* LISTA DE PERMISOS */}
          <div className="bg-slate-950 rounded-xl border border-slate-900 overflow-hidden divide-y divide-slate-900 max-h-[600px] overflow-y-auto custom-scrollbar">
            <div className="px-4 py-3 bg-slate-900/40 flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-slate-400">PTS REGISTRADOS ({filteredPtws.length})</span>
              <span className="text-[9px] font-mono text-slate-500">Filtrado activo</span>
            </div>

            {filteredPtws.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500 font-mono">No se encontraron permisos de trabajo con los filtros aplicados.</p>
              </div>
            ) : (
              filteredPtws.map(ptw => {
                const isSelected = selectedPtw?.id === ptw.id;
                
                // Color badges por estado
                let badgeClass = 'bg-slate-900 text-slate-400 border border-slate-850';
                if (ptw.estado === 'En ejecución') badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                else if (ptw.estado === 'Aprobado') badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                else if (ptw.estado === 'En revisión supervisor') badgeClass = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
                else if (ptw.estado === 'Rechazado / corregir') badgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                else if (ptw.estado === 'Pendiente apertura') badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';

                return (
                  <div
                    key={ptw.id}
                    onClick={() => setSelectedPtw(ptw)}
                    className={`p-4 cursor-pointer hover:bg-slate-900/60 transition-all space-y-2.5 ${
                      isSelected ? 'bg-slate-900 border-l-2 border-emerald-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white font-mono">{ptw.codigo}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${badgeClass}`}>{ptw.estado}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{ptw.plantaNombre}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-600">{ptw.fechaInicio.split(' ')[0]}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-300 font-medium truncate">{ptw.tipoTrabajo}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        OTs: {ptw.otCodigos.join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        Técnicos: {ptw.tecnicos.join(', ')}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] border-t border-slate-900/80 pt-2 text-slate-500 font-mono">
                      <span>Inició: {ptw.fechaInicio}</span>
                      <div className="flex items-center gap-1.5">
                        {ptw.firmaAperturaTecnico && <span className="text-[9px] text-emerald-500">✓ Apertura</span>}
                        {ptw.firmaCierreTecnico && <span className="text-[9px] text-indigo-400">✓ Cierre</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: DOCUMENT VIEW & SIGNATURE FLOWS */}
        <div className="lg:col-span-7">
          
          {!selectedPtw ? (
            <div className="bg-slate-950 p-12 rounded-xl border border-slate-900 text-center h-full flex flex-col justify-center items-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-500">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-300">Visualizador de Documentos PTS</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-mono">
                  Seleccione un permiso de trabajo de la lista de la izquierda para revisar firmas, alcance, requerimientos AST e historial.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* CONTROLES DE ESTADOS RÁPIDOS PARA TÉCNICO EN TERRENO */}
              {isTechnician && (
                <div className="bg-gradient-to-r from-emerald-950/40 to-slate-950 border border-emerald-500/20 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Panel de Firma Terreno (Simplificado)</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Técnico activo: {activeUserName}</p>
                    </div>
                  </div>

                  {selectedPtw.estado === 'Pendiente apertura' && (
                    <div className="space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                      <span className="text-[10px] font-mono text-emerald-400 block font-bold">1. VERIFICACIONES DE SEGURIDAD PRE-APERTURA:</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>EPP completo y en buen estado</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Procedimiento LOTO ejecutado</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>AST firmado en terreno</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Radio comunicación disponible</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-3 flex gap-2">
                        <input
                          type="text"
                          placeholder="Nombre para firma de apertura"
                          value={techSignatureName}
                          onChange={e => setTechSignatureName(e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-[11px] text-white px-3 py-1.5 rounded-lg outline-none flex-1 focus:border-emerald-500/50 placeholder:text-slate-600"
                        />
                        <button
                          onClick={() => handleSignOpeningTech(selectedPtw)}
                          className="bg-emerald-500 text-slate-950 font-bold font-mono text-[10px] px-3.5 py-1.5 rounded-lg hover:bg-emerald-400 transition-colors"
                        >
                          Firmar Apertura
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedPtw.estado === 'En ejecución' && (
                    <div className="space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                      <span className="text-[10px] font-mono text-amber-400 block font-bold">2. FINALIZACIÓN Y CIERRE DE TRABAJO:</span>
                      
                      <div className="text-[10px] text-slate-400 font-mono leading-relaxed">
                        Confirme que el área quedó limpia, sin herramientas sueltas, y los disyuntores de seguridad se re-establecieron adecuadamente.
                      </div>

                      <div className="space-y-2">
                        <textarea
                          placeholder="Comentarios finales de terreno (ej. Todo operando sin alarmas)"
                          value={finalComments}
                          onChange={e => setFinalComments(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-[11px] text-white p-2 rounded-lg outline-none focus:border-emerald-500/50 placeholder:text-slate-600 h-16 resize-none font-mono"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nombre para firma de cierre"
                            value={techSignatureName}
                            onChange={e => setTechSignatureName(e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-[11px] text-white px-3 py-1.5 rounded-lg outline-none flex-1 focus:border-emerald-500/50 placeholder:text-slate-600"
                          />
                          <button
                            onClick={() => handleSignClosingTech(selectedPtw)}
                            className="bg-indigo-500 text-white font-bold font-mono text-[10px] px-3.5 py-1.5 rounded-lg hover:bg-indigo-400 transition-colors"
                          >
                            Firmar Cierre
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPtw.estado === 'En revisión supervisor' && (
                    <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-850 text-[11px] text-slate-400 font-mono text-center">
                      ⏳ Trabajo finalizado y firmado por terreno. Esperando revisión y firmas de supervisor.
                    </div>
                  )}

                  {selectedPtw.estado === 'Aprobado' && (
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-[11px] text-emerald-400 font-mono text-center flex items-center justify-center gap-1.5">
                      <CheckCircle className="h-4 w-4" /> Permiso Aprobado. Documento listo para archivo SharePoint.
                    </div>
                  )}
                </div>
              )}

              {/* CONTROLES DE ESTADOS PARA SUPERVISOR / HSE */}
              {isSupervisor && (
                <div className="bg-gradient-to-r from-indigo-950/40 to-slate-950 border border-indigo-500/20 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Panel de Revisión y Control (Supervisor)</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Rol activo: {userRole} ({activeUserName})</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Firma de Apertura por Supervisor si está pendiente */}
                    {selectedPtw.estado === 'Pendiente apertura' && !selectedPtw.firmaAperturaSupervisor && (
                      <div className="flex gap-2 w-full bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                        <input
                          type="text"
                          placeholder="Nombre supervisor para autorizar apertura"
                          value={supSignatureName}
                          onChange={e => setSupSignatureName(e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-[11px] text-white px-3 py-1.5 rounded-lg outline-none flex-1 focus:border-indigo-500/50 placeholder:text-slate-600"
                        />
                        <button
                          onClick={() => handleSignOpeningSupervisor(selectedPtw)}
                          className="bg-indigo-500 text-white font-bold font-mono text-[10px] px-3.5 py-1.5 rounded-lg hover:bg-indigo-400 transition-colors"
                        >
                          Firmar Apertura
                        </button>
                      </div>
                    )}

                    {/* Acciones para revisión del cierre de terreno */}
                    {selectedPtw.estado === 'En revisión supervisor' && (
                      <div className="w-full space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                        <span className="text-[10px] font-mono text-indigo-400 block font-bold">REVISIÓN DE DOCUMENTOS Y CIERRE TÉCNICO:</span>
                        
                        <div className="text-[10px] text-slate-400 font-mono leading-relaxed">
                          Técnico firmó el término del permiso. Revise el alcance abajo, verifique las firmas de terreno, y apruebe el ruteo a SharePoint Router.
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleApprovePtw(selectedPtw)}
                            className="flex-1 bg-emerald-500 text-slate-950 font-bold font-mono text-[10px] py-2 rounded-lg hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5 shadow"
                          >
                            <Check className="h-3.5 w-3.5" /> Aprobar PTS y Enviar a SharePoint
                          </button>
                          <button
                            onClick={() => handleRejectPtw(selectedPtw)}
                            className="flex-1 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-slate-950 font-bold font-mono text-[10px] py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <X className="h-3.5 w-3.5" /> Devolver / Corregir
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedPtw.estado === 'Aprobado' && (
                      <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-[10px] text-emerald-400 font-mono w-full flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4" /> APROBADO: Documento indexado para SharePoint carpeta '04 - Permisos de Trabajo'.
                        </span>
                        <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded text-[8px]">
                          VIRTUAL COMPLETED
                        </span>
                      </div>
                    )}

                    {selectedPtw.estado === 'Rechazado / corregir' && (
                      <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 text-[10px] text-rose-400 font-mono w-full">
                        ⚠️ DEVUELTO A TERRENO: Esperando que el técnico corrija y vuelva a firmar.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DOCUMENT LAYOUT (TRITEC-INTERVENTO O&M FORMAT MOCK) */}
              <div className="bg-white text-slate-950 rounded-2xl p-6 shadow-2xl border border-slate-300 font-sans text-left relative overflow-hidden select-text">
                
                {/* DECORACIÓN MARCA DE AGUA */}
                <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center pointer-events-none select-none">
                  <div className="text-[120px] font-black rotate-45 tracking-widest">TRITEC</div>
                </div>

                {/* LOGO Y ENCABEZADO */}
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black tracking-widest text-slate-900">TRITEC-INTERVENTO</h3>
                    <p className="text-[9px] font-mono font-bold tracking-widest text-slate-500 leading-none">OPERATION &amp; MAINTENANCE</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-slate-900 text-white text-[9px] font-bold font-mono px-2 py-1 rounded">
                      FORMULARIO PTS-01
                    </span>
                    <div className="text-xs font-mono font-black text-slate-900 mt-1.5">{selectedPtw.codigo}</div>
                  </div>
                </div>

                {/* TÍTULO DEL DOCUMENTO */}
                <div className="my-5 text-center">
                  <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
                    PERMISO DE TRABAJO SEGURO (PTS)
                  </h1>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wide">
                    Autorización de Seguridad para Actividades en Instalaciones Fotovoltaicas
                  </p>
                </div>

                {/* SECCIÓN 1: IDENTIFICACIÓN DEL TRABAJO */}
                <div className="space-y-2 border border-slate-300 rounded-lg p-3 bg-slate-50 mb-4">
                  <h4 className="text-[11px] font-black tracking-wide text-slate-900 uppercase border-b border-slate-300 pb-1 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-900"></span> 1. Identificación del Trabajo y Ubicación
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-mono text-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[9px]">PLANTA / PARQUE SOLAR:</span>
                      <strong className="text-slate-950 font-bold">{selectedPtw.plantaNombre}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">LUGAR / SECTOR ESPECÍFICO:</span>
                      <strong className="text-slate-950 font-bold">{selectedPtw.lugar}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">FECHA/HORA ESTIMADA INICIO:</span>
                      <strong className="text-slate-950 font-bold">{selectedPtw.fechaInicio}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">FECHA/HORA ESTIMADA TÉRMINO:</span>
                      <strong className="text-slate-950 font-bold">{selectedPtw.fechaFin}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[9px]">TIPO DE TRABAJO PRINCIPAL:</span>
                      <strong className="text-slate-950 font-bold">{selectedPtw.tipoTrabajo}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[9px]">ORDENES DE TRABAJO (OT) VINCULADAS:</span>
                      <div className="flex gap-1.5 mt-0.5">
                        {(selectedPtw.otCodigos || []).map(code => (
                          <span key={code} className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[8.5px] font-black border border-slate-300">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2: ALCANCE Y EQUIPOS */}
                <div className="space-y-2 border border-slate-300 rounded-lg p-3 bg-slate-50 mb-4">
                  <h4 className="text-[11px] font-black tracking-wide text-slate-900 uppercase border-b border-slate-300 pb-1 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-900"></span> 2. Alcance Detallado y Equipos a Intervenir
                  </h4>
                  <div className="text-[10px] text-slate-800 space-y-2">
                    <div>
                      <span className="text-slate-500 block text-[9px]">ALCANCE OPERACIONAL:</span>
                      <p className="leading-relaxed whitespace-pre-line bg-white p-2 rounded border border-slate-200 font-mono text-[9.5px]">
                        {selectedPtw.alcance}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">EQUIPO / COMPONENTE PRINCIPAL A INTERVENIR:</span>
                      <strong className="text-slate-950 font-bold font-mono text-[9.5px]">{selectedPtw.equipoIntervenir}</strong>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 3: ANALISIS DE SEGURIDAD Y CUADRILLA */}
                <div className="space-y-2 border border-slate-300 rounded-lg p-3 bg-slate-50 mb-4">
                  <h4 className="text-[11px] font-black tracking-wide text-slate-900 uppercase border-b border-slate-300 pb-1 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-900"></span> 3. Análisis de Riesgos y Personal Autorizado
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[9px]">REQUIERE ANÁLISIS SEGURO AST:</span>
                      <strong className="text-slate-950 font-bold">{selectedPtw.requiereAST ? 'SÍ (OBLIGATORIO)' : 'NO'}</strong>
                      {selectedPtw.requiereAST && (
                        <div className="mt-1 bg-white p-1.5 rounded border border-slate-200 text-[8.5px] font-mono leading-tight">
                          <div>AST ID: {selectedPtw.astAsociadoId || 'AST-AUTO-GEN'}</div>
                          {selectedPtw.astAsociadoComentario && <div className="text-slate-500 mt-0.5">{selectedPtw.astAsociadoComentario}</div>}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[9px]">CUADRILLA / TÉCNICOS AUTORIZADOS:</span>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5 font-mono text-[9.5px]">
                        {(selectedPtw.tecnicos || []).map(t => (
                          <li key={t} className="text-slate-950 font-bold">{t}</li>
                        ))}
                      </ul>
                    </div>

                    {selectedPtw.observaciones && (
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[9px]">RECOMENDACIONES GENERALES Y LOTO:</span>
                        <p className="bg-amber-50 text-amber-950 p-2 rounded border border-amber-200 leading-normal text-[9px] font-mono">
                          ⚠️ {selectedPtw.observaciones}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECCIÓN 4: FIRMAS DE APERTURA (MOCK) */}
                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 mb-4">
                  <h4 className="text-[11px] font-black tracking-wide text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2.5 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-900"></span> 4. Firmas de Apertura de Actividad
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
                    <div className="border border-slate-200 bg-white p-2.5 rounded-lg flex flex-col justify-between h-24">
                      <span className="text-slate-500 text-[8px] uppercase block">TÉCNICO EJECUTOR / CUADRILLA:</span>
                      {selectedPtw.firmaAperturaTecnico ? (
                        <div className="text-center py-2">
                          <span className="font-serif italic font-black text-slate-800 text-sm tracking-wide bg-slate-100/40 px-2.5 py-1 rounded border border-slate-200">
                            {selectedPtw.firmaAperturaTecnico}
                          </span>
                          <span className="block text-[8px] text-slate-400 mt-1.5">{selectedPtw.firmaAperturaTecnicoFecha}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-center block my-auto text-[9px] italic font-mono">[Firma Apertura Pendiente]</span>
                      )}
                    </div>

                    <div className="border border-slate-200 bg-white p-2.5 rounded-lg flex flex-col justify-between h-24">
                      <span className="text-slate-500 text-[8px] uppercase block">SUPERVISOR DE TERRENO / HSE:</span>
                      {selectedPtw.firmaAperturaSupervisor ? (
                        <div className="text-center py-2">
                          <span className="font-serif italic font-black text-slate-800 text-sm tracking-wide bg-slate-100/40 px-2.5 py-1 rounded border border-slate-200">
                            {selectedPtw.firmaAperturaSupervisor}
                          </span>
                          <span className="block text-[8px] text-slate-400 mt-1.5">{selectedPtw.firmaAperturaSupervisorFecha}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-center block my-auto text-[9px] italic font-mono">[Firma Apertura Pendiente]</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 5: FIRMAS DE CIERRE DE ACTIVIDAD (MOCK) */}
                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                  <h4 className="text-[11px] font-black tracking-wide text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2.5 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-900"></span> 5. Firmas de Cierre y Conclusión
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
                    <div className="col-span-2">
                      <span className="text-slate-500 text-[8px] uppercase block mb-1">COMENTARIOS DE TÉRMINO EN PLANTA:</span>
                      <p className="bg-white p-2 rounded border border-slate-200 text-[9px] leading-normal font-mono min-h-10 text-slate-800">
                        {selectedPtw.comentariosFinales || 'Sin comentarios registrados aún.'}
                      </p>
                    </div>

                    <div className="border border-slate-200 bg-white p-2.5 rounded-lg flex flex-col justify-between h-24">
                      <span className="text-slate-500 text-[8px] uppercase block">TÉCNICO EJECUTOR (CIERRE):</span>
                      {selectedPtw.firmaCierreTecnico ? (
                        <div className="text-center py-2">
                          <span className="font-serif italic font-black text-slate-800 text-sm tracking-wide bg-slate-100/40 px-2.5 py-1 rounded border border-slate-200">
                            {selectedPtw.firmaCierreTecnico}
                          </span>
                          <span className="block text-[8px] text-slate-400 mt-1.5">{selectedPtw.firmaCierreTecnicoFecha}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-center block my-auto text-[9px] italic font-mono">[Firma Cierre Pendiente]</span>
                      )}
                    </div>

                    <div className="border border-slate-200 bg-white p-2.5 rounded-lg flex flex-col justify-between h-24">
                      <span className="text-slate-500 text-[8px] uppercase block">SUPERVISOR REVISIÓN (APROBADO):</span>
                      {selectedPtw.firmaCierreSupervisor ? (
                        <div className="text-center py-2">
                          <span className="font-serif italic font-black text-emerald-800 text-sm tracking-wide bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                            {selectedPtw.firmaCierreSupervisor}
                          </span>
                          <span className="block text-[8px] text-slate-400 mt-1.5">{selectedPtw.firmaCierreSupervisorFecha}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-center block my-auto text-[9px] italic font-mono">[Firma Aprobación Pendiente]</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* PIE DE PÁGINA MOCK */}
                <div className="mt-6 border-t border-slate-200 pt-3 flex justify-between items-center text-[8px] font-mono text-slate-400 leading-none">
                  <span>ORBI OT Center - Permisos de Trabajo Módulo 5</span>
                  <span>PREVIEW DIGITAL MOCK - NO ES UN DOCUMENTO LEGAL</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR PERMISO */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-emerald-400" /> Crear Nuevo Permiso de Trabajo (PTS) Mock
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs custom-scrollbar">
                
                {/* PLANTA & OT PRIMARIA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">PLANTA DE TRABAJO *</label>
                    <select
                      value={newPtw.plantaId || ''}
                      onChange={e => {
                        const pid = e.target.value;
                        setNewPtw(prev => ({ ...prev, plantaId: pid, otCodigos: [] }));
                        setSelectedOtsInForm([]);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500/50"
                    >
                      <option value="">-- Seleccione Planta --</option>
                      {plantas.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.zona})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">OT PRIMARIA * (AUTO-RELLENAR)</label>
                    <select
                      disabled={!newPtw.plantaId}
                      onChange={e => handleSelectPrimaryOtInForm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500/50 disabled:opacity-50"
                    >
                      <option value="">-- Seleccione OT Primaria --</option>
                      {availableOtsForPlanta.map(ot => (
                        <option key={ot.codigo} value={ot.codigo}>
                          {ot.codigo} — {ot.tipo} ({ot.responsable})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {newPtw.codigo && (
                  <>
                    {/* CÓDIGO & TIPO */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500 block mb-1">DESCRIPCIÓN TRABAJO (TIPO) *</label>
                        <input
                          type="text"
                          value={newPtw.tipoTrabajo || ''}
                          onChange={e => setNewPtw(prev => ({ ...prev, tipoTrabajo: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">CÓDIGO DE PTS *</label>
                        <input
                          type="text"
                          value={newPtw.codigo || ''}
                          onChange={e => setNewPtw(prev => ({ ...prev, codigo: e.target.value, id: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500/50 font-bold"
                        />
                      </div>
                    </div>

                    {/* VINCULACIÓN MULTI-OT */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 block">VINCULAR OTRAS OTS DEL MISMO PARQUE/DÍA</label>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar">
                        {availableOtsForPlanta.map(ot => {
                          const isChecked = selectedOtsInForm.includes(ot.codigo);
                          return (
                            <label key={ot.codigo} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 hover:text-white">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedOtsInForm(prev => prev.filter(c => c !== ot.codigo));
                                  } else {
                                    setSelectedOtsInForm(prev => [...prev, ot.codigo]);
                                  }
                                }}
                                className="accent-emerald-500"
                              />
                              <span><strong>{ot.codigo}</strong> - {ot.observaciones || ot.tipo} ({ot.responsable})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* FECHAS & LUGAR */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">FECHA/HORA INICIO *</label>
                        <input
                          type="text"
                          value={newPtw.fechaInicio || ''}
                          onChange={e => setNewPtw(prev => ({ ...prev, fechaInicio: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">FECHA/HORA TÉRMINO *</label>
                        <input
                          type="text"
                          value={newPtw.fechaFin || ''}
                          onChange={e => setNewPtw(prev => ({ ...prev, fechaFin: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">LUGAR / COMPARTIMIENTO *</label>
                        <input
                          type="text"
                          value={newPtw.lugar || ''}
                          onChange={e => setNewPtw(prev => ({ ...prev, lugar: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">EQUIPO A INTERVENIR *</label>
                        <input
                          type="text"
                          value={newPtw.equipoIntervenir || ''}
                          onChange={e => setNewPtw(prev => ({ ...prev, equipoIntervenir: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    {/* ALCANCE */}
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">ALCANCE DETALLADO DE TRABAJOS *</label>
                      <textarea
                        value={newPtw.alcance || ''}
                        onChange={e => setNewPtw(prev => ({ ...prev, alcance: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500/50 h-20 resize-none"
                      />
                    </div>

                    {/* GESTIÓN DE CUADRILLA */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 block">CUADRILLA DE TERRENO (MÁX 3)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nombre técnico (Ej: Rodrigo Cisterna)"
                          value={newTechnicianInput}
                          onChange={e => setNewTechnicianInput(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg outline-none flex-1 focus:border-emerald-500/50 placeholder:text-slate-700"
                        />
                        <button
                          type="button"
                          onClick={handleAddTechnician}
                          className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          + Agregar
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {newPtw.tecnicos?.map(tech => (
                          <span key={tech} className="bg-slate-950 text-slate-300 border border-slate-800 px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1">
                            {tech}
                            <button type="button" onClick={() => handleRemoveTechnician(tech)} className="text-rose-500 hover:text-rose-400 font-bold ml-1">×</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AST & LOTO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <input
                          type="checkbox"
                          id="form-ast-req"
                          checked={!!newPtw.requiereAST}
                          onChange={e => setNewPtw(prev => ({ ...prev, requiereAST: e.target.checked }))}
                          className="accent-emerald-500"
                        />
                        <label htmlFor="form-ast-req" className="text-[10px] text-slate-300 font-mono cursor-pointer select-none">
                          Requiere AST Asociado obligatorio
                        </label>
                      </div>

                      {newPtw.requiereAST && (
                        <div>
                          <input
                            type="text"
                            placeholder="AST Código (Ej: AST-CANT-2026-089)"
                            value={newPtw.astAsociadoId || ''}
                            onChange={e => setNewPtw(prev => ({ ...prev, astAsociadoId: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500/50 placeholder:text-slate-700 font-bold"
                          />
                        </div>
                      )}

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500 block mb-1">RECOMENDACIONES GENERALES / LOTO ESPECIAL</label>
                        <input
                          type="text"
                          placeholder="Ej: Bloqueo obligatorio de disyuntores de media tensión, candado rojo LOTO"
                          value={newPtw.observaciones || ''}
                          onChange={e => setNewPtw(prev => ({ ...prev, observaciones: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500/50 placeholder:text-slate-700"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/40">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={!newPtw.codigo || !newPtw.plantaId || selectedOtsInForm.length === 0}
                  onClick={handleSavePtw}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs rounded-lg transition-all"
                >
                  ✓ Generar PTS y Enviar a Terreno
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
