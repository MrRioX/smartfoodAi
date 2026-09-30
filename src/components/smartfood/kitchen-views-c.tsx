"use client"
// ============================================================
// SmartFood AI — Kitchen views C
// Food Listings · Delivery · Analytics (+ Processing preview) · Reports (ESG)
// ============================================================
import { useMemo, useState } from "react"
import { useStore, useCurrentOrg } from "@/lib/store"
import { takeDonationPrefill } from "@/lib/ui-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PageWrap } from "./shell"
import {
  Card, CardContent, SectionHeader, StatusBadge, EmptyState, InfoBanner,
  DemoBadge, SimBadge, Labeled, QuantityMeter, timeAgo, inr, KpiGrid, StatCard,
} from "./shared"
import {
  HandHeart, Plus, UtensilsCrossed, Truck, BarChart3, Factory, Zap, Recycle,
  FileBarChart, Printer, Leaf, CheckCircle2, Package, Snowflake, Cog, AlertTriangle, Sparkles,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts"

// ============================================================
// FOOD LISTINGS (create free listing)
// ============================================================
export function KitchenListings() {
  const org = useCurrentOrg()
  const listings = useStore((s) => s.listings)
  const requests = useStore((s) => s.requests)
  const createDonation = useStore((s) => s.createDonation)
  const respondToRequest = useStore((s) => s.respondToRequest)
  const { toast } = useToast()
  // Read one-shot prefill (set by AI Food Assessment) at mount time
  const [f, setF] = useState(() => {
    const p = takeDonationPrefill()
    return {
      title: p?.title ?? "", category: p?.foodCategory ?? "Cooked Meal", qty: "50", unit: "meals",
      preparedHours: "1", availableHours: "5", storage: p?.storage ?? "Hot case (kept above 60°C)",
      modes: ["pickup", "delivery"] as string[], notes: p?.notes ?? "",
    }
  })
  const hadPrefill = useMemo(() => f.title !== "", []) // true when AI assessment prefilled this form

  const mine = listings.filter((l) => l.providerId === org?.id && l.status === "active")
  const myRequests = requests.filter((r) => r.providerId === org?.id && ["requested", "accepted", "ready"].includes(r.status))
  const toggleMode = (m: string) => setF({ ...f, modes: f.modes.includes(m) ? f.modes.filter((x) => x !== m) : [...f.modes, m] })

  const publish = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.title) { toast({ title: "Please enter a food name", variant: "destructive" }); return }
    const res = createDonation({
      title: f.title, foodCategory: f.category, quantity: Math.max(1, Number(f.qty) || 1), unit: f.unit,
      preparedHoursAgo: Number(f.preparedHours) || 0, storage: f.storage,
      pickupArea: org?.address.split(",").slice(-2).join(",").trim() ?? org?.city ?? "",
      availableHours: Math.max(1, Number(f.availableHours) || 5),
      pickup: f.modes.includes("pickup"), eatHere: f.modes.includes("eat-here"), delivery: f.modes.includes("delivery"),
      notes: f.notes,
    })
    toast(res.ok ? { title: "Donation listed successfully 🎉", description: "Visible in the free-food ecosystem and on the map." } : { title: res.message, variant: "destructive" })
    if (res.ok) setF({ ...f, title: "", notes: "" })
  }

  return (
    <PageWrap>
      <SectionHeader title="Food Listings" desc="Publish surplus food as FREE listings for NGOs and people." badge={<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">100% FREE</span>} />
      {hadPrefill && (
        <InfoBanner tone="success"><Sparkles className="mr-1 inline h-3.5 w-3.5" /> AI assessment applied — this listing form was prefilled from your screening result. Review and publish.</InfoBanner>
      )}
      <Card className="py-5">
        <CardContent className="px-5">
          <form className="space-y-4" onSubmit={publish}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label>Food name *</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Free Khichdi (lunch surplus)" /></div>
              <div className="space-y-1.5"><Label>Category</Label>
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
                    <SelectContent>{["meals", "packs", "kg", "L", "loaves"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Prepared (hours ago)</Label><Input type="number" min={0} step="0.5" value={f.preparedHours} onChange={(e) => setF({ ...f, preparedHours: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Available for (hours)</Label><Input type="number" min={1} value={f.availableHours} onChange={(e) => setF({ ...f, availableHours: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Storage</Label>
                <Select value={f.storage} onValueChange={(v) => setF({ ...f, storage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Hot case (kept above 60°C)", "Refrigerated 4–6°C", "Frozen", "Room temperature", "Packaged / sealed", "Dry store"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Modes</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([["pickup", "Pickup"], ["eat-here", "Eat Here"], ["delivery", "Delivery"]] as const).map(([k, label]) => (
                    <button key={k} type="button" onClick={() => toggleMode(k)}
                      className={cn("rounded-xl border-2 px-3 py-2.5 text-xs font-bold", f.modes.includes(k) ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground")}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Packaging, allergens, AI assessment summary…" /></div>
            </div>
            <Button type="submit" className="h-11 w-full bg-emerald-600 font-bold"><Plus className="mr-1.5 h-4 w-4" /> Publish Free Listing</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">My active listings ({mine.length})</h3>
          {mine.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">No active listings.</p>
          ) : (
            <div className="space-y-2">
              {mine.map((l) => (
                <Card key={l.id} className="py-3"><CardContent className="space-y-1.5 px-4">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{l.title}</p><StatusBadge status={l.status} /></div>
                  <QuantityMeter remaining={l.quantityRemaining} total={l.quantityTotal} unit={l.unit} />
                </CardContent></Card>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Claims on my listings ({myRequests.length})</h3>
          {myRequests.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">No open claims.</p>
          ) : (
            <div className="space-y-2">
              {myRequests.map((r) => (
                <Card key={r.id} className="py-3"><CardContent className="space-y-1.5 px-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0"><p className="truncate text-sm font-bold">{r.userName} · {r.quantity}× {r.listingTitle}</p><p className="text-xs text-muted-foreground">{r.mode} · {timeAgo(r.createdAt)}</p></div>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.status === "requested" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 bg-emerald-600 text-[11px] font-bold" onClick={() => { respondToRequest(r.id, "accept"); toast({ title: "Claim accepted" }) }}>Accept</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { respondToRequest(r.id, "ready"); toast({ title: "Marked ready" }) }}>Ready</Button>
                    </div>
                  )}
                </CardContent></Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrap>
  )
}

// ============================================================
// DELIVERY (kitchen side)
// ============================================================
export function KitchenDelivery() {
  const org = useCurrentOrg()
  const deliveries = useStore((s) => s.deliveryRequests)
  const orgs = useStore((s) => s.organizations)
  const { toast } = useToast()
  const [f, setF] = useState({ food: "Khichdi (hot packed)", qty: "120", ngo: "org-helping-hands" })

  const mine = deliveries.filter((d) => d.pickupName === org?.name || d.type === "kitchen-ngo" || d.type === "kitchen-consumer")

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    const target = orgs.find((o) => o.id === f.ngo)
    if (!target) return
    const qty = Math.max(1, Number(f.qty) || 1)
    const st = useStore.getState()
    const d = {
      id: `d-${Math.random().toString(36).slice(2, 9)}`, type: "kitchen-ngo" as const,
      title: `${f.food} → ${target.name}`,
      pickupName: org?.name ?? "Kitchen", pickupArea: org?.address ?? org?.city ?? "", pickupCity: org?.city ?? "—",
      pickupLat: org?.lat ?? 0, pickupLng: org?.lng ?? 0,
      destName: target.name, destArea: target.address, destLat: target.lat, destLng: target.lng,
      foodDescription: f.food, quantity: qty, unit: "meals",
      requiredVehicle: qty > 100 ? ["Van", "Mini Truck", "Truck"] : qty > 30 ? ["Auto", "Car", "Van", "Mini Truck"] : ["Bicycle", "Bike", "Scooter", "Auto", "Car"],
      distanceKm: 8, etaMin: 30, status: "available" as const, createdAt: new Date().toISOString(),
    }
    useStore.setState({ deliveryRequests: [d, ...st.deliveryRequests] })
    toast({ title: "Delivery request created 🚚", description: "Nearby delivery partners can now accept it." })
  }

  return (
    <PageWrap>
      <SectionHeader title="Delivery" desc="Send surplus to NGOs or consumers via delivery partners." />
      <Card className="py-5">
        <CardContent className="px-5">
          <form className="grid gap-3 sm:grid-cols-4" onSubmit={create}>
            <div className="space-y-1.5 sm:col-span-2"><Label>Food to send</Label><Input value={f.food} onChange={(e) => setF({ ...f, food: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Meals</Label><Input type="number" min={1} value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Send to</Label>
              <Select value={f.ngo} onValueChange={(v) => setF({ ...f, ngo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{orgs.filter((o) => ["ngo", "foodbank"].includes(o.type)).map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-4"><Button type="submit" className="h-10 w-full font-bold"><Truck className="mr-1.5 h-4 w-4" /> Create Delivery Request</Button></div>
          </form>
        </CardContent>
      </Card>
      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Delivery jobs ({mine.length})</h3>
        {mine.length === 0 ? (
          <EmptyState icon={<Truck className="h-7 w-7" />} title="No delivery jobs" desc="Create a delivery request above, or accept claims with delivery mode." />
        ) : (
          <div className="space-y-2">
            {mine.slice(0, 8).map((d) => (
              <Card key={d.id} className="py-3"><CardContent className="flex flex-wrap items-center justify-between gap-2 px-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.quantity} {d.unit} · {d.distanceKm} km · {d.partnerName ?? d.assignedVolunteer ?? "awaiting partner"} · {timeAgo(d.createdAt)}</p>
                </div>
                <StatusBadge status={d.status} />
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>
    </PageWrap>
  )
}

// ============================================================
// ANALYTICS + FOOD PROCESSING UNIT PREVIEW
// ============================================================
export function KitchenAnalytics() {
  const productions = useStore((s) => s.productions)
  const energy = useStore((s) => s.energy)
  const machines = useStore((s) => s.machines)
  const handoffs = useStore((s) => s.recoveryHandoffs)

  // Raw material loss (demo processing data)
  const raw = { input: 1000, output: 875, waste: 55, processLoss: 70, remaining: 875 }
  const efficiency = Math.round((raw.output / raw.input) * 100)

  const energyByCat = useMemo(() => {
    const cats = ["kitchen", "processing", "cold-storage", "machines"] as const
    return cats.map((c) => ({ name: c.replace("-", " "), kwh: energy.filter((e) => e.category === c).reduce((s, e) => s + e.kwh, 0) }))
  }, [energy])

  const prodData = productions.slice(0, 6).reverse().map((p) => ({ name: p.date.slice(5, 10), produced: p.actual, consumed: p.consumed, surplus: p.surplus }))

  return (
    <PageWrap>
      <SectionHeader title="Analytics" desc="Production efficiency, energy and recovery — with a Food Processing Unit architecture preview." badge={<DemoBadge label="DEMO DATA" />} />
      <KpiGrid>
        <StatCard title="Production efficiency" value="94%" icon={<BarChart3 className="h-5 w-5" />} sub="consumed vs produced (demo)" />
        <StatCard title="Surplus rate" value="5.1%" icon={<Factory className="h-5 w-5" />} tone="warning" sub="of total production" />
        <StatCard title="Energy per meal" value="0.44 kWh" icon={<Zap className="h-5 w-5" />} tone="info" sub="simulated" />
        <StatCard title="Recovered this week" value={`${handoffs.reduce((s, h) => s + h.quantity, 0)} kg`} icon={<Recycle className="h-5 w-5" />} tone="positive" sub="compost/biogas/feed" />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-5">
          <CardContent className="space-y-3 px-5">
            <h3 className="text-sm font-bold">Production vs consumption</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prodData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="produced" fill="#059669" radius={[5, 5, 0, 0]} name="Produced" />
                  <Bar dataKey="consumed" fill="#d97706" radius={[5, 5, 0, 0]} name="Consumed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="py-5">
          <CardContent className="space-y-3 px-5">
            <h3 className="flex items-center gap-2 text-sm font-bold"><Zap className="h-4 w-4" /> Energy by category (simulated)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={energyByCat} dataKey="kwh" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3}>
                    {["#059669", "#d97706", "#0d9488", "#9333ea"].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground">Metrics tracked: energy per meal, per batch and per kg (demo values).</p>
          </CardContent>
        </Card>
      </div>

      {/* Food Processing Unit preview */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Food Processing Unit — architecture preview</h3>
          <SimBadge />
        </div>
        <InfoBanner tone="info">
          <Factory className="mr-1 inline h-3.5 w-3.5" />
          Prepared data model for future processing units: raw materials, production batches, machines, runtime/downtime, waste, energy, storage and efficiency. All values below are <b>simulated demo data</b>.
        </InfoBanner>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <Card className="py-5">
            <CardContent className="space-y-3 px-5">
              <h4 className="text-sm font-bold">Raw material loss — Batch #P-0917</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Labeled label="Input">{raw.input} kg</Labeled>
                <Labeled label="Output">{raw.output} kg</Labeled>
                <Labeled label="Process loss">{raw.processLoss} kg</Labeled>
                <Labeled label="Waste">{raw.waste} kg</Labeled>
                <Labeled label="Remaining">{raw.remaining} kg</Labeled>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs"><span className="font-semibold">Yield efficiency</span><span className="font-bold text-emerald-700">{efficiency}%</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${efficiency}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="py-5">
            <CardContent className="space-y-3 px-5">
              <h4 className="text-sm font-bold">Machine monitoring (simulated)</h4>
              <div className="space-y-2">
                {machines.map((m) => (
                  <div key={m.id} className="rounded-xl border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold"><Cog className="mr-1 inline h-3.5 w-3.5" /> {m.name}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                        m.status === "running" ? "bg-emerald-100 text-emerald-700" : m.status === "maintenance" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                        {m.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Running {Math.floor(m.runtimeMin / 60)}h {m.runtimeMin % 60}m · Downtime {m.downtimeMin}m {m.downtimeReason ? `(${m.downtimeReason})` : ""} · {m.energyKwh} kWh
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">e.g. Packaging Machine 03 — Running 5h 20m, Downtime 42m (film roll change). Source: simulated.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrap>
  )
}

// ============================================================
// REPORTS (ESG)
// ============================================================
export function KitchenReports() {
  const [generated, setGenerated] = useState(false)
  const [busy, setBusy] = useState(false)
  const productions = useStore((s) => s.productions)
  const handoffs = useStore((s) => s.recoveryHandoffs)
  const requests = useStore((s) => s.requests)
  const org = useCurrentOrg()

  const redistributed = 1214 + requests.filter((r) => r.providerId === org?.id && r.status === "completed").reduce((s, r) => s + r.quantity, 0)
  const co2 = Math.round(redistributed * 2.5)
  const recovered = handoffs.reduce((s, h) => s + h.quantity, 0)

  const generate = () => {
    setBusy(true)
    setTimeout(() => { setBusy(false); setGenerated(true) }, 1200)
  }

  return (
    <PageWrap>
      <SectionHeader
        title="Sustainability / ESG Report"
        desc="Generate a polished summary of your food-waste prevention performance."
        badge={<DemoBadge label="DEMO REPORT" />}
        action={!generated ? (
          <Button className="font-bold" onClick={generate} disabled={busy}><FileBarChart className="mr-1.5 h-4 w-4" /> {busy ? "Generating…" : "Generate Sustainability Report"}</Button>
        ) : (
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-1.5 h-4 w-4" /> Print / Save as PDF</Button>
        )}
      />

      {!generated ? (
        <EmptyState icon={<FileBarChart className="h-7 w-7" />} title="No report generated yet"
          desc="Tap “Generate Sustainability Report” to build this period's demo ESG summary — food waste reduction, redistribution, recovery, energy and estimated carbon impact."
          action={<Button onClick={generate} disabled={busy}>{busy ? "Generating…" : "Generate now"}</Button>} />
      ) : (
        <div className="space-y-4">
          <Card className="py-6">
            <CardContent className="space-y-4 px-5 sm:px-8">
              <div className="border-b pb-3 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">SmartFood AI — Demo ESG Report</p>
                <h3 className="mt-1 text-lg font-extrabold sm:text-xl">{org?.name ?? "Green Plate Kitchen"}</h3>
                <p className="text-xs text-muted-foreground">Period: last 7 days · Generated {new Date().toLocaleString("en-IN")}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Labeled label="Food waste reduction">37% vs baseline</Labeled>
                <Labeled label="Meals redistributed">{redistributed.toLocaleString("en-IN")}</Labeled>
                <Labeled label="Food recovered">{recovered} kg</Labeled>
                <Labeled label="Est. CO₂e avoided">{(co2 / 1000).toFixed(1)} t</Labeled>
                <Labeled label="Energy usage">415 kWh (simulated)</Labeled>
                <Labeled label="Resource efficiency">92%</Labeled>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Production trend (last {Math.min(5, productions.length)} records)</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productions.slice(0, 5).reverse().map((p) => ({ name: p.date.slice(5, 10), produced: p.actual, surplus: p.surplus }))} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="produced" fill="#059669" radius={[4, 4, 0, 0]} name="Produced" />
                      <Bar dataKey="surplus" fill="#d97706" radius={[4, 4, 0, 0]} name="Surplus" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-2 rounded-xl bg-muted/40 p-4 text-xs leading-relaxed">
                <p><b>Food waste reduction:</b> surplus share dropped to ~5% of production through AI-planned batches (demo calculation).</p>
                <p><b>Redistribution:</b> surplus meals were listed free for NGOs and consumers via SmartFood AI (demo workflow).</p>
                <p><b>Recovery:</b> non-redistributable food was handed to composting / biogas / cattle-feed partners (demo partners).</p>
                <p><b>Energy:</b> per-meal energy 0.44 kWh (simulated sensor data).</p>
                <p className="text-[10px] text-muted-foreground">ESTIMATED ENVIRONMENTAL IMPACT — demo conversion factors, not validated real-world data. This report is a demo artifact for the SIH prototype.</p>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setGenerated(false)}><Recycle className="mr-1.5 h-4 w-4" /> Regenerate later</Button>
          </div>
        </div>
      )}
      <div className="hidden"><UtensilsCrossed /><Package /><Snowflake /><CheckCircle2 /><Leaf /><HandHeart /><AlertTriangle /></div>
    </PageWrap>
  )
}
