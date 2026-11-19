import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Lock, MessageCircle, Search, Send, Store, Tag, Users, X } from 'lucide-react';
import ChatModal from '../../components/ChatModal';
import { Breadcrumb, EmptyState, Modal, Visual } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { locate, marketById, shopById, shopsOfMarket } from '../../data/directory';
import { plural, timeAgo } from '../../lib/format';
import { discardMedia, releasePreview } from '../../lib/media';
import { AttachButton, AttachPreview, Attachment } from '../b2b/Community';

/** Who wrote a comment or reply on the customer board: a merchant (shopId) or a buyer. */
function authorOf(item) {
  const shop = item.shopId ? shopById[item.shopId] : null;
  if (shop) return { name: shop.name, shop, badge: 'Seller' };
  if (item.buyerName) return { name: item.buyerName, badge: 'Buyer' };
  return null;
}

function AuthorAvatar({ author }) {
  if (author.shop) return <Visual emoji={author.shop.emoji} hue={author.shop.hue} />;
  const initials = author.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return <span className="avatar community-avatar">{initials}</span>;
}

/** Comment / reply box, or a sign-in prompt for guests. */
function ReplyBox({ onSubmit, placeholder, nested, autoFocus }) {
  const { isLoggedIn } = useAuth();
  const { pathname } = useLocation();
  const [text, setText] = useState('');
  const [media, setMedia] = useState(null);
  const [error, setError] = useState('');

  if (!isLoggedIn) {
    return (
      <p className="muted small community-signin">
        <Lock size={13} /> <Link to={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link> to comment or ask the seller a question.
      </p>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() && !media) return;
    onSubmit(text, media);
    setText('');
    releasePreview(media);
    setMedia(null);
    setError('');
  };

  return (
    <form className={`reply-form ${nested ? 'nested' : ''}`} onSubmit={submit}>
      {media && (
        <div className="attach-preview small">
          <AttachPreview media={media} />
          <button type="button" className="icon-btn" onClick={() => { discardMedia(media); setMedia(null); }} aria-label="Remove attachment"><X size={12} /></button>
        </div>
      )}
      {error && <p className="form-error small">{error}</p>}
      <div className="reply-row">
        <AttachButton compact onPick={setMedia} onError={setError} current={media} />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder} autoFocus={autoFocus} />
        <button className="icon-btn" type="submit" aria-label="Send" disabled={!text.trim() && !media}><Send size={15} /></button>
      </div>
    </form>
  );
}

/** The buyer-facing community of one market. Separate from the dealer-to-dealer board
 *  (pages/b2b/Community.jsx) — buyers never see that one. Merchants of this market post deals,
 *  new arrivals and tips; any signed-in user can comment and reply; merchants answer as their shop. */
