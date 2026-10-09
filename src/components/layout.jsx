import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Boxes, ChevronDown, ChevronLeft, ChevronRight, Heart, LayoutDashboard, LogOut, Lock, MessagesSquare, Package, Search, ShieldCheck, ShoppingCart, Store, User, Handshake,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { b2cCategories } from '../data/b2c';
import { locate, shopById } from '../data/directory';

export function Logo({ light = false }) {
  return (
    <Link to="/" className={`logo ${light ? 'logo-light' : ''}`} aria-label="MarketDeal home">
      <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={light ? '#E8600A' : '#14304F'} />
        <path d="M12 26 18 14h28l6 12v3a7 7 0 0 1-12 4.6A7 7 0 0 1 32 33a7 7 0 0 1-8-3.4A7 7 0 0 1 12 29z" fill={light ? '#fff' : '#E8600A'} />
        <rect x="16" y="35" width="32" height="15" rx="2" fill={light ? '#14304F' : '#fff'} />
        <rect x="28" y="40" width="8" height="10" fill={light ? '#E8600A' : '#14304F'} />
      </svg>
      <span>Market<b>Deal</b></span>
    </Link>
  );
}

/** Vendors only: flip between the retail shop and the wholesale community. */
export function ModeSwitch({ active }) {
  return (
    <div className="mode-switch" role="tablist" aria-label="Marketplace">
      <Link to="/" role="tab" aria-selected={active === 'b2c'} className={active === 'b2c' ? 'on' : ''}>
        <ShoppingCart size={15} /> Shop
      </Link>
      <Link to="/b2b" role="tab" aria-selected={active === 'b2b'} className={active === 'b2b' ? 'on' : ''}>
        <Handshake size={15} /> Wholesale
      </Link>
    </div>
  );
}

