'use client';

import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { StaffManagementContent } from '../../dashboard/management/staff/staff-content';

export default function StaffManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'admin']}>
      <AppLayout>
        <StaffManagementContent />
      </AppLayout>
    </ProtectedRoute>
  );
}