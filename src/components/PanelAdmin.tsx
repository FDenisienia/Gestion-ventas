import { useState, useEffect, memo } from 'react';
import { Container, Table, Button, Modal, Form, Alert, Badge, Spinner } from 'react-bootstrap';
import { obtenerToken } from '../utils/authStorage';
import { API_BASE_URL } from '../utils/apiConfig';

interface Usuario {
  id: number;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

function PanelAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user' as 'admin' | 'user',
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      const token = obtenerToken();
      
      if (!token) {
        setError('No hay token de autenticación');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          setLoading(false);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status} al cargar usuarios`);
      }

      const data = await response.json();
      setUsuarios(data);
    } catch (err: any) {
      // No mostrar error si es un error de conexión (servidor no disponible)
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('ERR_CONNECTION_REFUSED')) {
        setError(err.message || 'Error al cargar usuarios');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUser(usuario);
      setFormData({
        username: usuario.username,
        password: '',
        role: usuario.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: 'user',
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'user',
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = obtenerToken();
      const url = editingUser
        ? `${API_BASE_URL}/usuarios/${editingUser.id}`
        : `${API_BASE_URL}/usuarios`;
      
      const method = editingUser ? 'PUT' : 'POST';
      
      // Preparar datos para enviar
      const dataToSend: any = {};
      if (editingUser) {
        // En edición, solo enviar campos que han cambiado
        if (formData.username !== editingUser.username) {
          dataToSend.username = formData.username;
        }
        if (formData.password) {
          dataToSend.password = formData.password;
        }
        if (formData.role !== editingUser.role) {
          dataToSend.role = formData.role;
        }
      } else {
        // En creación, enviar todos los campos
        dataToSend.username = formData.username;
        dataToSend.password = formData.password;
        dataToSend.role = formData.role;
      }

      // Si no hay cambios en edición, mostrar error
      if (editingUser && Object.keys(dataToSend).length === 0) {
        setError('No hay cambios para guardar');
        return;
      }

      // Validar que en creación haya contraseña
      if (!editingUser && !formData.password) {
        setError('La contraseña es requerida');
        return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar usuario');
      }

      setSuccess(editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
      handleCloseModal();
      cargarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al guardar usuario');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const token = obtenerToken();
      
      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Intentar obtener el mensaje de error
        let errorMessage = 'Error al eliminar usuario';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Si no se puede parsear el JSON, usar el status
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      setSuccess(responseData.message || 'Usuario eliminado correctamente');
      
      // Recargar la lista de usuarios inmediatamente
      await cargarUsuarios();
      
      // Esperar un momento para que el backend complete la eliminación de datos
      // y luego disparar eventos para recargar ventas y productos
      setTimeout(() => {
        // Disparar eventos para que se recarguen ventas y productos en todos los componentes
        // Esto asegura que el frontend refleje los cambios en stock y ventas
        console.log('Disparando eventos de actualización después de eliminar usuario...');
        
        window.dispatchEvent(new CustomEvent('ventasActualizadas', { 
          detail: { timestamp: Date.now(), motivo: 'usuarioEliminado' } 
        }));
        window.dispatchEvent(new Event('productosActualizados'));
        
        // Forzar recarga de ventas y productos en todos los componentes
        // Algunos componentes escuchan 'storage' también
        const storageEvent = new Event('storage');
        window.dispatchEvent(storageEvent);
      }, 1000); // 1 segundo de delay para asegurar que el backend terminó
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
      console.error('Error al eliminar usuario:', err);
    }
  };

  // Separar usuarios por rol
  const administradores = usuarios.filter(u => u.role === 'admin');
  const usuariosNormales = usuarios.filter(u => u.role === 'user');

  const renderTable = (listaUsuarios: Usuario[], titulo: string) => (
    <div className="mb-5">
      <h4 className="mb-3">{titulo}</h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Fecha Creación</th>
            <th>Última Actualización</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {listaUsuarios.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center">
                No hay {titulo.toLowerCase()} registrados
              </td>
            </tr>
          ) : (
            listaUsuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.id}</td>
                <td>{usuario.username}</td>
                <td>
                  <Badge bg={usuario.role === 'admin' ? 'danger' : 'primary'}>
                    {usuario.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </Badge>
                </td>
                <td>{new Date(usuario.createdAt).toLocaleDateString('es-ES')}</td>
                <td>{new Date(usuario.updatedAt).toLocaleDateString('es-ES')}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleOpenModal(usuario)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(usuario.id)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="d-flex justify-content-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Panel de Administración - Usuarios</h2>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Crear Usuario
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabla de Administradores */}
      {renderTable(administradores, 'Administradores')}

      {/* Tabla de Usuarios */}
      {renderTable(usuariosNormales, 'Usuarios')}

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Nombre de Usuario</Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={3}
                maxLength={50}
                placeholder="Ingresa el nombre de usuario"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Contraseña {editingUser && '(dejar vacío para no cambiar)'}
              </Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                minLength={6}
                placeholder="Ingresa la contraseña"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingUser ? 'Actualizar' : 'Crear'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

// Memoizar componente para evitar re-renders innecesarios
export default memo(PanelAdmin);

