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

# --- Major Cities ---
MAJOR_CITIES = {
    "Guwahati": (26.1158, 91.7086), "Shillong": (25.5788, 91.8933), "Itanagar": (27.0844, 93.6053),
    "Imphal": (24.8170, 93.9368), "Kohima": (25.6701, 94.1077), "Agartala": (23.8315, 91.2868),
    "Aizawl": (23.7271, 92.7176), "Gangtok": (27.3389, 88.6065), "Tezpur": (26.6338, 92.8000),
    "Dibrugarh": (27.4728, 94.9120), "Jorhat": (26.7509, 94.2037), "Tinsukia": (27.4913, 95.3468),
    "Silchar": (24.8333, 92.7789), "Dimapur": (25.8988, 93.7272), "Tawang": (27.5855, 91.8659),
    "Pasighat": (28.0619, 95.3260), "Ziro": (27.5583, 93.8340), "Bomdila": (27.2645, 92.4158),
    "Bhalukpong": (27.0125, 92.6463), "Sivasagar": (26.9820, 94.6341), "Bongaigaon": (26.4764, 90.5581),
    "Dhubri": (26.0200, 89.9800), "Goalpara": (26.1738, 90.6236), "Haflong": (25.1762, 93.0232),
    "Karimganj": (24.8640, 92.3551), "Hailakandi": (24.6800, 92.5630), "Barpeta": (26.3216, 90.0076),
    "Nalbari": (26.4463, 91.4390), "Mangaldoi": (26.4385, 92.0305), "Duliajan": (27.3824, 95.3060),
    "Naharlagun": (27.1009, 93.6841)
}

# --- Minor Cities / Towns (Expanded) ---
MINOR_CITIES = {
    "Mawsynram": (25.2975, 91.5826), "Cherrapunji": (25.2702, 91.7323), "Dawki": (25.1843, 92.0163),
    "Nongpoh": (25.9038, 91.8814), "Jowai": (25.4468, 92.2036), "Tura": (25.5146, 90.2031),
    "Williamnagar": (25.4851, 90.6214), "Baghmara": (25.1950, 90.6272), "Resubelpara": (25.8943, 90.6033),
    "Mairang": (25.5604, 91.6366), "Nongstoin": (25.5222, 91.2676), "Amlarem": (25.2015, 92.0463),
    "Mawkyrwat": (25.3184, 91.4429), "Khliehriat": (25.3619, 92.3687), "Ampati": (25.4674, 89.9287),
    "Dadenggre": (25.7196, 90.1878), "Chokpot": (25.3108, 90.4907), "Selsella": (25.7360, 90.0456),
    "Rongram": (25.5786, 90.2520), "Betasing": (25.4616, 89.9463),
    
    # Assam minor cities
    "Majuli": (26.9538, 94.1683), "Hojai": (26.0028, 92.8530), "Diphu": (25.8458, 93.4290),
    "Morigaon": (26.2464, 92.3392), "Biswanath Chariali": (26.7326, 93.1534),
    "Udalguri": (26.7441, 92.0954), "Dhemaji": (27.4839, 94.5772), "Lanka": (25.9221, 92.9372),
    
    # Arunachal Pradesh minor cities
    "Roing": (28.1400, 95.8360), "Khonsa": (27.0187, 95.5358), "Changlang": (27.1332, 95.7369),
    "Yingkiong": (28.6186, 95.0475), "Anini": (28.7946, 95.9015), "Daporijo": (27.9868, 94.2230),
    
    # Nagaland minor cities
    "Mokokchung": (26.3315, 94.5298), "Tuensang": (26.2750, 94.8315), "Wokha": (26.1042, 94.2541),
    "Mon": (26.7350, 95.1051), "Zunheboto": (25.9686, 94.5158), "Phek": (25.6888, 94.4647),
    
    # Manipur minor cities
    "Churachandpur": (24.3313, 93.6828), "Thoubal": (24.6318, 94.0152), "Kakching": (24.4920, 93.9781),
    "Ukhrul": (25.1118, 94.3582), "Senapati": (25.2638, 94.0205),
    
    # Mizoram minor cities
    "Lunglei": (22.8833, 92.7333), "Champhai": (23.4735, 93.3276), "Serchhip": (23.3088, 92.8398),
    "Kolasib": (24.2185, 92.6784), "Mamit": (23.9298, 92.4831),
    
    # Tripura minor cities
    "Udaipur": (23.5332, 91.4834), "Dharmanagar": (24.3725, 92.1645), "Kailashahar": (24.3168, 92.0103),
    "Belonia": (23.2505, 91.4600), "Khowai": (24.0620, 91.6053),
    
    # Sikkim minor cities
    "Namchi": (27.1706, 88.3541), "Geyzing": (27.2796, 88.2435), "Mangan": (27.5052, 88.5292),
    "Rangpo": (27.1787, 88.5303), "Jorethang": (27.1276, 88.2792)
}

