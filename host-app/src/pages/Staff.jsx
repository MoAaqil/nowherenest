import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users, Plus, Trash2, Edit3, X, Mail, ShieldAlert, AlertCircle } from 'lucide-react';
import './Staff.css';

const STAFF_ROLES = [
  { value: 'manager', label: '💼 Property Manager' },
  { value: 'receptionist', label: '🛎️ Receptionist' },
  { value: 'housekeeper', label: '🧹 Housekeeper' },
  { value: 'accountant', label: '📊 Accountant' }
];

const Staff = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('housekeeper');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchStaff(selectedPropertyId);
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

  const fetchStaff = async (propertyId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.staff.getPropertyStaff(propertyId);
      setStaff(res.staff || []);
    } catch (err) {
      setError(err.message || 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEmail('');
    setRole('housekeeper');
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!email || !role) return;
    setFormError('');
    setFormLoading(true);

    try {
      await api.staff.add({
        propertyId: selectedPropertyId,
        email,
        role
      });
      setShowModal(false);
      fetchStaff(selectedPropertyId);
    } catch (err) {
      setFormError(err.message || 'Failed to add staff member');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (staffId, newStatus) => {
    try {
      await api.staff.update(staffId, { status: newStatus });
      fetchStaff(selectedPropertyId);
    } catch (err) {
      alert(err.message || 'Failed to update staff status');
    }
  };

  const handleRoleChange = async (staffId, newRole) => {
    try {
      await api.staff.update(staffId, { role: newRole });
      fetchStaff(selectedPropertyId);
    } catch (err) {
      alert(err.message || 'Failed to update staff role');
    }
  };

  const handleRemoveStaff = async (id, staffName) => {
    if (!window.confirm(`Are you sure you want to remove "${staffName}" from property staff list?`)) return;
    try {
      await api.staff.remove(id);
      fetchStaff(selectedPropertyId);
    } catch (err) {
      alert(err.message || 'Failed to remove staff');
    }
  };

  return (
    <div className="container staff-page">
      <section className="flex-between page-header-row flex-wrap gap-12">
        <div>
          <h2>Manage Staff & Roles</h2>
          <p className="subtitle">Configure role-based access permissions (RBAC) and invite team members</p>
        </div>

        {properties.length > 0 && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} /> Invite Staff
          </button>
        )}
      </section>

      {/* Property Context Selection */}
      <section className="property-banner card flex-between flex-wrap gap-12" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div className="flex-center">
          <Users size={18} style={{ color: 'var(--primary-color)', marginRight: '10px' }} />
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
        <div className="flex-center" style={{ padding: '60px' }}>Loading Staff Profiles...</div>
      ) : properties.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <AlertCircle size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h5>No Properties Available</h5>
          <p className="subtitle">You must create a property first in the Properties tab.</p>
        </div>
      ) : staff.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <Users size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h5>No Staff Registered</h5>
          <p className="subtitle" style={{ marginBottom: '16px' }}>Delegate cleaning, finance, or reception check-in duties.</p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            Invite Staff Now
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>Role Assignment</th>
                <th>Invite Status</th>
                <th>Change Role</th>
                <th>Disable/Enable</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.user?.name}</strong></td>
                  <td>{s.user?.email}</td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                      {s.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <select 
                      value={s.role}
                      onChange={e => handleRoleChange(s._id, e.target.value)}
                      className="form-control"
                      style={{ padding: '4px 8px', fontSize: '12px', width: '150px' }}
                    >
                      {STAFF_ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select 
                      value={s.status}
                      onChange={e => handleStatusChange(s._id, e.target.value)}
                      className="form-control"
                      style={{ padding: '4px 8px', fontSize: '12px', width: '110px' }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleRemoveStaff(s._id, s.user?.name)}
                      className="btn-action-circle danger"
                      title="Remove staff assignment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex-between modal-header" style={{ marginBottom: '24px' }}>
              <h4>Invite Property Staff</h4>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="login-error-alert" style={{ marginBottom: '16px' }}>
                <ShieldAlert size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Staff User Email Address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="email@staffmember.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <p className="help-text" style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
                  If the staff doesn't have an account, we will pre-register a profile and send credentials.
                </p>
              </div>

              <div className="form-group">
                <label>Operational Role</label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  className="form-control"
                >
                  {STAFF_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex-between gap-12" style={{ marginTop: '32px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Inviting...' : 'Add Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
