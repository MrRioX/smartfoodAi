"use client"
// ============================================================
// SmartFood AI — Kitchen views A
// Overview · Demand Forecast · Production · Surplus
// ============================================================
import { useMemo, useState } from "react"
import { useStore, useCurrentOrg } from "@/lib/store"
import type { DemandForecast, ProductionRecord } from "@/lib/types"
import { DAY_TYPE_RATES } from "@/lib/calc"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PageWrap } from "./shell"
import {
  Card, CardContent, KpiGrid, StatCard, SectionHeader, StatusBadge, EmptyState,
  InfoBanner, DemoBadge, Labeled, inr, timeAgo,
} from "./shared"
import { liveStatus } from "./org-shared"
import {
  Users, ChefHat, UtensilsCrossed, Package, Leaf, AlertTriangle, Zap, Thermometer,
  LineChart as LineChartIcon, Sparkles, Boxes, Factory, HandHeart, CheckCircle2, Plus,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar,
} from "recharts"

// ============================================================
// OVERVIEW
// ============================================================
export function KitchenOverview() {
  const org = useCurrentOrg()
  const navigate = useStore((s) => s.navigate)
  const forecasts = useStore((s) => s.forecasts)
  const productions = useStore((s) => s.productions)
  const inventory = useStore((s) => s.inventory)
  const sensors = useStore((s) => s.sensors)
  const energy = useStore((s) => s.energy)
  const listings = useStore((s) => s.listings)

  const todayForecast = forecasts.find((f) => f.date === new Date().toISOString().slice(0, 10)) ?? forecasts[0]
  const todayProd = productions[0]
  const myInventory = inventory.filter((i) => i.orgId === org?.id).map((i) => ({ ...i, status: liveStatus(i) }))
  const expiring = myInventory.filter((i) => i.status !== "ok").length
  const surplusMeals = myInventory.filter((i) => i.category === "prepared").reduce((s, i) => s + i.quantity, 0)
  const inventoryValue = myInventory.reduce((s, i) => s + (i.valuePerUnit ?? 0) * i.quantity, 0)
  const energyToday = energy.filter((e) => e.category === "kitchen").reduce((s, e) => s + e.kwh, 0) / 7
  const warningSensors = sensors.filter((s) => s.mode !== "normal").length
  const activeListings = listings.filter((l) => l.providerId === org?.id && l.status === "active").length

  return (
    <PageWrap>
      <SectionHeader title={`Overview — ${org?.name ?? "Kitchen"}`} desc="Production, surplus prevention and redistribution at a glance (demo data)." badge={<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">DEMO ORGANIZATION</span>} />
      <KpiGrid>
        <StatCard title="Today's expected demand" value={todayForecast?.expectedAttendance ?? "—"} icon={<Users className="h-5 w-5" />} sub={`${todayForecast?.registrations ?? 0} registrations · demo forecast`} />
        <StatCard title="Recommended production" value={todayForecast?.recommendedProduction ?? "—"} icon={<Sparkles className="h-5 w-5" />} tone="info" sub={`${todayForecast?.confidence ?? 0}% confidence`} />
        <StatCard title="Actual production" value={todayProd?.actual ?? 0} icon={<ChefHat className="h-5 w-5" />} sub={todayProd ? `${todayProd.foodType} · ${timeAgo(todayProd.createdAt)}` : "no record today"} />
        <StatCard title="Consumed meals" value={todayProd?.consumed ?? 0} icon={<UtensilsCrossed className="h-5 w-5" />} tone="positive" sub="vs production" />
        <StatCard title="Current surplus" value={surplusMeals} icon={<Boxes className="h-5 w-5" />} tone="warning" sub="prepared meals in inventory" />
        <StatCard title="Estimated waste" value={`${Math.max(0, (todayProd?.actual ?? 0) - (todayProd?.consumed ?? 0) - surplusMeals)} meals`} icon={<AlertTriangle className="h-5 w-5" />} tone="danger" sub="demo estimate" />
        <StatCard title="Inventory value" value={inr(Math.round(inventoryValue))} icon={<Package className="h-5 w-5" />} sub={`${myInventory.length} items`} />
        <StatCard title="Expiring items" value={expiring} icon={<AlertTriangle className="h-5 w-5" />} tone="danger" sub="≤36h window" />
        <StatCard title="Storage status" value={warningSensors > 0 ? `${warningSensors} warning(s)` : "All normal"} icon={<Thermometer className="h-5 w-5" />} tone={warningSensors > 0 ? "warning" : "positive"} sub="simulated sensors" />
        <StatCard title="Energy usage" value={`${Math.round(energyToday)} kWh`} icon={<Zap className="h-5 w-5" />} tone="info" sub="today (simulated)" />
        <StatCard title="Active free listings" value={activeListings} icon={<HandHeart className="h-5 w-5" />} tone="positive" sub="surplus shared free" />
        <StatCard title="Waste prevented" value="743 kg" icon={<Leaf className="h-5 w-5" />} sub="demo estimate" />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-5">
          <CardContent className="space-y-3 px-5">
            <h3 className="text-sm font-bold">Forecast vs actual (last days)</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecasts.slice(0, 5).reverse().map((f) => ({
                  date: f.date.slice(5, 10), predicted: f.recommendedProduction, actual: f.actualConsumption ?? f.recommendedProduction,
                }))} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="predicted" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} name="Recommended" />
                  <Line type="monotone" dataKey="actual" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} name="Consumed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="py-5">
          <CardContent className="space-y-3 px-5">
            <h3 className="text-sm font-bold">Quick actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "AI Meal Planner", icon: <Sparkles className="h-4 w-4" />, to: "k-planner" },
                { label: "Demand Forecast", icon: <LineChartIcon className="h-4 w-4" />, to: "k-forecast" },
                { label: "Record Production", icon: <ChefHat className="h-4 w-4" />, to: "k-production" },
                { label: "List Surplus Free", icon: <HandHeart className="h-4 w-4" />, to: "k-listings" },
                { label: "IoT Monitoring", icon: <Thermometer className="h-4 w-4" />, to: "k-iot" },
                { label: "Sustainability", icon: <Leaf className="h-4 w-4" />, to: "k-sustainability" },
              ].map((a) => (
                <button key={a.to} onClick={() => navigate(a.to)} className="flex flex-col items-start gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-3 text-left text-xs font-bold text-emerald-800 transition-colors active:bg-emerald-100">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
            {/* Food Processing Unit card (architecture preview) */}
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-600 text-white"><Factory className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">Food Processing Units</p>
                  <p className="text-[10px] text-muted-foreground">Architecture preview — raw material loss, machines, energy</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => navigate("k-analytics")}>Preview</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrap>
  )
}

