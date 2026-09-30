// ============================================================
// SmartFood AI — Demo Data Model (SIH Prototype)
// Client-side demo data layer. Designed so it can later be
// migrated to Supabase/PostgreSQL behind API routes.
// ============================================================

export type Role = "user" | "ngo" | "kitchen" | "buyer"
export type OrgType = "ngo" | "foodbank" | "kitchen" | "processing" | "recovery" | "buyer"

// Structured geographic location — always stored explicitly, never random.
// Picked on the real map picker (registration / donation / assistance) or
// derived from the user's saved profile location.
export interface GeoLocation {
  lat: number
  lng: number
  address: string
  city: string
  state: string
  country: string
}

export interface AppUser {
  id: string
  username: string
  password: string // demo only — never do this in production
  name: string
  phone: string
  email?: string
  city: string
  address: string
  location?: GeoLocation // saved profile location — used as default donation location
  joinedAt: string
  donorMode: boolean
  deliveryMode: boolean
  deliveryProfile?: DeliveryPartnerProfile
}

export interface Organization {
  id: string
  username: string
  password: string // demo only
  name: string
  type: OrgType
  city: string
  state?: string
  address: string
  lat: number
  lng: number
  location?: GeoLocation // exact location chosen on the map picker at registration
  phone: string
  contactPerson: string
  status: "verified-demo" | "pending-demo"
  description: string
  // NGO extras
  ngoType?: string
  registrationNumber?: string
  storageAvailable?: boolean
  estimatedBeneficiaries?: number
  // Kitchen extras
  kitchenType?: string
  dailyCapacity?: number
  storageCapability?: string
  licenseInfo?: string
}

export interface DeliveryPartnerProfile {
  city: string
  serviceArea: string
  vehicleType: string
  capacity: number // meals equivalent
  vehicleDetails: string
  availability: string
  communityAssistance: boolean
  preferences: string[]
  active: boolean
}

export interface StandalonePartner {
  // demo partner accounts used for NGO-side matching (not login accounts)
  id: string
  name: string
  phone: string
  profile: DeliveryPartnerProfile
  rating: number
  completedDeliveries: number
}

export interface FoodListing {
  id: string
  title: string
  foodCategory: string
  quantityTotal: number
  quantityRemaining: number
  unit: string
  providerId: string
  providerName: string
  providerType: "ngo" | "kitchen" | "user" | "foodbank"
  city: string
  area: string
  lat: number
  lng: number
  distanceKm: number
  availableUntil: string
  pickup: boolean
  eatHere: boolean
  delivery: boolean
  preparedAt: string
  storage: string
  status: "active" | "completed"
  createdAt: string
  notes?: string
  isIndividual?: boolean
  assessment?: "eligible" | "review" | "not-eligible"
}

export type RequestStatus =
  | "requested"
  | "accepted"
  | "rejected"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled"

export interface FoodRequest {
  id: string
  userId: string
  userName: string
  userPhone: string
  listingId: string
  listingTitle: string
  providerId: string
  providerName: string
  quantity: number
  mode: "pickup" | "eat-here" | "delivery"
  status: RequestStatus
  createdAt: string
  completedAt?: string
  deliveryId?: string
}

export type AssistanceStatus = "pending" | "accepted" | "assigned" | "completed"

export interface CommunityAssistance {
  id: string
  submittedByName: string
  submittedByPhone: string
  area: string // approximate area label only
  city: string
  lat: number // jittered approximate center, never exact
  lng: number
  peopleCount: number
  foodNeeded: string
  description?: string
  hasProofPhoto: boolean // photo stays private inside NGO workflow
  status: AssistanceStatus
  createdAt: string
  assignedTo?: string
  assignedKind?: "volunteer" | "partner"
  ngoName?: string
}

export type DeliveryType =
  | "kitchen-ngo"
  | "kitchen-consumer"
  | "ngo-consumer"
  | "ngo-homeless"
  | "user-user"
  | "user-ngo"
  | "community"

