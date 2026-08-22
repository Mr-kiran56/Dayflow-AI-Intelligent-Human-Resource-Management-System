import { api } from './api';
import { LeaveType, LeaveBalance, LeaveRequest, LeaveEligibilityResult, LeaveStatus } from '../types';

export const leaveService = {
  async getLeaveTypes(): Promise<LeaveType[]> {
    const res: any = await api.get('/leave/types');
    return res.data;
  },

  async getMyBalances(): Promise<LeaveBalance[]> {
    const res: any = await api.get('/leave/balances');
    return res.data;
  },

  async checkEligibility(payload: { leave_type_id: string; start_date: string; end_date: string }): Promise<LeaveEligibilityResult> {
    const res: any = await api.post('/leave/eligibility', payload);
    return res.data;
  },

  async createRequest(payload: { leave_type_id: string; start_date: string; end_date: string; remarks?: string }): Promise<LeaveRequest> {
    const res: any = await api.post('/leave/requests', payload);
    return res.data;
  },

  async getMyRequests(): Promise<LeaveRequest[]> {
    const res: any = await api.get('/leave/requests');
    return res.data;
  },

  async deleteRequest(requestId: string): Promise<void> {
    await api.delete(`/leave/requests/${requestId}`);
  },

  async adminGetRequests(params?: { status?: LeaveStatus; employee_id?: string }): Promise<LeaveRequest[]> {
    const res: any = await api.get('/admin/leave/requests', { params });
    return res.data;
  },

  async adminApproveRequest(requestId: string, comment?: string): Promise<LeaveRequest> {
    const res: any = await api.post(`/admin/leave/${requestId}/approve`, { comment });
    return res.data;
  },

  async adminRejectRequest(requestId: string, reviewer_comment: string): Promise<LeaveRequest> {
    const res: any = await api.post(`/admin/leave/${requestId}/reject`, { reviewer_comment });
    return res.data;
  },
};
