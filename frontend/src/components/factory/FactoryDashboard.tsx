import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Device, FactoryState, KPIData } from "@/types/factory";
import { FactoryMap } from "./FactoryMap";
import { DeviceModal } from "./DeviceModal";
import { AlertsPanel } from "./AlertsPanel";
import { AlexaVoiceChat } from "./AlexaVoiceChat";
import { toast } from "sonner"; // Assuming sonner is used for toasts

// --- Helper: KPI Calculation ---
const calculateKPIs = (devices: Device[]) => {
  const totalDevices = devices.length;
  if (totalDevices === 0)
    return { oee: 0, plantStatus: "NORMAL" as const, totalEnergy: 0 };

  const onlineDevices = devices.filter((d) => d.isOnline).length;
  const normalDevices = devices.filter((d) => d.status === "NORMAL").length;

  const availability = onlineDevices / totalDevices;
  const quality = onlineDevices > 0 ? normalDevices / onlineDevices : 0;
  const performance = 0.95; // Benchmark

  const oee = availability * quality * performance * 100;

  const totalEnergy = devices.reduce(
    (sum, d) => sum + (d.energyConsumption || 0),
    0
  );

  const criticalCount = devices.filter((d) => d.status === "CRITICAL").length;
  const warningCount = devices.filter((d) => d.status === "WARNING").length;

  let plantStatus: "NORMAL" | "WARNING" | "CRITICAL" = "NORMAL";
  if (criticalCount > 0) plantStatus = "CRITICAL";
  else if (warningCount > 0) plantStatus = "WARNING";

  return { oee, plantStatus, totalEnergy };
};

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Uses the Vite proxy, so just /api works
        const response = await fetch("/api/devices");
        if (!response.ok) throw new Error("Backend unavailable");

        const data: Device[] = await response.json();

        // Ensure ID string consistency
        const mappedDevices = data.map((d) => ({ ...d, id: String(d.id) }));
        const kpis = calculateKPIs(mappedDevices);

        setFactoryState({
          devices: mappedDevices,
          totalEnergyConsumption: kpis.totalEnergy,
          oee: kpis.oee,
          plantStatus: kpis.plantStatus,
          lastUpdated: new Date(),
        });
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Could not load initial factory data.");
      }
    };

    fetchDevices();
  }, []);

  // 2. Real-Time WebSocket Connection
  useEffect(() => {
    // Connects via the Vite proxy to localhost:5001
    const newSocket = io({ path: "/socket.io" });

    newSocket.on("connect", () => {
      setIsConnected(true);
      toast.success("Connected to Factory Live Stream");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      toast.warning("Lost connection to factory stream");
    });

    // Listen for single device updates from the Python Consumer
    newSocket.on("device_update", (updatedDevice: Device) => {
      setFactoryState((prev) => {
        // Replace the updated device in the list
        const updatedList = prev.devices.map((d) =>
          String(d.id) === String(updatedDevice.id) ? updatedDevice : d
        );

        // If it's a new device we didn't have before, add it
        if (
          !prev.devices.find((d) => String(d.id) === String(updatedDevice.id))
        ) {
          updatedList.push(updatedDevice);
        }

        const kpis = calculateKPIs(updatedList);

        return {
          devices: updatedList,
          totalEnergyConsumption: kpis.totalEnergy,
          oee: kpis.oee,
          plantStatus: kpis.plantStatus,
          lastUpdated: new Date(),
        };
      });

      // Update the selected device modal if it's open
      if (
        selectedDevice &&
        String(selectedDevice.id) === String(updatedDevice.id)
      ) {
        setSelectedDevice(updatedDevice);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [selectedDevice]);

  // 3. Device Actions (Restart/Shutdown)
  const handleDeviceAction = useCallback(
    async (deviceId: string, action: "shutdown" | "restart") => {
      setDeviceActionFeedback({ deviceId, action });
      setTimeout(() => setDeviceActionFeedback(null), 3000);

      try {
        const endpoint =
          action === "shutdown" ? "/api/shutdown" : "/api/restart";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        });

        if (response.ok) {
          toast.success(`Device ${action} command sent.`);
        } else {
          toast.error("Failed to send command.");
        }
      } catch (e) {
        console.error(e);
        toast.error("Network error sending command.");
      }
    },
    []
  );

  const handleDeviceClick = useCallback((device: Device) => {
    setSelectedDevice(device);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header
        className="text-white industrial-shadow sticky top-0 z-40 transition-colors duration-500"
        style={{
          backgroundColor: isConnected ? "hsl(210 100% 20%)" : "hsl(0 60% 30%)",
        }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                Energy Track
                {!isConnected && (
                  <span className="text-xs bg-red-500 px-2 py-1 rounded-full animate-pulse">
                    OFFLINE
                  </span>
                )}
                {isConnected && (
                  <span className="text-xs bg-green-500 px-2 py-1 rounded-full">
                    LIVE
                  </span>
                )}
              </h1>
              <p className="text-sm opacity-90">
                Smart Factory Energy & Safety Monitor
              </p>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsAlexaOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                {/* Alexa Icon */}
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C13.1 2 14 2.9 14 4V10C14 11.1 13.1 12 12 12S10 11.1 10 10V4C10 2.9 10.9 2 12 2M19 10V12C19 15.3 16.3 18 13 18V20H17V22H7V20H11V18C7.7 18 5 15.3 5 12V10H7V12C7 14.2 8.8 16 11 16H13C15.2 16 17 14.2 17 12V10H19Z" />
                </svg>
                Ask Alexa
              </button>
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
          <div className="inline-flex items-center justify-center px-6 py-4 rounded-2xl">
            <span className="text-muted-foreground text-sm">
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
