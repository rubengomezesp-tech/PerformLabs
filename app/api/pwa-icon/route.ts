import { createElement } from "react";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { platformBrand } from "@/lib/brand";
import { brandMonogram, workspacePwaIdentity } from "@/lib/pwa-branding";
import { getRequestBrandContext } from "@/lib/request-brand";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestedSize = Number(request.nextUrl.searchParams.get("size"));
  const size = requestedSize === 180 || requestedSize === 192 || requestedSize === 512 ? requestedSize : 512;
  const maskable = request.nextUrl.searchParams.get("maskable") === "1";
  const context = await getRequestBrandContext();
  const brand = context.kind === "tenant" ? context.brand : null;
  const identity = brand ? workspacePwaIdentity(brand) : null;
  const unavailable = context.kind === "unknown-tenant";
  const name = identity?.name || (unavailable ? "App" : platformBrand.name);
  const accent = brand?.accentColor || (unavailable ? "#64748b" : platformBrand.accentColor);
  const background = identity?.backgroundColor || "#050914";
  const inset = maskable ? "18%" : "10%";

  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: inset,
          background,
        },
      },
      createElement(
        "div",
        {
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "24%",
            border: `${Math.max(4, Math.round(size / 42))}px solid ${accent}`,
            background: `linear-gradient(145deg, ${accent}30, ${background} 64%)`,
            color: "#f7f9ff",
            fontSize: Math.round(size * 0.3),
            fontWeight: 800,
            letterSpacing: "-0.08em",
          },
        },
        brandMonogram(name),
      ),
    ),
    {
      width: size,
      height: size,
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
