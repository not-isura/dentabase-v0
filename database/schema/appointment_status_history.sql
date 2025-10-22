create table public.appointment_status_history (
  history_id uuid not null default gen_random_uuid (),
  appointment_id uuid not null,
  status text not null,
  changed_by_user_id uuid not null,
  changed_at timestamp with time zone not null default now(),
  notes text null,
  proposed_time timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  related_time timestamp with time zone null,
  related_end_time timestamp with time zone null,
  constraint appointment_status_history_pkey primary key (history_id),
  constraint appointment_status_history_appointment_id_fkey foreign KEY (appointment_id) references appointments (appointment_id) on delete CASCADE,
  constraint appointment_status_history_changed_by_user_id_fkey foreign KEY (changed_by_user_id) references users (user_id),
  constraint appointment_status_history_status_check check (
    (
      status = any (
        array[
          'requested'::text,
          'proposed'::text,
          'booked'::text,
          'arrived'::text,
          'ongoing'::text,
          'completed'::text,
          'cancelled'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_history_appointment on public.appointment_status_history using btree (appointment_id) TABLESPACE pg_default;

create index IF not exists idx_history_changed_at on public.appointment_status_history using btree (changed_at desc) TABLESPACE pg_default;

create index IF not exists idx_history_status on public.appointment_status_history using btree (status) TABLESPACE pg_default;