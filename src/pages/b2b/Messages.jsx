import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Camera, Handshake, MessageCircle, MessagesSquare, Phone, Send, Video, X } from 'lucide-react';
import { Breadcrumb, EmptyState, Visual } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { locate, marketById, shopById } from '../../data/directory';
import { naira, timeAgo } from '../../lib/format';

/** The reference card attached to a message — the listing or community post it's about. */
export function DealRef({ value: r, onRemove }) {
  if (!r) return null;
  const card =
    r.kind === 'product' ? (
      <Link to={`/b2b/product/${r.id}`} className="modal-product chat-product-ref deal-ref">
        <Visual emoji={r.emoji} hue={r.hue} />
        <div>
          <span className="muted small">About this listing</span>
          <b>{r.name}</b>
          {r.price != null && <span className="small">From {naira(r.price)} / {r.unit}</span>}
        </div>
      </Link>
    ) : (
      <Link to={`/b2b/market/${r.marketId}/community#${r.id}`} className="modal-product chat-product-ref deal-ref">
        <span className="deal-ref-icon"><MessagesSquare size={20} /></span>
        <div>
          <span className="muted small">Re: community post · {marketById[r.marketId]?.short}</span>
          <span className="deal-ref-text">{r.text || (r.hasVideo ? 'Video post' : 'Photo post')}</span>
          {r.hasPhoto && <span className="muted small"><Camera size={12} /> Includes a photo</span>}
          {r.hasVideo && <span className="muted small"><Video size={12} /> Includes a video</span>}
        </div>
      </Link>
    );
  if (!onRemove) return card;
  return (
    <div className="deal-ref-draft">
      {card}
      <button type="button" className="icon-btn" onClick={onRemove} aria-label="Remove reference"><X size={14} /></button>
    </div>
  );
}

export function MessagesInbox() {
  const { myDealChats } = useStore();

  return (
    <div className="container narrow">
      <Breadcrumb items={[{ label: 'Wholesale', to: '/b2b' }, { label: 'Messages' }]} />
      <h1 className="page-title">Messages</h1>
      <p className="muted">Talk to other merchants directly and close deals between yourselves — agree price, payment and delivery in the chat.</p>

      {myDealChats.length === 0 ? (
        <EmptyState
          emoji="🤝"
          title="No conversations yet"
          text="Open any wholesale listing, shop or community post and tap Message to start talking to that merchant."
          action={<Link to="/b2b" className="btn btn-primary">Walk the markets</Link>}
        />
      ) : (
        <ul className="inbox">
          {myDealChats.map((c) => {
            const shop = shopById[c.shopId];
            if (!shop) return null;
            const last = c.messages[c.messages.length - 1];
            return (
              <li key={c.id}>
                <Link to={`/b2b/messages/${c.shopId}`} className={`inbox-row ${c.unread ? 'unread' : ''}`}>
                  <Visual emoji={shop.emoji} hue={shop.hue} />
                  <div className="grow">
                    <div className="row-between">
                      <b>{shop.name}</b>
                      <span className="muted small">{timeAgo(c.updatedAt)}</span>
                    </div>
                    <span className="inbox-last">{last.from === 'me' ? 'You: ' : ''}{last.text || (last.ref ? 'Shared a reference' : '')}</span>
                  </div>
                  {c.unread > 0 && <i className="count">{c.unread}</i>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function MessageThread() {
  const { shopId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myDealChats, sendDealMessage, markDealRead } = useStore();
  const shop = shopById[shopId];
  const chat = myDealChats.find((c) => c.shopId === shopId);
  const [draftRef, setDraftRef] = useState(state?.ref || null);
  const [input, setInput] = useState(state?.text || '');
  const endRef = useRef(null);
  const count = chat?.messages.length || 0;

  useEffect(() => {
    if (chat?.unread) markDealRead(shopId);
  }, [chat?.unread, shopId, markDealRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [count, chat?.pending]);

  if (!shop) return <div className="container"><EmptyState emoji="🧭" title="Merchant not found" action={<Link to="/b2b/messages" className="btn btn-primary">Back to messages</Link>} /></div>;
  if (shopId === user.business?.shopId) {
    return <div className="container"><EmptyState emoji="🙂" title="That’s your own shop" text="Pick another merchant to start a deal with." action={<Link to="/b2b/messages" className="btn btn-primary">Back to messages</Link>} /></div>;
  }

  const loc = locate(shopId);
  const digits = shop.phone.replace(/\D/g, '');

  const send = (e) => {
    e.preventDefault();
    if (!input.trim() && !draftRef) return;
    sendDealMessage(shopId, input, draftRef);
    setInput('');
    setDraftRef(null);
    // Drop the router state so a refresh doesn't re-attach the reference.
    if (state) navigate('.', { replace: true, state: null });
  };

  return (
    <div className="container narrow deal-thread-page">
      <Breadcrumb items={[{ label: 'Wholesale', to: '/b2b' }, { label: 'Messages', to: '/b2b/messages' }, { label: shop.name }]} />

      <div className="chat-contact">
        <Visual emoji={shop.emoji} hue={shop.hue} />
        <div className="grow">
          <Link to={`/b2b/shop/${shop.id}`}><b>{shop.name}</b></Link>
          <span className="muted small">{shop.owner} · {loc.short}</span>
        </div>
        <div className="row gap">
          <a className="btn btn-outline btn-sm" href={`tel:${digits}`} aria-label={`Call ${shop.name}`}><Phone size={14} /></a>
          <a className="btn btn-outline btn-sm" href={`https://wa.me/234${digits.replace(/^0+/, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={14} /></a>
        </div>
      </div>

      <div className="callout deal-note">
        <Handshake size={16} />
        <span>Merchant-to-merchant deals are agreed directly between you — settle price, payment and delivery here or by phone.</span>
      </div>

      <div className="chat-thread deal-thread">
        {!chat && <p className="muted small center">Say hello to {shop.name} — your first message starts the conversation.</p>}
        {chat?.messages.map((m) => (
          <div key={m.id} className={`bubble from-${m.from === 'me' ? 'buyer' : 'merchant'}`}>
            {m.ref && <DealRef value={m.ref} />}
            {m.text && <p>{m.text}</p>}
            <span className="bubble-time">{timeAgo(m.at)}</span>
          </div>
        ))}
        {chat?.pending && (
          <div className="bubble from-merchant waiting">
            <span className="typing"><i /><i /><i /></span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="deal-composer" onSubmit={send}>
        {draftRef && <DealRef value={draftRef} onRemove={() => setDraftRef(null)} />}
        <div className="chat-input">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message ${shop.name}…`} aria-label="Message" autoFocus={!!draftRef} />
          <button className="btn btn-primary btn-icon" type="submit" aria-label="Send" disabled={!input.trim() && !draftRef}><Send size={16} /></button>
        </div>
      </form>
    </div>
  );
}
