'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vote,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  BarChart3,
  History,
  ScrollText,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ExternalLink,
  Hash,
  UserCheck,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { cn, formatDate, formatDateTime, timeAgo, getStatusColor } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
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
  candidateCount: number;
  totalVotes: number;
  winner?: { id: string; name: string; voteCount: number } | null;
  createdAt: string;
  updatedAt: string;
}

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

// ──────────────────── Color palette for charts ────────────────────

const CHART_COLORS = [
  '#1e3a5f', '#d4a843', '#1565c0', '#e74c3c',
  '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c',
  '#e67e22', '#3498db', '#c0392b', '#16a085',
];

const SUBTLE_COLORS = [
  '#1e3a5f20', '#d4a84320', '#1565c020', '#e74c3c20',
  '#2ecc7120', '#f39c1220', '#9b59b620', '#1abc9c20',
];

// ──────────────────── Countdown component ────────────────────

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  React.useEffect(() => {
    function update() {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Started');
        setIsExpired(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${minutes}m remaining`);
      }
    }

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (isExpired) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span>{timeLeft}</span>
    </div>
  );
}

// ──────────────────── Election Card ────────────────────

function ElectionCard({
  election,
  variant = 'default',
}: {
  election: Election;
  variant?: 'default' | 'upcoming' | 'past';
}) {
  const isActive = variant === 'default' && election.status === 'ACTIVE';
  const isUpcoming = variant === 'upcoming' || election.status === 'UPCOMING';
  const isPast = variant === 'past' || election.status === 'COMPLETED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-300 hover:shadow-lg',
          isActive && 'border-ku-gold/50 hover:border-ku-gold ring-1 ring-ku-gold/20'
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight mb-1">
                {election.title}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    election.type === 'PRESIDENTIAL'
                      ? 'default'
                      : election.type === 'PARLIAMENTARY'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {election.type}
                </Badge>
                <Badge
                  variant={
                    election.status === 'ACTIVE'
                      ? 'success'
                      : election.status === 'UPCOMING'
                        ? 'warning'
                        : election.status === 'COMPLETED'
                          ? 'default'
                          : 'destructive'
                  }
                >
                  {election.status}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {formatDate(election.startDate)} - {formatDate(election.endDate)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              <span>{election.candidateCount} candidates</span>
            </div>

            {election.status === 'COMPLETED' && election.totalVotes > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 shrink-0 text-ku-navy" />
                <span className="text-ku-navy font-medium">
                  {election.totalVotes} total votes cast
                </span>
              </div>
            )}

            {election.status === 'COMPLETED' && election.winner && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2.5">
                <Trophy className="h-4 w-4 shrink-0 text-ku-gold" />
                <span className="text-sm font-medium text-ku-gold">
                  Winner: {election.winner.name}
                </span>
              </div>
            )}

            {isUpcoming && <Countdown targetDate={election.startDate} />}

            <div className="flex items-center gap-2 pt-2">
              {isActive && (
                <Link href={`/dashboard/elections/${election.id}`} className="flex-1">
                  <Button
                    className="w-full bg-gradient-to-r from-ku-gold to-amber-500 hover:from-ku-gold/90 hover:to-amber-500/90 text-white font-semibold shadow-lg shadow-ku-gold/20"
                    size="sm"
                  >
                    <Vote className="mr-2 h-4 w-4" />
                    Vote Now
                  </Button>
                </Link>
              )}
              {isUpcoming && (
                <Link href={`/dashboard/elections/${election.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Info className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </Link>
              )}
              {isPast && (
                <Link href={`/dashboard/elections/${election.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Results
                  </Button>
                </Link>
              )}
              {election.status === 'CANCELLED' && (
                <Button variant="outline" size="sm" className="flex-1" disabled>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Cancelled
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
      transition={{ duration: 0.4 }}
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

// ──────────────────── Results Tab ────────────────────

function ResultsTabContent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['elections', 'completed'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Election[]>>('/elections', {
        params: { status: 'COMPLETED' },
      });
      return res.data;
    },
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load results"
        description="There was an error loading the election results. Please try again."
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No completed elections"
        description="Completed election results will appear here once elections have been finalized."
      />
    );
  }

  return (
    <div className="space-y-4">
      {data.map((election) => (
        <motion.div
          key={election.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-md',
              expandedId === election.id && 'ring-2 ring-ku-navy/20'
            )}
            onClick={() => setExpandedId(expandedId === election.id ? null : election.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold">{election.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(election.endDate)} &middot; {election.totalVotes || 0} votes
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform duration-200',
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
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-border">
                      <ElectionResultsView electionId={election.id} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ──────────────────── Election Results View ────────────────────

function ElectionResultsView({ electionId }: { electionId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['election-results', electionId],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<ElectionResult>>(
        `/elections/${electionId}/results`
      );
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Unable to load results data.
      </p>
    );
  }

  const pieData = data.candidates.map((c) => ({
    name: c.name,
    value: c.voteCount,
    color: c.color || CHART_COLORS[data.candidates.indexOf(c) % CHART_COLORS.length],
  }));

  const barData = data.candidates.map((c) => ({
    name: c.name.split(' ')[0],
    fullName: c.name,
    votes: c.voteCount,
    percentage: c.percentage,
  }));

  const winner = data.candidates.reduce((best, c) =>
    c.voteCount > best.voteCount ? c : best
  , data.candidates[0]);

  return (
    <div className="space-y-6">
      {/* Winner highlight */}
      {winner && (
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-4 border border-ku-gold/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ku-gold/20">
            <Trophy className="h-6 w-6 text-ku-gold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Leading Candidate</p>
            <p className="font-semibold text-lg">{winner.name}</p>
            <p className="text-sm text-muted-foreground">
              {winner.voteCount} votes ({winner.percentage.toFixed(1)}%)
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie chart */}
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

        {/* Bar chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-3 text-sm font-semibold">Votes per Candidate</h4>
          <ResponsiveContainer width="100%" height={250}>
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
              <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                {barData.map((_, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">Votes</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.candidates
              .sort((a, b) => b.voteCount - a.voteCount)
              .map((candidate, index) => (
                <TableRow key={candidate.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      {candidate.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {candidate.position}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {candidate.voteCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{candidate.percentage.toFixed(1)}%</Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Total votes cast: {data.totalVotes}
      </p>
    </div>
  );
}

// ──────────────────── Vote History Tab ────────────────────

function VoteHistoryTabContent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vote-history'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<VoteRecord[]>>('/elections/votes/history');
      return res.data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Could not load history"
        description="There was an error loading your voting history."
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No voting history"
        description="You have not voted in any elections yet. Your voting history will appear here."
      />
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Election</TableHead>
            <TableHead>Candidate</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="hidden md:table-cell">Transaction</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((vote) => (
            <TableRow key={vote.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{vote.electionTitle}</p>
                  <p className="text-xs text-muted-foreground">{vote.electionType}</p>
                </div>
              </TableCell>
              <TableCell>{vote.candidateName}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
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
                  {vote.method}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {vote.transactionHash ? (
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    {vote.transactionHash.slice(0, 10)}...{vote.transactionHash.slice(-6)}
                  </code>
                ) : (
                  <span className="text-muted-foreground text-sm">N/A</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ──────────────────── Rules Tab Content ────────────────────

function RulesTabContent() {
  const rules = [
    {
      icon: UserCheck,
      title: 'Eligibility Criteria',
      items: [
        'Must be a registered student of the university.',
        'Must have paid the current semester\'s tuition fees in full.',
        'Must not be under any active academic suspension.',
        'Must have a valid student ID card for verification.',
        'International students are eligible for all university-wide elections.',
      ],
    },
    {
      icon: Vote,
      title: 'Voting Process',
      items: [
        'Voting is conducted electronically through the student portal.',
        'Each student gets one vote per position in an election.',
        'Votes are cast anonymously and encrypted end-to-end.',
        'Once submitted, a vote cannot be changed or retracted.',
        'A confirmation transaction hash is generated for each vote.',
        'Voting closes at exactly 5:00 PM on the specified end date.',
      ],
    },
    {
      icon: CheckCircle2,
      title: 'Code of Conduct',
      items: [
        'No intimidation or coercion of voters is permitted.',
        'Campaigning within 50 meters of polling stations is prohibited.',
        'Sharing of voting credentials with others is strictly forbidden.',
        'Voters must cast their own vote and not allow others to vote on their behalf.',
        'Any form of vote buying or selling will result in immediate disqualification.',
        'Respect the privacy of other voters\' choices.',
      ],
    },
    {
      icon: AlertCircle,
      title: 'Appeals Process',
      items: [
        'Election results may be contested within 48 hours of announcement.',
        'Appeals must be submitted in writing to the Dean of Students office.',
        'The Electoral Commission will review all appeals within 5 working days.',
        'A 3-member panel will adjudicate disputed elections.',
        'The panel\'s decision is final and binding on all parties.',
        'Evidence must be provided to support any claims of irregularities.',
      ],
    },
    {
      icon: Calendar,
      title: 'Important Dates',
      items: [
        'Voter registration opens 3 weeks before election day.',
        'Voter registration closes 1 week before election day.',
        'Campaign period begins 2 weeks before election day.',
        'Campaign period ends 24 hours before voting opens.',
        'Voting period: 7:00 AM to 5:00 PM on election day(s).',
        'Results announced within 24 hours of voting closing.',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {rules.map((section, index) => {
        const Icon = section.icon;
        return (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ku-navy/10 dark:bg-ku-navy/30">
                    <Icon className="h-5 w-5 text-ku-navy" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ku-gold" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// ──────────────────── Loading Skeleton ────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-96 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ──────────────────── Main Page ────────────────────

export default function ElectionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('current');

  const {
    data: activeElections,
    isLoading: loadingActive,
    error: errorActive,
  } = useQuery({
    queryKey: ['elections', 'ACTIVE'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Election[]>>('/elections', {
        params: { status: 'ACTIVE' },
      });
      return res.data;
    },
  });

  const {
    data: upcomingElections,
    isLoading: loadingUpcoming,
    error: errorUpcoming,
  } = useQuery({
    queryKey: ['elections', 'UPCOMING'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Election[]>>('/elections', {
        params: { status: 'UPCOMING' },
      });
      return res.data;
    },
  });

  const {
    data: pastElections,
    isLoading: loadingPast,
    error: errorPast,
  } = useQuery({
    queryKey: ['elections', 'COMPLETED', 'CANCELLED'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Election[]>>('/elections', {
        params: { status: 'COMPLETED,CANCELLED' },
      });
      return res.data;
    },
  });

  const TabBadge = ({ count }: { count: number }) => (
    <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px] font-medium">
      {count}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ku-navy/10 dark:bg-ku-navy/30">
            <Vote className="h-5 w-5 text-ku-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Student Elections</h1>
            <p className="text-sm text-muted-foreground">
              Participate in university elections and view results
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap h-auto justify-start gap-1 bg-transparent p-0">
          {[
            { value: 'current', label: 'Current Elections', icon: Vote },
            { value: 'upcoming', label: 'Upcoming', icon: Clock },
            { value: 'past', label: 'Past Elections', icon: BarChart3 },
            { value: 'results', label: 'Results', icon: Trophy },
            { value: 'history', label: 'Vote History', icon: History },
            { value: 'rules', label: 'Rules', icon: ScrollText },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Current Elections */}
        <TabsContent value="current" className="mt-6">
          <AnimatePresence mode="wait">
            {loadingActive ? (
              <LoadingSkeleton key="loading" />
            ) : errorActive ? (
              <EmptyState
                key="error"
                icon={AlertCircle}
                title="Failed to load elections"
                description="There was an error fetching current elections. Please refresh the page."
              />
            ) : !activeElections || activeElections.length === 0 ? (
              <EmptyState
                key="empty"
                icon={CheckCircle2}
                title="No active elections"
                description="There are no active elections at the moment. Check the upcoming tab for scheduled elections."
              />
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {activeElections.map((election) => (
                  <ElectionCard key={election.id} election={election} variant="default" />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Upcoming Elections */}
        <TabsContent value="upcoming" className="mt-6">
          <AnimatePresence mode="wait">
            {loadingUpcoming ? (
              <LoadingSkeleton key="loading" />
            ) : errorUpcoming ? (
              <EmptyState
                key="error"
                icon={AlertCircle}
                title="Failed to load elections"
                description="There was an error fetching upcoming elections."
              />
            ) : !upcomingElections || upcomingElections.length === 0 ? (
              <EmptyState
                key="empty"
                icon={Calendar}
                title="No upcoming elections"
                description="There are no upcoming elections scheduled at this time."
              />
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {upcomingElections.map((election) => (
                  <ElectionCard key={election.id} election={election} variant="upcoming" />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Past Elections */}
        <TabsContent value="past" className="mt-6">
          <AnimatePresence mode="wait">
            {loadingPast ? (
              <LoadingSkeleton key="loading" />
            ) : errorPast ? (
              <EmptyState
                key="error"
                icon={AlertCircle}
                title="Failed to load elections"
                description="There was an error fetching past elections."
              />
            ) : !pastElections || pastElections.length === 0 ? (
              <EmptyState
                key="empty"
                icon={BarChart3}
                title="No past elections"
                description="Past election records will appear here once elections have been completed."
              />
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {pastElections.map((election) => (
                  <ElectionCard key={election.id} election={election} variant="past" />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Results */}
        <TabsContent value="results" className="mt-6">
          <ResultsTabContent />
        </TabsContent>

        {/* Vote History */}
        <TabsContent value="history" className="mt-6">
          <VoteHistoryTabContent />
        </TabsContent>

        {/* Rules */}
        <TabsContent value="rules" className="mt-6">
          <RulesTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
