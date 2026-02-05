import { User, UserRole, DashboardStats, Announcement, Result, FeeTransaction, Student, Staff, Parent, Class, StaffSalary } from '@/types';

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
    profile: djangoUser.profile, // Include profile data
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
    // Custom handling so invalid credentials show a friendly message
    if (!response.ok) {
      let errorText = 'Invalid username or password';

      try {
        const data = await response.json();
        // If backend sends a more specific error, we can use it, but only if it's user-friendly
        if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length > 0) {
          errorText = data.non_field_errors[0];
        }
      } catch {
        // Ignore JSON parse errors and fall back to generic message
      }

      throw new Error(errorText);
    }

    return response.json();
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
    const data = await handleApiResponse<any>(response);

    // Map Django snake_case keys to our DashboardStats shape (camelCase)
    return {
      totalStudents: data.total_students,
      totalStaff: data.total_staff,
      totalRevenue: data.total_revenue,
      pendingFees: data.pending_fees,
      averageAttendance: data.average_attendance,
      topPerformers: data.top_performers,
      recentResults: data.recent_results,
      upcomingEvents: data.upcoming_events,
    };
  },
};

// Announcements API
export const announcementsApi = {
  getList: async (): Promise<Announcement[]> => {
    const response = await fetch(`${API_BASE_URL}/announcements/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any>(response);

    // Handle paginated response
    let items: any[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object' && data.results) {
      // Paginated response
      items = data.results;
    } else if (data && typeof data === 'object' && Object.keys(data).length === 0) {
      // Empty object response
      items = [];
    } else {
      console.error('Unexpected response format from announcements API, got:', data);
      throw new Error('Invalid response format from server');
    }

    // Convert Django format to frontend format
    return items.map(item => ({
      id: item.id.toString(),
      title: item.title,
      content: item.content,
      type: 'general' as const, // Django doesn't have type field
      priority: item.priority as 'low' | 'medium' | 'high' | 'urgent',
      targetRoles: [] as UserRole[], // Would need to derive from Django fields
      createdBy: item.created_by_name,
      createdAt: item.created_at,
      expiresAt: item.expires_at,
      isRead: false, // Frontend state
    }));
  },

  create: async (announcementData: {
    title: string;
    content: string;
    priority: string;
    for_students: boolean;
    for_parents: boolean;
    for_staff: boolean;
    for_management: boolean;
    expires_at?: string;
  }): Promise<Announcement> => {
    const response = await fetch(`${API_BASE_URL}/announcements/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(announcementData),
    });
    const data = await handleApiResponse<any>(response);

    // Convert response to Announcement format
    return {
      id: data.id.toString(),
      title: data.title,
      content: data.content,
      type: 'general' as const,
      priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
      targetRoles: [],
      createdBy: data.created_by_name,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      isRead: false,
    };
  },
};

