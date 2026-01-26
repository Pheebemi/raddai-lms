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
import { Upload, Save, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { fetchClasses, fetchSubjects, fetchAcademicYears, usersApi } from '@/lib/api';

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
  const [classes, setClasses] = useState<any[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const terms = [
    { id: 'first', name: 'First Term' },
    { id: 'second', name: 'Second Term' },
    { id: 'third', name: 'Third Term' },
    { id: 'final', name: 'Final Exam' },
  ];

  // Load classes, subjects, and academic years on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      try {
        const [classesData, subjectsData, yearsData, staffData] = await Promise.all([
          fetchClasses(),
          fetchSubjects(),
          fetchAcademicYears(),
          usersApi.getStaff(),
        ]);

        // Find the current user's staff profile
        const currentStaff = staffData.find((s: any) => s.user.id === user?.id);

        // Format classes data
        const formattedClasses = (classesData.results || classesData).map((cls: any) => ({
          id: cls.id.toString(),
          name: cls.name,
        }));

        // Filter classes based on staff's assigned classes
        let filteredClassesList = formattedClasses;
        if (currentStaff && currentStaff.assigned_classes && currentStaff.assigned_classes.length > 0) {
          // Filter classes to only show those assigned to the current staff
          filteredClassesList = formattedClasses.filter(cls =>
            currentStaff.assigned_classes.some((assignedClass: any) => {
              // Match by name (flexible matching)
              const className = cls.name.toLowerCase().trim();
              const assignedName = assignedClass.name ? assignedClass.name.toLowerCase().trim() : '';
              return className === assignedName ||
                     className.includes(assignedName) ||
                     assignedName.includes(className);
            })
          );
        }

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
        setFilteredClasses(filteredClassesList);
        setSubjects(formattedSubjects);
        setAcademicYears(formattedYears);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  useEffect(() => {
    const fetchStudentsForClass = async () => {
      if (selectedClass) {
        setIsLoading(true);
        try {
          // Fetch students for the selected class from API
          const allStudents = await usersApi.getStudents();
          const classStudents = allStudents.filter(student =>
            student.class.toLowerCase().includes(selectedClass.toLowerCase()) ||
            selectedClass.toLowerCase().includes(student.class.toLowerCase())
          );

          const studentsWithResults = classStudents.map(student => ({
            id: student.id,
            studentId: student.studentId,
            studentName: `${student.user.firstName} ${student.user.lastName}`,
            ca1_score: 0,
            ca2_score: 0,
            ca3_score: 0,
            ca4_score: 0,
            exam_score: 0,
            remarks: '',
          }));

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
  }, [selectedClass]);

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
    if (!selectedClass || !selectedSubject || !selectedAcademicYear || !selectedTerm) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // In real app, this would submit to API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay

      toast.success('Results uploaded successfully!');
      // Reset form
      setSelectedClass('');
      setSelectedSubject('');
      setSelectedAcademicYear('');
      setSelectedTerm('');
      setStudents([]);
    } catch (error) {
      toast.error('Failed to upload results');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Results</h1>
          <p className="text-muted-foreground">Enter student results for the selected class and subject</p>
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
                  {filteredClasses.map(cls => (
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
            <CardTitle>Enter Student Results</CardTitle>
            <CardDescription>
              Fill in the CA test scores (max 10 each) and final exam score (max 60) for each student
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
                      <div className="font-medium">{student.studentName}</div>
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
                    <>Uploading...</>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Results
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