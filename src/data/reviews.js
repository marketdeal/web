const pool = [
  { name: 'Adaeze O.', city: 'Lagos', rating: 5, text: 'Exactly as described. The escrow gave me peace of mind and the seller shipped the same day.' },
  { name: 'Ibrahim S.', city: 'Kano', rating: 5, text: 'Genuine product, well packaged. Delivery to Kano took 3 days. Will order again.' },
  { name: 'Ngozi E.', city: 'Enugu', rating: 4, text: 'Very good quality for the price. Delivery was a day later than promised but the merchant kept me updated on chat.' },
  { name: 'Tunde A.', city: 'Ibadan', rating: 5, text: 'I was scared of counterfeits but the verified badge on this shop made the difference. 100% original.' },
  { name: 'Chiamaka U.', city: 'Port Harcourt', rating: 4, text: 'Good value. Seller responded quickly to my questions before I bought.' },
  { name: 'Musa B.', city: 'Abuja', rating: 5, text: 'Much cheaper than what I found in stores near me, and I could see exactly where the shop is in the market.' },
  { name: 'Folake R.', city: 'Lagos', rating: 5, text: 'Fast delivery, neat packaging. The tracking updates were spot on.' },
  { name: 'Emeka N.', city: 'Onitsha', rating: 4, text: 'Solid. Exactly what I needed and the price was fair.' },
];

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function reviewsFor(productId) {
  const h = hash(productId);
  return [0, 3, 5].map((offset, i) => ({
    ...pool[(h + offset) % pool.length],
    id: `${productId}-r${i}`,
    daysAgo: 2 + ((h + i * 7) % 40),
    verified: true,
  }));
}
