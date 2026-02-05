'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import { fetchClasses, fetchSubjects, fetchAcademicYears, resultsApi } from '@/lib/api';

interface ResultExportData {
  id: string;
  studentName: string;
  studentId: string;
  className: string;
  subjectName: string;
  term: string;
  academicYear: string;
  ca1_score: number;
  ca2_score: number;
  ca3_score: number;
  ca4_score: number;
  exam_score: number;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  remarks: string;
  uploadedBy: string;
  uploadDate: string;
}

export function ResultsExportContent() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [results, setResults] = useState<ResultExportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const terms = [
    { id: 'first', name: 'First Term' },
    { id: 'second', name: 'Second Term' },
    { id: 'third', name: 'Third Term' },
    { id: 'final', name: 'Final Exam' },
  ];

  // Load initial data
  useEffect(() => {
    if (!user) {
      setIsInitialLoading(false);
      return;
    }

    const loadInitialData = async () => {
      setIsInitialLoading(true);
      try {
        const [classesData, subjectsData, yearsData] = await Promise.all([
          fetchClasses(),
          fetchSubjects(),
          fetchAcademicYears(),
        ]);

        // Ensure data is in array format
        const safeClassesData = Array.isArray(classesData) ? classesData : [];
        const safeSubjectsData = Array.isArray(subjectsData) ? subjectsData : [];
        const safeYearsData = Array.isArray(yearsData) ? yearsData : [];

        setClasses(safeClassesData);
        setSubjects(safeSubjectsData);
        setAcademicYears(safeYearsData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // Load results when filters change
  useEffect(() => {
    const loadResults = async () => {
      // Only load if at least one filter is set
      const hasFilters = selectedClass || selectedSubject || selectedAcademicYear || selectedTerm;

      if (!hasFilters) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Get all results since this is management
        const allResults = await resultsApi.getList();

        // Apply filters client-side for flexibility
        let filteredResults = allResults;

        if (selectedClass) {
          filteredResults = filteredResults.filter(r => r.classId === selectedClass);
        }

        if (selectedSubject) {
          filteredResults = filteredResults.filter(r => r.subjectId === selectedSubject);
        }

        if (selectedAcademicYear) {
          filteredResults = filteredResults.filter(r => r.academicYearId === selectedAcademicYear);
        }

        if (selectedTerm) {
          filteredResults = filteredResults.filter(r => r.term === selectedTerm);
        }

        // Convert to export format
        const exportData: ResultExportData[] = filteredResults.map(result => ({
          id: result.id,
          studentName: result.studentName || 'Unknown Student',
          studentId: result.studentId || '',
          className: result.class || 'Unknown Class',
          subjectName: result.subject_name || 'Unknown Subject',
          term: result.term,
          academicYear: result.academicYear || 'Unknown Year',
          ca1_score: result.ca1_score,
          ca2_score: result.ca2_score,
          ca3_score: result.ca3_score,
          ca4_score: result.ca4_score,
          exam_score: result.exam_score,
          marks_obtained: result.marks_obtained,
          total_marks: result.total_marks,
          percentage: result.percentage,
          grade: result.grade,
          remarks: result.remarks,
          uploadedBy: result.teacherId || 'Unknown',
          uploadDate: result.createdAt,
        }));

        // Sort by class, then student name, then subject, then term
        exportData.sort((a, b) => {
          const classCompare = a.className.localeCompare(b.className);
          if (classCompare !== 0) return classCompare;

          const nameCompare = a.studentName.localeCompare(b.studentName);
          if (nameCompare !== 0) return nameCompare;

          const subjectCompare = a.subjectName.localeCompare(b.subjectName);
          if (subjectCompare !== 0) return subjectCompare;

          const termOrder = { first: 1, second: 2, third: 3, final: 4 };
          return termOrder[a.term as keyof typeof termOrder] - termOrder[b.term as keyof typeof termOrder];
        });

        setResults(exportData);
      } catch (error) {
        console.error('Failed to load results:', error);
        toast.error('Failed to load results');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [selectedClass, selectedSubject, selectedAcademicYear, selectedTerm]);

  const handleExport = async () => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    setIsExporting(true);
    try {
      // Generate CSV content
      const csvContent = [
        [
          'Student ID',
          'Student Name',
          'Class',
          'Subject',
          'Term',
          'Academic Year',
          'CA1 Score',
          'CA2 Score',
          'CA3 Score',
          'CA4 Score',
          'CA Total',
          'Exam Score',
          'Total Marks',
          'Percentage',
          'Grade',
          'Remarks',
          'Uploaded By',
          'Upload Date'
        ].join(','),
        ...results.map(result => [
          result.studentId,
          `"${result.studentName}"`,
          `"${result.className}"`,
          `"${result.subjectName}"`,
          result.term,
          result.academicYear,
          result.ca1_score,
          result.ca2_score,
          result.ca3_score,
          result.ca4_score,
          result.ca1_score + result.ca2_score + result.ca3_score + result.ca4_score,
          result.exam_score,
          result.marks_obtained,
          result.percentage,
          result.grade,
          `"${result.remarks || ''}"`,
          `"${result.uploadedBy}"`,
          result.uploadDate
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `results-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success(`Exported ${results.length} results successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export results');
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedAcademicYear('');
    setSelectedTerm('');
  };

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Results Export</h1>
            <p className="text-muted-foreground">Loading form data...</p>
          </div>
        </div>
        <div className="grid gap-6">
          <div className="animate-pulse">
            <div className="h-32 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results Export</h1>
          <p className="text-muted-foreground">
            Export student results across all classes and academic years with advanced filtering
          </p>
        </div>
        <div className="flex gap-2">
          {results.length > 0 && (
            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : `Export ${results.length} Results`}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Results
          </CardTitle>
          <CardDescription>
            Apply filters to narrow down the results you want to export. Leave fields empty to include all.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class (Optional)</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(classes) && classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(subjects) && subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year (Optional)</Label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(academicYears) && academicYears.map(year => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term (Optional)</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="All terms" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(term => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <Filter className="h-4 w-4" />
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Results Preview ({results.length} results)
          </CardTitle>
          <CardDescription>
            Preview the results that will be exported. Results are sorted by student name, then subject.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading results...</p>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {/* Results Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">Student</th>
                        <th className="text-left p-3 font-medium">Subject</th>
                        <th className="text-left p-3 font-medium">Term</th>
                        <th className="text-left p-3 font-medium">Year</th>
                        <th className="text-center p-3 font-medium">Scores</th>
                        <th className="text-center p-3 font-medium">Total</th>
                        <th className="text-center p-3 font-medium">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.slice(0, 20).map((result) => (
                        <tr key={result.id} className="border-t">
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{result.studentName}</div>
                              <div className="text-sm text-muted-foreground">
                                {result.studentId} • {result.className}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">{result.subjectName}</td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {result.term.charAt(0).toUpperCase() + result.term.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-3">{result.academicYear}</td>
                          <td className="p-3">
                            <div className="text-sm space-y-1">
                              <div>CA: {result.ca1_score + result.ca2_score + result.ca3_score + result.ca4_score}/40</div>
                              <div>Exam: {result.exam_score}/60</div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="font-medium">{result.marks_obtained}/100</div>
                            <div className="text-sm text-muted-foreground">
                              {result.percentage.toFixed(1)}%
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={result.grade.startsWith('A') ? 'default' : 'secondary'}>
                              {result.grade}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {results.length > 20 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing first 20 results. Export to see all {results.length} results.
                  </p>
                </div>
              )}

              {/* Export Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleExport} disabled={isExporting} size="lg" className="gap-2">
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exporting...' : `Export All ${results.length} Results`}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-4">
                Apply filters above to load and preview results for export.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}