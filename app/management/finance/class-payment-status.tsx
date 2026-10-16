'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usersApi, handleApiError } from '@/lib/api';
import { Class, FeeStructure, FeeTransaction, Student } from '@/types';
import {
  PayState,
  Term,
  TERM_LABEL,
  buildPaymentRows,
  filterPaymentRows,
  studentName,
} from '@/lib/class-payment-status';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

const naira = (value: number) => `₦${value.toLocaleString()}`;

export function ClassPaymentStatus({
  classes,
  academicYears,
  transactions,
  feeStructures,
  yearId,
}: {
  classes: Class[];
  academicYears: any[];
  transactions: FeeTransaction[];
  feeStructures: FeeStructure[];
  yearId: string;
}) {
  // The page's year picker can be "All Time"; a per-class view needs one real year.
  const activeYear = academicYears.find(y => y.is_active) || academicYears[0];
  const effectiveYearId = yearId !== 'all' && yearId !== 'active' ? yearId : activeYear ? String(activeYear.id) : '';
  const yearName = academicYears.find(y => String(y.id) === effectiveYearId)?.name || '';

  const yearClasses = useMemo(
    () =>
      classes
        .filter(c => String(c.academicYearId) === effectiveYearId)
        .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name)),
    [classes, effectiveYearId]
  );

  const [classId, setClassId] = useState('');
  const [term, setTerm] = useState<Term>('first');
  const [filter, setFilter] = useState<'all' | PayState>('all');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // Keep the picked class valid when the academic year changes.
  useEffect(() => {
    if (!yearClasses.some(c => c.id === classId)) setClassId(yearClasses[0]?.id || '');
  }, [yearClasses, classId]);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    usersApi
      .getStudents(classId)
      .then(list => {
        if (!cancelled) setStudents(list);
      })
      .catch(error => {
        if (!cancelled) toast.error(handleApiError(error) || 'Failed to load students');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const selectedClass = yearClasses.find(c => c.id === classId);

  const rows = useMemo(
    () => buildPaymentRows(students, selectedClass?.grade ?? 0, term, effectiveYearId, transactions, feeStructures),
    [students, transactions, term, effectiveYearId, feeStructures, selectedClass]
  );

  const counts = {
    paid: rows.filter(r => r.state === 'paid').length,
    partial: rows.filter(r => r.state === 'partial').length,
    unpaid: rows.filter(r => r.state === 'unpaid').length,
  };
  const collected = rows.reduce((sum, r) => sum + r.paid, 0);

  const visible = filterPaymentRows(rows, filter, search);

  // Opens the printable list for what is on screen (class, term, year, status filter, search).
  const openPrintable = () => {
    const params = new URLSearchParams({ class: classId, term, year: effectiveYearId });
    if (filter !== 'all') params.set('status', filter);
    if (search.trim()) params.set('q', search.trim());
    window.open(`/management/finance/class-status/print?${params}`, '_blank', 'noopener');
  };

  const badge = (state: PayState) =>
    state === 'paid' ? (
      <Badge>Paid</Badge>
    ) : state === 'partial' ? (
      <Badge variant="secondary">Part paid</Badge>
    ) : (
      <Badge variant="destructive">Not paid</Badge>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status by Class</CardTitle>
        <CardDescription>
          Pick a class and a term to see who has paid and who has not{yearName ? ` — ${yearName}` : ''}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-48" aria-label="Class">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {yearClasses.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={term} onValueChange={v => setTerm(v as Term)}>
            <SelectTrigger className="w-40" aria-label="Term">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TERM_LABEL) as Term[]).map(t => (
                <SelectItem key={t} value={t}>
                  {TERM_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search student..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={openPrintable} disabled={!classId || loading}>
            <Download className="mr-2 h-4 w-4" />
            Download List
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {(
            [
              ['paid', 'Paid', counts.paid],
              ['partial', 'Part paid', counts.partial],
              ['unpaid', 'Not paid', counts.unpaid],
            ] as const
          ).map(([key, label, n]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(filter === key ? 'all' : key)}
              className={`rounded-xl border p-3 text-left transition-colors hover:bg-muted/50 ${
                filter === key ? 'border-primary bg-muted/50' : ''
              }`}
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{n}</p>
            </button>
          ))}
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Collected</p>
            <p className="text-2xl font-bold">{naira(collected)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {selectedClass?.name || 'No class'} · {TERM_LABEL[term]} · {visible.length} of {rows.length} students
          </span>
          {filter !== 'all' && (
            <Button size="sm" variant="ghost" onClick={() => setFilter('all')}>
              Show all
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S/N</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r, i) => (
                <TableRow key={r.student.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {studentName(r.student)}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.student.studentId}</p>
                  </TableCell>
                  <TableCell>{badge(r.state)}</TableCell>
                  <TableCell className="text-right">{naira(r.paid)}</TableCell>
                  <TableCell className="text-right">{r.fee != null ? naira(r.fee) : '—'}</TableCell>
                  <TableCell className="text-right">{r.balance != null ? naira(r.balance) : '—'}</TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {loading
                      ? 'Loading students...'
                      : !classId
                        ? 'No classes found for this academic year.'
                        : rows.length === 0
                          ? 'No students in this class.'
                          : 'No students match your filters.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
