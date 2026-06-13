"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, CircleMarker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default leaflet marker icons in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

// Custom animated pulsing icon for current location
const pulseIcon = L.divIcon({
  className: 'custom-pulse-icon',
  html: `<div style="
    width: 16px; 
    height: 16px; 
    background-color: #10B981; 
    border-radius: 50%; 
    border: 2px solid white;
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    animation: mapPulse 2s infinite;
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// A small dictionary of major Indonesian cities coordinates
const cityCoordinates: Record<string, [number, number]> = {
  'jakarta': [-6.2088, 106.8456],
  'bandung': [-6.9175, 107.6191],
  'surabaya': [-7.2504, 112.7688],
  'yogyakarta': [-7.7970, 110.3705],
  'semarang': [-6.9932, 110.4203],
  'medan': [3.5952, 98.6722],
  'makassar': [-5.1476, 119.4327],
  'bali': [-8.4095, 115.1889],
  'denpasar': [-8.6705, 115.2126],
  'palembang': [-2.9909, 104.7566],
  'balikpapan': [-1.2379, 116.8529],
  'malang': [-7.9666, 112.6326],
};

const ORIGIN_COORDS: [number, number] = [-6.2088, 106.8456]; // Jakarta Atelier

interface TrackingLog {
  id: string;
  description: string | null;
  location: string | null;
  created_at: string;
  biteship_status: string | null;
  internal_status: string | null;
}

interface Props {
  destinationCity?: string;
  status?: string;
  logs?: TrackingLog[];
  className?: string;
}

// MapUpdater safely uses the Leaflet map instance to animate pan/zoom
function MapUpdater({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      if (positions.length === 1) {
        // flyTo gives a detailed, close-up industry standard zoom
        map.flyTo(positions[0], 14, { duration: 1.5 });
      } else {
        // fitBounds ensures all points (origin and destination) are fully visible
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 1.5 });
      }
    }
  }, [map, positions]);
  return null;
}

export default function MapTracker({ destinationCity, status, logs = [], className }: Props) {
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(ORIGIN_COORDS);

  useEffect(() => {
    if (!document.getElementById('map-custom-styles')) {
      const style = document.createElement('style');
      style.id = 'map-custom-styles';
      style.innerHTML = `
        @keyframes mapPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); transform: scale(0.95); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); transform: scale(1); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); transform: scale(0.95); }
        }
        @keyframes mapDash {
          to { stroke-dashoffset: -20; }
        }
        .animated-route-line {
          animation: mapDash 1s linear infinite;
        }
        .custom-tooltip {
          background-color: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          color: #111827;
          font-family: inherit;
          padding: 4px 8px;
          border-radius: 2px;
          margin-left: 8px;
        }
        .custom-tooltip::before {
          display: none;
        }
        /* Custom UI overrides for Leaflet Zoom Controls */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background-color: rgba(255,255,255,0.95) !important;
          color: #111827 !important;
          font-family: inherit !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          border-bottom: 1px solid rgba(0,0,0,0.05) !important;
        }
        .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
          background-color: #f9fafb !important;
          color: #10b981 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    let targetCoords: [number, number] | null = null;
    
    if (destinationCity) {
      const normalizedCity = destinationCity.toLowerCase().trim();
      const matchedKey = Object.keys(cityCoordinates).find(k => normalizedCity.includes(k));
      if (matchedKey) {
        targetCoords = cityCoordinates[matchedKey];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDestCoords(targetCoords);
      }
    }

    if (status === 'delivered' && targetCoords) {
      setCurrentCoords(targetCoords);
    } else if (status === 'shipped' && targetCoords) {
      // Simulate half-way point for current location
      const lat = (ORIGIN_COORDS[0] + targetCoords[0]) / 2;
      const lng = (ORIGIN_COORDS[1] + targetCoords[1]) / 2;
      setCurrentCoords([lat, lng]);
    } else {
      setCurrentCoords(ORIGIN_COORDS);
    }
  }, [destinationCity, status]);

  // Sort logs chronologically (oldest first) to plot them along the route
  const sortedLogs = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  // Calculate interpolated positions for each log point
  const logPoints = sortedLogs.map((log, index) => {
    const totalLogs = sortedLogs.length;
    // Distribute points between origin and current location
    const fraction = totalLogs > 1 ? index / (totalLogs - 1) : 1;
    
    const lat = ORIGIN_COORDS[0] + (currentCoords[0] - ORIGIN_COORDS[0]) * fraction;
    // Add slight curve/jitter to longitude so lines aren't completely straight if needed, but straight is fine for now
    const lng = ORIGIN_COORDS[1] + (currentCoords[1] - ORIGIN_COORDS[1]) * fraction;

    return { lat, lng, log };
  });

  const linePositions = destCoords ? [ORIGIN_COORDS, destCoords] : [ORIGIN_COORDS];

  return (
    <div className={className || "w-full h-[250px] md:h-[400px] relative rounded-sm overflow-hidden border border-ink/10 shadow-inner z-0"}>
      <MapContainer 
        center={currentCoords} 
        zoom={14} 
        scrollWheelZoom={false}
        zoomControl={false}
        className="w-full h-full absolute inset-0 z-0"
      >
        <ZoomControl position="bottomright" />
        <MapUpdater positions={linePositions} />
        
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Destination Marker */}
        {destCoords && (
          <CircleMarker center={destCoords} radius={5} pathOptions={{ color: '#9CA3AF', fillColor: '#F3F4F6', fillOpacity: 1, weight: 2 }}>
            <Tooltip permanent direction="bottom" offset={[0, 10]} className="custom-tooltip">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-ink/50">{destinationCity} (Tujuan)</span>
            </Tooltip>
          </CircleMarker>
        )}

        {/* Route Line */}
        {destCoords && (
          <Polyline positions={linePositions} pathOptions={{ color: '#111827', weight: 2, dashArray: '4, 8', opacity: 0.3, className: 'animated-route-line' }} />
        )}

        {/* Individual Log Points */}
        {logPoints.map((point, idx) => (
          <CircleMarker key={point.log.id} center={[point.lat, point.lng]} radius={4} pathOptions={{ color: '#111827', fillColor: '#ffffff', fillOpacity: 1, weight: 2 }}>
            <Tooltip permanent={true} direction={idx % 2 === 0 ? "right" : "left"} offset={idx % 2 === 0 ? [10, 0] : [-10, 0]} className="custom-tooltip">
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-widest font-bold text-ink">{point.log.location || point.log.biteship_status || 'UPDATE'}</span>
                {point.log.description && <span className="text-[7px] uppercase tracking-wider text-ink/50 mt-0.5 max-w-[120px] whitespace-normal leading-tight">{point.log.description}</span>}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Current Live Location Pulse (At the very end of the current progress) */}
        <Marker position={currentCoords} icon={pulseIcon}>
          <Tooltip permanent direction="top" offset={[0, -10]} className="custom-tooltip border-emerald-500/20">
            <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-600">POSISI TERKINI</span>
          </Tooltip>
        </Marker>
      </MapContainer>

      {/* Decorative Overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 border border-ink/10 shadow-sm pointer-events-none rounded-full flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-ink">Live Logistics</span>
      </div>
    </div>
  );
}
