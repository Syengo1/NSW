import { 
  LayoutDashboard, 
  Shirt, 
  Layers, 
  ShoppingBag, 
  Users,
  BarChart3,
  type LucideIcon
} from 'lucide-react';

export interface AdminLink {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_LINKS: AdminLink[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Inventory', href: '/admin/products', icon: Shirt },
  { name: 'Collections', href: '/admin/collections', icon: Layers },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];