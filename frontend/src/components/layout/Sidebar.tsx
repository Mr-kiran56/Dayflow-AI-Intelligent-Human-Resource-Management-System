import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  BarChart3,
  Sparkles,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../services/leaveService';
import { notificationService } from '../../services/notificationService';
import { BrandLogo } from '../ui/BrandLogo';

export const Sidebar: React.FC<{ mobileOpen: boolean; setMobileOpen: (val: boolean) => void }> = ({
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, logout, isAdminOrHr } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (isAdminOrHr) {
      leaveService
        .adminGetRequests({ status: 'PENDING' })
        .then((reqs) => setPendingCount(reqs.length))
        .catch(() => setPendingCount(0));
    }
    notificationService
      .getUnreadCount()
      .then(setUnreadCount)
      .catch(() => setUnreadCount(0));
  }, [isAdminOrHr]);

  const navItems = [
    {
      name: isAdminOrHr ? 'Workforce Command' : 'My Day',
      path: isAdminOrHr ? '/admin/dashboard' : '/dashboard',
      icon: LayoutDashboard,
      badge: isAdminOrHr && pendingCount > 0 ? `${pendingCount} REQ` : undefined,
      badgeColor: 'bg-amber-500 text-white animate-pulse',
      hasSignalDot: isAdminOrHr && pendingCount > 0,
    },
    ...(isAdminOrHr ? [{ name: 'Employees', path: '/employees', icon: Users }] : []),
    { name: 'Attendance', path: '/attendance', icon: Clock },
    {
      name: 'Leave & Time-Off',
      path: '/leave',
      icon: CalendarDays,
      badge: isAdminOrHr && pendingCount > 0 ? `${pendingCount}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { name: 'Payroll', path: '/payroll', icon: CreditCard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    {
      name: 'DayFlow AI',
      path: '/ai',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-ai-100 text-ai-700',
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? `${unreadCount}` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
            <div className="overflow-hidden">
              {collapsed ? (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-ai-500 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                  DF
                </div>
              ) : (
                <BrandLogo size="sm" showSubtitle />
              )}
            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === '/admin/dashboard' && location.pathname === '/dashboard' && isAdminOrHr);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all relative ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-subtle'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <div className="relative shrink-0">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    {item.hasSignalDot && (
                      <>
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white animate-ping" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white" />
                      </>
                    )}
                  </div>

                  {!collapsed && <span className="truncate flex-1">{item.name}</span>}

                  {!collapsed && item.badge && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor || 'bg-brand-100 text-brand-700'}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-ai-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-slate-900 truncate">{user?.full_name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 truncate">{user?.employee_id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase bg-brand-100 text-brand-700">
                      {user?.role}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              aria-label="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
