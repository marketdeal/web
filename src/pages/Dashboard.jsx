import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, Check, Handshake, MessageCircle, MessagesSquare, Phone, Store, Unlock } from 'lucide-react';
import BarChart from '../components/BarChart';
import { Breadcrumb, LocationBadge, StatusChip, VerifiedBadge, Visual } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { KycPanel } from './Auth';
import { marketById, shopById } from '../data/directory';
import { compactNaira, naira, plural, timeAgo } from '../lib/format';

// Sample figures for the presentation — a real dashboard reads these from the order and analytics services.
const weekly = [1_240_000, 1_520_000, 1_410_000, 1_930_000, 2_110_000, 1_840_000, 2_460_000, 2_230_000, 2_940_000, 3_120_000, 2_710_000, 3_480_000];
const weekLabel = (i) => {
  const d = new Date();
  d.setDate(d.getDate() - (weekly.length - 1 - i) * 7);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
};
const chartData = weekly.map((value, i) => ({ label: weekLabel(i), value }));

const recentOrders = [
  { id: 'MD-483920', buyer: 'Adaeze O. · Lagos', phone: '0803 555 0101', item: 'Samsung Galaxy A55 5G', amount: 520000, state: 'IN_TRANSIT' },
  { id: 'MD-483811', buyer: 'Ibrahim S. · Kano', phone: '0812 555 3348', item: 'Tecno Camon 30 Pro 5G', amount: 398000, state: 'FUNDED' },
  { id: 'MD-483644', buyer: 'Ngozi E. · Enugu', phone: '0706 555 8827', item: 'Anker PowerCore 20,000mAh', amount: 38500, state: 'DELIVERED' },
  { id: 'MD-483502', buyer: 'Tunde A. · Ibadan', phone: '0905 555 1120', item: 'Infinix Note 40 Pro', amount: 285000, state: 'RELEASED' },
];
const stateTone = { FUNDED: ['blue', 'Escrow funded'], IN_TRANSIT: ['orange', 'In transit'], DELIVERED: ['green', 'Delivered'], RELEASED: ['green', 'Paid out'] };

export default function Dashboard() {
  const { user } = useAuth();
  const { myDealChats, dealUnread, orders } = useStore();
  const biz = user.business;
  const market = marketById[biz.marketId];
  const kycSteps = [
    { label: 'Email verified', level: 'Level 1', done: true },
    { label: 'CAC registered (optional)', level: 'Level 2', done: biz.cacVerification.status === 'VERIFIED' },
    { label: 'Physical shop verification', level: 'Level 3 · Verified Dealer', done: biz.physicalVerification.status === 'VERIFIED' },
  ];
  const myOrders = orders.filter((o) => o.buyerId === user.id);

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Wholesale', to: '/b2b' }, { label: 'Merchant dashboard' }]} />
      <div className="order-head">
        <div>
          <h1 className="page-title">{biz.name}</h1>
          <div className="row gap wrap">
            <VerifiedBadge kyc={biz.kycLevel} />
            <LocationBadge text={market.name} />
            {biz.cac && <span className="muted small">CAC {biz.cac}</span>}
          </div>
        </div>
        <div className="row gap wrap">
          <Link to="/vendor/products" className="btn btn-outline"><Boxes size={16} /> Product Manager</Link>
          <Link to={`/b2b/market/${biz.marketId}/community`} className="btn btn-outline"><MessageCircle size={16} /> {market.short} Community</Link>
          <Link to="/b2b" className="btn btn-outline"><Handshake size={16} /> Wholesale community</Link>
          <Link to="/" className="btn btn-primary"><Store size={16} /> View B2C shop</Link>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card hero-kpi">
          <span className="muted">Sales, last 30 days</span>
          <strong>{naira(11_250_000)}</strong>
          <span className="delta up">▲ 18.4% vs previous 30 days</span>
        </div>
        <div className="card kpi"><span className="muted">Orders</span><strong>142</strong><span className="delta up">▲ 12</span></div>
        <div className="card kpi"><span className="muted">Conversion rate</span><strong>4.8%</strong><span className="delta up">▲ 0.6 pts</span></div>
        <div className="card kpi"><span className="muted">In escrow</span><strong>{compactNaira(2_840_000)}</strong><span className="muted small">9 orders pending release</span></div>
      </div>

      <div className="dash-grid">
        <section className="card pad">
          <BarChart title="Weekly sales" subtitle="Gross sales value across retail and wholesale orders, last 12 weeks" data={chartData} />
        </section>

        <section className="card pad">
          <h3>KYC & verification</h3>
          <ul className="kyc-list">
            {kycSteps.map((s) => (
              <li key={s.label} className={s.done ? 'done' : ''}>
                <span>{s.done ? <Check size={13} /> : ''}</span>
                <div><b>{s.label}</b><small className="muted">{s.level}</small></div>
              </li>
            ))}
          </ul>
          <KycPanel />
        </section>

        <section className="card pad">
          <div className="row-between">
            <h3>Recent orders</h3>
            <Link to="/orders" className="link-arrow small">Your purchases <ArrowRight size={14} /></Link>
          </div>
          <table className="data-table">
            <thead><tr><th>Order</th><th>Contact</th><th>Item</th><th className="num">Amount</th><th>Status</th></tr></thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td><b>{o.id}</b><small className="muted">{o.buyer}</small></td>
                  <td>
                    <a className="phone-link small" href={`tel:${o.phone.replace(/\D/g, '')}`}><Phone size={12} /> {o.phone}</a>
                    <small className="muted contact-note"><Unlock size={11} /> Order placed</small>
                  </td>
                  <td>{o.item}</td>
                  <td className="num">{naira(o.amount)}</td>
                  <td><StatusChip tone={stateTone[o.state][0]}>{stateTone[o.state][1]}</StatusChip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card pad">
          <div className="row-between">
            <h3><MessagesSquare size={17} /> Merchant messages</h3>
            {dealUnread > 0 && <span className="pill pill-orange">{dealUnread} unread</span>}
          </div>
          {myDealChats.length === 0 ? (
            <p className="muted small">No deal conversations yet. Message a merchant from any wholesale listing, shop or community post — deals are closed directly between you.</p>
          ) : (
            <ul className="inbox compact">
              {myDealChats.slice(0, 4).map((c) => {
                const shop = shopById[c.shopId];
                if (!shop) return null;
                const last = c.messages[c.messages.length - 1];
                return (
                  <li key={c.id}>
                    <Link to={`/b2b/messages/${c.shopId}`} className={`inbox-row ${c.unread ? 'unread' : ''}`}>
                      <Visual emoji={shop.emoji} hue={shop.hue} />
                      <div className="grow">
                        <div className="row-between"><b>{shop.name}</b><span className="muted small">{timeAgo(c.updatedAt)}</span></div>
                        <span className="inbox-last">{last.from === 'me' ? 'You: ' : ''}{last.text || 'Shared a reference'}</span>
                      </div>
                      {c.unread > 0 && <i className="count">{c.unread}</i>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link to="/b2b/messages" className="link-arrow small">All messages <ArrowRight size={14} /></Link>
        </section>
      </div>

      <div className="card pad your-activity">
        <h3>Your buying activity</h3>
        <div className="row gap wrap">
          <Link to="/b2b/messages" className="chip-link">{plural(myDealChats.length, 'merchant conversation')}</Link>
          <Link to="/orders" className="chip-link">{plural(myOrders.filter((o) => o.type === 'RETAIL').length, 'retail order')}</Link>
        </div>
      </div>
    </div>
  );
}
