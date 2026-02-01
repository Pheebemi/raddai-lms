'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  BookOpen,
  UserCheck,
  Settings
} from 'lucide-react';
import { usersApi, classesApi } from '@/lib/api';
import { Staff, Class } from '@/types';
import { toast } from 'sonner';

export function StaffManagementContent() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const [selectedStaffForAssignment, setSelectedStaffForAssignment] = useState<Staff | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [staffData, classesData] = await Promise.all([
          usersApi.getStaff(),
          classesApi.getAll()
        ]);
        setStaff(staffData);
        setClasses(classesData);
      } catch (error) {
        toast.error('Failed to load staff and classes data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter staff based on search and designation
  const filteredStaff = staff.filter(staffMember => {
    const matchesSearch = staffMember.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staffMember.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staffMember.staffId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDesignation = selectedDesignation === 'all' || staffMember.designation === selectedDesignation;

    return matchesSearch && matchesDesignation;
  });

  // Get unique designations for filter
  const designations = Array.from(new Set(staff.map(s => s.designation)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading staff...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage all teaching staff members in the school
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Button>
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
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">
              Teaching staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Designations</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{designations.length}</div>
            <p className="text-xs text-muted-foreground">
              Staff roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Classes for assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Coverage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.length > 0 ? Math.round((classes.filter(c => c.classTeacher).length / classes.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Classes with assigned teachers
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
                  placeholder="Search by name or staff ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Designation</label>
              <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Designations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  {designations.map(designation => (
                    <SelectItem key={designation} value={designation}>
                      {designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.map((staffMember) => (
          <Card key={staffMember.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={staffMember.user.avatar} />
                  <AvatarFallback>
                    {staffMember.user.firstName[0]}{staffMember.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {staffMember.user.firstName} {staffMember.user.lastName}
                  </CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {staffMember.designation}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Staff ID</p>
                  <p className="font-medium">{staffMember.staffId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Class Assignment</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{staffMember.assignedClasses?.length || 0} classes</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-6 px-2">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Assign Classes to {staffMember.user.firstName}</DialogTitle>
                          <DialogDescription>
                            Select classes to assign to this teacher
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                            {classes.map((cls) => (
                              <div key={cls.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`class-${cls.id}`}
                                  checked={staffMember.assignedClasses?.includes(cls.name) || false}
                                  className="rounded"
                                  disabled
                                />
                                <label
                                  htmlFor={`class-${cls.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {cls.name}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button className="flex-1">
                              Update Assignment
                            </Button>
                            <Button variant="outline" className="flex-1">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground">Subjects</p>
                <p className="font-medium">
                  {staffMember.assignedSubjects?.length ?
                    staffMember.assignedSubjects.slice(0, 3).join(', ') +
                    (staffMember.assignedSubjects.length > 3 ? '...' : '')
                    : 'None assigned'}
                </p>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground">Joining Date</p>
                <p className="font-medium">
                  {staffMember.joiningDate ? new Date(staffMember.joiningDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Staff Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedDesignation !== 'all'
                  ? 'Try adjusting your filters to see more staff members.'
                  : 'No staff members are currently registered.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}