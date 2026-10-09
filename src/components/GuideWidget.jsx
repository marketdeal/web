import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, MapPin, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { askGuide, suggestions } from '../lib/guide';

export default function GuideWidget() {
  const { isVendor } = useAuth();
  const { b2cCatalog, b2bCatalog } = useStore();
  const { pathname } = useLocation();
  const mode = isVendor && (pathname.startsWith('/b2b') || pathname.startsWith('/vendor')) ? 'b2b' : 'b2c';

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);

  const send = (text) => {
    const q = text.trim();
    if (!q || typing) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'assistant', ...askGuide(q, { isVendor, mode, b2cCatalog, b2bCatalog }) }]);
      setTyping(false);
    }, 750);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing, open]);

  // Lets any page (hero button, banners) open the guide without prop-drilling.
  useEffect(() => {
    const openIt = () => setOpen(true);
    window.addEventListener('marketdeal:open-guide', openIt);
    return () => window.removeEventListener('marketdeal:open-guide', openIt);
  }, []);

  const chips = suggestions[mode];

  return (
    <>
      {!open && (
        <button className="guide-fab" onClick={() => setOpen(true)} aria-label="Open AI Market Guide">
          <Sparkles size={20} />
          <span>Ask Market Guide</span>
        </button>
      )}

      {open && (
        <section className="guide-panel" aria-label="AI Market Guide">
          <header className="guide-head">
            <div className="guide-avatar"><Sparkles size={18} /></div>
            <div>
              <strong>AI Market Guide</strong>
              <small>Tell me what you need — I’ll walk you to the shop</small>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close guide"><X size={18} /></button>
          </header>

          <div className="guide-body">
            {messages.length === 0 && (
              <div className="guide-msg bot">
                <p>
                  Hi! I know every market, street, plaza and shop on MarketDeal
                  {mode === 'b2b' ? ', including wholesale pricing.' : '.'} Try one of these:
                </p>
                <div className="guide-chips">
                  {chips.map((c) => (
                    <button key={c} className="chip-btn" onClick={() => send(c)}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`guide-msg ${m.role === 'user' ? 'me' : 'bot'}`}>
                <p>{m.text}</p>
                {m.cards && (
                  <div className="guide-cards">
                    {m.cards.map((c) => (
                      <div key={c.id} className="guide-card">
                        <Link to={c.to} className="guide-card-title" onClick={() => setOpen(false)}>
                          {c.name} <ArrowUpRight size={14} />
                        </Link>
                        <div className="guide-card-price">
                          {c.price} {c.lowest && <span className="pill pill-green">Lowest</span>}
                        </div>
                        <div className="guide-card-trail"><MapPin size={12} /> {c.trail}</div>
                        {c.shopTo && (
                          <Link to={c.shopTo} className="guide-card-link" onClick={() => setOpen(false)}>
                            Go to {c.shopName}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {m.chips && (
                  <div className="guide-chips">
                    {m.chips.map((c) => (
                      <button key={c} className="chip-btn" onClick={() => send(c)}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="guide-msg bot">
                <div className="typing"><i /><i /><i /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="guide-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. Samsung phones in Computer Village" aria-label="Ask the Market Guide" />
            <button className="btn btn-primary btn-icon" type="submit" aria-label="Send"><Send size={16} /></button>
          </form>
        </section>
      )}
    </>
  );
}
