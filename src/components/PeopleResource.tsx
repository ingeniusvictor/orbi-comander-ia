/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Briefcase,
  Layers,
  MapPin,
  Clock,
  TrendingUp,
  UserCheck,
  UserX,
  Bookmark,
  PlusCircle,
  HelpCircle,
  Shield,
  Star
} from 'lucide-react';
import { RecursoPersona, RoleType, OT, Escalation } from '../types';

interface PeopleResourceProps {
  personas: RecursoPersona[];
  onUpdate: (updatedPersonas: RecursoPersona[]) => void;
  userRole: string;
  ots?: OT[];
  onUpdateOts?: (updatedOts: OT[]) => void;
  onAddAuditLog?: (accion: string, modulo: string, otCode?: string, plantaName?: string, comentario?: string, criticidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica') => void;
  escalaciones?: Escalation[];
  onUpdateEscalaciones?: (updatedEscalaciones: Escalation[]) => void;
}

export default function PeopleResource({
  personas = [],
  onUpdate,
  userRole,
  ots = [],
  onUpdateOts,
  onAddAuditLog,
  escalaciones = [],
  onUpdateEscalaciones,
}: PeopleResourceProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterZona, setFilterZona] = useState<string>('Todas');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [editingPersona, setEditingPersona] = useState<RecursoPersona | null>(null);
  const [newCompetencia, setNewCompetencia] = useState<string>('');

