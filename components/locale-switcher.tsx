"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { locales, localeNames, localeShort, type Locale } from "@/lib/i18n/config";
import { setLocaleAction } from "@/app/i18n-actions";

export function LocaleSwitcher({
  current,
  label,
  changeLabel,
  className,
  supportedLocales = locales,
}: {
  current: Locale;
  label: string;
  changeLabel: string;
  className?: string;
  supportedLocales?: readonly Locale[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(locale: Locale) {
    setOpen(false);
    if (locale === current) return;
    startTransition(async () => {
      await setLocaleAction(locale);
      router.refresh();
    });
  }

  return (
    <div className={className ? `localeSwitcher ${className}` : "localeSwitcher"} ref={rootRef}>
      <button
        type="button"
        className="localeSwitcherBtn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={changeLabel}
        data-pending={pending ? "" : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={15} />
        <span>{localeShort[current]}</span>
      </button>
      {open ? (
        <div className="localeMenu" role="listbox" aria-label={label}>
          {supportedLocales.map((locale) => (
            <button
              key={locale}
              type="button"
              role="option"
              aria-selected={locale === current}
              className={locale === current ? "localeMenuItem active" : "localeMenuItem"}
              onClick={() => choose(locale)}
            >
              <span className="localeMenuCode">{localeShort[locale]}</span>
              <span className="localeMenuName">{localeNames[locale]}</span>
              {locale === current ? <Check size={14} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
