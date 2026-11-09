import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sliders, 
  Database, 
  Search, 
  X, 
  PlusCircle, 
  Navigation, 
  Radio, 
  Check, 
  Edit2, 
  Trash2, 
  MapPin, 
  Compass, 
  Activity, 
  Clock, 
  Wrench, 
  ShieldAlert,
  Car,
  ChevronRight,
  UserCheck,
  Building2,
  FileText,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Award
} from "lucide-react";

import { 
  Vehiculo, 
  MantenimientoVehiculo, 
  loadFleetMasterVehicles, 
  INITIAL_VEHICLE_MAINTENANCE, 
  getVehicleDocumentsAlerts 
} from "../utils/fleet";

import { getActiveRole } from "../../../data/db";

export default function OrbiFleetStandaloneShell({ userRole: propUserRole }: { userRole?: string } = {}) {
  const activeRole = propUserRole || getActiveRole();
  const todayISO = new Date().toISOString().split('T')[0];

  // Vehicles initialized via idempotent master database loader
  const [vehicles, setVehicles] = useState<Vehiculo[]>(() => {
    return loadFleetMasterVehicles();
  });

  const [maintenances, setMaintenances] = useState<MantenimientoVehiculo[]>(() => {
    try {
      const stored = localStorage.getItem("orbi_fleet_standalone_maintenances");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to read standalone maintenances:", e);
    }
    return INITIAL_VEHICLE_MAINTENANCE;
  });

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [providerFilter, setProviderFilter] = useState<string>("All");
  const [zoneFilter, setZoneFilter] = useState<string>("All");
  const [qualityFilter, setQualityFilter] = useState<string>("All");
  const [devOnlyFilter, setDevOnlyFilter] = useState<boolean>(false);

  // Forms states
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehiculo>>({
    fleet_id: "",
    plate_display: "",
    patente: "",
    brand: "Toyota",
    marca: "Toyota",
    model: "Hilux 4x4",
    modelo: "Hilux 4x4",
    ano: 2024,
    color: "Blanco Minero",
    kilometraje: 0,
    vencimientoPermiso: "2027-03-31",
    vencimientoRevision: "2026-11-15",
    vencimientoSeguro: "2027-03-31",
    zona: "Centro",
    conductor: "",
    asignadoA: ""
  });

  const [isAddingMaint, setIsAddingMaint] = useState(false);
  const [newMaint, setNewMaint] = useState<Partial<MantenimientoVehiculo>>({
    patente: "",
    fecha: new Date().toISOString().split("T")[0],
    tipo: "Preventivo",
    km: 0,
    responsable: "",
    descripcion: ""
  });

  // GPS Sync settings (SANDBOX MODE ONLY)
  const [isGpsLinked, setIsGpsLinked] = useState(false);
  const [isGpsConnecting, setIsGpsConnecting] = useState(false);
  const [gpsProvider, setGpsProvider] = useState("Proveedor Enlace Sandbox SIM");
  const [gpsApiKey, setGpsApiKey] = useState("SANDBOX-TOKEN-NO-OPERATIVO");
  const [gpsApiResponseLog, setGpsApiResponseLog] = useState<any>(null);

  // Editing mileage inline
  const [editingKmPatente, setEditingKmPatente] = useState<string | null>(null);
  const [editingKmValue, setEditingKmValue] = useState<number>(0);

  // Selected vehicle for detail view
  const [selectedVehicle, setSelectedVehicle] = useState<Vehiculo | null>(null);

  // Detail Modal Tab
  const [detailTab, setDetailTab] = useState<'id' | 'assign' | 'leasing' | 'delivery' | 'maint' | 'docs' | 'gps'>('id');

  // Set default selected vehicle once loaded
  useEffect(() => {
    if (!selectedVehicle && vehicles.length > 0) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles]);

  // Notifications
  const [showNotification, setShowNotification] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const triggerNotification = (text: string, type: "success" | "info" | "error" = "success") => {
    setShowNotification({ text, type });
    setTimeout(() => setShowNotification(null), 4000);
  };

  // Persist vehicles to localStorage
  useEffect(() => {
    localStorage.setItem("orbi_fleet_standalone_vehicles", JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem("orbi_fleet_standalone_maintenances", JSON.stringify(maintenances));
  }, [maintenances]);

  // GPS Simulation Trigger (SANDBOX strictly)
  const handleToggleGps = async () => {
    setIsGpsConnecting(true);
    setGpsApiResponseLog(null);
    
    const nextLinkedState = !isGpsLinked;

    setTimeout(() => {
      try {
        if (nextLinkedState) {
          setIsGpsLinked(true);
          setGpsApiResponseLog({
            success: true,
            mode: "sandbox-active",
            message: `¡Simulación GPS Sandbox Activada! Telemetría simulada cargada para las 28 camionetas de la base canónica.`,
            details: {
              responseTimeMs: 120,
              satellitesLocked: 14,
              protocol: "Prot-SANDBOX-SIM-v1",
              gpsQuality: "Sandbox Simulation Mode (No Real GPS)"
            }
          });
          triggerNotification(`Enlace Sandbox GPS activo`, "success");

          setVehicles(prev => prev.map(v => {
            let lat = -33.45;
            let lng = -70.66;
            let speed = 35 + Math.floor(Math.random() * 45);
            let heading = "Norte";
            let locationDesc = "Ruta 5 Sur - Tránsito Terreno";

            if (v.zona === "Norte") {
              lat = -23.65 + (Math.random() * 2);
              lng = -70.40 - (Math.random() * 1);
              locationDesc = "Ruta 5 Norte - Tramo Copiapó/Calama";
              heading = "Norte";
            } else if (v.zona === "Centro" || v.zona === "Centro (Lavado)") {
              lat = -33.04 + (Math.random() * 1);
              lng = -71.37 - (Math.random() * 0.5);
              locationDesc = "Zona Central - Acceso Planta Solar";
              heading = "Este";
            } else {
              lat = -36.62 - (Math.random() * 1);
              lng = -72.11 - (Math.random() * 0.5);
              locationDesc = "Zona Sur - Tramo Parral/Chillán";
              heading = "Sur";
            }

            return {
              ...v,
              gpsConnected: true,
              gpsProvider: gpsProvider,
              latitude: lat,
              longitude: lng,
              speedKmh: speed,
              heading: heading,
              lastLocationName: locationDesc
            };
          }));
        } else {
          setIsGpsLinked(false);
          setGpsApiResponseLog({
            success: true,
            message: "Simulación Sandbox GPS pausada por el operador."
          });
          triggerNotification("Enlace Sandbox GPS desvinculado", "info");

          setVehicles(prev => prev.map(v => ({
            ...v,
            gpsConnected: false,
            speedKmh: 0,
            heading: "N/A",
            lastLocationName: "Enlace GPS Desactivado (Sandbox)"
          })));
        }
      } catch (err: any) {
        setGpsApiResponseLog({
          success: false,
          message: `Error en Gateway Sandbox: ${err.message}`
        });
        setIsGpsLinked(false);
      } finally {
        setIsGpsConnecting(false);
      }
    }, 1000);
  };

  // Restore factory canonical master database
  const handleResetToFactory = () => {
    if (window.confirm("¿Desea restablecer la base de datos canónica de Flota ORBI (28 asignaciones)? Se revertirán los cambios locales de esta sesión.")) {
      localStorage.removeItem("orbi_fleet_standalone_vehicles");
      const masterList = loadFleetMasterVehicles();
      setVehicles(masterList);
      setMaintenances(INITIAL_VEHICLE_MAINTENANCE);
      setIsGpsLinked(false);
      setGpsApiResponseLog(null);
      setSelectedVehicle(masterList[0] || null);
      triggerNotification("Base de datos de Flota canónica restablecida (28 vehículos)", "info");
    }
  };

  // Filter logic matching canonical specs
  const filteredVehicles = vehicles.filter(v => {
    const q = searchQuery.toLowerCase().trim();
    const plateDisp = (v.plate_display || v.patente || "").toLowerCase();
    const plateNorm = (v.plate || v.patente || "").toLowerCase().replace(/-/g, "");
    const brandStr = (v.brand || v.marca || "").toLowerCase();
    const modelStr = (v.model || v.modelo || "").toLowerCase();
    const assigneeStr = (v.assignment?.assignee || v.asignadoA || v.conductor || "").toLowerCase();
    const fleetIdStr = (v.fleet_id || "").toLowerCase();
    const companyStr = (v.leasing?.company || "").toLowerCase();

    const matchesSearch = 
      !q ||
      plateDisp.includes(q) ||
      plateNorm.includes(q) ||
      brandStr.includes(q) ||
      modelStr.includes(q) ||
      assigneeStr.includes(q) ||
      fleetIdStr.includes(q) ||
      companyStr.includes(q);
    
    // Status Filter
    const currentStatus = v.assignment?.status || v.estado || "Asignado";
    const matchesStatus = statusFilter === "All" || currentStatus === statusFilter;

    // Provider Filter
    const currentProvider = v.leasing?.company || "Econorent";
    const matchesProvider = providerFilter === "All" || currentProvider === providerFilter;

    // Zone Filter
    const currentZone = v.assignment?.zone || v.zona || "Centro";
    const matchesZone = zoneFilter === "All" || currentZone === zoneFilter;

    // Quality Filter
    const currentQuality = v.data_quality || "Enriquecida";
    const matchesQuality = qualityFilter === "All" || currentQuality === qualityFilter;

    // Return required toggle
    const requiresReturn = v.replacement?.return_required === true;
    const matchesDev = !devOnlyFilter || requiresReturn;

    return matchesSearch && matchesStatus && matchesProvider && matchesZone && matchesQuality && matchesDev;
  });

  // Global fleet metrics calculations
  const totalVehicles = vehicles.length;
  const assignedCount = vehicles.filter(v => (v.assignment?.status || v.estado) === "Asignado").length;
  const pendingDeliveryCount = vehicles.filter(v => (v.assignment?.status || v.estado) === "Pendiente entrega").length;
  const pendingPlateCount = vehicles.filter(v => (v.assignment?.status || v.estado) === "Pendiente patente").length;
  const returnRequiredCount = vehicles.filter(v => v.replacement?.return_required === true).length;
  
  const econorentCount = vehicles.filter(v => (v.leasing?.company) === "Econorent").length;
  const gamaCount = vehicles.filter(v => (v.leasing?.company) === "Gama Leasing").length;

  const enrichedCount = vehicles.filter(v => (v.data_quality || "Enriquecida") === "Enriquecida").length;
  const criticalDocsCount = vehicles.filter(v => getVehicleDocumentsAlerts(v).alerts.length > 0).length;
  const activeGpsCount = isGpsLinked ? vehicles.filter(v => v.gpsConnected).length : 0;
  const totalMileage = vehicles.reduce((acc, v) => acc + (v.odometer_km_last_known || v.kilometraje || 0), 0);

  // Active vehicle state resolution for detail view
  const activeSelectedVehicle = selectedVehicle 
    ? (vehicles.find(v => (v.fleet_id && v.fleet_id === selectedVehicle.fleet_id) || v.patente === selectedVehicle.patente) || selectedVehicle) 
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Persistent Sandbox Warning Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl flex items-center justify-between gap-3 font-mono text-xs shadow-lg">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="font-bold uppercase tracking-wide truncate">
            MODULO 13B — SANDBOX — GPS SIMULADO — SIN GEOLOCALIZACIÓN REAL — NO OPERATIVO
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-mono">
            BASE CANÓNICA: 28 REGISTROS
          </span>
          <span className="text-[10px] text-amber-400/80 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase hidden sm:inline font-mono">
            NON-OPERATIONAL
          </span>
        </div>
      </div>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 font-sans text-xs ${
              showNotification.type === "success" 
                ? "bg-teal-950/90 border-teal-500/40 text-teal-300"
                : showNotification.type === "error"
                  ? "bg-red-950/90 border-red-500/40 text-red-300"
                  : "bg-zinc-900/95 border-zinc-750 text-zinc-300"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              showNotification.type === "success" ? "bg-teal-400" : showNotification.type === "error" ? "bg-red-400" : "bg-zinc-400"
            } animate-pulse`} />
            <p className="font-semibold">{showNotification.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Corporate branding */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-850 pb-6 text-left">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest block">
              ORBI COMMANDER CENTER — FLOTA Y LOGÍSTICA TERRENO
            </span>
            <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              v1.0 MASTER DB
            </span>
          </div>
          <h1 className="text-2xl font-bold font-sans text-white tracking-tight flex items-center gap-2 mt-1">
            <Truck size={24} className="text-teal-400" />
            ORBI Fleet Master Database
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl font-sans leading-relaxed">
            Gestión canónica de la flota de vehículos O&M (28 asignaciones). Trazabilidad de proveedores leasing (Econorent / Gama), actas de entrega, reemplazos, control de odómetros, checklist operativo y estado documental legal.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleResetToFactory}
            className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-zinc-950 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
            title="Restablecer base de datos canónica de 28 vehículos"
          >
            <RotateCcw size={11} />
            RESTABLECER (28 VEHÍCULOS)
          </button>
          <button
            onClick={() => setIsAddingMaint(!isAddingMaint)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Wrench size={11} className="text-amber-500" />
            + REGISTRAR MANTENCIÓN
          </button>
          <button
            onClick={() => setIsAddingVehicle(!isAddingVehicle)}
            className="px-3 py-1.5 bg-teal-500/15 border border-teal-500/30 text-teal-400 hover:bg-teal-500 hover:text-zinc-950 hover:border-transparent text-[10px] font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle size={11} />
            {isAddingVehicle ? "CERRAR FORMULARIO" : "REGISTRAR CAMIONETA"}
          </button>
        </div>
      </div>

      {/* Executive Metrics Strips Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-850 p-3.5 rounded-xl text-left space-y-1">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] font-mono uppercase tracking-wider block font-bold">Total Asignaciones</span>
            <Layers size={13} className="text-teal-400" />
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold font-sans text-white">{totalVehicles}</span>
            <span className="text-[9px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded font-bold">100% CANÓNICO</span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-850 p-3.5 rounded-xl text-left space-y-1">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] font-mono uppercase tracking-wider block font-bold">Asignadas Activas</span>
            <CheckCircle2 size={13} className="text-emerald-400" />
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold font-sans text-emerald-400">{assignedCount}</span>
            <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
              {((assignedCount / totalVehicles) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-850 p-3.5 rounded-xl text-left space-y-1">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] font-mono uppercase tracking-wider block font-bold">Pendientes Entrega/Patente</span>
            <Clock size={13} className="text-amber-400" />
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold font-sans text-amber-400">{pendingDeliveryCount + pendingPlateCount}</span>
            <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">
              {pendingDeliveryCount} Ent. / {pendingPlateCount} Pat.
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-850 p-3.5 rounded-xl text-left space-y-1">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] font-mono uppercase tracking-wider block font-bold">Proveedores Leasing</span>
            <Building2 size={13} className="text-blue-400" />
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold font-sans text-blue-400">2</span>
            <span className="text-[9px] font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded font-bold">
              {econorentCount} Econ. / {gamaCount} Gama
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-850 p-3.5 rounded-xl text-left space-y-1 col-span-2 md:col-span-1">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] font-mono uppercase tracking-wider block font-bold">Devolución Requerida</span>
            <RotateCcw size={13} className="text-purple-400" />
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold font-sans text-purple-400">{returnRequiredCount}</span>
            <span className="text-[9px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded font-bold uppercase">
              REEMPLAZO
            </span>
          </div>
        </div>
      </div>

      {/* Forms Section (AnimatePresence) */}
      <AnimatePresence>
        {isAddingVehicle && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900 border border-teal-500/30 rounded-xl p-4 space-y-3 text-left shadow-xl">
              <span className="text-[11px] font-mono font-black text-teal-400 block uppercase">Registrar Nueva Camioneta en la Base Canónica</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-sans">
                <div>
                  <label className="text-zinc-500 block mb-1 font-mono">ID Flota (ej. FLEET-CH-029):</label>
                  <input 
                    type="text" 
                    placeholder="FLEET-CH-029" 
                    value={newVehicle.fleet_id}
                    onChange={(e) => setNewVehicle(prev => ({...prev, fleet_id: e.target.value.toUpperCase()}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 font-mono focus:outline-none focus:border-teal-500/40"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1 font-mono">Patente Visual (ej. VVBP-62):</label>
                  <input 
                    type="text" 
                    placeholder="VVBP-62 o PENDIENTE" 
                    value={newVehicle.plate_display}
                    onChange={(e) => setNewVehicle(prev => ({...prev, plate_display: e.target.value.toUpperCase(), patente: e.target.value.toUpperCase()}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 font-mono focus:outline-none focus:border-teal-500/40"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Marca / Modelo:</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Toyota Hilux 4x4" 
                    value={newVehicle.brand}
                    onChange={(e) => setNewVehicle(prev => ({...prev, brand: e.target.value, marca: e.target.value}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-teal-500/40"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Proveedor Leasing:</label>
                  <select 
                    value={newVehicle.leasing?.company || "Econorent"}
                    onChange={(e) => setNewVehicle(prev => ({...prev, leasing: { ...prev.leasing, company: e.target.value as any, contract_reference: null, start_date: null, end_date: null, term_months: 36, monthly_uf: 24.5, contract_status: "Vigente" }}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-300 font-mono focus:outline-none focus:border-teal-500/40 cursor-pointer"
                  >
                    <option value="Econorent">Econorent</option>
                    <option value="Gama Leasing">Gama Leasing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-sans">
                <div>
                  <label className="text-zinc-500 block mb-1">Conductor / Asignado a:</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Víctor León" 
                    value={newVehicle.conductor}
                    onChange={(e) => setNewVehicle(prev => ({...prev, conductor: e.target.value, asignadoA: e.target.value}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-teal-500/40"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Zona Territorial:</label>
                  <select 
                    value={newVehicle.zona}
                    onChange={(e) => setNewVehicle(prev => ({...prev, zona: e.target.value as any}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-300 font-mono focus:outline-none focus:border-teal-500/40 cursor-pointer"
                  >
                    <option value="Sur">Sur</option>
                    <option value="Centro">Centro</option>
                    <option value="Norte">Norte</option>
                    <option value="Centro (Lavado)">Centro (Lavado)</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Estado Asignación:</label>
                  <select 
                    value={newVehicle.estado}
                    onChange={(e) => setNewVehicle(prev => ({...prev, estado: e.target.value as any}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-300 font-mono focus:outline-none focus:border-teal-500/40 cursor-pointer"
                  >
                    <option value="Asignado">Asignado</option>
                    <option value="Pendiente entrega">Pendiente entrega</option>
                    <option value="Pendiente patente">Pendiente patente</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Kilometraje Inicial:</label>
                  <input 
                    type="number" 
                    value={newVehicle.kilometraje}
                    onChange={(e) => setNewVehicle(prev => ({...prev, kilometraje: Number(e.target.value), odometer_km_last_known: Number(e.target.value)}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 font-mono focus:outline-none focus:border-teal-500/40"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs font-mono pt-2 border-t border-zinc-850">
                <button onClick={() => setIsAddingVehicle(false)} className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg cursor-pointer">CANCELAR</button>
                <button 
                  onClick={() => {
                    const dispPlate = newVehicle.plate_display || newVehicle.patente || "PENDIENTE";
                    const normPlate = dispPlate.replace(/-/g, "").toUpperCase();
                    const fid = newVehicle.fleet_id || `FLEET-CH-${String(vehicles.length + 1).padStart(3, '0')}`;

                    const freshV: Vehiculo = {
                      fleet_id: fid,
                      portfolio: "Chile O&M",
                      patente: dispPlate,
                      plate: normPlate === "PENDIENTE" ? null : normPlate,
                      plate_display: dispPlate,
                      brand: newVehicle.brand || "Toyota",
                      marca: newVehicle.brand || "Toyota",
                      model: newVehicle.model || "Hilux 4x4",
                      modelo: newVehicle.model || "Hilux 4x4",
                      vehicle_type: "Pick-Up 4x4",
                      drive: "4x4",
                      fuel: "Diésel",
                      conductor: newVehicle.conductor || "Sin asignar",
                      asignadoA: newVehicle.conductor || "Sin asignar",
                      personalAsociado: [newVehicle.conductor || "Técnico O&M"],
                      zona: newVehicle.zona || "Centro",
                      estado: newVehicle.estado || "Asignado",
                      kilometraje: newVehicle.kilometraje || 0,
                      odometer_km_last_known: newVehicle.kilometraje || 0,
                      odometer_date: todayISO,
                      assignment: {
                        assignee: newVehicle.conductor || "Sin asignar",
                        zone: newVehicle.zona || "Centro",
                        base_city: newVehicle.zona === "Norte" ? "Copiapó" : newVehicle.zona === "Sur" ? "Chillán" : "Santiago",
                        status: (newVehicle.estado as any) || "Asignado"
                      },
                      leasing: {
                        company: (newVehicle.leasing?.company as any) || "Econorent",
                        contract_reference: `CTR-${Math.floor(Math.random()*9000)+1000}`,
                        start_date: "2025-01-01",
                        end_date: "2028-01-01",
                        term_months: 36,
                        monthly_uf: 24.5,
                        contract_status: "Vigente"
                      },
                      delivery: {
                        date: todayISO,
                        status: newVehicle.estado === "Pendiente entrega" ? "Pendiente" : "Entregado"
                      },
                      replacement: {
                        previous_provider: null,
                        previous_plate: null,
                        return_required: false
                      },
                      documentsMaster: {
                        soap_expiry: "2027-03-31",
                        technical_inspection_expiry: "2026-11-15",
                        circulation_permit_expiry: "2027-03-31",
                        status: "OK"
                      },
                      checklistMaster: {
                        last_date: todayISO,
                        status: "Aprobado",
                        compliance_pct: 100
                      },
                      gpsMaster: {
                        mode: "sandbox",
                        real_gps_enabled: false,
                        provider: "Enlace Sandbox SIM"
                      },
                      incidentsMaster: {
                        open_count: 0,
                        notes: []
                      },
                      data_quality: "Enriquecida",
                      vencimientoPermiso: "2027-03-31",
                      vencimientoRevision: "2026-11-15",
                      vencimientoSeguro: "2027-03-31"
                    };

                    setVehicles(prev => [freshV, ...prev]);
                    setIsAddingVehicle(false);
                    triggerNotification(`Vehículo ${freshV.fleet_id} (${freshV.plate_display}) registrado en base canónica`, "success");
                  }}
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-lg cursor-pointer font-mono text-xs"
                >
                  GUARDAR EN BASE CANÓNICA
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingMaint && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-4 space-y-3 text-left shadow-xl">
              <span className="text-[11px] font-mono font-black text-amber-500 block uppercase">Registrar Mantención Mecánica en Taller</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-sans">
                <div>
                  <label className="text-zinc-500 block mb-1 font-mono">Vehículo / Patente:</label>
                  <select
                    value={newMaint.patente}
                    onChange={(e) => setNewMaint(prev => ({...prev, patente: e.target.value}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-300 font-mono focus:outline-none focus:border-amber-500/40 cursor-pointer"
                  >
                    <option value="">Seleccione camioneta...</option>
                    {vehicles.map(v => (
                      <option key={v.fleet_id || v.patente} value={v.plate_display || v.patente}>
                        {v.fleet_id} — {v.plate_display || v.patente} ({v.brand || v.marca})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Fecha taller:</label>
                  <input 
                    type="date" value={newMaint.fecha}
                    onChange={(e) => setNewMaint(prev => ({...prev, fecha: e.target.value}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 font-mono focus:outline-none focus:border-amber-500/40"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Tipo de Servicio:</label>
                  <select 
                    value={newMaint.tipo}
                    onChange={(e) => setNewMaint(prev => ({...prev, tipo: e.target.value as any}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-400 focus:outline-none focus:border-amber-500/40 cursor-pointer"
                  >
                    <option value="Preventivo">Preventivo (Mantención de pauta)</option>
                    <option value="Correctivo">Correctivo (Reparación de falla)</option>
                    <option value="Cambio de Aceite">Cambio de Aceite</option>
                    <option value="Revisión Técnica">Revisión Técnica</option>
                    <option value="Frenos/Alineación">Frenos/Alineación</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Kilometraje taller:</label>
                  <input 
                    type="number" value={newMaint.km}
                    onChange={(e) => setNewMaint(prev => ({...prev, km: Number(e.target.value)}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 font-mono focus:outline-none focus:border-amber-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                <div>
                  <label className="text-zinc-500 block mb-1">Nombre Taller / Responsable:</label>
                  <input 
                    type="text" placeholder="Ej. Derco Center / Econorent Taller" value={newMaint.responsable}
                    onChange={(e) => setNewMaint(prev => ({...prev, responsable: e.target.value}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-amber-500/40"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 block mb-1">Observaciones / Descripción del trabajo:</label>
                  <input 
                    type="text" placeholder="Mantención de pauta 40.000km, cambio de filtros y pastillas..." value={newMaint.descripcion}
                    onChange={(e) => setNewMaint(prev => ({...prev, descripcion: e.target.value}))}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-amber-500/40"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs font-mono pt-2 border-t border-zinc-850">
                <button onClick={() => setIsAddingMaint(false)} className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg cursor-pointer">CANCELAR</button>
                <button 
                  onClick={() => {
                    if (!newMaint.patente) {
                      alert("Por favor seleccione una camioneta.");
                      return;
                    }
                    const freshM: MantenimientoVehiculo = {
                      id: `maint-${Date.now()}`,
                      patente: newMaint.patente,
                      fecha: newMaint.fecha || new Date().toISOString().split("T")[0],
                      tipo: newMaint.tipo as any,
                      km: newMaint.km || 0,
                      responsable: newMaint.responsable || "Taller Mecánico",
                      descripcion: newMaint.descripcion || "Mantenimiento preventivo general"
                    };

                    setMaintenances(prev => [freshM, ...prev]);

                    // Automatically update vehicle mileage
                    setVehicles(prev => prev.map(v => {
                      if ((v.plate_display || v.patente) === freshM.patente) {
                        return { 
                          ...v, 
                          kilometraje: Math.max(v.kilometraje || 0, freshM.km),
                          odometer_km_last_known: Math.max(v.odometer_km_last_known || 0, freshM.km),
                          odometer_date: freshM.fecha
                        };
                      }
                      return v;
                    }));

                    setIsAddingMaint(false);
                    triggerNotification(`Bitácora ingresada para camioneta ${freshM.patente}`, "success");
                    setNewMaint({ patente: "", fecha: new Date().toISOString().split("T")[0], tipo: "Preventivo", km: 0, responsable: "", descripcion: "" });
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg cursor-pointer font-mono text-xs"
                >
                  GUARDAR EN BITÁCORA
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS Telemetry Satellite Control Panel (SANDBOX ONLY) */}
      <div className="bg-zinc-900/50 border border-zinc-850 p-4 rounded-xl text-left space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg">
              <Navigation size={15} className="rotate-45" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                Simulación Satelital GPS Sandbox
                <span className="text-[8px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                  MODO SANDBOX (NO REAL GPS)
                </span>
              </h4>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                Simulador de telemetría sin conexión a APIs externas ni GPS en vivo. Genera posiciones ficticias de ruteo para verificar trazabilidad de la flota.
              </p>
            </div>
          </div>

          <div>
            {isGpsLinked ? (
              <span className="px-2 py-1 bg-teal-500/10 border border-teal-500/30 text-[9px] text-teal-300 font-bold rounded-lg animate-pulse uppercase tracking-wider flex items-center gap-1 font-mono">
                ● SANDBOX ACTIVO ({vehicles.filter(v => v.gpsConnected).length} Camionetas)
              </span>
            ) : (
              <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-[9px] text-zinc-400 rounded-lg font-bold uppercase tracking-wider font-mono">
                ○ SANDBOX INACTIVO
              </span>
            )}
          </div>
        </div>

        {/* GPS Form Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
          <div>
            <label className="text-zinc-500 block mb-1 font-mono text-[10px]">MODO DE SIMULACIÓN:</label>
            <select 
              value={gpsProvider}
              onChange={(e) => setGpsProvider(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-zinc-200 font-mono text-xs cursor-pointer focus:outline-none focus:border-amber-500/40"
            >
              <option value="Proveedor Enlace Sandbox SIM">Proveedor Enlace Sandbox SIM</option>
              <option value="Sintonizador Satelital Virtual O&M">Sintonizador Satelital Virtual O&M</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-500 block mb-1 font-mono text-[10px]">TOKEN SANDBOX (SIMULADO):</label>
            <input
              type="password"
              value={gpsApiKey}
              readOnly
              className="w-full bg-zinc-950/80 border border-zinc-850 rounded-lg p-2 text-zinc-400 font-mono text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleToggleGps}
              className={`w-full py-2 font-mono text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isGpsConnecting
                  ? "bg-zinc-800 text-zinc-500 border border-zinc-850 cursor-not-allowed"
                  : isGpsLinked
                    ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-zinc-950 hover:border-transparent"
                    : "bg-teal-500 text-zinc-950 hover:bg-teal-400 border border-transparent"
              }`}
              disabled={isGpsConnecting}
            >
              {isGpsConnecting ? (
                <>
                  <span className="animate-spin text-zinc-500">⚙️</span>
                  SINTONIZANDO SANDBOX...
                </>
              ) : isGpsLinked ? (
                "DESACTIVAR SIMULACIÓN SANDBOX"
              ) : (
                <>
                  <Radio size={12} className="animate-pulse" />
                  ACTIVAR SIMULACIÓN SANDBOX GPS
                </>
              )}
            </button>
          </div>
        </div>

        {/* GPS Logger response strip */}
        {gpsApiResponseLog && (
          <div className={`p-3 rounded-xl border text-[10px] font-mono leading-relaxed space-y-1 ${
            gpsApiResponseLog.success 
              ? "bg-teal-950/25 border-teal-500/20 text-teal-400" 
              : "bg-red-950/25 border-red-500/20 text-red-400"
          }`}>
            <div className="flex justify-between items-center font-bold">
              <span>📡 REGISTRO GATEWAY SANDBOX:</span>
              <span className="text-[8px] opacity-80">SANDBOX ACTIVO</span>
            </div>
            <p>{gpsApiResponseLog.message}</p>
          </div>
        )}
      </div>

      {/* Structured Filter & Search Bar */}
      <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-3 text-left">
        
        {/* Top Search Input & Total Count */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-96">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar por ID, patente, modelo, conductor o leasing..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 pl-9 pr-8 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/40 font-mono"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2 text-zinc-500 hover:text-zinc-300">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-zinc-400 font-bold">MOSTRANDO:</span>
            <span className="text-teal-400 font-black bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
              {filteredVehicles.length} / {totalVehicles} VEHÍCULOS
            </span>
          </div>
        </div>

        {/* Filter Pills Groups */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-850 text-[9.5px] font-mono">
          
          {/* Status Filter */}
          <div className="space-y-1">
            <span className="text-zinc-500 font-bold uppercase block text-[8.5px]">ESTADO ASIGNACIÓN</span>
            <div className="flex flex-wrap gap-1">
              {[
                { id: "All", label: "TODOS" },
                { id: "Asignado", label: `ASIGNADO (${assignedCount})` },
                { id: "Pendiente entrega", label: `PEND. ENT. (${pendingDeliveryCount})` },
                { id: "Pendiente patente", label: `PEND. PAT. (${pendingPlateCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2 py-1 rounded border transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? "bg-teal-500/15 border-teal-500/40 text-teal-300 font-bold"
                      : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Provider Filter */}
          <div className="space-y-1">
            <span className="text-zinc-500 font-bold uppercase block text-[8.5px]">PROVEEDOR LEASING</span>
            <div className="flex flex-wrap gap-1">
              {[
                { id: "All", label: "TODOS" },
                { id: "Econorent", label: `ECONORENT (${econorentCount})` },
                { id: "Gama Leasing", label: `GAMA (${gamaCount})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setProviderFilter(f.id)}
                  className={`px-2 py-1 rounded border transition-all cursor-pointer ${
                    providerFilter === f.id
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-300 font-bold"
                      : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zone Filter */}
          <div className="space-y-1">
            <span className="text-zinc-500 font-bold uppercase block text-[8.5px]">ZONA TERRITORIAL</span>
            <div className="flex flex-wrap gap-1">
              {["All", "Sur", "Centro", "Norte", "Centro (Lavado)"].map(z => (
                <button
                  key={z}
                  onClick={() => setZoneFilter(z)}
                  className={`px-2 py-1 rounded border transition-all cursor-pointer ${
                    zoneFilter === z
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold"
                      : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white"
                  }`}
                >
                  {z === "All" ? "TODAS" : z.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Special Toggle (Devolución Requerida) */}
          <div className="space-y-1">
            <span className="text-zinc-500 font-bold uppercase block text-[8.5px]">ALERTAS ESPECIALES</span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setDevOnlyFilter(!devOnlyFilter)}
                className={`px-2 py-1 rounded border transition-all cursor-pointer ${
                  devOnlyFilter
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold"
                    : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white"
                }`}
              >
                DEVOLUCIÓN REQUERIDA ({returnRequiredCount})
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main Workspace Layout (Two columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: List and Cards (Span 2) */}
        <div className="lg:col-span-2 space-y-3 text-left">
          
          {filteredVehicles.length === 0 ? (
            <div className="bg-zinc-900/20 border border-zinc-850 p-12 rounded-xl text-center text-xs font-mono text-zinc-500">
              Ninguna camioneta coincide con los criterios de búsqueda y filtros seleccionados.
            </div>
          ) : (
            filteredVehicles.map((v) => {
              const isSelected = activeSelectedVehicle?.fleet_id === v.fleet_id || activeSelectedVehicle?.patente === v.patente;
              const docAlerts = getVehicleDocumentsAlerts(v);
              const isAssigned = (v.assignment?.status || v.estado) === "Asignado";
              const isPendingDelivery = (v.assignment?.status || v.estado) === "Pendiente entrega";
              const isPendingPlate = (v.assignment?.status || v.estado) === "Pendiente patente";
              const requiresReturn = v.replacement?.return_required === true;

              return (
                <div
                  key={v.fleet_id || v.patente}
                  onClick={() => setSelectedVehicle(v)}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer relative overflow-hidden ${
                    isSelected 
                      ? "bg-zinc-900 border-teal-500/40 shadow-lg shadow-teal-500/5" 
                      : "bg-zinc-900/30 border-zinc-850 hover:bg-zinc-900/50"
                  }`}
                >
                  {/* Status Badges Overlay */}
                  <div className="flex items-center gap-1.5 absolute top-0 right-0">
                    {requiresReturn && (
                      <span className="bg-purple-500/20 text-purple-300 border-l border-b border-purple-500/30 text-[7.5px] font-mono font-bold px-2 py-0.5 uppercase">
                        DEVOLUCIÓN REQUERIDA
                      </span>
                    )}
                    {docAlerts.isCritical && (
                      <span className="bg-red-500/10 text-red-400 border-l border-b border-red-500/20 text-[7.5px] font-mono font-bold px-2 py-0.5 animate-pulse uppercase">
                        ALERTA DOCS
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Left icon wrapper */}
                    <div className={`p-2.5 rounded-xl mt-0.5 ${isSelected ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30' : 'bg-zinc-800/80 text-zinc-400'}`}>
                      <Truck size={20} />
                    </div>

                    {/* Main details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      
                      {/* Top IDs line */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-white bg-zinc-950 px-2 py-0.5 border border-zinc-750 rounded uppercase tracking-wider">
                          {v.fleet_id}
                        </span>
                        
                        <span className="font-mono text-xs font-black text-teal-300 bg-teal-500/10 px-2 py-0.5 border border-teal-500/20 rounded uppercase">
                          {v.plate_display || v.patente}
                        </span>

                        {/* Status Badge */}
                        {isAssigned && (
                          <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                            ASIGNADO
                          </span>
                        )}
                        {isPendingDelivery && (
                          <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                            PENDIENTE ENTREGA
                          </span>
                        )}
                        {isPendingPlate && (
                          <span className="text-[9px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                            PENDIENTE PATENTE
                          </span>
                        )}

                        {/* Provider Badge */}
                        <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800/80 border border-zinc-700 px-1.5 py-0.5 rounded">
                          {v.leasing?.company || "Econorent"}
                        </span>
                      </div>

                      {/* Brand, model & vehicle info */}
                      <div className="text-xs font-bold text-zinc-200 truncate">
                        {v.brand || v.marca} {v.model || v.modelo} • <span className="text-zinc-400 font-normal">{v.vehicle_type || "PickUp 4x4"} ({v.ano || 2024})</span>
                      </div>

                      {/* Subdetails grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 font-mono text-[10px] text-zinc-400 pt-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-zinc-500 font-bold">CONDUCTOR:</span>
                          <span className="text-zinc-200 font-medium truncate">
                            {v.assignment?.assignee || v.conductor || v.asignadoA || "Sin Asignar"}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500 font-bold">ZONA:</span>
                          <span className="text-emerald-400 font-bold">
                            {v.assignment?.zone || v.zona}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500 font-bold">KM:</span>
                          {editingKmPatente === (v.fleet_id || v.patente) ? (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <input
                                type="number"
                                value={editingKmValue}
                                onChange={(e) => setEditingKmValue(parseInt(e.target.value) || 0)}
                                className="w-16 bg-zinc-950 border border-teal-500/50 rounded py-0.5 px-1 text-[9px] font-mono text-teal-400 focus:outline-none focus:border-teal-400"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  setVehicles(prev => prev.map(item => {
                                    if ((item.fleet_id || item.patente) === (v.fleet_id || v.patente)) {
                                      return { 
                                        ...item, 
                                        kilometraje: editingKmValue,
                                        odometer_km_last_known: editingKmValue
                                      };
                                    }
                                    return item;
                                  }));
                                  setEditingKmPatente(null);
                                  triggerNotification(`Kilometraje de ${v.fleet_id} actualizado`, "success");
                                }}
                                className="p-0.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded border border-teal-500/30 text-[8px] cursor-pointer"
                              >
                                <Check size={8} />
                              </button>
                              <button
                                onClick={() => setEditingKmPatente(null)}
                                className="p-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/30 text-[8px] cursor-pointer"
                              >
                                <X size={8} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-teal-400 font-bold">
                                {(v.odometer_km_last_known || v.kilometraje || 0).toLocaleString()} km
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingKmPatente(v.fleet_id || v.patente);
                                  setEditingKmValue(v.odometer_km_last_known || v.kilometraje || 0);
                                }}
                                className="p-0.5 bg-zinc-800/40 hover:bg-zinc-800/80 rounded border border-zinc-700/50 text-zinc-400 hover:text-teal-400 transition-all cursor-pointer"
                                title="Actualizar kilometraje"
                              >
                                <Edit2 size={8} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* GPS Sandbox tracking bar if connected */}
                      {isGpsLinked && v.gpsConnected && (
                        <div className="flex items-center gap-1.5 pt-1 text-[8.5px] font-mono text-teal-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                          <span className="font-bold uppercase">SANDBOX LIVE:</span>
                          <span className="opacity-80 truncate">{v.lastLocationName} ({v.speedKmh} km/h)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center font-mono text-[9px]">
                    <span className="text-[9px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
                      VER FICHA <ChevronRight size={10} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right column: Cockpit detail sheet and Maintenance Logs (Span 1) */}
        <div className="space-y-6 text-left">
          
          {/* Cockpit Details Sheet */}
          {activeSelectedVehicle ? (
            <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-4 space-y-4 shadow-xl">
              
              {/* Header */}
              <div className="border-b border-zinc-850 pb-3 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-black text-teal-400 uppercase tracking-wider">
                      {activeSelectedVehicle.fleet_id}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                      {activeSelectedVehicle.data_quality || "Enriquecida"}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-sans mt-0.5">
                    {activeSelectedVehicle.brand || activeSelectedVehicle.marca} {activeSelectedVehicle.model || activeSelectedVehicle.modelo}
                  </h4>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-black text-teal-300 bg-teal-500/10 px-2 py-1 border border-teal-500/20 rounded block">
                    {activeSelectedVehicle.plate_display || activeSelectedVehicle.patente}
                  </span>
                  <span className="text-[8px] text-zinc-500 block mt-0.5">
                    {activeSelectedVehicle.plate ? `NORM: ${activeSelectedVehicle.plate}` : "SIN PATENTE REGL."}
                  </span>
                </div>
              </div>

              {/* Detail Navigation Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[9px] font-mono border-b border-zinc-850">
                {[
                  { id: 'id', label: 'ID & Vehículo' },
                  { id: 'assign', label: 'Asignación' },
                  { id: 'leasing', label: 'Leasing' },
                  { id: 'delivery', label: 'Entrega' },
                  { id: 'maint', label: 'Odómetro' },
                  { id: 'docs', label: 'Docs' },
                  { id: 'gps', label: 'GPS Sandbox' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id as any)}
                    className={`px-2 py-1 rounded transition-all cursor-pointer whitespace-nowrap ${
                      detailTab === tab.id
                        ? "bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold"
                        : "bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Container */}
              <div className="min-h-[220px]">
                
                {/* TAB 1: ID & VEHÍCULO */}
                {detailTab === 'id' && (
                  <div className="space-y-2 text-[10px] font-mono text-zinc-400">
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Fleet ID:</span>
                      <span className="text-white font-bold">{activeSelectedVehicle.fleet_id}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Portafolio:</span>
                      <span className="text-zinc-300">{activeSelectedVehicle.portfolio || "Chile O&M"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Patente Visual:</span>
                      <span className="text-teal-300 font-bold">{activeSelectedVehicle.plate_display || activeSelectedVehicle.patente}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Patente Normalizada:</span>
                      <span className="text-zinc-400">{activeSelectedVehicle.plate || "PENDIENTE"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Marca / Modelo:</span>
                      <span className="text-zinc-200 font-bold">{activeSelectedVehicle.brand || activeSelectedVehicle.marca} {activeSelectedVehicle.model || activeSelectedVehicle.modelo}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Tipo / Tracción:</span>
                      <span className="text-zinc-300">{activeSelectedVehicle.vehicle_type || "PickUp"} • {activeSelectedVehicle.drive || "4x4"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Combustible:</span>
                      <span className="text-zinc-300">{activeSelectedVehicle.fuel || "Diésel"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Año / Color:</span>
                      <span className="text-zinc-300">{activeSelectedVehicle.ano || 2024} • {activeSelectedVehicle.color || "Blanco"}</span>
                    </div>
                  </div>
                )}

                {/* TAB 2: ASIGNACIÓN Y ZONA */}
                {detailTab === 'assign' && (
                  <div className="space-y-2 text-[10px] font-mono text-zinc-400">
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Conductor / Asignado a:</span>
                      <span className="text-teal-400 font-bold">{activeSelectedVehicle.assignment?.assignee || activeSelectedVehicle.conductor || "Sin Asignar"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Zona Territorial:</span>
                      <span className="text-emerald-400 font-bold">{activeSelectedVehicle.assignment?.zone || activeSelectedVehicle.zona}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Ciudad Base:</span>
                      <span className="text-zinc-300">{activeSelectedVehicle.assignment?.base_city || "Desconocida"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Estado Asignación:</span>
                      <span className={`px-2 py-0.5 rounded font-black ${
                        (activeSelectedVehicle.assignment?.status || activeSelectedVehicle.estado) === "Asignado"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {activeSelectedVehicle.assignment?.status || activeSelectedVehicle.estado}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-1 pt-1 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Personal Asociado en Terreno:</span>
                      <span className="text-zinc-300 text-[9.5px]">
                        {(activeSelectedVehicle.personalAsociado || [activeSelectedVehicle.conductor || "Técnico O&M"]).join(", ")}
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB 3: LEASING & CONTRATO */}
                {detailTab === 'leasing' && (
                  <div className="space-y-2 text-[10px] font-mono text-zinc-400">
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Empresa Leasing:</span>
                      <span className="text-blue-400 font-bold">{activeSelectedVehicle.leasing?.company || "Econorent"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Nº Contrato:</span>
                      <span className="text-zinc-200">{activeSelectedVehicle.leasing?.contract_reference || "Sin contrato registrado"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Vigencia Contrato:</span>
                      <span className="text-zinc-300">
                        {activeSelectedVehicle.leasing?.start_date || "N/A"} a {activeSelectedVehicle.leasing?.end_date || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Plazo / Canon Mensual:</span>
                      <span className="text-zinc-300">
                        {activeSelectedVehicle.leasing?.term_months ? `${activeSelectedVehicle.leasing.term_months} meses` : "N/A"} • {activeSelectedVehicle.leasing?.monthly_uf ? `${activeSelectedVehicle.leasing.monthly_uf} UF/mes` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Estado Contrato:</span>
                      <span className="text-emerald-400 font-bold">{activeSelectedVehicle.leasing?.contract_status || "Vigente"}</span>
                    </div>
                  </div>
                )}

                {/* TAB 4: ENTREGA & REEMPLAZO */}
                {detailTab === 'delivery' && (
                  <div className="space-y-2 text-[10px] font-mono text-zinc-400">
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Fecha Entrega:</span>
                      <span className="text-zinc-200 font-bold">{activeSelectedVehicle.delivery?.date || "Pendiente"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Estado Entrega:</span>
                      <span className={`px-2 py-0.5 rounded font-black ${
                        activeSelectedVehicle.delivery?.status === "Entregado" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {activeSelectedVehicle.delivery?.status || "Pendiente"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Proveedor Anterior:</span>
                      <span className="text-zinc-300">{activeSelectedVehicle.replacement?.previous_provider || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Patente Anterior:</span>
                      <span className="text-zinc-300">{activeSelectedVehicle.replacement?.previous_plate || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Devolución Requerida:</span>
                      <span className={`px-2 py-0.5 rounded font-black ${
                        activeSelectedVehicle.replacement?.return_required ? "bg-purple-500/20 text-purple-300" : "bg-zinc-800 text-zinc-500"
                      }`}>
                        {activeSelectedVehicle.replacement?.return_required ? "SÍ (Devolver)" : "NO"}
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB 5: MANTENIMIENTO & ODÓMETRO */}
                {detailTab === 'maint' && (
                  <div className="space-y-2 text-[10px] font-mono text-zinc-400">
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Kilometraje Registrado:</span>
                      <span className="text-teal-400 font-bold text-xs">
                        {(activeSelectedVehicle.odometer_km_last_known || activeSelectedVehicle.kilometraje || 0).toLocaleString()} km
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Fecha Último Lectura:</span>
                      <span className="text-zinc-300">{activeSelectedVehicle.odometer_date || "2026-08-01"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Próximo Mantenimiento:</span>
                      <span className="text-amber-400 font-bold">
                        {activeSelectedVehicle.maintenanceMaster?.next_service_km ? `${activeSelectedVehicle.maintenanceMaster.next_service_km.toLocaleString()} km` : "Según pauta p.km"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Estado Mantenimiento:</span>
                      <span className="text-emerald-400 font-bold">{activeSelectedVehicle.maintenanceMaster?.status || "Al día"}</span>
                    </div>
                  </div>
                )}

                {/* TAB 6: DOCUMENTOS & CHECKLIST */}
                {detailTab === 'docs' && (
                  <div className="space-y-2 text-[10px] font-mono text-zinc-400">
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Permiso Circulación / SOAP:</span>
                      <span className="text-teal-400 font-bold">{activeSelectedVehicle.documentsMaster?.soap_expiry || activeSelectedVehicle.vencimientoPermiso || "2027-03-31"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Revisión Técnica:</span>
                      <span className="text-teal-400 font-bold">{activeSelectedVehicle.documentsMaster?.technical_inspection_expiry || activeSelectedVehicle.vencimientoRevision || "2026-11-15"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Checklist Terreno % Cumplimiento:</span>
                      <span className="text-emerald-400 font-bold">
                        {activeSelectedVehicle.checklistMaster?.compliance_pct !== null && activeSelectedVehicle.checklistMaster?.compliance_pct !== undefined
                          ? `${activeSelectedVehicle.checklistMaster.compliance_pct}%`
                          : "100% (Verificado)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Estado Auditoría Docs:</span>
                      <span className="text-emerald-400 font-bold">{activeSelectedVehicle.documentsMaster?.status || "OK"}</span>
                    </div>
                  </div>
                )}

                {/* TAB 7: GPS SANDBOX */}
                {detailTab === 'gps' && (
                  <div className="space-y-2 text-[10px] font-mono text-zinc-400">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 leading-relaxed space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <ShieldAlert size={12} />
                        <span>INFORMACIÓN SANDBOX — SIN TELEMETRÍA REAL</span>
                      </div>
                      <p className="text-[9px] font-sans">
                        Este vehículo utiliza telemetría de prueba en modo Sandbox. No hay GPS físico ni llamadas a servicios en vivo.
                      </p>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5 pt-1">
                      <span className="text-zinc-500 uppercase">Modo GPS:</span>
                      <span className="text-amber-400 font-bold uppercase">{activeSelectedVehicle.gpsMaster?.mode || "sandbox"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">GPS Real Activado:</span>
                      <span className="text-red-400 font-bold">FALSE (Simulado)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Proveedor Sandbox:</span>
                      <span className="text-zinc-300">{activeSelectedVehicle.gpsMaster?.provider || "Enlace Sandbox SIM"}</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-8 text-center text-xs font-mono text-zinc-600">
              Seleccione una camioneta para inspeccionar su ficha canónica.
            </div>
          )}

          {/* Maintenance Logs list */}
          <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-4 text-left space-y-4 shadow-xl">
            <div className="border-b border-zinc-850 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench size={13} className="text-amber-500" />
                  Historial de Ingresos a Taller
                </h4>
                <p className="text-[9px] text-zinc-500 mt-0.5">Pauta y mantenimiento correctivo.</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                {maintenances.length} REGISTROS
              </span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {maintenances.length === 0 ? (
                <div className="text-center font-mono text-[9px] text-zinc-600 py-6">
                  Sin registros cargados en taller.
                </div>
              ) : (
                maintenances.map(m => (
                  <div key={m.id} className="bg-zinc-950/70 border border-zinc-900 p-2.5 rounded-lg space-y-1 font-mono text-[9px] text-zinc-400">
                    <div className="flex justify-between items-baseline">
                      <span className="text-zinc-600 text-[8px]">[{m.fecha}]</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-extrabold border border-amber-500/10 uppercase">
                        {m.tipo}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-zinc-300">
                      <span>Patente: {m.patente}</span>
                      <span>•</span>
                      <span>{m.km.toLocaleString()} km</span>
                    </div>
                    <p className="font-sans text-[8.5px] italic text-zinc-400 leading-normal">
                      {m.descripcion}
                    </p>
                    <div className="text-[8px] text-zinc-500 border-t border-zinc-900/60 pt-1 text-right">
                      Taller: {m.responsable}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
