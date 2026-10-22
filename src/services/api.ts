import {
  User,
  Role,
  Permission,
  ClassInfo,
  Transaction,
  TransactionCategory,
  Bill,
  Payment,
  EventItem,
  Announcement,
  Meeting,
  TaskItem,
  DocumentItem,
  Poll,
  AttendanceRecord,
  NotificationItem,
  AuditLog,
  FinanceSummary,
  CourseSyllabus,
  WebhookConfig,
  WebhookLog,
  PaymentGatewayConfig,
  RoleClaimRequest,
  KasCollectionColumn,
  KasChecklistEntry,
} from '../types/index.ts';
import { handleClientFallback } from './clientFallback.ts';

class ApiService {
  private currentUserId: string = 'usr_member_01';

  setUserId(id: string) {
    this.currentUserId = id;
    localStorage.setItem('cms_user_id', id);
  }

  getUserId(): string {
    if (!this.currentUserId) {
      this.currentUserId = localStorage.getItem('cms_user_id') || 'usr_member_01';
    }
    return this.currentUserId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `/api${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': this.getUserId(),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // If endpoint not found (e.g. static hosting on Vercel without Express backend)
      // or server returns HTML instead of JSON
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || contentType.includes('text/html')) {
        return await handleClientFallback<T>(endpoint, options);
      }

      return await response.json();
    } catch {
      // Fallback seamlessly on connection errors or Vercel static environment
      return await handleClientFallback<T>(endpoint, options);
    }
  }

  // Auth & Profiles
  async getMe(): Promise<{ user: User; role: Role; permissions: string[]; classInfo: ClassInfo }> {
    return this.request('/auth/me');
  }

  async googleLogin(payload: {
    email: string;
    displayName: string | null;
    photoURL: string | null;
    uid: string;
  }): Promise<{
    success: boolean;
    user?: User;
    role?: Role;
    permissions?: string[];
    classInfo?: ClassInfo;
    requiresClaim?: boolean;
    isPendingApproval?: boolean;
    isApproved?: boolean;
    claimRequest?: RoleClaimRequest;
  }> {
    const res = await this.request<{
      success: boolean;
      user?: User;
      role?: Role;
      permissions?: string[];
      classInfo?: ClassInfo;
      requiresClaim?: boolean;
      isPendingApproval?: boolean;
      isApproved?: boolean;
      claimRequest?: RoleClaimRequest;
    }>('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.user) {
      this.setUserId(res.user.id);
    }
    return res;
  }

  async claimRole(payload: {
    google_email: string;
    google_name: string;
    google_avatar: string;
    google_uid: string;
    requested_user_id: string;
    requested_role_id: string;
    notes?: string;
    pro_code?: string;
  }): Promise<{ success: boolean; claimRequest: RoleClaimRequest; autoApproved?: boolean; user?: User; role?: Role }> {
    return this.request('/auth/claim-role', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getRoleClaimRequests(): Promise<RoleClaimRequest[]> {
    return this.request('/auth/claim-requests');
  }

  async approveRoleClaim(
    claimId: string,
    roleId?: string
  ): Promise<{ success: boolean; claim: RoleClaimRequest; user: User }> {
    return this.request(`/auth/claim-requests/${claimId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ role_id: roleId }),
    });
  }

  async rejectRoleClaim(
    claimId: string,
    reason?: string
  ): Promise<{ success: boolean; claim: RoleClaimRequest }> {
    return this.request(`/auth/claim-requests/${claimId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async assignUserRole(userId: string, roleId: string): Promise<{ success: boolean; user: User; role: Role }> {
    return this.request('/auth/assign-role', {
      method: 'POST',
      body: JSON.stringify({ userId, roleId }),
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.request('/auth/users');
  }

  async switchUser(userId: string): Promise<{ success: boolean; user: User; role: Role }> {
    this.setUserId(userId);
    return this.request('/auth/switch', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Class Info
  async getClassInfo(): Promise<ClassInfo> {
    return this.request('/class');
  }

  async updateClassInfo(data: Partial<ClassInfo>): Promise<ClassInfo> {
    return this.request('/class', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Members
  async getMembers(params?: { search?: string; role?: string; status?: string }): Promise<User[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/members${query ? `?${query}` : ''}`);
  }

  async createMember(data: any): Promise<User> {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMember(id: string, data: any): Promise<User> {
    return this.request(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async assignRole(userId: string, roleId: string): Promise<User> {
    return this.request(`/members/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ role_id: roleId }),
    });
  }

  async deactivateMember(id: string): Promise<{ success: boolean }> {
    return this.request(`/members/${id}`, { method: 'DELETE' });
  }

  // Roles & Permissions
  async getRoles(): Promise<Role[]> {
    return this.request('/roles');
  }

  async getPermissions(): Promise<Permission[]> {
    return this.request('/permissions');
  }

  async createRole(data: { name: string; description: string; permissions: string[] }): Promise<Role> {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    return this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateRolePermissions(id: string, permissions: string[]): Promise<Role> {
    return this.request(`/roles/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  // Finance
  async getFinanceSummary(): Promise<FinanceSummary> {
    return this.request('/finance/summary');
  }

  async getTransactions(params?: { type?: string; category?: string; date_from?: string; date_to?: string }): Promise<Transaction[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/finance/transactions${query ? `?${query}` : ''}`);
  }

  async getCategories(): Promise<TransactionCategory[]> {
    return this.request('/finance/categories');
  }

  async createTransaction(data: any): Promise<Transaction> {
    return this.request('/finance/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: string, data: any): Promise<Transaction> {
    return this.request(`/finance/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string): Promise<{ success: boolean }> {
    return this.request(`/finance/transactions/${id}`, { method: 'DELETE' });
  }

  // Bills & Payments
  async getBills(): Promise<Bill[]> {
    return this.request('/finance/bills');
  }

  async createBill(data: { title: string; description?: string; amount: number; due_date?: string; period?: string }): Promise<Bill> {
    return this.request('/finance/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPayments(params?: { bill_id?: string; user_id?: string }): Promise<Payment[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/finance/payments${query ? `?${query}` : ''}`);
  }

  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment> {
    return this.request(`/finance/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Agenda
  async getEvents(): Promise<EventItem[]> {
    return this.request('/agenda');
  }

  async createEvent(data: Partial<EventItem>): Promise<EventItem> {
    return this.request('/agenda', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string): Promise<{ success: boolean }> {
    return this.request(`/agenda/${id}`, { method: 'DELETE' });
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    return this.request('/announcements');
  }

  async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    return this.request('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    return this.request(`/announcements/${id}`, { method: 'DELETE' });
  }

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    return this.request('/meetings');
  }

  async createMeeting(data: Partial<Meeting>): Promise<Meeting> {
    return this.request('/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMeetingMinutes(id: string, data: any): Promise<Meeting> {
    return this.request(`/meetings/${id}/minutes`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMeeting(id: string): Promise<{ success: boolean }> {
    return this.request(`/meetings/${id}`, { method: 'DELETE' });
  }

  // Tasks
  async getTasks(): Promise<TaskItem[]> {
    return this.request('/tasks');
  }

  async createTask(data: Partial<TaskItem>): Promise<TaskItem> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: Partial<TaskItem>): Promise<TaskItem> {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<{ success: boolean }> {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  // Courses & Assignments
  async getCourses(): Promise<any[]> {
    return this.request('/courses');
  }

  async createCourse(data: any): Promise<any> {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(id: string, data: any): Promise<any> {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: string): Promise<{ success: boolean }> {
    return this.request(`/courses/${id}`, { method: 'DELETE' });
  }

  async getAssignments(): Promise<any[]> {
    return this.request('/assignments');
  }

  async createAssignment(data: any): Promise<any> {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(id: string): Promise<{ success: boolean }> {
    return this.request(`/assignments/${id}`, { method: 'DELETE' });
  }

  async getAssignmentSubmissions(id: string): Promise<any[]> {
    return this.request(`/assignments/${id}/submissions`);
  }

  async submitAssignment(id: string, data: { submission_url: string; notes?: string }): Promise<{ success: boolean; submission: any }> {
    return this.request(`/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    return this.request('/documents');
  }

  async createDocument(data: Partial<DocumentItem>): Promise<DocumentItem> {
    return this.request('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    return this.request(`/documents/${id}`, { method: 'DELETE' });
  }

  // Polls
  async getPolls(): Promise<Poll[]> {
    return this.request('/polls');
  }

  async createPoll(data: { question: string; description?: string; options: string[]; deadline?: string; is_anonymous?: boolean }): Promise<Poll> {
    return this.request('/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async votePoll(pollId: string, optionId: string): Promise<{ success: boolean; poll: Poll }> {
    return this.request(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ option_id: optionId }),
    });
  }

  // Attendance
  async getAttendance(): Promise<AttendanceRecord[]> {
    return this.request('/attendance');
  }

  async recordAttendance(data: { title: string; date?: string; records: any[] }): Promise<{ success: boolean }> {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request('/notifications');
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/notifications/${id}/read`, { method: 'POST' });
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request('/audit-logs');
  }

  // Arrears Report
  async getArrearsReport(): Promise<Payment[]> {
    return this.request('/reports/arrears');
  }

  // System Backup
  async getSystemBackup(): Promise<any> {
    return this.request('/system/backup');
  }

  // Course Syllabus & RPS
  async getCourseSyllabus(courseId: string): Promise<CourseSyllabus> {
    return this.request(`/courses/${courseId}/syllabus`);
  }

  async updateCourseSyllabus(courseId: string, data: Partial<CourseSyllabus>): Promise<{ success: boolean; syllabus: CourseSyllabus }> {
    return this.request(`/courses/${courseId}/syllabus`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Webhooks & Bot
  async getWebhookConfig(): Promise<{ config: WebhookConfig; logs: WebhookLog[] }> {
    return this.request('/webhooks/config');
  }

  async updateWebhookConfig(data: Partial<WebhookConfig>): Promise<{ success: boolean; config: WebhookConfig }> {
    return this.request('/webhooks/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async testWebhook(message?: string, target?: string): Promise<{ success: boolean; log: WebhookLog }> {
    return this.request('/webhooks/test', {
      method: 'POST',
      body: JSON.stringify({ message, target }),
    });
  }

  async triggerBotReminder(): Promise<{ success: boolean; triggeredCount: number; remindersSent: string[]; logs: WebhookLog[] }> {
    return this.request('/webhooks/trigger-reminder', {
      method: 'POST',
    });
  }

  // Payment Gateway
  async getPaymentGatewayConfig(): Promise<PaymentGatewayConfig> {
    return this.request('/payments/config');
  }

  async updatePaymentGatewayConfig(data: Partial<PaymentGatewayConfig>): Promise<{ success: boolean; config: PaymentGatewayConfig }> {
    return this.request('/payments/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async generateVirtualAccount(bill_id: string, bank: string): Promise<any> {
    return this.request('/payments/generate-va', {
      method: 'POST',
      body: JSON.stringify({ bill_id, bank }),
    });
  }

  async generateQRIS(bill_id: string): Promise<any> {
    return this.request('/payments/generate-qris', {
      method: 'POST',
      body: JSON.stringify({ bill_id }),
    });
  }

  async simulatePaymentGatewayWebhook(bill_id: string, payment_method: string, user_id?: string): Promise<any> {
    return this.request('/payments/webhook-simulate', {
      method: 'POST',
      body: JSON.stringify({ bill_id, payment_method, user_id }),
    });
  }

  // Kas Table (Checklist 1 - 39)
  async getKasTable(): Promise<{
    columns: KasCollectionColumn[];
    entries: KasChecklistEntry[];
    students: User[];
  }> {
    return this.request('/finance/kas-table');
  }

  async toggleKasChecklist(payload: {
    column_id: string;
    user_id: string;
    is_paid: boolean;
    payment_method?: string;
    notes?: string;
  }): Promise<{ success: boolean; entry: KasChecklistEntry }> {
    return this.request('/finance/kas-checklist/toggle', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createKasColumn(payload: {
    title: string;
    date?: string;
    amount: number;
    period_type?: string;
  }): Promise<KasCollectionColumn> {
    return this.request('/finance/kas-columns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteKasColumn(columnId: string): Promise<{ success: boolean }> {
    return this.request(`/finance/kas-columns/${columnId}`, {
      method: 'DELETE',
    });
  }

  // Semesters & Academic Settings
  async getSemesters(): Promise<any[]> {
    return this.request('/settings/semesters');
  }

  async setActiveSemester(semesterId: string): Promise<any> {
    return this.request('/settings/active-semester', {
      method: 'POST',
      body: JSON.stringify({ semesterId }),
    });
  }

  async addSemester(payload: { name: string; academic_year: string }): Promise<any> {
    return this.request('/settings/semesters', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiService();
