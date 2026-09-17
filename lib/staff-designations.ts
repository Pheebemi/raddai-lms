/**
 * Staff designations — must match Staff.Designation in the Django backend.
 * Single source of truth so the add/edit dialogs and any place a raw
 * designation value is displayed (staff table, salary voucher) show the
 * same label instead of the stored slug.
 */
export interface StaffDesignation {
  value: string;
  label: string;
}

export const STAFF_DESIGNATIONS: StaffDesignation[] = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'principal', label: 'Principal' },
  { value: 'vice_principal', label: 'Vice Principal' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'security', label: 'Security' },
  { value: 'director_clubs_society', label: 'Director Clubs & Society' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'head_teacher', label: 'Head Teacher' },
  { value: 'senior_master', label: 'Senior Master' },
  { value: 'health_mistress', label: 'Health Mistress' },
  { value: 'exams_master', label: 'Exams Master' },
  { value: 'ict_hod', label: 'ICT HOD' },
  { value: 'hod_science', label: 'HOD Science' },
  { value: 'barrister', label: 'Barrister' },
];

export const designationLabel = (value: string): string =>
  STAFF_DESIGNATIONS.find(d => d.value === value)?.label ?? value;
