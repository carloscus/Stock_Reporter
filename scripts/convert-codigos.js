import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function convertirCodigosAJson() {
  try {
    const inputPath = path.join(__dirname, '..', 'Data', 'codigos_generales.xlsx');
    console.log(`📂 Leyendo maestro desde: ${inputPath}`);
    
    if (!fs.existsSync(inputPath)) {
      throw new Error('No se encontró el archivo codigos_generales.xlsx en /Data');
    }

    const workbook = xlsx.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    // Schema de salida alineado con la nueva taxonomía
    const productos = data.map(row => ({
      orden: row.ORDEN || row.orden,
      sku: String(row.SKU || row.sku).trim().replace(/^0+/, ''),
      nombre: (row.NOMBRE || row.nombre || '').trim(),
      ean: String(row.EAN_13 || row.ean || '').trim(),
      categoria: (row.CATEGORIA || row.categoria || '').trim().toUpperCase(), // Ej: ESCOLAR
      linea: (row.LINEA || row.linea || '').trim().toUpperCase(),          // Ej: FORROS
      unBx: parseInt(row['UN/BX'] || row.unBx, 10) || 0
    }));
    
    const outputPath = path.join(__dirname, '..', 'Data', 'productos.json');
    fs.writeFileSync(
      outputPath,
      JSON.stringify({ productos, actualizado: new Date().toISOString() }, null, 2)
    );
    
    console.log(`✅ Conversión exitosa: ${productos.length} productos guardados en productos.json`);
  } catch (error) {
    console.error('❌ Error en convert-codigos:', error.message);
    process.exit(1);
  }
}

convertirCodigosAJson();
