/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  ArrowUpRight,
  User,
  PlusCircle,
  MessageSquare,
  CheckCircle,
  Tag,
  MapPin,
  Clock,
  Shield,
  HelpCircle,
  X
} from 'lucide-react';
import { Escalation, OT, Planta } from '../types';

interface EscalationCenterProps {
  escalaciones: Escalation[];
  ots: OT[];
  plantas: Planta[];
  onUpdate: (updated: Escalation[]) => void;
  userRole: string;
  activeUserName: string;
  onAddAuditLog: (accion: string, modulo: string, otCode?: string, plantaName?: string, comentario?: string, criticidad?: any) => void;
  onUpdateOts?: (updatedOts: OT[]) => void;
}

export default function EscalationCenter({
  escalaciones,
  ots,
  plantas,
  onUpdate,
  userRole,
  activeUserName,
  onAddAuditLog,
  onUpdateOts,
}: EscalationCenterProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [filterCriticidad, setFilterCriticidad] = useState<string>('Todas');
  const [filterEscaladoA, setFilterEscaladoA] = useState<string>('Todos');

  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);

  // Formulario nuevo escalamiento
  const [newEsc, setNewEsc] = useState<Partial<Escalation>>({
    tipo: 'Actividad sin recurso',
    estado: 'Detectado',
    responsable: '',
    comentario: '',
    otVinculada: '',
    plantaVinculada: '',
    criticidad: 'Media',
    escaladoA: 'Jefe O&M'
  });

  const [commentInput, setCommentInput] = useState<string>('');

  const canManage = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'COORDINADOR_OM', 'SUPERVISOR_TERRENO', 'HSE', 'CALIDAD'].includes(userRole);

  const ESCALADO_DESTINOS = [
    'Jefe O&M',
    'Gerencia',
    'HSE',
    'Calidad',
    'Planificación',
    'Comisionamiento',
    'Logística / Bodega',
    'Cliente'
  ];

  const TIPOS_RIESGO = [
    'OT crítica vencida',
    'Actividad sin recurso',
    'Coordinador sobrecargado',
    'Supervisor sobrecargado',
    'Repuesto bloqueando ejecución',
    'Vehículo no disponible',
    'Riesgo HSE pendiente',
    'Hallazgo calidad pendiente',
    'Planta con recurrencia de fallas',
    'Riesgo de disponibilidad'
  ];

  const filtered = escalaciones.filter((e) => {
    const matchesSearch =
      e.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.responsable && e.responsable.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.comentario && e.comentario.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.otVinculada && e.otVinculada.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.plantaVinculada && e.plantaVinculada.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEstado = filterEstado === 'Todos' || e.estado === filterEstado;
    const matchesCriticidad = filterCriticidad === 'Todas' || e.criticidad === filterCriticidad;
    const matchesEscaladoA = filterEscaladoA === 'Todos' || e.escaladoA === filterEscaladoA;

    return matchesSearch && matchesEstado && matchesCriticidad && matchesEscaladoA;
  });

  const handleCreate = () => {
    if (!newEsc.tipo || !newEsc.comentario) {
      alert('Por favor complete la descripción o comentario de la situación de riesgo.');
      return;
    }

    const item: Escalation = {
      id: `ESC-${(escalaciones.length + 1).toString().padStart(3, '0')}`,
      tipo: newEsc.tipo!,
      estado: 'Escalado',
      responsable: newEsc.responsable || activeUserName,
      comentario: newEsc.comentario!,
      otVinculada: newEsc.otVinculada || undefined,
      plantaVinculada: newEsc.plantaVinculada || undefined,
      fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 16),
      criticidad: newEsc.criticidad as any || 'Media',
      escaladoA: newEsc.escaladoA as any || 'Jefe O&M'
    };

    const updated = [item, ...escalaciones];
    onUpdate(updated);
    setIsCreating(false);

    // If an OT is linked, automatically block it in the database
    if (item.otVinculada && onUpdateOts && ots) {
      const updatedOts = ots.map(o => {
        if (o.codigo === item.otVinculada) {
          return {
            ...o,
            estado: 'Bloqueada' as const,
            bloqueada: true,
            motivoBloqueo: `Bloqueado por riesgo escalado (${item.tipo}): ${item.comentario}`
          };
        }
        return o;
      });
      onUpdateOts(updatedOts);
    }

    // Registrar en auditoría
    onAddAuditLog(
      'Escalamiento creado',
      'Risk & Escalation Center',
      item.otVinculada,
      item.plantaVinculada,
      `Escalamiento de riesgo generado: ${item.tipo}. Escalado a: ${item.escaladoA}. Comentario: ${item.comentario}`,
      item.criticidad
    );

    // Reiniciar
    setNewEsc({
      tipo: 'Actividad sin recurso',
      estado: 'Detectado',
      responsable: '',
      comentario: '',
      otVinculada: '',
      plantaVinculada: '',
      criticidad: 'Media',
      escaladoA: 'Jefe O&M'
    });
  };

  const handleUpdateStatus = (escId: string, newStatus: any) => {
    const escItem = escalaciones.find(e => e.id === escId);
    if (!escItem) return;

    const updated = escalaciones.map((e) => {
      if (e.id === escId) {
        return { ...e, estado: newStatus };
      }
      return e;
    });

    onUpdate(updated);
    
    if (selectedEscalation && selectedEscalation.id === escId) {
      setSelectedEscalation({ ...selectedEscalation, estado: newStatus });
    }

    // Propagate resolution of escalation to linked OT
    if (escItem.otVinculada && onUpdateOts && ots) {
      if (newStatus === 'Solucionado' || newStatus === 'Mitigado') {
        const updatedOts = ots.map(o => {
          if (o.codigo === escItem.otVinculada) {
            return {
              ...o,
              estado: 'Asignada' as const,
              bloqueada: false,
              motivoBloqueo: undefined
            };
          }
          return o;
        });
        onUpdateOts(updatedOts);
      }
    }

    onAddAuditLog(
      'Cambio estado de escalamiento',
      'Risk & Escalation Center',
      escItem.otVinculada,
      escItem.plantaVinculada,
      `Escalamiento ${escId} modificado a estado: ${newStatus} por ${activeUserName}.`,
      escItem.criticidad
    );
  };

  const handleAddComment = () => {
    if (!selectedEscalation || !commentInput.trim()) return;

    const updated = escalaciones.map((e) => {
      if (e.id === selectedEscalation.id) {
        return {
          ...e,
          comentario: `${e.comentario}\n[${activeUserName} - ${new Date().toISOString().substring(11, 16)}]: ${commentInput}`
        };
      }
      return e;
    });

    onUpdate(updated);
    
    const target = updated.find(e => e.id === selectedEscalation.id);
    if (target) setSelectedEscalation(target);

    onAddAuditLog(
      'Comentario de Escalamiento',
      'Risk & Escalation Center',
      selectedEscalation.otVinculada,
      selectedEscalation.plantaVinculada,
      `Nuevo comentario en Escalamiento ${selectedEscalation.id}: ${commentInput}`,
      selectedEscalation.criticidad
    );

    setCommentInput('');
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Cerrado':
      case 'Resuelto':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Escalado':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse';
      case 'En gestión':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'En revisión':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      default:
        return 'bg-slate-900 text-slate-400 border border-slate-800';
    }
  };

  const getCriticidadColor = (criticidad: string) => {
    switch (criticidad) {
      case 'Crítica':
        return 'text-red-400 font-bold';
      case 'Alta':
        return 'text-orange-400 font-bold';
      case 'Media':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-5.5 w-5.5 text-rose-400" /> Risk & Escalation Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión centralizada de desviaciones críticas, bloqueos de ejecución, sobrecargas de personal y riesgos operativos O&M.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold text-xs font-mono px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition-all hover:scale-102"
          >
            <PlusCircle className="h-4 w-4" /> Registrar Riesgo / Escalamiento
          </button>
        )}
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por tipo, planta, OT, responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-rose-500/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todos" className="bg-slate-950 text-white">Todos los Estados</option>
            <option value="Detectado" className="bg-slate-950 text-white">Detectado</option>
            <option value="En revisión" className="bg-slate-950 text-white">En revisión</option>
            <option value="Escalado" className="bg-slate-950 text-white">Escalado</option>
            <option value="En gestión" className="bg-slate-950 text-white">En gestión</option>
            <option value="Resuelto" className="bg-slate-950 text-white">Resuelto</option>
            <option value="Cerrado" className="bg-slate-950 text-white">Cerrado</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={filterCriticidad}
            onChange={(e) => setFilterCriticidad(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todas" className="bg-slate-950 text-white">Todas las Criticidades</option>
            <option value="Baja" className="bg-slate-950 text-white">Baja</option>
            <option value="Media" className="bg-slate-950 text-white">Media</option>
            <option value="Alta" className="bg-slate-950 text-white">Alta</option>
            <option value="Crítica" className="bg-slate-950 text-white">Crítica</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={filterEscaladoA}
            onChange={(e) => setFilterEscaladoA(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todos" className="bg-slate-950 text-white">Todos los Destinatarios</option>
            {ESCALADO_DESTINOS.map((d) => (
              <option key={d} value={d} className="bg-slate-950 text-white">{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* REJILLA DE RIESGOS / ESCALAMIENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-slate-900/10 border border-slate-900 p-10 rounded-xl text-center text-slate-500 font-mono text-xs">
              No se registran situaciones de riesgo o escalamientos activos para los filtros aplicados.
            </div>
          ) : (
            filtered.map((e) => (
              <div
                key={e.id}
                onClick={() => setSelectedEscalation(e)}
                className={`bg-slate-900/30 hover:bg-slate-900/50 border rounded-xl p-5 cursor-pointer transition-all ${
                  selectedEscalation && selectedEscalation.id === e.id
                    ? 'border-rose-500 bg-slate-900/60'
                    : 'border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-rose-500/10 text-rose-400 font-mono text-[9px] px-1.5 py-0.5 rounded border border-rose-500/20">
                        {e.id}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${getStatusColor(e.estado)}`}>
                        {e.estado}
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {e.fechaHora}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{e.tipo}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono line-clamp-2">{e.comentario}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-slate-500 font-mono">
                      {e.otVinculada && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded">
                          <Tag className="h-3 w-3" /> {e.otVinculada}
                        </span>
                      )}
                      {e.plantaVinculada && (
                        <span className="inline-flex items-center gap-1 text-sky-400 bg-sky-500/5 px-1.5 py-0.5 rounded">
                          <MapPin className="h-3 w-3" /> {e.plantaVinculada}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> Reporta: {e.responsable}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-[10px] font-mono text-slate-500">Escalado A:</div>
                    <div className="bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-900 text-xs font-bold text-white font-mono flex items-center gap-1 justify-end">
                      <ArrowUpRight className="h-3 w-3 text-rose-400" /> {e.escaladoA}
                    </div>
                    <div className="text-[10px] font-mono">
                      Criticidad: <span className={getCriticidadColor(e.criticidad)}>{e.criticidad}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DETALLE LATERAL O EDITOR */}
        <div className="bg-slate-900/20 border border-slate-900 p-5 rounded-xl space-y-6 self-start">
          {selectedEscalation ? (
            <div className="space-y-5">
              <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                <div>
                  <span className="bg-rose-500/10 text-rose-400 font-mono text-[9px] px-2 py-0.5 rounded border border-rose-500/20">
                    {selectedEscalation.id}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1.5">{selectedEscalation.tipo}</h3>
                </div>
                <button
                  onClick={() => setSelectedEscalation(null)}
                  className="text-slate-500 hover:text-white text-xs font-mono"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[10px]">
                  <div>
                    <span className="text-slate-500 uppercase block">Fecha reporte</span>
                    <span className="text-slate-300 font-bold block mt-0.5">{selectedEscalation.fechaHora}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block">Canalizado A</span>
                    <span className="text-rose-400 font-bold block mt-0.5">{selectedEscalation.escaladoA}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-500 uppercase block">Criticidad</span>
                    <span className={`font-bold block mt-0.5 ${getCriticidadColor(selectedEscalation.criticidad)}`}>
                      {selectedEscalation.criticidad}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-500 uppercase block">Estado</span>
                    <span className="text-slate-300 font-bold block mt-0.5">{selectedEscalation.estado}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Bitácora / Historial de comentarios</label>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                    {selectedEscalation.comentario}
                  </div>
                </div>

                {canManage && (
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Agregar comentario a la bitácora..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-rose-500/50 font-mono"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      />
                      <button
                        onClick={handleAddComment}
                        className="px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="border-t border-slate-900 pt-3 flex flex-wrap gap-2">
                      {selectedEscalation.estado !== 'En gestión' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedEscalation.id, 'En gestión')}
                          className="px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-[10px] font-mono rounded"
                        >
                          Tomar en Gestión
                        </button>
                      )}
                      {selectedEscalation.estado !== 'Resuelto' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedEscalation.id, 'Resuelto')}
                          className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono rounded flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" /> Marcar Resuelto
                        </button>
                      )}
                      {selectedEscalation.estado !== 'Cerrado' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedEscalation.id, 'Cerrado')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[10px] font-mono rounded"
                        >
                          Cerrar Ficha
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 font-mono text-xs">
              Seleccione una ficha de riesgo de la lista para ver la bitácora, agregar comentarios de seguimiento o cambiar su estado operacional.
            </div>
          )}
        </div>
      </div>

      {/* REGISTRO / MODAL DE NUEVO ESCALAMIENTO */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-400" /> Registrar Desviación / Escalamiento
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Tipo de Riesgo o Desviación</label>
                <select
                  value={newEsc.tipo}
                  onChange={(e) => setNewEsc({ ...newEsc, tipo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500/50"
                >
                  {TIPOS_RIESGO.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Canalizar / Escalar A</label>
                  <select
                    value={newEsc.escaladoA}
                    onChange={(e) => setNewEsc({ ...newEsc, escaladoA: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500/50"
                  >
                    {ESCALADO_DESTINOS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Nivel Criticidad</label>
                  <select
                    value={newEsc.criticidad}
                    onChange={(e) => setNewEsc({ ...newEsc, criticidad: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500/50"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">OT Vinculada (Opcional)</label>
                  <select
                    value={newEsc.otVinculada}
                    onChange={(e) => {
                      const ot = ots.find(o => o.codigo === e.target.value);
                      setNewEsc({
                        ...newEsc,
                        otVinculada: e.target.value,
                        plantaVinculada: ot ? ot.plantaNombre : ''
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500/50 font-mono"
                  >
                    <option value="">Ninguna</option>
                    {ots.map((o) => (
                      <option key={o.codigo} value={o.codigo}>{o.codigo} - {o.plantaNombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Planta Vinculada (Opcional)</label>
                  <select
                    value={newEsc.plantaVinculada}
                    onChange={(e) => setNewEsc({ ...newEsc, plantaVinculada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500/50"
                  >
                    <option value="">Ninguna</option>
                    {plantas.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Descripción de la Situación y Acciones Propuestas</label>
                <textarea
                  rows={4}
                  placeholder="Detallar la desviación observada, impactos estimados y qué soporte se requiere del departamento escalado..."
                  value={newEsc.comentario}
                  onChange={(e) => setNewEsc({ ...newEsc, comentario: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500/50 font-mono leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-lg font-mono"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold font-mono rounded-lg"
                >
                  Confirmar Escalamiento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
