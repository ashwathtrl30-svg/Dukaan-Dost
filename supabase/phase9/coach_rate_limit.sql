-- Dukaan Dost Coach Phase 9: shared, atomic API rate limits.
-- Apply only after supabase/phase2/coach_identity_schema.sql on the isolated Coach project.
-- The private counter table is not exposed through PostgREST. Authenticated users
-- can only consume a counter for their own auth.uid(); they cannot read/reset it.

create table if not exists coach_private.coach_rate_limit_windows (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null check (bucket in ('customer', 'feedback', 'milestone')),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 1),
  primary key (user_id, bucket)
);

revoke all on coach_private.coach_rate_limit_windows from public, anon, authenticated;

create or replace function public.coach_consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_now timestamptz := clock_timestamp();
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_bucket not in ('customer', 'feedback', 'milestone')
     or p_limit is null or p_limit < 1 or p_limit > 120
     or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 3600 then
    raise exception 'Invalid rate-limit parameters' using errcode = '22023';
  end if;

  insert into coach_private.coach_rate_limit_windows as current_window
    (user_id, bucket, window_started_at, request_count)
  values (v_user_id, p_bucket, v_now, 1)
  on conflict (user_id, bucket) do update
    set window_started_at = case
          when current_window.window_started_at <= v_now - make_interval(secs => p_window_seconds)
            then v_now
          else current_window.window_started_at
        end,
        request_count = case
          when current_window.window_started_at <= v_now - make_interval(secs => p_window_seconds)
            then 1
          else current_window.request_count + 1
        end
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$function$;

revoke all on function public.coach_consume_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.coach_consume_rate_limit(text, integer, integer) to authenticated;

comment on function public.coach_consume_rate_limit(text, integer, integer) is
  'Atomically consumes a per-user Coach API rate-limit slot. Users cannot inspect or reset counters.';
