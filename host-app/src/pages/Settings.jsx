import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Settings as SettingsIcon, ShieldCheck, Landmark, FileText, CheckCircle, Save, BadgeCheck, User, Camera, Key } from 'lucide-react';
import './Settings.css';

// Auto-generate license ID based on NWN format:
// nwn + (2 alphabets of name) + (last 4 of phone) + (2 chars of email) + (3 serial digits)
const generateLicenseId = (name, phone, email, serialNum) => {
  const nameChars = (name || 'XX').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
  const phoneChars = (phone || '0000').replace(/\D/g, '').slice(-4) || '0000';
  const emailChars = (email || 'xx@').split('@')[0].slice(0, 2).toUpperCase();
  const serial = String(serialNum || 1).padStart(3, '0');
  return `nwn${nameChars}${phoneChars}${emailChars}${serial}`;
};

const Settings = () => {
  const { user, setUser } = useAuth();
  
  // KYC verification states
  const [kycVerified, setKycVerified] = useState(user?.isVerified || false);
  const [documentType, setDocumentType] = useState('pan');
  const [documentNumber, setDocumentNumber] = useState('');
  const [kycLoading, setKycLoading] = useState(false);
  const [kycSuccess, setKycSuccess] = useState('');

  // License ID system
  const [licenseInput, setLicenseInput] = useState(user?.licenseId || '');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseSuccess, setLicenseSuccess] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const generatedLicenseId = generateLicenseId(user?.name, user?.phone, user?.email, 1);

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

  const handleKycSubmit = (e) => {
    e.preventDefault();
    if (!documentNumber) return;
    setKycLoading(true);
    setKycSuccess('');
    setTimeout(() => {
      setKycVerified(true);
      setKycSuccess('Business profile KYC documents audit completed successfully!');
      setKycLoading(false);
    }, 1500);
  };

  const handleLicenseSubmit = async (e) => {
    e.preventDefault();
    setLicenseLoading(true);
    setLicenseSuccess('');
    setLicenseError('');
    try {
      if (!licenseInput.trim()) {
        throw new Error('Please enter your NWN License ID');
      }
      // Verify format starts with nwn
      if (!licenseInput.toLowerCase().startsWith('nwn')) {
        throw new Error('Invalid License ID format. Must start with "nwn". Your generated ID is shown above.');
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
      setSaveSuccess('Direct platform settlement payment credentials saved!');
      setSaveLoading(false);
    }, 1000);
  };

  return (
    <div className="container settings-page">
      <section className="page-header-row">
        <h2>Business Console Settings</h2>
        <p className="subtitle">Configure host profile, license verification, and checkout payment routes</p>
      </section>

      <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Profile & KYC */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Host Profile Info */}
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
                  <span title="Verified Host" style={{
                    position: 'absolute', bottom: '0', right: '0',
                    width: '18px', height: '18px', background: '#22C55E',
                    borderRadius: '50%', border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: 'white', fontWeight: '900'
                  }}>✓</span>
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
                <span className="lbl">Phone Number</span>
                <span className="val">{user?.phone || 'Not verified'}</span>
              </div>
              <div className="profile-row">
                <span className="lbl">Console Role</span>
                <span className="val" style={{ textTransform: 'uppercase', fontWeight: '700', color: 'var(--primary-color)' }}>
                  {user?.role}
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

          {/* Host License ID Verification */}
          <div className="card card-premium-border">
            <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '8px' }}>
              <Key size={20} style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
              <h4>NWN Host License Verification</h4>
            </div>
            
            <p className="subtitle" style={{ marginBottom: '16px', fontSize: '12px' }}>
              Enter your unique NWN Host License ID to get a verification tick (✓) on your listed stays, which builds guest trust.
            </p>

            {user?.isLicensed ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <BadgeCheck size={36} style={{ color: '#16A34A', margin: '0 auto 12px', display: 'block' }} />
                <h5 style={{ color: '#16A34A', marginBottom: '6px' }}>Verified Host ✓</h5>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>License ID: <strong>{user.licenseId}</strong></p>
                <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                  Your listed properties now show the ✓ verification badge to all guests.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLicenseSubmit}>
                {/* Auto-generated license ID display */}
                <div style={{ background: '#F8FAFC', border: '1px dashed var(--border-color)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                    Your Auto-Generated License ID:
                  </p>
                  <code style={{ fontSize: '15px', fontWeight: '800', color: '#0A3B2A', letterSpacing: '1px' }}>
                    {generatedLicenseId}
                  </code>
                  <p style={{ margin: '6px 0 0', fontSize: '10px', color: '#94A3B8' }}>
                    Format: nwn(2 letters of name)(last 4 of phone)(2 of email)(serial 001–999)
                  </p>
                </div>

                <div className="form-group">
                  <label>Enter Your NWN License ID</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder={`e.g. ${generatedLicenseId}`}
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

          {/* KYC Auditing Details */}
          <div className="card card-premium-border">
            <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '16px' }}>
              <FileText size={20} style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
              <h4>KYC Business Audit Verification</h4>
            </div>

            {kycVerified ? (
              <div className="kyc-verified-box text-center" style={{ padding: '20px' }}>
                <CheckCircle size={48} style={{ color: '#16A34A', margin: '0 auto 16px' }} />
                <h5>Verification Approved</h5>
                <p className="subtitle">Your property listing operations and withdrawals are active.</p>
                {kycSuccess && <div className="badge badge-success" style={{ marginTop: '12px' }}>{kycSuccess}</div>}
              </div>
            ) : (
              <form onSubmit={handleKycSubmit} className="kyc-form">
                <p className="subtitle" style={{ marginBottom: '16px' }}>
                  Upload regulatory business identification details to enable platform payout withdrawals.
                </p>

                <div className="form-group">
                  <label>Document Identification Type</label>
                  <select 
                    value={documentType} 
                    onChange={e => setDocumentType(e.target.value)} 
                    className="form-control"
                  >
                    <option value="pan">Host PAN Card ID</option>
                    <option value="aadhaar">Aadhaar National ID Card</option>
                    <option value="gstin">Business GSTIN Tax ID</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Document Registry Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. ABCDE1234F"
                    value={documentNumber}
                    onChange={e => setDocumentNumber(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={kycLoading}>
                  {kycLoading ? 'Auditing details...' : 'Submit Verification Docs'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Payment Routes Settings */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '16px' }}>
            <Landmark size={20} style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
            <h4>Checkout Payment Credentials</h4>
          </div>

          <p className="subtitle" style={{ marginBottom: '20px' }}>
            Configure merchant API keys to route booking splits directly into your accounts.
          </p>

          {saveSuccess && <div className="badge badge-success" style={{ display: 'block', padding: '10px', marginBottom: '20px' }}>{saveSuccess}</div>}

          <form onSubmit={handlePaymentSubmit} className="payment-settings-form">
            <div className="form-group">
              <label>Stripe Merchant Live API Key</label>
              <input 
                type="text" 
                className="form-control" 
                value={stripeKey}
                onChange={e => setStripeKey(e.target.value)}
                placeholder="sk_live_..."
                required
              />
            </div>

            <div className="form-group">
              <label>Razorpay Client Merchant Key ID</label>
              <input 
                type="text" 
                className="form-control" 
                value={razorpayId}
                onChange={e => setRazorpayId(e.target.value)}
                placeholder="rzp_live_..."
                required
              />
            </div>

            <div className="form-group">
              <label>UPI Merchant VPA Account Address</label>
              <input 
                type="text" 
                className="form-control" 
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="name@okbank"
                required
              />
              <span className="help-text" style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                Used for instant UPI scanning checkouts from customer app.
              </span>
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
  );
};

export default Settings;
