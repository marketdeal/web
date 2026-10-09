// Sample "open community" activity for the wholesale side.
export const communityPosts = [
  { id: 'c1', kind: 'rfq', who: 'Fatima Bello', role: 'Phone distributor · Kano', marketId: 'computer-village', text: 'Looking for 300 × Tecno Spark 20 (128GB), delivery to Kano within 7 days. Escrow only.', ago: '12 min ago', replies: 4 },
  { id: 'c2', kind: 'restock', who: 'Prime Tyre Depot', role: 'Verified dealer · Alaba', marketId: 'alaba', text: 'Fresh container of 205/55R16 landed. Tiered pricing updated — 200+ pieces now ₦71,500.', ago: '48 min ago', replies: 9 },
  { id: 'c3', kind: 'rfq', who: 'Emeka Obiora', role: 'Building contractor · Enugu', marketId: 'trade-fair', text: 'Need 2,500 aluminium roofing sheets 0.55mm, delivery to Enugu site. Who can quote?', ago: '1 hr ago', replies: 6 },
  { id: 'c4', kind: 'announcement', who: 'Ariaria Market Association', role: 'Market admin', marketId: 'ariaria', text: 'Shoe Line traders: verification drive this Friday. Bring your CAC documents to the association office.', ago: '3 hrs ago', replies: 2 },
  { id: 'c5', kind: 'restock', who: 'Nnamdi Provisions & Foods', role: 'Verified dealer · Onitsha', marketId: 'onitsha', text: '50kg parboiled rice now ₦77,500 for 400+ bags. Truck loads leave Onitsha every Tuesday and Friday.', ago: '5 hrs ago', replies: 11 },
  { id: 'c6', kind: 'rfq', who: 'Blessing Ade', role: 'Boutique owner · Ibadan', marketId: 'trade-fair', text: 'Seeking 100 pieces of Ankara wax print (6 yards) — bright, festive designs only.', ago: 'Yesterday', replies: 7 },
];

export const announcementKinds = {
  rfq: { label: 'Buying request', tone: 'orange' },
  restock: { label: 'Restock', tone: 'green' },
  announcement: { label: 'Association', tone: 'blue' },
};
