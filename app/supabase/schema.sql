-- ══════════════════════════════════════════════════════════════════════════
-- Shri Ji Kunj — family calendar database
--
-- Runs inside the existing GRA Moissanite Supabase project, so the family
-- calendar can reuse its working SMS sign-in. Everything here is NEW and
-- prefixed sjk_; no GRA table, function or rule is created, changed or read.
--
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- It is safe to run again: it updates what is there instead of failing.
--
-- Who can do what:
--   • Only the six numbers in sjk_members can see or change bookings. Any
--     other account in this project (e.g. a GRA customer) sees nothing.
--   • A member can add stays under their own name and remove only their own.
--     The admin (Anuj prabhu) can also remove anyone's stay or clear them all.
--   • First come, first served: two stays can never share a night. The
--     database itself refuses the second one, even if both are confirmed
--     at the same moment.
--   • Guests are not signed in. They can only call sjk_guest_stay(), which
--     returns one stay by its id, without any mobile numbers.
-- ══════════════════════════════════════════════════════════════════════════


-- ── the family ────────────────────────────────────────────────────────────
-- 10-digit Indian mobile numbers. To change a number, edit it here and re-run,
-- or edit the row in Table Editor → sjk_members.

create table if not exists public.sjk_members (
  id    text primary key,
  name  text not null,
  phone text not null unique check (phone ~ '^\d{10}$')
);
alter table public.sjk_members enable row level security;
-- No policies: the table is read only through the functions below.

insert into public.sjk_members (id, name, phone) values
  ('ma',      'Ma',             '7738390002'),
  ('bapuji',  'Bapuji',         '9867146900'),
  ('arun',    'Arun prabhu',    '9987664399'),
  ('surbhi',  'Surbhi mataji',  '7738788848'),
  ('swapnil', 'Swapnil mataji', '9929165555'),
  ('anuj',    'Anuj prabhu',    '7710065480')
on conflict (id) do update set name = excluded.name, phone = excluded.phone;

-- The admin can remove any stay and clear the calendar. Must match `admin`
-- in src/data/model.ts, which only decides what the app shows.
alter table public.sjk_members add column if not exists is_admin boolean not null default false;
update public.sjk_members set is_admin = (id = 'anuj');


-- ── who is signed in ──────────────────────────────────────────────────────
-- The member id of the current user, or null if their number is not family.
-- Supabase stores phones as 91XXXXXXXXXX; the last ten digits are compared.

create or replace function public.sjk_my_member()
returns text
language sql stable security definer
set search_path = public, auth
as $$
  select m.id
  from auth.users u
  join public.sjk_members m on m.phone = right(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), 10)
  where u.id = auth.uid();
$$;
revoke all on function public.sjk_my_member() from public, anon;
grant execute on function public.sjk_my_member() to authenticated;

create or replace function public.sjk_is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.sjk_members where id = public.sjk_my_member()), false);
$$;
revoke all on function public.sjk_is_admin() from public, anon;
grant execute on function public.sjk_is_admin() to authenticated;

-- Checked before an OTP is sent, so an SMS is never spent on a stranger's
-- number. Answers only yes or no.
create or replace function public.sjk_is_family(p_phone text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sjk_members
    where phone = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)
  );
$$;
revoke all on function public.sjk_is_family(text) from public;
grant execute on function public.sjk_is_family(text) to anon, authenticated;


-- ── bookings ──────────────────────────────────────────────────────────────
-- end_date is the check-out day: nights run start_date .. end_date - 1.

create table if not exists public.sjk_bookings (
  id          text primary key,
  member      text not null references public.sjk_members(id),
  guest       text not null check (char_length(guest) between 1 and 100),
  phone       text not null check (phone ~ '^\d{10}$'),
  count       int  not null check (count between 1 and 20),
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid() references auth.users on delete set null,
  check (end_date > start_date)
);
alter table public.sjk_bookings enable row level security;

-- First come, first served. Check-out day may equal the next check-in day.
-- If this step fails with "could not create exclusion constraint", two
-- existing stays overlap: delete one in Table Editor → sjk_bookings, re-run.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sjk_bookings_no_overlap') then
    alter table public.sjk_bookings add constraint sjk_bookings_no_overlap
      exclude using gist (daterange(start_date, end_date) with &&);
  end if;
end $$;

drop policy if exists "family reads bookings" on public.sjk_bookings;
create policy "family reads bookings"
  on public.sjk_bookings for select to authenticated
  using (public.sjk_my_member() is not null);

drop policy if exists "family adds own bookings" on public.sjk_bookings;
create policy "family adds own bookings"
  on public.sjk_bookings for insert to authenticated
  with check (member = public.sjk_my_member());

drop policy if exists "family removes own bookings" on public.sjk_bookings;
create policy "family removes own bookings"
  on public.sjk_bookings for delete to authenticated
  using (member = public.sjk_my_member() or public.sjk_is_admin());

-- Admin only: empty the calendar. Returns how many stays were removed.
create or replace function public.sjk_clear_bookings()
returns integer
language plpgsql security definer
set search_path = public
as $$
declare n integer;
begin
  if not public.sjk_is_admin() then
    raise exception 'Only the admin can clear the calendar' using errcode = '42501';
  end if;
  delete from public.sjk_bookings where true;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.sjk_clear_bookings() from public, anon;
grant execute on function public.sjk_clear_bookings() to authenticated;

-- Live updates: every family phone hears about a new or removed stay.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sjk_bookings'
  ) then
    alter publication supabase_realtime add table public.sjk_bookings;
  end if;
end $$;


-- ── the guest link ────────────────────────────────────────────────────────
-- One stay by id, plus the other stays overlapping it ("X's guests will also
-- be staying"). No mobile numbers. Null if the stay was removed.

create or replace function public.sjk_guest_stay(p_id text)
returns json
language sql stable security definer
set search_path = public
as $$
  select json_build_object(
    'stay', json_build_object('id', b.id, 'member', b.member, 'guest', b.guest, 'count', b.count,
                              'start', b.start_date, 'end', b.end_date),
    'others', coalesce((
      select json_agg(json_build_object('id', o.id, 'member', o.member, 'guest', o.guest,
                                        'start', o.start_date, 'end', o.end_date))
      from public.sjk_bookings o
      where o.id <> b.id and o.start_date < b.end_date and o.end_date > b.start_date
    ), '[]'::json)
  )
  from public.sjk_bookings b
  where b.id = p_id;
$$;
revoke all on function public.sjk_guest_stay(text) from public;
grant execute on function public.sjk_guest_stay(text) to anon, authenticated;
