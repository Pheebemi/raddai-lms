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
import { DollarSign, CreditCard, Calendar, AlertCircle, CheckCircle, Clock, Filter, Download } from 'lucide-react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { feesApi, feeStructureApi, fetchAcademicYears, handleApiError, authApi } from '@/lib/api';
import { FeeTransaction, FeeStructure } from '@/types';
import { toast } from 'sonner';

export function FeesContent() {
  const { user, logout } = useAuth();
  const [payments, setPayments] = useState<FeeTransaction[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Get fee amount for student's grade and academic year
  // Returns null when we cannot reliably determine the configured fee
  const getFeeAmount = (term: string, academicYear: string): number | null => {
    console.log('🔍 getFeeAmount:', { term, academicYear, studentClass: user?.profile?.current_class });

    if (!user?.profile?.current_class) {
      console.log('❌ No current class found');
      return null;
    }

    // Get student's grade from their class
    const studentClass = user.profile.current_class;
    console.log('🏫 Student class details:', {
      className: studentClass,
      classType: typeof studentClass,
      classKeys: typeof studentClass === 'object' ? Object.keys(studentClass) : 'not object'
    });

    // Try multiple ways to parse grade from class name
    let grade = null;

    // Method 1: "Grade X" or "Grade X Y"
    const gradeMatch1 = studentClass.match(/Grade (\d+)/);
    if (gradeMatch1) {
      grade = parseInt(gradeMatch1[1]);
    }

    // Method 2: Just a number at the beginning
    if (!grade) {
      const gradeMatch2 = studentClass.match(/^(\d+)/);
      if (gradeMatch2) {
        grade = parseInt(gradeMatch2[1]);
      }
    }

    // Method 3: Number anywhere in the string
    if (!grade) {
      const gradeMatch3 = studentClass.match(/(\d+)/);
      if (gradeMatch3) {
        grade = parseInt(gradeMatch3[1]);
      }
    }

    console.log('📊 Parsed grade:', grade, 'from class:', studentClass, 'using methods:', {
      gradeMatch1: gradeMatch1?.[1],
      gradeMatch2: studentClass.match(/^(\d+)/)?.[1],
      gradeMatch3: studentClass.match(/(\d+)/)?.[1]
    });

    if (!grade) {
      console.log('❌ Could not parse grade from class name');
      return null;
    }

    console.log('💰 Available fee structures:', feeStructures.map(fs => ({
      id: fs.id,
      grade: fs.grade,
      feeType: fs.feeType,
      academicYearId: fs.academicYearId,
      academicYear: fs.academicYear,
      amount: fs.amount
    })));

    // Find tuition fee for this grade and academic year
    console.log('🔍 Looking for fee structure with:', { grade, academicYear, academicYearType: typeof academicYear });

    const feeStructure = feeStructures.find(fs => {
      console.log('🔍 Checking fee structure:', {
        fs_id: fs.id,
        fs_grade: fs.grade,
        fs_feeType: fs.feeType,
        fs_academicYearId: fs.academicYearId,
        fs_academicYearIdType: typeof fs.academicYearId,
        fs_academicYear: fs.academicYear,
        lookingFor: academicYear,
        matches: {
          grade: fs.grade === grade,
          feeType: fs.feeType === 'tuition',
          academicYearId_exact: fs.academicYearId === academicYear,
          academicYearId_parsed: fs.academicYearId === parseInt(academicYear),
          academicYearId_string: String(fs.academicYearId) === academicYear
        }
      });

      const matches = fs.grade === grade &&
        fs.feeType === 'tuition' &&
        (fs.academicYearId === academicYear ||
         fs.academicYearId === parseInt(academicYear) ||
         String(fs.academicYearId) === academicYear);

      if (matches) {
        console.log('✅ Found matching fee structure:', fs);
      }

      return matches;
    });

    console.log('🎯 Fee structure search result:', feeStructure ? `Found ID ${feeStructure.id} with amount ${feeStructure.amount}` : 'NOT FOUND');

    if (!feeStructure) {
      console.log('❌ No matching fee structure found for computed grade/year');
      return null;
    }

    const result = feeStructure.amount;
    console.log('💵 Final amount:', result, '(from fee structure)');
    return result;
  };

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    term: 'first',
    academicYear: '',
    remarks: '',
  });
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');

  // Update payment data when academic years load
  useEffect(() => {
    if (academicYears.length > 0 && !paymentData.academicYear) {
      // Sort by ID descending to get the latest academic year
      const sortedYears = [...academicYears].sort((a, b) => parseInt(b.id) - parseInt(a.id));
      const selectedYear = sortedYears[0];
      console.log('🎓 Selected academic year:', selectedYear);
      setPaymentData(prev => ({ ...prev, academicYear: selectedYear.id.toString() }));
    }
  }, [academicYears, paymentData.academicYear]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setAuthError(false);
        const [paymentsData, yearsData, feeStructuresData] = await Promise.all([
          feesApi.getPayments(),
          fetchAcademicYears(),
          feeStructureApi.getAll(),
        ]);

        setPayments(paymentsData);
        setAcademicYears(yearsData);
        setFeeStructures(feeStructuresData);

        console.log('📊 Fee structures loaded:', feeStructuresData);
        console.log('📅 Academic years loaded:', yearsData);

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

  // Get current full fee amount for the term (target total for that term)
  const currentFeeAmount: number | null = paymentData.academicYear
    ? getFeeAmount(paymentData.term, paymentData.academicYear)
    : null;

  console.log('💰 Current fee calculation:', {
    paymentData_academicYear: paymentData.academicYear,
    currentFeeAmount,
    term: paymentData.term
  });

  // Existing payment record for the selected term/year (if any)
  const currentTermPayment = payments.find(
    (payment) =>
      payment.term === paymentData.term &&
      payment.academicYearId === paymentData.academicYear
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

      // Background gradient for a modern look
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#f3f4ff');
      gradient.addColorStop(0.4, '#ffffff');
      gradient.addColorStop(1, '#f9fafb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';

      let y = 120;

      // Card-style header
      const cardPaddingX = 120;
      const cardWidth = width - cardPaddingX * 2;
      const headerHeight = 260;

      // Header card shadow
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(cardPaddingX - 8, y - 40, cardWidth + 16, headerHeight + 16);

      // Header card background
      const headerGradient = ctx.createLinearGradient(
        cardPaddingX,
        y - 40,
        cardPaddingX + cardWidth,
        y + headerHeight
      );
      headerGradient.addColorStop(0, '#111827');
      headerGradient.addColorStop(1, '#1f2937');
      ctx.fillStyle = headerGradient;
      ctx.fillRect(cardPaddingX, y - 40, cardWidth, headerHeight);

      // School header text
      ctx.fillStyle = '#e5e7eb';
      ctx.font = 'bold 60px Arial';
      ctx.fillText('RADDAI METROPOLITAN SCHOOL', width / 2, y + 10);
      y += 60;

      ctx.font = '36px Arial';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText('JALINGO', width / 2, y + 6);
      y += 70;

      // Receipt title + badge
      ctx.font = 'bold 46px Arial';
      ctx.fillStyle = '#e5e7eb';
      ctx.fillText('SCHOOL FEES RECEIPT', width / 2, y + 10);
      y += 70;

      // Term/session pill
      ctx.font = '28px Arial';
      ctx.fillStyle = '#d1d5db';
      const termLabel = payment.term
        ? `${payment.term.charAt(0).toUpperCase() + payment.term.slice(1)} Term`
        : 'Term';
      const sessionText = `${termLabel} • ${payment.academicYear || 'Session'}`;
      ctx.fillText(sessionText, width / 2, y + 4);
      y += headerHeight + 40;

      // Student and payment info box
      ctx.textAlign = 'left';
      const leftX = cardPaddingX;
      const rightX = width - cardPaddingX;

      // Info card background
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(leftX, y - 30, rightX - leftX, 260, 16);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 30px Arial';
      ctx.fillStyle = '#111827';
      ctx.fillText('Student Name', leftX + 32, y);
      ctx.fillText('Student ID', leftX + 32, y + 55);
      ctx.fillText('Class', leftX + 32, y + 110);
      ctx.fillText('Payment Date', leftX + 32, y + 165);

      const paymentDate = payment.paymentDate
        ? new Date(payment.paymentDate).toLocaleString()
        : 'N/A';

      ctx.font = '30px Arial';
      ctx.fillStyle = '#374151';
      const infoValueX = leftX + 280;
      ctx.fillText(`${user.firstName} ${user.lastName}`, infoValueX, y);
      ctx.fillText(user.id, infoValueX, y + 55);
      ctx.fillText(user.profile?.current_class || 'Not Available', infoValueX, y + 110);
      ctx.fillText(paymentDate, infoValueX, y + 165);

      y += 260 + 60;

      // Amount and status section
      ctx.font = 'bold 34px Arial';
      ctx.fillStyle = '#111827';
      ctx.fillText('Payment Details', leftX, y);
      y += 40;

      ctx.font = '30px Arial';
      ctx.fillStyle = '#374151';
      const perTermTotal = payment.totalAmount ?? payment.amount;
      const outstandingForThisRecord = Math.max(perTermTotal - payment.amount, 0);

      const lines = [
        `Amount Paid: ₦${payment.amount.toLocaleString()}`,
        `Total Fee for This Term: ₦${perTermTotal.toLocaleString()}`,
        `Outstanding for This Term: ₦${outstandingForThisRecord.toLocaleString()}`,
        `Status: ${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}`,
        `Payment Method: ${payment.paymentMethod || 'N/A'}`,
        `Transaction ID: ${payment.transactionId || 'N/A'}`,
      ];

      for (const line of lines) {
        ctx.fillText(line, leftX, y);
        y += 45;
      }

      y += 80;

      // Signature fields row (Principal & Bursar)
      const sigTop = y;
      const sigHeight = 180;
      const sigGap = 40;
      const sigWidth = (cardWidth - sigGap) / 2;

      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.font = '24px Arial';
      ctx.fillStyle = '#4b5563';

      // Principal signature box
      ctx.beginPath();
      ctx.roundRect(cardPaddingX, sigTop, sigWidth, sigHeight, 12);
      ctx.stroke();
      // Line
      ctx.beginPath();
      ctx.moveTo(cardPaddingX + 40, sigTop + sigHeight - 60);
      ctx.lineTo(cardPaddingX + sigWidth - 40, sigTop + sigHeight - 60);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(
        'Principal',
        cardPaddingX + sigWidth / 2,
        sigTop + sigHeight - 20
      );

      // Bursar signature box
      const bursarLeft = cardPaddingX + sigWidth + sigGap;
      ctx.beginPath();
      ctx.roundRect(bursarLeft, sigTop, sigWidth, sigHeight, 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bursarLeft + 40, sigTop + sigHeight - 60);
      ctx.lineTo(bursarLeft + sigWidth - 40, sigTop + sigHeight - 60);
      ctx.stroke();
      ctx.fillText(
        'Bursar',
        bursarLeft + sigWidth / 2,
        sigTop + sigHeight - 20
      );

      y = sigTop + sigHeight + 80;

      // Footer / disclaimer
      ctx.textAlign = 'center';
      ctx.font = '22px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(
        'Thank you for your payment. Please keep this receipt for your records.',
        width / 2,
        y
      );
      y += 40;
      ctx.fillText(
        `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        width / 2,
        y
      );

      // Download PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Raddai_Fees_Receipt_${termLabel.replace(' ', '_')}_${
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

    handleFlutterwavePayment({
      callback: async (response) => {
        console.log('Flutterwave response:', response);

        if (response.status === 'successful') {
          // Find the appropriate fee structure
          const studentGrade = user?.profile?.current_class ?
            parseInt(user.profile.current_class.match(/Grade (\d+)/)?.[1] || '1') : 1;

          const feeStructure = feeStructures.find(fs => {
            // Match grade and fee type
            const gradeMatches = fs.grade === studentGrade;
            const typeMatches = fs.feeType === 'tuition';

            // Match academic year - try both string and number comparisons
            const academicYearMatches =
              fs.academicYearId === paymentData.academicYear ||
              fs.academicYearId === parseInt(paymentData.academicYear) ||
              String(fs.academicYearId) === paymentData.academicYear;

            console.log('🔍 Payment fee structure check:', {
              fs_id: fs.id,
              fs_grade: fs.grade,
              fs_feeType: fs.feeType,
              fs_academicYearId: fs.academicYearId,
              studentGrade,
              paymentData_academicYear: paymentData.academicYear,
              gradeMatches,
              typeMatches,
              academicYearMatches,
              overallMatch: gradeMatches && typeMatches && academicYearMatches
            });

            return gradeMatches && typeMatches && academicYearMatches;
          });

          console.log('🎯 Found fee structure for payment recording:', feeStructure);
          console.log('👤 Student grade:', studentGrade, 'Academic year:', paymentData.academicYear);

          // Check if we have a valid fee structure
          if (!feeStructure) {
            console.error('❌ No fee structure found for payment recording');
            toast.error('Payment was successful but could not be recorded: No matching fee structure found for your grade and academic year. Please contact the administrator.');
            return;
          }

          // Record the successful payment
          try {
            // Calculate due date (end of current month for simplicity)
            const now = new Date();
            const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
            const dueDateString = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format

            // Get the student profile ID, not the user ID
            const studentId = user.profile?.id;
            if (!studentId) {
              console.error('❌ No student profile found for user:', user);
              toast.error('Payment was successful but could not be recorded: Student profile not found. Please contact the administrator.');
              return;
            }

            // Ensure studentId is a number
            const numericStudentId = parseInt(studentId.toString());
            if (isNaN(numericStudentId)) {
              console.error('❌ Invalid student ID:', studentId);
              toast.error('Payment was successful but could not be recorded: Invalid student ID. Please contact the administrator.');
              return;
            }

            console.log('💳 Recording payment with data:', {
              student: numericStudentId,
              fee_structure: parseInt(feeStructure.id.toString()),
              amount_paid: effectiveAmount,
              total_amount: currentFeeAmount, // Full fee for the term
              due_date: dueDateString,
              payment_method: 'flutterwave',
              transaction_id: response.transaction_id,
              remarks: paymentData.remarks || `Flutterwave Payment - ${response.transaction_id}`,
              debug: {
                currentFeeAmount,
                effectiveAmount,
                feeStructure_amount: feeStructure.amount,
                remainingAmount
              }
            });

            const paymentPayload = {
              student: numericStudentId, // Use numeric student profile ID
              fee_structure: parseInt(feeStructure.id.toString()), // Ensure fee structure ID is numeric
              academic_year: paymentData.academicYear, // Academic year ID
              term: paymentData.term, // Term (first, second, third)
              amount_paid: effectiveAmount, // Part payment
              total_amount: currentFeeAmount, // Full fee for the term
              due_date: dueDateString,
              // Backend will compute status (pending/partial/paid) based on cumulative amount
              payment_method: 'flutterwave',
              transaction_id: response.transaction_id,
              remarks: paymentData.remarks || `Flutterwave Payment - ${response.transaction_id}`,
            };

            console.log('📤 Sending payment data to backend:', paymentPayload);

            try {
              const result = await feesApi.createPayment(paymentPayload);
              console.log('✅ Payment recorded successfully:', result);
            } catch (paymentError: any) {
              console.error('❌ Payment recording failed:', paymentError);
              console.error('❌ Error details:', paymentError.response?.data || paymentError.message);
              throw paymentError; // Re-throw to trigger the error handling below
            }

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
  const totalPaid = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  // Session-level pending fees for the currently selected / latest academic year:
  // (per-term fee * 3 terms) - total amount paid in that academic year.
  const selectedAcademicYearId = paymentData.academicYear;

  const totalPaidInSession = payments
    .filter(p => !selectedAcademicYearId || p.academicYearId === selectedAcademicYearId)
    .reduce((sum, p) => sum + p.amount, 0);

  const sessionPendingAmount =
    currentFeeAmount !== null
      ? Math.max(currentFeeAmount * 3 - totalPaidInSession, 0)
      : 0;

  // Overdue amount across filtered payments, based on remaining per record
  const totalOverdue = filteredPayments
    .filter(p => p.status === 'overdue')
    .reduce((sum, p) => {
      const total = p.totalAmount ?? p.amount;
      const outstanding = Math.max(total - p.amount, 0);
      return sum + outstanding;
    }, 0);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School Fees</h1>
          <p className="text-muted-foreground">Manage your term-based fee payments</p>
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md inline-block">
            💰 Term fees are set per grade/class in the Django admin panel
          </div>
        </div>
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              <CreditCard className="mr-2 h-5 w-5" />
              Pay School Fees
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
                        payment.status === 'paid'
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
                      {currentFeeAmount !== null
                        ? `₦${currentFeeAmount.toLocaleString()}`
                        : '—'}
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
                        payment.status === 'paid'
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