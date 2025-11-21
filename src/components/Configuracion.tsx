import { useState, useEffect, memo } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { obtenerCredenciales, cerrarSesion, obtenerUsuario, obtenerToken, guardarUsuario } from '../utils/authStorage';
import { API_BASE_URL } from '../utils/apiConfig';

function Configuracion() {
  const [formData, setFormData] = useState({
    usernameActual: '',
    passwordActual: '',
    nuevoUsername: '',
    nuevaPassword: '',
    confirmarPassword: '',
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState<'success' | 'danger'>('success');

  useEffect(() => {
    // Obtener el usuario actual logueado, no las credenciales guardadas
    const usuario = obtenerUsuario();
    if (usuario) {
      setFormData(prev => ({
        ...prev,
        usernameActual: usuario.username,
      }));
    } else {
      // Fallback a credenciales si no hay usuario (compatibilidad)
      const credenciales = obtenerCredenciales();
      setFormData(prev => ({
        ...prev,
        usernameActual: credenciales.username,
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowAlert(false);

    // Validaciones
    if (!formData.passwordActual) {
      setAlertMessage('Debes ingresar la contraseña actual');
      setAlertVariant('danger');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    if (!formData.nuevoUsername && !formData.nuevaPassword) {
      setAlertMessage('Debes ingresar al menos un nuevo valor (usuario o contraseña)');
      setAlertVariant('danger');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    if (formData.nuevaPassword && formData.nuevaPassword !== formData.confirmarPassword) {
      setAlertMessage('Las contraseñas nuevas no coinciden');
      setAlertVariant('danger');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    if (formData.nuevaPassword && formData.nuevaPassword.length < 4) {
      setAlertMessage('La nueva contraseña debe tener al menos 4 caracteres');
      setAlertVariant('danger');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    // Intentar actualizar perfil en el backend
    try {
      const token = obtenerToken();
      if (!token) {
        setAlertMessage('No estás autenticado. Por favor, inicia sesión nuevamente.');
        setAlertVariant('danger');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        return;
      }

      const body: any = {
        passwordActual: formData.passwordActual,
      };

      if (formData.nuevoUsername) {
        body.username = formData.nuevoUsername;
      }

      if (formData.nuevaPassword) {
        body.password = formData.nuevaPassword;
      }

      const response = await fetch(`${API_BASE_URL}/usuarios/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar el perfil');
      }

      const data = await response.json();
      
      // Actualizar el usuario en localStorage
      if (data.user) {
        guardarUsuario(data.user);
      }

      setAlertMessage('Perfil actualizado correctamente. Por favor, inicia sesión nuevamente.');
      setAlertVariant('success');
      setShowAlert(true);
      
      // Limpiar formulario
      const usuario = obtenerUsuario();
      setFormData({
        usernameActual: usuario?.username || '',
        passwordActual: '',
        nuevoUsername: '',
        nuevaPassword: '',
        confirmarPassword: '',
      });

      // Cerrar sesión después de 2 segundos para que el usuario vea el mensaje
      setTimeout(() => {
        cerrarSesion();
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      setAlertMessage(error.message || 'Error al actualizar el perfil');
      setAlertVariant('danger');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Header>
              <h3 className="mb-0">Configuración de Usuario</h3>
            </Card.Header>
            <Card.Body>
              {showAlert && (
                <Alert variant={alertVariant} dismissible onClose={() => setShowAlert(false)}>
                  {alertMessage}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Usuario Actual</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.usernameActual}
                    disabled
                    className="bg-light"
                  />
                  <Form.Text className="text-muted">
                    Este es tu usuario actual
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Contraseña Actual *</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.passwordActual}
                    onChange={(e) => setFormData({ ...formData, passwordActual: e.target.value })}
                    required
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <Form.Text className="text-muted">
                    Requerida para confirmar los cambios
                  </Form.Text>
                </Form.Group>

                <hr />

                <h5 className="mb-3">Cambiar Credenciales</h5>

                <Form.Group className="mb-3">
                  <Form.Label>Nuevo Usuario</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nuevoUsername}
                    onChange={(e) => setFormData({ ...formData, nuevoUsername: e.target.value })}
                    placeholder="Deja vacío para mantener el actual"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nueva Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.nuevaPassword}
                    onChange={(e) => setFormData({ ...formData, nuevaPassword: e.target.value })}
                    placeholder="Deja vacío para mantener la actual"
                    minLength={4}
                  />
                  <Form.Text className="text-muted">
                    Mínimo 4 caracteres
                  </Form.Text>
                </Form.Group>

                {formData.nuevaPassword && (
                  <Form.Group className="mb-3">
                    <Form.Label>Confirmar Nueva Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      value={formData.confirmarPassword}
                      onChange={(e) => setFormData({ ...formData, confirmarPassword: e.target.value })}
                      placeholder="Confirma la nueva contraseña"
                      minLength={4}
                    />
                  </Form.Group>
                )}

                <div className="d-flex justify-content-end gap-2">
                  <Button variant="primary" type="submit">
                    Guardar Cambios
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

// Memoizar componente para evitar re-renders innecesarios
export default memo(Configuracion);



