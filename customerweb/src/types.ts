export interface MenuItem {
  id: number | string;
  name: string;
  price: number;
  category: string;
  description?: string;
  status?: string;
  image_url?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface RestaurantTable {
  id: number;
  table_number: number;
  status: 'available' | 'occupied' | 'reserved';
  capacity?: number;
  current_order_id?: number;
}

export type Page = 'splash' | 'home' | 'menu' | 'table-selection' | 'payment' | 'success';

