'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Crown, Filter, Download } from 'lucide-react';
import { rankingsApi, fetchClasses, fetchAcademicYears, usersApi, handleApiError } from '@/lib/api';
import { ClassRanking, StudentRanking, Class as ClassType } from '@/types';
import { toast } from 'sonner';

export function RankingsContent() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<ClassRanking | null>(null);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('first');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesData, yearsData, staffData] = await Promise.all([
          fetchClasses().catch((error) => {
            console.error('Failed to fetch classes:', error);
            return [];
          }),
          fetchAcademicYears().catch((error) => {
            console.error('Failed to fetch academic years:', error);
            return [];
          }),
          usersApi.getStaff().catch((error) => {
            console.error('Failed to fetch staff:', error);
            return [];
          }),
        ]);

        // Ensure base arrays
        const safeYearsData = Array.isArray(yearsData) ? yearsData : [];

        // Format classes to include academic year and class teacher info
        const rawClasses = Array.isArray(classesData) ? classesData : [];
        const formattedClasses: any[] = rawClasses.map((cls: any) => ({
          id: cls.id.toString(),
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          academicYear: cls.academic_year_name,
          academicYearId: cls.academic_year?.toString(),
          classTeacher: cls.class_teacher ? cls.class_teacher.toString() : undefined,
          classTeacherName: cls.class_teacher_name,
          studentCount: cls.student_count || 0,
        }));

        // Find the current staff profile if user is staff
        const currentStaff = Array.isArray(staffData)
          ? staffData.find((s: any) => s.user.id === user?.id)
          : null;

        // For staff: restrict to classes where they are class teacher, if any
        let filteredClasses = formattedClasses;
        if (user?.role === 'staff' && currentStaff) {
          const staffId = currentStaff.id?.toString?.() ?? String(currentStaff.id);
          const staffClasses = formattedClasses.filter(
            (cls: any) => cls.classTeacher === staffId
          );
          if (staffClasses.length > 0) {
            filteredClasses = staffClasses;
          }
        }

        setAllClasses(filteredClasses);
        setClasses(filteredClasses);
        setAcademicYears(safeYearsData);

        // Set defaults
        if (safeYearsData.length > 0) {
          const sortedYears = [...safeYearsData].sort(
            (a, b) => parseInt(b.id) - parseInt(a.id)
          );
          const latestYear = sortedYears[0];
          setSelectedYear(latestYear.id.toString());
        }

        // For students, auto-select their class (if available)
        if (user?.role === 'student' && user.profile?.current_class) {
          const studentClass = filteredClasses.find(
            (c: any) => c.id.toString() === user.profile.current_class.toString()
          );
          if (studentClass) {
            setSelectedClass(studentClass.id.toString());
          }
        }
      } catch (error) {
        toast.error(handleApiError(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  // Keep classes list in sync with selected academic year
  useEffect(() => {
    if (selectedYear && allClasses.length > 0) {
      const filtered = allClasses.filter(
        (cls: any) => cls.academicYearId?.toString() === selectedYear.toString()
      );
      setClasses(filtered);

      // Reset selection if current class is not in this year
      if (selectedClass && !filtered.find((cls: any) => cls.id.toString() === selectedClass)) {
        setSelectedClass('');
        setRankings(null);
      }
    } else {
      setClasses(allClasses);
    }
  }, [selectedYear, allClasses, selectedClass]);

  useEffect(() => {
    const fetchRankings = async () => {
      if (!selectedClass || !selectedTerm || !selectedYear) return;

      // Don't fetch if we're still loading initial data
      if (classes.length === 0 || academicYears.length === 0) return;

      // Don't fetch if already fetching
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        setIsLoadingRankings(true);
        const rankingsData = await rankingsApi.getClassRankings(selectedClass, selectedTerm, selectedYear);
        setRankings(rankingsData);
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
        toast.error('Failed to load rankings. Please check your selections.');
        setRankings(null);
      } finally {
        setIsLoadingRankings(false);
        isFetchingRef.current = false;
      }
    };

    fetchRankings();

    // Cleanup function to reset ref if effect is cancelled
    return () => {
      isFetchingRef.current = false;
    };
  }, [selectedClass, selectedTerm, selectedYear]);

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-orange-500" />;
    return <Trophy className="h-5 w-5 text-blue-500" />;
  };

  const getPositionBadgeColor = (position: number) => {
    if (position === 1) return 'bg-yellow-500 hover:bg-yellow-600';
    if (position === 2) return 'bg-gray-400 hover:bg-gray-500';
    if (position === 3) return 'bg-orange-500 hover:bg-orange-600';
    return 'bg-blue-500 hover:bg-blue-600';
  };

  const exportRankings = () => {
    if (!rankings) return;

    const csvContent = [
      ['Position', 'Student Name', 'Average %', 'Total Marks', 'Total Max', 'Subjects'],
      ...rankings.rankings.map(ranking => [
        ranking.position,
        ranking.student_name,
        ranking.average_percentage + '%',
        ranking.total_marks,
        ranking.total_max_marks,
        ranking.subjects.length
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rankings-${selectedTerm}-term-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`${selectedTerm.charAt(0).toUpperCase() + selectedTerm.slice(1)} term rankings exported successfully!`);
  };

  if (isLoading && !rankings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Class Rankings</h1>
            <p className="text-muted-foreground">View student performance rankings</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Rankings</h1>
          <p className="text-muted-foreground">View and analyze student performance rankings</p>
        </div>
        <div className="flex gap-2">
          {rankings && (
            <Button variant="outline" onClick={exportRankings}>
              <Download className="mr-2 h-4 w-4" />
              Export Rankings CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Rankings
          </CardTitle>
          <CardDescription>
            Select class, term, and academic year to view rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading classes..." : "Select a class"} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(classes) && classes.length > 0 ? (
                    classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      {isLoading ? "Loading..." : "No classes available"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">First Term</SelectItem>
                  <SelectItem value="second">Second Term</SelectItem>
                  <SelectItem value="third">Third Term</SelectItem>
                  <SelectItem value="final">Final Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading years..." : "Select academic year"} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(academicYears) && academicYears.length > 0 ? (
                    academicYears.map(year => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      {isLoading ? "Loading..." : "No academic years available"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rankings Display */}
      {isLoadingRankings ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading rankings...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : rankings ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rankings.total_students}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {rankings.rankings[0]?.student_name.split(' ')[0] || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {rankings.rankings[0]?.average_percentage.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Class Average</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rankings.rankings.length > 0
                    ? (rankings.rankings.reduce((sum, r) => sum + r.average_percentage, 0) / rankings.rankings.length).toFixed(1)
                    : '0.0'}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                <Medal className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rankings.rankings[0]?.subjects.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rankings List */}
          <Card>
            <CardHeader>
              <CardTitle>Student Rankings</CardTitle>
              <CardDescription>
                {rankings.class_info.term.charAt(0).toUpperCase() + rankings.class_info.term.slice(1)} Term Rankings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankings.rankings.map((student, index) => (
                  <div
                    key={student.student_id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      student.student_id === user?.id
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Position Badge */}
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getPositionBadgeColor(student.position)} text-white font-bold text-lg shadow-sm`}>
                        {student.position}
                      </div>

                      {/* Student Info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {student.student_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-base">
                            {student.student_name}
                            {student.student_id === user?.id && (
                              <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{student.subjects.length} subjects</span>
                            <span>{student.average_percentage.toFixed(1)}% average</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {student.average_percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {student.total_marks}/{student.total_max_marks} marks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subject-wise Analysis */}
          {rankings.rankings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Overview</CardTitle>
                <CardDescription>
                  Average performance across all subjects for this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {(() => {
                    // Group subjects by name and calculate averages
                    const subjectStats: { [key: string]: { total: number, count: number, grades: { [key: string]: number } } } = {};

                    rankings.rankings.forEach(student => {
                      student.subjects.forEach(subject => {
                        if (!subjectStats[subject.subject_name]) {
                          subjectStats[subject.subject_name] = { total: 0, count: 0, grades: {} };
                        }
                        subjectStats[subject.subject_name].total += subject.percentage;
                        subjectStats[subject.subject_name].count += 1;

                        const grade = subject.grade;
                        subjectStats[subject.subject_name].grades[grade] = (subjectStats[subject.subject_name].grades[grade] || 0) + 1;
                      });
                    });

                    return Object.entries(subjectStats).map(([subjectName, stats]) => {
                      const avgPerformance = stats.total / stats.count;
                      const mostCommonGrade = Object.entries(stats.grades).sort((a, b) => b[1] - a[1])[0];

                      return (
                        <div key={subjectName} className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">{subjectName}</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Average:</span>
                              <span className="font-medium">{avgPerformance.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Common Grade:</span>
                              <Badge variant="outline">{mostCommonGrade[0]}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Students:</span>
                              <span>{stats.count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        selectedClass && selectedTerm && selectedYear && !isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No Rankings Available</h3>
                <p className="text-muted-foreground mb-4">
                  No results found for the selected class, term, and academic year.
                </p>
                <p className="text-sm text-muted-foreground">
                  Try selecting different filters or add student results first.
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}