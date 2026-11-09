/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HseCert {
  id: string;
  name: string;
  expirationDate: string; // YYYY-MM-DD
  notes?: string;
}

export type AreaOM = 
  | 'Gerencia'
  | 'Planificación & Control'
  | 'Control Gestión, Calidad & HSE'
  | 'Zona Norte'
  | 'Zona Centro'
  | 'Zona Sur'
  | 'Centro de Control'
  | 'Comisionamiento & MT'
  | 'Limpieza';

export type NivelJerarquico = 1 | 2 | 3 | 4;

export interface Persona {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  area: AreaOM;
  level: NivelJerarquico;
  vehiculo?: string;
  plantas?: string[];
  hseCerts?: HseCert[];
  reportsTo?: string;
  jefaturaDirecta?: string;
  activo?: boolean;
  zona?: 'Norte' | 'Centro' | 'Sur' | 'Todas';
  otActivasCount?: number;
  hhAsignadas?: number;
}

export const INITIAL_ORGANIGRAMA: Persona[] = [
  // --- GERENCIA / HSE ---
  { id: "org-1", name: "Johannes Dietsche", role: "Gerente General", area: "Gerencia", level: 1, phone: "+56911111111", email: "johannes@empresa.cl", jefaturaDirecta: "Directorio", activo: true },
  { id: "org-2", name: "Raúl Serrano", role: "Gerente O&M", area: "Gerencia", level: 1, phone: "+56922222222", email: "raul.serrano@empresa.cl", reportsTo: "org-1", jefaturaDirecta: "Johannes Dietsche", activo: true },
  { 
    id: "org-3", 
    name: "Karla Vera", 
    role: "Jefa HSEQ", 
    area: "Control Gestión, Calidad & HSE", 
    level: 1, 
    phone: "+56933333333",
    email: "karla.vera@empresa.cl",
    reportsTo: "org-1",
    jefaturaDirecta: "Johannes Dietsche",
    activo: true,
    hseCerts: [
      { id: "c-1", name: "Auditor Líder ISO 45001", expirationDate: "2027-08-15", notes: "Certificación Bureau Veritas" },
      { id: "c-2", name: "Prevencionista Sernageomin B", expirationDate: "2029-03-10", notes: "Registro nacional aprobado" }
    ]
  },
  
  // --- CONTROL GESTIÓN & CALIDAD & HSE ---
  { id: "org-4", name: "Vanessa Salinas", role: "Ing. Control de Gestión", area: "Control Gestión, Calidad & HSE", level: 2, reportsTo: "org-3", jefaturaDirecta: "Karla Vera", activo: true },
  { id: "org-5", name: "Carlos Droguett", role: "Ing. Control de Gestión", area: "Control Gestión, Calidad & HSE", level: 2, reportsTo: "org-3", jefaturaDirecta: "Karla Vera", activo: true },
  { id: "org-6", name: "Daniel Taiba", role: "Ingeniero de Desarrollo", area: "Control Gestión, Calidad & HSE", level: 3, reportsTo: "org-4", jefaturaDirecta: "Vanessa Salinas", activo: true },
  { id: "org-7", name: "Renato Bassi", role: "Ingeniero de Datos", area: "Control Gestión, Calidad & HSE", level: 3, reportsTo: "org-4", jefaturaDirecta: "Vanessa Salinas", activo: true },
  { id: "org-8", name: "Matías Escárate", role: "Ingeniero de Calidad", area: "Control Gestión, Calidad & HSE", level: 3, reportsTo: "org-3", jefaturaDirecta: "Karla Vera", activo: true },
  { id: "org-9", name: "José Quiroz", role: "Asistente de Calidad", area: "Control Gestión, Calidad & HSE", level: 4, reportsTo: "org-8", jefaturaDirecta: "Matías Escárate", activo: true },
  { id: "org-10", name: "Frank Soto", role: "Jefe de HSE", area: "Control Gestión, Calidad & HSE", level: 2, reportsTo: "org-3", jefaturaDirecta: "Karla Vera", activo: true },
  { id: "org-11", name: "Rodrigo Gatica", role: "HSE O&M", area: "Control Gestión, Calidad & HSE", level: 3, reportsTo: "org-10", jefaturaDirecta: "Frank Soto", activo: true },

  // --- PLANIFICACIÓN Y CONTROL ---
  { id: "org-12", name: "Daniel Tobar", role: "Jefe Gestión Operacional", area: "Planificación & Control", level: 1, phone: "+56955554444", reportsTo: "org-2", jefaturaDirecta: "Raúl Serrano", activo: true },
  { id: "org-13", name: "Valmore Gutiérrez", role: "Coordinador O&M", area: "Planificación & Control", level: 2, reportsTo: "org-12", jefaturaDirecta: "Daniel Tobar", activo: true },
  { id: "org-14", name: "Ignacio Silva", role: "Coordinador O&M", area: "Planificación & Control", level: 2, reportsTo: "org-12", jefaturaDirecta: "Daniel Tobar", activo: true },
  { id: "org-15", name: "Alfonso Contreras", role: "Coordinador O&M", area: "Planificación & Control", level: 2, reportsTo: "org-12", jefaturaDirecta: "Daniel Tobar", activo: true },
  { id: "org-16", name: "José Pedro", role: "Coordinador O&M", area: "Planificación & Control", level: 2, reportsTo: "org-12", jefaturaDirecta: "Daniel Tobar", activo: true },
  { id: "org-17", name: "Josemaría Valdés", role: "Coordinador O&M", area: "Planificación & Control", level: 2, reportsTo: "org-12", jefaturaDirecta: "Daniel Tobar", activo: true },
  { id: "org-18", name: "Cristobal Reyes", role: "Coordinador O&M", area: "Planificación & Control", level: 2, reportsTo: "org-12", jefaturaDirecta: "Daniel Tobar", activo: true },
  { id: "org-19", name: "Cristóbal Evensen", role: "Analista O&M", area: "Planificación & Control", level: 3, reportsTo: "org-13", jefaturaDirecta: "Valmore Gutiérrez", activo: true },
  { id: "org-20", name: "Ignacio Ribbeck", role: "Analista O&M", area: "Planificación & Control", level: 3, reportsTo: "org-13", jefaturaDirecta: "Valmore Gutiérrez", activo: true },
  { id: "org-21", name: "Gonzalo Caballero", role: "Analista O&M", area: "Planificación & Control", level: 3, reportsTo: "org-14", jefaturaDirecta: "Ignacio Silva", activo: true },
  { id: "org-22", name: "Claudio Flores", role: "Analista O&M", area: "Planificación & Control", level: 3, reportsTo: "org-14", jefaturaDirecta: "Ignacio Silva", activo: true },
  { id: "org-23", name: "(en proceso)", role: "Analista O&M", area: "Planificación & Control", level: 3, reportsTo: "org-15", jefaturaDirecta: "Alfonso Contreras", activo: true },
  { id: "org-24", name: "(en proceso)", role: "Analista O&M", area: "Planificación & Control", level: 3, reportsTo: "org-15", jefaturaDirecta: "Alfonso Contreras", activo: true },

  // --- COMISIONAMIENTO & MEDIA TENSIÓN ---
  { id: "org-25", name: "Felipe Mansilla", role: "Jefe Comisionamiento y Servicio Técnico", area: "Comisionamiento & MT", level: 1, reportsTo: "org-2", jefaturaDirecta: "Raúl Serrano", activo: true },
  { id: "org-26", name: "Dousan Aleu", role: "Ingeniero Comisionamiento", area: "Comisionamiento & MT", level: 3, reportsTo: "org-25", jefaturaDirecta: "Felipe Mansilla", activo: true },
  { id: "org-27", name: "Juan Castillo", role: "Ingeniero Comisionamiento", area: "Comisionamiento & MT", level: 3, reportsTo: "org-25", jefaturaDirecta: "Felipe Mansilla", activo: true },
  { id: "org-28", name: "Hernán Castillo", role: "Ingeniero Comisionamiento", area: "Comisionamiento & MT", level: 3, reportsTo: "org-25", jefaturaDirecta: "Felipe Mansilla", activo: true },
  { id: "org-29", name: "Jorge García", role: "Técnico Comisionamiento", area: "Comisionamiento & MT", level: 3, reportsTo: "org-25", jefaturaDirecta: "Felipe Mansilla", activo: true },
  { id: "org-30", name: "(en proceso)", role: "Técnico Comisionamiento", area: "Comisionamiento & MT", level: 3, reportsTo: "org-25", jefaturaDirecta: "Felipe Mansilla", activo: true },
  { id: "org-31", name: "(en proceso)", role: "Técnico Comisionamiento", area: "Comisionamiento & MT", level: 3, reportsTo: "org-25", jefaturaDirecta: "Felipe Mansilla", activo: true },
  { id: "org-32", name: "(en proceso)", role: "Ingeniero Jefe MT", area: "Comisionamiento & MT", level: 2, reportsTo: "org-25", jefaturaDirecta: "Felipe Mansilla", activo: true },
  { id: "org-33", name: "(en proceso)", role: "Ingeniero MT", area: "Comisionamiento & MT", level: 3, reportsTo: "org-32", jefaturaDirecta: "Ingeniero Jefe MT", activo: true },

  // --- EJECUCIÓN GRUPO TERRENO ---
  { id: "org-34", name: "Alejandro Núñez", role: "Jefe de Terreno", area: "Gerencia", level: 1, phone: "+56944445555", reportsTo: "org-2", jefaturaDirecta: "Raúl Serrano", activo: true },

  // Limpieza
  { id: "org-35", name: "Cristian Quezada", role: "Supervisor O&M Limpieza", area: "Limpieza", level: 2, reportsTo: "org-34", jefaturaDirecta: "Alejandro Núñez", activo: true },
  { id: "org-36", name: "Francisco Cortés", role: "Técnico O&M Limpieza", area: "Limpieza", level: 3, reportsTo: "org-35", jefaturaDirecta: "Cristian Quezada", activo: true },
  { id: "org-37", name: "Felipe Elorres", role: "Técnico O&M Limpieza", area: "Limpieza", level: 3, reportsTo: "org-35", jefaturaDirecta: "Cristian Quezada", activo: true },
  { id: "org-38", name: "José Velásquez", role: "Técnico O&M Limpieza", area: "Limpieza", level: 3, reportsTo: "org-35", jefaturaDirecta: "Cristian Quezada", activo: true },
  { id: "org-39", name: "Leonardo Ponce", role: "Técnico O&M Limpieza", area: "Limpieza", level: 3, reportsTo: "org-35", jefaturaDirecta: "Cristian Quezada", activo: true },

  // Zona Norte
  { id: "org-40", name: "Jesús Blanco", role: "Supervisor de Terreno O&M", area: "Zona Norte", level: 2, phone: "+56966667777", vehiculo: "KTSW99", plantas: ["Alianza", "Chinchorro", "PMG Castilla", "San Isidro"], reportsTo: "org-34", jefaturaDirecta: "Alejandro Núñez", activo: true, zona: "Norte" },
  { id: "org-41", name: "César Cruz", role: "Ingeniero O&M Calama", area: "Zona Norte", level: 3, phone: "+56912345601", reportsTo: "org-40", jefaturaDirecta: "Jesús Blanco", activo: true, zona: "Norte" },
  { id: "org-42", name: "Yerko Santos", role: "Técnico O&M Arica", area: "Zona Norte", level: 3, reportsTo: "org-40", jefaturaDirecta: "Jesús Blanco", activo: true, zona: "Norte" },
  { id: "org-43", name: "Víctor Maturana", role: "Técnico O&M Salamanca", area: "Zona Norte", level: 3, reportsTo: "org-40", jefaturaDirecta: "Jesús Blanco", activo: true, zona: "Norte" },
  { id: "org-44", name: "Carlos Ruiz", role: "Técnico O&M Melipilla (Norte)", area: "Zona Norte", level: 3, reportsTo: "org-40", jefaturaDirecta: "Jesús Blanco", activo: true, zona: "Norte" },
  { id: "org-45", name: "Yunel Alquinta", role: "Técnico O&M Copiapó", area: "Zona Norte", level: 3, phone: "+56912345602", reportsTo: "org-40", jefaturaDirecta: "Jesús Blanco", activo: true, zona: "Norte" },
  { id: "org-46", name: "José Zúñiga", role: "Ingeniero O&M Quillota", area: "Zona Norte", level: 3, reportsTo: "org-40", jefaturaDirecta: "Jesús Blanco", activo: true, zona: "Norte" },
  { id: "org-47", name: "Jaime Leiva", role: "Técnico O&M Pozo", area: "Zona Norte", level: 3, reportsTo: "org-40", jefaturaDirecta: "Jesús Blanco", activo: true, zona: "Norte" },
  { id: "org-48", name: "Ricardo Rivas", role: "Técnico O&M Pozo", area: "Zona Norte", level: 3, reportsTo: "org-40", jefaturaDirecta: "Jesús Blanco", activo: true, zona: "Norte" },
  { id: "org-49", name: "Daniel Carrero", role: "Técnico O&M Ovalle", area: "Zona Norte", level: 3, reportsTo: "org-40", jefaturaDirecta: "Jesús Blanco", activo: true, zona: "Norte" },
  { id: "org-50", name: "(en proceso)", role: "Especialista O&M Iquique", area: "Zona Norte", level: 3, reportsTo: "org-40", jefaturaDirecta: "Jesús Blanco", activo: true, zona: "Norte" },

  // Zona Centro
  { id: "org-51", name: "Raynier Quintero", role: "Supervisor de Terreno O&M", area: "Zona Centro", level: 2, phone: "+56977778888", vehiculo: "XYZ123", plantas: ["Manao", "Marchigue", "La Esperanza"], reportsTo: "org-34", jefaturaDirecta: "Alejandro Núñez", activo: true, zona: "Centro" },
  { id: "org-52", name: "Patricio Melendes", role: "Técnico O&M Marchigüe", area: "Zona Centro", level: 3, reportsTo: "org-51", jefaturaDirecta: "Raynier Quintero", activo: true, zona: "Centro" },
  { id: "org-53", name: "Esteban Carrasco", role: "Técnico O&M Rancagua", area: "Zona Centro", level: 3, vehiculo: "JKL456", plantas: ["Trebo", "Rimini", "Tricahue"], reportsTo: "org-51", jefaturaDirecta: "Raynier Quintero", activo: true, zona: "Centro" },
  { id: "org-54", name: "(en proceso)", role: "Técnico O&M S. Fernando", area: "Zona Centro", level: 3, reportsTo: "org-51", jefaturaDirecta: "Raynier Quintero", activo: true, zona: "Centro" },
  { id: "org-55", name: "Rodrigo Cisterna", role: "Técnico O&M Santiago", area: "Zona Centro", level: 3, reportsTo: "org-51", jefaturaDirecta: "Raynier Quintero", activo: true, zona: "Centro" },
  { id: "org-56", name: "Víctor León", role: "Ingeniero O&M Rancagua", area: "Zona Centro", level: 3, vehiculo: "ABCD11", plantas: ["CVE Esfena", "CVE Liquidambar", "CVE Quinantu", "San Antonio (La Ballica)"], reportsTo: "org-51", jefaturaDirecta: "Raynier Quintero", activo: true, zona: "Centro" },
  { id: "org-57", name: "(en proceso)", role: "Técnico O&M Melipilla", area: "Zona Centro", level: 3, reportsTo: "org-51", jefaturaDirecta: "Raynier Quintero", activo: true, zona: "Centro" },
  { id: "org-58", name: "Jhon Didier Delgado", role: "Ingeniero O&M Curicó", area: "Zona Centro", level: 3, reportsTo: "org-51", jefaturaDirecta: "Raynier Quintero", activo: true, zona: "Centro" },
  { id: "org-59", name: "César Salazar", role: "Técnico O&M Santiago", area: "Zona Centro", level: 3, reportsTo: "org-51", jefaturaDirecta: "Raynier Quintero", activo: true, zona: "Centro" },
  { id: "org-60", name: "Camilo Maldonado", role: "Especialista O&M Melipilla", area: "Zona Centro", level: 3, reportsTo: "org-51", jefaturaDirecta: "Raynier Quintero", activo: true, zona: "Centro" },

  // Zona Sur
  { id: "org-61", name: "Nivardo Chacín", role: "Supervisor de Terreno O&M", area: "Zona Sur", level: 2, phone: "+56988889999", reportsTo: "org-34", jefaturaDirecta: "Alejandro Núñez", activo: true, zona: "Sur" },
  { id: "org-62", name: "Nicolás Fuentes", role: "Ingeniero O&M Chillán", area: "Zona Sur", level: 3, vehiculo: "FTRD88", plantas: ["Pellin", "Ravenna I & II", "Blu (San Nicolas)"], reportsTo: "org-61", jefaturaDirecta: "Nivardo Chacín", activo: true, zona: "Sur" },
  { id: "org-63", name: "Alejandro Mena", role: "Ingeniero O&M Cauquenes", area: "Zona Sur", level: 3, reportsTo: "org-61", jefaturaDirecta: "Nivardo Chacín", activo: true, zona: "Sur" },
  { id: "org-64", name: "Hermes Sánchez", role: "Técnico O&M Chillán", area: "Zona Sur", level: 3, reportsTo: "org-61", jefaturaDirecta: "Nivardo Chacín", activo: true, zona: "Sur" },
  { id: "org-65", name: "Iván Candia", role: "Técnico O&M Chillán", area: "Zona Sur", level: 3, reportsTo: "org-61", jefaturaDirecta: "Nivardo Chacín", activo: true, zona: "Sur" },
  { id: "org-66", name: "José León", role: "Técnico O&M S. Clemente", area: "Zona Sur", level: 3, reportsTo: "org-61", jefaturaDirecta: "Nivardo Chacín", activo: true, zona: "Sur" },
  { id: "org-67", name: "Patricio Castro", role: "Técnico O&M Talca", area: "Zona Sur", level: 3, reportsTo: "org-61", jefaturaDirecta: "Nivardo Chacín", activo: true, zona: "Sur" },
  { id: "org-68", name: "Cristian Sánchez", role: "Ingeniero O&M L. Ángeles", area: "Zona Sur", level: 3, reportsTo: "org-61", jefaturaDirecta: "Nivardo Chacín", activo: true, zona: "Sur" },
  { id: "org-69", name: "Pablo Pinilla", role: "Especialista O&M Chillán", area: "Zona Sur", level: 3, reportsTo: "org-61", jefaturaDirecta: "Nivardo Chacín", activo: true, zona: "Sur" },

  // Centro de Control
  { id: "org-70", name: "Yaser García", role: "Supervisor Centro de Control", area: "Centro de Control", level: 2, phone: "+56966463677", reportsTo: "org-12", jefaturaDirecta: "Daniel Tobar", activo: true },
  { id: "org-71", name: "Matías Berríos", role: "Op. Centro Control Diurno", area: "Centro de Control", level: 4, phone: "+56999998881", reportsTo: "org-70", jefaturaDirecta: "Yaser García", activo: true },
  { id: "org-72", name: "Manuel Fernández", role: "Op. Centro Control Diurno", area: "Centro de Control", level: 4, phone: "+56999998882", reportsTo: "org-70", jefaturaDirecta: "Yaser García", activo: true },
  { id: "org-73", name: "Esteban Contreras", role: "Op. Centro Control Diurno", area: "Centro de Control", level: 4, phone: "+56999998883", reportsTo: "org-70", jefaturaDirecta: "Yaser García", activo: true },
  { id: "org-74", name: "Hans Meder", role: "Op. Centro Control Diurno", area: "Centro de Control", level: 4, phone: "+56999998884", reportsTo: "org-70", jefaturaDirecta: "Yaser García", activo: true },
  { id: "org-75", name: "José Inostroza", role: "Op. Centro Control Nocturno", area: "Centro de Control", level: 4, phone: "+56999998885", reportsTo: "org-70", jefaturaDirecta: "Yaser García", activo: true },
  { id: "org-76", name: "Lesme Alarcón", role: "Op. Centro Control Nocturno", area: "Centro de Control", level: 4, phone: "+56999998886", reportsTo: "org-70", jefaturaDirecta: "Yaser García", activo: true }
];

