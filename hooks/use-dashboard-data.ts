import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { dashboardApi, announcementsApi, resultsApi, feesApi, usersApi, handleApiError } from '@/lib/api';
import { DashboardStats, Announcement, Result, FeeTransaction, Student } from '@/types';

export function useDashboardData() {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [feeTransactions, setFeeTransactions] = useState<FeeTransaction[]>([]);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch data based on user role
        let studentsData: Student[] = [];

        const promises = [
          dashboardApi.getStats().catch(() => ({})),
          announcementsApi.getList().catch(() => []),
          resultsApi.getList().catch(() => []),
          feesApi.getPayments().catch(() => []),
        ];

        // Add student profile fetch for students
        if (user.role === 'student') {
          promises.push(usersApi.getStudents().catch(() => []));
        }

        const allResults = await Promise.all(promises);

        const statsData = allResults[0];
        const announcementsData = allResults[1];
        const resultsData = allResults[2];
        const feesData = allResults[3];

        // Get students data if it was fetched
        if (user.role === 'student' && allResults.length > 4) {
          studentsData = allResults[4] as Student[];
        }

        setDashboardStats(statsData);
        setAnnouncements(announcementsData);
        setResults(resultsData);
        setFeeTransactions(feesData);

        // Set student profile if available
        if (user.role === 'student' && studentsData.length > 0) {
          const studentProfile = studentsData.find(s => s.user.id === user.id);
          setStudentProfile(studentProfile || null);
        }
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return {
    dashboardStats,
    announcements,
    results,
    feeTransactions,
    studentProfile,
    isLoading,
    error,
  };
}