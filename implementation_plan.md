# Training Pipeline Implementation Plan

This plan details the steps to fulfill your request to train the ML model on real OSRM route geometries from combinations of 30-40 North East Indian cities.

## Open Questions

> [!IMPORTANT]
> **OSRM Rate Limits:** Generating routes for all combinations of 35 cities creates ~600 API requests. The public OSRM API may rate-limit or block this volume. I will implement a delay between requests, but it might take a few minutes to run. Should I limit it to a random subset of 100-200 routes to save time, or do you want me to attempt all 600?

> [!NOTE]
> **Model Storage:** I will save the trained model as an XGBoost `.json` file in the backend directory so that the backend server can load it on startup, removing the need for the mock random training on startup.

## Proposed Changes

### 1. New Offline Training Script

#### [NEW] `backend/scripts/generate_training_data.py`
Create a new standalone Python script that will:
- Contain a hardcoded dictionary of ~35 prominent North East cities (Guwahati, Shillong, Itanagar, Tawang, Imphal, etc.) and their GPS coordinates.
- Generate pairs of cities.
- Fetch the real road path between each pair using the OSRM API (with rate-limiting delays).
- Extract the route coordinates and generate synthetic ML feature data for them (slope, rain intensity, soil stability, historical landslides, etc.) using our established risk formula.
- Export this rich dataset to `backend/data/training_data.csv`.
- Train the `XGBClassifier` on this dataset.
- Save the trained model artifact to `backend/app/models/road_risk_xgb.json`.

### 2. Update ML Backend Service

#### [MODIFY] `backend/app/services/ml_routing.py`
- Remove the `_bootstrap_synthetic_training` method which previously generated random, non-geographical mock data on server startup.
- Update the `RoadRiskMLModel` initialization to load the pre-trained `road_risk_xgb.json` model file from disk.

## Verification Plan

### Automated Steps
- Run the `generate_training_data.py` script and observe the progress logs as it fetches routes and trains the model.
- Verify `training_data.csv` and `road_risk_xgb.json` are created successfully.

### Manual Verification
- Start the FastAPI backend and verify it successfully loads the pre-trained `.json` model.
- Run the frontend UI and test a route (e.g., Guwahati to Shillong) to ensure the predictions are still processed successfully by the new, offline-trained model.
