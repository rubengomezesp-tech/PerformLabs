import { FileText, Save } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Topbar } from "@/components/topbar";
import { listManagedContentPages } from "@/lib/repositories/content-management";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import { saveContentPageAction } from "./actions";

export const dynamic = "force-dynamic";

type ContentPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  active: "Activo",
  archived: "Archivado",
};

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const pages = await listManagedContentPages(selectedWorkspace?.id);

  return (
    <>
      <Topbar
        eyebrow="CMS"
        title="Contenido editable para cada app."
        text="Guías, FAQs, páginas educativas, soporte y mensajes del dashboard controlados por marca."
      />
      <section className="grid">
        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <FileText color="var(--gold)" />
              <h2>Marca y contenido</h2>
              <p>Selecciona la app que quieres editar. Lo activo aparece en la experiencia cliente.</p>
            </div>
            <span className="tag">{pages.length} páginas</span>
          </div>
          <form action="/console/content" className="formGrid" method="get">
            <label>
              Marca
              <select name="brand" defaultValue={selectedWorkspace?.id}>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="formActions">
              <button className="btn" type="submit">Ver contenido</button>
            </div>
          </form>
        </article>

        {selectedWorkspace ? (
          <article className="card span12">
            <h2>Nueva página</h2>
            <form action={saveContentPageAction} className="contentEditorGrid">
              <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
              <label>
                Título interno
                <input name="title" placeholder="Guía de bienvenida" required />
              </label>
              <label>
                Slug
                <input name="slug" placeholder="bienvenida" />
              </label>
              <label>
                Estado
                <select name="status" defaultValue="draft">
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
              <label>
                Título visible
                <input name="heading" placeholder="Bienvenido a tu programa" />
              </label>
              <label className="spanFull">
                Contenido
                <textarea name="notes" rows={4} placeholder="Primeros pasos, normas, preguntas frecuentes o instrucciones del equipo." />
              </label>
              <div className="formActions">
                <button className="btn primary" type="submit">
                  Crear página <Save size={18} />
                </button>
              </div>
            </form>
          </article>
        ) : null}

        {pages.map((page) => (
          <article className="card span6" key={page.id}>
            <div className="sectionHeader">
              <div>
                <h2>{page.title}</h2>
                <p>/{page.slug}</p>
              </div>
              <span className={page.status === "archived" ? "tag danger" : "tag"}>
                {statusLabels[page.status] ?? page.status}
              </span>
            </div>
            <form action={saveContentPageAction} className="contentEditorGrid compactContentEditor">
              <input name="id" type="hidden" value={page.id} />
              <input name="workspaceId" type="hidden" value={selectedWorkspace?.id ?? ""} />
              <label>
                Título
                <input name="title" defaultValue={page.title} required />
              </label>
              <label>
                Slug
                <input name="slug" defaultValue={page.slug} />
              </label>
              <label>
                Estado
                <select name="status" defaultValue={page.status}>
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
              <label>
                Título visible
                <input name="heading" defaultValue={page.heading} />
              </label>
              <label className="spanFull">
                Contenido
                <textarea name="notes" defaultValue={page.notes} rows={4} />
              </label>
              <button className="btn" type="submit">
                Guardar <Save size={16} />
              </button>
            </form>
          </article>
        ))}

        {selectedWorkspace && pages.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Esta marca aún no tiene contenido."
            text="Crea la bienvenida, soporte, FAQs y guías base para que la app cliente no nazca vacía."
          />
        ) : null}
      </section>
    </>
  );
}
