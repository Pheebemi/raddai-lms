/**
 * Static reference content for the printed admission form — transcribed
 * verbatim from the school's paper admission letters (Nursery/Primary, JSS,
 * SSS). Fixed by design: these are the school's own printed fee schedules,
 * not the configurable application fee (that comes from AdmissionFee).
 */

export type LevelBucket = 'nursery_primary' | 'jss' | 'sss';

export function levelBucket(level: number): LevelBucket {
  if (level <= 6) return 'nursery_primary';
  if (level <= 9) return 'jss';
  return 'sss';
}

export interface FeeRow {
  label: string;
  period?: string;
  amount: string;
  bold?: boolean;
}

export interface TotalRow {
  label: string;
  amount: string;
}

export interface FeeSchedule {
  schoolName: string;
  items: FeeRow[];
  totalsTitle: string;
  totals: TotalRow[];
  bankAccount: string;
  bankName: string;
  notes: string[];
  textbooksTitle: string;
  textbooks: string[];
  rules: string[];
}

const RULES = [
  'Pupils/Students must always abide by the rules and regulations of the school.',
  'They will always obey all lawful instruction(s) given by those placed in position of authority over them and show due respect.',
  'Pupils/Students are expected to report to the school premises before 7:30am from Monday to Friday.',
  'The school uniform must be purchased from the school.',
  'All pupils/students should also be aware that bullying, flogging of other pupil(s), fighting, stealing, hooliganism, writing on the school wall, willful destruction of school or other people’s property, drug abuse or addiction, bond breaking, truancy, failure to obey lawful instructions and involvement in any cultic activity are all considered serious offences in the school.',
  'The school will by no means accept parents’ attitudes of challenging the staff, e.g. insulting, fighting, taking a case to court or police station, etc. without consulting the management. Any pupil/student who engages in any of these acts will face a severe disciplinary action, including expulsion from the school.',
];

