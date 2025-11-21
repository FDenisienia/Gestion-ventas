export interface Producto {
  id: string;
  nombre: string;
  marca: string;
  categoria: string;
  stock: number;
  costoUnitario: number;
  precioVenta: number;
  descripcion?: string;
}

