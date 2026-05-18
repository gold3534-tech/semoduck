create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname, profile_image, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', '세모덕 유저'),
    new.raw_user_meta_data->>'avatar_url',
    case when lower(new.email) = 'gold3534@gmail.com' then 'admin'::public.user_role else 'user'::public.user_role end
  )
  on conflict (id) do update set
    email = excluded.email,
    nickname = excluded.nickname,
    profile_image = excluded.profile_image,
    role = excluded.role,
    updated_at = now();
  return new;
end;
$$;

update public.profiles
set role = 'admin'
where lower(email) = 'gold3534@gmail.com';

update public.profiles
set role = 'user'
where lower(email) <> 'gold3534@gmail.com'
  and role <> 'guest';
