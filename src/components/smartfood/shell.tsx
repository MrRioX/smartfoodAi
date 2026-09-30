"use client"
// ============================================================
// SmartFood AI — role-based app shell
// Desktop: sidebar navigation. Mobile: header + bottom nav +
// full menu drawer. Optimised for Android WebView packaging.
// ============================================================
import { useState, type ReactNode } from "react"
import { useStore, useCurrentUser, useCurrentOrg, useMyNotifications, unreadCount } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { DemoBadge } from "./shared"
import {
  Leaf, Home, MapPin, UtensilsCrossed, Clock3, HandHeart, CalendarCheck, HeartHandshake,
  Bike, Bell, History, User, Settings, LogOut, Menu, Package, LayoutDashboard, Truck,
  AlertTriangle, MessageSquareHeart, BarChart3, Sparkles, Boxes, ClipboardList, Users,
  Wheat, Thermometer, Radio, ShoppingCart, Recycle, FileBarChart, Factory, LineChart, ChevronRight,
} from "lucide-react"

export interface NavItem {
  key: string
  label: string
  icon: ReactNode
  badge?: "donor" | "delivery"
}

export const USER_NAV: NavItem[] = [
  { key: "u-home", label: "Home", icon: <Home className="h-4 w-4" /> },
  { key: "u-find", label: "Find Free Food", icon: <UtensilsCrossed className="h-4 w-4" /> },
  { key: "u-map", label: "Explore Map", icon: <MapPin className="h-4 w-4" /> },
  { key: "u-requests", label: "My Requests", icon: <ClipboardList className="h-4 w-4" /> },
  { key: "u-donate", label: "Donate Food", icon: <HandHeart className="h-4 w-4" />, badge: "donor" },
  { key: "u-planner", label: "AI Meal Planner", icon: <Sparkles className="h-4 w-4" /> },
  { key: "u-community", label: "Community Help", icon: <HeartHandshake className="h-4 w-4" /> },
  { key: "u-delivery", label: "Delivery Partner", icon: <Bike className="h-4 w-4" />, badge: "delivery" },
  { key: "u-notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { key: "u-history", label: "History", icon: <History className="h-4 w-4" /> },
  { key: "u-profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { key: "u-settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
]

export const NGO_NAV: NavItem[] = [
  { key: "n-overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: "n-requests", label: "Food Requests", icon: <ClipboardList className="h-4 w-4" /> },
  { key: "n-community", label: "Community Assistance", icon: <HeartHandshake className="h-4 w-4" /> },
  { key: "n-inventory", label: "Food Inventory", icon: <Package className="h-4 w-4" /> },
  { key: "n-donations", label: "Food Donations", icon: <HandHeart className="h-4 w-4" /> },
  { key: "n-distribution", label: "Free Food Distribution", icon: <UtensilsCrossed className="h-4 w-4" /> },
  { key: "n-planner", label: "AI Meal Planner", icon: <Sparkles className="h-4 w-4" /> },
  { key: "n-beneficiaries", label: "Beneficiaries", icon: <Users className="h-4 w-4" /> },
  { key: "n-volunteers", label: "Own Volunteers", icon: <Bike className="h-4 w-4" /> },
  { key: "n-partners", label: "Delivery Partners", icon: <Truck className="h-4 w-4" /> },
  { key: "n-map", label: "Explore Map", icon: <MapPin className="h-4 w-4" /> },
  { key: "n-expiry", label: "Expiry Alerts", icon: <AlertTriangle className="h-4 w-4" /> },
  { key: "n-feedback", label: "Feedback", icon: <MessageSquareHeart className="h-4 w-4" /> },
  { key: "n-impact", label: "Impact", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "n-notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { key: "n-profile", label: "Profile", icon: <User className="h-4 w-4" /> },
]

export const KITCHEN_NAV: NavItem[] = [
  { key: "k-overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: "k-planner", label: "AI Meal Planner", icon: <Sparkles className="h-4 w-4" /> },
  { key: "k-forecast", label: "Demand Forecast", icon: <LineChart className="h-4 w-4" /> },
  { key: "k-production", label: "Production", icon: <ChefHatIcon /> },
  { key: "k-inventory", label: "Inventory", icon: <Package className="h-4 w-4" /> },
  { key: "k-surplus", label: "Surplus", icon: <Boxes className="h-4 w-4" /> },
  { key: "k-listings", label: "Food Listings", icon: <UtensilsCrossed className="h-4 w-4" /> },
  { key: "k-assess", label: "AI Food Assessment", icon: <ScanSearchIcon /> },
  { key: "k-storage", label: "Storage Monitoring", icon: <Thermometer className="h-4 w-4" /> },
  { key: "k-iot", label: "IoT Monitoring", icon: <Radio className="h-4 w-4" /> },
  { key: "k-procurement", label: "Procurement", icon: <ShoppingCart className="h-4 w-4" /> },
  { key: "k-delivery", label: "Delivery", icon: <Truck className="h-4 w-4" /> },
  { key: "k-map", label: "Explore Map", icon: <MapPin className="h-4 w-4" /> },
  { key: "k-expiry", label: "Expiry Alerts", icon: <AlertTriangle className="h-4 w-4" /> },
  { key: "k-analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "k-sustainability", label: "Sustainability", icon: <Recycle className="h-4 w-4" /> },
  { key: "k-reports", label: "Reports", icon: <FileBarChart className="h-4 w-4" /> },
  { key: "k-notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { key: "k-profile", label: "Profile", icon: <User className="h-4 w-4" /> },
]

export const BUYER_NAV: NavItem[] = [
  { key: "b-overview", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: "b-market", label: "Surplus Clearance", icon: <ShoppingCart className="h-4 w-4" /> },
  { key: "b-orders", label: "My Orders & Passes", icon: <ClipboardList className="h-4 w-4" /> },
  { key: "b-map", label: "Pickup Locations Map", icon: <MapPin className="h-4 w-4" /> },
  { key: "b-sourcing", label: "Procurement Alerts", icon: <Bell className="h-4 w-4" /> },
  { key: "b-impact", label: "Food Rescued & Savings", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "b-notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { key: "b-profile", label: "Buyer Profile", icon: <User className="h-4 w-4" /> },
]

function ChefHatIcon() { return <Wheat className="h-4 w-4" /> }
function ScanSearchIcon() { return <Leaf className="h-4 w-4" /> }

// Mobile bottom navigation (per spec):
//   user:    Home · Free Food · Map · Donate · Profile
//   ngo:     Overview · Requests · Map · Inventory · More(drawer)
//   kitchen: Overview · Production · Map · Inventory · More(drawer)
//   buyer:   Dashboard · Clearance · Orders · Map · Profile
const BOTTOM_NAV: Record<string, string[]> = {
  user: ["u-home", "u-find", "u-map", "u-donate", "u-profile"],
  ngo: ["n-overview", "n-requests", "n-map", "n-inventory"],
  kitchen: ["k-overview", "k-production", "k-map", "k-inventory"],
  buyer: ["b-overview", "b-market", "b-orders", "b-map", "b-profile"],
}

function NavList({
  nav, screen, navigate, user, onNavigate, roleLabel,
}: {
  nav: NavItem[]; screen: string; navigate: (s: string) => void
  user: ReturnType<typeof useCurrentUser>; onNavigate?: () => void; roleLabel: string
}) {
  return (
    <nav className="space-y-0.5" aria-label={`${roleLabel} navigation`}>
      {nav.map((item) => {
        const active = screen === item.key
        const showDot = item.badge === "donor" ? user?.donorMode : item.badge === "delivery" ? user?.deliveryMode : false
        return (
          <button
            key={item.key}
            onClick={() => { navigate(item.key); onNavigate?.() }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
              active ? "bg-emerald-600 text-white shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.icon}
            <span className="flex-1 truncate">{item.label}</span>
            {showDot && <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="mode on" />}
          </button>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const role = useStore((s) => s.role)
  const screen = useStore((s) => s.screen)
  const navigate = useStore((s) => s.navigate)
  const logout = useStore((s) => s.logout)
  const user = useCurrentUser()
  const org = useCurrentOrg()
  const buyer = useStore((s) => s.buyerProfile)
  const notifs = useMyNotifications()
  const unread = unreadCount(notifs)
  const [menuOpen, setMenuOpen] = useState(false)
  const { toast } = useToast()

  if (!role) return null
  const nav = role === "user" ? USER_NAV : role === "ngo" ? NGO_NAV : role === "kitchen" ? KITCHEN_NAV : BUYER_NAV
  const bottom = (BOTTOM_NAV[role] ?? []).map((k) => nav.find((n) => n.key === k)!).filter(Boolean)
  const displayName = role === "user" ? (user?.name ?? "User") : role === "buyer" ? (buyer?.businessName ?? "Secondary Buyer") : (org?.name ?? "Organization")
  const initials = displayName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  const roleLabel = role === "user" ? "Normal User" : role === "ngo" ? "NGO / Food Bank" : role === "kitchen" ? "Kitchen / Institution" : "Secondary Buyer"

  const doLogout = () => {
    logout()
    toast({ title: "Logged out (demo)", description: "Thanks for exploring SmartFood AI!" })
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white"><Leaf className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-extrabold leading-tight">SMARTFOOD AI</p>
            <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
        <ScrollArea className="sf-scroll flex-1 px-3 pb-3">
          <NavList nav={nav} screen={screen} navigate={navigate} user={user} roleLabel={roleLabel} />
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-800">
            <DemoBadge label="SIH DEMO PROTOTYPE" className="mb-2" />
            All data is simulated demo data. Organizations are fictional.
          </div>
        </ScrollArea>
        <div className="border-t p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-emerald-100 text-xs font-bold text-emerald-700">{initials}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{displayName}</p>
              <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={doLogout}>
            <LogOut className="mr-2 h-3.5 w-3.5" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-card/95 px-3 py-2.5 backdrop-blur lg:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[290px] p-0">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2.5 border-b px-4 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white"><Leaf className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold leading-tight">SMARTFOOD AI</p>
                    <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
                  </div>
                </div>
                <ScrollArea className="sf-scroll flex-1 px-3 py-3">
                  <NavList nav={nav} screen={screen} navigate={navigate} user={user} roleLabel={roleLabel} onNavigate={() => setMenuOpen(false)} />
                  <Button variant="outline" size="sm" className="mt-4 w-full justify-start text-xs" onClick={doLogout}>
                    <LogOut className="mr-2 h-3.5 w-3.5" /> Logout
                  </Button>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white lg:hidden"><Leaf className="h-4 w-4" /></div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">{nav.find((n) => n.key === screen)?.label ?? "SmartFood AI"}</p>
              <p className="text-[10px] text-muted-foreground">{displayName}</p>
            </div>
          </div>
          <Button variant="outline" size="icon" className="relative h-10 w-10 shrink-0" aria-label="Notifications" onClick={() => navigate(role === "user" ? "u-notifications" : role === "ngo" ? "n-notifications" : "k-notifications")}>
            <Bell className="h-4 w-4" />
            {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
          </Button>
        </header>

        <main className="min-w-0 flex-1 pb-24 lg:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="Bottom navigation">
          <div className="grid grid-cols-5">
            {bottom.map((item) => {
              const active = screen === item.key
              return (
                <button key={item.key} onClick={() => navigate(item.key)} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold", active ? "text-emerald-700" : "text-muted-foreground")} aria-current={active ? "page" : undefined}>
                  {item.icon}
                  <span className="max-w-full truncate px-0.5">{item.label.split(" ").slice(-1)[0]}</span>
                </button>
              )
            })}
            {bottom.length < 5 && (
              <button
                onClick={() => setMenuOpen(true)}
                className="flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold text-muted-foreground"
                aria-label="More menu"
              >
                <Menu className="h-4 w-4" />
                <span>More</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  )
}

export function PageWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6", className)}>{children}</div>
}

export { ChevronRight, Factory }
