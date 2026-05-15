'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { classesApi, fetchAcademicYears } from '@/lib/api';
import { toast } from 'sonner';
import { GraduationCap, Plus, Trash2, Users } from 'lucide-react';

const CLASS_PRESETS = [
  { label: 'Primary 1', grade: 1 },
  { label: 'Primary 2', grade: 2 },
  { label: 'Primary 3', grade: 3 },
  { label: 'Primary 4', grade: 4 },
  { label: 'Primary 5', grade: 5 },
  { label: 'Primary 6', grade: 6 },
  { label: 'JSS 1', grade: 7 },
  { label: 'JSS 2', grade: 8 },
  { label: 'JSS 3', grade: 9 },
  { label: 'SS 1', grade: 10 },
  { label: 'SS 2', grade: 11 },
  { label: 'SS 3', grade: 12 },
];

export default function ClassManagementPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    classLabel: '',
    grade: '',
    section: '',
    academic_year: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cls, years] = await Promise.all([classesApi.getAll(), fetchAcademicYears()]);
      setClasses(cls);
      setAcademicYears(years);
      if (years.length > 0) {
        const active = years.find((y: any) => y.is_active) || years[0];
        setForm(prev => ({ ...prev, academic_year: active.id.toString() }));
      }
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (label: string, grade: number) => {
    setForm(prev => ({ ...prev, classLabel: label, grade: grade.toString() }));
  };

  const handleCreate = async () => {
    if (!form.classLabel || !form.grade || !form.section || !form.academic_year) {
      toast.error('Fill in all fields');
      return;
    }
    setCreating(true);
    try {
      await classesApi.create({
        name: `${form.classLabel} ${form.section}`,
        grade: parseInt(form.grade),
        section: form.section,
        academic_year: form.academic_year,
      });
      toast.success(`${form.classLabel} ${form.section} created`);
      setDialogOpen(false);
      setForm(prev => ({ ...prev, classLabel: '', grade: '', section: '' }));
      fetchData();
    } catch {
      toast.error('Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await classesApi.delete(id);
      toast.success(`${name} deleted`);
      fetchData();
    } catch {
      toast.error('Failed to delete class');
    } finally {
      setDeleting(null);
    }
  };

  const grouped = CLASS_PRESETS.map(preset => ({
    ...preset,
    classes: classes.filter(c => c.grade === preset.grade),
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Classes</h1>
            <p className="text-muted-foreground">Manage school classes and sections</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Class
          </Button>
        </div>

        {/* Academic year filter */}
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">Academic Year</Label>
          <Select value={form.academic_year} onValueChange={v => setForm(prev => ({ ...prev, academic_year: v }))}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((y: any) => (
                <SelectItem key={y.id} value={y.id.toString()}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{classes.length} total classes</span>
        </div>

        {/* Classes grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grouped.map(({ label, grade, classes: gradeClasses }) => (
            <Card key={grade} className="border border-border rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">{label}</CardTitle>
                  </div>
                  <Badge variant="secondary">Grade {grade}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {gradeClasses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sections yet</p>
                ) : (
                  gradeClasses.map(cls => (
                    <div key={cls.id} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{cls.name}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {cls.studentCount}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={deleting === cls.id}
                        onClick={() => handleDelete(cls.id, cls.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Class</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Class Level</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CLASS_PRESETS.map(({ label, grade }) => (
                    <button
                      key={grade}
                      onClick={() => handlePresetSelect(label, grade)}
                      className={`text-xs px-2 py-2 rounded-xl border transition-all ${
                        form.grade === grade.toString()
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Section</Label>
                <div className="flex gap-2">
                  {['A', 'B', 'C', 'D'].map(s => (
                    <button
                      key={s}
                      onClick={() => setForm(prev => ({ ...prev, section: s }))}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                        form.section === s
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/40'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select value={form.academic_year} onValueChange={v => setForm(prev => ({ ...prev, academic_year: v }))}>
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

              {form.classLabel && form.section && (
                <div className="bg-secondary rounded-xl px-4 py-3 text-sm">
                  Creating: <strong>{form.classLabel} {form.section}</strong>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create Class'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
