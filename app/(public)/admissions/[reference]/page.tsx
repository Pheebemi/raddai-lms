'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { admissionsApi, Application } from '@/lib/admissions-api';
import { toast } from 'sonner';
import {
  Loader2, Check, CloudOff, CreditCard, Printer, Upload, AlertCircle,
} from 'lucide-react';

const REQUIRED_LABELS: Record<string, string> = {
  gender: 'Gender',
  state_of_origin: 'State of origin',
  lga: 'Local government area',
  home_address: 'Home address',
  guardian_name: "Guardian's name",
  guardian_relationship: 'Relationship to applicant',
  guardian_phone: "Guardian's phone",
  guardian_address: "Guardian's address",
};

type SaveState = 'idle' | 'saving' | 'saved' | 'offline';

/**
 * Step 2 — the full form, only reachable once the fee is paid.
 *
 * Every change is autosaved after a short pause, so a dropped connection
 * costs at most a few seconds of typing rather than the whole form.
 */
export default function ApplicationFormPage() {
  const params = useParams();
  const router = useRouter();
  const reference = String(params.reference);

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [missing, setMissing] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fields, setFields] = useState<Record<string, string>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Record<string, string>>({});

  useEffect(() => {
    admissionsApi.get(reference)
      .then(data => {
        setApplication(data);
        setMissing(data.missing_fields);
        setFields({
          middle_name: data.middle_name || '',
          gender: data.gender || '',
          nationality: data.nationality || 'Nigerian',
          state_of_origin: data.state_of_origin || '',
          lga: data.lga || '',
          religion: data.religion || '',
          home_address: data.home_address || '',
          blood_group: data.blood_group || '',
          genotype: data.genotype || '',
          medical_info: data.medical_info || '',
          previous_school: data.previous_school || '',
          previous_class: data.previous_class || '',
          reason_for_leaving: data.reason_for_leaving || '',
          guardian_name: data.guardian_name || '',
          guardian_relationship: data.guardian_relationship || '',
          guardian_phone: data.guardian_phone || '',
          guardian_email: data.guardian_email || '',
          guardian_occupation: data.guardian_occupation || '',
          guardian_address: data.guardian_address || '',
        });
      })
      .catch(err => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [reference]);

  const flush = useCallback(async () => {
    const payload = pending.current;
    if (Object.keys(payload).length === 0) return;
    pending.current = {};

    setSaveState('saving');
    try {
      const result = await admissionsApi.save(reference, payload);
      setMissing(result.missing_fields);
      setSaveState('saved');
    } catch {
      // Put the changes back so the next attempt picks them up again.
      pending.current = { ...payload, ...pending.current };
      setSaveState('offline');
    }
  }, [reference]);

  const update = (field: string, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
    pending.current[field] = value;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, 900);
  };

  // Retry whatever is still unsaved as soon as the network comes back.
  useEffect(() => {
    const onOnline = () => { void flush(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [flush]);

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await admissionsApi.uploadPhoto(reference, file);
      const refreshed = await admissionsApi.get(reference);
      setApplication(refreshed);
      toast.success('Passport photograph uploaded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await flush();

    setSubmitting(true);
    try {
      await admissionsApi.submit(reference);
      toast.success('Application submitted.');
      router.push(`/admissions/${reference}/print`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading your form…
      </div>
    );
  }

  if (loadError || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-10">
            <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-semibold">We could not open that form</h2>
            <p className="text-sm text-muted-foreground mt-2">{loadError}</p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/admissions/retrieve">Search for my form</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Paid for? If not, the form stays shut and we say so plainly.
  if (!application.paid_at) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-10">
            <CreditCard className="h-6 w-6 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-semibold">Payment not completed</h2>
            <p className="text-sm text-muted-foreground mt-2">
              The application fee for <strong>{application.reference}</strong> has not
              been received yet, so the form is still locked.
            </p>
            <Button asChild className="mt-5">
              <Link href={`/admissions/apply?reference=${application.reference}`}>
                Pay application fee
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already submitted — send them to print rather than let them edit.
  if (application.submitted_at) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-10">
            <Check className="h-6 w-6 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-semibold">Already submitted</h2>
            <p className="text-sm text-muted-foreground mt-2">
              This form was submitted and can no longer be edited.
            </p>
            <Button asChild className="mt-5">
              <Link href={`/admissions/${reference}/print`}>
                <Printer className="h-4 w-4 mr-2" /> Print my form
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveLabel = {
    idle: '',
    saving: 'Saving…',
    saved: 'All changes saved',
    offline: 'Not saved — will retry',
  }[saveState];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Application form</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {application.full_name} · {application.level_display} ·{' '}
              <span className="text-primary font-medium">{application.reference}</span>
            </p>
          </div>
          {saveLabel && (
            <Badge variant={saveState === 'offline' ? 'destructive' : 'secondary'}>
              {saveState === 'saving' && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
              {saveState === 'saved' && <Check className="h-3 w-3 mr-1.5" />}
              {saveState === 'offline' && <CloudOff className="h-3 w-3 mr-1.5" />}
              {saveLabel}
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Passport photograph</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-24 h-28 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                {application.passport_photo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={application.passport_photo} alt="Passport" className="w-full h-full object-cover" />
                  : <span className="text-[10px] text-muted-foreground text-center px-2">No photo yet</span>}
              </div>
              <div>
                <input
                  id="photo" type="file" accept="image/*" className="hidden"
                  onChange={handlePhoto}
                />
                <Button asChild variant="outline" size="sm" disabled={uploading}>
                  <label htmlFor="photo" className="cursor-pointer">
                    {uploading
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
                      : <><Upload className="h-4 w-4 mr-2" /> Upload photo</>}
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  A clear, recent passport photograph.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Applicant details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Middle name" value={fields.middle_name}
                     onChange={v => update('middle_name', v)} />
              <div className="space-y-1.5">
                <Label>Gender <span className="text-destructive">*</span></Label>
                <Select value={fields.gender} onValueChange={v => update('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Nationality" value={fields.nationality}
                     onChange={v => update('nationality', v)} />
              <Field label="Religion" value={fields.religion}
                     onChange={v => update('religion', v)} />
              <Field label="State of origin" required value={fields.state_of_origin}
                     onChange={v => update('state_of_origin', v)} />
              <Field label="Local government area" required value={fields.lga}
                     onChange={v => update('lga', v)} />
              <Field label="Blood group" value={fields.blood_group}
                     onChange={v => update('blood_group', v)} />
              <Field label="Genotype" value={fields.genotype}
                     onChange={v => update('genotype', v)} />
            </div>

            <div className="space-y-1.5">
              <Label>Home address <span className="text-destructive">*</span></Label>
              <Textarea rows={2} value={fields.home_address}
                        onChange={e => update('home_address', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Medical conditions or allergies</Label>
              <Textarea rows={2} value={fields.medical_info}
                        onChange={e => update('medical_info', e.target.value)}
                        placeholder="Leave blank if none" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Previous school</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Name of previous school" value={fields.previous_school}
                     onChange={v => update('previous_school', v)} />
              <Field label="Last class attended" value={fields.previous_class}
                     onChange={v => update('previous_class', v)} />
            </div>
            <div className="space-y-1.5">
              <Label>Reason for leaving</Label>
              <Textarea rows={2} value={fields.reason_for_leaving}
                        onChange={e => update('reason_for_leaving', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Parent or guardian</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full name" required value={fields.guardian_name}
                     onChange={v => update('guardian_name', v)} />
              <Field label="Relationship to applicant" required
                     value={fields.guardian_relationship}
                     onChange={v => update('guardian_relationship', v)}
                     placeholder="Father, Mother, Uncle…" />
              <Field label="Phone number" required value={fields.guardian_phone}
                     onChange={v => update('guardian_phone', v)} />
              <Field label="Email" value={fields.guardian_email}
                     onChange={v => update('guardian_email', v)} />
              <Field label="Occupation" value={fields.guardian_occupation}
                     onChange={v => update('guardian_occupation', v)} />
            </div>
            <div className="space-y-1.5">
              <Label>Address <span className="text-destructive">*</span></Label>
              <Textarea rows={2} value={fields.guardian_address}
                        onChange={e => update('guardian_address', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {missing.length > 0 && (
          <Card className="border-destructive/40">
            <CardContent className="py-4">
              <p className="text-sm font-medium mb-2">
                Still to fill before you can submit:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map(field => (
                  <Badge key={field} variant="secondary">
                    {REQUIRED_LABELS[field] ?? field}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full" size="lg"
          disabled={submitting || missing.length > 0}
          onClick={handleSubmit}
        >
          {submitting
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
            : 'Submit application'}
        </Button>

        <p className="text-xs text-muted-foreground text-center pb-6">
          Your answers save automatically. You can close this page and come back
          with your phone number or email and the date of birth.
        </p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, required, placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
