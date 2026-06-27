'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Loader2,
  BookMarked,
  AlertCircle,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────────────────

interface SemesterInfo {
  id: string;
  name: string;
  year: number;
  registrationStatus: string;
  registrationDeadline: string;
  isOpen: boolean;
}

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  lecturer: string;
  description: string;
  isRegistered?: boolean;
}

interface RegistrationData {
  currentSemester: SemesterInfo;
  availableCourses: Course[];
  registeredCourses: Course[];
  registeredCount: number;
  maxCredits: number;
  usedCredits: number;
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

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ── Skeleton ───────────────────────────────────────────────────────────────

function RegistrationSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-52" />
      </div>
      <Skeleton className="h-36 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function RegistrationError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load registration data</h3>
      <p className="mt-1 text-sm text-gray-500">
        Unable to fetch course registration information. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function RegistrationPage() {
  const queryClient = useQueryClient();
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [showRegistered, setShowRegistered] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<RegistrationData>>({
    queryKey: ['registration'],
    queryFn: () => api.get('/academics/registration').then((res) => res.data),
  });

  const registration = data?.data;

  const registrationMutation = useMutation({
    mutationFn: (courseIds: string[]) =>
      api.post('/academics/registration/register', { courseIds }),
    onSuccess: () => {
      toast.success('Courses registered successfully!');
      setSelectedCourses(new Set());
      queryClient.invalidateQueries({ queryKey: ['registration'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to register courses. Please try again.');
    },
  });

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const handleRegister = () => {
    if (selectedCourses.size === 0) {
      toast.error('Please select at least one course to register.');
      return;
    }
    registrationMutation.mutate(Array.from(selectedCourses));
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-72" />
          <Skeleton className="mt-2 h-4 w-52" />
        </div>
        <RegistrationSkeleton />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (isError || !registration) {
    return (
      <div className="p-6">
        <RegistrationError onRetry={() => refetch()} />
      </div>
    );
  }

  const { currentSemester, availableCourses, registeredCourses, registeredCount, maxCredits, usedCredits } = registration;

  const selectedCredits = Array.from(selectedCourses).reduce((total, courseId) => {
    const course = availableCourses.find((c) => c.id === courseId);
    return total + (course?.credits || 0);
  }, 0);

  const totalSelectedCredits = selectedCredits + usedCredits;
  const isOverMax = totalSelectedCredits > maxCredits;
  const canRegister = currentSemester.isOpen && selectedCourses.size > 0 && !isOverMax;

  const unregisteredCourses = availableCourses.filter(
    (course) => !registeredCourses.some((rc) => rc.id === course.id)
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ku-navy/10">
            <BookOpen className="h-5 w-5 text-ku-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ku-navy">Semester Registration</h1>
            <p className="text-sm text-gray-500">Register for courses in the current semester</p>
          </div>
        </div>
        {registeredCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRegistered(!showRegistered)}
            className="flex items-center gap-2"
          >
            <BookMarked className="h-4 w-4" />
            {showRegistered ? 'Hide' : 'Show'} Registered ({registeredCount})
          </Button>
        )}
      </motion.div>

      {/* Semester Info Card */}
      <motion.div variants={cardVariants}>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-ku-navy to-ku-blue text-white">
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-ku-gold/10" />
          <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/5" />
          <CardContent className="relative z-10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ku-gold/20">
                  <GraduationCap className="h-7 w-7 text-ku-gold" />
                </div>
                <div>
                  <p className="text-sm text-white/70">Current Semester</p>
                  <h2 className="text-xl font-bold sm:text-2xl">
                    {currentSemester.name}
                  </h2>
                  <p className="text-sm text-white/60">Academic Year {currentSemester.year}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  className={cn(
                    'border px-3 py-1 text-sm',
                    currentSemester.isOpen
                      ? 'border-green-300/30 bg-green-500/20 text-green-300'
                      : 'border-red-300/30 bg-red-500/20 text-red-300'
                  )}
                >
                  {currentSemester.isOpen ? 'Registration Open' : 'Registration Closed'}
                </Badge>
                <Badge className="border-ku-gold/30 bg-ku-gold/20 text-ku-gold">
                  Deadline: {formatDate(currentSemester.registrationDeadline)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={cardVariants}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Registered</p>
                <p className="text-xl font-bold text-ku-navy">
                  {registeredCount}{' '}
                  <span className="text-sm font-normal text-gray-400">courses</span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-lg bg-ku-gold/10 p-3 text-ku-gold">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Credits Used</p>
                <p className="text-xl font-bold text-ku-navy">
                  {usedCredits}{' '}
                  <span className="text-sm font-normal text-gray-400">/ {maxCredits}</span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="rounded-lg bg-green-50 p-3 text-green-600">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Available Courses</p>
                <p className="text-xl font-bold text-ku-navy">
                  {unregisteredCourses.length}{' '}
                  <span className="text-sm font-normal text-gray-400">to register</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Already Registered Courses */}
      {showRegistered && registeredCourses.length > 0 && (
        <motion.div
          variants={cardVariants}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-ku-navy">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Already Registered Courses
              </CardTitle>
              <CardDescription>
                You are currently registered for {registeredCount} course{registeredCount !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Department</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registeredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-mono text-sm font-medium text-ku-navy">
                        {course.code}
                      </TableCell>
                      <TableCell className="font-medium text-ku-navy">{course.name}</TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell className="text-gray-500">{course.department}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Course Selection */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-ku-navy">Available Courses</CardTitle>
              <CardDescription>
                Select courses to register for the {currentSemester.name}
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                'text-sm',
                selectedCourses.size > 0
                  ? 'bg-ku-navy text-white'
                  : 'bg-gray-100 text-gray-500'
              )}
            >
              {selectedCourses.size} Selected
            </Badge>
          </CardHeader>
          <CardContent>
            {!currentSemester.isOpen && (
              <div className="mb-6 flex items-center gap-3 rounded-lg bg-yellow-50 p-4 text-yellow-800">
                <Info className="h-5 w-5 shrink-0 text-yellow-600" />
                <p className="text-sm font-medium">
                  Course registration is currently closed. The deadline was{' '}
                  {formatDate(currentSemester.registrationDeadline)}.
                </p>
              </div>
            )}

            {isOverMax && (
              <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-800">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm font-medium">
                  You have exceeded the maximum credit limit of {maxCredits} credits. Please deselect some courses.
                </p>
              </div>
            )}

            {unregisteredCourses.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-300" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">All Courses Registered</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You have registered for all available courses this semester.
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/academics/registered-units">
                    <BookMarked className="mr-2 h-4 w-4" />
                    View Registered Units
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {unregisteredCourses.map((course) => {
                    const isSelected = selectedCourses.has(course.id);
                    return (
                      <motion.div
                        key={course.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Card
                          className={cn(
                            'cursor-pointer border-2 transition-all duration-200 hover:shadow-md',
                            isSelected
                              ? 'border-ku-gold bg-ku-gold/5'
                              : 'border-transparent hover:border-gray-200'
                          )}
                          onClick={() => toggleCourse(course.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleCourse(course.id)}
                                className={cn(
                                  'mt-1',
                                  isSelected && 'border-ku-gold text-ku-gold'
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-mono text-xs font-medium text-ku-gold">
                                      {course.code}
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-ku-navy line-clamp-2">
                                      {course.name}
                                    </p>
                                  </div>
                                  <Badge variant="secondary" className="shrink-0">
                                    {course.credits} CR
                                  </Badge>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                                  {course.description}
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                  <span>{course.department}</span>
                                  <span className="text-gray-300">|</span>
                                  <span className="truncate">{course.lecturer}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Registration Action Bar */}
                <motion.div
                  variants={cardVariants}
                  className="sticky bottom-0 mt-6 rounded-xl border bg-white p-4 shadow-lg"
                >
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold text-ku-navy">{selectedCourses.size}</span> course{selectedCourses.size !== 1 ? 's' : ''} selected
                        {selectedCredits > 0 && (
                          <>
                            {' '}(<span className="font-semibold text-ku-navy">{selectedCredits}</span> credits)
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        Total credits including registered: {totalSelectedCredits} / {maxCredits}
                      </p>
                    </div>
                    <Button
                      onClick={handleRegister}
                      disabled={!canRegister || registrationMutation.isPending}
                      className="w-full bg-ku-navy text-white hover:bg-ku-blue sm:w-auto"
                    >
                      {registrationMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Register Selected Units
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
