// @ts-nocheck
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip, Polyline } from 'react-leaflet';
import { 
  AlertCircle, CheckCircle, Clock, MapPin, Activity, 
  ShieldAlert, AlertTriangle, XCircle, Search, Layers, ChevronRight, Navigation, LogOut
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import 'leaflet/dist/leaflet.css';
import { initialMockIncidents } from './mockData';
import type { MockIncident } from './mockData';

// North East India bounds
const NE_BOUNDS: [[number, number], [number, number]] = [
  [21.5, 89.5], // South-West
  [29.5, 97.5]  // North-East
];

export default function Disaster() {
  const { user, logout } = useAuth();
  const [incidents, setIncidents] = useState<MockIncident[]>(initialMockIncidents);
  const [backendIncidents, setBackendIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<MockIncident | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [filter, setFilter] = useState('All');

  // Fetch real backend incidents reported from Field/Transport pages
  const fetchBackendIncidents = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/disaster/incidents');
      if (res.ok) {
        const data = await res.json();
        setBackendIncidents(data);
      }
    } catch (error) {
      console.error("Failed to fetch backend incidents", error);
    }
  };

  useEffect(() => {
    fetchBackendIncidents();
    const interval = setInterval(fetchBackendIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  // Merge mock and backend incidents
  const allIncidents = [
    ...incidents,
    ...backendIncidents.map(b => ({
      id: b.id,
      type: b.description || "Field Report",
      latitude: b.lat,
      longitude: b.lon,
      state: "Unknown",
      locationName: "Field Location",
      severity: b.severity.toUpperCase() || "HIGH",
      verificationStatus: b.status.toUpperCase() || "UNDER REVIEW",
      incidentStatus: b.status === 'Resolved' ? 'resolved' : 'active',
      roadStatus: b.status === 'Resolved' ? 'OPEN' : 'RESTRICTED',
      affectedRouteName: "Local Route",
      reportedBy: "Field App",
      reportedAt: new Date(b.reported_at).toLocaleTimeString(),
      description: "User reported hazard from field app.",
      affectedRouteCoords: [],
      isBackend: true
    } as MockIncident))
  ];

  const filteredIncidents = allIncidents.filter(inc => {
    if (filter === 'Resolved') return inc.incidentStatus === 'resolved';
    if (inc.incidentStatus === 'resolved') return false; // Hide resolved unless filter is active
    if (filter === 'All') return true;
    if (filter === 'Critical') return inc.severity === 'CRITICAL';
    if (filter === 'Blocked') return inc.roadStatus === 'BLOCKED';
    if (filter === 'Under Review') return inc.verificationStatus === 'UNDER REVIEW';
    return true;
  });

  const activeCount = allIncidents.filter(i => i.incidentStatus === 'active').length;
  const criticalCount = allIncidents.filter(i => i.severity === 'CRITICAL' && i.incidentStatus === 'active').length;
  const blockedCount = allIncidents.filter(i => i.roadStatus === 'BLOCKED' && i.incidentStatus === 'active').length;
  const resolvedCount = allIncidents.filter(i => i.incidentStatus === 'resolved').length;

  const getMarkerColor = (inc: MockIncident) => {
    if (inc.incidentStatus === 'resolved') return '#22c55e'; // Green
    if (inc.roadStatus === 'BLOCKED') return '#ef4444'; // Red
    if (inc.roadStatus === 'RESTRICTED') return '#f59e0b'; // Amber
    if (inc.severity === 'LOW') return '#eab308'; // Yellow
    return '#94a3b8'; // Gray unverified
  };

  const getRouteColor = (status: string) => {
    switch (status) {
      case 'BLOCKED': return '#ef4444'; // Red
      case 'RESTRICTED':
      case 'PARTIALLY OPEN': return '#f59e0b'; // Amber
      case 'CAUTION': return '#eab308'; // Yellow
      case 'OPEN': return '#22c55e'; // Green
      default: return '#94a3b8';
    }
  };

  const handleResolveConfirm = async () => {
    if (!selectedIncident) return;
    
    setResolvingId(selectedIncident.id);
    
    // If it's a backend incident, call the real API
    if ((selectedIncident as any).isBackend) {
      try {
        await fetch(`http://localhost:8000/api/v1/disaster/incidents/${selectedIncident.id}/resolve`, {
          method: 'PATCH'
        });
        await fetchBackendIncidents();
      } catch (e) {
        console.error(e);
      }
    } else {
      // Update mock local state
      setIncidents(prev => prev.map(inc => 
        inc.id === selectedIncident.id 
          ? { ...inc, incidentStatus: 'resolved', roadStatus: 'OPEN', verificationStatus: 'VERIFIED' } 
          : inc
      ));
    }

    // Show temporary success toast (simplified)
    alert(`Success: Incident ${selectedIncident.id} resolved. Route reopened for logistics movement.`);
    
    setResolvingId(null);
    setShowResolveModal(false);
    setSelectedIncident(null);
    setResolveNote('');
  };

  return (
    <div className="min-h-screen bg-[#F6F8F7] font-sans text-slate-900 overflow-x-hidden selection:bg-red-900/10 p-4 sm:p-6 lg:p-8">
      
      {/* ── TOP HEADER ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="NERA Logo" className="h-8 w-auto mix-blend-multiply" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Disaster Management Command</h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">Incident verification, road accessibility and emergency response</p>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex">
          <div className="flex flex-col text-right mr-2">
            <span className="text-sm font-bold text-slate-800">{user?.name}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50/50 rounded-full border border-red-100">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-wider text-red-700 uppercase">LIVE OPERATIONS</span>
          </div>
          <div className="text-xs text-slate-400 font-medium border-l border-slate-300 pl-4">
            Active Hazards: {activeCount}
          </div>
          <button onClick={logout} className="flex items-center gap-2 p-2 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors ml-2 border border-red-100 font-bold text-xs uppercase tracking-wide">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ── TOP KPI STRIP ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {[
          { label: 'ACTIVE HAZARDS', val: activeCount, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: AlertTriangle },
          { label: 'CRITICAL', val: criticalCount, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: ShieldAlert },
          { label: 'ROUTES BLOCKED', val: blockedCount, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: XCircle },
          { label: 'RESOLVED TODAY', val: resolvedCount, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-[14px] p-4 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.border} border`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-0.5 tracking-wider uppercase">{kpi.label}</p>
              <p className="text-2xl font-extrabold text-slate-800">{kpi.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN COMMAND AREA ── */}
      <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[600px] mb-8">
        
        {/* LEFT: LIVE MAP (68%) */}
        <div className="w-full lg:w-[68%] bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden relative">
          
          {/* Floating Map Legend */}
          <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-sm px-3 py-2.5 rounded-xl shadow-lg border border-slate-200">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Incident Status</h4>
            <div className="flex flex-col gap-1.5 text-[11px] font-medium text-slate-700">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Critical / Blocked</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Restricted</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div> Under Review</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Resolved</div>
            </div>
          </div>

          <MapContainer 
            bounds={NE_BOUNDS} // Automatically fits Northeast India
            style={{ height: '100%', width: '100%', minHeight: '500px' }}
            zoomControl={false}
          >
            <TileLayer
              url={import.meta.env.VITE_CARTO_TILE_URL || "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            
            {/* Render Affected Routes */}
            {allIncidents.map((inc) => {
              if (!inc.affectedRouteCoords || inc.affectedRouteCoords.length === 0) return null;
              const color = getRouteColor(inc.roadStatus);
              const isSelected = selectedIncident?.id === inc.id;
              
              return (
                <Polyline 
                  key={`route-${inc.id}`} 
                  positions={inc.affectedRouteCoords} 
                  color={color}
                  weight={isSelected ? 6 : 4}
                  opacity={0.8}
                  dashArray={inc.roadStatus === 'BLOCKED' ? "6, 8" : undefined}
                />
              );
            })}

            {/* Render Hazards */}
            {filteredIncidents.map((inc) => {
              const color = getMarkerColor(inc);
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <CircleMarker 
                  key={inc.id}
                  center={[inc.latitude, inc.longitude]}
                  radius={isSelected ? 10 : 8}
                  fillColor={color}
                  color="#ffffff"
                  weight={isSelected ? 2 : 1.5}
                  fillOpacity={1}
                  eventHandlers={{
                    click: () => setSelectedIncident(inc)
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1} className="font-sans border-none shadow-lg rounded-lg p-0">
                    <div className="p-2 min-w-[120px]">
                      <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                         {inc.incidentStatus === 'resolved' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-red-500" />}
                         {inc.id}
                      </p>
                      <p className="text-[10px] font-medium mt-0.5 text-slate-500">{inc.type}</p>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* RIGHT: INCIDENT COMMAND PANEL (32%) */}
        <div className="w-full lg:w-[32%] bg-white rounded-[16px] shadow-sm border border-slate-200 flex flex-col h-[500px] lg:h-full overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-bold text-slate-800">Incident Command</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {!selectedIncident ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <MapPin className="w-10 h-10 text-slate-200 mb-3" />
                <p className="font-medium text-sm text-slate-600">No Incident Selected</p>
                <p className="text-[11px] mt-1 text-slate-400 px-4">Select an incident from the map or incident list to review details and take action.</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedIncident.id}</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{selectedIncident.type}</p>
                  </div>
                  {selectedIncident.incidentStatus === 'resolved' && (
                    <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
                      Resolved
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2 mb-6">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-slate-600">{selectedIncident.locationName}, {selectedIncident.state}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Severity</p>
                    <p className={`text-xs font-bold ${
                      selectedIncident.severity === 'CRITICAL' ? 'text-red-600' :
                      selectedIncident.severity === 'HIGH' ? 'text-orange-600' : 'text-amber-600'
                    }`}>{selectedIncident.severity}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Verification</p>
                    <p className="text-xs font-bold text-slate-700">{selectedIncident.verificationStatus}</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Road Accessibility</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedIncident.roadStatus === 'BLOCKED' ? 'bg-red-500' :
                        selectedIncident.roadStatus === 'RESTRICTED' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></div>
                      <p className="text-sm font-bold text-slate-800">{selectedIncident.roadStatus}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Description</p>
                    <p className="text-slate-600 leading-relaxed">{selectedIncident.description}</p>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Reported By</p>
                      <p className="text-xs font-medium text-slate-700">{selectedIncident.reportedBy}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Reported At</p>
                      <p className="text-xs font-medium text-slate-700">{selectedIncident.reportedAt}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedIncident.incidentStatus === 'active' && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    {selectedIncident.verificationStatus !== 'VERIFIED' && (
                      <div className="grid grid-cols-2 gap-3">
                        <button className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                          Verify Incident
                        </button>
                        <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition-colors">
                          Reject
                        </button>
                      </div>
                    )}
                    
                    {selectedIncident.verificationStatus === 'VERIFIED' && (
                      <button 
                        onClick={() => setShowResolveModal(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-[0_2px_8px_-2px_rgba(5,150,105,0.4)] flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Hazard Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── INCIDENT / HAZARD TABLE ── */}
      <div className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-bold text-slate-800">Incident Registry</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['All', 'Critical', 'Blocked', 'Under Review', 'Resolved'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors ${
                  filter === f 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <th className="px-5 py-3 font-semibold">Incident ID</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold text-center">Severity</th>
                <th className="px-5 py-3 font-semibold text-center">Verification</th>
                <th className="px-5 py-3 font-semibold text-center">Road Status</th>
                <th className="px-5 py-3 font-semibold text-right">Reported</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-slate-700">
              {filteredIncidents.map(inc => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <tr 
                    key={inc.id} 
                    onClick={() => setSelectedIncident(inc)}
                    className={`border-b border-slate-100 cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-5 py-3 font-bold text-slate-900">{inc.id}</td>
                    <td className="px-5 py-3">{inc.type}</td>
                    <td className="px-5 py-3 text-slate-500">{inc.locationName}, {inc.state}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                        inc.severity === 'CRITICAL' ? 'text-red-600 bg-red-50' : 
                        inc.severity === 'HIGH' ? 'text-orange-600 bg-orange-50' : 'text-amber-600 bg-amber-50'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">{inc.verificationStatus}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${
                        inc.roadStatus === 'BLOCKED' ? 'border-red-200 text-red-600 bg-red-50' :
                        inc.roadStatus === 'RESTRICTED' ? 'border-amber-200 text-amber-600 bg-amber-50' :
                        inc.roadStatus === 'OPEN' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' :
                        'border-slate-200 text-slate-600 bg-slate-50'
                      }`}>
                        {inc.roadStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-400">{inc.reportedAt}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredIncidents.length === 0 && (
             <div className="p-8 text-center text-sm font-medium text-slate-500">
                No incidents match the current filter.
             </div>
          )}
        </div>
      </div>

      {/* ── RESOLVE HAZARD MODAL ── */}
      {showResolveModal && selectedIncident && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-emerald-50/50">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Resolve Incident {selectedIncident.id}?</h2>
              <p className="text-sm text-slate-600 mt-1">Confirm that the hazard has been cleared and the affected route is safe for normal use.</p>
            </div>
            
            <div className="p-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Resolution Note (Optional)</label>
              <textarea 
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="e.g. Debris removed and road cleared by response team."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 min-h-[80px]"
              />

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                 <span className="text-xs font-bold text-slate-600">New Road Status</span>
                 <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-emerald-100 text-emerald-700 rounded border border-emerald-200">OPEN</span>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-3 bg-slate-50">
              <button 
                onClick={() => setShowResolveModal(false)}
                className="flex-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleResolveConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-[0_2px_8px_-2px_rgba(5,150,105,0.4)]"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
