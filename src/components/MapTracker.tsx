"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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

const ORIGIN_COORDS: [number, number] = [-6.9175, 107.6191]; // Bandung Warehouse

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
  orderId?: string;
}

// MapUpdater: fits the map to show the entire route (origin → destination)
function MapUpdater({ bounds, fallbackCenter }: { bounds: [number, number][]; fallbackCenter: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (bounds.length >= 2) {
        // Fit the map to show all points with padding
        const leafletBounds = L.latLngBounds(bounds.map(b => L.latLng(b[0], b[1])));
        map.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 14, animate: true, duration: 1.5 });
      } else {
        map.flyTo(fallbackCenter, 12, { duration: 1.5, animate: true });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [map, bounds, fallbackCenter]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
      if (bounds.length >= 2) {
        const leafletBounds = L.latLngBounds(bounds.map(b => L.latLng(b[0], b[1])));
        map.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 14 });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map, bounds]);

  return null;
}

export default function MapTracker({ destinationCity, status, logs: initialLogs = [], className, orderId }: Props) {
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(ORIGIN_COORDS);
  const [dynamicCoords, setDynamicCoords] = useState<Record<string, [number, number] | null>>({});
  const [realtimeLogs, setRealtimeLogs] = useState<TrackingLog[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Derive isLive from orderId (no setState needed)
  const isLive = Boolean(orderId);

  // Merge initial logs with realtime logs
  const logs = React.useMemo(() => {
    const merged = [...initialLogs];
    realtimeLogs.forEach(rl => {
      if (!merged.some(l => l.id === rl.id)) {
        merged.push(rl);
      }
    });
    return merged;
  }, [initialLogs, realtimeLogs]);

  // Supabase Realtime subscription for live tracking updates
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`map-track-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tracking_logs',
        filter: `order_id=eq.${orderId}`
      }, (payload) => {
        const newLog = payload.new as TrackingLog;
        setRealtimeLogs(prev => {
          if (prev.some(l => l.id === newLog.id)) return prev;
          return [...prev, newLog];
        });
        setLastUpdate(new Date());
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, () => {
        setLastUpdate(new Date());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);



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
          width: 22px !important;
          height: 22px !important;
          line-height: 22px !important;
          font-size: 14px !important;
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

  // Async Geocoder to resolve unknown cities from Biteship logs
  useEffect(() => {
    let isMounted = true;
    const resolveLocations = async () => {
      const toResolve = new Set<string>();
      if (destinationCity) toResolve.add(destinationCity);
      logs.forEach(l => { if (l.location) toResolve.add(l.location); });

      const newCoords = { ...dynamicCoords };
      let changed = false;

      for (const loc of toResolve) {
        const clean = loc.toLowerCase().trim();
        const matched = Object.keys(cityCoordinates).find(k => clean.includes(k));
        if (matched) continue; // Found in static dict
        if (newCoords[loc] !== undefined) continue; // Already processed

        // Clean up common courier prefixes
        const searchName = clean.replace(/sortation center|transit hub|drop point|cabang|kota adm\.|kota|kab\.|kabupaten|kec\.|kecamatan/gi, '').trim();
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchName + ', Indonesia')}&format=json&limit=1`);
          const data = await res.json();
          if (data && data[0] && isMounted) {
            newCoords[loc] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            changed = true;
          } else {
            newCoords[loc] = null; // Not found
            changed = true;
          }
          await new Promise(r => setTimeout(r, 1100)); // Rate limit 1/sec
        } catch {
          newCoords[loc] = null;
          changed = true;
        }
      }

      if (changed && isMounted) {
        setDynamicCoords(newCoords);
      }
    };

    resolveLocations();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationCity, logs]);

  // Helper to extract coordinates from location string
  const getCoordsFromLocation = React.useCallback((locStr: string | null | undefined): [number, number] | null => {
    if (!locStr) return null;
    const normalized = locStr.toLowerCase().trim();
    const matchedKey = Object.keys(cityCoordinates).find(k => normalized.includes(k));
    if (matchedKey) return cityCoordinates[matchedKey];
    if (dynamicCoords[locStr]) return dynamicCoords[locStr];
    return null;
  }, [dynamicCoords]);

  // Sort logs chronologically (oldest first)
  const sortedLogs = React.useMemo(() => [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [logs]);

  useEffect(() => {
    let targetCoords: [number, number] | null = null;
    
    if (destinationCity) {
      targetCoords = getCoordsFromLocation(destinationCity);
      if (targetCoords) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDestCoords(targetCoords);
      }
    }

    // Try to find valid coordinates from logs
    const validLogCoords = sortedLogs
      .map(log => getCoordsFromLocation(log.location))
      .filter(Boolean) as [number, number][];

    if (status === 'delivered' && targetCoords) {
      setCurrentCoords(targetCoords);
    } else if (validLogCoords.length > 0) {
      // Set to the latest known location from the timeline logs
      setCurrentCoords(validLogCoords[validLogCoords.length - 1]);
    } else if (status === 'shipped' && targetCoords) {
      // Fallback: Simulate halfway point if shipped but no location data yet
      const lat = (ORIGIN_COORDS[0] + targetCoords[0]) / 2;
      const lng = (ORIGIN_COORDS[1] + targetCoords[1]) / 2;
      setCurrentCoords([lat, lng]);
    } else {
      setCurrentCoords(ORIGIN_COORDS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationCity, status, sortedLogs]);

  const linePositions = React.useMemo(() => {
    const path: [number, number][] = [ORIGIN_COORDS];
    const uniqueCoords = new Set<string>([`${ORIGIN_COORDS[0]},${ORIGIN_COORDS[1]}`]);

    sortedLogs.forEach(log => {
      const coords = getCoordsFromLocation(log.location);
      if (coords) {
        const key = `${coords[0]},${coords[1]}`;
        if (!uniqueCoords.has(key)) {
          path.push(coords);
          uniqueCoords.add(key);
        }
      }
    });

    const currentKey = `${currentCoords[0]},${currentCoords[1]}`;
    if (!uniqueCoords.has(currentKey)) {
      path.push(currentCoords);
    }
    
    if (destCoords) {
      const destKey = `${destCoords[0]},${destCoords[1]}`;
      if (!uniqueCoords.has(destKey)) {
        path.push(destCoords);
      }
    }
    return path;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCoords, destCoords, sortedLogs]);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);

  useEffect(() => {
    if (linePositions.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoutePolyline(linePositions);
      return;
    }

    // Fetch actual driving route via OSRM to simulate realistic GPS expedition routes
    const coordsStr = linePositions.map(p => `${p[1]},${p[0]}`).join(';');
    
    fetch(`https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          // GeoJSON coordinates are [lng, lat], Leaflet Polyline expects [lat, lng]
          const mappedCoords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          setRoutePolyline(mappedCoords);
        } else {
          setRoutePolyline(linePositions);
        }
      })
      .catch(err => {
        console.error('Failed to fetch OSRM route:', err);
        setRoutePolyline(linePositions); // fallback to straight lines
      });
  }, [linePositions]);

  // Interpolate log points along the line segment from origin to currentCoords
  const logPoints = sortedLogs.map((log, index) => {
    const totalLogs = sortedLogs.length;
    const fraction = totalLogs > 1 ? index / (totalLogs - 1) : 1;
    
    // If we have actual coordinates for this log, use them
    const actualCoords = getCoordsFromLocation(log.location);
    if (actualCoords) {
      return { lat: actualCoords[0], lng: actualCoords[1], log };
    }

    // Otherwise, fallback to interpolating along the path
    const lat = ORIGIN_COORDS[0] + (currentCoords[0] - ORIGIN_COORDS[0]) * fraction;
    const lng = ORIGIN_COORDS[1] + (currentCoords[1] - ORIGIN_COORDS[1]) * fraction;

    return { lat, lng, log };
  });

  // Compute bounds for fitBounds
  const mapBounds = React.useMemo(() => {
    const points: [number, number][] = [ORIGIN_COORDS];
    if (destCoords) points.push(destCoords);
    if (currentCoords) points.push(currentCoords);
    logPoints.forEach(p => points.push([p.lat, p.lng]));
    return points;
  }, [destCoords, currentCoords, logPoints]);

  return (
    <div className={className || "w-full max-w-4xl mx-auto h-[250px] md:h-[400px] relative rounded-sm overflow-hidden border border-ink/10 shadow-inner z-0"}>
      {/* LIVE Indicator */}
      {isLive && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-gray-200">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669' }}>LIVE</span>
          {lastUpdate && (
            <span style={{ fontSize: '9px', color: '#6B7280', marginLeft: '4px' }}>
              {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      )}

      <MapContainer 
        center={currentCoords} 
        zoom={10} 
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full absolute inset-0 z-0"
      >
        <ZoomControl position="topleft" />
        <MapUpdater bounds={mapBounds} fallbackCenter={destCoords || ORIGIN_COORDS} />
        
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Origin Marker (Gudang NINOC) */}
        <CircleMarker center={ORIGIN_COORDS} radius={6} pathOptions={{ color: '#111827', fillColor: '#111827', fillOpacity: 1, weight: 2 }}>
          <Tooltip permanent direction="top" offset={[0, -10]} className="custom-tooltip">
            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#111827' }}>GUDANG NINOC</span>
          </Tooltip>
        </CircleMarker>

        {/* Destination Marker */}
        {destCoords && (
          <CircleMarker center={destCoords} radius={6} pathOptions={{ color: '#EF4444', fillColor: '#FEE2E2', fillOpacity: 1, weight: 2 }}>
            <Tooltip permanent direction="bottom" offset={[0, 10]} className="custom-tooltip">
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#EF4444' }}>{destinationCity} (TUJUAN)</span>
            </Tooltip>
          </CircleMarker>
        )}

        {/* Route Line (Actual GPS Driving Path) */}
        {routePolyline.length > 0 && (
          <Polyline positions={routePolyline} pathOptions={{ color: '#111827', weight: 2.5, dashArray: '6, 10', opacity: 0.4, className: 'animated-route-line' }} />
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

    </div>
  );
}
