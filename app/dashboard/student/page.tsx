import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppLayout>
        <StudentDashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}