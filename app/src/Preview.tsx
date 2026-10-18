// Both phones side by side, sharing one calendar — the layout of the design canvas.

import { useState } from 'react';
import FamilyApp from './family/FamilyApp';
import GuestApp from './guest/GuestApp';
import { Phone } from './components/Phone';
import type { Section } from './components/StayInfo';
import { useBookings } from './data/store';
import { byStart, fmt, today } from './data/model';

export default function Preview() {
  const B = useBookings();
  const [gId, setGId] = useState<string | null>(null);
  const [gTab, setGTab] = useState<Section>('stay');
  const T = today();
  const gb = B.find(b => b.id === gId) || B.filter(b => b.end >= T).sort(byStart)[0] || B[0] || null;

  return (
    <div className="preview">
      <div className="col" style={{ gap: 6, maxWidth: 860 }}>
        <div className="serif" style={{ fontSize: 32 }}>Shri Ji Kunj — family &amp; guest app</div>
        <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5, textWrap: 'pretty' }}>
          Both phones share one live calendar. Sign in on the family side (any 10-digit number, any 4-digit OTP), block dates, then open the guest view from the confirmation screen.
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'flex-start' }}>
        <div className="col" style={{ gap: 12 }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 10 }}><span className="badge">A</span><span style={{ fontWeight: 600 }}>Family side</span></div>
          <Phone><FamilyApp onPreviewGuest={b => { setGId(b.id); setGTab('stay'); }} /></Phone>
          <div style={{ maxWidth: 390, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>Tap a day to see who blocked it. "Block dates" → tap check-in, then check-out. Tap your avatar to sign out.</div>
        </div>
        <div className="col" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <span className="badge">B</span><span style={{ fontWeight: 600 }}>Guest side</span><span style={{ fontSize: 13, color: 'var(--ink-3)' }}>opened from link</span>
            <select value={gb?.id ?? ''} onChange={e => { setGId(e.target.value); setGTab('stay'); }} style={{ height: 32, border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', fontSize: 13, color: 'var(--ink)', padding: '0 8px' }}>
              {B.slice().sort(byStart).map(b => <option key={b.id} value={b.id}>{b.guest} · {fmt(b.start)}</option>)}
            </select>
          </div>
          <Phone><GuestApp stay={gb} all={B} tab={gTab} onTab={setGTab} /></Phone>
          <div style={{ maxWidth: 390, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>No sign-in for guests — the link opens their stay. Darshan timings and e-bike steps are drafts for you to correct.</div>
        </div>
      </div>
    </div>
  );
}
