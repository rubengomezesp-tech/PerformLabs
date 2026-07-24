import { Camera, Check, ShieldCheck, X } from "lucide-react";
import { BeforeAfterCard } from "@/components/before-after-card";
import { SubmitButton } from "@/components/ui";
import { respondMemberPhotoConsentAction } from "@/app/app/(gated)/progress/actions";
import {
  getConsentCard,
  listMemberPhotoCheckins,
  listMemberPhotoConsents,
  pairPhotosByAngle,
} from "@/lib/repositories/photo-consents";
import { getMemberContext } from "@/lib/auth/member-access";

/**
 * Pestaña Fotos del aula: comparador antes/después por ángulo + peticiones de
 * consentimiento del coach con la tarjeta EXACTA renderizada (D-7).
 */
export async function PhotoCompareSection({ workspaceId, brandName, memberFirstName, beforeId, afterId }: {
  workspaceId: string;
  brandName: string;
  memberFirstName: string;
  beforeId?: string;
  afterId?: string;
}) {
  const context = await getMemberContext(workspaceId);
  const [checkins, consents] = await Promise.all([
    listMemberPhotoCheckins(workspaceId),
    listMemberPhotoConsents(workspaceId),
  ]);
  if (checkins.length < 2 && !consents.length) return null;

  const before = checkins.find((checkin) => checkin.id === beforeId) ?? checkins[0] ?? null;
  const after = checkins.find((checkin) => checkin.id === afterId) ?? checkins[checkins.length - 1] ?? null;
  const pairs = before && after && before.id !== after.id ? pairPhotosByAngle(before, after) : [];
  const pending = consents.filter((consent) => consent.status === "pending");
  const granted = consents.filter((consent) => consent.status === "granted");

  const pendingCards = context
    ? await Promise.all(pending.map((consent) => getConsentCard(workspaceId, context.memberProfileId, consent.id)))
    : [];

  return (
    <>
      {checkins.length >= 2 ? (
        <article className="card span12 uiGlass photoCompareCard">
          <div className="sectionHeader">
            <div>
              <span className="uiIconChip"><Camera size={18} /></span>
              <h2>Compara tu evolución.</h2>
              <p>Elige dos check-ins y mira el cambio, ángulo a ángulo.</p>
            </div>
          </div>
          <form className="photoCompareForm" method="get">
            <input name="tab" type="hidden" value="fotos" />
            <label>Antes
              <select defaultValue={before?.id} name="antes">
                {checkins.map((checkin) => <option key={checkin.id} value={checkin.id}>{checkin.submittedAt.slice(0, 10)}{checkin.weightKg ? ` · ${checkin.weightKg} kg` : ""}</option>)}
              </select>
            </label>
            <label>Después
              <select defaultValue={after?.id} name="despues">
                {checkins.map((checkin) => <option key={checkin.id} value={checkin.id}>{checkin.submittedAt.slice(0, 10)}{checkin.weightKg ? ` · ${checkin.weightKg} kg` : ""}</option>)}
              </select>
            </label>
            <button className="btn" type="submit">Comparar</button>
          </form>
          {pairs.length ? (
            <div className="photoComparePairs">
              {pairs.map((pair) => (
                <div className="photoComparePair" key={pair.angle + pair.beforeUrl}>
                  <span className="tag">{pair.angle}</span>
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={`Antes · ${pair.angle}`} src={pair.beforeUrl} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={`Después · ${pair.angle}`} src={pair.afterUrl} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Elige dos check-ins distintos con fotos para ver la comparativa.</p>
          )}
        </article>
      ) : null}

      {pending.length ? (
        <article className="card span12 photoConsentCard" aria-live="polite">
          <div className="sectionHeader">
            <div>
              <span className="uiIconChip"><ShieldCheck size={18} /></span>
              <h2>Tu coach quiere compartir tu progreso.</h2>
              <p>Esto es exactamente lo que se publicaría. Nada sale sin tu permiso, y puedes revocarlo cuando quieras.</p>
            </div>
          </div>
          {pending.map((consent, index) => {
            const card = pendingCards[index];
            if (!card) return null;
            return (
              <div className="photoConsentRequest" key={consent.id}>
                <BeforeAfterCard brandName={brandName} card={card} memberFirstName={memberFirstName} mode="preview" />
                <div className="photoConsentActions">
                  <form action={respondMemberPhotoConsentAction}>
                    <input name="workspaceId" type="hidden" value={workspaceId} />
                    <input name="consentId" type="hidden" value={consent.id} />
                    <input name="decision" type="hidden" value="granted" />
                    <SubmitButton variant="primary" successToast="Autorizado — gracias por compartir tu progreso"><Check size={16} /> Autorizar esta tarjeta</SubmitButton>
                  </form>
                  <form action={respondMemberPhotoConsentAction}>
                    <input name="workspaceId" type="hidden" value={workspaceId} />
                    <input name="consentId" type="hidden" value={consent.id} />
                    <input name="decision" type="hidden" value="denied" />
                    <SubmitButton variant="ghost"><X size={16} /> No, gracias</SubmitButton>
                  </form>
                </div>
              </div>
            );
          })}
        </article>
      ) : null}

      {granted.length ? (
        <article className="card span12">
          <div className="sectionHeader"><div><h2>Autorizaciones activas.</h2><p>Tarjetas que tu coach puede usar. Revócalas cuando quieras.</p></div></div>
          <ul className="list">
            {granted.map((consent) => (
              <li className="row" key={consent.id}>
                Antes/después autorizado el {consent.respondedAt?.slice(0, 10) ?? ""}
                <form action={respondMemberPhotoConsentAction}>
                  <input name="workspaceId" type="hidden" value={workspaceId} />
                  <input name="consentId" type="hidden" value={consent.id} />
                  <input name="decision" type="hidden" value="revoked" />
                  <SubmitButton variant="ghost" successToast="Autorización revocada">Revocar</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </>
  );
}
