import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Breadcrumb, EmptyState, Visual } from '../components/ui';
import { b2cCategories } from '../data/b2c';
import { b2bCategories } from '../data/b2b';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';

const ICONS = [
  ['📱', 214], ['💻', 224], ['📺', 268], ['🏠', 160], ['🔋', 172], ['👗', 336],
  ['🛒', 96], ['💄', 320], ['🚗', 12], ['🧵', 285], ['🧱', 18], ['👟', 24],
  ['🪑', 200], ['🍚', 48], ['🎧', 250], ['☀️', 45], ['🧴', 300], ['🛞', 220],
];
const UNITS = ['piece', 'carton', 'bag', 'pair', 'sheet', 'box'];
const CONDITIONS = ['New', 'Refurbished', 'Used — Like new', 'Used — Good', 'Open box'];
const emptyTier = () => ({ min: '', price: '' });
const emptySpec = () => ({ key: '', value: '' });
const asStr = (n) => (n == null ? '' : String(n));

/** A full page rather than a popup — this form has too many sections (icon picker, retail details,
 *  wholesale tiers, variants) to do justice to in a cramped modal. Create at /vendor/products/new,
 *  edit (including resubmitting a rejected or already-live listing) at /vendor/products/:id/edit. */
export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myProducts, addProduct, updateProduct } = useStore();
  const toast = useToast();
  const editing = !!id;
  // Scoped to the signed-in merchant — nobody can land on someone else's edit link and see their form.
  const product = editing ? myProducts.find((p) => p.id === id && p.ownerId === user.id) : null;

  const [name, setName] = useState(() => product?.name || '');
  const [blurb, setBlurb] = useState(() => product?.blurb || '');
  const [description, setDescription] = useState(() => product?.description || '');
  const [icon, setIcon] = useState(() => (product ? [product.emoji, product.hue] : ICONS[0]));
  const [condition, setCondition] = useState(() => product?.condition || CONDITIONS[0]);
  const [specRows, setSpecRows] = useState(() => (product?.specRows?.length ? product.specRows.map((s) => ({ ...s })) : []));
  const [listRetail, setListRetail] = useState(() => (product ? !!product.listRetail : true));
  const [listWholesale, setListWholesale] = useState(() => (product ? !!product.listWholesale : false));

  const [categoryRetail, setCategoryRetail] = useState(() => product?.categoryRetail || b2cCategories[0].id);
  const [price, setPrice] = useState(() => asStr(product?.price));
  const [oldPrice, setOldPrice] = useState(() => asStr(product?.oldPrice));
  const [stockRetail, setStockRetail] = useState(() => asStr(product?.stockRetail));
  const [hasVariants, setHasVariants] = useState(() => !!product?.variants);
  const [variantLabel, setVariantLabel] = useState(() => product?.variants?.label || '');
  const [variantOptions, setVariantOptions] = useState(() =>
    product?.variants?.options?.length
      ? product.variants.options.map((o) => ({ name: o.name, delta: asStr(o.delta) }))
      : [{ name: '', delta: '0' }, { name: '', delta: '' }],
  );

  const [categoryWholesale, setCategoryWholesale] = useState(() => product?.categoryWholesale || b2bCategories[0].id);
  const [unit, setUnit] = useState(() => product?.unit || UNITS[0]);
  const [refRetailPrice, setRefRetailPrice] = useState(() => asStr(product?.refRetailPrice));
  const [moq, setMoq] = useState(() => asStr(product?.moq));
  const [stockWholesale, setStockWholesale] = useState(() => asStr(product?.stockWholesale));
  const [leadDays, setLeadDays] = useState(() => asStr(product?.leadDays) || '3');
  const [tiers, setTiers] = useState(() => (product?.tiers?.length ? product.tiers.map((t) => ({ min: asStr(t.min), price: asStr(t.price) })) : [emptyTier()]));

  const [errors, setErrors] = useState({});

  if (editing && !product) {
    return (
      <div className="container narrow">
        <EmptyState emoji="🤷" title="Listing not found" text="It may have been removed, or belongs to another account." action={<Link to="/vendor/products" className="btn btn-primary">Back to Product Manager</Link>} />
      </div>
    );
  }

  const setTier = (i, key, v) => setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [key]: v } : t)));
  const addTier = () => tiers.length < 3 && setTiers((prev) => [...prev, emptyTier()]);
  const removeTier = (i) => tiers.length > 1 && setTiers((prev) => prev.filter((_, idx) => idx !== i));

  const setSpec = (i, field, v) => setSpecRows((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: v } : s)));
  const addSpec = () => specRows.length < 8 && setSpecRows((prev) => [...prev, emptySpec()]);
  const removeSpec = (i) => setSpecRows((prev) => prev.filter((_, idx) => idx !== i));

  const setVariantOption = (i, key, v) => setVariantOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, [key]: v } : o)));
  const addVariantOption = () => variantOptions.length < 6 && setVariantOptions((prev) => [...prev, { name: '', delta: '' }]);
  const removeVariantOption = (i) => variantOptions.length > 2 && setVariantOptions((prev) => prev.filter((_, idx) => idx !== i));

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Enter a product name';
    if (!blurb.trim()) e.blurb = 'Add a short description';
    if (!listRetail && !listWholesale) e.type = 'Choose at least one — Retail, Wholesale, or both';

    if (specRows.some((s) => !!s.key.trim() !== !!s.value.trim())) {
      e.specs = 'Fill in both the name and value for each specification, or remove the row';
    }

    if (listRetail) {
      if (!price || Number(price) <= 0) e.price = 'Enter a retail price';
      if (oldPrice && Number(oldPrice) <= Number(price)) e.oldPrice = 'Compare-at price must be higher than the price';
      if (!stockRetail || Number(stockRetail) < 0) e.stockRetail = 'Enter available stock';

      if (hasVariants) {
        if (!variantLabel.trim()) e.variantLabel = 'Name the variant (e.g. Storage, Size, Colour)';
        const names = variantOptions.map((o) => o.name.trim());
        if (names.some((n) => !n)) e.variantOptions = 'Give every option a name';
        else if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) e.variantOptions = 'Option names must be unique';
        else if (variantOptions.slice(1).some((o) => o.delta !== '' && Number(o.delta) < 0)) e.variantOptions = 'Price adjustments can’t be negative';
      }
    }
    if (listWholesale) {
      if (!refRetailPrice || Number(refRetailPrice) <= 0) e.refRetailPrice = 'Enter a reference retail price';
      if (!moq || Number(moq) <= 0) e.moq = 'Enter a minimum order quantity';
      if (!stockWholesale || Number(stockWholesale) < 0) e.stockWholesale = 'Enter available stock';
      const nums = tiers.map((t) => [Number(t.min), Number(t.price)]);
      if (nums.some(([m, p]) => !m || !p || m <= 0 || p <= 0)) e.tiers = 'Fill in every tier’s quantity and price';
      else if (nums.some(([m], i) => i > 0 && m <= nums[i - 1][0])) e.tiers = 'Tier quantities must increase down the list';
      else if (nums.some(([, p], i) => i > 0 && p >= nums[i - 1][1])) e.tiers = 'Bulk price should drop at higher quantities';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      name: name.trim(),
      blurb: blurb.trim(),
      description: description.trim(),
      emoji: icon[0],
      hue: icon[1],
      condition,
      specRows: specRows.filter((s) => s.key.trim() && s.value.trim()).map((s) => ({ key: s.key.trim(), value: s.value.trim() })),
      listRetail,
      listWholesale,
      ...(listRetail
        ? {
            categoryRetail,
            price: Number(price),
            oldPrice: oldPrice ? Number(oldPrice) : null,
            stockRetail: Number(stockRetail),
            variants: hasVariants
              ? { label: variantLabel.trim(), options: variantOptions.map((o, i) => ({ name: o.name.trim(), delta: i === 0 ? 0 : Number(o.delta) || 0 })) }
              : null,
          }
        : {}),
      ...(listWholesale
        ? {
            categoryWholesale,
            unit,
            refRetailPrice: Number(refRetailPrice),
            moq: Number(moq),
            stockWholesale: Number(stockWholesale),
            leadDays: Number(leadDays) || 3,
            tiers: tiers.map((t) => ({ min: Number(t.min), price: Number(t.price) })),
          }
        : {}),
    };

    if (editing) {
      updateProduct(product.id, data);
      toast('Listing updated — sent for admin review again');
    } else {
      addProduct(data);
      toast('Product submitted — pending admin review');
    }
    navigate('/vendor/products');
  };

  return (
    <div className="container narrow">
      <Breadcrumb items={[{ label: 'Dashboard', to: '/vendor' }, { label: 'Product Manager', to: '/vendor/products' }, { label: editing ? 'Edit product' : 'Add a product' }]} />
      <h1 className="page-title">{editing ? 'Edit product' : 'Add a product'}</h1>

      <form className="stack-form" onSubmit={submit}>
        <div className="icon-picker">
          <span className="muted small">Icon</span>
          <div className="icon-grid">
            {ICONS.map(([emoji, hue]) => (
              <button key={emoji} type="button" className={`icon-opt ${icon[0] === emoji ? 'on' : ''}`} style={{ '--h': hue }} onClick={() => setIcon([emoji, hue])} aria-label={emoji}>
                <Visual emoji={emoji} hue={hue} />
              </button>
            ))}
          </div>
          <p className="muted small">Photo uploads aren’t available in this prototype — pick an icon to represent your product for now.</p>
        </div>

        <label className="field"><span>Product name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wireless Charging Pad" /></label>
        {errors.name && <p className="form-error">{errors.name}</p>}
        <label className="field"><span>Short description</span><textarea rows={2} value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="What makes it worth buying? Shown on the product card and at the top of the listing." /></label>
        {errors.blurb && <p className="form-error">{errors.blurb}</p>}
        <label className="field">
          <span>Long description (optional)</span>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Go into detail — materials, what's in the box, sizing, care instructions, who it's for… shown further down the product page."
          />
        </label>

        <label className="field">
          <span>Condition</span>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <div className="tier-rows">
          <span className="muted small">Specifications (optional) — battery, warranty, material, dimensions…</span>
          {specRows.map((s, i) => (
            <div key={i} className="tier-row">
              <label className="field"><span>Name</span><input value={s.key} onChange={(e) => setSpec(i, 'key', e.target.value)} placeholder="Battery" /></label>
              <label className="field"><span>Value</span><input value={s.value} onChange={(e) => setSpec(i, 'value', e.target.value)} placeholder="5,000mAh" /></label>
              <button type="button" className="icon-btn" onClick={() => removeSpec(i)} aria-label="Remove specification"><Trash2 size={16} /></button>
            </div>
          ))}
          {specRows.length < 8 && <button type="button" className="btn btn-outline btn-sm" onClick={addSpec}><Plus size={14} /> Add specification</button>}
          {errors.specs && <p className="form-error">{errors.specs}</p>}
        </div>

        <div className="type-toggle">
          <span className="muted small">List this product as</span>
          <label className="check"><input type="checkbox" checked={listRetail} onChange={(e) => setListRetail(e.target.checked)} /> Retail (B2C shop)</label>
          <label className="check"><input type="checkbox" checked={listWholesale} onChange={(e) => setListWholesale(e.target.checked)} /> Wholesale (B2B community)</label>
        </div>
        {errors.type && <p className="form-error">{errors.type}</p>}

        {listRetail && (
          <fieldset className="form-section">
            <legend>Retail details</legend>
            <div className="form-grid">
              <label className="field">
                <span>Category</span>
                <select value={categoryRetail} onChange={(e) => setCategoryRetail(e.target.value)}>
                  {b2cCategories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Price (₦)</span><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25000" /></label>
              <label className="field"><span>Compare-at price (optional)</span><input type="number" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="30000" /></label>
              <label className="field"><span>Stock quantity</span><input type="number" value={stockRetail} onChange={(e) => setStockRetail(e.target.value)} placeholder="50" /></label>
            </div>
            {(errors.price || errors.oldPrice || errors.stockRetail) && <p className="form-error">{errors.price || errors.oldPrice || errors.stockRetail}</p>}

            <label className="check mt"><input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} /> This product has variants (size, colour, storage…)</label>
            {hasVariants && (
              <div className="tier-rows">
                <label className="field"><span>Variant name</span><input value={variantLabel} onChange={(e) => setVariantLabel(e.target.value)} placeholder="e.g. Storage" /></label>
                {errors.variantLabel && <p className="form-error">{errors.variantLabel}</p>}
                <span className="muted small">Options — the first uses the base price above; later ones can add to it</span>
                {variantOptions.map((o, i) => (
                  <div key={i} className="tier-row">
                    <label className="field"><span>Option</span><input value={o.name} onChange={(e) => setVariantOption(i, 'name', e.target.value)} placeholder={i === 0 ? '128GB' : '256GB'} /></label>
                    {i === 0 ? (
                      <label className="field"><span>Price adjustment</span><input value="Included" disabled /></label>
                    ) : (
                      <label className="field"><span>+ Price (₦)</span><input type="number" value={o.delta} onChange={(e) => setVariantOption(i, 'delta', e.target.value)} placeholder="55000" /></label>
                    )}
                    <button type="button" className="icon-btn" onClick={() => removeVariantOption(i)} disabled={variantOptions.length === 2} aria-label="Remove option"><Trash2 size={16} /></button>
                  </div>
                ))}
                {variantOptions.length < 6 && <button type="button" className="btn btn-outline btn-sm" onClick={addVariantOption}><Plus size={14} /> Add option</button>}
                {errors.variantOptions && <p className="form-error">{errors.variantOptions}</p>}
              </div>
            )}
          </fieldset>
        )}

        {listWholesale && (
          <fieldset className="form-section">
            <legend>Wholesale details</legend>
            <div className="form-grid">
              <label className="field">
                <span>Category</span>
                <select value={categoryWholesale} onChange={(e) => setCategoryWholesale(e.target.value)}>
                  {b2bCategories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Sold per</span>
                <select value={unit} onChange={(e) => setUnit(e.target.value)}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
              </label>
              <label className="field"><span>Reference retail price (₦)</span><input type="number" value={refRetailPrice} onChange={(e) => setRefRetailPrice(e.target.value)} placeholder="35000" /></label>
              <label className="field"><span>MOQ</span><input type="number" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="20" /></label>
              <label className="field"><span>Stock quantity</span><input type="number" value={stockWholesale} onChange={(e) => setStockWholesale(e.target.value)} placeholder="500" /></label>
              <label className="field"><span>Lead time (days)</span><input type="number" value={leadDays} onChange={(e) => setLeadDays(e.target.value)} placeholder="3" /></label>
            </div>
            {(errors.refRetailPrice || errors.moq || errors.stockWholesale) && <p className="form-error">{errors.refRetailPrice || errors.moq || errors.stockWholesale}</p>}

            <div className="tier-rows">
              <span className="muted small">Bulk price tiers — price per unit falls as quantity rises</span>
              {tiers.map((t, i) => (
                <div key={i} className="tier-row">
                  <label className="field"><span>From qty</span><input type="number" value={t.min} onChange={(e) => setTier(i, 'min', e.target.value)} placeholder={i === 0 ? String(moq || 10) : ''} /></label>
                  <label className="field"><span>Price / unit (₦)</span><input type="number" value={t.price} onChange={(e) => setTier(i, 'price', e.target.value)} /></label>
                  <button type="button" className="icon-btn" onClick={() => removeTier(i)} disabled={tiers.length === 1} aria-label="Remove tier"><Trash2 size={16} /></button>
                </div>
              ))}
              {tiers.length < 3 && <button type="button" className="btn btn-outline btn-sm" onClick={addTier}><Plus size={14} /> Add another tier</button>}
              {errors.tiers && <p className="form-error">{errors.tiers}</p>}
            </div>
          </fieldset>
        )}

        <p className="callout small">
          {editing
            ? 'Saving sends this listing back to a MarketDeal admin for review — it’ll show “Pending review” again until approved.'
            : 'Every new listing is reviewed by a MarketDeal admin before it goes live — you’ll see it marked “Pending review” until then.'}
        </p>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/vendor/products')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg">{editing ? 'Save & resubmit for review' : 'Submit for review'}</button>
        </div>
      </form>
    </div>
  );
}
