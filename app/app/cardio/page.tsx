import { Activity } from "lucide-react";
import { Topbar } from "@/components/topbar";

export default function CardioPage() {
  return (
    <>
      <Topbar
        eyebrow="Cardio"
        title="HIIT o LISS según el plan."
        text="Página educativa y operativa para que el cliente elija o registre el tipo de cardio indicado."
      />
      <section className="grid">
        {[
          ["HIIT", "Entrenamiento por intervalos de alta intensidad."],
          ["LISS", "Cardio de baja intensidad y estado sostenido."],
        ].map(([title, text]) => (
          <article className="card span6" key={title}>
            <Activity color="var(--gold)" />
            <h2>{title}</h2>
            <p>{text}</p>
            <button className="btn">Ver ejemplos</button>
          </article>
        ))}
      </section>
    </>
  );
}
