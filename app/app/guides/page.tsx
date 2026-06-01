import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
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
          <Link className="card span4 guideCard uiSheen uiFadeUp" style={{ ["--i" as string]: idx }} key={page.id} href={`/app/guides/${page.id}`}>
            <span className="uiIconChip"><BookOpen size={18} /></span>
            <h3>{page.heading}</h3>
            <p style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{page.notes}</p>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto" }}>
              <span className={page.status === "active" ? "tag" : "tag profileTagMuted"}>{page.status === "active" ? "Activo" : "Preparando"}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--accent)", fontWeight: 600, fontSize: "0.85rem" }}>Leer guía <ArrowRight size={14} aria-hidden="true" /></span>
            </span>
          </Link>
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
