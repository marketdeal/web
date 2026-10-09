import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2, Clock, Landmark, Megaphone, Users } from 'lucide-react';
import { ProductCard, ShopCard } from '../../components/cards';
import { Breadcrumb, EmptyState, SectionHead, Visual } from '../../components/ui';
import {
  locate, marketById, plazaById, plazasOfMarket, plazasOfStreet, shopsOfMarket, shopsOfPlaza, streetById, streetsOfMarket,
} from '../../data/directory';
import { useStore } from '../../context/StoreContext';
import { plural } from '../../lib/format';

// Consumer-facing (B2C) counterpart of pages/b2b/Directory.jsx — same spatial hierarchy
// (Market → Street/Lane → Plaza/Complex → Vendor), styled for the shop theme and linking
// through to retail products rather than wholesale listings.

const NotFound = () => (
  <div className="container"><EmptyState emoji="🧭" title="That place isn’t on the map" action={<Link to="/shop/markets" className="btn btn-primary">Back to markets</Link>} /></div>
);

function MarketMap({ market }) {
  return (
    <div className="map" style={{ '--h': market.hue }} role="group" aria-label={`Map of ${market.name}`}>
      <div className="map-title"><Landmark size={14} /> {market.name} · aerial view</div>
      {streetsOfMarket(market.id).map((street) => {
        const list = plazasOfStreet(street.id);
        const north = list.filter((_, i) => i % 2 === 0);
        const south = list.filter((_, i) => i % 2 === 1);
        const block = (p) => (
          <Link key={p.id} to={`/shop/plaza/${p.id}`} className="map-plaza">
            <b>{p.name}</b>
            <small>{plural(shopsOfPlaza(p.id).length, 'shop')} · {plural(p.floors, 'floor')}</small>
          </Link>
        );
        return (
          <div key={street.id} className="map-street">
            <div className="map-side">{north.map(block)}</div>
            <Link to={`/shop/street/${street.id}`} className="map-road"><span>{street.name}</span></Link>
            {south.length > 0 && <div className="map-side">{south.map(block)}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function MarketPage() {
  const { id } = useParams();
  const { b2cCatalog } = useStore();
  const market = marketById[id];
  if (!market) return <NotFound />;

  const streets = streetsOfMarket(id);
  const shopList = shopsOfMarket(id);
  const featured = [...shopList].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const products = b2cCatalog.filter((p) => locate(p.shopId).market.id === id);
  const popular = [...products].sort((a, b) => b.sold7d - a.sold7d).slice(0, 4);

  return (
    <>
      <section className="market-hero" style={{ '--h': market.hue }}>
        <div className="container">
          <Breadcrumb items={[{ label: 'Markets', to: '/shop/markets' }, { label: market.name }]} />
          <div className="market-hero-grid">
            <div>
              <h1>{market.emoji} {market.name}</h1>
              <p className="lead">{market.tagline}. {market.description}</p>
              <div className="meta-row">
                <span><Landmark size={15} /> {market.city}, {market.state}</span>
                <span><Clock size={15} /> {market.hours}</span>
                <span><Users size={15} /> {market.association}</span>
              </div>
            </div>
            <div className="b2b-stats light">
              <div><b>{streets.length}</b><span>Streets</span></div>
              <div><b>{plazasOfMarket(id).length}</b><span>Plazas</span></div>
              <div><b>{shopList.length}</b><span>Shops</span></div>
              <div><b>{products.length}</b><span>Products</span></div>
            </div>
          </div>
          <div className="announce"><Megaphone size={16} /> <b>Market notice:</b> {market.announcement}</div>
        </div>
      </section>

      <div className="container section">
        <SectionHead title="Walk the market" sub="Tap a street or a plaza to step inside" />
        <MarketMap market={market} />
      </div>

      <div className="container section">
        <SectionHead title="Streets & lanes" />
        <div className="grid grid-2">
          {streets.map((s) => (
            <Link key={s.id} to={`/shop/street/${s.id}`} className="street-card">
              <Building2 size={22} />
              <div>
                <h4>{s.name}</h4>
                <p className="muted">{s.description}</p>
                <span className="small">{plural(plazasOfStreet(s.id).length, 'plaza', 'plazas')} · {plural(plazasOfStreet(s.id).reduce((n, p) => n + shopsOfPlaza(p.id).length, 0), 'shop')}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="container section">
        <SectionHead title="Top-rated vendors" />
        <div className="grid grid-4">{featured.map((s) => <ShopCard key={s.id} shop={s} mode="retail" />)}</div>
      </div>

      {popular.length > 0 && (
        <div className="container section">
          <SectionHead title={`Popular in ${market.short}`} action={<Link to={`/shop?market=${market.id}`} className="link-arrow">See all products</Link>} />
          <div className="grid grid-4">{popular.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </div>
      )}
    </>
  );
}

export function StreetPage() {
  const { id } = useParams();
  const street = streetById[id];
  if (!street) return <NotFound />;
  const market = marketById[street.marketId];
  const plazas = plazasOfStreet(id);

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Markets', to: '/shop/markets' }, { label: market.short, to: `/shop/market/${market.id}` }, { label: street.name }]} />

      <div className="street-tabs" role="tablist">
        {streetsOfMarket(market.id).map((s) => (
          <Link key={s.id} to={`/shop/street/${s.id}`} role="tab" aria-selected={s.id === id} className={s.id === id ? 'on' : ''}>{s.name}</Link>
        ))}
      </div>

      <div className="place-head" style={{ '--h': market.hue }}>
        <h1>{street.name}</h1>
        <p className="muted">{street.description} · {market.name}</p>
      </div>

      <div className="grid grid-2 plaza-grid">
        {plazas.map((p) => {
          const shopList = shopsOfPlaza(p.id);
          return (
            <Link key={p.id} to={`/shop/plaza/${p.id}`} className="plaza-card">
              <Visual emoji={shopList[0]?.emoji || '🏬'} hue={market.hue} ratio="16 / 6" className="plaza-art" />
              <div className="plaza-body">
                <h3>{p.name}</h3>
                <p className="muted">{p.description}</p>
                <div className="row gap wrap small">
                  <span className="pill pill-gray">{plural(p.floors, 'floor')}</span>
                  <span className="pill pill-gray">{plural(shopList.length, 'shop')}</span>
                  {[...new Set(shopList.map((s) => s.category))].slice(0, 2).map((c) => <span key={c} className="pill pill-blue">{c}</span>)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function PlazaPage() {
  const { id } = useParams();
  const plaza = plazaById[id];
  const [cat, setCat] = useState('');
  if (!plaza) return <NotFound />;
  const street = streetById[plaza.streetId];
  const market = marketById[street.marketId];
  const all = shopsOfPlaza(id);
  const categories = [...new Set(all.map((s) => s.category))];
  const list = cat ? all.filter((s) => s.category === cat) : all;

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Markets', to: '/shop/markets' }, { label: market.short, to: `/shop/market/${market.id}` }, { label: street.name, to: `/shop/street/${street.id}` }, { label: plaza.name }]} />

      <div className="place-head" style={{ '--h': market.hue }}>
        <h1>{plaza.name}</h1>
        <p className="muted">{plaza.description} · {plural(plaza.floors, 'floor')} · {street.name}, {market.short}</p>
      </div>

      <div className="chip-row">
        <button className={`chip-link ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>All vendors ({all.length})</button>
        {categories.map((c) => (
          <button key={c} className={`chip-link ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="grid grid-3 shop-grid">
        {list.map((s) => <ShopCard key={s.id} shop={s} mode="retail" />)}
      </div>
      <p className="muted small center mt">Tap a vendor to see everything they sell.</p>
    </div>
  );
}
