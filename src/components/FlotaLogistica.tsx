/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Truck,
  PlusCircle,
  Search,
  Filter,
  User,
  Navigation,
  Clock,
  Wrench,
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  X,
  Play,
  RotateCcw,
  Sparkles,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { Vehiculo, Planta, OrganigramaNode, OT, Escalation } from '../types';

interface FlotaLogisticaProps {
  vehiculos: Vehiculo[];
  plantas: Planta[];
  organigrama: OrganigramaNode[];
  onUpdate: (updatedVehiculos: Vehiculo[]) => void;
  userRole: string;
  ots?: OT[];
  onUpdateOts?: (updatedOts: OT[]) => void;
  onAddAuditLog?: (accion: string, modulo: string, otCode?: string, plantaName?: string, comentario?: string, criticidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica') => void;
  escalaciones?: Escalation[];
  onUpdateEscalaciones?: (updatedEscalaciones: Escalation[]) => void;
}

export default function FlotaLogistica({
  vehiculos,
  plantas,
  organigrama,
  onUpdate,
  userRole,
  ots = [],
  onUpdateOts,
  onAddAuditLog,
  escalaciones = [],
  onUpdateEscalaciones,
}: FlotaLogisticaProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [filterZona, setFilterZona] = useState<string>('Todas');
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Formulario de Nuevo Vehículo
  const [newVehiculo, setNewVehiculo] = useState<Partial<Vehiculo>>({
    patente: '',
    modelo: '',
    conductor: '',
    personalAsociado: [],
    plantaDestinoId: '',
    zona: 'Centro',
    rutaSimulada: '',
    horaSalida: '',
    horaLlegadaEstimada: '',
    herramientasRequeridas: [],
    repuestosRequeridos: [],
    estado: 'Disponible',
    bloqueoLogistico: '',
  });

  const [inputHerramienta, setInputHerramienta] = useState<string>('');
  const [inputRepuesto, setInputRepuesto] = useState<string>('');
  const [selectedPersonal, setSelectedPersonal] = useState<string>('');

  const canManage = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'COORDINADOR_OM', 'PLANIFICACION'].includes(userRole);

  const ESTADOS_VEHICULOS = [
    'Disponible',
    'Asignado',
    'En ruta',
    'En planta',
    'Retornando',
    'Bloqueado',
    'Mantención vehículo',
    'Sin recurso disponible'
  ];

  const handleEditClick = (v: Vehiculo) => {
    if (!canManage) return;
    setEditingVehiculo({ ...v });
  };

