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
import { fetchClasses, fetchSubjects, fetchAcademicYears, resultsApi, rankingsApi } from '@/lib/api';

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
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
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
          remarks: result.remarks ?? '',
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

  const handleBatchPNGDownload = async () => {
    if (!selectedClass || !selectedTerm || !selectedAcademicYear) {
      toast.error('Please select a class, term and academic year first');
      return;
    }

    // Group results by student
    const byStudent: Record<string, ResultExportData[]> = {};
    results.forEach(r => {
      if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
      byStudent[r.studentId].push(r);
    });

    const studentIds = Object.keys(byStudent);
    if (studentIds.length === 0) {
      toast.error('No results to download');
      return;
    }

    setIsBatchDownloading(true);
    setBatchProgress(0);

    // Fetch rankings so position is accurate per student
    let rankings: any[] = [];
    try {
      const rankData = await rankingsApi.getClassRankings(selectedClass, selectedTerm, selectedAcademicYear);
      rankings = rankData.rankings || [];
      console.log('Rankings fetched:', rankings.length, 'Sample student_id:', rankings[0]?.student_id);
      console.log('Student IDs in results:', studentIds.slice(0, 3));
    } catch (e) {
      console.error('Rankings fetch failed:', e);
      toast.error('Could not fetch rankings — positions will show N/A');
    }

    const className = classes.find(c => c.id === selectedClass)?.name || 'Class';
    const termLabel = `${selectedTerm.charAt(0).toUpperCase() + selectedTerm.slice(1)} Term`;
    const yearLabel = academicYears.find(y => y.id.toString() === selectedAcademicYear)?.name || selectedAcademicYear;

    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      for (let i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        const studentResults = byStudent[studentId];
        const studentName = studentResults[0]?.studentName || 'Unknown';

        // Find position for this student from rankings
        const ranking = rankings.find((r: any) => String(r.student_id) === String(studentId));
        const position = ranking?.position;
        const positionLabel = position
          ? `${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'}`
          : 'N/A';

        const canvas = document.createElement('canvas');
        const width = 2480;
        const height = 3508;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        const marginLeft = 160;
        const marginRight = 160;
        let y = 100;

        // Logo
        const logoSize = 260;
        await new Promise<void>(resolve => {
          const img = new window.Image();
          img.onload = () => { ctx.drawImage(img, width / 2 - logoSize / 2, y, logoSize, logoSize); resolve(); };
          img.onerror = () => resolve();
          img.src = '/logo.png';
        });
        y += logoSize + 60;

        // School name
        ctx.textAlign = 'center';
        ctx.font = 'bold 80px serif';
        ctx.fillStyle = '#000000';
        ctx.fillText('LAAZEERE ACADEMY', width / 2, y);
        y += 66;
        ctx.font = '44px serif';
        ctx.fillStyle = '#374151';
        ctx.fillText('Samunaka Sabon Gari, Jalingo, Taraba State', width / 2, y);
        y += 50;
        ctx.font = '38px serif';
        ctx.fillText('Tel: 08066115707 | 09060405589', width / 2, y);
        y += 60;

        // Dividers
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(marginLeft, y); ctx.lineTo(width - marginRight, y); ctx.stroke();
        y += 8;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(marginLeft, y); ctx.lineTo(width - marginRight, y); ctx.stroke();
        y += 50;

        ctx.font = 'bold 68px serif';
        ctx.fillStyle = '#000';
        ctx.fillText('STUDENT ACADEMIC RESULT', width / 2, y);
        y += 60;
        ctx.font = '46px serif';
        ctx.fillStyle = '#374151';
        ctx.fillText(`(${className})`, width / 2, y);
        y += 70;

        // Student info row
        ctx.textAlign = 'left';
        ctx.font = 'bold 40px serif';
        ctx.fillStyle = '#000';
        ctx.fillText(`NAME: ${studentName.toUpperCase()}`, marginLeft, y);
        ctx.textAlign = 'right';
        ctx.fillText(`ID. NO: ${studentResults[0]?.studentId || ''}`, width - marginRight, y);
        y += 10;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(marginLeft, y); ctx.lineTo(width - marginRight, y); ctx.stroke();
        y += 16;
        ctx.textAlign = 'left';
        ctx.fillText(`SESSION: ${yearLabel}`, marginLeft, y);
        ctx.textAlign = 'right';
        ctx.fillText(`TERM: ${termLabel.toUpperCase()}`, width - marginRight, y);
        y += 10;
        ctx.beginPath(); ctx.moveTo(marginLeft, y); ctx.lineTo(width - marginRight, y); ctx.stroke();
        y += 16;
        ctx.textAlign = 'left';
        ctx.fillText(`POSITION IN CLASS: ${positionLabel}`, marginLeft, y + 30);
        y += 70;

        // Results table header
        const cols = [marginLeft, 760, 1020, 1280, 1540, 1800, 2060, width - marginRight];
        const headers = ['SUBJECT', 'CA1', 'CA2', 'CA3', 'CA4', 'EXAM', 'TOTAL', 'GRADE'];
        const rowH = 90;

        ctx.fillStyle = '#000';
        ctx.fillRect(marginLeft, y, width - marginLeft - marginRight, rowH);
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#fff';
        headers.forEach((h, idx) => {
          ctx.textAlign = idx === 0 ? 'left' : 'center';
          const cx = idx === 0 ? cols[idx] + 20 : (cols[idx] + cols[idx + 1]) / 2;
          ctx.fillText(h, cx, y + 60);
        });
        y += rowH;

        // Result rows
        studentResults.forEach((r, ri) => {
          ctx.fillStyle = ri % 2 === 0 ? '#f9fafb' : '#ffffff';
          ctx.fillRect(marginLeft, y, width - marginLeft - marginRight, rowH);
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 1;
          ctx.strokeRect(marginLeft, y, width - marginLeft - marginRight, rowH);

          ctx.fillStyle = '#000';
          ctx.font = '34px Arial';
          const vals = [r.subjectName, r.ca1_score, r.ca2_score, r.ca3_score, r.ca4_score, r.exam_score, r.marks_obtained, r.grade];
          vals.forEach((v, idx) => {
            ctx.textAlign = idx === 0 ? 'left' : 'center';
            const cx = idx === 0 ? cols[idx] + 20 : (cols[idx] + cols[idx + 1]) / 2;
            ctx.fillText(String(v), cx, y + 58);
          });
          y += rowH;
        });

        y += 50;

        // Totals
        const totalMarks = studentResults.reduce((s, r) => s + r.marks_obtained, 0);
        const maxMarks = studentResults.reduce((s, r) => s + r.total_marks, 0);
        const avg = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(1) : '0.0';

        ctx.textAlign = 'left';
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText(`Total Marks Obtained: ${totalMarks}  |  Average Score: ${avg}%  |  Position: ${positionLabel}`, marginLeft, y + 30);
        y += 80;

        // Footer
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(marginLeft, y); ctx.lineTo(width - marginRight, y); ctx.stroke();
        y += 40;
        ctx.textAlign = 'center';
        ctx.font = '32px Arial';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, width / 2, y);
        y += 36;
        ctx.fillText('This is an official academic result document from Laazeere Academy, Jalingo', width / 2, y);

        // Convert to blob and add to zip
        const blob = await new Promise<Blob>(resolve =>
          canvas.toBlob(b => resolve(b!), 'image/png')
        );
        const safeStudentName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
        zip.file(`${safeStudentName}_${termLabel}_Result.png`, blob);

        setBatchProgress(Math.round(((i + 1) / studentIds.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${className}_${termLabel}_${yearLabel}_Results.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${studentIds.length} result sheets successfully!`);
    } catch (err) {
      console.error(err);
      toast.error('Batch download failed. Make sure filters are set correctly.');
    } finally {
      setIsBatchDownloading(false);
      setBatchProgress(0);
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
          {results.length > 0 && selectedClass && selectedTerm && selectedAcademicYear && (
            <Button
              variant="outline"
              onClick={handleBatchPNGDownload}
              disabled={isBatchDownloading}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isBatchDownloading
                ? `Generating... ${batchProgress}%`
                : `Download Class PNGs (${Object.keys(results.reduce((acc, r) => ({ ...acc, [r.studentId]: 1 }), {})).length} students)`}
            </Button>
          )}
          {results.length > 0 && (
            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : `Export ${results.length} Results CSV`}
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