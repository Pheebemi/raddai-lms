'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, TrendingUp, Calendar, Download, Filter, Trophy } from 'lucide-react';
import { resultsApi, announcementsApi, usersApi, rankingsApi, handleApiError } from '@/lib/api';
import { Result, Student, ClassRanking, StudentRanking } from '@/types';
import { toast } from 'sonner';

export function ResultsContent() {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [classRankings, setClassRankings] = useState<ClassRanking | null>(null);
  const [showRankings, setShowRankings] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await resultsApi.getList();
        setResults(data);
        setFilteredResults(data);
      } catch (error) {
        toast.error(handleApiError(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, []);

  useEffect(() => {
    let filtered = results;

    if (selectedTerm !== 'all') {
      filtered = filtered.filter(result => result.term === selectedTerm);
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(result => result.academicYear === selectedYear);
    }

    setFilteredResults(filtered);
  }, [results, selectedTerm, selectedYear]);

  // Load class rankings when filters change (for PNG download)
  useEffect(() => {
    const loadRankings = async () => {
      if (selectedTerm !== 'all' && selectedYear !== 'all' && user?.profile?.current_class) {
        try {
          const rankings = await rankingsApi.getClassRankings(
            user.profile.current_class.id?.toString() || '',
            selectedTerm,
            selectedYear
          );
          setClassRankings(rankings);
        } catch (error) {
          console.error('Failed to load rankings for PNG download:', error);
          setClassRankings(null);
        }
      } else {
        setClassRankings(null);
      }
    };

    loadRankings();
  }, [selectedTerm, selectedYear, user?.profile?.current_class]);

  // Load class rankings when filters change
  useEffect(() => {
    const loadRankings = async () => {
      if (selectedTerm !== 'all' && selectedYear !== 'all' && user?.profile?.current_class) {
        try {
          // Debug logging
          console.log('Loading rankings for user:', user.id);
          console.log('User profile:', user.profile);
          console.log('Current class:', user.profile.current_class);
          console.log('Class ID:', user.profile.current_class?.id);
          console.log('Class ID type:', typeof user.profile.current_class?.id);
          console.log('Full current_class object:', JSON.stringify(user.profile.current_class, null, 2));

          const classId = user.profile.current_class.id?.toString();
          if (!classId) {
            console.error('No class ID found for user - cannot load rankings');
            setClassRankings(null);
            return;
          }

          console.log('Calling rankings API with:', { classId, selectedTerm, selectedYear });
          const rankings = await rankingsApi.getClassRankings(
            classId,
            selectedTerm,
            selectedYear
          );
          setClassRankings(rankings);
        } catch (error) {
          console.error('Failed to load rankings:', error);
          setClassRankings(null);
        }
      } else {
        console.log('Skipping rankings load - conditions not met:', {
          selectedTerm,
          selectedYear,
          hasCurrentClass: !!user?.profile?.current_class
        });
        setClassRankings(null);
      }
    };

    loadRankings();
  }, [selectedTerm, selectedYear, user?.profile?.current_class]);

  // Get student's ranking position
  const getStudentRanking = (): StudentRanking | null => {
    if (!classRankings || !user) return null;
    return classRankings.rankings.find((ranking: StudentRanking) => ranking.student_id === user.id) || null;
  };

  // Group results by term
  const resultsByTerm = filteredResults.reduce((acc, result) => {
    if (!acc[result.term]) {
      acc[result.term] = [];
    }
    acc[result.term].push(result);
    return acc;
  }, {} as Record<string, Result[]>);

  // Get unique terms and years for filters
  const availableTerms = Array.from(new Set(results.map(r => r.term)));
  const availableYears = Array.from(new Set(results.map(r => r.academicYear)));

  // Function to generate and download PNG result sheet
  const downloadResultAsPNG = async (term: string, termResults: Result[]) => {
    if (!user) return;

    setIsDownloading(term);
    try {
      // Fetch student's class information and position
      let studentClass = 'Not Available';
      let studentPosition = 'N/A';

      try {
        // Get student class from profile
        if (user?.profile?.current_class) {
          studentClass = user.profile.current_class;
        }

        // Get student position from rankings API for the specific term and year
        const academicYearId = termResults[0]?.academicYearId?.toString();
        const classId = user?.profile?.current_class_id?.toString();
        // Fallback: if current_class_id doesn't exist yet, try to get class ID from classes API by name
        let finalClassId = classId;
        if (!finalClassId && user?.profile?.current_class) {
          try {
            // This is a temporary fallback - will be removed once backend is restarted
            console.log('Fallback: current_class_id not available, using current_class name:', user.profile.current_class);
            // For now, we'll skip rankings if current_class_id is not available
            finalClassId = null;
          } catch (e) {
            console.log('Fallback failed:', e);
            finalClassId = null;
          }
        }

        if (academicYearId && finalClassId) {
          try {
            const termRankings = await rankingsApi.getClassRankings(
              classId,
              term,
              academicYearId
            );

            // Match by student profile ID (backend returns student.id which is the Student model ID)
            const studentRanking = termRankings.rankings.find(
              (r: StudentRanking) => String(r.student_id) === String(user.profile?.id) ||
                     String(r.student_id) === String(user.id)
            );
            if (studentRanking) {
              const position = studentRanking.position;
              studentPosition = `${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'}`;
            } else {
              studentPosition = 'N/A';
            }
          } catch (rankingError) {
            console.log('Could not load rankings for PNG:', rankingError);
            studentPosition = 'N/A';
          }
        } else {
          studentPosition = 'N/A';
        }
      } catch (error) {
        console.log('Could not fetch student position data:', error);
        studentPosition = 'N/A';
      }
      // Create canvas for the result sheet
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Set canvas size (A4-like dimensions at 300 DPI)
      const width = 2480; // 8.27 inches * 300 DPI
      const height = 3508; // 11.69 inches * 300 DPI
      canvas.width = width;
      canvas.height = height;

      // Set white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Set font and colors
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 72px Arial';
      let yPosition = 120;

      // School Header with better design
      ctx.textAlign = 'center';

      // School logo area (placeholder - you can add actual logo later)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(width/2 - 200, yPosition - 80, 400, 120);

      ctx.fillText('RADDAI METROPOLITAN SCHOOL', width / 2, yPosition);
      yPosition += 60;
      ctx.font = '48px Arial';
      ctx.fillText('JALINGO', width / 2, yPosition);
      yPosition += 80;

      // Result title
      ctx.font = 'bold 56px Arial';
      ctx.fillStyle = '#1a365d';
      ctx.fillText('ACADEMIC RESULT SHEET', width / 2, yPosition);
      yPosition += 80;

      // Term and Session info
      ctx.font = 'bold 40px Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(`${term.charAt(0).toUpperCase() + term.slice(1)} TERM`, width / 2, yPosition);
      yPosition += 60;
      ctx.font = '36px Arial';
      ctx.fillText(`ACADEMIC SESSION: ${termResults[0]?.academicYear}`, width / 2, yPosition);
      yPosition += 100;

      // Student Information Box
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(100, yPosition - 20, width - 200, 200);
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(100, yPosition - 20, width - 200, 200);

      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';

      // Left column
      ctx.fillText('STUDENT NAME:', 150, yPosition + 30);
      ctx.fillText('STUDENT ID:', 150, yPosition + 80);
      ctx.fillText('CLASS:', 150, yPosition + 130);
      ctx.fillText('POSITION:', 150, yPosition + 180);

      // Right column values
      ctx.font = '32px Arial';
      ctx.fillText(`${user.firstName} ${user.lastName}`, 500, yPosition + 30);
      ctx.fillText(user.id, 500, yPosition + 80);
      ctx.fillText(studentClass, 500, yPosition + 130);
      ctx.fillText(studentPosition, 500, yPosition + 180);

      yPosition += 250;

      // Results Table
      ctx.font = 'bold 28px Arial';
      const colWidths = [450, 100, 100, 100, 100, 120, 120, 100];
      const headers = ['SUBJECT', 'CA1', 'CA2', 'CA3', 'CA4', 'EXAM', 'TOTAL', 'GRADE'];
      let xPosition = 120;

      // Table header with better styling
      ctx.fillStyle = '#1a365d';
      ctx.fillRect(100, yPosition - 30, width - 200, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';

      for (let i = 0; i < headers.length; i++) {
        ctx.fillText(headers[i], xPosition, yPosition);
        xPosition += colWidths[i];
      }
      yPosition += 80;

      // Draw table rows with better styling
      ctx.font = '24px Arial';
      termResults.forEach((result, index) => {
        // Alternate row background
        if (index % 2 === 0) {
          ctx.fillStyle = '#f8f9fa';
          ctx.fillRect(100, yPosition - 30, width - 200, 50);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(100, yPosition - 30, width - 200, 50);
        }
        ctx.fillStyle = '#000000';

        xPosition = 120;
        const rowData = [
          result.subject_name || result.subjectId,
          result.ca1_score.toString(),
          result.ca2_score.toString(),
          result.ca3_score.toString(),
          result.ca4_score.toString(),
          result.exam_score.toString(),
          result.marks_obtained.toString(),
          result.grade
        ];

        for (let i = 0; i < rowData.length; i++) {
          ctx.fillText(rowData[i], xPosition, yPosition);
          xPosition += colWidths[i];
        }
        yPosition += 60;
      });

      // Performance Summary Box
      yPosition += 60;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(100, yPosition - 20, width - 200, 150);
      ctx.fillStyle = '#f0f8ff';
      ctx.fillRect(100, yPosition - 20, width - 200, 150);

      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';

      ctx.fillText('PERFORMANCE SUMMARY:', 150, yPosition + 40);
      ctx.font = '28px Arial';
      const totalMarksSummary = termResults.reduce((sum, r) => sum + r.marks_obtained, 0);
      const averagePercentage = termResults.length > 0 ? (totalMarksSummary / termResults.length).toFixed(2) : '0';
      const overallGrade = termResults.length > 0 ? termResults[0].grade : 'N/A';

      ctx.fillText(`Average Score: ${averagePercentage}%`, 200, yPosition + 80);
      ctx.fillText(`Overall Grade: ${overallGrade}`, 200, yPosition + 110);

      // Footer
      yPosition += 200;
      ctx.font = '20px Arial';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, width / 2, yPosition);
      yPosition += 40;
      ctx.fillText('This is an official academic result document from Raddai Metropolitan School Jalingo', width / 2, yPosition);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Raddai_Metropolitan_School_${term}_term_results_${termResults[0]?.academicYear}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Result downloaded successfully!');
        }
      }, 'image/png');

    } catch (error) {
      toast.error('Failed to generate result: ' + handleApiError(error));
    } finally {
      setIsDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Results</h1>
            <p className="text-muted-foreground">View your academic performance</p>
          </div>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Results</h1>
          <p className="text-muted-foreground">View your academic performance across all subjects</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowRankings(!showRankings)}
            disabled={!classRankings}
          >
            <Trophy className="mr-2 h-4 w-4" />
            {showRankings ? 'Hide Rankings' : 'Show Rankings'}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {availableTerms.map(term => (
                    <SelectItem key={term} value={term}>{term}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Rankings */}
      {showRankings && classRankings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Class Rankings - {classRankings.class_info.term.charAt(0).toUpperCase() + classRankings.class_info.term.slice(1)} Term
            </CardTitle>
            <CardDescription>
              Your position: {getStudentRanking()?.position || 'N/A'} out of {classRankings.total_students} students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classRankings.rankings.slice(0, 10).map((ranking: StudentRanking, index: number) => (
                <div
                  key={ranking.student_id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    ranking.student_id === user?.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      ranking.position === 1 ? 'bg-yellow-500 text-white' :
                      ranking.position === 2 ? 'bg-gray-400 text-white' :
                      ranking.position === 3 ? 'bg-orange-500 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {ranking.position}
                    </div>
                    <div>
                      <p className="font-medium">{ranking.student_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {ranking.subjects.length} subjects • {ranking.average_percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{ranking.total_marks}/{ranking.total_max_marks}</p>
                    <p className="text-sm text-muted-foreground">Total Marks</p>
                  </div>
                </div>
              ))}
              {classRankings.rankings.length > 10 && (
                <p className="text-center text-sm text-muted-foreground">
                  And {classRankings.rankings.length - 10} more students...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results by Term */}
      <div className="space-y-6">
        {Object.keys(resultsByTerm).length > 0 ? (
          Object.entries(resultsByTerm).map(([term, termResults]) => (
            <div key={term} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{term.charAt(0).toUpperCase() + term.slice(1)} Term - {termResults[0]?.academicYear}</h2>
                <Button
                  onClick={() => downloadResultAsPNG(term, termResults)}
                  disabled={isDownloading === term}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading === term ? 'Generating...' : 'Download PNG'}
                </Button>
              </div>
              <Card>
                <CardContent className="p-6">
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
                          <TableCell className="font-medium">
                            {result.subject_name || result.subjectId}
                          </TableCell>
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
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  {selectedTerm !== 'all' || selectedYear !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : user?.role === 'student' || user?.role === 'parent'
                      ? 'Your academic results will appear here once the school fees for that term have been paid and results are published.'
                      : 'Your academic results will appear here once they are published.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}