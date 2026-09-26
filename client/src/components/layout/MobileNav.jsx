import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Truck, Radio, Bell, FileText } from 'lucide-react';

const mobileNav = [
  { path: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { path: '/shipments', label: 'Shipments', icon: Truck },
  { path: '/devices',   label: 'Devices',   icon: Radio },
  { path: '/alerts',    label: 'Alerts',    icon: Bell },
  { path: '/reports',   label: 'Reports',   icon: FileText },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1629]/95 backdrop-blur-xl border-t border-white/8">
      <ul className="flex items-center justify-around px-2 py-2">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-medium transition-colors
                  ${isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
