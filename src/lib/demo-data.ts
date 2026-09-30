// ============================================================
// SmartFood AI — Demo Seed Data (Streamlined & Interconnected)
// High-fidelity operational data centered in Ahmedabad
// (Navrangpura, Bodakdev, Paldi, Vatva, Naroda)
// ============================================================
import type {
  AppNotification, AppUser, Beneficiary, CommunityAssistance, DeliveryRequest,
  DemandForecast, EnergyRecord, FeedbackItem, FoodAssessment, FoodListing,
  FoodRequest, GeoLocation, InventoryItem, MachineRecord, Organization, ProductionRecord,
  RecoveryHandoff, RecoveryPartner, SensorDevice, SensorReading, StandalonePartner,
  Volunteer, BuyerListing, BuyerOrder, BuyerAlert, BuyerProfile,
} from "./types"
import { cityCenter } from "./cities"

const now = Date.now()
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const iso = (offset: number) => new Date(now + offset).toISOString()
const round2 = (n: number) => Math.round(n * 100) / 100

/** Build a consistent GeoLocation */
const loc = (lat: number, lng: number, address: string, city = "Ahmedabad"): GeoLocation => {
  const cc = cityCenter(city)
  return { lat, lng, address, city, state: cc.state, country: "India" }
}

// ---------- 1. Demo Login Users & Delivery Profiles ----------
export const seedUsers: AppUser[] = [
  {
    id: "u-user01",
    username: "user01",
    password: "user123",
    name: "Rahul Sharma",
    phone: "98765 43210",
    email: "rahul.demo@smartfood.ai",
    city: "Ahmedabad",
    address: "CG Road, Navrangpura, Ahmedabad",
    location: loc(23.0365, 72.5610, "CG Road, Navrangpura, Ahmedabad"),
    joinedAt: iso(-120 * DAY),
    donorMode: true,
    deliveryMode: false,
  },
  {
    id: "u-amit",
    username: "amit.demo",
    password: "demo123",
    name: "Amit Mehta",
    phone: "99001 33445",
    email: "amit.mehta@smartfood.ai",
    city: "Ahmedabad",
    address: "Maninagar, Ahmedabad",
    location: loc(22.9965, 72.6005, "Maninagar, Ahmedabad"),
    joinedAt: iso(-60 * DAY),
    donorMode: false,
    deliveryMode: true,
    deliveryProfile: {
      city: "Ahmedabad",
      serviceArea: "Navrangpura, Paldi, Maninagar, Vatva",
      vehicleType: "Bike",
      capacity: 40,
      vehicleDetails: "Honda Activa (GJ-01-AB-4021)",
      availability: "Full-time / Active",
      communityAssistance: true,
      preferences: ["Kitchen → Consumer", "NGO → Consumer", "Community Assistance"],
      active: true,
    },
  },
  {
    id: "u-buyer01",
    username: "buyer01",
    password: "buyer123",
    name: "Vikram Singhania",
    phone: "98240 55667",
    email: "vikram@greencycle.demo",
    city: "Ahmedabad",
    address: "Plot 42, GIDC Industrial Estate, Naroda, Ahmedabad",
    location: loc(23.0825, 72.6514, "Plot 42, GIDC Naroda, Ahmedabad"),
    joinedAt: iso(-45 * DAY),
    donorMode: false,
    deliveryMode: false,
  },
]

