'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  BookOpen,
  BookMarked,
  GraduationCap,
  AlertCircle,
  Loader2,
  Trash2,
  AlertTriangle,
  Clock,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

// ── Types ──────────────────────────────────────────────────────────────────

interface RegisteredCourse {
  id: string;
  course: {
    id: string;
    code: string;
    name: string;
    credits: number;
  };
  status: string;
  grade: string | null;
  marks: number | null;
  attendance: number;
  registeredAt: string;
}

interface RegisteredUnitsData {
  semester: {
    id: string;
    name: string;
    year: number;
  };
  courses: RegisteredCourse[];
  totalCredits: number;
  totalCourses: number;
  averageAttendance: number;
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

function UnitsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function UnitsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load registered units</h3>
      <p className="mt-1 text-sm text-gray-500">
        Unable to fetch your registered course information. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function UnitsEmpty() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="rounded-full bg-gray-50 p-4">
        <BookOpen className="h-10 w-10 text-gray-300" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No registered units</h3>
      <p className="mt-1 text-sm text-gray-500">
        You have not registered for any courses this semester.
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Go to Semester Registration to register for courses.
      </p>
    </div>
  );
}

// ── Attendance Badge ───────────────────────────────────────────────────────

function AttendanceBadge({ percentage }: { percentage: number }) {
  const colorClass =
    percentage >= 75
      ? 'text-green-600 bg-green-50'
      : percentage >= 50
        ? 'text-yellow-600 bg-yellow-50'
        : 'text-red-600 bg-red-50';

  return (
    <Badge variant="secondary" className={cn('font-medium', colorClass)}>
      {percentage.toFixed(1)}%
    </Badge>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function RegisteredUnitsPage() {
  const queryClient = useQueryClient();
  const [dropCourseId, setDropCourseId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<RegisteredUnitsData>>({
    queryKey: ['registered-units'],
    queryFn: () => api.get('/academics/registered-units').then((res) => res.data),
  });

  const registeredData = data?.data;

  const dropMutation = useMutation({
    mutationFn: (courseId: string) =>
      api.post(`/academics/registered-units/${courseId}/drop`),
    onSuccess: () => {
      toast.success('Course dropped successfully.');
      setDialogOpen(false);
      setDropCourseId(null);
      queryClient.invalidateQueries({ queryKey: ['registered-units'] });
      queryClient.invalidateQueries({ queryKey: ['registration'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to drop course. Please try again.');
    },
  });

  const handleDropConfirm = () => {
    if (dropCourseId) {
      dropMutation.mutate(dropCourseId);
    }
  };

  const courseToDrop = registeredData?.courses.find((c) => c.id === dropCourseId);

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return <UnitsSkeleton />;
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (isError || !registeredData) {
    return (
      <div className="p-6">
        <UnitsError onRetry={() => refetch()} />
      </div>
    );
  }

  const { semester, courses, totalCredits, totalCourses, averageAttendance } = registeredData;

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
            <BookMarked className="h-5 w-5 text-ku-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ku-navy">Registered Units</h1>
            <p className="text-sm text-gray-500">
              Your registered courses for the current semester
            </p>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold text-ku-navy">{totalCourses}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-ku-gold/10 p-3 text-ku-gold">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Credits</p>
                <p className="text-2xl font-bold text-ku-navy">{totalCredits}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-green-50 p-3 text-green-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Attendance</p>
                <p className="text-2xl font-bold text-ku-navy">
                  {averageAttendance.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Semester Badge */}
      <motion.div variants={itemVariants}>
        <Badge
          variant="secondary"
          className="bg-ku-navy px-4 py-1.5 text-sm font-medium text-white"
        >
          {semester.name} - Academic Year {semester.year}
        </Badge>
      </motion.div>

      {/* Courses Table */}
      <motion.div variants={itemVariants}>
        {courses.length === 0 ? (
          <Card>
            <CardContent>
              <UnitsEmpty />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead className="text-center">Credits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="text-center">Attendance</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="group border-b transition-colors hover:bg-gray-50"
                      >
                        <TableCell className="font-mono text-sm font-medium text-ku-navy">
                          {entry.course.code}
                        </TableCell>
                        <TableCell className="font-medium text-ku-navy">
                          {entry.course.name}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {entry.course.credits}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              entry.status === 'ACTIVE'
                                ? 'bg-green-50 text-green-600'
                                : entry.status === 'DROPPED'
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-gray-50 text-gray-600'
                            )}
                          >
                            {entry.status === 'ACTIVE' ? 'Active' : entry.status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.grade ? (
                            <Badge
                              variant="secondary"
                              className={cn(
                                'font-mono font-bold',
                                ['A', 'A-', 'B+'].includes(entry.grade)
                                  ? 'bg-green-50 text-green-600'
                                  : ['B', 'B-', 'C+'].includes(entry.grade)
                                    ? 'bg-blue-50 text-blue-600'
                                    : ['C', 'C-', 'D+'].includes(entry.grade)
                                      ? 'bg-yellow-50 text-yellow-600'
                                      : 'bg-red-50 text-red-600'
                              )}
                            >
                              {entry.grade}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <AttendanceBadge percentage={entry.attendance} />
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.status === 'ACTIVE' && (
                            <Dialog open={dialogOpen && dropCourseId === entry.id} onOpenChange={(open) => {
                              setDialogOpen(open);
                              if (!open) setDropCourseId(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                                  onClick={() => {
                                    setDropCourseId(entry.id);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Drop Course</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to drop{' '}
                                    <span className="font-semibold text-ku-navy">
                                      {courseToDrop?.course.name}
                                    </span>
                                    ? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                  <p>
                                    Dropping a course may affect your credit load and academic
                                    progress. Ensure you meet the minimum credit requirements for
                                    the semester.
                                  </p>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setDialogOpen(false);
                                      setDropCourseId(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={handleDropConfirm}
                                    disabled={dropMutation.isPending}
                                  >
                                    {dropMutation.isPending ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Dropping...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Confirm Drop
                                      </>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
