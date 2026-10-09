import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, CreditCard, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { Breadcrumb, EmptyState, EscrowNote, LocationBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { locate } from '../data/directory';
import { groupCart, priceGroups } from '../lib/cart';
import { deliveryOptions, paymentMethods } from '../lib/pricing';
import { naira } from '../lib/format';

const steps = ['Delivery', 'Payment', 'Confirm'];

export default function Checkout() {
  const { user } = useAuth();
  const { cart, placeRetailOrders, b2cCatalog } = useStore();
  const navigate = useNavigate();
  const placed = useRef(false);

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({ name: user.name, phone: user.phone, line: '', city: user.city || 'Lagos' });
  const [deliveryId, setDeliveryId] = useState('intra');
  const [payment, setPayment] = useState('card');
  const [card, setCard] = useState({ number: '4242 4242 4242 4242', expiry: '12/28', cvv: '123' });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const delivery = deliveryOptions.find((d) => d.id === deliveryId);
  const summary = priceGroups(groupCart(cart, b2cCatalog), delivery.fee);

  if (!summary.groups.length && !placed.current) {
    return (
      <div className="container">
        <EmptyState emoji="🛒" title="Nothing to check out" text="Add a few products to your cart first." action={<Link to="/shop" className="btn btn-primary">Browse products</Link>} />
      </div>
    );
  }

  const validateAddress = () => {
    const e = {};
    if (!address.name.trim()) e.name = 'Enter the recipient’s name';
    if (!address.phone.trim()) e.phone = 'Enter a phone number';
    if (deliveryId !== 'pickup' && !address.line.trim()) e.line = 'Enter a delivery address';
    if (!address.city.trim()) e.city = 'Enter a city';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pay = () => {
    setProcessing(true);
    setTimeout(() => {
      placed.current = true;
      const orders = placeRetailOrders({
        address: deliveryId === 'pickup' ? { ...address, line: 'Self-pickup at shop' } : address,
        payment,
        delivery,
      });
      navigate(orders.length === 1 ? `/orders/${orders[0].id}` : '/orders', { state: { placed: orders.length } });
    }, 1700);
  };

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
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
              <h3>Where should we deliver?</h3>
              <div className="form-grid">
                <Field label="Full name" error={errors.name}>
                  <input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
                </Field>
                <Field label="Phone number" error={errors.phone}>
                  <input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                </Field>
                <Field label="City" error={errors.city}>
                  <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                </Field>
                <Field label="Delivery address" error={errors.line} wide>
                  <input value={address.line} placeholder="House number, street, area" disabled={deliveryId === 'pickup'} onChange={(e) => setAddress({ ...address, line: e.target.value })} />
                </Field>
              </div>

              <h3 className="mt">Delivery method</h3>
              <div className="radio-list">
                {deliveryOptions.map((d) => (
                  <label key={d.id} className={`radio-card ${deliveryId === d.id ? 'on' : ''}`}>
                    <input type="radio" name="delivery" checked={deliveryId === d.id} onChange={() => setDeliveryId(d.id)} />
                    <div><b>{d.label}</b><span className="muted small">{d.note}</span></div>
                    <strong>{d.fee ? `${naira(d.fee)} / shop` : 'Free'}</strong>
                  </label>
                ))}
              </div>
              <div className="form-actions">
                <Link to="/cart" className="btn btn-ghost">Back to cart</Link>
                <button className="btn btn-primary btn-lg" onClick={() => validateAddress() && setStep(1)}>Continue to payment</button>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="card pad">
              <h3>How would you like to pay?</h3>
              <div className="radio-list">
                {paymentMethods.map((m) => (
                  <label key={m.id} className={`radio-card ${payment === m.id ? 'on' : ''}`}>
                    <input type="radio" name="payment" checked={payment === m.id} onChange={() => setPayment(m.id)} />
                    <div><b>{m.label}</b><span className="muted small">{m.note}</span></div>
                  </label>
                ))}
              </div>

              {payment === 'card' && (
                <div className="form-grid mt">
                  <Field label="Card number" wide>
                    <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} inputMode="numeric" />
                  </Field>
                  <Field label="Expiry"><input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} /></Field>
                  <Field label="CVV"><input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} inputMode="numeric" /></Field>
                </div>
              )}
              {payment !== 'card' && (
                <p className="callout mt">
                  {payment === 'transfer' && 'You’ll receive a one-time account number after you confirm the order.'}
                  {payment === 'ussd' && 'A USSD code will be shown after you confirm. Dial it on your phone to pay.'}
                  {payment === 'wallet' && 'Your MarketDeal wallet balance will be debited when you confirm.'}
                </p>
              )}
              <p className="muted small mt"><Lock size={13} /> Demo mode — no real payment is taken. In production, payments run through Paystack / Flutterwave.</p>
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
                <button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>Review order</button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="card pad">
              <h3>Review & confirm</h3>
              <div className="review-cols">
                <div>
                  <span className="muted small">Deliver to</span>
                  <p><b>{address.name}</b><br />{deliveryId === 'pickup' ? 'Self-pickup at each shop' : address.line}, {address.city}<br />{address.phone}</p>
                </div>
                <div>
                  <span className="muted small">Delivery</span>
                  <p><b>{delivery.label}</b><br />{delivery.note}</p>
                </div>
                <div>
                  <span className="muted small">Payment</span>
                  <p><b>{paymentMethods.find((m) => m.id === payment).label}</b>{payment === 'card' && <><br />•••• {card.number.replace(/\s/g, '').slice(-4)}</>}</p>
                </div>
              </div>

              <EscrowNote>
                <b>How escrow works:</b> we hold your ₦{summary.total.toLocaleString('en-NG')} securely. Each merchant is paid only after you
                confirm delivery (or 72 hours after logistics confirm it). Not right? Raise a dispute and a mediator steps in.
              </EscrowNote>

              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={processing}>Back</button>
                <button className="btn btn-primary btn-lg" onClick={pay} disabled={processing}>
                  {processing ? <><Loader2 size={18} className="spin" /> Processing payment…</> : <><CreditCard size={18} /> Pay {naira(summary.total)}</>}
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
            <div><dt>Delivery</dt><dd>{summary.delivery ? naira(summary.delivery) : 'Free'}</dd></div>
            <div><dt><ShieldCheck size={13} /> Escrow fee</dt><dd>{naira(summary.escrow)}</dd></div>
          </dl>
          <div className="sum-total"><span>Total</span><strong>{naira(summary.total)}</strong></div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, error, wide, children }) {
  return (
    <label className={`field ${wide ? 'wide' : ''} ${error ? 'has-error' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <em>{error}</em>}
    </label>
  );
}
