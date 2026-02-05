import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { ResultsExportContent } from './results-export-content';

export default function ResultsExportPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'admin']}>
      <AppLayout>
        <ResultsExportContent />
      </AppLayout>
    </ProtectedRoute>
  );
}