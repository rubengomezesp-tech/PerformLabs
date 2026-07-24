import { Topbar } from "@/components/topbar";
import { RingsSkeleton, StatTilesSkeleton, ListSkeleton } from "@/components/member-skeletons";

export default function MealsLoading() {
  return (
    <>
      <Topbar eyebrow="Comida" title="Cargando tu nutrición." text="Preparando macros, comidas y agua de hoy." />
      <section className="grid">
        <RingsSkeleton span={12} />
        <StatTilesSkeleton count={2} span={6} />
        <ListSkeleton rows={4} span={12} />
      </section>
    </>
  );
}
