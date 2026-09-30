"use client"
// ============================================================
// SmartFood AI — NGO dashboard views
// ============================================================
import { useMemo, useState } from "react"
import { useStore, useCurrentOrg } from "@/lib/store"
import type { CommunityAssistance, FoodRequest, Volunteer } from "@/lib/types"
import { matchPartners } from "@/lib/calc"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PageWrap } from "./shell"
import {
  Card, CardContent, KpiGrid, StatCard, SectionHeader, StatusBadge, EmptyState,
  InfoBanner, timeAgo, timeUntil, Labeled, QuantityMeter,
} from "./shared"
import {
  UtensilsCrossed, Users, ClipboardList, Truck, HandHeart, AlertTriangle, Leaf,
  HeartHandshake, Lock, Camera, CheckCircle2, Plus, Package, Star, MessageSquareHeart,
  Bike, MapPin, Phone, Clock3, ShieldCheck, XCircle,
} from "lucide-react"

// ============================================================
// OVERVIEW
// ============================================================
export function NgoOverview() {
  const org = useCurrentOrg()
  const navigate = useStore((s) => s.navigate)
  const listings = useStore((s) => s.listings)
  const requests = useStore((s) => s.requests)
  const assistance = useStore((s) => s.assistance)
  const deliveries = useStore((s) => s.deliveryRequests)
  const inventory = useStore((s) => s.inventory)
  const feedback = useStore((s) => s.feedback)

  const myActive = listings.filter((l) => l.providerId === org?.id && l.status === "active")
  const mealsAvailable = myActive.reduce((s, l) => s + l.quantityRemaining, 0)
  const pendingClaims = requests.filter((r) => r.providerId === org?.id && r.status === "requested")
  const pendingAssist = assistance.filter((a) => a.status === "pending")
  const activeDeliveries = deliveries.filter((d) => ["accepted", "at-pickup", "in-transit"].includes(d.status))
  const expiring = inventory.filter((i) => i.orgId === org?.id && i.expiryAt && new Date(i.expiryAt).getTime() - Date.now() < 36 * 3600_000).length
  const peopleToday = 86 + requests.filter((r) => r.providerId === org?.id && r.status === "completed").reduce((s, r) => s + r.quantity, 0)
  const avgRating = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "—"

  return (
    <PageWrap>
      <SectionHeader title={`Overview — ${org?.name ?? "NGO"}`} desc="Today at a glance (demo data + live demo actions)." badge={<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">DEMO ORGANIZATION</span>} />
      <KpiGrid>
        <StatCard title="Meals available" value={mealsAvailable} icon={<UtensilsCrossed className="h-5 w-5" />} sub={`${myActive.length} active listings`} />
        <StatCard title="People helped today" value={peopleToday} icon={<Users className="h-5 w-5" />} tone="positive" sub="incl. seeded demo baseline" />
        <StatCard title="Pending requests" value={pendingClaims.length + pendingAssist.length} icon={<ClipboardList className="h-5 w-5" />} tone="warning" sub={`${pendingClaims.length} claims · ${pendingAssist.length} assistance`} />
        <StatCard title="Active deliveries" value={activeDeliveries.length} icon={<Truck className="h-5 w-5" />} tone="info" sub="partner + volunteer jobs" />
        <StatCard title="Donations received" value={24} icon={<HandHeart className="h-5 w-5" />} sub="this month (demo)" />
        <StatCard title="Expiring products" value={expiring} icon={<AlertTriangle className="h-5 w-5" />} tone="danger" sub="need attention ≤36h" />
        <StatCard title="Food redistributed" value="1,486 meals" icon={<Leaf className="h-5 w-5" />} tone="positive" sub="incl. seeded demo history" />
        <StatCard title="Est. waste prevented" value="743 kg" icon={<Leaf className="h-5 w-5" />} sub="demo estimate" />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-5">
          <CardContent className="space-y-3 px-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Latest requests</h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("n-requests")}>View all</Button>
            </div>
            {pendingClaims.length === 0 && pendingAssist.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">No pending requests right now.</p>
            ) : (
              <div className="space-y-2">
                {pendingAssist.slice(0, 3).map((a) => (
                  <button key={a.id} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left active:bg-muted/50" onClick={() => navigate("n-community")}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700"><HeartHandshake className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{a.foodNeeded}</span><span className="block text-xs text-muted-foreground">{a.area} · {a.peopleCount} people · {timeAgo(a.createdAt)}</span></span>
                    <StatusBadge status={a.status} />
                  </button>
                ))}
                {pendingClaims.slice(0, 3).map((r) => (
                  <button key={r.id} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left active:bg-muted/50" onClick={() => navigate("n-requests")}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><UtensilsCrossed className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{r.userName} · {r.quantity}× {r.listingTitle}</span><span className="block text-xs text-muted-foreground">{r.mode} · {timeAgo(r.createdAt)}</span></span>
                    <StatusBadge status={r.status} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardContent className="space-y-3 px-5">
            <h3 className="text-sm font-bold">Quick actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Create free distribution", icon: <UtensilsCrossed className="h-4 w-4" />, to: "n-distribution" },
                { label: "Community assistance", icon: <HeartHandshake className="h-4 w-4" />, to: "n-community" },
                { label: "Inventory", icon: <Package className="h-4 w-4" />, to: "n-inventory" },
                { label: "Impact dashboard", icon: <Leaf className="h-4 w-4" />, to: "n-impact" },
              ].map((a) => (
                <button key={a.to} onClick={() => navigate(a.to)} className="flex flex-col items-start gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-3 text-left text-xs font-bold text-emerald-800 transition-colors active:bg-emerald-100">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
            <InfoBanner tone="info">Rating: <b>{avgRating} ★</b> from {feedback.length} reviews (demo feedback).</InfoBanner>
          </CardContent>
        </Card>
      </div>
    </PageWrap>
  )
}

// ============================================================
// FOOD REQUESTS (claims on NGO listings)
// ============================================================
export function NgoFoodRequests() {
  const org = useCurrentOrg()
  const requests = useStore((s) => s.requests)
  const listings = useStore((s) => s.listings)
  const volunteers = useStore((s) => s.volunteers)
  const respondToRequest = useStore((s) => s.respondToRequest)
  const assignRequestVolunteer = useStore((s) => s.assignRequestVolunteer)
  const { toast } = useToast()
  const [assignFor, setAssignFor] = useState<FoodRequest | null>(null)

  const mine = useMemo(
    () => requests.filter((r) => r.providerId === org?.id && !["cancelled", "rejected", "completed"].includes(r.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [requests, org?.id],
  )
  const history = requests.filter((r) => r.providerId === org?.id && ["completed", "rejected"].includes(r.status))

  return (
    <PageWrap>
      <SectionHeader title="Food Requests" desc="Claims on your free food listings. Accept, mark ready, or assign a delivery." />
      {mine.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-7 w-7" />} title="No open food requests" desc="When people request food from your listings, requests appear here for approval." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {mine.map((r) => {
            const listing = listings.find((l) => l.id === r.listingId)
            return (
              <Card key={r.id} className="py-4">
                <CardContent className="space-y-2 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold leading-tight">{r.listingTitle}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{r.userName} · {r.userPhone}</p>
                      <p className="text-[11px] text-muted-foreground">{r.quantity} {listing?.unit ?? "meals"} · {r.mode} · {timeAgo(r.createdAt)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  {listing && <QuantityMeter remaining={listing.quantityRemaining} total={listing.quantityTotal} unit={listing.unit} />}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.status === "requested" && (
                      <>
                        <Button size="sm" className="h-8 bg-emerald-600 text-xs font-bold" onClick={() => { respondToRequest(r.id, "accept"); toast({ title: "Request accepted" }) }}><CheckCircle2 className="mr-1 h-3 w-3" /> Accept</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs text-red-600" onClick={() => { respondToRequest(r.id, "reject"); toast({ title: "Request rejected" }) }}><XCircle className="mr-1 h-3 w-3" /> Reject</Button>
                      </>
                    )}
                    {r.status === "accepted" && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { respondToRequest(r.id, "ready"); toast({ title: "Marked ready for pickup" }) }}>Mark Ready</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAssignFor(r)}><Bike className="mr-1 h-3 w-3" /> Assign Delivery</Button>
                      </>
                    )}
                    {r.status === "delivering" && <StatusBadge status="delivering" />}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      {history.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Recent history</h3>
          <div className="space-y-2">
            {history.slice(0, 6).map((r) => (
              <Card key={r.id} className="py-3"><CardContent className="flex items-center justify-between gap-2 px-4">
                <div className="min-w-0"><p className="truncate text-sm font-bold">{r.listingTitle}</p><p className="text-xs text-muted-foreground">{r.userName} · {r.quantity} units</p></div>
                <StatusBadge status={r.status} />
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}
      <Dialog open={!!assignFor} onOpenChange={(v) => !v && setAssignFor(null)}>
        <DialogContent className="max-w-sm">
          {assignFor && (
            <>
              <DialogHeader><DialogTitle>Assign delivery</DialogTitle><DialogDescription>“{assignFor.listingTitle}” → {assignFor.userName}. Choose your own volunteer (or let a partner pick it up from Delivery Partners view).</DialogDescription></DialogHeader>
              <div className="space-y-2">
                {volunteers.filter((v) => v.active).map((v) => (
                  <button key={v.id} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left active:bg-muted/50"
                    onClick={() => { assignRequestVolunteer(assignFor.id, v.name); setAssignFor(null); toast({ title: `Assigned to ${v.name}`, description: "Request is now out for delivery." }) }}>
                    <Avatar className="h-9 w-9"><AvatarFallback className="text-xs font-bold">{v.name.split(" ").map((w) => w[0]).join("")}</AvatarFallback></Avatar>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{v.name}</span><span className="block text-xs text-muted-foreground">{v.vehicle} · {v.serviceArea} · {v.availability}</span></span>
                    <Bike className="h-4 w-4 text-emerald-600" />
                  </button>
                ))}
                {volunteers.filter((v) => v.active).length === 0 && <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">No active volunteers — add some in Own Volunteers.</p>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  )
}

// ============================================================
// COMMUNITY ASSISTANCE
// ============================================================
export function NgoCommunityAssistance() {
  const assistance = useStore((s) => s.assistance)
  const acceptAssistance = useStore((s) => s.acceptAssistance)
  const assignAssistance = useStore((s) => s.assignAssistance)
  const completeAssistance = useStore((s) => s.completeAssistance)
  const volunteers = useStore((s) => s.volunteers)
  const partners = useStore((s) => s.partners)
  const { toast } = useToast()
  const [detail, setDetail] = useState<CommunityAssistance | null>(null)
  const [assignOpen, setAssignOpen] = useState<CommunityAssistance | null>(null)

  const open = assistance.filter((a) => a.status !== "completed")
  const done = assistance.filter((a) => a.status === "completed")

  return (
    <PageWrap>
      <SectionHeader title="Community Assistance" desc="Requests from citizens about people/areas needing free food. Proof photos stay private to your authorized workflow." badge={<span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">PRIVATE PHOTOS</span>} />
      <InfoBanner tone="warning"><Lock className="mr-1 inline h-3.5 w-3.5" /> Only the approximate area is shown. Exact locations and proof photos are never public — they are visible only inside this authorized NGO workflow.</InfoBanner>
      {open.length === 0 ? (
        <EmptyState icon={<HeartHandshake className="h-7 w-7" />} title="No open assistance requests" desc="Citizen-submitted community help requests will appear here with approximate areas." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {open.map((a) => (
            <Card key={a.id} className="py-4">
              <CardContent className="space-y-2 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold leading-tight">{a.foodNeeded}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{a.area}</p>
                    <p className="text-[11px] text-muted-foreground">{a.peopleCount} people · reported by {a.submittedByName} · {timeAgo(a.createdAt)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                {a.assignedTo && <p className="rounded-lg bg-teal-50 px-3 py-2 text-[11px] font-semibold text-teal-800"><ShieldCheck className="mr-1 inline h-3 w-3" />Assigned to {a.assignedTo} ({a.assignedKind})</p>}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setDetail(a)}>View</Button>
                  {a.status === "pending" && <Button size="sm" className="h-8 bg-emerald-600 text-xs font-bold" onClick={() => { acceptAssistance(a.id); toast({ title: "Assistance accepted" }) }}><CheckCircle2 className="mr-1 h-3 w-3" /> Accept</Button>}
                  {a.status === "accepted" && <Button size="sm" className="h-8 text-xs font-bold" onClick={() => setAssignOpen(a)}><Bike className="mr-1 h-3 w-3" /> Assign Delivery</Button>}
                  {a.status === "assigned" && <Button size="sm" className="h-8 bg-emerald-600 text-xs font-bold" onClick={() => { completeAssistance(a.id); toast({ title: "Assistance completed 🎉", description: `${a.peopleCount} people served.` }) }}><CheckCircle2 className="mr-1 h-3 w-3" /> Complete</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {done.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Completed</h3>
          <div className="space-y-2">
            {done.map((a) => (
              <Card key={a.id} className="py-3"><CardContent className="flex items-center justify-between gap-2 px-4">
                <div className="min-w-0"><p className="truncate text-sm font-bold">{a.foodNeeded}</p><p className="text-xs text-muted-foreground">{a.area} · {a.peopleCount} people · {a.assignedTo ? `by ${a.assignedTo}` : ""}</p></div>
                <StatusBadge status="completed" />
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {/* detail */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-sm">
          {detail && (
            <>
              <DialogHeader><DialogTitle>{detail.foodNeeded}</DialogTitle><DialogDescription>Reported by {detail.submittedByName} ({detail.submittedByPhone}) · {timeAgo(detail.createdAt)}</DialogDescription></DialogHeader>
              <div className="grid grid-cols-2 gap-2">
                <Labeled label="Approximate area">{detail.area}</Labeled>
                <Labeled label="City">{detail.city}</Labeled>
                <Labeled label="People">{detail.peopleCount}</Labeled>
                <Labeled label="Status"><StatusBadge status={detail.status} /></Labeled>
              </div>
              {detail.description && <p className="rounded-lg bg-muted/50 p-3 text-sm">{detail.description}</p>}
              <div className={cn("flex items-center gap-2 rounded-xl border-2 border-dashed p-3", detail.hasProofPhoto ? "border-rose-300 bg-rose-50/50" : "border-muted")}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700"><Camera className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-bold">{detail.hasProofPhoto ? "Private proof photo attached" : "No proof photo"}</p>
                  <p className="text-[10px] text-muted-foreground">Visible only within authorized NGO workflow — never public.</p>
                </div>
              </div>
              <Button className="w-full font-bold" onClick={() => setDetail(null)}>Close</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* assign */}
      <Dialog open={!!assignOpen} onOpenChange={(v) => !v && setAssignOpen(null)}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          {assignOpen && (
            <>
              <DialogHeader><DialogTitle>Assign delivery</DialogTitle><DialogDescription>{assignOpen.foodNeeded} → {assignOpen.area}. Choose an own volunteer, or match a delivery partner.</DialogDescription></DialogHeader>
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Own volunteers</p>
                  <div className="space-y-2">
                    {volunteers.filter((v) => v.active).map((v) => (
                      <button key={v.id} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left active:bg-muted/50"
                        onClick={() => { assignAssistance(assignOpen.id, "volunteer", v.name); setAssignOpen(null); toast({ title: `Volunteer ${v.name} assigned` }) }}>
                        <Avatar className="h-8 w-8"><AvatarFallback className="text-[11px] font-bold">{v.name.split(" ").map((w) => w[0]).join("")}</AvatarFallback></Avatar>
                        <span className="min-w-0 flex-1 text-sm font-bold">{v.name}</span>
                        <span className="text-xs text-muted-foreground">{v.vehicle}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Delivery partners (rule-based match)</p>
                  <div className="space-y-2">
                    {matchPartners({
                      id: assignOpen.id, type: "community", title: "", pickupName: "", pickupArea: "", pickupCity: assignOpen.city, pickupLat: 0, pickupLng: 0,
                      destName: "", destArea: assignOpen.area, destLat: 0, destLng: 0, foodDescription: "",
                      quantity: assignOpen.peopleCount, unit: "meals", requiredVehicle: assignOpen.peopleCount > 60 ? ["Van", "Mini Truck", "Truck"] : ["Bike", "Scooter", "Auto", "Car", "Van"],
                      distanceKm: 4, etaMin: 20, status: "available", createdAt: "",
                    }, partners).filter((m) => m.suitable).map((m) => (
                      <button key={m.partner.id} className="w-full rounded-xl border p-3 text-left active:bg-muted/50"
                        onClick={() => { assignAssistance(assignOpen.id, "partner", m.partner.name, m.partner.id); setAssignOpen(null); toast({ title: `Partner ${m.partner.name} assigned`, description: "A community delivery request is now visible to the partner (demo)." }) }}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{m.partner.name}</span>
                          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{m.score}/100 fit</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{m.partner.profile.vehicleType} · cap {m.partner.profile.capacity} · {m.partner.profile.serviceArea}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{m.reasons.slice(0, 3).join(" · ")}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  )
}

// ============================================================
// FOOD DONATIONS (incoming)
// ============================================================
export function NgoDonations() {
  const org = useCurrentOrg()
  const listings = useStore((s) => s.listings)
  const acceptIncomingDonation = useStore((s) => s.acceptIncomingDonation)
  const inventory = useStore((s) => s.inventory)
  const navigate = useStore((s) => s.navigate)
  const { toast } = useToast()

  const incoming = listings.filter((l) => l.status === "active" && l.providerId !== org?.id && l.quantityRemaining > 0)
  const received = inventory.filter((i) => i.orgId === org?.id && i.batch.startsWith("DN-"))

  return (
    <PageWrap>
      <SectionHeader title="Food Donations" desc="Available surplus donations from kitchens, food banks and individuals that your NGO can accept for redistribution." />
      {incoming.length === 0 ? (
        <EmptyState icon={<HandHeart className="h-7 w-7" />} title="No donations available right now" desc="When kitchens or individuals list surplus food, it appears here for your NGO to accept." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {incoming.map((l) => (
            <Card key={l.id} className="py-4">
              <CardContent className="space-y-2 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold leading-tight">{l.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{l.providerName} · {l.city}</p>
                  </div>
                  {l.isIndividual ? <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">INDIVIDUAL</span> : <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">ORGANIZATION</span>}
                </div>
                <QuantityMeter remaining={l.quantityRemaining} total={l.quantityTotal} unit={l.unit} />
                <p className="text-[11px] text-muted-foreground">{l.foodCategory} · {l.storage} · available {timeUntil(l.availableUntil)}</p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="h-8 bg-emerald-600 text-xs font-bold" onClick={() => { acceptIncomingDonation(l.id); toast({ title: "Donation accepted 🎉", description: `${l.quantityRemaining} ${l.unit} added to your inventory.` }) }}><CheckCircle2 className="mr-1 h-3 w-3" /> Accept Donation</Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => navigate("n-map")}>On Map</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {received.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Recently received into inventory</h3>
          <div className="space-y-2">
            {received.map((i) => (
              <Card key={i.id} className="py-3"><CardContent className="flex items-center justify-between gap-2 px-4">
                <div className="min-w-0"><p className="truncate text-sm font-bold">{i.name}</p><p className="text-xs text-muted-foreground">{i.quantity} {i.unit} · batch {i.batch} · {timeAgo(i.addedAt)}</p></div>
                <StatusBadge status="ok" />
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}
    </PageWrap>
  )
}

// ============================================================
// FREE FOOD DISTRIBUTION
// ============================================================
export function NgoDistribution() {
  const org = useCurrentOrg()
  const listings = useStore((s) => s.listings)
  const createDonation = useStore((s) => s.createDonation)
  const { toast } = useToast()
  const [f, setF] = useState({ title: "", qty: "100", unit: "meals", type: "dinner", from: "7 PM", to: "9 PM", modes: ["pickup", "eat-here"] as string[] })

  const mine = listings.filter((l) => l.providerId === org?.id && l.status === "active")

  const toggleMode = (m: string) => setF({ ...f, modes: f.modes.includes(m) ? f.modes.filter((x) => x !== m) : [...f.modes, m] })

  const publish = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.title) { toast({ title: "Please enter the food name", variant: "destructive" }); return }
    createDonation({
      title: `Free ${f.title}`, foodCategory: "Cooked Meal", quantity: Math.max(1, Number(f.qty) || 1), unit: f.unit,
      preparedHoursAgo: 0.5, storage: "Hot case (kept above 60°C)",
      pickupArea: `${org?.address.split(",").slice(-2).join(",").trim() ?? org?.city} · ${f.from}–${f.to} (${f.type})`,
      availableHours: 5, pickup: f.modes.includes("pickup"), eatHere: f.modes.includes("eat-here"), delivery: f.modes.includes("delivery"),
      notes: `Free community meal — ${f.type} service ${f.from} to ${f.to}.`,
    })
    toast({ title: "Distribution published 🎉", description: "Now visible in the free-food ecosystem and on the map." })
    setF({ ...f, title: "" })
  }

  return (
    <PageWrap>
      <SectionHeader title="Free Food Distribution" desc="Publish a free community meal — pickup, eat-here and/or delivery." badge={<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">ALWAYS FREE</span>} />
      <Card className="py-5">
        <CardContent className="px-5">
          <form className="space-y-4" onSubmit={publish}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label>Food (e.g. Dal Rice)</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Dal Rice" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" min={1} value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Unit</Label>
                  <Select value={f.unit} onValueChange={(v) => setF({ ...f, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["meals", "packs", "kits"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Distribution type</Label>
                <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["breakfast", "lunch", "dinner", "snacks", "relief"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>From</Label>
                  <Select value={f.from} onValueChange={(v) => setF({ ...f, from: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["7 AM", "9 AM", "12 PM", "2 PM", "5 PM", "7 PM"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>To</Label>
                  <Select value={f.to} onValueChange={(v) => setF({ ...f, to: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["9 AM", "11 AM", "2 PM", "4 PM", "6 PM", "9 PM"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Location</Label><Input readOnly value={org?.name ?? ""} className="bg-muted/50" /></div>
            </div>
            <div className="space-y-2">
              <Label>Distribution modes</Label>
              <div className="grid grid-cols-3 gap-2">
                {([["pickup", "Pickup"], ["eat-here", "Eat Here"], ["delivery", "Delivery"]] as const).map(([k, label]) => (
                  <button key={k} type="button" onClick={() => toggleMode(k)}
                    className={cn("rounded-xl border-2 px-3 py-2.5 text-xs font-bold", f.modes.includes(k) ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="h-11 w-full bg-emerald-600 font-bold"><UtensilsCrossed className="mr-1.5 h-4 w-4" /> Publish Free Distribution</Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">My active distributions ({mine.length})</h3>
        {mine.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">No active distributions — publish one above.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {mine.map((l) => (
              <Card key={l.id} className="py-4">
                <CardContent className="space-y-2 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="truncate font-bold">{l.title}</p><p className="text-xs text-muted-foreground">{l.notes ?? l.area}</p></div>
                    <StatusBadge status={l.status} />
                  </div>
                  <QuantityMeter remaining={l.quantityRemaining} total={l.quantityTotal} unit={l.unit} />
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {l.pickup && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">Pickup</span>}
                    {l.eatHere && <span className="rounded-full bg-teal-50 px-2 py-0.5 font-semibold text-teal-700">Eat Here</span>}
                    {l.delivery && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">Delivery</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWrap>
  )
}

// ============================================================
// BENEFICIARIES
// ============================================================
export function NgoBeneficiaries() {
  const org = useCurrentOrg()
  const beneficiaries = useStore((s) => s.beneficiaries)
  const addBeneficiary = useStore((s) => s.addBeneficiary)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: "", category: "family", people: "4", area: "", notes: "" })

  const mine = beneficiaries.filter((b) => b.ngoId === org?.id)
  const totalPeople = mine.reduce((s, b) => s + b.peopleCount, 0)

  return (
    <PageWrap>
      <SectionHeader
        title="Beneficiaries"
        desc={`${mine.length} registered groups · ${totalPeople} people total (demo registry)`}
        action={<Button size="sm" className="font-bold" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Add</Button>}
      />
      {mine.length === 0 ? (
        <EmptyState icon={<Users className="h-7 w-7" />} title="No beneficiaries yet" desc="Register families, shelters and community groups you serve." action={<Button size="sm" onClick={() => setOpen(true)}>Add first beneficiary</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {mine.map((b) => (
            <Card key={b.id} className="py-4">
              <CardContent className="space-y-1.5 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{b.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{b.category} · {b.area}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{b.peopleCount} people</span>
                </div>
                {b.lastReceived && <p className="text-[11px] text-muted-foreground"><Clock3 className="mr-1 inline h-3 w-3" />Last received {timeAgo(b.lastReceived)}</p>}
                {b.notes && <p className="text-[11px] text-muted-foreground">{b.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Beneficiary</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name / group</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Sharma family" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Category</Label>
                <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["family", "individual", "shelter", "school", "community"].map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>People</Label><Input type="number" min={1} value={f.people} onChange={(e) => setF({ ...f, people: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Area</Label><Input value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder="Approximate area" /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1 font-bold" onClick={() => {
              if (!f.name) return
              addBeneficiary({ name: f.name, category: f.category as "family", peopleCount: Number(f.people) || 1, area: f.area || "—", notes: f.notes || undefined })
              setOpen(false); setF({ name: "", category: "family", people: "4", area: "", notes: "" })
              toast({ title: "Beneficiary added" })
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrap>
  )
}

// ============================================================
// VOLUNTEERS
// ============================================================
export function NgoVolunteers() {
  const org = useCurrentOrg()
  const volunteers = useStore((s) => s.volunteers)
  const addVolunteer = useStore((s) => s.addVolunteer)
  const toggleVolunteer = useStore((s) => s.toggleVolunteer)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: "", phone: "", vehicle: "Bike", area: "", availability: "Daily 5–9 PM" })

  const mine = volunteers.filter((v) => v.ngoId === org?.id)
  const VOL = ["Bicycle", "Bike", "Scooter", "Auto", "Car", "Van"]

  return (
    <PageWrap>
      <SectionHeader title="Own Delivery Team" desc={`${mine.filter((v) => v.active).length} active of ${mine.length} volunteers`}
        action={<Button size="sm" className="font-bold" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Add Volunteer</Button>} />
      <div className="grid gap-3 sm:grid-cols-2">
        {mine.map((v: Volunteer) => (
          <Card key={v.id} className="py-4">
            <CardContent className="space-y-2 px-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-emerald-100 text-xs font-bold text-emerald-700">{v.name.split(" ").map((w) => w[0]).join("")}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{v.name}</p>
                  <p className="truncate text-xs text-muted-foreground"><Phone className="mr-1 inline h-3 w-3" />{v.phone} · {v.vehicle}</p>
                </div>
                <StatusBadge status={v.active ? "active" : "expired"} />
              </div>
              <p className="text-[11px] text-muted-foreground">{v.serviceArea} · {v.availability}</p>
              {v.currentTask && <p className="rounded-lg bg-teal-50 px-3 py-1.5 text-[11px] font-semibold text-teal-800"><Truck className="mr-1 inline h-3 w-3" />{v.currentTask}</p>}
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { toggleVolunteer(v.id); toast({ title: v.active ? "Volunteer set inactive" : "Volunteer activated" }) }}>
                {v.active ? "Set Inactive" : "Activate"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <InfoBanner tone="info">Workflow: Request → Assign Volunteer → Pickup → Delivery → Complete. Assign from <b>Food Requests</b> or <b>Community Assistance</b>.</InfoBanner>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Volunteer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Vehicle</Label>
                <Select value={f.vehicle} onValueChange={(v) => setF({ ...f, vehicle: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VOL.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Service area</Label><Input value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Availability</Label><Input value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1 font-bold" onClick={() => {
              if (!f.name) return
              addVolunteer({ name: f.name, phone: f.phone, vehicle: f.vehicle, serviceArea: f.area || "—", availability: f.availability, active: true })
              setOpen(false); setF({ name: "", phone: "", vehicle: "Bike", area: "", availability: "Daily 5–9 PM" })
              toast({ title: "Volunteer added to your team" })
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrap>
  )
}

// ============================================================
// DELIVERY PARTNERS
// ============================================================
export function NgoPartners() {
  const partners = useStore((s) => s.partners)
  const deliveries = useStore((s) => s.deliveryRequests)
  return (
    <PageWrap>
      <SectionHeader title="Delivery Partners" desc="Independent partners available for your deliveries — matched with deterministic rules (city, vehicle, capacity, availability)." />
      <div className="grid gap-3 sm:grid-cols-2">
        {partners.map((p) => (
          <Card key={p.id} className="py-4">
            <CardContent className="space-y-2 px-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-amber-100 text-xs font-bold text-amber-700">{p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.profile.vehicleType} · {p.profile.city} · {p.profile.availability}</p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{p.rating} ★</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Labeled label="Capacity">{p.profile.capacity} meals</Labeled>
                <Labeled label="Done">{p.completedDeliveries}</Labeled>
                <Labeled label="Community">{p.profile.communityAssistance ? "Yes" : "No"}</Labeled>
              </div>
              <p className="text-[11px] text-muted-foreground">{p.profile.serviceArea} · prefers {p.profile.preferences.slice(0, 2).join(", ")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Recent delivery jobs</h3>
        <div className="space-y-2">
          {deliveries.slice(0, 6).map((d) => (
            <Card key={d.id} className="py-3"><CardContent className="flex items-center justify-between gap-2 px-4">
              <div className="min-w-0"><p className="truncate text-sm font-bold">{d.title}</p><p className="text-xs text-muted-foreground">{d.quantity} {d.unit} · {d.distanceKm} km · {d.partnerName ?? d.assignedVolunteer ?? "awaiting partner"}</p></div>
              <StatusBadge status={d.status} />
            </CardContent></Card>
          ))}
        </div>
      </div>
    </PageWrap>
  )
}

// ============================================================
// FEEDBACK
// ============================================================
export function NgoFeedback() {
  const feedback = useStore((s) => s.feedback)
  const avg = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "—"
  return (
    <PageWrap>
      <SectionHeader title="Feedback & Ratings" desc={`${feedback.length} reviews · average ${avg} ★ (only completed demo transactions produce ratings)`} />
      {feedback.length === 0 ? (
        <EmptyState icon={<MessageSquareHeart className="h-7 w-7" />} title="No feedback yet" desc="Ratings from people who received your food will appear here." />
      ) : (
        <div className="space-y-3">
          {feedback.map((f) => (
            <Card key={f.id} className="py-4">
              <CardContent className="space-y-2 px-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{f.fromName} → {f.toName}</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("h-4 w-4", n <= f.rating ? "fill-amber-400 text-amber-500" : "text-muted-foreground/30")} />)}
                  </div>
                </div>
                {f.comment && <p className="text-sm text-muted-foreground">“{f.comment}”</p>}
                <p className="text-[11px] text-muted-foreground">{timeAgo(f.at)} · {f.toRole} review</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageWrap>
  )
}
