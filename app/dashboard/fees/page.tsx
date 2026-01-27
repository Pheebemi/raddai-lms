import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { FeesContent } from './fees-content';

export default function FeesPage() {
  return (
    <ProtectedRoute allowedRoles={['student', 'parent']}>
      <AppLayout>
        <FeesContent />
      </AppLayout>
    </ProtectedRoute>
  );
}