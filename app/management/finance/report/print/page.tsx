'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { classesApi, feesApi, feeStructureApi, fetchAcademicYears, usersApi } from '@/lib/api';
import {
  PAY_STATE_LABEL,
  TERM_LABEL,
  Term,
  buildPaymentRows,
  studentName,
} from '@/lib/class-payment-status';
import { Class, FeeStructure, FeeTransaction, Student } from '@/types';
import { Loader2, Printer, AlertCircle } from 'lucide-react';

const naira = (value: number) => `₦${value.toLocaleString()}`;
const TERMS: Term[] = ['first', 'second', 'third'];
const cell = 'border border-neutral-400 px-2 py-1.5';
const head = `${cell} bg-neutral-100`;

interface Data {
  classes: Class[];
  students: Student[];
  transactions: FeeTransaction[];
  structures: FeeStructure[];
  yearName: string;
  yearId: string;
}

const studentsOf = (data: Data, cls: Class) => data.students.filter(s => s.classId === cls.id);

function Outstanding({ data, term, classId }: { data: Data; term: Term; classId: string }) {
  const classes = data.classes.filter(c => classId === 'all' || c.id === classId);
  const sections = classes
    .map(cls => ({
      cls,
      rows: buildPaymentRows(studentsOf(data, cls), cls.grade, term, data.yearId, data.transactions, data.structures)
        .filter(r => r.state !== 'paid'),
    }))
    .filter(section => section.rows.length > 0);
  const all = sections.flatMap(s => s.rows);
  const owed = all.reduce((sum, r) => sum + (r.balance ?? 0), 0);
  const noFee = all.filter(r => r.balance == null).length;

  return {
    title: `Outstanding Fees: ${TERM_LABEL[term]} · ${data.yearName}${classId !== 'all' ? ` · ${classes[0]?.name ?? ''}` : ''}`,
    summary: `${all.length} student${all.length === 1 ? '' : 's'} owing · Total outstanding ${naira(owed)}`,
    body: (
      <>
        {sections.map(({ cls, rows }) => (
          <section key={cls.id} className="mb-6 print:break-inside-avoid-page">
            <h3 className="font-semibold mb-1">
              {cls.name} <span className="font-normal text-neutral-600">({rows.length} owing)</span>
            </h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className={`${head} w-12 text-center`}>S/N</th>
                  <th className={`${head} text-left`}>Name</th>
                  <th className={`${head} text-left`}>Student ID</th>
                  <th className={`${head} text-left`}>Status</th>
                  <th className={`${head} text-right`}>Paid</th>
                  <th className={`${head} text-right`}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.student.id} className="print:break-inside-avoid">
                    <td className={`${cell} text-center`}>{i + 1}</td>
                    <td className={cell}>{studentName(r.student)}</td>
                    <td className={`${cell} font-mono`}>{r.student.studentId}</td>
                    <td className={cell}>{PAY_STATE_LABEL[r.state]}</td>
                    <td className={`${cell} text-right`}>{naira(r.paid)}</td>
                    <td className={`${cell} text-right`}>{r.balance != null ? naira(r.balance) : '—'}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td colSpan={5} className={`${cell} text-right bg-neutral-100`}>Class total</td>
                  <td className={`${cell} text-right bg-neutral-100`}>
                    {naira(rows.reduce((sum, r) => sum + (r.balance ?? 0), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        ))}
        {sections.length === 0 && <p className="text-center text-neutral-500 py-8">Nobody owes fees for this term.</p>}
        {noFee > 0 && (
          <p className="text-xs text-neutral-600">
            {noFee} student{noFee === 1 ? ' has' : 's have'} no fee set up for their class, so their balance shows “—” and is not in the totals.
          </p>
        )}
      </>
    ) as ReactNode,
  };
}

function Revenue({ data }: { data: Data }) {
  const rows = data.classes.map(cls => {
    const students = studentsOf(data, cls);
    const perTerm = TERMS.map(term => {
      const built = buildPaymentRows(students, cls.grade, term, data.yearId, data.transactions, data.structures);
      return {
        collected: built.reduce((sum, r) => sum + r.paid, 0),
        owed: built.reduce((sum, r) => sum + (r.balance ?? 0), 0),
      };
    });
    return { cls, count: students.length, perTerm };
  });
  const col = (i: number) => rows.reduce((sum, r) => sum + r.perTerm[i].collected, 0);
  const total = [0, 1, 2].reduce((sum, i) => sum + col(i), 0);
  const owed = rows.reduce((sum, r) => sum + r.perTerm.reduce((s, t) => s + t.owed, 0), 0);

  return {
    title: `Revenue Report: ${data.yearName}`,
    summary: `Collected ${naira(total)} · Still outstanding ${naira(owed)}`,
    body: (
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className={`${head} text-left`}>Class</th>
            <th className={`${head} text-right`}>Students</th>
            {TERMS.map(t => (
              <th key={t} className={`${head} text-right`}>{TERM_LABEL[t]}</th>
            ))}
            <th className={`${head} text-right`}>Total collected</th>
            <th className={`${head} text-right`}>Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.cls.id} className="print:break-inside-avoid">
              <td className={cell}>{r.cls.name}</td>
              <td className={`${cell} text-right`}>{r.count}</td>
              {r.perTerm.map((t, i) => (
                <td key={i} className={`${cell} text-right`}>{naira(t.collected)}</td>
              ))}
              <td className={`${cell} text-right font-semibold`}>
                {naira(r.perTerm.reduce((s, t) => s + t.collected, 0))}
              </td>
              <td className={`${cell} text-right`}>{naira(r.perTerm.reduce((s, t) => s + t.owed, 0))}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className={`${cell} bg-neutral-100`}>Total</td>
            <td className={`${cell} bg-neutral-100 text-right`}>{rows.reduce((s, r) => s + r.count, 0)}</td>
            {[0, 1, 2].map(i => (
              <td key={i} className={`${cell} bg-neutral-100 text-right`}>{naira(col(i))}</td>
            ))}
            <td className={`${cell} bg-neutral-100 text-right`}>{naira(total)}</td>
            <td className={`${cell} bg-neutral-100 text-right`}>{naira(owed)}</td>
          </tr>
        </tbody>
      </table>
    ) as ReactNode,
  };
}

function Monthly({ data, month }: { data: Data; month: string }) {
  const classOf = new Map(data.students.map(s => [s.id, data.classes.find(c => c.id === s.classId)?.name || '—']));
  const rows = data.transactions
    .filter(t => String(t.academicYearId) === data.yearId && t.amount > 0 && (t.paymentDate || '').slice(0, 7) === month)
    .sort((a, b) => (a.paymentDate || '').localeCompare(b.paymentDate || ''));
  const total = rows.reduce((sum, t) => sum + t.amount, 0);
  const label = new Date(`${month}-01T00:00:00`).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });

  return {
    title: `Monthly Report: ${label}`,
    summary: `${rows.length} payment${rows.length === 1 ? '' : 's'} · Total ${naira(total)}`,
    body: (
      <>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className={`${head} w-12 text-center`}>S/N</th>
              <th className={`${head} text-left`}>Date</th>
              <th className={`${head} text-left`}>Student</th>
              <th className={`${head} text-left`}>Class</th>
              <th className={`${head} text-left`}>Term</th>
              <th className={`${head} text-left`}>Method</th>
              <th className={`${head} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={t.id} className="print:break-inside-avoid">
                <td className={`${cell} text-center`}>{i + 1}</td>
                <td className={cell}>{t.paymentDate ? new Date(t.paymentDate).toLocaleDateString('en-NG') : '—'}</td>
                <td className={cell}>{t.studentName || t.studentId}</td>
                <td className={cell}>{classOf.get(t.studentId) || '—'}</td>
                <td className={cell}>{t.term ? TERM_LABEL[t.term] : '—'}</td>
                <td className={cell}>{t.paymentMethod || '—'}</td>
                <td className={`${cell} text-right`}>{naira(t.amount)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className={`${cell} py-6 text-center text-neutral-500`}>No payments recorded in this month.</td>
              </tr>
            )}
            {rows.length > 0 && (
              <tr className="font-semibold">
                <td colSpan={6} className={`${cell} text-right bg-neutral-100`}>Total</td>
                <td className={`${cell} text-right bg-neutral-100`}>{naira(total)}</td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="text-xs text-neutral-600 mt-3">
          Each payment is listed under the date it was first recorded. Later part-payments toward the same term are included in that amount.
        </p>
      </>
    ) as ReactNode,
  };
}

function FinanceReportPrint() {
  const [data, setData] = useState<Data | null>(null);
  const [params, setParams] = useState<URLSearchParams | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setParams(q);
    const yearId = q.get('year') || '';
    Promise.all([classesApi.getAll(), usersApi.getStudents(), feesApi.getPayments(), feeStructureApi.getAll(), fetchAcademicYears()])
      .then(([classes, students, transactions, structures, years]) => {
        setData({
          classes: classes
            .filter(c => String(c.academicYearId) === yearId)
            .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name)),
          students,
          transactions,
          structures,
          yearName: years.find((y: any) => String(y.id) === yearId)?.name || '',
          yearId,
        });
      })
      .catch(err => setError(err.message || 'Could not load the report.'));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-3" />
          <p className="font-semibold">We could not load the report</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Link href="/management/finance" className="text-sm text-primary hover:underline mt-3 inline-block">
            Back to finance
          </Link>
        </div>
      </div>
    );
  }

  if (!data || !params) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  const type = params.get('type');
  const term = (params.get('term') as Term) in TERM_LABEL ? (params.get('term') as Term) : 'first';
  const month = /^\d{4}-\d{2}$/.test(params.get('month') || '') ? (params.get('month') as string) : new Date().toISOString().slice(0, 7);
  const report =
    type === 'monthly'
      ? Monthly({ data, month })
      : type === 'revenue'
        ? Revenue({ data })
        : Outstanding({ data, term, classId: params.get('class') || 'all' });

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 14mm; size: A4; }
          body { background: white; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/management/finance" className="text-sm text-muted-foreground hover:text-primary">
            Finance
          </Link>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white text-black p-8 sm:p-10 my-6 print:my-0 shadow-sm print:shadow-none">
        <header className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center justify-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Laazeere Academy" className="w-20 h-20 object-contain shrink-0" />
            <div className="text-center">
              <h1 className="text-2xl font-bold uppercase tracking-wide leading-tight">Laazeere Academy</h1>
              <p className="text-xs italic">Education is Power</p>
              <p className="text-xs mt-1">Samunaka Sabon Gari, Jalingo, Taraba State, Nigeria</p>
              <p className="text-xs">08066115707, 09060405589, 08039305511 · info@laazeereacademy.com</p>
            </div>
          </div>
          <h2 className="text-base font-semibold mt-4 uppercase text-center border-t border-neutral-300 pt-3">
            {report.title}
          </h2>
        </header>

        <div className="flex justify-between text-sm mb-4">
          <p><strong>{report.summary}</strong></p>
          <p>
            <strong>Printed:</strong>{' '}
            {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {report.body}
      </div>
    </div>
  );
}

export default function FinanceReportPrintPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'admin']}>
      <FinanceReportPrint />
    </ProtectedRoute>
  );
}
