-- AdVantage AI Supabase identity and tenant-membership foundation.
-- Apply in Supabase SQL Editor or as a Supabase migration.
-- Do not put the service-role key in browser code.

create extension if not exists pgcrypto;

create table if not exists public.app_profiles (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tier text not null default 'STARTER' check (tier in ('STARTER','GROWTH','ENTERPRISE')),
  default_currency char(3) not null default 'USD',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.app_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.app_organizations(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('OWNER','ADMIN','CAMPAIGN_MANAGER','ANALYST','CREATIVE','FINANCE_APPROVER','OPERATOR','READ_ONLY')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED')),
  created_at timestamptz not null default now(),
  unique (organization_id, auth_user_id)
);

create index if not exists app_memberships_user_active_idx
  on public.app_memberships(auth_user_id, status, organization_id);

alter table public.app_profiles enable row level security;
alter table public.app_organizations enable row level security;
alter table public.app_memberships enable row level security;

drop policy if exists "profile_select_self" on public.app_profiles;
create policy "profile_select_self" on public.app_profiles
  for select to authenticated using (auth_user_id = (select auth.uid()));

drop policy if exists "profile_update_self" on public.app_profiles;
create policy "profile_update_self" on public.app_profiles
  for update to authenticated using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

drop policy if exists "organizations_select_member" on public.app_organizations;
create policy "organizations_select_member" on public.app_organizations
  for select to authenticated using (
    exists (
      select 1 from public.app_memberships m
      where m.organization_id = app_organizations.id
        and m.auth_user_id = (select auth.uid())
        and m.status = 'ACTIVE'
    )
  );

drop policy if exists "memberships_select_same_org" on public.app_memberships;
create policy "memberships_select_same_org" on public.app_memberships
  for select to authenticated using (
    auth_user_id = (select auth.uid())
    or exists (
      select 1 from public.app_memberships mine
      where mine.organization_id = app_memberships.organization_id
        and mine.auth_user_id = (select auth.uid())
        and mine.status = 'ACTIVE'
        and mine.role in ('OWNER','ADMIN')
    )
  );

-- Provisioning is deliberately server/admin-only. Do not add client INSERT policies
-- for organizations or memberships. Use a reviewed server-side invitation flow.
revoke all on public.app_profiles from anon;
revoke all on public.app_organizations from anon;
revoke all on public.app_memberships from anon;
grant select, update on public.app_profiles to authenticated;
grant select on public.app_organizations to authenticated;
grant select on public.app_memberships to authenticated;

-- Automatically create a profile after Supabase Auth creates a user.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.app_profiles (auth_user_id, email, display_name)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (auth_user_id) do update
    set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_app_profile on auth.users;
create trigger on_auth_user_created_app_profile
  after insert or update of email on auth.users
  for each row execute procedure public.handle_new_auth_user();
