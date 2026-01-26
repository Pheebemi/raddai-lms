import { User, UserRole, DashboardStats, Announcement, Result, FeeTransaction, Student, Staff, Parent } from '@/types';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// API Response types
interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
  errors?: string[];
}

interface LoginResponse {
  refresh: string;
  access: string;
  user: any; // Django user format
  role: string;
}

interface DjangoUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  date_of_birth?: string;
  address?: string;
  profile?: any;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('edumanage_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// Helper function to handle API responses
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// Convert Django user format to frontend User format
const convertDjangoUser = (djangoUser: DjangoUser): User => {
  return {
    id: djangoUser.id.toString(),
    email: djangoUser.email,
    firstName: djangoUser.first_name,
    lastName: djangoUser.last_name,
    role: djangoUser.role,
    phone: djangoUser.phone_number,
    address: djangoUser.address,
    dateOfBirth: djangoUser.date_of_birth,
    createdAt: new Date().toISOString(), // Django doesn't provide this in login response
    updatedAt: new Date().toISOString(),
  };
};

// Authentication API
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleApiResponse<LoginResponse>(response);
  },

  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    return handleApiResponse<{ access: string }>(response);
  },

  getProfile: async (): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/profile/`, {
      headers: getAuthHeaders(),
    });
    const djangoUser = await handleApiResponse<DjangoUser>(response);
    return convertDjangoUser(djangoUser);
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats/`, {
      headers: getAuthHeaders(),
    });
    return handleApiResponse<DashboardStats>(response);
  },
};

// Announcements API
export const announcementsApi = {
  getList: async (): Promise<Announcement[]> => {
    const response = await fetch(`${API_BASE_URL}/announcements/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any[]>(response);

    // Convert Django format to frontend format
    return data.map(item => ({
      id: item.id.toString(),
      title: item.title,
      content: item.content,
      type: 'general' as const, // Django doesn't have type field
      priority: item.priority as 'low' | 'medium' | 'high',
      targetRoles: [] as UserRole[], // Would need to derive from Django fields
      createdBy: item.created_by_name,
      createdAt: item.created_at,
      expiresAt: item.expires_at,
      isRead: false, // Frontend state
    }));
  },
};

// Results API
export const resultsApi = {
  getList: async (): Promise<Result[]> => {
    const response = await fetch(`${API_BASE_URL}/results/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any>(response);

    // Handle paginated response
    const results = data.results || data;

    // Convert Django format to frontend format
    return results.map((item: any) => ({
      id: item.id.toString(),
      studentId: item.student.toString(),
      subjectId: item.subject.toString(),
      subject_name: item.subject_name || item.subjectId,
      term: item.term as 'first' | 'second' | 'third' | 'final',
      academicYear: item.academic_year_name,
      academicYearId: item.academic_year.toString(),
      // CA Scores
      ca1_score: parseFloat(item.ca1_score) || 0,
      ca2_score: parseFloat(item.ca2_score) || 0,
      ca3_score: parseFloat(item.ca3_score) || 0,
      ca4_score: parseFloat(item.ca4_score) || 0,
      ca_total: parseFloat(item.ca_total) || 0,
      // Exam Score
      exam_score: parseFloat(item.exam_score) || 0,
      // Calculated totals
      marks_obtained: parseFloat(item.marks_obtained) || 0,
      total_marks: parseFloat(item.total_marks) || 100,
      percentage: parseFloat(item.percentage) || 0,
      grade: item.grade || '',
      remarks: item.remarks || '',
      teacherId: item.uploaded_by?.toString() || '',
      createdAt: item.upload_date,
      updatedAt: item.upload_date,
    }));
  },

  create: async (resultData: {
    student: string;
    subject: string;
    academic_year: string;
    term: string;
    ca1_score: number;
    ca2_score: number;
    ca3_score: number;
    ca4_score: number;
    exam_score: number;
    remarks?: string;
  }): Promise<Result> => {
    const response = await fetch(`${API_BASE_URL}/results/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(resultData),
    });
    const data = await handleApiResponse<any>(response);

    // Convert response to Result format
    return {
      id: data.id.toString(),
      studentId: data.student.toString(),
      subjectId: data.subject.toString(),
      subject_name: data.subject_name,
      term: data.term,
      academicYear: data.academic_year_name,
      academicYearId: data.academic_year.toString(),
      ca1_score: parseFloat(data.ca1_score) || 0,
      ca2_score: parseFloat(data.ca2_score) || 0,
      ca3_score: parseFloat(data.ca3_score) || 0,
      ca4_score: parseFloat(data.ca4_score) || 0,
      ca_total: parseFloat(data.ca_total) || 0,
      exam_score: parseFloat(data.exam_score) || 0,
      marks_obtained: parseFloat(data.marks_obtained) || 0,
      total_marks: parseFloat(data.total_marks) || 100,
      percentage: parseFloat(data.percentage) || 0,
      grade: data.grade || '',
      remarks: data.remarks || '',
      teacherId: data.uploaded_by?.toString() || '',
      createdAt: data.upload_date,
      updatedAt: data.upload_date,
    };
  },

  update: async (id: string, resultData: {
    student?: string;
    subject?: string;
    academic_year?: string;
    term?: string;
    ca1_score?: number;
    ca2_score?: number;
    ca3_score?: number;
    ca4_score?: number;
    exam_score?: number;
    remarks?: string;
  }): Promise<Result> => {
    const response = await fetch(`${API_BASE_URL}/results/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(resultData),
    });
    const data = await handleApiResponse<any>(response);

    // Convert response to Result format
    return {
      id: data.id.toString(),
      studentId: data.student.toString(),
      subjectId: data.subject.toString(),
      subject_name: data.subject_name,
      term: data.term,
      academicYear: data.academic_year_name,
      academicYearId: data.academic_year.toString(),
      ca1_score: parseFloat(data.ca1_score) || 0,
      ca2_score: parseFloat(data.ca2_score) || 0,
      ca3_score: parseFloat(data.ca3_score) || 0,
      ca4_score: parseFloat(data.ca4_score) || 0,
      ca_total: parseFloat(data.ca_total) || 0,
      exam_score: parseFloat(data.exam_score) || 0,
      marks_obtained: parseFloat(data.marks_obtained) || 0,
      total_marks: parseFloat(data.total_marks) || 100,
      percentage: parseFloat(data.percentage) || 0,
      grade: data.grade || '',
      remarks: data.remarks || '',
      teacherId: data.uploaded_by?.toString() || '',
      createdAt: data.upload_date,
      updatedAt: data.upload_date,
    };
  },
};

