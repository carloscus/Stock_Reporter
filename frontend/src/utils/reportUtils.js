export const validarCorreo = (email) => {
  if (!email) return false;
  return email.toLowerCase().endsWith('@cipsa.com.pe');
};

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

export const generarNombreArchivo = (categoria) => {
  const fecha = formatearFechaISO();
  // El nombre ahora depende dinámicamente de la categoría seleccionada
  const catUpper = (categoria || 'todos').toUpperCase();
  return `StockReporter_${fecha}_${catUpper}.xlsx`;
};
