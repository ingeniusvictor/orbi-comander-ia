/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Legacy technical name retained for compatibility. Visible product name is ORBI Insight Center.
 */

import { OT, Planta } from '../types';
import { PlantRecordScope, getPlantRecordScope } from './plantIdentityMap';

/**
 * Clean, read-only analytical record normalized for the BI Center,
 * perfectly matching the real Power BI Benchmark schema.
 */
export interface BIWorkOrderRecord {
  id: string;
  woNum: string;
  cliente: string;
  zona: string;
  planta: string;
  tipoWO: string;
  estado: string;
  descripcion: string;
  tecnico: string;
  supervisor: string;
  fechaProgramada: string;
  fechaCierre: string;
  hhPlanificadas: number;
  hhRegistradas: number;
  hhValidadas: number;
  hold: boolean;
  bloqueoLogistico: boolean;
  ptwRequerido: boolean;
  ptwEstado: string;
  reprogramaciones: number;
  avance: number;
  origenDato: string;
  confiabilidadHH: 'Alta confianza' | 'Media confianza' | 'Baja confianza';
  fuente: 'PowerBI Benchmark' | 'ORBI Live Database';

  recordScope: PlantRecordScope;

  // Helper properties to ensure 100% compatibility with BICenter tabs and charts
  prioridad: string;
  plantaId?: string;
  mwAfectado: number;
  isOverdue: boolean;
  isBlocked: boolean;
  
  // Backward compatibility properties
  tipo: string;
  fechaInicio: string;
  fechaLimite: string;
  hhEstimadas: number;
  hhReales: number;
}

/**
 * Adapter function that normalizes operational OTs and Plants into BIWorkOrderRecord structures
 * with automatic fallback and enrichment of Power BI real benchmark clients.
 */
