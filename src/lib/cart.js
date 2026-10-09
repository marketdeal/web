import { escrowFee } from './pricing';

export const cartKey = (productId, variant) => `${productId}|${variant || ''}`;

export function unitPriceOf(product, variantName) {
  const opt = product.variants?.options.find((o) => o.name === variantName);
  return product.price + (opt?.delta || 0);
}

/** Group cart lines by shop — each shop becomes its own escrow-protected order. `catalog` is the
 *  (merge-aware) retail product list to resolve line items against — pass `useStore().b2cCatalog`. */
export function groupCart(cart, catalog) {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const groups = new Map();
  for (const line of cart) {
    const product = byId.get(line.productId);
    if (!product) continue;
    const unitPrice = unitPriceOf(product, line.variant);
    const entry = { ...line, product, unitPrice, lineTotal: unitPrice * line.qty };
    if (!groups.has(product.shopId)) groups.set(product.shopId, { shopId: product.shopId, lines: [], subtotal: 0 });
    const g = groups.get(product.shopId);
    g.lines.push(entry);
    g.subtotal += entry.lineTotal;
  }
  return [...groups.values()];
}

export function priceGroups(groups, deliveryFee = 0) {
  const priced = groups.map((g) => {
    const escrow = escrowFee(g.subtotal);
    return { ...g, delivery: deliveryFee, escrow, total: g.subtotal + deliveryFee + escrow };
  });
  return {
    groups: priced,
    subtotal: priced.reduce((s, g) => s + g.subtotal, 0),
    delivery: priced.reduce((s, g) => s + g.delivery, 0),
    escrow: priced.reduce((s, g) => s + g.escrow, 0),
    total: priced.reduce((s, g) => s + g.total, 0),
  };
}
