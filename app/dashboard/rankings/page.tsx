import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { RankingsContent } from './rankings-content';

export default function RankingsPage() {
  return (
    <ProtectedRoute allowedRoles={['staff', 'student', 'parent']}>
      <AppLayout>
        <RankingsContent />
      </AppLayout>
    </ProtectedRoute>
  );
}