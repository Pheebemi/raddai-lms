'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  BookOpen,
  UserCheck,
  Settings,
  MoreHorizontal,
  Edit,
  Trash2
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

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    email: '',
    staffId: '',
    designation: 'teacher',
    joiningDate: new Date().toISOString().split('T')[0], // Today's date
    classId: '' as string,
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editStaffForm, setEditStaffForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    staffId: '',
    designation: 'teacher',
    joiningDate: new Date().toISOString().split('T')[0],
    classId: '' as string,
  });

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

  const handleCreateStaff = async () => {
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.username || !newStaff.password || !newStaff.staffId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setIsCreating(true);
      const created = await usersApi.createStaff({
        username: newStaff.username,
        password: newStaff.password,
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        email: newStaff.email || undefined,
        staffId: newStaff.staffId,
        designation: newStaff.designation,
        joiningDate: newStaff.joiningDate,
        classId: newStaff.classId || undefined,
      });

      setStaff(prev => [created, ...prev]);
      setIsCreateOpen(false);
      setNewStaff({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        email: '',
        staffId: '',
        designation: 'teacher',
        joiningDate: new Date().toISOString().split('T')[0],
        classId: '',
      });
      toast.success('Staff member created successfully.');
    } catch (error: any) {
      console.error('Failed to create staff:', error);

      // Handle specific error cases
      let errorMessage = 'Failed to create staff member.';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data) {
        const data = error.response.data;

        // Handle username already exists
        if (data.username && Array.isArray(data.username)) {
          errorMessage = `Username "${newStaff.username}" already exists. Please choose a different username.`;
        } else if (data.staff_id && Array.isArray(data.staff_id)) {
          errorMessage = `Staff ID "${newStaff.staffId}" already exists. Please choose a different ID.`;
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

  const openEditDialog = (staffMember: Staff) => {
    // Map assigned class name back to its ID (only one class can have this staff as class teacher)
    const assignedClassName = staffMember.assignedClasses?.[0];
    const assignedClass = classes.find((cls) => cls.name === assignedClassName);

    setEditingStaff(staffMember);
    setEditStaffForm({
      firstName: staffMember.user.firstName,
      lastName: staffMember.user.lastName,
      email: staffMember.user.email,
      staffId: staffMember.staffId,
      designation: staffMember.designation || 'teacher',
      joiningDate: staffMember.joiningDate
        ? staffMember.joiningDate.split('T')[0]
        : new Date().toISOString().split('T')[0],
      classId: assignedClass ? assignedClass.id : '',
    });
    setIsEditOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;

    if (!editStaffForm.firstName || !editStaffForm.lastName || !editStaffForm.staffId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setIsUpdating(true);
      const updated = await usersApi.updateStaff(editingStaff.id, {
        userId: editingStaff.user.id,
        firstName: editStaffForm.firstName,
        lastName: editStaffForm.lastName,
        email: editStaffForm.email || undefined,
        staffId: editStaffForm.staffId,
        designation: editStaffForm.designation,
        joiningDate: editStaffForm.joiningDate,
        classId: editStaffForm.classId || null,
      });

      setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setIsEditOpen(false);
      setEditingStaff(null);
      toast.success('Staff member updated successfully.');
    } catch (error: any) {
      console.error('Failed to update staff:', error);
      const errorMessage = error?.message || 'Failed to update staff member.';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

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
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Create a login account and set up staff member details.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name *</label>
                    <Input
                      value={newStaff.firstName}
                      onChange={(e) => setNewStaff(s => ({ ...s, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name *</label>
                    <Input
                      value={newStaff.lastName}
                      onChange={(e) => setNewStaff(s => ({ ...s, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username *</label>
                    <Input
                      value={newStaff.username}
                      onChange={(e) => setNewStaff(s => ({ ...s, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password *</label>
                    <Input
                      type="password"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff(s => ({ ...s, password: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff(s => ({ ...s, email: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Staff ID *</label>
                    <Input
                      value={newStaff.staffId}
                      onChange={(e) => setNewStaff(s => ({ ...s, staffId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Designation *</label>
                    <Select
                      value={newStaff.designation}
                      onValueChange={(value) => setNewStaff(s => ({ ...s, designation: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="principal">Principal</SelectItem>
                        <SelectItem value="vice_principal">Vice Principal</SelectItem>
                        <SelectItem value="administrator">Administrator</SelectItem>
                        <SelectItem value="librarian">Librarian</SelectItem>
                        <SelectItem value="counselor">Counselor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Joining Date</label>
                    <Input
                      type="date"
                      value={newStaff.joiningDate}
                      onChange={(e) => setNewStaff(s => ({ ...s, joiningDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assign as Class Teacher (optional)</label>
                    <Select
                      value={newStaff.classId}
                      onValueChange={(value) => setNewStaff((s) => ({ ...s, classId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} • {cls.academicYear}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This will set the staff as class teacher for the selected class.
                    </p>
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
                <Button onClick={handleCreateStaff} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Staff Member'}
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

      {/* Edit Staff Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setEditingStaff(null);
        }
      }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member details and class assignments.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={editStaffForm.firstName}
                  onChange={(e) => setEditStaffForm((s) => ({ ...s, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  value={editStaffForm.lastName}
                  onChange={(e) => setEditStaffForm((s) => ({ ...s, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={editStaffForm.email}
                onChange={(e) => setEditStaffForm((s) => ({ ...s, email: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Staff ID *</label>
                <Input
                  value={editStaffForm.staffId}
                  onChange={(e) => setEditStaffForm((s) => ({ ...s, staffId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Designation *</label>
                <Select
                  value={editStaffForm.designation}
                  onValueChange={(value) => setEditStaffForm((s) => ({ ...s, designation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="vice_principal">Vice Principal</SelectItem>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                    <SelectItem value="counselor">Counselor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Joining Date</label>
                <Input
                  type="date"
                  value={editStaffForm.joiningDate}
                  onChange={(e) => setEditStaffForm((s) => ({ ...s, joiningDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign as Class Teacher (optional)</label>
                <Select
                  value={editStaffForm.classId}
                  onValueChange={(value) => setEditStaffForm((s) => ({ ...s, classId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} • {cls.academicYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Update which class this staff member is set as class teacher for.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setEditingStaff(null);
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateStaff} disabled={isUpdating || !editingStaff}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Assigned Classes</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={staffMember.user.avatar} />
                        <AvatarFallback>
                          {staffMember.user.firstName[0]}{staffMember.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {staffMember.user.firstName} {staffMember.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {staffMember.user.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{staffMember.staffId}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{staffMember.designation}</Badge>
                  </TableCell>
                  <TableCell>
                    {staffMember.assignedClasses && staffMember.assignedClasses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {staffMember.assignedClasses.slice(0, 2).map((className, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {className}
                          </Badge>
                        ))}
                        {staffMember.assignedClasses.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{staffMember.assignedClasses.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">None assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {staffMember.assignedSubjects?.length ?
                        staffMember.assignedSubjects.slice(0, 2).join(', ') +
                        (staffMember.assignedSubjects.length > 2 ? '...' : '')
                        : 'None assigned'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {staffMember.joiningDate
                      ? new Date(staffMember.joiningDate).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            openEditDialog(staffMember);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Staff
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          Manage Classes
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Staff
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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