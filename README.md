# 🚑 RoadSoS — AI-Powered Emergency Response System

> **National Road Safety Hackathon 2026 | CoERS, RBG Labs, IIT Madras**
> Problem Statement: RoadSoS (1.3) | Theme: AI in Road Safety

---

## "Every second after an accident decides life or death — RoadSoS reduces that delay."

RoadSoS is a fully software-based, AI-powered, offline-first emergency response PWA that connects road accident victims and bystanders to the nearest trauma centres, ambulances, police stations, towing services, and puncture shops — in under 30 seconds, even without internet.

## 🏗️ Repository Structure

```
roadsos/
├── frontend/          # React 18 PWA (Vite + Tailwind + Leaflet)
│   └── src/
│       ├── screens/   # SOSScreen, MapScreen, ChatScreen, SettingsScreen
│       ├── components/# SOSButton, ServiceCard, TriageBadge, VoiceInput
│       ├── hooks/     # useGeolocation, useOfflineDB, useVoice, useTriage
│       ├── services/  # api.js, spatialQuery.js, sosAlert.js, nlp.js
│       └── i18n/      # en.json, hi.json, ta.json, te.json
├── backend/
│   ├── app/           # Python FastAPI (AI triage + data sync)
│   │   ├── api/       # sos.py, services.py, auth.py
│   │   ├── core/      # config.py, database.py
│   │   └── models/    # service.py, sos_event.py
│   └── node/          # Node.js Express (SOS alerts + proxy)
├── ai_engine/nlp/     # DistilBERT triage model training
├── data_pipeline/     # OSM ingestion + SQLite export scripts
├── database/          # Schema + Tamil Nadu seed data
└── docs/              # Architecture notes
```

## ⚡ Quick Start

### Frontend PWA
```bash
cd frontend && npm install && npm run dev
# Opens at http://localhost:5173
```

### Python Backend (AI Triage)
```bash
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Node.js Backend (SOS Alerts)
```bash
cd backend/node && npm install && npm start
# Runs at http://localhost:3001
```

## Environment Variables
Copy `.env.example` to `.env` and fill in:
- `ANTHROPIC_API_KEY` — Claude API (optional, online fallback)
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` — SMS alerts
- `TELEGRAM_BOT_TOKEN` — Telegram SOS channel
- OVERPASS_API_URL — OpenStreetMap Overpass API endpoint for emergency service lookup

## 🏆 Problem Statement Coverage (PS 1.3)
- ✅ Nearest Police Stations, Hospitals, Ambulances
- ✅ Towing Services, Puncture Shops, Showrooms
- ✅ Global Applicability (OpenStreetMap 200+ countries)
- ✅ Offline Functionality (SpatiaLite + Service Worker)
- ✅ AI Triage + Innovation
- ✅ Multilingual (10 Indian languages)

*"Because every second counts, and every life matters." — RoadSoS Team*
