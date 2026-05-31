"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link className={active ? "active" : ""} href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
