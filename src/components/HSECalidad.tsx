/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Plus,
  PlusCircle,
  Search,
  User,
  Calendar,
  Layers,
  Activity,
  FileCheck,
  Zap,
  X,
  Check
} from 'lucide-react';
import { HSEFinding, Planta, OrganigramaNode, HSEFindingType } from '../types';
import { getPlantBadgeInfo } from '../data/plantIdentityMap';

interface HSECalidadProps {
  findings: HSEFinding[];
  plantas: Planta[];
  organigrama: OrganigramaNode[];
  onUpdate: (updatedFindings: HSEFinding[]) => void;
  userRole: string;
}

export default function HSECalidad({
  findings,
  plantas,
  organigrama,
  onUpdate,
  userRole,
}: HSECalidadProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [isReporting, setIsReporting] = useState<boolean>(false);

  // Formulario para Reportar Hallazgo
  const [newFinding, setNewFinding] = useState<Partial<HSEFinding>>({
    tipo: 'HSE',
    categoria: 'Condición Insegura',
    plantaId: plantas[0]?.id || '',
    descripcion: '',
    responsableCierre: '',
    fechaCompromiso: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estado: 'Abierto',
    gravedad: 'Media',
  });

  const canReport = ['SUPER_ADMIN_ORBI', 'HSE', 'CALIDAD', 'JEFE_TERRENO', 'SUPERVISOR_ZONA', 'INGENIERO_OM'].includes(userRole);
  const canReview = ['SUPER_ADMIN_ORBI', 'HSE', 'CALIDAD', 'JEFE_TERRENO'].includes(userRole);

  const CATEGORIAS_HSE: string[] = ['Condición Insegura', 'Incidente', 'AST', 'Permiso de Trabajo'];
  const CATEGORIAS_CALIDAD: string[] = ['Hallazgo de Calidad', 'Acción Correctiva'];

  const managers = organigrama.filter((n) => n.role !== 'LECTURA_CLIENTE');

  const handleReportClick = () => {
    setIsReporting(true);
    setNewFinding({
      id: `F-${(findings.length + 1).toString().padStart(3, '0')}`,
      tipo: 'HSE',
      categoria: 'Condición Insegura',
      plantaId: plantas[0]?.id || '',
      plantaNombre: plantas[0]?.name || '',
      descripcion: '',
      responsableCierre: managers[0]?.name || '',
      fechaCompromiso: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estado: 'Abierto',
      gravedad: 'Media',
    });
  };

  const handleSaveReport = () => {
    if (!newFinding.descripcion) {
      alert('Por favor describa el hallazgo o condición insegura.');
      return;
    }
    const targetPlanta = plantas.find((p) => p.id === newFinding.plantaId);
    const findingToAdd: HSEFinding = {
      id: newFinding.id || `F-${(findings.length + 1).toString().padStart(3, '0')}`,
      tipo: (newFinding.tipo as 'HSE' | 'Calidad') || 'HSE',
      plantaId: newFinding.plantaId || '',
      plantaNombre: targetPlanta ? targetPlanta.name : '',
      categoria: newFinding.categoria || 'Condición Insegura',
      descripcion: newFinding.descripcion,
      responsableCierre: newFinding.responsableCierre || '',
      fechaCompromiso: newFinding.fechaCompromiso || '',
      estado: 'Abierto',
      gravedad: (newFinding.gravedad as any) || 'Media',
    };

    onUpdate([findingToAdd, ...findings]);
    setIsReporting(false);
  };

  const handleToggleState = (id: string, nextState: 'Abierto' | 'En Revisión' | 'Cerrado') => {
    const updated = findings.map((f) => {
      if (f.id === id) {
        return { 
          ...f, 
          estado: nextState,
          evidencia: nextState === 'Cerrado' ? 'cierre_normalizado_evidencia.pdf' : f.evidencia
        };
      }
      return f;
    });
    onUpdate(updated);
  };

  const filteredFindings = findings.filter((f) => {
    const matchesSearch =
      f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.plantaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.responsableCierre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'Todos' || f.tipo === filterType;
    const matchesEstado = filterEstado === 'Todos' || f.estado === filterEstado;

    return matchesSearch && matchesType && matchesEstado;
  });

  // Métricas rápidas
  const totalAbiertos = findings.filter((f) => f.estado !== 'Cerrado').length;
  const hseCount = findings.filter((f) => f.tipo === 'HSE' && f.estado !== 'Cerrado').length;
  const calidadCount = findings.filter((f) => f.tipo === 'Calidad' && f.estado !== 'Cerrado').length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-emerald-400" /> HSE & Quality Bridge
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de seguridad operacional, auditorías de terreno, permisos de trabajo (AST/PT) y aseguramiento de calidad (QA/QC).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400">
            DESVÍOS ACTIVOS: <span className="text-rose-400 font-bold">{totalAbiertos} ABIERTOS</span>
          </div>

          {canReport && (
            <button
              onClick={handleReportClick}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition-colors"
            >
              <PlusCircle className="h-4 w-4" /> Reportar Hallazgo
            </button>
          )}
        </div>
      </div>

      {/* Mini Tarjetas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Hallazgos HSE Activos</span>
            <div className="text-xl font-bold text-rose-400 mt-1 font-mono">{hseCount}</div>
          </div>
          <AlertTriangle className="h-5 w-5 text-rose-400" />
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Desvíos Calidad Activos</span>
            <div className="text-xl font-bold text-purple-400 mt-1 font-mono">{calidadCount}</div>
          </div>
          <FileCheck className="h-5 w-5 text-purple-400" />
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Tasa de Cierre Global</span>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              {findings.length > 0 ? Math.round((findings.filter(f => f.estado === 'Cerrado').length / findings.length) * 100) : 100}%
            </div>
          </div>
          <CheckCircle className="h-5 w-5 text-emerald-400" />
        </div>
      </div>

      {/* Buscador de Hallazgos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por ID, descripción, responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-emerald-500/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Layers className="h-4 w-4 text-slate-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todos" className="bg-slate-950 text-white">Todos los Departamentos</option>
            <option value="HSE" className="bg-slate-950 text-white">HSE (Seguridad)</option>
            <option value="Calidad" className="bg-slate-950 text-white">Calidad (Técnico)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Activity className="h-4 w-4 text-slate-500" />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
          >
            <option value="Todos" className="bg-slate-950 text-white">Todos los Estados</option>
            <option value="Abierto" className="bg-slate-950 text-white">Abiertos</option>
            <option value="En Revisión" className="bg-slate-950 text-white">En Revisión</option>
            <option value="Cerrado" className="bg-slate-950 text-white">Cerrados</option>
          </select>
        </div>
      </div>

      {/* Formulario de Reporte - Modal */}
      {isReporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-emerald-400" /> Reporte de Incidente / No Conformidad
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Departamento</label>
                  <select
                    value={newFinding.tipo}
                    onChange={(e) => {
                      const type = e.target.value as 'HSE' | 'Calidad';
                      setNewFinding({
                        ...newFinding,
                        tipo: type,
                        categoria: type === 'HSE' ? 'Condición Insegura' : 'Hallazgo de Calidad'
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  >
                    <option value="HSE">HSE (Seguridad)</option>
                    <option value="Calidad">Calidad (Inspección)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Categoría Específica</label>
                  <select
                    value={newFinding.categoria}
                    onChange={(e) => setNewFinding({ ...newFinding, categoria: e.target.value as HSEFindingType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  >
                    {newFinding.tipo === 'HSE'
                      ? CATEGORIAS_HSE.map(cat => <option key={cat} value={cat}>{cat}</option>)
                      : CATEGORIAS_CALIDAD.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Asociar a Planta</label>
                  <select
                    value={newFinding.plantaId}
                    onChange={(e) => {
                      const pl = plantas.find(p => p.id === e.target.value);
                      setNewFinding({ ...newFinding, plantaId: e.target.value, plantaNombre: pl ? pl.name : '' });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  >
                    {plantas.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Gravedad / Riesgo</label>
                  <select
                    value={newFinding.gravedad}
                    onChange={(e) => setNewFinding({ ...newFinding, gravedad: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Responsable de Cierre</label>
                  <select
                    value={newFinding.responsableCierre}
                    onChange={(e) => setNewFinding({ ...newFinding, responsableCierre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  >
                    {managers.map(m => (
                      <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Fecha Límite / Compromiso</label>
                  <input
                    type="date"
                    value={newFinding.fechaCompromiso}
                    onChange={(e) => setNewFinding({ ...newFinding, fechaCompromiso: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase">Descripción de la Observación o Condición</label>
                <textarea
                  rows={3}
                  value={newFinding.descripcion}
                  onChange={(e) => setNewFinding({ ...newFinding, descripcion: e.target.value })}
                  placeholder="Detalle exactamente lo observado (ej. mallas rotas, conductores expuestos, extintor vencido, herramientas sin tarjeta mensual)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none resize-none mt-1"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsReporting(false)}
                className="px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs font-mono text-slate-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveReport}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono flex items-center gap-1 transition-colors"
              >
                <Check className="h-3.5 w-3.5" /> Registrar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listado de Hallazgos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFindings.map((finding) => {
          let badgeColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
          if (finding.tipo === 'Calidad') badgeColor = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';

          let stateColor = 'bg-slate-850 text-slate-400 border border-slate-800';
          if (finding.estado === 'Abierto') stateColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
          else if (finding.estado === 'En Revisión') stateColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
          else if (finding.estado === 'Cerrado') stateColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';

          const isHigh = finding.gravedad === 'Alta';

          return (
            <div
              key={finding.id}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-md transition-all group"
            >
              <div>
                {/* Cabecera Tarjeta */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                    ID: {finding.id}
                  </span>

                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${stateColor}`}>
                    {finding.estado}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}>
                    {finding.categoria}
                  </span>
                  
                  <span className={`text-[8px] font-mono px-1 py-0.5 rounded uppercase font-bold ${isHigh ? 'text-rose-400 bg-rose-500/5 border border-rose-500/10' : 'text-slate-500'}`}>
                    GRAVEDAD: {finding.gravedad}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <h4 className="text-xs font-bold text-slate-300">{finding.plantaNombre}</h4>
                  {(() => {
                    const badge = getPlantBadgeInfo((finding as any).legacyPlantId || finding.plantaId || finding.plantaNombre, finding.plantaId);
                    if (badge.label === 'PLANTA MASTER CONFIRMADA') return null;
                    return (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${badge.styleToken}`} title={badge.tooltip}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  "{finding.descripcion}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-950 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Resp: <strong className="text-slate-300 font-semibold">{finding.responsableCierre}</strong>
                  </span>

                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Límite: <strong className="text-slate-400 font-semibold">{finding.fechaCompromiso}</strong>
                  </span>
                </div>

                {finding.evidencia && (
                  <div className="bg-slate-950 text-[9px] font-mono text-emerald-400 border border-emerald-500/10 rounded p-2 flex items-center justify-between mt-1">
                    <span>📁 Evidencia: {finding.evidencia}</span>
                    <span className="text-[8px] text-slate-600">VERIFICADO</span>
                  </div>
                )}

                {/* Acciones Rápidas para Administrador / HSE */}
                {canReview && finding.estado !== 'Cerrado' && (
                  <div className="flex gap-1.5 pt-2 border-t border-slate-950/80">
                    {finding.estado === 'Abierto' && (
                      <button
                        onClick={() => handleToggleState(finding.id, 'En Revisión')}
                        className="flex-1 text-[9px] font-mono bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-amber-400 py-1.5 rounded transition-colors"
                      >
                        Pasar a Revisión
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleState(finding.id, 'Cerrado')}
                      className="flex-1 text-[9px] font-mono bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 py-1.5 rounded transition-colors font-bold"
                    >
                      Cerrar Desvío (Firmar)
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredFindings.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
            No hay hallazgos registrados con estos filtros. Operación limpia.
          </div>
        )}
      </div>
    </div>
  );
}
