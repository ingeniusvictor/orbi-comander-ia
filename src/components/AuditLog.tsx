/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClipboardList, Search, Filter, Clock, Tag, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { AuditLogEvent } from '../types';

interface AuditLogProps {
  logs: AuditLogEvent[];
  onRefresh?: () => void;
}

export default function AuditLog({ logs, onRefresh }: AuditLogProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterModulo, setFilterModulo] = useState<string>('Todos');
  const [filterCriticidad, setFilterCriticidad] = useState<string>('Todas');
  const [filterPlanta, setFilterPlanta] = useState<string>('Todas');

  // Extraer valores únicos para los selectores de filtros
  const modulosUnicos = Array.from(new Set(logs.map((log) => log.moduloOrigen)));
  const plantasUnicas = Array.from(new Set(logs.filter(log => log.plantaVinculada).map((log) => log.plantaVinculada!)));

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.comentario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuarioRol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.otVinculada && log.otVinculada.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesModulo = filterModulo === 'Todos' || log.moduloOrigen === filterModulo;
    const matchesCriticidad = filterCriticidad === 'Todas' || log.criticidad === filterCriticidad;
    const matchesPlanta = filterPlanta === 'Todas' || log.plantaVinculada === filterPlanta;

    return matchesSearch && matchesModulo && matchesCriticidad && matchesPlanta;
  });

  const getCriticityBadge = (criticidad: 'Baja' | 'Media' | 'Alta' | 'Crítica') => {
    switch (criticidad) {
      case 'Crítica':
        return 'bg-red-950/60 text-red-400 border border-red-900/60 font-semibold';
      case 'Alta':
        return 'bg-orange-950/60 text-orange-400 border border-orange-900/60';
      case 'Media':
        return 'bg-yellow-950/60 text-yellow-400 border border-yellow-900/60';
      default:
        return 'bg-slate-900 text-slate-400 border border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ClipboardList className="h-5.5 w-5.5 text-indigo-400" /> ORBI Audit Log
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Trazabilidad completa e inmutable de eventos operacionales, decisiones de Jefatura y asignación de recursos en terreno.
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 flex items-center gap-1.5 text-xs font-mono transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Sincronizar Logs
          </button>
        )}
      </div>

      {/* FILTROS DE TRAZABILIDAD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción, comentario o OT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-indigo-500/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={filterModulo}
            onChange={(e) => setFilterModulo(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todos" className="bg-slate-950 text-white">Todos los Módulos</option>
            {modulosUnicos.map((m) => (
              <option key={m} value={m} className="bg-slate-950 text-white">{m}</option>
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

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={filterPlanta}
            onChange={(e) => setFilterPlanta(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todas" className="bg-slate-950 text-white">Todas las Plantas</option>
            {plantasUnicas.map((p) => (
              <option key={p} value={p} className="bg-slate-950 text-white">{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTADO DE EVENTOS */}
      <div className="bg-slate-900/20 border border-slate-900/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="px-5 py-3">Código/Fecha</th>
                <th className="px-5 py-3">Módulo & Acción</th>
                <th className="px-5 py-3">Usuario / Rol</th>
                <th className="px-5 py-3">Vínculo OT/Planta</th>
                <th className="px-5 py-3">Comentario</th>
                <th className="px-5 py-3 text-center">Criticidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 font-mono">
                    No se encontraron registros de auditoría que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-[10px] font-mono text-indigo-400 font-bold">{log.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {log.fechaHora}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-[10px] text-slate-500 font-mono uppercase">{log.moduloOrigen}</div>
                      <div className="font-bold text-white mt-0.5">{log.accion}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-200 font-medium">{log.usuarioRol}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {log.otVinculada && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 mr-2">
                          <Tag className="h-3 w-3" /> {log.otVinculada}
                        </span>
                      )}
                      {log.plantaVinculada && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                          <MapPin className="h-3 w-3" /> {log.plantaVinculada}
                        </span>
                      )}
                      {!log.otVinculada && !log.plantaVinculada && (
                        <span className="text-slate-500 font-mono text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 max-w-sm">
                      <p className="text-slate-300 leading-relaxed font-mono text-[11px] break-words">
                        {log.comentario}
                      </p>
                      {log.estadoAnterior && log.estadoNuevo && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] font-mono bg-slate-950 text-slate-500 px-1 rounded border border-slate-900">{log.estadoAnterior}</span>
                          <span className="text-[9px] text-slate-500 font-mono">→</span>
                          <span className="text-[9px] font-mono bg-slate-950 text-emerald-400 px-1 rounded border border-slate-900">{log.estadoNuevo}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${getCriticityBadge(log.criticidad)}`}>
                        {log.criticidad}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* PIE DE TABLA */}
        <div className="bg-slate-950/60 border-t border-slate-900 px-5 py-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Mostrando {filteredLogs.length} de {logs.length} eventos de auditoría</span>
          <span>Ecosistema de Datos ORBI Seguro</span>
        </div>
      </div>
    </div>
  );
}
