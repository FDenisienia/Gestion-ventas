import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Container, Table, Button, Modal, Form, Row, Col, Badge, Alert } from 'react-bootstrap';
import type { Producto } from '../types/producto';
import { obtenerProductos, agregarProducto, actualizarProducto, eliminarProducto } from '../utils/productoStorage';

const CATEGORIAS = ['Electrónica', 'Ropa', 'Alimentos', 'Hogar', 'Deportes', 'Otros'];

function StockCRUD() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [nombreFiltro, setNombreFiltro] = useState<string>('');
  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    categoria: '',
    stock: '',
    costoUnitario: '',
    precioVenta: '',
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    cargarProductos();
    
    const handleStorageChange = () => {
      cargarProductos();
    };
    
    window.addEventListener('productosActualizados', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('productosActualizados', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const cargarProductos = async () => {
    try {
      const productosGuardados = await obtenerProductos();
      // Ordenar alfabéticamente por nombre
      const productosOrdenados = productosGuardados.sort((a, b) => {
        return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
      });
      setProductos(productosOrdenados);
    } catch (error: any) {
      // Solo mostrar error si no es un error de conexión común
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error al cargar productos:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const stock = parseInt(formData.stock);
    const costoUnitario = parseFloat(formData.costoUnitario);
    const precioVenta = parseFloat(formData.precioVenta);

    if (stock < 0 || costoUnitario < 0 || precioVenta < 0) {
      setAlertMessage('Todos los valores numéricos deben ser positivos');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    if (precioVenta <= costoUnitario) {
      setAlertMessage('El precio de venta debe ser mayor al costo unitario');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    if (editingProducto) {
      const productoActualizado: Producto = {
        ...editingProducto,
        nombre: formData.nombre,
        marca: formData.marca,
        categoria: formData.categoria,
        stock,
        costoUnitario,
        precioVenta,
      };
      await actualizarProducto(editingProducto.id, productoActualizado);
      setAlertMessage('Producto actualizado correctamente');
    } else {
      const nuevoProducto: Producto = {
        id: Date.now().toString(),
        nombre: formData.nombre,
        marca: formData.marca,
        categoria: formData.categoria,
        stock,
        costoUnitario,
        precioVenta,
      };
      await agregarProducto(nuevoProducto);
      setAlertMessage('Producto agregado correctamente');
    }

    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
    await cargarProductos();
    handleCloseModal();
  };

  const handleEdit = useCallback((producto: Producto) => {
    setEditingProducto(producto);
    setFormData({
      nombre: producto.nombre,
      marca: producto.marca || '',
      categoria: producto.categoria,
      stock: producto.stock.toString(),
      costoUnitario: producto.costoUnitario.toString(),
      precioVenta: producto.precioVenta.toString(),
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await eliminarProducto(id);
      await cargarProductos();
      setAlertMessage('Producto eliminado correctamente');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingProducto(null);
    setFormData({
      nombre: '',
      marca: '',
      categoria: '',
      stock: '',
      costoUnitario: '',
      precioVenta: '',
    });
  }, []);

  // Memoizar filtros para mejor rendimiento
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      // Filtro por categoría
      const cumpleCategoria = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
      // Filtro por nombre
      const cumpleNombre = nombreFiltro === '' || 
        p.nombre.toLowerCase().includes(nombreFiltro.toLowerCase());
      return cumpleCategoria && cumpleNombre;
    });
  }, [productos, categoriaFiltro, nombreFiltro]);

  const productosBajoStock = useMemo(() => 
    productos.filter(p => p.stock <= 5 && p.stock > 0), 
    [productos]
  );
  
  const productosSinStock = useMemo(() => 
    productos.filter(p => p.stock === 0), 
    [productos]
  );

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Gestión de Stock</h2>
          <p className="text-muted">Administra tus productos y su inventario</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Nuevo Producto
          </Button>
        </Col>
      </Row>

      {showAlert && (
        <Alert variant="success" dismissible onClose={() => setShowAlert(false)}>
          {alertMessage}
        </Alert>
      )}

      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Buscar por Nombre</Form.Label>
            <Form.Control
              type="text"
              placeholder="Buscar producto..."
              value={nombreFiltro}
              onChange={(e) => setNombreFiltro(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filtrar por Categoría</Form.Label>
            <Form.Select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="Todas">Todas las categorías</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <div className="d-flex gap-2 align-items-end h-100">
            {productosBajoStock.length > 0 && (
              <Badge bg="warning" className="p-2">
                Bajo Stock: {productosBajoStock.length} productos
              </Badge>
            )}
            {productosSinStock.length > 0 && (
              <Badge bg="danger" className="p-2">
                Sin Stock: {productosSinStock.length} productos
              </Badge>
            )}
          </div>
        </Col>
      </Row>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Marca</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Costo Unit.</th>
            <th>Precio Venta</th>
            <th>Ganancia Unit.</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center text-muted">
                No hay productos registrados. Agrega tu primer producto.
              </td>
            </tr>
          ) : (
            productosFiltrados.map((producto) => {
              const gananciaUnit = producto.precioVenta - producto.costoUnitario;
              const stockBadge = producto.stock === 0 
                ? <Badge bg="danger">Sin Stock</Badge>
                : producto.stock <= 5 
                ? <Badge bg="warning">{producto.stock}</Badge>
                : <Badge bg="success">{producto.stock}</Badge>;
              
              return (
                <tr key={producto.id}>
                  <td>{producto.marca || '-'}</td>
                  <td><strong>{producto.nombre}</strong></td>
                  <td>
                    <Badge bg="info">{producto.categoria}</Badge>
                  </td>
                  <td>{stockBadge}</td>
                  <td>${producto.costoUnitario.toFixed(2)}</td>
                  <td>${producto.precioVenta.toFixed(2)}</td>
                  <td>
                    <Badge bg={gananciaUnit > 0 ? 'success' : 'danger'}>
                      ${gananciaUnit.toFixed(2)}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(producto)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(producto.id)}
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
          <Modal.Title>{editingProducto ? 'Editar Producto' : 'Nuevo Producto'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Producto</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Ej: Laptop"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Marca</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    required
                    placeholder="Ej: HP"
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
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock Inicial</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Costo Unitario</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costoUnitario}
                    onChange={(e) => setFormData({ ...formData, costoUnitario: e.target.value })}
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
            </Row>
            {formData.costoUnitario && formData.precioVenta && (
              <Row>
                <Col>
                  <div className="p-3 bg-light rounded">
                    <strong>Ganancia por unidad:</strong>{' '}
                    <Badge bg="success">
                      ${(parseFloat(formData.precioVenta) - parseFloat(formData.costoUnitario)).toFixed(2)}
                    </Badge>
                  </div>
                </Col>
              </Row>
            )}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                {editingProducto ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

// Memoizar componente para evitar re-renders innecesarios
export default memo(StockCRUD);

