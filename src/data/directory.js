// Spatial hierarchy: Market → Street/Lane → Plaza/Complex → Shop
// All names and figures are sample data for the prototype.

export const markets = [
  {
    id: 'computer-village',
    name: 'Computer Village',
    short: 'Computer Village',
    city: 'Ikeja',
    state: 'Lagos',
    emoji: '💻',
    hue: 214,
    focus: 'Phones · Laptops · Accessories',
    tagline: "Africa's largest ICT trading hub",
    description:
      'The beating heart of Nigeria’s gadget trade. Dealers here move thousands of phones, laptops and accessories every single day.',
    association: 'Computer Village Dealers Association',
    hours: 'Mon–Sat · 8:00am – 6:00pm',
    announcement: 'New verified-dealer badge rollout starts Monday for all Pa Idowu Plaza shops.',
  },
  {
    id: 'alaba',
    name: 'Alaba International Market',
    short: 'Alaba International',
    city: 'Ojo',
    state: 'Lagos',
    emoji: '📺',
    hue: 268,
    focus: 'Electronics · Appliances · Solar · Tyres',
    tagline: 'West Africa’s biggest electronics & appliance market',
    description:
      'From TVs and air-conditioners to solar systems and tyres — Alaba International supplies traders across the whole sub-region.',
    association: 'Alaba International Traders Association',
    hours: 'Mon–Sat · 8:00am – 5:30pm',
    announcement: 'Bulk solar panel import prices updated this week — check Rago Plaza for new tiers.',
  },
  {
    id: 'trade-fair',
    name: 'Trade Fair Complex',
    short: 'Trade Fair',
    city: 'Ojo',
    state: 'Lagos',
    emoji: '🧵',
    hue: 340,
    focus: 'Fabrics · Fashion · Building Materials · Home',
    tagline: 'A city of textiles, fashion and building supplies',
    description:
      'A sprawling complex of halls and boulevards where fabric merchants, fashion houses and hardware dealers do business at scale.',
    association: 'Trade Fair Complex Traders Union',
    hours: 'Mon–Sat · 8:30am – 6:00pm',
    announcement: 'Festive-season Ankara collections now landing at Textile Hall.',
  },
  {
    id: 'ariaria',
    name: 'Ariaria International Market',
    short: 'Ariaria',
    city: 'Aba',
    state: 'Abia',
    emoji: '👞',
    hue: 28,
    focus: 'Footwear · Leather · Garments · Plastics',
    tagline: 'Made-in-Aba — Nigeria’s manufacturing market',
    description:
      'The home of Aba-made shoes, leather goods, garments and plastics. Buy direct from the workshops and factories that supply the country.',
    association: 'Ariaria Market Traders Association',
    hours: 'Mon–Sat · 7:30am – 5:30pm',
    announcement: 'Factory-direct MOQ pricing now available for all Shoe Line shops.',
  },
  {
    id: 'onitsha',
    name: 'Onitsha Main Market',
    short: 'Onitsha Main Market',
    city: 'Onitsha',
    state: 'Anambra',
    emoji: '🛍️',
    hue: 152,
    focus: 'Provisions · Beauty · Wrappers · General Goods',
    tagline: 'One of the largest markets in Africa by volume',
    description:
      'A legendary river-port market where provisions, cosmetics and traditional wrappers are traded in bulk to every corner of the country.',
    association: 'Onitsha Main Market Traders Association',
    hours: 'Mon–Sat · 7:00am – 5:00pm',
    announcement: 'Iweka Road provisions dealers now accept escrow-protected bulk orders.',
  },
];

