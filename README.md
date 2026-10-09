# MarketDeal Mobile (PWA)

The MarketDeal storefront packaged as an installable Progressive Web App — same React 19 + Vite codebase and features as `../MarketDealWeb`, plus a mobile app shell.

## Run

```bash
npm install
npm run dev        # http://localhost:5180  (dev; service worker is off)
npm run build && npm run preview   # http://localhost:5180  (production build with service worker — use this to test install/offline)
```

To install on a phone, serve over HTTPS (any static host: Netlify, Vercel, Cloudflare Pages) or use `localhost` on the device via USB port-forwarding. Then: Android/Chrome → "Install app" banner or menu; iOS/Safari → Share → Add to Home Screen.

## What was added on top of the storefront

- `vite.config.js` — `vite-plugin-pwa` (Workbox `generateSW`): web manifest (name, icons incl. maskable, standalone display, shortcuts to Cart / Orders / Merchant dashboard), precache of the app shell, SPA navigation fallback, `registerType: 'prompt'` so users choose when to update.
- `public/icons/` — 192, 512, maskable-512 and apple-touch icons; `index.html` has iOS/Android meta tags and `viewport-fit=cover`.
- `src/lib/pwa.js` — hooks: install prompt (`beforeinstallprompt` + iOS instructions), online/offline, update available.
- `src/components/MobileShell.jsx`
  - `TabBar` — bottom tabs (Home · Shop · Cart · Orders · Account) for shoppers; (Markets · RFQs · Orders · Products · Dashboard) inside merchant areas. Account opens a bottom sheet (orders, wishlist, merchant links, install, sign out). Hidden on login/register and on desktop widths.
  - `PwaNotices` — offline bar, "Get the app" banner (dismissed for 7 days), "new version ready" toast.
- `src/pages/Shop.jsx` — filters become a bottom sheet on phones.
- `src/index.css` (end of file) — mobile rules ≤ 860px: compact header, no promo strip/footer, safe-area insets, 44px touch targets, 16px inputs (no iOS zoom).

## Notes

- Data is still local to the browser (`marketdeal:*` localStorage), same as the web prototype. The admin console (`../MarketDealAdmin`) is linked to the web storefront on port 5173, not to this app's origin.
- Offline: the app shell and previously visited routes load offline; there is no backend to sync, so orders/cart persist locally.
- Push notifications are not wired up — they need a backend to send from. The service worker is ready to extend for it.
