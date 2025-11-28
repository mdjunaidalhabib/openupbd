import {
  CircleGauge,
  Users,
  Package,
  ShoppingCart,
  ChartBarStacked,
  CreditCard,
  Bell,
  Settings,
  LayoutDashboard,
} from "lucide-react";

export const navItems = [
  {
    icon: <CircleGauge size={18} />,
    label: "Dashboard",
    href: "/admin/dashboard",
  },
  { icon: <ShoppingCart size={18} />, label: "Orders", href: "/admin/orders" },
  { icon: <Package size={18} />, label: "Products", href: "/admin/products" },
  {
    icon: <ChartBarStacked size={18} />,
    label: "Category",
    href: "/admin/category",
  },
  { icon: <Users size={18} />, label: "Users", href: "/admin/users" },
  {
    icon: <CreditCard size={18} />,
    label: "Payments",
    href: "/admin/payments",
  },
  {
    icon: <Bell size={18} />,
    label: "Notifications",
    href: "/admin/notifications",
  },
  { icon: <Settings size={18} />, label: "Settings", href: "/admin/settings" },
];

export const settingsChildren = [
  {
    icon: <LayoutDashboard size={16} />,
    label: "Navbar",
    href: "/admin/navbar",
  },
  {
    icon: <LayoutDashboard size={16} />,
    label: "Footer",
    href: "/admin/footer",
  },
  {
    icon: <LayoutDashboard size={16} />,
    label: "courier",
    href: "/admin/courier-settings",
  },
];
