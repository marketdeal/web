// Escrow state machine (PRD §4.7). Simplified for the prototype:
// FUNDED → IN_TRANSIT → DELIVERED → RELEASED, with DISPUTED → REFUNDED | RELEASED as the side path.
export const ESCROW = {
  FUNDED: { label: 'Escrow funded', tone: 'blue', text: 'Payment is held safely by MarketDeal. The merchant has been asked to dispatch.' },
  IN_TRANSIT: { label: 'In transit', tone: 'orange', text: 'The merchant has shipped your order. Funds stay in escrow until you confirm delivery.' },
  DELIVERED: { label: 'Delivered', tone: 'green', text: 'Delivery confirmed. Please confirm receipt — otherwise funds auto-release after 72 hours.' },
  RELEASED: { label: 'Funds released', tone: 'green', text: 'You confirmed receipt and the merchant has been paid. Thank you!' },
  DISPUTED: { label: 'In dispute', tone: 'red', text: 'Funds are frozen while a MarketDeal mediator reviews both sides. Both parties have 48 hours to add evidence.' },
  REFUNDED: { label: 'Refunded', tone: 'gray', text: 'The mediator ruled in your favour and the funds were returned to you.' },
  // Set by the MarketDeal Admin platform when a mediator splits the funds between the two sides.
  PARTIAL_REFUND: { label: 'Partially refunded', tone: 'gray', text: 'The mediator split the funds — part was returned to you and the rest was released to the merchant.' },
};

export const TIMELINE = [
  { state: 'FUNDED', label: 'Paid & escrow funded' },
  { state: 'IN_TRANSIT', label: 'Shipped' },
  { state: 'DELIVERED', label: 'Delivered' },
  { state: 'RELEASED', label: 'Funds released' },
];

export const stepIndex = (state) => {
  if (state === 'DISPUTED' || state === 'REFUNDED' || state === 'PARTIAL_REFUND') return -1;
  return TIMELINE.findIndex((t) => t.state === state);
};

export const AUTO_RELEASE_MS = 72 * 3600 * 1000;
export const EXTEND_MS = 48 * 3600 * 1000;

export const couriers = ['GIG Logistics', 'Kwik Delivery', 'Sendbox', 'Sendit'];