ALL_CITIES = {**MAJOR_CITIES, **MINOR_CITIES}

def generate_training_data():
    all_pairs = list(itertools.combinations(ALL_CITIES.keys(), 2))
    
    # To prioritize small cities, let's filter pairs that have at least one minor city
    minor_pairs = [pair for pair in all_pairs if pair[0] in MINOR_CITIES or pair[1] in MINOR_CITIES]
    
    random.shuffle(minor_pairs)
    # Pick 1500 random combinations involving minor cities (should cover most of them)
    # Or just use them all if less than 1500
    target_pairs = minor_pairs[:1500] if len(minor_pairs) > 1500 else minor_pairs
    
    records = []
    
    print(f"Total cities: {len(ALL_CITIES)} (Major: {len(MAJOR_CITIES)}, Minor: {len(MINOR_CITIES)})")
    print(f"Generating routes for {len(target_pairs)} city pairs (prioritizing minor cities)...")
    
    for idx, (city_a, city_b) in enumerate(target_pairs):
        lat_a, lon_a = ALL_CITIES[city_a]
        lat_b, lon_b = ALL_CITIES[city_b]
        
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
                        # Existing Features
                        slope = random.uniform(0.0, 45.0)
                        rain = random.uniform(10.0, 300.0)
                        intensity = random.uniform(1.0, 40.0)
                        soil = random.uniform(0.1, 1.0)
                        paved = np.random.choice([0, 1], p=[0.2, 0.8])
                        fault = random.uniform(0.5, 30.0)
                        hist = np.random.choice([0, 1], p=[0.7, 0.3])
                        
                        # New Flood/Landslide Features
                        elevation_m = random.uniform(50.0, 3500.0)
                        dist_to_river_m = random.uniform(10.0, 5000.0)
                        veg_cover = random.uniform(0.1, 1.0)
                        soil_moisture = random.uniform(0.1, 1.0)
                        drainage_density = random.uniform(0.5, 5.0)
                        
                        # Formulate realistic risk score incorporating new features
                        risk_score = (
                            (slope / 45.0) * 0.20 +
                            (rain / 300.0) * 0.20 +
                            (1.0 - soil) * 0.10 +
                            (1 - paved) * 0.05 +
                            hist * 0.10 +
                            (elevation_m / 3500.0) * 0.05 +
                            (max(0, 1000 - dist_to_river_m) / 1000) * 0.15 + 
                            (1.0 - veg_cover) * 0.05 +
                            soil_moisture * 0.05 + 
                            (drainage_density / 5.0) * 0.05
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
                            'elevation_m': elevation_m,
                            'distance_to_nearest_river_m': dist_to_river_m,
                            'vegetation_cover_index': veg_cover,
                            'soil_moisture_level': soil_moisture,
                            'drainage_density': drainage_density,
                            'risk_label': label
                        })
                        
            if (idx + 1) % 10 == 0:
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
        'historical_landslide',
        'elevation_m',
        'distance_to_nearest_river_m',
        'vegetation_cover_index',
        'soil_moisture_level',
        'drainage_density'
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
