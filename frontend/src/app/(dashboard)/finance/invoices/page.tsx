'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface Invoice {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  amountPaid: number;
  balanceDue: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED';
  dueDate: string;
  issuedDate: string;
  paidAt?: string;
  items?: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
}

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ── Status Config ──────────────────────────────────────────────────────────

const statusConfig: Record<string, { icon: React.ElementType; label: string }> = {
  PAID: { icon: CheckCircle2, label: 'Paid' },
  PENDING: { icon: Clock, label: 'Pending' },
  OVERDUE: { icon: AlertCircle, label: 'Overdue' },
  PARTIAL: { icon: DollarSign, label: 'Partially Paid' },
  CANCELLED: { icon: XCircle, label: 'Cancelled' },
};

// ── Skeleton ───────────────────────────────────────────────────────────────

function InvoicesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-36" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function InvoicesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <Receipt className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load invoices</h3>
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

function InvoicesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-gray-50 p-4">
        <Receipt className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No invoices</h3>
      <p className="mt-1 text-sm text-gray-500">
        You don&apos;t have any invoices at the moment.
      </p>
    </div>
  );
}

// ── Invoice Card ───────────────────────────────────────────────────────────

function InvoiceCard({
  invoice,
  index,
  onPay,
  payingId,
}: {
  invoice: Invoice;
  index: number;
  onPay: (id: string) => void;
  payingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = statusConfig[invoice.status]?.icon || Clock;
  const isPayable = invoice.status === 'PENDING' || invoice.status === 'PARTIAL' || invoice.status === 'OVERDUE';

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      layout
    >
      <Card
        className={cn(
          'transition-all duration-300 hover:shadow-lg',
          invoice.status === 'OVERDUE' && 'border-red-200'
        )}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-lg p-2.5',
                  invoice.status === 'PAID'
                    ? 'bg-green-50 text-green-600'
                    : invoice.status === 'OVERDUE'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-blue-50 text-blue-600'
                )}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs text-gray-500">{invoice.invoiceNumber}</p>
                <p className="text-sm font-semibold text-ku-navy line-clamp-1">
                  {invoice.description}
                </p>
              </div>
            </div>
            <Badge
              className={cn('text-xs', getStatusColor(invoice.status))}
              variant="secondary"
            >
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig[invoice.status]?.label || invoice.status}
            </Badge>
          </div>

          {/* Amount */}
          <div className="mt-4">
            <p className="text-2xl font-bold text-ku-navy">{formatCurrency(invoice.amount)}</p>
            {invoice.amountPaid > 0 && (
              <p className="text-xs text-gray-500">
                Paid: {formatCurrency(invoice.amountPaid)} | Balance:{' '}
                <span className={cn('font-medium', invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600')}>
                  {formatCurrency(invoice.balanceDue)}
                </span>
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Issued: {formatDate(invoice.issuedDate)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Due: {formatDate(invoice.dueDate)}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            {isPayable && (
              <Button
                size="sm"
                onClick={() => onPay(invoice.id)}
                disabled={payingId === invoice.id}
                className="bg-ku-navy text-white hover:bg-ku-blue"
              >
                {payingId === invoice.id ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <DollarSign className="mr-1 h-3.5 w-3.5" />
                )}
                Pay Now
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500"
            >
              {expanded ? (
                <ChevronUp className="mr-1 h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="mr-1 h-3.5 w-3.5" />
              )}
              {expanded ? 'Less' : 'Details'}
            </Button>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 border-t pt-4">
                  {invoice.items && invoice.items.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">LINE ITEMS</p>
                      {invoice.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            {item.description} x{item.quantity}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(invoice.amount)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No line items available.</p>
                  )}

                  {invoice.paidAt && (
                    <p className="mt-3 text-xs text-gray-400">
                      Paid on {formatDate(invoice.paidAt)}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<Invoice[]>>({
    queryKey: ['invoices'],
    queryFn: () => api.get('/finance/invoices').then((r) => r.data),
  });

  const payMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      api.post(`/finance/invoices/${invoiceId}/pay`),
    onSuccess: () => {
      toast.success('Invoice paid successfully!');
      refetch();
    },
    onError: () => {
      toast.error('Payment failed. Please try again.');
    },
  });

  const invoices = data?.data || [];
  const [payingId, setPayingId] = useState<string | null>(null);

  const handlePay = (id: string) => {
    setPayingId(id);
    payMutation.mutate(id, {
      onSettled: () => setPayingId(null),
    });
  };

  // Summary stats
  const totalOutstanding = invoices
    .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
    .reduce((sum, inv) => sum + inv.balanceDue, 0);
  const overdueCount = invoices.filter((inv) => inv.status === 'OVERDUE').length;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-36" />
        <InvoicesSkeleton />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-6">
        <InvoicesError onRetry={() => refetch()} />
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
      <motion.div variants={cardVariants}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ku-navy">Invoices</h1>
            <p className="text-sm text-gray-500">View and manage your invoices</p>
          </div>
          <div className="flex items-center gap-3">
            {overdueCount > 0 && (
              <Badge variant="secondary" className="bg-red-50 text-red-600">
                {overdueCount} overdue
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {invoices.length} total
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Summary Bar */}
      {invoices.length > 0 && (
        <motion.div variants={cardVariants}>
          <Card className="border-0 bg-gradient-to-br from-ku-navy to-ku-blue text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Total Outstanding</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/70">Paid Invoices</p>
                  <p className="text-xl font-bold">
                    {invoices.filter((inv) => inv.status === 'PAID').length} / {invoices.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {invoices.length === 0 && <InvoicesEmpty />}

      {/* Invoice Grid */}
      {invoices.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {invoices.map((invoice, i) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              index={i}
              onPay={handlePay}
              payingId={payingId}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
