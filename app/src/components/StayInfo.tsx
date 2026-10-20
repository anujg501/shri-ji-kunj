// The information pages guests and family both see. Wording is the family's own
// (kept verbatim from the design chat), so edit text here rather than paraphrasing.

import { useRef, useState } from 'react';
import { copyText } from '../data/links';

export type Section = 'stay' | 'temple' | 'explore' | 'ebike' | 'checkout' | 'sos';

const ADDRESS = ['Ashok Gupta', 'F 11 -103', '1 ST FLOOR,', 'GOVERDHAN KUNJ', 'GOVERDHAN ECO VILLAGE', 'WADA', 'PALGHAR 421303'];
const DOOR_CODE = '654321#';
const WIFI_NAME = 'arunguptaf11';
const WIFI_PASS = 'arungupta01';

const DARSHAN: [string, string, boolean?][] = [
  ['Mangala Arati', '4:30 AM'], ['Tulasi Puja', '5:00 AM'], ['Shringar Darshan', '7:15 AM'], ['Guru Puja', '7:30 AM'],
  ['Bhagavatam class', '8:00 AM'], ['Raj Bhog Arati', '12:30 PM'], ['Temple closed', '1:00–4:00 PM', true],
  ['Dhoop Arati', '4:15 PM'], ['Sandhya Gaura Arati', '7:00 PM'], ['Shayan Arati', '8:30 PM'],
];

const THINGS: [string, string][] = [
  ['Temple darshan & kirtan', 'Morning programme and evening arati at the main mandir.'],
  ['Govardhan Hill parikrama', 'Walk the parikrama path around the hill replica.'],
  ['Goshala', 'Visit and serve the cows.'],
  ['Organic farm walk', 'See the eco farming and water conservation work.'],
  ['Kunds & ghats', 'Quiet evenings by the water.'],
];

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const t = useRef<number>(undefined);
  return {
    label: (k: string, idle = 'Copy') => (copied === k ? 'Copied' : idle),
    copy: (k: string, text: string) => {
      copyText(text);
      setCopied(k);
      clearTimeout(t.current);
      t.current = window.setTimeout(() => setCopied(null), 1800);
    },
  };
}

const Steps = ({ items }: { items: string[] }) => (
  <div className="steps">
    {items.map((s, i) => [<span key={'n' + i} className="n">{i + 1}</span>, <span key={'t' + i}>{s}</span>])}
  </div>
);

const NumTitle = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
    <span style={{ font: '600 14px var(--font-mono)', color: 'var(--emerald)' }}>{n}</span>
    <span className="serif" style={{ fontSize: 20 }}>{children}</span>
  </div>
);

const cardPad = { padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 12 };

function StaySection() {
  const c = useCopy();
  const codeRow = (k: string, label: string, value: string, big: boolean, last = false) => (
    <div className="row" style={{ gap: 12, padding: '12px 0', borderBottom: last ? 0 : '1px solid var(--divider)' }}>
      <div className="col" style={{ flex: 1, gap: 2 }}>
        <span className="eyebrow">{label}</span>
        <span style={{ font: big ? '600 22px var(--font-mono)' : '500 16px var(--font-mono)', letterSpacing: big ? '.08em' : undefined }}>{value}</span>
      </div>
      <button className="btn-copy" onClick={() => c.copy(k, value)}>{c.label(k)}</button>
    </div>
  );
  return (
    <>
      <div className="card" style={cardPad}>
        <div className="eyebrow">Address</div>
        <div style={{ fontSize: 15, lineHeight: 1.55 }}>
          <div className="serif" style={{ fontSize: 19, marginBottom: 4 }}>Shri Ji Kunj</div>
          {ADDRESS.map(l => <div key={l}>{l}</div>)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => c.copy('addr', ADDRESS.join('\n'))}>{c.label('addr', 'Copy address')}</button>
          <a className="btn btn-primary" style={{ flex: 1 }} target="_blank" rel="noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=Govardhan+Eco+Village+Wada+Palghar">Get directions</a>
        </div>
      </div>

      <div style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)', borderRadius: 'var(--r-lg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="eyebrow" style={{ color: 'var(--amber)' }}>Wrist band compulsory</div>
        <div style={{ fontSize: 15, lineHeight: 1.5 }}>Beyond Main temple entry, Wrist Band is compulsory for each person which is avaialble free of cost @ Reception.</div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>For house access its not required.</div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>At reception, please tell them we are guest of</div>
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '10px 12px', fontSize: 15, lineHeight: 1.45 }}>
          <div style={{ fontWeight: 600 }}>Mr ashok Gupta</div>
          <div className="mono" style={{ fontSize: 14 }}>F11-103, goverdhan kunj</div>
        </div>
      </div>

      <div className="card" style={{ padding: '6px 16px' }}>
        {codeRow('lock', 'Main door lock', DOOR_CODE, true)}
        {codeRow('net', 'Wi-Fi network', WIFI_NAME, false)}
        {codeRow('pass', 'Wi-Fi password', WIFI_PASS, false, true)}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="eyebrow">Housekeeping</span>
          <span style={{ font: '600 16px var(--font-mono)', color: 'var(--emerald)' }}>11:00 AM daily</span>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.5 }}>
          The cleaning staff will come everyday in the morning at 11.00 AM. if you wish to change the timing , please contact Anuj Prabhu{' '}
          <a href="tel:+917710065480" className="mono" style={{ whiteSpace: 'nowrap' }}>+91 7710065480</a>.
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>The cleaning Staff have their own access codes of the main door</div>
      </div>

      <div style={{ background: 'var(--sapphire-soft)', border: '1px solid var(--sapphire)', borderRadius: 'var(--r-lg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="eyebrow" style={{ color: 'var(--sapphire)' }}>Notice to guests · Valuables</div>
        <div style={{ fontSize: 15, lineHeight: 1.5 }}>
          We have CCTV only in the hall, so please request you to not leave valuables unattended in your absence.
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>
          If you in emergency cases you can keep it in the cupboard and carry the keys out with you
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--paper-2)' }}>
        <iframe title="Map" src="https://maps.google.com/maps?q=Govardhan%20Eco%20Village%2C%20Wada%2C%20Palghar&z=14&output=embed" style={{ display: 'block', width: '100%', height: 210, border: 0 }} loading="lazy" />
        <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink-3)' }}>Goverdhan Eco Village · Galtare, Wada, Palghar</div>
      </div>
    </>
  );
}

