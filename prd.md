# Product Requirements Document (PRD)
## AI-Based Smart Logistics and Accessibility Intelligence Platform for NER

> [!NOTE]
> **Organization:** Ministry of Development of North Eastern Region (MDoNER)  
> **Theme:** Transportation & Logistics  
> **Platform Type:** Responsive Web Application

---

## 1. Executive Summary
The North Eastern Region (NER) experiences unique logistics and transportation challenges due to extreme weather, hilly terrain, and infrastructure gaps. This platform aims to be an AI-enabled intelligence system to monitor real-time road accessibility, predict disruptions, optimize routing, and track the movement of essential goods. 

**Vision:** To build a highly resilient, offline-capable, and AI-driven logistics network that ensures uninterrupted supply of essential commodities and robust emergency response across NER.

---

## 2. Target Audience (User Personas)
1. **Central/State Logistics Administrators:** View high-level district-wise connectivity, bottlenecks, and supply chain gaps via a central dashboard.
2. **Transport/Fleet Managers:** Track real-time vehicle movement carrying essential supplies and receive alternate route suggestions.
3. **Field Officials & Local Authorities:** Use the mobile-responsive web portal to upload geo-tagged updates, photos, and incident reports from remote areas.
4. **Disaster Management Units:** Rely on the platform during emergencies to find accessible routes for rescue and relief distribution.

---

## 3. Core Features & Functional Requirements

### 3.1 Real-Time GIS Dashboard
- **District-wise Connectivity Map:** Visual representation of accessible, at-risk, and blocked routes.
- **Logistics Bottleneck Analytics:** Charts showing average delays and supply shortages per district.
- **Vehicle Tracking:** Live GPS integration to track trucks carrying essentials.

### 3.2 AI & Predictive Analytics
- **Disruption Prediction:** AI models analyzing weather forecasts (Open-Meteo) and historical landslide/flood data to predict high-risk transport corridors.
- **Smart Routing:** Dynamic calculation of alternate routes taking into account vehicle type, road elevation, and current blockages.
- **Estimated Travel Delays:** AI-adjusted ETA calculations for logistics vehicles based on real-time incidents.

### 3.3 Field Reporting & Offline Capabilities
- **Geo-tagged Incident Reporting:** Allow field workers to capture photos and report road damages.
- **Offline Capabilities:** Use browser LocalStorage/IndexedDB so field workers can log reports via the web portal even during intermittent network drops. Data auto-syncs when connection is restored.
- **Multilingual Support:** Interface and notifications in local languages (Assamese, Bengali, Hindi, English).

### 3.4 Alerts & Notifications
- **Automated Risk Alerts:** SMS/Push notifications regarding blocked roads or delayed deliveries.
- **Emergency Mode:** Instantly highlights disaster-time accessibility routes and safe zones.

---

## 4. Innovative Additions (To Stand Out in SIH)
> [!TIP]
> To win a hackathon, your project needs a "Wow" factor. Implement these unique features:
1. **Predictive Vulnerability Index (PVI):** Instead of just saying a road is blocked, give every road segment a PVI score (0-100) based on continuous rainfall data, soil type, and elevation gradients.
2. **"Waze" for Disaster Management:** Allow verified local transport drivers to "upvote/downvote" blockages, establishing a reliable, crowdsourced ground-truth system.
3. **Supply-Demand Heatmaps:** During disasters, overlay areas with supply shortages (e.g., medicine) with the nearest available transport fleets to optimize relief distribution.
4. **Bandwidth-Optimized Data Transfer:** Since NER has low-network areas, compress images heavily on the client side before uploading to Supabase, and use binary data formats for map updates.

---

## 5. Technology Stack Mapping

| Component | Technology Choice | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React + Vite | Fast, modern web application UI. |
| **Styling** | Tailwind CSS | Rapid, responsive, and beautiful UI development. |
| **Maps & Spatial** | React Leaflet + OpenStreetMap | Interactive maps for routing and incident plotting. |
| **Data Visualization** | Recharts | Dashboards for logistics bottlenecks and connectivity. |
| **Backend API** | Python FastAPI | High-performance backend, great for AI/ML integration. |
| **AI / Machine Learning** | Python + scikit-learn | Predictive modeling for route disruptions. |
| **Routing Algorithm** | NetworkX / Dijkstra / A* | Graph-based alternate route calculations. |
| **Database & Auth** | Supabase PostgreSQL | Relational data, authentication, and user management. |
| **GIS Capabilities** | PostGIS (via Supabase) | Spatial queries (e.g., finding incidents within 10km of a route). |
| **File Storage** | Supabase Storage | Storing geo-tagged incident photographs. |
| **Offline Mode** | Browser LocalStorage/IndexedDB | Caching map tiles and field reports for offline sync. |
| **External APIs** | Open-Meteo API | Free, high-accuracy weather data for predictive ML. |
| **Deployment** | Vercel (FE), Render (BE) | Serverless frontend and scalable backend hosting. |

---

## 6. Team Division (6 Members)

