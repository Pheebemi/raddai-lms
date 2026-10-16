'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { classesApi, feesApi, feeStructureApi, fetchAcademicYears, usersApi } from '@/lib/api';
import {
  PAY_STATE_LABEL,
  PayState,
  PaymentRow,
  TERM_LABEL,
  Term,
  buildPaymentRows,
  filterPaymentRows,
  studentName,
} from '@/lib/class-payment-status';
import { Loader2, Printer, AlertCircle } from 'lucide-react';

const naira = (value: number) => `₦${value.toLocaleString()}`;

/**
 * Printable "who has paid" list for one class and term, same layout as the
 * staff and class lists. The Finance page's By Class tab passes what is on
 * screen in the address (?class=&term=&year=&status=&q=) so the printout
 * matches. "Print" opens the browser's print dialog, which can save as a PDF.
 */
function ClassStatusPrint() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [className, setClassName] = useState('');
  const [yearName, setYearName] = useState('');
  const [term, setTerm] = useState<Term>('first');
  const [status, setStatus] = useState<'all' | PayState>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const classId = params.get('class') || '';
    const wantedTerm = (params.get('term') as Term) in TERM_LABEL ? (params.get('term') as Term) : 'first';
    const yearId = params.get('year') || '';
    const wantedStatus = params.get('status') as PayState | null;
    const wantedQuery = (params.get('q') || '').trim();
    const statusFilter = wantedStatus && wantedStatus in PAY_STATE_LABEL ? wantedStatus : 'all';
    setTerm(wantedTerm);
    setStatus(statusFilter);
    setQuery(wantedQuery);

    Promise.all([
      classesApi.getAll(),
      usersApi.getStudents(classId),
      feesApi.getPayments(),
      feeStructureApi.getAll(),
      fetchAcademicYears(),
    ])
      .then(([classes, students, transactions, structures, years]) => {
        const cls = classes.find(c => c.id === classId);
        if (!cls) throw new Error('That class could not be found.');
        setClassName(cls.name);
        setYearName(years.find((y: any) => String(y.id) === yearId)?.name || cls.academicYear || '');
        const all = buildPaymentRows(students, cls.grade, wantedTerm, yearId, transactions, structures);
        setRows(filterPaymentRows(all, statusFilter, wantedQuery));
      })
      .catch(err => setError(err.message || 'Could not load the payment list.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-3" />
          <p className="font-semibold">We could not load the payment list</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Link href="/management/finance" className="text-sm text-primary hover:underline mt-3 inline-block">
            Back to finance
          </Link>
        </div>
      </div>
    );
  }

  const subtitle = [
    status !== 'all' ? PAY_STATE_LABEL[status] : '',
    query ? `Search: “${query}”` : '',
  ].filter(Boolean).join(' · ');
  const collected = rows.reduce((sum, r) => sum + r.paid, 0);
  const owed = rows.reduce((sum, r) => sum + (r.balance ?? 0), 0);

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
            <img
              src="/logo.png"
              alt="Laazeere Academy"
              className="w-20 h-20 object-contain shrink-0"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold uppercase tracking-wide leading-tight">
                Laazeere Academy
              </h1>
              <p className="text-xs italic">Education is Power</p>
              <p className="text-xs mt-1">
                Samunaka Sabon Gari, Jalingo, Taraba State, Nigeria
              </p>
              <p className="text-xs">
                08066115707, 09060405589, 08039305511 · info@laazeereacademy.com
              </p>
            </div>
          </div>
          <h2 className="text-base font-semibold mt-4 uppercase text-center border-t border-neutral-300 pt-3">
            Fee Payment Status: {className} · {TERM_LABEL[term]}{yearName ? ` · ${yearName}` : ''}
            {subtitle ? ` (${subtitle})` : ''}
          </h2>
        </header>

        <div className="flex justify-between text-sm mb-4">
          <p><strong>Students:</strong> {rows.length}</p>
          <p>
            <strong>Printed:</strong>{' '}
            {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border border-neutral-400 px-2 py-1.5 w-12 text-center">S/N</th>
              <th className="border border-neutral-400 px-2 py-1.5 text-left">Name</th>
              <th className="border border-neutral-400 px-2 py-1.5 text-left">Student ID</th>
              <th className="border border-neutral-400 px-2 py-1.5 text-left">Status</th>
              <th className="border border-neutral-400 px-2 py-1.5 text-right">Paid</th>
              <th className="border border-neutral-400 px-2 py-1.5 text-right">Fee</th>
              <th className="border border-neutral-400 px-2 py-1.5 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, index) => (
              <tr key={r.student.id} className="print:break-inside-avoid">
                <td className="border border-neutral-400 px-2 py-1.5 text-center">{index + 1}</td>
                <td className="border border-neutral-400 px-2 py-1.5">{studentName(r.student)}</td>
                <td className="border border-neutral-400 px-2 py-1.5 font-mono">{r.student.studentId}</td>
                <td className="border border-neutral-400 px-2 py-1.5 font-medium">{PAY_STATE_LABEL[r.state]}</td>
                <td className="border border-neutral-400 px-2 py-1.5 text-right">{naira(r.paid)}</td>
                <td className="border border-neutral-400 px-2 py-1.5 text-right">{r.fee != null ? naira(r.fee) : '—'}</td>
                <td className="border border-neutral-400 px-2 py-1.5 text-right">{r.balance != null ? naira(r.balance) : '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-neutral-400 px-2 py-6 text-center text-neutral-500">
                  No students to list.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-neutral-100 font-semibold">
                <td colSpan={4} className="border border-neutral-400 px-2 py-1.5 text-right">Total</td>
                <td className="border border-neutral-400 px-2 py-1.5 text-right">{naira(collected)}</td>
                <td className="border border-neutral-400 px-2 py-1.5" />
                <td className="border border-neutral-400 px-2 py-1.5 text-right">{naira(owed)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export default function ClassStatusPrintPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'admin']}>
      <ClassStatusPrint />
    </ProtectedRoute>
  );
}
