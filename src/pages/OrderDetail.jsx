import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AlertTriangle, Check, CheckCircle2, FastForward, Package, Phone, Scale, ShieldCheck, Timer, Unlock } from 'lucide-react';
import { Breadcrumb, EmptyState, LocationBadge, Modal, StatusChip, Visual } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { ESCROW, TIMELINE, stepIndex } from '../lib/escrow';
import { locate } from '../data/directory';
import { formatDateTime, naira } from '../lib/format';

const disputeReasons = ['Item not received', 'Item not as described', 'Damaged or faulty item', 'Wrong item delivered', 'Counterfeit product'];

export default function OrderDetail() {
  const { id } = useParams();
  const { state: navState } = useLocation();
  const { user } = useAuth();
  const { orders, advanceOrder, confirmDelivery, extendRelease, raiseDispute, resolveDispute } = useStore();
  const toast = useToast();
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState(disputeReasons[0]);
  const [details, setDetails] = useState('');

  const order = orders.find((o) => o.id === id && o.buyerId === user.id);
  if (!order) {
    return <div className="container"><EmptyState emoji="🤷" title="Order not found" action={<Link to="/orders" className="btn btn-primary">My orders</Link>} /></div>;
  }

  const wholesale = order.type === 'WHOLESALE';
  const listPath = wholesale ? '/b2b/orders' : '/orders';
  const state = order.escrow.state;
  const st = ESCROW[state];
  const idx = stepIndex(state);
  const loc = locate(order.shopId);
  const canDispute = ['FUNDED', 'IN_TRANSIT', 'DELIVERED'].includes(state);
  const hoursLeft = order.autoReleaseAt ? Math.max(0, Math.round((order.autoReleaseAt - Date.now()) / 3600000)) : null;

  return (
    <div className="container">
      <Breadcrumb items={[{ label: wholesale ? 'Wholesale' : 'Home', to: wholesale ? '/b2b' : '/' }, { label: wholesale ? 'Wholesale orders' : 'My orders', to: listPath }, { label: order.id }]} />

      {navState?.placed && (
        <div className="success-banner">
          <CheckCircle2 size={22} />
          <div>
            <b>Order placed — your payment is safely held in escrow.</b>
            <span>The merchant has been notified and will dispatch your order shortly.</span>
          </div>
        </div>
      )}

      <div className="order-head">
        <div>
          <h1 className="page-title">Order {order.id}</h1>
          <div className="row gap wrap">
            <StatusChip tone={st.tone}>{st.label}</StatusChip>
            {wholesale && <StatusChip tone="navy">Wholesale · PO {order.po.number}</StatusChip>}
            <span className="muted small">Placed {formatDateTime(order.createdAt)}</span>
          </div>
        </div>
        <div className="order-amount">
          <span className="muted small">{state === 'RELEASED' ? 'Paid to merchant' : state === 'REFUNDED' ? 'Refunded to you' : state === 'PARTIAL_REFUND' ? 'Split between you and the merchant' : 'Held in escrow'}</span>
          <strong>{naira(order.total)}</strong>
        </div>
      </div>

      <div className="order-layout">
        <div className="stack">
          {/* --- escrow progress --- */}
          <section className="card pad">
            <h3><ShieldCheck size={18} /> Escrow status</h3>
            <ol className="timeline" aria-label="Order progress">
              {TIMELINE.map((t, i) => (
                <li key={t.state} className={idx > i ? 'done' : idx === i ? 'now' : ''}>
                  <span className="dot">{idx > i || (idx === i && state === 'RELEASED') ? <Check size={14} /> : i + 1}</span>
                  <b>{t.label}</b>
                </li>
              ))}
            </ol>

            <div className={`state-note tone-${st.tone}`}>
              {state === 'DISPUTED' ? <Scale size={18} /> : <ShieldCheck size={18} />}
              <p>{st.text}</p>
            </div>

            {state === 'IN_TRANSIT' && order.tracking && (
              <p className="tracking"><Package size={16} /> {order.tracking.courier} · Tracking no. <b>{order.tracking.number}</b></p>
            )}

            {state === 'DELIVERED' && (
              <div className="release-box">
                <div>
                  <b>Everything as expected?</b>
                  <span className="muted small"><Timer size={13} /> Auto-release in about {hoursLeft} hours{order.autoReleaseExtended ? ' (extended)' : ''}</span>
                </div>
                <div className="row gap wrap">
                  <button className="btn btn-primary" onClick={() => { confirmDelivery(order.id); toast('Thanks! Funds released to the merchant.'); }}>Confirm receipt & release funds</button>
                  {!order.autoReleaseExtended && (
                    <button className="btn btn-outline" onClick={() => { extendRelease(order.id); toast('Auto-release extended by 48 hours', { kind: 'info' }); }}>Extend by 48h</button>
                  )}
                </div>
              </div>
            )}

            {canDispute && (
              <button className="btn btn-ghost danger-text" onClick={() => setDisputing(true)}><AlertTriangle size={16} /> Something wrong? Raise a dispute</button>
            )}
            {state === 'DISPUTED' && order.dispute && (
              <p className="callout"><b>Your dispute:</b> {order.dispute.reason}. A mediator will contact both parties.</p>
            )}

            {/* Prototype-only controls so a presenter can walk the client through the whole lifecycle. */}
            {['FUNDED', 'IN_TRANSIT', 'DISPUTED'].includes(state) && (
              <div className="demo-box">
                <span className="demo-tag">Prototype controls</span>
                {state === 'DISPUTED' ? (
                  <div className="row gap wrap">
                    <span className="small muted">Play the mediator:</span>
                    <button className="btn btn-outline btn-sm" onClick={() => resolveDispute(order.id, 'REFUNDED')}>Refund the buyer</button>
                    <button className="btn btn-outline btn-sm" onClick={() => resolveDispute(order.id, 'RELEASED')}>Release to merchant</button>
                  </div>
                ) : (
                  <button className="btn btn-dark btn-sm" onClick={() => advanceOrder(order.id)}>
                    <FastForward size={15} /> {state === 'FUNDED' ? 'Simulate: merchant ships the order' : 'Simulate: logistics confirms delivery'}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* --- items --- */}
          <section className="card pad">
            <h3>Items</h3>
            {order.items.map((it, i) => (
              <div key={i} className="cart-line">
                <div className="cart-thumb"><Visual emoji={it.emoji} hue={it.hue} /></div>
                <div className="cart-line-info">
                  <Link to={wholesale ? `/b2b/product/${it.productId}` : `/product/${it.productId}`}><b>{it.name}</b></Link>
                  {it.variant && <span className="muted small">{it.variant}</span>}
                  <span className="muted small">{it.qty.toLocaleString('en-NG')} {it.unit ? `${it.unit}${it.qty > 1 ? 's' : ''}` : '×'} @ {naira(it.unitPrice)}</span>
                </div>
                <b className="cart-line-total">{naira(it.unitPrice * it.qty)}</b>
              </div>
            ))}
          </section>

          {/* --- activity --- */}
          <section className="card pad">
            <h3>Activity</h3>
            <ul className="events">
              {[...order.escrow.events].reverse().map((e, i) => (
                <li key={i}>
                  <StatusChip tone={ESCROW[e.state].tone}>{ESCROW[e.state].label}</StatusChip>
                  <p>{e.note}</p>
                  <span className="muted small">{formatDateTime(e.at)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="stack">
          <section className="card pad">
            <h3>Payment summary</h3>
            <dl className="sum-list">
              <div><dt>Subtotal</dt><dd>{naira(order.subtotal)}</dd></div>
              <div><dt>Delivery</dt><dd>{order.deliveryFee ? naira(order.deliveryFee) : 'Free'}</dd></div>
              {wholesale && <div><dt>VAT (7.5%)</dt><dd>{naira(order.vat)}</dd></div>}
              <div><dt>Escrow fee</dt><dd>{naira(order.escrowFee)}</dd></div>
            </dl>
            <div className="sum-total"><span>Total</span><strong>{naira(order.total)}</strong></div>
          </section>

          <section className="card pad">
            <h3>Merchant</h3>
            <Link to={wholesale ? `/b2b/shop/${loc.shop.id}` : `/shop/vendor/${loc.shop.id}`}><b>{loc.shop.name}</b></Link>
            <LocationBadge text={loc.label} />
            <span className="pill pill-green contact-unlock-pill"><Unlock size={12} /> Contact unlocked</span>
            <a className="muted small phone-link" href={`tel:${loc.shop.phone.replace(/\D/g, '')}`}><Phone size={13} /> {loc.shop.phone}</a>
          </section>

          <section className="card pad">
            <h3>Delivery</h3>
            <b>{order.deliveryLabel}</b>
            <p className="muted">{order.address.name}<br />{order.address.line}, {order.address.city}<br />{order.address.phone}</p>
            {order.deliveryId === 'pickup' && (
              <p className="callout">Pickup code: <b>{order.id.replace('MD-', '')}</b> — show this at the shop.</p>
            )}
          </section>

          {wholesale && (
            <section className="card pad">
              <h3>Purchase order & invoice</h3>
              <dl className="sum-list">
                <div><dt>Purchase order</dt><dd>{order.po.number}</dd></div>
                <div><dt>Invoice</dt><dd>INV-{order.po.number.slice(3)}</dd></div>
              </dl>
            </section>
          )}
        </aside>
      </div>

      {disputing && (
        <Modal title="Raise a dispute" onClose={() => setDisputing(false)}>
          <p className="muted">Escrow funds will be frozen until a MarketDeal mediator reviews the case. You’ll both have 48 hours to add evidence.</p>
          <label className="field">
            <span>What went wrong?</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {disputeReasons.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Details (optional)</span>
            <textarea rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe the issue. Photos and chat history are attached automatically." />
          </label>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setDisputing(false)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                raiseDispute(order.id, reason);
                setDisputing(false);
                toast('Dispute raised — escrow funds are frozen', { kind: 'info' });
              }}
            >
              Freeze funds & submit
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
