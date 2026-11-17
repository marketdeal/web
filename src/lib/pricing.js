// Fee rules taken from the PRD (§9 monetisation, §4.5.4 invoicing).
export const VAT_RATE = 0.075; // wholesale invoices
export const ESCROW_RATE = 0.005; // 0.5%
export const ESCROW_CAP = 5000; // capped at ₦5,000 per transaction

export const escrowFee = (amount) => Math.min(Math.round(amount * ESCROW_RATE), ESCROW_CAP);

export const deliveryOptions = [
  { id: 'intra', label: 'Intra-city delivery', note: 'Kwik / Sendit · 1–2 days', fee: 2500 },
  { id: 'inter', label: 'Interstate delivery', note: 'GIG Logistics · 3–5 days', fee: 4800 },
  { id: 'pickup', label: 'Self-pickup at shop', note: 'Get a QR code to collect', fee: 0 },
];

// Payment gateways — each one offers its own methods (card, transfer, USSD…) on its checkout screen.
export const paymentGateways = [
  { id: 'paystack', label: 'Paystack', note: 'Card, bank transfer, USSD, bank account or QR' },
  { id: 'flutterwave', label: 'Flutterwave', note: 'Card, bank transfer, USSD, mobile money or Barter' },
];

/** Price per unit for a quantity, based on the product's tier table. Below MOQ returns the first tier. */
export function tierFor(product, qty) {
  let hit = product.tiers[0];
  for (const t of product.tiers) if (qty >= t.min) hit = t;
  return hit;
}

export const wholesaleTotals = (unitPrice, qty) => {
  const subtotal = unitPrice * qty;
  const vat = Math.round(subtotal * VAT_RATE);
  const escrow = escrowFee(subtotal);
  return { subtotal, vat, escrow, total: subtotal + vat + escrow };
};
