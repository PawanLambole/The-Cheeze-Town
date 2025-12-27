-- App version management for OTA and Native updates
-- This table tracks all app versions and controls update enforcement

create table if not exists public.app_versions (
  id serial primary key,
  version_name text not null unique, -- e.g. "1.0.1"
  version_code integer not null unique, -- e.g. 101
  runtime_version text, -- For OTA updates, e.g. "1.0.0"
  platform text not null check (platform in ('android', 'ios', 'all')),
  update_type text not null check (update_type in ('ota', 'native')),
  is_mandatory boolean default false, -- Force update
  is_active boolean default true, -- Is this version currently available
  download_url text, -- APK download URL for native updates
  release_notes text,
  update_message text, -- Message to show users
  min_supported_version text, -- Minimum version that can OTA update to this
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Current version configuration (singleton pattern)
create table if not exists public.app_config (
  id integer primary key default 1 check (id = 1), -- Only one row allowed
  current_version_name text not null,
  current_version_code integer not null,
  min_supported_version_name text not null, -- Versions below this must update
  min_supported_version_code integer not null,
  force_update_enabled boolean default false,
  update_check_interval_hours integer default 24,
  maintenance_mode boolean default false,
  maintenance_message text,
  updated_at timestamptz default now()
);

-- Insert default configuration
insert into public.app_config (
  current_version_name,
  current_version_code,
  min_supported_version_name,
  min_supported_version_code
) values (
  '1.0.0',
  100,
  '1.0.0',
  100
) on conflict (id) do nothing;

-- Insert initial version
insert into public.app_versions (
  version_name,
  version_code,
  runtime_version,
  platform,
  update_type,
  is_mandatory,
  release_notes,
  update_message
) values (
  '1.0.0',
  100,
  '1.0.0',
  'all',
  'native',
  false,
  'Initial release of The Cheese Town app',
  'Welcome to The Cheese Town!'
) on conflict (version_name) do nothing;

-- Enable RLS
alter table public.app_versions enable row level security;
alter table public.app_config enable row level security;

-- Public read access for version checking
create policy "Allow public read access to app_versions"
  on public.app_versions for select
  using (true);

create policy "Allow public read access to app_config"
  on public.app_config for select
  using (true);

-- Only authenticated users (staff) can modify versions
create policy "Only authenticated users can modify app_versions"
  on public.app_versions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Only authenticated users can modify app_config"
  on public.app_config for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Function to get latest version info
create or replace function get_latest_version(p_platform text default 'all')
returns table (
  version_name text,
  version_code integer,
  update_type text,
  is_mandatory boolean,
  download_url text,
  release_notes text,
  update_message text
) as $$
begin
  return query
  select
    v.version_name,
    v.version_code,
    v.update_type,
    v.is_mandatory,
    v.download_url,
    v.release_notes,
    v.update_message
  from public.app_versions v
  where v.is_active = true
    and (v.platform = p_platform or v.platform = 'all')
  order by v.version_code desc
  limit 1;
end;
$$ language plpgsql security definer;

-- Function to check if update is required
create or replace function check_update_required(
  p_current_version_code integer,
  p_platform text default 'all'
)
returns table (
  update_required boolean,
  is_mandatory boolean,
  latest_version_name text,
  latest_version_code integer,
  update_type text,
  download_url text,
  update_message text
) as $$
declare
  v_config record;
  v_latest record;
begin
  -- Get current config
  select * into v_config from public.app_config where id = 1;
  
  -- Get latest version
  select * into v_latest from get_latest_version(p_platform);
  
  -- Determine if update is required
  return query
  select
    (v_latest.version_code > p_current_version_code)::boolean as update_required,
    (p_current_version_code < v_config.min_supported_version_code or v_config.force_update_enabled)::boolean as is_mandatory,
    v_latest.version_name,
    v_latest.version_code,
    v_latest.update_type,
    v_latest.download_url,
    coalesce(v_latest.update_message, 'A new update is available!')::text;
end;
$$ language plpgsql security definer;
