"use client"
// ============================================================
// SmartFood AI — compatibility re-exports
// The map implementation moved to components/maps/ (provider
// abstraction: Mapbox · Google Maps · OSM fallback). Existing
// screens keep importing from here so nothing else changes.
// ============================================================
export type { MapCategory, MapMarker } from "@/components/maps/MapMarker"
export { MAP_CATEGORIES, MapLegend } from "@/components/maps/MapMarker"
export { MapView } from "@/components/maps/MapView"
export { RouteMap } from "@/components/maps/RouteMap"
