'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  BookOpen,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  GraduationCap,
  Eye,
  EyeOff,
} from 'lucide-react';
import { dashboardApi, feesApi, promotionApi, fetchAcademicYears, toggleResultsVisibility } from '@/lib/api';
import { DashboardStats } from '@/types';
import { toast } from 'sonner';

type StudentStatus = 'promote' | 'repeat' | 'graduated';

interface PreviewStudent {
  student_id: number;
  student_name: string;
  student_number: string;
  current_class: string | null;
  current_grade: number | null;
  next_class: string | null;
  can_promote: boolean;
}

interface AcademicYear {
  id: number;
  name: string;
  is_active: boolean;
}

export function ManagementDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Promotion dialog state
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [fromYear, setFromYear] = useState<string>('');
  const [toYear, setToYear] = useState<string>('');
  const [previewStudents, setPreviewStudents] = useState<PreviewStudent[]>([]);
  const [studentStatuses, setStudentStatuses] = useState<Record<number, StudentStatus>>({});
  const [previewing, setPreviewing] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [togglingResults, setTogglingResults] = useState<string | null>(null);
  const [activeYearVisibility, setActiveYearVisibility] = useState({
    results_visible: false,
    first_term_visible: false,
    second_term_visible: false,
    third_term_visible: false,
  });
  const [activeYearId, setActiveYearId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard stats
        const [dashboardStats, yearsData] = await Promise.all([
          dashboardApi.getStats(),
          fetchAcademicYears(),
        ]);
        setStats(dashboardStats);
        const active = yearsData.find((y: any) => y.is_active) || yearsData[0];
        if (active) {
          setActiveYearId(active.id.toString());
          setActiveYearVisibility({
            results_visible: active.results_visible ?? false,
            first_term_visible: active.first_term_visible ?? false,
            second_term_visible: active.second_term_visible ?? false,
            third_term_visible: active.third_term_visible ?? false,
          });
        }

        // Fetch recent fee transactions for the financial overview
        try {
          const payments = await feesApi.getPayments();
          // Get the most recent 3 transactions
          setRecentTransactions(payments.slice(0, 3));
        } catch (error) {
          console.error('Failed to fetch recent transactions:', error);
          setRecentTransactions([]);
        }

      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error('Dashboard data error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const openPromoteDialog = async () => {
    setPromoteOpen(true);
    setPreviewLoaded(false);
    setPreviewStudents([]);
    setStudentStatuses({});
    try {
      const years = await fetchAcademicYears();
      setAcademicYears(years);
      const active = years.find((y: AcademicYear) => y.is_active) || years[0];
      if (active) {
        setFromYear(active.id.toString());
        setActiveYearId(active.id.toString());
        setActiveYearVisibility({
          results_visible: active.results_visible ?? false,
          first_term_visible: active.first_term_visible ?? false,
          second_term_visible: active.second_term_visible ?? false,
          third_term_visible: active.third_term_visible ?? false,
        });
      }
    } catch {
      toast.error('Failed to load academic years');
    }
  };

  const handlePreview = async () => {
    if (!fromYear || !toYear) {
      toast.error('Select both academic years');
      return;
    }
    setPreviewing(true);
    try {
      const result = await promotionApi.preview(Number(fromYear), Number(toYear));
      setPreviewStudents(result.students);
      const statuses: Record<number, StudentStatus> = {};
      result.students.forEach(s => { statuses[s.student_id] = 'promote'; });
      setStudentStatuses(statuses);
      setPreviewLoaded(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load preview');
    } finally {
      setPreviewing(false);
    }
  };

  const handlePromote = async () => {
    if (!fromYear || !toYear) return;
    setPromoting(true);
    try {
      const repeated  = Object.entries(studentStatuses).filter(([, v]) => v === 'repeat').map(([k]) => Number(k));
      const graduated = Object.entries(studentStatuses).filter(([, v]) => v === 'graduated').map(([k]) => Number(k));
      const result = await promotionApi.execute({
        from_academic_year: Number(fromYear),
        to_academic_year: Number(toYear),
        repeated_student_ids: repeated,
        graduated_student_ids: graduated,
      });
      toast.success(result.message);
      if (result.no_class_found.length > 0) {
        toast.warning(`${result.no_class_found.length} student(s) could not be assigned — check that classes exist in the new year.`);
      }
      setPromoteOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Promotion failed');
    } finally {
      setPromoting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const totalStudents = stats.totalStudents || 0;
  const totalStaff = stats.totalStaff || 0;
  const totalRevenue = stats.totalRevenue || 0;
  const pendingFees = stats.pendingFees || 0;
  const overdueAmount = Number(stats.overdue_amount) || 0;
  const totalExpected = Number(stats.total_expected) || (totalRevenue + pendingFees);
  const collectionRate = totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 0;
  const averageAttendance = stats.averageAttendance || 0;
  const topPerformers = stats.topPerformers || [];
  const recentResults = stats.recentResults || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.firstName}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your Laazeere Academy management overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Announcement
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching Staff</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              All positions filled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {collectionRate}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              Above target
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Financial Overview */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>
              Fee collection and outstanding amounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">₦{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Collected</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">₦{pendingFees.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">₦{overdueAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Collection Rate</span>
                  <span>{collectionRate}%</span>
                </div>
                <Progress value={collectionRate} className="h-2" />
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Recent Transactions</h4>
                <div className="space-y-2">
                  {recentTransactions.length > 0 ? [...recentTransactions]
                    .sort((a, b) => new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime())
                    .slice(0, 5)
                    .map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {transaction.studentName ? transaction.studentName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {transaction.studentName || 'Unknown Student'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.feeStructureName || 'School Fee'} • {transaction.term || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                          {transaction.status || 'pending'}
                        </Badge>
                        <p className="text-sm font-medium">₦{transaction.totalAmount || 0}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No recent transactions</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Students with highest grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.length > 0 ? topPerformers.map((performer: any, index: number) => (
                <div key={performer.id} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {performer.name ? performer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{performer.name || 'Unknown Student'}</p>
                    <p className="text-sm text-muted-foreground">
                      Class {performer.class || 'N/A'}
                    </p>
                  </div>
                  <Badge variant="secondary">{performer.grade || 'A+'}</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No top performers data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Result Uploads</CardTitle>
            <CardDescription>
              Latest academic results added to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentResults.length > 0 ? recentResults.map((result: any) => (
                <div key={result.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {result.studentName ? result.studentName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {result.studentName || 'Unknown Student'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.subjectName || 'Unknown Subject'} • {result.term || 'N/A'} • {result.grade || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{result.marksObtained || 0}/{result.totalMarks || 100}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.uploadedBy || 'System'}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No recent results available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts — real data */}
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Important items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">

              {/* Overdue fees alert */}
              {overdueAmount > 0 && (
                <div className="flex items-start gap-3 p-3 border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">Overdue Fee Payments</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      ₦{overdueAmount.toLocaleString()} outstanding from previous academic year(s)
                    </p>
                  </div>
                </div>
              )}

              {/* Pending fees */}
              {pendingFees > 0 && (
                <div className="flex items-start gap-3 p-3 border border-border bg-muted rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Pending Fees</p>
                    <p className="text-sm text-muted-foreground">
                      ₦{pendingFees.toLocaleString()} in fees not yet collected for the current year
                    </p>
                  </div>
                </div>
              )}

              {/* Recent results uploaded */}
              {recentResults.length > 0 && (
                <div className="flex items-start gap-3 p-3 border border-border bg-secondary rounded-xl">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Recent Results Uploaded</p>
                    <p className="text-sm text-muted-foreground">
                      {recentResults.length} result{recentResults.length !== 1 ? 's' : ''} uploaded recently — latest by {(recentResults[0] as any)?.uploadedBy || 'a teacher'}
                    </p>
                  </div>
                </div>
              )}

              {/* All clear */}
              {overdueAmount === 0 && pendingFees === 0 && recentResults.length === 0 && (
                <div className="flex items-start gap-3 p-3 border border-border bg-muted rounded-xl">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">All Clear</p>
                    <p className="text-sm text-muted-foreground">No urgent items require attention right now</p>
                  </div>
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Visibility Toggle */}
      {activeYearId && (
        <Card className="border-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Student Results Visibility</CardTitle>
            <CardDescription>
              Control which results students can see. Students with paid fees only see what you enable here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              { key: 'first_term_visible', term: 'first' as const, label: 'First Term' },
              { key: 'second_term_visible', term: 'second' as const, label: 'Second Term' },
              { key: 'third_term_visible', term: 'third' as const, label: 'Third Term' },
            ] as { key: keyof typeof activeYearVisibility; term: 'first' | 'second' | 'third'; label: string }[]).map(({ key, term, label }) => {
              const visible = activeYearVisibility[key];
              return (
                <div key={term} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${visible ? 'bg-primary' : 'bg-muted-foreground'}`} />
                    <span className="text-sm font-medium">{label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${visible ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground'}`}>
                      {visible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={visible ? 'outline' : 'default'}
                    disabled={togglingResults === term}
                    onClick={async () => {
                      setTogglingResults(term);
                      try {
                        const res = await toggleResultsVisibility(activeYearId, !visible, term);
                        setActiveYearVisibility(prev => ({ ...prev, [key]: res[key] }));
                        toast.success(`${label} results ${res[key] ? 'visible' : 'hidden'} for students`);
                      } catch {
                        toast.error('Failed to update');
                      } finally {
                        setTogglingResults(null);
                      }
                    }}
                  >
                    {togglingResults === term ? 'Updating...' : visible
                      ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Hide</>
                      : <><Eye className="h-3.5 w-3.5 mr-1" />Show</>
                    }
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used management features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              Manage Students
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BookOpen className="h-6 w-6" />
              Manage Staff
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              Financial Reports
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={openPromoteDialog}>
              <GraduationCap className="h-6 w-6" />
              Promote Students
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Promote Students Dialog */}
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Promote Students</DialogTitle>
            <DialogDescription>
              Move students to the next grade for a new academic year. Mark students who are repeating or graduating before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">From Academic Year</label>
              <Select value={fromYear} onValueChange={setFromYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(y => (
                    <SelectItem key={y.id} value={y.id.toString()}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">To Academic Year</label>
              <Select value={toYear} onValueChange={setToYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(y => (
                    <SelectItem key={y.id} value={y.id.toString()}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handlePreview} disabled={previewing || !fromYear || !toYear} variant="outline">
                {previewing ? 'Loading...' : 'Preview'}
              </Button>
            </div>
          </div>

          {previewLoaded && (
            <div className="flex-1 overflow-y-auto mt-4 border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3">Student</th>
                    <th className="text-left p-3">Current Class</th>
                    <th className="text-left p-3">Moving To</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewStudents.map(s => (
                    <tr key={s.student_id} className="border-t">
                      <td className="p-3">
                        <p className="font-medium">{s.student_name}</p>
                        <p className="text-xs text-muted-foreground">{s.student_number}</p>
                      </td>
                      <td className="p-3">{s.current_class ?? '—'}</td>
                      <td className="p-3">
                        {studentStatuses[s.student_id] === 'graduated'
                          ? <span className="text-muted-foreground">Graduating</span>
                          : studentStatuses[s.student_id] === 'repeat'
                          ? <span className="text-yellow-600">{s.current_class ?? '—'} (repeat)</span>
                          : s.next_class
                          ? s.next_class
                          : <span className="text-red-500">No class found</span>}
                      </td>
                      <td className="p-3">
                        <Select
                          value={studentStatuses[s.student_id] ?? 'promote'}
                          onValueChange={(v) => setStudentStatuses(prev => ({ ...prev, [s.student_id]: v as StudentStatus }))}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="promote">Promote</SelectItem>
                            <SelectItem value="repeat">Repeat</SelectItem>
                            <SelectItem value="graduated">Graduated</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewStudents.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No students found in the selected academic year.</p>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPromoteOpen(false)}>Cancel</Button>
            <Button
              onClick={handlePromote}
              disabled={!previewLoaded || promoting || previewStudents.length === 0}
            >
              {promoting ? 'Promoting...' : `Confirm Promotion (${previewStudents.length} students)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}