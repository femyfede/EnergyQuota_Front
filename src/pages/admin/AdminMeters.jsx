import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import api from '../../api/axios';
import { MdElectricalServices, MdPause, MdPlayArrow, MdFilterList, MdAdd, MdClose, MdDelete } from 'react-icons/md';

const statusClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return 'badge-approved';
  if (s === 'pending') return 'badge-pending';
  if (s === 'suspended') return 'badge-suspended';
  return 'badge-rejected';
};

const AdminMeters = () => {
  const [requests, setRequests] = useState([]);
  const [owners, setOwners] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [meterNumber, setMeterNumber] = useState('');
  const [creating, setCreating] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchRequests = useCallback(async () => {
    try {
      const [metersRes, ownersRes] = await Promise.all([
        api.get('/admin/meter-requests'),
        api.get('/admin/owners'),
      ]);
      setRequests(metersRes.data);
      setOwners(ownersRes.data);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const suspend = async (id) => {
    try {
      await api.patch(`/admin/meter-requests/${id}/suspend`);
      showToast('Meter suspended');
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to suspend', 'error');
    }
  };

  const reactivate = async (id) => {
    try {
      await api.patch(`/admin/meter-requests/${id}/reactivate`);
      showToast('Meter reactivated');
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reactivate', 'error');
    }
  };

  const deleteMeter = async (id, meterNumber) => {
    if (!confirm(`Delete meter ${meterNumber}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/meter-requests/${id}`);
      showToast('Meter deleted successfully');
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete meter', 'error');
    }
  };

  const createMeter = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = meterNumber.trim() ? { meterNumber: meterNumber.trim() } : {};
      const response = await api.post('/admin/meter-requests-manual', payload);
      showToast(`Meter ${response.data.request.meterNumber} created successfully`);
      setMeterNumber('');
      setShowModal(false);
      fetchRequests();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create meter';
      console.error('Meter creation error:', err);
      showToast(errorMsg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const filtered = requests.filter((r) => {
    const status = String(r.status || '').toLowerCase();
    if (filter === 'all') return true;
    if (filter === 'assigned') return status === 'approved';
    if (filter === 'unassigned') return status === 'pending' || status === 'rejected';
    if (filter === 'suspended') return status === 'suspended';
    return true;
  });

  return (
    <Layout title="Meters">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card !p-4">
          <p className="metric-label">Total</p>
          <p className="metric-value">{requests.length}</p>
        </div>
        <div className="stat-card !p-4">
          <p className="metric-label">Assigned</p>
          <p className="metric-value">{requests.filter(r => String(r.status || '').toLowerCase() === 'approved').length}</p>
        </div>
        <div className="stat-card !p-4">
          <p className="metric-label">Unassigned</p>
          <p className="metric-value">{requests.filter(r => {const s = String(r.status || '').toLowerCase(); return s === 'pending' || s === 'rejected'}).length}</p>
        </div>
        <div className="stat-card !p-4">
          <p className="metric-label">Suspended</p>
          <p className="metric-value">{requests.filter(r => String(r.status || '').toLowerCase() === 'suspended').length}</p>
        </div>
      </div>
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="section-title">Meter Management</h3>
            <p className="section-subtitle">All meters across owners</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-500 hover:bg-teal-600 text-white">
              <MdAdd size={18} /> Add Meter
            </button>
            <div className="flex items-center gap-2">
              <MdFilterList size={18} className="text-slate-400" />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-auto">
                <option value="all">All</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="page-loader"><div className="page-loader-ring" /></div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="table-header">Owner</th>
                  <th className="table-header">Tenant</th>
                  <th className="table-header">Meter No.</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => {
                  const ownerInfo = req.ownerId ? owners.find(o => o.id === req.ownerId) : null;
                  const isOwnerSuspended = ownerInfo && !ownerInfo.approved;
                  const ownerStatus = !req.ownerId ? 'Unknown Owner' : isOwnerSuspended ? 'Owner Suspended' : 'Active';

                  return (
                    <tr key={req.id} className="table-row">
                      <td className="table-cell py-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{req.owner?.name || 'Unknown'}</p>
                          <p className={`text-xs ${!req.ownerId ? 'text-red-600 dark:text-red-400' : isOwnerSuspended ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {ownerStatus}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">{req.tenant?.name || 'Unknown'}</td>
                      <td className="table-cell">
                        {req.meterNumber ? <span className="meter-tag">{req.meterNumber}</span> : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="table-cell">
                        <span className={statusClass(req.status)}>{req.status}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          {String(req.status || '').toLowerCase() === 'approved' && !isOwnerSuspended && (
                            <button onClick={() => suspend(req.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white">
                              <MdPause size={13} /> Suspend
                            </button>
                          )}
                          {String(req.status || '').toLowerCase() === 'approved' && isOwnerSuspended && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 cursor-not-allowed">
                              <MdPause size={13} /> Owner Suspended
                            </span>
                          )}
                          {String(req.status || '').toLowerCase() === 'suspended' && (
                            <button onClick={() => reactivate(req.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white">
                              <MdPlayArrow size={13} /> Reactivate
                            </button>
                          )}
                          <button onClick={() => deleteMeter(req.id, req.meterNumber)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white">
                            <MdDelete size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <MdElectricalServices size={30} className="mx-auto text-teal-200 dark:text-teal-700 mb-2" />
                <p className="text-sm font-medium text-slate-400">No meters found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Add New Meter</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={createMeter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Meter Number <span className="text-xs text-slate-400">(optional - auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value)}
                  placeholder="e.g., MTR-0001"
                  className="input-field w-full"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-xl font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex-1 px-4 py-2 rounded-xl font-semibold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Meter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminMeters;