create table public.users (
  user_id uuid not null default gen_random_uuid (),
  auth_id uuid not null,
  first_name text not null,
  middle_name text null,
  last_name text not null,
  phone_number text not null,
  gender public.user_gender null default 'unspecified'::user_gender,
  role public.user_role not null default 'patient'::user_role,
  status public.user_status not null default 'active'::user_status,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone not null default now(),
  email text null,
  constraint users_pkey primary key (user_id),
  constraint unique_auth_id unique (auth_id),
  constraint users_auth_id_fkey foreign KEY (auth_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_users_role on public.users using btree (role) TABLESPACE pg_default;

create index IF not exists idx_users_status on public.users using btree (status) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_email_lower on public.users using btree (lower(email)) TABLESPACE pg_default;

create index IF not exists idx_users_auth_id on public.users using btree (auth_id) TABLESPACE pg_default;

create trigger sync_user_email_trigger BEFORE INSERT on users for EACH row
execute FUNCTION sync_user_email ();

create trigger trg_users_set_updated_at BEFORE
update on users for EACH row
execute FUNCTION set_updated_at ();