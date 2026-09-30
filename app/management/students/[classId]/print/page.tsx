'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { classesApi, usersApi } from '@/lib/api';
import { Class, Student } from '@/types';
import { Loader2, Printer, AlertCircle } from 'lucide-react';

const fullName = (student: Student) => `${student.user.firstName} ${student.user.lastName}`.trim();

/**
 * Printable list of one class's students, same layout as the admission form
 * print page. "Print" opens the browser's print dialog, where it can also be
 * saved as a PDF.
 */
function ClassListPrint() {
  const params = useParams();
  const classId = String(params.classId);

  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([classesApi.getAll(), usersApi.getStudents(classId)])
      .then(([classes, classStudents]) => {
        const found = classes.find(cls => cls.id === classId);
        if (!found) throw new Error('That class no longer exists.');
        setClassInfo(found);
        setStudents([...classStudents].sort((a, b) => fullName(a).localeCompare(fullName(b))));
      })
      .catch(err => setError(err.message || 'Could not load the class list.'))
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error || !classInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-3" />
          <p className="font-semibold">We could not load this class list</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Link href="/management/students" className="text-sm text-primary hover:underline mt-3 inline-block">
            Back to students
          </Link>
        </div>
      </div>
    );
  }

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
          <Link href="/management/students" className="text-sm text-muted-foreground hover:text-primary">
            Students
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
            Class List: {classInfo.name}
          </h2>
        </header>

        <div className="flex justify-between text-sm mb-4">
          <p><strong>Session:</strong> {classInfo.academicYear}</p>
          <p><strong>Students:</strong> {students.length}</p>
          <p>
            <strong>Printed:</strong>{' '}
            {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border border-neutral-400 px-2 py-1.5 w-12 text-center">S/N</th>
              <th className="border border-neutral-400 px-2 py-1.5 text-left">Student Name</th>
              <th className="border border-neutral-400 px-2 py-1.5 text-left">Student ID</th>
              <th className="border border-neutral-400 px-2 py-1.5 text-left w-24">Gender</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id} className="print:break-inside-avoid">
                <td className="border border-neutral-400 px-2 py-1.5 text-center">{index + 1}</td>
                <td className="border border-neutral-400 px-2 py-1.5">{fullName(student)}</td>
                <td className="border border-neutral-400 px-2 py-1.5 font-mono">{student.studentId}</td>
                <td className="border border-neutral-400 px-2 py-1.5 capitalize">{student.gender || '—'}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="border border-neutral-400 px-2 py-6 text-center text-neutral-500">
                  No students in this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ClassListPrintPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'admin']}>
      <ClassListPrint />
    </ProtectedRoute>
  );
}
