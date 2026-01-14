import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, Sun } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { menuItems } from "./navigation";

export function MobileSidebar() {
  const isMobile = useIsMobile();
  const { roles } = useUserProfile();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.some((role) => roles.includes(role));
    });
  }, [roles]);

  if (!isMobile) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] p-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-solar shadow-glow">
            <Sun className="h-5 w-5 text-primary-foreground" />
          </div>
          <SheetHeader className="space-y-0">
            <SheetTitle className="text-base">SolarTech</SheetTitle>
            <p className="text-xs text-muted-foreground">Gestão de Serviços</p>
          </SheetHeader>
        </div>

        <nav className="py-4 px-3">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive || location.pathname === item.path
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/80"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
