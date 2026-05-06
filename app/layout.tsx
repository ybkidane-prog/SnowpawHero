import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Snowpaw Hero: Pygmy Possum Rescue",
  description:
    "Help Snowpaw the Mountain Pygmy-possum dodge construction in the Australian alps, collect Bogong moths, and unleash the Super Unicorn power-up. A side-scrolling conservation adventure.",
  keywords: [
    "Mountain Pygmy-possum",
    "conservation",
    "Bogong moth",
    "endless runner",
    "side-scroller",
    "wildlife game",
  ],
}

export const viewport: Viewport = {
  themeColor: "#0a1929",
  userScalable: false,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
