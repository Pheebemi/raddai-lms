// User Roles and Authentication Types
export type UserRole = 'admin' | 'management' | 'staff' | 'student' | 'parent';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Student-specific types
export interface Student {
  id: string;
  user: User;
  studentId: string;
  class: string;
  section: string;
  rollNumber: number;
  parentId?: string;
  admissionDate: string;
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

// Staff-specific types
export interface Staff {
  id: string;
  user: User;
  staffId: string;
  designation: string;
  department: string;
  assignedClasses: string[];
  assignedSubjects: string[];
  joiningDate: string;
  salary?: number;
  qualification?: string;
}

// Parent-specific types
export interface Parent {
  id: string;
  user: User;
  children: Student[];
  occupation?: string;
  income?: number;
}

// Academic Types
export interface Subject {
  id: string;
  name: string;
  code: string;
  class: string;
  teacherId: string;
  description?: string;
}

export interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  term: 'Term 1' | 'Term 2' | 'Term 3' | 'Final';
  academicYear: string;
  marks: number;
  maxMarks: number;
  grade: string;
  remarks?: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassPerformance {
  class: string;
  subject: string;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  passPercentage: number;
}

// Fee Management Types
export interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time';
  class?: string;
  description: string;
  dueDate: string;
}

export interface FeeTransaction {
  id: string;
  studentId: string;
  feeStructureId: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paymentDate?: string;
  dueDate: string;
  paymentMethod?: string;
  transactionId?: string;
  remarks?: string;
}

export interface PaymentSummary {
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  nextDueDate?: string;
}

// Announcement Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'academic' | 'fee' | 'event' | 'emergency';
  priority: 'low' | 'medium' | 'high';
  targetRoles: UserRole[];
  targetClasses?: string[];
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  isRead?: boolean;
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  class: string;
  subject?: string;
  markedBy: string;
  remarks?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

// Dashboard Types
export interface DashboardStats {
  totalStudents?: number;
  totalStaff?: number;
  totalRevenue?: number;
  pendingFees?: number;
  averageAttendance?: number;
  topPerformers?: Student[];
  recentResults?: Result[];
  upcomingEvents?: Announcement[];
}

export interface NotificationItem {
  id: string;
  type: 'result' | 'fee' | 'announcement' | 'attendance' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  role: UserRole;
}

export interface ResultUploadFormData {
  class: string;
  subject: string;
  term: string;
  academicYear: string;
  results: {
    studentId: string;
    marks: number;
    remarks?: string;
  }[];
}

export interface ProfileUpdateFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  avatar?: File;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string | number;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
}