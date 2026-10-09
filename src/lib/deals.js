// Merchant-to-merchant deal chat helpers. There is no backend, so the other dealer's side of the
// conversation is simulated: one reply arrives a few seconds after each message you send.

export const DEAL_REPLY_DELAY_MS = 3500;

const GENERIC = [
  'Good day! Yes, we can do business. What quantity are you looking at?',
  'Price is negotiable for serious volume — tell me your target and we’ll talk.',
  'We can arrange delivery to your shop, or you can send your boy to pick up.',
  'Let’s agree it here, then you can call me to settle payment and pickup.',
  'Deal. Send me your shop address and I’ll confirm the delivery date.',
];

/** The simulated reply to the latest message in a thread — references what you sent about. */
export function dealReply(chat) {
  const mine = chat.messages.filter((m) => m.from === 'me');
  const last = mine[mine.length - 1];
  const theirs = chat.messages.filter((m) => m.from === 'them').length;
  if (last?.ref?.kind === 'post' && theirs === 0) {
    return 'Thanks for reaching out about my post! Yes, it’s still available — how many do you need, and where are you based?';
  }
  if (last?.ref?.kind === 'product' && theirs === 0) {
    return `Yes, “${last.ref.name}” is available. How many ${last.ref.unit ? `${last.ref.unit}s` : 'units'} do you need? We can agree price and delivery between us.`;
  }
  return GENERIC[theirs % GENERIC.length];
}

/** Reference snapshots stored on a message — kept small (no photos) since everything lives in localStorage. */
export const productRef = (p) => ({ kind: 'product', id: p.id, name: p.name, emoji: p.emoji, hue: p.hue, unit: p.unit, price: p.tiers?.[0]?.price ?? null });

export const postRef = (post) => ({
  kind: 'post',
  id: post.id,
  marketId: post.marketId,
  text: (post.text || '').slice(0, 160),
  hasPhoto: !!post.image,
  hasVideo: !!post.video,
  createdAt: post.createdAt,
});
