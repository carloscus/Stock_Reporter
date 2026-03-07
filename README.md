# 📡 StockPulse - Inteligencia de Inventario CIPSA

**StockPulse** es una plataforma corporativa avanzada diseñada para la gestión, monitoreo y distribución de inventarios estratégicos. Optimizado para el almacén **Villa El Salvador (VES)**, el sistema transforma datos crudos de Excel en una herramienta de consulta en tiempo real y reportes profesionales segmentados.

---

## 🌟 Funcionalidades Core

### 1. Sistema de Snapshots (Captura del Momento)
En lugar de generar cientos de archivos históricos, StockPulse mantiene una **"Foto del Momento"** actualizada cada hora.
- **Eficiencia**: Repositorio ligero mediante sobreescritura de archivos fijos (`StockPulse_TODOS.xlsx`, etc.).
- **Renombrado Inteligente**: Los archivos se descargan con la fecha actual (`DD-MM-YY`) automáticamente en el navegador del usuario.

### 2. Monitor de Salud del Sistema (Pestaña ESTADO)
Un dashboard ejecutivo que permite supervisar la calidad de los datos sin descargar archivos:
- **Último Pulso**: Hora exacta de la última actualización.
- **KPIs Críticos**: Conteo de productos procesados, productos **SIN STOCK** y productos con **STOCK BAJO**.
- **Estado del Bot**: Verificación visual de que el motor de sincronización está operativo.

### 3. Buscador Ultra-Rápido (Client-Side)
- Búsqueda instantánea por SKU o Nombre.
- **Privacidad y Velocidad**: El procesamiento ocurre 100% en el dispositivo del usuario, garantizando latencia cero y carga nula en el servidor de GitHub.

### 4. Seguridad Corporativa
- Acceso restringido exclusivo para el dominio `@cipsa.com.pe`.
- Interfaz adaptativa (Modo Claro / Oscuro) con persistencia de preferencias.

---

## 🛠️ Arquitectura Técnica

- **Frontend**: React 19 + Tailwind CSS v4 + Vite.
- **Engine**: Node.js + `ExcelJS` (para reportes con formato profesional).
- **Hosting**: GitHub Pages (Despliegue automático vía GitHub Actions).
- **Data Pipeline**:
  1. `codigos_generales.xlsx` → JSON Maestro.
  2. JSON Maestro + Stock diario → Reportes XLSX Estilizados + JSON de búsqueda.

---

## 📂 Estructura de Carpetas

```text
Stock_Reporter/
├── Data/                   # Fuentes de verdad (Maestro y Stock)
├── frontend/               # Aplicación Web (React)
│   ├── public/             # Snapshots XLSX y JSON de búsqueda
│   └── src/                # Lógica UI y componentes
├── scripts/                # Motores de procesamiento Node.js
└── .github/workflows/      # Automatización de reportes y despliegue
```

---

## 👨‍💻 Autoría y Mantenimiento
- **Desarrollador**: Carlos Cusi
- **Versión**: 2.2.0
- **Entorno**: Almacén Villa El Salvador (VES)

---
*StockPulse: El pulso real de tu inventario.*
