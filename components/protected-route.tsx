'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      if (isAuthenticated && allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Authenticated but doesn't have required role, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      if (!requireAuth && isAuthenticated) {
        // Route doesn't require auth but user is authenticated, redirect to dashboard
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, requireAuth, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and route doesn't require auth, show children
  if (!requireAuth && !isAuthenticated) {
    return <>{children}</>;
  }

  // If authenticated and has required role (or no role restriction), show children
  if (isAuthenticated && (!allowedRoles || (user && allowedRoles.includes(user.role)))) {
    return <>{children}</>;
  }

  // Show nothing while redirecting
  return null;
}