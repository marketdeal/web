import { Link } from 'react-router-dom';
import { ArrowRight, Handshake, Layers, MessageSquareText, Store } from 'lucide-react';
import { WholesaleCard } from '../../components/cards';
import { SectionHead, StatusChip, Visual } from '../../components/ui';
import { b2bCategories, b2bProducts } from '../../data/b2b';
import { communityPosts, announcementKinds } from '../../data/community';
import { locate, marketById, markets, plazasOfMarket, shopById, shops, shopsOfMarket, streetsOfMarket } from '../../data/directory';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';

export default function B2BHome() {
  const { user } = useAuth();
  const { b2bCatalog } = useStore();
  const featured = [...b2bProducts].sort((a, b) => b.stock - a.stock).filter((_, i) => i % 3 === 0).slice(0, 8);
  const myShopId = user.business?.shopId;
  const myMarketId = myShopId && shopById[myShopId] ? locate(myShopId).market.id : null;

  return (
    <>
      <section className="b2b-hero">
        <div className="container b2b-hero-grid">
          <div>
            <span className="eyebrow eyebrow-light"><Handshake size={14} /> Dealer-to-dealer community</span>
            <h1>Walk the markets. <em>Trade at wholesale.</em></h1>
            <p className="lead">
              Welcome back, {user.business?.name || user.name}. Step into a market, walk down a street, enter a plaza and
              meet the dealers — then message them directly to negotiate and close bulk deals between yourselves.
            </p>
            <div className="hero-cta">
              <Link to="/b2b/search" className="btn btn-primary btn-lg">Browse all wholesale listings <ArrowRight size={18} /></Link>
              <Link to="/b2b/messages" className="btn btn-light btn-lg">My messages</Link>
            </div>
          </div>
          <div className="b2b-stats">
            <div><b>{markets.length}</b><span>Markets</span></div>
            <div><b>{shops.length}</b><span>Verified shops</span></div>
            <div><b>{b2bCatalog.length}</b><span>Bulk listings</span></div>
            <div><b>0.5%</b><span>Escrow fee, capped ₦5,000</span></div>
          </div>
        </div>
      </section>

      <section className="container section">
        <SectionHead title="Choose a market to walk into" sub="Market → Street → Plaza → Shop. Every dealer sits where they sit in the real market." />
        <div className="grid grid-3 market-grid">
          {markets.map((m) => (
            <Link key={m.id} to={`/b2b/market/${m.id}`} className="market-card">
              <Visual emoji={m.emoji} hue={m.hue} ratio="16 / 8" className="market-card-art" />
              <div className="market-card-body">
                <h3>{m.name}</h3>
                <span className="muted small">{m.city}, {m.state}</span>
                <p>{m.tagline}</p>
                <div className="market-card-stats">
                  <span><b>{streetsOfMarket(m.id).length}</b> streets</span>
                  <span><b>{plazasOfMarket(m.id).length}</b> plazas</span>
                  <span><b>{shopsOfMarket(m.id).length}</b> shops</span>
                </div>
                <em>{m.focus}</em>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <SectionHead title="Browse by category" />
        <div className="chip-row">
          {b2bCategories.map((c) => (
            <Link key={c.id} to={`/b2b/search?cat=${c.id}`} className="chip-link">{c.emoji} {c.name}</Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <SectionHead title="Featured bulk deals" sub="Tiered pricing — the more you buy, the less you pay" action={<Link to="/b2b/search" className="link-arrow">View all 30 listings <ArrowRight size={15} /></Link>} />
        <div className="grid grid-4">
          {featured.map((p) => <WholesaleCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="container section">
        <SectionHead
          title="Community board"
          sub="What dealers across the markets are asking for and offering right now"
          action={myMarketId && <Link to={`/b2b/market/${myMarketId}/community`} className="link-arrow">Visit my market's community <ArrowRight size={15} /></Link>}
        />
        <div className="board">
          {communityPosts.map((post) => {
            const kind = announcementKinds[post.kind];
            return (
              <article key={post.id} className="card post">
                <div className="row-between">
                  <StatusChip tone={kind.tone}>{kind.label}</StatusChip>
                  <span className="muted small">{post.ago}</span>
                </div>
                <p>{post.text}</p>
                <div className="post-foot">
                  <div>
                    <b>{post.who}</b>
                    <span className="muted small">{post.role}</span>
                  </div>
                  <Link to={`/b2b/market/${post.marketId}/community`} className="loc-badge"><Store size={12} /> {marketById[post.marketId].short}</Link>
                </div>
                <span className="muted small"><MessageSquareText size={13} /> {post.replies} dealers replied</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container section">
        <div className="merchant-banner navy">
          <div>
            <span className="eyebrow eyebrow-light"><Layers size={14} /> How it works</span>
            <h3>Find a dealer → message → agree → trade</h3>
            <p>Wholesale on MarketDeal connects merchants to merchants. Tap Message on any listing, shop or community post, then agree price, payment and delivery directly with the other dealer.</p>
          </div>
          <Link to="/b2b/search" className="btn btn-primary btn-lg">Find a supplier</Link>
        </div>
      </section>
    </>
  );
}
