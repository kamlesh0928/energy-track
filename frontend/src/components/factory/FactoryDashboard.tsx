import { useState, useEffect, useCallback } from "react";
import { Device, FactoryState, KPIData } from "@/types/factory";
import { FactoryMap } from "./FactoryMap";
import { DeviceModal } from "./DeviceModal";
import { AlertsPanel } from "./AlertsPanel";
import { AlexaVoiceChat } from "./AlexaVoiceChat";

export function FactoryDashboard() {
  const [factoryState, setFactoryState] = useState<FactoryState>({
    devices: [],
    totalEnergyConsumption: 0,
    oee: 0,
    plantStatus: "NORMAL",
    lastUpdated: new Date(),
  });

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceActionFeedback, setDeviceActionFeedback] = useState<{
    deviceId: string;
    action: "shutdown" | "restart";
  } | null>(null);
  const [isAlexaOpen, setIsAlexaOpen] = useState(false);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5001/api/devices");
        if (!response.ok) {
          throw new Error("Failed to fetch devices");
        }
        const data: Device[] = await response.json();

        // Optional: Map data if needed (e.g., handle _id)
        const mappedDevices = data.map((d) => ({
          ...d,
          id: d.id || "unknown",
        }));

        // Calculate initial KPIs similar to updateSimulation
        const totalDevices = mappedDevices.length;
        const onlineDevices = mappedDevices.filter(
          (d) => d.status !== "OFF"
        ).length;
        const normalDevices = mappedDevices.filter(
          (d) => d.status === "NORMAL"
        ).length;

        const availability = onlineDevices / totalDevices;
        const quality = normalDevices / onlineDevices || 0;
        const performance = 0.95; // Assumed performance rate
        const oee = availability * quality * performance * 100;

        const criticalDevices = mappedDevices.filter(
          (d) => d.status === "CRITICAL"
        );
        const warningDevices = mappedDevices.filter(
          (d) => d.status === "WARNING"
        );

        let plantStatus: Device["status"] = "NORMAL";
        if (criticalDevices.length > 0) plantStatus = "CRITICAL";
        else if (warningDevices.length > 0) plantStatus = "WARNING";

        const totalEnergyConsumption = mappedDevices.reduce((sum, device) => {
          return sum + (device.energyConsumption || 0);
        }, 0);

        setFactoryState({
          devices: mappedDevices,
          totalEnergyConsumption,
          oee,
          plantStatus,
          lastUpdated: new Date(),
        });
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };

    fetchDevices();
  }, []);

  // Simulation logic
  const updateSimulation = useCallback(() => {
    setFactoryState((prev) => {
      const updatedDevices = prev.devices.map((device) => {
        if (device.status === "OFF") return device;

        // Simulate sensor fluctuations
        const updatedSensors = { ...device.sensors };
        Object.keys(updatedSensors).forEach((key) => {
          const baseValue = updatedSensors[key];
          const fluctuation = (Math.random() - 0.5) * (baseValue * 0.05); // 5% fluctuation
          updatedSensors[key] = Math.max(0, baseValue + fluctuation);
        });

        // Simulate status changes
        let newStatus = device.status;
        let anomalyCount = device.anomaly_count;

        // Random chance for anomalies
        if (Math.random() < 0.01 && device.status === "NORMAL") {
          newStatus = "WARNING";
          anomalyCount = 1;
        } else if (device.status === "WARNING") {
          anomalyCount++;
          if (anomalyCount > 5) {
            newStatus = "CRITICAL";
          } else if (Math.random() < 0.3) {
            newStatus = "NORMAL";
            anomalyCount = 0;
          }
        } else if (device.status === "CRITICAL" && Math.random() < 0.1) {
          newStatus = "NORMAL";
          anomalyCount = 0;
        }

        // Update efficiency based on status
        let efficiency = device.efficiency || 95;
        if (newStatus === "WARNING") efficiency = Math.max(70, efficiency - 5);
        if (newStatus === "CRITICAL")
          efficiency = Math.max(40, efficiency - 15);
        if (newStatus === "NORMAL" && device.status !== "NORMAL")
          efficiency = Math.min(98, efficiency + 10);

        return {
          ...device,
          sensors: updatedSensors,
          status: newStatus,
          anomaly_count: anomalyCount,
          efficiency,
          lastAnomaly: newStatus !== "NORMAL" ? new Date() : device.lastAnomaly,
        };
      });

      // Calculate KPIs
      const totalDevices = updatedDevices.length;
      const onlineDevices = updatedDevices.filter(
        (d) => d.status !== "OFF"
      ).length;
      const normalDevices = updatedDevices.filter(
        (d) => d.status === "NORMAL"
      ).length;

      const availability = onlineDevices / totalDevices;
      const quality = normalDevices / onlineDevices || 0;
      const performance = 0.95; // Assumed performance rate
      const oee = availability * quality * performance * 100;

      const criticalDevices = updatedDevices.filter(
        (d) => d.status === "CRITICAL"
      );
      const warningDevices = updatedDevices.filter(
        (d) => d.status === "WARNING"
      );

      let plantStatus: Device["status"] = "NORMAL";
      if (criticalDevices.length > 0) plantStatus = "CRITICAL";
      else if (warningDevices.length > 0) plantStatus = "WARNING";

      const totalEnergyConsumption = updatedDevices.reduce((sum, device) => {
        return sum + (device.energyConsumption || 0);
      }, 0);

      return {
        devices: updatedDevices,
        totalEnergyConsumption,
        oee,
        plantStatus,
        lastUpdated: new Date(),
      };
    });
  }, []);

  // Device actions
  const handleDeviceAction = useCallback(
    (deviceId: string, action: "shutdown" | "restart") => {
      // Set feedback for visual indication on map
      setDeviceActionFeedback({ deviceId, action });

      // Clear feedback after animation
      setTimeout(() => {
        setDeviceActionFeedback(null);
      }, 3000);

      setFactoryState((prev) => ({
        ...prev,
        devices: prev.devices.map((device) => {
          if (device.id === deviceId) {
            if (action === "shutdown") {
              return { ...device, status: "OFF", isOnline: false };
            } else if (action === "restart") {
              return {
                ...device,
                status: "NORMAL",
                anomaly_count: 0,
                isOnline: true,
                efficiency: 95,
              };
            }
          }
          return device;
        }),
      }));
    },
    []
  );

  const handleDeviceClick = useCallback((device: Device) => {
    setSelectedDevice(device);
  }, []);

  // Calculate KPIs for display
  const kpiData: KPIData = {
    oee: factoryState.oee,
    energyEfficiency: 85, // Calculated separately
    plantStatus: factoryState.plantStatus,
    deviceUptime:
      (factoryState.devices.filter((d) => d.isOnline).length /
        factoryState.devices.length) *
      100,
    totalDevices: factoryState.devices.length,
    activeDevices: factoryState.devices.filter((d) => d.status !== "OFF")
      .length,
    criticalAlerts: factoryState.devices.filter((d) => d.status === "CRITICAL")
      .length,
  };

  // Start simulation
  useEffect(() => {
    const interval = setInterval(updateSimulation, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateSimulation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header
        className="text-white industrial-shadow sticky top-0 z-40"
        style={{ backgroundColor: "hsl(210 100% 20%)" }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Energy Track</h1>
              <p className="text-sm opacity-90">
                Smart Factory Energy & Safety Monitor
              </p>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsAlexaOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C13.1 2 14 2.9 14 4V10C14 11.1 13.1 12 12 12S10 11.1 10 10V4C10 2.9 10.9 2 12 2M19 10V12C19 15.3 16.3 18 13 18V20H17V22H7V20H11V18C7.7 18 5 15.3 5 12V10H7V12C7 14.2 8.8 16 11 16H13C15.2 16 17 14.2 17 12V10H19Z" />
                </svg>
                Ask Alexa
              </button>
              <a
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <div className="text-lg font-semibold">Dashboard</div>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Factory Map and Alerts */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Factory Map */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg industrial-shadow p-6">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-semibold">Factory Floor Plan</h2>
                <div className="ml-auto text-sm text-muted-foreground">
                  Last updated: {factoryState.lastUpdated.toLocaleTimeString()}
                </div>
              </div>

              <FactoryMap
                devices={factoryState.devices}
                onDeviceClick={handleDeviceClick}
                deviceActionFeedback={deviceActionFeedback}
                className="h-[600px]"
              />
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="lg:col-span-1">
            <AlertsPanel devices={factoryState.devices} />
          </div>
        </div>

        {/* Team Attribution */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center px-6 py-4 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-2xl transition-colors text-4xl font-bold">
            <span className="border-2 border-primary/50 bg-primary/30 text-primary px-4 py-2 rounded-full">
              Energy Track by Team Trinetra
            </span>
          </div>
        </div>
      </div>

      {/* Device Details Modal */}
      <DeviceModal
        device={selectedDevice}
        open={!!selectedDevice}
        onOpenChange={(open) => !open && setSelectedDevice(null)}
        onDeviceAction={handleDeviceAction}
        onAlexaToggle={() => setIsAlexaOpen(true)}
      />

      {/* Alexa Voice Chat */}
      <AlexaVoiceChat
        isOpen={isAlexaOpen}
        onToggle={() => setIsAlexaOpen(!isAlexaOpen)}
      />
    </div>
  );
}
