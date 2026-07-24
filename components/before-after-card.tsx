import { pairPhotosByAngle, type ConsentCard } from "@/lib/repositories/photo-consents";

/**
 * Tarjeta antes/después (1080×1350 en export, escalada en preview). El cliente
 * consiente EXACTAMENTE esto: misma composición en el prompt de consentimiento
 * y en la exportación del coach. Sin apellido; watermark de marca siempre.
 */
export function BeforeAfterCard({ card, memberFirstName, brandName, mode }: {
  card: ConsentCard;
  memberFirstName: string;
  brandName: string;
  mode: "preview" | "export";
}) {
  const pairs = pairPhotosByAngle(card.before, card.after);
  const main = pairs[0];
  const delta = card.weightDeltaKg;
  return (
    <figure className={`baCard ${mode}`}>
      <header className="baCardHeader">
        <strong>{brandName}</strong>
        <span>{memberFirstName} · {card.weeks ? `${card.weeks} semana${card.weeks === 1 ? "" : "s"}` : "Progreso"}</span>
      </header>
      {main ? (
        <div className="baCardPhotos">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Antes" src={main.beforeUrl} />
            <figcaption>ANTES · {card.before.submittedAt.slice(0, 10)}</figcaption>
          </div>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Después" src={main.afterUrl} />
            <figcaption>DESPUÉS · {card.after.submittedAt.slice(0, 10)}</figcaption>
          </div>
        </div>
      ) : (
        <p className="baCardEmpty">No hay un par de fotos comparables del mismo ángulo en estos check-ins.</p>
      )}
      <footer className="baCardFooter">
        {delta !== null ? <strong>{delta > 0 ? "+" : ""}{delta.toFixed(1)} kg</strong> : <strong>Constancia real</strong>}
        <span className="baCardWatermark">{brandName.toUpperCase()} · RESULTADOS REALES</span>
      </footer>
    </figure>
  );
}
