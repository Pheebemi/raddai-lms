'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  Download,
  Calendar,
  User,
  FileText,
  Plus,
  Search,
  Filter,
  Receipt,
} from 'lucide-react';
import { staffSalaryApi } from '@/lib/api';
import { StaffSalary, Staff } from '@/types';
import { toast } from 'sonner';
import { fetchAcademicYears, usersApi } from '@/lib/api';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function SalaryManagementContent() {
  const [salaries, setSalaries] = useState<StaffSalary[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<StaffSalary | null>(null);

  // Filters
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    staff: '',
    academic_year: '',
    month: '',
    amount: '',
    voucher_number: '',
    paid_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salariesData, staffData, academicYearsData] = await Promise.all([
        staffSalaryApi.list(),
        usersApi.getStaff(),
        fetchAcademicYears(),
      ]);

      setSalaries(salariesData);
      setStaff(staffData);
      setAcademicYears(academicYearsData);

      // Set default academic year to current if available
      if (academicYearsData.length > 0 && !selectedAcademicYear) {
        const currentYear = academicYearsData.find((year: any) => year.is_active);
        if (currentYear) {
          setSelectedAcademicYear(currentYear.id.toString());
        }
      }
    } catch (error) {
      toast.error('Failed to load salary data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSalaries = salaries.filter((salary) => {
    const matchesYear = !selectedAcademicYear || salary.academicYearId === selectedAcademicYear;
    const matchesMonth = !selectedMonth || salary.month.toString() === selectedMonth;
    const matchesSearch = !searchQuery ||
      salary.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salary.staffCode.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesYear && matchesMonth && matchesSearch;
  });

  const openCreateDialog = () => {
    setEditingSalary(null);
    setFormData({
      staff: '',
      academic_year: selectedAcademicYear,
      month: selectedMonth,
      amount: '',
      voucher_number: '',
      paid_date: new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (salary: StaffSalary) => {
    setEditingSalary(salary);
    setFormData({
      staff: salary.staffId,
      academic_year: salary.academicYearId,
      month: salary.month.toString(),
      amount: salary.amount.toString(),
      voucher_number: salary.voucherNumber || '',
      paid_date: salary.paidDate,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.staff || !formData.academic_year || !formData.month || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        id: editingSalary?.id,
        staff: formData.staff,
        academic_year: formData.academic_year,
        month: parseInt(formData.month),
        amount: parseFloat(formData.amount),
        voucher_number: formData.voucher_number || undefined,
        paid_date: formData.paid_date || undefined,
      };

      const savedSalary = await staffSalaryApi.upsert(payload);

      if (editingSalary) {
        setSalaries(prev => prev.map(s => s.id === savedSalary.id ? savedSalary : s));
        toast.success('Salary updated successfully');
      } else {
        setSalaries(prev => [savedSalary, ...prev]);
        toast.success('Salary created successfully');
      }

      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save salary');
      console.error(error);
    }
  };

  const downloadMonthlyReport = async () => {
    try {
      if (!selectedAcademicYear || !selectedMonth) {
        toast.error('Please select both academic year and month for the report');
        return;
      }

      // Get salaries for the selected month
      const monthlySalaries = salaries.filter(s =>
        s.academicYearId === selectedAcademicYear &&
        s.month.toString() === selectedMonth
      );

      if (monthlySalaries.length === 0) {
        toast.error('No salary records found for the selected month');
        return;
      }

      // Calculate total
      const totalAmount = monthlySalaries.reduce((sum, s) => sum + s.amount, 0);

      // Generate PNG report similar to how results are generated
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate canvas height based on number of salaries
      const baseHeight = 400;
      const rowHeight = 30;
      const tableHeight = monthlySalaries.length * rowHeight + 100;
      canvas.width = 1200;
      canvas.height = baseHeight + tableHeight;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(0, 0, canvas.width, 120);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('RADDAI METROPOLITAN SCHOOL', canvas.width / 2, 50);

      ctx.font = '20px Arial';
      ctx.fillText('MONTHLY SALARY REPORT', canvas.width / 2, 85);

      // Month and Year
      const monthName = MONTHS.find(m => m.value.toString() === selectedMonth)?.label || selectedMonth;
      const academicYearName = academicYears.find(y => y.id.toString() === selectedAcademicYear)?.name || selectedAcademicYear;
      ctx.fillText(`${monthName} ${academicYearName}`, canvas.width / 2, 110);

      // Border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      let yPosition = 160;

      // Report Summary
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('REPORT SUMMARY:', 50, yPosition);
      yPosition += 30;

      ctx.font = '16px Arial';
      ctx.fillText(`Total Staff: ${monthlySalaries.length}`, 70, yPosition);
      yPosition += 25;
      ctx.fillText(`Total Amount: ₦${totalAmount.toLocaleString()}`, 70, yPosition);
      yPosition += 25;
      ctx.fillText(`Report Date: ${new Date().toLocaleDateString()}`, 70, yPosition);
      yPosition += 50;

      // Table Header
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(50, yPosition - 20, canvas.width - 100, 30);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, yPosition - 20, canvas.width - 100, 30);

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText('Staff Name', 70, yPosition + 5);
      ctx.textAlign = 'center';
      ctx.fillText('Staff ID', 350, yPosition + 5);
      ctx.fillText('Designation', 500, yPosition + 5);
      ctx.fillText('Amount (₦)', 850, yPosition + 5);
      ctx.fillText('Payment Date', 1000, yPosition + 5);

      yPosition += 40;

      // Table Rows
      ctx.font = '14px Arial';
      monthlySalaries.forEach((salary, index) => {
        const selectedStaff = staff.find(s => s.id === salary.staffId);

        // Alternate row colors
        ctx.fillStyle = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
        ctx.fillRect(50, yPosition - 20, canvas.width - 100, 30);
        ctx.strokeRect(50, yPosition - 20, canvas.width - 100, 30);

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText(salary.staffName, 70, yPosition + 5);
        ctx.textAlign = 'center';
        ctx.fillText(salary.staffCode, 350, yPosition + 5);
        ctx.fillText(selectedStaff?.designation || 'N/A', 500, yPosition + 5);
        ctx.fillText(salary.amount.toLocaleString(), 850, yPosition + 5);
        ctx.fillText(new Date(salary.paidDate).toLocaleDateString(), 1000, yPosition + 5);

        yPosition += 30;
      });

      // Total Row
      ctx.fillStyle = '#e3f2fd';
      ctx.fillRect(50, yPosition - 20, canvas.width - 100, 35);
      ctx.strokeRect(50, yPosition - 20, canvas.width - 100, 35);

      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText('TOTAL', 70, yPosition + 8);
      ctx.textAlign = 'center';
      ctx.fillText('₦' + totalAmount.toLocaleString(), 850, yPosition + 8);

      yPosition += 60;

      // Footer
      ctx.font = '12px Arial';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, canvas.width / 2, yPosition);
      yPosition += 20;
      ctx.fillText('This is an official monthly salary report from Raddai Metropolitan School Jalingo', canvas.width / 2, yPosition);

      // Download PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Monthly_Salary_Report_${monthName}_${academicYearName}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Monthly salary report downloaded successfully!');
        }
      }, 'image/png');

    } catch (error) {
      toast.error('Failed to generate monthly report');
      console.error(error);
    }
  };

  const downloadVoucher = async (salary: StaffSalary) => {
    try {
      // Generate PNG voucher similar to how results are generated
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 800;
      canvas.height = 1000;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(0, 0, canvas.width, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('RADDAI METROPOLITAN SCHOOL', canvas.width / 2, 40);

      ctx.font = '18px Arial';
      ctx.fillText('SALARY VOUCHER', canvas.width / 2, 70);

      // Border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      let yPosition = 140;

      // Staff Information
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('STAFF INFORMATION:', 50, yPosition);
      yPosition += 40;

      ctx.font = '16px Arial';
      const selectedStaff = staff.find(s => s.id === salary.staffId);

      ctx.fillText(`Name: ${salary.staffName}`, 70, yPosition);
      yPosition += 30;
      ctx.fillText(`Staff ID: ${salary.staffCode}`, 70, yPosition);
      yPosition += 30;
      ctx.fillText(`Designation: ${selectedStaff?.designation || 'N/A'}`, 70, yPosition);
      yPosition += 50;

      // Salary Details
      ctx.font = 'bold 20px Arial';
      ctx.fillText('SALARY DETAILS:', 50, yPosition);
      yPosition += 40;

      ctx.font = '16px Arial';
      ctx.fillText(`Academic Year: ${salary.academicYearName}`, 70, yPosition);
      yPosition += 30;
      ctx.fillText(`Month: ${salary.monthName}`, 70, yPosition);
      yPosition += 30;
      ctx.fillText(`Amount: ₦${salary.amount.toLocaleString()}`, 70, yPosition);
      yPosition += 30;
      ctx.fillText(`Payment Date: ${new Date(salary.paidDate).toLocaleDateString()}`, 70, yPosition);
      yPosition += 30;
      if (salary.voucherNumber) {
        ctx.fillText(`Voucher Number: ${salary.voucherNumber}`, 70, yPosition);
        yPosition += 30;
      }

      // Footer
      yPosition += 50;
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, canvas.width / 2, yPosition);
      yPosition += 30;
      ctx.fillText('This is an official salary voucher from Raddai Metropolitan School Jalingo', canvas.width / 2, yPosition);

      // Download PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Salary_Voucher_${salary.staffCode}_${salary.monthName}_${salary.academicYearName}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Salary voucher downloaded successfully!');
        }
      }, 'image/png');

    } catch (error) {
      toast.error('Failed to generate voucher');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading salary data...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Staff Salary Management</h1>
          <p className="text-muted-foreground">
            Manage and track staff salaries for academic years and months
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadMonthlyReport}>
            <Download className="mr-2 h-4 w-4" />
            Monthly Report
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Salary Record
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by staff name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year: any) => (
                  <SelectItem key={year.id} value={year.id.toString()}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Salary Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
          <CardDescription>
            {filteredSalaries.length} record{filteredSalaries.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {salary.staffName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{salary.staffName}</p>
                          <p className="text-sm text-muted-foreground">{salary.staffCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{salary.academicYearName}</TableCell>
                    <TableCell>{salary.monthName}</TableCell>
                    <TableCell>₦{salary.amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(salary.paidDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {salary.voucherNumber ? (
                        <Badge variant="outline">{salary.voucherNumber}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadVoucher(salary)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Voucher
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(salary)}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSalaries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No salary records found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSalary ? 'Edit Salary Record' : 'Add Salary Record'}
            </DialogTitle>
            <DialogDescription>
              {editingSalary
                ? 'Update the salary details for this record.'
                : 'Create a new salary record for a staff member.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Staff Member *</Label>
                <Select
                  value={formData.staff}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, staff: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.user.firstName} {member.user.lastName} ({member.staffId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Academic Year *</Label>
                  <Select
                    value={formData.academic_year}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, academic_year: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year: any) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Month *</Label>
                  <Select
                    value={formData.month}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, month: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount (₦) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="Enter salary amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Voucher Number</Label>
                <Input
                  value={formData.voucher_number}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, voucher_number: e.target.value }))
                  }
                  placeholder="Optional voucher number"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={formData.paid_date}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, paid_date: e.target.value }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingSalary ? 'Update Record' : 'Create Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}