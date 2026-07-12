'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Target } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

// Fix Leaflet default icon issue
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Map event handler component
function LocationMarker({ position, setPosition, onSelect }: { position: L.LatLng | null, setPosition: (p: L.LatLng) => void, onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      setPosition(e.latlng);
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon}></Marker>
  );
}

export function LocationPicker({ initialLat, initialLng, onLocationSelect }: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLat && initialLng ? new L.LatLng(initialLat, initialLng) : null
  );
  
  // Default center (Jakarta)
  const defaultCenter: [number, number] = [-6.2088, 106.8456];
  const center = position ? [position.lat, position.lng] : defaultCenter;

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const newPos = new L.LatLng(lat, lng);
          setPosition(newPos);
          onLocationSelect(lat, lng);
        },
        (err) => {
          console.error("Error getting location:", err);
          alert("Gagal mendapatkan lokasi. Pastikan izin lokasi (GPS) diaktifkan.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Browser Anda tidak mendukung deteksi lokasi.");
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 relative z-0">
      <div className="flex items-center justify-between">
        <label className="text-[10px] md:text-[8px] uppercase tracking-[0.15em] font-medium text-ink/60">
          Pin Lokasi Anda (Untuk Gojek/Grab)
        </label>
        <button 
          type="button" 
          onClick={handleGetCurrentLocation}
          className="flex items-center gap-1 text-[10px] md:text-[8px] uppercase tracking-widest text-rose hover:text-rose/80 transition-colors"
        >
          <Target size={12} />
          Gunakan GPS
        </button>
      </div>
      
      <div className="h-[250px] w-full border border-ink/10 rounded-sm relative overflow-hidden" style={{ zIndex: 1 }}>
        <MapContainer 
          center={center as [number, number]} 
          zoom={13} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} onSelect={onLocationSelect} />
        </MapContainer>
        
        {!position && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-white/40 backdrop-blur-[1px]" style={{ zIndex: 1000 }}>
            <MapPin size={24} className="text-rose mb-2 animate-bounce" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-ink bg-white/90 px-3 py-1 rounded-sm shadow-sm pointer-events-auto cursor-pointer" onClick={() => alert('Silakan klik di mana saja pada peta')}>
              Geser dan klik untuk pasang PIN
            </span>
          </div>
        )}
      </div>
      
      {position && (
        <p className="text-[9px] text-ink/40 font-mono">
          Koordinat: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
