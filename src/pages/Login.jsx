import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdBolt, MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdLightMode, MdDarkMode, MdLanguage } from 'react-icons/md';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';

const LANGS = ['en', 'sw', 'fr', 'zh'];
const roleRedirect = { admin: '/admin', owner: '/owner', tenant: '/tenant' };

const Login = () => {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showLangs, setShowLangs] = useState(false);

  const { login }            = useAuth();
  const { lang, setLang, t } = useLang();
  const { dark, toggle }     = useTheme();
  const navigate             = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate(roleRedirect[data.user.role] || '/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const langLabels = { en: 'EN', sw: 'SW', fr: 'FR', zh: '中' };

  return (
    <div className="min-h-screen bg-white
      flex items-center justify-center p-4 transition-colors duration-300">

      {/* Top-right controls */}
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

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl mb-4">
            <MdBolt size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-black">EnergyQuota</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Smart Tenant Electricity Management
          </p>
        </div>

        {/* Card */}
        <div className="bg-blue-900 rounded-2xl shadow-2xl p-8 text-white">
          <h2 className="text-xl font-semibold text-white mb-1">
            {t('login.welcomeBack')}
          </h2>
          <p className="text-sm text-gray-300 mb-6">
            {t('login.signInSub')}
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
              text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1.5">
                {t('login.emailLabel')}
              </label>
              <div className="relative">
                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input type="email" value={form.email} onChange={set('email')}
                  className="input-field !pl-12" placeholder="you@example.com"
                  required autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1.5">
                {t('login.passwordLabel')}
              </label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  className="input-field !pl-12 pr-10" placeholder="••••••••"
                  required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                  {showPwd ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 text-base">
              {loading ? <span className="spin" /> : null}
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-300 mt-6">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-teal-600 font-semibold hover:text-teal-700">
              {t('login.registerLink')}
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          {t('login.tenantNote')}
        </p>
      </div>
    </div>
  );
};

export default Login;
