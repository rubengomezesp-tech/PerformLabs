import { CalendarHeart, CalendarRange, Droplet, Plus, Sparkles, Trash2 } from "lucide-react";
import { DAY_MS } from "@/lib/utils/dates";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getCycleOverview, type CycleLogEntry } from "@/lib/repositories/cycle-tracking";
import { deleteCycleLogAction, saveCycleLogAction } from "./actions";

export const dynamic = "force-dynamic";

const SYMPTOM_OPTIONS = ["Calambres", "Cansancio", "Hinchazón", "Dolor de cabeza", "Cambios de humor", "Antojos"];

const FLOW_LABELS: Record<string, string> = { light: "Ligero", medium: "Medio", heavy: "Abundante" };
const ENTRY_LABELS: Record<string, string> = {
  period_start: "Inicio de regla",
  spotting: "Manchado",
  symptom: "Síntomas",
};

function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

function entryIcon(entry: CycleLogEntry) {
  if (entry.entryType === "period_start") return <CalendarHeart size={16} color="var(--gold)" />;
  if (entry.entryType === "spotting") return <Droplet size={16} color="var(--gold)" />;
  return <Sparkles size={16} color="var(--gold)" />;
}

export default async function MemberCyclePage() {
  const brand = await getSelectedMemberAppBrand();
  const overview = await getCycleOverview(brand.id);

  const todayStr = new Date().toISOString().slice(0, 10);
  const daysUntilNext = overview.nextPredictedStart
    ? Math.round((new Date(`${overview.nextPredictedStart}T00:00:00.000Z`).getTime() - new Date(`${todayStr}T00:00:00.000Z`).getTime()) / DAY_MS)
    : null;

  return (
    <>
      <Topbar
        eyebrow="Ciclo"
        title="Tu seguimiento del ciclo."
        text="Registra tu regla, el flujo y los síntomas. Te ayudamos a anticipar el próximo ciclo y a darle contexto a tu entrenamiento y nutrición."
      />

      <section className="grid">
        <article className="span12 cycleHero uiGlass uiSheen">
          <div className="cycleHeroStat">
            <span className="eyebrow">Última regla</span>
            <strong>{overview.lastPeriodStart ? formatDate(overview.lastPeriodStart) : "Sin registro"}</strong>
            <p>{overview.lastPeriodStart ? "Marcada como día 1 de tu ciclo." : "Registra tu primer día para empezar."}</p>
          </div>
          <div className="cycleHeroStat">
            <span className="eyebrow">Ciclo medio</span>
            <strong>{overview.averageCycleLength ? `${overview.averageCycleLength} días` : "·"}</strong>
            <p>{overview.averageCycleLength ? "Media de tus últimos ciclos." : "Necesitamos 2 reglas para calcularlo."}</p>
          </div>
          <div className="cycleHeroStat cycleHeroPredict">
            <span className="eyebrow">Próxima estimada</span>
            <strong>{overview.nextPredictedStart ? formatDate(overview.nextPredictedStart) : "·"}</strong>
            <p>{daysUntilNext !== null ? (daysUntilNext >= 0 ? `En ~${daysUntilNext} días` : "Estimación pasada, registra tu regla") : "Estimación cuando tengamos historial."}</p>
          </div>
        </article>

        <article className="card span5 cycleLogCard uiFadeUp" style={{ ["--i" as string]: 0 }}>
          <div className="sectionHeader">
            <div>
              <CalendarHeart color="var(--gold)" size={26} />
              <h2>Registrar hoy</h2>
              <p>Treinta segundos. Un registro por día — si ya hay uno para esa fecha, se actualiza.</p>
            </div>
          </div>
          <form action={saveCycleLogAction} className="cycleForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label>Fecha<input name="date" type="date" defaultValue={todayStr} max={todayStr} /></label>
            <label>Tipo de registro
              <select name="entryType" defaultValue="period_start">
                <option value="period_start">Inicio de regla (día 1)</option>
                <option value="spotting">Manchado</option>
                <option value="symptom">Solo síntomas</option>
              </select>
            </label>
            <label>Flujo
              <select name="flow" defaultValue="">
                <option value="">Sin especificar</option>
                <option value="light">Ligero</option>
                <option value="medium">Medio</option>
                <option value="heavy">Abundante</option>
              </select>
            </label>
            <fieldset className="cycleSymptoms">
              <legend>Síntomas</legend>
              <div className="cycleSymptomGrid">
                {SYMPTOM_OPTIONS.map((symptom) => (
                  <label className="cycleSymptomChip" key={symptom}>
                    <input name="symptoms" type="checkbox" value={symptom} />
                    <span>{symptom}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="spanFull">Notas<textarea name="notes" rows={2} placeholder="Cualquier cosa que quieras recordar o comentar con tu coach..." /></label>
            <button className="btn primary" type="submit"><Plus size={16} /> Guardar registro</button>
          </form>
        </article>

        <article className="card span7 cycleHistoryCard uiFadeUp" style={{ ["--i" as string]: 1 }}>
          <div className="sectionHeader">
            <div>
              <CalendarRange color="var(--gold)" size={26} />
              <h2>Historial</h2>
              <p>Tus últimos registros, del más reciente al más antiguo.</p>
            </div>
          </div>
          {overview.entries.length ? (
            <ul className="cycleHistoryList">
              {overview.entries.map((entry) => (
                <li className="cycleHistoryRow" key={entry.id}>
                  <div className="cycleHistoryIcon">{entryIcon(entry)}</div>
                  <div className="cycleHistoryBody">
                    <strong>{formatDate(entry.loggedOn)} · {ENTRY_LABELS[entry.entryType] ?? entry.entryType}</strong>
                    <span className="cycleHistoryMeta">
                      {entry.flow ? <span className="cycleTag">{FLOW_LABELS[entry.flow] ?? entry.flow}</span> : null}
                      {entry.symptoms.map((symptom) => <span className="cycleTag" key={symptom}>{symptom}</span>)}
                    </span>
                    {entry.notes ? <p>{entry.notes}</p> : null}
                  </div>
                  <form action={deleteCycleLogAction} className="cycleHistoryDelete">
                    <input name="workspaceId" type="hidden" value={brand.id} />
                    <input name="entryId" type="hidden" value={entry.id} />
                    <button className="btn ghost sm" type="submit" aria-label="Eliminar registro"><Trash2 size={15} /></button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <div className="cycleEmpty">
              <CalendarHeart color="var(--gold)" size={28} />
              <p>Todavía no hay registros. Cuando marques tu primer día verás aquí tu historial y la estimación del próximo ciclo.</p>
            </div>
          )}
        </article>
      </section>
    </>
  );
}
