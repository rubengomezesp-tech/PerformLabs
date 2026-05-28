import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { AuthHashBridge } from "@/components/auth-hash-bridge";
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
  icons: {
    icon: platformBrand.markUrl,
    apple: platformBrand.markUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${manrope.variable} ${spaceGrotesk.variable}`} lang="es">
      <body>
        <AuthHashBridge />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
