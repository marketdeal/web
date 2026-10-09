import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Lock, MessageCircle, Phone } from 'lucide-react';
import { WholesaleCard } from '../../components/cards';
import { Breadcrumb, EmptyState, LocationBadge, Stars, VerifiedBadge, Visual } from '../../components/ui';
import { b2bCategoryById } from '../../data/b2b';
import { locate, shopById, yearsInOperation } from '../../data/directory';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';

export default function ShopPage() {
  const { id } = useParams();
  const shop = shopById[id];
  const { user } = useAuth();
  const { productsOfShop } = useStore();
  const [cat, setCat] = useState('');

  if (!shop) return <div className="container"><EmptyState emoji="🧭" title="Shop not found" action={<Link to="/b2b" className="btn btn-primary">Back to markets</Link>} /></div>;

  const loc = locate(id);
  const { retail, wholesale: listings } = productsOfShop(id);
  const categories = [...new Set(listings.map((p) => p.category))];
  const shown = cat ? listings.filter((p) => p.category === cat) : listings;
  const retailCount = retail.length;
  const isMine = id === user.business?.shopId;
  const digits = shop.phone.replace(/\D/g, '');

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: 'Markets', to: '/b2b' },
          { label: loc.market.short, to: `/b2b/market/${loc.market.id}` },
          { label: loc.street.name, to: `/b2b/street/${loc.street.id}` },
          { label: loc.plaza.name, to: `/b2b/plaza/${loc.plaza.id}` },
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
          {/* Merchant to merchant: contact is open so dealers can close deals between themselves. */}
          {!isMine && (
            <div className="shop-contact">
              <Link to={`/b2b/messages/${id}`} className="btn btn-primary"><MessageCircle size={16} /> Message</Link>
              <a className="btn btn-outline" href={`https://wa.me/234${digits.replace(/^0+/, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>
              <a className="btn btn-outline" href={`tel:${digits}`}><Phone size={16} /> Call</a>
            </div>
          )}
        </div>
        <dl className="shop-facts">
          <div><dt>Owner</dt><dd>{shop.owner}</dd></div>
          <div><dt>Category</dt><dd>{shop.category}</dd></div>
          <div><dt>KYC level</dt><dd>Level {shop.kyc}</dd></div>
          <div>
            <dt>Also sells retail</dt>
            <dd>{retailCount ? <Link to={`/shop/vendor/${id}`}>{retailCount} products on the B2C shop</Link> : 'Wholesale only'}</dd>
          </div>
        </dl>
      </section>

      <div className="row-between wrap section-tight">
        <h2>Wholesale catalogue <span className="muted">({listings.length})</span></h2>
        {categories.length > 1 && (
          <div className="chip-row">
            <button className={`chip-link ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>All</button>
            {categories.map((c) => <button key={c} className={`chip-link ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{b2bCategoryById[c].name}</button>)}
          </div>
        )}
      </div>

      {shown.length ? (
        <div className="grid grid-4">{shown.map((p) => <WholesaleCard key={p.id} product={p} />)}</div>
      ) : (
        <EmptyState emoji="📭" title="No wholesale listings yet" text="This merchant hasn’t published bulk pricing." />
      )}

    </div>
  );
}
