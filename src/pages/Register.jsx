import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdBolt, MdPerson, MdEmail, MdLock, MdCheckCircle, MdLightMode, MdDarkMode, MdLanguage } from 'react-icons/md';
import api from '../api/axios';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';

const LANGS = ['en', 'sw', 'fr', 'zh'];

const Register = () => {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [showLangs, setShowLangs] = useState(false);

  const { lang, setLang, t } = useLang();
  const { dark, toggle }     = useTheme();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError(t('register.pwdMin'));
    if (form.password !== form.confirm) return setError(t('register.pwdMismatch'));

    setLoading(true);
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const langLabels = { en: 'EN', sw: 'SW', fr: 'FR', zh: '中' };

  const TopControls = () => (
    <div className="fixed top-4 right-4 flex items-center gap-2 z-20">
      <button onClick={toggle} title={t('theme.toggle')}
        className="w-9 h-9 rounded-xl bg-gray-200 hover:bg-gray-300 text-black
          flex items-center justify-center transition-all">
        {dark ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
      </button>
      <div className="relative">
        <button onClick={() => setShowLangs(v => !v)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-gray-200
            hover:bg-gray-300 text-black text-xs font-bold transition-all">
          <MdLanguage size={14} /> {langLabels[lang]}
        </button>
        {showLangs && (
          <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-2xl
            shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden py-1.5 z-30">
            {LANGS.map(l => (
              <button key={l} onClick={() => { setLang(l); setShowLangs(false); }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between
                  ${lang === l
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-semibold'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                {t(`lang.${l}`)}
                {lang === l && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const bgClass = "min-h-screen bg-white flex items-center justify-center p-4 transition-colors duration-300";

  if (success) {
    return (
      <div className={bgClass}>
        <TopControls />
        <div className="bg-blue-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center text-white">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <MdCheckCircle size={44} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('register.successTitle')}</h2>
          <p className="text-gray-300 text-sm mb-6">{t('register.successMsg')}</p>
          <Link to="/login" className="btn-primary">{t('register.backToLogin')}</Link>
        </div>
      </div>
    );
  }

  const fields = [
    { label: t('register.fullName'),    key: 'name',    type: 'text',     icon: MdPerson, placeholder: 'John Doe' },
    { label: t('register.email'),       key: 'email',   type: 'email',    icon: MdEmail,  placeholder: 'you@example.com' },
    { label: t('register.password'),    key: 'password',type: 'password', icon: MdLock,   placeholder: '••••••••' },
    { label: t('register.confirm'),     key: 'confirm', type: 'password', icon: MdLock,   placeholder: '••••••••' },
  ];

  return (
    <div className={bgClass}>
      <TopControls />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl mb-4">
            <MdBolt size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-black">EnergyQuota</h1>
          <p className="text-gray-600 mt-1 text-sm">{t('register.subTitle')}</p>
        </div>

        <div className="bg-blue-900 rounded-2xl shadow-2xl p-8 text-white">
          <h2 className="text-xl font-semibold text-white mb-1">{t('register.title')}</h2>
          <p className="text-sm text-gray-300 mb-6">{t('register.sub')}</p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
              text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ label, key, type, icon: Icon, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-200 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input type={type} value={form[key]} onChange={set(key)}
                    className="input-field !pl-12" placeholder={placeholder} required />
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 text-base">
              {loading ? <span className="spin" /> : null}
              {loading ? t('register.submitting') : t('register.submit')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-300 mt-6">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-700">
              {t('register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
