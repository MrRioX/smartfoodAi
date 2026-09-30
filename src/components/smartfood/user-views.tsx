"use client"
// ============================================================
// SmartFood AI — Normal User views
// Consumer (free food only) + donor + delivery partner modes.
// ============================================================
import { useMemo, useState } from "react"
import { useStore, useCurrentUser } from "@/lib/store"
import type { FoodListing, FoodRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PageWrap } from "./shell"
import {
  Card, CardContent, KpiGrid, StatCard, SectionHeader, EmptyState, StatusBadge,
  QuantityMeter, InfoBanner, timeUntil, timeAgo, DemoBadge,
} from "./shared"
import {
  Leaf, UtensilsCrossed, MapPin, HandHeart, Bike, Star, Search, Package, Truck,
  Heart, Handshake, Settings2, RotateCcw, Clock3, BadgeCheck, Sparkles, Camera,
} from "lucide-react"

// ---------------- food card ----------------
export function FoodCard({ listing, onRequest, onMap }: { listing: FoodListing; onRequest: (l: FoodListing) => void; onMap?: (l: FoodListing) => void }) {
  const pct = listing.quantityRemaining > 0 ? listing.quantityRemaining : 0
  return (
    <Card className="flex min-w-0 flex-col gap-2 py-4">
      <CardContent className="flex flex-1 flex-col gap-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight">{listing.title}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{listing.providerName} · {listing.city}</p>
          </div>
          {listing.isIndividual && <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">FREE DONATION</span>}
        </div>
        <QuantityMeter remaining={pct} total={listing.quantityTotal} unit={listing.unit} />
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium"><MapPin className="h-3 w-3" /> {listing.distanceKm} km</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium"><Clock3 className="h-3 w-3" /> {timeUntil(listing.availableUntil)}</span>
          {listing.pickup && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">Pickup</span>}
          {listing.eatHere && <span className="rounded-full bg-teal-50 px-2 py-0.5 font-semibold text-teal-700">Eat Here</span>}
          {listing.delivery && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">Delivery</span>}
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Button size="sm" className="h-9 flex-1 font-bold" disabled={listing.quantityRemaining <= 0} onClick={() => onRequest(listing)}>
            <UtensilsCrossed className="mr-1 h-3.5 w-3.5" /> Request Food
          </Button>
          {onMap && <Button size="sm" variant="outline" className="h-9" onClick={() => onMap(listing)}><MapPin className="mr-1 h-3.5 w-3.5" /> Map</Button>}
          {listing.eatHere && <Button size="sm" variant="outline" className="h-9" onClick={() => onRequest(listing)}>Eat Here</Button>}
          {listing.delivery && <Button size="sm" variant="outline" className="h-9" onClick={() => onRequest(listing)}><Truck className="mr-1 h-3.5 w-3.5" /> Request Delivery</Button>}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------- request dialog ----------------
function RequestFoodDialog({ listing, open, onOpenChange }: { listing: FoodListing | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const requestFood = useStore((s) => s.requestFood)
  const { toast } = useToast()
  const [qty, setQty] = useState("1")
  const [mode, setMode] = useState<FoodRequest["mode"]>("pickup")
  if (!listing) return null
  const submit = () => {
    const n = Math.max(1, Math.min(listing.quantityRemaining, Number(qty) || 1))
    const res = requestFood(listing.id, n, mode)
    toast(res.ok ? { title: "Request submitted!", description: res.message } : { title: "Could not request", description: res.message, variant: "destructive" })
    if (res.ok) onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Request — {listing.title}</DialogTitle>
          <DialogDescription>
            {listing.providerName} · {listing.quantityRemaining} {listing.unit} remaining · free of cost
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Quantity ({listing.unit})</Label>
            <Input type="number" min={1} max={listing.quantityRemaining} value={qty} onChange={(e) => setQty(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Max {listing.quantityRemaining} {listing.unit}</p>
          </div>
          <div className="space-y-1.5">
            <Label>How would you like to receive it?</Label>
            <div className="grid grid-cols-3 gap-2">
              {listing.pickup && <Button type="button" variant={mode === "pickup" ? "default" : "outline"} className="h-11 text-xs" onClick={() => setMode("pickup")}>Pickup</Button>}
              {listing.eatHere && <Button type="button" variant={mode === "eat-here" ? "default" : "outline"} className="h-11 text-xs" onClick={() => setMode("eat-here")}>Eat Here</Button>}
              {listing.delivery && <Button type="button" variant={mode === "delivery" ? "default" : "outline"} className="h-11 text-xs" onClick={() => setMode("delivery")}>Delivery</Button>}
            </div>
          </div>
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="flex-1 font-bold" onClick={submit}>Confirm Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------- HOME ----------------
export function UserHome() {
  const user = useCurrentUser()
  const navigate = useStore((s) => s.navigate)
  const toggleDonorMode = useStore((s) => s.toggleDonorMode)
  const toggleDeliveryMode = useStore((s) => s.toggleDeliveryMode)
  const listings = useStore((s) => s.listings)
  const requests = useStore((s) => s.requests)
  const deliveries = useStore((s) => s.deliveryRequests)
  const [reqDialog, setReqDialog] = useState<FoodListing | null>(null)

  const nearby = useMemo(
    () => listings.filter((l) => l.status === "active" && l.quantityRemaining > 0).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 6),
    [listings],
  )
  const myDone = requests.filter((r) => r.userId === user?.id && r.status === "completed").length
  const myDelivered = deliveries.filter((d) => d.partnerId === user?.id && d.status === "delivered").length

  return (
    <PageWrap>
      {/* hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 p-5 text-white shadow-lg sm:p-7">
        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-100">Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""} 👋</p>
        <h1 className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">Less Waste. More Food. A Better Tomorrow.</h1>
        <p className="mt-2 max-w-xl text-xs leading-relaxed text-emerald-50/90 sm:text-sm">
          Find free surplus food nearby, donate what you can&apos;t finish, or volunteer to deliver.
          SmartFood AI is a food-waste prevention platform — not a food-ordering app.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" className="h-10 bg-white font-bold text-emerald-700 hover:bg-emerald-50" onClick={() => navigate("u-find")}><UtensilsCrossed className="mr-1.5 h-4 w-4" /> Find Free Food</Button>
          <Button size="sm" variant="outline" className="h-10 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => navigate("u-donate")}><HandHeart className="mr-1.5 h-4 w-4" /> Donate Food</Button>
        </div>
      </div>

      {/* modes */}
      <Card className="py-4">
        <CardContent className="grid gap-3 px-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3">
            <UtensilsCrossed className="h-5 w-5 text-emerald-700" />
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">Consumer</p><p className="text-[11px] text-muted-foreground">Default — find free food</p></div>
            <BadgeCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <ModeToggle
            title="Food Donor" desc="Share surplus food free" icon={<HandHeart className="h-5 w-5" />}
            on={!!user?.donorMode} onToggle={(v) => { toggleDonorMode(v); navigate("u-donate") }}
          />
          <ModeToggle
            title="Delivery Partner" desc="Deliver food in your area" icon={<Bike className="h-5 w-5" />}
            on={!!user?.deliveryMode} onToggle={(v) => { toggleDeliveryMode(v); navigate("u-delivery") }}
          />
        </CardContent>
      </Card>

      {/* quick stats */}
      <KpiGrid>
        <StatCard title="Meals received" value={myDone} icon={<UtensilsCrossed className="h-5 w-5" />} sub="completed pickups" />
        <StatCard title="Donations made" value={listings.filter((l) => l.providerId === user?.id).length} icon={<HandHeart className="h-5 w-5" />} tone="warning" sub="free donations listed" />
        <StatCard title="Deliveries done" value={myDelivered} icon={<Bike className="h-5 w-5" />} tone="info" sub="as delivery partner" />
        <StatCard title="Active listings" value={nearby.length} icon={<Sparkles className="h-5 w-5" />} sub="free food nearby" />
      </KpiGrid>

      {/* free food nearby */}
      <div>
        <SectionHeader
          title="Free Food Nearby"
          desc="Surplus food shared free by NGOs, kitchens and neighbours. Available while quantities last."
          action={<Button variant="outline" size="sm" onClick={() => navigate("u-find")}>See all <Search className="ml-1.5 h-3.5 w-3.5" /></Button>}
          badge={<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">FREE</span>}
        />
        {nearby.length === 0 ? (
          <EmptyState icon={<UtensilsCrossed className="h-7 w-7" />} title="No free food listed right now" desc="Check back soon, or explore the map for community kitchens and NGOs near you." action={<Button size="sm" onClick={() => navigate("u-map")}>Open Explore Map</Button>} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {nearby.map((l) => <FoodCard key={l.id} listing={l} onRequest={setReqDialog} onMap={() => navigate("u-map")} />)}
          </div>
        )}
      </div>

      <InfoBanner tone="demo">
        <b>Demo note:</b> All listings, providers and distances are simulated demo data for the SIH prototype.
      </InfoBanner>
      <RequestFoodDialog listing={reqDialog} open={!!reqDialog} onOpenChange={(v) => !v && setReqDialog(null)} />
    </PageWrap>
  )
}

function ModeToggle({ title, desc, icon, on, onToggle }: { title: string; desc: string; icon: React.ReactNode; on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border-2 p-3", on ? "border-emerald-300 bg-emerald-50/60" : "border-border")}>
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", on ? "bg-emerald-600 text-white" : "bg-muted text-emerald-700")}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={on} onCheckedChange={onToggle} aria-label={`Toggle ${title} mode`} />
    </div>
  )
}

// ---------------- FIND FREE FOOD ----------------
export function FindFreeFood() {
  const listings = useStore((s) => s.listings)
  const navigate = useStore((s) => s.navigate)
  const [q, setQ] = useState("")
  const [city, setCity] = useState("all")
  const [reqDialog, setReqDialog] = useState<FoodListing | null>(null)

  const cities = useMemo(() => ["all", ...Array.from(new Set(listings.map((l) => l.city)))], [listings])
  const filtered = useMemo(
    () => listings.filter((l) =>
      l.status === "active" && l.quantityRemaining > 0
      && (city === "all" || l.city === city)
      && (q.trim() === "" || `${l.title} ${l.providerName} ${l.area} ${l.foodCategory}`.toLowerCase().includes(q.trim().toLowerCase())),
    ).sort((a, b) => a.distanceKm - b.distanceKm),
    [listings, q, city],
  )

  return (
    <PageWrap>
      <SectionHeader
        title="Find Free Food"
        desc="Every listing here is free — surplus food redistributed by NGOs, kitchens, food banks and neighbours. No payment, no checkout."
        badge={<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">100% FREE</span>}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search food, provider or area…" className="h-11 pl-9" />
        </div>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="h-11 sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All cities" : c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<Search className="h-7 w-7" />} title="No listings match your search" desc="Try a different keyword or city — or check the Explore Map for NGOs and kitchens nearby." action={<Button size="sm" variant="outline" onClick={() => navigate("u-map")}>Open Explore Map</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => <FoodCard key={l.id} listing={l} onRequest={setReqDialog} onMap={() => navigate("u-map")} />)}
        </div>
      )}
      <RequestFoodDialog listing={reqDialog} open={!!reqDialog} onOpenChange={(v) => !v && setReqDialog(null)} />
    </PageWrap>
  )
}

// ---------------- MY REQUESTS ----------------
export function MyRequests() {
  const user = useCurrentUser()
  const requests = useStore((s) => s.requests)
  const listings = useStore((s) => s.listings)
  const completeRequest = useStore((s) => s.completeRequest)
  const cancelRequest = useStore((s) => s.cancelRequest)
  const navigate = useStore((s) => s.navigate)
  const { toast } = useToast()
  const [feedbackFor, setFeedbackFor] = useState<FoodRequest | null>(null)

  const mine = requests.filter((r) => r.userId === user?.id && !["cancelled", "rejected"].includes(r.status))
  const active = mine.filter((r) => ["requested", "accepted", "ready", "delivering"].includes(r.status))
  const past = mine.filter((r) => r.status === "completed")

  const ReqCard = ({ r }: { r: FoodRequest }) => {
    const listing = listings.find((l) => l.id === r.listingId)
    const canPickup = ["accepted", "ready"].includes(r.status)
    return (
      <Card className="py-4">
        <CardContent className="space-y-2 px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-bold leading-tight">{r.listingTitle}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.providerName} · {r.quantity} {listing?.unit ?? "meals"} · {r.mode === "eat-here" ? "Eat here" : r.mode === "delivery" ? "Delivery" : "Pickup"}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Requested {timeAgo(r.createdAt)}</p>
            </div>
            <StatusBadge status={r.status} />
          </div>
          {r.status === "requested" && <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">Waiting for {r.providerName} to accept…</p>}
          {r.status === "delivering" && (
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-[11px] font-medium text-teal-800">
              A delivery partner is bringing your food — track it in Delivery Partner view.
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {canPickup && (
              <Button size="sm" className="h-9 font-bold" onClick={() => { completeRequest(r.id); setFeedbackFor({ ...r, status: "completed" }); toast({ title: "Pickup confirmed 🎉", description: "Thanks for preventing food waste!" }) }}>
                <Package className="mr-1.5 h-3.5 w-3.5" /> Confirm Pickup
              </Button>
            )}
            {r.status === "delivering" && <Button size="sm" variant="outline" className="h-9" onClick={() => navigate("u-delivery")}><Bike className="mr-1.5 h-3.5 w-3.5" /> Track Delivery</Button>}
            {r.status === "requested" && <Button size="sm" variant="outline" className="h-9" onClick={() => { cancelRequest(r.id); toast({ title: "Request cancelled" }) }}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <PageWrap>
      <SectionHeader title="My Requests" desc="Track your free food requests and confirm pickups." />
      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Active ({active.length})</h3>
        {active.length === 0 ? (
          <EmptyState icon={<Clock3 className="h-7 w-7" />} title="No active requests" desc="Find free food nearby and request a meal — it will show up here." action={<Button size="sm" onClick={() => navigate("u-find")}>Find Free Food</Button>} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">{active.map((r) => <ReqCard key={r.id} r={r} />)}</div>
        )}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Completed ({past.length})</h3>
        {past.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">Completed requests will appear here.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">{past.map((r) => <ReqCard key={r.id} r={r} />)}</div>
        )}
      </div>
      <FeedbackDialog request={feedbackFor} open={!!feedbackFor} onOpenChange={(v) => !v && setFeedbackFor(null)} />
    </PageWrap>
  )
}

// ---------------- feedback dialog ----------------
export function FeedbackDialog({ request, open, onOpenChange }: { request: FoodRequest | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const submitFeedback = useStore((s) => s.submitFeedback)
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  if (!request) return null
  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setRating(0); setComment("") } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate your experience</DialogTitle>
          <DialogDescription>How was &quot;{request.listingTitle}&quot; from {request.providerName}? Only completed transactions can be rated.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} star`} className={cn("rounded-lg p-2 transition-transform active:scale-95", rating >= n ? "text-amber-500" : "text-muted-foreground/40")}>
                <Star className={cn("h-8 w-8", rating >= n && "fill-amber-400")} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Share feedback (optional) — food quality, packaging, pickup experience…" />
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Skip</Button>
          <Button className="flex-1 font-bold" disabled={rating === 0} onClick={() => {
            submitFeedback(request.id, rating, comment)
            toast({ title: "Feedback submitted — thank you!" })
            onOpenChange(false); setRating(0); setComment("")
          }}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------- HISTORY ----------------
export function UserHistory() {
  const user = useCurrentUser()
  const listings = useStore((s) => s.listings)
  const requests = useStore((s) => s.requests)
  const deliveries = useStore((s) => s.deliveryRequests)
  const navigate = useStore((s) => s.navigate)
  const [tab, setTab] = useState<"received" | "donations" | "deliveries">("received")

  const received = requests.filter((r) => r.userId === user?.id && r.status === "completed")
  const donations = listings.filter((l) => l.providerId === user?.id)
  const myDeliveries = deliveries.filter((d) => d.partnerId === user?.id)

  const tabs = [
    { key: "received" as const, label: `Received (${received.length})` },
    { key: "donations" as const, label: `Donations (${donations.length})` },
    { key: "deliveries" as const, label: `Deliveries (${myDeliveries.length})` },
  ]

  return (
    <PageWrap>
      <SectionHeader title="History" desc="Your completed demo activity across SmartFood AI." />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Button key={t.key} size="sm" variant={tab === t.key ? "default" : "outline"} className="h-9 shrink-0" onClick={() => setTab(t.key)}>{t.label}</Button>
        ))}
      </div>
      {tab === "received" && (
        received.length === 0
          ? <EmptyState icon={<UtensilsCrossed className="h-7 w-7" />} title="Nothing received yet" desc="Request free food and completed pickups will appear here." action={<Button size="sm" onClick={() => navigate("u-find")}>Find Free Food</Button>} />
          : <div className="space-y-2">{received.map((r) => (
            <Card key={r.id} className="py-3"><CardContent className="flex items-center justify-between gap-2 px-4">
              <div className="min-w-0"><p className="truncate text-sm font-bold">{r.listingTitle}</p><p className="text-xs text-muted-foreground">{r.providerName} · {r.quantity} units</p></div>
              <div className="text-right"><StatusBadge status="completed" /><p className="mt-1 text-[10px] text-muted-foreground">{r.completedAt ? timeAgo(r.completedAt) : ""}</p></div>
            </CardContent></Card>
          ))}</div>
      )}
      {tab === "donations" && (
        donations.length === 0
          ? <EmptyState icon={<HandHeart className="h-7 w-7" />} title="No donations yet" desc="Turn on Food Donor mode to share surplus food with your community — free." action={<Button size="sm" onClick={() => navigate("u-donate")}>Donate Food</Button>} />
          : <div className="space-y-2">{donations.map((l) => (
            <Card key={l.id} className="py-3"><CardContent className="flex items-center justify-between gap-2 px-4">
              <div className="min-w-0"><p className="truncate text-sm font-bold">{l.title}</p><p className="text-xs text-muted-foreground">{l.quantityRemaining}/{l.quantityTotal} {l.unit} left · listed {timeAgo(l.createdAt)}</p></div>
              <StatusBadge status={l.status} />
            </CardContent></Card>
          ))}</div>
      )}
      {tab === "deliveries" && (
        myDeliveries.length === 0
          ? <EmptyState icon={<Bike className="h-7 w-7" />} title="No deliveries yet" desc="Turn on Delivery Partner mode to accept nearby free-food delivery tasks." action={<Button size="sm" onClick={() => navigate("u-delivery")}>Become Delivery Partner</Button>} />
          : <div className="space-y-2">{myDeliveries.map((d) => (
            <Card key={d.id} className="py-3"><CardContent className="flex items-center justify-between gap-2 px-4">
              <div className="min-w-0"><p className="truncate text-sm font-bold">{d.title}</p><p className="text-xs text-muted-foreground">{d.quantity} {d.unit} · {d.distanceKm} km</p></div>
              <StatusBadge status={d.status} />
            </CardContent></Card>
          ))}</div>
      )}
    </PageWrap>
  )
}

// ---------------- PROFILE ----------------
export function UserProfile() {
  const user = useCurrentUser()
  const toggleDonorMode = useStore((s) => s.toggleDonorMode)
  const toggleDeliveryMode = useStore((s) => s.toggleDeliveryMode)
  const navigate = useStore((s) => s.navigate)
  if (!user) return null
  const initials = user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
  return (
    <PageWrap>
      <SectionHeader title="Profile" badge={<DemoBadge label="DEMO ACCOUNT" />} />
      <Card className="py-5">
        <CardContent className="flex items-center gap-4 px-5">
          <Avatar className="h-16 w-16"><AvatarFallback className="bg-emerald-100 text-lg font-bold text-emerald-700">{initials}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.phone} {user.email && `· ${user.email}`}</p>
            <p className="mt-0.5 text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{user.address}, {user.city}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Demo ID: {user.username} · member since {new Date(user.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="py-5">
        <CardContent className="space-y-4 px-5">
          <h3 className="text-sm font-bold">My capabilities</h3>
          <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><HandHeart className="h-5 w-5" /></span>
              <div><p className="text-sm font-bold">Food Donor</p><p className="text-[11px] text-muted-foreground">Share surplus food — free donations only</p></div>
            </div>
            <Switch checked={user.donorMode} onCheckedChange={(v) => { toggleDonorMode(v); if (v) navigate("u-donate") }} aria-label="Toggle food donor mode" />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Bike className="h-5 w-5" /></span>
              <div><p className="text-sm font-bold">Delivery Partner</p><p className="text-[11px] text-muted-foreground">Deliver free food in your area</p></div>
            </div>
            <Switch checked={user.deliveryMode} onCheckedChange={(v) => { toggleDeliveryMode(v); if (v) navigate("u-delivery") }} aria-label="Toggle delivery partner mode" />
          </div>
          <InfoBanner tone="info">Individual food donations are always <b>free donations</b> — SmartFood AI never charges for surplus food.</InfoBanner>
        </CardContent>
      </Card>
    </PageWrap>
  )
}

// ---------------- SETTINGS ----------------
export function UserSettings() {
  const resetDemoData = useStore((s) => s.resetDemoData)
  const logout = useStore((s) => s.logout)
  const { toast } = useToast()
  const [prefs, setPrefs] = useState({ freeFood: true, requests: true, delivery: true, community: true })
  return (
    <PageWrap>
      <SectionHeader title="Settings" desc="Demo preferences for this prototype." />
      <Card className="py-5">
        <CardContent className="space-y-4 px-5">
          <h3 className="flex items-center gap-2 text-sm font-bold"><Settings2 className="h-4 w-4" /> Notification preferences (local demo)</h3>
          {([
            ["freeFood", "New free food nearby"], ["requests", "Request status updates"],
            ["delivery", "Delivery requests & updates"], ["community", "Community assistance updates"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <p className="text-sm">{label}</p>
              <Switch checked={prefs[key]} onCheckedChange={(v) => setPrefs({ ...prefs, [key]: v })} aria-label={label} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="py-5">
        <CardContent className="space-y-3 px-5">
          <h3 className="text-sm font-bold">Demo data</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            All demo data is stored locally in your browser (localStorage) — nothing is sent to a server.
            Reset to restore the original seeded demo state.
          </p>
          <Button
            variant="outline" className="text-red-600"
            onClick={() => {
              resetDemoData()
              toast({ title: "Demo data reset", description: "All demo entities restored to seed state." })
              logout()
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Demo Data
          </Button>
        </CardContent>
      </Card>
      <InfoBanner tone="demo">
        <b>Demo Authentication — SIH Prototype.</b> No OTP, no password hashing, no real verification.
        Built for SmartFood AI (SIH demo). Camera/photo uploads use standard HTML file inputs for Android WebView compatibility.
      </InfoBanner>
      <p className="pb-2 text-center text-[10px] text-muted-foreground">SmartFood AI · Demo build · Made with 🌱 for a zero-waste tomorrow</p>
      <div className="hidden"><Camera /><Leaf /><Heart /><Handshake /></div>
    </PageWrap>
  )
}