// ---------- 2. Demo Primary Organizations ----------
export const seedOrganizations: Organization[] = [
  {
    id: "org-helping-hands",
    username: "ngo01",
    password: "ngo123",
    name: "Helping Hands NGO",
    type: "ngo",
    city: "Ahmedabad",
    state: "Gujarat",
    address: "12 Ashram Road, Navrangpura, Ahmedabad",
    lat: 23.0369,
    lng: 72.5612,
    location: loc(23.0369, 72.5612, "12 Ashram Road, Navrangpura, Ahmedabad"),
    phone: "079 4000 1122",
    contactPerson: "Meera Desai",
    status: "verified-demo",
    description: "Active NGO managing community meal distribution, daily langar, and urgent food relief.",
    ngoType: "Community Meals",
    registrationNumber: "GJ/AHM/NGO/2023/1042",
    storageAvailable: true,
    estimatedBeneficiaries: 850,
  },
  {
    id: "org-green-plate",
    username: "kitchen01",
    password: "kitchen123",
    name: "Green Plate Kitchen",
    type: "kitchen",
    city: "Ahmedabad",
    state: "Gujarat",
    address: "Plot 8, GIDC Phase II, Vatva, Ahmedabad",
    lat: 22.9868,
    lng: 72.6241,
    location: loc(22.9868, 72.6241, "Plot 8, GIDC Phase II, Vatva, Ahmedabad"),
    phone: "079 4000 5566",
    contactPerson: "Suresh Agarwal",
    status: "verified-demo",
    description: "Institutional central kitchen with 1,800 meals/day capacity and IoT cold storage monitoring.",
    kitchenType: "Institutional / Community Kitchen",
    dailyCapacity: 1800,
    storageCapability: "Cold storage (2 units) + Dry ration warehouse",
    licenseInfo: "FSSAI 10723001000452",
  },
  {
    id: "org-care-foodbank",
    username: "foodbank.demo",
    password: "demo123",
    name: "Community Care Food Bank",
    type: "foodbank",
    city: "Ahmedabad",
    state: "Gujarat",
    address: "SG Highway, Bodakdev, Ahmedabad",
    lat: 23.0376,
    lng: 72.5063,
    location: loc(23.0376, 72.5063, "SG Highway, Bodakdev, Ahmedabad"),
    phone: "079 4000 3344",
    contactPerson: "Rakesh Iyer",
    status: "verified-demo",
    description: "Regional dry ration and bulk inventory storage depot.",
    ngoType: "Food Bank",
    registrationNumber: "GJ/AHM/FB/2022/0088",
    storageAvailable: true,
    estimatedBeneficiaries: 1200,
  },
]

// ---------- 3. Delivery Fleet Partners ----------
export const seedPartners: StandalonePartner[] = [
  {
    id: "p-mohit",
    name: "Mohit Vaghela (Eco-Logistics)",
    phone: "98250 77701",
    profile: {
      city: "Ahmedabad",
      serviceArea: "Navrangpura, Paldi, CG Road, Ashram Road",
      vehicleType: "Auto",
      capacity: 120,
      vehicleDetails: "Bajaj CNG Maxima (GJ-01-CZ-8821)",
      availability: "Daily 8 AM – 8 PM",
      communityAssistance: true,
      preferences: ["Kitchen → NGO", "NGO → Consumer", "Community Assistance"],
      active: true,
    },
    rating: 4.8,
    completedDeliveries: 156,
  },
  {
    id: "p-jignesh",
    name: "Jignesh Patel (Bulk Transport)",
    phone: "98250 77702",
    profile: {
      city: "Ahmedabad",
      serviceArea: "Vatva GIDC, Naroda, Narol, Bodakdev",
      vehicleType: "Mini Truck",
      capacity: 800,
      vehicleDetails: "Tata Ace EV (GJ-27-TT-1092)",
      availability: "Weekdays",
      communityAssistance: false,
      preferences: ["Kitchen → NGO", "User → NGO"],
      active: true,
    },
    rating: 4.9,
    completedDeliveries: 94,
  },
]

