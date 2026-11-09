/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Map,
  MapPin,
  User,
  Zap,
  Clock,
  Hammer,
  AlertOctagon,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Planta, OT, OrganigramaNode } from '../types';

interface ZonasProps {
  plantas: Planta[];
  ots: OT[];
  organigrama: OrganigramaNode[];
  onNavigate: (view: string, filter?: any) => void;
}

export default function Zonas({
  plantas,
  ots,
  organigrama,
  onNavigate,
}: ZonasProps) {
  
  const zonas = [
    {
      id: 'Norte',
      nombre: 'Zona Norte',
      region: 'Región de Tarapacá, Antofagasta y Atacama',
      color: 'from-amber-600/20 to-orange-600/10 border-amber-500/30',
      textAccent: 'text-amber-400',
      badgeAccent: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      supervisorId: '5', // Alejandro Rojas
      clima: 'Despoblado de nubes, radiación máxima. Polvo constante.'
    },
    {
      id: 'Centro',
      nombre: 'Zona Centro',
      region: 'Región de Coquimbo, Metropolitana y O\'Higgins',
      color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30',
      textAccent: 'text-emerald-400',
      badgeAccent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      supervisorId: '6', // Mauricio Valdés
      clima: 'Nubosidad matinal parcial, radiación moderada.'
    },
    {
      id: 'Sur',
      nombre: 'Zona Sur',
      region: 'Región del Maule, Ñuble y Biobío',
      color: 'from-blue-600/20 to-indigo-600/10 border-blue-500/30',
      textAccent: 'text-blue-400',
      badgeAccent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      supervisorId: '7', // Francisco Jara
      clima: 'Nublado con lloviznas intermitentes. Limpieza natural activa.'
    }
  ];

  // Calcular métricas para cada zona en tiempo real
  const getZoneMetrics = (zonaId: 'Norte' | 'Centro' | 'Sur') => {
    const plantasZona = plantas.filter((p) => p.zona === zonaId);
    const totalMwp = plantasZona.reduce((acc, p) => acc + p.mwp, 0);
    
    // Nombres de plantas en esta zona
    const nombresPlantas = plantasZona.map((p) => p.id);
    
    // OTs de plantas en esta zona
    const otsZona = ots.filter((o) => nombresPlantas.includes(o.plantaId));
    
    const otsAbiertas = otsZona.filter((o) => o.estado !== 'Cerrada' && o.estado !== 'Finalizada').length;
    const hhConsumidas = otsZona.reduce((acc, o) => acc + o.hhReales, 0);
    const preventivosAtrasados = otsZona.filter(
      (o) => o.tipo === 'Preventiva' && o.estado === 'Nueva' && new Date(o.fechaLimite) < new Date('2026-07-06')
    ).length;
    
    const correctivosCriticos = otsZona.filter(
      (o) => o.tipo === 'Correctiva' && o.prioridad === 'Crítica' && o.estado !== 'Cerrada'
    ).length;

    // Supervisor de la zona
    const supervisor = organigrama.find((node) => node.role === 'SUPERVISOR_TERRENO' && node.zona === zonaId);

    // Alertas específicas por zona
    const alertas: string[] = [];
    if (correctivosCriticos > 0) {
      alertas.push(`${correctivosCriticos} Correctivo(s) Crítico(s) en curso.`);
    }
    if (preventivosAtrasados > 0) {
      alertas.push(`${preventivosAtrasados} Mantenimiento Preventivo atrasado.`);
    }
    
    // Alerta de disponibilidad de planta
    const plantasDetenidas = plantasZona.filter((p) => p.estado === 'Fuera de Servicio' || p.estado === 'Limitada');
    if (plantasDetenidas.length > 0) {
      plantasDetenidas.forEach((p) => {
        alertas.push(`Planta "${p.name}" reporta estado: ${p.estado}.`);
      });
    }

    if (alertas.length === 0) {
      alertas.push('Operación estable sin desvíos reportados.');
    }

    return {
      plantas: plantasZona,
      mwp: totalMwp.toFixed(1),
      otsAbiertas,
      hhConsumidas,
      preventivosAtrasados,
      correctivosCriticos,
      supervisor: supervisor ? supervisor.name : 'No Asignado',
      supervisorEmail: supervisor ? supervisor.email : '',
      alertas
    };
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Map className="h-5 w-5 text-emerald-400" /> Zonas Operacionales O&M
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Distribución de activos solares, personal y control de eventos georreferenciados.
          </p>
        </div>
        
        <div className="text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400">
          ZONAS ACTIVAS: <span className="text-emerald-400 font-bold">3 REGIONES</span>
        </div>
      </div>

      {/* Grid de 3 Zonas Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {zonas.map((zona) => {
          const metrics = getZoneMetrics(zona.id as any);
          const isCritical = metrics.correctivosCriticos > 0;

          return (
            <div
              key={zona.id}
              className={`bg-slate-900/40 backdrop-blur-md rounded-2xl border ${zona.color} p-5 flex flex-col justify-between transition-all hover:translate-y-[-2px] shadow-xl relative overflow-hidden group`}
            >
              {/* Elementos Estéticos Ambientales */}
              <div className="absolute top-0 right-0 h-28 w-28 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl"></div>

              <div>
                {/* Cabecera de la Zona */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${zona.badgeAccent} uppercase tracking-wider`}>
                      {zona.id}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">
                      {zona.nombre}
                    </h3>
                  </div>
                  <MapPin className={`h-5 w-5 ${zona.textAccent}`} />
                </div>

                <p className="text-[11px] text-slate-400 font-medium mb-3">
                  {zona.region}
                </p>

                {/* Supervisor de la Zona */}
                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/60 mb-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Award className="h-3 w-3 text-emerald-400" /> SUPERVISOR RESPONSABLE
                    </div>
                    <div className="text-xs font-bold text-white">{metrics.supervisor}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{metrics.supervisorEmail}</div>
                  </div>
                </div>

                {/* KPIs de la Zona */}
                <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t border-slate-950">
                  <div className="bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40">
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-emerald-400" /> POTENCIA MWP
                    </div>
                    <div className="text-sm font-bold text-slate-200 font-mono mt-1">{metrics.mwp} MWp</div>
                    <div className="text-[9px] text-slate-500 font-mono">{metrics.plantas.length} Plantas</div>
                  </div>

                  <div className="bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40">
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Hammer className="h-3.5 w-3.5 text-sky-400" /> OTs EN CURSO
                    </div>
                    <div className="text-sm font-bold text-slate-200 font-mono mt-1">{metrics.otsAbiertas} Abiertas</div>
                    <div className="text-[9px] text-slate-500 font-mono">{metrics.hhConsumidas} HH Consumidas</div>
                  </div>
                </div>

                {/* Sub-KPIs de mantenimiento */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40">
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500" /> PREV. PENDIENTES
                    </div>
                    <div className={`text-sm font-bold font-mono mt-1 ${metrics.preventivosAtrasados > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {metrics.preventivosAtrasados} Atrasados
                    </div>
                  </div>

                  <div className="bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40">
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-400" /> CORR. CRÍTICOS
                    </div>
                    <div className={`text-sm font-bold font-mono mt-1 ${metrics.correctivosCriticos > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                      {metrics.correctivosCriticos} Críticos
                    </div>
                  </div>
                </div>

                {/* Caja de Alertas y Mensajería */}
                <div className="mt-4 pt-3 border-t border-slate-950">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertOctagon className="h-3.5 w-3.5 text-rose-500" /> Alertas Operativas de Zona
                  </div>
                  
                  <div className="bg-slate-950/90 rounded-lg p-2.5 border border-slate-900 font-mono text-[10px] space-y-1.5 max-h-[85px] overflow-y-auto">
                    {metrics.alertas.map((alerta, idx) => (
                      <div key={idx} className="flex items-start gap-1 text-slate-400 leading-normal">
                        <span className="text-emerald-500">•</span>
                        <span>{alerta}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botón de Acción a Filtro */}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => onNavigate('Plantas', { zona: zona.id })}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white font-mono py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  Ver Plantas <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onNavigate('OTs', { zona: zona.id })}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white font-mono py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  Filtrar OTs <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clima Operacional e Informe Logístico */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-white mb-3">📡 Análisis Ambiental y Restricciones Climáticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {zonas.map((z) => {
            const metrics = getZoneMetrics(z.id as any);
            return (
              <div key={z.id} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{z.nombre}</h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{z.clima}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
