'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Loader2,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronUp,
  Home,
  Flag,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatDate, formatDateTime, getStatusColor, timeAgo } from '@/lib/utils';
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface MaintenanceRequest {
  id: string;
  room: string;
  issue: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  createdAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  notes?: string;
}

interface NewRequest {
  room: string;
  issue: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
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

// ── Priority Config ────────────────────────────────────────────────────────

const priorityConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  LOW: { icon: Flag, label: 'Low', className: 'bg-gray-50 text-gray-600' },
  MEDIUM: { icon: Flag, label: 'Medium', className: 'bg-blue-50 text-blue-600' },
  HIGH: { icon: Flag, label: 'High', className: 'bg-orange-50 text-orange-600' },
  URGENT: { icon: AlertTriangle, label: 'Urgent', className: 'bg-red-50 text-red-600' },
};

// ── Skeleton ───────────────────────────────────────────────────────────────

function MaintenanceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-36" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function MaintenanceError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <Wrench className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load maintenance requests</h3>
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

function MaintenanceEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-gray-50 p-4">
        <Wrench className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No maintenance requests</h3>
      <p className="mt-1 text-sm text-gray-500">
        You haven&apos;t submitted any maintenance requests yet.
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<MaintenanceRequest[]>>({
    queryKey: ['maintenance-requests'],
    queryFn: () => api.get('/hostel/maintenance').then((r) => r.data),
  });

  const requests = data?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: NewRequest) =>
      api.post('/hostel/maintenance', payload),
    onSuccess: () => {
      toast.success('Maintenance request submitted!');
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
    },
    onError: () => {
      toast.error('Failed to submit request. Please try again.');
    },
  });

  const resetForm = () => {
    setNewRoom('');
    setNewIssue('');
    setNewPriority('MEDIUM');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.trim() || !newIssue.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    createMutation.mutate({ room: newRoom.trim(), issue: newIssue.trim(), priority: newPriority });
  };

  // Summary
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS').length;
  const resolvedCount = requests.filter((r) => r.status === 'RESOLVED').length;
  const urgentCount = requests.filter((r) => r.priority === 'URGENT' && r.status !== 'RESOLVED' && r.status !== 'CANCELLED').length;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-36" />
        <MaintenanceSkeleton />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-6">
        <MaintenanceError onRetry={() => refetch()} />
      </div>
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
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ku-navy">Maintenance Requests</h1>
            <p className="text-sm text-gray-500">
              Report and track hostel maintenance issues
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-ku-navy text-white hover:bg-ku-blue">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Maintenance Request</DialogTitle>
                <DialogDescription>
                  Describe the issue you&apos;re experiencing in your room.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Room <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      placeholder="e.g. Block A, Room 12"
                      className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-ku-blue focus:outline-none focus:ring-1 focus:ring-ku-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Issue <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={newIssue}
                      onChange={(e) => setNewIssue(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      className="mt-1 min-h-[100px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Priority</label>
                    <Select value={newPriority} onValueChange={(v: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => setNewPriority(v)}>
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-ku-navy text-white hover:bg-ku-blue"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-50 p-2.5 text-yellow-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-xl font-bold text-ku-navy">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">In Progress</p>
                  <p className="text-xl font-bold text-ku-navy">{inProgressCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2.5 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Resolved</p>
                  <p className="text-xl font-bold text-ku-navy">{resolvedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card
            className={cn(
              urgentCount > 0 ? 'border-red-200 bg-red-50/30' : ''
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'rounded-lg p-2.5',
                    urgentCount > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'
                  )}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Urgent</p>
                  <p
                    className={cn(
                      'text-xl font-bold',
                      urgentCount > 0 ? 'text-red-700' : 'text-gray-500'
                    )}
                  >
                    {urgentCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Requests Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-ku-navy">All Requests</CardTitle>
              <CardDescription>{requests.length} total requests</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <MaintenanceEmpty />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => {
                      const priority = priorityConfig[request.priority] || priorityConfig.MEDIUM;
                      const PriorityIcon = priority.icon;
                      return (
                        <TableRow
                          key={request.id}
                          className={cn(
                            'group',
                            request.priority === 'URGENT' && request.status !== 'RESOLVED'
                              ? 'bg-red-50/30'
                              : ''
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{request.room}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                {request.issue}
                              </p>
                              {request.description && (
                                <p className="text-xs text-gray-500 line-clamp-1">
                                  {request.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={cn('text-xs', priority.className)}>
                              <PriorityIcon className="mr-1 h-3 w-3" />
                              {priority.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn('text-xs', getStatusColor(request.status))}
                              variant="secondary"
                            >
                              {request.status === 'IN_PROGRESS' ? 'In Progress' : request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                            {formatDate(request.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {request.assignedTo || (
                              <span className="text-gray-400">Unassigned</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
