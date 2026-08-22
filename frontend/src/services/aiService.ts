import { api } from './api';

export const aiService = {
  async chat(message: string): Promise<{ answer: string; context_used?: any }> {
    const res: any = await api.post('/ai/chat', { message });
    return res.data;
  },

  async getAttendanceInsight(): Promise<{ summary: any; insight_text: string }> {
    const res: any = await api.post('/ai/attendance-insight', {});
    return res.data;
  },

  async explainLeaveCheck(leave_type_id: string, start_date: string, end_date: string): Promise<{ eligibility: any; explanation: string }> {
    const res: any = await api.post('/ai/leave-check', { leave_type_id, start_date, end_date });
    return res.data;
  },

  async explainSalary(payroll_id?: string): Promise<{ payroll_record: any; explanation: string }> {
    const res: any = await api.post('/ai/salary-explanation', { payroll_id });
    return res.data;
  },

  async adminWorkforceSummary(): Promise<{ context_data: any; executive_summary: string }> {
    const res: any = await api.post('/admin/ai/workforce-summary', {});
    return res.data;
  },
};
