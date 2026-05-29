type MacroValue = number | null | undefined;

/**
 * Premium macro row (Proteins · Fats · Carbs · Calories) used across the
 * member's nutrition area. Respects the "hide calories & macros" setting:
 * when `hidden` is true — or every value is empty — it renders nothing, so
 * the member sees a clean, number-free experience.
 */
export function MacroStrip({
  proteinG,
  fatG,
  carbsG,
  calories,
  hidden = false,
  variant = "bare",
}: {
  proteinG?: MacroValue;
  fatG?: MacroValue;
  carbsG?: MacroValue;
  calories?: MacroValue;
  hidden?: boolean;
  variant?: "bare" | "card";
}) {
  if (hidden) return null;

  const cells = [
    { key: "protein", label: "Proteínas", value: proteinG, unit: "g" },
    { key: "fat", label: "Grasas", value: fatG, unit: "g" },
    { key: "carbs", label: "Carbos", value: carbsG, unit: "g" },
    { key: "calories", label: "Calorías", value: calories, unit: "" },
  ].filter((cell) => typeof cell.value === "number" && Number.isFinite(cell.value));

  if (!cells.length) return null;

  return (
    <div className={variant === "card" ? "macroStrip macroStripCard" : "macroStrip"}>
      {cells.map((cell) => (
        <span className="macroCell" key={cell.key}>
          <strong>
            {Math.round(cell.value as number)}
            {cell.unit ? <i>{cell.unit}</i> : null}
          </strong>
          <small>{cell.label}</small>
        </span>
      ))}
    </div>
  );
}
