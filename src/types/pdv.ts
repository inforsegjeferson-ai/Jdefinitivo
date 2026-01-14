export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
  currentStock: number;
  minStock: number;
  unit: string;
  description?: string;
  lastMovement: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface Quote {
  id: string;
  number: string;
  customer: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  validUntil: string;
  createdAt: string;
  notes?: string;
}

export interface Sale {
  id: string;
  number: string;
  customer: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'credit' | 'debit' | 'pix' | 'boleto';
  installments?: number;
  status: 'completed' | 'cancelled';
  quoteId?: string;
  createdAt: string;
  notes?: string;
}
