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
  TrendingUp,
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

  // Consider the current year "paid" for result access if at least one
  // current-year result has payment_status = true (backend already checks
  // that the fee payment for that term/year is fully paid).
  const hasPaidCurrentYearFees = currentYearResults.some(r => r.payment_status);

  // Only show results if fees are paid for the current academic year
  const results = hasPaidCurrentYearFees ? currentYearResults : [];

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
            <CardTitle className="text-sm font-medium">Latest Grade</CardTitle>
            {hasPaidCurrentYearFees ? (
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasPaidCurrentYearFees ? (results[0]?.grade || 'N/A') : 'Locked'}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasPaidCurrentYearFees
                ? (results[0] ? `${results[0].subject_name || results[0].subjectId} (${results[0].percentage.toFixed(1)}%)` : 'No results yet')
                : 'Pay fees to unlock'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Current Academic Year Results */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Academic Results</CardTitle>
            <CardDescription>
              Your current academic year performance
              {studentProfile?.classAcademicYearId && (
                <span className="ml-2 text-sm">
                  ({results.find(r => r.academicYearId === studentProfile.classAcademicYearId)?.academicYear})
                </span>
              )}
              {hasPaidCurrentYearFees ? null : (
                <span className="ml-2 text-sm text-orange-600">
                  (Payment Required)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPaidCurrentYearFees ? (
              results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {(result.subject_name || result.subjectId).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{result.subject_name || result.subjectId}</p>
                          <p className="text-sm text-muted-foreground">
                            CA: {result.ca1_score + result.ca2_score + result.ca3_score + result.ca4_score}/40 •
                            Exam: {result.exam_score}/60
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            result.grade.startsWith('A')
                              ? 'default'
                              : result.grade.startsWith('B')
                              ? 'secondary'
                              : 'outline'
                          }
                          className="mb-1"
                        >
                          {result.grade}
                        </Badge>
                        <p className="text-sm font-medium">
                          {result.percentage?.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No results available for this academic year</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Results Locked</p>
                <p className="text-muted-foreground">
                  You haven&apos;t paid the school fees for this academic year. Please pay your fees
                  to view your results.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/fees">
                    Pay School Fees
                  </Link>
                </Button>
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