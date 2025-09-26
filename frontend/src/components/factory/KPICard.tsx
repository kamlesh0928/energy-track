import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  className?: string;
  variant?: "default" | "critical" | "warning" | "success";
}

export function KPICard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  className,
  variant = "default",
}: KPICardProps) {
  const variantClasses = {
    default: "bg-card border-border",
    critical: "bg-card border-status-critical border-l-4",
    warning: "bg-card border-status-warning border-l-4",
    success: "bg-card border-status-normal border-l-4",
  };

  const trendClasses = {
    up: "text-status-normal",
    down: "text-status-critical", 
    stable: "text-muted-foreground",
  };

  return (
    <Card className={cn("transition-industrial hover:shadow-lg", variantClasses[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold text-foreground">
            {value}
            {unit && <span className="text-lg font-normal text-muted-foreground ml-1">{unit}</span>}
          </div>
        </div>
        {trend && trendValue && (
          <p className={cn("text-xs mt-1 font-medium", trendClasses[trend])}>
            {trend === "up" && "↗ "}
            {trend === "down" && "↘ "}
            {trend === "stable" && "→ "}
            {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}