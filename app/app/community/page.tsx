import { Heart, MessageSquare, Pin, Send, Sparkles, Trash2 } from "lucide-react";
import { MemberEmpty } from "@/components/member-empty";
import { SubmitButton } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { getSelectedMemberAppBrand } from "@/lib/member-app";
import { listCommunityPosts } from "@/lib/repositories/community";
import { createCommunityPostAction, deleteCommunityPostAction, toggleCommunityLikeAction } from "./actions";

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

export default async function MemberCommunityPage() {
  const brand = await getSelectedMemberAppBrand();
  const posts = await listCommunityPosts(brand.id);

  return (
    <>
      <Topbar
        eyebrow="Comunidad"
        title="La comunidad de tu marca."
        text="Comparte tus avances, pregunta y motívate con el resto. Lo que se celebra, se repite."
      />
      <section className="grid">
        <article className="card span12 communityComposer uiGlass uiSheen">
          <form action={createCommunityPostAction} className="communityComposerForm">
            <input name="workspaceId" type="hidden" value={brand.id} />
            <div className="communityComposerRow">
              <span className="communityAvatar communityAvatarMe" aria-hidden="true">{initials(brand.name)}</span>
              <textarea name="body" rows={3} required placeholder="¿Cómo va tu semana? Comparte un logro, una duda o un tip…" />
            </div>
            <SubmitButton variant="primary"><Send size={16} /> Publicar</SubmitButton>
          </form>
        </article>

        {posts.length ? (
          <div className="span12 communityFeed">
            {posts.map((post, idx) => (
              <article className={`${post.isCoach ? "card communityPost coachPost" : "card communityPost"} uiFadeUp`} style={{ ["--i" as string]: idx }} key={post.id}>
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
                  {post.mine ? (
                    <form action={deleteCommunityPostAction} className="communityDelete">
                      <input name="workspaceId" type="hidden" value={brand.id} />
                      <input name="postId" type="hidden" value={post.id} />
                      <button type="submit" aria-label="Eliminar"><Trash2 size={15} /></button>
                    </form>
                  ) : null}
                </div>
                <p className="communityBody">{post.body}</p>
                <form action={toggleCommunityLikeAction} className="communityLikeForm">
                  <input name="workspaceId" type="hidden" value={brand.id} />
                  <input name="postId" type="hidden" value={post.id} />
                  <button className={post.likedByMe ? "communityLike liked" : "communityLike"} type="submit" aria-label="Me gusta">
                    <Heart size={16} fill={post.likedByMe ? "currentColor" : "none"} /> {post.likeCount > 0 ? post.likeCount : ""}
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <MemberEmpty
            icon={MessageSquare}
            title="Sé el primero en publicar."
            text="Comparte tu primer avance y arranca la comunidad de tu marca."
          />
        )}
      </section>
    </>
  );
}
