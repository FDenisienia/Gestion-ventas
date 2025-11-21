import { useState, memo } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { iniciarSesion, obtenerCredenciales } from '../utils/authStorage';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login = memo(function Login({ onLoginSuccess }: LoginProps) {
  const credenciales = obtenerCredenciales();
  const [username, setUsername] = useState(credenciales.username);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await iniciarSesion(username, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Usuario o contraseña incorrectos');
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">
            <h2>Iniciar Sesión</h2>
          </Card.Title>
          
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Usuario</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="Ingresa tu usuario"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Ingresa tu contraseña"
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
});

export default Login;


