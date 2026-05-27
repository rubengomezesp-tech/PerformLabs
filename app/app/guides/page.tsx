import { BookOpen } from "lucide-react";
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
        {pages.map((page) => (
          <article className="card span4" key={page.id}>
            <BookOpen color="var(--gold)" />
            <h3>{page.heading}</h3>
            <p>{page.notes}</p>
            <span className="tag">{page.status === "active" ? "Activo" : "Preparando"}</span>
          </article>
        ))}
      </section>
    </>
  );
}
