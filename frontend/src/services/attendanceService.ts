import { api } from './api';
import { AttendanceRecord, AttendanceSummary, AttendanceStatus } from '../types';

export const attendanceService = {
  async checkIn(notes?: string): Promise<AttendanceRecord> {
    const res: any = await api.post('/attendance/check-in', { notes });
    return res.data;
  },

  async checkOut(notes?: string): Promise<AttendanceRecord> {
    const res: any = await api.post('/attendance/check-out', { notes });
    return res.data;
  },

  async getMyAttendance(params?: { start_date?: string; end_date?: string }): Promise<AttendanceRecord[]> {
    const res: any = await api.get('/attendance/me', { params });
    return res.data;
  },

  async getDailyAttendance(): Promise<AttendanceRecord | null> {
    const res: any = await api.get('/attendance/me/daily');
    return res.data;
  },

  async getWeeklyAttendance(): Promise<AttendanceSummary> {
    const res: any = await api.get('/attendance/me/weekly');
    return res.data;
  },

  async adminGetAllAttendance(params?: { employee_id?: string; attendance_date?: string; status?: AttendanceStatus }): Promise<AttendanceRecord[]> {
    const res: any = await api.get('/admin/attendance', { params });
    return res.data;
  },
};
