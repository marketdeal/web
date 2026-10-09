// A deliberately simple, rule-based stand-in for the PRD's RAG-powered "AI Market Guide".
// It parses market names, price caps and intent words, then ranks products from the sample catalogue.
import { b2cProducts } from '../data/b2c';
import { b2bProducts } from '../data/b2b';
import { locate, markets } from '../data/directory';
import { naira } from './format';

const stem = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

const STOP_WORDS =
  'a an the i me my we you your is are was be to of in on at for from with and or any some can could would should do does where which what who how find buy get need want looking look show give list tell please there here it its that this under below above over than less more cheap cheaper cheapest lowest compare price prices priced original genuine best popular trending today sell sells selling shop shops market markets nigeria lagos wholesale bulk moq dealer dealers distributor supplier suppliers supply supplies rate rates good';
const STOP = new Set(STOP_WORDS.split(' ').flatMap((w) => [w, stem(w)]));

const MARKET_ALIASES = [
  [/computer village|ikeja|otigba|idowu/, 'computer-village'],
  [/alaba|rago|ojo/, 'alaba'],
  [/trade fair/, 'trade-fair'],
  [/ariaria|\baba\b/, 'ariaria'],
  [/onitsha|iweka/, 'onitsha'],
];
const tokenize = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(stem);

function parsePriceCap(q) {
  const m = q.match(/(?:under|below|less than|within|max(?:imum)?|budget of|up to)\s*₦?\s*([\d,.]+)\s*(k|m|million|thousand)?/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ''));
  const unit = (m[2] || '').toLowerCase();
  if (unit === 'k' || unit === 'thousand') n *= 1_000;
  if (unit === 'm' || unit === 'million') n *= 1_000_000;
  return n;
}

const searchable = (p) => ({
  name: tokenize(p.name),
  brand: tokenize(p.brand || ''),
  tags: [...(p.tags || []), p.category].flatMap(tokenize),
  shop: tokenize(locate(p.shopId).shop.name),
});

// prefix match, or substring for longer words so "phone" finds "smartphone" and "iphone"
const matches = (words, t) => words.some((w) => w.startsWith(t) || (t.length >= 5 && w.includes(t)));

function score(product, tokens) {
  const s = searchable(product);
  let total = 0;
  let hits = 0;
  for (const t of tokens) {
    let hit = 0;
    if (matches(s.name, t)) hit = 3;
    else if (matches(s.brand, t)) hit = 3;
    else if (matches(s.tags, t)) hit = 2;
    else if (matches(s.shop, t)) hit = 1;
    if (hit) hits += 1;
    total += hit;
  }
  return { total, hits };
}

export const suggestions = {
  b2c: [
    'Where can I buy original Samsung phones in Computer Village?',
    'Compare prices for HP laptops',
    'Show me a 256GB phone under ₦600k',
    "What's popular in Alaba International today?",
  ],
  b2b: [
    'Which shops in Alaba sell Nexus tyres at wholesale prices?',
    'Who supplies Ankara fabric in bulk?',
    'Compare bulk prices for power banks',
    'Wholesale rice in Onitsha',
  ],
};

export function askGuide(query, { isVendor, mode, b2cCatalog, b2bCatalog }) {
  const q = query.trim();
  const lower = q.toLowerCase();

  if (/^(hi|hello|hey|help|good (morning|afternoon|evening))\b/.test(lower) && lower.split(/\s+/).length < 4) {
    return {
      text: isVendor
        ? 'Hello! I can guide you through Africa’s markets. Ask me where to find a product — retail or wholesale — and I’ll take you to the exact shop.'
        : 'Hello! Ask me for any product and I’ll tell you which market, street and shop to find it in.',
      chips: suggestions[isVendor && mode === 'b2b' ? 'b2b' : 'b2c'],
    };
  }

  const marketId = MARKET_ALIASES.find(([re]) => re.test(lower))?.[1] || null;
  const market = markets.find((m) => m.id === marketId);
  const cap = parsePriceCap(q);
  const wantsWholesale = /wholesale|bulk|moq|dealer|distributor|supplier|supplies|supply/.test(lower);
  const wantsCompare = /compare|cheapest|lowest|best price/.test(lower);
  const wantsPopular = /popular|trending|best[- ]sell/.test(lower);

  // Vendors get wholesale results in the B2B community or when they ask for bulk pricing.
  const useWholesale = isVendor && (mode === 'b2b' || wantsWholesale);
  const pool = useWholesale ? (b2bCatalog || b2bProducts) : (b2cCatalog || b2cProducts);

  // strip market names and price phrases so only product words are left to match on
  let stripped = q.replace(/₦?\s*[\d,.]+\s*(k|m)\b/gi, ' ');
  for (const [re] of MARKET_ALIASES) stripped = stripped.replace(new RegExp(re.source, 'gi'), ' ');
  const tokens = tokenize(stripped).filter((t) => !STOP.has(t) && !/^\d+$/.test(t));

  let ranked = pool
    .map((p) => ({ p, ...score(p, tokens) }))
    .filter((r) => (tokens.length ? r.hits > 0 : true))
    .filter((r) => !market || locate(r.p.shopId).market.id === market.id)
    .filter((r) => {
      if (!cap) return true;
      const price = useWholesale ? r.p.tiers[0].price : r.p.price;
      return price <= cap;
    });

  if (wantsPopular && !useWholesale) ranked.sort((a, b) => b.p.sold7d - a.p.sold7d);
  else if (wantsCompare) ranked.sort((a, b) => priceOf(a.p, useWholesale) - priceOf(b.p, useWholesale));
  else ranked.sort((a, b) => b.total - a.total || b.hits - a.hits);

  ranked = ranked.slice(0, wantsCompare ? 5 : 4);

  const prefix =
    !isVendor && wantsWholesale
      ? 'Wholesale pricing is reserved for verified merchants — you can apply for a business account any time. Meanwhile, here are the retail options. '
      : '';

  if (!ranked.length) {
    return {
      text: `${prefix}I couldn’t find a match for that${market ? ` in ${market.short}` : ''}. Try naming a product or brand — for example “Samsung phone” or “solar panel” — and optionally a market.`,
      chips: suggestions[useWholesale ? 'b2b' : 'b2c'].slice(0, 3),
    };
  }

  const top = locate(ranked[0].p.shopId);
  const where = market ? ` in ${market.short}` : '';
  const text = wantsCompare
    ? `${prefix}Here’s a price comparison${where}, cheapest first.`
    : `${prefix}I found ${ranked.length} match${ranked.length > 1 ? 'es' : ''}${where}. Best match: walk in through ${top.market.short} → ${top.street.name} → ${top.plaza.name} and look for Shop ${top.shop.number} (${top.shop.name}).`;

  return {
    text,
    cards: ranked.map(({ p }, i) => {
      const loc = locate(p.shopId);
      return {
        id: p.id,
        name: p.name,
        price: useWholesale ? `${naira(p.tiers[0].price)} / ${p.unit} · MOQ ${p.moq}` : naira(p.price),
        trail: loc.trail,
        shopName: loc.shop.name,
        to: useWholesale ? `/b2b/product/${p.id}` : `/product/${p.id}`,
        shopTo: useWholesale ? `/b2b/shop/${loc.shop.id}` : null,
        lowest: wantsCompare && i === 0,
      };
    }),
  };
}

const priceOf = (p, wholesale) => (wholesale ? p.tiers[0].price : p.price);
