# NERAI - Smart Logistics & Accessibility Intelligence Platform

> 🏆 **Built for Smart India Hackathon (SIH)**  
> **Organization:** Ministry of Development of North Eastern Region (MDoNER)  
> **Theme:** Transportation & Logistics  

Transport & Logistics Command - AI-assisted route planning and fleet movement across Northeast India.

## 🌟 Executive Summary
The North Eastern Region (NER) experiences unique logistics and transportation challenges due to extreme weather, hilly terrain, and infrastructure gaps. **NERAI** is an AI-enabled intelligence system to monitor real-time road accessibility, predict disruptions, optimize routing, and track the movement of essential goods.

**Vision:** To build a highly resilient, offline-capable, and AI-driven logistics network that ensures uninterrupted supply of essential commodities and robust emergency response across NER.

## ✨ Core Features
- **🗺️ Real-Time GIS Dashboard:** District-wise connectivity map, bottleneck analytics, and live vehicle tracking.
- **🧠 AI & Predictive Analytics:** Predict road disruptions using weather data (Open-Meteo), smart dynamic routing factoring in blockages, and AI-adjusted ETA calculations.
- **📱 Field Reporting & Offline Mode:** Geo-tagged incident reporting, browser-based offline capabilities (IndexedDB) for low-network zones, and multilingual support.
- **🚨 Alerts & Notifications:** Automated risk alerts and emergency disaster mode.

## 🚀 Innovative Highlights
- **Predictive Vulnerability Index (PVI):** Each road segment gets a PVI score based on rainfall, soil type, and elevation.
- **"Waze" for Disaster Management:** Crowdsourced ground-truth system from verified transport drivers.
- **Supply-Demand Heatmaps:** Overlay supply shortages with available transport fleets during disasters.
- **Bandwidth-Optimized Sync:** Heavy client-side image compression and offline-first architecture for NER's low-network areas.

## 🛠️ Technology Stack
- **Frontend:** React + Vite, Tailwind CSS, Recharts
- **Maps:** React Leaflet + OpenStreetMap
- **Backend:** Python FastAPI
- **AI/ML:** Python, scikit-learn, NetworkX
- **Database & Storage:** Supabase PostgreSQL, PostGIS

## 👥 Team
- **Frontend Architect:** Command center dashboard (React, Vite, Tailwind).
- **GIS & Mapping Specialist:** PostGIS, React Leaflet integration.
- **Responsive Web Developer:** Field reporting, offline capabilities.
- **Backend Architect:** FastAPI, Supabase, Data ingestion.
- **AI/ML & Routing Engineer:** Route optimization (NetworkX), Predictive modeling.
- **DevOps, QA & Product Manager:** CI/CD, testing, pitch presentation.

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Supabase Account

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/kodesriniketh/NERAI.git
   cd NERAI
   ```
2. Setup Backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
3. Setup Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
