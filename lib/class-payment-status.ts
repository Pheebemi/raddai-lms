import { FeeStructure, FeeTransaction, Student } from '@/types';

export type Term = 'first' | 'second' | 'third';
export type PayState = 'paid' | 'partial' | 'unpaid';

export const TERM_LABEL: Record<Term, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term',
};

export const PAY_STATE_LABEL: Record<PayState, string> = {
  paid: 'Paid',
  partial: 'Part paid',
  unpaid: 'Not paid',
};

export interface PaymentRow {
  student: Student;
  paid: number;
  fee: number | null;
  balance: number | null;
  state: PayState;
}

export const studentName = (student: Student) => `${student.user.firstName} ${student.user.lastName}`.trim();

// Mirrors the server's tuition lookup (most specific rate wins) so a student with
// no payment yet still shows the fee they owe.
export const tuitionFor = (
  student: Student,
  grade: number,
  yearId: string,
  structures: FeeStructure[]
): number | null => {
  const pick = (studentType: string) =>
    structures
      .filter(s =>
        s.feeType === 'tuition' &&
        s.academicYearId === yearId &&
        s.grade === grade &&
        s.studentType === studentType &&
        ((s.gender === (student.gender || '') && s.department === (student.department || '')) ||
          (!s.gender && !s.department)) &&
        (!s.section || s.section === student.section)
      )
      .sort((a, b) =>
        Number(!!b.section) - Number(!!a.section) ||
        Number(!!b.gender) - Number(!!a.gender) ||
        Number(!!b.department) - Number(!!a.department)
      )[0];

  const type = student.studentType || 'new';
  const found = pick(type) || (type === 'returning' ? pick('new') : undefined);
  return found ? found.amount : null;
};

/** One row per student in the class for the chosen term and academic year, A–Z by name. */
export const buildPaymentRows = (
  students: Student[],
  grade: number,
  term: Term,
  yearId: string,
  transactions: FeeTransaction[],
  feeStructures: FeeStructure[]
): PaymentRow[] =>
  [...students]
    .sort((a, b) => studentName(a).localeCompare(studentName(b)))
    .map(student => {
      const record = transactions.find(
        t => t.studentId === student.id && t.term === term && t.academicYearId === yearId
      );
      const paid = record?.amount ?? 0;
      const fee = record?.totalAmount || tuitionFor(student, grade, yearId, feeStructures);
      let state: PayState = 'unpaid';
      if (record && (record.status === 'paid' || (fee && paid >= fee))) state = 'paid';
      else if (paid > 0) state = 'partial';
      return { student, paid, fee, state, balance: fee != null ? Math.max(fee - paid, 0) : null };
    });

export const filterPaymentRows = (rows: PaymentRow[], status: 'all' | PayState, search: string): PaymentRow[] => {
  const q = search.trim().toLowerCase();
  return rows.filter(r => {
    if (status !== 'all' && r.state !== status) return false;
    if (q && !studentName(r.student).toLowerCase().includes(q) && !r.student.studentId.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
};
