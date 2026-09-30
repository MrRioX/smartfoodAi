"use client"
// ============================================================
// SmartFood AI — Demo application store (Zustand + localStorage)
// All data is DEMO data. This layer is structured so actions can
// later be swapped for real API/DB calls (Supabase/PostgreSQL).
// ============================================================
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { useShallow } from "zustand/react/shallow"
import type {
  AppNotification, AppUser, AssessmentResult, Beneficiary, CommunityAssistance,
  DeliveryRequest, DemandForecast, FeedbackItem, FoodAssessment, FoodListing,
  FoodRequest, GeoLocation, IngredientQty, InventoryItem, MealPreset, Organization,
  ProductionRecord, RecoveryHandoff, RegistrationRecord, Role, SensorDevice,
  SensorReading, StandalonePartner, Volunteer, BuyerListing, BuyerOrder, BuyerAlert, BuyerProfile,
} from "./types"
import { CITY_NAMES, cityCenter } from "./cities"
import {
  seedAssessments, seedAssistance, seedBeneficiaries, seedDeliveries, seedEnergy,
  seedFeedback, seedForecasts, seedInventory, seedListings, seedMachines,
  seedNotifications, seedOrganizations, seedPartners, seedProductions,
  seedRecoveryHandoffs, seedRecoveryPartners, seedRequests, seedSensorReadings,
  seedSensors, seedUsers, seedVolunteers,
  seedBuyerListings, seedBuyerOrders, seedBuyerAlerts, seedBuyerProfile,
} from "./demo-data"
import { assessFood, planMeal, recalcFromIngredients, forecastDemand, haversineKm } from "./calc"

const uid = () => Math.random().toString(36).slice(2, 10)
const nowIso = () => new Date().toISOString()

function seedState() {
  return {
    users: seedUsers.map((u) => ({ ...u })) as AppUser[],
    organizations: seedOrganizations.map((o) => ({ ...o })) as Organization[],
    partners: seedPartners.map((p) => ({ ...p })) as StandalonePartner[],
    listings: seedListings.map((l) => ({ ...l })) as FoodListing[],
    requests: seedRequests.map((r) => ({ ...r })) as FoodRequest[],
    assistance: seedAssistance.map((a) => ({ ...a })) as CommunityAssistance[],
    deliveryRequests: seedDeliveries.map((d) => ({ ...d })) as DeliveryRequest[],
    volunteers: seedVolunteers.map((v) => ({ ...v })) as Volunteer[],
    beneficiaries: seedBeneficiaries.map((b) => ({ ...b })) as Beneficiary[],
    inventory: seedInventory.map((i) => ({ ...i })) as InventoryItem[],
    forecasts: seedForecasts.map((f) => ({ ...f })) as DemandForecast[],
    productions: seedProductions.map((p) => ({ ...p })) as ProductionRecord[],
    assessments: seedAssessments.map((a) => ({ ...a })) as FoodAssessment[],
    sensors: seedSensors.map((s) => ({ ...s })) as SensorDevice[],
    sensorReadings: seedSensorReadings.map((r) => ({ ...r })) as SensorReading[],
    machines: seedMachines.map((m) => ({ ...m })),
    energy: seedEnergy.map((e) => ({ ...e })),
    recoveryPartners: seedRecoveryPartners.map((r) => ({ ...r })),
    recoveryHandoffs: seedRecoveryHandoffs.map((h) => ({ ...h })) as RecoveryHandoff[],
    notifications: seedNotifications.map((n) => ({ ...n })) as AppNotification[],
    feedback: seedFeedback.map((f) => ({ ...f })) as FeedbackItem[],
    registrations: [] as RegistrationRecord[],
    presets: [] as MealPreset[],
    buyerListings: seedBuyerListings.map((b) => ({ ...b })) as BuyerListing[],
    buyerOrders: seedBuyerOrders.map((o) => ({ ...o })) as BuyerOrder[],
    buyerAlerts: seedBuyerAlerts.map((a) => ({ ...a })) as BuyerAlert[],
    buyerProfile: { ...seedBuyerProfile } as BuyerProfile,
  }
}

interface AuthState {
  role: Role | null
  userId: string | null
  orgId: string | null
  screen: string
}

/** Registration form payload (strings from the form + the picked location). */
export interface OrgRegistrationInput {
  name?: string
  username?: string
  password?: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  description?: string
  ngoType?: string
  registrationNumber?: string
  storageAvailable?: string
  estimatedBeneficiaries?: string | number
  kitchenType?: string
  dailyCapacity?: string | number
  storageCapability?: string
  licenseInfo?: string
  location?: GeoLocation
}

