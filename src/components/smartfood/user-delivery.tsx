"use client"
// ============================================================
// SmartFood AI — Delivery Partner mode (inside Normal User)
// Setup → nearby requests → accept → pickup → route → delivered
// ============================================================
import { useMemo, useState } from "react"
import { useStore, useCurrentUser } from "@/lib/store"
import type { DeliveryRequest } from "@/lib/types"
import { DELIVERY_CATEGORIES, VEHICLE_OPTIONS } from "@/lib/calc"
import { CITY_NAMES } from "@/lib/cities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PageWrap } from "./shell"
import { Card, CardContent, SectionHeader, StatusBadge, InfoBanner, DemoBadge, EmptyState, Labeled, KpiGrid, StatCard } from "./shared"
import { RouteMap } from "./map"
import {
  Bike, MapPin, Package, CheckCircle2, Navigation, Truck, ClipboardCheck,
  BadgeCheck, Clock3, ArrowRight, Star,
} from "lucide-react"

// ---------------- setup ----------------
function PartnerSetup({ onSaved }: { onSaved: () => void }) {
  const saveDeliveryProfile = useStore((s) => s.saveDeliveryProfile)
  const user = useCurrentUser()
  const { toast } = useToast()
  const [f, setF] = useState({
    city: user?.city ?? "Ahmedabad", serviceArea: "", vehicleType: "Bike", capacity: "30",
    vehicleDetails: "", availability: "Daily", community: true, prefs: ["NGO → Consumer", "Community Assistance"] as string[],
  })
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.serviceArea) { toast({ title: "Please enter your service area", variant: "destructive" }); return }
    saveDeliveryProfile({
      city: f.city, serviceArea: f.serviceArea, vehicleType: f.vehicleType,
      capacity: Number(f.capacity) || 10, vehicleDetails: f.vehicleDetails || `${f.vehicleType} (demo)`,
      availability: f.availability, communityAssistance: f.community, preferences: f.prefs, active: true,
    })
    toast({ title: "Delivery partner profile saved 🚀", description: "You can now see nearby delivery requests." })
    onSaved()
  }
  return (
    <PageWrap>
      <SectionHeader title="Delivery Partner Setup" desc="Tell us about your vehicle and service area to receive matching delivery requests." badge={<DemoBadge label="DEMO MODE" />} />
      <Card className="py-5">
        <CardContent className="px-5">
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Select value={f.city} onValueChange={(v) => setF({ ...f, city: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CITY_NAMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">You will only be matched with requests that pick up in this city.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Service area</Label>
                <Input value={f.serviceArea} onChange={(e) => setF({ ...f, serviceArea: e.target.value })} placeholder="e.g. Navrangpura, Paldi, CG Road" />
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle type</Label>
                <Select value={f.vehicleType} onValueChange={(v) => setF({ ...f, vehicleType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VEHICLE_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle capacity (meals equivalent)</Label>
                <Input type="number" min={1} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle details</Label>
                <Input value={f.vehicleDetails} onChange={(e) => setF({ ...f, vehicleDetails: e.target.value })} placeholder="e.g. Honda Activa (demo)" />
              </div>
              <div className="space-y-1.5">
                <Label>Availability</Label>
                <Select value={f.availability} onValueChange={(v) => setF({ ...f, availability: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Daily", "Weekdays", "Weekends", "Evenings", "Mornings"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div>
                <p className="text-sm font-bold">Community Assistance Delivery</p>
                <p className="text-[11px] text-muted-foreground">Volunteer to deliver food to homeless & vulnerable people (approximate area only)</p>
              </div>
              <Switch checked={f.community} onCheckedChange={(v) => setF({ ...f, community: v })} aria-label="Community assistance delivery" />
            </div>
            <div className="space-y-2">
              <Label>Delivery preferences</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DELIVERY_CATEGORIES.map((c) => (
                  <button key={c} type="button"
                    onClick={() => setF({ ...f, prefs: f.prefs.includes(c) ? f.prefs.filter((x) => x !== c) : [...f.prefs, c] })}
                    className={cn("rounded-lg border-2 px-2.5 py-2 text-[11px] font-bold", f.prefs.includes(c) ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="h-11 w-full font-bold"><Bike className="mr-1.5 h-4 w-4" /> Start Delivering</Button>
          </form>
        </CardContent>
      </Card>
    </PageWrap>
  )
}

// ---------------- main delivery view ----------------
export function DeliveryPartnerView() {
  const user = useCurrentUser()
  const deliveryRequests = useStore((s) => s.deliveryRequests)
  const acceptDelivery = useStore((s) => s.acceptDelivery)
  const declineDelivery = useStore((s) => s.declineDelivery)
  const advanceDelivery = useStore((s) => s.advanceDelivery)
  const navigate = useStore((s) => s.navigate)
  const { toast } = useToast()
  const [detail, setDetail] = useState<DeliveryRequest | null>(null)

  const profile = user?.deliveryProfile
  const available = useMemo(() => deliveryRequests.filter((d) => d.status === "available"), [deliveryRequests])
  const mine = useMemo(() => deliveryRequests.filter((d) => d.partnerId === user?.id && d.status !== "delivered"), [deliveryRequests, user?.id])
  const doneCount = deliveryRequests.filter((d) => d.partnerId === user?.id && d.status === "delivered").length

  if (!user?.deliveryMode) {
    return (
      <PageWrap>
        <SectionHeader title="Delivery Partner" desc="Delivery Partner mode is currently OFF." />
        <EmptyState icon={<Bike className="h-7 w-7" />} title="Turn on Delivery Partner mode"
          desc="Go to your Profile and switch on Delivery Partner mode to start accepting free-food delivery requests."
          action={<Button size="sm" onClick={() => navigate("u-profile")}>Open Profile</Button>} />
      </PageWrap>
    )
  }
  if (!profile) return <PartnerSetup onSaved={() => toast({ title: "Setup complete!" })} />

  const suitability = (d: DeliveryRequest) => {
    const reasons: string[] = []
    let ok = true
    // City rule first: partner.city === request.pickupCity (structured data,
    // no hard-coded city names).
    if (d.pickupCity && profile.city.trim().toLowerCase() !== d.pickupCity.trim().toLowerCase()) {
      ok = false
      reasons.push(`Pickup is in ${d.pickupCity} — you serve ${profile.city}`)
    } else {
      reasons.push(`City match: ${profile.city}`)
    }
    if (d.requiredVehicle.includes(profile.vehicleType)) reasons.push(`Your ${profile.vehicleType} is suitable`)
    else { ok = false; reasons.push(`Needs ${d.requiredVehicle.join("/")} — you have ${profile.vehicleType}`) }
    if (profile.capacity >= d.quantity) reasons.push(`Capacity OK (${profile.capacity} ≥ ${d.quantity})`)
    else { ok = false; reasons.push(`Load too big (${d.quantity} > your ${profile.capacity} capacity)`) }
    if (d.type === "community" && !profile.communityAssistance) { ok = false; reasons.push("Community assistance delivery is OFF in your preferences") }
    return { ok, reasons }
  }

  return (
    <PageWrap>
      <SectionHeader
        title="Delivery Partner"
        desc={`${profile.vehicleType} · ${profile.serviceArea} · ${profile.availability}`}
        badge={<BadgeCheck className="h-5 w-5 text-emerald-600" />}
      />
      <KpiGrid>
        <StatCard title="Available now" value={available.length} icon={<Truck className="h-5 w-5" />} sub="nearby requests" />
        <StatCard title="My active" value={mine.length} icon={<Navigation className="h-5 w-5" />} tone="info" sub="accepted jobs" />
        <StatCard title="Completed" value={doneCount} icon={<CheckCircle2 className="h-5 w-5" />} tone="positive" sub="all-time (demo)" />
        <StatCard title="Rating" value={doneCount > 0 ? "4.8 ★" : "—"} icon={<Star className="h-5 w-5" />} tone="warning" sub="demo rating" />
      </KpiGrid>

      {/* active job flow */}
      {mine.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">My active delivery</h3>
          {mine.map((d) => (
            <Card key={d.id} className="py-5">
              <CardContent className="space-y-4 px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{d.title}</p>
                  <StatusBadge status={d.status} />
                </div>
                {/* progress steps */}
                <ol className="flex items-center gap-1 text-[10px] font-bold">
                  {[
                    { k: "accepted", label: "Accepted", icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
                    { k: "at-pickup", label: "At pickup", icon: <MapPin className="h-3.5 w-3.5" /> },
                    { k: "in-transit", label: "In transit", icon: <Truck className="h-3.5 w-3.5" /> },
                    { k: "delivered", label: "Delivered", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                  ].map((s, i, arr) => {
                    const order = ["accepted", "at-pickup", "in-transit", "delivered"]
                    const active = order.indexOf(d.status) >= i
                    return (
                      <li key={s.k} className="flex flex-1 items-center gap-1">
                        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", active ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground")}>{s.icon}</span>
                        <span className={cn("hidden truncate sm:block", active ? "text-emerald-700" : "text-muted-foreground")}>{s.label}</span>
                        {i < arr.length - 1 && <span className={cn("h-0.5 flex-1 rounded", active ? "bg-emerald-400" : "bg-muted")} />}
                      </li>
                    )
                  })}
                </ol>
                <RouteMap
                  pickup={{ lat: d.pickupLat, lng: d.pickupLng, name: d.pickupName, area: d.pickupArea }}
                  dest={{ lat: d.destLat, lng: d.destLng, name: d.destName, area: d.destArea }}
                  foodDescription={d.foodDescription}
                  quantity={d.quantity}
                  unit={d.unit}
                  vehicleType={d.requiredVehicle?.join("/")}
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Labeled label="Pickup">{d.pickupName}</Labeled>
                  <Labeled label="Destination">{d.destArea}</Labeled>
                  <Labeled label="Distance / ETA">{d.distanceKm} km · ~{d.etaMin}m</Labeled>
                  <Labeled label="Load">{d.quantity} {d.unit}</Labeled>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {d.status === "accepted" && <Button className="h-11 flex-1 font-bold" onClick={() => { advanceDelivery(d.id); toast({ title: "Heading to pickup 📍" }) }}><MapPin className="mr-1.5 h-4 w-4" /> Go to Pickup</Button>}
                  {d.status === "at-pickup" && <Button className="h-11 flex-1 font-bold" onClick={() => { advanceDelivery(d.id); toast({ title: "Picked up 📦", description: "Food loaded — head to the destination." }) }}><Package className="mr-1.5 h-4 w-4" /> Picked Up</Button>}
                  {d.status === "in-transit" && <Button className="h-11 flex-1 font-bold" onClick={() => { advanceDelivery(d.id); toast({ title: "Delivered 🎉", description: "Great job — food reached people who needed it!" }) }}><CheckCircle2 className="mr-1.5 h-4 w-4" /> Delivered</Button>}
                  <Button variant="outline" className="h-11" onClick={() => setDetail(d)}>Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* nearby requests */}
      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Nearby Delivery Requests ({available.length})</h3>
        {available.length === 0 ? (
          <EmptyState icon={<Truck className="h-7 w-7" />} title="No delivery requests right now"
            desc="New requests appear when NGOs or kitchens need food delivered. Check back soon!" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {available.map((d) => {
              const s = suitability(d)
              return (
                <Card key={d.id} className={cn("py-4", !s.ok && "opacity-80")}>
                  <CardContent className="space-y-2 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 font-bold leading-tight">{d.title}</p>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", s.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                        {s.ok ? "SUITABLE" : "CHECK FIT"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3 text-emerald-600" /> {d.pickupArea || d.pickupCity}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><Navigation className="h-3 w-3 text-rose-500" /> {d.destArea}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><Package className="h-3 w-3" /> {d.quantity} {d.unit}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><Clock3 className="h-3 w-3" /> ~{d.etaMin} min · {d.distanceKm} km</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Type: {d.type.replace("-", " → ")} · Pickup city: <b>{d.pickupCity}</b> · Needs: {d.requiredVehicle.join("/")}</p>
                    <ul className="space-y-0.5">
                      {s.reasons.slice(0, 2).map((r, i) => <li key={i} className={cn("text-[10px]", s.ok ? "text-emerald-700" : "text-amber-700")}>• {r}</li>)}
                    </ul>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="h-9 flex-1 font-bold" onClick={() => { acceptDelivery(d.id); toast({ title: "Delivery accepted 🚀", description: "Open My Active Delivery to start." }) }}>Accept</Button>
                      <Button size="sm" variant="outline" className="h-9" onClick={() => { declineDelivery(d.id); toast({ title: "Declined" }) }}>Decline</Button>
                      <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => setDetail(d)} aria-label="Details"><ArrowRight className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      <InfoBanner tone="demo">Matching uses structured data only (pickup city = your city, vehicle, capacity, availability, community-assistance preference) ranked deterministically — no hard-coded cities. AI can add explanations when configured.</InfoBanner>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          {detail && (
            <>
              <DialogHeader><DialogTitle>{detail.title}</DialogTitle>
                <DialogDescription>Delivery type: {detail.type.replace("-", " → ")}</DialogDescription>
              </DialogHeader>
              <RouteMap pickup={{ lat: detail.pickupLat, lng: detail.pickupLng, name: detail.pickupName }} dest={{ lat: detail.destLat, lng: detail.destLng, name: detail.destName }} />
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="Pickup">{detail.pickupName}</Labeled>
                <Labeled label="Destination">{detail.destName}</Labeled>
                <Labeled label="Food">{detail.foodDescription}</Labeled>
                <Labeled label="Quantity">{detail.quantity} {detail.unit}</Labeled>
                <Labeled label="Distance">{detail.distanceKm} km</Labeled>
                <Labeled label="ETA">~{detail.etaMin} min</Labeled>
                <Labeled label="Required vehicle">{detail.requiredVehicle.join(", ")}</Labeled>
                <Labeled label="Status"><StatusBadge status={detail.status} /></Labeled>
              </div>
              {detail.status === "available" && (
                <DialogFooter className="flex-row gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { declineDelivery(detail.id); setDetail(null) }}>Decline</Button>
                  <Button className="flex-1 font-bold" onClick={() => { acceptDelivery(detail.id); setDetail(null); toast({ title: "Delivery accepted 🚀" }) }}>Accept</Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  )
}