export const streets = [
  { id: 'cv-idowu', marketId: 'computer-village', name: 'Idowu Lane', description: 'Phones and laptops — the busiest lane in the market.' },
  { id: 'cv-otigba', marketId: 'computer-village', name: 'Otigba Street', description: 'Audio, accessories and power gadgets.' },
  { id: 'al-rago', marketId: 'alaba', name: 'Rago Street', description: 'TVs, appliances and solar power dealers.' },
  { id: 'al-tyre', marketId: 'alaba', name: 'Tyre & Auto Lane', description: 'Tyres, batteries, oils and auto spares.' },
  { id: 'tf-blvd-a', marketId: 'trade-fair', name: 'Boulevard A', description: 'Fabrics, fashion houses and tailoring supplies.' },
  { id: 'tf-blvd-c', marketId: 'trade-fair', name: 'Boulevard C', description: 'Building materials and home furnishings.' },
  { id: 'ar-shoe', marketId: 'ariaria', name: 'Shoe Line', description: 'Aba-made footwear, direct from the workshops.' },
  { id: 'ar-factory', marketId: 'ariaria', name: 'Factory & Garment Row', description: 'Plastics, leather goods and garments.' },
  { id: 'on-iweka', marketId: 'onitsha', name: 'Iweka Road', description: 'Provisions, foodstuff and beauty products.' },
  { id: 'on-market', marketId: 'onitsha', name: 'New Market Road', description: 'Traditional wrappers and lace.' },
];

export const plazas = [
  { id: 'pl-pa-idowu', streetId: 'cv-idowu', name: 'Pa Idowu Plaza', floors: 3, description: 'A three-storey plaza packed with phone and tablet dealers.' },
  { id: 'pl-hilltop', streetId: 'cv-idowu', name: 'Hilltop Plaza', floors: 2, description: 'Laptop and computer specialists.' },
  { id: 'pl-otigba-tech', streetId: 'cv-otigba', name: 'Otigba Tech Plaza', floors: 2, description: 'Audio gear and gadget accessories.' },
  { id: 'pl-gold-cross', streetId: 'cv-otigba', name: 'Gold Cross Complex', floors: 4, description: 'Power banks, batteries and charging solutions.' },
  { id: 'pl-rago-plaza', streetId: 'al-rago', name: 'Rago Plaza', floors: 3, description: 'Televisions and solar power systems.' },
  { id: 'pl-rago-mall', streetId: 'al-rago', name: 'Rago Mall', floors: 2, description: 'Air-conditioners, freezers and home appliances.' },
  { id: 'pl-tyre-house', streetId: 'al-tyre', name: 'Tyre House Complex', floors: 1, description: 'Car and truck tyres — new and premium used.' },
  { id: 'pl-auto-parts', streetId: 'al-tyre', name: 'Auto Parts Plaza', floors: 2, description: 'Batteries, brake parts and engine oils.' },
  { id: 'pl-textile-hall', streetId: 'tf-blvd-a', name: 'Textile Hall', floors: 2, description: 'Ankara, adire and men’s fashion fabrics.' },
  { id: 'pl-hardware', streetId: 'tf-blvd-c', name: 'Hardware Plaza', floors: 1, description: 'Roofing, tiles and paints.' },
  { id: 'pl-furnish', streetId: 'tf-blvd-c', name: 'Furnishing Complex', floors: 3, description: 'Mattresses, cookware and home décor.' },
  { id: 'pl-shoe-complex', streetId: 'ar-shoe', name: 'Shoe Line Complex', floors: 2, description: 'Sneakers, sandals and casual shoes.' },
  { id: 'pl-leather', streetId: 'ar-factory', name: 'Leather Plaza', floors: 2, description: 'Handcrafted loafers, belts and bags.' },
  { id: 'pl-factory-outlet', streetId: 'ar-factory', name: 'Factory Outlet Plaza', floors: 1, description: 'Manufacturer-direct plastics and household goods.' },
  { id: 'pl-garment', streetId: 'ar-factory', name: 'Garment Hall', floors: 2, description: 'Polos, tees and school uniforms.' },
  { id: 'pl-provisions', streetId: 'on-iweka', name: 'Iweka Provisions Plaza', floors: 2, description: 'Rice, oils, noodles and other foodstuff.' },
  { id: 'pl-cosmetics', streetId: 'on-iweka', name: 'Cosmetics Plaza', floors: 2, description: 'Body care, creams and hair products.' },
  { id: 'pl-wrapper', streetId: 'on-market', name: 'Wrapper Plaza', floors: 2, description: 'George wrappers, lace and aso-ebi fabrics.' },
];

