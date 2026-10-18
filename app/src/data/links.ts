// Guest links. A link carries the stay details itself, so it opens correctly on the
// guest's own phone even before a shared server exists. The guest's phone number is
// left out of the link on purpose.

import { stayText, type Booking, type MemberId } from './model';

export interface GuestStay { id: string; member: MemberId; guest: string; count: number; start: string; end: string }

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export const appBase = () => location.origin + location.pathname;

export function guestLink(b: Booking) {
  const d = b64(JSON.stringify([b.member, b.guest, b.count, b.start, b.end]));
  return `${appBase()}#/stay/${b.id}?d=${d}`;
}

export function decodeStay(id: string, d: string | null): GuestStay | null {
  if (!d) return null;
  try {
    const [member, guest, count, start, end] = JSON.parse(unb64(d));
    return { id, member, guest, count, start, end };
  } catch { return null; }
}

export function guestWhatsApp(b: Booking) {
  const link = guestLink(b);
  const txt = `Hare Krishna ${b.guest}! Your stay at Shri Ji Kunj, Goverdhan Eco Village is confirmed for ${stayText(b)}. Address, map, darshan timings and e-bike guide: ${link}`;
  return whatsAppTo(b.phone, txt);
}

/** Opens WhatsApp with `text` ready to send, to `phone` if known, else to a chosen contact. */
export const whatsAppTo = (phone: string | undefined, text: string) =>
  (phone ? 'https://wa.me/91' + phone : 'https://wa.me/') + '?text=' + encodeURIComponent(text);

export function copyText(t: string) {
  try { navigator.clipboard.writeText(t); } catch { /* clipboard unavailable */ }
}
