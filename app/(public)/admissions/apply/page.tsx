'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { admissionsApi, AdmissionInfo, StartedApplication } from '@/lib/admissions-api';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, ShieldCheck, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'admission_intent';

const naira = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(amount);

/**
 * Step 1: collect just enough to identify the child and take the fee.
 *
 * The application row is created *before* checkout opens, so the reference
 * survives a failed or abandoned payment. Once it exists we stop showing the
 * form entirely and show a summary + pay button instead — re-editing a
 * started application is not a thing, and leaving dead inputs on screen only
 * creates ways to get stuck.
 */
export default function ApplyPage() {
  const router = useRouter();
  const [info, setInfo] = useState<AdmissionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState<StartedApplication | null>(null);
  const [payNow, setPayNow] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    contact_email: '',
    contact_phone: '',
    level: '',
  });

  useEffect(() => {
    admissionsApi.info()
      .then(setInfo)
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Resume an unpaid application — either one this browser started, or one
  // handed over by ?reference=, which is how the retrieve page sends someone
  // here to finish paying from a different device.
  //
  // Its real status is checked against the server first: the webhook may have
  // recorded the payment even though the browser never made it back here.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('reference');
    const stored = sessionStorage.getItem(STORAGE_KEY);

    let reference = fromUrl;
    if (!reference && stored) {
      try {
        reference = (JSON.parse(stored) as StartedApplication).reference;
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
    }
    if (!reference) return;

    admissionsApi.get(reference)
      .then(application => {
        if (application.paid_at) {
          sessionStorage.removeItem(STORAGE_KEY);
          toast.success('Your payment came through. Continue with the form.');
          router.replace(`/admissions/${application.reference}`);
          return;
        }

        const resumed: StartedApplication = {
          reference: application.reference,
          status: application.status,
          fee_amount: Number(application.fee_amount),
          full_name: application.full_name,
          level_display: application.level_display,
          contact_email: application.contact_email,
          contact_phone: application.contact_phone,
        };
        setStarted(resumed);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(resumed));
      })
      .catch(() => {
        // Unknown or unreachable reference — fall back to a fresh form rather
        // than stranding them on a page that cannot pay.
        sessionStorage.removeItem(STORAGE_KEY);
      });
  }, [router]);

  const selectedLevel = info?.levels.find(l => String(l.value) === form.level);
  const amount = started?.fee_amount ?? selectedLevel?.fee ?? 0;

  const flutterwaveConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxx-X',
    // The webhook finds the application by tx_ref, so this must be the
    // reference and nothing else.
    tx_ref: started?.reference ?? '',
    amount,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: started?.contact_email ?? '',
      phone_number: started?.contact_phone ?? '',
      name: started?.full_name ?? '',
    },
    customizations: {
      title: 'Laazeere Academy',
      description: `Application fee — ${started?.level_display ?? ''}`,
      logo: '/school-logo.png',
    },
  };

  const openCheckout = useFlutterwave(flutterwaveConfig);

  /*
   * Checkout is fired from an effect, not straight out of the click handler.
   * useFlutterwave closes over the config from the render it ran in, so
   * calling it in the same tick that creates the application would open
   * checkout with an empty tx_ref and a zero amount. Waiting for the re-render
   * is what makes the config correct.
   */
  useEffect(() => {
    if (!payNow || !started || amount <= 0) return;
    setPayNow(false);

    openCheckout({
      callback: async (response) => {
        closePaymentModal();
        try {
          await admissionsApi.verifyPayment(response.transaction_id, started.reference);
          sessionStorage.removeItem(STORAGE_KEY);
          toast.success('Payment confirmed. You can now fill the form.');
        } catch {
          // The webhook is the authoritative record — a failed browser-side
          // verify is a delay, not a lost payment.
          toast.info('Payment received. Confirming it may take a moment.');
        }
        router.push(`/admissions/${started.reference}`);
      },
      onClose: () => {
        setBusy(false);
        toast.info(
          `Payment was not completed. Your reference ${started.reference} is saved — ` +
          'you can try again below.',
        );
      },
    });
  }, [payNow, started, amount, openCheckout, router]);

  const handleStart = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.level) {
      toast.error('Please choose the class you are applying for.');
      return;
    }

    setBusy(true);
    try {
      const application = await admissionsApi.start({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth,
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        level: Number(form.level),
      });

      setStarted(application);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(application));
      setPayNow(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start the application.');
      setBusy(false);
    }
  };

  const handleRetryPayment = () => {
    setBusy(true);
    setPayNow(true);
  };

  const handleStartOver = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setStarted(null);
    setBusy(false);
    setPayNow(false);
  };

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  // A started-but-unpaid application still needs paying even if the window has
  // since closed, so only block the brand-new case.
  if (!info?.is_open && !started) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-10">
            <h2 className="text-lg font-semibold">Admissions are closed</h2>
            <p className="text-sm text-muted-foreground mt-2">
              New applications are not being accepted right now.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/admissions">Back to admissions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-10">
        <Link
          href="/admissions"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Link>

        {started ? (
          <Card>
            <CardHeader>
              <CardTitle>Pay your application fee</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your details are saved. The form opens as soon as payment goes through.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">Your reference</p>
                <p className="font-semibold text-primary tracking-wide">
                  {started.reference}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Write this down. It is how you find your form again.
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <SummaryRow label="Applicant" value={started.full_name} />
                <SummaryRow label="Applying for" value={started.level_display} />
                <SummaryRow label="Phone" value={started.contact_phone} />
                {started.contact_email && (
                  <SummaryRow label="Email" value={started.contact_email} />
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                <span className="text-sm text-muted-foreground">Application fee</span>
                <span className="font-semibold">{naira(amount)}</span>
              </div>

              <Button className="w-full" disabled={busy} onClick={handleRetryPayment}>
                {busy
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opening payment…</>
                  : `Pay ${naira(amount)}`}
              </Button>

              <div className="flex items-center justify-between gap-3 pt-1">
                <Button
                  variant="ghost" size="sm" disabled={busy}
                  onClick={handleStartOver}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Different applicant
                </Button>
                <Link
                  href="/admissions/retrieve"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Already paid?
                </Link>
              </div>

              <p className="flex items-center justify-center text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                Payment is handled securely by Flutterwave
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Start your application</CardTitle>
              <p className="text-sm text-muted-foreground">
                We only need a few details to begin. The full form comes after payment.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStart} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name">First name</Label>
                    <Input
                      id="first_name" required value={form.first_name}
                      onChange={e => update('first_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name">Surname</Label>
                    <Input
                      id="last_name" required value={form.last_name}
                      onChange={e => update('last_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date_of_birth">Date of birth</Label>
                  <Input
                    id="date_of_birth" type="date" required
                    value={form.date_of_birth}
                    onChange={e => update('date_of_birth', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You will need this to find your form again later.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="level">Applying for</Label>
                  <Select
                    value={form.level}
                    onValueChange={value => update('level', value)}
                  >
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {info?.levels.map(level => (
                        <SelectItem key={level.value} value={String(level.value)}>
                          {level.label} — {naira(level.fee)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact_phone">Phone number</Label>
                  <Input
                    id="contact_phone" type="tel" required
                    placeholder="08030000000"
                    value={form.contact_phone}
                    onChange={e => update('contact_phone', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email" type="email" required
                    value={form.contact_email}
                    onChange={e => update('contact_email', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your payment receipt is sent here.
                  </p>
                </div>

                {amount > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                    <span className="text-sm text-muted-foreground">Application fee</span>
                    <span className="font-semibold">{naira(amount)}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting…</>
                    : 'Continue to payment'}
                </Button>

                <p className="flex items-center justify-center text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                  Payment is handled securely by Flutterwave
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
