import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Breadcrumb, EmptyState, StatusChip, Visual } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { ESCROW } from '../lib/escrow';
import { locate } from '../data/directory';
import { formatDate, naira } from '../lib/format';

/** scope: 'RETAIL' → the B2C order list, 'WHOLESALE' → the B2B order list. */
export default function Orders({ scope = 'RETAIL' }) {
  const { user } = useAuth();
  const { orders } = useStore();
  const mine = orders.filter((o) => o.buyerId === user.id && o.type === scope);
  const base = scope === 'WHOLESALE' ? '/b2b/orders' : '/orders';

  return (
    <div className="container">
      <Breadcrumb items={[{ label: scope === 'WHOLESALE' ? 'Wholesale' : 'Home', to: scope === 'WHOLESALE' ? '/b2b' : '/' }, { label: scope === 'WHOLESALE' ? 'Wholesale orders' : 'My orders' }]} />
      <h1 className="page-title">{scope === 'WHOLESALE' ? 'Wholesale orders' : 'My orders'}</h1>

      {mine.length === 0 ? (
        <EmptyState
          emoji="📦"
          title="No orders yet"
          text={scope === 'WHOLESALE' ? 'Wholesale deals are agreed directly between merchants.' : 'When you place an order it will show up here with live escrow status.'}
          action={<Link to={scope === 'WHOLESALE' ? '/b2b' : '/shop'} className="btn btn-primary">{scope === 'WHOLESALE' ? 'Browse the community' : 'Start shopping'}</Link>}
        />
      ) : (
        <div className="order-list">
          {mine.map((o) => {
            const st = ESCROW[o.escrow.state];
            const loc = locate(o.shopId);
            return (
              <Link key={o.id} to={`${base}/${o.id}`} className="card order-row">
                <div className="order-thumbs">
                  {o.items.slice(0, 3).map((it, i) => <Visual key={i} emoji={it.emoji} hue={it.hue} />)}
                </div>
                <div className="order-main">
                  <div className="row gap wrap">
                    <b>{o.id}</b>
                    <StatusChip tone={st.tone}>{st.label}</StatusChip>
                    {o.type === 'WHOLESALE' && <StatusChip tone="navy">PO {o.po.number}</StatusChip>}
                  </div>
                  <span>{o.items[0].name}{o.items.length > 1 ? ` + ${o.items.length - 1} more` : ''}</span>
                  <span className="muted small">{loc.shop.name} · {loc.market.short} · {formatDate(o.createdAt)}</span>
                </div>
                <div className="order-total">
                  <b>{naira(o.total)}</b>
                  <span className="muted small">{o.items.reduce((n, i) => n + i.qty, 0)} {o.items.reduce((n, i) => n + i.qty, 0) === 1 ? 'item' : 'items'}</span>
                </div>
                <ChevronRight size={20} className="muted" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
