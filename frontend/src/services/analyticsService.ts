import { api } from './api';

export const analyticsService = {
  async getMyAttendanceAnalytics(): Promise<any> {
    const res: any = await api.get('/analytics/me/attendance');
    return res.data;
  },

  async getMyLeaveAnalytics(): Promise<any> {
    const res: any = await api.get('/analytics/me/leave');
    return res.data;
  },

  async getAdminOverview(): Promise<any> {
    const res: any = await api.get('/admin/analytics/overview');
    return res.data;
  },

  async getAdminAttendanceAnalytics(): Promise<any> {
    const res: any = await api.get('/admin/analytics/attendance');
    return res.data;
  },

  async getAdminLeaveAnalytics(): Promise<any> {
    const res: any = await api.get('/admin/analytics/leave');
    return res.data;
  },

  async getAdminPayrollAnalytics(): Promise<any> {
    const res: any = await api.get('/admin/analytics/payroll');
    return res.data;
  },
};
