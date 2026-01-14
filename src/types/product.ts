export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category?: string;
  created_at: string;
  user_id?: string;
  sku?: string;
  // Campos do tipo PDV
  code?: string;
  currentStock?: number;
  minStock?: number;
  unit?: string;
  lastMovement?: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  stock_quantity?: number;
  category?: string;
  sku?: string;
}
