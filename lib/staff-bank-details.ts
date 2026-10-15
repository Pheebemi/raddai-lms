import { Staff, StaffSalary } from '@/types';

export interface StaffBankDetails {
  bankName: string;
  accountNumber: string;
}

/**
 * A staff member's bank details, by the same rule the Staff Salary page uses
 * for its account download: what was typed on a salary record wins, and the
 * staff profile fills in whatever is missing. With several salary records
 * (one per month) the most recently saved one that has the detail is used.
 */
export const bankDetailsFor = (member: Staff, salaries: StaffSalary[]): StaffBankDetails => {
  const mine = salaries
    .filter(salary => salary.staffId === member.id)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  return {
    bankName: mine.find(salary => salary.bankName)?.bankName || member.bankName || '',
    accountNumber: mine.find(salary => salary.accountNumber)?.accountNumber || member.accountNumber || '',
  };
};
