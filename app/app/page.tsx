import { ArrowRight, Bell, Camera, Check, ChevronRight, Droplets, Dumbbell, Footprints, Moon, Play, Soup, TrendingUp } from "lucide-react";
import Link from "next/link";
import { AnimatedNumber, Badge, Button, Card, ProgressRing } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listWorkspaceProducts } from "@/lib/repositories/member-experience";
import { getMemberTrainingContext } from "@/lib/repositories/member-onboarding";
import { getMemberMealPlanForToday } from "@/lib/repositories/nutrition-tracking";

export default async function MemberDashboard() {
  const brand = await getSelectedMemberAppBrand();
  const [products, trainingContext, mealPlan] = await Promise.all([
    listWorkspaceProducts(brand.id),
    getMemberTrainingContext(brand.id),
    getMemberMealPlanForToday(brand.id),
  ]);
  const activeDay = trainingContext.activeAssignment ? trainingContext.activeAssignedDay : null;
  const hasNutrition = Boolean(mealPlan?.items.length);
  const todayPlan = [
    {
      icon: Dumbbell,
      label: activeDay?.title ?? "Entreno en revisión",
      detail: activeDay ? `${activeDay.estimatedMinutes ?? 60} min · ${activeDay.exercises.length} ejercicios` : "El coach lo publicará al aprobar tu briefing",
      href: activeDay ? "/app/workouts" : "/app/onboarding",
    },
    {
      icon: Soup,
      label: mealPlan?.items[0]?.title ?? "Nutrición en revisión",
      detail: hasNutrition ? `${mealPlan?.items.length} comidas planificadas hoy` : "Sin comidas genéricas hasta aprobación",
      href: hasNutrition ? "/app/meals" : "/app/onboarding",
    },
    { icon: Camera, label: "Check-in semanal", detail: "Fotos, peso y sensaciones", href: "/app/progress" },
  ];

  return (
    <>
      <Topbar
        eyebrow="Panel de miembro"
        title={`Bienvenido a ${brand.appName}.`}
        text={`Tu espacio de ${brand.name}: entrenamiento, nutrición, progreso y soporte en una sola experiencia.`}
      />
      <section className="grid">
        <article className="span8 memberHeroCard">
          <div className="memberHero">
            <div>
              <span className="eyebrow">{brand.appName}</span>
              <h1>{activeDay ? "Tu siguiente sesión está lista." : "Tu coach está preparando tu plan."}</h1>
              <p>{activeDay || hasNutrition ? `${brand.name} reúne tu entrenamiento, comidas, progreso y soporte para que solo tengas que ejecutar el plan de hoy.` : "Completa tu briefing inicial y el coach activará tu entrenamiento y nutrición cuando estén revisados."}</p>
              <div className="actions">
                <Button variant="primary" href={activeDay ? "/app/workouts" : "/app/onboarding"}>
                  {activeDay ? "Empezar entreno" : "Completar briefing"} <Play size={18} />
                </Button>
                <Button href="/app/onboarding">
                  Revisar inicio <ArrowRight size={18} />
                </Button>
              </div>
            </div>
            <div className="memberRings">
              <ProgressRing
                value={activeDay || hasNutrition ? 86 : 0}
                label="Adherencia"
                sublabel="esta semana"
                tone="accent"
              />
              <ProgressRing
                value={trainingContext.activeAssignment ? (trainingContext.activeAssignment.currentWeek / 12) * 100 : 0}
                display={trainingContext.activeAssignment ? `S${trainingContext.activeAssignment.currentWeek}` : "—"}
                label="Plan"
                sublabel="de 12 semanas"
                tone="success"
              />
              <ProgressRing
                value={activeDay || hasNutrition ? 67 : 0}
                label="Hábitos"
                sublabel="hoy"
                tone="warning"
              />
            </div>
            <div className="memberHeroSignal">
              <Badge>{activeDay || hasNutrition ? "Plan activo" : "Revisión del coach"}</Badge>
              <strong>{trainingContext.activeAssignment?.name ?? mealPlan?.planName ?? "Briefing inicial"}</strong>
              <p>{activeDay || hasNutrition ? "Entreno, nutrición y check-ins sincronizados con tu coach." : "Sin rutinas ni comidas genéricas antes de aprobación."}</p>
            </div>
          </div>
        </article>

        <Card span={4} className="memberProgressCard motionCard">
          <TrendingUp color="var(--accent)" />
          <h2>Mi recorrido</h2>
          <div className="progressTrack" aria-label="Progreso semanal">
            <span style={{ width: "68%" }} />
          </div>
          <div className="memberStatsGrid">
            <span>Foto <strong>Pendiente</strong></span>
            <span>Peso <strong><AnimatedNumber value={54} decimals={1} suffix=" kg" /></strong></span>
            <span>Grasa <strong><AnimatedNumber value={16} suffix="%" /></strong></span>
          </div>
          <Button variant="primary" href="/app/progress" className="fullWidth">
            Registrar progreso <Camera size={18} />
          </Button>
        </Card>

        <Card span={7} className="memberTodayCard motionCard">
          <div className="sectionHeader">
            <div>
              <h2>Hoy</h2>
              <p>Lo importante aparece primero para que no tengas que buscar dentro de la app.</p>
            </div>
            <Badge>3 acciones</Badge>
          </div>
          <div className="memberActionList">
            {todayPlan.map((item) => {
              const Icon = item.icon;
              return (
                <Link className="memberAction" href={item.href} key={item.label}>
                  <span className="memberActionIcon"><Icon size={18} /></span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <ChevronRight size={18} />
                </Link>
              );
            })}
          </div>
        </Card>

        <Card span={5} className="motionCard">
          <h2>Hábitos de hoy</h2>
          <ul className="list">
            <li className="row"><Droplets size={18} /> Beber 2 litros de agua <Check color="var(--success)" /></li>
            <li className="row"><Footprints size={18} /> Caminar 30 minutos <Badge>Abrir</Badge></li>
            <li className="row"><Moon size={18} /> Dormir 8 horas <Badge>Noche</Badge></li>
          </ul>
        </Card>

        <Card span={5} className="motionCard memberAlertCard">
          <Bell color="var(--accent)" />
          <h2>Avisos del coach</h2>
          <p>Los cambios importantes aparecen aquí para que no se pierdan entre chats o emails.</p>
          <ul className="list compactList">
            <li className="row">Revisión semanal <Badge>Viernes</Badge></li>
            <li className="row">Recordatorio entreno <Badge>10:00</Badge></li>
          </ul>
        </Card>

        <Card span={6} className="memberCoachCard motionCard">
          <h2>Revisión del plan</h2>
          <p>
            Tras completar el check-in, el coach revisa medidas, fotos y sensaciones.
            Si hay algo concreto que no puedes cumplir, avisa desde esa comida o ejercicio.
          </p>
          <div className="actions">
            <Button href="/app/onboarding">Completar inicio</Button>
            <Button href="/app/progress">Enviar check-in</Button>
          </div>
        </Card>
        {products.map((product) => (
          <Card span={6} className="memberProgramCard motionCard" key={product.id}>
            <Badge>Programa</Badge>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <div className="tagCloud">
              {product.includedModules.map((module) => (
                <Badge key={module}>{module}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </section>
    </>
  );
}