export interface ValidationReport {
  duplicateIds: string[];
  missingIdsCount: number;
  invalidSuperiorRefs: string[];
  circularRefs: string[];
  selfSuperiorRefs: string[];
  invalidAreas: string[];
  invalidLevels: string[];
  unmatchedPlants: string[];
  missingNameOrRole: string[];
  rootNodesCount: number;
  isValid: boolean;
}

const VALID_AREAS: AreaOM[] = [
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

/**
 * Validates the organigrama structure against 10 strict criteria:
 * 1. Duplicate IDs
 * 2. Personas without ID
 * 3. References to non-existent superiors
 * 4. Circular hierarchy relations
 * 5. Personas assigned as their own superior
 * 6. Non-existent areas
 * 7. Invalid hierarchical levels
 * 8. Assigned plants that do not exist in Matriz de Plantas
 * 9. Personas without area or role
 * 10. Existence of one or more valid root nodes
 */
export function validateAndCleanOrganigrama(
  data: Persona[],
  validPlantNames?: string[]
): { cleanData: Persona[]; report: ValidationReport } {
  const report: ValidationReport = {
    duplicateIds: [],
    missingIdsCount: 0,
    invalidSuperiorRefs: [],
    circularRefs: [],
    selfSuperiorRefs: [],
    invalidAreas: [],
    invalidLevels: [],
    unmatchedPlants: [],
    missingNameOrRole: [],
    rootNodesCount: 0,
    isValid: true
  };

  const idMap = new Map<string, Persona>();
  const seenIds = new Set<string>();

  data.forEach((p, idx) => {
    // 2. Missing ID check
    if (!p.id) {
      report.missingIdsCount++;
      p.id = `generated-id-${idx}-${Date.now()}`;
    }

    // 1. Duplicate ID check
    if (seenIds.has(p.id)) {
      report.duplicateIds.push(p.id);
    } else {
      seenIds.add(p.id);
    }
    idMap.set(p.id, p);

    // 9. Missing name or role
    if (!p.name || !p.role) {
      report.missingNameOrRole.push(p.id);
    }

    // 6. Invalid area
    if (!VALID_AREAS.includes(p.area)) {
      report.invalidAreas.push(`${p.id}: ${p.area}`);
    }

    // 7. Invalid level
    if (![1, 2, 3, 4].includes(p.level)) {
      report.invalidLevels.push(`${p.id}: level ${p.level}`);
    }

    // 5. Self superior
    if (p.reportsTo && p.reportsTo === p.id) {
      report.selfSuperiorRefs.push(p.id);
      p.reportsTo = undefined;
    }

    // 8. Assigned plants check
    if (p.plantas && validPlantNames && validPlantNames.length > 0) {
      p.plantas.forEach(plant => {
        const match = validPlantNames.some(
          vp => vp.toLowerCase().includes(plant.toLowerCase()) || plant.toLowerCase().includes(vp.toLowerCase())
        );
        if (!match) {
          report.unmatchedPlants.push(`${p.name} -> ${plant}`);
        }
      });
    }
  });

  // 3. Check invalid superior references & circular references & count roots
  data.forEach(p => {
    if (!p.reportsTo) {
      report.rootNodesCount++;
    } else {
      const superior = idMap.get(p.reportsTo);
      if (!superior) {
        report.invalidSuperiorRefs.push(`${p.id} reportsTo non-existent ${p.reportsTo}`);
      } else {
        // Detect circular dependency
        let curr: Persona | undefined = superior;
        const visited = new Set<string>([p.id]);
        while (curr) {
          if (visited.has(curr.id)) {
            report.circularRefs.push(`${p.id} <-> ${curr.id}`);
            p.reportsTo = undefined; // break circle safely
            break;
          }
          visited.add(curr.id);
          curr = curr.reportsTo ? idMap.get(curr.reportsTo) : undefined;
        }
      }
    }
  });

  if (
    report.duplicateIds.length > 0 ||
    report.missingIdsCount > 0 ||
    report.invalidSuperiorRefs.length > 0 ||
    report.circularRefs.length > 0 ||
    report.selfSuperiorRefs.length > 0 ||
    report.invalidAreas.length > 0 ||
    report.invalidLevels.length > 0 ||
    report.rootNodesCount === 0
  ) {
    report.isValid = false;
  }

  return { cleanData: data, report };
}

// Persistencia en localStorage
export const loadOrganigramaFromStorage = (): Persona[] => {
  if (typeof window === 'undefined') return INITIAL_ORGANIGRAMA;

  try {
    const saved = localStorage.getItem('orbi-organigrama') || localStorage.getItem('orbi-personnel-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error al cargar orbi-organigrama de localStorage:', err);
  }
  return INITIAL_ORGANIGRAMA;
};

export const saveOrganigramaToStorage = (data: Persona[]): void => {
  if (typeof window === 'undefined') return;

  try {
    const json = JSON.stringify(data);
    localStorage.setItem('orbi-organigrama', json);
    localStorage.setItem('orbi-personnel-state', json);
    // Sync with legacy key if present
    localStorage.setItem('orbi_om_db_organigrama', json);
  } catch (err) {
    console.error('Error al guardar orbi-organigrama en localStorage:', err);
  }
};

export const resetOrganigramaToDefault = (): Persona[] => {
  if (typeof window === 'undefined') return INITIAL_ORGANIGRAMA;

  try {
    const json = JSON.stringify(INITIAL_ORGANIGRAMA);
    localStorage.setItem('orbi-organigrama', json);
    localStorage.setItem('orbi-personnel-state', json);
    localStorage.setItem('orbi_om_db_organigrama', json);
  } catch (err) {
    console.error('Error al resetear orbi-organigrama:', err);
  }
  return INITIAL_ORGANIGRAMA;
};
