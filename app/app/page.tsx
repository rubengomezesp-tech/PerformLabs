import { ArrowRight, Bell, Camera, Check, ChevronRight, Droplets, Dumbbell, Footprints, Moon, Play, Soup, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listWorkspaceProducts } from "@/lib/repositories/member-experience";

const todayPlan = [
  { icon: Dumbbell, label: "Push hipertrofia", detail: "58 min · 7 ejercicios", href: "/app/workouts" },
  { icon: Soup, label: "Comida principal", detail: "780 kcal · 58 g proteína", href: "/app/meals" },
  { icon: Camera, label: "Check-in semanal", detail: "Fotos y peso pendiente", href: "/app/progress" },
];

export default async function MemberDashboard() {
  const brand = await getSelectedMemberAppBrand();
  const products = await listWorkspaceProducts(brand.id);

  return (
    <>
      <Topbar
        eyebrow="Panel de miembro"
        title={`Bienvenido a ${brand.appName}.`}
        text={`Tu espacio de ${brand.name}: entrenamiento, nutrición, progreso y soporte en una sola experiencia.`}
      />
      <section className="grid">
        <article className="span8 memberHeroCard">
          <div className="memberHero">
            <div>
              <span className="eyebrow">{brand.appName}</span>
              <h1>Tu siguiente sesión está lista.</h1>
              <p>{brand.name} reúne tu entrenamiento, comidas, progreso y soporte para que solo tengas que ejecutar el plan de hoy.</p>
              <div className="actions">
                <Link className="btn primary" href="/app/workouts">
                  Empezar entreno <Play size={18} />
                </Link>
                <Link className="btn" href="/app/onboarding">
                  Revisar inicio <ArrowRight size={18} />
                </Link>
              </div>
            </div>
            <div className="memberHeroStats">
              <span>
                Adherencia
                <strong>86%</strong>
              </span>
              <span>
                Semana
                <strong>4/12</strong>
              </span>
              <span>
                Racha
                <strong>6 días</strong>
              </span>
            </div>
            <div className="memberHeroSignal">
              <span className="tag">Plan activo</span>
              <strong>Transformación 12 semanas</strong>
              <p>Entreno, nutrición y check-ins sincronizados con tu coach.</p>
            </div>
          </div>
        </article>

        <article className="card span4 memberProgressCard motionCard">
          <TrendingUp color="var(--gold)" />
          <h2>Mi recorrido</h2>
          <div className="progressTrack" aria-label="Progreso semanal">
            <span style={{ width: "68%" }} />
          </div>
          <div className="memberStatsGrid">
            <span>Foto <strong>Pendiente</strong></span>
            <span>Peso <strong>54.0 kg</strong></span>
            <span>Grasa <strong>16%</strong></span>
          </div>
          <Link className="btn primary fullWidth" href="/app/progress">
            Registrar progreso <Camera size={18} />
          </Link>
        </article>

        <article className="card span7 memberTodayCard motionCard">
          <div className="sectionHeader">
            <div>
              <h2>Hoy</h2>
              <p>Lo importante aparece primero para que no tengas que buscar dentro de la app.</p>
            </div>
            <span className="tag">3 acciones</span>
          </div>
          <div className="memberActionList">
            {todayPlan.map((item) => {
              const Icon = item.icon;
              return (
                <Link className="memberAction" href={item.href} key={item.label}>
                  <span className="memberActionIcon"><Icon size={18} /></span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <ChevronRight size={18} />
                </Link>
              );
            })}
          </div>
        </article>

        <article className="card span5 motionCard">
          <h2>Hábitos de hoy</h2>
          <ul className="list">
            <li className="row"><Droplets size={18} /> Beber 2 litros de agua <Check color="var(--green)" /></li>
            <li className="row"><Footprints size={18} /> Caminar 30 minutos <span className="tag">Abrir</span></li>
            <li className="row"><Moon size={18} /> Dormir 8 horas <span className="tag">Noche</span></li>
          </ul>
        </article>

        <article className="card span5 motionCard memberAlertCard">
          <Bell color="var(--gold)" />
          <h2>Avisos del coach</h2>
          <p>Los cambios importantes aparecen aquí para que no se pierdan entre chats o emails.</p>
          <ul className="list compactList">
            <li className="row">Revisión semanal <span className="tag">Viernes</span></li>
            <li className="row">Recordatorio entreno <span className="tag">10:00</span></li>
          </ul>
        </article>

        <article className="card span6 memberCoachCard motionCard">
          <h2>Actualización de plan</h2>
          <p>
            Tras completar el check-in, el coach puede revisar medidas, fotos,
            preferencias y generar una nueva versión del plan.
          </p>
          <div className="actions">
            <Link className="btn" href="/app/onboarding">Completar inicio</Link>
            <button className="btn" type="button">Solicitar actualización</button>
          </div>
        </article>
        {products.map((product) => (
          <article className="card span6 memberProgramCard motionCard" key={product.id}>
            <span className="tag">Programa</span>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <div className="tagCloud">
              {product.includedModules.map((module) => (
                <span className="tag" key={module}>{module}</span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
