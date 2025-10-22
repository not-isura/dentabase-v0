create table public.doc_availability (
  availability_id uuid not null default gen_random_uuid (),
  doctor_id uuid not null,
  day public.day_of_week not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  is_enabled boolean null default false,
  constraint doc_availability_pkey primary key (availability_id),
  constraint unique_doctor_day unique (doctor_id, day),
  constraint doc_availability_doctor_id_fkey foreign KEY (doctor_id) references doctors (doctor_id) on delete CASCADE,
  constraint check_time_validity check ((end_time > start_time))
) TABLESPACE pg_default;

create index IF not exists idx_doc_availability_doctor_id on public.doc_availability using btree (doctor_id) TABLESPACE pg_default;

create trigger set_doc_availability_updated_at BEFORE
update on doc_availability for EACH row
execute FUNCTION set_updated_at ();