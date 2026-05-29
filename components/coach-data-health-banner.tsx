import { AlertTriangle, Database } from "lucide-react";
import { getCoachDataHealth } from "@/lib/repositories/system-health";

/**
 * Shows a clear message at the top of the coach console when it is NOT talking
 * to the real database (missing service key, no schema, or no real workspace).
 * Renders nothing when everything is connected.
 */
export async function CoachDataHealthBanner({ brandId }: { brandId?: string }) {
  const health = await getCoachDataHealth(brandId);
  if (health.ok) return null;

  const Icon = health.level === "error" ? AlertTriangle : Database;

  return (
    <aside className={`coachHealthBanner coachHealthBanner--${health.level}`} role="alert">
      <div className="coachHealthBannerHead">
        <Icon size={20} />
        <div>
          <strong>{health.title}</strong>
          <p>{health.detail}</p>
        </div>
      </div>
      {health.steps.length ? (
        <ol className="coachHealthBannerSteps">
          {health.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      ) : null}
    </aside>
  );
}
