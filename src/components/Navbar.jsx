import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import {
  MdNotifications, MdMenu, MdLogout, MdExpandMore,
  MdSettings, MdBolt, MdPersonAdd, MdPersonRemove,
  MdElectricalServices, MdClose, MdDoneAll, MdDeleteSweep,
  MdLightMode, MdDarkMode, MdLanguage,
} from 'react-icons/md';

const LANGS = ['en', 'sw', 'fr', 'zh'];

const roleAvatar = {
  admin:  'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  owner:  'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  tenant: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
};

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
    case 'tenant_added':   return 'bg-emerald-50 dark:bg-emerald-900/30';
    case 'tenant_removed': return 'bg-red-50 dark:bg-red-900/30';
    case 'meter_approved': return 'bg-teal-50 dark:bg-teal-900/30';
    case 'meter_rejected': return 'bg-red-50 dark:bg-red-900/30';
    default:               return 'bg-amber-50 dark:bg-amber-900/30';
  }
};

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

const Navbar = ({ title, onMenuClick }) => {
  const [showNotifs, setShowNotifs]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLangs, setShowLangs]     = useState(false);
  const ref = useRef(null);

  const { user, logout }   = useAuth();
  const { lang, setLang, t } = useLang();
  const { dark, toggle }   = useTheme();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications() || {
    notifications: [], unreadCount: 0, markRead: () => {}, markAllRead: () => {}, clearAll: () => {},
  };
  const navigate = useNavigate();

  const initials  = (user?.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarCls = roleAvatar[user?.role] || roleAvatar.owner;

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) {
        setShowNotifs(false);
        setShowProfile(false);
        setShowLangs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const today = new Date().toLocaleDateString(
    lang === 'zh' ? 'zh-CN' : lang === 'fr' ? 'fr-FR' : lang === 'sw' ? 'sw-TZ' : 'en-US',
    { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }
  );

  const handleNotifClick = (n) => {
    markRead(n.id);
    if (n.link) navigate(n.link);
    setShowNotifs(false);
  };

  const langLabels = { en: 'EN', sw: 'SW', fr: 'FR', zh: '中' };

  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700
      px-4 lg:px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-all duration-300">

      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 active:scale-90"
        >
          <MdMenu size={22} />
        </button>
        <div className="animate-fade-in">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-tight">{title}</h2>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 hidden sm:block mt-0.5">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-1" ref={ref}>

        <button
          onClick={toggle}
          title={t('theme.toggle')}
          className="p-2 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400
            hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-xl transition-all duration-200 active:scale-90"
        >
          {dark ? <MdLightMode size={19} /> : <MdDarkMode size={19} />}
        </button>

        <div className="relative">
          <button
            onClick={() => { setShowLangs(v => !v); setShowNotifs(false); setShowProfile(false); }}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold
              text-gray-500 dark:text-slate-400
              hover:text-teal-600 dark:hover:text-teal-400
              hover:bg-teal-50 dark:hover:bg-teal-900/30
              rounded-xl border border-gray-200 dark:border-slate-600 transition-all duration-200 active:scale-95"
          >
            <MdLanguage size={13} />
            {langLabels[lang] || 'EN'}
          </button>

          {showLangs && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800
              rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 py-1.5 animate-fade-scale origin-top-right">
              {LANGS.map(l => (
                <button
                  key={l}
                  onClick={() => { setLang(l); setShowLangs(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between
                    ${lang === l
                      ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-semibold'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                  {t(`lang.${l}`)}
                  {lang === l && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowNotifs(v => !v); setShowProfile(false); setShowLangs(false); }}
            className="relative p-2 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400
              hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-xl transition-all duration-200 active:scale-90"
          >
            <MdNotifications size={21} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white
                text-[9px] font-bold rounded-full flex items-center justify-center animate-fade-scale">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 bg-white dark:bg-slate-800
              rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700
              overflow-hidden z-50 animate-fade-scale origin-top-right" style={{ width: '340px' }}>

              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700
                bg-gray-50 dark:bg-slate-700/50">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <MdBolt size={14} className="text-yellow-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                      {t('misc.notifications')}
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                      bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300
                      hover:bg-teal-200 dark:hover:bg-teal-900/60
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <MdDoneAll size={13} /> {t('misc.markAllRead')}
                  </button>
                  <button
                    onClick={clearAll}
                    disabled={notifications.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                      bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400
                      hover:bg-red-200 dark:hover:bg-red-900/60
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <MdDeleteSweep size={13} /> {t('misc.clearAll')}
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center py-10">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3">
                      <MdNotifications size={22} className="text-gray-300 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{t('misc.allCaughtUp')}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{t('misc.noNotifs')}</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} onClick={() => handleNotifClick(n)}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer
                        ${!n.read ? 'bg-teal-50/30 dark:bg-teal-900/10' : ''}`}>
                      <div className="flex gap-3 items-start">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${!n.read ? 'bg-teal-500' : 'bg-gray-200 dark:bg-slate-600'}`} />
                        <div className={`w-8 h-8 rounded-xl ${typeBg(n.type)} flex items-center justify-center flex-shrink-0`}>
                          {typeIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${!n.read ? 'text-gray-800 dark:text-slate-200 font-medium' : 'text-gray-600 dark:text-slate-400'}`}>
                            {n.message}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotifs(false); setShowLangs(false); }}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl
              hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 active:scale-95 ml-1
              border border-transparent hover:border-gray-200 dark:hover:border-slate-600"
          >
            <div className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center flex-shrink-0 ${avatarCls} transition-transform duration-200 hover:scale-105`}>
              {initials}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 leading-tight max-w-[110px] truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 capitalize">{user?.role}</p>
            </div>
            <MdExpandMore size={15} className="text-gray-400 hidden sm:block flex-shrink-0 transition-transform duration-200" style={{ transform: showProfile ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800
              rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-fade-scale origin-top-right">
              <div className="px-4 py-3.5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-700 border-b border-gray-100 dark:border-slate-600">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center ${avatarCls}`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold capitalize mt-2 inline-block px-2 py-0.5 rounded-full ${avatarCls}`}>
                  {user?.role}
                </span>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { navigate(`/${user?.role}/settings`); setShowProfile(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm
                    text-gray-600 dark:text-slate-300
                    hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <MdSettings size={15} className="text-gray-400" />
                  {t('nav.settings')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600
                    hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <MdLogout size={15} />
                  {t('nav.signOut')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;


