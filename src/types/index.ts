// Type definitions for Class Management System

export type PermissionCode =
  | 'view_dashboard'
  | 'view_members'
  | 'create_members'
  | 'edit_members'
  | 'delete_members'
  | 'assign_role'
  | 'view_courses'
  | 'create_courses'
  | 'manage_assignments'
  | 'submit_assignments'
  | 'view_finance'
  | 'create_transaction'
  | 'edit_transaction'
  | 'delete_transaction'
  | 'create_bill'
  | 'manage_payments'
  | 'view_financial_report'
  | 'export_financial_report'
  | 'view_transparency'
  | 'view_agenda'
  | 'create_agenda'
  | 'edit_agenda'
  | 'delete_agenda'
  | 'view_announcements'
  | 'create_announcements'
  | 'edit_announcements'
  | 'delete_announcements'
  | 'view_meetings'
  | 'create_meetings'
  | 'edit_minutes'
  | 'view_tasks'
  | 'create_tasks'
  | 'edit_tasks'
  | 'delete_tasks'
  | 'view_documents'
  | 'upload_documents'
  | 'delete_documents'
  | 'view_polls'
  | 'create_polls'
  | 'vote_polls'
  | 'view_attendance'
  | 'manage_attendance'
  | 'view_reports'
  | 'export_reports'
  | 'manage_roles'
  | 'manage_permissions'
  | 'view_audit_logs'
  | 'manage_system_settings';

