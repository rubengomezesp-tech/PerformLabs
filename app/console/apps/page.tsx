import { AppWindow, ArrowRight, Eye, Globe, KeyRound, Layers, Pause, Pencil, Play, Plus, Save } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Topbar } from "@/components/topbar";
import { baseAppBlueprint, baseAppMetrics } from "@/lib/domain/app-blueprint";
import { entitlementModuleDescriptions, entitlementModuleLabels, entitlementModules, entitlementStatusLabels } from "@/lib/repositories/entitlements";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import { isVercelDomainsConfigured } from "@/lib/vercel/domains";
import { connectWorkspaceDomainAction, createWorkspaceAction, toggleWorkspaceAction, updateWorkspaceAction, updateWorkspaceEntitlementAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ChildAppsPage() {
  const { workspaces } = await listWorkspaceSummaries();
  const vercelReady = isVercelDomainsConfigured();

  return (
    <>
      <Topbar
        eyebrow="Marcas"
        title="Apps de cliente conectadas a la base PerformLabs."
        text="Cada marca nace desde la misma base operativa: identidad, dominio, páginas móviles, contenidos iniciales, producto principal y módulos listos para configurar."
        actions={<a className="btn primary" href="#crear-app">Nueva implantación <Plus size={18} /></a>}
      />
      <section className="grid">
        <article className="card span12 consoleEngineCard">
          <div className="sectionHeader">
            <div>
              <AppWindow color="var(--accent)" />
              <h2>Motor app base</h2>
              <p>
                La consola no crea fichas vacías. Prepara una app operativa con navegación,
                ajustes, contenido base y vista cliente conectada a la marca.
              </p>
            </div>
            <a className="btn" href="/app">
              Ver app base <ArrowRight size={16} />
            </a>
          </div>
          <div className="metricGrid">
            {baseAppMetrics.map((metric) => (
              <span key={metric.label}>
                {metric.label}
                <strong>{metric.value}</strong>
                <small>{metric.text}</small>
              </span>
            ))}
          </div>
          <div className="engineGrid">
            {baseAppBlueprint.slice(0, 3).map((module) => (
              <article className="engineTile" key={module.key}>
                <span>{module.consoleArea}</span>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <small>{module.routes.join(" · ")}</small>
              </article>
            ))}
          </div>
        </article>
        <article className="card span12" id="crear-app">
          <div className="sectionHeader">
            <div>
              <Layers color="var(--accent)" />
              <h2>Nueva implantación</h2>
              <p>Registra un proyecto premium. Nace preparado, pero bloqueado hasta pago y activación comercial.</p>
            </div>
          </div>
          <form action={createWorkspaceAction} className="formGrid">
            <label>
              Nombre de marca
              <input name="name" placeholder="Ej. Elite Coach Academy" required />
            </label>
            <label>
              Nombre en la app
              <input name="appName" placeholder="Ej. Elite App" />
            </label>
            <label>
              Dominio
              <input name="customDomain" placeholder="app.tudominio.com" />
            </label>
            <label>
              Email soporte
              <input name="supportEmail" placeholder="soporte@tudominio.com" type="email" />
            </label>
            <label>
              Color principal
              <input name="accentColor" type="color" defaultValue="#078df2" />
            </label>
            <div className="formActions">
              <button className="btn primary" type="submit">
                Crear implantación <Plus size={18} />
              </button>
            </div>
          </form>
        </article>
        {workspaces.map((app) => {
          const licenseActive = app.entitlement.status === "active";
          return (
            <article className="card span6" key={app.id}>
              <div className="appCardHeader">
                <span className="swatch" style={{ background: app.accentColor }} />
                <Globe color="var(--accent)" />
                <div>
                  <h2>{app.name}</h2>
                  <p>{app.appName}</p>
                </div>
                <span className={licenseActive ? "tag success" : "tag danger"}>
                  {entitlementStatusLabels[app.entitlement.status]}
                </span>
              </div>
              <ul className="list">
                <li className="row">Dominio <span>{app.domain}</span></li>
                <li className="row">Soporte <span>{app.supportEmail || "Pendiente"}</span></li>
                <li className="row">Estado app <span className={app.isActive ? "tag" : "tag danger"}>{app.status}</span></li>
                <li className="row">Miembros <strong>{app.members}</strong></li>
                <li className="row">MRR <strong>{app.mrr}</strong></li>
              </ul>

              {/* License & access: the primary control, kept at the top of the card. */}
              <form action={updateWorkspaceEntitlementAction} className="editForm entitlementForm">
                <input name="workspaceId" type="hidden" value={app.id} />
                <div className="sectionHeader compact">
                  <div>
                    <KeyRound color="var(--accent)" size={18} />
                    <h3>Licencia y acceso</h3>
                    <p>Activa o suspende el acceso de esta marca a la app, la consola del entrenador y los módulos.</p>
                  </div>
                </div>
                <label>
                  Estado de licencia
                  <select name="status" defaultValue={app.entitlement.status}>
                    <option value="active">Activa</option>
                    <option value="past_due">Pendiente de regularizar</option>
                    <option value="suspended">Suspendida</option>
                    <option value="revoked">Revocada</option>
                    <option value="terminated">Finalizada</option>
                  </select>
                </label>
                <label>
                  Contrato / referencia
                  <input name="contractRef" defaultValue={app.entitlement.contractRef} placeholder="MSA-2026-001" />
                </label>
                <label className="span2">
                  Motivo interno
                  <input name="reason" defaultValue={app.entitlement.reason} placeholder="Impago, revisión contractual, soporte interno..." />
                </label>
                <fieldset className="moduleMatrix span2">
                  <legend>Módulos autorizados</legend>
                  {entitlementModules.map((module) => (
                    <label className="moduleToggle" key={module}>
                      <input
                        name="modules"
                        type="checkbox"
                        value={module}
                        defaultChecked={app.entitlement.modules[module]}
                      />
                      <span>
                        <strong>{entitlementModuleLabels[module]}</strong>
                        <small>{entitlementModuleDescriptions[module]}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className="actions">
                  <button className="btn primary" type="submit">
                    Guardar licencia <Save size={16} />
                  </button>
                </div>
              </form>

              {/* Domain & access: the URL the trainer's clients use, plus how to connect it. */}
              <div className="domainPanel">
                <div className="domainRow">
                  <span className="muted">App del cliente</span>
                  <a href={`https://${app.fallbackSubdomain}`} target="_blank" rel="noreferrer">{app.fallbackSubdomain}</a>
                </div>
                <div className="domainRow">
                  <span className="muted">Dominio propio</span>
                  <span>{app.domain ? app.domain : <span className="tag">Sin conectar</span>}</span>
                </div>
                <form action={connectWorkspaceDomainAction} style={{ display: "flex", gap: 8, margin: "6px 0", flexWrap: "wrap" }}>
                  <input name="id" type="hidden" value={app.id} />
                  <input name="customDomain" defaultValue={app.domain} placeholder="app.sumarca.com" aria-label={`Dominio propio de ${app.name}`} />
                  <button className="btn sm" type="submit">Conectar dominio</button>
                </form>
                <p className="muted domainHint">
                  {vercelReady
                    ? "Se da de alta en Vercel automáticamente. Apunta el DNS del dominio a Vercel (CNAME → cname.vercel-dns.com, o A → 76.76.21.21) y deja *.performlabs.app en DNS-only."
                    : "Se guarda el dominio; el alta automática en Vercel necesita VERCEL_API_TOKEN. Mientras, añádelo a mano en el proyecto perform-labs-pcgg. DNS: CNAME → cname.vercel-dns.com."}
                </p>
              </div>

              {/* Brand metadata: secondary, collapsed so it doesn't bury the license control. */}
              <details className="editDetails">
                <summary><Pencil size={15} /> Editar marca, subdominio y dominio</summary>
                <form action={updateWorkspaceAction} className="editForm">
                  <input name="id" type="hidden" value={app.id} />
                  <label>
                    Marca
                    <input name="name" defaultValue={app.name} required />
                  </label>
                  <label>
                    App
                    <input name="appName" defaultValue={app.appName} />
                  </label>
                  <label>
                    Subdominio provisional
                    <input name="subdomain" defaultValue={app.fallbackSubdomain.replace(/\.performlabs\.app$/, "")} placeholder="marca" />
                  </label>
                  <label>
                    Dominio propio
                    <input name="customDomain" defaultValue={app.domain} placeholder="app.sumarca.com" />
                  </label>
                  <label>
                    Soporte
                    <input name="supportEmail" defaultValue={app.supportEmail} type="email" />
                  </label>
                  <label>
                    Color
                    <input name="accentColor" type="color" defaultValue={app.accentColor} />
                  </label>
                  <div className="actions">
                    <button className="btn" type="submit">
                      Guardar <Save size={16} />
                    </button>
                  </div>
                </form>
              </details>

              <form action={toggleWorkspaceAction}>
                <input name="id" type="hidden" value={app.id} />
                <input name="isActive" type="hidden" value={String(!app.isActive)} />
                <div className="actions">
                  <a className="btn primary" href={`/app/select?brand=${app.id}`}>
                    Vista cliente <Eye size={16} />
                  </a>
                  <a className="btn" href={`/console/brand?brand=${app.id}`}>
                    Marca
                  </a>
                  <a className="btn" href={`/console/content?brand=${app.id}`}>
                    Contenido
                  </a>
                  <a className="btn" href={`/console/programs?brand=${app.id}`}>
                    Programas
                  </a>
                  <button className="btn" type="submit">
                    {app.isActive ? "Pausar app" : "Activar app"}
                    {app.isActive ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                </div>
              </form>
            </article>
          );
        })}

        {workspaces.length === 0 ? (
          <EmptyState
            icon={AppWindow}
            title="Todavía no hay marcas creadas."
            text="Crea la primera implantación desde el formulario de arriba para empezar a configurar dominio, licencia y módulos de la app del entrenador."
          />
        ) : null}
      </section>
    </>
  );
}
