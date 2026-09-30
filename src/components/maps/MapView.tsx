// ============================================================
// SmartFood AI — MapView (discovery map)
// Provider-dispatching wrapper around the adapters:
//   mapbox → Mapbox GL JS · google → Maps JS API · else → Leaflet/OSM
// If a keyed provider fails to initialise, the component falls back
// to the OSM adapter and shows an explicit notice. The keyed SDKs
// are dynamically imported so OSM users never download them.
// ============================================================
"use client"

import dynamic from "next/dynamic"
import { Component, type ReactNode } from "react"
import { useMapProvider, providerLabel } from "./MapProvider"
import { LeafletCanvas, type BaseMapCanvasProps } from "./adapters/leaflet-adapter"
import { MapLegend } from "./MapMarker"
import { Badge } from "@/components/ui/badge"

const MapboxCanvas = dynamic(() => import("./adapters/mapbox-adapter").then((m) => m.MapboxCanvas), {
  ssr: false,
  loading: () => <MapSkeleton />,
})
const GoogleCanvas = dynamic(() => import("./adapters/google-adapter").then((m) => m.GoogleCanvas), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

function MapSkeleton() {
  return <div className="flex h-[320px] w-full items-center justify-center rounded-xl border bg-muted/40 text-xs text-muted-foreground sm:h-[380px]">Loading map…</div>
}

class AdapterErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function MapView(props: BaseMapCanvasProps & { showLegend?: boolean }) {
  const cfg = useMapProvider()
  const { showLegend = false, ...canvas } = props
  const useMapbox = cfg.provider === "mapbox" && cfg.keyed
  const useGoogle = cfg.provider === "google" && cfg.keyed

  const osmFallback = (
    <div>
      <LeafletCanvas {...canvas} />
      {(useMapbox || useGoogle) && (
        <p className="mt-1.5 text-center text-[11px] font-semibold text-amber-700">Map provider failed. Switching to fallback map (OpenStreetMap).</p>
      )}
    </div>
  )

  let canvasEl: ReactNode = osmFallback
  if (useMapbox) {
    canvasEl = (
      <AdapterErrorBoundary fallback={osmFallback}>
        <MapboxCanvas {...canvas} />
      </AdapterErrorBoundary>
    )
  } else if (useGoogle) {
    canvasEl = (
      <AdapterErrorBoundary fallback={osmFallback}>
        <GoogleCanvas {...canvas} />
      </AdapterErrorBoundary>
    )
  }

  return (
    <div className="w-full">
      {canvasEl}
      {cfg.note && <p className="mt-1.5 text-center text-[11px] font-semibold text-amber-700">{cfg.note}</p>}
      {showLegend && <div className="mt-3"><MapLegend /></div>}
      <p className="mt-1 text-center text-[10px] text-muted-foreground">
        Map provider: <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold">{providerLabel(cfg)}</Badge>
        {useMapbox || useGoogle ? " (client token — keep it restricted)" : " — free & open map tiles, no key required"}
      </p>
    </div>
  )
}
