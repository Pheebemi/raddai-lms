'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Users,
  BookOpen,
  Upload,
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';
import { usersApi, resultsApi, handleApiError } from '@/lib/api';
import { Student, Result, Staff } from '@/types';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

function useStaffDashboardData() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [staffProfile, setStaffProfile] = useState<Staff | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaffData = async () => {
      if (!user || user.role !== 'staff') return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch staff profile, students, and results
        const [staffData, studentsData, resultsData] = await Promise.all([
          usersApi.getStaff().catch(() => []),
          usersApi.getStudents().catch(() => []),
          resultsApi.getList().catch(() => []),
        ]);

        // Find the current user's staff profile
        const currentStaff = staffData.find((s: Staff) => s.user.id === user.id);
        setStaffProfile(currentStaff || null);

        setStudents(studentsData);
        setResults(resultsData);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffData();
  }, [user]);

  return {
    students,
    staffProfile,
    results,
    isLoading,
    error,
  };
}

export function StaffDashboard() {
  const { user } = useAuth();
  const { students, staffProfile, results, isLoading, error } = useStaffDashboardData();

  // Filter students for this staff member (students in their classes)
  const assignedStudents = useMemo(() => {
    if (!staffProfile) {
      // If no staff profile found, return empty array
      return [];
    }
    
    // If staff has no assigned classes, show all students (fallback)
    if (!staffProfile.assignedClasses || staffProfile.assignedClasses.length === 0) {
      console.warn('Staff has no assigned classes, showing all students');
      return students;
    }
    
    // Filter students whose class matches any of the staff's assigned classes
    return students.filter(student => {
      if (!student.class) return false;
      
      const studentClass = student.class.toLowerCase().trim();
      
      return staffProfile.assignedClasses!.some(assignedClass => {
        if (!assignedClass) return false;
        
        const assignedClassLower = assignedClass.toLowerCase().trim();
        
        // Exact match
        if (studentClass === assignedClassLower) return true;
        
        // Check if student class contains assigned class name (handles "Grade 10 A" vs "Grade 10")
        if (studentClass.includes(assignedClassLower)) return true;
        
        // Check if assigned class contains student class name
        if (assignedClassLower.includes(studentClass)) return true;
        
        // Extract grade numbers and compare (handles "Grade 10" vs "10")
        const studentGradeMatch = studentClass.match(/(\d+)/);
        const assignedGradeMatch = assignedClassLower.match(/(\d+)/);
        if (studentGradeMatch && assignedGradeMatch) {
          if (studentGradeMatch[1] === assignedGradeMatch[1]) {
            // If grades match, check section if present
            const studentSection = studentClass.match(/[a-z]$/i)?.[0];
            const assignedSection = assignedClassLower.match(/[a-z]$/i)?.[0];
            if (!assignedSection || studentSection === assignedSection) {
              return true;
            }
          }
        }
        
        return false;
      });
    });
  }, [students, staffProfile]);

  // Filter results uploaded by this staff member
  const recentUploads = useMemo(() => {
    return results
      .filter(r => r.teacherId === user?.id)
      .slice(0, 3);
  }, [results, user?.id]);

  // Calculate statistics
  const totalAssignedStudents = assignedStudents.length;
  const pendingResults = results.filter(r => r.teacherId === user?.id && !r.grade).length;
  const avgClassPerformance = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
    : 0;

  if (!user) return null;

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
              <AlertTriangle className="h-5 w-5" />
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
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignedStudents}</div>
            <p className="text-xs text-muted-foreground">
              Students in your classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Results Uploaded</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentUploads.length}</div>
            <p className="text-xs text-muted-foreground">
              Recent uploads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects Taught</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(results.filter(r => r.teacherId === user?.id).map(r => r.subjectId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Different subjects
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
              Student average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Assigned Students */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>My Students</CardTitle>
            <CardDescription>
              Students in your assigned classes
              {staffProfile?.assignedClasses && staffProfile.assignedClasses.length > 0 && (
                <span className="ml-2">
                  ({staffProfile.assignedClasses.length} class{staffProfile.assignedClasses.length !== 1 ? 'es' : ''})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignedStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedStudents.map((student) => {
                    // Calculate average performance for this student
                    const studentResults = results.filter(r => r.studentId === student.id);
                    const avgPerformance = studentResults.length > 0
                      ? Math.round(studentResults.reduce((sum, r) => sum + r.percentage, 0) / studentResults.length)
                      : 0;

                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {student.user.firstName[0]}{student.user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {student.user.firstName} {student.user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {student.studentId}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell>
                          {avgPerformance > 0 ? (
                            <div className="flex items-center gap-2">
                              <Progress value={avgPerformance} className="w-16 h-2" />
                              <span className="text-xs font-medium">{avgPerformance}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No data</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No students assigned yet</p>
                <p className="text-sm">Students in your classes will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Result Uploads */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>
              Results you&apos;ve uploaded recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUploads.length > 0 ? (
                recentUploads.map((result) => {
                  const student = assignedStudents.find(s => s.id === result.studentId);
                  return (
                    <div key={result.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {student?.user.firstName[0]}{student?.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {student?.user.firstName} {student?.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.subject_name || result.subjectId} • {result.term}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-1">
                          {result.grade}
                        </Badge>
                        <p className="text-xs font-medium">{result.marks_obtained}/{result.total_marks}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent uploads</p>
                  <p className="text-sm">Upload results to see them here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
          <CardDescription>
            Average performance across subjects you've taught
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Group results by subject */}
            {Object.entries(
              results
                .filter(r => r.teacherId === user?.id)
                .reduce((acc, result) => {
                  const subjectKey = result.subject_name || result.subjectId;
                  if (!acc[subjectKey]) {
                    acc[subjectKey] = [];
                  }
                  acc[subjectKey].push(result);
                  return acc;
                }, {} as Record<string, Result[]>)
            ).map(([subject, subjectResults]) => {
              const avgPerformance = subjectResults.length > 0
                ? Math.round(subjectResults.reduce((sum, r) => sum + r.percentage, 0) / subjectResults.length)
                : 0;

              return (
                <div key={subject} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{subject}</span>
                    <span className="text-sm text-muted-foreground">
                      {avgPerformance}% average ({subjectResults.length} results)
                    </span>
                  </div>
                  <Progress value={avgPerformance} className="h-2" />
                </div>
              );
            })}
            {results.filter(r => r.teacherId === user?.id).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No performance data yet</p>
                <p className="text-sm">Upload results to see performance metrics</p>
              </div>
            )}
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