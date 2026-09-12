import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, Marker, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── We now determine color strictly based on recommendation status (Green vs Yellow)

// ── Fit map to all route bounds ─────────────────────────────────────────────
function FitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [bounds, map]);
  return null;
}

// ── Custom pin icon factory ──────────────────────────────────────────────────
function pinIcon(color: string, label: string) {
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
    html: `
      <div style="
        background:${color};
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);color:white;font-size:11px;font-weight:700;">
          ${label}
        </span>
      </div>`,
  });
}

// ── Truck pin icon factory ──────────────────────────────────────────────────
function truckIcon() {
  return L.divIcon({
    className: 'truck-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    html: `
      <div style="
        background: #3b82f6;
        width: 40px; height: 40px; border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px;
      ">
        🚛
      </div>`,
  });
}

interface RouteOption {
  route_id: string;
  route_name: string;
  is_recommended: boolean;
  risk_percentage: number;
  travel_time_mins: number;
  distance_km: number;
  coordinates: number[][];
}

interface RouteMapProps {
  routes: RouteOption[];
  originName?: string;
  destinationName?: string;
  truckPosition?: [number, number];
  hazards?: { id: string, location: [number, number], severity: string }[];
}

export default function RouteMap({ routes, originName, destinationName, truckPosition, hazards = [] }: RouteMapProps) {
  const defaultCenter: [number, number] = [26.1445, 91.7362];

  // Sort routes: recommended first, then by ascending risk
  const sorted = React.useMemo(
    () => [...routes].sort((a, b) => a.risk_percentage - b.risk_percentage),
    [routes]
  );

  const bounds = React.useMemo(() => {
    if (!routes.length) return null;
    const all: L.LatLngExpression[] = [];
    routes.forEach(r => r.coordinates.forEach(c => all.push([c[0], c[1]])));
    return all.length ? L.latLngBounds(all) : null;
  }, [routes]);

  // Pick start/end from any route (they share origin/dest)
  const startPos  = sorted[0]?.coordinates[0];
  const endPos    = sorted[0]?.coordinates[sorted[0].coordinates.length - 1];

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-slate-200">

      {/* ── Floating legend ── */}
      <div
        style={{ zIndex: 1000 }}
        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 p-3 text-xs space-y-1.5 min-w-[140px]"
      >
        <p className="font-bold text-slate-700 mb-2">AI Risk Index</p>
        {[
          { label: 'SAFE',     color: '#16a34a', desc: 'Safest Route'   },
          { label: 'MODERATE', color: '#f59e0b', desc: 'Alternative'  },
        ].map(({ label, color, desc }) => (
          <div key={label} className="flex items-center gap-2">
            <span style={{ background: color }} className="w-4 h-2 rounded-full inline-block" />
            <span className="text-slate-600 font-medium">{label}</span>
            <span className="text-slate-400 ml-auto">{desc}</span>
          </div>
        ))}
        <div className="border-t border-slate-100 mt-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0 border-t-2 border-slate-400 inline-block" />
            <span className="text-slate-500">Solid = Safest</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-4 h-0 border-t-2 border-dashed border-slate-400 inline-block" />
            <span className="text-slate-500">Dashed = Alt.</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={import.meta.env.VITE_CARTO_TILE_URL || "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
        />
        <FitBounds bounds={bounds} />

        {/* ── Draw routes from highest risk → lowest so safest is on top ── */}
        {[...sorted].reverse().map((route, idx) => {
          const isSafest  = route.is_recommended;
          const color     = isSafest ? '#16a34a' : '#f59e0b';
          const emoji     = isSafest ? '🟢' : '🟡';
          const label     = isSafest ? 'SAFE' : 'MODERATE';
          
          const positions = route.coordinates.map(c => [c[0], c[1]] as L.LatLngExpression);
          const weight    = isSafest ? 7 : 4;
          const opacity   = isSafest ? 1.0 : 0.75;
          const dash      = isSafest ? undefined : '12, 8';

          return (
            <React.Fragment key={`route-${route.route_id}-${idx}`}>
              {/* Glow/halo effect for safest route */}
              {isSafest && (
                <Polyline
                  positions={positions}
                  pathOptions={{ color, weight: 14, opacity: 0.18, dashArray: undefined }}
                />
              )}

              {/* Main route line */}
              <Polyline
                positions={positions}
                pathOptions={{ color, weight, opacity, dashArray: dash, lineCap: 'round', lineJoin: 'round' }}
              >
                <Popup minWidth={220}>
                  <div style={{ fontFamily: 'system-ui, sans-serif' }}>
                    {/* Header */}
                    <div style={{ background: color, borderRadius: '8px 8px 0 0', margin: '-12px -12px 10px', padding: '10px 12px' }}>
                      <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>{route.route_name}</p>
                      {isSafest && (
                        <span style={{ background: 'rgba(255,255,255,0.25)', color: 'white', fontSize: 10, padding: '1px 8px', borderRadius: 999 }}>
                          ★ AI Recommended – Safest Route
                        </span>
                      )}
                    </div>

                    {/* Risk badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{emoji}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>AI Risk Level</p>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color }}>
                          {route.risk_percentage}% — {label}
                        </p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: 12 }}>
                      <div style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 8px' }}>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: 10 }}>DISTANCE</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{route.distance_km} km</p>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 8px' }}>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: 10 }}>EST. TIME</p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{route.travel_time_mins} mins</p>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polyline>

              {/* Risk dots along the route at key points */}
              {route.coordinates
                .filter((_, i) => i % Math.max(1, Math.floor(route.coordinates.length / 5)) === 0 && i !== 0 && i !== route.coordinates.length - 1)
                .map((c, dotIdx) => (
                  <CircleMarker
                    key={`dot-${route.route_id}-${dotIdx}`}
                    center={[c[0], c[1]]}
                    radius={isSafest ? 5 : 3.5}
                    pathOptions={{ color: 'white', fillColor: color, fillOpacity: 0.9, weight: 1.5 }}
                  >
                    <Popup>
                      <div style={{ fontSize: 12 }}>
                        <strong>{emoji} {label}</strong><br />
                        Risk: <strong style={{ color }}>{route.risk_percentage}%</strong>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
            </React.Fragment>
          );
        })}

        {/* ── Origin pin (green) ── */}
        {startPos && (
          <Marker position={[startPos[0], startPos[1]]} icon={pinIcon('#16a34a', 'A')}>
            <Popup><strong>🟢 Origin:</strong><br />{originName || 'Start'}</Popup>
          </Marker>
        )}

        {/* ── Destination pin (red) ── */}
        {endPos && (
          <Marker position={[endPos[0], endPos[1]]} icon={pinIcon('#dc2626', 'B')}>
            <Popup><strong>🔴 Destination:</strong><br />{destinationName || 'End'}</Popup>
          </Marker>
        )}

        {/* ── Truck pin ── */}
        {truckPosition && (
          <Marker position={[truckPosition[0], truckPosition[1]]} icon={truckIcon()} zIndexOffset={1000}>
            <Popup><strong>🚛 Live Tracking</strong><br />In transit...</Popup>
          </Marker>
        )}

        {/* ── Hazard pins ── */}
        {hazards.map((h) => {
          const color = h.severity === 'CRITICAL' ? '#ef4444' : h.severity === 'WARNING' ? '#f59e0b' : '#3b82f6';
          return (
            <Marker key={h.id} position={h.location} icon={pinIcon(color, '!')} zIndexOffset={999}>
              <Popup><strong>⚠️ {h.severity} HAZARD</strong></Popup>
            </Marker>
          );
        })}

      </MapContainer>
    </div>
  );
}
