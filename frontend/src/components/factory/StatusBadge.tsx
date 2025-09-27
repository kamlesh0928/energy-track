import { cn } from "@/lib/utils";
import { DeviceStatus } from "@/types/factory";

interface StatusBadgeProps {
  status: DeviceStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<DeviceStatus, { label: string; className: string }> =
  {
    NORMAL: {
      label: "Normal",
      className: "status-normal",
    },
    WARNING: {
      label: "Warning",
      className: "status-warning",
    },
    CRITICAL: {
      label: "Critical",
      className: "status-critical",
    },
    OFF: {
      label: "Offline",
      className: "status-offline",
    },
  };

export function StatusBadge({
  status,
  className,
  size = "md",
}: StatusBadgeProps) {
  const config = statusConfig[status];

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold uppercase tracking-wide transition-industrial mr-6",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}
