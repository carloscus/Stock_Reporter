/**
 * @file download-stock.js
 * @author Carlos Cusi
 * @description Descarga el reporte de stock y lo convierte en data_stock.json.
 * Se utiliza axios para mayor robustez y manejo de timeouts.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STOCK_URL = process.env.STOCK_URL;

async function downloadAndConvert() {
  if (!STOCK_URL) {
    console.error('❌ ERROR: STOCK_URL no configurada en los secrets de GitHub.');
    process.exit(1);
  }

  console.log('📥 Iniciando descarga de stock desde:', STOCK_URL);

  try {
    const response = await axios.get(STOCK_URL, {
      responseType: 'arraybuffer', // Importante para recibir el archivo como buffer
      timeout: 30000, // 30 segundos de timeout
    });

    if (response.status !== 200) {
      // Axios considera los status > 299 como errores y los lanza al catch,
      // pero esta verificación doble no hace daño.
      console.error(`❌ Error de servidor: ${response.status}`);
      process.exit(1);
    }

    const buffer = response.data;
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Leer como texto formateado para preservar ceros (02210)
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
    const stockMap = {};

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
    fs.writeFileSync(outputPath, JSON.stringify({
      lastUpdate: new Date().toISOString(),
      stock: stockMap
    }, null, 2));

    console.log(`✅ Data de stock guardada: ${Object.keys(stockMap).length} productos procesados.`);

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Fallo de conexión: Timeout de 30 segundos excedido.');
    } else if (error.response) {
      // El servidor respondió con un código de error (4xx, 5xx)
      console.error(`❌ Error de servidor: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      console.error('❌ Fallo de conexión: No se recibió respuesta del servidor.');
    } else {
      // Error de configuración o de otro tipo
      console.error('❌ Error inesperado durante la descarga:', error.message);
    }
    process.exit(1);
  }
}

downloadAndConvert();
