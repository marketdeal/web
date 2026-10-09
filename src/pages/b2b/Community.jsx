import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, Loader2, Lock, MessageCircle, MessagesSquare, Search, Send, SlidersHorizontal, Tag, Users, Video, X } from 'lucide-react';
import { Breadcrumb, EmptyState, Modal, Visual } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { locate, marketById, shopById, shopsOfMarket } from '../../data/directory';
import { SEED_POST_PRODUCTS } from '../../data/marketCommunity';
import { plural, timeAgo } from '../../lib/format';
import { discardMedia, readMediaFile, releasePreview, useVideoUrl } from '../../lib/media';
import { postRef } from '../../lib/deals';

const DAY = 86400 * 1000;
const PERIODS = [
  { id: 'any', label: 'Any time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'custom', label: 'Custom' },
];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** The product a post is about: its own tag, the seed-data tag, or a mention of the product's name. */
const postProductId = (post) => post.productId || SEED_POST_PRODUCTS[post.id] || null;
const productKey = (name) => name.split(/ — | \(/)[0].toLowerCase().split(/\s+/).slice(0, 2).join(' ');
const mentionsProduct = (post, product) =>
  postProductId(post) === product.id || (post.text || '').toLowerCase().includes(productKey(product.name));

/** Everything a search can hit on a post: its text, the poster, and every comment/reply and who wrote it. */
const searchableText = (post) =>
  [
    post.text,
    shopById[post.shopId]?.name,
    ...(post.comments || []).flatMap((c) => [c.text, shopById[c.shopId]?.name, ...(c.replies || []).flatMap((r) => [r.text, shopById[r.shopId]?.name])]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const NotFound = () => (
  <div className="container"><EmptyState emoji="🧭" title="That market isn’t on the map" action={<Link to="/b2b" className="btn btn-primary">Back to markets</Link>} /></div>
);

/** A file-input button for a photo or a short video. On a phone the picker also offers the camera,
 *  so a merchant can record a quick clip and post it. Processed entirely in the browser (lib/media.js). */
function AttachButton({ compact, onPick, onError, current }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again later
    if (!file) return;
    setBusy(true);
    try {
      onError('');
      const media = await readMediaFile(file);
      discardMedia(current); // replacing an earlier pick
      onPick(media);
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <label className={`attach-btn ${compact ? 'compact' : ''} ${busy ? 'busy' : ''}`} aria-label="Attach a photo or video">
      {busy ? <Loader2 size={compact ? 15 : 16} className="spin" /> : <ImagePlus size={compact ? 15 : 16} />}
      {!compact && (busy ? 'Processing…' : 'Photo / Video')}
      <input type="file" accept="image/*,video/*" onChange={pick} hidden disabled={busy} />
    </label>
  );
}

/** The picked attachment shown above the composer before posting. */
function AttachPreview({ media }) {
  return media.kind === 'video'
    ? <video src={media.url} className="attach-video" muted playsInline controls preload="metadata" />
    : <img src={media.src} alt="Attachment preview" />;
}

/** A posted attachment: a tappable photo (opens the lightbox) or an inline video player. */
function Attachment({ image, video, className, onOpen }) {
  if (video) return <VideoPlayer id={video} className={className} />;
  if (!image) return null;
  return (
    <button type="button" className="feed-image-btn" onClick={() => onOpen(image)}>
      <img src={image} alt="Attachment" className={className} />
    </button>
  );
}

function VideoPlayer({ id, className }) {
  const url = useVideoUrl(id);
  if (url === undefined) return <div className={`video-placeholder ${className}`}><Loader2 size={18} className="spin" /></div>;
  if (url === null) {
    return <div className={`video-placeholder missing ${className}`}><Video size={18} /> Video isn’t available on this device</div>;
  }
  // `#t=0.1` makes iOS Safari render the first frame as a poster instead of a black box.
  return <video src={`${url}#t=0.1`} className={`feed-video ${className}`} controls playsInline preload="metadata" />;
}

/** One market, one WhatsApp-group-style board — posting and commenting is restricted to
 *  merchants whose own shop trades in this specific market (PRD's dual-marketplace directory
 *  already anchors every shop to exactly one market, so membership follows naturally from that). */
export default function MarketCommunity() {
  const { id } = useParams();
  const { user } = useAuth();
  const { marketPosts, createPost, b2bCatalog } = useStore();
  const [text, setText] = useState('');
  const [tagProduct, setTagProduct] = useState('');
  const [query, setQuery] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [period, setPeriod] = useState('any');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState('');
  const { hash } = useLocation();

  // Deep links from a message's post reference (…/community#<postId>) land on that post.
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('post-highlight');
      const t = setTimeout(() => el.classList.remove('post-highlight'), 2000);
      return () => clearTimeout(t);
    }
  }, [hash]);

  const market = marketById[id];
  if (!market) return <NotFound />;

  const myShopId = user.business?.shopId;
  const myMarketId = myShopId && shopById[myShopId] ? locate(myShopId).market.id : null;
  const isMember = myMarketId === id;
  const members = shopsOfMarket(id);
  const posts = marketPosts.filter((p) => p.marketId === id).sort((a, b) => b.createdAt - a.createdAt);
  // Wholesale listings from shops in this market — what posts here can be tagged with / filtered by.
  const marketProducts = b2bCatalog.filter((p) => shopById[p.shopId] && locate(p.shopId).market.id === id);
  const filterProduct = marketProducts.find((p) => p.id === productFilter);

  const now = Date.now();
  const range =
    period === 'today' ? [startOfToday(), Infinity]
      : period === '7d' ? [now - 7 * DAY, Infinity]
      : period === '30d' ? [now - 30 * DAY, Infinity]
      : period === 'custom' ? [from ? new Date(from).getTime() : -Infinity, to ? new Date(to).getTime() : Infinity]
      : [-Infinity, Infinity];
  const q = query.trim().toLowerCase();
  const shown = posts.filter(
    (p) =>
      p.createdAt >= range[0] &&
      p.createdAt <= range[1] &&
      (!filterProduct || mentionsProduct(p, filterProduct)) &&
      (!q || q.split(/\s+/).every((w) => searchableText(p).includes(w))),
  );
  const activeFilters = (productFilter ? 1 : 0) + (period !== 'any' ? 1 : 0);
  const filtering = !!q || activeFilters > 0;
  const clearFilters = () => {
    setQuery('');
    setProductFilter('');
    setPeriod('any');
    setFrom('');
    setTo('');
  };

  if (!isMember) {
    return (
      <div className="container narrow gate">
        <div className="gate-icon"><Lock size={30} /></div>
        <h1>{market.name} Community</h1>
        <p className="lead">
          This board is only open to merchants trading in {market.name} — it works like a members-only group,
          restricted to shops registered in this market.
          {myMarketId && ` You're a member of the ${marketById[myMarketId].short} community.`}
        </p>
        <div className="gate-actions">
          {myMarketId && <Link to={`/b2b/market/${myMarketId}/community`} className="btn btn-primary btn-lg">Go to my market's community</Link>}
          <Link to={`/b2b/market/${id}`} className="btn btn-outline btn-lg">Back to {market.short}</Link>
        </div>
      </div>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;
    createPost(id, text, image, tagProduct);
    setText('');
    setTagProduct('');
    releasePreview(image);
    setImage(null);
    setImageError('');
  };

  return (
    <div className="container narrow">
      <Breadcrumb items={[{ label: 'Markets', to: '/b2b' }, { label: market.short, to: `/b2b/market/${id}` }, { label: 'Community' }]} />

      <div className="community-head">
        <Visual emoji={market.emoji} hue={market.hue} />
        <div>
          <h1>{market.name} Community</h1>
          <span className="muted small"><Users size={13} /> {plural(members.length, 'verified merchant')} · members-only, restricted to this market</span>
        </div>
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Share something with the ${market.short} community…`} />
        {image && (
          <div className="attach-preview">
            <AttachPreview media={image} />
            <button type="button" className="icon-btn" onClick={() => { discardMedia(image); setImage(null); }} aria-label="Remove attachment"><X size={14} /></button>
          </div>
        )}
        {imageError && <p className="form-error">{imageError}</p>}
        <div className="composer-foot">
          <div className="row gap">
            <AttachButton onPick={setImage} onError={setImageError} current={image} />
            <label className="tag-select" aria-label="Tag a product">
              <Tag size={15} />
              <select value={tagProduct} onChange={(e) => setTagProduct(e.target.value)}>
                <option value="">Tag a product</option>
                {marketProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          </div>
          <button className="btn btn-primary" type="submit" disabled={!text.trim() && !image}><Send size={15} /> Post</button>
        </div>
      </form>

      <div className="feed-tools">
        <div className="feed-search">
          <Search size={16} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search posts, comments or merchants…" aria-label="Search posts" />
          {query && <button type="button" className="icon-btn" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}
        </div>
        <button type="button" className={`btn btn-outline btn-sm ${showFilters ? 'on' : ''}`} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
          <SlidersHorizontal size={15} /> Filters {activeFilters > 0 && <i className="count">{activeFilters}</i>}
        </button>
      </div>

      {showFilters && (
        <div className="card pad feed-filters">
          <label className="field">
            <span>Product</span>
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
              <option value="">All products</option>
              {marketProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <div className="field">
            <span>Date &amp; time</span>
            <div className="chip-row">
              {PERIODS.map((o) => (
                <button key={o.id} type="button" className={`chip-link ${period === o.id ? 'on' : ''}`} onClick={() => setPeriod(o.id)}>{o.label}</button>
              ))}
            </div>
          </div>
          {period === 'custom' && (
            <div className="form-grid">
              <label className="field"><span>From</span><input type="datetime-local" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
              <label className="field"><span>To</span><input type="datetime-local" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
            </div>
          )}
        </div>
      )}

      {filtering && posts.length > 0 && (
        <div className="row-between feed-count">
          <span className="muted small">{plural(shown.length, 'post')} of {posts.length}</span>
          <button type="button" className="link-plain small" onClick={clearFilters}>Clear all</button>
        </div>
      )}

      {posts.length === 0 ? (
        <EmptyState emoji="💬" title="No posts yet" text="Be the first to post in this market's community." />
      ) : shown.length === 0 ? (
        <EmptyState emoji="🔍" title="No matching posts" text="Try a different search, product or date range." action={<button className="btn btn-outline" onClick={clearFilters}>Clear filters</button>} />
      ) : (
        <div className="feed">
          {shown.map((p) => <PostCard key={p.id} post={p} product={marketProducts.find((m) => m.id === postProductId(p))} />)}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, product }) {
  const { user } = useAuth();
  const { addComment } = useStore();
  const navigate = useNavigate();
  const shop = shopById[post.shopId];
  const isMine = post.shopId === user.business?.shopId;
  const [reply, setReply] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [replyError, setReplyError] = useState('');
  const [showComments, setShowComments] = useState(post.comments.length > 0);
  const [lightbox, setLightbox] = useState(null);

  if (!shop) return null; // defensive: skip a post whose shop no longer resolves

  const submit = (e) => {
    e.preventDefault();
    if (!reply.trim() && !replyImage) return;
    addComment(post.id, reply, replyImage);
    setReply('');
    releasePreview(replyImage);
    setReplyImage(null);
    setReplyError('');
    setShowComments(true);
  };

  return (
    <article className="card post" id={post.id}>
      <div className="post-head">
        <Visual emoji={shop.emoji} hue={shop.hue} />
        <div className="grow">
          <Link to={`/b2b/shop/${shop.id}`}><b>{shop.name}</b></Link>
          <span className="muted small">{timeAgo(post.createdAt)}</span>
        </div>
        {!isMine && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate(`/b2b/messages/${shop.id}`, { state: { ref: postRef(post) } })}
          >
            <MessagesSquare size={14} /> Message
          </button>
        )}
      </div>
      {post.text && <p className="post-text">{post.text}</p>}
      {product && (
        <Link to={`/b2b/product/${product.id}`} className="post-product-tag"><Tag size={12} /> {product.name}</Link>
      )}
      <Attachment image={post.image} video={post.video} className="post-image" onOpen={setLightbox} />

      {post.comments.length > 0 && (
        <button type="button" className="link-plain small" onClick={() => setShowComments((s) => !s)}>
          {showComments ? 'Hide' : 'View'} {plural(post.comments.length, 'comment')}
        </button>
      )}
      {showComments && (
        <div className="comments">
          {post.comments.map((c) => <Comment key={c.id} postId={post.id} comment={c} />)}
        </div>
      )}
      {post.pending && (
        <div className="typing-indicator"><MessageCircle size={13} /> <span className="typing"><i /><i /><i /></span> someone is replying…</div>
      )}

      <form className="reply-form" onSubmit={submit}>
        {replyImage && (
          <div className="attach-preview small">
            <AttachPreview media={replyImage} />
            <button type="button" className="icon-btn" onClick={() => { discardMedia(replyImage); setReplyImage(null); }} aria-label="Remove attachment"><X size={12} /></button>
          </div>
        )}
        {replyError && <p className="form-error small">{replyError}</p>}
        <div className="reply-row">
          <AttachButton compact onPick={setReplyImage} onError={setReplyError} current={replyImage} />
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a comment…" aria-label="Write a comment" />
          <button className="icon-btn" type="submit" aria-label="Send comment" disabled={!reply.trim() && !replyImage}><Send size={15} /></button>
        </div>
      </form>

      {lightbox && (
        <Modal title="Photo" onClose={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size attachment" className="lightbox-image" />
        </Modal>
      )}
    </article>
  );
}

/** A single top-level comment, with its own one-level-deep reply thread (WhatsApp/Facebook-style —
 *  replies attach to the comment they're answering, not to each other). */
function Comment({ postId, comment }) {
  const { addReply } = useStore();
  const cShop = shopById[comment.shopId];
  const replies = comment.replies || [];
  const [showForm, setShowForm] = useState(false);
  const [showReplies, setShowReplies] = useState(replies.length > 0);
  const [reply, setReply] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [replyError, setReplyError] = useState('');
  const [lightbox, setLightbox] = useState(null);

  if (!cShop) return null; // defensive: skip a comment whose shop no longer resolves

  const submit = (e) => {
    e.preventDefault();
    if (!reply.trim() && !replyImage) return;
    addReply(postId, comment.id, reply, replyImage);
    setReply('');
    releasePreview(replyImage);
    setReplyImage(null);
    setReplyError('');
    setShowForm(false);
    setShowReplies(true);
  };

  return (
    <div className="comment">
      <Visual emoji={cShop.emoji} hue={cShop.hue} />
      <div>
        <span><b>{cShop.name}</b> <span className="muted small">{timeAgo(comment.createdAt)}</span></span>
        {comment.text && <p>{comment.text}</p>}
        <Attachment image={comment.image} video={comment.video} className="comment-image" onOpen={setLightbox} />

        <div className="comment-actions">
          <button type="button" className="link-plain small" onClick={() => setShowForm((s) => !s)}>Reply</button>
          {replies.length > 0 && (
            <button type="button" className="link-plain small" onClick={() => setShowReplies((s) => !s)}>
              {showReplies ? 'Hide' : 'View'} {plural(replies.length, 'reply', 'replies')}
            </button>
          )}
        </div>

        {showReplies && replies.length > 0 && (
          <div className="replies">
            {replies.map((r) => {
              const rShop = shopById[r.shopId];
              if (!rShop) return null;
              return (
                <div key={r.id} className="comment reply-item">
                  <Visual emoji={rShop.emoji} hue={rShop.hue} />
                  <div>
                    <span><b>{rShop.name}</b> <span className="muted small">{timeAgo(r.createdAt)}</span></span>
                    {r.text && <p>{r.text}</p>}
                    <Attachment image={r.image} video={r.video} className="comment-image" onOpen={setLightbox} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {comment.pending && (
          <div className="typing-indicator small"><MessageCircle size={12} /> <span className="typing"><i /><i /><i /></span> someone is replying…</div>
        )}

        {showForm && (
          <form className="reply-form nested" onSubmit={submit}>
            {replyImage && (
              <div className="attach-preview small">
                <AttachPreview media={replyImage} />
                <button type="button" className="icon-btn" onClick={() => { discardMedia(replyImage); setReplyImage(null); }} aria-label="Remove attachment"><X size={12} /></button>
              </div>
            )}
            {replyError && <p className="form-error small">{replyError}</p>}
            <div className="reply-row">
              <AttachButton compact onPick={setReplyImage} onError={setReplyError} current={replyImage} />
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={`Reply to ${cShop.name}…`}
                aria-label={`Reply to ${cShop.name}`}
                autoFocus
              />
              <button className="icon-btn" type="submit" aria-label="Send reply" disabled={!reply.trim() && !replyImage}><Send size={15} /></button>
            </div>
          </form>
        )}
      </div>

      {lightbox && (
        <Modal title="Photo" onClose={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size attachment" className="lightbox-image" />
        </Modal>
      )}
    </div>
  );
}
