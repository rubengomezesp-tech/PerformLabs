import { Topbar } from "@/components/topbar";
import { StatTilesSkeleton, WideBlockSkeleton } from "@/components/member-skeletons";

export default function ProgressLoading() {
  return (
    <>
      <Topbar eyebrow="Progreso" title="Cargando tu evolución." text="Preparando peso, medidas, fotos y check-ins." />
      <section className="grid">
        <StatTilesSkeleton count={3} span={4} />
        <WideBlockSkeleton height={240} span={12} />
        <StatTilesSkeleton count={2} span={6} />
      </section>
    </>
  );
}
