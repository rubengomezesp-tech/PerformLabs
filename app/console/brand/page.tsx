import { Check, Palette, Save, Settings, Smartphone } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { appSettingDefinitions, type AppSettingDefinition } from "@/lib/domain/platform-logic";
import { getBrandSettings } from "@/lib/repositories/brand-settings";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import { saveBrandSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

type BrandPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

const groupLabels: Record<string, { title: string; text: string }> = {
  general: {
    title: "Identidad",
    text: "Logo, soporte, enlaces públicos y ajustes visibles de la experiencia.",
  },
  pwa: {
    title: "App instalable",
    text: "Nombre, descripción y colores de la experiencia móvil.",
  },
  subscription: {
    title: "Onboarding",
    text: "Reglas iniciales de medición, edad, activación y pausa.",
  },
  fitness: {
    title: "Entrenamiento",
    text: "Opciones de swaps, audio, lesiones y registro de sesiones.",
  },
  nutrition: {
    title: "Nutrición",
    text: "Preferencias, alergias, visibilidad de plan y ajustes del cliente.",
  },
};

function getInputType(setting: AppSettingDefinition) {
  if (setting.valueType === "url") return "url";
  if (setting.valueType === "number") return "number";
  if (setting.valueType === "color") return "color";
  return "text";
}

function renderSettingInput(setting: AppSettingDefinition, value: unknown) {
  if (setting.valueType === "boolean") {
    return (
      <label className="toggleRow">
        <span>{setting.label}</span>
        <input
          defaultChecked={value === true}
          name={`setting:${setting.key}`}
          type="checkbox"
          value="true"
        />
      </label>
    );
  }

  if (setting.valueType === "select") {
    const options = setting.key.includes("measurement")
      ? ["metric", "imperial"]
      : setting.key.includes("gender")
        ? ["not_set", "male", "female"]
        : ["default"];

    return (
      <label>
        {setting.label}
        <select name={`setting:${setting.key}`} defaultValue={String(value ?? setting.defaultValue)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label>
      {setting.label}
      <input
        name={`setting:${setting.key}`}
        type={getInputType(setting)}
        defaultValue={String(value ?? setting.defaultValue)}
      />
    </label>
  );
}

export default async function BrandPage({ searchParams }: BrandPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const settings = await getBrandSettings(selectedWorkspace?.id ?? "");
  const groupedSettings = Object.entries(
    Object.groupBy(appSettingDefinitions, (setting) => setting.group),
  );

  return (
    <>
      <Topbar
        eyebrow="Implantación"
        title="Panel interno de configuración de marca."
        text="Herramienta de trabajo para que nuestro equipo prepare identidad, app instalable, onboarding, entrenamiento y nutrición antes de entregar el proyecto al cliente."
        actions={
          <a className="btn primary" href="#guardar-configuracion">
            Guardar cambios <Save size={18} />
          </a>
        }
      />
      <section className="grid">
        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <Palette color="var(--gold)" />
              <h2>Marca seleccionada</h2>
              <p>Selecciona el proyecto que nuestro equipo está preparando para el cliente.</p>
            </div>
            <span className="tag">{settings.source === "database" ? "Configuración guardada" : "Valores iniciales"}</span>
          </div>
          <form className="formGrid" action="/console/brand" method="get">
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
              <button className="btn" type="submit">
                Ver configuración <Settings size={18} />
              </button>
            </div>
          </form>
        </article>

        {selectedWorkspace ? (
          <>
            <article className="card span4">
              <Smartphone color="var(--gold)" />
              <h2>{selectedWorkspace.name}</h2>
              <p>{selectedWorkspace.domain}</p>
              <ul className="list">
                <li className="row">App <strong>{selectedWorkspace.appName}</strong></li>
                <li className="row">Soporte <span>{selectedWorkspace.supportEmail || "Pendiente"}</span></li>
                <li className="row">Estado <span className={selectedWorkspace.isActive ? "tag" : "tag danger"}>{selectedWorkspace.status}</span></li>
              </ul>
            </article>

            <article className="card span8">
              <h2>Vista rápida</h2>
              <div className="brandPreview" style={{ borderColor: selectedWorkspace.accentColor }}>
                <span className="brandMark" style={{ borderColor: selectedWorkspace.accentColor, color: selectedWorkspace.accentColor }}>
                  {selectedWorkspace.appName.slice(0, 3).toUpperCase()}
                </span>
                <div>
                  <strong>{selectedWorkspace.appName}</strong>
              <p>Experiencia móvil preparada por nuestro equipo para clientes, planes y progreso.</p>
                </div>
                <Check color="var(--green)" />
              </div>
            </article>

            <form action={saveBrandSettingsAction} className="span12 settingsForm" id="guardar-configuracion">
              <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
              {groupedSettings.map(([group, definitions], index) => {
                const copy = groupLabels[group] ?? { title: group, text: "Configuración avanzada de marca." };

                return (
                  <details className="editDetails settingsGroup noTopRule" key={group} open={index === 0}>
                    <summary className="settingsGroupSummary">
                      <span>
                        <strong>{copy.title}</strong>
                        <small>{copy.text}</small>
                      </span>
                      <span className="tag neutral">{(definitions ?? []).length}</span>
                    </summary>
                    <div className="settingsGrid">
                      {(definitions ?? []).map((setting) => (
                        <div key={setting.key}>
                          {renderSettingInput(setting, settings.values[setting.key])}
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}
              <div className="saveBar">
                <button className="btn primary" type="submit">
                  Guardar configuración <Save size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <article className="card span12">
            <h2>No hay marcas todavía</h2>
            <p>Crea la primera marca para empezar a configurar la experiencia.</p>
          </article>
        )}
      </section>
    </>
  );
}
