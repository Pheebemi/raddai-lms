'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  GraduationCap,
  DollarSign,
  Calendar,
  FileText,
  TrendingUp,
  Clock
} from 'lucide-react';
import { mockResults, mockFeeTransactions, mockAnnouncements, getMockStudentByUserId } from '@/lib/mock-data';

export function StudentDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const student = getMockStudentByUserId(user.id);
  const results = mockResults.filter(r => r.studentId === user.id);
  const feeTransactions = mockFeeTransactions.filter(ft => ft.studentId === user.id);

  // Calculate attendance percentage (mock)
  const attendancePercentage = 87;

  // Calculate fee summary
  const totalDue = feeTransactions
    .filter(ft => ft.status === 'pending' || ft.status === 'overdue')
    .reduce((sum, ft) => sum + ft.amount, 0);

  const recentResults = results.slice(0, 3);
  const recentAnnouncements = mockAnnouncements
    .filter(a => a.targetRoles.includes('student'))
    .slice(0, 3);

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
          <Button variant="outline">
            <DollarSign className="mr-2 h-4 w-4" />
            Pay Fees
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
            <div className="text-2xl font-bold">{student?.class || '10'}</div>
            <p className="text-xs text-muted-foreground">
              Section {student?.section || 'A'}
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
            <div className="text-2xl font-bold">₹{totalDue.toLocaleString()}</div>
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
              {recentResults[0]?.grade || 'A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {recentResults[0]?.subjectId ? 'Mathematics' : 'No results yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Results */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>
              Your latest academic performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentResults.length > 0 ? (
                recentResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {result.subjectId === 'sub-1' ? 'M' : result.subjectId === 'sub-2' ? 'P' : 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {result.subjectId === 'sub-1' ? 'Mathematics' :
                           result.subjectId === 'sub-2' ? 'Physics' : 'Chemistry'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Term {result.term} • {result.academicYear}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant={result.grade === 'A+' ? 'default' : result.grade === 'A' ? 'secondary' : 'outline'}>
                          {result.grade}
                        </Badge>
                        <span className="font-medium">{result.marks}/{result.maxMarks}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{result.remarks}</p>
                    </div>
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
            <Button variant="outline" className="h-20 flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              Pay School Fees
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