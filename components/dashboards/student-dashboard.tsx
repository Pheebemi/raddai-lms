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
  AlertCircle
} from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard-data';

export function StudentDashboard() {
  const { user } = useAuth();
  const { results, feeTransactions, announcements, studentProfile, isLoading, error } = useDashboardData();

  if (!user) return null;

  // Calculate attendance percentage (mock for now - would come from API)
  const attendancePercentage = 87;

  // Calculate fee summary
  const totalDue = feeTransactions
    .filter(ft => ft.status === 'pending' || ft.status === 'overdue')
    .reduce((sum, ft) => sum + ft.amount, 0);

  // Group results by term
  const resultsByTerm = results.reduce((acc, result) => {
    if (!acc[result.term]) {
      acc[result.term] = [];
    }
    acc[result.term].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

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
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            View Results
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
            <div className="text-2xl font-bold">₦{totalDue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {feeTransactions.filter(ft => ft.status === 'overdue').length} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results[0]?.grade || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {results[0] ? `${results[0].subjectId} (${results[0].percentage.toFixed(1)}%)` : 'No results yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Results by Term */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Academic Results</CardTitle>
            <CardDescription>
              Your performance across all terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.keys(resultsByTerm).length > 0 ? (
                Object.entries(resultsByTerm).map(([term, termResults]) => (
                  <div key={term} className="space-y-2">
                    <h3 className="font-semibold text-lg">{term} - {termResults[0]?.academicYear}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-center">CA1</TableHead>
                          <TableHead className="text-center">CA2</TableHead>
                          <TableHead className="text-center">CA3</TableHead>
                          <TableHead className="text-center">CA4</TableHead>
                          <TableHead className="text-center">Exam</TableHead>
                          <TableHead className="text-center">Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {termResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.subject_name || result.subjectId}</TableCell>
                            <TableCell className="text-center">{result.ca1_score}</TableCell>
                            <TableCell className="text-center">{result.ca2_score}</TableCell>
                            <TableCell className="text-center">{result.ca3_score}</TableCell>
                            <TableCell className="text-center">{result.ca4_score}</TableCell>
                            <TableCell className="text-center">{result.exam_score}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={
                                result.grade.startsWith('A') ? 'default' :
                                result.grade.startsWith('B') ? 'secondary' : 'outline'
                              }>
                                {result.grade}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No results available yet</p>
                </div>
              )}
            </div>
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