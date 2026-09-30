"use client"
// ============================================================
// SmartFood AI — SIH Demo Prototype (single-page app)
// Login → role dashboards → all workflows (client-side routing
// via Zustand, persisted to localStorage for WebView packaging)
// ============================================================
import { useSyncExternalStore } from "react"
import { useStore } from "@/lib/store"
import { AuthFlow } from "@/components/smartfood/auth"
import { AppShell } from "@/components/smartfood/shell"
import { PageSkeleton } from "@/components/smartfood/shared"
import { NotificationCenter } from "@/components/smartfood/notifications"
import { UserHome, FindFreeFood, MyRequests, UserHistory, UserProfile, UserSettings } from "@/components/smartfood/user-views"
import { DonateFood, CommunityHelp } from "@/components/smartfood/user-donate"
import { DeliveryPartnerView } from "@/components/smartfood/user-delivery"
import { MealPlanner } from "@/components/smartfood/planner"
import { ExploreMap } from "@/components/smartfood/explore-map"
import { InventoryManager, ExpiryManager, ImpactDashboard, OrgProfile } from "@/components/smartfood/org-shared"
import {
  NgoOverview, NgoFoodRequests, NgoCommunityAssistance, NgoDonations,
  NgoDistribution, NgoBeneficiaries, NgoVolunteers, NgoPartners, NgoFeedback,
} from "@/components/smartfood/ngo-views"
import { KitchenOverview, DemandForecastView, ProductionView, SurplusView } from "@/components/smartfood/kitchen-views-a"
import { KitchenAssessment, StorageMonitoring, IotMonitoring, ProcurementView } from "@/components/smartfood/kitchen-views-b"
import { KitchenListings, KitchenDelivery, KitchenAnalytics, KitchenReports } from "@/components/smartfood/kitchen-views-c"
import {
  BuyerOverview, BuyerMarketplace, BuyerOrdersView, BuyerSourcingAlerts, BuyerProfileView,
} from "@/components/smartfood/buyer-views"

export default function SmartFoodApp() {
  const role = useStore((s) => s.role)
  const screen = useStore((s) => s.screen)
  // hydration-safe mounted flag (no setState-in-effect)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-emerald-600 text-3xl">🌱</div>
        <p className="text-sm font-bold text-emerald-700">SMARTFOOD AI</p>
        <p className="text-xs text-muted-foreground">Loading demo…</p>
      </div>
    )
  }

  if (!role) return <AuthFlow />

  return <AppShell><ScreenRouter screen={screen} role={role} /></AppShell>
}

function ScreenRouter({ screen, role }: { screen: string; role: "user" | "ngo" | "kitchen" | "buyer" }) {
  switch (screen) {
    // ---------- shared ----------
    case "notifications": case "u-notifications": case "n-notifications": case "k-notifications": case "b-notifications":
      return <NotificationCenter homeScreen={role === "user" ? "u-home" : role === "ngo" ? "n-overview" : role === "kitchen" ? "k-overview" : "b-overview"} />

    // ---------- normal user ----------
    case "u-home": return <UserHome />
    case "u-find": return <FindFreeFood />
    case "u-map": return <ExploreMap role="user" />
    case "u-requests": return <MyRequests />
    case "u-donate": return <DonateFood />
    case "u-planner": return <MealPlanner />
    case "u-community": return <CommunityHelp />
    case "u-delivery": return <DeliveryPartnerView />
    case "u-history": return <UserHistory />
    case "u-profile": return <UserProfile />
    case "u-settings": return <UserSettings />

    // ---------- NGO ----------
    case "n-overview": return <NgoOverview />
    case "n-requests": return <NgoFoodRequests />
    case "n-community": return <NgoCommunityAssistance />
    case "n-inventory": return <InventoryManager storageOptions={["NGO Store", "Ambient Shelf", "Cold Storage 01", "Dry Store", "Freezer 01"]} />
    case "n-donations": return <NgoDonations />
    case "n-distribution": return <NgoDistribution />
    case "n-planner": return <MealPlanner />
    case "n-beneficiaries": return <NgoBeneficiaries />
    case "n-volunteers": return <NgoVolunteers />
    case "n-partners": return <NgoPartners />
    case "n-map": return <ExploreMap role="ngo" />
    case "n-expiry": return <ExpiryManager />
    case "n-feedback": return <NgoFeedback />
    case "n-impact": return <ImpactDashboard variant="ngo" />
    case "n-profile": return <OrgProfile variant="ngo" />

    // ---------- kitchen ----------
    case "k-overview": return <KitchenOverview />
    case "k-planner": return <MealPlanner />
    case "k-forecast": return <DemandForecastView />
    case "k-production": return <ProductionView />
    case "k-inventory": return <InventoryManager storageOptions={["Dry Store", "Cold Storage 01", "Cold Storage 02", "Freezer 01", "Hot Case", "Ambient Shelf"]} />
    case "k-surplus": return <SurplusView />
    case "k-listings": return <KitchenListings />
    case "k-assess": return <KitchenAssessment />
    case "k-storage": return <StorageMonitoring />
    case "k-iot": return <IotMonitoring />
    case "k-procurement": return <ProcurementView />
    case "k-delivery": return <KitchenDelivery />
    case "k-map": return <ExploreMap role="kitchen" />
    case "k-expiry": return <ExpiryManager />
    case "k-analytics": return <KitchenAnalytics />
    case "k-sustainability": return <ImpactDashboard variant="kitchen" />
    case "k-reports": return <KitchenReports />
    case "k-profile": return <OrgProfile variant="kitchen" />

    // ---------- secondary buyer ----------
    case "b-overview": return <BuyerOverview />
    case "b-market": return <BuyerMarketplace />
    case "b-orders": return <BuyerOrdersView />
    case "b-map": return <ExploreMap role="user" />
    case "b-sourcing": return <BuyerSourcingAlerts />
    case "b-impact": return <ImpactDashboard variant="kitchen" />
    case "b-profile": return <BuyerProfileView />

    default:
      return role === "user" ? <UserHome /> : role === "ngo" ? <NgoOverview /> : role === "kitchen" ? <KitchenOverview /> : <BuyerOverview />
  }
}
