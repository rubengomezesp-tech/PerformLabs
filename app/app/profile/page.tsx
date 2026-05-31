import { AlertTriangle, Bell, CheckCircle2, ClipboardCheck, Dumbbell, Eye, EyeOff, Mail, MessageSquare, Moon, Ruler, ShieldCheck, Share2, Smartphone, Trash2, UserRound, Utensils } from "lucide-react";
import { ReferralCard } from "@/components/referral-card";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { goalLabel, getMemberProfileSummary, subscriptionStatusLabel } from "@/lib/repositories/member-profile";
import { type ReactNode } from "react";
import { getMemberNutritionVisibility } from "@/lib/repositories/nutrition-tracking";
import { getMemberNotificationPreferences, type NotificationKey } from "@/lib/repositories/notification-preferences";
import { deleteMemberAccountAction, setMemberMacroVisibilityAction, setMemberNotificationAction } from "./actions";

function NotifRow({ icon, label, hint, prefKey, on, workspaceId }: { icon: ReactNode; label: string; hint: string; prefKey: NotificationKey; on: boolean; workspaceId: string }) {
  return (
    <div className="notifRow">
      <span className="notifRowIcon uiIconChip" aria-hidden="true">{icon}</span>
      <div className="notifRowBody">
        <strong>{label}</strong>
        <span>{hint}</span>
      </div>
      <form action={setMemberNotificationAction} className="notifRowToggle">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="key" value={prefKey} />
        <input type="hidden" name="value" value={on ? "off" : "on"} />
        <button type="submit" role="switch" aria-checked={on} aria-label={`${label}: ${on ? "activado" : "desactivado"}`} className={on ? "notifSwitch on" : "notifSwitch"}>
          <span className="notifSwitchTrack" aria-hidden="true"><span className="notifSwitchKnob" /></span>
        </button>
      </form>
    </div>
  );
}

