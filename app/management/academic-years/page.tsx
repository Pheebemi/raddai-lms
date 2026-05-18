'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { academicYearsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, CheckCircle, Calendar } from 'lucide-react';

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AcademicYear | null>(null);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await academicYearsApi.getAll();
      setYears(data);
    } catch {
      toast.error('Failed to load academic years');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', start_date: '', end_date: '' });
    setDialogOpen(true);
  };

  const openEdit = (year: AcademicYear) => {
    setEditTarget(year);
    setForm({ name: year.name, start_date: year.start_date, end_date: year.end_date });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await academicYearsApi.update(editTarget.id, form);
        toast.success('Academic year updated');
      } else {
        await academicYearsApi.create(form);
        toast.success('Academic year created');
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to save academic year');
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (year: AcademicYear) => {
    if (year.is_active) return;
    if (!confirm(`Set "${year.name}" as the active academic year? This will deactivate the current one.`)) return;
    setActivating(year.id);
    try {
      await academicYearsApi.setActive(year.id);
      toast.success(`${year.name} is now the active academic year`);
      fetchData();
    } catch {
      toast.error('Failed to set active year');
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async (year: AcademicYear) => {
    if (year.is_active) {
      toast.error('Cannot delete the active academic year');
      return;
    }
    if (!confirm(`Delete "${year.name}"? All classes and data linked to this year will be affected.`)) return;
    setDeleting(year.id);
    try {
      await academicYearsApi.delete(year.id);
      toast.success('Academic year deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete academic year');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Academic Years</h1>
            <p className="text-muted-foreground">Manage school academic years and set the active session</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Academic Year
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : years.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No academic years yet — click New Academic Year to create one.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {years.map(year => (
              <Card key={year.id} className={`border rounded-2xl transition-all ${year.is_active ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{year.name}</CardTitle>
                        {year.is_active && (
                          <Badge className="mt-1 text-xs bg-primary/10 text-primary border-0">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(year)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" disabled={deleting === year.id || year.is_active} onClick={() => handleDelete(year)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Start</span>
                      <span className="font-medium text-foreground">{new Date(year.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End</span>
                      <span className="font-medium text-foreground">{new Date(year.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {!year.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={activating === year.id}
                      onClick={() => handleSetActive(year)}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      {activating === year.id ? 'Setting...' : 'Set as Active'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create / Edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editTarget ? 'Edit Academic Year' : 'New Academic Year'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g. 2025/2026"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
