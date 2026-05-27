import { LoadingCard } from "@/components/loading-card";
import { Topbar } from "@/components/topbar";

export default function ProjectsLoading() {
  return (
    <>
      <Topbar
        eyebrow="Implantación"
        title="Cargando proyectos."
        text="Revisando estado, checklist y readiness."
      />
      <section className="grid">
        <LoadingCard lines={5} />
        <LoadingCard lines={5} />
      </section>
    </>
  );
}
