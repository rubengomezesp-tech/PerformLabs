drop policy if exists "coach admins manage app pages" on public.app_pages;
create policy "coach admins create app pages"
on public.app_pages for insert
to authenticated
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

create policy "coach admins update app pages"
on public.app_pages for update
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

create policy "coach admins delete app pages"
on public.app_pages for delete
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "coach admins manage content" on public.content_pages;
create policy "coach admins create content"
on public.content_pages for insert
to authenticated
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

create policy "coach admins update content"
on public.content_pages for update
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

create policy "coach admins delete content"
on public.content_pages for delete
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "members can create own meal logs" on public.member_meal_logs;
drop policy if exists "members can read own meal logs" on public.member_meal_logs;
drop policy if exists "members can update own meal logs" on public.member_meal_logs;
drop policy if exists "workspace team can manage member meal logs" on public.member_meal_logs;

create policy "meal logs visible to owner and team"
on public.member_meal_logs for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "meal logs created by owner or team"
on public.member_meal_logs for insert
to authenticated
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "meal logs updated by owner or team"
on public.member_meal_logs for update
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
)
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "meal logs deleted by team"
on public.member_meal_logs for delete
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "members can create own nutrition daily logs" on public.member_nutrition_daily_logs;
drop policy if exists "members can read own nutrition daily logs" on public.member_nutrition_daily_logs;
drop policy if exists "members can update own nutrition daily logs" on public.member_nutrition_daily_logs;
drop policy if exists "workspace team can manage nutrition daily logs" on public.member_nutrition_daily_logs;

create policy "nutrition daily logs visible to owner and team"
on public.member_nutrition_daily_logs for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "nutrition daily logs created by owner or team"
on public.member_nutrition_daily_logs for insert
to authenticated
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "nutrition daily logs updated by owner or team"
on public.member_nutrition_daily_logs for update
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
)
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "nutrition daily logs deleted by team"
on public.member_nutrition_daily_logs for delete
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "members can read own training reviews" on public.member_training_reviews;
drop policy if exists "workspace team can manage training reviews" on public.member_training_reviews;

