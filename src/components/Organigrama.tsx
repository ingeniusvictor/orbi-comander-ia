/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  ChevronRight,
  User,
  Shield,
  Save,
  X,
  MapPin,
  Info,
  Layers,
  Search,
  Award,
  Car,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building2,
  Grid,
  ListFilter,
  GitFork,
  ChevronDown,
  ShieldAlert,
  FileCheck2,
  UserCheck
} from 'lucide-react';
import { Persona, AreaOM, NivelJerarquico, HseCert, OrganigramaNode } from '../types';
import {
  INITIAL_ORGANIGRAMA,
  validateAndCleanOrganigrama,
  saveOrganigramaToStorage,
  resetOrganigramaToDefault,
  ValidationReport
} from '../data/organigramaData';
import { MASTER_PLANTS_DATA } from '../data/masterPlantsData';

interface OrganigramaProps {
  organigrama?: OrganigramaNode[] | Persona[];
  onUpdate?: (updatedList: any[]) => void;
  userRole: string;
}

const AREAS_LIST: AreaOM[] = [
  'Gerencia',
  'Planificación & Control',
  'Control Gestión, Calidad & HSE',
  'Zona Norte',
  'Zona Centro',
  'Zona Sur',
  'Centro de Control',
  'Comisionamiento & MT',
  'Limpieza'
];