function TempleSection() {
  return (
    <>
      <div className="card" style={{ padding: '6px 16px 10px' }}>
        {DARSHAN.map(([name, time, muted], i) => (
          <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < DARSHAN.length - 1 ? '1px solid var(--divider)' : 0, color: muted ? 'var(--ink-3)' : undefined }}>
            <span>{name}</span><span className="mono" style={{ fontSize: 14 }}>{time}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, padding: '0 4px' }}>Sri Sri Radha Vrindavanbihari Mandir. Timings change on festival days — please check at the temple desk.</div>
    </>
  );
}

function ExploreSection() {
  const mapUrl = new URL('gev-village-map.jpg', document.baseURI).href;
  return (
    <>
      <a href={mapUrl} target="_blank" rel="noreferrer" className="card" style={{ display: 'block', overflow: 'hidden', textDecoration: 'none', color: 'var(--ink)' }}>
        <img src={mapUrl} alt="Vrindavana forest map of Govardhan Eco Village" style={{ display: 'block', width: '100%', height: 'auto' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Village map · important places</span>
          <span style={{ fontSize: 13, color: 'var(--emerald)', fontWeight: 600 }}>Open full size ↗</span>
        </div>
      </a>
      <div className="col" style={{ gap: 10 }}>
        {THINGS.map(([t, d]) => (
          <div key={t} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 600 }}>{t}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 2 }}>{d}</div>
          </div>
        ))}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 600 }}>Prasadam</div>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 2 }}>Take prasadam at the village restaurant.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 8, fontSize: 14, lineHeight: 1.4, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--divider)' }}>
            {[['Shrinath Ji Cafe', '( Fast food)'], ['Govindas Restaurant', '( Asian, Indian, mix Cuisines)'], ['Ayurveda Center', '( Gluten Free, Vegan options)']].map(([n, d], i) => [
              <span key={'n' + i} className="mono" style={{ color: 'var(--emerald)' }}>{i + 1}</span>,
              <span key={'t' + i}><span style={{ fontWeight: 600 }}>{n}</span> <span style={{ color: 'var(--ink-3)' }}>{d}</span></span>,
            ])}
          </div>
        </div>
      </div>
    </>
  );
}

function TransportSection() {
  const call = (num: string, label: string) => (
    <a href={'tel:+91' + num} className="btn btn-primary" style={{ flex: 1, height: 46, font: '600 14px var(--font-mono)' }}>{label}</a>
  );
  return (
    <>
      <div className="card" style={cardPad}>
        <NumTitle n={1}>Golf cart</NumTitle>
        <div style={{ display: 'flex', gap: 8 }}>{call('9226516915', '92265 16915')}{call('9022762189', '90227 62189')}</div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>Golf Cart will pick up From Shrinath JI cafe ( opp Main Temple)</div>
      </div>
      <div className="card" style={cardPad}>
        <NumTitle n={2}>Cycles</NumTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: 15 }}>
          <span style={{ fontWeight: 600 }}>Rockrider</span><span style={{ color: 'var(--ink-2)' }}>( Adult Geared Cycle )</span>
          <span style={{ fontWeight: 600 }}>Riverside</span><span style={{ color: 'var(--ink-2)' }}>( Children Cycle )</span>
        </div>
      </div>
      <div style={{ padding: '8px 4px 0' }}><NumTitle n={3}>E bike ( Satyaki ) for Adults</NumTitle></div>
      <div className="card" style={cardPad}>
        <div className="eyebrow">Riding</div>
        <Steps items={[
          'Take the key from the key holder in the flat.',
          'Turn the key to ON and check the battery indicator.',
          'Ride slowly on village paths. Give way to walkers and cows.',
          'You can Take the Ebike in the lift and park outside the Flat',
          'the Ebike can be charged at the plug point next to the shoe stand ( Switch is located in the kitchen )',
        ]} />
      </div>
      <div className="card" style={cardPad}>
        <div className="eyebrow">Charging</div>
        <Steps items={[
          'Connect the charger to the bike first, then to the wall socket.',
          'Charge when the battery shows one bar or less.',
          'Unplug when the charger light turns green.',
        ]} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--amber)', background: 'var(--amber-soft)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>Draft steps — family to confirm key location and charger details.</div>
    </>
  );
}

