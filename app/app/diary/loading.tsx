import { Topbar } from "@/components/topbar";
import { RingsSkeleton, WideBlockSkeleton, ListSkeleton } from "@/components/member-skeletons";

export default function DiaryLoading() {
  return (
    <>
      <Topbar eyebrow="Diario" title="Cargando tu diario." text="Sumando lo que has registrado hoy." />
      <section className="grid">
        <RingsSkeleton span={12} />
        <WideBlockSkeleton height={120} span={12} />
        <ListSkeleton rows={4} span={12} />
      </section>
    </>
  );
}
