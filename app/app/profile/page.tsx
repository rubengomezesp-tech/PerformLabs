import { Bell, CheckCircle2, ClipboardCheck, Clock3, Dumbbell, Eye, EyeOff, History, Mail, MessageSquare, Moon, Ruler, ShieldCheck, Smartphone, TicketCheck, Trash2, UserRound, Utensils } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { getLocale } from "@/lib/i18n/server";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { goalLabel, getMemberProfileSummary, subscriptionStatusLabel } from "@/lib/repositories/member-profile";
import { getMemberSessionBalance, type SessionLedgerEventType } from "@/lib/repositories/session-credits";
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

export default async function ProfilePage() {
  const brand = await getSelectedMemberAppBrand();
  const [visibility, summary, notif, sessionBalance, locale] = await Promise.all([
    getMemberNutritionVisibility(brand.id),
    getMemberProfileSummary(brand.id),
    getMemberNotificationPreferences(brand.id),
    getMemberSessionBalance(brand.id),
    getLocale(),
  ]);

  const isEnglish = locale === "en";
  const sessionCopy = isEnglish ? {
    eyebrow: "Personal training",
    title: "Your sessions",
    available: "sessions available",
    reserved: "reserved",
    used: "used",
    granted: "purchased or credited",
    nextExpiry: "Next expiry",
    noExpiry: "No expiry",
    activePacks: "Active packs",
    history: "Recent activity",
    emptyTitle: "You do not have sessions yet",
    emptyText: "When you purchase a pack or your coach adds sessions, your balance will appear here automatically.",
    remaining: "remaining",
    of: "of",
  } : {
    eyebrow: "Entrenamiento personal",
    title: "Tus sesiones",
    available: "sesiones disponibles",
    reserved: "reservadas",
    used: "utilizadas",
    granted: "compradas o abonadas",
    nextExpiry: "Próxima caducidad",
    noExpiry: "Sin caducidad",
    activePacks: "Bonos activos",
    history: "Actividad reciente",
    emptyTitle: "Todavía no tienes sesiones",
    emptyText: "Cuando compres un bono o tu coach añada sesiones, el saldo aparecerá aquí automáticamente.",
    remaining: "restantes",
    of: "de",
  };
  const movementLabels: Record<SessionLedgerEventType, string> = isEnglish ? {
    purchase: "Pack purchased",
    session_used: "Session completed",
    coach_credit: "Coach credit",
    coach_debit: "Coach adjustment",
    refund: "Refund",
    pack_assigned: "Pack assigned",
    void: "Pack voided",
  } : {
    purchase: "Bono comprado",
    session_used: "Entrenamiento realizado",
    coach_credit: "Abono del coach",
    coach_debit: "Ajuste del coach",
    refund: "Reembolso",
    pack_assigned: "Bono asignado",
    void: "Bono anulado",
  };
  const dateFormatter = new Intl.DateTimeFormat(isEnglish ? "en-US" : "es-ES", { day: "numeric", month: "short", year: "numeric" });
  const activePacks = sessionBalance.packs.filter((pack) => pack.status === "active" && pack.remaining > 0);

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
        <article className="card span12 sessionWalletCard uiSheen uiFadeUp" style={{ ["--i" as string]: 1 }}>
          <div className="sessionWalletHeader">
            <div>
              <span className="uiIconChip"><TicketCheck size={19} /></span>
              <div>
                <span className="eyebrow">{sessionCopy.eyebrow}</span>
                <h2>{sessionCopy.title}</h2>
              </div>
            </div>
            <span className="sessionWalletLive"><span aria-hidden="true" /> {isEnglish ? "Live balance" : "Saldo en tiempo real"}</span>
          </div>

          {sessionBalance.remaining > 0 ? (
            <div className="sessionWalletGrid">
              <div className="sessionWalletBalance">
                <strong>{sessionBalance.available}</strong>
                <span>{sessionCopy.available}</span>
                <dl>
                  <div><dt>{sessionCopy.used}</dt><dd>{sessionBalance.totalUsed}</dd></div>
                  <div><dt>{sessionCopy.reserved}</dt><dd>{sessionBalance.reserved}</dd></div>
                  <div><dt>{sessionCopy.granted}</dt><dd>{sessionBalance.totalGranted}</dd></div>
                  <div><dt>{sessionCopy.nextExpiry}</dt><dd>{sessionBalance.nextExpiryAt ? dateFormatter.format(new Date(sessionBalance.nextExpiryAt)) : sessionCopy.noExpiry}</dd></div>
                </dl>
              </div>
              <div className="sessionWalletPacks">
                <h3>{sessionCopy.activePacks}</h3>
                {activePacks.map((pack) => {
                  const percent = Math.max(0, Math.min(100, (pack.remaining / pack.total) * 100));
                  return (
                    <div className="sessionPackRow" key={pack.id}>
                      <div><strong>{pack.remaining} {sessionCopy.of} {pack.total}</strong><span>{sessionCopy.remaining}</span></div>
                      <div className="sessionPackTrack" aria-label={`${pack.remaining} ${sessionCopy.of} ${pack.total}`}><span style={{ width: `${percent}%` }} /></div>
                      <small><Clock3 size={13} /> {pack.expiresAt ? dateFormatter.format(new Date(pack.expiresAt)) : sessionCopy.noExpiry}</small>
                    </div>
                  );
                })}
              </div>
              <div className="sessionWalletHistory">
                <h3><History size={16} /> {sessionCopy.history}</h3>
                <ul>
                  {sessionBalance.movements.slice(0, 4).map((movement) => (
                    <li key={movement.id}>
                      <span className={movement.delta > 0 ? "positive" : "negative"}>{movement.delta > 0 ? "+" : ""}{movement.delta}</span>
                      <div><strong>{movementLabels[movement.eventType]}</strong><small>{dateFormatter.format(new Date(movement.createdAt))}{movement.note ? ` · ${movement.note}` : ""}</small></div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="sessionWalletEmpty">
              <TicketCheck size={28} />
              <div><strong>{sessionCopy.emptyTitle}</strong><p>{sessionCopy.emptyText}</p></div>
            </div>
          )}
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
