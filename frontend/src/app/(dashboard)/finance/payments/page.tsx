'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Search,
  Filter,
  ChevronDown,
  Banknote,
  Smartphone,
  Building2,
  Wallet,
  Download,
  ArrowUpDown,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatCurrency, formatDate, formatDateTime, getStatusColor } from '@/lib/utils';
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
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  reference: string;
  amount: number;
  method: 'MPESA' | 'BANK' | 'CASH' | 'CHEQUE';
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  description: string;
  category: string;
  invoiceNumber?: string;
  createdAt: string;
  paidAt?: string;
}

interface PaymentsSummary {
  totalPaid: number;
  paymentCount: number;
  pendingCount: number;
  failedCount: number;
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

// ── Payment Method Config ───────────────────────────────────────────────────

const methodConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  MPESA: { icon: Smartphone, label: 'M-PESA', color: 'bg-green-50 text-green-600' },
  BANK: { icon: Building2, label: 'Bank Transfer', color: 'bg-blue-50 text-blue-600' },
  CASH: { icon: Wallet, label: 'Cash', color: 'bg-orange-50 text-orange-600' },
  CHEQUE: { icon: Banknote, label: 'Cheque', color: 'bg-purple-50 text-purple-600' },
};

// ── Skeleton ───────────────────────────────────────────────────────────────

function PaymentsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-36" />
      <div className="grid gap-6 md:grid-cols-4">
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

function PaymentsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <CreditCard className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load payment history</h3>
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

function PaymentsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-gray-50 p-4">
        <CreditCard className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No payments yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        You haven&apos;t made any payments yet. Payments will appear here once processed.
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<{ payments: Payment[]; summary: PaymentsSummary }>>({
    queryKey: ['payment-history'],
    queryFn: () => api.get('/finance/payments').then((r) => r.data),
  });

  const payments = data?.data?.payments || [];
  const summary = data?.data?.summary;

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      !searchQuery ||
      payment.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-36" />
        <PaymentsSkeleton />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-6">
        <PaymentsError onRetry={() => refetch()} />
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
        <h1 className="text-2xl font-bold text-ku-navy">Payment History</h1>
        <p className="text-sm text-gray-500">Track all your fee payments</p>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={itemVariants}>
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-blue-700">Total Paid</p>
                <p className="mt-1 text-2xl font-bold text-blue-900">
                  {formatCurrency(summary.totalPaid)}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">Total Payments</p>
                <p className="mt-1 text-2xl font-bold text-ku-navy">{summary.paymentCount}</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-yellow-600">Pending</p>
                <p className="mt-1 text-2xl font-bold text-yellow-700">{summary.pendingCount}</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-red-600">Failed</p>
                <p className="mt-1 text-2xl font-bold text-red-700">{summary.failedCount}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by reference, description, or invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="MPESA">M-PESA</SelectItem>
                  <SelectItem value="BANK">Bank</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payments Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-ku-navy">Payments</CardTitle>
              <CardDescription>
                {filteredPayments.length} of {payments.length} payments
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <PaymentsEmpty />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => {
                      const method = methodConfig[payment.method] || methodConfig.CASH;
                      const MethodIcon = method.icon;
                      return (
                        <TableRow key={payment.id} className="group">
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs font-medium text-gray-900">
                              {payment.reference}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-700 line-clamp-1">
                              {payment.description}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className={cn('rounded-md p-1', method.color)}>
                                <MethodIcon className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs text-gray-600">{method.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn('text-xs', getStatusColor(payment.status))}
                              variant="secondary"
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.invoiceNumber ? (
                              <Link
                                href={`/finance/invoices`}
                                className="text-xs font-mono text-ku-blue hover:underline"
                              >
                                {payment.invoiceNumber}
                              </Link>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900">
                            {formatCurrency(payment.amount)}
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
