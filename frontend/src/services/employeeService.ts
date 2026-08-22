import { api } from './api';
import { UserProfile, Role } from '../types';

export const employeeService = {
  async getMyProfile(): Promise<UserProfile> {
    const res: any = await api.get('/profile/me');
    return res.data;
  },

  async updateMyProfile(payload: { phone?: string; address?: string; profile_picture_url?: string }): Promise<UserProfile> {
    const res: any = await api.patch('/profile/me', payload);
    return res.data;
  },

  async listEmployees(params?: { department_id?: string; role?: Role; search?: string }): Promise<UserProfile[]> {
    const res: any = await api.get('/employees', { params });
    return res.data;
  },

  async getEmployeeById(employeeId: string): Promise<UserProfile> {
    const res: any = await api.get(`/employees/${employeeId}`);
    return res.data;
  },

  async updateEmployee(employeeId: string, payload: Partial<UserProfile>): Promise<UserProfile> {
    const res: any = await api.patch(`/employees/${employeeId}`, payload);
    return res.data;
  },
};
