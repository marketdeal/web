import { Link } from 'react-router-dom';
import { ProductCard } from '../components/cards';
import { Breadcrumb, EmptyState } from '../components/ui';
import { useStore } from '../context/StoreContext';

export default function Wishlist() {
  const { wishlist, b2cCatalog } = useStore();
  const items = b2cCatalog.filter((p) => wishlist.includes(p.id));
  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]} />
      <h1 className="page-title">Your wishlist</h1>
      {items.length ? (
        <div className="grid grid-4">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <EmptyState emoji="💛" title="Nothing saved yet" text="Tap the heart on any product to save it here." action={<Link to="/shop" className="btn btn-primary">Browse products</Link>} />
      )}
    </div>
  );
}
