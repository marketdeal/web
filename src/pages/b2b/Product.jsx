import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock, MessageCircle, ShieldCheck, TrendingDown, XCircle } from 'lucide-react';
import { WholesaleCard } from '../../components/cards';
import { Breadcrumb, EmptyState, LocationBadge, SectionHead, Stars, VerifiedBadge, Visual } from '../../components/ui';
import { b2bCategoryById } from '../../data/b2b';
import { locate } from '../../data/directory';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { naira } from '../../lib/format';
import { tierFor, wholesaleTotals } from '../../lib/pricing';
import { productRef } from '../../lib/deals';

export default function B2BProduct() {
  const { id } = useParams();
  const { user } = useAuth();
  const { b2bCatalog, previewProduct } = useStore();
  // Look up within the wholesale catalogue only — a retail-only id has no `tiers`/`moq` shape.
  const publicProduct = b2bCatalog.find((p) => p.id === id);
  // Not public yet? Only its owner can preview it, at the same address it'll live at once approved.
  const preview = !publicProduct ? previewProduct(id, 'wholesale') : null;
  const product = publicProduct || preview;
  const isPreview = !publicProduct && !!preview;
  const navigate = useNavigate();
  const [qty, setQty] = useState(product?.moq || 1);

  if (!product) return <div className="container"><EmptyState emoji="🤷" title="Listing not found" action={<Link to="/b2b/search" className="btn btn-primary">Browse wholesale</Link>} /></div>;

  const loc = locate(product.shopId);
  const tier = tierFor(product, qty);
  const belowMoq = qty < product.moq;
  const totals = wholesaleTotals(tier.price, qty);
  const saving = product.retail - tier.price;
  const cat = b2bCategoryById[product.category];
  const more = b2bCatalog.filter((p) => p.shopId === product.shopId && p.id !== product.id);
  const similar = b2bCatalog.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const setQtyClamped = (v) => setQty(Math.max(1, Math.min(Number(v) || 1, product.stock)));
  const isMine = product.shopId === user.business?.shopId;
  const message = () => navigate(`/b2b/messages/${loc.shop.id}`, { state: { ref: productRef(product) } });

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: 'Markets', to: '/b2b' },
          { label: loc.market.short, to: `/b2b/market/${loc.market.id}` },
          { label: loc.street.name, to: `/b2b/street/${loc.street.id}` },
          { label: loc.plaza.name, to: `/b2b/plaza/${loc.plaza.id}` },
          { label: loc.shop.name, to: `/b2b/shop/${loc.shop.id}` },
          { label: product.name },
        ]}
      />

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

      <div className="wpdp">
        <div>
          <Visual emoji={product.emoji} hue={product.hue} ratio="4 / 3" className="wpdp-art" />
          <div className="card pad mt">
            <h3>About this listing</h3>
            <p>{product.blurb}</p>
            {product.description && <p className="wpdp-description">{product.description}</p>}
            <table className="spec-table">
              <tbody>
                {product.specs.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
                <tr><th>Sold per</th><td>{product.unit}</td></tr>
                <tr><th>Lead time</th><td>{product.leadDays} days after the deal is agreed</td></tr>
                <tr><th>Available stock</th><td>{product.stock.toLocaleString('en-NG')} {product.unit}s</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="card pad">
            <div className="row gap wrap">
              <span className="pill pill-blue">{cat.emoji} {cat.name}</span>
              {product.condition && <span className="pill pill-gray">{product.condition}</span>}
            </div>
            <h1 className="wpdp-title">{product.name}</h1>
            <Link to={`/b2b/shop/${loc.shop.id}`} className="wpdp-shop">
              <b>{loc.shop.name}</b> <VerifiedBadge kyc={loc.shop.kyc} />
              <Stars value={loc.shop.rating} count={loc.shop.reviews} />
            </Link>
            <LocationBadge text={loc.label} to={`/b2b/plaza/${loc.plaza.id}`} />

            <h3 className="mt">Bulk pricing</h3>
            <table className="tier-table">
              <thead><tr><th>Quantity</th><th>Price / {product.unit}</th><th>vs retail</th></tr></thead>
              <tbody>
                {product.tiers.map((t) => (
                  <tr key={t.min} className={!belowMoq && t.min === tier.min ? 'on' : ''}>
                    <td>{t.max ? `${t.min.toLocaleString('en-NG')} – ${t.max.toLocaleString('en-NG')}` : `${t.min.toLocaleString('en-NG')}+`}</td>
                    <td><b>{naira(t.price)}</b></td>
                    <td className="save"><TrendingDown size={13} /> {Math.round(((product.retail - t.price) / product.retail) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted small">Retail price: {naira(product.retail)} per {product.unit}. Wholesale pricing is visible to verified merchants only.</p>

            <div className="qty-box">
              <label className="field">
                <span>Quantity ({product.unit}s) · MOQ {product.moq.toLocaleString('en-NG')}</span>
                <input type="number" min={1} max={product.stock} value={qty} onChange={(e) => setQtyClamped(e.target.value)} />
              </label>
              <div className="chip-row">
                {product.tiers.map((t) => <button key={t.min} className="chip-link" onClick={() => setQty(t.min)}>{t.min.toLocaleString('en-NG')}</button>)}
              </div>
              {belowMoq && <p className="form-error">Minimum order is {product.moq.toLocaleString('en-NG')} {product.unit}s.</p>}
            </div>

            <dl className="sum-list">
              <div><dt>Unit price ({tier.max ? `${tier.min}–${tier.max}` : `${tier.min}+`} tier)</dt><dd>{naira(tier.price)}</dd></div>
              <div><dt>Subtotal</dt><dd>{naira(totals.subtotal)}</dd></div>
              <div><dt>VAT (7.5%)</dt><dd>{naira(totals.vat)}</dd></div>
              <div><dt><ShieldCheck size={13} /> Escrow fee</dt><dd>{naira(totals.escrow)}</dd></div>
            </dl>
            <div className="sum-total"><span>Estimated total</span><strong>{naira(totals.total)}</strong></div>
            {!belowMoq && saving > 0 && <p className="save-line"><TrendingDown size={14} /> You save <b>{naira(saving * qty)}</b> versus retail on this order.</p>}

            {/* Wholesale deals are closed directly between merchants — no RFQ or PO checkout. */}
            {!isMine && (
              <button className="btn btn-ghost block" style={{ fontWeight: 800 }} disabled={isPreview} onClick={message}>
                <MessageCircle size={16} /> Chat with the merchant
              </button>
            )}
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="section">
          <SectionHead title={`More from ${loc.shop.name}`} />
          <div className="grid grid-4">{more.map((p) => <WholesaleCard key={p.id} product={p} />)}</div>
        </section>
      )}
      {similar.length > 0 && (
        <section className="section">
          <SectionHead title={`Other ${cat.name.toLowerCase()} suppliers`} />
          <div className="grid grid-4">{similar.map((p) => <WholesaleCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}
