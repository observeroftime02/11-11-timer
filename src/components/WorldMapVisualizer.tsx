import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Globe, Sparkles, Maximize2, MapPin, Compass } from 'lucide-react';
import { NextMomentEvent, CityTimeZone, TrackerMode } from '../types';
import { WORLD_CITIES } from '../data/timezones';
import { formatCountdownHuman, formatCurrentTzTime } from '../utils/timeEngine';

interface WorldMapVisualizerProps {
  nextEvent: NextMomentEvent;
  activeNow: CityTimeZone[];
  userCityNext: NextMomentEvent;
  userTimeZone: string;
  onOpenFullScreen?: () => void;
  onSelectCity: (city: CityTimeZone) => void;
  mode?: TrackerMode;
}

const DARK_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';

export const WorldMapVisualizer: React.FC<WorldMapVisualizerProps> = ({
  nextEvent,
  activeNow,
  userCityNext,
  userTimeZone,
  onOpenFullScreen,
  onSelectCity,
  mode = '1111',
}) => {
  const is420 = mode === '420';
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const waveLineRef = useRef<L.Polyline | null>(null);

  // 1. Initialize Leaflet Map ONCE on mount (prevents 1-second re-mount flicker)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Focus the preview map on the next upcoming city
    const initialLat = nextEvent.city.lat || 20;
    const initialLng = nextEvent.city.lng || 0;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 3.25,
      minZoom: 1.5,
      maxZoom: 7,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      worldCopyJump: true,
    });

    // Dark Map Tiles (Esri ArcGIS Canvas Dark Gray - Clean & Fast)
    L.tileLayer(DARK_TILE_URL, {
      maxZoom: 16,
      attribution: TILE_ATTRIBUTION,
    }).addTo(map);

    // Static Timezone Meridian Lines
    const tzGroup = L.layerGroup();
    for (let i = -12; i <= 12; i++) {
      const lng = i * 15;
      const isUtcZero = i === 0;

      const line = L.polyline(
        [
          [-85, lng],
          [85, lng],
        ],
        {
          color: isUtcZero ? '#38bdf8' : '#475569',
          weight: isUtcZero ? 1.5 : 0.75,
          dashArray: isUtcZero ? undefined : '3, 5',
          opacity: isUtcZero ? 0.75 : 0.35,
        }
      );
      tzGroup.addLayer(line);

      // Shading for alternating bands
      if (i % 2 === 0 && i < 12) {
        const polygon = L.polygon(
          [
            [-85, lng],
            [85, lng],
            [85, lng + 15],
            [-85, lng + 15],
          ],
          {
            color: 'transparent',
            fillColor: '#334155',
            fillOpacity: 0.08,
            stroke: false,
          }
        );
        tzGroup.addLayer(polygon);
      }
    }
    tzGroup.addTo(map);

    // Active Golden or Emerald Wave Line for next target longitude
    const wave = L.polyline(
      [
        [-85, initialLng],
        [85, initialLng],
      ],
      {
        color: is420 ? '#10b981' : '#f59e0b',
        weight: 2.5,
        dashArray: '5, 5',
        opacity: 0.95,
      }
    );
    wave.addTo(map);
    waveLineRef.current = wave;

    // Layer group for dynamic markers
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [is420]);

  // 2. Smoothly pan/center when nextEvent.city changes & update markers WITHOUT tearing down the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current) return;

    // Smoothly fly camera to center the preview on the Next target city
    map.flyTo([nextEvent.city.lat, nextEvent.city.lng], 3.25, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    // Update Wave position and color
    if (waveLineRef.current) {
      waveLineRef.current.setLatLngs([
        [-85, nextEvent.city.lng],
        [85, nextEvent.city.lng],
      ]);
      waveLineRef.current.setStyle({
        color: is420 ? '#10b981' : '#f59e0b',
      });
    }

    // Rebuild marker overlays smoothly
    markersLayerRef.current.clearLayers();

    WORLD_CITIES.forEach((city) => {
      const isNext = city.id === nextEvent.city.id;
      const isHome = city.timeZone === userTimeZone;
      const isActive = activeNow.some((c) => c.id === city.id);

      if (isNext) {
        // Prominent Next Beacon with City Label
        const icon = L.divIcon({
          className: 'leaflet-custom-marker',
          html: `
            <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
              <div class="relative flex items-center justify-center">
                <span class="absolute w-10 h-10 rounded-full ${is420 ? 'bg-emerald-400/50' : 'bg-amber-400/50'} animate-ping"></span>
                <span class="w-7 h-7 rounded-full ${is420 ? 'bg-emerald-400' : 'bg-amber-400'} border-2 border-neutral-950 shadow-2xl flex items-center justify-center text-xs font-bold text-neutral-950">${is420 ? '🌿' : '✨'}</span>
              </div>
              <div class="mt-1 px-2 py-0.5 rounded-md bg-neutral-950/90 border ${is420 ? 'border-emerald-500/50 text-emerald-300' : 'border-amber-500/50 text-amber-300'} text-[10px] font-bold shadow-md whitespace-nowrap">
                ${city.name}
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        markersLayerRef.current?.addLayer(L.marker([city.lat, city.lng], { icon, zIndexOffset: 1000 }));
      } else if (isActive) {
        const icon = L.divIcon({
          className: 'leaflet-custom-marker',
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
              <span class="absolute w-7 h-7 rounded-full bg-emerald-400/40 animate-ping"></span>
              <span class="w-4 h-4 rounded-full bg-emerald-400 border-2 border-neutral-950 shadow-lg flex items-center justify-center text-[8px]">${is420 ? '🌿' : '✨'}</span>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        markersLayerRef.current?.addLayer(L.marker([city.lat, city.lng], { icon, zIndexOffset: 900 }));
      } else if (isHome) {
        const icon = L.divIcon({
          className: 'leaflet-custom-marker',
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
              <span class="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-lg flex items-center justify-center text-[8px]">🏠</span>
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        markersLayerRef.current?.addLayer(L.marker([city.lat, city.lng], { icon, zIndexOffset: 800 }));
      } else if (WORLD_CITIES.indexOf(city) % 2 === 0) {
        // Ambient nearby reference dots
        const icon = L.divIcon({
          className: 'leaflet-custom-marker',
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
              <span class="w-2 h-2 rounded-full bg-neutral-400/60 border border-neutral-900"></span>
            </div>
          `,
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        });
        markersLayerRef.current?.addLayer(L.marker([city.lat, city.lng], { icon, zIndexOffset: 10 }));
      }
    });
  }, [nextEvent.city.id, userTimeZone, activeNow.length, is420]);

  const countdown = formatCountdownHuman(nextEvent.remainingMs);

  return (
    <div className="rounded-3xl bg-neutral-900/80 border border-neutral-800 p-5 md:p-6 backdrop-blur-sm shadow-xl space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Globe className={`w-4 h-4 ${is420 ? 'text-emerald-400' : 'text-amber-400'}`} />
          <h3 className="font-display font-bold text-base md:text-lg text-white">
            Upcoming {is420 ? '4:20' : '11:11'} Location Preview
          </h3>
        </div>

        {onOpenFullScreen && (
          <button
            id="btn-expand-full-map"
            onClick={onOpenFullScreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
          >
            <Maximize2 className={`w-3.5 h-3.5 ${is420 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>Full Interactive Map</span>
          </button>
        )}
      </div>

      {/* Location Target Info Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            {nextEvent.city.flag}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-white flex items-center gap-2 flex-wrap">
              <span>{nextEvent.city.name}</span>
              <span className="text-[11px] font-mono text-sky-400 px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-semibold">
                {nextEvent.city.baseOffsetUtc}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wide uppercase ${
                  is420
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                Next {is420 ? '4:20' : '11:11'} Target
              </span>
            </div>
            <div className="text-xs text-neutral-400 truncate mt-0.5">
              {nextEvent.city.country} • {nextEvent.city.landmark}
            </div>
          </div>
        </div>

        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-800 text-xs shrink-0">
          <span className="text-neutral-400 text-[11px]">Next {is420 ? '4:20' : '11:11'} in</span>
          <span
            className={`font-mono font-bold text-sm tracking-tight ${
              is420 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            in {countdown}
          </span>
        </div>
      </div>

      {/* Focused Location Preview Map Card */}
      <div
        onClick={onOpenFullScreen}
        className="relative w-full aspect-[2.1/1] min-h-[220px] rounded-2xl bg-[#070c18] border border-neutral-800 overflow-hidden shadow-2xl cursor-pointer group select-none"
      >
        <div ref={mapContainerRef} className="w-full h-full pointer-events-none" />

        {/* Bottom-Right Tap to expand pill */}
        <div
          className={`absolute bottom-3 right-3 z-[1000] bg-neutral-950/90 text-neutral-200 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all group-hover:scale-105 ${
            is420 ? 'group-hover:bg-emerald-400 group-hover:text-neutral-950' : 'group-hover:bg-amber-400 group-hover:text-neutral-950'
          }`}
        >
          <Maximize2 className={`w-3.5 h-3.5 ${is420 ? 'text-emerald-400 group-hover:text-neutral-950' : 'text-amber-400 group-hover:text-neutral-950'}`} />
          <span>Tap to Pan & Explore World</span>
        </div>
      </div>

      {/* Quick Legend Bar */}
      <div className="text-[11px] text-neutral-400 flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`flex items-center gap-1 font-medium ${is420 ? 'text-emerald-300' : 'text-amber-300'}`}>
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${is420 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            Next Target: {nextEvent.city.name} ({nextEvent.city.baseOffsetUtc})
          </span>
          <span className="flex items-center gap-1 text-indigo-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
            Home: {userCityNext.city.name}
          </span>
          {activeNow.length > 0 && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Active Now ({activeNow.length})
            </span>
          )}
        </div>
        <span className="text-neutral-500 font-mono text-[10px]">
          Preview tracks upcoming {is420 ? '4:20' : '11:11'} location
        </span>
      </div>
    </div>
  );
};
