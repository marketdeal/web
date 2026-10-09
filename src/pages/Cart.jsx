import { Link } from 'react-router-dom';
import { Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Breadcrumb, EmptyState, LocationBadge, Visual } from '../components/ui';
import { useStore } from '../context/StoreContext';
import { groupCart, priceGroups } from '../lib/cart';
import { locate } from '../data/directory';
import { naira } from '../lib/format';

export default function Cart() {
  const { cart, updateQty, removeFromCart, b2cCatalog } = useStore();
  const summary = priceGroups(groupCart(cart, b2cCatalog));

  if (!summary.groups.length) {
    return (
      <div className="container">
        <EmptyState emoji="🛒" title="Your cart is empty" text="Browse the markets and add something you love." action={<Link to="/shop" className="btn btn-primary">Start shopping</Link>} />
      </div>
    );
  }

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
      <h1 className="page-title">Your cart</h1>
      <div className="cart-layout">
        <div className="cart-groups">
          {summary.groups.map((g) => {
            const loc = locate(g.shopId);
            return (
              <section key={g.shopId} className="card cart-group">
                <header className="cart-group-head">
                  <div>
                    <b>{loc.shop.name}</b>
                    <LocationBadge text={loc.label} />
                  </div>
                  <span className="pill pill-blue"><ShieldCheck size={13} /> Separate escrow for this shop</span>
                </header>
                {g.lines.map((l) => (
                  <div key={l.key} className="cart-line">
                    <Link to={`/product/${l.productId}`} className="cart-thumb"><Visual emoji={l.product.emoji} hue={l.product.hue} /></Link>
                    <div className="cart-line-info">
                      <Link to={`/product/${l.productId}`}><b>{l.product.name}</b></Link>
                      {l.variant && <span className="muted small">{l.product.variants.label}: {l.variant}</span>}
                      <span className="muted small">{naira(l.unitPrice)} each</span>
                    </div>
                    <div className="stepper stepper-sm">
                      <button onClick={() => updateQty(l.key, l.qty - 1)} aria-label="Decrease"><Minus size={14} /></button>
                      <span>{l.qty}</span>
                      <button onClick={() => updateQty(l.key, l.qty + 1)} aria-label="Increase"><Plus size={14} /></button>
                    </div>
                    <b className="cart-line-total">{naira(l.lineTotal)}</b>
                    <button className="icon-btn" onClick={() => removeFromCart(l.key)} aria-label="Remove item"><Trash2 size={17} /></button>
                  </div>
                ))}
                <footer className="cart-group-foot">
                  <span>Shop subtotal</span><b>{naira(g.subtotal)}</b>
                </footer>
              </section>
            );
          })}
        </div>

        <aside className="card summary">
          <h3>Order summary</h3>
          <dl className="sum-list">
            <div><dt>Items ({cart.reduce((n, l) => n + l.qty, 0)})</dt><dd>{naira(summary.subtotal)}</dd></div>
            <div><dt>Escrow protection fee</dt><dd>{naira(summary.escrow)}</dd></div>
            <div><dt>Delivery</dt><dd className="muted">Calculated at checkout</dd></div>
          </dl>
          <div className="sum-total"><span>Estimated total</span><strong>{naira(summary.subtotal + summary.escrow)}</strong></div>
          <Link to="/checkout" className="btn btn-primary btn-lg block">Proceed to checkout</Link>
          <p className="muted small center">Escrow fee is 0.5% per shop order, capped at ₦5,000.</p>
        </aside>
      </div>
    </div>
  );
}