// ---------- 4. Active Real-Time Food Listings ----------
export const seedListings: FoodListing[] = [
  {
    id: "l-001",
    title: "Fresh Dal Rice Combo",
    foodCategory: "Cooked Meal",
    quantityTotal: 60,
    quantityRemaining: 45,
    unit: "meals",
    providerId: "org-helping-hands",
    providerName: "Helping Hands NGO",
    providerType: "ngo",
    city: "Ahmedabad",
    area: "Ashram Road, Navrangpura",
    lat: 23.0369,
    lng: 72.5612,
    distanceKm: 1.2,
    availableUntil: iso(4 * HOUR),
    pickup: true,
    eatHere: true,
    delivery: true,
    preparedAt: iso(1.5 * HOUR),
    storage: "Hot case (kept above 65°C)",
    status: "active",
    createdAt: iso(-1 * HOUR),
    notes: "Freshly prepared wholesome dal rice from midday seva.",
  },
  {
    id: "l-002",
    title: "Nutritious Moong Khichdi & Kadhi",
    foodCategory: "Cooked Meal",
    quantityTotal: 50,
    quantityRemaining: 28,
    unit: "meals",
    providerId: "org-green-plate",
    providerName: "Green Plate Kitchen",
    providerType: "kitchen",
    city: "Ahmedabad",
    area: "Vatva GIDC Phase II",
    lat: 22.9868,
    lng: 72.6241,
    distanceKm: 5.8,
    availableUntil: iso(5 * HOUR),
    pickup: true,
    eatHere: false,
    delivery: true,
    preparedAt: iso(2 * HOUR),
    storage: "Refrigerated hygienic containers",
    status: "active",
    createdAt: iso(-2 * HOUR),
    notes: "Surplus institutional kitchen lunch batch. AI Quality Inspection: Grade A.",
  },
  {
    id: "l-003",
    title: "Soft Roti & Mixed Veg Sabzi",
    foodCategory: "Cooked Meal",
    quantityTotal: 80,
    quantityRemaining: 60,
    unit: "meals",
    providerId: "org-helping-hands",
    providerName: "Helping Hands NGO",
    providerType: "ngo",
    city: "Ahmedabad",
    area: "Navrangpura",
    lat: 23.0369,
    lng: 72.5612,
    distanceKm: 1.2,
    availableUntil: iso(3 * HOUR),
    pickup: true,
    eatHere: true,
    delivery: true,
    preparedAt: iso(1 * HOUR),
    storage: "Insulated hot cases",
    status: "active",
    createdAt: iso(-45 * MIN),
    notes: "Langar surplus — available for direct pickup or delivery assistance.",
  },
  {
    id: "l-004",
    title: "Fortified Biscuit & Cereal Packs",
    foodCategory: "Packaged",
    quantityTotal: 100,
    quantityRemaining: 80,
    unit: "packs",
    providerId: "org-care-foodbank",
    providerName: "Community Care Food Bank",
    providerType: "foodbank",
    city: "Ahmedabad",
    area: "Bodakdev",
    lat: 23.0376,
    lng: 72.5063,
    distanceKm: 4.5,
    availableUntil: iso(5 * DAY),
    pickup: true,
    eatHere: false,
    delivery: true,
    preparedAt: iso(-2 * DAY),
    storage: "Dry clean warehouse",
    status: "active",
    createdAt: iso(-6 * HOUR),
    notes: "Surplus packaged snack lots from manufacturer batch.",
  },
]

// ---------- 5. Food Claims & Requests ----------
export const seedRequests: FoodRequest[] = [
  {
    id: "r-001",
    userId: "u-user01",
    userName: "Rahul Sharma",
    userPhone: "98765 43210",
    listingId: "l-001",
    listingTitle: "Fresh Dal Rice Combo",
    providerId: "org-helping-hands",
    providerName: "Helping Hands NGO",
    quantity: 2,
    mode: "pickup",
    status: "ready",
    createdAt: iso(-30 * MIN),
  },
  {
    id: "r-002",
    userId: "u-user01",
    userName: "Rahul Sharma",
    userPhone: "98765 43210",
    listingId: "l-002",
    listingTitle: "Nutritious Moong Khichdi & Kadhi",
    providerId: "org-green-plate",
    providerName: "Green Plate Kitchen",
    quantity: 4,
    mode: "delivery",
    status: "requested",
    createdAt: iso(-15 * MIN),
  },
]

