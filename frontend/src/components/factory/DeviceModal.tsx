import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "./StatusBadge";
import { Device } from "@/types/factory";
import { 
  Activity, 
  Brain, 
  Settings, 
  AlertTriangle,
  Zap,
  Gauge,
  Power,
  RotateCcw,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceModalProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeviceAction: (deviceId: string, action: "shutdown" | "restart") => void;
  onAlexaToggle: () => void;
}

export function DeviceModal({ device, open, onOpenChange, onDeviceAction, onAlexaToggle }: DeviceModalProps) {
  if (!device) return null;

  const handleShutdown = () => {
    onDeviceAction(device.id, "shutdown");
    onOpenChange(false);
  };

  const handleRestart = () => {
    onDeviceAction(device.id, "restart");
    onOpenChange(false);
  };

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType.toLowerCase()) {
      case 'temp':
      case 'temperature':
        return <Activity className="h-3 w-3 text-orange-500" />;
      case 'pressure':
        return <Gauge className="h-3 w-3 text-blue-500" />;
      case 'vibration':
        return <Activity className="h-3 w-3 text-purple-500" />;
      case 'rpm':
        return <RotateCcw className="h-3 w-3 text-green-500" />;
      case 'torque':
        return <Settings className="h-3 w-3 text-yellow-500" />;
      case 'current':
        return <Zap className="h-3 w-3 text-red-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getSensorUnit = (sensorType: string) => {
    switch (sensorType.toLowerCase()) {
      case 'temp':
      case 'temperature':
        return '°C';
      case 'pressure':
        return 'PSI';
      case 'vibration':
        return 'mm/s';
      case 'rpm':
        return 'RPM';
      case 'torque':
        return 'Nm';
      case 'current':
        return 'A';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh] overflow-hidden z-[9999] p-3">
        <DialogHeader className="pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-primary">
              {device.id}
            </DialogTitle>
            <StatusBadge status={device.status} size="sm" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{device.type.replace('_', ' ')}</p>
            {device.process && (
              <p className="text-[10px] font-medium text-blue-600 mt-1">{device.process}</p>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* Live Sensor Readings */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Activity className="h-3 w-3 text-primary" />
              <h3 className="text-xs font-semibold">Sensors</h3>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(device.sensors).map(([key, value]) => (
                <div key={key} className="rounded p-1 text-center border-2 shadow-sm text-white" style={{ backgroundColor: 'hsl(210 100% 20%)', borderColor: 'hsl(210 100% 30%)' }}>
                  <div className="text-xs mb-1">{getSensorIcon(key)}</div>
                  <div className="text-xs font-bold text-primary">
                    {typeof value === 'number' ? value.toFixed(0) : value}
                  </div>
                  <div className="text-[10px] text-muted-foreground capitalize truncate">
                    {key}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Energy & Performance Metrics */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Zap className="h-3 w-3 text-primary" />
              <h3 className="text-xs font-semibold">Performance</h3>
            </div>
            <div className="flex gap-1">
              <div className="rounded p-1 text-center flex-1 border text-white" style={{ backgroundColor: 'hsl(210 100% 20%)', borderColor: 'hsl(210 100% 30%)' }}>
                <div className="text-[10px] text-muted-foreground">Efficiency</div>
                <div className="text-sm font-bold text-primary">
                  {device.efficiency || 95}%
                </div>
              </div>
              <div className="rounded p-1 text-center flex-1 border text-white" style={{ backgroundColor: 'hsl(210 100% 20%)', borderColor: 'hsl(210 100% 30%)' }}>
                <div className="text-[10px] text-muted-foreground">Energy</div>
                <div className="text-sm font-bold text-primary">
                  {device.energyConsumption || 450}W
                </div>
              </div>
            </div>
          </div>

          {/* AI-Powered Diagnosis */}
          {(device.status === 'WARNING' || device.status === 'CRITICAL') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">AI Diagnosis</h3>
              </div>
              <Card className={cn(
                "border-l-4",
                device.status === 'CRITICAL' ? "border-l-status-critical bg-red-50/50" : "border-l-status-warning bg-yellow-50/50"
              )}>
                <CardContent className="pt-3 pb-2">
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-foreground">Last Anomaly:</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        {device.lastAnomaly?.toLocaleString() || new Date().toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-foreground">Analysis:</span>
                      <p className="mt-1 text-xs text-foreground">
                        {device.aiAnalysis || "Anomaly detected in sensor readings."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator className="my-3" />

          {/* Remote Control */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Remote Control</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="emergency"
                size="sm"
                onClick={handleShutdown}
                disabled={device.status === 'OFF'}
                className="flex-1"
              >
                <Power className="h-3 w-3 mr-1" />
                Shutdown
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleRestart}
                className="flex-1"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Restart
              </Button>
            </div>
            
            {/* Ask Alexa Button */}
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none hover:from-blue-600 hover:to-purple-700"
                onClick={() => {
                  onAlexaToggle();
                  onOpenChange(false);
                }}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Ask Alexa
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}