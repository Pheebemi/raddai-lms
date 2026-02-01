'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Menu,
  Home,
  Users,
  GraduationCap,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Bell,
  Moon,
  Sun,
  User,
  BookOpen,
  Calendar,
  BarChart3,
  Upload,
  CreditCard,
  Receipt,
  MessageSquare,
  Trophy,
  Heart
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { UserRole, NavItem } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarContentProps {
  navigationItems: NavItem[];
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  setSidebarOpen: (open: boolean) => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ navigationItems, user, setSidebarOpen }) => {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-6 w-6" />
          <span>Raddai Metropolitan School</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          if (item.children) {
            return (
              <div key={item.href} className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {item.title}
                </div>
                <div className="ml-6 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = iconMap[child.icon as keyof typeof iconMap];
                    const isChildActive = pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                          isChildActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <ChildIcon className="h-4 w-4" />
                        {child.title}
                        {child.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {child.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-4 w-4" />
              {item.title}
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.firstName} />
            <AvatarFallback>
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Navigation items for each role
const getNavigationItems = (role: UserRole): NavItem[] => {
  const baseItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: 'Home',
    },
  ];

  const roleSpecificItems: Record<UserRole, NavItem[]> = {
    admin: [
      ...baseItems,
      {
        title: 'Management',
        href: '/management',
        icon: 'Users',
        children: [
          { title: 'Students', href: '/management/students', icon: 'GraduationCap' },
          { title: 'Staff', href: '/management/staff', icon: 'Users' },
          { title: 'Finance', href: '/management/finance', icon: 'DollarSign' },
          { title: 'Analytics', href: '/management/analytics', icon: 'BarChart3' },
        ],
      },
      { title: 'Announcements', href: '/announcements', icon: 'MessageSquare' },
      { title: 'Settings', href: '/settings', icon: 'Settings' },
    ],
    management: [
      ...baseItems,
      {
        title: 'Students',
        href: '/management/students',
        icon: 'GraduationCap',
      },
      {
        title: 'Staff',
        href: '/management/staff',
        icon: 'Users',
      },
      {
        title: 'Parents',
        href: '/management/parents',
        icon: 'Heart',
      },
      {
        title: 'Finance',
        href: '/management/finance',
        icon: 'DollarSign',
      },
      {
        title: 'Analytics',
        href: '/management/analytics',
        icon: 'BarChart3',
      },
      { title: 'Announcements', href: '/announcements', icon: 'MessageSquare' },
      { title: 'Settings', href: '/settings', icon: 'Settings' },
    ],
    staff: [
      ...baseItems,
      { title: 'My Classes', href: '/staff/classes', icon: 'BookOpen' },
      { title: 'Upload Results', href: '/dashboard/results/upload', icon: 'Upload' },
      { title: 'Class Rankings', href: '/dashboard/rankings', icon: 'Trophy' },
      { title: 'Attendance', href: '/attendance', icon: 'Calendar' },
      { title: 'Student Performance', href: '/staff/performance', icon: 'BarChart3' },
      { title: 'Messages', href: '/messages', icon: 'MessageSquare' },
      { title: 'Profile', href: '/profile', icon: 'User' },
    ],
    student: [
      ...baseItems,
      { title: 'My Results', href: '/dashboard/results', icon: 'FileText' },
      { title: 'Class Rankings', href: '/dashboard/rankings', icon: 'Trophy' },
      { title: 'Fees', href: '/dashboard/fees', icon: 'DollarSign' },
      { title: 'Attendance', href: '/attendance', icon: 'Calendar' },
      { title: 'Assignments', href: '/assignments', icon: 'BookOpen' },
      { title: 'Announcements', href: '/announcements', icon: 'MessageSquare' },
      { title: 'Profile', href: '/profile', icon: 'User' },
    ],
    parent: [
      ...baseItems,
      { title: 'Children', href: '/parent/children', icon: 'Users' },
      { title: 'Results', href: '/dashboard/results', icon: 'FileText' },
      { title: 'Class Rankings', href: '/dashboard/rankings', icon: 'Trophy' },
      { title: 'Fees', href: '/dashboard/fees', icon: 'DollarSign' },
      { title: 'Attendance', href: '/attendance', icon: 'Calendar' },
      { title: 'Messages', href: '/messages', icon: 'MessageSquare' },
      { title: 'Profile', href: '/profile', icon: 'User' },
    ],
  };

  return roleSpecificItems[role] || baseItems;
};

// Icon mapping
const iconMap = {
  Home,
  Users,
  GraduationCap,
  DollarSign,
  FileText,
  Settings,
  BookOpen,
  Calendar,
  BarChart3,
  Upload,
  CreditCard,
  Receipt,
  MessageSquare,
  User,
  Trophy,
  Heart,
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const navigationItems = getNavigationItems(user.role);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="h-screen flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r">
        <SidebarContent
          navigationItems={navigationItems}
          user={user}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            navigationItems={navigationItems}
            user={user}
            setSidebarOpen={setSidebarOpen}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:ml-64">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Button variant="outline" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.firstName} />
                    <AvatarFallback>
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <Badge variant="secondary" className="w-fit capitalize">
                      {user.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}