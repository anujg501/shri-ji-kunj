// Family members, date helpers and booking types shared by both sides of the app.

export type MemberId = 'ma' | 'bapuji' | 'arun' | 'surbhi' | 'swapnil' | 'anuj';

export interface Member {
  id: MemberId;
  name: string;
  full: string;
  color: string;
  ini: string;
  /** 10-digit mobile. Must match supabase/schema.sql, which is what sign-in checks. */
  phone: string;
  /** Can remove anyone's stay and clear the calendar. The database enforces this (is_admin in schema.sql). */
  admin?: boolean;
}

export const MEMBERS: Member[] = [
  { id: 'ma', name: 'Ma', full: 'Amoha Radha Devi Dasi', color: '#8B1E2E', ini: 'Ma', phone: '7738390002' },
  { id: 'bapuji', name: 'Bapuji', full: 'Ashok ji Gupta', color: '#0E5C4A', ini: 'Ba', phone: '9867146900' },
  { id: 'arun', name: 'Arun prabhu', full: 'Arun prabhu', color: '#1E3A8A', ini: 'Ar', phone: '9987664399' },
  { id: 'surbhi', name: 'Surbhi mataji', full: 'Radha Devi Dasi', color: '#B7791F', ini: 'Su', phone: '7738788848' },
  { id: 'swapnil', name: 'Swapnil mataji', full: 'Swapnil mataji', color: '#6B3F73', ini: 'Sw', phone: '9929165555' },
  { id: 'anuj', name: 'Anuj prabhu', full: 'Anuj prabhu', color: '#4A5F2C', ini: 'An', phone: '7710065480', admin: true },
];
export const MB = Object.fromEntries(MEMBERS.map(m => [m.id, m])) as Record<MemberId, Member>;

/** Member by mobile number, used by local mode to skip the "Who is this?" step. */
export const KNOWN_PHONES = Object.fromEntries(MEMBERS.map(m => [m.phone, m.id])) as Record<string, MemberId>;

/** A stay. `start` is check-in, `end` is check-out (exclusive): nights are start..end-1. */
export interface Booking {
  id: string;
  member: MemberId;
  guest: string;
  phone: string;
  count: number;
  start: string;
  end: string;
}

export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const add = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const fmt = (s: string) => { const d = parse(s); return d.getDate() + ' ' + MON[d.getMonth()]; };
export const nightsOf = (a: string, b: string) => Math.round((+parse(b) - +parse(a)) / 864e5);
export const today = () => iso(new Date());
export const fmtPhone = (p: string) => (p ? p.slice(0, 5) + ' ' + p.slice(5) : '');
export const overlap = (a: { start: string; end: string }, s: string, e: string) => a.start < e && a.end > s;
export const byStart = (a: Booking, b: Booking) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
export const stayText = (b: Booking) => fmt(b.start) + ' → ' + fmt(b.end);
export const people = (n: number) => n + (n > 1 ? ' people' : ' person');
/** Stay id. Long enough that guest links can't be guessed from one another. */
export const newId = () => 'RK-' + Array.from(crypto.getRandomValues(new Uint8Array(8)), n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join('');
