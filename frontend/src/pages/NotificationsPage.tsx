import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Bell, CheckCheck, CheckCircle, Info, Calendar, CreditCard } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      await loadNotifications();
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      await loadNotifications();
    } catch (e) {
      console.error('Failed to mark all read', e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            System alerts, leave request approval status updates, and payroll notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-indigo-600" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle divide-y divide-slate-100">
        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Notifications"
            description="You have no notifications or system alerts at this time. All caught up!"
          />
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`py-4 px-3 flex items-start gap-4 transition-colors cursor-pointer rounded-xl ${
                !n.is_read ? 'bg-indigo-50/40 font-medium' : 'hover:bg-slate-50'
              }`}
            >
              <div className="p-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl shadow-subtle shrink-0 mt-0.5">
                {n.type.includes('LEAVE') ? (
                  <Calendar className="w-4 h-4 text-blue-600" />
                ) : n.type.includes('PAYROLL') ? (
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Info className="w-4 h-4 text-indigo-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
              </div>

              {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
