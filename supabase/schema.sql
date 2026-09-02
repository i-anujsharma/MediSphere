-- MediKiosk database schema
-- Run this in Supabase: Project -> SQL Editor -> New Query -> paste -> Run

create extension if not exists "uuid-ossp";

-- Common profile table, linked to Supabase's built-in auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'doctor')),
  name text,
  mobile_number text,
  preferred_language text default 'en',
  created_at timestamp with time zone default now()
);

-- Patient-specific details
create table patients (
  id uuid primary key references profiles(id) on delete cascade,
  abha_id text unique,
  dob date,
  gender text,
  emergency_contact_number text
);

-- Doctor-specific details
create table doctors (
  id uuid primary key references profiles(id) on delete cascade,
  specialization text,
  availability_status text default 'offline' check (availability_status in ('online', 'offline', 'busy'))
);

-- Core consultation record: one row per patient visit/case
create table consultations (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  doctor_id uuid references doctors(id),
  status text default 'waiting' check (status in ('waiting', 'accepted', 'in_progress', 'completed')),
  ai_summary text,
  doctor_notes text,
  red_flag boolean default false,
  red_flag_reason text,
  created_at timestamp with time zone default now(),
  accepted_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Symptom interview Q&A log
create table symptom_interview (
  id uuid primary key default uuid_generate_v4(),
  consultation_id uuid references consultations(id) on delete cascade,
  question text,
  answer text,
  input_type text check (input_type in ('voice', 'text')),
  created_at timestamp with time zone default now()
);

-- Uploaded prescription/report documents
create table documents (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  consultation_id uuid references consultations(id) on delete set null,
  file_url text,
  ocr_extracted_text text,
  uploaded_at timestamp with time zone default now()
);

-- Medicine reminders
create table medicine_reminders (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  medicine_name text not null,
  dosage text,
  frequency text,
  reminder_time time,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Row Level Security: patients see only their own data, doctors see consultations
alter table patients enable row level security;
alter table consultations enable row level security;
alter table documents enable row level security;
alter table medicine_reminders enable row level security;

create policy "Patients manage their own row"
  on patients for all
  using (auth.uid() = id);

create policy "Patients see their own consultations"
  on consultations for select
  using (auth.uid() = patient_id);

create policy "Patients insert their own consultations"
  on consultations for insert
  with check (auth.uid() = patient_id);

create policy "Doctors see all consultations"
  on consultations for select
  using (exists (select 1 from doctors where doctors.id = auth.uid()));

create policy "Doctors update consultations"
  on consultations for update
  using (exists (select 1 from doctors where doctors.id = auth.uid()));

create policy "Patients manage their own documents"
  on documents for all
  using (auth.uid() = patient_id);

create policy "Patients manage their own reminders"
  on medicine_reminders for all
  using (auth.uid() = patient_id);
