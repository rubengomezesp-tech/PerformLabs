import { Camera, Ruler, Scale } from "lucide-react";
import { Topbar } from "@/components/topbar";

const measures = [
  ["Peso", "54.0 kg", "Feb 23, 2026"],
  ["Grasa corporal", "16%", "Feb 23, 2026"],
  ["Brazos", "Primera medición", "Pendiente"],
  ["Hombros", "Primera medición", "Pendiente"],
  ["Pecho", "Primera medición", "Pendiente"],
  ["Cintura", "Primera medición", "Pendiente"],
  ["Caderas", "Primera medición", "Pendiente"],
  ["Piernas", "Primera medición", "Pendiente"],
  ["Gemelos", "Primera medición", "Pendiente"],
];

export default function ProgressPage() {
  return (
    <>
      <Topbar
        eyebrow="Mi recorrido"
        title="Fotos, peso y medidas."
        text="El usuario registra su transformación y el equipo usa estos datos para revisar o actualizar planes."
      />
      <section className="grid">
        <article className="card span4">
          <Camera color="var(--gold)" />
          <h2>Recorrido en fotos</h2>
          <p>Sube fotos frontal, lateral y espalda para comparar el progreso.</p>
          <button className="btn primary">Subir fotos</button>
        </article>
        {measures.map(([name, value, date]) => (
          <article className="card span4" key={name}>
            {name === "Peso" ? <Scale color="var(--gold)" /> : <Ruler color="var(--gold)" />}
            <h3>{name}</h3>
            <strong>{value}</strong>
            <p>{date}</p>
          </article>
        ))}
      </section>
    </>
  );
}