  const canManage = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'COORDINADOR_OM'].includes(userRole);

  const ESTADOS_DISPONIBILIDAD = [
    'Disponible',
    'En terreno',
    'En ruta',
    'En oficina',
    'En descanso',
    'En capacitación',
    'No disponible'
  ];

  const filteredPersonas = personas.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.competencias.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesZona = filterZona === 'Todas' || p.zona === filterZona || p.zona === 'Todas';
    const matchesEstado = filterEstado === 'Todos' || p.estadoDisponibilidad === filterEstado;

    return matchesSearch && matchesZona && matchesEstado;
  });

  const handleEditClick = (p: RecursoPersona) => {
    if (!canManage) return;
    setEditingPersona({ ...p });
    setNewCompetencia('');
  };

  const handleSaveEdit = () => {
    if (!editingPersona) return;
    const oldPersona = personas.find(p => p.id === editingPersona.id);
    const updated = personas.map(p => p.id === editingPersona.id ? editingPersona : p);
    onUpdate(updated);

    if (onAddAuditLog) {
      onAddAuditLog(
        `Ficha de personal actualizada`,
        'People & Resource Center',
        undefined,
        undefined,
        `Se actualizaron los datos del recurso humano: ${editingPersona.nombre} (${editingPersona.rol}). Estado: ${editingPersona.estadoDisponibilidad}. Carga: ${editingPersona.cargaSemanal}%.`,
        editingPersona.cargaSemanal > 90 ? 'Alta' : 'Baja'
      );
    }

    // Auto-escalate if workload becomes excessive upon saving
    if (editingPersona.cargaSemanal > 90 && (!oldPersona || oldPersona.cargaSemanal <= 90) && onUpdateEscalaciones) {
      const newEscalation: Escalation = {
        id: `ESC-P-${Date.now().toString().substring(8)}`,
        tipo: editingPersona.rol === 'COORDINADOR_OM' ? 'Coordinador sobrecargado' : 'Supervisor sobrecargado',
        estado: 'Detectado',
        responsable: editingPersona.nombre,
        comentario: `Se detecta una sobrecarga crítica automática en el recurso humano ${editingPersona.nombre} (${editingPersona.rol}). Carga semanal registrada: ${editingPersona.cargaSemanal}%.`,
        fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 16),
        criticidad: 'Alta',
        escaladoA: 'Jefe O&M'
      };
      onUpdateEscalaciones([newEscalation, ...escalaciones]);
    }

    setEditingPersona(null);
  };

  const togglePersonaActivo = (id: string) => {
    if (!canManage) return;
    const target = personas.find(p => p.id === id);
    if (!target) return;

    const updated = personas.map(p => {
      if (p.id === id) {
        return { ...p, activo: !p.activo };
      }
      return p;
    });
    onUpdate(updated);

    if (onAddAuditLog) {
      onAddAuditLog(
        `Estado de activación cambiado`,
        'People & Resource Center',
        undefined,
        undefined,
        `Se cambió el estado de activación de ${target.nombre} a: ${!target.activo ? 'Activo' : 'Inactivo'}.`,
        'Baja'
      );
    }
  };

  const handleEscalarSobrecarga = (persona: RecursoPersona) => {
    if (!onUpdateEscalaciones || !onAddAuditLog) return;
    
    const newEscalation: Escalation = {
      id: `ESC-P-${Date.now().toString().substring(8)}`,
      tipo: persona.rol === 'COORDINADOR_OM' ? 'Coordinador sobrecargado' : 'Supervisor sobrecargado',
      estado: 'Detectado',
      responsable: persona.nombre,
      comentario: `Se detecta una sobrecarga crítica en el recurso humano ${persona.nombre} (${persona.rol}). Carga semanal actual registrada: ${persona.cargaSemanal}%. Horas planificadas: ${persona.hhPlanificadas} Hrs.`,
      fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 16),
      criticidad: persona.cargaSemanal > 100 ? 'Crítica' : 'Alta',
      escaladoA: 'Jefe O&M'
    };

    onUpdateEscalaciones([newEscalation, ...escalaciones]);
    
    onAddAuditLog(
      `Sobrecarga de personal escalada`,
      'People & Resource Center',
      undefined,
      undefined,
      `Se generó un ticket de riesgo en el Risk Center para gestionar el exceso de carga laboral de ${persona.nombre} (${persona.cargaSemanal}%).`,
      persona.cargaSemanal > 100 ? 'Crítica' : 'Alta'
    );
    
    alert(`Se ha escalado con éxito la sobrecarga laboral de ${persona.nombre} al Risk & Escalation Center.`);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5.5 w-5.5 text-cyan-400" /> People & Resource Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión del recurso humano O&M. Controla disponibilidad, carga de trabajo semanal, asignación de zonas operacionales y competencias técnicas específicas.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, rol, competencias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-cyan-500/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Filter className="h-4 w-4 text-slate-500" />
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

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todos" className="bg-slate-950 text-white">Todos los Estados</option>
            {ESTADOS_DISPONIBILIDAD.map(est => (
              <option key={est} value={est} className="bg-slate-950 text-white">{est}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Lateral Modal */}
      {editingPersona && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{editingPersona.id}</span>
                <h3 className="text-sm font-bold text-white mt-1">{editingPersona.nombre}</h3>
              </div>
              <button onClick={() => setEditingPersona(null)} className="text-slate-400 hover:text-white">x</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase">Estado de Disponibilidad</label>
                <select
                  value={editingPersona.estadoDisponibilidad}
                  onChange={(e) => setEditingPersona({ ...editingPersona, estadoDisponibilidad: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none mt-1"
                >
                  {ESTADOS_DISPONIBILIDAD.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Zona Operacional</label>
                  <select
                    value={editingPersona.zona}
                    onChange={(e) => setEditingPersona({ ...editingPersona, zona: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none mt-1"
                  >
                    <option value="Norte">Zona Norte</option>
                    <option value="Centro">Zona Centro</option>
                    <option value="Sur">Zona Sur</option>
                    <option value="Todas">Todas</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Carga Semanal (%)</label>
                  <input
                    type="number"
                    value={editingPersona.cargaSemanal}
                    onChange={(e) => setEditingPersona({ ...editingPersona, cargaSemanal: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white mt-1"
                    min="0"
                    max="150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">HH Planificadas</label>
                  <input
                    type="number"
                    value={editingPersona.hhPlanificadas}
                    onChange={(e) => setEditingPersona({ ...editingPersona, hhPlanificadas: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">HH Reales</label>
                  <input
                    type="number"
                    value={editingPersona.hhReales}
                    onChange={(e) => setEditingPersona({ ...editingPersona, hhReales: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase">Jefatura Directa</label>
                <input
                  type="text"
                  value={editingPersona.jefaturaDirecta || ''}
                  onChange={(e) => setEditingPersona({ ...editingPersona, jefaturaDirecta: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white mt-1"
                />
              </div>

              {/* Competencias */}
              <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase block border-b border-slate-900 pb-1.5 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-cyan-400" /> Competencias & Certificaciones
                </span>

                <div className="flex flex-wrap gap-1 mt-1">
                  {(editingPersona.competencias || []).map((comp, i) => (
                    <span key={i} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] text-slate-300 flex items-center gap-1">
                      {comp}
                      <button onClick={() => {
                        const list = (editingPersona.competencias || []).filter((_, idx) => idx !== i);
                        setEditingPersona({ ...editingPersona, competencias: list });
                      }} className="text-slate-500 hover:text-white">x</button>
                    </span>
                  ))}
                  {(!editingPersona.competencias || editingPersona.competencias.length === 0) && <span className="text-slate-600 italic text-[10px]">Ninguna registrada</span>}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Agregar competencia..."
                    value={newCompetencia}
                    onChange={(e) => setNewCompetencia(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white flex-1"
                  />
                  <button onClick={() => {
                    if (!newCompetencia) return;
                    const list = [...editingPersona.competencias, newCompetencia];
                    setEditingPersona({ ...editingPersona, competencias: list });
                    setNewCompetencia('');
                  }} className="bg-cyan-500 text-slate-950 px-2 rounded text-[10px] font-bold">+</button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-800">
            <button
              onClick={() => setEditingPersona(null)}
              className="flex-1 px-3 py-2 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 hover:bg-slate-950"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-3 py-2 bg-cyan-500 text-slate-950 font-bold text-xs font-mono rounded-lg hover:bg-cyan-600"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* Grid de Personas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersonas.map((p) => {
          let dispoColor = 'bg-slate-850 text-slate-400 border border-slate-800';
          let dispoDot = 'bg-slate-400';

          if (p.estadoDisponibilidad === 'Disponible' || p.estadoDisponibilidad === 'En oficina') {
            dispoColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            dispoDot = 'bg-emerald-400';
          } else if (p.estadoDisponibilidad === 'En terreno' || p.estadoDisponibilidad === 'En ruta') {
            dispoColor = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
            dispoDot = 'bg-cyan-400';
          } else if (p.estadoDisponibilidad === 'En descanso' || p.estadoDisponibilidad === 'En capacitación') {
            dispoColor = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
            dispoDot = 'bg-indigo-400';
          } else if (p.estadoDisponibilidad === 'No disponible') {
            dispoColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
            dispoDot = 'bg-rose-400 animate-pulse';
          }

          return (
            <div
              key={p.id}
              className={`bg-slate-900/40 border border-slate-850 rounded-xl p-5 shadow flex flex-col justify-between transition-all ${
                !p.activo ? 'opacity-50' : 'hover:bg-slate-900/70'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-slate-500" /> {p.nombre}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{p.rol}</span>
                  </div>

                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5 ${dispoColor}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dispoDot}`}></span>
                    {p.estadoDisponibilidad}
                  </span>
                </div>

                <div className="space-y-2 text-xs py-3 border-y border-slate-950 my-3 font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Jefatura Directa:</span>
                    <span className="text-slate-200 font-bold">{p.jefaturaDirecta || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Zona Asignada:</span>
                    <span className="text-cyan-300 font-bold">{p.zona}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-900/40">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> HH Planificadas:</span>
                    <span className="text-slate-300">{p.hhPlanificadas} Hrs</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> HH Reales:</span>
                    <span className="text-emerald-400">{p.hhReales} Hrs</span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-900/40">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Carga Semanal:</span>
                      <span className={p.cargaSemanal > 90 ? 'text-rose-400 font-bold' : 'text-slate-300'}>{p.cargaSemanal}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                      <div className={`h-full rounded-full ${
                        p.cargaSemanal > 90 ? 'bg-rose-500' : 'bg-cyan-500'
                      }`} style={{ width: `${Math.min(p.cargaSemanal, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Competencias */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block">Competencias:</span>
                  <div className="flex flex-wrap gap-1">
                    {(p.competencias || []).map((comp, idx) => (
                      <span key={idx} className="bg-slate-950/60 border border-slate-900 text-[9px] text-slate-400 px-1.5 py-0.5 rounded">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="pt-4 mt-3 border-t border-slate-950 flex gap-1.5 justify-between flex-wrap">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => togglePersonaActivo(p.id)}
                      className={`text-[9px] font-mono px-2 py-1 rounded flex items-center gap-1 border ${
                        p.activo
                          ? 'border-rose-900/30 text-rose-400 bg-rose-950/10 hover:bg-rose-950/30'
                          : 'border-emerald-900/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                      }`}
                    >
                      {p.activo ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </button>

                    {p.cargaSemanal > 80 && p.activo && (
                      <button
                        onClick={() => handleEscalarSobrecarga(p)}
                        className="text-[9px] font-mono px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded flex items-center gap-1 animate-pulse"
                        title="Escalar sobrecarga al centro de riesgos"
                      >
                        Escalar Sobrecarga
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleEditClick(p)}
                    className="text-[10px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-950 border border-slate-800"
                  >
                    Editar Ficha
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
