"use client"
// ============================================================
// SmartFood AI — shared reusable UI pieces
// ============================================================
import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Leaf, AlertTriangle, XCircle, Clock, CheckCircle2, Info } from "lucide-react"

// ---------- time helpers ----------
export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
export function timeUntil(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now()
  if (diff <= 0) return "expired"
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m left`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h left`
  return `${Math.floor(h / 24)}d left`
}
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`

// ---------- demo honesty badges ----------
export function DemoBadge({ label = "DEMO", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700", className)}>
      <Info className="h-3 w-3" /> {label}
    </span>
  )
}
export function SimBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-sky-700">
      <AlertTriangle className="h-3 w-3" /> SIMULATED
    </span>
  )
}

// ---------- status badges ----------
const STATUS_MAP: Record<string, { label: string; cls: string; icon?: ReactNode }> = {
  ok: { label: "OK", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  available: { label: "Available", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  eligible: { label: "Eligible for review", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  normal: { label: "Normal", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  accepted: { label: "Accepted", cls: "bg-teal-100 text-teal-800 border-teal-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  ready: { label: "Ready for pickup", cls: "bg-teal-100 text-teal-800 border-teal-200", icon: <Clock className="h-3 w-3" /> },
  assigned: { label: "Assigned", cls: "bg-teal-100 text-teal-800 border-teal-200" },
  requested: { label: "Requested", cls: "bg-slate-100 text-slate-700 border-slate-200", icon: <Clock className="h-3 w-3" /> },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-800 border-amber-200", icon: <Clock className="h-3 w-3" /> },
  attention: { label: "Attention soon", cls: "bg-amber-100 text-amber-800 border-amber-200", icon: <AlertTriangle className="h-3 w-3" /> },
  review: { label: "Review required", cls: "bg-amber-100 text-amber-800 border-amber-200", icon: <AlertTriangle className="h-3 w-3" /> },
  warning: { label: "Warning", cls: "bg-amber-100 text-amber-800 border-amber-200", icon: <AlertTriangle className="h-3 w-3" /> },
  delivering: { label: "Out for delivery", cls: "bg-teal-100 text-teal-800 border-teal-200" },
  "at-pickup": { label: "At pickup", cls: "bg-teal-100 text-teal-800 border-teal-200" },
  "in-transit": { label: "In transit", cls: "bg-teal-100 text-teal-800 border-teal-200" },
  critical: { label: "Critical", cls: "bg-red-100 text-red-800 border-red-200", icon: <AlertTriangle className="h-3 w-3" /> },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  "not-eligible": { label: "Not eligible", cls: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  expired: { label: "Expired", cls: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", cls: "bg-slate-100 text-slate-600 border-slate-200", icon: <XCircle className="h-3 w-3" /> },
  declined: { label: "Declined", cls: "bg-slate-100 text-slate-600 border-slate-200" },
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS_MAP[status] ?? { label: status, cls: "bg-slate-100 text-slate-700 border-slate-200" }
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", s.cls, className)}>
      {s.icon} {s.label}
    </span>
  )
}

// ---------- stat cards ----------
export function StatCard({
  title, value, sub, icon, tone = "default", className,
}: {
  title: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode
  tone?: "default" | "positive" | "warning" | "danger" | "info"; className?: string
}) {
  const tones = {
    default: "text-emerald-700 bg-emerald-50",
    positive: "text-emerald-700 bg-emerald-50",
    warning: "text-amber-700 bg-amber-50",
    danger: "text-red-700 bg-red-50",
    info: "text-teal-700 bg-teal-50",
  }
  return (
    <Card className={cn("gap-2 py-4", className)}>
      <CardContent className="flex items-center gap-3 px-4">
        {icon && <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}>{icon}</div>}
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-xl font-bold leading-tight sm:text-2xl">{value}</p>
          {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
}

// ---------- section header ----------
export function SectionHeader({
  title, desc, action, badge,
}: { title: string; desc?: string; action?: ReactNode; badge?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
          {badge}
        </div>
        {desc && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

// ---------- empty state ----------
export function EmptyState({
  icon, title, desc, action,
}: { icon?: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        {icon ?? <Leaf className="h-7 w-7" />}
      </div>
      <p className="font-semibold">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ---------- quantity meter ----------
export function QuantityMeter({ remaining, total, unit }: { remaining: number; total: number; unit: string }) {
  const pct = total > 0 ? Math.round((remaining / total) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-emerald-700">{remaining} {unit} remaining</span>
        <span className="text-muted-foreground">{pct}% of {total}</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  )
}

// ---------- info banner ----------
export function InfoBanner({
  children, tone = "info",
}: { children: ReactNode; tone?: "info" | "warning" | "demo" | "success" }) {
  const tones = {
    info: "border-teal-200 bg-teal-50 text-teal-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    demo: "border-amber-300 bg-amber-50 text-amber-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed", tones[tone])}>{children}</div>
  )
}

// ---------- loading ----------
export function PageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

// ---------- small labeled value ----------
export function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{children}</p>
    </div>
  )
}

export { Card, CardContent, CardHeader, CardTitle, Badge, Button }
