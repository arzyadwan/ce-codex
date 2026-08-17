create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.handle_new_editorial_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
begin
  base_username := regexp_replace(split_part(coalesce(new.email, 'author'), '@', 1), '[^a-zA-Z0-9_]', '-', 'g');
  insert into public.profiles (id, display_name, username, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'Author'), '@', 1)),
    lower(base_username || '-' || left(new.id::text, 8)),
    'author'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_editorial_user() from public, anon, authenticated;
grant usage on schema private to supabase_auth_admin;
grant execute on function private.handle_new_editorial_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created_editorial on auth.users;
create trigger on_auth_user_created_editorial
after insert on auth.users
for each row execute function private.handle_new_editorial_user();

insert into public.profiles (id, display_name, username, role)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(u.email, 'Author'), '@', 1)),
  lower(regexp_replace(split_part(coalesce(u.email, 'author'), '@', 1), '[^a-zA-Z0-9_]', '-', 'g') || '-' || left(u.id::text, 8)),
  'author'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
