import { LoadingCard } from "@/components/loading-card";
import { Topbar } from "@/components/topbar";

export default function StrategyLoading() {
  return (
    <>
      <Topbar
        eyebrow="Estrategia"
        title="Preparando inteligencia competitiva."
        text="Cargando mapa de competidores, oportunidades y arquitectura."
      />
      <section className="grid">
        <LoadingCard lines={4} />
        <LoadingCard lines={4} />
        <LoadingCard lines={4} />
      </section>
    </>
  );
}
