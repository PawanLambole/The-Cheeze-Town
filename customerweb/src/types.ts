export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type Page = 'splash' | 'home' | 'menu' | 'payment' | 'success';
