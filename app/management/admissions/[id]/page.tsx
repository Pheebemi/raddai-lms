'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { admissionsManagementApi, Application } from '@/lib/admissions-api';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Printer, Check, X, Clock, PauseCircle } from 'lucide-react';

const showDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

const DECISIONS = [
  { key: 'admitted', label: 'Admit', icon: Check },
  { key: 'waitlisted', label: 'Waitlist', icon: PauseCircle },
  { key: 'rejected', label: 'Not offered', icon: X },
  { key: 'under_review', label: 'Under review', icon: Clock },
];

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState('');

  useEffect(() => {
    admissionsManagementApi.get(id)
      .then(data => {
        setApplication(data);
        setNote(data.decision_note || '');
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const decide = async (decision: string) => {
    setSaving(decision);
    try {
      const updated = await admissionsManagementApi.decide(id, decision, note);
      setApplication(updated);
      toast.success('Decision recorded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not record decision.');
    } finally {
      setSaving('');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
        </div>
      </AppLayout>
    );
  }

  if (!application) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="font-medium">Application not found</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/management/admissions">Back to admissions</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-5 max-w-4xl">
        <Link
          href="/management/admissions"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> All applications
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            {application.passport_photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={application.passport_photo}
                alt={application.full_name}
                className="w-20 h-24 rounded-lg object-cover border border-border"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{application.full_name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {application.level_display} · {application.academic_year_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {application.reference}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">{application.status_display}</Badge>
            {application.submitted_at && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/admissions/${application.reference}/print`} target="_blank">
                  <Printer className="h-4 w-4 mr-2" /> Print form
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Applicant</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Date of birth" value={showDate(application.date_of_birth)} />
              <Row label="Gender" value={application.gender} />
              <Row label="Nationality" value={application.nationality} />
              <Row label="State of origin" value={application.state_of_origin} />
              <Row label="LGA" value={application.lga} />
              <Row label="Religion" value={application.religion} />
              <Row label="Blood group" value={application.blood_group} />
              <Row label="Genotype" value={application.genotype} />
              <Row label="Address" value={application.home_address} />
              <Row label="Medical" value={application.medical_info} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Parent / Guardian</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Name" value={application.guardian_name} />
              <Row label="Relationship" value={application.guardian_relationship} />
              <Row label="Phone" value={application.guardian_phone} />
              <Row label="Father's phone" value={application.father_phone} />
              <Row label="Mother's phone" value={application.mother_phone} />
              <Row label="Email" value={application.guardian_email} />
              <Row label="Occupation" value={application.guardian_occupation} />
              <Row label="Address" value={application.guardian_address} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Undertaking</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row
                label="Raise concerns via school"
                value={application.agrees_to_school_authority ? 'Agreed' : 'Not agreed'}
              />
              <Row
                label="Rules read & understood"
                value={application.confirms_rules_read ? 'Confirmed' : 'Not confirmed'}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Previous school</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="School" value={application.previous_school} />
              <Row label="Last class" value={application.previous_class} />
              <Row label="Reason for leaving" value={application.reason_for_leaving} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Payment &amp; contact</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Phone" value={application.contact_phone} />
              <Row label="Email" value={application.contact_email} />
              <Row label="Application fee" value={`NGN ${application.fee_amount}`} />
              <Row label="Amount paid" value={application.amount_paid ? `NGN ${application.amount_paid}` : null} />
              <Row label="Paid on" value={showDate(application.paid_at)} />
              <Row label="Submitted" value={showDate(application.submitted_at)} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Decision</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!application.submitted_at ? (
              <p className="text-sm text-muted-foreground">
                This application has not been submitted yet, so there is nothing to
                decide on. Its status is <strong>{application.status_display}</strong>.
              </p>
            ) : (
              <>
                {application.decided_by_name && (
                  <p className="text-xs text-muted-foreground">
                    Last decided by {application.decided_by_name} on{' '}
                    {showDate(application.decided_at)}
                  </p>
                )}

                <Textarea
                  rows={2}
                  placeholder="Internal note (optional)"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />

                <div className="flex flex-wrap gap-2">
                  {DECISIONS.map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={application.status === key ? 'default' : 'outline'}
                      disabled={!!saving}
                      onClick={() => decide(key)}
                    >
                      {saving === key
                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        : <Icon className="h-4 w-4 mr-2" />}
                      {label}
                    </Button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Admitting records the decision only — it does not create a login.
                  When the child arrives, enrol them from the Students page.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-3">
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  );
}
