import { shopById } from '../data/directory';

// Turns a merchant's submission (from pages/ProductForm) into the same shape as the static sample
// catalogue, so it can be merged straight into b2cProducts / b2bProducts wherever those are read.

const tagify = (name, categoryLabel) =>
  [...new Set(`${name} ${categoryLabel || ''}`.toLowerCase().split(/\s+/).filter((w) => w.length > 1))];

// Condition is entered once and shown as the first row of the specs table (same place the static
// sample data puts it, e.g. the "UK Used" listings) — no separate rendering path needed anywhere.
const specsWithCondition = (p) => [
  ...(p.condition ? [['Condition', p.condition]] : []),
  ...(p.specRows || []).filter((s) => s.key?.trim() && s.value?.trim()).map((s) => [s.key.trim(), s.value.trim()]),
];

export function toRetailShape(p) {
  return {
    id: 'up-' + p.id,
    shopId: p.shopId,
    category: p.categoryRetail,
    name: p.name,
    brand: shopById[p.shopId]?.name || p.name,
    price: p.price,
    oldPrice: p.oldPrice || null,
    rating: 0,
    reviews: 0,
    stock: p.stockRetail,
    emoji: p.emoji,
    hue: p.hue,
    sold7d: 0,
    daysAgo: Math.max(0, Math.floor((Date.now() - p.createdAt) / 86400000)),
    tags: tagify(p.name, p.categoryRetail),
    blurb: p.blurb,
    description: p.description || '',
    specs: specsWithCondition(p),
    condition: p.condition || null,
    variants: p.variants || undefined,
    isUserSubmitted: true,
    status: p.status,
    rejectReason: p.rejectReason || null,
    recordId: p.id,
  };
}

export function toWholesaleShape(p) {
  const sorted = [...p.tiers].sort((a, b) => a.min - b.min);
  const tiers = sorted.map((t, i) => ({ min: t.min, price: t.price, max: sorted[i + 1] ? sorted[i + 1].min - 1 : null }));
  return {
    id: 'uw-' + p.id,
    shopId: p.shopId,
    category: p.categoryWholesale,
    name: p.name,
    brand: shopById[p.shopId]?.name || p.name,
    unit: p.unit,
    retail: p.refRetailPrice,
    tiers,
    moq: p.moq,
    stock: p.stockWholesale,
    leadDays: p.leadDays,
    emoji: p.emoji,
    hue: p.hue,
    tags: tagify(p.name, p.categoryWholesale),
    blurb: p.blurb,
    description: p.description || '',
    specs: specsWithCondition(p),
    condition: p.condition || null,
    isUserSubmitted: true,
    status: p.status,
    rejectReason: p.rejectReason || null,
    recordId: p.id,
  };
}
