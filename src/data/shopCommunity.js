// Seed content for each market's customer community — the buyer-facing board. Separate from the
// dealer-to-dealer board in marketCommunity.js: merchants of the market post deals, new arrivals and
// tips for shoppers; buyers comment and ask questions; merchants answer. Buyers never see the
// dealer board. New posts/comments are created via StoreContext#createShopPost / #addShopComment.
//
// A comment/reply author is either a merchant (`shopId`) or a buyer (`buyerId` + `buyerName`).

const hoursAgo = (h) => Date.now() - h * 3600 * 1000;
const daysAgo = (d) => Date.now() - d * 86400 * 1000;

export const seedShopPosts = [
  {
    id: 'sp-cv-1', marketId: 'computer-village', shopId: 'zeetech', productId: 'p-03',
    text: 'Tecno Camon 30 Pro now ₦398,000 (was ₦430,000) while stock lasts. Every unit sealed with 12 months warranty — come test it at our shop in Pa Idowu Plaza or order on MarketDeal.',
    createdAt: hoursAgo(3),
    comments: [
      { id: 'sc-cv-1-1', buyerId: 'seed-buyer-1', buyerName: 'Tolu A.', text: 'Is the 512GB version also on discount?', createdAt: hoursAgo(2),
        replies: [{ id: 'sr-cv-1-1', shopId: 'zeetech', text: 'Yes — ₦443,000 for 512GB this week. Message us to reserve one.', createdAt: hoursAgo(1) }] },
    ],
  },
  {
    id: 'sp-cv-2', marketId: 'computer-village', shopId: 'kingsley', productId: 'p-06',
    text: 'Buying a MacBook in Computer Village? Always check the serial number on Apple’s site before paying, and ask for the box that matches it. Happy to verify any unit for you at our shop.',
    createdAt: daysAgo(1),
    comments: [
      { id: 'sc-cv-2-1', buyerId: 'seed-buyer-2', buyerName: 'Ngozi E.', text: 'Thank you for this, very helpful.', createdAt: hoursAgo(20), replies: [] },
    ],
  },
  {
    id: 'sp-al-1', marketId: 'alaba', shopId: 'sunbright', productId: 'p-18',
    text: 'Tired of NEPA? Our 3.5KVA inverter + 2 batteries runs a fridge, TV and fans through the night. Free installation within Lagos this month.',
    createdAt: hoursAgo(7),
    comments: [
      { id: 'sc-al-1-1', buyerId: 'seed-buyer-3', buyerName: 'Ibrahim S.', text: 'Do you install in Ikorodu?', createdAt: hoursAgo(5),
        replies: [{ id: 'sr-al-1-1', shopId: 'sunbright', text: 'Yes we do — installation in Ikorodu is free too.', createdAt: hoursAgo(4) }] },
    ],
  },
  {
    id: 'sp-al-2', marketId: 'alaba', shopId: 'prime-tyre', productId: 'p-29',
    text: 'Rainy season tip: check your tyre tread depth. Below 2mm, it’s time to change. Nexus 205/55R16 back in stock.',
    createdAt: daysAgo(2),
    comments: [],
  },
  {
    id: 'sp-tf-1', marketId: 'trade-fair', shopId: 'adire-house', productId: 'p-19',
    text: 'Fresh Ankara prints just in for the festive season 🎉 Six yards per piece, colourfast and soft. Planning aso-ebi for a group? Ask us about group orders.',
    createdAt: hoursAgo(4),
    comments: [
      { id: 'sc-tf-1-1', buyerId: 'seed-buyer-4', buyerName: 'Funmi O.', text: 'Can I get 12 pieces of the same design?', createdAt: hoursAgo(3),
        replies: [{ id: 'sr-tf-1-1', shopId: 'adire-house', text: 'Absolutely — send us a message with the design and we’ll confirm.', createdAt: hoursAgo(2) }] },
    ],
  },
  {
    id: 'sp-tf-2', marketId: 'trade-fair', shopId: 'bisi-fashion', productId: 'p-20',
    text: 'Senator suits made to measure in 5 days. Bring your style or pick from ours.',
    createdAt: daysAgo(1),
    comments: [],
  },
  {
    id: 'sp-ar-1', marketId: 'ariaria', shopId: 'aba-footwear', productId: 'p-23',
    text: 'Made in Aba, built to last. Our Urban Street Sneakers come in sizes 40–45 — new colours this week.',
    createdAt: hoursAgo(9),
    comments: [
      { id: 'sc-ar-1-1', buyerId: 'seed-buyer-5', buyerName: 'Chinedu K.', text: 'Do you have size 46?', createdAt: hoursAgo(6),
        replies: [{ id: 'sr-ar-1-1', shopId: 'aba-footwear', text: 'Not yet, but we can make a pair in 3 days. Message us.', createdAt: hoursAgo(5) }] },
    ],
  },
  {
    id: 'sp-ar-2', marketId: 'ariaria', shopId: 'leather-kings', productId: 'p-24',
    text: 'Genuine leather tote bags, hand-stitched in our workshop. Perfect gift for December.',
    createdAt: daysAgo(2),
    comments: [],
  },
  {
    id: 'sp-on-1', marketId: 'onitsha', shopId: 'nnamdi-foods', productId: 'p-25',
    text: 'Stock up before the December rush — 25kg Premium Parboiled Rice at ₦48,500. Stone-free and well polished.',
    createdAt: hoursAgo(5),
    comments: [
      { id: 'sc-on-1-1', buyerId: 'seed-buyer-6', buyerName: 'Amaka N.', text: 'Is the price the same if I buy 3 bags?', createdAt: hoursAgo(4),
        replies: [{ id: 'sr-on-1-1', shopId: 'nnamdi-foods', text: '3 bags go for ₦143,000. Message us to arrange delivery.', createdAt: hoursAgo(3) }] },
    ],
  },
  {
    id: 'sp-on-2', marketId: 'onitsha', shopId: 'beauty-bay', productId: 'p-27',
    text: 'Harmattan is coming — our raw shea butter body cream keeps your skin soft all day. 500g jars in stock.',
    createdAt: daysAgo(1),
    comments: [],
  },
];

// Canned merchant answers used to simulate the shop replying to a buyer's comment (no backend).
export const SHOP_REPLY_POOL = [
  'Thanks for asking! Yes, it’s available — send us a message and we’ll sort you out.',
  'Good question — message us and we’ll share more photos and the best price.',
  'We have it in stock. You can pay through MarketDeal escrow so you’re fully protected.',
  'Thank you! Come by the shop any time, or message us to arrange delivery.',
];
