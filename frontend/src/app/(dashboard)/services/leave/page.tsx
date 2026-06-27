'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  Loader2,
  Ban,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { cn, formatDate, formatDateTime, timeAgo, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface LeaveApplication {
  id: string;
  type: 'MEDICAL' | 'FAMILY' | 'PERSONAL' | 'ACADEMIC';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

// ── Zod Schema ──────────────────────────────────────────────────────────────

const leaveFormSchema = z.object({
  type: z.enum(['MEDICAL', 'FAMILY', 'PERSONAL', 'ACADEMIC'], {
    required_error: 'Please select a leave type',
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z
    .string()
    .min(10, 'Please provide at least 10 characters for the reason')
    .max(1000, 'Reason must not exceed 1000 characters'),
}).refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return new Date(data.endDate) >= new Date(data.startDate);
  },
  { message: 'End date must be on or after start date', path: ['endDate'] }
);

type LeaveFormData = z.infer<typeof leaveFormSchema>;

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ── Constants ──────────────────────────────────────────────────────────────

const LEAVE_TYPE_OPTIONS = [
  { value: 'MEDICAL', label: 'Medical Leave', icon: AlertCircle },
  { value: 'FAMILY', label: 'Family Leave', icon: Clock3 },
  { value: 'PERSONAL', label: 'Personal Leave', icon: Clock },
  { value: 'ACADEMIC', label: 'Academic Leave', icon: FileText },
] as const;

const STATUS_CONFIG: Record<string, { icon: React.ElementType; className: string }> = {
  PENDING: { icon: Clock3, className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  APPROVED: { icon: CheckCircle2, className: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { icon: XCircle, className: 'bg-red-50 text-red-700 border-red-200' },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) {
    return <Badge variant="secondary">{status}</Badge>;
  }
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', config.className)}>
      <Icon className="h-3.5 w-3.5" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
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
      <h3 className="mt-4 text-lg font-semibold">Failed to load leave applications</h3>
      <p className="mt-1 text-sm text-gray-500">
        Something went wrong. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-gray-900">No leave applications</h3>
      <p className="max-w-sm text-sm text-gray-500">
        You have not submitted any leave applications yet. Click the button above to apply.
      </p>
    </div>
  );
}

// ── Leave Form ─────────────────────────────────────────────────────────────

function LeaveFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      type: undefined,
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const selectedType = watch('type');

  const mutation = useMutation({
    mutationFn: async (formData: LeaveFormData) => {
      const { data } = await api.post<ApiResponse<LeaveApplication>>(
        '/students/leave-applications',
        formData
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-applications'] });
      toast.success('Leave application submitted successfully');
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to submit leave application';
      toast.error(message);
    },
  });

  const onSubmit = (formData: LeaveFormData) => {
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-ku-gold" />
            New Leave Application
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to submit a new leave application.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Leave Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Leave Type</label>
            <Select
              value={selectedType}
              onValueChange={(value) => setValue('type', value as LeaveFormData['type'])}
            >
              <SelectTrigger className={cn(errors.type && 'border-red-500')}>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <Input
                type="date"
                {...register('startDate')}
                className={cn(errors.startDate && 'border-red-500')}
              />
              {errors.startDate && (
                <p className="text-xs text-red-500">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                {...register('endDate')}
                className={cn(errors.endDate && 'border-red-500')}
              />
              {errors.endDate && (
                <p className="text-xs text-red-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Reason</label>
            <textarea
              {...register('reason')}
              rows={4}
              placeholder="Please provide a detailed reason for your leave application..."
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                errors.reason && 'border-red-500'
              )}
            />
            {errors.reason && (
              <p className="text-xs text-red-500">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={mutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-ku-navy text-white hover:bg-ku-blue"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function LeavePage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: applications,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['leave-applications'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<LeaveApplication[]>>(
        '/students/leave-applications'
      );
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const hasApplications = applications && applications.length > 0;

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
            <FileText className="h-5 w-5 text-ku-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ku-navy">Leave Applications</h1>
            <p className="text-sm text-gray-500">Apply for and track your leave requests</p>
          </div>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-ku-navy text-white hover:bg-ku-blue shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-ku-navy">Leave Applications</CardTitle>
            <CardDescription>
              {hasApplications
                ? `You have submitted ${applications.length} leave application(s)`
                : 'Your leave application history'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {hasApplications ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead className="hidden md:table-cell">Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Applied</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app, index) => (
                        <motion.tr
                          key={app.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {LEAVE_TYPE_OPTIONS.find((o) => o.value === app.type) ? (
                                (() => {
                                  const OptionIcon = LEAVE_TYPE_OPTIONS.find((o) => o.value === app.type)!.icon;
                                  return <OptionIcon className="h-4 w-4 text-ku-navy" />;
                                })()
                              ) : null}
                              <span className="font-medium capitalize">
                                {app.type.toLowerCase()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm">{formatDate(app.startDate)}</span>
                              <span className="text-xs text-gray-400">to {formatDate(app.endDate)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <p className="max-w-xs truncate text-sm text-gray-600">
                              {app.reason}
                            </p>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={app.status} />
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-sm text-gray-500">{timeAgo(app.createdAt)}</span>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <EmptyState />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Leave Form Dialog */}
      <LeaveFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </motion.div>
  );
}
