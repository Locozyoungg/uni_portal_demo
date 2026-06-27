'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  GraduationCap,
  Printer,
  University,
  ScrollText,
  User,
  Hash,
  Calendar,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { cn, getStatusColor } from '@/lib/utils';
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

// ── Types ──────────────────────────────────────────────────────────────────

interface SemesterRecord {
  id: string;
  name: string;
  year: number;
  gpa: number;
  totalCredits: number;
  courses: Array<{
    course: {
      code: string;
      name: string;
      credits: number;
    };
    grade: string;
    marks: number;
  }>;
}

interface TranscriptData {
  student: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    programme: { name: string };
    faculty: { name: string };
    department: { name: string };
    yearOfStudy: number;
    enrollmentStatus: string;
  };
  semesters: SemesterRecord[];
  cumulativeGpa: number;
  totalCredits: number;
  totalCreditsRequired: number;
  classification: string;
}

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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

function TranscriptSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-44" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function TranscriptError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <ScrollText className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load transcript</h3>
      <p className="mt-1 text-sm text-gray-500">
        Unable to fetch your academic transcript. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Grade Badge ────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: string }) {
  const colorClass =
    ['A', 'A-', 'B+'].includes(grade)
      ? 'bg-green-50 text-green-600 border-green-200'
      : ['B', 'B-', 'C+'].includes(grade)
        ? 'bg-blue-50 text-blue-600 border-blue-200'
        : ['C', 'C-', 'D+'].includes(grade)
          ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
          : 'bg-red-50 text-red-600 border-red-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-bold',
        colorClass
      )}
    >
      {grade}
    </span>
  );
}

// ── Classification Display ─────────────────────────────────────────────────

