'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ScrollText,
  Printer,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  Hash,
  University,
  Info,
  BookOpen,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ── Types ──────────────────────────────────────────────────────────────────

interface ExamEntry {
  courseCode: string;
  courseName: string;
  date: string;
  time: string;
  venue: string;
  seatNumber: string;
}

interface ExamCardData {
  semester: {
    name: string;
    year: number;
  };
  student: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    programme: { name: string };
    yearOfStudy: number;
  };
  exams: ExamEntry[];
  instructions: string[];
  generatedAt: string;
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

function ExamCardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function ExamCardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <ScrollText className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load exam card</h3>
      <p className="mt-1 text-sm text-gray-500">
        Unable to fetch your exam card. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function ExamCardEmpty() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="rounded-full bg-gray-50 p-4">
        <ScrollText className="h-10 w-10 text-gray-300" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No exams scheduled</h3>
      <p className="mt-1 text-sm text-gray-500">
        There are no examinations scheduled for you at this time.
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Your exam card will appear here once exams are scheduled.
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ExamCardPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<ExamCardData>>({
    queryKey: ['exam-card'],
    queryFn: () => api.get('/academics/exam-card').then((res) => res.data),
  });

  const examCard = data?.data;

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return <ExamCardSkeleton />;
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (isError || !examCard) {
    return (
      <div className="p-6">
        <ExamCardError onRetry={() => refetch()} />
      </div>
    );
  }

  const { semester, student, exams, instructions, generatedAt } = examCard;
  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();

  // Check if there's any exam date conflict
  const dateCounts = exams.reduce<Record<string, number>>((acc, exam) => {
    acc[exam.date] = (acc[exam.date] || 0) + 1;
    return acc;
  }, {});
  const conflicts = Object.entries(dateCounts).filter(([, count]) => count > 1);

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
              <h1 className="text-2xl font-bold text-ku-navy">Examination Card</h1>
              <p className="text-sm text-gray-500">
                Your official exam schedule for the current semester
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="hidden items-center gap-2 sm:flex"
            onClick={() => toast.success('Print dialog opened (demo)')}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden"
            onClick={() => toast.success('Print dialog opened (demo)')}
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Exam Card Document */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-ku-navy/10 shadow-xl print:border-0">
          <CardContent className="p-0">
            {/* University Header */}
            <div className="border-b-2 border-ku-navy/10 bg-gradient-to-r from-ku-navy to-ku-blue p-6 text-center text-white sm:p-8">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-ku-gold shadow-lg">
                <University className="h-8 w-8 text-ku-navy" />
              </div>
              <h2 className="text-xl font-bold sm:text-2xl">KENYATTA UNIVERSITY</h2>
              <p className="mt-1 text-sm text-white/70">EXAMINATION CARD</p>
              <Badge className="mt-2 border-ku-gold/30 bg-ku-gold/20 text-ku-gold">
                {semester.name} - {semester.year}
              </Badge>
            </div>

            {/* Student Info */}
            <div className="border-b border-gray-100 p-6 sm:p-8">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <Avatar className="h-20 w-20 border-2 border-ku-gold shadow-md sm:h-24 sm:w-24">
                  <AvatarFallback className="bg-ku-gold/10 text-xl font-bold text-ku-gold sm:text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <div className="grid gap-3 sm:grid-cols-2">
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
                      <BookOpen className="h-4 w-4 text-ku-gold" />
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
                </div>
              </div>
            </div>

            {/* Exam Schedule */}
            <div className="p-6 sm:p-8">
              {exams.length === 0 ? (
                <ExamCardEmpty />
              ) : (
                <>
                  {/* Conflict Warning */}
                  {conflicts.length > 0 && (
                    <div className="mb-6 flex items-start gap-3 rounded-lg bg-yellow-50 p-4 text-yellow-800">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                      <div>
                        <p className="font-semibold">Schedule Conflict Detected</p>
                        <p className="mt-1 text-sm">
                          You have multiple exams scheduled on the same day (
                          {conflicts.map(([date]) => formatDate(date)).join(', ')}).
                          Please contact the examinations office.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course Code</TableHead>
                          <TableHead>Course Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Venue</TableHead>
                          <TableHead className="text-center">Seat No.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exams.map((exam, index) => (
                          <motion.tr
                            key={`${exam.courseCode}-${exam.date}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b transition-colors hover:bg-gray-50"
                          >
                            <TableCell className="font-mono text-sm font-medium text-ku-navy">
                              {exam.courseCode}
                            </TableCell>
                            <TableCell className="font-medium text-ku-navy">
                              {exam.courseName}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(exam.date, { dateStyle: 'medium' })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Clock className="h-3.5 w-3.5" />
                                {exam.time}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <MapPin className="h-3.5 w-3.5" />
                                {exam.venue}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono font-bold text-ku-navy">
                              {exam.seatNumber}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>

            {/* Exam Instructions */}
            <div className="border-t border-gray-100 bg-gray-50/50 p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-ku-navy" />
                <h3 className="font-bold text-ku-navy">Examination Instructions</h3>
              </div>
              <ol className="space-y-2">
                {instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ku-navy/10 text-xs font-bold text-ku-navy">
                      {index + 1}
                    </span>
                    {instruction}
                  </li>
                ))}
                {instructions.length === 0 && (
                  <li className="text-sm text-gray-400">
                    No specific instructions provided for this examination period.
                  </li>
                )}
              </ol>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4 text-center text-xs text-gray-400">
              <p>Generated on {formatDate(generatedAt, { dateStyle: 'full' })}</p>
              <p className="mt-1">
                This is a computer-generated examination card. Present it together with your
                University ID card at each examination venue.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Print Button (Mobile) */}
      <motion.div variants={itemVariants} className="flex justify-center sm:hidden">
        <Button
          className="flex w-full max-w-xs items-center gap-2 bg-ku-navy text-white hover:bg-ku-blue"
          onClick={() => toast.success('Print dialog opened (demo)')}
        >
          <Printer className="h-4 w-4" />
          Print Examination Card
        </Button>
      </motion.div>
    </motion.div>
  );
}
