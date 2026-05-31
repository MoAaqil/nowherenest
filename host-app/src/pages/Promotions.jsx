import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Tag, Plus, Trash2, Calendar, X, AlertCircle } from 'lucide-react';
import './Promotions.css';

const Promotions = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [expiryDate, setExpiryDate] = useState('');
  const [maxUses, setMaxUses] = useState('100');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchCoupons(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.properties.getOwnerProperties();
      setProperties(res.properties);
      if (res.properties.length > 0) {
        setSelectedPropertyId(res.properties[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to load properties');
      setLoading(false);
    }
  };

  const fetchCoupons = async (propertyId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.coupons.getPropertyCoupons(propertyId);
      setCoupons(res.coupons || []);
    } catch (err) {
      setError(err.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setCode('');
    setDiscountPercent('10');
    setMaxUses('100');
    // Set default expiry date to 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setExpiryDate(d.toISOString().split('T')[0]);
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!code || !discountPercent || !expiryDate) return;
    setFormError('');
    setFormLoading(true);

    try {
      await api.coupons.create({
        propertyId: selectedPropertyId,
        code,
        discountPercent: parseInt(discountPercent),
        expiryDate: new Date(expiryDate),
        maxUses: parseInt(maxUses) || 100
      });
      setShowModal(false);
      fetchCoupons(selectedPropertyId);
    } catch (err) {
      setFormError(err.message || 'Failed to create coupon code');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCoupon = async (id, codeString) => {
    if (!window.confirm(`Delete the coupon "${codeString}"?`)) return;
    try {
      await api.coupons.delete(id);
      fetchCoupons(selectedPropertyId);
    } catch (err) {
      alert(err.message || 'Deletion failed');
    }
  };

  return (
    <div className="container promotions-page">
      <section className="flex-between page-header-row flex-wrap gap-12">
        <div>
          <h2>Manage Promotions & Campaigns</h2>
          <p className="subtitle">Configure discount codes and campaign guidelines for listings</p>
        </div>

        {properties.length > 0 && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} /> Create Coupon
          </button>
        )}
      </section>

      {/* Property banner */}
      <section className="property-banner card flex-between flex-wrap gap-12" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div className="flex-center">
          <Tag size={18} style={{ color: 'var(--primary-color)', marginRight: '10px' }} />
          <h5 style={{ fontSize: '15px', fontWeight: '800' }}>Active Property Context:</h5>
        </div>
        
        <select 
          value={selectedPropertyId} 
          onChange={e => setSelectedPropertyId(e.target.value)}
          className="form-control"
          style={{ width: '280px', padding: '8px 12px' }}
        >
          {properties.length === 0 ? (
            <option value="">No properties available</option>
          ) : (
            properties.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))
          )}
        </select>
      </section>

      {error && <div className="error-card">{error}</div>}

      {loading ? (
        <div className="flex-center" style={{ padding: '60px' }}>Loading Coupons...</div>
      ) : properties.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <AlertCircle size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h5>No Properties Available</h5>
          <p className="subtitle">You must create a property first in the Properties tab before configuring promotions.</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <Tag size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h5>No Active Campaigns</h5>
          <p className="subtitle" style={{ marginBottom: '16px' }}>Offer discounts to boost booking occupancy rate.</p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount Percent</th>
                <th>Usage Limit</th>
                <th>Times Used</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const expired = new Date() > new Date(c.expiryDate);
                const active = c.isActive && !expired;
                return (
                  <tr key={c._id}>
                    <td>
                      <div className="coupon-code-badge flex-center">
                        <Tag size={12} style={{ marginRight: '6px' }} />
                        <span>{c.code}</span>
                      </div>
                    </td>
                    <td><strong style={{ fontSize: '15px' }}>{c.discountPercent}% OFF</strong></td>
                    <td>{c.maxUses} uses limit</td>
                    <td>{c.usesCount} times used</td>
                    <td>
                      <div className="flex-center gap-4" style={{ justifyContent: 'flex-start' }}>
                        <Calendar size={14} style={{ color: 'var(--text-light)' }} />
                        <span>{new Date(c.expiryDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${active ? 'badge-success' : 'badge-danger'}`}>
                        {expired ? 'Expired' : active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleDeleteCoupon(c._id, c.code)}
                        className="btn-action-circle danger"
                        title="Delete coupon"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex-between modal-header" style={{ marginBottom: '24px' }}>
              <h4>Create Promotional Coupon</h4>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>

            {formError && <div className="login-error-alert" style={{ marginBottom: '16px' }}>{formError}</div>}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Coupon Code</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. SUMMER20"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Discount Percentage (%)</label>
                  <select 
                    value={discountPercent} 
                    onChange={e => setDiscountPercent(e.target.value)}
                    className="form-control"
                  >
                    <option value="5">5% Off</option>
                    <option value="10">10% Off</option>
                    <option value="15">15% Off</option>
                    <option value="20">20% Off</option>
                    <option value="25">25% Off</option>
                    <option value="30">30% Off</option>
                    <option value="50">50% Half Price</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Usage Limit (Max Uses)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={maxUses}
                    onChange={e => setMaxUses(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex-between gap-12" style={{ marginTop: '32px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Activate Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promotions;
