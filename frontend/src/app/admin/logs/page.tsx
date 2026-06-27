'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ScrollText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Clock,
  User,
  Activity,
  CheckCircle2,
  XCircle,
  Terminal,
  Webhook,
  Download,
  Calendar as CalendarIcon,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn, formatDateTime, timeAgo } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

interface IntegrationLog {
  id: string;
  timestamp: string;
  event: string;
  status: 'success' | 'error' | 'pending';
  requestSummary: string;
  responseSummary: string;
  duration?: number;
  endpoint?: string;
}

interface LogsResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Action Badge ───────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const config: Record<string, { label: string; className: string }> = {
    CREATE: { label: 'Create', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    UPDATE: { label: 'Update', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    DELETE: { label: 'Delete', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
    LOGIN: { label: 'Login', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    LOGOUT: { label: 'Logout', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    VIEW: { label: 'View', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    EXPORT: { label: 'Export', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  };
  const c = config[action?.toUpperCase()] || { label: action, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  return (
    <Badge variant="outline" className={cn('border text-xs', c.className)}>
      {c.label}
    </Badge>
  );
}

function IntegrationStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    success: { label: 'Success', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    error: { label: 'Error', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
    pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  };
  const c = config[status] || { label: status, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  return (
    <Badge variant="outline" className={cn('border text-xs', c.className)}>
      {status === 'success' ? <CheckCircle2 className="h-3 w-3 mr-1" /> :
       status === 'error' ? <XCircle className="h-3 w-3 mr-1" /> :
       <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
      {c.label}
    </Badge>
  );
}

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminLogsPage() {
  const [activeTab, setActiveTab] = useState('audit');
  const [auditSearch, setAuditSearch] = useState('');
  const [integrationSearch, setIntegrationSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [integrationPage, setIntegrationPage] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');
  const limit = 20;

  // ── Audit Logs Query ─────────────────────────────────────────────────────
  const auditQuery = useQuery<LogsResponse<AuditLog>>({
    queryKey: ['admin-logs-audit', auditPage, limit, auditSearch, auditActionFilter],
    queryFn: () =>
      api
        .get('/admin/logs/audit', {
          params: {
            page: auditPage,
            limit,
            search: auditSearch || undefined,
            action: auditActionFilter !== 'all' ? auditActionFilter : undefined,
          },
        })
        .then((res) => res.data),
    enabled: activeTab === 'audit',
  });

  // ── Integration Logs Query ──────────────────────────────────────────────
  const integrationQuery = useQuery<LogsResponse<IntegrationLog>>({
    queryKey: ['admin-logs-integration', integrationPage, limit, integrationSearch],
    queryFn: () =>
      api
        .get('/admin/logs/integration', {
          params: {
            page: integrationPage,
            limit,
            search: integrationSearch || undefined,
          },
        })
        .then((res) => res.data),
    enabled: activeTab === 'integration',
  });

  // ── Loading State ──────────────────────────────────────────────────────
  const isLoading = activeTab === 'audit' ? auditQuery.isLoading : integrationQuery.isLoading;
  const isError = activeTab === 'audit' ? auditQuery.isError : integrationQuery.isError;
  const data = activeTab === 'audit' ? auditQuery.data : integrationQuery.data;
  const refetch = activeTab === 'audit' ? auditQuery.refetch : integrationQuery.refetch;

  const items = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;
  const currentPage = activeTab === 'audit' ? auditPage : integrationPage;

  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">System Logs</h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor and audit system activity
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); }}>
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="audit" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Activity className="h-4 w-4 mr-2" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="integration" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Webhook className="h-4 w-4 mr-2" />
              Integration Logs
            </TabsTrigger>
          </TabsList>

          {/* ── Audit Logs Tab ──────────────────────────────────────────── */}
          <TabsContent value="audit" className="mt-4 space-y-4">
            {/* Filters */}
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search by user, action, or details..."
                      value={auditSearch}
                      onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                      className="pl-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="w-40">
                    <select
                      value={auditActionFilter}
                      onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
                      className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">All Actions</option>
                      {actions.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Table */}
            {renderLogsTable({
              isLoading,
              isError,
              items,
              refetch,
              totalItems,
              currentPage,
              totalPages,
              setPage: setAuditPage,
              type: 'audit',
            })}
          </TabsContent>

          {/* ── Integration Logs Tab ────────────────────────────────────── */}
          <TabsContent value="integration" className="mt-4 space-y-4">
            {/* Filters */}
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search by event, status, or endpoint..."
                    value={integrationSearch}
                    onChange={(e) => { setIntegrationSearch(e.target.value); setIntegrationPage(1); }}
                    className="pl-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Integration Table */}
            {renderLogsTable({
              isLoading,
              isError,
              items,
              refetch,
              totalItems,
              currentPage,
              totalPages,
              setPage: setIntegrationPage,
              type: 'integration',
            })}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

// ── Table Renderer ─────────────────────────────────────────────────────────

function renderLogsTable({
  isLoading,
  isError,
  items,
  refetch,
  totalItems,
  currentPage,
  totalPages,
  setPage,
  type,
}: {
  isLoading: boolean;
  isError: boolean;
  items: any[];
  refetch: () => void;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  setPage: (page: number) => void;
  type: 'audit' | 'integration';
}) {
  const isFirstRender = isLoading && items.length === 0;

  if (isFirstRender) {
    return (
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-slate-800" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-red-500/10 p-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">Failed to load logs</h3>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <ScrollText className="h-12 w-12 text-slate-700 mb-3" />
          <h3 className="text-lg font-medium text-slate-300">No logs found</h3>
          <p className="text-sm text-slate-500 mt-1">No {type} log entries match your criteria</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                {type === 'audit' ? (
                  <>
                    <TableHead className="text-slate-400 font-medium w-44">Timestamp</TableHead>
                    <TableHead className="text-slate-400 font-medium">User</TableHead>
                    <TableHead className="text-slate-400 font-medium w-24">Action</TableHead>
                    <TableHead className="text-slate-400 font-medium">Entity</TableHead>
                    <TableHead className="text-slate-400 font-medium hidden md:table-cell">Details</TableHead>
                    <TableHead className="text-slate-400 font-medium hidden lg:table-cell w-32">IP Address</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-slate-400 font-medium w-44">Timestamp</TableHead>
                    <TableHead className="text-slate-400 font-medium">Event</TableHead>
                    <TableHead className="text-slate-400 font-medium w-24">Status</TableHead>
                    <TableHead className="text-slate-400 font-medium hidden md:table-cell">Request</TableHead>
                    <TableHead className="text-slate-400 font-medium hidden lg:table-cell">Response</TableHead>
                    <TableHead className="text-slate-400 font-medium hidden sm:table-cell w-20">Duration</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {type === 'audit'
                ? (items as AuditLog[]).map((log, idx) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-slate-800 hover:bg-slate-800/50"
                    >
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                          <div>
                            <p className="text-xs text-slate-300">{formatDateTime(log.timestamp)}</p>
                            <p className="text-[10px] text-slate-600">{timeAgo(log.timestamp)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                          <span className="text-sm text-slate-200">{log.user}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm text-slate-200">{log.entity}</span>
                          {log.entityId && (
                            <span className="text-[10px] text-slate-600 block font-mono">{log.entityId}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm text-slate-400 max-w-[250px] truncate" title={log.details}>
                          {log.details}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-slate-500 font-mono">{log.ipAddress || '-'}</span>
                      </TableCell>
                    </motion.tr>
                  ))
                : (items as IntegrationLog[]).map((log, idx) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-slate-800 hover:bg-slate-800/50"
                    >
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                          <div>
                            <p className="text-xs text-slate-300">{formatDateTime(log.timestamp)}</p>
                            <p className="text-[10px] text-slate-600">{timeAgo(log.timestamp)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Terminal className="h-3.5 w-3.5 text-slate-500" />
                          <span className="text-sm font-medium text-slate-200">{log.event}</span>
                        </div>
                        {log.endpoint && (
                          <p className="text-[10px] text-slate-600 font-mono mt-0.5">{log.endpoint}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <IntegrationStatusBadge status={log.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-xs text-slate-400 max-w-[200px] truncate" title={log.requestSummary}>
                          {log.requestSummary}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-xs text-slate-400 max-w-[200px] truncate" title={log.responseSummary}>
                          {log.responseSummary}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {log.duration != null ? (
                          <span className="text-xs text-slate-400">{log.duration}ms</span>
                        ) : (
                          <span className="text-xs text-slate-600">-</span>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages} ({totalItems} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className={
                    pageNum === currentPage
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
