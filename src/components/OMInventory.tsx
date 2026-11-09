import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  ArrowRightLeft, 
  Trash2, 
  PlusCircle, 
  Check, 
  Info, 
  ChevronRight, 
  X, 
  FileSpreadsheet, 
  HelpCircle, 
  RefreshCw, 
  Sparkles,
  Layers,
  Database,
  Building,
  ArrowRight,
  User,
  Wrench,
  Tag,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  OMInventoryItem, 
  OMInventoryMovement, 
  OT, 
  Planta 
} from '../types';
import { 
  loadInventory, 
  saveInventory, 
  loadInventoryMovements, 
  saveInventoryMovements 
} from '../data/db';

interface OMInventoryProps {
  ots: OT[];
  plantas: Planta[];
  userRole: string;
  activeUserName: string;
  onAddAuditLog: (
    action: string,
    origin: string,
    otCode?: string,
    plantaName?: string,
    comment?: string,
    criticality?: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  ) => void;
}

export default function OMInventory({ 
  ots = [], 
  plantas = [], 
  userRole, 
  activeUserName, 
  onAddAuditLog 
}: OMInventoryProps) {
  // Load states from localStorage
  const [inventory, setInventory] = useState<OMInventoryItem[]>([]);
  const [movements, setMovements] = useState<OMInventoryMovement[]>([]);
  
  // Navigation inside Inventory
  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'alerts' | 'excel'>('stock');
  
  // Filters
  const [selectedPlanta, setSelectedPlanta] = useState<string>('Todas');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modals & New Item / Movement states
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isManualMovementModalOpen, setIsManualMovementModalOpen] = useState(false);
  
  // Excel Import Wizard states
  const [excelStep, setExcelStep] = useState<1 | 2 | 3 | 4>(1);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelDragActive, setExcelDragActive] = useState(false);
  const [excelMapping, setExcelMapping] = useState({
    codigo: 'CODIGO_ITEM',
    descripcion: 'DESCRIPCION_ITEM',
    stock: 'STOCK_FISICO',
    planta: 'CENTRO_PLANTA'
  });
  
  // Simulated Excel rows
  const [simulatedExcelRows, setSimulatedExcelRows] = useState<any[]>([]);
  const [comparisonResults, setComparisonResults] = useState<any[]>([]);

  // Forms
  const [newItem, setNewItem] = useState<Partial<OMInventoryItem>>({
    codigo: '',
    descripcion: '',
    plantaId: '',
    bodegaUbicacion: '',
    categoria: 'Inversores',
    unidad: 'Unidad',
    stockActual: 0,
    stockMinimo: 5,
    criticidad: 'Media',
    proveedor: '',
  });

  const [newMovement, setNewMovement] = useState({
    itemCodigo: '',
    tipoMovimiento: 'Ingreso de repuesto' as any,
    cantidad: 1,
    otAsociada: '',
    observacion: '',
    plantaDestinoId: '' // used for transfers
  });

  // Load inventory on mount
  useEffect(() => {
    setInventory(loadInventory());
    setMovements(loadInventoryMovements());
  }, []);

  // Sync state back to localStorage
  const updateInventoryState = (newInv: OMInventoryItem[]) => {
    setInventory(newInv);
    saveInventory(newInv);
  };

  const updateMovementsState = (newMovs: OMInventoryMovement[]) => {
    setMovements(newMovs);
    saveInventoryMovements(newMovs);
  };

  // Check and process Corrective OTs to see if we should auto-register mock consumption
  // In a real system, this is a background sync or done on trigger. We will check if there are 
  // corrective OTs with repuestos that do NOT have a corresponding movement yet.
  const handleAutoSyncCorrectives = () => {
    const currentInventory = [...inventory];
    const currentMovements = [...movements];
    let updated = false;

    // Filter corrective OTs that are Cerrada/Finalizada or in execution
    const correctiveOts = ots.filter(ot => 
      ot.tipo === 'Correctiva' && 
      ot.repuestosRequeridos && 
      ot.repuestosRequeridos.length > 0
    );

    correctiveOts.forEach(ot => {
      ot.repuestosRequeridos?.forEach(repName => {
        // Find if we already have a logged movement for this specific OT and repuesto
        const alreadyLogged = currentMovements.some(m => 
          m.otAsociada === ot.codigo && 
          (m.itemDescripcion === repName || m.itemCodigo.includes(ot.plantaId))
        );

        if (!alreadyLogged) {
          // Attempt to find matching item in inventory for this plant
          let invItem = currentInventory.find(item => 
            item.plantaId === ot.plantaId && 
            (item.descripcion.toLowerCase().includes(repName.toLowerCase()) || 
             repName.toLowerCase().includes(item.categoria.toLowerCase()))
          );

          // Fallback: match by description anywhere or just find first available for that plant
          if (!invItem) {
            invItem = currentInventory.find(item => item.plantaId === ot.plantaId);
          }

          if (invItem) {
            const qty = 1; // Default mock quantity
            const stockAnterior = invItem.stockActual;
            const stockFinal = Math.max(0, stockAnterior - qty);

            // Deduct stock
            invItem.stockActual = stockFinal;
            invItem.estado = stockFinal === 0 
              ? 'Sin Stock' 
              : stockFinal <= invItem.stockMinimo 
                ? 'Bajo Mínimo' 
                : 'Disponible';
            invItem.ultimaActualizacion = new Date().toISOString().replace('T', ' ').substring(0, 16);

            // Register movement
            const newMov: OMInventoryMovement = {
              id: `MOV-AUTO-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
              itemCodigo: invItem.codigo,
              itemDescripcion: invItem.descripcion,
              plantaId: invItem.plantaId,
              plantaNombre: invItem.plantaNombre,
              tipoMovimiento: 'Consumo por OT',
              otAsociada: ot.codigo,
              tecnico: ot.responsable || 'Técnico de Terreno',
              cantidad: qty,
              stockAnterior,
              stockFinal,
              fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
              observacion: `Consumo automático mock detectado desde la OT Correctiva ${ot.codigo} (Recursos).`
            };

            currentMovements.unshift(newMov);
            updated = true;

            onAddAuditLog(
              'Consumo Automático O&M',
              'Inventario O&M',
              ot.codigo,
              ot.plantaNombre,
              `Se debitó automáticamente 1 unidad de "${invItem.descripcion}" por uso en la OT Correctiva ${ot.codigo}.`,
              'Media'
            );
          }
        }
      });
    });

    if (updated) {
      updateInventoryState(currentInventory);
      updateMovementsState(currentMovements);
      alert('Sincronización con OTs finalizada. Se detectaron y procesaron nuevos consumos de repuestos.');
    } else {
      alert('Inventario al día. No se encontraron nuevos consumos pendientes de registrar.');
    }
  };

  // Helper to get alerts
  const getAlertsList = () => {
    const list: { type: string; title: string; desc: string; severity: 'high' | 'medium' | 'low'; action?: string }[] = [];
    
    inventory.forEach(item => {
      if (item.stockActual === 0) {
        list.push({
          type: 'STOCK_CERO',
          title: `Stock en cero: ${item.codigo}`,
          desc: `El repuesto "${item.descripcion}" de la planta ${item.plantaNombre} no tiene disponibilidad física.`,
          severity: item.criticidad === 'Crítica' || item.criticidad === 'Alta' ? 'high' : 'medium'
        });
      } else if (item.stockActual <= item.stockMinimo) {
        list.push({
          type: 'STOCK_BAJO',
          title: `Stock bajo mínimo: ${item.codigo}`,
          desc: `La cantidad de "${item.descripcion}" (${item.stockActual} ${item.unidad}) es inferior al mínimo definido (${item.stockMinimo}).`,
          severity: 'medium'
        });
      }

      // Criticidad alta sin stock
      if ((item.criticidad === 'Crítica' || item.criticidad === 'Alta') && item.stockActual === 0) {
        list.push({
          type: 'CRITICO_SIN_DISP',
          title: `Repuesto crítico sin disponibilidad: ${item.codigo}`,
          desc: `ALERTA DE SEGURIDAD O&M: Se requiere stock de seguridad de "${item.descripcion}" en planta ${item.plantaNombre}.`,
          severity: 'high'
        });
      }
    });

    // Check last update neglect per plant (>30 days)
    const plantsList = ['Cantillana', 'Parral', 'Alhué', 'Venezia', 'Tricague'];
    plantsList.forEach(pName => {
      const plantItems = inventory.filter(item => item.plantaNombre === pName);
      if (plantItems.length > 0) {
        // Find newest update date
        const dates = plantItems.map(item => new Date(item.ultimaActualizacion).getTime());
        const newest = Math.max(...dates);
        const diffDays = (new Date().getTime() - newest) / (1000 * 3600 * 24);
        if (diffDays > 30) {
          list.push({
            type: 'SIN_ACTUALIZACION_MENSUAL',
            title: `Planta sin actualización mensual: ${pName}`,
            desc: `Los registros de inventario de ${pName} no han recibido ajustes Excel en los últimos ${Math.round(diffDays)} días.`,
            severity: 'high'
          });
        }
      }
    });

    // Consumos sin OT asociada
    movements.forEach(m => {
      if (m.tipoMovimiento === 'Consumo por OT' && !m.otAsociada) {
        list.push({
          type: 'CONSUMO_SIN_OT',
          title: `Consumo sin OT registrada: ${m.id}`,
          desc: `Se registró salida de "${m.itemDescripcion}" en ${m.plantaNombre} por cantidad ${m.cantidad} sin ingresar el código correlativo de OT.`,
          severity: 'medium'
        });
      }
    });

    // Alerta por Diferencias pendientes (en conciliación)
    const hasUnreconciledItems = inventory.some(item => item.estado === 'Requiere Revisión' || item.stockActual <= item.stockMinimo / 2);
    if (hasUnreconciledItems) {
      list.push({
        type: 'DIFERENCIAS_PENDIENTES',
        title: 'Diferencias físicas pendientes de conciliación',
        desc: 'Se detectaron discrepancias entre conteos físicos parciales y el stock teórico. Se requiere ejecutar Conciliación por Carga Excel en la planta Parral.',
        severity: 'medium'
      });
    }

    return list;
  };

  const activeAlerts = getAlertsList();

  // Handle Add New Item
  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.codigo || !newItem.descripcion || !newItem.plantaId) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    const pl = plantas.find(p => p.id === newItem.plantaId);
    const plName = pl ? pl.name : 'Planta O&M';

    const createdItem: OMInventoryItem = {
      id: newItem.codigo.trim().toUpperCase(),
      codigo: newItem.codigo.trim().toUpperCase(),
      descripcion: newItem.descripcion.trim(),
      plantaId: newItem.plantaId,
      plantaNombre: plName,
      bodegaUbicacion: newItem.bodegaUbicacion || `Bodega Móvil ${plName}`,
      categoria: (newItem.categoria || 'Consumibles eléctricos') as any,
      unidad: newItem.unidad || 'Unidad',
      stockActual: Number(newItem.stockActual) || 0,
      stockMinimo: Number(newItem.stockMinimo) || 5,
      criticidad: (newItem.criticidad || 'Media') as any,
      proveedor: newItem.proveedor || 'Proveedor Autorizado',
      ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16),
      estado: Number(newItem.stockActual) === 0 
        ? 'Sin Stock' 
        : (Number(newItem.stockActual) <= (newItem.stockMinimo || 5)) 
          ? 'Bajo Mínimo' 
          : 'Disponible'
    };

    // Check if code already exists
    if (inventory.some(item => item.codigo === createdItem.codigo)) {
      alert(`El código de ítem "${createdItem.codigo}" ya existe en el inventario.`);
      return;
    }

    const updatedInv = [createdItem, ...inventory];
    updateInventoryState(updatedInv);
    setIsNewItemModalOpen(false);

    // Add Audit Log
    onAddAuditLog(
      'Ingreso Catálogo Inventario',
      'Inventario O&M',
      undefined,
      plName,
      `Se agregó el nuevo ítem "${createdItem.descripcion}" (${createdItem.codigo}) al catálogo de repuestos de ${plName}.`,
      'Baja'
    );

    // Reset form
    setNewItem({
      codigo: '',
      descripcion: '',
      plantaId: '',
      bodegaUbicacion: '',
      categoria: 'Inversores',
      unidad: 'Unidad',
      stockActual: 0,
      stockMinimo: 5,
      criticidad: 'Media',
      proveedor: '',
    });
  };

  // Handle Manual Movement Registration
  const handleRegisterManualMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovement.itemCodigo || newMovement.cantidad <= 0) {
      alert('Seleccione un repuesto y defina una cantidad mayor a cero.');
      return;
    }

    const item = inventory.find(i => i.codigo === newMovement.itemCodigo);
    if (!item) return;

    let stockAnterior = item.stockActual;
    let stockFinal = stockAnterior;
    let valid = true;

    if (newMovement.tipoMovimiento === 'Consumo por OT' || newMovement.tipoMovimiento === 'Baja por daño') {
      if (stockAnterior < newMovement.cantidad) {
        alert(`No hay stock suficiente. Stock disponible: ${stockAnterior} ${item.unidad}.`);
        valid = false;
      } else {
        stockFinal = stockAnterior - newMovement.cantidad;
      }
    } else if (newMovement.tipoMovimiento === 'Ingreso de repuesto' || newMovement.tipoMovimiento === 'Ajuste mensual Excel') {
      stockFinal = stockAnterior + newMovement.cantidad;
    } else if (newMovement.tipoMovimiento === 'Traslado entre plantas') {
      if (!newMovement.plantaDestinoId) {
        alert('Debe seleccionar la planta de destino para el traslado.');
        valid = false;
      } else if (stockAnterior < newMovement.cantidad) {
        alert(`No hay stock suficiente para trasladar. Stock disponible: ${stockAnterior} ${item.itemCodigo || item.unidad}.`);
        valid = false;
      } else {
        stockFinal = stockAnterior - newMovement.cantidad;
      }
    }

    if (!valid) return;

    // Apply change to origin item
    const currentInventory = [...inventory];
    const itemIndex = currentInventory.findIndex(i => i.codigo === item.codigo);
    
    currentInventory[itemIndex] = {
      ...item,
      stockActual: stockFinal,
      estado: stockFinal === 0 
        ? 'Sin Stock' 
        : stockFinal <= item.stockMinimo 
          ? 'Bajo Mínimo' 
          : 'Disponible',
      ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    // If transfer, increase stock at destination or create item
    let transferNote = '';
    if (newMovement.tipoMovimiento === 'Traslado entre plantas') {
      const destPlant = plantas.find(p => p.id === newMovement.plantaDestinoId);
      const destPlantName = destPlant ? destPlant.name : 'Planta de Destino';
      
      // Look for same item code template at destination
      // Typically, code includes plant, e.g. "INV-CANT-01" to "INV-ALHU-01"
      // We'll search for an item in the destination plant with similar description/category
      let destItemIndex = currentInventory.findIndex(i => 
        i.plantaId === newMovement.plantaDestinoId && 
        i.descripcion.toLowerCase() === item.descripcion.toLowerCase()
      );

      if (destItemIndex !== -1) {
        const destItem = currentInventory[destItemIndex];
        const destStockAnt = destItem.stockActual;
        const destStockFin = destStockAnt + newMovement.cantidad;
        
        currentInventory[destItemIndex] = {
          ...destItem,
          stockActual: destStockFin,
          estado: destStockFin === 0 ? 'Sin Stock' : destStockFin <= destItem.stockMinimo ? 'Bajo Mínimo' : 'Disponible',
          ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };

        // Add destination movement
        const destMov: OMInventoryMovement = {
          id: `MOV-TR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          itemCodigo: destItem.codigo,
          itemDescripcion: destItem.descripcion,
          plantaId: destItem.plantaId,
          plantaNombre: destItem.plantaNombre,
          tipoMovimiento: 'Ingreso de repuesto',
          cantidad: newMovement.cantidad,
          stockAnterior: destStockAnt,
          stockFinal: destStockFin,
          fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          observacion: `Recibido por traslado desde Planta ${item.plantaNombre}. Obs: ${newMovement.observacion}`
        };
        movements.unshift(destMov);
      } else {
        // Create new item entry at destination plant
        const newDestItemCode = `${item.codigo.split('-')[0]}-${destPlantName.substring(0, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
        const newDestItem: OMInventoryItem = {
          id: newDestItemCode,
          codigo: newDestItemCode,
          descripcion: item.descripcion,
          plantaId: newMovement.plantaDestinoId,
          plantaNombre: destPlantName,
          bodegaUbicacion: `Bodega Central ${destPlantName}`,
          categoria: item.categoria,
          unidad: item.unidad,
          stockActual: newMovement.cantidad,
          stockMinimo: item.stockMinimo,
          criticidad: item.criticidad,
          proveedor: item.proveedor,
          ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16),
          estado: 'Disponible'
        };
        currentInventory.push(newDestItem);
      }
      transferNote = ` Trasladado a planta ${destPlantName}.`;
    }

    const createdMovement: OMInventoryMovement = {
      id: `MOV-M-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      itemCodigo: item.codigo,
      itemDescripcion: item.descripcion,
      plantaId: item.plantaId,
      plantaNombre: item.plantaNombre,
      tipoMovimiento: newMovement.tipoMovimiento,
      otAsociada: newMovement.otAsociada || undefined,
      tecnico: activeUserName,
      cantidad: newMovement.cantidad,
      stockAnterior,
      stockFinal,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      observacion: `${newMovement.observacion}${transferNote}`.trim() || 'Movimiento registrado manualmente.'
    };

    const updatedMovements = [createdMovement, ...movements];
    
    updateInventoryState(currentInventory);
    updateMovementsState(updatedMovements);
    setIsManualMovementModalOpen(false);

    // Audit Log
    onAddAuditLog(
      'Movimiento Manual Inventario',
      'Inventario O&M',
      newMovement.otAsociada || undefined,
      item.plantaNombre,
      `Se registró un movimiento de tipo "${newMovement.tipoMovimiento}" para el repuesto "${item.descripcion}" (Cant: ${newMovement.cantidad}). Stock anterior: ${stockAnterior} → Final: ${stockFinal}.`,
      'Media'
    );

    // Reset Form
    setNewMovement({
      itemCodigo: '',
      tipoMovimiento: 'Ingreso de repuesto',
      cantidad: 1,
      otAsociada: '',
      observacion: '',
      plantaDestinoId: ''
    });
  };

  // Drag and Drop simulation for Excel
  const handleExcelDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setExcelDragActive(true);
    } else if (e.type === "dragleave") {
      setExcelDragActive(false);
    }
  };

  const handleExcelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExcelDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcelSimulatedFile(e.dataTransfer.files[0]);
    }
  };

  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processExcelSimulatedFile(e.target.files[0]);
    }
  };

  // Build simulated Excel contents based on active inventory with some changes
  const processExcelSimulatedFile = (file: File) => {
    setExcelFile(file);
    
    // Generate simulated rows: some matching, some with differences (income/consumption), one completely new item, one low stock
    const rows = [
      // Cantillana match with income (difference)
      { CODIGO_ITEM: 'INV-CANT-01', DESCRIPCION_ITEM: 'Fusible de Inversor Central 250A 1000V', STOCK_FISICO: 10, CENTRO_PLANTA: 'Cantillana', PROVEEDOR: 'Sungevity', MINIMO: 5 },
      // Parral match without movement (no diff)
      { CODIGO_ITEM: 'INV-PARR-01', DESCRIPCION_ITEM: 'Filtro de Aire Inversor Central SG3125', STOCK_FISICO: 12, CENTRO_PLANTA: 'Parral', PROVEEDOR: 'Sungrow', MINIMO: 10 },
      // Alhue match with consumption (diff)
      { CODIGO_ITEM: 'COM-ALHU-01', DESCRIPCION_ITEM: 'Switch Ethernet Industrial 8 Puertos', STOCK_FISICO: 1, CENTRO_PLANTA: 'Alhué', PROVEEDOR: 'Moxa', MINIMO: 3 },
      // Venezia match with low stock (diff/critical check)
      { CODIGO_ITEM: 'CON-VENE-01', DESCRIPCION_ITEM: 'Conectores MC4 Especiales 1500V', STOCK_FISICO: 10, CENTRO_PLANTA: 'Venezia', PROVEEDOR: 'Staubli', MINIMO: 30 },
      // Completely new item in Tricague
      { CODIGO_ITEM: 'FUS-TRIC-99', DESCRIPCION_ITEM: 'Fusible Ultra Rápido NH00 160A', STOCK_FISICO: 8, CENTRO_PLANTA: 'Tricague', PROVEEDOR: 'Siba Fuses', MINIMO: 4 },
      // Requiere revisión (extreme discrepancy)
      { CODIGO_ITEM: 'CNS-TRIC-01', DESCRIPCION_ITEM: 'Cinta Aisladora 3M Super 33+', STOCK_FISICO: 150, CENTRO_PLANTA: 'Tricague', PROVEEDOR: '3M', MINIMO: 10 }
    ];

    setSimulatedExcelRows(rows);
    setExcelStep(2);
  };

  // Compare Excel rows vs current inventory
  const handleCompareExcel = () => {
    const results = simulatedExcelRows.map(row => {
      const match = inventory.find(i => i.codigo === row.CODIGO_ITEM);
      let diffType: 'Sin movimiento' | 'Consumo' | 'Ingreso' | 'Ítem nuevo' | 'Stock bajo' | 'Requiere revisión' = 'Sin movimiento';
      let qtyDiff = 0;
      
      if (!match) {
        diffType = 'Ítem nuevo';
        qtyDiff = row.STOCK_FISICO;
      } else {
        qtyDiff = row.STOCK_FISICO - match.stockActual;
        
        if (row.STOCK_FISICO > 100 && match.stockActual < 50) {
          // Simulated extreme discrepancy
          diffType = 'Requiere revisión';
        } else if (qtyDiff > 0) {
          diffType = 'Ingreso';
        } else if (qtyDiff < 0) {
          diffType = 'Consumo';
        } else if (row.STOCK_FISICO <= row.MINIMO) {
          diffType = 'Stock bajo';
        }
      }

      return {
        ...row,
        itemMatch: match,
        stockAnterior: match ? match.stockActual : 0,
        diferenciaText: diffType,
        qtyDiff
      };
    });

    setComparisonResults(results);
    setExcelStep(3);
  };

  // Apply simulated Excel changes to inventory
  const handleApplyExcelChanges = () => {
    const currentInventory = [...inventory];
    const currentMovements = [...movements];
    let appliedCount = 0;

    comparisonResults.forEach(res => {
      if (res.diferenciaText === 'Sin movimiento') return;

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

      if (res.diferenciaText === 'Ítem nuevo') {
        const destPlant = plantas.find(p => p.name === res.CENTRO_PLANTA);
        const newItem: OMInventoryItem = {
          id: res.CODIGO_ITEM,
          codigo: res.CODIGO_ITEM,
          descripcion: res.DESCRIPCION_ITEM,
          plantaId: destPlant ? destPlant.id : 'P10',
          plantaNombre: res.CENTRO_PLANTA,
          bodegaUbicacion: `Bodega Central ${res.CENTRO_PLANTA}`,
          categoria: 'Fusibles',
          unidad: 'Unidad',
          stockActual: res.STOCK_FISICO,
          stockMinimo: res.MINIMO,
          criticidad: 'Alta',
          proveedor: res.PROVEEDOR,
          ultimaActualizacion: nowStr,
          estado: 'Disponible'
        };

        currentInventory.push(newItem);

        // Movement record
        currentMovements.unshift({
          id: `MOV-EX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          itemCodigo: newItem.codigo,
          itemDescripcion: newItem.descripcion,
          plantaId: newItem.plantaId,
          plantaNombre: newItem.plantaNombre,
          tipoMovimiento: 'Ajuste mensual Excel',
          cantidad: res.STOCK_FISICO,
          stockAnterior: 0,
          stockFinal: res.STOCK_FISICO,
          fecha: nowStr,
          observacion: 'Carga inicial e ingreso de ítem nuevo mediante ajuste Excel mensual.'
        });
        appliedCount++;

      } else if (res.itemMatch) {
        const itemIndex = currentInventory.findIndex(i => i.codigo === res.itemMatch.codigo);
        const matchItem = currentInventory[itemIndex];
        const stockAnterior = matchItem.stockActual;
        const stockFinal = res.STOCK_FISICO;

        currentInventory[itemIndex] = {
          ...matchItem,
          stockActual: stockFinal,
          estado: stockFinal === 0 
            ? 'Sin Stock' 
            : stockFinal <= matchItem.stockMinimo 
              ? 'Bajo Mínimo' 
              : 'Disponible',
          ultimaActualizacion: nowStr
        };

        // Determine movement tag
        let movType: any = 'Ajuste mensual Excel';
        let detail = `Ajuste mensual Excel. Conciliación física.`;

        currentMovements.unshift({
          id: `MOV-EX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          itemCodigo: matchItem.codigo,
          itemDescripcion: matchItem.descripcion,
          plantaId: matchItem.plantaId,
          plantaNombre: matchItem.plantaNombre,
          tipoMovimiento: movType,
          cantidad: Math.abs(res.qtyDiff),
          stockAnterior,
          stockFinal,
          fecha: nowStr,
          observacion: `${detail} Diferencia física detectada: ${res.qtyDiff > 0 ? '+' : ''}${res.qtyDiff} u.`
        });
        appliedCount++;
      }
    });

    updateInventoryState(currentInventory);
    updateMovementsState(currentMovements);
    setExcelStep(4);

    onAddAuditLog(
      'Importación Excel Inventario',
      'Inventario O&M',
      undefined,
      'Varias Plantas',
      `Se procesó archivo de conciliación mensual Excel. Se aplicaron ${appliedCount} ajustes de stock en base de datos.`,
      'Alta'
    );
  };

  const handleResetExcelImport = () => {
    setExcelStep(1);
    setExcelFile(null);
    setSimulatedExcelRows([]);
    setComparisonResults([]);
  };

  // Filter Logic
  const filteredInventory = inventory.filter(item => {
    const matchPlanta = selectedPlanta === 'Todas' || item.plantaNombre === selectedPlanta || item.plantaId === selectedPlanta;
    const matchCategoria = selectedCategoria === 'Todas' || item.categoria === selectedCategoria;
    const matchSearch = item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.proveedor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchPlanta && matchCategoria && matchSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION WITH TITLE AND MAIN CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white font-mono tracking-tight flex items-center gap-2">
              ORBI Inventario O&M <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">BAJO MOVIMIENTO</span>
            </h2>
            <p className="text-[10px] text-slate-500 leading-normal max-w-xl">
              Control simplificado de repuestos e insumos de plantas solares de mantenimiento. Sincronizado automáticamente con OTs correctivas y ajustes Excel.
            </p>
          </div>
        </div>

        {/* TOP BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAutoSyncCorrectives}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
            title="Escanea OTs correctivas para detectar consumos no registrados en inventario"
          >
            <RefreshCw className="h-3.5 w-3.5 text-emerald-400" /> Sincronizar OTs Correctivas
          </button>
          
          <button
            onClick={() => {
              // Pre-fill select options for manual movement
              if(inventory.length > 0) {
                setNewMovement(prev => ({ ...prev, itemCodigo: inventory[0].codigo }));
              }
              setIsManualMovementModalOpen(true);
            }}
            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-[10px] font-mono font-bold text-indigo-400 flex items-center gap-1.5 transition-colors"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" /> Registrar Movimiento
          </button>

          <button
            onClick={() => setIsNewItemModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-[10px] font-mono font-bold text-slate-950 flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" /> Agregar Repuesto Catalogado
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex gap-2 border-b border-slate-900 pb-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'stock'
              ? 'bg-slate-900 text-emerald-400 border border-slate-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="h-4 w-4" /> Stock por Planta
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'movements'
              ? 'bg-slate-900 text-emerald-400 border border-slate-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" /> Registro de Movimientos ({movements.length})
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 relative ${
            activeTab === 'alerts'
              ? 'bg-slate-900 text-emerald-400 border border-slate-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Alertas del Ecosistema
          {activeAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
              {activeAlerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('excel')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'excel'
              ? 'bg-slate-900 text-emerald-400 border border-slate-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" /> Importación Excel Mensual
        </button>
      </div>

      {/* TAB CONTENT: STOCK POR PLANTA */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          
          {/* QUICK ALERTS TICKER */}
          {activeAlerts.filter(a => a.severity === 'high').length > 0 && (
            <div className="bg-rose-500/5 border border-rose-500/20 p-3 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-[10px] font-mono font-bold uppercase">Alertas Críticas de Disponibilidad:</span>
                <marquee className="text-xs text-rose-200/90 w-full max-w-2xl font-sans" scrollamount="3">
                  {activeAlerts.filter(a => a.severity === 'high').map(a => `${a.title} — ${a.desc}`).join(' | ')}
                </marquee>
              </div>
              <button 
                onClick={() => setActiveTab('alerts')}
                className="text-[9px] font-mono font-bold text-rose-400 hover:underline shrink-0"
              >
                Ver Alertas
              </button>
            </div>
          )}

          {/* FILTERS BAR */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por código, repuesto, proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:border-emerald-500/50 outline-none"
              />
            </div>

            <div>
              <label className="text-[9px] font-mono text-slate-500 uppercase font-black block mb-1">Filtrar Planta</label>
              <select
                value={selectedPlanta}
                onChange={(e) => setSelectedPlanta(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none"
              >
                <option value="Todas">Todas las Plantas</option>
                {plantas.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] font-mono text-slate-500 uppercase font-black block mb-1">Filtrar Categoría</label>
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none"
              >
                <option value="Todas">Todas las Categorías</option>
                <option value="Inversores">Inversores</option>
                <option value="CCTV / comunicaciones">CCTV / comunicaciones</option>
                <option value="Protecciones">Protecciones</option>
                <option value="Fusibles">Fusibles</option>
                <option value="Conectores">Conectores</option>
                <option value="Sensores">Sensores</option>
                <option value="Tracker">Tracker</option>
                <option value="Consumibles eléctricos">Consumibles eléctricos</option>
                <option value="Herramientas menores">Herramientas menores</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-right w-full">
                <span className="text-[10px] font-mono text-slate-500 block">TOTAL FILTRADO:</span>
                <span className="text-sm font-black text-white font-mono">{filteredInventory.length} ítems</span>
              </div>
            </div>
          </div>

          {/* STOCK GRID */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-900 text-slate-400">
                <tr>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Código / Repuesto</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Planta</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Categoría / Ubicación</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider text-center">Stock Actual</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider text-center">Mínimo</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider text-center">Criticidad</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider text-right">Actualizado</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                      No se encontraron repuestos catalogados con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => {
                    // Styles for states
                    const stateStyles = 
                      item.estado === 'Disponible' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : item.estado === 'Bajo Mínimo' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                    const critStyles = 
                      item.criticidad === 'Crítica' 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25 font-bold'
                        : item.criticidad === 'Alta' 
                          ? 'bg-amber-500/10 text-amber-400' 
                          : 'bg-slate-950 text-slate-400';

                    return (
                      <tr key={item.id} className="hover:bg-slate-900/35 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white text-[11px]">{item.codigo}</div>
                          <div className="text-[10px] text-slate-400 max-w-[280px] truncate">{item.descripcion}</div>
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-300 font-bold text-[11px]">{item.plantaNombre}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-slate-300 text-[10px]">{item.categoria}</div>
                          <div className="text-[9px] text-slate-500 truncate max-w-[200px]">{item.bodegaUbicacion}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-xs font-black px-2 py-1 rounded font-mono ${
                            item.stockActual === 0 
                              ? 'text-rose-400 bg-rose-500/5' 
                              : item.stockActual <= item.stockMinimo 
                                ? 'text-amber-400 bg-amber-500/5' 
                                : 'text-emerald-400'
                          }`}>
                            {item.stockActual} <span className="text-[9px] font-normal text-slate-500">{item.unidad}</span>
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-400">
                          {item.stockMinimo} {item.unidad}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded ${critStyles}`}>
                            {item.criticidad}
                          </span>
                        </td>
                        <td className="p-3 text-right text-[10px] text-slate-500">
                          {item.ultimaActualizacion}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[9px] px-2 py-1 rounded border ${stateStyles}`}>
                            {item.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB CONTENT: REGISTRO DE MOVIMIENTOS */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-900">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase font-black block">Trazabilidad de Consumos & Entradas</span>
              <p className="text-xs text-slate-300">Detalle cronológico de todos los movimientos de repuestos registrados en el sistema de O&M.</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block">TOTAL REGISTRADOS:</span>
              <span className="text-sm font-black text-white font-mono">{movements.length} transacciones</span>
            </div>
          </div>

          <div className="bg-slate-900/20 border border-slate-900 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-900 text-slate-400">
                <tr>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Fecha / ID Mov</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Repuesto / Item</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Planta</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider text-center">Tipo Movimiento</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider text-center">Cantidad</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider text-center">Stock Traza</th>
                  <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Detalle / OT Asociada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                      No se han registrado movimientos de inventario en este período.
                    </td>
                  </tr>
                ) : (
                  movements.map(mov => {
                    // Type styling
                    const typeColors = 
                      mov.tipoMovimiento === 'Consumo por OT' 
                        ? 'text-rose-400 bg-rose-500/5 border-rose-500/10' 
                        : mov.tipoMovimiento === 'Ingreso de repuesto'
                          ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
                          : mov.tipoMovimiento === 'Traslado entre plantas'
                            ? 'text-indigo-400 bg-indigo-500/5 border-indigo-500/10'
                            : 'text-amber-400 bg-amber-500/5 border-amber-500/10';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-900/35 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white text-[11px]">{mov.fecha}</div>
                          <div className="text-[9px] text-slate-500">{mov.id}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-300 text-[11px]">{mov.itemCodigo}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[220px]">{mov.itemDescripcion}</div>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-300 font-bold text-[11px]">{mov.plantaNombre}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[9px] px-2 py-1 rounded border ${typeColors}`}>
                            {mov.tipoMovimiento}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-white">
                          {mov.tipoMovimiento === 'Consumo por OT' || mov.tipoMovimiento === 'Baja por daño' || mov.tipoMovimiento === 'Traslado entre plantas' ? '-' : '+'}{mov.cantidad}
                        </td>
                        <td className="p-3 text-center text-[10px] text-slate-500">
                          {mov.stockAnterior} → <span className="text-slate-300 font-bold">{mov.stockFinal}</span>
                        </td>
                        <td className="p-3">
                          {mov.otAsociada ? (
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                                OT: {mov.otAsociada}
                              </span>
                              {mov.tecnico && (
                                <span className="text-[9px] text-slate-400 flex items-center gap-1">
                                  <User className="h-2.5 w-2.5" /> {mov.tecnico}
                                </span>
                              )}
                            </div>
                          ) : (
                            mov.tecnico && (
                              <div className="text-[9px] text-slate-500 mb-1 flex items-center gap-1">
                                <User className="h-2.5 w-2.5" /> Registró: {mov.tecnico}
                              </div>
                            )
                          )}
                          <div className="text-[10px] text-slate-400 max-w-[320px] truncate" title={mov.observacion}>
                            {mov.observacion}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB CONTENT: ALERTAS DEL ECOSISTEMA */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900">
            <h3 className="text-xs font-mono font-bold text-white uppercase">Tablero de Alertas Tempranas O&M</h3>
            <p className="text-[11px] text-slate-400">Detección predictiva de quiebres de stock, abandono de actualización documental y discrepancias físicas.</p>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/10 border border-slate-900 rounded-xl">
              <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-white font-bold text-sm">Ecosistema Seguro & Abastecido</h4>
              <p className="text-xs text-slate-500 mt-1">No se detectaron alertas operacionales ni desviaciones en los inventarios de las 5 plantas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAlerts.map((alert, index) => {
                const isHigh = alert.severity === 'high';
                const cardBorder = isHigh ? 'border-rose-500/25 bg-rose-500/5' : 'border-slate-850 bg-slate-900/30';
                const badgeStyle = isHigh ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30';

                return (
                  <div key={index} className={`p-4 rounded-xl border flex gap-3.5 transition-all hover:scale-101 ${cardBorder}`}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isHigh ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded ${badgeStyle}`}>
                          {isHigh ? 'Crítica' : 'Precaución'}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">ID: {alert.type}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white font-mono">{alert.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">{alert.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT: IMPORTACIÓN EXCEL MOCK */}
      {activeTab === 'excel' && (
        <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-6 space-y-6">
          
          {/* HEADER DEL WIZARD */}
          <div className="border-b border-slate-850 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-mono font-black text-white uppercase flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Conciliación Mensual por Carga Excel
              </h3>
              <p className="text-[10px] text-slate-500">Permite simular la subida mensual del consolidado de bodega O&M para cotejar y actualizar stock físico.</p>
            </div>
            
            {/* STEPS INDICATOR */}
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className={`px-2 py-0.5 rounded ${excelStep === 1 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-500'}`}>1. Carga</span>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className={`px-2 py-0.5 rounded ${excelStep === 2 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-500'}`}>2. Mapeo</span>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className={`px-2 py-0.5 rounded ${excelStep === 3 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-500'}`}>3. Análisis</span>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className={`px-2 py-0.5 rounded ${excelStep === 4 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-500'}`}>4. Aplicado</span>
            </div>
          </div>

          {/* STEP 1: CARGA DE ARCHIVO */}
          {excelStep === 1 && (
            <div className="space-y-4">
              <div 
                onDragEnter={handleExcelDrag}
                onDragOver={handleExcelDrag}
                onDragLeave={handleExcelDrag}
                onDrop={handleExcelDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                  excelDragActive 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-slate-800 hover:border-slate-750 bg-slate-950/40'
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-white font-mono">Arrastre el consolidado mensual Excel aquí</h4>
                <p className="text-[10px] text-slate-500 mt-1">Formato soportado: .xlsx, .xls, .csv recopilado por bodegueros en terreno</p>
                
                <div className="mt-5">
                  <label className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-lg text-xs font-mono font-bold text-slate-300 cursor-pointer inline-flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Seleccionar Archivo...
                    <input 
                      type="file" 
                      accept=".xlsx,.xls,.csv" 
                      onChange={handleExcelFileSelect} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* MOCK DOWNLOAD TEMPLATE */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-white">Plantilla_Inventario_Consolidado_OM.xlsx</h5>
                    <p className="text-[9px] text-slate-500">Contiene los campos base requeridos para carga sin errores de mapeo.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const blob = new Blob(["Simulated template excel"], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'Plantilla_Inventario_Consolidado_OM.xlsx';
                    a.click();
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-[10px] font-mono text-slate-400 rounded border border-slate-800"
                >
                  Descargar Plantilla
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MAPEO DE COLUMNAS */}
          {excelStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 space-y-3">
                <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-400" /> Inteligencia ORBI: Columnas Detectadas
                </h4>
                <p className="text-[10px] text-slate-400">Verifique el emparejamiento automático detectado por el motor de importación.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase font-black">Código de Ítem</label>
                    <select
                      value={excelMapping.codigo}
                      onChange={(e) => setExcelMapping({ ...excelMapping, codigo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="CODIGO_ITEM">CODIGO_ITEM (Detectado ✓)</option>
                      <option value="ID_REPUESTO">ID_REPUESTO</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase font-black">Descripción</label>
                    <select
                      value={excelMapping.descripcion}
                      onChange={(e) => setExcelMapping({ ...excelMapping, descripcion: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="DESCRIPCION_ITEM">DESCRIPCION_ITEM (Detectado ✓)</option>
                      <option value="NOMBRE">NOMBRE</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase font-black">Stock Físico</label>
                    <select
                      value={excelMapping.stock}
                      onChange={(e) => setExcelMapping({ ...excelMapping, stock: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="STOCK_FISICO">STOCK_FISICO (Detectado ✓)</option>
                      <option value="CANTIDAD">CANTIDAD</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-slate-500 uppercase font-black">Planta Destino</label>
                    <select
                      value={excelMapping.planta}
                      onChange={(e) => setExcelMapping({ ...excelMapping, planta: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="CENTRO_PLANTA">CENTRO_PLANTA (Detectado ✓)</option>
                      <option value="BODEGA_PLANTA">BODEGA_PLANTA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PREVIEW IN MAPPING STEP */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-mono text-slate-500 uppercase font-black">Vista Previa Datos (Filas de Ejemplo)</h5>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 overflow-x-auto">
                  <table className="w-full text-left text-[10px] text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 font-bold">
                        <th className="pb-1">{excelMapping.codigo}</th>
                        <th className="pb-1">{excelMapping.descripcion}</th>
                        <th className="pb-1">{excelMapping.stock}</th>
                        <th className="pb-1">{excelMapping.planta}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-mono">
                      {simulatedExcelRows.slice(0, 3).map((r, i) => (
                        <tr key={i}>
                          <td className="py-1.5 text-white">{r.CODIGO_ITEM}</td>
                          <td className="py-1.5">{r.DESCRIPCION_ITEM}</td>
                          <td className="py-1.5 text-emerald-400 font-bold">{r.STOCK_FISICO}</td>
                          <td className="py-1.5">{r.CENTRO_PLANTA}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button 
                  onClick={handleResetExcelImport}
                  className="px-4 py-2 border border-slate-800 text-xs font-mono text-slate-400 hover:bg-slate-950 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCompareExcel}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono rounded-lg flex items-center gap-1.5"
                >
                  Procesar & Comparar Stocks <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: COMPARACION Y ANALISIS DE DIFERENCIAS */}
          {excelStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-900">
                <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <Info className="h-4 w-4 text-indigo-400" /> Resultados del Análisis de Discrepancias
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  Se cruzaron los datos físicos del archivo contra la base activa. Revise los cambios sugeridos antes de confirmar.
                </p>
              </div>

              {/* TABLE OF COMPARISONS */}
              <div className="bg-slate-950 rounded-xl border border-slate-900 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/50 border-b border-slate-850 text-slate-400">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Planta</th>
                      <th className="p-2.5 text-center">Stock Actual</th>
                      <th className="p-2.5 text-center">Físico Excel</th>
                      <th className="p-2.5 text-center">Diferencia</th>
                      <th className="p-2.5 text-center">Diagnóstico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {comparisonResults.map((res, i) => {
                      // Diagnostico Styling
                      let badge = 'bg-slate-900 text-slate-400 border-slate-800';
                      if (res.diferenciaText === 'Ingreso') badge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      if (res.diferenciaText === 'Consumo') badge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                      if (res.diferenciaText === 'Ítem nuevo') badge = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                      if (res.diferenciaText === 'Stock bajo') badge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                      if (res.diferenciaText === 'Requiere revisión') badge = 'bg-rose-500 text-slate-950 font-bold border-transparent';

                      const diffVal = res.qtyDiff;
                      const formattedDiff = diffVal > 0 ? `+${diffVal}` : diffVal;

                      return (
                        <tr key={i} className="hover:bg-slate-900/30">
                          <td className="p-2.5">
                            <div className="font-bold text-white text-[11px]">{res.CODIGO_ITEM}</div>
                            <div className="text-[10px] text-slate-400">{res.DESCRIPCION_ITEM}</div>
                          </td>
                          <td className="p-2.5 text-center text-slate-300 font-bold">{res.CENTRO_PLANTA}</td>
                          <td className="p-2.5 text-center text-slate-400">{res.stockAnterior}</td>
                          <td className="p-2.5 text-center font-bold text-white">{res.STOCK_FISICO}</td>
                          <td className={`p-2.5 text-center font-bold ${diffVal > 0 ? 'text-emerald-400' : diffVal < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                            {formattedDiff}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`text-[9px] px-2 py-0.5 rounded border ${badge}`}>
                              {res.diferenciaText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button 
                  onClick={() => setExcelStep(2)}
                  className="px-4 py-2 border border-slate-800 text-xs font-mono text-slate-400 hover:bg-slate-950 rounded-lg"
                >
                  Volver al Mapeo
                </button>
                <button 
                  onClick={handleApplyExcelChanges}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs font-mono rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
                >
                  <Check className="h-4 w-4" /> Conciliar e Inyectar Stocks
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CARGA EXITOSA */}
          {excelStep === 4 && (
            <div className="p-8 text-center space-y-4 animate-fade-in max-w-md mx-auto">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-black text-white font-mono">¡Conciliación Completada Exitosamente!</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                El consolidado de bodega fue procesado y cruzado de forma segura. El stock físico actual fue inyectado en el sistema y se generaron los asientos contables en el registro de movimientos.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => {
                    setInventory(loadInventory());
                    setMovements(loadInventoryMovements());
                    setActiveTab('stock');
                    handleResetExcelImport();
                  }}
                  className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 hover:bg-slate-850 rounded-lg transition-colors"
                >
                  Volver a Stock de Planta
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL: REGISTRAR MANUALMENTE UN MOVIMIENTO */}
      {isManualMovementModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setIsManualMovementModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-indigo-400" /> Registrar Movimiento de Stock
              </h3>
              <p className="text-[10px] text-slate-500">Afecta la disponibilidad física del repuesto seleccionado en tiempo real.</p>
            </div>

            <form onSubmit={handleRegisterManualMovement} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Repuesto / Insumo</label>
                <select
                  value={newMovement.itemCodigo}
                  onChange={(e) => setNewMovement({ ...newMovement, itemCodigo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                >
                  {inventory.map(item => (
                    <option key={item.id} value={item.codigo}>
                      {item.codigo} - {item.descripcion} ({item.plantaNombre}) [Disp: {item.stockActual}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Tipo de Operación</label>
                  <select
                    value={newMovement.tipoMovimiento}
                    onChange={(e) => setNewMovement({ ...newMovement, tipoMovimiento: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="Ingreso de repuesto">Ingreso de repuesto</option>
                    <option value="Consumo por OT">Consumo por OT</option>
                    <option value="Baja por daño">Baja por daño</option>
                    <option value="Traslado entre plantas">Traslado entre plantas</option>
                    <option value="Ajuste mensual Excel">Ajuste mensual Excel</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={newMovement.cantidad}
                    onChange={(e) => setNewMovement({ ...newMovement, cantidad: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* DESTINATION PLANT FOR TRANSLATIONS */}
              {newMovement.tipoMovimiento === 'Traslado entre plantas' && (
                <div className="bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10 space-y-2 animate-fade-in">
                  <label className="text-[10px] font-mono text-indigo-400 uppercase font-black block">Planta Destino del Traslado</label>
                  <select
                    value={newMovement.plantaDestinoId}
                    onChange={(e) => setNewMovement({ ...newMovement, plantaDestinoId: e.target.value })}
                    className="w-full bg-slate-950 border border-indigo-500/20 rounded p-2 text-xs text-white focus:border-indigo-400 outline-none"
                    required
                  >
                    <option value="">-- Seleccionar planta destino --</option>
                    {plantas.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.zona})</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-slate-500 italic">Si el repuesto no está catalogado en la planta destino, el sistema creará un ítem automáticamente con el stock trasladado.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">OT Asociada (Opcional)</label>
                  <select
                    value={newMovement.otAsociada}
                    onChange={(e) => setNewMovement({ ...newMovement, otAsociada: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                  >
                    <option value="">-- Sin OT --</option>
                    {ots.map(o => (
                      <option key={o.codigo} value={o.codigo}>
                        {o.codigo} - {o.activo} ({o.plantaNombre})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Registra</label>
                  <input
                    type="text"
                    disabled
                    value={`${activeUserName} (${userRole})`}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-slate-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Observaciones</label>
                <textarea
                  value={newMovement.observacion}
                  onChange={(e) => setNewMovement({ ...newMovement, observacion: e.target.value })}
                  placeholder="Detalle el motivo técnico de la operación o despacho..."
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none min-h-[60px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualMovementModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-xs font-mono text-slate-400 hover:bg-slate-950 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono rounded-lg flex items-center gap-1"
                >
                  <Check className="h-4 w-4" /> Registrar Transacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR NUEVO REPUESTO AL CATALOGO */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setIsNewItemModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-emerald-400" /> Ingresar Repuesto Catalogado
              </h3>
              <p className="text-[10px] text-slate-500">Crea un nuevo ítem de catálogo asignado a una bodega física por planta.</p>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Código del Item *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FUS-CANT-05"
                    value={newItem.codigo}
                    onChange={(e) => setNewItem({ ...newItem, codigo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Categoría *</label>
                  <select
                    value={newItem.categoria}
                    onChange={(e) => setNewItem({ ...newItem, categoria: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="Inversores">Inversores</option>
                    <option value="CCTV / comunicaciones">CCTV / comunicaciones</option>
                    <option value="Protecciones">Protecciones</option>
                    <option value="Fusibles">Fusibles</option>
                    <option value="Conectores">Conectores</option>
                    <option value="Sensores">Sensores</option>
                    <option value="Tracker">Tracker</option>
                    <option value="Consumibles eléctricos">Consumibles eléctricos</option>
                    <option value="Herramientas menores">Herramientas menores</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Descripción del Repuesto *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fusible DC cilíndrico gPV 1000V 15A"
                  value={newItem.descripcion}
                  onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Planta *</label>
                  <select
                    required
                    value={newItem.plantaId}
                    onChange={(e) => setNewItem({ ...newItem, plantaId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="">-- Seleccionar Planta --</option>
                    {plantas.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Ubicación Bodega / Estante</label>
                  <input
                    type="text"
                    placeholder="e.g. Bodega Principal - Estante B2"
                    value={newItem.bodegaUbicacion}
                    onChange={(e) => setNewItem({ ...newItem, bodegaUbicacion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.stockActual}
                    onChange={(e) => setNewItem({ ...newItem, stockActual: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.stockMinimo}
                    onChange={(e) => setNewItem({ ...newItem, stockMinimo: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Unidad</label>
                  <input
                    type="text"
                    placeholder="e.g. Unidad, Caja, Mt"
                    value={newItem.unidad}
                    onChange={(e) => setNewItem({ ...newItem, unidad: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Criticidad O&M</label>
                  <select
                    value={newItem.criticidad}
                    onChange={(e) => setNewItem({ ...newItem, criticidad: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="Baja">Baja (Consumibles comunes)</option>
                    <option value="Media">Media (Repuestos comunes)</option>
                    <option value="Alta">Alta (Críticos con despacho lento)</option>
                    <option value="Crítica">Crítica (Falla detiene generación)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Proveedor Predeterminado</label>
                  <input
                    type="text"
                    placeholder="ABB, Suntech, Staubli..."
                    value={newItem.proveedor}
                    onChange={(e) => setNewItem({ ...newItem, proveedor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-xs font-mono text-slate-400 hover:bg-slate-950 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs font-mono rounded-lg flex items-center gap-1"
                >
                  <Check className="h-4 w-4" /> Registrar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
