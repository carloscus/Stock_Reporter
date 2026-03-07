# 📦 StockFlow - Sistema de Gestión y Distribución de Reportes

StockFlow es una plataforma corporativa diseñada para centralizar, procesar y distribuir reportes de inventario de alta precisión para el almacén **VES (Villa El Salvador)**. El sistema automatiza la conversión de datos desde fuentes maestras en Excel hacia reportes profesionales multioja y consultas en tiempo real.

---

## 🚀 Características Principales

### 📊 Reportes Profesionales
- **Estructura Multioja**: Generación de reportes automáticos con hasta 15 pestañas (Resumen de KPIs, Líneas individuales como Forros, Escritura, Pelotas, etc.).
- **Diseño Corporativo**: Uso de paleta de colores profesional (#13daec), encabezados inmovilizados, auto-filtros y ajuste automático de columnas.
- **Semáforo de Stock**: Indicadores visuales automáticos (🟢 Verde: OK, 🟡 Amarillo: Bajo, 🔴 Rojo: Sin Stock).

### 🔍 Buscador de Stock en Tiempo Real
- **Consulta Instantánea**: Buscador inteligente por SKU o Nombre sin necesidad de descargar archivos.
- **Arquitectura Client-Side**: Búsquedas ultra-rápidas procesadas localmente en el dispositivo del usuario para evitar carga en el servidor.
- **Timestamp de Frescura**: Visualización exacta de la última actualización del stock.

### 🔐 Seguridad y Acceso
- **Validación Corporativa**: Acceso restringido a usuarios con correo institucional `@cipsa.com.pe`.
- **Descarga Segmentada**: Capacidad de descargar solo la categoría de interés (Pelotas, Escolar o Representadas) para optimizar el uso de datos.

---

## 🛠️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: React 19 + Vite + Tailwind CSS v4.
- **Backend (Scripts)**: Node.js con `ExcelJS` para estilizado profesional y `xlsx` para procesamiento rápido.
- **Automatización**: GitHub Actions para generación programada de reportes.
- **Hosting**: GitHub Pages (rama `gh-pages`).

### Flujo de Datos (Data Pipeline)
1. **Input**: El archivo `Data/codigos_generales.xlsx` (Maestro) se actualiza manualmente.
2. **Conversión**: Script `convert-codigos.js` transforma el Excel Maestro a un JSON optimizado.
3. **Merge**: Script `merge-stock.js` cruza el Maestro con el stock diario (`Data/reporte_stock_hoy.xlsx`).
4. **Output**: Se generan archivos `.xlsx` estilizados y un `productos_con_stock.json` para el buscador.
5. **Sync**: GitHub Actions realiza un commit automático de los resultados a la carpeta pública del frontend.

---

## 📁 Estructura del Proyecto

```text
Stock_Reporter/
├── Data/                   # Archivos fuente (Maestro y Stock diario)
├── frontend/               # Aplicación React
│   ├── public/             # Archivos estáticos y Reportes generados
│   └── src/                # Código fuente UI
├── reports/                # Histórico de reportes generados (Raíz)
├── scripts/                # Motores de procesamiento Node.js
│   ├── convert-codigos.js  # Conversor XLSX -> JSON
│   └── merge-stock.js      # Generador de reportes profesionales (ExcelJS)
└── .github/workflows/      # Automatización programada
```

---

## ⚙️ Configuración y Desarrollo

### Requisitos
- Node.js v20 o superior.
- Archivos fuente en la carpeta `Data/`.

### Instalación
1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   cd frontend && npm install
   ```

### Comandos Útiles
- **Generar Reportes Localmente**: `npm run all` (Ejecuta conversión y merge).
- **Iniciar Frontend**: `npm run dev` (Inicia Vite en modo desarrollo).
- **Construir para Producción**: `npm run build:frontend`.

---

## 📅 Automatización (GitHub Actions)
El sistema está configurado para regenerar reportes automáticamente de **Lunes a Sábado entre 7:00 AM y 11:00 PM (Hora Perú)**. Esto asegura que los vendedores y el equipo de almacén siempre cuenten con información fresca al iniciar el día.

---

## 🏷️ Taxonomía de Productos
El sistema respeta la siguiente jerarquía de organización:
- **Categoría**: Nivel superior (PELOTAS, ESCOLAR, REPRESENTADAS).
- **Línea (Segmento)**: Nivel operativo (FORROS, ARCHIVO, ESCRITURA, etc.).
- **Stock**: Filtrado exclusivo para almacén **VES**.

---
*Desarrollado para la optimización de procesos de inventario - 2026.*
