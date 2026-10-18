// Guest side: no sign-in. The guest link opens straight onto the stay.

import { useState } from 'react';
import StayInfo, { type Section } from '../components/StayInfo';
import { AppHeader } from '../components/Phone';
import { fmt, MB, nightsOf, overlap, type Booking } from '../data/model';
import type { GuestStay } from '../data/links';

const TABS: [Section, string][] = [['stay', 'Stay'], ['temple', 'Darshan'], ['explore', 'Explore'], ['ebike', 'Transport'], ['checkout', 'Check-out'], ['sos', 'Help']];
const TITLES: Partial<Record<Section, string>> = { temple: 'Darshan timings', explore: 'Things to do', ebike: 'Transport within GEV', checkout: 'Check-out instructions', sos: 'Emergency' };

const softLabel = { fontSize: 11, color: 'var(--emerald-soft)', textTransform: 'uppercase' as const, letterSpacing: '.06em' };

interface Props {
  stay: GuestStay | null;
  /** Other bookings, used to tell the guest who else is staying at the same time. */
  all: Booking[];
  tab?: Section;
  onTab?: (t: Section) => void;
}

export default function GuestApp({ stay, all, tab: ctrlTab, onTab }: Props) {
  const [ownTab, setOwnTab] = useState<Section>('stay');
  const tab = ctrlTab ?? ownTab;
  const setTab = onTab ?? setOwnTab;
  const sharing = stay ? all.filter(b => b.id !== stay.id && overlap(b, stay.start, stay.end)) : [];

  return (
    <>
      <AppHeader title="Shri Ji Kunj" sub="Goverdhan Eco Village" size={20} />
      <div className="scroll">
        <div className="col" style={{ padding: '16px 16px 32px', gap: 14 }}>
          {tab === 'stay' && stay && (
            <>
              <div style={{ background: 'var(--emerald)', color: '#fff', borderRadius: 'var(--r-xl)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 14, color: 'var(--emerald-soft)' }}>Hare Krishna, {stay.guest}</div>
                <div className="serif" style={{ fontSize: 30, lineHeight: 1.1 }}>{fmt(stay.start)} → {fmt(stay.end)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, borderTop: '1px solid rgba(255,255,255,.25)', paddingTop: 12 }}>
                  <span className="col"><span style={softLabel}>Nights</span><span style={{ font: '600 18px var(--font-mono)' }}>{nightsOf(stay.start, stay.end)}</span></span>
                  <span className="col"><span style={softLabel}>People</span><span style={{ font: '600 18px var(--font-mono)' }}>{stay.count}</span></span>
                  <span className="col"><span style={softLabel}>Host</span><span style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.5 }}>{MB[stay.member]?.name}</span></span>
                </div>
              </div>
              {sharing.map(b => (
                <div key={b.id} style={{ background: 'var(--sapphire-soft)', color: 'var(--sapphire)', borderRadius: 'var(--r-md)', padding: '12px 14px', fontSize: 14, lineHeight: 1.45 }}>
                  {b.guest} ({MB[b.member].name}'s guests) will also be staying, {fmt(b.start > stay.start ? b.start : stay.start)} – {fmt(b.end < stay.end ? b.end : stay.end)}.
                </div>
              ))}
            </>
          )}
          {tab === 'stay' && !stay && (
            <div style={{ padding: 16, textAlign: 'center', fontSize: 14, color: 'var(--ink-3)', border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)' }}>
              This stay link isn't valid any more. Please ask your host for a new one.
            </div>
          )}
          {tab !== 'stay' && <div className="serif" style={{ fontSize: 26, padding: '0 4px' }}>{TITLES[tab]}</div>}
          <StayInfo section={tab} />
        </div>
      </div>
      <nav style={{ flex: 'none', height: 76, borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', padding: '0 4px 14px', boxSizing: 'border-box' }}>
        {TABS.map(([k, l]) => (
          <button key={k} className="tabbtn" onClick={() => setTab(k)} style={{ gap: 5, fontSize: 11, color: tab === k ? 'var(--emerald)' : 'var(--ink-3)' }}>
            <span style={{ width: 22, height: 3, borderRadius: 2, background: tab === k ? 'var(--emerald)' : 'transparent' }} />{l}
          </button>
        ))}
      </nav>
    </>
  );
}
