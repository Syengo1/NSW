import { 
  LayoutDashboard, 
  Shirt, 
  Layers, 
  ShoppingBag, 
  Users, 
  LogOut, 
  ExternalLink 
} from 'lucide-react';

export const ADMIN_LINKS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Inventory', href: '/admin/products', icon: Shirt },
  { name: 'Collections', href: '/admin/collections', icon: Layers },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Customers', href: '/admin/customers', icon: Users },
];