// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { 
  Navigation, ShieldAlert, Package, MapPin, 
  ArrowDownUp, Activity, CheckCircle2, AlertTriangle, 
  Clock, Route as RouteIcon, Truck, Camera, ChevronUp, ChevronDown, Check, LogOut
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import RouteMap from '../../components/Map/RouteMap';

import { geocodingService } from '../../services/geocodingService';
import { routingService } from '../../services/routingService';
import LanguageSelector from '../../components/LanguageSelector';
import NotificationBell from '../../components/Notifications/NotificationBell';
import DriverAlertOverlay from '../../components/Notifications/DriverAlertOverlay';
import { notificationService } from '../../services/notificationService';
import { useTranslation } from 'react-i18next';

// ── Downsample coordinate array to max N evenly-spaced points ───────────────
// Keeps first + last point, then picks N-2 evenly spaced from the middle.
// This slashes ML backend calls from potentially 500 → 25 per route.
function downsample(coords: [number, number][], maxPts = 25): [number, number][] {
  if (coords.length <= maxPts) return coords;
  const result: [number, number][] = [coords[0]];
  const step = (coords.length - 2) / (maxPts - 2);
  for (let i = 1; i < maxPts - 1; i++) {
    result.push(coords[Math.round(i * step)]);
  }
  result.push(coords[coords.length - 1]);
  return result;
}

