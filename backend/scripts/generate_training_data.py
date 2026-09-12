import os
import json
import time
import random
import requests
import itertools
import numpy as np
import pandas as pd
from xgboost import XGBClassifier

# --- Ensure Directories Exist ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(BACKEND_DIR, 'data')
MODELS_DIR = os.path.join(BACKEND_DIR, 'app', 'models')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# --- 30 prominent North East India cities with approx coordinates ---
CITIES = {
    "Guwahati": (26.1158, 91.7086),
    "Shillong": (25.5788, 91.8933),
    "Itanagar": (27.0844, 93.6053),
    "Imphal": (24.8170, 93.9368),
    "Kohima": (25.6701, 94.1077),
    "Agartala": (23.8315, 91.2868),
    "Aizawl": (23.7271, 92.7176),
    "Gangtok": (27.3389, 88.6065),
    "Tezpur": (26.6338, 92.8000),
    "Dibrugarh": (27.4728, 94.9120),
    "Jorhat": (26.7509, 94.2037),
    "Tinsukia": (27.4913, 95.3468),
    "Silchar": (24.8333, 92.7789),
    "Dimapur": (25.8988, 93.7272),
    "Tawang": (27.5855, 91.8659),
    "Pasighat": (28.0619, 95.3260),
    "Ziro": (27.5583, 93.8340),
    "Bomdila": (27.2645, 92.4158),
    "Bhalukpong": (27.0125, 92.6463),
    "Sivasagar": (26.9820, 94.6341),
    "Bongaigaon": (26.4764, 90.5581),
    "Dhubri": (26.0200, 89.9800),
    "Goalpara": (26.1738, 90.6236),
    "Haflong": (25.1762, 93.0232),
    "Karimganj": (24.8640, 92.3551),
    "Hailakandi": (24.6800, 92.5630),
    "Barpeta": (26.3216, 90.0076),
    "Nalbari": (26.4463, 91.4390),
    "Mangaldoi": (26.4385, 92.0305),
    "Duliajan": (27.3824, 95.3060),
    "Naharlagun": (27.1009, 93.6841)
}

def generate_training_data():
    all_pairs = list(itertools.combinations(CITIES.keys(), 2))
    random.shuffle(all_pairs)
    # Pick 150 random combinations to respect OSRM rate limits & time
    target_pairs = all_pairs[:150]
    
    records = []
    
    print(f"Generating routes for {len(target_pairs)} city pairs...")
    
    for idx, (city_a, city_b) in enumerate(target_pairs):
        lat_a, lon_a = CITIES[city_a]
        lat_b, lon_b = CITIES[city_b]
        
        url = f"https://router.project-osrm.org/route/v1/driving/{lon_a},{lat_a};{lon_b},{lat_b}?geometries=geojson&overview=simplified"
        
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                if data.get('code') == 'Ok' and data.get('routes'):
                    coords = data['routes'][0]['geometry']['coordinates']
                    # Take every 5th coordinate to generate reasonable sized dataset
                    sampled_coords = coords[::5]
                    
                    for (lon, lat) in sampled_coords:
                        # Generate synthetic features based on geographical bounds
                        slope = random.uniform(5.0, 45.0)
                        rain = random.uniform(10.0, 150.0)
                        intensity = random.uniform(1.0, 25.0)
                        soil = random.uniform(0.1, 1.0)
                        paved = np.random.choice([0, 1], p=[0.2, 0.8])
                        fault = random.uniform(0.5, 30.0)
                        hist = np.random.choice([0, 1], p=[0.7, 0.3])
                        
                        # Formulate realistic risk score
                        risk_score = (
                            (slope / 45.0) * 0.35 +
                            (rain / 150.0) * 0.35 +
                            (1.0 - soil) * 0.15 +
                            (1 - paved) * 0.15 +
                            hist * 0.2
                        )
                        label = 1 if risk_score > 0.55 else 0
                        
                        records.append({
                            'lat': lat,
                            'lon': lon,
                            'slope_degree': slope,
                            'rain_accum_24h': rain,
                            'rain_intensity_3h': intensity,
                            'soil_stability_index': soil,
                            'is_paved': paved,
                            'dist_to_fault_km': fault,
                            'historical_landslide': hist,
                            'risk_label': label
                        })
                        
            print(f"[{idx+1}/{len(target_pairs)}] Processed {city_a} to {city_b} ({len(records)} points total)")
        except Exception as e:
            print(f"Failed {city_a} to {city_b}: {e}")
        
        # Rate limit to ~2 req/sec
        time.sleep(0.5)
        
    df = pd.DataFrame(records)
    csv_path = os.path.join(DATA_DIR, 'training_data.csv')
    df.to_csv(csv_path, index=False)
    print(f"Saved {len(df)} points to {csv_path}")
    
    return df

def train_model(df):
    print("Training XGBoost Model...")
    feature_names = [
        'slope_degree', 
        'rain_accum_24h', 
        'rain_intensity_3h', 
        'soil_stability_index', 
        'is_paved', 
        'dist_to_fault_km', 
        'historical_landslide'
    ]
    
    X = df[feature_names]
    y = df['risk_label']
    
    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        random_state=42
    )
    
    model.fit(X, y)
    
    model_path = os.path.join(MODELS_DIR, 'road_risk_xgb.json')
    model.save_model(model_path)
    print(f"Model trained and saved to {model_path}")

if __name__ == "__main__":
    df = generate_training_data()
    if len(df) > 0:
        train_model(df)
    else:
        print("No data generated. Check network or OSRM API.")