To execute this massive project effectively in a hackathon setting, divide the roles strictly based on expertise while maintaining parallel development.

### 👤 Member 1: Frontend Architect (Web Dashboard)
- **Role:** Build the command center.
- **Tasks:** Setup React + Vite, Tailwind config. Build the central dashboard layout, integrate Recharts for analytics, and consume backend APIs to display connectivity status and vehicle tracking data.

### 👤 Member 2: GIS & Mapping Specialist
- **Role:** Handle all things spatial.
- **Tasks:** Integrate React Leaflet. Work with PostGIS to plot roads, incident reports, and render the route geometries calculated by the backend. Ensure map tiles are cached for low-bandwidth environments.

### 👤 Member 3: Responsive Web & Frontend Developer
- **Role:** Build the field reporting web interface.
- **Tasks:** Develop the mobile-responsive views for field workers within the web application. Implement offline data storage strategies in the browser (IndexedDB), image compression, and multilingual UI support.

### 👤 Member 4: Backend Architect (FastAPI & Supabase)
- **Role:** The data engine.
- **Tasks:** Set up Supabase DB schemas, PostGIS extensions, and Storage. Build FastAPI endpoints for authentication, data ingestion, and querying. Integrate the Open-Meteo API for live weather fetching.

### 👤 Member 5: AI/ML & Routing Engineer
- **Role:** The brain of the platform.
- **Tasks:** Convert OSM road data into a NetworkX graph. Implement A*/Dijkstra for route optimization factoring in road blockages. Train a scikit-learn model on historical/mock data to predict road vulnerability based on weather data.

### 👤 Member 6: DevOps, QA & Product Manager
- **Role:** The glue and the pitcher.
- **Tasks:** Manage GitHub repo, set up CI/CD pipelines to Vercel and Render. Conduct rigorous end-to-end testing (especially offline flows). Craft the SIH presentation, design mockups/branding, and ensure the product aligns perfectly with the MDoNER problem statement.

---

## 7. SIH Internal Hackathon Implementation Roadmap (Sept 11-13)

### Day 1: Sept 11, 2026 - Problem Analysis & Conceptualization
- **7:15 PM - 8:30 PM (Lap 1):** Team brainstorms the core problem. Outline exactly how the AI Logistics platform will solve the NER connectivity issue. Identify target users.
- **9:00 PM - 11:30 PM (Lap 1 Cont.):** Finalize the basic solution architecture. Map out the features (PVI, Offline web capabilities, Dashboard). Create initial mockups (Figma) and a high-level flowchart.
- **11:30 PM - 12:00 AM (Checkpoint 1 - No Eliminations):** Pitch the initial idea and mockups to mentors. Gather feedback on the feasibility of the AI models and the GIS implementation.

### Day 2: Sept 12, 2026 - Intense Development & Elimination Checkpoint
- **12:45 AM - 7:30 AM (Lap 2):** *The All-Nighter.* Refine approach based on mentor feedback.
  - **Backend & GIS:** Setup Supabase, PostGIS, and FastAPI boilerplate.
  - **Frontend:** Setup React/Vite/Tailwind and start basic UI components.
  - **AI/ML:** Identify datasets and start basic scikit-learn training scripts.
- **8:30 AM - 2:00 PM (Lap 3):** Begin prototype development.
  - Connect the Frontend dashboard to the Backend APIs.
  - Implement basic Leaflet map with mock data for routes/incidents.
  - Ensure a basic "working proof" of concept is ready for the elimination round.
- **3:30 PM - 4:30 PM (Checkpoint 2 - Eliminations):** Demonstrate the working proof/prototype. Emphasize the innovation (e.g., PVI, Offline sync) and technical approach.
- **5:00 PM - 11:30 PM (Lap 5):** *Post-Elimination Sprint.*
  - Integrate AI predictions into the backend.
  - Implement the offline web functionality using browser LocalStorage/IndexedDB.
  - Connect Recharts in the frontend to real (or realistic mock) data.
- **11:30 PM - 12:00 AM (Checkpoint 3 - No Eliminations):** Demonstrate the MVP. Receive final technical feedback from mentors to polish the edges.

### Day 3: Sept 13, 2026 - Polish, Pitch Prep & Final Judging
- **12:45 AM - 7:30 AM (Lap 6):** Final bug fixes and UI polish.
  - Resolve any synchronization issues with the offline web features.
  - Ensure the AI routing actually looks dynamic on the map.
  - Deploy the frontend to Vercel and backend to Render.
- **8:30 AM - 11:30 AM (Lap 6 Cont.):** Documentation & Pitch Prep.
  - Create the final presentation deck.
  - Rehearse the live demo, ensuring all API keys (like Open-Meteo) are working and the database is populated with good dummy data to show realistic NER scenarios.
- **11:30 AM - 12:00 PM (Final Mentorship):** Last-minute presentation review and refinement.
- **12:00 PM - 4:00 PM (Final Judging Round):** Deliver the final pitch and live demonstration of the Smart Logistics Intelligence Platform to the judges. Focus on impact, technical execution, and scalability for the NER.