// ---------- 6. Community Assistance Requests ----------
export const seedAssistance: CommunityAssistance[] = [
  {
    id: "ca-001",
    submittedByName: "Rahul Sharma",
    submittedByPhone: "98765 43210",
    area: "Near Kalupur Railway Station",
    city: "Ahmedabad",
    lat: 23.0285,
    lng: 72.5995,
    peopleCount: 15,
    foodNeeded: "Warm Evening Meals (15 people)",
    description: "Daily wage families and elderly stranded near station shelter. Need warm packed meals.",
    hasProofPhoto: true,
    status: "pending",
    createdAt: iso(-45 * MIN),
  },
  {
    id: "ca-002",
    submittedByName: "Amit Mehta",
    submittedByPhone: "99001 33445",
    area: "Paldi Bus Terminus Shelter",
    city: "Ahmedabad",
    lat: 23.0145,
    lng: 72.5630,
    peopleCount: 8,
    foodNeeded: "Nutritious Dinner Packets (8 people)",
    description: "Sheltered night workers needing hygienic dinner packets.",
    hasProofPhoto: false,
    status: "accepted",
    ngoName: "Helping Hands NGO",
    createdAt: iso(-90 * MIN),
  },
]

// ---------- 7. Delivery Requests ----------
export const seedDeliveries: DeliveryRequest[] = [
  {
    id: "d-001",
    type: "kitchen-ngo",
    title: "Surplus Khichdi → Helping Hands NGO",
    pickupName: "Green Plate Kitchen",
    pickupArea: "Vatva GIDC, Ahmedabad",
    pickupCity: "Ahmedabad",
    pickupLat: 22.9868,
    pickupLng: 72.6241,
    destName: "Helping Hands NGO",
    destArea: "Ashram Road, Navrangpura",
    destLat: 23.0369,
    destLng: 72.5612,
    foodDescription: "Moong Khichdi insulated containers (50 meals)",
    quantity: 50,
    unit: "meals",
    requiredVehicle: ["Auto", "Van", "Car"],
    distanceKm: 7.8,
    etaMin: 22,
    status: "available",
    createdAt: iso(-35 * MIN),
  },
  {
    id: "d-002",
    type: "ngo-consumer",
    title: "Community assistance delivery → Kalupur",
    pickupName: "Helping Hands NGO",
    pickupArea: "Ashram Road, Navrangpura",
    pickupCity: "Ahmedabad",
    pickupLat: 23.0369,
    pickupLng: 72.5612,
    destName: "Kalupur Station Cluster",
    destArea: "Kalupur, Ahmedabad",
    destLat: 23.0285,
    destLng: 72.5995,
    foodDescription: "Packed Dinner Meals for 15 people",
    quantity: 15,
    unit: "meals",
    requiredVehicle: ["Bike", "Scooter", "Auto"],
    distanceKm: 4.3,
    etaMin: 14,
    status: "available",
    createdAt: iso(-20 * MIN),
  },
]

// ---------- 8. NGO Volunteers & Beneficiaries ----------
export const seedVolunteers: Volunteer[] = [
  {
    id: "v-001",
    ngoId: "org-helping-hands",
    name: "Kavita Joshi",
    phone: "98250 55101",
    vehicle: "Scooter",
    serviceArea: "Navrangpura, Paldi",
    availability: "Daily 4 PM – 9 PM",
    active: true,
    currentTask: "Meal distribution at Ashram Road",
  },
  {
    id: "v-002",
    ngoId: "org-helping-hands",
    name: "Imran Shaikh",
    phone: "98250 55102",
    vehicle: "Auto",
    serviceArea: "Kalupur, Shahibaug",
    availability: "Evening Shift",
    active: true,
  },
]

export const seedBeneficiaries: Beneficiary[] = [
  {
    id: "b-001",
    ngoId: "org-helping-hands",
    name: "Paldi Community Shelter",
    category: "shelter",
    peopleCount: 40,
    area: "Paldi",
    lastReceived: iso(-6 * HOUR),
    notes: "Requires regular evening meals",
  },
  {
    id: "b-002",
    ngoId: "org-helping-hands",
    name: "Kalupur Labour Cluster",
    category: "community",
    peopleCount: 25,
    area: "Kalupur",
    lastReceived: iso(-1 * DAY),
  },
]

