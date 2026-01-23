import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { ParentDashboard } from '@/components/dashboards/parent-dashboard';

export default function ParentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['parent']}>
      <AppLayout>
        <ParentDashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}