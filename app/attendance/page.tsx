'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { attendanceApi, usersApi } from '@/lib/api';
import { toast } from 'sonner';
import { Calendar, CheckCircle, XCircle, Clock, FileText, Save, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'Present', color: 'bg-primary/10 text-primary border-primary/30' },
  { value: 'absent', label: 'Absent', color: 'bg-destructive/10 text-destructive border-destructive/30' },
  { value: 'late', label: 'Late', color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400' },
  { value: 'excused', label: 'Excused', color: 'bg-muted text-muted-foreground border-border' },
];

const today = new Date().toISOString().split('T')[0];

export default function AttendancePage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [existingRecords, setExistingRecords] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  // Load students and staff profile on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [studentsData, staffData] = await Promise.all([
          usersApi.getStudents(),
          usersApi.getStaff(),
        ]);
        const currentStaff = staffData.find((s: any) => s.user.id === user?.id);
        setStaffProfile(currentStaff || null);
        setStudents(studentsData);
      } catch {
        toast.error('Failed to load class data');
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  // Load existing attendance when date changes
  useEffect(() => {
    if (!selectedDate || !staffProfile) return;
    const fetchAttendance = async () => {
      setIsLoadingAttendance(true);
      try {
        const records = await attendanceApi.getByDate(selectedDate);
        const statusMap: Record<string, AttendanceStatus> = {};
        const idMap: Record<string, string> = {};
        records.forEach((r: any) => {
          statusMap[r.studentId] = r.status;
          idMap[r.studentId] = r.id;
        });
        setAttendance(statusMap);
        setExistingRecords(idMap);
      } catch {
        setAttendance({});
        setExistingRecords({});
      } finally {
        setIsLoadingAttendance(false);
      }
    };
    fetchAttendance();
  }, [selectedDate, staffProfile]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    students.forEach(s => { all[s.id] = status; });
    setAttendance(all);
  };

  const handleSave = async () => {
    if (!staffProfile?.assignedClassId) {
      toast.error('You are not assigned to a class');
      return;
    }
    if (Object.keys(attendance).length === 0) {
      toast.error('Please mark attendance for at least one student');
      return;
    }

    setIsSaving(true);
    let saved = 0;
    let failed = 0;

    for (const student of students) {
      const status = attendance[student.id];
      if (!status) continue;

      try {
        if (existingRecords[student.id]) {
          await attendanceApi.update(existingRecords[student.id], { status });
        } else {
          const record = await attendanceApi.mark({
            student: parseInt(student.id),
            date: selectedDate,
            status,
            class_period: parseInt(staffProfile.assignedClassId),
          });
          setExistingRecords(prev => ({ ...prev, [student.id]: record.id.toString() }));
        }
        saved++;
      } catch {
        failed++;
      }
    }

    if (failed === 0) {
      toast.success(`Attendance saved for ${saved} student${saved !== 1 ? 's' : ''}`);
    } else {
      toast.warning(`${saved} saved, ${failed} failed`);
    }
    setIsSaving(false);
  };

  // Summary counts
  const counts = Object.values(attendance).reduce((acc, status) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!staffProfile?.assignedClassId) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground">Mark daily attendance for your class</p>
          </div>
          <Card className="border border-border rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">No Class Assigned</h2>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                You have not been assigned as a class teacher. Contact management to get assigned.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground">
              {staffProfile.assignedClasses?.[0] || 'Your class'} · {students.length} students
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0 w-36"
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </div>

        {/* Summary */}
        {Object.keys(attendance).length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {STATUS_OPTIONS.map(({ value, label, color }) => (
              <div key={value} className={`rounded-2xl border p-3 text-center ${color}`}>
                <p className="text-2xl font-bold">{counts[value] || 0}</p>
                <p className="text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick mark all */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mark all:</span>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <Button key={value} size="sm" variant="outline" onClick={() => markAll(value)}>
              {label}
            </Button>
          ))}
        </div>

        {/* Students list */}
        <Card className="border border-border rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedDate === today ? "Today's Attendance" : `Attendance — ${new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`}
              </CardTitle>
              {isLoadingAttendance && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No students in your class</p>
            ) : (
              students.map((student, idx) => {
                const status = attendance[student.id];
                const isRecorded = !!existingRecords[student.id];
                return (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <span className="text-xs text-muted-foreground w-6 text-center">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {student.user.firstName} {student.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{student.studentId}</p>
                    </div>
                    {isRecorded && (
                      <span className="text-xs text-muted-foreground shrink-0">saved</span>
                    )}
                    <div className="flex gap-1.5 shrink-0">
                      {STATUS_OPTIONS.map(({ value, label, color }) => (
                        <button
                          key={value}
                          onClick={() => setStatus(student.id, value)}
                          className={cn(
                            'text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all',
                            status === value
                              ? color
                              : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
