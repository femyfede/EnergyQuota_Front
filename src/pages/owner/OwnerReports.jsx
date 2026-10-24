import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import { useLang } from '../../context/LangContext';
import api from '../../api/axios';
import {
  MdDownload, MdPeople, MdElectricalServices, MdPendingActions,
  MdCalendarToday, MdPictureAsPdf,
} from 'react-icons/md';
import { downloadOwnerPDF } from '../../utils/pdfExport';

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

/* ── Helpers ── */
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

/* ── Bar chart (SVG) ── */
const BarChart = ({ data, color = '#14b8a6' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 400, H = 140;
  const cols = data.length;
  const colW = W / cols;
  const barW = Math.min(colW - 16, 44);

  return (
    <svg viewBox={`0 0 ${W} ${H + 36}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={0} y1={H * (1 - f)} x2={W} y2={H * (1 - f)}
          stroke="currentColor" strokeWidth={0.5} strokeDasharray="4 4"
          className="text-slate-200 dark:text-slate-700" />
      ))}
      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * H, d.value > 0 ? 4 : 0);
        const x = i * colW + (colW - barW) / 2;
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={color} rx={5} opacity={0.85} />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9}
                fill="currentColor" fontWeight="700"
                className="text-slate-700 dark:text-slate-200">{d.value}</text>
            )}
            <text x={x + barW / 2} y={H + 18} textAnchor="middle" fontSize={9}
              fill="currentColor" className="text-slate-400 dark:text-slate-500">
              {d.label}
            </text>
          </g>
        );
      })}
      <line x1={0} y1={H} x2={W} y2={H} stroke="currentColor" strokeWidth={1}
        className="text-slate-200 dark:text-slate-700" />
    </svg>
  );
};

/* ── Donut chart (CSS conic-gradient) ── */
const DonutChart = ({ approved, pending, rejected, t }) => {
  const total = approved + pending + rejected || 1;
  const ap = (approved / total) * 100;
  const pp = (pending / total) * 100;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 flex-shrink-0">
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `conic-gradient(
              #10b981 0% ${ap.toFixed(1)}%,
              #f59e0b ${ap.toFixed(1)}% ${(ap + pp).toFixed(1)}%,
              #ef4444 ${(ap + pp).toFixed(1)}% 100%
            )`,
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">{t('reports.total')}</p>
          </div>
        </div>
      </div>
      <div className="space-y-3 flex-1 w-full">
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

/* ── Main component ── */
const OwnerReports = () => {
  const { lang, t } = useLang();
  const [requests, setRequests] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, tenRes] = await Promise.all([
        api.get('/owner/meter-requests'),
        api.get('/owner/tenants'),
      ]);
      setRequests(reqRes.data);
      setTenants(tenRes.data);
    } catch {
      setToast({ message: 'Failed to load report data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const approved = requests.filter(r => r.status === 'approved').length;
  const pending  = requests.filter(r => r.status === 'pending').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;
  const monthlyData = getLast6Months(requests);

  const generatedOn = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const handleDownloadCSV = () => {
    downloadCSV('property-report.csv',
      ['#', 'Tenant', 'Email', 'Meter No.', 'Status'],
      tenants.map((ten, i) => {
        const req = requests.find(r => String(r.tenant?.id) === String(ten.id));
        return [
          i + 1,
          ten.user?.name ?? '',
          ten.user?.email ?? '',
          req?.meterNumber ?? '',
          req?.status ?? 'No request',
        ];
      })
    );
  };

  const handleDownloadPDF = () => {
    downloadOwnerPDF({ tenants, requests, generatedOn, t, lang });
  };

  if (loading) return (
    <Layout title={t('page.reports')}>
      <div className="page-loader"><div className="page-loader-ring" /></div>
    </Layout>
  );

  return (
    <Layout title={t('page.reports')}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">EnergyQuota — {t('reports.propertyTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('reports.generatedOn')}: {generatedOn}</p>
        <hr className="mt-3" />
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h2 className="section-title text-lg">{t('reports.propertyTitle')}</h2>
          <p className="section-subtitle flex items-center gap-1.5 mt-1">
            <MdCalendarToday size={12} />
            {t('reports.generatedOn')}: {generatedOn}
          </p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button onClick={handleDownloadCSV} className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold
            bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
            border border-slate-200 dark:border-slate-700 shadow-sm
            hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600
            hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <MdDownload size={17} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
            {t('reports.downloadCsv')}
          </button>
          <button onClick={handleDownloadPDF} className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold
            bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md
            hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-lg
            transition-all duration-200">
            <MdPictureAsPdf size={17} />
            {t('reports.printPdf')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { icon: MdPeople,            label: t('stats.totalTenants'),   value: tenants.length, color: 'bg-teal-500' },
          { icon: MdPendingActions,    label: t('stats.pendingRequests'),value: pending,        color: 'bg-amber-500' },
          { icon: MdElectricalServices,label: t('stats.metersAssigned'), value: approved,       color: 'bg-emerald-500' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Request breakdown */}
        <div className="card">
          <h3 className="section-title mb-5">{t('reports.breakdown')}</h3>
          <DonutChart approved={approved} pending={pending} rejected={rejected} t={t} />
        </div>

        {/* Monthly trend */}
        <div className="card">
          <h3 className="section-title mb-5">{t('reports.monthlyTrend')}</h3>
          <BarChart data={monthlyData} color="#14b8a6" />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            Meter requests — last 6 months
          </p>
        </div>
      </div>

      {/* Tenant table */}
      <div className="card">
        <h3 className="section-title mb-5">{t('reports.tenantList')}</h3>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="table-header">#</th>
                <th className="table-header">{t('table.tenant')}</th>
                <th className="table-header">{t('table.email')}</th>
                <th className="table-header">{t('table.meterNo')}</th>
                <th className="table-header">{t('table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((ten, i) => {
                const req = requests.find(r => String(r.tenant?.id) === String(ten.id));
                return (
                  <tr key={ten.id} className="table-row">
                    <td className="table-cell text-slate-300 dark:text-slate-600">{i + 1}</td>
                    <td className="table-cell py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700                          flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {(ten.user?.name || '?')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          {ten.user?.name}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-slate-500 dark:text-slate-400 text-xs">{ten.user?.email}</td>
                    <td className="table-cell">
                      {req?.meterNumber ? (
                        <span className="font-mono text-xs font-semibold bg-gray-100                          text-gray-700 px-2 py-1 rounded-lg">
                          {req.meterNumber}
                        </span>
                      ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="table-cell">
                      <span className={
                        !req ? 'badge bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs' :
                        req.status === 'approved' ? 'badge-approved' :
                        req.status === 'pending' ? 'badge-pending' : 'badge-rejected'
                      }>
                        {!req ? 'No request' :
                          req.status === 'approved' ? t('status.approved') :
                          req.status === 'pending'  ? t('status.pending')  : t('status.rejected')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {tenants.length === 0 && (
            <p className="text-center py-8 text-sm text-slate-400">{t('misc.noData')}</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OwnerReports;



