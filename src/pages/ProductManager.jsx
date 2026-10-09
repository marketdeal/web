import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Eye, Package, Pencil, Plus, ShieldCheck, Store, Trash2, XCircle } from 'lucide-react';
import { Breadcrumb, EmptyState, StatusChip, Visual } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { naira } from '../lib/format';

const STATUS = {
  PENDING: { label: 'Pending review', tone: 'orange' },
  APPROVED: { label: 'Live', tone: 'green' },
  REJECTED: { label: 'Rejected', tone: 'red' },
};

export default function ProductManager() {
  const { user } = useAuth();
  const { myProducts, approveProduct, rejectProduct, removeProduct } = useStore();
  const toast = useToast();

  const mine = myProducts.filter((p) => p.ownerId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  const shopId = user.business.shopId;

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Dashboard', to: '/vendor' }, { label: 'Product Manager' }]} />
      <div className="order-head">
        <div>
          <h1 className="page-title">Product Manager</h1>
          <p className="muted">List products for retail, wholesale, or both — every new listing (and every edit) goes through admin review before it appears on MarketDeal.</p>
        </div>
        <Link to="/vendor/products/new" className="btn btn-primary btn-lg"><Plus size={18} /> Add product</Link>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          emoji="🗂️"
          title="You haven’t listed any products yet"
          text="Add your first product — it’ll show as “Pending review” until an admin approves it, then go live automatically."
          action={<Link to="/vendor/products/new" className="btn btn-primary btn-lg"><Plus size={16} /> Add your first product</Link>}
        />
      ) : (
        <div className="order-list">
          {mine.map((p) => {
            const st = STATUS[p.status];
            const types = [p.listRetail && 'Retail', p.listWholesale && 'Wholesale'].filter(Boolean);
            // Same ids the listing will resolve at once (or while) live — a pending/rejected item
            // is only visible at this address to its owner (see StoreContext#previewProduct).
            const retailPreviewHref = p.listRetail ? `/product/up-${p.id}` : null;
            const wholesalePreviewHref = p.listWholesale ? `/b2b/product/uw-${p.id}` : null;

            return (
              <div key={p.id} className="card order-row product-row">
                <div className="order-thumbs"><Visual emoji={p.emoji} hue={p.hue} /></div>
                <div className="order-main">
                  <div className="row gap wrap">
                    <b>{p.name}</b>
                    <StatusChip tone={st.tone}>{st.label}</StatusChip>
                    {types.map((t) => <span key={t} className="pill pill-blue">{t}</span>)}
                  </div>
                  <span className="muted small">{p.blurb}</span>
                  {p.status === 'PENDING' && <span className="muted small"><Clock size={12} /> Awaiting admin review — usually within a few minutes</span>}
                </div>
                <div className="order-total">
                  {p.listRetail && <><b>{naira(p.price)}</b><span className="muted small">{p.stockRetail} in stock</span></>}
                  {p.listWholesale && <span className="muted small">MOQ {p.moq.toLocaleString('en-NG')} · from {naira([...p.tiers].sort((a, b) => a.min - b.min)[0].price)}</span>}
                </div>

                <div className="product-actions">
                  {p.status === 'REJECTED' && (
                    <div className="callout reject-callout">
                      <XCircle size={14} /> <b>Rejected:</b> {p.rejectReason || 'No reason given.'}
                    </div>
                  )}

                  <div className="row gap wrap">
                    {retailPreviewHref && <Link to={retailPreviewHref} className="btn btn-outline btn-sm"><Eye size={14} /> Preview retail</Link>}
                    {wholesalePreviewHref && <Link to={wholesalePreviewHref} className="btn btn-outline btn-sm"><Eye size={14} /> Preview wholesale</Link>}
                    {p.status === 'APPROVED' && p.listRetail && <Link to={`/shop/vendor/${shopId}`} className="btn btn-outline btn-sm"><Store size={14} /> View on your shop</Link>}
                    {p.status === 'APPROVED' && p.listWholesale && <Link to={`/b2b/shop/${shopId}`} className="btn btn-outline btn-sm"><Package size={14} /> View on wholesale</Link>}
                    <Link to={`/vendor/products/${p.id}/edit`} className="btn btn-outline btn-sm">
                      <Pencil size={14} /> {p.status === 'REJECTED' ? 'Edit & resubmit' : 'Edit'}
                    </Link>
                    {p.status !== 'PENDING' && (
                      <button className="btn btn-ghost btn-sm danger-text" onClick={() => removeProduct(p.id)}><Trash2 size={14} /> Remove</button>
                    )}
                  </div>

                  {p.status === 'PENDING' && (
                    <div className="demo-box">
                      <span className="demo-tag">Prototype controls</span>
                      <div className="row gap wrap">
                        <button className="btn btn-outline btn-sm" onClick={() => { approveProduct(p.id); toast(`“${p.name}” approved and now live`); }}>
                          <CheckCircle2 size={14} /> Simulate: admin approves
                        </button>
                        <button
                          className="btn btn-outline btn-sm danger-text"
                          onClick={() => { rejectProduct(p.id, 'Photos or description didn’t meet listing guidelines.'); toast('Listing rejected (demo)', { kind: 'info' }); }}
                        >
                          <XCircle size={14} /> Simulate: admin rejects
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="muted small center mt"><ShieldCheck size={13} /> Admin review is simulated in this prototype — in production, listings are checked for counterfeit risk and policy compliance (PRD §10.3).</p>
    </div>
  );
}
