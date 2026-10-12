'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { usersApi } from '@/lib/api';
import { Staff } from '@/types';
import { designationLabel } from '@/lib/staff-designations';
import { Loader2, Printer, AlertCircle } from 'lucide-react';

const fullName = (member: Staff) => `${member.user.firstName} ${member.user.lastName}`.trim();

/**
 * Printable staff list, same layout as the class list print page. "Print"
 * opens the browser's print dialog, where it can also be saved as a PDF.
 * The staff page passes its current filter in the address (?designation=…&q=…)
 * so the printed list matches what is on screen.
 */
function StaffListPrint() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [designation, setDesignation] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wantedDesignation = params.get('designation') || 'all';
    const wantedQuery = (params.get('q') || '').trim();
    setDesignation(wantedDesignation);
    setQuery(wantedQuery);

    usersApi
      .getStaff()
      .then(all => {
        const needle = wantedQuery.toLowerCase();
        const shown = all.filter(member => {
          const matchesSearch =
            !needle ||
            member.user.firstName.toLowerCase().includes(needle) ||
            member.user.lastName.toLowerCase().includes(needle) ||
            member.staffId.toLowerCase().includes(needle);
          const matchesDesignation = wantedDesignation === 'all' || member.designation === wantedDesignation;
          return matchesSearch && matchesDesignation;
        });
        setStaff(shown.sort((a, b) => fullName(a).localeCompare(fullName(b))));
      })
      .catch(err => setError(err.message || 'Could not load the staff list.'))
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
          <p className="font-semibold">We could not load the staff list</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Link href="/management/staff" className="text-sm text-primary hover:underline mt-3 inline-block">
            Back to staff
          </Link>
        </div>
      </div>
    );
  }

  const subtitle = [
    designation !== 'all' ? designationLabel(designation) : '',
    query ? `Search: “${query}”` : '',
  ].filter(Boolean).join(' · ');

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
          <Link href="/management/staff" className="text-sm text-muted-foreground hover:text-primary">
            Staff
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
            Staff List{subtitle ? `: ${subtitle}` : ''}
          </h2>
        </header>

        <div className="flex justify-between text-sm mb-4">
          <p><strong>Staff:</strong> {staff.length}</p>
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
              <th className="border border-neutral-400 px-2 py-1.5 text-left">Staff ID</th>
              <th className="border border-neutral-400 px-2 py-1.5 text-left">Designation</th>
              <th className="border border-neutral-400 px-2 py-1.5 text-left">Phone</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member, index) => (
              <tr key={member.id} className="print:break-inside-avoid">
                <td className="border border-neutral-400 px-2 py-1.5 text-center">{index + 1}</td>
                <td className="border border-neutral-400 px-2 py-1.5">{fullName(member)}</td>
                <td className="border border-neutral-400 px-2 py-1.5 font-mono">{member.staffId}</td>
                <td className="border border-neutral-400 px-2 py-1.5">{designationLabel(member.designation) || '—'}</td>
                <td className="border border-neutral-400 px-2 py-1.5">{member.user.phone || '—'}</td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={5} className="border border-neutral-400 px-2 py-6 text-center text-neutral-500">
                  No staff to list.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StaffListPrintPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'admin']}>
      <StaffListPrint />
    </ProtectedRoute>
  );
}
