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
  profile?: any; // Student, Staff, or Parent profile data
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
  /** Current class FK id (for filtering by specific class + academic year) */
  classId?: string;
  /** Academic year ID of the current class (for filtering results by year) */
  classAcademicYearId?: string;
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
  /** ID of the assigned class (for matching specific class + academic year) */
  assignedClassId?: string;
  /** Academic year ID of the assigned class (for filtering results by year) */
  assignedClassAcademicYearId?: string;
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

export interface Class {
  id: string;
  name: string;
  grade: number;
  section: string;
  academicYear: string;
  academicYearId: string;
  classTeacher?: string;
  classTeacherName?: string;
  studentCount?: number;
}

export interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  subject_name?: string;
  term: 'first' | 'second' | 'third' | 'final';
  academicYear: string;
  academicYearId?: string;
  classId?: string;
  class?: string;
  recordedClassId?: string;
  payment_status: boolean;
  // CA Scores (10 marks each)
  ca1_score: number;
  ca2_score: number;
  ca3_score: number;
  ca4_score: number;
  ca_total: number;
  // Final Exam (60 marks)
  exam_score: number;
  // Calculated totals
  marks_obtained: number;
  total_marks: number;
  percentage: number;
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
  academicYear: string;
  academicYearId?: string;
  grade: number;
  feeType: 'tuition' | 'examination' | 'transport' | 'hostel' | 'other';
  amount: number;
  description: string;
}

export interface FeeTransaction {
  id: string;
  studentId: string;
  studentName?: string;
  feeStructureId: string;
  feeStructureName?: string;
  amount: number;
  totalAmount?: number;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paymentDate?: string;
  dueDate: string;
  paymentMethod?: string;
  transactionId?: string;
  remarks?: string;
  term?: 'first' | 'second' | 'third';
  academicYear?: string;
  academicYearId?: string;
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
  priority: 'low' | 'medium' | 'high' | 'urgent';
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

// Rankings Types
export interface ClassRanking {
  rankings: StudentRanking[];
  total_students: number;
  class_info: {
    class_id: string;
    term: string;
    academic_year: string;
  };
}

export interface StudentRanking {
  student_id: string | number;
  student_name: string;
  position: number;
  total_marks: number;
  total_max_marks: number;
  average_percentage: number;
  subjects: { subject_name: string; percentage: number; grade: string }[];
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