interface AppState extends AuthState, ReturnType<typeof seedState> {
  // ---- auth ----
  login: (role: Role, username: string, password: string) => { ok: boolean; message: string }
  logout: () => void
  registerUser: (data: { name: string; phone: string; email?: string; city: string; address: string; username: string; password: string }) => { ok: boolean; message: string }
  registerOrg: (role: "ngo" | "kitchen", data: OrgRegistrationInput) => { ok: boolean; message: string }
  loginDemoNgo: () => void
  // ---- nav ----
  navigate: (screen: string) => void
  // ---- user toggles ----
  toggleDonorMode: (on: boolean) => void
  toggleDeliveryMode: (on: boolean) => void
  saveDeliveryProfile: (p: AppUser["deliveryProfile"]) => void
  // ---- listings & requests ----
  requestFood: (listingId: string, quantity: number, mode: FoodRequest["mode"]) => { ok: boolean; message: string }
  respondToRequest: (requestId: string, action: "accept" | "reject" | "ready") => void
  completeRequest: (requestId: string) => void
  cancelRequest: (requestId: string) => void
  submitFeedback: (requestId: string, rating: number, comment: string) => void
  createDonation: (data: {
    title: string; foodCategory: string; quantity: number; unit: string;
    preparedHoursAgo: number; storage: string; pickupArea: string; availableHours: number;
    pickup: boolean; eatHere: boolean; delivery: boolean; notes?: string;
    assessment?: AssessmentResult
    location?: GeoLocation // explicit map-picked location — wins over profile location
  }) => { ok: boolean; message: string }
  // ---- community assistance ----
  submitAssistance: (data: { area: string; city: string; peopleCount: number; foodNeeded: string; description?: string; hasProofPhoto: boolean; approxLocation?: { lat: number; lng: number } }) => void
  acceptAssistance: (id: string) => void
  assignAssistance: (id: string, kind: "volunteer" | "partner", name?: string, partnerId?: string) => void
  completeAssistance: (id: string) => void
  // ---- NGO ----
  acceptIncomingDonation: (listingId: string) => void
  addVolunteer: (v: Omit<Volunteer, "id" | "ngoId">) => void
  toggleVolunteer: (id: string) => void
  addBeneficiary: (b: Omit<Beneficiary, "id" | "ngoId">) => void
  assignRequestVolunteer: (requestId: string, volunteerName: string) => void
  // ---- delivery ----
  acceptDelivery: (deliveryId: string) => void
  declineDelivery: (deliveryId: string) => void
  advanceDelivery: (deliveryId: string) => void
  // ---- kitchen ----
  savePreset: (name: string, foodType: string, meals: number, ingredients: IngredientQty[]) => void
  deletePreset: (id: string) => void
  runPlanner: (foodType: string, people: number) => ReturnType<typeof planMeal>
  recalcPlanner: (ingredients: IngredientQty[], meals: number, foodType: string) => ReturnType<typeof recalcFromIngredients>
  addForecast: (registrations: number, dayType: string, historicalAvg: number) => DemandForecast
  addForecastRecord: (rec: DemandForecast) => void
  recordForecastActuals: (forecastId: string, actualProduction: number, actualConsumption: number) => void
  createProduction: (foodType: string, planned: number, actual: number) => void
  recordConsumption: (productionId: string, consumed: number) => void
  addInventoryItem: (item: Omit<InventoryItem, "id" | "orgId" | "status">) => void
  updateInventoryItem: (id: string, patch: Partial<InventoryItem>) => void
  transferInventoryItem: (id: string, newStorage: string) => void
  donateInventoryItem: (id: string, qty: number) => void
  recoverInventoryItem: (id: string, qty: number, partnerId: string) => void
  runAssessment: (input: { foodName: string; method: FoodAssessment["method"]; hoursSincePrepared: number; storageCondition: string; ai?: { result: AssessmentResult; reasons: string[]; dateLabel?: string; confidence?: number; humanReviewRequired?: boolean } }) => FoodAssessment
  setSensorMode: (deviceId: string, mode: SensorDevice["mode"]) => void
  // ---- secondary buyer ----
  placeBuyerOrder: (listingId: string, quantity: number, intendedUse: string) => { ok: boolean; message: string; order?: BuyerOrder }
  completeBuyerOrder: (orderId: string) => void
  addBuyerAlert: (alert: { keyword: string; category?: string; maxPricePerUnit?: number; minQuantity?: number }) => void
  toggleBuyerAlert: (alertId: string) => void
  deleteBuyerAlert: (alertId: string) => void
  updateBuyerProfile: (patch: Partial<BuyerProfile>) => void
  // ---- notifications ----
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  // ---- system ----
  resetDemoData: () => void
}

function makeNotify(get: () => AppState, set: (partial: Partial<AppState>) => void) {
  return (n: Omit<AppNotification, "id" | "at" | "read">) => {
    set({ notifications: [{ id: uid(), at: nowIso(), read: false, ...n }, ...get().notifications].slice(0, 80) })
  }
}

