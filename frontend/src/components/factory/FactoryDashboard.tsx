import { useState, useEffect, useCallback } from "react";
import { Device, FactoryState, KPIData } from "@/types/factory";
import { FactoryMap } from "./FactoryMap";
import { DeviceModal } from "./DeviceModal";
import { AlertsPanel } from "./AlertsPanel";

const initialDevices: Device[] = [
  {
    id: "CNC-1",
    type: "CNC_Mill",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { pressure: 120, temp: 75, current: 12.5 },
    location: { x: 200, y: 300 },
    isOnline: true,
    energyConsumption: 450,
    efficiency: 95,
    process: "Precision Milling - Engine Blocks",
  },
  {
    id: "CNC-2",
    type: "CNC_Mill",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { pressure: 110, temp: 70, current: 11.8 },
    location: { x: 400, y: 150 },
    isOnline: true,
    energyConsumption: 425,
    efficiency: 92,
    process: "Surface Finishing - Cylinder Heads",
  },
  {
    id: "CNC-3",
    type: "CNC_Mill",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { pressure: 115, temp: 72, current: 12.2 },
    location: { x: 150, y: 500 },
    isOnline: true,
    energyConsumption: 440,
    efficiency: 94,
    process: "Prototype Development",
  },

  {
    id: "ARM-1",
    type: "Robot_Arm",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { vibration: 0.1, temp: 60, current: 8.5 },
    location: { x: 600, y: 400 },
    isOnline: true,
    energyConsumption: 320,
    efficiency: 97,
    process: "Component Assembly - Main Line",
  },
  {
    id: "ARM-2",
    type: "Robot_Arm",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { vibration: 0.15, temp: 62, current: 8.8 },
    location: { x: 750, y: 350 },
    isOnline: true,
    energyConsumption: 335,
    efficiency: 93,
    process: "Quality Inspection - Vision System",
  },
  {
    id: "ARM-3",
    type: "Robot_Arm",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { vibration: 0.12, temp: 58, current: 8.2 },
    location: { x: 500, y: 100 },
    isOnline: true,
    energyConsumption: 310,
    efficiency: 96,
    process: "Material Handling - Warehouse",
  },

  {
    id: "LATHE-1",
    type: "Lathe",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { rpm: 1500, temp: 65, current: 15.2 },
    location: { x: 300, y: 250 },
    isOnline: true,
    energyConsumption: 580,
    efficiency: 91,
    process: "Shaft Manufacturing - Crankshafts",
  },
  {
    id: "LATHE-2",
    type: "Lathe",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { rpm: 1600, temp: 68, current: 15.8 },
    location: { x: 700, y: 450 },
    isOnline: true,
    energyConsumption: 595,
    efficiency: 89,
    process: "Precision Turning - Pistons",
  },

  // Drilling Department
  {
    id: "DRILL-1",
    type: "Drill",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { torque: 30, temp: 55, current: 6.5 },
    location: { x: 450, y: 200 },
    isOnline: true,
    energyConsumption: 250,
    efficiency: 98,
    process: "Precision Drilling - Engine Blocks",
  },
  {
    id: "DRILL-2",
    type: "Drill",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { torque: 28, temp: 57, current: 6.2 },
    location: { x: 800, y: 250 },
    isOnline: true,
    energyConsumption: 245,
    efficiency: 97,
    process: "Threading Operations",
  },

  // Welding Station
  {
    id: "WELD-1",
    type: "Welding_Station",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { voltage: 220, temp: 85, current: 18.5 },
    location: { x: 250, y: 450 },
    isOnline: true,
    energyConsumption: 680,
    efficiency: 88,
    process: "Chassis Welding - Frame Assembly",
  },
  {
    id: "WELD-2",
    type: "Welding_Station",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { voltage: 215, temp: 82, current: 17.8 },
    location: { x: 650, y: 180 },
    isOnline: true,
    energyConsumption: 665,
    efficiency: 90,
    process: "Structural Welding - Support Frames",
  },

  {
    id: "PRESS-1",
    type: "Hydraulic_Press",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { pressure: 2500, temp: 70, hydraulic_flow: 45.2 },
    location: { x: 100, y: 350 },
    isOnline: true,
    energyConsumption: 820,
    efficiency: 85,
    process: "Metal Stamping - Body Panels",
  },
  {
    id: "PRESS-2",
    type: "Hydraulic_Press",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { pressure: 2400, temp: 68, hydraulic_flow: 43.8 },
    location: { x: 550, y: 550 },
    isOnline: true,
    energyConsumption: 800,
    efficiency: 87,
    process: "Deep Drawing - Fuel Tanks",
  },

  // Grinding Operations
  {
    id: "GRIND-1",
    type: "Surface_Grinder",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { rpm: 3500, temp: 60, vibration: 0.08 },
    location: { x: 350, y: 380 },
    isOnline: true,
    energyConsumption: 380,
    efficiency: 93,
    process: "Surface Grinding - Engine Components",
  },

  // Quality Control Station
  {
    id: "QC-1",
    type: "Inspection_Station",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { precision: 0.001, temp: 22, humidity: 45 },
    location: { x: 850, y: 400 },
    isOnline: true,
    energyConsumption: 150,
    efficiency: 99,
    process: "Dimensional Inspection - Final QC",
  },

  // Conveyor Systems
  {
    id: "CONV-1",
    type: "Conveyor_Belt",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { speed: 1.2, temp: 35, motor_load: 5.5 },
    location: { x: 400, y: 320 },
    isOnline: true,
    energyConsumption: 180,
    efficiency: 96,
    process: "Material Transport - Main Line",
  },
  {
    id: "CONV-2",
    type: "Conveyor_Belt",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { speed: 1.0, temp: 33, motor_load: 5.2 },
    location: { x: 720, y: 280 },
    isOnline: true,
    energyConsumption: 165,
    efficiency: 97,
    process: "Assembly Line Transport",
  },

  // Packaging Station
  {
    id: "PACK-1",
    type: "Packaging_Unit",
    status: "NORMAL",
    anomaly_count: 0,
    sensors: { speed: 25, temp: 28, pressure: 95 },
    location: { x: 900, y: 350 },
    isOnline: true,
    energyConsumption: 220,
    efficiency: 94,
    process: "Final Packaging - Shipping Prep",
  },
];

export function FactoryDashboard() {
  const [factoryState, setFactoryState] = useState<FactoryState>({
    devices: initialDevices,
    totalEnergyConsumption: 0,
    oee: 0,
    plantStatus: "NORMAL",
    lastUpdated: new Date(),
  });

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(true);
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
    const interval = setInterval(updateSimulation, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [updateSimulation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-primary text-primary-foreground industrial-shadow sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Energy Track</h1>
              <p className="text-sm opacity-90">
                Smart Factory Energy & Safety Monitor
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm opacity-90">
                  Overall Equipment Effectiveness
                </div>
                <div className="text-2xl font-bold">
                  {factoryState.oee.toFixed(1)}%
                </div>
              </div>
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
                className="h-[600px]"
              />
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="lg:col-span-1">
            <AlertsPanel devices={factoryState.devices} />
          </div>
        </div>
      </div>

      {/* Device Details Modal */}
      <DeviceModal
        device={selectedDevice}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onDeviceAction={handleDeviceAction}
      />
    </div>
  );
}
