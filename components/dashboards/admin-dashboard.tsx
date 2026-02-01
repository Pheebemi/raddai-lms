'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Users,
  Settings,
  Database,
  AlertTriangle,
  CheckCircle,
  Activity,
  Server
} from 'lucide-react';
import { mockUsers, mockStudents, mockStaff } from '@/lib/mock-data';

export function AdminDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  // System stats
  const totalUsers = mockUsers.length;
  const totalStudents = mockStudents.length;
  const totalStaff = mockStaff.length;
  const systemUptime = '99.9%'; // Mock
  const activeUsers = Math.floor(totalUsers * 0.8); // Mock

  // Recent system activities (mock)
  const recentActivities = [
    {
      id: '1',
      action: 'User login',
      user: 'Sarah Johnson',
      timestamp: '2 minutes ago',
      type: 'auth',
    },
    {
      id: '2',
      action: 'Result uploaded',
      user: 'Mike Davis',
      timestamp: '15 minutes ago',
      type: 'academic',
    },
    {
      id: '3',
      action: 'Fee payment processed',
      user: 'Alice Brown',
      timestamp: '1 hour ago',
      type: 'finance',
    },
    {
      id: '4',
      action: 'System backup completed',
      user: 'System',
      timestamp: '6 hours ago',
      type: 'system',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Administration 👑
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage the Raddai Metropolitan School system.
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
          <Button variant="outline">
            <Database className="mr-2 h-4 w-4" />
            Database Backup
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All roles combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemUptime}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Integrity</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Excellent</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Current status of all system components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm text-muted-foreground">All connections healthy</p>
                </div>
              </div>
              <Badge variant="secondary">Operational</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">API Services</p>
                  <p className="text-sm text-muted-foreground">Response time: 45ms</p>
                </div>
              </div>
              <Badge variant="secondary">Operational</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">File Storage</p>
                  <p className="text-sm text-muted-foreground">85% capacity used</p>
                </div>
              </div>
              <Badge variant="secondary">Operational</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Backup System</p>
                  <p className="text-sm text-muted-foreground">Last backup: 6 hours ago</p>
                </div>
              </div>
              <Badge variant="outline">Warning</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    activity.type === 'auth' ? 'bg-blue-500' :
                    activity.type === 'academic' ? 'bg-green-500' :
                    activity.type === 'finance' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      by {activity.user} • {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Overview */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Overview of all user accounts in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{totalStudents}</div>
              <p className="text-sm text-muted-foreground">Students</p>
              <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">{totalStaff}</div>
              <p className="text-sm text-muted-foreground">Staff Members</p>
              <p className="text-xs text-muted-foreground mt-1">Teaching faculty</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {mockUsers.filter(u => u.role === 'parent').length}
              </div>
              <p className="text-sm text-muted-foreground">Parents</p>
              <p className="text-xs text-muted-foreground mt-1">Guardian accounts</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button variant="outline" size="sm">
              <Shield className="mr-2 h-4 w-4" />
              Role Permissions
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              System Config
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Administrative Actions</CardTitle>
          <CardDescription>
            Critical system management functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Database className="h-6 w-6" />
              Database Maintenance
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Shield className="h-6 w-6" />
              Security Audit
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Settings className="h-6 w-6" />
              System Configuration
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Activity className="h-6 w-6" />
              System Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}