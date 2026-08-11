'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { admissionsApi, LookupResult } from '@/lib/admissions-api';
import {
  ArrowLeft, Loader2, Printer, PencilLine, CreditCard, Search,
} from 'lucide-react';

/**
 * Come back to an application later. Email or phone plus the applicant's date
 * of birth — the DOB stops anyone who merely knows a phone number from pulling
 * up another family's details, and tells siblings apart.
 */
export default function RetrievePage() {
  const [identifier, setIdentifier] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [results, setResults] = useState<LookupResult[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const { applications } = await admissionsApi.lookup(identifier.trim(), dateOfBirth);
      setResults(applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-10">
        <Link
          href="/admissions"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Find your application</CardTitle>
            <p className="text-sm text-muted-foreground">
              Use the email address or phone number you applied with.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Email or phone number</Label>
                <Input
                  id="identifier" required
                  placeholder="08030000000 or parent@example.com"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dob">Applicant&apos;s date of birth</Label>
                <Input
                  id="dob" type="date" required
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Searching…</>
                  : <><Search className="h-4 w-4 mr-2" /> Find my form</>}
              </Button>
            </form>

            {error && (
              <p className="text-sm text-destructive mt-4 text-center">{error}</p>
            )}
          </CardContent>
        </Card>

        {results?.map(application => (
          <Card key={application.reference} className="mt-4">
            <CardContent className="py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{application.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {application.level_display} · {application.reference}
                  </p>
                </div>
                <Badge variant={application.can_print ? 'default' : 'secondary'}>
                  {application.status_display}
                </Badge>
              </div>

              <div className="mt-4">
                {!application.is_paid && (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      The application fee has not been paid, so the form is not open
                      yet. Once you pay, you can fill it in and print it.
                    </p>
                    <Button asChild className="w-full">
                      <Link href={`/admissions/apply?reference=${application.reference}`}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay application fee
                      </Link>
                    </Button>
                  </>
                )}

                {application.is_paid && !application.can_print && (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your payment came through, but the form is not finished —{' '}
                      {application.missing_fields.length} required{' '}
                      {application.missing_fields.length === 1 ? 'field is' : 'fields are'}{' '}
                      still empty. You can print it once it is submitted.
                    </p>
                    <Button asChild className="w-full">
                      <Link href={`/admissions/${application.reference}`}>
                        <PencilLine className="h-4 w-4 mr-2" />
                        Continue filling the form
                      </Link>
                    </Button>
                  </>
                )}

                {application.can_print && (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your form has been submitted. You can print it as many times
                      as you need.
                    </p>
                    <Button asChild className="w-full">
                      <Link href={`/admissions/${application.reference}/print`}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print my form
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
