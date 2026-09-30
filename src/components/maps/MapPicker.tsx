// ============================================================
// SmartFood AI — MapPicker (real interactive location picker)
// Replaces the old "MapPickerBox" placeholder. Used by NGO /
// Kitchen registration, donation location and community help.
//
// Behaviour:
// 1. Opens a live map centred on the default location.
// 2. Search a place (provider geocoder / Nominatim) — tap a result.
// 3. Pan / zoom; tap the map or drag the 📍 marker to adjust.
// 4. Address, city, state, country auto-fill from reverse geocoding
//    and stay editable.
// 5. [Confirm Location] returns { lat, lng, address, city, state, country }.
// ============================================================
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMapProvider } from "./MapProvider"
import { MapView } from "./MapView"
import { geocodeSearch, reverseGeocode, type GeoPlace } from "./geocoder"
import type { GeoLocation } from "@/lib/types"
import { Loader2, MapPin, Search, CheckCircle2, Crosshair } from "lucide-react"

export type MapPickerResult = GeoLocation

export function MapPicker({
  label,
  initial,
  onConfirm,
  confirmLabel = "Confirm Location",
  heightClass = "h-[280px] sm:h-[320px]",
}: {
  label: string
  /** Previously saved location to start from (optional). */
  initial?: GeoLocation | null
  onConfirm: (loc: MapPickerResult) => void
  confirmLabel?: string
  heightClass?: string
}) {
  const cfg = useMapProvider()
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    initial ? { lat: initial.lat, lng: initial.lng } : null,
  )
  const [center, setCenter] = useState({ lat: initial?.lat ?? 23.0225, lng: initial?.lng ?? 72.5714 })
  const [zoom, setZoom] = useState(initial ? 14 : 11)
  const [q, setQ] = useState("")
  const [results, setResults] = useState<GeoPlace[]>([])
  const [searching, setSearching] = useState(false)
  const [rev, setRev] = useState<GeoPlace | null>(null)
  const [revLoading, setRevLoading] = useState(false)
  const [address, setAddress] = useState(initial?.address ?? "")
  const [city, setCity] = useState(initial?.city ?? "")
  const [state, setState] = useState(initial?.state ?? "")
  const [country, setCountry] = useState(initial?.country ?? "India")
  const [locating, setLocating] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const searchSeq = useRef(0)

  const coordLabel = useMemo(() => (marker ? `${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}` : "no point selected"), [marker])

  // reverse geocode whenever the marker moves (debounced)
  useEffect(() => {
    if (!marker) return
    const t = setTimeout(async () => {
      setRevLoading(true)
      const p = await reverseGeocode(marker.lat, marker.lng, cfg)
      setRevLoading(false)
      if (p) {
        setRev(p)
        setAddress(p.address || p.label.split(",").slice(0, 2).join(",").trim())
        if (p.city) setCity(p.city)
        if (p.state) setState(p.state)
        if (p.country) setCountry(p.country)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [marker, cfg])

  const runSearch = async () => {
    const seq = ++searchSeq.current
    setSearching(true)
    const found = await geocodeSearch(q, cfg)
    if (seq === searchSeq.current) {
      setResults(found)
      setSearching(false)
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }

  const pickPlace = (p: GeoPlace) => {
    setMarker({ lat: p.lat, lng: p.lng })
    setCenter({ lat: p.lat, lng: p.lng })
    setZoom(14)
    setAddress(p.address || p.label.split(",").slice(0, 2).join(",").trim())
    if (p.city) setCity(p.city)
    if (p.state) setState(p.state)
    if (p.country) setCountry(p.country)
    setResults([])
    setQ("")
  }

  const onMapClick = (lat: number, lng: number) => {
    setMarker({ lat, lng })
    setRev(null)
  }

  const onMarkerMove = (lat: number, lng: number) => {
    setMarker({ lat, lng })
    setRev(null)
  }

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setMarker({ lat, lng })
        setCenter({ lat, lng })
        setZoom(15)
      },
      () => setLocating(false),
      { timeout: 8000 },
    )
  }

  const confirm = () => {
    if (!marker) return
    onConfirm({
      lat: marker.lat,
      lng: marker.lng,
      address: address.trim() || coordLabel,
      city: city.trim() || "—",
      state: state.trim() || "—",
      country: country.trim() || "India",
    })
  }

  return (
    <div className="space-y-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-xs font-semibold"><MapPin className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />{label}</Label>
        <Button type="button" variant="outline" size="sm" className="h-8 text-[11px]" onClick={useMyLocation} disabled={locating}>
          <Crosshair className="mr-1 h-3 w-3" /> {locating ? "Locating…" : "Use my location"}
        </Button>
      </div>

      {/* search — a div (not a form) so it can safely sit inside parent forms */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                runSearch()
              }
            }}
            placeholder="Search area, landmark, city…" className="h-10 pl-9 text-sm"
          />
        </div>
        <Button type="button" variant="secondary" size="sm" className="h-10 px-3" disabled={searching || q.trim().length < 3} onClick={runSearch}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <div ref={listRef} className="divide-y rounded-xl border bg-card">
          {results.map((p, i) => (
            <button key={i} type="button" className="block w-full px-3 py-2 text-left text-xs hover:bg-muted/50" onClick={() => pickPlace(p)}>
              <span className="line-clamp-2 font-medium">{p.label}</span>
              <span className="block text-[10px] text-muted-foreground">{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</span>
            </button>
          ))}
        </div>
      )}

      {/* live map — tap or drag to set the point */}
      <MapView
        center={center}
        zoom={zoom}
        pickMarker={marker}
        onMapClick={onMapClick}
        onPickMarkerMove={onMarkerMove}
        className={heightClass}
        ariaLabel={`${label} picker map`}
      />

      <p className="text-[11px] text-muted-foreground">
        Tap the map or drag the 📍 pin. Coordinates: <span className="font-mono font-semibold">{coordLabel}</span>
        {revLoading && <span className="ml-1 inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> resolving address…</span>}
      </p>

      {/* editable resolved address */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[11px]">Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street / area / landmark" className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">City</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">State</Label>
          <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="h-9 text-sm" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[11px]">Country</Label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} className="h-9 text-sm" />
        </div>
      </div>
      {rev && rev.label && <p className="line-clamp-1 text-[10px] text-muted-foreground">Resolved: {rev.label}</p>}

      <Button type="button" className="h-11 w-full bg-emerald-600 font-bold" disabled={!marker} onClick={confirm}>
        <CheckCircle2 className="mr-1.5 h-4 w-4" /> {confirmLabel}
      </Button>
    </div>
  )
}

/** Compact read-only summary shown after a location is confirmed. */
export function LocationSummary({ location, onEdit }: { location: GeoLocation | null; onEdit?: () => void }) {
  if (!location) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5 text-xs text-amber-800">
        <MapPin className="h-4 w-4 shrink-0" /> No location confirmed yet — pick it on the map above.
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{location.address}</p>
        <p className="text-[11px] text-emerald-800/80">{[location.city, location.state, location.country].filter(Boolean).join(", ")} · <span className="font-mono">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span></p>
      </div>
      {onEdit && <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-[11px] font-bold text-emerald-700" onClick={onEdit}>Change</Button>}
    </div>
  )
}
