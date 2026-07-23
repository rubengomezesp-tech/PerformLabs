import { Camera, CheckCircle2, ClipboardCheck, MessageSquareText, TrendingUp } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { EmptyState } from "@/components/empty-state";
import { Topbar } from "@/components/topbar";
import { SubmitButton } from "@/components/ui";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCheckinPhotoUrls, getCoachIntelligenceAlerts, listManagedCheckins } from "@/lib/repositories/checkin-management";
import { reviewCoachCheckinAction } from "./actions";

export const dynamic = "force-dynamic";

const resultOptions = [
  ["on_track", "En línea"],
  ["needs_adjustment", "Ajustar plan"],
  ["stalled", "Estancado"],
  ["excellent", "Excelente"],
];

export default async function CoachCheckinsPage() {
  const brand = await getSelectedMemberAppBrand();
  const [checkins, alerts] = await Promise.all([
    listManagedCheckins(brand.id),
    getCoachIntelligenceAlerts(brand.id),
  ]);
  const pending = checkins.filter((checkin) => checkin.status !== "reviewed").length;
  const reviewed = checkins.filter((checkin) => checkin.status === "reviewed").length;
  const withPhotos = checkins.filter((checkin) => checkin.photosAvailable).length;

  // Resolve short-lived signed URLs only for the check-ins that actually carry photos.
  const photoUrlsByCheckin = new Map<string, string[]>();
  await Promise.all(
    checkins
      .filter((checkin) => checkin.photoPaths.length > 0)
      .map(async (checkin) => {
        photoUrlsByCheckin.set(checkin.id, await getCheckinPhotoUrls(checkin.photoPaths));
      }),
  );

  return (
    <>
      <Topbar
        eyebrow="Check-ins"
        title="Revisión semanal de progreso."
        text="Fotos, peso, medidas, notas, adherencia y decisión del coach para actualizar el plan."
      />
      <section className="grid">
        <article className="card span3">
          <p className="metric">Pendientes<strong>{pending}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Revisados<strong>{reviewed}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Con fotos<strong>{withPhotos}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Alertas<strong>{alerts.length}</strong></p>
        </article>

        <article className="card span12 nutritionLabCard">
          <div className="sectionHeader">
            <div>
              <TrendingUp color="var(--gold)" aria-hidden="true" />
              <h2>Alertas inteligentes.</h2>
              <p>Señales que ayudan al coach a intervenir antes de que el cliente se enfríe.</p>
            </div>
            <span className="tag">{brand.name}</span>
          </div>
          <div className="coachAlertGrid">
            {alerts.length ? alerts.slice(0, 6).map((alert) => (
              <a className={`coachAlert ${alert.severity}`} href={alert.actionHref} key={alert.id}>
                <strong>{alert.title}</strong>
                <p>{alert.detail}</p>
                <span className="tag">{alert.area}</span>
              </a>
            )) : <p className="muted">Sin alertas críticas ahora mismo.</p>}
          </div>
        </article>

        {checkins.map((checkin, index) => {
          const previousWithWeight = checkins
            .slice(index + 1)
            .find((older) => older.memberProfileId === checkin.memberProfileId && typeof older.values.weightKg === "number");
          const weightDelta = typeof checkin.values.weightKg === "number" && typeof previousWithWeight?.values.weightKg === "number"
            ? checkin.values.weightKg - previousWithWeight.values.weightKg
            : null;
          return (
          // id = ancla del deep-link del email inmediato (#checkin-{id})
          <article className="card span6 motionCard" id={`checkin-${checkin.id}`} key={checkin.id}>
            <div className="sectionHeader">
              <div>
                <ClipboardCheck color="var(--gold)" aria-hidden="true" />
                <h2>{checkin.memberName}</h2>
                <p>{checkin.submittedAt ? checkin.submittedAt.slice(0, 10) : "Sin fecha"}</p>
              </div>
              <span className={checkin.status === "reviewed" ? "tag" : "tag danger"}>{checkin.status}</span>
            </div>
            <ul className="list">
              <li className="row"><Camera size={16} /> Fotos <span className="tag">{checkin.photoPaths.length ? `${checkin.photoPaths.length} foto(s)` : checkin.photosAvailable ? "Sí" : "No"}</span></li>
              <li className="row">Peso <strong>{checkin.values.weightKg ? `${checkin.values.weightKg} kg` : "Sin dato"}{weightDelta !== null ? ` (${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg)` : ""}</strong></li>
              <li className="row">Grasa <strong>{checkin.values.bodyFatPercent ? `${checkin.values.bodyFatPercent}%` : "Sin dato"}</strong></li>
              <li className="row">Adherencia entreno <strong>{checkin.values.trainingAdherence || "Pendiente"}</strong></li>
              <li className="row">Adherencia nutrición <strong>{checkin.values.nutritionAdherence || "Pendiente"}</strong></li>
              <li className="row">Resultado <span>{checkin.resultsStatus}</span></li>
            </ul>
            {(photoUrlsByCheckin.get(checkin.id) ?? []).length ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "4px 0 8px" }}>
                {(photoUrlsByCheckin.get(checkin.id) ?? []).map((url, index) => (
                  <a key={index} href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto de progreso ${index + 1}`} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                  </a>
                ))}
              </div>
            ) : null}
            {checkin.values.notes ? <p className="sessionCoachNotes">{checkin.values.notes}</p> : null}
            <Dialog
              triggerClassName={checkin.status === "reviewed" ? "btn" : "btn primary"}
              trigger={<>Revisar <CheckCircle2 size={16} /></>}
              title={`Revisar · ${checkin.memberName}`}
              description="Da feedback y, si toca, avanza el plan a la siguiente semana."
            >
            <form action={reviewCoachCheckinAction} className="checkinReviewForm">
              <input name="workspaceId" type="hidden" value={brand.id} />
              <input name="checkinId" type="hidden" value={checkin.id} />
              <input name="memberProfileId" type="hidden" value={checkin.memberProfileId} />
              <label>
                Resultado
                <select name="resultStatus" defaultValue={checkin.resultsStatus}>
                  {resultOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="spanFull">
                Feedback para el cliente
                <textarea name="coachFeedback" defaultValue={checkin.values.coachFeedback} rows={3} placeholder="Qué va bien, qué ajustar y cómo debe ejecutar esta semana..." />
              </label>
              <label className="spanFull">
                Siguiente acción
                <input name="nextActions" defaultValue={checkin.values.nextActions} placeholder="Mantener calorías, subir pasos, cambiar volumen, revisar en 7 días..." />
              </label>
              <label>
                Ajuste de plan
                <select name="planAction" defaultValue="none">
                  <option value="none">Sin cambio</option>
                  <option value="advance">Avanzar a la siguiente semana</option>
                </select>
              </label>
              <label>
                Próxima revisión (días)
                <input name="reviewInDays" type="number" inputMode="numeric" min="1" max="60" defaultValue="7" />
              </label>
              <SubmitButton variant="primary" className="spanFull" successToast="Revisión guardada">
                Guardar revisión <CheckCircle2 size={16} />
              </SubmitButton>
            </form>
            </Dialog>
          </article>
          );
        })}

        {!checkins.length ? (
          <EmptyState
            icon={MessageSquareText}
            title="Todavía no hay check-ins."
            text="Cuando el cliente envíe peso, medidas, fotos y sensaciones aparecerán aquí para revisión."
          />
        ) : null}
      </section>
    </>
  );
}
