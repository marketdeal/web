import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, CreditCard, Loader2, Lock, ShieldCheck, Truck } from 'lucide-react';
import { Breadcrumb, EmptyState, EscrowNote, LocationBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { locate } from '../data/directory';
import { groupCart, priceGroups } from '../lib/cart';
import { paymentGateways } from '../lib/pricing';
import { naira } from '../lib/format';

const steps = ['Payment', 'Confirm'];

// Delivery is agreed between buyer and seller in chat — MarketDeal only holds the payment in escrow.
const DIRECT_DELIVERY = { id: 'direct', label: 'Arranged with the seller', note: 'Agreed directly between you and the seller', fee: 0 };

export default function Checkout() {
  const { user } = useAuth();
  const { cart, placeRetailOrders, b2cCatalog } = useStore();
  const navigate = useNavigate();
  const placed = useRef(false);

  const [step, setStep] = useState(0);
  const [payment, setPayment] = useState('paystack');
  const gateway = paymentGateways.find((g) => g.id === payment);
  const [processing, setProcessing] = useState(false);

  const summary = priceGroups(groupCart(cart, b2cCatalog), 0);

  if (!summary.groups.length && !placed.current) {
    return (
      <div className="container">
        <EmptyState emoji="🛒" title="Nothing to pay for" text="Open a product and choose “Pay with escrow” to pay a seller securely." action={<Link to="/shop" className="btn btn-primary">Browse products</Link>} />
      </div>
    );
  }

  const pay = () => {
    setProcessing(true);
    setTimeout(() => {
      placed.current = true;
      const orders = placeRetailOrders({
        // Buyer contact only, so MarketDeal can reach them about the escrow — no delivery address.
        address: { name: user.name, phone: user.phone },
        payment,
        delivery: DIRECT_DELIVERY,
      });
      navigate(orders.length === 1 ? `/orders/${orders[0].id}` : '/orders', { state: { placed: orders.length } });
    }, 1700);
  };

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: 'Checkout' }]} />
      <h1 className="page-title">Checkout</h1>

      <ol className="stepper-nav" aria-label="Checkout steps">
        {steps.map((s, i) => (
          <li key={s} className={i === step ? 'on' : i < step ? 'done' : ''}>
            <span>{i < step ? <Check size={14} /> : i + 1}</span> {s}
          </li>
        ))}
      </ol>

      <div className="cart-layout">
        <div>
          {step === 0 && (
            <section className="card pad">
              <EscrowNote>
                <b>Delivery is between you and {summary.groups.length === 1 ? locate(summary.groups[0].shopId).shop.name : 'the seller'}.</b> Agree on
                delivery in your chat. MarketDeal only holds your payment and releases it once you confirm you’ve received the item.
              </EscrowNote>
              <h3 className="mt">Choose a payment gateway</h3>
              <div className="radio-list">
                {paymentGateways.map((m) => (
                  <label key={m.id} className={`radio-card ${payment === m.id ? 'on' : ''}`}>
                    <input type="radio" name="payment" checked={payment === m.id} onChange={() => setPayment(m.id)} />
                    <div><b>{m.label}</b><span className="muted small">{m.note}</span></div>
                  </label>
                ))}
              </div>

              <p className="callout mt">You’ll pick how to pay — card, transfer, USSD and more — on {gateway.label}’s secure checkout after you confirm.</p>
              <p className="muted small mt"><Lock size={13} /> Demo mode — no real payment is taken.</p>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Back</button>
                <button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>Review payment</button>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="card pad">
              <h3>Review & confirm</h3>
              <div className="review-cols">
                <div>
                  <span className="muted small">Delivery</span>
                  <p><b>{DIRECT_DELIVERY.label}</b><br />{DIRECT_DELIVERY.note}</p>
                </div>
                <div>
                  <span className="muted small">Payment</span>
                  <p><b>{gateway.label}</b><br />{gateway.note}</p>
                </div>
              </div>

              <EscrowNote>
                <b>How escrow works:</b> we hold your ₦{summary.total.toLocaleString('en-NG')} securely. The seller is paid only after you
                confirm you’ve received your item. Not right? Raise a dispute and a mediator steps in.
              </EscrowNote>

              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => setStep(0)} disabled={processing}>Back</button>
                <button className="btn btn-primary btn-lg" onClick={pay} disabled={processing}>
                  {processing ? <><Loader2 size={18} className="spin" /> Opening {gateway.label}…</> : <><CreditCard size={18} /> Pay {naira(summary.total)} with {gateway.label}</>}
                </button>
              </div>
            </section>
          )}
        </div>

        <aside className="card summary">
          <h3>Order summary</h3>
          {summary.groups.map((g) => (
            <div key={g.shopId} className="sum-shop">
              <b>{locate(g.shopId).shop.name}</b>
              <LocationBadge text={locate(g.shopId).market.short} />
              {g.lines.map((l) => (
                <div key={l.key} className="sum-line"><span>{l.qty} × {l.product.name}{l.variant ? ` (${l.variant})` : ''}</span><span>{naira(l.lineTotal)}</span></div>
              ))}
            </div>
          ))}
          <dl className="sum-list">
            <div><dt>Subtotal</dt><dd>{naira(summary.subtotal)}</dd></div>
            <div><dt><ShieldCheck size={13} /> Escrow fee</dt><dd>{naira(summary.escrow)}</dd></div>
          </dl>
          <div className="sum-total"><span>Total</span><strong>{naira(summary.total)}</strong></div>
          <p className="muted small mt"><Truck size={13} /> Delivery is arranged directly with the seller and isn’t included here.</p>
        </aside>
      </div>
    </div>
  );
}
