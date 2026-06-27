'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  Vote,
  Megaphone,
  ClipboardList,
  Activity,
  TrendingUp,
  DollarSign,
  Bell,
  Plus,
  BarChart3,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatDateTime, timeAgo } from '@/lib/utils';
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────

interface AdminDashboardData {
  stats: {
    totalStudents: number;
    totalCourses: number;
    activeElections: number;
    activeAnnouncements: number;
    pendingRequests: number;
    systemStatus: 'healthy' | 'warning' | 'error';
  };
  enrollmentByFaculty: Array<{
    faculty: string;
    count: number;
  }>;
  feeCollection: Array<{
    month: string;
    collected: number;
    outstanding: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    entity: string;
    details: string;
    timestamp: string;
    type: 'create' | 'update' | 'delete' | 'login';
  }>;
  studentGrowth: Array<{
    month: string;
    students: number;
  }>;
  genderDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: { value: number; isUp: boolean };
  trendLabel?: string;
  color: string;
  href?: string;
}) {
  const Comp = href ? Link : 'div';
  return (
    <motion.div variants={itemVariants}>
      <Comp
        href={href ?? '#'}
        className={cn(
          'block rounded-xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
          href && 'cursor-pointer hover:border-slate-700'
        )}
      >
        <div className="flex items-start justify-between">
          <div className={cn('rounded-lg p-3', color)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trend.isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            )}>
              {trend.isUp ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {trendLabel && (
            <p className="mt-1 text-xs text-slate-500">{trendLabel}</p>
          )}
        </div>
      </Comp>
    </motion.div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64 bg-slate-800" />
      <Skeleton className="h-4 w-40 bg-slate-800" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-slate-800" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl bg-slate-800" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-500/10 p-4">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">Failed to load dashboard</h3>
      <p className="mt-1 text-sm text-slate-400">
        Something went wrong while fetching admin data. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800">
        Retry
      </Button>
    </div>
  );
}

// ── Activity Icon Helper ───────────────────────────────────────────────────

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'create':
      return <Plus className="h-3.5 w-3.5 text-emerald-400" />;
    case 'update':
      return <Activity className="h-3.5 w-3.5 text-blue-400" />;
    case 'delete':
      return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    case 'login':
      return <Shield className="h-3.5 w-3.5 text-purple-400" />;
    default:
      return <Clock className="h-3.5 w-3.5 text-slate-400" />;
  }
}

function ActivityBg({ type }: { type: string }) {
  switch (type) {
    case 'create': return 'bg-emerald-500/10';
    case 'update': return 'bg-blue-500/10';
    case 'delete': return 'bg-red-500/10';
    case 'login': return 'bg-purple-500/10';
    default: return 'bg-slate-800';
  }
}

// ── Custom Tooltip for Recharts ────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery<{ data: AdminDashboardData }>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((res) => res.data),
  });

  const dashboard = data?.data;

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6">
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

  const { stats } = dashboard;

  const systemStatusBadge = {
    healthy: { label: 'All Systems Operational', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    warning: { label: 'Some Issues Detected', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    error: { label: 'System Errors', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  }[stats.systemStatus];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              {new Date().toLocaleDateString('en-KE', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <Badge variant="outline" className={cn('border', systemStatusBadge.color)}>
            <Activity className="h-3 w-3 mr-1.5" />
            {systemStatusBadge.label}
          </Badge>
        </div>
      </motion.div>

      {/* Stats Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats.totalStudents}
          trend={{ value: 12, isUp: true }}
          trendLabel="vs last month"
          color="bg-blue-500/10 text-blue-400"
          href="/admin/students"
        />
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value={stats.totalCourses}
          trend={{ value: 4, isUp: true }}
          trendLabel="this semester"
          color="bg-purple-500/10 text-purple-400"
          href="/admin/courses"
        />
        <StatCard
          icon={Vote}
          label="Active Elections"
          value={stats.activeElections}
          color="bg-amber-500/10 text-amber-400"
          href="/admin/elections"
        />
        <StatCard
          icon={Megaphone}
          label="Announcements"
          value={stats.activeAnnouncements}
          color="bg-pink-500/10 text-pink-400"
          href="/admin/announcements"
        />
        <StatCard
          icon={ClipboardList}
          label="Pending Requests"
          value={stats.pendingRequests}
          trend={{ value: 8, isUp: false }}
          trendLabel="needs attention"
          color="bg-orange-500/10 text-orange-400"
        />
        <StatCard
          icon={Activity}
          label="System Status"
          value={
            stats.systemStatus === 'healthy' ? 'Healthy' :
            stats.systemStatus === 'warning' ? 'Warning' : 'Error'
          }
          color={
            stats.systemStatus === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' :
            stats.systemStatus === 'warning' ? 'bg-amber-500/10 text-amber-400' :
            'bg-red-500/10 text-red-400'
          }
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrollment by Faculty */}
        <motion.div variants={itemVariants}>
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  <CardTitle className="text-base text-white">Enrollment by Faculty</CardTitle>
                </div>
              </div>
              <CardDescription className="text-slate-500">
                Student distribution across faculties
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {dashboard.enrollmentByFaculty.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboard.enrollmentByFaculty} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="faculty"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                      {dashboard.enrollmentByFaculty.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={idx % 2 === 0 ? '#10b981' : '#059669'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
                  No enrollment data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Fee Collection Summary */}
        <motion.div variants={itemVariants}>
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  <CardTitle className="text-base text-white">Fee Collection Summary</CardTitle>
                </div>
              </div>
              <CardDescription className="text-slate-500">
                Monthly collection vs outstanding
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {dashboard.feeCollection.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboard.feeCollection} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                      tickFormatter={(val) => `KES ${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-500 text-sm">
                  No fee data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 - Three columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Student Growth */}
        <motion.div variants={itemVariants}>
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-sm text-white">Student Growth</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.studentGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dashboard.studentGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="students" name="Students" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
                  No data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Gender Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-sm text-white">Gender Distribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.genderDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dashboard.genderDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dashboard.genderDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
                  No data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="border-slate-800 bg-slate-900 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-sm text-white">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={() => router.push('/admin/announcements')}
              >
                <Megaphone className="h-4 w-4 text-pink-400" />
                Create Announcement
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={() => router.push('/admin/elections')}
              >
                <Vote className="h-4 w-4 text-amber-400" />
                Manage Elections
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={() => router.push('/admin/logs')}
              >
                <ScrollText className="h-4 w-4 text-blue-400" />
                View Logs
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={() => router.push('/admin/students')}
              >
                <Users className="h-4 w-4 text-purple-400" />
                Manage Students
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={() => router.push('/admin/courses')}
              >
                <BookOpen className="h-4 w-4 text-blue-400" />
                Manage Courses
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={() => router.push('/admin/settings')}
              >
                <Settings className="h-4 w-4 text-slate-400" />
                System Settings
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-base text-white">Recent Activity</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {dashboard.recentActivity.length > 0 ? (
              <div className="space-y-1">
                {dashboard.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-800/50"
                  >
                    <div className={cn('mt-0.5 flex h-7 w-7 items-center justify-center rounded-full shrink-0', ActivityBg({ type: activity.type }))}>
                      <ActivityIcon type={activity.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">{activity.user}</span>
                        <span className="text-xs text-slate-500">{activity.action}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-700 text-slate-400">
                          {activity.entity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{activity.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-600 shrink-0 whitespace-nowrap">
                      {timeAgo(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <Bell className="h-8 w-8 text-slate-700" />
                <p className="mt-2 text-sm text-slate-500">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
