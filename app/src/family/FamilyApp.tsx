// Family side: shared calendar, My stays, Stay info, plus the bottom sheets for
// viewing a day, blocking dates and sharing the guest link.

import { useEffect, useState } from 'react';
import Calendar, { MonthStays, type LabelMode } from './Calendar';
import SignIn from './SignIn';
import StayInfo, { type Section } from '../components/StayInfo';
import { AppHeader, useToast } from '../components/Phone';
import { auth, bookingStore, useBookings } from '../data/store';
import { copyText, guestLink, guestWhatsApp } from '../data/links';
import { byStart, DOW, fmt, fmtPhone, MB, newId, nightsOf, overlap, parse, people, stayText, today, type Booking, type MemberId } from '../data/model';

type Tab = 'cal' | 'mine' | 'info';
type Sheet = { type: 'day'; date: string } | { type: 'form' } | { type: 'done'; id: string; fresh?: boolean } | null;

const INFO: [Section, string][] = [['stay', 'Address & map'], ['temple', 'Darshan'], ['explore', 'Things to do'], ['ebike', 'Transport'], ['checkout', 'Check-out'], ['sos', 'Emergency']];
const btn = (extra: React.CSSProperties = {}): React.CSSProperties => ({ height: 44, borderRadius: 'var(--r-md)', fontWeight: 600, fontSize: 14, cursor: 'pointer', ...extra });
const primaryBtn = (h = 52, fs = 16): React.CSSProperties => btn({ height: h, border: 0, background: 'var(--emerald)', color: '#fff', fontSize: fs });
const label = { fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' };

interface Props {
  labels?: LabelMode;
  /** Called by "Preview guest app →". Defaults to opening the guest link in a new tab. */
  onPreviewGuest?: (b: Booking) => void;
}

export default function FamilyApp({ labels, onPreviewGuest }: Props) {
  const B = useBookings();
  const [toast, toastNode] = useToast();
  // undefined while checking whether this phone is already signed in
  const [me, setMe] = useState<MemberId | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('cal');
  const [infoSec, setInfoSec] = useState<Section>('stay');
  const [ym, setYm] = useState<[number, number]>(() => [new Date().getFullYear(), new Date().getMonth()]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selecting, setSelecting] = useState(false);
  const [sS, setSS] = useState<string | null>(null);
  const [sE, setSE] = useState<string | null>(null);
  const [form, setForm] = useState({ guest: '', phone: '', count: 2 });
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { auth.restore().then(setMe); }, []);
  useEffect(() => (me ? bookingStore.start(toast) : undefined), [me]);

  if (me === undefined) return <div className="col" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>Loading…</div>;
  if (!me || !MB[me]) {
    return <>
      <SignIn toast={toast} onDone={member => { auth.remember(member); setMe(member); setTab('cal'); toast('Hare Krishna, ' + MB[member].name); }} />
      {toastNode}
    </>;
  }
  const meM = MB[me];
  const T = today();

  const openDay = (d: string) => { setSheet({ type: 'day', date: d }); setConfirmDel(null); };
  const openDone = (id: string) => { setSheet({ type: 'done', id }); setCopied(false); setSelecting(false); };
  const startBlock = (from: string | null = null) => { setTab('cal'); setSelecting(true); setSS(from); setSE(null); setSheet(null); };
  const cancelSel = () => { setSelecting(false); setSS(null); setSE(null); };
  const signOut = () => { auth.signOut(); setMe(null); setSheet(null); setSelecting(false); };

  // First come, first served: dates someone has already booked can't be chosen.
  const bookedOn = (d: string) => B.find(b => b.start <= d && d < b.end);
  const clashWith = (s: string, e: string) => B.find(b => overlap(b, s, e));
  const decline = (b: Booking) => toast(`Sorry 🙏 ${fmt(b.start)} → ${fmt(b.end)} is already booked by ${b.member === me ? 'you' : MB[b.member].name} (${b.guest}). Please choose other dates.`);
  const raced = () => { setSheet(null); cancelSel(); toast('Sorry 🙏 someone has just booked these dates. Please choose other dates.'); };

  const onDay = (d: string) => {
    if (!selecting) return openDay(d);
    if (d < T) return toast('Pick a date from today onwards');
    if (!sS || sE || d <= sS) {
      const b = bookedOn(d);
      if (b) return decline(b);
      setSS(d); setSE(null);
    } else {
      const b = clashWith(sS, d);
      if (b) return decline(b);
      setSE(d);
    }
  };

  const nSel = sS && sE ? nightsOf(sS, sE) : 0;
  const phoneOk = /^\d{10}$/.test(form.phone), guestOk = form.guest.trim().length > 0;

  const confirm = async () => {
    if (!(guestOk && phoneOk) || !sS || !sE) return setTouched(true);
    if (saving) return;
    if (clashWith(sS, sE)) return raced();
    const nb: Booking = { id: newId(), member: me, guest: form.guest.trim(), phone: form.phone, count: form.count, start: sS, end: sE };
    setSaving(true);
    try { await bookingStore.addBooking(nb); } catch (e) {
      setSaving(false);
      // The database refuses overlapping stays, e.g. when two people confirm at the same moment.
      if ((e as { code?: string }).code === '23P01') return raced();
      return toast("Couldn't save. Check your internet and try again.");
    }
    setSaving(false);
    setSheet({ type: 'done', id: nb.id, fresh: true });
    setSelecting(false); setSS(null); setSE(null); setCopied(false);
  };

  const navBtn = (t: Tab, text: string, icon: React.ReactNode) => (
    <button className="tabbtn" onClick={() => { setTab(t); setConfirmClear(false); if (t === 'mine') setSelecting(false); }} style={{ height: 54, gap: 3, fontSize: 12, color: tab === t ? 'var(--emerald)' : 'var(--ink-3)' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{icon}</svg>{text}
    </button>
  );

  const myStays = B.filter(b => b.member === me && b.end >= T).sort(byStart);
  const isAdmin = !!meM.admin;
  const clearAll = () => {
    if (!confirmClear) return setConfirmClear(true);
    setConfirmClear(false);
    bookingStore.clearAll().then(() => toast('All bookings cleared. The calendar is empty for everyone.'), () => toast("Couldn't clear the calendar. Check your internet and try again."));
  };

  return (
    <>
      <div className="col" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <AppHeader title="Shri Ji Kunj" sub="F 11-103 · Goverdhan Kunj" right={
          <button onClick={signOut} title="Sign out" aria-label="Sign out" style={{ width: 40, height: 40, borderRadius: '50%', border: 0, background: meM.color, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{meM.ini}</button>
        } />

        <div className="scroll">
          {tab === 'cal' && (
            <div className="col" style={{ padding: '14px 12px 120px', gap: 14 }}>
              <Calendar ym={ym} onMonth={setYm} bookings={B} selecting={selecting} selStart={sS} selEnd={sE} labels={labels} onDay={onDay} />
              <MonthStays ym={ym} bookings={B} onOpen={openDay} />
            </div>
          )}

          {tab === 'mine' && (
            <div className="col" style={{ padding: '18px 16px 40px', gap: 10 }}>
              <div className="serif" style={{ fontSize: 24, padding: '0 4px 4px' }}>My stays</div>
              {myStays.map(b => (
                <div key={b.id} className="card col" style={{ padding: '14px 16px', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{b.guest}</span>
                    <span className="mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{fmt(b.start)}–{fmt(b.end)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{nightsOf(b.start, b.end)} nights · {b.count} people · +91 {fmtPhone(b.phone)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openDone(b.id)} style={btn({ flex: 1, border: 0, background: 'var(--emerald)', color: '#fff' })}>Share guest link</button>
                    <button onClick={() => { const d = parse(b.start); setTab('cal'); setYm([d.getFullYear(), d.getMonth()]); openDay(b.start); }} style={btn({ flex: 1, border: '1px solid var(--border-strong)', background: 'var(--surface-2)', color: 'var(--ink)' })}>Details</button>
                  </div>
                </div>
              ))}
              {!myStays.length && <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 14, color: 'var(--ink-3)', border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)' }}>You have no upcoming stays.</div>}
              <button onClick={() => startBlock()} style={btn({ height: 52, border: '1.5px dashed var(--emerald)', background: 'transparent', color: 'var(--emerald)', fontSize: 15, marginTop: 6 })}>+ Block new dates</button>
              {isAdmin && (
                <div className="col" style={{ gap: 8, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--divider)' }}>
                  <span className="eyebrow">Admin</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>You can remove anyone's booking from its day on the calendar, or clear every booking here. Guest links for removed stays stop working.</span>
                  <button onClick={clearAll} disabled={!B.length} style={btn({ height: 48, border: '1px solid var(--ruby)', background: confirmClear ? 'var(--ruby)' : 'var(--surface-2)', color: confirmClear ? '#fff' : 'var(--ruby)', opacity: B.length ? 1 : 0.5 })}>
                    {!B.length ? 'Calendar is empty' : confirmClear ? `Tap again to delete all ${B.length} bookings` : 'Clear all bookings'}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'info' && (
            <div className="col" style={{ padding: '16px 16px 40px', gap: 14 }}>
              <div className="serif" style={{ fontSize: 24, padding: '0 4px' }}>Stay info</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: '0 4px', marginTop: -8 }}>Same pages your guests see.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {INFO.map(([k, l]) => {
                  const on = infoSec === k;
                  return <button key={k} onClick={() => setInfoSec(k)} style={{ height: 36, padding: '0 14px', borderRadius: 18, border: '1px solid ' + (on ? 'var(--ink)' : 'var(--border)'), background: on ? 'var(--ink)' : 'var(--surface)', color: on ? 'var(--paper)' : 'var(--ink-2)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{l}</button>;
                })}
              </div>
              <StayInfo section={infoSec} />
            </div>
          )}
        </div>

        {selecting && !sheet && (
          <div className="col" style={{ position: 'absolute', left: 12, right: 12, bottom: 84, background: 'var(--ink)', color: 'var(--paper)', borderRadius: 'var(--r-lg)', padding: '14px 16px', gap: 12, boxShadow: 'var(--shadow-lg)' }}>
            <div className="col" style={{ gap: 2 }}>
              <span className="eyebrow" style={{ color: 'var(--ink-4)' }}>{!sS ? 'Step 1 · Tap check-in date' : !sE ? 'Step 2 · Tap check-out date' : nSel + (nSel > 1 ? ' nights' : ' night')}</span>
              <span className="serif" style={{ fontSize: 20 }}>{!sS ? 'Choose dates' : !sE ? fmt(sS) + ' → ?' : fmt(sS) + ' → ' + fmt(sE)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={cancelSel} style={btn({ flex: 1, height: 46, border: '1px solid var(--ink-3)', background: 'transparent', color: 'var(--paper)', fontSize: 15 })}>Cancel</button>
              <button onClick={() => {
                if (!(sS && sE)) return toast(!sS ? 'Tap your check-in date' : 'Now tap your check-out date');
                setSheet({ type: 'form' }); setForm({ guest: '', phone: '', count: 2 }); setTouched(false);
              }} style={btn({ flex: 1.4, height: 46, border: 0, background: 'var(--emerald)', color: '#fff', fontSize: 15, opacity: sS && sE ? 1 : 0.4 })}>Continue</button>
            </div>
          </div>
        )}

        <nav style={{ flex: 'none', height: 76, borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr', alignItems: 'center', padding: '0 10px 14px', boxSizing: 'border-box' }}>
          {navBtn('cal', 'Calendar', <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>)}
          <button onClick={() => startBlock()} style={{ height: 48, margin: '0 6px', border: 0, borderRadius: 24, background: 'var(--emerald)', color: '#fff', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', padding: '0 8px', cursor: 'pointer' }}>+ Block</button>
          {navBtn('mine', 'My stays', <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>)}
          {navBtn('info', 'Stay info', <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>)}
        </nav>
      </div>

      {sheet && (
        <div className="sheet-backdrop">
          <div onClick={() => { setSheet(null); setConfirmDel(null); }} style={{ flex: 1 }} />
          <div className="sheet" role="dialog">
            <div style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, background: 'var(--border)' }} />
            {sheet.type === 'day' && daySheet(sheet.date)}
            {sheet.type === 'form' && sS && sE && formSheet(sS, sE)}
            {sheet.type === 'done' && doneSheet(sheet.id, !!sheet.fresh)}
          </div>
        </div>
      )}
      {toastNode}
    </>
  );

  function daySheet(d: string) {
    const dt = parse(d);
    const stays = B.filter(b => b.start <= d && d < b.end);
    return (
      <div className="col" style={{ gap: 14 }}>
        <div className="col" style={{ gap: 2 }}><span className="eyebrow">Night of</span><span className="serif" style={{ fontSize: 26 }}>{DOW[dt.getDay()]}, {fmt(d)}</span></div>
        {!stays.length && (
          <div className="row" style={{ gap: 10, padding: 14, borderRadius: 'var(--r-lg)', background: 'var(--emerald-soft)', color: 'var(--emerald-ink)', fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--emerald)' }} />Available
          </div>
        )}
        {stays.map(b => {
          const mm = MB[b.member], conf = confirmDel === b.id;
          return (
            <div key={b.id} className="col" style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', background: 'var(--surface-2)', padding: 14, gap: 10 }}>
              <div className="row" style={{ gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: mm.color, color: '#fff', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{mm.ini}</span>
                <span className="col" style={{ flex: 1 }}><span style={{ fontWeight: 600 }}>Blocked by {mm.name}</span><span className="mono" style={{ fontSize: 13, color: 'var(--ink-3)' }}>{stayText(b)}</span></span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 14px', fontSize: 14 }}>
                <span style={{ color: 'var(--ink-3)' }}>Guest</span><span style={{ fontWeight: 500 }}>{b.guest}</span>
                <span style={{ color: 'var(--ink-3)' }}>People</span><span style={{ fontWeight: 500 }}>{b.count}</span>
                <span style={{ color: 'var(--ink-3)' }}>Mobile</span><a href={'tel:+91' + b.phone} className="mono" style={{ color: 'var(--ink)', textDecoration: 'none' }}>+91 {fmtPhone(b.phone)}</a>
              </div>
              {(b.member === me || isAdmin) && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openDone(b.id)} style={btn({ flex: 1, border: 0, background: 'var(--emerald)', color: '#fff' })}>Guest link</button>
                  <button onClick={() => {
                    if (!conf) return setConfirmDel(b.id);
                    setConfirmDel(null);
                    bookingStore.remove(b.id).then(() => toast(b.member === me ? 'Dates released — now available to everyone' : `Removed ${MB[b.member].name}'s booking — dates now available`), () => toast("Couldn't unblock. Check your internet and try again."));
                  }} style={btn({ flex: 1, border: '1px solid var(--ruby)', background: conf ? 'var(--ruby)' : 'var(--surface-2)', color: conf ? '#fff' : 'var(--ruby)' })}>{conf ? 'Tap to confirm' : b.member === me ? 'Unblock' : 'Remove'}</button>
                </div>
              )}
            </div>
          );
        })}
        {stays.length
          ? <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>Booked on a first come, first served basis.</div>
          : <button onClick={() => { if (d < T) return toast('This date has passed'); startBlock(d); }} style={primaryBtn()}>Block from {fmt(d)}</button>}
      </div>
    );
  }

  function formSheet(start: string, end: string) {
    return (
      <form className="col" style={{ gap: 14 }} onSubmit={e => { e.preventDefault(); confirm(); }}>
        <div className="col" style={{ gap: 2 }}>
          <span className="eyebrow">Block dates</span>
          <span className="serif" style={{ fontSize: 24 }}>{fmt(start)} → {fmt(end)}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{nSel + (nSel > 1 ? ' nights' : ' night')} · check-out {DOW[parse(end).getDay()]}</span>
        </div>
        <div className="col" style={{ gap: 6 }}>
          <label htmlFor="gname" style={label}>Guest name</label>
          <input id="gname" value={form.guest} onChange={e => setForm({ ...form, guest: e.target.value })} placeholder="e.g. Mehta family"
            style={{ height: 50, border: '1px solid ' + (touched && !guestOk ? 'var(--ruby)' : 'var(--border-strong)'), borderRadius: 'var(--r-md)', background: 'var(--surface-2)', padding: '0 14px', fontSize: 16, outline: 0, color: 'var(--ink)' }} />
        </div>
        <div className="col" style={{ gap: 6 }}>
          <label htmlFor="gphone" style={label}>Guest mobile number</label>
          <div className="field" style={{ height: 50, borderColor: touched && !phoneOk ? 'var(--ruby)' : undefined }}>
            <span className="mono" style={{ color: 'var(--ink-3)' }}>+91</span>
            <input id="gphone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" placeholder="10 digits" style={{ font: '500 16px var(--font-mono)' }} />
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span style={label}>Number of people</span>
          <div className="row" style={{ gap: 4, border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
            <button type="button" aria-label="Fewer people" onClick={() => setForm({ ...form, count: Math.max(1, form.count - 1) })} style={{ width: 46, height: 46, border: 0, background: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--ink)' }}>−</button>
            <span style={{ minWidth: 28, textAlign: 'center', font: '600 18px var(--font-mono)' }}>{form.count}</span>
            <button type="button" aria-label="More people" onClick={() => setForm({ ...form, count: Math.min(20, form.count + 1) })} style={{ width: 46, height: 46, border: 0, background: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--ink)' }}>+</button>
          </div>
        </div>
        {touched && !(guestOk && phoneOk) && <div style={{ fontSize: 13, color: 'var(--ruby)' }}>Add the guest's name and a 10-digit mobile number.</div>}
        <button type="submit" style={{ ...primaryBtn(54), opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Confirm & block'}</button>
        <button type="button" onClick={() => setSheet(null)} style={{ height: 40, border: 0, background: 'none', color: 'var(--ink-2)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Change dates</button>
      </form>
    );
  }

  function doneSheet(id: string, fresh: boolean) {
    const b = B.find(x => x.id === id);
    if (!b) return null;
    const link = guestLink(b);
    return (
      <div className="col" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--emerald)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flex: 'none' }}>✓</span>
          <span className="col">
            <span className="serif" style={{ fontSize: 22 }}>{fresh ? 'Dates blocked' : 'Guest link'}</span>
            <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{stayText(b)} · {people(b.count)}</span>
          </span>
        </div>
        <div className="col" style={{ gap: 8 }}>
          <span style={label}>Guest link — share with {b.guest}</span>
          <div className="row" style={{ gap: 8, border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', padding: '6px 6px 6px 12px' }}>
            <span style={{ flex: 1, font: '500 13px var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
            <button onClick={() => { copyText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); }} style={{ height: 38, padding: '0 14px', borderRadius: 'var(--r-sm)', border: 0, background: 'var(--ink)', color: 'var(--paper)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </div>
        <a href={guestWhatsApp(b)} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ height: 52, fontSize: 16 }}>Send on WhatsApp</a>
        <button onClick={() => {
          setSheet(null);
          if (onPreviewGuest) { onPreviewGuest(b); toast('Guest app now shows ' + b.guest + "'s stay →"); }
          else window.open(link, '_blank');
        }} style={btn({ height: 48, border: '1px solid var(--border-strong)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: 15 })}>Preview guest app →</button>
      </div>
    );
  }
}