// ============================================================
// DEMAND FORECAST
// ============================================================
export function DemandForecastView() {
  const forecasts = useStore((s) => s.forecasts)
  const addForecast = useStore((s) => s.addForecast)
  const addForecastRecord = useStore((s) => s.addForecastRecord)
  const recordForecastActuals = useStore((s) => s.recordForecastActuals)
  const { toast } = useToast()
  const [f, setF] = useState({ registrations: "500", dayType: "normal", historical: "0.9" })
  const [busy, setBusy] = useState(false)
  const [engine, setEngine] = useState<{ source: "ai" | "demo"; model?: string; fallbackReason?: string } | null>(null)
  const [reasoning, setReasoning] = useState<string>("")
  const [actualFor, setActualFor] = useState<DemandForecast | null>(null)
  const [actual, setActual] = useState({ production: "", consumption: "" })

  const run = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/ai/demand-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrations: Math.max(1, Number(f.registrations) || 1),
          dayType: f.dayType,
          historicalAvg: Number(f.historical) || 0.9,
        }),
      })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      const rec: DemandForecast = {
        id: `f-${Math.random().toString(36).slice(2, 10)}`,
        date: new Date().toISOString().slice(0, 10),
        dayType: f.dayType as DemandForecast["dayType"],
        registrations: Math.max(1, Number(f.registrations) || 1),
        attendanceRate: Number(data.attendanceRate) || 0.9,
        expectedAttendance: Math.round(Number(data.expectedAttendance) || 0),
        recommendedProduction: Math.round(Number(data.recommendedProduction) || 0),
        expectedSurplus: Math.round(Number(data.expectedSurplus) || 0),
        confidence: Math.min(99, Math.max(0, Math.round(Number(data.confidence) || 70))),
        createdAt: new Date().toISOString(),
      }
      addForecastRecord(rec)
      setEngine(data.engine ?? { source: "demo" })
      setReasoning(String(data.reasoning ?? ""))
      if (data.engine?.fallbackReason) toast({ title: data.engine.fallbackReason })
    } catch {
      addForecast(Math.max(1, Number(f.registrations) || 1), f.dayType, Number(f.historical) || 0.9)
      setEngine({ source: "demo", fallbackReason: "AI request failed. Using demo calculation." })
      setReasoning("")
      toast({ title: "AI request failed. Using demo calculation.", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const chartData = forecasts.slice(0, 6).reverse().map((fc) => ({
    date: fc.date.slice(5, 10),
    expected: fc.expectedAttendance,
    recommended: fc.recommendedProduction,
    consumed: fc.actualConsumption ?? null,
  }))

  const withActuals = forecasts.filter((x) => x.actualConsumption != null)
  const avgAccuracy = withActuals.length
    ? Math.round(100 - withActuals.reduce((s, x) => s + Math.abs((x.expectedAttendance ?? 0) - (x.actualConsumption ?? 0)) / Math.max(1, x.expectedAttendance) * 100, 0) / withActuals.length)
    : null

  return (
    <PageWrap>
      <SectionHeader title="Demand Forecast" desc="Predict expected demand and recommended production — then compare with what actually happened." badge={engine?.source === "ai" ? <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">AI MODEL{engine.model ? ` · ${engine.model}` : ""}</span> : <DemoBadge label="DEMO AI RESULT" />} />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="py-5 lg:col-span-2">
          <CardContent className="space-y-4 px-5">
            <h3 className="text-sm font-bold">Inputs</h3>
            <div className="space-y-1.5">
              <Label>Registrations / expected footfall</Label>
              <Input type="number" min={1} value={f.registrations} onChange={(e) => setF({ ...f, registrations: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Historical attendance average</Label>
              <Select value={f.historical} onValueChange={(v) => setF({ ...f, historical: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[["0.78", "78% (low)"], ["0.9", "90% (typical)"], ["0.95", "95% (high)"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Day type / event</Label>
              <Select value={f.dayType} onValueChange={(v) => setF({ ...f, dayType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(DAY_TYPE_RATES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Attendance factor: {DAY_TYPE_RATES[f.dayType]?.rate}×</p>
            </div>
            <Button className="h-11 w-full font-bold" onClick={run} disabled={busy}><LineChartIcon className="mr-1.5 h-4 w-4" /> {busy ? "Forecasting…" : "Generate Forecast"}</Button>
            {engine?.fallbackReason && <p className="rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">{engine.fallbackReason}</p>}
            {reasoning && <p className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground"><b>Model reasoning:</b> {reasoning}</p>}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          {forecasts[0] && <ForecastCard fc={forecasts[0]} onRecord={() => { setActualFor(forecasts[0]); setActual({ production: String(forecasts[0].recommendedProduction), consumption: "" }) }} />}
          <Card className="py-5">
            <CardContent className="space-y-3 px-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold">Predicted vs Actual</h3>
                {avgAccuracy != null && <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-700">avg accuracy {avgAccuracy}% (demo)</span>}
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="expected" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} name="Expected attendance" />
                    <Line type="monotone" dataKey="recommended" stroke="#0d9488" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} name="Recommended production" />
                    <Line type="monotone" dataKey="consumed" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} name="Actual consumption" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Forecast history</h3>
            <div className="space-y-2">
              {forecasts.slice(0, 6).map((fc) => <ForecastCard key={fc.id} fc={fc} compact onRecord={() => { setActualFor(fc); setActual({ production: String(fc.recommendedProduction), consumption: "" }) }} />)}
            </div>
          </div>
        </div>
      </div>
      <InfoBanner tone="demo"><b>Forecasts are demo/simulated</b> unless an AI model is configured — the deterministic model multiplies registrations by the day-type factor + buffer. You can always override the numbers: edit recommended production in Production, and record actuals after service.</InfoBanner>

      <Dialog open={!!actualFor} onOpenChange={(v) => !v && setActualFor(null)}>
        <DialogContent className="max-w-sm">
          {actualFor && (
            <>
              <DialogHeader><DialogTitle>Record actuals — {actualFor.date}</DialogTitle><DialogDescription>Close the loop: what really happened vs the forecast.</DialogDescription></DialogHeader>
              <div className="space-y-3">
                <Labeled label="Forecast said">expected {actualFor.expectedAttendance} · recommended {actualFor.recommendedProduction} · surplus {actualFor.expectedSurplus}</Labeled>
                <div className="space-y-1.5"><Label>Actual production</Label><Input type="number" min={0} value={actual.production} onChange={(e) => setActual({ ...actual, production: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Actual consumption</Label><Input type="number" min={0} value={actual.consumption} onChange={(e) => setActual({ ...actual, consumption: e.target.value })} /></div>
              </div>
              <DialogFooter className="flex-row gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setActualFor(null)}>Cancel</Button>
                <Button className="flex-1 font-bold" onClick={() => {
                  recordForecastActuals(actualFor.id, Number(actual.production) || 0, Number(actual.consumption) || 0)
                  setActualFor(null)
                  toast({ title: "Actuals recorded", description: "Predicted vs Actual chart updated." })
                }}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  )
}

function ForecastCard({ fc, onRecord, compact }: { fc: DemandForecast; onRecord: () => void; compact?: boolean }) {
  return (
    <Card className="py-4">
      <CardContent className="space-y-2 px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold">{new Date(fc.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {DAY_TYPE_RATES[fc.dayType]?.label ?? fc.dayType}</p>
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-700">{fc.confidence}% confidence</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Labeled label="Registered">{fc.registrations}</Labeled>
          <Labeled label="Expected attendance">{fc.expectedAttendance}</Labeled>
          <Labeled label="Recommended prod.">{fc.recommendedProduction}</Labeled>
          <Labeled label="Expected surplus">{fc.expectedSurplus}</Labeled>
        </div>
        {fc.actualConsumption != null ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Labeled label="Actual production">{fc.actualProduction ?? "—"}</Labeled>
            <Labeled label="Actual consumption">{fc.actualConsumption}</Labeled>
            <Labeled label="Actual surplus">{fc.actualSurplus ?? "—"}</Labeled>
          </div>
        ) : !compact ? (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onRecord}>Record Actuals After Service</Button>
        ) : (
          <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={onRecord}>Record actuals</Button>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// PRODUCTION
// ============================================================
export function ProductionView() {
  const org = useCurrentOrg()
  const productions = useStore((s) => s.productions)
  const forecasts = useStore((s) => s.forecasts)
  const createProduction = useStore((s) => s.createProduction)
  const recordConsumption = useStore((s) => s.recordConsumption)
  const { toast } = useToast()
  const todayForecast = forecasts[0]
  const [f, setF] = useState({ foodType: "Dal Rice", planned: String(todayForecast?.recommendedProduction ?? 480), actual: "480" })
  const [consumeFor, setConsumeFor] = useState<ProductionRecord | null>(null)
  const [consumed, setConsumed] = useState("")

  const mine = productions.slice(0, 10)

  return (
    <PageWrap>
      <SectionHeader title="Production" desc="Record planned vs actual production, then track consumption to surface surplus." />
      <Card className="py-5">
        <CardContent className="px-5">
          <form className="grid gap-3 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); createProduction(f.foodType, Number(f.planned) || 0, Number(f.actual) || 0); toast({ title: "Production recorded 🍳", description: "Record consumption after service to track surplus." }) }}>
            <div className="space-y-1.5">
              <Label>Food type</Label>
              <Select value={f.foodType} onValueChange={(v) => setF({ ...f, foodType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Dal Rice", "Khichdi", "Roti Sabzi", "Vegetable Pulao", "Upma", "Poha"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Planned meals</Label>
              <Input type="number" min={0} value={f.planned} onChange={(e) => setF({ ...f, planned: e.target.value })} />
              <p className="text-[10px] text-muted-foreground">Forecast recommends {todayForecast?.recommendedProduction ?? "—"}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Actual produced</Label>
              <Input type="number" min={0} value={f.actual} onChange={(e) => setF({ ...f, actual: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="h-10 w-full font-bold"><Plus className="mr-1.5 h-4 w-4" /> Record</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Production records</h3>
        {mine.length === 0 ? (
          <EmptyState icon={<ChefHat className="h-7 w-7" />} title="No production records" desc="Record today's production to start tracking surplus." />
        ) : (
          <div className="space-y-2">
            {mine.map((p) => (
              <Card key={p.id} className="py-4">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4">
                  <div className="min-w-0">
                    <p className="font-bold">{p.foodType} · {p.planned} planned / {p.actual} produced</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString("en-IN")} · consumed {p.consumed} · surplus {p.surplus}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status === "completed" ? "completed" : "pending"} />
                    {p.status === "planned" && (
                      <Button size="sm" className="h-8 text-xs font-bold" onClick={() => { setConsumeFor(p); setConsumed(String(Math.round(p.actual * 0.94))) }}>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Record Consumption
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!consumeFor} onOpenChange={(v) => !v && setConsumeFor(null)}>
        <DialogContent className="max-w-sm">
          {consumeFor && (
            <>
              <DialogHeader><DialogTitle>Record consumption — {consumeFor.foodType}</DialogTitle><DialogDescription>{consumeFor.actual} meals produced. How many were consumed?</DialogDescription></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Meals consumed</Label><Input type="number" min={0} max={consumeFor.actual} value={consumed} onChange={(e) => setConsumed(e.target.value)} /></div>
                <p className="text-xs text-muted-foreground">Surplus will be: <b>{Math.max(0, consumeFor.actual - (Number(consumed) || 0))} meals</b> — added to inventory with expiry alert.</p>
              </div>
              <DialogFooter className="flex-row gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConsumeFor(null)}>Cancel</Button>
                <Button className="flex-1 font-bold" onClick={() => {
                  recordConsumption(consumeFor.id, Number(consumed) || 0)
                  setConsumeFor(null)
                  toast({ title: "Consumption recorded", description: "Surplus meals were added to inventory — check Surplus view." })
                }}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  )
}

// ============================================================
// SURPLUS
// ============================================================
export function SurplusView() {
  const org = useCurrentOrg()
  const productions = useStore((s) => s.productions)
  const inventory = useStore((s) => s.inventory)
  const forecasts = useStore((s) => s.forecasts)
  const donateInventoryItem = useStore((s) => s.donateInventoryItem)
  const navigate = useStore((s) => s.navigate)
  const { toast } = useToast()

  const surplusItems = inventory.filter((i) => i.orgId === org?.id && i.category === "prepared")
  const recent = productions.slice(0, 5).reverse()

  const chartData = recent.map((p, i) => {
    const fc = forecasts.find((x) => x.date === p.date)
    return {
      name: `D-${recent.length - i}`,
      planned: p.planned, actual: p.actual, consumed: p.consumed, surplus: p.surplus,
      expected: fc?.expectedAttendance ?? null,
    }
  })

  return (
    <PageWrap>
      <SectionHeader title="Surplus" desc="Planned vs expected before production — actual vs consumed after. Share surplus free before it wastes." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-5">
          <CardContent className="space-y-3 px-5">
            <h3 className="text-sm font-bold">Production vs consumption</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="actual" fill="#059669" radius={[5, 5, 0, 0]} name="Produced" />
                  <Bar dataKey="consumed" fill="#d97706" radius={[5, 5, 0, 0]} name="Consumed" />
                  <Bar dataKey="surplus" fill="#e11d48" radius={[5, 5, 0, 0]} name="Surplus" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground">D-1 = oldest shown. Surplus = produced − consumed (demo records).</p>
          </CardContent>
        </Card>
        <Card className="py-5">
          <CardContent className="space-y-3 px-5">
            <h3 className="text-sm font-bold">Today&apos;s plan (before production)</h3>
            {(() => {
              const fc = forecasts[0]
              if (!fc) return <p className="text-sm text-muted-foreground">No forecast yet — generate one in Demand Forecast.</p>
              return (
                <div className="grid grid-cols-3 gap-2">
                  <Labeled label="Planned production">{fc.recommendedProduction}</Labeled>
                  <Labeled label="Expected demand">{fc.expectedAttendance}</Labeled>
                  <Labeled label="Expected surplus">{fc.expectedSurplus}</Labeled>
                </div>
              )
            })()}
            <div className="rounded-xl border bg-muted/40 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">After production</p>
              {(() => {
                const p = productions[0]
                if (!p) return <p className="mt-1 text-sm text-muted-foreground">No production record yet.</p>
                return (
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    <Labeled label="Actual production">{p.actual}</Labeled>
                    <Labeled label="Actual consumed">{p.consumed}</Labeled>
                    <Labeled label="Actual surplus">{p.surplus}</Labeled>
                  </div>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Surplus batches in inventory ({surplusItems.length})</h3>
        {surplusItems.length === 0 ? (
          <EmptyState icon={<Boxes className="h-7 w-7" />} title="No surplus batches" desc="When you record consumption with leftover meals, they appear here for free redistribution." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {surplusItems.map((i) => (
              <Card key={i.id} className="py-4">
                <CardContent className="space-y-2 px-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{i.name}</p>
                    <StatusBadge status={liveStatus(i)} />
                  </div>
                  <p className="text-xs text-muted-foreground">{i.quantity} {i.unit} · batch {i.batch} · {i.storage}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-8 bg-emerald-600 text-xs font-bold" onClick={() => { donateInventoryItem(i.id, i.quantity); toast({ title: "Surplus listed as free donation 🎉" }) }}>
                      <HandHeart className="mr-1 h-3 w-3" /> Donate All Free
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => navigate("k-assess")}>AI Check First</Button>
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
