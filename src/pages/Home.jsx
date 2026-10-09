import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Handshake, MapPin, ShieldCheck, Sparkles, Store, Truck } from 'lucide-react';
import { ProductCard } from '../components/cards';
import { SectionHead, Visual } from '../components/ui';
import { b2cCategories, b2cProducts } from '../data/b2c';
import { locate, markets } from '../data/directory';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { discountPct, naira } from '../lib/format';

const openGuide = () => window.dispatchEvent(new Event('marketdeal:open-guide'));

export default function Home() {
  const { isVendor } = useAuth();
  const { b2cCatalog } = useStore();

  // The curated sections below (deals, trending, fresh, hero) draw from the fixed sample
  // catalogue by design; category counts include merchant-submitted listings too.
  const deals = [...b2cProducts]
    .filter((p) => p.oldPrice)
    .sort((a, b) => discountPct(b.price, b.oldPrice) - discountPct(a.price, a.oldPrice))
    .slice(0, 5);
  const trending = [...b2cProducts].sort((a, b) => b.sold7d - a.sold7d).slice(0, 10);
  const fresh = [...b2cProducts].sort((a, b) => a.daysAgo - b.daysAgo).slice(0, 5);
  const heroSlides = [
    {
      eyebrow: 'Escrow-protected marketplace',
      icon: ShieldCheck,
      title: 'Genuine goods from Africa’s biggest markets.',
      em: 'Delivered to your door.',
      lead: 'Shop real products from verified merchants in Computer Village, Alaba, Trade Fair, Ariaria and Onitsha — and see exactly which shop you’re buying from.',
      primary: { label: 'Start shopping', to: '/shop' },
      productIds: ['p-02', 'p-11', 'p-22'],
    },
    {
      eyebrow: 'Dealer-to-dealer wholesale',
      icon: Handshake,
      title: 'Buy in bulk.',
      em: 'Sell to the whole country.',
      lead: 'Verified merchants unlock the wholesale community — compare bulk prices, request quotations, and settle every order through escrow.',
      primary: isVendor ? { label: 'Enter Wholesale', to: '/b2b' } : { label: 'Become a merchant', to: '/become-merchant' },
      productIds: ['p-14', 'p-19', 'p-17'],
    },
    {
      eyebrow: '5 markets, one app',
      icon: MapPin,
      title: 'Walk into Computer Village, Alaba, Trade Fair —',
      em: 'from anywhere.',
      lead: 'Every product comes from a real shop in a real market. Browse by market, street and plaza, just like walking the aisles yourself.',
      primary: { label: 'See all markets', to: '/shop/markets' },
      productIds: ['p-05', 'p-09', 'p-20'],
    },
  ].map((s) => ({ ...s, products: s.productIds.map((id) => b2cProducts.find((p) => p.id === id)) }));

  return (
    <>
      <HeroCarousel slides={heroSlides} onAskGuide={openGuide} />

      <section className="container section">
        <SectionHead title="Shop by category" />
        <div className="cat-grid">
          {b2cCategories.map((c) => (
            <Link key={c.id} to={`/shop?cat=${c.id}`} className="cat-tile" style={{ '--h': c.hue }}>
              <span className="cat-emoji">{c.emoji}</span>
              <b>{c.name}</b>
              <small>{b2cCatalog.filter((p) => p.category === c.id).length} products</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <SectionHead title="Hot deals" sub="Limited-time prices from verified merchants" action={<Link to="/shop?sort=discount" className="link-arrow">See all deals <ArrowRight size={15} /></Link>} />
        <div className="grid grid-5">
          {deals.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="container section">
        <SectionHead title="Trending this week" sub="Most purchased across all markets in the last 7 days" action={<Link to="/shop" className="link-arrow">Browse all <ArrowRight size={15} /></Link>} />
        <div className="grid grid-5">
          {trending.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="market-band">
        <div className="container">
          <SectionHead
            title="Walk into a market"
            sub="Every product on MarketDeal comes from a real shop in a real market — market, street, plaza, vendor."
            action={<Link to="/shop/markets" className="link-arrow">See all markets <ArrowRight size={15} /></Link>}
          />
          <div className="market-chips">
            {markets.map((m) => (
              <Link key={m.id} to={`/shop/market/${m.id}`} className="market-chip" style={{ '--h': m.hue }}>
                <span className="mc-emoji">{m.emoji}</span>
                <div>
                  <b>{m.name}</b>
                  <small>{m.city}, {m.state}</small>
                  <em>{m.focus}</em>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="guide-banner">
          <div className="guide-banner-icon"><Sparkles size={28} /></div>
          <div>
            <h3>Not sure where to find it? Ask the AI Market Guide.</h3>
            <p>“Where can I buy original Samsung phones in Computer Village?” — get the exact street, plaza and shop in seconds.</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={openGuide}>Try the Guide</button>
        </div>
      </section>

      <section className="container section">
        <SectionHead title="New arrivals" sub="Fresh listings from the last few days" />
        <div className="grid grid-5">
          {fresh.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="container section">
        <div className="merchant-banner">
          <div>
            <span className="eyebrow eyebrow-light"><Store size={14} /> For market traders</span>
            <h3>{isVendor ? 'Explore the Wholesale community' : 'Own a shop in a market? Sell to the whole country.'}</h3>
            <p>
              {isVendor
                ? 'Walk through markets, streets and plazas, compare bulk prices and request quotations from other verified dealers.'
                : 'Get verified, list your products and unlock the dealer-to-dealer wholesale community with bulk pricing and direct merchant-to-merchant deals.'}
            </p>
          </div>
          <Link to={isVendor ? '/b2b' : '/become-merchant'} className="btn btn-primary btn-lg">
            {isVendor ? 'Enter wholesale' : 'Become a merchant'} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}

/** Auto-rotating hero — pauses on hover, and a click on a dot/arrow doesn't fight the timer since
 *  each tick just advances by one from wherever `active` currently is. Content crossfades in via
 *  `.hero-fade` (remounted per slide with a `key`, same slide-up keyframe used elsewhere in the app). */
function HeroCarousel({ slides, onAskGuide }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[active];
  const Icon = slide.icon;
  const go = (i) => setActive((i + slides.length) % slides.length);

  // Self-scheduling rather than a plain setInterval, so a manual dot/arrow click resets the clock —
  // otherwise a stray auto-advance could yank the slide again a moment after someone just picked one.
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % slides.length), 6000);
    return () => clearTimeout(t);
  }, [paused, active, slides.length]);

  return (
    <section className="hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <button type="button" className="hero-arrow prev" onClick={() => go(active - 1)} aria-label="Previous slide"><ChevronLeft size={20} /></button>
      <button type="button" className="hero-arrow next" onClick={() => go(active + 1)} aria-label="Next slide"><ChevronRight size={20} /></button>

      <div className="container hero-grid">
        <div className="hero-copy hero-fade" key={`copy-${active}`}>
          <span className="eyebrow"><Icon size={14} /> {slide.eyebrow}</span>
          <h1>{slide.title} <em>{slide.em}</em></h1>
          <p className="lead">{slide.lead}</p>
          <div className="hero-cta">
            <Link to={slide.primary.to} className="btn btn-primary btn-lg">{slide.primary.label} <ArrowRight size={18} /></Link>
            <button className="btn btn-light btn-lg" onClick={onAskGuide}><Sparkles size={18} /> Ask the Market Guide</button>
          </div>
          <ul className="hero-points">
            <li><BadgeCheck size={16} /> Email, CAC & shop-visit verified merchants</li>
            <li><ShieldCheck size={16} /> Pay safely — release funds on delivery</li>
            <li><Truck size={16} /> Tracked delivery nationwide</li>
          </ul>
        </div>
        <div className="hero-art hero-fade" aria-hidden="true" key={`art-${active}`}>
          {slide.products.map((p, i) => (
            <Link key={p.id} to={`/product/${p.id}`} className={`hero-card hc-${i}`}>
              <Visual emoji={p.emoji} hue={p.hue} ratio="4 / 3" />
              <div>
                <b>{p.name}</b>
                <span><MapPin size={11} /> {locate(p.shopId).market.short}</span>
                <strong>{naira(p.price)}</strong>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="hero-dots">
        {slides.map((_, i) => (
          <button key={i} type="button" className={i === active ? 'on' : ''} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} />
        ))}
      </div>
    </section>
  );
}
