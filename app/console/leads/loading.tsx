import { LoadingCard } from "@/components/loading-card";
import { Topbar } from "@/components/topbar";

export default function LeadsLoading() {
  return (
    <>
      <Topbar
        eyebrow="CRM"
        title="Cargando oportunidades."
        text="Preparando leads, notas y estado comercial."
      />
      <section className="grid">
        <LoadingCard lines={5} />
        <LoadingCard lines={5} />
      </section>
    </>
  );
}
