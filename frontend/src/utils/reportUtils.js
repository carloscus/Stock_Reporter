/**
 * @file reportUtils.js
 * @author Carlos Cusi
 * @description Utilidades para validación de datos corporativos y generación de nomenclatura
 * coherente con el sistema de archivos del servidor.
 */

/**
 * Valida si un correo pertenece al dominio corporativo de CIPSA.
 * @param {string} email - Correo a validar.
 * @returns {boolean}
 */
export const validarCorreo = (email) => {
  if (!email) return false;
  return email.toLowerCase().trim().endsWith('@cipsa.com.pe');
};

/**
 * Genera una fecha en formato ISO (YYYY-MM-DD) ajustada a la zona horaria de Lima.
 * Este formato es el estándar para la ordenación de archivos en el repositorio.
 * @returns {string} Fecha formateada.
 */
export const formatearFechaISO = () => {
  const fecha = new Date();
  const opciones = { 
    timeZone: 'America/Lima', 
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  };
  
  const partes = new Intl.DateTimeFormat('es-PE', opciones).formatToParts(fecha);
  const dia = partes.find(p => p.type === 'day').value;
  const mes = partes.find(p => p.type === 'month').value;
  const anio = partes.find(p => p.type === 'year').value;
  
  return `${anio}-${mes}-${dia}`;
};

/**
 * Construye el nombre del archivo Excel esperado según la categoría.
 * @param {string} categoria - ID de la categoría seleccionada.
 * @returns {string} Nombre del archivo (ej. StockReporter_2026-03-07_TODOS.xlsx).
 */
export const generarNombreArchivo = (categoria) => {
  const fecha = formatearFechaISO();
  const catSuffix = (categoria || 'todos').toUpperCase();
  return `StockReporter_${fecha}_${catSuffix}.xlsx`;
};
