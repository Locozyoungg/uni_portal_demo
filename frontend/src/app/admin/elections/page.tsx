'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Vote,
  Search,
  Plus,
  Eye,
  EyeOff,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  UserPlus,
  Trophy,
  ToggleLeft,
  ToggleRight,
  FileBarChart,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn, formatDate, formatDateTime } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

interface Election {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate: string;
  isVisible: boolean;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  candidates?: Candidate[];
  totalVotes?: number;
  voterTurnout?: number;
  createdAt: string;
}

interface Candidate {
  id: string;
  name: string;
  position?: string;
  manifesto?: string;
  voteCount?: number;
  photoUrl?: string;
}

interface ElectionResponse {
  success: boolean;
  data: Election[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ElectionResults {
  success: boolean;
  data: {
    election: Election;
    candidates: Candidate[];
    totalVotes: number;
    voterTurnout: number;
  };
}

// ── Validation Schemas ─────────────────────────────────────────────────────

const electionFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  type: z.string().min(1, 'Election type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

type ElectionFormData = z.infer<typeof electionFormSchema>;

const candidateSchema = z.object({
  name: z.string().min(2, 'Candidate name is required'),
  position: z.string().optional(),
  manifesto: z.string().optional(),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Status Badge Helper ────────────────────────────────────────────────────

function ElectionStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    UPCOMING: { label: 'Upcoming', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    COMPLETED: { label: 'Completed', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  };
  const c = config[status] || config.UPCOMING;
  return (
    <Badge variant="outline" className={cn('border', c.className)}>
      {c.label}
    </Badge>
  );
}

// ── Create/Edit Election Dialog ───────────────────────────────────────────

function ElectionFormDialog({
  open,
  onOpenChange,
  election,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  election?: Election | null;
  onSubmit: (data: ElectionFormData) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ElectionFormData>({
    resolver: zodResolver(electionFormSchema),
    defaultValues: election
      ? {
          title: election.title,
          description: election.description || '',
          type: election.type,
          startDate: election.startDate?.slice(0, 16) || '',
          endDate: election.endDate?.slice(0, 16) || '',
        }
      : {
          title: '',
          description: '',
          type: 'STUDENT_COUNCIL',
          startDate: '',
          endDate: '',
        },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Vote className="h-5 w-5 text-emerald-400" />
            {election ? 'Edit Election' : 'Create New Election'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {election ? `Editing "${election.title}"` : 'Set up a new election for student voting'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Election Title *</label>
            <Input
              {...register('title')}
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              placeholder="Student Council Elections 2024"
            />
            {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Election description and instructions..."
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Election Type *</label>
            <select
              {...register('type')}
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="STUDENT_COUNCIL">Student Council</option>
              <option value="CLASS_REPRESENTATIVE">Class Representative</option>
              <option value="CLUB_LEADERSHIP">Club Leadership</option>
              <option value="REFERENDUM">Referendum</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Start Date *</label>
              <Input
                {...register('startDate')}
                type="datetime-local"
                className="border-slate-700 bg-slate-800 text-white"
              />
              {errors.startDate && <p className="text-xs text-red-400">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">End Date *</label>
              <Input
                {...register('endDate')}
                type="datetime-local"
                className="border-slate-700 bg-slate-800 text-white"
              />
              {errors.endDate && <p className="text-xs text-red-400">{errors.endDate.message}</p>}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : election ? 'Update Election' : 'Create Election'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Candidate Dialog ───────────────────────────────────────────────────

function CandidateDialog({
  open,
  onOpenChange,
  electionTitle,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  electionTitle: string;
  onSubmit: (data: CandidateFormData) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: { name: '', position: '', manifesto: '' },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-400" />
            Add Candidate
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Adding candidate to: {electionTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Candidate Name *</label>
            <Input
              {...register('name')}
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              placeholder="John Doe"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Position</label>
            <Input
              {...register('position')}
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              placeholder="President"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Manifesto</label>
            <textarea
              {...register('manifesto')}
              rows={4}
              className="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Candidate manifesto or statement..."
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
              ) : 'Add Candidate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Results Dialog ─────────────────────────────────────────────────────────

function ResultsDialog({
  open,
  onOpenChange,
  electionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  electionId: string | null;
}) {
  const { data, isLoading } = useQuery<ElectionResults>({
    queryKey: ['admin-election-results', electionId],
    queryFn: () => api.get(`/admin/elections/${electionId}/results`).then((res) => res.data),
    enabled: !!electionId,
  });

  const results = data?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-800 text-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-emerald-400" />
            Election Results
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {results?.election?.title || 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-slate-800" />
            ))}
          </div>
        ) : results ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                <p className="text-2xl font-bold text-white">{results.totalVotes}</p>
                <p className="text-xs text-slate-400">Total Votes</p>
              </div>
              <div className="rounded-lg bg-slate-800/50 p-3 text-center">
                <p className="text-2xl font-bold text-white">{results.voterTurnout}%</p>
                <p className="text-xs text-slate-400">Voter Turnout</p>
              </div>
            </div>

            {/* Candidates ranked */}
            {results.candidates
              .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
              .map((candidate, idx) => {
                const maxVotes = Math.max(...results.candidates.map((c) => c.voteCount || 0));
                const percentage = maxVotes > 0 ? ((candidate.voteCount || 0) / results.totalVotes) * 100 : 0;
                return (
                  <div key={candidate.id} className="rounded-lg bg-slate-800/30 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <Trophy className="h-4 w-4 text-amber-400" />}
                        <span className="text-sm font-medium text-white">{candidate.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{candidate.voteCount || 0}</span>
                        <span className="text-xs text-slate-500">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          idx === 0 ? 'bg-emerald-500' : 'bg-slate-500'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500">No results available</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function AdminElectionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [resultsElectionId, setResultsElectionId] = useState<string | null>(null);

  // ── Data Fetching ──────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery<ElectionResponse>({
    queryKey: ['admin-elections', page, search, activeTab],
    queryFn: () =>
      api
        .get('/admin/elections', {
          params: {
            page,
            limit: 15,
            search: search || undefined,
            status: activeTab !== 'all' ? activeTab : undefined,
          },
        })
        .then((res) => res.data),
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (formData: ElectionFormData) => api.post('/admin/elections', formData),
    onSuccess: () => {
      toast.success('Election created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-elections'] });
      setFormDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create election');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: formData }: { id: string; data: ElectionFormData }) =>
      api.put(`/admin/elections/${id}`, formData),
    onSuccess: () => {
      toast.success('Election updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-elections'] });
      setFormDialogOpen(false);
      setSelectedElection(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update election');
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      api.patch(`/admin/elections/${id}/toggle`, { isVisible }),
    onSuccess: (_, variables) => {
      toast.success(`Election ${variables.isVisible ? 'hidden' : 'shown'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-elections'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to toggle visibility');
    },
  });

  const addCandidateMutation = useMutation({
    mutationFn: ({ electionId, data: formData }: { electionId: string; data: CandidateFormData }) =>
      api.post(`/admin/elections/${electionId}/candidates`, formData),
    onSuccess: () => {
      toast.success('Candidate added successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-elections'] });
      setCandidateDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add candidate');
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleCreate = () => {
    setSelectedElection(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (election: Election) => {
    setSelectedElection(election);
    setFormDialogOpen(true);
  };

  const handleToggleVisibility = (election: Election) => {
    toggleVisibilityMutation.mutate({ id: election.id, isVisible: !election.isVisible });
  };

  const handleAddCandidate = (election: Election) => {
    setSelectedElection(election);
    setCandidateDialogOpen(true);
  };

  const handleViewResults = (election: Election) => {
    setResultsElectionId(election.id);
    setResultsDialogOpen(true);
  };

  const handleFormSubmit = (formData: ElectionFormData) => {
    if (selectedElection) {
      updateMutation.mutate({ id: selectedElection.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCandidateSubmit = (formData: CandidateFormData) => {
    if (selectedElection) {
      addCandidateMutation.mutate({ electionId: selectedElection.id, data: formData });
    }
  };

  const elections = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalElections = data?.total || 0;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isCandidateAdding = addCandidateMutation.isPending;

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-4 w-32 bg-slate-800" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-slate-800" />
        ))}
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-red-500/10 p-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">Failed to load elections</h3>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
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
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Elections Management</h1>
            <p className="text-sm text-slate-400 mt-1">{totalElections} total elections</p>
          </div>
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Election
          </Button>
        </div>
      </motion.div>

      {/* Tabs & Search */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search elections..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }} className="mt-3">
              <TabsList className="bg-slate-800 border border-slate-700">
                <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">All</TabsTrigger>
                <TabsTrigger value="ACTIVE" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">Active</TabsTrigger>
                <TabsTrigger value="UPCOMING" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">Upcoming</TabsTrigger>
                <TabsTrigger value="COMPLETED" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Elections Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-0">
            {elections.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-medium">Title</TableHead>
                      <TableHead className="text-slate-400 font-medium">Type</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden md:table-cell">Period</TableHead>
                      <TableHead className="text-slate-400 font-medium">Status</TableHead>
                      <TableHead className="text-slate-400 font-medium">Visible</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden sm:table-cell">Candidates</TableHead>
                      <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {elections.map((election, idx) => (
                      <motion.tr
                        key={election.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-slate-800 hover:bg-slate-800/50"
                      >
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-white">{election.title}</p>
                            {election.description && (
                              <p className="text-xs text-slate-500 line-clamp-1">{election.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                            {election.type.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(election.startDate)}</span>
                            <span>-</span>
                            <span>{formatDate(election.endDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ElectionStatusBadge status={election.status} />
                        </TableCell>
                        <TableCell>
                          {election.isVisible ? (
                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                              <Eye className="h-3 w-3 mr-1" />
                              Visible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-600 text-slate-500">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Hidden
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-slate-300">
                            {election.candidates?.length || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                              onClick={() => handleToggleVisibility(election)}
                              title={election.isVisible ? 'Hide election' : 'Show election'}
                            >
                              {election.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                              onClick={() => handleEdit(election)}
                              title="Edit election"
                            >
                              <span className="text-xs font-medium">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                              onClick={() => handleAddCandidate(election)}
                              title="Add candidate"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                            {(election.status === 'COMPLETED' || election.status === 'ACTIVE') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => handleViewResults(election)}
                                title="View results"
                              >
                                <BarChart3 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-slate-800">
                  <p className="text-sm text-slate-500">
                    Page {page} of {totalPages} ({totalElections} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                      const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      if (pageNum > totalPages) return null;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className={
                            pageNum === page
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
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <Vote className="h-12 w-12 text-slate-700 mb-3" />
                <h3 className="text-lg font-medium text-slate-300">No elections found</h3>
                <p className="text-sm text-slate-500 mt-1">Create your first election to get started</p>
                <Button onClick={handleCreate} className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Election
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <ElectionFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => { setFormDialogOpen(open); if (!open) setSelectedElection(null); }}
        election={selectedElection}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <CandidateDialog
        open={candidateDialogOpen}
        onOpenChange={(open) => { setCandidateDialogOpen(open); if (!open) setSelectedElection(null); }}
        electionTitle={selectedElection?.title || ''}
        onSubmit={handleCandidateSubmit}
        isSubmitting={isCandidateAdding}
      />

      <ResultsDialog
        open={resultsDialogOpen}
        onOpenChange={setResultsDialogOpen}
        electionId={resultsElectionId}
      />
    </motion.div>
  );
}