export default function CustomerCommunity() {
  const { id } = useParams();
  const { user } = useAuth();
  const { shopPosts, createShopPost, b2cCatalog } = useStore();
  const [text, setText] = useState('');
  const [tagProduct, setTagProduct] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaError, setMediaError] = useState('');
  const [query, setQuery] = useState('');

  const market = marketById[id];
  if (!market) {
    return <div className="container"><EmptyState emoji="🧭" title="That market isn’t on the map" action={<Link to="/shop/markets" className="btn btn-primary">Back to markets</Link>} /></div>;
  }

  const myShopId = user?.business?.shopId;
  const isMerchantHere = !!(myShopId && shopById[myShopId] && locate(myShopId).market.id === id);
  const members = shopsOfMarket(id);
  const marketProducts = b2cCatalog.filter((p) => shopById[p.shopId] && locate(p.shopId).market.id === id);
  const myProducts = marketProducts.filter((p) => p.shopId === myShopId);

  const q = query.trim().toLowerCase();
  const posts = shopPosts
    .filter((p) => p.marketId === id)
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((p) => {
      if (!q) return true;
      const hay = [
        p.text, shopById[p.shopId]?.name,
        ...p.comments.flatMap((c) => [c.text, authorOf(c)?.name, ...(c.replies || []).flatMap((r) => [r.text, authorOf(r)?.name])]),
      ].filter(Boolean).join(' ').toLowerCase();
      return q.split(/\s+/).every((w) => hay.includes(w));
    });

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() && !media) return;
    createShopPost(id, text, media, tagProduct);
    setText('');
    setTagProduct('');
    releasePreview(media);
    setMedia(null);
    setMediaError('');
  };

  return (
    <div className="container narrow">
      <Breadcrumb items={[{ label: 'Markets', to: '/shop/markets' }, { label: market.short, to: `/shop/market/${id}` }, { label: 'Community' }]} />

      <div className="community-head">
        <Visual emoji={market.emoji} hue={market.hue} />
        <div>
          <h1>{market.name} Community</h1>
          <span className="muted small"><Users size={13} /> Deals, new arrivals and tips from {plural(members.length, 'verified merchant')} — ask them anything</span>
        </div>
      </div>

      {isMerchantHere ? (
        <form className="composer" onSubmit={submit}>
          <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Share a deal or new arrival with ${market.short} shoppers…`} />
          {media && (
            <div className="attach-preview">
              <AttachPreview media={media} />
              <button type="button" className="icon-btn" onClick={() => { discardMedia(media); setMedia(null); }} aria-label="Remove attachment"><X size={14} /></button>
            </div>
          )}
          {mediaError && <p className="form-error">{mediaError}</p>}
          <div className="composer-foot">
            <div className="row gap">
              <AttachButton onPick={setMedia} onError={setMediaError} current={media} />
              {myProducts.length > 0 && (
                <label className="tag-select" aria-label="Tag a product">
                  <Tag size={15} />
                  <select value={tagProduct} onChange={(e) => setTagProduct(e.target.value)}>
                    <option value="">Tag a product</option>
                    {myProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              )}
            </div>
            <button className="btn btn-primary" type="submit" disabled={!text.trim() && !media}><Send size={15} /> Post</button>
          </div>
        </form>
      ) : (
        <div className="callout community-buyer-note">
          <Store size={15} />
          <span>Merchants in {market.short} post here for shoppers. Comment to ask a question, or message a seller directly to buy.</span>
        </div>
      )}

      <div className="feed-tools">
        <div className="feed-search">
          <Search size={16} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search posts, comments or sellers…" aria-label="Search posts" />
          {query && <button type="button" className="icon-btn" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}
        </div>
      </div>

      {posts.length === 0 ? (
        q
          ? <EmptyState emoji="🔍" title="No matching posts" text="Try a different search." />
          : <EmptyState emoji="💬" title="No posts yet" text={`${market.short} merchants haven’t posted anything yet.`} />
      ) : (
        <div className="feed">
          {posts.map((p) => <PostCard key={p.id} post={p} product={marketProducts.find((m) => m.id === p.productId)} />)}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, product }) {
  const { user } = useAuth();
  const { addShopComment } = useStore();
  const shop = shopById[post.shopId];
  const isMine = post.shopId === user?.business?.shopId;
  const [showComments, setShowComments] = useState(post.comments.length > 0);
  const [chatOpen, setChatOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  if (!shop) return null;

  return (
    <article className="card post" id={post.id}>
      <div className="post-head">
        <Visual emoji={shop.emoji} hue={shop.hue} />
        <div className="grow">
          <Link to={`/shop/vendor/${shop.id}`}><b>{shop.name}</b></Link>
          <span className="muted small">{timeAgo(post.createdAt)}</span>
        </div>
        {!isMine && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setChatOpen(true)}>
            <MessageCircle size={14} /> Message
          </button>
        )}
      </div>
      {post.text && <p className="post-text">{post.text}</p>}
      {product && <Link to={`/product/${product.id}`} className="post-product-tag"><Tag size={12} /> {product.name}</Link>}
      <Attachment image={post.image} video={post.video} className="post-image" onOpen={setLightbox} />

      {post.comments.length > 0 && (
        <button type="button" className="link-plain small" onClick={() => setShowComments((s) => !s)}>
          {showComments ? 'Hide' : 'View'} {plural(post.comments.length, 'comment')}
        </button>
      )}
      {showComments && (
        <div className="comments">
          {post.comments.map((c) => <Comment key={c.id} post={post} comment={c} />)}
        </div>
      )}

      <ReplyBox
        placeholder={isMine ? 'Write a comment…' : `Ask ${shop.name} a question…`}
        onSubmit={(text, media) => { addShopComment(post.id, text, media); setShowComments(true); }}
      />

      {chatOpen && <ChatModal shop={shop} product={product} onClose={() => setChatOpen(false)} />}
      {lightbox && (
        <Modal title="Photo" onClose={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size attachment" className="lightbox-image" />
        </Modal>
      )}
    </article>
  );
}

function Comment({ post, comment }) {
  const { addShopReply } = useStore();
  const author = authorOf(comment);
  const replies = comment.replies || [];
  const [showForm, setShowForm] = useState(false);
  const [showReplies, setShowReplies] = useState(replies.length > 0);
  const [lightbox, setLightbox] = useState(null);

  if (!author) return null;

  return (
    <div className="comment">
      <AuthorAvatar author={author} />
      <div>
        <span>
          <b>{author.name}</b> <span className={`pill ${author.shop ? 'pill-orange' : 'pill-gray'} community-badge`}>{author.badge}</span>{' '}
          <span className="muted small">{timeAgo(comment.createdAt)}</span>
        </span>
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
              const ra = authorOf(r);
              if (!ra) return null;
              return (
                <div key={r.id} className="comment reply-item">
                  <AuthorAvatar author={ra} />
                  <div>
                    <span>
                      <b>{ra.name}</b> <span className={`pill ${ra.shop ? 'pill-orange' : 'pill-gray'} community-badge`}>{ra.badge}</span>{' '}
                      <span className="muted small">{timeAgo(r.createdAt)}</span>
                    </span>
                    {r.text && <p>{r.text}</p>}
                    <Attachment image={r.image} video={r.video} className="comment-image" onOpen={setLightbox} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {comment.pending && (
          <div className="typing-indicator small"><MessageCircle size={12} /> <span className="typing"><i /><i /><i /></span> {shopById[post.shopId]?.name} is replying…</div>
        )}

        {showForm && (
          <ReplyBox
            nested
            autoFocus
            placeholder={`Reply to ${author.name}…`}
            onSubmit={(text, media) => { addShopReply(post.id, comment.id, text, media); setShowForm(false); setShowReplies(true); }}
          />
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
