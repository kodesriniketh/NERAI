export interface MockIncident {
  id: string;
  type: string;
  latitude: number;
  longitude: number;
  state: string;
  locationName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  verificationStatus: 'VERIFIED' | 'UNDER REVIEW' | 'REPORTED' | 'REJECTED';
  incidentStatus: 'active' | 'resolved';
  roadStatus: 'BLOCKED' | 'RESTRICTED' | 'PARTIALLY OPEN' | 'CAUTION' | 'OPEN';
  affectedRouteName: string;
  reportedBy: string;
  reportedAt: string;
  description: string;
  affectedRouteCoords: [number, number][]; 
}

export const initialMockIncidents: MockIncident[] = [
  {
    id: "HZ-001",
    type: "Landslide",
    latitude: 27.5600,
    longitude: 91.8650,
    state: "Arunachal Pradesh",
    locationName: "near Tawang",
    severity: "CRITICAL",
    verificationStatus: "VERIFIED",
    incidentStatus: "active",
    roadStatus: "BLOCKED",
    affectedRouteName: "Tawang Regional Access Road",
    reportedBy: "Field Official",
    reportedAt: "18 min ago",
    description: "Heavy landslide debris covering both lanes. Complete blockage of mountain pass.",
    affectedRouteCoords: [
      [27.4800, 91.8900],
      [27.5200, 91.8700],
      [27.5600, 91.8650], // Hazard point
      [27.5860, 91.8590]
    ]
  },
  {
    id: "HZ-002",
    type: "Flooded Road",
    latitude: 24.8500,
    longitude: 92.7800,
    state: "Assam",
    locationName: "near Silchar",
    severity: "HIGH",
    verificationStatus: "UNDER REVIEW",
    incidentStatus: "active",
    roadStatus: "RESTRICTED",
    affectedRouteName: "Silchar Valley Bypass",
    reportedBy: "Citizen Portal",
    reportedAt: "32 min ago",
    description: "Waterlogging exceeding 2 feet. Heavy vehicles only, light vehicles discouraged.",
    affectedRouteCoords: [
      [24.8100, 92.7500],
      [24.8330, 92.7780],
      [24.8500, 92.7800], // Hazard point
      [24.8800, 92.7900]
    ]
  },
  {
    id: "HZ-003",
    type: "Road Damage",
    latitude: 25.5900,
    longitude: 91.8800,
    state: "Meghalaya",
    locationName: "near Shillong",
    severity: "MEDIUM",
    verificationStatus: "VERIFIED",
    incidentStatus: "active",
    roadStatus: "PARTIALLY OPEN",
    affectedRouteName: "Shillong Peak Route",
    reportedBy: "Transport Manager",
    reportedAt: "1h 14m ago",
    description: "Severe potholes and collapsed shoulder on downhill gradient.",
    affectedRouteCoords: [
      [25.5500, 91.9100],
      [25.5780, 91.8930],
      [25.5900, 91.8800], // Hazard point
      [25.6100, 91.8700]
    ]
  },
  {
    id: "HZ-004",
    type: "Fallen Tree / Debris",
    latitude: 25.6800,
    longitude: 94.1000,
    state: "Nagaland",
    locationName: "near Kohima",
    severity: "LOW",
    verificationStatus: "REPORTED",
    incidentStatus: "active",
    roadStatus: "CAUTION",
    affectedRouteName: "Kohima Approach Road",
    reportedBy: "Citizen Portal",
    reportedAt: "5 min ago",
    description: "Tree branches partially blocking left lane after heavy wind.",
    affectedRouteCoords: [
      [25.6500, 94.1300],
      [25.6740, 94.1100],
      [25.6800, 94.1000], // Hazard point
      [25.7000, 94.0800]
    ]
  },
  {
    id: "HZ-005",
    type: "Bridge Structural Issue",
    latitude: 27.4728,
    longitude: 94.9120,
    state: "Assam",
    locationName: "Dibrugarh Bridge",
    severity: "CRITICAL",
    verificationStatus: "VERIFIED",
    incidentStatus: "resolved",
    roadStatus: "OPEN",
    affectedRouteName: "Brahmaputra Crossing",
    reportedBy: "Engineering Convoy",
    reportedAt: "4h ago",
    description: "Initial reports of structural flex. Engineering team evaluated and deemed it safe for heavy machinery crossing.",
    affectedRouteCoords: [
      [27.4500, 94.9000],
      [27.4728, 94.9120], // Hazard point
      [27.4900, 94.9300]
    ]
  }
];
