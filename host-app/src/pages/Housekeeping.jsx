import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Brush, Plus, CheckCircle, Clock, Users, X, AlertCircle } from 'lucide-react';
import './Housekeeping.css';

const TASK_STATUSES = [
  { value: 'available', label: '🟢 Available' },
  { value: 'occupied', label: '🔵 Occupied' },
  { value: 'cleaning', label: '🟡 Cleaning' },
  { value: 'maintenance', label: '🟠 Maintenance' },
  { value: 'blocked', label: '🔴 Blocked' }
];

const Housekeeping = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [taskType, setTaskType] = useState('cleaning');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      fetchHousekeepingData(selectedPropertyId);
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

  const fetchHousekeepingData = async (propertyId) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Rooms
      const roomsRes = await api.rooms.getRoomsByProperty(propertyId);
      setRooms(roomsRes.rooms);
      if (roomsRes.rooms.length > 0) {
        setSelectedRoomId(roomsRes.rooms[0]._id);
      }

      // 2. Fetch Staff (to assign housekeeping tasks)
      const staffRes = await api.staff.getPropertyStaff(propertyId);
      // Filter for housekeepers
      const housekeepers = staffRes.staff.filter(s => s.role === 'housekeeper');
      setStaffList(housekeepers);
      if (housekeepers.length > 0) {
        setSelectedStaffId(housekeepers[0].user._id);
      }

      // 3. Fetch Tasks
      const tasksRes = await api.housekeeping.getPropertyTasks(propertyId);
      setTasks(tasksRes.tasks || []);
    } catch (err) {
      setError(err.message || 'Failed to load housekeeping dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setTaskType('cleaning');
    setNotes('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoomId) {
      setFormError('Please select a room category to clean');
      return;
    }
    setFormError('');
    setFormLoading(true);

    try {
      await api.housekeeping.createTask({
        propertyId: selectedPropertyId,
        roomId: selectedRoomId,
        taskType,
        assignedStaffId: selectedStaffId || null,
        dueDate: new Date(dueDate),
        notes
      });
      setShowModal(false);
      fetchHousekeepingData(selectedPropertyId);
    } catch (err) {
      setFormError(err.message || 'Failed to create housekeeping logs');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.housekeeping.updateTask(taskId, { status: newStatus });
      fetchHousekeepingData(selectedPropertyId);
    } catch (err) {
      alert(err.message || 'Failed to update task status');
    }
  };

  return (
    <div className="container housekeeping-page">
      <section className="flex-between page-header-row flex-wrap gap-12">
        <div>
          <h2>Staff Operations & Housekeeping</h2>
          <p className="subtitle">Delegate cleaning duties, assign tasks, and monitor room statuses</p>
        </div>

        {properties.length > 0 && rooms.length > 0 && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} /> Assign Clean Task
          </button>
        )}
      </section>

      {/* Property banner selector */}
      <section className="property-banner card flex-between flex-wrap gap-12" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div className="flex-center">
          <Brush size={18} style={{ color: 'var(--primary-color)', marginRight: '10px' }} />
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
        <div className="flex-center" style={{ padding: '60px' }}>Loading Housekeeping Data...</div>
      ) : properties.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <AlertCircle size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h5>No Properties Available</h5>
          <p className="subtitle">You must create a property first in the Properties tab.</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <Brush size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h5>No Rooms Available to Clean</h5>
          <p className="subtitle">Setup rooms first in the Rooms tab to allocate housekeeping.</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <Brush size={48} style={{ color: 'var(--text-light)', margin: '0 auto 16px' }} />
          <h5>No Active Cleaning Logs</h5>
          <p className="subtitle" style={{ marginBottom: '16px' }}>All room units are tidy. Create a task when a guest checks out.</p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            Create Clean Task
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Room Unit</th>
                <th>Task Type</th>
                <th>Assigned Housekeeper</th>
                <th>Due Date</th>
                <th>Notes</th>
                <th>Cleaning Status Status</th>
                <th>Quick Switch Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t._id}>
                  <td><strong style={{ textTransform: 'capitalize' }}>{t.room?.category} room</strong></td>
                  <td>
                    <span className="task-type-badge flex-center">
                      🧹 {t.taskType.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {t.assignedStaff ? (
                      <div className="staff-meta">
                        <strong>{t.assignedStaff.name}</strong>
                        <div style={{ fontSize: '10px', color: 'var(--text-light)' }}>{t.assignedStaff.phone || 'No phone'}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div className="flex-center gap-4" style={{ justifyContent: 'flex-start' }}>
                      <Clock size={14} style={{ color: 'var(--text-light)' }} />
                      <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: '200px', fontSize: '12px' }}>{t.notes || 'No description notes'}</td>
                  <td>
                    <span className={`badge ${
                      t.status === 'available' ? 'badge-success' : 
                      t.status === 'occupied' ? 'badge-info' : 
                      t.status === 'cleaning' ? 'badge-warning' : 
                      t.status === 'maintenance' ? 'badge-danger' : 
                      'badge-danger'
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <select 
                      value={t.status}
                      onChange={e => handleStatusChange(t._id, e.target.value)}
                      className="form-control"
                      style={{ padding: '4px 8px', fontSize: '12px', width: '130px' }}
                    >
                      {TASK_STATUSES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Creating task */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex-between modal-header" style={{ marginBottom: '24px' }}>
              <h4>Assign Housekeeping Task</h4>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>

            {formError && <div className="login-error-alert" style={{ marginBottom: '16px' }}>{formError}</div>}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Select Room Category</label>
                <select 
                  value={selectedRoomId} 
                  onChange={e => setSelectedRoomId(e.target.value)}
                  className="form-control"
                  required
                >
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>{r.category} category - Price: ₹{r.price}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Task Type</label>
                  <select 
                    value={taskType} 
                    onChange={e => setTaskType(e.target.value)}
                    className="form-control"
                  >
                    <option value="cleaning">Cleaning</option>
                    <option value="laundry">Laundry & Linens</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Assign Staff (Housekeeper)</label>
                  <select 
                    value={selectedStaffId} 
                    onChange={e => setSelectedStaffId(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Unassigned (Open Queue)</option>
                    {staffList.map(s => (
                      <option key={s.user._id} value={s.user._id}>{s.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Target Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Instructions Notes</label>
                <textarea 
                  className="form-control" 
                  placeholder="Detail tasks like laundry, AC service checks, bathroom disinfection, etc."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex-between gap-12" style={{ marginTop: '32px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={formLoading}>
                  {formLoading ? 'Assigning...' : 'Assign Duty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Housekeeping;