// ---------- 9. Kitchen Inventory ----------
const hoursFromNow = (h: number) => iso(h * HOUR)

export const seedInventory: InventoryItem[] = [
  {
    id: "i-001",
    orgId: "org-green-plate",
    name: "Sona Masoori Rice",
    category: "raw",
    quantity: 65,
    unit: "kg",
    batch: "RM-2410",
    addedAt: iso(-4 * DAY),
    expiryAt: hoursFromNow(24 * 180),
    storage: "Dry Store A",
    status: "ok",
    valuePerUnit: 50,
  },
  {
    id: "i-002",
    orgId: "org-green-plate",
    name: "Toor Dal (Premium)",
    category: "raw",
    quantity: 30,
    unit: "kg",
    batch: "RM-2412",
    addedAt: iso(-3 * DAY),
    expiryAt: hoursFromNow(24 * 120),
    storage: "Dry Store A",
    status: "ok",
    valuePerUnit: 135,
  },
  {
    id: "i-003",
    orgId: "org-green-plate",
    name: "Pasteurised Cow Milk",
    category: "raw",
    quantity: 20,
    unit: "L",
    batch: "RM-2420",
    addedAt: iso(-18 * HOUR),
    expiryAt: hoursFromNow(6),
    storage: "Cold Storage 02",
    status: "critical",
    valuePerUnit: 56,
  },
  {
    id: "i-004",
    orgId: "org-green-plate",
    name: "Fresh Farm Spinach & Vegetables",
    category: "raw",
    quantity: 14,
    unit: "kg",
    batch: "RM-2422",
    addedAt: iso(-24 * HOUR),
    expiryAt: hoursFromNow(20),
    storage: "Cold Storage 01",
    status: "attention",
    valuePerUnit: 42,
  },
  {
    id: "i-005",
    orgId: "org-green-plate",
    name: "Freshly Cooked Khichdi",
    category: "prepared",
    quantity: 28,
    unit: "meals",
    batch: "PR-2401",
    addedAt: iso(-2 * HOUR),
    expiryAt: hoursFromNow(4),
    storage: "Cold Storage 01",
    status: "attention",
  },
]

// ---------- 10. Kitchen AI Demand Forecasts & Production ----------
export const seedForecasts: DemandForecast[] = [
  {
    id: "f-001",
    date: iso(-1 * DAY),
    dayType: "normal",
    registrations: 490,
    attendanceRate: 0.94,
    expectedAttendance: 460,
    recommendedProduction: 475,
    expectedSurplus: 15,
    confidence: 90,
    actualProduction: 475,
    actualConsumption: 462,
    actualSurplus: 13,
    createdAt: iso(-1 * DAY),
  },
  {
    id: "f-002",
    date: new Date().toISOString().slice(0, 10),
    dayType: "normal",
    registrations: 510,
    attendanceRate: 0.93,
    expectedAttendance: 475,
    recommendedProduction: 490,
    expectedSurplus: 15,
    confidence: 88,
    createdAt: iso(-3 * HOUR),
  },
]

export const seedProductions: ProductionRecord[] = [
  {
    id: "pr-001",
    date: iso(-1 * DAY),
    foodType: "Dal Rice & Khichdi",
    planned: 475,
    actual: 475,
    consumed: 462,
    surplus: 13,
    status: "completed",
    createdAt: iso(-1 * DAY),
  },
]

// ---------- 11. Food Assessments ----------
export const seedAssessments: FoodAssessment[] = [
  {
    id: "a-001",
    createdAt: iso(-2 * HOUR),
    foodName: "Nutritious Moong Khichdi",
    method: "photo",
    hoursSincePrepared: 2,
    storageCondition: "Insulated Container (>60°C)",
    result: "eligible",
    reasons: ["Prepared within 2 hours", "Maintained above safety temperature", "Clean packaging"],
    extractedText: "BATCH PR-2401 · PREP TIME 12:00 PM · TEMP OK",
    dateLabel: "Consume within 5 hours",
    source: "demo",
  },
]

