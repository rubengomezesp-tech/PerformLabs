import { Activity, Apple, CheckCircle2, ClipboardCheck, Dumbbell, Save, ShieldCheck, UserRound } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { saveMemberOnboardingAction } from "./actions";

const goalOptions = ["Definicion", "Volumen", "Recomposicion", "Rendimiento", "Salud"];
const trainingOptions = ["Gimnasio", "Casa", "Exterior", "Mixto"];
const nutritionOptions = ["Sin gluten", "Vegetariana", "Alta proteina", "Flexible", "Sin lactosa"];
const trainingDayOptions = [3, 4, 5, 6, 7];

export default async function MemberOnboardingPage() {
  const brand = await getSelectedMemberAppBrand();
  const onboardingSteps = [
    { label: "Datos", status: "Activo" },
    { label: "Preferencias", status: "Pendiente" },
    { label: "Revisión", status: "Coach" },
  ];

  return (
    <>
      <Topbar
        eyebrow="Inicio"
        title={`Configura tu plan en ${brand.appName}.`}
        text="Completa tus datos base para que el equipo pueda ajustar entrenamiento, nutrición, seguimiento y comunicación."
      />
      <form action={saveMemberOnboardingAction} className="grid">
        <input name="workspaceId" type="hidden" value={brand.id} />
        <article className="span12 onboardingHero">
          <div>
            <span className="eyebrow">Primer acceso</span>
            <h2>Deja listo tu perfil para que el equipo pueda personalizar tu plan.</h2>
            <p>Completa lo básico una vez. Después la app usa esta información para ajustar entrenamientos, comidas, check-ins y soporte.</p>
          </div>
          <div className="onboardingStepRail">
            {onboardingSteps.map((step, index) => (
              <span className="onboardingStep" key={step.label}>
                <b>{index + 1}</b>
                <strong>{step.label}</strong>
                <small>{step.status}</small>
              </span>
            ))}
          </div>
        </article>

        <article className="card span4 onboardingStatus motionCard">
          <ClipboardCheck color="var(--gold)" />
          <h2>Estado</h2>
          <ul className="list">
            <li className="row">Datos básicos <span className="tag">En curso</span></li>
            <li className="row">Preferencias <span className="tag">Pendiente</span></li>
            <li className="row">Revisión coach <span className="tag">Después</span></li>
          </ul>
          <div className="progressTrack" aria-label="Progreso de onboarding">
            <span style={{ width: "34%" }} />
          </div>
        </article>

        <article className="card span8 motionCard">
          <div className="sectionHeader">
            <div>
              <ShieldCheck color="var(--gold)" />
              <h2>Datos para preparar tu experiencia</h2>
              <p>Esta información ayuda a construir un plan útil desde el primer día.</p>
            </div>
            <span className="tag">Privado</span>
          </div>
          <div className="formGrid">
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
            <label>
              Entorno principal
              <select name="trainingLocation" defaultValue="gym">
                <option value="gym">Gimnasio</option>
                <option value="home">Casa</option>
                <option value="outdoor">Exterior</option>
              </select>
            </label>
            <label>
              Minutos por sesión
              <input name="sessionMinutes" defaultValue="60" min={30} max={150} type="number" />
            </label>
          </div>
        </article>

        <article className="card span4 preferenceCard motionCard">
          <Dumbbell color="var(--gold)" />
          <h2>Entrenamiento</h2>
          <div className="tagCloud">
            {trainingOptions.map((option) => (
              <span className="tag" key={option}>{option}</span>
            ))}
          </div>
          <label>
            Días por semana
            <select name="daysPerWeek" defaultValue="4">
              {trainingDayOptions.map((days) => (
                <option key={days} value={days}>{days} dias/semana</option>
              ))}
            </select>
          </label>
          <p className="muted">Tu coach preparará una fase de 3 meses según tu disponibilidad. Después se revisará con tus métricas y sensaciones.</p>
        </article>

        <article className="card span4 preferenceCard motionCard">
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

        <article className="card span4 preferenceCard motionCard">
          <Activity color="var(--gold)" />
          <h2>Seguimiento</h2>
          <ul className="list">
            <li className="row"><UserRound size={16} /> Check-in <span>Semanal</span></li>
            <li className="row">Fotos <span>Frontal/lateral/espalda</span></li>
            <li className="row">Hábitos <span>Agua, pasos, sueño</span></li>
          </ul>
        </article>

        <article className="card span12 privacyNote">
          <CheckCircle2 color="var(--green)" />
          <div>
            <strong>Tu información se usa para preparar tu experiencia dentro de {brand.name}.</strong>
            <p>El equipo la revisa antes de activar cambios de entrenamiento, nutrición o seguimiento.</p>
          </div>
          <button className="btn primary" type="submit">
            Guardar y preparar mi plan <Save size={18} />
          </button>
        </article>
      </form>
    </>
  );
}