const HOME_SCREEN: Record<Role, string> = { user: "u-home", ngo: "n-overview", kitchen: "k-overview", buyer: "b-overview" }

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const notify = makeNotify(get, set)
      return {
        ...seedState(),
        role: null, userId: null, orgId: null, screen: "login",

        // ---------------- AUTH (DEMO ONLY) ----------------
        login: (role, username, password) => {
          if (role === "user") {
            const u = get().users.find((x) => x.username === username && x.password === password)
            if (!u) return { ok: false, message: "Demo ID or password not recognised. Try user01 / user123." }
            set({ role, userId: u.id, orgId: null, screen: "u-home" })
            return { ok: true, message: `Welcome back, ${u.name.split(" ")[0]}!` }
          }
          if (role === "buyer") {
            const u = get().users.find((x) => x.username === username && x.password === password)
            if (!u && !(username === "buyer01" && password === "buyer123")) {
              return { ok: false, message: "Demo ID or password not recognised. Try buyer01 / buyer123." }
            }
            set({ role: "buyer", userId: u ? u.id : "u-buyer01", orgId: null, screen: "b-overview" })
            return { ok: true, message: `Welcome back, Secondary Buyer (GreenCycle)!` }
          }
          const wantType = role === "ngo" ? ["ngo", "foodbank"] : ["kitchen"]
          const org = get().organizations.find((o) => o.username === username && o.password === password && wantType.includes(o.type))
          if (!org) {
            return { ok: false, message: role === "ngo" ? "Try ngo01 / ngo123." : "Try kitchen01 / kitchen123." }
          }
          set({ role, orgId: org.id, userId: null, screen: HOME_SCREEN[role] })
          return { ok: true, message: `Welcome, ${org.name}!` }
        },
        logout: () => set({ role: null, userId: null, orgId: null, screen: "login" }),
        registerUser: (data) => {
          if (get().users.some((u) => u.username === data.username)) {
            return { ok: false, message: "This demo username already exists — pick another." }
          }
          const cc = cityCenter(data.city)
          const user: AppUser = {
            id: `u-${uid()}`, username: data.username, password: data.password, name: data.name,
            phone: data.phone, email: data.email, city: data.city, address: data.address,
            location: { lat: cc.lat, lng: cc.lng, address: data.address || data.city, city: data.city, state: cc.state, country: "India" },
            joinedAt: nowIso(), donorMode: false, deliveryMode: false,
          }
          set({ users: [...get().users, user] })
          return { ok: true, message: "Demo account created successfully." }
        },
        registerOrg: (role, data) => {
          const isNgo = role === "ngo"
          // The exact map-picked location is REQUIRED — never generate
          // random coordinates for an organization.
          const loc = data.location
          if (!loc) {
            return { ok: false, message: "Location missing — pick the organization location on the map first." }
          }
          const org: Organization = {
            id: `org-${uid()}`, username: data.username || `demo-${uid()}`, password: data.password || "demo123",
            name: data.name || "Unnamed Organization", type: isNgo ? "ngo" : "kitchen",
            city: loc.city && loc.city !== "—" ? loc.city : data.city || "Ahmedabad",
            state: loc.state && loc.state !== "—" ? loc.state : data.state || undefined,
            address: loc.address || data.address || "",
            lat: loc.lat, lng: loc.lng,
            location: { ...loc },
            phone: data.phone || "", contactPerson: data.contactPerson || "",
            status: "pending-demo", description: data.description || "Registered in demo mode — pending verification.",
            ngoType: isNgo ? data.ngoType : undefined,
            registrationNumber: isNgo ? data.registrationNumber : undefined,
            storageAvailable: isNgo ? data.storageAvailable === "yes" : undefined,
            estimatedBeneficiaries: isNgo ? Number(data.estimatedBeneficiaries || 0) : undefined,
            kitchenType: !isNgo ? data.kitchenType : undefined,
            dailyCapacity: !isNgo ? Number(data.dailyCapacity || 0) : undefined,
            storageCapability: !isNgo ? data.storageCapability : undefined,
            licenseInfo: !isNgo ? data.licenseInfo : undefined,
          }
          const rec: RegistrationRecord = {
            id: uid(), role, submittedAt: nowIso(),
            summary: `${org.name} — ${org.city}`, status: "Pending Verification (Demo)",
          }
          set({
            organizations: [...get().organizations, org],
            registrations: [rec, ...get().registrations],
          })
          notify({
            audience: role, orgId: org.id, kind: "verification",
            title: "Registration submitted — Demo Mode",
            body: `${org.name} registered successfully. Status: Pending Verification (Demo). No real verification is performed in this prototype.`,
            actionScreen: isNgo ? "n-profile" : "k-profile",
          })
          return { ok: true, message: isNgo ? "NGO registration submitted — Demo Mode" : "Kitchen registration submitted — Demo Mode" }
        },
        loginDemoNgo: () => set({ role: "ngo", orgId: "org-helping-hands", userId: null, screen: "n-overview" }),

        // ---------------- NAV ----------------
        navigate: (screen) => set({ screen }),

        // ---------------- USER TOGGLES ----------------
        toggleDonorMode: (on) => {
          const { userId, users } = get()
          set({ users: users.map((u) => (u.id === userId ? { ...u, donorMode: on } : u)) })
        },
        toggleDeliveryMode: (on) => {
          const { userId, users } = get()
          set({ users: users.map((u) => (u.id === userId ? { ...u, deliveryMode: on } : u)) })
        },
        saveDeliveryProfile: (p) => {
          const { userId, users } = get()
          set({ users: users.map((u) => (u.id === userId ? { ...u, deliveryProfile: p } : u)) })
        },

        // ---------------- LISTINGS & REQUESTS ----------------
        requestFood: (listingId, quantity, mode) => {
          const st = get()
          const listing = st.listings.find((l) => l.id === listingId)
          const user = st.users.find((u) => u.id === st.userId)
          if (!listing || !user) return { ok: false, message: "Listing not found." }
          if (quantity > listing.quantityRemaining) return { ok: false, message: `Only ${listing.quantityRemaining} ${listing.unit} remaining.` }
          const req: FoodRequest = {
            id: `r-${uid()}`, userId: user.id, userName: user.name, userPhone: user.phone,
            listingId, listingTitle: listing.title, providerId: listing.providerId,
            providerName: listing.providerName, quantity, mode, status: "requested", createdAt: nowIso(),
          }
          set({ requests: [req, ...st.requests] })
          if (listing.providerType === "user") {
            // Individual donation — auto-accepted in demo, donor notified
            set({ requests: get().requests.map((r) => (r.id === req.id ? { ...r, status: "accepted" } : r)) })
            notify({
              audience: "user", userId: listing.providerId, kind: "request-accepted",
              title: "Someone requested your donation",
              body: `${user.name} requested ${quantity} ${listing.unit} of "${listing.title}". Please confirm handover.`,
              actionScreen: "u-history",
            })
          } else {
            const aud: Role = listing.providerType === "kitchen" ? "kitchen" : "ngo"
            notify({
              audience: aud, orgId: listing.providerId, kind: "free-food",
              title: "New food claim received",
              body: `${user.name} requested ${quantity} ${listing.unit} from "${listing.title}" (${mode}).`,
              actionScreen: aud === "kitchen" ? "k-listings" : "n-requests",
            })
          }
          notify({
            audience: "user", userId: user.id, kind: "info",
            title: "Food request submitted",
            body: `Your request for ${quantity} × "${listing.title}" was sent to ${listing.providerName}. Track it in My Requests.`,
            actionScreen: "u-requests",
          })
          return { ok: true, message: "Request submitted! Track it in My Requests." }
        },
        respondToRequest: (requestId, action) => {
          const st = get()
          const req = st.requests.find((r) => r.id === requestId)
          if (!req) return
          const status = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "ready"
          set({ requests: st.requests.map((r) => (r.id === requestId ? { ...r, status } : r)) })
          if (action === "reject") {
            notify({ audience: "user", userId: req.userId, kind: "info", title: "Food request update", body: `${req.providerName} could not accept your request for "${req.listingTitle}" this time.`, actionScreen: "u-requests" })
            return
          }
          if (action === "accept" && req.mode === "delivery") {
            const listing = st.listings.find((l) => l.id === req.listingId)
            const from = st.organizations.find((o) => o.id === req.providerId)
            const to = st.users.find((u) => u.id === req.userId)
            // Destination: the requesting user's saved profile location when
            // available (never random offsets); approximate city centre only
            // as a demo fallback for seeded users without a saved location.
            const toCity = to ? cityCenter(to.city) : null
            const destLat = to?.location?.lat ?? toCity?.lat ?? from?.lat ?? 23.0225
            const destLng = to?.location?.lng ?? toCity?.lng ?? from?.lng ?? 72.5714
            const dReq: DeliveryRequest = {
              id: `d-${uid()}`, type: from?.type === "kitchen" ? "kitchen-consumer" : "ngo-consumer",
              title: `${req.listingTitle} → ${req.userName}`,
              pickupName: req.providerName, pickupArea: `${from?.address ?? ""}`, pickupCity: from?.city ?? "—",
              pickupLat: from?.lat ?? 23.0225, pickupLng: from?.lng ?? 72.5714,
              destName: `${req.userName} (delivery)`, destArea: to?.address ?? to?.city ?? "",
              destLat, destLng,
              foodDescription: req.listingTitle, quantity: req.quantity, unit: listing?.unit ?? "meals",
              requiredVehicle: req.quantity > 100 ? ["Van", "Mini Truck", "Truck"] : req.quantity > 30 ? ["Auto", "Car", "Van", "Mini Truck"] : ["Bicycle", "Bike", "Scooter", "Auto", "Car"],
              distanceKm: Math.round(haversineKm(from?.lat ?? 0, from?.lng ?? 0, destLat, destLng) * 1.3 * 10) / 10 || 4.5,
              etaMin: 20, status: "available", createdAt: nowIso(), linkedRequestId: req.id,
            }
            set({ deliveryRequests: [dReq, ...get().deliveryRequests] })
            notify({
              audience: "user", kind: "delivery-request",
              title: "Delivery request created",
              body: `Delivery for "${req.listingTitle}" is now visible to nearby delivery partners.`,
              actionScreen: "u-delivery",
            })
          }
          notify({
            audience: "user", userId: req.userId, kind: "request-accepted",
            title: action === "accept" ? "Food request accepted" : "Food ready for pickup",
            body: action === "accept"
              ? `${req.providerName} accepted your request for "${req.listingTitle}".`
              : `${req.providerName}: your food is ready! Please pick it up before the availability window ends.`,
            actionScreen: "u-requests",
          })
        },
        completeRequest: (requestId) => {
          const st = get()
          const req = st.requests.find((r) => r.id === requestId)
          if (!req) return
          set({
            requests: st.requests.map((r) => (r.id === requestId ? { ...r, status: "completed", completedAt: nowIso() } : r)),
            listings: st.listings.map((l) => {
              if (l.id !== req.listingId) return l
              const remaining = Math.max(0, l.quantityRemaining - req.quantity)
              return { ...l, quantityRemaining: remaining, status: remaining === 0 ? "completed" : l.status }
            }),
          })
          notify({
            audience: "user", userId: req.userId, kind: "info",
            title: "Pickup completed — thank you!",
            body: `You received "${req.listingTitle}". Please rate this experience to help others.`,
            actionScreen: "u-requests",
          })
        },
        cancelRequest: (requestId) => {
          const st = get()
          const req = st.requests.find((r) => r.id === requestId)
          const listing = st.listings.find((l) => l.id === req?.listingId)
          set({ requests: st.requests.map((r) => (r.id === requestId ? { ...r, status: "cancelled" } : r)) })
          if (req) notify({
            audience: listing?.providerType === "kitchen" ? "kitchen" : "ngo", orgId: req.providerId,
            kind: "info", title: "Request cancelled", body: `${req.userName} cancelled their request for "${req.listingTitle}".`,
          })
        },
        submitFeedback: (requestId, rating, comment) => {
          const st = get()
          const req = st.requests.find((r) => r.id === requestId)
          const user = st.users.find((u) => u.id === st.userId)
          if (!req || !user) return
          const listing = st.listings.find((l) => l.id === req.listingId)
          const providerType = listing?.providerType
          const fb: FeedbackItem = {
            id: `fb-${uid()}`, transactionId: requestId, fromName: user.name,
            toName: req.providerName, toRole: "provider", rating, comment, at: nowIso(),
          }
          set({ feedback: [fb, ...st.feedback] })
          notify({
            audience: providerType === "kitchen" ? "kitchen" : "ngo", orgId: req.providerId,
            kind: "info", title: "New feedback received",
            body: `${user.name} rated "${req.listingTitle}" ${rating}★${comment ? ` — "${comment}"` : ""}`,
            actionScreen: providerType === "kitchen" ? "k-reports" : "n-feedback",
          })
        },
        createDonation: (data) => {
          const st = get()
          const user = st.users.find((u) => u.id === st.userId)
          const org = st.organizations.find((o) => o.id === st.orgId)
          if (!user && !org) return { ok: false, message: "Not logged in." }
          const provider = user ?? org!
          const isUser = !!user
          // Location resolution order (per spec):
          //   1. explicit map-picked location passed by the donation form
          //   2. provider's saved profile/organization location
          // NEVER random coordinates — "if the user says Surat, the donation
          // appears around Surat".
          const profileLoc = isUser ? user!.location : org!.location
          const fallbackCenter = cityCenter(isUser ? user!.city : org!.city)
          const loc = data.location ?? profileLoc ?? {
            lat: fallbackCenter.lat,
            lng: fallbackCenter.lng,
            address: data.pickupArea || (isUser ? user!.address : org!.address),
            city: isUser ? user!.city : org!.city,
            state: fallbackCenter.state,
            country: "India",
          }
          const listing: FoodListing = {
            id: `l-${uid()}`, title: data.title, foodCategory: data.foodCategory,
            quantityTotal: data.quantity, quantityRemaining: data.quantity, unit: data.unit,
            providerId: provider.id, providerName: isUser ? `${user!.name} (Individual)` : org!.name,
            providerType: isUser ? "user" : org!.type === "foodbank" ? "foodbank" : org!.type === "ngo" ? "ngo" : "kitchen",
            city: loc.city, area: data.pickupArea || loc.address,
            lat: loc.lat, lng: loc.lng,
            distanceKm: Math.round((1 + Math.random() * 7) * 10) / 10,
            availableUntil: new Date(Date.now() + data.availableHours * 3600_000).toISOString(),
            pickup: data.pickup, eatHere: data.eatHere, delivery: data.delivery,
            preparedAt: new Date(Date.now() - data.preparedHoursAgo * 3600_000).toISOString(),
            storage: data.storage, status: "active", createdAt: nowIso(),
            notes: data.notes, isIndividual: isUser, assessment: data.assessment,
          }
          set({ listings: [listing, ...st.listings] })
          notify({
            audience: "all", kind: "free-food",
            title: "New free food listed nearby",
            body: `${listing.title} — ${listing.quantityRemaining} ${listing.unit} at ${listing.area}, ${listing.city}. Available for ${data.availableHours} hours.`,
            actionScreen: "u-find",
          })
          notify({
            audience: "ngo", kind: "donation-received",
            title: isUser ? "Individual donation available" : "New free food listing",
            body: `${listing.providerName} listed "${listing.title}" (${listing.quantityRemaining} ${listing.unit}).`,
            actionScreen: "n-donations",
          })
          return { ok: true, message: "Donation listed successfully." }
        },

        // ---------------- COMMUNITY ASSISTANCE ----------------
        submitAssistance: (data) => {
          const st = get()
          const user = st.users.find((u) => u.id === st.userId)
          // Approximate area centre: when the submitter picks an approximate
          // point on the map it is jittered for privacy; otherwise the city
          // centre is used. Exact locations of vulnerable people are NEVER
          // stored or shown publicly.
          const cc = cityCenter(data.city)
          const baseLoc = data.approxLocation ?? { lat: cc.lat, lng: cc.lng }
          const a: CommunityAssistance = {
            id: `ca-${uid()}`, submittedByName: user?.name ?? "Anonymous user",
            submittedByPhone: user?.phone ?? "",
            area: data.area, city: data.city,
            lat: baseLoc.lat + (Math.random() - 0.5) * 0.01, lng: baseLoc.lng + (Math.random() - 0.5) * 0.01,
            peopleCount: data.peopleCount, foodNeeded: data.foodNeeded, description: data.description,
            hasProofPhoto: data.hasProofPhoto, status: "pending", createdAt: nowIso(),
          }
          set({ assistance: [a, ...st.assistance] })
          notify({
            audience: "ngo", kind: "community-help",
            title: "Community assistance request",
            body: `${data.peopleCount} people need food — ${data.area} (${data.city}). ${data.hasProofPhoto ? "Private proof photo attached (visible to authorized NGO only)." : "No proof photo attached."}`,
            actionScreen: "n-community",
          })
        },
        acceptAssistance: (id) => {
          const st = get()
          const org = st.organizations.find((o) => o.id === st.orgId)
          set({ assistance: st.assistance.map((a) => (a.id === id ? { ...a, status: "accepted", ngoName: org?.name ?? "NGO" } : a)) })
          notify({ audience: "all", kind: "community-help", title: "Assistance request accepted", body: `An NGO accepted the community assistance request (${st.assistance.find((a) => a.id === id)?.area ?? "area"}). Assignment in progress.`, actionScreen: "n-community" })
        },
        assignAssistance: (id, kind, name, partnerId) => {
          const st = get()
          const a = st.assistance.find((x) => x.id === id)
          if (!a) return
          if (kind === "volunteer") {
            set({ assistance: st.assistance.map((x) => (x.id === id ? { ...x, status: "assigned", assignedTo: name, assignedKind: "volunteer" } : x)) })
            notify({ audience: "all", kind: "community-help", title: "Volunteer assigned", body: `${name} will handle the assistance request at ${a.area}.`, actionScreen: "n-community" })
            return
          }
          const partner = st.partners.find((p) => p.id === partnerId)
          if (!partner) return
          // Pickup point: the accepting NGO's saved location (map picker at
          // registration) — never a hard-coded street address.
          const ngoOrg = st.organizations.find((o) => o.name === a.ngoName) ?? st.organizations.find((o) => o.id === st.orgId)
          const dReq: DeliveryRequest = {
            id: `d-${uid()}`, type: "community",
            title: `Community assistance → ${a.area}`,
            pickupName: a.ngoName ?? "Accepting NGO",
            pickupArea: ngoOrg?.address ?? ngoOrg?.city ?? a.city,
            pickupCity: ngoOrg?.city ?? a.city,
            pickupLat: ngoOrg?.lat ?? cityCenter(a.city).lat,
            pickupLng: ngoOrg?.lng ?? cityCenter(a.city).lng,
            destName: a.area, destArea: `${a.area}, ${a.city}`, destLat: a.lat, destLng: a.lng,
            foodDescription: a.foodNeeded, quantity: a.peopleCount, unit: "meals",
            requiredVehicle: a.peopleCount > 60 ? ["Van", "Mini Truck", "Truck"] : ["Bike", "Scooter", "Auto", "Car", "Van"],
            distanceKm: 4.0, etaMin: 22, status: "available", createdAt: nowIso(), linkedAssistanceId: a.id,
          }
          set({
            assistance: st.assistance.map((x) => (x.id === id ? { ...x, status: "assigned", assignedTo: partner.name, assignedKind: "partner" } : x)),
            deliveryRequests: [dReq, ...st.deliveryRequests],
          })
          notify({ audience: "user", kind: "delivery-request", title: "Delivery request created", body: `Community assistance delivery for ${a.peopleCount} people is now visible to delivery partners.`, actionScreen: "u-delivery" })
        },
        completeAssistance: (id) => {
          const st = get()
          const a = st.assistance.find((x) => x.id === id)
          set({ assistance: st.assistance.map((x) => (x.id === id ? { ...x, status: "completed" } : x)) })
          if (a) notify({ audience: "all", kind: "community-help", title: "Assistance completed", body: `Food delivered to ${a.area} — ${a.peopleCount} people served. Thank you!`, actionScreen: "n-community" })
        },

        // ---------------- NGO ----------------
        acceptIncomingDonation: (listingId) => {
          const st = get()
          const listing = st.listings.find((l) => l.id === listingId)
          const org = st.organizations.find((o) => o.id === st.orgId)
          if (!listing || !org) return
          const item: InventoryItem = {
            id: `i-${uid()}`, orgId: org.id, name: listing.title,
            category: listing.foodCategory === "Packaged" || listing.foodCategory === "Groceries" || listing.foodCategory === "Bakery" ? "packaged" : "prepared",
            quantity: listing.quantityRemaining, unit: listing.unit, batch: `DN-${uid().toUpperCase().slice(0, 5)}`,
            addedAt: nowIso(), expiryAt: listing.availableUntil, storage: org.storageAvailable ? "NGO Store" : "Ambient Shelf",
            status: "ok", valuePerUnit: listing.foodCategory === "Groceries" ? 250 : 35,
          }
          set({
            inventory: [item, ...st.inventory],
            listings: st.listings.map((l) => (l.id === listingId ? { ...l, status: "completed", quantityRemaining: 0 } : l)),
          })
          notify({
            audience: "user", userId: listing.providerId, kind: "donation-received",
            title: "Your donation was accepted",
            body: `${org.name} accepted "${listing.title}" (${listing.quantityRemaining} ${listing.unit}). It is now in their inventory for redistribution.`,
          })
          notify({
            audience: "ngo", orgId: org.id, kind: "donation-received",
            title: "Donation added to inventory",
            body: `"${listing.title}" (${listing.quantityRemaining} ${listing.unit}) added. Plan redistribution before expiry.`,
            actionScreen: "n-inventory",
          })
        },
        addVolunteer: (v) => {
          const st = get()
          if (!st.orgId) return
          set({ volunteers: [...st.volunteers, { ...v, id: `v-${uid()}`, ngoId: st.orgId }] })
        },
        toggleVolunteer: (id) => set({ volunteers: get().volunteers.map((v) => (v.id === id ? { ...v, active: !v.active } : v)) }),
        addBeneficiary: (b) => {
          const st = get()
          if (!st.orgId) return
          set({ beneficiaries: [...st.beneficiaries, { ...b, id: `b-${uid()}`, ngoId: st.orgId }] })
        },
        assignRequestVolunteer: (requestId, volunteerName) => {
          const st = get()
          const req = st.requests.find((r) => r.id === requestId)
          set({
            requests: st.requests.map((r) => (r.id === requestId ? { ...r, status: "delivering" } : r)),
            volunteers: st.volunteers.map((v) => (v.name === volunteerName ? { ...v, currentTask: `Deliver "${r2name(req?.listingTitle)}" to ${req?.userName}` } : v)),
          })
          if (req) notify({
            audience: "user", userId: req.userId, kind: "request-accepted",
            title: "Delivery assigned", body: `${req.providerName} assigned volunteer ${volunteerName} for your "${req.listingTitle}" request.`,
            actionScreen: "u-requests",
          })
        },

        // ---------------- DELIVERY ----------------
        acceptDelivery: (deliveryId) => {
          const st = get()
          const user = st.users.find((u) => u.id === st.userId)
          const d = st.deliveryRequests.find((x) => x.id === deliveryId)
          if (!user || !d) return
          set({ deliveryRequests: st.deliveryRequests.map((x) => (x.id === deliveryId ? { ...x, status: "accepted", partnerId: user.id, partnerName: user.name } : x)) })
          notify({ audience: "all", kind: "delivery-accepted", title: "Delivery accepted", body: `${user.name} accepted: ${d.title}.`, actionScreen: "u-delivery" })
          if (d.linkedRequestId) {
            set({ requests: get().requests.map((r) => (r.id === d.linkedRequestId ? { ...r, status: "delivering" } : r)) })
          }
        },
        declineDelivery: (deliveryId) => set({ deliveryRequests: get().deliveryRequests.map((x) => (x.id === deliveryId ? { ...x, status: "declined" } : x)) }),
        advanceDelivery: (deliveryId) => {
          const st = get()
          const d = st.deliveryRequests.find((x) => x.id === deliveryId)
          if (!d) return
          const next = d.status === "accepted" ? "at-pickup" : d.status === "at-pickup" ? "in-transit" : "delivered"
          set({ deliveryRequests: st.deliveryRequests.map((x) => (x.id === deliveryId ? { ...x, status: next } : x)) })
          if (next === "in-transit") {
            notify({ audience: "all", kind: "info", title: "Picked up", body: `${d.title} — food picked up and in transit.`, actionScreen: "u-delivery" })
          }
          if (next === "delivered") {
            notify({ audience: "all", kind: "info", title: "Delivered 🎉", body: `${d.title} — delivery completed. Thank you!`, actionScreen: "u-delivery" })
            if (d.linkedRequestId) {
              const req = get().requests.find((r) => r.id === d.linkedRequestId)
              if (req) {
                set({
                  requests: get().requests.map((r) => (r.id === d.linkedRequestId ? { ...r, status: "completed", completedAt: nowIso() } : r)),
                  listings: get().listings.map((l) => {
                    if (l.id !== req.listingId) return l
                    const remaining = Math.max(0, l.quantityRemaining - req.quantity)
                    return { ...l, quantityRemaining: remaining, status: remaining === 0 ? "completed" : l.status }
                  }),
                })
                notify({ audience: "user", userId: req.userId, kind: "info", title: "Your food was delivered", body: `"${req.listingTitle}" was delivered. Please rate this experience.`, actionScreen: "u-requests" })
              }
            }
            if (d.linkedAssistanceId) {
              set({ assistance: get().assistance.map((a) => (a.id === d.linkedAssistanceId ? { ...a, status: "completed" } : a)) })
            }
          }
        },

        // ---------------- KITCHEN ----------------
        savePreset: (name, foodType, meals, ingredients) => {
          const st = get()
          if (!st.role) return
          const ownerId = st.userId ?? st.orgId ?? "anon"
          const preset: MealPreset = { id: `mp-${uid()}`, ownerId, ownerRole: st.role, name, foodType, meals, ingredients, createdAt: nowIso() }
          set({ presets: [preset, ...st.presets] })
        },
        deletePreset: (id) => set({ presets: get().presets.filter((p) => p.id !== id) }),
        runPlanner: (foodType, people) => planMeal(foodType, people),
        recalcPlanner: (ingredients, meals, foodType) => recalcFromIngredients(ingredients, meals, foodType),
        addForecast: (registrations, dayType, historicalAvg) => {
          const f = forecastDemand(registrations, dayType, historicalAvg)
          const rec: DemandForecast = {
            id: `f-${uid()}`, date: new Date().toISOString().slice(0, 10), dayType: dayType as DemandForecast["dayType"],
            registrations, attendanceRate: f.attendanceRate, expectedAttendance: f.expectedAttendance,
            recommendedProduction: f.recommendedProduction, expectedSurplus: f.expectedSurplus,
            confidence: f.confidence, createdAt: nowIso(),
          }
          set({ forecasts: [rec, ...get().forecasts] })
          return rec
        },
        addForecastRecord: (rec) => set({ forecasts: [rec, ...get().forecasts] }),
        recordForecastActuals: (forecastId, actualProduction, actualConsumption) => {
          set({
            forecasts: get().forecasts.map((f) =>
              f.id === forecastId ? { ...f, actualProduction, actualConsumption, actualSurplus: Math.max(0, actualProduction - actualConsumption) } : f,
            ),
          })
        },
        createProduction: (foodType, planned, actual) => {
          const st = get()
          const rec: ProductionRecord = {
            id: `pr-${uid()}`, date: new Date().toISOString().slice(0, 10), foodType,
            planned, actual, consumed: 0, surplus: 0, status: "planned", createdAt: nowIso(),
          }
          set({ productions: [rec, ...st.productions] })
          notify({ audience: "kitchen", orgId: st.orgId ?? undefined, kind: "production-warning", title: "Production recorded", body: `${foodType}: planned ${planned}, produced ${actual}. Record consumption later to track surplus.`, actionScreen: "k-production" })
        },
        recordConsumption: (productionId, consumed) => {
          const st = get()
          const p = st.productions.find((x) => x.id === productionId)
          if (!p || !st.orgId) return
          const surplus = Math.max(0, p.actual - consumed)
          set({ productions: st.productions.map((x) => (x.id === productionId ? { ...x, consumed, surplus, status: "completed" } : x)) })
          if (surplus > 0) {
            const item: InventoryItem = {
              id: `i-${uid()}`, orgId: st.orgId, name: `${p.foodType} (surplus batch)`, category: "prepared",
              quantity: surplus, unit: "meals", batch: `PR-${uid().toUpperCase().slice(0, 5)}`, addedAt: nowIso(),
              expiryAt: new Date(Date.now() + 5 * 3600_000).toISOString(), storage: "Hot Case", status: surplus > p.actual * 0.15 ? "attention" : "ok",
            }
            set({ inventory: [item, ...get().inventory] })
            notify({
              audience: "kitchen", orgId: st.orgId, kind: "production-warning",
              title: surplus > p.actual * 0.15 ? "High surplus alert" : "Surplus recorded",
              body: `${surplus} surplus ${p.foodType} meals added to inventory. ${surplus > p.actual * 0.15 ? "Above 15% — consider a free donation listing now." : "Consider listing as free donation."}`,
              actionScreen: "k-surplus",
            })
          }
        },
        addInventoryItem: (item) => {
          const st = get()
          if (!st.orgId) return
          set({ inventory: [{ ...item, id: `i-${uid()}`, orgId: st.orgId, status: "ok" }, ...st.inventory] })
        },
        updateInventoryItem: (id, patch) => set({ inventory: get().inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)) }),
        transferInventoryItem: (id, newStorage) => {
          set({ inventory: get().inventory.map((i) => (i.id === id ? { ...i, storage: newStorage } : i)) })
          notify({ audience: "kitchen", kind: "info", title: "Inventory transferred", body: `Item moved to ${newStorage}.` , actionScreen: "k-inventory" })
        },
        donateInventoryItem: (id, qty) => {
          const st = get()
          const item = st.inventory.find((i) => i.id === id)
          if (!item || !st.orgId) return
          const org = st.organizations.find((o) => o.id === st.orgId)
          const donateQty = Math.min(qty, item.quantity)
          const orgLoc = org?.location ?? (org ? { lat: org.lat, lng: org.lng, address: org.address, city: org.city, state: org.state ?? "—", country: "India" } : null)
          const cc = cityCenter(org?.city ?? "Ahmedabad")
          const listing: FoodListing = {
            id: `l-${uid()}`, title: `Free ${item.name}`, foodCategory: item.category === "raw" ? "Raw Ingredients" : item.category === "prepared" ? "Cooked Meal" : "Packaged",
            quantityTotal: donateQty, quantityRemaining: donateQty, unit: item.unit,
            providerId: st.orgId, providerName: org?.name ?? "Kitchen", providerType: org?.type === "ngo" ? "ngo" : org?.type === "foodbank" ? "foodbank" : "kitchen",
            city: org?.city ?? "—", area: orgLoc?.address.split(",").slice(-2).join(",").trim() || org?.city || "—",
            lat: orgLoc?.lat ?? cc.lat, lng: orgLoc?.lng ?? cc.lng,
            distanceKm: Math.round((1 + Math.random() * 6) * 10) / 10,
            availableUntil: item.expiryAt ?? new Date(Date.now() + 24 * 3600_000).toISOString(),
            pickup: true, eatHere: item.category === "prepared", delivery: true,
            preparedAt: item.addedAt, storage: item.storage, status: "active", createdAt: nowIso(),
            notes: `Listed from inventory batch ${item.batch}.`,
          }
          const remaining = item.quantity - donateQty
          set({
            listings: [listing, ...st.listings],
            inventory: st.inventory.map((i) => (i.id === id ? { ...i, quantity: remaining } : i)).filter((i) => i.quantity > 0.01),
          })
          notify({ audience: "all", kind: "free-food", title: "New free food listed", body: `${listing.title} — ${donateQty} ${listing.unit} at ${listing.providerName}.`, actionScreen: "u-find" })
          notify({ audience: "ngo", kind: "donation-received", title: "Donation available", body: `${org?.name} listed ${item.name} (${donateQty} ${item.unit}) for free redistribution.`, actionScreen: "n-donations" })
        },
        recoverInventoryItem: (id, qty, partnerId) => {
          const st = get()
          const item = st.inventory.find((i) => i.id === id)
          const partner = st.recoveryPartners.find((p) => p.id === partnerId)
          if (!item || !partner || !st.orgId) return
          const recQty = Math.min(qty, item.quantity)
          const handoff: RecoveryHandoff = {
            id: `rh-${uid()}`, partnerId: partner.id, partnerName: partner.name,
            itemName: item.name, quantity: recQty, unit: item.unit, status: "scheduled", createdAt: nowIso(),
          }
          const remaining = item.quantity - recQty
          set({
            recoveryHandoffs: [handoff, ...st.recoveryHandoffs],
            inventory: st.inventory.map((i) => (i.id === id ? { ...i, quantity: remaining } : i)).filter((i) => i.quantity > 0.01),
          })
          notify({
            audience: "kitchen", orgId: st.orgId, kind: "info",
            title: "Recovery handoff scheduled",
            body: `${recQty} ${item.unit} of ${item.name} → ${partner.name}. Collection scheduled (demo).`,
            actionScreen: "k-sustainability",
          })
        },
        runAssessment: (input) => {
          const out = assessFood(input)
          const ai = input.ai
          const rec: FoodAssessment = {
            id: `a-${uid()}`, createdAt: nowIso(), foodName: input.foodName, method: input.method,
            hoursSincePrepared: input.hoursSincePrepared, storageCondition: input.storageCondition,
            result: ai ? ai.result : out.result,
            reasons: ai ? ai.reasons : out.reasons,
            extractedText: out.extractedText, dateLabel: ai?.dateLabel ?? out.dateLabel,
            source: ai ? "ai" : "demo",
            confidence: ai?.confidence,
            humanReviewRequired: ai?.humanReviewRequired,
          }
          set({ assessments: [rec, ...get().assessments] })
          return rec
        },
        setSensorMode: (deviceId, mode) => {
          const st = get()
          const sensor = st.sensors.find((s) => s.id === deviceId)
          if (!sensor) return
          const baseTemp = sensor.type === "freezer" ? -18 : sensor.type === "ambient" ? 29.5 : 4.2
          const temp = mode === "normal" ? baseTemp : mode === "warning" ? baseTemp + 4.6 : baseTemp + 8.3
          const reading: SensorReading = {
            id: `sr-${uid()}`, deviceId, at: nowIso(), temperature: Math.round(temp * 10) / 10,
            humidity: 60 + Math.round(Math.random() * 15), status: mode, source: "simulated",
          }
          set({
            sensors: st.sensors.map((s) => (s.id === deviceId ? { ...s, mode } : s)),
            sensorReadings: [...st.sensorReadings.slice(-500), reading],
          })
          if (mode !== "normal") {
            notify({
              audience: "kitchen", orgId: sensor.orgId, kind: "storage-warning",
              title: `${sensor.name} — SIMULATED ${mode.toUpperCase()}`,
              body: `Simulated temperature reading ${reading.temperature}°C is ${mode === "warning" ? "above the recommended range" : "CRITICAL — outside safe range"}. Source: Simulated sensor.`,
              actionScreen: "k-iot",
            })
          } else {
            notify({ audience: "kitchen", orgId: sensor.orgId, kind: "info", title: `${sensor.name} back to normal`, body: `Simulated reading ${reading.temperature}°C — within recommended range.`, actionScreen: "k-iot" })
          }
        },

        // ---------------- SECONDARY BUYER ----------------
        placeBuyerOrder: (listingId, quantity, intendedUse) => {
          const listing = get().buyerListings.find((b) => b.id === listingId)
          if (!listing) return { ok: false, message: "Listing not found." }
          if (listing.quantity < quantity) return { ok: false, message: `Only ${listing.quantity} ${listing.unit} available in this lot.` }

          const orderId = `ord-byr-${uid()}`
          const pickupToken = `SF-BYR-${Math.floor(1000 + Math.random() * 9000)}`
          const totalAmount = Math.round(quantity * listing.clearancePrice)
          const totalSavings = Math.round(quantity * (listing.mrpPerUnit - listing.clearancePrice))

          const newOrder: BuyerOrder = {
            id: orderId,
            buyerId: get().userId ?? "u-buyer01",
            buyerName: get().buyerProfile?.businessName ?? "GreenCycle Processors",
            listingId,
            listingTitle: listing.title,
            providerName: listing.providerName,
            providerType: listing.providerType,
            quantity,
            unit: listing.unit,
            pricePerUnit: listing.clearancePrice,
            totalAmount,
            totalSavings,
            intendedUse,
            pickupToken,
            pickupAddress: listing.address,
            city: listing.city,
            status: "ready-for-pickup",
            orderedAt: nowIso(),
            pickupBefore: listing.expiryAt,
          }

          const updatedListings = get().buyerListings.map((b) => {
            if (b.id !== listingId) return b
            const rem = b.quantity - quantity
            return { ...b, quantity: rem, status: rem <= 0 ? "sold" as const : b.status }
          })

          set({
            buyerOrders: [newOrder, ...get().buyerOrders],
            buyerListings: updatedListings,
          })

          notify({
            audience: "buyer",
            kind: "info",
            title: "Pickup Pass Generated!",
            body: `Order ${pickupToken} for ${quantity} ${listing.unit} confirmed at ${listing.providerName}. Clearance rate: ₹${listing.clearancePrice}/${listing.unit}.`,
            actionScreen: "b-orders",
          })

          return { ok: true, message: `Order reserved! Pickup token: ${pickupToken}`, order: newOrder }
        },

        completeBuyerOrder: (orderId) => {
          set({
            buyerOrders: get().buyerOrders.map((o) => o.id === orderId ? { ...o, status: "completed" } : o),
          })
          notify({
            audience: "buyer",
            kind: "info",
            title: "Surplus Lot Collected",
            body: "Order marked as collected. Food rescued from landfill!",
            actionScreen: "b-orders",
          })
        },

        addBuyerAlert: (alert) => {
          const newAlert: BuyerAlert = {
            id: `ba-${uid()}`,
            buyerId: get().userId ?? "u-buyer01",
            keyword: alert.keyword,
            category: alert.category,
            maxPricePerUnit: alert.maxPricePerUnit,
            minQuantity: alert.minQuantity,
            city: get().buyerProfile?.city ?? "Ahmedabad",
            active: true,
            createdAt: nowIso(),
          }
          set({ buyerAlerts: [newAlert, ...get().buyerAlerts] })
          notify({
            audience: "buyer",
            kind: "info",
            title: "Procurement Alert Saved",
            body: `We will notify you when surplus batches matching "${alert.keyword}" are posted.`,
            actionScreen: "b-sourcing",
          })
        },

        toggleBuyerAlert: (alertId) => {
          set({
            buyerAlerts: get().buyerAlerts.map((a) => a.id === alertId ? { ...a, active: !a.active } : a),
          })
        },

        deleteBuyerAlert: (alertId) => {
          set({ buyerAlerts: get().buyerAlerts.filter((a) => a.id !== alertId) })
        },

        updateBuyerProfile: (patch) => {
          set({ buyerProfile: { ...get().buyerProfile, ...patch } })
        },

        // ---------------- NOTIFICATIONS ----------------
        markNotificationRead: (id) => set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }),
        markAllNotificationsRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),

        // ---------------- SYSTEM ----------------
        resetDemoData: () => {
          set({
            ...seedState(),
            role: null, userId: null, orgId: null, screen: "login",
          })
        },
      }
    },
    {
      name: "smartfood-demo-v2",
      version: 2,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

function r2name(title?: string) {
  return title ?? "food"
}

// ---------- selectors / helpers ----------
export function useCurrentUser() {
  return useStore((s) => s.users.find((u) => u.id === s.userId) ?? null)
}
export function useCurrentOrg() {
  return useStore((s) => s.organizations.find((o) => o.id === s.orgId) ?? null)
}
export function useCurrentBuyer() {
  return useStore((s) => s.buyerProfile)
}
export function useMyNotifications() {
  return useStore(
    useShallow((s) =>
      s.notifications.filter((n) => {
        if (s.role === "user") {
          if (n.audience !== "user" && n.audience !== "all") return false
          return !n.userId || n.userId === s.userId
        }
        if (s.role === "ngo") return (n.audience === "ngo" || n.audience === "all") && (!n.orgId || n.orgId === s.orgId)
        if (s.role === "kitchen") return (n.audience === "kitchen" || n.audience === "all") && (!n.orgId || n.orgId === s.orgId)
        if (s.role === "buyer") return n.audience === "buyer" || n.audience === "all"
        return n.audience === "all"
      }),
    ),
  )
}
export function unreadCount(notifs: AppNotification[]) {
  return notifs.filter((n) => !n.read).length
}
export { haversineKm }
