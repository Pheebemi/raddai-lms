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
import { dashboardApi, feesApi, feeStructureApi, classesApi, fetchAcademicYears, handleApiError } from '@/lib/api';
import { DashboardStats, FeeTransaction, FeeStructure } from '@/types';
import { toast } from 'sonner';


const PAGE_SIZE = 15;

function TransactionsListCard({
  transactions,
  title,
  description,
  defaultLimit,
}: {
  transactions: any[];
  title: string;
  description: string;
  defaultLimit?: number;
}) {
  const [search, setSearch] = useState('');
  const [filterTerm, setFilterTerm] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime()
  );

  const filtered = sorted.filter(t => {
    if (filterTerm !== 'all' && t.term !== filterTerm) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.studentName?.toLowerCase().includes(q) && !t.transactionId?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const limit = defaultLimit || PAGE_SIZE;
  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);
  const reset = () => setPage(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search student..."
            value={search}
            onChange={e => { setSearch(e.target.value); reset(); }}
            className="max-w-xs"
          />
          <Select value={filterTerm} onValueChange={v => { setFilterTerm(v); reset(); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Terms" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              <SelectItem value="first">First Term</SelectItem>
              <SelectItem value="second">Second Term</SelectItem>
              <SelectItem value="third">Third Term</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); reset(); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground self-center">{filtered.length} records</span>
        </div>

        <div className="space-y-2">
          {paginated.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">
                    {t.studentName ? t.studentName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{t.studentName || 'Unknown Student'}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {t.term ? `${t.term} term` : '—'} · {t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : 'No date'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={t.status === 'paid' ? 'default' : t.status === 'overdue' ? 'destructive' : 'secondary'}>
                  {t.status}
                </Badge>
                <p className="text-sm font-medium">₦{(t.totalAmount ?? t.amount).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {paginated.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions match your filters.</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentsTab({ transactions }: { transactions: any[] }) {
  const [search, setSearch] = useState('');
  const [filterTerm, setFilterTerm] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime()
  );

  const filtered = sorted.filter(t => {
    if (filterTerm !== 'all' && t.term !== filterTerm) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.studentName?.toLowerCase().includes(q) &&
        !t.studentId?.toLowerCase().includes(q) &&
        !t.transactionId?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const reset = () => setPage(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Payments</CardTitle>
        <CardDescription>All recorded fee payments — newest first.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search student or transaction ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); reset(); }}
            className="max-w-xs"
          />
          <Select value={filterTerm} onValueChange={v => { setFilterTerm(v); reset(); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              <SelectItem value="first">First Term</SelectItem>
              <SelectItem value="second">Second Term</SelectItem>
              <SelectItem value="third">Third Term</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); reset(); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground self-center">{filtered.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Total Fee</TableHead>
                <TableHead>Payment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(t => (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-medium">{t.studentName || t.studentId}</p>
                    {t.transactionId && <p className="text-xs text-muted-foreground">{t.transactionId}</p>}
                  </TableCell>
                  <TableCell className="capitalize">{t.term || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'paid' ? 'default' : t.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>₦{t.amount.toLocaleString()}</TableCell>
                  <TableCell>₦{(t.totalAmount ?? t.amount).toLocaleString()}</TableCell>
                  <TableCell>{t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No payments match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FinanceManagementContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('active');
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Build grade → label map dynamically from actual classes in DB
  const gradeLabelMap = classes.reduce((acc, cls) => {
    if (!acc[cls.grade]) acc[cls.grade] = cls.name.replace(/ [A-Za-z0-9]+$/, '').trim();
    return acc;
  }, {} as Record<number, string>);

  const gradeLabel = (grade: number) => gradeLabelMap[grade] || `Grade ${grade}`;

  // Unique grades from classes for the dropdown
  const uniqueGrades = Object.entries(gradeLabelMap)
    .map(([grade, label]) => ({ grade: Number(grade), label: label as string }))
    .sort((a, b) => a.grade - b.grade);

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
        const [dashboardStats, feeTransactions, feeStructuresData, academicYearsData, classesData] = await Promise.all([
          dashboardApi.getStats(selectedYear === 'all' ? 'all' : selectedYear === 'active' ? undefined : selectedYear),
          feesApi.getPayments(),
          feeStructureApi.getAll(),
          fetchAcademicYears(),
          classesApi.getAll(),
        ]);

        setStats(dashboardStats);
        setTransactions(feeTransactions);
        setFeeStructures(feeStructuresData);
        setAcademicYears(academicYearsData);
        if (selectedYear === 'active') {
          const active = academicYearsData.find((y: any) => y.is_active);
          if (active) setSelectedYear(active.id.toString());
        }
        setClasses(classesData);
      } catch (error: any) {
        const message = handleApiError(error);
        toast.error(message || 'Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [selectedYear]);

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

      const data = editingStructure
        ? await feeStructureApi.update(editingStructure.id, payload)
        : await feeStructureApi.create(payload);

      const saved: FeeStructure = {
        id: data.id.toString(),
        academicYear: data.academic_year_name,
        academicYearId: data.academic_year.toString(),
        grade: data.grade,
        feeType: data.fee_type,
        amount: parseFloat(data.amount),
        description: data.description,
      };

      setFeeStructures((prev) =>
        editingStructure ? prev.map((fs) => (fs.id === saved.id ? saved : fs)) : [saved, ...prev]
      );

      toast.success(editingStructure ? 'Fee structure updated.' : 'Fee structure created.');
      setIsStructureDialogOpen(false);
      setEditingStructure(null);
    } catch (error) {
      toast.error('Failed to save fee structure.');
    } finally {
      setIsSavingStructure(false);
    }
  };

  const handleDeleteStructure = async (structure: FeeStructure) => {
    if (!window.confirm(`Delete fee structure for ${gradeLabel(structure.grade)} (${structure.academicYear})?`)) {
      return;
    }

    try {
      await feeStructureApi.delete(structure.id);
      setFeeStructures((prev) => prev.filter((fs) => fs.id !== structure.id));
      toast.success('Fee structure deleted.');
    } catch {
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

  // All from server — Django calculates these correctly
  const totalRevenue = Number(stats?.totalRevenue) || 0;
  const pendingFees = Number(stats?.pendingFees) || 0;
  const totalExpected = Number(stats?.total_expected) || (totalRevenue + pendingFees);
  const collectionRate = totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 0;

  // Group transactions by status
  const paidTransactions = transactions.filter(t => t.status === 'paid');
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const overdueTransactions = transactions.filter(t => t.status === 'overdue');

  // Use server-calculated overdue (from previous unpaid years)
  const overdueAmount = Number(stats?.overdue_amount) || overdueTransactions.reduce((sum, t) => {
    const outstanding = Math.max((t.totalAmount ?? t.amount) - t.amount, 0);
    return sum + outstanding;
  }, 0);

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

      {/* Academic Year Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  {academicYears.map((y: any) => (
                    <SelectItem key={y.id} value={y.id.toString()}>
                      {y.name}{y.is_active ? ' (Active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground self-end">
              {selectedYear === 'all' ? 'Showing all-time data' : `Showing data for selected academic year`}
            </p>
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
            <div className="text-2xl font-bold text-red-600">
              ₦{overdueAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              {overdueTransactions.length} overdue payment{overdueTransactions.length !== 1 ? 's' : ''}
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
                    <span className="text-sm font-medium">₦{overdueAmount.toLocaleString()}</span>
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

          {/* Recent Transactions — overview shows top 10 newest */}
          <TransactionsListCard transactions={transactions} title="Recent Transactions" description="Latest fee payments" defaultLimit={10} />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <TransactionsListCard transactions={transactions} title="All Transactions" description="Complete transaction history" />
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
                        <TableCell>{gradeLabel(fs.grade)}</TableCell>
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
                    <Label>Class Level *</Label>
                    <Select
                      value={structureForm.grade}
                      onValueChange={(v) => setStructureForm(s => ({ ...s, grade: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueGrades.map(({ grade, label }) => (
                          <SelectItem key={grade} value={String(grade)}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Applies to all sections (A, B, C…) of this level</p>
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
          <PaymentsTab transactions={transactions} />
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