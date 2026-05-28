"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type NavItem = { label: string; href: string };

export function LandingNav({
  brandName,
  markUrl,
  items,
}: {
  brandName: string;
  markUrl: string;
  items: NavItem[];
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
        <nav className="landingNavLinks" aria-label="Secciones">
          {items.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="btn primary sm landingNavCta" href="#consulta">
          Solicitar propuesta <ArrowRight size={16} />
        </a>
      </div>
    </header>
  );
}
