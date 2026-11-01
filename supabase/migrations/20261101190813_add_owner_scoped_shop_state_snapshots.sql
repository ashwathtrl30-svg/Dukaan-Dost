create table public.shop_state_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  schema_version smallint not null default 1 check (schema_version = 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_state_snapshots_state_object
    check (
      jsonb_typeof(state) = 'object'
      and jsonb_typeof(state->'shopProfile') = 'object'
      and jsonb_typeof(state->'sales') = 'array'
      and jsonb_typeof(state->'expenses') = 'array'
      and jsonb_typeof(state->'udhaar') = 'array'
      and jsonb_typeof(state->'notebookNotes') = 'array'
      and not (state ? 'lockPin')
      and not (state ? 'phoneNumber')
    )
);

alter table public.shop_state_snapshots enable row level security;

revoke all on table public.shop_state_snapshots from public, anon;
grant select, insert, update, delete on table public.shop_state_snapshots to authenticated;

create policy "shop owners can read their own snapshot"
  on public.shop_state_snapshots
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "shop owners can create their own snapshot"
  on public.shop_state_snapshots
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "shop owners can update their own snapshot"
  on public.shop_state_snapshots
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "shop owners can delete their own snapshot"
  on public.shop_state_snapshots
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.shop_state_snapshots is
  'Dukaan Dost owner-scoped cloud snapshot for shop profile, sales, expenses, udhaar and notebook notes. Excludes phone number and local app lock PIN.';
