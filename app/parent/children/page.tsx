'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { usersApi, feesApi, resultsApi } from '@/lib/api';
import { toast } from 'sonner';
import { GraduationCap, DollarSign, FileText, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function ParentChildrenPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [parents, paymentsData, resultsData] = await Promise.all([
          usersApi.getParents(),
          feesApi.getPayments(),
          resultsApi.getList(),
        ]);
        const me = parents.find((p: any) => p.user.id === user?.id);
        setChildren(me?.children || []);
        setPayments(paymentsData);
        setResults(resultsData);
      } catch {
        toast.error('Failed to load children data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">My Children</h1>
            <p className="text-muted-foreground">Overview of your children's academic progress</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse border border-border rounded-2xl">
                <CardHeader><div className="h-6 bg-muted rounded w-1/2" /></CardHeader>
                <CardContent><div className="space-y-2"><div className="h-4 bg-muted rounded" /><div className="h-4 bg-muted rounded w-3/4" /></div></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (children.length === 0) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">My Children</h1>
            <p className="text-muted-foreground">Overview of your children's academic progress</p>
          </div>
          <Card className="border border-border rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">No Child Attached Yet</h2>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                No children have been linked to your account yet. Please contact the school administration.
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
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Children</h1>
          <p className="text-muted-foreground">Overview of your children's academic progress</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {children.map((child: any) => {
            const childPayments = payments.filter(p => p.studentId === child.id);
            const childResults = results.filter(r => r.studentId === child.id);

            const paidTerms = ['first', 'second', 'third'].filter(term =>
              childPayments.some(p => p.term === term && p.status === 'paid')
            );

            const latestResult = childResults.sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];

            const totalSubjects = childResults.length;
            const avgPercentage = totalSubjects > 0
              ? Math.round(childResults.reduce((s, r) => s + r.percentage, 0) / totalSubjects)
              : null;

            return (
              <Card key={child.id} className="border border-border rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {child.user.firstName} {child.user.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {child.studentId} · {child.class || 'No class assigned'}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">

                  {/* Fee Status */}
                  <div className="bg-muted rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Fee Payment Status
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['first', 'second', 'third'].map(term => {
                        const paid = paidTerms.includes(term);
                        const payment = childPayments.find(p => p.term === term);
                        return (
                          <div key={term} className={`rounded-lg p-2 text-center text-xs ${paid ? 'bg-primary/10' : 'bg-background'}`}>
                            <div className="mb-1">
                              {paid
                                ? <CheckCircle className="h-3.5 w-3.5 text-primary mx-auto" />
                                : payment?.status === 'partial'
                                ? <Clock className="h-3.5 w-3.5 text-amber-500 mx-auto" />
                                : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                              }
                            </div>
                            <p className="capitalize font-medium">{term}</p>
                            <p className={`text-xs ${paid ? 'text-primary' : 'text-muted-foreground'}`}>
                              {paid ? 'Paid' : payment?.status === 'partial' ? 'Partial' : 'Unpaid'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Academic Summary */}
                  <div className="bg-muted rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-primary" />
                      Academic Summary
                    </div>
                    {childResults.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No results uploaded yet</p>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{avgPercentage}%</p>
                          <p className="text-xs text-muted-foreground">Average</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{totalSubjects}</p>
                          <p className="text-xs text-muted-foreground">Results</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{latestResult?.grade || '—'}</p>
                          <p className="text-xs text-muted-foreground">Latest Grade</p>
                        </div>
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
