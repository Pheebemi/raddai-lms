/**
 * How a class's marks are split. Both schemes total 100, so totals, grades
 * and percentages work the same everywhere. Keep in sync with
 * score_limits_for_grade in the backend (core/models.py).
 *
 * - Pre-Nursery (Playclass) to Nursery 2 (class levels below 1):
 *   1st CA out of 20, 2nd CA out of 20, no 3rd CA, exam out of 60.
 * - Every other class: three CAs out of 10 each and an exam out of 70.
 */
export interface ScoreLimits {
  ca1: number;
  ca2: number;
  ca3: number; // 0 means this class has no 3rd CA
  exam: number;
}

export const isEarlyYearsGrade = (grade?: number | string | null): boolean => {
  const level = typeof grade === 'string' ? parseInt(grade, 10) : grade;
  return typeof level === 'number' && !Number.isNaN(level) && level < 1;
};

export const scoreLimitsForGrade = (grade?: number | string | null): ScoreLimits =>
  isEarlyYearsGrade(grade)
    ? { ca1: 20, ca2: 20, ca3: 0, exam: 60 }
    : { ca1: 10, ca2: 10, ca3: 10, exam: 70 };
