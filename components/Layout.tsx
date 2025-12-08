import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icons, TOOLS } from '../constants';
import { ToolCategory } from '../types';

const Layout: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Define category order
  const categoryOrder = [ToolCategory.ANALYSIS, ToolCategory.CONVERSION, ToolCategory.BASIC];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-30 w-64 h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">Q</div>
          <span className="text-xl font-bold tracking-tight">测试工具站</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
          >
            <Icons.Home className="w-5 h-5" />
            <span>首页</span>
          </NavLink>

          {categoryOrder.map((category) => {
             const categoryTools = TOOLS.filter(t => t.category === category);
             if (categoryTools.length === 0) return null;

             return (
               <div key={category} className="mt-6 first:mt-4">
                 <div className="px-3 mb-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                   {category}
                 </div>
                 <div className="space-y-1">
                   {categoryTools.map(tool => {
                     const Icon = Icons[tool.icon] || Icons.Code;
                     return (
                        <NavLink 
                          key={tool.id}
                          to={tool.path}
                          className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="truncate">{tool.name}</span>
                        </NavLink>
                     );
                   })}
                 </div>
               </div>
             );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
            <button 
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
                {darkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
                <span>{darkMode ? '浅色模式' : '深色模式'}</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
           <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <span className="font-bold">测试工具站</span>
           </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
            {/* Added h-full and flex-col to ensure children can expand to fill height */}
            <div className="max-w-6xl mx-auto h-full flex flex-col">
                 <Outlet />
            </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;