import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listWorkspaceContentPages } from "@/lib/repositories/member-experience";

export const dynamic = "force-dynamic";

type GuideDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { id } = await params;
  const brand = await getSelectedMemberAppBrand();
  const pages = await listWorkspaceContentPages(brand.id);
  const page = pages.find((candidate) => candidate.id === id);

  if (!page) {
    notFound();
  }

  const paragraphs = page.notes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <>
      <Topbar
        eyebrow="Guía"
        title={page.heading}
        text={`Recurso de ${brand.name}.`}
        actions={
          <Link className="btn" href="/app/guides">
            <ArrowLeft size={16} /> Volver
          </Link>
        }
      />
      <section className="grid">
        <article className="card span12 guideReader uiGlass uiSheen uiFadeUp">
          <span className="uiIconChip"><BookOpen size={18} /></span>
          {paragraphs.length ? (
            paragraphs.map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
          ) : (
            <p>Esta guía aún no tiene contenido. Tu coach la completará pronto.</p>
          )}
        </article>
      </section>
    </>
  );
}
