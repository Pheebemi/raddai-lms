'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  GraduationCap,
  DollarSign,
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard-data';

export function StudentDashboard() {
  const { user } = useAuth();
  const { dashboardStats, results: allResults, feeTransactions, announcements, studentProfile, isLoading, error } = useDashboardData();

  if (!user) return null;

  // Calculate attendance percentage (mock for now - would come from API)
  const attendancePercentage = 87;

  // Calculate fee summary
  // Prefer backend-computed pending fees for the current academic session if available.
  const backendPendingFees = dashboardStats?.pendingFees ?? 0;

  // Filter results to only show those from the student's current academic year
  const currentYearResults = allResults.filter(result =>
    studentProfile?.classAcademicYearId
      ? result.academicYearId === studentProfile.classAcademicYearId
      : true // If no academic year available, show all results
  );

  // For access control we only care if FIRST TERM results are paid
  const firstTermResults = currentYearResults.filter(result => result.term === 'first');

  // Consider the current year "paid" for result access if at least one
  // first-term result has payment_status = true (backend already checks
  // that the fee payment for that term/year is fully paid).
  const hasPaidCurrentYearFees = firstTermResults.some(r => r.payment_status);

  const recentAnnouncements = announcements.slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load dashboard data</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your studies today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled={!hasPaidCurrentYearFees}>
            <FileText className="mr-2 h-4 w-4" />
            {hasPaidCurrentYearFees ? 'View Results' : 'Results Locked'}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/fees">
              <DollarSign className="mr-2 h-4 w-4" />
              Pay Fees
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Class</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentProfile?.class || 'Not Assigned'}</div>
            <p className="text-xs text-muted-foreground">
              Current Class
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancePercentage}%</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{backendPendingFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {feeTransactions.filter(ft => ft.status === 'overdue').length} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feeTransactions.some(ft => ft.status === 'overdue')
                ? `${feeTransactions.filter(ft => ft.status === 'overdue').length} overdue`
                : feeTransactions.some(ft => ft.status === 'pending' || ft.status === 'partial')
                ? `${feeTransactions.filter(ft => ft.status === 'pending' || ft.status === 'partial').length} pending`
                : 'All clear'}
            </div>
            <p className="text-xs text-muted-foreground">
              Fee payment overview
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Student Profile Overview (replaces Academic Results card) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
            <CardDescription>
              Your basic student information at a glance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentProfile ? (
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback>
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Student ID: {studentProfile.studentId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Class: {studentProfile.class}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 text-sm md:ml-8 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Section</p>
                    <p className="font-medium">{studentProfile.section}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Admission Date</p>
                    <p className="font-medium">
                      {new Date(studentProfile.admissionDate).toLocaleDateString()}
                    </p>
                  </div>
                  {user.email && (
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  )}
                  {user.phone && (
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{user.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your profile details are not available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>
              Latest school updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="flex gap-3">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    announcement.priority === 'high' ? 'bg-red-500' :
                    announcement.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{announcement.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you might need to perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="h-6 w-6" />
              View All Results
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/dashboard/fees">
                <DollarSign className="h-6 w-6" />
                Pay School Fees
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              Check Attendance
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Clock className="h-6 w-6" />
              View Timetable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}