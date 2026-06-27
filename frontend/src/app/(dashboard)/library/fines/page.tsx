'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Book,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Library,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface LibraryFine {
  id: string;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
  };
  amount: number;
  reason: string;
  status: 'OUTSTANDING' | 'PAID' | 'WAIVED';
  issuedDate: string;
  paidDate?: string;
  daysOverdue: number;
}

interface LibraryFinesData {
  fines: LibraryFine[];
  totalOutstanding: number;
  totalPaid: number;
  fineCount: number;
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

// ── Skeleton ───────────────────────────────────────────────────────────────

function FinesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-36" />
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function FinesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <DollarSign className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load fines</h3>
      <p className="mt-1 text-sm text-gray-500">
        Something went wrong. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function FinesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-green-50 p-4">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No Fines</h3>
      <p className="mt-1 text-sm text-gray-500">
        You have no library fines. Great job returning books on time!
      </p>
    </div>
  );
}

// ── Fine Row ───────────────────────────────────────────────────────────────

function FineRow({
  fine,
  index,
}: {
  fine: LibraryFine;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isOutstanding = fine.status === 'OUTSTANDING';

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'rounded-lg border p-4 transition-all duration-200',
        isOutstanding
          ? 'border-red-200 bg-red-50/30 hover:bg-red-50/60'
          : fine.status === 'PAID'
            ? 'border-green-200 bg-green-50/30'
            : 'border-gray-200'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'rounded-lg p-2.5',
              isOutstanding
                ? 'bg-red-100 text-red-600'
                : fine.status === 'PAID'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600'
            )}
          >
            <Book className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">
                {fine.book.title}
              </h4>
              <Badge
                className={cn('text-xs', getStatusColor(fine.status))}
                variant="secondary"
              >
                {fine.status}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{fine.book.author}</p>
            <p className="text-xs text-gray-400 font-mono">ISBN: {fine.book.isbn}</p>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>Issued: {formatDate(fine.issuedDate)}</span>
              <span>Overdue by: {fine.daysOverdue} days</span>
              <span>Reason: {fine.reason}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={cn(
              'text-lg font-bold',
              isOutstanding ? 'text-red-600' : fine.status === 'PAID' ? 'text-green-600' : 'text-gray-600'
            )}
          >
            {formatCurrency(fine.amount)}
          </span>
          {isOutstanding && (
            <Button size="sm" className="bg-ku-navy text-white hover:bg-ku-blue">
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Pay Fine
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function LibraryFinesPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<LibraryFinesData>>({
    queryKey: ['library-fines'],
    queryFn: () => api.get('/library/fines').then((r) => r.data),
  });

  const finesData = data?.data;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-36" />
        <FinesSkeleton />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-6">
        <FinesError onRetry={() => refetch()} />
      </div>
    );
  }

  const fines = finesData?.fines || [];
  const outstandingFines = fines.filter((f) => f.status === 'OUTSTANDING');
  const paidFines = fines.filter((f) => f.status === 'PAID');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-ku-navy">Library Fines</h1>
        <p className="text-sm text-gray-500">Manage your library fine payments</p>
      </motion.div>

      {/* Summary */}
      {finesData && (
        <div className="grid gap-6 md:grid-cols-3">
          <motion.div variants={itemVariants}>
            <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-600 p-2.5 text-white">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-700">Outstanding Fines</p>
                    <p className="text-2xl font-bold text-red-900">
                      {formatCurrency(finesData.totalOutstanding)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-600 p-2.5 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Paid</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(finesData.totalPaid || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Fines</p>
                    <p className="text-2xl font-bold text-ku-navy">{finesData.fineCount || fines.length}</p>
                    <p className="text-xs text-gray-400">
                      {outstandingFines.length} outstanding
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Outstanding Fines */}
      {outstandingFines.length > 0 && (
        <>
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ku-navy">Outstanding Fines</h2>
                <p className="text-sm text-gray-500">
                  {outstandingFines.length} fine{outstandingFines.length !== 1 ? 's' : ''} need payment
                </p>
              </div>
              {finesData && finesData.totalOutstanding > 0 && (
                <Button className="bg-ku-navy text-white hover:bg-ku-blue">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay All Outstanding
                </Button>
              )}
            </div>
          </motion.div>

          <div className="space-y-3">
            {outstandingFines.map((fine, i) => (
              <FineRow key={fine.id} fine={fine} index={i} />
            ))}
          </div>
        </>
      )}

      {/* Paid Fines */}
      {paidFines.length > 0 && (
        <>
          <motion.div variants={itemVariants}>
            <h2 className="text-lg font-semibold text-ku-navy">Payment History</h2>
            <p className="text-sm text-gray-500">
              {paidFines.length} fine{paidFines.length !== 1 ? 's' : ''} paid
            </p>
          </motion.div>

          <div className="space-y-3">
            {paidFines.map((fine, i) => (
              <FineRow key={fine.id} fine={fine} index={i} />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {fines.length === 0 && <FinesEmpty />}
    </motion.div>
  );
}
