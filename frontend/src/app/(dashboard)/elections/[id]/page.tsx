'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vote,
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trophy,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  ShieldCheck,
  FileText,
  Info,
  Check,
  X,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useElectionStore } from '@/stores/election.store';
import { toast } from 'sonner';

// ───────────────────────────────── Types ─────────────────────────────────

interface Election {
  id: string;
  title: string;
  description: string;
  type: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  positions: string[];
  candidateCount?: number;
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
}

interface Candidate {
  id: string;
  name: string;
  position: string;
  manifesto: string;
  photoUrl?: string;
  voteCount: number;
  electionId: string;
}

interface Eligibility {
  eligible: boolean;
  reason?: string;
}

interface ElectionResult {
  election: Election;
  candidates: Array<{
    id: string;
    name: string;
    position: string;
    voteCount: number;
    percentage: number;
    color: string;
  }>;
  totalVotes: number;
  voterTurnout: number;
}

// ──────────────────── Color palette ────────────────────

const CHART_COLORS = [
  '#1e3a5f', '#d4a843', '#1565c0', '#e74c3c',
  '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c',
  '#e67e22', '#3498db', '#c0392b', '#16a085',
];

// ──────────────────── Loading Skeleton ────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ──────────────────── Error State ────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/20">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Something went wrong</h3>
      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

// ──────────────────── Countdown Timer ────────────────────

