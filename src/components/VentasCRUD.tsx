import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Container, Table, Button, Modal, Form, Row, Col, Badge, Alert } from 'react-bootstrap';
import type { Venta, EstadoPago, MetodoPago } from '../types/venta';
import { obtenerVentas, agregarVenta, actualizarVenta, eliminarVenta } from '../utils/storage';
import { obtenerProductos, obtenerProductoPorId, descontarStock, aumentarStock } from '../utils/productoStorage';
import type { Producto } from '../types/producto';

const CATEGORIAS = ['Electrónica', 'Ropa', 'Alimentos', 'Hogar', 'Deportes', 'Otros'];

const getEstadoPagoInfo = (estado: EstadoPago) => {
  switch (estado) {
    case 'pagado':
      return { color: 'success', texto: 'Pagado' };
    case 'parcial':
      return { color: 'warning', texto: 'Pago Parcial' };
    case 'pendiente':
      return { color: 'danger', texto: 'Pendiente' };
    default:
      return { color: 'secondary', texto: 'Desconocido' };
  }
};

function VentasCRUD() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [formData, setFormData] = useState({
    nombreCliente: '',
    apellidoCliente: '',
    dni: '',
    productoId: '',
    producto: '',
    categoria: '',
    costo: '',
    precioVenta: '',
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
    estadoPago: 'pendiente' as EstadoPago,
    montoPagado: '',
    metodoPago: '' as MetodoPago | '',
    cuentaBanco: '',
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [stockDisponible, setStockDisponible] = useState<number>(0);

  useEffect(() => {
    cargarVentas();
    cargarProductos();
    
    const handleProductosChange = () => {
      cargarProductos();
    };
    
    const handleVentasChange = () => {
      cargarVentas();
    };
    
    window.addEventListener('productosActualizados', handleProductosChange);
    window.addEventListener('ventasActualizadas', handleVentasChange);
    window.addEventListener('storage', handleVentasChange);
    
    return () => {
      window.removeEventListener('productosActualizados', handleProductosChange);
      window.removeEventListener('ventasActualizadas', handleVentasChange);
      window.removeEventListener('storage', handleVentasChange);
    };
  }, []);

  const cargarVentas = async () => {
    try {
      const ventasGuardadas = await obtenerVentas();
      // Ordenar por fecha descendente (más reciente primero)
      const ventasOrdenadas = ventasGuardadas.sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return fechaB - fechaA; // Descendente
      });
      setVentas(ventasOrdenadas);
    } catch (error: any) {
      // Solo mostrar error si no es un error de conexión común
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error al cargar ventas:', error);
      }
    }
  };

  const cargarProductos = async () => {
    try {
      const productosGuardados = await obtenerProductos();
      setProductos(productosGuardados.filter(p => p.stock > 0)); // Solo productos con stock
    } catch (error: any) {
      // Solo mostrar error si no es un error de conexión común
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error al cargar productos:', error);
      }
    }
  };

  const handleProductoChange = useCallback(async (productoId: string) => {
    if (productoId) {
      try {
        const producto = await obtenerProductoPorId(productoId);
        if (producto) {
          setFormData(prev => ({
            ...prev,
            productoId,
            producto: producto.nombre,
            categoria: producto.categoria,
            costo: producto.costoUnitario.toString(),
            precioVenta: producto.precioVenta.toString(),
          }));
          setStockDisponible(producto.stock);
        }
      } catch (error) {
        console.error('Error al obtener producto:', error);
        setStockDisponible(0);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        productoId: '',
        producto: '',
        categoria: '',
        costo: '',
        precioVenta: '',
      }));
      setStockDisponible(0);
    }
  }, []);

  // Actualizar stock cuando cambie el productoId
  useEffect(() => {
    const actualizarStock = async () => {
      if (formData.productoId) {
        try {
          const producto = await obtenerProductoPorId(formData.productoId);
          if (producto) {
            setStockDisponible(producto.stock);
          } else {
            setStockDisponible(0);
          }
        } catch (error) {
          setStockDisponible(0);
        }
      } else {
        setStockDisponible(0);
      }
    };
    actualizarStock();
  }, [formData.productoId]);

  const obtenerMarcaProducto = async (productoId?: string): Promise<string> => {
    if (!productoId) return '';
    try {
      const producto = await obtenerProductoPorId(productoId);
      return producto?.marca || '';
    } catch (error) {
      console.error('Error al obtener marca del producto:', error);
      return '';
    }
  };


  const calcularGanancia = (costo: number, precioVenta: number, cantidad: number): number => {
    return (precioVenta - costo) * cantidad;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const costo = parseFloat(formData.costo);
    const precioVenta = parseFloat(formData.precioVenta);
    const cantidad = parseInt(formData.cantidad);
    const totalVenta = precioVenta * cantidad;

    if (costo < 0 || precioVenta < 0 || cantidad <= 0) {
      setAlertMessage('Todos los valores numéricos deben ser positivos y la cantidad mayor a 0');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    if (precioVenta <= costo) {
      setAlertMessage('El precio de venta debe ser mayor al costo');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    // Validar monto pagado si es pago parcial
    if (formData.estadoPago === 'parcial') {
      const montoPagado = parseFloat(formData.montoPagado);
      if (!montoPagado || montoPagado <= 0) {
        setAlertMessage('Debes ingresar un monto pagado válido');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        return;
      }
      if (montoPagado >= totalVenta) {
        setAlertMessage('El monto pagado debe ser menor al total de la venta. Si pagó todo, selecciona "Pagado"');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        return;
      }
    }

    // Validar stock si viene de un producto del stock
    if (formData.productoId && !editingVenta) {
      try {
        const producto = await obtenerProductoPorId(formData.productoId);
        if (!producto) {
          setAlertMessage('El producto seleccionado no existe');
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 3000);
          return;
        }
        if (producto.stock < cantidad) {
          setAlertMessage(`No hay suficiente stock. Stock disponible: ${producto.stock}`);
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 3000);
          return;
        }
      } catch (error) {
        setAlertMessage('Error al validar el producto');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        return;
      }
    }

    const ganancia = calcularGanancia(costo, precioVenta, cantidad);

    if (editingVenta) {
      // Si se cambió la cantidad y viene de stock, ajustar stock
      if (editingVenta.productoId && editingVenta.cantidad !== cantidad) {
        const diferencia = cantidad - editingVenta.cantidad;
        if (diferencia > 0) {
          // Se aumentó la cantidad, descontar más
          const exito = await descontarStock(editingVenta.productoId, diferencia);
          if (!exito) {
            setAlertMessage('No hay suficiente stock para la cantidad solicitada');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
          }
        } else {
          // Se disminuyó la cantidad, devolver stock
          await aumentarStock(editingVenta.productoId, Math.abs(diferencia));
        }
      }
      
      const marca = await obtenerMarcaProducto(formData.productoId || editingVenta.productoId);
      const ventaActualizada: Venta = {
        ...editingVenta,
        nombreCliente: formData.nombreCliente,
        apellidoCliente: formData.apellidoCliente,
        dni: formData.dni,
        producto: formData.producto,
        productoId: formData.productoId || editingVenta.productoId,
        marca: marca || editingVenta.marca,
        categoria: formData.categoria,
        costo,
        precioVenta,
        cantidad,
        fecha: formData.fecha,
        ganancia,
        estadoPago: formData.estadoPago,
        montoPagado: formData.estadoPago === 'parcial' ? parseFloat(formData.montoPagado) : undefined,
        metodoPago: formData.metodoPago || undefined,
        cuentaBanco: formData.metodoPago === 'transferencia' ? formData.cuentaBanco : undefined,
      };
      await actualizarVenta(editingVenta.id, ventaActualizada);
      setAlertMessage('Venta actualizada correctamente');
    } else {
      // Descontar stock si viene de un producto del stock
      if (formData.productoId) {
        const exito = await descontarStock(formData.productoId, cantidad);
        if (!exito) {
          setAlertMessage('Error al descontar stock');
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 3000);
          return;
        }
      }
      
      const marca = await obtenerMarcaProducto(formData.productoId);
      const nuevaVenta: Venta = {
        id: Date.now().toString(),
        nombreCliente: formData.nombreCliente,
        apellidoCliente: formData.apellidoCliente,
        dni: formData.dni,
        producto: formData.producto,
        productoId: formData.productoId || undefined,
        marca: marca || undefined,
        categoria: formData.categoria,
        costo,
        precioVenta,
        cantidad,
        fecha: formData.fecha,
        ganancia,
        estadoPago: formData.estadoPago,
        montoPagado: formData.estadoPago === 'parcial' ? parseFloat(formData.montoPagado) : undefined,
        metodoPago: formData.metodoPago || undefined,
        cuentaBanco: formData.metodoPago === 'transferencia' ? formData.cuentaBanco : undefined,
      };
      await agregarVenta(nuevaVenta);
      setAlertMessage('Venta agregada correctamente');
      await cargarProductos(); // Actualizar lista de productos disponibles
    }

    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
    await cargarVentas();
    handleCloseModal();
  };

  const handleEdit = useCallback((venta: Venta) => {
    setEditingVenta(venta);
    setFormData({
      nombreCliente: venta.nombreCliente || '',
      apellidoCliente: venta.apellidoCliente || '',
      dni: venta.dni || '',
      productoId: venta.productoId || '',
      producto: venta.producto,
      categoria: venta.categoria,
      costo: venta.costo.toString(),
      precioVenta: venta.precioVenta.toString(),
      cantidad: venta.cantidad.toString(),
      fecha: venta.fecha,
      estadoPago: venta.estadoPago || 'pendiente',
      montoPagado: venta.montoPagado?.toString() || '',
      metodoPago: venta.metodoPago || '',
      cuentaBanco: venta.cuentaBanco || '',
    });
    setShowModal(true);
  }, []);

  const handleMarcarComoPagado = useCallback(async (venta: Venta) => {
    const totalVenta = venta.precioVenta * venta.cantidad;
    const montoPendiente = venta.estadoPago === 'parcial' 
      ? totalVenta - (venta.montoPagado || 0)
      : totalVenta;
    
    if (window.confirm(`¿Marcar esta venta como completamente pagada? Pendiente: $${montoPendiente.toFixed(2)}`)) {
      const ventaActualizada: Venta = {
        ...venta,
        estadoPago: 'pagado',
        montoPagado: undefined, // Ya no es necesario el monto parcial
      };
      await actualizarVenta(venta.id, ventaActualizada);
      await cargarVentas();
      setAlertMessage('Venta marcada como pagada correctamente');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  }, [ventas]);

  const handleDelete = useCallback(async (id: string) => {
    const venta = ventas.find(v => v.id === id);
    if (!venta) return;

    const totalVenta = venta.precioVenta * venta.cantidad;
    let mensajeConfirmacion = '¿Estás seguro de eliminar esta venta?';
    let mensajeImpacto = 'Venta eliminada correctamente';

    // Si la venta estaba pagada, mostrar información sobre el impacto en caja/transferencia
    if (venta.estadoPago === 'pagado' && venta.metodoPago) {
      if (venta.metodoPago === 'efectivo') {
        mensajeConfirmacion = `¿Estás seguro de eliminar esta venta?\n\nEsta venta estaba pagada en EFECTIVO por $${totalVenta.toFixed(2)}.\nSe restará este monto del total de CAJA.`;
        mensajeImpacto = `Venta eliminada correctamente. Se restó $${totalVenta.toFixed(2)} del total de CAJA (efectivo).`;
      } else if (venta.metodoPago === 'transferencia') {
        const cuenta = venta.cuentaBanco || 'Sin especificar';
        mensajeConfirmacion = `¿Estás seguro de eliminar esta venta?\n\nEsta venta estaba pagada por TRANSFERENCIA a la cuenta "${cuenta}" por $${totalVenta.toFixed(2)}.\nSe restará este monto del total de TRANSFERENCIAS.`;
        mensajeImpacto = `Venta eliminada correctamente. Se restó $${totalVenta.toFixed(2)} del total de TRANSFERENCIAS (cuenta: ${cuenta}).`;
      }
    } else if (venta.estadoPago === 'parcial' && venta.metodoPago && venta.montoPagado) {
      const montoPagado = venta.montoPagado;
      if (venta.metodoPago === 'efectivo') {
        mensajeConfirmacion = `¿Estás seguro de eliminar esta venta?\n\nEsta venta tenía un pago PARCIAL en EFECTIVO de $${montoPagado.toFixed(2)}.\nSe restará este monto del total de CAJA.`;
        mensajeImpacto = `Venta eliminada correctamente. Se restó $${montoPagado.toFixed(2)} del total de CAJA (efectivo).`;
      } else if (venta.metodoPago === 'transferencia') {
        const cuenta = venta.cuentaBanco || 'Sin especificar';
        mensajeConfirmacion = `¿Estás seguro de eliminar esta venta?\n\nEsta venta tenía un pago PARCIAL por TRANSFERENCIA a la cuenta "${cuenta}" de $${montoPagado.toFixed(2)}.\nSe restará este monto del total de TRANSFERENCIAS.`;
        mensajeImpacto = `Venta eliminada correctamente. Se restó $${montoPagado.toFixed(2)} del total de TRANSFERENCIAS (cuenta: ${cuenta}).`;
      }
    }

    if (window.confirm(mensajeConfirmacion)) {
      // El backend se encarga automáticamente de revertir el stock al eliminar la venta
      // No es necesario hacerlo manualmente aquí para evitar duplicación
      await eliminarVenta(id);
      await cargarVentas();
      await cargarProductos(); // Recargar productos para reflejar el stock revertido
      setAlertMessage(mensajeImpacto);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  }, [ventas]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingVenta(null);
    setFormData({
      nombreCliente: '',
      apellidoCliente: '',
      dni: '',
      productoId: '',
      producto: '',
      categoria: '',
      costo: '',
      precioVenta: '',
      cantidad: '',
      fecha: new Date().toISOString().split('T')[0],
      estadoPago: 'pendiente',
      montoPagado: '',
      metodoPago: '',
      cuentaBanco: '',
    });
  }, []);

  // Filtrar ventas por búsqueda (solo por DNI) - Memoizado para mejor rendimiento
  const ventasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return ventas;
    
    const terminoBusqueda = busqueda.trim().toLowerCase();
    return ventas.filter((venta) => {
      const dni = (venta.dni || '').toLowerCase();
      return dni.includes(terminoBusqueda);
    });
  }, [ventas, busqueda]);

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Gestión de Ventas</h2>
          <p className="text-muted">Administra tus ventas de productos</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Nueva Venta
          </Button>
        </Col>
      </Row>

      {showAlert && (
        <Alert variant="success" dismissible onClose={() => setShowAlert(false)}>
          {alertMessage}
        </Alert>
      )}

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label><strong>Buscar</strong></Form.Label>
            <Form.Control
              type="text"
              placeholder="Buscar por DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <Form.Text className="text-muted">
              {busqueda && `Mostrando ${ventasFiltradas.length} de ${ventas.length} ventas`}
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      <Table striped bordered hover style={{ width: '100%', tableLayout: 'auto' }}>
        <thead>
          <tr>
            <th style={{ whiteSpace: 'nowrap' }}>Cliente</th>
            <th style={{ whiteSpace: 'nowrap' }}>DNI</th>
            <th style={{ whiteSpace: 'nowrap' }}>Marca</th>
            <th style={{ whiteSpace: 'nowrap' }}>Producto</th>
            <th style={{ whiteSpace: 'nowrap' }}>Categoría</th>
            <th style={{ whiteSpace: 'nowrap' }}>Costo Unit.</th>
            <th style={{ whiteSpace: 'nowrap' }}>Precio Venta</th>
            <th style={{ whiteSpace: 'nowrap' }}>Cantidad</th>
            <th style={{ whiteSpace: 'nowrap' }}>Total Venta</th>
            <th style={{ whiteSpace: 'nowrap' }}>Ganancia</th>
            <th style={{ whiteSpace: 'nowrap' }}>Estado Pago</th>
            <th style={{ whiteSpace: 'nowrap' }}>Método Pago</th>
            <th style={{ whiteSpace: 'nowrap' }}>Pendiente</th>
            <th style={{ whiteSpace: 'nowrap' }}>Fecha</th>
            <th style={{ whiteSpace: 'nowrap' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ventasFiltradas.length === 0 ? (
            <tr>
              <td colSpan={15} className="text-center text-muted">
                {ventas.length === 0 
                  ? 'No hay ventas registradas. Agrega tu primera venta.'
                  : `No se encontraron ventas que coincidan con "${busqueda}"`
                }
              </td>
            </tr>
          ) : (
            ventasFiltradas.map((venta) => {
              const estadoInfo = getEstadoPagoInfo(venta.estadoPago || 'pendiente');
              const totalVenta = venta.precioVenta * venta.cantidad;
              const nombreCompleto = `${venta.nombreCliente || ''} ${venta.apellidoCliente || ''}`.trim() || 'Sin nombre';
              const diferenciaPendiente = venta.estadoPago === 'parcial' && venta.montoPagado 
                ? totalVenta - venta.montoPagado 
                : venta.estadoPago === 'pagado' ? 0 : totalVenta;
              
              return (
                <tr key={venta.id}>
                  <td style={{ whiteSpace: 'nowrap' }}><strong>{nombreCompleto}</strong></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{venta.dni || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{venta.marca || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{venta.producto}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <Badge bg="info">{venta.categoria}</Badge>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>${venta.costo.toFixed(2)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>${venta.precioVenta.toFixed(2)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{venta.cantidad}</td>
                  <td style={{ whiteSpace: 'nowrap' }}><strong>${totalVenta.toFixed(2)}</strong></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <Badge bg={venta.ganancia > 0 ? 'success' : 'danger'}>
                      ${venta.ganancia.toFixed(2)}
                    </Badge>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <Badge bg={estadoInfo.color}>{estadoInfo.texto}</Badge>
                    {venta.estadoPago === 'parcial' && venta.montoPagado && (
                      <span className="small text-muted ms-1">
                        Pagado: ${venta.montoPagado.toFixed(2)}
                      </span>
                    )}
                    {(venta.estadoPago === 'parcial' || venta.estadoPago === 'pendiente') && (
                      <Button
                        variant="success"
                        size="sm"
                        className="ms-1"
                        onClick={() => handleMarcarComoPagado(venta)}
                      >
                        Pagado
                      </Button>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {venta.metodoPago ? (
                      <>
                        <Badge bg={venta.metodoPago === 'efectivo' ? 'success' : 'info'}>
                          {venta.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                        </Badge>
                        {venta.metodoPago === 'transferencia' && venta.cuentaBanco && (
                          <span className="small text-muted ms-1">
                            {venta.cuentaBanco}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {venta.estadoPago === 'pagado' ? (
                      <Badge bg="success">$0.00</Badge>
                    ) : (
                      <Badge bg="danger">${diferenciaPendiente.toFixed(2)}</Badge>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(venta.fecha).toLocaleDateString('es-ES')}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(venta)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(venta.id)}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingVenta ? 'Editar Venta' : 'Nueva Venta'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Cliente</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nombreCliente}
                    onChange={(e) => setFormData({ ...formData, nombreCliente: e.target.value })}
                    required
                    placeholder="Nombre"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido del Cliente</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.apellidoCliente}
                    onChange={(e) => setFormData({ ...formData, apellidoCliente: e.target.value })}
                    required
                    placeholder="Apellido"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>DNI</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="DNI del cliente"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Producto del Stock</Form.Label>
                  <Form.Select
                    value={formData.productoId}
                    onChange={(e) => handleProductoChange(e.target.value)}
                  >
                    <option value="">Selecciona un producto (o ingresa manualmente)</option>
                    {productos.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.nombre} {prod.marca ? `- ${prod.marca}` : ''} - Stock: {prod.stock} - ${prod.precioVenta.toFixed(2)}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Selecciona un producto del stock para auto-completar los datos
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Producto</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.producto}
                    onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                    required
                    placeholder="Nombre del producto"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Categoría</Form.Label>
                  <Form.Select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              {formData.productoId && (
                <Col md={6}>
                  <div className="p-2 bg-info bg-opacity-10 rounded">
                    <small className="text-info">
                      <strong>Stock disponible:</strong>{' '}
                      {stockDisponible} unidades
                    </small>
                  </div>
                </Col>
              )}
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado de Pago</Form.Label>
                  <Form.Select
                    value={formData.estadoPago}
                    onChange={(e) => setFormData({ ...formData, estadoPago: e.target.value as EstadoPago, montoPagado: e.target.value !== 'parcial' ? '' : formData.montoPagado })}
                    required
                  >
                    <option value="pendiente">Pendiente (Rojo)</option>
                    <option value="parcial">Pago Parcial (Naranja)</option>
                    <option value="pagado">Pagado (Verde)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              {formData.estadoPago === 'parcial' && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Monto Pagado</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.montoPagado}
                      onChange={(e) => setFormData({ ...formData, montoPagado: e.target.value })}
                      required={formData.estadoPago === 'parcial'}
                      placeholder="Ingresa el monto pagado"
                    />
                    {formData.precioVenta && formData.cantidad && formData.montoPagado && (
                      <Form.Text className="text-muted">
                        Total: ${(parseFloat(formData.precioVenta) * parseInt(formData.cantidad)).toFixed(2)} | 
                        Pendiente: ${((parseFloat(formData.precioVenta) * parseInt(formData.cantidad)) - (parseFloat(formData.montoPagado) || 0)).toFixed(2)}
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              )}
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Método de Pago</Form.Label>
                  <Form.Select
                    value={formData.metodoPago}
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value as MetodoPago, cuentaBanco: e.target.value !== 'transferencia' ? '' : formData.cuentaBanco })}
                  >
                    <option value="">Selecciona método de pago</option>
                    <option value="efectivo">Efectivo (Caja)</option>
                    <option value="transferencia">Transferencia</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              {formData.metodoPago === 'transferencia' && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cuenta Bancaria</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.cuentaBanco}
                      onChange={(e) => setFormData({ ...formData, cuentaBanco: e.target.value })}
                      placeholder="Ej: Banco Nación - Caja de Ahorro 123456"
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Costo Unitario</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costo}
                    onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio de Venta</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cantidad</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <div className="p-3 bg-light rounded">
                  <strong>Ganancia estimada:</strong>{' '}
                  {formData.costo && formData.precioVenta && formData.cantidad ? (
                    <Badge bg="success">
                      ${calcularGanancia(
                        parseFloat(formData.costo) || 0,
                        parseFloat(formData.precioVenta) || 0,
                        parseInt(formData.cantidad) || 0
                      ).toFixed(2)}
                    </Badge>
                  ) : (
                    <span className="text-muted">$0.00</span>
                  )}
                </div>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                {editingVenta ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

// Memoizar componente para evitar re-renders innecesarios
export default memo(VentasCRUD);

