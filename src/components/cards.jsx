import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Flame, Heart, MapPin, Package, ShoppingCart, Trophy } from 'lucide-react';
import { Modal, Stars, Visual, VerifiedBadge, LocationBadge } from './ui';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { locate } from '../data/directory';
import { categoryById } from '../data/b2c';
import { unitPriceOf } from '../lib/cart';
import { discountPct, naira, plural } from '../lib/format';

const compactSold = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}K+` : n);

/** True if this product currently sells the most (by 7-day volume) in its own category — drives
 *  the "Best Seller in {category}" ribbon, Temu-style. */
function useBestSellerBadge(product) {
  const { b2cCatalog } = useStore();
  if (!product.sold7d) return null;
  const leader = b2cCatalog
    .filter((p) => p.category === product.category)
    .reduce((best, p) => (p.sold7d > (best?.sold7d ?? -1) ? p : best), null);
  return leader?.id === product.id ? categoryById[product.category]?.name : null;
}

/** B2C product card — regular e-commerce tile, Temu-style: brand, sold count, best-seller ribbon
 *  and a Quick Look preview that adds to cart without leaving the grid. */
export function ProductCard({ product }) {
  const { addToCart, toggleWish, wishlist } = useStore();
  const toast = useToast();
  const loc = locate(product.shopId);
  const off = discountPct(product.price, product.oldPrice);
  const wished = wishlist.includes(product.id);
  const hasVariants = !!product.variants;
  const bestSellerIn = useBestSellerBadge(product);
  const [quickLook, setQuickLook] = useState(false);

  const add = () => {
    addToCart(product.id, 1, null);
    toast(`Added “${product.name}” to your cart`);
  };

  return (
    <article className="pcard">
      <div className="pcard-media-wrap">
        <Link to={`/product/${product.id}`} className="pcard-media">
          <Visual emoji={product.emoji} hue={product.hue} />
          {off > 0 && <span className="tag tag-sale">-{off}%</span>}
          {product.daysAgo <= 10 && off === 0 && <span className="tag tag-new">New</span>}
        </Link>
        <button className="quicklook-btn" onClick={() => setQuickLook(true)} aria-label={`Quick look: ${product.name}`}>
          <Eye size={14} /> Quick look
        </button>
      </div>
      <button className={`wish ${wished ? 'on' : ''}`} onClick={() => toggleWish(product.id)} aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}>
        <Heart size={17} fill={wished ? 'currentColor' : 'none'} />
      </button>

      <div className="pcard-body">
        <div className="pcard-toprow">
          <Link to={`/shop/market/${loc.market.id}`} className="pcard-loc"><MapPin size={12} /> {loc.market.short}</Link>
          {product.brand && <span className="pcard-brand">{product.brand}</span>}
        </div>
        <Link to={`/product/${product.id}`} className="pcard-name">{product.name}</Link>
        <div className="pcard-meta">
          <Stars value={product.rating} count={product.reviews} />
          {product.sold7d > 0 && <span className="sold-count"><Flame size={12} /> {compactSold(product.sold7d)} sold</span>}
        </div>
        {bestSellerIn && <span className="best-seller-line"><Trophy size={11} /> #1 in {bestSellerIn}</span>}
        <div className="pcard-price">
          <strong>{naira(product.price)}</strong>
          {product.oldPrice && <s>{naira(product.oldPrice)}</s>}
        </div>
        {hasVariants ? (
          <Link to={`/product/${product.id}`} className="btn btn-outline btn-sm">Choose options</Link>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={add}>
            <ShoppingCart size={15} /> Add to cart
          </button>
        )}
      </div>

      {quickLook && <QuickLookModal product={product} onClose={() => setQuickLook(false)} />}
    </article>
  );
}

function QuickLookModal({ product, onClose }) {
  const { addToCart, toggleWish, wishlist } = useStore();
  const toast = useToast();
  const [variant, setVariant] = useState(product.variants?.options[0].name || null);
  const price = unitPriceOf(product, variant);
  const oldPrice = product.oldPrice ? product.oldPrice + (price - product.price) : null;
  const off = discountPct(price, oldPrice);
  const wished = wishlist.includes(product.id);

  const add = () => {
    addToCart(product.id, 1, variant);
    toast(`Added “${product.name}” to your cart`);
    onClose();
  };

  return (
    <Modal title="Quick look" onClose={onClose} wide>
      <div className="quicklook">
        <Visual emoji={product.emoji} hue={product.hue} className="quicklook-visual" />
        <div className="quicklook-info">
          <span className="muted small">{product.brand}</span>
          <h3>{product.name}</h3>
          <Stars value={product.rating} count={product.reviews} size={15} />
          <div className="pcard-price lg">
            <strong>{naira(price)}</strong>
            {oldPrice && <s>{naira(oldPrice)}</s>}
            {off > 0 && <span className="tag tag-sale static">-{off}%</span>}
          </div>
          <p className="muted quicklook-blurb">{product.blurb}</p>
          {product.condition && <span className="pill pill-gray">{product.condition}</span>}

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

          <div className="form-actions start">
            <button className="btn btn-primary btn-lg" onClick={add}><ShoppingCart size={16} /> Add to cart</button>
            <button className={`btn btn-outline btn-lg btn-icon ${wished ? 'on' : ''}`} onClick={() => toggleWish(product.id)} aria-label="Wishlist">
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
            </button>
          </div>
          <Link to={`/product/${product.id}`} className="link-arrow" onClick={onClose}>View full details →</Link>
        </div>
      </div>
    </Modal>
  );
}

/** B2B wholesale card — shows tier pricing, MOQ and where the shop sits in the market. */
export function WholesaleCard({ product }) {
  const loc = locate(product.shopId);
  const best = product.tiers[product.tiers.length - 1].price;
  const entry = product.tiers[0].price;
  const save = Math.round(((product.retail - entry) / product.retail) * 100);

  return (
    <article className="wcard">
      <Link to={`/b2b/product/${product.id}`} className="wcard-media">
        <Visual emoji={product.emoji} hue={product.hue} ratio="4 / 3" />
        <span className="tag tag-moq"><Package size={12} /> MOQ {product.moq.toLocaleString('en-NG')}</span>
      </Link>
      <div className="wcard-body">
        <div className="pcard-toprow">
          <LocationBadge text={loc.short} />
          {product.brand && <span className="pcard-brand">{product.brand}</span>}
        </div>
        <Link to={`/b2b/product/${product.id}`} className="pcard-name">{product.name}</Link>
        <Link to={`/b2b/shop/${loc.shop.id}`} className="wcard-shop">
          {loc.shop.name} <VerifiedBadge kyc={loc.shop.kyc} compact />
        </Link>
        <div className="wcard-price">
          <div>
            <small>From</small>
            <strong>{naira(entry)}</strong>
            <small>/ {product.unit}</small>
          </div>
          <div className="wcard-save">
            <span>Save {save}%</span>
            <small>vs retail {naira(product.retail)}</small>
          </div>
        </div>
        <div className="wcard-tiers">
          Bulk price down to <b>{naira(best)}</b>
        </div>
      </div>
    </article>
  );
}

/** Shop/vendor tile used inside plaza & search views — `mode="wholesale"` (default) links into
 *  the B2B community, `mode="retail"` links to the vendor's B2C storefront instead. */
export function ShopCard({ shop, mode = 'wholesale' }) {
  const { productsOfShop } = useStore();
  const loc = locate(shop.id);
  const wholesale = mode === 'wholesale';
  const { retail, wholesale: wholesaleListings } = productsOfShop(shop.id);
  const count = wholesale ? wholesaleListings.length : retail.length;
  const to = wholesale ? `/b2b/shop/${shop.id}` : `/shop/vendor/${shop.id}`;
  const countLabel = wholesale ? plural(count, 'wholesale listing', 'wholesale listings') : plural(count, 'product');
  return (
    <Link to={to} className="shopcard">
      <Visual emoji={shop.emoji} hue={shop.hue} ratio="16 / 7" className="shopcard-art">
        <span className="shopcard-no">{shop.number}</span>
      </Visual>
      <div className="shopcard-body">
        <div className="row-between">
          <h4>{shop.name}</h4>
          <VerifiedBadge kyc={shop.kyc} compact />
        </div>
        <div className="muted small">{shop.category} · {loc.plaza.name}</div>
        <div className="row-between small">
          <Stars value={shop.rating} count={shop.reviews} />
          <span className="muted">{countLabel}</span>
        </div>
      </div>
    </Link>
  );
}
