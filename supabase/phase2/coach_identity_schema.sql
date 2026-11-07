-- Dukaan Dost Coach Phase 2: secure identity and individual learning history.
-- This script is intentionally separate from the live database until an isolated
-- development Supabase project is available and the SQL has been reviewed there.
--
-- Data model:
--   one Coach workspace per shop owner, containing shared shop context;
--   optional staff membership records for future employee identities;
--   one private Coach profile and learning history per Auth user;
--   shop members never gain access to one another's personal feedback/transcripts.
--
-- Only text transcripts are stored. There is deliberately no audio/blob column.
-- After 2026-10-30, newly created public tables may not be exposed by the Data API
-- automatically. Explicitly add only these public.coach_* tables to the project's
-- Data API exposed-schema/table configuration after deployment; never expose private.
-- All authorization is based on auth.uid(), never user-editable JWT user_metadata.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.coach_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  shop_name text check (shop_name is null or char_length(shop_name) <= 120),
  shop_type text check (
    shop_type is null or shop_type in (
      'kirana', 'medical', 'bakery', 'sweet', 'tailor', 'salon',
      'hardware', 'mobile', 'vegetable', 'tea', 'restaurant', 'other'
    )
  ),
  city text check (city is null or char_length(city) <= 100),
  business_context jsonb not null default '{}'::jsonb check (
    jsonb_typeof(business_context) = 'object' and pg_column_size(business_context) <= 32768
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.coach_workspace_memberships (
  workspace_id uuid not null references public.coach_workspaces(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role = 'staff'),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id),
  constraint coach_membership_not_owner check (user_id <> invited_by)
);

create table if not exists public.coach_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.coach_workspaces(id) on delete cascade,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi')),
  baseline_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.coach_workspaces(id) on delete cascade,
  scenario_code text not null check (char_length(scenario_code) between 1 and 80),
  shop_type text check (
    shop_type is null or shop_type in (
      'kirana', 'medical', 'bakery', 'sweet', 'tailor', 'salon',
      'hardware', 'mobile', 'vegetable', 'tea', 'restaurant', 'other'
    )
  ),
  language text not null default 'en' check (language in ('en', 'hi')),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  outcome text check (
    outcome is null or outcome in ('purchased', 'not_purchased', 'returned_later', 'left', 'unclear')
  ),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint coach_session_completion_consistent check (
    (status = 'in_progress' and completed_at is null) or
    (status in ('completed', 'abandoned') and completed_at is not null)
  ),
  constraint coach_session_id_user_unique unique (id, user_id),
  constraint coach_session_id_user_workspace_unique unique (id, user_id, workspace_id)
);

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  message_index integer not null check (message_index >= 0),
  speaker text not null check (speaker in ('customer', 'shopkeeper', 'coach')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now(),
  constraint coach_message_order_unique unique (session_id, user_id, message_index),
  constraint coach_message_session_owner_fk
    foreign key (session_id, user_id)
    references public.coach_sessions(id, user_id)
    on delete cascade
);

create table if not exists public.coach_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.coach_workspaces(id) on delete cascade,
  session_id uuid,
  assessment_type text not null
    check (assessment_type in ('baseline', 'session_feedback', 'milestone_review')),
  assessment_key text not null check (char_length(assessment_key) between 1 and 100),
  milestone_number integer,
  assessment_data jsonb not null
    check (
      jsonb_typeof(assessment_data) = 'object' and
      pg_column_size(assessment_data) <= 32768
    ),
  created_at timestamptz not null default now(),
  constraint coach_assessment_owner_key_unique unique (user_id, assessment_key),
  constraint coach_assessment_session_owner_fk
    foreign key (session_id, user_id, workspace_id)
    references public.coach_sessions(id, user_id, workspace_id)
    on delete cascade,
  constraint coach_assessment_shape check (
    (assessment_type = 'baseline' and session_id is null and milestone_number is null) or
    (assessment_type = 'session_feedback' and session_id is not null and milestone_number is null) or
    (assessment_type = 'milestone_review' and session_id is null and milestone_number >= 10)
  )
);

create table if not exists public.coach_learning_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.coach_workspaces(id) on delete cascade,
  learning_state jsonb not null default
    '{"completedSessions":0,"dimensionSignals":{},"focusAreas":[],"strengths":[],"recentPatternIds":[],"updatedAt":null}'::jsonb
    check (
      jsonb_typeof(learning_state) = 'object' and
      pg_column_size(learning_state) <= 32768
    ),
  updated_at timestamptz not null default now()
);

