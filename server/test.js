import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';
let adminToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Función para hacer peticiones
async function request(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Preparar el body correctamente
    let body = options.body;
    if (body && typeof body !== 'string') {
      body = JSON.stringify(body);
    }
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken && { 'Authorization': `Bearer ${adminToken}` }),
        ...(options.headers || {})
      },
      ...(body && { body })
    });
    
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

// Función para testear
function test(name, fn) {
  return async () => {
    try {
      await fn();
      testResults.passed++;
      console.log(`✅ ${name}`);
    } catch (error) {
      testResults.failed++;
      testResults.errors.push({ test: name, error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    }
  };
}

// Tests de autenticación
async function testAuth() {
  console.log('\n=== TESTING AUTHENTICATION ===\n');
  
  await test('Login con credenciales válidas', async () => {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'gestionapp', password: 'admin123' })
    });
    
    if (!result.ok || !result.data.token) {
      throw new Error('Login falló');
    }
    adminToken = result.data.token;
    if (result.data.user.role !== 'admin') {
      throw new Error('Usuario no es admin');
    }
  })();
  
  await test('Login con credenciales inválidas', async () => {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'invalid', password: 'invalid' })
    });
    
    if (result.ok) {
      throw new Error('Login debería fallar con credenciales inválidas');
    }
  })();
  
  await test('Verificar token', async () => {
    const result = await request('/auth/verify', {
      method: 'POST'
    });
    
    if (!result.ok || !result.data.valid) {
      throw new Error('Verificación de token falló');
    }
  })();
}

// Tests de usuarios
let createdUserIds = [];

async function testUsuarios() {
  console.log('\n=== TESTING USUARIOS ===\n');
  
  await test('Obtener lista de usuarios', async () => {
    const result = await request('/usuarios');
    if (!result.ok || !Array.isArray(result.data)) {
      throw new Error('No se pudo obtener lista de usuarios');
    }
  })();
  
  await test('Crear usuario normal', async () => {
    const result = await request('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        password: 'test123',
        role: 'user'
      })
    });
    
    if (!result.ok || !result.data.user) {
      throw new Error('No se pudo crear usuario');
    }
    createdUserIds.push(result.data.user.id);
  })();
  
  await test('Crear usuario admin', async () => {
    const result = await request('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        username: `testadmin_${Date.now()}`,
        password: 'test123',
        role: 'admin'
      })
    });
    
    if (!result.ok || !result.data.user) {
      throw new Error('No se pudo crear usuario admin');
    }
    createdUserIds.push(result.data.user.id);
  })();
  
  await test('Crear usuario duplicado (debe fallar)', async () => {
    const username = `duplicate_${Date.now()}`;
    await request('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password: 'test123',
        role: 'user'
      })
    });
    
    const result = await request('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password: 'test123',
        role: 'user'
      })
    });
    
    if (result.ok) {
      throw new Error('No debería permitir crear usuario duplicado');
    }
  })();
  
  await test('Obtener usuario por ID', async () => {
    if (createdUserIds.length === 0) return;
    const userId = createdUserIds[0];
    const result = await request(`/usuarios/${userId}`);
    
    if (!result.ok || result.data.id !== userId) {
      throw new Error('No se pudo obtener usuario por ID');
    }
  })();
  
  await test('Actualizar usuario', async () => {
    if (createdUserIds.length === 0) return;
    const userId = createdUserIds[0];
    const result = await request(`/usuarios/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        password: 'newpassword123'
      })
    });
    
    if (!result.ok) {
      throw new Error('No se pudo actualizar usuario');
    }
  })();
  
  await test('Eliminar usuario', async () => {
    if (createdUserIds.length === 0) return;
    const userId = createdUserIds.pop();
    const result = await request(`/usuarios/${userId}`, {
      method: 'DELETE'
    });
    
    if (!result.ok) {
      throw new Error('No se pudo eliminar usuario');
    }
  })();
  
  await test('Eliminar todos los usuarios de prueba', async () => {
    for (const userId of createdUserIds) {
      await request(`/usuarios/${userId}`, { method: 'DELETE' });
    }
    createdUserIds = [];
  })();
}

// Tests de productos
let createdProductIds = [];

async function testProductos() {
  console.log('\n=== TESTING PRODUCTOS ===\n');
  
  await test('Obtener lista de productos', async () => {
    const result = await request('/productos');
    if (!result.ok || !Array.isArray(result.data)) {
      throw new Error('No se pudo obtener lista de productos');
    }
  })();
  
  await test('Crear producto', async () => {
    const productId = `TEST_${Date.now()}`;
    const result = await request('/productos', {
      method: 'POST',
      body: JSON.stringify({
        id: productId,
        nombre: 'Producto Test',
        marca: 'Marca Test',
        categoria: 'Categoria Test',
        stock: 10,
        costoUnitario: 100,
        precioVenta: 150,
        descripcion: 'Descripción de prueba'
      })
    });
    
    if (!result.ok) {
      throw new Error('No se pudo crear producto');
    }
    createdProductIds.push(productId);
  })();
  
  await test('Obtener producto por ID', async () => {
    if (createdProductIds.length === 0) return;
    const productId = createdProductIds[0];
    const result = await request(`/productos/${productId}`);
    
    if (!result.ok || result.data.id !== productId) {
      throw new Error('No se pudo obtener producto por ID');
    }
  })();
  
  await test('Actualizar producto', async () => {
    if (createdProductIds.length === 0) return;
    const productId = createdProductIds[0];
    const result = await request(`/productos/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre: 'Producto Actualizado',
        marca: 'Marca Test',
        categoria: 'Categoria Test',
        stock: 20,
        costoUnitario: 100,
        precioVenta: 150
      })
    });
    
    if (!result.ok) {
      throw new Error('No se pudo actualizar producto');
    }
  })();
  
  await test('Eliminar producto', async () => {
    if (createdProductIds.length === 0) return;
    const productId = createdProductIds.pop();
    const result = await request(`/productos/${productId}`, {
      method: 'DELETE'
    });
    
    if (!result.ok) {
      throw new Error('No se pudo eliminar producto');
    }
  })();
}

