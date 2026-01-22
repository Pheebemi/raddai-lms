'use client';

import { useAuth } from '@/contexts/auth-context';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { ManagementDashboard } from '@/components/dashboards/management-dashboard';
import { StaffDashboard } from '@/components/dashboards/staff-dashboard';
import { StudentDashboard } from '@/components/dashboards/student-dashboard';
import { ParentDashboard } from '@/components/dashboards/parent-dashboard';
import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'management':
        return <ManagementDashboard />;
      case 'staff':
        return <StaffDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'parent':
        return <ParentDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        {renderDashboard()}
      </AppLayout>
    </ProtectedRoute>
  );
}