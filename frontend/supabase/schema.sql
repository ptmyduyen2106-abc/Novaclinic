-- ═══════════════════════════════════════════════════════════
--  PhòngKhám — Supabase SQL Schema v2
--  Paste toàn bộ file này vào Supabase SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- TABLE: users
-- ═══════════════════════════════════════════════════════════
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null check (role in ('doctor', 'pharma', 'admin', 'patient')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users: read own row" on public.users
  for select using (
    auth.uid() = id
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

create policy "users: admin insert" on public.users
  for insert with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
    or auth.uid() = id
  );

-- ═══════════════════════════════════════════════════════════
-- TABLE: patients (hồ sơ bệnh nhân — tách khỏi auth.users)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.patients (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  date_of_birth date,
  gender        text check (gender in ('male','female','other')),
  phone         text,
  address       text,
  blood_type    text,
  allergies     text,
  insurance_id  text,
  created_at    timestamptz not null default now()
);

alter table public.patients enable row level security;

create policy "patients: read own" on public.patients
  for select using (
    auth.uid() = id
    or exists (select 1 from public.users where id = auth.uid() and role in ('doctor','admin'))
  );

create policy "patients: insert own" on public.patients
  for insert with check (auth.uid() = id);

create policy "patients: update own" on public.patients
  for update using (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════
-- TABLE: appointments (lịch hẹn)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.appointments (
  id         uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references auth.users(id),
  doctor_id  uuid references public.users(id),
  date       date not null,
  time_slot  time not null,
  reason     text,
  status     text not null default 'pending'
             check (status in ('pending','confirmed','cancelled','done')),
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_date      on public.appointments(date);
create index if not exists idx_appointments_patient   on public.appointments(patient_id);
create index if not exists idx_appointments_doctor    on public.appointments(doctor_id);
create index if not exists idx_appointments_status    on public.appointments(status);

alter table public.appointments enable row level security;

create policy "appointments: patient read own" on public.appointments
  for select using (
    auth.uid() = patient_id
    or exists (select 1 from public.users where id = auth.uid() and role in ('doctor','admin'))
  );

create policy "appointments: patient insert" on public.appointments
  for insert with check (auth.uid() = patient_id);

create policy "appointments: patient update own" on public.appointments
  for update using (auth.uid() = patient_id or exists (select 1 from public.users where id = auth.uid() and role in ('doctor','admin')));

create policy "appointments: doctor update" on public.appointments
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role in ('doctor','admin'))
  );

alter publication supabase_realtime add table public.appointments;

-- ═══════════════════════════════════════════════════════════
-- TABLE: queue_numbers (số thứ tự hàng chờ)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.queue_numbers (
  id             uuid primary key default uuid_generate_v4(),
  appointment_id uuid references public.appointments(id),
  queue_number   int not null,
  date           date not null default current_date,
  called_at      timestamptz,
  status         text not null default 'waiting'
                 check (status in ('waiting','called','done','skipped')),
  created_at     timestamptz not null default now()
);

create index if not exists idx_queue_date   on public.queue_numbers(date);
create index if not exists idx_queue_status on public.queue_numbers(status);

alter table public.queue_numbers enable row level security;

create policy "queue: read all authenticated" on public.queue_numbers
  for select using (auth.role() = 'authenticated');

create policy "queue: insert doctor admin" on public.queue_numbers
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and role in ('doctor','admin'))
  );

create policy "queue: update doctor admin" on public.queue_numbers
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role in ('doctor','admin'))
  );

alter publication supabase_realtime add table public.queue_numbers;

-- ═══════════════════════════════════════════════════════════
-- TABLE: patient_records (hồ sơ khám + toa thuốc)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.patient_records (
  id             uuid primary key default uuid_generate_v4(),
  patient_name   text not null,
  year_of_birth  int,
  weight         numeric(5,2),
  phone          text,
  diagnosis      text not null,
  prescription   jsonb not null default '[]',
  services       jsonb not null default '[]',
  service_note   text,
  total_price    numeric(12,0) not null default 0,
  advice         text,
  pharmacy_note  text,
  status         text not null default 'pending'
                 check (status in ('pending','done','cancelled')),
  doctor_id      uuid not null references public.users(id),
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);

create index if not exists idx_patient_records_status     on public.patient_records(status);
create index if not exists idx_patient_records_doctor_id  on public.patient_records(doctor_id);
create index if not exists idx_patient_records_created_at on public.patient_records(created_at desc);
create index if not exists idx_patient_records_phone      on public.patient_records(phone);

alter table public.patient_records enable row level security;

create policy "patient_records: doctor insert" on public.patient_records
  for insert with check (
    auth.uid() = doctor_id
    and exists (select 1 from public.users where id = auth.uid() and role in ('doctor','admin'))
  );

create policy "patient_records: doctor read own" on public.patient_records
  for select using (
    (auth.uid() = doctor_id and exists (select 1 from public.users where id = auth.uid() and role = 'doctor'))
    or exists (select 1 from public.users where id = auth.uid() and role in ('pharma','admin'))
  );

create policy "patient_records: pharma update" on public.patient_records
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role in ('pharma','admin'))
  ) with check (true);

create policy "patient_records: admin all" on public.patient_records
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Patient xem hồ sơ của mình (qua phone)
create policy "patient_records: patient read own by phone" on public.patient_records
  for select using (
    exists (
      select 1 from public.patients p
      where p.id = auth.uid() and p.phone = patient_records.phone
    )
  );

