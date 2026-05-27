import { AlertTriangle, BadgeCheck, Compass, Flag, Layers3, Radar, ShieldCheck, Sparkles } from "lucide-react";
import { Topbar } from "@/components/topbar";
import {
  auditFindings,
  competitorInsights,
  macroactiveOperatingModel,
  priorityOpportunities,
  productArchitecture,
} from "@/lib/product/competitive-intelligence";

const statusLabels = {
  base: "Base creada",
  next: "Siguiente",
  later: "Fase posterior",
};

const statusClassNames = {
  base: "tag",
  next: "tag strategyNext",
  later: "tag strategyLater",
};

export default function StrategyPage() {
  const baseModules = productArchitecture.filter((module) => module.status === "base").length;
  const nextModules = productArchitecture.filter((module) => module.status === "next").length;
  const laterModules = productArchitecture.filter((module) => module.status === "later").length;

  return (
    <>
      <Topbar
        eyebrow="Estrategia"
        title="Base competitiva y arquitectura de producto."
        text="MacroActive marca el listón premium: propiedad, marca, onboarding guiado, automatización y soporte. Esta página convierte la investigación en decisiones de producto."
      />

      <section className="grid">
        <article className="card span4 strategyHeroCard">
          <Radar color="var(--gold)" />
          <h2>Modelo ganador</h2>
          <p>Vender resultado, control y acompañamiento. La app es el vehículo; la implantación es el producto premium.</p>
        </article>
        <article className="card span4">
          <p className="metric">Módulos base<strong>{baseModules}</strong></p>
          <p>Ya tenemos el esqueleto de venta, CRM, proyectos, plantillas, marcas y app cliente.</p>
        </article>
        <article className="card span4">
          <p className="metric">Próximos módulos<strong>{nextModules}</strong></p>
          <p>Contenido real, fitness builder, nutrición y QA de lanzamiento deben ir antes de añadir ruido.</p>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">MacroActive desarmado</span>
              <h2>Cómo actúa el competidor premium.</h2>
              <p>Lo importante no es copiar pantallas, sino entender el sistema comercial y operativo que genera confianza.</p>
            </div>
          </div>
          <div className="strategyGrid">
            {macroactiveOperatingModel.map((item) => (
              <article className="strategyTile" key={item.title}>
                <BadgeCheck color="var(--gold)" />
                <h3>{item.title}</h3>
                <p>{item.insight}</p>
                <strong>{item.buildForUs}</strong>
              </article>
            ))}
          </div>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Competencia</span>
              <h2>Mapa competitivo.</h2>
              <p>Directos premium, SaaS self-serve, apps todo-en-uno y plataformas enterprise.</p>
            </div>
          </div>
          <div className="competitorMatrix">
            {competitorInsights.map((competitor) => (
              <article className="competitorCard" key={competitor.name}>
                <div className="competitorHeader">
                  <div>
                    <h3>{competitor.name}</h3>
                    <span>{competitor.category}</span>
                  </div>
                  <span className="tag">{competitor.pricingSignal}</span>
                </div>
                <p>{competitor.positioning}</p>
                <div className="strategyColumns">
                  <div>
                    <strong>Hace bien</strong>
                    <ul>
                      {competitor.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Debilidad</strong>
                    <ul>
                      {competitor.weaknesses.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="opportunityNote">
                  <Sparkles size={16} />
                  {competitor.opportunity}
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="card span6">
          <Compass color="var(--gold)" />
          <h2>Oportunidades prioritarias</h2>
          <ul className="priorityList">
            {priorityOpportunities.map((item) => (
              <li key={item}>
                <Flag size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card span6">
          <AlertTriangle color="var(--gold)" />
          <h2>Problemas actuales</h2>
          <div className="auditList">
            {auditFindings.map((finding) => (
              <article className="auditItem" key={finding.finding}>
                <span className={finding.severity === "Alta" ? "tag danger" : "tag"}>{finding.severity}</span>
                <strong>{finding.finding}</strong>
                <p>{finding.fix}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Arquitectura</span>
              <h2>Módulos para el producto final.</h2>
              <p>La prioridad es convertir la promesa comercial en operación editable y medible.</p>
            </div>
            <div className="actions">
              <span className="tag">{baseModules} base</span>
              <span className="tag strategyNext">{nextModules} next</span>
              <span className="tag strategyLater">{laterModules} later</span>
            </div>
          </div>
          <div className="moduleRoadmap">
            {productArchitecture.map((item) => (
              <article className="roadmapItem" key={`${item.area}-${item.module}`}>
                <div>
                  <span>{item.area}</span>
                  <h3>{item.module}</h3>
                  <p>{item.purpose}</p>
                </div>
                <span className={statusClassNames[item.status]}>{statusLabels[item.status]}</span>
              </article>
            ))}
          </div>
        </article>

        <article className="card span12 launchCard">
          <ShieldCheck color="var(--gold)" />
          <h2>Principio de construcción</h2>
          <p>
            No copiamos a MacroActive: absorbemos el sistema que funciona y lo elevamos con más claridad,
            menos fricción, más control visual del proceso y una consola donde cada app se pueda configurar sin depender de terceros.
          </p>
        </article>
      </section>
    </>
  );
}
