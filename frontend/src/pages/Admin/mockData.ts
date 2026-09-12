export interface Vehicle {
  id: string;
  type: string;
  latitude: number;
  longitude: number;
  origin: string;
  destination: string;
  destinationId: string;
  status: 'on_route' | 'delayed' | 'critical' | 'assigned' | 'offline';
  routeStatus: 'clear' | 'slow' | 'blocked';
  eta: string;
  progress: number;
  speed: number;
  cargo: string;
  missionId: string;
  lastUpdated: string;
  routeCoords?: [number, number][]; // Pre-planned or traveled route
}

export interface Destination {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  requiredTrucks: number;
  arrivedTrucks: number;
  enRouteTrucks: number;
  delayedTrucks: number;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
}

export interface Hazard {
  id: string;
  type: string;
  latitude: number;
  longitude: number;
  severity: 'critical' | 'warning';
  routeAffected: string;
  status: 'verified' | 'reported';
}

export const mockDestinations: Destination[] = [
  {
    id: 'DST-01',
    name: 'Tawang Relief Hub',
    state: 'Arunachal Pradesh',
    latitude: 27.586,
    longitude: 91.859,
    requiredTrucks: 12,
    arrivedTrucks: 7,
    enRouteTrucks: 3,
    delayedTrucks: 1,
    priority: 'HIGH'
  },
  {
    id: 'DST-02',
    name: 'Shillong Medical Depot',
    state: 'Meghalaya',
    latitude: 25.578,
    longitude: 91.893,
    requiredTrucks: 8,
    arrivedTrucks: 8,
    enRouteTrucks: 0,
    delayedTrucks: 0,
    priority: 'NORMAL'
  },
  {
    id: 'DST-03',
    name: 'Silchar Supply Point',
    state: 'Assam',
    latitude: 24.833,
    longitude: 92.778,
    requiredTrucks: 10,
    arrivedTrucks: 4,
    enRouteTrucks: 4,
    delayedTrucks: 1,
    priority: 'HIGH'
  },
  {
    id: 'DST-04',
    name: 'Imphal Logistics Base',
    state: 'Manipur',
    latitude: 24.817,
    longitude: 93.936,
    requiredTrucks: 15,
    arrivedTrucks: 2,
    enRouteTrucks: 9,
    delayedTrucks: 4,
    priority: 'CRITICAL'
  }
];

export const mockVehicles: Vehicle[] = [
  {
    id: 'TRK-018',
    type: 'Heavy Supply Truck',
    latitude: 26.544,
    longitude: 91.836,
    origin: 'Guwahati Base',
    destination: 'Tawang Relief Hub',
    destinationId: 'DST-01',
    status: 'on_route',
    routeStatus: 'clear',
    eta: '2h 14m',
    progress: 63,
    speed: 42,
    cargo: 'Medical Supplies & Blankets',
    missionId: 'MIS-104',
    lastUpdated: '38 sec ago',
    routeCoords: [[26.144, 91.736], [26.544, 91.836], [27.084, 91.859], [27.586, 91.859]]
  },
  {
    id: 'TRK-042',
    type: 'Refrigerated Carrier',
    latitude: 25.321,
    longitude: 92.100,
    origin: 'Guwahati Base',
    destination: 'Silchar Supply Point',
    destinationId: 'DST-03',
    status: 'delayed',
    routeStatus: 'slow',
    eta: '4h 05m',
    progress: 30,
    speed: 15,
    cargo: 'Perishable Food Rations',
    missionId: 'MIS-105',
    lastUpdated: '1 min ago',
    routeCoords: [[26.144, 91.736], [25.321, 92.100], [24.833, 92.778]]
  },
  {
    id: 'TRK-099',
    type: 'Engineering Convoy',
    latitude: 25.217,
    longitude: 93.136,
    origin: 'Dimapur Center',
    destination: 'Imphal Logistics Base',
    destinationId: 'DST-04',
    status: 'critical',
    routeStatus: 'blocked',
    eta: 'Unknown',
    progress: 45,
    speed: 0,
    cargo: 'Bridge Repair Equipment',
    missionId: 'MIS-108',
    lastUpdated: '5 min ago',
    routeCoords: [[25.862, 93.738], [25.217, 93.136], [24.817, 93.936]]
  },
  {
    id: 'TRK-105',
    type: 'Light Cargo Van',
    latitude: 25.478,
    longitude: 91.793,
    origin: 'Guwahati Base',
    destination: 'Shillong Medical Depot',
    destinationId: 'DST-02',
    status: 'on_route',
    routeStatus: 'clear',
    eta: '30m',
    progress: 85,
    speed: 55,
    cargo: 'Vaccines',
    missionId: 'MIS-102',
    lastUpdated: '12 sec ago',
    routeCoords: [[26.144, 91.736], [25.478, 91.793], [25.578, 91.893]]
  }
];

export const mockHazards: Hazard[] = [
  {
    id: 'HZ-04',
    type: 'Landslide',
    latitude: 25.217,
    longitude: 93.150,
    severity: 'critical',
    routeAffected: 'Dimapur - Imphal Highway',
    status: 'verified'
  },
  {
    id: 'HZ-09',
    type: 'Bridge Washout',
    latitude: 26.884,
    longitude: 92.605,
    severity: 'critical',
    routeAffected: 'Tezpur Route',
    status: 'verified'
  },
  {
    id: 'HZ-12',
    type: 'Heavy Flooding',
    latitude: 25.321,
    longitude: 92.150,
    severity: 'warning',
    routeAffected: 'Shillong - Silchar Route',
    status: 'reported'
  }
];

export const kpiMetrics = {
  totalFleet: 48,
  inTransit: 18,
  arrived: 21,
  delayed: 6,
  criticalBlocks: 3
};
