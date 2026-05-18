'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Users, DollarSign, FileText, MessageSquare,
  GraduationCap, CheckCircle, Clock, AlertCircle, ArrowRight, Bell,
} from 'lucide-react';
import { usersApi, feesApi, resultsApi, announcementsApi } from '@/lib/api';
import { toast } from 'sonner';

export function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [parents, paymentsData, resultsData, announcementsData] = await Promise.all([
          usersApi.getParents(),
          feesApi.getPayments(),
          resultsApi.getList(),
          announcementsApi.getList().catch(() => []),
        ]);
        const me = parents.find((p: any) => p.user.id === user.id);
        setChildren(me?.children || []);
        setPayments(paymentsData);
        setResults(resultsData);
        setAnnouncements(announcementsData.slice(0, 3));
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-64 mt-2 animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1,2,3].map(i => <Card key={i} className="animate-pulse h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // Summary stats
  const totalChildren = children.length;
  const totalPendingFees = payments
    .filter(p => p.status === 'pending' || p.status === 'partial' || p.status === 'overdue')
    .reduce((sum, p) => sum + ((p.totalAmount ?? p.amount) - p.amount), 0);
  const totalPaidFees = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const getChildSummary = (childId: string) => {
    const childPayments = payments.filter(p => p.studentId === childId);
    const childResults = results.filter(r => r.studentId === childId);
    const paidTerms = ['first', 'second', 'third'].filter(term =>
      childPayments.some(p => p.term === term && p.status === 'paid')
    );
    const avgPercentage = childResults.length > 0
      ? Math.round(childResults.reduce((s, r) => s + r.percentage, 0) / childResults.length)
      : null;
    return { paidTerms, avgPercentage, resultCount: childResults.length };
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome, {user.firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your {totalChildren > 1 ? 'children' : 'child'}'s progress
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChildren}</div>
            <p className="text-xs text-muted-foreground">Enrolled in school</p>
          </CardContent>
        </Card>

        <Card className="border border-border rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fees Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₦{totalPaidFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all children</p>
          </CardContent>
        </Card>

        <Card className="border border-border rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPendingFees > 0 ? 'text-destructive' : 'text-primary'}`}>
              ₦{totalPendingFees.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>
      </div>

      {/* No children state */}
      {totalChildren === 0 && (
        <Card className="border border-border rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">No Child Attached Yet</h2>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              No children have been linked to your account. Contact the school administration.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Children cards */}
      {totalChildren > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">My Children</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {children.map((child: any) => {
              const { paidTerms, avgPercentage, resultCount } = getChildSummary(child.id);
              return (
                <Card key={child.id} className="border border-border rounded-2xl hover:shadow-sm transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                          {child.user.firstName} {child.user.lastName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {child.studentId} · {child.class || 'No class'}
                        </p>
                      </div>
                      {avgPercentage !== null && (
                        <Badge variant="secondary" className="shrink-0">{avgPercentage}% avg</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Fee status */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {['first', 'second', 'third'].map(term => {
                        const paid = paidTerms.includes(term);
                        return (
                          <div key={term} className={`rounded-xl p-2 text-center text-xs ${paid ? 'bg-primary/10' : 'bg-muted'}`}>
                            {paid
                              ? <CheckCircle className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                              : <Clock className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
                            }
                            <p className="capitalize font-medium leading-none">{term}</p>
                            <p className={`text-xs mt-0.5 ${paid ? 'text-primary' : 'text-muted-foreground'}`}>
                              {paid ? 'Paid' : 'Unpaid'}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Results count */}
                    <div className="flex items-center justify-between text-sm bg-muted rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        Results uploaded
                      </div>
                      <span className="font-medium">{resultCount}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links + Announcements */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-border rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'View Results', href: '/dashboard/results', icon: FileText },
              { label: 'Pay Fees', href: '/dashboard/fees', icon: DollarSign },
              { label: 'My Children', href: '/parent/children', icon: Users },
              { label: 'Announcements', href: '/announcements', icon: MessageSquare },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Announcements</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No announcements</p>
            ) : (
              announcements.map((a: any) => (
                <div key={a.id} className="flex gap-3 p-3 bg-muted rounded-xl">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    a.priority === 'urgent' || a.priority === 'high' ? 'bg-destructive' :
                    a.priority === 'medium' ? 'bg-accent-foreground' : 'bg-primary'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
