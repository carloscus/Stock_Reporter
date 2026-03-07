import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRIMARY_COLOR = 'FF13DAEC';
const RED_BG = 'FFFEE2E2';
const YELLOW_BG = 'FFFEF3C7';
const GREEN_BG = 'FFD1FAE5';

const normalizeSKU = (sku) => String(sku || '').trim().replace(/^0+/, '');

// Estilos profesionales con el nuevo orden de columnas optimizado
const applyProfessionalStyles = (worksheet) => {
  worksheet.columns = [
    { header: '#', key: 'item', width: 6 },
    { header: 'Código', key: 'sku', width: 12 },
    { header: 'EAN', key: 'ean', width: 18 },
    { header: 'Nombre del Producto', key: 'nombre', width: 55 },
    { header: 'U. x Caja', key: 'unBx', width: 10 },
    { header: 'Stock VES', key: 'stock', width: 12 },
    { header: 'Alerta', key: 'alerta', width: 8 }
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_COLOR } };
    cell.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { 
      top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'medium'}, right: {style:'thin'} 
    };
  });

  worksheet.autoFilter = { from: 'A1', to: 'G1' };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
};

// Función para añadir datos con el índice reiniciado por hoja
const addDataToSheet = (worksheet, data) => {
  data.forEach((p, index) => {
    const row = worksheet.addRow([
      index + 1, // Reinicio del índice: empieza en 1 para cada hoja
      p.sku,
      p.ean,
      p.nombre,
      p.unBx,
      p.stock,
      p.alerta
    ]);

    // Aplicar semáforo de color a la celda de Stock
    const stockCell = row.getCell(6);
    stockCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: p.bgColor } };
    stockCell.font = { bold: true };
    stockCell.alignment = { horizontal: 'center' };

    // Centrar Alerta
    row.getCell(7).alignment = { horizontal: 'center' };
    
    // Bordes sutiles para las filas
    row.eachCell(cell => {
      cell.border = {
        bottom: {style:'hair'},
        right: {style:'hair'}
      };
    });
  });
};

async function generateOptimizedReport() {
  try {
    console.log('🚀 Generando Reporte Optimizado (Índices reiniciados y nuevo orden)...');

    const productosPath = path.join(__dirname, '..', 'Data', 'productos.json');
    const { productos, metadata } = JSON.parse(fs.readFileSync(productosPath, 'utf8'));

    const stockPath = path.join(__dirname, '..', 'Data', 'reporte_stock_hoy.xlsx');
    const stockWorkbook = xlsx.readFile(stockPath);
    const stockRaw = xlsx.utils.sheet_to_json(stockWorkbook.Sheets[stockWorkbook.SheetNames[0]], { header: 1 });
    
    const stockMap = new Map();
    stockRaw.forEach((row, idx) => {
      if (idx === 0) return;
      const sku = normalizeSKU(row[1]);
      const disponible = parseInt(row[18], 10) || 0;
      if (sku) stockMap.set(sku, (stockMap.get(sku) || 0) + disponible);
    });

    const fullData = productos.map(p => {
      const stock = stockMap.get(p.sku) || 0;
      let color = GREEN_BG, alerta = '🟢';
      if (stock === 0) { color = RED_BG; alerta = '🔴'; }
      else if (stock < 10) { color = YELLOW_BG; alerta = '🟡'; }
      return { ...p, stock, alerta, bgColor: color };
    });

    const workbook = new ExcelJS.Workbook();
    
    // --- HOJA RESUMEN ---
    const wsResumen = workbook.addWorksheet('Resumen');
    wsResumen.columns = [{ width: 30 }, { width: 20 }];
    wsResumen.addRow(['REPORTE DE INVENTARIO']).font = { bold: true, size: 16, color: { argb: 'FF007070' } };
    wsResumen.addRow(['Almacén:', 'VES (Villa El Salvador)']);
    wsResumen.addRow(['Generado el:', new Date().toLocaleString('es-PE')]);
    wsResumen.addRow([]);
    
    const headerKPI = wsResumen.addRow(['LÍNEA / SEGMENTO', 'STOCK TOTAL']);
    headerKPI.font = { bold: true };
    headerKPI.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } });

    metadata.lineas.forEach(lin => {
      const total = fullData.filter(p => p.linea === lin).reduce((a, b) => a + b.stock, 0);
      wsResumen.addRow([lin, total]);
    });

    // --- HOJAS POR LÍNEA (Contador reiniciado) ---
    metadata.lineas.forEach(lin => {
      const sheetName = lin.charAt(0) + lin.slice(1).toLowerCase();
      const ws = workbook.addWorksheet(sheetName.substring(0, 31));
      applyProfessionalStyles(ws);
      
      const filteredData = fullData.filter(p => p.linea === lin);
      addDataToSheet(ws, filteredData);
    });

    // --- HOJA ALERTAS (Contador reiniciado) ---
    const wsAlertas = workbook.addWorksheet('Alertas Stock');
    applyProfessionalStyles(wsAlertas);
    const dataAlertas = fullData.filter(p => p.stock < 10);
    addDataToSheet(wsAlertas, dataAlertas);

    // Guardar Reportes y JSON para el buscador
    const fechaISO = new Date().toISOString().split('T')[0];
    const fileName = `StockReporter_${fechaISO}_TODOS.xlsx`;
    const reportPaths = [
      path.join(__dirname, '..', 'reports', fileName),
      path.join(__dirname, '..', 'frontend', 'public', 'reports', fileName)
    ];

    const jsonPaths = [
      path.join(__dirname, '..', 'Data', 'productos_con_stock.json'),
      path.join(__dirname, '..', 'frontend', 'public', 'productos_con_stock.json')
    ];

    for (const p of reportPaths) {
      if (!fs.existsSync(path.dirname(p))) fs.mkdirSync(path.dirname(p), { recursive: true });
      await workbook.xlsx.writeFile(p);
    }

    const outputJSON = {
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalProducts: fullData.length,
        almacen: 'VES'
      },
      productos: fullData
    };

    const jsonData = JSON.stringify(outputJSON, null, 2);
    for (const p of jsonPaths) {
      if (!fs.existsSync(path.dirname(p))) fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, jsonData);
    }

    console.log(`✅ Reporte Profesional y JSON de búsqueda generados.`);

  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  }
}

generateOptimizedReport();
