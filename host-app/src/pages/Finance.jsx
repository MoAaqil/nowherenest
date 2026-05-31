import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Wallet, Landmark, ArrowDownLeft, ShieldCheck, CreditCard, Clock, CheckCircle } from 'lucide-react';
import './Finance.css';

const Finance = () => {
  const { user, updateBankDetails, triggerWalletRedeem } = useAuth();
  
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redemptions
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [redeemError, setRedeemError] = useState('');

  // Bank Form Edit
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [holderName, setHolderName] = useState('');
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');

  useEffect(() => {
    fetchPayouts();
    if (user?.bankDetails) {
      setBankName(user.bankDetails.bankName || '');
      setAccountNumber(user.bankDetails.accountNumber || '');
      setIfscCode(user.bankDetails.ifscCode || '');
      setHolderName(user.bankDetails.holderName || '');
    }
  }, [user]);

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.payouts.getMyPayouts();
      setPayouts(res.payouts || []);
    } catch (err) {
      setError(err.message || 'Failed to load payout history');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) return;
    
    if (parseFloat(redeemAmount) > (user?.walletBalance || 0)) {
      setRedeemError('Insufficient wallet balance');
      return;
    }

    if (!user?.bankDetails?.accountNumber) {
      setRedeemError('Please configure your bank details first');
      return;
    }

    setRedeemError('');
    setRedeemSuccess('');
    setRedeemLoading(true);

    try {
      await triggerWalletRedeem(parseFloat(redeemAmount));
      setRedeemSuccess(`Payout request of ₹${parseFloat(redeemAmount).toLocaleString('en-IN')} submitted successfully!`);
      setRedeemAmount('');
      fetchPayouts();
    } catch (err) {
      setRedeemError(err.message || 'Redemption request failed');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setBankError('');
    setBankLoading(true);

    try {
      await updateBankDetails({
        bankName,
        accountNumber,
        ifscCode,
        holderName
      });
      setIsEditingBank(false);
    } catch (err) {
      setBankError(err.message || 'Failed to update bank details');
    } finally {
      setBankLoading(false);
    }
  };

  return (
    <div className="container finance-page">
      <section className="page-header-row">
        <h2>Finances & Payouts</h2>
        <p className="subtitle">Track direct hotel earnings, request bank transfers, and edit bank details</p>
      </section>

      {error && <div className="error-card">{error}</div>}

      <div className="finance-layout grid grid-cols-3">
        {/* Left Side: Balance Card */}
        <div className="card card-premium-border wallet-card text-center">
          <div className="wallet-icon-wrapper flex-center">
            <Wallet size={32} />
          </div>
          <span className="wallet-lbl">Available Balance</span>
          <h2 className="wallet-val">₹{user?.walletBalance ? user.walletBalance.toLocaleString('en-IN') : '0'}</h2>
          
          <hr className="divider" style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
          
          {redeemSuccess && <div className="badge badge-success" style={{ display: 'block', padding: '8px', marginBottom: '12px' }}>{redeemSuccess}</div>}
          {redeemError && <div className="badge badge-danger" style={{ display: 'block', padding: '8px', marginBottom: '12px' }}>{redeemError}</div>}

          <form onSubmit={handleRedeem} className="redeem-form">
            <div className="form-group">
              <label>Amount to Withdraw (INR)</label>
              <input 
                type="number" 
                placeholder="e.g. 5000"
                value={redeemAmount}
                onChange={e => setRedeemAmount(e.target.value)}
                className="form-control"
                style={{ textAlign: 'center', fontSize: '18px', fontWeight: '700' }}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={redeemLoading || !user?.walletBalance || user.walletBalance <= 0}
            >
              {redeemLoading ? 'Processing...' : 'Transfer to Bank'}
            </button>
          </form>
        </div>

        {/* Center: Bank Details Card */}
        <div className="card bank-details-card">
          <div className="flex-between card-title-row" style={{ marginBottom: '20px' }}>
            <div className="flex-center">
              <Landmark size={20} style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
              <h4>Linked Bank Account</h4>
            </div>
            
            {!isEditingBank && (
              <button onClick={() => setIsEditingBank(true)} className="btn btn-secondary btn-small">
                Modify Account
              </button>
            )}
          </div>

          {isEditingBank ? (
            <form onSubmit={handleBankSubmit} className="bank-form">
              {bankError && <div className="badge badge-danger" style={{ display: 'block', padding: '8px', marginBottom: '12px' }}>{bankError}</div>}
              
              <div className="form-group">
                <label>Account Holder Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={holderName}
                  onChange={e => setHolderName(e.target.value)}
                  placeholder="Albert D"
                  required 
                />
              </div>

              <div className="form-group">
                <label>Bank Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="HDFC Bank"
                  required 
                />
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="50100..."
                  required 
                />
              </div>

              <div className="form-group">
                <label>IFSC Code</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={ifscCode}
                  onChange={e => setIfscCode(e.target.value)}
                  placeholder="HDFC0000123"
                  required 
                />
              </div>

              <div className="flex-between gap-12">
                <button type="button" onClick={() => setIsEditingBank(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={bankLoading}>
                  {bankLoading ? 'Saving...' : 'Link Account'}
                </button>
              </div>
            </form>
          ) : user?.bankDetails?.accountNumber ? (
            <div className="bank-info-display">
              <div className="bank-display-row">
                <span className="lbl">Holder Name</span>
                <span className="val">{user.bankDetails.holderName}</span>
              </div>
              <div className="bank-display-row">
                <span className="lbl">Bank Name</span>
                <span className="val">{user.bankDetails.bankName}</span>
              </div>
              <div className="bank-display-row">
                <span className="lbl">Account Number</span>
                <span className="val">•••• •••• •••• {user.bankDetails.accountNumber.slice(-4)}</span>
              </div>
              <div className="bank-display-row">
                <span className="lbl">IFSC Code</span>
                <span className="val">{user.bankDetails.ifscCode}</span>
              </div>

              <div className="security-note flex gap-8">
                <ShieldCheck size={16} style={{ color: '#16A34A', flexShrink: 0 }} />
                <span>Account setup verified for 90% direct booking payouts splits.</span>
              </div>
            </div>
          ) : (
            <div className="bank-empty-state text-center" style={{ padding: '24px 0' }}>
              <CreditCard size={36} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
              <p className="subtitle">No bank account linked. Link your account to withdraw funds.</p>
              <button onClick={() => setIsEditingBank(true)} className="btn btn-primary btn-small" style={{ marginTop: '12px' }}>
                Setup Bank Details
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Security guidelines */}
        <div className="card info-notes-card flex-col-card">
          <h4>Payout Schedules</h4>
          <p className="subtitle" style={{ marginBottom: '16px' }}>Direct app settlements occur instantly.</p>
          
          <div className="payout-guideline-item flex gap-12" style={{ marginBottom: '12px' }}>
            <div className="bullet-circle flex-center">1</div>
            <div>
              <h6>Instant Wallet Settlement</h6>
              <p className="desc" style={{ fontSize: '12px', color: 'var(--text-medium)' }}>Booking funds credit immediately upon check-in completion.</p>
            </div>
          </div>

          <div className="payout-guideline-item flex gap-12" style={{ marginBottom: '12px' }}>
            <div className="bullet-circle flex-center">2</div>
            <div>
              <h6>Split Commission Deductions</h6>
              <p className="desc" style={{ fontSize: '12px', color: 'var(--text-medium)' }}>Our platform applies a minor 10% commission. The remaining 90% goes directly to you.</p>
            </div>
          </div>

          <div className="payout-guideline-item flex gap-12">
            <div className="bullet-circle flex-center">3</div>
            <div>
              <h6>KYC Verification Check</h6>
              <p className="desc" style={{ fontSize: '12px', color: 'var(--text-medium)' }}>Ensure your bank details match your registration profiles for audit approval.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout History Section */}
      <section className="payouts-history-section" style={{ marginTop: '40px' }}>
        <h4>Withdrawal History</h4>
        {loading ? (
          <div className="flex-center" style={{ padding: '32px' }}>Loading History...</div>
        ) : payouts.length === 0 ? (
          <div className="card text-center" style={{ padding: '32px', marginTop: '16px' }}>
            <Clock size={36} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
            <p className="subtitle">No withdrawal payouts requested yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Date & Time</th>
                  <th>Amount</th>
                  <th>Settlement Bank</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={p._id}>
                    <td><span className="request-id-mono">#{(p._id).slice(-8).toUpperCase()}</span></td>
                    <td>{new Date(p.createdAt).toLocaleString()}</td>
                    <td><strong style={{ fontSize: '15px' }}>₹{p.amount.toLocaleString('en-IN')}</strong></td>
                    <td>{user?.bankDetails?.bankName} (•••• {user?.bankDetails?.accountNumber?.slice(-4)})</td>
                    <td>
                      <span className={`badge ${
                        p.status === 'completed' ? 'badge-success' : 
                        p.status === 'pending' ? 'badge-warning' : 
                        'badge-danger'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Finance;
