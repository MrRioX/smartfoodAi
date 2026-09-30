"use client"
// ============================================================
// SmartFood AI — Demo authentication screens (SIH Prototype)
// NO real auth: role choice + demo credentials only.
// ============================================================
import { useState } from "react"
import { useStore } from "@/lib/store"
import type { GeoLocation, Role } from "@/lib/types"
import { CITY_NAMES } from "@/lib/cities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { DemoBadge, InfoBanner } from "./shared"
import { MapPicker, LocationSummary } from "@/components/maps/MapPicker"
import { cn } from "@/lib/utils"
import {
  Leaf, User, HeartHandshake, ChefHat, ArrowLeft, ArrowRight, Camera, MapPin, Upload, CheckCircle2, ShoppingCart,
} from "lucide-react"

type AuthScreen = "login" | "register-user" | "register-ngo" | "register-kitchen" | "register-buyer"

export function AuthFlow() {
  const [screen, setScreen] = useState<AuthScreen>("login")
  const [role, setRole] = useState<Role>("user")

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 via-background to-amber-50/60">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
              <Leaf className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">SMARTFOOD AI</h1>
            <p className="mt-1 text-sm font-medium text-emerald-700">Less Waste. More Food. A Better Tomorrow.</p>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
              SmartFood AI helps organizations and communities prevent food waste, redistribute suitable surplus food for free,
              coordinate local delivery, and turn unavoidable waste into recovery.
            </p>
            <p className="mt-2 text-[11px] font-semibold text-amber-700">This is not a normal food-ordering app.</p>
            <div className="mt-3 flex justify-center">
              <DemoBadge label="DEMO AUTHENTICATION — SIH PROTOTYPE" />
            </div>
          </div>
          {screen === "login" && (
            <LoginScreen
              role={role}
              setRole={setRole}
              onRegister={(r) => {
                setRole(r)
                setScreen(r === "user" ? "register-user" : r === "ngo" ? "register-ngo" : r === "kitchen" ? "register-kitchen" : "register-buyer")
              }}
            />
          )}
          {screen === "register-user" && <UserRegister onBack={() => setScreen("login")} />}
          {screen === "register-ngo" && <NgoRegister onBack={() => setScreen("login")} />}
          {screen === "register-kitchen" && <KitchenRegister onBack={() => setScreen("login")} />}
          {screen === "register-buyer" && <BuyerRegister onBack={() => setScreen("login")} />}
        </div>
      </main>
      <footer className="pb-6 text-center text-[11px] text-muted-foreground">
        Demo prototype · All organizations & data are fictional demo entities
      </footer>
    </div>
  )
}

// ---------------- LOGIN ----------------
const ROLE_CARDS: Array<{ role: Role; title: string; desc: string; icon: React.ReactNode; demoId: string; demoPw: string }> = [
  { role: "user", title: "Normal User", desc: "Find free food, donate, deliver, help community", icon: <User className="h-5 w-5" />, demoId: "user01", demoPw: "user123" },
  { role: "ngo", title: "NGO / Food Bank", desc: "Distribute food, manage requests & volunteers", icon: <HeartHandshake className="h-5 w-5" />, demoId: "ngo01", demoPw: "ngo123" },
  { role: "kitchen", title: "Kitchen / Institution", desc: "Plan, produce, prevent surplus, redistribute", icon: <ChefHat className="h-5 w-5" />, demoId: "kitchen01", demoPw: "kitchen123" },
  { role: "buyer", title: "Secondary Buyer", desc: "Buy near-expiring food & bulk surplus at clearance rates", icon: <ShoppingCart className="h-5 w-5" />, demoId: "buyer01", demoPw: "buyer123" },
]

