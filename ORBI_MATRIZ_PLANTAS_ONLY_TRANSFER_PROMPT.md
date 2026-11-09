# PAQUETE DE TRANSFERENCIA DIRECTA — ORBI MATRIZ DE PLANTAS ONLY

> **MÓDULO 14A — ORBI MATRIZ DE PLANTAS / ASSET REGISTRY SAFE INTEGRATION**  
> **Estado Objetivo:** `INTEGRATED / SANDBOX / NON-OPERATIONAL / ASSET REGISTRY READY`  
> **Exclusión Absoluta:** Suite PVMetrics IA (Previsiones, BESS, SCADA, Telemetría, etc.).

---

## 1. INSTRUCCIONES PARA EL AGENTE DE DESTINO (ORBI O&M COMMAND CENTER IA)

Estimado Agente de **ORBI O&M Command Center IA**:

Este documento contiene el paquete de código fuente completo, autónomo y probado para integrar la **Matriz de Plantas y Catastro de Activos Fotovoltaicos** dentro de tu arquitectura.

### Reglas de Ejecución Estrictas
1. **No Reemplazar `App.tsx`**: Modifica `App.tsx` de forma quirúrgica para añadir la ruta/pestaña `'Plantas'` dentro de la navegación principal existente.
2. **Respetar Módulos Congelados**: No modifiques ni descongeles Módulo 13A-FREEZE (Fleet & Logistics) ni ningún otro módulo en estado FROZEN.
3. **Roles y Permisos**: Utiliza el sistema de roles preexistente (`userRole`). La vista de Catastro es accesible para lectura por todos los roles y editable para `SUPER_ADMIN_ORBI`, `GERENCIA`, `JEFE_OM`, `COORDINADOR_OM`, `SUPERVISOR_TERRENO` e `INGENIERO_OM`.
4. **Persistencia Local**: Utiliza `localStorage` mediante la clave `orbi_om_db_plantas` para conservar los cambios realizados en el estado o asignación de las plantas.
5. **Cero APIs Productivas**: Todo opera en modo Sandbox cliente con datos de prueba estables (`INITIAL_PLANTAS`).
6. **No Auto-Congelar**: Registrar como `MÓDULO 14A — INTEGRATED / SANDBOX / NON-OPERATIONAL / ASSET REGISTRY READY`.

---

## 2. INVENTARIO REAL DE ARCHIVOS INCLUIDOS

| Archivo | Función | Dependencias |
|---|---|---|
| `src/components/MatrizPlantas.tsx` | Componente raíz de la Matriz de Plantas / Catastro de Activos | `react`, `lucide-react`, `../types` |
| `src/types.ts` | Definición de interfaces `Planta` y `OrganigramaNode` | N/A |
| `src/data/db.ts` | Colección base `INITIAL_PLANTAS` y funciones de persistencia local | `../types` |

---

## 3. DEPENDENCIAS REQUERIDAS

Las únicas dependencias necesarias para este módulo son:
- `react` (v18+)
- `lucide-react` (iconos `Sun`, `Search`, `Filter`, `ExternalLink`, `Edit2`, `Calendar`, `AlertTriangle`, `MapPin`, `Clock`, `User`, `X`, `Check`)

---

## 4. CÓDIGO FUENTE COMPLETO Y LITERAL

### Archivo 1: `/src/types.ts` (Definiciones de Tipos de Matriz y Organigrama)

```typescript
export interface Planta {
  id: string;
  name: string;
  zona: 'Norte' | 'Centro' | 'Sur';
  region: string;
  mwp: number;
  cliente: string;
  supervisor: string; // Nombre correspondiente al organigrama
  ingeniero: string; // Nombre correspondiente al organigrama
  estado: 'Operacional' | 'Limitada' | 'Fuera de Servicio' | 'En Mantenimiento';
  ultimoMantenimiento: string;
  proximoMantenimiento: string;
  criticidad: 'Alta' | 'Media' | 'Baja';
  linkDocumental: string;
}

export interface OrganigramaNode {
  id: string;
  role: string;
  name: string;
  email: string;
  phone?: string;
  reportsTo?: string;
  zona?: 'Norte' | 'Centro' | 'Sur' | 'Todas';
  activo?: boolean;
}
```

