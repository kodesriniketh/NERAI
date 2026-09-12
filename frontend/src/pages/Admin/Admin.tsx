// @ts-nocheck
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline } from 'react-leaflet';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Truck, AlertTriangle, Route, ShieldAlert, Activity, CheckCircle2, Clock, 
  MapPin, Bell, Search, Layers, XCircle, Navigation, Info, Package, LogOut
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import 'leaflet/dist/leaflet.css';

import type { Vehicle, Destination, Hazard } from './mockData';
import { 
  mockVehicles, mockDestinations, mockHazards, kpiMetrics 
} from './mockData';

// Mock Data for Recharts (North East States)
const bottleneckData = [
  { district: 'Guwahati', delayHours: 12, routesAffected: 4 },
  { district: 'Shillong', delayHours: 8, routesAffected: 2 },
  { district: 'Itanagar', delayHours: 5, routesAffected: 3 },
  { district: 'Dimapur', delayHours: 3, routesAffected: 1 },
  { district: 'Imphal', delayHours: 2, routesAffected: 1 },
];

export default function Admin() {
  const { user, logout } = useAuth();
  const [activeHazards, setActiveHazards] = useState(mockHazards.length);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);

  // Future integration point for live backend updates
  useEffect(() => {
    // Polling logic would go here
  }, []);

  const getVehicleColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'on_route': return '#22c55e'; // Green
      case 'delayed': return '#f59e0b'; // Amber
      case 'critical': return '#ef4444'; // Red
      case 'assigned': return '#3b82f6'; // Blue
      default: return '#94a3b8'; // Gray
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F7] font-sans text-slate-900 overflow-x-hidden selection:bg-sky-900/10 p-4 sm:p-6 lg:p-8">
      
      {/* ── TOP HEADER ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="NERA Logo" className="h-8 w-auto mix-blend-multiply" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">NERA Admin</h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">Real-time logistics visibility across Northeast India</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right hidden sm:block mr-2">
            <span className="text-sm font-bold text-slate-800">{user?.name}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">LIVE</span>
          </div>
          <div className="text-xs text-slate-400 font-medium border-l border-slate-300 pl-4 hidden sm:block">
            Last synced: Just now
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors ml-2">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={logout} className="flex items-center gap-2 p-2 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors ml-2 border border-red-100 font-bold text-xs uppercase tracking-wide">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ── TOP KPI STRIP ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 lg:gap-4 mb-8">
        {[
          { label: 'TOTAL FLEET', val: kpiMetrics.totalFleet, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'IN TRANSIT', val: kpiMetrics.inTransit, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', sub: '↑ 4 in last hour' },
          { label: 'ARRIVED', val: kpiMetrics.arrived, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'DELAYED / RISK', val: kpiMetrics.delayed, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'CRITICAL BLOCKS', val: kpiMetrics.criticalBlocks, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', alert: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-[14px] p-4 border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:-translate-y-[1px] transition-transform flex flex-col justify-between relative overflow-hidden group">
            {kpi.alert && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-2xl rounded-full"></div>}
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.border} border`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-400 mb-0.5 tracking-wider uppercase">{kpi.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-extrabold text-slate-800">{kpi.val}</p>
                {kpi.sub && <span className="text-[10px] font-medium text-teal-600">{kpi.sub}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN COMMAND AREA ── */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8 h-auto lg:h-[600px]">
        
        {/* LEFT: LIVE MAP (68%) */}
        <div className="w-full lg:w-[68%] bg-white rounded-[16px] shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
          
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-sm z-10 relative">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-600" /> Live Fleet Movement
              </h2>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Real-time vehicle movement, routes and accessibility status</p>
            </div>
            <div className="flex gap-4 text-[10px] font-bold tracking-wider uppercase">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> On Route</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Delayed</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 border-[2px] border-indigo-500 rounded-full"></span> Hub</span>
            </div>
          </div>

          <div className="flex-1 w-full relative z-0">
            {/* Floating map controls */}
            <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
              <button className="bg-white/90 backdrop-blur shadow-md border border-slate-200 p-2 rounded-lg text-slate-600 hover:text-sky-600 transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <button className="bg-white/90 backdrop-blur shadow-md border border-slate-200 p-2 rounded-lg text-slate-600 hover:text-sky-600 transition-colors">
                <Layers className="w-4 h-4" />
              </button>
            </div>

            <MapContainer 
              center={[25.8445, 92.5362]} // Centered slightly east of Guwahati to frame NE
              zoom={7} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false} // Hidden to use custom or minimalist layout
            >
              <TileLayer
                url={import.meta.env.VITE_CARTO_TILE_URL || "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              
              {/* Render Routes for selected vehicle or all active vehicles */}
              {mockVehicles.map((truck) => {
                const isSelected = selectedVehicle?.id === truck.id;
                const isHovered = hoveredRoute === truck.id;
                if (!truck.routeCoords) return null;
                
                // Only show route if selected, hovered, or it's a critical truck (to avoid clutter)
                if (isSelected || isHovered || truck.status === 'critical') {
                  const color = truck.routeStatus === 'blocked' ? '#ef4444' : truck.routeStatus === 'slow' ? '#f59e0b' : '#22c55e';
                  return (
                    <Polyline 
                      key={`route-${truck.id}`} 
                      positions={truck.routeCoords} 
                      color={color}
                      weight={isSelected ? 4 : 2}
                      opacity={isSelected ? 0.9 : 0.6}
                      dashArray={truck.routeStatus !== 'clear' ? "5, 10" : undefined}
                    />
                  );
                }
                return null;
              })}

              {/* Render Destinations */}
              {mockDestinations.map((dest) => (
                <CircleMarker 
                  key={dest.id}
                  center={[dest.latitude, dest.longitude]}
                  radius={dest.priority === 'CRITICAL' ? 10 : 8}
                  fillColor="transparent"
                  color="#4f46e5"
                  weight={3}
                  eventHandlers={{
                    click: () => {
                      setSelectedDestination(dest);
                      setSelectedVehicle(null);
                    }
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1} className="font-sans border-none shadow-lg rounded-lg">
                    <div className="px-1">
                      <p className="font-bold text-slate-800 text-xs mb-1">{dest.name}</p>
                      <p className="text-[10px] text-slate-500">{dest.arrivedTrucks} / {dest.requiredTrucks} trucks arrived</p>
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}

              {/* Render Hazards */}
              {mockHazards.map((hazard) => (
                <CircleMarker 
                  key={hazard.id}
                  center={[hazard.latitude, hazard.longitude]}
                  radius={6}
                  fillColor={hazard.severity === 'critical' ? '#ef4444' : '#f59e0b'}
                  color="#ffffff"
                  weight={2}
                  fillOpacity={1}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                    <span className="font-bold text-red-600 text-xs">⚠️ {hazard.type}</span>
                  </Tooltip>
                </CircleMarker>
              ))}

              {/* Render Trucks */}
              {mockVehicles.map((truck) => {
                const color = getVehicleColor(truck.status);
                const isSelected = selectedVehicle?.id === truck.id;
                return (
                  <CircleMarker 
                    key={truck.id}
                    center={[truck.latitude, truck.longitude]}
                    radius={isSelected ? 7 : 5}
                    fillColor={color}
                    color="#ffffff"
                    weight={isSelected ? 2 : 1.5}
                    fillOpacity={1}
                    eventHandlers={{
                      click: () => {
                        setSelectedVehicle(truck);
                        setSelectedDestination(null);
                      },
                      mouseover: () => setHoveredRoute(truck.id),
                      mouseout: () => setHoveredRoute(null)
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={1} className="font-sans border-none shadow-lg rounded-lg p-0">
                      <div className="p-2 min-w-[120px]">
                        <p className="font-bold text-slate-800 text-xs">{truck.id}</p>
                        <p className="text-[10px] font-medium" style={{ color }}>{truck.status.replace('_', ' ').toUpperCase()}</p>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          {/* Floating Vehicle Detail Panel (Inside Map) */}
          {selectedVehicle && (
            <div className="absolute bottom-4 left-4 z-[400] w-72 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-800 text-sm">{selectedVehicle.id}</span>
                </div>
                <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <div>
                  <p className="text-slate-400 mb-0.5">Route</p>
                  <p className="font-semibold text-slate-700">{selectedVehicle.origin} <span className="text-slate-300 mx-1">→</span> {selectedVehicle.destination}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-slate-400 mb-0.5">ETA</p>
                    <p className="font-semibold text-slate-700">{selectedVehicle.eta}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-0.5">Progress</p>
                    <p className="font-semibold text-slate-700">{selectedVehicle.progress}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5">Cargo</p>
                  <p className="font-medium text-slate-600 flex items-center gap-1.5"><Package className="w-3 h-3 text-slate-400" /> {selectedVehicle.cargo}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Updated {selectedVehicle.lastUpdated}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${getVehicleColor(selectedVehicle.status)}15`, color: getVehicleColor(selectedVehicle.status) }}>
                    {selectedVehicle.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: MISSION STATUS PANEL (32%) */}
        <div className="w-full lg:w-[32%] bg-white rounded-[16px] shadow-sm border border-slate-200 flex flex-col h-[400px] lg:h-full overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-bold text-slate-800">Priority Destinations</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {mockDestinations.map(dest => {
              const progress = (dest.arrivedTrucks / dest.requiredTrucks) * 100;
              const isSelected = selectedDestination?.id === dest.id;
              
              return (
                <div 
                  key={dest.id}
                  onClick={() => { setSelectedDestination(dest); setSelectedVehicle(null); }}
                  className={`p-4 mx-2 my-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected ? 'border-sky-300 bg-sky-50/30 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.1)]' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-sm truncate pr-2">{dest.name}</h3>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider shrink-0 ${
                      dest.priority === 'CRITICAL' ? 'bg-red-50 text-red-600' : dest.priority === 'HIGH' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {dest.priority}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                    <span>{dest.arrivedTrucks} / {dest.requiredTrucks} trucks reached</span>
                    <span className="text-slate-400">{Math.round(progress)}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2.5">
                    <div 
                      className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex gap-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {progress >= 100 ? (
                      <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>
                    ) : (
                      <>
                        <span className="text-slate-500">{dest.enRouteTrucks} en route</span>
                        <span>•</span>
                        <span className={dest.requiredTrucks - dest.arrivedTrucks > 0 ? 'text-amber-600' : ''}>
                          {Math.max(0, dest.requiredTrucks - dest.arrivedTrucks)} needed
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── BOTTOM SECTION: LOGISTICS REQUIREMENTS & SECONDARY ANALYTICS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Logistics Table (span 2) */}
        <div className="lg:col-span-2 bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-bold text-slate-800">Destination Logistics Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                  <th className="px-5 py-3 font-semibold">Destination</th>
                  <th className="px-5 py-3 font-semibold">State</th>
                  <th className="px-5 py-3 font-semibold">Priority</th>
                  <th className="px-5 py-3 font-semibold text-center">Required</th>
                  <th className="px-5 py-3 font-semibold text-center">Arrived</th>
                  <th className="px-5 py-3 font-semibold text-center">En Route</th>
                  <th className="px-5 py-3 font-semibold text-center">Remaining</th>
                  <th className="px-5 py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium text-slate-700">
                {mockDestinations.map(dest => {
                  const remaining = Math.max(0, dest.requiredTrucks - dest.arrivedTrucks);
                  const isComplete = remaining === 0;
                  return (
                    <tr key={dest.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-bold text-slate-800">{dest.name}</td>
                      <td className="px-5 py-3 text-slate-500">{dest.state}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider ${
                          dest.priority === 'CRITICAL' ? 'text-red-600' : dest.priority === 'HIGH' ? 'text-amber-600' : 'text-slate-400'
                        }`}>{dest.priority}</span>
                      </td>
                      <td className="px-5 py-3 text-center">{dest.requiredTrucks}</td>
                      <td className="px-5 py-3 text-center text-emerald-600 font-bold">{dest.arrivedTrucks}</td>
                      <td className="px-5 py-3 text-center text-sky-600 font-bold">{dest.enRouteTrucks}</td>
                      <td className="px-5 py-3 text-center font-bold">{remaining}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-[9px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${
                          isComplete ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-sky-50 text-sky-600 border border-sky-100'
                        }`}>
                          {isComplete ? 'Complete' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Secondary Analytics Chart */}
        <div className="lg:col-span-1 bg-white rounded-[16px] shadow-sm border border-slate-200 flex flex-col min-h-[300px]">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Logistics Bottlenecks</h2>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Impact of hazards by district (Hours)</p>
          </div>
          <div className="flex-1 p-5 pt-6 w-full">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bottleneckData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="district" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px -4px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 500 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '10px', fontWeight: 600 }} />
                <Bar dataKey="delayHours" name="Delay (Hrs)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="routesAffected" name="Routes" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
      
    </div>
  );
}
