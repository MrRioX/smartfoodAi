// ============================================================
// SmartFood AI — MapProvider
// Lightweight context exposing the active map provider so screens
// can display which provider is live (and fallback notices) without
// re-reading env vars. Map rendering components use it to dispatch.
// ============================================================
"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { getMapProviderConfig, providerLabel, type MapProviderConfig } from "./config"

const MapProviderContext = createContext<MapProviderConfig>(getMapProviderConfig())

export function MapProvider({ children }: { children: ReactNode }) {
  const cfg = useMemo(() => getMapProviderConfig(), [])
  return <MapProviderContext.Provider value={cfg}>{children}</MapProviderContext.Provider>
}

export function useMapProvider(): MapProviderConfig {
  return useContext(MapProviderContext)
}

export { providerLabel }
