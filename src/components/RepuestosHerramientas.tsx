/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Filter,
  PlusCircle,
  AlertOctagon,
  CheckCircle,
  Tag,
  MapPin,
  Clock,
  Briefcase,
  X,
  FileText,
  ShoppingBag,
  HelpCircle,
  Package
} from 'lucide-react';
import { Repuesto, Herramienta, OT, Planta, Escalation } from '../types';

interface RepuestosHerramientasProps {
  repuestos: Repuesto[];
  herramientas: Herramienta[];
  ots: OT[];
  plantas: Planta[];
  onUpdateRepuestos: (updated: Repuesto[]) => void;
  onUpdateHerramientas: (updated: Herramienta[]) => void;
  userRole: string;
  activeUserName: string;
  onAddAuditLog: (accion: string, modulo: string, otCode?: string, plantaName?: string, comentario?: string, criticidad?: any) => void;
  onUpdateOts?: (updatedOts: OT[]) => void;
  escalaciones?: Escalation[];
  onUpdateEscalaciones?: (updatedEscalaciones: Escalation[]) => void;
}

export default function RepuestosHerramientas({
  repuestos,
  herramientas,
  ots,
  plantas,
  onUpdateRepuestos,
  onUpdateHerramientas,
  userRole,
  activeUserName,
  onAddAuditLog,
  onUpdateOts,
  escalaciones = [],
  onUpdateEscalaciones,
}: RepuestosHerramientasProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('Todos'); // 'Todos' | 'Repuesto' | 'Herramienta'
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [filterCriticidad, setFilterCriticidad] = useState<string>('Todas');

  const [selectedItem, setSelectedItem] = useState<{ item: Repuesto | Herramienta; isRepuesto: boolean } | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Formulario nuevo recurso
  const [newRec, setNewRec] = useState<any>({
    id: '',
    tipo: 'Repuesto',
    nombre: '',
    categoria: '',
    stockSimulado: 1,
    ubicacion: 'Bodega Centro',
    estado: 'Disponible',
    criticidad: 'Media'
  });

  const [obsInput, setObsInput] = useState<string>('');

  const canManage = ['SUPER_ADMIN_ORBI', 'JEFE_OM', 'COORDINADOR_OM', 'PLANIFICACION', 'SUPERVISOR_TERRENO'].includes(userRole);

  const ESTADOS_RECURSOS = [
    'Disponible',
    'Reservado',
    'Asignado',
    'En terreno',
    'En mantención',
    'Pendiente compra',
    'Pendiente retiro',
    'Bloqueando OT'
  ];

  // Unir listas con tipado para el filtro visual unificado
  const combinada = [
    ...repuestos.map(r => ({ ...r, tipoRecurso: 'Repuesto' as const })),
    ...herramientas.map(h => ({ ...h, tipoRecurso: 'Herramienta' as const }))
  ];

  const filtered = combinada.filter((item) => {
    const matchesSearch =
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.otVinculada && item.otVinculada.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.plantaDestinoNombre && item.plantaDestinoNombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filterTipo === 'Todos' || item.tipoRecurso === filterTipo;
    const matchesEstado = filterEstado === 'Todos' || item.estado === filterEstado;
    const matchesCriticidad = filterCriticidad === 'Todas' || item.criticidad === filterCriticidad;

    return matchesSearch && matchesTipo && matchesEstado && matchesCriticidad;
  });

  const handleCreate = () => {
    if (!newRec.nombre || !newRec.categoria) {
      alert('Por favor complete el nombre y categoría del recurso.');
      return;
    }

    if (newRec.tipo === 'Repuesto') {
      const item: Repuesto = {
        id: newRec.id || `REP${(repuestos.length + 1).toString().padStart(2, '0')}`,
        nombre: newRec.nombre,
        categoria: newRec.categoria,
        stockSimulado: parseInt(newRec.stockSimulado) || 0,
        ubicacion: newRec.ubicacion,
        estado: newRec.estado as any,
        criticidad: newRec.criticidad as any
      };
      onUpdateRepuestos([...repuestos, item]);

      onAddAuditLog(
        'Repuesto registrado',
        'Repuestos & Herramientas',
        undefined,
        undefined,
        `Se registra nuevo repuesto: ${item.nombre} (Stock: ${item.stockSimulado}) en ${item.ubicacion}.`,
        item.criticidad
      );
    } else {
      const item: Herramienta = {
        id: newRec.id || `HER${(herramientas.length + 1).toString().padStart(2, '0')}`,
        nombre: newRec.nombre,
        categoria: newRec.categoria,
        stockSimulado: parseInt(newRec.stockSimulado) || 0,
        ubicacion: newRec.ubicacion,
        estado: newRec.estado as any,
        criticidad: newRec.criticidad as any
      };
      onUpdateHerramientas([...herramientas, item]);

      onAddAuditLog(
        'Herramienta registrada',
        'Repuestos & Herramientas',
        undefined,
        undefined,
        `Se registra nueva herramienta/instrumento: ${item.nombre} en ${item.ubicacion}.`,
        item.criticidad
      );
    }

    setIsCreating(false);
    setNewRec({
      id: '',
      tipo: 'Repuesto',
      nombre: '',
      categoria: '',
      stockSimulado: 1,
      ubicacion: 'Bodega Centro',
      estado: 'Disponible',
      criticidad: 'Media'
    });
  };

  const handleActionSimulated = (action: string, extras?: any) => {
    if (!selectedItem) return;
    const { item, isRepuesto } = selectedItem;

    let updatedItem = { ...item };

    switch (action) {
      case 'reserve':
        updatedItem.estado = 'Reservado';
        break;
      case 'assign':
        updatedItem.estado = 'Asignado';
        if (extras?.otCode) {
          updatedItem.otVinculada = extras.otCode;
          const ot = ots.find(o => o.codigo === extras.otCode);
          if (ot) {
            updatedItem.plantaDestinoNombre = ot.plantaNombre;
          }
        }
        if (extras?.responsable) {
          updatedItem.responsable = extras.responsable;
        }
        break;
      case 'release':
        updatedItem.estado = 'Disponible';
        updatedItem.otVinculada = undefined;
        updatedItem.plantaDestinoNombre = undefined;
        updatedItem.responsable = undefined;
        break;
      case 'block':
        updatedItem.estado = 'Bloqueando OT';
        if (extras?.otCode) {
          updatedItem.otVinculada = extras.otCode;
          const ot = ots.find(o => o.codigo === extras.otCode);
          if (ot) {
            updatedItem.plantaDestinoNombre = ot.plantaNombre;
          }
        }
        break;
      case 'purchase':
        updatedItem.estado = 'Pendiente compra';
        break;
      case 'observation':
        if (obsInput.trim()) {
          updatedItem.nombre = `${updatedItem.nombre} (${obsInput})`;
          setObsInput('');
        }
        break;
      default:
        break;
    }

    if (isRepuesto) {
      const updatedList = repuestos.map(r => r.id === item.id ? (updatedItem as Repuesto) : r);
      onUpdateRepuestos(updatedList);
      setSelectedItem({ item: updatedItem as Repuesto, isRepuesto });
    } else {
      const updatedList = herramientas.map(h => h.id === item.id ? (updatedItem as Herramienta) : h);
      onUpdateHerramientas(updatedList);
      setSelectedItem({ item: updatedItem as Herramienta, isRepuesto });
    }

    // Block or Unblock associated OT
    if (onUpdateOts && ots) {
      if (action === 'block' && updatedItem.otVinculada) {
        const updatedOts = ots.map(o => {
          if (o.codigo === updatedItem.otVinculada) {
            return {
              ...o,
              estado: 'Bloqueada' as const,
              bloqueada: true,
              motivoBloqueo: `Falta de recurso crítico: ${updatedItem.nombre} (${updatedItem.id})`
            };
          }
          return o;
        });
        onUpdateOts(updatedOts);
      } else if (action === 'release' && item.otVinculada) {
        const updatedOts = ots.map(o => {
          if (o.codigo === item.otVinculada) {
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

    // Trigger Escalation if blocked
    if (action === 'block' && onUpdateEscalaciones) {
      const newEscalation: Escalation = {
        id: `ESC-R-${Date.now().toString().substring(8)}`,
        tipo: 'Repuesto bloqueando ejecución',
        estado: 'Detectado',
        responsable: updatedItem.responsable || activeUserName,
        comentario: `Bloqueo de ejecución detectado por falta de recurso crítico: ${updatedItem.nombre} (${updatedItem.id}). Afecta directamente a la Orden de Trabajo ${updatedItem.otVinculada || 'Sin especificar'}.`,
        otVinculada: updatedItem.otVinculada,
        plantaVinculada: updatedItem.plantaDestinoNombre,
        fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 16),
        criticidad: updatedItem.criticidad === 'Crítica' ? 'Crítica' : 'Alta',
        escaladoA: 'Logística / Bodega'
      };
      onUpdateEscalaciones([newEscalation, ...escalaciones]);
    }

    onAddAuditLog(
      `Recurso ${action === 'block' ? 'Bloqueando OT' : action === 'release' ? 'Liberado' : action}`,
      'Repuestos & Herramientas',
      updatedItem.otVinculada,
      updatedItem.plantaDestinoNombre,
      `Recurso ${item.id} (${item.nombre}) procesado con acción: ${action}. Nuevo estado: ${updatedItem.estado}.` + (updatedItem.otVinculada ? ` Vinculado a OT: ${updatedItem.otVinculada}.` : ''),
      item.criticidad
    );
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40';
      case 'Asignado':
      case 'En terreno':
        return 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/40';
      case 'Reservado':
        return 'bg-cyan-950/50 text-cyan-400 border border-cyan-900/40';
      case 'Pendiente compra':
        return 'bg-fuchsia-950/50 text-fuchsia-400 border border-fuchsia-900/40 animate-pulse';
      case 'Bloqueando OT':
        return 'bg-rose-950/50 text-rose-400 border border-rose-900/40 animate-pulse font-bold';
      case 'En mantención':
        return 'bg-amber-950/50 text-amber-400 border border-amber-900/40';
      default:
        return 'bg-slate-900 text-slate-400 border border-slate-800';
    }
  };

  const getCriticidadColor = (criticidad: string) => {
    switch (criticidad) {
      case 'Crítica':
        return 'text-red-400 font-black';
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
            <Package className="h-5.5 w-5.5 text-indigo-400" /> Repuestos & Herramientas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bodega centralizada de materiales críticos, instrumentos de medición y repuestos eléctricos para la ejecución de actividades de terreno.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold text-xs font-mono px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition-all hover:scale-102"
          >
            <PlusCircle className="h-4 w-4" /> Ingresar Recurso (Bodega)
          </button>
        )}
      </div>

      {/* FILTROS UNIFICADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar repuesto, herramienta, ID o OT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-indigo-500/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todos" className="bg-slate-950 text-white">Todos los Tipos</option>
            <option value="Repuesto" className="bg-slate-950 text-white">Repuestos</option>
            <option value="Herramienta" className="bg-slate-950 text-white">Herramientas & Equipos</option>
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
            {ESTADOS_RECURSOS.map((est) => (
              <option key={est} value={est} className="bg-slate-950 text-white">{est}</option>
            ))}
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
      </div>

      {/* REJILLA / DETALLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="px-4 py-3">Código & Recurso</th>
                  <th className="px-4 py-3">Tipo / Categoría</th>
                  <th className="px-4 py-3">Ubicación</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Vínculo OT</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Criticidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-xs font-mono">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500 text-[11px]">
                      No hay repuestos o herramientas registradas que coincidan con los criterios.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem({ item, isRepuesto: item.tipoRecurso === 'Repuesto' })}
                      className={`hover:bg-slate-900/30 cursor-pointer transition-colors ${
                        selectedItem && selectedItem.item.id === item.id ? 'bg-slate-900/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-indigo-400 font-bold">{item.id}</div>
                        <div className="font-sans font-medium text-slate-200 mt-0.5">{item.nombre}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                          item.tipoRecurso === 'Repuesto'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}>
                          {item.tipoRecurso}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">{item.categoria}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                        {item.ubicacion}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-white font-bold text-center sm:text-left">
                        {item.stockSimulado}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {item.otVinculada ? (
                          <div>
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                              {item.otVinculada}
                            </span>
                            {item.plantaDestinoNombre && (
                              <div className="text-[9px] text-slate-500 mt-0.5 max-w-[120px] truncate">{item.plantaDestinoNombre}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${getStatusColor(item.estado)}`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold ${getCriticidadColor(item.criticidad)}`}>
                          {item.criticidad}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COMPONENTE DETALLE DE RECURSO */}
        <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-xl space-y-6 self-start">
          {selectedItem ? (
            <div className="space-y-5">
              <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                <div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                    selectedItem.isRepuesto
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  }`}>
                    {selectedItem.isRepuesto ? 'Repuesto' : 'Herramienta'}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">{selectedItem.item.nombre}</h3>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">ID: {selectedItem.item.id}</p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <span className="text-slate-500 uppercase block">Ubicación Bodega</span>
                    <span className="text-slate-300 block font-bold mt-0.5">{selectedItem.item.ubicacion}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block">Estado Físico</span>
                    <span className="text-slate-300 block font-bold mt-0.5">{selectedItem.item.estado}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-500 uppercase block">Stock Disponible</span>
                    <span className="text-slate-300 block font-bold mt-0.5">{selectedItem.item.stockSimulado} unidades</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-500 uppercase block">Criticidad O&M</span>
                    <span className={`block font-bold mt-0.5 ${getCriticidadColor(selectedItem.item.criticidad)}`}>
                      {selectedItem.item.criticidad}
                    </span>
                  </div>
                </div>

                {/* Vínculo de OT */}
                {selectedItem.item.otVinculada && (
                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 space-y-1.5">
                    <span className="text-[9px] text-slate-500 uppercase block">Asignación Activa</span>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">{selectedItem.item.otVinculada}</span>
                      <span className="text-slate-400 text-[10px]">{selectedItem.item.plantaDestinoNombre}</span>
                    </div>
                    {selectedItem.item.responsable && (
                      <div className="text-[9px] text-slate-500">Responsable: {selectedItem.item.responsable}</div>
                    )}
                  </div>
                )}

                {/* Acciones del Recurso */}
                {canManage && (
                  <div className="space-y-3 pt-2">
                    <span className="text-[9px] text-slate-500 uppercase block">Acciones de Logística y Despacho</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {selectedItem.item.estado === 'Disponible' && (
                        <button
                          onClick={() => handleActionSimulated('reserve')}
                          className="px-2 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded text-[10px] text-center"
                        >
                          Reservar para Proyecto
                        </button>
                      )}

                      {selectedItem.item.estado !== 'Disponible' && (
                        <button
                          onClick={() => handleActionSimulated('release')}
                          className="px-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-[10px] text-center"
                        >
                          Liberar a Disponible
                        </button>
                      )}

                      {selectedItem.item.estado !== 'Pendiente compra' && (
                        <button
                          onClick={() => handleActionSimulated('purchase')}
                          className="px-2 py-2 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/20 rounded text-[10px] text-center"
                        >
                          Solicitar Compra
                        </button>
                      )}
                    </div>

                    {/* Formulario de Asignación Rápida a OT */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 space-y-2">
                      <span className="text-[9px] text-slate-500 uppercase block">Asignar directamente a Orden de Trabajo</span>
                      <div className="flex gap-1.5">
                        <select
                          id="quick-ot-assign-select"
                          className="bg-slate-900 border border-slate-800 text-slate-300 rounded p-1 text-[10px] flex-1 outline-none font-mono"
                          defaultValue=""
                        >
                          <option value="">Seleccionar OT...</option>
                          {ots.map(o => (
                            <option key={o.codigo} value={o.codigo}>{o.codigo} ({o.plantaNombre})</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const selectEl = document.getElementById('quick-ot-assign-select') as HTMLSelectElement;
                            if (selectEl?.value) {
                              handleActionSimulated('assign', { otCode: selectEl.value, responsable: activeUserName });
                            } else {
                              alert('Seleccione una OT para asignar el recurso.');
                            }
                          }}
                          className="px-2.5 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold rounded text-[10px] transition-colors"
                        >
                          Asignar
                        </button>
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={() => {
                            const selectEl = document.getElementById('quick-ot-assign-select') as HTMLSelectElement;
                            if (selectEl?.value) {
                              handleActionSimulated('block', { otCode: selectEl.value });
                            } else {
                              alert('Seleccione la OT que está siendo bloqueada por falta de este recurso.');
                            }
                          }}
                          className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[9px] rounded transition-colors text-center font-bold uppercase"
                        >
                          Marcar como Recurso Bloqueante de OT
                        </button>
                      </div>
                    </div>

                    {/* Agregar Observación / Especificación */}
                    <div className="space-y-1 pt-1">
                      <label className="text-[9px] text-slate-500 uppercase block">Registrar Especificación u Observación</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="p.ej., Calibrado, Marca, Serie..."
                          value={obsInput}
                          onChange={(e) => setObsInput(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-white text-[10px] font-mono outline-none focus:border-indigo-500/50"
                        />
                        <button
                          onClick={() => handleActionSimulated('observation')}
                          className="px-2 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded text-[10px]"
                        >
                          Registrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 font-mono text-xs leading-relaxed">
              Seleccione un repuesto o herramienta de la tabla para ver sus detalles en bodega, registrar una reserva, despacharlo a una planta de destino u ordenar compras simuladas.
            </div>
          )}
        </div>
      </div>

      {/* MODAL NUEVO RECURSO */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="h-4.5 w-4.5 text-indigo-400" /> Registrar Recurso en Bodega
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase block mb-1">Tipo de Recurso</label>
                  <select
                    value={newRec.tipo}
                    onChange={(e) => setNewRec({ ...newRec, tipo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500/50"
                  >
                    <option value="Repuesto">Repuesto</option>
                    <option value="Herramienta">Herramienta / Instrumento</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase block mb-1">Código ID (p.ej. REP99)</label>
                  <input
                    type="text"
                    placeholder="Dejar vacío para auto-generar"
                    value={newRec.id}
                    onChange={(e) => setNewRec({ ...newRec, id: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">Nombre del Recurso</label>
                <input
                  type="text"
                  placeholder="p.ej., Inversor de repuesto, Multímetro..."
                  value={newRec.nombre}
                  onChange={(e) => setNewRec({ ...newRec, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase block mb-1">Categoría</label>
                  <input
                    type="text"
                    placeholder="p.ej., Inversores, Medición"
                    value={newRec.categoria}
                    onChange={(e) => setNewRec({ ...newRec, categoria: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase block mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="1"
                    value={newRec.stockSimulado}
                    onChange={(e) => setNewRec({ ...newRec, stockSimulado: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase block mb-1">Ubicación Bodega</label>
                  <select
                    value={newRec.ubicacion}
                    onChange={(e) => setNewRec({ ...newRec, ubicacion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500/50"
                  >
                    <option value="Bodega Central">Bodega Central</option>
                    <option value="Bodega Norte">Bodega Norte</option>
                    <option value="Bodega Centro">Bodega Centro</option>
                    <option value="Bodega Sur">Bodega Sur</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase block mb-1">Criticidad</label>
                  <select
                    value={newRec.criticidad}
                    onChange={(e) => setNewRec({ ...newRec, criticidad: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500/50"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold rounded-lg"
                >
                  Registrar Recurso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
