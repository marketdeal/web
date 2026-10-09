import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { readStorage, usePersistentState } from '../lib/storage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { b2cProducts } from '../data/b2c';
import { b2bProducts } from '../data/b2b';
import { locate, marketById, shopById, shopsOfMarket } from '../data/directory';
import { seedMarketPosts, REPLY_POOL } from '../data/marketCommunity';
import { cartKey, groupCart, priceGroups } from '../lib/cart';
import { AUTO_RELEASE_MS, EXTEND_MS, couriers } from '../lib/escrow';
import { uid } from '../lib/format';
import { DEAL_REPLY_DELAY_MS, dealReply } from '../lib/deals';
import { toRetailShape, toWholesaleShape } from '../lib/vendorProducts';

const StoreContext = createContext(null);

const newOrderId = () => 'MD-' + Math.floor(100000 + Math.random() * 900000);
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Admin review is simulated: a submitted product auto-approves after this delay if nobody clicks
// the demo "Simulate: admin approves" control first — mirrors the 72h escrow auto-release pattern.
const APPROVE_DELAY_MS = 25000;

// A market-community post/comment gets one simulated reply from another member of that market
// after this delay, so the board feels alive during a demo without needing a real backend.
const COMMUNITY_REPLY_DELAY_MS = 7000;

// A post/comment/reply attachment: photos are stored inline, videos by their IndexedDB id (lib/media.js).
const mediaFields = (media) => ({
  image: media?.kind === 'image' ? media.src : null,
  video: media?.kind === 'video' ? media.id : null,
});

const OUTCOME_COPY = {
  REFUNDED: 'refunded to you in full',
  RELEASED: 'released to the merchant',
  PARTIAL_REFUND: 'split between you and the merchant',
};

