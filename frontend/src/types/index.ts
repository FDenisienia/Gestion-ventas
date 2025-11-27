// Tipos compartidos para el frontend

export interface User {
  id: number
  username: string
  isAdmin: boolean
}

export interface Cliente {
  id: number
  nombre_completo: string
  dni: string
  numero_telefono: string
  fecha_creacion: string
}

export interface Articulo {
  id: number
  marca: string
  nombre: string
  valor_costo: number
  valor_venta: number
  categoria: string
  moneda: 'USD' | 'ARS'
  cantidad: number
  fecha_creacion: string
}

export interface Venta {
  id: number
  cliente_id: number
  cliente?: Cliente
  articulos: VentaArticulo[]
  estado_pago: 'pagado' | 'parcial' | 'pendiente'
  metodo_pago: 'efectivo' | 'transferencia'
  cuenta_transferencia?: string
  fecha: string
  fecha_creacion: string
  total: number
  ganancia: number
}

export interface VentaArticulo {
  id?: number
  articulo_id?: number
  marca: string
  nombre: string
  categoria: string
  moneda: 'USD' | 'ARS'
  valor_costo: number
  valor_venta: number
  cantidad: number
  total: number
  ganancia: number
}

export interface Egreso {
  id: number
  descripcion: string
  monto: number
  moneda: 'USD' | 'ARS'
  metodo_pago: 'efectivo' | 'transferencia'
  cuenta_transferencia?: string
  categoria: string
  fecha: string
  fecha_creacion: string
}

export interface Categoria {
  id: number
  nombre: string
  tipo: 'articulo' | 'venta'
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ApiError {
  error: string
}

