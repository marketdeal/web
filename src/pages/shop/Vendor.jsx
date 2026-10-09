import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Lock, MessageCircle, Phone } from 'lucide-react';
import ChatModal from '../../components/ChatModal';
import { ProductCard } from '../../components/cards';
import { Breadcrumb, EmptyState, LocationBadge, Stars, VerifiedBadge, Visual } from '../../components/ui';
import { categoryById } from '../../data/b2c';
import { locate, shopById, yearsInOperation } from '../../data/directory';
import { useStore } from '../../context/StoreContext';

/** Consumer vendor storefront — the last stop of the B2C spatial walk (Market → Street →
 *  Plaza → Vendor → Products), showing everything this merchant sells at retail. */
export default function VendorPage() {
  const { id } = useParams();
  const shop = shopById[id];
  const { hasOrderWith, productsOfShop } = useStore();
  const [cat, setCat] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  if (!shop) {
    return <div className="container"><EmptyState emoji="🧭" title="Vendor not found" action={<Link to="/shop/markets" className="btn btn-primary">Browse markets</Link>} /></div>;
  }

  const loc = locate(id);
  const { retail: products, wholesale } = productsOfShop(id);
  const categories = [...new Set(products.map((p) => p.category))];
  const shown = cat ? products.filter((p) => p.category === cat) : products;
  const wholesaleCount = wholesale.length;
  const unlocked = hasOrderWith(id);
  const digits = shop.phone.replace(/\D/g, '');

  const call = () => (unlocked ? (window.location.href = `tel:${digits}`) : setChatOpen(true));

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: 'Markets', to: '/shop/markets' },
          { label: loc.market.short, to: `/shop/market/${loc.market.id}` },
          { label: loc.street.name, to: `/shop/street/${loc.street.id}` },
          { label: loc.plaza.name, to: `/shop/plaza/${loc.plaza.id}` },
          { label: shop.name },
        ]}
      />

      {shop.suspended && (
        <div className="preview-banner tone-red">
          <Lock size={20} />
          <div>
            <b>This shop is temporarily unavailable.</b>
            <p>MarketDeal has paused this merchant’s listings while an issue is reviewed.</p>
          </div>
        </div>
      )}

      <section className="shop-banner" style={{ '--h': shop.hue }}>
        <Visual emoji={shop.emoji} hue={shop.hue} ratio="21 / 6" className="shop-banner-art" />
        <div className="shop-banner-body">
          <div className="shop-logo"><Visual emoji={shop.emoji} hue={shop.hue} /></div>
          <div className="grow">
            <div className="row gap wrap">
              <h1>{shop.name}</h1>
              <VerifiedBadge kyc={shop.kyc} />
            </div>
            <p className="muted">{shop.blurb}</p>
            <div className="row gap wrap">
              <LocationBadge text={loc.label} />
              <Stars value={shop.rating} count={shop.reviews} size={15} />
              <span className="small muted"><Clock size={13} /> {shop.hours}</span>
              <span className="small muted">{yearsInOperation(shop) > 0 ? `${yearsInOperation(shop)} years trading` : 'New shop'}</span>
            </div>
          </div>
          <div className="shop-contact">
            <button className="btn btn-primary" onClick={() => setChatOpen(true)}><MessageCircle size={16} /> Chat</button>
            <button className="btn btn-outline" onClick={call}>
              {unlocked ? <Phone size={16} /> : <Lock size={14} />} Call
            </button>
          </div>
        </div>
        <dl className="shop-facts">
          <div><dt>Owner</dt><dd>{shop.owner}</dd></div>
          <div><dt>Category</dt><dd>{shop.category}</dd></div>
          <div><dt>Verification</dt><dd>{shop.kyc >= 3 ? 'Verified Dealer' : 'Registered Merchant'}</dd></div>
          <div><dt>Also wholesale</dt><dd>{wholesaleCount ? `${wholesaleCount} bulk listings` : 'Retail only'}</dd></div>
        </dl>
      </section>

      <div className="row-between wrap section-tight">
        <h2>Products <span className="muted">({products.length})</span></h2>
        {categories.length > 1 && (
          <div className="chip-row">
            <button className={`chip-link ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>All</button>
            {categories.map((c) => <button key={c} className={`chip-link ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{categoryById[c].name}</button>)}
          </div>
        )}
      </div>

      {shown.length ? (
        <div className="grid grid-4">{shown.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <EmptyState emoji="📭" title="No retail products yet" text="This merchant currently sells wholesale only." />
      )}

      {chatOpen && <ChatModal shop={shop} onClose={() => setChatOpen(false)} />}
    </div>
  );
}
