-- Supabase schema for Invoice App (multi-user)
-- Jalankan di Supabase: SQL Editor -> New query -> Run

-- 1) Profiles (role: user/admin/owner)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','admin','owner')),
  email text,
  full_name text,
  username text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Only the user can read/update their own profile; admin can read all profiles
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','owner'))
);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'username', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 2) Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  uploaded_at timestamptz not null default now(),

  -- Core fields (sesuaikan bila kamu mau tambah/kurang)
  vendor text,
  invoice_no text,
  invoice_date text,
  due_date text,

  subtotal_printed bigint,
  total_printed bigint,
  diff bigint,

  total_paid bigint default 0,
  remaining bigint,

  payment_status text,          -- e.g. "Paid" / "Unpaid" / "Partial"
  validation_status text,       -- e.g. "Valid" / "Need Review"
  fingerprint text,             -- for duplicate check

  items jsonb,                  -- parsed line items

  notes text,

  -- PDF storage
  pdf_bucket text,
  pdf_path text,
  original_filename text,
  file_size bigint
);

create unique index if not exists invoices_user_fingerprint_uq
on public.invoices (user_id, fingerprint)
where fingerprint is not null;

alter table public.invoices enable row level security;

-- user can CRUD their own invoices; admin can CRUD all
create policy "invoices_select_own_or_admin"
on public.invoices for select
to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','owner'))
);

create policy "invoices_insert_own_or_admin"
on public.invoices for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','owner'))
);

create policy "invoices_update_own_or_admin"
on public.invoices for update
to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','owner'))
)
with check (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','owner'))
);

create policy "invoices_delete_own_or_admin"
on public.invoices for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','owner'))
);

-- 3) Storage policies (bucket: invoices)
-- Buat bucket dulu di Dashboard: Storage -> New bucket -> name: invoices (private)
-- Setelah itu jalankan policies ini.

-- IMPORTANT:
-- Supabase Storage policies apply to storage.objects table.

alter table storage.objects enable row level security;

-- Allow authenticated users to read their own files (owner) or admin read all
create policy "storage_read_own_or_admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'invoices'
  and (
    owner = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','owner'))
  )
);

-- Allow authenticated users to upload into invoices bucket (they become owner)
create policy "storage_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'invoices'
  and owner = auth.uid()
);

-- Allow delete/update for own objects; admin can delete all
create policy "storage_update_delete_own_or_admin"
on storage.objects for update
to authenticated
using (
  bucket_id = 'invoices'
  and (
    owner = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','owner'))
  )
)
with check (
  bucket_id = 'invoices'
  and (
    owner = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','owner'))
  )
);

create policy "storage_delete_own_or_admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'invoices'
  and (
    owner = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','owner'))
  )
);


-- 4) Assign roles (jalankan ulang kapan saja; aman walau user belum ada)
update public.profiles set role = 'admin' where email = 'anggunnifa02@gmail.com';
update public.profiles set role = 'owner' where email = 'nasikinputrapraja@gmail.com';
