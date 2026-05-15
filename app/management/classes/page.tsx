'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { classesApi, fetchAcademicYears } from '@/lib/api';
import { toast } from 'sonner';
import { GraduationCap, Plus, Trash2, Users, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

const CLASS_PRESETS = [
  { label: 'Nursery 1', grade: -2 },
  { label: 'Nursery 2', grade: -1 },
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

const SECTION_PRESETS = [
  { group: 'Letters', values: ['A', 'B', 'C', 'D', 'E', 'F'] },
  { group: 'Metals', values: ['Gold', 'Silver', 'Bronze', 'Platinum', 'Diamond'] },
  { group: 'Colours', values: ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'] },
  { group: 'Stars', values: ['Star 1', 'Star 2', 'Star 3', 'Star 4', 'Star 5'] },
  { group: 'Numbers', values: ['1', '2', '3', '4', '5', '6'] },
];

export default function ClassManagementPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState('');

  // Multi-select form state
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [customSection, setCustomSection] = useState('');
  const [formYear, setFormYear] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editSection, setEditSection] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cls, years] = await Promise.all([classesApi.getAll(), fetchAcademicYears()]);
      setClasses(cls);
      setAcademicYears(years);
      const active = years.find((y: any) => y.is_active) || years[0];
      if (active) {
        setFilterYear(active.id.toString());
        setFormYear(active.id.toString());
      }
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLevel = (grade: number) => {
    setSelectedLevels(prev =>
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  const toggleSection = (section: string) => {
    setSelectedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const addCustomSection = () => {
    const val = customSection.trim();
    if (!val) return;
    if (!selectedSections.includes(val)) {
      setSelectedSections(prev => [...prev, val]);
    }
    setCustomSection('');
  };

  // Preview: what will be created — label derived from existing classes or preset list
  const preview = selectedLevels.flatMap(grade => {
    const existing = classes.find(c => c.grade === grade);
    const label = existing
      ? existing.name.replace(/\s+\S+$/, '').trim()
      : CLASS_PRESETS.find(p => p.grade === grade)?.label || `Grade ${grade}`;
    return selectedSections.map(section => ({
      name: `${label} ${section}`,
      grade,
      section,
    }));
  });

  const handleCreate = async () => {
    if (selectedLevels.length === 0) { toast.error('Select at least one class level'); return; }
    if (selectedSections.length === 0) { toast.error('Select at least one section'); return; }
    if (!formYear) { toast.error('Select an academic year'); return; }

    setCreating(true);
    let success = 0;
    let skipped = 0;

    for (const item of preview) {
      try {
        await classesApi.create({
          name: item.name,
          grade: item.grade,
          section: item.section,
          academic_year: formYear,
        });
        success++;
      } catch {
        skipped++;
      }
    }

    toast.success(`${success} class${success !== 1 ? 'es' : ''} created${skipped > 0 ? `, ${skipped} already existed` : ''}`);
    setDialogOpen(false);
    setSelectedLevels([]);
    setSelectedSections([]);
    fetchData();
    setCreating(false);
  };

  const openEdit = (cls: any) => {
    setEditTarget(cls);
    setEditName(cls.name);
    setEditSection(cls.section);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget || !editName.trim()) return;
    setSaving(true);
    try {
      await classesApi.update(editTarget.id, {
        name: editName.trim(),
        section: editSection.trim(),
      });
      toast.success('Class updated');
      setEditDialogOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to update class');
    } finally {
      setSaving(false);
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

  const filteredClasses = filterYear
    ? classes.filter(c => c.academicYearId === filterYear)
    : classes;

  // Build groups dynamically from actual classes — works for any grade including custom ones
  const grouped = Array.from(
    filteredClasses.reduce((map, cls) => {
      if (!map.has(cls.grade)) {
        // Derive level label by stripping section from name e.g. "JSS 1 A" → "JSS 1"
        const label = cls.name.replace(/\s+\S+$/, '').trim();
        map.set(cls.grade, { grade: cls.grade, label, classes: [] });
      }
      map.get(cls.grade)!.classes.push(cls);
      return map;
    }, new Map<number, { grade: number; label: string; classes: any[] }>())
  )
    .map(([, group]) => group as { grade: number; label: string; classes: any[] })
    .sort((a, b) => a.grade - b.grade);

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
            Add Classes
          </Button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium shrink-0">Academic Year</Label>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((y: any) => (
                <SelectItem key={y.id} value={y.id.toString()}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{filteredClasses.length} classes</span>
        </div>

        {/* Classes grouped by level */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No classes yet — click Add Classes to get started.
          </div>
        ) : (
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
                    <Badge variant="secondary">{gradeClasses.length} section{gradeClasses.length !== 1 ? 's' : ''}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {gradeClasses.map(cls => (
                    <div key={cls.id} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{cls.name}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {cls.studentCount}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => openEdit(cls)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
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
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Classes</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-2">

              {/* Class levels - multi select */}
              <div className="space-y-2">
                <Label>Class Levels <span className="text-muted-foreground text-xs">(select multiple)</span></Label>
                <div className="grid grid-cols-4 gap-2">
                  {CLASS_PRESETS.map(({ label, grade }) => (
                    <button
                      key={grade}
                      onClick={() => toggleLevel(grade)}
                      className={cn(
                        'text-xs px-2 py-2 rounded-xl border transition-all text-left',
                        selectedLevels.includes(grade)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/40'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {selectedLevels.length > 0 && (
                  <button onClick={() => setSelectedLevels([])} className="text-xs text-muted-foreground hover:text-foreground">
                    Clear selection
                  </button>
                )}
              </div>

              {/* Sections */}
              <div className="space-y-3">
                <Label>Sections <span className="text-muted-foreground text-xs">(select multiple or add custom)</span></Label>

                {SECTION_PRESETS.map(group => (
                  <div key={group.group} className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{group.group}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.values.map(s => (
                        <button
                          key={s}
                          onClick={() => toggleSection(s)}
                          className={cn(
                            'text-xs px-3 py-1.5 rounded-full border transition-all',
                            selectedSections.includes(s)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:border-primary/40'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Custom section */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Custom section name..."
                    value={customSection}
                    onChange={e => setCustomSection(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomSection()}
                    className="text-sm"
                  />
                  <Button variant="outline" size="sm" onClick={addCustomSection}>Add</Button>
                </div>

                {/* Selected sections display */}
                {selectedSections.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedSections.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                        {s}
                        <button onClick={() => toggleSection(s)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Academic year */}
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select value={formYear} onValueChange={setFormYear}>
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

              {/* Preview */}
              {preview.length > 0 && (
                <div className="bg-muted rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-medium">Creating {preview.length} class{preview.length !== 1 ? 'es' : ''}:</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.map(p => (
                      <span key={`${p.grade}-${p.section}`} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || preview.length === 0}>
                {creating ? 'Creating...' : `Create ${preview.length > 0 ? preview.length : ''} Class${preview.length !== 1 ? 'es' : ''}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Edit dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. JSS 1 Gold"
                />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input
                  value={editSection}
                  onChange={e => setEditSection(e.target.value)}
                  placeholder="e.g. Gold, A, Silver"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {['A','B','C','Gold','Silver','Bronze','Red','Blue','Green'].map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setEditSection(s);
                        setEditName(`${editTarget?.name?.split(' ').slice(0, -1).join(' ')} ${s}`);
                      }}
                      className="text-xs px-2 py-1 rounded-full border border-border hover:border-primary/40 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
