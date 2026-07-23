import { Check, Pill } from "lucide-react";
import { MemberEmpty } from "@/components/member-empty";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { getMemberSupplementsToday, TIMING_LABEL, TIMING_ORDER, type SupplementTiming } from "@/lib/repositories/supplements";
import { toggleSupplementAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MemberSupplementsPage() {
  const brand = await getSelectedMemberAppBrand();
  const supplements = await getMemberSupplementsToday(brand.id);
  const takenCount = supplements.filter((s) => s.takenToday).length;
  const byTiming = TIMING_ORDER.map((timing) => ({
    timing,
    items: supplements.filter((s) => s.timing === timing),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <Topbar
        eyebrow="Suplementos"
        title="Tu protocolo, marcado cada día."
        text="Lo que tu coach te ha pautado, ordenado por momento del día. Marca lo que tomas para no perder ninguno."
      />
      <section className="grid">
        {supplements.length ? (
          <>
            <article className="card span12 suppSummary ntrSuppSummary uiGlass uiSheen ntrbSuppSummary">
              <span className="uiIconChip ntrbSuppChip"><Pill size={22} /></span>
              <div className="ntrSuppSummaryBody">
                <strong>{takenCount}/{supplements.length} tomados hoy</strong>
                <p>Mantén la constancia: los suplementos solo funcionan si son diarios.</p>
                <div className="ntrSuppProgress" role="progressbar" aria-valuemin={0} aria-valuemax={supplements.length} aria-valuenow={takenCount} aria-label={`${takenCount} de ${supplements.length} suplementos tomados hoy`}>
                  <span style={{ width: `${supplements.length ? Math.round((takenCount / supplements.length) * 100) : 0}%` }} />
                </div>
              </div>
              <div className="ntrbSuppStat uiStat">
                <strong className="uiStatValue">{supplements.length ? Math.round((takenCount / supplements.length) * 100) : 0}<i>%</i></strong>
                <small className="uiStatLabel">Adherencia hoy</small>
              </div>
            </article>

            {byTiming.map((group, gi) => (
              <article className="card span12 suppGroup uiSheen ntrbSuppGroup uiFadeUp" style={{ ["--i" as string]: gi }} key={group.timing}>
                <h2 className="suppGroupTitle ntrbRecipeSubhead"><span className="uiIconChip ntrbSectionChip"><Pill size={16} /></span>{TIMING_LABEL[group.timing as SupplementTiming]}</h2>
                <ul className="suppList">
                  {group.items.map((s) => (
                    <li className={s.takenToday ? "suppRow done" : "suppRow"} key={s.id}>
                      <form action={toggleSupplementAction}>
                        <input name="workspaceId" type="hidden" value={brand.id} />
                        <input name="supplementId" type="hidden" value={s.id} />
                        <button type="submit" className="suppTick" aria-label={s.takenToday ? "Desmarcar" : "Marcar como tomado"}>
                          {s.takenToday ? <Check size={15} /> : null}
                        </button>
                      </form>
                      <div className="suppInfo">
                        <strong>{s.name}{s.dose ? <span className="suppDose"> · {s.dose}</span> : null}</strong>
                        {s.notes ? <small>{s.notes}</small> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </>
        ) : (
          <MemberEmpty
            icon={Pill}
            title="Aún no tienes suplementos pautados."
            text="Cuando tu coach te asigne un protocolo de suplementación, lo verás aquí para marcarlo cada día."
          />
        )}
      </section>
    </>
  );
}
