import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, MessageCircle, Phone, PhoneCall, Send, Unlock } from 'lucide-react';
import { Modal, Visual } from './ui';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { locate } from '../data/directory';
import { naira } from '../lib/format';

// A believable, canned "merchant" side of the conversation — there is no backend to answer for real.
const AUTO_REPLIES = [
  "Thanks for reaching out! We're online now — how can we help?",
  'Yes, that item is in stock. Let us know the quantity you need and we’ll confirm pricing.',
  'You can place an order any time and we’ll get it ready the same day.',
  'Good day! One of our staff will attend to you shortly.',
  'Happy to help — feel free to ask about sizes, warranty or delivery timing.',
];

/** `product` (optional) is whichever product the chat was opened from — B2C-shaped (has `price`)
 *  or B2B-shaped (has `tiers`) — and is shown as a reference card so both sides know what the
 *  conversation is about, same as opening a chat from a specific listing on a real marketplace. */
export default function ChatModal({ shop, product, onClose }) {
  const { user } = useAuth();
  const { hasOrderWith } = useStore();
  const toast = useToast();
  const loc = locate(shop.id);
  const unlocked = hasOrderWith(shop.id);
  const wholesale = !!product?.tiers;
  const productHref = product ? (wholesale ? `/b2b/product/${product.id}` : `/product/${product.id}`) : null;
  const productPrice = product ? (wholesale ? `${naira(product.tiers[0].price)} / ${product.unit} · MOQ ${product.moq.toLocaleString('en-NG')}` : naira(product.price)) : null;

  const [messages, setMessages] = useState(() => [
    {
      from: 'shop',
      text: product
        ? `Hi ${user.name.split(' ')[0]}! Thanks for asking about “${product.name}”. Happy to help with stock, pricing or delivery.`
        : `Hi ${user.name.split(' ')[0]}! Thanks for visiting ${shop.name}. Ask about stock, pricing or delivery — we usually reply within minutes.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  const send = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || typing) return;
    setMessages((m) => [...m, { from: 'buyer', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { from: 'shop', text: AUTO_REPLIES[m.length % AUTO_REPLIES.length] }]);
      setTyping(false);
    }, 1100);
  };

  const requestCall = () => toast(`Call request sent to ${shop.name} — they'll call you back shortly (demo).`, { kind: 'info' });

  const digits = shop.phone.replace(/\D/g, '');
  const waHref = `https://wa.me/234${digits.replace(/^0+/, '')}`;

  return (
    <Modal title={`Chat with ${shop.name}`} onClose={onClose}>
      <div className="chat-contact">
        <Visual emoji={shop.emoji} hue={shop.hue} />
        <div className="grow">
          <b>{shop.name}</b>
          <span className="muted small">{loc.short}</span>
        </div>
        {unlocked ? (
          <div className="contact-state contact-unlocked">
            <span className="pill pill-green"><Unlock size={12} /> Contact unlocked</span>
            <a className="btn btn-outline btn-sm" href={`tel:${digits}`}><Phone size={14} /> {shop.phone}</a>
          </div>
        ) : (
          <div className="contact-state contact-locked">
            <span className="pill pill-gray"><Lock size={12} /> Number locked</span>
            <span className="muted small">•••• •••• {digits.slice(-4)}</span>
          </div>
        )}
      </div>

      {product && (
        <Link to={productHref} className="modal-product chat-product-ref" onClick={onClose}>
          <Visual emoji={product.emoji} hue={product.hue} />
          <div>
            <span className="muted small">Chatting about</span>
            <b>{product.name}</b>
            <span className="small">{productPrice}</span>
          </div>
        </Link>
      )}

      {!unlocked && (
        <div className="callout chat-lock-note">
          <Lock size={14} />
          <span>The phone number unlocks automatically once you place an order with {shop.name}. Chat freely in the meantime.</span>
          <button className="btn btn-ghost btn-sm" onClick={requestCall}><PhoneCall size={14} /> Request a call-back</button>
        </div>
      )}

      <div className="chat-thread">
        {messages.map((m, i) => (
          <div key={i} className={`bubble from-${m.from === 'buyer' ? 'buyer' : 'merchant'}`}>
            <p>{m.text}</p>
          </div>
        ))}
        {typing && (
          <div className="bubble from-merchant waiting">
            <span className="typing"><i /><i /><i /></span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={send}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message ${shop.name}…`} aria-label="Message" />
        <button className="btn btn-primary btn-icon" type="submit" aria-label="Send"><Send size={16} /></button>
      </form>

      {unlocked && (
        <a className="btn btn-outline block mt" href={waHref} target="_blank" rel="noreferrer">
          <MessageCircle size={16} /> Continue on WhatsApp
        </a>
      )}
    </Modal>
  );
}
