import { LoadingCard } from "@/components/loading-card";
import { Topbar } from "@/components/topbar";

// Route-level loading for the whole /coach surface: keeps the sidebar/chrome and
// shows a skeleton in the content area on navigation, instead of a blank jump.
export default function CoachLoading() {
  return (
    <>
      <Topbar
        eyebrow="Coach"
        title="Cargando tu panel."
        text="Preparando clientes, programas, nutrición y cola de revisión."
      />
      <section className="grid">
        <LoadingCard lines={5} />
        <LoadingCard lines={5} />
        <LoadingCard lines={4} />
        <LoadingCard lines={4} />
      </section>
    </>
  );
}
