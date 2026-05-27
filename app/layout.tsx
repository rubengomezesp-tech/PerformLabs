import type { Metadata } from "next";
import { platformBrand } from "@/lib/brand";
import "./globals.css";

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
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
