// Month calendar. Each booking keeps one horizontal lane across the days it covers, so a
// member's bar can be followed day to day; a third overlapping stay shows as "+1".

import { add, byStart, fmt, iso, MB, MEMBERS, MONL, overlap, people, today, type Booking } from '../data/model';

export type LabelMode = 'initials' | 'names';

interface Props {
  ym: [number, number];
  onMonth: (ym: [number, number]) => void;
  bookings: Booking[];
  selecting: boolean;
  selStart: string | null;
  selEnd: string | null;
  labels?: LabelMode;
  onDay: (d: string) => void;
}

const DOWS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const navBtn = { width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 18, cursor: 'pointer', color: 'var(--ink)' };

export default function Calendar({ ym, onMonth, bookings: B, selecting, selStart: sS, selEnd: sE, labels = 'initials', onDay }: Props) {
  const [y, m] = ym;
  const T = today();
  const first = new Date(y, m, 1), off = (first.getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate();
  const nW = Math.ceil((off + dim) / 7);

  // Assign each booking a lane (first lane free by its check-in).
  const laneOf: Record<string, number> = {};
  const laneEnds: string[] = [];
  B.slice().sort(byStart).forEach(b => {
    let r = laneEnds.findIndex(e => e <= b.start);
    if (r < 0) { r = laneEnds.length; laneEnds.push(b.end); } else laneEnds[r] = b.end;
    laneOf[b.id] = r;
  });

  const weeks = Array.from({ length: nW }, (_, w) => Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(y, m, 1 - off + w * 7 + i), d = iso(dt), inM = dt.getMonth() === m, past = d < T;
    const stays = B.filter(b => b.start <= d && d < b.end);
    const maxLane = stays.reduce((a, b) => Math.max(a, laneOf[b.id]), -1);
    const marks = [];
    for (let r = 0; r <= Math.min(maxLane, 1); r++) {
      const b = stays.find(x => laneOf[x.id] === r);
      if (!b) { marks.push(<span key={r} className="cal-mark" style={{ background: 'transparent' }} />); continue; }
      const s0 = d === b.start || i === 0, e0 = add(d, 1) === b.end, mm = MB[b.member];
      marks.push(
        <span key={r} className="cal-mark" style={{
          background: mm.color,
          borderRadius: `${s0 ? 4 : 0}px ${e0 ? 4 : 0}px ${e0 ? 4 : 0}px ${s0 ? 4 : 0}px`,
          marginLeft: d === b.start ? 4 : 0, marginRight: e0 ? 4 : 0,
        }}>{s0 ? (labels === 'names' ? mm.name.split(' ')[0] : mm.ini) : ''}</span>,
      );
    }
    const hidden = stays.filter(x => laneOf[x.id] > 1).length;
    const isEnd = selecting && (d === sS || d === sE);
    const inSel = selecting && sS && sE && d > sS && d < sE;
    return (
      <button key={d} className="cal-cell" onClick={() => onDay(d)} aria-label={fmt(d) + (stays.length ? ', blocked' : ', available')}
        style={{ background: inSel ? 'var(--emerald-soft)' : 'var(--surface)', opacity: inM ? 1 : 0.35 }}>
        <span className="cal-num" style={{
          fontWeight: d === T || isEnd ? 700 : 500,
          color: isEnd ? '#fff' : past ? 'var(--ink-4)' : 'var(--ink)',
          background: isEnd ? 'var(--emerald)' : 'transparent',
          boxShadow: d === T && !isEnd ? 'inset 0 0 0 1.5px var(--emerald)' : 'none',
        }}>{dt.getDate()}</span>
        {marks}
        <span style={{ fontSize: 9, color: 'var(--ink-3)', fontWeight: 600, lineHeight: '10px' }}>{hidden ? '+' + hidden : ''}</span>
      </button>
    );
  }));

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', padding: '0 6px' }}>
        <button aria-label="Previous month" style={navBtn} onClick={() => onMonth(m === 0 ? [y - 1, 11] : [y, m - 1])}>‹</button>
        <span className="serif" style={{ fontSize: 22 }}>{MONL[m]} {y}</span>
        <button aria-label="Next month" style={navBtn} onClick={() => onMonth(m === 11 ? [y + 1, 0] : [y, m + 1])}>›</button>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="cal-grid" style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--border)' }}>
          {DOWS.map(d => <span key={d} className="cal-dow">{d}</span>)}
        </div>
        {weeks.map((cells, w) => <div key={w} className="cal-grid" style={{ borderBottom: '1px solid var(--divider)' }}>{cells}</div>)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', padding: '0 6px' }}>
        {MEMBERS.map(mm => (
          <span key={mm.id} className="row" style={{ gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: mm.color }} />{mm.name}
          </span>
        ))}
      </div>
    </>
  );
}

/** "This month" list under the calendar. */
export function MonthStays({ ym, bookings, onOpen }: { ym: [number, number]; bookings: Booking[]; onOpen: (d: string) => void }) {
  const [y, m] = ym;
  const mS = iso(new Date(y, m, 1)), mE = iso(new Date(y, m + 1, 1));
  const list = bookings.filter(b => overlap(b, mS, mE)).sort(byStart);
  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="eyebrow" style={{ padding: '6px 6px 0' }}>This month</div>
      {list.map(b => (
        <button key={b.id} onClick={() => onOpen(b.start < mS ? mS : b.start)} className="row" style={{ gap: 12, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, background: MB[b.member].color }} />
          <span className="col" style={{ flex: 1, gap: 2, minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{b.guest}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{MB[b.member].name} · {people(b.count)}</span>
          </span>
          <span className="mono" style={{ fontSize: 13, color: 'var(--ink-2)', textAlign: 'right' }}>{fmt(b.start)}–{fmt(b.end)}</span>
        </button>
      ))}
      {!list.length && <div style={{ padding: 16, textAlign: 'center', fontSize: 14, color: 'var(--ink-3)', border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)' }}>Flat is free all month.</div>}
    </div>
  );
}
