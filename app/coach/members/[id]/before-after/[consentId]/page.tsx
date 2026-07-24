import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BeforeAfterCard } from "@/components/before-after-card";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedMembers } from "@/lib/repositories/member-management";
import { getConsentCard } from "@/lib/repositories/photo-consents";

export const dynamic = "force-dynamic";

/**
 * Exportación de la tarjeta antes/después (1080×1350, formato feed vertical).
 * Solo existe mientras el consentimiento siga en "granted": una revocación del
 * cliente hace desaparecer esta página al instante.
 */
export default async function BeforeAfterExportPage({ params }: { params: Promise<{ id: string; consentId: string }> }) {
  const { id: rawId, consentId } = await params;
  const id = decodeURIComponent(rawId);
  const brand = await getSelectedMemberAppBrand();
  const [members, card] = await Promise.all([
    listManagedMembers(brand.id),
    getConsentCard(brand.id, id, decodeURIComponent(consentId)),
  ]);
  const member = members.find((candidate) => candidate.id === id);
  if (!member || !card || card.consent.status !== "granted") notFound();
  const firstName = member.fullName.trim().split(/\s+/)[0] || "Cliente";

  return (
    <div className="baExportPage">
      <div className="baExportToolbar">
        <Link className="btn" href={`/coach/members/${member.id}/photos`}><ArrowLeft size={16} /> Volver</Link>
        <p><Info size={15} /> Captura o guarda la tarjeta (1080×1350, listo para feed). Autorizada el {card.consent.respondedAt?.slice(0, 10)}.</p>
      </div>
      <BeforeAfterCard brandName={brand.appName} card={card} memberFirstName={firstName} mode="export" />
    </div>
  );
}
