import { useEffect, useRef, useState } from "react";
import { Device } from "@/types/factory";
import factoryBackground from "@/assets/factory-background.jpg";

interface FactoryMapProps {
  devices: Device[];
  onDeviceClick: (device: Device) => void;
  className?: string;
  deviceActionFeedback?: { deviceId: string; action: 'shutdown' | 'restart' } | null;
}

// Custom Map Pin Component
const CustomMapPin = ({ status, isRestarting }: { status: Device['status'], isRestarting: boolean }) => {
  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'NORMAL': return '#10b981'; // green-500
      case 'WARNING': return '#f59e0b'; // yellow-500  
      case 'CRITICAL': return '#ef4444'; // red-500
      case 'OFF': return '#1f2937'; // gray-800 - much darker for shutdown
      default: return '#9ca3af';
    }
  };

  const fillColor = isRestarting ? '#4ade80' : getStatusColor(status); // green-400 for restart glow

  return (
    <svg 
      width="28" 
      height="36" 
      viewBox="0 0 28 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={isRestarting ? 'drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'drop-shadow-md'}
    >
      {/* Pin Shadow */}
      <path
        d="M14 34C14 34 25 22 25 14C25 8.477 20.523 4 15 4H13C7.477 4 3 8.477 3 14C3 22 14 34 14 34Z"
        fill="rgba(0,0,0,0.2)"
        transform="translate(1,1)"
      />
      {/* Pin Body */}
      <path
        d="M14 32C14 32 24 20 24 14C24 8.477 19.523 4 14 4S4 8.477 4 14C4 20 14 32 14 32Z"
        fill={fillColor}
        stroke="#ffffff"
        strokeWidth="1.5"
      />
      {/* Inner Circle */}
      <circle
        cx="14"
        cy="14"
        r="4"
        fill="#ffffff"
        opacity="0.9"
      />
      {/* Center Dot */}
      <circle
        cx="14"
        cy="14"
        r="1.5"
        fill={fillColor}
      />
    </svg>
  );
};

export function FactoryMap({ devices, onDeviceClick, className, deviceActionFeedback }: FactoryMapProps) {

  return (
    <div className={`${className} relative rounded-lg overflow-hidden`} style={{ backgroundColor: 'hsl(210 100% 20%)' }}>
      <img 
        src={factoryBackground} 
        alt="Factory Floor Plan" 
        className="w-full h-full object-cover"
      />
      
      {devices.map((device) => {
        const isShuttingDown = deviceActionFeedback?.deviceId === device.id && deviceActionFeedback?.action === 'shutdown';
        const isRestarting = deviceActionFeedback?.deviceId === device.id && deviceActionFeedback?.action === 'restart';
        
        return (
          <div
            key={device.id}
            className={`absolute flex flex-col items-center cursor-pointer transition-all duration-500 ${
              device.status === 'OFF' || isShuttingDown
                ? 'opacity-30 grayscale' 
                : isRestarting
                ? 'animate-pulse'
                : 'hover:scale-110'
            }`}
            style={{
              left: `${device.location.x}px`,
              top: `${device.location.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => onDeviceClick(device)}
            title={`${device.id} - ${device.status}`}
          >
            <CustomMapPin 
              status={device.status}
              isRestarting={isRestarting}
            />
            <span className="mt-1 text-xs font-medium text-gray-800 bg-white/90 px-2 py-1 rounded shadow-sm">
              {device.id}
            </span>
          </div>
        );
      })}
    </div>
  );
}