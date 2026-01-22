import { User, Student, Staff, Parent, Subject, Result, FeeStructure, FeeTransaction, Announcement, AttendanceRecord, UserRole } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  // Admin
  {
    id: 'admin-1',
    email: 'admin@school.edu',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    avatar: '/avatars/admin.jpg',
    phone: '+1234567890',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  // Management
  {
    id: 'mgmt-1',
    email: 'principal@school.edu',
    firstName: 'John',
    lastName: 'Smith',
    role: 'management',
    avatar: '/avatars/principal.jpg',
    phone: '+1234567891',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  // Staff
  {
    id: 'staff-1',
    email: 'teacher1@school.edu',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'staff',
    avatar: '/avatars/sarah.jpg',
    phone: '+1234567892',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'staff-2',
    email: 'teacher2@school.edu',
    firstName: 'Mike',
    lastName: 'Davis',
    role: 'staff',
    avatar: '/avatars/mike.jpg',
    phone: '+1234567893',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  // Students
  {
    id: 'student-1',
    email: 'alice.student@school.edu',
    firstName: 'Alice',
    lastName: 'Brown',
    role: 'student',
    avatar: '/avatars/alice.jpg',
    phone: '+1234567894',
    dateOfBirth: '2008-05-15',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'student-2',
    email: 'bob.student@school.edu',
    firstName: 'Bob',
    lastName: 'Wilson',
    role: 'student',
    avatar: '/avatars/bob.jpg',
    phone: '+1234567895',
    dateOfBirth: '2008-08-20',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'student-3',
    email: 'charlie.student@school.edu',
    firstName: 'Charlie',
    lastName: 'Miller',
    role: 'student',
    avatar: '/avatars/charlie.jpg',
    phone: '+1234567896',
    dateOfBirth: '2008-03-10',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  // Parents
  {
    id: 'parent-1',
    email: 'parent1@email.com',
    firstName: 'David',
    lastName: 'Brown',
    role: 'parent',
    avatar: '/avatars/david.jpg',
    phone: '+1234567897',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'parent-2',
    email: 'parent2@email.com',
    firstName: 'Emma',
    lastName: 'Wilson',
    role: 'parent',
    avatar: '/avatars/emma.jpg',
    phone: '+1234567898',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock Students
export const mockStudents: Student[] = [
  {
    id: 'student-1',
    user: mockUsers[4],
    studentId: 'STU001',
    class: '10',
    section: 'A',
    rollNumber: 1,
    parentId: 'parent-1',
    admissionDate: '2023-06-01',
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'David Brown',
      relationship: 'Father',
      phone: '+1234567897',
    },
  },
  {
    id: 'student-2',
    user: mockUsers[5],
    studentId: 'STU002',
    class: '10',
    section: 'A',
    rollNumber: 2,
    parentId: 'parent-2',
    admissionDate: '2023-06-01',
    bloodGroup: 'A+',
    emergencyContact: {
      name: 'Emma Wilson',
      relationship: 'Mother',
      phone: '+1234567898',
    },
  },
  {
    id: 'student-3',
    user: mockUsers[6],
    studentId: 'STU003',
    class: '10',
    section: 'B',
    rollNumber: 1,
    parentId: 'parent-1',
    admissionDate: '2023-06-01',
    bloodGroup: 'B+',
    emergencyContact: {
      name: 'David Brown',
      relationship: 'Father',
      phone: '+1234567897',
    },
  },
];

// Mock Staff
export const mockStaff: Staff[] = [
  {
    id: 'staff-1',
    user: mockUsers[2],
    staffId: 'STF001',
    designation: 'Mathematics Teacher',
    department: 'Mathematics',
    assignedClasses: ['9', '10'],
    assignedSubjects: ['Mathematics'],
    joiningDate: '2022-01-15',
    salary: 50000,
    qualification: 'M.Sc Mathematics, B.Ed',
  },
  {
    id: 'staff-2',
    user: mockUsers[3],
    staffId: 'STF002',
    designation: 'Science Teacher',
    department: 'Science',
    assignedClasses: ['9', '10'],
    assignedSubjects: ['Physics', 'Chemistry', 'Biology'],
    joiningDate: '2022-03-01',
    salary: 48000,
    qualification: 'M.Sc Chemistry, B.Ed',
  },
];

// Mock Parents
export const mockParents: Parent[] = [
  {
    id: 'parent-1',
    user: mockUsers[7],
    children: [mockStudents[0], mockStudents[2]],
    occupation: 'Software Engineer',
    income: 80000,
  },
  {
    id: 'parent-2',
    user: mockUsers[8],
    children: [mockStudents[1]],
    occupation: 'Teacher',
    income: 45000,
  },
];

// Mock Subjects
export const mockSubjects: Subject[] = [
  {
    id: 'sub-1',
    name: 'Mathematics',
    code: 'MATH101',
    class: '10',
    teacherId: 'staff-1',
    description: 'Advanced Mathematics including Algebra, Geometry, and Calculus',
  },
  {
    id: 'sub-2',
    name: 'Physics',
    code: 'PHY101',
    class: '10',
    teacherId: 'staff-2',
    description: 'Physics fundamentals including Mechanics and Thermodynamics',
  },
  {
    id: 'sub-3',
    name: 'Chemistry',
    code: 'CHEM101',
    class: '10',
    teacherId: 'staff-2',
    description: 'Chemistry covering Organic and Inorganic Chemistry',
  },
  {
    id: 'sub-4',
    name: 'English',
    code: 'ENG101',
    class: '10',
    teacherId: 'staff-1',
    description: 'English Literature and Language',
  },
];

// Mock Results
export const mockResults: Result[] = [
  {
    id: 'result-1',
    studentId: 'student-1',
    subjectId: 'sub-1',
    term: 'Term 1',
    academicYear: '2023-2024',
    marks: 85,
    maxMarks: 100,
    grade: 'A',
    remarks: 'Excellent performance',
    teacherId: 'staff-1',
    createdAt: '2023-12-15T00:00:00Z',
    updatedAt: '2023-12-15T00:00:00Z',
  },
  {
    id: 'result-2',
    studentId: 'student-1',
    subjectId: 'sub-2',
    term: 'Term 1',
    academicYear: '2023-2024',
    marks: 78,
    maxMarks: 100,
    grade: 'B+',
    remarks: 'Good understanding of concepts',
    teacherId: 'staff-2',
    createdAt: '2023-12-15T00:00:00Z',
    updatedAt: '2023-12-15T00:00:00Z',
  },
  {
    id: 'result-3',
    studentId: 'student-2',
    subjectId: 'sub-1',
    term: 'Term 1',
    academicYear: '2023-2024',
    marks: 92,
    maxMarks: 100,
    grade: 'A+',
    remarks: 'Outstanding performance',
    teacherId: 'staff-1',
    createdAt: '2023-12-15T00:00:00Z',
    updatedAt: '2023-12-15T00:00:00Z',
  },
];

// Mock Fee Structures
export const mockFeeStructures: FeeStructure[] = [
  {
    id: 'fee-1',
    name: 'Tuition Fee',
    amount: 5000,
    frequency: 'monthly',
    description: 'Monthly tuition fee for regular classes',
    dueDate: '2024-01-05',
  },
  {
    id: 'fee-2',
    name: 'Examination Fee',
    amount: 1000,
    frequency: 'quarterly',
    description: 'Fee for term examinations',
    dueDate: '2024-01-15',
  },
  {
    id: 'fee-3',
    name: 'Transportation Fee',
    amount: 1500,
    frequency: 'monthly',
    description: 'School bus transportation fee',
    dueDate: '2024-01-05',
  },
];

// Mock Fee Transactions
export const mockFeeTransactions: FeeTransaction[] = [
  {
    id: 'txn-1',
    studentId: 'student-1',
    feeStructureId: 'fee-1',
    amount: 5000,
    status: 'paid',
    paymentDate: '2024-01-03',
    dueDate: '2024-01-05',
    paymentMethod: 'Online',
    transactionId: 'TXN001',
  },
  {
    id: 'txn-2',
    studentId: 'student-1',
    feeStructureId: 'fee-2',
    amount: 1000,
    status: 'pending',
    dueDate: '2024-01-15',
  },
  {
    id: 'txn-3',
    studentId: 'student-2',
    feeStructureId: 'fee-1',
    amount: 5000,
    status: 'overdue',
    dueDate: '2024-01-05',
  },
];

// Mock Announcements
export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'School Holiday Notice',
    content: 'School will remain closed on Monday, January 15th due to Republic Day celebrations. Classes will resume on Tuesday, January 16th.',
    type: 'general',
    priority: 'high',
    targetRoles: ['student', 'parent', 'staff'],
    createdBy: 'mgmt-1',
    createdAt: '2024-01-10T00:00:00Z',
    expiresAt: '2024-01-16T00:00:00Z',
  },
  {
    id: 'ann-2',
    title: 'Term 1 Results Published',
    content: 'Term 1 examination results for Class 10 have been published. Students can view their results through the student portal.',
    type: 'academic',
    priority: 'medium',
    targetRoles: ['student', 'parent'],
    targetClasses: ['10'],
    createdBy: 'staff-1',
    createdAt: '2023-12-20T00:00:00Z',
  },
  {
    id: 'ann-3',
    title: 'Fee Payment Reminder',
    content: 'Monthly tuition fees for January 2024 are due by January 5th. Please ensure timely payment to avoid late fees.',
    type: 'fee',
    priority: 'high',
    targetRoles: ['parent'],
    createdBy: 'mgmt-1',
    createdAt: '2024-01-01T00:00:00Z',
    expiresAt: '2024-01-06T00:00:00Z',
  },
];

// Mock Attendance Records
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-1',
    studentId: 'student-1',
    date: '2024-01-10',
    status: 'present',
    class: '10',
    subject: 'Mathematics',
    markedBy: 'staff-1',
  },
  {
    id: 'att-2',
    studentId: 'student-1',
    date: '2024-01-09',
    status: 'present',
    class: '10',
    subject: 'Physics',
    markedBy: 'staff-2',
  },
  {
    id: 'att-3',
    studentId: 'student-2',
    date: '2024-01-10',
    status: 'late',
    class: '10',
    subject: 'Mathematics',
    markedBy: 'staff-1',
    remarks: 'Arrived 15 minutes late',
  },
];