create index if not exists coach_sessions_user_started_idx
  on public.coach_sessions (user_id, started_at desc);
create index if not exists coach_sessions_workspace_status_idx
  on public.coach_sessions (workspace_id, status, started_at desc);
create index if not exists coach_messages_session_order_idx
  on public.coach_messages (session_id, message_index);
create index if not exists coach_assessments_user_created_idx
  on public.coach_assessments (user_id, created_at desc);

-- These SECURITY DEFINER helpers are kept in the non-exposed private schema.
-- They use a fixed empty search_path and auth.uid(); no user-editable metadata is trusted.
create or replace function private.is_coach_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.coach_workspaces as workspace
    where workspace.id = target_workspace_id
      and workspace.owner_user_id = (select auth.uid())
  );
$function$;

create or replace function private.is_coach_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    private.is_coach_workspace_owner(target_workspace_id)
    or exists (
      select 1
      from public.coach_workspace_memberships as membership
      where membership.workspace_id = target_workspace_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
    );
$function$;

revoke all on function private.is_coach_workspace_owner(uuid) from public, anon;
revoke all on function private.is_coach_workspace_member(uuid) from public, anon;
grant execute on function private.is_coach_workspace_owner(uuid) to authenticated;
grant execute on function private.is_coach_workspace_member(uuid) to authenticated;

alter table public.coach_workspaces enable row level security;
alter table public.coach_workspace_memberships enable row level security;
alter table public.coach_profiles enable row level security;
alter table public.coach_sessions enable row level security;
alter table public.coach_messages enable row level security;
alter table public.coach_assessments enable row level security;
alter table public.coach_learning_profiles enable row level security;

-- Workspaces: owners create/manage; active staff members may read their shop context.
drop policy if exists coach_workspaces_select_member on public.coach_workspaces;
create policy coach_workspaces_select_member
  on public.coach_workspaces for select to authenticated
  using (private.is_coach_workspace_member(id));

drop policy if exists coach_workspaces_insert_owner on public.coach_workspaces;
create policy coach_workspaces_insert_owner
  on public.coach_workspaces for insert to authenticated
  with check (owner_user_id = (select auth.uid()));

drop policy if exists coach_workspaces_update_owner on public.coach_workspaces;
create policy coach_workspaces_update_owner
  on public.coach_workspaces for update to authenticated
  using (private.is_coach_workspace_owner(id))
  with check (owner_user_id = (select auth.uid()));

drop policy if exists coach_workspaces_delete_owner on public.coach_workspaces;
create policy coach_workspaces_delete_owner
  on public.coach_workspaces for delete to authenticated
  using (private.is_coach_workspace_owner(id));

-- Memberships: a staff member can see their own membership; only the owner manages others.
drop policy if exists coach_memberships_select_self_or_owner on public.coach_workspace_memberships;
create policy coach_memberships_select_self_or_owner
  on public.coach_workspace_memberships for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_coach_workspace_owner(workspace_id)
  );

drop policy if exists coach_memberships_insert_owner on public.coach_workspace_memberships;
create policy coach_memberships_insert_owner
  on public.coach_workspace_memberships for insert to authenticated
  with check (
    private.is_coach_workspace_owner(workspace_id)
    and invited_by = (select auth.uid())
    and role = 'staff'
  );

drop policy if exists coach_memberships_update_owner on public.coach_workspace_memberships;
create policy coach_memberships_update_owner
  on public.coach_workspace_memberships for update to authenticated
  using (private.is_coach_workspace_owner(workspace_id))
  with check (
    private.is_coach_workspace_owner(workspace_id)
    and role = 'staff'
  );

drop policy if exists coach_memberships_delete_self_or_owner on public.coach_workspace_memberships;
create policy coach_memberships_delete_self_or_owner
  on public.coach_workspace_memberships for delete to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_coach_workspace_owner(workspace_id)
  );

-- Individual Coach profiles: a shop owner cannot read a staff member's private learning profile.
drop policy if exists coach_profiles_select_self on public.coach_profiles;
create policy coach_profiles_select_self
  on public.coach_profiles for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists coach_profiles_insert_self on public.coach_profiles;
create policy coach_profiles_insert_self
  on public.coach_profiles for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_coach_workspace_member(workspace_id)
  );

