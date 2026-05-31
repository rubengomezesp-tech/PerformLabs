import { Pill, Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listSupplements, TIMING_LABEL, TIMING_ORDER, type SupplementTiming } from "@/lib/repositories/supplements";
import { createSupplementAction, deleteSupplementAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CoachSupplementsPage() {
  const brand = await getSelectedMemberAppBrand();
  const supplements = await listSupplements(brand.id);

  return (
    <>
      <Topbar
        eyebrow="Suplementos"
        title="Pauta el protocolo de suplementación."
        text="Lo que añadas aquí aparece en la app del cliente, ordenado por momento del día, para que lo marque cada día."
      />
      <section className="grid">
        <article className="card span5">
          <div className="sectionHeader">
            <div>
              <Pill color="var(--accent)" aria-hidden="true" />
              <h2>Nuevo suplemento</h2>
              <p>Nombre, dosis y cuándo tomarlo.</p>
            </div>
          </div>
          <form action={createSupplementAction} className="coachBrainForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label>Nombre<input name="name" placeholder="Creatina monohidrato" required maxLength={120} /></label>
            <div className="formGrid">
              <label>Dosis<input name="dose" placeholder="5 g" maxLength={80} /></label>
              <label>
                Momento
                <select name="timing" defaultValue="anytime">
                  {TIMING_ORDER.map((t) => (
                    <option key={t} value={t}>{TIMING_LABEL[t as SupplementTiming]}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>Notas<input name="notes" placeholder="Con agua o zumo." maxLength={300} /></label>
            <SubmitButton className="btn primary" pendingLabel="Añadiendo…"><Pill size={16} /> Añadir al protocolo</SubmitButton>
          </form>
        </article>

        <article className="card span7">
          <div className="sectionHeader">
            <div>
              <Pill color="var(--accent)" aria-hidden="true" />
              <h2>Protocolo actual</h2>
              <p>{supplements.length} suplemento(s) pautado(s).</p>
            </div>
          </div>
          {supplements.length ? (
            <ul className="suppList">
              {supplements.map((s) => (
                <li className="suppRow" key={s.id}>
                  <span className="suppTimingTag">{TIMING_LABEL[s.timing]}</span>
                  <div className="suppInfo">
                    <strong>{s.name}{s.dose ? <span className="suppDose"> · {s.dose}</span> : null}</strong>
                    {s.notes ? <small>{s.notes}</small> : null}
                  </div>
                  <form action={deleteSupplementAction}>
                    <input name="workspaceId" type="hidden" value={brand.id} />
                    <input name="supplementId" type="hidden" value={s.id} />
                    <button type="submit" className="btn ghost sm" aria-label="Eliminar"><Trash2 size={14} /></button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Aún no has pautado suplementos. Añade el primero a la izquierda.</p>
          )}
        </article>
      </section>
    </>
  );
}