export interface DeliveryRequest {
  id: string
  type: DeliveryType
  title: string
  pickupName: string
  pickupArea: string
  pickupCity: string // explicit structured city used for partner matching
  pickupLat: number
  pickupLng: number
  destName: string
  destArea: string
  destLat: number
  destLng: number
  foodDescription: string
  quantity: number
  unit: string
  requiredVehicle: string[]
  distanceKm: number
  etaMin: number
  status: "available" | "accepted" | "at-pickup" | "in-transit" | "delivered" | "declined"
  partnerId?: string
  partnerName?: string
  assignedVolunteer?: string
  createdAt: string
  linkedRequestId?: string
  linkedAssistanceId?: string
}

export interface Volunteer {
  id: string
  ngoId: string
  name: string
  phone: string
  vehicle: string
  serviceArea: string
  availability: string
  active: boolean
  currentTask?: string
}

export interface Beneficiary {
  id: string
  ngoId: string
  name: string
  category: "family" | "individual" | "shelter" | "school" | "community"
  peopleCount: number
  area: string
  lastReceived?: string
  notes?: string
}

export type InventoryCategory = "raw" | "prepared" | "packaged"
export type InventoryStatus = "ok" | "attention" | "critical"

export interface InventoryItem {
  id: string
  orgId: string
  name: string
  category: InventoryCategory
  quantity: number
  unit: string
  batch: string
  addedAt: string
  expiryAt?: string
  storage: string
  status: InventoryStatus
  valuePerUnit?: number // ₹ demo estimate
}

export interface IngredientQty {
  name: string
  qty: number
  unit: string
  pricePerUnit: number // ₹ demo estimate
}

export interface RecipeInfo {
  prepTimeMin: number
  cookTimeMin: number
  difficulty: "Easy" | "Medium" | "Advanced"
  steps: string[]
  tips: string[]
}

export interface MealPlanResult {
  foodType: string
  meals: number
  ingredients: IngredientQty[]
  totalCost: number
  costPerMeal: number
  extraMeals: number
  calculatedAt: string
  recipe?: RecipeInfo
}

export interface MealPreset {
  id: string
  ownerId: string
  ownerRole: Role
  name: string
  foodType: string
  meals: number
  ingredients: IngredientQty[]
  createdAt: string
}

export type DayType = "normal" | "weekend" | "event" | "festival" | "holiday"

export interface DemandForecast {
  id: string
  date: string
  dayType: DayType
  registrations: number
  attendanceRate: number
  expectedAttendance: number
  recommendedProduction: number
  expectedSurplus: number
  confidence: number // 0-100 demo confidence
  actualConsumption?: number
  actualSurplus?: number
  actualProduction?: number
  createdAt: string
}

export interface ProductionRecord {
  id: string
  date: string
  foodType: string
  planned: number
  actual: number
  consumed: number
  surplus: number
  status: "planned" | "completed"
  createdAt: string
}

export type AssessmentResult = "eligible" | "review" | "not-eligible"

export interface FoodAssessment {
  id: string
  createdAt: string
  foodName: string
  method: "photo" | "upload" | "barcode"
  hoursSincePrepared: number
  storageCondition: string
  result: AssessmentResult
  reasons: string[]
  extractedText?: string // demo OCR
  dateLabel?: string
  source?: "demo" | "ai" // which engine produced the result
  confidence?: number
  humanReviewRequired?: boolean
}

export type SensorMode = "normal" | "warning" | "critical"

export interface SensorDevice {
  id: string
  name: string
  type: "cold-storage" | "freezer" | "ambient" | "machine"
  location: string
  orgId: string
  mode: SensorMode
}

export interface SensorReading {
  id: string
  deviceId: string
  at: string
  temperature: number
  humidity: number
  status: "normal" | "warning" | "critical"
  source: "simulated"
}

export interface MachineRecord {
  id: string
  name: string
  status: "running" | "idle" | "maintenance" | "down"
  runtimeMin: number
  downtimeMin: number
  downtimeReason?: string
  energyKwh: number
  source: "simulated"
}

