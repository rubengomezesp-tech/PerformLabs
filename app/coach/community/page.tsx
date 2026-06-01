import { Heart, Megaphone, MessageSquare, Pin, PinOff, Sparkles, Trash2, Users } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { SubmitButton } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listCommunityModeration } from "@/lib/repositories/community";
import {
  createCoachAnnouncementAction,
  moderateDeleteCommunityPostAction,
  toggleCommunityPinAction,
} from "./actions";

export const dynamic = "force-dynamic";

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days < 7 ? `hace ${days} d` : new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "M";
}

export default async function CoachCommunityPage() {
  const brand = await getSelectedMemberAppBrand();
  const { posts, stats } = await listCommunityModeration(brand.id);

  return (
    <>
      <Topbar
        eyebrow="Comunidad"
        title="Tu comunidad, moderada por ti."
        text="Publica anuncios oficiales, fija lo importante y modera lo que comparten tus clientes. La comunidad activa es lo que dispara la retención."
      />
      <section className="grid">
        <article className="card span3 motionCard">
          <p className="metric">Publicaciones<strong>{stats.totalPosts}</strong></p>
          <p>Mensajes activos en el feed de tu marca.</p>
        </article>
        <article className="card span3 motionCard">
          <p className="metric">Clientes activos<strong>{stats.activeMembers}</strong></p>
          <p>Miembros que ya han participado.</p>
        </article>
        <article className="card span3 motionCard">
          <p className="metric">Tus anuncios<strong>{stats.coachPosts}</strong></p>
          <p>Comunicados oficiales publicados.</p>
        </article>
        <article className="card span3 motionCard">
          <p className="metric">Reacciones<strong>{stats.totalLikes}</strong></p>
          <p>Likes acumulados en la comunidad.</p>
        </article>

        <article className="card span12 communityComposer">
          <div className="sectionHeader">
            <div>
              <Megaphone color="var(--accent)" aria-hidden="true" />
              <h2>Publicar anuncio oficial.</h2>
              <p>Aparece destacado y fijado arriba en la app de tus clientes. Úsalo para retos, novedades o motivación de la semana.</p>
            </div>
            <span className="tag">{brand.appName}</span>
          </div>
          <form action={createCoachAnnouncementAction} className="communityComposerForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <input name="authorName" type="hidden" value={brand.name} />
            <textarea name="body" rows={3} required placeholder="Escribe tu anuncio para toda la comunidad…" />
            <SubmitButton variant="primary" successToast="Anuncio publicado"><Megaphone size={16} /> Publicar anuncio</SubmitButton>
          </form>
        </article>

        {posts.length ? (
          <div className="span12 communityFeed">
            {posts.map((post) => (
              <article className={post.isCoach ? "card communityPost coachPost" : "card communityPost"} key={post.id}>
                <div className="communityPostHead">
                  <span className={post.isCoach ? "communityAvatar coach" : "communityAvatar"}>
                    {post.isCoach ? <Sparkles size={16} /> : initials(post.authorName)}
                  </span>
                  <div>
                    <strong>
                      {post.authorName}
                      {post.isCoach ? <span className="coachBadge">Coach</span> : null}
                      {post.pinned ? <span className="pinnedBadge"><Pin size={11} /> Fijado</span> : null}
                    </strong>
                    <small>{timeAgo(post.createdAt)}</small>
                  </div>
                  <div className="communityModActions">
                    <form action={toggleCommunityPinAction}>
                      <input name="workspaceId" type="hidden" value={brand.id} />
                      <input name="postId" type="hidden" value={post.id} />
                      <button type="submit" aria-label={post.pinned ? "Dejar de fijar" : "Fijar"} title={post.pinned ? "Dejar de fijar" : "Fijar arriba"}>
                        {post.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                      </button>
                    </form>
                    <Dialog
                      triggerClassName="danger"
                      triggerAriaLabel="Eliminar publicación"
                      trigger={<Trash2 size={15} />}
                      title="Eliminar publicación"
                      description="Esta acción no se puede deshacer."
                    >
                      <form action={moderateDeleteCommunityPostAction} className="editForm">
                        <input name="workspaceId" type="hidden" value={brand.id} />
                        <input name="postId" type="hidden" value={post.id} />
                        <p className="spanFull">¿Seguro que quieres eliminar esta publicación de <strong>{post.authorName}</strong>? Esta acción no se puede deshacer.</p>
                        <button className="btn danger spanFull" type="submit">Sí, eliminar</button>
                      </form>
                    </Dialog>
                  </div>
                </div>
                <p className="communityBody">{post.body}</p>
                <small className="communityMeta"><Heart size={13} /> {post.likeCount} {post.likeCount === 1 ? "reacción" : "reacciones"}</small>
              </article>
            ))}
          </div>
        ) : (
          <article className="card span12 inlineEmpty">
            <MessageSquare color="var(--accent)" aria-hidden="true" />
            <strong>Aún no hay actividad en tu comunidad.</strong>
            <p>Publica el primer anuncio para arrancar la conversación con tus clientes.</p>
          </article>
        )}
      </section>
    </>
  );
}
