import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import api from '../../api/axios';
import { MdElectricalServices, MdPause, MdPlayArrow, MdFilterList } from 'react-icons/md';

const statusClass = (status) => {
  if (status === 'approved') return 'badge-approved';
  if (status === 'pending') return 'badge-pending';
  if (status === 'suspended') return 'badge-suspended';
  return 'badge-rejected';
};

const AdminMeters = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchRequests = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/meter-requests');
      setRequests(data);
    } catch {
      showToast('Failed to load meters', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

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

  const filtered = requests.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'assigned') return r.status === 'approved';
    if (filter === 'unassigned') return r.status === 'pending' || r.status === 'rejected';
    if (filter === 'suspended') return r.status === 'suspended';
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
          <p className="metric-value">{requests.filter(r => r.status === 'approved').length}</p>
        </div>
        <div className="stat-card !p-4">
          <p className="metric-label">Unassigned</p>
          <p className="metric-value">{requests.filter(r => r.status === 'pending' || r.status === 'rejected').length}</p>
        </div>
        <div className="stat-card !p-4">
          <p className="metric-label">Suspended</p>
          <p className="metric-value">{requests.filter(r => r.status === 'suspended').length}</p>
        </div>
      </div>
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="section-title">Meter Management</h3>
            <p className="section-subtitle">All meters across owners</p>
          </div>
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
                {filtered.map((req) => (
                  <tr key={req.id} className="table-row">
                    <td className="table-cell py-4">{req.owner?.name || 'Unknown'}</td>
                    <td className="table-cell">{req.tenant?.name || 'Unknown'}</td>
                    <td className="table-cell">
                      {req.meterNumber ? <span className="meter-tag">{req.meterNumber}</span> : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="table-cell">
                      <span className={statusClass(req.status)}>{req.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        {req.status === 'approved' && (
                          <button onClick={() => suspend(req.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white">
                            <MdPause size={13} /> Suspend
                          </button>
                        )}
                        {req.status === 'suspended' && (
                          <button onClick={() => reactivate(req.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white">
                            <MdPlayArrow size={13} /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
    </Layout>
  );
};

export default AdminMeters;