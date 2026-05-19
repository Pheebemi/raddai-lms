'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { DollarSign, CreditCard, Calendar, AlertCircle, CheckCircle, Clock, Filter, Download } from 'lucide-react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { feesApi, feeStructureApi, classesApi, dashboardApi, usersApi, getStudentTermFee, fetchAcademicYears, handleApiError, authApi } from '@/lib/api';
import { FeeTransaction, FeeStructure } from '@/types';
import { toast } from 'sonner';

export function FeesContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<FeeTransaction[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [studentGrade, setStudentGrade] = useState<number | null>(null);
  const [serverFeeAmount, setServerFeeAmount] = useState<number | null>(null);
  const [serverPendingFees, setServerPendingFees] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [parentChildren, setParentChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Get fee amount for student's grade and academic year
  // Returns null when we cannot reliably determine the configured fee
  const getFeeAmount = (term: string, academicYear: string): number | null => {
    // Server already calculated the exact fee — use it directly, no closure issues
    if (serverFeeAmount !== null) return serverFeeAmount;

    if (studentGrade === null) return null;

    const feeStructure = feeStructures.find(fs =>
      fs.grade === studentGrade &&
      fs.feeType === 'tuition' &&
      String(fs.academicYearId) === String(academicYear)
    );

    return feeStructure?.amount ?? null;
  };

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    term: 'first',
    academicYear: '',
    remarks: '',
  });
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [currentFeeAmount, setCurrentFeeAmount] = useState<number | null>(null);
  const [isFeeAmountLoading, setIsFeeAmountLoading] = useState(false);

  // Update payment data when academic years load
  useEffect(() => {
    if (academicYears.length > 0 && !paymentData.academicYear) {
      // Sort by ID descending to get the latest academic year
      const sortedYears = [...academicYears].sort((a, b) => parseInt(b.id) - parseInt(a.id));
      const selectedYear = sortedYears[0];
      setPaymentData(prev => ({ ...prev, academicYear: selectedYear.id.toString() }));
    }
  }, [academicYears, paymentData.academicYear]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setAuthError(false);
        const [paymentsData, yearsData, feeStructuresData, statsData] = await Promise.all([
          feesApi.getPayments(),
          fetchAcademicYears(),
          feeStructureApi.getAll(),
          dashboardApi.getStats().catch(() => null),
        ]);

        setPayments(paymentsData);
        setAcademicYears(yearsData);
        setFeeStructures(feeStructuresData);
        if (statsData?.pendingFees) setServerPendingFees(Number(statsData.pendingFees));
        if (statsData?.per_term_fee && statsData.per_term_fee > 0) {
          setServerFeeAmount(Number(statsData.per_term_fee));
        }

        // Load parent children if parent role
        if (user?.role === 'parent') {
          try {
            const parents = await usersApi.getParents();
            const me = parents.find((p: any) => p.user.id === user.id);
            const children = me?.children || [];
            setParentChildren(children);
            if (children.length > 0) setSelectedChild(children[0]);
          } catch { /* non-blocking */ }
        }

        // Resolve student grade separately so it never blocks the main data
        try {
          const classId = user?.role === 'parent' ? null : user?.profile?.current_class_id;
          if (classId) {
            const classesData = await classesApi.getAll();
            const studentClass = classesData.find((c: any) => String(c.id) === String(classId));
            if (studentClass) setStudentGrade(studentClass.grade);
          }
        } catch {
          // Grade lookup failure doesn't break the fees page
        }

        // Set default academic year to current/latest
        if (yearsData.length > 0) {
          // Sort by ID descending to get the latest academic year
          const sortedYears = [...yearsData].sort((a, b) => parseInt(b.id) - parseInt(a.id));
          setPaymentData(prev => ({ ...prev, academicYear: sortedYears[0].id.toString() }));
        }
      } catch (error: any) {
        const errorMessage = handleApiError(error);
        console.error('API Error:', error);

        // Check if it's an authentication error
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || error?.status === 401) {
          setAuthError(true);
          toast.error('Your session has expired. Please log in again.');
          // Logout user to clear invalid tokens
          setTimeout(() => {
            logout();
          }, 2000);
        } else {
          toast.error(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [logout]);

  // When parent switches child, reset fee amount so it re-fetches
  useEffect(() => {
    if (user?.role !== 'parent') return;
    setCurrentFeeAmount(null);
    setServerFeeAmount(null);
    setIsFeeAmountLoading(true);
  }, [selectedChild?.id, user?.role]);

  // Fetch fee amount from server whenever academic year or selected child changes
  useEffect(() => {
    if (!paymentData.academicYear) {
      setCurrentFeeAmount(null);
      setIsFeeAmountLoading(false);
      return;
    }

    // For parents, wait until a child is selected before fetching
    if (user?.role === 'parent' && !selectedChild?.id) {
      setCurrentFeeAmount(null);
      setIsFeeAmountLoading(false);
      return;
    }

    setIsFeeAmountLoading(true);
    const studentId = user?.role === 'parent' ? selectedChild?.id : undefined;

    getStudentTermFee(paymentData.academicYear, studentId)
      .then(data => setCurrentFeeAmount(data.fee ?? null))
      .catch(() => setCurrentFeeAmount(null))
      .finally(() => setIsFeeAmountLoading(false));
  }, [paymentData.academicYear, user?.role, selectedChild?.id]);

  // Handle redirect back from Flutterwave
  useEffect(() => {
    const paymentStatus = searchParams.get('payment') || searchParams.get('status');
    if (!paymentStatus) return;

    const normalize = paymentStatus.toLowerCase();

    if (normalize === 'failed' || normalize === 'cancelled') {
      toast.error('Payment was not completed.');
      sessionStorage.removeItem('flutterwave_payment_intent');
      router.replace('/dashboard/fees');
      return;
    }

    if (normalize !== 'success' && normalize !== 'successful') {
      router.replace('/dashboard/fees');
      return;
    }

    // Clean the URL immediately so the effect doesn't re-trigger
    router.replace('/dashboard/fees');

    const storedData = sessionStorage.getItem('flutterwave_payment_intent');
    if (!storedData) return;

    const paymentIntent = JSON.parse(storedData);
    const urlTransactionId = new URLSearchParams(window.location.search).get('transaction_id');
    const transactionId = urlTransactionId || paymentIntent.txRef;
    const numericStudentId = parseInt(paymentIntent.studentId.toString());

    if (isNaN(numericStudentId)) {
      toast.error('Payment received but student ID invalid. Contact the administrator.');
      return;
    }

    const record = async () => {
      try {
        await feesApi.verifyPayment({
          transaction_id: transactionId,
          student_id: numericStudentId,
          term: paymentIntent.term,
          academic_year: paymentIntent.academicYear,
          expected_amount: paymentIntent.amount,
          remarks: paymentIntent.remarks,
        });
        sessionStorage.removeItem('flutterwave_payment_intent');
        toast.success('Payment completed and recorded successfully!');
        // Refresh payments list
        feesApi.getPayments().then(setPayments).catch(() => {});
      } catch (error: unknown) {
        toast.error('Payment received but failed to record: ' + handleApiError(error));
      }
    };

    record();
  }, [searchParams]);

  console.log('💰 Current fee calculation:', {
    paymentData_academicYear: paymentData.academicYear,
    currentFeeAmount,
    term: paymentData.term
  });

  // Existing payment record for the selected term/year (filtered by child for parents)
  const currentTermPayment = payments.find(
    (payment) =>
      payment.term === paymentData.term &&
      payment.academicYearId === paymentData.academicYear &&
      (user?.role !== 'parent' || !selectedChild || payment.studentId === selectedChild.id)
  );

  const alreadyPaid = currentTermPayment?.amount ?? 0;
  const remainingAmount =
    currentFeeAmount !== null ? Math.max(currentFeeAmount - alreadyPaid, 0) : null;

  const isPaymentTooHigh =
    remainingAmount !== null &&
    typeof paymentAmount === 'number' &&
    paymentAmount > 0 &&
    paymentAmount > remainingAmount;

  // Download a payment receipt as PNG for a single fee transaction
  const downloadReceiptAsPNG = async (payment: FeeTransaction) => {
    if (!user) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // A5-like size
      const width = 1748; // ~5.8in * 300dpi
      const height = 2480; // ~8.27in * 300dpi
      canvas.width = width;
      canvas.height = height;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const marginX = 140;
      let y = 100;

      // --- Logo ---
      const lSize = 220;
      await new Promise<void>(resolve => {
        const logoImg = new window.Image();
        logoImg.onload = () => {
          ctx.drawImage(logoImg, width / 2 - lSize / 2, y, lSize, lSize);
          resolve();
        };
        logoImg.onerror = () => resolve();
        logoImg.src = '/logo.png';
      });
      y += lSize + 60;

      // --- School Name ---
      ctx.textAlign = 'center';
      ctx.font = 'bold 72px serif';
      ctx.fillStyle = '#000000';
      ctx.fillText('LAAZEERE ACADEMY', width / 2, y);
      y += 60;

      ctx.font = '40px serif';
      ctx.fillStyle = '#374151';
      ctx.fillText('Samunaka Sabon Gari, Jalingo, Taraba State', width / 2, y);
      y += 46;

      ctx.font = '36px serif';
      ctx.fillText('Tel: 08066115707 | 09060405589', width / 2, y);
      y += 60;

      // Divider
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(marginX, y);
      ctx.lineTo(width - marginX, y);
      ctx.stroke();
      y += 10;

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, y);
      ctx.lineTo(width - marginX, y);
      ctx.stroke();
      y += 50;

      // Receipt title
      ctx.font = 'bold 64px serif';
      ctx.fillStyle = '#000000';
      ctx.fillText('SCHOOL FEES RECEIPT', width / 2, y);
      y += 60;

      const termLabel = payment.term
        ? `${payment.term.charAt(0).toUpperCase() + payment.term.slice(1)} Term`
        : 'Term';
      ctx.font = '40px serif';
      ctx.fillStyle = '#374151';
      ctx.fillText(`${termLabel} • ${payment.academicYear || 'Session'}`, width / 2, y);
      y += 60;

      // Divider
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, y);
      ctx.lineTo(width - marginX, y);
      ctx.stroke();
      y += 60;

      // Student details
      const paymentDate = payment.paymentDate
        ? new Date(payment.paymentDate).toLocaleString()
        : 'N/A';
      const studentName = (user?.role === 'parent' && selectedChild)
        ? `${selectedChild.user?.firstName || ''} ${selectedChild.user?.lastName || ''}`.trim()
        : `${user.firstName} ${user.lastName}`;
      const studentIdLabel = (user?.role === 'parent' && selectedChild)
        ? selectedChild.studentId || selectedChild.id
        : user.id;

      const drawRow = (label: string, value: string) => {
        ctx.textAlign = 'left';
        ctx.font = 'bold 36px serif';
        ctx.fillStyle = '#374151';
        ctx.fillText(label, marginX, y);
        ctx.font = '36px serif';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'right';
        ctx.fillText(value, width - marginX, y);
        y += 56;
        ctx.strokeStyle = '#f3f4f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(marginX, y - 12);
        ctx.lineTo(width - marginX, y - 12);
        ctx.stroke();
      };

      drawRow('Student Name', studentName);
      drawRow('Student ID', String(studentIdLabel));
      drawRow('Academic Year', payment.academicYear || 'N/A');
      drawRow('Payment Date', paymentDate);

      y += 20;
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, y);
      ctx.lineTo(width - marginX, y);
      ctx.stroke();
      y += 60;

      // Payment details
      ctx.textAlign = 'center';
      ctx.font = 'bold 48px serif';
      ctx.fillStyle = '#000000';
      ctx.fillText('PAYMENT DETAILS', width / 2, y);
      y += 60;

      const perTermTotal = payment.totalAmount ?? payment.amount;
      const outstanding = Math.max(perTermTotal - payment.amount, 0);

      drawRow('Amount Paid', `₦${payment.amount.toLocaleString()}`);
      drawRow('Total Term Fee', `₦${perTermTotal.toLocaleString()}`);
      drawRow('Outstanding', `₦${outstanding.toLocaleString()}`);
      drawRow('Status', payment.status.charAt(0).toUpperCase() + payment.status.slice(1));
      drawRow('Payment Method', payment.paymentMethod || 'N/A');
      drawRow('Transaction ID', payment.transactionId || 'N/A');

      y += 60;

      // Signature section
      const cardWidth = width - marginX * 2;
      const sigWidth = (cardWidth - 60) / 2;
      const sigHeight = 160;

      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;

      ['Principal', 'Bursar'].forEach((title, i) => {
        const sx = marginX + i * (sigWidth + 60);
        ctx.beginPath();
        ctx.moveTo(sx + 30, y + sigHeight - 50);
        ctx.lineTo(sx + sigWidth - 30, y + sigHeight - 50);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.font = '30px serif';
        ctx.fillStyle = '#374151';
        ctx.fillText(title, sx + sigWidth / 2, y + sigHeight - 10);
      });

      y += sigHeight + 60;

      // Footer
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, y);
      ctx.lineTo(width - marginX, y);
      ctx.stroke();
      y += 40;

      ctx.textAlign = 'center';
      ctx.font = '28px serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Thank you for your payment. Please keep this receipt for your records.', width / 2, y);
      y += 40;
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, width / 2, y);
      y += 36;
      ctx.fillText('This is an official fee receipt from Laazeere Academy, Jalingo', width / 2, y);

      // Download PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Laazeere_Academy_Fees_Receipt_${termLabel.replace(' ', '_')}_${
            payment.academicYear || 'session'
          }.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Receipt downloaded successfully!');
        }
      }, 'image/png');
    } catch (error) {
      toast.error('Failed to generate receipt: ' + handleApiError(error));
    }
  };

  // Check if current term/academic year combination is already fully paid
  const isCurrentTermPaid = currentTermPayment?.status === 'paid';

  // Flutterwave configuration (amount is the part payment the user is making now)
  const flutterwaveConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxx-X',
    tx_ref: `school_fee_${user?.id}_${Date.now()}`,
    amount:
      typeof paymentAmount === 'number' && paymentAmount > 0
        ? paymentAmount
        : remainingAmount && remainingAmount > 0
        ? remainingAmount
        : 0,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || '',
      phone_number: user?.phone || '',
      name: (user?.role === 'parent' && selectedChild)
        ? `${selectedChild.user?.firstName || ''} ${selectedChild.user?.lastName || ''}`.trim()
        : user ? `${user.firstName} ${user.lastName}` : '',
    },
    customizations: {
      title: `Laazeere Academy -${paymentData.term.charAt(0).toUpperCase() + paymentData.term.slice(1)} Term Fee`,
      description: `Payment for ${paymentData.term} term school fees`,
      logo: '/school-logo.png', // Add your school logo
    },
    // Optional redirect back to the app after payment.
    // Flutterwave will append its own status, but we also handle ?payment=success manually.
    redirect_url:
      typeof window !== 'undefined'
        ? `${window.location.origin}/dashboard/fees?payment=success`
        : undefined,
  };

  const handleFlutterwavePayment = useFlutterwave(flutterwaveConfig);

  const handlePaymentSubmit = () => {
    if (!user) return;

    if (currentFeeAmount === null || remainingAmount === null) {
      toast.error('Unable to determine the correct fee amount yet. Please wait a moment or refresh.');
      return;
    }

    const effectiveAmount =
      typeof paymentAmount === 'number' && paymentAmount > 0
        ? paymentAmount
        : remainingAmount;

    if (effectiveAmount <= 0) {
      toast.error('Payment amount must be greater than zero.');
      return;
    }

    if (effectiveAmount > remainingAmount) {
      toast.error('You cannot pay more than the remaining balance for this term.');
      return;
    }

    // Store payment data in sessionStorage for the redirect handler
    const paymentIntentData = {
      studentId: user?.role === 'parent' ? selectedChild?.id : user.profile?.id,
      academicYear: paymentData.academicYear,
      term: paymentData.term,
      amount: effectiveAmount,
      totalAmount: currentFeeAmount,
      remarks: paymentData.remarks || `Flutterwave Payment - Term ${paymentData.term}`,
      txRef: `school_fee_${user?.id}_${Date.now()}`,
    };

    sessionStorage.setItem('flutterwave_payment_intent', JSON.stringify(paymentIntentData));

    handleFlutterwavePayment({
      callback: async (response) => {
        // In redirect mode, this callback may not execute.
        // Payment recording happens in the redirect handler instead.
        closePaymentModal(); // Close the Flutterwave modal if it's still open
      },
      onClose: () => {
        toast.info('Payment cancelled');
        // Clear stored data if user cancels
        sessionStorage.removeItem('flutterwave_payment_intent');
      },
    });
  };

  // Filter payments based on selected term and year
  const filteredPayments = payments.filter(payment => {
    if (selectedTerm !== 'all' && payment.term !== selectedTerm) return false;
    if (selectedYear !== 'all' && payment.academicYear !== selectedYear) return false;
    // For parents, only show selected child's payments
    if (user?.role === 'parent' && selectedChild && payment.studentId !== selectedChild.id) return false;
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
  const totalPaid = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  // For parents: calculate from their selected child's payments; for students: use server stats
  const sessionPendingAmount = (user?.role === 'parent' && selectedChild)
    ? (() => {
        const childPayments = payments.filter(p => p.studentId === selectedChild.id);
        const paid = childPayments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.totalAmount ?? p.amount), 0);
        const total = currentFeeAmount !== null ? currentFeeAmount * 3 : 0;
        return Math.max(total - paid, 0);
      })()
    : serverPendingFees;

  // Overdue amount across filtered payments, based on remaining per record
  const totalOverdue = filteredPayments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => {
      const total = p.totalAmount ?? p.amount;
      const outstanding = Math.max(total - p.amount, 0);
      return sum + outstanding;
    }, 0);

  // Get unique terms and years for filters
  const availableTerms = Array.from(new Set(payments.map(p => p.term).filter((t): t is 'first' | 'second' | 'third' => Boolean(t))));
  const availableYears = Array.from(new Set(payments.map(p => p.academicYear).filter((y): y is string => y !== undefined && y !== null)));

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

  // Show authentication error
  if (authError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">School Fees</h1>
            <p className="text-muted-foreground">Manage your term-based fee payments</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-medium mb-2 text-red-600">Authentication Required</h3>
              <p className="text-muted-foreground mb-4">
                Your session has expired. You will be redirected to the login page shortly.
              </p>
              <Button onClick={logout} variant="outline">
                Log In Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parent with no children
  if (user?.role === 'parent' && !isLoading && parentChildren.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">School Fees</h1>
          <p className="text-muted-foreground">Manage your children's fee payments</p>
        </div>
        <Card className="border border-border rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No Child Attached Yet</h2>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              No children have been linked to your account yet. Please contact the school administration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School Fees</h1>
          <p className="text-muted-foreground">
            {user?.role === 'parent' ? 'Manage your children\'s fee payments' : 'Manage your term-based fee payments'}
          </p>
        </div>
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              <CreditCard className="mr-2 h-5 w-5" />
              {user?.role === 'parent' && selectedChild
                ? `Pay for ${selectedChild.user?.firstName || 'Child'}`
                : 'Pay School Fees'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader className="text-center pb-2">
              <DialogTitle className="text-2xl font-bold">Pay School Fees</DialogTitle>
              <DialogDescription className="text-base">
                Complete your term payment securely with Flutterwave
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Term Selection */}
              <div className="space-y-2">
                <Label htmlFor="term" className="text-sm font-medium">
                  Select Term
                </Label>
                <Select value={paymentData.term} onValueChange={(value) => setPaymentData(prev => ({ ...prev, term: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a term" />
                  </SelectTrigger>
                  <SelectContent>
                    {['first', 'second', 'third'].map(term => {
                      const isPaid = payments.some(payment =>
                        payment.term === term &&
                        payment.academicYearId === paymentData.academicYear &&
                        payment.status === 'paid' &&
                        (user?.role !== 'parent' || !selectedChild || payment.studentId === selectedChild.id)
                      );
                      return (
                        <SelectItem
                          key={term}
                          value={term}
                          disabled={isPaid}
                          className={isPaid ? 'opacity-50' : ''}
                        >
                          {term.charAt(0).toUpperCase() + term.slice(1)} Term {isPaid && '✓ (Already Paid)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {isCurrentTermPaid && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    This term has already been paid for the selected academic year
                  </p>
                )}
              </div>

              {/* Academic Year Selection */}
              <div className="space-y-2">
                <Label htmlFor="academicYear" className="text-sm font-medium">
                  Academic Year
                </Label>
                <Select value={paymentData.academicYear} onValueChange={(value) => setPaymentData(prev => ({ ...prev, academicYear: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose academic year" />
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

              {/* Amount Display + Part Payment Info */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="text-center">
                    <p className="text-sm text-green-700 font-medium mb-1">
                      Full Fee for This Term
                    </p>
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {isFeeAmountLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent" />
                          <span className="text-base text-green-700 font-medium">Loading fee...</span>
                        </div>
                      ) : currentFeeAmount !== null ? (
                        `₦${currentFeeAmount.toLocaleString()}`
                      ) : paymentData.academicYear ? (
                        'No fee structure set for this class'
                      ) : (
                        '—'
                      )}
                    </div>
                    <p className="text-xs text-green-600">
                      {paymentData.academicYear && user?.profile?.current_class
                        ? `Grade ${
                            user.profile.current_class.match(/Grade (\d+)/)?.[1] || ''
                          } tuition fee for ${
                            paymentData.term.charAt(0).toUpperCase() + paymentData.term.slice(1)
                          } Term`
                        : paymentData.academicYear
                        ? `Fee for ${
                            paymentData.term.charAt(0).toUpperCase() + paymentData.term.slice(1)
                          } Term`
                        : 'Select an academic year to see the fee amount'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Already Paid</p>
                    <p className="font-semibold">
                      ₦{alreadyPaid.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Remaining Balance</p>
                    <p className="font-semibold">
                      {remainingAmount !== null
                        ? `₦${remainingAmount.toLocaleString()}`
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Part payment input */}
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount" className="text-sm font-medium">
                    Amount to Pay Now (Part Payment Allowed)
                  </Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min={0}
                    max={remainingAmount ?? undefined}
                    value={paymentAmount === '' ? '' : paymentAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const num = Number(value);
                      if (value === '') {
                        setPaymentAmount('');
                      } else if (!Number.isNaN(num)) {
                        setPaymentAmount(num);
                      }
                    }}
                    placeholder={
                      remainingAmount !== null
                        ? `₦${remainingAmount.toLocaleString()}`
                        : 'Enter amount'
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    You can pay in parts. Results for a term will only unlock when the full fee for
                    that term has been paid.
                  </p>
                  {isPaymentTooHigh && (
                    <p className="text-xs text-red-600">
                      Amount exceeds remaining balance (₦{remainingAmount.toLocaleString()}).
                    </p>
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-sm font-medium">
                  Remarks (Optional)
                </Label>
                <Textarea
                  id="remarks"
                  placeholder="Add any additional notes..."
                  className="min-h-[80px] resize-none"
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, remarks: e.target.value }))}
                />
              </div>

              {/* Payment Method Info */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">Secure Payment</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Your payment is processed securely through Flutterwave with multiple payment options including cards, mobile money, and USSD.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePaymentSubmit}
                disabled={
                  isSubmitting ||
                  isCurrentTermPaid ||
                  isPaymentTooHigh ||
                  currentFeeAmount === null ||
                  remainingAmount === null ||
                  remainingAmount === 0
                }
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 order-1 sm:order-2 disabled:bg-gray-400"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : isCurrentTermPaid ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Already Paid
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Child selector for parents */}
      {user?.role === 'parent' && parentChildren.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {parentChildren.map((child: any) => (
            <div
              key={child.id}
              onClick={() => {
                setSelectedChild(child);
                setCurrentFeeAmount(null);
                setStudentGrade(null);
                setPaymentAmount('');
              }}
              className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                selectedChild?.id === child.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <p className="font-medium text-sm">{child.user.firstName} {child.user.lastName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{child.studentId} · {child.class || 'No class'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Term Payment Status */}
      {academicYears.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Term Payment Status
            </CardTitle>
            <CardDescription>
              Track which terms have been paid for each academic year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {academicYears.slice(0, 3).map(academicYear => (
                <div key={academicYear.id} className="space-y-2">
                  <h4 className="font-medium text-sm">{academicYear.name}</h4>
                  <div className="space-y-1">
                    {['first', 'second', 'third'].map(term => {
                      const termPayment = payments.find(payment =>
                        payment.term === term &&
                        payment.academicYearId === academicYear.id.toString() &&
                        payment.status === 'paid' &&
                        (user?.role !== 'parent' || !selectedChild || payment.studentId === selectedChild.id)
                      );
                      return (
                        <div key={term} className="flex items-center gap-2 text-sm">
                          {termPayment ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">
                                {term.charAt(0).toUpperCase() + term.slice(1)} Term - Paid
                              </span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-500">
                                {term.charAt(0).toUpperCase() + term.slice(1)} Term - Unpaid
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="text-2xl font-bold text-yellow-600">₦{sessionPendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Remaining for the current academic session (3 terms)
            </p>
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
                        <TableHead className="text-right">Receipt</TableHead>
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
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadReceiptAsPNG(payment)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Receipt
                            </Button>
                          </TableCell>
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