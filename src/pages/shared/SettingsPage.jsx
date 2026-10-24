import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { useTheme } from '../../context/ThemeContext';
import {
  MdPerson, MdLanguage, MdHelp,
  MdPhone, MdEmail, MdLocationOn, MdCheckCircle,
  MdAdminPanelSettings, MdHomeWork, MdHome,
  MdLightMode, MdDarkMode,
} from 'react-icons/md';

const LANGS = ['en', 'sw', 'fr', 'zh'];

const adminStepKeys = [
  'help.adminStep1', 'help.adminStep2', 'help.adminStep3',
  'help.adminStep4', 'help.adminStep5',
];
const ownerStepKeys = [
  'help.ownerStep1', 'help.ownerStep2', 'help.ownerStep3',
  'help.ownerStep4', 'help.ownerStep5',
];
const tenantStepKeys = [
  'help.tenantStep1', 'help.tenantStep2', 'help.tenantStep3',
  'help.tenantStep4', 'help.tenantStep5',
];

const stepKeys = { admin: adminStepKeys, owner: ownerStepKeys, tenant: tenantStepKeys };

const stepColors = {
  admin:  { bg: 'bg-teal-50 dark:bg-teal-900/20',   num: 'bg-teal-600 text-white',    border: 'border-teal-100 dark:border-teal-900/40' },
  owner:  { bg: 'bg-teal-50 dark:bg-teal-900/20',   num: 'bg-teal-600 text-white',    border: 'border-teal-100 dark:border-teal-900/40' },
  tenant: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', num: 'bg-emerald-600 text-white', border: 'border-emerald-100 dark:border-emerald-900/40' },
};

const roleIcon = { admin: MdAdminPanelSettings, owner: MdHomeWork, tenant: MdHome };

const Section = ({ title, icon: Icon, children }) => (
  <div className="card mb-5">
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-700">
      <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
        <Icon size={18} className="text-teal-600 dark:text-teal-400" />
      </div>
      <h3 className="section-title">{title}</h3>
    </div>
    {children}
  </div>
);

const SettingsPage = () => {
  const { user } = useAuth();
  const { lang, setLang, t } = useLang();
  const { dark, toggle } = useTheme();

  const role     = user?.role || 'tenant';
  const RoleIcon = roleIcon[role] || MdPerson;
  const colors   = stepColors[role] || stepColors.tenant;
  const steps    = stepKeys[role] || tenantStepKeys;
  const initials = (user?.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const avatarBg = role === 'admin' ? 'bg-teal-600' : role === 'owner' ? 'bg-teal-600' : 'bg-emerald-600';
  const badgeCls = role === 'admin'
    ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
    : role === 'owner'
    ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
    : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';

  const langLabels = { en: 'English', sw: 'Kiswahili', fr: 'Français', zh: '中文' };

  return (
    <Layout title={t('page.settings')}>
      <div className="max-w-3xl mx-auto">

        {/* Profile */}
        <Section title={t('settings.myProfile')} icon={MdPerson}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-lg ${avatarBg}`}>
              {initials}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              <span className={`inline-block mt-1.5 text-[10px] font-semibold capitalize px-2.5 py-0.5 rounded-full ${badgeCls}`}>
                {role}
              </span>
            </div>
          </div>
        </Section>

        {/* Preferences */}
        <Section title={t('settings.preferences')} icon={MdLanguage}>
          {/* Theme toggle */}
          <div className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('settings.theme')}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {dark ? t('theme.dark') : t('theme.light')}
              </p>
            </div>
            <button
              onClick={toggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                ${dark
                  ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {dark ? <MdLightMode size={16} /> : <MdDarkMode size={16} />}
              {dark ? t('theme.light') : t('theme.dark')}
            </button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('settings.language')}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t(`lang.${lang}`)}</p>
            </div>
            <div className="tabs">
              {LANGS.map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`tab-item ${lang === l ? 'tab-item-active' : ''}`}
                >
                  {langLabels[l]}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* How to use */}
        <Section title={t('settings.howToUse')} icon={MdHelp}>
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center
              ${role === 'owner' || role === 'admin' ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
              <RoleIcon size={15} className={role === 'tenant' ? 'text-emerald-600 dark:text-emerald-400' : 'text-teal-600 dark:text-teal-400'} />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">{role} guide</p>
          </div>
          <div className="space-y-3">
            {steps.map((key, i) => (
              <div key={i} className={`flex gap-4 p-4 rounded-2xl border ${colors.bg} ${colors.border}`}>
                <div className={`w-7 h-7 rounded-full ${colors.num} flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>
                  {i + 1}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{t(key)}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Contact Support */}
        <Section title={t('settings.contactSupport')} icon={MdPhone}>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{t('settings.contactDesc')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: MdEmail,      label: 'Email',            value: 'msaada@energyquota.co.tz', color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
              { icon: MdPhone,      label: 'Simu / Phone',     value: '+255 700 000 000',         color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
              { icon: MdLocationOn, label: 'Mahali / Location', value: 'Dar es Salaam, Tanzania', color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex flex-col items-center text-center p-4
                bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-2.5`}>
                  <Icon size={18} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-900/40 flex items-start gap-3">
            <MdCheckCircle size={18} className="text-teal-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">
                {lang === 'sw' ? 'Masaa ya Kufanya Kazi' : 'Office Hours'}
              </p>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                {lang === 'sw'
                  ? 'Jumatatu – Ijumaa: 8:00 – 17:00 (EAT) · Jumamosi: 9:00 – 13:00'
                  : 'Mon – Fri: 8:00 AM – 5:00 PM (EAT) · Sat: 9:00 AM – 1:00 PM'}
              </p>
            </div>
          </div>
        </Section>
      </div>
    </Layout>
  );
};

export default SettingsPage;
