// Seed content for each market's merchant community board — a WhatsApp-group-style feed
// restricted to merchants trading in that specific market. New posts/comments are created via
// StoreContext#createPost / #addComment and persisted alongside this seed data.

const hoursAgo = (h) => Date.now() - h * 3600 * 1000;
const daysAgo = (d) => Date.now() - d * 86400 * 1000;

export const seedMarketPosts = [
  {
    id: 'cp-cv-1', productId: 'w-01', marketId: 'computer-village', shopId: 'zeetech', pending: null,
    text: 'Fresh container of Tecno Spark 20 just landed — great quality for wholesale buyers. Come through to Pa Idowu Plaza.',
    createdAt: hoursAgo(5),
    comments: [
      { id: 'cc-cv-1-1', shopId: 'nexa', text: 'Nice one! How many per carton this time?', createdAt: hoursAgo(4) },
      { id: 'cc-cv-1-2', shopId: 'kingsley', text: 'Congrats! Will send my guy over this week.', createdAt: hoursAgo(3) },
    ],
  },
  {
    id: 'cp-cv-2', marketId: 'computer-village', shopId: 'soundwave', pending: null,
    text: 'Any dealer with a reliable line on JBL replacement parts? A customer needs a charging port repaired.',
    createdAt: daysAgo(1),
    comments: [
      { id: 'cc-cv-2-1', shopId: 'chidi-power', text: 'Try the guys two shops down from Gold Cross, they fixed mine last month.', createdAt: hoursAgo(20) },
    ],
  },
  {
    id: 'cp-al-1', productId: 'w-13', marketId: 'alaba', shopId: 'sunbright', pending: null,
    text: 'Solar panel prices adjusted slightly this week with the exchange rate, but bulk buyers still get our best rate.',
    createdAt: hoursAgo(8),
    comments: [
      { id: 'cc-al-1-1', shopId: 'emeka-tv', text: 'Thanks for the heads up, will factor that into my quotes.', createdAt: hoursAgo(6) },
    ],
  },
  {
    id: 'cp-al-2', productId: 'w-14', marketId: 'alaba', shopId: 'prime-tyre', pending: null,
    text: 'New shipment of 205/55R16 just landed at Tyre House Complex — wholesale pricing is live.',
    createdAt: daysAgo(2),
    comments: [
      { id: 'cc-al-2-1', shopId: 'ogbonna-auto', text: 'Perfect timing, I have three fleet customers asking for that size.', createdAt: daysAgo(2) + 3600000 },
    ],
  },
  {
    id: 'cp-tf-1', productId: 'w-17', marketId: 'trade-fair', shopId: 'adire-house', pending: null,
    text: 'New Ankara designs just arrived ahead of the festive season — come see the fresh patterns at Textile Hall.',
    createdAt: hoursAgo(3),
    comments: [
      { id: 'cc-tf-1-1', shopId: 'bisi-fashion', text: 'These look great, sending a few customers your way.', createdAt: hoursAgo(2) },
    ],
  },
  {
    id: 'cp-tf-2', productId: 'w-20', marketId: 'trade-fair', shopId: 'tf-build', pending: null,
    text: 'Special pricing on roofing sheets this week for contractors buying in bulk.',
    createdAt: daysAgo(1),
    comments: [
      { id: 'cc-tf-2-1', shopId: 'homestyle', text: 'Good deal — will mention it to my client doing the estate project.', createdAt: hoursAgo(18) },
    ],
  },
  {
    id: 'cp-ar-1', productId: 'w-22', marketId: 'ariaria', shopId: 'aba-footwear', pending: null,
    text: 'Our newest batch of sneakers just came off the line — quality keeps improving. Wholesale buyers welcome at Shoe Line Complex.',
    createdAt: hoursAgo(6),
    comments: [
      { id: 'cc-ar-1-1', shopId: 'leather-kings', text: 'Looking sharp! Will stop by this week.', createdAt: hoursAgo(4) },
    ],
  },
  {
    id: 'cp-ar-2', productId: 'w-27', marketId: 'ariaria', shopId: 'uche-plastics', pending: null,
    text: 'Water tank production is up this month, so lead times are shorter than usual — good time to restock.',
    createdAt: daysAgo(1),
    comments: [
      { id: 'cc-ar-2-1', shopId: 'ariaria-garments', text: 'Noted, might place an order for the new shop.', createdAt: hoursAgo(15) },
    ],
  },
  {
    id: 'cp-on-1', productId: 'w-28', marketId: 'onitsha', shopId: 'nnamdi-foods', pending: null,
    text: 'Rice prices are stable this week — good time to stock up before the December rush starts.',
    createdAt: hoursAgo(4),
    comments: [
      { id: 'cc-on-1-1', shopId: 'beauty-bay', text: 'Appreciate the update, will place a bulk order Monday.', createdAt: hoursAgo(3) },
    ],
  },
  {
    id: 'cp-on-2', productId: 'w-19', marketId: 'onitsha', shopId: 'wrapper-emporium', pending: null,
    text: 'New George wrapper designs just arrived — beautiful patterns for the wedding season.',
    createdAt: daysAgo(2),
    comments: [
      { id: 'cc-on-2-1', shopId: 'nnamdi-foods', text: 'Gorgeous! My customers will love these.', createdAt: daysAgo(2) + 5400000 },
    ],
  },
];

// Product each seed post is about — used as a fallback for posts saved before product tagging existed.
export const SEED_POST_PRODUCTS = Object.fromEntries(seedMarketPosts.filter((p) => p.productId).map((p) => [p.id, p.productId]));

// Canned replies used to simulate another market member responding to a post/comment — keeps the
// board feeling alive without a backend. Picked at random when a reply comes due.
export const REPLY_POOL = [
  'Nice one! Will check it out this week.',
  'Thanks for sharing — good to know.',
  'How much are you letting it go for in bulk?',
  'Perfect timing, I have a customer asking for exactly this.',
  'Appreciate the update, chairman.',
  'Looks good — sending a buyer your way.',
  'Noted. Let me know if stock runs low.',
  'This is useful, thanks for posting.',
];
