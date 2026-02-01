'use client';

import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { FinanceManagementContent } from './finance-content';

export default function FinanceManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['management', 'admin']}>
      <AppLayout>
        <FinanceManagementContent />
      </AppLayout>
    </ProtectedRoute>
  );
}