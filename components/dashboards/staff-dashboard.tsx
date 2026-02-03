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
  GraduationCap,
  Trophy
} from 'lucide-react';
import { usersApi, resultsApi, rankingsApi, announcementsApi, handleApiError } from '@/lib/api';
import { Student, Result, Staff, ClassRanking, StudentRanking, Announcement } from '@/types';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

function useStaffDashboardData() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [staffProfile, setStaffProfile] = useState<Staff | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [classRankings, setClassRankings] = useState<ClassRanking[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaffData = async () => {
      if (!user || user.role !== 'staff') return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch staff profile, students, results, and announcements
        console.log('Loading staff dashboard data...');
        const [staffData, studentsData, resultsData, announcementsData] = await Promise.all([
          usersApi.getStaff().catch((error) => { console.error('Failed to load staff:', error); return []; }),
          usersApi.getStudents().catch((error) => { console.error('Failed to load students:', error); return []; }),
          resultsApi.getList().catch((error) => { console.error('Failed to load results:', error); return []; }),
          announcementsApi.getList().catch((error) => { console.error('Failed to load announcements:', error); return []; }),
        ]);

        console.log(`Loaded: ${staffData.length} staff, ${studentsData.length} students, ${resultsData.length} results, ${announcementsData.length} announcements`);

        // Find the current user's staff profile
        const currentStaff = staffData.find((s: Staff) => s.user.id === user.id);
        setStaffProfile(currentStaff || null);

        setStudents(studentsData);
        setResults(resultsData);
        setAnnouncements(announcementsData);

        // Load rankings for staff's classes
        if (staffData.length > 0 && studentsData.length > 0 && resultsData.length > 0) {
          const currentStaff = staffData.find((s: Staff) => s.user.id === user.id);
          if (currentStaff && currentStaff.assignedClasses && currentStaff.assignedClasses.length > 0) {
            console.log('Staff assigned classes:', currentStaff.assignedClasses);
            try {
              // Get unique classes for this staff
              const staffClasses = [...new Set(studentsData
                .filter(student => currentStaff.assignedClasses!.some(assignedClass =>
                  student.class.toLowerCase().includes(assignedClass.toLowerCase())
                ))
                .map(student => ({
                  id: student.id,
                  name: student.class
                }))
              )];

              console.log('Found staff classes:', staffClasses);

              if (staffClasses.length > 0) {
                // Get the most recent academic year from results
                const academicYears = [...new Set(resultsData.map(result => result.academicYearId))];
                const latestYearId = academicYears.sort((a, b) => parseInt(b) - parseInt(a))[0];

                console.log('Available academic year IDs:', academicYears);
                console.log('Using latest year ID:', latestYearId);

                if (latestYearId) {
                  // Load rankings for each of the staff's classes
                  const rankingsPromises = staffClasses.slice(0, 2).map(async (classInfo) => { // Limit to first 2 classes for performance
                    try {
                      console.log(`Loading rankings for class: ${classInfo.name} (ID: ${classInfo.id}) with academic year ID: ${latestYearId}`);
                      const rankings = await rankingsApi.getClassRankings(classInfo.id.toString(), 'first', latestYearId.toString());
                      console.log(`Successfully loaded rankings for ${classInfo.name}:`, rankings.rankings?.length || 0, 'students');
                      return {
                        ...rankings,
                        class_info: {
                          ...rankings.class_info,
                          class_name: classInfo.name
                        }
                      };
                    } catch (error) {
                      console.error(`Failed to load rankings for class ${classInfo.name}:`, error);
                      return null;
                    }
                  });

                  const rankingsResults = await Promise.all(rankingsPromises);
                  const validRankings = rankingsResults.filter(ranking => ranking !== null);
                  console.log(`Loaded ${validRankings.length} class rankings for staff dashboard`);
                  setClassRankings(validRankings as ClassRanking[]);
                }
              }
            } catch (rankingError) {
              console.error('Failed to load rankings for staff dashboard:', rankingError);
              // Don't fail the entire dashboard load if rankings fail
              setClassRankings([]);
            }
          } else {
            console.log('Staff has no assigned classes or no students/results data');
            setClassRankings([]);
          }
        } else {
          console.log('No staff data available');
          setClassRankings([]);
        }
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
    classRankings,
    announcements,
    isLoading,
    error,
  };
}

export function StaffDashboard() {
  const { user } = useAuth();
  const { students, staffProfile, results, classRankings, announcements, isLoading, error } = useStaffDashboardData();

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
            <Trophy className="mr-2 h-4 w-4" />
            View Rankings
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

      {/* Class Rankings */}
      {classRankings.length > 0 && classRankings.some(ranking => ranking.rankings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Class Rankings
            </CardTitle>
            <CardDescription>
              Student performance rankings in your classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {classRankings.map((ranking, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold mb-4">
                    {ranking.class_info.class_name || 'Class'} - {ranking.class_info.term.charAt(0).toUpperCase() + ranking.class_info.term.slice(1)} Term {ranking.class_info.academic_year}
                  </h3>
                  <div className="space-y-3">
                  {ranking.rankings?.slice(0, 10).map((student, studentIndex) => (
                    <div
                      key={student.student_id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          student.position === 1 ? 'bg-yellow-500 text-white' :
                          student.position === 2 ? 'bg-gray-400 text-white' :
                          student.position === 3 ? 'bg-orange-500 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {student.position}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student.student_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.subjects?.length || 0} subjects • {student.average_percentage?.toFixed(1) || '0.0'}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{student.total_marks || 0}/{student.total_max_marks || 0}</p>
                        <p className="text-xs text-muted-foreground">Total Marks</p>
                      </div>
                    </div>
                  ))}
                  {(ranking.rankings?.length || 0) > 10 && (
                    <p className="text-center text-sm text-muted-foreground">
                      And {(ranking.rankings?.length || 0) - 10} more students...
                    </p>
                  )}
                  {(ranking.rankings?.length || 0) === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No rankings available</p>
                      <p className="text-sm">Add student results to see class rankings</p>
                    </div>
                  )}
                </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Announcements */}
      {announcements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Announcements
            </CardTitle>
            <CardDescription>
              Important notices and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-0.5">
                    {announcement.priority === 'urgent' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    {announcement.priority === 'high' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                    {announcement.priority === 'medium' && <Clock className="h-4 w-4 text-blue-600" />}
                    {announcement.priority === 'low' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(announcement.createdAt).toLocaleDateString()} • {announcement.createdBy}
                    </p>
                  </div>
                </div>
              ))}

              {announcements.length > 3 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    View All Announcements
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              <Trophy className="h-6 w-6" />
              Class Rankings
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              View Students
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              Mark Attendance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}