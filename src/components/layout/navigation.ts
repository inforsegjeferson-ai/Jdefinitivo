import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Truck,
  Package,
  MapPin,
  Clock,
  Settings,
  ShoppingCart,
  FileCheck,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export type AppRole = "admin" | "installer" | "auxiliary";

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  roles?: AppRole[];
}

export const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ["admin", "auxiliary"] },
  { icon: Clock, label: "Agenda", path: "/agenda" },
  { icon: ClipboardList, label: "Ordens de Serviço", path: "/ordens" },
  { icon: MapPin, label: "Mapa de Serviços", path: "/mapa-servicos", roles: ["admin", "auxiliary"] },
  { icon: UserCircle, label: "Clientes", path: "/clientes", roles: ["admin"] },
  { icon: Clock, label: "Ponto Eletrônico", path: "/ponto" },
  { icon: FileCheck, label: "Relatório de Ponto", path: "/relatorio-ponto", roles: ["admin"] },
  { icon: Users, label: "Equipe", path: "/equipe", roles: ["admin"] },
  { icon: Truck, label: "Frota", path: "/frota", roles: ["admin"] },
  { icon: Package, label: "Estoque", path: "/estoque", roles: ["admin"] },
  { icon: ShoppingCart, label: "PDV", path: "/pdv", roles: ["admin"] },
  { icon: FileCheck, label: "Checklists", path: "/checklists", roles: ["admin"] },
  { icon: MapPin, label: "Locais", path: "/locais", roles: ["admin"] },
  { icon: Settings, label: "Configurações", path: "/configuracoes", roles: ["admin"] },
];
