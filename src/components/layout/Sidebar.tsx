import { Sun, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserProfile } from "@/hooks/useUserProfile";
import { menuItems } from "./navigation";
interface SidebarProps {
  className?: string;
}
export function Sidebar({
  className
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    roles
  } = useUserProfile();
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      // Items without roles restriction are visible to everyone
      if (!item.roles) return true;
      // Check if user has any of the allowed roles
      return item.roles.some(role => roles.includes(role));
    });
  }, [roles]);
  return <motion.aside initial={false} animate={{
    width: collapsed ? 80 : 280
  }} transition={{
    duration: 0.3,
    ease: "easeInOut"
  }} className={cn("hidden md:flex fixed left-0 top-0 z-40 h-screen gradient-sidebar border-r border-sidebar-border flex-col", className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-solar shadow-glow">
          <Sun className="h-5 w-5 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && <motion.div initial={{
          opacity: 0,
          x: -10
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -10
        }} className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">J solar</span>
              <span className="text-xs text-sidebar-foreground/60">Gestão de Serviços</span>
            </motion.div>}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {filteredMenuItems.map(item => <li key={item.path}>
              <NavLink to={item.path} className={({
            isActive
          }) => cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200", "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" : "text-sidebar-foreground/80")}>
                <item.icon className="h-5 w-5 shrink-0" />
                <AnimatePresence>
                  {!collapsed && <motion.span initial={{
                opacity: 0,
                x: -10
              }} animate={{
                opacity: 1,
                x: 0
              }} exit={{
                opacity: 0,
                x: -10
              }}>
                      {item.label}
                    </motion.span>}
                </AnimatePresence>
              </NavLink>
            </li>)}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2">Recolher</span>
            </>}
        </Button>
      </div>
    </motion.aside>;
}