// Results API
export const resultsApi = {
  getList: async (): Promise<Result[]> => {
    try {
      // DRF typically paginates /results/. We want ALL results,
      // so we follow `next` links until there are no more pages.
      let url: string | null = `${API_BASE_URL}/results/`;
      const allItems: any[] = [];

      while (url) {
        const response = await fetch(url, {
          headers: getAuthHeaders(),
        });

        console.log('Results API page response status:', response.status, 'for url:', url);
        console.log('Results API response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          console.error('Results API error response:', response.status, response.statusText);
          break;
        }

        const data = await response.json().catch((error) => {
          console.error('Results API JSON parse error:', error);
          return null;
        });

        if (!data) {
          console.error('Results API: No data received for url:', url);
          break;
        }

        const pageItems = Array.isArray(data) ? data : (data.results || []);

        if (!Array.isArray(pageItems)) {
          console.error('Results API: Expected array or paginated results, got:', data);
          break;
        }

        allItems.push(...pageItems);

        // DRF pagination uses `next` with either absolute or relative URL
        url = typeof data.next === 'string' && data.next.length > 0 ? data.next : null;
      }

      console.log('Total raw results from API (all pages):', allItems.length);
      console.log('Sample results from API:', allItems.slice(0, 5).map((r: any) => ({
        id: r.id,
        student: r.student,
        subject: r.subject,
        academic_year: r.academic_year,
        term: r.term
      })));

      // Convert Django format to frontend format
      const converted = allItems.map((item: any) => ({
        id: item.id.toString(),
        studentId: item.student.toString(),
        studentName: item.student_name,
        subjectId: item.subject.toString(),
        subject_name: item.subject_name || item.subjectId,
        term: item.term as 'first' | 'second' | 'third' | 'final',
        academicYear: item.academic_year_name,
        academicYearId: item.academic_year.toString(),
        classId: item.class_id,
        class: item.class_name,
        recordedClassId: item.recorded_class,
        payment_status: item.payment_status || false,
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

      return converted;
    } catch (error) {
      console.error('Error in resultsApi.getList:', error);
      return [];
    }
  },

  create: async (resultData: {
    student: string;
    subject: string;
    academic_year: string;
    term: string;
    recorded_class: string;
    ca1_score: number;
    ca2_score: number;
    ca3_score: number;
    ca4_score: number;
    exam_score: number;
    remarks?: string;
  }): Promise<Result> => {
    console.log('Creating result with data:', resultData);
    const response = await fetch(`${API_BASE_URL}/results/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(resultData),
    });

    if (!response.ok) {
      // Log the error response
      const errorText = await response.text();
      console.error('Result creation failed:', response.status, errorText);
    }
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
      payment_status: data.payment_status || false,
    };
  },

  update: async (id: string, resultData: {
    student?: string;
    subject?: string;
    academic_year?: string;
    term?: string;
    recorded_class?: string;
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
      payment_status: data.payment_status || false,
    };
  },

  // Download result as PNG for a specific term and academic year
  downloadResult: async (studentId: string, term: string, academicYear: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/results/download/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        student_id: studentId,
        term: term,
        academic_year: academicYear,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    // Return the download URL or blob
    const data = await response.json();
    return data.download_url || data.blob_url;
  },

  // Get results for a specific term and academic year for download
  getResultsForDownload: async (studentId: string, term: string, academicYear: string): Promise<{
    student: any;
    results: Result[];
    schoolInfo: {
      name: string;
      address: string;
      phone: string;
      email: string;
    };
    term: string;
    academicYear: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/results/student-term-results/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        student_id: studentId,
        term: term,
        academic_year: academicYear,
      }),
    });
    return handleApiResponse(response);
  },

  // Export all results that the current staff member can access
  exportResults: async (filters?: {
    class_id?: string;
    term?: string;
    academic_year?: string;
  }): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.class_id) params.append('class_id', filters.class_id);
    if (filters?.term) params.append('term', filters.term);
    if (filters?.academic_year) params.append('academic_year', filters.academic_year);

    const response = await fetch(`${API_BASE_URL}/results/export/?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('edumanage_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  },
};

// Fee Structure API
export const feeStructureApi = {
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/fee-structures/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any>(response);

    // Handle different response formats
    let items: any[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object' && data.results) {
      // Paginated response
      items = data.results;
    } else if (data && typeof data === 'object' && Object.keys(data).length === 0) {
      // Empty object response
      items = [];
    } else {
      console.error('Unexpected response format from fee-structures API:', data);
      throw new Error('Invalid response format from server');
    }

    // Convert Django format to frontend format
    return items.map(item => ({
      id: item.id.toString(),
      academicYear: item.academic_year_name,
      academicYearId: item.academic_year.toString(),
      grade: item.grade,
      feeType: item.fee_type,
      amount: parseFloat(item.amount),
      description: item.description,
    }));
  },

  getByGradeAndYear: async (grade: number, academicYear: string): Promise<any[]> => {
    const params = new URLSearchParams();
    params.append('grade', grade.toString());
    params.append('academic_year', academicYear);

    const response = await fetch(`${API_BASE_URL}/fee-structures/?${params}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any[]>(response);

    // Convert Django format to frontend format
    return data.map(item => ({
      id: item.id.toString(),
      academicYear: item.academic_year_name,
      academicYearId: item.academic_year.toString(),
      grade: item.grade,
      feeType: item.fee_type,
      amount: parseFloat(item.amount),
      description: item.description,
    }));
  },

  getByAcademicYear: async (academicYear: string): Promise<any[]> => {
    const params = new URLSearchParams();
    params.append('academic_year', academicYear);

    const response = await fetch(`${API_BASE_URL}/fee-structures/?${params}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any[]>(response);

    // Convert Django format to frontend format
    return data.map(item => ({
      id: item.id.toString(),
      academicYear: item.academic_year_name,
      academicYearId: item.academic_year.toString(),
      grade: item.grade,
      feeType: item.fee_type,
      amount: parseFloat(item.amount),
      description: item.description,
    }));
  },
};

// Rankings API
export const rankingsApi = {
  getClassRankings: async (classId: string, term: string, academicYear: string) => {
    const params = new URLSearchParams({
      class_id: classId,
      term: term,
      academic_year: academicYear,
    });

    const url = `${API_BASE_URL}/rankings/class/?${params}`;
    console.log('Fetching rankings from:', url);

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    console.log('Rankings API response status:', response.status);

    const result = await handleApiResponse<any>(response);
    console.log('Rankings API response data:', result);
    return result;
  },
};

// Fee API
export const feesApi = {
  getPayments: async (): Promise<FeeTransaction[]> => {
    const response = await fetch(`${API_BASE_URL}/fee-payments/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any>(response);

    // Handle different response formats (array, paginated, or empty object)
    let items: any[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object' && data.results) {
      // Paginated response
      items = data.results;
    } else if (data && typeof data === 'object' && Object.keys(data).length === 0) {
      // Empty object response
      items = [];
    } else {
      console.error('Unexpected response format from fee-payments API:', data);
      throw new Error('Invalid response format from server');
    }

    // Convert Django format to frontend format
    return items.map(item => ({
      id: item.id.toString(),
      studentId: item.student.toString(),
      studentName: item.student_name,
      feeStructureId: item.fee_structure.toString(),
      feeStructureName: item.fee_type_name,
      amount: parseFloat(item.amount_paid || 0),
      totalAmount: parseFloat(item.total_amount || item.amount_paid || 0),
      status: item.status as 'paid' | 'pending' | 'overdue' | 'partial',
      paymentDate: item.payment_date,
      dueDate: item.due_date,
      paymentMethod: item.payment_method,
      transactionId: item.transaction_id,
      remarks: item.remarks,
      term: item.term as 'first' | 'second' | 'third',
      academicYear: item.academic_year_name,
      academicYearId: item.academic_year?.toString(),
    }));
  },

  getPaymentsByTerm: async (term: string, academicYear?: string): Promise<FeeTransaction[]> => {
    const params = new URLSearchParams();
    params.append('term', term);
    if (academicYear) {
      params.append('academic_year', academicYear);
    }

    const response = await fetch(`${API_BASE_URL}/fee-payments/?${params}`, {
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
      term: item.term as 'first' | 'second' | 'third',
      academicYear: item.academic_year_name,
      academicYearId: item.academic_year?.toString(),
    }));
  },

  getStudentPayments: async (studentId: string): Promise<FeeTransaction[]> => {
    const response = await fetch(`${API_BASE_URL}/fee-payments/?student=${studentId}`, {
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
      term: item.term as 'first' | 'second' | 'third',
      academicYear: item.academic_year_name,
      academicYearId: item.academic_year?.toString(),
    }));
  },

  createPayment: async (paymentData: {
    student: string;
    fee_structure: string;
    academic_year: string;
    term: string;
    amount_paid: number;
    total_amount: number;
    due_date: string;
    status?: string;
    payment_method: string;
    transaction_id?: string;
    remarks?: string;
  }): Promise<FeeTransaction> => {
    const response = await fetch(`${API_BASE_URL}/fee-payments/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData),
    });
    const data = await handleApiResponse<any>(response);

    // Convert response to FeeTransaction format
    return {
      id: data.id.toString(),
      studentId: data.student.toString(),
      feeStructureId: data.fee_structure.toString(),
      amount: parseFloat(data.amount_paid),
      status: data.status as 'paid' | 'pending' | 'overdue' | 'partial',
      paymentDate: data.payment_date,
      dueDate: data.due_date,
      paymentMethod: data.payment_method,
      transactionId: data.transaction_id,
      remarks: data.remarks,
      term: data.term as 'first' | 'second' | 'third',
      academicYear: data.academic_year_name,
      academicYearId: data.academic_year?.toString(),
    };
  },
};

// Staff Salary API
export const staffSalaryApi = {
  list: async (filters?: { academic_year?: string; month?: number; staff?: string }): Promise<StaffSalary[]> => {
    const params = new URLSearchParams();
    if (filters?.academic_year) params.append('academic_year', filters.academic_year);
    if (filters?.month) params.append('month', String(filters.month));
    if (filters?.staff) params.append('staff', filters.staff);

    const url = params.toString()
      ? `${API_BASE_URL}/staff-salaries/?${params.toString()}`
      : `${API_BASE_URL}/staff-salaries/`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any>(response);
    const results = Array.isArray(data) ? data : data.results || [];

    return results.map((item: any): StaffSalary => ({
      id: item.id.toString(),
      staffId: item.staff.toString(),
      staffName: item.staff_name,
      staffCode: item.staff_staff_id,
      academicYearId: item.academic_year.toString(),
      academicYearName: item.academic_year_name,
      month: item.month,
      monthName: item.month_display,
      amount: parseFloat(item.amount),
      paidDate: item.paid_date,
      voucherNumber: item.voucher_number || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  },

  upsert: async (payload: {
    id?: string;
    staff: string;
    academic_year: string;
    month: number;
    amount: number;
    voucher_number?: string;
    paid_date?: string;
  }): Promise<StaffSalary> => {
    const body = {
      staff: payload.staff,
      academic_year: payload.academic_year,
      month: payload.month,
      amount: payload.amount,
      voucher_number: payload.voucher_number || '',
      paid_date: payload.paid_date,
    };

    const url = payload.id
      ? `${API_BASE_URL}/staff-salaries/${payload.id}/`
      : `${API_BASE_URL}/staff-salaries/`;

    const response = await fetch(url, {
      method: payload.id ? 'PATCH' : 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    const item = await handleApiResponse<any>(response);

    return {
      id: item.id.toString(),
      staffId: item.staff.toString(),
      staffName: item.staff_name,
      staffCode: item.staff_staff_id,
      academicYearId: item.academic_year.toString(),
      academicYearName: item.academic_year_name,
      month: item.month,
      monthName: item.month_display,
      amount: parseFloat(item.amount),
      paidDate: item.paid_date,
      voucherNumber: item.voucher_number || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  },
};

// Generic API functions
export const fetchClasses = async () => {
  const response = await fetch(`${API_BASE_URL}/classes/`, {
    headers: getAuthHeaders(),
  });
  const data = await handleApiResponse<any>(response);

  // Ensure we return an array
  if (Array.isArray(data)) {
    return data;
  } else if (data && typeof data === 'object' && data.results) {
    // Paginated response
    return data.results;
  } else {
    console.warn('fetchClasses returned unexpected format:', data);
    return [];
  }
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
  const data = await handleApiResponse<any>(response);

  // Handle different response formats
  if (Array.isArray(data)) {
    return data;
  } else if (data && typeof data === 'object' && data.results) {
    // Paginated response
    return data.results;
  } else if (data && typeof data === 'object' && Object.keys(data).length === 0) {
    // Empty object response
    return [];
  } else {
    console.warn('fetchAcademicYears returned unexpected format:', data);
    return [];
  }
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

    // Ensure results is an array
    if (!Array.isArray(results)) {
      console.error('getStudents: Expected array but got:', results);
      return [];
    }

    // Convert Django format to frontend format
    return results.map((item: any) => {
      const className = item.current_class_name || '';
      const classParts = className.split(' ');
      const section = classParts.length > 1 ? classParts[classParts.length - 1] : '';
      const classId = item.current_class != null ? item.current_class.toString() : undefined;

      return {
        id: item.id.toString(),
        user: convertDjangoUser(item.user_details),
        studentId: item.student_id,
        class: className, // Keep full class name
        classId, // Current class FK id (for filtering by class + academic year)
        classAcademicYearId: item.current_class?.academic_year?.toString(),
        section: section,
        rollNumber: 0, // Would need to be added to Django model
        admissionDate: item.admission_date,
      };
    });
  },

  // Create a new student user + profile and assign to a class
  createStudent: async (data: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email?: string;
    studentId: string;
    classId: string;
  }): Promise<Student> => {
    try {
      // 1) Create the auth user with role=student
      const userPayload = {
        username: data.username,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email || '',  // Send empty string instead of undefined
        role: 'student',
      };

      console.log('Creating user with payload:', userPayload);

      const userResponse = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userPayload),
      });

      const createdUser = await handleApiResponse<any>(userResponse);
      console.log('User created successfully:', createdUser);

      // 2) Create the student profile linked to that user
      const studentPayload = {
        user: createdUser.id,
        student_id: data.studentId,
        current_class: data.classId,
      };

      console.log('Creating student with payload:', studentPayload);

      const studentResponse = await fetch(`${API_BASE_URL}/students/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentPayload),
      });

      const createdStudent = await handleApiResponse<any>(studentResponse);
      console.log('Student created successfully:', createdStudent);

    // 3) Normalize into our Student type
    const className = createdStudent.current_class_name || '';
    const classParts = className.split(' ');
    const section = classParts.length > 1 ? classParts[classParts.length - 1] : '';
    const classId = createdStudent.current_class != null ? createdStudent.current_class.toString() : undefined;

    return {
      id: createdStudent.id.toString(),
      user: convertDjangoUser(createdStudent.user_details),
      studentId: createdStudent.student_id,
      class: className,
      classId,
      classAcademicYearId: createdStudent.current_class?.academic_year?.toString(),
      section,
      rollNumber: 0,
      admissionDate: createdStudent.admission_date,
    };
    } catch (error) {
      console.error('Error in createStudent API:', error);
      throw error; // Re-throw to let the calling code handle it
    }
  },

  // Update an existing student (basic details + class assignment)
  updateStudent: async (
    id: string,
    data: {
      userId: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      studentId?: string;
      classId?: string;
    }
  ): Promise<Student> => {
    try {
      // 1) Optionally update the linked auth user
      const userPayload: any = {};
      if (data.firstName !== undefined) userPayload.first_name = data.firstName;
      if (data.lastName !== undefined) userPayload.last_name = data.lastName;
      if (data.email !== undefined) userPayload.email = data.email;

      if (Object.keys(userPayload).length > 0) {
        const userResponse = await fetch(`${API_BASE_URL}/users/${data.userId}/`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify(userPayload),
        });
        await handleApiResponse<any>(userResponse);
      }

      // 2) Update the student profile
      const studentPayload: any = {};
      if (data.studentId !== undefined) studentPayload.student_id = data.studentId;
      if (data.classId !== undefined) studentPayload.current_class = data.classId;

      const studentResponse = await fetch(`${API_BASE_URL}/students/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentPayload),
      });

      const updatedStudent = await handleApiResponse<any>(studentResponse);

      // 3) Normalize into our Student type (same mapping as getStudents/createStudent)
      const className = updatedStudent.current_class_name || '';
      const classParts = className.split(' ');
      const section = classParts.length > 1 ? classParts[classParts.length - 1] : '';
      const classId = updatedStudent.current_class != null ? updatedStudent.current_class.toString() : undefined;

      return {
        id: updatedStudent.id.toString(),
        user: convertDjangoUser(updatedStudent.user_details),
        studentId: updatedStudent.student_id,
        class: className,
        classId,
        classAcademicYearId: updatedStudent.current_class?.academic_year?.toString(),
        section,
        rollNumber: 0,
        admissionDate: updatedStudent.admission_date,
      };
    } catch (error) {
      console.error('Error in updateStudent API:', error);
      throw error;
    }
  },

  // Delete a student (management only)
  deleteStudent: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/students/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete student' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
  },

  // Create a new staff user + profile and assign initial details
  createStaff: async (data: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email?: string;
    staffId: string;
    designation: string;
    joiningDate?: string;
    classId?: string;
  }): Promise<Staff> => {
    try {
      // 1) Create the auth user with role=staff
      const userPayload = {
        username: data.username,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email || '',  // Send empty string instead of undefined
        role: 'staff',
      };

      console.log('Creating staff user with payload:', userPayload);

      const userResponse = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userPayload),
      });

      const createdUser = await handleApiResponse<any>(userResponse);
      console.log('Staff user created successfully:', createdUser);

      // 2) Create the staff profile linked to that user
      const staffPayload = {
        user: createdUser.id,
        staff_id: data.staffId,
        designation: data.designation,
        joining_date: data.joiningDate || new Date().toISOString().split('T')[0], // Today's date if not provided
      };

      console.log('Creating staff profile with payload:', staffPayload);

      const staffResponse = await fetch(`${API_BASE_URL}/staff/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(staffPayload),
      });

      const createdStaff = await handleApiResponse<any>(staffResponse);
      console.log('Staff profile created successfully:', createdStaff);

      // 3) Optionally assign this staff as class teacher for a class
      if (data.classId) {
        try {
          await fetch(`${API_BASE_URL}/staff/${createdStaff.id}/assign-class/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ class_id: data.classId }),
          });
        } catch (assignError) {
          console.error('Failed to assign class to staff on create:', assignError);
          // Don't block staff creation if class assignment fails
        }
      }

      // 4) Normalize into our Staff type
      return {
        id: createdStaff.id.toString(),
        user: convertDjangoUser(createdStaff.user_details),
        staffId: createdStaff.staff_id,
        designation: createdStaff.designation,
        department: createdStaff.department || '',
        assignedClasses: createdStaff.assigned_classes?.map((c: any) => c.name) || [],
        assignedClassId: createdStaff.assigned_classes?.[0]?.id?.toString(),
        assignedClassAcademicYearId: createdStaff.assigned_classes?.[0]?.academic_year?.toString(),
        assignedSubjects: createdStaff.subjects?.map((s: any) => s.name) || [],
        joiningDate: createdStaff.joining_date,
        qualification: createdStaff.qualification || '',
      };
    } catch (error) {
      console.error('Error in createStaff API:', error);
      throw error; // Re-throw to let the calling code handle it
    }
  },

  // Update an existing staff member (basic details + class assignments)
  updateStaff: async (
    id: string,
    data: {
      userId: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      staffId?: string;
      designation?: string;
      joiningDate?: string;
      classId?: string | null;
    }
  ): Promise<Staff> => {
    try {
      // 1) Optionally update the linked auth user
      const userPayload: any = {};
      if (data.firstName !== undefined) userPayload.first_name = data.firstName;
      if (data.lastName !== undefined) userPayload.last_name = data.lastName;
      if (data.email !== undefined) userPayload.email = data.email;

      if (Object.keys(userPayload).length > 0) {
        const userResponse = await fetch(`${API_BASE_URL}/users/${data.userId}/`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify(userPayload),
        });
        await handleApiResponse<any>(userResponse);
      }

      // 2) Update the staff profile
      const staffPayload: any = {};
      if (data.staffId !== undefined) staffPayload.staff_id = data.staffId;
      if (data.designation !== undefined) staffPayload.designation = data.designation;
      if (data.joiningDate !== undefined) staffPayload.joining_date = data.joiningDate;
      // Class assignment is handled via a dedicated endpoint, not via staff payload

      const staffResponse = await fetch(`${API_BASE_URL}/staff/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(staffPayload),
      });

      let updatedStaff = await handleApiResponse<any>(staffResponse);

      // 3) Optionally assign/unassign class teacher for this staff
      if (data.classId !== undefined) {
        try {
          const assignResponse = await fetch(`${API_BASE_URL}/staff/${id}/assign-class/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ class_id: data.classId }),
          });
          updatedStaff = await handleApiResponse<any>(assignResponse);
        } catch (assignError) {
          console.error('Failed to assign class to staff on update:', assignError);
          // Fall through and still return staff with old assignment
        }
      }

      // Normalize into our Staff type using the latest representation
      return {
        id: updatedStaff.id.toString(),
        user: convertDjangoUser(updatedStaff.user_details),
        staffId: updatedStaff.staff_id,
        designation: updatedStaff.designation,
        department: updatedStaff.department || '',
        assignedClasses: updatedStaff.assigned_classes?.map((c: any) => c.name) || [],
        assignedClassId: updatedStaff.assigned_classes?.[0]?.id?.toString(),
        assignedClassAcademicYearId: updatedStaff.assigned_classes?.[0]?.academic_year?.toString(),
        assignedSubjects: updatedStaff.subjects?.map((s: any) => s.name) || [],
        joiningDate: updatedStaff.joining_date,
        qualification: updatedStaff.qualification || '',
      };
    } catch (error) {
      console.error('Error in updateStaff API:', error);
      throw error;
    }
  },

  // Delete a staff member (management only)
  deleteStaff: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/staff/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete staff member' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
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
      assignedClassId: item.assigned_classes?.[0]?.id?.toString(),
      assignedClassAcademicYearId: item.assigned_classes?.[0]?.academic_year?.toString(),
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

// Classes API
export const classesApi = {
  getAll: async (): Promise<Class[]> => {
    const response = await fetch(`${API_BASE_URL}/classes/`, {
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<any>(response);

    // Handle paginated response
    const results = data.results || data;

    // Convert Django format to frontend format
    return results.map((item: any) => ({
      id: item.id.toString(),
      name: item.name,
      grade: item.grade,
      section: item.section,
      academicYear: item.academic_year_name,
      academicYearId: item.academic_year.toString(),
      classTeacher: item.class_teacher?.toString(),
      classTeacherName: item.class_teacher_name,
      studentCount: item.student_count || 0,
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