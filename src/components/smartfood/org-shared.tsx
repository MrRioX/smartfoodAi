"use client"
// ============================================================
// SmartFood AI — shared org-level views
// Inventory manager, expiry manager, impact dashboard, org profile
// (used by both NGO and Kitchen roles)
// ============================================================
import { useMemo, useState } from "react"
import { useStore, useCurrentOrg } from "@/lib/store"
import type { InventoryCategory, InventoryItem } from "@/lib/types"
import { DEMO_FACTORS } from "@/lib/calc"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { PageWrap } from "./shell"
import {
  Card, CardContent, KpiGrid, StatCard, SectionHeader, StatusBadge, EmptyState,
  InfoBanner, DemoBadge, timeUntil, timeAgo, inr, Labeled, QuantityMeter,
} from "./shared"
import {
  Package, Plus, Pencil, ArrowLeftRight, HandHeart, Recycle, Search, AlertTriangle,
  Leaf, BarChart3, UtensilsCrossed, Truck, Zap, Factory, ShieldCheck, Phone, MapPin,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts"

// ---------- dynamic status from expiry ----------
export function liveStatus(item: InventoryItem): InventoryItem["status"] {
  if (!item.expiryAt) return "ok"
  const hours = (new Date(item.expiryAt).getTime() - Date.now()) / 3600_000
  if (hours <= 8) return "critical"
  if (hours <= 36) return "attention"
  return "ok"
}
const CAT_LABEL: Record<InventoryCategory, string> = { raw: "Raw Materials", prepared: "Prepared Food", packaged: "Packaged Products" }

// ============================================================
// INVENTORY MANAGER
// ============================================================
export function InventoryManager({ storageOptions }: { storageOptions: string[] }) {
  const org = useCurrentOrg()
  const inventory = useStore((s) => s.inventory)
  const addInventoryItem = useStore((s) => s.addInventoryItem)
  const updateInventoryItem = useStore((s) => s.updateInventoryItem)
  const transferInventoryItem = useStore((s) => s.transferInventoryItem)
  const donateInventoryItem = useStore((s) => s.donateInventoryItem)
  const recoverInventoryItem = useStore((s) => s.recoverInventoryItem)
  const recoveryPartners = useStore((s) => s.recoveryPartners)
  const { toast } = useToast()
  const [tab, setTab] = useState<"all" | InventoryCategory>("all")
  const [q, setQ] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [action, setAction] = useState<{ kind: "edit" | "transfer" | "donate" | "redistribute" | "recovery" | "review"; item: InventoryItem } | null>(null)

  const items = useMemo(() => {
    const orgItems = inventory
      .filter((i) => i.orgId === org?.id)
      .map((i) => ({ ...i, status: liveStatus(i) }))
    return orgItems
      .filter((i) => (tab === "all" || i.category === tab) && (q.trim() === "" || i.name.toLowerCase().includes(q.trim().toLowerCase())))
      .sort((a, b) => (a.expiryAt ?? "9999").localeCompare(b.expiryAt ?? "9999"))
  }, [inventory, org?.id, tab, q])

  const stockValue = items.reduce((s, i) => s + (i.valuePerUnit ?? 0) * i.quantity, 0)

  return (
    <PageWrap>
      <SectionHeader
        title="Food Inventory"
        desc="Raw materials, prepared food and packaged products with batch, expiry and storage tracking."
        action={<Button size="sm" className="font-bold" onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Add Item</Button>}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="sf-scroll flex gap-1.5 overflow-x-auto pb-1">
          {([["all", "All"], ["raw", "Raw Materials"], ["prepared", "Prepared Food"], ["packaged", "Packaged"]] as const).map(([k, label]) => (
            <Button key={k} size="sm" variant={tab === k ? "default" : "outline"} className="h-9 shrink-0 text-xs font-semibold" onClick={() => setTab(k)}>{label}</Button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items…" className="h-9 pl-9" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground">Stock value ≈ {inr(Math.round(stockValue))} (demo)</p>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Package className="h-7 w-7" />} title="No inventory items" desc="Add items manually, or receive donations — they land here automatically." action={<Button size="sm" onClick={() => setAddOpen(true)}>Add first item</Button>} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((i) => (
            <Card key={i.id} className="py-4">
              <CardContent className="space-y-2 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold leading-tight">{i.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{CAT_LABEL[i.category]} · batch {i.batch} · {i.storage}</p>
                  </div>
                  <StatusBadge status={i.status} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Labeled label="Quantity">{i.quantity} {i.unit}</Labeled>
                  <Labeled label="Expiry / best-before">{i.expiryAt ? timeUntil(i.expiryAt) : "—"}</Labeled>
                  <Labeled label="Added">{timeAgo(i.addedAt)}</Labeled>
                </div>
                <div className="sf-scroll flex gap-1.5 overflow-x-auto pt-1">
                  <Button size="sm" variant="outline" className="h-8 shrink-0 text-xs" onClick={() => setAction({ kind: "edit", item: i })}><Pencil className="mr-1 h-3 w-3" /> Edit</Button>
                  <Button size="sm" variant="outline" className="h-8 shrink-0 text-xs" onClick={() => setAction({ kind: "transfer", item: i })}><ArrowLeftRight className="mr-1 h-3 w-3" /> Transfer</Button>
                  <Button size="sm" className="h-8 shrink-0 bg-emerald-600 text-xs font-bold" onClick={() => setAction({ kind: "donate", item: i })}><HandHeart className="mr-1 h-3 w-3" /> Donate</Button>
                  <Button size="sm" variant="outline" className="h-8 shrink-0 text-xs" onClick={() => setAction({ kind: "redistribute", item: i })}><UtensilsCrossed className="mr-1 h-3 w-3" /> Redistribute</Button>
                  <Button size="sm" variant="outline" className="h-8 shrink-0 text-xs text-violet-700" onClick={() => setAction({ kind: "recovery", item: i })}><Recycle className="mr-1 h-3 w-3" /> Recovery</Button>
                  <Button size="sm" variant="ghost" className="h-8 shrink-0 text-xs" onClick={() => setAction({ kind: "review", item: i })}>Review</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* add dialog */}
      <AddInventoryDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={(data) => {
        addInventoryItem(data)
        toast({ title: "Inventory item added" })
      }} />

      {/* action dialog */}
      <Dialog open={!!action} onOpenChange={(v) => !v && setAction(null)}>
        <DialogContent className="max-w-sm">
          {action && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {action.kind === "edit" && `Edit — ${action.item.name}`}
                  {action.kind === "transfer" && `Transfer — ${action.item.name}`}
                  {(action.kind === "donate" || action.kind === "redistribute") && `${action.kind === "donate" ? "Donate" : "Redistribute"} — ${action.item.name}`}
                  {action.kind === "recovery" && `Recovery — ${action.item.name}`}
                  {action.kind === "review" && `${action.item.name} — details`}
                </DialogTitle>
                <DialogDescription>
                  {action.kind === "recovery" ? "Send food that cannot be redistributed to a recovery partner (composting / biogas / other)." : "Demo action — creates real updates in the demo data layer."}
                </DialogDescription>
              </DialogHeader>
              <InventoryActionForm
                kind={action.kind} item={action.item} storageOptions={storageOptions}
                onDone={(msg) => { setAction(null); if (msg) toast({ title: msg }) }}
                onEdit={(qty, storage) => { updateInventoryItem(action.item.id, { quantity: qty, storage }); setAction(null); toast({ title: "Item updated" }) }}
                onTransfer={(storage) => { transferInventoryItem(action.item.id, storage); setAction(null) }}
                onDonate={(qty) => { donateInventoryItem(action.item.id, qty); setAction(null); toast({ title: "Free donation listed 🎉", description: "Now visible in Find Free Food and on the map." }) }}
                onRecover={(qty, partnerId) => { recoverInventoryItem(action.item.id, qty, partnerId); setAction(null); toast({ title: "Recovery handoff scheduled ♻️" }) }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  )
}

function AddInventoryDialog({ open, onOpenChange, onSubmit }: {
  open: boolean; onOpenChange: (v: boolean) => void
  onSubmit: (data: Omit<InventoryItem, "id" | "orgId" | "status">) => void
}) {
  const [f, setF] = useState({ name: "", category: "raw" as InventoryCategory, qty: "10", unit: "kg", batch: "", expiryHours: "48", storage: "Dry Store", value: "40" })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-sm overflow-y-auto">
        <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle><DialogDescription>Items are stored in the local demo data layer.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5"><Label>Name *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Rice (Sona Masoori)" /></div>
          <div className="col-span-2 space-y-1.5"><Label>Category</Label>
            <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v as InventoryCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["raw", "prepared", "packaged"] as const).map((c) => <SelectItem key={c} value={c}>{CAT_LABEL[c]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" min={0.1} step="0.1" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Unit</Label>
            <Select value={f.unit} onValueChange={(v) => setF({ ...f, unit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["kg", "L", "meals", "packs", "loaves", "kits"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Batch code</Label><Input value={f.batch} onChange={(e) => setF({ ...f, batch: e.target.value })} placeholder="e.g. RM-0918" /></div>
          <div className="space-y-1.5"><Label>Expiry (hours)</Label><Input type="number" min={1} value={f.expiryHours} onChange={(e) => setF({ ...f, expiryHours: e.target.value })} /></div>
          <div className="col-span-2 space-y-1.5"><Label>Storage</Label>
            <Select value={f.storage} onValueChange={(v) => setF({ ...f, storage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Dry Store", "Cold Storage 01", "Cold Storage 02", "Freezer 01", "Hot Case", "Ambient Shelf", "NGO Store"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5"><Label>Value per unit (₹, demo)</Label><Input type="number" min={0} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></div>
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="flex-1 font-bold" onClick={() => {
            if (!f.name) return
            onSubmit({
              name: f.name, category: f.category, quantity: Number(f.qty) || 1, unit: f.unit,
              batch: f.batch || `RM-${Date.now().toString(36).slice(-4).toUpperCase()}`,
              addedAt: new Date().toISOString(),
              expiryAt: new Date(Date.now() + (Number(f.expiryHours) || 48) * 3600_000).toISOString(),
              storage: f.storage, valuePerUnit: Number(f.value) || 0,
            })
            onOpenChange(false)
          }}>Add Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InventoryActionForm({
  kind, item, storageOptions, onDone, onEdit, onTransfer, onDonate, onRecover,
}: {
  kind: string; item: InventoryItem; storageOptions: string[]
  onDone: (msg?: string) => void; onEdit: (qty: number, storage: string) => void
  onTransfer: (storage: string) => void; onDonate: (qty: number) => void; onRecover: (qty: number, partnerId: string) => void
}) {
  const recoveryPartners = useStore((s) => s.recoveryPartners)
  const [qty, setQty] = useState(String(item.quantity))
  const [storage, setStorage] = useState(item.storage)
  const [partner, setPartner] = useState(recoveryPartners[0]?.id ?? "")

  if (kind === "review") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Labeled label="Name">{item.name}</Labeled>
          <Labeled label="Category">{CAT_LABEL[item.category]}</Labeled>
          <Labeled label="Quantity">{item.quantity} {item.unit}</Labeled>
          <Labeled label="Batch">{item.batch}</Labeled>
          <Labeled label="Added">{new Date(item.addedAt).toLocaleString("en-IN")}</Labeled>
          <Labeled label="Expiry">{item.expiryAt ? new Date(item.expiryAt).toLocaleString("en-IN") : "Not set"}</Labeled>
          <Labeled label="Storage">{item.storage}</Labeled>
          <Labeled label="Status"><StatusBadge status={liveStatus(item)} /></Labeled>
        </div>
        <InfoBanner tone="warning">
          <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
          An item is not automatically safe just because the date has not passed — always verify packaging, smell and storage conditions before redistribution.
        </InfoBanner>
        <Button className="w-full" onClick={() => onDone()}>Close</Button>
      </div>
    )
  }
  if (kind === "edit") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5"><Label>Quantity ({item.unit})</Label><Input type="number" min={0} step="0.1" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Storage</Label>
          <Select value={storage} onValueChange={setStorage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{storageOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button className="w-full font-bold" onClick={() => onEdit(Number(qty) || 0, storage)}>Save Changes</Button>
      </div>
    )
  }
  if (kind === "transfer") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5"><Label>Move “{item.name}” to</Label>
          <Select value={storage} onValueChange={setStorage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{storageOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button className="w-full font-bold" onClick={() => onTransfer(storage)}><ArrowLeftRight className="mr-1.5 h-4 w-4" /> Confirm Transfer</Button>
      </div>
    )
  }
  if (kind === "donate" || kind === "redistribute") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Create a <b>free</b> {kind === "donate" ? "donation listing" : "redistribution listing"} from this batch. Available until its expiry.</p>
        <div className="space-y-1.5"><Label>Quantity to list ({item.unit}) — max {item.quantity}</Label><Input type="number" min={1} max={item.quantity} value={qty} onChange={(e) => setQty(e.target.value)} /></div>
        <Button className="w-full bg-emerald-600 font-bold" onClick={() => onDonate(Math.min(Number(qty) || 1, item.quantity))}><HandHeart className="mr-1.5 h-4 w-4" /> Publish Free Listing</Button>
      </div>
    )
  }
  // recovery
  return (
    <div className="space-y-3">
      <div className="space-y-1.5"><Label>Recovery partner</Label>
        <Select value={partner} onValueChange={setPartner}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{recoveryPartners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {p.type}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label>Quantity ({item.unit}) — max {item.quantity}</Label><Input type="number" min={1} max={item.quantity} value={qty} onChange={(e) => setQty(e.target.value)} /></div>
      <InfoBanner tone="info">Use recovery only for food that cannot be redistributed to people. Demo partners are fictional.</InfoBanner>
      <Button className="w-full bg-violet-600 font-bold" onClick={() => onRecover(Math.min(Number(qty) || 1, item.quantity), partner)}><Recycle className="mr-1.5 h-4 w-4" /> Schedule Recovery Handoff</Button>
    </div>
  )
}

// ============================================================
// EXPIRY MANAGER
// ============================================================
export function ExpiryManager({ onAfterAction }: { onAfterAction?: () => void }) {
  const org = useCurrentOrg()
  const inventory = useStore((s) => s.inventory)
  const donateInventoryItem = useStore((s) => s.donateInventoryItem)
  const recoverInventoryItem = useStore((s) => s.recoverInventoryItem)
  const { toast } = useToast()
  const [dialog, setDialog] = useState<{ kind: "donate" | "recovery"; item: InventoryItem } | null>(null)

  const urgent = useMemo(
    () => inventory.filter((i) => i.orgId === org?.id).map((i) => ({ ...i, status: liveStatus(i) }))
      .filter((i) => i.status !== "ok")
      .sort((a, b) => (a.expiryAt ?? "").localeCompare(b.expiryAt ?? "")),
    [inventory, org?.id],
  )
  const critical = urgent.filter((i) => i.status === "critical")
  const attention = urgent.filter((i) => i.status === "attention")

  return (
    <PageWrap>
      <SectionHeader
        title="Expiry Alerts"
        desc="Items needing attention — act before food is wasted."
        badge={urgent.length > 0 ? <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">{urgent.length} need attention</span> : undefined}
      />
      <InfoBanner tone="warning">
        <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
        These alerts use demo time windows (≤8h critical, ≤36h attention). An item is <b>not automatically safe</b> merely because its date has not passed — always review condition first.
      </InfoBanner>
      {urgent.length === 0 ? (
        <EmptyState icon={<Package className="h-7 w-7" />} title="No expiry alerts" desc="Nothing is close to its best-before window right now. Keep monitoring inventory." />
      ) : (
        <div className="space-y-3">
          {critical.length > 0 && <h3 className="text-sm font-bold uppercase tracking-wide text-red-600">Critical — act now ({critical.length})</h3>}
          {[...critical, ...attention].map((i, idx) => (
            <div key={i.id}>
              {idx === critical.length && attention.length > 0 && <h3 className="mb-2 mt-4 text-sm font-bold uppercase tracking-wide text-amber-600">Attention soon ({attention.length})</h3>}
              <Card className={cn("py-4", i.status === "critical" && "border-red-200")}>
                <CardContent className="space-y-2 px-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{i.name} — {i.status === "critical" ? "attention needed" : "attention needed soon"}</p>
                    <StatusBadge status={i.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {i.quantity} {i.unit} · batch {i.batch} · {i.storage} · {i.expiryAt ? `best-before in ${timeUntil(i.expiryAt)}` : "no date set"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" className="h-8 bg-emerald-600 text-xs font-bold" onClick={() => setDialog({ kind: "donate", item: i })}><HandHeart className="mr-1 h-3 w-3" /> Donate</Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setDialog({ kind: "donate", item: i }); toast({ title: "Redistribute selected", description: "Same free listing flow — confirm quantity." }) }}><UtensilsCrossed className="mr-1 h-3 w-3" /> Redistribute</Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs text-violet-700" onClick={() => setDialog({ kind: "recovery", item: i })}><Recycle className="mr-1 h-3 w-3" /> Recovery</Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => toast({ title: `${i.name} flagged for review`, description: "Staff will verify condition before any decision (demo)." })}>Review</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent className="max-w-sm">
          {dialog && (
            <>
              <DialogHeader>
                <DialogTitle>{dialog.kind === "donate" ? "Donate" : "Recover"} — {dialog.item.name}</DialogTitle>
                <DialogDescription>{dialog.item.quantity} {dialog.item.unit} · {dialog.item.expiryAt ? `best-before in ${timeUntil(dialog.item.expiryAt)}` : "no date"}</DialogDescription>
              </DialogHeader>
              <QuickDonateRecover
                item={dialog.item}
                onDonate={(qty) => { donateInventoryItem(dialog.item.id, qty); setDialog(null); toast({ title: "Free donation listed 🎉" }); onAfterAction?.() }}
                onRecover={(qty, pid) => { recoverInventoryItem(dialog.item.id, qty, pid); setDialog(null); toast({ title: "Recovery handoff scheduled ♻️" }); onAfterAction?.() }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  )
}

function QuickDonateRecover({ item, onDonate, onRecover }: { item: InventoryItem; onDonate: (q: number) => void; onRecover: (q: number, partnerId: string) => void }) {
  const recoveryPartners = useStore((s) => s.recoveryPartners)
  const [qty, setQty] = useState(String(item.quantity))
  const [partner, setPartner] = useState(recoveryPartners[0]?.id ?? "")
  return (
    <div className="space-y-3">
      <div className="space-y-1.5"><Label>Quantity ({item.unit}) — max {item.quantity}</Label><Input type="number" min={1} max={item.quantity} value={qty} onChange={(e) => setQty(e.target.value)} /></div>
      {recoveryPartners.length > 0 && (
        <div className="space-y-1.5"><Label>Recovery partner</Label>
          <Select value={partner} onValueChange={setPartner}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{recoveryPartners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div className="flex gap-2">
        <Button className="flex-1 bg-emerald-600 font-bold" onClick={() => onDonate(Math.min(Number(qty) || 1, item.quantity))}><HandHeart className="mr-1 h-4 w-4" /> Free Donate</Button>
        <Button variant="outline" className="flex-1 text-violet-700" onClick={() => onRecover(Math.min(Number(qty) || 1, item.quantity), partner)}><Recycle className="mr-1 h-4 w-4" /> Recover</Button>
      </div>
    </div>
  )
}

// ============================================================
// IMPACT / SUSTAINABILITY DASHBOARD
// ============================================================
export function ImpactDashboard({ variant }: { variant: "ngo" | "kitchen" }) {
  const org = useCurrentOrg()
  const requests = useStore((s) => s.requests)
  const assistance = useStore((s) => s.assistance)
  const listings = useStore((s) => s.listings)
  const handoffs = useStore((s) => s.recoveryHandoffs)
  const energy = useStore((s) => s.energy)

  const myCompleted = requests.filter((r) => r.providerId === org?.id && r.status === "completed")
  const liveMeals = myCompleted.reduce((s, r) => s + r.quantity, 0)
  const assistedPeople = assistance.filter((a) => a.status === "completed").reduce((s, a) => s + a.peopleCount, 0)
  const baseMeals = 1240 // seeded demo history baseline
  const mealsRedistributed = baseMeals + liveMeals + assistedPeople
  const recoveredKg = handoffs.reduce((s, h) => s + h.quantity, 0)
  const activeListings = listings.filter((l) => l.providerId === org?.id && l.status === "active").length

  const trend = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return days.map((d, i) => ({
      day: d,
      meals: Math.round(150 + Math.sin(i * 1.3) * 40 + liveMeals * 0.1),
      co2: Math.round((150 + Math.sin(i * 1.3) * 40) * DEMO_FACTORS.co2ePerMealKg),
    }))
  }, [liveMeals])

  return (
    <PageWrap>
      <SectionHeader
        title={variant === "ngo" ? "Impact" : "Sustainability Dashboard"}
        desc="Social and environmental impact of your food redistribution."
        badge={<DemoBadge label="ESTIMATED IMPACT" />}
      />
      <KpiGrid>
        <StatCard title="Meals redistributed" value={mealsRedistributed.toLocaleString("en-IN")} sub="incl. seeded demo history" icon={<UtensilsCrossed className="h-5 w-5" />} />
        <StatCard title="Food waste prevented" value={`${Math.round(mealsRedistributed * DEMO_FACTORS.kgPerMeal)} kg`} sub="demo estimate (0.5 kg/meal)" icon={<Leaf className="h-5 w-5" />} tone="positive" />
        <StatCard title="CO₂e avoided" value={`${(mealsRedistributed * DEMO_FACTORS.co2ePerMealKg / 1000).toFixed(1)} t`} sub="demo estimate (2.5 kg/meal)" icon={<BarChart3 className="h-5 w-5" />} tone="info" />
        <StatCard title="Food recovered" value={`${recoveredKg} kg`} sub="compost / biogas / feed" icon={<Recycle className="h-5 w-5" />} tone="warning" />
        <StatCard title="People assisted" value={(assistedPeople + 86).toLocaleString("en-IN")} sub="community help (demo)" icon={<Truck className="h-5 w-5" />} />
        <StatCard title="Active listings" value={activeListings} sub="free food live now" icon={<Package className="h-5 w-5" />} tone="positive" />
        <StatCard title="Energy usage" value={`${energy.filter((e) => e.category !== "processing").reduce((s, e) => s + e.kwh, 0)} kWh`} sub="this week (simulated)" icon={<Zap className="h-5 w-5" />} tone="warning" />
        <StatCard title="Resource efficiency" value="92%" sub="demo metric" icon={<Factory className="h-5 w-5" />} tone="info" />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-5">
          <CardContent className="space-y-3 px-5">
            <h3 className="text-sm font-bold">Redistribution trend (demo)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="meals" stroke="#059669" strokeWidth={2.5} fill="url(#mealGrad)" name="Meals" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="py-5">
          <CardContent className="space-y-3 px-5">
            <h3 className="text-sm font-bold">Estimated CO₂e avoided (demo)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="co2" fill="#d97706" radius={[6, 6, 0, 0]} name="kg CO₂e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <InfoBanner tone="demo">
        <b>ESTIMATED ENVIRONMENTAL IMPACT:</b> CO₂e and food-weight figures use demo conversion factors (0.5 kg food/meal, 2.5 kg CO₂e/meal),
        not validated real-world data. Energy readings are SIMULATED.
      </InfoBanner>
    </PageWrap>
  )
}

// ============================================================
// ORG PROFILE (shared NGO / Kitchen)
// ============================================================
export function OrgProfile({ variant }: { variant: "ngo" | "kitchen" }) {
  const org = useCurrentOrg()
  if (!org) return null
  return (
    <PageWrap>
      <SectionHeader
        title="Profile"
        badge={org.status === "verified-demo" ? <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">VERIFIED (DEMO)</span> : <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">PENDING VERIFICATION (DEMO)</span>}
      />
      <Card className="py-5">
        <CardContent className="space-y-4 px-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">{variant === "ngo" ? "🤝" : "👨‍🍳"}</div>
            <div className="min-w-0">
              <p className="text-lg font-bold">{org.name}</p>
              <p className="text-sm text-muted-foreground">{variant === "ngo" ? org.ngoType : org.kitchenType} · {org.city}</p>
              <p className="mt-1 text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{org.address}</p>
              <p className="text-xs text-muted-foreground"><Phone className="mr-1 inline h-3 w-3" />{org.phone} · {org.contactPerson}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{org.description}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {variant === "ngo" ? (
              <>
                <Labeled label="Registration no.">{org.registrationNumber ?? "—"}</Labeled>
                <Labeled label="Food storage">{org.storageAvailable ? "Available" : "Not available"}</Labeled>
                <Labeled label="Est. beneficiaries">{org.estimatedBeneficiaries ?? 0}</Labeled>
              </>
            ) : (
              <>
                <Labeled label="Daily capacity">{org.dailyCapacity ?? 0} meals</Labeled>
                <Labeled label="Storage">{org.storageCapability ?? "—"}</Labeled>
                <Labeled label="License">{org.licenseInfo ?? "—"}</Labeled>
              </>
            )}
          </div>
          <InfoBanner tone="demo">
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
            DEMO ORGANIZATION — no real verification was performed. Login ID: <b>{org.username}</b> (demo).
          </InfoBanner>
        </CardContent>
      </Card>
    </PageWrap>
  )
}

export { Textarea }
