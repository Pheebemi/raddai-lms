import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppLayout>
        <AdminDashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}