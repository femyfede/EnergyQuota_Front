import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import {
  MdDashboard, MdPeople, MdElectricalServices, MdLogout,
  MdBolt, MdChevronLeft, MdChevronRight,
  MdBarChart, MdSettings, MdVerifiedUser, MdApartment,
} from 'react-icons/md';

const buildLinks = (role, t) => ({
  admin: [
    { to: '/admin',          icon: MdDashboard,    label: t('nav.dashboard'),  exact: true },
    { to: '/admin/owners',   icon: MdVerifiedUser, label: t('nav.owners'),     exact: false },
    { to: '/admin/tenants',  icon: MdApartment,    label: t('nav.tenants'),    exact: false },
    { to: '/admin/meters',   icon: MdElectricalServices, label: 'Meters', exact: false },
    { to: '/admin/reports',  icon: MdBarChart,     label: t('nav.reports'),    exact: false },
    { to: '/admin/settings', icon: MdSettings,     label: t('nav.settings'),   exact: false },
  ],
  owner: [
    { to: '/owner',                icon: MdDashboard,          label: t('nav.dashboard'),     exact: true },
    { to: '/owner/tenants',        icon: MdPeople,             label: t('nav.tenants'),       exact: false },
    { to: '/owner/meter-requests', icon: MdElectricalServices, label: t('nav.meterRequests'), exact: false },
    { to: '/owner/meters',         icon: MdElectricalServices, label: 'Meters',               exact: false },
    { to: '/owner/reports',        icon: MdBarChart,           label: t('nav.reports'),       exact: false },
    { to: '/owner/settings',       icon: MdSettings,           label: t('nav.settings'),      exact: false },
  ],
  tenant: [
    { to: '/tenant',               icon: MdDashboard,          label: t('nav.dashboard'),  exact: true },
    { to: '/tenant/meter-request', icon: MdElectricalServices, label: t('nav.myMeter'),    exact: false },
    { to: '/tenant/reports',       icon: MdBarChart,           label: t('nav.reports'),    exact: false },
    { to: '/tenant/settings',      icon: MdSettings,           label: t('nav.settings'),   exact: false },
  ],
}[role] || []);

const roleStyle = {
  admin: {
    avatarBg:     'bg-teal-600',
    badge:        'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
    activeBg:     'bg-teal-50 dark:bg-teal-900/20',
    activeBorder: 'border-l-[3px] border-teal-500',
    activeText:   'text-teal-700 dark:text-teal-400',
    logoRing:     'bg-teal-600',
    dot:          'bg-emerald-400',
  },
  owner: {
    avatarBg:     'bg-teal-600',
    badge:        'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
    activeBg:     'bg-teal-50 dark:bg-teal-900/20',
    activeBorder: 'border-l-[3px] border-teal-500',
    activeText:   'text-teal-700 dark:text-teal-400',
    logoRing:     'bg-teal-600',
    dot:          'bg-emerald-400',
  },
  tenant: {
    avatarBg:     'bg-emerald-600',
    badge:        'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    activeBg:     'bg-emerald-50 dark:bg-emerald-900/20',
    activeBorder: 'border-l-[3px] border-emerald-500',
    activeText:   'text-emerald-700 dark:text-emerald-400',
    logoRing:     'bg-emerald-600',
    dot:          'bg-emerald-400',
  },
};

const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const s = roleStyle[user?.role] || roleStyle.owner;
  const links = buildLinks(user?.role, t);
  const initials = (user?.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const portalKey = `${user?.role}Portal`;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700
      h-full min-h-screen flex flex-col transition-[width] duration-300 ease-smooth overflow-hidden shadow-sm
      ${isCollapsed ? 'w-[68px]' : 'w-64'}`}
    >
      <div className={`flex items-center justify-between border-b border-gray-100 dark:border-slate-700 h-14 flex-shrink-0
        ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
          <div className={`w-8 h-8 rounded-xl ${s.logoRing} flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 hover:scale-105`}>
            <MdBolt size={17} className="text-white" />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-smooth ${isCollapsed ? 'opacity-0 w-0 max-w-0' : 'opacity-100 max-w-[180px]'}`}>
            <p className="font-bold text-gray-900 dark:text-slate-100 text-[13px] leading-tight truncate">EnergyQuota</p>
            <p className="text-gray-400 dark:text-slate-500 text-[10px] capitalize tracking-wide truncate">{t(portalKey)}</p>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? t('nav.navigation') : 'Collapse'}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
            text-gray-400 hover:text-gray-700 dark:hover:text-slate-200
            hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200 hover:rotate-180"
        >
          {isCollapsed ? <MdChevronRight size={15} /> : <MdChevronLeft size={15} />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>
          <p className="text-gray-400 dark:text-slate-600 text-[9px] font-bold uppercase tracking-widest px-3 pb-1.5 pt-1">
            {t('nav.navigation')}
          </p>
        </div>
        {links.map(({ to, icon: Icon, label, exact }, i) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            title={isCollapsed ? label : undefined}
            style={{ animationDelay: `${i * 40}ms` }}
            className={({ isActive }) =>
              `sidebar-nav-item flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200 animate-stagger-in
              ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}
              ${isActive
                ? `active ${s.activeBg} ${s.activeBorder} ${s.activeText}`
                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Icon size={17} className="nav-icon flex-shrink-0" />
            <span className={`nav-label truncate transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 max-w-0' : 'opacity-100 max-w-[180px]'}`}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-gray-100 dark:border-slate-700 flex-shrink-0">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div title={user?.name}
              className={`w-9 h-9 rounded-xl ${s.avatarBg} flex items-center justify-center
                font-bold text-white text-sm shadow cursor-default transition-transform duration-200 hover:scale-105`}>
              {initials}
            </div>
            <button
              onClick={handleLogout}
              title={t('nav.signOut')}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-slate-500
                hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
            >
              <MdLogout size={14} />
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl ${s.avatarBg} flex items-center justify-center
                font-bold text-white text-sm flex-shrink-0 shadow transition-transform duration-200 hover:scale-105`}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-900 dark:text-slate-100 text-[13px] font-semibold leading-tight truncate">{user?.name}</p>
                <p className="text-gray-400 dark:text-slate-500 text-[10px] truncate mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title={t('nav.signOut')}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-slate-500
                  hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex-shrink-0"
              >
                <MdLogout size={15} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${s.badge}`}>
                {user?.role}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500">
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse-soft`} />
                {t('misc.online')}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