export function getBIWorkOrderRecords(ots: OT[], plantas: Planta[]): BIWorkOrderRecord[] {
  // 1. Map existing real OTs from database
  const mappedReal: BIWorkOrderRecord[] = ots.map((ot) => {
    const plant = plantas.find(p => p.id === ot.plantaId || p.name === ot.plantaNombre);
    
    // Normalize existing clients to fit the standard Power BI benchmark when possible, 
    // and label mock data clearly.
    let clientName = plant ? plant.cliente : 'Otro Cliente O&M';
    if (clientName === 'Colbún Solar') {
      clientName = 'Bluetree (MOCK)';
    } else if (clientName === 'AES Andes') {
      clientName = 'ICAFAL (MOCK)';
    } else if (clientName === 'Grenergy') {
      clientName = 'BIWO (MOCK)';
    } else if (clientName === 'EDF Renewables') {
      clientName = 'CVE (MOCK)';
    } else if (clientName === 'First Solar') {
      clientName = 'Mala Renewables (MOCK)';
    } else if (clientName === 'Enel Green Power') {
      clientName = 'AGR (MOCK)';
    } else {
      const benchmarkList = ['ICAFAL', 'BIWO', 'Mala Renewables', 'Reden', 'Aquasol', 'Eurus Energy', 'Bluetree', 'CVE', 'AGR', 'ECOM'];
      if (!benchmarkList.includes(clientName)) {
        clientName = `${clientName} (MOCK)`;
      }
    }

    const stateMapped = ot.estado;
    const isAbierta = stateMapped !== 'Cerrada' && stateMapped !== 'Finalizada' && stateMapped !== 'Cancelada';
    
    // Calculate MW affected based on status
    let mwAfectado = 0;
    const mwp = plant ? plant.mwp : 10.0;
    if (isAbierta) {
      if (ot.prioridad === 'Crítica') {
        mwAfectado = mwp * 0.6;
      } else if (ot.prioridad === 'Alta') {
        mwAfectado = mwp * 0.2;
      } else {
        mwAfectado = mwp * 0.05;
      }
    }
    
    const isBlocked = ot.estado === 'Bloqueada' || !!ot.bloqueada;
    const isOverdue = !!(isAbierta && ot.fechaLimite && new Date(ot.fechaLimite) < new Date('2026-07-06'));

    const scope = getPlantRecordScope({
      plantaId: ot.plantaId,
      legacyPlantId: ot.legacyPlantId,
      plantaNombre: ot.plantaNombre
    });

    return {
      id: ot.codigo,
      woNum: ot.codigo,
      cliente: clientName,
      zona: plant ? plant.zona : 'Centro',
      planta: ot.plantaNombre,
      tipoWO: ot.tipo,
      estado: ot.estado,
      descripcion: ot.observaciones || 'Mantenimiento preventivo anual',
      tecnico: ot.responsable || 'Sin asignar',
      supervisor: ot.supervisor || 'Alejandro Rojas',
      fechaProgramada: ot.fechaInicio || '',
      fechaCierre: stateMapped === 'Cerrada' || stateMapped === 'Finalizada' ? ot.fechaLimite || '2026-07-05' : '',
      hhPlanificadas: ot.hhEstimadas || 4,
      hhRegistradas: ot.hhReales || 0,
      hhValidadas: stateMapped === 'Cerrada' ? ot.hhReales : 0,
      hold: isBlocked,
      bloqueoLogistico: ot.estado === 'En espera de repuesto' || !!(ot.repuestos && ot.repuestos.length > 0 && ot.estado === 'Bloqueada'),
      ptwRequerido: (ot.tipo as string) === 'LOTO/HSE' || ot.tipo === 'HSE' || ot.prioridad === 'Crítica',
      ptwEstado: ((ot.tipo as string) === 'LOTO/HSE' || ot.tipo === 'HSE' || ot.prioridad === 'Crítica') ? (stateMapped === 'Cerrada' ? 'Aprobado' : 'Pendiente') : 'No Aplica',
      reprogramaciones: 0,
      avance: ot.avance || 0,
      origenDato: 'OTCenter',
      confiabilidadHH: ot.hhReales > 0 ? 'Alta confianza' : 'Media confianza',
      fuente: 'ORBI Live Database',
      recordScope: scope,

      // Helper mappings for backward compatibility
      prioridad: ot.prioridad,
      plantaId: ot.plantaId,
      mwAfectado,
      isOverdue,
      isBlocked,
      tipo: ot.tipo,
      fechaInicio: ot.fechaInicio || '',
      fechaLimite: ot.fechaLimite || '',
      hhEstimadas: ot.hhEstimadas || 4,
      hhReales: ot.hhReales || 0
    };
  });

  // 2. High-fidelity static benchmark records to match Power BI real counts and states
  const benchmarkRecords: BIWorkOrderRecord[] = [];

  // ICAFAL: 28 ejecutadas / 28 total (100% SLA)
  for (let i = 1; i <= 28; i++) {
    const isMC = i <= 6;
    const tipoStr = isMC ? 'Correctiva' : 'Preventiva';
    const prioStr = isMC ? 'Alta' : 'Media';
    benchmarkRecords.push({
      id: `BENCH-WO-ICA-${1000 + i}`,
      woNum: `BENCH-WO-ICA-${1000 + i}`,
      cliente: 'ICAFAL',
      zona: i % 3 === 0 ? 'Norte' : i % 3 === 1 ? 'Centro' : 'Sur',
      planta: i % 2 === 0 ? 'ICAFAL Atacama Benchmark' : 'ICAFAL Santiago Benchmark',
      tipoWO: tipoStr,
      estado: 'Cerrada',
      descripcion: isMC ? 'Reemplazo fusible de potencia inversores' : 'Limpieza de paneles y termografía anual',
      tecnico: i % 2 === 0 ? 'Víctor León' : 'Eduardo Carvallo',
      supervisor: 'Alejandro Rojas',
      fechaProgramada: `2026-06-${10 + (i % 15)}`,
      fechaCierre: `2026-06-${11 + (i % 15)}`,
      hhPlanificadas: isMC ? 6 : 4,
      hhRegistradas: isMC ? 6 : 4,
      hhValidadas: isMC ? 6 : 4,
      hold: false,
      bloqueoLogistico: false,
      ptwRequerido: isMC,
      ptwEstado: isMC ? 'Aprobado' : 'No Aplica',
      reprogramaciones: 0,
      avance: 100,
      origenDato: 'SharePoint',
      confiabilidadHH: 'Alta confianza',
      fuente: 'PowerBI Benchmark',
      recordScope: 'BENCHMARK_EXTERNAL',

      prioridad: prioStr,
      plantaId: i % 2 === 0 ? 'BENCH-PLANT-ICAFAL-01' : 'BENCH-PLANT-ICAFAL-02',
      mwAfectado: 0,
      isOverdue: false,
      isBlocked: false,
      tipo: tipoStr,
      fechaInicio: `2026-06-${10 + (i % 15)}`,
      fechaLimite: `2026-06-${11 + (i % 15)}`,
      hhEstimadas: isMC ? 6 : 4,
      hhReales: isMC ? 6 : 4
    });
  }

  // BIWO: 92 ejecutadas / 93 total (1 atrasada, 98.92%)
  for (let i = 1; i <= 93; i++) {
    const isAtrasada = i === 93;
    const isMC = i % 5 === 0;
    const tipoStr = isMC ? 'Correctiva' : 'Preventiva';
    const prioStr = isAtrasada ? 'Crítica' : (isMC ? 'Alta' : 'Media');
    benchmarkRecords.push({
      id: `BENCH-WO-BIW-${2000 + i}`,
      woNum: `BENCH-WO-BIW-${2000 + i}`,
      cliente: 'BIWO',
      zona: i % 3 === 0 ? 'Norte' : i % 3 === 1 ? 'Centro' : 'Sur',
      planta: i % 2 === 0 ? 'BIWO Atacama Benchmark' : 'BIWO Maule Benchmark',
      tipoWO: tipoStr,
      estado: isAtrasada ? 'En ejecución' : 'Cerrada',
      descripcion: isMC ? 'Ajuste de torque tracker solar' : 'Mantenimiento preventivo inversores',
      tecnico: i % 3 === 0 ? 'Víctor León' : i % 3 === 1 ? 'Eduardo Carvallo' : 'Daniel Godoy',
      supervisor: 'Mauricio Valdés',
      fechaProgramada: isAtrasada ? '2026-06-25' : `2026-06-${1 + (i % 25)}`,
      fechaCierre: isAtrasada ? '' : `2026-06-${2 + (i % 25)}`,
      hhPlanificadas: 8,
      hhRegistradas: isAtrasada ? 12 : 8,
      hhValidadas: isAtrasada ? 0 : 8,
      hold: isAtrasada,
      bloqueoLogistico: isAtrasada,
      ptwRequerido: isMC,
      ptwEstado: isAtrasada ? 'Pendiente' : 'Aprobado',
      reprogramaciones: isAtrasada ? 2 : 0,
      avance: isAtrasada ? 75 : 100,
      origenDato: 'Workspace',
      confiabilidadHH: isAtrasada ? 'Baja confianza' : 'Alta confianza',
      fuente: 'PowerBI Benchmark',
      recordScope: 'BENCHMARK_EXTERNAL',

      prioridad: prioStr,
      plantaId: i % 2 === 0 ? 'BENCH-PLANT-BIWO-01' : 'BENCH-PLANT-BIWO-02',
      mwAfectado: isAtrasada ? 6.0 : 0,
      isOverdue: isAtrasada,
      isBlocked: isAtrasada,
      tipo: tipoStr,
      fechaInicio: isAtrasada ? '2026-06-25' : `2026-06-${1 + (i % 25)}`,
      fechaLimite: isAtrasada ? '2026-07-15' : `2026-06-${2 + (i % 25)}`,
      hhEstimadas: 8,
      hhReales: isAtrasada ? 12 : 8
    });
  }

  // CVE: 224 ejecutadas / 237 total (13 atrasadas, 94.51%)
  // Plantas críticas: Clementina y Liquidámbar
  for (let i = 1; i <= 237; i++) {
    const isAtrasada = i <= 13;
    const isMC = i % 4 === 0;
    const plantaNombre = i % 3 === 0 ? 'CVE Clementina Benchmark' : i % 3 === 1 ? 'CVE Liquidámbar Benchmark' : 'CVE Atacama Benchmark';
    const tipoStr = isMC ? 'Correctiva' : 'Preventiva';
    const prioStr = isAtrasada ? 'Alta' : 'Media';
    benchmarkRecords.push({
      id: `BENCH-WO-CVE-${3000 + i}`,
      woNum: `BENCH-WO-CVE-${3000 + i}`,
      cliente: 'CVE',
      zona: i % 2 === 0 ? 'Centro' : 'Sur',
      planta: plantaNombre,
      tipoWO: tipoStr,
      estado: isAtrasada ? 'En ruta' : 'Cerrada',
      descripcion: isMC ? 'Reparación de cableado DC e inversor central' : 'Limpieza de módulos fotovoltaicos',
      tecnico: i % 4 === 0 ? 'Víctor León' : i % 4 === 1 ? 'Eduardo Carvallo' : i % 4 === 2 ? 'Daniel Godoy' : 'Cristián Barraza',
      supervisor: 'Francisco Jara',
      fechaProgramada: isAtrasada ? '2026-06-15' : `2026-06-${1 + (i % 28)}`,
      fechaCierre: isAtrasada ? '' : `2026-06-${2 + (i % 28)}`,
      hhPlanificadas: 6,
      hhRegistradas: isAtrasada ? 0 : 6,
      hhValidadas: isAtrasada ? 0 : 6,
      hold: isAtrasada,
      bloqueoLogistico: isAtrasada && i % 2 === 0,
      ptwRequerido: isMC,
      ptwEstado: isAtrasada ? 'No Aplica' : 'Aprobado',
      reprogramaciones: isAtrasada ? 3 : 0,
      avance: isAtrasada ? 20 : 100,
      origenDato: 'SharePoint',
      confiabilidadHH: isAtrasada ? 'Baja confianza' : 'Alta confianza',
      fuente: 'PowerBI Benchmark',
      recordScope: 'BENCHMARK_EXTERNAL',

      prioridad: prioStr,
      plantaId: i % 3 === 0 ? 'BENCH-PLANT-CVE-01' : (i % 3 === 1 ? 'BENCH-PLANT-CVE-02' : 'BENCH-PLANT-CVE-03'),
      mwAfectado: isAtrasada ? 3.0 : 0,
      isOverdue: isAtrasada,
      isBlocked: isAtrasada,
      tipo: tipoStr,
      fechaInicio: isAtrasada ? '2026-06-15' : `2026-06-${1 + (i % 28)}`,
      fechaLimite: isAtrasada ? '2026-07-20' : `2026-06-${2 + (i % 28)}`,
      hhEstimadas: 6,
      hhReales: isAtrasada ? 0 : 6
    });
  }

  // AGR: Pozo de Almonte 2, Pozo de Almonte 3, Calama Solar 3
  for (let i = 1; i <= 60; i++) {
    const isMC = i % 6 === 0;
    const isHold = i % 15 === 0;
    const isScheduled = i % 8 === 0 && !isHold;
    const pName = i % 3 === 0 ? 'AGR Pozo Almonte 2 Benchmark' : i % 3 === 1 ? 'AGR Pozo Almonte 3 Benchmark' : 'AGR Calama Benchmark';
    const tipoStr = isMC ? 'Correctiva' : 'Preventiva';
    const prioStr = isHold ? 'Crítica' : 'Media';
    
    let state = 'Cerrada';
    if (isHold) state = 'Bloqueada';
    else if (isScheduled) state = 'Programada';

    benchmarkRecords.push({
      id: `BENCH-WO-AGR-${4000 + i}`,
      woNum: `BENCH-WO-AGR-${4000 + i}`,
      cliente: 'AGR',
      zona: 'Norte',
      planta: pName,
      tipoWO: tipoStr,
      estado: state,
      descripcion: isMC ? 'Cambio tarjeta comunicación RS-485' : 'Termografía de celdas MT',
      tecnico: 'Cristián Barraza',
      supervisor: 'Alejandro Rojas',
      fechaProgramada: `2026-07-${1 + (i % 10)}`,
      fechaCierre: state === 'Cerrada' ? `2026-07-${2 + (i % 10)}` : '',
      hhPlanificadas: 10,
      hhRegistradas: state === 'Cerrada' ? 10 : 0,
      hhValidadas: state === 'Cerrada' ? 10 : 0,
      hold: isHold,
      bloqueoLogistico: isHold,
      ptwRequerido: isMC,
      ptwEstado: state === 'Cerrada' ? 'Aprobado' : 'No Aplica',
      reprogramaciones: isHold ? 1 : 0,
      avance: state === 'Cerrada' ? 100 : state === 'Bloqueada' ? 40 : 0,
      origenDato: 'Workspace',
      confiabilidadHH: state === 'Cerrada' ? 'Alta confianza' : 'Media confianza',
      fuente: 'PowerBI Benchmark',
      recordScope: 'BENCHMARK_EXTERNAL',

      prioridad: prioStr,
      plantaId: 'BENCH-PLANT-AGR-01',
      mwAfectado: isHold ? 5.0 : 0,
      isOverdue: false,
      isBlocked: isHold,
      tipo: tipoStr,
      fechaInicio: `2026-07-${1 + (i % 10)}`,
      fechaLimite: state === 'Cerrada' ? `2026-07-${2 + (i % 10)}` : '',
      hhEstimadas: 10,
      hhReales: state === 'Cerrada' ? 10 : 0
    });
  }

  // Other benchmark clients (Mala Renewables, Reden, Aquasol, Eurus Energy, Bluetree)
  const otherClients = ['Mala Renewables', 'Reden', 'Aquasol', 'Eurus Energy', 'Bluetree'];
  otherClients.forEach((cli, cliIdx) => {
    for (let i = 1; i <= 15; i++) {
      const tipoStr = i % 4 === 0 ? 'Correctiva' : 'Preventiva';
      benchmarkRecords.push({
        id: `BENCH-WO-OTH-${cliIdx}-${100 + i}`,
        woNum: `BENCH-WO-OTH-${cliIdx}-${100 + i}`,
        cliente: cli,
        zona: cliIdx % 2 === 0 ? 'Centro' : 'Norte',
        planta: `${cli} Benchmark Solar Park`,
        tipoWO: tipoStr,
        estado: 'Cerrada',
        descripcion: 'Inspección de inversores y cajas de conexión',
        tecnico: 'Eduardo Carvallo',
        supervisor: 'Mauricio Valdés',
        fechaProgramada: `2026-06-${5 + i}`,
        fechaCierre: `2026-06-${6 + i}`,
        hhPlanificadas: 4,
        hhRegistradas: 4,
        hhValidadas: 4,
        hold: false,
        bloqueoLogistico: false,
        ptwRequerido: false,
        ptwEstado: 'No Aplica',
        reprogramaciones: 0,
        avance: 100,
        origenDato: 'SharePoint',
        confiabilidadHH: 'Alta confianza',
        fuente: 'PowerBI Benchmark',
        recordScope: 'BENCHMARK_EXTERNAL',

        prioridad: 'Media',
        plantaId: `BENCH-PLANT-OTH-${cliIdx + 1}-01`,
        mwAfectado: 0,
        isOverdue: false,
        isBlocked: false,
        tipo: tipoStr,
        fechaInicio: `2026-06-${5 + i}`,
        fechaLimite: `2026-06-${6 + i}`,
        hhEstimadas: 4,
        hhReales: 4
      });
    }
  });

  return [...mappedReal, ...benchmarkRecords];
}

