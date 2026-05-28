import { Bell, Calculator, ClipboardCheck, Dumbbell, Globe, MessageCircle, Palette, Rocket, Settings } from "lucide-react";
import { Topbar } from "@/components/topbar";
import {
  appSettingDefinitions,
  consoleLogicCards,
  defaultMemberAppPages,
  mealGeneratorFields,
  notificationEvents,
  systemAreas,
  workoutGeneratorFields,
} from "@/lib/domain/platform-logic";
import { calculateNutritionTargets, splitCaloriesByMeal } from "@/lib/domain/nutrition-engine";
import { buildWorkoutBlueprint } from "@/lib/domain/workout-engine";

export default function SystemPage() {
  const nutritionExample = calculateNutritionTargets({
    gender: "male",
    age: 35,
    heightCm: 178,
    weightKg: 84,
    activityLevel: "moderate",
    goal: "fat_loss",
  });
  const workoutExample = buildWorkoutBlueprint({
    goals: ["hypertrophy", "fat_loss"],
    weeks: 4,
    daysPerWeek: 4,
    sessionMinutes: 60,
    experience: "intermediate",
    location: "gym",
    injuries: ["hombro"],
  });
  const mealSplit = splitCaloriesByMeal(4);
  const implementationSteps = [
    {
      title: "Agente asignado",
      text: "Un especialista guía al entrenador por la toma de requisitos, marca, oferta, contenidos y prioridades.",
      icon: MessageCircle,
    },
    {
      title: "Dominio personalizado",
      text: "Coordinamos la compra o conexión de su URL para que la app salga con dominio profesional.",
      icon: Globe,
    },
    {
      title: "Identidad visual",
      text: "Preparamos logo, colores, nombre de app, iconos, pantallas y estilo base según su marca.",
      icon: Palette,
    },
    {
      title: "Entrega operativa",
      text: "Configuramos módulos, cargamos contenido inicial, revisamos flujos y dejamos la app lista para vender.",
      icon: Rocket,
    },
  ];

  return (
    <>
      <Topbar
        eyebrow="Producto"
        title="Le creamos su app de entrenador, configurada a su gusto."
        text="El cliente habla con uno de nuestros agentes y nosotros coordinamos todo: dominio personalizado, logo, identidad visual, contenido inicial, programas, nutrición, pagos y lanzamiento."
      />
      <section className="grid">
        <article className="card span4">
          <p className="metric">
            Proyecto a medida
            <strong>Consultar con un agente</strong>
          </p>
          <p>
            Solicita una valoración personalizada escribiendo a{" "}
            <a href="mailto:contacto@performlabs.app">contacto@performlabs.app</a>.
          </p>
        </article>
        <article className="card span4">
          <p className="metric">
            Acompañamiento
            <strong>Agente asignado</strong>
          </p>
          <p>Un miembro de nuestro equipo coordina con el entrenador todos los detalles de la entrega.</p>
        </article>
        <article className="card span4">
          <p className="metric">
            Entrega inicial
            <strong>4 fases</strong>
          </p>
          <p>Reunión inicial, identidad, configuración de app y lanzamiento operativo.</p>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <ClipboardCheck color="var(--gold)" />
              <h2>Qué compra el cliente</h2>
              <p>Una app profesional de coaching fitness preparada por nuestro equipo, no una plantilla sin acompañamiento.</p>
            </div>
            <span className="tag">Servicio premium</span>
          </div>
          <div className="moduleGrid">
            {implementationSteps.map((step) => {
              const Icon = step.icon;
              return (
                <section className="moduleGroup" key={step.title}>
                  <div className="appCardHeader">
                    <Icon color="var(--gold)" />
                    <h3>{step.title}</h3>
                  </div>
                  <p>{step.text}</p>
                </section>
              );
            })}
          </div>
        </article>

        {consoleLogicCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="card span3" key={card.title}>
              <Icon color="var(--gold)" />
              <p className="metric">
                {card.title}
                <strong>{card.value}</strong>
              </p>
            </article>
          );
        })}

        <article className="card span12">
          <h2>Áreas del producto</h2>
          <div className="moduleGrid">
            {systemAreas.map((area) => {
              const Icon = area.icon;
              return (
                <section className="moduleGroup" key={area.title}>
                  <div className="appCardHeader">
                    <Icon color="var(--gold)" />
                    <h3>{area.title}</h3>
                  </div>
                  <ul className="list">
                    {area.modules.map((module) => (
                      <li className="row" key={module.key}>
                        <span>{module.title}</span>
                        <span className="tag">{module.phase}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </article>

        <article className="card span6">
          <Settings color="var(--gold)" />
          <h2>Configuración gestionada</h2>
          <p>Nuestro equipo adapta la experiencia para cada marca durante la implantación.</p>
          <ul className="list compactList">
            {appSettingDefinitions.slice(0, 10).map((setting) => (
              <li className="row" key={setting.key}>
                <span>{setting.label}</span>
                <span>{setting.group}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card span6">
          <Bell color="var(--gold)" />
          <h2>Eventos de comunicación</h2>
          <p>Email, push e in-app quedan definidos por evento y luego se editan por marca.</p>
          <ul className="list compactList">
            {notificationEvents.slice(0, 10).map((event) => (
              <li className="row" key={event.key}>
                <span>{event.title}</span>
                <span>{event.channels.join("/")}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card span6">
          <Calculator color="var(--gold)" />
          <h2>Motor nutricional base</h2>
          <p>Ejemplo calculado con una fórmula configurable por marca.</p>
          <ul className="list">
            <li className="row">BMR <strong>{nutritionExample.bmr}</strong></li>
            <li className="row">TDEE <strong>{nutritionExample.tdee}</strong></li>
            <li className="row">Calorias objetivo <strong>{nutritionExample.targetCalories}</strong></li>
            <li className="row">Macros <strong>{nutritionExample.proteinG}P / {nutritionExample.carbsG}C / {nutritionExample.fatG}G</strong></li>
            <li className="row">Split 4 comidas <strong>{mealSplit.map((value) => `${Math.round(value * 100)}%`).join(" / ")}</strong></li>
          </ul>
          <h3>Inputs del generador</h3>
          <div className="tagCloud">
            {mealGeneratorFields.map((field) => (
              <span className="tag" key={field.key}>{field.label}</span>
            ))}
          </div>
        </article>

        <article className="card span6">
          <Dumbbell color="var(--gold)" />
          <h2>Motor workout base</h2>
          <p>Blueprint de programa generado por reglas propias y listo para conectarse a ejercicios reales.</p>
          <ul className="list">
            <li className="row">Dias generados <strong>{workoutExample.length}</strong></li>
            <li className="row">Primer foco <strong>{workoutExample[0]?.focus}</strong></li>
            <li className="row">Bloques por dia <strong>{workoutExample[0]?.blocks.length}</strong></li>
            <li className="row">Paginas app base <strong>{defaultMemberAppPages.length}</strong></li>
          </ul>
          <h3>Inputs del generador</h3>
          <div className="tagCloud">
            {workoutGeneratorFields.map((field) => (
              <span className="tag" key={field.key}>{field.label}</span>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
