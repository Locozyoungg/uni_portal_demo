'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  GraduationCap,
  Award,
  BarChart3,
  Target,
  Layers,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────

interface SemesterGpa {
  semester: string;
  year: number;
  gpa: number;
  cgpa: number;
  credits: number;
  cumulativeCredits: number;
}

interface CgpaData {
  currentCgpa: number;
  currentGpa: number;
  currentSemester: string;
  totalCreditsCompleted: number;
  totalCreditsRequired: number;
  classification: string;
  gpaHistory: SemesterGpa[];
  targetCgpa: number;
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
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ── Skeleton ───────────────────────────────────────────────────────────────

function CgpaSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-36" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl md:col-span-2" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function CgpaError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <BarChart3 className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load CGPA data</h3>
      <p className="mt-1 text-sm text-gray-500">
        Unable to fetch your academic progress data. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Trend Indicator ────────────────────────────────────────────────────────

function TrendIndicator({ gpaHistory }: { gpaHistory: SemesterGpa[] }) {
  if (gpaHistory.length < 2) return null;

  const latest = gpaHistory[gpaHistory.length - 1].gpa;
  const previous = gpaHistory[gpaHistory.length - 2].gpa;
  const diff = latest - previous;

  if (diff > 0.05) {
    return (
      <div className="flex items-center gap-1 text-sm text-green-600">
        <TrendingUp className="h-4 w-4" />
        <span>+{diff.toFixed(2)} from previous</span>
      </div>
    );
  }
  if (diff < -0.05) {
    return (
      <div className="flex items-center gap-1 text-sm text-red-600">
        <TrendingDown className="h-4 w-4" />
        <span>{diff.toFixed(2)} from previous</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      <Minus className="h-4 w-4" />
      <span>Stable</span>
    </div>
  );
}

// ── Classification Display ─────────────────────────────────────────────────

function ClassificationDisplay({ classification }: { classification: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    FIRST_CLASS: {
      label: 'First Class Honours',
      color: 'text-green-700',
      bg: 'bg-green-50',
    },
    SECOND_UPPER: {
      label: 'Second Class Upper',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    SECOND_LOWER: {
      label: 'Second Class Lower',
      color: 'text-yellow-700',
      bg: 'bg-yellow-50',
    },
    PASS: {
      label: 'Pass',
      color: 'text-gray-700',
      bg: 'bg-gray-50',
    },
    FAIL: {
      label: 'Fail',
      color: 'text-red-700',
      bg: 'bg-red-50',
    },
  };

  const info = config[classification] || {
    label: classification || 'N/A',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
  };

  return (
    <span
      className={cn(
        'rounded-lg px-3 py-1 text-sm font-semibold',
        info.color,
        info.bg
      )}
    >
      {info.label}
    </span>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !label) return null;
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-lg">
      <p className="text-sm font-semibold text-ku-navy">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CgpaPage() {
  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<CgpaData>>({
    queryKey: ['cgpa'],
    queryFn: () => api.get('/academics/cgpa').then((res) => res.data),
  });

  const cgpaData = data?.data;

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return <CgpaSkeleton />;
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (isError || !cgpaData) {
    return (
      <div className="p-6">
        <CgpaError onRetry={() => refetch()} />
      </div>
    );
  }

  const {
    currentCgpa,
    currentGpa,
    currentSemester,
    totalCreditsCompleted,
    totalCreditsRequired,
    classification,
    gpaHistory,
    targetCgpa,
  } = cgpaData;

  const creditsRemaining = Math.max(0, totalCreditsRequired - totalCreditsCompleted);
  const graduationProgress = totalCreditsRequired
    ? Math.min(Math.round((totalCreditsCompleted / totalCreditsRequired) * 100), 100)
    : 0;

  const isOnTarget = currentCgpa >= targetCgpa;
  const cgpaToTarget = targetCgpa - currentCgpa;

  // Chart data
  const chartData = gpaHistory.map((sem) => ({
    semester: `${sem.semester.split(' ')[0] || sem.semester} ${sem.year}`,
    GPA: sem.gpa,
    CGPA: sem.cgpa,
  }));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ku-navy/10">
            <BarChart3 className="h-5 w-5 text-ku-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ku-navy">CGPA History</h1>
            <p className="text-sm text-gray-500">
              Track your academic performance across semesters
            </p>
          </div>
        </div>
      </motion.div>

      {/* CGPA Hero + Chart */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Current CGPA Card */}
        <motion.div variants={itemVariants}>
          <Card className="h-full border-0 bg-gradient-to-br from-ku-navy to-ku-blue text-white shadow-xl">
            <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 rounded-full bg-ku-gold/20 p-3">
                <Award className="h-8 w-8 text-ku-gold" />
              </div>
              <p className="text-sm text-white/70">Current CGPA</p>
              <p className="mt-1 text-5xl font-bold tracking-tight">{currentCgpa.toFixed(2)}</p>
              <p className="mt-1 text-sm text-white/60">out of 4.0</p>
              <div className="mt-3">
                <TrendIndicator gpaHistory={gpaHistory} />
              </div>
              <div className="mt-4 w-full border-t border-white/10 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Current GPA</span>
                  <span className="font-bold text-ku-gold">{currentGpa.toFixed(2)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-white/70">Semester</span>
                  <span className="font-semibold text-white">{currentSemester}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* GPA Trend Chart */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-ku-navy">
                <TrendingUp className="h-5 w-5 text-ku-gold" />
                GPA &amp; CGPA Trend
              </CardTitle>
              <CardDescription>Performance trajectory across semesters</CardDescription>
            </CardHeader>
            <CardContent>
              {gpaHistory.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                  No GPA history available yet.
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="semester"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        domain={[0, 4]}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value: string) => (
                          <span className="text-sm text-gray-600">{value}</span>
                        )}
                      />
                      <Line
                        type="monotone"
                        dataKey="GPA"
                        stroke="#d4a843"
                        strokeWidth={2}
                        dot={{ fill: '#d4a843', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#d4a843', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="CGPA"
                        stroke="#1e3a5f"
                        strokeWidth={2}
                        dot={{ fill: '#1e3a5f', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#1e3a5f', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress Cards Row */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Target CGPA</p>
                  <p className="text-xl font-bold text-ku-navy">{targetCgpa.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    {isOnTarget
                      ? 'On track!'
                      : `${Math.abs(cgpaToTarget).toFixed(2)} points away`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-ku-gold/10 p-3 text-ku-gold">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Credits Completed</p>
                  <p className="text-xl font-bold text-ku-navy">
                    {totalCreditsCompleted}
                    <span className="text-sm font-normal text-gray-400"> / {totalCreditsRequired}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {creditsRemaining} credits remaining
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-3 text-green-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Classification</p>
                  <div className="mt-1">
                    <ClassificationDisplay classification={classification} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Graduation Progress */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ku-navy">Graduation Progress</p>
                  <p className="text-xs text-gray-400">
                    {totalCreditsCompleted} of {totalCreditsRequired} credits completed
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-ku-navy">{graduationProgress}%</span>
            </div>
            <Progress value={graduationProgress} className="mt-3 h-3" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Per-Semester Breakdown */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-ku-navy">Semester Breakdown</CardTitle>
            <CardDescription>Your GPA and credit history per semester</CardDescription>
          </CardHeader>
          <CardContent>
            {gpaHistory.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No semester data available
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your academic records will appear here once semesters are completed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Semester</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-center">GPA</TableHead>
                      <TableHead className="text-center">CGPA</TableHead>
                      <TableHead className="text-center">Credits</TableHead>
                      <TableHead className="text-center">Cumulative</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gpaHistory.map((sem, index) => {
                      const gpaColor =
                        sem.gpa >= 3.5
                          ? 'text-green-600'
                          : sem.gpa >= 2.5
                            ? 'text-blue-600'
                            : sem.gpa >= 1.5
                              ? 'text-yellow-600'
                              : 'text-red-600';

                      return (
                        <motion.tr
                          key={`${sem.semester}-${sem.year}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b transition-colors hover:bg-gray-50"
                        >
                          <TableCell className="font-medium text-ku-navy">
                            {sem.semester}
                          </TableCell>
                          <TableCell className="text-gray-500">{sem.year}</TableCell>
                          <TableCell className={cn('text-center font-bold', gpaColor)}>
                            {sem.gpa.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center font-bold text-ku-navy">
                            {sem.cgpa.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {sem.credits}
                          </TableCell>
                          <TableCell className="text-center font-medium text-gray-500">
                            {sem.cumulativeCredits}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