function ClassificationBadge({ classification }: { classification: string }) {
  const colorClass =
    classification === 'FIRST_CLASS'
      ? 'bg-green-50 text-green-700 border-green-200'
      : classification === 'SECOND_UPPER'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : classification === 'SECOND_LOWER'
          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
          : classification === 'PASS'
            ? 'bg-gray-50 text-gray-700 border-gray-200'
            : 'bg-red-50 text-red-700 border-red-200';

  const label =
    classification === 'FIRST_CLASS'
      ? 'First Class Honours'
      : classification === 'SECOND_UPPER'
        ? 'Second Class Upper'
        : classification === 'SECOND_LOWER'
          ? 'Second Class Lower'
          : classification || 'N/A';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border px-3 py-1 text-sm font-semibold',
        colorClass
      )}
    >
      {label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function TranscriptPage() {
  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<TranscriptData>>({
    queryKey: ['transcript'],
    queryFn: () => api.get('/academics/transcript').then((res) => res.data),
  });

  const transcript = data?.data;

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return <TranscriptSkeleton />;
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (isError || !transcript) {
    return (
      <div className="p-6">
        <TranscriptError onRetry={() => refetch()} />
      </div>
    );
  }

  const { student, semesters, cumulativeGpa, totalCredits, totalCreditsRequired, classification } = transcript;
  const graduationProgress = totalCreditsRequired
    ? Math.min(Math.round((totalCredits / totalCreditsRequired) * 100), 100)
    : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ku-navy/10">
              <ScrollText className="h-5 w-5 text-ku-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ku-navy">Academic Transcript</h1>
              <p className="text-sm text-gray-500">
                Official academic record
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="hidden items-center gap-2 sm:flex"
            onClick={() => toast.success('PDF download initiated (demo)')}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden"
            onClick={() => toast.success('PDF download initiated (demo)')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Transcript Document */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-ku-navy/10 shadow-xl">
          {/* University Header */}
          <CardContent className="p-0">
            <div className="border-b-2 border-ku-navy/10 bg-gradient-to-r from-ku-navy/5 to-transparent p-6 text-center sm:p-8">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-ku-navy shadow-lg">
                <University className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-ku-navy sm:text-2xl">KENYATTA UNIVERSITY</2>
              <p className="mt-1 text-sm text-gray-500">Office of the Academic Registrar</p>
              <p className="text-sm font-semibold text-ku-gold">ACADEMIC TRANSCRIPT</p>
            </div>

            {/* Student Info */}
            <div className="border-b border-gray-100 p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-ku-gold" />
                  <div>
                    <p className="text-xs text-gray-400">Student Name</p>
                    <p className="font-semibold text-ku-navy">
                      {student.firstName} {student.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-ku-gold" />
                  <div>
                    <p className="text-xs text-gray-400">Admission No.</p>
                    <p className="font-semibold text-ku-navy">{student.admissionNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-ku-gold" />
                  <div>
                    <p className="text-xs text-gray-400">Programme</p>
                    <p className="font-semibold text-ku-navy">{student.programme.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-ku-gold" />
                  <div>
                    <p className="text-xs text-gray-400">Year of Study</p>
                    <p className="font-semibold text-ku-navy">Year {student.yearOfStudy}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Faculty:</span>
                  <span className="text-sm font-medium text-ku-navy">{student.faculty?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Department:</span>
                  <span className="text-sm font-medium text-ku-navy">{student.department?.name || 'N/A'}</span>
                </div>
                <Badge className={getStatusColor(student.enrollmentStatus)} variant="secondary">
                  {student.enrollmentStatus}
                </Badge>
              </div>
            </div>

            {/* Semesters */}
            <div className="p-6 sm:p-8">
              {semesters.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <FileText className="h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">No academic records</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No semester records have been added yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {semesters.map((semester, semIndex) => (
                    <motion.div
                      key={semester.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: semIndex * 0.08 }}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-ku-navy">
                            {semester.name} - {semester.year}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {semester.courses.length} course{semester.courses.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Semester GPA</p>
                          <p className="text-lg font-bold text-ku-navy">
                            {semester.gpa.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="overflow-x-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Code</TableHead>
                              <TableHead>Course Name</TableHead>
                              <TableHead className="text-center">Credits</TableHead>
                              <TableHead className="text-center">Grade</TableHead>
                              <TableHead className="text-right">Marks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {semester.courses.map((entry, courseIndex) => (
                              <TableRow key={entry.course.code + courseIndex}>
                                <TableCell className="font-mono text-sm font-medium text-ku-navy">
                                  {entry.course.code}
                                </TableCell>
                                <TableCell className="font-medium text-ku-navy">
                                  {entry.course.name}
                                </TableCell>
                                <TableCell className="text-center">{entry.course.credits}</TableCell>
                                <TableCell className="text-center">
                                  <GradeBadge grade={entry.grade} />
                                </TableCell>
                                <TableCell className="text-right font-semibold text-ku-navy">
                                  {entry.marks}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Cumulative Summary */}
            <div className="border-t-2 border-ku-navy/10 bg-gray-50/50 p-6 sm:p-8">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Cumulative GPA</p>
                  <p className="text-3xl font-bold text-ku-navy">{cumulativeGpa.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">out of 4.0</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Credits</p>
                  <p className="text-3xl font-bold text-ku-navy">
                    {totalCredits}
                    <span className="text-lg font-normal text-gray-400"> / {totalCreditsRequired}</span>
                  </p>
                  <div className="mx-auto mt-2 max-w-xs">
                    <Progress value={graduationProgress} className="h-2" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Classification</p>
                  <div className="mt-1">
                    <ClassificationBadge classification={classification} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex justify-center gap-4">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => toast.success('Print dialog opened (demo)')}
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button
          className="flex items-center gap-2 bg-ku-navy text-white hover:bg-ku-blue"
          onClick={() => toast.success('PDF download initiated (demo)')}
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </motion.div>

      {/* Disclaimer */}
      <motion.p
        variants={itemVariants}
        className="text-center text-xs text-gray-400"
      >
        This is a computer-generated transcript. For official purposes, please request a certified
        copy from the Academic Registrar&apos;s Office.
      </motion.p>
    </motion.div>
  );
}

