import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../components/cards';
import { Breadcrumb, EmptyState } from '../components/ui';
import { b2cCategories, categoryById } from '../data/b2c';
import { locate, marketById, markets } from '../data/directory';
import { useStore } from '../context/StoreContext';
import { discountPct, naira } from '../lib/format';

const priceBands = [
  { id: 'u50', label: 'Under ₦50,000', min: 0, max: 50000 },
  { id: '50-200', label: '₦50,000 – ₦200,000', min: 50000, max: 200000 },
  { id: '200-600', label: '₦200,000 – ₦600,000', min: 200000, max: 600000 },
  { id: '600+', label: 'Over ₦600,000', min: 600000, max: Infinity },
];

const sorts = {
  relevance: 'Most popular',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  rating: 'Top rated',
  newest: 'Newest',
  discount: 'Biggest discount',
};

export default function Shop() {
  const { b2cCatalog } = useStore();
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const cat = params.get('cat') || '';
  const market = params.get('market') || '';
  const band = params.get('price') || '';
  const sort = params.get('sort') || 'relevance';
  const topRated = params.get('rated') === '1';

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const b = priceBands.find((x) => x.id === band);
    let list = b2cCatalog.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (market && locate(p.shopId).market.id !== market) return false;
      if (b && (p.price < b.min || p.price >= b.max)) return false;
      if (topRated && p.rating < 4.6) return false;
      if (terms.length) {
        const hay = `${p.name} ${p.brand} ${p.tags.join(' ')} ${categoryById[p.category].name} ${locate(p.shopId).shop.name} ${locate(p.shopId).market.name}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      }
      return true;
    });
    const by = {
      relevance: (a, c) => c.sold7d - a.sold7d,
      'price-asc': (a, c) => a.price - c.price,
      'price-desc': (a, c) => c.price - a.price,
      rating: (a, c) => c.rating - a.rating || c.reviews - a.reviews,
      newest: (a, c) => a.daysAgo - c.daysAgo,
      discount: (a, c) => discountPct(c.price, c.oldPrice) - discountPct(a.price, a.oldPrice),
    };
    return list.sort(by[sort] || by.relevance);
  }, [b2cCatalog, q, cat, market, band, sort, topRated]);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const active = [
    q && { key: 'q', label: `“${q}”` },
    cat && { key: 'cat', label: categoryById[cat]?.name },
    market && { key: 'market', label: marketById[market]?.short },
    band && { key: 'price', label: priceBands.find((b) => b.id === band)?.label },
    topRated && { key: 'rated', label: 'Top rated' },
  ].filter(Boolean);

  const title = q ? `Results for “${q}”` : cat ? categoryById[cat]?.name : market ? `From ${marketById[market]?.name}` : 'All products';

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: title }]} />
      <div className="catalog">
        {filtersOpen && <div className="filters-backdrop" onClick={() => setFiltersOpen(false)} />}
        <aside className={`filters${filtersOpen ? ' open' : ''}`} aria-label="Filters">
          <div className="filters-sheet-head">
            <strong>Filters</strong>
            <button className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={18} /></button>
          </div>
          <div className="filter-group">
            <h4><SlidersHorizontal size={15} /> Category</h4>
            <button className={!cat ? 'f-opt on' : 'f-opt'} onClick={() => set('cat', '')}>All categories</button>
            {b2cCategories.map((c) => (
              <button key={c.id} className={cat === c.id ? 'f-opt on' : 'f-opt'} onClick={() => set('cat', c.id)}>
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <h4>Market</h4>
            <button className={!market ? 'f-opt on' : 'f-opt'} onClick={() => set('market', '')}>Any market</button>
            {markets.map((m) => (
              <button key={m.id} className={market === m.id ? 'f-opt on' : 'f-opt'} onClick={() => set('market', m.id)}>
                {m.short}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <h4>Price</h4>
            {priceBands.map((b) => (
              <button key={b.id} className={band === b.id ? 'f-opt on' : 'f-opt'} onClick={() => set('price', band === b.id ? '' : b.id)}>
                {b.label}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <label className="check">
              <input type="checkbox" checked={topRated} onChange={(e) => set('rated', e.target.checked ? '1' : '')} />
              Rated 4.6★ and above
            </label>
          </div>
          <button className="btn btn-primary filters-done" onClick={() => setFiltersOpen(false)}>Show {results.length} {results.length === 1 ? 'product' : 'products'}</button>
        </aside>

        <section className="catalog-main">
          <div className="catalog-head">
            <div>
              <h1>{title}</h1>
              <p className="muted">{results.length} {results.length === 1 ? 'product' : 'products'}</p>
            </div>
            <button className="btn btn-outline btn-sm filter-toggle" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={15} /> Filters{active.length > 0 ? ` (${active.length})` : ''}
            </button>
            <label className="sort">
              Sort by
              <select value={sort} onChange={(e) => set('sort', e.target.value)}>
                {Object.entries(sorts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>

          {active.length > 0 && (
            <div className="active-filters">
              {active.map((a) => (
                <button key={a.key} className="chip-x" onClick={() => set(a.key, '')}>{a.label} <X size={13} /></button>
              ))}
              <Link to="/shop" className="link-plain small">Clear all</Link>
            </div>
          )}

          {results.length ? (
            <div className="grid grid-3">
              {results.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <EmptyState emoji="🔍" title="No products match" text="Try removing a filter or searching for something else." action={<Link to="/shop" className="btn btn-primary">Clear filters</Link>} />
          )}
        </section>
      </div>
    </div>
  );
}
