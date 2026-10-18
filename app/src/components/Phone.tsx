import { useRef, useState } from 'react';

/** Device frame on wide screens, full-screen on phones (see .frame/.screen in app.css). */
export function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="frame">
      <div className="screen">
        <div className="statusbar"><span>9:41</span><i /></div>
        {children}
      </div>
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<number>(undefined);
  const show = (m: string) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = window.setTimeout(() => setMsg(null), 2600);
  };
  const node = msg ? <div className="toast" role="status">{msg}</div> : null;
  return [show, node] as const;
}

export const Logo = ({ w = 68, h = 36 }: { w?: number; h?: number }) => (
  <img src="gev-logo.png" alt="Goverdhan Ecovillage" style={{ width: w, height: h, objectFit: 'contain', mixBlendMode: 'multiply', flex: 'none' }} />
);

export function AppHeader({ title, sub, size = 22, right }: { title: string; sub: string; size?: number; right?: React.ReactNode }) {
  return (
    <div className="row" style={{ flex: 'none', gap: 12, padding: '6px 20px 12px', borderBottom: '1px solid var(--divider)' }}>
      <Logo />
      <div className="col" style={{ flex: 1 }}>
        <span className="serif" style={{ fontSize: size, lineHeight: 1.1 }}>{title}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{sub}</span>
      </div>
      {right}
    </div>
  );
}
