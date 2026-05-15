'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { subjectsApi } from '@/lib/api';
import { toast } from 'sonner';
import { BookOpen, Plus, Trash2, Pencil, Search } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setSubjects(await subjectsApi.getAll());
    } catch {
      toast.error('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', code: '', description: '' });
    setDialogOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setEditTarget(subject);
    setForm({ name: subject.name, code: subject.code, description: subject.description });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Subject name is required'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await subjectsApi.update(editTarget.id, form);
        toast.success('Subject updated');
      } else {
        await subjectsApi.create(form);
        toast.success('Subject created');
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await subjectsApi.delete(id);
      toast.success(`${name} deleted`);
      fetchData();
    } catch {
      toast.error('Failed to delete subject');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Subjects</h1>
            <p className="text-muted-foreground">Manage school subjects</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Subjects grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search ? 'No subjects match your search.' : 'No subjects yet — click Add Subject to get started.'}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(subject => (
              <Card key={subject.id} className="border border-border rounded-2xl hover:shadow-sm transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{subject.name}</CardTitle>
                        {subject.code && (
                          <Badge variant="secondary" className="mt-1 text-xs">{subject.code}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => openEdit(subject)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        disabled={deleting === subject.id}
                        onClick={() => handleDelete(subject.id, subject.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {subject.description && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground">{subject.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Subject count */}
        {!isLoading && subjects.length > 0 && (
          <p className="text-sm text-muted-foreground">{filtered.length} of {subjects.length} subjects</p>
        )}

        {/* Create / Edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editTarget ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Subject Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g. Mathematics"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Code <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  placeholder="e.g. MATH101"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  placeholder="Brief description..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Subject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
