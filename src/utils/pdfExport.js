import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import T from '../translations';

const BRAND   = 'EnergyQuota';
const PRIMARY = [37, 99, 235];
const EMERALD = [16, 185, 129];
const SLATE   = [71, 85, 105];
const LIGHT   = [241, 245, 249];

const LOCALE = { en: 'en-US', sw: 'sw-TZ', fr: 'fr-FR', zh: 'en-US' };

/* For Chinese PDFs fall back to English labels: jsPDF's default Helvetica
   cannot render CJK glyphs, so Chinese labels would appear blank.
   All other languages use their own translated labels. */
const makePdfT = (t, lang) => {
  if (lang !== 'zh') return t;
  return (key, vars = {}) => {
    let str = T.en?.[key] ?? key;
    Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
    return str;
  };
};

/* Strip CJK code-point ranges from user-data values so jsPDF doesn't crash
   on entries where someone's name was stored in Chinese characters. */
const safeVal = (str) =>
  String(str ?? '').replace(/[一-鿿㐀-䶿　-〿＀-￯]+/g, '');

const fmtDate = (dateStr, lang) =>
  new Date(dateStr).toLocaleDateString(LOCALE[lang] || 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

/* Sanitise a data value for the current language */
const dataVal = (str, lang) => lang === 'zh' ? safeVal(str) : String(str ?? '');

/* Build branded header; returns { doc, startY } */
const buildDoc = (title, subtitle, lang) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(BRAND, 14, 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 16);

  doc.setTextColor(...SLATE);
  doc.setFontSize(8);
  doc.text(subtitle, 14, 29);

  if (lang === 'zh') {
    doc.setFontSize(7);
    doc.setTextColor(180, 120, 0);
    doc.text('Note: PDF labels shown in English — CJK font not available', 14, 35);
    return { doc, startY: 40 };
  }

  return { doc, startY: 34 };
};

/* Shared table styles; strips CJK from raw cell values to prevent crashes */
const makeTableStyles = (lang) => ({
  theme: 'striped',
  headStyles:  { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
  bodyStyles:  { fontSize: 8, textColor: [30, 41, 59] },
  alternateRowStyles: { fillColor: LIGHT },
  margin: { left: 14, right: 14 },
  didParseCell: (data) => {
    if (lang === 'zh' && typeof data.cell.raw === 'string') {
      data.cell.text = [safeVal(data.cell.raw)];
    }
  },
});

/* Stat boxes row */
const renderStatBoxes = (doc, cols, startY, valueColor) => {
  const boxW = (doc.internal.pageSize.getWidth() - 28) / cols.length;
  cols.forEach((col, i) => {
    const x = 14 + i * boxW;
    doc.setFillColor(...LIGHT);
    doc.roundedRect(x, startY, boxW - 2, 16, 2, 2, 'F');
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...valueColor);
    doc.text(String(col.value), x + boxW / 2 - 1, startY + 8, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE);
    doc.text(col.label, x + boxW / 2 - 1, startY + 13, { align: 'center' });
  });
};

/* ── Admin report ── */
export const downloadAdminPDF = ({ owners, stats, generatedOn, t, lang }) => {
  const pt = makePdfT(t, lang);
  const { doc, startY } = buildDoc(
    pt('reports.systemTitle'),
    `${pt('reports.generatedOn')}: ${generatedOn}`,
    lang,
  );

  renderStatBoxes(doc, [
    { label: pt('stats.activeOwners'),    value: stats.owners        ?? 0 },
    { label: pt('stats.pendingApproval'), value: stats.pendingOwners ?? 0 },
    { label: pt('stats.totalTenants'),    value: stats.tenants        ?? 0 },
    { label: pt('stats.meterRequests'),   value: stats.meterRequests  ?? 0 },
  ], startY, PRIMARY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE);
  doc.text(pt('reports.ownerList'), 14, startY + 22);

  autoTable(doc, {
    ...makeTableStyles(lang),
    startY: startY + 25,
    head: [[
      '#',
      pt('table.name'),
      pt('table.email'),
      pt('table.status'),
      pt('table.registered'),
    ]],
    body: owners.map((o, i) => [
      i + 1,
      dataVal(o.name  ?? '', lang),
      o.email ?? '',
      o.approved ? pt('status.approved') : pt('status.pending'),
      fmtDate(o.createdAt, lang),
    ]),
  });

  doc.save('system-report.pdf');
};