// ---------- 12. IoT Sensors & Readings ----------
export const seedSensors: SensorDevice[] = [
  { id: "s-001", name: "Cold Storage 01 (Dairy & Veg)", type: "cold-storage", location: "Kitchen Bay A", orgId: "org-green-plate", mode: "normal" },
  { id: "s-002", name: "Cold Storage 02 (Deep Chill)", type: "cold-storage", location: "Kitchen Bay A", orgId: "org-green-plate", mode: "warning" },
  { id: "s-003", name: "Main Kitchen Ambient Sensor", type: "ambient", location: "Cooking Line", orgId: "org-green-plate", mode: "normal" },
]

export const seedSensorReadings: SensorReading[] = (() => {
  const readings: SensorReading[] = []
  const configs = [
    { id: "s-001", base: 4.1, hum: 68 },
    { id: "s-002", base: 8.5, hum: 75 }, // warm warning
    { id: "s-003", base: 28.2, hum: 55 },
  ]
  for (const cfg of configs) {
    for (let h = 12; h >= 0; h--) {
      const temp = round2(cfg.base + Math.sin(h / 3) * 0.4)
      readings.push({
        id: `sr-${cfg.id}-${h}`,
        deviceId: cfg.id,
        at: iso(-h * HOUR),
        temperature: temp,
        humidity: Math.round(cfg.hum + Math.cos(h / 3) * 3),
        status: cfg.id === "s-002" && temp > 8.0 ? "warning" : "normal",
        source: "simulated",
      })
    }
  }
  return readings
})()

export const seedMachines: MachineRecord[] = [
  { id: "m-001", name: "Automatic Meal Tray Sealer", status: "running", runtimeMin: 280, downtimeMin: 15, downtimeReason: "Film roll replenishment", energyKwh: 14.5, source: "simulated" },
  { id: "m-002", name: "Heavy Steam Rice Boiler", status: "running", runtimeMin: 360, downtimeMin: 0, downtimeReason: "", energyKwh: 38.0, source: "simulated" },
]

export const seedEnergy: EnergyRecord[] = (() => {
  const out: EnergyRecord[] = []
  const cats: Array<{ c: EnergyRecord["category"]; base: number }> = [
    { c: "kitchen", base: 180 },
    { c: "cold-storage", base: 60 },
    { c: "machines", base: 45 },
  ]
  for (const { c, base } of cats) {
    for (let d = 4; d >= 0; d--) {
      out.push({
        id: `e-${c}-${d}`,
        category: c,
        dayLabel: new Date(now - d * DAY).toLocaleDateString("en-IN", { weekday: "short" }),
        kwh: Math.round(base + (d % 2 === 0 ? 8 : -6)),
        meals: c === "kitchen" ? 480 : undefined,
        source: "simulated",
      })
    }
  }
  return out
})()

// ---------- 13. Circular Recovery Partners ----------
export const seedRecoveryPartners: RecoveryPartner[] = [
  {
    id: "rp-001",
    name: "GreenEarth Composting & Organic Fertilizer",
    type: "composting",
    city: "Ahmedabad",
    address: "Pirana Road, Ahmedabad",
    capacityPerDay: 600,
    unit: "kg/day",
    contact: "98250 33101",
    lat: 23.0025,
    lng: 72.5812,
  },
  {
    id: "rp-002",
    name: "Ahmedabad Biomethanation Plant",
    type: "biogas",
    city: "Ahmedabad",
    address: "Narol Industrial Zone, Ahmedabad",
    capacityPerDay: 1000,
    unit: "kg/day",
    contact: "98250 33102",
    lat: 22.9615,
    lng: 72.6410,
  },
]

