import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { useLang } from '../../context/LangContext';
import api from '../../api/axios';
import {
  MdAdd, MdCheck, MdClose, MdDelete, MdSearch,
  MdVerifiedUser, MdPendingActions, MdPeople,
  MdDownload, MdPerson, MdVisibility, MdPauseCircle,
  MdEmail, MdCalendarToday,
} from 'react-icons/md';

const downloadCSV = (filename, headers, rows) => {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
};

const ViewOwnerModal = ({ owner, onClose, t }) => {
  if (!owner) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card max-w-md" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
              <MdPerson size={20} className="text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('actions.view')} Owner</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <MdClose size={20} />
          </button>
        </div>
        <div className="modal-body space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
            <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
              {owner.name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{owner.name}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${owner.approved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                {owner.approved ? t('status.approved') : t('status.pending')}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <MdEmail size={16} className="text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300">{owner.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MdCalendarToday size={16} className="text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300">
                {new Date(owner.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200">
              {t('actions.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddOwnerModal = ({ onClose, onAdd, t }) => {
  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onAdd(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add owner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-md">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
              <MdPerson size={20} className="text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('admin.addOwnerTitle')}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t('admin.addOwnerSub')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <MdClose size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="form-error"><MdClose size={14} className="flex-shrink-0" /> {error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">{t('register.fullName')}</label>
              <input type="text" value={form.name} onChange={set('name')} className="input-field" placeholder="John Doe" required />
            </div>
            <div>
              <label className="form-label">{t('register.email')}</label>
              <input type="email" value={form.email} onChange={set('email')} className="input-field" placeholder="john@example.com" required />
            </div>
            <div>
              <label className="form-label">{t('register.password')}</label>
              <input type="password" value={form.password} onChange={set('password')} className="input-field" placeholder="••••••••" required minLength={8} autoComplete="new-password" />
              <p className="text-xs text-slate-400 mt-1">At least 8 characters</p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200">
                {t('actions.cancel')}
              </button>
              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <span className="spin" /> : <MdAdd size={16} />}
                {t('admin.addOwner')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminOwners = () => {
  const { t } = useLang();
  const [owners, setOwners]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast]         = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchOwners = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/owners');
      setOwners(data);
    } catch {
      showToast('Failed to load owners', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  const addOwner = async (formData) => {
    await api.post('/admin/owners', formData);
    showToast('Owner added and approved successfully');
    setShowModal(false);
    fetchOwners();
  };

  const approveOwner = async (id) => {
    try {
      await api.patch(`/admin/owners/${id}/approve`);
      showToast('Owner approved');
      fetchOwners();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve', 'error');
    }
  };

  const rejectOwner = async (id, name) => {
    if (!confirm(`Reject and remove "${name}"?`)) return;
    try {
      await api.delete(`/admin/owners/${id}/reject`);
      showToast('Owner rejected and removed');
      fetchOwners();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject', 'error');
    }
  };

  const [viewOwnerData, setViewOwnerData] = useState(null);

  const viewOwner = (id) => {
    const owner = owners.find(o => o.id === id);
    if (owner) setViewOwnerData(owner);
  };

  const suspendOwner = async (id, name) => {
    if (!confirm(`Suspend owner "${name}"? They will not be able to log in until reinstated.`)) return;
    try {
      await api.patch(`/admin/owners/${id}/suspend`);
      showToast('Owner suspended');
      fetchOwners();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to suspend', 'error');
    }
  };

  const deleteOwner = async (id, name) => {
    if (!confirm(`Permanently delete owner "${name}"?`)) return;
    try {
      await api.delete(`/admin/owners/${id}`);
      showToast('Owner deleted');
      fetchOwners();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const approved = owners.filter(o => o.approved);
  const pending  = owners.filter(o => !o.approved);
  const displayed = (activeTab === 'pending' ? pending : activeTab === 'approved' ? approved : owners)
    .filter(o => {
      const q = search.toLowerCase();
      return !q || o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
    });

  const handleExportCSV = () => {
    const src = activeTab === 'pending' ? pending : activeTab === 'approved' ? approved : owners;
    downloadCSV('owners.csv',
      ['#', 'Name', 'Email', 'Status', 'Registered'],
      src.map((o, i) => [
        i + 1, o.name, o.email,
        o.approved ? 'Approved' : 'Pending',
        new Date(o.createdAt).toLocaleDateString(),
      ])
    );
  };

  return (
    <Layout title={t('page.ownerManagement')}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {showModal && <AddOwnerModal onClose={() => setShowModal(false)} onAdd={addOwner} t={t} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: t('admin.totalOwners'),    value: owners.length,   light: 'bg-teal-50 dark:bg-teal-900/30',    text: 'text-teal-600 dark:text-teal-400',    icon: MdPeople },
          { label: t('admin.approvedOwners'), value: approved.length, light: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: MdVerifiedUser },
          { label: t('admin.pendingOwners'),  value: pending.length,  light: 'bg-amber-50 dark:bg-amber-900/30',   text: 'text-amber-600 dark:text-amber-400',   icon: MdPendingActions },
        ].map(({ label, value, light, text, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="metric-label">{label}</p>
                <p className="metric-value">{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${light} flex items-center justify-center flex-shrink-0`}>
                <Icon size={22} className={text} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="section-title">{t('admin.allOwnersTitle')}</h3>
            <p className="section-subtitle">{t('admin.allOwnersSub')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportCSV} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <MdDownload size={15} /> {t('actions.exportCsv')}
            </button>
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <MdAdd size={15} /> {t('admin.addOwner')}
            </button>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="tabs">
            {[
              { key: 'all',      label: `${t('admin.tabAll')} (${owners.length})` },
              { key: 'approved', label: `${t('admin.approvedOwners')} (${approved.length})` },
              { key: 'pending',  label: `${t('admin.pendingOwners')} (${pending.length})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-item ${activeTab === tab.key ? 'tab-item-active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-10" placeholder={t('admin.searchOwners')}
            />
          </div>
        </div>

        {loading ? (
          <div className="page-loader"><div className="page-loader-ring" /></div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[580px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="table-header w-8">#</th>
                  <th className="table-header">{t('table.owner')}</th>
                  <th className="table-header">{t('table.email')}</th>
                  <th className="table-header">{t('table.status')}</th>
                  <th className="table-header">{t('table.registered')}</th>
                  <th className="table-header">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((owner, idx) => (
                  <tr key={owner.id} className="table-row">
                    <td className="table-cell text-slate-400 dark:text-slate-500 font-medium">{idx + 1}</td>
                    <td className="table-cell py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="avatar-teal w-9 h-9 text-sm">
                          {owner.name[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{owner.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-slate-500 dark:text-slate-400 text-xs">{owner.email}</td>
                    <td className="table-cell">
                      <span className={owner.approved ? 'badge-approved' : 'badge-pending'}>
                        {owner.approved ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" /> {t('status.approved')}</> : <><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" /> {t('status.pending')}</>}
                      </span>
                    </td>
                    <td className="table-cell text-slate-400 dark:text-slate-500 text-xs">
                      {new Date(owner.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1.5 flex-wrap">
                        {!owner.approved && (
                          <button onClick={() => approveOwner(owner.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                            <MdCheck size={13} /> {t('actions.approve')}
                          </button>
                        )}
                        {!owner.approved && (
                          <button onClick={() => rejectOwner(owner.id, owner.name)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                            <MdClose size={13} /> {t('actions.reject')}
                          </button>
                        )}
                        {owner.approved && (
                          <>
                            <button onClick={() => viewOwner(owner.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200">
                              <MdVisibility size={13} /> {t('actions.view')}
                            </button>
                            <button onClick={() => suspendOwner(owner.id, owner.name)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200">
                              <MdPauseCircle size={13} /> {t('actions.suspend')}
                            </button>
                            <button onClick={() => deleteOwner(owner.id, owner.name)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200">
                              <MdDelete size={13} /> {t('actions.delete')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {displayed.length === 0 && (
              <div className="text-center py-14">
                <div className="empty-icon-wrap">
                  <MdVerifiedUser size={28} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-400">
                  {search ? t('misc.noMatch') : t('admin.noOwners')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      {viewOwnerData && (
        <ViewOwnerModal owner={viewOwnerData} onClose={() => setViewOwnerData(null)} t={t} />
      )}
    </Layout>
  );
};

export default AdminOwners;
