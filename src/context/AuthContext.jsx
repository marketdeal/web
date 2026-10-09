import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { readStorage, usePersistentState } from '../lib/storage';
import { uid } from '../lib/format';
import { b2cCategories } from '../data/b2c';
import { marketById, plazasOfStreet, registerVendorShop, shopById, streetsOfMarket } from '../data/directory';
import { useToast } from './ToastContext';

// Mock authentication — accounts live in localStorage only.
// Roles: "buyer" sees the B2C shop only; "vendor" (business account) sees B2C + the B2B community.
//
// KYC model — 3 levels, the first mandatory and the other two merchant-initiated from the dashboard
// (not collected at sign-up):
//   Level 1 · Email verified   — required for everyone before they can sign in at all.
//   Level 2 · CAC registered   — optional; a merchant submits their CAC number any time.
//   Level 3 · Verified Dealer  — a Market Admin confirms the physical shop in person.
// We deliberately don't collect BVN/NIN anywhere in this product.

const CAC_REVIEW_DELAY_MS = 15000;
const PHYSICAL_REVIEW_DELAY_MS = 20000;

const noReview = { status: 'NONE', submittedAt: null, reviewAt: null, reviewedAt: null, rejectReason: null };

/** Level 3 (physical shop visit) outranks Level 2 (CAC) — either can be pursued independently and
 *  in any order, since CAC is optional, so the badge always reflects the highest one actually won. */
function computeKycLevel(business) {
  if (business.physicalVerification.status === 'VERIFIED') return 3;
  if (business.cacVerification.status === 'VERIFIED') return 2;
  return 1;
}

/**
 * A registered business gets a real shop in the spatial directory — placed in the first plaza of
 * the first street of the market they registered under, same as a Market Admin would assign one.
 * `registerVendorShop` pushes it into the live directory immediately; the caller is responsible
 * for also persisting it (see `vendorShops` below) so it survives a page reload.
 */
function buildShop({ id, business, ownerName, phone, categoryId, description }) {
  const category = b2cCategories.find((c) => c.id === categoryId) || b2cCategories[0];
  const street = streetsOfMarket(business.marketId)[0];
  const plaza = plazasOfStreet(street.id)[0];
  return {
    id,
    plazaId: plaza.id,
    number: 'NEW',
    name: business.name,
    owner: ownerName,
    category: category.name,
    rating: 0,
    reviews: 0,
    kyc: business.kycLevel,
    since: new Date().getFullYear(),
    phone,
    hours: '9:00am – 6:00pm',
    emoji: category.emoji,
    hue: category.hue,
    blurb: description?.trim() || `${business.name} — newly onboarded merchant on MarketDeal.`,
  };
}

const seedUsers = [
  {
    id: 'u-demo-buyer',
    name: 'Adaeze Okafor',
    email: 'buyer@demo.com',
    password: 'demo1234',
    phone: '0803 555 0101',
    city: 'Lagos',
    role: 'buyer',
    emailVerified: true,
  },
  {
    id: 'u-demo-vendor',
    name: 'Chukwuemeka Obi',
    email: 'vendor@demo.com',
    password: 'demo1234',
    phone: '0806 555 0202',
    city: 'Lagos',
    role: 'vendor',
    emailVerified: true,
    business: {
      name: 'Chuks Gadgets Ltd', marketId: 'computer-village', kycLevel: 3, shopId: 'chuks-gadgets',
      cac: 'RC 1482930',
      // Already a settled, fully verified merchant in the demo — shows what "done" looks like
      // alongside a freshly-registered account that hasn't pursued Level 2/3 yet.
      cacVerification: { status: 'VERIFIED', submittedAt: Date.now() - 40 * 86400000, reviewAt: null, reviewedAt: Date.now() - 39 * 86400000, rejectReason: null },
      physicalVerification: { status: 'VERIFIED', submittedAt: Date.now() - 30 * 86400000, reviewAt: null, reviewedAt: Date.now() - 29 * 86400000, rejectReason: null },
    },
  },
];

// The demo vendor's shop, seeded alongside its user so both exist together on first load.
const seedVendorShops = [
  buildShop({
    id: 'chuks-gadgets',
    business: seedUsers[1].business,
    ownerName: seedUsers[1].name,
    phone: seedUsers[1].phone,
    categoryId: 'computing',
    description: 'Laptops, accessories and computing gear — newly onboarded on MarketDeal.',
  }),
];

const AuthContext = createContext(null);

