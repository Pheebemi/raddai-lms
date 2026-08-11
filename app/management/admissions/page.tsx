'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  admissionsManagementApi, Application, AdmissionStats,
} from '@/lib/admissions-api';
import { toast } from 'sonner';
import { Search, Settings, Loader2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { key: '', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under review' },
  { key: 'admitted', label: 'Admitted' },
  { key: 'waitlisted', label: 'Waitlisted' },
  { key: 'rejected', label: 'Not offered' },
  { key: 'paid', label: 'Form incomplete' },
  { key: 'pending_payment', label: 'Unpaid' },
];

const STATUS_STYLES: Record<string, string> = {
  admitted: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
  pending_payment: 'bg-muted text-muted-foreground',
};

const naira = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(amount);

export default function AdmissionsListPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<AdmissionStats | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeTab) params.status = activeTab;
      if (search.trim()) params.search = search.trim();

      const [rows, summary] = await Promise.all([
        admissionsManagementApi.list(params),
        admissionsManagementApi.stats(),
      ]);
      setApplications(rows);
      setStats(summary);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load applications.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Admissions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Applications for admission. Applicants have no login — when one turns
              up, enrol them from the Students page.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/management/admissions/settings">
              <Settings className="h-4 w-4 mr-2" /> Admission settings
            </Link>
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total applications" value={String(stats.total)} />
            <StatCard label="Awaiting review" value={String(stats.by_status.submitted ?? 0)} />
            <StatCard label="Admitted" value={String(stats.by_status.admitted ?? 0)} />
            <StatCard label="Fees collected" value={naira(stats.total_collected)} />
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border whitespace-nowrap transition-colors',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:border-primary/40',
              )}
            >
              {tab.label}
              {stats && tab.key && (
                <span className="ml-1.5 opacity-70">
                  {stats.by_status[tab.key] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Name, reference, phone or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="font-medium">No applications here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nothing matches this filter yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map(application => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">
                          {application.full_name}
                        </TableCell>
                        <TableCell>{application.level_display}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {application.reference}
                        </TableCell>
                        <TableCell className="text-sm">
                          {application.contact_phone}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={STATUS_STYLES[application.status] ?? ''}
                          >
                            {application.status_display}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/management/admissions/${application.id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