export default async function ProfilePage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error.trim() : "";
  const brand = await getSelectedMemberAppBrand();
  const [visibility, summary, notif] = await Promise.all([
    getMemberNutritionVisibility(brand.id),
    getMemberProfileSummary(brand.id),
    getMemberNotificationPreferences(brand.id),
  ]);

  const displayName = summary?.fullName || "Tu cuenta";
  const displayEmail = summary?.email || "Sin email registrado";
  const planLabel = subscriptionStatusLabel(summary?.subscriptionStatus);
  const planActive = summary?.subscriptionStatus === "active" || summary?.subscriptionStatus === "trialing";
  const objective = goalLabel(summary?.goal ?? summary?.trainingGoal) ?? "Sin definir";
  const mealsLabel = summary?.mealsPerDay ? `${summary.mealsPerDay}` : "Sin definir";
  const daysLabel = summary?.daysPerWeek ? `${summary.daysPerWeek} días/sem` : "Sin definir";
  const macrosLabel = summary?.hideMacros ? "Ocultos" : "Visibles";

  return (
    <>
      <Topbar
        eyebrow="Perfil"
        title="Datos, preferencias y privacidad."
        text={`Tu cuenta dentro de ${brand.name}: información básica, preferencias del plan y ajustes de comunicación.`}
      />
      {error ? (
        <div className="onboardingNotice" role="alert">
          <AlertTriangle size={18} />
          <div>
            <strong>No se pudo completar la acción.</strong>
            <span>{error}</span>
          </div>
        </div>
      ) : null}
      <section className="grid">
        <article className="card span12 profileHero uiGlass uiSheen uiFadeUp" style={{ ["--i" as string]: 0 }}>
          <span className="profileHeroAvatar" aria-hidden="true">{(displayName.trim()[0] || "U").toUpperCase()}</span>
          <div className="profileHeroBody">
            <span className="eyebrow">{brand.name}</span>
            <h2>{displayName}</h2>
            <p className="profileHeroEmail">{displayEmail}</p>
          </div>
          <div className="profileHeroMeta">
            <span className={`tag${planActive ? "" : " profileTagMuted"}`}>{planLabel}</span>
            <span className="tag">{objective}</span>
          </div>
        </article>
        <article className="card span4 profileInfoCard uiSheen uiFadeUp" style={{ ["--i" as string]: 0 }}>
          <span className="uiIconChip"><UserRound size={18} /></span>
          <h2>Cuenta</h2>
          <ul className="list">
            <li className="row">Nombre <strong>{displayName}</strong></li>
            <li className="row">Email <span className="profileEmail">{displayEmail}</span></li>
            <li className="row">Plan <span className={`tag${planActive ? "" : " profileTagMuted"}`}>{planLabel}</span></li>
          </ul>
        </article>
        <article className="card span4 profileInfoCard uiSheen uiFadeUp" style={{ ["--i" as string]: 1 }}>
          <span className="uiIconChip"><Ruler size={18} /></span>
          <h2>Preferencias</h2>
          <ul className="list">
            <li className="row">Objetivo <strong>{objective}</strong></li>
            <li className="row">Comidas/día <strong>{mealsLabel}</strong></li>
            <li className="row">Entrenos <strong>{daysLabel}</strong></li>
            <li className="row">Calorías y macros <span className="tag">{macrosLabel}</span></li>
          </ul>
        </article>
        <article className="card span4 profileInfoCard uiSheen uiFadeUp" style={{ ["--i" as string]: 2 }}>
          <span className="uiIconChip"><Bell size={18} /></span>
          <h2>Comunicación</h2>
          <ul className="list">
            <li className="row"><Mail size={16} /> Email <span className={`tag${summary?.email ? "" : " profileTagMuted"}`}>{summary?.email ? "Activo" : "Sin email"}</span></li>
            <li className="row"><Smartphone size={16} /> Push <span className="tag">Preparado</span></li>
            <li className="row">Check-ins <strong>Semanal</strong></li>
          </ul>
        </article>
        <article className="card span12 dietVisibilityCard">
          <div className="sectionHeader">
            <div>
              {visibility.hideMacros ? <EyeOff color="var(--gold)" /> : <Eye color="var(--gold)" />}
              <h2>Calorías y macros.</h2>
              <p>Decide si quieres ver los números (proteínas, grasas, carbos y calorías) en tu plan, recetas y diario, o una experiencia limpia centrada en cumplir.</p>
            </div>
            <span className="tag">{visibility.hideMacros ? "Ocultos" : "Visibles"}</span>
          </div>
          <form action={setMemberMacroVisibilityAction} className="dietVisibilityForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <input name="hideMacros" type="hidden" value={visibility.hideMacros ? "off" : "on"} />
            <p className="muted">
              {visibility.hideMacros
                ? "Ahora mismo no ves números de macros en tu área."
                : "Ahora mismo ves calorías y macros en tu área."}
            </p>
            <button className="btn" type="submit">
              {visibility.hideMacros ? <><Eye size={16} /> Mostrar calorías y macros</> : <><EyeOff size={16} /> Ocultar calorías y macros</>}
            </button>
          </form>
        </article>

        <article className="card span12 notificationPreferenceCard">
          <div className="sectionHeader">
            <div>
              <Smartphone color="var(--gold)" />
              <h2>Recordatorios inteligentes.</h2>
              <p>Elige cómo quieres recibir los avisos importantes de tu coach, entrenos, comidas y progreso.</p>
            </div>
            <span className="tag">Control del cliente</span>
          </div>
          <div className="notifList">
            <NotifRow icon={<CheckCircle2 size={17} />} label="Cambios del coach" hint="Cuando tu coach ajusta tu plan o nutrición" prefKey="coach_changes" on={notif.coach_changes} workspaceId={brand.id} />
            <NotifRow icon={<Dumbbell size={17} />} label="Recordatorio de entreno" hint="Aviso el día de tu sesión" prefKey="workout_reminders" on={notif.workout_reminders} workspaceId={brand.id} />
            <NotifRow icon={<Utensils size={17} />} label="Recordatorio de comidas" hint="Para no saltarte tus registros" prefKey="meal_reminders" on={notif.meal_reminders} workspaceId={brand.id} />
            <NotifRow icon={<ClipboardCheck size={17} />} label="Check-in semanal" hint="Recordatorio para enviar tu progreso" prefKey="checkin_reminders" on={notif.checkin_reminders} workspaceId={brand.id} />
            <NotifRow icon={<MessageSquare size={17} />} label="Mensajes in-app" hint="Avisos de mensajes de tu coach" prefKey="in_app_messages" on={notif.in_app_messages} workspaceId={brand.id} />
            <NotifRow icon={<Moon size={17} />} label="Modo descanso" hint="Silencia los avisos por la noche" prefKey="quiet_mode" on={notif.quiet_mode} workspaceId={brand.id} />
          </div>
        </article>
        <article className="card span12">
          <div className="sectionHeader">
            <div>
              <Share2 color="var(--gold)" />
              <h2>Invita a un amigo.</h2>
              <p>Comparte tu enlace de {brand.name}. Quien lo use solicitará acceso y tu coach verá que llega por tu invitación.</p>
            </div>
          </div>
          <ReferralCard refCode={brand.id} appName={brand.appName ?? brand.name} />
        </article>

        <article className="card span12">
          <ShieldCheck color="var(--gold)" />
          <h2>Privacidad y seguridad</h2>
          <p>Tus datos son tuyos. Aquí puedes dar de baja tu cuenta de forma permanente. La exportación de datos y el consentimiento legal avanzado llegarán pronto.</p>
        </article>

        <article className="card span12 dangerZoneCard">
          <div className="sectionHeader">
            <div>
              <span className="dangerZoneChip"><Trash2 size={18} /></span>
              <h2>Eliminar mi cuenta</h2>
              <p>
                Borra de forma <strong>permanente</strong> tu cuenta y todos tus datos en {brand.name}: plan de
                entreno y nutrición, progreso, hábitos, check-ins, diario, mensajes y preferencias. Esta acción
                <strong> no se puede deshacer</strong> y tendrás que volver a empezar si regresas.
              </p>
            </div>
          </div>
          <form action={deleteMemberAccountAction} className="dangerZoneForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <label className="dangerZoneConfirm">
              Para confirmar, escribe <strong>ELIMINAR</strong>
              <input name="confirm" autoComplete="off" placeholder="ELIMINAR" aria-label="Escribe ELIMINAR para confirmar" />
            </label>
            <button className="btn danger dangerZoneSubmit" type="submit">
              <Trash2 size={16} /> Eliminar mi cuenta para siempre
            </button>
          </form>
        </article>
      </section>
    </>
  );
}
