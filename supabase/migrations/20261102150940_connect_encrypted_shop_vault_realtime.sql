-- Keep encrypted vault changes available to other signed-in devices.
-- Shop records remain encrypted before the browser writes them to this table.
create or replace function public.set_shop_vault_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_shop_vault_updated_at() from public, anon, authenticated;

drop trigger if exists set_shop_vault_updated_at on public.shop_vaults;
create trigger set_shop_vault_updated_at
  before update on public.shop_vaults
  for each row
  execute function public.set_shop_vault_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shop_vaults'
  ) then
    execute 'alter publication supabase_realtime add table public.shop_vaults';
  end if;
end;
$$;
