'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

// ── Types ──────────────────────────────────────────────────────────────────

interface CourseAttendance {
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  attended: number;
  totalClasses: number;
  percentage: number;
}

interface AttendanceData {
  courses: CourseAttendance[];
  overallPercentage: number;
  totalAttended: number;
  totalClasses: number;
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

function AttendanceSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function AttendanceError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <CalendarCheck className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load attendance data</h3>
      <p className="mt-1 text-sm text-gray-500">
        Unable to fetch your attendance records. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function AttendanceEmpty() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="rounded-full bg-gray-50 p-4">
        <Calendar className="h-10 w-10 text-gray-300" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No attendance records</h3>
      <p className="mt-1 text-sm text-gray-500">
        No attendance data is available for the current semester.
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Records will appear once attendance has been taken for your courses.
      </p>
    </div>
  );
}

// ── Attendance Bar Component ───────────────────────────────────────────────

function AttendanceBar({
  percentage,
  label,
  showValue = true,
}: {
  percentage: number;
  label?: string;
  showValue?: boolean;
}) {
  const barColor =
    percentage >= 75
      ? 'bg-green-500'
      : percentage >= 50
        ? 'bg-yellow-500'
        : 'bg-red-500';

  const barBgColor =
    percentage >= 75
      ? 'bg-green-100'
      : percentage >= 50
        ? 'bg-yellow-100'
        : 'bg-red-100';

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{label}</span>
          {showValue && (
            <span
              className={cn(
                'text-sm font-semibold',
                percentage >= 75
                  ? 'text-green-600'
                  : percentage >= 50
                    ? 'text-yellow-600'
                    : 'text-red-600'
              )}
            >
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('h-2.5 w-full overflow-hidden rounded-full', barBgColor)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full transition-all', barColor)}
        />
      </div>
    </div>
  );
}

// ── Status Badge Component ─────────────────────────────────────────────────

function AttendanceStatusBadge({ percentage }: { percentage: number }) {
  if (percentage >= 75) {
    return (
      <Badge variant="secondary" className="bg-green-50 text-green-600">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Good
      </Badge>
    );
  }
  if (percentage >= 50) {
    return (
      <Badge variant="secondary" className="bg-yellow-50 text-yellow-600">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Warning
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-red-50 text-red-600">
      <AlertCircle className="mr-1 h-3 w-3" />
      Critical
    </Badge>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<AttendanceData>>({
    queryKey: ['attendance'],
    queryFn: () => api.get('/academics/attendance').then((res) => res.data),
  });

  const attendanceData = data?.data;

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return <AttendanceSkeleton />;
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (isError || !attendanceData) {
    return (
      <div className="p-6">
        <AttendanceError onRetry={() => refetch()} />
      </div>
    );
  }

  const { courses, overallPercentage, totalAttended, totalClasses } = attendanceData;
  const lowAttendanceCourses = courses.filter((c) => c.percentage < 75);

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
            <CalendarCheck className="h-5 w-5 text-ku-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ku-navy">Attendance Summary</h1>
            <p className="text-sm text-gray-500">
              Your class attendance records for the current semester
            </p>
          </div>
        </div>
      </motion.div>

      {/* Overall Attendance Card */}
      <motion.div variants={itemVariants}>
        <Card
          className={cn(
            'relative overflow-hidden border-0',
            overallPercentage >= 75
              ? 'bg-gradient-to-br from-green-50 to-emerald-50'
              : overallPercentage >= 50
                ? 'bg-gradient-to-br from-yellow-50 to-amber-50'
                : 'bg-gradient-to-br from-red-50 to-rose-50'
          )}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-full',
                  overallPercentage >= 75
                    ? 'bg-green-100 text-green-600'
                    : overallPercentage >= 50
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-red-100 text-red-600'
                )}
              >
                {overallPercentage >= 75 ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : overallPercentage >= 50 ? (
                  <AlertTriangle className="h-8 w-8" />
                ) : (
                  <AlertCircle className="h-8 w-8" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-gray-500">Overall Attendance</p>
                <p
                  className={cn(
                    'text-3xl font-bold',
                    overallPercentage >= 75
                      ? 'text-green-700'
                      : overallPercentage >= 50
                        ? 'text-yellow-700'
                        : 'text-red-700'
                  )}
                >
                  {overallPercentage.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  {totalAttended} of {totalClasses} classes attended
                </p>
              </div>
              <div className="w-full sm:w-48">
                <AttendanceBar percentage={overallPercentage} showValue={false} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Low Attendance Warning */}
      {lowAttendanceCourses.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <p className="font-semibold text-red-800">
                    Low Attendance Alert
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    You have low attendance ({'<'}75%) in the following course{lowAttendanceCourses.length > 1 ? 's' : ''}:
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {lowAttendanceCourses.map((course) => (
                      <li key={course.courseId} className="text-sm text-red-700">
                        {course.courseCode} - {course.courseName} ({course.percentage.toFixed(1)}%)
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-red-700">
                    Please note that below 75% attendance may affect your eligibility to sit for
                    examinations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Per-Course Attendance */}
      <motion.div variants={itemVariants}>
        {courses.length === 0 ? (
          <Card>
            <CardContent>
              <AttendanceEmpty />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {courses.map((course, index) => {
              const isGood = course.percentage >= 75;
              const isWarning = course.percentage >= 50 && course.percentage < 75;
              const isCritical = course.percentage < 50;

              return (
                <motion.div
                  key={course.courseId}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.06 }}
                >
                  <Card
                    className={cn(
                      'transition-all duration-200 hover:shadow-md',
                      isCritical && 'border-l-4 border-l-red-400',
                      isWarning && 'border-l-4 border-l-yellow-400',
                      isGood && 'border-l-4 border-l-green-400'
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-ku-gold" />
                            <span className="font-mono text-xs font-medium text-ku-gold">
                              {course.courseCode}
                            </span>
                          </div>
                          <p className="mt-0.5 font-semibold text-ku-navy line-clamp-1">
                            {course.courseName}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {course.attended}/{course.totalClasses} classes
                            </span>
                            <span>{course.credits} credits</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-40">
                            <AttendanceBar
                              percentage={course.percentage}
                              showValue={false}
                            />
                          </div>
                          <div className="w-20 text-right">
                            <span
                              className={cn(
                                'text-lg font-bold',
                                isGood && 'text-green-600',
                                isWarning && 'text-yellow-600',
                                isCritical && 'text-red-600'
                              )}
                            >
                              {course.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <AttendanceStatusBadge percentage={course.percentage} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