export const seedRecoveryHandoffs: RecoveryHandoff[] = [
  {
    id: "rh-001",
    partnerId: "rp-001",
    partnerName: "GreenEarth Composting & Organic Fertilizer",
    itemName: "Vegetable peels & trimmings",
    quantity: 35,
    unit: "kg",
    status: "collected",
    createdAt: iso(-1 * DAY),
  },
]

// ---------- 14. Notifications ----------
export const seedNotifications: AppNotification[] = [
  {
    id: "n-001",
    audience: "user",
    kind: "free-food",
    title: "Fresh Community Meals Available",
    body: "Helping Hands NGO has 45 meals of Fresh Dal Rice ready for pickup or delivery.",
    at: iso(-25 * MIN),
    read: false,
    actionScreen: "u-find",
  },
  {
    id: "n-002",
    audience: "ngo",
    kind: "community-help",
    title: "Assistance Request: 15 People",
    body: "Rahul Sharma requested urgent evening meal support near Kalupur Railway Station.",
    at: iso(-45 * MIN),
    read: false,
    actionScreen: "n-community",
  },
  {
    id: "n-003",
    audience: "kitchen",
    kind: "storage-warning",
    title: "Cold Storage 02 Temperature Alert",
    body: "Temperature reading at 8.5°C exceeds recommended chilled limit (5°C). Check compressor.",
    at: iso(-30 * MIN),
    read: false,
    actionScreen: "k-iot",
  },
  {
    id: "n-004",
    audience: "buyer",
    kind: "expiry-alert",
    title: "New Bulk Clearance Batch",
    body: "Helping Hands NGO posted 45 kg Fresh Tomatoes at 75% OFF (₹10/kg).",
    at: iso(-20 * MIN),
    read: false,
    actionScreen: "b-market",
  },
]

export const seedFeedback: FeedbackItem[] = [
  {
    id: "fb-001",
    transactionId: "r-001",
    fromName: "Rahul Sharma",
    toName: "Helping Hands NGO",
    toRole: "provider",
    rating: 5,
    comment: "Excellent hot food and warm volunteer service!",
    at: iso(-1 * DAY),
  },
]

// ---------- 15. Secondary Buyer Clearance Seed Data ----------
export const seedBuyerProfile: BuyerProfile = {
  id: "u-buyer01",
  username: "buyer01",
  name: "Vikram Singhania",
  businessName: "GreenCycle Food Processing & Clearance Hub",
  businessType: "Food Processing (Value-Add)",
  phone: "98240 55667",
  email: "vikram@greencycle.demo",
  city: "Ahmedabad",
  address: "Plot 42, GIDC Industrial Estate, Naroda, Ahmedabad",
  location: loc(23.0825, 72.6514, "Plot 42, GIDC Naroda, Ahmedabad"),
  fssaiLicense: "FSSAI-DEMO-24-8841-GJ",
  gstin: "24AAACG1234F1Z5",
  coldStorageAvailable: true,
  transportCapacityKg: 850,
}