// Login credentials for testing
export const mockCredentials = {
  admin: { email: 'admin@school.edu', password: 'admin123' },
  management: { email: 'principal@school.edu', password: 'principal123' },
  staff: { email: 'teacher1@school.edu', password: 'teacher123' },
  student: { email: 'alice.student@school.edu', password: 'student123' },
  parent: { email: 'parent1@email.com', password: 'parent123' },
};

// Helper function to get user by role
export const getMockUserByRole = (role: UserRole): User | undefined => {
  return mockUsers.find(user => user.role === role);
};

// Helper function to get student by user ID
export const getMockStudentByUserId = (userId: string): Student | undefined => {
  return mockStudents.find(student => student.user.id === userId);
};

// Helper function to get staff by user ID
export const getMockStaffByUserId = (userId: string): Staff | undefined => {
  return mockStaff.find(staff => staff.user.id === userId);
};

// Helper function to get parent by user ID
export const getMockParentByUserId = (userId: string): Parent | undefined => {
  return mockParents.find(parent => parent.user.id === userId);
};

// Helper function to get results by student ID
export const getMockResultsByStudentId = (studentId: string): Result[] => {
  return mockResults.filter(result => result.studentId === studentId);
};

// Helper function to get fee transactions by student ID
export const getMockFeeTransactionsByStudentId = (studentId: string): FeeTransaction[] => {
  return mockFeeTransactions.filter(txn => txn.studentId === studentId);
};