/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sun,
  Search,
  Filter,
  ExternalLink,
  Edit2,
  Calendar,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  X,
  Check,
  Plus,
  Trash2,
  RotateCcw,
  Shield,
  Zap,
  Database,
  CheckCircle2,
  Info,
  Globe,
  Radio,
  Video,
  Activity,
  FileText,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Planta, OrganigramaNode } from '../types';
import { INITIAL_PLANTAS } from '../data/db';

interface MatrizPlantasProps {
  plantas: Planta[];
  organigrama: OrganigramaNode[];
  onUpdate: (updatedPlantas: Planta[]) => void;
  userRole: string;
  initialFilters?: any;
}

export default function MatrizPlantas({
  plantas = [],
  organigrama = [],
  onUpdate,
  userRole,
  initialFilters,
}: MatrizPlantasProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterZona, setFilterZona] = useState<string>(initialFilters?.zona || 'Todas');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [filterDataLevel, setFilterDataLevel] = useState<string>('Todos');
  const [filterCliente, setFilterCliente] = useState<string>('Todos');
  const [filterConfidence, setFilterConfidence] = useState<string>('Todas');

  const [editingPlanta, setEditingPlanta] = useState<Planta | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'identificacion' | 'tecnicos' | 'publica' | 'infraestructura' | 'telemetria'>('identificacion');
  const [editError, setEditError] = useState<string | null>(null);

  // CRUD & Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [retiringPlanta, setRetiringPlanta] = useState<Planta | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<boolean>(false);

  const supervisors = (organigrama || []).filter((n) => n.role === 'SUPERVISOR_TERRENO');
  const engineers = (organigrama || []).filter((n) => n.role === 'INGENIERO_OM');

  const [newPlanta, setNewPlanta] = useState<Partial<Planta>>({
    orbi_id: '',
    name: '',
    cliente: '',
    commune: '',
    region: 'Metropolitana',
    zona: 'Centro',
    mwp: 3.0,
    data_level: 'Base inicial',
    confidence: 'Sin validar',
    supervisor: supervisors[0]?.name || 'Alejandro Rojas',
    ingeniero: engineers[0]?.name || 'Yasmín Castro',
    estado: 'Operacional',
    ultimoMantenimiento: new Date().toISOString().split('T')[0],
    proximoMantenimiento: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    criticidad: 'Sin validar',
    linkDocumental: 'https://sharepoint.orbi.internal/om/docs',
    credentials_included: false,
  });

  const canEdit = ['SUPER_ADMIN_ORBI', 'GERENCIA', 'JEFE_OM', 'COORDINADOR_OM'].includes(userRole);

  // Extract unique clients for filter dropdown
  const uniqueClients = Array.from(new Set(plantas.map(p => p.cliente || p.client).filter(Boolean))).sort();

  const handleEditClick = (planta: Planta) => {
    setEditError(null);
    setActiveModalTab('identificacion');
    setEditingPlanta({ ...planta });
  };

  const handleSaveEdit = () => {
    if (!editingPlanta) return;
    setEditError(null);

    const cleanName = editingPlanta.name.trim();
    const cleanCliente = (editingPlanta.cliente || editingPlanta.client || '').trim();

    if (!cleanName) {
      setEditError('El nombre de la planta no puede estar vacío.');
      return;
    }

    if (!cleanCliente) {
      setEditError('El nombre del cliente no puede estar vacío.');
      return;
    }

    const key = editingPlanta.orbi_id || editingPlanta.id;
    const index = plantas.findIndex((p) => (p.orbi_id || p.id) === key);
    if (index !== -1) {
      const updated = [...plantas];
      updated[index] = {
        ...editingPlanta,
        name: cleanName,
        plant_name: cleanName,
        cliente: cleanCliente,
        client: cleanCliente,
      };
      onUpdate(updated);
      setEditingPlanta(null);
    }
  };

  const handleCreatePlanta = () => {
    if (!canEdit) return;
    setCreateError(null);

    const cleanId = (newPlanta.orbi_id || newPlanta.id || '').trim();
    const cleanName = (newPlanta.name || '').trim();
    const cleanCliente = (newPlanta.cliente || '').trim();

    if (!cleanId) {
      setCreateError('El identificador (ID / ORBI-ID) de la planta es obligatorio.');
      return;
    }

    if (plantas.some((p) => (p.orbi_id || p.id).toLowerCase() === cleanId.toLowerCase())) {
      setCreateError(`El ID "${cleanId}" ya existe en el catastro.`);
      return;
    }

    if (!cleanName) {
      setCreateError('El nombre de la planta es obligatorio.');
      return;
    }

    if (!cleanCliente) {
      setCreateError('El nombre del cliente es obligatorio.');
      return;
    }

    const plantaToCreate: Planta = {
      id: cleanId,
      orbi_id: cleanId,
      portfolio: 'TRITEC-INTERVENTO O&M',
      name: cleanName,
      plant_name: cleanName,
      cliente: cleanCliente,
      client: cleanCliente,
      commune: newPlanta.commune || '',
      region: newPlanta.region || 'Metropolitana',
      zona: newPlanta.zona || 'Centro',
      mwp: Number(newPlanta.mwp) || 3.0,
      data_level: newPlanta.data_level || 'Base inicial',
      confidence: newPlanta.confidence || 'Sin validar',
      review_status: 'PENDIENTE ENRIQUECIMIENTO',
      validation_note: 'Planta creada manualmente por supervisor.',
      supervisor: newPlanta.supervisor || (supervisors[0]?.name || 'Alejandro Rojas'),
      ingeniero: newPlanta.ingeniero || (engineers[0]?.name || 'Yasmín Castro'),
      estado: newPlanta.estado || 'Operacional',
      ultimoMantenimiento: newPlanta.ultimoMantenimiento || new Date().toISOString().split('T')[0],
      proximoMantenimiento: newPlanta.proximoMantenimiento || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      criticidad: newPlanta.confidence === 'Alta' ? 'Alta' : 'Baja',
      linkDocumental: newPlanta.linkDocumental || 'https://sharepoint.orbi.internal/om/docs',
      credentials_included: false,
      last_master_update: '2026-08-02',
      scada: { status: 'unknown' },
      meteorology: { status: 'unknown' },
      cctv: { status: 'unknown' },
      communications: { status: 'unknown' },
      operational_risk: { level: 'unknown' },
    };

    const updated = [...plantas, plantaToCreate];
    onUpdate(updated);
    setShowCreateModal(false);
  };

  const handleConfirmRetiro = () => {
    if (!canEdit || !retiringPlanta) return;

    const key = retiringPlanta.orbi_id || retiringPlanta.id;
    const updated = plantas.filter((p) => (p.orbi_id || p.id) !== key);
    onUpdate(updated);

    if (editingPlanta && (editingPlanta.orbi_id || editingPlanta.id) === key) {
      setEditingPlanta(null);
    }

    setRetiringPlanta(null);
  };

  const filteredPlantas = (plantas || []).filter((planta) => {
    const searchLower = searchTerm.toLowerCase();
    const pName = (planta.name || planta.plant_name || '').toLowerCase();
    const pClient = (planta.cliente || planta.client || '').toLowerCase();
    const pId = (planta.orbi_id || planta.id || '').toLowerCase();
    const pCommune = (planta.commune || '').toLowerCase();
    const pCenName = (planta.public_name_cen || '').toLowerCase();

    const matchesSearch =
      pName.includes(searchLower) ||
      pClient.includes(searchLower) ||
      pId.includes(searchLower) ||
      pCommune.includes(searchLower) ||
      pCenName.includes(searchLower);

    const matchesZona = filterZona === 'Todas' || planta.zona === filterZona;
    const matchesEstado = filterEstado === 'Todos' || planta.estado === filterEstado;
    const matchesDataLevel = filterDataLevel === 'Todos' || planta.data_level === filterDataLevel;
    const matchesCliente = filterCliente === 'Todos' || (planta.cliente || planta.client) === filterCliente;
    const matchesConfidence = filterConfidence === 'Todas' || planta.confidence === filterConfidence;

    return matchesSearch && matchesZona && matchesEstado && matchesDataLevel && matchesCliente && matchesConfidence;
  });

  // Calculate master database stats
  const totalPlantas = plantas.length;
  const enrichedCount = plantas.filter(p => p.data_level === 'Enriquecida').length;
  const baseCount = totalPlantas - enrichedCount;
  const altaConfidenceCount = plantas.filter(p => p.confidence === 'Alta').length;

  return (
    <div className="space-y-6">
      {/* Cabecera Principal y KPIs */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                ORBI MASTER DATABASE v1.0
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                PORTAFOLIO TRITEC-INTERVENTO O&M
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <Sun className="h-6 w-6 text-emerald-400" /> Matriz de Activos Solares Master
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Catastro técnico unificado de {totalPlantas} plantas solares (PMGD/PMG), con auditoría técnica interna, validación pública CEN y semáforos de confiabilidad operacional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {canEdit ? (
              <>
                <button
                  onClick={() => {
                    setCreateError(null);
                    setNewPlanta({
                      orbi_id: `ORBI-PV-${(plantas.length + 1).toString().padStart(3, '0')}`,
                      name: '',
                      cliente: '',
                      commune: '',
                      region: 'Metropolitana',
                      zona: 'Centro',
                      mwp: 3.0,
                      data_level: 'Base inicial',
                      confidence: 'Sin validar',
                      supervisor: supervisors[0]?.name || 'Alejandro Rojas',
                      ingeniero: engineers[0]?.name || 'Yasmín Castro',
                      estado: 'Operacional',
                      ultimoMantenimiento: new Date().toISOString().split('T')[0],
                      proximoMantenimiento: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
                      criticidad: 'Sin validar',
                      linkDocumental: 'https://sharepoint.orbi.internal/om/docs',
                      credentials_included: false,
                    });
                    setShowCreateModal(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Registrar Planta Master
                </button>

                <button
                  onClick={() => setShowRestoreConfirm(true)}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-mono text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Restaurar base master de 59 plantas"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-400" /> Reset Master DB
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-semibold">
                <Shield className="h-4 w-4 text-amber-400" /> MODO LECTURA AUDITORÍA
              </div>
            )}
          </div>
        </div>

        {/* Tarjetas KPI de Resumen Master */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-slate-400" /> Total Catastro
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {totalPlantas} <span className="text-xs font-normal text-slate-400">Activos</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Fichas Enriquecidas
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {enrichedCount} <span className="text-xs font-normal text-slate-400">({Math.round((enrichedCount/totalPlantas)*100)}%)</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-sky-400" /> Base Inicial
            </div>
            <div className="text-xl font-bold font-mono text-sky-400 mt-1">
              {baseCount} <span className="text-xs font-normal text-slate-400">({Math.round((baseCount/totalPlantas)*100)}%)</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-amber-400" /> Confiabilidad Alta CEN
            </div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {altaConfidenceCount} <span className="text-xs font-normal text-slate-400">Validadas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador y Barra de Filtros Avanzada */}
      <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Barra de Búsqueda General */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por ID, Planta, Cliente, Comuna o Nombre CEN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-emerald-500/50 outline-none"
            />
          </div>

          {/* Filtro Cliente */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
            >
              <option value="Todos" className="bg-slate-950 text-white">Todos los Clientes ({uniqueClients.length})</option>
              {uniqueClients.map(c => (
                <option key={c} value={c} className="bg-slate-950 text-white">{c}</option>
              ))}
            </select>
          </div>

          {/* Filtro Data Level */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Database className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={filterDataLevel}
              onChange={(e) => setFilterDataLevel(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
            >
              <option value="Todos" className="bg-slate-950 text-white">Todos los Niveles Data</option>
              <option value="Enriquecida" className="bg-slate-950 text-emerald-400">Enriquecida ({enrichedCount})</option>
              <option value="Base inicial" className="bg-slate-950 text-sky-400">Base inicial ({baseCount})</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-900">
          {/* Filtro Zona */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/80 px-3 py-1.5 rounded-xl">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
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

          {/* Filtro Estado Operacional */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/80 px-3 py-1.5 rounded-xl">
            <Activity className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
            >
              <option value="Todos" className="bg-slate-950 text-white">Todos los Estados</option>
              <option value="Operacional" className="bg-slate-950 text-white">Operacional</option>
              <option value="Limitada" className="bg-slate-950 text-white">Limitada</option>
              <option value="Fuera de Servicio" className="bg-slate-950 text-white">Fuera de Servicio</option>
              <option value="En Mantenimiento" className="bg-slate-950 text-white">En Mantenimiento</option>
            </select>
          </div>

          {/* Filtro Confiabilidad */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/80 px-3 py-1.5 rounded-xl">
            <Shield className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={filterConfidence}
              onChange={(e) => setFilterConfidence(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-mono outline-none border-none cursor-pointer flex-1"
            >
              <option value="Todas" className="bg-slate-950 text-white">Todas las Confiabilidades</option>
              <option value="Alta" className="bg-slate-950 text-emerald-400">Alta (Validadas CEN)</option>
              <option value="Media" className="bg-slate-950 text-amber-400">Media</option>
              <option value="Baja" className="bg-slate-950 text-rose-400">Baja</option>
              <option value="Sin validar" className="bg-slate-950 text-slate-400">Sin validar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas de Plantas Master */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPlantas.map((planta) => {
          const isEnriched = planta.data_level === 'Enriquecida';
          const isAlta = planta.confidence === 'Alta';
          const isMedia = planta.confidence === 'Media';

          let statusBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          let statusIndicator = 'bg-emerald-500';
          if (planta.estado === 'Limitada') {
            statusBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            statusIndicator = 'bg-amber-500';
          } else if (planta.estado === 'Fuera de Servicio') {
            statusBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            statusIndicator = 'bg-rose-500';
          } else if (planta.estado === 'En Mantenimiento') {
            statusBg = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            statusIndicator = 'bg-orange-500';
          }

          return (
            <div
              key={planta.orbi_id || planta.id}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-md"
            >
              <div>
                {/* Cabecera Tarjeta: Badges Data Level y Confiabilidad */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {planta.orbi_id || planta.id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Badge Data Level */}
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                      isEnriched 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    }`}>
                      {isEnriched ? <Zap className="h-2.5 w-2.5" /> : <Layers className="h-2.5 w-2.5" />}
                      {planta.data_level}
                    </span>

                    {/* Badge Confiabilidad */}
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold border ${
                      isAlta ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                      isMedia ? 'bg-amber-950 text-amber-300 border-amber-800' :
                      planta.confidence === 'Baja' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                      'bg-slate-950 text-slate-400 border-slate-800'
                    }`}>
                      {planta.confidence}
                    </span>
                  </div>
                </div>

                {/* Nombre de la Planta y Cliente */}
                <div className="mb-3">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                    {planta.name || planta.plant_name}
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center justify-between mt-0.5">
                    <span className="font-semibold text-slate-300">{planta.cliente || planta.client}</span>
                    <span className="text-[10px] font-mono text-slate-500">{planta.commune ? `${planta.commune}, ${planta.region}` : planta.region}</span>
                  </div>
                </div>

                {/* Magnitudes de Potencia Independientes */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-900 mb-3 text-center">
                  <div>
                    <div className="text-[8px] font-mono text-slate-500 uppercase">Interna (MW)</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                      {planta.internal_power_mw !== null && planta.internal_power_mw !== undefined ? `${planta.internal_power_mw} MW` : `${planta.mwp} MW`}
                    </div>
                  </div>

                  <div>
                    <div className="text-[8px] font-mono text-slate-500 uppercase">Pública AC (MW)</div>
                    <div className="text-xs font-bold text-sky-400 font-mono mt-0.5">
                      {planta.public_ac_mw !== null && planta.public_ac_mw !== undefined ? `${planta.public_ac_mw} MW` : 'N/D'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[8px] font-mono text-slate-500 uppercase">Const. DC (MWp)</div>
                    <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                      {planta.construction_dc_mwp !== null && planta.construction_dc_mwp !== undefined ? `${planta.construction_dc_mwp} MWp` : 'N/D'}
                    </div>
                  </div>
                </div>

                {/* Equipamiento Técnico Clave (si está enriquecida) */}
                {isEnriched && (
                  <div className="space-y-1 mb-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60 text-[10px] font-mono">
                    {planta.tracker && (
                      <div className="flex justify-between text-slate-400">
                        <span className="text-slate-500">Tracker:</span>
                        <span className="text-slate-200">{planta.tracker}</span>
                      </div>
                    )}
                    {planta.inverter_model && (
                      <div className="flex justify-between text-slate-400">
                        <span className="text-slate-500">Inversor:</span>
                        <span className="text-slate-200 truncate max-w-[160px]">{planta.inverter_model}</span>
                      </div>
                    )}
                    {planta.substation && (
                      <div className="flex justify-between text-slate-400">
                        <span className="text-slate-500">S/E CEN:</span>
                        <span className="text-slate-200">{planta.substation}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Semáforo de Estado Operacional */}
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-950/80 mb-3">
                  <span className="text-slate-500 font-mono">Estado Operacional:</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold flex items-center gap-1.5 border ${statusBg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusIndicator}`}></span>
                    {planta.estado}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-950/80">
                <button
                  onClick={() => handleEditClick(planta)}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-xs font-mono text-slate-300 hover:text-emerald-400 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" /> Ficha Técnica Completa
                </button>

                {planta.maps_url && (
                  <a
                    href={planta.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                    title="Ver en Google Maps"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {filteredPlantas.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
            No se encontraron plantas en la Base Master que coincidan con los filtros seleccionados.
          </div>
        )}
      </div>

      {/* MODAL DETALLE Y EDICIÓN COMPLETA FICHA PLANTA MASTER */}
      {editingPlanta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
            {/* Cabecera del Modal */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {editingPlanta.orbi_id || editingPlanta.id}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {editingPlanta.portfolio || 'TRITEC-INTERVENTO O&M'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                  <Sun className="h-5 w-5 text-emerald-400" /> Ficha Master: {editingPlanta.name || editingPlanta.plant_name}
                </h3>
              </div>

              <button
                onClick={() => setEditingPlanta(null)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Pestañas de Navegación Visual de Ficha */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveModalTab('identificacion')}
                className={`py-3 px-3 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeModalTab === 'identificacion'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" /> 1. Ubicación e ID
              </button>

              <button
                onClick={() => setActiveModalTab('tecnicos')}
                className={`py-3 px-3 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeModalTab === 'tecnicos'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="h-3.5 w-3.5" /> 2. Datos Técnicos
              </button>

              <button
                onClick={() => setActiveModalTab('publica')}
                className={`py-3 px-3 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeModalTab === 'publica'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="h-3.5 w-3.5" /> 3. Validación Pública CEN
              </button>

              <button
                onClick={() => setActiveModalTab('infraestructura')}
                className={`py-3 px-3 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeModalTab === 'infraestructura'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5" /> 4. Infraestructura Operacional
              </button>

              <button
                onClick={() => setActiveModalTab('telemetria')}
                className={`py-3 px-3 text-xs font-mono font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeModalTab === 'telemetria'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="h-3.5 w-3.5" /> 5. Telemetría y Riesgos
              </button>
            </div>

            {/* Contenido del Modal con Scroll */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {editError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-xs flex items-center gap-2 font-mono">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* TAB 1: IDENTIFICACIÓN Y UBICACIÓN */}
              {activeModalTab === 'identificacion' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">ORBI ID / Código</label>
                      <input
                        type="text"
                        disabled
                        value={editingPlanta.orbi_id || editingPlanta.id}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-emerald-400 font-mono mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Nombre de Planta</label>
                      <input
                        type="text"
                        value={editingPlanta.name || editingPlanta.plant_name || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, name: e.target.value, plant_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Cliente / Propietario</label>
                      <input
                        type="text"
                        value={editingPlanta.cliente || editingPlanta.client || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, cliente: e.target.value, client: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Comuna</label>
                      <input
                        type="text"
                        value={editingPlanta.commune || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, commune: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Región</label>
                      <input
                        type="text"
                        value={editingPlanta.region || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, region: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Zona Operacional</label>
                      <select
                        value={editingPlanta.zona}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, zona: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                      >
                        <option value="Norte">Zona Norte</option>
                        <option value="Centro">Zona Centro</option>
                        <option value="Sur">Zona Sur</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Enlace Google Maps</label>
                      <input
                        type="text"
                        value={editingPlanta.maps_url || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, maps_url: e.target.value })}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono outline-none mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Tipo de Activo</label>
                      <input
                        type="text"
                        value={editingPlanta.asset_type || 'PMGD/PMG Solar FV'}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, asset_type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DATOS TÉCNICOS INTERNOS */}
              {activeModalTab === 'tecnicos' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider mb-3">
                      Magnitudes de Potencia Físicas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Potencia Interna AC (MW)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editingPlanta.internal_power_mw !== null && editingPlanta.internal_power_mw !== undefined ? editingPlanta.internal_power_mw : editingPlanta.mwp}
                          onChange={(e) => setEditingPlanta({ ...editingPlanta, internal_power_mw: parseFloat(e.target.value), mwp: parseFloat(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-emerald-400 font-bold font-mono mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Potencia Pública AC CEN (MW)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingPlanta.public_ac_mw || ''}
                          onChange={(e) => setEditingPlanta({ ...editingPlanta, public_ac_mw: e.target.value ? parseFloat(e.target.value) : null })}
                          placeholder="Ej: 6.0"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-sky-400 font-bold font-mono mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Potencia Construcción DC (MWp)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingPlanta.construction_dc_mwp || ''}
                          onChange={(e) => setEditingPlanta({ ...editingPlanta, construction_dc_mwp: e.target.value ? parseFloat(e.target.value) : null })}
                          placeholder="Ej: 8.3"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-400 font-bold font-mono mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Seguidor / Tracker</label>
                      <input
                        type="text"
                        value={editingPlanta.tracker || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, tracker: e.target.value })}
                        placeholder="Ej: TRINA VANGUARD / ARTECH"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Modelo Inversores</label>
                      <input
                        type="text"
                        value={editingPlanta.inverter_model || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, inverter_model: e.target.value })}
                        placeholder="Ej: SUNGROW STRING / SG250HX"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Cantidad Inversores / CT</label>
                      <input
                        type="text"
                        value={editingPlanta.inverter_quantity || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, inverter_quantity: e.target.value })}
                        placeholder="Ej: 39 INV / 2 CT"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VALIDACIÓN PÚBLICA CEN */}
              {activeModalTab === 'publica' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-sky-400" /> Registro del Coordinador Eléctrico Nacional (CEN)
                      </span>

                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded font-bold border ${
                        editingPlanta.confidence === 'Alta' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        editingPlanta.confidence === 'Media' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-slate-950 text-slate-400 border-slate-800'
                      }`}>
                        Confiabilidad: {editingPlanta.confidence}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Nombre Público Registrado CEN</label>
                        <input
                          type="text"
                          value={editingPlanta.public_name_cen || ''}
                          onChange={(e) => setEditingPlanta({ ...editingPlanta, public_name_cen: e.target.value })}
                          placeholder="Ej: PMGD PFV PARQUE CANTILLANA"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase">Titular / Propietario Público</label>
                        <input
                          type="text"
                          value={editingPlanta.public_owner || ''}
                          onChange={(e) => setEditingPlanta({ ...editingPlanta, public_owner: e.target.value })}
                          placeholder="Ej: PARQUE SOLAR CANTILLANA SPA"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Nota de Validación e Identificación</label>
                      <textarea
                        rows={2}
                        value={editingPlanta.validation_note || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, validation_note: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 font-sans outline-none mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: INFRAESTRUCTURA OPERACIONAL */}
              {activeModalTab === 'infraestructura' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Distribuidora Interna</label>
                      <input
                        type="text"
                        value={editingPlanta.internal_distributor || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, internal_distributor: e.target.value })}
                        placeholder="Ej: CGE"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Reconectador / Recloser</label>
                      <input
                        type="text"
                        value={editingPlanta.recloser || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, recloser: e.target.value })}
                        placeholder="Ej: NOJA POWER"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Montaje Reconectador</label>
                      <input
                        type="text"
                        value={editingPlanta.recloser_mount || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, recloser_mount: e.target.value })}
                        placeholder="Ej: Bajo / Alto / Telescópica"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Subestación de Conexión (S/E)</label>
                      <input
                        type="text"
                        value={editingPlanta.substation || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, substation: e.target.value })}
                        placeholder="Ej: HOSPITAL"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Alimentador</label>
                      <input
                        type="text"
                        value={editingPlanta.feeder || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, feeder: e.target.value })}
                        placeholder="Ej: Alimentador Champa"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Medidor Principal</label>
                      <input
                        type="text"
                        value={editingPlanta.meter || ''}
                        onChange={(e) => setEditingPlanta({ ...editingPlanta, meter: e.target.value })}
                        placeholder="Ej: ION7400 / ION8650"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: TELEMETRÍA Y RIESGOS */}
              {activeModalTab === 'telemetria' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="h-4 w-4 text-amber-400" /> Monitoreo y Telemetría
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[9px] font-mono text-slate-500">SCADA</div>
                        <div className="text-xs font-bold text-slate-300 font-mono mt-0.5">
                          {editingPlanta.scada?.status || 'desconocido'}
                        </div>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[9px] font-mono text-slate-500">Meteorología</div>
                        <div className="text-xs font-bold text-slate-300 font-mono mt-0.5">
                          {editingPlanta.meteorology?.status || 'desconocido'}
                        </div>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[9px] font-mono text-slate-500">CCTV</div>
                        <div className="text-xs font-bold text-slate-300 font-mono mt-0.5">
                          {editingPlanta.cctv?.status || 'desconocido'}
                        </div>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[9px] font-mono text-slate-500">Credenciales</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                          Excluidas (Seguro)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del Modal con Guardado */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRetiringPlanta(editingPlanta)}
                className="px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Retirar de Master DB
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingPlanta(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-xs font-mono text-slate-400 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Guardar Cambios Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Reset Master DB */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm border-b border-slate-800 pb-3">
              <RotateCcw className="h-5 w-5 text-amber-400" />
              Restaurar Base Master Original (59 Plantas)
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Está seguro de que desea restaurar las 59 plantas del catastro unificado? Se restablecerán todos los atributos master en <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-800 font-mono">orbi_om_db_plantas</code>.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-950 text-xs font-mono text-slate-400 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  onUpdate(INITIAL_PLANTAS);
                  setShowRestoreConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Confirmar Reset Master DB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Retirar Planta */}
      {retiringPlanta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm border-b border-slate-800 pb-3">
              <Trash2 className="h-5 w-5 text-rose-400" />
              Retirar Planta de la Base Master
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Desea retirar la planta <strong className="text-white">{retiringPlanta.name || retiringPlanta.plant_name}</strong> (ID: <code className="text-emerald-400 font-mono">{retiringPlanta.orbi_id || retiringPlanta.id}</code>)?
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setRetiringPlanta(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-950 text-xs font-mono text-slate-400 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmRetiro}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Confirmar Retiro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
