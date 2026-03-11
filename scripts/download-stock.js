/**
 * @file download-stock.js
 * @author Carlos Cusi
 * @description Procesa el reporte de stock desde archivo local o descarga remota.
 * Se utiliza axios para descarga remota y xlsx para procesamiento.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STOCK_URL = process.env.STOCK_URL;
const LOCAL_EXCEL_PATH = process.env.LOCAL_EXCEL_PATH || 'Data/stock.xlsx';

async function processExcelFromBuffer(buffer) {
  console.log('📊 Procesando archivo Excel...');

  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Leer como texto formateado para preservar ceros (02210)
  const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
  const stockMap = {};

  console.log(`📋 Total de filas en Excel: ${rawData.length}`);

  rawData.forEach((row, index) => {
    if (index === 0) return; // Saltar cabecera

    // Mapeo basado en la estructura estándar de CIPSA:
    // Columna 1: SKU | Columna 9: Almacen | Columna 18: Disponible
    const sku = String(row[1] || '').trim(); // Sin eliminar ceros - preservar como viene
    const almacen = String(row[9] || '').trim().toUpperCase();
    const disponible = parseInt(row[18], 10) || 0;

    if (sku && (almacen === 'VES' || almacen === '')) {
      stockMap[sku] = (stockMap[sku] || 0) + disponible;
    }
  });

  const outputPath = path.join(__dirname, '..', 'Data', 'data_stock.json');
  const result = {
    lastUpdate: new Date().toISOString(),
    stock: stockMap,
    metadata: {
      totalProducts: Object.keys(stockMap).length,
      sampleProducts: Object.entries(stockMap).slice(0, 5),
      source: STOCK_URL ? 'REMOTE_URL' : 'LOCAL_FILE',
      url: STOCK_URL || 'LOCAL_FILE'
    }
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log(`✅ Data de stock guardada: ${Object.keys(stockMap).length} productos procesados.`);
  console.log(`📊 Muestra de productos:`, Object.entries(stockMap).slice(0, 3));

  // Verificar si existe el producto específico mencionado
  if (stockMap['011883'] !== undefined) {
    console.log(`🔍 Producto 011883 encontrado: ${stockMap['011883']} unidades`);
  } else {
    console.log(`⚠️  Producto 011883 NO encontrado en los datos procesados`);
  }

  return stockMap;
}

async function downloadAndConvert() {
  console.log('🔄 Iniciando procesamiento de datos de stock...');

  // Intentar primero archivo local
  const localPath = path.join(__dirname, '..', LOCAL_EXCEL_PATH);
  if (fs.existsSync(localPath)) {
    console.log(`📁 Usando archivo local: ${localPath}`);
    try {
      const buffer = fs.readFileSync(localPath);
      await processExcelFromBuffer(buffer);
      return;
    } catch (error) {
      console.log(`⚠️  Error procesando archivo local: ${error.message}`);
    }
  }

  // Si no hay archivo local o falló, intentar descarga remota
  if (!STOCK_URL) {
    console.error('❌ ERROR: Ni STOCK_URL ni archivo local encontrado.');
    console.error(`   Archivo esperado: ${localPath}`);
    console.error('   Configure STOCK_URL en secrets o suba el archivo Excel.');
    process.exit(1);
  }

  console.log('📥 Intentando descarga remota...');
  console.log('🔗 URL:', STOCK_URL);
  console.log('🔗 URL decodificada:', decodeURIComponent(STOCK_URL));

  try {
    const response = await axios.get(STOCK_URL, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    if (response.status !== 200) {
      console.error(`❌ Error de servidor: ${response.status}`);
      process.exit(1);
    }

    console.log('✅ Archivo descargado exitosamente');
    await processExcelFromBuffer(response.data);

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Fallo de conexión: Timeout de 30 segundos excedido.');
    } else if (error.response) {
      console.error(`❌ Error de servidor: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      console.error('❌ Fallo de conexión: No se recibió respuesta del servidor.');
      console.error('💡 Posible causa: URL interna no accesible desde internet');
    } else {
      console.error('❌ Error inesperado durante la descarga:', error.message);
    }
    process.exit(1);
  }
}

downloadAndConvert();
