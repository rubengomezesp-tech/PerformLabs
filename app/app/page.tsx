import { Activity, ArrowRight, CalendarClock, Camera, Check, ChevronRight, Droplets, Drumstick, Dumbbell, Flame, Footprints, Moon, Soup } from "lucide-react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { PushOptIn } from "@/components/push-optin";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listWorkspaceProducts } from "@/lib/repositories/member-experience";
import { getMemberTrainingContext } from "@/lib/repositories/member-onboarding";
import { getMemberMealPlanForToday } from "@/lib/repositories/nutrition-tracking";
import { getMemberHabitDay } from "@/lib/repositories/habit-tracking";
import { toggleHabitAction } from "@/app/app/habits/actions";

const HABIT_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  droplets: Droplets,
  footprints: Footprints,
  moon: Moon,
  drumstick: Drumstick,
  dumbbell: Dumbbell,
  activity: Activity,
  check: Check,
};

function nextWeeklyCheckin() {
  const today = new Date();
  const daysUntil = (7 - today.getDay()) % 7; // weekly cadence, Sundays
  const date = new Date(today);
  date.setDate(today.getDate() + daysUntil);
  const relative = daysUntil === 0 ? "hoy" : daysUntil === 1 ? "mañana" : `en ${daysUntil} días`;
  const label = date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  return { relative, label };
}

export default async function MemberDashboard() {
  const brand = await getSelectedMemberAppBrand();
  const [products, trainingContext, mealPlan, habitDay] = await Promise.all([
    listWorkspaceProducts(brand.id),
    getMemberTrainingContext(brand.id),
    getMemberMealPlanForToday(brand.id),
    getMemberHabitDay(brand.id),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const activeDay = trainingContext.activeAssignment ? trainingContext.activeAssignedDay : null;
  const hasNutrition = Boolean(mealPlan?.items.length);
  const currentWeek = trainingContext.activeAssignment?.currentWeek ?? null;
  const weekPct = currentWeek ? Math.min(100, Math.round((currentWeek / 12) * 100)) : 0;
  const checkin = nextWeeklyCheckin();

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
        eyebrow="Panel"
        title={`Bienvenido a ${brand.name}.`}
        text={brand.welcomeMessage || `Tu espacio de ${brand.name}: entrenamiento, nutrición, progreso y soporte en una sola experiencia.`}
      />
      <section className="grid">
        <PushOptIn />
        <Card span={12} className="motionCard miRecorridoCard">
          <div className="sectionHeader">
            <div>
              <h2>Mi Recorrido</h2>
              <p>Tu plan, tu progreso, tu mejor versión.</p>
            </div>
            <span className="tag">{currentWeek ? `Semana ${currentWeek} de 12` : "En preparación"}</span>
          </div>
          <div className="progressTrack" aria-label="Progreso del programa">
            <span style={{ width: `${weekPct}%` }} />
          </div>
          <div className="miRecorridoMeta">
            <span>{currentWeek ? `Semana ${currentWeek} de 12` : "Tu coach está activando tu plan"}</span>
            <strong>{weekPct}%</strong>
          </div>
        </Card>

        <Card span={6} className="motionCard panelHabitsCard">
          <div className="sectionHeader">
            <div>
              <Flame color="var(--accent)" />
              <h2>Hábitos de hoy</h2>
            </div>
            {habitDay.hasHabits ? <span className="tag">{habitDay.completedToday}/{habitDay.habits.length} completados</span> : null}
          </div>
          {habitDay.hasHabits ? (
            <ul className="list panelHabitList">
              {habitDay.habits.map((habit) => {
                const Icon = HABIT_ICONS[habit.icon] ?? Check;
                return (
                  <li className="row panelHabitRow" key={habit.id}>
                    <span className="panelHabitName"><Icon size={17} /> {habit.name}</span>
                    <form action={toggleHabitAction}>
                      <input name="workspaceId" type="hidden" value={brand.id} />
                      <input name="habitId" type="hidden" value={habit.id} />
                      <input name="date" type="hidden" value={today} />
                      <button className={habit.done ? "panelHabitCheck done" : "panelHabitCheck"} type="submit" aria-label={habit.done ? "Desmarcar" : "Marcar"}>
                        <Check size={15} />
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          ) : (
            <>
              <p>Activa unos hábitos y márcalos cada día para mantener tu racha.</p>
              <Button variant="primary" href="/app/habits" className="fullWidth">Activar hábitos <ArrowRight size={16} /></Button>
            </>
          )}
        </Card>

        <Link href="/app/progress" className="card span6 motionCard panelCheckinCard">
          <div>
            <span className="eyebrow">Actualización de plan</span>
            <h2>Tu próximo check-in es {checkin.relative}.</h2>
            <p><CalendarClock size={15} /> {checkin.label}</p>
          </div>
          <ChevronRight size={20} />
        </Link>

        <Card span={12} className="memberTodayCard motionCard">
          <div className="sectionHeader">
            <div>
              <h2>Hoy</h2>
              <p>Lo importante primero, sin buscar dentro de la app.</p>
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
