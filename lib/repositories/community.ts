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
  isCoach: boolean;
  pinned: boolean;
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
    .select("id,author_name,body,created_at,member_profile_id,is_coach,pinned")
    .eq("workspace_id", workspaceId)
    .eq("status", "published")
    .order("pinned", { ascending: false })
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

  return postsResult.data.map((post: { id: string; author_name: string; body: string; created_at: string; member_profile_id: string | null; is_coach: boolean | null; pinned: boolean | null }) => ({
    id: post.id,
    authorName: post.author_name || "Miembro",
    body: post.body,
    createdAt: post.created_at,
    likeCount: countByPost.get(post.id) ?? 0,
    likedByMe: likedByMe.has(post.id),
    mine: Boolean(member && post.member_profile_id === member.id),
    isCoach: Boolean(post.is_coach),
    pinned: Boolean(post.pinned),
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
    const { error } = await (supabase as any).from("community_post_likes").delete().eq("id", existing.data.id).eq("workspace_id", workspaceId);
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
    .eq("workspace_id", workspaceId)
    .eq("member_profile_id", member.id);
  if (error) throw new Error(`No se pudo eliminar: ${error.message}`);
}

// ----- Coach side: announcements, pinning and moderation -----

export type CoachCommunityPost = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  likeCount: number;
  isCoach: boolean;
  pinned: boolean;
};

export type CommunityModerationStats = {
  totalPosts: number;
  memberPosts: number;
  coachPosts: number;
  activeMembers: number;
  totalLikes: number;
};

export async function listCommunityModeration(workspaceId?: string): Promise<{
  posts: CoachCommunityPost[];
  stats: CommunityModerationStats;
}> {
  const env = getSupabaseServiceEnv();
  const empty = {
    posts: [],
    stats: { totalPosts: 0, memberPosts: 0, coachPosts: 0, activeMembers: 0, totalLikes: 0 },
  };
  if (!env.ok || !isUuid(workspaceId)) return empty;

  const supabase = createServiceSupabaseClient();
  const postsResult = await (supabase as any)
    .from("community_posts")
    .select("id,author_name,body,created_at,member_profile_id,is_coach,pinned")
    .eq("workspace_id", workspaceId)
    .eq("status", "published")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (postsResult.error || !postsResult.data?.length) return empty;

  const postIds = postsResult.data.map((post: { id: string }) => post.id);
  const likesResult = await (supabase as any)
    .from("community_post_likes")
    .select("post_id")
    .in("post_id", postIds);

  const countByPost = new Map<string, number>();
  for (const like of likesResult.data ?? []) {
    countByPost.set(like.post_id, (countByPost.get(like.post_id) ?? 0) + 1);
  }

  const activeMembers = new Set<string>();
  let memberPosts = 0;
  let coachPosts = 0;
  const posts: CoachCommunityPost[] = postsResult.data.map((post: { id: string; author_name: string; body: string; created_at: string; member_profile_id: string | null; is_coach: boolean | null; pinned: boolean | null }) => {
    if (post.is_coach) {
      coachPosts += 1;
    } else {
      memberPosts += 1;
      if (post.member_profile_id) activeMembers.add(post.member_profile_id);
    }
    return {
      id: post.id,
      authorName: post.author_name || "Miembro",
      body: post.body,
      createdAt: post.created_at,
      likeCount: countByPost.get(post.id) ?? 0,
      isCoach: Boolean(post.is_coach),
      pinned: Boolean(post.pinned),
    };
  });

  return {
    posts,
    stats: {
      totalPosts: posts.length,
      memberPosts,
      coachPosts,
      activeMembers: activeMembers.size,
      totalLikes: likesResult.data?.length ?? 0,
    },
  };
}

export async function createCoachAnnouncement(workspaceId: string, body: string, authorName: string) {
  if (!isUuid(workspaceId)) throw new Error("No se pudo identificar la marca.");
  const text = body.trim();
  if (!text) throw new Error("Escribe el anuncio antes de publicar.");

  const supabase = createServiceSupabaseClient();
  const { error } = await (supabase as any).from("community_posts").insert({
    workspace_id: workspaceId,
    member_profile_id: null,
    author_name: authorName.trim() || "Tu coach",
    body: text.slice(0, 2000),
    is_coach: true,
  });
  if (error) throw new Error(`No se pudo publicar el anuncio: ${error.message}`);
}

export async function toggleCommunityPin(workspaceId: string, postId: string) {
  if (!isUuid(workspaceId) || !isUuid(postId)) throw new Error("Publicación no válida.");
  const supabase = createServiceSupabaseClient();

  const existing = await (supabase as any)
    .from("community_posts")
    .select("pinned")
    .eq("id", postId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (existing.error || !existing.data) throw new Error("No se encontró la publicación.");

  const nextPinned = !existing.data.pinned;
  const { error } = await (supabase as any)
    .from("community_posts")
    .update({ pinned: nextPinned })
    .eq("id", postId)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(`No se pudo fijar: ${error.message}`);
  return { pinned: nextPinned };
}

export async function moderateDeleteCommunityPost(workspaceId: string, postId: string) {
  if (!isUuid(workspaceId) || !isUuid(postId)) throw new Error("Publicación no válida.");
  const supabase = createServiceSupabaseClient();
  const { error } = await (supabase as any)
    .from("community_posts")
    .delete()
    .eq("id", postId)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(`No se pudo eliminar: ${error.message}`);
}