// kyc: 2 = Merchant, 3 = Verified Dealer (verified badge), 4 = Enterprise
export const shops = [
  { id: 'zeetech', plazaId: 'pl-pa-idowu', number: 'B2', name: 'Zeetech Mobile Hub', owner: 'Chinedu Eze', category: 'Phones & Tablets', rating: 4.8, reviews: 1284, kyc: 3, since: 2014, phone: '0803 555 0142', hours: '8:00am – 6:00pm', emoji: '📱', hue: 214, blurb: 'Brand-new phones from Samsung, Tecno, Infinix and Apple with manufacturer warranty.' },
  { id: 'nexa', plazaId: 'pl-pa-idowu', number: 'C7', name: 'Nexa Gadgets & Accessories', owner: 'Ngozi Nwosu', category: 'Accessories', rating: 4.6, reviews: 642, kyc: 3, since: 2016, phone: '0806 555 0187', hours: '8:30am – 6:00pm', emoji: '🔌', hue: 199, blurb: 'Cases, chargers, cables and audio accessories — retail and bulk.' },
  { id: 'kingsley', plazaId: 'pl-hilltop', number: 'F1', name: 'Kingsley Computers Ltd', owner: 'Kingsley Okoro', category: 'Laptops & Computing', rating: 4.7, reviews: 903, kyc: 4, since: 2011, phone: '0802 555 0119', hours: '8:00am – 6:30pm', emoji: '💻', hue: 224, blurb: 'Authorised reseller of HP, Dell, Lenovo and Apple laptops.' },
  { id: 'soundwave', plazaId: 'pl-otigba-tech', number: 'D3', name: 'SoundWave Audio', owner: 'Tunde Bakare', category: 'Audio', rating: 4.5, reviews: 418, kyc: 3, since: 2017, phone: '0810 555 0164', hours: '9:00am – 6:00pm', emoji: '🎧', hue: 250, blurb: 'Speakers, headphones and earbuds from JBL, Sony and more.' },
  { id: 'chidi-power', plazaId: 'pl-gold-cross', number: 'A9', name: 'Chidi Power Solutions', owner: 'Chidi Anozie', category: 'Power & Batteries', rating: 4.4, reviews: 356, kyc: 2, since: 2019, phone: '0813 555 0128', hours: '8:00am – 5:30pm', emoji: '🔋', hue: 172, blurb: 'Power banks, chargers and portable power for every device.' },

  { id: 'emeka-tv', plazaId: 'pl-rago-plaza', number: 'R14', name: 'Emeka Electronics World', owner: 'Emeka Nwachukwu', category: 'TVs & Electronics', rating: 4.7, reviews: 1120, kyc: 4, since: 2010, phone: '0805 555 0173', hours: '8:00am – 5:30pm', emoji: '📺', hue: 268, blurb: 'Smart TVs, home theatre and displays at true Alaba prices.' },
  { id: 'sunbright', plazaId: 'pl-rago-plaza', number: 'R22', name: 'SunBright Solar & Power', owner: 'Ifeanyi Obi', category: 'Solar & Power', rating: 4.6, reviews: 587, kyc: 3, since: 2015, phone: '0809 555 0135', hours: '8:00am – 5:30pm', emoji: '☀️', hue: 45, blurb: 'Complete solar systems, panels and inverters with installation support.' },
  { id: 'coolair', plazaId: 'pl-rago-mall', number: 'M5', name: 'CoolAir Appliances', owner: 'Amaka Uzor', category: 'Home Appliances', rating: 4.5, reviews: 473, kyc: 3, since: 2013, phone: '0807 555 0152', hours: '8:30am – 5:30pm', emoji: '❄️', hue: 195, blurb: 'ACs, freezers and refrigerators — genuine and warrantied.' },
  { id: 'prime-tyre', plazaId: 'pl-tyre-house', number: 'T3', name: 'Prime Tyre Depot', owner: 'Ogechi Madu', category: 'Tyres', rating: 4.8, reviews: 731, kyc: 4, since: 2012, phone: '0803 555 0196', hours: '7:30am – 5:30pm', emoji: '🛞', hue: 220, blurb: 'Car, SUV and truck tyres from top brands, supplied in bulk to fleets.' },
  { id: 'ogbonna-auto', plazaId: 'pl-auto-parts', number: 'P8', name: 'Ogbonna Auto Parts', owner: 'Sunday Ogbonna', category: 'Auto Parts', rating: 4.6, reviews: 509, kyc: 3, since: 2009, phone: '0812 555 0108', hours: '8:00am – 5:30pm', emoji: '🚗', hue: 12, blurb: 'Genuine and OEM spares, batteries and lubricants.' },

  { id: 'adire-house', plazaId: 'pl-textile-hall', number: 'H4', name: 'Adire & Ankara House', owner: 'Folake Adebayo', category: 'Fabrics', rating: 4.7, reviews: 866, kyc: 3, since: 2008, phone: '0802 555 0181', hours: '8:30am – 6:00pm', emoji: '🧵', hue: 336, blurb: 'Premium Ankara wax prints and hand-dyed adire, by the yard or by the bale.' },
  { id: 'bisi-fashion', plazaId: 'pl-textile-hall', number: 'H11', name: 'Bisi Fashion Mart', owner: 'Bisi Oyelaran', category: 'Fashion', rating: 4.5, reviews: 392, kyc: 2, since: 2018, phone: '0816 555 0139', hours: '9:00am – 6:00pm', emoji: '👔', hue: 300, blurb: 'Ready-to-wear senator suits and men’s traditional wear.' },
  { id: 'tf-build', plazaId: 'pl-hardware', number: 'W2', name: 'Trade Fair Building Supplies', owner: 'Hakeem Salisu', category: 'Building Materials', rating: 4.6, reviews: 428, kyc: 4, since: 2006, phone: '0805 555 0114', hours: '7:30am – 5:30pm', emoji: '🧱', hue: 18, blurb: 'Roofing sheets, tiles and paints for contractors and developers.' },
  { id: 'homestyle', plazaId: 'pl-furnish', number: 'F6', name: 'HomeStyle Furnishings', owner: 'Blessing Ikpe', category: 'Home & Living', rating: 4.5, reviews: 514, kyc: 3, since: 2015, phone: '0808 555 0176', hours: '9:00am – 6:00pm', emoji: '🛏️', hue: 160, blurb: 'Mattresses, cookware and home essentials.' },

  { id: 'aba-footwear', plazaId: 'pl-shoe-complex', number: 'S10', name: 'Aba Footwear Co.', owner: 'Nkechi Ihejirika', category: 'Footwear', rating: 4.6, reviews: 652, kyc: 3, since: 2012, phone: '0803 555 0121', hours: '7:30am – 5:30pm', emoji: '👟', hue: 24, blurb: 'Factory-direct sneakers and casual shoes made in Aba.' },
  { id: 'leather-kings', plazaId: 'pl-leather', number: 'L3', name: 'Leather Kings', owner: 'Obinna Kalu', category: 'Leather Goods', rating: 4.8, reviews: 478, kyc: 3, since: 2010, phone: '0807 555 0163', hours: '8:00am – 5:30pm', emoji: '👜', hue: 32, blurb: 'Handcrafted loafers, belts and bags in genuine leather.' },
  { id: 'uche-plastics', plazaId: 'pl-factory-outlet', number: 'FO1', name: 'Uche Plastics Ltd', owner: 'Uche Okeke', category: 'Plastics', rating: 4.7, reviews: 312, kyc: 4, since: 2005, phone: '0812 555 0147', hours: '7:30am – 5:00pm', emoji: '🪑', hue: 200, blurb: 'Aba-based manufacturer of furniture, tanks and household plastics.' },
  { id: 'ariaria-garments', plazaId: 'pl-garment', number: 'G7', name: 'Ariaria Garments Hub', owner: 'Chioma Eberechi', category: 'Garments', rating: 4.4, reviews: 287, kyc: 3, since: 2016, phone: '0809 555 0105', hours: '8:00am – 5:30pm', emoji: '👕', hue: 96, blurb: 'Polos, tees and uniforms — printed or plain, from 50 pieces.' },

  { id: 'nnamdi-foods', plazaId: 'pl-provisions', number: 'P5', name: 'Nnamdi Provisions & Foods', owner: 'Nnamdi Ejike', category: 'Groceries', rating: 4.7, reviews: 1043, kyc: 4, since: 2004, phone: '0806 555 0158', hours: '7:00am – 5:00pm', emoji: '🍚', hue: 48, blurb: 'Rice, oils and noodles supplied to retailers across the South-East.' },
  { id: 'beauty-bay', plazaId: 'pl-cosmetics', number: 'C2', name: 'Beauty Bay Onitsha', owner: 'Ifunanya Obi', category: 'Beauty & Care', rating: 4.5, reviews: 561, kyc: 3, since: 2017, phone: '0810 555 0192', hours: '8:00am – 5:00pm', emoji: '🧴', hue: 320, blurb: 'Genuine body-care and cosmetics — retail and bulk supply.' },
  { id: 'wrapper-emporium', plazaId: 'pl-wrapper', number: 'W9', name: 'Okonkwo Wrapper Emporium', owner: 'Ebele Okonkwo', category: 'Fabrics', rating: 4.8, reviews: 705, kyc: 3, since: 2007, phone: '0802 555 0170', hours: '7:30am – 5:00pm', emoji: '🎀', hue: 285, blurb: 'George wrappers, French lace and aso-ebi fabrics.' },
];

