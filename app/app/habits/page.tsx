import { Activity, Check, Drumstick, Dumbbell, Droplets, Flame, Footprints, Moon, Plus, Sparkles, X } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getMemberHabitDay, SUGGESTED_HABITS } from "@/lib/repositories/habit-tracking";
import { activateSuggestedHabitsAction, archiveHabitAction, createHabitAction, toggleHabitAction } from "./actions";

export const dynamic = "force-dynamic";

const HABIT_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  droplets: Droplets,
  footprints: Footprints,
  moon: Moon,
  drumstick: Drumstick,
  dumbbell: Dumbbell,
  activity: Activity,
  check: Check,
};

export default async function MemberHabitsPage() {
  const brand = await getSelectedMemberAppBrand();
  const day = await getMemberHabitDay(brand.id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Topbar
        eyebrow="Hábitos"
        title="Tus hábitos del día."
        text="Las pequeñas acciones que sostienen tu progreso. Marca lo que cumplas y mantén viva tu racha."
      />
      <section className="grid">
        {day.hasHabits ? (
          <>
            <article className="card span12 habitStreakCard uiGlass uiSheen">
              <div className="habitStreak">
                <span className="habitStreakFlame"><Flame size={26} color="var(--accent)" /></span>
                <div>
                  <strong>{day.streak}</strong>
                  <small>{day.streak === 1 ? "día de racha" : "días de racha"}</small>
                </div>
              </div>
              <div className="habitStreakMeta">
                <span>Hoy <strong>{day.completedToday}/{day.habits.length}</strong></span>
                <div className="macroCalorieTrack">
                  <span style={{ width: `${day.habits.length ? Math.round((day.completedToday / day.habits.length) * 100) : 0}%` }} />
                </div>
              </div>
            </article>

            <div className="span12 habitGrid">
              {day.habits.map((habit, idx) => {
                const Icon = HABIT_ICONS[habit.icon] ?? Check;
                return (
                  <article className={`${habit.done ? "habitCard done" : "habitCard"} uiFadeUp`} style={{ ["--i" as string]: idx }} key={habit.id}>
                    <form action={toggleHabitAction} className="habitToggleForm">
                      <input name="workspaceId" type="hidden" value={brand.id} />
                      <input name="habitId" type="hidden" value={habit.id} />
                      <input name="date" type="hidden" value={today} />
                      <button className="habitToggle" type="submit" aria-label={habit.done ? "Desmarcar" : "Marcar como hecho"}>
                        <span className="habitToggleIcon">{habit.done ? <Check size={18} /> : <Icon size={18} />}</span>
                        <span className="habitToggleName">{habit.name}</span>
                      </button>
                    </form>
                    <form action={archiveHabitAction} className="habitArchiveForm">
                      <input name="workspaceId" type="hidden" value={brand.id} />
                      <input name="habitId" type="hidden" value={habit.id} />
                      <button className="habitArchive" type="submit" aria-label="Quitar hábito" title="Quitar hábito"><X size={14} /></button>
                    </form>
                  </article>
                );
              })}
            </div>

            <article className="card span12 habitAddCard">
              <form action={createHabitAction} className="habitAddForm">
                <input name="workspaceId" type="hidden" value={brand.id} />
                <input name="name" placeholder="Nuevo hábito (ej. Meditar 5 min)" required />
                <button className="btn" type="submit"><Plus size={16} /> Añadir</button>
              </form>
            </article>
          </>
        ) : (
          <article className="card span12 habitEmptyCard uiGlass uiSheen">
            <span className="uiIconChip" style={{ width: 52, height: 52, borderRadius: 16 }}><Sparkles size={26} /></span>
            <h2>Empieza con unos hábitos sencillos.</h2>
            <p>Activa esta selección y empieza a marcarlos cada día. Podrás quitar los que no encajen y añadir los tuyos.</p>
            <ul className="habitSuggestList">
              {SUGGESTED_HABITS.map((habit) => {
                const Icon = HABIT_ICONS[habit.icon] ?? Check;
                return (
                  <li key={habit.name}><Icon size={16} color="var(--accent)" /> {habit.name}</li>
                );
              })}
            </ul>
            <form action={activateSuggestedHabitsAction}>
              <input name="workspaceId" type="hidden" value={brand.id} />
              <button className="btn primary" type="submit"><Sparkles size={16} /> Activar hábitos sugeridos</button>
            </form>
          </article>
        )}
      </section>
    </>
  );
}
