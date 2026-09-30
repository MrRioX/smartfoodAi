"use client"
// ============================================================
// SmartFood AI — Explore Map (discovery, not sole navigation)
// OpenStreetMap + Leaflet. Free / open technology.
// ============================================================
import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import type { MapCategory, MapMarker } from "./map"
import { MapView, MapLegend, MAP_CATEGORIES } from "./map"
import { useMapProvider, providerLabel } from "@/components/maps/MapProvider"
import { PageWrap } from "./shell"
import { SectionHeader, InfoBanner } from "./shared"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search, MapPin } from "lucide-react"

const FILTERS: Array<{ key: MapCategory | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "food", label: "Food" },
  { key: "ngo", label: "NGO" },
  { key: "foodbank", label: "Food Bank" },
  { key: "kitchen", label: "Kitchen" },
  { key: "processing", label: "Processing" },
  { key: "delivery", label: "Delivery" },
  { key: "community", label: "Community Help" },
  { key: "recovery", label: "Recovery" },
]

export function ExploreMap({ role = "user" }: { role?: "user" | "ngo" | "kitchen" }) {
  const mapCfg = useMapProvider()
  const listings = useStore((s) => s.listings)
  const orgs = useStore((s) => s.organizations)
  const recoveryPartners = useStore((s) => s.recoveryPartners)
  const assistance = useStore((s) => s.assistance)
  const deliveries = useStore((s) => s.deliveryRequests)
  const navigate = useStore((s) => s.navigate)
  const [filter, setFilter] = useState<MapCategory | "all">("all")
  const [q, setQ] = useState("")

  const markers: MapMarker[] = useMemo(() => {
    const out: MapMarker[] = []
    // free food listings
    for (const l of listings.filter((x) => x.status === "active" && x.quantityRemaining > 0)) {
      out.push({
        id: `food-${l.id}`, lat: l.lat, lng: l.lng, category: "food",
        title: l.title, subtitle: `${l.providerName} · ${l.area}`,
        detail: `${l.quantityRemaining} ${l.unit} · ${l.pickup ? "Pickup " : ""}${l.eatHere ? "· Eat here " : ""}${l.delivery ? "· Delivery" : ""}`,
        ctaLabel: role === "user" ? "Request Food →" : undefined,
      })
    }
    // organizations
    for (const o of orgs) {
      const cat: MapCategory = o.type === "ngo" ? "ngo" : o.type === "foodbank" ? "foodbank" : o.type === "kitchen" ? "kitchen" : "processing"
      out.push({
        id: `org-${o.id}`, lat: o.lat, lng: o.lng, category: cat,
        title: o.name, subtitle: `${o.city} · ${o.type === "ngo" ? o.ngoType ?? "NGO" : o.type === "kitchen" ? o.kitchenType ?? "Kitchen" : o.description.slice(0, 40)}`,
        detail: o.address,
      })
    }
    // recovery partners
    for (const r of recoveryPartners) {
      out.push({ id: `rp-${r.id}`, lat: r.lat, lng: r.lng, category: "recovery", title: r.name, subtitle: `${r.type} · ${r.city}`, detail: `Capacity ${r.capacityPerDay} ${r.unit}` })
    }
    // community assistance (approximate areas only, pending/accepted)
    for (const a of assistance.filter((x) => x.status === "pending" || x.status === "accepted" || x.status === "assigned")) {
      out.push({
        id: `ca-${a.id}`, lat: a.lat, lng: a.lng, category: "community",
        title: `Assistance needed — approx. area`, subtitle: `${a.area} · ${a.peopleCount} people`,
        detail: "Approximate area only — exact location stays private",
      })
    }
    // available delivery pickups
    for (const d of deliveries.filter((x) => x.status === "available")) {
      out.push({ id: `dl-${d.id}`, lat: d.pickupLat, lng: d.pickupLng, category: "delivery", title: `Delivery pickup: ${d.pickupName}`, subtitle: d.pickupArea, detail: `${d.quantity} ${d.unit} → ${d.destArea}` })
    }
    return out
  }, [listings, orgs, recoveryPartners, assistance, deliveries, role])

  const filtered = useMemo(() => {
    const byCat = filter === "all" ? markers : markers.filter((m) => m.category === filter)
    if (q.trim() === "") return byCat
    const needle = q.trim().toLowerCase()
    return byCat.filter((m) => `${m.title} ${m.subtitle ?? ""} ${m.detail ?? ""}`.toLowerCase().includes(needle))
  }, [markers, filter, q])

  const onMarkerClick = (id: string) => {
    if (id.startsWith("food-") && role === "user") navigate("u-find")
    if (role === "ngo" && id.startsWith("food-")) navigate("n-donations")
  }

  return (
    <PageWrap>
      <SectionHeader
        title="Explore Map"
        desc="Discover free food, NGOs, food banks, kitchens, processing units, recovery partners and approximate community-help areas."
        badge={<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">{providerLabel(mapCfg)}</span>}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search location or food…" className="h-11 pl-9" />
        </div>
        <div className="sf-scroll flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} className={cn("h-9 shrink-0 text-xs", filter === f.key && "font-bold")} onClick={() => setFilter(f.key)}>
              {f.key !== "all" && <span className="mr-1.5 h-2 w-2 rounded-full" style={{ background: MAP_CATEGORIES[f.key].color }} />}
              {f.label}
            </Button>
          ))}
        </div>
      </div>
      <MapView markers={filtered} fitAll className="h-[380px] sm:h-[460px]" onMarkerClick={onMarkerClick} />
      <MapLegend />
      <InfoBanner tone="info">
        <MapPin className="mr-1 inline h-3.5 w-3.5" />
        Community-help markers show <b>approximate aggregated areas only</b> to protect vulnerable people.
        Tap any pin for details{role === "user" ? " — food pins include a Request shortcut" : ""}.
        Map data © OpenStreetMap contributors (demo locations).
      </InfoBanner>
      <p className="text-center text-[10px] text-muted-foreground">{filtered.length} markers shown · demo location data</p>
    </PageWrap>
  )
}
