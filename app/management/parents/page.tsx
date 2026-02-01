'use client';

import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { ParentsManagementContent } from './parents-content';

export default function ParentsManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'admin']}>
      <AppLayout>
        <ParentsManagementContent />
      </AppLayout>
    </ProtectedRoute>
  );
}