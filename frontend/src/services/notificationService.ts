import { api } from './api';
import { NotificationItem, SearchResultItem } from '../types';

export const notificationService = {
  async getMyNotifications(): Promise<NotificationItem[]> {
    const res: any = await api.get('/notifications');
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res: any = await api.get('/notifications/unread-count');
    return res.data.unread_count;
  },

  async markRead(id: string): Promise<NotificationItem> {
    const res: any = await api.post(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },

  async globalSearch(q: string): Promise<SearchResultItem[]> {
    const res: any = await api.get('/search', { params: { q } });
    return res.data.results;
  },
};
