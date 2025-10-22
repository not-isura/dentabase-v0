create table public.doctors (
  doctor_id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  specialization text not null,
  license_number text not null,
  room_number text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint doctors_pkey primary key (doctor_id),
  constraint doctors_user_id_key unique (user_id),
  constraint doctors_user_id_fkey foreign KEY (user_id) references users (user_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_doctors_user_id on public.doctors using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_doctors_doctor_id on public.doctors using btree (doctor_id) TABLESPACE pg_default;

create trigger trg_doctors_set_updated_at BEFORE
update on doctors for EACH row
execute FUNCTION set_updated_at ();