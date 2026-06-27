'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  DollarSign,
  Vote,
  Book,
  Home,
  Calendar,
  Bell,
  Megaphone,
  ChevronRight,
  BookMarked,
  FileText,
  BarChart3,
  CreditCard,
  Library,
  ScrollText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn, formatCurrency, formatDate, timeAgo, getStatusColor, getInitials } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────

interface DashboardData {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    programme: { name: string };
    yearOfStudy: number;
    currentSemester: { name: string; year: number };
    semesterRegistrationStatus: string;
    gpa: number;
    cgpa: number;
    academicStanding: string;
  };
  registeredUnits: number;
  outstandingFees: number;
  feeStatus: string;
  activeElections: number;
  borrowedBooks: number;
  overdueBooks: number;
  hostelStatus: string;
  hostelRoom: string;
  upcomingEvents: number;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    createdAt: string;
  }>;
  recentNotifications: Array<{
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    date: string;
    description: string;
  }>;
  gpaHistory: Array<{
    semester: string;
    gpa: number;
  }>;
}

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const statCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: React.ReactNode;
  color: string;
  href?: string;
}) {
  const content = (
    <motion.div variants={statCardVariants}>
      <Card className="group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className={cn('rounded-lg p-3', color)}>
              <Icon className="h-5 w-5" />
            </div>
            {href && (
              <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-ku-gold" />
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-ku-navy">{value}</p>
            {subtext && <div className="mt-1">{subtext}</div>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// ── Skeleton Cards ──────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <Megaphone className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load dashboard</h3>
      <p className="mt-1 text-sm text-gray-500">
        Something went wrong while fetching your data. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Quick Links ────────────────────────────────────────────────────────────

const quickLinks = [
  { label: 'Timetable', icon: BookMarked, href: '/timetable', color: 'bg-blue-50 text-blue-600' },
  { label: 'Exam Card', icon: ScrollText, href: '/exam-card', color: 'bg-purple-50 text-purple-600' },
  { label: 'Results', icon: BarChart3, href: '/results', color: 'bg-green-50 text-green-600' },
  { label: 'Fee Balance', icon: CreditCard, href: '/fee-balance', color: 'bg-orange-50 text-orange-600' },
  { label: 'Library', icon: Library, href: '/library', color: 'bg-pink-50 text-pink-600' },
  { label: 'Elections', icon: Vote, href: '/elections', color: 'bg-ku-gold/10 text-ku-gold' },
];

// ── Main Component ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery<{ data: DashboardData }>({
    queryKey: ['student-dashboard'],
    queryFn: () => api.get('/students/dashboard').then((res) => res.data),
  });

  const dashboard = data?.data;

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (isError || !dashboard) {
    return (
      <div className="p-6">
        <DashboardError onRetry={() => refetch()} />
      </div>
    );
  }

  const { student } = dashboard;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Page Header */}
      <motion.div variants={cardVariants}>
        <h1 className="text-2xl font-bold text-ku-navy">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Row 1: Welcome + Semester + Academic Status */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Welcome Card (col-span-2) */}
        <motion.div variants={cardVariants} className="md:col-span-2">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-ku-navy to-ku-blue text-white">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-ku-gold/10" />
            <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/5" />
            <CardContent className="relative z-10 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/70">Welcome back,</p>
                  <h2 className="mt-1 text-2xl font-bold">
                    {student.firstName} {student.lastName}!
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Badge className="border-ku-gold/30 bg-ku-gold/20 text-ku-gold">
                      {student.admissionNumber}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                      {student.programme.name}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                      Year {student.yearOfStudy}
                    </Badge>
                  </div>
                </div>
                <Badge className="shrink-0 border-ku-gold/30 bg-ku-gold/20 text-ku-gold">
                  {student.currentSemester?.name || 'N/A'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Semester Card */}
        <motion.div variants={cardVariants}>
          <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 rounded-lg bg-blue-50 p-3 text-blue-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="text-sm text-gray-500">Current Semester</p>
              <p className="mt-1 text-lg font-semibold text-ku-navy">
                {student.currentSemester?.name || 'N/A'}
              </p>
              <p className="text-xs text-gray-400">
                Academic Year {student.currentSemester?.year || 'N/A'}
              </p>
              <div className="mt-3">
                <Badge
                  className={getStatusColor(student.semesterRegistrationStatus)}
                  variant="secondary"
                >
                  {student.semesterRegistrationStatus === 'ACTIVE'
                    ? 'Registered'
                    : student.semesterRegistrationStatus || 'Pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Academic Status Card */}
        <motion.div variants={cardVariants}>
          <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 rounded-lg bg-ku-gold/10 p-3 text-ku-gold">
                <BarChart3 className="h-5 w-5" />
              </div>
              <p className="text-sm text-gray-500">Academic Status</p>
              <div className="mt-2 flex items-baseline gap-3">
                <div>
                  <p className="text-xs text-gray-400">GPA</p>
                  <p className="text-xl font-bold text-ku-navy">{student.gpa?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">CGPA</p>
                  <p className="text-xl font-bold text-ku-navy">{student.cgpa?.toFixed(2) || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-3">
                <Progress
                  value={((student.cgpa || 0) / 4) * 100}
                  className="h-2"
                />
              </div>
              <Badge
                className={cn(
                  'mt-2',
                  student.academicStanding === 'GOOD'
                    ? 'bg-green-50 text-green-600'
                    : student.academicStanding === 'PROBATION'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-yellow-50 text-yellow-600'
                )}
                variant="secondary"
              >
                {student.academicStanding || 'N/A'}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 2: Quick Stats (4 columns) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Registered Units"
          value={dashboard.registeredUnits ?? 0}
          subtext={
            <Link
              href="/units"
              className="text-xs font-medium text-ku-blue hover:text-ku-royal hover:underline"
            >
              View All &rarr;
            </Link>
          }
          color="bg-blue-50 text-blue-600"
          href="/units"
        />

        <StatCard
          icon={DollarSign}
          label="Outstanding Fees"
          value={formatCurrency(dashboard.outstandingFees ?? 0)}
          subtext={
            <Badge className={getStatusColor(dashboard.feeStatus)} variant="secondary">
              {dashboard.feeStatus || 'CLEAR'}
            </Badge>
          }
          color="bg-orange-50 text-orange-600"
          href="/fee-balance"
        />

        <StatCard
          icon={Vote}
          label="Active Elections"
          value={dashboard.activeElections ?? 0}
          subtext={
            <span className="text-xs text-gray-400">
              {dashboard.activeElections > 0 ? 'Voting in progress' : 'No active elections'}
            </span>
          }
          color="bg-ku-gold/10 text-ku-gold"
          href="/elections"
        />

        <StatCard
          icon={Book}
          label="Library Status"
          value={dashboard.borrowedBooks ?? 0}
          subtext={
            dashboard.overdueBooks > 0 ? (
              <span className="text-xs font-medium text-red-500">
                {dashboard.overdueBooks} overdue
              </span>
            ) : (
              <span className="text-xs text-gray-400">Books borrowed</span>
            )
          }
          color="bg-purple-50 text-purple-600"
          href="/library"
        />
      </div>

      {/* Row 3: Hostel + Events + Quick Links (3 columns) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hostel Status */}
        <motion.div variants={cardVariants}>
          <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 rounded-lg bg-green-50 p-3 text-green-600">
                <Home className="h-5 w-5" />
              </div>
              <p className="text-sm text-gray-500">Hostel Status</p>
              <p className="mt-1 text-lg font-semibold text-ku-navy">
                {dashboard.hostelRoom || 'Not allocated'}
              </p>
              <Badge
                variant="secondary"
                className={cn(
                  'mt-2',
                  dashboard.hostelStatus === 'ALLOCATED'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-gray-50 text-gray-500'
                )}
              >
                {dashboard.hostelStatus === 'ALLOCATED' ? 'Allocated' : 'Not allocated'}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div variants={cardVariants}>
          <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 rounded-lg bg-pink-50 p-3 text-pink-600">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="text-sm text-gray-500">Upcoming Events</p>
              <p className="mt-1 text-lg font-semibold text-ku-navy">
                {dashboard.upcomingEvents ?? 0}
              </p>
              <p className="text-xs text-gray-400">Events this semester</p>
              <Button variant="link" size="sm" asChild className="mt-2 h-auto p-0 text-ku-blue">
                <Link href="/events">View Calendar &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={cardVariants}>
          <Card className="h-full transition-all duration-300 hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-ku-navy">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex flex-col items-center gap-1.5 rounded-lg p-3 transition-all hover:bg-gray-50"
                  >
                    <div className={cn('rounded-lg p-2', link.color)}>
                      <link.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">
                      {link.label}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 4: Announcements + Notifications (2 columns) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Announcements */}
        <motion.div variants={cardVariants}>
          <Card className="h-full transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-ku-gold" />
                <CardTitle className="text-base text-ku-navy">Recent Announcements</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href="/announcements">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {dashboard.recentAnnouncements && dashboard.recentAnnouncements.length > 0 ? (
                  <ul className="space-y-3">
                    {dashboard.recentAnnouncements.slice(0, 5).map((announcement, index) => (
                      <motion.li
                        key={announcement.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={`/announcements/${announcement.id}`}
                          className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                        >
                          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-ku-gold" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-ku-navy group-hover:text-ku-blue line-clamp-1">
                              {announcement.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {timeAgo(announcement.createdAt)}
                            </p>
                          </div>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Megaphone className="h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">No announcements yet</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Notifications */}
        <motion.div variants={cardVariants}>
          <Card className="h-full transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-ku-blue" />
                <CardTitle className="text-base text-ku-navy">Recent Notifications</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href="/notifications">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {dashboard.recentNotifications && dashboard.recentNotifications.length > 0 ? (
                  <ul className="space-y-3">
                    {dashboard.recentNotifications.slice(0, 5).map((notification, index) => (
                      <motion.li
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={`/notifications/${notification.id}`}
                          className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                        >
                          <div
                            className={cn(
                              'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                              notification.isRead ? 'bg-gray-300' : 'bg-ku-blue'
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'text-sm line-clamp-1',
                                notification.isRead
                                  ? 'text-gray-600'
                                  : 'font-medium text-ku-navy'
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-400 line-clamp-1">
                              {notification.message}
                            </p>
                            <p className="mt-0.5 text-[10px] text-gray-400">
                              {timeAgo(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="shrink-0 rounded-full bg-ku-blue px-1.5 py-0.5 text-[10px] font-medium text-white">
                              New
                            </span>
                          )}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Bell className="h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
