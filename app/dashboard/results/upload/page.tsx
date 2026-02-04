'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, Save, X, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { fetchClasses, fetchSubjects, fetchAcademicYears, usersApi, resultsApi } from '@/lib/api';

interface StudentResult {
  id: string;
  studentId: string;
  studentName: string;
  ca1_score: number;
  ca2_score: number;
  ca3_score: number;
  ca4_score: number;
  exam_score: number;
  remarks: string;
  existingResultId?: string;
}

export default function UploadResultsPage() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [allClasses, setAllClasses] = useState<any[]>([]); // Store all classes
  const [classes, setClasses] = useState<any[]>([]); // Filtered classes for display
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Calculate statistics for upload page
  const existingResultsCount = students.filter(s => s.existingResultId).length;
  const isEditingExisting = existingResultsCount > 0;

  const terms = [
    { id: 'first', name: 'First Term' },
    { id: 'second', name: 'Second Term' },
    { id: 'third', name: 'Third Term' },
    { id: 'final', name: 'Final Exam' },
  ];

  // Load classes, subjects, and academic years on component mount
  useEffect(() => {
    // Only load data if user is authenticated
    if (!user) {
      setIsInitialLoading(false);
      return;
    }

    const loadInitialData = async () => {
      setIsInitialLoading(true);
      try {
        console.log('Loading initial data for user:', user);
        console.log('Auth token exists:', !!localStorage.getItem('edumanage_token'));

        const [classesData, subjectsData, yearsData, staffData] = await Promise.all([
          fetchClasses(),
          fetchSubjects(),
          fetchAcademicYears(),
          usersApi.getStaff(),
        ]);

        // Find the current user's staff profile
        const currentStaff = staffData.find((s: any) => s.user.id === user?.id);

        // Format classes data (include academic year for filtering)
        const formattedClasses = (classesData.results || classesData).map((cls: any) => ({
          id: cls.id.toString(),
          name: cls.name,
          academicYearId: cls.academic_year?.toString(),
        }));

        // Show all classes for now - filtering happens when selecting students
        // This allows staff to see all classes but only their assigned students when selecting
        let filteredClassesList = formattedClasses;

        // Format subjects data
        const formattedSubjects = (subjectsData.results || subjectsData).map((subj: any) => ({
          id: subj.id.toString(),
          name: subj.name,
        }));

        // Format academic years data
        const formattedYears = (yearsData.results || yearsData).map((year: any) => ({
          id: year.id.toString(),
          name: year.name,
        }));

        setClasses(formattedClasses);
        setSubjects(formattedSubjects);
        setAcademicYears(formattedYears);

        // Store full classes data for filtering later
        setAllClasses(formattedClasses);
        setClasses(formattedClasses); // Initially show all classes
      } catch (error) {
        console.error('Failed to load initial data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // Filter classes by selected academic year
  useEffect(() => {
    if (selectedAcademicYear && allClasses.length > 0) {
      // Filter classes that belong to the selected academic year
      const filteredClasses = allClasses.filter(cls => {
        return cls.academicYearId === selectedAcademicYear;
      });

      console.log(`Filtered ${filteredClasses.length} classes for academic year ${selectedAcademicYear} from ${allClasses.length} total classes`);
      setClasses(filteredClasses);

      // Reset class selection if the currently selected class is not in the filtered list
      if (selectedClass && !filteredClasses.find(cls => cls.id === selectedClass)) {
        console.log('Resetting class selection because selected class is not available for this academic year');
        setSelectedClass('');
      }
    } else {
      // If no academic year selected, show all classes
      setClasses(allClasses);
    }
  }, [selectedAcademicYear, allClasses, selectedClass]);

  useEffect(() => {
    const fetchStudentsForClass = async () => {
      if (!user) return; // Don't fetch if not authenticated

      if (selectedClass && selectedSubject && selectedAcademicYear && selectedTerm) {
        setIsLoading(true);
        try {
          console.log('Fetching students and results for authenticated user:', user);
          // Fetch students for the selected class from API
          const allStudents = await usersApi.getStudents();
          const allResults = await resultsApi.getList();

          // Find the selected class name from the classes list
          const selectedClassObj = classes.find(cls => cls.id === selectedClass);
          const selectedClassName = selectedClassObj ? selectedClassObj.name : selectedClass;

          console.log(`Selected class ID: ${selectedClass}, Name: ${selectedClassName}`);
          console.log(`All students:`, allStudents.map(s => ({name: `${s.user.firstName} ${s.user.lastName}`, class: s.class})));

          // Filter students whose class matches the selected class
          const classStudents = allStudents.filter(student => {
            if (!student.class) return false;
            const studentClass = student.class.toLowerCase().trim();
            const targetClass = selectedClassName.toLowerCase().trim();

            console.log(`Checking student ${student.user.firstName} ${student.user.lastName}: class="${studentClass}" vs target="${targetClass}"`);

            // Exact match or partial match
            const matches = studentClass === targetClass ||
                   studentClass.includes(targetClass) ||
                   targetClass.includes(studentClass);

            if (matches) {
              console.log(`✓ Matched student: ${student.user.firstName} ${student.user.lastName}`);
            }

            return matches;
          });

          // Create students with results, pre-populating with existing data if available
          const studentsWithResults = classStudents.map(student => {
            // Find existing result for this student, subject, academic year, and term
            // Debug logging for matching
            console.log(`Looking for result for student ${student.id} (${student.user.firstName} ${student.user.lastName})`);
            console.log(`Selected filters: subject=${selectedSubject}, academicYear=${selectedAcademicYear}, term=${selectedTerm}`);

            const existingResult = allResults.find(result => {
              const studentMatch = result.studentId === student.id;
              const subjectMatch = result.subjectId === selectedSubject;
              // Compare academic year ID directly
              const academicYearMatch = result.academicYearId === selectedAcademicYear;
              // Term should match directly (both are stored as 'first', 'second', etc.)
              const termMatch = result.term === selectedTerm;

              console.log(`Checking result ${result.id}: student=${studentMatch}, subject=${subjectMatch}, year=${academicYearMatch} (${result.academicYearId} vs ${selectedAcademicYear}), term=${termMatch} (${result.term} vs ${selectedTerm})`);

              return studentMatch && subjectMatch && academicYearMatch && termMatch;
            });

            if (existingResult) {
              console.log(`Found existing result for ${student.user.firstName} ${student.user.lastName}:`, existingResult);
            }

            return {
              id: student.id,
              studentId: student.studentId,
              studentName: `${student.user.firstName} ${student.user.lastName}`,
              ca1_score: existingResult?.ca1_score || 0,
              ca2_score: existingResult?.ca2_score || 0,
              ca3_score: existingResult?.ca3_score || 0,
              ca4_score: existingResult?.ca4_score || 0,
              exam_score: existingResult?.exam_score || 0,
              remarks: existingResult?.remarks || '',
              existingResultId: existingResult?.id, // Track if this is an existing result
            };
          });

          console.log(`Found ${studentsWithResults.filter(s => s.existingResultId).length} students with existing results`);
          setStudents(studentsWithResults);
        } catch (error) {
          console.error('Failed to fetch students:', error);
          toast.error('Failed to load students for this class');
        } finally {
          setIsLoading(false);
        }
      } else {
        setStudents([]);
      }
    };

    fetchStudentsForClass();
  }, [selectedClass, selectedSubject, selectedAcademicYear, selectedTerm, classes]);

  const updateStudentResult = (studentId: string, field: string, value: string | number) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId
          ? { ...student, [field]: value }
          : student
      )
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to save results');
      return;
    }

    if (!selectedClass || !selectedSubject || !selectedAcademicYear || !selectedTerm) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (students.length === 0) {
      toast.error('No students to save results for');
      return;
    }

    setIsLoading(true);
    try {
      const resultsToSave = students.map(student => ({
        student: student.id,
        subject: selectedSubject,
        academic_year: selectedAcademicYear,
        term: selectedTerm,
        ca1_score: student.ca1_score,
        ca2_score: student.ca2_score,
        ca3_score: student.ca3_score,
        ca4_score: student.ca4_score,
        exam_score: student.exam_score,
        remarks: student.remarks || '',
      }));

      const promises = resultsToSave.map(async (resultData, index) => {
        const student = students[index];
        if (student.existingResultId) {
          // Update existing result
          console.log(`Updating result for ${student.studentName}`);
          return resultsApi.update(student.existingResultId, resultData);
        } else {
          // Create new result
          console.log(`Creating result for ${student.studentName}`);
          return resultsApi.create(resultData);
        }
      });

      await Promise.all(promises);

      const action = isEditingExisting ? 'updated' : 'uploaded';
      toast.success(`Results ${action} successfully!`);

      // Reset form
      setSelectedClass('');
      setSelectedSubject('');
      setSelectedAcademicYear('');
      setSelectedTerm('');
      setStudents([]);
    } catch (error) {
      console.error('Error saving results:', error);
      const action = isEditingExisting ? 'update' : 'upload';
      toast.error(`Failed to ${action} results: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = (student: StudentResult) => {
    const caTotal = student.ca1_score + student.ca2_score + student.ca3_score + student.ca4_score;
    return caTotal + student.exam_score;
  };

  const calculateGrade = (total: number) => {
    const percentage = (total / 100) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 30) return 'D';
    return 'F';
  };

  // Export results for a specific term that this staff member can access
  const exportResultsByTerm = async (term: 'first' | 'second' | 'third') => {
    try {
      const blob = await resultsApi.exportResults({ term });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${term}-term-results-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${term.charAt(0).toUpperCase() + term.slice(1)} term results exported successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export results.');
    }
  };

  if (isInitialLoading) {
    return (
      <ProtectedRoute allowedRoles={['staff']}>
        <AppLayout>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Upload Results</h1>
                <p className="text-muted-foreground">Loading form data...</p>
              </div>
            </div>
            <div className="grid gap-6">
              <div className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['staff']}>
      <AppLayout>
        <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Results</h1>
          <p className="text-muted-foreground">Enter student results for the selected class and subject</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportResultsByTerm('first')}>
            <Download className="mr-2 h-4 w-4" />
            Export 1st Term
          </Button>
          <Button variant="outline" onClick={() => exportResultsByTerm('second')}>
            <Download className="mr-2 h-4 w-4" />
            Export 2nd Term
          </Button>
          <Button variant="outline" onClick={() => exportResultsByTerm('third')}>
            <Download className="mr-2 h-4 w-4" />
            Export 3rd Term
          </Button>
        </div>
      </div>

      {/* Selection Form */}
      <Card>
        <CardHeader>
          <CardTitle>Select Assessment Details</CardTitle>
          <CardDescription>
            Choose the class, subject, academic year, and term for which you want to upload results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year *</Label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term *</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(term => (
                    <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Input */}
      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditingExisting ? 'Edit Student Results' : 'Enter Student Results'}
            </CardTitle>
            <CardDescription>
              {isEditingExisting
                ? `Editing existing results for ${existingResultsCount} student${existingResultsCount !== 1 ? 's' : ''}. Fill in the CA test scores (max 10 each) and final exam score (max 60) for each student.`
                : 'Fill in the CA test scores (max 10 each) and final exam score (max 60) for each student'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground border-b pb-2">
                <div className="col-span-3">Student</div>
                <div className="col-span-1 text-center">CA1</div>
                <div className="col-span-1 text-center">CA2</div>
                <div className="col-span-1 text-center">CA3</div>
                <div className="col-span-1 text-center">CA4</div>
                <div className="col-span-2 text-center">Exam (60)</div>
                <div className="col-span-2 text-center">Total</div>
                <div className="col-span-1 text-center">Grade</div>
              </div>

              {/* Student Rows */}
              {students.map((student, index) => {
                const total = calculateTotal(student);
                const grade = calculateGrade(total);

                return (
                  <div key={student.id} className="grid grid-cols-12 gap-4 items-center py-4 border-b last:border-b-0">
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{student.studentName}</div>
                        {student.existingResultId && (
                          <Badge variant="secondary" className="text-xs">
                            Existing
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{student.studentId}</div>
                    </div>

                    <div className="col-span-1">
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={student.ca1_score}
                        onChange={(e) => updateStudentResult(student.id, 'ca1_score', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>

                    <div className="col-span-1">
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={student.ca2_score}
                        onChange={(e) => updateStudentResult(student.id, 'ca2_score', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>

                    <div className="col-span-1">
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={student.ca3_score}
                        onChange={(e) => updateStudentResult(student.id, 'ca3_score', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>

                    <div className="col-span-1">
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={student.ca4_score}
                        onChange={(e) => updateStudentResult(student.id, 'ca4_score', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>

                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        max="60"
                        value={student.exam_score}
                        onChange={(e) => updateStudentResult(student.id, 'exam_score', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>

                    <div className="col-span-2 text-center">
                      <div className="font-medium">{total}/100</div>
                      <div className="text-sm text-muted-foreground">
                        CA: {(student.ca1_score + student.ca2_score + student.ca3_score + student.ca4_score)}/40
                      </div>
                    </div>

                    <div className="col-span-1 text-center">
                      <Badge variant={
                        grade.startsWith('A') ? 'default' :
                        grade.startsWith('B') ? 'secondary' : 'outline'
                      }>
                        {grade}
                      </Badge>
                    </div>
                  </div>
                );
              })}

              {/* Remarks Section */}
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Additional Remarks (Optional)</h3>
                {students.map((student) => (
                  <div key={student.id} className="space-y-2">
                    <Label htmlFor={`remarks-${student.id}`}>
                      Remarks for {student.studentName}
                    </Label>
                    <Textarea
                      id={`remarks-${student.id}`}
                      placeholder="Enter any additional remarks for this student..."
                      value={student.remarks}
                      onChange={(e) => updateStudentResult(student.id, 'remarks', e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} disabled={isLoading} size="lg">
                  {isLoading ? (
                    <>{isEditingExisting ? 'Updating...' : 'Uploading...'}</>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {isEditingExisting ? 'Update Results' : 'Upload Results'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}