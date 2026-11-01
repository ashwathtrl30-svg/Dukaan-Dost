create or replace function public.dukaan_dost_health_check()
returns boolean
language sql
volatile
security invoker
set search_path = pg_catalog
as $function$
  select true;
$function$;

revoke all on function public.dukaan_dost_health_check() from public;
grant execute on function public.dukaan_dost_health_check() to anon;

comment on function public.dukaan_dost_health_check()
  is 'Read-only availability probe for scheduled infrastructure checks. Returns no customer or shop data.';
