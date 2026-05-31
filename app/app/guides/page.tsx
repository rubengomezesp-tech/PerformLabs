import { BookOpen } from "lucide-react";
import { MemberEmpty } from "@/components/member-empty";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listWorkspaceContentPages } from "@/lib/repositories/member-experience";

export default async function GuidesPage() {
  const brand = await getSelectedMemberAppBrand();
  const pages = await listWorkspaceContentPages(brand.id);

  return (
    <>
      <Topbar
        eyebrow="Guías"
        title={`Educación de ${brand.name}.`}
        text="Guías, normas del programa, preguntas frecuentes y recursos preparados para el cliente."
      />
      <section className="grid">
        {pages.length ? pages.map((page, idx) => (
          <article className="card span4 guideCard uiSheen uiFadeUp" style={{ ["--i" as string]: idx }} key={page.id}>
            <span className="uiIconChip"><BookOpen size={18} /></span>
            <h3>{page.heading}</h3>
            <p>{page.notes}</p>
            <span className={page.status === "active" ? "tag" : "tag profileTagMuted"}>{page.status === "active" ? "Activo" : "Preparando"}</span>
          </article>
        )) : (
          <MemberEmpty
            icon={BookOpen}
            title="Aún no hay guías publicadas."
            text="Cuando tu coach publique sus guías y recursos, los verás aquí."
          />
        )}
      </section>
    </>
  );
}