function LoginScreen({ role, setRole, onRegister }: { role: Role; setRole: (r: Role) => void; onRegister: (r: Role) => void }) {
  const login = useStore((s) => s.login)
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const active = ROLE_CARDS.find((r) => r.role === role)!

  const doLogin = (u: string, p: string) => {
    const res = login(role, u.trim(), p.trim())
    if (!res.ok) setError(res.message)
    else toast({ title: res.message, description: "Demo authentication — SIH Prototype" })
  }

  return (
    <Card className="border-0 shadow-xl shadow-emerald-900/5">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-center font-bold">Choose Account Type</h2>
          <p className="mt-1 text-center text-xs text-muted-foreground">Tap a role, then use its demo credentials</p>
        </div>
        <div className="grid gap-2">
          {ROLE_CARDS.map((r) => (
            <button
              key={r.role}
              type="button"
              onClick={() => { setRole(r.role); setError("") }}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all active:scale-[0.99]",
                role === r.role ? "border-emerald-600 bg-emerald-50" : "border-border bg-card hover:border-emerald-300",
              )}
            >
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", role === r.role ? "bg-emerald-600 text-white" : "bg-muted text-emerald-700")}>{r.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{r.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{r.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">{active.title} demo credentials</p>
          <p className="mt-1 font-mono text-sm font-bold">Demo ID: {active.demoId} · Password: {active.demoPw}</p>
          <Button
            type="button" size="sm" variant="outline" className="mt-2 h-9"
            onClick={() => { setUsername(active.demoId); setPassword(active.demoPw); setError(""); doLogin(active.demoId, active.demoPw) }}
          >
            Use Demo Account
          </Button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => { e.preventDefault(); doLogin(username, password) }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="login-id">Demo ID</Label>
            <Input id="login-id" value={username} onChange={(e) => { setUsername(e.target.value); setError("") }} placeholder={active.demoId} autoCapitalize="none" autoComplete="username" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-pw">Demo Password</Label>
            <Input id="login-pw" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError("") }} placeholder={active.demoPw} autoComplete="current-password" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
          <Button type="submit" className="h-11 w-full text-sm font-bold">Sign In as {active.title} <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
          <span className="text-muted-foreground">New here?</span>
          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onRegister("user")}>User</Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onRegister("ngo")}>NGO</Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onRegister("kitchen")}>Kitchen</Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-emerald-700 font-semibold" onClick={() => onRegister("buyer")}>Secondary Buyer</Button>
          </div>
        </div>
        <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
          Demo Authentication — SIH Prototype. No OTP, no real verification. Never use this pattern in production.
        </p>
      </CardContent>
    </Card>
  )
}

// ---------------- shared form bits ----------------
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}{required && <span className="text-red-500"> *</span>}</Label>
      {children}
    </div>
  )
}
function FormShell({ title, onBack, children, footer }: { title: string; onBack: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-xl shadow-emerald-900/5">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack} aria-label="Back to login"><ArrowLeft className="h-4 w-4" /></Button>
          <h2 className="font-bold">{title}</h2>
        </div>
        <div className="sf-scroll max-h-[62vh] space-y-3 pr-1">{children}</div>
        {footer}
      </CardContent>
    </Card>
  )
}
function UploadBox({ label }: { label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-4 text-xs font-semibold text-emerald-700">
      <Upload className="h-4 w-4" /> {label}
      <input type="file" className="hidden" accept="image/*,.pdf" />
    </label>
  )
}
// Real interactive map picker (replaces the old placeholder box).
// The confirmed location is stored on the organization record and
// later reused everywhere the organization appears on a map.
function OrgLocationPicker({ location, onConfirm }: { location: GeoLocation | null; onConfirm: (loc: GeoLocation) => void }) {
  const [editing, setEditing] = useState(!location)
  return editing ? (
    <MapPicker
      label="Organization location (required for map visibility)"
      initial={location}
      confirmLabel="Confirm Location"
      onConfirm={(loc) => {
        onConfirm(loc)
        setEditing(false)
      }}
    />
  ) : (
    <LocationSummary location={location} onEdit={() => setEditing(true)} />
  )
}

