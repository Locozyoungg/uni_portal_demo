'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  DollarSign,
  CreditCard,
  Receipt,
  Download,
  Banknote,
  GraduationCap,
  BookOpen,
  Home,
  FileText,
  ShieldCheck,
  Building2,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface FeeItem {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'CHARGE' | 'PAYMENT';
  date: string;
}

interface FeeStatement {
  id: string;
  semester: string;
  academicYear: string;
  items: FeeItem[];
  totalCharges: number;
  totalPayments: number;
  balance: number;
  status: 'CLEAR' | 'OUTSTANDING' | 'PARTIAL' | 'OVERPAID';
  generatedAt: string;
}

interface Semester {
  id: string;
  name: string;
  year: number;
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

// ── Fee Category Icon ──────────────────────────────────────────────────────

function getFeeCategoryIcon(category: string) {
  const icons: Record<string, React.ElementType> = {
    TUITION: GraduationCap,
    LIBRARY: BookOpen,
    HOSTEL: Home,
    REGISTRATION: FileText,
    EXAMINATION: ShieldCheck,
    CAUTION: Banknote,
    STUDENT_COUNCIL: Building2,
    ICT: CreditCard,
    ACTIVITY: CreditCard,
  };
  return icons[category] || Receipt;
}

function getFeeCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    TUITION: 'bg-blue-50 text-blue-600',
    LIBRARY: 'bg-purple-50 text-purple-600',
    HOSTEL: 'bg-green-50 text-green-600',
    REGISTRATION: 'bg-orange-50 text-orange-600',
    EXAMINATION: 'bg-red-50 text-red-600',
    CAUTION: 'bg-teal-50 text-teal-600',
    STUDENT_COUNCIL: 'bg-pink-50 text-pink-600',
    ICT: 'bg-indigo-50 text-indigo-600',
    ACTIVITY: 'bg-amber-50 text-amber-600',
  };
  return colors[category] || 'bg-gray-50 text-gray-600';
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function StatementSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-36" />
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function StatementError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <Receipt className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load fee statement</h3>
      <p className="mt-1 text-sm text-gray-500">
        Something went wrong while fetching your statement. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function StatementEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-gray-50 p-4">
        <Receipt className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No statement available</h3>
      <p className="mt-1 text-sm text-gray-500">
        No fee statement has been generated for the selected semester.
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function FeeStatementPage() {
  const { user } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState<string>('current');

  // Fetch available semesters
  const { data: semestersData, isLoading: semestersLoading } = useQuery<
    ApiResponse<Semester[]>
  >({
    queryKey: ['fee-semesters'],
    queryFn: () => api.get('/finance/semesters').then((r) => r.data),
  });

  const semesters = semestersData?.data || [];

  // Fetch fee statement
  const {
    data: statementData,
    isLoading: statementLoading,
    isError: statementError,
    refetch,
  } = useQuery<ApiResponse<FeeStatement>>({
    queryKey: ['fee-statement', selectedSemester],
    queryFn: () =>
      api
        .get('/finance/statement', { params: { semesterId: selectedSemester } })
        .then((r) => r.data),
    enabled: selectedSemester !== 'current' || !semestersLoading,
  });

  // Payment simulation mutation
  const paymentMutation = useMutation({
    mutationFn: () => api.post('/finance/statement/pay', { semesterId: selectedSemester }),
    onSuccess: () => {
      toast.success('Payment simulated successfully!', {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
      refetch();
    },
    onError: () => {
      toast.error('Payment simulation failed. Please try again.');
    },
  });

  const statement = statementData?.data;
  const isLoading = (semestersLoading && semesters.length === 0) || statementLoading;
  const isError = statementError && !statementLoading;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ku-navy">Fee Statement</h1>
            <p className="text-sm text-gray-500">
              View your detailed fee breakdown for each semester
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Semester</SelectItem>
                {semesters.map((sem) => (
                  <SelectItem key={sem.id} value={sem.id}>
                    {sem.name} - {sem.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {statement && (
              <Button variant="outline" size="icon" className="shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && <StatementSkeleton />}

      {/* Error */}
      {isError && !isLoading && <StatementError onRetry={() => refetch()} />}

      {/* Content */}
      {!isLoading && !isError && statement && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Total Charges */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-600 p-2.5 text-white">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Charges</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(statement.totalCharges)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Payments */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-600 p-2.5 text-white">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700">Total Payments</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(statement.totalPayments)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Balance */}
            <motion.div variants={itemVariants}>
              <Card
                className={cn(
                  'border-0',
                  statement.balance <= 0
                    ? 'bg-gradient-to-br from-green-50 to-green-100'
                    : 'bg-gradient-to-br from-red-50 to-red-100'
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'rounded-lg p-2.5 text-white',
                          statement.balance <= 0 ? 'bg-green-600' : 'bg-red-600'
                        )}
                      >
                        {statement.balance <= 0 ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Banknote className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Balance</p>
                        <p
                          className={cn(
                            'text-2xl font-bold',
                            statement.balance <= 0 ? 'text-green-900' : 'text-red-900'
                          )}
                        >
                          {statement.balance <= 0
                            ? formatCurrency(Math.abs(statement.balance))
                            : formatCurrency(statement.balance)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'text-xs px-3 py-1',
                        getStatusColor(statement.status)
                      )}
                    >
                      {statement.status === 'CLEAR'
                        ? 'CLEAR'
                        : statement.status === 'OUTSTANDING'
                          ? 'OUTSTANDING'
                          : statement.status === 'PARTIAL'
                            ? 'PARTIAL'
                            : 'OVERPAID'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Fee Items Table */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-ku-navy">Fee Breakdown</CardTitle>
                  <CardDescription>
                    {statement.semester} - {statement.academicYear}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {statement.items.length} items
                </Badge>
              </CardHeader>
              <CardContent>
                {statement.items.length === 0 ? (
                  <StatementEmpty />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statement.items.map((item) => {
                        const Icon = getFeeCategoryIcon(item.category);
                        return (
                          <TableRow key={item.id} className="group">
                            <TableCell>
                              <div
                                className={cn(
                                  'rounded-lg p-1.5',
                                  getFeeCategoryColor(item.category)
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-gray-900">{item.description}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs font-normal">
                                {item.category.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(item.date)}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.type === 'CHARGE' ? (
                                <span className="font-semibold text-red-600">
                                  {formatCurrency(item.amount)}
                                </span>
                              ) : (
                                <span className="font-semibold text-green-600">
                                  -{formatCurrency(item.amount)}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Button + Meta */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-xs text-gray-400">
              Statement generated on {formatDate(statement.generatedAt)}
            </p>
            {statement.balance > 0 && (
              <Button
                onClick={() => paymentMutation.mutate()}
                disabled={paymentMutation.isPending}
                className="bg-ku-navy text-white hover:bg-ku-blue"
              >
                {paymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Make Payment
                  </>
                )}
              </Button>
            )}
          </motion.div>
        </>
      )}

      {/* No statement state */}
      {!isLoading && !isError && !statement && (
        <StatementEmpty />
      )}
    </motion.div>
  );
}
