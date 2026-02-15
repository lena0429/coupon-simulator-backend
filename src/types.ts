// API Request/Response types
export interface SimulateRequest {
  items: CartItem[];
  couponCode?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface SimulateResponse {
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon?: string;
}

// Engine module types
export interface PricingResult {
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon?: string;
}