drop policy if exists coach_profiles_update_self on public.coach_profiles;
create policy coach_profiles_update_self
  on public.coach_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and private.is_coach_workspace_member(workspace_id)
  );

-- Sessions and transcripts are private to the individual Auth identity.
drop policy if exists coach_sessions_select_self on public.coach_sessions;
create policy coach_sessions_select_self
  on public.coach_sessions for select to authenticated
  using (
    user_id = (select auth.uid())
    and private.is_coach_workspace_member(workspace_id)
  );

drop policy if exists coach_sessions_insert_self on public.coach_sessions;
create policy coach_sessions_insert_self
  on public.coach_sessions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_coach_workspace_member(workspace_id)
  );

drop policy if exists coach_sessions_update_self on public.coach_sessions;
create policy coach_sessions_update_self
  on public.coach_sessions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and private.is_coach_workspace_member(workspace_id)
  );

drop policy if exists coach_messages_select_self on public.coach_messages;
create policy coach_messages_select_self
  on public.coach_messages for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.coach_sessions as session
      where session.id = session_id
        and session.user_id = (select auth.uid())
    )
  );

drop policy if exists coach_messages_insert_self on public.coach_messages;
create policy coach_messages_insert_self
  on public.coach_messages for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.coach_sessions as session
      where session.id = session_id
        and session.user_id = (select auth.uid())
        and session.status = 'in_progress'
    )
  );

-- Assessments and adaptive learning state are visible only to their own individual.
drop policy if exists coach_assessments_select_self on public.coach_assessments;
create policy coach_assessments_select_self
  on public.coach_assessments for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists coach_assessments_insert_self on public.coach_assessments;
create policy coach_assessments_insert_self
  on public.coach_assessments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_coach_workspace_member(workspace_id)
  );

drop policy if exists coach_learning_profiles_select_self on public.coach_learning_profiles;
create policy coach_learning_profiles_select_self
  on public.coach_learning_profiles for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists coach_learning_profiles_insert_self on public.coach_learning_profiles;
create policy coach_learning_profiles_insert_self
  on public.coach_learning_profiles for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_coach_workspace_member(workspace_id)
  );

drop policy if exists coach_learning_profiles_update_self on public.coach_learning_profiles;
create policy coach_learning_profiles_update_self
  on public.coach_learning_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and private.is_coach_workspace_member(workspace_id)
  );

-- Explicit least-privilege grants. Row access remains governed by the policies above.
revoke all on public.coach_workspaces from anon;
revoke all on public.coach_workspace_memberships from anon;
revoke all on public.coach_profiles from anon;
revoke all on public.coach_sessions from anon;
revoke all on public.coach_messages from anon;
revoke all on public.coach_assessments from anon;
revoke all on public.coach_learning_profiles from anon;

grant select, insert, update, delete on public.coach_workspaces to authenticated;
grant select, insert, update, delete on public.coach_workspace_memberships to authenticated;
grant select, insert, update on public.coach_profiles to authenticated;
grant select, insert, update on public.coach_sessions to authenticated;
grant select, insert on public.coach_messages to authenticated;
grant select, insert on public.coach_assessments to authenticated;
grant select, insert, update on public.coach_learning_profiles to authenticated;

-- Keep modification timestamps database-owned.
create or replace function private.touch_coach_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

revoke all on function private.touch_coach_updated_at() from public, anon, authenticated;

drop trigger if exists coach_profiles_touch_updated_at on public.coach_profiles;
create trigger coach_profiles_touch_updated_at
  before update on public.coach_profiles
  for each row execute function private.touch_coach_updated_at();

drop trigger if exists coach_learning_profiles_touch_updated_at on public.coach_learning_profiles;
create trigger coach_learning_profiles_touch_updated_at
  before update on public.coach_learning_profiles
  for each row execute function private.touch_coach_updated_at();

comment on table public.coach_profiles is
  'Private individual Coach profile. A shop owner cannot read staff members personal learning data.';
comment on table public.coach_sessions is
  'Individual customer-practice sessions. Purchase outcome is stored separately from conversation assessment.';
comment on table public.coach_messages is
  'Text transcript only. Raw audio is not stored.';
comment on table public.coach_assessments is
  'Private baseline, session feedback and milestone reviews for one Auth identity.';
comment on table public.coach_learning_profiles is
  'Adaptive learning state for one Auth identity; not shared with other shop members.';
