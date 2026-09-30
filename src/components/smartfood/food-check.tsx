"use client"
// ============================================================
// SmartFood AI — AI Food Check dialog (shared)
// Real AI vision screening via POST /api/ai/food-assessment when
// the server has an AI provider configured; deterministic demo
// rules otherwise (always labelled). Combines:
//   AI vision + on-device BarcodeDetector (when supported) +
//   entered metadata (hours, storage) → structured recommendation.
// "AI-assisted screening — not a food-safety certification."
// ============================================================
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { compressImageToDataUrl, barcodeDetectorSupported, scanBarcodeFromImage } from "@/lib/capture"
import type { AssessmentResult } from "@/lib/types"
import { useStore } from "@/lib/store"
import { StatusBadge, DemoBadge } from "./shared"
import { Camera, ScanBarcode, Sparkles, CheckCircle2, Loader2, XCircle } from "lucide-react"

interface AiAssessmentResponse {
  foodName: string
  visibleIssues: string[]
  packagingCondition: string
  dateText: string
  barcodeText: string
  qualityConcerns: string[]
  confidence: number
  recommendation: AssessmentResult
  humanReviewRequired: boolean
  notes?: string
  engine: { source: "ai" | "demo"; model?: string; fallbackReason?: string }
}

export function AiFoodCheckDialog({
  open, onOpenChange, defaultHours, defaultStorage, foodName, onResult,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultHours: number
  defaultStorage: string
  foodName: string
  onResult?: (r: AssessmentResult) => void
}) {
  const { toast } = useToast()
  const [method, setMethod] = useState<"photo" | "upload" | "barcode">("photo")
  const [hours, setHours] = useState(String(defaultHours))
  const [storage, setStorage] = useState(defaultStorage)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [barcodeText, setBarcodeText] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AiAssessmentResponse | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setResult(null)
    setBusy(false)
    setImagePreview(null)
    setBarcodeText("")
  }

  const attachImage = async (file: File | undefined) => {
    if (!file) return
    try {
      const dataUrl = await compressImageToDataUrl(file)
      setImagePreview(dataUrl)
      toast({ title: "Image attached", description: "It will be sent to the AI vision service for screening." })
    } catch {
      toast({ title: "Could not read that image", variant: "destructive" })
    }
  }

  const attachBarcode = async (file: File | undefined) => {
    if (!file) return
    if (barcodeDetectorSupported()) {
      const found = await scanBarcodeFromImage(file)
      if (found) {
        setBarcodeText(`${found.value} (${found.format})`)
        toast({ title: "Barcode detected ✓", description: `${found.format}: ${found.value}` })
        return
      }
      toast({ title: "No barcode found in that image", description: "Enter the code manually or use another photo." })
      return
    }
    // Browser lacks BarcodeDetector — clearly-labelled demo fallback.
    const demo = `8 901234 5678${Math.floor(Math.random() * 9)} (DEMO SCAN — native barcode detection unavailable in this browser)`
    setBarcodeText(demo)
    toast({ title: "Barcode scanned (DEMO)", description: "This browser doesn't expose the BarcodeDetector API — a demo code was simulated." })
  }

  const analyze = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/ai/food-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: imagePreview ?? undefined,
          foodName,
          hoursSincePrepared: Number(hours) || 0,
          storageCondition: storage,
          barcodeText: barcodeText || undefined,
        }),
      })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = (await res.json()) as AiAssessmentResponse
      setResult(data)
      onResult?.(data.recommendation)
      // Record in assessment history (source of truth for prefill/history)
      useStore.getState().runAssessment({
        foodName: data.foodName || foodName,
        method: barcodeText ? "barcode" : imagePreview ? "photo" : "upload",
        hoursSincePrepared: Number(hours) || 0,
        storageCondition: storage,
        ai: data.engine.source === "ai"
          ? { result: data.recommendation, reasons: [...data.visibleIssues, ...data.qualityConcerns].slice(0, 6).filter(Boolean).length ? [...data.visibleIssues, ...data.qualityConcerns].slice(0, 6) : [data.notes || "AI screening completed"], dateLabel: data.dateText || undefined, confidence: data.confidence, humanReviewRequired: data.humanReviewRequired }
          : undefined,
      })
    } catch {
      toast({ title: "AI request failed. Using demo screening.", variant: "destructive" })
      // Local deterministic fallback so the flow never breaks.
      const fallback = await fetch("/api/ai/food-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName, hoursSincePrepared: Number(hours) || 0, storageCondition: storage }),
      }).catch(() => null)
      if (fallback?.ok) {
        const data = (await fallback.json()) as AiAssessmentResponse
        setResult(data)
        onResult?.(data.recommendation)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-600" /> AI Food Check</DialogTitle>
          <DialogDescription>AI-assisted screening — <b>not a food-safety certification</b>.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {([
              ["photo", "Take Photo", <Camera key="c" className="h-4 w-4" />],
              ["upload", "Upload Photo", <CheckCircle2 key="u" className="h-4 w-4" />],
              ["barcode", "Scan Barcode", <ScanBarcode key="b" className="h-4 w-4" />],
            ] as const).map(([m, label, icon]) => (
              <button
                key={m} type="button" onClick={() => { setMethod(m); reset() }}
                className={cn("flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-[11px] font-bold", method === m ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-border")}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {(method === "photo" || method === "upload") && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-5 text-xs font-semibold text-emerald-700"
              >
                <Camera className="h-4 w-4" /> {method === "photo" ? "Open camera (Android camera input)" : "Choose image file"}
              </button>
              {imagePreview && (
                <div className="flex items-center gap-3 rounded-xl border p-2">
                  { }
                  <img src={imagePreview} alt="Attached food preview" className="h-16 w-16 rounded-lg object-cover" />
                  <p className="flex-1 text-[11px] text-muted-foreground">Image attached — it will be analysed by the vision model{result ? "" : " when you run the assessment"}.</p>
                  <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setImagePreview(null)}>Remove</Button>
                </div>
              )}
              <input
                ref={fileRef} type="file" accept="image/*" className="hidden"
                {...(method === "photo" ? { capture: "environment" as const } : {})}
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void attachImage(f) }}
              />
            </div>
          )}

          {method === "barcode" && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-5 text-center text-xs font-semibold text-emerald-700"
              >
                <ScanBarcode className="mr-1 h-5 w-5" />
                {barcodeDetectorSupported() ? "Scan a barcode photo (on-device detector)" : "Barcode scan (DEMO — detector unavailable in this browser)"}
              </button>
              <Input value={barcodeText} onChange={(e) => setBarcodeText(e.target.value)} placeholder="…or type the barcode number manually" className="h-9 text-xs" />
              {barcodeText && <p className="text-[10px] font-semibold text-emerald-700">Barcode text: {barcodeText}</p>}
              <input
                ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void attachBarcode(f) }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Hours since prepared</Label>
              <Input type="number" min={0} step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Storage condition</Label>
              <Select value={storage} onValueChange={setStorage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Hot case (kept above 60°C)", "Refrigerated 4–6°C", "Frozen", "Room temperature", "Packaged / sealed", "Dry store"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="h-11 w-full font-bold" onClick={analyze} disabled={busy}>
            {busy
              ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Analyzing…</>
              : <><Sparkles className="mr-1.5 h-4 w-4" /> Run AI Assessment</>}
          </Button>

          {result && (
            <div className={cn(
              "rounded-xl border p-4",
              result.recommendation === "eligible" ? "border-emerald-300 bg-emerald-50"
                : result.recommendation === "review" ? "border-amber-300 bg-amber-50"
                  : "border-red-300 bg-red-50",
            )}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={result.recommendation} />
                {result.engine.source === "ai" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <Sparkles className="h-3 w-3" /> AI MODEL{result.engine.model ? ` · ${result.engine.model}` : ""}
                  </span>
                ) : (
                  <DemoBadge label="DEMO AI RESULT" />
                )}
                {typeof result.confidence === "number" && <span className="text-[10px] font-semibold text-muted-foreground">Confidence {result.confidence}%</span>}
              </div>

              {result.engine.fallbackReason && (
                <p className="mt-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-[10px] font-semibold text-amber-800">{result.engine.fallbackReason}</p>
              )}

              {(result.visibleIssues.length > 0 || result.qualityConcerns.length > 0) && (
                <ul className="mt-2 space-y-1">
                  {[...result.visibleIssues, ...result.qualityConcerns].slice(0, 8).map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> {r}</li>
                  ))}
                </ul>
              )}
              {result.recommendation === "not-eligible" && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-red-700"><XCircle className="h-3.5 w-3.5" /> Outside safe redistribution pathway — use recovery instead.</p>
              )}

              <dl className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                {result.packagingCondition && <div><dt className="inline font-semibold">Packaging: </dt><dd className="inline">{result.packagingCondition}</dd></div>}
                {result.dateText && <div><dt className="inline font-semibold">Date info: </dt><dd className="inline">{result.dateText}</dd></div>}
                {result.barcodeText && <div><dt className="inline font-semibold">Barcode: </dt><dd className="inline font-mono">{result.barcodeText}</dd></div>}
              </dl>
              {result.humanReviewRequired && (
                <p className="mt-2 rounded-lg bg-white/60 px-2.5 py-1.5 text-[10px] font-bold text-amber-800">Human review required before handover.</p>
              )}
              {result.notes && <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{result.notes}</p>}
              <p className="mt-2 rounded-lg bg-white/60 px-2.5 py-1.5 text-[10px] leading-relaxed">
                AI-assisted screening — not a food-safety certification. Final decision always rests with trained staff.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
