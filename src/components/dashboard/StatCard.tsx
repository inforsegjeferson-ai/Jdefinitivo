import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: LucideIcon;
  variant?: "default" | "solar" | "success" | "warning" | "info";
  delay?: number;
}

const variantStyles = {
  default: {
    bg: "bg-card",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  solar: {
    bg: "gradient-solar",
    iconBg: "bg-primary-foreground/20",
    iconColor: "text-primary-foreground",
  },
  success: {
    bg: "bg-card",
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  warning: {
    bg: "bg-card",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  info: {
    bg: "bg-card",
    iconBg: "bg-info/10",
    iconColor: "text-info",
  },
};

export function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  variant = "default",
  delay = 0 
}: StatCardProps) {
  const styles = variantStyles[variant];
  const isSolar = variant === "solar";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "rounded-xl border p-6 shadow-card transition-all duration-200 hover:shadow-lg",
        styles.bg,
        isSolar ? "border-transparent" : "border-border"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium",
            isSolar ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className={cn(
            "mt-2 text-3xl font-bold",
            isSolar ? "text-primary-foreground" : "text-foreground"
          )}>
            {value}
          </p>
          {change && (
            <div className={cn(
              "mt-2 flex items-center gap-1 text-sm",
              change.type === "increase" 
                ? isSolar ? "text-primary-foreground/90" : "text-success"
                : isSolar ? "text-primary-foreground/90" : "text-destructive"
            )}>
              <span>{change.type === "increase" ? "↑" : "↓"}</span>
              <span>{Math.abs(change.value)}% vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          styles.iconBg
        )}>
          <Icon className={cn("h-6 w-6", styles.iconColor)} />
        </div>
      </div>
    </motion.div>
  );
}
