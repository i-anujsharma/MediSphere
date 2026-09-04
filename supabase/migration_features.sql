-- MediSphere feature migration
-- Run this in Supabase: Project -> SQL Editor -> New Query -> paste -> Run

-- 1) Family member profiles ---------------------------------------------
create table if not exists family_members (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  name text not null,
  relation text,
  dob date,
  gender text,
  created_at timestamp with time zone default now()
);

alter table family_members enable row level security;

create policy "Patients manage their own family members"
  on family_members for all
  using (auth.uid() = patient_id)
  with check (auth.uid() = patient_id);

create policy "Doctors can view family members on consultations"
  on family_members for select
  using (exists (select 1 from doctors where doctors.id = auth.uid()));

-- 2) Consultations: link to a family member, severity tier, rating ------
alter table consultations
  add column if not exists for_family_member_id uuid references family_members(id) on delete set null,
  add column if not exists severity text default 'routine' check (severity in ('routine', 'moderate', 'urgent')),
  add column if not exists rating smallint check (rating between 1 and 5),
  add column if not exists feedback text;

-- Backfill severity from the existing red_flag boolean so old rows sort correctly.
update consultations set severity = 'urgent' where red_flag = true and severity = 'routine';

-- 3) Realtime: make sure the consultations table streams updates -------
alter publication supabase_realtime add table consultations;
