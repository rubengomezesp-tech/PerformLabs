import { LoadingCard } from "@/components/loading-card";
import { Topbar } from "@/components/topbar";

export default function MemberAppLoading() {
  return (
    <>
      <Topbar
        eyebrow="App cliente"
        title="Preparando tu espacio."
        text="Cargando plan, progreso y contenido de la marca."
      />
      <section className="grid">
        <LoadingCard lines={4} />
        <LoadingCard lines={4} />
        <LoadingCard lines={4} />
      </section>
    </>
  );
}
