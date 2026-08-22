export type Role = 'ADMIN' | 'HR' | 'EMPLOYEE';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ComponentType = 'EARNING' | 'DEDUCTION';

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  auth_user_id: string;
  employee_id: string;
  role: Role;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  profile_picture_url?: string;
  department_id?: string;
  department?: Department;
  job_title?: string;
  manager_id?: string;
  joined_date?: string;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in?: string;
  check_out?: string;
  status: AttendanceStatus;
  total_work_minutes?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  half_days: number;
  total_work_hours: number;
  records: AttendanceRecord[];
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description?: string;
  default_days_per_year: number;
  is_paid: boolean;
  is_active: boolean;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  leave_type?: LeaveType;
  year: number;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  leave_type?: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  remarks?: string;
  status: LeaveStatus;
  reviewer_id?: string;
  reviewer_comment?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveEligibilityResult {
  eligible: boolean;
  requested_days: number;
  remaining_days: number;
  remaining_after_request: number;
  reason: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  payroll_month: string;
  basic_salary: number;
  hra: number;
  allowances: number;
  deductions: number;
  gross_salary: number;
  net_salary: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface SearchResultItem {
  type: 'employee' | 'leave_request' | 'attendance';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}
