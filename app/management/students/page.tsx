'use client';

import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { StudentsManagementContent } from '../../dashboard/management/students/students-content';

export default function StudentsManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'admin']}>
      <AppLayout>
        <StudentsManagementContent />
      </AppLayout>
    </ProtectedRoute>
  );
}