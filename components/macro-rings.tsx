import type { CSSProperties } from "react";

type Ring = {
  label: string;
  consumed: number;
  target: number | null;
  color: string;
};

/**
 * Daily-intake rings (Proteins · Fats · Carbs) plus a calories bar, showing
 * consumed vs target. Respects the hide-macros setting: renders nothing when
 * `hidden` is true, for a clean number-free diary.
 */
export function MacroRings({
  rings,
  calories,
  hidden = false,
}: {
  rings: Ring[];
  calories?: { consumed: number; target: number | null };
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <div className="macroRings">
      <div className="macroRingRow">
        {rings.map((ring) => {
          const pct = ring.target ? Math.min(100, Math.max(0, Math.round((ring.consumed / ring.target) * 100))) : 0;
          return (
            <div className="macroRing" key={ring.label}>
              <div
                className="macroRingProgress"
                style={{ "--ring": `${pct}%`, "--ringColor": ring.color } as CSSProperties}
              >
                <div className="macroRingHole">
                  <strong>{Math.round(ring.consumed)}</strong>
                  <small>{ring.target ? `/${Math.round(ring.target)}g` : "g"}</small>
                </div>
              </div>
              <small className="macroRingLabel">{ring.label}</small>
            </div>
          );
        })}
      </div>
      {calories ? (
        <div className="macroCalorieBar">
          <div className="macroCalorieMeta">
            <span>Calorías</span>
            <strong>
              {Math.round(calories.consumed)}
              {calories.target ? ` / ${Math.round(calories.target)}` : ""} kcal
            </strong>
          </div>
          <div className="macroCalorieTrack">
            <span style={{ width: `${calories.target ? Math.min(100, Math.round((calories.consumed / calories.target) * 100)) : 0}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
