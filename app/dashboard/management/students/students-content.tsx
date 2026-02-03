'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { usersApi, classesApi } from '@/lib/api';
import { Class, Student } from '@/types';
import { toast } from 'sonner';

export function StudentsManagementContent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classesData, setClassesData] = useState<Class[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    email: '',
    studentId: '',
    classId: '',
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const studentsData = await usersApi.getStudents();
        setStudents(studentsData);

        const classes = await classesApi.getAll();
        setClassesData(classes);
      } catch (error) {
        toast.error('Failed to load students data');
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleCreateStudent = async () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.username || !newStudent.password || !newStudent.studentId || !newStudent.classId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setIsCreating(true);
      const created = await usersApi.createStudent({
        username: newStudent.username,
        password: newStudent.password,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        email: newStudent.email || undefined,
        studentId: newStudent.studentId,
        classId: newStudent.classId,
      });

      setStudents(prev => [created, ...prev]);
      setIsCreateOpen(false);
      setNewStudent({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        email: '',
        studentId: '',
        classId: '',
      });
      toast.success('Student created successfully.');
    } catch (error: any) {
      console.error('Failed to create student:', error);

      // Handle specific error cases
      let errorMessage = 'Failed to create student.';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data) {
        const data = error.response.data;

        // Handle username already exists
        if (data.username && Array.isArray(data.username)) {
          errorMessage = `Username "${newStudent.username}" already exists. Please choose a different username.`;
        } else if (data.student_id && Array.isArray(data.student_id)) {
          errorMessage = `Student ID "${newStudent.studentId}" already exists. Please choose a different ID.`;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter students based on search and class
  // Only show students when a specific class is selected (not "all")
  const filteredStudents = selectedClass !== 'all' ? students.filter(student => {
    const matchesSearch = student.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = student.class === selectedClass;

    return matchesSearch && matchesClass;
  }) : [];

  // Get unique classes for filter
  const classes = Array.from(new Set(students.map(s => s.class)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading students...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Students Management</h1>
          <p className="text-muted-foreground">
            Manage all enrolled students in the school
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Create a login account and assign the student to a class.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name *</label>
                    <Input
                      value={newStudent.firstName}
                      onChange={(e) => setNewStudent(s => ({ ...s, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name *</label>
                    <Input
                      value={newStudent.lastName}
                      onChange={(e) => setNewStudent(s => ({ ...s, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username *</label>
                    <Input
                      value={newStudent.username}
                      onChange={(e) => setNewStudent(s => ({ ...s, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password *</label>
                    <Input
                      type="password"
                      value={newStudent.password}
                      onChange={(e) => setNewStudent(s => ({ ...s, password: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent(s => ({ ...s, email: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Student ID *</label>
                    <Input
                      value={newStudent.studentId}
                      onChange={(e) => setNewStudent(s => ({ ...s, studentId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Class *</label>
                    <Select
                      value={newStudent.classId}
                      onValueChange={(value) => setNewStudent(s => ({ ...s, classId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classesData.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} • {cls.academicYear}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateStudent} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Student'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">
              Class sections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Class Size</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.length > 0 ? Math.round(students.length / classes.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Students per class
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">
              New enrollments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(className => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
      {selectedClass === 'all' ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-medium mb-2">Select a Class to View Students</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Please select a specific class from the filters above to view and manage students.
                This helps load data faster and provides better organization.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={student.user.avatar} />
                    <AvatarFallback className="text-lg">
                      {student.user.firstName[0]}{student.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl truncate">
                      {student.user.firstName} {student.user.lastName}
                    </CardTitle>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {student.class}-{student.section}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Student ID</span>
                    <span className="font-medium">{student.studentId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Roll Number</span>
                    <span className="font-medium">{student.rollNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Admission Date</span>
                    <span className="font-medium text-right">
                      {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Mail className="h-3 w-3 mr-2" />
                    Email
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Phone className="h-3 w-3 mr-2" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedClass !== 'all' && filteredStudents.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Students Found</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'No students match your search criteria in this class.'
                  : `No students are currently enrolled in ${selectedClass}.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}