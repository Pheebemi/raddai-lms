'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { admissionsManagementApi, AdmissionSetting } from '@/lib/admissions-api';
import { fetchAcademicYears } from '@/lib/api';
import { CLASS_LEVELS } from '@/lib/class-levels';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, DoorOpen, DoorClosed } from 'lucide-react';

/**
 * Admission window and the fee for each class.
 *
 * A level with no fee simply is not offered — that is how you restrict intake
 * to particular classes without any extra switch.
 */
export default function AdmissionSettingsPage() {
  const [setting, setSetting] = useState<AdmissionSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFees, setSavingFees] = useState(false);

  const [instructions, setInstructions] = useState('');
  const [closesOn, setClosesOn] = useState('');
  const [fees, setFees] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const existing = await admissionsManagementApi.settings();
        const years = await fetchAcademicYears();
        const activeYear = years.find((year: { is_active: boolean }) => year.is_active);

        let current = existing.find(s => s.academic_year === activeYear?.id) ?? existing[0];

        // No window for the active session yet — create a closed one to edit.
        if (!current && activeYear) {
          current = await admissionsManagementApi.createSetting(activeYear.id);
        }

        if (current) {
          setSetting(current);
          setInstructions(current.instructions || '');
          setClosesOn(current.closes_on || '');
          setFees(Object.fromEntries(
            current.fees.map(fee => [fee.level, String(Number(fee.amount))]),
          ));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load settings.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const saveDetails = async (overrides: Partial<AdmissionSetting> = {}) => {
    if (!setting) return;
    setSaving(true);
    try {
      const updated = await admissionsManagementApi.updateSetting(setting.id, {
        instructions,
        closes_on: closesOn || null,
        ...overrides,
      });
      setSetting(updated);
      toast.success('Saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const saveFees = async () => {
    if (!setting) return;
    setSavingFees(true);
    try {
      const payload = Object.entries(fees)
        .filter(([, amount]) => amount !== '' && Number(amount) >= 0)
        .map(([level, amount]) => ({ level: Number(level), amount: Number(amount) }));

      const updated = await admissionsManagementApi.replaceFees(setting.id, payload);
      setSetting(updated);
      toast.success(`${payload.length} class${payload.length === 1 ? '' : 'es'} open for application.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save fees.');
    } finally {
      setSavingFees(false);
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

  if (!setting) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="font-medium">No active academic year</p>
          <p className="text-sm text-muted-foreground mt-1">
            Set an academic year as active before opening admissions.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/management/academic-years">Academic years</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-5 max-w-3xl">
        <Link
          href="/management/admissions"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Admissions
        </Link>

        <div>
          <h1 className="text-2xl font-bold">Admission settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Session {setting.academic_year_name}
          </p>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-5 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">
                  Applications are {setting.accepting_applications ? 'open' : 'closed'}
                </p>
                <Badge variant={setting.accepting_applications ? 'default' : 'secondary'}>
                  {setting.accepting_applications ? 'Live' : 'Off'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {setting.accepting_applications
                  ? 'Anyone can start an application on the public site.'
                  : 'The public page shows a closed notice. Existing forms stay reachable.'}
              </p>
            </div>
            <Button
              disabled={saving}
              variant={setting.is_open ? 'outline' : 'default'}
              onClick={() => saveDetails({ is_open: !setting.is_open })}
            >
              {saving
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : setting.is_open
                  ? <DoorClosed className="h-4 w-4 mr-2" />
                  : <DoorOpen className="h-4 w-4 mr-2" />}
              {setting.is_open ? 'Close admissions' : 'Open admissions'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Public page</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="closes">Closing date (optional)</Label>
              <Input
                id="closes" type="date" value={closesOn}
                onChange={e => setClosesOn(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                After this date new applications stop automatically.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instructions">Instructions for applicants</Label>
              <Textarea
                id="instructions" rows={4} value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="Documents to bring, entrance exam dates, who to call…"
              />
            </div>

            <Button onClick={() => saveDetails()} disabled={saving}>
              {saving
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                : <><Save className="h-4 w-4 mr-2" /> Save</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application fee by class</CardTitle>
            <p className="text-sm text-muted-foreground">
              Leave a class blank to stop accepting applications for it.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CLASS_LEVELS.map(level => (
                <div key={level.grade} className="flex items-center gap-3">
                  <Label className="w-28 shrink-0 text-sm font-normal">
                    {level.label}
                  </Label>
                  <Input
                    type="number" min="0" placeholder="—"
                    value={fees[level.grade] ?? ''}
                    onChange={e => setFees(prev => ({
                      ...prev, [level.grade]: e.target.value,
                    }))}
                  />
                </div>
              ))}
            </div>

            <Button onClick={saveFees} disabled={savingFees}>
              {savingFees
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                : <><Save className="h-4 w-4 mr-2" /> Save fees</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
