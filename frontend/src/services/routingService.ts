// @ts-nocheck
const OSRM_BASE_URL = import.meta.env.VITE_OSRM_BASE_URL || 'https://router.project-osrm.org/route/v1/driving';

// Cache identical routing requests in session
const routingCache = new Map<string, any>();

class RoutingService {
  async fetchOSRMRoutes(
    origin: [number, number],
    dest: [number, number]
  ): Promise<{ route_id: string; route_name: string; travel_time_mins: number; distance_km: number; coordinates: [number, number][]; full_coordinates: [number, number][] }[]> {
    const [oLat, oLon] = origin;
    const [dLat, dLon] = dest;

    const cacheKey = `${oLat},${oLon}-${dLat},${dLon}`;
    if (routingCache.has(cacheKey)) {
      return routingCache.get(cacheKey)!;
    }

    const coords = `${oLon},${oLat};${dLon},${dLat}`;
    const url = `${OSRM_BASE_URL}/${coords}?geometries=geojson&overview=full&alternatives=3`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error('Routing service temporarily unavailable');
      }

      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) {
        throw new Error('No drivable routes found between these locations.');
      }

      const osrmResults = data.routes.map((r: any) => {
        const allCoords = (r.geometry.coordinates as [number, number][]).map(
          ([lon, lat]) => [lat, lon] as [number, number]
        );
        return {
          duration: r.duration,
          distance: r.distance,
          coordinates: allCoords,
          full_coordinates: allCoords,
        };
      });

      const routes: any[] = [];
      const names = ['Primary Route (Fastest)', 'Alternative Route 1', 'Alternative Route 2'];

      osrmResults.forEach((r: any, idx: number) => {
        const travel_time_mins = Math.round(r.duration / 60);
        const distance_km = parseFloat((r.distance / 1000).toFixed(2));

        // Deduplicate
        const isDuplicate = routes.some(existing =>
          Math.abs(existing.distance_km - distance_km) < 0.2 &&
          Math.abs(existing.travel_time_mins - travel_time_mins) <= 1
        );

        if (!isDuplicate) {
          routes.push({
            route_id: `osrm_route_${idx + 1}`,
            route_name: names[routes.length] || `Alternative ${routes.length}`,
            travel_time_mins,
            distance_km,
            coordinates: r.coordinates,
            full_coordinates: r.full_coordinates,
          });
        }
      });

      // DEMO FALLBACK: If OSRM is being stingy and only returns 1 route (very common mid-journey),
      // synthetically generate an alternative "bypass" route so the AI has something to switch to.
      if (routes.length === 1 && routes[0].coordinates.length > 20) {
        const baseCoords = routes[0].coordinates;
        // Create a fake detour by shifting the middle segment of the route to safely avoid the 0.08 degree hazard radius
        const syntheticCoords = baseCoords.map((coord, idx) => {
          const progress = idx / baseCoords.length;
          if (progress > 0.15 && progress < 0.85) {
            // Shift latitude by up to ~0.09 degrees (approx 10km) south/north to clear the hazard radius
            const shift = Math.sin((progress - 0.15) * Math.PI * 1.4) * 0.09;
            return [coord[0] - shift, coord[1] + (shift / 3)] as [number, number];
          }
          return coord;
        });

        routes.push({
          route_id: `synthetic_bypass`,
          route_name: 'AI Emergency Bypass',
          travel_time_mins: routes[0].travel_time_mins + 25, // Add a 25 min penalty
          distance_km: routes[0].distance_km + 18,
          coordinates: syntheticCoords,
          full_coordinates: syntheticCoords,
        });
      }

      routingCache.set(cacheKey, routes);
      return routes;

    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Routing request timed out. Please try again.');
      }
      throw err;
    }
  }
}

export const routingService = new RoutingService();
