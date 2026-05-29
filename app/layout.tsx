import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { AuthHashBridge } from "@/components/auth-hash-bridge";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { ToastProvider } from "@/components/ui";
import { platformBrand } from "@/lib/brand";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${manrope.variable} ${spaceGrotesk.variable}`} lang="es">
      <body>
        <AuthHashBridge />
        <ServiceWorkerRegister />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
