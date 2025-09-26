import { useEffect, useRef, useState } from "react";
import { Device } from "@/types/factory";
import factoryBackground from "@/assets/factory-background.jpg";

// Leaflet imports with proper types
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FactoryMapProps {
  devices: Device[];
  onDeviceClick: (device: Device) => void;
  className?: string;
}

export function FactoryMap({ devices, onDeviceClick, className }: FactoryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Create status-based icons
  const createStatusIcon = (status: Device['status']) => {
    const colorMap = {
      NORMAL: 'green',
      WARNING: 'yellow', 
      CRITICAL: 'red',
      OFF: 'grey'
    };

    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${colorMap[status]}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -50],
      shadowSize: [41, 41],
    });
  };

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize map with simple CRS for factory floor plan
    const bounds: L.LatLngBoundsExpression = [[0, 0], [600, 1000]];
    const map = L.map(mapContainer.current, {
      crs: L.CRS.Simple,
      minZoom: 0,
      maxZoom: 3,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: false,
      touchZoom: true,
      zoomSnap: 0.25,
      zoomDelta: 0.25,
    });

    // Add factory background
    L.imageOverlay(factoryBackground, bounds).addTo(map);
    map.fitBounds(bounds);
    
    // Set max bounds to prevent panning outside the image
    map.setMaxBounds(bounds);
    map.on('drag', function() {
      map.panInsideBounds(bounds, { animate: false });
    });

    // Add zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Update device markers
    devices.forEach((device) => {
      const position: L.LatLngExpression = [device.location.y, device.location.x];
      const icon = createStatusIcon(device.status);

      if (markersRef.current[device.id]) {
        // Update existing marker
        markersRef.current[device.id]
          .setLatLng(position)
          .setIcon(icon);
      } else {
        // Create new marker
        const marker = L.marker(position, { icon })
          .addTo(mapRef.current!)
          .on('click', () => onDeviceClick(device));

        // Add permanent tooltip with device ID
        marker.bindTooltip(device.id, {
          permanent: true,
          direction: 'top',
          offset: [0, -35],
          className: 'factory-tooltip'
        });

        markersRef.current[device.id] = marker;
      }
    });

    // Remove markers for devices that no longer exist
    Object.keys(markersRef.current).forEach((deviceId) => {
      if (!devices.find(d => d.id === deviceId)) {
        markersRef.current[deviceId].remove();
        delete markersRef.current[deviceId];
      }
    });
  }, [devices, onDeviceClick]);

  return (
    <div className={className}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg industrial-shadow overflow-hidden factory-map-container"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}