import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('eq-collapsed') === 'true'
  );
  const location = useLocation();

  const toggleCollapse = () => {
    setCollapsed(c => {
      localStorage.setItem('eq-collapsed', String(!c));
      return !c;
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-200">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`hidden lg:block fixed top-0 left-0 h-screen z-30 overflow-y-auto
          transition-[width] duration-300 ease-smooth
          ${collapsed ? 'w-[68px]' : 'w-64'}`}
      >
        <Sidebar isCollapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-30 lg:hidden w-64
          transform transition-transform duration-300 ease-smooth
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar isCollapsed={false} onToggleCollapse={() => {}} />
      </div>

      <div
        className={`flex flex-col min-h-screen w-full
          transition-[margin] duration-300 ease-smooth
          ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-64'}`}
      >
        <Navbar
          title={title}
          onMenuClick={() => setSidebarOpen(s => !s)}
        />
        <main key={location.pathname} className="flex-1 p-4 sm:p-6 overflow-auto main-content-enter">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
