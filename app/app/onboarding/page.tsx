import { Activity, Apple, ClipboardCheck, Dumbbell, Save, ShieldCheck, UserRound } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";

const goalOptions = ["Definicion", "Volumen", "Recomposicion", "Rendimiento", "Salud"];
const trainingOptions = ["Gimnasio", "Casa", "Exterior", "Mixto"];
const nutritionOptions = ["Sin gluten", "Vegetariana", "Alta proteina", "Flexible", "Sin lactosa"];

export default async function MemberOnboardingPage() {
  const brand = await getSelectedMemberAppBrand();

  return (
    <>
      <Topbar
        eyebrow="Inicio"
        title={`Configura tu plan en ${brand.appName}.`}
        text="Completa tus datos base para que el equipo pueda ajustar entrenamiento, nutrición, seguimiento y comunicación."
      />
      <section className="grid">
        <article className="card span4">
          <ClipboardCheck color="var(--gold)" />
          <h2>Estado</h2>
          <ul className="list">
            <li className="row">Datos básicos <span className="tag">Pendiente</span></li>
            <li className="row">Preferencias <span className="tag">Pendiente</span></li>
            <li className="row">Revisión coach <span className="tag">Después</span></li>
          </ul>
        </article>

        <article className="card span8">
          <div className="sectionHeader">
            <div>
              <ShieldCheck color="var(--gold)" />
              <h2>Datos para preparar tu experiencia</h2>
              <p>Esta información ayuda a construir un plan útil desde el primer día.</p>
            </div>
            <span className="tag">Privado</span>
          </div>
          <form className="formGrid">
            <label>
              Nombre completo
              <input name="fullName" placeholder="Tu nombre" />
            </label>
            <label>
              Objetivo principal
              <select name="goal" defaultValue="">
                <option value="" disabled>Selecciona objetivo</option>
                {goalOptions.map((goal) => (
                  <option key={goal} value={goal}>{goal}</option>
                ))}
              </select>
            </label>
            <label>
              Altura
              <input name="height" placeholder="Ej. 178 cm" />
            </label>
            <label>
              Peso actual
              <input name="weight" placeholder="Ej. 82 kg" />
            </label>
            <label>
              Fecha de nacimiento
              <input name="birthDate" type="date" />
            </label>
            <label>
              Zona horaria
              <input name="timezone" placeholder="Europe/Madrid" />
            </label>
            <label className="spanFull">
              Lesiones o limitaciones
              <textarea name="injuries" placeholder="Rodilla, hombro, espalda, recuperación..." rows={3} />
            </label>
            <div className="formActions">
              <button className="btn primary" type="button">
                Guardar borrador <Save size={18} />
              </button>
            </div>
          </form>
        </article>

        <article className="card span4">
          <Dumbbell color="var(--gold)" />
          <h2>Entrenamiento</h2>
          <div className="tagCloud">
            {trainingOptions.map((option) => (
              <span className="tag" key={option}>{option}</span>
            ))}
          </div>
          <label>
            Días por semana
            <input min={1} max={7} name="daysPerWeek" placeholder="4" type="number" />
          </label>
        </article>

        <article className="card span4">
          <Apple color="var(--gold)" />
          <h2>Nutrición</h2>
          <div className="tagCloud">
            {nutritionOptions.map((option) => (
              <span className="tag" key={option}>{option}</span>
            ))}
          </div>
          <label>
            Comidas por día
            <input min={2} max={7} name="mealsPerDay" placeholder="4" type="number" />
          </label>
        </article>

        <article className="card span4">
          <Activity color="var(--gold)" />
          <h2>Seguimiento</h2>
          <ul className="list">
            <li className="row"><UserRound size={16} /> Check-in <span>Semanal</span></li>
            <li className="row">Fotos <span>Frontal/lateral/espalda</span></li>
            <li className="row">Hábitos <span>Agua, pasos, sueño</span></li>
          </ul>
        </article>
      </section>
    </>
  );
}
