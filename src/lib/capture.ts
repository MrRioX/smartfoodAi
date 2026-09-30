// ============================================================
// SmartFood AI — client capture helpers
// 1. compressImageToDataUrl — resize + JPEG-compress a captured
//    image in the browser (keeps payloads small for the vision API;
//    works on Android WebView with standard file input + canvas).
// 2. scanBarcodeFromImage — uses the native BarcodeDetector API when
//    the browser/WebView supports it; returns null otherwise so the
//    caller can fall back to the clearly-labelled demo scanner.
// ============================================================

export async function compressImageToDataUrl(file: File, maxDim = 1024, quality = 0.82): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Could not read the selected file."))
    reader.readAsDataURL(file)
  })

  // Load into an Image to resize (skip when the browser can't decode).
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => resolve(null)
    el.src = dataUrl
  })
  if (!img) return dataUrl

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  if (scale >= 1 && dataUrl.length < 400_000) return dataUrl
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", quality)
}

/** BarcodeDetector support flag (Chrome/Edge/Android WebView ≥ 83). */
export function barcodeDetectorSupported(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window
}

/**
 * Try to read a barcode from an image file with the native detector.
 * Returns { value, format } or null (unsupported / not found).
 */
export async function scanBarcodeFromImage(file: File): Promise<{ value: string; format: string } | null> {
  if (!barcodeDetectorSupported()) return null
  try {
    const BD = (window as unknown as { BarcodeDetector: new (opts?: { formats?: string[] }) => { detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string; format: string }>> } }).BarcodeDetector
    const formats = await (BD as unknown as { getSupportedFormats?: () => Promise<string[]> }).getSupportedFormats?.()
    const detector = new BD({ formats: formats ?? undefined })
    const bitmap = await createImageBitmap(file)
    const results = await detector.detect(bitmap)
    bitmap.close?.()
    if (results && results.length > 0 && results[0].rawValue) {
      return { value: results[0].rawValue, format: results[0].format ?? "barcode" }
    }
    return null
  } catch {
    return null
  }
}
