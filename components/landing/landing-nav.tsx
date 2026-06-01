"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { Locale } from "@/lib/i18n/config";

type NavItem = { label: string; href: string };

export function LandingNav({
  brandName,
  markUrl,
  items,
  locale,
  ctaLabel,
  accessLabel,
  switcherLabel,
  switcherChange,
}: {
  brandName: string;
  markUrl: string;
  items: NavItem[];
  locale: Locale;
  ctaLabel: string;
  accessLabel: string;
  switcherLabel: string;
  switcherChange: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`landingTopbar${scrolled ? " scrolled" : ""}`}>
      <div className="landingTopbarInner">
        <Link className="landingBrand" href="/">
          <img className="landingBrandMark" src={markUrl} alt="" />
          <span>{brandName}</span>
        </Link>
        <nav className="landingNavLinks" aria-label={brandName}>
          {items.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="landingNavRight">
          <LocaleSwitcher current={locale} label={switcherLabel} changeLabel={switcherChange} />
          <Link className="btn ghost sm landingNavLogin" href="/acceso">
            {accessLabel}
          </Link>
          <a className="btn primary sm landingNavCta" href="#consulta">
            {ctaLabel} <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </header>
  );
}
