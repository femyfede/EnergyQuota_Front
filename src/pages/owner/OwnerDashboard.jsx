import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import {
  MdPeople, MdElectricalServices, MdPendingActions,
  MdCheck, MdClose, MdBolt, MdTrendingUp, MdHomeWork, MdArrowForward,
} from 'react-icons/md';

const StatusBadge = ({ status, t }) => {
  const map = {
    pending:  { cls: 'badge-pending',  dot: 'bg-amber-500', label: t('status.pending') },
    approved: { cls: 'badge-approved', dot: 'bg-emerald-500', label: t('status.approved') },
    rejected: { cls: 'badge-rejected', dot: 'bg-red-500', label: t('status.rejected') },
  };
  const { cls, dot, label } = map[status] || { cls: 'badge', dot: null, label: status };
  return <span className={cls}>{dot && <span className={`w-1.5 h-1.5 rounded-full ${dot} mr-1.5`} />}{label}</span>;
};

const ApproveModal = ({ request, onClose, onApprove, t }) => {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(request.id);
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-sm fade-up">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <MdBolt size={22} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('owner.assignTitle')}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{request.tenant?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <MdClose size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            A meter number will be assigned automatically.
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="btn-secondary">{t('actions.cancel')}</button>
            <button onClick={handleApprove} disabled={loading} className="btn-success">
              {loading ? <span className="spin" /> : <MdCheck size={16} />}
              {t('actions.assignMeter')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OwnerDashboard = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const [requests, setRequests] = useState([]);
  const [tenantCount, setTenantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [approveModal, setApproveModal] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const { socket } = useSocket();

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, tenRes] = await Promise.all([
        api.get('/owner/meter-requests'),
        api.get('/owner/tenants'),
      ]);
      setRequests(reqRes.data);
      setTenantCount(tenRes.data.length);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setNotifications((prev) => [data, ...prev]);
      showToast(data.message);
      fetchData();
    };
    socket.on('newMeterRequest', handler);
    return () => socket.off('newMeterRequest', handler);
  }, [socket, fetchData]);

  const approveRequest = async (id) => {
    try {
      const { data } = await api.patch(`/owner/meter-requests/${id}/approve`);
      showToast(`Meter assigned: ${data.meterNumber || 'successfully'}`);
      setApproveModal(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve', 'error');
    }
  };

  const rejectRequest = async (id, tenantName) => {
    if (!confirm(`Reject meter request from ${tenantName}?`)) return;
    try {
      await api.patch(`/owner/meter-requests/${id}/reject`);
      showToast('Request rejected');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject', 'error');
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');
  const approved = requests.filter((r) => r.status === 'approved');
  const navigate = useNavigate();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('greeting.morning');
    if (h < 17) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  return (
    <Layout title={t('page.ownerDashboard')} notifications={notifications}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {approveModal && (
        <ApproveModal
          request={approveModal}
          onClose={() => setApproveModal(null)}
          onApprove={approveRequest}
          t={t}
        />
      )}

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
          <MdHomeWork size={120} />
        </div>
        <div className="relative">
          <p className="text-teal-200 text-sm mb-1">{greeting()},</p>
          <h2 className="text-2xl font-bold">{user?.name}</h2>
          <p className="text-teal-200 text-sm mt-1">
            {pending.length > 0
              ? t('owner.welcomePending', { count: pending.length })
              : t('owner.welcomeOk', { count: tenantCount })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <button onClick={() => navigate('/owner/tenants')}
          className="stat-card group cursor-pointer text-left w-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">{t('stats.totalTenants')}</p>
              <p className="metric-value">{tenantCount}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                <MdTrendingUp size={12} className="text-emerald-500" />
                {t('stats.registeredTenants')}
              </p>
            </div>
            <div className="stat-icon bg-teal-500 group-hover:scale-110 transition-transform duration-200">
              <MdPeople size={21} className="text-white" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex-1 h-1 rounded-full bg-teal-100 dark:bg-teal-900/40 overflow-hidden">
              <div className="h-full rounded-full bg-teal-500 w-4/5" />
            </div>
            <MdArrowForward size={13} className="text-slate-300 dark:text-slate-600 ml-2 group-hover:text-slate-400 transition-colors flex-shrink-0" />
          </div>
        </button>

        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">{t('stats.pendingRequests')}</p>
              <p className="metric-value">{pending.length}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{t('stats.awaitingReview')}</p>
            </div>
            <div className={`stat-icon group-hover:scale-110 transition-transform duration-200
              ${pending.length > 0 ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <MdPendingActions size={21} className="text-white" />
            </div>
          </div>
          <div className="mt-4 h-1 rounded-full bg-amber-100 dark:bg-amber-900/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (pending.length / Math.max(requests.length, 1)) * 100)}%` }}
            />
          </div>
        </div>

        <button onClick={() => navigate('/owner/reports')}
          className="stat-card group cursor-pointer text-left w-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">{t('stats.metersAssigned')}</p>
              <p className="metric-value">{approved.length}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                <MdTrendingUp size={12} className="text-emerald-500" />
                {t('stats.activeMeters')}
              </p>
            </div>
            <div className="stat-icon bg-emerald-500 group-hover:scale-110 transition-transform duration-200">
              <MdElectricalServices size={21} className="text-white" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex-1 h-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (approved.length / Math.max(requests.length, 1)) * 100)}%` }}
              />
            </div>
            <MdArrowForward size={13} className="text-slate-300 dark:text-slate-600 ml-2 group-hover:text-slate-400 transition-colors flex-shrink-0" />
          </div>
        </button>
      </div>

      {/* Meter Requests table */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="section-title">{t('owner.meterReqTitle')}</h3>
            <p className="section-subtitle">{t('owner.meterReqSub')}</p>
          </div>
          {pending.length > 0 && (
            <span className="badge-pending self-start">{pending.length} {t('status.pending')}</span>
          )}
        </div>

        {loading ? (
          <div className="page-loader"><div className="page-loader-ring" /></div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[580px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="table-header">{t('table.tenant')}</th>
                  <th className="table-header">{t('table.dateRequested')}</th>
                  <th className="table-header">{t('table.status')}</th>
                  <th className="table-header">{t('table.meterNo')}</th>
                  <th className="table-header">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="table-row cursor-pointer" onClick={() => navigate('/owner/tenants')}>
                    <td className="table-cell py-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar-teal w-9 h-9 text-sm">
                          {req.tenant?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{req.tenant?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{req.tenant?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-slate-400 dark:text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={req.status} t={t} />
                    </td>
                    <td className="table-cell">
                      {req.meterNumber
                        ? <span className="meter-tag">{req.meterNumber}</span>
                        : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      }
                    </td>
                    <td className="table-cell" onClick={e => e.stopPropagation()}>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => setApproveModal(req)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                            <MdCheck size={13} /> {t('actions.approve')}
                          </button>
                          <button onClick={() => rejectRequest(req.id, req.tenant?.name)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                            <MdClose size={13} /> {t('actions.reject')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {requests.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MdElectricalServices size={30} className="text-teal-200 dark:text-teal-700" />
                </div>
                <p className="text-sm font-medium text-slate-400">{t('owner.noRequests')}</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">{t('owner.noRequestsSub')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OwnerDashboard;