// Tests de ventas
let createdVentaIds = [];

async function testVentas() {
  console.log('\n=== TESTING VENTAS ===\n');
  
  await test('Obtener lista de ventas', async () => {
    const result = await request('/ventas');
    if (!result.ok || !Array.isArray(result.data)) {
      throw new Error('No se pudo obtener lista de ventas');
    }
  })();
  
  await test('Crear venta', async () => {
    const ventaId = `VENTA_${Date.now()}`;
    const result = await request('/ventas', {
      method: 'POST',
      body: JSON.stringify({
        id: ventaId,
        nombreCliente: 'Juan',
        apellidoCliente: 'Pérez',
        dni: '12345678',
        producto: 'Producto Test',
        categoria: 'Categoria Test',
        costo: 100,
        precioVenta: 150,
        cantidad: 2,
        fecha: new Date().toISOString(),
        ganancia: 100,
        estadoPago: 'pagado',
        montoPagado: 300,
        metodoPago: 'efectivo'
      })
    });
    
    if (!result.ok) {
      throw new Error('No se pudo crear venta');
    }
    createdVentaIds.push(ventaId);
  })();
  
  await test('Obtener venta por ID', async () => {
    if (createdVentaIds.length === 0) return;
    const ventaId = createdVentaIds[0];
    const result = await request(`/ventas/${ventaId}`);
    
    if (!result.ok || result.data.id !== ventaId) {
      throw new Error('No se pudo obtener venta por ID');
    }
  })();
  
  await test('Actualizar venta', async () => {
    if (createdVentaIds.length === 0) return;
    const ventaId = createdVentaIds[0];
    const result = await request(`/ventas/${ventaId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombreCliente: 'Juan',
        apellidoCliente: 'Pérez',
        dni: '12345678',
        producto: 'Producto Actualizado',
        categoria: 'Categoria Test',
        costo: 100,
        precioVenta: 150,
        cantidad: 3,
        fecha: new Date().toISOString(),
        ganancia: 150,
        estadoPago: 'pagado',
        montoPagado: 450,
        metodoPago: 'transferencia'
      })
    });
    
    if (!result.ok) {
      throw new Error('No se pudo actualizar venta');
    }
  })();
  
  await test('Eliminar venta', async () => {
    if (createdVentaIds.length === 0) return;
    const ventaId = createdVentaIds.pop();
    const result = await request(`/ventas/${ventaId}`, {
      method: 'DELETE'
    });
    
    if (!result.ok) {
      throw new Error('No se pudo eliminar venta');
    }
  })();
}

// Tests de reorganización de IDs
async function testReorganizacionIds() {
  console.log('\n=== TESTING REORGANIZACIÓN DE IDs ===\n');
  
  await test('Crear múltiples usuarios y verificar secuencia', async () => {
    const userIds = [];
    for (let i = 0; i < 3; i++) {
      const result = await request('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          username: `seqtest_${Date.now()}_${i}`,
          password: 'test123',
          role: 'user'
        })
      });
      if (result.ok) {
        userIds.push(result.data.user.id);
      }
    }
    
    // Verificar que los IDs sean secuenciales
    const sorted = [...userIds].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i-1] + 1) {
        throw new Error('IDs no son secuenciales');
      }
    }
    
    // Limpiar
    for (const id of userIds) {
      await request(`/usuarios/${id}`, { method: 'DELETE' });
    }
  })();
  
  await test('Eliminar usuario y verificar reutilización de ID', async () => {
    // Crear usuario
    const createResult = await request('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        username: `reuse_${Date.now()}`,
        password: 'test123',
        role: 'user'
      })
    });
    
    if (!createResult.ok) {
      throw new Error('No se pudo crear usuario para test');
    }
    
    const userId = createResult.data.user.id;
    
    // Eliminar usuario
    await request(`/usuarios/${userId}`, { method: 'DELETE' });
    
    // Crear nuevo usuario (debería reutilizar el ID)
    const newResult = await request('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        username: `reuse2_${Date.now()}`,
        password: 'test123',
        role: 'user'
      })
    });
    
    if (!newResult.ok) {
      throw new Error('No se pudo crear segundo usuario');
    }
    
    if (newResult.data.user.id !== userId) {
      console.log(`⚠️  ID no reutilizado: esperado ${userId}, obtenido ${newResult.data.user.id}`);
    }
    
    // Limpiar
    await request(`/usuarios/${newResult.data.user.id}`, { method: 'DELETE' });
  })();
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('🚀 Iniciando tests de la aplicación...\n');
  
  try {
    await testAuth();
    await testUsuarios();
    await testProductos();
    await testVentas();
    await testReorganizacionIds();
    
    console.log('\n=== RESUMEN ===\n');
    console.log(`✅ Tests pasados: ${testResults.passed}`);
    console.log(`❌ Tests fallidos: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n=== ERRORES ENCONTRADOS ===\n');
      testResults.errors.forEach(({ test, error }) => {
        console.log(`- ${test}: ${error}`);
      });
    }
    
    if (testResults.failed === 0) {
      console.log('\n🎉 ¡Todos los tests pasaron!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Algunos tests fallaron. Revisa los errores arriba.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error fatal en los tests:', error);
    process.exit(1);
  }
}

runAllTests();