function SearchBar({ to, placeholder }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState(pathname === to ? params.get('q') || '' : '');
  return (
    <form
      className="searchbar"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`${to}?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search size={18} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search" />
      <button type="submit" className="btn btn-primary btn-sm">Search</button>
    </form>
  );
}

function AccountMenu() {
  const { user, isVendor, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!user) {
    return (
      <div className="auth-links">
        <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
        <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
      </div>
    );
  }

  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  const item = (to, icon, label) => (
    <Link to={to} className="menu-item" onClick={() => setOpen(false)}>{icon} {label}</Link>
  );

  return (
    <div className="account" ref={ref}>
      <button className="account-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="avatar">{initials}</span>
        <span className="account-name">{user.name.split(' ')[0]}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="menu">
          <div className="menu-head">
            <strong>{user.name}</strong>
            <span className="muted small">{user.email}</span>
            <span className={`pill ${isVendor ? 'pill-orange' : 'pill-gray'}`}>
              {isVendor ? `Business · ${user.business.name}` : 'Buyer account'}
            </span>
          </div>
          {isVendor && item('/vendor', <LayoutDashboard size={16} />, 'Merchant dashboard')}
          {isVendor && item('/vendor/products', <Boxes size={16} />, 'Product Manager')}
          {item('/orders', <Package size={16} />, 'My orders')}
          {item('/wishlist', <Heart size={16} />, 'Wishlist')}
          {isVendor && item('/b2b/messages', <MessagesSquare size={16} />, 'Merchant messages')}
          {!isVendor && item('/become-merchant', <Store size={16} />, 'Become a merchant')}
          <button
            className="menu-item danger"
            onClick={() => {
              logout();
              setOpen(false);
              navigate('/');
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Footer({ b2b = false }) {
  return (
    <footer className={`site-footer ${b2b ? 'footer-b2b' : ''}`}>
      <div className="container footer-grid">
        <div>
          <Logo light />
          <p>Africa’s digital market infrastructure. Walk into Computer Village, Alaba, Trade Fair, Ariaria and Onitsha — from anywhere.</p>
        </div>
        <div>
          <h5>Marketplace</h5>
          <Link to="/shop">Shop all products</Link>
          <Link to="/become-merchant">Sell on MarketDeal</Link>
          <Link to="/b2b">Wholesale community</Link>
        </div>
        <div>
          <h5>Trust</h5>
          <span><ShieldCheck size={14} /> Escrow-protected payments</span>
          <span><ShieldCheck size={14} /> Email · CAC · shop-visit verified merchants</span>
          <span><ShieldCheck size={14} /> Dispute mediation</span>
        </div>
      </div>
      <div className="container footer-note">Prototype for demonstration · All products, shops and prices are sample data · Payments are simulated</div>
    </footer>
  );
}

/** The category row has more pills than fit on most screens, so it scrolls horizontally within
 *  itself rather than breaking the page layout (see .cat-nav's overflow-x in index.css) — but a
 *  plain overflow with no visual cue just looks like the row is cut off. This adds an edge fade and
 *  click-to-scroll arrows that only appear when there's actually more content in that direction. */
function CategoryNav() {
  const scrollerRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const scrollBy = (dir) => scrollerRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });

  return (
    <nav className={`cat-nav ${atStart ? 'at-start' : ''} ${atEnd ? 'at-end' : ''}`} aria-label="Categories">
      {!atStart && (
        <button type="button" className="cat-nav-arrow left" onClick={() => scrollBy(-1)} aria-label="Scroll categories left">
          <ChevronLeft size={16} />
        </button>
      )}
      <div className="container" ref={scrollerRef} onScroll={update}>
        <NavLink to="/shop/markets" className="cat-nav-markets"><Store size={14} /> Markets</NavLink>
        <NavLink to="/shop" end>All products</NavLink>
        {b2cCategories.map((c) => (
          <Link key={c.id} to={`/shop?cat=${c.id}`}>{c.emoji} {c.name}</Link>
        ))}
      </div>
      {!atEnd && (
        <button type="button" className="cat-nav-arrow right" onClick={() => scrollBy(1)} aria-label="Scroll categories right">
          <ChevronRight size={16} />
        </button>
      )}
    </nav>
  );
}

export function ShopLayout({ children }) {
  const { cartCount, wishlist } = useStore();
  const { isVendor } = useAuth();

  return (
    <div className="app shop-theme">
      <div className="promo-strip">
        <div className="container">
          <span><ShieldCheck size={14} /> Every order is escrow-protected — you only pay the merchant when you confirm delivery</span>
          {isVendor ? (
            <Link to="/b2b">Switch to the Wholesale community →</Link>
          ) : (
            <Link to="/become-merchant">Own a shop? Sell on MarketDeal →</Link>
          )}
        </div>
      </div>
      <header className="site-header">
        <div className="container header-main">
          <Logo />
          {isVendor && <ModeSwitch active="b2c" />}
          <SearchBar to="/shop" placeholder="Search phones, laptops, fabrics, tyres…" />
          <div className="header-actions">
            <Link to="/wishlist" className="ha" aria-label="Wishlist">
              <Heart size={20} />
              {wishlist.length > 0 && <i className="count">{wishlist.length}</i>}
            </Link>
            <Link to="/cart" className="ha" aria-label="Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && <i className="count">{cartCount}</i>}
            </Link>
            <AccountMenu />
          </div>
        </div>
        <CategoryNav />
      </header>
      <main className="page">{children ?? <Outlet />}</main>
      <Footer />
    </div>
  );
}

export function B2BLayout() {
  const { dealUnread } = useStore();
  const { user } = useAuth();
  const myShopId = user?.business?.shopId;
  const myMarketId = myShopId && shopById[myShopId] ? locate(myShopId).market.id : null;

  return (
    <div className="app b2b-theme">
      <header className="b2b-header">
        <div className="container b2b-main">
          <div className="b2b-brand">
            <Logo light />
            <span className="pill pill-orange">Wholesale</span>
          </div>
          <nav className="b2b-nav">
            <NavLink to="/b2b" end>Markets</NavLink>
            {myMarketId && <NavLink to={`/b2b/market/${myMarketId}/community`}>Community</NavLink>}
            <NavLink to="/b2b/messages">Messages {dealUnread > 0 && <i className="count">{dealUnread}</i>}</NavLink>
            <NavLink to="/vendor/products">Products</NavLink>
            <NavLink to="/vendor">Dashboard</NavLink>
          </nav>
          <SearchBar to="/b2b/search" placeholder="Search wholesale products, shops, streets…" />
          <ModeSwitch active="b2b" />
          <AccountMenu />
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <Footer b2b />
    </div>
  );
}

// ---- access control -----------------------------------------------------------

export function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth();
  const { pathname, search } = useLocation();
  if (!isLoggedIn) return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />;
  return children;
}

function MerchantsOnly() {
  const { isLoggedIn } = useAuth();
  return (
    <div className="container narrow gate">
      <div className="gate-icon"><Lock size={30} /></div>
      <h1>Verified Merchants Only</h1>
      <p className="lead">
        The Wholesale community — markets, streets, plazas, bulk pricing and direct merchant-to-merchant deals — is reserved for verified
        business owners. {isLoggedIn ? 'Your account is a buyer account.' : 'Sign in with a business account to continue.'}
      </p>
      <div className="gate-actions">
        {isLoggedIn ? (
          <Link to="/become-merchant" className="btn btn-primary btn-lg">Apply for merchant verification</Link>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary btn-lg">Sign in</Link>
            <Link to="/register?type=vendor" className="btn btn-outline btn-lg">Register a business</Link>
          </>
        )}
        <Link to="/" className="btn btn-ghost btn-lg">Back to shop</Link>
      </div>
    </div>
  );
}

/** Wholesale (B2B) and merchant routes: vendors get the B2B shell, everyone else the "Merchants only" screen. */
export function VendorGate() {
  const { isVendor } = useAuth();
  if (!isVendor) {
    return (
      <ShopLayout>
        <MerchantsOnly />
      </ShopLayout>
    );
  }
  return <B2BLayout />;
}
