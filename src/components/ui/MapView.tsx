import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../../contexts/AppContext';
import { cn } from '../../utils/cn';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
  sublabel?: string;
  radius?: number;
  permanent?: boolean;
}

interface MapViewProps {
  markers: MapMarker[];
  center: [number, number];
  zoom: number;
  route?: [number, number][];
  routeColor?: string;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  fitBounds?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function MapView({
  markers,
  center,
  zoom,
  route,
  routeColor = '#0D9488',
  selectedId,
  onSelect,
  fitBounds = false,
  className,
  style
}: MapViewProps) {
  const { dark } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapInstanceRef.current) {
      // Fix leaflet default icon path if needed
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current, {
        center,
        zoom,
        scrollWheelZoom: true,
        attributionControl: true,
        zoomControl: true,
      });

      // Reliable OpenStreetMap tile server (100% Free, Zero API Key required)
      const osmUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      const cartoDarkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(dark ? cartoDarkUrl : osmUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: dark ? 'abcd' : 'abc',
      });

      tileLayer.on('tileerror', () => {
        // Fallback to standard OSM if dark tiles fail
        L.tileLayer(osmUrl, {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
      });

      tileLayer.addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
      setMapLoaded(true);

      // Invalidate size on initial mount
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
      setTimeout(() => {
        map.invalidateSize();
      }, 500);
    }
  }, [center, zoom, dark]);

  // Update Layers & Bounds when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // Add dashed polyline for delivery route
    if (route && route.length > 1) {
      L.polyline(route, {
        color: routeColor,
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 8',
      }).addTo(layers);

      // Start & end pulse halo
      L.circleMarker(route[0], {
        radius: 12,
        color: routeColor,
        weight: 1,
        fillColor: routeColor,
        fillOpacity: 0.2
      }).addTo(layers);
    }

    // Add Custom Markers
    markers.forEach((m) => {
      const isSelected = m.id === selectedId;

      // Create high-contrast glowing marker
      const circle = L.circleMarker([m.lat, m.lng], {
        radius: isSelected ? 11 : (m.radius ?? 9),
        color: isSelected ? '#FFFFFF' : '#FFFFFF',
        weight: 2.5,
        fillColor: m.color,
        fillOpacity: 0.95,
      });

      const tooltipContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 2px 4px; min-width: 120px;">
          <div style="font-weight: 700; font-size: 12px; color: #0F172A;">${m.label}</div>
          ${m.sublabel ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">${m.sublabel}</div>` : ''}
          <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">${m.lat.toFixed(4)}°N, ${m.lng.toFixed(4)}°E</div>
        </div>
      `;

      circle.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -10],
        permanent: m.permanent ?? false,
        className: 'custom-map-tooltip',
      });

      if (onSelect) {
        circle.on('click', () => onSelect(m.id));
      }

      circle.addTo(layers);
    });

    // Auto-fit bounds if requested
    if (fitBounds && markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView(center, zoom);
    }

    map.invalidateSize();
  }, [markers, center, zoom, route, routeColor, selectedId, onSelect, fitBounds, mapLoaded]);

  // ResizeObserver to automatically resize map whenever container or viewport dimensions settle
  useEffect(() => {
    if (!containerRef.current) return;

    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'relative isolate z-0 overflow-hidden rounded-xl border border-line bg-surface shadow-sm',
        className
      )}
      style={style}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ minHeight: '280px', height: '100%', width: '100%' }}
      />
    </div>
  );
}