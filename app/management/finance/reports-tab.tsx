'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Receipt, AlertTriangle, TrendingUp } from 'lucide-react';
import { Class } from '@/types';
import { TERM_LABEL, Term } from '@/lib/class-payment-status';

/**
 * The three printable finance reports. Each Generate button opens
 * /management/finance/report/print in a new tab, which builds the report
 * from the school's records and offers Print / Save as PDF.
 */
export function ReportsTab({
  classes,
  academicYears,
  yearId,
}: {
  classes: Class[];
  academicYears: any[];
  yearId: string;
}) {
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

  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [term, setTerm] = useState<Term>('first');
  const [classId, setClassId] = useState('all');

  const open = (params: Record<string, string>) => {
    const query = new URLSearchParams({ year: effectiveYearId, ...params });
    window.open(`/management/finance/report/print?${query}`, '_blank', 'noopener');
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Reports for {yearName || 'the selected academic year'}. Change the year at the top of the page.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Receipt className="h-12 w-12 mx-auto text-primary" />
              <div>
                <h3 className="font-semibold mb-2">Monthly Report</h3>
                <p className="text-sm text-muted-foreground">Every payment recorded in a month, with the total</p>
              </div>
              <Input type="month" aria-label="Month" value={month} onChange={e => setMonth(e.target.value)} />
              <Button className="w-full" disabled={!month || !effectiveYearId} onClick={() => open({ type: 'monthly', month })}>
                <Download className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <TrendingUp className="h-12 w-12 mx-auto text-primary" />
              <div>
                <h3 className="font-semibold mb-2">Revenue Report</h3>
                <p className="text-sm text-muted-foreground">Fees collected per class and term for the year</p>
              </div>
              <Button className="w-full" disabled={!effectiveYearId} onClick={() => open({ type: 'revenue' })}>
                <Download className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 mx-auto text-primary" />
              <div>
                <h3 className="font-semibold mb-2">Outstanding Report</h3>
                <p className="text-sm text-muted-foreground">Students who have not fully paid, with balances</p>
              </div>
              <div className="flex gap-2">
                <Select value={term} onValueChange={v => setTerm(v as Term)}>
                  <SelectTrigger className="flex-1" aria-label="Outstanding term">
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
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="flex-1" aria-label="Outstanding class">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {yearClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!effectiveYearId}
                onClick={() => open({ type: 'outstanding', term, class: classId })}
              >
                <Download className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
