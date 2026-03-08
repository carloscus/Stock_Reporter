import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// COLORES Y ESTILOS
// ============================================
const PRIMARY_COLOR = 'FF13DAEC';
const SECONDARY_COLOR = 'FF0E7490';
const DARK_COLOR = 'FF0F172A';
const LIGHT_GRAY = 'FFF1F5F9';
const RED_BG = 'FFFEE2E2';
const YELLOW_BG = 'FFFEF3C7';
const GREEN_BG = 'FFD1FAE5';
const RED_ARROW = '✗ AGOTADO';
const YELLOW_ARROW = '⚠ BAJO';
const GREEN_ARROW = '✓ OK';

// Colores para líneas
const LINE_COLORS = [
  'FF3B82F6', 'FF10B981', 'FFF59E0B', 'FFEF4444',
  'FF8B5CF6', 'FFEC4899', 'FF06B6D4', 'FFF97316',
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================
const getFechaPeru = () => {
  const ahora = new Date();
  return ahora.toLocaleString('es-PE', { 
    timeZone: 'America/Lima',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
};

const applyProfessionalStyles = (worksheet) => {
  worksheet.columns = [
    { header: '#', key: 'item', width: 5 },
    { header: 'Código', key: 'sku', width: 12 },
    { header: 'EAN', key: 'ean', width: 18 },
    { header: 'Nombre del Producto', key: 'nombre', width: 45 },
    { header: 'U. x Caja', key: 'unBx', width: 10 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Estado', key: 'estado', width: 12 }
  ];
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  worksheet.autoFilter = { from: 'A1', to: 'G1' };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
};

const addDataToSheet = (worksheet, data) => {
  data.forEach((p, index) => {
    const row = worksheet.addRow([index + 1, p.sku, p.ean, p.nombre, p.unBx, p.stock, p.estado]);
    row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: p.bgColor } };
    row.getCell(6).font = { bold: true, size: 12 };
    row.getCell(6).alignment = { horizontal: 'center' };
    row.getCell(7).value = p.estado;
    row.getCell(7).font = { bold: true, size: 12, color: { argb: p.fontColor } };
    row.getCell(7).alignment = { horizontal: 'center' };
  });
};

// Función para crear barra de progreso visual en Excel
const addProgressBar = (ws, row, col, percentage, color) => {
  // Barra de fondo (gris)
  ws.getCell(row, col).value = '';
  ws.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  
  // Barra de progreso (color)
  if (percentage > 0) {
    const progressCol = col + 1;
    ws.getCell(row, progressCol).value = '';
    ws.getCell(row, progressCol).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    ws.getCell(row, progressCol).alignment = { horizontal: 'left' };
    
    // Combinar celdas para la barra
    ws.mergeCells(row, col, row, col + 1);
  }
};

// ============================================
// DASHBOARD PROFESIONAL
// ============================================
const createDashboard = (ws, fullData, masterMeta) => {
  // Configurar columnas
  ws.getColumn('A').width = 30;
  ws.getColumn('B').width = 18;
  ws.getColumn('C').width = 18;
  ws.getColumn('D').width = 18;
  ws.getColumn('E').width = 18;
  ws.getColumn('F').width = 15;
  
  // ============================================
  // ENCABEZADO PRINCIPAL
  // ============================================
  ws.mergeCells('A1:F1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'STOCKPULSE - DASHBOARD DE INVENTARIO';
  titleCell.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SECONDARY_COLOR } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 35;
  
  // Fecha y almacén
  ws.mergeCells('A2:F2');
  const dateCell = ws.getCell('A2');
  dateCell.value = `Almacén: VES | Actualizado: ${getFechaPeru()}`;
  dateCell.font = { size: 10, color: { argb: 'FF64748B' } };
  dateCell.alignment = { horizontal: 'right' };
  ws.getRow(2).height = 18;
  
  // ============================================
  // SECCIÓN: KPIs PRINCIPALES (3 columnas)
  // ============================================
  const kpiRow = 4;
  ws.mergeCells(`A${kpiRow}:C${kpiRow}`);
  const kpiHeader = ws.getCell(`A${kpiRow}`);
  kpiHeader.value = 'INDICADORES CLAVE DE RENDIMIENTO';
  kpiHeader.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_COLOR } };
  kpiHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(kpiRow).height = 25;
  
  // Calcular métricas
  const totalCodigos = fullData.length;
  const totalUnidades = fullData.reduce((acc, p) => acc + p.stock, 0);
  const countSinStock = fullData.filter(p => p.stock === 0).length;
  const countBajoStock = fullData.filter(p => p.stock > 0 && p.stock < (p.unBx || 1) * 5).length;
  const countOK = totalCodigos - countSinStock - countBajoStock;
  
  const pctSinStock = ((countSinStock / totalCodigos) * 100).toFixed(1);
  const pctBajoStock = ((countBajoStock / totalCodigos) * 100).toFixed(1);
  const pctOK = ((countOK / totalCodigos) * 100).toFixed(1);
  const stockPromedio = Math.round(totalUnidades / totalCodigos);
  
  // Stock total de productos con stock
  const stockConStock = fullData.filter(p => p.stock > 0).reduce((acc, p) => acc + p.stock, 0);
  const stockMaximo = Math.max(...fullData.map(p => p.stock));
  
  // KPIs - Fila 5: Tarjetas de métricas
  const kpiStartRow = kpiRow + 1;
  
  // KPI 1: Total Códigos
  ws.getCell(`A${kpiStartRow}`).value = 'Total SKUs';
  ws.getCell(`A${kpiStartRow}`).font = { bold: true, size: 10 };
  ws.getCell(`A${kpiStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
  ws.getCell(`B${kpiStartRow}`).value = totalCodigos;
  ws.getCell(`B${kpiStartRow}`).font = { bold: true, size: 14, color: { argb: SECONDARY_COLOR } };
  ws.getCell(`B${kpiStartRow}`).alignment = { horizontal: 'center' };
  ws.getCell(`B${kpiStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  
  // KPI 2: Stock Total
  ws.getCell(`C${kpiStartRow}`).value = 'Stock Total';
  ws.getCell(`C${kpiStartRow}`).font = { bold: true, size: 10 };
  ws.getCell(`C${kpiStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
  ws.getCell(`D${kpiStartRow}`).value = totalUnidades.toLocaleString('es-PE');
  ws.getCell(`D${kpiStartRow}`).font = { bold: true, size: 14, color: { argb: SECONDARY_COLOR } };
  ws.getCell(`D${kpiStartRow}`).alignment = { horizontal: 'center' };
  ws.getCell(`D${kpiStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  
  // KPI 3: Stock Promedio
  ws.getCell(`E${kpiStartRow}`).value = 'Stock Promedio';
  ws.getCell(`E${kpiStartRow}`).font = { bold: true, size: 10 };
  ws.getCell(`E${kpiStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
  ws.getCell(`F${kpiStartRow}`).value = stockPromedio.toLocaleString('es-PE');
  ws.getCell(`F${kpiStartRow}`).font = { bold: true, size: 14, color: { argb: SECONDARY_COLOR } };
  ws.getCell(`F${kpiStartRow}`).alignment = { horizontal: 'center' };
  ws.getCell(`F${kpiStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  ws.getRow(kpiStartRow).height = 28;
  
  // ============================================
  // SECCIÓN: SALUD DEL INVENTARIO (Con barras visuales)
  // ============================================
  const saludRow = kpiStartRow + 2;
  ws.mergeCells(`A${saludRow}:F${saludRow}`);
  const saludHeader = ws.getCell(`A${saludRow}`);
  saludHeader.value = 'SALUD DEL INVENTARIO';
  saludHeader.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  saludHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_COLOR } };
  saludHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(saludRow).height = 25;
  
  const saludStartRow = saludRow + 1;
  
  // ===== FILA: SKUs OK (Verde) =====
  ws.getCell(`A${saludStartRow}`).value = 'SKUs OK (Con stock adecuado)';
  ws.getCell(`A${saludStartRow}`).font = { bold: true, size: 10 };
  ws.getCell(`B${saludStartRow}`).value = countOK;
  ws.getCell(`B${saludStartRow}`).font = { bold: true, size: 12, color: { argb: 'FF059669' } };
  ws.getCell(`B${saludStartRow}`).alignment = { horizontal: 'center' };
  ws.getCell(`B${saludStartRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } };
  
  ws.getCell(`C${saludStartRow}`).value = pctOK + '%';
  ws.getCell(`C${saludStartRow}`).font = { bold: true, size: 12, color: { argb: 'FF059669' } };
  ws.getCell(`C${saludStartRow}`).alignment = { horizontal: 'center' };
  
  // Barra de progreso OK
  const okBarWidth = Math.round(parseFloat(pctOK) * 0.5);
  ws.getCell(`D${saludStartRow}`).value = '█'.repeat(okBarWidth) + '░'.repeat(50 - okBarWidth);
  ws.getCell(`D${saludStartRow}`).font = { size: 10, color: { argb: 'FF059669' } };
  ws.getCell(`D${saludStartRow}`).alignment = { horizontal: 'left' };
  ws.getRow(saludStartRow).height = 22;
  
  // ===== FILA: Bajo Stock (Amarillo) =====
  const bajoRow = saludStartRow + 1;
  ws.getCell(`A${bajoRow}`).value = 'Bajo Stock (Necesita reposición)';
  ws.getCell(`A${bajoRow}`).font = { bold: true, size: 10 };
  ws.getCell(`B${bajoRow}`).value = countBajoStock;
  ws.getCell(`B${bajoRow}`).font = { bold: true, size: 12, color: { argb: 'FFD97706' } };
  ws.getCell(`B${bajoRow}`).alignment = { horizontal: 'center' };
  ws.getCell(`B${bajoRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW_BG } };
  
  ws.getCell(`C${bajoRow}`).value = pctBajoStock + '%';
  ws.getCell(`C${bajoRow}`).font = { bold: true, size: 12, color: { argb: 'FFD97706' } };
  ws.getCell(`C${bajoRow}`).alignment = { horizontal: 'center' };
  
  // Barra de progreso Bajo Stock
  const bajoBarWidth = Math.round(parseFloat(pctBajoStock) * 0.5);
  ws.getCell(`D${bajoRow}`).value = '█'.repeat(bajoBarWidth) + '░'.repeat(50 - bajoBarWidth);
  ws.getCell(`D${bajoRow}`).font = { size: 10, color: { argb: 'FFD97706' } };
  ws.getCell(`D${bajoRow}`).alignment = { horizontal: 'left' };
  ws.getRow(bajoRow).height = 22;
  
  // ===== FILA: Agotados (Rojo) =====
  const agotoRow = bajoRow + 1;
  ws.getCell(`A${agotoRow}`).value = 'Agotados (URGENTE)';
  ws.getCell(`A${agotoRow}`).font = { bold: true, size: 10 };
  ws.getCell(`B${agotoRow}`).value = countSinStock;
  ws.getCell(`B${agotoRow}`).font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
  ws.getCell(`B${agotoRow}`).alignment = { horizontal: 'center' };
  ws.getCell(`B${agotoRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_BG } };
  
  ws.getCell(`C${agotoRow}`).value = pctSinStock + '%';
  ws.getCell(`C${agotoRow}`).font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
  ws.getCell(`C${agotoRow}`).alignment = { horizontal: 'center' };
  
  // Barra de progreso Agotados
  const agotoBarWidth = Math.round(parseFloat(pctSinStock) * 0.5);
  ws.getCell(`D${agotoRow}`).value = '█'.repeat(agotoBarWidth) + '░'.repeat(50 - agotoBarWidth);
  ws.getCell(`D${agotoRow}`).font = { size: 10, color: { argb: 'FFDC2626' } };
  ws.getCell(`D${agotoRow}`).alignment = { horizontal: 'left' };
  ws.getRow(agotoRow).height = 22;
  
  // ===== ALERTA VISUAL SI HAY PROBLEMAS =====
  if (countSinStock > 0 || countBajoStock > 0) {
    const alertRow = agotoRow + 1;
    ws.mergeCells(`A${alertRow}:F${alertRow}`);
    const alertCell = ws.getCell(`A${alertRow}`);
    
    if (countSinStock > 10) {
      alertCell.value = '⚠️ ALERTA: Más de 10 SKUs agotados. Requiere atención inmediata.';
      alertCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      alertCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
    } else if (countBajoStock > 50) {
      alertCell.value = '⚠️ AVISO: Más de 50 SKUs con bajo stock. Considerar reposición.';
      alertCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      alertCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };
    } else {
      alertCell.value = 'ℹ️ INFO: Revisar productos en estado crítico para reposición.';
      alertCell.font = { size: 10, color: { argb: 'FF64748B' } };
      alertCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
    }
    alertCell.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(alertRow).height = 25;
  }
  
  // ============================================
  // SECCIÓN: DETALLE POR LÍNEA
  // ============================================
  const lineaRow = agotoRow + 3;
  ws.mergeCells(`A${lineaRow}:F${lineaRow}`);
  const lineaHeader = ws.getCell(`A${lineaRow}`);
  lineaHeader.value = 'RESUMEN POR LÍNEA';
  lineaHeader.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  lineaHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_COLOR } };
  lineaHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(lineaRow).height = 25;
  
  // Encabezados de tabla
  const headersRow = lineaRow + 1;
  const headers = ['Línea', 'SKUs', 'Unidades', '% Part.', 'Stock Prom.', 'Estado'];
  headers.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    ws.getCell(`${col}${headersRow}`).value = h;
    ws.getCell(`${col}${headersRow}`).font = { bold: true, size: 10 };
    ws.getCell(`${col}${headersRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    ws.getCell(`${col}${headersRow}`).alignment = { horizontal: 'center' };
  });
  ws.getRow(headersRow).height = 20;
  
  // Datos por línea
  let currentRow = headersRow + 1;
  masterMeta.lineas.forEach((lin, index) => {
    const productosLinea = fullData.filter(p => p.linea === lin);
    const codigosLinea = productosLinea.length;
    const unidadesLinea = productosLinea.reduce((acc, p) => acc + p.stock, 0);
    const porcentaje = ((unidadesLinea / totalUnidades) * 100).toFixed(1);
    const stockPromLinea = Math.round(unidadesLinea / codigosLinea);
    
    // Calcular estado de la línea
    const sinStockLinea = productosLinea.filter(p => p.stock === 0).length;
    const bajoStockLinea = productosLinea.filter(p => p.stock > 0 && p.stock < (p.unBx || 1) * 5).length;
    let estadoLinea = 'OK';
    let estadoColor = 'FF059669';
    if (sinStockLinea > 0) { estadoLinea = '⚠️'; estadoColor = 'FFDC2626'; }
    else if (bajoStockLinea > codigosLinea * 0.3) { estadoLinea = '⚡'; estadoColor = 'FFD97706'; }
    
    const color = LINE_COLORS[index % LINE_COLORS.length];
    
    ws.getCell(`A${currentRow}`).value = lin;
    ws.getCell(`A${currentRow}`).font = { bold: true, size: 10, color: { argb: color } };
    
    ws.getCell(`B${currentRow}`).value = codigosLinea;
    ws.getCell(`B${currentRow}`).alignment = { horizontal: 'center' };
    ws.getCell(`B${currentRow}`).font = { size: 10 };
    
    ws.getCell(`C${currentRow}`).value = unidadesLinea.toLocaleString('es-PE');
    ws.getCell(`C${currentRow}`).alignment = { horizontal: 'right' };
    ws.getCell(`C${currentRow}`).font = { size: 10 };
    
    ws.getCell(`D${currentRow}`).value = porcentaje + '%';
    ws.getCell(`D${currentRow}`).alignment = { horizontal: 'center' };
    ws.getCell(`D${currentRow}`).font = { bold: true, size: 10, color: { argb: color } };
    
    ws.getCell(`E${currentRow}`).value = stockPromLinea.toLocaleString('es-PE');
    ws.getCell(`E${currentRow}`).alignment = { horizontal: 'center' };
    ws.getCell(`E${currentRow}`).font = { size: 10 };
    
    ws.getCell(`F${currentRow}`).value = estadoLinea;
    ws.getCell(`F${currentRow}`).alignment = { horizontal: 'center' };
    ws.getCell(`F${currentRow}`).font = { bold: true, size: 12, color: { argb: estadoColor } };
    
    currentRow++;
  });
  
  // Totales
  const totalRow = currentRow;
  headers.forEach((_, i) => {
    const col = String.fromCharCode(65 + i);
    ws.getCell(`${col}${totalRow}`).font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    ws.getCell(`${col}${totalRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK_COLOR } };
  });
  ws.getCell(`A${totalRow}`).value = 'TOTAL';
  ws.getCell(`B${totalRow}`).value = totalCodigos;
  ws.getCell(`B${totalRow}`).alignment = { horizontal: 'center' };
  ws.getCell(`C${totalRow}`).value = totalUnidades.toLocaleString('es-PE');
  ws.getCell(`C${totalRow}`).alignment = { horizontal: 'right' };
  ws.getCell(`D${totalRow}`).value = '100%';
  ws.getCell(`D${totalRow}`).alignment = { horizontal: 'center' };
  ws.getCell(`E${totalRow}`).value = stockPromedio.toLocaleString('es-PE');
  ws.getCell(`E${totalRow}`).alignment = { horizontal: 'center' };
  ws.getRow(totalRow).height = 22;
  
  // Pie de página
  const footerRow = totalRow + 2;
  ws.mergeCells(`A${footerRow}:F${footerRow}`);
  ws.getCell(`A${footerRow}`).value = 'StockPulse | Actualización automática | Inteligencia CIPSA';
  ws.getCell(`A${footerRow}`).font = { italic: true, size: 9, color: { argb: 'FF94A3B8' } };
  ws.getCell(`A${footerRow}`).alignment = { horizontal: 'center' };
};

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function runSnapshotUpdate() {
  try {
    console.log('🚀 Actualizando Snapshots de StockPulse...');

    const productosPath = path.join(__dirname, '..', 'Data', 'productos.json');
    const { productos, metadata: masterMeta } = JSON.parse(fs.readFileSync(productosPath, 'utf8'));

    const stockJsonPath = path.join(__dirname, '..', 'Data', 'data_stock.json');
    if (!fs.existsSync(stockJsonPath)) {
      throw new Error('No se encontró Data/data_stock.json');
    }
    const { stock: stockMap } = JSON.parse(fs.readFileSync(stockJsonPath, 'utf8'));

    const fullData = productos.map(p => {
      const stock = stockMap[p.sku] || 0;
      const minCajas = 5;
      const stockMinimo = (p.unBx || 1) * minCajas;
      let bgColor = GREEN_BG, fontColor = 'FF065F46', estado = '✓ OK';
      if (stock === 0) { bgColor = RED_BG; fontColor = 'FFDC2626'; estado = '✗ AGOTADO'; }
      else if (stock < stockMinimo) { bgColor = YELLOW_BG; fontColor = 'FFD97706'; estado = '⚠ BAJO'; }
      return { ...p, stock, estado, bgColor, fontColor };
    });

    const outputDirs = [
      path.join(__dirname, '..', 'reports'),
      path.join(__dirname, '..', 'frontend', 'public', 'reports')
    ];
    outputDirs.forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

    // Generar reportes por categoría
    const categorias = ['PELOTAS', 'ESCOLAR', 'REPRESENTADAS'];
    for (const cat of categorias) {
      const workbook = new ExcelJS.Workbook();
      const dataCat = fullData.filter(p => p.categoria === cat);

      if (dataCat.length > 0) {
        if (cat === 'ESCOLAR') {
          const lineas = [...new Set(dataCat.map(p => p.linea))];
          lineas.forEach(lin => {
            const sheet = workbook.addWorksheet(lin.substring(0, 31));
            applyProfessionalStyles(sheet);
            addDataToSheet(sheet, dataCat.filter(p => p.linea === lin));
          });
        } else {
          const sheet = workbook.addWorksheet(cat);
          applyProfessionalStyles(sheet);
          addDataToSheet(sheet, dataCat);
        }
        const fileName = `StockPulse_${cat}.xlsx`;
        for (const dir of outputDirs) await workbook.xlsx.writeFile(path.join(dir, fileName));
      }
    }

    // Generar reporte maestro con dashboard
    const wbAll = new ExcelJS.Workbook();
    const wsResumen = wbAll.addWorksheet('Resumen');
    createDashboard(wsResumen, fullData, masterMeta);

    // Hojas por línea
    masterMeta.lineas.forEach(lin => {
      const ws = wbAll.addWorksheet(lin.substring(0, 31));
      applyProfessionalStyles(ws);
      addDataToSheet(ws, fullData.filter(p => p.linea === lin));
    });

    const masterFileName = `StockPulse_TODOS.xlsx`;
    for (const dir of outputDirs) await wbAll.xlsx.writeFile(path.join(dir, masterFileName));

    // Guardar JSON
    const countSinStock = fullData.filter(p => p.stock === 0).length;
    const countBajoStock = fullData.filter(p => p.stock > 0 && p.stock < (p.unBx || 1) * 5).length;
    
    const outputJSON = {
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalProducts: fullData.length,
        almacen: 'VES',
        sinStock: countSinStock,
        bajoStock: countBajoStock,
        status: 'OPERATIVO'
      },
      productos: fullData
    };

    const jsonPaths = [
      path.join(__dirname, '..', 'Data', 'productos_con_stock.json'),
      path.join(__dirname, '..', 'frontend', 'public', 'productos_con_stock.json')
    ];
    for (const p of jsonPaths) fs.writeFileSync(p, JSON.stringify(outputJSON, null, 2));

    console.log('✅ Reportes actualizados con dashboard profesional.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runSnapshotUpdate();
