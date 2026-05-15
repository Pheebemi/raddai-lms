'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { fetchAcademicYears, toggleResultsVisibility } from '@/lib/api';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

const TERMS = [
  { key: 'first_term_visible' as const, term: 'first' as const, label: 'First Term' },
  { key: 'second_term_visible' as const, term: 'second' as const, label: 'Second Term' },
  { key: 'third_term_visible' as const, term: 'third' as const, label: 'Third Term' },
];

export default function ResultsVisibilityPage() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [visibility, setVisibility] = useState({
    first_term_visible: false,
    second_term_visible: false,
    third_term_visible: false,
  });
  const [toggling, setToggling] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAcademicYears().then(years => {
      setAcademicYears(years);
      const active = years.find((y: any) => y.is_active) || years[0];
      if (active) {
        setSelectedYearId(active.id.toString());
        setVisibility({
          first_term_visible: active.first_term_visible ?? false,
          second_term_visible: active.second_term_visible ?? false,
          third_term_visible: active.third_term_visible ?? false,
        });
      }
    }).finally(() => setIsLoading(false));
  }, []);

  const handleYearChange = (id: string) => {
    setSelectedYearId(id);
    const year = academicYears.find((y: any) => y.id.toString() === id);
    if (year) {
      setVisibility({
        first_term_visible: year.first_term_visible ?? false,
        second_term_visible: year.second_term_visible ?? false,
        third_term_visible: year.third_term_visible ?? false,
      });
    }
  };

  const handleToggle = async (key: keyof typeof visibility, term: 'first' | 'second' | 'third', label: string) => {
    if (!selectedYearId) return;
    setToggling(term);
    try {
      const res = await toggleResultsVisibility(selectedYearId, !visibility[key], term);
      setVisibility(prev => ({ ...prev, [key]: res[key] }));
      toast.success(`${label} results ${res[key] ? 'visible' : 'hidden'} for students`);
    } catch {
      toast.error('Failed to update');
    } finally {
      setToggling(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Results Visibility</h1>
          <p className="text-muted-foreground">Control which term results students can view</p>
        </div>

        {/* Academic year selector */}
        <div className="flex items-center gap-3 max-w-sm">
          <Label className="shrink-0">Academic Year</Label>
          <Select value={selectedYearId} onValueChange={handleYearChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((y: any) => (
                <SelectItem key={y.id} value={y.id.toString()}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Term toggles */}
        <Card className="border border-border rounded-2xl max-w-2xl">
          <CardHeader>
            <CardTitle>Term Result Visibility</CardTitle>
            <CardDescription>
              Students with paid fees can only see results for terms you enable here. Teachers and management always see all results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              TERMS.map(({ key, term, label }) => {
                const visible = visibility[key];
                return (
                  <div key={term} className="flex items-center justify-between p-4 bg-muted rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${visible ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      <span className="font-medium">{label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        visible ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground'
                      }`}>
                        {visible ? 'Visible to students' : 'Hidden'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={visible ? 'outline' : 'default'}
                      disabled={toggling === term}
                      onClick={() => handleToggle(key, term, label)}
                    >
                      {toggling === term ? 'Updating...' : visible
                        ? <><EyeOff className="h-3.5 w-3.5 mr-1.5" />Hide</>
                        : <><Eye className="h-3.5 w-3.5 mr-1.5" />Show</>
                      }
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground max-w-2xl">
          Changes take effect immediately. Students will see the locked screen if no terms are enabled, or only the enabled term results if partially released.
        </p>
      </div>
    </AppLayout>
  );
}
