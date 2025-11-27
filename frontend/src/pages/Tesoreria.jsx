import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Tesoreria.css'

function Tesoreria() {
  const { token } = useAuth()
  const [ventas, setVentas] = useState([])
  const [egresos, setEgresos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  const fetchData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`
      }
      
      const [ventasRes, categoriasRes] = await Promise.all([
        fetch('/api/ventas', { headers }),
        fetch('/api/categorias', { headers })
      ])

      if (!ventasRes.ok) {
        throw new Error(`Error ${ventasRes.status}: ${ventasRes.statusText}`)
      }
      if (!categoriasRes.ok) {
        throw new Error(`Error ${categoriasRes.status}: ${categoriasRes.statusText}`)
      }

      const ventasData = await ventasRes.json()
      const categoriasData = await categoriasRes.json()

      setVentas(Array.isArray(ventasData) ? ventasData : [])
      setCategorias(Array.isArray(categoriasData) ? categoriasData : [])
      
      // Intentar obtener egresos si existe el endpoint
      try {
        const egresosRes = await fetch('/api/egresos', { headers })
        if (egresosRes.ok) {
          const egresosData = await egresosRes.json()
          setEgresos(Array.isArray(egresosData) ? egresosData : [])
        } else {
          // Si el endpoint no existe (404), simplemente usar array vacío
          setEgresos([])
        }
      } catch (error) {
        // Si hay error de red, usar array vacío
        console.log('No hay endpoint de egresos o error de conexión')
        setEgresos([])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setVentas([])
      setCategorias([])
      setEgresos([])
      setLoading(false)
    }
  }

  // Calcular totales por método de pago y por cuenta bancaria
  const calcularTotalesPorMetodo = () => {
    const efectivo = { ars: 0, usd: 0 }
    const transferencia = { ars: 0, usd: 0 }
    const cuentasBancarias = {} // { cuenta: { ars: 0, usd: 0, egresos: { ars: 0, usd: 0 } } }

    // Procesar ventas (ingresos)
    if (!Array.isArray(ventas)) return { efectivo, transferencia, cuentasBancarias }
    ventas.forEach(venta => {
      const total = parseFloat(venta.total_venta || 0)
      const moneda = venta.moneda || 'ARS'
      const metodo = venta.metodo_pago || 'efectivo'
      const estadoPago = venta.estado_pago || (venta.pendiente === 0 ? 'pagado' : 'pendiente')

      // Solo contar ventas pagadas
      if (estadoPago === 'pagado') {
        if (metodo === 'efectivo') {
          efectivo[moneda.toLowerCase()] += total
        } else if (metodo === 'transferencia') {
          transferencia[moneda.toLowerCase()] += total
          
          // Agregar a la cuenta bancaria específica
          const cuenta = venta.cuenta_transferencia || 'Sin cuenta especificada'
          if (!cuentasBancarias[cuenta]) {
            cuentasBancarias[cuenta] = { ars: 0, usd: 0, egresos: { ars: 0, usd: 0 } }
          }
          cuentasBancarias[cuenta][moneda.toLowerCase()] += total
        }
      }
    })

    // Procesar egresos (descontar de las cuentas)
    if (Array.isArray(egresos)) {
      egresos.forEach(egreso => {
      const monto = parseFloat(egreso.monto || 0)
      const moneda = egreso.moneda || 'ARS'
      const metodo = egreso.metodo_pago || 'efectivo'

      if (metodo === 'efectivo') {
        efectivo[moneda.toLowerCase()] = Math.max(0, efectivo[moneda.toLowerCase()] - monto)
      } else if (metodo === 'transferencia' && egreso.cuenta_transferencia) {
        const cuenta = egreso.cuenta_transferencia
        if (!cuentasBancarias[cuenta]) {
          cuentasBancarias[cuenta] = { ars: 0, usd: 0, egresos: { ars: 0, usd: 0 } }
        }
        cuentasBancarias[cuenta].egresos[moneda.toLowerCase()] += monto
        // Descontar del total de la cuenta
        cuentasBancarias[cuenta][moneda.toLowerCase()] = Math.max(0, cuentasBancarias[cuenta][moneda.toLowerCase()] - monto)
        // También descontar del total de transferencia
        transferencia[moneda.toLowerCase()] = Math.max(0, transferencia[moneda.toLowerCase()] - monto)
      }
      })
    }

    return { efectivo, transferencia, cuentasBancarias }
  }

  // Calcular ganancias
  const calcularGanancias = () => {
    let gananciaBrutaARS = 0
    let gananciaBrutaUSD = 0

    if (!Array.isArray(ventas)) return { gananciaBrutaARS, gananciaBrutaUSD, gananciaNetaARS: 0, gananciaNetaUSD: 0 }
    
    ventas.forEach(venta => {
      const items = venta.items_detalle || venta.items || []
      items.forEach(item => {
        const costo = parseFloat(item.costo_unit || item.costo || 0)
        const precio = parseFloat(item.precio || item.precio_venta || 0)
        const cantidad = parseInt(item.cantidad || 1)
        const ganancia = (precio - costo) * cantidad
        
        const moneda = item.moneda || venta.moneda || 'ARS'
        if (moneda === 'USD') {
          gananciaBrutaUSD += ganancia
        } else {
          gananciaBrutaARS += ganancia
        }
      })
    })

    // Calcular egresos por método de pago y cuenta
    let totalEgresosARS = 0
    let totalEgresosUSD = 0
    const egresosPorCuenta = {} // { cuenta: { ars: 0, usd: 0 } }
    const egresosEfectivo = { ars: 0, usd: 0 }

    if (Array.isArray(egresos)) {
      egresos.forEach(egreso => {
        const monto = parseFloat(egreso.monto || 0)
        const moneda = egreso.moneda || 'ARS'
        
        if (moneda === 'USD') {
          totalEgresosUSD += monto
        } else {
          totalEgresosARS += monto
        }

        // Agrupar por método de pago y cuenta
        if (egreso.metodo_pago === 'transferencia' && egreso.cuenta_transferencia) {
          const cuenta = egreso.cuenta_transferencia
          if (!egresosPorCuenta[cuenta]) {
            egresosPorCuenta[cuenta] = { ars: 0, usd: 0 }
          }
          egresosPorCuenta[cuenta][moneda.toLowerCase()] += monto
        } else if (egreso.metodo_pago === 'efectivo') {
          egresosEfectivo[moneda.toLowerCase()] += monto
        }
      })
    }

    const gananciaNetaARS = gananciaBrutaARS - totalEgresosARS
    const gananciaNetaUSD = gananciaBrutaUSD - totalEgresosUSD

    return {
      bruta: { ars: gananciaBrutaARS, usd: gananciaBrutaUSD },
      neta: { ars: gananciaNetaARS, usd: gananciaNetaUSD },
      egresos: { ars: totalEgresosARS, usd: totalEgresosUSD },
      egresosPorCuenta,
      egresosEfectivo
    }
  }

  // Calcular ganancia por categorías
  const calcularGananciaPorCategorias = () => {
    const gananciasPorCategoria = {}

    if (!Array.isArray(ventas)) return gananciasPorCategoria
    
    ventas.forEach(venta => {
      const items = venta.items_detalle || venta.items || []
      items.forEach(item => {
        const categoria = item.categoria || 'Sin categoría'
        const costo = parseFloat(item.costo_unit || item.costo || 0)
        const precio = parseFloat(item.precio || item.precio_venta || 0)
        const cantidad = parseInt(item.cantidad || 1)
        const ganancia = (precio - costo) * cantidad
        const moneda = item.moneda || venta.moneda || 'ARS'

        if (!gananciasPorCategoria[categoria]) {
          gananciasPorCategoria[categoria] = { ars: 0, usd: 0 }
        }

        if (moneda === 'USD') {
          gananciasPorCategoria[categoria].usd += ganancia
        } else {
          gananciasPorCategoria[categoria].ars += ganancia
        }
      })
    })

    return gananciasPorCategoria
  }

  if (loading) {
    return (
      <div className="tesoreria-container">
        <div className="loading">Cargando datos...</div>
      </div>
    )
  }

  const totalesMetodo = calcularTotalesPorMetodo()
  const ganancias = calcularGanancias()
  const gananciasPorCategoria = calcularGananciaPorCategorias()

  return (
    <div className="tesoreria-container">
      <div className="tesoreria-header">
        <h1>Resumen de cuentas</h1>
        <p>Visión general de ingresos, egresos y ganancias</p>
      </div>

      <div className="resumen-grid">
        {/* Egresos Totales */}
        <div className="resumen-card">
          <h2 className="card-title">Egresos Totales</h2>
          <div className="card-content">
            {ganancias.egresos.ars > 0 && (
              <div className="monto-item">
                <span className="monto-label">ARS:</span>
                <span className="monto-valor ganancia-negativa">${ganancias.egresos.ars.toFixed(2)}</span>
              </div>
            )}
            {ganancias.egresos.usd > 0 && (
              <div className="monto-item">
                <span className="monto-label">USD:</span>
                <span className="monto-valor ganancia-negativa">US${ganancias.egresos.usd.toFixed(2)}</span>
              </div>
            )}
            {ganancias.egresos.ars === 0 && ganancias.egresos.usd === 0 && (
              <div className="monto-item">No hay egresos registrados</div>
            )}
          </div>
        </div>

        {/* Ingresos por método de pago */}
        <div className="resumen-card">
          <h2 className="card-title">Saldo en Efectivo</h2>
          <div className="card-content">
            {totalesMetodo.efectivo.ars !== 0 && (
              <div className="monto-item">
                <span className="monto-label">ARS:</span>
                <span className={`monto-valor ${totalesMetodo.efectivo.ars >= 0 ? 'ganancia-positiva' : 'ganancia-negativa'}`}>
                  ${totalesMetodo.efectivo.ars.toFixed(2)}
                </span>
              </div>
            )}
            {totalesMetodo.efectivo.usd !== 0 && (
              <div className="monto-item">
                <span className="monto-label">USD:</span>
                <span className={`monto-valor ${totalesMetodo.efectivo.usd >= 0 ? 'ganancia-positiva' : 'ganancia-negativa'}`}>
                  US${totalesMetodo.efectivo.usd.toFixed(2)}
                </span>
              </div>
            )}
            {totalesMetodo.efectivo.ars === 0 && totalesMetodo.efectivo.usd === 0 && (
              <div className="monto-item">No hay movimientos en efectivo</div>
            )}
          </div>
        </div>

        <div className="resumen-card">
          <h2 className="card-title">Total por Transferencia</h2>
          <div className="card-content">
            {totalesMetodo.transferencia.ars !== 0 && (
              <div className="monto-item">
                <span className="monto-label">ARS:</span>
                <span className={`monto-valor ${totalesMetodo.transferencia.ars >= 0 ? 'ganancia-positiva' : 'ganancia-negativa'}`}>
                  ${totalesMetodo.transferencia.ars.toFixed(2)}
                </span>
              </div>
            )}
            {totalesMetodo.transferencia.usd !== 0 && (
              <div className="monto-item">
                <span className="monto-label">USD:</span>
                <span className={`monto-valor ${totalesMetodo.transferencia.usd >= 0 ? 'ganancia-positiva' : 'ganancia-negativa'}`}>
                  US${totalesMetodo.transferencia.usd.toFixed(2)}
                </span>
              </div>
            )}
            {totalesMetodo.transferencia.ars === 0 && totalesMetodo.transferencia.usd === 0 && (
              <div className="monto-item">No hay movimientos por transferencia</div>
            )}
          </div>
        </div>

        {/* Ganancias */}
        <div className="resumen-card">
          <h2 className="card-title">Ganancia Bruta</h2>
          <div className="card-content">
            {ganancias.bruta.ars > 0 && (
              <div className="monto-item">
                <span className="monto-label">ARS:</span>
                <span className="monto-valor ganancia-positiva">${ganancias.bruta.ars.toFixed(2)}</span>
              </div>
            )}
            {ganancias.bruta.usd > 0 && (
              <div className="monto-item">
                <span className="monto-label">USD:</span>
                <span className="monto-valor ganancia-positiva">US${ganancias.bruta.usd.toFixed(2)}</span>
              </div>
            )}
            {ganancias.bruta.ars === 0 && ganancias.bruta.usd === 0 && (
              <div className="monto-item">No hay ganancias brutas</div>
            )}
          </div>
        </div>

        <div className="resumen-card">
          <h2 className="card-title">Ganancia Neta</h2>
          <div className="card-content">
            {ganancias.neta.ars !== 0 && (
              <div className="monto-item">
                <span className="monto-label">ARS:</span>
                <span className={`monto-valor ${ganancias.neta.ars >= 0 ? 'ganancia-positiva' : 'ganancia-negativa'}`}>
                  ${ganancias.neta.ars.toFixed(2)}
                </span>
              </div>
            )}
            {ganancias.neta.usd !== 0 && (
              <div className="monto-item">
                <span className="monto-label">USD:</span>
                <span className={`monto-valor ${ganancias.neta.usd >= 0 ? 'ganancia-positiva' : 'ganancia-negativa'}`}>
                  US${ganancias.neta.usd.toFixed(2)}
                </span>
              </div>
            )}
            {ganancias.neta.ars === 0 && ganancias.neta.usd === 0 && (
              <div className="monto-item">No hay ganancias netas</div>
            )}
          </div>
        </div>

        {/* Total General */}
        <div className="resumen-card total-general">
          <h2 className="card-title">Total General</h2>
          <div className="card-content">
            <div className="total-item">
              <span className="total-label">Ingresos Totales:</span>
              <div className="total-montos">
                {(totalesMetodo.efectivo.ars + totalesMetodo.transferencia.ars) > 0 && (
                  <span className="monto-total">${(totalesMetodo.efectivo.ars + totalesMetodo.transferencia.ars).toFixed(2)} ARS</span>
                )}
                {(totalesMetodo.efectivo.usd + totalesMetodo.transferencia.usd) > 0 && (
                  <span className="monto-total">US${(totalesMetodo.efectivo.usd + totalesMetodo.transferencia.usd).toFixed(2)} USD</span>
                )}
              </div>
            </div>
            <div className="total-item">
              <span className="total-label">Ganancia Neta Total:</span>
              <div className="total-montos">
                {ganancias.neta.ars !== 0 && (
                  <span className={`monto-total ${ganancias.neta.ars >= 0 ? 'ganancia-positiva' : 'ganancia-negativa'}`}>
                    ${ganancias.neta.ars.toFixed(2)} ARS
                  </span>
                )}
                {ganancias.neta.usd !== 0 && (
                  <span className={`monto-total ${ganancias.neta.usd >= 0 ? 'ganancia-positiva' : 'ganancia-negativa'}`}>
                    US${ganancias.neta.usd.toFixed(2)} USD
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cuentas Bancarias */}
      {totalesMetodo.cuentasBancarias && Object.keys(totalesMetodo.cuentasBancarias).length > 0 && (
        <div className="cuentas-bancarias-section">
          <h2 className="section-title">Ingresos por Cuenta Bancaria</h2>
          <div className="categorias-grid">
            {Object.entries(totalesMetodo.cuentasBancarias).map(([cuenta, montos]) => (
              <div key={cuenta} className="categoria-card">
                <h3 className="categoria-nombre">{cuenta}</h3>
                <div className="categoria-montos">
                  {montos.ars > 0 && (
                    <div className="categoria-monto">
                      <span className="monto-label">ARS:</span>
                      <span className="monto-valor">${montos.ars.toFixed(2)}</span>
                    </div>
                  )}
                  {montos.usd > 0 && (
                    <div className="categoria-monto">
                      <span className="monto-label">USD:</span>
                      <span className="monto-valor">US${montos.usd.toFixed(2)}</span>
                    </div>
                  )}
                  {montos.ars === 0 && montos.usd === 0 && (
                    <div className="categoria-monto">Sin ingresos</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ganancia por categorías */}
      <div className="ganancias-categorias-section">
        <h2 className="section-title">Ganancia por Categorías</h2>
        <div className="categorias-grid">
          {Object.keys(gananciasPorCategoria).length === 0 ? (
            <div className="empty-state">No hay ganancias por categorías</div>
          ) : (
            Object.entries(gananciasPorCategoria).map(([categoria, montos]) => (
              <div key={categoria} className="categoria-card">
                <h3 className="categoria-nombre">{categoria}</h3>
                <div className="categoria-montos">
                  {montos.ars > 0 && (
                    <div className="categoria-monto">
                      <span className="monto-label">ARS:</span>
                      <span className="monto-valor ganancia-positiva">${montos.ars.toFixed(2)}</span>
                    </div>
                  )}
                  {montos.usd > 0 && (
                    <div className="categoria-monto">
                      <span className="monto-label">USD:</span>
                      <span className="monto-valor ganancia-positiva">US${montos.usd.toFixed(2)}</span>
                    </div>
                  )}
                  {montos.ars === 0 && montos.usd === 0 && (
                    <div className="categoria-monto">Sin ganancias</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Tesoreria
