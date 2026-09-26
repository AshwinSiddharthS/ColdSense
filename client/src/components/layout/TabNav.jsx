import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Radio, Bell, FileText, ShieldCheck,
  ChevronLeft, ChevronRight, LogOut, Thermometer, User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const navItems = [
  { path: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { path: '/shipments',  label: 'Shipments',  icon: Truck },
  { path: '/devices',    label: 'Devices',    icon: Radio },
  { path: '/alerts',     label: 'Alerts',     icon: Bell },
  { path: '/reports',    label: 'Reports',    icon: FileText },
  { path: '/audit-log',  label: 'Audit Log',  icon: ShieldCheck },
];

export default function TabNav() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={`
        relative hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0
        bg-[#0d1629] border-r border-white/8 transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[68px]' : 'w-[240px]'}
      `}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8 overflow-hidden">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
          <Thermometer className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="fade-in overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight whitespace-nowrap">Cold Chain</p>
            <p className="text-[10px] text-slate-400 whitespace-nowrap">Monitor v1.0</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative
                    ${isActive
                      ? 'bg-blue-600/20 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/6'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      {!collapsed && (
                        <span className="fade-in whitespace-nowrap">{item.label}</span>
                      )}
                      {isActive && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 rounded-l-full" />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      <div className="px-3 pb-4 border-t border-white/8 pt-4 space-y-2">
        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4 fade-in">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name ?? 'Guest'}</p>
              <p className="text-[10px] text-slate-500 capitalize truncate">{user?.role}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-colors text-sm font-medium ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="fade-in">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1a2744] border border-white/12 text-slate-400 hover:text-white hover:border-blue-500/40 flex items-center justify-center shadow-md transition-all z-10"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
