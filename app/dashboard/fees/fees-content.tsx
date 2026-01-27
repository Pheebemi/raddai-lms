'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, CreditCard, Calendar, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { feesApi, fetchAcademicYears, handleApiError } from '@/lib/api';
import { FeeTransaction, FeeStructure } from '@/types';
import { toast } from 'sonner';

export function FeesContent() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<FeeTransaction[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fixed term amounts
  const TERM_AMOUNTS = {
    first: 30000,
    second: 30000,
    third: 30000,
  };

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    term: 'first',
    academicYear: '',
    remarks: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentsData, yearsData] = await Promise.all([
          feesApi.getPayments(),
          fetchAcademicYears(),
        ]);
        setPayments(paymentsData);
        setAcademicYears(yearsData);

        // Set default academic year to current/latest
        if (yearsData.length > 0) {
          setPaymentData(prev => ({ ...prev, academicYear: yearsData[0].id.toString() }));
        }
      } catch (error) {
        toast.error(handleApiError(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Flutterwave configuration
  const flutterwaveConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxx-X', // Replace with your actual key
    tx_ref: `school_fee_${user?.id}_${Date.now()}`,
    amount: TERM_AMOUNTS[paymentData.term as keyof typeof TERM_AMOUNTS],
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || '',
      phone_number: user?.phone || '',
      name: user ? `${user.firstName} ${user.lastName}` : '',
    },
    customizations: {
      title: `Raddai Metropolitan School - ${paymentData.term.charAt(0).toUpperCase() + paymentData.term.slice(1)} Term Fee`,
      description: `Payment for ${paymentData.term} term school fees`,
      logo: '/school-logo.png', // Add your school logo
    },
  };

  const handleFlutterwavePayment = useFlutterwave(flutterwaveConfig);

  const handlePaymentSubmit = () => {
    if (!user) return;

    handleFlutterwavePayment({
      callback: async (response) => {
        console.log('Flutterwave response:', response);

        if (response.status === 'successful') {
          // Record the successful payment
          try {
            await feesApi.createPayment({
              student: user.id,
              fee_structure: 'school_fee', // Default fee structure
              amount_paid: TERM_AMOUNTS[paymentData.term as keyof typeof TERM_AMOUNTS],
              payment_method: 'flutterwave',
              term: paymentData.term,
              academic_year: paymentData.academicYear,
              remarks: `Flutterwave Payment - ${response.transaction_id} - ${paymentData.remarks}`,
            });

            // Refresh payments
            const updatedPayments = await feesApi.getPayments();
            setPayments(updatedPayments);

            toast.success('Payment completed successfully!');
            setIsPaymentDialogOpen(false);
            setPaymentData({
              term: 'first',
              academicYear: academicYears[0]?.id.toString() || '',
              remarks: '',
            });
          } catch (error) {
            toast.error('Payment was successful but failed to record: ' + handleApiError(error));
          }
        } else {
          toast.error('Payment was not successful');
        }

        closePaymentModal(); // Close the Flutterwave modal
      },
      onClose: () => {
        toast.info('Payment cancelled');
      },
    });
  };

  // Filter payments based on selected term and year
  const filteredPayments = payments.filter(payment => {
    if (selectedTerm !== 'all' && payment.term !== selectedTerm) return false;
    if (selectedYear !== 'all' && payment.academicYear !== selectedYear) return false;
    return true;
  });

  // Group payments by term
  const paymentsByTerm = filteredPayments.reduce((acc, payment) => {
    const term = payment.term || 'general';
    if (!acc[term]) {
      acc[term] = [];
    }
    acc[term].push(payment);
    return acc;
  }, {} as Record<string, FeeTransaction[]>);

  // Calculate summary statistics
  const totalPaid = filteredPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOverdue = filteredPayments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  // Get unique terms and years for filters
  const availableTerms = Array.from(new Set(payments.map(p => p.term).filter(Boolean)));
  const availableYears = Array.from(new Set(payments.map(p => p.academicYear).filter(Boolean)));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">School Fees</h1>
            <p className="text-muted-foreground">Manage your term-based fee payments</p>
          </div>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School Fees</h1>
          <p className="text-muted-foreground">Manage your term-based fee payments</p>
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md inline-block">
            💰 Fixed term fees: ₦30,000 per term (First, Second, Third)
          </div>
        </div>
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay School Fees
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Pay School Fees</DialogTitle>
              <DialogDescription>
                Complete payment for the selected term using Flutterwave.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="term" className="text-right">
                  Term
                </Label>
                <Select value={paymentData.term} onValueChange={(value) => setPaymentData(prev => ({ ...prev, term: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">First Term</SelectItem>
                    <SelectItem value="second">Second Term</SelectItem>
                    <SelectItem value="third">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="academicYear" className="text-right">
                  Academic Year
                </Label>
                <Select value={paymentData.academicYear} onValueChange={(value) => setPaymentData(prev => ({ ...prev, academicYear: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(year => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">
                  Amount
                </Label>
                <div className="col-span-3">
                  <div className="text-2xl font-bold text-green-600">
                    ₦{TERM_AMOUNTS[paymentData.term as keyof typeof TERM_AMOUNTS].toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Fixed amount for {paymentData.term} term
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="remarks" className="text-right">
                  Remarks
                </Label>
                <Textarea
                  id="remarks"
                  placeholder="Optional remarks"
                  className="col-span-3"
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, remarks: e.target.value }))}
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg col-span-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Payment Method: Flutterwave</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Secure payment processing with multiple options (Card, Mobile Money, USSD)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handlePaymentSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Pay with Flutterwave'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fee Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all terms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₦{totalPending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₦{totalOverdue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Due Date</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredPayments
                .filter(p => p.status === 'pending')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
                ?.dueDate ? new Date(filteredPayments
                  .filter(p => p.status === 'pending')
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
                  .dueDate).toLocaleDateString() : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">Upcoming payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {availableTerms.map(term => (
                    <SelectItem key={term} value={term}>{term.charAt(0).toUpperCase() + term.slice(1)} Term</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments by Term */}
      <div className="space-y-6">
        {Object.keys(paymentsByTerm).length > 0 ? (
          Object.entries(paymentsByTerm).map(([term, termPayments]) => (
            <div key={term} className="space-y-2">
              <h2 className="text-2xl font-bold">
                {term.charAt(0).toUpperCase() + term.slice(1)} Term Payments
                {termPayments[0]?.academicYear && ` - ${termPayments[0].academicYear}`}
              </h2>
              <Card>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {termPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">₦{payment.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              payment.status === 'paid' ? 'default' :
                              payment.status === 'pending' ? 'secondary' :
                              payment.status === 'overdue' ? 'destructive' : 'outline'
                            }>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.paymentMethod || 'N/A'}</TableCell>
                          <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>{payment.remarks || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Payments Found</h3>
                <p className="text-muted-foreground">
                  {selectedTerm !== 'all' || selectedYear !== 'all'
                    ? 'Try adjusting your filters to see more payments.'
                    : 'Your fee payment history will appear here once payments are recorded.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}