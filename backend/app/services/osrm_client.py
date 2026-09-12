import httpx
import math

async def fetch_osrm_routes(origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float):
    coords = f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
    url = f"http://router.project-osrm.org/route/v1/driving/{coords}?geometries=geojson&overview=full&alternatives=3"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        
    if "routes" not in data or not data["routes"]:
        raise ValueError("No routes found from OSRM.")
        
    osrm_results = data["routes"]
    routes = []
    names = ['Primary Route (Fastest)', 'Alternative Route 1', 'Alternative Route 2']
    
    for idx, r in enumerate(osrm_results):
        travel_time_mins = round(r["duration"] / 60)
        distance_km = round(r["distance"] / 1000, 2)
        
        # OSRM returns coordinates as [lon, lat], we want [lat, lon]
        full_coords = [[c[1], c[0]] for c in r["geometry"]["coordinates"]]
        
        # Use full coordinates for highest fidelity on map
        downsampled = full_coords
            
        # Deduplicate
        is_duplicate = False
        for existing in routes:
            if abs(existing["distance_km"] - distance_km) < 0.2 and abs(existing["travel_time_mins"] - travel_time_mins) <= 1:
                is_duplicate = True
                break
                
        if not is_duplicate:
            routes.append({
                "route_id": f"osrm_route_{idx + 1}",
                "route_name": names[len(routes)] if len(routes) < len(names) else f"Alternative {len(routes)}",
                "travel_time_mins": travel_time_mins,
                "distance_km": distance_km,
                "coordinates": downsampled,
                "full_coordinates": full_coords
            })
            
    # Mock Detour logic if only 1 unique route
    if len(routes) == 1:
        primary = routes[0]
        
        def bow_out(coords_list):
            new_coords = []
            length = len(coords_list)
            for i, c in enumerate(coords_list):
                if i == 0 or i == length - 1:
                    new_coords.append(c)
                else:
                    progress = i / length
                    offset = math.sin(progress * math.pi) * 0.03
                    new_coords.append([c[0] + offset, c[1] - offset])
            return new_coords
            
        routes.append({
            "route_id": "osrm_route_mock_detour",
            "route_name": "Plan-B Emergency Detour",
            "travel_time_mins": primary["travel_time_mins"] + 25,
            "distance_km": primary["distance_km"] + 12.5,
            "coordinates": bow_out(primary["coordinates"]),
            "full_coordinates": bow_out(primary["full_coordinates"])
        })
        
    return routes
