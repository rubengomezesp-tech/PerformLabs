import { Activity, Apple, CheckCircle2, ClipboardCheck, Dumbbell, Save, ShieldCheck, UserRound } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { saveMemberOnboardingAction } from "./actions";

const goalOptions = ["Definicion", "Volumen", "Recomposicion", "Rendimiento", "Salud"];
const trainingOptions = ["Gimnasio", "Casa", "Exterior"];
const experienceOptions = ["Principiante", "Intermedio", "Avanzado"];
const nutritionOptions = ["Flexible", "Alta proteina", "Vegetariana", "Sin gluten", "Sin lactosa"];
const trainingDayOptions = [3, 4, 5, 6, 7];

export default async function MemberOnboardingPage() {
  const brand = await getSelectedMemberAppBrand();
  const onboardingSteps = [
    { label: "Perfil", status: "Activo" },
    { label: "Plan", status: "Después" },
    { label: "Coach", status: "Revisión" },
  ];

  return (
    <>
      <Topbar
        eyebrow="Inicio"
        title={`Prepara tu plan en ${brand.appName}.`}
        text="Completa este briefing una vez para que tu coach pueda ajustar entrenamiento, comida, seguimiento y soporte desde el primer día."
      />
      <form action={saveMemberOnboardingAction} className="grid">
        <input name="workspaceId" type="hidden" value={brand.id} />
        <article className="span12 onboardingHero">
          <div>
            <span className="eyebrow">Primer acceso</span>
            <h2>Cuéntanos lo necesario para preparar una experiencia que puedas cumplir.</h2>
            <p>El objetivo es simple: saber qué puedes entrenar, cómo comes, qué limitaciones tienes y qué debe revisar tu coach.</p>
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
            <li className="row">Perfil corporal <span className="tag">Necesario</span></li>
            <li className="row">Entrenamiento <span className="tag">Necesario</span></li>
            <li className="row">Nutrición <span className="tag">Necesario</span></li>
          </ul>
          <div className="progressTrack" aria-label="Progreso de onboarding">
            <span style={{ width: "34%" }} />
          </div>
        </article>

        <article className="card span8 motionCard">
          <div className="sectionHeader">
            <div>
              <ShieldCheck color="var(--gold)" />
              <h2>Perfil y objetivo</h2>
              <p>Datos base para ajustar cargas, comida, revisiones y comunicación.</p>
            </div>
            <span className="tag">Privado</span>
          </div>
          <div className="formGrid profileBriefGrid">
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
              Sexo
              <select name="sex" defaultValue="">
                <option value="">Prefiero no decirlo</option>
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
              </select>
            </label>
            <label>
              Altura
              <input name="height" placeholder="Ej. 178" />
            </label>
            <label>
              Peso actual
              <input name="weight" placeholder="Ej. 82" />
            </label>
            <label>
              Fecha de nacimiento
              <input name="birthDate" type="date" />
            </label>
            <label>
              Zona horaria
              <input name="timezone" placeholder="Europe/Madrid" />
            </label>
            <label>
              Actividad diaria
              <select name="activityLevel" defaultValue="1.55">
                <option value="1.2">Trabajo sentado, poca actividad</option>
                <option value="1.375">Actividad ligera</option>
                <option value="1.55">Actividad media</option>
                <option value="1.725">Actividad alta</option>
                <option value="1.9">Atleta / muy activo</option>
              </select>
            </label>
            <label>
              Sueño medio
              <input name="sleepHours" placeholder="Ej. 7.5" />
            </label>
            <label>
              Pasos objetivo
              <input name="stepsTarget" defaultValue="8000" min={2000} max={30000} type="number" />
            </label>
            <label className="spanFull">
              Contexto importante
              <textarea name="notes" placeholder="Horarios, trabajo, estrés, viajes, preferencias del coach, cosas que te cuesta cumplir..." rows={3} />
            </label>
          </div>
        </article>

        <article className="card span6 preferenceCard motionCard">
          <Dumbbell color="var(--gold)" />
          <h2>Entrenamiento</h2>
          <div className="tagCloud">
            {trainingOptions.map((option) => (
              <span className="tag" key={option}>{option}</span>
            ))}
          </div>
          <div className="formGrid compactFormGrid">
            <label>
              Entorno principal
              <select name="trainingLocation" defaultValue="gym">
                <option value="gym">Gimnasio</option>
                <option value="home">Casa</option>
                <option value="outdoor">Exterior</option>
              </select>
            </label>
            <label>
              Nivel
              <select name="experienceLevel" defaultValue="Intermedio">
                {experienceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Días por semana
              <select name="daysPerWeek" defaultValue="4">
                {trainingDayOptions.map((days) => (
                  <option key={days} value={days}>{days} dias/semana</option>
                ))}
              </select>
            </label>
            <label>
              Minutos por sesión
              <input name="sessionMinutes" defaultValue="60" min={30} max={150} type="number" />
            </label>
            <label className="spanFull">
              Equipo disponible
              <textarea name="availableEquipment" placeholder="Máquinas, mancuernas, barra, poleas, bandas, bici, cinta..." rows={3} />
            </label>
            <label className="spanFull">
              Lesiones o limitaciones
              <textarea name="injuries" placeholder="Rodilla, hombro, espalda, recuperación, ejercicios que no puedes hacer..." rows={3} />
            </label>
            <label>
              Días preferidos
              <input name="preferredTrainingDays" placeholder="Lunes, miércoles, viernes..." />
            </label>
            <label>
              Cardio
              <select name="cardioPreference" defaultValue="Caminar">
                <option>Caminar</option>
                <option>Bici</option>
                <option>Cinta</option>
                <option>Escaleras</option>
                <option>Prefiero mínimo cardio</option>
              </select>
            </label>
          </div>
        </article>

        <article className="card span6 preferenceCard motionCard">
          <Apple color="var(--gold)" />
          <h2>Nutrición</h2>
          <div className="tagCloud">
            {nutritionOptions.map((option) => (
              <span className="tag" key={option}>{option}</span>
            ))}
          </div>
          <div className="formGrid compactFormGrid">
            <label>
              Estilo de dieta
              <select name="dietStyle" defaultValue="Flexible">
                {nutritionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Comidas por día
              <input min={3} max={6} name="mealsPerDay" defaultValue="4" type="number" />
            </label>
            <label>
              Tiempo para cocinar
              <input min={5} max={180} name="cookingTimeMinutes" defaultValue="20" type="number" />
            </label>
            <label>
              Presupuesto
              <select name="budgetLevel" defaultValue="Medio">
                <option>Bajo</option>
                <option>Medio</option>
                <option>Alto</option>
              </select>
            </label>
            <label className="spanFull">
              Alergias o restricciones
              <textarea name="allergies" placeholder="Frutos secos, lactosa, gluten, marisco..." rows={2} />
            </label>
            <label className="spanFull">
              Comidas que te gustan
              <textarea name="preferredFoods" placeholder="Pollo, arroz, yogur, tortilla, pasta, salmón..." rows={2} />
            </label>
            <label className="spanFull">
              Comidas que no quieres
              <textarea name="dislikedFoods" placeholder="Atún, brócoli, legumbres, picante..." rows={2} />
            </label>
            <label className="toggleRow spanFull">
              <input name="hideMacros" type="checkbox" />
              <span>Prefiero ver comidas y hábitos sin números de macros.</span>
            </label>
          </div>
        </article>

        <article className="card span12 preferenceCard motionCard">
          <Activity color="var(--gold)" />
          <div className="sectionHeader">
            <div>
              <h2>Qué pasa después</h2>
              <p>Con este briefing tu coach recibe una propuesta interna de entrenamiento, comida y puntos de revisión antes de publicar tu plan.</p>
            </div>
            <span className="tag">Revisión inicial</span>
          </div>
          <div className="onboardingOutcomeGrid">
            <span><UserRound size={16} /> Perfil completo</span>
            <span><Dumbbell size={16} /> Rutina según días disponibles</span>
            <span><Apple size={16} /> Comidas según objetivo y preferencias</span>
            <span><Activity size={16} /> Seguimiento de hábitos y progreso</span>
          </div>
        </article>

        <article className="card span12 privacyNote">
          <CheckCircle2 color="var(--green)" />
          <div>
            <strong>Tu información se usa para preparar tu experiencia dentro de {brand.name}.</strong>
            <p>El coach la revisa antes de activar entrenamiento, nutrición o seguimiento en tu app.</p>
          </div>
          <button className="btn primary" type="submit">
            Enviar briefing al coach <Save size={18} />
          </button>
        </article>
      </form>
    </>
  );
}
