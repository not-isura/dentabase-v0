create table public.staff (
  staff_id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  doctor_id uuid null,
  position_title text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint staff_pkey primary key (staff_id),
  constraint staff_user_id_key unique (user_id),
  constraint staff_doctor_id_fkey foreign KEY (doctor_id) references doctors (doctor_id) on delete set null,
  constraint staff_user_id_fkey foreign KEY (user_id) references users (user_id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_staff_user_id on public.staff using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_staff_doctor_id on public.staff using btree (doctor_id) TABLESPACE pg_default;

create index IF not exists idx_dental_staff_user_id on public.staff using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_dental_staff_assigned_doctor on public.staff using btree (doctor_id) TABLESPACE pg_default;

create trigger trg_staff_set_updated_at BEFORE
update on staff for EACH row
execute FUNCTION set_updated_at ();