import { Topbar } from "@/components/topbar";
import { WideBlockSkeleton, CardGridSkeleton } from "@/components/member-skeletons";

export default function RecipesLoading() {
  return (
    <>
      <Topbar eyebrow="Recetas" title="Cargando recetas." text="Buscando ideas que encajan con tus macros." />
      <section className="grid">
        <WideBlockSkeleton height={64} span={12} />
        <CardGridSkeleton count={6} span={4} />
      </section>
    </>
  );
}