function CheckoutSection() {
  const R = ({ children }: { children: React.ReactNode }) => <strong style={{ color: 'var(--ruby)' }}>{children}</strong>;
  return (
    <div className="card" style={cardPad}>
      <div className="eyebrow">Check-out instructions</div>
      <div className="steps">
        <span className="n">1</span><span>used towels please leave on the floor, housekeeping will wash them</span>
        <span className="n">2</span><span>please leave e-bike in balcony</span>
        <span className="n">3</span><span>Please Keep both cycles ( Rockrider &amp; Riverside ) inside the Balcony Area.</span>
        <span className="n" style={{ color: 'var(--ruby)', fontWeight: 600 }}>4</span>
        <span style={{ background: 'var(--ruby-soft)', borderRadius: 'var(--r-sm)', padding: '6px 8px', margin: '-6px 0' }}>
          Please <R>DONOT</R> switch <R>OFF</R> main power otherwise CCTV will <R>STOP</R>, we dont want that , right ?
        </span>
        <span className="n">5</span><span>Please check all taps are off and the light &amp; Ac switches are off</span>
      </div>
    </div>
  );
}

function SosSection() {
  const pair = (num: string, color: string, solid: string, h: number) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <a href={'tel:+91' + num} className="btn" style={{ flex: 1, height: h, fontSize: 15, background: solid, color: '#fff' }}>Call</a>
      <a href={'https://wa.me/91' + num} target="_blank" rel="noreferrer" className="btn" style={{ flex: 1, height: h, fontSize: 15, background: 'var(--surface-2)', border: '1px solid ' + color, color }}>WhatsApp</a>
    </div>
  );
  return (
    <>
      <div style={{ background: 'var(--ruby-soft)', border: '1px solid var(--ruby)', borderRadius: 'var(--r-lg)', ...cardPad }}>
        <div className="eyebrow" style={{ color: 'var(--ruby)' }}>Emergency contact</div>
        <div>
          <div className="serif" style={{ fontSize: 22 }}>Anuj prabhu</div>
          <div className="mono" style={{ fontSize: 16, marginTop: 2 }}>77100 65480</div>
        </div>
        {pair('7710065480', 'var(--ruby)', 'var(--ruby)', 48)}
      </div>
      <div className="card" style={{ padding: '4px 16px' }}>
        {[['National emergency', '112'], ['Ambulance', '108']].map(([l, n]) => (
          <a key={n} href={'tel:' + n} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--divider)', color: 'var(--ink)', textDecoration: 'none' }}>
            <span>{l}</span><span className="mono">{n}</span>
          </a>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', color: 'var(--ink-3)' }}><span>GEV reception</span><span>number to add</span></div>
      </div>
      <div className="card" style={cardPad}>
        <div className="eyebrow">Emergency medicines</div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>incase Emergency medicines required which are not at gev:<br />please contact medical store :</div>
        <div>
          <div className="serif" style={{ fontSize: 20 }}>Abdullah Medical</div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>Ten Naka</div>
          <div className="mono" style={{ fontSize: 16, marginTop: 4 }}>+91 82080 83327</div>
        </div>
        {pair('8208083327', 'var(--emerald)', 'var(--emerald)', 46)}
        <div style={{ fontSize: 14, lineHeight: 1.45, background: 'var(--amber-soft)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
          Request him to deliver by Auto , it will still take 30 minutes<br />This is the fastest as of now.
        </div>
      </div>
    </>
  );
}

const SECTIONS: Record<Section, () => React.ReactElement> = {
  stay: StaySection, temple: TempleSection, explore: ExploreSection, ebike: TransportSection, checkout: CheckoutSection, sos: SosSection,
};

export default function StayInfo({ section }: { section: Section }) {
  const S = SECTIONS[section];
  return <div className="col" style={{ gap: 14 }}><S /></div>;
}
