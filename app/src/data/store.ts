// Bookings store. Everything that reads or writes bookings goes through here, so the
// localStorage backend can later be swapped for a shared server (see README) without
// touching the screens.

import { useSyncExternalStore } from 'react';
import { add, today, type Booking } from './model';

const KEY = 'sjk_bookings_v1';
const SESSION_KEY = 'sjk_session_v1';

const seed = (): Booking[] => {
  const t = today();
  return [
    { id: 'RK-M4T2', member: 'bapuji', guest: 'Mehta family', phone: '9820011111', count: 4, start: add(t, 4), end: add(t, 7) },
    { id: 'RK-P8R1', member: 'surbhi', guest: 'Priya & Rohan', phone: '9820022222', count: 2, start: add(t, 6), end: add(t, 9) },
    { id: 'RK-A3F9', member: 'arun', guest: 'Sharma ji & family', phone: '9820033333', count: 3, start: add(t, 12), end: add(t, 15) },
    { id: 'RK-K7S5', member: 'anuj', guest: 'Kartik Sharma', phone: '9820044444', count: 1, start: add(t, 19), end: add(t, 22) },
    { id: 'RK-G2K6', member: 'ma', guest: 'Kirtan group, Pune', phone: '9820055555', count: 5, start: add(t, 27), end: add(t, 33) },
  ];
};

const load = (): Booking[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(v)) return v;
  } catch { /* fall through to seed */ }
  return seed();
};

let bookings = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

// Keep several open tabs (e.g. family + guest preview) in step.
window.addEventListener('storage', e => { if (e.key === KEY) { bookings = load(); emit(); } });

export const bookingStore = {
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  get: () => bookings,
  save(next: Booking[]) {
    bookings = next;
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full or blocked */ }
    emit();
  },
  addBooking(b: Booking) { this.save([...bookings, b]); },
  remove(id: string) { this.save(bookings.filter(b => b.id !== id)); },
};

export const useBookings = () => useSyncExternalStore(bookingStore.subscribe, bookingStore.get);

export interface Session { phone: string; member: string }
export const session = {
  get(): Session | null { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } },
  set(s: Session | null) { try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } },
};
