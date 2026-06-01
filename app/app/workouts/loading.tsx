import { Topbar } from "@/components/topbar";
import { StatTilesSkeleton, WideBlockSkeleton } from "@/components/member-skeletons";

export default function WorkoutsLoading() {
  return (
    <>
      <Topbar eyebrow="Entreno" title="Cargando tu entreno." text="Preparando tu sesión, series y progreso." />
      <section className="grid">
        <StatTilesSkeleton count={3} span={4} />
        <WideBlockSkeleton height={200} span={12} />
      </section>
    </>
  );
}
