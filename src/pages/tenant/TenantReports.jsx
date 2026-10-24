import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import api from '../../api/axios';
import {
  MdDownload, MdElectricalServices, MdPendingActions, MdCheckCircle,
  MdClose, MdCalendarToday, MdPerson, MdHome, MdPhone, MdBarChart,
  MdPictureAsPdf,
} from 'react-icons/md';
import { downloadTenantPDF } from '../../utils/pdfExport';

/* ── CSV helper ── */
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

/* ── Bar chart (last 6 months) ── */
const getLast6Months = (items) =>
  Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    d.setDate(1);
    const y = d.getFullYear(), m = d.getMonth();
    return {
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      value: items.filter(r => {
        const rd = new Date(r.createdAt);
        return rd.getFullYear() === y && rd.getMonth() === m;
      }).length,
    };
  });

const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 400, H = 120;
  const cols = data.length;
  const colW = W / cols;
  const barW = Math.min(colW - 14, 44);

  return (
    <svg viewBox={`0 0 ${W} ${H + 34}`} className="w-full">
      {[0, 0.5, 1].map(f => (
        <line key={f} x1={0} y1={H * (1 - f)} x2={W} y2={H * (1 - f)}
          stroke="currentColor" strokeWidth={0.5} strokeDasharray="4 4" className="text-slate-200 dark:text-slate-700" />
      ))}
      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * H, d.value > 0 ? 4 : 0);
        const x = i * colW + (colW - barW) / 2;
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill="#10b981" rx={5} opacity={0.85} />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9}
                fill="#374151" fontWeight="700">{d.value}</text>
            )}
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={9} fill="#9ca3af">
              {d.label}
            </text>
          </g>
        );
      })}
      <line x1={0} y1={H} x2={W} y2={H} stroke="currentColor" strokeWidth={1} className="text-slate-200 dark:text-slate-700" />
    </svg>
  );
};

