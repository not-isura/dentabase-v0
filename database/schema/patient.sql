create table public.patient (
  patient_id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  address text not null,
  emergency_contact_no text not null,
  emergency_contact_name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint patient_pkey primary key (patient_id),
  constraint patient_user_id_key unique (user_id),
  constraint patient_user_id_fkey foreign KEY (user_id) references users (user_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_patient_user_id on public.patient using btree (user_id) TABLESPACE pg_default;

create trigger trg_patient_set_updated_at BEFORE
update on patient for EACH row
execute FUNCTION set_updated_at ();