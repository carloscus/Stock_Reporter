import { useState, useEffect, useMemo } from 'react'
import { validarCorreo, generarNombreArchivo } from './utils/reportUtils'
import { useTheme } from './hooks/useTheme'

const CATEGORIAS = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'pelotas', nombre: 'Pelotas' },
  { id: 'escolar', nombre: 'Escolar' },
  { id: 'representadas', nombre: 'Representadas' },
]

function App() {
  const { theme, toggleTheme, mounted } = useTheme()
  const [form, setForm] = useState({ nombre: '', email: '', categoria: 'todos' })
  const [ui, setUi] = useState({ 
    isValido: false, 
    reporteGenerado: false, 
    nombreArchivo: '', 
    error: '', 
    isSearching: false,
    searchTerm: '',
    allProducts: [],
    lastUpdated: '',
    isLoadingProducts: false
  })

  // 1. Cargar productos para el buscador
  useEffect(() => {
    const loadProducts = async () => {
      setUi(prev => ({ ...prev, isLoadingProducts: true }))
      try {
        const res = await fetch('/productos_con_stock.json')
        if (res.ok) {
          const data = await res.json()
          setUi(prev => ({ 
            ...prev, 
            allProducts: data.productos || [], 
            lastUpdated: data.metadata?.lastUpdated || ''
          }))
        }
      } catch (err) {
        console.error('Error cargando buscador:', err)
      } finally {
        setUi(prev => ({ ...prev, isLoadingProducts: false }))
      }
    }
    loadProducts()
  }, [])

  // 2. Lógica de filtrado de búsqueda
  const searchResults = useMemo(() => {
    if (!ui.searchTerm || ui.searchTerm.length < 2) return []
    const term = ui.searchTerm.toLowerCase()
    return ui.allProducts.filter(p => 
      p.sku.toLowerCase().includes(term) || 
      p.nombre.toLowerCase().includes(term)
    ).slice(0, 10)
  }, [ui.searchTerm, ui.allProducts])

  // 3. Validación Formulario
  useEffect(() => {
    const emailValido = validarCorreo(form.email)
    const nombreValido = form.nombre.trim().length > 0
    setUi(prev => ({
      ...prev,
      isValido: emailValido && nombreValido,
      error: (form.email && !emailValido) ? 'Solo se permiten correos @cipsa.com.pe' : ''
    }))
  }, [form.email, form.nombre])

  const handleGenerarReporte = (e) => {
    e.preventDefault()
    if (!ui.isValido) return
    setUi(prev => ({ 
      ...prev, 
      reporteGenerado: true, 
      nombreArchivo: generarNombreArchivo(form.categoria) 
    }))
  }

  const handleDescargar = async () => {
    try {
      const response = await fetch(`/reports/${ui.nombreArchivo}`)
      if (!response.ok || response.headers.get('content-type').includes('text/html')) {
        throw new Error('El reporte aún no ha sido generado.')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = ui.nombreArchivo
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message)
    }
  }

  // Wait for mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <div className={`font-display min-h-screen flex flex-col transition-colors duration-300 relative ${
      theme === 'dark' ? 'bg-background-dark text-slate-100' : 'bg-background-light text-slate-900'
    }`}>
      
      {/* Search Overlay */}
      {ui.isSearching && (
        <div className="fixed inset-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col">
          <div className="p-4 flex items-center gap-4 border-b border-slate-200 dark:border-primary/10">
            <span className="material-symbols-outlined text-primary">search</span>
            <input 
              autoFocus
              className="flex-1 bg-transparent border-none text-xl focus:ring-0 outline-none"
              placeholder="Escriba SKU o nombre..."
              value={ui.searchTerm}
              onChange={(e) => setUi(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
            <button 
              onClick={() => setUi(prev => ({ ...prev, isSearching: false, searchTerm: '' }))}
              className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Timestamp Info */}
          {ui.lastUpdated && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-primary/5 flex items-center gap-2 border-b border-slate-100 dark:border-primary/10">
              <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Stock VES actualizado: {new Date(ui.lastUpdated).toLocaleString('es-PE', { 
                  day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' 
                })}
              </p>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {searchResults.length > 0 ? (
              searchResults.map(p => (
                <div key={p.sku} className="p-4 bg-white dark:bg-primary/5 rounded-xl border border-slate-100 dark:border-primary/10 flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">{p.sku}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{p.linea}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold truncate">{p.nombre}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold">{p.stock}</span>
                      <span className="text-xs">{p.alerta}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">STOCK VES</span>
                  </div>
                </div>
              ))
            ) : ui.searchTerm.length >= 2 ? (
              <p className="text-center text-slate-400 py-10">No se encontraron productos.</p>
            ) : (
              <p className="text-center text-slate-400 py-10 italic text-sm">Empiece a escribir para buscar stock...</p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center bg-background-light dark:bg-background-dark p-4 justify-between border-b border-slate-200 dark:border-primary/10 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="flex size-10 shrink-0 items-center overflow-hidden rounded-full bg-primary/10">
          <img src="/favicon.svg" alt="Logo" className="h-full w-full object-contain p-1" />
        </div>
        <div className="flex flex-1 px-4 items-center">
          <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">StockFlow</h2>
        </div>
        <div className="flex items-center justify-end">
          <button 
            onClick={() => setUi(prev => ({ ...prev, isSearching: true }))}
            className="flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">search</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold leading-tight">Generar Reporte de Stock</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Exportación profesional del inventario VES.</p>
        </div>

        <form onSubmit={handleGenerarReporte} className="px-4 py-4 space-y-6">
          {/* Nombre */}
          <div className="flex flex-col gap-2">
            <label htmlFor="nombre" className="text-slate-900 dark:text-slate-200 text-sm font-semibold">Nombre Completo</label>
            <div className="relative flex items-center group">
              <span className="material-symbols-outlined absolute left-4 text-slate-400 dark:text-primary/60 group-focus-within:text-primary transition-colors z-10">person</span>
              <input 
                id="nombre" name="nombre" type="text" autoComplete="name" className="input-field" 
                placeholder="Ingrese su nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-slate-900 dark:text-slate-200 text-sm font-semibold">Correo Corporativo</label>
            <div className="relative flex items-center group">
              <span className="material-symbols-outlined absolute left-4 text-slate-400 dark:text-primary/60 group-focus-within:text-primary transition-colors z-10">mail</span>
              <input 
                id="email" name="email" type="email" autoComplete="email" className="input-field" 
                placeholder="usuario@cipsa.com.pe" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {ui.error && <p className="text-xs text-red-500 mt-1 font-medium">{ui.error}</p>}
          </div>

          {/* Chips */}
          <div className="flex flex-col gap-3">
            <label className="text-slate-900 dark:text-slate-200 text-sm font-semibold">Categoría de Productos</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => (
                <button 
                  key={cat.id} type="button" className={`chip ${form.categoria === cat.id ? 'chip-active' : 'chip-inactive'}`}
                  onClick={() => { setForm({ ...form, categoria: cat.id }); setUi(prev => ({ ...prev, reporteGenerado: false })) }}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={!ui.isValido} className="btn-primary">
            <span className="material-symbols-outlined">bar_chart</span>
            Generar Reporte de Stock
          </button>
        </form>

        {/* Success Card */}
        {ui.reporteGenerado && (
          <section className="px-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="card-success">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-500 rounded-full p-2 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-xl">check</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-emerald-900 dark:text-emerald-400 font-bold">Reporte Generado</h4>
                  <p className="text-emerald-800 dark:text-emerald-500/80 text-sm">Listo para descarga segmentada.</p>
                </div>
              </div>
              <div className="mt-6 flex items-center p-4 bg-white dark:bg-background-dark/50 border border-slate-100 dark:border-emerald-500/20 rounded-xl">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 mr-3">description</span>
                <div className="flex-1 overflow-hidden">
                  <p className="text-slate-700 dark:text-slate-200 font-medium truncate">{ui.nombreArchivo}</p>
                  <p className="text-xs text-slate-400">Excel Spreadsheet Professional</p>
                </div>
              </div>
              <button 
                className="w-full mt-4 h-12 bg-emerald-500 dark:bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-md active:scale-95"
                onClick={handleDescargar}
              >
                <span className="material-symbols-outlined">download</span>
                Descargar Reporte
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-slate-200 dark:border-primary/10 px-4 pb-6 pt-2 z-40">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <NavItem icon="home" label="INICIO" active={true} />
          <NavItem icon="assessment" label="REPORTES" active={false} />
          <NavItem 
            icon={theme === 'light' ? 'dark_mode' : 'light_mode'} label="TEMA" 
            onClick={toggleTheme}
          />
        </div>
      </nav>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 group transition-colors ${active ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
      <span className={`material-symbols-outlined ${!active ? 'group-hover:text-primary' : ''} transition-colors`}>{icon}</span>
      <span className={`text-[10px] font-bold ${!active ? 'group-hover:text-primary' : ''} tracking-wider`}>{label}</span>
    </button>
  )
}

export default App
