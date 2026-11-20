/**
 * MÓDULO 17A — Fase 2: maestros de mantenimiento.
 *
 * Activos (jerarquía e importación CSV), planes preventivos (con generación de OTs),
 * plantillas de checklist y catálogos de códigos. Los datos se guardan como colecciones
 * compartidas en el servidor (ver server/collections.ts).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, CalendarClock, ClipboardList, Tags, Plus, Upload, Play, Save, X } from 'lucide-react';
import type { Planta } from '../types';
import {
  ASSET_TYPES, PERIODICIDADES, DEFAULT_CODES, assetPath, validateAssets, parseAssetsCsv, validatePlan, validateTemplate, localIsoDate,
  type Asset, type AssetType, type ChecklistTemplate, type ChecklistTemplateItem, type PmPlan, type Periodicidad, type CmmsCodes,
} from '../domain/cmms';
import { writeStorageCollection } from '../data/storage';
import { api, SYNC_EVENTS } from '../data/serverSync';

export { CMMS_STORAGE, loadAssets, loadTemplates, loadPlans, loadCodes } from '../data/cmmsStore';
import { CMMS_STORAGE, loadAssets, loadTemplates, loadPlans, loadCodes } from '../data/cmmsStore';

const PLANNER_ROLES = ['SUPER_ADMIN_ORBI', 'GERENCIA', 'JEFE_OM', 'COORDINADOR_OM', 'PLANIFICACION'];

const input = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500';
const btn = 'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors';

type Tab = 'activos' | 'planes' | 'plantillas' | 'codigos';

interface Props {
  plantas: Planta[];
  userRole: string;
}

export default function CmmsMaestros({ plantas, userRole }: Props) {
  const canEdit = PLANNER_ROLES.includes(userRole);
  const [tab, setTab] = useState<Tab>('planes');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [plans, setPlans] = useState<PmPlan[]>([]);
  const [codes, setCodes] = useState<CmmsCodes>(DEFAULT_CODES);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const reload = () => {
      setAssets(loadAssets());
      setTemplates(loadTemplates());
      setPlans(loadPlans());
      setCodes(loadCodes());
    };
    reload();
    window.addEventListener(SYNC_EVENTS.COLLECTIONS_UPDATED, reload);
    return () => window.removeEventListener(SYNC_EVENTS.COLLECTIONS_UPDATED, reload);
  }, []);

  const saveAssets = (next: Asset[]): boolean => {
    const errors = validateAssets(next);
    if (errors.length) {
      setMessage({ ok: false, text: `No se guardó. ${errors.slice(0, 3).join(' ')}` });
      return false;
    }
    setAssets(next);
    writeStorageCollection(CMMS_STORAGE.ASSETS, next);
    setMessage({ ok: true, text: 'Activos guardados.' });
    return true;
  };
  const savePlans = (next: PmPlan[]) => {
    setPlans(next);
    writeStorageCollection(CMMS_STORAGE.PLANS, next);
  };
  const saveTemplates = (next: ChecklistTemplate[]) => {
    setTemplates(next);
    writeStorageCollection(CMMS_STORAGE.TEMPLATES, next);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'planes', label: 'Planes preventivos', icon: CalendarClock },
    { id: 'activos', label: 'Activos', icon: Boxes },
    { id: 'plantillas', label: 'Plantillas de checklist', icon: ClipboardList },
    { id: 'codigos', label: 'Códigos', icon: Tags },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Maestros de mantenimiento</h1>
        <p className="text-xs text-slate-400 mt-1">
          Activos, planes preventivos que generan OTs, plantillas de checklist y códigos de espera y falla.
          {!canEdit && ' Modo solo lectura: solo planificación y jefatura pueden modificar.'}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMessage(null); }}
              className={`${btn} ${tab === t.id ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'}`}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div role="status" className={`text-xs rounded-lg p-2.5 border ${message.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          {message.text}
        </div>
      )}

      {tab === 'activos' && <AssetsTab assets={assets} plantas={plantas} canEdit={canEdit} onSave={saveAssets} onMessage={setMessage} />}
      {tab === 'planes' && <PlansTab plans={plans} templates={templates} assets={assets} plantas={plantas} canEdit={canEdit} onSave={savePlans} onMessage={setMessage} />}
      {tab === 'plantillas' && <TemplatesTab templates={templates} canEdit={canEdit} onSave={saveTemplates} onMessage={setMessage} />}
      {tab === 'codigos' && <CodesTab codes={codes} />}
    </div>
  );
}

// ---------------- Activos ----------------

function AssetsTab({ assets, plantas, canEdit, onSave, onMessage }: {
  assets: Asset[]; plantas: Planta[]; canEdit: boolean; onSave: (a: Asset[]) => boolean; onMessage: (m: { ok: boolean; text: string }) => void;
}) {
  const plantIds = useMemo(() => Array.from(new Set(assets.map(a => a.plantaId))), [assets]);
  const [planta, setPlanta] = useState<string>('');
  const [draft, setDraft] = useState<Partial<Asset>>({ tipo: 'Inversor' });
  const [csv, setCsv] = useState('');
  const selectedPlant = planta || plantIds[0] || '';
  const plantAssets = assets.filter(a => a.plantaId === selectedPlant);
  const plantName = (id: string) => plantas.find(p => p.id === id)?.name || id;

  const children = (parentId?: string) => plantAssets.filter(a => (a.parentId || '') === (parentId || ''));
  const renderNode = (a: Asset, depth: number): React.ReactNode => (
    <div key={a.id}>
      <div className="flex items-center justify-between py-1 border-b border-slate-900 text-xs" style={{ paddingLeft: depth * 16 }}>
        <span className={a.activo ? 'text-slate-200' : 'text-slate-500 line-through'}>
          <span className="font-mono text-[10px] text-slate-500 mr-2">{a.codigo}</span>{a.nombre}
          <span className="ml-2 text-[10px] text-indigo-300">{a.tipo}</span>
          {a.modelo && <span className="ml-2 text-[10px] text-slate-500">{a.fabricante} {a.modelo}</span>}
        </span>
        {canEdit && (
          <button className="text-[10px] text-slate-400 hover:text-white" onClick={() => onSave(assets.map(x => x.id === a.id ? { ...x, activo: !x.activo } : x))}>
            {a.activo ? 'Dar de baja' : 'Reactivar'}
          </button>
        )}
      </div>
      {children(a.id).map(c => renderNode(c, depth + 1))}
    </div>
  );

  const addAsset = () => {
    if (!draft.codigo || !draft.nombre || !draft.tipo) return onMessage({ ok: false, text: 'Completa código, nombre y tipo.' });
    const plantaId = draft.plantaId || selectedPlant;
    if (!plantaId) return onMessage({ ok: false, text: 'Selecciona la planta.' });
    // El id incluye el padre: el mismo código (p. ej. INV-01) puede repetirse en distintas estaciones
    const id = `${draft.parentId || plantaId}-${draft.codigo}`.replace(/\s+/g, '-');
    if (assets.some(a => a.id === id)) return onMessage({ ok: false, text: `Ya existe un activo ${draft.codigo} bajo ese padre.` });
    onSave([...assets, { id, plantaId, codigo: draft.codigo, nombre: draft.nombre, tipo: draft.tipo as AssetType, parentId: draft.parentId || undefined, fabricante: draft.fabricante, modelo: draft.modelo, activo: true }]);
    setDraft({ tipo: draft.tipo, parentId: draft.parentId });
  };

  const importCsv = () => {
    const { assets: imported, errors } = parseAssetsCsv(csv);
    if (errors.length) return onMessage({ ok: false, text: `No se importó nada. ${errors.slice(0, 3).join(' ')}` });
    const existing = new Set(assets.map(a => a.id));
    const nuevos = imported.filter(a => !existing.has(a.id));
    if (!onSave([...assets, ...nuevos])) return; // el error ya se mostró; se conserva el texto pegado
    setCsv('');
    onMessage({ ok: true, text: `Importados ${nuevos.length} activos (${imported.length - nuevos.length} ya existían).` });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-slate-400">Planta</span>
          <select className={input + ' max-w-xs'} value={selectedPlant} onChange={e => setPlanta(e.target.value)}>
            {plantIds.length === 0 && <option value="">Sin activos cargados</option>}
            {plantIds.map(id => <option key={id} value={id}>{plantName(id)}</option>)}
          </select>
          <span className="text-[10px] text-slate-500">{plantAssets.length} activos</span>
        </div>
        <div className="max-h-[520px] overflow-y-auto">
          {children(undefined).map(a => renderNode(a, 0))}
          {plantAssets.length === 0 && <p className="text-xs text-slate-500">No hay activos para esta planta. Agrégalos o impórtalos desde CSV.</p>}
        </div>
      </div>
      {canEdit && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-white">Agregar activo</h3>
            <select className={input} value={draft.plantaId || selectedPlant} onChange={e => setDraft({ ...draft, plantaId: e.target.value, parentId: '' })}>
              <option value="">Planta…</option>
              {plantas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className={input} value={draft.parentId || ''} onChange={e => setDraft({ ...draft, parentId: e.target.value })}>
              <option value="">Sin padre (raíz de la planta)</option>
              {assets.filter(a => a.plantaId === (draft.plantaId || selectedPlant)).map(a => <option key={a.id} value={a.id}>{assetPath(assets, a.id)}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className={input} placeholder="Código" value={draft.codigo || ''} onChange={e => setDraft({ ...draft, codigo: e.target.value })} />
              <select className={input} value={draft.tipo} onChange={e => setDraft({ ...draft, tipo: e.target.value as AssetType })}>
                {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <input className={input} placeholder="Nombre" value={draft.nombre || ''} onChange={e => setDraft({ ...draft, nombre: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className={input} placeholder="Fabricante" value={draft.fabricante || ''} onChange={e => setDraft({ ...draft, fabricante: e.target.value })} />
              <input className={input} placeholder="Modelo" value={draft.modelo || ''} onChange={e => setDraft({ ...draft, modelo: e.target.value })} />
            </div>
            <button className={`${btn} bg-emerald-500 text-slate-950`} onClick={addAsset}><Plus className="h-3.5 w-3.5" /> Agregar</button>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-white">Importar desde CSV</h3>
            <p className="text-[10px] text-slate-400 font-mono">id;padre;planta;codigo;nombre;tipo;fabricante;modelo;serie</p>
            <textarea className={input + ' h-28 font-mono'} value={csv} onChange={e => setCsv(e.target.value)} placeholder="Pega aquí el contenido del CSV (Excel → Guardar como CSV)" />
            <button className={`${btn} bg-slate-800 text-white hover:bg-slate-700`} onClick={importCsv} disabled={!csv.trim()}><Upload className="h-3.5 w-3.5" /> Importar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Planes preventivos ----------------

const emptyPlan = (): PmPlan => ({
  id: `PLAN-${Date.now()}`, codigo: '', descripcion: '', plantaId: '', plantaNombre: '', periodicidad: 'mensual',
  proximaFecha: localIsoDate(), anticipacionDias: 14, plantillaIds: [], hhEstimadas: 4, requiereAST: false, activo: true,
});

function PlansTab({ plans, templates, assets, plantas, canEdit, onSave, onMessage }: {
  plans: PmPlan[]; templates: ChecklistTemplate[]; assets: Asset[]; plantas: Planta[]; canEdit: boolean;
  onSave: (p: PmPlan[]) => void; onMessage: (m: { ok: boolean; text: string }) => void;
}) {
  const [editing, setEditing] = useState<PmPlan | null>(null);
  const [busy, setBusy] = useState(false);

  const save = () => {
    if (!editing) return;
    const errors = validatePlan(editing, templates, plans);
    if (errors.length) return onMessage({ ok: false, text: errors.join(' ') });
    const exists = plans.some(p => p.id === editing.id);
    onSave(exists ? plans.map(p => (p.id === editing.id ? editing : p)) : [...plans, editing]);
    setEditing(null);
    onMessage({ ok: true, text: 'Plan guardado.' });
  };

  const generate = async () => {
    setBusy(true);
    try {
      const { creadas } = await api<{ creadas: string[] }>('/pm/generate', { method: 'POST' });
      onMessage({ ok: true, text: creadas.length ? `OTs preventivas creadas: ${creadas.join(', ')}` : 'No hay planes con OTs por generar en su ventana de anticipación.' });
      // Pide a la app traer las OTs nuevas y el plan actualizado (la app sincroniza al recibir foco)
      window.dispatchEvent(new Event('focus'));
    } catch (error) {
      onMessage({ ok: false, text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex gap-2">
          <button className={`${btn} bg-emerald-500 text-slate-950`} onClick={() => setEditing(emptyPlan())}><Plus className="h-3.5 w-3.5" /> Nuevo plan</button>
          <button className={`${btn} bg-slate-800 text-white hover:bg-slate-700`} onClick={generate} disabled={busy}><Play className="h-3.5 w-3.5" /> {busy ? 'Generando…' : 'Generar OTs ahora'}</button>
          <span className="text-[10px] text-slate-500 self-center">El servidor también genera automáticamente una vez al día.</span>
        </div>
      )}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-800">
            <tr>{['Plan', 'Descripción', 'Planta', 'Periodicidad', 'Próxima fecha', 'Responsable', 'Plantillas', 'Estado', ''].map(h => <th key={h} className="text-left p-2.5">{h}</th>)}</tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id} className="border-b border-slate-900 text-slate-300">
                <td className="p-2.5 font-mono">{p.codigo}</td>
                <td className="p-2.5">{p.descripcion}</td>
                <td className="p-2.5">{p.plantaNombre}</td>
                <td className="p-2.5">{p.periodicidad}</td>
                <td className="p-2.5 font-mono">{p.proximaFecha}</td>
                <td className="p-2.5">{p.responsable || <span className="text-amber-400">Sin asignar</span>}</td>
                <td className="p-2.5 font-mono text-[10px]">{p.plantillaIds.map(id => templates.find(t => t.id === id)?.codigo || id).join(', ')}</td>
                <td className="p-2.5">{p.activo ? <span className="text-emerald-400">Activo</span> : <span className="text-slate-500">Inactivo</span>}</td>
                <td className="p-2.5">{canEdit && <button className="text-[10px] underline text-slate-400 hover:text-white" onClick={() => setEditing({ ...p })}>Editar</button>}</td>
              </tr>
            ))}
            {plans.length === 0 && <tr><td colSpan={9} className="p-4 text-slate-500">No hay planes preventivos.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">{plans.some(p => p.id === editing.id) ? 'Editar plan' : 'Nuevo plan preventivo'}</h3>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-3 text-xs">
            <label className="space-y-1"><span className="text-slate-400">N° de plan</span>
              <input className={input} value={editing.codigo} onChange={e => setEditing({ ...editing, codigo: e.target.value })} /></label>
            <label className="space-y-1 md:col-span-2"><span className="text-slate-400">Descripción</span>
              <input className={input} value={editing.descripcion} onChange={e => setEditing({ ...editing, descripcion: e.target.value })} /></label>
            <label className="space-y-1"><span className="text-slate-400">Planta</span>
              <select className={input} value={editing.plantaId} onChange={e => {
                const pl = plantas.find(p => p.id === e.target.value);
                setEditing({ ...editing, plantaId: e.target.value, plantaNombre: pl?.name || '', activoId: undefined });
              }}>
                <option value="">Seleccionar…</option>
                {plantas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></label>
            <label className="space-y-1 md:col-span-2"><span className="text-slate-400">Activo (opcional)</span>
              <select className={input} value={editing.activoId || ''} onChange={e => setEditing({ ...editing, activoId: e.target.value || undefined })}>
                <option value="">Toda la planta</option>
                {assets.filter(a => a.plantaId === editing.plantaId && a.activo).map(a => <option key={a.id} value={a.id}>{assetPath(assets, a.id)}</option>)}
              </select></label>
            <label className="space-y-1"><span className="text-slate-400">Periodicidad</span>
              <select className={input} value={editing.periodicidad} onChange={e => setEditing({ ...editing, periodicidad: e.target.value as Periodicidad })}>
                {Object.keys(PERIODICIDADES).map(p => <option key={p}>{p}</option>)}
              </select></label>
            <label className="space-y-1"><span className="text-slate-400">Próxima fecha</span>
              <input type="date" className={input} value={editing.proximaFecha} onChange={e => setEditing({ ...editing, proximaFecha: e.target.value })} /></label>
            <label className="space-y-1"><span className="text-slate-400">Generar con anticipación (días)</span>
              <input type="number" min={0} className={input} value={editing.anticipacionDias} onChange={e => setEditing({ ...editing, anticipacionDias: Number(e.target.value) })} /></label>
            <label className="space-y-1"><span className="text-slate-400">Técnico responsable (como en las OTs)</span>
              <input className={input} value={editing.responsable || ''} onChange={e => setEditing({ ...editing, responsable: e.target.value })} /></label>
            <label className="space-y-1"><span className="text-slate-400">Supervisor</span>
              <input className={input} value={editing.supervisor || ''} onChange={e => setEditing({ ...editing, supervisor: e.target.value })} /></label>
            <label className="space-y-1"><span className="text-slate-400">HH estimadas</span>
              <input type="number" min={0} step={0.5} className={input} value={editing.hhEstimadas} onChange={e => setEditing({ ...editing, hhEstimadas: Number(e.target.value) })} /></label>
          </div>
          <div className="text-xs space-y-1">
            <span className="text-slate-400">Plantillas de checklist</span>
            <div className="flex flex-wrap gap-2">
              {templates.filter(t => t.activo).map(t => (
                <label key={t.id} className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded px-2 py-1">
                  <input type="checkbox" checked={editing.plantillaIds.includes(t.id)} onChange={e => setEditing({
                    ...editing, plantillaIds: e.target.checked ? [...editing.plantillaIds, t.id] : editing.plantillaIds.filter(x => x !== t.id),
                  })} />
                  <span className="font-mono text-[10px]">{t.codigo}</span> <span className="text-slate-400">{t.nombre}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-4 text-xs text-slate-300">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={editing.requiereAST} onChange={e => setEditing({ ...editing, requiereAST: e.target.checked })} /> Requiere AST</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={editing.activo} onChange={e => setEditing({ ...editing, activo: e.target.checked })} /> Plan activo</label>
          </div>
          <button className={`${btn} bg-emerald-500 text-slate-950`} onClick={save}><Save className="h-3.5 w-3.5" /> Guardar plan</button>
        </div>
      )}
    </div>
  );
}

// ---------------- Plantillas ----------------

function TemplatesTab({ templates, canEdit, onSave, onMessage }: {
  templates: ChecklistTemplate[]; canEdit: boolean; onSave: (t: ChecklistTemplate[]) => void; onMessage: (m: { ok: boolean; text: string }) => void;
}) {
  const [editing, setEditing] = useState<ChecklistTemplate | null>(null);

  const save = () => {
    if (!editing) return;
    const errors = validateTemplate(editing);
    if (errors.length) return onMessage({ ok: false, text: errors.join(' ') });
    const prev = templates.find(t => t.id === editing.id);
    // Cada cambio de una plantilla existente crea una nueva versión (las OTs ya generadas conservan la suya)
    const next = prev ? { ...editing, version: prev.version + (JSON.stringify(prev.items) === JSON.stringify(editing.items) ? 0 : 1) } : editing;
    onSave(prev ? templates.map(t => (t.id === next.id ? next : t)) : [...templates, next]);
    setEditing(null);
    onMessage({ ok: true, text: `Plantilla ${next.codigo} guardada (versión ${next.version}).` });
  };

  const setItem = (i: number, patch: Partial<ChecklistTemplateItem>) =>
    editing && setEditing({ ...editing, items: editing.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });

  return (
    <div className="space-y-4">
      {canEdit && (
        <button className={`${btn} bg-emerald-500 text-slate-950`} onClick={() => setEditing({ id: `TPL-${Date.now()}`, codigo: '', nombre: '', version: 1, activo: true, items: [{ id: '1', texto: '', tipo: 'ok_nok' }] })}>
          <Plus className="h-3.5 w-3.5" /> Nueva plantilla
        </button>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {templates.map(t => (
          <div key={t.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex justify-between">
              <div>
                <div className="font-mono text-[10px] text-emerald-400">{t.codigo} · v{t.version}</div>
                <div className="text-sm font-bold text-white">{t.nombre}</div>
              </div>
              {canEdit && <button className="text-[10px] underline text-slate-400 hover:text-white" onClick={() => setEditing(JSON.parse(JSON.stringify(t)))}>Editar</button>}
            </div>
            <ol className="mt-2 space-y-1 text-xs text-slate-300 list-decimal list-inside">
              {t.items.map(it => (
                <li key={it.id}>
                  {it.texto}
                  <span className="ml-1 text-[10px] text-slate-500">
                    ({it.tipo === 'ok_nok' ? 'OK / No OK' : it.tipo === 'numero' ? `número${it.unidad ? ' ' + it.unidad : ''}${it.min !== undefined || it.max !== undefined ? ` [${it.min ?? '–'}…${it.max ?? '–'}]` : ''}` : 'texto'}{it.requiereFoto ? ', foto' : ''})
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
        {templates.length === 0 && <p className="text-xs text-slate-500">No hay plantillas.</p>}
      </div>

      {editing && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Plantilla de checklist</h3>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input className={input} placeholder="Código (p. ej. BLUETREE_2.08_INV_A1)" value={editing.codigo} onChange={e => setEditing({ ...editing, codigo: e.target.value })} />
            <input className={input} placeholder="Nombre" value={editing.nombre} onChange={e => setEditing({ ...editing, nombre: e.target.value })} />
          </div>
          {editing.items.map((it, i) => (
            <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
              <input className={input + ' col-span-5'} placeholder={`Pregunta ${i + 1}`} value={it.texto} onChange={e => setItem(i, { texto: e.target.value })} />
              <select className={input + ' col-span-2'} value={it.tipo} onChange={e => setItem(i, { tipo: e.target.value as ChecklistTemplateItem['tipo'] })}>
                <option value="ok_nok">OK / No OK</option><option value="numero">Número</option><option value="texto">Texto</option>
              </select>
              {it.tipo === 'numero' ? (
                <>
                  <input className={input + ' col-span-1'} placeholder="Unidad" value={it.unidad || ''} onChange={e => setItem(i, { unidad: e.target.value })} />
                  <input className={input + ' col-span-1'} type="number" placeholder="Mín" value={it.min ?? ''} onChange={e => setItem(i, { min: e.target.value === '' ? undefined : Number(e.target.value) })} />
                  <input className={input + ' col-span-1'} type="number" placeholder="Máx" value={it.max ?? ''} onChange={e => setItem(i, { max: e.target.value === '' ? undefined : Number(e.target.value) })} />
                </>
              ) : <span className="col-span-3" />}
              <label className="col-span-1 flex items-center gap-1 text-slate-300"><input type="checkbox" checked={Boolean(it.requiereFoto)} onChange={e => setItem(i, { requiereFoto: e.target.checked })} /> Foto</label>
              <button className="col-span-1 text-slate-500 hover:text-rose-400" onClick={() => setEditing({ ...editing, items: editing.items.filter((_, j) => j !== i) })}><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <button className={`${btn} bg-slate-800 text-white`} onClick={() => setEditing({ ...editing, items: [...editing.items, { id: String(Math.max(0, ...editing.items.map(x => Number(x.id) || 0)) + 1), texto: '', tipo: 'ok_nok' }] })}>
              <Plus className="h-3.5 w-3.5" /> Pregunta
            </button>
            <button className={`${btn} bg-emerald-500 text-slate-950`} onClick={save}><Save className="h-3.5 w-3.5" /> Guardar plantilla</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Códigos ----------------

function CodesTab({ codes }: { codes: CmmsCodes }) {
  const groups: { title: string; list: { codigo: string; descripcion: string }[] }[] = [
    { title: 'Motivos de espera', list: codes.espera },
    { title: 'Falla — problema', list: codes.fallaProblema },
    { title: 'Falla — causa', list: codes.fallaCausa },
    { title: 'Falla — acción', list: codes.fallaAccion },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {groups.map(g => (
        <div key={g.title} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-white mb-2">{g.title}</h3>
          {g.list.map(c => (
            <div key={c.codigo} className="flex gap-3 text-xs py-1 border-b border-slate-900">
              <span className="font-mono text-emerald-400 w-28 shrink-0">{c.codigo}</span>
              <span className="text-slate-300">{c.descripcion}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
