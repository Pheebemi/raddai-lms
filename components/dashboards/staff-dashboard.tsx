'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  BookOpen,
  Upload,
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { mockResults, mockStudents, getMockStaffByUserId } from '@/lib/mock-data';

export function StaffDashboard() {
  const { user } = useAuth();

  const staff = user ? getMockStaffByUserId(user.id) : null;
  const assignedStudents = useMemo(() => {
    if (!staff?.assignedClasses) return [];
    return mockStudents.filter(s => staff.assignedClasses.includes(s.class));
  }, [staff?.assignedClasses]);

  // Generate fixed values for class performances to avoid Math.random
  const classPerformances = useMemo(() => {
    return staff?.assignedClasses.map((_, index) => 75 + (index * 5)) || [];
  }, [staff?.assignedClasses]);

  // Mock data for staff dashboard
  const pendingResults = 3;
  const totalAssignedStudents = assignedStudents.length;
  const classesToday = 4;
  const avgClassPerformance = 78;

  if (!user) return null;

  const recentUploads = mockResults
    .filter(r => r.teacherId === user.id)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Good morning, {user.firstName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your teaching dashboard overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Results
          </Button>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignedStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across {staff?.assignedClasses.length || 0} classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Results</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingResults}</div>
            <p className="text-xs text-muted-foreground">
              Need to be uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classesToday}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClassPerformance}%</div>
            <p className="text-xs text-muted-foreground">
              Class average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Result Uploads */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Result Uploads</CardTitle>
            <CardDescription>
              Results you&apos;ve uploaded recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUploads.length > 0 ? (
                recentUploads.map((result) => {
                  const student = mockStudents.find(s => s.id === result.studentId);
                  return (
                    <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student?.user.avatar} />
                          <AvatarFallback>
                            {student?.user.firstName[0]}{student?.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {student?.user.firstName} {student?.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {result.subjectId === 'sub-1' ? 'Mathematics' :
                             result.subjectId === 'sub-2' ? 'Physics' : 'Chemistry'} •
                            Term {result.term} • Class {student?.class}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-1">
                          {result.grade}
                        </Badge>
                        <p className="text-sm font-medium">{result.marks}/{result.maxMarks}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent uploads</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today&apos;s Schedule */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
            <CardDescription>
              Your classes for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '9:00 AM', subject: 'Mathematics', class: '10-A', room: '101' },
                { time: '10:30 AM', subject: 'Physics', class: '10-A', room: '102' },
                { time: '1:00 PM', subject: 'Mathematics', class: '9-B', room: '101' },
                { time: '2:30 PM', subject: 'Chemistry', class: '10-B', room: '103' },
              ].map((schedule, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{schedule.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.time} • Room {schedule.room} • Class {schedule.class}
                    </p>
                  </div>
                  <Badge variant="outline">Upcoming</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance Overview</CardTitle>
          <CardDescription>
            Performance across your assigned classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staff?.assignedClasses.map((className, index) => (
              <div key={className} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Class {className}</span>
                  <span className="text-sm text-muted-foreground">
                    {classPerformances[index]}% average
                  </span>
                </div>
                <Progress value={classPerformances[index]} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Upload className="h-6 w-6" />
              Upload Results
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              View Students
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              Mark Attendance
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BookOpen className="h-6 w-6" />
              Lesson Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}