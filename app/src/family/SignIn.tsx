// Family sign-in: mobile number → OTP → (first time only) pick who you are.
// OTP is simulated until an SMS provider is connected (see README).

import { useState } from 'react';
import { Logo } from '../components/Phone';
import { KNOWN_PHONES, MEMBERS, type MemberId } from '../data/model';

const primary = { height: 54, border: 0, borderRadius: 'var(--r-md)', background: 'var(--emerald)', color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer' };

export default function SignIn({ onDone, toast }: { onDone: (phone: string, member: MemberId) => void; toast: (m: string) => void }) {
  const [step, setStep] = useState<'phone' | 'otp' | 'who'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  if (step === 'phone') return (
    <div className="col" style={{ flex: 1, padding: '28px 28px 40px', gap: 24, minHeight: 0 }}>
      <div className="col" style={{ alignItems: 'center', gap: 10, marginTop: 4 }}>
        <Logo w={240} h={120} />
        <div className="serif" style={{ fontSize: 30 }}>Shri Ji Kunj</div>
        <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>Family calendar · Goverdhan Eco Village</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        <img src="deity-darshan.png" alt="Sri Krishna darshan, ISKCON GEV" style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', transform: 'scale(1.04)' }} />
      </div>
      <form className="col" style={{ gap: 24 }} onSubmit={e => { e.preventDefault(); phone.length === 10 ? (setOtp(''), setStep('otp')) : toast('Enter a 10-digit mobile number'); }}>
        <div className="col" style={{ gap: 8 }}>
          <label htmlFor="ph" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>Mobile number</label>
          <div className="field" style={{ height: 54 }}>
            <span className="mono" style={{ color: 'var(--ink-3)' }}>+91</span>
            <input id="ph" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" style={{ font: '500 18px var(--font-mono)', letterSpacing: '.04em' }} />
          </div>
        </div>
        <button type="submit" style={{ ...primary, opacity: phone.length === 10 ? 1 : 0.45 }}>Send OTP</button>
      </form>
    </div>
  );

  if (step === 'otp') return (
    <form className="col" style={{ flex: 1, padding: '20px 28px 40px', gap: 20 }} onSubmit={e => {
      e.preventDefault();
      if (otp.length !== 4) return;
      const known = KNOWN_PHONES[phone];
      known ? onDone(phone, known) : setStep('who');
    }}>
      <button type="button" onClick={() => setStep('phone')} style={{ alignSelf: 'flex-start', border: 0, background: 'none', color: 'var(--emerald)', fontWeight: 600, fontSize: 15, padding: '8px 0', cursor: 'pointer' }}>← Change number</button>
      <div className="serif" style={{ fontSize: 28, lineHeight: 1.15 }}>Enter the code</div>
      <div style={{ fontSize: 15, color: 'var(--ink-2)' }}>Sent by SMS to <span className="mono">+91 {phone}</span></div>
      <input className="otp" autoFocus value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" autoComplete="one-time-code" placeholder="• • • •" style={{ height: 64, border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', textAlign: 'center', font: '500 30px var(--font-mono)', letterSpacing: '.5em', color: 'var(--ink)', outline: 0 }} />
      <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Prototype: any 4 digits work.</div>
      <div style={{ flex: 1 }} />
      <button type="submit" style={{ ...primary, opacity: otp.length === 4 ? 1 : 0.45 }}>Verify</button>
    </form>
  );

  return (
    <div className="col" style={{ flex: 1, padding: '20px 24px 32px', gap: 16, overflow: 'auto' }}>
      <div className="serif" style={{ fontSize: 28, lineHeight: 1.15, padding: '0 4px' }}>Hare Krishna. Who is this?</div>
      <div style={{ fontSize: 14, color: 'var(--ink-3)', padding: '0 4px' }}>Asked once. Your number is linked to your name after this.</div>
      <div className="col" style={{ gap: 8 }}>
        {MEMBERS.map(m => (
          <button key={m.id} onClick={() => { onDone(phone, m.id); toast('Hare Krishna, ' + m.name); }} className="row" style={{ gap: 14, padding: '12px 14px', minHeight: 64, border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flex: 'none' }}>{m.ini}</span>
            <span className="col"><span style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>{m.name}</span><span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{m.full}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}
