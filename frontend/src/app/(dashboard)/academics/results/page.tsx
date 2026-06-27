'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3,
  AlertCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  GraduationCap,
  Award,
  PieChart,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────

interface CourseResult {
  id: string;
  course: {
    code: string;
    name: string;
    credits: number;
  };
  grade: string;
  marks: number;
  status: string;
}

interface SemesterResult {
  id: string;
  name: string;
  year: number;
  gpa: number;
  totalCredits: number;
  courses: CourseResult[];
}

interface ResultsData {
  semesters: SemesterResult[];
  currentGpa: number;
  currentSemester: string;
}

// ── Grade Colors ───────────────────────────────────────────────────────────

function getGradeColor(grade: string): string {
  const topGrades = ['A', 'A-', 'B+'];
  const midGrades = ['B', 'B-', 'C+'];
  const lowGrades = ['C', 'C-', 'D+'];
  const failGrades = ['D', 'D-', 'E', 'F'];

  if (topGrades.includes(grade)) return 'text-green-600 bg-green-50';
  if (midGrades.includes(grade)) return 'text-blue-600 bg-blue-50';
  if (lowGrades.includes(grade)) return 'text-yellow-600 bg-yellow-50';
  if (failGrades.includes(grade)) return 'text-red-600 bg-red-50';
  return 'text-gray-600 bg-gray-50';
}

const CHART_COLORS = [
  '#1e3a5f', '#d4a843', '#1565c0', '#2ecc71',
  '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c',
];

const GRADE_LABELS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E', 'F'];

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

function ResultsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function ResultsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <BarChart3 className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load results</h3>
      <p className="mt-1 text-sm text-gray-500">
        Unable to fetch your exam results. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── GPA Trend Indicator ────────────────────────────────────────────────────

function GpaTrend({ gpa }: { gpa: number }) {
  if (gpa >= 3.5) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (gpa >= 2.5) return <Minus className="h-4 w-4 text-yellow-500" />;
  return <TrendingDown className="h-4 w-4 text-red-500" />;
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [selectedSemester, setSelectedSemester] = useState<string>('current');

  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<ResultsData>>({
    queryKey: ['results'],
    queryFn: () => api.get('/academics/results').then((res) => res.data),
  });

  const resultsData = data?.data;

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return <ResultsSkeleton />;
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (isError || !resultsData) {
    return (
      <div className="p-6">
        <ResultsError onRetry={() => refetch()} />
      </div>
    );
  }

  const { semesters, currentGpa, currentSemester } = resultsData;

  // Determine which semester results to show
  const activeSemester =
    selectedSemester === 'current'
      ? semesters[semesters.length - 1]
      : semesters.find((s) => s.id === selectedSemester) || semesters[semesters.length - 1];

  // Grade distribution for pie chart
  const gradeDistribution = GRADE_LABELS.map((grade) => ({
    name: grade,
    value: activeSemester?.courses.filter((c) => c.grade === grade).length || 0,
  })).filter((g) => g.value > 0);

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
            <h1 className="text-2xl font-bold text-ku-navy">Exam Results</h1>
            <p className="text-sm text-gray-500">
              View your academic performance across semesters
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
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Current GPA</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-ku-navy">
                    {currentGpa.toFixed(2)}
                  </p>
                  <GpaTrend gpa={currentGpa} />
                </div>
                <p className="text-xs text-gray-400">{currentSemester}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-ku-gold/10 p-3 text-ku-gold">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Semester GPA</p>
                <p className="text-2xl font-bold text-ku-navy">
                  {activeSemester?.gpa.toFixed(2) || 'N/A'}
                </p>
                <p className="text-xs text-gray-400">{activeSemester?.name || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-green-50 p-3 text-green-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Courses Completed</p>
                <p className="text-2xl font-bold text-ku-navy">
                  {activeSemester?.courses.length || 0}
                </p>
                <p className="text-xs text-gray-400">{activeSemester?.totalCredits || 0} credits</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Semester Filter + Content */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg text-ku-navy">Course Results</CardTitle>
              <CardDescription>Detailed marks and grades per course</CardDescription>
            </div>
            <div className="w-full sm:w-56">
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Semester</SelectItem>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id}>
                      {sem.name} ({sem.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!activeSemester || activeSemester.courses.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <FileText className="h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No results available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No exam results found for the selected semester.
                </p>
              </div>
            ) : (
              <>
                {/* Results Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Code</TableHead>
                        <TableHead>Course Name</TableHead>
                        <TableHead className="text-center">Credits</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">Marks</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSemester.courses.map((result, index) => (
                        <motion.tr
                          key={result.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="border-b transition-colors hover:bg-gray-50"
                        >
                          <TableCell className="font-mono text-sm font-medium text-ku-navy">
                            {result.course.code}
                          </TableCell>
                          <TableCell className="font-medium text-ku-navy">
                            {result.course.name}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {result.course.credits}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={cn('font-mono font-bold', getGradeColor(result.grade))}
                            >
                              {result.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-ku-navy">
                            {result.marks}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={cn(
                                result.status === 'PASS'
                                  ? 'bg-green-50 text-green-600'
                                  : result.status === 'FAIL'
                                    ? 'bg-red-50 text-red-600'
                                    : result.status === 'SUPPLEMENTARY'
                                      ? 'bg-yellow-50 text-yellow-600'
                                      : 'bg-gray-50 text-gray-600'
                              )}
                            >
                              {result.status || 'N/A'}
                            </Badge>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Grade Distribution Chart */}
                {gradeDistribution.length > 0 && (
                  <div className="rounded-lg border bg-gray-50/50 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-ku-navy" />
                      <h3 className="font-semibold text-ku-navy">Grade Distribution</h3>
                    </div>
                    <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
                      <div className="h-64 w-full max-w-sm">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={gradeDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) =>
                                `${name} (${(percent * 100).toFixed(0)}%)`
                              }
                              labelLine
                            >
                              {gradeDistribution.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              }}
                              formatter={(value: number, name: string) => [`${value} course(s)`, `Grade ${name}`]}
                            />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 flex w-full flex-wrap justify-center gap-2 md:mt-0 md:w-auto">
                        {gradeDistribution.map((g, i) => (
                          <div key={g.name} className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-sm"
                              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                            <span className="text-xs text-gray-600">
                              {g.name}: {g.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
