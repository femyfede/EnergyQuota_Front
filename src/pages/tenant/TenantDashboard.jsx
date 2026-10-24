import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import {
  MdElectricalServices, MdPendingActions, MdCheckCircle,
  MdPerson, MdHome, MdPhone, MdBolt, MdHistory,
  MdClose, MdOutlineSpeed, MdCalendarToday,
} from 'react-icons/md';

const StatusIcon = ({ status }) => {
  if (status === 'approved') return <MdCheckCircle size={15} className="text-emerald-500" />;
  if (status === 'rejected') return <MdClose size={15} className="text-red-500" />;
  return <MdPendingActions size={15} className="text-amber-500" />;
};

const StatusBadge = ({ status, t }) => {
  const map = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected', suspended: 'badge-suspended' };
  const label =
    status === 'approved' ? t('status.approved') :
    status === 'pending'  ? t('status.pending')  :
    status === 'rejected' ? t('status.rejected') : status;
  return <span className={map[status] || 'badge'}>{label}</span>;
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/10">
    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
      <Icon size={15} className="text-white" />
    </div>
    <div>
      <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
    </div>
  </div>
);

const TenantDashboard = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const [info, setInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const socket = useSocket();

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchData = useCallback(async () => {
    try {
      const [infoRes, reqRes] = await Promise.all([
        api.get('/tenant/me'),
        api.get('/tenant/meter-requests'),
      ]);
      setInfo(infoRes.data && typeof infoRes.data === 'object' ? infoRes.data : null);
      setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
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
      showToast(data.message, data.status === 'approved' ? 'success' : 'error');
      fetchData();
    };
    socket.on('meterRequestUpdate', handler);
    return () => socket.off('meterRequestUpdate', handler);
  }, [socket, fetchData]);

  const requestMeter = async () => {
    setSubmitting(true);
    try {
      await api.post('/tenant/meter-request');
      showToast('Meter request submitted! Your owner will review it shortly.');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const approvedRequest = requests.find((r) => r.status === 'approved');
  const latestRequest   = requests[0];
  const hasPending      = latestRequest?.status === 'pending';
  const canRequest      = !hasPending && !approvedRequest;
  const initials        = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) {
    return (
      <Layout title={t('page.tenantDashboard')}>
        <div className="page-loader"><div className="page-loader-ring" /></div>
      </Layout>
    );
  }

  return (
    <Layout title={t('page.tenantDashboard')}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="space-y-4">

          {/* Profile card — always a gradient, no dark/light split needed */}
          <div className="bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-900 rounded-2xl overflow-hidden text-white">
            <div className="px-5 pt-6 pb-4 relative">
              <div className="absolute top-0 right-0 opacity-10">
                <MdPerson size={100} className="-mt-4 -mr-4" />
              </div>
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center font-bold text-xl">
                  {initials}
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{user?.name}</p>
                  <p className="text-emerald-200 text-xs mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/20 px-2 py-0.5 rounded-full capitalize">
                    {t('status.active')}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-4 pb-4 space-y-2">
              {info?.roomNumber && <InfoRow icon={MdHome}   label={t('profile.room')}         value={info.roomNumber} />}
              {info?.phone      && <InfoRow icon={MdPhone}  label={t('profile.phone')}         value={info.phone} />}
              {info?.owner    && <InfoRow icon={MdPerson} label={t('profile.propertyOwner')} value={info.owner.name} />}
              {!info?.roomNumber && !info?.phone && !info?.owner && (
                <div className="text-center py-3 text-emerald-300 text-xs">{t('tenantMgmt.noDetails')}</div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card !p-4">
              <p className="metric-label">{t('tenant.totalReqs')}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{requests.length}</p>
              <div className="flex items-center gap-1 mt-2">
                <MdHistory size={11} className="text-slate-300 dark:text-slate-600" />
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{t('misc.allTime')}</span>
              </div>
            </div>
            <div className="stat-card !p-4">
              <p className="metric-label">{t('tenant.meterStatus')}</p>
              <div className="mt-1">
                {approvedRequest
                  ? <span className="badge-approved text-xs">{t('status.active')}</span>
                  : hasPending
                  ? <span className="badge-pending text-xs">{t('status.pending')}</span>
                  : <span className="badge text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{t('status.noMeter')}</span>
                }
              </div>
              <div className="flex items-center gap-1 mt-2">
                <MdOutlineSpeed size={11} className="text-slate-300 dark:text-slate-600" />
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{t('misc.meterStatus')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Meter status card */}
          {approvedRequest ? (
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200/30 dark:shadow-emerald-900/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MdCheckCircle size={18} />
                    <span className="text-sm font-semibold opacity-90">{t('status.meterAssigned')}</span>
                  </div>
                  <p className="text-emerald-100 text-sm mb-5">{t('tenant.meterActive')}</p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-4 inline-block">
                    <p className="text-[10px] text-emerald-100 uppercase tracking-widest font-bold mb-1.5">
                      {t('table.meterNo')}
                    </p>
                    <p className="text-3xl font-bold font-mono tracking-wider">{approvedRequest.meterNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-emerald-200 text-xs">
                    <MdCalendarToday size={12} />
                    {t('tenant.assignedOn')} {new Date(approvedRequest.updatedAt || approvedRequest.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
                  <MdBolt size={34} className="text-yellow-300" />
                </div>
              </div>
            </div>
          ) : (
            <div className={`card border-2 ${hasPending
              ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10'
              : 'border-dashed border-teal-200 dark:border-teal-800'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
                  ${hasPending
                    ? 'bg-amber-100 dark:bg-amber-900/40'
                    : 'bg-teal-100 dark:bg-teal-900/40'}`}>
                  {hasPending
                    ? <MdPendingActions size={24} className="text-amber-600 dark:text-amber-400" />
                    : <MdElectricalServices size={24} className="text-teal-600 dark:text-teal-400" />
                  }
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base mb-1">
                    {hasPending ? t('status.pendingReview') : t('status.noMeterYet')}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    {hasPending ? t('tenant.submitReq') : t('tenant.noMeterMsg')}
                  </p>
                  {canRequest && (
                    <button onClick={requestMeter} disabled={submitting} className="btn-primary">
                      {submitting ? <span className="spin" /> : <MdElectricalServices size={18} />}
                      {submitting ? t('actions.submitting') : t('actions.requestMeter')}
                    </button>
                  )}
                  {hasPending && (
                    <div className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 px-3.5 py-2 rounded-xl text-sm font-medium">
                      <MdPendingActions size={16} />
                      {t('tenant.awaitingApproval')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Request history */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="section-title">{t('tenant.reqHistory')}</h3>
                <p className="section-subtitle">{t('tenant.reqHistorySub')}</p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full font-medium">
                {requests.length} {t('misc.allTime')}
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-10">
                <div className="empty-icon-wrap">
                  <MdHistory size={24} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-400 font-medium">{t('tenant.noHistory')}</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5">{t('tenant.noHistorySub')}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border
                        ${req.status === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-900/40'
                          : req.status === 'rejected'
                          ? 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900/40'
                          : 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-900/40'}`}
                      >
                        <StatusIcon status={req.status} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {req.meterNumber ? `${t('table.meterNo')}: ${req.meterNumber}` : t('nav.myMeter')}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                          <MdCalendarToday size={10} />
                          {new Date(req.createdAt).toLocaleString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={req.status} t={t} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TenantDashboard;


