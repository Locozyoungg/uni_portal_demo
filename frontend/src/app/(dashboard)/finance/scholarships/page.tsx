'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Award,
  Calendar,
  DollarSign,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Medal,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────────────────

interface Scholarship {
  id: string;
  name: string;
  provider: string;
  type: string;
  amount: number;
  amountPer: 'SEMESTER' | 'YEAR' | 'ONE_TIME';
  currency: string;
  applicationDeadline?: string;
  status: 'ACTIVE' | 'APPLIED' | 'AWARDED' | 'EXPIRED' | 'REJECTED';
  awardDate?: string;
  startDate?: string;
  endDate?: string;
  description: string;
  requirements: string[];
  renewable: boolean;
}

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ── Scholarship type icon ──────────────────────────────────────────────────

function getScholarshipTypeIcon(type: string) {
  const icons: Record<string, React.ElementType> = {
    MERIT: Medal,
    NEED: Award,
    SPORTS: Medal,
    LEADERSHIP: Award,
    DEPARTMENTAL: GraduationCap,
    EXTERNAL: Building2,
  };
  return icons[type] || Award;
}

function getScholarshipTypeColor(type: string): string {
  const colors: Record<string, string> = {
    MERIT: 'bg-yellow-50 text-yellow-600',
    NEED: 'bg-green-50 text-green-600',
    SPORTS: 'bg-blue-50 text-blue-600',
    LEADERSHIP: 'bg-purple-50 text-purple-600',
    DEPARTMENTAL: 'bg-orange-50 text-orange-600',
    EXTERNAL: 'bg-pink-50 text-pink-600',
  };
  return colors[type] || 'bg-gray-50 text-gray-600';
}

// ── Amount Per Badge ───────────────────────────────────────────────────────

function getAmountPerLabel(amountPer: string): string {
  const labels: Record<string, string> = {
    SEMESTER: 'per semester',
    YEAR: 'per year',
    ONE_TIME: 'one-time',
  };
  return labels[amountPer] || '';
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function ScholarshipsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-40" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function ScholarshipsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <Award className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load scholarships</h3>
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

function ScholarshipsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-gray-50 p-4">
        <Award className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No scholarships</h3>
      <p className="mt-1 text-sm text-gray-500">
        You don&apos;t have any scholarships yet. Check back later for opportunities.
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ScholarshipsPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<Scholarship[]>>({
    queryKey: ['scholarships'],
    queryFn: () => api.get('/finance/scholarships').then((r) => r.data),
  });

  const scholarships = data?.data || [];

  const activeScholarships = scholarships.filter((s) => s.status === 'ACTIVE' || s.status === 'AWARDED');
  const otherScholarships = scholarships.filter((s) => s.status !== 'ACTIVE' && s.status !== 'AWARDED');

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <ScholarshipsSkeleton />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-6">
        <ScholarshipsError onRetry={() => refetch()} />
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (scholarships.length === 0) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 p-6"
      >
        <motion.div variants={cardVariants}>
          <h1 className="text-2xl font-bold text-ku-navy">Scholarships</h1>
          <p className="text-sm text-gray-500">View your awarded scholarships and available opportunities</p>
        </motion.div>
        <ScholarshipsEmpty />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={cardVariants}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ku-navy">Scholarships</h1>
            <p className="text-sm text-gray-500">
              View your awarded scholarships and available opportunities
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {activeScholarships.length} active
          </Badge>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {activeScholarships.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div variants={cardVariants}>
            <Card className="border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-yellow-600 p-2.5 text-white">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Active Scholarships</p>
                    <p className="text-2xl font-bold text-yellow-900">{activeScholarships.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-600 p-2.5 text-white">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Awarded</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(
                        activeScholarships.reduce((sum, s) => sum + s.amount, 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Other Applications</p>
                    <p className="text-2xl font-bold text-ku-navy">{otherScholarships.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Active / Awarded Scholarships */}
      {activeScholarships.length > 0 && (
        <>
          <motion.div variants={cardVariants}>
            <h2 className="text-lg font-semibold text-ku-navy">Active Scholarships</h2>
            <p className="text-sm text-gray-500">Scholarships currently awarded to you</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeScholarships.map((scholarship, i) => {
              const Icon = getScholarshipTypeIcon(scholarship.type);
              return (
                <motion.div key={scholarship.id} variants={cardVariants}>
                  <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="p-6">
                      {/* Icon + Status */}
                      <div className="flex items-start justify-between">
                        <div className={cn('rounded-lg p-3', getScholarshipTypeColor(scholarship.type))}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <Badge
                          className={getStatusColor(scholarship.status)}
                          variant="secondary"
                        >
                          {scholarship.status === 'ACTIVE' ? 'Active' : 'Awarded'}
                        </Badge>
                      </div>

                      {/* Name + Provider */}
                      <h3 className="mt-4 text-lg font-semibold text-ku-navy">{scholarship.name}</h3>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                        <Building2 className="h-3.5 w-3.5" />
                        {scholarship.provider}
                      </div>

                      {/* Amount */}
                      <div className="mt-4 rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Award Amount</p>
                        <p className="text-xl font-bold text-ku-navy">
                          {formatCurrency(scholarship.amount)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {getAmountPerLabel(scholarship.amountPer)}
                          {scholarship.renewable && ' (renewable)'}
                        </p>
                      </div>

                      {/* Period */}
                      {scholarship.startDate && (
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(scholarship.startDate)}
                          </div>
                          {scholarship.endDate && (
                            <>
                              <span>&rarr;</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(scholarship.endDate)}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {scholarship.description && (
                        <p className="mt-3 text-xs text-gray-500 line-clamp-2">
                          {scholarship.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Other Scholarships */}
      {otherScholarships.length > 0 && (
        <>
          <motion.div variants={cardVariants} className="mt-2">
            <h2 className="text-lg font-semibold text-ku-navy">Applications & History</h2>
            <p className="text-sm text-gray-500">Previous applications and past scholarships</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherScholarships.map((scholarship, i) => {
              const Icon = getScholarshipTypeIcon(scholarship.type);
              return (
                <motion.div key={scholarship.id} variants={cardVariants}>
                  <Card className="h-full opacity-75 transition-all duration-300 hover:opacity-100">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className={cn('rounded-lg p-2', getScholarshipTypeColor(scholarship.type))}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <Badge
                          className={getStatusColor(scholarship.status)}
                          variant="secondary"
                        >
                          {scholarship.status}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-ku-navy">{scholarship.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{scholarship.provider}</p>
                      <p className="mt-2 text-sm font-semibold text-ku-navy">
                        {formatCurrency(scholarship.amount)}
                      </p>
                      {scholarship.awardDate && (
                        <p className="mt-2 text-xs text-gray-400">
                          Awarded: {formatDate(scholarship.awardDate)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
