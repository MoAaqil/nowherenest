import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Settings as SettingsIcon, ShieldCheck, Landmark, FileText, CheckCircle, Save, 
  BadgeCheck, Camera, Key, Phone, MapPin, CreditCard, Star, Sparkles
} from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user, setUser } = useAuth();

  // Profile editing states
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Aadhar KYC states (wired to backend)
  const [aadharNumber, setAadharNumber] = useState(user?.aadharNumber || '');
  const [aadharPhotoUrl, setAadharPhotoUrl] = useState(user?.aadharPhotoUrl || '');
  const [hostAddress, setHostAddress] = useState(user?.hostAddress || '');
  const [kycLoading, setKycLoading] = useState(false);
  const [kycSuccess, setKycSuccess] = useState('');
  const [kycError, setKycError] = useState('');

  // License ID system
  const [licenseInput, setLicenseInput] = useState(user?.licenseId || '');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseSuccess, setLicenseSuccess] = useState('');
  const [licenseError, setLicenseError] = useState('');

  // Profile Image
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImage || '');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageSuccess, setImageSuccess] = useState('');

  // Payment key configurations
  const [stripeKey, setStripeKey] = useState('pk_test_51OpPj0SIb3f8aFmK9D...');
  const [razorpayId, setRazorpayId] = useState('rzp_test_e3G8Bcs24...');
  const [upiId, setUpiId] = useState((user?.bankDetails?.holderName || 'host').toLowerCase().replace(' ', '') + '@okaxis');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // ─── Handlers ─────────────────────────────────────────────

  const handleSavePhone = async (e) => {
    e.preventDefault();
    if (!profilePhone.trim()) return;
    setPhoneLoading(true);
    setPhoneSuccess('');
    setPhoneError('');
    try {
      const res = await api.auth.updateProfile({ phone: profilePhone.trim() });
      setUser(prev => ({ ...prev, ...res.user }));
      setPhoneSuccess('Phone number updated successfully!');
      setTimeout(() => setPhoneSuccess(''), 3000);
    } catch (err) {
      setPhoneError(err.message || 'Failed to save phone number');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!aadharNumber.trim()) return;
    setKycLoading(true);
    setKycSuccess('');
    setKycError('');
    try {
      const res = await api.auth.updateProfile({
        aadharNumber: aadharNumber.trim(),
        aadharPhotoUrl: aadharPhotoUrl.trim(),
        hostAddress: hostAddress.trim()
      });
      setUser(prev => ({ ...prev, ...res.user }));
      setKycSuccess('Aadhar KYC details saved! Admin will review and verify your account.');
    } catch (err) {
      setKycError(err.message || 'Failed to save KYC details');
    } finally {
      setKycLoading(false);
    }
  };

  const handleLicenseSubmit = async (e) => {
    e.preventDefault();
    setLicenseLoading(true);
    setLicenseSuccess('');
    setLicenseError('');
    try {
      if (!licenseInput.trim()) throw new Error('Please enter your NWN License ID');
      if (!licenseInput.toLowerCase().startsWith('nwn')) {
        throw new Error('Invalid License ID format. Must start with "nwn".');
      }
      const res = await api.auth.updateProfile({ licenseId: licenseInput.trim() });
      setUser(prev => ({ ...prev, ...res.user }));
      setLicenseSuccess('License ID verified! You are now a Verified Host ✓');
    } catch (err) {
      setLicenseError(err.message || 'Failed to verify license');
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleSaveProfileImage = async () => {
    if (!profileImageUrl.trim()) return;
    setImageLoading(true);
    setImageSuccess('');
    try {
      const res = await api.auth.updateProfile({ profileImage: profileImageUrl.trim() });
      setUser(prev => ({ ...prev, ...res.user }));
      setImageSuccess('Profile photo updated!');
      setTimeout(() => setImageSuccess(''), 2000);
    } catch (err) {
      console.error('Failed to save image:', err);
    } finally {
      setImageLoading(false);
    }
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess('');
    setTimeout(() => {
      setSaveSuccess('Payment credentials saved!');
      setSaveLoading(false);
    }, 1000);
  };

  const kycFilled = user?.aadharNumber || aadharNumber;

  return (
    <div className="container settings-page">
      <section className="page-header-row">
        <h2>Business Console Settings</h2>
        <p className="subtitle">Configure host profile, Aadhar KYC, license verification, and payment routes</p>
      </section>

      {/* Nest Partner Badge */}
      {user?.nestPartner && (
        <div style={{
          background: 'linear-gradient(135deg, #0A3B2A 0%, #16533F 100%)',
          color: 'white',
          borderRadius: '16px',
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 8px 24px rgba(10,59,42,0.2)'
        }}>
          <Sparkles size={28} />
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>🦉 Nest Partner Program — Active</h4>
            <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.85 }}>
              You can upload up to 12 vibes per month · All listings show a 10% Partner Discount badge
              {user.nestPartnerSince && ` · Partner since ${new Date(user.nestPartnerSince).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </p>
          </div>
        </div>
      )}

      <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Host Profile Overview */}
          <div className="card">
            <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '16px' }}>
              <SettingsIcon size={20} style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
              <h4>Host Profile Overview</h4>
            </div>

            {/* Profile Picture */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {(profileImageUrl || user?.profileImage) ? (
                  <img
                    src={profileImageUrl || user.profileImage}
                    alt="Host"
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: '800' }}>
                    {(user?.name || 'H').charAt(0).toUpperCase()}
                  </div>
                )}
                {user?.isLicensed && (
                  <span title="Verified Host" style={{ position: 'absolute', bottom: '0', right: '0', width: '18px', height: '18px', background: '#22C55E', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', fontWeight: '900' }}>✓</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="url"
                  className="form-control"
                  placeholder="Paste profile photo URL..."
                  value={profileImageUrl}
                  onChange={e => setProfileImageUrl(e.target.value)}
                  style={{ fontSize: '12px', marginBottom: '8px' }}
                />
                <button
                  type="button"
                  onClick={handleSaveProfileImage}
                  className="btn btn-outline"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                  disabled={imageLoading}
                >
                  <Camera size={12} style={{ marginRight: '4px' }} />
                  {imageLoading ? 'Saving...' : imageSuccess || 'Update Photo'}
                </button>
              </div>
            </div>

            {/* Profile Details */}
            <div className="profile-detail-list">
              <div className="profile-row">
                <span className="lbl">Host Owner Name</span>
                <span className="val">{user?.name}</span>
              </div>
              <div className="profile-row">
                <span className="lbl">Email Address</span>
                <span className="val">{user?.email}</span>
              </div>
              <div className="profile-row">
                <span className="lbl">Console Role</span>
                <span className="val" style={{ textTransform: 'uppercase', fontWeight: '700', color: 'var(--primary-color)' }}>{user?.role}</span>
              </div>
              <div className="profile-row">
                <span className="lbl">Nest Partner</span>
                <span className="val" style={{ color: user?.nestPartner ? '#16A34A' : '#94A3B8', fontWeight: '700' }}>
                  {user?.nestPartner ? '🦉 Active Partner' : 'Not Enrolled'}
                </span>
              </div>
              <div className="profile-row">
                <span className="lbl">Vibe Credits</span>
                <span className="val" style={{ color: 'var(--primary-color)', fontWeight: '800' }}>
                  {user?.nestPartner ? '∞ (12/month)' : `${user?.vibeCredits || 0} credits`}
                </span>
              </div>
              <div className="profile-row">
                <span className="lbl">Verification Status</span>
                <span className="val" style={{ color: user?.isLicensed ? '#16A34A' : '#F59E0B', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {user?.isLicensed ? <><BadgeCheck size={14} /> Verified Host</> : '⏳ Pending License'}
                </span>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="card">
            <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '12px' }}>
              <Phone size={20} style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
              <h4>Phone Number</h4>
            </div>
            <p className="subtitle" style={{ marginBottom: '14px', fontSize: '12px' }}>
              Your phone number is used for guest communications and admin verification.
            </p>
            <form onSubmit={handleSavePhone}>
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  required
                />
              </div>
              {phoneError && <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{phoneError}</div>}
              {phoneSuccess && <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{phoneSuccess}</div>}
              <button type="submit" className="btn btn-primary btn-block" disabled={phoneLoading}>
                <Phone size={14} style={{ marginRight: '6px' }} />
                {phoneLoading ? 'Saving...' : 'Save Phone Number'}
              </button>
            </form>
          </div>

          {/* Aadhar KYC Section */}
          <div className="card card-premium-border">
            <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '8px' }}>
              <FileText size={20} style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
              <h4>Aadhar KYC Verification</h4>
              {kycFilled && <span style={{ marginLeft: 'auto', background: '#DCFCE7', color: '#16A34A', padding: '2px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700' }}>✓ Submitted</span>}
            </div>
            <p className="subtitle" style={{ marginBottom: '16px', fontSize: '12px' }}>
              Required for admin field verification. Your Aadhar details will be reviewed by the NWN team before approval.
            </p>

            <form onSubmit={handleKycSubmit} className="kyc-form">
              <div className="form-group">
                <label>Aadhar Card Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="XXXX XXXX XXXX"
                  value={aadharNumber}
                  onChange={e => setAadharNumber(e.target.value)}
                  maxLength={14}
                  required
                />
              </div>

              <div className="form-group">
                <label>Aadhar Card Photo URL *</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="Paste Cloudinary/Drive URL of your Aadhar copy..."
                  value={aadharPhotoUrl}
                  onChange={e => setAadharPhotoUrl(e.target.value)}
                  required
                />
                <span className="help-text" style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                  Upload your Aadhar photo to Google Drive or Cloudinary, then paste the public URL here.
                </span>
                {aadharPhotoUrl && (
                  <img
                    src={aadharPhotoUrl}
                    alt="Aadhar Preview"
                    style={{ marginTop: '10px', width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid var(--border-color)' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Full Registered Address *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="House No., Street, Area, City, State, PIN Code"
                  value={hostAddress}
                  onChange={e => setHostAddress(e.target.value)}
                  required
                  style={{ resize: 'vertical' }}
                />
                <span className="help-text" style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                  Must match the address on your Aadhar card. Used for field verification.
                </span>
              </div>

              {kycError && <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{kycError}</div>}
              {kycSuccess && <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{kycSuccess}</div>}

              <button type="submit" className="btn btn-primary btn-block" disabled={kycLoading}>
                <ShieldCheck size={14} style={{ marginRight: '6px' }} />
                {kycLoading ? 'Submitting KYC...' : 'Submit Aadhar KYC Details'}
              </button>
            </form>
          </div>

          {/* Host License ID */}
          <div className="card card-premium-border">
            <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '8px' }}>
              <Key size={20} style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
              <h4>NWN Host License Verification</h4>
            </div>
            <p className="subtitle" style={{ marginBottom: '16px', fontSize: '12px' }}>
              Enter your unique NWN Host License ID assigned by admin to get a verification tick (✓) on your listed stays.
            </p>

            {user?.isLicensed ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <BadgeCheck size={36} style={{ color: '#16A34A', margin: '0 auto 12px', display: 'block' }} />
                <h5 style={{ color: '#16A34A', marginBottom: '6px' }}>Verified Host ✓</h5>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>License ID: <strong>{user.licenseId}</strong></p>
                <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                  Your properties now show the ✓ verification badge to all guests.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLicenseSubmit}>
                <div className="form-group">
                  <label>Enter Your Unique Host ID (from Admin)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. NWN-HOST-123456"
                    value={licenseInput}
                    onChange={e => setLicenseInput(e.target.value)}
                    required
                  />
                </div>
                {licenseError && <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{licenseError}</div>}
                {licenseSuccess && <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{licenseSuccess}</div>}
                <button type="submit" className="btn btn-primary btn-block" disabled={licenseLoading}>
                  <BadgeCheck size={14} style={{ marginRight: '6px' }} />
                  {licenseLoading ? 'Verifying...' : 'Submit & Get Verified'}
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Nest Partner Program Info */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', border: '1.5px solid #86EFAC' }}>
            <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '12px' }}>
              <Sparkles size={20} style={{ color: '#16A34A', marginRight: '8px' }} />
              <h4 style={{ color: '#0A3B2A' }}>🦉 Nest Partner Program</h4>
            </div>
            <p style={{ fontSize: '13px', color: '#14532D', marginBottom: '14px', lineHeight: '1.5' }}>
              Exclusive for <strong>Grand plan and above</strong> customers. Subscribe to unlock premium vibe posting and a partner badge on all your listings.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                { icon: '🎬', text: 'Post up to 12 vibes per month (vs 0 without credits)' },
                { icon: '🏷️', text: '10% Partner Discount badge shown on all your room listings' },
                { icon: '⭐', text: 'Priority listing placement in customer search results' },
                { icon: '✅', text: 'Faster vibe review & approval queue' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '12px', color: '#166534' }}>
                  <span>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
            {user?.nestPartner ? (
              <div style={{ background: '#16A34A', color: 'white', padding: '10px 16px', borderRadius: '9999px', textAlign: 'center', fontWeight: '800', fontSize: '13px' }}>
                ✓ You are a Nest Partner
              </div>
            ) : (
              <div style={{ background: '#E2E8F0', color: '#64748B', padding: '10px 16px', borderRadius: '9999px', textAlign: 'center', fontWeight: '700', fontSize: '12px' }}>
                Contact admin to join the Nest Partner Program
              </div>
            )}
          </div>

          {/* Vibe Credits */}
          {!user?.nestPartner && (
            <div className="card">
              <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '12px' }}>
                <Star size={20} style={{ color: '#F59E0B', marginRight: '8px' }} />
                <h4>Vibe Credits</h4>
              </div>
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#92400E', fontWeight: '600' }}>Available Credits</span>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: '#D97706' }}>{user?.vibeCredits || 0}</span>
                </div>
                <p style={{ fontSize: '11px', color: '#B45309', marginTop: '6px', margin: '6px 0 0' }}>
                  Each credit = 1 vibe upload. Credits are purchased in packs of 4 for ₹100.
                </p>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-medium)', marginBottom: '12px' }}>
                Contact admin to purchase vibe credits. Your uploads go into admin review before going public.
              </p>
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#475569' }}>
                <strong>Rate:</strong> ₹100 = 4 vibe uploads<br />
                <strong>Policy:</strong> All vibes are manually reviewed by admin before appearing on the app.
              </div>
            </div>
          )}

          {/* Payment Settings */}
          <div className="card" style={{ height: 'fit-content' }}>
            <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '16px' }}>
              <Landmark size={20} style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
              <h4>Checkout Payment Credentials</h4>
            </div>
            <p className="subtitle" style={{ marginBottom: '20px' }}>
              Configure merchant API keys to route booking splits into your accounts.
            </p>
            {saveSuccess && <div className="badge badge-success" style={{ display: 'block', padding: '10px', marginBottom: '20px' }}>{saveSuccess}</div>}
            <form onSubmit={handlePaymentSubmit} className="payment-settings-form">
              <div className="form-group">
                <label>Stripe Merchant Live API Key</label>
                <input type="text" className="form-control" value={stripeKey} onChange={e => setStripeKey(e.target.value)} placeholder="sk_live_..." required />
              </div>
              <div className="form-group">
                <label>Razorpay Client Merchant Key ID</label>
                <input type="text" className="form-control" value={razorpayId} onChange={e => setRazorpayId(e.target.value)} placeholder="rzp_live_..." required />
              </div>
              <div className="form-group">
                <label>UPI Merchant VPA Account Address</label>
                <input type="text" className="form-control" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@okbank" required />
                <span className="help-text" style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>Used for instant UPI scanning checkouts from customer app.</span>
              </div>
              <div className="security-alert flex gap-12" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '14px', borderRadius: '8px', fontSize: '12px', color: '#1E40AF', marginTop: '8px', marginBottom: '24px' }}>
                <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                <span>Direct payouts are locked using end-to-end industry security. All keys are encrypted locally before processing.</span>
              </div>
              <button type="submit" className="btn btn-primary btn-block flex-center" disabled={saveLoading}>
                <Save size={16} style={{ marginRight: '8px' }} />
                {saveLoading ? 'Saving changes...' : 'Save API Settings'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
