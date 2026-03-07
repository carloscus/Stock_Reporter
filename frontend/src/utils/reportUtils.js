/**
 * @file reportUtils.js
 * @author Carlos Cusi
 * @description Utilidades para validación de datos corporativos y generación de nomenclatura
 * coherente con el sistema de archivos del servidor.
 */

/**
 * Valida si un correo pertenece al dominio corporativo de CIPSA.
 * @param {string} email - Correo a validar.
 * @returns {object} { valido: boolean, mensaje: string }
 */
export const validarCorreo = (email) => {
  if (!email) return { valido: false, mensaje: 'Ingresa tu correo corporativo' };
  const dominio = '@cipsa.com.pe';
  if (!email.toLowerCase().trim().endsWith(dominio)) {
    return { valido: false, mensaje: `Solo se permite correo ${dominio}` };
  }
  return { valido: true, mensaje: '' };
};

/**
 * Gestiona intentos de descarga y bloqueo temporal
 */
const MAX_INTENTOS = 3;
const TIEMPO_BLOQUEO = 5 * 60 * 1000; // 5 minutos

export const getBloqueo = () => {
  const bloqueo = localStorage.getItem('stock_bloqueo');
  if (!bloqueo) return null;
  const data = JSON.parse(bloqueo);
  if (Date.now() > data.hasta) {
    localStorage.removeItem('stock_bloqueo');
    localStorage.removeItem('stock_intentos');
    return null;
  }
  return data;
};

export const getIntentos = () => {
  const intentos = localStorage.getItem('stock_intentos');
  return intentos ? parseInt(intentos, 10) : 0;
};

export const incrementarIntento = () => {
  const intentos = getIntentos() + 1;
  localStorage.setItem('stock_intentos', intentos.toString());
  if (intentos >= MAX_INTENTOS) {
    const hasta = Date.now() + TIEMPO_BLOQUEO;
    localStorage.setItem('stock_bloqueo', JSON.stringify({ hasta, intentos }));
  }
  return intentos;
};

export const limpiarBloqueo = () => {
  localStorage.removeItem('stock_bloqueo');
  localStorage.removeItem('stock_intentos');
};

export const getTiempoRestante = () => {
  const bloqueo = getBloqueo();
  if (!bloqueo) return 0;
  return Math.ceil((bloqueo.hasta - Date.now()) / 1000);
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
