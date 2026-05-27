import Link from "next/link";
import { platformBrand } from "@/lib/brand";
import type { WorkspaceBrand } from "@/lib/repositories/workspaces";

export function MobileBar({
  href,
  productLabel = platformBrand.name,
  brand,
}: {
  href: string;
  productLabel?: string;
  brand?: WorkspaceBrand;
}) {
  const displayBrand = brand ?? {
    appName: platformBrand.monogram,
    name: platformBrand.name,
    accentColor: platformBrand.accentColor,
  };
  const isPlatformShell = !brand;

  return (
    <div className="mobileBar">
      <Link className="brand" href={href} style={{ margin: 0 }}>
        {isPlatformShell ? (
          <img className="brandImageMark" src={platformBrand.markUrl} alt="" />
        ) : (
          <span className="brandMark" style={{ borderColor: displayBrand.accentColor, color: displayBrand.accentColor }}>
            {displayBrand.appName.slice(0, 3).toUpperCase()}
          </span>
        )}
        <span>
          <small>{productLabel}</small>
          <strong>{displayBrand.name}</strong>
        </span>
      </Link>
    </div>
  );
}
