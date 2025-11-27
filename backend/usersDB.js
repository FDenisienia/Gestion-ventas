import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import bcrypt from 'bcrypt'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const usersPath = join(__dirname, 'users.json')

// Inicializar archivo de usuarios si no existe
if (!existsSync(usersPath)) {
  const initialUsers = {
    users: [
      {
        id: 1,
        username: 'admin',
        password: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // password: admin123
        role: 'admin',
        nombre: 'Administrador',
        fecha_creacion: new Date().toISOString()
      }
    ]
  }
  writeFileSync(usersPath, JSON.stringify(initialUsers, null, 2))
  
  // Crear hash de contraseña por defecto
  bcrypt.hash('admin123', 10).then(hash => {
    const users = JSON.parse(readFileSync(usersPath, 'utf-8'))
    users.users[0].password = hash
    writeFileSync(usersPath, JSON.stringify(users, null, 2))
  })
}

function readUsers() {
  try {
    if (!existsSync(usersPath)) {
      return { users: [] }
    }
    return JSON.parse(readFileSync(usersPath, 'utf-8'))
  } catch (error) {
    console.error('Error al leer usuarios:', error)
    return { users: [] }
  }
}

function writeUsers(data) {
  try {
    writeFileSync(usersPath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error al escribir usuarios:', error)
    throw error
  }
}

export const usersDB = {
  getAll: () => {
    const data = readUsers()
    return data.users.map(user => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })
  },

  getById: (id) => {
    const data = readUsers()
    const user = data.users.find(u => u.id === parseInt(id))
    if (!user) return null
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  },

  getByUsername: async (username) => {
    const data = readUsers()
    return data.users.find(u => u.username === username) || null
  },

  create: async (userData) => {
    const data = readUsers()
    const newId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1
    
    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    
    const newUser = {
      id: newId,
      username: userData.username,
      password: hashedPassword,
      role: userData.role || 'usuario',
      nombre: userData.nombre || userData.username,
      fecha_creacion: new Date().toISOString()
    }
    
    data.users.push(newUser)
    writeUsers(data)
    
    const { password, ...userWithoutPassword } = newUser
    return userWithoutPassword
  },

  update: async (id, updates) => {
    const data = readUsers()
    const index = data.users.findIndex(u => u.id === parseInt(id))
    if (index === -1) return null

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10)
    }

    data.users[index] = {
      ...data.users[index],
      ...updates,
      id: data.users[index].id // No permitir cambiar el ID
    }
    
    writeUsers(data)
    
    const { password, ...userWithoutPassword } = data.users[index]
    return userWithoutPassword
  },

  delete: (id) => {
    const data = readUsers()
    const index = data.users.findIndex(u => u.id === parseInt(id))
    if (index === -1) return false
    
    // No permitir eliminar al admin
    if (data.users[index].role === 'admin' && data.users[index].username === 'admin') {
      throw new Error('No se puede eliminar el usuario administrador')
    }
    
    data.users.splice(index, 1)
    writeUsers(data)
    return true
  },

  verifyPassword: async (username, password) => {
    const user = await usersDB.getByUsername(username)
    if (!user) return null
    
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return null
    
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }
}

