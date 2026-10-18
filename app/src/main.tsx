import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/app.css';
import FamilyApp from './family/FamilyApp';
import GuestApp from './guest/GuestApp';
import Preview from './Preview';
import { Phone } from './components/Phone';
import { useBookings } from './data/store';
import { decodeStay } from './data/links';

// Hash routes, so the app works on any static host without server config:
//   #/              family app
//   #/stay/<id>?d=  guest app (the link family members share)
//   #/preview       both phones side by side, as in the design canvas
function useHash() {
  const [h, setH] = useState(location.hash);
  useEffect(() => {
    const on = () => setH(location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return h.replace(/^#/, '') || '/';
}

function GuestRoute({ id, d }: { id: string; d: string | null }) {
  const B = useBookings();
  const local = B.find(b => b.id === id);
  const stay = local ?? decodeStay(id, d);
  useEffect(() => { document.title = 'Shri Ji Kunj · Your stay'; }, []);
  return <div className="shell"><Phone><GuestApp stay={stay} all={B} /></Phone></div>;
}

function App() {
  const route = useHash();
  const [path, query] = route.split('?');
  const stay = path.match(/^\/stay\/([\w-]+)/);
  if (stay) return <GuestRoute id={stay[1]} d={new URLSearchParams(query).get('d')} />;
  if (path === '/preview') return <Preview />;
  return <div className="shell"><Phone><FamilyApp /></Phone></div>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
