export type EstadoPago = 'pagado' | 'parcial' | 'pendiente';
export type MetodoPago = 'efectivo' | 'transferencia';

export interface Venta {
  id: string;
  nombreCliente: string;
  apellidoCliente: string;
  dni: string;
  producto: string;
  productoId?: string; // ID del producto en stock (si viene del stock)
  marca?: string;
  tipo?: string;
  categoria: string;
  costo: number;
  precioVenta: number;
  cantidad: number;
  fecha: string;
  ganancia: number;
  estadoPago: EstadoPago;
  montoPagado?: number; // Solo cuando estadoPago es 'parcial'
  metodoPago?: MetodoPago;
  cuentaBanco?: string; // Solo cuando metodoPago es 'transferencia'
}

export interface GananciaSemanal {
  fecha: string;
  ganancia: number;
}

