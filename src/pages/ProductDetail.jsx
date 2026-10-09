import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock, Heart, Lock, MessageCircle, Minus, Plus, RotateCcw, ShoppingCart, Truck, Unlock, XCircle } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import { ProductCard } from '../components/cards';
import { Breadcrumb, EmptyState, EscrowNote, LocationBadge, SectionHead, StarRow, Stars, VerifiedBadge, Visual } from '../components/ui';
import { categoryById } from '../data/b2c';
import { reviewsFor } from '../data/reviews';
import { locate, yearsInOperation } from '../data/directory';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { unitPriceOf } from '../lib/cart';
import { discountPct, naira } from '../lib/format';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart, toggleWish, wishlist, hasOrderWith, b2cCatalog, previewProduct } = useStore();
  // Look up within the retail catalogue only — a wholesale-only id has no `price`/`variants` shape.
  const publicProduct = b2cCatalog.find((p) => p.id === id);
  // Not public yet? Only its owner can preview it, at the same address it'll live at once approved.
  const preview = !publicProduct ? previewProduct(id, 'retail') : null;
  const product = publicProduct || preview;
  const isPreview = !publicProduct && !!preview;
  const navigate = useNavigate();
  const toast = useToast();
  const [variant, setVariant] = useState(product?.variants?.options[0].name || null);
  const [qty, setQty] = useState(1);
  const [shot, setShot] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  if (!product) {
    return <EmptyState emoji="🤷" title="Product not found" action={<Link to="/shop" className="btn btn-primary">Back to shop</Link>} />;
  }

  const loc = locate(product.shopId);
  const price = unitPriceOf(product, variant);
  const oldPrice = product.oldPrice ? product.oldPrice + (price - product.price) : null;
  const off = discountPct(price, oldPrice);
  const wished = wishlist.includes(product.id);
  const reviews = reviewsFor(product.id);
  const related = b2cCatalog.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const cat = categoryById[product.category];

  // The gallery is illustrative — each thumbnail is a different tint of the same placeholder art.
  const shots = [0, 22, -18, 40].map((shift) => product.hue + shift);

  const add = () => {
    addToCart(product.id, qty, variant);
    toast(`Added ${qty} × “${product.name}” to your cart`);
  };

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: cat.name, to: `/shop?cat=${cat.id}` }, { label: product.name }]} />

      {isPreview && (
        <div className={`preview-banner tone-${product.status === 'REJECTED' ? 'red' : 'orange'}`}>
          {product.status === 'REJECTED' ? <XCircle size={20} /> : <Clock size={20} />}
          <div>
            <b>{product.status === 'REJECTED' ? 'This listing was rejected.' : 'Pending admin review.'}</b>
            <p>{product.status === 'REJECTED' ? product.rejectReason || 'No reason given.' : 'Only you can see this preview — it isn’t live on MarketDeal yet.'}</p>
          </div>
          <Link to="/vendor/products" className="btn btn-dark btn-sm">Manage in Product Manager</Link>
        </div>
      )}

      <div className="pdp">
        <div className="pdp-gallery">
          <Visual emoji={product.emoji} hue={shots[shot]} className="pdp-main" ratio="1 / 1" />
          <div className="thumbs">
            {shots.map((h, i) => (
              <button key={i} className={`thumb ${i === shot ? 'on' : ''}`} onClick={() => setShot(i)} aria-label={`View image ${i + 1}`}>
                <Visual emoji={product.emoji} hue={h} />
              </button>
            ))}
          </div>
        </div>

        <div className="pdp-info">
          <span className="muted small">{product.brand}</span>
          <h1>{product.name}</h1>
          <div className="row gap wrap">
            <Stars value={product.rating} count={product.reviews} size={16} />
            <span className={product.stock < 10 ? 'stock low' : 'stock'}>{product.stock < 10 ? `Only ${product.stock} left` : 'In stock'}</span>
            {product.condition && <span className="pill pill-gray">{product.condition}</span>}
          </div>
          <div className="pdp-price">
            <strong>{naira(price)}</strong>
            {oldPrice && <s>{naira(oldPrice)}</s>}
            {off > 0 && <span className="tag tag-sale static">Save {off}%</span>}
          </div>
          <p className="pdp-blurb">{product.blurb}</p>

          {product.variants && (
            <div className="variant">
              <b>{product.variants.label}</b>
              <div className="variant-opts">
                {product.variants.options.map((o) => (
                  <button key={o.name} className={`opt ${variant === o.name ? 'on' : ''}`} onClick={() => setVariant(o.name)}>{o.name}</button>
                ))}
              </div>
            </div>
          )}

          <div className="buy-row">
            <div className="stepper" aria-label="Quantity">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease"><Minus size={16} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Increase"><Plus size={16} /></button>
            </div>
            <button className="btn btn-primary btn-lg grow" onClick={add} disabled={isPreview}><ShoppingCart size={18} /> Add to cart</button>
            <button className={`btn btn-outline btn-lg btn-icon ${wished ? 'on' : ''}`} onClick={() => toggleWish(product.id)} aria-label="Wishlist">
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
            </button>
          </div>
          <button
            className="btn btn-dark btn-lg block"
            disabled={isPreview}
            onClick={() => {
              addToCart(product.id, qty, variant);
              navigate('/checkout');
            }}
          >
            Buy now
          </button>
          {isPreview && <p className="muted small center">Buying opens up once an admin approves this listing.</p>}

          <EscrowNote>
            <b>Escrow-protected.</b> Your payment is held by MarketDeal and only released to {loc.shop.name} after you confirm delivery.
          </EscrowNote>

          <ul className="perks">
            <li><Truck size={16} /> Delivery in 1–3 days within Lagos, 3–5 days nationwide</li>
            <li><RotateCcw size={16} /> Report a problem within 72 hours of delivery</li>
          </ul>
        </div>

        <aside className="seller-card">
          <span className="muted small">Sold by</span>
          <Link to={`/shop/vendor/${loc.shop.id}`}><h3>{loc.shop.name}</h3></Link>
          <div className="row gap wrap">
            <VerifiedBadge kyc={loc.shop.kyc} />
            <Stars value={loc.shop.rating} count={loc.shop.reviews} />
          </div>
          <LocationBadge text={loc.label} to={`/shop/market/${loc.market.id}`} />
          <dl className="mini-dl">
            <div><dt>Market</dt><dd><Link to={`/shop/market/${loc.market.id}`}>{loc.market.name}</Link></dd></div>
            <div><dt>Street</dt><dd><Link to={`/shop/street/${loc.street.id}`}>{loc.street.name}</Link></dd></div>
            <div><dt>Trading for</dt><dd>{yearsInOperation(loc.shop) > 0 ? `${yearsInOperation(loc.shop)} years` : 'New shop'}</dd></div>
            <div><dt>Hours</dt><dd>{loc.shop.hours}</dd></div>
          </dl>
          <button className="btn btn-outline block" onClick={() => setChatOpen(true)}><MessageCircle size={16} /> Message seller</button>
          <p className="muted small center contact-hint">
            {hasOrderWith(loc.shop.id) ? <><Unlock size={12} /> Phone number unlocked</> : <><Lock size={12} /> Phone unlocks after you order</>}
          </p>
        </aside>
      </div>

      {chatOpen && <ChatModal shop={loc.shop} product={product} onClose={() => setChatOpen(false)} />}

      {product.description && (
        <section className="pdp-description">
          <h2>Description</h2>
          <p>{product.description}</p>
        </section>
      )}

      <div className="pdp-tabs">
        <section>
          <h2>Specifications</h2>
          <table className="spec-table">
            <tbody>
              {product.specs.map(([k, v]) => (
                <tr key={k}><th>{k}</th><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h2>Customer reviews</h2>
          {product.reviews > 0 ? (
            <>
              <div className="review-summary">
                <strong>{product.rating.toFixed(1)}</strong>
                <div>
                  <StarRow value={product.rating} size={18} />
                  <span className="muted small">{product.reviews.toLocaleString('en-NG')} verified reviews</span>
                </div>
              </div>
              {reviews.map((r) => (
                <article key={r.id} className="review">
                  <div className="row-between">
                    <b>{r.name} <span className="muted small">· {r.city}</span></b>
                    <span className="muted small">{r.daysAgo} days ago</span>
                  </div>
                  <StarRow value={r.rating} />
                  <p>{r.text}</p>
                  <span className="pill pill-green">Verified purchase</span>
                </article>
              ))}
            </>
          ) : (
            <p className="muted">No reviews yet — be the first to buy and review this product.</p>
          )}
        </section>
      </div>

      {related.length > 0 && (
        <section className="section">
          <SectionHead title="You may also like" />
          <div className="grid grid-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
