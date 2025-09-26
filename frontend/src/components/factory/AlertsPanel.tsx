import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  X,
  Clock
} from "lucide-react";
import { Device } from "@/types/factory";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  deviceId: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface AlertsPanelProps {
  devices: Device[];
  className?: string;
}

export function AlertsPanel({ devices, className }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Generate alerts based on device status
  useEffect(() => {
    const newAlerts: Alert[] = [];
    
    devices.forEach((device) => {
      if (device.status === 'CRITICAL') {
        newAlerts.push({
          id: `${device.id}-critical-${Date.now()}`,
          deviceId: device.id,
          type: 'CRITICAL',
          message: `Critical failure detected in ${device.id}. Immediate attention required.`,
          timestamp: new Date(),
          acknowledged: false,
        });
      } else if (device.status === 'WARNING') {
        newAlerts.push({
          id: `${device.id}-warning-${Date.now()}`,
          deviceId: device.id,
          type: 'WARNING',
          message: `${device.id} showing anomalous behavior. Monitor closely.`,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      // Energy consumption alerts
      if (device.energyConsumption && device.energyConsumption > 600) {
        newAlerts.push({
          id: `${device.id}-energy-${Date.now()}`,
          deviceId: device.id,
          type: 'WARNING',
          message: `High energy consumption detected in ${device.id}: ${device.energyConsumption}W`,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      // Efficiency alerts
      if (device.efficiency && device.efficiency < 70) {
        newAlerts.push({
          id: `${device.id}-efficiency-${Date.now()}`,
          deviceId: device.id,
          type: 'WARNING',
          message: `Low efficiency in ${device.id}: ${device.efficiency}%`,
          timestamp: new Date(),
          acknowledged: false,
        });
      }
    });

    // Only add truly new alerts (not duplicates)
    setAlerts(prev => {
      const existingAlertKeys = new Set(prev.map(a => `${a.deviceId}-${a.type}`));
      const uniqueNewAlerts = newAlerts.filter(alert => 
        !existingAlertKeys.has(`${alert.deviceId}-${alert.type}`)
      );
      
      if (uniqueNewAlerts.length > 0) {
        return [...uniqueNewAlerts, ...prev].slice(0, 20); // Keep last 20 alerts
      }
      return prev;
    });
  }, [devices]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const clearAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.type === 'CRITICAL' && !a.acknowledged).length;

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'CRITICAL':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'INFO':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertBadgeVariant = (type: Alert['type']) => {
    switch (type) {
      case 'CRITICAL':
        return 'destructive';
      case 'WARNING':
        return 'secondary';
      case 'INFO':
        return 'outline';
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            System Alerts
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedCount}
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllAlerts}
            disabled={alerts.length === 0}
          >
            Clear All
          </Button>
        </div>
        
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">
              {criticalCount} critical alert{criticalCount > 1 ? 's' : ''} require immediate attention
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="h-[600px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mb-2" />
              <p className="text-sm">No active alerts</p>
              <p className="text-xs">All systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-industrial w-full",
                    alert.acknowledged 
                      ? "bg-muted/50 border-muted opacity-60" 
                      : "bg-background border-border hover:bg-muted/30",
                    alert.type === 'CRITICAL' && !alert.acknowledged && "border-l-4 border-l-red-500",
                    alert.type === 'WARNING' && !alert.acknowledged && "border-l-4 border-l-yellow-500"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-medium",
                          alert.acknowledged && "line-through text-muted-foreground"
                        )}>
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getAlertBadgeVariant(alert.type)} className="text-xs">
                            {alert.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        {!alert.acknowledged && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="h-6 w-6 p-0"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearAlert(alert.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}