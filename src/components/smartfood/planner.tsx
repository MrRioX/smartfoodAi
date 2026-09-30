"use client"
// ============================================================
// SmartFood AI — AI Meal Planner (shared: user / NGO / kitchen)
// User sends the AI what dish they are making, and AI calculates
// the exact ingredients, quantities, localized costs, and full
// step-by-step recipe instructions with zero-waste cooking tips.
// ============================================================
import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import type { IngredientQty, MealPlanResult } from "@/lib/types"
import { CITY_NAMES } from "@/lib/cities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PageWrap } from "./shell"
import { Card, CardContent, SectionHeader, InfoBanner, DemoBadge, EmptyState, Labeled, inr, timeAgo } from "./shared"
import { getCityPrices } from "@/lib/ingredient-prices"
import {
  Sparkles, Save, FolderOpen, Trash2, Calculator, Plus, Minus, MapPin,
  Users, ChevronRight, Copy, Check, BookOpen, Clock, ChefHat, Utensils,
} from "lucide-react"

const POPULAR_DISHES = [
  "Paneer Butter Masala",
  "Veg Biryani",
  "Dal Rice",
  "Khichdi",
  "Roti Sabzi",
  "Pav Bhaji",
  "Rajma Chawal",
  "Pasta",
  "Poha",
  "Upma",
  "Pancakes",
]

const INGREDIENT_OPTIONS = [
  "Rice", "Dal", "Oil", "Vegetables", "Spices", "Atta (Wheat Flour)",
  "Suji (Semolina)", "Poha (Flattened Rice)", "Milk", "Ghee", "Paneer", "Butter",
]