// Fee API
export const feesApi = {
  getPayments: async (): Promise<FeeTransaction[]> => {
    const response = await fetch(`${API_BASE_URL}/fee-payments/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any[]>(response);

    // Convert Django format to frontend format
    return data.map(item => ({
      id: item.id.toString(),
      studentId: item.student.toString(),
      feeStructureId: item.fee_structure.toString(),
      amount: parseFloat(item.amount_paid),
      status: item.status as 'paid' | 'pending' | 'overdue' | 'partial',
      paymentDate: item.payment_date,
      dueDate: item.due_date,
      paymentMethod: item.payment_method,
      transactionId: item.transaction_id,
      remarks: item.remarks,
    }));
  },
};

// Generic API functions
export const fetchClasses = async () => {
  const response = await fetch(`${API_BASE_URL}/classes/`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse<any>(response);
};

export const fetchSubjects = async () => {
  const response = await fetch(`${API_BASE_URL}/subjects/`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse<any>(response);
};

export const fetchAcademicYears = async () => {
  const response = await fetch(`${API_BASE_URL}/academic-years/`, {
    headers: getAuthHeaders(),
  });
  return handleApiResponse<any>(response);
};

// Users API
export const usersApi = {
  getStudents: async (): Promise<Student[]> => {
    const response = await fetch(`${API_BASE_URL}/students/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any>(response);

    // Handle paginated response
    const results = data.results || data;

    // Convert Django format to frontend format
    return results.map((item: any) => {
      const className = item.current_class_name || '';
      const classParts = className.split(' ');
      const section = classParts.length > 1 ? classParts[classParts.length - 1] : '';

      return {
        id: item.id.toString(),
        user: convertDjangoUser(item.user_details),
        studentId: item.student_id,
        class: className, // Keep full class name
        section: section,
        rollNumber: 0, // Would need to be added to Django model
        admissionDate: item.admission_date,
      };
    });
  },

  getStaff: async (): Promise<Staff[]> => {
    const response = await fetch(`${API_BASE_URL}/staff/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any>(response);

    // Handle paginated response
    const results = data.results || data;

    // Convert Django format to frontend format
    return results.map((item: any) => ({
      id: item.id.toString(),
      user: convertDjangoUser(item.user_details),
      staffId: item.staff_id,
      designation: item.designation,
      department: '', // Django doesn't have department field
      assignedClasses: item.assigned_classes?.map((c: any) => c.name) || [],
      assignedSubjects: item.subjects?.map((s: any) => s.name) || [],
      joiningDate: item.joining_date,
      qualification: item.qualification,
    }));
  },

  getParents: async (): Promise<Parent[]> => {
    const response = await fetch(`${API_BASE_URL}/parents/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any>(response);

    // Handle paginated response
    const results = data.results || data;

    // Convert Django format to frontend format
    return results.map((item: any) => ({
      id: item.id.toString(),
      user: convertDjangoUser(item.user_details),
      children: item.children_details?.map((child: any) => ({
        id: child.id.toString(),
        user: convertDjangoUser(child.user_details),
        studentId: child.student_id,
        class: child.current_class_name || '',
        section: '',
        rollNumber: 0,
        admissionDate: child.admission_date,
      })) || [],
    }));
  },
};

// Generic API error handler
export const handleApiError = (error: any): string => {
  if (error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};