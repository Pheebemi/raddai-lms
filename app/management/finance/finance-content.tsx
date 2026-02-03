'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  Filter,
  PieChart,
  BarChart3,
  Receipt
} from 'lucide-react';
import { dashboardApi, feesApi, feeStructureApi, fetchAcademicYears, handleApiError } from '@/lib/api';
import { DashboardStats, FeeTransaction, FeeStructure } from '@/types';
import { toast } from 'sonner';

export function FinanceManagementContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this_month');
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false);
  const [isSavingStructure, setIsSavingStructure] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [structureForm, setStructureForm] = useState({
    academicYearId: '',
    grade: '',
    feeType: 'tuition' as FeeStructure['feeType'],
    amount: '',
    description: '',
  });

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard stats, fee transactions, fee structures, and academic years
        const [dashboardStats, feeTransactions, feeStructuresData, academicYearsData] = await Promise.all([
          dashboardApi.getStats(),
          feesApi.getPayments(),
          feeStructureApi.getAll(),
          fetchAcademicYears(),
        ]);

        console.log('Dashboard stats:', dashboardStats);
        console.log('Total revenue:', dashboardStats.totalRevenue);
        console.log('Pending fees:', dashboardStats.pendingFees);

        setStats(dashboardStats);
        setTransactions(feeTransactions);
        setFeeStructures(feeStructuresData);
        setAcademicYears(academicYearsData);
      } catch (error: any) {
        const message = handleApiError(error);
        toast.error(message || 'Failed to load financial data');
        console.error('Finance data error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  const openCreateStructureDialog = () => {
    setEditingStructure(null);
    setStructureForm({
      academicYearId: '',
      grade: '',
      feeType: 'tuition',
      amount: '',
      description: '',
    });
    setIsStructureDialogOpen(true);
  };

  const openEditStructureDialog = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setStructureForm({
      academicYearId: structure.academicYearId || '',
      grade: String(structure.grade || ''),
      feeType: structure.feeType,
      amount: String(structure.amount),
      description: structure.description || '',
    });
    setIsStructureDialogOpen(true);
  };

  const handleSaveStructure = async () => {
    if (!structureForm.academicYearId || !structureForm.grade || !structureForm.amount) {
      toast.error('Please fill in academic year, grade, and amount.');
      return;
    }

    try {
      setIsSavingStructure(true);
      const payload = {
        academic_year: structureForm.academicYearId,
        grade: parseInt(structureForm.grade, 10),
        fee_type: structureForm.feeType,
        amount: parseFloat(structureForm.amount),
        description: structureForm.description,
      };

      let saved: FeeStructure;
      if (editingStructure) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/fee-structures/${editingStructure.id}/`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const data = await response.json();
        saved = {
          id: data.id.toString(),
          academicYear: data.academic_year_name,
          academicYearId: data.academic_year.toString(),
          grade: data.grade,
          feeType: data.fee_type,
          amount: parseFloat(data.amount),
          description: data.description,
        };
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/fee-structures/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const data = await response.json();
        saved = {
          id: data.id.toString(),
          academicYear: data.academic_year_name,
          academicYearId: data.academic_year.toString(),
          grade: data.grade,
          feeType: data.fee_type,
          amount: parseFloat(data.amount),
          description: data.description,
        };
      }

      setFeeStructures((prev) =>
        editingStructure ? prev.map((fs) => (fs.id === saved.id ? saved : fs)) : [saved, ...prev]
      );

      toast.success(editingStructure ? 'Fee structure updated.' : 'Fee structure created.');
      setIsStructureDialogOpen(false);
      setEditingStructure(null);
    } catch (error) {
      console.error('Failed to save fee structure:', error);
      toast.error('Failed to save fee structure.');
    } finally {
      setIsSavingStructure(false);
    }
  };

  const handleDeleteStructure = async (structure: FeeStructure) => {
    if (!window.confirm(`Delete fee structure for Grade ${structure.grade} (${structure.academicYear})?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/fee-structures/${structure.id}/`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete fee structure' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      setFeeStructures((prev) => prev.filter((fs) => fs.id !== structure.id));
      toast.success('Fee structure deleted.');
    } catch (error) {
      console.error('Failed to delete fee structure:', error);
      toast.error('Failed to delete fee structure.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading financial data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Failed to load financial data</p>
        </div>
      </div>
    );
  }

  // Calculate financial metrics from transactions data (more reliable)
  const totalRevenueFromTransactions = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + (t.totalAmount || t.amount), 0);

  const pendingFeesFromTransactions = transactions
    .filter(t => t.status === 'pending' || t.status === 'overdue')
    .reduce((sum, t) => sum + (t.totalAmount || t.amount), 0);

  // Use transaction-based calculations as primary, fallback to dashboard stats
  const totalRevenue = totalRevenueFromTransactions || Number(stats?.totalRevenue) || 0;
  const pendingFees = pendingFeesFromTransactions || Number(stats?.pendingFees) || 0;
  const totalExpected = totalRevenue + pendingFees;
  const collectionRate = totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 0;

  console.log('Financial calculations:', {
    totalRevenueFromTransactions,
    pendingFeesFromTransactions,
    totalRevenue,
    pendingFees,
    statsRevenue: stats?.totalRevenue
  });

  // Group transactions by status
  const paidTransactions = transactions.filter(t => t.status === 'paid');
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const overdueTransactions = transactions.filter(t => t.status === 'overdue');

  // Calculate payment method breakdown
  const paymentMethods = transactions.reduce((acc, transaction) => {
    const method = transaction.paymentMethod || 'Cash';
    acc[method] = (acc[method] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
          <p className="text-muted-foreground">
            Monitor revenue, track payments, and manage school finances
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <Receipt className="mr-2 h-4 w-4" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_term">This Term</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(typeof totalRevenue === 'number' ? totalRevenue : 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₦{pendingFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1 text-yellow-600" />
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionRate}%</div>
            <Progress value={collectionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₦{(pendingFees * 0.3).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              30% of pending fees
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="fee_structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="fee_payments">Fee Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Fee collection status overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Collected</span>
                    </div>
                    <span className="text-sm font-medium">₦{totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <span className="text-sm font-medium">₦{pendingFees.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">Overdue</span>
                    </div>
                    <span className="text-sm font-medium">₦{(pendingFees * 0.3).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{collectionRate}%</span>
                  </div>
                  <Progress value={collectionRate} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution of payment methods used</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(paymentMethods).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{method}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">₦{amount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {((amount / totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}

                {Object.keys(paymentMethods).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No payment data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest fee payments and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {transaction.studentName ? transaction.studentName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {transaction.studentName || 'Unknown Student'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.feeStructureName || 'School Fee'} • {transaction.term || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">₦{transaction.totalAmount?.toLocaleString() || transaction.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}

                {transactions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No transactions found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Complete transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.status === 'paid' ? 'bg-green-500' :
                        transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium">{transaction.studentName || 'Unknown Student'}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.feeStructureName} • {transaction.term} • {transaction.paymentMethod}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{transaction.totalAmount?.toLocaleString() || transaction.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.paymentDate ? new Date(transaction.paymentDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Structures Tab */}
        <TabsContent value="fee_structures" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fee Structures</CardTitle>
                <CardDescription>Configure tuition and other fees by grade and academic year.</CardDescription>
              </div>
              <Button onClick={openCreateStructureDialog}>
                <DollarSign className="mr-2 h-4 w-4" />
                Add Fee Structure
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructures.map((fs) => (
                      <TableRow key={fs.id}>
                        <TableCell>{fs.academicYear}</TableCell>
                        <TableCell>Grade {fs.grade}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{fs.feeType}</Badge>
                        </TableCell>
                        <TableCell>₦{fs.amount.toLocaleString()}</TableCell>
                        <TableCell>{fs.description || '-'}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditStructureDialog(fs)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteStructure(fs)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {feeStructures.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                          No fee structures defined yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Create/Edit Structure Dialog */}
          <Dialog open={isStructureDialogOpen} onOpenChange={setIsStructureDialogOpen}>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>
                  {editingStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
                </DialogTitle>
                <DialogDescription>
                  {editingStructure
                    ? 'Update the selected fee structure.'
                    : 'Create a new fee structure for a grade and academic year.'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Academic Year *</Label>
                  <Select
                    value={structureForm.academicYearId}
                    onValueChange={(value) =>
                      setStructureForm((s) => ({ ...s, academicYearId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grade *</Label>
                    <Input
                      type="number"
                      value={structureForm.grade}
                      onChange={(e) =>
                        setStructureForm((s) => ({ ...s, grade: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fee Type *</Label>
                    <Select
                      value={structureForm.feeType}
                      onValueChange={(value) =>
                        setStructureForm((s) => ({
                          ...s,
                          feeType: value as FeeStructure['feeType'],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tuition">Tuition</SelectItem>
                        <SelectItem value="examination">Examination</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="hostel">Hostel</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Amount (₦) *</Label>
                  <Input
                    type="number"
                    value={structureForm.amount}
                    onChange={(e) =>
                      setStructureForm((s) => ({ ...s, amount: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={structureForm.description}
                    onChange={(e) =>
                      setStructureForm((s) => ({ ...s, description: e.target.value }))
                    }
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsStructureDialogOpen(false);
                    setEditingStructure(null);
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveStructure} disabled={isSavingStructure}>
                  {isSavingStructure
                    ? 'Saving...'
                    : editingStructure
                    ? 'Save Changes'
                    : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Fee Payments Tab (management view of all payments) */}
        <TabsContent value="fee_payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Payments</CardTitle>
              <CardDescription>
                All recorded fee payments from students (online and manual).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.studentName || t.studentId}</TableCell>
                        <TableCell>{t.feeStructureName || 'School Fee'}</TableCell>
                        <TableCell className="capitalize">{t.term || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              t.status === 'paid'
                                ? 'default'
                                : t.status === 'overdue'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ₦{(t.totalAmount ?? t.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {t.paymentDate
                            ? new Date(t.paymentDate).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {/* For now management can only view; deletions are risky because of reconciliation */}
                          <span className="text-xs text-muted-foreground">
                            View-only
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                          No fee payments recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Monthly Report</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comprehensive monthly financial summary
                  </p>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Revenue Report</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Detailed revenue analysis and projections
                  </p>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Outstanding Report</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    List of all outstanding fees and payments
                  </p>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}