export function StoreProvider({ children }) {
  const toast = useToast();
  const { user, shopOverrides, marketOverrides } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [cart, setCart] = usePersistentState('cart', []);
  const [wishlist, setWishlist] = usePersistentState('wishlist', []);
  // `onExternal` handlers: the MarketDeal Admin platform (another window) changed these records —
  // tell the person it affects, since nothing they did locally triggered it.
  const [orders, setOrders] = usePersistentState('orders', [], {
    onExternal: (prev, next) => {
      const me = userRef.current?.id;
      next.forEach((o) => {
        const before = prev.find((x) => x.id === o.id);
        if (o.buyerId !== me || !before || before.escrow.state === o.escrow.state) return;
        if (before.escrow.state === 'DISPUTED' && OUTCOME_COPY[o.escrow.state]) {
          toast(`Dispute on ${o.id} resolved — funds ${OUTCOME_COPY[o.escrow.state]}`, { kind: 'info', duration: 6000 });
        }
      });
    },
  });
  const [dealChats, setDealChats] = usePersistentState('dealChats', []);
  const [myProducts, setMyProducts] = usePersistentState('myProducts', [], {
    onExternal: (prev, next) => {
      const me = userRef.current?.id;
      next.forEach((p) => {
        const before = prev.find((x) => x.id === p.id);
        if (p.ownerId !== me || !before || before.status === p.status) return;
        if (p.status === 'APPROVED') toast(`“${p.name}” was approved by MarketDeal and is now live`, { duration: 6000 });
        if (p.status === 'REJECTED') toast(`“${p.name}” was not approved: ${p.rejectReason || 'see Product Manager'}`, { kind: 'info', duration: 7000 });
      });
    },
  });
  const [marketPosts, setMarketPosts] = usePersistentState('marketPosts', seedMarketPosts);

  // ---- cart -----------------------------------------------------------------
  const addToCart = useCallback(
    (productId, qty = 1, variant = null) =>
      setCart((prev) => {
        const key = cartKey(productId, variant);
        const existing = prev.find((l) => l.key === key);
        if (existing) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, 99) } : l));
        return [...prev, { key, productId, variant, qty }];
      }),
    [setCart],
  );
  const updateQty = useCallback(
    (key, qty) =>
      setCart((prev) =>
        qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 99) } : l)),
      ),
    [setCart],
  );
  const removeFromCart = useCallback((key) => setCart((prev) => prev.filter((l) => l.key !== key)), [setCart]);
  const cartCount = useMemo(() => cart.reduce((n, l) => n + l.qty, 0), [cart]);

  // ---- wishlist ---------------------------------------------------------------
  const toggleWish = useCallback(
    (id) => setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setWishlist],
  );

  // ---- product catalogue (static sample data + merchant-submitted, approved listings) --------
  // `shopById[p.shopId]` guards against a stray record whose shop no longer resolves (e.g. leftover
  // data from an older build, or a shop the browser never registered) — `locate()` downstream
  // assumes every product's shop exists, and one bad entry would otherwise blank the whole page.
  // A shop the admin has suspended (`shopOverrides[id].suspended`, applied to `shopById` by
  // AuthContext) drops out of both catalogues — its products stop being discoverable or purchasable.
  const live = (shopId) => shopById[shopId] && !shopById[shopId].suspended;
  const approvedRetail = useMemo(
    () => myProducts.filter((p) => p.status === 'APPROVED' && p.listRetail && live(p.shopId)).map(toRetailShape),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myProducts, shopOverrides],
  );
  const approvedWholesale = useMemo(
    () => myProducts.filter((p) => p.status === 'APPROVED' && p.listWholesale && live(p.shopId)).map(toWholesaleShape),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myProducts, shopOverrides],
  );
  const b2cCatalog = useMemo(
    () => [...b2cProducts.filter((p) => live(p.shopId)), ...approvedRetail],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [approvedRetail, shopOverrides],
  );
  const b2bCatalog = useMemo(
    () => [...b2bProducts.filter((p) => live(p.shopId)), ...approvedWholesale],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [approvedWholesale, shopOverrides],
  );
  const findProduct = useCallback(
    (id) => b2cCatalog.find((p) => p.id === id) || b2bCatalog.find((p) => p.id === id) || null,
    [b2cCatalog, b2bCatalog],
  );
  const productsOfShop = useCallback(
    (shopId) => ({ retail: b2cCatalog.filter((p) => p.shopId === shopId), wholesale: b2bCatalog.filter((p) => p.shopId === shopId) }),
    [b2cCatalog, b2bCatalog],
  );

  const addProduct = useCallback(
    (data) => {
      const now = Date.now();
      const product = { ...data, id: uid('mp-'), shopId: user.business.shopId, ownerId: user.id, status: 'PENDING', createdAt: now, approveAt: now + APPROVE_DELAY_MS };
      setMyProducts((prev) => [product, ...prev]);
      return product;
    },
    [user, setMyProducts],
  );
  /** Editing any existing listing (including a live one) sends it back for review — same rule
   *  real marketplaces use so a merchant can't swap in something different after approval. */
  const updateProduct = useCallback(
    (id, data) => {
      const now = Date.now();
      setMyProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data, status: 'PENDING', rejectReason: null, reviewedAt: null, approveAt: now + APPROVE_DELAY_MS } : p)),
      );
    },
    [setMyProducts],
  );
  /** Demo control — plays the role of the platform admin reviewing a submitted listing. */
  const approveProduct = useCallback(
    (id) => setMyProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'APPROVED', reviewedAt: Date.now() } : p))),
    [setMyProducts],
  );
  const rejectProduct = useCallback(
    (id, reason) => setMyProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'REJECTED', reviewedAt: Date.now(), rejectReason: reason } : p))),
    [setMyProducts],
  );
  const removeProduct = useCallback((id) => setMyProducts((prev) => prev.filter((p) => p.id !== id)), [setMyProducts]);

  /** Lets a merchant open their own pending/rejected listing at the address it will live at once
   *  approved (`up-<id>` / `uw-<id>`) — nobody else can see it there; the public catalogues above
   *  stay approved-only. Returns null for anyone else, or once the id doesn't match that shape. */
  const previewProduct = useCallback(
    (id, kind) => {
      const prefix = kind === 'retail' ? 'up-' : 'uw-';
      if (!id.startsWith(prefix)) return null;
      const recordId = id.slice(prefix.length);
      const rec = myProducts.find((p) => p.id === recordId && p.ownerId === user?.id);
      if (!rec || !shopById[rec.shopId]) return null;
      if (kind === 'retail' && !rec.listRetail) return null;
      if (kind === 'wholesale' && !rec.listWholesale) return null;
      return kind === 'retail' ? toRetailShape(rec) : toWholesaleShape(rec);
    },
    [myProducts, user],
  );

  // ---- market community (per-market, merchants-only board — see StoreContext tick below for the
  // simulated-reply mechanism that keeps it feeling like an active group) ----------------------
  const createPost = useCallback(
    (marketId, text, media, productId = null) => {
      const now = Date.now();
      const post = {
        id: uid('cp-'),
        marketId,
        shopId: user.business.shopId,
        text: text.trim(),
        ...mediaFields(media),
        productId: productId || null,
        createdAt: now,
        comments: [],
        pending: { at: now + COMMUNITY_REPLY_DELAY_MS },
      };
      setMarketPosts((prev) => [post, ...prev]);
      return post;
    },
    [user, setMarketPosts],
  );
  const addComment = useCallback(
    (postId, text, media) => {
      const now = Date.now();
      setMarketPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const comment = {
            id: uid('cc-'), shopId: user.business.shopId, text: text.trim(), ...mediaFields(media), createdAt: now,
            replies: [], pending: null,
          };
          // Only queue a fresh simulated reply if one isn't already pending on this post.
          return { ...p, comments: [...p.comments, comment], pending: p.pending || { at: now + COMMUNITY_REPLY_DELAY_MS } };
        }),
      );
    },
    [user, setMarketPosts],
  );
  // Replying to a specific comment — a one-level-deep thread under that comment (WhatsApp/FB-style,
  // not infinitely nested). Gets the same simulated "someone from the market replies" treatment.
  const addReply = useCallback(
    (postId, commentId, text, media) => {
      const now = Date.now();
      setMarketPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            comments: p.comments.map((c) => {
              if (c.id !== commentId) return c;
              const reply = { id: uid('cr-'), shopId: user.business.shopId, text: text.trim(), ...mediaFields(media), createdAt: now };
              const replies = c.replies || [];
              return { ...c, replies: [...replies, reply], pending: c.pending || { at: now + COMMUNITY_REPLY_DELAY_MS } };
            }),
          };
        }),
      );
    },
    [user, setMarketPosts],
  );

  // ---- orders -----------------------------------------------------------------
  const placeRetailOrders = useCallback(
    ({ address, payment, delivery }) => {
      const priced = priceGroups(groupCart(cart, b2cCatalog), delivery.fee);
      const now = Date.now();
      const created = priced.groups.map((g) => ({
        id: newOrderId(),
        type: 'RETAIL',
        buyerId: user.id,
        createdAt: now,
        shopId: g.shopId,
        items: g.lines.map((l) => ({
          productId: l.productId,
          name: l.product.name,
          emoji: l.product.emoji,
          hue: l.product.hue,
          variant: l.variant,
          qty: l.qty,
          unitPrice: l.unitPrice,
        })),
        subtotal: g.subtotal,
        deliveryFee: g.delivery,
        deliveryLabel: delivery.label,
        deliveryId: delivery.id,
        escrowFee: g.escrow,
        vat: 0,
        total: g.total,
        address,
        paymentMethod: payment,
        escrow: { state: 'FUNDED', events: [{ state: 'FUNDED', at: now, note: 'Payment received. Funds are held in escrow.' }] },
      }));
      setOrders((prev) => [...created, ...prev]);
      setCart([]);
      return created;
    },
    [cart, user, setOrders, setCart, b2cCatalog],
  );

  const patchOrder = useCallback(
    (id, fn) => setOrders((prev) => prev.map((o) => (o.id === id ? fn(o, Date.now()) : o))),
    [setOrders],
  );
  /** Demo control — pushes an order to its next logistics milestone. */
  const advanceOrder = useCallback(
    (id) =>
      patchOrder(id, (o, now) => {
        if (o.escrow.state === 'FUNDED') {
          const courier = couriers[hash(o.id) % couriers.length];
          const number = `${courier.slice(0, 3).toUpperCase()}${hash(o.id + 'trk') % 90000000 + 10000000}`;
          return {
            ...o,
            tracking: { courier, number },
            escrow: { state: 'IN_TRANSIT', events: [...o.escrow.events, { state: 'IN_TRANSIT', at: now, note: `Dispatched with ${courier}. Tracking no. ${number}.` }] },
          };
        }
        if (o.escrow.state === 'IN_TRANSIT') {
          return {
            ...o,
            autoReleaseAt: now + AUTO_RELEASE_MS,
            escrow: { state: 'DELIVERED', events: [...o.escrow.events, { state: 'DELIVERED', at: now, note: 'Delivery confirmed by the logistics partner. Auto-release timer started (72 hours).' }] },
          };
        }
        return o;
      }),
    [patchOrder],
  );

  const confirmDelivery = useCallback(
    (id) =>
      patchOrder(id, (o, now) => ({
        ...o,
        autoReleaseAt: null,
        escrow: { state: 'RELEASED', events: [...o.escrow.events, { state: 'RELEASED', at: now, note: 'Buyer confirmed receipt. Funds released to the merchant wallet.' }] },
      })),
    [patchOrder],
  );

  const extendRelease = useCallback(
    (id) =>
      patchOrder(id, (o) =>
        o.autoReleaseExtended || !o.autoReleaseAt
          ? o
          : { ...o, autoReleaseAt: o.autoReleaseAt + EXTEND_MS, autoReleaseExtended: true },
      ),
    [patchOrder],
  );

  const raiseDispute = useCallback(
    (id, reason) =>
      patchOrder(id, (o, now) => ({
        ...o,
        autoReleaseAt: null,
        dispute: { reason, raisedAt: now },
        escrow: { state: 'DISPUTED', events: [...o.escrow.events, { state: 'DISPUTED', at: now, note: `Dispute raised: “${reason}”. Escrow funds frozen.` }] },
      })),
    [patchOrder],
  );

  /** Demo control — plays the role of the platform mediator. */
  const resolveDispute = useCallback(
    (id, outcome) =>
      patchOrder(id, (o, now) => ({
        ...o,
        escrow: {
          state: outcome,
          events: [
            ...o.escrow.events,
            {
              state: outcome,
              at: now,
              note: outcome === 'REFUNDED' ? 'Mediator ruled: full refund to the buyer.' : 'Mediator ruled: funds released to the merchant.',
            },
          ],
        },
      })),
    [patchOrder],
  );

  // ---- merchant-to-merchant deal chats --------------------------------------------
  // Wholesale trade has no RFQ/PO flow: dealers message each other directly and close the deal
  // between themselves. One thread per (signed-in merchant, other shop); a message can carry a
  // reference card (a listing or a community post) so the other side knows what it's about.
  const myDealChats = useMemo(
    () => dealChats.filter((c) => c.ownerId === user?.id).sort((a, b) => b.updatedAt - a.updatedAt),
    [dealChats, user],
  );
  const dealUnread = useMemo(() => myDealChats.reduce((n, c) => n + (c.unread || 0), 0), [myDealChats]);

  const sendDealMessage = useCallback(
    (shopId, text, ref = null) => {
      const now = Date.now();
      const id = `${user.id}:${shopId}`;
      const msg = { id: uid('dm-'), from: 'me', text: text.trim(), at: now, ref };
      setDealChats((prev) => {
        const existing = prev.find((c) => c.id === id);
        const chat = existing
          ? { ...existing, messages: [...existing.messages, msg], updatedAt: now, pending: { at: now + DEAL_REPLY_DELAY_MS } }
          : { id, ownerId: user.id, shopId, unread: 0, updatedAt: now, pending: { at: now + DEAL_REPLY_DELAY_MS }, messages: [msg] };
        return [chat, ...prev.filter((c) => c.id !== id)];
      });
    },
    [user, setDealChats],
  );

  const markDealRead = useCallback(
    (shopId) => {
      const id = `${user?.id}:${shopId}`;
      setDealChats((prev) => (prev.some((c) => c.id === id && c.unread) ? prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) : prev));
    },
    [user, setDealChats],
  );

  // ---- background simulation: merchant replies + escrow auto-release + product approval ------
  const dealChatsRef = useRef(dealChats);
  const ordersRef = useRef(orders);
  const myProductsRef = useRef(myProducts);
  const marketPostsRef = useRef(marketPosts);
  dealChatsRef.current = dealChats;
  ordersRef.current = orders;
  myProductsRef.current = myProducts;
  marketPostsRef.current = marketPosts;

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const dueChats = dealChatsRef.current.filter((c) => c.pending && c.pending.at <= now);
      if (dueChats.length) {
        setDealChats((prev) =>
          prev.map((c) => {
            if (!c.pending || c.pending.at > now) return c;
            const reply = { id: uid('dm-'), from: 'them', text: dealReply(c), at: now };
            return { ...c, pending: null, unread: (c.unread || 0) + 1, updatedAt: now, messages: [...c.messages, reply] };
          }),
        );
        dueChats
          .filter((c) => c.ownerId === userRef.current?.id)
          .forEach((c) => toast(`New message from ${shopById[c.shopId]?.name || 'a merchant'}`, { kind: 'info', duration: 5000 }));
      }
      if (ordersRef.current.some((o) => o.escrow.state === 'DELIVERED' && o.autoReleaseAt && o.autoReleaseAt <= now)) {
        setOrders((prev) =>
          prev.map((o) =>
            o.escrow.state === 'DELIVERED' && o.autoReleaseAt && o.autoReleaseAt <= now
              ? { ...o, autoReleaseAt: null, escrow: { state: 'RELEASED', events: [...o.escrow.events, { state: 'RELEASED', at: now, note: 'No response within 72 hours — funds auto-released to the merchant.' }] } }
              : o,
          ),
        );
      }
      // The admin platform can switch the simulated auto-review off so listings wait for a person.
      const autoApprove = readStorage('platformSettings', {}).autoApproveProducts !== false;
      const duePending = autoApprove ? myProductsRef.current.filter((p) => p.status === 'PENDING' && p.approveAt && p.approveAt <= now) : [];
      if (duePending.length) {
        setMyProducts((prev) =>
          prev.map((p) => (p.status === 'PENDING' && p.approveAt && p.approveAt <= now ? { ...p, status: 'APPROVED', reviewedAt: now } : p)),
        );
        duePending
          .filter((p) => p.ownerId === userRef.current?.id)
          .forEach((p) => toast(`“${p.name}” was approved by the admin and is now live`, { duration: 5000 }));
      }
      const duePosts = marketPostsRef.current.filter((p) => p.pending && p.pending.at <= now);
      if (duePosts.length) {
        setMarketPosts((prev) =>
          prev.map((p) => {
            if (!p.pending || p.pending.at > now) return p;
            const others = shopsOfMarket(p.marketId).filter((s) => s.id !== p.shopId);
            if (!others.length) return { ...p, pending: null };
            const replier = others[Math.floor(Math.random() * others.length)];
            const text = REPLY_POOL[Math.floor(Math.random() * REPLY_POOL.length)];
            return { ...p, pending: null, comments: [...p.comments, { id: uid('cc-'), shopId: replier.id, text, createdAt: now }] };
          }),
        );
        const myMarketId = userRef.current?.business?.shopId ? locate(userRef.current.business.shopId).market.id : null;
        duePosts
          .filter((p) => p.marketId === myMarketId)
          .forEach((p) => toast(`New reply in the ${marketById[p.marketId].short} community`, { kind: 'info', duration: 5000 }));
      }
      const dueCommentReplies = [];
      marketPostsRef.current.forEach((p) => {
        (p.comments || []).forEach((c) => {
          if (c.pending && c.pending.at <= now) dueCommentReplies.push({ marketId: p.marketId });
        });
      });
      if (dueCommentReplies.length) {
        setMarketPosts((prev) =>
          prev.map((p) => ({
            ...p,
            comments: (p.comments || []).map((c) => {
              if (!c.pending || c.pending.at > now) return c;
              const others = shopsOfMarket(p.marketId).filter((s) => s.id !== c.shopId);
              if (!others.length) return { ...c, pending: null };
              const replier = others[Math.floor(Math.random() * others.length)];
              const text = REPLY_POOL[Math.floor(Math.random() * REPLY_POOL.length)];
              const replies = c.replies || [];
              return { ...c, pending: null, replies: [...replies, { id: uid('cr-'), shopId: replier.id, text, createdAt: now }] };
            }),
          })),
        );
        const myMarketId2 = userRef.current?.business?.shopId ? locate(userRef.current.business.shopId).market.id : null;
        dueCommentReplies
          .filter((r) => r.marketId === myMarketId2)
          .slice(0, 1)
          .forEach((r) => toast(`New reply in the ${marketById[r.marketId].short} community`, { kind: 'info', duration: 5000 }));
      }
    };
    const t = setInterval(tick, 1000);
    tick();
    return () => clearInterval(t);
  }, [setDealChats, setOrders, setMyProducts, setMarketPosts, toast]);

  // Contact details unlock once the buyer has an order (of any kind) with that shop — mirrors the
  // "chat is always open, phone numbers unlock after purchase" rule.
  const hasOrderWith = useCallback(
    (shopId) => orders.some((o) => o.buyerId === user?.id && o.shopId === shopId && o.escrow.state !== 'FAILED'),
    [orders, user],
  );

  const value = useMemo(
    () => ({
      cart, cartCount, addToCart, updateQty, removeFromCart,
      wishlist, toggleWish,
      orders, placeRetailOrders, advanceOrder, confirmDelivery, extendRelease, raiseDispute, resolveDispute,
      myDealChats, dealUnread, sendDealMessage, markDealRead,
      hasOrderWith,
      b2cCatalog, b2bCatalog, findProduct, productsOfShop, previewProduct,
      myProducts, addProduct, updateProduct, approveProduct, rejectProduct, removeProduct,
      marketPosts, createPost, addComment, addReply,
    }),
    [
      cart, cartCount, addToCart, updateQty, removeFromCart, wishlist, toggleWish,
      orders, placeRetailOrders, advanceOrder, confirmDelivery, extendRelease, raiseDispute, resolveDispute,
      myDealChats, dealUnread, sendDealMessage, markDealRead, hasOrderWith,
      b2cCatalog, b2bCatalog, findProduct, productsOfShop, previewProduct,
      myProducts, addProduct, updateProduct, approveProduct, rejectProduct, removeProduct,
      marketPosts, createPost, addComment, addReply, marketOverrides,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
