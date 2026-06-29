'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/profile': 'My Profile',
  '/dashboard/academics/registration': 'Course Registration',
  '/dashboard/academics/registered-units': 'My Units',
  '/dashboard/academics/results': 'Exam Results',
  '/dashboard/academics/transcript': 'Academic Transcript',
  '/dashboard/academics/exam-card': 'Exam Card',
  '/dashboard/academics/attendance': 'Attendance Record',
  '/dashboard/academics/cgpa': 'CGPA Overview',
  '/dashboard/finance': 'Finance',
  '/dashboard/finance/statement': 'Financial Statement',
  '/dashboard/finance/payments': 'Payment History',
  '/dashboard/finance/invoices': 'Invoices',
  '/dashboard/finance/scholarships': 'Scholarships',
  '/dashboard/library': 'Library',
  '/dashboard/library/borrowed': 'Borrowed Books',
  '/dashboard/library/fines': 'Library Fines',
  '/dashboard/library/resources': 'E-Resources',
  '/dashboard/hostel': 'Hostel',
  '/dashboard/hostel/allocation': 'Hostel Allocation',
  '/dashboard/hostel/maintenance': 'Maintenance Requests',
  '/dashboard/hostel/payments': 'Hostel Payments',
  '/dashboard/services': 'Student Services',
  '/dashboard/services/leave': 'Leave Application',
  '/dashboard/services/clearance': 'Clearance',
  '/dashboard/services/appointments': 'Appointments',
  '/dashboard/elections': 'Student Elections',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/messages': 'Messages',
  '/dashboard/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Prefix match for nested routes
  const matchedKey = Object.keys(pageTitles)
    .filter((k) => k !== '/dashboard')
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname.startsWith(k));
  if (matchedKey) return pageTitles[matchedKey];
  // Fallback: format the last segment
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (last) {
    return last
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return 'Dashboard';
}

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');

  const pageTitle = getPageTitle(pathname);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const displayName = user?.student
    ? `${user.student.firstName} ${user.student.lastName}`
    : user?.username || 'User';

  const initials = user?.student
    ? getInitials(user.student.firstName, user.student.lastName)
    : user?.username?.slice(0, 2).toUpperCase() || 'U';

  const roleLabel =
    user?.role === 'STUDENT'
      ? 'Student'
      : user?.role === 'ADMIN'
        ? 'Administrator'
        : user?.role === 'STAFF'
          ? 'Staff'
          : 'User';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuToggle}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page Title */}
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white hidden sm:block">
        {pageTitle}
      </h1>

      {/* Mobile Page Title (shorter) */}
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white sm:hidden truncate">
        {pageTitle}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          aria-label="Search"
        />
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
        >
          3
        </Badge>
      </Button>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2"
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1e3a5f&color=d4a843`}
                alt={displayName}
              />
              <AvatarFallback className="text-xs bg-ku-navy text-ku-gold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                {roleLabel}
              </span>
            </div>
            <ChevronDown className="hidden lg:block h-4 w-4 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || `${user?.student?.admissionNumber || ''}`}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
