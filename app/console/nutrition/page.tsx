import { Apple, Calculator, ShoppingBasket } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { calculateNutritionTargets, splitCaloriesByMeal } from "@/lib/domain/nutrition-engine";
import { listManagedDietTemplates } from "@/lib/repositories/nutrition-management";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";

export const dynamic = "force-dynamic";

type NutritionPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

export default async function NutritionPage({ searchParams }: NutritionPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const templates = await listManagedDietTemplates(selectedWorkspace?.id);
  const example = calculateNutritionTargets({
    gender: "male",
    age: 35,
    heightCm: 178,
    weightKg: 82,
    activityLevel: "moderate",
    goal: "fat_loss",
    proteinPerKg: 2.1,
  });
  const split = splitCaloriesByMeal(4);

  return (
    <>
      <Topbar
        eyebrow="Nutrición"
        title="Planes, macros, recetas y lista de compra."
        text="Base para crear comidas reutilizables, preferencias, alergias, ingredientes no deseados y swaps automáticos."
      />
      <section className="grid">
        <article className="card span12">
          <form action="/console/nutrition" className="formGrid" method="get">
            <label>
              Marca
              <select name="brand" defaultValue={selectedWorkspace?.id}>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="formActions">
              <button className="btn" type="submit">Ver motor</button>
            </div>
          </form>
        </article>

        <article className="card span4">
          <Calculator color="var(--gold)" />
          <h2>Ejemplo matemático</h2>
          <ul className="list">
            <li className="row">BMR <strong>{example.bmr}</strong></li>
            <li className="row">TDEE <strong>{example.tdee}</strong></li>
            <li className="row">Kcal objetivo <strong>{example.targetCalories}</strong></li>
            <li className="row">Macros <strong>{example.proteinG}P / {example.carbsG}C / {example.fatG}G</strong></li>
          </ul>
        </article>

        <article className="card span4">
          <Apple color="var(--gold)" />
          <h2>Split diario</h2>
          <ul className="list">
            {split.map((ratio, index) => (
              <li className="row" key={`${index}-${ratio}`}>
                Comida {index + 1}
                <strong>{Math.round(ratio * 100)}%</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="card span4">
          <ShoppingBasket color="var(--gold)" />
          <h2>Lista de compra</h2>
          <p>
            Se generará por días seleccionados, número de personas, unidades,
            ingredientes agrupados y envío por email/PDF.
          </p>
          <span className="tag">Fase siguiente</span>
        </article>

        {templates.map((template) => (
          <article className="card span4" key={template.id}>
            <Apple color="var(--gold)" />
            <h3>{template.name}</h3>
            <p>{template.goal || "Objetivo pendiente"}</p>
            <ul className="list">
              <li className="row">Kcal <span>{template.caloriesMin ?? "?"} - {template.caloriesMax ?? "?"}</span></li>
              <li className="row">Proteína <span>{template.proteinRatio ? `${Math.round(template.proteinRatio * 100)}%` : "Pendiente"}</span></li>
              <li className="row">Estado <span className="tag">{template.status}</span></li>
            </ul>
          </article>
        ))}
      </section>
    </>
  );
}