// ---- lookups ---------------------------------------------------------------

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
export const marketById = byId(markets);
export const streetById = byId(streets);
export const plazaById = byId(plazas);
export const shopById = byId(shops);

export const streetsOfMarket = (marketId) => streets.filter((s) => s.marketId === marketId);
export const plazasOfStreet = (streetId) => plazas.filter((p) => p.streetId === streetId);
export const shopsOfPlaza = (plazaId) => shops.filter((s) => s.plazaId === plazaId);
export const shopsOfMarket = (marketId) =>
  shops.filter((s) => locate(s.id).market.id === marketId);
export const plazasOfMarket = (marketId) =>
  plazas.filter((p) => streetById[p.streetId].marketId === marketId);

/** Resolve the full spatial path for a shop. */
export function locate(shopId) {
  const shop = shopById[shopId];
  const plaza = plazaById[shop.plazaId];
  const street = streetById[plaza.streetId];
  const market = marketById[street.marketId];
  return {
    shop,
    plaza,
    street,
    market,
    // "Shop B2, Pa Idowu Plaza, Idowu Lane, Computer Village"
    label: `Shop ${shop.number}, ${plaza.name}, ${street.name}, ${market.short}`,
    short: `${plaza.name}, ${market.short}`,
    trail: `${market.short} › ${street.name} › ${plaza.name} › Shop ${shop.number}`,
  };
}

export const yearsInOperation = (shop) => new Date().getFullYear() - shop.since;

/**
 * Adds a merchant-created shop to the live directory. `shops` and `shopById` are plain mutable
 * bindings and every helper above filters them fresh on each call, so pushing here is picked up
 * everywhere immediately (spatial nav, search, counts) with no other code changes. Safe to call
 * again for a shop that's already registered — used to rehydrate on every load, since this
 * in-memory directory resets on refresh and the caller persists the shop list separately. On a
 * repeat call (e.g. after a KYC level changes) it also mirrors any field changes onto the already-
 * registered object in place, so things like a flipped "Verified Dealer" badge show up immediately
 * without needing a separate update path.
 */
export function registerVendorShop(shop) {
  const existing = shopById[shop.id];
  if (!existing) {
    shops.push(shop);
    shopById[shop.id] = shop;
    return shop;
  }
  if (existing !== shop) Object.assign(existing, shop);
  return existing;
}
