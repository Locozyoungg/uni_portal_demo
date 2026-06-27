'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Library,
  CreditCard,
  Home,
  BookOpen,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface ClearanceItem {
  id: string;
  department: string;
  status: 'CLEARED' | 'PENDING' | 'IN_PROGRESS';
  clearedBy?: string;
  clearedDate?: string;
  remarks?: string;
}

interface ClearanceData {
  overallProgress: number;
  items: ClearanceItem[];
  canRequestClearance: boolean;
  clearanceRequested?: boolean;
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ── Constants ──────────────────────────────────────────────────────────────

const DEPARTMENT_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  LIBRARY: { icon: Library, color: 'text-blue-600 bg-blue-50' },
  FINANCE: { icon: CreditCard, color: 'text-green-600 bg-green-50' },
  HOSTEL: { icon: Home, color: 'text-purple-600 bg-purple-50' },
  ACADEMIC: { icon: BookOpen, color: 'text-orange-600 bg-orange-50' },
  ADMINISTRATION: { icon: Building2, color: 'text-ku-navy bg-ku-navy/5' },
};

const STATUS_DISPLAY: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  CLEARED: { icon: CheckCircle2, label: 'Cleared', className: 'bg-green-50 text-green-700 border-green-200' },
  PENDING: { icon: Clock, label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  IN_PROGRESS: { icon: AlertCircle, label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const DEPARTMENT_LABELS: Record<string, string> = {
  LIBRARY: 'Library',
  FINANCE: 'Finance',
  HOSTEL: 'Hostel',
  ACADEMIC: 'Academic',
  ADMINISTRATION: 'Administration',
};

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_DISPLAY[status];
  if (!config) return <Badge variant="secondary">{status}</Badge>;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', config.className)}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Failed to load clearance data</h3>
      <p className="mt-1 text-sm text-gray-500">
        Unable to fetch your clearance status. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Clearance Item Card ────────────────────────────────────────────────────

function ClearanceItemCard({
  item,
  index,
}: {
  item: ClearanceItem;
  index: number;
}) {
  const config = DEPARTMENT_CONFIG[item.department] || {
    icon: Building2,
    color: 'text-gray-600 bg-gray-50',
  };
  const Icon = config.icon;
  const isCleared = item.status === 'CLEARED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Card
        className={cn(
          'transition-all duration-300 hover:shadow-md',
          isCleared && 'border-green-200 bg-green-50/30'
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className={cn('mt-1 rounded-lg p-2.5 shrink-0', config.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-ku-navy">
                  {DEPARTMENT_LABELS[item.department] || item.department}
                </h3>
                {isCleared && item.clearedBy && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    Cleared by: {item.clearedBy}
                  </p>
                )}
                {isCleared && item.clearedDate && (
                  <p className="text-xs text-gray-400">
                    {formatDate(item.clearedDate)}
                  </p>
                )}
                {item.remarks && (
                  <p className="mt-1 text-xs text-gray-400">{item.remarks}</p>
                )}
                {!isCleared && (
                  <p className="mt-1 text-xs text-gray-400">
                    {item.status === 'PENDING' ? 'Awaiting clearance' : 'Processing your request'}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <StatusBadge status={item.status} />
            </div>
          </div>

          {/* Progress indicator for non-cleared items */}
          {!isCleared && (
            <div className="mt-4">
              <Progress
                value={item.status === 'IN_PROGRESS' ? 50 : 10}
                className="h-1.5"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ClearancePage() {
  const queryClient = useQueryClient();

  const {
    data: clearance,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['clearance-status'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<ClearanceData>>(
        '/students/clearance'
      );
      return res.data;
    },
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<{ message: string }>>(
        '/students/clearance/request'
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clearance-status'] });
      toast.success('Clearance request submitted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to request clearance';
      toast.error(message);
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError || !clearance) {
    return (
      <div className="p-6">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const clearedCount = clearance.items.filter((i) => i.status === 'CLEARED').length;
  const totalCount = clearance.items.length;
  const allCleared = clearedCount === totalCount && totalCount > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ku-navy/10">
            <ClipboardCheck className="h-5 w-5 text-ku-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ku-navy">Clearance Status</h1>
            <p className="text-sm text-gray-500">
              Track your graduation clearance progress
            </p>
          </div>
        </div>
        <Button
          onClick={() => requestMutation.mutate()}
          disabled={requestMutation.isPending || allCleared}
          className="bg-ku-navy text-white hover:bg-ku-blue shrink-0"
        >
          {requestMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Requesting...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {clearance.clearanceRequested ? 'Requested' : 'Request Clearance'}
            </>
          )}
        </Button>
      </motion.div>

      {/* Overall Progress */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-ku-navy to-ku-blue text-white">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-ku-gold/10" />
          <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/5" />
          <CardContent className="relative z-10 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-white/70">Overall Clearance Progress</p>
                <p className="mt-1 text-3xl font-bold">
                  {clearance.overallProgress}%
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {clearedCount} of {totalCount} departments cleared
                </p>
              </div>
              <div className="flex flex-col items-center sm:items-end gap-1">
                {allCleared ? (
                  <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="font-semibold text-green-400">All Cleared</span>
                  </div>
                ) : (
                  <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                    {totalCount - clearedCount} remaining
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={clearance.overallProgress}
                className="h-2.5 bg-white/20"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clearance Items */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-ku-navy">Department Checklist</CardTitle>
            <CardDescription>
              Each department must clear you before graduation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {clearance.items.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {clearance.items.map((item, index) => (
                    <ClearanceItemCard key={item.id} item={item} index={index} />
                  ))}
                </div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-12 text-center"
                >
                  <ClipboardCheck className="h-12 w-12 text-gray-300" />
                  <h3 className="mt-3 text-lg font-semibold text-gray-900">
                    No clearance data yet
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    Your clearance checklist will appear here once you request clearance.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