export default function Transport() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [origin, setOrigin] = useState('Guwahati, Assam');
  const [destination, setDestination] = useState('Shillong, Meghalaya');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [cargoType, setCargoType] = useState('General Freight');

  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [truckPosition, setTruckPosition] = useState<[number, number] | undefined>(undefined);
  const truckPositionRef = useRef<[number, number] | undefined>(undefined);
  const [activeHazards, setActiveHazards] = useState<{ id: string, location: [number, number], severity: string }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const startLiveTrip = (routeId: string, coordinates: [number, number][]) => {
    if (wsRef.current) wsRef.current.close();
    setActiveRouteId(routeId);
    setTruckPosition(coordinates[0]);

    const ws = new WebSocket(`ws://localhost:8000/api/v1/tracking/live/${routeId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ coordinates, speed_ms: 1000 }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.current_position) {
          setTruckPosition(data.current_position);
          truckPositionRef.current = data.current_position;
        }
        if (data.status === 'completed') setActiveRouteId(null);
        
        if (data.type === 'hazard_alert') {
          const hId = `HZ-${Date.now()}`;
          notificationService.notifyHazard(
            hId, 
            'TRK-018', 
            data.hazard.severity.toUpperCase(), 
            data.hazard.description, 
            { location: 'Field Report' }
          );
          
          setActiveHazards(prev => {
            const newHazard = { id: hId, location: [data.hazard.lat, data.hazard.lon] as [number, number], severity: data.hazard.severity };
            const updated = [...prev, newHazard];
            
            if (truckPositionRef.current) {
               // Schedule reroute outside render cycle
               setTimeout(() => {
                 handleEvaluate(truckPositionRef.current, updated).then(() => {
                   if (wsRef.current) wsRef.current.close();
                   setActiveRouteId(null);
                   // The DriverAlertOverlay will handle the visual notification, no need to freeze DOM with alert()
                 });
               }, 100);
            }
            return updated;
          });
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    ws.onclose = () => {
      setActiveRouteId(null);
    };
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReportingHazard, setIsReportingHazard] = useState(false);
  const [showHazardForm, setShowHazardForm] = useState(false);
  const [hazardLatInput, setHazardLatInput] = useState('');
  const [hazardLonInput, setHazardLonInput] = useState('');
  const [hazardFile, setHazardFile] = useState<File | null>(null);

  // Automatically pre-fill citizen coordinates when a truck starts moving (for demo convenience)
  useEffect(() => {
    if (truckPosition && !hazardLatInput && !hazardLonInput) {
      setHazardLatInput((truckPosition[0] + 0.005).toFixed(4));
      setHazardLonInput((truckPosition[1] + 0.005).toFixed(4));
    }
  }, [truckPosition]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleHazardSubmit = async () => {
    if (!hazardFile || !hazardLatInput || !hazardLonInput) {
      alert("Please provide a photo and coordinates.");
      return;
    }
    
    if (!truckPosition || !activeRouteId) {
      alert("Citizen Report Submitted! (No active trucks in the area to reroute)");
      setShowHazardForm(false);
      return;
    }

    setIsReportingHazard(true);
    setLoadingStep('📸 AI verifying crowdsourced report & generating new route...');
    setLoading(true);

    try {
      // Geocode destination for the backend
      const destCoords = await geocodingService.geocodeAddress(destination);

      const formData = new FormData();
      formData.append('file', hazardFile);
      formData.append('hazard_lat', hazardLatInput);
      formData.append('hazard_lon', hazardLonInput);
      formData.append('origin_lat', truckPosition[0].toString());
      formData.append('origin_lon', truckPosition[1].toString());
      formData.append('dest_lat', destCoords[0].toString());
      formData.append('dest_lon', destCoords[1].toString());
      formData.append('cargo_type', cargoType);

      const res = await fetch('http://localhost:8000/api/v1/vision/analyze-and-reroute', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to analyze hazard and reroute');
      const data = await res.json();

      if (data.hazard_detected) {
        notificationService.notifyHazard(
          `HZ-${Date.now()}`,
          'TRK-018',
          'CRITICAL', // Treat manual hazard report as critical to force UI overlay
          data.hazard_type || 'Road Hazard Detected',
          { location: 'Citizen Report' }
        );
        // The DriverAlertOverlay will handle the visual notification, no need to freeze DOM with alert()
        
        // Pause current trip
        if (wsRef.current) wsRef.current.close();
        setActiveRouteId(null);
        
        // Update map with new AI-generated route
        setEvaluationResult({
           ...evaluationResult,
           origin: 'Current Location',
           route_options: data.route_options
        });
        
        setShowHazardForm(false);
        setHazardFile(null);
      }
    } catch (err: any) {
      alert("Error reporting hazard: " + err.message);
    } finally {
      setIsReportingHazard(false);
      setLoading(false);
    }
  };

  const handleEvaluate = async (
    customOriginCoords?: [number, number],
    activeHazards: any[] = []
  ) => {
    setLoading(true);
    setError('');
    
    try {
      setLoadingStep('📍 Geocoding locations...');
      const [originCoords, destCoords] = await Promise.all([
        customOriginCoords ? Promise.resolve(customOriginCoords) : geocodingService.geocodeAddress(origin),
        geocodingService.geocodeAddress(destination),
      ]);

      setLoadingStep('🗺️ Fetching real road routes...');
      const osrmRoutes = await routingService.fetchOSRMRoutes(originCoords, destCoords);

      setLoadingStep('🤖 Running AI risk assessment...');
      // Artificial delay to make the AI processing visually apparent to the user in the demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const payload = {
        origin: customOriginCoords ? 'Current Location' : origin,
        destination,
        candidate_routes: osrmRoutes.map(r => ({
          route_id: r.route_id,
          route_name: r.route_name,
          travel_time_mins: r.travel_time_mins,
          distance_km: r.distance_km,
          coordinates: r.coordinates 
        })),
        active_hazards: activeHazards.map(h => ({ lat: h.location[0], lon: h.location[1] })),
        cargo_type: cargoType,
      };

      const response = await fetch(
        'http://localhost:8000/api/v1/transport/evaluate-routes',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Backend error (${response.status}): ${errBody}`);
      }

      const data = await response.json();

      if (data.route_options) {
        data.route_options.forEach((ro: any) => {
          const originalRoute = osrmRoutes.find(r => r.route_id === ro.route_id);
          if (originalRoute) {
            ro.coordinates = originalRoute.full_coordinates;
          }
        });
      }

      setEvaluationResult(data);

    } catch (err: any) {
      setError(err.message ?? 'An unknown error occurred.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F7] font-sans text-slate-900 overflow-x-hidden selection:bg-sky-900/10 p-4 sm:p-6 lg:p-8">
      <DriverAlertOverlay />
      {/* ── TOP HEADER ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="NERA Logo" className="h-8 w-auto mix-blend-multiply" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transport &amp; Logistics Command</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">AI-assisted route planning and fleet movement across Northeast India</p>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex">
          <LanguageSelector />
          <NotificationBell />
          <div className="flex flex-col text-right mr-2">
            <span className="text-sm font-bold text-slate-800">{user?.name}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/50 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase">SYSTEM OPERATIONAL</span>
          </div>
          <button onClick={logout} className="flex items-center gap-2 p-2 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors ml-2 border border-red-100 font-bold text-xs uppercase tracking-wide">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[750px]">

        {/* ── LEFT PANEL: Route Mission Planner (32%) ── */}
        <div className="w-full lg:w-[32%] bg-white rounded-[16px] shadow-sm border border-slate-200 flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Route Intelligence</p>
            <h2 className="text-lg font-bold text-slate-800">Plan a Mission</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Select cargo, origin and destination to generate AI-ranked routes.</p>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <div className="mb-6 space-y-5">
              
              {/* Cargo Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cargo / Mission Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value)}
                    className="w-full border border-slate-200 rounded-[10px] pl-9 pr-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 hover:bg-slate-50 transition-colors appearance-none"
                  >
                    <option value="Emergency Medical">Group 1: Emergency Medical</option>
                    <option value="Perishable Food">Group 2: Perishable Food</option>
                    <option value="HazMat / Fuel">Group 3: HazMat / Fuel</option>
                    <option value="Heavy Machinery">Group 4: Heavy Machinery</option>
                    <option value="General Freight">Group 5: General Freight</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Origin & Destination (Connected) */}
              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-[11px] top-[24px] bottom-[24px] w-0.5 bg-slate-200 z-0"></div>
                
                {/* Swap Button */}
                <button 
                  onClick={handleSwap}
                  className="absolute left-[2px] top-1/2 -translate-y-1/2 w-[20px] h-[20px] bg-white border border-slate-200 rounded-full flex items-center justify-center z-10 hover:border-sky-300 hover:text-sky-600 text-slate-400 transition-colors shadow-sm"
                  title="Swap Origin and Destination"
                >
                  <ArrowDownUp className="w-2.5 h-2.5" />
                </button>

                <div className="space-y-4">
                  {/* Origin */}
                  <div className="relative z-10">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-6">Origin</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                      </div>
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="e.g. Guwahati, Assam"
                        className="w-full border border-slate-200 rounded-[10px] pl-8 pr-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="relative z-10">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-6">Destination</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <div className="w-2 h-2 rounded-full border-[2px] border-slate-800 bg-white"></div>
                      </div>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. Shillong, Meghalaya"
                        className="w-full border border-slate-200 rounded-[10px] pl-8 pr-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* CTA */}
            <div className="mb-6">
              <button
                onClick={() => handleEvaluate()}
                disabled={loading}
                className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl transition-all shadow-[0_2px_8px_-2px_rgba(2,132,199,0.4)] hover:shadow-[0_4px_12px_-2px_rgba(2,132,199,0.5)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:shadow-none hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span>Analyze Routes</span>
                  </>
                )}
              </button>
              
              {loading && loadingStep && (
                <p className="mt-3 text-[11px] text-slate-500 font-medium text-center flex items-center justify-center gap-1.5 animate-pulse">
                  {loadingStep}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* AI Results */}
            {evaluationResult && (
              <div className="flex-1 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  AI Route Recommendations
                </h3>
                <p className="text-[10px] font-medium text-slate-500 mb-4 uppercase tracking-wide">
                  {evaluationResult.origin.split(',')[0]} → {evaluationResult.destination.split(',')[0]}
                </p>
                
                <div className="space-y-3">
                  {evaluationResult.route_options.map((r: any, idx: number) => {
                    const isSelected = activeRouteId === r.route_id;
                    const isSafest = r.is_recommended;
                    const badgeText = isSafest ? 'SAFEST' : idx === 1 ? 'BALANCED' : 'FASTEST';
                    const badgeColor = isSafest ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : idx === 1 ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-100 text-slate-600 border-slate-200';
                    const scoreColor = isSafest ? 'text-emerald-600' : 'text-slate-700';

                    return (
                      <div
                        key={r.route_id}
                        onClick={!isSelected ? () => startLiveTrip(r.route_id, r.coordinates) : undefined}
                        className={`group relative p-3.5 rounded-[12px] border transition-all cursor-pointer overflow-hidden ${
                          isSelected 
                            ? 'bg-sky-50/40 border-sky-300 shadow-[0_2px_12px_-4px_rgba(14,165,233,0.15)]' 
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5'
                        }`}
                      >
                        {isSelected && <div className="absolute top-0 left-0 bottom-0 w-1 bg-sky-500"></div>}
                        
                        <div className="flex justify-between items-start mb-2.5">
                          <span className="font-bold text-xs text-slate-800">
                            {r.route_name.replace(/Alternative Route \d/, `Alternative ${idx}`)}
                          </span>
                          <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-3">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400">Risk</span>
                            <span className={`font-bold ${scoreColor}`}>{r.risk_percentage}%</span>
                          </div>
                          <div className="w-px h-6 bg-slate-200"></div>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400">ETA</span>
                            <span className="font-bold text-slate-700">{r.travel_time_mins}m</span>
                          </div>
                          <div className="w-px h-6 bg-slate-200"></div>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400">Dist</span>
                            <span className="font-bold text-slate-700">{r.distance_km} km</span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-100/50 py-1.5 rounded-lg border border-sky-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                            Live Tracking: TRK-018
                          </div>
                        ) : (
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-center flex items-center justify-center gap-1">
                            Select Route <Navigation className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Map Area (68%) ── */}
        <div className="w-full lg:w-[68%] rounded-[16px] overflow-hidden shadow-sm border border-slate-200 bg-white relative">
          {evaluationResult ? (
            <RouteMap
              routes={evaluationResult.route_options}
              originName={evaluationResult.origin}
              destinationName={evaluationResult.destination}
              truckPosition={truckPosition}
              hazards={activeHazards}
            />
          ) : (
            <div className="w-full h-full min-h-[500px] bg-slate-50/50 flex flex-col items-center justify-center text-slate-500">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                <Navigation className="w-6 h-6 text-slate-300" />
              </div>
              <p className="font-bold text-sm text-slate-700">No Mission Active</p>
              <p className="text-xs mt-1 font-medium text-slate-400">
                Plan a mission on the left to view AI route intelligence
              </p>
            </div>
          )}

          {/* Map Legend (Floats over map) */}
          {evaluationResult && (
             <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-sm px-3 py-2.5 rounded-xl shadow-lg border border-slate-200">
               <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Route Risk</h4>
               <div className="flex flex-col gap-1.5 text-[11px] font-medium text-slate-700">
                 <div className="flex items-center gap-2"><div className="w-4 h-1 rounded-full bg-emerald-500"></div> Safest</div>
                 <div className="flex items-center gap-2"><div className="w-4 h-1 rounded-full bg-sky-500"></div> Balanced</div>
                 <div className="flex items-center gap-2"><div className="w-4 h-1 rounded-full bg-amber-500"></div> Moderate</div>
                 <div className="flex items-center gap-2"><div className="w-4 h-1 border-t-2 border-dashed border-slate-400"></div> Alternative</div>
               </div>
             </div>
          )}
        </div>
      </div>

      {/* ── Citizen Portal Floating Widget ── */}
      <div className="fixed bottom-6 right-6 w-80 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 overflow-hidden z-[9999] transition-all duration-300 ease-in-out">
        <div 
          className={`px-4 py-3 flex justify-between items-center cursor-pointer transition-colors ${showHazardForm ? 'bg-slate-50 border-b border-slate-100' : 'hover:bg-slate-50'}`}
          onClick={() => setShowHazardForm(!showHazardForm)}
        >
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${showHazardForm ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Report Road Hazard</h3>
          </div>
          <span className="text-slate-400">{showHazardForm ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}</span>
        </div>
        
        {showHazardForm && (
          <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-medium text-slate-500 mb-4">Transmit field reports directly to the central dispatch AI to trigger fleet rerouting.</p>
            
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Photo Evidence</label>
              <div className="relative border border-slate-300 border-dashed rounded-lg p-3 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <Camera className="w-5 h-5 text-slate-400" />
                 <span className="text-xs font-medium text-slate-600">{hazardFile ? hazardFile.name : 'Click to upload image'}</span>
                 <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  onChange={(e) => setHazardFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Latitude</label>
                <input 
                  type="text" 
                  value={hazardLatInput}
                  onChange={(e) => setHazardLatInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50"
                  placeholder="Auto"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Longitude</label>
                <input 
                  type="text" 
                  value={hazardLonInput}
                  onChange={(e) => setHazardLonInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50"
                  placeholder="Auto"
                />
              </div>
            </div>
            
            <button
              onClick={handleHazardSubmit}
              disabled={isReportingHazard || loading || !hazardFile || !hazardLatInput || !hazardLonInput}
              className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-50 disabled:hover:bg-amber-500"
            >
              {isReportingHazard ? (
                 <>
                   <svg className="animate-spin h-3.5 w-3.5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                   </svg>
                   Processing
                 </>
              ) : 'Submit Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
