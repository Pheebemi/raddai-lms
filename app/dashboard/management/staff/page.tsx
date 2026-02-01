'use client';

import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { StaffManagementContent } from './staff-content';

export default function StaffManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['management']}>
      <AppLayout>
        <StaffManagementContent />
      </AppLayout>
    </ProtectedRoute>
  );
}