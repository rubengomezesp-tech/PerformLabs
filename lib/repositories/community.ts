import { getSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export type CommunityPost = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  mine: boolean;
};

function isUuid(value?: string | null): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getDefaultMember(workspaceId: string) {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("member_profiles")
    .select("id,full_name")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function listCommunityPosts(workspaceId?: string): Promise<CommunityPost[]> {
  const env = getSupabaseServiceEnv();
  if (!env.ok || !isUuid(workspaceId)) return [];

  const supabase = createServiceSupabaseClient();
  const member = await getDefaultMember(workspaceId);

  const postsResult = await (supabase as any)
    .from("community_posts")
    .select("id,author_name,body,created_at,member_profile_id")
    .eq("workspace_id", workspaceId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (postsResult.error || !postsResult.data?.length) return [];

  const postIds = postsResult.data.map((post: { id: string }) => post.id);
  const likesResult = await (supabase as any)
    .from("community_post_likes")
    .select("post_id,member_profile_id")
    .in("post_id", postIds);

  const countByPost = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const like of likesResult.data ?? []) {
    countByPost.set(like.post_id, (countByPost.get(like.post_id) ?? 0) + 1);
    if (member && like.member_profile_id === member.id) likedByMe.add(like.post_id);
  }

  return postsResult.data.map((post: { id: string; author_name: string; body: string; created_at: string; member_profile_id: string | null }) => ({
    id: post.id,
    authorName: post.author_name || "Miembro",
    body: post.body,
    createdAt: post.created_at,
    likeCount: countByPost.get(post.id) ?? 0,
    likedByMe: likedByMe.has(post.id),
    mine: Boolean(member && post.member_profile_id === member.id),
  }));
}

export async function createCommunityPost(workspaceId: string, body: string) {
  if (!isUuid(workspaceId)) throw new Error("No se pudo identificar la app del cliente.");
  const text = body.trim();
  if (!text) throw new Error("Escribe algo para publicar.");

  const supabase = createServiceSupabaseClient();
  const member = await getDefaultMember(workspaceId);

  const { error } = await (supabase as any).from("community_posts").insert({
    workspace_id: workspaceId,
    member_profile_id: member?.id ?? null,
    author_name: member?.full_name || "Miembro",
    body: text.slice(0, 2000),
  });
  if (error) throw new Error(`No se pudo publicar: ${error.message}`);
}

export async function toggleCommunityLike(workspaceId: string, postId: string) {
  if (!isUuid(workspaceId) || !isUuid(postId)) throw new Error("Publicación no válida.");
  const supabase = createServiceSupabaseClient();
  const member = await getDefaultMember(workspaceId);
  if (!member) throw new Error("Todavía no hay perfil de cliente.");

  const existing = await (supabase as any)
    .from("community_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("member_profile_id", member.id)
    .maybeSingle();

  if (existing.data?.id) {
    const { error } = await (supabase as any).from("community_post_likes").delete().eq("id", existing.data.id);
    if (error) throw new Error(`No se pudo actualizar el like: ${error.message}`);
    return { liked: false };
  }

  const { error } = await (supabase as any).from("community_post_likes").insert({
    post_id: postId,
    member_profile_id: member.id,
    workspace_id: workspaceId,
  });
  if (error) throw new Error(`No se pudo dar like: ${error.message}`);
  return { liked: true };
}

export async function deleteCommunityPost(workspaceId: string, postId: string) {
  if (!isUuid(workspaceId) || !isUuid(postId)) throw new Error("Publicación no válida.");
  const supabase = createServiceSupabaseClient();
  const member = await getDefaultMember(workspaceId);
  if (!member) throw new Error("Todavía no hay perfil de cliente.");

  const { error } = await (supabase as any)
    .from("community_posts")
    .delete()
    .eq("id", postId)
    .eq("member_profile_id", member.id);
  if (error) throw new Error(`No se pudo eliminar: ${error.message}`);
}
