import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronRight,
  CircleHelp,
  Droplets,
  Drumstick,
  Dumbbell,
  Flame,
  Footprints,
  MessageSquare,
  Moon,
  Soup,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { PushOptIn } from "@/components/push-optin";
import { Button } from "@/components/ui";
import { getMemberContext } from "@/lib/auth/member-access";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listUnreadMemberNotifications } from "@/lib/repositories/member-notifications";
import { dismissMemberNotificationAction } from "@/app/app/(gated)/progress/actions";
import { getMemberTrainingContext } from "@/lib/repositories/member-onboarding";
import { getMemberMealPlanForToday } from "@/lib/repositories/nutrition-tracking";
import { getMemberHabitDay } from "@/lib/repositories/habit-tracking";
import { listMemberPersonalTrainingSessions } from "@/lib/repositories/personal-training-sessions";
import { toggleHabitAction } from "@/app/app/(gated)/habits/actions";

const HABIT_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  droplets: Droplets,
  footprints: Footprints,
  moon: Moon,
  drumstick: Drumstick,
  dumbbell: Dumbbell,
  check: Check,
};

function calendarDay(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function nextWeeklyCheckin(nextReviewOn?: string | null) {
  const today = new Date();
  const explicit = calendarDay(nextReviewOn);
  const date = explicit ?? new Date(today);
  if (!explicit) {
    const daysUntilSunday = (7 - today.getDay()) % 7;
    date.setDate(today.getDate() + daysUntilSunday);
  }
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysUntil = Math.max(0, Math.round((startTarget.getTime() - startToday.getTime()) / 86_400_000));
  const relative = daysUntil === 0 ? "Hoy" : daysUntil === 1 ? "Mañana" : `En ${daysUntil} días`;
  const label = date.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
  return { relative, label };
}

export default async function MemberDashboard() {
  const brand = await getSelectedMemberAppBrand();
  const [member, trainingContext, mealPlan, habitDay, personalSessions, notifications] = await Promise.all([
    getMemberContext(brand.id),
    getMemberTrainingContext(brand.id),
    getMemberMealPlanForToday(brand.id),
    getMemberHabitDay(brand.id),
    listMemberPersonalTrainingSessions(brand.id, 20),
    listUnreadMemberNotifications(brand.id, 3),
  ]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const activeDay = trainingContext.activeAssignment ? trainingContext.activeAssignedDay : null;
  const assignment = trainingContext.activeAssignment;
  const hasNutrition = Boolean(mealPlan?.items.length);
  const currentWeek = assignment?.currentWeek ?? null;
  const weekPct = currentWeek ? Math.min(100, Math.round((currentWeek / 12) * 100)) : 0;
  const checkin = nextWeeklyCheckin(assignment?.nextReviewOn);
  const firstName = member?.fullName.trim().split(/\s+/)[0] ?? "";
  const greeting = now.getHours() < 12 ? "Buenos días" : now.getHours() < 20 ? "Buenas tardes" : "Buenas noches";
  const longDate = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const nextPersonalSession = personalSessions.find((session) => session.status === "scheduled" && new Date(session.endsAt).getTime() >= now.getTime()) ?? null;

  const primary = activeDay
    ? {
        state: "Listo para empezar",
        title: activeDay.title || "Entrenamiento de hoy",
        description: `${activeDay.estimatedMinutes ?? 60} min · ${activeDay.exercises.length} ejercicios preparados por tu coach.`,
        href: "/app/workouts",
        action: "Empezar entrenamiento",
      }
    : assignment
      ? {
          state: "Plan al día",
          title: `Semana ${assignment.currentWeek} de tu programa`,
          description: "Revisa tus próximas sesiones y continúa donde lo dejaste.",
          href: "/app/workouts",
          action: "Ver mi semana",
        }
      : {
          state: "En preparación",
          title: "Tu coach está preparando el plan",
          description: "Valoración recibida ✓ · Tu coach revisa y publica entrenamiento y nutrición · Te avisaremos aquí en cuanto esté listo.",
          href: "/app/progress?tab=medidas",
          action: "Mientras tanto: envía tu punto de partida",
        };

  return (
    <div className="memberCommandPage">
      <header className="memberCommandIntro">
        <div>
          <span className="memberCommandDate">{longDate}</span>
          <h1>{greeting}{firstName ? `, ${firstName}` : ""}</h1>
          <p>{activeDay ? "Tu sesión está lista. Empieza por aquí." : assignment ? "Todo lo importante de hoy, sin buscar por la app." : "Tu plan está en marcha. Aquí verás el siguiente paso en cuanto esté listo."}</p>
        </div>
        <Link className="memberCoachShortcut" href="/app/support">
          <MessageSquare size={17} /> Hablar con mi coach
        </Link>
      </header>

      {notifications.items.length ? (
        <section className="memberNotificationsInbox" aria-label="Avisos de tu coach">
          {notifications.items.map((notification) => (
            <article className="memberNotificationRow" key={notification.id}>
              <Link href={notification.url} className="memberNotificationBody">
                <strong>{notification.title}</strong>
                {notification.body ? <p>{notification.body}</p> : null}
              </Link>
              <form action={dismissMemberNotificationAction}>
                <input name="workspaceId" type="hidden" value={brand.id} />
                <input name="notificationId" type="hidden" value={notification.id} />
                <button aria-label="Marcar aviso como leído" className="memberNotificationDismiss" type="submit">
                  <Check size={15} />
                </button>
              </form>
            </article>
          ))}
          {notifications.total > notifications.items.length ? (
            <p className="muted">Y {notifications.total - notifications.items.length} aviso(s) más.</p>
          ) : null}
        </section>
      ) : null}

      <div className="memberCommandLayout">
        <section className="memberTodayBoard" aria-labelledby="today-heading">
          <header className="memberBoardHeader">
            <div>
              <span className="memberSectionLabel">Tu ruta de hoy</span>
              <h2 id="today-heading">Ahora</h2>
            </div>
            <span className="memberBoardStatus"><i /> {primary.state}</span>
          </header>

          <article className="memberPrimaryAction">
            <span className="memberPrimaryIndex">01</span>
            <div className="memberPrimaryIcon"><Dumbbell size={24} /></div>
            <div className="memberPrimaryCopy">
              <span>Entrenamiento</span>
              <h3>{primary.title}</h3>
              <p>{primary.description}</p>
            </div>
            <Button variant="primary" href={primary.href} className="memberPrimaryButton">
              {primary.action} <ArrowRight size={17} />
            </Button>
          </article>

          <div className="memberNextLabel"><span>Después</span><i /></div>

          <Link className="memberRouteRow" href={hasNutrition ? "/app/meals" : "/app/onboarding"}>
            <span className="memberRouteIndex">02</span>
            <span className="memberRouteIcon"><Soup size={19} /></span>
            <span className="memberRouteCopy">
              <strong>{hasNutrition ? "Comidas de hoy" : "Nutrición en revisión"}</strong>
              <small>{hasNutrition ? `${mealPlan?.items.length} comidas organizadas` : "Tu coach la publicará al terminar la revisión"}</small>
            </span>
            <span className={hasNutrition ? "memberRouteState ready" : "memberRouteState"}>{hasNutrition ? "Ver plan" : "Pendiente"}</span>
            <ChevronRight size={17} aria-hidden="true" />
          </Link>

          <div className="memberHabitRoute">
            <div className="memberHabitRouteHead">
              <span className="memberRouteIndex">03</span>
              <span className="memberRouteIcon"><Flame size={19} /></span>
              <span className="memberRouteCopy">
                <strong>Hábitos</strong>
                <small>{habitDay.hasHabits ? `${habitDay.completedToday} de ${habitDay.habits.length} completados` : "Activa tu lista diaria"}</small>
              </span>
              {habitDay.streak > 0 ? <span className="memberStreak"><Flame size={13} /> {habitDay.streak} días</span> : null}
            </div>
            {habitDay.hasHabits ? (
              <ul className="memberHabitChecks">
                {habitDay.habits.map((habit) => {
                  const Icon = HABIT_ICONS[habit.icon] ?? Check;
                  return (
                    <li key={habit.id} className={habit.done ? "is-done" : undefined}>
                      <span><Icon size={15} /> {habit.name}</span>
                      <form action={toggleHabitAction}>
                        <input name="workspaceId" type="hidden" value={brand.id} />
                        <input name="habitId" type="hidden" value={habit.id} />
                        <input name="date" type="hidden" value={today} />
                        <button type="submit" aria-label={habit.done ? `Desmarcar ${habit.name}` : `Marcar ${habit.name}`}><Check size={14} /></button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Link className="memberInlineAction" href="/app/habits">Activar hábitos <ArrowRight size={15} /></Link>
            )}
          </div>
        </section>

        <aside className="memberCommandAside" aria-label="Resumen de tu programa">
          <section className="memberSnapshotCard">
            <span className="memberSectionLabel">Tu programa</span>
            <div className="memberSnapshotTop">
              <strong>{currentWeek ? `Semana ${currentWeek}` : "Preparando"}</strong>
              <span>{weekPct}%</span>
            </div>
            <div className="memberSnapshotTrack" role="progressbar" aria-label="Progreso del programa" aria-valuemin={0} aria-valuemax={100} aria-valuenow={weekPct}>
              <i style={{ width: `${weekPct}%` }} />
            </div>
            <p>{assignment?.name || "Tu plan personalizado"}</p>
            <Link href="/app/workouts">Ver programa <ChevronRight size={15} /></Link>
          </section>

          <Link className="memberReviewCard" href="/app/progress">
            <span className="memberReviewIcon"><CalendarClock size={20} /></span>
            <span>
              <small>Próximo check-in</small>
              <strong>{checkin.relative}</strong>
              <em>{checkin.label}</em>
            </span>
            <ChevronRight size={18} />
          </Link>

          {nextPersonalSession ? (
            <Link className="memberReviewCard memberPersonalSessionCard" href="/app/sessions">
              <span className="memberReviewIcon"><Dumbbell size={20} /></span>
              <span>
                <small>Próximo entrenamiento personal</small>
                <strong>{new Intl.DateTimeFormat("es-ES", { timeZone: nextPersonalSession.timezone, weekday: "short", day: "numeric", month: "short" }).format(new Date(nextPersonalSession.startsAt))}</strong>
                <em>{new Intl.DateTimeFormat("es-ES", { timeZone: nextPersonalSession.timezone, hour: "numeric", minute: "2-digit" }).format(new Date(nextPersonalSession.startsAt))}{nextPersonalSession.location ? ` · ${nextPersonalSession.location}` : ""}</em>
              </span>
              <ChevronRight size={18} />
            </Link>
          ) : null}

          <section className="memberHelpCard">
            <span><Sparkles size={18} /></span>
            <div>
              <strong>¿No sabes qué hacer?</strong>
              <p>Escribe a tu coach y recibe una respuesta dentro de la app.</p>
              <Link href="/app/support">Abrir mensajes <ArrowRight size={15} /></Link>
            </div>
          </section>
        </aside>
      </div>

      <div className="memberCommandUtility">
        <CircleHelp size={16} />
        <span>¿Buscas alimentos, suplementos, guías o comunidad? Están dentro de <strong>Más</strong> en el menú.</span>
      </div>
      <PushOptIn />
    </div>
  );
}
