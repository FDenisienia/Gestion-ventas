import { useState, useEffect, useMemo, memo } from 'react';
import { Container, Card, Form, Row, Col, Button, ButtonGroup, Badge, Table } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { obtenerVentas } from '../utils/storage';
import type { Venta, GananciaSemanal } from '../types/venta';

function GraficoSemanal() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  
  // Calcular fechas por defecto (últimos 7 días)
  const getDefaultDates = () => {
    const hoy = new Date();
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 6); // Incluir hoy + 6 días anteriores = 7 días
    
    return {
      inicio: hace7Dias.toISOString().split('T')[0],
      fin: hoy.toISOString().split('T')[0],
    };
  };
  
  const [fechaInicio, setFechaInicio] = useState<string>(getDefaultDates().inicio);
  const [fechaFin, setFechaFin] = useState<string>(getDefaultDates().fin);

  useEffect(() => {
    cargarVentas();
    
    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      cargarVentas();
    };
    
    // Escuchar eventos de almacenamiento
    window.addEventListener('storage', handleStorageChange);
    
    // También escuchar eventos personalizados para cambios en la misma pestaña
    window.addEventListener('ventasActualizadas', handleStorageChange);
    
    // Polling como respaldo (cada 10 segundos - menos agresivo)
    const interval = setInterval(cargarVentas, 10000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ventasActualizadas', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const cargarVentas = async () => {
    try {
      const ventasGuardadas = await obtenerVentas();
      setVentas(ventasGuardadas);
    } catch (error: any) {
      // Solo mostrar error si no es un error de conexión común
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error al cargar ventas:', error);
      }
    }
  };

  const establecerRangoFechas = (dias: number) => {
    const hoy = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - (dias - 1)); // -1 para incluir hoy
    
    setFechaInicio(fechaInicio.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  };

  const obtenerDatosPorFecha = (): GananciaSemanal[] => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999); // Incluir todo el día final
    
    // Validar que la fecha inicio sea menor o igual a fecha fin
    if (inicio > fin) {
      return [];
    }

    // Crear array con todas las fechas del rango
    const dias: GananciaSemanal[] = [];
    const fechaActual = new Date(inicio);
    
    while (fechaActual <= fin) {
      const fechaStr = fechaActual.toISOString().split('T')[0];
      dias.push({
        fecha: fechaStr,
        ganancia: 0,
      });
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    // Filtrar ventas por categoría si es necesario
    let ventasFiltradas = ventas;
    if (categoriaFiltro !== 'Todas') {
      ventasFiltradas = ventas.filter(v => v.categoria === categoriaFiltro);
    }

    // Filtrar ventas por rango de fechas
    ventasFiltradas = ventasFiltradas.filter((venta) => {
      const fechaVenta = new Date(venta.fecha);
      return fechaVenta >= inicio && fechaVenta <= fin;
    });

    // Agregar ganancias por día (solo ventas completamente pagadas)
    ventasFiltradas
      .filter(venta => venta.estadoPago === 'pagado')
      .forEach((venta) => {
        const fechaVenta = venta.fecha.split('T')[0];
        const diaEncontrado = dias.find(d => d.fecha === fechaVenta);
        
        if (diaEncontrado) {
          diaEncontrado.ganancia += venta.ganancia;
        }
      });

    // Formatear fechas para mostrar
    return dias.map(dia => ({
      ...dia,
      fecha: new Date(dia.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
    }));
  };

  const datosGrafico = useMemo(() => obtenerDatosPorFecha(), [ventas, categoriaFiltro, fechaInicio, fechaFin]);

  const categorias = useMemo(() => {
    const cats = new Set(ventas.map(v => v.categoria));
    return Array.from(cats).sort();
  }, [ventas]);

  const gananciaTotalPeriodo = datosGrafico.reduce((sum, d) => sum + d.ganancia, 0);
  
  const formatearRangoFechas = () => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return `${inicio.toLocaleDateString('es-ES')} - ${fin.toLocaleDateString('es-ES')}`;
  };

  // Calcular top 3 productos estrella (más vendidos)
  const topProductos = useMemo(() => {
    const ventasPagadas = ventas.filter(v => v.estadoPago === 'pagado');
    const productosVendidos: { [key: string]: { nombre: string; marca: string; cantidad: number; ganancia: number } } = {};

    ventasPagadas.forEach((venta) => {
      const producto = venta.producto;
      if (!productosVendidos[producto]) {
        productosVendidos[producto] = {
          nombre: producto,
          marca: venta.marca || '-',
          cantidad: 0,
          ganancia: 0,
        };
      }
      productosVendidos[producto].cantidad += venta.cantidad;
      productosVendidos[producto].ganancia += venta.ganancia;
      // Si la venta tiene marca y el producto no tiene marca guardada, actualizar
      if (venta.marca && productosVendidos[producto].marca === '-') {
        productosVendidos[producto].marca = venta.marca;
      }
    });

    const productosArray = Object.values(productosVendidos);
    if (productosArray.length === 0) return [];

    // Ordenar por cantidad descendente y tomar top 3
    return productosArray
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);
  }, [ventas]);

  // Calcular comparativa mensual
  const comparativaMensual = useMemo(() => {
    const ventasPagadas = ventas.filter(v => v.estadoPago === 'pagado');
    const meses: { [key: string]: { mes: string; ganancia: number; ventas: number } } = {};

    ventasPagadas.forEach((venta) => {
      const fecha = new Date(venta.fecha);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      
      if (!meses[mesKey]) {
        meses[mesKey] = {
          mes: mesNombre,
          ganancia: 0,
          ventas: 0,
        };
      }
      meses[mesKey].ganancia += venta.ganancia;
      meses[mesKey].ventas += 1;
    });

    const mesesArray = Object.entries(meses)
      .map(([key, value]) => ({ ...value, key }))
      .sort((a, b) => b.key.localeCompare(a.key)) // Ordenar por key (más reciente primero)
      .map(({ key, ...rest }) => rest); // Remover key del resultado

    if (mesesArray.length === 0) return null;

    const mejorMes = mesesArray.reduce((max, mes) => 
      mes.ganancia > max.ganancia ? mes : max
    );

    const peorMes = mesesArray.reduce((min, mes) => 
      mes.ganancia < min.ganancia ? mes : min
    );

    return {
      meses: mesesArray,
      mejorMes,
      peorMes,
      promedio: mesesArray.reduce((sum, m) => sum + m.ganancia, 0) / mesesArray.length,
    };
  }, [ventas]);

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h4 className="mb-0">Gráfico de Ganancias por Fecha</h4>
            <Form.Select
              style={{ width: 'auto', minWidth: '200px' }}
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="Todas">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={12}>
              <div className="mb-3">
                <Form.Label><strong>Filtro de Fechas</strong></Form.Label>
                <div className="mb-2">
                  <ButtonGroup size="sm" className="me-2">
                    <Button 
                      variant="outline-primary"
                      onClick={() => establecerRangoFechas(7)}
                    >
                      Últimos 7 días
                    </Button>
                    <Button 
                      variant="outline-primary"
                      onClick={() => establecerRangoFechas(15)}
                    >
                      Últimos 15 días
                    </Button>
                    <Button 
                      variant="outline-primary"
                      onClick={() => establecerRangoFechas(30)}
                    >
                      Último mes
                    </Button>
                    <Button 
                      variant="outline-primary"
                      onClick={() => establecerRangoFechas(90)}
                    >
                      Últimos 3 meses
                    </Button>
                  </ButtonGroup>
                </div>
                <Row>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Fecha Inicio</Form.Label>
                      <Form.Control
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Fecha Fin</Form.Label>
                      <Form.Control
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="d-flex align-items-end">
                    <div className="p-2 bg-light rounded w-100">
                      <small className="text-muted">
                        <strong>Período:</strong> {formatearRangoFechas()}
                      </small>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
          
          <div className="mb-3">
            <h5>
              Ganancia Total del Período:{' '}
              <span className="text-success">${gananciaTotalPeriodo.toFixed(2)}</span>
            </h5>
          </div>
          {ventas.length === 0 ? (
            <div className="text-center text-muted p-5">
              <p>No hay datos para mostrar. Agrega ventas para ver el gráfico.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ganancia']}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ganancia"
                  stroke="#28a745"
                  strokeWidth={3}
                  name="Ganancia"
                  dot={{ r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card.Body>
      </Card>

      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">⭐ Top 3 Productos Estrella</h5>
            </Card.Header>
            <Card.Body>
              {topProductos.length > 0 ? (
                <Table striped bordered hover>
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
                    {topProductos.map((producto, index) => (
                      <tr key={producto.nombre}>
                        <td>
                          <Badge bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'info'} className="fs-6">
                            #{index + 1}
                          </Badge>
                        </td>
                        <td>{producto.marca}</td>
                        <td><strong>{producto.nombre}</strong></td>
                        <td>
                          <Badge bg="success">{producto.cantidad} unidades</Badge>
                        </td>
                        <td>
                          <Badge bg="success">${producto.ganancia.toFixed(2)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center">No hay productos vendidos aún</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📊 Comparativa Mensual</h5>
            </Card.Header>
            <Card.Body>
              {comparativaMensual && comparativaMensual.meses.length > 0 ? (
                <>
                  <Row className="mb-3">
                    <Col md={6}>
                      <div className="p-3 bg-success bg-opacity-10 rounded">
                        <strong>Mejor Mes</strong>
                        <div className="mt-2">
                          <Badge bg="success" className="fs-6">
                            {comparativaMensual.mejorMes.mes}
                          </Badge>
                          <div className="mt-2">
                            <strong>${comparativaMensual.mejorMes.ganancia.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="p-3 bg-danger bg-opacity-10 rounded">
                        <strong>Peor Mes</strong>
                        <div className="mt-2">
                          <Badge bg="danger" className="fs-6">
                            {comparativaMensual.peorMes.mes}
                          </Badge>
                          <div className="mt-2">
                            <strong>${comparativaMensual.peorMes.ganancia.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                  <div className="mb-3">
                    <strong>Promedio Mensual:</strong>{' '}
                    <Badge bg="info" className="fs-6">
                      ${comparativaMensual.promedio.toFixed(2)}
                    </Badge>
                  </div>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Mes</th>
                        <th>Ganancia</th>
                        <th>Ventas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparativaMensual.meses.map((mes, index) => (
                        <tr key={index}>
                          <td>{mes.mes}</td>
                          <td>
                            <Badge bg={mes.ganancia === comparativaMensual.mejorMes.ganancia ? 'success' : mes.ganancia === comparativaMensual.peorMes.ganancia ? 'danger' : 'secondary'}>
                              ${mes.ganancia.toFixed(2)}
                            </Badge>
                          </td>
                          <td>{mes.ventas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div className="mt-3" style={{ height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparativaMensual.meses}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ganancia']}
                          labelStyle={{ color: '#000' }}
                        />
                        <Legend />
                        <Bar dataKey="ganancia" fill="#28a745" name="Ganancia" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <p className="text-muted text-center">No hay datos mensuales para comparar</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

// Memoizar componente para evitar re-renders innecesarios
export default memo(GraficoSemanal);

