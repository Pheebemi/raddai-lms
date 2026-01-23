import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { StaffDashboard } from '@/components/dashboards/staff-dashboard';

export default function StaffDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['staff']}>
      <AppLayout>
        <StaffDashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}