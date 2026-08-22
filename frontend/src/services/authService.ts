import { api } from './api';
import { UserProfile, Role } from '../types';

export interface SignupPayload {
  email: string;
  password: string;
  employee_id: string;
  full_name: string;
  role: Role;
  phone?: string;
  job_title?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponseData {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export const authService = {
  async signup(payload: SignupPayload): Promise<AuthResponseData> {
    const res: any = await api.post('/auth/signup', payload);
    return res.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponseData> {
    const res: any = await api.post('/auth/login', payload);
    return res.data;
  },

  async verifyEmail(email: string): Promise<void> {
    await api.post(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  },

  async getMe(): Promise<UserProfile> {
    const res: any = await api.get('/auth/me');
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('dayflow_token');
      localStorage.removeItem('dayflow_user');
    }
  },
};
