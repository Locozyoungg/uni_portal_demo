'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Megaphone,
  Vote,
  Palette,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Navigation Configuration ──────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/admin/students', icon: Users },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Semesters', href: '/admin/semesters', icon: Calendar },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { label: 'Elections', href: '/admin/elections', icon: Vote },
  { label: 'Branding', href: '/admin/branding', icon: Palette },
  { label: 'Logs', href: '/admin/logs', icon: ScrollText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

// ── Sidebar Component ─────────────────────────────────────────────────────────

function AdminSidebar({
  isOpen,
  onClose,
  userName,
  userInitials,
  onLogout,
}: {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userInitials: string;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard';
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <nav className="flex h-full flex-col bg-slate-900 border-r border-slate-800">
      {/* Branding Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
          <Shield className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white leading-tight">
            Admin Panel
          </span>
          <span className="text-[10px] text-slate-400 leading-tight">
            KU Demo University
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active && 'text-emerald-400')} />
              <span>{item.label}</span>
              {active && (
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-emerald-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User Info & Logout */}
      <div className="border-t border-slate-800 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-300">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{userName}</p>
            <p className="text-[10px] text-slate-500">Administrator</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start gap-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 shadow-2xl"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Admin Header ──────────────────────────────────────────────────────────────

function AdminHeader({
  onMenuToggle,
  userName,
  userInitials,
  onLogout,
  pageTitle,
}: {
  onMenuToggle: () => void;
  userName: string;
  userInitials: string;
  onLogout: () => void;
  pageTitle: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800"
        onClick={onMenuToggle}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="text-lg font-semibold text-white truncate">
        {pageTitle}
      </h1>

      <div className="flex-1" />

      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/50 border border-slate-700/50">
        <Shield className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs text-slate-400">Admin Mode</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-300">
          {userInitials}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-slate-200">{userName}</p>
        </div>
      </div>
    </header>
  );
}

// ── Page Title Resolver ───────────────────────────────────────────────────────

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/students': 'Students Management',
  '/admin/courses': 'Courses Management',
  '/admin/semesters': 'Semesters',
  '/admin/announcements': 'Announcements',
  '/admin/elections': 'Elections Management',
  '/admin/branding': 'Portal Branding',
  '/admin/logs': 'System Logs',
  '/admin/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  // Try exact match up to /admin/section
  const baseKey = '/' + segments.slice(0, 2).join('/');
  if (pageTitles[baseKey]) return pageTitles[baseKey];
  // Fallback
  const last = segments[segments.length - 1];
  if (last) {
    return last
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return 'Admin';
}

// ── Main Admin Layout ─────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && user.role !== 'ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // ── Loading State ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="w-full max-w-md space-y-4 px-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-slate-800" />
              <Skeleton className="h-3 w-20 bg-slate-800" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Unauthorized ──────────────────────────────────────────────────────────
  if (!isAuthenticated || (user && user.role !== 'ADMIN')) {
    return null;
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const displayName = user?.username || 'Admin';
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'AD';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        userName={displayName}
        userInitials={initials}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <AdminHeader
          onMenuToggle={toggleSidebar}
          userName={displayName}
          userInitials={initials}
          onLogout={handleLogout}
          pageTitle={pageTitle}
        />

        {/* Page Content */}
        <main className="flex-1">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>&copy; {new Date().getFullYear()} KU Demo University. All rights reserved.</span>
            <span>Admin Panel v1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
