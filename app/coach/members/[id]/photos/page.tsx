import { ArrowLeft, Camera, Download, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/topbar";
import { SubmitButton } from "@/components/ui";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listManagedMembers } from "@/lib/repositories/member-management";
import { listManagedPhotoCheckins, listManagedPhotoConsents } from "@/lib/repositories/photo-consents";
import { requestPhotoConsentAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente del cliente",
  granted: "Autorizada",
  denied: "Rechazada",
  revoked: "Revocada",
};

export default async function CoachMemberPhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const brand = await getSelectedMemberAppBrand();
  const [members, checkins, consents] = await Promise.all([
    listManagedMembers(brand.id),
    listManagedPhotoCheckins(brand.id, id),
    listManagedPhotoConsents(brand.id, id),
  ]);
  const member = members.find((candidate) => candidate.id === id);
  if (!member) notFound();

  return (
    <>
      <Topbar
        eyebrow="Antes / después"
        title={`Progreso visual · ${member.fullName}`}
        text="Pide consentimiento para una tarjeta concreta. El cliente ve exactamente lo que se publicaría y decide."
        actions={<Link className="btn" href={`/coach/members/${member.id}`}><ArrowLeft size={16} /> Ficha</Link>}
      />
      <section className="grid">
        <article className="card span6">
          <div className="sectionHeader">
            <div><Camera color="var(--gold)" aria-hidden="true" /><h2>Pedir autorización.</h2><p>Elige los dos check-ins de la tarjeta. El cliente recibirá la preview exacta en su aula.</p></div>
          </div>
          {checkins.length >= 2 ? (
            <form action={requestPhotoConsentAction} className="photoConsentRequestForm">
              <input name="workspaceId" type="hidden" value={brand.id} />
              <input name="memberProfileId" type="hidden" value={member.id} />
              <label>Antes
                <select defaultValue={checkins[0]?.id} name="beforeCheckinId">
                  {checkins.map((checkin) => <option key={checkin.id} value={checkin.id}>{checkin.submittedAt.slice(0, 10)}{checkin.weightKg ? ` · ${checkin.weightKg} kg` : ""}</option>)}
                </select>
              </label>
              <label>Después
                <select defaultValue={checkins[checkins.length - 1]?.id} name="afterCheckinId">
                  {checkins.map((checkin) => <option key={checkin.id} value={checkin.id}>{checkin.submittedAt.slice(0, 10)}{checkin.weightKg ? ` · ${checkin.weightKg} kg` : ""}</option>)}
                </select>
              </label>
              <SubmitButton variant="primary" successToast="Petición enviada al cliente"><ShieldCheck size={16} /> Pedir consentimiento</SubmitButton>
            </form>
          ) : (
            <p className="muted">Necesitas al menos dos check-ins con fotos de este cliente.</p>
          )}
        </article>

        <article className="card span6">
          <div className="sectionHeader">
            <div><ShieldCheck color="var(--gold)" aria-hidden="true" /><h2>Autorizaciones.</h2><p>Solo puedes exportar tarjetas en estado Autorizada.</p></div>
          </div>
          {consents.length ? (
            <ul className="list">
              {consents.map((consent) => (
                <li className="row" key={consent.id}>
                  <span>{consent.requestedAt.slice(0, 10)} · <span className={consent.status === "granted" ? "tag" : "tag danger"}>{STATUS_LABEL[consent.status] ?? consent.status}</span></span>
                  {consent.status === "granted" ? (
                    <Link className="btn ghost" href={`/coach/members/${member.id}/before-after/${consent.id}`}>
                      <Download size={15} /> Exportar tarjeta
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Todavía no has pedido ninguna autorización.</p>
          )}
        </article>
      </section>
    </>
  );
}
