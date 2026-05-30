import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { AuthHashBridge } from "@/components/auth-hash-bridge";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { ToastProvider } from "@/components/ui";
import { platformBrand } from "@/lib/brand";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

// 2026 type system: Geist (UI/body, Vercel-tier) + Bricolage Grotesque (display
// character) + Geist Mono (tabular numbers).
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: platformBrand.name,
  description: "Premium coaching app implementation for performance brands",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: platformBrand.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d10",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html className={`${geist.variable} ${bricolage.variable} ${geistMono.variable}`} lang={locale}>
      <body>
        <AuthHashBridge />
        <ServiceWorkerRegister />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