/* ── Donut chart ── */
const DonutChart = ({ approved, pending, rejected, t }) => {
  const total = approved + pending + rejected || 1;
  const ap = (approved / total) * 100;
  const pp = (pending / total) * 100;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-32 h-32 flex-shrink-0">
        <div className="w-full h-full rounded-full" style={{
          background: `conic-gradient(
            #10b981 0% ${ap.toFixed(1)}%,
            #f59e0b ${ap.toFixed(1)}% ${(ap + pp).toFixed(1)}%,
            #ef4444 ${(ap + pp).toFixed(1)}% 100%
          )`,
        }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center shadow-sm">
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{total}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">{t('reports.total')}</p>
          </div>
        </div>
      </div>
      <div className="space-y-2.5 flex-1 w-full">
        {[
          { label: t('reports.approved'), count: approved, pct: ap,            color: 'bg-emerald-500' },
          { label: t('reports.pending'),  count: pending,  pct: pp,            color: 'bg-amber-500' },
          { label: t('reports.rejected'), count: rejected, pct: 100 - ap - pp, color: 'bg-red-500' },
        ].map(item => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full ${item.color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(item.pct, 0).toFixed(1)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Status badge ── */
const StatusBadge = ({ status, t }) => {
  const map = {
    pending:  { cls: 'badge-pending',  dot: 'bg-amber-500', label: t('status.pending') },
    approved: { cls: 'badge-approved', dot: 'bg-emerald-500', label: t('status.approved') },
    rejected: { cls: 'badge-rejected', dot: 'bg-red-500', label: t('status.rejected') },
  };
  const { cls, dot, label } = map[status] || { cls: 'badge', dot: null, label: status };
  return <span className={cls}>{dot && <span className={`w-1.5 h-1.5 rounded-full ${dot} mr-1.5`} />}{label}</span>;
};

/* ── Main page ── */
const TenantReports = () => {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const [info, setInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [infoRes, reqRes] = await Promise.all([
        api.get('/tenant/me'),
        api.get('/tenant/meter-requests'),
      ]);
      setInfo(infoRes.data);
      setRequests(reqRes.data);
    } catch {
      setToast({ message: 'Failed to load report data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const approved  = requests.filter(r => r.status === 'approved').length;
  const pending   = requests.filter(r => r.status === 'pending').length;
  const rejected  = requests.filter(r => r.status === 'rejected').length;
  const monthData = getLast6Months(requests);
  const activeMeter = requests.find(r => r.status === 'approved');

  const generatedOn = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const handleDownloadCSV = () => {
    downloadCSV('my-meter-report.csv',
      ['#', 'Date Requested', 'Meter No.', 'Status', 'Last Updated'],
      requests.map((r, i) => [
        i + 1,
        new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        r.meterNumber ?? '',
        r.status,
        new Date(r.updatedAt || r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      ])
    );
  };

  if (loading) return (
    <Layout title={t('page.tenantReports')}>
      <div className="page-loader"><div className="page-loader-ring" /></div>
    </Layout>
  );

  return (
    <Layout title={t('page.tenantReports')}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="section-title text-lg">{t('reports.tenantTitle')}</h2>
          <p className="section-subtitle flex items-center gap-1.5 mt-1">
            <MdCalendarToday size={12} />
            {t('reports.generatedOn')}: {generatedOn}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadCSV} className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold
            bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
            border border-slate-200 dark:border-slate-700 shadow-sm
            hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600
            hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <MdDownload size={17} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
            {t('reports.downloadCsv')}
          </button>
          <button onClick={() => downloadTenantPDF({ user, info, requests, generatedOn, t, lang })} className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold
            bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md
            hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-lg
            transition-all duration-200">
            <MdPictureAsPdf size={17} />
            {t('reports.printPdf')}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { icon: MdBarChart,          label: t('tenant.totalReqs'),       value: requests.length, color: 'bg-teal-500' },
          { icon: MdCheckCircle,       label: t('reports.approved'),        value: approved,        color: 'bg-emerald-500' },
          { icon: MdPendingActions,    label: t('reports.pending'),         value: pending,         color: 'bg-amber-500' },
          { icon: MdClose,             label: t('reports.rejected'),        value: rejected,        color: 'bg-red-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="metric-label">{label}</p>
                <p className="metric-value">{value}</p>
              </div>
              <div className={`stat-icon ${color}`}>
                <Icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <h3 className="section-title mb-4">{t('reports.breakdown')}</h3>
          <DonutChart approved={approved} pending={pending} rejected={rejected} t={t} />
        </div>
        <div className="card">
          <h3 className="section-title mb-4">{t('reports.monthlyTrend')}</h3>
          <BarChart data={monthData} />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">{t('tenant.reqHistorySub')} — last 6 months</p>
        </div>
      </div>

      {/* Account info + Active meter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Account info */}
        <div className="card">
          <h3 className="section-title mb-4">{t('tenant.accountInfo')}</h3>
          <div className="space-y-3">
            {[
              { icon: MdPerson, label: t('table.name'),           value: user?.name },
              { icon: MdPerson, label: t('table.email'),          value: user?.email },
              { icon: MdHome,   label: t('profile.room'),         value: info?.roomNumber || '—' },
              { icon: MdPhone,  label: t('profile.phone'),        value: info?.phone || '—' },
              { icon: MdPerson, label: t('profile.propertyOwner'), value: info?.owner?.name || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active meter card */}
        <div className="card">
          <h3 className="section-title mb-4">{t('tenant.meterStatus')}</h3>
          {activeMeter ? (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <MdCheckCircle size={18} />
                <span className="font-semibold text-sm">{t('status.meterAssigned')}</span>
              </div>
              <div className="bg-white/20 rounded-xl px-4 py-3 mb-3">
                <p className="text-[10px] text-emerald-100 uppercase tracking-widest font-bold mb-1">{t('table.meterNo')}</p>
                <p className="text-3xl font-bold font-mono tracking-wider">{activeMeter.meterNumber}</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-100 text-xs">
                <MdCalendarToday size={11} />
                {t('tenant.assignedOn')}: {new Date(activeMeter.updatedAt || activeMeter.createdAt)
                  .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
                <MdElectricalServices size={28} className="text-slate-300 dark:text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('tenant.noMeterNum')}</p>
              {pending > 0 && (
                <span className="badge-pending mt-3">{t('status.pending')}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Request history table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="section-title">{t('reports.meterHistory')}</h3>
            <p className="section-subtitle">{requests.length} {t('misc.allTime')}</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-14">
            <div className="empty-icon-wrap">
              <MdElectricalServices size={26} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">{t('tenant.noHistory')}</p>
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5">{t('tenant.noHistorySub')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="table-header w-8">#</th>
                  <th className="table-header">{t('table.dateRequested')}</th>
                  <th className="table-header">{t('table.meterNo')}</th>
                  <th className="table-header">{t('table.status')}</th>
                  <th className="table-header hidden sm:table-cell">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => (
                  <tr key={req.id} className="table-row">
                    <td className="table-cell text-slate-400 dark:text-slate-500 font-medium">{idx + 1}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                        <MdCalendarToday size={11} />
                        {new Date(req.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="table-cell">
                      {req.meterNumber
                        ? <span className="meter-tag">{req.meterNumber}</span>
                        : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      }
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={req.status} t={t} />
                    </td>
                    <td className="table-cell hidden sm:table-cell text-xs text-slate-400 dark:text-slate-500">
                      {new Date(req.updatedAt || req.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TenantReports;


