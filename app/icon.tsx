import { ImageResponse } from "next/og";
import { getSelectedMemberAppBrand } from "@/lib/member-app";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Icon() {
  const brand = await getSelectedMemberAppBrand();
  const accent = brand.accentColor || "#d8bd6b";
  const label = (brand.appName || brand.name || "APP").slice(0, 3).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: accent,
          color: "#0d0d10",
          fontSize: 210,
          fontWeight: 800,
          letterSpacing: "-8px",
        }}
      >
        {label}
      </div>
    ),
    { ...size },
  );
}
