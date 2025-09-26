export type DeviceStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFF';

export type DeviceType = 'CNC_Mill' | 'Robot_Arm' | 'Lathe' | 'Drill' | 'Conveyor' | 'Quality_Check' | 
  'Welding_Station' | 'Hydraulic_Press' | 'Surface_Grinder' | 'Inspection_Station' | 'Conveyor_Belt' | 'Packaging_Unit';

export interface SensorData {
  [key: string]: number;
}

export interface Device {
  id: string;
  type: DeviceType;
  status: DeviceStatus;
  anomaly_count: number;
  sensors: SensorData;
  location: {
    x: number;
    y: number;
  };
  lastAnomaly?: Date;
  aiAnalysis?: string;
  aiRecommendation?: string;
  isOnline: boolean;
  energyConsumption?: number;
  efficiency?: number;
  process?: string; // Manufacturing process description
}

export interface FactoryState {
  devices: Device[];
  totalEnergyConsumption: number;
  oee: number;
  plantStatus: DeviceStatus;
  lastUpdated: Date;
}

export interface KPIData {
  oee: number;
  energyEfficiency: number;
  plantStatus: DeviceStatus;
  deviceUptime: number;
  totalDevices: number;
  activeDevices: number;
  criticalAlerts: number;
}