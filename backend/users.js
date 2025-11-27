import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import bcrypt from 'bcrypt'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const usersFilePath = join(__dirname, 'users.json')

// Leer usuarios
function readUsers() {
  try {
    const data = readFileSync(usersFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error al leer usuarios:', error)
    return { users: [] }
  }
}

// Escribir usuarios
function writeUsers(data) {
  writeFileSync(usersFilePath, JSON.stringify(data, null, 2))
}

// Inicializar archivo de usuarios si no existe o si no tiene usuarios
if (!existsSync(usersFilePath)) {
  const adminPassword = bcrypt.hashSync('admin123', 10)
  const initialUsers = {
    users: [
      {
        id: 1,
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        nombre: 'Administrador',
        email: 'admin@example.com',
        fecha_creacion: new Date().toISOString()
      }
    ]
  }
  writeFileSync(usersFilePath, JSON.stringify(initialUsers, null, 2))
  console.log('Archivo de usuarios creado con usuario admin')
} else {
  // Verificar si existe el usuario admin, si no existe o el hash está mal, recrearlo
  try {
    const data = readUsers()
    const adminUser = data.users.find(u => u.username === 'admin')
    
    // Si no existe admin o el hash parece estar mal (menos de 50 caracteres), recrearlo
    if (!adminUser || !adminUser.password || adminUser.password.length < 50) {
      const adminPassword = bcrypt.hashSync('admin123', 10)
      if (!adminUser) {
        // Agregar admin si no existe
        data.users.push({
          id: 1,
          username: 'admin',
          password: adminPassword,
          role: 'admin',
          nombre: 'Administrador',
          email: 'admin@example.com',
          fecha_creacion: new Date().toISOString()
        })
      } else {
        // Actualizar hash del admin existente
        adminUser.password = adminPassword
      }
      writeUsers(data)
      console.log('Usuario admin inicializado correctamente')
    }
  } catch (error) {
    console.error('Error al verificar usuario admin:', error)
    // Si hay error, recrear el archivo
    const adminPassword = bcrypt.hashSync('admin123', 10)
    const initialUsers = {
      users: [
        {
          id: 1,
          username: 'admin',
          password: adminPassword,
          role: 'admin',
          nombre: 'Administrador',
          email: 'admin@example.com',
          fecha_creacion: new Date().toISOString()
        }
      ]
    }
    writeFileSync(usersFilePath, JSON.stringify(initialUsers, null, 2))
    console.log('Archivo de usuarios recreado debido a error')
  }
}

// Obtener todos los usuarios (sin contraseñas)
export function getAllUsers() {
  const data = readUsers()
  return data.users.map(user => {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  })
}

// Obtener usuario por ID
export function getUserById(id) {
  const data = readUsers()
  const user = data.users.find(u => u.id === parseInt(id))
  if (!user) return null
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

// Obtener usuario por username
export function getUserByUsername(username) {
  const data = readUsers()
  return data.users.find(u => u.username === username)
}

// Crear nuevo usuario
export function createUser(userData) {
  const data = readUsers()
  
  // Verificar que el username no exista
  if (data.users.find(u => u.username === userData.username)) {
    throw new Error('El nombre de usuario ya existe')
  }

  const newId = data.users.length > 0 
    ? Math.max(...data.users.map(u => u.id)) + 1 
    : 1

  const newUser = {
    id: newId,
    username: userData.username,
    password: bcrypt.hashSync(userData.password, 10),
    role: userData.role || 'user',
    nombre: userData.nombre || userData.username,
    email: userData.email || '',
    fecha_creacion: new Date().toISOString()
  }

  data.users.push(newUser)
  writeUsers(data)
  
  const { password, ...userWithoutPassword } = newUser
  return userWithoutPassword
}

// Actualizar usuario
export function updateUser(id, updates) {
  const data = readUsers()
  const index = data.users.findIndex(u => u.id === parseInt(id))
  
  if (index === -1) {
    throw new Error('Usuario no encontrado')
  }

  // Verificar que el username no esté en uso por otro usuario
  if (updates.username && data.users.find(u => u.username === updates.username && u.id !== parseInt(id))) {
    throw new Error('El nombre de usuario ya existe')
  }

  // Si se actualiza la contraseña, hashearla
  if (updates.password) {
    updates.password = bcrypt.hashSync(updates.password, 10)
  }

  data.users[index] = {
    ...data.users[index],
    ...updates
  }

  writeUsers(data)
  
  const { password, ...userWithoutPassword } = data.users[index]
  return userWithoutPassword
}

// Eliminar usuario
export function deleteUser(id) {
  const data = readUsers()
  const index = data.users.findIndex(u => u.id === parseInt(id))
  
  if (index === -1) {
    throw new Error('Usuario no encontrado')
  }

  // No permitir eliminar al admin
  if (data.users[index].role === 'admin' && data.users[index].username === 'admin') {
    throw new Error('No se puede eliminar al usuario administrador principal')
  }

  data.users.splice(index, 1)
  writeUsers(data)
  return true
}

// Verificar contraseña
export function verifyPassword(username, password) {
  const user = getUserByUsername(username)
  if (!user) {
    return null
  }
  
  if (bcrypt.compareSync(password, user.password)) {
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }
  
  return null
}

