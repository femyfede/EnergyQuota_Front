import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { useLang } from '../../context/LangContext';
import api from '../../api/axios';
import {
  MdAdd, MdDelete, MdPerson, MdClose, MdPhone, MdHome,
  MdSearch, MdPeople,
} from 'react-icons/md';

const avatarColors = [
  'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
];

const getColor = (name = '') => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];

const AddTenantModal = ({ onClose, onAdd, t }) => {
  const [form, setForm]     = useState({ name: '', email: '', password: '', phone: '', roomNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onAdd(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-md fade-up">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
              <MdPerson size={20} className="text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('tenantMgmt.addNew')}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t('tenantMgmt.createCreds')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-xl transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="form-error"><MdClose size={14} className="flex-shrink-0" />{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="form-label">{t('tenantMgmt.fullName')}</label>
                <input type="text" value={form.name} onChange={set('name')} className="input-field" placeholder="Jane Doe" required />
              </div>
              <div className="col-span-2">
                <label className="form-label">{t('tenantMgmt.email')}</label>
                <input type="email" value={form.email} onChange={set('email')} className="input-field" placeholder="jane@example.com" required />
              </div>
              <div className="col-span-2">
                <label className="form-label">{t('tenantMgmt.password')}</label>
                <input type="password" value={form.password} onChange={set('password')} className="input-field" placeholder="••••••••" required minLength={8} autoComplete="new-password" />
                <p className="text-xs text-slate-400 mt-1">At least 8 characters</p>
              </div>
              <div>
                <label className="form-label">{t('tenantMgmt.phone')}</label>
                <input type="tel" value={form.phone} onChange={set('phone')} className="input-field" placeholder="+255 700 000 000" />
              </div>
              <div>
                <label className="form-label">{t('tenantMgmt.room')}</label>
                <input type="text" value={form.roomNumber} onChange={set('roomNumber')} className="input-field" placeholder="A-101" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">{t('actions.cancel')}</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <span className="spin" /> : <MdAdd size={16} />}
                {t('actions.addTenant')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const TenantManagement = () => {
  const { t } = useLang();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]   = useState('');
  const [toast, setToast]     = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchTenants = useCallback(async () => {
    try {
      const { data } = await api.get('/owner/tenants');
      setTenants(data);
    } catch {
      showToast('Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const addTenant = async (formData) => {
    await api.post('/owner/tenants', formData);
    showToast('Tenant added successfully');
    setShowModal(false);
    fetchTenants();
  };

  const deleteTenant = async (id, name) => {
    if (!confirm(`Remove tenant "${name}"? This will delete all their data.`)) return;
    try {
      await api.delete(`/owner/tenants/${id}`);
      showToast('Tenant removed');
      fetchTenants();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove', 'error');
    }
  };

  const filtered = tenants.filter((ten) => {
    const q = search.toLowerCase();
    return (
      ten.user?.name?.toLowerCase().includes(q) ||
      ten.user?.email?.toLowerCase().includes(q) ||
      ten.roomNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <Layout title={t('page.tenantManagement')}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {showModal && (
        <AddTenantModal onClose={() => setShowModal(false)} onAdd={addTenant} t={t} />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">{t('stats.totalTenants')}</p>
              <p className="metric-value">{tenants.length}</p>
            </div>
            <div className="stat-icon bg-teal-500"><MdPeople size={20} className="text-white" /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">{t('stats.withRoom')}</p>
              <p className="metric-value">{tenants.filter(ten => ten.roomNumber).length}</p>
            </div>
            <div className="stat-icon bg-teal-500"><MdHome size={20} className="text-white" /></div>
          </div>
        </div>
        <div className="stat-card col-span-2 sm:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="metric-label">{t('stats.withPhone')}</p>
              <p className="metric-value">{tenants.filter(ten => ten.phone).length}</p>
            </div>
            <div className="stat-icon bg-emerald-500"><MdPhone size={20} className="text-white" /></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="section-title">{t('tenantMgmt.title')}</h3>
            <p className="section-subtitle">{t('tenantMgmt.sub', { count: tenants.length })}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary self-start">
            <MdAdd size={18} /> {t('actions.addTenant')}
          </button>
        </div>

        {tenants.length > 0 && (
          <div className="relative mb-5">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
              placeholder={t('tenantMgmt.searchPlaceholder')}
            />
          </div>
        )}

        {loading ? (
          <div className="page-loader"><div className="page-loader-ring" /></div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <MdPeople size={40} className="text-slate-200 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{t('tenantMgmt.noTenants')}</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 mb-4">{t('tenantMgmt.addFirst')}</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <MdAdd size={16} /> {t('actions.addTenant')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <MdSearch size={32} className="mx-auto text-slate-200 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">{t('tenantMgmt.noMatch', { q: search })}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tenant) => {
              const name     = tenant.user?.name || 'Unknown';
              const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const colorCls = getColor(name);
              return (
                <div
                  key={tenant.id}
                  className="group relative p-4 rounded-2xl border border-slate-100 dark:border-slate-700
                    hover:border-teal-200 dark:hover:border-teal-700
                    hover:shadow-md transition-all duration-200
                    bg-white dark:bg-slate-800"
                >
                  <button
                    onClick={() => deleteTenant(tenant.id, name)}
                    className="absolute top-3 right-3 p-1.5 text-slate-300 dark:text-slate-600
                      hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                      rounded-lg transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:scale-110"
                    title="Remove tenant"
                  >
                    <MdDelete size={16} />
                  </button>

                  <div className="flex items-center gap-3 mb-3.5">
                    <div className={`w-11 h-11 rounded-2xl ${colorCls} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0 pr-8">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{tenant.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tenant.roomNumber && (
                      <span className="room-tag">
                        <MdHome size={11} className="text-slate-400" /> {tenant.roomNumber}
                      </span>
                    )}
                    {tenant.phone && (
                      <span className="room-tag">
                        <MdPhone size={11} className="text-slate-400" /> {tenant.phone}
                      </span>
                    )}
                    {!tenant.roomNumber && !tenant.phone && (
                      <span className="text-xs text-slate-300 dark:text-slate-600">{t('tenantMgmt.noDetails')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TenantManagement;


