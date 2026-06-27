'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  History,
  Vote,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  Hash,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { cn, formatDateTime, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

// ──────────────────── Types ────────────────────

interface VoteRecord {
  id: string;
  electionId: string;
  electionTitle: string;
  electionType: string;
  candidateName: string;
  candidatePosition: string;
  votedAt: string;
  method: string;
  transactionHash?: string;
  verified: boolean;
}

// ──────────────────── Loading Skeleton ────────────────────

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

// ──────────────────── Empty State ────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <History className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">No voting history</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        You have not voted in any elections yet. When you cast a vote, it will appear here for your
        records.
      </p>
    </motion.div>
  );
}

// ──────────────────── Main History Page ────────────────────

export default function HistoryPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const {
    data: votes,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vote-history'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<VoteRecord[]>>('/elections/votes/history');
      return res.data;
    },
    retry: false,
  });

  // ─── Filtering ───
  const filteredVotes = React.useMemo(() => {
    if (!votes) return [];
    return votes.filter((vote) => {
      const matchesSearch =
        !search ||
        vote.electionTitle.toLowerCase().includes(search.toLowerCase()) ||
        vote.candidateName.toLowerCase().includes(search.toLowerCase()) ||
        vote.electionType.toLowerCase().includes(search.toLowerCase());

      const matchesMethod =
        methodFilter === 'all' || vote.method === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [votes, search, methodFilter]);

  // ─── Stats ───
  const stats = React.useMemo(() => {
    if (!votes) return null;
    return {
      total: votes.length,
      portalVotes: votes.filter((v) => v.method === 'PORTAL').length,
      uniElectionVotes: votes.filter((v) => v.method === 'UNIELECTION').length,
      verified: votes.filter((v) => v.verified).length,
    };
  }, [votes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/20">
            <History className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Voting History</h1>
            <p className="text-sm text-muted-foreground">
              View your complete voting record across all elections
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats cards */}
      {stats && !isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Vote className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Votes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-xs text-muted-foreground">Verified on Chain</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <Hash className="h-5 w-5 text-ku-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.portalVotes}</p>
                <p className="text-xs text-muted-foreground">Via Portal</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <ExternalLink className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniElectionVotes}</p>
                <p className="text-xs text-muted-foreground">Via UniElection</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      {!isLoading && !error && votes && votes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by election or candidate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="PORTAL">Portal</SelectItem>
              <SelectItem value="UNIELECTION">UniElection</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {/* Content */}
      {isLoading ? (
        <HistorySkeleton />
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Failed to load history</h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error loading your voting history. Please try again.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </motion.div>
      ) : !votes || votes.length === 0 ? (
        <EmptyState />
      ) : filteredVotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <Search className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No matching records</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Election</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="hidden lg:table-cell">Transaction</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVotes.map((vote, index) => (
                <motion.tr
                  key={vote.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{vote.electionTitle}</p>
                      <p className="text-xs text-muted-foreground">{vote.electionType}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{vote.candidateName}</TableCell>
                  <TableCell className="text-muted-foreground">{vote.candidatePosition}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {formatDateTime(vote.votedAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        vote.method === 'PORTAL'
                          ? 'success'
                          : vote.method === 'UNIELECTION'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {vote.method === 'PORTAL' ? 'Portal' : vote.method === 'UNIELECTION' ? 'UniElection' : vote.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {vote.transactionHash ? (
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                        {vote.transactionHash.slice(0, 10)}...{vote.transactionHash.slice(-6)}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {vote.verified ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>

          {/* Summary */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {filteredVotes.length} of {votes.length} records
            </p>
            <p className="text-xs text-muted-foreground">
              Last vote: {formatDate(votes[0]?.votedAt || '')}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
