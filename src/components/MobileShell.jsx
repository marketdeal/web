import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Boxes, Download, Grid2x2, Handshake, Heart, Home, LayoutDashboard, LogOut, MessagesSquare, Package, RefreshCw, Share, ShoppingCart, Store, User, WifiOff, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useAppUpdate, useInstall, useOnline } from '../lib/pwa';

const HIDDEN_ON = ['/login', '/register'];
const DISMISS_KEY = 'marketdeal:installDismissed';

const readDismissed = () => {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < 7 * 864e5; } catch { return false; }
};

function Tab({ to, icon: Icon, label, count, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `tab${isActive ? ' on' : ''}`}>
      <span className="tab-icon"><Icon size={22} />{count > 0 && <i className="count">{count}</i>}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function AccountSheet({ onClose }) {
  const { user, isVendor, isLoggedIn, logout } = useAuth();
  const { installed, canInstall, needsIosSteps, install } = useInstall();
  const navigate = useNavigate();
  const go = (to) => () => { onClose(); navigate(to); };
  const row = (to, Icon, label) => (
    <button className="sheet-row" onClick={go(to)}><Icon size={18} /> {label}</button>
  );

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Account" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" />
        {isLoggedIn ? (
          <div className="sheet-head">
            <span className="avatar">{user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
            <div>
              <strong>{user.name}</strong>
              <span className="muted small">{user.email}</span>
            </div>
            <span className={`pill ${isVendor ? 'pill-orange' : 'pill-gray'}`}>{isVendor ? 'Merchant' : 'Buyer'}</span>
          </div>
        ) : (
          <div className="sheet-head col">
            <strong>Welcome to MarketDeal</strong>
            <span className="muted small">Sign in to track orders and pay through escrow.</span>
            <div className="row-actions">
              <button className="btn btn-primary" onClick={go('/login')}>Sign in</button>
              <button className="btn btn-outline" onClick={go('/register')}>Create account</button>
            </div>
          </div>
        )}
        <div className="sheet-list">
          {isLoggedIn && row('/orders', Package, 'My orders')}
          {row('/wishlist', Heart, 'Wishlist')}
          {isVendor && row('/vendor', LayoutDashboard, 'Merchant dashboard')}
          {isVendor && row('/vendor/products', Boxes, 'Product manager')}
          {isVendor && row('/b2b', Handshake, 'Wholesale community')}
          {isVendor && row('/b2b/messages', MessagesSquare, 'Merchant messages')}
          {isLoggedIn && !isVendor && row('/become-merchant', Store, 'Become a merchant')}
          {!installed && canInstall && (
            <button className="sheet-row" onClick={async () => { await install(); onClose(); }}><Download size={18} /> Install the app</button>
          )}
          {needsIosSteps && (
            <p className="sheet-note"><Share size={14} /> To install: tap <b>Share</b>, then <b>Add to Home Screen</b>.</p>
          )}
          {isLoggedIn && (
            <button className="sheet-row danger" onClick={() => { logout(); onClose(); navigate('/'); }}><LogOut size={18} /> Sign out</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function TabBar() {
  const { pathname } = useLocation();
  const { isVendor, isLoggedIn } = useAuth();
  const { cartCount, dealUnread } = useStore();
  const [sheet, setSheet] = useState(false);

  useEffect(() => { setSheet(false); }, [pathname]);
  if (HIDDEN_ON.includes(pathname)) return null;

  const merchantArea = isVendor && (pathname.startsWith('/b2b') || pathname.startsWith('/vendor'));

  return (
    <>
      <nav className="tabbar" aria-label="Main">
        {merchantArea ? (
          <>
            <Tab to="/b2b" end icon={Store} label="Markets" />
            <Tab to="/b2b/messages" icon={MessagesSquare} label="Messages" count={dealUnread} />
            <Tab to="/vendor/products" icon={Boxes} label="Products" />
            <Tab to="/vendor" end icon={LayoutDashboard} label="Dashboard" />
          </>
        ) : (
          <>
            <Tab to="/" end icon={Home} label="Home" />
            <Tab to="/shop" icon={Grid2x2} label="Shop" />
            <Tab to="/cart" icon={ShoppingCart} label="Cart" count={cartCount} />
            <Tab to={isLoggedIn ? '/orders' : '/login'} icon={Package} label="Orders" />
            <button className={`tab${sheet ? ' on' : ''}`} onClick={() => setSheet(true)} aria-haspopup="dialog">
              <span className="tab-icon"><User size={22} /></span>
              <span>{isLoggedIn ? 'Account' : 'Sign in'}</span>
            </button>
          </>
        )}
        {merchantArea && (
          <button className="tab tab-more" onClick={() => setSheet(true)} aria-label="Account menu"><User size={20} /></button>
        )}
      </nav>
      {sheet && <AccountSheet onClose={() => setSheet(false)} />}
    </>
  );
}

/** Offline notice, "install the app" nudge and "new version" prompt. */
export function PwaNotices() {
  const online = useOnline();
  const { installed, canInstall, needsIosSteps, install } = useInstall();
  const { needRefresh, update } = useAppUpdate();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(readDismissed);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
    setDismissed(true);
  };
  const showInstall = !installed && !dismissed && (canInstall || needsIosSteps) && !HIDDEN_ON.includes(pathname);

  return (
    <>
      {!online && <div className="offline-bar" role="status"><WifiOff size={14} /> You’re offline — showing what’s saved on this phone.</div>}
      {needRefresh && (
        <div className="pwa-toast" role="status">
          <RefreshCw size={16} /> A new version is ready.
          <button className="btn btn-primary btn-sm" onClick={update}>Update</button>
        </div>
      )}
      {showInstall && !needRefresh && (
        <div className="install-banner" role="region" aria-label="Install the app">
          <img src="/icons/icon-192.png" alt="" width="40" height="40" />
          <div className="grow">
            <strong>Get the MarketDeal app</strong>
            <span className="small">
              {canInstall ? 'Faster, full-screen, and works offline.' : <>Tap <Share size={12} /> then <b>Add to Home Screen</b>.</>}
            </span>
          </div>
          {canInstall && <button className="btn btn-primary btn-sm" onClick={async () => { if (await install()) dismiss(); }}>Install</button>}
          <button className="icon-btn" onClick={dismiss} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}
    </>
  );
}