export function MealPlanner() {
  const runPlanner = useStore((s) => s.runPlanner)
  const savePreset = useStore((s) => s.savePreset)
  const deletePreset = useStore((s) => s.deletePreset)
  const presets = useStore((s) => s.presets)
  const role = useStore((s) => s.role)
  const userId = useStore((s) => s.userId)
  const orgId = useStore((s) => s.orgId)
  const { toast } = useToast()

  const [foodType, setFoodType] = useState("Paneer Butter Masala")
  const [people, setPeople] = useState(role === "user" ? "4" : "150")
  const [location, setLocation] = useState("Ahmedabad")
  const [includeRecipe, setIncludeRecipe] = useState(true)
  const [copied, setCopied] = useState(false)
  const [engine, setEngine] = useState<{ source: "ai" | "demo"; model?: string; fallbackReason?: string } | null>(null)
  const [assumptions, setAssumptions] = useState<string[]>([])
  const [available, setAvailable] = useState<IngredientQty[]>([])
  const [result, setResult] = useState<MealPlanResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [listOpen, setListOpen] = useState(false)

  const myPresets = useMemo(
    () => presets.filter((p) => p.ownerId === (userId ?? orgId)),
    [presets, userId, orgId],
  )

  const calculate = async () => {
    if (!foodType.trim()) {
      toast({ title: "Please enter what you are making", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/ai/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodType: foodType.trim(),
          people: Math.max(1, Number(people) || 1),
          location,
          includeRecipe,
          availableIngredients: available.length ? available : undefined,
        }),
      })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      setResult({
        foodType: data.foodType ?? foodType,
        meals: Math.max(1, Math.round(Number(data.meals) || 1)),
        ingredients: (data.ingredients ?? []).map((i: IngredientQty) => ({
          name: i.name,
          qty: Number(i.qty) || 0,
          unit: i.unit,
          pricePerUnit: Number(i.pricePerUnit) || 0,
        })),
        totalCost: Math.round(Number(data.totalCost) || 0),
        costPerMeal: Math.round(Number(data.costPerMeal) || 0),
        extraMeals: Math.max(0, Math.round(Number(data.extraMeals) || 0)),
        recipe: data.recipe,
        calculatedAt: new Date().toISOString(),
      })
      setEngine(data.engine ?? { source: "demo", fallbackReason: "Unknown engine — treat as demo." })
      setAssumptions(Array.isArray(data.assumptions) ? data.assumptions.slice(0, 4) : [])
      if (data.engine?.fallbackReason) toast({ title: data.engine.fallbackReason })
    } catch {
      // Deterministic fallback — the page never breaks.
      const r = runPlanner(foodType.trim(), Math.max(1, Number(people) || 1))
      setResult(r)
      setEngine({ source: "demo", fallbackReason: "Using SmartFood algorithmic calculation." })
      setAssumptions([])
      toast({ title: "Plan calculated", description: `${foodType} for ${people} people.` })
    } finally {
      setBusy(false)
    }
  }

  const recalc = async () => {
    if (!result) return
    setBusy(true)
    try {
      const priceFor = (name: string) => getCityPrices(location).find((p) => p.ingredient.toLowerCase() === name.toLowerCase())
      const ingredients = result.ingredients.map((i) => ({ ...i, pricePerUnit: priceFor(i.name)?.price ?? i.pricePerUnit }))
      const totalCost = Math.round(ingredients.reduce((s, i) => s + i.qty * i.pricePerUnit, 0))
      setResult({
        ...result,
        ingredients,
        totalCost,
        costPerMeal: result.meals > 0 ? Math.round(totalCost / result.meals) : 0,
      })
      toast({ title: "Recalculated", description: `${result.meals} servings · ${inr(totalCost)} · ${location} prices.` })
    } finally {
      setBusy(false)
    }
  }

  const setIng = (i: number, patch: Partial<IngredientQty>) => {
    if (!result) return
    const ings = result.ingredients.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing))
    setResult({ ...result, ingredients: ings })
  }

  const handleCopyShoppingList = () => {
    if (!result) return
    const lines = [
      `🛒 SmartFood AI Shopping List — ${result.foodType} (${result.meals} Servings)`,
      `Total Estimated Cost: ${inr(result.totalCost)} (Avg ${inr(result.costPerMeal)}/serving in ${location})`,
      "",
      "Required Ingredients:",
      ...result.ingredients.map((ing) => `• ${ing.name}: ${ing.qty} ${ing.unit} (~${inr(Math.round(ing.qty * ing.pricePerUnit))})`),
    ]
    if (result.recipe) {
      lines.push("")
      lines.push("🍳 Recipe Summary:")
      lines.push(`Prep: ${result.recipe.prepTimeMin} min | Cook: ${result.recipe.cookTimeMin} min | Difficulty: ${result.recipe.difficulty}`)
      result.recipe.steps.forEach((s, idx) => lines.push(`${idx + 1}. ${s}`))
    }
    navigator.clipboard.writeText(lines.join("\n"))
    setCopied(true)
    toast({ title: "Copied to clipboard", description: "Ingredients list ready to share or shop!" })
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <PageWrap>
      <SectionHeader
        title="AI Meal &amp; Recipe Planner"
        desc="Tell the AI what dish you're making to get exact ingredient quantities, localized budget, and zero-waste cooking recipes."
        badge={<DemoBadge label="SMART INGREDIENT &amp; RECIPE AI" />}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left Column: Input Form */}
        <Card className="py-5 lg:col-span-2">
          <CardContent className="space-y-4 px-5">
            <div>
              <Label className="text-xs font-bold text-foreground">What dish are you making?</Label>
              <Input
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                placeholder="e.g. Paneer Butter Masala, Veg Biryani, Pasta, Pancakes..."
                className="mt-1 h-10 font-medium"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Type any custom recipe or select a quick option below:</p>
            </div>

            {/* Quick Dish Selection Chips */}
            <div className="sf-scroll flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {POPULAR_DISHES.map((dish) => (
                <button
                  key={dish}
                  type="button"
                  onClick={() => setFoodType(dish)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    foodType.toLowerCase() === dish.toLowerCase()
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {dish}
                </button>
              ))}
            </div>

            {/* Servings & City */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  <Users className="mr-1 inline h-3 w-3" /> Servings / People
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  className="h-9 font-bold"
                />
                <div className="flex gap-1 pt-0.5">
                  {[2, 4, 10, 50, 100].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setPeople(String(count))}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  <MapPin className="mr-1 inline h-3 w-3" /> Pricing City
                </Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{CITY_NAMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Uses real localized grocery index</p>
              </div>
            </div>

            {/* Toggle: Include Step-by-Step Recipe */}
            <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-emerald-600" />
                <div>
                  <Label htmlFor="toggle-recipe" className="text-xs font-bold cursor-pointer">
                    Step-by-Step Recipe
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Include cooking instructions &amp; zero-waste tips</p>
                </div>
              </div>
              <input
                type="checkbox"
                id="toggle-recipe"
                checked={includeRecipe}
                onChange={(e) => setIncludeRecipe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {/* Optional: Already Available Ingredients */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Already available in pantry (optional)</Label>
              {available.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select value={a.name} onValueChange={(v) => setAvailable(available.map((x, idx) => (idx === i ? { ...x, name: v } : x)))}>
                    <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{INGREDIENT_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" className="h-8 w-16 text-xs" value={a.qty} onChange={(e) => setAvailable(available.map((x, idx) => (idx === i ? { ...x, qty: Number(e.target.value) } : x)))} />
                  <span className="w-8 text-[11px] text-muted-foreground">{a.unit}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-red-500" onClick={() => setAvailable(available.filter((_, idx) => idx !== i))}><Minus className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setAvailable([...available, { name: "Rice", qty: 2, unit: "kg", pricePerUnit: 52 }])}>
                <Plus className="mr-1 h-3 w-3" /> Add on-hand stock
              </Button>
            </div>

            {/* Action Buttons */}
            <Button className="h-11 w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20" onClick={calculate} disabled={busy}>
              <Sparkles className="mr-1.5 h-4 w-4" /> {busy ? "AI Calculating Quantities & Recipe…" : "Get Ingredients & Recipe"}
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" onClick={() => setListOpen(true)}>
                <FolderOpen className="mr-1 h-3.5 w-3.5" /> Saved Presets ({myPresets.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: AI Output */}
        <div className="space-y-4 lg:col-span-3">
          {!result ? (
            <EmptyState
              icon={<Utensils className="h-8 w-8 text-emerald-600" />}
              title="What are you cooking today?"
              desc="Enter any dish name (e.g. 'Paneer Butter Masala', 'Veg Biryani', 'Poha') and number of people to generate exact ingredient quantities and recipe steps."
            />
          ) : (
            <>
              {/* Ingredients & Cost Card */}
              <Card className="py-5 overflow-hidden">
                <CardContent className="space-y-4 px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {result.foodType}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Portion-controlled for <b>{result.meals} servings</b> · Zero-waste portioning
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-semibold"
                        onClick={handleCopyShoppingList}
                      >
                        {copied ? <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                        {copied ? "Copied!" : "Copy Ingredients"}
                      </Button>
                      {engine?.source === "ai" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <Sparkles className="h-3 w-3" /> AI Model
                        </span>
                      ) : (
                        <DemoBadge label="AI CALCULATION" />
                      )}
                    </div>
                  </div>

                  {/* High level Metrics */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Labeled label="Recommended Servings">{result.meals} portions</Labeled>
                    <Labeled label="Total Ingredient Cost">{inr(result.totalCost)}</Labeled>
                    <Labeled label="Cost Per Serving">{inr(result.costPerMeal)}</Labeled>
                    <Labeled label="Local Pricing Index">{location}</Labeled>
                  </div>

                  {/* Ingredients with Quantities */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Required Ingredients &amp; Quantities
                      </p>
                      <span className="text-[11px] text-muted-foreground">Editable for custom scaling</span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {result.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border p-2.5 bg-card">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="truncate text-sm font-semibold text-foreground">{ing.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              ₹{ing.pricePerUnit}/{ing.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Input
                              type="number"
                              className="h-8 w-18 text-xs font-bold text-right"
                              value={ing.qty}
                              onChange={(e) => setIng(i, { qty: Number(e.target.value) })}
                            />
                            <span className="w-6 text-xs text-muted-foreground font-medium">{ing.unit}</span>
                            <span className="w-16 text-right text-xs font-bold text-emerald-700">
                              {inr(Math.round(ing.qty * ing.pricePerUnit))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row pt-1">
                    <Button className="h-9 flex-1 font-bold" variant="outline" onClick={recalc}>
                      <Calculator className="mr-1.5 h-3.5 w-3.5" /> Recalculate Totals
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 flex-1"
                      onClick={() => {
                        setPresetName(`${result.foodType} (${result.meals} servings)`)
                        setSaveOpen(true)
                      }}
                    >
                      <Save className="mr-1.5 h-3.5 w-3.5" /> Save as Preset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Step-by-Step Cooking Recipe Card */}
              {result.recipe && (
                <Card className="py-5 border-emerald-200 shadow-sm">
                  <CardContent className="space-y-4 px-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                          <BookOpen className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="font-bold text-sm">Step-by-Step Cooking Guide</h4>
                          <p className="text-[11px] text-muted-foreground">Chef instructions scaled for {result.meals} servings</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="flex items-center gap-1 font-semibold">
                          <Clock className="h-3 w-3 text-muted-foreground" /> Prep: {result.recipe.prepTimeMin}m
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 font-semibold">
                          <Utensils className="h-3 w-3 text-muted-foreground" /> Cook: {result.recipe.cookTimeMin}m
                        </Badge>
                        <Badge className="bg-emerald-600 text-white font-bold">
                          {result.recipe.difficulty}
                        </Badge>
                      </div>
                    </div>

                    {/* Steps numbered list */}
                    <div className="space-y-2.5">
                      {result.recipe.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                            {idx + 1}
                          </span>
                          <p className="text-xs leading-relaxed text-foreground pt-0.5">{step}</p>
                        </div>
                      ))}
                    </div>

                    {/* Zero-Waste Chef Tips */}
                    {result.recipe.tips && result.recipe.tips.length > 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                          Zero-Waste Chef Recommendations
                        </div>
                        <ul className="space-y-1 text-[11px] text-emerald-950">
                          {result.recipe.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <InfoBanner tone="demo">
                <b>Zero-Waste Portion Sizing:</b> Quantities have been scaled with portion control heuristics to minimize post-service plate waste and surplus disposal.
              </InfoBanner>
            </>
          )}
        </div>
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Meal Preset</DialogTitle>
            <DialogDescription>Store this recipe and ingredient list for quick one-tap recall.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Preset Name</Label>
              <Input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="e.g. Sunday Family Lunch" />
            </div>
            {result && <p className="text-xs text-muted-foreground">{result.foodType} · {result.meals} servings · {result.ingredients.length} ingredients</p>}
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={() => {
                if (!result) return
                savePreset(presetName || `Preset ${myPresets.length + 1}`, result.foodType, result.meals, result.ingredients)
                setSaveOpen(false)
                toast({ title: "Preset saved", description: `“${presetName}” stored.` })
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Presets List Dialog */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saved Meal Presets</DialogTitle>
            <DialogDescription>Load previously calculated recipes and ingredient ratios.</DialogDescription>
          </DialogHeader>
          {myPresets.length === 0 ? (
            <EmptyState icon={<FolderOpen className="h-7 w-7" />} title="No presets saved yet" desc="Calculate a plan and tap “Save as Preset”." />
          ) : (
            <div className="space-y-2">
              {myPresets.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-xl border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.foodType} · {p.meals} servings · saved {timeAgo(p.createdAt)}</p>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    onClick={() => {
                      const total = p.ingredients.reduce((s, i) => s + i.qty * i.pricePerUnit, 0)
                      setResult({
                        foodType: p.foodType,
                        meals: p.meals,
                        ingredients: p.ingredients,
                        totalCost: total,
                        costPerMeal: Math.round(total / p.meals),
                        extraMeals: 0,
                        calculatedAt: new Date().toISOString(),
                      })
                      setFoodType(p.foodType)
                      setPeople(String(p.meals))
                      setListOpen(false)
                      toast({ title: `Loaded “${p.name}”` })
                    }}
                  >
                    Load <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500"
                    onClick={() => {
                      deletePreset(p.id)
                      toast({ title: "Preset deleted" })
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  )
}
