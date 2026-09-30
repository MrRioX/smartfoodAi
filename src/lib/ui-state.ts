// ============================================================
// SmartFood AI — transient UI state (module-level, not persisted)
// Used for cross-screen prefill (e.g. AI assessment → listing).
// ============================================================
import type { FoodListing } from "./types"

export const uiState: { donationPrefill: Partial<FoodListing> | null } = {
  donationPrefill: null,
}

export function takeDonationPrefill(): Partial<FoodListing> | null {
  const p = uiState.donationPrefill
  uiState.donationPrefill = null
  return p
}
