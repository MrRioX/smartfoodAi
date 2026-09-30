// ============================================================
// SmartFood AI — shared map marker types + legend
// ============================================================
"use client"

export type MapCategory =
  | "food"
  | "ngo"
  | "foodbank"
  | "kitchen"
  | "processing"
  | "delivery"
  | "community"
  | "recovery"

export interface MapMarker {
  id: string
  lat: number
  lng: number
  category: MapCategory
  title: string
  subtitle?: string
  detail?: string
  ctaLabel?: string
}

export const MAP_CATEGORIES: Record<MapCategory, { label: string; color: string; emoji: string }> = {
  food: { label: "Free Food", color: "#059669", emoji: "🍲" },
  ngo: { label: "NGO", color: "#0d9488", emoji: "🤝" },
  foodbank: { label: "Food Bank", color: "#d97706", emoji: "🏛️" },
  kitchen: { label: "Kitchen", color: "#ea580c", emoji: "👨‍🍳" },
  processing: { label: "Processing Unit", color: "#475569", emoji: "🏭" },
  delivery: { label: "Delivery", color: "#65a30d", emoji: "🛵" },
  community: { label: "Community Help (approx.)", color: "#e11d48", emoji: "❤️" },
  recovery: { label: "Recovery Partner", color: "#9333ea", emoji: "♻️" },
}

export function MapLegend({ categories }: { categories?: MapCategory[] }) {
  const cats = categories ?? (Object.keys(MAP_CATEGORIES) as MapCategory[])
  return (
    <div className="flex flex-wrap gap-2">
      {cats.map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: MAP_CATEGORIES[c].color }} />
          {MAP_CATEGORIES[c].label}
        </span>
      ))}
    </div>
  )
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function popupHtml(m: MapMarker): string {
  const cat = MAP_CATEGORIES[m.category]
  return `
    <div style="min-width:170px;font-family:inherit">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <span style="width:10px;height:10px;border-radius:99px;background:${cat.color};display:inline-block"></span>
        <span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em">${cat.label}</span>
      </div>
      <div style="font-weight:700;font-size:14px;margin-bottom:2px">${escapeHtml(m.title)}</div>
      ${m.subtitle ? `<div style="font-size:12px;color:#475569;margin-bottom:2px">${escapeHtml(m.subtitle)}</div>` : ""}
      ${m.detail ? `<div style="font-size:12px;color:#64748b;margin-bottom:6px">${escapeHtml(m.detail)}</div>` : ""}
      ${m.ctaLabel ? `<button data-sf-marker="${m.id}" style="margin-top:4px;width:100%;background:#059669;color:#fff;border:0;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:600;cursor:pointer">${escapeHtml(m.ctaLabel)}</button>` : ""}
    </div>`
}
