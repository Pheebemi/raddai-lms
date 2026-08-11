/**
 * Class levels for ADMISSIONS ONLY — Pre-Nursery through SS 3.
 *
 * Deliberately separate from CLASS_PRESETS on the classes management page:
 * that list drives creating real Class rows and is not ours to change. This
 * one is the fixed menu an applicant picks from, and the only place the
 * admissions fee table is enumerated.
 *
 * The `grade` numbers match ClassLevel in the Django backend. Levels only —
 * admissions never asks for a section (no "JSS 1A"); sections are assigned
 * on enrolment.
 */
export interface ClassLevel {
  label: string;
  grade: number;
}

export const CLASS_LEVELS: ClassLevel[] = [
  { label: 'Pre-Nursery', grade: -3 },
  { label: 'Nursery 1', grade: -2 },
  { label: 'Nursery 2', grade: -1 },
  { label: 'Primary 1', grade: 1 },
  { label: 'Primary 2', grade: 2 },
  { label: 'Primary 3', grade: 3 },
  { label: 'Primary 4', grade: 4 },
  { label: 'Primary 5', grade: 5 },
  { label: 'Primary 6', grade: 6 },
  { label: 'JSS 1', grade: 7 },
  { label: 'JSS 2', grade: 8 },
  { label: 'JSS 3', grade: 9 },
  { label: 'SS 1', grade: 10 },
  { label: 'SS 2', grade: 11 },
  { label: 'SS 3', grade: 12 },
];

export const classLevelLabel = (grade: number): string =>
  CLASS_LEVELS.find(level => level.grade === grade)?.label ?? `Grade ${grade}`;