// Runs when the MarketDeal Admin platform changes the signed-in merchant's record from another window.
function describeAdminDecisions(prevUser, nextUser) {
  const notes = [];
  if (!prevUser || !nextUser) return notes;
  if (!prevUser.suspended && nextUser.suspended) notes.push({ text: 'Your account has been suspended by MarketDeal.', kind: 'info' });
  const pb = prevUser.business;
  const nb = nextUser.business;
  if (pb && nb) {
    const pairs = [
      ['cacVerification', 'CAC verification'],
      ['physicalVerification', 'Physical shop verification'],
    ];
    pairs.forEach(([field, label]) => {
      const before = pb[field]?.status;
      const after = nb[field]?.status;
      if (before === after) return;
      if (after === 'VERIFIED') notes.push({ text: `✅ ${label} approved by MarketDeal admin`, kind: 'success' });
      if (after === 'REJECTED') notes.push({ text: `${label} was not approved: ${nb[field].rejectReason || 'see your dashboard'}`, kind: 'info' });
    });
  }
  return notes;
}

export function AuthProvider({ children }) {
  const toast = useToast();
  const sessionRef = useRef(null);
  const [users, setUsers] = usePersistentState('users', seedUsers, {
    onExternal: (prev, next) => {
      const id = sessionRef.current;
      if (!id) return;
      describeAdminDecisions(prev.find((u) => u.id === id), next.find((u) => u.id === id)).forEach((n) => toast(n.text, { kind: n.kind, duration: 6000 }));
    },
  });
  const [sessionId, setSessionId] = usePersistentState('session', null);
  sessionRef.current = sessionId;
  const [vendorShops, setVendorShops] = usePersistentState('vendorShops', seedVendorShops);
  // Changes the admin platform applies to any shop — seeded or merchant-created: suspension,
  // relocation to another plaza, KYC level. Kept as a separate map so seeded shops (which live in
  // code, not storage) can be overridden without being copied into storage.
  const [shopOverrides] = usePersistentState('shopOverrides', {});
  // Same idea for a market's announcement banner, which the admin can rewrite.
  const [marketOverrides] = usePersistentState('marketOverrides', {});

  // The in-memory spatial directory (data/directory.js) resets on every page load, so every
  // previously created vendor shop must be re-registered before anything tries to `locate()` it.
  // This has to happen during render (not an effect) so it's ready for the very first paint —
  // registerVendorShop also mirrors field changes (e.g. a flipped KYC level) onto an already-
  // registered shop, so re-running it on every render is cheap and keeps the singleton current.
  vendorShops.forEach(registerVendorShop);
  Object.entries(shopOverrides).forEach(([id, patch]) => {
    if (shopById[id]) Object.assign(shopById[id], patch);
  });
  Object.entries(marketOverrides).forEach(([id, patch]) => {
    if (marketById[id]) Object.assign(marketById[id], patch);
  });

  // The demo accounts must always exist, even if an older copy of storage lacks them.
  const allUsers = useMemo(
    () => [...seedUsers.filter((s) => !users.some((u) => u.id === s.id)), ...users],
    [users],
  );
  // A suspended account is treated as signed out everywhere, even mid-session.
  const user = useMemo(() => {
    const found = allUsers.find((u) => u.id === sessionId) || null;
    return found && !found.suspended ? found : null;
  }, [allUsers, sessionId]);

  const createShopFor = useCallback(
    (business, ownerName, phone, categoryId, description) => {
      const shop = buildShop({ id: uid('shop-'), business, ownerName, phone, categoryId, description });
      registerVendorShop(shop);
      setVendorShops((prev) => [...prev, shop]);
      return shop.id;
    },
    [setVendorShops],
  );

  // Self-heal an account saved by an older build: a vendor whose business has no shop yet (or
  // whose shop id no longer resolves) gets one created transparently, the same as a fresh
  // registration would. Guarded by the shopById check so it only fires once per broken account —
  // registerVendorShop above already ran this render, so the fix is visible immediately.
  if (user?.role === 'vendor' && user.business && !shopById[user.business.shopId]) {
    const shopId = createShopFor(user.business, user.name, user.phone, undefined, undefined);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, business: { ...u.business, shopId } } : u)));
  }

  const login = useCallback(
    (email, password) => {
      const found = allUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found || found.password !== password) {
        return { ok: false, error: 'Incorrect email or password.' };
      }
      if (!found.emailVerified) {
        return { ok: false, error: 'Please verify your email before signing in.', needsVerification: true, email: found.email };
      }
      if (found.suspended) {
        return { ok: false, error: 'This account has been suspended. Please contact MarketDeal support.', suspended: true };
      }
      setSessionId(found.id);
      return { ok: true, user: found };
    },
    [allUsers, setSessionId],
  );

  // Just the basics — an account isn't usable until `verifyEmail` below confirms it, which is also
  // what actually starts the session (see pages/Auth.jsx's email-OTP step).
  const register = useCallback(
    (data) => {
      if (allUsers.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) {
        return { ok: false, error: 'An account with this email already exists.' };
      }
      const id = uid('u-');
      const phone = data.phone?.trim() || '';
      const business =
        data.role === 'vendor'
          ? { name: data.businessName.trim(), marketId: data.marketId, kycLevel: 1, cac: '', cacVerification: { ...noReview }, physicalVerification: { ...noReview } }
          : null;
      const shopId = business ? createShopFor(business, data.name.trim(), phone, data.categoryId, data.description) : null;
      const created = {
        id,
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        phone,
        city: data.city || 'Lagos',
        role: data.role,
        emailVerified: false,
        createdAt: Date.now(),
        ...(business ? { business: { ...business, shopId } } : {}),
      };
      setUsers((prev) => [...prev, created]);
      return { ok: true, user: created };
    },
    [allUsers, setUsers, createShopFor],
  );

  /** Confirms the email OTP and — since that's the one thing standing between "registered" and
   *  "signed in" — starts the session in the same step. Used right after registration and from the
   *  Login page's "verify now" recovery path for an account that was never confirmed. */
  const verifyEmail = useCallback(
    (email) => {
      const found = allUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) return { ok: false };
      setUsers((prev) => {
        const base = prev.some((u) => u.id === found.id) ? prev : [...prev, found];
        return base.map((u) => (u.id === found.id ? { ...u, emailVerified: true } : u));
      });
      setSessionId(found.id);
      return { ok: true, user: found };
    },
    [allUsers, setUsers, setSessionId],
  );

  const logout = useCallback(() => setSessionId(null), [setSessionId]);

  /** A signed-in buyer applies for a business account — just the shop basics (name, market,
   *  category). CAC and physical verification are pursued afterwards from the dashboard. */
  const upgradeToVendor = useCallback(
    ({ businessName, marketId, categoryId, description }) => {
      const current = allUsers.find((u) => u.id === sessionId);
      const business = { name: businessName.trim(), marketId, kycLevel: 1, cac: '', cacVerification: { ...noReview }, physicalVerification: { ...noReview } };
      const shopId = createShopFor(business, current.name, current.phone, categoryId, description);
      setUsers((prev) => {
        const base = prev.some((u) => u.id === sessionId) ? prev : [...prev, current];
        return base.map((u) => (u.id === sessionId ? { ...u, role: 'vendor', business: { ...business, shopId }, upgradedAt: Date.now() } : u));
      });
    },
    [sessionId, allUsers, setUsers, createShopFor],
  );

  // Applies a business patch for the signed-in merchant (a plain object, or an updater function
  // that reads the current business and returns one — needed when merging a sub-object like
  // cacVerification), recomputes their KYC level from it, and — only when that level actually
  // changed — mirrors it onto their live shop record so the badge updates everywhere immediately
  // (see registerVendorShop's field-sync behavior).
  const patchBusiness = useCallback(
    (patcher) => {
      const current = allUsers.find((u) => u.id === sessionId);
      if (!current?.business) return;
      const patch = typeof patcher === 'function' ? patcher(current.business) : patcher;
      const nextBusiness = { ...current.business, ...patch };
      nextBusiness.kycLevel = computeKycLevel(nextBusiness);
      setUsers((prev) => prev.map((u) => (u.id === sessionId ? { ...u, business: nextBusiness } : u)));
      if (nextBusiness.kycLevel !== current.business.kycLevel) {
        setVendorShops((prev) => prev.map((s) => (s.id === current.business.shopId ? { ...s, kyc: nextBusiness.kycLevel } : s)));
      }
    },
    [sessionId, allUsers, setUsers, setVendorShops],
  );

  /** Level 2 — optional. A merchant can submit (or resubmit, after a rejection) their CAC number
   *  any time from the dashboard; no document upload, just the registration number. */
  const submitCac = useCallback(
    (cacNumber) => {
      const now = Date.now();
      patchBusiness({ cac: cacNumber.trim(), cacVerification: { status: 'PENDING', submittedAt: now, reviewAt: now + CAC_REVIEW_DELAY_MS, reviewedAt: null, rejectReason: null } });
    },
    [patchBusiness],
  );
  const approveCac = useCallback(
    () => patchBusiness((b) => ({ cacVerification: { ...b.cacVerification, status: 'VERIFIED', reviewAt: null, reviewedAt: Date.now(), rejectReason: null } })),
    [patchBusiness],
  );
  const rejectCac = useCallback(
    (reason) => patchBusiness((b) => ({ cacVerification: { ...b.cacVerification, status: 'REJECTED', reviewAt: null, reviewedAt: Date.now(), rejectReason: reason } })),
    [patchBusiness],
  );

  /** Level 3 — a Market Admin visit. Just a request, no form: the shop's already-known address is
   *  what gets confirmed. Independent of Level 2, so a merchant without CAC can still pursue it. */
  const requestPhysicalVerification = useCallback(() => {
    const now = Date.now();
    patchBusiness({ physicalVerification: { status: 'PENDING', submittedAt: now, reviewAt: now + PHYSICAL_REVIEW_DELAY_MS, reviewedAt: null, rejectReason: null } });
  }, [patchBusiness]);
  const approvePhysical = useCallback(
    () => patchBusiness((b) => ({ physicalVerification: { ...b.physicalVerification, status: 'VERIFIED', reviewAt: null, reviewedAt: Date.now(), rejectReason: null } })),
    [patchBusiness],
  );
  const rejectPhysical = useCallback(
    (reason) => patchBusiness((b) => ({ physicalVerification: { ...b.physicalVerification, status: 'REJECTED', reviewAt: null, reviewedAt: Date.now(), rejectReason: reason } })),
    [patchBusiness],
  );

  // Auto-resolves any pending CAC / physical-verification review after its delay, same "simulated
  // backend" idiom as StoreContext's shared tick — kept as its own interval since business
  // verification is this context's own domain and AuthProvider sits above StoreProvider in the tree.
  const userRef = useRef(user);
  userRef.current = user;
  useEffect(() => {
    const tick = () => {
      const current = userRef.current;
      const biz = current?.business;
      if (!biz) return;
      // The admin platform can switch the simulated auto-review off so verifications wait for a person.
      if (readStorage('platformSettings', {}).autoVerifyKyc === false) return;
      const now = Date.now();
      let next = biz;
      let resolvedCac = false;
      let resolvedPhysical = false;
      if (biz.cacVerification.status === 'PENDING' && biz.cacVerification.reviewAt && biz.cacVerification.reviewAt <= now) {
        next = { ...next, cacVerification: { ...next.cacVerification, status: 'VERIFIED', reviewAt: null, reviewedAt: now } };
        resolvedCac = true;
      }
      if (biz.physicalVerification.status === 'PENDING' && biz.physicalVerification.reviewAt && biz.physicalVerification.reviewAt <= now) {
        next = { ...next, physicalVerification: { ...next.physicalVerification, status: 'VERIFIED', reviewAt: null, reviewedAt: now } };
        resolvedPhysical = true;
      }
      if (!resolvedCac && !resolvedPhysical) return;
      next.kycLevel = computeKycLevel(next);
      setUsers((prev) => prev.map((u) => (u.id === current.id ? { ...u, business: next } : u)));
      if (next.kycLevel !== biz.kycLevel) {
        setVendorShops((prev) => prev.map((s) => (s.id === current.business.shopId ? { ...s, kyc: next.kycLevel } : s)));
      }
      if (resolvedCac) toast(`✅ ${current.business.name}’s CAC was verified — Level 2 unlocked`, { duration: 6000 });
      if (resolvedPhysical) toast(`🎉 ${current.business.name} is now a Verified Dealer — Level 3 unlocked!`, { duration: 6000 });
    };
    const t = setInterval(tick, 1000);
    tick();
    return () => clearInterval(t);
  }, [setUsers, setVendorShops, toast]);

  const value = useMemo(
    () => ({
      user, isVendor: user?.role === 'vendor', isLoggedIn: !!user, login, register, verifyEmail, logout, upgradeToVendor,
      submitCac, approveCac, rejectCac, requestPhysicalVerification, approvePhysical, rejectPhysical,
      shopOverrides, marketOverrides,
    }),
    [user, login, register, verifyEmail, logout, upgradeToVendor, submitCac, approveCac, rejectCac, requestPhysicalVerification, approvePhysical, rejectPhysical, shopOverrides, marketOverrides],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
