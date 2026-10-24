import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { useLang } from '../../context/LangContext';
import api from '../../api/axios';
import {
  MdPeople, MdHome, MdHomeWork, MdSearch,
  MdDownload, MdElectricalServices,
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

const AdminTenants = () => {
  const { t } = useLang();
  const [tenants, setTenants]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [toast, setToast]       = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchTenants = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/tenants');
      setTenants(data);
    } catch {
      showToast('Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const ownerOptions = [...new Map(
    tenants.filter(t => t.owner).map(t => [t.owner.id, t.owner.name])
  ).entries()].map(([id, name]) => ({ id, name }));

  const filtered = tenants.filter(ten => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      ten.user?.name?.toLowerCase().includes(q) ||
      ten.user?.email?.toLowerCase().includes(q) ||
      ten.owner?.name?.toLowerCase().includes(q) ||
      ten.roomNumber?.toLowerCase().includes(q);
    const matchOwner = !ownerFilter || ten.owner?.id === ownerFilter;
    return matchSearch && matchOwner;
  });

  const withRoom  = tenants.filter(t => t.roomNumber).length;
  const withMeter = tenants.filter(t => t.meterNumber).length;

  const handleExportCSV = () => {
    downloadCSV('tenants.csv',
      ['#', 'Name', 'Email', 'Owner', 'Room', 'Registered'],
      filtered.map((ten, i) => [
        i + 1,
        ten.user?.name ?? '',
        ten.user?.email ?? '',
        ten.owner?.name ?? '',
        ten.roomNumber ?? '',
        new Date(ten.createdAt).toLocaleDateString(),
      ])
    );
  };

  return (
    <Layout title={t('page.tenantList')}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('stats.totalTenants'),  value: tenants.length,      light: 'bg-teal-50 dark:bg-teal-900/30',    text: 'text-teal-600 dark:text-teal-400',    icon: MdPeople },
          { label: t('admin.withRoomNo'),    value: withRoom,             light: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: MdHome },
          { label: t('admin.acrossOwners'),  value: ownerOptions.length,  light: 'bg-teal-50 dark:bg-teal-900/30',    text: 'text-teal-600 dark:text-teal-400',    icon: MdHomeWork },
          { label: t('admin.meterAssigned'), value: withMeter,            light: 'bg-amber-50 dark:bg-amber-900/30',   text: 'text-amber-600 dark:text-amber-400',   icon: MdElectricalServices },
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
            <h3 className="section-title">{t('admin.allTenants')}</h3>
            <p className="section-subtitle">{t('admin.allTenantsSub')}</p>
          </div>
          <button onClick={handleExportCSV} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 self-start">
            <MdDownload size={15} /> {t('actions.exportCsv')}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="input-field pl-10" placeholder={t('admin.searchTenants')}
            />
          </div>
          {ownerOptions.length > 0 && (
            <select
              value={ownerFilter}
              onChange={e => setOwnerFilter(e.target.value)}
              className="input-field sm:w-52"
            >
              <option value="">{t('admin.allOwnerFilter')}</option>
              {ownerOptions.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
        </div>

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
                {filtered.map((ten, idx) => (
                  <tr key={ten.id} className="table-row">
                    <td className="table-cell text-slate-400 dark:text-slate-500 font-medium">{idx + 1}</td>
                    <td className="table-cell py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="avatar-green w-9 h-9 text-sm">
                          {(ten.user?.name || '?')[0].toUpperCase()}
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{ten.user?.name}</p>
                      </div>
                    </td>
                    <td className="table-cell text-slate-500 dark:text-slate-400 text-xs">{ten.user?.email}</td>
                    <td className="table-cell">
                      <span className="owner-pill">
                        <MdHomeWork size={10} /> {ten.owner?.name || '—'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {ten.roomNumber
                        ? <span className="room-tag"><MdHome size={10} className="text-slate-400" /> {ten.roomNumber}</span>
                        : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      }
                    </td>
                    <td className="table-cell text-slate-400 dark:text-slate-500 text-xs">
                      {new Date(ten.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-14">
                <div className="empty-icon-wrap">
                  <MdPeople size={28} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-400">
                  {search || ownerFilter ? t('misc.noMatch') : t('admin.noTenants')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminTenants;