  const handleSaveEdit = () => {
    if (!editingVehiculo) return;
    const v = vehiculos.find(x => x.id === editingVehiculo.id);
    if (!v) return;

    const index = vehiculos.findIndex(v => v.id === editingVehiculo.id);
    if (index !== -1) {
      const updated = [...vehiculos];
      updated[index] = editingVehiculo;
      onUpdate(updated);

      if (onAddAuditLog) {
        onAddAuditLog(
          `Ficha de vehículo guardada`,
          'Control de Flota & Logística',
          editingVehiculo.otVinculada,
          editingVehiculo.plantaDestinoNombre,
          `Se actualizaron los datos y asignaciones del vehículo con patente ${editingVehiculo.patente}. Estado: ${editingVehiculo.estado}. Conductor: ${editingVehiculo.conductor}.`,
          editingVehiculo.estado === 'Bloqueado' ? 'Alta' : 'Baja'
        );
      }

      // If state changed to Bloqueado, create escalation
      if (editingVehiculo.estado === 'Bloqueado' && v.estado !== 'Bloqueado' && onUpdateEscalaciones) {
        const newEscalation: Escalation = {
          id: `ESC-V-${Date.now().toString().substring(8)}`,
          tipo: 'Vehículo no disponible',
          estado: 'Detectado',
          responsable: editingVehiculo.conductor || 'No asignado',
          comentario: `Vehículo con patente ${editingVehiculo.patente} se encuentra bloqueado debido a: ${editingVehiculo.bloqueoLogistico || 'Cortes en ruta de acceso.'}`,
          otVinculada: editingVehiculo.otVinculada,
          plantaVinculada: editingVehiculo.plantaDestinoNombre,
          fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 16),
          criticidad: 'Alta',
          escaladoA: 'Jefe O&M'
        };
        onUpdateEscalaciones([newEscalation, ...escalaciones]);
      }

      // If there is a linked OT, propagate vehicle state changes to the OT state
      if (editingVehiculo.otVinculada && onUpdateOts && ots) {
        const updatedOts = ots.map(o => {
          if (o.codigo === editingVehiculo.otVinculada) {
            let newOtState = o.estado;
            let blocked = o.bloqueada;
            let motif = o.motivoBloqueo;
            
            if (editingVehiculo.estado === 'En ruta') {
              newOtState = 'En ruta';
            } else if (editingVehiculo.estado === 'En planta') {
              newOtState = 'En terreno';
            } else if (editingVehiculo.estado === 'Bloqueado') {
              newOtState = 'Bloqueada';
              blocked = true;
              motif = `Bloqueo logístico en vehículo ${editingVehiculo.patente}: ${editingVehiculo.bloqueoLogistico || 'Sin detalles'}`;
            } else if (editingVehiculo.estado === 'Disponible' && o.estado === 'Bloqueada') {
              // released
              blocked = false;
              motif = undefined;
              newOtState = 'Asignada';
            }

            return {
              ...o,
              estado: newOtState,
              bloqueada: blocked,
              motivoBloqueo: motif
            };
          }
          return o;
        });
        onUpdateOts(updatedOts);
      }

      setEditingVehiculo(null);
    }
  };

  const handleCreateClick = () => {
    setIsCreating(true);
    setNewVehiculo({
      id: `V${(vehiculos.length + 1).toString().padStart(2, '0')}`,
      patente: '',
      modelo: '',
      conductor: organigrama[0]?.name || '',
      personalAsociado: [],
      plantaDestinoId: plantas[0]?.id || '',
      plantaDestinoNombre: plantas[0]?.name || '',
      zona: 'Centro',
      rutaSimulada: '',
      horaSalida: '',
      horaLlegadaEstimada: '',
      herramientasRequeridas: [],
      repuestosRequeridos: [],
      estado: 'Disponible',
      bloqueoLogistico: '',
    });
    setSelectedPersonal('');
  };

  const handleSaveCreate = () => {
    if (!newVehiculo.patente || !newVehiculo.modelo) {
      alert('Por favor complete patente y modelo del vehículo.');
      return;
    }
    const targetPlanta = plantas.find(p => p.id === newVehiculo.plantaDestinoId);
    const completed: Vehiculo = {
      id: newVehiculo.id || `V${(vehiculos.length + 1).toString().padStart(2, '0')}`,
      patente: newVehiculo.patente.toUpperCase(),
      modelo: newVehiculo.modelo,
      conductor: newVehiculo.conductor || '',
      personalAsociado: newVehiculo.personalAsociado || [],
      plantaDestinoId: newVehiculo.plantaDestinoId,
      plantaDestinoNombre: targetPlanta ? targetPlanta.name : '',
      zona: newVehiculo.zona || 'Centro',
      rutaSimulada: newVehiculo.rutaSimulada || '',
      horaSalida: newVehiculo.horaSalida || '',
      horaLlegadaEstimada: newVehiculo.horaLlegadaEstimada || '',
      herramientasRequeridas: newVehiculo.herramientasRequeridas || [],
      repuestosRequeridos: newVehiculo.repuestosRequeridos || [],
      estado: (newVehiculo.estado as any) || 'Disponible',
      bloqueoLogistico: newVehiculo.bloqueoLogistico || '',
    };

    onUpdate([...vehiculos, completed]);

    if (onAddAuditLog) {
      onAddAuditLog(
        `Vehículo registrado`,
        'Control de Flota & Logística',
        undefined,
        completed.plantaDestinoNombre,
        `Se registra nuevo vehículo en flota: ${completed.patente} (${completed.modelo}) para ruta ${completed.rutaSimulada || 'N/A'}.`,
        'Baja'
      );
    }

    setIsCreating(false);
  };

  const simulateQuickState = (vehiculoId: string, newState: any) => {
    const v = vehiculos.find(x => x.id === vehiculoId);
    if (!v) return;

    let blockText = '';
    if (newState === 'Bloqueado') {
      blockText = 'Bloqueo logístico simulado: Retraso por cortes en ruta de acceso.';
    }

    const updated = vehiculos.map(x => {
      if (x.id === vehiculoId) {
        return {
          ...x,
          estado: newState,
          bloqueoLogistico: blockText
        };
      }
      return x;
    });
    onUpdate(updated);

    if (onAddAuditLog) {
      onAddAuditLog(
        `Vehículo cambiado a ${newState}`,
        'Control de Flota & Logística',
        v.otVinculada,
        v.plantaDestinoNombre,
        `Vehículo ${v.patente} (${v.modelo}) cambió de estado a ${newState}. Conductor: ${v.conductor}.` + (blockText ? ` Detalle: ${blockText}` : ''),
        newState === 'Bloqueado' ? 'Alta' : 'Baja'
      );
    }

    // Trigger escalation if blocked
    if (newState === 'Bloqueado' && onUpdateEscalaciones) {
      const newEscalation: Escalation = {
        id: `ESC-V-${Date.now().toString().substring(8)}`,
        tipo: 'Vehículo no disponible',
        estado: 'Detectado',
        responsable: v.conductor || 'No asignado',
        comentario: `Vehículo con patente ${v.patente} se encuentra bloqueado debido a: ${blockText}`,
        otVinculada: v.otVinculada,
        plantaVinculada: v.plantaDestinoNombre,
        fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 16),
        criticidad: 'Alta',
        escaladoA: 'Jefe O&M'
      };
      onUpdateEscalaciones([newEscalation, ...escalaciones]);
    }

    // Propagate state changes to linked OT
    if (v.otVinculada && onUpdateOts && ots) {
      const updatedOts = ots.map(o => {
        if (o.codigo === v.otVinculada) {
          let newOtState = o.estado;
          let blocked = o.bloqueada;
          let motif = o.motivoBloqueo;

          if (newState === 'En ruta') {
            newOtState = 'En ruta';
          } else if (newState === 'En planta') {
            newOtState = 'En terreno';
          } else if (newState === 'Bloqueado') {
            newOtState = 'Bloqueada';
            blocked = true;
            motif = `Bloqueo logístico simulado en vehículo ${v.patente}: ${blockText}`;
          } else if (newState === 'Disponible' && o.estado === 'Bloqueada') {
            blocked = false;
            motif = undefined;
            newOtState = 'Asignada';
          }

          return {
            ...o,
            estado: newOtState,
            bloqueada: blocked,
            motivoBloqueo: motif
          };
        }
        return o;
      });
      onUpdateOts(updatedOts);
    }
  };

  const filteredVehiculos = vehiculos.filter((v) => {
    const matchesSearch =
      v.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.conductor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.plantaDestinoNombre && v.plantaDestinoNombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEstado = filterEstado === 'Todos' || v.estado === filterEstado;
    const matchesZona = filterZona === 'Todas' || v.zona === filterZona;

    return matchesSearch && matchesEstado && matchesZona;
  });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Truck className="h-5.5 w-5.5 text-emerald-400" /> Control de Flota & Logística de Terreno
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y despacho de vehículos O&M, asignación de repuestos críticos, herramientas de terreno y rutas simuladas inter-plantas.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleCreateClick}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition-all hover:scale-102"
          >
            <PlusCircle className="h-4 w-4" /> Registrar Vehículo
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por patente, conductor, destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-emerald-500/50 outline-none"
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
            {ESTADOS_VEHICULOS.map(st => (
              <option key={st} value={st} className="bg-slate-950 text-white">{st}</option>
            ))}
          </select>
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
      </div>

      {/* Creación de Vehículo Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-emerald-400" /> Registrar Vehículo en Flota O&M
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Patente (Ej. KOPX-42)</label>
                  <input
                    type="text"
                    value={newVehiculo.patente}
                    onChange={(e) => setNewVehiculo({ ...newVehiculo, patente: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                    placeholder="ABCD-12"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Modelo / Marca</label>
                  <input
                    type="text"
                    value={newVehiculo.modelo}
                    onChange={(e) => setNewVehiculo({ ...newVehiculo, modelo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                    placeholder="Toyota Hilux 4x4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Zona Asignada</label>
                  <select
                    value={newVehiculo.zona}
                    onChange={(e) => setNewVehiculo({ ...newVehiculo, zona: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="Norte">Zona Norte</option>
                    <option value="Centro">Zona Centro</option>
                    <option value="Sur">Zona Sur</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Conductor Designado</label>
                  <select
                    value={newVehiculo.conductor}
                    onChange={(e) => setNewVehiculo({ ...newVehiculo, conductor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  >
                    {organigrama.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({p.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Planta Destino</label>
                  <select
                    value={newVehiculo.plantaDestinoId}
                    onChange={(e) => {
                      const p = plantas.find(pl => pl.id === e.target.value);
                      setNewVehiculo({
                        ...newVehiculo,
                        plantaDestinoId: e.target.value,
                        plantaDestinoNombre: p ? p.name : ''
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="">Ninguna (Disponible)</option>
                    {plantas.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.zona})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Ruta Simulada</label>
                  <input
                    type="text"
                    value={newVehiculo.rutaSimulada}
                    onChange={(e) => setNewVehiculo({ ...newVehiculo, rutaSimulada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                    placeholder="Ej. Santiago - Tiltil"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Hora Salida</label>
                  <input
                    type="text"
                    value={newVehiculo.horaSalida}
                    onChange={(e) => setNewVehiculo({ ...newVehiculo, horaSalida: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                    placeholder="08:00"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Hora Llegada Estimada</label>
                  <input
                    type="text"
                    value={newVehiculo.horaLlegadaEstimada}
                    onChange={(e) => setNewVehiculo({ ...newVehiculo, horaLlegadaEstimada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                    placeholder="09:15"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase">Estado Inicial</label>
                <select
                  value={newVehiculo.estado}
                  onChange={(e) => setNewVehiculo({ ...newVehiculo, estado: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                >
                  {ESTADOS_VEHICULOS.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-950 text-xs font-mono text-slate-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCreate}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono flex items-center gap-1"
              >
                Registrar Vehículo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Lateral (Simulación) */}
      {editingVehiculo && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">{editingVehiculo.patente}</span>
                <h3 className="text-sm font-bold text-white mt-1.5">Despacho Logístico de Flota</h3>
              </div>
              <button onClick={() => setEditingVehiculo(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase">Estado de Vehículo</label>
                <select
                  value={editingVehiculo.estado}
                  onChange={(e) => setEditingVehiculo({ ...editingVehiculo, estado: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-emerald-500 outline-none mt-1"
                >
                  {ESTADOS_VEHICULOS.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase">Planta Destino</label>
                <select
                  value={editingVehiculo.plantaDestinoId}
                  onChange={(e) => {
                    const p = plantas.find(pl => pl.id === e.target.value);
                    setEditingVehiculo({
                      ...editingVehiculo,
                      plantaDestinoId: e.target.value,
                      plantaDestinoNombre: p ? p.name : ''
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-emerald-500 outline-none mt-1"
                >
                  <option value="">Ninguna</option>
                  {plantas.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase">Vincular Orden de Trabajo (OT)</label>
                <select
                  value={editingVehiculo.otVinculada || ''}
                  onChange={(e) => {
                    const selectedOt = ots.find(o => o.codigo === e.target.value);
                    setEditingVehiculo({
                      ...editingVehiculo,
                      otVinculada: e.target.value,
                      plantaDestinoNombre: selectedOt ? selectedOt.plantaNombre : editingVehiculo.plantaDestinoNombre,
                      plantaDestinoId: selectedOt ? selectedOt.plantaId : editingVehiculo.plantaDestinoId
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-emerald-500 outline-none mt-1 font-mono"
                >
                  <option value="">Ninguna</option>
                  {ots.map(o => (
                    <option key={o.codigo} value={o.codigo}>{o.codigo} - {o.plantaNombre} ({o.tipo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Conductor</label>
                  <select
                    value={editingVehiculo.conductor}
                    onChange={(e) => setEditingVehiculo({ ...editingVehiculo, conductor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-emerald-500 outline-none mt-1"
                  >
                    {organigrama.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Zona</label>
                  <select
                    value={editingVehiculo.zona}
                    onChange={(e) => setEditingVehiculo({ ...editingVehiculo, zona: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-emerald-500 outline-none mt-1"
                  >
                    <option value="Norte">Norte</option>
                    <option value="Centro">Centro</option>
                    <option value="Sur">Sur</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Hora Salida</label>
                  <input
                    type="text"
                    value={editingVehiculo.horaSalida || ''}
                    onChange={(e) => setEditingVehiculo({ ...editingVehiculo, horaSalida: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Llegada Estimada</label>
                  <input
                    type="text"
                    value={editingVehiculo.horaLlegadaEstimada || ''}
                    onChange={(e) => setEditingVehiculo({ ...editingVehiculo, horaLlegadaEstimada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase">Ruta Simulada</label>
                <input
                  type="text"
                  value={editingVehiculo.rutaSimulada || ''}
                  onChange={(e) => setEditingVehiculo({ ...editingVehiculo, rutaSimulada: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white mt-1"
                />
              </div>

              {editingVehiculo.estado === 'Bloqueado' && (
                <div>
                  <label className="text-[10px] font-mono text-rose-400 uppercase">Bloqueo Logístico (Motivo)</label>
                  <textarea
                    rows={2}
                    value={editingVehiculo.bloqueoLogistico || ''}
                    onChange={(e) => setEditingVehiculo({ ...editingVehiculo, bloqueoLogistico: e.target.value })}
                    className="w-full bg-slate-950 border border-rose-900 rounded-lg p-2 text-rose-300 mt-1 resize-none font-mono text-xs"
                    placeholder="Detalle de retraso, cortes de ruta o fallas logísticas..."
                  />
                </div>
              )}

              {/* Registro de Repuestos y Herramientas */}
              <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-xl space-y-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase block border-b border-slate-900 pb-1.5 flex items-center gap-1">
                  <Wrench className="h-3.5 w-3.5" /> Equipamiento de Terreno
                </span>

                <div>
                  <label className="text-[9px] font-mono text-slate-500">Herramientas Cargadas</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {editingVehiculo.herramientasRequeridas?.map((h, i) => (
                      <span key={i} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] text-slate-300 flex items-center gap-1">
                        {h}
                        <button onClick={() => {
                          const list = editingVehiculo.herramientasRequeridas?.filter((_, idx) => idx !== i) || [];
                          setEditingVehiculo({ ...editingVehiculo, herramientasRequeridas: list });
                        }} className="text-slate-500 hover:text-white">x</button>
                      </span>
                    ))}
                    {(!editingVehiculo.herramientasRequeridas || editingVehiculo.herramientasRequeridas.length === 0) && <span className="text-slate-600 italic text-[10px]">Ninguna</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Nueva herramienta..."
                      value={inputHerramienta}
                      onChange={(e) => setInputHerramienta(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white flex-1"
                    />
                    <button onClick={() => {
                      if (!inputHerramienta) return;
                      const list = [...(editingVehiculo.herramientasRequeridas || []), inputHerramienta];
                      setEditingVehiculo({ ...editingVehiculo, herramientasRequeridas: list });
                      setInputHerramienta('');
                    }} className="bg-emerald-500 text-slate-950 px-2 rounded text-[10px] font-bold">+</button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900/60">
                  <label className="text-[9px] font-mono text-slate-500">Repuestos en Tránsito</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {editingVehiculo.repuestosRequeridos?.map((r, i) => (
                      <span key={i} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] text-slate-300 flex items-center gap-1">
                        {r}
                        <button onClick={() => {
                          const list = editingVehiculo.repuestosRequeridos?.filter((_, idx) => idx !== i) || [];
                          setEditingVehiculo({ ...editingVehiculo, repuestosRequeridos: list });
                        }} className="text-slate-500 hover:text-white">x</button>
                      </span>
                    ))}
                    {(!editingVehiculo.repuestosRequeridos || editingVehiculo.repuestosRequeridos.length === 0) && <span className="text-slate-600 italic text-[10px]">Ninguno</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Nuevo repuesto..."
                      value={inputRepuesto}
                      onChange={(e) => setInputRepuesto(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white flex-1"
                    />
                    <button onClick={() => {
                      if (!inputRepuesto) return;
                      const list = [...(editingVehiculo.repuestosRequeridos || []), inputRepuesto];
                      setEditingVehiculo({ ...editingVehiculo, repuestosRequeridos: list });
                      setInputRepuesto('');
                    }} className="bg-emerald-500 text-slate-950 px-2 rounded text-[10px] font-bold">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-800">
            <button
              onClick={() => setEditingVehiculo(null)}
              className="flex-1 px-3 py-2 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 hover:bg-slate-950"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-3 py-2 bg-emerald-500 text-slate-950 font-bold text-xs font-mono rounded-lg hover:bg-emerald-600"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* Listado de Vehículos en Flota */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehiculos.map((v) => {
          let stateColor = 'bg-slate-850 text-slate-400 border border-slate-800';
          let stateDot = 'bg-slate-400';

          if (v.estado === 'Disponible') {
            stateColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            stateDot = 'bg-emerald-400';
          } else if (v.estado === 'En ruta') {
            stateColor = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
            stateDot = 'bg-cyan-400';
          } else if (v.estado === 'En planta') {
            stateColor = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
            stateDot = 'bg-indigo-400';
          } else if (v.estado === 'Bloqueado') {
            stateColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
            stateDot = 'bg-rose-400 animate-pulse';
          } else if (v.estado === 'Mantención vehículo') {
            stateColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            stateDot = 'bg-amber-400';
          }

          return (
            <div
              key={v.id}
              className="bg-slate-900/40 hover:bg-slate-900/75 border border-slate-850 rounded-xl p-5 shadow flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 uppercase tracking-widest">{v.patente}</span>
                    <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mt-1.5">{v.modelo}</h3>
                  </div>

                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5 ${stateColor}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${stateDot}`}></span>
                    {v.estado}
                  </span>
                </div>

                <div className="space-y-2 text-xs py-3 border-y border-slate-950 my-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="h-4 w-4 text-slate-500" /> Conductor: <span className="font-semibold">{v.conductor}</span>
                  </div>

                  {v.plantaDestinoNombre ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="h-4 w-4 text-indigo-400" /> Destino: <span className="font-semibold text-indigo-300">{v.plantaDestinoNombre}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 pl-6">
                        <Navigation className="h-3 w-3" /> {v.rutaSimulada}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 pl-6">
                        <Clock className="h-3 w-3" /> Salida: {v.horaSalida} | Est: {v.horaLlegadaEstimada}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic pl-6 font-mono">Sin misión programada</div>
                  )}

                  {/* Detalle herramientas/repuestos */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-mono border-t border-slate-900/60">
                    <div>
                      <span className="text-slate-500 block">Herramientas:</span>
                      <span className="text-slate-300">{v.herramientasRequeridas?.length || 0} cargadas</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Repuestos:</span>
                      <span className="text-slate-300">{v.repuestosRequeridos?.length || 0} en tránsito</span>
                    </div>
                  </div>
                </div>

                {v.estado === 'Bloqueado' && v.bloqueoLogistico && (
                  <div className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5 text-[10px] text-rose-300 font-mono mb-3">
                    <AlertOctagon className="h-3.5 w-3.5 text-rose-400 inline mr-1" /> {v.bloqueoLogistico}
                  </div>
                )}
              </div>

              {/* Controles rápidos de simulación */}
              {canManage && (
                <div className="pt-2 border-t border-slate-950 flex gap-2 justify-between">
                  <div className="flex gap-1">
                    {v.estado === 'Disponible' && (
                      <button
                        onClick={() => simulateQuickState(v.id, 'En ruta')}
                        className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded text-[9px] font-mono"
                        title="Iniciar Ruta"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {v.estado === 'En ruta' && (
                      <button
                        onClick={() => simulateQuickState(v.id, 'En planta')}
                        className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded text-[9px] font-mono"
                        title="Confirmar Llegada"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {v.estado === 'En planta' && (
                      <button
                        onClick={() => simulateQuickState(v.id, 'Retornando')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono"
                        title="Iniciar Retorno"
                      >
                        Retornar
                      </button>
                    )}
                    {(v.estado === 'Retornando' || v.estado === 'Bloqueado' || v.estado === 'Mantención vehículo') && (
                      <button
                        onClick={() => simulateQuickState(v.id, 'Disponible')}
                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-mono"
                        title="Liberar"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleEditClick(v)}
                    className="text-[10px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-950 border border-slate-800"
                  >
                    Detalle & Carga
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
