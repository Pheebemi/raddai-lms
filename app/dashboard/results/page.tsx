import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { ResultsContent } from './results-content';

export default function ResultsPage() {
  return (
    <ProtectedRoute allowedRoles={['student', 'parent']}>
      <AppLayout>
        <ResultsContent />
      </AppLayout>
    </ProtectedRoute>
  );
}