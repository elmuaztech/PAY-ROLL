import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calculator,
  Gift,
  MinusCircle,
  History,
  BarChart3,
  Settings,
  X,
  UtensilsCrossed
} from 'lucide-react';
import { usePayroll } from '../../context/PayrollContext';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activePage, setActivePage, employees, payrollPeriods } = usePayroll();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users, badge: employees.length },
    { id: 'payroll', label: 'Payroll', icon: Calculator },
    { id: 'allowances', label: 'Allowances', icon: Gift },
    { id: 'deductions', label: 'Deductions', icon: MinusCircle },
    { id: 'history', label: 'Payroll History', icon: History, badge: payrollPeriods.length },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActivePage(id);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-poly-navy text-slate-100">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-20 px-6 bg-slate-900/60 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-md font-bold text-xl">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight tracking-tight">MAIDUGURI RESTAURANT</h1>
            <p className="text-xs text-slate-400 font-medium">Payroll Portal</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Main Menu
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Footer Note */}
      <div className="p-4 m-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400">
        <p className="font-semibold text-slate-200">Maiduguri Restaurant Edition</p>
        <p className="text-[11px] mt-0.5">Computerized Payroll Management System</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed top-0 left-0 bottom-0 z-30 shadow-lg">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-4/5 max-w-xs bg-poly-navy h-full shadow-2xl z-10">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
