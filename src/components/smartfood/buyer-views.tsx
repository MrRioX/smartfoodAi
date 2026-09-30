"use client"
// ============================================================
// SmartFood AI — Secondary Buyer Views & Workflows
// Enables secondary buyers (food processors, discount grocers,
// animal feed producers, composters, community kitchens) to
// purchase near-expiring food & bulk surplus from NGOs and
// institutional kitchens at clearance discounts.
// ============================================================
import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import type { BuyerCategory, BuyerListing, BuyerOrder, BuyerUrgency } from "@/lib/types"
import { CITY_NAMES } from "@/lib/cities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { PageWrap } from "./shell"
import { Card, CardContent, SectionHeader, InfoBanner, DemoBadge, EmptyState, Labeled, inr, timeAgo } from "./shared"
import { ExploreMap } from "./explore-map"
import {
  ShoppingCart, AlertTriangle, CheckCircle2, Clock, MapPin, Sparkles,
  QrCode, ArrowRight, ShieldCheck, Tag, Filter, Search, Plus, Trash2,
  TrendingDown, TrendingUp, Package, Building2, Flame, Award,
} from "lucide-react"

// ---------------- 1. BUYER DASHBOARD / OVERVIEW ----------------
export function BuyerOverview() {
  const navigate = useStore((s) => s.navigate)
  const listings = useStore((s) => s.buyerListings)
  const orders = useStore((s) => s.buyerOrders)
  const profile = useStore((s) => s.buyerProfile)

  const activeOrders = orders.filter((o) => o.status === "ready-for-pickup" || o.status === "confirmed")
  const totalSaved = orders.reduce((sum, o) => sum + o.totalSavings, 0)
  const totalKgRescued = orders.reduce((sum, o) => sum + (o.unit === "kg" || o.unit === "L" ? o.quantity : o.quantity * 0.4), 0)
  const criticalListings = listings.filter((l) => l.status === "available" && l.urgency === "critical")

  return (
    <PageWrap>
      <SectionHeader
        title={profile?.businessName ?? "Secondary Buyer Portal"}
        desc="Rescue near-expiring food & bulk surplus from NGOs & kitchens at clearance rates."
        badge={<Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 font-semibold">SECONDARY BUYER</Badge>}
      />

      {/* Critical Expiry Alert Banner */}
      {criticalListings.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-amber-50 p-4 text-red-950 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20">
                <Flame className="h-5 w-5 animate-pulse" />
              </span>
              <div>
                <p className="text-sm font-bold text-red-900">
                  {criticalListings.length} Urgent Clearance Lot{criticalListings.length > 1 ? "s" : ""} Expiring in &lt; 12 Hours!
                </p>
                <p className="text-xs text-red-800">
                  Deep clearance discounts (up to 80% off) available from local kitchens and food banks before items spoil.
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shrink-0 font-bold" onClick={() => navigate("b-market")}>
              View Clearance Feed <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Food Rescued</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{Math.round(totalKgRescued)} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
          <p className="mt-1 text-[11px] text-muted-foreground">Diverted from waste landfill</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Total Money Saved</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{inr(totalSaved)}</p>
          <p className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
            <TrendingDown className="h-3 w-3" /> ~74% avg discount vs MRP
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Active Pickup Passes</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{activeOrders.length}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Ready for warehouse collection</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Surplus Lots Available</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{listings.filter((l) => l.status === "available").length}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Across verified NGOs & kitchens</p>
        </Card>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer border-2 hover:border-emerald-500 transition-all p-4" onClick={() => navigate("b-market")}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Surplus Clearance Market</p>
              <p className="text-xs text-muted-foreground">Explore fresh produce, dairy, bakery & cooked batches</p>
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer border-2 hover:border-emerald-500 transition-all p-4" onClick={() => navigate("b-orders")}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Pickup Passes & Orders</p>
              <p className="text-xs text-muted-foreground">Show QR tokens to NGO depot staff at collection</p>
            </div>
          </div>
        </Card>

        <Card className="cursor-pointer border-2 hover:border-emerald-500 transition-all p-4" onClick={() => navigate("b-sourcing")}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Procurement Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified when target surplus ingredients appear</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Featured Near-Expiry Clearance Lots */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Featured Near-Expiry Clearance Lots</h3>
            <p className="text-xs text-muted-foreground">Verified surplus ready for bulk secondary purchase</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-emerald-700" onClick={() => navigate("b-market")}>
            See All ({listings.length}) <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.slice(0, 3).map((item) => (
            <BuyerListingCard key={item.id} listing={item} onOrderClick={() => navigate("b-market")} />
          ))}
        </div>
      </div>
    </PageWrap>
  )
}

// ---------------- 2. CLEARANCE MARKETPLACE ----------------
export function BuyerMarketplace() {
  const listings = useStore((s) => s.buyerListings)
  const placeOrder = useStore((s) => s.placeBuyerOrder)
  const { toast } = useToast()

  const [search, setSearch] = useState("")
  const [selectedCat, setSelectedCat] = useState<string>("all")
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all")
  const [selectedListing, setSelectedListing] = useState<BuyerListing | null>(null)
  const [orderQty, setOrderQty] = useState<number>(10)
  const [intendedUse, setIntendedUse] = useState<string>("Value-Add Food Processing (Puree, Sauce, Canning)")
  const [confirmedOrder, setConfirmedOrder] = useState<BuyerOrder | null>(null)

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (l.status !== "available") return false
      if (selectedCat !== "all" && l.category !== selectedCat) return false
      if (selectedUrgency !== "all" && l.urgency !== selectedUrgency) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return l.title.toLowerCase().includes(q) || l.providerName.toLowerCase().includes(q) || l.suggestedUse.toLowerCase().includes(q)
      }
      return true
    })
  }, [listings, selectedCat, selectedUrgency, search])

  const handleOpenOrder = (listing: BuyerListing) => {
    setSelectedListing(listing)
    setOrderQty(Math.min(listing.quantity, Math.max(listing.minOrderQty, 10)))
  }

  const handleConfirmOrder = () => {
    if (!selectedListing) return
    const res = placeOrder(selectedListing.id, orderQty, intendedUse)
    if (!res.ok) {
      toast({ title: res.message, variant: "destructive" })
      return
    }
    setSelectedListing(null)
    setConfirmedOrder(res.order ?? null)
    toast({ title: "Order Confirmed!", description: `Pickup pass generated for ${res.order?.listingTitle}` })
  }

  return (
    <PageWrap>
      <SectionHeader
        title="Surplus & Near-Expiry Clearance Feed"
        desc="High-quality surplus and near-expiring lots offered by NGOs & commercial kitchens at heavy discounts."
        badge={<Badge className="bg-emerald-600 text-white font-bold">{filtered.length} LOTS AVAILABLE</Badge>}
      />

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ingredient, dish or provider (e.g. Tomatoes, Milk, Bread)..."
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
              <SelectTrigger className="h-10 w-36 text-xs">
                <SelectValue placeholder="Expiry Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expiries</SelectItem>
                <SelectItem value="critical">🔴 &lt; 12 Hours (Flash)</SelectItem>
                <SelectItem value="urgent">🟠 12–24 Hours</SelectItem>
                <SelectItem value="moderate">🟢 24+ Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="sf-scroll flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "all", label: "All Lots" },
            { id: "produce", label: "🥦 Fresh Produce" },
            { id: "dairy", label: "🥛 Dairy & Milk" },
            { id: "grains", label: "🌾 Grains & Flours" },
            { id: "bakery", label: "🍞 Bakery & Bread" },
            { id: "cooked", label: "🍲 Cooked Surplus" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCat === cat.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="No surplus lots match your filter"
          desc="Try clearing filters or setting a Sourcing Alert to get notified when fresh lots arrive."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <BuyerListingCard key={item.id} listing={item} onOrderClick={() => handleOpenOrder(item)} />
          ))}
        </div>
      )}

      {/* Reserve / Buy Lot Dialog */}
      <Dialog open={!!selectedListing} onOpenChange={(open) => !open && setSelectedListing(null)}>
        {selectedListing && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-emerald-600" />
                Reserve Clearance Lot
              </DialogTitle>
              <DialogDescription>
                Confirm purchase quantity and generate your digital pickup authorization token.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="font-bold text-sm text-foreground">{selectedListing.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Provided by <b>{selectedListing.providerName}</b> ({selectedListing.area}, {selectedListing.city})
                </p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span>Available Batch: <b>{selectedListing.quantity} {selectedListing.unit}</b></span>
                  <span className="font-bold text-emerald-700">₹{selectedListing.clearancePrice}/{selectedListing.unit}</span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label>Quantity to Purchase ({selectedListing.unit})</Label>
                  <span className="text-muted-foreground">Min order: {selectedListing.minOrderQty} {selectedListing.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={selectedListing.minOrderQty}
                    max={selectedListing.quantity}
                    value={orderQty}
                    onChange={(e) => setOrderQty(Math.min(selectedListing.quantity, Math.max(1, Number(e.target.value))))}
                    className="h-10 text-base font-bold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 shrink-0 text-xs font-semibold"
                    onClick={() => setOrderQty(selectedListing.quantity)}
                  >
                    Take Full Lot ({selectedListing.quantity})
                  </Button>
                </div>
              </div>

              {/* Intended Secondary Use */}
              <div className="space-y-1.5">
                <Label className="text-xs">Intended Business / Rescue Use</Label>
                <Select value={intendedUse} onValueChange={setIntendedUse}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Value-Add Food Processing (Puree, Sauce, Canning)">Value-Add Processing (Puree / Sauces / Canning)</SelectItem>
                    <SelectItem value="Secondary Discount Retail / Low-Cost Grocery">Secondary Discount Retail / Budget Grocery</SelectItem>
                    <SelectItem value="Animal Feed / Livestock Nutrition">Animal Feed & Livestock Supplement</SelectItem>
                    <SelectItem value="Compost & Biomass Recovery">Compost & Biomass Energy Processing</SelectItem>
                    <SelectItem value="Community Kitchen / Catering Operations">Community Kitchen & Shift Catering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cost Summary Breakdown */}
              <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Standard MRP Value:</span>
                  <span className="line-through">{inr(Math.round(orderQty * selectedListing.mrpPerUnit))}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-emerald-900">
                  <span>Clearance Order Total:</span>
                  <span>{inr(Math.round(orderQty * selectedListing.clearancePrice))}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold text-[11px] pt-1 border-t border-emerald-200">
                  <span>Your Savings ({selectedListing.discountPercent}% OFF):</span>
                  <span>{inr(Math.round(orderQty * (selectedListing.mrpPerUnit - selectedListing.clearancePrice)))}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedListing(null)}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handleConfirmOrder}>
                Confirm &amp; Get Pass
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Order Confirmed Pickup Pass Modal */}
      <Dialog open={!!confirmedOrder} onOpenChange={(open) => !open && setConfirmedOrder(null)}>
        {confirmedOrder && (
          <DialogContent className="max-w-sm text-center">
            <DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <DialogTitle className="mt-2">Pickup Pass Ready</DialogTitle>
              <DialogDescription>
                Show this token at the collection depot to claim your clearance batch.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">DIGITAL AUTHORIZATION TOKEN</p>
                <p className="mt-1 font-mono text-2xl font-black text-emerald-700">{confirmedOrder.pickupToken}</p>
                <p className="mt-1 text-xs text-muted-foreground">{confirmedOrder.quantity} {confirmedOrder.unit} · {confirmedOrder.listingTitle}</p>
              </div>

              <div className="text-left text-xs space-y-1.5 border rounded-lg p-3 bg-muted/20">
                <p><b>Provider:</b> {confirmedOrder.providerName}</p>
                <p><b>Address:</b> {confirmedOrder.pickupAddress}</p>
                <p><b>Total Payable:</b> <span className="font-bold text-emerald-700">{inr(confirmedOrder.totalAmount)}</span> (Pay at depot)</p>
                <p className="text-amber-800 font-semibold"><b>Collect Before:</b> {new Date(confirmedOrder.pickupBefore).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <DialogFooter>
              <Button className="w-full font-bold" onClick={() => setConfirmedOrder(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </PageWrap>
  )
}

// ---------------- 3. BUYER ORDERS & PICKUP PASSES ----------------
export function BuyerOrdersView() {
  const orders = useStore((s) => s.buyerOrders)
  const completeOrder = useStore((s) => s.completeBuyerOrder)
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<string>("all")

  const filteredOrders = useMemo(() => {
    if (activeTab === "ready") return orders.filter((o) => o.status === "ready-for-pickup" || o.status === "confirmed")
    if (activeTab === "completed") return orders.filter((o) => o.status === "completed")
    return orders
  }, [orders, activeTab])

  return (
    <PageWrap>
      <SectionHeader
        title="My Orders &amp; Pickup Passes"
        desc="Present digital tokens to verify collection at the NGO or kitchen dispatch counter."
        badge={<Badge variant="outline" className="border-emerald-600 text-emerald-700 font-bold">{orders.length} TOTAL ORDERS</Badge>}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="ready">Ready for Pickup ({orders.filter((o) => o.status === "ready-for-pickup" || o.status === "confirmed").length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({orders.filter((o) => o.status === "completed").length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={<QrCode className="h-8 w-8" />}
              title="No orders in this view"
              desc="Reserve near-expiring surplus batches from the Clearance Market to get pickup passes."
            />
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded text-foreground">{order.id}</span>
                      <Badge className={order.status === "completed" ? "bg-muted text-muted-foreground" : "bg-emerald-600 text-white font-bold"}>
                        {order.status === "completed" ? "Collected" : "Ready for Pickup"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">Ordered {timeAgo(order.orderedAt)}</span>
                    </div>
                    <h4 className="font-bold text-base">{order.listingTitle}</h4>
                    <p className="text-xs text-muted-foreground">
                      Provider: <b>{order.providerName}</b> · {order.pickupAddress}
                    </p>
                    <p className="text-xs font-medium text-emerald-800">
                      Intended Use: {order.intendedUse}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">Quantity &amp; Amount</p>
                      <p className="text-lg font-black text-emerald-700">
                        {order.quantity} {order.unit} · {inr(order.totalAmount)}
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-600">Saved {inr(order.totalSavings)}</p>
                    </div>

                    {order.status !== "completed" ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-emerald-400 bg-emerald-50 px-2.5 py-1">
                          <QrCode className="h-4 w-4 text-emerald-700" />
                          <span className="font-mono text-sm font-bold text-emerald-800">{order.pickupToken}</span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          onClick={() => {
                            completeOrder(order.id)
                            toast({ title: "Order collected", description: "Batch confirmed received." })
                          }}
                        >
                          Mark Collected
                        </Button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Rescued from landfill
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </PageWrap>
  )
}

// ---------------- 4. BUYER SOURCING ALERTS ----------------
export function BuyerSourcingAlerts() {
  const alerts = useStore((s) => s.buyerAlerts)
  const addAlert = useStore((s) => s.addBuyerAlert)
  const toggleAlert = useStore((s) => s.toggleBuyerAlert)
  const deleteAlert = useStore((s) => s.deleteBuyerAlert)
  const { toast } = useToast()

  const [keyword, setKeyword] = useState("")
  const [category, setCategory] = useState("produce")
  const [maxPrice, setMaxPrice] = useState("20")
  const [minQty, setMinQty] = useState("15")

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return
    addAlert({
      keyword: keyword.trim(),
      category,
      maxPricePerUnit: Number(maxPrice) || undefined,
      minQuantity: Number(minQty) || undefined,
    })
    setKeyword("")
    toast({ title: "Alert created", description: `You will be notified for "${keyword}" surplus.` })
  }

  return (
    <PageWrap>
      <SectionHeader
        title="Procurement &amp; Sourcing Alerts"
        desc="Set automatic notifications when NGOs or institutional kitchens post near-expiring bulk lots matching your requirements."
        badge={<Badge className="bg-blue-600 text-white font-bold">{alerts.length} ALERTS</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-4 lg:col-span-2">
          <form onSubmit={handleCreate} className="space-y-3">
            <h4 className="font-bold text-sm">Create New Surplus Alert</h4>
            <div className="space-y-1">
              <Label className="text-xs">Ingredient / Food Item Keyword</Label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. Tomatoes, Bread, Milk, Rice..."
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="produce">Fresh Produce</SelectItem>
                  <SelectItem value="dairy">Dairy &amp; Milk</SelectItem>
                  <SelectItem value="grains">Grains &amp; Flours</SelectItem>
                  <SelectItem value="bakery">Bakery &amp; Bread</SelectItem>
                  <SelectItem value="cooked">Cooked Surplus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Max Price (₹/unit)</Label>
                <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Batch Qty</Label>
                <Input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} />
              </div>
            </div>

            <Button type="submit" className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-1.5 h-4 w-4" /> Save Procurement Alert
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-3 space-y-3">
          <h4 className="font-bold text-sm">Active Sourcing Triggers</h4>
          {alerts.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-8 w-8" />}
              title="No alerts created yet"
              desc="Add an alert on the left to receive push notifications when suitable near-expiry batches are posted."
            />
          ) : (
            alerts.map((a) => (
              <Card key={a.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{a.keyword}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">{a.category}</Badge>
                    {a.active ? (
                      <Badge className="bg-emerald-600 text-[10px] text-white">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Paused</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max price: <b>₹{a.maxPricePerUnit}</b> · Min batch: <b>{a.minQuantity} units</b> · {a.city}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => toggleAlert(a.id)}
                  >
                    {a.active ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => deleteAlert(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageWrap>
  )
}

// ---------------- 5. BUYER PROFILE & COMPLIANCE ----------------
export function BuyerProfileView() {
  const profile = useStore((s) => s.buyerProfile)
  const updateProfile = useStore((s) => s.updateBuyerProfile)
  const { toast } = useToast()

  const [form, setForm] = useState(profile ?? {
    id: "u-buyer01",
    username: "buyer01",
    name: "Vikram Singhania",
    businessName: "GreenCycle Food Processing",
    businessType: "Food Processing (Value-Add)" as const,
    phone: "98240 55667",
    email: "vikram@greencycle.demo",
    city: "Ahmedabad",
    address: "Plot 42, GIDC Naroda, Ahmedabad",
    fssaiLicense: "FSSAI-DEMO-24-8841-GJ",
    gstin: "24AAACG1234F1Z5",
    coldStorageAvailable: true,
    transportCapacityKg: 850,
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile(form)
    toast({ title: "Profile updated", description: "Secondary buyer credentials saved." })
  }

  return (
    <PageWrap>
      <SectionHeader
        title="Secondary Buyer Profile &amp; Verification"
        desc="Manage your commercial processing credentials, cold chain capacity, and pickup dispatch details."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Contact Person Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Business / Company Name</Label>
                <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Primary Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Operating City</Label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CITY_NAMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Processing / Facility Address</Label>
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">FSSAI Registration (Demo)</Label>
                <Input value={form.fssaiLicense ?? ""} onChange={(e) => setForm({ ...form, fssaiLicense: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">GSTIN (Demo)</Label>
                <Input value={form.gstin ?? ""} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Transport Capacity (kg per trip)</Label>
                <Input type="number" value={form.transportCapacityKg} onChange={(e) => setForm({ ...form, transportCapacityKg: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="cold-storage"
                  checked={form.coldStorageAvailable}
                  onChange={(e) => setForm({ ...form, coldStorageAvailable: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Label htmlFor="cold-storage" className="text-xs cursor-pointer">
                  Cold storage facility available at warehouse
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
              Save Buyer Details
            </Button>
          </form>
        </Card>

        {/* Verification & Trust Badge Card */}
        <div className="space-y-3">
          <Card className="p-4 bg-emerald-50/60 border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Verified Secondary Buyer
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              As a verified Secondary Buyer on SmartFood AI, you help divert perishable surplus from landfills into value-added food products, pet/livestock feed, and recovery streams.
            </p>
            <div className="mt-3 text-xs space-y-1 border-t border-emerald-200 pt-2 text-emerald-950">
              <p>• Verified Status: <b>Demo Approved</b></p>
              <p>• Direct Access: <b>Flash Clearance Feed</b></p>
              <p>• Automated QR Pass Generation</p>
            </div>
          </Card>
        </div>
      </div>
    </PageWrap>
  )
}

// ---------------- 6. HELPER COMPONENT: LISTING CARD ----------------
function BuyerListingCard({ listing, onOrderClick }: { listing: BuyerListing; onOrderClick: () => void }) {
  const isUrgent = listing.urgency === "critical"
  return (
    <Card className="overflow-hidden border transition-all hover:border-emerald-500 flex flex-col justify-between">
      <CardContent className="p-4 space-y-3">
        {/* Header badges */}
        <div className="flex items-start justify-between gap-1">
          <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
            {listing.category}
          </Badge>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isUrgent
                ? "bg-red-100 text-red-700 border border-red-200 animate-pulse"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            <Clock className="h-3 w-3" />
            Expires in {listing.expiryHours}h
          </span>
        </div>

        {/* Title */}
        <div>
          <h4 className="font-bold text-sm line-clamp-1">{listing.title}</h4>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{listing.providerName}</span>
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{listing.area}, {listing.city}</span>
          </p>
        </div>

        {/* AI Grade & Suggested Use */}
        <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-2 text-[11px] text-emerald-900 space-y-1">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              {listing.aiSafetyGrade}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
              {listing.aiSafetyScore}/100 Safe
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight italic">
            &ldquo;{listing.suggestedUse}&rdquo;
          </p>
        </div>

        {/* Pricing & Quantity Box */}
        <div className="flex items-baseline justify-between pt-1 border-t">
          <div>
            <span className="text-xs text-muted-foreground line-through mr-1.5">
              ₹{listing.mrpPerUnit}/{listing.unit}
            </span>
            <span className="text-lg font-black text-emerald-700">
              ₹{listing.clearancePrice}
              <span className="text-xs font-normal text-muted-foreground">/{listing.unit}</span>
            </span>
            <span className="ml-1.5 inline-block text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              {listing.discountPercent}% OFF
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-foreground">
              {listing.quantity} {listing.unit}
            </span>
            <p className="text-[10px] text-muted-foreground">lot available</p>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          onClick={onOrderClick}
        >
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Reserve / Buy Lot
        </Button>
      </CardContent>
    </Card>
  )
}