alter publication supabase_realtime add table public.patient_records;

-- ═══════════════════════════════════════════════════════════
-- TABLE: follow_ups (lịch tái khám)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.follow_ups (
  id         uuid primary key default uuid_generate_v4(),
  patient_id uuid references auth.users(id),
  phone      text,
  doctor_id  uuid references public.users(id),
  due_date   date not null,
  reason     text,
  note       text,
  status     text not null default 'pending'
             check (status in ('pending','booked','done')),
  created_at timestamptz not null default now()
);

create index if not exists idx_follow_ups_due_date  on public.follow_ups(due_date);
create index if not exists idx_follow_ups_patient   on public.follow_ups(patient_id);
create index if not exists idx_follow_ups_status    on public.follow_ups(status);

alter table public.follow_ups enable row level security;

create policy "follow_ups: doctor insert" on public.follow_ups
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and role in ('doctor','admin'))
  );

create policy "follow_ups: read" on public.follow_ups
  for select using (
    auth.uid() = patient_id
    or exists (select 1 from public.users where id = auth.uid() and role in ('doctor','admin'))
  );

create policy "follow_ups: update doctor admin" on public.follow_ups
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role in ('doctor','admin'))
  );

-- ═══════════════════════════════════════════════════════════
-- TABLE: expenses
-- ═══════════════════════════════════════════════════════════
create table if not exists public.expenses (
  id         uuid primary key default uuid_generate_v4(),
  date       date not null,
  amount     numeric(12,0) not null,
  detail     text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_date on public.expenses(date desc);

alter table public.expenses enable row level security;

create policy "expenses: admin full" on public.expenses
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "expenses: pharma read" on public.expenses
  for select using (exists (select 1 from public.users where id = auth.uid() and role = 'pharma'));

alter publication supabase_realtime add table public.expenses;

-- ═══════════════════════════════════════════════════════════
-- TABLE: inventory
-- ═══════════════════════════════════════════════════════════
create table if not exists public.inventory (
  id             uuid primary key default uuid_generate_v4(),
  date           date not null,
  invoice_number text,
  item_type      text not null,
  amount         numeric(12,0) not null,
  payment_method text not null default 'TM' check (payment_method in ('TM','CK','No')),
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_inventory_date on public.inventory(date desc);

alter table public.inventory enable row level security;

create policy "inventory: admin full" on public.inventory
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "inventory: pharma read" on public.inventory
  for select using (exists (select 1 from public.users where id = auth.uid() and role in ('pharma','admin')));

create policy "inventory: pharma insert" on public.inventory
  for insert with check (exists (select 1 from public.users where id = auth.uid() and role in ('pharma','admin')));

alter publication supabase_realtime add table public.inventory;

-- ═══════════════════════════════════════════════════════════
-- TABLE: notifications
-- ═══════════════════════════════════════════════════════════
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade,
  type       text check (type in ('appointment_reminder','queue_update','follow_up','general')),
  title      text not null,
  body       text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: read own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications: update own" on public.notifications
  for update using (auth.uid() = user_id);

create policy "notifications: insert admin system" on public.notifications
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
    or auth.uid() = user_id
  );

alter publication supabase_realtime add table public.notifications;

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: Auto-create users row on signup
-- ═══════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════
create or replace view public.monthly_revenue as
select date_trunc('month', created_at) as month,
       count(*) as patient_count, sum(total_price) as total_revenue
from public.patient_records where status = 'done'
group by 1 order by 1 desc;

create or replace view public.monthly_expenses as
select date_trunc('month', created_at::timestamptz) as month, sum(amount) as total_expense
from public.expenses group by 1 order by 1 desc;

create or replace view public.monthly_inventory as
select date_trunc('month', created_at) as month, sum(amount) as total_inventory
from public.inventory group by 1 order by 1 desc;

create or replace view public.monthly_profit as
select
  coalesce(r.month, e.month, i.month)   as month,
  coalesce(r.total_revenue, 0)          as revenue,
  coalesce(e.total_expense, 0)          as expenses,
  coalesce(i.total_inventory, 0)        as inventory,
  coalesce(r.total_revenue, 0) - coalesce(e.total_expense, 0) - coalesce(i.total_inventory, 0) as net_profit,
  coalesce(r.patient_count, 0)          as patients
from public.monthly_revenue r
  full outer join public.monthly_expenses  e on r.month = e.month
  full outer join public.monthly_inventory i on r.month = i.month
order by month desc;

-- ═══════════════════════════════════════════════════════════
-- SEED: Demo accounts
-- Chạy SAU KHI đã tạo user qua Supabase Auth > Users > Add user
-- Thay UUID bên dưới bằng UUID thực từ Auth dashboard
-- ═══════════════════════════════════════════════════════════
-- insert into public.users (id, name, role) values
--   ('REPLACE-DOCTOR-UUID',  'Bác sĩ Nguyễn Văn A', 'doctor'),
--   ('REPLACE-PHARMA-UUID',  'Dược sĩ Trần Thị B',  'pharma'),
--   ('REPLACE-ADMIN-UUID',   'Quản lý Lê Văn C',    'admin')
-- on conflict (id) do update set name = excluded.name, role = excluded.role;