// ---------------- USER REGISTRATION ----------------
function UserRegister({ onBack }: { onBack: () => void }) {
  const registerUser = useStore((s) => s.registerUser)
  const { toast } = useToast()
  const [f, setF] = useState({ name: "", phone: "", email: "", city: "Ahmedabad", address: "", username: "", password: "", confirm: "" })
  const [done, setDone] = useState(false)
  const [err, setErr] = useState("")
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.name || !f.phone || !f.username || !f.password) return setErr("Please fill the required fields.")
    if (f.password !== f.confirm) return setErr("Passwords do not match.")
    const res = registerUser(f)
    if (!res.ok) return setErr(res.message)
    setDone(true)
  }

  if (done) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-600" />
          <p className="text-lg font-bold">Demo account created successfully.</p>
          <p className="mt-2 text-sm text-muted-foreground">No OTP or email verification is performed in this prototype.</p>
          <Button className="mt-5 h-11 w-full font-bold" onClick={onBack}>Continue to Login</Button>
        </CardContent>
      </Card>
    )
  }
  return (
    <FormShell title="Register — Normal User" onBack={onBack} footer={<p className="mt-3 text-center text-[10px] text-muted-foreground">No OTP · No verification · Demo Mode</p>}>
      <form className="space-y-3" onSubmit={submit}>
        <Field label="Full Name" required><Input value={f.name} onChange={set("name")} placeholder="e.g. Rahul Sharma" /></Field>
        <Field label="Phone Number" required><Input value={f.phone} onChange={set("phone")} placeholder="10-digit mobile" inputMode="tel" /></Field>
        <Field label="Email (optional)"><Input value={f.email} onChange={set("email")} placeholder="you@example.com" type="email" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" required>
            <Select value={f.city} onValueChange={(v) => setF({ ...f, city: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CITY_NAMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Basic location"><Input value={f.address} onChange={set("address")} placeholder="Area / landmark" /></Field>
        </div>
        <Field label="Username" required><Input value={f.username} onChange={set("username")} placeholder="Choose a demo username" autoCapitalize="none" /></Field>
        <Field label="Password" required><Input type="password" value={f.password} onChange={set("password")} /></Field>
        <Field label="Confirm Password" required><Input type="password" value={f.confirm} onChange={set("confirm")} /></Field>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{err}</p>}
        <Button type="submit" className="h-11 w-full font-bold">Create Demo Account</Button>
      </form>
    </FormShell>
  )
}

// ---------------- NGO REGISTRATION ----------------
function NgoRegister({ onBack }: { onBack: () => void }) {
  const registerOrg = useStore((s) => s.registerOrg)
  const [f, setF] = useState<Record<string, string>>({
    name: "", registrationNumber: "", contactPerson: "", phone: "", email: "", address: "",
    city: "Ahmedabad", state: "Gujarat", ngoType: "Community Meals", description: "",
    storage: "yes", beneficiaries: "500", username: "", password: "",
  })
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.name || !f.contactPerson || !f.phone) return setErr("Please fill the required fields.")
    if (!location) return setErr("Please pick the NGO location on the map (it is used to show your NGO on the Explore Map).")
    const res = registerOrg("ngo", { ...f, storageAvailable: f.storage, location })
    if (!res.ok) return setErr(res.message)
    setDone(true)
  }

  if (done) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-600" />
          <p className="text-lg font-bold">NGO registration submitted — Demo Mode</p>
          <div className="mx-auto mt-3 max-w-xs rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Status: Pending Verification
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            In this prototype any entered data is accepted and no real document verification is performed.
            You can continue into the demo NGO dashboard (Helping Hands NGO — demo organization) to explore the full workflow.
          </p>
          <div className="mt-5 space-y-2">
            <Button className="h-11 w-full font-bold" onClick={() => useStore.getState().loginDemoNgo()}>Continue to Demo NGO Dashboard</Button>
            <Button variant="outline" className="h-11 w-full" onClick={onBack}>Return to Login</Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <FormShell title="Register — NGO / Food Bank" onBack={onBack}>
      <form className="space-y-3" onSubmit={submit}>
        <Field label="NGO Name" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Seva Foundation (demo)" /></Field>
        <Field label="Registration Number"><Input value={f.registrationNumber} onChange={(e) => setF({ ...f, registrationNumber: e.target.value })} placeholder="Society/trust registration no." /></Field>
        <Field label="Contact Person" required><Input value={f.contactPerson} onChange={(e) => setF({ ...f, contactPerson: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" required><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" /></Field>
          <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        </div>
        <Field label="Address"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Street, area" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <Select value={f.city} onValueChange={(v) => setF({ ...f, city: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CITY_NAMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="State"><Input value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} /></Field>
        </div>
        <Field label="NGO Type">
          <Select value={f.ngoType} onValueChange={(v) => setF({ ...f, ngoType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Community Meals", "Food Bank", "Shelter / Homeless Support", "School Meal Support", "Relief / Disaster"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Description"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} placeholder="What does your organization do?" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Food Storage Available">
            <Select value={f.storage} onValueChange={(v) => setF({ ...f, storage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Estimated Beneficiaries"><Input value={f.beneficiaries} onChange={(e) => setF({ ...f, beneficiaries: e.target.value })} inputMode="numeric" /></Field>
        </div>
        <Field label="Upload Document (registration proof)"><UploadBox label="Upload document (demo — any file accepted)" /></Field>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Map Location<span className="text-red-500"> *</span></Label>
          <OrgLocationPicker
            location={location}
            onConfirm={(loc) => {
              setLocation(loc)
              // auto-sync city/state with the picked point (still editable above)
              if (loc.city && loc.city !== "—") setF((p) => ({ ...p, city: loc.city, state: loc.state && loc.state !== "—" ? loc.state : p.state }))
            }}
          />
          <p className="text-[10px] text-muted-foreground">Exact saved coordinates appear for your organization on the Explore Map.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Username"><Input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoCapitalize="none" /></Field>
          <Field label="Password"><Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        </div>
        <InfoBanner tone="demo">Demo Mode: any entered data is accepted. No real NGO verification is performed in this prototype.</InfoBanner>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{err}</p>}
        <Button type="submit" className="h-11 w-full font-bold">Submit NGO Registration</Button>
      </form>
    </FormShell>
  )
}

// ---------------- KITCHEN REGISTRATION ----------------
function KitchenRegister({ onBack }: { onBack: () => void }) {
  const registerOrg = useStore((s) => s.registerOrg)
  const [f, setF] = useState<Record<string, string>>({
    name: "", contactPerson: "", phone: "", email: "", address: "", city: "Ahmedabad", state: "Gujarat",
    kitchenType: "Institutional / Community Kitchen", capacity: "1000", storage: "Cold storage + dry store",
    license: "", username: "", password: "",
  })
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.name || !f.contactPerson || !f.phone) return setErr("Please fill the required fields.")
    if (!location) return setErr("Please pick the kitchen location on the map (it is used to show your kitchen on the Explore Map).")
    const res = registerOrg("kitchen", {
      ...f, kitchenType: f.kitchenType, dailyCapacity: f.capacity,
      storageCapability: f.storage, licenseInfo: f.license, location,
    })
    if (!res.ok) return setErr(res.message)
    setDone(true)
  }

  if (done) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-600" />
          <p className="text-lg font-bold">Kitchen registration submitted — Demo Mode</p>
          <div className="mx-auto mt-3 max-w-xs rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Status: Pending Verification
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Any entered values are accepted for demonstration. To explore the kitchen workflow now, you can jump into the demo kitchen dashboard (Green Plate Kitchen — demo organization).
          </p>
          <div className="mt-5 space-y-2">
            <Button className="h-11 w-full font-bold" onClick={() => useStore.getState().login("kitchen", "kitchen01", "kitchen123")}>Continue to Demo Kitchen Dashboard</Button>
            <Button variant="outline" className="h-11 w-full" onClick={onBack}>Return to Login</Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <FormShell title="Register — Kitchen / Institution" onBack={onBack}>
      <form className="space-y-3" onSubmit={submit}>
        <Field label="Kitchen / Organization Name" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Annapurna Canteen (demo)" /></Field>
        <Field label="Responsible Person" required><Input value={f.contactPerson} onChange={(e) => setF({ ...f, contactPerson: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" required><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" /></Field>
          <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        </div>
        <Field label="Address"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Street, area" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <Select value={f.city} onValueChange={(v) => setF({ ...f, city: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CITY_NAMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="State"><Input value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} /></Field>
        </div>
        <Field label="Kitchen Type">
          <Select value={f.kitchenType} onValueChange={(v) => setF({ ...f, kitchenType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Institutional / Community Kitchen", "Hostel / Canteen", "Restaurant / Hotel", "Temple / Langar Kitchen", "Corporate Cafeteria", "Event Catering"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Daily Production Capacity (meals)"><Input value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} inputMode="numeric" /></Field>
          <Field label="Storage Capability">
            <Select value={f.storage} onValueChange={(v) => setF({ ...f, storage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Cold storage + dry store", "Dry store only", "Refrigerator + dry store", "No storage"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Applicable License / Document"><Input value={f.license} onChange={(e) => setF({ ...f, license: e.target.value })} placeholder="e.g. FSSAI license number" /></Field>
        <Field label="Upload Document"><UploadBox label="Upload license document (demo — any file accepted)" /></Field>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Map Location<span className="text-red-500"> *</span></Label>
          <OrgLocationPicker
            location={location}
            onConfirm={(loc) => {
              setLocation(loc)
              if (loc.city && loc.city !== "—") setF((p) => ({ ...p, city: loc.city, state: loc.state && loc.state !== "—" ? loc.state : p.state }))
            }}
          />
          <p className="text-[10px] text-muted-foreground">Exact saved coordinates appear for your kitchen on the Explore Map.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Username"><Input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoCapitalize="none" /></Field>
          <Field label="Password"><Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        </div>
        <InfoBanner tone="demo">Demo Mode: any entered values are accepted for demonstration. No real kitchen verification happens.</InfoBanner>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{err}</p>}
        <Button type="submit" className="h-11 w-full font-bold">Submit Kitchen Registration</Button>
      </form>
    </FormShell>
  )
}

function BuyerRegister({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [businessType, setBusinessType] = useState("Food Processing (Value-Add)")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("Ahmedabad")
  const [address, setAddress] = useState("")
  const [fssai, setFssai] = useState("")
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <FormShell title="Registration Submitted" onBack={onBack}>
        <div className="space-y-3 text-center py-6">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="font-bold text-lg">Secondary Buyer Account Created</h3>
          <p className="text-xs text-muted-foreground">Demo registration submitted — Status: Pending Verification</p>
          <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800">
            You can now sign in using demo ID: <b>buyer01</b> (password: <b>buyer123</b>).
          </div>
          <Button className="w-full mt-4" onClick={onBack}>Back to Sign In</Button>
        </div>
      </FormShell>
    )
  }

  return (
    <FormShell title="Register as Secondary Buyer" onBack={onBack}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim() || !businessName.trim() || !phone.trim()) {
            toast({ title: "Please fill all required fields", variant: "destructive" })
            return
          }
          setSubmitted(true)
        }}
      >
        <Field label="Contact Person Name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </Field>
        <Field label="Business / Company Name" required>
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. GreenCycle Processors / Feed Co." />
        </Field>
        <Field label="Buyer Category" required>
          <Select value={businessType} onValueChange={setBusinessType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Food Processing (Value-Add)">Food Processing (Value-Add / Puree / Sauce)</SelectItem>
              <SelectItem value="Discount Retail / Grocery">Discount Retail & Surplus Grocery</SelectItem>
              <SelectItem value="Animal Feed / Livestock">Animal Feed / Livestock / Farm</SelectItem>
              <SelectItem value="Compost & Biomass">Compost & Biogas Recovery Unit</SelectItem>
              <SelectItem value="Community Kitchen">Budget Community Canteen / Kitchen</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mobile Phone" required>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
          </Field>
          <Field label="City" required>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CITY_NAMES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Facility / Warehouse Address">
          <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Unit address in industrial area or market" />
        </Field>
        <Field label="FSSAI / Trade License (Demo)">
          <Input value={fssai} onChange={(e) => setFssai(e.target.value)} placeholder="e.g. FSSAI-DEMO-2024-XXXX" />
        </Field>
        <UploadBox label="Upload Business / Trade License (Optional demo upload)" />
        <InfoBanner tone="demo">
          Secondary Buyers rescue near-expiring bulk lots from NGOs and kitchens at clearance discounts for processing, animal feed, or discount redistribution.
        </InfoBanner>
        <Button type="submit" className="h-11 w-full font-bold">Submit Buyer Registration</Button>
      </form>
    </FormShell>
  )
}