const SCHEDULES: Record<LevelBucket, FeeSchedule> = {
  nursery_primary: {
    schoolName: 'Laazeere Academy Nursery and Primary School',
    items: [
      { label: 'File Jacket', period: 'Per Annum', amount: '₦800' },
      { label: 'P.E. Uniform', period: 'Per Annum', amount: '₦3,500' },
      { label: 'School Uniform', period: 'Per Annum', amount: '₦4,000' },
      { label: 'Report Card', period: 'Per Annum', amount: '₦800' },
      { label: 'School Badge', period: 'Per Annum', amount: '₦200' },
      { label: 'Subtotal', amount: '₦9,300', bold: true },
      { label: 'Health Fee', period: 'Per Annum', amount: '₦400' },
      { label: 'Games Fee', period: 'Per Annum', amount: '₦300' },
      { label: 'Toiletries', period: 'Per Term', amount: '₦300' },
      { label: 'Exam Fee', period: 'Per Term', amount: '₦700' },
      { label: 'Tuition Fees', period: 'Per Term', amount: '₦11,000' },
      { label: 'Lesson / Furniture Fee', period: 'Per Term', amount: '₦3,000' },
      { label: 'Computer / Television Fee', period: 'Per Term', amount: '₦500' },
      { label: 'P.T.A Levy', period: 'Per Annum', amount: '₦500' },
      { label: 'Subtotal', amount: '₦16,700', bold: true },
      { label: 'Grand Total', amount: '₦26,000', bold: true },
    ],
    totalsTitle: 'Summary of fees',
    totals: [
      { label: 'New Intake', amount: '₦26,000' },
      { label: 'Returning Pupils — Primary & Nursery (1st Term)', amount: '₦14,700' },
      { label: 'Returning Pupils — Primary & Nursery (2nd & 3rd Term)', amount: '₦14,200' },
      { label: 'New Intake — Play Class', amount: '₦24,000' },
      { label: 'Returning Pupils — Play Class (2nd & 3rd Term)', amount: '₦12,700' },
    ],
    bankAccount: '1013517718',
    bankName: 'Zenith Bank',
    notes: [
      'Candidates are to bring along a Ream of A4 Paper during registration.',
      'Brown sandals and white socks.',
    ],
    textbooksTitle: 'Text books for primary pupils',
    textbooks: [
      'Mathematics (Compulsory)',
      'English Language (Compulsory)',
      'Basic Science and Technology (BST)',
      'Religion and National Value (RNV)',
      'Pre-vocational Studies (PV)',
      'Hand Writing',
    ],
    rules: RULES,
  },
  jss: {
    schoolName: 'Laazeere Academy Secondary School',
    items: [
      { label: 'File Jacket', period: 'Per Annum', amount: '₦800' },
      { label: 'Continuous Assessment Dossier', period: 'Per Annum', amount: '₦800' },
      { label: 'I.D Card', period: 'Per Annum', amount: '₦500' },
      { label: 'School Badge', period: 'Per Annum', amount: '₦200' },
      { label: 'School Uniform, Jacket and Sewing', period: 'Per Annum', amount: '₦5,000' },
      { label: 'House Ware', period: 'Per Annum', amount: '₦3,500' },
      { label: 'School Beret', period: 'Per Annum', amount: '₦3,000' },
      { label: 'Games Fee', period: 'Per Term', amount: '₦300' },
      { label: 'Guidance and Counseling', period: 'Per Term', amount: '₦200' },
      { label: 'Health Fee', period: 'Per Term', amount: '₦400' },
      { label: 'Exam Fee', period: 'Per Term', amount: '₦700' },
      { label: 'Toiletries', period: 'Per Term', amount: '₦300' },
      { label: 'Furniture', period: 'Per Term', amount: '₦600' },
      { label: 'P.T.A Levy', period: 'Per Annum', amount: '₦500' },
      { label: 'Tuition Fees', period: 'Per Term', amount: '₦14,100' },
      { label: 'Bow Tie', amount: '₦400' },
    ],
    totalsTitle: 'Total fees for new intake',
    totals: [
      { label: 'Girls', amount: '₦30,400' },
      { label: 'Boys', amount: '₦27,400' },
      { label: 'Returning Students — 1st Term', amount: '₦15,500' },
      { label: 'Returning Students — 2nd & 3rd Terms', amount: '₦15,000' },
    ],
    bankAccount: '1013517718',
    bankName: 'Zenith Bank',
    notes: [
      'Candidates are to bring along a Ream of A4 Paper during registration.',
      'Writing and reading materials: Dictionary (Longman), Mathematical set, Ruler, 15 exercise books (60 or 80 leaves), and Holy Bible (Revised Standard Version) or Holy Qur’an.',
    ],
    textbooksTitle: 'Text books for JSS I, II and III (depending on the class)',
    textbooks: [
      'New General Mathematics for Junior Secondary School (Compulsory)',
      'Intensive English, Third Edition (Compulsory)',
      'New General Integrated Science (Compulsory)',
      'Basic Technology, CESAC (Compulsory)',
      'Footwear: black cover shoe for both boys and girls',
      'Novel for literature students',
    ],
    rules: RULES,
  },
  sss: {
    schoolName: 'Laazeere Academy Secondary School',
    items: [
      { label: 'Continuous Assessment Dossier', period: 'Per Annum', amount: '₦800' },
      { label: 'File Jacket', period: 'Per Annum', amount: '₦800' },
      { label: 'I.D Card', period: 'Per Annum', amount: '₦500' },
      { label: 'School Badge', period: 'Per Annum', amount: '₦200' },
      { label: 'School Uniform and Sewing', period: 'Per Annum', amount: '₦5,000' },
      { label: 'House Wear', period: 'Per Annum', amount: '₦3,500' },
      { label: 'School Beret', period: 'Per Annum', amount: '₦3,000' },
      { label: 'Games Fee', period: 'Per Term', amount: '₦300' },
      { label: 'Guidance and Counseling', period: 'Per Term', amount: '₦200' },
      { label: 'Health Fee', period: 'Per Term', amount: '₦400' },
      { label: 'Exam Fee', period: 'Per Term', amount: '₦700' },
      { label: 'Toiletries', period: 'Per Term', amount: '₦300' },
      { label: 'Furniture', period: 'Per Term', amount: '₦600' },
      { label: 'P.T.A Levy', period: 'Per Annum', amount: '₦500' },
      { label: 'Tuition Fee', period: 'Per Term', amount: '₦14,100' },
      { label: 'Computer Charges', period: 'Per Term', amount: '₦1,000' },
      { label: 'Practical (Science students only)', amount: '₦2,500' },
      { label: 'Field Trip (Science & Art students)', amount: '₦1,500' },
      { label: 'Neck Tie', amount: '₦600' },
    ],
    totalsTitle: 'Total fees for new intake',
    totals: [
      { label: 'Science Class — Girls', amount: '₦36,500' },
      { label: 'Science Class — Boys', amount: '₦33,500' },
      { label: 'Art Class — Girls', amount: '₦33,800' },
      { label: 'Art Class — Boys', amount: '₦30,800' },
      { label: 'Returning, Science — 1st Term', amount: '₦21,700' },
      { label: 'Returning, Science — 2nd & 3rd Term', amount: '₦21,200' },
      { label: 'Returning, Art — 1st Term', amount: '₦19,200' },
      { label: 'Returning, Art — 2nd & 3rd Term', amount: '₦18,700' },
    ],
    bankAccount: '1013517718',
    bankName: 'Zenith Bank',
    notes: [
      'Candidates are to bring along a Ream of A4 Paper during registration.',
      'Writing and reading materials: Dictionary (Longman), Mathematical set, Ruler, 15 exercise books (60 or 80 leaves), and Holy Bible (Revised Standard Version) or Holy Qur’an.',
    ],
    textbooksTitle: 'Text books for SS I, II and III (depending on the class)',
    textbooks: [
      'New General Mathematics (Compulsory)',
      'Intensive English (Compulsory)',
      'Chemistry (Compulsory)',
      'Physics (Compulsory)',
      'Biology (Compulsory)',
      'T-Square / Drawing Board',
      'Novels for literature students',
      'Footwear: black cover shoe for both boys and girls',
    ],
    rules: RULES,
  },
};

export function getFeeSchedule(level: number): FeeSchedule {
  return SCHEDULES[levelBucket(level)];
}
