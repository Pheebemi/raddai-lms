'use client';

import ProtectedRoute from '@/components/protected-route';
import AppLayout from '@/components/app-layout';
import { AnnouncementsContent } from './announcements-content';

export default function AnnouncementsPage() {
  return (
    <ProtectedRoute allowedRoles={['student', 'staff', 'parent', 'management', 'admin']}>
      <AppLayout>
        <AnnouncementsContent />
      </AppLayout>
    </ProtectedRoute>
  );
}