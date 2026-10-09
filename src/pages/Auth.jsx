import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Check, CheckCircle2, Clock, Handshake, ShoppingBag, Store, XCircle } from 'lucide-react';
import { Logo } from '../components/layout';
import { StatusChip } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { b2cCategories } from '../data/b2c';
import { markets } from '../data/directory';

function AuthShell({ title, sub, children, aside }) {
  return (
    <div className="auth-page">
      <div className="auth-side">
        <Logo light />
        <h2>{aside.title}</h2>
        <ul>
          {aside.points.map((p) => (
            <li key={p}><Check size={16} /> {p}</li>
          ))}
        </ul>
        <small>Prototype · sample data only</small>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{sub}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

const buyerAside = {
  title: 'Shop the markets, protected by escrow.',
  points: ['Genuine products from verified merchants', 'Pay safely — funds released on delivery', 'See the exact shop you are buying from'],
};
const vendorAside = {
  title: 'Trade in the digital market.',
  points: ['Start selling in minutes', 'Sell to buyers nationwide', 'Unlock the wholesale dealer community, bulk pricing and direct merchant-to-merchant deals'],
};

const genOtp = () => String(Math.floor(1000 + Math.random() * 9000));

/** Simulated email OTP — no real backend, so the "sent" code is shown right on screen (clearly
 *  labelled as a prototype), the same "Prototype: X is simulated" convention used elsewhere in this
 *  app. Used by sign-up and by Login's recovery path for an account that was never confirmed. */
function EmailOtpStep({ email, onVerified, onBack }) {
  const toast = useToast();
  const [sentCode, setSentCode] = useState(genOtp);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const resend = () => {
    setSentCode(genOtp());
    setCode('');
    setError('');
    toast('New code sent (demo)', { kind: 'info' });
  };

  const submit = (e) => {
    e.preventDefault();
    if (code.trim() !== sentCode) {
      setError('That code doesn’t match — try again.');
      return;
    }
    onVerified();
  };

  return (
    <form onSubmit={submit} className="stack-form">
      <div className="demo-box">
        <span className="demo-tag">Prototype: email is simulated</span>
        <p className="muted small no-margin">
          We emailed a 4-digit code to <b>{email || 'your email'}</b>. Your demo code is <b className="otp-code">{sentCode}</b>.
        </p>
      </div>
      <label className="field">
        <span>Enter the 4-digit code</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric" maxLength={4} placeholder="••••" autoFocus required
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary btn-lg block" type="submit">Verify email</button>
      <div className="row-between">
        <button type="button" className="link-plain small" onClick={onBack}>Back</button>
        <button type="button" className="link-plain small" onClick={resend}>Resend code</button>
      </div>
    </form>
  );
}

export function Login() {
  const { login, verifyEmail, isLoggedIn, user } = useAuth();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  // Business accounts land in the wholesale community unless they were sent here from a specific page.
  if (isLoggedIn) return <Navigate to={next || (user.role === 'vendor' ? '/b2b' : '/')} replace />;

  const submit = (e, creds = { email, password }) => {
    e?.preventDefault();
    setUnverifiedEmail('');
    const res = login(creds.email, creds.password);
    if (!res.ok) {
      setError(res.error);
      if (res.needsVerification) setUnverifiedEmail(res.email);
    }
  };

  if (unverifiedEmail) {
    return (
      <AuthShell title="Verify your email" sub="This account was created but never confirmed — verify it to finish signing in." aside={buyerAside}>
        <EmailOtpStep email={unverifiedEmail} onVerified={() => verifyEmail(unverifiedEmail)} onBack={() => setUnverifiedEmail('')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Welcome back" sub="Sign in to your MarketDeal account." aside={buyerAside}>
      <form onSubmit={submit} className="stack-form">
        <label className="field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
        <label className="field"><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-lg block" type="submit">Sign in</button>
      </form>

      <div className="demo-accounts">
        <span className="demo-tag">Demo accounts</span>
        <button className="demo-acc" onClick={() => submit(null, { email: 'buyer@demo.com', password: 'demo1234' })}>
          <ShoppingBag size={18} />
          <div><b>Sign in as a Buyer</b><small>Sees the B2C shop only</small></div>
        </button>
        <button className="demo-acc" onClick={() => submit(null, { email: 'vendor@demo.com', password: 'demo1234' })}>
          <Handshake size={18} />
          <div><b>Sign in as a Business / Vendor</b><small>Sees B2C shop + B2B wholesale community</small></div>
        </button>
      </div>

      <p className="auth-foot">New here? <Link to="/register">Create an account</Link> · <Link to="/register?type=vendor">Register a business</Link></p>
    </AuthShell>
  );
}

const emptyRegisterForm = { name: '', email: '', phone: '', password: '', businessName: '', marketId: markets[0].id, categoryId: b2cCategories[0].id, description: '' };

/** Sign-up collects the bare minimum — an account, and for a merchant, just enough to place a shop
 *  (name, market, category). Email verification is the one mandatory gate (KYC Level 1, required
 *  before anyone can sign in at all); CAC (optional, Level 2) and physical shop verification
 *  (Level 3) are pursued afterwards from the merchant dashboard — see KycPanel. */
export function Register() {
  const { register, verifyEmail, isLoggedIn, user } = useAuth();
  const [params] = useSearchParams();
  const [type, setType] = useState(params.get('type') === 'vendor' ? 'vendor' : 'buyer');
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [form, setForm] = useState(emptyRegisterForm);
  const [error, setError] = useState('');

  if (isLoggedIn) return <Navigate to={user.role === 'vendor' ? '/vendor' : '/'} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submitDetails = (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    const res = register({ ...form, role: type });
    if (!res.ok) return setError(res.error);
    setStep('otp');
  };

  if (step === 'otp') {
    return (
      <AuthShell title="Verify your email" sub={`Step 2 of 2 — confirm ${form.email}.`} aside={type === 'vendor' ? vendorAside : buyerAside}>
        <EmailOtpStep email={form.email} onVerified={() => verifyEmail(form.email)} onBack={() => setStep('details')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      sub={type === 'vendor' ? 'Step 1 of 2 — a few basics to get started.' : 'Step 1 of 2 — choose how you’ll use MarketDeal.'}
      aside={type === 'vendor' ? vendorAside : buyerAside}
    >
      <div className="type-picker" role="radiogroup" aria-label="Account type">
        <button type="button" role="radio" aria-checked={type === 'buyer'} className={type === 'buyer' ? 'on' : ''} onClick={() => setType('buyer')}>
          <ShoppingBag size={22} />
          <b>I’m a buyer</b>
          <small>Shop products from market merchants</small>
        </button>
        <button type="button" role="radio" aria-checked={type === 'vendor'} className={type === 'vendor' ? 'on' : ''} onClick={() => setType('vendor')}>
          <Store size={22} />
          <b>I’m a business / vendor</b>
          <small>Sell, and access wholesale (B2B)</small>
        </button>
      </div>

      <form onSubmit={submitDetails} className="stack-form">
        <label className="field"><span>Full name</span><input value={form.name} onChange={set('name')} required /></label>
        <div className="form-grid">
          <label className="field"><span>Email</span><input type="email" value={form.email} onChange={set('email')} required /></label>
          <label className="field"><span>Phone</span><input value={form.phone} onChange={set('phone')} placeholder="080…" required /></label>
        </div>
        <label className="field"><span>Password</span><input type="password" value={form.password} onChange={set('password')} required /></label>

        {type === 'vendor' && <BusinessFields form={form} set={set} />}

        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-lg block" type="submit">Continue</button>
      </form>
      <p className="auth-foot">Already registered? <Link to="/login">Sign in</Link></p>
    </AuthShell>
  );
}

function BusinessFields({ form, set }) {
  return (
    <div className="biz-fields">
      <label className="field"><span>Business name</span><input value={form.businessName} onChange={set('businessName')} placeholder="e.g. Chuks Gadgets Ltd" required /></label>
      <div className="form-grid">
        <label className="field">
          <span>Your market</span>
          <select value={form.marketId} onChange={set('marketId')}>
            {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Primary category</span>
          <select value={form.categoryId} onChange={set('categoryId')}>
            {b2cCategories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Shop description (optional)</span>
        <textarea rows={2} value={form.description} onChange={set('description')} placeholder="What do you sell? This appears on your shop page." />
      </label>
      <p className="muted small">A Market Admin places new shops in the first available plaza of your market. Add your CAC and request physical verification later from your dashboard.</p>
    </div>
  );
}

/** A signed-in buyer applying for a business account — just the shop basics, same as sign-up.
 *  Their email is already verified (you can't be signed in otherwise), so there's no OTP step here. */
export function BecomeMerchant() {
  const { user, isLoggedIn, isVendor, upgradeToVendor } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ businessName: '', marketId: markets[0].id, categoryId: b2cCategories[0].id, description: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!isLoggedIn) return <Navigate to="/register?type=vendor" replace />;
  if (isVendor) return <Navigate to="/vendor" replace />;

  const submit = (e) => {
    e.preventDefault();
    upgradeToVendor(form);
    navigate('/vendor', { replace: true });
  };

  return (
    <AuthShell
      title="Set up your shop"
      sub={`Hi ${user.name.split(' ')[0]}, add your business basics to unlock selling and the wholesale community.`}
      aside={vendorAside}
    >
      <form className="stack-form" onSubmit={submit}>
        <BusinessFields form={form} set={set} />
        <button className="btn btn-primary btn-lg block" type="submit">Create my shop</button>
      </form>
    </AuthShell>
  );
}

/** Level 2 (CAC, optional) and Level 3 (physical shop visit) — pursued entirely from the merchant
 *  dashboard, each independently, each with the same PENDING → VERIFIED/REJECTED review shape (and
 *  the same "Prototype controls" demo box) used for product listings elsewhere in this app. */
export function KycPanel() {
  const { user, submitCac, approveCac, rejectCac, requestPhysicalVerification, approvePhysical, rejectPhysical } = useAuth();
  const toast = useToast();
  const biz = user.business;
  const [cacInput, setCacInput] = useState(biz.cac || '');

  return (
    <div className="kyc-panel">
      <KycRow
        title="Level 2 · CAC registration"
        subtitle="Optional — adds a registered-business badge."
        status={biz.cacVerification.status}
        rejectReason={biz.cacVerification.rejectReason}
        verifiedNote={biz.cac ? `CAC ${biz.cac}` : null}
        pendingCopy="We're checking your CAC number against the CAC registry — usually a few hours in production."
        onApprove={() => { approveCac(); toast('✅ CAC verified — Level 2 unlocked'); }}
        onReject={() => { rejectCac('The CAC number could not be matched to your business name.'); toast('CAC rejected (demo)', { kind: 'info' }); }}
      >
        {(biz.cacVerification.status === 'NONE' || biz.cacVerification.status === 'REJECTED') && (
          <form
            className="row gap wrap"
            onSubmit={(e) => {
              e.preventDefault();
              if (!cacInput.trim()) return;
              submitCac(cacInput);
              toast('CAC submitted for verification', { kind: 'info' });
            }}
          >
            <input className="cac-input" value={cacInput} onChange={(e) => setCacInput(e.target.value)} placeholder="RC 1234567" aria-label="CAC registration number" />
            <button className="btn btn-primary btn-sm" type="submit">{biz.cacVerification.status === 'REJECTED' ? 'Resubmit CAC' : 'Submit CAC'}</button>
          </form>
        )}
      </KycRow>

      <KycRow
        title="Level 3 · Physical shop verification"
        subtitle="A Market Admin confirms your shop in person — unlocks the Verified Dealer badge."
        status={biz.physicalVerification.status}
        rejectReason={biz.physicalVerification.rejectReason}
        verifiedNote="Verified Dealer"
        pendingCopy="An agent is scheduled to visit your shop — usually 3–5 business days in production."
        onApprove={() => { approvePhysical(); toast('🎉 Physically verified — Level 3 unlocked!'); }}
        onReject={() => { rejectPhysical('The shop address could not be confirmed — please check your plaza details.'); toast('Physical verification rejected (demo)', { kind: 'info' }); }}
      >
        {(biz.physicalVerification.status === 'NONE' || biz.physicalVerification.status === 'REJECTED') && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { requestPhysicalVerification(); toast('Physical verification requested — an agent will contact you', { kind: 'info' }); }}
          >
            {biz.physicalVerification.status === 'REJECTED' ? 'Request again' : 'Request physical verification'}
          </button>
        )}
      </KycRow>
    </div>
  );
}

function KycRow({ title, subtitle, status, rejectReason, verifiedNote, pendingCopy, onApprove, onReject, children }) {
  return (
    <div className="kyc-row">
      <div className="row-between">
        <b>{title}</b>
        {status === 'VERIFIED' && <StatusChip tone="green"><BadgeCheck size={12} /> Verified</StatusChip>}
        {status === 'PENDING' && <StatusChip tone="orange"><Clock size={12} /> Pending review</StatusChip>}
        {status === 'REJECTED' && <StatusChip tone="red"><XCircle size={12} /> Rejected</StatusChip>}
      </div>
      <p className="muted small no-margin">{subtitle}</p>

      {status === 'VERIFIED' && verifiedNote && <p className="kyc-verified-note"><Check size={13} /> {verifiedNote}</p>}
      {status === 'REJECTED' && rejectReason && <div className="callout reject-callout"><XCircle size={14} /> {rejectReason}</div>}
      {status === 'PENDING' && (
        <>
          <p className="muted small no-margin">{pendingCopy}</p>
          <div className="demo-box">
            <span className="demo-tag">Prototype controls</span>
            <div className="row gap wrap">
              <button className="btn btn-outline btn-sm" onClick={onApprove}><CheckCircle2 size={14} /> Simulate: admin approves</button>
              <button className="btn btn-outline btn-sm danger-text" onClick={onReject}><XCircle size={14} /> Simulate: admin rejects</button>
            </div>
          </div>
        </>
      )}
      {children}
    </div>
  );
}
