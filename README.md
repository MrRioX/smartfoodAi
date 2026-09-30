# SmartFood AI — SIH Demo Prototype (v0.3)

**Less Waste. More Food. A Better Tomorrow.**

SmartFood AI is an AI-powered food-waste-prevention, food-management, free-food redistribution, logistics, community-assistance and recovery ecosystem. It is **NOT** a food-ordering app like Zomato/Swiggy — every consumer flow is **₹0 / FREE**.

Mobile-first Next.js web app designed to run in an Android phone browser and to be packaged later into an Android WebView APK.

---

## Quick start (Windows / macOS / Linux)

```bash
npm install
npm run dev
# open http://localhost:3000
```

`npm run build` and `npm run start` also work on Windows — no Unix-only syntax is used in any script.

### Test from your phone (same Wi-Fi)

1. Find your PC's LAN IP, e.g. `192.168.1.5` (`ipconfig` on Windows).
2. Put it in `.env.local` (copy from `.env.example`):
   ```
   DEV_ALLOWED_ORIGINS=http://192.168.1.5:3000
   ```
3. `npm run dev`, then open `http://192.168.1.5:3000` on your phone.
4. The Android WebView debug build may need **cleartext HTTP permission** (`android:usesCleartextHttpTraffic="true"` for the local test build only).

---

## Demo authentication (no OTP, no real verification)

| Role | Demo ID | Password |
|---|---|---|
| Normal User | `user01` | `user123` |
| NGO / Food Bank | `ngo01` | `ngo123` |
| Kitchen / Institution | `kitchen01` | `kitchen123` |

Tap a role card → **Use Demo Account**. Registration forms accept any values and show **"Demo registration submitted — Status: Pending Verification"**.

Normal users carry three modes in one account: **Consumer** (always) + **Food Donor ON/OFF** + **Delivery Partner ON/OFF** (Profile screen).

---

## AI configuration (your own model / API key)

Keys are developer configuration — they are **never** asked in the UI and **never** exposed to the browser. Copy `.env.example` → `.env.local`:

```env
AI_PROVIDER=          # informational: openai | zai | ollama | custom
AI_BASE_URL=          # OpenAI-compatible /v1 root, e.g. https://api.openai.com/v1
AI_API_KEY=           # stays server-side only
AI_MODEL=             # text model (planner, forecast, procurement…)
AI_VISION_MODEL=      # vision model for AI Food Scanning
```

Any OpenAI-compatible API works. Server-side AI service lives in `src/lib/ai/` (client, prompts, types, errors). All AI calls run in Next.js route handlers:

| Route | Used by | Fallback |
|---|---|---|
| `POST /api/ai/food-assessment` | AI Food Check (user + kitchen) — vision + barcode + metadata | deterministic demo rules |
| `POST /api/ai/meal-plan` | AI Meal Planner — quantities & cost | deterministic demo calc |
| `POST /api/ai/demand-forecast` | Kitchen Demand Forecast | deterministic demo model |
| `POST /api/ai/procurement` | Procurement insight (numbers from real stored inventory) | rule-based table |
| `POST /api/ai/logistics-analysis` | Delivery partner ranking explanation | structured rule ranking |
| `POST /api/ai/processing-analysis` | Processing efficiency insights | rule-based insight |

**When no key is configured** every screen shows a clearly-labelled **"Demo AI"** result with the reason — nothing crashes, nothing pretends to be the real model. AI food screening always shows *"AI-assisted screening — not a food-safety certification."* Uncertain results are marked **REVIEW REQUIRED** / *human review required*.

### Barcode / OCR

The AI Food Check uses the native `BarcodeDetector` API where available (Chrome / Edge / Android WebView). In browsers without it, a **clearly-labelled DEMO scan** is used. Barcode text + OCR text + image + storage metadata are all combined into one assessment.

---

## Map configuration (your own map key)

```env
MAP_PROVIDER=osm              # osm | mapbox | google
NEXT_PUBLIC_MAP_API_KEY=      # public client token (restrict it in the provider console)
NEXT_PUBLIC_MAP_STYLE=        # optional Mapbox style URL
```

The map layer is a reusable abstraction in `src/components/maps/`:

- `MapProvider.tsx` — provider context / active provider info
- `MapView.tsx` — discovery map (Explore Map) with automatic provider dispatch
- `MapPicker.tsx` — **real interactive location picker** (search, pan/zoom, tap/drag marker, reverse-geocoded address, [Confirm Location])
- `MapMarker.tsx` — categories + legend (food, NGO, food bank, kitchen, processing, delivery, community, recovery)
- `RouteMap.tsx` — delivery route (OSRM road routing → Mapbox Directions → labelled straight-line fallback)

Adapters: **Mapbox GL JS** (`MAP_PROVIDER=mapbox`), **Google Maps** (`MAP_PROVIDER=google`), and **OpenStreetMap + Leaflet** as the default / fallback — no key needed. If a keyed provider fails, the UI says *"Map provider failed. Switching to fallback map (OpenStreetMap)."*

### Location rules (no random coordinates, ever)

- NGO/Kitchen registration **requires** the map picker; `organization.location = { lat, lng, address, city, state, country }` is stored and reused everywhere the org appears on a map.
- Donations use the user's **saved profile location** or an **explicit map-picked** point — "if the user says Surat, the donation appears around Surat".
- Community-help stores only an **approximate jittered area** — exact locations of vulnerable people are never public; proof photos stay private inside the authorized NGO workflow.

---

## Delivery matching (no hard-coded cities)

Core eligibility is structured data only: `partner.city === request.pickupCity`, then ranked by service area, distance, capacity, vehicle type, availability and community-assistance preference. An Ahmedabad partner only qualifies for Ahmedabad pickups; a 20-capacity bike is marked *not suitable* for 200 meals. AI can explain/rank — it can never invent availability.

---

## Feature map

- **Consumer**: nearby free surplus, NGO/kitchen distribution, request → pickup / eat-here / delivery, history, feedback. Everything ₹0/FREE.
- **Food Donor**: surplus / prepared / packaged donations with photo, barcode, location picker, AI check.
- **Delivery Partner**: city + vehicle + capacity + service-area setup, nearby requests with fit reasons, pickup → route → delivered flow with road routing.
- **NGO**: overview metrics, food requests, community assistance workflow (report → NGO review → accept → volunteer/partner → delivery → complete), inventory, donations, free distribution, AI meal planner, beneficiaries, volunteers, partners, map, expiry, feedback, impact.
- **Kitchen**: AI meal planner, AI demand forecast (Predicted vs Actual), production, inventory, surplus, listings, AI food assessment, storage monitoring, IoT simulator, procurement, delivery, analytics, sustainability/ESG reports.
- **IoT**: fully labelled SIMULATED sensor layer (`sensor_devices` / `sensor_readings` shaped for real ESP32 integration later), demo Normal/Warning/Critical controls.
- **Sustainability/ESG**: demo CO₂e/energy/efficiency metrics with visible methodology, polished ESG report screen.

Demo seed data is distributed across **Ahmedabad, Surat, Vadodara, Rajkot, Mumbai, Delhi, Pune, Jaipur, Bengaluru** with real city coordinates.

---

## Demo data reset

Profile → Settings → **Reset demo data** (restores seeds, clears your local changes).

---

## Notes & limitations

- Demo auth only — never use this pattern in production.
- All organizations/data are fictional; IoT/machine/energy values are simulated and labelled.
- Ingredient prices are a demo dataset (`src/lib/ingredient-prices.ts`); swap in a real source and set `demo=false`.
- OSRM routing uses a public demo server; without internet the route map shows an explicit straight-line fallback.
