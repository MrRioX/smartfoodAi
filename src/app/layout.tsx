import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SmartFood AI — Demo (SIH Prototype)",
  description:
    "Less Waste. More Food. A Better Tomorrow. SmartFood AI helps organizations and communities prevent food waste, redistribute suitable surplus food for free, coordinate local delivery, and turn unavoidable waste into recovery. Demo prototype — all data is simulated.",
  keywords: ["SmartFood AI", "food waste", "surplus food", "free food redistribution", "SIH", "sustainability", "food recovery"],
  applicationName: "SmartFood AI",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
