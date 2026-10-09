import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, ChevronRight, MapPin, ShieldCheck, Star, X } from 'lucide-react';

/** Placeholder artwork — coloured tile + emoji. Swap for real photography when available. */
export function Visual({ emoji, hue = 24, ratio = '1 / 1', className = '', children }) {
  return (
    <div className={`visual ${className}`} style={{ '--h': hue, aspectRatio: ratio }}>
      <span className="visual-emoji" aria-hidden="true">{emoji}</span>
      {children}
    </div>
  );
}

/** Compact rating: one star icon + the numeric average — used on cards and headers. */
export function Stars({ value, count, size = 14, showValue = true }) {
  if (count === 0) {
    return <span className="pill pill-blue" aria-label="New — no reviews yet">New</span>;
  }
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      <Star size={size} fill="currentColor" strokeWidth={0} />
      {showValue && <b>{value.toFixed(1)}</b>}
      {count != null && <span className="muted">({count.toLocaleString('en-NG')})</span>}
    </span>
  );
}

/** A row of 5 stars, filled up to the rounded rating — used for individual reviews. */
export function StarRow({ value, size = 14 }) {
  const rounded = Math.round(value);
  return (
    <span className="star-row" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= rounded ? 'currentColor' : 'none'} strokeWidth={n <= rounded ? 0 : 1.5} />
      ))}
    </span>
  );
}

export function VerifiedBadge({ kyc, compact = false }) {
  if (kyc < 3) return <span className="pill pill-gray">KYC Level {kyc}</span>;
  return (
    <span className="pill pill-verified" title={kyc === 4 ? 'Level 4 · Enterprise' : 'Level 3 · Verified Dealer'}>
      <BadgeCheck size={13} /> {compact ? 'Verified' : kyc === 4 ? 'Verified · Enterprise' : 'Verified Dealer'}
    </span>
  );
}

export function LocationBadge({ text, to }) {
  const inner = (
    <>
      <MapPin size={13} /> {text}
    </>
  );
  return to ? (
    <Link to={to} className="loc-badge">{inner}</Link>
  ) : (
    <span className="loc-badge">{inner}</span>
  );
}

export function EscrowNote({ children }) {
  return (
    <div className="escrow-note">
      <ShieldCheck size={20} />
      <div>{children}</div>
    </div>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i} className="crumb">
          {i > 0 && <ChevronRight size={14} />}
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ emoji = '🗂️', title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-emoji">{emoji}</div>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  );
}

export function StatusChip({ tone = 'gray', children }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function SectionHead({ title, sub, action }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
