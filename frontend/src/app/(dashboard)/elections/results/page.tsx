'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Trophy,
  ChevronRight,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
  Medal,
  Vote,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ──────────────────── Types ────────────────────

interface Election {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  totalVotes: number;
  candidateCount: number;
  winner?: { id: string; name: string; voteCount: number } | null;
}

interface CandidateResult {
  id: string;
  name: string;
  position: string;
  voteCount: number;
  percentage: number;
  color: string;
}

interface ElectionResult {
  election: Election;
  candidates: CandidateResult[];
  totalVotes: number;
  voterTurnout: number;
}

// ──────────────────── Constants ────────────────────

const CHART_COLORS = [
  '#1e3a5f', '#d4a843', '#1565c0', '#e74c3c',
  '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c',
  '#e67e22', '#3498db', '#c0392b', '#16a085',
];

// ──────────────────── Loading Skeleton ────────────────────

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

// ──────────────────── Empty State ────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

// ──────────────────── Election Results Chart ────────────────────

function ElectionResultsChart({ result }: { result: ElectionResult }) {
  const pieData = result.candidates.map((c, i) => ({
    name: c.name,
    value: c.voteCount,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const barData = result.candidates.map((c, i) => ({
    name: c.name.split(' ')[0],
    fullName: c.name,
    votes: c.voteCount,
    percentage: c.percentage,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const sorted = [...result.candidates].sort((a, b) => b.voteCount - a.voteCount);
  const winner = sorted[0];

  return (
    <div className="space-y-6 pt-4">
      {/* Winner card */}
      {winner && (
        <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-4 border border-ku-gold/20">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ku-gold/20">
            <Trophy className="h-6 w-6 text-ku-gold" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-ku-gold uppercase tracking-wider">Winner</p>
            <p className="text-lg font-bold">{winner.name}</p>
            <p className="text-sm text-muted-foreground">
              {winner.position} &middot; {winner.voteCount} votes ({winner.percentage.toFixed(1)}%)
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-3 text-sm font-semibold">Vote Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                }}
                formatter={(value: number, name: string) => [`${value} votes`, name]}
              />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-3 text-sm font-semibold">Votes per Candidate</h4>
          <ResponsiveContainer width="100%" height={250}>
            <ReBarChart data={barData} barCategoryGap="20%">
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                }}
                formatter={(value: number) => [`${value} votes`, 'Votes']}
                labelFormatter={(label) => barData.find((d) => d.name === label)?.fullName || label}
              />
              <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">Votes</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((candidate, index) => (
              <TableRow key={candidate.id}>
                <TableCell>
                  {index === 0 ? (
                    <Medal className="h-4 w-4 text-ku-gold" />
                  ) : index === 1 ? (
                    <Medal className="h-4 w-4 text-gray-400" />
                  ) : index === 2 ? (
                    <Medal className="h-4 w-4 text-amber-700" />
                  ) : (
                    <span className="text-muted-foreground text-sm">{index + 1}</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">{candidate.name}</TableCell>
                <TableCell className="text-muted-foreground">{candidate.position}</TableCell>
                <TableCell className="text-right font-medium">{candidate.voteCount}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={index === 0 ? 'default' : 'secondary'}>
                    {candidate.percentage.toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Total votes cast</span>
        <span className="font-semibold text-foreground">{result.totalVotes}</span>
      </div>
    </div>
  );
}

// ──────────────────── Main Results Page ────────────────────

export default function ResultsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    data: elections,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['elections', 'COMPLETED'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Election[]>>('/elections', {
        params: { status: 'COMPLETED' },
      });
      return res.data;
    },
  });

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20">
            <BarChart3 className="h-5 w-5 text-ku-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Election Results</h1>
            <p className="text-sm text-muted-foreground">View results of completed elections</p>
          </div>
        </div>
        <ResultsSkeleton />
      </div>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20">
            <BarChart3 className="h-5 w-5 text-ku-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Election Results</h1>
            <p className="text-sm text-muted-foreground">View results of completed elections</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Failed to load results</h3>
          <p className="text-sm text-muted-foreground mb-4">There was an error loading election results.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ─── Empty ───
  if (!elections || elections.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20">
            <BarChart3 className="h-5 w-5 text-ku-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Election Results</h1>
            <p className="text-sm text-muted-foreground">View results of completed elections</p>
          </div>
        </div>
        <EmptyState
          icon={BarChart3}
          title="No results available"
          description="Completed election results will appear here once elections have been finalized."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20">
          <BarChart3 className="h-5 w-5 text-ku-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Election Results</h1>
          <p className="text-sm text-muted-foreground">View results of completed elections</p>
        </div>
      </motion.div>

      {/* Overview stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{elections.length}</p>
              <p className="text-xs text-muted-foreground">Completed Elections</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/20">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {elections.reduce((sum, e) => sum + (e.totalVotes || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Votes Cast</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <Trophy className="h-5 w-5 text-ku-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {elections.filter((e) => e.winner).length}
              </p>
              <p className="text-xs text-muted-foreground">Elections with Winners</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results list */}
      <div className="space-y-3">
        {elections.map((election, index) => (
          <motion.div
            key={election.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                expandedId === election.id && 'ring-2 ring-ku-navy/20'
              )}
              onClick={() => handleToggle(election.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{election.title}</h3>
                      <Badge variant="outline">{election.type}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(election.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {election.totalVotes || 0} votes
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {election.candidateCount} candidates
                      </span>
                    </div>
                    {election.winner && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-ku-gold">
                        <Trophy className="h-3.5 w-3.5" />
                        <span className="font-medium">{election.winner.name}</span>
                        <span className="text-muted-foreground">
                          ({election.winner.voteCount} votes)
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
                      expandedId === election.id && 'rotate-90'
                    )}
                  />
                </div>

                <AnimatePresence>
                  {expandedId === election.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border mt-4">
                        <ElectionResultDetail electionId={election.id} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────── Election Result Detail (by ID) ────────────────────

function ElectionResultDetail({ electionId }: { electionId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['election-result', electionId],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<ElectionResult>>(
        `/elections/${electionId}/results`
      );
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Unable to load detailed results.
      </p>
    );
  }

  return <ElectionResultsChart result={data} />;
}