export interface Permission {
  id: string;
  code: PermissionCode;
  category: 'Dashboard' | 'Members' | 'Courses' | 'Finance' | 'Agenda' | 'Announcements' | 'Meetings' | 'Tasks' | 'Documents' | 'Polls' | 'Attendance' | 'Reports' | 'System';
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  permissions: PermissionCode[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  nim: string;
  email: string;
  phone: string;
  avatar: string;
  class_id: string;
  department: string;
  cohort: string;
  role_id: string;
  role_name?: string;
  position: string;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  code: string;
  academic_year: string;
  semester: string;
  major: string;
  faculty: string;
  description: string;
  monthly_dues_amount: number;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer' | 'refund';

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  class_id: string;
  code: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  category_name?: string;
  description: string;
  receipt_url?: string;
  created_by: string;
  creator_name?: string;
  updated_by?: string;
  updater_name?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Bill {
  id: string;
  class_id: string;
  title: string;
  description: string;
  amount: number;
  due_date: string;
  period: string; // e.g. "September 2026"
  created_by: string;
  created_at: string;
}

export type PaymentStatus = 'unpaid' | 'pending' | 'partial' | 'paid' | 'cancelled';

export interface Payment {
  id: string;
  bill_id: string;
  bill_title?: string;
  user_id: string;
  user_name?: string;
  user_nim?: string;
  amount: number;
  paid_amount: number;
  status: PaymentStatus;
  paid_at?: string;
  payment_method?: string;
  proof_url?: string;
  verified_by?: string;
  notes?: string;
}

export type EventType = 'lecture' | 'exam' | 'presentation' | 'meeting' | 'event' | 'deadline' | 'payment' | 'other';

export interface EventItem {
  id: string;
  class_id: string;
  title: string;
  description: string;
  type: EventType;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  pic_user_id: string;
  pic_name?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  reminder_minutes: number;
  attachment_url?: string;
}

export interface Announcement {
  id: string;
  class_id: string;
  title: string;
  content: string;
  target_type: 'all' | 'management' | 'role' | 'group';
  target_id?: string;
  target_name?: string;
  is_pinned: boolean;
  publish_date: string;
  author_id: string;
  author_name?: string;
  attachment_url?: string;
  created_at: string;
  is_read?: boolean;
}

export interface Meeting {
  id: string;
  class_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: 'scheduled' | 'finished' | 'cancelled';
  pic_id: string;
  pic_name?: string;
  created_at: string;
  minutes?: MeetingMinute;
}

export interface MeetingMinute {
  id: string;
  meeting_id: string;
  agenda: string;
  discussion: string;
  decisions: string;
  action_items: { task: string; pic: string; deadline: string }[];
  created_by: string;
  created_by_name?: string;
  updated_at: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskItem {
  id: string;
  class_id: string;
  title: string;
  description: string;
  assignee_id: string;
  assignee_name?: string;
  creator_id: string;
  creator_name?: string;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  attachment_url?: string;
  created_at: string;
}

export type DocumentCategory = 'material' | 'administration' | 'proposal' | 'lpj' | 'minutes' | 'letter' | 'schedule' | 'other';

export interface DocumentItem {
  id: string;
  class_id: string;
  name: string;
  category: DocumentCategory;
  file_url: string;
  file_size: string;
  uploader_id: string;
  uploader_name?: string;
  version: string;
  permission_level: 'public' | 'management_only';
  uploaded_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  vote_count: number;
}

export interface Poll {
  id: string;
  class_id: string;
  question: string;
  description: string;
  deadline: string;
  target: string;
  is_anonymous: boolean;
  created_by: string;
  creator_name?: string;
  created_at: string;
  options: PollOption[];
  user_voted_option_id?: string;
  total_votes: number;
}

export type AttendanceStatus = 'present' | 'permission' | 'sick' | 'absent';

export interface AttendanceRecord {
  id: string;
  class_id: string;
  title: string;
  date: string;
  type: 'manual' | 'qr' | 'event';
  user_id: string;
  user_name?: string;
  user_nim?: string;
  status: AttendanceStatus;
  recorded_by: string;
  notes?: string;
  recorded_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'bill' | 'payment' | 'announcement' | 'agenda' | 'task' | 'schedule' | 'poll' | 'document' | 'role_request' | 'system';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  class_id: string;
  user_id: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: Record<string, any> | null;
  new_value?: Record<string, any> | null;
  ip_address: string;
  created_at: string;
}

export interface FinanceSummary {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyIncome: number;
  paidMembersCount: number;
  unpaidMembersCount: number;
  recentTransactions: Transaction[];
  monthlyChart: { month: string; income: number; expense: number }[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  sks: number;
  lecturer_name: string;
  lecturer_phone: string;
  description?: string;
  room?: string;
  schedule_day?: string;
  schedule_time?: string;
  color?: string;
}

export interface CourseAssignment {
  id: string;
  course_id: string;
  course_name?: string;
  title: string;
  description: string;
  deadline: string;
  drive_folder_url?: string;
  created_by: string;
  creator_name?: string;
  created_at: string;
  submission_count?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  user_name: string;
  user_nim: string;
  submission_url: string;
  notes?: string;
  submitted_at: string;
  status: 'submitted' | 'late' | 'graded';
  grade?: string;
}

export interface SyllabusMeeting {
  meeting_no: number;
  topic: string;
  subtopics: string[];
  learning_outcome: string;
  material_url?: string;
  presentation_url?: string;
}

export interface CourseSyllabus {
  id: string;
  course_id: string;
  course_name: string;
  academic_year: string;
  semester: string;
  rps_document_url?: string;
  drive_folder_url?: string;
  assessment_criteria?: {
    attendance: number;
    tasks: number;
    uts: number;
    uas: number;
  };
  meetings: SyllabusMeeting[];
}

export type AgendaEvent = EventItem;

export interface WebhookConfig {
  id: string;
  whatsapp_webhook_url: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  is_enabled: boolean;
  events: {
    announcements: boolean;
    assignment_deadline_h1: boolean;
    kas_bill: boolean;
    meetings: boolean;
  };
  last_triggered_at?: string;
}

export interface WebhookLog {
  id: string;
  event: string;
  target: 'whatsapp' | 'telegram' | 'both';
  payload_summary: string;
  status: 'success' | 'failed' | 'simulated';
  timestamp: string;
}

export interface PaymentGatewayConfig {
  provider: 'midtrans' | 'xendit' | 'simulated';
  is_active: boolean;
  merchant_id?: string;
  client_key?: string;
  server_key?: string;
  enable_va_bca: boolean;
  enable_va_mandiri: boolean;
  enable_va_bri: boolean;
  enable_va_bni: boolean;
  enable_qris: boolean;
}

export interface RoleClaimRequest {
  id: string;
  google_email: string;
  google_name: string;
  google_photo?: string;
  google_avatar?: string;
  google_uid?: string;
  target_user_id?: string;
  target_user_name?: string;
  target_user_nim?: string;
  user_id?: string;
  user_name?: string;
  user_nim?: string;
  requested_user_id?: string;
  requested_role_id: string;
  requested_role_name: string;
  role_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface KasCollectionColumn {
  id: string;
  title: string;
  date: string;
  amount: number;
  period_type: 'daily' | 'weekly' | 'event' | 'monthly';
  created_by: string;
  created_at: string;
}

export interface KasChecklistEntry {
  id: string;
  column_id: string;
  user_id: string;
  user_name: string;
  user_nim: string;
  is_paid: boolean;
  paid_amount: number;
  paid_at?: string;
  payment_method?: string;
  notes?: string;
  updated_by?: string;
}


