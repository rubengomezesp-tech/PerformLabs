"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Member-facing "invite a friend" card. Builds a shareable access link for the
 * member's brand (carrying a ref tag) and offers copy + WhatsApp share. The
 * referred friend lands on /registro with the ref, which is recorded with the
 * access request so the coach can see it came through a referral.
 */
export function ReferralCard({ refCode, appName }: { refCode: string; appName: string }) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLink(`${window.location.origin}/registro?ref=${encodeURIComponent(refCode)}`);
  }, [refCode]);

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard may be unavailable; the input stays selectable as a fallback
    }
  }

  const whatsappHref = link
    ? `https://wa.me/?text=${encodeURIComponent(`Entreno con ${appName} y creo que te encajaría. Solicita acceso aquí: ${link}`)}`
    : "#";

  return (
    <div className="referralBox">
      <input readOnly value={link} aria-label="Enlace de invitación" onFocus={(event) => event.currentTarget.select()} />
      <button type="button" className="btn" onClick={copy}>
        {copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar</>}
      </button>
      <a className="btn primary" href={whatsappHref} target="_blank" rel="noreferrer">
        <Share2 size={16} /> Compartir
      </a>
    </div>
  );
}
