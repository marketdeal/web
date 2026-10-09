import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { RequireAuth, ShopLayout, VendorGate } from './components/layout';
import GuideWidget from './components/GuideWidget';
import { PwaNotices, TabBar } from './components/MobileShell';
import { EmptyState } from './components/ui';
import { Link } from 'react-router-dom';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import Dashboard from './pages/Dashboard';
import ProductManager from './pages/ProductManager';
import ProductForm from './pages/ProductForm';
import { BecomeMerchant, Login, Register } from './pages/Auth';
import MarketsIndex from './pages/MarketsIndex';
import { MarketPage as ConsumerMarketPage, PlazaPage as ConsumerPlazaPage, StreetPage as ConsumerStreetPage } from './pages/shop/Directory';
import VendorPage from './pages/shop/Vendor';
import B2BHome from './pages/b2b/Home';
import { MarketPage, PlazaPage, StreetPage } from './pages/b2b/Directory';
import MarketCommunity from './pages/b2b/Community';
import ShopPage from './pages/b2b/ShopPage';
import B2BProduct from './pages/b2b/Product';
import B2BSearch from './pages/b2b/Search';
import { MessageThread, MessagesInbox } from './pages/b2b/Messages';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const NotFound = () => (
  <div className="container">
    <EmptyState emoji="🧭" title="Page not found" text="That street isn’t on our map." action={<Link to="/" className="btn btn-primary">Back home</Link>} />
  </div>
);

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* B2C — open to everyone; checkout and orders need an account */}
        <Route element={<ShopLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="shop/markets" element={<MarketsIndex />} />
          <Route path="shop/market/:id" element={<ConsumerMarketPage />} />
          <Route path="shop/street/:id" element={<ConsumerStreetPage />} />
          <Route path="shop/plaza/:id" element={<ConsumerPlazaPage />} />
          <Route path="shop/vendor/:id" element={<VendorPage />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="orders" element={<RequireAuth><Orders scope="RETAIL" /></RequireAuth>} />
          <Route path="orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
          <Route path="become-merchant" element={<BecomeMerchant />} />
        </Route>

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* B2B — vendors only. Everyone else sees the "Verified Merchants Only" screen. */}
        <Route element={<VendorGate />}>
          <Route path="b2b" element={<B2BHome />} />
          <Route path="b2b/market/:id" element={<MarketPage />} />
          <Route path="b2b/market/:id/community" element={<MarketCommunity />} />
          <Route path="b2b/street/:id" element={<StreetPage />} />
          <Route path="b2b/plaza/:id" element={<PlazaPage />} />
          <Route path="b2b/shop/:id" element={<ShopPage />} />
          <Route path="b2b/product/:id" element={<B2BProduct />} />
          <Route path="b2b/search" element={<B2BSearch />} />
          <Route path="b2b/messages" element={<MessagesInbox />} />
          <Route path="b2b/messages/:shopId" element={<MessageThread />} />
          <Route path="vendor" element={<Dashboard />} />
          <Route path="vendor/products" element={<ProductManager />} />
          <Route path="vendor/products/new" element={<ProductForm />} />
          <Route path="vendor/products/:id/edit" element={<ProductForm />} />
        </Route>

        <Route element={<ShopLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <GuideWidget />
      <TabBar />
      <PwaNotices />
    </>
  );
}
