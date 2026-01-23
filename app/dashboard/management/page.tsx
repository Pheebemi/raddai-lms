import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { ManagementDashboard } from '@/components/dashboards/management-dashboard';

export default function ManagementDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['management']}>
      <AppLayout>
        <ManagementDashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}