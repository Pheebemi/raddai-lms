'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { mockResults, mockFeeTransactions, mockAnnouncements, getMockParentByUserId } from '@/lib/mock-data';

export function ParentDashboard() {
  const { user } = useAuth();

  const parent = user ? getMockParentByUserId(user.id) : null;

  // Get data for all children
  const childrenData = useMemo(() => {
    if (!parent?.children) return [];
    return parent.children.map(child => {
      const results = mockResults.filter(r => r.studentId === child.id);
      const fees = mockFeeTransactions.filter(ft => ft.studentId === child.id);

      return {
        ...child,
        results,
        fees,
        attendancePercentage: 85, // Mock attendance - fixed value to avoid Math.random
      };
    });
  }, [parent?.children]);

  if (!user) return null;
  if (!parent || !parent.children.length) return null;

  const totalPendingFees = childrenData.reduce((sum, child) =>
    sum + child.fees.filter(f => f.status === 'pending' || f.status === 'overdue')
      .reduce((feeSum, fee) => feeSum + fee.amount, 0), 0
  );

  const recentAnnouncements = mockAnnouncements
    .filter(a => a.targetRoles.includes('parent'))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {user.firstName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Monitor your {parent.children.length === 1 ? 'child&apos;s' : 'children&apos;s'} progress and stay connected.
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <DollarSign className="mr-2 h-4 w-4" />
            Pay Fees
          </Button>
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Teachers
          </Button>
        </div>
      </div>

      {/* Children Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {childrenData.map((child) => (
          <Card key={child.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={child.user.avatar} />
                  <AvatarFallback>
                    {child.user.firstName[0]}{child.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{child.user.firstName} {child.user.lastName}</CardTitle>
                  <CardDescription>Class {child.class}-{child.section} • Roll No: {child.rollNumber}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">{child.attendancePercentage}%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-600">
                    {child.results.length > 0 ? child.results[0].grade : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Latest Grade</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Performance</span>
                  <span>{child.results.length > 0 ? 'Good' : 'No data'}</span>
                </div>
                <Progress
                  value={child.results.length > 0 ? 85 : 0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parent.children.length}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled in school
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalPendingFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all children
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(childrenData.reduce((sum, child) => sum + child.attendancePercentage, 0) / childrenData.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Results</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {childrenData.reduce((sum, child) => sum + child.results.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total results uploaded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View with Tabs */}
      <Tabs defaultValue={parent.children[0]?.id} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          {parent.children.map((child) => (
            <TabsTrigger key={child.id} value={child.id} className="text-sm">
              {child.user.firstName}
            </TabsTrigger>
          ))}
        </TabsList>

        {parent.children.map((child) => {
          const childData = childrenData.find(c => c.id === child.id);
          if (!childData) return null;

          return (
            <TabsContent key={child.id} value={child.id} className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Results */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Results</CardTitle>
                    <CardDescription>
                      {child.user.firstName}&apos;s latest academic performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {childData.results.length > 0 ? (
                        childData.results.slice(0, 3).map((result) => (
                          <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">
                                {result.subjectId === 'sub-1' ? 'Mathematics' :
                                 result.subjectId === 'sub-2' ? 'Physics' : 'Chemistry'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Term {result.term} • {result.academicYear}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={result.grade === 'A+' ? 'default' : 'secondary'}>
                                {result.grade}
                              </Badge>
                              <p className="text-sm font-medium mt-1">{result.marks}/{result.maxMarks}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No results available yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Fee Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Fee Status</CardTitle>
                    <CardDescription>
                      Payment overview for {child.user.firstName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {childData.fees.length > 0 ? (
                        childData.fees.slice(0, 3).map((fee) => (
                          <div key={fee.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{fee.feeStructureId === 'fee-1' ? 'Tuition Fee' : 'Other Fee'}</p>
                              <p className="text-sm text-muted-foreground">
                                Due: {new Date(fee.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={
                                fee.status === 'paid' ? 'default' :
                                fee.status === 'overdue' ? 'destructive' : 'secondary'
                              }>
                                {fee.status}
                              </Badge>
                              <p className="text-sm font-medium mt-1">₦{fee.amount}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No fee records available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>School Announcements</CardTitle>
          <CardDescription>
            Latest updates from the school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAnnouncements.map((announcement) => (
              <div key={announcement.id} className="flex gap-3 p-4 border rounded-lg">
                <div className={`h-3 w-3 rounded-full mt-1 ${
                  announcement.priority === 'high' ? 'bg-red-500' :
                  announcement.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}