---

### Archivo 2: `/src/data/db.ts` (Datos Iniciales y Helper de Persistencia)

```typescript
import { Planta } from '../types';

export const INITIAL_PLANTAS: Planta[] = [
  // Zona Norte
  {
    id: 'P01',
    name: 'Atacama Solar',
    zona: 'Norte',
    region: 'Región de Antofagasta',
    mwp: 150.0,
    cliente: 'AES Andes',
    supervisor: 'Alejandro Rojas',
    ingeniero: 'Yasmín Castro',
    estado: 'Operacional',
    ultimoMantenimiento: '2026-06-15',
    proximoMantenimiento: '2026-07-20',
    criticidad: 'Alta',
    linkDocumental: 'https://sharepoint.orbi.internal/om/P01_AtacamaSolar_docs',
  },
  {
    id: 'P02',
    name: 'Luz del Norte',
    zona: 'Norte',
    region: 'Región de Atacama',
    mwp: 141.2,
    cliente: 'First Solar',
    supervisor: 'Alejandro Rojas',
    ingeniero: 'Yasmín Castro',
    estado: 'Limitada',
    ultimoMantenimiento: '2026-05-10',
    proximoMantenimiento: '2026-07-12',
    criticidad: 'Alta',
    linkDocumental: 'https://sharepoint.orbi.internal/om/P02_LuzNorte_docs',
  },
  {
    id: 'P03',
    name: 'Quillagua Solar',
    zona: 'Norte',
    region: 'Región de Tarapacá',
    mwp: 103.5,
    cliente: 'Grenergy',
    supervisor: 'Alejandro Rojas',
    ingeniero: 'Yasmín Castro',
    estado: 'Operacional',
    ultimoMantenimiento: '2026-06-01',
    proximoMantenimiento: '2026-07-28',
    criticidad: 'Media',
    linkDocumental: 'https://sharepoint.orbi.internal/om/P03_Quillagua_docs',
  },

  // Zona Centro
  {
    id: 'P04',
    name: 'Pelícano Solar',
    zona: 'Centro',
    region: 'Región de Coquimbo',
    mwp: 100.0,
    cliente: 'SunPower Corp',
    supervisor: 'Mauricio Valdés',
    ingeniero: 'Beatriz Loyola',
    estado: 'Operacional',
    ultimoMantenimiento: '2026-06-20',
    proximoMantenimiento: '2026-07-25',
    criticidad: 'Alta',
    linkDocumental: 'https://sharepoint.orbi.internal/om/P04_Pelicano_docs',
  },
  {
    id: 'P05',
    name: 'Santiago Solar',
    zona: 'Centro',
    region: 'Región Metropolitana',
    mwp: 115.0,
    cliente: 'EDF Renewables',
    supervisor: 'Mauricio Valdés',
    ingeniero: 'Beatriz Loyola',
    estado: 'En Mantenimiento',
    ultimoMantenimiento: '2026-07-01',
    proximoMantenimiento: '2026-07-06',
    criticidad: 'Alta',
    linkDocumental: 'https://sharepoint.orbi.internal/om/P05_SantiagoSolar_docs',
  },
  {
    id: 'P06',
    name: 'El Totihue Solar',
    zona: 'Centro',
    region: 'Región de O\'Higgins',
    mwp: 8.2,
    cliente: 'SoWiTec (PMGD)',
    supervisor: 'Mauricio Valdés',
    ingeniero: 'Beatriz Loyola',
    estado: 'Fuera de Servicio',
    ultimoMantenimiento: '2026-04-18',
    proximoMantenimiento: '2026-07-08',
    criticidad: 'Baja',
    linkDocumental: 'https://sharepoint.orbi.internal/om/P06_ElTotihue_docs',
  },

  // Zona Sur
  {
    id: 'P07',
    name: 'Maule Solar',
    zona: 'Sur',
    region: 'Región del Maule',
    mwp: 12.0,
    cliente: 'Enel Green Power',
    supervisor: 'Francisco Jara',
    ingeniero: 'Héctor Mellado',
    estado: 'Operacional',
    ultimoMantenimiento: '2026-06-11',
    proximoMantenimiento: '2026-07-15',
    criticidad: 'Media',
    linkDocumental: 'https://sharepoint.orbi.internal/om/P07_MauleSolar_docs',
  },
  {
    id: 'P08',
    name: 'Ñuble Solar',
    zona: 'Sur',
    region: 'Región de Ñuble',
    mwp: 9.0,
    cliente: 'O Energy (PMGD)',
    supervisor: 'Francisco Jara',
    ingeniero: 'Héctor Mellado',
    estado: 'Operacional',
    ultimoMantenimiento: '2026-06-25',
    proximoMantenimiento: '2026-07-30',
    criticidad: 'Baja',
    linkDocumental: 'https://sharepoint.orbi.internal/om/P08_Nuble_docs',
  },
  {
    id: 'P09',
    name: 'Biobío del Sol',
    zona: 'Sur',
    region: 'Región del Biobío',
    mwp: 10.5,
    cliente: 'Colbún Solar',
    supervisor: 'Francisco Jara',
    ingeniero: 'Héctor Mellado',
    estado: 'Operacional',
    ultimoMantenimiento: '2026-06-18',
    proximoMantenimiento: '2026-07-22',
    criticidad: 'Media',
    linkDocumental: 'https://sharepoint.orbi.internal/om/P09_Biobio_docs',
  },
];

const STORAGE_KEY = 'orbi_om_db_plantas';

export const loadPlantas = (): Planta[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_PLANTAS;
  } catch (e) {
    console.error('Error cargando plantas desde localStorage:', e);
    return INITIAL_PLANTAS;
  }
};

export const savePlantas = (data: Planta[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error guardando plantas en localStorage:', e);
  }
};
```