export const seedBuyerListings: BuyerListing[] = [
  {
    id: "bl-001",
    title: "Fresh Tomatoes (Bulk Clearance Batch)",
    category: "produce",
    quantity: 45,
    unit: "kg",
    mrpPerUnit: 40,
    clearancePrice: 10,
    discountPercent: 75,
    expiryHours: 14,
    expiryAt: hoursFromNow(14),
    urgency: "urgent",
    providerName: "Helping Hands NGO",
    providerType: "ngo",
    city: "Ahmedabad",
    area: "Navrangpura",
    address: "12 Ashram Road, Navrangpura, Ahmedabad",
    lat: 23.0369,
    lng: 72.5612,
    aiSafetyScore: 94,
    aiSafetyGrade: "Grade B (Process-Ready)",
    suggestedUse: "Ideal for Puree, Ketchup, Sauce or Cooking Gravy",
    minOrderQty: 10,
    status: "available",
  },
  {
    id: "bl-002",
    title: "Pasteurised Toned Milk (Crated)",
    category: "dairy",
    quantity: 35,
    unit: "L",
    mrpPerUnit: 60,
    clearancePrice: 18,
    discountPercent: 70,
    expiryHours: 8,
    expiryAt: hoursFromNow(8),
    urgency: "critical",
    providerName: "Green Plate Kitchen",
    providerType: "kitchen",
    city: "Ahmedabad",
    area: "Vatva GIDC",
    address: "Plot 8, GIDC Phase II, Vatva, Ahmedabad",
    lat: 22.9868,
    lng: 72.6241,
    aiSafetyScore: 98,
    aiSafetyGrade: "Grade A (Prime)",
    suggestedUse: "Immediate Paneer Making, Curd, Dairy Processing or Bakery",
    minOrderQty: 5,
    status: "available",
  },
  {
    id: "bl-003",
    title: "Whole Wheat Atta & Multigrain Flour (Sacks)",
    category: "grains",
    quantity: 120,
    unit: "kg",
    mrpPerUnit: 45,
    clearancePrice: 20,
    discountPercent: 55,
    expiryHours: 72,
    expiryAt: hoursFromNow(72),
    urgency: "moderate",
    providerName: "Community Care Food Bank",
    providerType: "foodbank",
    city: "Ahmedabad",
    area: "Bodakdev",
    address: "SG Highway, Bodakdev, Ahmedabad",
    lat: 23.0376,
    lng: 72.5063,
    aiSafetyScore: 99,
    aiSafetyGrade: "Grade A (Prime)",
    suggestedUse: "Secondary Bakery, Mass Canteen Roti Production, or Livestock Feed",
    minOrderQty: 25,
    status: "available",
  },
  {
    id: "bl-004",
    title: "Artisan Bread Loaves (Bulk Surplus)",
    category: "bakery",
    quantity: 35,
    unit: "loaves",
    mrpPerUnit: 50,
    clearancePrice: 12,
    discountPercent: 76,
    expiryHours: 10,
    expiryAt: hoursFromNow(10),
    urgency: "critical",
    providerName: "Green Plate Kitchen",
    providerType: "kitchen",
    city: "Ahmedabad",
    area: "Vatva GIDC",
    address: "Plot 8, GIDC Phase II, Vatva, Ahmedabad",
    lat: 22.9868,
    lng: 72.6241,
    aiSafetyScore: 92,
    aiSafetyGrade: "Grade B (Process-Ready)",
    suggestedUse: "Breadcrumbs, Croutons, Pudding, or Animal Sanctuary Feed",
    minOrderQty: 5,
    status: "available",
  },
]

export const seedBuyerOrders: BuyerOrder[] = [
  {
    id: "ord-byr-001",
    buyerId: "u-buyer01",
    buyerName: "GreenCycle Food Processing",
    listingId: "bl-001",
    listingTitle: "Fresh Tomatoes (Bulk Clearance Batch)",
    providerName: "Helping Hands NGO",
    providerType: "ngo",
    quantity: 20,
    unit: "kg",
    pricePerUnit: 10,
    totalAmount: 200,
    totalSavings: 600,
    intendedUse: "Value-Add Processing (Tomato Puree & Sauce)",
    pickupToken: "SF-BYR-7721",
    pickupAddress: "12 Ashram Road, Navrangpura, Ahmedabad",
    city: "Ahmedabad",
    status: "ready-for-pickup",
    orderedAt: iso(-2 * HOUR),
    pickupBefore: iso(12 * HOUR),
  },
]

export const seedBuyerAlerts: BuyerAlert[] = [
  {
    id: "ba-001",
    buyerId: "u-buyer01",
    keyword: "Tomatoes",
    category: "produce",
    maxPricePerUnit: 15,
    minQuantity: 10,
    city: "Ahmedabad",
    active: true,
    createdAt: iso(-5 * DAY),
  },
  {
    id: "ba-002",
    buyerId: "u-buyer01",
    keyword: "Milk",
    category: "dairy",
    maxPricePerUnit: 25,
    minQuantity: 10,
    city: "Ahmedabad",
    active: true,
    createdAt: iso(-3 * DAY),
  },
]
