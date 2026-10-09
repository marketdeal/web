import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Breadcrumb, SectionHead, Visual } from '../components/ui';
import { markets, plazasOfMarket, shopsOfMarket, streetsOfMarket } from '../data/directory';

const openGuide = () => window.dispatchEvent(new Event('marketdeal:open-guide'));

/** Navigate Mode entry point for consumers — walk in via Market → Street → Plaza → Vendor,
 *  the same spatial hierarchy the wholesale side uses (PRD §4.1.1 / §4.1.4). */
export default function MarketsIndex() {
  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Markets' }]} />
      <SectionHead
        title="Walk into a market"
        sub="Every product on MarketDeal comes from a real shop in a real market. Pick a market, then walk down a street into a plaza to meet the vendor."
        action={<button className="btn btn-outline" onClick={openGuide}><Sparkles size={15} /> Ask the Market Guide instead</button>}
      />
      <div className="grid grid-3 market-grid section-tight">
        {markets.map((m) => (
          <Link key={m.id} to={`/shop/market/${m.id}`} className="market-card">
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
    </div>
  );
}