export default function Organigrama({
  organigrama: propOrganigrama,
  onUpdate,
  userRole,
}: OrganigramaProps) {
  // Local state for full list of personas
  const [personnel, setPersonnel] = useState<Persona[]>(() => {
    if (propOrganigrama && propOrganigrama.length > 0) {
      return propOrganigrama as Persona[];
    }
    return INITIAL_ORGANIGRAMA;
  });

  // Sync if prop changes
  React.useEffect(() => {
    if (propOrganigrama && propOrganigrama.length > 0) {
      setPersonnel(propOrganigrama as Persona[]);
    }
  }, [propOrganigrama]);

  // View Mode: 'tree' (Arbol Jerárquico), 'areas' (Por Área), 'zones' (Por Zona), 'directory' (Directorio Lista)
  const [viewMode, setViewMode] = useState<'tree' | 'areas' | 'zones' | 'directory'>('tree');

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterArea, setFilterArea] = useState<string>('Todas');
  const [filterZona, setFilterZona] = useState<string>('Todas');
  const [filterNivel, setFilterNivel] = useState<string>('Todos');

  // Modal / Detail Selection
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Form for New Persona
  const [newPersona, setNewPersona] = useState<Partial<Persona>>({
    name: '',
    role: '',
    area: 'Zona Centro',
    level: 3,
    email: '',
    phone: '',
    zona: 'Centro',
    activo: true
  });

  const isEditable = ['SUPER_ADMIN_ORBI', 'GERENCIA', 'JEFE_OM', 'COORDINADOR_OM'].includes(userRole);

  // Plant names reference for validation
  const plantNames = useMemo(() => MASTER_PLANTS_DATA.map(p => p.name), []);

  // Validation report
  const validationResult = useMemo(() => {
    return validateAndCleanOrganigrama(personnel, plantNames);
  }, [personnel, plantNames]);

  // Handle Updates
  const updatePersonnelState = (updatedList: Persona[]) => {
    setPersonnel(updatedList);
    saveOrganigramaToStorage(updatedList);
    if (onUpdate) {
      onUpdate(updatedList);
    }
  };

  const handleResetToDefault = () => {
    const res = resetOrganigramaToDefault();
    updatePersonnelState(res);
    setShowResetConfirm(false);
  };

  const handleSaveEdit = () => {
    if (!editingPersona) return;
    const index = personnel.findIndex((n) => n.id === editingPersona.id);
    if (index !== -1) {
      const updated = [...personnel];
      updated[index] = editingPersona;
      updatePersonnelState(updated);
      setEditingPersona(null);
      if (selectedPersona?.id === editingPersona.id) {
        setSelectedPersona(editingPersona);
      }
    }
  };

  const handleSaveAdd = () => {
    if (!newPersona.name || !newPersona.role) {
      alert('Por favor ingrese al menos Nombre y Rol.');
      return;
    }
    const personaToAdd: Persona = {
      id: `org-${Date.now().toString().slice(-4)}`,
      name: newPersona.name,
      role: newPersona.role,
      area: (newPersona.area as AreaOM) || 'Zona Centro',
      level: (newPersona.level as NivelJerarquico) || 3,
      email: newPersona.email || `${newPersona.name.toLowerCase().replace(/\s+/g, '.')}@empresa.cl`,
      phone: newPersona.phone || '+56912345678',
      zona: (newPersona.zona as any) || 'Centro',
      reportsTo: newPersona.reportsTo || 'org-2',
      jefaturaDirecta: newPersona.jefaturaDirecta || 'Raúl Serrano',
      activo: true,
      vehiculo: newPersona.vehiculo,
      plantas: newPersona.plantas
    };

    updatePersonnelState([...personnel, personaToAdd]);
    setIsAdding(false);
    setNewPersona({
      name: '',
      role: '',
      area: 'Zona Centro',
      level: 3,
      email: '',
      phone: '',
      zona: 'Centro',
      activo: true
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Está seguro de remover a este colaborador de la dotación O&M?')) return;
    const filtered = personnel.filter((n) => n.id !== id);
    updatePersonnelState(filtered);
    if (selectedPersona?.id === id) {
      setSelectedPersona(null);
    }
  };

  // Filtered List
  const filteredPersonnel = useMemo(() => {
    return personnel.filter((p) => {
      // Search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchName = p.name.toLowerCase().includes(term);
        const matchRole = p.role.toLowerCase().includes(term);
        const matchEmail = (p.email || '').toLowerCase().includes(term);
        const matchArea = p.area.toLowerCase().includes(term);
        if (!matchName && !matchRole && !matchEmail && !matchArea) return false;
      }
      // Area filter
      if (filterArea !== 'Todas' && p.area !== filterArea) return false;
      // Zone filter
      if (filterZona !== 'Todas' && p.zona && p.zona !== filterZona) return false;
      // Level filter
      if (filterNivel !== 'Todos' && p.level.toString() !== filterNivel) return false;

      return true;
    });
  }, [personnel, searchTerm, filterArea, filterZona, filterNivel]);

  // Direct reports finder
  const getSubordinates = (id: string) => {
    return personnel.filter(p => p.reportsTo === id);
  };

  // Root Nodes (Level 1 or no reportsTo)
  const rootNodes = useMemo(() => {
    return personnel.filter(p => !p.reportsTo || p.level === 1);
  }, [personnel]);

  return (
    <div className="space-y-6">
      {/* Banner Superior — Status Lock & Baseline Indicator */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Módulo 15A Integrated
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                ORBI Organigrama O&M
              </span>
              <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-[10px] font-mono px-2 py-0.5 rounded">
                76 Colaboradores / 9 Áreas / 4 Niveles
              </span>
              {!isEditable && (
                <span className="bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> MODO SOLO LECTURA
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5 pt-1">
              <Users className="h-6 w-6 text-emerald-400" />
              Estructura Organizacional O&M — Matriz Jerárquica & Recursos
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl">
              Organigrama operativo unificado. Visualización jerárquica de reporte, zonificación de cuadrillas, vehiculización, acreditación HSE y asignaciones de plantas para el personal de terreno y gestión.
            </p>
            {/* Banner Sandbox & Privacidad */}
            <div className="bg-slate-950/80 border border-amber-500/30 text-amber-300/90 text-[11px] font-mono px-3 py-1.5 rounded-xl flex items-center gap-2 mt-2 max-w-2xl shadow-inner">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
              <span>SANDBOX ORGANIZACIONAL — DATOS REFERENCIALES — SIN CONEXIÓN A RR. HH., NÓMINA NI BIOMETRÍA</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end">
            <button
              onClick={() => setShowValidationModal(true)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all border shadow ${
                validationResult.report.isValid
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              <FileCheck2 className="h-4 w-4" />
              Validación Estructural ({validationResult.report.isValid ? 'Verificada' : 'Con Alertas'})
            </button>

            {isEditable && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-2 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all"
                title="Restablecer base inicial de 76 colaboradores"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Dotación Total</div>
            <div className="text-lg font-bold text-white flex items-center justify-between">
              {personnel.length} <Users className="h-4 w-4 text-emerald-400" />
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Áreas Operativas</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center justify-between">
              9/9 <Building2 className="h-4 w-4 text-emerald-500" />
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Niveles Jerárquicos</div>
            <div className="text-lg font-bold text-cyan-400 flex items-center justify-between">
              4 Niveles <Layers className="h-4 w-4 text-cyan-500" />
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Acreditados HSE</div>
            <div className="text-lg font-bold text-amber-400 flex items-center justify-between">
              {personnel.filter(p => p.hseCerts && p.hseCerts.length > 0).length} <Award className="h-4 w-4 text-amber-500" />
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Vehículos Asignados</div>
            <div className="text-lg font-bold text-purple-400 flex items-center justify-between">
              {personnel.filter(p => !!p.vehiculo).length} <Car className="h-4 w-4 text-purple-500" />
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Personal Activo</div>
            <div className="text-lg font-bold text-emerald-300 flex items-center justify-between">
              {personnel.filter(p => p.activo !== false).length} <UserCheck className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Bar de Controles: Search, Filters, Modes, Add Button */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start lg:self-auto">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'tree'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <GitFork className="h-3.5 w-3.5" /> Árbol Jerárquico
          </button>
          <button
            onClick={() => setViewMode('areas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'areas'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" /> Por Áreas
          </button>
          <button
            onClick={() => setViewMode('zones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'zones'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Grid className="h-3.5 w-3.5" /> Por Zonas
          </button>
          <button
            onClick={() => setViewMode('directory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'directory'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" /> Directorio
          </button>
        </div>

        {/* Middle: Search bar & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-3xl">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre, rol, email o área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Área:</span>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-mono outline-none cursor-pointer"
            >
              <option value="Todas" className="bg-slate-950 text-white">Todas ({personnel.length})</option>
              {AREAS_LIST.map((a) => (
                <option key={a} value={a} className="bg-slate-950 text-white">
                  {a} ({personnel.filter(p => p.area === a).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Zona:</span>
            <select
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-mono outline-none cursor-pointer"
            >
              <option value="Todas" className="bg-slate-950 text-white">Todas</option>
              <option value="Norte" className="bg-slate-950 text-white">Norte</option>
              <option value="Centro" className="bg-slate-950 text-white">Centro</option>
              <option value="Sur" className="bg-slate-950 text-white">Sur</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Nivel:</span>
            <select
              value={filterNivel}
              onChange={(e) => setFilterNivel(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-mono outline-none cursor-pointer"
            >
              <option value="Todos" className="bg-slate-950 text-white">Todos</option>
              <option value="1" className="bg-slate-950 text-white">Nivel 1 (Dirección/Jefatura)</option>
              <option value="2" className="bg-slate-950 text-white">Nivel 2 (Supervisión/Coord)</option>
              <option value="3" className="bg-slate-950 text-white">Nivel 3 (Especialista/Técnico)</option>
              <option value="4" className="bg-slate-950 text-white">Nivel 4 (Operador/Asistente)</option>
            </select>
          </div>
        </div>

        {/* Right: Add Personnel button */}
        {isEditable && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Registrar Colaborador
          </button>
        )}
      </div>

      {/* VISTA 1: ÁRBOLES Y NIVELES JERÁRQUICOS */}
      {viewMode === 'tree' && (
        <div className="space-y-6">
          {[1, 2, 3, 4].map((levelNum) => {
            const levelLabel = 
              levelNum === 1 ? 'Nivel 1: Dirección, Gerencia y Jefaturas Principales' :
              levelNum === 2 ? 'Nivel 2: Supervisión de Terreno, Coordinación O&M y Jefatura HSE' :
              levelNum === 3 ? 'Nivel 3: Ingenieros, Especialistas, Analistas y Técnicos O&M' :
              'Nivel 4: Operadores de Centro de Control y Asistentes';

            const levelNodes = filteredPersonnel.filter((p) => p.level === levelNum);

            if (levelNodes.length === 0) return null;

            return (
              <div key={levelNum} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <h3 className="text-xs font-bold font-mono tracking-wider text-emerald-400 uppercase flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-500" />
                    {levelLabel}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                    {levelNodes.length} Colaboradores
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {levelNodes.map((p) => {
                    const subordinates = getSubordinates(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPersona(p)}
                        className={`bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all group cursor-pointer relative shadow-sm hover:shadow-emerald-950/20 flex flex-col justify-between ${
                          p.activo === false ? 'opacity-40' : ''
                        }`}
                      >
                        <div>
                          {/* Header card info */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                              {p.area}
                            </span>
                            {p.zona && (
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                                <MapPin className="h-2.5 w-2.5" /> {p.zona}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 my-2">
                            <div className="h-10 w-10 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 group-hover:border-emerald-500/40 text-slate-300 font-mono font-bold text-xs">
                              {p.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate flex items-center gap-1">
                                {p.name}
                                {p.activo === false && <span className="text-[8px] bg-rose-950 text-rose-400 px-1 rounded">Inactivo</span>}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">{p.role}</p>
                            </div>
                          </div>

                          {/* Technical attributes */}
                          <div className="space-y-1 my-3 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-950">
                            {p.jefaturaDirecta && (
                              <div className="flex justify-between">
                                <span className="text-slate-600">Reporta a:</span>
                                <span className="text-slate-300 font-semibold truncate max-w-[140px]">{p.jefaturaDirecta}</span>
                              </div>
                            )}

                            {p.vehiculo && (
                              <div className="flex justify-between items-center text-purple-300">
                                <span className="text-slate-600 flex items-center gap-1"><Car className="h-3 w-3" /> Vehículo:</span>
                                <span className="font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800 text-[9px]">
                                  {p.vehiculo}
                                </span>
                              </div>
                            )}

                            {p.hseCerts && p.hseCerts.length > 0 && (
                              <div className="flex justify-between items-center text-amber-300">
                                <span className="text-slate-600 flex items-center gap-1"><Award className="h-3 w-3" /> Cert HSE:</span>
                                <span className="font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800 text-[9px]">
                                  {p.hseCerts.length} cert(s)
                                </span>
                              </div>
                            )}

                            {p.plantas && p.plantas.length > 0 && (
                              <div className="flex justify-between text-slate-400">
                                <span className="text-slate-600">Plantas:</span>
                                <span className="text-slate-300 truncate max-w-[140px]">{p.plantas.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-950 text-[10px] font-mono text-slate-500">
                          <span>{subordinates.length} a cargo</span>
                          <span className="text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                            Ver detalles <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA 2: POR ÁREAS OPERATIVAS */}
      {viewMode === 'areas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {AREAS_LIST.map((areaName) => {
            const areaMembers = filteredPersonnel.filter(p => p.area === areaName);
            return (
              <div key={areaName} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <h3 className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-500" />
                      {areaName}
                    </h3>
                    <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800">
                      {areaMembers.length} Colaboradores
                    </span>
                  </div>

                  {areaMembers.length === 0 ? (
                    <div className="p-4 text-center text-xs font-mono text-slate-600 italic">
                      Sin colaboradores en este filtro
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {areaMembers.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPersona(p)}
                          className="bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/40 p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{p.role}</div>
                          </div>
                          <div className="text-right font-mono text-[9px] text-slate-500">
                            <div>Lvl {p.level}</div>
                            {p.zona && <div className="text-emerald-400">{p.zona}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA 3: POR ZONAS GEOGRÁFICAS */}
      {viewMode === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Norte', 'Centro', 'Sur'].map((zonaName) => {
            const zoneMembers = filteredPersonnel.filter(p => p.zona === zonaName);
            return (
              <div key={zonaName} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    Zona {zonaName}
                  </h3>
                  <span className="text-xs font-mono bg-slate-950 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-800">
                    {zoneMembers.length} Personas
                  </span>
                </div>

                <div className="space-y-2.5">
                  {zoneMembers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPersona(p)}
                      className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{p.role}</div>
                        <div className="text-[9px] font-mono text-slate-500 mt-0.5">{p.area}</div>
                      </div>
                      {p.vehiculo && (
                        <span className="text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {p.vehiculo}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA 4: DIRECTORIO / LISTA COMPLETA */}
      {viewMode === 'directory' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold">
              Mostrando {filteredPersonnel.length} de {personnel.length} colaboradores
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Área O&M</th>
                  <th className="p-3">Nivel / Rol</th>
                  <th className="p-3">Zona</th>
                  <th className="p-3">Jefatura Directa</th>
                  <th className="p-3">Vehículo / Certs</th>
                  <th className="p-3 text-right">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredPersonnel.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPersona(p)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="p-3 font-sans">
                      <div className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                        {p.name}
                        {p.activo === false && <span className="text-[8px] bg-rose-950 text-rose-400 px-1 rounded">Inactivo</span>}
                      </div>
                      <div className="text-[10px] text-slate-500">{p.email}</div>
                    </td>
                    <td className="p-3 text-slate-300 text-[11px]">{p.area}</td>
                    <td className="p-3">
                      <div className="text-slate-200 font-bold">{p.role}</div>
                      <div className="text-[9px] text-slate-500">Nivel {p.level}</div>
                    </td>
                    <td className="p-3 text-emerald-400 text-[11px]">{p.zona || 'Transversal'}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{p.jefaturaDirecta || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.vehiculo && (
                          <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
                            {p.vehiculo}
                          </span>
                        )}
                        {p.hseCerts && p.hseCerts.length > 0 && (
                          <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold">
                            HSE ({p.hseCerts.length})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right text-slate-400 text-[11px]">
                      {p.phone || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL FICHA DETALLADA DE COLABORADOR */}
      {selectedPersona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-xl shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedPersona(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
              <div className="h-14 w-14 rounded-full bg-slate-950 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg font-mono">
                {selectedPersona.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
                    {selectedPersona.area}
                  </span>
                  <span className="text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                    Nivel {selectedPersona.level}
                  </span>
                  {selectedPersona.zona && (
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Zona {selectedPersona.zona}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-white mt-1">{selectedPersona.name}</h3>
                <p className="text-xs text-slate-300 font-mono">{selectedPersona.role}</p>
              </div>
            </div>

            {/* Content Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <User className="h-3 w-3 text-emerald-400" /> Jerarquía y Reporte
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Jefatura Directa:</span>
                  <div className="text-white font-bold">{selectedPersona.jefaturaDirecta || 'No registrada'}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Reporta vía ID:</span>
                  <div className="text-slate-400">{selectedPersona.reportsTo || 'N/A (Nivel 1)'}</div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Mail className="h-3 w-3 text-cyan-400" /> Datos de Contacto
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Email:</span>
                  <div className="text-slate-200 truncate">{selectedPersona.email}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Teléfono:</span>
                  <div className="text-slate-200">{selectedPersona.phone || 'No especificado'}</div>
                </div>
              </div>

              {/* Vehicle & Plants */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 col-span-2">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <Car className="h-3 w-3 text-purple-400" /> Logística & Vehiculización
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Patente Asignada:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                    selectedPersona.vehiculo 
                      ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                      : 'text-slate-600 italic'
                  }`}>
                    {selectedPersona.vehiculo || 'Sin vehículo asignado'}
                  </span>
                </div>
                {selectedPersona.plantas && selectedPersona.plantas.length > 0 && (
                  <div>
                    <span className="text-slate-500 text-[10px]">Plantas Asignadas:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedPersona.plantas.map(pl => (
                        <span key={pl} className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded">
                          {pl}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* HSE Certifications */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 col-span-2">
                <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1"><Award className="h-3 w-3 text-amber-400" /> Acreditaciones HSE & Prevención</span>
                  {selectedPersona.hseCerts && selectedPersona.hseCerts.length > 0 && (
                    <span className="text-amber-400 font-bold">{selectedPersona.hseCerts.length} Activas</span>
                  )}
                </div>
                {selectedPersona.hseCerts && selectedPersona.hseCerts.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {selectedPersona.hseCerts.map((cert) => (
                      <div key={cert.id} className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-amber-300 text-xs">{cert.name}</div>
                          {cert.notes && <div className="text-[10px] text-slate-400">{cert.notes}</div>}
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 uppercase block">Vencimiento</span>
                          <span className="text-[10px] font-bold text-emerald-400">{cert.expirationDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-[11px] italic">No registra acreditaciones adicionales en el sistema.</div>
                )}
              </div>
            </div>

            {/* Subordinates count */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Personal dependiente directo:</span>
              <span className="font-bold text-emerald-400">
                {getSubordinates(selectedPersona.id).length} colaboradores
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {isEditable && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingPersona(selectedPersona);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-emerald-400" /> Editar Ficha
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPersona.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-mono font-bold flex items-center gap-1 border border-rose-800/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              )}
              <button
                onClick={() => setSelectedPersona(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono ml-auto"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR COLABORADOR */}
      {editingPersona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Edit2 className="h-4 w-4 text-emerald-400" /> Editar Colaborador O&M
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-[10px] text-slate-400 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  value={editingPersona.name}
                  onChange={(e) => setEditingPersona({ ...editingPersona, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Rol / Cargo</label>
                  <input
                    type="text"
                    value={editingPersona.role}
                    onChange={(e) => setEditingPersona({ ...editingPersona, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Área Operativa</label>
                  <select
                    value={editingPersona.area}
                    onChange={(e) => setEditingPersona({ ...editingPersona, area: e.target.value as AreaOM })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  >
                    {AREAS_LIST.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Nivel Jerárquico</label>
                  <select
                    value={editingPersona.level}
                    onChange={(e) => setEditingPersona({ ...editingPersona, level: parseInt(e.target.value) as NivelJerarquico })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value={1}>Nivel 1 (Dirección/Jefatura Principal)</option>
                    <option value={2}>Nivel 2 (Supervisión/Coordinación)</option>
                    <option value={3}>Nivel 3 (Especialista/Ingeniero/Técnico)</option>
                    <option value={4}>Nivel 4 (Operador/Asistente)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Zona Geográfica</label>
                  <select
                    value={editingPersona.zona || 'Centro'}
                    onChange={(e) => setEditingPersona({ ...editingPersona, zona: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="Norte">Norte</option>
                    <option value="Centro">Centro</option>
                    <option value="Sur">Sur</option>
                    <option value="Todas">Todas / Transversal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Jefatura Directa (Nombre)</label>
                  <input
                    type="text"
                    value={editingPersona.jefaturaDirecta || ''}
                    onChange={(e) => setEditingPersona({ ...editingPersona, jefaturaDirecta: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Vehículo Asignado (Patente)</label>
                  <input
                    type="text"
                    placeholder="Ej. KTSW99"
                    value={editingPersona.vehiculo || ''}
                    onChange={(e) => setEditingPersona({ ...editingPersona, vehiculo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Email</label>
                  <input
                    type="email"
                    value={editingPersona.email || ''}
                    onChange={(e) => setEditingPersona({ ...editingPersona, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Teléfono</label>
                  <input
                    type="text"
                    value={editingPersona.phone || ''}
                    onChange={(e) => setEditingPersona({ ...editingPersona, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                onClick={() => setEditingPersona(null)}
                className="px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-xs font-mono text-slate-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR NUEVO COLABORADOR */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Plus className="h-4 w-4 text-emerald-400" /> Registrar Colaborador O&M
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-[10px] text-slate-400 uppercase">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej. Pedro Morales"
                  value={newPersona.name}
                  onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Rol / Cargo *</label>
                  <input
                    type="text"
                    placeholder="Ej. Técnico O&M"
                    value={newPersona.role}
                    onChange={(e) => setNewPersona({ ...newPersona, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Área Operativa</label>
                  <select
                    value={newPersona.area}
                    onChange={(e) => setNewPersona({ ...newPersona, area: e.target.value as AreaOM })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  >
                    {AREAS_LIST.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Nivel Jerárquico</label>
                  <select
                    value={newPersona.level}
                    onChange={(e) => setNewPersona({ ...newPersona, level: parseInt(e.target.value) as NivelJerarquico })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value={1}>Nivel 1 (Dirección/Jefatura)</option>
                    <option value={2}>Nivel 2 (Supervisión/Coord)</option>
                    <option value={3}>Nivel 3 (Especialista/Técnico)</option>
                    <option value={4}>Nivel 4 (Operador/Asistente)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Zona Geográfica</label>
                  <select
                    value={newPersona.zona || 'Centro'}
                    onChange={(e) => setNewPersona({ ...newPersona, zona: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="Norte">Norte</option>
                    <option value="Centro">Centro</option>
                    <option value="Sur">Sur</option>
                    <option value="Todas">Todas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase">Jefatura Directa (Nombre)</label>
                <input
                  type="text"
                  placeholder="Ej. Raynier Quintero"
                  value={newPersona.jefaturaDirecta || ''}
                  onChange={(e) => setNewPersona({ ...newPersona, jefaturaDirecta: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-xs font-mono text-slate-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAdd}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Registrar Colaborador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VALIDACIÓN ESTRUCTURAL */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-xl shadow-2xl relative space-y-4 font-mono text-xs">
            <button
              onClick={() => setShowValidationModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
              Informe de Auditoría y Validación de Estructura Organizacional
            </h3>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              <div className={`p-3 rounded-xl border ${
                validationResult.report.isValid
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-800 text-amber-300'
              }`}>
                <div className="font-bold flex items-center gap-2 text-sm">
                  {validationResult.report.isValid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  )}
                  Estado: {validationResult.report.isValid ? 'Estructura Íntegra y Verificada' : 'Advertencias Estructurales'}
                </div>
                <p className="text-[11px] opacity-80 mt-1">
                  Verificación de 10 puntos de control: IDs únicos, referencias de jefatura, niveles, áreas operativas y asignación de plantas.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-400">Total Colaboradores Auditaos:</span>
                  <span className="text-white font-bold">{personnel.length}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-400">Nodos Raíz (Nivel 1 / Gerencia):</span>
                  <span className="text-emerald-400 font-bold">{validationResult.report.rootNodesCount}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-400">IDs Duplicados:</span>
                  <span className={validationResult.report.duplicateIds.length === 0 ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                    {validationResult.report.duplicateIds.length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-400">Referencias a Jefaturas Inexistentes:</span>
                  <span className={validationResult.report.invalidSuperiorRefs.length === 0 ? 'text-emerald-400' : 'text-amber-400 font-bold'}>
                    {validationResult.report.invalidSuperiorRefs.length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-400">Bucles Circulares Detectados:</span>
                  <span className={validationResult.report.circularRefs.length === 0 ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                    {validationResult.report.circularRefs.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Plantas Asignadas Sin Coincidencia en Matriz:</span>
                  <span className={validationResult.report.unmatchedPlants.length === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                    {validationResult.report.unmatchedPlants.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN DE RESET */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-sm font-bold font-mono text-white">¿Restablecer Base de Datos Organigrama?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Esta acción restaurará la base de datos canónica predeterminada de 76 colaboradores, 9 áreas y 4 niveles en el almacenamiento local.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-xs font-mono text-slate-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono"
              >
                Sí, Restablecer (76 Colaboradores)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