function CountdownTimer({ targetDate, label }: { targetDate: string; label: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (expired) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="text-center">
        <p className="mb-3 text-sm font-medium text-muted-foreground">{label}</p>
        {timeLeft && (
          <div className="flex items-center justify-center gap-4">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hours' },
              { value: timeLeft.minutes, label: 'Minutes' },
              { value: timeLeft.seconds, label: 'Seconds' },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-ku-navy/5 dark:bg-ku-navy/20 text-2xl font-bold text-ku-navy">
                  {String(unit.value).padStart(2, '0')}
                </div>
                <span className="mt-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────── Manifesto Modal ────────────────────

function ManifestoDialog({
  candidateName,
  manifesto,
}: {
  candidateName: string;
  manifesto: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs">
          <FileText className="mr-1 h-3 w-3" />
          Read More
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-ku-gold" />
            {candidateName}&apos;s Manifesto
          </DialogTitle>
          <DialogDescription>
            Full manifesto and vision statement
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {manifesto}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────── Vote Confirmation Dialog ────────────────────

function VoteConfirmationDialog({
  candidateName,
  position,
  electionId,
  candidateId,
  onConfirm,
  isPending,
}: {
  candidateName: string;
  position: string;
  electionId: string;
  candidateId: string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const { integrationMode } = useElectionStore();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-ku-gold to-amber-500 hover:from-ku-gold/90 hover:to-amber-500/90 text-white font-semibold shadow-lg shadow-ku-gold/20 w-full"
        >
          <Vote className="mr-2 h-4 w-4" />
          Vote
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-ku-gold" />
            Confirm Your Vote
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please confirm your selection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Candidate</span>
              <span className="font-semibold">{candidateName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Position</span>
              <span className="font-medium">{position}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Voting Method</span>
              <Badge variant="outline">{integrationMode.toUpperCase()}</Badge>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
            <Info className="h-5 w-5 shrink-0 text-ku-gold mt-0.5" />
            <p className="text-xs text-muted-foreground">
              By confirming, you certify that this vote is your own free choice.
              This action is final and cannot be reversed once submitted.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            disabled={isPending}
            className="bg-ku-gold hover:bg-ku-gold/90 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Casting Vote...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Confirm Vote
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────── Success Animation ────────────────────

function VoteSuccessAnimation({
  transactionHash,
  onClose,
}: {
  transactionHash?: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="flex flex-col items-center justify-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
      >
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </motion.div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl font-bold mb-2"
      >
        Vote Cast Successfully!
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground mb-6 text-center max-w-md"
      >
        Your vote has been recorded and verified on the blockchain.
        Your participation in the democratic process is appreciated.
      </motion.p>

      {transactionHash && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2"
        >
          <Hash className="h-4 w-4 text-muted-foreground" />
          <code className="text-xs font-mono">
            {transactionHash.slice(0, 16)}...{transactionHash.slice(-8)}
          </code>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6"
      >
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────── Results View ────────────────────

function ResultsView({ electionId }: { electionId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['election-results', electionId],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<ElectionResult>>(
        `/elections/${electionId}/results`
      );
      return res.data;
    },
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Unable to load results data.
      </p>
    );
  }

  const pieData = data.candidates.map((c, i) => ({
    name: c.name,
    value: c.voteCount,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const barData = data.candidates.map((c, i) => ({
    name: c.name.split(' ')[0],
    fullName: c.name,
    votes: c.voteCount,
    percentage: c.percentage,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const winner = data.candidates.reduce((best, c) =>
    c.voteCount > best.voteCount ? c : best
  , data.candidates[0]);

  return (
    <div className="space-y-6">
      {/* Winner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-5 border border-ku-gold/20"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ku-gold/20">
          <Trophy className="h-7 w-7 text-ku-gold" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-ku-gold uppercase tracking-wider">Winner</p>
          <p className="text-xl font-bold">{winner.name}</p>
          <p className="text-sm text-muted-foreground">
            {winner.position} &middot; {winner.voteCount} votes ({winner.percentage.toFixed(1)}%)
          </p>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h4 className="mb-3 text-sm font-semibold">Vote Distribution</h4>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <h4 className="mb-3 text-sm font-semibold">Votes per Candidate</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barCategoryGap="20%">
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
              <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Results table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border overflow-hidden"
      >
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
            {data.candidates
              .sort((a, b) => b.voteCount - a.voteCount)
              .map((candidate, index) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    {index === 0 ? (
                      <Trophy className="h-4 w-4 text-ku-gold" />
                    ) : (
                      <span className="text-muted-foreground">{index + 1}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{candidate.name}</TableCell>
                  <TableCell className="text-muted-foreground">{candidate.position}</TableCell>
                  <TableCell className="text-right font-medium">{candidate.voteCount}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={index === 0 ? 'default' : 'secondary'}
                    >
                      {candidate.percentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </motion.div>

      <p className="text-center text-sm text-muted-foreground">
        Total votes cast: <span className="font-medium">{data.totalVotes}</span>
      </p>
    </div>
  );
}

// ──────────────────── Candidate Card ────────────────────

function CandidateCard({
  candidate,
  isSelected,
  votingDisabled,
  electionId,
  onVoteSuccess,
}: {
  candidate: Candidate;
  isSelected: boolean;
  votingDisabled: boolean;
  electionId: string;
  onVoteSuccess: (txHash?: string) => void;
}) {
  const [manifestoExpanded, setManifestoExpanded] = useState(false);
  const queryClient = useQueryClient();
  const { integrationMode, isExchanging, setIsExchanging, addLog, setExchangeError } = useElectionStore();

  const voteMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.post<ApiResponse<{ transactionHash?: string }>>(
        `/elections/${electionId}/vote`,
        { candidateId: candidate.id }
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['election', electionId] });
      queryClient.invalidateQueries({ queryKey: ['election-results', electionId] });
      queryClient.invalidateQueries({ queryKey: ['vote-history'] });
      addLog({
        id: Date.now().toString(),
        event: 'Vote Cast',
        status: 'success',
        createdAt: new Date().toISOString(),
      });
      onVoteSuccess(data.transactionHash);
      toast.success('Your vote has been recorded successfully!');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to cast vote. Please try again.';
      toast.error(msg);
      addLog({
        id: Date.now().toString(),
        event: 'Vote Failed',
        status: 'error',
        createdAt: new Date().toISOString(),
      });
    },
  });

  const initials = candidate.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
          voteMutation.isSuccess && 'ring-2 ring-green-500/50 bg-green-50/50 dark:bg-green-950/10'
        )}
      >
        {/* Success overlay */}
        {voteMutation.isSuccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 backdrop-blur-[1px] z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <span className="font-semibold text-green-700 dark:text-green-400">Voted</span>
            </motion.div>
          </div>
        )}

        <CardHeader>
          <div className="flex items-start gap-4">
            {/* Photo placeholder */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ku-navy to-ku-blue text-white text-lg font-bold shadow-md">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl mb-0.5">{candidate.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="outline">{candidate.position}</Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Manifesto */}
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {candidate.manifesto}
            </p>
            {candidate.manifesto.length > 150 && (
              <ManifestoDialog
                candidateName={candidate.name}
                manifesto={candidate.manifesto}
              />
            )}
          </div>

          {/* Vote count (for results) */}
          {candidate.voteCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current votes</span>
              <span className="font-semibold">{candidate.voteCount}</span>
            </div>
          )}

          {/* Vote button */}
          {!votingDisabled && (
            <VoteConfirmationDialog
              candidateName={candidate.name}
              position={candidate.position}
              electionId={electionId}
              candidateId={candidate.id}
              onConfirm={() => voteMutation.mutate()}
              isPending={voteMutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ──────────────────── Candidate List Preview (Upcoming) ────────────────────

function CandidatePreview({ candidate }: { candidate: Candidate }) {
  const initials = candidate.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{candidate.name}</p>
        <p className="text-xs text-muted-foreground">{candidate.position}</p>
      </div>
    </div>
  );
}

// ──────────────────── Main Page ────────────────────

export default function ElectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | undefined>();

  const {
    data: election,
    isLoading: loadingElection,
    error: electionError,
    refetch: refetchElection,
  } = useQuery({
    queryKey: ['election', electionId],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Election>>(`/elections/${electionId}`);
      return res.data;
    },
    enabled: !!electionId,
  });

  const {
    data: candidates,
    isLoading: loadingCandidates,
  } = useQuery({
    queryKey: ['election-candidates', electionId],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Candidate[]>>(`/elections/${electionId}/candidates`);
      return res.data;
    },
    enabled: !!electionId,
  });

  const {
    data: eligibility,
    isLoading: loadingEligibility,
  } = useQuery({
    queryKey: ['election-eligibility', electionId],
    queryFn: async () => {
      try {
        const { data: res } = await api.get<ApiResponse<Eligibility>>(`/elections/${electionId}/eligibility`);
        return res.data;
      } catch {
        // Default to eligible if endpoint not implemented
        return { eligible: true } as Eligibility;
      }
    },
    enabled: !!electionId,
    retry: false,
  });

  const handleVoteSuccess = (txHash?: string) => {
    setLastTxHash(txHash);
    setShowSuccess(true);
  };

  // ─── Loading ───
  if (loadingElection) {
    return <DetailSkeleton />;
  }

  // ─── Error ───
  if (electionError || !election) {
    return (
      <ErrorState
        message={electionError ? 'Failed to load election details.' : 'Election not found.'}
        onRetry={() => refetchElection()}
      />
    );
  }

  const isActive = election.status === 'ACTIVE';
  const isUpcoming = election.status === 'UPCOMING';
  const isCompleted = election.status === 'COMPLETED';
  const isCancelled = election.status === 'CANCELLED';
  const isEligible = eligibility?.eligible ?? true;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/elections')}
          className="mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Elections
        </Button>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-1">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-bold tracking-tight">{election.title}</h1>
              <Badge variant={election.type === 'PRESIDENTIAL' ? 'default' : 'secondary'}>
                {election.type}
              </Badge>
              <Badge
                variant={
                  isActive ? 'success' : isUpcoming ? 'warning' : isCompleted ? 'default' : 'destructive'
                }
              >
                {election.status}
              </Badge>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{election.description}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(election.startDate)} - {formatDate(election.endDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{candidates?.length || 0} candidates</span>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span>{election.totalVotes} total votes</span>
            </div>
          )}
        </div>

        {/* Eligibility status */}
        {!loadingEligibility && eligibility && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg p-3 text-sm',
              eligibility.eligible
                ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
            )}
          >
            {eligibility.eligible ? (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>You are eligible to vote in this election</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>You are not eligible: {eligibility.reason || 'Unknown reason'}</span>
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* ─── UPCOMING ─── */}
      {isUpcoming && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <CountdownTimer targetDate={election.startDate} label="Time until voting opens" />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Candidates
              </CardTitle>
              <CardDescription>
                Preview of candidates for this election
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCandidates ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : candidates && candidates.length > 0 ? (
                <div className="space-y-2">
                  {candidates.map((candidate) => (
                    <CandidatePreview key={candidate.id} candidate={candidate} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Candidates have not been announced yet.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 p-4">
            <Info className="h-5 w-5 text-ku-gold" />
            <p className="text-sm text-muted-foreground">
              Voting has not yet opened. The election starts on {formatDate(election.startDate)}.
            </p>
          </div>
        </motion.div>
      )}

      {/* ─── ACTIVE ─── */}
      {isActive && !showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {!isEligible ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center text-center">
                  <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
                  <h3 className="text-lg font-semibold mb-1">Not Eligible to Vote</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {eligibility?.reason || 'You do not meet the eligibility criteria for this election.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : loadingCandidates ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : candidates && candidates.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={false}
                  votingDisabled={false}
                  electionId={electionId}
                  onVoteSuccess={handleVoteSuccess}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold mb-1">No Candidates Available</h3>
                  <p className="text-sm text-muted-foreground">
                    No candidates have been registered for this election yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-center gap-2 rounded-xl bg-muted p-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Voting closes on {formatDate(election.endDate)} at 5:00 PM. Votes cannot be changed once submitted.
            </p>
          </div>
        </motion.div>
      )}

      {/* ─── Success State ─── */}
      {isActive && showSuccess && (
        <VoteSuccessAnimation
          transactionHash={lastTxHash}
          onClose={() => setShowSuccess(false)}
        />
      )}

      {/* ─── COMPLETED ─── */}
      {isCompleted && (
        <ResultsView electionId={electionId} />
      )}

      {/* ─── CANCELLED ─── */}
      {isCancelled && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
              <h2 className="text-xl font-bold mb-2">Election Cancelled</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                This election has been cancelled. Please check the elections page for other active
                or upcoming elections.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => router.push('/dashboard/elections')}
              >
                Browse Elections
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