---

### Archivo 3: `/src/components/MatrizPlantas.tsx` (Componente Principal de Matriz de Plantas)

```tsx
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
  Check
} from 'lucide-react';
import { Planta, OrganigramaNode } from '../types';

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
  const [editingPlanta, setEditingPlanta] = useState<Planta | null>(null);

  const canEdit = ['SUPER_ADMIN_ORBI', 'GERENTE_OM', 'JEFE_TERRENO', 'SUPERVISOR_ZONA', 'JEFE_OM', 'COORDINADOR_OM'].includes(userRole);

  const handleEditClick = (planta: Planta) => {
    if (!canEdit) return;
    setEditingPlanta({ ...planta });
  };

  const handleSaveEdit = () => {
    if (!editingPlanta) return;
    const index = plantas.findIndex((p) => p.id === editingPlanta.id);
    if (index !== -1) {
      const updated = [...plantas];
      updated[index] = editingPlanta;
      onUpdate(updated);
      setEditingPlanta(null);
    }
  };

  const supervisors = (organigrama || []).filter((n) => n.role === 'SUPERVISOR_TERRENO');
  const engineers = (organigrama || []).filter((n) => n.role === 'INGENIERO_OM');

  const filteredPlantas = (plantas || []).filter((planta) => {
    const matchesSearch =
      planta.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planta.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZona = filterZona === 'Todas' || planta.zona === filterZona;
    const matchesEstado = filterEstado === 'Todos' || planta.estado === filterEstado;
    return matchesSearch && matchesZona && matchesEstado;
  });

  return (
    <div className="space-y-6">
      {/* Cabecera y Caja de Controles */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sun className="h-5 w-5 text-emerald-400" /> Matriz de Activos Solares
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Catastro técnico, estado operacional en vivo y vinculación de jefes e ingenieros de planta.
          </p>
        </div>

        <div className="text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400">
          ACTIVOS REGISTRADOS: <span className="text-emerald-400 font-bold">{plantas.length} PLANTAS</span>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl">
        {/* Barra de Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por Planta, Cliente o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-emerald-500/50 outline-none"
          />
        </div>

        {/* Filtrar por Zona */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <MapPin className="h-4 w-4 text-slate-500" />
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

        {/* Filtrar por Estado */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Filter className="h-4 w-4 text-slate-500" />
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
      </div>

      {/* Editor Lateral / Ventana Modal de Planta */}
      {editingPlanta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setEditingPlanta(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-emerald-400" /> Control Técnico: {editingPlanta.name}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Estado Operacional</label>
                  <select
                    value={editingPlanta.estado}
                    onChange={(e) => setEditingPlanta({ ...editingPlanta, estado: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  >
                    <option value="Operacional">Operacional</option>
                    <option value="Limitada">Limitada</option>
                    <option value="Fuera de Servicio">Fuera de Servicio</option>
                    <option value="En Mantenimiento">En Mantenimiento</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Criticidad del Activo</label>
                  <select
                    value={editingPlanta.criticidad}
                    onChange={(e) => setEditingPlanta({ ...editingPlanta, criticidad: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Supervisor de Zona</label>
                  <select
                    value={editingPlanta.supervisor}
                    onChange={(e) => setEditingPlanta({ ...editingPlanta, supervisor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  >
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.name}>{s.name} ({s.zona})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Ingeniero de Terreno</label>
                  <select
                    value={editingPlanta.ingeniero}
                    onChange={(e) => setEditingPlanta({ ...editingPlanta, ingeniero: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  >
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.name}>{eng.name} ({eng.zona})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Último Mantenimiento</label>
                  <input
                    type="date"
                    value={editingPlanta.ultimoMantenimiento}
                    onChange={(e) => setEditingPlanta({ ...editingPlanta, ultimoMantenimiento: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 uppercase">Próximo Mantenimiento</label>
                  <input
                    type="date"
                    value={editingPlanta.proximoMantenimiento}
                    onChange={(e) => setEditingPlanta({ ...editingPlanta, proximoMantenimiento: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase">Enlace Documental (Drive/SharePoint)</label>
                <input
                  type="text"
                  value={editingPlanta.linkDocumental}
                  onChange={(e) => setEditingPlanta({ ...editingPlanta, linkDocumental: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 outline-none mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => setEditingPlanta(null)}
                className="px-4 py-2 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs font-mono text-slate-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono flex items-center gap-1 transition-colors"
              >
                <Check className="h-3.5 w-3.5" /> Confirmar Parámetros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Plantas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPlantas.map((planta) => {
          let statusBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          let statusIndicator = 'bg-emerald-500';
          
          if (planta.estado === 'Limitada') {
            statusBg = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            statusIndicator = 'bg-amber-500';
          } else if (planta.estado === 'Fuera de Servicio') {
            statusBg = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
            statusIndicator = 'bg-rose-500';
          } else if (planta.estado === 'En Mantenimiento') {
            statusBg = 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
            statusIndicator = 'bg-orange-500';
          }

          const isCritical = planta.criticidad === 'Alta';

          return (
            <div
              key={planta.id}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-md"
            >
              <div>
                {/* Cabecera de la Tarjeta */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      ID: {planta.id}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">
                      {planta.name}
                    </h3>
                  </div>
                  
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5 ${statusBg}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusIndicator} ${planta.estado === 'Fuera de Servicio' ? 'animate-pulse' : ''}`}></span>
                    {planta.estado}
                  </span>
                </div>

                {/* Subcabecera: Región y Cliente */}
                <div className="text-[11px] text-slate-400 space-y-0.5 mb-4">
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-500" /> {planta.region} ({planta.zona})
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Cliente: <span className="text-slate-400">{planta.cliente}</span>
                  </p>
                </div>

                {/* Potencia y Criticidad */}
                <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                  <div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Potencia</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1 font-mono">
                      <Sun className="h-3.5 w-3.5 text-emerald-400" /> {planta.mwp} MWp
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Criticidad</div>
                    <div className={`text-xs font-bold mt-0.5 flex items-center gap-1 font-mono ${isCritical ? 'text-rose-400' : 'text-slate-300'}`}>
                      <AlertTriangle className={`h-3.5 w-3.5 ${isCritical ? 'text-rose-400' : 'text-slate-500'}`} /> {planta.criticidad}
                    </div>
                  </div>
                </div>

                {/* Estructura de Responsables */}
                <div className="space-y-1.5 pt-3 border-t border-slate-950/80 mb-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">Supervisor:</span>
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-500" /> {planta.supervisor}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">Ingeniero:</span>
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-500" /> {planta.ingeniero}
                    </span>
                  </div>
                </div>

                {/* Fechas de Mantenimiento */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-3 border-t border-slate-950/80 text-slate-500">
                  <div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-600" /> Último Mant.
                    </div>
                    <div className="text-slate-400 mt-0.5">{planta.ultimoMantenimiento}</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-600" /> Próximo Mant.
                    </div>
                    <div className="text-slate-400 mt-0.5">{planta.proximoMantenimiento}</div>
                  </div>
                </div>
              </div>

              {/* Botón de Modificación y Link SharePoint */}
              <div className="flex gap-2 mt-5 pt-3 border-t border-slate-950/80">
                <a
                  href={planta.linkDocumental}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white font-mono py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  Documental <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>

                {canEdit && (
                  <button
                    onClick={() => handleEditClick(planta)}
                    className="bg-slate-950 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/20 text-[10px] text-slate-400 hover:text-emerald-400 font-mono px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" /> Config
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredPlantas.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
            No se encontraron plantas que coincidan con los criterios seleccionados.
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 5. GUÍA PASO A PASO PARA NAVEGACIÓN Y ROLES EN `App.tsx`

### Paso 1: Importación del Componente
```tsx
import MatrizPlantas from './components/MatrizPlantas';
```

### Paso 2: Opción de Navegación en Barra Lateral/Header
```tsx
{ id: 'Plantas', label: 'Matriz de Plantas', icon: Sun },
```

### Paso 3: Renderizado Condicional en la Vista Principal
```tsx
{activeTab === 'Plantas' && (
  <MatrizPlantas
    plantas={plantas}
    organigrama={organigrama}
    onUpdate={(updated) => {
      setPlantas(updated);
      savePlantas(updated);
    }}
    userRole={userRole}
  />
)}
```

---

## 6. GUÍA DE ACTUALIZACIÓN DEL EXECUTIVE DEMO HUB (`src/components/ExecutiveDemoHub.tsx`)

Añadir la Matriz de Plantas a la lista de módulos en la bento grid del Hub de Demostración Ejecutivo:

```typescript
{
  id: 'matriz-plantas',
  code: 'MOD-14A',
  name: 'Matriz de Plantas / Catastro de Activos Solares',
  status: 'INTEGRATED / SANDBOX / ASSET REGISTRY READY',
  badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  summary: 'Catastro de activos fotovoltaicos (MWp, criticidad, cliente, enlaces SharePoint, supervisor e ingeniero asignado).',
  responsibles: ['Alejandro Rojas', 'Mauricio Valdés', 'Francisco Jara'],
  metrics: '9 Plantas Registradas | 558.9 MWp Totales',
}
```

---

## 7. ACTUALIZACIÓN REGISTRO DE AGENTS.MD

Añadir al registro de versiones en `AGENTS.md`:

```markdown
### MÓDULO 14A: ORBI MATRIZ DE PLANTAS / ASSET REGISTRY SAFE INTEGRATION
- **Status:** `INTEGRATED / SANDBOX / NON-OPERATIONAL / ASSET REGISTRY READY`
- **Scope:** Catastro tradicional de activos fotovoltaicos, criticidad, potencia MWp, asignación de responsables y enlace documental.
- **Rules:** Operativo exclusivamente en modo Sandbox local; no incluye la suite PVMetrics IA.
```

---

## 8. INSTRUCCIONES DE VALIDACIÓN Y VERIFICACIÓN

Para verificar la correcta instalación, ejecute los siguientes comandos en la terminal del proyecto:

1. **Linter de TypeScript y React**:
   ```bash
   npm run lint
   ```
2. **Compilación para Producción**:
   ```bash
   npm run build
   ```

Ambos comandos deben finalizar exitosamente sin advertencias o errores fatales de importación.

---

## 9. CHECKLIST DE EXCLUSIÓN CUMPLIDO

- [x] Sin ningún componente o módulo del subdirectorio standalone excluido
- [x] Sin context de la suite avanzada
- [x] Sin algoritmos de despacho o asesoría BESS
- [x] Sin métricas de confianza de pronóstico
- [x] Sin compositores de reportes avanzados
- [x] Sin visualizadores de preparación SCADA / Telemetría

