import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Plus, Landmark, DollarSign, Wallet, Layers, Calendar, MapPin, Check, PlusCircle, Trash2, CheckCircle } from 'lucide-react';
import LeafletMap from '../components/LeafletMap';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
  const { user, updateBankDetails, triggerWalletRedeem } = useAuth();
  
  // Tabs: 'listings', 'bookings', 'payouts', 'add_listing'
  const [activeTab, setActiveTab] = useState('listings');
  
  // Data lists
  const [myListings, setMyListings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [myPayouts, setMyPayouts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Bank Form Fields
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(user?.bankDetails?.ifscCode || '');
  const [holderName, setHolderName] = useState(user?.bankDetails?.holderName || '');

  // Payout request fields
  const [redeemAmount, setRedeemAmount] = useState('');

  // Add Listing Form Fields
  const [listType, setListType] = useState('stay'); // 'stay' or 'rental'
  const [listCategory, setListCategory] = useState('cottage'); // cottage, hotel, pg, apartment
  const [listTitle, setListTitle] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [listDeposit, setListDeposit] = useState(''); // for rentals
  const [listAddress, setListAddress] = useState('');
  const [listLat, setListLat] = useState(9.5929); // default Kerala coords
  const [listLng, setListLng] = useState(76.4227);
  const [listAmenities, setListAmenities] = useState([]);
  const [listImage, setListImage] = useState('');
  
  // Custom Experiences / USPs creator inside form
  const [uspsList, setUspsList] = useState([]);
  const [newUspTitle, setNewUspTitle] = useState('');
  const [newUspDesc, setNewUspDesc] = useState('');
  const [newUspPrice, setNewUspPrice] = useState('');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'listings') {
        const res = await api.listings.getOwnerListings();
        setMyListings(res.listings);
      } else if (activeTab === 'bookings') {
        const res = await api.bookings.getOwnerBookings();
        setMyBookings(res.bookings);
      } else if (activeTab === 'payouts') {
        const res = await api.payouts.getMyPayouts();
        setMyPayouts(res.payouts);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard records');
    } finally {
      setLoading(false);
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setError(null);
    try {
      await updateBankDetails({ bankName, accountNumber, ifscCode, holderName });
      setSuccessMsg('Bank account linked successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setError(null);
    try {
      const amt = parseFloat(redeemAmount);
      if (isNaN(amt) || amt <= 0) throw new Error('Enter a valid positive payout amount');
      await triggerWalletRedeem(amt);
      setSuccessMsg(`Withdrawal request for $${amt} submitted to Admin! Balance deducted.`);
      setRedeemAmount('');
      setActiveTab('payouts');
    } catch (err) {
      setError(err.message);
    }
  };

  // Amenities checklist helper
  const handleAmenityCheck = (amenity) => {
    if (listAmenities.includes(amenity)) {
      setListAmenities(listAmenities.filter(a => a !== amenity));
    } else {
      setListAmenities([...listAmenities, amenity]);
    }
  };

  // Adding Custom USP Experience Helper
  const addUspToForm = () => {
    if (!newUspTitle) return;
    const price = parseFloat(newUspPrice) || 0;
    setUspsList([...uspsList, { title: newUspTitle, description: newUspDesc, price }]);
    setNewUspTitle('');
    setNewUspDesc('');
    setNewUspPrice('');
  };

  const removeUspFromForm = (idx) => {
    setUspsList(uspsList.filter((_, i) => i !== idx));
  };

  // List Coordinate Picker click
  const handleMapCoordSelect = ({ lat, lng }) => {
    setListLat(parseFloat(lat.toFixed(6)));
    setListLng(parseFloat(lng.toFixed(6)));
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      const priceVal = parseFloat(listPrice);
      const depVal = parseFloat(listDeposit) || 0;
      if (isNaN(priceVal)) throw new Error('Price must be a valid numeric value');

      const payload = {
        type: listType,
        category: listCategory,
        title: listTitle,
        description: listDesc,
        price: priceVal,
        advanceDeposit: listType === 'rental' ? depVal : 0,
        location: {
          address: listAddress,
          lat: listLat,
          lng: listLng
        },
        amenities: listAmenities,
        images: listImage ? [listImage] : ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'],
        usps: uspsList
      };

      await api.listings.create(payload);
      setSuccessMsg('Property listing successfully posted! View it on searches.');
      
      // Reset form fields
      setListTitle('');
      setListDesc('');
      setListPrice('');
      setListDeposit('');
      setListAddress('');
      setListAmenities([]);
      setListImage('');
      setUspsList([]);
      
      setActiveTab('listings');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="owner-dashboard-page container">
      {/* Upper overview stat boxes */}
      <section className="dashboard-stats flex-between flex-wrap">
        <div className="stat-box card flex" style={{ width: '100%' }}>
          <div className="stat-icon-circle bank-circle flex-center"><Landmark size={24} /></div>
          <div className="stat-data text-left">
            <span className="stat-lbl">Linked Bank Account</span>
            <span className="bank-account-brief font-weight-bold">
              {user?.bankDetails?.accountNumber 
                ? `${user.bankDetails.bankName} (..${user.bankDetails.accountNumber.slice(-4)})`
                : 'No Linked Bank Account'
              }
            </span>
          </div>
        </div>
      </section>

      {/* Main layout */}
      <div className="dashboard-layout">
        {/* Left Side: Sidebar nav controls */}
        <aside className="dashboard-sidebar card">
          <button className={activeTab === 'listings' ? 'active' : ''} onClick={() => setActiveTab('listings')}>
            <Layers size={18} />
            <span>My Listings</span>
          </button>
          <button className={activeTab === 'bookings' ? 'active' : ''} onClick={() => setActiveTab('bookings')}>
            <Calendar size={18} />
            <span>Guest Bookings</span>
          </button>
          <button className={activeTab === 'payouts' ? 'active' : ''} onClick={() => setActiveTab('payouts')}>
            <DollarSign size={18} />
            <span>Payout Redemptions</span>
          </button>
          <button className={activeTab === 'add_listing' ? 'active' : ''} onClick={() => setActiveTab('add_listing')}>
            <Plus size={18} />
            <span>Add Stay / PG Listing</span>
          </button>
        </aside>

        {/* Right Side: Tab Contents */}
        <main className="dashboard-main-content">
          {error && <div className="login-error-alert">{error}</div>}
          {successMsg && <div className="login-success-alert">{successMsg}</div>}

          {/* TAB 1: LISTINGS */}
          {activeTab === 'listings' && (
            <div className="tab-listings-container">
              <h3 className="tab-heading">My Active Listings</h3>
              {loading ? (
                <span>Loading listings...</span>
              ) : myListings.length === 0 ? (
                <div className="card empty-state text-center" style={{ padding: '40px' }}>
                  <p>You have not published any property listings yet.</p>
                  <button onClick={() => setActiveTab('add_listing')} className="btn btn-primary btn-small" style={{ marginTop: '16px' }}>
                    Publish First Stay / PG
                  </button>
                </div>
              ) : (
                <div className="listings-grid grid grid-cols-2">
                  {myListings.map(item => (
                    <div key={item._id} className="stay-horizontal-card card">
                      <div className="card-image-panel">
                        <img src={item.images[0]} alt={item.title} />
                        <div className="price-tag-pill">
                          ${item.price}<span>/{item.type === 'stay' ? 'night' : 'month'}</span>
                        </div>
                      </div>
                      <div className="card-info-panel">
                        <span className="stay-category">{item.category} ({item.type})</span>
                        <h5>{item.title}</h5>
                        <p className="card-location"><MapPin size={12} /> {item.location.address}</p>
                        <div className="card-action-row" style={{ marginTop: '12px' }}>
                          <Link to={`/listing/${item._id}`} className="btn btn-secondary btn-small">Preview Page</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="tab-bookings-container card">
              <h3 className="tab-heading" style={{ padding: '20px 20px 0' }}>Sales & Reservations</h3>
              {loading ? (
                <span style={{ padding: '20px', display: 'block' }}>Loading bookings...</span>
              ) : myBookings.length === 0 ? (
                <p style={{ padding: '40px', textAlign: 'center' }}>No bookings received yet from guests.</p>
              ) : (
                <div className="bookings-table-wrapper" style={{ overflowX: 'auto' }}>
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Guest</th>
                        <th>Dates / Months</th>
                        <th>Subtotal Received</th>
                        <th>App Comm. (10%)</th>
                        <th>Owner Profit Credited</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBookings.map(b => (
                        <tr key={b._id}>
                          <td><strong>{b.listing?.title || 'Removed stay'}</strong></td>
                          <td>
                            {b.customer?.name}<br />
                            <small>{b.customer?.phone}</small>
                          </td>
                          <td>
                            {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                          </td>
                          <td><strong>${b.totalAmount}</strong></td>
                          <td><span className="text-danger">-${b.commissionAmount}</span></td>
                          <td><span className="text-success" style={{ fontWeight: 700 }}>+${b.ownerAmount}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYOUT REDEMPTIONS */}
          {activeTab === 'payouts' && (
            <div className="tab-payouts-container">
              <div className="grid grid-cols-2" style={{ marginBottom: '32px' }}>
                {/* 1. Withdrawal form */}
                <div className="card" style={{ padding: '24px' }}>
                  <h4>Redeem Wallet Balance</h4>
                  <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-medium)', marginBottom: '20px' }}>
                    Note: Minimum payout amount is $100. Withdrawals are processed instantly into your linked bank account.
                  </p>
                  <form onSubmit={handleRedeemSubmit}>
                    <div className="form-group">
                      <label>Amount to Withdraw ($)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="$100.00" 
                        value={redeemAmount}
                        onChange={e => setRedeemAmount(e.target.value)}
                        required 
                      />
                    </div>
                    <button type="submit" className="btn btn-accent btn-block" disabled={user?.walletBalance < 100}>
                      Request Withdrawal
                    </button>
                  </form>
                </div>

                {/* 2. Link bank account */}
                <div className="card" style={{ padding: '24px' }}>
                  <h4>Bank Account Details</h4>
                  <form onSubmit={handleBankSubmit}>
                    <div className="form-group">
                      <label>Bank Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="HDFC Bank, SBI..." 
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Account Number</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="50100XXXXXXXXX" 
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-2" style={{ gap: '12px' }}>
                      <div className="form-group">
                        <label>IFSC Code</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="HDFC0000123" 
                          value={ifscCode}
                          onChange={e => setIfscCode(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label>Account Holder Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Albert D" 
                          value={holderName}
                          onChange={e => setHolderName(e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-outline btn-block">
                      Link Bank Profile
                    </button>
                  </form>
                </div>
              </div>

              {/* Payouts list */}
              <div className="card" style={{ padding: '24px' }}>
                <h4>Payout Transaction History</h4>
                {loading ? (
                  <span>Loading payouts...</span>
                ) : myPayouts.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', fontSize: '14px' }}>No withdrawal transactions requested yet.</p>
                ) : (
                  <div className="payout-timeline">
                    {myPayouts.map(p => (
                      <div key={p._id} className="payout-timeline-item flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div>
                          <strong>Requested Payout: ${p.amount}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block' }}>
                            On {new Date(p.requestedAt).toLocaleDateString()} to Account ending in ..{p.bankDetailsSnapshot.accountNumber.slice(-4)}
                          </span>
                        </div>
                        <span className={`badge ${
                          p.status === 'approved' ? 'badge-success' : p.status === 'requested' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ADD LISTING FORM */}
          {activeTab === 'add_listing' && (
            <div className="tab-add-listing-container card" style={{ padding: '32px' }}>
              <h3 className="tab-heading">Add a New Stay / PG Listing</h3>
              
              <form onSubmit={handleCreateListing}>
                {/* 1. Category and type selection */}
                <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label>Listing Target Type</label>
                    <select className="form-control" value={listType} onChange={e => {
                      setListType(e.target.value);
                      setListCategory(e.target.value === 'stay' ? 'cottage' : 'pg');
                    }}>
                      <option value="stay">Stay Booking (per night stay like Cottages/Hotels)</option>
                      <option value="rental">Rent Listing (monthly contract like PGs/Apartments)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Property Category</label>
                    <select className="form-control" value={listCategory} onChange={e => setListCategory(e.target.value)}>
                      {listType === 'stay' ? (
                        <>
                          <option value="cottage">Cottage</option>
                          <option value="hotel">Hotel / Resort</option>
                        </>
                      ) : (
                        <>
                          <option value="pg">Paying Guest (PG) Room</option>
                          <option value="apartment">Entire Apartment</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* 2. Title and Description */}
                <div className="form-group">
                  <label>Listing Heading Title</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Taj Kumarakom Resort (Premium Pool View)" 
                    value={listTitle}
                    onChange={e => setListTitle(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Description Details</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    placeholder="Provide description of room dimensions, features, check-in rules..." 
                    value={listDesc}
                    onChange={e => setListDesc(e.target.value)}
                    required
                  />
                </div>

                {/* 3. Pricing */}
                <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label>
                      {listType === 'stay' ? 'Cost Per Night ($)' : 'Monthly Rent Fee ($)'}
                    </label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder={listType === 'stay' ? '$220' : '$150'} 
                      value={listPrice}
                      onChange={e => setListPrice(e.target.value)}
                      required 
                    />
                  </div>

                  {listType === 'rental' && (
                    <div className="form-group">
                      <label>Refundable Advance Security Deposit ($)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="$300" 
                        value={listDeposit}
                        onChange={e => setListDeposit(e.target.value)}
                        required 
                      />
                    </div>
                  )}
                </div>

                {/* 4. Amenities Checklist */}
                <div className="form-group">
                  <label>Facilities Checklist</label>
                  <div className="amenities-checkboxes-grid">
                    {['wifi', 'hot_water', 'electricity', 'food', 'pool', 'gym', 'parking'].map(facility => (
                      <div 
                        key={facility} 
                        className={`amenity-checkbox-card flex-center ${listAmenities.includes(facility) ? 'active' : ''}`}
                        onClick={() => handleAmenityCheck(facility)}
                      >
                        <div className={`checkbox-circle flex-center ${listAmenities.includes(facility) ? 'checked' : ''}`}>
                          {listAmenities.includes(facility) && <span>✓</span>}
                        </div>
                        <span>{facility.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Address & Coordinate Picker Map */}
                <div className="form-group">
                  <label>Listing Address</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter full physical address details" 
                    value={listAddress}
                    onChange={e => setListAddress(e.target.value)}
                    required 
                  />
                </div>

                <div className="grid grid-cols-3" style={{ gap: '16px', alignItems: 'center' }}>
                  <div className="form-group">
                    <label>Map Latitude coordinate</label>
                    <input 
                      type="number" 
                      step="any"
                      className="form-control" 
                      value={listLat}
                      onChange={e => setListLat(parseFloat(e.target.value))}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Map Longitude coordinate</label>
                    <input 
                      type="number" 
                      step="any"
                      className="form-control" 
                      value={listLng}
                      onChange={e => setListLng(parseFloat(e.target.value))}
                      required 
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-medium)', paddingLeft: '8px' }}>
                    Click on the map on the right to auto-select precise listing coordinates.
                  </div>
                </div>

                <div className="map-picker-wrapper" style={{ height: '300px', marginBottom: '24px', borderRadius: '16px', overflow: 'hidden' }}>
                  <LeafletMap listings={[]} center={[listLat, listLng]} zoom={12} onSelectCoords={handleMapCoordSelect} />
                </div>

                {/* 6. Image Link */}
                <div className="form-group">
                  <label>Listing Cover Image URL</label>
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="https://images.unsplash.com/photo-X..." 
                    value={listImage}
                    onChange={e => setListImage(e.target.value)}
                  />
                </div>

                <hr className="divider" />

                {/* 7. Unique Selling Points (USPs) Section */}
                <div className="add-usps-builder-section">
                  <h4>Unique Selling Points (Tours / Guided Treks)</h4>
                  <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-medium)', marginBottom: '16px' }}>
                    Offer guests unique outdoor experiences (trekking guides, boating, cooking classes) that they can book alongside their stay.
                  </p>

                  {/* Add USP Mini form */}
                  <div className="usp-form-row card flex">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Tour / Experience Title</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Guided Sunrise Trekking" 
                        value={newUspTitle}
                        onChange={e => setNewUspTitle(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ width: '120px' }}>
                      <label>Fee ($)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="$25" 
                        value={newUspPrice}
                        onChange={e => setNewUspPrice(e.target.value)}
                      />
                    </div>
                    <button type="button" onClick={addUspToForm} className="btn btn-secondary" style={{ height: '45px', marginTop: '30px' }}>
                      Add USP
                    </button>
                  </div>

                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label>Tour Details / Description</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Include details: time, trail length, refreshments provided..." 
                      value={newUspDesc}
                      onChange={e => setNewUspDesc(e.target.value)}
                    />
                  </div>

                  {/* Added USPs list */}
                  {uspsList.length > 0 && (
                    <div className="added-usps-summary-list">
                      <h5>Linked Tours ({uspsList.length})</h5>
                      {uspsList.map((usp, idx) => (
                        <div key={idx} className="added-usp-pill flex-between">
                          <div>
                            <strong>{usp.title}</strong> (${usp.price}) - <span>{usp.description}</span>
                          </div>
                          <button type="button" onClick={() => removeUspFromForm(idx)} className="btn-delete-usp">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '32px' }}>
                  Post Property Listing
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
