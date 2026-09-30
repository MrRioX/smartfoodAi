"use client"
// ============================================================
// SmartFood AI — User: Donate Food (free) + Community Help
// Donation location comes from the user's saved profile location
// OR a real map picker — never random coordinates.
// ============================================================
import { useState } from "react"
import { useStore, useCurrentUser } from "@/lib/store"
import type { AssessmentResult, GeoLocation } from "@/lib/types"
import { CITY_NAMES } from "@/lib/cities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PageWrap } from "./shell"
import { Card, CardContent, SectionHeader, StatusBadge, InfoBanner, EmptyState, timeAgo } from "./shared"
import { AiFoodCheckDialog } from "./food-check"
import { MapPicker, LocationSummary } from "@/components/maps/MapPicker"
import { HandHeart, Camera, CheckCircle2, ShieldCheck, HeartHandshake, MapPin, Users, Lock } from "lucide-react"

// ---------------- DONATE FOOD ----------------
export function DonateFood() {
  const user = useCurrentUser()
  const createDonation = useStore((s) => s.createDonation)
  const navigate = useStore((s) => s.navigate)
  const { toast } = useToast()
  const [f, setF] = useState({
    title: "", category: "Cooked Meal", qty: "10", unit: "meals",
    preparedHours: "2", availableHours: "4", storage: "Hot case (kept above 60°C)",
    area: "", notes: "",
  })
  const [locMode, setLocMode] = useState<"profile" | "pick">("profile")
  const [pickedLoc, setPickedLoc] = useState<GeoLocation | null>(null)
  const [assessOpen, setAssessOpen] = useState(false)
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null)

  if (!user?.donorMode) {
    return (
      <PageWrap>
        <SectionHeader title="Donate Food" desc="Food Donor mode is currently OFF." />
        <EmptyState
          icon={<HandHeart className="h-7 w-7" />} title="Turn on Food Donor mode to donate"
          desc="Go to your Profile and switch on Food Donor mode. Individual food donations are always free donations."
          action={<Button size="sm" onClick={() => navigate("u-profile")}>Open Profile</Button>}
        />
      </PageWrap>
    )
  }

  const profileLoc = user.location

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.title) { toast({ title: "Please fill the food name", variant: "destructive" }); return }
    if (locMode === "pick" && !pickedLoc) { toast({ title: "Pick the donation location on the map first", variant: "destructive" }); return }
    const res = createDonation({
      title: f.title, foodCategory: f.category, quantity: Math.max(1, Number(f.qty) || 1), unit: f.unit,
      preparedHoursAgo: Number(f.preparedHours) || 0, storage: f.storage, pickupArea: f.area,
      availableHours: Math.max(1, Number(f.availableHours) || 4),
      pickup: true, eatHere: false, delivery: false, notes: f.notes, assessment: assessment ?? undefined,
      location: locMode === "pick" ? pickedLoc! : undefined, // undefined → profile location
    })
    toast(res.ok ? { title: "Donation listed successfully 🎉", description: "Your free donation is now visible in Find Free Food and on the map at the saved location." } : { title: res.message, variant: "destructive" })
    if (res.ok) { setF({ ...f, title: "", qty: "10", notes: "" }); setAssessment(null); setPickedLoc(null); setLocMode("profile") }
  }

  return (
    <PageWrap>
      <SectionHeader
        title="Create Food Donation"
        desc="Share surplus food with people nearby — completely free."
        badge={<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">FREE DONATION</span>}
      />
      <InfoBanner tone="info"><b>Individual food donations are free donations.</b> There is no payment, no selling and no fees — ever.</InfoBanner>
      <Card className="py-5">
        <CardContent className="space-y-4 px-5">
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Food name *</Label>
                <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Home-made Dal Rice" />
              </div>
              <div className="space-y-1.5">
                <Label>Food category</Label>
                <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Cooked Meal", "Bakery", "Packaged", "Groceries", "Raw Ingredients", "Fruits & Vegetables"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" min={1} value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Unit</Label>
                  <Select value={f.unit} onValueChange={(v) => setF({ ...f, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["meals", "packs", "kg", "L", "loaves", "kits"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Prepared / packed (hours ago)</Label>
                <Input type="number" min={0} step="0.5" value={f.preparedHours} onChange={(e) => setF({ ...f, preparedHours: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Available for (hours)</Label>
                <Input type="number" min={1} value={f.availableHours} onChange={(e) => setF({ ...f, availableHours: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Storage information</Label>
                <Select value={f.storage} onValueChange={(v) => setF({ ...f, storage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Hot case (kept above 60°C)", "Refrigerated 4–6°C", "Frozen", "Room temperature", "Packaged / sealed", "Dry store"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Photo (optional)</Label>
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-xs font-semibold text-emerald-700">
                  <Camera className="h-4 w-4" /> Take / upload photo
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => toast({ title: "Photo attached (demo)", description: "File input works — image is not stored in the demo listing." })} />
                </label>
              </div>
              <div className="space-y-1.5">
                <Label>Barcode (optional)</Label>
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-xs font-semibold text-emerald-700">
                  <Camera className="h-4 w-4" /> Scan barcode
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => toast({ title: "Use AI Check Food for real barcode detection", description: "The AI Food Check combines vision + barcode detection." })} />
                </label>
              </div>

              {/* -------- donation location -------- */}
              <div className="space-y-2 sm:col-span-2">
                <Label>Donation location *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setLocMode("profile")}
                    className={cn("rounded-xl border-2 px-3 py-2.5 text-left text-xs font-bold", locMode === "profile" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground")}>
                    Use my saved location
                    <span className="block truncate text-[10px] font-normal text-muted-foreground">{profileLoc ? `${profileLoc.address || profileLoc.city} · ${profileLoc.city}` : "No saved location — set one via map"}</span>
                  </button>
                  <button type="button" onClick={() => setLocMode("pick")}
                    className={cn("rounded-xl border-2 px-3 py-2.5 text-left text-xs font-bold", locMode === "pick" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground")}>
                    Pick on map
                    <span className="block text-[10px] font-normal text-muted-foreground">Choose an exact pickup point</span>
                  </button>
                </div>
                {locMode === "profile" ? (
                  <LocationSummary location={profileLoc ?? null} />
                ) : pickedLoc ? (
                  <LocationSummary location={pickedLoc} onEdit={() => setPickedLoc(null)} />
                ) : (
                  <MapPicker
                    label="Where should people pick this food?"
                    initial={profileLoc ?? null}
                    confirmLabel="Confirm Donation Location"
                    onConfirm={(loc) => setPickedLoc(loc)}
                  />
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Area / landmark note (optional)</Label>
                <Input value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder="e.g. Gate 2, blue door — helps people find you" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Notes (optional)</Label>
                <Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Allergens, packaging details…" />
              </div>
            </div>

            {assessment && (
              <div className={cn("rounded-xl border p-3 text-sm", assessment === "eligible" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : assessment === "review" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-red-300 bg-red-50 text-red-900")}>
                <div className="flex items-center gap-2"><StatusBadge status={assessment} /></div>
                <p className="mt-1.5 text-xs">AI check attached to this donation (screening — not a food-safety certification).</p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 flex-1 font-bold" onClick={() => setAssessOpen(true)}>
                <HandHeart className="mr-1.5 h-4 w-4" /> AI Check Food
              </Button>
              <Button type="submit" className="h-11 flex-1 font-bold">
                <HandHeart className="mr-1.5 h-4 w-4" /> Create Donation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <InfoBanner tone="demo">Demo tip: after publishing, your donation appears in <b>Find Free Food</b>, on the <b>Explore Map</b> at the saved coordinates, and NGOs receive a notification.</InfoBanner>
      <AiFoodCheckDialog
        open={assessOpen} onOpenChange={setAssessOpen}
        defaultHours={Number(f.preparedHours) || 0} defaultStorage={f.storage} foodName={f.title || "Food item"}
        onResult={(r) => setAssessment(r)}
      />
    </PageWrap>
  )
}

// ---------------- COMMUNITY HELP ----------------
export function CommunityHelp() {
  const user = useCurrentUser()
  const submitAssistance = useStore((s) => s.submitAssistance)
  const assistance = useStore((s) => s.assistance)
  const { toast } = useToast()
  const [f, setF] = useState({ area: "", city: "Ahmedabad", people: "5", food: "", desc: "" })
  const [approxLoc, setApproxLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [photo, setPhoto] = useState(false)
  const [done, setDone] = useState(false)

  const mine = assistance.filter((a) => a.submittedByName === user?.name)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.area || !f.food) { toast({ title: "Please fill approximate location and food requirement", variant: "destructive" }); return }
    submitAssistance({
      area: f.area, city: f.city, peopleCount: Number(f.people) || 1, foodNeeded: f.food,
      description: f.desc || undefined, hasProofPhoto: photo,
      approxLocation: approxLoc ?? undefined,
    })
    setDone(true)
  }

  return (
    <PageWrap>
      <SectionHeader
        title="Community Help"
        desc="Report people or areas that need free food assistance. NGOs nearby will be notified."
        badge={<span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">CONFIDENTIAL</span>}
      />
      <InfoBanner tone="warning">
        <div className="flex items-start gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span><b>Privacy first:</b> proof photos are confidential and visible only inside the authorized NGO workflow.
            Public maps show only an <b>approximate aggregated area</b> — never exact coordinates of vulnerable people.</span>
        </div>
      </InfoBanner>

      {done ? (
        <Card className="py-6">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-600" />
            <p className="text-lg font-bold">Assistance request submitted</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Nearby NGOs have been notified. Once accepted, a volunteer or delivery partner will be assigned.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => { setDone(false); setF({ ...f, area: "", food: "", desc: "" }); setPhoto(false); setApproxLoc(null) }}>Submit another request</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-5">
          <CardContent className="px-5">
            <form className="space-y-4" onSubmit={submit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label><MapPin className="mr-1 inline h-3 w-3" /> Approximate location (area only) *</Label>
                  <Input value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder="e.g. Near Kalupur Station (approx.)" />
                  <p className="text-[10px] text-muted-foreground">Only the approximate area is shared — exact location is never public.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Select value={f.city} onValueChange={(v) => setF({ ...f, city: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CITY_NAMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label><Users className="mr-1 inline h-3 w-3" /> Number of people</Label>
                  <Input type="number" min={1} value={f.people} onChange={(e) => setF({ ...f, people: e.target.value })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Food required *</Label>
                  <Input value={f.food} onChange={(e) => setF({ ...f, food: e.target.value })} placeholder="e.g. Dinner meals for 12 people" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Approximate area centre (optional map pin)</Label>
                  {approxLoc ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                      <span className="font-mono">≈ {approxLoc.lat.toFixed(3)}, {approxLoc.lng.toFixed(3)} (jittered for privacy)</span>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px] font-bold" onClick={() => setApproxLoc(null)}>Change</Button>
                    </div>
                  ) : (
                    <MapPicker
                      label="Tap the approximate area on the map (optional — helps NGOs route help)"
                      initial={user?.location ? { ...user.location } : null}
                      confirmLabel="Use This Approximate Area"
                      heightClass="h-[240px] sm:h-[280px]"
                      onConfirm={(loc) => setApproxLoc({ lat: loc.lat, lng: loc.lng })}
                    />
                  )}
                  <p className="text-[10px] text-muted-foreground">Privacy: stored coordinates are randomly jittered so the exact point is never exposed.</p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Description (optional)</Label>
                  <Textarea rows={2} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Context that helps NGOs prepare…" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label><Lock className="mr-1 inline h-3 w-3" /> Private proof photo (optional)</Label>
                  <label className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-xs font-semibold",
                    photo ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-rose-300 bg-rose-50/50 text-rose-700")}>
                    <Camera className="h-4 w-4" /> {photo ? "Photo attached (kept private)" : "Attach proof photo — stays confidential"}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => { setPhoto(true); toast({ title: "Photo attached — kept confidential", description: "Visible only inside the authorized NGO workflow (demo)." }) }} />
                  </label>
                </div>
              </div>
              <Button type="submit" className="h-11 w-full font-bold"><HeartHandshake className="mr-1.5 h-4 w-4" /> Submit Assistance Request</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {mine.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">My submitted requests</h3>
          <div className="space-y-2">
            {mine.map((a) => (
              <Card key={a.id} className="py-3">
                <CardContent className="flex items-center justify-between gap-2 px-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{a.foodNeeded}</p>
                    <p className="text-xs text-muted-foreground">{a.area} · {a.peopleCount} people · {timeAgo(a.createdAt)}</p>
                    {a.assignedTo && <p className="mt-0.5 text-[11px] font-semibold text-teal-700"><ShieldCheck className="mr-1 inline h-3 w-3" />Assigned to {a.assignedTo}</p>}
                  </div>
                  <StatusBadge status={a.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageWrap>
  )
}
