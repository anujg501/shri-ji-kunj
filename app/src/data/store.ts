// Bookings and sign-in. This is the only file that talks to storage, and it runs
// in one of two modes (see config.ts):
//   • cloud — the shared Supabase database, live-updated on every family phone;
//   • local — this browser only, any OTP works. For design and testing.
// Screens call the same functions either way.

import { useSyncExternalStore } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CLOUD, CONFIG } from '../config';
import { add, KNOWN_PHONES, MB, today, type Booking, type MemberId } from './model';

export const db = CLOUD ? createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey) : null;

const KEY = 'sjk_bookings_v1';
const SESSION_KEY = 'sjk_session_v1';

// ── bookings ─────────────────────────────────────────────────────────────────

const seed = (): Booking[] => {
  const t = today();
  return [
    { id: 'RK-M4T2', member: 'bapuji', guest: 'Mehta family', phone: '9820011111', count: 4, start: add(t, 4), end: add(t, 7) },
    { id: 'RK-P8R1', member: 'surbhi', guest: 'Priya & Rohan', phone: '9820022222', count: 2, start: add(t, 7), end: add(t, 9) },
    { id: 'RK-A3F9', member: 'arun', guest: 'Sharma ji & family', phone: '9820033333', count: 3, start: add(t, 12), end: add(t, 15) },
    { id: 'RK-K7S5', member: 'anuj', guest: 'Kartik Sharma', phone: '9820044444', count: 1, start: add(t, 19), end: add(t, 22) },
    { id: 'RK-G2K6', member: 'ma', guest: 'Kirtan group, Pune', phone: '9820055555', count: 5, start: add(t, 27), end: add(t, 33) },
  ];
};

const loadLocal = (): Booking[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(v)) return v;
  } catch { /* fall through to seed */ }
  return seed();
};

interface Row { id: string; member: MemberId; guest: string; phone: string; count: number; start_date: string; end_date: string }
const fromRow = (r: Row): Booking => ({ id: r.id, member: r.member, guest: r.guest, phone: r.phone, count: r.count, start: r.start_date, end: r.end_date });
const toRow = (b: Booking): Row => ({ id: b.id, member: b.member, guest: b.guest, phone: b.phone, count: b.count, start_date: b.start, end_date: b.end });

let bookings: Booking[] = CLOUD ? [] : loadLocal();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const setAll = (next: Booking[]) => {
  bookings = next;
  if (!CLOUD) { try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full or blocked */ } }
  emit();
};

// Keep several open tabs (e.g. family + guest preview) in step in local mode.
if (!CLOUD) window.addEventListener('storage', e => { if (e.key === KEY) { bookings = loadLocal(); emit(); } });

async function refresh() {
  if (!db) return;
  const { data, error } = await db.from('sjk_bookings').select('id, member, guest, phone, count, start_date, end_date');
  if (error) throw error;
  setAll((data as Row[]).map(fromRow));
}

export const bookingStore = {
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  get: () => bookings,

  /** Load and keep listening while the family app is open. Returns a stop function. */
  start(onError: (msg: string) => void) {
    if (!db) return () => {};
    const load = () => refresh().catch(() => onError("Couldn't load the calendar. Check your internet."));
    load();
    const ch = db.channel('sjk_bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sjk_bookings' }, load)
      .subscribe();
    // Phones drop live connections in the background; catch up on return.
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { db.removeChannel(ch); document.removeEventListener('visibilitychange', onVisible); setAll([]); };
  },

  /** Shown straight away, then saved; rolled back if saving fails. */
  async addBooking(b: Booking) {
    const before = bookings;
    setAll([...bookings, b]);
    if (!db) return;
    const { error } = await db.from('sjk_bookings').insert(toRow(b));
    if (error) { setAll(before); throw error; }
  },

  /** Admin only: removes every stay. */
  async clearAll() {
    const before = bookings;
    setAll([]);
    if (!db) return;
    const { error } = await db.rpc('sjk_clear_bookings');
    if (error) { setAll(before); throw error; }
  },

  async remove(id: string) {
    const before = bookings;
    setAll(bookings.filter(b => b.id !== id));
    if (!db) return;
    const { error } = await db.from('sjk_bookings').delete().eq('id', id);
    if (error) { setAll(before); throw error; }
  },
};

export const useBookings = () => useSyncExternalStore(bookingStore.subscribe, bookingStore.get);

// ── sign-in ──────────────────────────────────────────────────────────────────

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const NET = "Couldn't reach the server. Check your internet and try again.";

async function myMember(): Promise<MemberId | null> {
  if (!db) return null;
  const { data, error } = await db.rpc('sjk_my_member');
  if (error) throw error;
  return data && MB[data as MemberId] ? (data as MemberId) : null;
}

export const auth = {
  /** The member already signed in on this phone, if any. */
  async restore(): Promise<MemberId | null> {
    if (!db) { const s = localStorage.getItem(SESSION_KEY); return s && MB[s as MemberId] ? (s as MemberId) : null; }
    const { data } = await db.auth.getSession();
    if (!data.session) return null;
    try { return await myMember(); } catch { return null; }
  },

  async sendOtp(phone: string): Promise<Result<null>> {
    if (!db) return { ok: true, value: null };
    const fam = await db.rpc('sjk_is_family', { p_phone: phone });
    if (fam.error) return { ok: false, error: NET };
    if (!fam.data) return { ok: false, error: "This number isn't on the family list." };
    const { error } = await db.auth.signInWithOtp({ phone: '+91' + phone });
    return error ? { ok: false, error: "Couldn't send the code. Please try again in a minute." } : { ok: true, value: null };
  },

  /** The member for this number, or null in local mode when the number is unknown (ask "Who is this?"). */
  async verifyOtp(phone: string, code: string): Promise<Result<MemberId | null>> {
    if (!db) return { ok: true, value: KNOWN_PHONES[phone] ?? null };
    const { error } = await db.auth.verifyOtp({ phone: '+91' + phone, token: code, type: 'sms' });
    if (error) return { ok: false, error: 'That code is wrong or has expired.' };
    try {
      const m = await myMember();
      if (m) return { ok: true, value: m };
      await db.auth.signOut();
      return { ok: false, error: "This number isn't on the family list." };
    } catch { return { ok: false, error: NET }; }
  },

  /** Local mode only: remember who picked which name. */
  remember(member: MemberId) { if (!db) try { localStorage.setItem(SESSION_KEY, member); } catch { /* ignore */ } },

  async signOut() {
    if (db) await db.auth.signOut();
    else try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  },
};

// ── guest link ───────────────────────────────────────────────────────────────

export interface GuestLookup {
  stay: { id: string; member: MemberId; guest: string; count: number; start: string; end: string } | null;
  others: { id: string; member: MemberId; guest: string; start: string; end: string }[];
}

/** The live stay behind a guest link. Null when it can't be checked (offline or local mode). */
export async function lookupGuestStay(id: string): Promise<GuestLookup | null> {
  if (!db) return null;
  const { data, error } = await db.rpc('sjk_guest_stay', { p_id: id });
  if (error) return null;
  return data ? (data as GuestLookup) : { stay: null, others: [] };
}
