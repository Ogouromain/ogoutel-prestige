import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OgouTél Prestige - Hôtel de Luxe à Abidjan",
  description:
    "Découvrez l'élégance et le confort au cœur d'Abidjan. Réservez votre séjour dans notre hôtel de prestige.",
  keywords: [
    "OgouTél Prestige",
    "hôtel luxe",
    "Abidjan",
    "Côte d'Ivoire",
    "hôtel prestige",
    "séjour luxe",
  ],
  authors: [{ name: "OgouTél Prestige" }],
  openGraph: {
    title: "OgouTél Prestige - Hôtel de Luxe à Abidjan",
    description:
      "Découvrez l'élégance et le confort au cœur d'Abidjan. Réservez votre séjour dans notre hôtel de prestige.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
