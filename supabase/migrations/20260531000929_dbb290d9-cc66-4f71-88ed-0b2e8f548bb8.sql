-- Add search_path to set_updated_at (was missing)
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- Revoke public execute from internal/trigger functions
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- has_role is used in RLS — authenticated must keep EXECUTE, but revoke from anon/public
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;