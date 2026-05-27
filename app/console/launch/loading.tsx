import { LoadingCard } from "@/components/loading-card";
import { Topbar } from "@/components/topbar";

export default function LaunchLoading() {
  return (
    <>
      <Topbar
        eyebrow="QA"
        title="Revisando lanzamiento."
        text="Comprobando marca, contenido, planes y soporte."
      />
      <section className="grid">
        <LoadingCard lines={4} />
        <LoadingCard lines={4} />
        <LoadingCard lines={4} />
      </section>
    </>
  );
}