/* ── Owner report ── */
export const downloadOwnerPDF = ({ tenants, requests, generatedOn, t, lang }) => {
  const pt = makePdfT(t, lang);
  const { doc, startY } = buildDoc(
    pt('reports.propertyTitle'),
    `${pt('reports.generatedOn')}: ${generatedOn}`,
    lang,
  );

  const approved = requests.filter(r => r.status === 'approved').length;
  const pending  = requests.filter(r => r.status === 'pending').length;

  renderStatBoxes(doc, [
    { label: pt('stats.totalTenants'),    value: tenants.length },
    { label: pt('stats.metersAssigned'),  value: approved },
    { label: pt('stats.pendingRequests'), value: pending },
  ], startY, EMERALD);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE);
  doc.text(pt('reports.tenantList'), 14, startY + 22);

  autoTable(doc, {
    ...makeTableStyles(lang),
    startY: startY + 25,
    head: [[
      '#',
      pt('table.tenant'),
      pt('table.email'),
      pt('table.room'),
      pt('table.meterNo'),
      pt('table.status'),
    ]],
    body: tenants.map((ten, i) => {
      const req = requests.find(
        r => String(r.tenant?.id ?? r.tenant) === String(ten.id),
      );
      const status = req ? pt(`status.${req.status}`) : pt('misc.noRequest');
      return [
        i + 1,
        dataVal(ten.user?.name  ?? '', lang),
        ten.user?.email ?? '',
        ten.roomNumber ?? '—',
        req?.meterNumber ?? '—',
        status,
      ];
    }),
  });

  doc.save('property-report.pdf');
};

/* ── Tenant report ── */
export const downloadTenantPDF = ({ user, info, requests, generatedOn, t, lang }) => {
  const pt = makePdfT(t, lang);
  const { doc, startY } = buildDoc(
    pt('reports.tenantTitle'),
    `${pt('reports.generatedOn')}: ${generatedOn}`,
    lang,
  );

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE);
  doc.text(pt('tenant.accountInfo'), 14, startY);

  const activeMeter = requests.find(r => r.status === 'approved');
  const infoRows = [
    [pt('table.name'),             dataVal(user?.name ?? '',             lang)],
    [pt('table.email'),            user?.email ?? ''],
    [pt('profile.room'),           info?.roomNumber ?? '—'],
    [pt('profile.phone'),          info?.phone ?? '—'],
    [pt('profile.propertyOwner'),  dataVal(info?.owner?.name ?? '', lang)],
  ];
  if (activeMeter?.meterNumber) {
    infoRows.push([pt('table.meterNo'), activeMeter.meterNumber]);
  }

  autoTable(doc, {
    ...makeTableStyles(lang),
    startY: startY + 3,
    head: [[pt('table.field'), pt('table.value')]],
    body: infoRows,
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
  });

  const approved = requests.filter(r => r.status === 'approved').length;
  const pending  = requests.filter(r => r.status === 'pending').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  const afterInfo = doc.lastAutoTable.finalY + 6;
  renderStatBoxes(doc, [
    { label: pt('tenant.totalReqs'), value: requests.length },
    { label: pt('reports.approved'), value: approved },
    { label: pt('reports.pending'),  value: pending },
    { label: pt('reports.rejected'), value: rejected },
  ], afterInfo, EMERALD);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE);
  doc.text(pt('reports.meterHistory'), 14, afterInfo + 22);

  autoTable(doc, {
    ...makeTableStyles(lang),
    startY: afterInfo + 25,
    head: [[
      '#',
      pt('table.dateRequested'),
      pt('table.meterNo'),
      pt('table.status'),
      pt('table.lastUpdated'),
    ]],
    body: requests.map((r, i) => [
      i + 1,
      fmtDate(r.createdAt, lang),
      r.meterNumber ?? '—',
      pt(`status.${r.status}`),
      fmtDate(r.updatedAt || r.createdAt, lang),
    ]),
  });

  doc.save('my-meter-report.pdf');
};



