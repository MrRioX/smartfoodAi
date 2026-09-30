"use client"
// ============================================================
// SmartFood AI — Kitchen views B
// AI Food Assessment · Storage Monitoring · IoT Monitoring · Procurement
// ============================================================
import { useMemo, useState } from "react"
import { useStore, useCurrentOrg } from "@/lib/store"
import { uiState } from "@/lib/ui-state"
import type { FoodAssessment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PageWrap } from "./shell"
import {
  Card, CardContent, SectionHeader, StatusBadge, EmptyState, InfoBanner,
  DemoBadge, SimBadge, Labeled, timeAgo,
} from "./shared"
import { AiFoodCheckDialog } from "./food-check"
import { liveStatus } from "./org-shared"
import {
  Camera, Upload, ScanBarcode, Sparkles, HandHeart, CheckCircle2, Thermometer,
  Radio, AlertTriangle, ShoppingCart, Package, Zap, Snowflake, ArrowLeftRight, Loader2,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"

// ============================================================
// AI FOOD ASSESSMENT
// ============================================================
export function KitchenAssessment() {
  const runAssessment = useStore((s) => s.runAssessment)
  const assessments = useStore((s) => s.assessments)
  const navigate = useStore((s) => s.navigate)
  const { toast } = useToast()
  const [f, setF] = useState({ name: "Khichdi", hours: "2", storage: "Hot case (kept above 60°C)" })
  const [assessOpen, setAssessOpen] = useState(false)

  return (
    <PageWrap>
      <SectionHeader title="AI Food Assessment" desc="Screen surplus food before redistribution — photo, upload or barcode. Uses your configured AI vision model; falls back to clearly-labelled demo rules." badge={<DemoBadge label="AI-ASSISTED — NOT A SAFETY CERTIFICATION" />} />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="py-5 lg:col-span-2">
          <CardContent className="space-y-4 px-5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Combines <b>AI vision</b> (image analysis), on-device <b>barcode detection</b> where the browser supports it, and the
              metadata below into one structured recommendation: ELIGIBLE FOR REVIEW · REVIEW REQUIRED · NOT ELIGIBLE.
            </p>
            <div className="space-y-1.5">
              <Label>Food name</Label>
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hours since prepared</Label>
                <Input type="number" min={0} step="0.5" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Storage condition</Label>
                <Select value={f.storage} onValueChange={(v) => setF({ ...f, storage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Hot case (kept above 60°C)", "Refrigerated 4–6°C", "Frozen", "Room temperature", "Packaged / sealed", "Dry store"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button className="h-11 w-full font-bold" onClick={() => setAssessOpen(true)}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Open AI Food Check
            </Button>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Camera input uses the standard HTML file picker (capture=environment) — fully compatible with Android WebView.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Recent assessments</h3>
            {assessments.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">No assessments yet.</p>
            ) : (
              <div className="space-y-2">
                {assessments.slice(0, 5).map((a) => (
                  <Card key={a.id} className="py-3"><CardContent className="flex items-center justify-between gap-2 px-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{a.foodName} · {a.method}</p>
                      <p className="text-xs text-muted-foreground">{a.hoursSincePrepared}h · {a.storageCondition} · {timeAgo(a.createdAt)}{a.source === "ai" ? " · AI model" : " · demo rules"}</p>
                    </div>
                    <StatusBadge status={a.result} />
                  </CardContent></Card>
                ))}
              </div>
            )}
          </div>
          <InfoBanner tone="info">
            <Camera className="mr-1 inline h-3.5 w-3.5" />
            Every assessment lands in this history and can be turned into a free listing in one tap when eligible.
          </InfoBanner>
        </div>
      </div>

      <AiFoodCheckDialog
        open={assessOpen}
        onOpenChange={(v) => {
          setAssessOpen(v)
          if (!v) {
            const latest = useStore.getState().assessments[0]
            if (latest) {
              toast({ title: `Assessment saved — ${latest.foodName}` })
              if (latest.result !== "not-eligible") {
                uiState.donationPrefill = { title: `Free ${latest.foodName}`, foodCategory: "Cooked Meal", storage: latest.storageCondition, notes: `AI screening: ${latest.result}${latest.source === "ai" ? " (AI model)" : " (demo rules)"}. ${latest.reasons[0] ?? ""}` }
                toast({ title: "Listing form prefilled", description: "Open Food Listings to review and publish." })
              }
            }
          }
        }}
        defaultHours={Number(f.hours) || 0}
        defaultStorage={f.storage}
        foodName={f.name || "Food item"}
      />
    </PageWrap>
  )
}

// ============================================================
// STORAGE MONITORING
// ============================================================
export function StorageMonitoring() {
  const sensors = useStore((s) => s.sensors)
  const readings = useStore((s) => s.sensorReadings)
  const org = useCurrentOrg()
  const [selected, setSelected] = useState(sensors[0]?.id ?? "")

  const mySensors = sensors.filter((s) => s.orgId === org?.id)
  const active = mySensors.find((s) => s.id === selected) ?? mySensors[0]
  const activeId = active?.id ?? ""
  // computed directly (cheap filter over ~100 demo readings — no memo needed)
  const history = readings.filter((r) => r.deviceId === activeId).slice(-24).map((r) => ({
    time: new Date(r.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    temp: r.temperature, humidity: r.humidity,
  }))

  return (
    <PageWrap>
      <SectionHeader title="Storage Monitoring" desc="Temperature & humidity for cold storages, freezers and kitchen areas." badge={<SimBadge />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {mySensors.map((s) => {
          const last = readings.filter((r) => r.deviceId === s.id).slice(-1)[0]
          return (
            <button key={s.id} onClick={() => setSelected(s.id)}
              className={cn("rounded-xl border-2 p-3 text-left", active?.id === s.id ? "border-emerald-500 bg-emerald-50" : "border-border bg-card")}>
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Snowflake className="h-4 w-4 text-teal-600" /></span>
                <StatusBadge status={s.mode} />
              </div>
              <p className="mt-2 truncate text-sm font-bold">{s.name}</p>
              <p className="text-xs text-muted-foreground">{last ? `${last.temperature}°C · ${last.humidity}% RH` : "no data"}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-sky-600">Source: Simulated</p>
            </button>
          )
        })}
      </div>
      {active && (
        <Card className="py-5">
          <CardContent className="space-y-3 px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold">{active.name} — last 24h (simulated)</h3>
              <SimBadge />
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="temp" stroke="#e11d48" strokeWidth={2.5} dot={false} name="Temperature (°C)" />
                  <Line type="monotone" dataKey="humidity" stroke="#0d9488" strokeWidth={2} dot={false} name="Humidity (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <InfoBanner tone="info">
              <Thermometer className="mr-1 inline h-3.5 w-3.5" />
              Recommended: cold storage 2–5°C, freezer ≤ −15°C, ambient 20–30°C. Readings update when you simulate modes in IoT Monitoring.
            </InfoBanner>
          </CardContent>
        </Card>
      )}
    </PageWrap>
  )
}

// ============================================================
// IOT MONITORING
// ============================================================
export function IotMonitoring() {
  const sensors = useStore((s) => s.sensors)
  const readings = useStore((s) => s.sensorReadings)
  const setSensorMode = useStore((s) => s.setSensorMode)
  const org = useCurrentOrg()
  const { toast } = useToast()

  const mySensors = sensors.filter((s) => s.orgId === org?.id)
  const recent = readings.slice(-8).reverse()

  const simulate = (id: string, mode: "normal" | "warning" | "critical", name: string) => {
    setSensorMode(id, mode)
    toast({
      title: `${name} → SIMULATED ${mode.toUpperCase()}`,
      description: mode === "normal" ? "Reading back in recommended range." : "A storage warning notification was created (simulated data).",
    })
  }

  return (
    <PageWrap>
      <SectionHeader title="IoT Monitoring" desc="Sensor-ready dashboard running on simulated data — real sensors can replace the simulator later without UI changes." badge={<SimBadge />} />
      <InfoBanner tone="info">
        <Radio className="mr-1 inline h-3.5 w-3.5" />
        Architecture: <b>Sensor / Simulator → API → Database → Dashboard → Alerts</b>. No physical sensors are connected in this prototype — every reading is labelled <b>SIMULATED</b>.
      </InfoBanner>
      <div className="grid gap-3 lg:grid-cols-2">
        {mySensors.map((s) => {
          const last = readings.filter((r) => r.deviceId === s.id).slice(-1)[0]
          return (
            <Card key={s.id} className={cn("py-5", s.mode === "warning" && "border-amber-300", s.mode === "critical" && "border-red-300")}>
              <CardContent className="space-y-3 px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.location} · {s.type.replace("-", " ")}</p>
                  </div>
                  <div className="flex items-center gap-2"><StatusBadge status={s.mode} /><SimBadge /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Labeled label="Temperature">{last ? `${last.temperature}°C` : "—"}</Labeled>
                  <Labeled label="Humidity">{last ? `${last.humidity}%` : "—"}</Labeled>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Demo controls</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button size="sm" variant="outline" className="h-9 border-emerald-300 text-xs font-bold text-emerald-700" onClick={() => simulate(s.id, "normal", s.name)}>Simulate Normal</Button>
                    <Button size="sm" variant="outline" className="h-9 border-amber-300 text-xs font-bold text-amber-700" onClick={() => simulate(s.id, "warning", s.name)}>Simulate Warning</Button>
                    <Button size="sm" variant="outline" className="h-9 border-red-300 text-xs font-bold text-red-700" onClick={() => simulate(s.id, "critical", s.name)}>Simulate Critical</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">Live readings feed (simulated)</h3>
        <Card className="py-3">
          <CardContent className="px-4">
            <div className="sf-scroll max-h-72 space-y-1.5 overflow-y-auto">
              {recent.map((r) => {
                const sensor = sensors.find((s) => s.id === r.deviceId)
                return (
                  <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs">
                    <span className="min-w-0 flex-1 truncate font-semibold">{sensor?.name ?? r.deviceId}</span>
                    <span className="font-mono">{r.temperature}°C · {r.humidity}%</span>
                    <StatusBadge status={r.status} />
                    <span className="hidden text-[10px] text-muted-foreground sm:block">{timeAgo(r.at)}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrap>
  )
}

// ============================================================
// PROCUREMENT
// ============================================================
const USAGE_PER_DAY: Record<string, number> = { "Rice (Sona Masoori)": 6, "Toor Dal": 2.5, "Cooking Oil": 1.2, "Mixed Vegetables": 4, "Milk (Toned)": 4, "Atta (Wheat Flour)": 5, "Biscuit Packs": 12, "Bread Loaves": 6 }

export function ProcurementView() {
  const org = useCurrentOrg()
  const inventory = useStore((s) => s.inventory)
  const navigate = useStore((s) => s.navigate)
  const { toast } = useToast()
  const raw = inventory.filter((i) => i.orgId === org?.id && (i.category === "raw" || i.category === "packaged")).map((i) => ({ ...i, status: liveStatus(i) }))
  const [aiInsight, setAiInsight] = useState<{ insights: string[]; engine: { source: string; model?: string; fallbackReason?: string } } | null>(null)
  const [aiBusy, setAiBusy] = useState(false)

  const rows = raw.map((i) => {
    const daily = USAGE_PER_DAY[i.name] ?? 2
    const required = Math.round(daily * 7 * 10) / 10 // 7-day requirement (demo)
    const stock = i.quantity
    const recommended = Math.max(0, Math.round((required - stock) * 10) / 10)
    let warning: string | null = null
    if (stock > required * 1.5) warning = "Overstock"
    else if (stock < required * 0.5) warning = "Understock"
    if (i.status !== "ok") warning = "Expiring stock"
    return { item: i, daily, required, stock, recommended, warning }
  })

  const frequentWaste = ["Mixed Vegetables", "Milk (Toned)"] // demo flags
  const expiringCount = raw.filter((i) => i.status !== "ok").length

  const askAi = async () => {
    setAiBusy(true)
    try {
      const res = await fetch("/api/ai/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: org?.name,
          rows: rows.map((r) => ({ name: r.item.name, category: r.item.category, quantity: r.stock, unit: r.item.unit, required: r.required, recommendedBuy: r.recommended, status: r.warning ?? "OK" })),
        }),
      })
      if (!res.ok) throw new Error(`status ${res.status}`)
      setAiInsight(await res.json())
    } catch {
      toast({ title: "AI request failed. Using demo insight.", variant: "destructive" })
      setAiInsight({ insights: ["AI request failed — the deterministic recommendation table below remains valid."], engine: { source: "demo", fallbackReason: "AI request failed." } })
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <PageWrap>
      <SectionHeader title="Procurement Optimization" desc="Buy only what you need — current stock vs 7-day requirement (demo usage rates)." badge={<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">RULE-BASED DEMO</span>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="py-4"><CardContent className="px-4"><p className="text-[11px] font-semibold uppercase text-muted-foreground">Overstock alerts</p><p className="text-xl font-bold text-amber-600">{rows.filter((r) => r.warning === "Overstock").length}</p></CardContent></Card>
        <Card className="py-4"><CardContent className="px-4"><p className="text-[11px] font-semibold uppercase text-muted-foreground">Understock alerts</p><p className="text-xl font-bold text-red-600">{rows.filter((r) => r.warning === "Understock").length}</p></CardContent></Card>
        <Card className="py-4"><CardContent className="px-4"><p className="text-[11px] font-semibold uppercase text-muted-foreground">Expiring stock</p><p className="text-xl font-bold text-orange-600">{expiringCount}</p></CardContent></Card>
        <Card className="py-4"><CardContent className="px-4"><p className="text-[11px] font-semibold uppercase text-muted-foreground">Frequent waste items</p><p className="text-xl font-bold text-rose-600">{frequentWaste.length}</p></CardContent></Card>
      </div>

      {frequentWaste.length > 0 && (
        <InfoBanner tone="warning">
          <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
          <b>Frequent waste pattern (demo):</b> {frequentWaste.join(", ")} — reduce purchase quantities or plan redistribution earlier.
        </InfoBanner>
      )}

      <Card className="py-5">
        <CardContent className="space-y-3 px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-emerald-600" /> AI procurement insight</h3>
            <Button size="sm" className="h-9 font-bold" onClick={askAi} disabled={aiBusy}>
              {aiBusy ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analyzing…</> : <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate AI Insight</>}
            </Button>
          </div>
          {aiInsight && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {aiInsight.engine.source === "ai" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">AI MODEL{aiInsight.engine.model ? ` · ${aiInsight.engine.model}` : ""}</span>
                ) : (
                  <DemoBadge label="DEMO AI INSIGHT" />
                )}
                {aiInsight.engine.fallbackReason && <span className="text-[10px] font-semibold text-amber-700">{aiInsight.engine.fallbackReason}</span>}
              </div>
              <ul className="space-y-1">
                {aiInsight.insights.map((ins, i) => <li key={i} className="flex items-start gap-1.5 text-xs"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" /> {ins}</li>)}
              </ul>
              <p className="text-[10px] text-muted-foreground">Quantities always come from your stored inventory — the AI only explains and prioritises, it never invents stock.</p>
            </div>
          )}
          {!aiInsight && <p className="text-xs text-muted-foreground">Recommendation table below is deterministic (requirement − stock). Generate AI insight for a plain-language explanation and prioritisation.</p>}
        </CardContent>
      </Card>

      <Card className="py-2">
        <CardContent className="px-2 sm:px-4">
          <div className="sf-scroll overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="p-2">Item</th>
                  <th className="p-2">Stock</th>
                  <th className="p-2">7-day need</th>
                  <th className="p-2">Recommended buy</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.item.id} className="border-b last:border-0">
                    <td className="p-2">
                      <p className="font-semibold">{r.item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r.item.storage} · uses ≈{r.daily}/day</p>
                    </td>
                    <td className="p-2 font-mono text-xs">{r.stock} {r.item.unit}</td>
                    <td className="p-2 font-mono text-xs">{r.required} {r.item.unit}</td>
                    <td className="p-2 font-mono text-xs font-bold text-emerald-700">{r.recommended > 0 ? `+${r.recommended} ${r.item.unit}` : "0 (sufficient)"}</td>
                    <td className="p-2">
                      {r.warning ? <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", r.warning === "Overstock" ? "bg-amber-100 text-amber-700" : r.warning === "Expiring stock" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700")}>{r.warning}</span> : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="py-5">
          <CardContent className="space-y-2 px-5">
            <h3 className="flex items-center gap-2 text-sm font-bold"><ShoppingCart className="h-4 w-4" /> Example</h3>
            <div className="grid grid-cols-3 gap-2">
              <Labeled label="Rice stock">18 kg</Labeled>
              <Labeled label="Future requirement">32 kg</Labeled>
              <Labeled label="Recommended purchase">14 kg</Labeled>
            </div>
            <p className="text-[11px] text-muted-foreground">Deterministic rule: recommended = requirement − stock. No AI invents numbers here.</p>
          </CardContent>
        </Card>
        <Card className="py-5">
          <CardContent className="space-y-2 px-5">
            <h3 className="flex items-center gap-2 text-sm font-bold"><Package className="h-4 w-4" /> Next steps</h3>
            <p className="text-xs text-muted-foreground">Purchase orders are out of demo scope — use Inventory to add stock after purchasing, or donate expiring overstock.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => navigate("k-inventory")}><ArrowLeftRight className="mr-1 h-3 w-3" /> Go to Inventory</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => navigate("k-expiry")}><AlertTriangle className="mr-1 h-3 w-3" /> Expiry Alerts</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="text-center text-[10px] text-muted-foreground"><Zap className="mr-1 inline h-3 w-3" />Usage rates are demo constants for the prototype.</p>
    </PageWrap>
  )
}