export interface EnergyRecord {
  id: string
  category: "kitchen" | "processing" | "cold-storage" | "machines"
  dayLabel: string
  kwh: number
  meals?: number
  source: "simulated"
}

export interface RecoveryPartner {
  id: string
  name: string
  type: "composting" | "biogas" | "other"
  city: string
  address: string
  capacityPerDay: number
  unit: string
  contact: string
  lat: number
  lng: number
}

export interface RecoveryHandoff {
  id: string
  partnerId: string
  partnerName: string
  itemName: string
  quantity: number
  unit: string
  status: "scheduled" | "collected" | "processed"
  createdAt: string
}

export type NotificationKind =
  | "free-food"
  | "request-accepted"
  | "donation-received"
  | "delivery-request"
  | "delivery-accepted"
  | "expiry-alert"
  | "storage-warning"
  | "community-help"
  | "verification"
  | "production-warning"
  | "info"

export interface AppNotification {
  id: string
  audience: Role | "all"
  userId?: string
  orgId?: string
  kind: NotificationKind
  title: string
  body: string
  at: string
  read: boolean
  actionScreen?: string
}

export interface FeedbackItem {
  id: string
  transactionId: string
  fromName: string
  toName: string
  toRole: "provider" | "delivery" | "consumer"
  rating: number
  comment?: string
  at: string
}

export interface RegistrationRecord {
  id: string
  role: Role
  submittedAt: string
  summary: string
  status: "Pending Verification (Demo)"
}

export interface SustainabilityMetrics {
  mealsRedistributed: number
  foodSavedKg: number
  co2eAvoidedKg: number
  foodRecoveredKg: number
  energyKwh: number
}

// City-specific ingredient price reference data (demo data layer).
// AI may consume this but never invents prices.
export interface IngredientPrice {
  city: string
  ingredient: string
  price: number // ₹ per unit
  unit: string
  dateUpdated: string
  source: string
  demo: boolean
}

// ---------------- Secondary Buyer types ----------------
export type BuyerCategory = "produce" | "dairy" | "cooked" | "grains" | "bakery" | "packaged"
export type BuyerUrgency = "critical" | "urgent" | "moderate" // <12h, 12-24h, >24h

export interface BuyerListing {
  id: string
  title: string
  category: BuyerCategory
  quantity: number
  unit: string
  mrpPerUnit: number
  clearancePrice: number
  discountPercent: number
  expiryHours: number
  expiryAt: string
  urgency: BuyerUrgency
  providerName: string
  providerType: "ngo" | "kitchen" | "foodbank" | "wholesaler"
  city: string
  area: string
  address: string
  lat: number
  lng: number
  aiSafetyScore: number
  aiSafetyGrade: "Grade A (Prime)" | "Grade B (Process-Ready)" | "Feed / Biomass Grade"
  suggestedUse: string
  minOrderQty: number
  status: "available" | "reserved" | "sold"
}

export interface BuyerOrder {
  id: string
  buyerId: string
  buyerName: string
  listingId: string
  listingTitle: string
  providerName: string
  providerType: string
  quantity: number
  unit: string
  pricePerUnit: number
  totalAmount: number
  totalSavings: number
  intendedUse: string
  pickupToken: string
  pickupAddress: string
  city: string
  status: "confirmed" | "ready-for-pickup" | "completed" | "cancelled"
  orderedAt: string
  pickupBefore: string
}

export interface BuyerAlert {
  id: string
  buyerId: string
  keyword: string
  category?: string
  maxPricePerUnit?: number
  minQuantity?: number
  city: string
  active: boolean
  createdAt: string
}

export interface BuyerProfile {
  id: string
  username: string
  name: string
  businessName: string
  businessType: "Food Processing (Value-Add)" | "Discount Retail / Grocery" | "Animal Feed / Livestock" | "Compost & Biomass" | "Community Kitchen"
  phone: string
  email: string
  city: string
  address: string
  location?: GeoLocation
  fssaiLicense?: string
  gstin?: string
  coldStorageAvailable: boolean
  transportCapacityKg: number
}

