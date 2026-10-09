import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShopCard, WholesaleCard } from '../../components/cards';
import { Breadcrumb, EmptyState, SectionHead } from '../../components/ui';
import { b2bCategories, b2bCategoryById } from '../../data/b2b';
import { locate, marketById, markets, shops } from '../../data/directory';
import { useStore } from '../../context/StoreContext';

/** Search mode: every result is anchored to its spatial location (market › street › plaza › shop). */
export default function B2BSearch() {
  const { b2bCatalog } = useStore();
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const cat = params.get('cat') || '';
  const market = params.get('market') || '';

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const { products, shopHits } = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const products = b2bCatalog.filter((p) => {
      const l = locate(p.shopId);
      if (cat && p.category !== cat) return false;
      if (market && l.market.id !== market) return false;
      if (!terms.length) return true;
      const hay = `${p.name} ${p.brand} ${p.tags.join(' ')} ${l.shop.name} ${l.plaza.name} ${l.street.name} ${l.market.name}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
    const shopHits = terms.length
      ? shops.filter((s) => {
          const l = locate(s.id);
          if (market && l.market.id !== market) return false;
          const hay = `${s.name} ${s.category} ${l.plaza.name} ${l.street.name} ${l.market.name}`.toLowerCase();
          return terms.every((t) => hay.includes(t));
        })
      : [];
    return { products, shopHits };
  }, [b2bCatalog, q, cat, market]);

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Markets', to: '/b2b' }, { label: 'Search' }]} />
      <div className="catalog-head">
        <div>
          <h1>{q ? `Results for “${q}”` : cat ? b2bCategoryById[cat].name : 'All wholesale listings'}</h1>
          <p className="muted">{products.length} wholesale listings{shopHits.length ? ` · ${shopHits.length} shops` : ''}</p>
        </div>
      </div>

      <div className="chip-row">
        <button className={`chip-link ${!cat ? 'on' : ''}`} onClick={() => set('cat', '')}>All categories</button>
        {b2bCategories.map((c) => <button key={c.id} className={`chip-link ${cat === c.id ? 'on' : ''}`} onClick={() => set('cat', c.id)}>{c.emoji} {c.name}</button>)}
      </div>
      <div className="chip-row">
        <button className={`chip-link ${!market ? 'on' : ''}`} onClick={() => set('market', '')}>Any market</button>
        {markets.map((m) => <button key={m.id} className={`chip-link ${market === m.id ? 'on' : ''}`} onClick={() => set('market', m.id)}>{marketById[m.id].short}</button>)}
      </div>

      {shopHits.length > 0 && (
        <section className="section-tight">
          <SectionHead title="Shops" />
          <div className="grid grid-3">{shopHits.slice(0, 6).map((s) => <ShopCard key={s.id} shop={s} />)}</div>
        </section>
      )}

      <section className="section-tight">
        {shopHits.length > 0 && <SectionHead title="Products" />}
        {products.length ? (
          <div className="grid grid-4">{products.map((p) => <WholesaleCard key={p.id} product={p} />)}</div>
        ) : (
          <EmptyState emoji="🔍" title="No wholesale listings match" text="Try a broader search or clear the filters." action={<Link to="/b2b/search" className="btn btn-primary">Clear filters</Link>} />
        )}
      </section>
    </div>
  );
}
