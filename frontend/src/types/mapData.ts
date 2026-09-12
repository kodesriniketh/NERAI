export interface Vehicle {
  id: string;
  driverName: string;
  location: [number, number]; // [lat, lon]
  status: 'assigned' | 'on_route' | 'delayed' | 'critical' | 'available';
  type: string;
  eta: string;
  cargo: string;
}

export interface Destination {
  id: string;
  name: string;
  location: [number, number];
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  inventoryNeeds: string[];
}

export interface Hazard {
  id: string;
  type: string;
  location: [number, number];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'UNDER REVIEW' | 'RESOLVED';
  description: string;
  reportedAt: string;
  reportedBy: string;
}

export interface Route {
  id: string;
  name: string;
  origin: [number, number];
  destination: [number, number];
  coordinates: [number, number][];
  travelTimeMins: number;
  distanceKm: number;
  usable: boolean;
  riskPercentage?: number;
}

export interface DisasterRouteState {
  hazardId: string;
  routeId: string;
  impactLevel: 'BLOCKED' | 'RESTRICTED' | 'CAUTION' | 'OPEN';
}
