import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { SalaryManagementContent } from './salary-content';

export default function SalaryManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'admin']}>
      <AppLayout>
        <SalaryManagementContent />
      </AppLayout>
    </ProtectedRoute>
  );
}