create policy "training reviews visible to owner and team"
on public.member_training_reviews for select
to authenticated
using (
  exists (
    select 1
    from public.member_profiles profile
    where profile.id = member_training_reviews.member_profile_id
      and profile.user_id = (select auth.uid())
  )
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "training reviews created by team"
on public.member_training_reviews for insert
to authenticated
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

create policy "training reviews updated by team"
on public.member_training_reviews for update
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

create policy "training reviews deleted by team"
on public.member_training_reviews for delete
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "members can create own support conversations" on public.support_conversations;
drop policy if exists "members can read own support conversations" on public.support_conversations;
drop policy if exists "workspace team can manage support conversations" on public.support_conversations;

create policy "support conversations visible to owner and team"
on public.support_conversations for select
to authenticated
using (
  exists (
    select 1
    from public.member_profiles profile
    where profile.id = support_conversations.member_profile_id
      and profile.user_id = (select auth.uid())
  )
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "support conversations created by owner or team"
on public.support_conversations for insert
to authenticated
with check (
  exists (
    select 1
    from public.member_profiles profile
    where profile.id = support_conversations.member_profile_id
      and profile.workspace_id = support_conversations.workspace_id
      and profile.user_id = (select auth.uid())
  )
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "support conversations updated by team"
on public.support_conversations for update
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

create policy "support conversations deleted by team"
on public.support_conversations for delete
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "members can create own support messages" on public.support_messages;
drop policy if exists "members can read own support messages" on public.support_messages;
drop policy if exists "workspace team can manage support messages" on public.support_messages;

create policy "support messages visible to owner and team"
on public.support_messages for select
to authenticated
using (
  exists (
    select 1
    from public.support_conversations conversation
    join public.member_profiles profile on profile.id = conversation.member_profile_id
    where conversation.id = support_messages.conversation_id
      and profile.user_id = (select auth.uid())
  )
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "support messages created by owner or team"
on public.support_messages for insert
to authenticated
with check (
  (
    sender_role = 'member'
    and exists (
      select 1
      from public.support_conversations conversation
      join public.member_profiles profile on profile.id = conversation.member_profile_id
      where conversation.id = support_messages.conversation_id
        and conversation.workspace_id = support_messages.workspace_id
        and profile.user_id = (select auth.uid())
    )
  )
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "support messages updated by team"
on public.support_messages for update
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

create policy "support messages deleted by team"
on public.support_messages for delete
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "members can create own workout session logs" on public.workout_session_logs;
drop policy if exists "members can read own workout session logs" on public.workout_session_logs;
drop policy if exists "members can update own workout session logs" on public.workout_session_logs;
drop policy if exists "workspace team can manage workout session logs" on public.workout_session_logs;

create policy "workout session logs visible to owner and team"
on public.workout_session_logs for select
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "workout session logs created by owner or team"
on public.workout_session_logs for insert
to authenticated
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "workout session logs updated by owner or team"
on public.workout_session_logs for update
to authenticated
using (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
)
with check (
  (select private.is_member_profile_owner(workspace_id, member_profile_id))
  or (select private.has_workspace_role(
    workspace_id,
    array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
  ))
);

create policy "workout session logs deleted by team"
on public.workout_session_logs for delete
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

drop policy if exists "members can create own workout set logs" on public.workout_set_logs;
drop policy if exists "members can read own workout set logs" on public.workout_set_logs;
drop policy if exists "members can update own workout set logs" on public.workout_set_logs;
drop policy if exists "workspace team can manage workout set logs" on public.workout_set_logs;

create policy "workout set logs visible to owner and team"
on public.workout_set_logs for select
to authenticated
using (
  exists (
    select 1
    from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and (
        (select private.is_member_profile_owner(session.workspace_id, session.member_profile_id))
        or (select private.has_workspace_role(
          session.workspace_id,
          array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
        ))
      )
  )
);

create policy "workout set logs created by owner or team"
on public.workout_set_logs for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and (
        (select private.is_member_profile_owner(session.workspace_id, session.member_profile_id))
        or (select private.has_workspace_role(
          session.workspace_id,
          array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
        ))
      )
  )
);

create policy "workout set logs updated by owner or team"
on public.workout_set_logs for update
to authenticated
using (
  exists (
    select 1
    from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and (
        (select private.is_member_profile_owner(session.workspace_id, session.member_profile_id))
        or (select private.has_workspace_role(
          session.workspace_id,
          array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
        ))
      )
  )
)
with check (
  exists (
    select 1
    from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and (
        (select private.is_member_profile_owner(session.workspace_id, session.member_profile_id))
        or (select private.has_workspace_role(
          session.workspace_id,
          array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
        ))
      )
  )
);

create policy "workout set logs deleted by team"
on public.workout_set_logs for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_session_logs session
    where session.id = workout_set_logs.session_log_id
      and (select private.has_workspace_role(
        session.workspace_id,
        array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
      ))
  )
);

drop policy if exists "Platform can manage entitlements" on public.workspace_entitlements;
drop policy if exists "Workspace managers can read entitlements" on public.workspace_entitlements;

create policy "workspace managers can read entitlements"
on public.workspace_entitlements for select
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin','coach_admin','coach_staff']::public.workspace_role[]
)));

create policy "platform can create entitlements"
on public.workspace_entitlements for insert
to authenticated
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin']::public.workspace_role[]
)));

create policy "platform can update entitlements"
on public.workspace_entitlements for update
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin']::public.workspace_role[]
)))
with check ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin']::public.workspace_role[]
)));

create policy "platform can delete entitlements"
on public.workspace_entitlements for delete
to authenticated
using ((select private.has_workspace_role(
  workspace_id,
  array['platform_owner','agency_admin']::public.workspace_role[]
)));

drop policy if exists "memberships visible inside workspace" on public.workspace_memberships;
drop policy if exists "platform owners manage memberships" on public.workspace_memberships;

create policy "memberships visible to workspace or platform"
on public.workspace_memberships for select
to authenticated
using (
  (select private.is_platform_owner())
  or (select private.is_workspace_member(workspace_id))
);

create policy "platform can create memberships"
on public.workspace_memberships for insert
to authenticated
with check ((select private.is_platform_owner()));

create policy "platform can update memberships"
on public.workspace_memberships for update
to authenticated
using ((select private.is_platform_owner()))
with check ((select private.is_platform_owner()));

create policy "platform can delete memberships"
on public.workspace_memberships for delete
to authenticated
using ((select private.is_platform_owner()));
