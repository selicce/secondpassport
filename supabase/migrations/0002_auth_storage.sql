-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ Auth profile provisioning, updated_at triggers, private document storage  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── Auto-create a profile row when a Supabase Auth user is created ───────────
-- Metadata is supplied at sign-up (see src/app/actions/auth.ts signUpAction).
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, messenger, nationality, country_of_residence, preferred_language, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'messenger', ''),
    nullif(new.raw_user_meta_data->>'nationality', ''),
    nullif(new.raw_user_meta_data->>'country_of_residence', ''),
    coalesce(nullif(new.raw_user_meta_data->>'preferred_language', '')::language_code, 'en'),
    'client'   -- staff roles are granted explicitly by a super_admin
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Keep tickets.updated_at fresh ────────────────────────────────────────────
create or replace function public.touch_updated_at()
  returns trigger language plpgsql as
$$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists tickets_touch_updated_at on tickets;
create trigger tickets_touch_updated_at
  before update on tickets
  for each row execute function public.touch_updated_at();

-- ── Private document storage bucket ──────────────────────────────────────────
-- public=false → no public URLs are ever served. All uploads and downloads go
-- through the server using the service-role key (see src/lib/data/mutations.ts),
-- which generates short-lived signed URLs. We therefore add NO permissive
-- policies on storage.objects for this bucket: anon/auth clients cannot touch it
-- directly; only the trusted server path can.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  15728640,  -- 15 MB
  array['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;
