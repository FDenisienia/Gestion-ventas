import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import './Informes.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

function Informes() {
  const { token } = useAuth()
  const [ventas, setVentas] = useState([])
  const [egresos, setEgresos] = useState([])
  const [articulos, setArticulos] = useState([])
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [rangoSeleccionado, setRangoSeleccionado] = useState('7dias')

  useEffect(() => {
    if (token) {
      fetchData()
      aplicarRangoPredefinido('7dias')
    }
  }, [token])

  useEffect(() => {
    if (token && fechaInicio && fechaFin) {
      fetchData()
    }
  }, [fechaInicio, fechaFin, token])

  const aplicarRangoPredefinido = (rango) => {
    const hoy = new Date()
    const fechaFin = new Date(hoy)
    let fechaInicio = new Date(hoy)

    switch (rango) {
      case '7dias':
        fechaInicio.setDate(hoy.getDate() - 7)
        break
      case '15dias':
        fechaInicio.setDate(hoy.getDate() - 15)
        break
      case '1mes':
        fechaInicio.setMonth(hoy.getMonth() - 1)
        break
      case '3meses':
        fechaInicio.setMonth(hoy.getMonth() - 3)
        break
      default:
        fechaInicio.setDate(hoy.getDate() - 7)
    }

    setFechaInicio(fechaInicio.toISOString().split('T')[0])
    setFechaFin(fechaFin.toISOString().split('T')[0])
    setRangoSeleccionado(rango)
  }

  const handleRangoChange = (rango) => {
    aplicarRangoPredefinido(rango)
  }

  const filtrarVentasPorFecha = (ventasArray) => {
    if (!Array.isArray(ventasArray)) return []
    if (!fechaInicio || !fechaFin) return ventasArray

    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    fin.setHours(23, 59, 59, 999) // Incluir todo el día final

    return ventasArray.filter(venta => {
      const fechaVenta = new Date(venta.fecha || venta.fecha_emision || venta.fecha_venta)
      return fechaVenta >= inicio && fechaVenta <= fin
    })
  }

  const filtrarEgresosPorFecha = (egresosArray) => {
    if (!Array.isArray(egresosArray)) return []
    if (!fechaInicio || !fechaFin) return egresosArray

    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    fin.setHours(23, 59, 59, 999)

    return egresosArray.filter(egreso => {
      const fechaEgreso = new Date(egreso.fecha || egreso.fecha_creacion)
      return fechaEgreso >= inicio && fechaEgreso <= fin
    })
  }

  const fetchData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`
      }
      
      const [ventasRes, articulosRes, egresosRes] = await Promise.all([
        fetch('/api/ventas', { headers }),
        fetch('/api/articulos', { headers }),
        fetch('/api/egresos', { headers }).catch(() => ({ ok: false })) // Manejar si no existe el endpoint
      ])
      
      if (!ventasRes.ok) {
        throw new Error(`Error ${ventasRes.status}: ${ventasRes.statusText}`)
      }
      if (!articulosRes.ok) {
        throw new Error(`Error ${articulosRes.status}: ${articulosRes.statusText}`)
      }
      
      const ventasData = await ventasRes.json()
      const articulosData = await articulosRes.json()
      
      setVentas(Array.isArray(ventasData) ? ventasData : [])
      setArticulos(Array.isArray(articulosData) ? articulosData : [])
      
      if (egresosRes.ok) {
        const egresosData = await egresosRes.json()
        setEgresos(Array.isArray(egresosData) ? egresosData : [])
      } else {
        setEgresos([])
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setVentas([])
      setArticulos([])
      setEgresos([])
      setLoading(false)
    }
  }

  // Procesar datos para gráfico de seguimiento de ventas (últimos 6 meses)
  const getVentasPorMes = () => {
    const ventasFiltradas = filtrarVentasPorFecha(ventas)
    const meses = []
    const ventasPorMes = {}
    const gananciasPorMes = {}
    
    // Obtener últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date()
      fecha.setMonth(fecha.getMonth() - i)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      const mesNombre = fecha.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
      meses.push(mesNombre)
      ventasPorMes[mesKey] = 0
      gananciasPorMes[mesKey] = 0
    }

    ventasFiltradas.forEach(venta => {
      const fecha = new Date(venta.fecha || venta.fecha_emision || venta.fecha_venta)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      
      if (ventasPorMes[mesKey] !== undefined) {
        ventasPorMes[mesKey] += 1
        
        // Calcular ganancia
        const ganancia = (venta.items_detalle || venta.items || []).reduce((sum, item) => {
          const costo = item.costo_unit || item.costo || 0
          const precio = item.precio || item.precio_venta || 0
          const cantidad = item.cantidad || 1
          return sum + ((precio - costo) * cantidad)
        }, 0)
        
        gananciasPorMes[mesKey] += ganancia
      }
    })

    return {
      labels: meses,
      ventas: meses.map((_, index) => {
        const mesKey = Object.keys(ventasPorMes)[index]
        return ventasPorMes[mesKey] || 0
      }),
      ganancias: meses.map((_, index) => {
        const mesKey = Object.keys(gananciasPorMes)[index]
        return gananciasPorMes[mesKey] || 0
      })
    }
  }

  // Comparativa mensual de ganancias y egresos
  const getComparativaMensual = () => {
    const ventasFiltradas = filtrarVentasPorFecha(ventas)
    const egresosFiltrados = filtrarEgresosPorFecha(egresos)
    const meses = []
    const gananciasARS = {}
    const gananciasUSD = {}
    const egresosARS = {}
    const egresosUSD = {}

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date()
      fecha.setMonth(fecha.getMonth() - i)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      const mesNombre = fecha.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
      meses.push(mesNombre)
      gananciasARS[mesKey] = 0
      gananciasUSD[mesKey] = 0
      egresosARS[mesKey] = 0
      egresosUSD[mesKey] = 0
    }

    ventasFiltradas.forEach(venta => {
      const fecha = new Date(venta.fecha || venta.fecha_emision || venta.fecha_venta)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      
      if (gananciasARS[mesKey] !== undefined || gananciasUSD[mesKey] !== undefined) {
        // Calcular ganancia por item según su moneda
        const items = venta.items_detalle || venta.items || []
        items.forEach(item => {
          const costo = item.costo_unit || item.costo || 0
          const precio = item.precio || item.precio_venta || 0
          const cantidad = item.cantidad || 1
          const ganancia = (precio - costo) * cantidad
          
          // Determinar moneda del item (del artículo o de la venta)
          const articulo = item.articulo_id ? articulos.find(a => a.id === item.articulo_id) : null
          const monedaItem = articulo?.moneda || venta.moneda || 'ARS'
          
          if (monedaItem === 'USD') {
            gananciasUSD[mesKey] = (gananciasUSD[mesKey] || 0) + ganancia
          } else {
            gananciasARS[mesKey] = (gananciasARS[mesKey] || 0) + ganancia
          }
        })
      }
    })

    // Procesar egresos
    egresosFiltrados.forEach(egreso => {
      const fecha = new Date(egreso.fecha || egreso.fecha_creacion)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      const monto = parseFloat(egreso.monto || 0)
      const moneda = egreso.moneda || 'ARS'
      
      if (egresosARS[mesKey] !== undefined || egresosUSD[mesKey] !== undefined) {
        if (moneda === 'USD') {
          egresosUSD[mesKey] = (egresosUSD[mesKey] || 0) + monto
        } else {
          egresosARS[mesKey] = (egresosARS[mesKey] || 0) + monto
        }
      }
    })

    // Verificar qué monedas tienen datos
    const tieneARS = Object.values(gananciasARS).some(valor => valor > 0) || Object.values(egresosARS).some(valor => valor > 0)
    const tieneUSD = Object.values(gananciasUSD).some(valor => valor > 0) || Object.values(egresosUSD).some(valor => valor > 0)

    return {
      labels: meses,
      ganancias: {
        ars: meses.map((_, index) => {
          const mesKey = Object.keys(gananciasARS)[index]
          return gananciasARS[mesKey] || 0
        }),
        usd: meses.map((_, index) => {
          const mesKey = Object.keys(gananciasUSD)[index]
          return gananciasUSD[mesKey] || 0
        })
      },
      egresos: {
        ars: meses.map((_, index) => {
          const mesKey = Object.keys(egresosARS)[index]
          return egresosARS[mesKey] || 0
        }),
        usd: meses.map((_, index) => {
          const mesKey = Object.keys(egresosUSD)[index]
          return egresosUSD[mesKey] || 0
        })
      },
      tieneARS,
      tieneUSD
    }
  }

  // Top productos vendidos
  const getTopProductos = () => {
    const ventasFiltradas = filtrarVentasPorFecha(ventas)
    const productosMap = {}

    ventasFiltradas.forEach(venta => {
      const items = venta.items_detalle || venta.items || []
      items.forEach(item => {
        const nombre = item.nombre || item.producto || 'Producto sin nombre'
        const marca = item.marca || ''
        // Incluir moneda en la key para separar productos con misma marca/nombre pero diferente moneda
        const articulo = item.articulo_id ? articulos.find(a => a.id === item.articulo_id) : null
        const monedaItem = articulo?.moneda || venta.moneda || 'ARS'
        const key = `${marca}-${nombre}-${monedaItem}`
        
        if (!productosMap[key]) {
          productosMap[key] = {
            nombre,
            marca,
            moneda: monedaItem,
            cantidad: 0,
            ganancia: 0
          }
        }
        productosMap[key].cantidad += item.cantidad || 1
        
        // Calcular ganancia
        const costo = item.costo_unit || item.costo || 0
        const precio = item.precio || item.precio_venta || 0
        const cantidad = item.cantidad || 1
        productosMap[key].ganancia += (precio - costo) * cantidad
      })
    })

    const productosArray = Object.values(productosMap)
      .sort((a, b) => b.ganancia - a.ganancia)
      .slice(0, 15)

    return productosArray
  }

  if (loading) {
    return (
      <div className="informes-container">
        <div className="loading">Cargando datos...</div>
      </div>
    )
  }

  const ventasData = getVentasPorMes()
  const comparativaData = getComparativaMensual()
  const topProductosData = getTopProductos()

  // Configuración del gráfico de seguimiento de ventas
  const seguimientoVentasData = {
    labels: ventasData.labels,
    datasets: [
      {
        label: 'Cantidad de Ventas',
        data: ventasData.ventas,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Ganancias',
        data: ventasData.ganancias,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  }

  const seguimientoVentasOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Seguimiento de Ventas y Ganancias (Últimos 6 Meses)'
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Cantidad de Ventas'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Ganancias ($)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  }

  // Configuración del gráfico de comparativa mensual
  // Solo incluir las monedas que tienen datos
  const comparativaMensualDatasets = []
  
  if (comparativaData.tieneARS) {
    comparativaMensualDatasets.push({
      label: 'Ganancias ARS ($)',
      data: comparativaData.ganancias.ars,
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    })
    // Agregar egresos ARS si hay datos
    if (comparativaData.egresos.ars.some(val => val > 0)) {
      comparativaMensualDatasets.push({
        label: 'Egresos ARS ($)',
        data: comparativaData.egresos.ars,
        backgroundColor: 'rgba(239, 68, 68, 0.8)'
      })
    }
  }
  
  if (comparativaData.tieneUSD) {
    comparativaMensualDatasets.push({
      label: 'Ganancias USD (US$)',
      data: comparativaData.ganancias.usd,
      backgroundColor: 'rgba(16, 185, 129, 0.8)'
    })
    // Agregar egresos USD si hay datos
    if (comparativaData.egresos.usd.some(val => val > 0)) {
      comparativaMensualDatasets.push({
        label: 'Egresos USD (US$)',
        data: comparativaData.egresos.usd,
        backgroundColor: 'rgba(220, 38, 38, 0.8)'
      })
    }
  }

  const comparativaMensualData = {
    labels: comparativaData.labels,
    datasets: comparativaMensualDatasets
  }

  const comparativaMensualOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Comparativa Mensual de Ganancias y Egresos por Moneda'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monto'
        }
      }
    }
  }


  const formatoFecha = (fecha) => {
    if (!fecha) return ''
    // Si la fecha viene en formato ISO (YYYY-MM-DD), parsearla directamente
    if (typeof fecha === 'string' && fecha.includes('-')) {
      const [year, month, day] = fecha.split('-')
      return `${day}/${month}/${year}`
    }
    const d = new Date(fecha)
    // Asegurar que no haya problemas de zona horaria
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <div className="informes-container">
      <div className="informes-header">
        <h1>Informes y Análisis</h1>
        <p>Visualización de datos de ventas y productos</p>
      </div>

      <div className="filtro-fechas">
        <h3 className="filtro-fechas-title">Filtro de Fechas</h3>
        <div className="rangos-predefinidos">
          <button
            className={`btn-rango ${rangoSeleccionado === '7dias' ? 'active' : ''}`}
            onClick={() => handleRangoChange('7dias')}
          >
            Últimos 7 días
          </button>
          <button
            className={`btn-rango ${rangoSeleccionado === '15dias' ? 'active' : ''}`}
            onClick={() => handleRangoChange('15dias')}
          >
            Últimos 15 días
          </button>
          <button
            className={`btn-rango ${rangoSeleccionado === '1mes' ? 'active' : ''}`}
            onClick={() => handleRangoChange('1mes')}
          >
            Último mes
          </button>
          <button
            className={`btn-rango ${rangoSeleccionado === '3meses' ? 'active' : ''}`}
            onClick={() => handleRangoChange('3meses')}
          >
            Últimos 3 meses
          </button>
        </div>
        <div className="fechas-personalizadas">
          <div className="fecha-input-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value)
                setRangoSeleccionado('personalizado')
              }}
              className="fecha-input"
            />
          </div>
          <div className="fecha-input-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value)
                setRangoSeleccionado('personalizado')
              }}
              className="fecha-input"
            />
          </div>
          <div className="periodo-actual">
            Período: {formatoFecha(fechaInicio)} - {formatoFecha(fechaFin)}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <Line data={seguimientoVentasData} options={seguimientoVentasOptions} />
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Comparativa Mensual de Ganancias y Egresos</h3>
          <Bar data={comparativaMensualData} options={comparativaMensualOptions} />
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Resumen de Egresos</h3>
          <div className="egresos-resumen">
            {(() => {
              const egresosFiltrados = filtrarEgresosPorFecha(egresos)
              const totalEgresosARS = egresosFiltrados
                .filter(e => (e.moneda || 'ARS') === 'ARS')
                .reduce((sum, e) => sum + parseFloat(e.monto || 0), 0)
              const totalEgresosUSD = egresosFiltrados
                .filter(e => (e.moneda || 'ARS') === 'USD')
                .reduce((sum, e) => sum + parseFloat(e.monto || 0), 0)
              
              return (
                <div className="egresos-totales">
                  {totalEgresosARS > 0 && (
                    <div className="egreso-item">
                      <span className="egreso-label">Total Egresos ARS:</span>
                      <span className="egreso-valor ganancia-negativa">${totalEgresosARS.toFixed(2)}</span>
                    </div>
                  )}
                  {totalEgresosUSD > 0 && (
                    <div className="egreso-item">
                      <span className="egreso-label">Total Egresos USD:</span>
                      <span className="egreso-valor ganancia-negativa">US${totalEgresosUSD.toFixed(2)}</span>
                    </div>
                  )}
                  {totalEgresosARS === 0 && totalEgresosUSD === 0 && (
                    <div className="egreso-item">No hay egresos en el período seleccionado</div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Top 15 Productos Más Vendidos</h3>
          <div className="top-productos-table">
            <table>
              <thead>
                <tr>
                  <th>Posición</th>
                  <th>Marca</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {topProductosData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">No hay productos vendidos</td>
                  </tr>
                ) : (
                  topProductosData.map((producto, index) => {
                    const simbolo = producto.moneda === 'USD' ? 'US$' : '$'
                    
                    return (
                      <tr key={`${producto.marca}-${producto.nombre}`}>
                        <td>
                          <span className={`badge-posicion badge-posicion-${index + 1}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td>{producto.marca || '-'}</td>
                        <td>{producto.nombre}</td>
                        <td>
                          <span className="badge-cantidad">
                            {producto.cantidad} unidades
                          </span>
                        </td>
                        <td>
                          <span className="badge-ganancia">
                            {simbolo}{producto.ganancia.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Informes
