'use client';

import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { StudentsManagementContent } from './students-content';

export default function StudentsManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['management']}>
      <AppLayout>
        <StudentsManagementContent />
      </AppLayout>
    </ProtectedRoute>
  );
}