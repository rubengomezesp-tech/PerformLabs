import { ClipboardList, Clock, FileText, Plus, Save, Settings2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Topbar } from "@/components/topbar";
import { listImplementationTemplates } from "@/lib/repositories/implementation-projects";
import {
  addImplementationTemplateTaskAction,
  updateImplementationTemplateAction,
  updateTemplateBriefDefaultsAction,
} from "../projects/actions";

export const dynamic = "force-dynamic";

const domainStrategyOptions = [
  ["undecided", "Pendiente"],
  ["new_domain", "Comprar dominio nuevo"],
  ["existing_domain", "Usar dominio del cliente"],
  ["subdomain", "Usar subdominio"],
];

const logoStatusOptions = [
  ["pending", "Pendiente"],
  ["received", "Recibido"],
  ["needs_design", "Diseñar nosotros"],
  ["approved", "Aprobado"],
];

export default async function TemplatesPage() {
  const templates = await listImplementationTemplates();
  const activeTemplates = templates.filter((template) => template.isActive).length;
  const totalTasks = templates.reduce((total, template) => total + template.tasks.length, 0);
  const averageDays = templates.length
    ? Math.round(templates.reduce((total, template) => total + template.estimatedDays, 0) / templates.length)
    : 0;

  return (
    <>
      <Topbar
        eyebrow="Plantillas"
        title="Playbooks de entrega."
        text="Cada plantilla define cómo nace una implantación: checklist, tiempos y briefing inicial según el tipo de app que vamos a preparar."
      />

      <section className="grid">
        <article className="card span3">
          <p className="metric">Activas<strong>{activeTemplates}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Plantillas<strong>{templates.length}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Tareas base<strong>{totalTasks}</strong></p>
        </article>
        <article className="card span3">
          <p className="metric">Media días<strong>{averageDays}</strong></p>
        </article>

        {templates.map((template) => {
          const tasksByPhase = template.tasks.reduce<Record<string, typeof template.tasks>>((groups, task) => {
            groups[task.phase] = groups[task.phase] ?? [];
            groups[task.phase].push(task);
            return groups;
          }, {});

          return (
            <article className="card span12 templateCard" key={template.id}>
              <div className="sectionHeader">
                <div>
                  <ClipboardList color="var(--gold)" />
                  <h2>{template.name}</h2>
                  <p>{template.description}</p>
                </div>
                <span className={template.isActive ? "tag" : "tag danger"}>
                  {template.isActive ? "Activa" : "Pausada"}
                </span>
              </div>

              <div className="templateMeta">
                <span><Clock size={15} /> {template.estimatedDays} días estimados</span>
                <span><Settings2 size={15} /> {template.buyerType || "Tipo de cliente pendiente"}</span>
                <span><FileText size={15} /> {template.tasks.length} tareas base</span>
              </div>

              <details className="editDetails">
                <summary><Settings2 size={14} /> Ajustes de plantilla</summary>
                <form action={updateImplementationTemplateAction} className="templateEditForm">
                  <input name="id" type="hidden" value={template.id} />
                  <label>
                    Nombre
                    <input name="name" defaultValue={template.name} />
                  </label>
                  <label>
                    Días estimados
                    <input name="estimatedDays" defaultValue={template.estimatedDays} inputMode="numeric" />
                  </label>
                  <label>
                    Estado
                    <select name="isActive" defaultValue={String(template.isActive)}>
                      <option value="true">Activa</option>
                      <option value="false">Pausada</option>
                    </select>
                  </label>
                  <label className="spanFull">
                    Tipo de cliente
                    <input name="buyerType" defaultValue={template.buyerType} />
                  </label>
                  <label className="spanFull">
                    Descripción interna
                    <textarea name="description" defaultValue={template.description} rows={3} />
                  </label>
                  <button className="btn" type="submit">
                    Guardar plantilla <Save size={16} />
                  </button>
                </form>
              </details>

              <div className="templateColumns">
                <section className="templatePanel">
                  <div className="taskBoardHeader">
                    <div>
                      <ClipboardList color="var(--gold)" />
                      <div>
                        <h3>Checklist automático</h3>
                        <p>Estas tareas se copian al proyecto cuando convertimos un lead.</p>
                      </div>
                    </div>
                  </div>

                  {template.tasks.length === 0 ? (
                    <div className="inlineEmpty">
                      <ClipboardList color="var(--gold)" />
                      <h3>Sin tareas en esta plantilla.</h3>
                      <p>Añade tareas con su fase y día de offset; se copiarán al proyecto cada vez que conviertas un lead con esta plantilla.</p>
                    </div>
                  ) : null}

                  {Object.entries(tasksByPhase).map(([phase, tasks]) => (
                    <section className="phaseBlock" key={phase}>
                      <span className="phaseTag">{phase}</span>
                      <div className="taskList">
                        {tasks.map((task) => (
                          <div className="templateTask" key={task.id}>
                            <div>
                              <strong>{task.title}</strong>
                              <p>{task.description || "Sin descripción"}</p>
                            </div>
                            <span className="tag">Día +{task.dayOffset}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}

                  <form action={addImplementationTemplateTaskAction} className="addTaskForm">
                    <input name="templateId" type="hidden" value={template.id} />
                    <label>
                      Fase
                      <input name="phase" placeholder="Marca, Pagos..." />
                    </label>
                    <label>
                      Nueva tarea
                      <input name="title" placeholder="Ej. Preparar FAQ inicial" />
                    </label>
                    <label>
                      Día +
                      <input name="dayOffset" inputMode="numeric" placeholder="7" />
                    </label>
                    <label className="spanFull">
                      Detalle
                      <textarea name="description" rows={3} placeholder="Qué se debe ejecutar al crear esta tarea..." />
                    </label>
                    <button className="btn primary" type="submit">
                      Añadir tarea <Plus size={16} />
                    </button>
                  </form>
                </section>

                <section className="templatePanel">
                  <div className="taskBoardHeader">
                    <div>
                      <FileText color="var(--gold)" />
                      <div>
                        <h3>Briefing prellenado</h3>
                        <p>Estos campos se copian al briefing inicial del proyecto.</p>
                      </div>
                    </div>
                  </div>

                  <details className="editDetails" open>
                  <summary><FileText size={14} /> Editar campos prellenados</summary>
                  <form action={updateTemplateBriefDefaultsAction} className="briefGrid">
                    <input name="templateId" type="hidden" value={template.id} />
                    <label>
                      Dominio
                      <select name="domainStrategy" defaultValue={template.defaults.domainStrategy}>
                        {domainStrategyOptions.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Logo
                      <select name="logoStatus" defaultValue={template.defaults.logoStatus}>
                        {logoStatusOptions.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Cobro
                      <input name="paymentProvider" defaultValue={template.defaults.paymentProvider} />
                    </label>
                    <label className="spanFull">
                      Marca
                      <textarea name="brandNotes" defaultValue={template.defaults.brandNotes} rows={3} />
                    </label>
                    <label className="spanFull">
                      Público objetivo
                      <textarea name="targetAudience" defaultValue={template.defaults.targetAudience} rows={3} />
                    </label>
                    <label className="spanFull">
                      Oferta
                      <textarea name="offerSummary" defaultValue={template.defaults.offerSummary} rows={3} />
                    </label>
                    <label className="spanFull">
                      Notas comerciales
                      <textarea name="pricingNotes" defaultValue={template.defaults.pricingNotes} rows={3} />
                    </label>
                    <label className="spanFull">
                      Contenido
                      <textarea name="contentNotes" defaultValue={template.defaults.contentNotes} rows={3} />
                    </label>
                    <label className="spanFull">
                      Vídeos
                      <textarea name="exerciseVideoNotes" defaultValue={template.defaults.exerciseVideoNotes} rows={3} />
                    </label>
                    <label className="spanFull">
                      Nutrición
                      <textarea name="nutritionNotes" defaultValue={template.defaults.nutritionNotes} rows={3} />
                    </label>
                    <label className="spanFull">
                      Legal
                      <textarea name="legalNotes" defaultValue={template.defaults.legalNotes} rows={3} />
                    </label>
                    <label className="spanFull">
                      Lanzamiento
                      <textarea name="launchNotes" defaultValue={template.defaults.launchNotes} rows={3} />
                    </label>
                    <label className="spanFull">
                      Riesgos
                      <textarea name="internalRisks" defaultValue={template.defaults.internalRisks} rows={3} />
                    </label>
                    <button className="btn" type="submit">
                      Guardar defaults <Save size={16} />
                    </button>
                  </form>
                  </details>
                </section>
              </div>
            </article>
          );
        })}

        {templates.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Todavía no hay playbooks de entrega."
            text="Una plantilla define el checklist, los tiempos y el briefing inicial que se copian al proyecto al convertir un lead. Crea la primera para estandarizar cómo nace cada implantación."
          />
        ) : null}
      </section>
    </>
  );
}
