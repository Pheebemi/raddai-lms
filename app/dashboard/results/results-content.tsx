'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, TrendingUp, Calendar, Download, Filter } from 'lucide-react';
import { resultsApi, announcementsApi, handleApiError } from '@/lib/api';
import { Result } from '@/types';
import { toast } from 'sonner';

export function ResultsContent() {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await resultsApi.getList();
        setResults(data);
        setFilteredResults(data);
      } catch (error) {
        toast.error(handleApiError(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, []);

  useEffect(() => {
    let filtered = results;

    if (selectedTerm !== 'all') {
      filtered = filtered.filter(result => result.term === selectedTerm);
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(result => result.academicYear === selectedYear);
    }

    setFilteredResults(filtered);
  }, [results, selectedTerm, selectedYear]);

  // Group results by term
  const resultsByTerm = filteredResults.reduce((acc, result) => {
    if (!acc[result.term]) {
      acc[result.term] = [];
    }
    acc[result.term].push(result);
    return acc;
  }, {} as Record<string, Result[]>);

  // Get unique terms and years for filters
  const availableTerms = Array.from(new Set(results.map(r => r.term)));
  const availableYears = Array.from(new Set(results.map(r => r.academicYear)));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Results</h1>
            <p className="text-muted-foreground">View your academic performance</p>
          </div>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Results</h1>
          <p className="text-muted-foreground">View your academic performance across all subjects</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {availableTerms.map(term => (
                    <SelectItem key={term} value={term}>{term}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results by Term */}
      <div className="space-y-6">
        {Object.keys(resultsByTerm).length > 0 ? (
          Object.entries(resultsByTerm).map(([term, termResults]) => (
            <div key={term} className="space-y-2">
              <h2 className="text-2xl font-bold">{term} - {termResults[0]?.academicYear}</h2>
              <Card>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">CA1</TableHead>
                        <TableHead className="text-center">CA2</TableHead>
                        <TableHead className="text-center">CA3</TableHead>
                        <TableHead className="text-center">CA4</TableHead>
                        <TableHead className="text-center">Exam</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {termResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">
                            {result.subject_name || result.subjectId}
                          </TableCell>
                          <TableCell className="text-center">{result.ca1_score}</TableCell>
                          <TableCell className="text-center">{result.ca2_score}</TableCell>
                          <TableCell className="text-center">{result.ca3_score}</TableCell>
                          <TableCell className="text-center">{result.ca4_score}</TableCell>
                          <TableCell className="text-center">{result.exam_score}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={
                              result.grade.startsWith('A') ? 'default' :
                              result.grade.startsWith('B') ? 'secondary' : 'outline'
                            }>
                              {result.grade}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  {selectedTerm !== 'all' || selectedYear !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Your academic results will appear here once they are published.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}