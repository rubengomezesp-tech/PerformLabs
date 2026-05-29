"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export type CommandItem = {
  label: string;
  href: string;
  group?: string;
};

/**
 * Lightweight ⌘K command palette — no external dependency.
 * Renders a visible trigger plus a fixed overlay; opens with ⌘K / Ctrl+K,
 * the trigger, or a `performlabs:command` window event. Navigates the
 * current shell's sections and is keyboard-drivable (↑/↓/Enter/Esc).
 */
export function CommandPalette({ items }: { items: CommandItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    function onCommand() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("performlabs:command", onCommand);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("performlabs:command", onCommand);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) => item.label.toLowerCase().includes(term) || (item.group ?? "").toLowerCase().includes(term),
    );
  }, [items, query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button className="cmdkTrigger" type="button" onClick={() => setOpen(true)}>
        <Search size={15} />
        <span>Buscar</span>
        <kbd>⌘K</kbd>
      </button>
      {open ? (
        <div className="cmdkOverlay" role="dialog" aria-modal="true" onMouseDown={() => setOpen(false)}>
          <div className="cmdkPanel" onMouseDown={(event) => event.stopPropagation()}>
            <div className="cmdkInputRow">
              <Search size={18} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((index) => Math.min(index + 1, Math.max(0, filtered.length - 1)));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((index) => Math.max(index - 1, 0));
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    const item = filtered[activeIndex];
                    if (item) go(item.href);
                  }
                }}
                placeholder="Saltar a una sección…"
                aria-label="Buscar sección"
              />
              <kbd className="cmdkKbd">esc</kbd>
            </div>
            <ul className="cmdkList">
              {filtered.length ? (
                filtered.map((item, index) => (
                  <li key={item.href}>
                    <button
                      type="button"
                      className={index === activeIndex ? "cmdkItem active" : "cmdkItem"}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => go(item.href)}
                    >
                      <span>{item.label}</span>
                      {item.group ? <small>{item.group}</small> : null}
                      <CornerDownLeft className="cmdkEnter" size={14} />
                    </button>
                  </li>
                ))
              ) : (
                <li className="cmdkEmpty">Sin resultados para “{query}”.</li>
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
