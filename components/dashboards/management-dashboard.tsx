'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  BookOpen,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { mockStudents, mockStaff, mockFeeTransactions, mockResults } from '@/lib/mock-data';

export function ManagementDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  // Calculate dashboard stats
  const totalStudents = mockStudents.length;
  const totalStaff = mockStaff.length;
  const totalRevenue = mockFeeTransactions
    .filter(ft => ft.status === 'paid')
    .reduce((sum, ft) => sum + ft.amount, 0);
  const pendingFees = mockFeeTransactions
    .filter(ft => ft.status === 'pending' || ft.status === 'overdue')
    .reduce((sum, ft) => sum + ft.amount, 0);
  const averageAttendance = 89; // Mock data
  const topPerformers = mockStudents.slice(0, 3); // Mock top performers
  const recentResults = mockResults.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your Raddai Metropolitan School management overview.
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
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
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
                  <p className="text-2xl font-bold text-green-600">₦{(totalRevenue * 0.85).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Collected</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">₦{pendingFees.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">₦{(pendingFees * 0.3).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Collection Rate</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Recent Transactions</h4>
                <div className="space-y-2">
                  {mockFeeTransactions.slice(0, 3).map((transaction) => {
                    const student = mockStudents.find(s => s.id === transaction.studentId);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student?.user.avatar} />
                            <AvatarFallback>
                              {student?.user.firstName[0]}{student?.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {student?.user.firstName} {student?.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.feeStructureId === 'fee-1' ? 'Tuition Fee' : 'Other'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                          <p className="text-sm font-medium">₦{transaction.amount}</p>
                        </div>
                      </div>
                    );
                  })}
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
              {topPerformers.map((student, index) => (
                <div key={student.id} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.user.avatar} />
                    <AvatarFallback>
                      {student.user.firstName[0]}{student.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{student.user.firstName} {student.user.lastName}</p>
                    <p className="text-sm text-muted-foreground">
                      Class {student.class}-{student.section} • Roll {student.rollNumber}
                    </p>
                  </div>
                  <Badge variant="secondary">A+</Badge>
                </div>
              ))}
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
              {recentResults.map((result) => {
                const student = mockStudents.find(s => s.id === result.studentId);
                const teacher = mockStaff.find(s => s.id === result.teacherId);

                return (
                  <div key={result.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student?.user.avatar} />
                      <AvatarFallback>
                        {student?.user.firstName[0]}{student?.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {student?.user.firstName} {student?.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {result.subjectId === 'sub-1' ? 'Mathematics' :
                         result.subjectId === 'sub-2' ? 'Physics' : 'Chemistry'} •
                        Class {student?.class} • {result.grade}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{result.marks}/{result.maxMarks}</p>
                      <p className="text-xs text-muted-foreground">
                        {teacher?.user.firstName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>
              Important notifications requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    Fee Payment Due
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    15 students have overdue fee payments exceeding ₦50,000
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Result Upload Complete
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Term 1 results have been uploaded for all Class 10 students
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Attendance Improvement
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Overall attendance has improved by 5% this month
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}