'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { admissionsApi, AdmissionInfo } from '@/lib/admissions-api';
import { GraduationCap, FileText, Printer, AlertCircle, Loader2 } from 'lucide-react';

const naira = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(amount);

export default function AdmissionsLandingPage() {
  const [info, setInfo] = useState<AdmissionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    admissionsApi.info()
      .then(setInfo)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Admissions</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Laazeere Academy, Jalingo — apply for a place from Pre-Nursery through SS 3.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Checking whether admissions are open…
          </div>
        )}

        {!loading && error && (
          <Card className="border-destructive/40">
            <CardContent className="flex items-start gap-3 py-6">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">We could not load the admissions page.</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && info && !info.is_open && (
          <Card>
            <CardContent className="text-center py-12">
              <Badge variant="secondary" className="mb-4">Closed</Badge>
              <h2 className="text-xl font-semibold">Admissions are not open at the moment</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Please check back later. If you already started an application, you can
                still retrieve and print it.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/admissions/retrieve">
                  <Printer className="h-4 w-4 mr-2" />
                  Retrieve my form
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && info?.is_open && (
          <div className="space-y-6">
            {info.instructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Before you begin</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {info.instructions}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Application fee by class</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {info.levels.map(level => (
                    <div
                      key={level.value}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                    >
                      <span className="text-sm font-medium">{level.label}</span>
                      <span className="text-sm text-primary font-semibold">
                        {naira(level.fee)}
                      </span>
                    </div>
                  ))}
                </div>
                {info.closes_on && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Applications close on{' '}
                    {new Date(info.closes_on).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                    .
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="py-6">
                  <FileText className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold">Start a new application</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Enter a few details, pay the application fee, then fill the full form.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/admissions/apply">Apply now</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="py-6">
                  <Printer className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold">Continue or reprint</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Already paid? Look your form up with the email or phone you used.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admissions/retrieve">Retrieve my form</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
