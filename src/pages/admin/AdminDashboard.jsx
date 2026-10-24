import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../api/axios';
import {
  MdPeople, MdPendingActions, MdElectricalServices,
  MdCheck, MdClose, MdVerifiedUser,
  MdTrendingUp, MdGroupWork, MdShield, MdHomeWork,
  MdPersonAdd, MdPersonRemove, MdBolt,
  MdNotifications, MdSearch, MdArrowForward,
} from 'react-icons/md';

const typeIcon = (type) => {
  switch (type) {
    case 'tenant_added':    return <MdPersonAdd size={14} className="text-emerald-600" />;
    case 'tenant_removed':  return <MdPersonRemove size={14} className="text-red-500" />;
    case 'meter_approved':  return <MdElectricalServices size={14} className="text-teal-600" />;
    case 'meter_rejected':  return <MdClose size={14} className="text-red-500" />;
    default:                return <MdBolt size={14} className="text-amber-500" />;
  }
};

const typeBg = (type) => {
  switch (type) {
    case 'tenant_added':   return 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-900/40';
    case 'tenant_removed': return 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900/40';
    case 'meter_approved': return 'bg-teal-50 dark:bg-teal-900/30 border-teal-100 dark:border-teal-900/40';
    case 'meter_rejected': return 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900/40';
    default:               return 'bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-900/40';
  }
};

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const { notifications } = useNotifications() || { notifications: [] };

  const [stats, setStats]               = useState({});
  const [pendingOwners, setPendingOwners] = useState([]);
  const [allOwners, setAllOwners]       = useState([]);
  const [allTenants, setAllTenants]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('pending');
  const [tenantSearch, setTenantSearch] = useState('');
  const [toast, setToast]               = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, pendingRes, allOwnersRes, allTenantsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/owners/pending'),
        api.get('/admin/owners'),
        api.get('/admin/tenants'),
      ]);
      setStats(statsRes.data);
      setPendingOwners(pendingRes.data);
      setAllOwners(allOwnersRes.data);
      setAllTenants(allTenantsRes.data);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const approveOwner = async (id) => {
    try {
      await api.patch(`/admin/owners/${id}/approve`);
      showToast(t('status.approved'));
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve', 'error');
    }
  };

  const rejectOwner = async (id, name) => {
    if (!confirm(`Reject and permanently delete "${name}"?`)) return;
    try {
      await api.delete(`/admin/owners/${id}/reject`);
      showToast('Owner rejected and removed');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject', 'error');
    }
  };

  const displayOwners  = activeTab === 'pending' ? pendingOwners : allOwners;
  const filteredTenants = allTenants.filter(ten => {
    const q = tenantSearch.toLowerCase();
    return !q ||
      ten.user?.name?.toLowerCase().includes(q) ||
      ten.user?.email?.toLowerCase().includes(q) ||
      ten.owner?.name?.toLowerCase().includes(q) ||
      ten.roomNumber?.toLowerCase().includes(q);
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('greeting.morning');
    if (h < 17) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  const unread = notifications.filter(n => !n.read).length;
  const navigate = useNavigate();

  return (
    <Layout title={t('page.adminDashboard')}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-600 to-teal-700 rounded-2xl p-6 mb-6 relative overflow-hidden text-white shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 opacity-[0.07]">
          <MdShield size={200} />
        </div>
        <div className="relative">
          <p className="text-teal-200 text-sm mb-0.5">{greeting()},</p>
          <h2 className="text-2xl font-bold tracking-tight">{user?.name}</h2>
          <p className="text-teal-200 text-sm mt-1">
            {pendingOwners.length > 0
              ? t('admin.welcomePending', { count: pendingOwners.length })
              : t('admin.welcomeOk')}
          </p>
        </div>
        <div className="relative flex flex-wrap items-center gap-2 mt-4">
          <div className="bg-white/15 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
            <MdVerifiedUser size={12} /> {stats.owners ?? 0} {t('stats.activeOwners')}
          </div>
          <div className="bg-white/15 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
            <MdPeople size={12} /> {stats.tenants ?? 0} {t('stats.totalTenants')}
          </div>
          {pendingOwners.length > 0 && (
            <div className="bg-amber-400 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 text-amber-900">
              <MdPendingActions size={12} /> {pendingOwners.length} {t('stats.pendingApproval')}
            </div>
          )}
          {unread > 0 && (
            <div className="bg-red-400/90 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 text-white">
              <MdNotifications size={12} /> {unread} new
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: MdVerifiedUser,   label: t('stats.activeOwners'),   value: stats.owners,
            sub: t('stats.systemRegistered'), to: '/admin/owners',
            iconBg: 'bg-teal-50 dark:bg-teal-900/30', iconColor: 'text-teal-600 dark:text-teal-400',
            bar: 'bg-teal-500', barBg: 'bg-teal-100 dark:bg-teal-900/40',
          },
          {
            icon: MdPendingActions, label: t('stats.pendingApproval'), value: stats.pendingOwners,
            sub: t('stats.awaitingReview'), to: '/admin/owners',
            iconBg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400',
            bar: 'bg-amber-500', barBg: 'bg-amber-100 dark:bg-amber-900/40',
          },
          {
            icon: MdGroupWork,      label: t('stats.totalTenants'),   value: stats.tenants,
            sub: t('stats.acrossAll'), to: '/admin/tenants',
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400',
            bar: 'bg-emerald-500', barBg: 'bg-emerald-100 dark:bg-emerald-900/40',
          },
          {
            icon: MdElectricalServices, label: t('stats.meterRequests'), value: stats.meterRequests,
            sub: t('stats.totalSubmitted'), to: '/admin/reports',
            iconBg: 'bg-purple-50 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400',
            bar: 'bg-purple-500', barBg: 'bg-purple-100 dark:bg-purple-900/40',
          },
        ].map(({ icon: Icon, label, value, sub, iconBg, iconColor, bar, barBg, to }, i) => (
          <button key={label} onClick={() => navigate(to)}
            className="stat-card card-animate stagger-item group cursor-pointer text-left w-full" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="metric-label">{label}</p>
                <p className="metric-value">{value ?? '—'}</p>
                {sub && (
                  <p className={`text-xs ${iconColor} mt-1.5 flex items-center gap-1 font-medium`}>
                    <MdTrendingUp size={11} /> {sub}
                  </p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={22} className={iconColor} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className={`flex-1 h-1 rounded-full ${barBg} overflow-hidden`}>
                <div className={`h-full rounded-full ${bar} w-3/5 transition-all duration-700 ease-smooth`} />
              </div>
              <MdArrowForward size={13} className="text-slate-300 dark:text-slate-600 ml-2 group-hover:text-slate-400 dark:group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* Owner Management + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Owner Management (2/3) */}
        <div className="lg:col-span-2 card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="section-title">{t('admin.ownerMgmt')}</h3>
              <p className="section-subtitle">{t('admin.ownerMgmtSub')}</p>
            </div>
            <div className="tabs flex-shrink-0">
              {['pending', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tab-item ${activeTab === tab ? 'tab-item-active' : ''}`}
                >
                  {tab === 'pending'
                    ? `${t('admin.tabPending')}${pendingOwners.length > 0 ? ` (${pendingOwners.length})` : ''}`
                    : `${t('admin.tabAll')} (${allOwners.length})`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="page-loader"><div className="page-loader-ring" /></div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="table-header w-8">#</th>
                    <th className="table-header">{t('table.owner')}</th>
                    <th className="table-header">{t('table.email')}</th>
                    <th className="table-header">{t('table.status')}</th>
                    {activeTab === 'pending' && <th className="table-header">{t('table.actions')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayOwners.map((owner, idx) => (
                    <tr key={owner.id} className="table-row cursor-pointer" onClick={() => navigate('/admin/owners')}>
                      <td className="table-cell text-slate-400 dark:text-slate-500 font-medium">{idx + 1}</td>
                      <td className="table-cell py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="avatar-teal w-9 h-9 text-sm">
                            {owner.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{owner.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(owner.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-slate-500 dark:text-slate-400 text-xs">{owner.email}</td>
                      <td className="table-cell">
                        <span className={owner.approved ? 'badge-approved' : 'badge-pending'}>
                          {owner.approved ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" /> {t('status.approved')}</> : <><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" /> {t('status.pending')}</>}
                        </span>
                      </td>
                      {activeTab === 'pending' && (
                        <td className="table-cell" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1.5">
                            <button onClick={() => approveOwner(owner.id)} className="btn-success text-xs px-3 py-1.5">
                              <MdCheck size={13} /> {t('actions.approve')}
                            </button>
                            <button onClick={() => rejectOwner(owner.id, owner.name)} className="btn-danger text-xs px-3 py-1.5">
                              <MdClose size={13} /> {t('actions.reject')}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {displayOwners.length === 0 && (
                <div className="text-center py-12">
                  <div className="empty-icon-wrap">
                    <MdPeople size={28} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">
                    {activeTab === 'pending' ? t('admin.noPending') : t('admin.noOwners')}
                  </p>
                  <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">{t('misc.checkBackLater')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity (1/3) */}
        <div className="card flex flex-col">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                  <MdNotifications size={13} className="text-teal-600 dark:text-teal-400" />
                </span>
                {t('admin.recentActivity')}
              </h3>
              <p className="section-subtitle mt-0.5">{t('admin.liveActions')}</p>
            </div>
            {unread > 0 && (
              <span className="badge-info text-[10px] flex-shrink-0">{unread} new</span>
            )}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mb-3">
                  <MdNotifications size={22} className="text-teal-200 dark:text-teal-700" />
                </div>
                <p className="text-sm font-medium text-slate-400">{t('admin.noActivity')}</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5">{t('admin.actionsHere')}</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={!n.read ? 'activity-unread' : 'activity-read'}
                >
                  <div className={`w-7 h-7 rounded-lg ${typeBg(n.type)} flex items-center justify-center flex-shrink-0 border`}>
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* All Tenants */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="section-title">{t('admin.allTenants')}</h3>
            <p className="section-subtitle">{t('admin.allTenantsSub')}</p>
          </div>
          <span className="badge-info self-start">{allTenants.length} total</span>
        </div>

        {allTenants.length > 0 && (
          <div className="relative mb-4">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={tenantSearch}
              onChange={e => setTenantSearch(e.target.value)}
              className="input-field pl-10"
              placeholder={t('admin.searchTenants')}
            />
          </div>
        )}

        {loading ? (
          <div className="page-loader"><div className="page-loader-ring" /></div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="table-header w-8">#</th>
                  <th className="table-header">{t('table.tenant')}</th>
                  <th className="table-header">{t('table.email')}</th>
                  <th className="table-header">{t('table.owner')}</th>
                  <th className="table-header">{t('admin.room')}</th>
                  <th className="table-header">{t('table.registered')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant, idx) => (
                  <tr key={tenant.id} className="table-row cursor-pointer" onClick={() => navigate('/admin/tenants')}>
                    <td className="table-cell text-slate-400 dark:text-slate-500 font-medium">{idx + 1}</td>
                    <td className="table-cell py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="avatar-green w-9 h-9 text-sm">
                          {(tenant.user?.name || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{tenant.user?.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-slate-500 dark:text-slate-400 text-xs">{tenant.user?.email}</td>
                    <td className="table-cell">
                      <span className="owner-pill">
                        <MdHomeWork size={10} /> {tenant.owner?.name || '—'}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500 dark:text-slate-400 text-sm">{tenant.roomNumber || '—'}</td>
                    <td className="table-cell text-slate-400 dark:text-slate-500 text-xs">
                      {new Date(tenant.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTenants.length === 0 && (
              <div className="text-center py-14">
                <div className="empty-icon-wrap">
                  <MdPeople size={28} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-400">
                  {tenantSearch ? t('misc.noMatch') : t('admin.noTenants')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;


