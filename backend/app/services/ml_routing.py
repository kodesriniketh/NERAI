import os
import numpy as np
import pandas as pd
from xgboost import XGBClassifier
import json

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')

# =====================================================================
# 1. ML RISK ASSESSMENT MODEL CLASS
# =====================================================================
class RoadRiskMLModel:
    def __init__(self):
        self.feature_names = [
            'slope_degree', 
            'rain_accum_24h', 
            'rain_intensity_3h', 
            'soil_stability_index', 
            'is_paved', 
            'dist_to_fault_km', 
            'historical_landslide',
            'elevation_m',
            'distance_to_nearest_river_m',
            'vegetation_cover_index',
            'soil_moisture_level',
            'drainage_density'
        ]
        self.model = XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            random_state=42
        )
        model_path = os.path.join(MODELS_DIR, 'road_risk_xgb.json')
        if os.path.exists(model_path):
            self.model.load_model(model_path)
            print(f"Loaded ML model from {model_path}")
        else:
            raise FileNotFoundError(f"Model file not found at {model_path}. Run training script first.")

    def predict_point_risk(self, feature_dict: dict) -> float:
        df_input = pd.DataFrame([feature_dict])[self.feature_names]
        risk_prob = self.model.predict_proba(df_input)[0][1]
        return round(float(risk_prob * 100.0), 1)

    def predict_batch_risk(self, feature_dicts: list) -> list:
        if not feature_dicts:
            return []
        df_input = pd.DataFrame(feature_dicts)[self.feature_names]
        probs = self.model.predict_proba(df_input)[:, 1]
        return [round(float(p * 100.0), 1) for p in probs]


# =====================================================================
# 2. DYNAMIC ROUTE EVALUATOR
# =====================================================================
class DynamicRouteEngine:
    def __init__(self):
        self.ml_model = RoadRiskMLModel()

    def _get_mock_gis_features(self, lat: float, lon: float, active_hazards: list):
        """Extracts spatial features for given dynamic coordinates."""
        is_near_hazard = False
        if active_hazards:
            for h in active_hazards:
                dist = np.sqrt((lat - h["lat"])**2 + (lon - h["lon"])**2)
                if dist < 0.08:  # ~5-8km radius
                    is_near_hazard = True
                    break

        if is_near_hazard:
            return {
                'slope_degree': 38.5,
                'rain_accum_24h': 120.0,
                'rain_intensity_3h': 18.2,
                'soil_stability_index': 0.2,
                'is_paved': 1,
                'dist_to_fault_km': 1.2,
                'historical_landslide': 1,
                'elevation_m': 1200.0,
                'distance_to_nearest_river_m': 200.0,
                'vegetation_cover_index': 0.3,
                'soil_moisture_level': 0.85,
                'drainage_density': 1.0,
                'active_hazard': True
            }
        else:
            return {
                'slope_degree': float(np.clip(22.0 + np.sin(lat) * 10.0, 5.0, 40.0)),
                'rain_accum_24h': 45.0,
                'rain_intensity_3h': 4.0,
                'soil_stability_index': 0.75,
                'is_paved': 1 if lon > 91.9 else 0,
                'dist_to_fault_km': 12.0,
                'historical_landslide': 0,
                'elevation_m': 2500.0,
                'distance_to_nearest_river_m': 1500.0,
                'vegetation_cover_index': 0.75,
                'soil_moisture_level': 0.4,
                'drainage_density': 3.0,
                'active_hazard': False
            }

    def evaluate_trip(self, origin_name: str, dest_name: str, candidate_routes: list, active_hazards: list = None, cargo_type: str = "General Freight"):
        if active_hazards is None:
            active_hazards = []

        evaluated_options = []

        for route in candidate_routes:
            point_risks = []
            paved_count = 0
            coordinates = route.get("coordinates", [])
            total_points = len(coordinates)

            if total_points == 0:
                continue

            batch_features = []
            for lat, lon in coordinates:
                gis_feats = self._get_mock_gis_features(lat, lon, active_hazards)
                batch_features.append(gis_feats)
                if gis_feats['is_paved'] == 1:
                    paved_count += 1
            
            if batch_features:
                base_risks = self.ml_model.predict_batch_risk(batch_features)
                for feats, risk_pct in zip(batch_features, base_risks):
                    if feats['active_hazard']:
                        risk_pct = max(risk_pct, 88.6)
                    point_risks.append(risk_pct)

            max_risk = max(point_risks)
            avg_risk = float(np.mean(point_risks))
            composite_risk = 0.7 * max_risk + 0.3 * avg_risk

            # Cargo-specific Risk Multipliers (Master Plan Component)
            if "HazMat" in cargo_type:
                composite_risk *= 1.5
            elif "Heavy" in cargo_type or "Machinery" in cargo_type:
                composite_risk *= 1.3
            elif "Medical" in cargo_type:
                composite_risk *= 1.2
                
            composite_risk = round(min(100.0, composite_risk), 1)

            paved_pct = round((paved_count / total_points) * 100.0, 1)
            unpaved_pct = round(100.0 - paved_pct, 1)

            evaluated_options.append({
                "route_id": route.get("route_id", "custom_route"),
                "route_name": route.get("route_name", "Custom User Route"),
                "is_recommended": False,
                "risk_percentage": composite_risk,
                "travel_time_mins": route.get("travel_time_mins", 0),
                "distance_km": route.get("distance_km", 0.0),
                "surface_quality": {
                    "paved_asphalt_pct": paved_pct,
                    "unpaved_dirt_pct": unpaved_pct
                },
                "coordinates": coordinates
            })

        if evaluated_options:
            safest = min(evaluated_options, key=lambda r: r["risk_percentage"])
            safest["is_recommended"] = True

        return {
            "status": "SUCCESS",
            "trip_id": "DYNAMIC_TRIP_EVALUATION",
            "origin": origin_name,
            "destination": dest_name,
            "routes_count": len(evaluated_options),
            "route_options": evaluated_options
        }


# Dynamic global engine instance
engine = DynamicRouteEngine()

def get_route_risk_assessment(origin: str, destination: str, routes: list, active_hazards: list = None, cargo_type: str = "General Freight") -> dict:
    """Evaluate candidate routes against the ML risk model."""
    result = engine.evaluate_trip(origin, destination, routes, active_hazards, cargo_type)
    return result
