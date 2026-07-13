import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { AuthHashBridge } from "@/components/auth-hash-bridge";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { ToastProvider } from "@/components/ui";
import { platformBrand } from "@/lib/brand";
import { getLocale } from "@/lib/i18n/server";
import { workspacePwaIconUrl, workspacePwaIdentity } from "@/lib/pwa-branding";
import { getRequestBrandContext } from "@/lib/request-brand";
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

export async function generateMetadata(): Promise<Metadata> {
  const context = await getRequestBrandContext();
  if (context.kind === "platform") {
    return {
      title: platformBrand.name,
      applicationName: platformBrand.name,
      description: "Premium coaching app implementation for performance brands",
      manifest: "/manifest.webmanifest",
      icons: {
        icon: platformBrand.markUrl,
        apple: platformBrand.markUrl,
      },
      appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: platformBrand.name,
      },
    };
  }

  if (context.kind === "unknown-tenant") {
    return {
      title: "App no disponible",
      applicationName: "App",
      description: "Este dominio no está configurado.",
      robots: { index: false, follow: false },
    };
  }

  const brand = context.brand;
  const identity = workspacePwaIdentity(brand);
  return {
    title: identity.name,
    applicationName: identity.name,
    description: identity.description,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: workspacePwaIconUrl(brand, 192), sizes: "192x192", type: "image/png" },
        { url: workspacePwaIconUrl(brand, 512), sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: workspacePwaIconUrl(brand, 180), sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: identity.name,
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const context = await getRequestBrandContext();
  const themeColor = context.kind === "tenant" ? workspacePwaIdentity(context.brand).themeColor : "#0d0d10";
  return {
    themeColor,
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

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
