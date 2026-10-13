create table if not exists schools (
  id uuid primary key,
  name text not null,
  short_name text not null,
  cct text not null,
  share_token text,
  share_expires_at timestamptz,
  share_revoked boolean default false
);
create table if not exists teachers (
  id uuid primary key,
  name text not null,
  disciplina text,
  turno text,
  school_id uuid references schools(id) on delete cascade,
  created_at timestamptz not null,
  share_token text,
  share_expires_at timestamptz,
  share_revoked boolean default false,
  created_by text
);
create table if not exists folder_reviews (
  id uuid primary key,
  teacher_id uuid references teachers(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  created_by text,
  updated_by text
);
create table if not exists class_visits (
  id uuid primary key,
  teacher_id uuid references teachers(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  created_by text,
  updated_by text
);
create table if not exists acknowledgments (
  teacher_id uuid primary key references teachers(id) on delete cascade,
  agreed boolean,
  nombre_firma text,
  firma_data_url text,
  comentario text,
  signed_at timestamptz,
  folder_id text,
  visit_id text,
  folder_pct int,
  visit_pct int
);
create table if not exists audit_events (
  id uuid primary key,
  at timestamptz not null,
  actor text,
  action text,
  detail text
);
create table if not exists drafts (
  user_id text not null,
  kind text not null,
  teacher_id text not null,
  school_id text,
  payload jsonb,
  updated_at timestamptz not null,
  primary key (user_id, kind, teacher_id)
);
create table if not exists app_settings (
  id text primary key default 'default',
  closed_periods text[] default '{}',
  updated_at timestamptz not null
);
create table if not exists zona_share (
  id text primary key default 'zona',
  share_token text,
  share_expires_at timestamptz,
  share_revoked boolean default false
);
notify pgrst, 'reload schema';
