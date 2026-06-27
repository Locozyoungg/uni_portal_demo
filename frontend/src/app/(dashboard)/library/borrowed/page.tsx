'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Book,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  Loader2,
  User,
  Hash,
  DollarSign,
  Library,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface BorrowedBook {
  id: string;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    coverUrl?: string;
  };
  borrowedDate: string;
  dueDate: string;
  returnedDate?: string;
  status: 'BORROWED' | 'OVERDUE' | 'RETURNED' | 'LOST';
  fineAmount: number;
  renewCount: number;
}

interface BorrowedBooksData {
  borrowed: BorrowedBook[];
  summary: {
    totalBorrowed: number;
    overdueCount: number;
    totalFines: number;
    returnedCount: number;
  };
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

// ── Status Config ──────────────────────────────────────────────────────────

const bookStatusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  BORROWED: { icon: BookOpen, label: 'Borrowed', className: 'bg-blue-50 text-blue-600' },
  OVERDUE: { icon: AlertCircle, label: 'Overdue', className: 'bg-red-50 text-red-600' },
  RETURNED: { icon: CheckCircle2, label: 'Returned', className: 'bg-green-50 text-green-600' },
  LOST: { icon: AlertCircle, label: 'Lost', className: 'bg-gray-50 text-gray-600' },
};

// ── Skeleton ───────────────────────────────────────────────────────────────

function BorrowedSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-36" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function BorrowedError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <Library className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load borrowed books</h3>
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

function BorrowedEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-gray-50 p-4">
        <BookOpen className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No borrowed books</h3>
      <p className="mt-1 text-sm text-gray-500">
        You haven&apos;t borrowed any books yet. Visit the library to borrow books.
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function BorrowedBooksPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading, isError, refetch } = useQuery<
    ApiResponse<BorrowedBooksData>
  >({
    queryKey: ['borrowed-books'],
    queryFn: () => api.get('/library/borrowed').then((r) => r.data),
  });

  const borrowedData = data?.data;
  const allBooks = borrowedData?.borrowed || [];
  const summary = borrowedData?.summary;

  // Renew mutation
  const renewMutation = useMutation({
    mutationFn: (bookId: string) => api.post(`/library/borrowed/${bookId}/renew`),
    onSuccess: () => {
      toast.success('Book renewed successfully!');
      refetch();
    },
    onError: () => {
      toast.error('Failed to renew book. Please try again.');
    },
  });

  // Filter books
  const filteredBooks = allBooks.filter((book) => {
    const matchesSearch =
      !searchQuery ||
      book.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.book.isbn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'current' && (book.status === 'BORROWED' || book.status === 'OVERDUE')) ||
      (activeTab === 'returned' && book.status === 'RETURNED') ||
      (activeTab === 'overdue' && book.status === 'OVERDUE') ||
      (activeTab === 'lost' && book.status === 'LOST');

    return matchesSearch && matchesStatus && matchesTab;
  });

  // Days remaining calculation
  const getDaysInfo = (dueDate: string, status: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (status === 'RETURNED' || status === 'LOST') return null;
    if (diffDays < 0) return { days: Math.abs(diffDays), label: 'days overdue', isOverdue: true };
    if (diffDays === 0) return { days: 0, label: 'Due today', isOverdue: false };
    return { days: diffDays, label: 'days remaining', isOverdue: false };
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-36" />
        <BorrowedSkeleton />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-6">
        <BorrowedError onRetry={() => refetch()} />
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
        <h1 className="text-2xl font-bold text-ku-navy">Borrowed Books</h1>
        <p className="text-sm text-gray-500">Track your library borrowings</p>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Currently Borrowed</p>
                    <p className="text-xl font-bold text-ku-navy">{summary.totalBorrowed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Overdue</p>
                    <p className="text-xl font-bold text-red-700">{summary.overdueCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-50 p-2.5 text-orange-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Fines</p>
                    <p className="text-xl font-bold text-ku-navy">{formatCurrency(summary.totalFines)}</p>
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
                    <p className="text-xs text-gray-500">Returned</p>
                    <p className="text-xl font-bold text-ku-navy">{summary.returnedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Search + Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by title, author, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="BORROWED">Borrowed</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs + Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({allBooks.length})</TabsTrigger>
                <TabsTrigger value="current">
                  Current ({allBooks.filter((b) => b.status === 'BORROWED' || b.status === 'OVERDUE').length})
                </TabsTrigger>
                <TabsTrigger value="overdue">
                  Overdue ({allBooks.filter((b) => b.status === 'OVERDUE').length})
                </TabsTrigger>
                <TabsTrigger value="returned">Returned</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-6">
            {filteredBooks.length === 0 ? (
              <BorrowedEmpty />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Borrowed</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fine</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBooks.map((record) => {
                      const statusInfo = bookStatusConfig[record.status];
                      const StatusIcon = statusInfo?.icon || Book;
                      const daysInfo = getDaysInfo(record.dueDate, record.status);
                      const isOverdue = record.status === 'OVERDUE';

                      return (
                        <TableRow
                          key={record.id}
                          className={cn(
                            'group',
                            isOverdue && 'bg-red-50/40'
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="rounded-md bg-ku-gold/10 p-1.5">
                                <Book className="h-4 w-4 text-ku-gold" />
                              </div>
                              <span className="font-medium text-gray-900 line-clamp-1">
                                {record.book.title}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {record.book.author}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-gray-400">
                              {record.book.isbn}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                            {formatDate(record.borrowedDate)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className={cn(
                                'text-sm',
                                isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                              )}>
                                {formatDate(record.dueDate)}
                              </span>
                              {daysInfo && (
                                <span className={cn(
                                  'text-xs',
                                  daysInfo.isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'
                                )}>
                                  {daysInfo.isOverdue
                                    ? `${daysInfo.days}d overdue`
                                    : daysInfo.label === 'Due today'
                                      ? 'Due today'
                                      : `${daysInfo.days}d left`}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn('text-xs', getStatusColor(record.status))}
                              variant="secondary"
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {statusInfo?.label || record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.fineAmount > 0 ? (
                              <span className="font-medium text-red-600">
                                {formatCurrency(record.fineAmount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {(record.status === 'BORROWED' || record.status === 'OVERDUE') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => renewMutation.mutate(record.id)}
                                disabled={renewMutation.isPending}
                                className="text-ku-blue hover:text-ku-royal"
                              >
                                {renewMutation.isPending ? (
                                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                )}
                                Renew
                              </Button>
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
