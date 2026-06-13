"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
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
    width: 20px; 
    height: 20px; 
    background-color: #10B981; 
    border-radius: 50%; 
    border: 3px solid white;
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    animation: mapPulse 2s infinite;
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// A small dictionary of major Indonesian cities coordinates to simulate real-time routing
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
const DEFAULT_CENTER: [number, number] = [-2.5489, 118.0149]; // Center of Indonesia

interface Props {
  destinationCity?: string;
  status?: string;
  latestLocation?: string;
}

export default function MapTracker({ destinationCity, status, latestLocation }: Props) {
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(ORIGIN_COORDS);
  const [zoom, setZoom] = useState(5);

  useEffect(() => {
    // Inject the pulse animation styles if not present
    if (!document.getElementById('map-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'map-pulse-style';
      style.innerHTML = `
        @keyframes mapPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); transform: scale(0.95); }
          70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); transform: scale(1); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); transform: scale(0.95); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    let targetCoords: [number, number] | null = null;
    
    if (destinationCity) {
      const normalizedCity = destinationCity.toLowerCase().trim();
      // Try exact match or partial match
      const matchedKey = Object.keys(cityCoordinates).find(k => normalizedCity.includes(k));
      if (matchedKey) {
        targetCoords = cityCoordinates[matchedKey];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDestCoords(targetCoords);
      }
    }

    // Determine current position based on status
    if (status === 'delivered' && targetCoords) {
      setCurrentCoords(targetCoords);
      setZoom(12);
    } else if (status === 'shipped' && targetCoords) {
      // Simulate half-way point for visual effect if shipped
      const lat = (ORIGIN_COORDS[0] + targetCoords[0]) / 2;
      const lng = (ORIGIN_COORDS[1] + targetCoords[1]) / 2;
      setCurrentCoords([lat, lng]);
      setZoom(6);
    } else {
      // Processing or Paid -> still at origin
      setCurrentCoords(ORIGIN_COORDS);
      setZoom(10);
    }
  }, [destinationCity, status]);

  const mapCenter = destCoords 
    ? [(ORIGIN_COORDS[0] + currentCoords[0]) / 2, (ORIGIN_COORDS[1] + currentCoords[1]) / 2] as [number, number]
    : DEFAULT_CENTER;

  // Polyline coordinates from origin to destination (or current)
  const linePositions = destCoords ? [ORIGIN_COORDS, destCoords] : [ORIGIN_COORDS];

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[400px] relative rounded-sm overflow-hidden border border-ink/10 shadow-inner z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={destCoords ? zoom : 5} 
        scrollWheelZoom={false}
        className="w-full h-full absolute inset-0 z-0"
      >
        {/* Using CartoDB Positron for a minimal, premium light aesthetic */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Origin Marker (NINOC Atelier) */}
        <CircleMarker center={ORIGIN_COORDS} radius={6} pathOptions={{ color: '#111827', fillColor: '#111827', fillOpacity: 1 }}>
          <Popup className="font-sans text-xs">
            <b>NINOC Atelier</b><br/>Origin Facility
          </Popup>
        </CircleMarker>

        {/* Destination Marker */}
        {destCoords && (
          <CircleMarker center={destCoords} radius={6} pathOptions={{ color: '#9CA3AF', fillColor: '#F3F4F6', fillOpacity: 1 }}>
            <Popup className="font-sans text-xs">
              <b>Destination</b><br/>{destinationCity}
            </Popup>
          </CircleMarker>
        )}

        {/* Route Line */}
        {destCoords && (
          <Polyline positions={linePositions} pathOptions={{ color: '#111827', weight: 2, dashArray: '5, 10', opacity: 0.4 }} />
        )}

        {/* Current Live Location Pulse */}
        <Marker position={currentCoords} icon={pulseIcon}>
          <Popup className="font-sans text-xs uppercase tracking-widest font-semibold text-emerald-600">
            {status === 'delivered' ? 'DELIVERED' : status === 'shipped' ? 'IN TRANSIT' : 'PROCESSING'}
            {latestLocation && <div className="text-[9px] text-ink/50 mt-1">{latestLocation}</div>}
          </Popup>
        </Marker>
      </MapContainer>

      {/* Decorative Overlay for Premium Feel */}
      <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 border border-ink/10 shadow-lg pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[9px] uppercase tracking-widest font-semibold text-ink">Live Logistics</span>
        </div>
      </div>
    </div>
  );
}
