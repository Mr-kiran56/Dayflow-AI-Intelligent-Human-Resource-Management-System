import { api } from './api';
import { PayrollRecord } from '../types';

export const payrollService = {
  async getMyPayroll(): Promise<PayrollRecord | null> {
    const res: any = await api.get('/payroll/me');
    return res.data;
  },

  async getMyPayrollHistory(): Promise<PayrollRecord[]> {
    const res: any = await api.get('/payroll/me/history');
    return res.data;
  },

  async adminGetAllPayroll(): Promise<PayrollRecord[]> {
    const res: any = await api.get('/admin/payroll');
    return res.data;
  },

  async adminCreatePayroll(payload: {
    employee_id: string;
    payroll_month: string;
    basic_salary: number;
    hra: number;
    allowances: number;
    deductions: number;
    currency?: string;
  }): Promise<PayrollRecord> {
    const res: any = await api.post('/admin/payroll', payload);
    return res.data;
  },

  async adminUpdatePayroll(payrollId: string, payload: Partial<PayrollRecord>): Promise<PayrollRecord> {
    const res: any = await api.patch(`/admin/payroll/${payrollId}`, payload);
    return res.data;
  },
};
